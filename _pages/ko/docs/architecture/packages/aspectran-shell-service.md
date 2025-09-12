---
format: plate solid article
sidebar: toc-left
title: "`com.aspectran.shell.service` 패키지 상세 분석"
headline:
teaser:
---

## 1. 설계 목표 및 주요 역할

이 패키지는 Aspectran을 **대화형 커맨드-라인 셸(Interactive Command-Line Shell)**로 실행하기 위한 특화된 서비스 구현을 제공합니다. 이 패키지의 설계 목표는 다음과 같습니다.

-   **대화형 CLI 환경 제공**: 사용자가 직접 명령어를 입력하고 결과를 콘솔에서 확인할 수 있는 완전한 대화형 CLI 애플리케이션을 구축하는 기반을 제공합니다.
-   **사용자 입력 기반의 실행 모델**: 외부 HTTP 요청이나 내부 프로그래밍 호출이 아닌, 콘솔을 통한 **사용자의 직접적인 명령어 입력**에 의해 구동되는 실행 모델을 구현합니다.
-   **콘솔 입출력의 추상화**: `ShellConsole` 인터페이스를 통해, 실제 콘솔(JLine, 시스템 콘솔 등)과의 상호작용을 추상화하여 서비스 로직이 특정 콘솔 기술에 종속되지 않도록 합니다.
-   **사용자 친화적 셸 기능 지원**: 명령어 히스토리, 환영/도움말 메시지, 출력 리다이렉션(`>`) 등 일반적인 셸 환경에서 기대할 수 있는 다양한 편의 기능을 제공합니다.

결론적으로, 이 패키지는 Aspectran의 강력한 백엔드 기능을 관리하거나 테스트할 수 있는 대화형 관리 도구를 만드는 것을 목표로 합니다.

## 2. 주요 클래스 및 인터페이스 상세 분석

### `ShellService` (인터페이스)

대화형 셸 환경에 특화된 Aspectran 서비스의 명세입니다.

**주요 책임 (Key Responsibilities):**
-   `CoreService`를 상속하여 모든 핵심 서비스 기능을 가집니다.
-   콘솔 입출력을 담당하는 `ShellConsole`에 대한 접근(`getConsole()`)을 제공합니다.
-   환영 메시지, 도움말 출력 등 셸의 UI와 관련된 메서드를 정의합니다.
-   파싱된 커맨드 라인(`TransletCommandLine`)을 받아 트랜슬릿을 실행하는 핵심 진입점인 `translate(...)` 메서드를 정의합니다.

### `DefaultShellService` (구현 클래스)

`ShellService`의 최종 구현체로, 사용자로부터 명령어를 입력받아 `ShellActivity`를 생성하고 실행하는 모든 과정을 담당합니다.

**주요 책임 (Key Responsibilities):**
-   `DefaultCoreService`를 상속하여 완전한 기능을 갖춘 핵심 서비스의 역할을 합니다.
-   `ShellConsole`에 대한 참조를 유지하며 모든 사용자 상호작용에 이를 사용합니다.
-   `ShellConfig`로부터 셸 전용 설정(환영 메시지, 프롬프트 등)을 읽어와 반영합니다.

**핵심 메서드 분석:**
-   `translate(TransletCommandLine tcl)`: 이 클래스의 핵심 실행 메서드입니다. 셸의 메인 루프가 사용자의 입력을 파싱하여 `TransletCommandLine` 객체를 생성한 후, 이 메서드를 호출합니다.
    1.  `TransletCommandLine` 객체로부터 실행할 트랜슬릿 이름, HTTP 메서드(가상), 파라미터, 속성 등을 추출합니다.
    2.  사용자가 명령어에 지정한 출력 리다이렉션(예: `> output.log`)을 확인하고, 결과가 출력될 `Writer`를 결정합니다. (리다이렉션이 없으면 콘솔 `Writer`)
    3.  셸 환경에 특화된 `ShellActivity` 인스턴스를 생성합니다.
    4.  `ShellActivity`에 요청 정보와 결정된 출력 `Writer`를 설정합니다.
    5.  `activity.prepare()`와 `activity.perform()`을 호출하여 Aspectran의 표준 요청 처리 파이프라인을 구동합니다.
    6.  비동기 실행(`--async` 옵션)을 지원하며, 이 경우 `CompletableFuture`를 사용하여 백그라운드에서 작업을 처리합니다.

### `DefaultShellServiceBuilder` (빌더 클래스)

`DefaultShellService` 인스턴스를 생성하고 설정하는 팩토리 클래스입니다.

**주요 책임 (Key Responsibilities):**
-   `AspectranConfig`와 `ShellConsole` 구현체를 받아 `DefaultShellService`를 인스턴스화합니다.
-   `ServiceStateListener`를 설정하여, 서비스 생명주기를 `CoreServiceHolder`와 연동시킵니다.
-   서비스 시작 시, 화면 정리, 환영 메시지 및 도움말 출력 등 초기 콘솔 환경을 구성하는 역할을 담당합니다.

## 3. 다른 패키지와의 상호작용

-   **`com.aspectran.core.service`**: `DefaultCoreService`를 직접 상속하여 Aspectran의 모든 핵심 기능(생명주기, `ActivityContext` 관리 등)을 재사용합니다.
-   **`com.aspectran.shell.activity`**: `DefaultShellService`는 모든 유효한 명령어에 대해 `ShellActivity`를 생성합니다. `ShellActivity`는 콘솔 입출력과 코어 엔진 사이의 어댑터 역할을 수행합니다.
-   **`com.aspectran.shell.console`**: `ShellConsole` 인터페이스를 통해 모든 콘솔 입출력을 처리합니다. 이를 통해 `DefaultShellService`는 실제 콘솔 구현(예: `JLineShellConsole`)에 대해 알 필요가 없습니다.
-   **`com.aspectran.shell.command`**: 셸의 메인 루프는 이 패키지의 `CommandParser`를 사용하여 사용자 입력 문자열을 `TransletCommandLine` 객체로 변환합니다.

## 4. 패키지 요약 및 아키텍처적 의미

`com.aspectran.shell.service` 패키지는 Aspectran 프레임워크를 **대화형 CLI 애플리케이션 프레임워크**로 변모시킵니다. 이는 수동적인 웹 서비스 모델이나 능동적인 데몬 서비스 모델과는 또 다른, **사용자 주도적인(user-driven) 상호작용 모델**을 구현했다는 점에서 아키텍처의 유연성을 잘 보여줍니다.

`TransletCommandLine` 객체는 셸 환경의 요청 정보를 담는 DTO(Data Transfer Object) 역할을 하여, 명령어 파싱 로직과 실행 로직을 분리합니다. 또한 `ShellConsole` 인터페이스는 콘솔이라는 외부 I/O 장치를 추상화하여, 서비스 로직이 특정 콘솔 기술에 종속되지 않도록 합니다.

이 패키지를 통해 개발자는 Aspectran이 관리하는 모든 빈과 비즈니스 로직(트랜슬릿)을 터미널에서 직접 호출하고 제어할 수 있는 강력한 관리 도구나 테스트 클라이언트를 쉽게 구축할 수 있습니다.
