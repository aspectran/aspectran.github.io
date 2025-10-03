---
title: "Aspectran Beans: The Official Guide"
subheadline: 사용자 가이드
---

{% capture info_message %}
Aspectran Beans는 Aspectran 프레임워크의 핵심에 내장된 강력한 IoC(Inversion of Control) 컨테이너입니다.
Spring Beans의 견고한 개념(IoC, DI 등)에서 영감을 받았지만, POJO 기반, 단순함, 그리고 빠른 개발 및 구동 속도라는 Aspectran의 핵심 철학에 맞춰 처음부터 다시 설계되었습니다.
{% endcapture %}
{% include alert.liquid info=info_message %}

## 1. 핵심 개념: IoC와 DI

Aspectran Beans의 핵심은 애플리케이션의 객체("빈"이라 불림)를 관리하여 더 깨끗하고, 모듈화되고, 테스트하기 쉬운 코드를 작성하도록 돕는 것입니다.

-   **IoC (Inversion of Control, 제어의 역전)**: 개발자가 객체의 생명주기를 직접 생성하고 관리하는 대신, Aspectran 컨테이너가 이를 대신합니다. 개발자는 객체를 정의하기만 하면, 프레임워크가 적절한 시점에 객체를 인스턴스화, 설정 및 조립합니다. 이러한 제어의 "역전"을 통해 개발자는 비즈니스 로직에만 집중할 수 있습니다.

-   **DI (Dependency Injection, 의존성 주입)**: IoC를 구현하는 주요 메커니즘입니다. 객체가 자신의 의존성을 직접 생성하는 대신(`new MyService()`), 외부 소스(IoC 컨테이너)로부터 의존성을 "주입"받습니다. 이를 통해 컴포넌트 간의 결합도를 낮추어 관리, 테스트, 재사용이 더 쉬워집니다.

---

## 2. 기본: 빈(Bean) 정의와 스코프

### `@Component`를 사용한 자동 탐지

빈을 등록하는 가장 쉬운 방법은 클래스에 `@Component` 어노테이션을 추가하는 것입니다. 애플리케이션 시작 시 Aspectran의 클래스패스 스캐너가 이를 자동으로 탐지하여 빈으로 등록합니다.

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

`@Bean` 어노테이션은 빈을 명시적으로 선언하고 ID나 스코프 같은 세부 속성을 지정할 때 사용됩니다. 클래스나 팩토리 메소드에 적용할 수 있습니다.

-   **클래스에 사용**: `@Component`와 함께 사용하여 빈의 ID를 지정할 수 있습니다.
    ```java
    @Component
    @Bean(id = "anotherService")
    public class AnotherService { /* ... */ }
    ```

-   **팩토리 메소드에 사용**: 복잡한 초기화 로직이나 서드파티 라이브러리 객체를 빈으로 등록할 때 유용합니다. `@Component` 클래스 내부에 객체를 반환하는 메소드를 만들고 `@Bean`을 붙입니다.
    ```java
    @Component
    public class AppConfig {
        @Bean
        public SomeLibraryClient someLibraryClient() {
            return new SomeLibraryClient("api.example.com", "your-api-key");
        }
    }
    ```

### 빈 스코프(Bean Scopes) 심층 분석

빈 스코프는 빈 인스턴스의 생명주기와 가시성을 제어합니다. `@Scope` 어노테이션으로 설정할 수 있습니다.

| 스코프 (Scope) | 설명 | 생명주기 | 주요 사용 사례 |
| :--- | :--- | :--- | :--- |
| **`singleton`** | 컨텍스트 내 단일 인스턴스 | 애플리케이션 전체 | 상태 없는 서비스, DAO |
| **`prototype`** | 요청 시마다 새 인스턴스 | GC에 의해 관리 | 상태 있는 객체, Builder |
| **`request`** | 요청마다 새 인스턴스 | 단일 `Activity` 실행 | 요청 관련 데이터 처리 |
| **`session`** | 세션마다 새 인스턴스 | 단일 사용자 세션 | 사용자별 데이터 관리 |

-   **`singleton` (기본값)**: IoC 컨테이너 내에서 단 하나의 인스턴스만 생성되어 공유됩니다.
-   **`prototype`**: 빈을 주입받거나 요청할 때마다 매번 새로운 인스턴스가 생성됩니다. 컨테이너는 생성 이후 생명주기를 관리하지 않습니다.
-   **`request`**: `Activity` 실행(예: HTTP 요청) 범위 내에서 단일 인스턴스가 유지됩니다. 현재 `Activity`가 `RequestAdapter`를 지원해야 합니다.
-   **`session`**: 사용자 세션 범위 내에서 단일 인스턴스가 유지됩니다. 현재 `Activity`가 `SessionAdapter`를 지원해야 합니다.

