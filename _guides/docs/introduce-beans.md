---
layout: page
format: plate article
headline: Aspectran Beans
title:  Aspectran Beans 구조 분석
teaser: |
   Aspectran은 강력한 DI 개념을 기반으로, 경량성과 속도라는 자신만의 독자적인 가치를 구현하고 있습니다.
breadcrumb: true
comments: true
sidebar: toc-left
tags:
  - Beans
category: docs
date: 2025-08-21
---

## 1. 개요

Aspectran 프레임워크의 `com.aspectran.core.component.bean` 패키지는 프레임워크의 핵심 기능인 **IoC (Inversion of Control) 컨테이너**를 구현합니다. 이 구조는 Spring Beans의 주요 개념(IoC, DI)을 참고하였으나, Aspectran이 추구하는 핵심 사상인 **POJO, 단순함, 빠른 개발 및 구동(Simple, Fast Development & Startup)**에 맞춰 완전히 새롭게 설계되었습니다.

Aspectran의 빈 관리 메커니즘은 다음과 같이 명확한 역할로 나뉩니다.

-   **정의 (Definition)**: 빈의 설계 정보를 담는 역할
-   **등록 (Registry)**: 정의된 빈 설계도를 관리하는 역할
-   **생성 (Factory)**: 설계도를 바탕으로 실제 빈 객체를 만드는 역할
-   **스코프 (Scope)**: 빈의 생명주기를 관리하는 역할
-   **프록시 (Proxy)**: AOP 적용을 위해 빈을 감싸는 역할

---

## 2. 핵심 클래스 및 역할

### 2.1. 빈의 설계도: `BeanRule.java`

-   **역할**: 빈(Bean) 하나를 생성하는 데 필요한 모든 설정 정보를 담는 **'설계도'** 객체입니다.
-   **주요 정보**:
    -   빈 ID, 클래스 이름
    -   스코프(Scope) 타입 (`singleton`, `prototype` 등)
    -   생성자 인수 및 속성 (의존성 주입)
    -   초기화(`init-method`) 및 소멸(`destroy-method`) 콜백 메소드

### 2.2. 설계도 보관소: `BeanRuleRegistry.java`

-   **역할**: 모든 `BeanRule` 객체를 보관하고 관리하는 중앙 **'등록소(Registry)'** 입니다.
-   **동작**: 애플리케이션이 시작될 때 XML 등 설정 소스를 파싱하여 생성된 `BeanRule`들을 ID를 키(Key)로 하여 이곳에 모두 등록합니다.

### 2.3. 빈 생성 공장: `BeanFactory.java`

-   **역할**: `BeanRule` 설계도를 바탕으로 실제 자바 객체(빈 인스턴스)를 생성하는 **'공장(Factory)'** 입니다.
-   **동작**: `getBean()` 요청이 오면, `BeanFactory`가 클래스 인스턴스화, 의존성 주입(DI), 초기화 메소드 호출 등 빈의 생명주기 전반을 직접 관리합니다.

### 2.4. 빈 관리 총괄: `DefaultBeanRegistry.java`

-   **역할**: 애플리케이션이 빈을 사용하기 위한 주된 **'창구'** 역할을 합니다.
-   **동작**: 내부적으로 `BeanRuleRegistry`(설계도 보관소)와 `BeanFactory`(생성 공장), 그리고 `Scope` 관리자를 통합하여 "ID가 'myBean'인 빈을 주세요"와 같은 최종 요청을 처리하는 총괄 지휘자입니다.

---

## 3. 빈 스코프(Scope) 관리 (`scope` 패키지)

빈의 생존 범위를 관리하며, `Scope` 인터페이스를 중심으로 여러 구현체가 존재합니다.

-   `SingletonScope`: 컨테이너 내에서 단 하나의 인스턴스만 생성되어 공유됩니다. (기본값)
-   `PrototypeScope`: 빈을 요청할 때마다 새로운 인스턴스를 생성합니다.
-   `RequestScope` / `SessionScope`: 웹 애플리케이션 환경에서 각각의 HTTP 요청 또는 세션 동안에만 유효한 빈을 만들 때 사용됩니다.

---

## 4. AOP를 위한 프록시 (`proxy` 패키지)

Aspectran의 또 다른 핵심 기능인 AOP(관점 지향 프로그래밍)를 빈에 적용하기 위한 메커니즘입니다.

-   **`ProxyBeanFactory`**: 일반 빈이 아닌, AOP 어드바이스가 적용된 프록시(Proxy) 빈을 전문적으로 생성하는 팩토리입니다.
-   **`JavassistBeanProxy` / `JdkBeanProxy`**: 각각 Javassist와 JDK Dynamic Proxy 기술을 사용하여 대상 POJO를 감싸는 프록시 객체를 만듭니다. 이를 통해 원본 코드 수정 없이 로깅, 트랜잭션과 같은 부가 기능(Aspect)을 메소드 호출 앞뒤에 적용할 수 있습니다.

---

## 5. 결론: Aspectran 철학과의 연관성

분석한 클래스 구조는 Aspectran의 철학을 충실히 반영하고 있습니다.

-   **POJO**: 모든 빈은 프레임워크에 종속되지 않는 일반 자바 클래스로 작성 가능합니다. `BeanFactory`가 POJO를 직접 다루도록 설계되었기 때문입니다.
-   **Simple (단순함)**: '규칙', '등록', '생성', '스코프'라는 직관적이고 명확한 역할 분담으로 전체 구조가 매우 단순하고 이해하기 쉽습니다.
-   **Fast Development & Startup (빠른 개발과 구동)**:
    -   단순한 구조는 학습 곡선을 낮춰 개발 속도를 높입니다.
    -   구동 시 무거운 클래스패스 스캐닝 대신, 설정 파일을 파싱하여 `BeanRule`을 등록하는 가벼운 작업만 수행합니다. 실제 빈 생성은 요청 시점에 지연(lazy)해서 일어나므로 초기 구동 속도가 매우 빠릅니다.

