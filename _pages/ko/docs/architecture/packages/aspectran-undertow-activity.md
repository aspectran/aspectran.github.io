---
format: plate solid article
sidebar: toc
title: "`com.aspectran.undertow.activity` 패키지 상세 분석"
subheadline: 아키텍처 - 패키지 심층 분석
parent_path: /docs
---

## 1. 설계 목표 및 주요 역할

이 패키지는 `TowService`를 통해 들어온 Undertow의 네이티브 웹 요청(`HttpServerExchange`)을 **실제로 처리하는 `Activity` 구현체**를 제공합니다. 이 패키지는 `web-activity` 패키지와 거의 동일한 역할을 하지만, 대상 기술이 서블릿 API가 아닌 Undertow API라는 점이 다릅니다.

이 패키지의 설계 목표는 다음과 같습니다.

-   **Undertow 실행 환경 구체화**: 추상적인 `CoreActivity`를 상속받아, Undertow 웹 서버 환경에서 HTTP 요청을 처리할 수 있는 `TowActivity`를 제공합니다.
-   **Undertow API의 캡슐화**: Undertow의 핵심 I/O 객체인 `HttpServerExchange`를 Aspectran의 표준 어댑터 인터페이스(`RequestAdapter`, `ResponseAdapter` 등) 뒤로 캡슐화합니다. 이를 통해 `CoreActivity`의 실행 파이프라인은 Undertow의 네이티브 API에 대한 직접적인 의존성을 갖지 않게 됩니다.
-   **Undertow 기반 웹 기능 처리**: 멀티파트 요청(파일 업로드) 파싱 등 웹 환경에 필요한 기능들을 Undertow의 API를 사용하여 처리하는 책임을 가집니다.

결론적으로, 이 패키지는 일반적인 실행 엔진을 Undertow라는 특정 웹 서버 컨텍스트에서 동작할 수 있도록, 필요한 모든 변환과 적응을 수행하는 **특화된 실행기**를 제공하는 것을 목표로 합니다.

## 2. 주요 클래스 상세 분석

### `TowActivity` (구현 클래스)

Undertow 웹 서버 환경을 위한 `Activity`의 최종 구현체입니다. 들어오는 모든 `HttpServerExchange`에 대해 `TowService`에 의해 하나씩 생성됩니다.

**주요 책임 (Key Responsibilities):**
-   `CoreActivity`를 상속하여, Aspectran의 표준 요청 처리 파이프라인(어드바이스, 액션 실행 등)을 모두 상속받습니다.
-   `HttpServerExchange` 객체에 대한 참조를 유지하며, 전체 요청 처리 생명주기 동안 이 객체를 통해 요청을 읽고 응답을 보냅니다.

**핵심 메서드 분석:**
-   `adapt()`: **Undertow 환경을 위한 어댑테이션(Adaptation)의 핵심**입니다. `CoreActivity`의 `perform()` 메서드 초반에 호출되며, `HttpServerExchange` 객체를 Aspectran의 표준 인터페이스로 변환하는 어댑터들을 생성하고 설정합니다.
    -   `TowRequestAdapter`: `HttpServerExchange`를 감싸 `RequestAdapter` 역할을 합니다. 요청 파라미터, 속성, 헤더 등을 `HttpServerExchange`의 API를 통해 읽어오는 표준화된 방법을 제공합니다.
    -   `TowResponseAdapter`: 마찬가지로 `HttpServerExchange`를 감싸 `ResponseAdapter` 역할을 합니다. 응답 데이터를 `HttpServerExchange`의 응답 채널로 보내거나 헤더를 설정하는 표준화된 방법을 제공합니다.
    -   `TowSessionAdapter`: Undertow의 세션 관리 기능을 감싸 `SessionAdapter` 역할을 합니다.
    -   *설계 참고*: 서블릿 환경에서는 `request`와 `response`가 별개의 객체지만, Undertow에서는 `HttpServerExchange`가 요청과 응답 상태를 모두 관리합니다. 따라서 모든 어댑터가 사실상 동일한 `HttpServerExchange` 객체를 참조하는 구조입니다.
-   `parseRequest()`: `WebActivity`와 유사하게, HTTP 요청의 본문(body)을 파싱하는 로직을 수행합니다. `Content-Type`이 `multipart/form-data`일 경우, Undertow의 내장 파서를 사용하여 파일 업로드를 처리합니다.

**다른 클래스와의 상호작용:**
-   `TowService`: `service()` 메서드 내에서 모든 유효한 요청에 대해 `TowActivity`를 생성하고 `prepare()`와 `perform()`을 호출합니다.
-   `CoreActivity`: `TowActivity`는 `CoreActivity`를 상속하여 그 실행 파이프라인을 그대로 사용합니다.
-   `com.aspectran.undertow.adapter` 패키지의 클래스들: `adapt()` 메서드 내에서 이 패키지에 포함된 `TowRequestAdapter`, `TowResponseAdapter` 등을 직접 생성하여 사용합니다.

## 3. 패키지 요약 및 아키텍처적 의미

`com.aspectran.undertow.activity` 패키지와 그 핵심인 `TowActivity` 클래스는 `WebActivity`와 함께 **Aspectran의 환경 적응형 아키텍처**를 보여주는 대표적인 사례입니다.

이 패키지의 가장 큰 아키텍처적 의미는 **코어 로직과 특정 환경 기술의 완벽한 분리**를 다시 한번 증명한다는 점입니다. `CoreActivity`는 자신이 처리하는 요청이 서블릿 API를 통해 온 것인지, Undertow의 `HttpServerExchange`를 통해 온 것인지 전혀 알 필요가 없습니다. `TowActivity`라는 어댑터가 모든 기술적인 차이점을 흡수하고 표준화된 인터페이스를 제공하기 때문입니다.

이러한 설계는 Aspectran이 특정 웹 서버 기술에 종속되지 않는 유연성을 갖게 합니다. 만약 미래에 Netty나 다른 새로운 고성능 서버를 지원해야 한다면, 해당 서버를 위한 새로운 `activity` 및 `service` 패키지를 추가하는 것만으로 비교적 쉽게 확장할 수 있습니다. 이는 Aspectran이 장기적인 기술 변화에 대응할 수 있는 견고하고 확장성 높은 구조를 가지고 있음을 보여줍니다.
