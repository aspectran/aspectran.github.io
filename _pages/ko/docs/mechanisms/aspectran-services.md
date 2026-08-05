---
title: Aspectran 서비스 아키텍처 심층 분석
subheadline: 아키텍처 및 메커니즘
---

Aspectran의 서비스(`Service`)는 프레임워크의 생명주기를 관리하고, 특정 실행 환경의 진입점 역할을 하는 핵심 컨테이너입니다. 어떤 환경(웹, 셸, 데몬 등)에서 애플리케이션을 구동할지에 따라 적합한 서비스 구현체가 사용됩니다. 이 서비스 아키텍처는 계층적이고 모듈화된 구조를 통해 높은 유연성과 확장성을 제공합니다.

## 1. 모든 서비스의 기반: `CoreService`

`com.aspectran.core.service` 패키지에 위치한 `CoreService`는 모든 Aspectran 서비스의 근간을 이루는 최상위 추상화입니다.

-   **역할**: `CoreService`는 `ServiceLifeCycle` 인터페이스를 구현하여 서비스의 시작(`start`), 중지(`stop`), 재시작(`restart`) 등 전체 생명주기를 관리합니다. 또한, Aspectran의 모든 설정과 컴포넌트(Bean, Translet, Aspect 등)를 담고 있는 `ActivityContext`를 생성하고 초기화하는 **표준 부트스트래퍼(Bootstrapper)** 역할을 수행합니다.
-   **구현**: `DefaultCoreService`는 `CoreService`의 표준 구현체로, `ActivityContextBuilder`를 사용하여 설정 파일을 파싱하고 `ActivityContext`를 빌드하는 모든 핵심 로직을 포함합니다.
-   **관계**: 앞으로 설명할 모든 환경별 특화 서비스들은 이 `DefaultCoreService`를 직접 상속받거나, 내부에 포함하여 그 기능을 확장하는 방식으로 구현됩니다. 즉, 모든 서비스는 `CoreService`의 핵심 메커니즘을 공유하며, 일관된 방식으로 생명주기가 관리됩니다.

## 2. 기능 확장 모듈: `SchedulerService`

`SchedulerService`는 Aspectran의 모듈화된 아키텍처를 잘 보여주는 예시입니다. 이는 독립적인 서비스가 아니라, `CoreService`에 **스케줄링 기능**을 추가하는 **자식 서비스(Sub-service)**입니다.

-   **생명주기 종속성**: 부모 서비스인 `CoreService`의 생명주기에 종속되어 함께 시작되고 종료됩니다. `CoreService`가 시작될 때 `SchedulerService`도 함께 시작되어 스케줄링을 활성화합니다.
-   **Quartz 통합 및 추상화**: Aspectran 설정 파일에 정의된 스케줄 규칙(`ScheduleRule`)을 읽어, 유명 스케줄링 라이브러리인 **Quartz**의 `Scheduler`, `JobDetail`, `Trigger` 객체를 자동으로 생성하고 설정합니다. 이를 통해 개발자는 복잡한 Quartz API를 직접 다루지 않고도 Aspectran의 선언적인 방식으로 스케줄링을 정의할 수 있습니다.
-   **컨텍스트 연동**: 스케줄된 작업이 실행될 때, `ActivityLauncherJob`이라는 범용 Quartz `Job`이 실행됩니다. 이 Job은 `CoreService` 참조를 가지고 있다가, 지정된 트랜슬릿을 실행하기 위한 `Activity`를 생성하고 실행합니다. 덕분에 스케줄링된 작업 내에서도 다른 웹 요청이나 셸 커맨드와 동일하게 애플리케이션에 등록된 모든 Bean을 주입받거나 AOP Aspect를 적용받는 등, 완전한 Aspectran 컨텍스트를 활용할 수 있습니다.

## 3. 실행 환경별 특화 서비스

`CoreService`의 핵심 기능은 다양한 실행 환경에 맞게 특화된 서비스 구현체를 통해 제공됩니다. 이 서비스들은 모두 동일한 `ActivityContext`를 공유하지만, 각 환경의 요청을 받아들이고 처리하는 방식, 즉 **진입점(Entry Point)**과 **동작 모델**이 다릅니다.