```java
import com.aspectran.core.component.bean.annotation.Scope;
import com.aspectran.core.context.rule.type.ScopeType;

@Component
@Bean
@Scope(ScopeType.PROTOTYPE)
public class MyPrototypeBean { /* ... */ }
```

---

## 3. 핵심: 의존성 주입 (Dependency Injection)

`@Autowired` 어노테이션을 사용하여 빈 간의 의존성을 주입합니다.

### 생성자 주입 (권장)

의존성을 불변(immutable)으로 만들고, 객체가 생성될 때 완전한 상태임을 보장하는 가장 좋은 방법입니다.

```java
@Component
public class MyController {
    private final MyService myService;

    @Autowired
    public MyController(MyService myService) {
        this.myService = myService;
    }
}
```

### 필드 및 수정자(Setter) 주입

선택적 의존성을 주입할 때 유용하지만, 생성자 주입을 우선적으로 고려해야 합니다.

-   **수정자(Setter) 주입**: `public` 수정자 메소드에 `@Autowired`를 붙입니다.
-   **필드 주입**: `public` 필드에만 주입 가능하며, 권장되지 않습니다.

### `@Qualifier`로 모호성 해결

동일한 타입의 빈이 여러 개 있을 때, `@Qualifier("beanId")`를 사용하여 주입할 특정 빈을 지정할 수 있습니다.

```java
public interface NotificationService { /* ... */ }

@Component @Bean("email")
public class EmailNotificationService implements NotificationService { /* ... */ }

@Component @Bean("sms")
public class SmsNotificationService implements NotificationService { /* ... */ }

@Component
public class OrderService {
    private final NotificationService notificationService;

    @Autowired
    public OrderService(@Qualifier("email") NotificationService notificationService) {
        this.notificationService = notificationService;
    }
}
```

### `@Value`로 설정값 주입

`@Value` 어노테이션을 사용하여 AsEL 표현식의 평가 결과(주로 외부 설정값)를 주입할 수 있습니다.

```java
@Component
public class AppInfo {
    private final String appVersion;

    @Autowired
    public AppInfo(@Value("%{app^version:1.0.0}") String appVersion) {
        this.appVersion = appVersion;
    }
}
```

### 컬렉션 주입 (`List<T>`, `Map<String, T>`)

동일한 인터페이스를 구현하는 모든 빈을 `List`나 `Map`으로 한 번에 주입받을 수 있습니다. 이는 전략 패턴(Strategy Pattern) 등을 구현할 때 매우 유용합니다.

```java
// 모든 NotificationService 구현체를 주입받음
@Component
public class NotificationManager {
    private final List<NotificationService> services;
    private final Map<String, NotificationService> serviceMap;

    @Autowired
    public NotificationManager(List<NotificationService> services) {
        this.services = services; // [EmailNotificationService, SmsNotificationService]
        this.serviceMap = services.stream()
                .collect(Collectors.toMap(s -> s.getClass().getSimpleName(), s -> s));
    }

    public void sendToAll(String message) {
        for (NotificationService service : services) {
            service.send(message);
        }
    }
}
```

### 선택적 의존성 주입 (`Optional<T>`)

특정 프로파일에서만 활성화되는 등, 존재하지 않을 수도 있는 빈을 주입받아야 할 때 `java.util.Optional<T>`을 사용할 수 있습니다.

```java
@Component
public class MainService {
    private final Optional<OptionalService> optionalService;

    @Autowired
    public MainService(Optional<OptionalService> optionalService) {
        this.optionalService = optionalService;
    }

    public void doSomething() {
        optionalService.ifPresent(service -> service.performAction());
    }
}
```

---

## 4. 고급 기능

### 프로파일(`@Profile`)을 이용한 환경별 설정

`@Profile` 어노테이션을 사용하면 특정 프로파일(예: `dev`, `prod`)이 활성화되었을 때만 빈을 등록하도록 할 수 있습니다.

```java
// 개발 환경에서만 사용될 Mock 서비스
@Component
@Profile("dev")
public class MockNotificationService implements NotificationService { /* ... */ }

// 운영 환경에서 실제 SMS를 발송하는 서비스
@Component
@Profile("prod")
public class RealSmsNotificationService implements NotificationService { /* ... */ }
```
활성화할 프로파일은 Aspectran 설정에서 지정할 수 있습니다.

