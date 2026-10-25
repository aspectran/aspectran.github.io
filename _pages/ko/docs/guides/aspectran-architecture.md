---
title: Aspectran 아키텍처
teaser: 통합 아키텍처 청사진 (Full-Text Blueprint)
subheadline: 아키텍처
---

{% include image.liquid src="/images/docs/architecture_ko.svg" alt="Aspectran 아키텍처의 통합" %}

## 1. 서론

### 1.1. Aspectran 프레임워크 개요
Aspectran은 JVM 기반의 경량·고성능 애플리케이션 프레임워크로, 단순한 명령줄 도구(CLI)부터 대규모 트래픽을 처리하는 비동기 마이크로서비스 및 전통적인 엔터프라이즈 웹 애플리케이션에 이르기까지 폭넓은 영역을 아우를 수 있도록 설계되었습니다. 

본 문서는 Aspectran의 최상위 시스템 아키텍처 청사진(Architecture Blueprint)을 제시합니다. 개별 컴포넌트의 지엽적인 기능 설명에 머무르지 않고, 프레임워크의 계층별 구성 요소들이 어떻게 유기적으로 결합되어 요청을 처리하고 환경 독립성을 확보하는지 전체적인 조망과 엔드투엔드(End-to-End) 실행 모델을 설명합니다.

### 1.2. 핵심 설계 철학 및 원칙
Aspectran 아키텍처를 관통하는 핵심 설계 원칙은 다음과 같습니다:

*   **POJO(Plain Old Java Object) 중심**: 특정 프레임워크 인터페이스에 비즈니스 코드가 오염되지 않도록 보장합니다. 개발자는 순수 Java 객체로 비즈니스 로직을 구현하고, 프레임워크는 선언적 규칙을 통해 이를 조합합니다.
*   **IoC(Inversion of Control) 및 DI(Dependency Injection)**: 객체의 생성, 구성, 생명주기를 프레임워크 엔진이 제어하며, 필드, 생성자, 메서드 주입을 통해 모듈 간 결합도를 최소화하고 단위 테스트 용이성을 극대화합니다.
*   **AOP(Aspect-Oriented Programming)의 유기적 통합**: 횡단 관심사(보안, 트랜잭션, 로깅, 프로파일링 등)를 핵심 비즈니스 로직과 물리적으로 분리합니다. 런타임 동적 프록시를 통해 어드바이스를 지능적으로 위빙(Weaving)합니다.
*   **완벽한 환경 추상화 (Environment Abstraction)**: 어댑터(Adapter) 패턴을 전면 도입하여 웹, 비서블릿 네트워크 서버, 콘솔 셸, 백그라운드 데몬 등 실행 환경의 기술적 차이를 완벽히 격리합니다. 비즈니스 로직은 자신이 구동되는 환경을 알 필요가 없습니다.
*   **마이크로 모듈러 구조와 다변화된 런타임**: 최소한의 코어 모듈 위에 필요한 기능(서블릿, Netty, Undertow, Jetty, 세션 스토어 등)만을 플러그인 형태로 조립하여 가볍고 빠른 실행 환경을 제공합니다.

### 1.3. 계층형 시스템 아키텍처 모델
Aspectran의 전체 시스템은 명확한 책임을 가진 5개의 논리적 계층으로 구성됩니다:

1.  **서비스 & 런타임 진입 계층 (Service & Server Runtimes)**: 외부 요청의 진입점 역할을 하며, 구동 환경의 생명주기를 주관합니다. (Servlet, Netty, Undertow, Jetty, Shell, Daemon, Embed)
2.  **환경 추상화 계층 (Environment Abstraction - Adapters)**: 런타임별 입출력 기술(`HttpServletRequest`, Netty 채널, Undertow `HttpServerExchange`, Console Stream 등)을 Aspectran 표준 인터페이스로 변환합니다.
3.  **실행 엔진 계층 (Execution Engine - Activities & Translets)**: 개별 요청 처리의 흐름을 통제하고 비즈니스 액션과 트랜슬릿 규칙을 실행하며 결과를 취합합니다.
4.  **코어 컨테이너 계층 (Core Container - Context & Rules)**: `ActivityContext`를 심장부로 하여 Bean 생명주기, AOP 규칙, 트랜슬릿 설계도, 시스템 환경 설정을 총괄 관리합니다.
5.  **하부 인프라 계층 (Infrastructure & Utilities)**: `SiblingClassLoader`(동적 리로딩), `nodelet`(경량 파싱), 보안 암호화(PBE), 로깅(SLF4J/Logback) 등 프레임워크 전반을 지탱하는 기반 유틸리티 세트입니다.

