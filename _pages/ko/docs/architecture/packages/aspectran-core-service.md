---
format: plate solid article
sidebar: toc
title: "`com.aspectran.core.service` 패키지 상세 분석"
subheadline: 아키텍처 - 패키지 심층 분석
parent_path: /docs
---

## 1. 설계 목표 및 주요 역할

이 패키지는 Aspectran 프레임워크의 **서비스 계층의 가장 핵심적인 기반**을 정의합니다. 이 패키지의 설계 목표는 다음과 같습니다.

-   **일관된 생명주기 관리**: 애플리케이션의 시작, 중지, 재시작, 일시정지 등 상태 변화를 예측 가능하고 안정적으로 관리하기 위한 표준화된 생명주기(Lifecycle) 계약을 제공합니다.
-   **계층적 서비스 구조**: 서비스가 부모-자식 관계를 가질 수 있는 계층 구조를 지원하여, 상위 서비스의 생명주기가 하위 서비스에 전파되도록 합니다. 이는 전체 애플리케이션의 상태를 일관되게 관리하는 데 필수적입니다.
-   **중앙 접근 지점(Central Access Point) 제공**: 프레임워크의 모든 핵심 구성요소(빈, 트랜슬릿, 애스펙트 등)를 담고 있는 `ActivityContext`에 접근할 수 있는 유일한 통로인 `CoreService`를 정의합니다.
-   **다양한 실행 환경 지원 기반 마련**: `CoreService`를 상속하여 웹, 데몬, 셸 등 다양한 실행 환경에 특화된 서비스(`WebService`, `DaemonService` 등)를 구현할 수 있는 확장 가능한 기반을 제공합니다.

주요 디자인 패턴으로는 생명주기 관리 로직의 템플릿을 제공하는 **템플릿 메서드 패턴(Template Method Pattern)**이 `AbstractServiceLifeCycle`과 `AbstractCoreService`에 적용되었으며, `CoreServiceHolder`를 통해 **서비스 로케이터 패턴(Service Locator Pattern)**이 구현되어 있습니다.

## 2. 주요 클래스 및 인터페이스 상세 분석

### `ServiceLifeCycle` (인터페이스)

Aspectran 내에서 생명주기를 갖는 모든 서비스 컴포넌트가 구현해야 하는 최상위 인터페이스입니다.

**주요 책임 (Key Responsibilities):**
-   서비스의 상태를 제어하는 표준 메서드(`start`, `stop`, `restart`, `pause`, `resume`)를 정의합니다.
-   서비스 간의 계층 구조를 형성하기 위한 메서드(`getParentService`, `addService`)를 제공하여, 부모 서비스가 자식 서비스의 생명주기를 관리할 수 있도록 합니다.
-   서비스의 현재 활성화 상태(`isActive`) 및 일시정지 상태(`isPaused`)를 조회하는 기능을 정의합니다.

**핵심 메서드 분석:**
-   `start()`: 서비스를 시작하여 활성 상태로 만듭니다. 이미 시작된 경우 예외를 발생시킵니다.
-   `stop()`: 서비스를 중지하고 관련된 모든 리소스를 해제합니다.
-   `restart()`: 서비스를 재시작합니다. 내부적으로 `stop()` 후 `start()`를 호출하는 것과 같습니다.
-   `addService(ServiceLifeCycle service)`: 현재 서비스의 자식으로 다른 서비스를 추가합니다. 추가된 자식 서비스는 부모 서비스의 생명주기에 맞춰 함께 제어됩니다.

### `AbstractServiceLifeCycle` (추상 클래스)

`ServiceLifeCycle` 인터페이스의 핵심 로직을 미리 구현해놓은 추상 클래스입니다. 하위 클래스들이 생명주기 관리의 공통 로직을 쉽게 구현할 수 있도록 돕습니다.

**주요 책임 (Key Responsibilities):**
-   서비스의 상태(`active`, `paused`)를 `volatile` 변수로 관리하여 멀티스레드 환경에서의 가시성을 보장합니다.
-   `subServices` 리스트를 통해 자식 서비스들을 관리하며, 자신의 생명주기 상태가 변경될 때 자식 서비스들의 상태도 함께 동기화합니다.
-   `ServiceStateListener`를 통해 서비스의 상태 변경 이벤트를 외부에 알리는 옵저버 패턴을 구현합니다.
-   `synchronized` 키워드를 사용하여 생명주기 변경 메서드들이 스레드-안전(thread-safe)하게 동작하도록 보장합니다.

**핵심 메서드 분석:**
-   `start()`: `synchronized` 블록 내에서 서비스의 상태를 검사한 후, 하위 클래스에서 구체적인 시작 로직을 구현해야 하는 `doStart()` 추상 메서드를 호출합니다. 그 후, 모든 자식 서비스들의 `start()`를 순차적으로 호출합니다.
-   `stop()`: `start()`와 유사한 구조로, `doStop()` 추상 메서드를 호출하여 리소스를 해제하고 모든 자식 서비스들을 중지시킵니다.
-   `doStart()`, `doStop()`, `doPause()`, `doResume()`: 하위 클래스에서 실제 로직을 구현해야 하는 템플릿 메서드입니다.

