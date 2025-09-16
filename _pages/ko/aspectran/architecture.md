---
format: plate solid article
sidebar: toc-left
title: Aspectran 아키텍처
teaser: 통합 심층 분석 (Full-Text Version)
---

{% include image.liquid src="/images/docs/architecture_ko.svg" alt="Aspectran 아키텍처의 통합" %}

## 1. 서론

### 1.1. Aspectran 프레임워크 개요
Aspectran은 JVM 기반의 경량 고성능 프레임워크로, 단순한 명령줄 애플리케이션부터 복잡한 엔터프라이즈 웹 서비스에 이르기까지 다양한 유형의 애플리케이션을 효율적으로 구축할 수 있도록 설계되었습니다.

### 1.2. 핵심 설계 원칙
Aspectran의 아키텍처는 다음과 같은 핵심 설계 원칙을 기반으로 합니다:
*   **POJO 중심**: 프레임워크의 복잡성을 숨기고 비즈니스 로직에 집중할 수 있도록 일반 Java 객체(POJO)를 적극 활용합니다.
*   **IoC (Inversion of Control) 및 DI (Dependency Injection)**: 객체의 생성 및 생명주기 관리를 프레임워크가 담당하며, 의존성을 자동으로 주입하여 모듈성과 테스트 용이성을 높입니다.
*   **AOP (Aspect-Oriented Programming)**: 횡단 관심사(cross-cutting concerns)를 비즈니스 로직과 분리하여 코드의 응집도를 높이고 재사용성을 극대화합니다.
*   **환경 추상화 (Environment Abstraction)**: 어댑터 패턴을 통해 다양한 실행 환경(웹, 셸, 데몬 등)의 차이를 추상화하여 동일한 비즈니스 로직이 환경에 독립적으로 실행될 수 있도록 합니다.
*   **모듈화 및 확장성**: 기능별로 세분화된 모듈과 계층형 아키텍처를 통해 유연한 확장과 커스터마이징을 지원합니다.

---

## 2. 최상위 아키텍처: 서비스와 실행 환경

### 2.1. Aspectran 서비스 아키텍처

Aspectran의 서비스(`Service`)는 프레임워크의 생명주기를 관리하고, 특정 실행 환경의 진입점 역할을 하는 핵심 컨테이너입니다. 어떤 환경(웹, 셸, 데몬 등)에서 애플리케이션을 구동할지에 따라 적합한 서비스 구현체가 사용됩니다. 이 서비스 아키텍처는 계층적이고 모듈화된 구조를 통해 높은 유연성과 확장성을 제공합니다.

#### 2.1.1. 모든 서비스의 기반: `CoreService`

`com.aspectran.core.service` 패키지에 위치한 `CoreService`는 모든 Aspectran 서비스의 근간을 이루는 최상위 추상화입니다.

-   **역할**: `CoreService`는 서비스의 시작, 중지, 재시작 등 전체 생명주기(`ServiceLifeCycle`)를 관리하고, Aspectran의 모든 설정과 컴포넌트(Bean, Translet, Aspect 등)를 담고 있는 `ActivityContext`를 생성하고 초기화하는 **표준 부트스트래퍼(Bootstrapper)**입니다.
-   **구현**: `DefaultCoreService`는 `CoreService`의 표준 구현체로, 설정 파일을 파싱하고 `ActivityContext`를 빌드하는 모든 핵심 로직을 포함합니다.
-   **관계**: 앞으로 설명할 모든 환경별 특화 서비스들은 이 `DefaultCoreService`를 직접 상속받거나, 내부에 포함하여 그 기능을 확장하는 방식으로 구현됩니다. 즉, 모든 서비스는 `CoreService`의 핵심 메커니즘을 공유합니다.

#### 2.1.2. 기능 확장 모듈: `SchedulerService`

`SchedulerService`는 Aspectran의 모듈화된 아키텍처를 잘 보여주는 예시입니다. 이는 독립적인 서비스가 아니라, `CoreService`에 **스케줄링 기능**을 추가하는 **자식 서비스(Sub-service)**입니다.

-   **동작 방식**: 부모 서비스(`CoreService`)의 생명주기에 종속되어 함께 시작되고 종료됩니다.
-   **추상화**: Aspectran 설정 파일에 정의된 스케줄 규칙(`ScheduleRule`)을 읽어 Quartz 스케줄러를 자동으로 설정하고 실행합니다. 개발자는 복잡한 Quartz API를 직접 다룰 필요 없이, Aspectran의 방식으로 스케줄링을 정의할 수 있습니다.
-   **컨텍스트 연동**: 스케줄된 작업이 실행될 때, `ActivityLauncherJob`을 통해 Aspectran의 `Activity`를 실행합니다. 덕분에 스케줄링된 작업 내에서도 다른 웹 요청이나 셸 커맨드와 동일하게 애플리케이션에 등록된 모든 Bean을 주입받거나 AOP Aspect를 적용받을 수 있습니다.

