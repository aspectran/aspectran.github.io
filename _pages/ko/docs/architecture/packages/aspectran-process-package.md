---
format: plate solid article
sidebar: toc-left
title: "`com.aspectran.core.activity.process` 패키지 상세 분석"
subheadline: 아키텍처 - 패키지 심층 분석
parent_path: /docs
---

## 1. 설계 목표 및 주요 역할

이 패키지는 `Activity`의 실행 파이프라인 내에서, `<contents>`와 `<response>` 블록에 정의된 **실행 가능한 액션(Action)들을 구조화하고 실행하는 책임**을 가집니다. 이 패키지의 설계 목표는 다음과 같습니다.

-   **액션의 표준화**: 모든 구체적인 동작(빈 메소드 호출, 다른 트랜슬릿 포함 등)을 `Executable`이라는 공통 인터페이스(명령 패턴, Command Pattern)로 추상화하여, `Activity`가 일관된 방식으로 모든 종류의 액션을 실행할 수 있도록 합니다.
-   **구조화된 실행 흐름**: 액션들을 담는 컨테이너인 `ActionList`와 `ContentList`를 통해, 설정 파일에 정의된 중첩되고 구조화된 실행 흐름을 메모리 상에서 동일한 트리 구조로 표현합니다. (컴포지트 패턴, Composite Pattern)
-   **실행 결과의 구조화**: 액션 실행 결과를 담는 `ProcessResult` 모델을 두어, 실행된 액션의 구조와 동일한 계층 구조로 결과값을 저장합니다. 이를 통해 후속 액션이나 최종 응답 단계에서 특정 액션의 결과를 ID를 통해 쉽게 참조할 수 있습니다.

결론적으로, 이 패키지는 트랜슬릿의 동적인 처리 로직을 **실행 가능한 객체들의 트리**로 모델링하고, 그 실행 결과를 **예측 가능한 데이터 구조**로 남기는 역할을 수행합니다.

## 2. 주요 클래스 및 인터페이스 상세 분석

### `process` 하위 패키지: 액션 컨테이너

-   **`ActionList` (클래스):**
    -   **한마디로:** `Executable` 액션들의 순서 있는 리스트입니다.
    -   **주요 책임:** 트랜슬릿 내에서 순차적으로 실행되어야 할 일련의 작업 단위를 표현합니다. `<contents>`나 `<when>` 블록처럼, 여러 액션을 자식으로 포함하는 컨테이너 역할을 합니다.

-   **`ContentList` (클래스):**
    -   **한마디로:** `ActionList`들을 담는 한 단계 더 상위의 컨테이너입니다.
    -   **주요 책임:** 트랜슬릿의 `<contents>`나 `<response>`와 같이 이름(name)을 가질 수 있는 논리적인 최상위 실행 블록을 표현합니다. `ProcessResult` 내에서 `ContentResult`와 1:1로 매칭됩니다.

### `process.action` 하위 패키지: 구체적인 액션 구현체

-   **`Executable` (인터페이스):**
    -   **한마디로:** 모든 '액션'이 구현해야 하는 **'명령(Command)'** 계약입니다.
    -   **핵심 메서드 분석:**
        -   `execute(Activity activity)`: 액션의 실제 로직을 수행하는 메서드입니다. 현재 실행중인 `Activity`를 인자로 받아, 필요한 모든 컨텍스트 정보(빈, 파라미터 등)에 접근할 수 있습니다. 반환값은 `ActionResult`에 저장됩니다.
        -   `getActionId()`: 액션의 고유 ID를 반환합니다. 이 ID는 `ProcessResult`에서 결과값을 찾는 키로 사용됩니다.

-   **`InvokeAction` (클래스):**
    -   **한마디로:** 지정된 빈(Bean)의 특정 메서드를 호출하는 가장 기본적이고 중요한 액션입니다.
    -   **다른 클래스와의 상호작용:** `execute()` 메서드가 호출되면, `Activity`를 통해 `BeanRegistry`에 접근하여 `beanId`에 해당하는 빈 인스턴스를 찾습니다. 그 후, Java의 리플렉션(Reflection)을 사용하여 `methodName`에 해당하는 메서드를 찾아 인자(`arguments`)와 함께 실행합니다.