### `FactoryBean`으로 복잡한 빈 생성하기

생성 로직이 매우 복잡하거나 캡슐화가 필요할 때 `FactoryBean` 인터페이스를 구현합니다. `getObject()` 메소드가 반환하는 객체가 실제 빈으로 등록됩니다.

```java
@Component
@Bean("myProduct")
public class MyProductFactory implements FactoryBean<MyProduct> {
    @Override
    public MyProduct getObject() throws Exception {
        // 복잡한 생성 및 설정 로직
        return new MyProduct();
    }
}
```

### `Aware` 인터페이스로 프레임워크에 접근하기

`ActivityContextAware`와 같은 `Aware` 인터페이스를 구현하면, 빈이 Aspectran의 내부 객체(e.g., `ActivityContext`)에 접근할 수 있습니다.

```java
@Component
public class MyAwareBean implements ActivityContextAware {
    private ActivityContext context;

    @Override
    public void setActivityContext(ActivityContext context) {
        this.context = context;
    }
}
```

### 이벤트 발행 및 구독 (Event Handling)

Aspectran은 애플리케이션 내의 컴포넌트(빈) 간의 느슨한 결합(loosely coupled)을 위해 발행-구독(Publish-Subscribe) 방식의 이벤트 처리 메커니즘을 제공합니다. 이를 통해 특정 로직의 수행 결과를 다른 여러 컴포넌트에 전파해야 할 때, 직접 의존 관계를 맺지 않고 이벤트를 통해 간단하게 구현할 수 있습니다.

#### 이벤트 리스너 만들기 (`@EventListener`)

이벤트를 수신하여 처리하는 리스너는 `@EventListener` 어노테이션을 사용하여 간단하게 만들 수 있습니다.

*   이벤트를 처리할 메소드에 `@EventListener` 어노테이션을 붙입니다.
*   해당 메소드는 **반드시 하나의 파라미터**를 가져야 하며, 이 파라미터의 타입이 구독할 이벤트의 타입이 됩니다.
*   프레임워크가 시작될 때, `@Component`로 등록된 빈들에서 `@EventListener`가 붙은 메소드를 찾아 자동으로 이벤트 리스너로 등록합니다.

**예시: 주문 완료 이벤트를 처리하는 리스너**

```java
// 1. 이벤트 정의 (POJO)
public class OrderCompletedEvent {
    private final String orderId;

    public OrderCompletedEvent(String orderId) {
        this.orderId = orderId;
    }

    public String getOrderId() {
        return orderId;
    }
}

// 2. 이벤트 리스너 빈 정의
@Component
public class OrderEventListener {

    @EventListener
    public void handleOrderCompleted(OrderCompletedEvent event) {
        // 주문 완료 이벤트가 발행되면 이 메소드가 호출됩니다.
        System.out.println("Order [" + event.getOrderId() + "] has been completed.");
        // ... 재고 감소, 배송 알림 등의 후속 처리 로직 ...
    }

    @EventListener
    public void handleAnyObject(Object event) {
        // 모든 타입의 이벤트를 수신하려면 Object 타입으로 선언할 수 있습니다.
    }
}
```

#### 이벤트 발행하기 (`EventPublisher`)

이벤트 발행은 `EventPublisher` 인터페이스를 통해 이루어집니다. 이 타입의 빈을 주입받아 `publish()` 메소드를 호출하기만 하면 됩니다.

*   이벤트 발행 빈을 정의하고, 해당 빈을 주입받습니다.
*   `publish(Object event)` 메소드를 호출하여 이벤트를 발행합니다.
*   `EventPublisher`는 발행된 이벤트 객체의 타입을 확인하고, 해당 이벤트를 구독하는 모든 `@EventListener`에게 이벤트를 전파합니다.

**예시: 주문 서비스에서 주문 완료 이벤트 발행**