### 2.2. Aspectran의 실행 환경 분석

Aspectran은 핵심 서비스 및 활동 개념을 기반으로 구축된 특수 모듈을 제공하여 다양한 실행 환경을 지원하도록 고도로 적응 가능하게 설계되었습니다. 이러한 모듈성은 개발자가 장기 실행 백그라운드 프로세스, 대화형 명령줄 도구, 임베디드 라이브러리 또는 기존 웹 애플리케이션 등 특정 사용 사례에 가장 적합한 방식으로 Aspectran 애플리케이션을 배포할 수 있도록 합니다.

각 환경에 대한 분석은 다음과 같습니다.

#### 2.2.1. 데몬 환경 (`com.aspectran.daemon`)

*   **목적:** 직접적인 사용자 인터페이스나 웹 인터페이스 없이 Aspectran 애플리케이션을 장기 실행 백그라운드 프로세스로 실행합니다. 배치 처리, 예약된 작업(내장 스케줄러 서비스를 사용하지 않는 경우), 또는 내부 서비스 간 통신에 이상적입니다.
*   **주요 진입점:**
    *   `com.aspectran.daemon.DefaultDaemon` (및 `SimpleDaemon`): 명령줄에서 데몬을 부트스트랩하는 `main` 메서드를 제공합니다. Aspectran 구성을 로드하고 `DaemonService`를 시작하는 것을 처리합니다.
    *   `com.aspectran.daemon.Daemon`: `DaemonService` 및 명령 처리 기능에 대한 접근을 포함하여 Aspectran 데몬 프로세스에 대한 계약을 정의하는 핵심 인터페이스입니다.
*   **주요 구성 요소:**
    *   `DaemonService`: 데몬 작업에 특화된 `CoreService`로, 프로그래밍 방식의 `translate()` 호출을 허용합니다.
    *   `DaemonActivity`: 데몬의 내부 요청/응답 모델에 맞게 조정된 `Activity` 구현입니다.
    *   `CommandExecutor`, `CommandRegistry`, `FileCommander`: 관리 명령 및 폴링 기반 작업을 처리하기 위한 구성 요소입니다.
*   **특징:** 능동적(자체 작업을 시작), 백그라운드 실행, 강력한 생명주기 관리(JVM 종료 훅 포함), 상태 저장 백그라운드 작업을 위한 선택적 세션 지원.

#### 2.2.2. 임베디드 환경 (`com.aspectran.embed`)

*   **목적:** 기존 Java 애플리케이션(독립 실행형, 데스크톱 또는 다른 웹 프레임워크) 내에 Aspectran의 강력한 기능을 라이브러리 또는 구성 요소로 통합합니다. Aspectran의 내부 복잡성을 노출하지 않고 Aspectran과 상호 작용하기 위한 단순화된 퍼사드를 제공합니다.
*   **주요 진입점:**
    *   `com.aspectran.embed.service.EmbeddedAspectran`: 임베딩을 위한 기본 인터페이스입니다. 다양한 구성 소스(파일, 리더, `AspectranConfig`)에서 임베디드 Aspectran 인스턴스를 시작하기 위한 편리한 팩토리 메서드 역할을 하는 정적 `run()` 메서드를 제공합니다.
*   **주요 구성 요소:**
    *   `EmbeddedAspectran` (인터페이스): `translate()`, `render()`, `execute()`, `getBean()`, `getMessage()`와 같은 메서드를 제공하는 `CoreService`에 대한 고수준 퍼사드입니다.
    *   `com.aspectran.embed.service.DefaultEmbeddedAspectran`: `EmbeddedAspectran`의 구체적인 구현으로, 내부적으로 `DefaultCoreService`를 관리합니다.
    *   `com.aspectran.embed.activity.AspectranActivity`: 임베디드 컨텍스트를 위한 `Activity` 구현으로, 프로그래밍 방식 호출을 Aspectran의 처리 파이프라인에 맞게 조정합니다.
*   **특징:** 퍼사드 패턴, 쉬운 부트스트래핑, 사용 사례 지향 API, 단순화된 인터페이스로 Aspectran의 모든 기능 제공, 선택적 세션 지원.

#### 2.2.3. 셸 환경 (`com.aspectran.shell`)

