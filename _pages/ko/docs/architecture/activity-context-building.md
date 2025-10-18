---
title: "ActivityContext 빌드 과정: 심층 분석"
subheadline: 아키텍처
---

Aspectran 애플리케이션의 심장부인 `ActivityContext`는 `ActivityContextBuilder`에 의해 체계적인 단계를 거쳐 생성됩니다. 이 빌드 과정은 크게 **설정, 파싱, 생성, 초기화**의 4단계로 이루어지며, 전체 프로세스는 `com.aspectran.core.context.builder.HybridActivityContextBuilder` 클래스가 주도합니다.

## 1. 빌더 생성 및 설정 (Builder Creation & Configuration)

모든 것은 `ActivityContextBuilder`의 인스턴스를 생성하는 것에서 시작됩니다. 빌더가 생성된 후, 개발자는 다양한 `setter` 메서드를 통해 컨텍스트를 구성하는 데 필요한 핵심 정보들을 제공합니다.

-   **`setBasePath(String basePath)`**: 애플리케이션의 루트 디렉토리를 지정합니다. 상대 경로의 기준점이 됩니다.
-   **`setContextRules(String[] contextRules)`**: Aspectran의 핵심 설정 파일(XML 또는 APON 형식)의 경로를 배열로 전달합니다. 여러 개의 설정 파일을 모듈처럼 나누어 관리할 수 있습니다.
-   **`setBasePackages(String... basePackages)`**: 어노테이션 기반의 컴포넌트 스캔을 사용할 패키지를 지정합니다. 빌더는 이 패키지들 하위에서 `@Component`, `@Bean`, `@Aspect` 등의 어노테이션을 찾아 자동으로 규칙을 생성합니다.
-   **`setActiveProfiles(String... activeProfiles)`**: 애플리케이션의 실행 환경 프로필(예: `dev`, `prod`)을 지정합니다. 여기에 지정된 프로필과 일치하는 설정만 활성화됩니다.
-   **`setResourceLocations(String... resourceLocations)`**: 클래스패스에 포함될 리소스 경로를 동적으로 추가할 수 있습니다.
-   **`setAponWriter(AponWriter aponWriter)`**: 파싱된 규칙을 APON 형식으로 출력하여 디버깅할 때 사용됩니다.

## 2. 빌드 실행 및 파싱 (Build & Parsing)

설정이 완료되면, `build()` 메서드를 호출하여 실제 빌드 프로세스를 시작합니다. 이 단계의 실질적인 작업은 `com.aspectran.core.context.rule.parser.HybridActivityContextRuleParser`가 담당합니다.

1.  **파서 초기화**: `HybridActivityContextRuleParser`는 `RuleParsingContext`라는 핵심 헬퍼 객체를 내부적으로 생성합니다. `RuleParsingContext`는 파싱된 모든 규칙(`*Rule` 객체)을 임시로 보관하고, 규칙 간의 관계를 설정하며, 최종적으로 레지스트리를 구성하는 역할을 합니다.

2.  **규칙 파싱**: 파서는 설정된 `contextRules`와 `basePackages`를 기반으로 작업을 수행합니다.
    *   **파일 기반 파싱**: `contextRules`에 명시된 설정 파일들을 순회하며, 파일 확장자에 따라 `XmlActivityContextParser` 또는 `AponActivityContextParser`를 사용하여 내용을 파싱합니다. 파싱된 결과물은 `AspectRule`, `BeanRule`, `TransletRule` 등 `com.aspectran.core.context.rule` 패키지에 정의된 규칙(Rule) 객체의 트리 형태로 변환됩니다.
    *   **어노테이션 기반 파싱**: `basePackages`에 명시된 패키지 경로를 스캔하여 `@Component`, `@Bean`, `@Aspect` 등의 어노테이션이 붙은 클래스를 찾습니다. `AnnotatedClassParser`는 이 클래스들을 분석하여 동등한 `BeanRule`과 `AspectRule` 객체를 생성합니다.

3.  **규칙 등록**: 생성된 모든 `*Rule` 객체들은 `RuleParsingContext`에 의해 적절한 내부 컬렉션에 추가됩니다. 이 시점까지는 규칙들이 메모리에 로드만 된 상태이며, 아직 실제 인스턴스가 생성되지는 않습니다.

## 3. 컨텍스트 생성 (Context Creation)

파싱된 규칙들을 바탕으로 실제 `ActivityContext` 인스턴스를 생성하는 단계입니다.

1.  **`DefaultActivityContext` 생성**: `createActivityContext()` 메서드가 `com.aspectran.core.context.DefaultActivityContext`의 인스턴스를 생성합니다.

2.  **레지스트리 주입**: `RuleParsingContext`가 임시 보관하던 모든 규칙들을 종류별로 분류하여 `AspectRuleRegistry`, `BeanRuleRegistry`, `TransletRuleRegistry` 등의 최종 레지스트리 객체로 만들어 `DefaultActivityContext`에 주입합니다.

3.  **유효성 검증 (Validation)**: 컨텍스트가 올바르게 동작할 수 있도록 규칙들의 유효성을 검사합니다.
    *   **`BeanReferenceInspector`**: `@Autowired`나 설정 파일에서 다른 빈을 참조하는 모든 관계를 추적하여, 존재하지 않는 빈을 참조하거나 순환 참조가 발생하는 등의 오류가 없는지 검사합니다.
    *   **`AspectRuleValidator`**: AOP 규칙이 유효한지, 예를 들어 어드바이스가 지정하는 빈과 메서드가 실제로 존재하는지 등을 검증합니다.

## 4. 초기화 및 완료 (Initialization & Completion)

생성된 컨텍스트를 애플리케이션이 사용할 수 있도록 최종 활성화하는 단계입니다.

1.  **`ActivityContext.initialize()` 호출**: 이 메서드가 호출되면 컨텍스트의 초기화가 시작됩니다.
    *   **싱글톤 빈 인스턴스화**: `BeanRegistry`에 등록된 모든 싱글톤(Singleton) 스코프의 빈들이 실제로 인스턴스화됩니다. 이 과정에서 생성자 주입이 일어나고, `@Autowired`가 붙은 필드와 메서드에 대한 의존성 주입이 완료됩니다.
    *   **초기화 콜백 실행**: `@Initialize` 어노테이션이나 `InitializableBean` 인터페이스를 구현한 빈들의 초기화 메서드가 호출됩니다.

2.  **자동 리로딩 활성화 (Optional)**: `autoReload` 설정이 활성화된 경우, `ContextReloadingTimer`가 시작됩니다. 이 타이머는 지정된 주기(`scanInterval`)마다 설정 파일의 변경 여부를 감시하고, 변경이 감지되면 `serviceLifeCycle.restart()`를 호출하여 위에서 설명한 빌드 과정을 처음부터 다시 수행합니다. 이를 통해 애플리케이션 재시작 없이 설정을 동적으로 반영할 수 있습니다.

3.  **컨텍스트 반환**: 모든 과정이 성공적으로 끝나면, 완전히 활성화된 `ActivityContext` 객체가 `build()` 메서드의 최종 반환 값으로 제공됩니다.