---
title: "ActivityContext 빌드 과정 심층 분석"
subheadline: 메커니즘
mermaid: true
---

Aspectran 애플리케이션의 핵심 IoC/DI 컨테이너인 [`ActivityContext`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/context/ActivityContext.java)는 런타임에 직접 생성되지 않고, 전용 빌더인 [`ActivityContextBuilder`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/context/builder/ActivityContextBuilder.java)의 체계적이고 엄격한 파이프라인을 거쳐 조립됩니다.

빌드 과정은 단순한 설정 파싱을 넘어, **전용 클래스로더 격리, 환경 프로필 해석, XML/APON/어노테이션 하이브리드 파싱, 빈 참조 무결성 검사([`BeanReferenceInspector`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/context/rule/validation/BeanReferenceInspector.java)), AOP 프록시 사전 분석([`BeanRuleAnalyzer`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/component/bean/BeanRuleAnalyzer.java)), 애스펙트 유효성 검증([`AspectRuleValidator`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/context/rule/validation/AspectRuleValidator.java)), 그리고 실시간 리로딩 감시 타이머 결속**에 이르는 종합 엔지니어링 프로세스입니다.

전체 빌드 프로세스는 [`HybridActivityContextBuilder`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/context/builder/HybridActivityContextBuilder.java) 클래스가 총괄합니다.

## 1. 엔드투엔드 빌드 파이프라인 아키텍처

`ActivityContext`의 빌드는 5개의 명확한 단계(Phases)로 나뉘어 순차 진행됩니다.

```mermaid
sequenceDiagram
    autonumber
    participant Svc as CoreService / Host App
    participant Builder as HybridActivityContextBuilder
    participant Loader as SiblingClassLoader
    participant Context as RuleParsingContext
    participant Parser as HybridActivityContextRuleParser
    participant Validator as BeanReferenceInspector & AspectRuleValidator
    participant AC as DefaultActivityContext

    Svc->>Builder: build() 호출

    rect rgba(0, 122, 255, 0.15)
    Note over Builder,Loader: 1단계: 인프라 프로비저닝
    Builder->>Loader: createSiblingClassLoader() (격리 클래스로더 생성)
    Builder->>Builder: createEnvironmentProfiles() (활성 프로필 결정)
    Builder->>Context: new RuleParsingContext(classLoader, adapter, profiles)
    end

    rect rgba(40, 167, 69, 0.15)
    Note over Builder,Parser: 2단계: 선언적 규칙 파싱 & 컴포넌트 스캔
    Builder->>Context: beanRuleRegistry.scanConfigurableBeans(basePackages)
    Builder->>Parser: parse(contextRules / parameters)
    Parser->>Context: BeanRule, AspectRule, TransletRule 등록
    Parser-->>Builder: 감시 대상 파일 목록(appendedRuleFiles) 수집
    end

    rect rgba(245, 158, 11, 0.15)
    Note over Builder,Validator: 3단계: 정적 분석 & 엄격한 유효성 검증
    Builder->>Validator: beanReferenceInspector.inspect(beanRuleRegistry)
    Note over Validator: 빈 참조 정합성 검사 및 순환 의존성(Circular Dependency) 방지
    Builder->>Validator: BeanRuleAnalyzer.determineProxyBean() (AOP 프록시 사전 결정)
    Builder->>Validator: aspectRuleValidator.validate(ruleParsingContext)
    end

    rect rgba(239, 68, 68, 0.15)
    Note over Builder,AC: 4단계: 컨텍스트 조립 & 인스턴스화
    Builder->>AC: new DefaultActivityContext(...)
    Builder->>AC: setEnvironment(ActivityEnvironment)
    Builder->>AC: 레지스트리 5종 및 TemplateRenderer 주입
    end

    rect rgba(139, 92, 246, 0.15)
    Note over Builder,Svc: 5단계: 초기화 & 라이프사이클 결속
    alt MasterService 존재 시 (표준 런타임)
        Builder->>Builder: startContextReloadingTimer(appendedRuleFiles)
        Builder-->>Svc: ActivityContext 반환 (서비스 doStart에서 initialize 호출)
    else Standalone 환경
        Builder->>AC: component.initialize() 즉시 실행
        Builder->>Builder: registerDestroyTask() (JVM ShutdownHook 등록)
        Builder-->>Svc: 초기화 완료된 ActivityContext 반환
    end
    end
```