*   **목적:** Aspectran 애플리케이션을 위한 대화형 명령줄 인터페이스(CLI)를 제공합니다. 사용자가 터미널에서 직접 명령(트랜슬릿)을 실행하고 애플리케이션과 상호 작용할 수 있도록 합니다.
*   **주요 진입점:**
    *   `com.aspectran.shell.AspectranShell`: 대화형 셸을 부트스트랩하는 `main` 메서드를 포함합니다. `DefaultConsoleCommander`를 사용하여 셸의 생명주기를 관리합니다.
*   **주요 구성 요소:**
    *   `com.aspectran.shell.service.ShellService`: 셸 환경에 특화된 `CoreService`로, `ShellConsole`에 대한 접근 및 명령 실행을 위한 `translate()` 메서드를 제공합니다.
    *   `com.aspectran.shell.activity.ShellActivity`: 콘솔 입출력에 맞게 조정된 `Activity` 구현으로, 절차적 프롬프트 및 출력 리다이렉션과 같은 기능을 처리합니다.
    *   `ShellConsole`: 콘솔 상호 작용(입력 읽기, 출력 쓰기)을 위한 추상화입니다.
*   **특징:** 대화형, 명령줄 기반, 사용자 대면 기능(환영 메시지, 도움말, 상세 모드), 명령 간 상태 유지를 위한 선택적 세션 지원.

#### 2.2.4. 웹 환경 (`com.aspectran.web` 및 `com.aspectran.undertow`)

Aspectran은 두 가지 주요 모듈을 통해 웹 환경을 지원합니다. 하나는 일반 서블릿 컨테이너용이고 다른 하나는 Undertow 웹 서버용입니다.

*   **일반 서블릿 환경 (`com.aspectran.web`)**
    *   **목적:** 모든 표준 Java 서블릿 컨테이너(예: Tomcat, Jetty, WildFly) 내에서 Aspectran 애플리케이션을 실행합니다. Aspectran의 코어와 서블릿 API 간의 가교 역할을 합니다.
    *   **주요 진입점:** `com.aspectran.web.servlet.listener.WebServiceListener`, `com.aspectran.web.servlet.WebActivityServlet`
    *   **주요 구성 요소:** `WebService`, `WebActivity`, `DefaultServletHttpRequestHandler`
    *   **특징:** 반응형(HTTP 요청에 응답), 서블릿 API 기반, 모든 웹 기능 지원(세션, 인코딩, 멀티파트, 비동기), 전통적인 WAR 배포.

*   **Undertow 환경 (`com.aspectran.undertow`)**
    *   **목적:** 고성능의 임베디드 Undertow 웹 서버 위에 Aspectran 애플리케이션을 실행합니다. 이는 일반 웹 환경에 대한 서블릿 없는 대안을 제공하여 더 가볍고 잠재적으로 더 빠른 배포를 가능하게 합니다.
    *   **주요 진입점:** 프로그래밍 방식으로 Undertow를 임베딩하고 Aspectran의 `TowService`를 핸들러로 연결하여 시작됩니다.
    *   **주요 구성 요소:** `TowService`, `TowActivity`
    *   **특징:** 서블릿 없는 웹, 직접 Undertow API 상호 작용, 고성능, 재사용 가능한 웹 구성(`WebConfig`), 임베디드 웹 서버를 사용하여 경량 마이크로서비스를 구축하는 데 이상적입니다.

---

## 3. 환경 추상화: Adapter 아키텍처

Aspectran 프레임워크의 가장 강력한 아키텍처 특징 중 하나는 **어댑터(Adapter)**입니다. 어댑터는 런타임 환경(웹, 콘솔, 데몬 등)의 차이를 추상화하여, 동일한 비즈니스 로직이 어떤 환경에서든 수정 없이 실행될 수 있도록 하는 핵심적인 역할을 합니다.

### 3.1. 핵심 인터페이스: `com.aspectran.core.adapter`
이 패키지는 모든 어댑터가 반드시 구현해야 하는 **핵심 인터페이스**를 정의합니다. Aspectran의 핵심 엔진은 이 추상 인터페이스에만 의존하므로, 실제 실행 환경이 웹 서버인지, 콘솔인지, 혹은 다른 어떤 환경인지 전혀 알 필요가 없습니다.

*   `ApplicationAdapter`: 애플리케이션 전체의 생명주기와 환경(기반 경로, 클래스로더 등)을 추상화합니다.
*   `SessionAdapter`: 사용자의 세션을 추상화합니다. 웹 환경의 `HttpSession`에 해당하지만, 다른 환경에서도 세션 개념을 사용할 수 있도록 일반화되었습니다.
*   `RequestAdapter`: 사용자의 요청 정보를 추상화합니다. 파라미터, 속성(Attribute) 등을 포함합니다.
*   `ResponseAdapter`: 요청에 대한 응답을 추상화합니다. 응답 데이터를 출력하는 스트림 등을 제공합니다.

