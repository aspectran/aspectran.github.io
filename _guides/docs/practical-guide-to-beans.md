---
layout: page
format: plate article
subheadline: Aspectran Beans
title:  Aspectran Beans 실용 가이드
teaser: |
  Aspectran Beans에 대한 실용 가이드는 빈의 정의, 생명주기, 스코프 및 효과적으로 관리하는 방법을 이해하는 것입니다.
breadcrumb: true
comments: true
sidebar: toc-left
tags:
  - Beans, IoC, DI
category: docs
date: 2025-08-22
---

## 1. 핵심 개념: IoC와 DI

Aspectran Beans의 핵심은 애플리케이션의 객체("빈"이라 불림)를 관리하여 더 깨끗하고, 모듈화되고, 테스트하기 쉬운 코드를 작성하도록 돕는 것입니다.

-   **IoC (Inversion of Control, 제어의 역전)**: 개발자가 객체의 생명주기를 직접 생성하고 관리하는 대신, Aspectran 컨테이너가 이를 대신합니다. 개발자는 객체를 정의하기만 하면, 프레임워크가 적절한 시점에 객체를 인스턴스화, 설정 및 조립합니다. 이러한 제어의 "역전"을 통해 개발자는 비즈니스 로직에만 집중할 수 있습니다.

-   **DI (Dependency Injection, 의존성 주입)**: IoC를 구현하는 주요 메커니즘입니다. 객체가 자신의 의존성을 직접 생성하는 대신(`new MyService()`), 외부 소스(IoC 컨테이너)로부터 의존성을 "주입"받습니다. 이를 통해 컴포넌트 간의 결합도를 낮추어 관리, 테스트, 재사용이 더 쉬워집니다.

---

## 2. 빈(Bean) 정의하기

간단한 어노테이션을 사용하여 클래스를 빈으로 선언할 수 있습니다.

### `@Component`를 사용한 자동 탐지

빈을 등록하는 가장 쉬운 방법은 구성요소 클래스임을 나타내는 `@Component` 어노테이션을 추가하는 것입니다.
애플리케이션 시작 시 Aspectran의 클래스패스 스캐너가 이를 자동으로 탐지하여 빈으로 등록합니다.

```java
package com.example.myapp.service;

import com.aspectran.core.component.bean.annotation.Component;

@Component
public class MyService {
    public String getMessage() {
        return "Hello from MyService!";
    }
}
```

### `@Bean`을 사용한 명시적 정의

`@Bean` 어노테이션은 명시적으로 빈을 선언하기 위해 사용되며, 빈의 세부 속성을 추가적으로 지정할 수 있습니다.
`@Component` 어노테이션과 함께 클래스나 메소드에 적용할 수 있습니다.

#### 클래스에 사용
클래스에 `@Bean`을 사용하여 빈을 명시적으로 선언할 수 있습니다.

```java
package com.example.myapp.service;

import com.aspectran.core.component.bean.annotation.Bean;

@Component
@Bean(id = "anotherService")
public class AnotherService {
    // ...
}
```

#### 메소드에 사용 (팩토리 메소드 패턴)
복잡한 초기화 로직이 필요하거나 서드파티 라이브러리의 객체를 등록해야 할 때 유용한 강력한 기법입니다.
구성요소를 포함하고 있는 클래스(`@Component`) 내부에 객체를 반환하는 메소드를 정의하고, 그 메소드에 `@Bean` 어노테이션을 붙입니다.

```java
package com.example.myapp.config;

import com.aspectran.core.component.bean.annotation.Bean;
import com.aspectran.core.component.bean.annotation.Component;
import com.example.myapp.service.MyService;
import com.example.thirdparty.SomeLibraryClient;

@Component
public class AppConfig {

    @Bean(id = "myServiceFromFactory")
    public MyService createMyService() {
        // 필요하다면 복잡한 초기화 수행
        return new MyService();
    }

    @Bean
    public SomeLibraryClient someLibraryClient() {
        // 외부 라이브러리의 클라이언트를 설정하고 반환
        return new SomeLibraryClient("api.example.com", "your-api-key");
    }
}
```

---

## 3. 의존성 주입 (Dependency Injection)

빈이 정의되면 `@Autowired` 어노테이션을 사용하여 서로에게 주입할 수 있습니다.

### 생성자 주입 (권장)