## 2. 서비스 아키텍처와 다양한 실행 환경

### 2.1. 서비스 컨테이너의 기반: `CoreService`

Aspectran에서 서비스(`Service`)는 프레임워크 엔진의 수명주기를 관리하고 특정 실행 환경에 대한 컨테이너 역할을 수행하는 핵심 단위입니다.

#### 2.1.1. 최상위 추상화: `CoreService`와 `DefaultCoreService`
`com.aspectran.core.service` 패키지의 `CoreService` 인터페이스는 모든 Aspectran 서비스의 최상위 계약입니다.

*   **역할**: 서비스의 시작(`start`), 중지(`stop`), 일시정지(`pause`), 재개(`resume`) 등 전체 생명주기(`ServiceLifeCycle`)를 통제합니다. 또한 모든 컴포넌트의 집합체인 `ActivityContext`를 생성하고 초기화하는 표준 부트스트래퍼(Bootstrapper)입니다.
*   **표준 구현**: `DefaultCoreService`는 구성 파일(`AspectranConfig`)을 로드하고, `ActivityContextBuilder`를 통해 컨텍스트를 빌드하며, 인스턴스 중복 방지를 위한 싱글톤 락(`FileLocker`) 및 JVM 종료 훅(`ShutdownHook`)을 등록합니다.
*   **서비스 레지스트리**: 기동된 모든 서비스는 전역 `CoreServiceHolder`에 안전하게 등록되어 어디서든 해당 컨텍스트와 서비스 인스턴스를 룩업할 수 있습니다.

#### 2.1.2. 기능 확장 모듈: `SchedulerService`
`SchedulerService`는 부모 서비스(`CoreService`)의 생명주기에 종속되어 동작하는 자식 서비스(Sub-service)입니다.

*   **스케줄링 추상화**: Aspectran 설정 파일에 선언된 `ScheduleRule`을 읽어 Quartz 스케줄러를 백그라운드에서 구동합니다.
*   **실행 연동**: 스케줄 주기가 도래하면 Quartz Job인 `ActivityLauncherJob`이 작동하여 스케줄 전용 실행 객체인 `JobActivity`를 실행합니다.
*   **분산 락 지원**: 다중 노드 클러스터 환경에서 중복 실행을 막기 위해 `ScheduledJobLockProvider`를 통한 정밀한 작업 잠금을 제공합니다.

### 2.2. 다양한 실행 환경(Runtime Environments) 분석

Aspectran은 단일 코어 엔진 위에 세분화된 모듈 구조를 채택하여 용도와 인프라 요구에 가장 적합한 런타임을 유연하게 선택할 수 있습니다.

#### 2.2.1. 웹 환경의 현대적 분리: `aspectran-web` vs `aspectran-web-servlet`
Aspectran의 웹 지원 아키텍처는 순수 웹 추상화와 서블릿 스펙 종속 계층으로 명확히 이원화되어 있습니다:

*   **순수 웹 공통 추상화 계층 (`aspectran-web`)**:
    *   서블릿 API(`jakarta.servlet.*`)에 전혀 의존하지 않는 순수 웹 기술 모듈입니다.
    *   HTTP 요청 파싱 및 파라미터 바인딩(`WebRequestBodyParser`, `RequestHeaderParser`), 다국어 처리(`AcceptHeaderLocaleResolver`), 표준 REST 응답 캡슐화(`RestResponse`, `ResponsePayload`), CORS 처리기(`DefaultCorsProcessor`) 등 모든 웹 기반 환경의 공통 인프라를 제공합니다.
*   **표준 서블릿 통합 계층 (`aspectran-web-servlet`)**:
    *   표준 Java Servlet/Jakarta Servlet 스펙 환경(Tomcat, Jetty, 외부 WAS 배포 등)과 Aspectran을 결합하는 전용 모듈입니다.
    *   **주요 진입점**: 서블릿 수명주기 리스너인 `WebServiceListener`, HTTP 요청 라우팅 서블릿인 `WebActivityServlet`.
    *   **핵심 컴포넌트**: `ServletWebService` (구현체 `DefaultServletWebService`), 서블릿 요청 처리자 `ServletWebActivity`, 서블릿 요청 래퍼 `ActivityRequestWrapper`.