```java
// 주문 이벤트 발행 빈을 명시적으로 정의
@Component
public class OrderEventPublisher extends InstantActivitySupport {

    // 주문 완료 이벤트 발행
    public void publish(OrderCompletedEvent orderCompletedEvent) {
        getEventPublisher().publish(orderCompletedEvent);
    }

    // 주문 취소 이벤트 발행
    public void publish(OrderCanceledEvent orderCanceledEvent) {
        getEventPublisher().publish(orderCanceledEvent);
    }
}

@Component
public class OrderService {

    private final EventPublisher orderEventPublisher;

    @Autowired
    public OrderService(OrderEventPublisher orderEventPublisher) {
        this.eventPublisher = orderEventPublisher;
    }

    public void completeOrder(String orderId) {
        // ... 주문 완료 처리 로직 ...
        System.out.println("Processing completion for order [" + orderId + "]");

        // 이벤트 생성 및 발행
        OrderCompletedEvent event = new OrderCompletedEvent(orderId);
        this.orderEventPublisher.publish(event);
    }

    public void cancelOrder(String orderId) {
        // ... 주문 취소 처리 로직 ...
        System.out.println("Processing cancellation for order [" + orderId + "]");

        // 이벤트 생성 및 발행
        OrderCanceledEvent event = new OrderCanceledEvent(orderId);
        this.orderEventPublisher.publish(event);
    }
}
```

이처럼 이벤트 메커니즘을 활용하면, `OrderService`는 주문 완료 후 어떤 작업들이 수행되어야 하는지 알 필요 없이 자신의 핵심 책임에만 집중할 수 있습니다. 이벤트에 관심 있는 다른 컴포넌트들이 `@EventListener`를 통해 작업을 이어가므로, 시스템의 유연성과 확장성이 크게 향상됩니다.

### 비동기 메소드 실행 (`@Async`)

`@Async` 어노테이션을 사용하면, 시간이 오래 걸리는 작업을 별도의 스레드에서 비동기적으로 실행하여 현재 요청 처리 스레드를 차단하지 않고 즉시 반환할 수 있습니다. 이 기능은 Aspectran의 빈 프록시(Bean Proxy)를 통해 구현됩니다.

#### `@Async` 기본 사용법

Bean의 메소드에 `@Async` 어노테이션을 추가하면 해당 메소드는 별도의 스레드에서 비동기로 호출됩니다. 반환 타입은 `void` 또는 `java.util.concurrent.Future`의 구현체여야 합니다.

```java
@Component
@Bean("myAsyncTaskService")
public class MyAsyncTaskService {

    @Async
    public void doSomething() {
        // 이 코드는 별도의 스레드에서 실행됩니다.
    }

    @Async
    public Future<String> doSomethingAndReturn() {
        // 작업을 실행하고 Future 객체를 통해 결과를 반환합니다.
        return new CompletableFuture<>(() -> "Hello from async task!");
    }
}
```

#### 비동기 컨텍스트와 `ProxyActivity`

*   `@Async` 메소드가 호출될 때, 현재 스레드에 `Activity`가 없으면 어드바이스 실행을 위한 경량 컨텍스트인 **`ProxyActivity`가 새로 생성**됩니다.
*   하나의 비동기 작업 내에서 여러 `@Advisable` 메소드가 연쇄적으로 호출될 경우, **최초에 생성된 `ProxyActivity` 인스턴스가 해당 스레드 내에서 계속 공유**됩니다. 이를 통해 작업 단위 내에서 일관된 컨텍스트를 유지할 수 있습니다.
*   만약 기존 `Activity`가 존재하는 스레드에서 `@Async`가 호출되면, `ProxyActivity`는 기존 `Activity`를 **래핑(wrapping)**하여 생성됩니다. 이 경우, 원본 `Activity`의 데이터(`ActivityData`)를 공유하게 되어 비동기 작업과 호출자 간의 데이터 교환이 가능해집니다.

#### `CompletableFuture` 사용 시 주의사항

`@Async` 메소드 내에서 `CompletableFuture.supplyAsync()`나 `thenApplyAsync()`와 같이 새로운 스레드 풀에서 코드를 실행하는 `CompletableFuture`의 조합을 사용할 경우, Aspectran의 `Activity` 컨텍스트가 해당 스레드로 전파되지 않습니다. 즉, `CompletableFuture`가 만드는 새로운 스레드에서는 `getCurrentActivity()`를 호출하면 `NoActivityStateException`이 발생합니다.

`@Async`에 의해 생성된 스레드 내에서 모든 작업을 동기적으로 처리하고 최종 결과만 `CompletableFuture.completedFuture()`로 감싸서 반환하는 것이 안전합니다.