가장 권장되는 접근 방식입니다. 빈이 생성될 때 의존성이 제공되도록 보장하여 객체가 항상 유효한 상태임을 보장합니다. 또한 의존성을 명시적으로 만들고 런타임 시 순환 의존성 문제를 방지합니다.

```java
package com.example.myapp.controller;

import com.aspectran.core.component.bean.annotation.Autowired;
import com.aspectran.core.component.bean.annotation.Bean;
import com.aspectran.core.component.bean.annotation.Component;
import com.example.myapp.service.MyService;

@Component
@Bean
public class MyController {

    private final MyService myService;

    @Autowired
    public MyController(MyService myService) {
        this.myService = myService;
    }

    public void handleRequest() {
        System.out.println(myService.getMessage());
    }
}
```

### 필드 및 수정자(Setter) 주입

생성자 주입이 가장 권장되지만, 수정자(Setter) 주입도 선택적 의존성을 위해 사용할 수 있습니다.

-   **수정자 주입**: 선택적 의존성에 유용하지만, 의존성이 주입되기 전까지 객체가 불완전한 상태로 존재할 수 있다는 단점이 있습니다.
-   **필드 주입**: Aspectran은 `public` 필드에 대해서만 의존성 주입이 가능합니다. `private` 필드에 직접 의존성을 주입하는 것을 지원하지 않으며, 테스트의 어려움과 의존성 은닉 문제로 인해 권장하지 않습니다. 항상 생성자 주입을 우선적으로 고려해야 합니다.

```java
// 수정자 주입 예시 (선택적 의존성에 사용)
@Component
public class MyController {
    private MyService myService;

    @Autowired
    public void setMyService(MyService myService) {
        this.myService = myService;
    }
}
```

### `@Qualifier`로 모호성 해결

의존성 주입 시 동일한 타입의 빈이 여러 개 발견되면 모호성(ambiguity) 문제가 발생합니다. Aspectran은 어떤 빈을 선택해야 할지 모르기 때문입니다. 이 문제는 `@Bean`으로 각 빈에 고유 ID를 부여하고, `@Qualifier`로 주입할 특정 빈을 지정하여 해결할 수 있습니다.

**1단계: `@Bean`으로 고유 ID 부여**

먼저, 각 구현 클래스에 `@Bean` 어노테이션을 추가하여 고유한 ID를 할당합니다.

**2단계: `@Qualifier`로 특정 빈 지정**

그 다음, 의존성을 주입하는 곳에서 `@Qualifier` 어노테이션을 사용하여 주입할 빈의 ID를 명시합니다.

```java
public interface NotificationService {
    void send(String message);
}

@Component
@Bean("email")
public class EmailNotificationService implements NotificationService {
    // ...
}

@Component
@Bean("sms")
public class SmsNotificationService implements NotificationService {
    // ...
}

@Component
public class OrderService {
    private final NotificationService notificationService;

    // "email"로 한정된 빈을 주입
    @Autowired
    public OrderService(@Qualifier("email") NotificationService notificationService) {
        this.notificationService = notificationService;
    }
}
```

### `@Value`로 설정값 주입

`@Value` 어노테이션을 사용하여 AsEL 표현식의 평가 결과 값을 빈에 주입할 수 있습니다.
의존성의 명확성과 불변성(immutability)을 보장하기 위해, 생성자 주입 방식이 주로 권장됩니다.
필드 주입 방식은 `public` 필드에 대해서만 의존성 주입이 가능하며, `private` 필드에 직접 주입하는 것은 지원되지 않습니다.
또한 `public` 수정자(Setter) 메소드를 통해 값을 주입할 수도 있습니다.

```java
@Component
public class AppInfo {

    private final String appVersion;
    private final String appName;

    // public 필드에 AsEL 표현식을 사용하여 외부 설정 값을 주입
    @Value("%{app^description}")
    public String description;

    private boolean startup;

    // 생성자를 통해 @Value로 외부 설정 값을 주입
    @Autowired
    public AppInfo(
            @Value("%{app^version}") String appVersion,
            @Value("%{app^name:DefaultAppName}") String appName) {
        this.appVersion = appVersion;
        this.appName = appName;
    }

    // 수정자(Setter) 메소드에 의한 의존성 주입
    @Value("%{app^startup}")
    public void setStartup(boolean startup) {
        this.startup = startup;
    }

    public void displayInfo() {
        System.out.println("Version: " + appVersion);
        System.out.println("Name: " + appName);
        System.out.println("startup: " + startup);
    }
}
```

---

## 4. 빈 스코프(Bean Scopes) 이해하기