#### 2.2.2. 비서블릿 고성능 네트워크 엔진: Netty 환경 (`with-netty`)
현대적인 고성능 마이크로서비스 및 비동기 이벤트 기반 통신을 위한 서블릿-프리(Servlet-Free) 런타임입니다.

*   **목적**: 서블릿 컨테이너의 부하를 걷어내고, Netty의 고성능 논블로킹 I/O(NIO) 파이프라인 위에서 Aspectran의 Translet 처리 엔진을 직결하여 최소한의 메모리와 초저지연(Ultra-low latency) 환경을 제공합니다. Java Virtual Threads와의 연동에도 최적화되어 있습니다.
*   **주요 진입점 및 컴포넌트**:
    *   `NettyServer` (구현체 `DefaultNettyServer`): Netty의 `ServerBootstrap`과 채널 파이프라인을 부트스트랩합니다.
    *   `NettyService` (구현체 `DefaultNettyService`): Netty 서버와 연동되는 특화된 `CoreService`.
    *   `NettyActivity`: Netty 인바운드 HTTP 요청을 처리하는 전용 `Activity`.

#### 2.2.3. 경량 임베디드 웹 서버 환경: Undertow (`with-undertow`)
고성능 경량 웹 서버인 JBoss Undertow 기반의 실행 환경입니다.

*   **목적**: 블로킹과 논블로킹 핸들러 체인을 유연하게 조합할 수 있는 고성능 임베디드 웹 환경을 구축합니다.
*   **주요 구성 요소**:
    *   `TowService` (구현체 `DefaultTowService`): Undertow 런타임을 총괄하는 서비스.
    *   `TowActivity`: Undertow의 네이티브 교환 객체인 `HttpServerExchange`를 직접 래핑하여 초고속으로 요청을 디스패치하는 `Activity`.

#### 2.2.4. 임베디드 서블릿 웹 서버 환경: Jetty (`with-jetty`)
표준 서블릿 컨테이너를 애플리케이션 내에 임베딩하여 가볍고 친숙하게 구동하는 환경입니다.

*   **목적**: 임베디드 서블릿 서버인 Eclipse Jetty를 부트스트랩하여, 서블릿 표준 호환성을 유지하면서도 단독 실행형(Fat JAR) 웹 서비스를 구축합니다.
*   **주요 컴포넌트**: `JettyServer`를 통해 `ServletContextHandler`를 구성하고 `WebServiceListener`를 바인딩하여 기동합니다.

#### 2.2.5. 대화형 콘솔(CLI) 환경: Shell (`aspectran-shell`)
터미널 콘솔을 통해 사용자와 상호작용하는 대화형 명령줄 인터페이스 환경입니다.

*   **주요 진입점**: `AspectranShell`의 `main()` 메서드. 내부적으로 `DefaultShellCommander`를 통해 콘솔 수명주기를 통제합니다.
*   **주요 구성 요소**:
    *   `ShellService` (구현체 `DefaultShellService`)
    *   `ShellActivity`: 터미널 명령어 인자와 표준 입출력 스트림을 매핑하는 `Activity`.
    *   `ShellConsole`: JLine 터미널 및 기본 콘솔 I/O를 제어하는 추상화 계층.

#### 2.2.6. 백그라운드 프로세스 환경: Daemon (`aspectran-daemon`)
사용자 인터페이스 없이 장기 실행되는 백그라운드 서버 프로세스 환경입니다.

*   **주요 진입점**: `DefaultDaemon`, `ProcrunDaemon` (Windows Service용), `JsvcDaemon` (Linux/Unix Daemon용).
*   **주요 구성 요소**:
    *   `DaemonService` (구현체 `DefaultDaemonService`)
    *   `DaemonActivity`
    *   `CommandExecutor`, `FileCommander`: 파일 감시나 폴링 큐를 통해 외부 제어 명령을 비동기로 수신하고 트랜슬릿을 트리거합니다.

#### 2.2.7. 애플리케이션 내장 환경: Embed (`aspectran-embed`)
기존 Java 애플리케이션이나 단위 테스트 코드 내에 Aspectran의 엔진을 라이브러리로 임베딩하는 환경입니다.

*   **핵심 컴포넌트**:
    *   `EmbeddedAspectran` (구현체 `DefaultEmbeddedAspectran`): 간결한 퍼사드(Facade) API를 제공하여 `translate()`, `render()`, `getBean()` 등을 손쉽게 호출할 수 있도록 지원합니다.
    *   `AspectranActivity`: 프로그래밍적 호출을 위한 전용 경량 `Activity`.

