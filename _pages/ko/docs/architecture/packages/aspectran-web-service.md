---
format: plate solid article
sidebar: toc
title: "`com.aspectran.web.service` 패키지 상세 분석"
subheadline: 아키텍처 - 패키지 심층 분석
parent_path: /docs
---

## 1. 설계 목표 및 주요 역할

이 패키지는 Aspectran 프레임워크를 **표준 Java 서블릿(Servlet) 컨테이너 환경**에서 실행하기 위한 핵심 서비스 구현을 제공합니다. 이 패키지의 설계 목표는 다음과 같습니다.

-   **서블릿 API와의 통합**: `HttpServletRequest`, `HttpServletResponse`, `ServletContext` 등 서블릿 API와 Aspectran의 프로토콜에 독립적인 코어 엔진 사이의 완벽한 가교 역할을 합니다.
-   **반응형 요청 처리 모델**: 스스로 작업을 시작하는 데몬 서비스와 달리, 외부(웹 브라우저 등)로부터의 HTTP 요청을 수신하고 이에 반응하여 동작하는 수동적(Reactive) 요청 처리 모델을 구현합니다.
-   **단일 진입점(Single Entry Point) 제공**: 모든 웹 요청을 받아 처리하는 단일 진입점, 즉 프론트 컨트롤러(Front Controller) 역할을 하는 `WebService.service(...)` 메서드를 제공합니다.
-   **정적/동적 자원 처리 분리**: 동적인 요청(트랜슬릿 실행)은 Aspectran이 직접 처리하고, CSS/JS/이미지 등 정적인 자원에 대한 요청은 서블릿 컨테이너의 기본 서블릿(Default Servlet)으로 위임하여 효율성을 높입니다.

결론적으로, 이 패키지는 Aspectran 코어 서비스를 웹 환경에 맞게 확장하고 조정하여, 일반적인 웹 애플리케이션 서버(WAS) 위에서 완벽한 기능을 갖춘 웹 프레임워크로 동작할 수 있도록 하는 것을 목표로 합니다.

## 2. 주요 클래스 및 인터페이스 상세 분석

### `WebService` (인터페이스)

웹 환경에 특화된 Aspectran 서비스의 명세입니다.

**주요 책임 (Key Responsibilities):**
-   `CoreService`를 상속하여 모든 핵심 서비스 기능을 가집니다.
-   웹 요청을 처리하는 단일 진입점인 `service(HttpServletRequest, HttpServletResponse)` 메서드를 정의합니다.
-   `ServletContext`에 접근할 수 있는 `getServletContext()` 메서드를 제공합니다.
-   다른 웹 컴포넌트(JSP, 서블릿 필터 등)가 `ServletContext`를 통해 `WebService` 인스턴스에 쉽게 접근할 수 있도록, 속성 이름으로 사용될 상수를 정의합니다.

### `DefaultWebService` (구현 클래스)

`WebService`의 최종 구현체로, HTTP 요청을 받아 `WebActivity`를 생성하고 실행하는 모든 과정을 담당합니다.

**주요 책임 (Key Responsibilities):**
-   `DefaultCoreService`를 상속하여 완전한 기능을 갖춘 핵심 서비스의 역할을 합니다.
-   `ServletContext`에 대한 참조를 유지하며, 웹 환경에 필요한 설정을 `WebConfig`로부터 읽어들입니다.
-   `DefaultServletHttpRequestHandler`를 통해 정적 자원 요청을 효율적으로 처리합니다.