빈 스코프는 빈 인스턴스의 생명주기를 제어합니다. `@Scope` 어노테이션으로 빈의 스코프를 설정할 수 있습니다.
`@Scope` 어노테이션은 `@Bean` 어노테이션과 함께 사용되어야 합니다.

-   `singleton` (기본값): 전체 애플리케이션 컨테이너에 대해 단 하나의 인스턴스만 생성됩니다.
-   `prototype`: 빈이 요청될 때마다 새로운 인스턴스가 생성됩니다.
-   `request`: 각 `Activity` 실행(요청)에 대해 새로운 인스턴스가 생성됩니다.
-   `session`: 각 `Session` 인스턴스에 대해 새로운 인스턴스가 생성됩니다.

```java
import com.aspectran.core.component.bean.annotation.Bean;
import com.aspectran.core.component.bean.annotation.Component;
import com.aspectran.core.component.bean.annotation.Scope;
import com.aspectran.core.context.rule.type.ScopeType;

@Component
@Bean
@Scope(ScopeType.PROTOTYPE)
public class MyPrototypeBean {
    public MyPrototypeBean() {
        System.out.println("New MyPrototypeBean instance created: " + this.hashCode());
    }
}
```

---

## 5. 빈 생명주기(Lifecycle) 관리

초기화 후나 소멸 전과 같이 빈의 생명주기 중 특정 시점에 사용자 정의 로직을 실행할 수 있습니다.

### 어노테이션 기반 콜백: `@Initialize` & `@Destroy`

-   `@Initialize`: 모든 의존성이 주입된 후 호출됩니다.
-   `@Destroy`: 빈이 컨테이너에서 제거되기 직전에 호출됩니다.

```java
@Component
public class LifecycleBean {

    @Initialize
    public void setup() {
        System.out.println("LifecycleBean has been initialized.");
    }

    @Destroy
    public void cleanup() {
        System.out.println("LifecycleBean is about to be destroyed.");
    }
}
```

### 인터페이스 기반 콜백: `InitializableBean` & `DisposableBean`

또는, 동일한 목적을 위해 프레임워크 인터페이스를 구현할 수도 있습니다.

```java
import com.aspectran.core.component.bean.ablility.DisposableBean;
import com.aspectran.core.component.bean.ablility.InitializableBean;
import com.aspectran.core.component.bean.annotation.Component;

@Component
public class LifecycleBean implements InitializableBean, DisposableBean {

    @Override
    public void initialize() throws Exception {
        System.out.println("LifecycleBean initialized via InitializableBean interface.");
    }

    @Override
    public void destroy() throws Exception {
        System.out.println("LifecycleBean destroyed via DisposableBean interface.");
    }
}
```

---

## 6. 고급 기능

### `FactoryBean`으로 복잡한 빈 생성하기

매우 복잡한 객체 생성 로직을 위해 `FactoryBean` 인터페이스를 구현할 수 있습니다.
이는 복잡한 생성 과정을 캡슐화하거나 프록시를 생성하는 데 유용합니다.
`getObject()` 메소드가 반환하는 빈의 인스턴스가 애플리케이션에 노출되며, 팩토리 자체는 노출되지 않습니다.

```java
import com.aspectran.core.component.bean.ablility.FactoryBean;
import com.aspectran.core.component.bean.annotation.Component;

// MyProduct가 인스턴스화하기 복잡한 클래스라고 가정
public class MyProduct {
    // ...
}

@Component
@Bean("myProduct") // 빈의 이름은 "myProduct"가 됨
public class MyProductFactory implements FactoryBean<MyProduct> {

    @Override
    public MyProduct getObject() throws Exception {
        // 복잡한 생성 및 설정 로직을 여기에 캡슐화
        MyProduct product = new MyProduct();
        // ... 속성 설정
        return product;
    }
}
```

### `Aware` 인터페이스로 프레임워크에 접근하기

빈이 Aspectran의 내부 프레임워크 객체에 접근해야 하는 경우, `Aware` 인터페이스를 구현할 수 있습니다.
예를 들어, `ActivityContextAware`는 현재 `ActivityContext`에 대한 접근을 제공합니다.