-   **`IncludeAction` (클래스):**
    -   **한마디로:** 다른 트랜슬릿의 처리 내용을 현재 위치에 '포함'시키는 액션입니다.
    -   **핵심 메서드 분석:** `execute()`가 호출되면, `transletName`에 해당하는 `TransletRule`을 찾은 후, 현재 `Activity`의 자식으로 새로운 `Activity`를 생성하여 실행합니다. 이를 통해 트랜슬릿의 공통 로직을 모듈화하고 재사용할 수 있습니다.

-   **`ChooseAction` (클래스):**
    -   **한마디로:** `<choose>`-`<when>`-`<otherwise>` 구문을 실행하는 조건부 액션입니다.
    -   **핵심 메서드 분석:** `execute()`는 `ChooseRule`에 정의된 여러 `WhenRule`들을 순차적으로 평가합니다. 각 `WhenRule`의 `test` 표현식(AsEL)을 실행하여 처음으로 `true`가 되는 `ActionList`를 찾아 실행합니다. 모든 `when` 조건이 거짓이면 `otherwise`에 정의된 `ActionList`를 실행합니다.

-   **`EchoAction` / `HeaderAction` (클래스):**
    -   **한마디로:** 각각 응답 본문(body)과 헤더(header)에 직접 내용을 출력하는 액션입니다.
    -   **다른 클래스와의 상호작용:** `EchoAction`은 `Activity`의 `ResponseAdapter`를 통해 응답 스트림에 직접 데이터를 씁니다. `HeaderAction` 역시 `ResponseAdapter`를 통해 응답 헤더를 추가하거나 수정합니다.

### `process.result` 하위 패키지: 액션 결과 모델

-   **`ProcessResult` (클래스):**
    -   **한마디로:** 단일 `Activity` 생명주기 동안 실행된 모든 액션의 결과를 담는 최상위 컨테이너입니다.
    -   **주요 책임:** 내부에 `ContentResult`의 맵(`contentResultMap`)을 가집니다. `ActivityData`는 이 `ProcessResult`를 참조하여, 개발자가 `#{actionId}` 같은 표현식으로 액션 결과에 접근할 수 있도록 합니다.

-   **`ContentResult` / `ActionResult` (클래스):**
    -   `ContentResult`는 이름있는 `<contents>` 블록의 실행 결과를 담으며, 내부에 `ActionResult`의 리스트를 가집니다.
    -   `ActionResult`는 개별 `Executable` 액션 하나의 실행 결과를 캡슐화합니다. `actionId`와 실제 반환된 값(`resultValue`)을 저장합니다.

## 3. 패키지 요약 및 아키텍처적 의미

`com.aspectran.core.activity.process` 패키지는 트랜슬릿의 동적인 실행 로직을 구체화하는 핵심적인 부분입니다. 이 패키지의 아키텍처적 의미는 다음과 같습니다.

-   **명령 패턴(Command Pattern)의 적극적인 활용**: 모든 실행 단위를 `Executable` 인터페이스로 추상화함으로써, `CoreActivity`의 실행 파이프라인은 어떤 종류의 액션이 오는지 전혀 신경 쓸 필요 없이 일관된 `execute()` 메서드만 호출하면 됩니다. 이는 새로운 종류의 액션을 추가하기 매우 쉬운 유연하고 확장성 높은 구조를 만듭니다.

-   **실행과 결과의 분리**: 액션의 실행 로직(`action` 패키지)과 그 결과를 저장하는 데이터 모델(`result` 패키지)을 명확하게 분리했습니다. 이 덕분에 액션들은 서로 직접 의존할 필요 없이, `ProcessResult`라는 공유된 결과 저장소를 통해 느슨하게 결합(loosely coupled)됩니다. 한 액션이 결과를 `ProcessResult`에 저장하면, 후속 액션은 그 결과를 ID로 꺼내 쓰는 방식으로 데이터 파이프라인을 구성할 수 있습니다.

결론적으로, 이 패키지는 Aspectran의 선언적인 설정이 실제 실행 가능한 객체들의 동적인 트리 구조로 변환되고, 그 결과가 다시 예측 가능한 데이터 구조로 기록되는 과정을 책임지는 정교한 메커니즘이라 할 수 있습니다.