이 외에 `Abstract*Adapter` 형태의 추상 클래스들은 공통 기능을 미리 구현하여, 각 환경별 구현 어댑터를 더 쉽게 만들 수 있도록 돕는 템플릿 역할을 합니다.

### 3.2. 환경별 구현 어댑터
아래 패키지들은 `com.aspectran.core.adapter`의 추상 인터페이스를 각자의 실행 환경에 맞게 구체적으로 구현한 클래스들을 포함합니다.

*   **웹 환경 어댑터**
    *   **`com.aspectran.web.adapter` (표준 서블릿 기반)**: `WebApplicationAdapter`, `HttpSessionAdapter`, `HttpRequestAdapter` 등이 `ServletContext`, `HttpSession`, `HttpServletRequest`를 각각 감싸서 표준 서블릿 컨테이너 환경에서 동작합니다.
    *   **`com.aspectran.undertow.adapter` (네이티브 Undertow 기반)**: 표준 서블릿 API를 거치지 않고, 고성능 웹 서버인 Undertow의 네이티브 객체(`HttpServerExchange`)를 직접 감싸서 동작합니다.

*   **콘솔(CLI) 환경 어댑터 (`com.aspectran.shell.adapter`)**
    *   `ShellRequestAdapter`는 사용자가 입력한 명령어와 인자를 '요청'으로, `ShellResponseAdapter`는 `System.out`을 '응답'으로 간주하여 처리합니다.

*   **데몬(Daemon) 환경 어댑터 (`com.aspectran.daemon.adapter`)**
    *   `DaemonRequestAdapter`는 스케줄러나 내부 이벤트에 의해 트리거되는 작업을 '요청'으로 간주합니다.

*   **임베디드(Embedded) 환경 어댑터 (`com.aspectran.embed.adapter`)**
    *   다른 자바 애플리케이션에 Aspectran을 내장할 때 사용되며, 모든 것이 메모리 상에서 단순하게 구현되어 단위 테스트에 매우 유용합니다.

### 3.3. Adapter 아키텍처의 이점
1.  **완벽한 환경 분리**: 비즈니스 로직(Translet, Bean 등)은 자신이 어떤 환경에서 실행되는지 전혀 알 필요가 없습니다.
2.  **최고 수준의 코드 재사용성**: 동일한 비즈니스 로직을 담은 코드를 웹, CLI, 백그라운드 서비스에서 단 한 줄의 수정도 없이 재사용할 수 있습니다.
3.  **테스트 용이성**: 웹 서버나 복잡한 환경을 구동하지 않고도, `com.aspectran.embed.adapter`를 사용하여 비즈니스 로직을 빠르고 간단하게 단위 테스트할 수 있습니다.
4.  **확장성**: 새로운 실행 환경(예: gRPC, WebSocket 등)이 등장하더라도 해당 환경에 맞는 어댑터만 구현하면 기존의 모든 Aspectran 자산을 그대로 활용할 수 있습니다.

---

## 4. 핵심 컨테이너 및 처리 흐름

### 4.1. ActivityContext: Aspectran의 심장
`ActivityContext`는 Aspectran 애플리케이션의 **핵심 컨테이너(IoC Container)**이자 모든 설정, 컴포넌트, 실행 상태를 총괄하여 관리하는 중앙 허브입니다.

*   **주요 책임 및 역할**:
    *   **생명주기 관리**: 등록된 모든 핵심 컴포넌트의 생성, 초기화, 소멸을 관리합니다.
    *   **핵심 컴포넌트 레지스트리**: `BeanRegistry`, `AspectRuleRegistry`, `TransletRuleRegistry`, `ScheduleRuleRegistry` 등 모든 규칙과 컴포넌트를 저장하고 관리하는 레지스트리에 대한 접근점을 제공합니다.
    *   **환경 정보 접근**: `Environment` 객체에 접근하여 활성 프로필, 속성 값 등을 제공합니다.
    *   **Activity 관리**: `Activity` 객체의 생명주기를 관리하며, `ThreadLocal`을 사용하여 각 스레드별 `Activity`를 독립적으로 관리함으로써 멀티스레드 환경에서의 안정성을 보장합니다.
    *   **리소스 로딩 및 국제화**: `ClassLoader` 및 `MessageSource` 접근을 제공합니다.