## 2. 1단계: 빌더 설정 및 인프라 프로비저닝

빌드 파이프라인의 첫 번째 단계는 컨텍스트가 구동될 물리적 자원과 런타임 환경을 격리하고 초기화하는 것입니다.

### 1) 클래스로더 분리 ([`createSiblingClassLoader`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/context/builder/AbstractActivityContextBuilder.java#L396))
- 외부 호스트 애플리케이션의 시스템 클래스로더와 분리된 전용 [`SiblingClassLoader`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/context/resource/SiblingClassLoader.java)를 생성합니다.
- `<resourceLocations>`로 지정된 외부 디렉토리나 JAR 파일 경로를 클래스패스에 동적으로 추가하며, 핫 리로딩 시 클래스로더 단위의 안전한 폐기 및 재생성을 가능하게 합니다.

### 2) 환경 프로필 확정 ([`createEnvironmentProfiles`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/context/builder/AbstractActivityContextBuilder.java#L430))
- 시스템 프로퍼티, 환경 변수, 설정 파일에 지정된 활성 프로필(`activeProfiles`)과 기본 프로필(`defaultProfiles`)을 평가하여 [`EnvironmentProfiles`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/context/env/EnvironmentProfiles.java) 객체를 생성합니다.
- 이후 파싱되는 모든 컴포넌트와 프로퍼티는 이 프로필 조건에 부합할 때만 활성화됩니다.

### 3) 파싱 컨텍스트 초기화 ([`RuleParsingContext`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/context/rule/parsing/RuleParsingContext.java))
- 파싱 과정에서 생성되는 임시 규칙 객체(`*Rule`)들을 보관하고 상호 관계를 결속하는 전용 파싱 세션 객체인 `RuleParsingContext`를 인스턴스화하고 준비(`prepare()`)합니다.

## 3. 2단계: 선언적 규칙 파싱 및 컴포넌트 스캔

이 단계에서는 다양한 소스(자바 어노테이션, XML, APON)로부터 컴포넌트 메타데이터를 수집하여 규칙 객체 트리로 변환합니다.

### 1) 어노테이션 컴포넌트 스캔
- `basePackages`에 지정된 패키지 경로를 스캔하여 `@Component`, `@Bean`, `@Aspect`, `@Service`, `@Controller` 등의 어노테이션이 선언된 클래스를 탐색합니다.
- 탐색된 클래스는 파서에 의해 즉시 동등한 [`BeanRule`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/context/rule/BeanRule.java) 및 [`AspectRule`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/context/rule/AspectRule.java)로 변환되어 `RuleParsingContext`에 등록됩니다.

### 2) XML / APON 하이브리드 파싱 ([`HybridActivityContextRuleParser`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/context/rule/parser/HybridActivityContextRuleParser.java))
- 파일 확장자와 설정에 따라 적합한 파서를 자동 선택하여 구동합니다:
  - XML 기반 설정: [`XmlActivityContextParser`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/context/rule/parser/xml/XmlActivityContextParser.java) (Nodelet 기반 고속 XML 파서)
  - APON 기반 설정: [`AponActivityContextParser`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/context/rule/parser/apon/AponActivityContextParser.java) (Aspectran 독자 경량 객체 표기법 파서)
