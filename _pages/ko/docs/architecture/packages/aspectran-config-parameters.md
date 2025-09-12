---
format: plate solid article
sidebar: toc-left
title: "`com.aspectran.core.context.config` 패키지 상세 분석"
headline:
teaser:
---

## 1. 설계 목표 및 주요 역할

이 패키지는 Aspectran 프레임워크의 모든 설정 값을 담는 **타입-안전(type-safe) 데이터 컨테이너 클래스들의 집합**입니다. 이 패키지의 설계 목표는 다음과 같습니다.

-   **설정의 객체화**: XML 또는 APON 형식의 외부 설정 파일 내용을 파싱하여, 자바 코드에서 쉽게 접근하고 사용할 수 있는 객체 모델로 변환합니다.
-   **계층적 구성**: `AspectranConfig`를 최상위 루트로 하여, 각 기능 및 환경별 설정을 담는 객체들이 계층적인 구조를 이룹니다. 이를 통해 전체 설정의 관계를 명확하게 파악할 수 있습니다.
-   **모듈성 및 분리**: 웹, 데몬, 셸 등 각 실행 환경에 특화된 설정을 별도의 클래스(`WebConfig`, `DaemonConfig` 등)로 분리하여, 특정 환경에 대한 의존성을 낮추고 설정의 모듈성을 높입니다.
-   **불변성(Immutability) 지향**: 설정 클래스들은 일단 `ActivityContextBuilder`에 의해 사용되어 컨텍스트가 빌드된 후에는 변경되지 않는 것을 전제로 설계되었습니다. 이는 런타임 시의 설정값의 일관성과 예측 가능성을 보장합니다.

결론적으로, 이 패키지는 텍스트 기반의 설정 파일을 프레임워크가 이해하고 사용할 수 있는 **구조화된 객체 모델로 변환하는 역할**을 수행하며, 설정 소스(XML/APON)와 설정을 사용하는 컴포넌트 간의 디커플링을 담당합니다.

## 2. 주요 클래스 상세 분석

### `AspectranConfig` (클래스)

Aspectran 전체 설정의 최상위 루트 컨테이너입니다.

**주요 책임 (Key Responsibilities):**
-   모든 하위 설정 객체들(`ContextConfig`, `WebConfig`, `DaemonConfig` 등)에 대한 참조를 유지합니다.
-   애플리케이션의 기본 인코딩(`encoding`)이나 자동 리로드 스캔 주기(`scanIntervalSeconds`) 같은 전역적인 기본값을 가질 수 있습니다.

**다른 클래스와의 상호작용:**
-   `AspectranConfigReader`와 같은 파서에 의해 생성되고 채워집니다.
-   `DefaultCoreService`가 생성될 때 생성자의 인자로 전달되어, `ActivityContextBuilder`가 컨텍스트를 빌드하는 데 필요한 모든 설정 정보의 시작점이 됩니다.

### `ContextConfig` (클래스)

실행 환경에 관계없이 모든 Aspectran 애플리케이션에 공통적으로 적용되는 가장 핵심적인 설정을 담습니다.

**주요 책임 (Key Responsibilities):**
-   `ActivityContext`의 핵심 동작 방식을 정의하는 필수 정보를 관리합니다.

**핵심 속성 분석:**
-   `basePath`: 애플리케이션의 기준 경로를 지정합니다. 모든 상대 경로는 이 경로를 기준으로 해석됩니다.
-   `contextRules`: Aspectran의 핵심 규칙(`bean`, `translet` 등)이 정의된 설정 파일 또는 리소스의 경로를 지정합니다. 여러 개를 지정할 수 있습니다.
-   `basePackages`: `@Component` 어노테이션이 붙은 클래스를 자동으로 스캔하여 빈으로 등록할 때, 검색을 시작할 기준 패키지를 지정합니다.
-   `profiles`: 활성화할 프로파일을 지정합니다. `activeProfiles`와 `defaultProfiles`로 나뉘며, `activeProfiles`가 우선적으로 적용됩니다.
-   `autoReload`: `true`로 설정하면, `contextRules`에 지정된 설정 파일이 변경되었을 때 애플리케이션을 재시작하지 않고도 변경 사항을 자동으로 반영하는 핫-리로딩(Hot-Reloading) 기능을 활성화합니다.