*   **빌드 과정 (`ActivityContextBuilder`)**: `HybridActivityContextBuilder`는 **설정, 파싱, 생성, 초기화**의 4단계에 걸쳐 `ActivityContext`를 빌드합니다.
    1.  **설정**: `setContextRules()` (설정 파일 경로), `setBasePackages()` (컴포넌트 스캔), `setActiveProfiles()` (프로필 활성화) 등을 통해 빌더를 구성합니다.
    2.  **파싱**: `build()` 메소드가 호출되면 `HybridActivityContextParser`가 설정 파일(XML/APON)을 읽어 `AspectRule`, `BeanRule` 등 내부 `Rule` 객체로 변환하고, 스캔된 클래스도 `BeanRule`로 만들어 `ActivityRuleAssistant`에 임시 저장합니다.
    3.  **생성**: 파싱된 규칙을 바탕으로 `DefaultActivityContext` 인스턴스를 생성하고, 모든 레지스트리를 설정합니다. `BeanReferenceInspector`와 `AspectRuleValidator`를 통해 빈 참조와 애스펙트 규칙의 유효성을 검증합니다.
    4.  **초기화**: `ActivityContext`의 `initialize()` 메소드가 호출되어 모든 싱글톤 빈의 인스턴스화 및 의존성 주입을 완료합니다. 설정에 따라 `ContextReloadingTimer`를 통한 **자동 리로딩(Hot-Reloading)** 기능이 활성화됩니다.

### 4.2. Activity 아키텍처
Aspectran의 Activity 아키텍처는 **요청 처리 모델의 핵심**이며, 다양한 실행 환경에 걸쳐 일관된 방식으로 요청을 처리할 수 있도록 설계된 계층적이고 모듈화된 구조를 가집니다.

*   **핵심 기반 (`com.aspectran.core.activity`)**: 이 패키지는 Aspectran의 **실행 엔진**입니다. 모든 종류의 요청을 처리하는 데 필요한 근본적인 개념과 파이프라인을 정의합니다.
    *   **`Activity`**: 단일 요청-응답 생명주기를 위한 중앙 실행 객체입니다. `ActivityContext`에 접근하고, 어댑터를 통해 환경을 추상화하며, 예외 처리 및 흐름 제어를 담당합니다.
    *   **`Translet`**: **실제로 요청을 처리하는 `Activity`와 사용자 코드 간의 소통을 위한 매개체**입니다. 하나의 요청에 대한 규칙과 데이터를 캡슐화하며, 비즈니스 로직이 실행 상태와 상호작용하는 주된 API 역할을 합니다.
    *   **`CoreActivity`**: **`Translet`에 정의된 규칙에 따라 요청을 처리**하는 핵심 로직을 제공하며, 전체 처리 파이프라인을 조율합니다.
    *   **`InstantActivity`**: 사용자 코드에서 실행할 수 있는 경량 `Activity` 변형으로, Aspectran 컨텍스트를 활용하는 단기적인 프로그래밍 작업에 유용합니다.

### 4.3. Action과 처리 결과
`com.aspectran.core.activity.process` 패키지는 `Activity` 내에서 처리 흐름을 정의하고 실행하는 데 핵심적인 역할을 합니다.

*   **Action의 개념**: Action은 `com.aspectran.core.activity.process.action.Executable` 인터페이스를 구현하는 모든 명령을 의미하며, `ActionList`와 `ContentList` 내에 계층적으로 구성되어 트랜슬릿의 전체 처리 흐름을 정의합니다.
*   **Action의 종류**: `InvokeAction`, `AnnotatedAction`, `ChooseAction`, `EchoAction`, `HeaderAction`, `IncludeAction` 등 다양한 내장 Action이 제공됩니다.
*   **Action 처리 결과의 구조**: Action 실행 결과는 `com.aspectran.core.activity.process.result` 패키지의 클래스들을 통해 계층적으로 관리됩니다.
    *   **`ActionResult`**: 단일 `Executable` Action 실행의 결과를 캡슐화합니다.
    *   **`ContentResult`**: 논리적인 Action 그룹의 결과에 대한 컨테이너입니다. (예: `<contents>` 블록)
    *   **`ProcessResult`**: 단일 `Activity` 수명 주기 내의 모든 실행 결과에 대한 최상위 컨테이너입니다.
*   **결과 값의 활용**: 이 구조화된 결과 값은 **뷰 렌더링**, **응답 생성(REST API 등)**, **트랜슬릿 간 통신**, **조건부 로직 및 흐름 제어**, **디버깅 및 로깅** 등 다양한 핵심 기능에서 중요한 역할을 수행합니다.

---

## 5. 요청 및 응답 처리 메커니즘

Aspectran은 `Activity`의 생명 주기 동안 들어오는 요청을 처리하고 적절한 응답을 생성하기 위한 강력하고 유연한 메커니즘을 제공합니다.

