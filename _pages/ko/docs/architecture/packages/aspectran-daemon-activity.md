---
format: plate solid article
sidebar: toc
title: "`com.aspectran.daemon.activity` 패키지 상세 분석"
subheadline: 아키텍처 - 패키지 심층 분석
parent_path: /docs
---

## 1. 설계 목표 및 주요 역할

이 패키지는 `DaemonService`에서 프로그래밍 방식으로 시작된 트랜슬릿 호출을 **실제로 실행하는 `Activity` 구현체**를 제공합니다. 이 패키지의 설계 목표는 다음과 같습니다.

-   **프로그래밍 방식 호출의 실행 환경 구체화**: 추상적인 `CoreActivity`를 상속받아, 데몬 환경이라는 비-웹(non-web) 컨텍스트에서 요청을 처리할 수 있는 `DaemonActivity`를 제공합니다.
-   **요청/응답의 인-메모리(In-Memory) 시뮬레이션**: HTTP 스트림이나 콘솔 입출력이 없는 데몬 환경에서, `Map`과 `Writer`를 사용하여 요청과 응답을 시뮬레이션하는 어댑터를 제공합니다. 이를 통해 `CoreActivity`의 실행 파이프라인을 코드 변경 없이 그대로 재사용할 수 있습니다.
-   **`DaemonService`와의 연동**: `DaemonService`의 `translate()` 메서드 호출 시 전달된 파라미터와 속성들을 `Activity`가 사용할 수 있는 형태로 변환하고 연결하는 역할을 합니다.

결론적으로, 이 패키지는 `DaemonService`와 `CoreActivity` 사이의 **핵심적인 가교 역할**을 하며, 프로그래밍 방식의 호출을 Aspectran의 표준 실행 파이프라인 위에서 동작할 수 있도록 조정하는 책임을 가집니다.

## 2. 주요 클래스 상세 분석

### `DaemonActivity` (구현 클래스)

데몬 환경을 위한 `Activity`의 최종 구현체입니다. `DaemonService`의 `translate()` 메서드가 호출될 때마다 새로 생성됩니다.

**주요 책임 (Key Responsibilities):**
-   `CoreActivity`를 상속하여, Aspectran의 표준 요청 처리 파이프라인(어드바이스, 액션 실행 등)을 모두 상속받습니다.
-   `translate()` 메서드를 통해 전달된 요청 이름, 메서드, 속성 맵, 파라미터 맵을 내부 상태로 유지합니다.
-   데몬 환경에 특화된 요청/응답/세션 어댑터를 생성하고 관리합니다.

**핵심 메서드 분석:**
-   `adapt()`: **데몬 환경을 위한 어댑테이션(Adaptation)의 핵심**입니다. `CoreActivity`의 `perform()` 메서드 초반에 호출되어, 프로그래밍 방식의 호출을 표준 인터페이스로 변환합니다.
    -   `DaemonRequestAdapter`: `translate()` 메서드로 전달된 `attributeMap`과 `parameterMap`을 감싸 `RequestAdapter` 역할을 합니다. 이를 통해 `CoreActivity`는 마치 외부 요청으로부터 파라미터와 속성을 읽는 것처럼 동일한 방식으로 데이터에 접근할 수 있습니다.
    -   `DaemonResponseAdapter`: 내부적으로 `OutputStringWriter`를 감싸 `ResponseAdapter` 역할을 합니다. `<echo>` 액션 등의 결과물은 실제 네트워크나 콘솔로 출력되는 대신, 이 `Writer`에 저장됩니다. 실행이 끝난 후, `translate()` 메서드는 이 `Writer`의 내용을 결과로 반환할 수 있습니다.
    -   `DefaultSessionAdapter`: 부모 `DaemonService`에 세션 관리가 활성화된 경우, 세션 어댑터를 생성하여 상태 유지를 지원합니다.

**다른 클래스와의 상호작용:**
-   `DaemonService`: `translate()` 메서드 내에서 `DaemonActivity`를 직접 생성하고, 파라미터를 설정한 뒤, `prepare()`와 `perform()`을 호출하여 실행합니다.
-   `CoreActivity`: `DaemonActivity`는 `CoreActivity`를 상속하여 그 실행 파이프라인을 그대로 사용합니다. `DaemonActivity`의 주된 역할은 이 파이프라인의 입력과 출력을 데몬 환경에 맞게 연결하는 것입니다.
-   `com.aspectran.daemon.adapter` 패키지의 클래스들: `adapt()` 메서드 내에서 `DaemonRequestAdapter`, `DaemonResponseAdapter`를 직접 생성하여 사용합니다.

## 3. 패키지 요약 및 아키텍처적 의미

`com.aspectran.daemon.activity` 패키지는 Aspectran 아키텍처의 유연성을 보여주는 중요한 예시입니다. 이 패키지의 핵심 아키텍처적 의미는 **요청/응답 사이클의 추상화와 시뮬레이션**에 있습니다.

`DaemonActivity`는 실제 네트워크 I/O 없이, 순수한 자바 객체(`Map`, `Writer`)만을 사용하여 요청과 응답을 시뮬레이션합니다. `DaemonRequestAdapter`는 `Map`을 '요청'처럼 보이게 만들고, `DaemonResponseAdapter`는 `Writer`를 '응답'처럼 보이게 만듭니다. 이 정교한 어댑터 계층 덕분에, `CoreActivity`의 실행 엔진은 자신이 처리하는 데이터가 실제 HTTP 요청에서 온 것인지, 아니면 코드 내의 메서드 호출에서 온 것인지 전혀 인지할 필요가 없습니다.

이러한 설계는 Aspectran의 핵심 기능(DI, AOP, 트랜잭션 등)을 재사용하여 강력한 백그라운드 서비스를 구축할 수 있게 하는 기술적인 기반이 됩니다. 즉, **실행 환경에 대한 의존성을 어댑터 계층에서 모두 흡수**함으로써, 프레임워크의 핵심 로직을 다양한 시나리오에서 일관되게 재활용할 수 있음을 증명합니다.
