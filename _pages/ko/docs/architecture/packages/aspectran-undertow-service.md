---
format: plate solid article
sidebar: toc-left
title: "`com.aspectran.undertow.service` 패키지 상세 분석"
headline:
teaser:
---

## 1. 설계 목표 및 주요 역할

이 패키지는 Aspectran을 고성능 경량 웹 서버인 **Undertow 위에서 직접 실행**하기 위한 특화된 서비스 구현을 제공합니다. 이는 표준 서블릿(Servlet) API를 사용하는 `web-service` 패키지의 대안입니다.

이 패키지의 설계 목표는 다음과 같습니다.

-   **서블릿 없는(Servlet-less) 웹 환경 제공**: 전통적인 서블릿 컨테이너와 API를 완전히 우회하고, Undertow의 네이티브 I/O 객체(`HttpServerExchange`)와 직접 상호작용하여 더 나은 성능과 가벼운 배포 환경을 제공합니다.
-   **고성능 임베디드 서버 지원**: Aspectran 애플리케이션을 독립적으로 실행 가능한 JAR 파일로 패키징하여, 내장된 Undertow 서버와 함께 기동하는 마이크로서비스 아키텍처에 최적화된 환경을 제공합니다.
-   **설정 호환성 유지**: 서블릿 기반의 웹 설정(`WebConfig`)을 재사용하여, 개발자가 기존의 웹 애플리케이션 설정을 거의 변경하지 않고도 Undertow 기반으로 쉽게 전환할 수 있도록 지원합니다.

결론적으로, 이 패키지는 Aspectran에 현대적이고 고성능의 웹 환경 선택지를 제공하여, 경량 독립 실행형 마이크로서비스를 구축하는 데 적합하도록 만드는 것을 목표로 합니다.

## 2. 주요 클래스 및 인터페이스 상세 분석

### `TowService` (인터페이스)

Undertow 기반 웹 서비스를 위한 Aspectran 서비스의 명세입니다. (Tow는 The Other Web의 약자로 추정됩니다.)

**주요 책임 (Key Responsibilities):**
-   `CoreService`를 상속하여 모든 핵심 서비스 기능을 가집니다.
-   Undertow 서버로부터 들어오는 모든 웹 요청을 처리하는 핵심 진입점인 `service(HttpServerExchange exchange)` 메서드를 정의합니다. 이는 서블릿 환경의 `WebService.service(HttpServletRequest, ...)`에 직접적으로 대응됩니다.

### `DefaultTowService` (구현 클래스)

`TowService`의 최종 구현체로, Undertow의 `HttpServerExchange`를 받아 `TowActivity`를 생성하고 실행하는 모든 과정을 담당합니다.

**주요 책임 (Key Responsibilities):**
-   `DefaultCoreService`를 상속하여 완전한 기능을 갖춘 핵심 서비스의 역할을 합니다.
-   Undertow 서버의 핸들러 체인(`Handler Chain`)에 `HttpHandler` 구현체로 연결되도록 설계되었습니다.
-   표준 `WebService`가 사용하는 것과 동일한 `<web>` 설정(`WebConfig`)을 재사용하여 설정의 이식성을 높입니다.

**핵심 메서드 분석:**
-   `service(HttpServerExchange exchange)`: 이 클래스의 핵심 실행 메서드입니다. Undertow의 I/O 스레드에 의해 직접 호출됩니다.
    1.  서비스가 일시 정지 상태인지 확인합니다.
    2.  `HttpServerExchange` 객체로부터 요청 URI와 메서드를 추출합니다.
    3.  요청을 Aspectran이 처리할 수 있는지 확인하고, 처리 대상이 아니면 404 Not Found 응답을 보냅니다.
    4.  Undertow 환경에 특화된 `TowActivity` 인스턴스를 생성하고, `HttpServerExchange` 객체를 전달합니다.
    5.  `activity.prepare()`와 `activity.perform()`을 호출하여 Aspectran의 표준 요청 처리 파이프라인을 구동합니다.
    6.  실행 중 예외가 발생하면 `HttpServerExchange`를 통해 404, 500 등 적절한 HTTP 상태 코드를 클라이언트에게 직접 전송합니다.

### `DefaultTowServiceBuilder` (빌더 클래스)

`DefaultTowService` 인스턴스를 생성하고 설정하는 팩토리 클래스입니다. 프로그래밍 방식으로 임베디드 Undertow 서버를 구성하고 Aspectran을 핸들러로 추가할 때 사용됩니다.

## 3. 다른 패키지와의 상호작용

-   **`com.aspectran.core.service`**: `DefaultCoreService`를 직접 상속하여 Aspectran의 모든 핵심 기능(생명주기, `ActivityContext` 관리 등)을 재사용합니다.
-   **`com.aspectran.undertow.activity`**: `DefaultTowService`는 모든 유효한 요청에 대해 `TowActivity`를 생성합니다. `TowActivity`는 Undertow의 네이티브 I/O 객체와 코어 엔진 사이의 어댑터 역할을 수행합니다.
-   **`io.undertow.server`**: 이 패키지는 Undertow 서버와의 직접적인 연동을 담당합니다. `DefaultTowService`는 `HttpHandler` 인터페이스를 구현하여 Undertow의 핸들러 체인에 연결됩니다.
-   **`com.aspectran.core.context.config`**: `WebConfig` 설정 클래스를 재사용하여, 서블릿 환경과 Undertow 환경 간의 설정 호환성을 유지합니다.

## 4. 패키지 요약 및 아키텍처적 의미

`com.aspectran.undertow.service` 패키지는 Aspectran을 위한 **고성능 서블릿-리스(Servlet-less) 웹 어댑터**입니다. 이 패키지의 가장 큰 아키텍처적 의미는, Aspectran이 전통적인 서블릿 API라는 추상화 계층을 건너뛰고, Undertow 같은 현대적인 비동기 I/O 기반 웹 서버와 직접 통합될 수 있음을 보여준다는 것입니다.

`TowActivity`가 `HttpServerExchange`를 직접 감싸서 처리하는 방식은, 서블릿 API를 사용할 때 발생하는 잠재적인 오버헤드를 줄이고 더 나은 성능을 이끌어낼 수 있습니다. 이는 특히 대량의 요청을 처리해야 하는 마이크로서비스 환경에 매우 적합합니다.

또한, `WebConfig`를 재사용하는 영리한 설계 덕분에, 개발자들은 기존의 Aspectran 웹 애플리케이션을 거의 수정하지 않고도 배포 환경을 서블릿 컨테이너에서 임베디드 Undertow 서버로 손쉽게 전환할 수 있습니다. 이는 Aspectran이 특정 기술에 종속되지 않고, 변화하는 기술 트렌드에 유연하게 적응할 수 있는 뛰어난 아키텍처를 갖추고 있음을 증명합니다.