```java
@Async
public Future<String> correctUsage() {
    // 이 블록은 @Async에 의해 관리되는 스레드에서 실행되므로 Activity 컨텍스트에 접근 가능
    getCurrentActivity().getActivityData().put("key", "value");

    // CompletableFuture를 단순히 결과 전달용으로만 사용
    return CompletableFuture.completedFuture("some-result");
}

@Async
public Future<String> wrongUsage() {
    // 잘못된 사용 예: supplyAsync 내부에서는 Activity 컨텍스트에 접근할 수 없음
    return CompletableFuture.supplyAsync(() -> {
        // 이 블록은 별도의 스레드에서 실행되므로,
        // getCurrentActivity()를 호출하면 NoActivityStateException이 발생합니다.
        getCurrentActivity().getActivityData().put("key", "value"); // 예외 발생!
        return "some-result";
    });
}
```

#### 사용자 정의 Executor 사용

기본 Executor 대신 별도의 스레드 풀 정책을 적용하고 싶다면, `AsyncTaskExecutor` 타입의 Bean을 직접 정의하고 `@Async` 어노테이션에 해당 Bean의 ID나 클래스를 지정할 수 있습니다.

```java
// "myCustomExecutor"라는 ID로 등록된 Executor 사용
@Async("myCustomExecutor")
public void doSomethingWithCustomExecutor() {
    // ...
}
```

---

## 5. 빈 생명주기(Lifecycle) 관리

### 전체 생명주기 순서

싱글톤 빈은 다음과 같은 순서로 생성되고 소멸됩니다.

1.  **인스턴스화**: 생성자 호출
2.  **의존성 주입**: `@Autowired`가 붙은 필드 및 수정자(setter)에 의존성 주입
3.  **Aware 인터페이스 처리**: `Aware` 인터페이스의 `set*()` 메소드 호출
4.  **초기화 콜백 (Post-Initialization)**:
    -   `@Initialize` 어노테이션이 붙은 메소드 호출
    -   `InitializableBean` 인터페이스의 `initialize()` 메소드 호출
5.  **(빈 사용 가능 상태)**
6.  **소멸 전 콜백 (Pre-Destruction)**:
    -   `@Destroy` 어노테이션이 붙은 메소드 호출
    -   `DisposableBean` 인터페이스의 `destroy()` 메소드 호출

### 어노테이션 기반 콜백: `@Initialize` & `@Destroy`

-   `@Initialize`: 모든 의존성이 주입된 후 초기화 로직을 실행합니다.
-   `@Destroy`: 빈이 소멸되기 직전 정리 로직을 실행합니다.

```java
@Component
public class LifecycleBean {
    @Initialize
    public void setup() { /* ... */ }

    @Destroy
    public void cleanup() { /* ... */ }
}
```

### 인터페이스 기반 콜백: `InitializableBean` & `DisposableBean`

프레임워크 인터페이스를 직접 구현하여 동일한 목적을 달성할 수도 있습니다.

```java
@Component
public class LifecycleBean implements InitializableBean, DisposableBean {
    @Override
    public void initialize() throws Exception { /* ... */ }

    @Override
    public void destroy() throws Exception { /* ... */ }
}
```

---

## 6. 구성 설정 (Configuration)

### 어노테이션 기반 설정 활성화

어노테이션을 사용한 빈을 활성화하려면, Aspectran의 메인 설정 파일(APON 형식)에서 `context.scan` 파라미터에 스캔할 기본 패키지를 지정해야 합니다.

```apon
context: {
    scan: [
        com.example.myapp
    ]
}
```

### XML 기반 설정

XML을 사용하면 소스 코드 변경 없이 빈의 구성과 관계를 정의할 수 있어 유연성이 높습니다.

#### 기본 정의 및 의존성 주입

`<bean>` 요소로 빈을 정의하고, `<argument>`(생성자 주입)와 `<property>`(수정자 주입) 자식 요소를 사용하여 의존성을 설정합니다.

```xml
<bean id="myService" class="com.example.myapp.service.MyService"/>

<bean id="myController" class="com.example.myapp.controller.MyController">
    <!-- 생성자 인자 주입 -->
    <argument>#{myService}</argument>
    <!-- 수정자(Setter) 속성 주입 -->
    <property name="timeout" value="5000"/>
</bean>
```

#### 프로파일을 이용한 조건부 아이템 그룹화

여러 개의 `<argument>` 또는 `<property>` 요소들을 특정 프로파일에서만 함께 활성화하거나 비활성화해야 할 경우, `<arguments>` 또는 `<properties>` 래퍼(wrapper) 요소를 사용할 수 있습니다. 이 래퍼 요소에 `profile` 속성을 지정하면, 내부에 포함된 모든 `<item>` 요소들이 해당 프로파일에 종속됩니다.

