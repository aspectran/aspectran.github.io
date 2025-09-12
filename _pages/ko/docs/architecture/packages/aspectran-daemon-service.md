---
format: plate solid article
sidebar: toc-left
title: "`com.aspectran.daemon.service` 패키지 상세 분석"
headline:
teaser:
---

## 1. 설계 목표 및 주요 역할

이 패키지는 Aspectran을 웹 서버 없이 **독립적인 백그라운드 프로세스(데몬)로 실행**하기 위한 특화된 서비스 구현을 제공합니다. 이 패키지의 설계 목표는 다음과 같습니다.

-   **독립 실행 환경 제공**: 웹 컨테이너에 의존하지 않고, 자체적인 생명주기를 가지는 독립 실행형 애플리케이션을 구축할 수 있는 기반을 제공합니다.
-   **능동적인 요청 실행 모델**: 외부의 HTTP 요청에 반응하는 `WebService`와 달리, 애플리케이션 내부의 특정 로직이나 스케줄러 등이 직접 트랜슬릿 실행을 트리거하는 **능동적(Proactive) 실행 모델**을 구현합니다.
-   **프로그래밍 방식의 진입점**: `translate()` 메서드를 통해, 코드 내에서 동적으로 트랜슬릿을 호출할 수 있는 명확하고 제어 가능한 진입점을 제공합니다.
-   **비-웹 환경에서 세션 기능 지원**: 데몬과 같이 오래 실행되는(long-running) 애플리케이션이 여러 `translate()` 호출에 걸쳐 상태를 유지할 수 있도록, 선택적으로 세션 관리 기능을 제공합니다.

결론적으로, 이 패키지는 Aspectran의 강력한 기능(AOP, DI 등)을 백그라운드 작업, 배치 프로세스, 메시지 큐 리스너 등 UI가 없는 서버 애플리케이션에서 그대로 활용할 수 있도록 하는 것을 목표로 합니다.

## 2. 주요 클래스 및 인터페이스 상세 분석

### `DaemonService` (인터페이스)

데몬 환경에 특화된 Aspectran 서비스의 명세입니다.

**주요 책임 (Key Responsibilities):**
-   `CoreService`를 상속하여 모든 핵심 서비스 기능을 가집니다.
-   프로그래밍 방식으로 트랜슬릿을 실행하는 핵심 진입점인 `translate(...)` 메서드들을 정의합니다. 이 메서드는 데몬 애플리케이션이 내부 서비스를 호출하는 주된 방법입니다.
-   데몬 환경을 위한 세션 어댑터(`SessionAdapter`)를 생성하는 `newSessionAdapter()` 메서드를 정의합니다.

### `DefaultDaemonService` (구현 클래스)

`DaemonService`의 최종 구현체로, 프로그래밍 방식의 트랜슬릿 호출을 받아 `DaemonActivity`를 생성하고 실행하는 모든 과정을 담당합니다.

**주요 책임 (Key Responsibilities):**
-   `DefaultCoreService`를 상속하여 완전한 기능을 갖춘 핵심 서비스의 역할을 합니다.
-   `DaemonConfig` 설정에 따라 `DefaultSessionManager`를 생성하고 관리하여, 데몬 환경에서도 세션을 시뮬레이션할 수 있도록 합니다.
-   `RequestAcceptor`를 통해, `translate()` 메서드로 호출될 수 있는 트랜슬릿의 목록을 제한하는 보안 기능을 제공할 수 있습니다.

**핵심 메서드 분석:**
-   `translate(String transletName, ...)`: 이 클래스의 핵심 실행 메서드입니다. 웹 환경의 `WebService.service()`에 해당하는 역할을 합니다.
    1.  서비스가 일시 정지 상태인지 확인합니다.
    2.  요청된 `transletName`이 `RequestAcceptor`에 의해 허용된 것인지 확인합니다.
    3.  데몬 환경에 특화된 `DaemonActivity` 인스턴스를 생성합니다.
    4.  `DaemonActivity`에 `translate()` 메서드로 전달받은 트랜슬릿 이름, HTTP 메서드(가상), 속성, 파라미터 등을 설정합니다.
    5.  `activity.prepare()`와 `activity.perform()`을 호출하여 Aspectran의 표준 요청 처리 파이프라인을 구동합니다.
    6.  실행 결과를 담고 있는 `Translet` 객체를 반환합니다.

### `DefaultDaemonServiceBuilder` (빌더 클래스)

`DefaultDaemonService` 인스턴스를 생성하고 설정하는 팩토리 클래스입니다.

**주요 책임 (Key Responsibilities):**
-   `AspectranConfig` 객체를 받아 `DefaultDaemonService`를 인스턴스화하고 필요한 설정을 주입합니다.
-   `ServiceStateListener`를 설정하여, 서비스의 생명주기(시작, 중지, 일시정지 등)가 `CoreServiceHolder` 및 `SessionManager`와 올바르게 연동되도록 합니다.

## 3. 다른 패키지와의 상호작용

-   **`com.aspectran.core.service`**: `DefaultCoreService`를 직접 상속하여 Aspectran의 모든 핵심 기능(생명주기, `ActivityContext` 관리 등)을 재사용합니다.
-   **`com.aspectran.daemon.activity`**: `DefaultDaemonService`는 모든 `translate()` 호출에 대해 `DaemonActivity`를 생성합니다. `DaemonActivity`는 프로그래밍 방식의 호출을 코어 엔진이 이해할 수 있는 형태로 변환하는 어댑터 역할을 합니다.
-   **`com.aspectran.core.context.config`**: `DaemonConfig` 설정 객체로부터 데몬 전용 설정(세션 관리, 폴링 설정 등)을 읽어와 서비스에 반영합니다.

## 4. 패키지 요약 및 아키텍처적 의미

`com.aspectran.daemon.service` 패키지는 수동적인(Reactive) 웹 프레임워크를 **능동적인(Proactive) 애플리케이션 컨테이너**로 전환시키는 중요한 역할을 합니다. `WebService`가 외부 요청을 기다리는 반면, `DaemonService`는 애플리케이션 스스로가 필요에 따라 자신의 로직(트랜슬릿)을 호출할 수 있는 구조를 제공합니다.

`translate()` 메서드는 아키텍처적으로 웹 요청과 동일한 역할을 수행하는 **내부 API 호출 게이트웨이**입니다. 이 메서드를 통해 호출된 모든 트랜슬릿은 웹 요청과 마찬가지로 애스펙트(트랜잭션, 보안 등), 의존성 주입 등 Aspectran의 모든 기능을 동일하게 적용받을 수 있습니다.

또한, 비-웹 환경에서 세션 관리 기능을 제공하는 것은 이 패키지의 독특한 특징 중 하나입니다. 이를 통해 여러 번의 `translate()` 호출에 걸쳐 상태를 유지해야 하는 복잡한 백그라운드 애플리케이션을 효과적으로 구축할 수 있습니다.
