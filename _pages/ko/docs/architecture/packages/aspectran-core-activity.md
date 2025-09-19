---
format: plate solid article
sidebar: toc
title: "`com.aspectran.core.activity` 패키지 상세 분석"
subheadline: 아키텍처 - 패키지 심층 분석
parent_path: /docs
---

## 1. 설계 목표 및 주요 역할

이 패키지는 Aspectran의 **요청 처리 실행 엔진**의 핵심을 이룹니다. 이 패키지의 설계 목표는 다음과 같습니다.

-   **요청 처리의 표준화**: 웹 요청, 셸 명령, 데몬 호출 등 어떤 종류의 요청이든 일관된 파이프라인을 통해 처리하기 위한 표준 실행 모델(`Activity`)을 정의합니다.
-   **실행 환경과의 분리**: 어댑터 패턴(Adapter Pattern)을 사용하여, 요청을 처리하는 핵심 로직(`CoreActivity`)이 서블릿, 셸 콘솔 등 구체적인 실행 환경에 대한 의존성 없이 독립적으로 동작하도록 합니다.
-   **단일 요청 생명주기 관리**: `Activity` 인스턴스는 단일 요청이 발생해서 응답이 완료될 때까지의 전체 생명주기를 관리하는 중앙 제어 객체(Controller) 역할을 합니다.
-   **사용자 코드와의 명확한 경계**: 개발자가 작성하는 비즈니스 로직(Action)이 프레임워크의 복잡한 내부 구조를 직접 다루지 않도록, `Translet`이라는 단순화된 퍼사드(Facade)를 통해 요청 컨텍스트와 상호작용하도록 합니다.

결론적으로, 이 패키지는 다양한 종류의 요청을 일관된 방식으로 처리하고, 프레임워크의 핵심 실행 로직과 외부 환경을 분리하며, 개발자에게는 사용하기 쉬운 API를 제공하는 것을 목표로 합니다.

## 2. 주요 클래스 및 인터페이스 상세 분석

### `Activity` (인터페이스)

단일 요청-응답 생명주기 동안의 모든 처리를 관장하는 중앙 실행 엔진의 명세입니다.

**주요 책임 (Key Responsibilities):**
-   애플리케이션 전역 컨텍스트인 `ActivityContext`에 대한 접근을 제공합니다.
-   실행 환경을 추상화하는 어댑터들(`RequestAdapter`, `ResponseAdapter`, `SessionAdapter`)에 접근하는 메서드를 정의합니다.
-   요청 처리 중 발생한 예외(`raisedException`)를 관리하고, 처리 흐름을 제어(`terminate`)합니다.
-   AsEL 표현식 평가기(`TokenEvaluator`, `ItemEvaluator`)에 대한 접근을 제공합니다.

### `CoreActivity` (추상 클래스)

`Activity`의 핵심 구현으로, `Translet` 규칙을 실행하는 표준 파이프라인을 정의합니다.

**주요 책임 (Key Responsibilities):**
-   요청을 처리하기 위한 전체 과정을 준비(`prepare`)하고 수행(`perform`)합니다.
-   `Translet` 인스턴스, `ActivityData`, `Response` 객체 등 요청 처리 중에 필요한 핵심 객체들을 관리합니다.
-   `FlashMapManager`와 연동하여 리다이렉트 시 속성을 전달하는 기능을 지원합니다.

**핵심 메서드 분석:**
-   `perform()`: Aspectran의 **핵심 요청 처리 파이프라인**입니다. 이 메서드가 호출되면 다음의 과정이 순차적으로 일어납니다.
    1.  요청/응답 객체를 어댑터를 통해 표준화합니다.
    2.  `BEFORE` 어드바이스를 실행합니다.
    3.  `<contents>`에 정의된 액션들을 순차적으로 실행(`dispatchContent()`)합니다.
    4.  `<response>` 규칙에 따라 응답을 처리합니다. (포워드, 리다이렉트, 변환 등)
    5.  `AFTER` 어드바이스를 실행합니다.
    6.  예외가 발생했다면 `THROWN` 어드바이스를 실행합니다.
    7.  성공/실패 여부와 관계없이 `FINALLY` 어드바이스를 실행합니다.
    8.  최종적으로 응답을 완료(`response.end()`)합니다.

