---
title: Aspectran 실행 환경 심층 분석
subheadline: 아키텍처 및 메커니즘
---

Aspectran은 핵심 서비스(`CoreService`)와 실행 단위(`Activity`) 개념을 기반으로, 다양한 실행 환경을 지원하는 특수 모듈을 제공합니다. 이러한 모듈성은 개발자가 장기 실행 백그라운드 프로세스, 대화형 명령줄 도구, 임베디드 라이브러리, 고성능 웹 애플리케이션 등 특정 사용 사례에 가장 적합한 방식으로 Aspectran 애플리케이션을 배포할 수 있도록 합니다.

각 환경에 대한 상세 분석은 다음과 같습니다.

## 1. 데몬 환경 (`com.aspectran.daemon`)

-   **목적**: 직접적인 사용자 인터페이스 없이 Aspectran 애플리케이션을 장기 실행 백그라운드 프로세스로 실행합니다. 배치 처리, 예약된 작업, 내부 서비스 간 통신 등에 이상적입니다.
-   **주요 진입점**: `com.aspectran.daemon.DefaultDaemon` 클래스의 `main` 메서드를 통해 부트스트래핑됩니다. 이 클래스는 Aspectran 설정을 로드하고 `DaemonService`를 시작하는 역할을 합니다.
-   **핵심 컴포넌트**:
    -   `DaemonService`: 데몬 환경에 특화된 `CoreService` 구현체로, 프로그래밍 방식의 `translate()` 호출을 통해 내부적으로 트랜슬릿을 실행할 수 있는 기능을 제공합니다.
    -   `DaemonActivity`: `DaemonService`의 `translate()` 호출을 처리하기 위한 `Activity` 구현체입니다. `DaemonRequestAdapter`와 `DaemonResponseAdapter`를 사용하여 입출력을 처리합니다.
    -   `FileCommander`: 특정 디렉토리를 주기적으로 폴링하여 파일 기반의 명령을 처리하는 고급 기능을 제공합니다.
-   **동작 모델**: **능동적(Proactive)**. 외부 요청을 기다리는 대신, 스스로 작업을 시작하거나 내부 스케줄에 따라 동작합니다. JVM 종료 훅(Shutdown Hook)을 통해 안전한 생명주기 관리를 보장하며, 상태 유지가 필요한 백그라운드 작업을 위해 세션 기능을 활성화할 수 있습니다.

## 2. 임베디드 환경 (`com.aspectran.embed`)

-   **목적**: 기존 Java 애플리케이션(독립 실행형, 데스크톱, 다른 웹 프레임워크 등) 내에 Aspectran의 강력한 기능을 라이브러리나 컴포넌트로 통합합니다. Aspectran의 내부 복잡성을 숨기고 간단한 API를 통해 상호작용할 수 있는 퍼사드(Facade)를 제공합니다.
-   **주요 진입점**: `com.aspectran.embed.service.EmbeddedAspectran` 인터페이스의 정적 `run()` 팩토리 메서드를 통해 매우 쉽게 시작할 수 있습니다.
-   **핵심 컴포넌트**:
    -   `EmbeddedAspectran`: `CoreService`에 대한 고수준 퍼사드 인터페이스로, `translate()`, `render()`, `execute()`, `getBean()` 등 임베딩 환경에서 자주 사용되는 메서드를 제공합니다.
    -   `DefaultEmbeddedAspectran`: `EmbeddedAspectran`의 구체적인 구현체로, 내부적으로 `DefaultCoreService`를 상속받아 관리합니다.
    -   `AspectranActivity`: 임베디드 컨텍스트를 위한 `Activity` 구현체로, 프로그래밍 방식의 호출을 Aspectran의 처리 파이프라인에 맞게 조정합니다.
-   **동작 모델**: **퍼사드(Facade)**. 복잡한 생명주기 관리를 단순화하고, 사용 사례 중심의 직관적인 API를 제공하여 어떤 자바 애플리케이션에도 Aspectran의 기능을 쉽게 통합할 수 있도록 합니다.

## 3. 셸 환경 (`com.aspectran.shell`)