### 5.1. 요청 처리 (Request Handling)
*   **핵심 요청 처리 (`com.aspectran.core.activity.request`)**: `AbstractRequest`, `ParameterMap`, `FileParameter`, `PathVariableMap`, `RequestBodyParser` 등을 통해 요청 데이터를 캡처하고, 파싱하며, 관리하는 핵심 추상화를 제공합니다.
*   **웹 특정 요청 처리 (`com.aspectran.web.activity.request`)**: `ActivityRequestWrapper` (서블릿 요청 래퍼), `MultipartFormDataParser`, `WebRequestBodyParser` 등을 통해 `jakarta.servlet` API와 통합하여 멀티파트 폼 데이터, 헤더 파싱 등 복잡한 HTTP 요청을 처리합니다.

### 5.2. 응답 처리 (Response Handling)
`com.aspectran.core.activity.response` 패키지를 중심으로 다양한 응답 전략을 지원합니다.

*   **기본 응답 유형**: `Response` 인터페이스를 기반으로 다음을 지원합니다.
    *   `ForwardResponse`: 서버 측 포워딩을 수행합니다.
    *   `RedirectResponse`: 클라이언트에게 HTTP 리다이렉트를 보냅니다.
    *   `ResponseTemplate`: 프로그래밍적으로 동적인 응답을 생성합니다.

*   **뷰 디스패치 (`...response.dispatch`)**: `ViewDispatcher` 인터페이스와 `DispatchResponse`를 통해 특정 뷰 기술(JSP, Thymeleaf 등)로 요청을 디스패치하여 UI를 렌더링합니다. `DispatchResponse`는 `ViewDispatcher` 빈을 찾아 렌더링 작업을 위임하는 중재자 역할을 합니다.

*   **데이터 변환 (`...response.transform`)**: `TransformResponse` 추상 클래스를 기반으로 `Activity`의 처리 결과(`ProcessResult`)를 다양한 출력 형식으로 변환합니다.
    *   **구현체**: `AponTransformResponse`, `JsonTransformResponse`, `XmlTransformResponse`, `TextTransformResponse` 등
    *   **팩토리**: `TransformResponseFactory`가 `TransformRule`에 따라 적절한 `TransformResponse` 객체를 생성합니다.

*   **웹 특정 응답 처리 (`com.aspectran.web.activity.response`)**: `RestResponse` 인터페이스를 통해 RESTful 서비스에 특화된 HTTP 응답(상태 코드, 헤더, 데이터 형식)을 세밀하게 제어합니다.

---

## 6. 설정 및 구성

### 6.1. 설정 규칙 아키텍처 (`com.aspectran.core.context.rule`)
Aspectran 애플리케이션의 모든 설정 정보(XML/APON)는 파서에 의해 `Rule` 객체들로 변환되어 메모리에 로드됩니다. 이들은 애플리케이션의 **설계도(Blueprint)** 역할을 하는 순수한 데이터 객체(POJO)들입니다.

*   **핵심 구성 요소 규칙**: `TransletRule`, `BeanRule`, `AspectRule`, `ScheduleRule`, `TemplateRule` 등 최상위 구성 요소를 정의합니다.
*   **행위 및 응답 규칙**: `InvokeActionRule`, `TransformRule`, `DispatchRule` 등 실제 실행될 로직과 응답 방식을 정의합니다.
*   **데이터 및 파라미터 규칙**: `ItemRule`은 모든 파라미터, 속성, 인자의 기본 단위입니다.
*   **능력 인터페이스 (`...rule.ability`)**: `HasActionRules`, `HasResponseRules` 등 각 `Rule` 클래스가 어떤 종류의 자식 규칙을 가질 수 있는지를 명시하는 **계약(Contract)** 역할을 하여 유연하고 타입-세이프한 구조를 만듭니다.

### 6.2. 구성 로딩 메커니즘 (`com.aspectran.utils.nodelet`)
Aspectran은 자체 제작한 경량 파싱 프레임워크인 **`nodelet`**을 사용하여 설정 파일을 로딩합니다.

*   **작동 방식**: SAX 파서와 유사하게 이벤트 기반으로 작동하지만, 특정 XPath 경로에 콜백(`Nodelet`/`EndNodelet`)을 직접 매핑하여 복잡한 XML 문서를 직관적이고 구조적으로 처리합니다.
*   **`NodeletGroup`**: XPath와 콜백을 그룹으로 묶어 관리하며, Fluent API를 통해 파싱 규칙을 선언적으로 정의합니다.
*   **혁신적인 `mount` 기능**: 특정 엘리먼트가 나타났을 때 미리 정의된 다른 `NodeletGroup`의 규칙 세트를 동적으로 활성화시켜, **메모리 효율성, 규칙 재사용성, 중첩 단계 제한 해제** 등의 이점을 제공합니다.
*   **상태 관리**: `AspectranNodeParsingContext`와 `ObjectStack`을 사용하여 XML 파싱 중 부모-자식 관계를 처리하는 상태를 스레드-세이프하게 관리합니다.