```xml
<bean id="dbConnector" class="com.example.DbConnector">
    <properties profile="dev">
        <item name="url" value="jdbc:h2:mem:devdb"/>
        <item name="username" value="sa"/>
    </properties>
    <properties profile="prod">
        <item name="url" value="jdbc:mysql://prod.db.server/main"/>
        <item name="username" value="prod_user"/>
    </properties>
</bean>
```
개별 아이템을 정의할 때는 `<argument>`/`<property>`를 사용하고, 여러 아이템을 프로파일에 따라 그룹화할 때만 `<arguments>`/`<properties>`를 사용하는 것이 권장되는 스타일입니다.

#### 컴포넌트 스캔 (`<bean scan="...">`)

XML에서도 `<bean scan="...">`을 사용하여 컴포넌트 스캔을 활성화할 수 있습니다.

```xml
<!-- 'com.example.myapp' 패키지와 그 하위 패키지를 모두 스캔 -->
<bean scan="com.example.myapp.**"/>
```

#### 내부 빈과 중첩 제한

다른 빈의 속성으로만 사용될 익명의 내부 빈을 정의할 수 있습니다. Aspectran은 설정의 과도한 복잡성을 방지하기 위해 **내부 빈의 최대 중첩을 3단계(depth)로 제한**합니다.

```xml
<bean id="outerBean" class="com.example.OuterBean">
    <properties>
        <item name="inner">
            <!-- ID가 없는 내부 빈 (1단계) -->
            <bean class="com.example.InnerBean">
                <!-- ... -->
            </bean>
        </item>
    </properties>
</bean>
```

### 어노테이션과 XML 설정의 조합

어노테이션 기반의 컴포넌트 스캔과 XML 기반의 명시적 빈 정의를 함께 사용할 수 있습니다. 일반적으로 컴포넌트 스캔을 기본으로 사용하고, 특정 빈을 재정의하거나 외부 라이브러리를 등록할 때 XML을 사용합니다. 동일한 ID의 빈이 둘 다에 정의된 경우, 나중에 로드되는 설정이 우선권을 가질 수 있으며, `<bean important="true">` 속성으로 덮어쓰기를 강제할 수 있습니다.

---

## 7. Best Practices 및 흔한 실수 (Pitfalls)

### 생성자 주입을 선호하세요

-   **불변성(Immutability)**: `final` 필드를 사용할 수 있어 빈의 상태가 변경되지 않음을 보장합니다.
-   **의존성 명시**: 객체가 기능하는 데 필요한 모든 의존성이 생성자에 명확하게 드러납니다.
-   **순환 참조 방지**: 생성자 주입을 사용할 경우, 빈 A와 B가 서로를 필요로 하는 순환 참조가 발생하면 애플리케이션 시작 시점에 오류가 발생하여 문제를 즉시 발견할 수 있습니다.

### 순환 의존성을 피하세요

순환 의존성은 설계상의 문제를 나타내는 신호일 수 있습니다. 두 클래스가 서로 너무 많은 책임을 지고 있다는 의미일 수 있으므로, 책임을 분리하여 제3의 클래스로 옮기는 리팩토링을 고려하세요. 불가피한 경우, 수정자(setter) 주입을 사용하면 순환 참조 문제를 해결할 수 있습니다.

### `prototype` 빈의 생명주기를 이해하세요

`prototype` 스코프의 빈은 컨테이너가 생성하고 의존성을 주입한 후에는 더 이상 관리하지 않습니다. 따라서 `@Destroy`나 `DisposableBean`과 같은 소멸 관련 콜백이 **호출되지 않습니다.** `prototype` 빈이 데이터베이스 커넥션과 같은 중요한 리소스를 점유하고 있다면, 해당 리소스를 해제하는 로직을 직접 호출해야 합니다.

### 싱글톤 빈과 상태(State)

싱글톤 빈은 애플리케이션 전체에서 단 하나의 인스턴스만 존재하므로, 여러 스레드에서 동시에 접근할 수 있습니다. 만약 싱글톤 빈이 변경 가능한 상태(e.g., 멤버 변수)를 가지고 있다면, 동시성(concurrency) 문제가 발생할 수 있습니다. 싱글톤 빈은 가급적 상태를 가지지 않도록(stateless) 설계하는 것이 가장 좋습니다. 상태가 꼭 필요하다면 `ThreadLocal`을 사용하거나, 동기화(synchronization) 처리를 신중하게 구현해야 합니다.