**핵심 메서드 분석:**
-   `service(HttpServletRequest request, HttpServletResponse response)`: 이 클래스의 심장부입니다. 서블릿 컨테이너로부터의 모든 요청이 이 메서드를 통해 들어옵니다.
    1.  서비스가 일시 정지 상태인지 확인합니다.
    2.  요청 URI를 파싱하여 실행할 트랜슬릿의 이름(`requestName`)을 결정합니다.
    3.  `RequestAcceptor`를 통해 해당 요청을 Aspectran이 처리해야 하는지 확인합니다. 만약 처리 대상이 아니라면, 정적 리소스일 가능성을 염두에 두고 `DefaultServletHttpRequestHandler`로 처리를 위임합니다.
    4.  처리 대상인 경우, `WebActivity` 인스턴스를 생성합니다. 이 `WebActivity`는 `request`와 `response` 객체를 감싸는 어댑터 역할을 합니다.
    5.  `activity.prepare()`를 호출하여 `requestName`에 해당하는 트랜슬릿 규칙을 찾습니다.
    6.  `activity.perform()`을 호출하여 Aspectran의 표준 요청 처리 파이프라인(어드바이스, 액션 실행 등)을 구동합니다.
    7.  실행 중 예외가 발생하면 404, 500 등 적절한 HTTP 오류 코드를 전송하는 예외 처리 로직을 수행합니다.

### `DefaultWebServiceBuilder` (빌더 클래스)

`DefaultWebService` 인스턴스를 생성하고 설정하는 팩토리 클래스입니다.

**주요 책임 (Key Responsibilities):**
-   `ServletContextListener`의 `contextInitialized()` 메서드나, `WebActivityServlet`의 `init()` 메서드와 같이 서블릿 컨테이너의 시작 시점에 호출되도록 설계되었습니다.
-   `web.xml`에 정의된 `<context-param>`이나 `<init-param>`으로부터 Aspectran 설정 파일의 위치(`aspectran.config.file`)를 읽어올 수 있습니다.
-   `WebService` 인스턴스를 생성한 후, `ServiceStateListener`를 통해 `CoreServiceHolder`에 등록하고, 웹소켓(`ServerEndpointExporter`) 지원을 초기화하는 등 웹 환경에 필요한 부가적인 설정 작업을 수행합니다.

## 3. 다른 패키지와의 상호작용

-   **`com.aspectran.core.service`**: `DefaultCoreService`를 직접 상속하여 Aspectran의 모든 핵심 기능(생명주기, `ActivityContext` 관리 등)을 재사용합니다.
-   **`com.aspectran.web.activity`**: `DefaultWebService`는 모든 유효한 요청에 대해 `WebActivity`를 생성합니다. `WebActivity`는 서블릿 API와 코어 엔진 사이의 어댑터 역할을 수행하는 가장 중요한 협력 객체입니다.
-   **`javax.servlet`**: 이 패키지는 서블릿 API와의 직접적인 연동을 담당합니다. `HttpServletRequest`를 받아 `WebActivity`를 생성하고, 그 결과를 `HttpServletResponse`로 출력합니다.

## 4. 패키지 요약 및 아키텍처적 의미

`com.aspectran.web.service` 패키지는 Aspectran을 위한 **서블릿 API 어댑터 계층**이라 할 수 있습니다. 이 패키지 덕분에 프로토콜에 독립적으로 설계된 Aspectran의 코어 엔진이, 특정 기술(서블릿)과 환경(웹 컨테이너)에 종속적인 HTTP 프로토콜과 통신할 수 있게 됩니다.

가장 중요한 아키텍처적 특징은 **`WebActivity`를 통한 추상화**입니다. `WebActivity`가 서블릿의 `request`, `response` 객체를 감싸서 Aspectran 코어가 이해하는 표준 `Activity` 모델로 변환해줍니다. 이로 인해 `CoreActivity`의 실행 파이프라인은 자신이 처리하는 요청이 서블릿으로부터 온 것인지, 셸로부터 온 것인지 전혀 알 필요 없이 동일한 로직을 수행할 수 있습니다. 이는 **환경에 대한 의존성을 완벽하게 분리**하는, 매우 잘 설계된 어댑터 패턴의 예시입니다.

결론적으로, 이 패키지는 Aspectran이 Tomcat, Jetty 등 모든 표준 서블릿 컨테이너 위에서 완전한 기능을 갖춘 엔터프라이즈 웹 프레임워크로 동작할 수 있도록 하는 필수적인 기반을 제공합니다.
