---
format: plate solid article
sidebar: toc-left
title: "`com.aspectran.shell.activity` 패키지 상세 분석"
headline:
teaser:
---

## 1. 설계 목표 및 주요 역할

이 패키지는 `ShellService`에서 파싱된 커맨드 라인 명령어를 **실제로 실행하는 `Activity` 구현체**를 제공합니다. 이 패키지의 설계 목표는 다음과 같습니다.

-   **대화형 실행 환경 구체화**: 추상적인 `CoreActivity`를 상속받아, 대화형 콘솔 입출력 환경에서 요청을 처리할 수 있는 `ShellActivity`를 제공합니다.
-   **콘솔 입출력의 추상화**: `ShellRequestAdapter`와 `ShellResponseAdapter`를 통해, 커맨드 라인 파라미터와 콘솔 출력을 Aspectran 코어 엔진이 이해할 수 있는 표준 요청/응답 형태로 변환합니다.
-   **대화형 기능 지원**: 트랜슬릿 실행에 필수적인 파라미터가 누락되었을 경우, 사용자에게 직접 입력을 요청하는 프롬프트(prompt) 기능을 제공하여 대화형 경험을 완성합니다.

결론적으로, 이 패키지는 `ShellService`와 `CoreActivity` 사이의 **핵심적인 가교 역할**을 하며, 사용자의 커맨드 라인 입력을 Aspectran의 표준 실행 파이프라인 위에서 동작할 수 있도록 조정하는 책임을 가집니다.

## 2. 주요 클래스 상세 분석

### `ShellActivity` (구현 클래스)

대화형 셸 환경을 위한 `Activity`의 최종 구현체입니다. `ShellService`의 `translate()` 메서드가 호출될 때마다 새로 생성됩니다.

**주요 책임 (Key Responsibilities):**
-   `CoreActivity`를 상속하여, Aspectran의 표준 요청 처리 파이프라인(어드바이스, 액션 실행 등)을 모두 상속받습니다.
-   `TransletCommandLine`으로부터 파싱된 요청 정보와 `ShellConsole`에 대한 참조를 유지합니다.
-   대화형 파라미터 입력, 출력 리다이렉션 등 셸 환경에 특화된 기능을 처리합니다.

**핵심 메서드 분석:**
-   `adapt()`: **셸 환경을 위한 어댑테이션(Adaptation)의 핵심**입니다. `CoreActivity`의 `perform()` 메서드 초반에 호출되어, 커맨드 라인 입력을 표준 인터페이스로 변환합니다.
    -   `ShellRequestAdapter`: `TransletCommandLine`에 포함된 파라미터와 속성을 감싸 `RequestAdapter` 역할을 합니다.
    -   `ShellResponseAdapter`: `ShellService`에서 지정한 출력 `Writer`(일반적으로 콘솔 또는 리다이렉션된 파일)를 감싸 `ResponseAdapter` 역할을 합니다.
-   `preProcedure()`: `perform()` 메서드가 실행되기 전에 호출되어 대화형 입력을 처리하는, `ShellActivity`의 고유한 로직입니다. 만약 `procedural` 모드가 활성화되어 있고, 트랜슬릿 실행에 필수적인 파라미터(`mandatory="true"`)가 누락되었다면, 이 메서드는 `ShellConsole.prompt()`를 호출하여 사용자에게 직접 값을 입력하라는 프롬프트를 띄웁니다.

**다른 클래스와의 상호작용:**
-   `ShellService`: `translate()` 메서드 내에서 `ShellActivity`를 직접 생성하고, 파라미터를 설정한 뒤, `prepare()`와 `perform()`을 호출하여 실행합니다.
-   `CoreActivity`: `ShellActivity`는 `CoreActivity`를 상속하여 그 실행 파이프라인을 그대로 사용합니다.
-   `com.aspectran.shell.console.ShellConsole`: `preProcedure()`에서 대화형 프롬프트를 띄우거나, `ShellResponseAdapter`를 통해 최종 결과를 출력하는 등 모든 콘솔 I/O에 사용됩니다.
-   `com.aspectran.shell.adapter` 패키지의 클래스들: `adapt()` 메서드 내에서 `ShellRequestAdapter`, `ShellResponseAdapter`를 직접 생성하여 사용합니다.

## 3. 패키지 요약 및 아키텍처적 의미

`com.aspectran.shell.activity` 패키지는 Aspectran 아키텍처의 유연성을 보여주는 또 다른 중요한 예시입니다. 이 패키지의 핵심 아키텍처적 의미는 **단순한 어댑테이션을 넘어선, 환경 특화 로직의 확장**에 있습니다.

`WebActivity`나 `DaemonActivity`가 주로 입출력 대상을 변환하는 '어댑터' 역할에 집중하는 반면, `ShellActivity`는 `preProcedure()`라는 고유한 단계를 통해 **대화형 상호작용**이라는 새로운 기능을 `Activity`의 생명주기 안에 통합했습니다. 이는 Aspectran의 `Activity` 모델이 단순히 정해진 파이프라인을 실행하는 것을 넘어, 각 환경의 고유한 요구사항에 맞춰 실행 흐름 자체를 확장할 수 있도록 설계되었음을 보여줍니다.

이러한 설계 덕분에, 개발자는 Aspectran의 핵심 기능을 그대로 활용하면서도, 마치 전용 CLI 라이브러리를 사용하듯 풍부한 상호작용을 제공하는 커맨드-라인 애플리케이션을 손쉽게 구축할 수 있습니다.
