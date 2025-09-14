---
format: plate solid article
sidebar: toc-left
title: "ActivityContext: Aspectran의 심장부"
subheadline: Architecture Details
teaser:
---

## 1. 핵심 개념: 애플리케이션의 중앙 허브

`ActivityContext`는 Aspectran 애플리케이션의 **핵심 컨테이너(IoC Container)**이자 가장 중심적인 인터페이스입니다. 애플리케이션의 모든 설정 정보, 컴포넌트(Bean), 그리고 런타임 실행 상태를 총괄하여 관리하는 **중앙 허브(Central Hub)** 역할을 합니다. 이는 Spring Framework의 `ApplicationContext`와 유사한 개념으로, 애플리케이션의 시작부터 종료까지 전체 생명주기를 책임집니다.

`ActivityContext`는 인터페이스이며, 프레임워크 내부에서는 주로 `com.aspectran.core.context.DefaultActivityContext` 클래스가 이 인터페이스의 핵심 구현체로 사용됩니다.

## 2. 주요 책임 및 역할

`ActivityContext`의 역할은 크게 다음과 같이 나눌 수 있습니다.

### 가. 컴포넌트 생명주기 관리 (Lifecycle Management)

-   애플리케이션에 등록된 모든 핵심 컴포넌트의 생성, 초기화, 소멸을 관리합니다.
-   `DefaultActivityContext`의 `doInitialize()`와 `doDestroy()` 메서드는 내부에 등록된 모든 레지스트리(Registry)와 렌더러(Renderer)의 생명주기 메서드를 연쇄적으로 호출하여 일관성 있는 상태를 유지합니다.

### 나. 핵심 컴포넌트 레지스트리 (Component Registry)

-   애플리케이션의 모든 규칙과 컴포넌트를 저장하고 관리하는 레지스트리에 대한 접근점을 제공합니다. 이를 통해 애플리케이션의 모든 요소가 `ActivityContext`를 통해 서로 상호작용할 수 있습니다.
-   **`BeanRegistry`**: `@Bean` 또는 XML 설정으로 정의된 모든 빈(Bean) 객체의 인스턴스를 생성하고 관리합니다. 의존성 주입(DI) 컨테이너의 실질적인 역할을 수행합니다.
-   **`AspectRuleRegistry`**: 애스펙트(AOP)의 핵심인 `AspectRule`을 저장하고, 특정 조인포인트(Joinpoint)에 어떤 어드바이스(Advice)를 적용해야 하는지에 대한 정보를 제공합니다.
-   **`TransletRuleRegistry`**: 핵심 처리 단위인 트랜슬릿(Translet)의 모든 규칙(`TransletRule`)을 관리합니다.
-   **`ScheduleRuleRegistry`**: 스케줄링 작업(`ScheduleRule`) 관련 규칙을 관리합니다.

### 다. 환경 정보 접근 (Environment Access)

-   애플리케이션의 실행 환경을 나타내는 `Environment` 객체에 대한 접근을 제공합니다.
-   이를 통해 각 컴포넌트는 현재 활성화된 프로필(Profile)이나 `.properties` 파일에 정의된 속성(Property) 값에 따라 다르게 동작할 수 있습니다. 예를 들어, `dev` 프로필에서는 로컬 데이터베이스를, `prod` 프로필에서는 운영 데이터베이스를 사용하도록 설정할 수 있습니다.

### 라. Activity 관리 (Activity Management)

-   애플리케이션의 단일 실행 단위인 `Activity` 객체의 생명주기를 관리합니다. `Activity`는 웹 요청, 스케줄 작업, 셸 명령어 등 하나의 요청 처리를 의미합니다.
-   **`ThreadLocal` 기반의 스레드 안정성**: `currentActivityHolder`라는 `ThreadLocal` 변수를 사용하여 각 스레드별로 현재 실행 중인 `Activity`를 독립적으로 관리합니다. 이는 여러 요청을 동시에 처리하는 멀티스레드 환경(예: 웹 애플리케이션)에서 각 요청이 다른 요청의 상태에 영향을 주지 않도록 보장하는 매우 중요한 기능입니다.
-   `defaultActivity`를 통해 현재 진행 중인 `Activity`가 없는 비-요청 컨텍스트에서도 기본적인 기능을 수행할 수 있도록 지원합니다.

### 마. 리소스 로딩 및 국제화 (Resource Loading & i18n)

-   애플리케이션의 클래스와 리소스를 로드하는 `ClassLoader`와, 외부 환경과의 상호작용을 추상화하는 `ApplicationAdapter`를 관리합니다.
-   다국어 처리(i18n)를 위한 `MessageSource`에 대한 접근점을 제공하여, 애플리케이션이 다양한 언어 환경에 대응할 수 있도록 합니다.

## 3. 전체 동작 흐름

1.  **부트스트래핑**: Aspectran 애플리케이션이 시작되면, `ActivityContextBuilder`가 설정 파일(XML 또는 Apon)과 어노테이션을 파싱하여 `DefaultActivityContext` 인스턴스를 생성합니다.
2.  **레지스트리 구성**: 파싱된 설정 정보를 바탕으로 `BeanRegistry`, `AspectRuleRegistry` 등 각종 레지스트리가 생성되고 규칙 정보가 채워집니다.
3.  **컨텍스트 주입**: 생성된 레지스트리들과 `Environment` 객체가 `DefaultActivityContext`에 주입됩니다.
4.  **초기화**: `ActivityContext`가 초기화되면서 자신이 관리하는 모든 컴포넌트(레지스트리, 싱글톤 빈, 렌더러 등)를 연쇄적으로 초기화합니다.
5.  **요청 대기**: 초기화가 완료되면, 컨텍스트는 외부 요청(HTTP 요청, 스케줄 실행 등)을 처리할 준비를 마칩니다.
6.  **Activity 생성**: 요청이 들어오면, 해당 요청을 처리하기 위한 새로운 `Activity` 객체가 생성됩니다.
7.  **스레드 컨텍스트 등록**: 생성된 `Activity`는 현재 스레드의 "Current Activity"로 `ActivityContext`에 등록됩니다.
8.  **요청 처리**: `Activity`는 `ActivityContext`를 통해 필요한 빈(Bean)을 얻고, 트랜슬릿을 실행하며, 애스펙트를 적용하여 요청을 처리합니다.
9.  **스레드 컨텍스트 제거**: 요청 처리가 완료되면, 해당 스레드의 "CurrentActivity"는 `ActivityContext`에서 제거됩니다.
10. **소멸**: 애플리케이션이 종료될 때, `ActivityContext`의 `destroy()` 메서드가 호출되어 관리하던 모든 컴포넌트를 안전하게 소멸시킵니다.

## 4. 요약

`ActivityContext`는 Aspectran 애플리케이션의 **중앙 제어 장치**이자 모든 것의 시작점입니다. 모든 핵심 컴포넌트와 설정 정보를 담고 있는 컨테이너로서, 이들의 생명주기를 관리하고 일관된 접근 방법을 제공합니다. 특히 스레드별로 `Activity`를 독립적으로 관리함으로써 멀티스레드 환경에서의 안정성을 보장합니다. 따라서 `ActivityContext`를 이해하는 것은 Aspectran 프레임워크의 전체 아키텍처를 이해하는 데 가장 중요합니다.