- 파싱 도중 `<append file="..." />`을 통해 추가로 임포트되는 외부 설정 파일들은 [`RuleFileAppendedListener`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/context/builder/HybridActivityContextBuilder.java#L173)를 통해 실시간으로 수집되어 자동 리로딩 감시 목록(`appendedRuleFiles`)에 등록됩니다.

## 4. 3단계: 정적 분석 및 엄격한 유효성 검증 (Validation)

메모리에 로드된 모든 선언 규칙이 런타임에 문제를 일으키지 않도록 사전에 철저한 정적 분석과 검증을 수행합니다.

### 1) 사후 처리 (`BeanRuleRegistry.postProcess`)
- 별칭(Alias) 등록, 부모 빈 상속 구조 해결, 자동 주입 후보 플래그 설정 등 빈 규칙의 누락된 메타데이터를 보정합니다.

### 2) 빈 참조 무결성 및 순환 의존성 검사 ([`BeanReferenceInspector`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/context/rule/validation/BeanReferenceInspector.java))
- 생성자 주입, 필드 주입, 프로퍼티 설정에 명시된 참조 빈 ID와 타입이 실제로 존재하는지 확인합니다.
- 부모 서비스가 존재하는 경우 상위 컨텍스트의 빈 레지스트리까지 연계하여 조회를 검증합니다.
- **순환 참조(Circular Dependency) 방지**: 빈과 빈 사이의 직접적인 생성자 순환 참조 고리를 추적하여 발견 즉시 명확한 오류를 발생시킴으로써 런타임 데드락이나 스택오버플로우를 원천 방지합니다.

### 3) AOP 프록시 필요 여부 사전 결정 ([`BeanRuleAnalyzer.determineProxyBean`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/component/bean/BeanRuleAnalyzer.java))
- 등록된 모든 `AspectRule`의 포인트컷 표현식을 전체 빈의 메서드 시그니처와 대조 분석합니다.
- 어떤 빈이 AOP 어드바이스의 적용 대상(Advisable)인지를 부트스트랩 시점에 미리 판별하여 해당 `BeanRule`에 프록시 생성 플래그를 마킹합니다. 런타임에 매 호출마다 AOP 대상 여부를 판단하는 오버헤드를 완전히 제거합니다.

### 4) 애스펙트 유효성 검증 ([`AspectRuleValidator.validate`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/context/rule/validation/AspectRuleValidator.java))
- 애스펙트 규칙에 지정된 어드바이스 빈과 어드바이스 메서드가 실제로 존재하는지, 메서드의 파라미터 시그니처가 어드바이스 규격에 맞는지 철저히 검증합니다.

## 5. 4단계: `ActivityContext` 조립 및 인스턴스화

검증이 완료된 규칙 객체들을 실질적인 서비스 레지스트리 인스턴스로 변환하여 [`DefaultActivityContext`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/context/DefaultActivityContext.java)에 조립합니다.

```mermaid
graph LR
    RPC[RuleParsingContext<br/>파싱 및 검증 완료] --> Build{AbstractActivityContextBuilder<br/>createActivityContext}

    Build --> AC[DefaultActivityContext]
    Build --> ENV[ActivityEnvironment]
    Build --> BR[DefaultBeanRegistry]
    Build --> AR[AspectRuleRegistry]
    Build --> SR[ScheduleRuleRegistry]
    Build --> TR[DefaultTemplateRenderer]
    Build --> TLR[TransletRuleRegistry]
    Build --> ATE[SimpleAsyncTaskExecutor]

    ENV --> AC
    BR --> AC
    AR --> AC
    SR --> AC
    TR --> AC
    TLR --> AC
    ATE --> AC
```

1. **`DefaultActivityContext` 생성**: 클래스로더, 애플리케이션 어댑터, 마스터 서비스 참조를 전달하여 컨텍스트 골격을 생성합니다.
2. **`ActivityEnvironment` 생성**: 활성 프로필과 선언된 `<properties>`를 취합하고, 시스템 환경 변수 및 암호화 속성을 치환 평가하여 주입합니다.
3. **5대 서브시스템 레지스트리 조립**:
   - `DefaultBeanRegistry`: `BeanRuleRegistry`의 메타데이터를 기반으로 빈 인스턴스화 풀 생성
   - `AspectRuleRegistry`: 사전 컴파일된 포인트컷 규칙 인덱스 전달
   - `ScheduleRuleRegistry`: 스케줄 작업 규칙 전달
   - `DefaultTemplateRenderer`: 템플릿 규칙 레지스트리 전달
   - `TransletRuleRegistry`: 트랜슬릿 라우팅 트리 전달
4. **비동기 태스크 실행기 구성**: `contextConfig.asyncConfig.enabled` 설정이 활성화된 경우, 전용 스레드 풀을 갖춘 [`SimpleAsyncTaskExecutor`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/component/bean/async/SimpleAsyncTaskExecutor.java)를 생성하여 주입합니다.

## 6. 5단계: 초기화 및 라이프사이클 결속

조립된 컨텍스트는 호스트 환경의 구동 방식에 따라 차별화된 초기화 및 생명주기 관리 절차를 밟습니다.

### 1) 마스터 서비스 연동 환경 (표준 웹, 데몬, 셸 등)
- 컨텍스트 빌더는 아직 `ActivityContext.initialize()`를 직접 호출하지 않고 조립된 컨텍스트 객체를 마스터 서비스([`DefaultCoreService`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/service/DefaultCoreService.java))로 반환합니다.
- 마스터 서비스의 `doStart()` 라이프사이클 훅에서 `component.initialize()`가 호출되며, 싱글톤 빈 인스턴스화 및 의존성 주입이 일괄 진행됩니다.
- **자동 리로딩 타이머 가동**: 파싱 과정에서 수집된 모든 설정 파일 목록(`appendedRuleFiles`)을 감시 대상에 등록하고 [`ContextReloadingTimer`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/context/builder/reload/ContextReloadingTimer.java)를 시작합니다.

### 2) 단독(Standalone) 빌더 구동 환경
- 마스터 서비스 없이 빌더가 단독으로 사용된 경우(테스트 코드 또는 독립 유틸리티):
  - 빌더가 즉시 `((Component)activityContext).initialize()`를 호출하여 컨텍스트를 완전 활성화합니다.
  - JVM 종료 시 컨텍스트가 안전하게 소멸될 수 있도록 [`ShutdownHook.Manager`](https://github.com/aspectran/aspectran/blob/master/utils/src/main/java/com/aspectran/utils/ShutdownHook.java)를 통해 프로세스 종료 훅을 등록합니다.

> 🔍 **관련 세부 메커니즘**
> - 빌드된 컨텍스트가 런타임에 동작하는 상세 구조는 [ActivityContext: Aspectran 컨테이너의 심장부](/ko/docs/mechanisms/activity-context/) 문서를 참고하십시오.
> - 파일 변경 감지 시 컨텍스트를 무중단으로 재빌드하는 원리는 [Aspectran 자동 리로딩 메커니즘](/ko/docs/mechanisms/aspectran-reloading-mechanism/) 문서를 참고하십시오.
> - 환경 프로필 및 프로퍼티 치환 규칙은 [ActivityEnvironment 아키텍처](/ko/docs/mechanisms/activity-environment/) 문서를 참고하십시오.

## 7. 다음 단계: 세부 메커니즘 탐색

컨텍스트의 동적 환경 설정(프로필, 시스템 프로퍼티 치환, 암호화 변수)을 관장하는 상세 메커니즘은 [ActivityEnvironment 아키텍처](/ko/docs/mechanisms/activity-environment/) 문서에서 확인할 수 있습니다.

전체 메커니즘 및 패키지 명세의 유기적 연결 관계를 확인하려면 **[Aspectran 세부 메커니즘 색인](/ko/docs/mechanisms/)**을 확인하십시오.
