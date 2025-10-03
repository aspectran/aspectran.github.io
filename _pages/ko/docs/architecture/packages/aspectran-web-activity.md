---
title: "`com.aspectran.web.activity` 패키지 상세 분석"
subheadline: 아키텍처 - 패키지 심층 분석
---

## 1. 설계 목표 및 주요 역할

이 패키지는 Aspectran의 코어 실행 엔진(`CoreActivity`)을 **표준 Java 서블릿(Servlet) 환경에 맞게 조정하는 어댑터(Adapter)** 역할을 합니다. 이 패키지의 설계 목표는 다음과 같습니다.

-   **실행 환경의 구체화**: 프로토콜에 독립적인 `CoreActivity`를 상속받아, 서블릿 API(`HttpServletRequest`, `HttpServletResponse`)라는 구체적인 기술과 연동하는 `WebActivity`를 제공합니다.
-   **서블릿 API의 캡슐화**: 서블릿의 요청/응답 객체를 직접 다루는 대신, Aspectran의 표준 어댑터 인터페이스(`RequestAdapter`, `ResponseAdapter`) 뒤로 캡슐화합니다. 이를 통해 `CoreActivity`의 실행 파이프라인은 서블릿 API에 대한 직접적인 의존성을 갖지 않게 됩니다.
-   **웹 전용 기능 처리**: 멀티파트 요청(파일 업로드) 파싱, 요청 인코딩 처리, 비동기 요청 처리(Servlet 3.0+ `AsyncContext`) 등 웹 환경에서만 필요한 기능들을 처리하는 책임을 가집니다.

결론적으로, 이 패키지는 일반적인 실행 엔진을 웹이라는 특정 컨텍스트에서 동작할 수 있도록, 필요한 모든 변환과 적응을 수행하는 **특화된 실행기**를 제공하는 것을 목표로 합니다.

## 2. 주요 클래스 상세 분석

### `WebActivity` (구현 클래스)

서블릿 기반 웹 환경을 위한 `Activity`의 최종 구현체입니다. 들어오는 모든 `HttpServletRequest`에 대해 `WebService`에 의해 하나씩 생성됩니다.

**주요 책임 (Key Responsibilities):**
-   `CoreActivity`를 상속하여, Aspectran의 표준 요청 처리 파이프라인(어드바이스, 액션 실행 등)을 모두 상속받습니다.
-   `HttpServletRequest`와 `HttpServletResponse` 객체에 대한 참조를 유지하며, 전체 요청 처리 생명주기 동안 이들을 관리합니다.
-   웹 관련 기능(멀티파트 파싱, 비동기 처리 등)을 `CoreActivity`의 실행 흐름에 통합합니다.

**핵심 메서드 분석:**
-   `adapt()`: **어댑터 패턴의 핵심 구현부**입니다. `CoreActivity`의 `perform()` 메서드 초반에 호출되며, 서블릿 API 객체들을 Aspectran의 표준 인터페이스로 변환하는 어댑터들을 생성하고 설정합니다.
    -   `HttpServletRequestAdapter`: `HttpServletRequest`를 감싸 `RequestAdapter` 역할을 합니다. 요청 파라미터, 속성, 헤더 등을 읽는 표준화된 방법을 제공합니다.
    -   `HttpServletResponseAdapter`: `HttpServletResponse`를 감싸 `ResponseAdapter` 역할을 합니다. 응답 스트림에 데이터를 쓰거나 헤더를 설정하는 표준화된 방법을 제공합니다.
    -   `HttpSessionAdapter`: `HttpServletRequest.getSession()`을 통해 얻은 `HttpSession`을 감싸 `SessionAdapter` 역할을 합니다.
-   `parseRequest()`: HTTP 요청의 본문(body)을 파싱하는 웹 전용 로직을 수행합니다. 특히 `Content-Type`이 `multipart/form-data`일 경우, `MultipartFormDataParser`를 사용하여 파일 업로드를 포함한 멀티파트 요청을 처리합니다. 이 메서드는 `prepare()` 단계에서 호출됩니다.
-   `isAsync()` / `getAsyncContext()`: 서블릿 3.0의 비동기 처리(`AsyncContext`)를 지원하기 위한 메서드입니다. 트랜슬릿이 `async="true"`로 설정된 경우, 이 메서드들을 통해 비동기 모드로 전환하고 `AsyncContext`를 관리합니다.

**다른 클래스와의 상호작용:**
-   `WebService`: `service()` 메서드 내에서 모든 유효한 요청에 대해 `WebActivity`를 생성하고 `prepare()`와 `perform()`을 호출합니다.
-   `CoreActivity`: `WebActivity`는 `CoreActivity`를 상속하여 그 실행 파이프라인을 그대로 사용합니다. `WebActivity`의 역할은 이 파이프라인이 웹 환경에서 돌아갈 수 있도록 입/출력을 서블릿 API에 맞게 '연결'해주는 것입니다.
-   `com.aspectran.web.adapter` 패키지의 클래스들: `adapt()` 메서드 내에서 이 패키지에 포함된 `HttpServletRequestAdapter`, `HttpServletResponseAdapter` 등을 직접 생성하여 사용합니다.

## 3. 패키지 요약 및 아키텍처적 의미

`com.aspectran.web.activity` 패키지와 그 핵심인 `WebActivity` 클래스는 Aspectran 아키텍처에서 **어댑터 패턴(Adapter Pattern)의 가장 명확한 예시**입니다.

이 패키지의 가장 큰 아키텍처적 의미는 **코어 로직과 특정 환경 기술의 분리**입니다. `CoreActivity`는 '어떻게 요청을 처리할 것인가'라는 추상적인 파이프라인만 정의하고, `WebActivity`는 '서블릿 환경에서 들어온 요청과 응답을 어떻게 그 파이프라인에 맞게 끼워넣을 것인가'라는 구체적인 역할을 담당합니다. 이 분리 덕분에 Aspectran의 핵심 엔진은 서블릿 API의 변경이나 제약에 영향을 받지 않고 안정적으로 유지될 수 있습니다.

또한, `DaemonActivity`, `ShellActivity` 등 다른 환경의 `Activity` 구현체들도 모두 `WebActivity`와 동일한 방식으로 `CoreActivity`를 상속하고 자신만의 어댑터를 구현합니다. 이는 Aspectran이 얼마나 일관되고 재사용성 높은 설계 원칙 위에서 다양한 실행 환경을 지원하는지를 보여주는 좋은 증거입니다.