> **관련 세부 메커니즘**: 서비스 수명주기와 부트스트랩 과정 및 각 환경별 진입점의 상세한 내부 구현은 [Aspectran 서비스 아키텍처 심층 분석](/ko/docs/mechanisms/aspectran-services/)과 [Aspectran 실행 환경 심층 분석](/ko/docs/mechanisms/aspectran-execution-environments/)을 참조하십시오.

## 3. 환경 추상화: Adapter 아키텍처

Aspectran 아키텍처의 가장 독창적인 강점 중 하나는 **어댑터(Adapter) 패턴의 전면적인 도입**입니다. 어댑터는 다양한 런타임 환경의 고유한 입출력 및 세션 메커니즘을 추상화하여 비즈니스 로직(Translet 및 Bean)을 실행 환경으로부터 완전히 분리합니다.

### 3.1. 핵심 계약 인터페이스: `com.aspectran.core.adapter`
Aspectran의 핵심 실행 엔진은 `com.aspectran.core.adapter` 패키지에 정의된 4대 핵심 계약 인터페이스에만 의존합니다:

*   `ApplicationAdapter`: 애플리케이션의 루트 경로, 클래스로더, 애플리케이션 스코프 속성(Attributes) 등 실행 환경의 기반 정보를 추상화합니다.
*   `RequestAdapter`: 외부 요청 데이터를 추상화합니다. 파라미터, 헤더, 속성, 본문 스트림, 업로드 파일 등 요청과 관련된 모든 정보를 표준 방식으로 제공합니다.
*   `ResponseAdapter`: 요청에 대한 응답 출력을 추상화합니다. 문자열을 쓰는 `Writer`, 바이너리를 출력하는 `OutputStream`, 인코딩 및 응답 헤더 제어 기능을 통합 제공합니다.
*   `SessionAdapter`: 상태를 유지할 수 있는 사용자 세션 환경을 추상화합니다. 웹의 `HttpSession`뿐 아니라 콘솔 셸이나 데몬에서도 동일한 세션 메커니즘을 사용할 수 있도록 일반화되었습니다.

### 3.2. 환경별 실제 구현 어댑터 매핑
런타임 환경별로 4대 계약 인터페이스가 어떻게 대칭적으로 구현되어 있는지 완벽한 매핑을 제공합니다:

| 실행 환경 | 모듈 및 패키지 | RequestAdapter | ResponseAdapter | SessionAdapter |
| :--- | :--- | :--- | :--- | :--- |
| **Servlet Web** | `aspectran-web-servlet`<br>`com.aspectran.web.servlet.adapter` | `HttpServletRequestAdapter` | `HttpServletResponseAdapter` | `HttpSessionAdapter` |
| **Netty** | `with-netty`<br>`com.aspectran.netty.adapter` | `NettyRequestAdapter` | `NettyResponseAdapter` | `NettySessionAdapter` |
| **Undertow** | `with-undertow`<br>`com.aspectran.undertow.adapter` | `TowRequestAdapter` | `TowResponseAdapter` | `TowSessionAdapter` |
| **Shell (CLI)** | `aspectran-shell`<br>`com.aspectran.shell.adapter` | `ShellRequestAdapter` | `ShellResponseAdapter` | `ShellSessionAdapter` |
| **Daemon** | `aspectran-daemon`<br>`com.aspectran.daemon.adapter` | `DaemonRequestAdapter` | `DaemonResponseAdapter` | `DaemonSessionAdapter` |
| **Embedded** | `aspectran-embed`<br>`com.aspectran.embed.adapter` | `AspectranRequestAdapter` | `AspectranResponseAdapter` | `AspectranSessionAdapter` |
| **Scheduler** | `aspectran-core`<br>`com.aspectran.core.scheduler.adapter` | `QuartzJobRequestAdapter` | `QuartzJobResponseAdapter` | *(무상태)* |

### 3.3. Adapter 아키텍처의 핵심 가치
1.  **궁극의 비즈니스 코드 재사용성**: 동일하게 작성된 비즈니스 액션과 트랜슬릿 로직을 단 한 줄의 코드 수정 없이 서블릿 웹 서버, Netty 고성능 서버, CLI 콘솔, 백그라운드 스케줄러에서 그대로 구동할 수 있습니다.
2.  **격리된 테스트 환경 제공**: 외부 서블릿 컨테이너나 네트워크 소켓을 띄우지 않고도 메모리 기반의 `AspectranRequestAdapter`와 `AspectranResponseAdapter`를 사용하여 완벽한 단위 테스트를 순식간에 수행할 수 있습니다.
3.  **새로운 런타임 수용의 유연성**: gRPC, RSocket 등 새로운 네트워크 프로토콜이 등장하더라도, 4대 어댑터 계약만 구현하면 기존 Aspectran의 방대한 자산을 즉시 연동할 수 있습니다.

