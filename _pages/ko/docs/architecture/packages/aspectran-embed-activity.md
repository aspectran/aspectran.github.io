---
format: plate solid article
sidebar: toc-left
title: "`com.aspectran.embed.activity` 패키지 상세 분석"
headline:
teaser:
---

## 1. 설계 목표 및 주요 역할

이 패키지는 `EmbeddedAspectran` 서비스에서 시작된 프로그래밍 방식의 호출을 **실제로 실행하는 `Activity` 구현체**를 제공합니다. 이 패키지는 `daemon-activity` 패키지와 매우 유사한 역할을 하지만, 내장(embed) 환경이라는 특정 컨텍스트에 맞게 조정되었습니다.

이 패키지의 설계 목표는 다음과 같습니다.

-   **내장 환경의 실행 컨텍스트 구체화**: 추상적인 `CoreActivity`를 상속받아, 다른 Java 애플리케이션에 내장된 환경에서 요청을 처리할 수 있는 `AspectranActivity`를 제공합니다.
-   **프로그래밍 방식 호출의 표준화**: `EmbeddedAspectran`의 `translate()` 메서드를 통해 전달된 `Map` 형태의 파라미터, 속성, 그리고 요청 본문(request body)을 Aspectran 코어 엔진이 이해할 수 있는 표준 요청/응답 형태로 변환하는 어댑터를 제공합니다.

결론적으로, 이 패키지는 `EmbeddedAspectran`이라는 단순화된 퍼사드와 `CoreActivity`라는 복잡한 실행 엔진 사이에서, **데이터와 호출 방식을 변환하고 연결하는 가교 역할**을 수행합니다.

## 2. 주요 클래스 상세 분석

### `AspectranActivity` (구현 클래스)

임베디드 환경을 위한 `Activity`의 최종 구현체입니다. `DefaultEmbeddedAspectran`의 `translate()` 메서드가 호출될 때마다 새로 생성됩니다.

**주요 책임 (Key Responsibilities):**
-   `CoreActivity`를 상속하여, Aspectran의 표준 요청 처리 파이프라인(어드바이스, 액션 실행 등)을 모두 상속받습니다.
-   `translate()` 메서드를 통해 전달된 요청 이름, 메서드, 속성 맵, 파라미터 맵, 그리고 요청 본문(body)을 내부 상태로 유지합니다.
-   임베디드 환경에 특화된 요청/응답/세션 어댑터를 생성하고 관리합니다.

**핵심 메서드 분석:**
-   `adapt()`: **임베디드 환경을 위한 어댑테이션(Adaptation)의 핵심**입니다. `CoreActivity`의 `perform()` 메서드 초반에 호출되어, 프로그래밍 방식의 호출을 표준 인터페이스로 변환합니다.
    -   `AspectranRequestAdapter`: `translate()` 메서드로 전달된 `attributeMap`, `parameterMap`, `body`를 감싸 `RequestAdapter` 역할을 합니다. 특히 `body`를 처리할 수 있다는 점에서 `DaemonRequestAdapter`보다 기능적으로 약간 더 확장되어, 프로그래밍 방식으로 POST/PUT과 같은 요청을 더 쉽게 시뮬레이션할 수 있습니다.
    -   `AspectranResponseAdapter`: 내부적으로 `OutputStringWriter` 또는 `translate()` 호출 시 직접 제공된 `Writer`를 감싸 `ResponseAdapter` 역할을 합니다. 모든 응답 결과는 이 `Writer`에 기록됩니다.
    -   `DefaultSessionAdapter`: 부모 `EmbeddedAspectran` 서비스에 세션 관리가 활성화된 경우, 세션 어댑터를 생성하여 상태 유지를 지원합니다.

**다른 클래스와의 상호작용:**
-   `DefaultEmbeddedAspectran`: `translate()` 메서드 내에서 `AspectranActivity`를 직접 생성하고, 파라미터를 설정한 뒤, `prepare()`와 `perform()`을 호출하여 실행합니다.
-   `CoreActivity`: `AspectranActivity`는 `CoreActivity`를 상속하여 그 실행 파이프라인을 그대로 사용합니다.
-   `com.aspectran.embed.adapter` 패키지의 클래스들: `adapt()` 메서드 내에서 `AspectranRequestAdapter`, `AspectranResponseAdapter`를 직접 생성하여 사용합니다.

## 3. 패키지 요약 및 아키텍처적 의미

`com.aspectran.embed.activity` 패키지는 `daemon` 및 `shell` 환경의 `activity` 패키지들과 함께, Aspectran의 핵심 실행 엔진인 `CoreActivity`가 얼마나 재사용성 높게 설계되었는지를 증명합니다.

`AspectranActivity`는 `EmbeddedAspectran`이라는 사용자 친화적인 퍼사드 뒤에서, 실제 프로그래밍 방식의 호출을 Aspectran의 표준 실행 모델에 맞게 변환하는 모든 궂은일을 처리합니다. 이 어댑터 계층 덕분에, `CoreActivity`는 자신의 실행을 트리거한 것이 HTTP 요청인지, 데몬의 내부 호출인지, 아니면 다른 Java 애플리케이션의 메서드 호출인지 전혀 구분할 필요가 없습니다.

이러한 완벽한 디커플링(decoupling)은 Aspectran을 다른 애플리케이션에 내장하여 특정 기능(템플릿 렌더링, 규칙 기반 로직 실행 등)을 수행하는 서비스 컴포넌트로 사용하는 것을 매우 용이하게 만듭니다. 이는 Aspectran이 단순히 독립적인 애플리케이션 프레임워크를 넘어, **고기능성 임베디드 라이브러리**로서의 역할도 충실히 수행할 수 있도록 하는 핵심적인 아키텍처 설계입니다.
