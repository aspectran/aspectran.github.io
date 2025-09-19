---
format: plate solid article
sidebar: toc
title: "Aspectran AOP 프록시 메커니즘: `AbstractBeanProxy`와 `ProxyActivity`"
subheadline: 아키텍처
parent_path: /docs
---

## 1. 개요

Aspectran 프레임워크의 AOP(Aspect-Oriented Programming) 프록시 메커니즘은 **성능 최적화**와 **비동기(`@Async`) 실행 환경에서의 유연한 컨텍스트 관리**에 초점을 맞춰 설계되었습니다. 이 메커니즘의 핵심에는 `AbstractBeanProxy`와 `ProxyActivity`라는 두 가지 컴포넌트가 있습니다. 본 문서는 이 두 컴포넌트의 역할과 상호작용을 분석하여, 새로운 AOP 프록시가 어떻게 더 효율적이고 안정적으로 동작하는지 설명합니다.

## 2. 핵심 컴포넌트 분석

### 2.1. `AbstractBeanProxy`: 지능적인 AOP 실행 제어

`AbstractBeanProxy`는 AOP 어드바이스를 적용하는 모든 프록시 객체의 기반이 되는 추상 클래스입니다. 이 클래스의 가장 중요한 특징은 **선택적 어드바이스 적용 로직**을 통해 불필요한 오버헤드를 제거하는 것입니다.

-   **성능 최적화 (`isAdvisableMethod`)**: 프록시된 빈의 메서드가 호출될 때, `AbstractBeanProxy`는 가장 먼저 해당 메서드에 `@Advisable` 또는 `@Async` 어노테이션이 있는지 검사합니다. 만약 두 어노테이션 중 어느 것도 없다면, AOP 어드바이스를 적용하기 위한 복잡한 로직(어드바이스 규칙 조회, 컨텍스트 생성 등)을 **모두 건너뛰고** 즉시 원본 메서드를 실행합니다. 이로 인해 어드바이스가 필요 없는 수많은 내부 메서드 호출에서 발생하는 불필요한 오버헤드가 원천적으로 제거되어 전체 애플리케이션 성능이 크게 향상됩니다.

-   **동기/비동기 실행 분기**: 메서드에 어노테이션이 있는 경우, 다음과 같이 실행 경로를 분기합니다.
    -   `@Async` 어노테이션이 감지되면, 비동기 실행을 위한 `invokeAsync()` 메서드를 호출합니다.
    -   `@Advisable` 어노테이션만 있는 경우에는 동기 실행을 위한 `invokeSync()` 메서드를 호출하여 기존의 AOP 어드바이스 로직을 수행합니다.

### 2.2. `ProxyActivity`: 어드바이스 실행을 위한 경량 컨텍스트

`ProxyActivity`는 AOP 어드바이스 실행이라는 특정 목적을 위해 설계된 경량 `Activity`입니다. 일반적인 요청-응답 사이클을 처리하는 `WebActivity`나 `ShellActivity`와 달리, 어드바이스 실행에 필요한 최소한의 기능만을 제공하여 매우 가볍게 동작합니다.

-   **두 가지 생성 모드**:
    1.  **독립 모드 (`new ProxyActivity(context)`)**: 현재 스레드에 실행 중인 `Activity`가 없을 때(예: `@Async` 메서드가 처음 호출될 때) 생성됩니다. 이 `ProxyActivity`는 자신만의 독립적인 `ActivityData`를 가지며, 완전히 격리된 컨텍스트에서 어드바이스를 실행합니다.
    2.  **래핑 모드 (`new ProxyActivity(activity)`)**: 현재 스레드에 이미 `Activity`가 존재할 때, 기존 `Activity`를 감싸는(wrapping) 형태로 생성됩니다. 이 모드의 가장 큰 특징은 **원본 `Activity`의 `ActivityData`를 공유**한다는 점입니다. 이를 통해 비동기 작업 스레드에서도 호출자(caller) 스레드의 요청 파라미터나 속성 등을 읽거나 쓸 수 있게 됩니다.