> **관련 세부 메커니즘**: 어댑터 객체의 생명주기와 `adapt()` 호출 메커니즘, 각 환경별 내부 변환 로직에 대한 상세 내용은 [Adapter 아키텍처: 환경 독립성의 핵심](/ko/docs/mechanisms/aspectran-adapters/)을 참조하십시오.

## 4. 핵심 컨테이너 및 룰 파이프라인

### 4.1. IoC/DI 컨테이너: `ActivityContext`
`ActivityContext`는 Aspectran 애플리케이션의 **심장부(Central Hub)**이자 핵심 IoC 컨테이너입니다.

*   **컴포넌트 레지스트리 총괄**:
    *   `BeanRegistry`: 싱글톤 및 프로토타입 빈의 의존성 주입과 생명주기 관리.
    *   `AspectRuleRegistry`: AOP 포인트컷 매칭 및 어드바이스 규칙 저장소.
    *   `TransletRuleRegistry`: URL 및 요청 패턴에 매핑된 트랜슬릿 실행 정의서 저장소.
    *   `ScheduleRuleRegistry`, `TemplateRuleRegistry`: 작업 스케줄 및 템플릿 규칙 관리.
*   **빌드 파이프라인 (`HybridActivityContextBuilder`)**:
    1.  **설정 구성 (Configuration)**: 설정 파일 경로, 컴포넌트 스캔 대상 패키지, 활성 프로필(`ActiveProfiles`) 지정.
    2.  **선언적 파싱 (Parsing)**: `HybridActivityContextRuleParser`를 통해 XML/APON 설정 파일을 읽어 순수 POJO 형태의 `Rule` 객체들로 변환.
    3.  **검증 및 생성 (Creation & Validation)**: 빈 순환 참조 검사(`BeanReferenceInspector`) 및 AOP 규칙 유효성 검증(`AspectRuleValidator`)을 거쳐 `DefaultActivityContext` 인스턴스화.
    4.  **초기화 (Initialization)**: 모든 Eager-init 싱글톤 빈 인스턴스화 및 의존성 주입 완료. 설정에 따라 `ContextReloadingTimer`를 통한 파일 감시 기반 핫 리로딩 활성화.

### 4.2. 설정 로딩 엔진: `nodelet` (`com.aspectran.utils.nodelet`)
Aspectran은 XML 파싱의 메모리 및 성능 오버헤드를 극복하기 위해 독자적인 경량 스트리밍 파서인 **`nodelet`**을 사용합니다:

*   **XPath 기반 콜백 매핑**: 무거운 DOM 트리를 메모리에 올리지 않고, SAX 이벤트 스트림 위에서 특정 XPath에 람다식 콜백(`Nodelet`)을 등록하여 초고속으로 `Rule` 객체에 데이터를 채웁니다.
*   **동적 마운트(`mount`) 기능**: XML 구조가 중첩될 때 하위 규칙 세트(`NodeletGroup`)를 동적으로 연결 및 재사용함으로써 파서 객체 생성을 최소화하고 무한한 중첩 확장을 지원합니다.

### 4.3. 설정 규칙 아키텍처 (`com.aspectran.core.context.rule`)
프레임워크의 모든 동작 설계도는 `Rule`이라 불리는 순수 데이터 객체(POJO)들로 표현됩니다:

*   **최상위 엔터티 규칙**: `TransletRule`, `BeanRule`, `AspectRule`, `ScheduleRule`, `TemplateRule`.
*   **실행 및 제어 규칙**: `InvokeActionRule`, `TransformRule`, `DispatchRule`.
*   **능력 인터페이스 (`com.aspectran.core.context.rule.ability`)**: `HasActionRules`, `HasResponseRules` 등의 계약 인터페이스를 통해 복합 규칙을 타입-세이프하게 조립합니다.