### 6.3. 환경 설정 (`com.aspectran.core.context.config`)
이 패키지는 Aspectran 애플리케이션의 다양한 설정을 정의하는 데이터 컨테이너(POJO) 클래스들의 집합입니다.

*   **계층적/모듈화된 설정**: `AspectranConfig`가 최상위 설정 객체이며, `ContextConfig`, `WebConfig`, `DaemonConfig`, `ShellConfig`, `EmbedConfig` 등 실행 환경별 세부 설정 객체들을 포함하여 필요한 환경의 설정만 구성할 수 있습니다.
*   **주요 기능 설정**: 환경 프로파일, 자동 리로딩, 세션 관리, 작업 스케줄링 등의 기능 활성화 및 세부 동작을 이곳의 설정 클래스들을 통해 관리합니다.

---

## 7. AOP, 세션, 클래스로더 등 고급 기능

### 7.1. AOP 메커니즘

Aspectran의 AOP는 핵심 실행 모델인 `Activity`의 실행 흐름과 Bean 메소드 호출에 깊숙이 통합된 독자적인 모델을 가지고 있습니다.

*   **Weaving 메커니즘: 지능적인 동적 프록시**: AOP를 적용하기 위해 **런타임에 동적 프록시(Dynamic Proxy)**를 사용합니다.
    *   **`AbstractBeanProxy`**: 모든 AOP 프록시 객체의 기반 클래스입니다. 메소드 호출 시 `@Advisable` 또는 `@Async` 어노테이션이 있는지 먼저 검사하여, 어드바이스가 필요 없는 수많은 내부 메소드 호출의 오버헤드를 원천적으로 제거함으로써 **성능을 최적화**합니다.
    *   **`ProxyActivity`**: AOP 어드바이스 실행만을 위한 경량 `Activity`입니다. **독립 모드**와 **래핑 모드**를 통해 동기/비동기 환경 모두에서 유연하고 안정적인 컨텍스트 관리를 가능하게 합니다. 특히 `@Async` 메소드 호출 시 `ProxyActivity`를 통해 컨텍스트를 공유합니다.

### 7.2. 세션 관리

Aspectran Session Manager는 웹, 셸, 데몬 등 다양한 실행 환경에서 일관된 방식으로 상태를 유지할 수 있도록 **환경에 비종속적인 고성능 세션 관리 컴포넌트**(`com.aspectran.core.component.session`)를 제공합니다.

*   **핵심 아키텍처**: `SessionManager`, `Session`, `SessionCache` (메모리 캐시), `SessionStore` (영속 저장소), `HouseKeeper` (만료 세션 정리), `SessionIdGenerator`로 구성됩니다.
*   **교체 가능한 세션 저장소 (`SessionStore`)**: `FileSessionStore` (파일 시스템) 또는 `LettuceSessionStore` (Redis 기반, **클러스터링 지원**)를 설정에 따라 선택하여 사용할 수 있습니다.
*   **정교한 세션 생명주기 관리**: 봇(Bot)이나 크롤러가 생성하는 불필요한 세션을 신속하게 제거하기 위해, 속성이 없는 "신규 세션"에 짧은 타임아웃(`maxIdleSecondsForNew`)을 적용하는 등 정교한 타임아웃 정책과 자동 정리(`HouseKeeper`)를 지원합니다.
*   **동작 모드 비교: 단일 서버 vs. 클러스터**
    *   **단일 서버 모드 (`clusterEnabled: false`)**: `SessionCache`(메모리)를 우선적으로 신뢰하여 최고의 성능을 지향합니다.
    *   **클러스터 모드 (`clusterEnabled: true`)**: `SessionStore`(Redis)를 유일한 **최종 데이터 저장소(Single Source of Truth)**로 신뢰하여 여러 서버 노드 간의 데이터 일관성을 보장합니다.
*   **영속성 제어**: `@NonPersistent` 어노테이션을 사용하여 직렬화할 수 없거나 보안상 민감한 객체가 세션 저장소에 저장되지 않도록 할 수 있습니다.

### 7.3. 클래스 로딩 메커니즘 (`SiblingClassLoader`)

Aspectran은 자바의 표준 클래스 로딩 메커니즘을 넘어서는 독자적인 `SiblingClassLoader`를 구현하여 동적 리로딩(Hot Reloading)과 모듈형 애플리케이션 구조를 지원합니다.