-   **제한된 역할**: `getTranslet()`, `getDeclaredResponse()` 등 어드바이스 실행과 무관한 대부분의 메서드는 `UnsupportedOperationException`을 발생시켜, 이 클래스의 명확한 역할을 강제합니다. 핵심 역할은 `perform()` 메서드를 통해 현재 스레드에 자신을 `CurrentActivity`로 등록하고, 주어진 로직(어드바이스 및 원본 메서드)을 실행한 뒤, `finally` 블록에서 스레드로부터 자신을 깨끗하게 제거하는 것입니다.

## 3. 비동기(`@Async`) 처리와 컨텍스트 공유 메커니즘

이 설계의 장점은 비동기 환경에서의 컨텍스트 공유 방식에서 명확히 드러납니다. 하나의 비동기 작업 내에서 여러 어드바이스 적용 메서드가 연쇄적으로 호출될 때, 컨텍스트(`Activity`)는 다음과 같이 효율적으로 공유됩니다.

1.  **최초 `@Async` 메서드 호출**:
    -   `AsyncTaskExecutor`에 의해 새로운 Worker 스레드에서 작업이 시작됩니다.
    -   이 시점의 Worker 스레드에는 `CurrentActivity`가 없으므로, `AbstractBeanProxy`는 **독립 모드의 `ProxyActivity`를 새로 생성**합니다. (이하 `PA_1`)

2.  **컨텍스트 등록**:
    -   생성된 `PA_1`은 자신의 `perform()` 메서드를 통해 현재 Worker 스레드의 `ThreadLocal`에 `CurrentActivity`로 등록됩니다.

3.  **연쇄적인 내부 메서드 호출**:
    -   `@Async` 메서드 내부에서 다른 `@Advisable` 메서드(`methodA`)를 호출하면, `AbstractBeanProxy`가 다시 동작합니다.
    -   프록시는 `context.hasCurrentActivity()`를 확인하고, `PA_1`이 이미 스레드에 등록되어 있으므로 `true`를 반환받습니다.
    -   따라서 **새로운 `Activity`를 만들지 않고, 기존의 `PA_1` 인스턴스를 그대로 재사용**하여 `methodA`의 어드바이스를 실행합니다.
    -   이후 `methodA`가 또 다른 어드바이스 적용 메서드를 호출하더라도, 해당 Worker 스레드에서 실행되는 한 `PA_1` 컨텍스트는 계속해서 공유됩니다.

4.  **컨텍스트 정리**:
    -   최초의 `@Async` 메서드 실행이 모두 완료되면, `PA_1.perform()`의 `finally` 블록이 실행되어 스레드의 `ThreadLocal`에서 `CurrentActivity`를 안전하게 제거합니다.

이 메커니즘 덕분에, 하나의 논리적인 비동기 작업 단위는 **단일 `ProxyActivity` 인스턴스를 공유**하게 되어 일관된 컨텍스트를 유지하면서도 불필요한 컨텍스트 객체 생성을 방지할 수 있습니다.

## 4. 기대 효과 및 결론

새로운 AOP 프록시 메커니즘은 다음과 같은 명확한 장점을 제공합니다.

-   **성능 향상**: 어드바이스가 불필요한 메서드 호출의 오버헤드를 제거하여 시스템 전반의 성능을 높입니다.
-   **유연한 컨텍스트 관리**: 독립 모드와 래핑 모드를 갖춘 `ProxyActivity`를 통해 동기/비동기 환경 모두에서 유연하고 안정적인 컨텍스트 관리가 가능합니다.
-   **코드 명확성**: `@Advisable`, `@Async` 어노테이션을 통해 개발자는 어떤 메서드가 AOP의 대상이 되는지를 명확하게 표현할 수 있습니다.

결론적으로, Aspectran은 `AbstractBeanProxy`와 `ProxyActivity`를 통해 더욱 가볍고, 빠르며, 복잡한 비동기 환경까지 완벽하게 지원하는 현대적인 AOP 프레임워크로 한 단계 더 발전했습니다.