> **관련 세부 메커니즘**: `ActivityContext`의 4단계 빌드 세부 알고리즘은 [ActivityContext 빌드 과정: 심층 분석](/ko/docs/mechanisms/activity-context-building/) 및 [ActivityContext: Aspectran의 심장부](/ko/docs/mechanisms/activity-context/)를, XML/APON 스트리밍 파싱의 고급 활용법은 [Aspectran 구성 로딩 메커니즘](/ko/docs/mechanisms/aspectran-loading-mechanism/)과 [Aspectran 설정 규칙 아키텍처 심층 분석](/ko/docs/mechanisms/aspectran-rule-architecture/)을 참조하십시오.

## 5. 실행 엔진과 엔드투엔드 요청 처리 파이프라인

### 5.1. Activity 실행 모델
단일 요청이 유입되어 완료될 때까지의 전 과정을 제어하는 실행 엔진입니다:

*   `Activity`: 단일 요청-응답 수명주기의 중앙 실행자입니다. `ThreadLocal` 기반 격리를 통해 멀티스레드 환경에서 안전하게 요청 상태와 어댑터를 바인딩합니다.
*   `Translet`: 프레임워크 내부 처리 엔진과 사용자 비즈니스 코드 사이의 **소통 매개체이자 공용 API**입니다. 요청 파라미터, 속성, 액션 실행 결과, 세션 접근을 일원화합니다.
*   **특화된 Activity 변형**:
    *   `CoreActivity`: Translet 규칙 파이프라인을 완전히 수행하는 기본 액티비티.
    *   `InstantActivity`: 사용자 비즈니스 코드 내에서 경량으로 Aspectran 컨텍스트를 즉시 실행할 때 사용.
    *   `JobActivity`: 스케줄러 작업 전용 액티비티.
    *   `ProxyActivity`: AOP 어드바이스 실행 전용 경량 액티비티.

### 5.2. Action 파이프라인과 결과 수집
Translet 내부의 처리 단계는 `Executable` 인터페이스를 구현한 액션들의 연속으로 이루어집니다:

*   **다양한 내장 액션**:
    *   `InvokeAction`: 등록된 Bean의 메서드를 리플렉션/프록시로 호출.
    *   `MethodAction`: 선언된 메서드 실행 및 인자 바인딩.
    *   `IncludeAction`: 다른 Translet을 서브루틴처럼 포함하여 실행.
    *   `EchoAction`, `HeaderAction`, `ChooseAction` 등.
*   **계층적 결과 수집 구조 (`com.aspectran.core.activity.process.result`)**:
    *   `ActionResult`: 단일 액션의 실행 반환값 캡슐화.
    *   `ContentResult`: 액션 그룹(`<contents>`)의 결과 모음.
    *   `ProcessResult`: 단일 액티비티 전체 실행 결과 컨테이너. 후속 뷰 렌더링이나 REST 변환기의 데이터 소스로 직결됩니다.

### 5.3. 응답 처리 및 뷰 전략
`com.aspectran.core.activity.response` 패키지는 유연한 응답 전략을 제공합니다:

*   **뷰 디스패치 (`DispatchResponse`)**: `ViewDispatcher` 인터페이스를 통해 JSP, Thymeleaf, FreeMarker, Pebble 등의 뷰 템플릿 엔진으로 데이터를 전달하고 HTML을 렌더링합니다.
*   **데이터 변환 (`TransformResponse`)**: `ProcessResult` 데이터를 기반으로 표준 데이터 포맷으로 자동 직렬화합니다.
    *   `JsonTransformResponse`: 고성능 JSON 변환.
    *   `AponTransformResponse`: Aspectran 고유의 APON 포맷 변환.
    *   `XmlTransformResponse`, `TextTransformResponse` 등.
*   **REST 전용 응답 (`RestResponse`)**: HTTP 응답 상태 코드, 전용 헤더, 페이로드(`ResponsePayload`)를 세밀하게 제어하는 RESTful 아키텍처 전용 응답 처리기.

### 5.4. 엔드투엔드(End-to-End) 요청 처리 흐름
외부 요청이 시스템에 도달하여 응답으로 나갈 때까지 컴포넌트 간의 상호작용 순서는 다음과 같습니다:

1.  **요청 진입**: 클라이언트 요청이 실행 환경(서블릿 컨테이너의 `WebActivityServlet`, Netty 채널 핸들러, Undertow 핸들러, 셸 콘솔 등)에 도달합니다.
2.  **어댑터 래핑**: 런타임 특화 입출력 객체를 기반으로 표준 `RequestAdapter`, `ResponseAdapter`, `SessionAdapter`를 인스턴스화합니다.
3.  **Activity 인스턴스화**: 서비스가 해당 요청에 대한 `Activity`를 생성하고, 어댑터를 주입한 후 현재 스레드(`ThreadLocal`)에 바인딩합니다.
4.  **Translet 규칙 매칭**: 요청 URI 및 메서드에 일치하는 `TransletRule`을 `TransletRuleRegistry`에서 조회합니다.
5.  **AOP Before Advice 실행**: 매칭된 트랜슬릿에 적용할 AOP Before 어드바이스가 있다면 프록시 엔진을 통해 먼저 수행합니다.
6.  **Action 체인 실행**: 선언된 `ActionList`에 따라 비즈니스 메서드를 호출하고 반환값을 `ProcessResult`에 누적합니다.
7.  **응답 생성**: `DispatchResponse`(뷰 렌더링) 또는 `TransformResponse`(JSON/XML 변환)를 실행하여 `ResponseAdapter`의 출력 스트림에 데이터를 씁니다.
8.  **AOP After/Finally Advice 실행 및 정리**: After/Finally 어드바이스를 수행하고, 트랜잭션 커밋/롤백, 세션 갱신, `ThreadLocal` 정리 및 로깅 그룹 컨텍스트를 안전하게 해제합니다.

> **관련 세부 메커니즘**: 요청 처리 실행 엔진의 내부 상태 머신과 트랜슬릿 처리 파이프라인은 [Activity 아키텍처: 요청 처리의 실행 엔진](/ko/docs/mechanisms/aspectran-activities/), [Aspectran Actions: 개념, 종류 및 처리 결과](/ko/docs/mechanisms/aspectran-actions/), 그리고 [요청(Request) 및 응답(Response) 처리 메커니즘](/ko/docs/mechanisms/aspectran-request-response/)을 참조하십시오.

## 6. 고급 시스템 서비스

### 6.1. 고성능 동적 AOP 프록시 메커니즘
Aspectran의 AOP는 불필요한 프록시 오버헤드를 근본적으로 차단하는 지능형 구조를 가집니다:

*   `AbstractBeanProxy`: Javassist 또는 JDK 다이내믹 프록시 기반의 기반 클래스입니다.
*   **어노테이션 기반 타겟팅 최적화**: 메서드 호출 시 `@Advisable` 또는 `@Async`가 부여된 메서드에 대해서만 포인트컷 레지스트리를 룩업하므로, 일반 내부 메서드 호출에 발생하는 성능 저하가 전혀 없습니다.
*   `ProxyActivity`: 비동기(`@Async`) 스레드 풀 환경이나 독립 어드바이스 수행 시 컨텍스트를 스레드 안전하게 전달하는 경량 실행자입니다.

### 6.2. 환경 독립적 세션 관리자 (`com.aspectran.core.component.session`)
서블릿 컨테이너에 종속되지 않고 Netty, Undertow, Shell 등 모든 환경에서 일관된 상태 관리를 제공하는 고성능 분산 세션 엔진입니다:

*   **핵심 구성 요소**: 세션 생명주기를 총괄하는 `SessionManager`, 메모리 캐시인 `SessionCache`, 영속 저장소인 `SessionStore`, 만료 세션을 자동 수거하는 `HouseKeeper`.
*   **Redis 기반 클러스터링**: Lettuce 드라이버 기반의 `LettuceSessionStore`를 통해 무중단 분산 클러스터링을 완벽하게 지원합니다.
*   **세분화된 영속화 제어**: `NonPersistent` 마커 인터페이스, `NonPersistentValue` 래퍼, `nonPersistentAttributes` 설정을 통해 민감 정보나 직렬화 불필요 객체의 영속화를 선택적으로 차단할 수 있습니다.

### 6.3. 동적 핫 리로딩 클래스로더: `SiblingClassLoader`
JVM 재시작 없이 클래스와 리소스를 즉각 다시 로드할 수 있는 독자적인 클래스로더 구조를 제공합니다:

*   **형제 우선(Sibling-First) 위임 모델**: Java 표준의 부모 우선(Parent-First) 모델과 달리, 자신과 형제 `SiblingClassLoader`의 리소스 경로를 먼저 탐색한 후 부모에게 위임합니다.
*   **모듈 격리와 핫 리로딩**: 특정 모듈이나 리소스가 변경되면 해당 `SiblingClassLoader`만을 선택적으로 폐기하고 재생성(`reload()`)하여 전체 프로세스를 중단시키지 않고도 무중단 핫 리로딩을 달성합니다.