-   **목적**: Aspectran 애플리케이션을 위한 대화형 명령줄 인터페이스(CLI)를 제공합니다. 사용자가 터미널에서 직접 명령(트랜슬릿)을 실행하고 애플리케이션과 상호 작용할 수 있도록 합니다.
-   **주요 진입점**: `com.aspectran.shell.AspectranShell` 클래스의 `main` 메서드를 통해 대화형 셸을 시작합니다.
-   **핵심 컴포넌트**:
    -   `ShellService`: 셸 환경에 특화된 `CoreService` 구현체로, `ShellConsole`에 대한 접근 및 `translate(TransletCommandLine)` 메서드를 통한 명령어 실행을 제공합니다.
    -   `ShellActivity`: 콘솔 입출력에 맞게 조정된 `Activity` 구현체로, 절차적 프롬프트 및 출력 리다이렉션과 같은 기능을 처리합니다.
    -   `ShellConsole`: JLine, Jansi 등의 라이브러리를 기반으로 콘솔 상호작용(입력 읽기, 색상 출력, 탭 자동완성 등)을 추상화합니다.
-   **동작 모델**: **상호작용(Interactive)**. 사용자의 입력에 실시간으로 반응하며, 환영 메시지, 도움말, 상세 모드 등 사용자 친화적인 기능을 제공합니다. 명령어 처리 간 상태 유지를 위해 세션 기능을 사용할 수 있습니다.

## 4. 웹 환경 (`com.aspectran.web` 및 `com.aspectran.undertow`)

Aspectran은 두 가지 주요 모듈을 통해 웹 환경을 지원합니다.

### 4.1. 일반 서블릿 환경 (`com.aspectran.web`)

-   **목적**: 모든 표준 Java 서블릿 컨테이너(예: Tomcat, Jetty, WildFly) 내에서 Aspectran 애플리케이션을 실행합니다.
-   **주요 진입점**: `web.xml`에 등록된 `com.aspectran.web.servlet.listener.WebServiceListener`가 `WebService`를 초기화하고, `com.aspectran.web.servlet.WebActivityServlet`이 프론트 컨트롤러(Front Controller)로서 모든 HTTP 요청을 받아 `WebService`에 위임합니다.
-   **핵심 컴포넌트**:
    -   `WebService`: 웹 환경에 특화된 `CoreService`로, `service(HttpServletRequest, HttpServletResponse)` 메서드가 핵심 진입점입니다.
    -   `WebActivity`: `HttpServletRequest`와 `HttpServletResponse`를 래핑하여 Aspectran의 처리 파이프라인에 맞게 조정하는 `Activity` 구현체입니다.
-   **동작 모델**: **반응형(Reactive)**. 외부 HTTP 요청에 응답하여 동작하며, 서블릿 API 기반의 모든 웹 기능(세션, 인코딩, 멀티파트, 비동기 처리)을 지원합니다.

### 4.2. Undertow 환경 (`com.aspectran.undertow`)

-   **목적**: 고성능의 임베디드 웹 서버인 Undertow 위에 Aspectran 애플리케이션을 직접 실행합니다. 이는 더 가볍고 잠재적으로 더 빠른 배포를 가능하게 하는 서블릿 없는(Servlet-less) 대안입니다.
-   **주요 진입점**: 개발자가 직접 Undertow 서버를 빌드하고, Aspectran의 `TowService`를 `HttpHandler`로 체인에 연결하여 프로그래밍 방식으로 시작합니다.
-   **핵심 컴포넌트**:
    *   `TowService`: Undertow에 특화된 `CoreService`로, 서블릿 API를 거치지 않고 네이티브 `HttpServerExchange` 객체를 직접 처리하는 `service(HttpServerExchange)` 메서드를 제공합니다.
    *   `TowActivity`: `HttpServerExchange`를 래핑하는 `Activity` 구현체입니다.
-   **동작 모델**: **서블릿 없는 웹(Servlet-less Web)**. 서블릿 API의 오버헤드 없이 Undertow의 네이티브 API와 직접 상호작용하여 고성능을 지향합니다. 경량 마이크로서비스를 구축하는 데 이상적입니다.

## 5. 결론

Aspectran의 실행 환경 아키텍처는 **코어 로직과 런타임 환경의 분리**라는 핵심 사상을 보여줍니다. `CoreService`와 `CoreActivity`라는 재사용 가능한 핵심 로직을 두고, 각 환경의 특수성은 `Adapter`와 환경별 서비스/액티비티 구현체를 통해 흡수합니다. 이 접근 방식은 핵심 비즈니스 로직의 완벽한 이식성을 보장하면서, 각 환경의 특정 기능 및 성능 특성을 최대한 활용할 수 있도록 합니다.