```java
import com.aspectran.core.component.bean.annotation.Bean;
import com.aspectran.core.component.bean.annotation.Component;
import com.aspectran.core.component.bean.aware.ActivityContextAware;
import com.aspectran.core.context.ActivityContext;

@Component
@Bean
public class MyAwareBean implements ActivityContextAware {

    private ActivityContext context;

    // 수정자(Setter) 메소드에 의한 의존성 주입
    @Override
    public void setActivityContext(ActivityContext context) {
        this.context = context; // 컨테이너가 여기에 ActivityContext를 주입
    }

    public void printCurrentTransletName() {
        if (this.context != null) {
            System.out.println("Executing in translet: " + context.getTransletName());
        }
    }
}
```

---

## 7. 빈 관련 구성 설정

이 모든 기능을 활성화하려면 Aspectran에게 빈을 어디서 찾을지 알려주어야 합니다.

### 컴포넌트 스캔 활성화

기본적으로 Aspectran 구성 설정 파일(`aspectran-config.apon`)에서 `context.scan` 파라메터에 스캔 대상 패키지의 경로를 배열로 추가해야 합니다.
Aspectran 구동시에 `@Component`, `@Bean` 어노테이션이 붙은 클래스를 자동으로 스캔해서 빈으로 등록합니다.
해당 애플리케이션의 기본 패키지의 경로를 우선적으로 추가하는 것이 좋습니다.

```apon
context: {
    name: root
    rules: [
        /config/root-context.xml
    ]
    resources: [
        /lib/ext
    ]
    scan: [
        com.aspectran.demo
    ]
    singleton: true
}
```

### XML 기반의 컴포넌트 스캔 (일괄 Bean 정의)

XML 기반의 Aspectran 구성 설정 파일(예: `root-config.xml`)에서 `<bean>` 요소의 `scan` 속성을 지정하면 스캔할 클래스를 일괄적으로 지정할 수 있습니다.
`scan` 속성에 와일드카드 패턴을 사용하여 더 유연하게 스캔할 클래스를 지정할 수 있습니다. 이는 Ant 경로 패턴과 유사하게 동작합니다.

-   `*`: 한 단계의 패키지 경로에서 0개 이상의 문자와 일치합니다.
-   `**`: 여러 단계의 패키지 경로와 일치합니다.

```xml
<aspectran>
    ...
    <!-- 'com.example.myapp' 패키지와 그 하위 패키지에서 모든 클래스를 찾아서 빈으로 일괄 등록 -->
    <bean scan="com.example.myapp.**"/>

    <!-- 'com.example.myapp' 패키지와 그 하위 패키지에서 'Bean'으로 끝나는 이름을 가진 클래스를 찾아서 빈으로 일괄 등록 -->
    <bean scan="com.example.myapp.**.*Bean"/>
    ...
</aspectran>
```

#### 빈 ID 명명 규칙 및 `mask` 속성

스캔을 통해 빈이 자동 탐지될 때, 빈 ID는 기본적으로 클래스의 단순 이름을 소문자 카멜 케이스(lower camel case)로 변환하여 생성됩니다.
-   `MyService` 클래스 → `myService` ID
-   `OrderController` 클래스 → `orderController` ID

`mask` 속성을 사용하면 이 기본 ID 생성 규칙을 재정의하고, 클래스의 전체 패키지 경로(fully qualified class name)에서 특정 부분만 추출하여 빈의 ID로 사용할 수 있습니다.
`mask` 패턴의 와일드카드(`*`) 부분에 해당하는 클래스 이름 부분이 ID가 됩니다.

예를 들어, `com.example.myapp.services.member.MemberService` 클래스가 스캔되었다고 가정해 보겠습니다.

```xml
<!-- mask를 사용하여 'member.MemberService'를 ID로 사용 -->
<bean scan="com.example.myapp.services.**" mask="com.example.myapp.services.*"/>
```
위 설정에서 `mask` 패턴의 `*` 부분은 `member.MemberService`에 해당하므로, 최종 빈 ID는 `member.MemberService`가 됩니다.

만약 어노테이션에 ID가 명시적으로 지정되어 있다면 (`@Bean("customId")`), `mask` 설정보다 우선합니다.

### XML 기반 빈 정의

어노테이션이 단순성 때문에 선호되지만, XML에서 직접 빈을 정의할 수도 있습니다.
이는 소스 코드를 수정하지 않고 빈을 재정의하거나 설정할 때 유용할 수 있습니다.

```xml
<aspectran>
    ...
    <bean id="myService" class="com.example.myapp.service.MyService"/>

    <bean id="myController" class="com.example.myapp.controller.MyController">
        <arguments>
            <item>#{myService}</item>
        </arguments>
    </bean>
    ...
</aspectran>
```