### `Translet` (인터페이스)

개발자가 작성하는 액션 코드의 관점에서, 현재 처리 중인 요청과 상호작용하기 위한 **단순화된 API 퍼사드(Facade)**입니다.

**주요 책임 (Key Responsibilities):**
-   요청 파라미터(`getParameter`), 속성(`getAttribute`), 파일 파라미터(`getFileParameter`) 등에 대한 쉬운 접근을 제공합니다.
-   응답 흐름을 제어하는 메서드(`transform`, `dispatch`, `forward`, `redirect`)를 노출하여, 액션 코드 내에서 동적으로 응답 방식을 결정할 수 있게 합니다.
-   실행된 액션들의 결과(`ProcessResult`)에 접근할 수 있게 합니다.
-   `getBean()`, `getMessage()` 등 `ActivityContext`의 주요 기능들을 위임받아 제공합니다.

### `CoreTranslet` (구현 클래스)

`CoreActivity` 내에서 사용되는 `Translet`의 구체적인 구현체입니다. `Translet` 인터페이스의 모든 메서드 호출을 자신을 생성한 `CoreActivity` 인스턴스 또는 관련 어댑터에 위임하는 방식으로 동작합니다.

### `ActivityData` (클래스)

요청 처리 중에 접근 가능한 모든 데이터를 단일 뷰로 통합하여 제공하는 맵(Map)과 유사한 퍼사드입니다.

**주요 책임 (Key Responsibilities):**
-   요청 파라미터, 요청 속성, 세션 속성, 액션 결과(`ProcessResult`) 등 여러 곳에 흩어져 있는 데이터를 하나의 객체를 통해 조회할 수 있게 합니다.
-   `#{...}` AsEL 표현식을 통해 데이터에 접근할 때, 이 `ActivityData`가 주요 검색 대상이 됩니다.
-   실제 데이터는 요청받는 시점에 원본 소스(Request, Session 등)에서 가져오는 지연 로딩(lazy loading) 방식을 사용합니다.

### `FlashMap` 및 `FlashMapManager`

Post/Redirect/Get (PRG) 패턴을 지원하기 위해, 리다이렉트가 일어날 때 현재 요청의 속성을 다음 요청으로 전달하는 메커니즘입니다. `FlashMapManager`가 `FlashMap` 객체를 세션 등에 임시로 저장했다가, 다음 요청 시 읽어서 `ActivityData`에 통합해 줍니다.

### `InstantActivity` (클래스)

기존의 `Activity` 흐름 내에서, 짧은 생명주기를 갖는 작업을 즉시 실행하기 위한 경량 `Activity`입니다. 예를 들어, `render()`나 `execute()` 같은 프로그래밍 방식의 호출을 처리할 때 내부적으로 사용됩니다. 부모 `Activity`의 상태(세션 등)를 상속받아 실행될 수 있습니다.

## 3. 패키지 요약 및 아키텍처적 의미

`com.aspectran.core.activity` 패키지는 Aspectran의 **실행 엔진** 그 자체입니다. 이 패키지의 가장 중요한 아키텍처적 결정은 **`Activity`와 `Translet`의 역할을 분리**한 것입니다.

-   **`Activity`**: 프레임워크 내부의 복잡한 실행 흐름, 어드바이스 연동, 예외 처리, 생명주기 관리 등 강력하지만 복잡한 '엔진'의 역할을 담당합니다.
-   **`Translet`**: 개발자에게 노출되는 단순하고 직관적인 'API' 역할을 합니다.

이러한 분리 덕분에 개발자는 프레임워크의 복잡한 내부 동작을 알 필요 없이, `Translet`이라는 간단한 인터페이스만으로도 Aspectran의 모든 기능을 활용할 수 있습니다. 또한, `RequestAdapter`, `ResponseAdapter`를 통해 실행 환경을 완벽하게 추상화함으로써, 동일한 `CoreActivity` 파이프라인이 웹, 셸, 데몬 등 어떤 환경에서도 재사용될 수 있는 유연성을 확보했습니다. 이는 Aspectran 아키텍처의 높은 모듈성과 확장성의 근간이 됩니다.
