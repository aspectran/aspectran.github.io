---
format: plate solid article
sidebar: toc
title: "Adapter 아키텍처: 환경 독립성의 핵심"
subheadline: 아키텍처
parent_path: /docs
---

Aspectran 프레임워크의 가장 강력한 아키텍처 특징 중 하나는 **어댑터(Adapter) 패턴**의 전면적인 도입입니다. 어댑터는 런타임 환경(웹, 콘솔, 데몬 등)의 구체적인 구현 기술을 Aspectran의 표준 인터페이스에 맞게 변환하는 역할을 합니다. 이를 통해 동일한 비즈니스 로직이 어떤 환경에서든 수정 없이 실행될 수 있도록 하는 **완벽한 환경 추상화**를 제공합니다.

## 1. 핵심 인터페이스: `com.aspectran.core.adapter`

이 패키지는 모든 어댑터가 반드시 구현해야 하는 **핵심 계약(Contract)**을 정의합니다. Aspectran의 `Activity` 실행 엔진은 이 추상 인터페이스에만 의존하므로, 실제 실행 환경이 서블릿 컨테이너인지, 콘솔인지, 혹은 다른 어떤 환경인지 전혀 알 필요가 없습니다.

-   **`ApplicationAdapter`**: 애플리케이션 전체의 생명주기와 환경(기반 경로, 클래스로더 등)을 추상화합니다. 웹 환경에서는 `ServletContext`를 감싸는 역할을 합니다.

-   **`SessionAdapter`**: 사용자의 세션을 추상화합니다. 웹 환경의 `HttpSession`에 해당하지만, 다른 환경에서도 상태 유지가 가능한 세션 개념을 사용할 수 있도록 일반화되었습니다.

-   **`RequestAdapter`**: 외부의 요청 정보를 추상화합니다. 요청 파라미터, 속성(Attribute), 헤더, 요청 본문(Request Body) 등 요청과 관련된 모든 데이터에 접근하는 표준화된 방법을 제공합니다.

-   **`ResponseAdapter`**: 요청에 대한 응답을 추상화합니다. 응답 데이터를 출력하는 `Writer` 또는 `OutputStream`을 제공하고, 응답의 문자 인코딩이나 콘텐츠 타입을 설정하는 기능을 포함합니다.

-   **`Abstract*Adapter` (템플릿 클래스)**: `AbstractApplicationAdapter`, `AbstractRequestAdapter` 등은 템플릿 메서드 패턴을 적용한 추상 클래스입니다. 각 환경별 구체적인 어댑터를 더 쉽게 만들 수 있도록 공통 기능을 미리 구현해 둔 뼈대 역할을 합니다.

## 2. 환경별 구체적인 어댑터 구현

`Activity`가 실행될 때, `adapt()` 메서드 내부에서 현재 실행 환경에 맞는 구체적인 어댑터들이 생성되어 `Activity`에 연결됩니다. 각 환경별 어댑터는 다음과 같습니다.

### 가. 웹 환경 어댑터

-   **`com.aspectran.web.adapter` (표준 서블릿 기반)**
    -   `WebApplicationAdapter`: `ServletContext`를 감싸서 웹 애플리케이션의 전반적인 정보를 제공합니다.
    -   `HttpSessionAdapter`: `HttpSession`을 감싸서 세션 기능을 구현합니다.
    -   `HttpRequestAdapter`: `HttpServletRequest`를 감싸서 HTTP 요청 정보를 처리합니다.
    -   **특징**: Tomcat, Jetty 등 표준 서블릿 컨테이너 환경에서 동작하는 가장 일반적인 웹 어댑터입니다.

-   **`com.aspectran.undertow.adapter` (네이티브 Undertow 기반)**
    -   `UndertowApplicationAdapter`, `UndertowSessionAdapter` 등
    -   **특징**: 표준 서블릿 API를 거치지 않고, 고성능 웹 서버인 Undertow의 네이티브 객체(`HttpServerExchange`)를 직접 감싸서 동작합니다. 서블릿 API 래핑으로 인한 오버헤드가 없어 더 높은 성능을 기대할 수 있습니다.

### 나. 콘솔(CLI) 환경 어댑터 (`com.aspectran.shell.adapter`)

-   `ShellApplicationAdapter`: 셸 애플리케이션의 실행 환경을 관리합니다.
-   `ShellRequestAdapter`: 사용자가 터미널에 입력한 명령어와 인자(arguments)를 '요청 파라미터'로 간주하여 처리합니다.
-   `ShellResponseAdapter`: `System.out` 이나 `System.err`를 '응답 스트림'으로 간주하여, 처리 결과를 콘솔에 출력합니다.
-   `ShellSessionAdapter`: 셸 세션이 유지되는 동안 상태를 저장하는 메모리 기반 세션을 구현합니다.
-   **특징**: 웹의 '요청/응답' 개념을 콘솔 환경의 '명령어 입력/결과 출력'에 맞게 완벽하게 매핑했습니다.

### 다. 데몬(Daemon) 및 임베디드(Embedded) 환경 어댑터

-   **`com.aspectran.daemon.adapter` / `com.aspectran.embed.adapter`**
    -   `DaemonRequestAdapter`, `EmbeddedRequestAdapter` 등
    -   **특징**: 이 환경들은 외부의 직접적인 요청이 없습니다. 대신 스케줄러나 내부 로직의 프로그래밍적인 호출(`translate()` 메서드 호출)을 '요청'으로 간주합니다. `RequestAdapter`는 이때 전달된 파라미터와 속성을 담는 역할을 하며, `ResponseAdapter`는 주로 `StringWriter`를 이용해 응답 결과를 문자열로 캡처하는 데 사용됩니다.
    -   특히 `EmbeddedApplicationAdapter`는 외부 환경 의존성이 전혀 없는 순수 자바 구현체이므로, 복잡한 서버 구동 없이 비즈니스 로직을 테스트하는 데 매우 유용합니다.

## 3. 결론: Adapter 아키텍처의 강력함

Aspectran의 Adapter 아키텍처는 다음과 같은 강력한 이점을 제공합니다.

1.  **완벽한 환경 분리**: 비즈니스 로직(Translet, Bean 등)은 자신이 어떤 환경에서 실행되는지 전혀 알 필요 없이, 오직 `com.aspectran.core.adapter`의 추상 인터페이스에만 의존합니다.

2.  **최고 수준의 코드 재사용성**: 동일한 비즈니스 로직을 담은 코드를 웹 애플리케이션, 배치 작업용 CLI, 백그라운드 서비스에서 단 한 줄의 수정도 없이 재사용할 수 있습니다.

3.  **테스트 용이성 (Testability)**: 웹 로직이라 할지라도, 웹 서버를 구동하지 않고 `EmbeddedAdapter`를 사용하여 비즈니스 로직의 정확성을 빠르고 간단하게 단위 테스트할 수 있습니다.

4.  **확장성 (Extensibility)**: 새로운 실행 환경(예: gRPC, WebSocket, Kafka 등)이 등장하더라도, 해당 환경의 요청/응답을 처리하는 어댑터만 구현하면 기존의 모든 Aspectran 자산(AOP, DI, 트랜잭션 등)을 그대로 활용하여 새로운 유형의 애플리케이션을 만들 수 있습니다.

이처럼 Adapter 구조는 Aspectran을 단순한 웹 프레임워크가 아닌, 어떤 환경에서도 동작할 수 있는 **범용 애플리케이션 프레임워크(Universal Application Framework)**로 만드는 핵심 설계 사상이라고 할 수 있습니다.
