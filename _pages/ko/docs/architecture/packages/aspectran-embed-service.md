---
format: plate solid article
sidebar: toc
title: "`com.aspectran.embed.service` 패키지 상세 분석"
subheadline: 아키텍처 - 패키지 심층 분석
parent_path: /docs
---

## 1. 설계 목표 및 주요 역할

이 패키지는 다른 Java 애플리케이션 내에 Aspectran을 **내장(embed)하여 라이브러리처럼 쉽게 사용**할 수 있도록 설계되었습니다. 이 패키지의 설계 목표는 다음과 같습니다.

-   **개발자 친화적인 퍼사드(Facade) 제공**: `CoreService`의 복잡한 생명주기나 상세한 설정을 직접 다루지 않고도, Aspectran의 핵심 기능을 사용할 수 있는 단순하고 직관적인 고수준 API를 제공합니다.
-   **손쉬운 부트스트래핑(Bootstrapping)**: `EmbeddedAspectran.run(...)`이라는 정적 팩토리 메서드를 통해, 단 한 줄의 코드로 Aspectran 인스턴스를 설정하고 시작할 수 있도록 합니다.
-   **사용 사례 중심의 API 설계**: 트랜슬릿 실행(`translate`), 템플릿 렌더링(`render`), 컨텍스트 내에서 코드 블록 실행(`execute`), 빈 조회(`getBean`) 등, Aspectran을 내장하여 사용할 때 가장 흔하게 필요한 기능들을 중심으로 API를 구성합니다.
-   **퍼사드 패턴(Facade Pattern)의 적용**: 복잡한 내부 서비스(`DefaultCoreService`)를 감싸고 외부에 단순한 인터페이스(`EmbeddedAspectran`)를 노출하는 퍼사드 패턴의 전형적인 예시입니다.

결론적으로, 이 패키지는 Aspectran을 전체 애플리케이션의 메인 컨테이너가 아닌, **더 큰 애플리케이션의 일부로 사용하고자 하는 개발자**에게 가장 이상적인 진입점을 제공하는 것을 목표로 합니다.

## 2. 주요 클래스 및 인터페이스 상세 분석

### `EmbeddedAspectran` (인터페이스)

임베디드 모드에서 Aspectran과 상호작용하기 위한 핵심 진입점입니다. `CoreService`를 직접 상속하지 않고, 대신 내부적으로 `CoreService` 인스턴스를 감싸는 단순화된 퍼사드 역할을 합니다.

**주요 책임 (Key Responsibilities):**
-   Aspectran을 시작하고 종료하는 단순한 생명주기 메서드(`run`, `release`)를 제공합니다.
-   내장 환경에서 자주 사용되는 핵심 기능(`translate`, `render`, `execute`, `getBean` 등)을 직관적인 메서드 이름으로 노출합니다.

**핵심 메서드 분석:**
-   `run(...)` (정적 팩토리 메서드): **임베디드 Aspectran을 시작하는 가장 주된 방법**입니다. 다양한 설정 소스(파일 경로, `File` 객체, `Reader` 등)를 인자로 받아, `DefaultEmbeddedAspectran` 서비스를 생성하고 시작하는 모든 과정을 한 번에 처리합니다.
-   `translate(...)`: 프로그래밍 방식으로 트랜슬릿을 실행합니다. (`DaemonService`의 `translate`와 유사합니다.)
-   `render(...)`: 템플릿 ID나 소스를 지정하여 뷰를 직접 렌더링하는 편의 메서드입니다.
-   `execute(InstantAction)`: Aspectran이 관리하는 컨텍스트 내에서 주어진 람다(lambda) 코드 블록을 실행합니다. 이를 통해 코드 블록 내에서 빈에 접근하거나 다른 Aspectran 기능을 활용할 수 있습니다.
-   `release()`: 내장된 Aspectran 인스턴스를 안전하게 종료합니다.

### `DefaultEmbeddedAspectran` (구현 클래스)

`EmbeddedAspectran` 인터페이스의 최종 구현체입니다. 이 클래스의 핵심 설계는 **`DefaultCoreService`를 직접 상속**하면서도, 외부에 노출하는 것은 더 단순한 `EmbeddedAspectran` 인터페이스라는 점입니다.

**주요 책임 (Key Responsibilities):**
-   내부적으로는 완전한 `CoreService`로서의 모든 기능을 가지지만, 외부에는 선별된 단순한 API만 노출합니다.
-   `translate`, `render`, `execute` 등 `EmbeddedAspectran` 인터페이스에 정의된 편의 메서드들의 실제 로직을 구현합니다.

**핵심 메서드 분석:**
-   `translate(...)`: `DaemonService`의 구현과 매우 유사하게, `AspectranActivity`를 생성하고 전체 처리 파이프라인을 통해 실행합니다.
-   `render(...)` / `execute(...)`: 이 메서드들은 경량의 일회성 `Activity`인 **`InstantActivity`**를 내부적으로 사용하여 구현됩니다. `InstantActivity`는 기존 컨텍스트 정보를 상속받아, 템플릿 렌더링이나 코드 실행처럼 짧은 작업을 수행하는 데 최적화되어 있습니다.

## 3. 다른 패키지와의 상호작용

-   **`com.aspectran.core.service`**: `DefaultEmbeddedAspectran`은 `DefaultCoreService`를 상속하여 그 모든 기능을 내재화하지만, `EmbeddedAspectran` 인터페이스라는 퍼사드를 통해 이를 숨깁니다.
-   **`com.aspectran.embed.activity`**: `translate()` 메서드가 호출될 때마다 `AspectranActivity`를 생성하여 사용합니다.
-   **`com.aspectran.core.activity`**: `render()`와 `execute()` 같은 편의 메서드의 내부 구현을 위해 `InstantActivity`를 사용합니다.

## 4. 패키지 요약 및 아키텍처적 의미

`com.aspectran.embed.service` 패키지는 **퍼사드 디자인 패턴(Facade Design Pattern)**의 교과서적인 예시입니다. 이 패키지는 Aspectran의 강력하지만 복잡할 수 있는 `CoreService` 서브시스템에 대한 접근을, 매우 단순하고 목적이 명확한 `EmbeddedAspectran` 인터페이스로 표준화합니다.

`EmbeddedAspectran.run(...)` 정적 메서드는 부트스트래핑 과정을 극도로 단순화하여, 새로운 사용자가 Aspectran을 도입하는 데 느끼는 진입 장벽을 크게 낮춥니다. 또한, `translate`, `render`, `execute`와 같이 제공되는 API는 개발자가 Aspectran을 내장하여 사용하려는 **가장 일반적인 사용 사례(Use Case)**를 중심으로 설계되어 있어 매우 실용적입니다.

이러한 "단순한 인터페이스, 강력한 내부" 설계 덕분에, 개발자는 Aspectran의 내부 동작 원리를 깊이 이해하지 않고도 AOP, DI, 스케줄링 등 프레임워크의 모든 기능을 자신의 애플리케이션에 손쉽게 통합할 수 있습니다.