### `CoreService` (인터페이스)

Aspectran 애플리케이션의 **실질적인 본체**를 나타내는 핵심 서비스 인터페이스입니다.

**주요 책임 (Key Responsibilities):**
-   프레임워크의 모든 구성요소가 등록된 `ActivityContext`에 대한 접근(`getActivityContext()`)을 제공합니다. 이는 Aspectran의 모든 기능에 접근하는 관문 역할을 합니다.
-   자신이 다른 `CoreService`에 종속된 파생 서비스(derived service)인지 여부를 확인하는 `isDerived()` 메서드를 정의합니다.
-   애플리케이션의 기본 어댑터인 `ApplicationAdapter`에 대한 접근을 제공합니다.

### `DefaultCoreService` (구현 클래스)

`CoreService`의 최종 구현체로, Aspectran 애플리케이션의 **부트스트래퍼(Bootstrapper)** 역할을 수행합니다.

**주요 책임 (Key Responsibilities):**
-   `AspectranConfig` 설정 객체를 받아 `ActivityContextBuilder`를 생성하고, 이를 통해 `ActivityContext`를 빌드하고 초기화하는 전체 부트스트랩 과정을 담당합니다.
-   `SchedulerService`의 생명주기를 관리합니다. `CoreService`가 시작/중지될 때 `SchedulerService`도 함께 시작/중지됩니다.
-   `FileLocker`를 통해 특정 경로에 lock 파일을 생성하여, 하나의 Aspectran 인스턴스만 실행되도록 보장하는 기능을 제공합니다.
-   JVM Shutdown Hook을 등록하여, 애플리케이션이 예기치 않게 종료될 때 `stop()` 메서드가 호출되도록 보장하여 리소스를 안전하게 해제합니다.

**핵심 메서드 분석:**
-   `DefaultCoreService(AspectranConfig aspectranConfig)`: 생성자에서 `AspectranConfig`를 받아 부트스트랩을 준비합니다.
-   `doStart()`: `AbstractServiceLifeCycle`의 템플릿 메서드를 구현한 것으로, Aspectran의 실제 시작 로직이 담겨 있습니다. 내부적으로 `ActivityContextBuilder`를 생성하고 `builder.build()`를 호출하여 `ActivityContext`를 완성합니다. 그 후, `SchedulerService`를 초기화하고 시작합니다.
-   `service(Activity activity)`: `AbstractCoreService`에 구현된 메서드로, `Activity`를 실행하는 진입점입니다. `activity.prepare()`와 `activity.perform()`을 순차적으로 호출하여 트랜슬릿의 전체 처리 파이프라인을 구동시킵니다.

### `CoreServiceHolder` (유틸리티 클래스)

실행 중인 모든 `CoreService` 인스턴스에 대한 정적(static) 참조를 관리하는 **서비스 로케이터(Service Locator)**입니다.

**주요 책임 (Key Responsibilities):**
-   `ClassLoader`를 키(key)로 사용하여 `CoreService` 인스턴스를 `serviceMap`에 저장하고 관리합니다. 이는 여러 웹 애플리케이션이 하나의 WAS(Web Application Server)에서 동작하는 것처럼, 클래스 로더가 분리된 여러 컨텍스트가 공존하는 환경을 지원하기 위함입니다.
-   현재 실행 중인 스레드의 컨텍스트 클래스 로더(`Thread.currentThread().getContextClassLoader()`)를 기준으로 정확한 `CoreService`와 `ActivityContext`를 찾을 수 있게 해줍니다.

**핵심 메서드 분석:**
-   `acquire()`: 현재 스레드의 컨텍스트 클래스 로더에 해당하는 `CoreService` 인스턴스를 반환합니다. Aspectran의 여러 내부 컴포넌트들이 현재 실행 컨텍스트에 접근해야 할 때 이 메서드를 사용합니다.
-   `putService(CoreService coreService)`: 새로운 `CoreService` 인스턴스를 `serviceMap`에 등록합니다.
-   `release(CoreService coreService)`: 서비스가 중지될 때 `serviceMap`에서 해당 인스턴스를 제거합니다.

## 3. 패키지 요약 및 아키텍처적 의미

`com.aspectran.core.service` 패키지는 Aspectran을 단순한 라이브러리가 아닌, **생명주기를 갖는 견고한 서비스 프레임워크**로 만들어주는 핵심 기반입니다. `ServiceLifeCycle`을 통해 일관된 상태 관리 모델을 제시하고, `CoreService`를 통해 모든 기능에 접근하는 중앙 통로를 제공하며, `DefaultCoreService`를 통해 복잡한 초기화 과정을 캡슐화합니다.

특히, `CoreServiceHolder`가 클래스 로더 기반으로 서비스를 관리하는 방식은 Aspectran이 복잡한 엔터프라이즈 환경에서도 안정적으로 동작할 수 있도록 보장하는 중요한 설계적 결정입니다. 이 견고한 서비스 계층 위에 각 환경(`web`, `daemon`, `shell` 등)에 특화된 하위 서비스들이 구현됨으로써, Aspectran은 다양한 환경을 지원하는 유연성과 확장성을 확보하게 됩니다.