### 6.4. 멀티 엔진 로깅 그룹(Logging Group) 아키텍처
Aspectran은 SLF4J 및 Logback과 결합하여, 요청 URI 경로나 서비스 그룹별로 로그 파일을 동적으로 분리 기록하는 고유한 로깅 아키텍처를 제공합니다:

*   `LoggingGroupDiscriminator`: Logback `SiftingAppender`와 연동되어 SLF4J MDC 및 컨텍스트에 설정된 로깅 그룹 식별자를 실시간으로 분별합니다.
*   **다중 서버 엔진별 경로 기반 핸들러 일관성**:
    *   **Netty 환경**: `com.aspectran.netty.server.handler.logging.PathBasedLoggingGroupHandler`
    *   **Jetty 환경**: `com.aspectran.jetty.server.handler.PathBasedLoggingGroupHandler`
    *   **Undertow 환경**: `com.aspectran.undertow.server.handler.logging.PathBasedLoggingGroupHandlerWrapper` (및 `PathBasedLoggingGroupHandler`)
*   **효과**: 단일 서버 인스턴스 내에서 여러 애플리케이션이나 특정 API 경로군(예: `/petclinic/**`, `/jpetstore/**`)별로 각각 독립된 로그 파일에 트래픽 로그를 물리적으로 분리 기록할 수 있습니다.

> **관련 세부 메커니즘**: AOP 프록시 생성 및 바인딩 원리는 [Aspectran AOP 프록시 메커니즘](/ko/docs/mechanisms/new-aop-proxy-mechanism/)을, 동적 클래스 로딩과 무중단 핫 리로딩은 [SiblingClassLoader 심층 분석](/ko/docs/mechanisms/aspectran-classloader/) 및 [Aspectran 자동 리로딩 메커니즘 심층 분석](/ko/docs/mechanisms/aspectran-reloading-mechanism/)을, 다중 환경 로깅 분리 기법은 [Aspectran 로깅 메커니즘](/ko/docs/mechanisms/aspectran-logging-mechanism/)을 참조하십시오.

## 7. 결론

Aspectran의 아키텍처는 **단순성, 환경 독립성, 그리고 고성능**이라는 세 가지 기둥 위에 확고히 서 있습니다.

*   `CoreService`와 `ActivityContext`를 구심점으로 하는 명확한 계층 분리를 통해 복잡한 엔터프라이즈 기능들을 일관된 패턴으로 통제합니다.
*   `Adapter` 패턴을 통해 비즈니스 로직을 실행 환경의 물리적 기술로부터 완전히 격리시킴으로써, 동일한 소스 코드가 Servlet 컨테이너, Netty 비동기 서버, Undertow, Jetty, 콘솔 셸, 데몬 어디에서든 한 치의 오차 없이 재사용될 수 있는 독보적인 이식성을 달성했습니다.
*   최신 트렌드에 발맞추어 `aspectran-web`과 `aspectran-web-servlet`의 책임을 명확히 가르고, 비서블릿 네트워크 엔진인 Netty의 공식 통합 및 다중 엔진 로깅 그룹 지원을 완성함으로써, 전통적인 웹 시스템은 물론 차세대 고성능 마이크로서비스 아키텍처까지 완벽히 소화해내는 유연하고 견고한 프레임워크로 지속 진화하고 있습니다.

## 8. 다음 단계: 세부 메커니즘 및 패키지 명세 탐색

본 청사진 문서는 Aspectran의 상위 아키텍처 구조와 컴포넌트 간 유기적 결합 방식을 조망했습니다. 각 컴포넌트의 소스 코드 수준 내부 구현 알고리즘, 세부 메커니즘 명세, 그리고 각 모듈 패키지별 상세 명세는 공식 색인 페이지를 통해 탐색하실 수 있습니다:

*   **[Aspectran 세부 메커니즘 및 패키지 명세 색인](/ko/docs/mechanisms/)**: 실행 엔진, 빌드 파이프라인, 클래스로더, AOP 프록시 등 15개 이상의 심층 분석 문서와 코어, 데몬, 쉘, 임베디드, 세션, 웹 등 주요 모듈 패키지의 기술 명세를 제공합니다.
*   **[Aspectran 사용자 가이드](/ko/docs/guides/aspectran-user-guide/)**: 프레임워크를 사용하여 실제 애플리케이션을 개발하고 구성하는 종합 실무 가이드입니다.