### `WebConfig` / `DaemonConfig` / `ShellConfig` / `EmbedConfig` (클래스)

각각의 실행 환경에 특화된 설정을 담는 클래스들입니다.

**주요 책임 (Key Responsibilities):**
-   **`WebConfig`**: 웹 애플리케이션으로 실행될 때 필요한 설정을 관리합니다. `sessionConfig`를 통해 세션 관리 방식을 상세히 설정하거나, `uriDecoding`으로 URI 문자 인코딩을 지정하고, `trailingSlashRedirect`로 URL 끝의 슬래시(/)를 어떻게 처리할지 등을 정의합니다.
-   **`DaemonConfig`**: 백그라운드 데몬으로 실행될 때 필요한 설정을 관리합니다. `commandExecutor`를 통해 데몬이 실행할 명령어 스크립트를 정의하거나, `polling` 설정을 통해 특정 주기로 작업을 반복 실행하도록 설정할 수 있습니다.
-   **`ShellConfig`**: 대화형 셸(CLI)로 실행될 때 필요한 설정을 관리합니다. `greetings`로 시작 메시지를, `prompt`로 프롬프트 모양을, `historyFile`로 명령어 히스토리 파일 위치를 지정하는 등 사용자 인터페이스와 관련된 설정을 포함합니다.
-   **`EmbedConfig`**: 다른 자바 애플리케이션에 내장되어 실행될 때의 설정을 관리합니다. `WebConfig`, `DaemonConfig` 등과 유사하게, 내장 환경에서도 세션 관리(`sessionConfig`) 등을 사용할 수 있도록 지원합니다.

### `SessionConfig` / `SchedulerConfig` (클래스)

세션, 스케줄러 등 특정 기능 모듈에 대한 상세 설정을 담습니다.

**주요 책임 (Key Responsibilities):**
-   **`SessionConfig`**: HTTP 세션 관리 방식을 상세하게 정의합니다. `timeout`(세션 만료 시간), `maxSessions`(최대 세션 수) 등을 설정할 수 있으며, `FileBasedSessionStoreConfig`를 통해 세션을 파일 기반으로 영속화하는 옵션도 제공합니다.
-   **`SchedulerConfig`**: 스케줄러의 동작 방식을 정의합니다. `startDelaySeconds`(서비스 시작 후 스케줄러 실행 지연 시간), `waitOnShutdown`(종료 시 진행 중인 작업 대기 여부) 등을 설정합니다.

## 3. 패키지 요약 및 아키텍처적 의미

`com.aspectran.core.context.config` 패키지는 Aspectran의 유연하고 강력한 설정 관리 능력의 근간을 이룹니다. 모든 설정을 타입-안전한 Java 객체로 추상화함으로써, 설정을 사용하는 다른 컴포넌트들이 설정 소스(XML, APON 등)의 구체적인 형식에 대해 전혀 알 필요가 없도록 합니다.

특히, 설정을 기능과 환경에 따라 여러 클래스로 모듈화한 것은 Aspectran 아키텍처의 높은 확장성을 보여주는 좋은 예입니다. 새로운 실행 환경을 추가해야 할 경우, 해당 환경을 위한 새로운 `*Config` 클래스를 정의하고 `AspectranConfig`에 추가하는 방식으로 비교적 쉽게 확장할 수 있습니다. 이는 각 컴포넌트가 자신의 책임에만 집중하도록 하는 SOLID 원칙을 잘 따르는 설계라 할 수 있습니다.