*   **"형제 우선(Sibling-First)" 위임 모델**: 표준 "부모 우선" 모델과 달리, 클래스 로딩 요청 시 자신과 형제 `SiblingClassLoader`가 관리하는 리소스 경로에서 클래스를 먼저 찾고, 최후의 수단으로 부모에게 위임합니다. 이를 통해 모듈 간 클래스 공유 및 동적 교체가 가능해집니다.
*   **주요 특징**:
    *   **동적 핫 리로딩**: `reload()` 메소드를 통해 JVM 재시작 없이 애플리케이션 구성 요소나 클래스를 다시 로드할 수 있습니다.
    *   **계층적 형제 구조**: `root` 로더와 여러 `siblings`로 구성된 구조를 통해 여러 리소스 위치를 하나의 논리적인 그룹으로 묶어 관리합니다.
    *   **선택적 클래스 제외**: `excludePackage()`, `excludeClass()`를 통해 핵심 JRE 클래스나 공유 라이브러리의 중복 로드를 방지하여 클래스 충돌을 예방합니다.

### 7.4. 로깅 메커니즘 (`com.aspectran.logging`)

Aspectran은 **SLF4J**를 로깅 추상화 라이브러리로, **Logback**을 기본 구현체로 사용합니다.
*   **핵심 기능 (`LoggingGroupDiscriminator`)**: 사용자 정의 Logback `Discriminator`를 통해 로그가 발생하는 논리적인 "그룹"을 식별합니다. 그룹명은 SLF4J MDC, `ActivityContext` 이름 등의 우선순위로 결정됩니다.
*   **동적 로그 분리**: `SiftingAppender`와 함께 사용하여, 웹 애플리케이션의 경우 `PathBasedLoggingGroupHandlerWrapper`를 통해 요청 URI에 따라 로그를 별도의 파일(예: `jpetstore.log`, `petclinic.log`)로 동적으로 분리하여 기록할 수 있습니다.

---

## 8. 결론

Aspectran의 아키텍처는 **모듈성, 유연성, 확장성, 그리고 성능**을 핵심 가치로 삼아 설계되었습니다. `ActivityContext`를 중심으로 핵심 컴포넌트들이 유기적으로 결합되어 요청 처리 파이프라인을 형성하며, 어댑터 패턴을 통한 환경 추상화, `nodelet` 엔진을 통한 효율적인 설정 로딩, 그리고 지능적인 동적 프록시 기반의 AOP 메커니즘은 Aspectran이 다양한 애플리케이션 요구사항에 효과적으로 대응할 수 있도록 합니다.

프레임워크 개발자는 이 아키텍처 청사진을 통해 Aspectran의 내부 동작을 깊이 있게 파악하고, 필요에 따라 새로운 기능 모듈을 개발하거나 기존 기능을 확장 및 최적화하는 데 기여할 수 있습니다.

## 9. 참고 문서

본 문서는 다음의 개별 아키텍처 문서들을 종합하여 작성되었습니다. 각 주제에 대한 더 상세한 정보는 아래 문서들을 참고하십시오.

*   [ActivityContext 빌드 과정: 심층 분석](/ko/docs/architecture/activity-context-building/)
*   [ActivityContext: Aspectran의 심장부](/ko/docs/architecture/activity-context/)
*   [Environment: 프로필과 속성을 이용한 환경 제어](/ko/docs/architecture/activity-environment/)
*   [Aspectran Actions: 개념, 종류 및 처리 결과](/ko/docs/architecture/aspectran-actions/)
*   [Activity 아키텍처: 요청 처리의 실행 엔진](/ko/docs/architecture/aspectran-activities/)
*   [Adapter 아키텍처: 환경 독립성의 핵심](/ko/docs/architecture/aspectran-adapters/)
*   [Aspectran의 빈 스코프(Bean Scopes) 심층 분석](/ko/docs/architecture/aspectran-bean-scopes/)
*   [SiblingClassLoader: 동적이고 유연한 클래스 로딩의 핵심](/ko/docs/architecture/aspectran-classloader/)
*   [Aspectran 실행 환경 심층 분석](/ko/docs/architecture/aspectran-execution-environments/)
*   [Aspectran 구성 로딩 메커니즘](/ko/docs/architecture/aspectran-loading-mechanism/)
*   [Aspectran 로깅 메커니즘](/ko/docs/architecture/aspectran-logging-mechanism/)
*   [요청(Request) 및 응답(Response) 처리 메커니즘](/ko/docs/architecture/aspectran-request-response/)
*   [Aspectran 설정 규칙 아키텍처 심층 분석](/ko/docs/architecture/aspectran-rule-architecture/)
*   [Aspectran 서비스 아키텍처 심층 분석](/ko/docs/architecture/aspectran-services/)
*   [Aspectran Session Manager](/ko/docs/architecture/aspectran-session-manager/)
*   [Aspectran AOP 프록시 메커니즘](/ko/docs/architecture/new-aop-proxy-mechanism/)