| 서비스 | 실행 환경 | 동작 모델 | 주요 특징 및 진입점 |
| :--- | :--- | :--- | :--- |
| **`DaemonService`** | 독립 실행형 백그라운드 프로세스 | **능동적 (Proactive)** | 외부 요청 없이 스스로 작업을 시작하고 반복 수행합니다. `DaemonService`를 상속받아 구현한 클래스 내에서 `translate()` 메소드를 프로그래밍 방식으로 호출하여 내부적으로 정의된 Translet을 실행하는 방식입니다. |
| **`ShellService`** | 대화형 커맨드-라인 (CLI) | **상호작용 (Interactive)** | 터미널을 통해 사용자의 입력을 실시간으로 받아 동작합니다. 사용자가 입력한 커맨드는 `TransletCommandLine` 객체로 변환되어 `translate()` 메소드로 전달되고, 해당 Translet이 실행됩니다. |
| **`EmbeddedAspectran`** | 다른 Java 애플리케이션에 내장 | **퍼사드 (Facade)** | 복잡한 `CoreService`의 생명주기 관리 로직을 감싸고, `run()`, `translate()`, `getBean()` 등 단순하고 명확한 API를 제공하는 퍼사드 클래스입니다. 기존 애플리케이션에 Aspectran의 기능을 쉽게 통합할 수 있도록 돕습니다. |
| **`WebService`** | 표준 서블릿 컨테이너 (Tomcat, Jetty 등) | **반응형 (Reactive)** | 외부의 HTTP 요청에 반응하여 동작합니다. 프론트 컨트롤러 서블릿(`WebActivityServlet`)이 클라이언트의 `HttpServletRequest`를 받아 `WebService`의 `service()` 메소드를 호출함으로써 요청 처리 사이클이 시작됩니다. |
| **`TowService`** | 임베디드 Undertow 서버 | **서블릿 없는 웹 (Servlet-less)** | `WebService`와 달리 서블릿 API를 거치지 않고, 고성능 웹 서버인 Undertow의 네이티브 API(`HttpServerExchange`)와 직접 통신합니다. Undertow 핸들러 체인 내에서 `TowService`의 `service()` 메소드가 호출되어 더 낮은 오버헤드와 높은 성능을 지향합니다. |

## 4. 아키텍처의 핵심 설계 원칙

이러한 유연한 구조는 다음과 같은 핵심 설계 원칙 덕분에 가능합니다.

-   **어댑터 패턴 (Adapter Pattern)**
    각기 다른 환경의 요청 객체(예: `HttpServletRequest`, `HttpServerExchange`, `TransletCommandLine`)는 환경에 특화된 **어댑터(Adapter)**에 의해 감싸집니다. 그리고 `Activity`는 이 어댑터를 통해 환경에 구애받지 않는 표준화된 방식으로 요청 데이터를 읽고 응답을 처리합니다. 이 패턴 덕분에 Translet에 정의된 핵심 비즈니스 로직은 자신이 어떤 환경에서 실행되는지 전혀 알 필요 없이 완벽하게 재사용될 수 있습니다.

-   **설정의 일관성 (Configuration Consistency)**
    `WebService`(서블릿 기반)와 `TowService`(Undertow 기반)가 `WebConfig`라는 동일한 웹 관련 설정 정보를 공유하는 것처럼, 핵심 로직과 설정이 분리되어 있어 다른 환경으로 서비스를 전환하기가 매우 용이합니다.

-   **중앙 집중식 컨텍스트 (Centralized Context)**
    어떤 종류의 서비스를 사용하든, 모든 작업은 단일 `ActivityContext`를 통해 이루어집니다. 이는 웹 요청, 스케줄링 작업, 셸 명령 등 실행 경로가 다르더라도 애플리케이션의 모든 컴포넌트(Bean, 데이터 소스 등)와 기능(AOP 등)에 항상 일관되게 접근할 수 있음을 보장합니다.

이러한 아키텍처 덕분에 Aspectran은 간단한 CLI 도구부터, 다른 애플리케이션에 내장되는 라이브러리, 백그라운드에서 실행되는 데몬, 그리고 고성능 웹 애플리케이션에 이르기까지 매우 넓은 스펙트럼의 애플리케이션을 동일한 핵심 로직으로 구축할 수 있는 강력하고 유연한 프레임워크로 자리매김할 수 있습니다.
