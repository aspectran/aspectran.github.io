---
format: plate solid article
sidebar: toc
title: 요청(Request) 및 응답(Response) 처리 메커니즘
subheadline: 아키텍처
parent_path: /docs
---

Aspectran 프레임워크는 `Activity`의 생명 주기 동안 들어오는 요청을 처리하고 적절한 응답을 생성하기 위한 강력하고 유연한 메커니즘을 제공합니다. 이 메커니즘은 핵심 추상화와 각 실행 환경에 특화된 구체적인 확장으로 구성됩니다.

## 1. 요청 처리 (Request Handling)

요청 처리는 외부의 입력을 Aspectran이 이해할 수 있는 데이터 구조로 변환하고 파싱하는 과정입니다.

### 1.1. 핵심 요청 처리: `com.aspectran.core.activity.request`

이 패키지는 `Activity` 내에서 들어오는 요청 데이터를 캡처하고, 파싱하며, 사용할 수 있도록 하는 기본 구성 요소와 추상화를 정의합니다.

-   **`AbstractRequest`**: 모든 요청 구현의 기반이 되는 추상 클래스로, 파라미터, 속성, 헤더, 요청 본문 등 공통 데이터에 대한 접근 및 관리 기능을 제공합니다.
-   **`ParameterMap` / `FileParameterMap`**: 요청 파라미터와 업로드된 파일을 저장하고 관리하는 특수 `Map` 구현체입니다.
-   **`PathVariableMap`**: RESTful API 등에서 사용되는 경로 변수(예: `/users/{userId}`)를 파싱하여 저장합니다.
-   **`RequestBodyParser`**: `application/x-www-form-urlencoded`, `application/json` 등 다양한 `Content-Type`의 요청 본문을 파싱하여 `ParameterMap`으로 변환하는 유틸리티입니다.

### 1.2. 웹 특정 요청 처리: `com.aspectran.web.activity.request`

웹 환경에서는 `com.aspectran.core.activity.request`의 기능을 확장하고 `jakarta.servlet` API와 통합하여 HTTP 요청의 복잡한 측면을 처리합니다.

-   **`MultipartFormDataParser`**: 파일 업로드를 포함하는 `multipart/form-data` 형식의 요청을 파싱하는 인터페이스입니다. 최대 요청/파일 크기, 임시 저장 경로 등을 설정할 수 있습니다.
-   **`WebRequestBodyParser`**: `MultipartFormDataParser`를 활용하여 멀티파트 요청을 포함한 모든 웹 요청 본문을 파싱하는 정적 유틸리티 클래스입니다.

## 2. 응답 처리 (Response Handling)

응답 처리는 `Activity`의 실행 결과를 클라이언트나 다음 처리 단계로 전달하는 과정입니다. Aspectran은 여러 응답 전략을 제공합니다.

### 2.1. 핵심 응답 유형 (`com.aspectran.core.activity.response`)

-   **`Response` (인터페이스)**: 모든 응답 유형의 기본 계약으로, `respond(Activity activity)` 메서드를 통해 실제 응답 생성을 담당합니다.

-   **`ForwardResponse`**: 서버 내부의 다른 리소스(다른 트랜슬릿, JSP 등)로 요청을 전달(Forward)합니다. 클라이언트의 URL은 변경되지 않습니다.
    -   **설정 예시**: `<forward translet="/user/detail" />`

-   **`RedirectResponse`**: 클라이언트에게 지정된 URL로 재요청하라는 HTTP 리다이렉트(3xx 상태 코드) 응답을 보냅니다. `FlashMap`을 사용하여 리다이렉트 요청 간에 임시 데이터를 전달할 수 있습니다.
    -   **설정 예시**: `<redirect path="/login?error=1" />`

### 2.2. 뷰 렌더링: `...response.dispatch`

이 패키지는 처리 결과를 특정 뷰 기술(JSP, Pebble, FreeMarker 등)과 통합하여 최종 UI를 생성하는 역할을 합니다.

-   **`ViewDispatcher` (인터페이스)**: 특정 뷰 기술로 디스패치하기 위한 계약입니다. 각 뷰 기술마다 별도의 구현체(예: `PebbleViewDispatcher`)가 존재합니다.
-   **`DispatchResponse`**: 디스패치 응답을 나타내는 `Response` 구현체입니다. 이 클래스는 설정된 `DispatchRule`에 따라 적절한 `ViewDispatcher` 빈을 찾아 렌더링 작업을 위임하는 **중재자** 역할을 합니다.
    -   **설정 예시**: `<dispatch name="user/list.peb" contentType="text/html"/>`

### 2.3. 데이터 변환: `...response.transform`

이 패키지는 `Activity`의 처리 결과를 JSON, XML, TEXT 등 다양한 데이터 형식으로 변환하여 RESTful API 응답 등을 생성하는 데 사용됩니다.

-   **`TransformResponse` (추상 클래스)**: 모든 변환 응답의 기반이 되며, `Activity`의 `ProcessResult`를 특정 출력 형식으로 변환하는 로직을 정의합니다.
-   **구체적인 구현체**: `JsonTransformResponse`, `XmlTransformResponse`, `AponTransformResponse`, `TextTransformResponse` 등이 제공됩니다.
-   **`TransformResponseFactory`**: `<transform>` 설정 규칙(`TransformRule`)에 따라 적절한 `TransformResponse` 객체를 생성하는 팩토리입니다.
    -   **설정 예시**: `<transform type="json" indent="true"/>` (결과를 보기 좋게 들여쓴 JSON으로 변환)

### 2.4. 웹 특화 응답: `com.aspectran.web.activity.response`

이 패키지는 웹, 특히 RESTful 서비스에 특화된 응답 처리 기능을 제공합니다.

-   **`RestResponse` (인터페이스)**: REST 리소스에 대한 HTTP 응답을 나타내는 기본 계약입니다. 응답 데이터, 콘텐츠 유형, HTTP 상태 코드 및 헤더를 세밀하게 제어하는 메서드를 정의합니다.
-   **`DefaultRestResponse`**: `RestResponse`의 구체적인 구현체로, APON, JSON, XML 데이터 유형을 지원하며, `Activity`의 데이터를 이러한 형식으로 변환하여 응답으로 전송하는 로직을 포함합니다. 클라이언트의 `Accept` 헤더를 분석하여 적절한 데이터 형식을 자동으로 선택하는 **콘텐츠 협상(Content Negotiation)** 기능도 지원합니다.

## 3. 결론

Aspectran의 요청 및 응답 처리 메커니즘은 핵심적인 추상화와 각 환경 및 사용 사례에 특화된 확장을 통해 매우 유연하고 강력한 애플리케이션 개발을 가능하게 합니다. 요청 데이터를 다양한 소스에서 일관되게 처리하고, 응답을 여러 전략(포워드, 리다이렉트, 변환, 디스패치)으로 생성할 수 있도록 설계되어 있어, 개발자가 복잡한 비즈니스 로직과 다양한 클라이언트 요구 사항을 효과적으로 충족시킬 수 있도록 지원합니다.