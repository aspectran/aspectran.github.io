---
title: "Aspectran Beans: The Official Guide"
subheadline: Core Guides
---

{% capture info_message %}
Aspectran Beans is a powerful Inversion of Control (IoC) container built into the core of the Aspectran framework.
Inspired by the robust concepts of Spring Beans (IoC, DI, etc.), it has been redesigned from the ground up to align with Aspectran's core philosophy of being **POJO-based, simple, and fast in development and startup speed**.
{% endcapture %}
{% include alert.liquid info=info_message %}

## 1. Core Concepts: IoC and DI

The core of Aspectran Beans is to help you write cleaner, more modular, and easier-to-test code by managing your application's objects (called "beans").

-   **IoC (Inversion of Control)**: Instead of you creating and managing the lifecycle of your objects, the Aspectran container does it for you. You just define the objects, and the framework instantiates, configures, and assembles them at the appropriate time. This "inversion" of control allows you to focus solely on your business logic.

-   **DI (Dependency Injection)**: This is the primary mechanism for implementing IoC. Instead of an object creating its own dependencies (`new MyService()`), it receives them from an external source (the IoC container). This reduces the coupling between components, making them easier to manage, test, and reuse.

---

## 2. Basics: Bean Definition and Scopes

### Automatic Detection with `@Component`

The easiest way to register a bean is to add the `@Component` annotation to a class. At application startup, Aspectran's classpath scanner will automatically detect it and register it as a bean.

The `@Component` annotation serves as the primary entry point for all annotation-based configuration. Other configuration annotations such as `@Bean`, `@Aspect`, `@Schedule`, and `@Profile` are only processed if they are on a class that is also marked with `@Component`. If these annotations are used on a class without `@Component`, they will be ignored, and a warning will be logged at startup. Therefore, always start by adding `@Component` to any class you intend to configure with annotations.

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

### Explicit Definition with `@Bean`

The `@Bean` annotation is used to explicitly declare a bean and specify detailed attributes like its ID or scope. It can be applied to a class or a factory method.

-   **On a class**: Can be used with `@Component` to specify the bean's ID.
    ```java
    @Component
    @Bean(id = "anotherService")
    public class AnotherService { /* ... */ }
    ```

-   **On a factory method**: Useful for complex initialization logic or for registering third-party library objects as beans. Create a method that returns an object within a `@Component` class and annotate it with `@Bean`.
    ```java
    @Component
    public class AppConfig {
        @Bean
        public SomeLibraryClient someLibraryClient() {
            return new SomeLibraryClient("api.example.com", "your-api-key");
        }
    }
    ```

### In-depth Analysis of Bean Scopes

Bean scopes control the lifecycle and visibility of a bean instance. They can be set with the `@Scope` annotation.

| Scope         | Description                     | Lifecycle                | Primary Use Case          |
| :------------ | :------------------------------ | :----------------------- | :------------------------ |
| **`singleton`** | Single instance in the context  | Entire application       | Stateless services, DAOs  |
| **`prototype`** | New instance per request        | Managed by GC            | Stateful objects, Builders|
| **`request`**   | New instance per request        | Single `Activity` execution| Request-related data handling |
| **`session`**   | New instance per session        | Single user session      | User-specific data management|

-   **`singleton` (default)**: Only one instance is created and shared within the IoC container.
-   **`prototype`**: A new instance is created each time the bean is injected or requested. The container does not manage the lifecycle after creation.
-   **`request`**: A single instance is maintained within the scope of an `Activity` execution (e.g., an HTTP request). The current `Activity` must support a `RequestAdapter`.
-   **`session`**: A single instance is maintained within the scope of a user session. The current `Activity` must support a `SessionAdapter`.

```java
import com.aspectran.core.component.bean.annotation.Scope;
import com.aspectran.core.context.rule.type.ScopeType;

@Component
@Bean
@Scope(ScopeType.PROTOTYPE)
public class MyPrototypeBean { /* ... */ }
```

---

## 3. Core: Dependency Injection

The `@Autowired` annotation is used to inject dependencies between beans.

### Constructor Injection (Recommended)

This is the best way to make dependencies immutable and ensure that an object is in a complete state when it is created.

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

### Field and Setter Injection

Useful for injecting optional dependencies, but constructor injection should be considered first.

-   **Setter Injection**: Annotate a `public` setter method with `@Autowired`.
-   **Field Injection**: Can only be injected into `public` fields and is not recommended.

### Resolving Ambiguity with `@Qualifier`

When there are multiple beans of the same type, you can use `@Qualifier("beanId")` to specify the particular bean to inject.

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

### Injecting Configuration Values with `@Value`

You can use the `@Value` annotation to inject the evaluation result of an AsEL expression (usually an external configuration value).

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

### Collection Injection (`List<T>`, `Map<String, T>`)

You can inject all beans that implement the same interface at once into a `List` or `Map`. This is very useful for implementing patterns like the Strategy Pattern.

```java
// Injects all NotificationService implementations
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

### Optional Dependency Injection (`Optional<T>`)

When you need to inject a bean that may not exist, such as one that is only active in a specific profile, you can use `java.util.Optional<T>`.

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

## 4. Advanced Features

### Environment-specific Configuration with `@Profile`

The `@Profile` annotation allows you to register a bean only when a specific profile (e.g., `dev`, `prod`) is active. This annotation must be placed on a class that is also annotated with `@Component` to take effect.

```java
// Mock service to be used only in the development environment
@Component
@Profile("dev")
public class MockNotificationService implements NotificationService { /* ... */ }

// Service that sends actual SMS in the production environment
@Component
@Profile("prod")
public class RealSmsNotificationService implements NotificationService { /* ... */ }
```
The active profile can be specified in the Aspectran configuration.

### Creating Complex Beans with `FactoryBean`

Implement the `FactoryBean` interface when the creation logic is very complex or requires encapsulation. The object returned by the `getObject()` method is registered as the actual bean.

```java
@Component
@Bean("myProduct")
public class MyProductFactory implements FactoryBean<MyProduct> {
    @Override
    public MyProduct getObject() throws Exception {
        // Complex creation and configuration logic
        return new MyProduct();
    }
}
```

The `FactoryBean` interface also includes a `isSingleton()` method, which determines the scope of the object created by the factory.

-   **If `isSingleton()` returns `true` (the default):** The object returned by `getObject()` is treated as a singleton. The framework calls `getObject()` only once, caches the result, and returns this cached instance for all subsequent requests for that bean.
-   **If `isSingleton()` returns `false`:** The object is treated as a prototype. The framework calls `getObject()` every time the bean is requested, creating a new instance for each request. The returned object is not cached.

This allows a single `FactoryBean` instance (which is itself a singleton bean) to have fine-grained control over whether the object it produces is a shared singleton or a new prototype instance.

```java
@Component
@Bean("myPrototypeProduct")
public class MyProductFactory implements FactoryBean<MyProduct> {
    @Override
    public MyProduct getObject() throws Exception {
        // This method will be called for every request for "myPrototypeProduct".
        return new MyProduct();
    }

    @Override
    public boolean isSingleton() {
        // Return false to indicate that the created object is a prototype.
        return false;
    }
}
```

### Creating Beans with a Factory Method

In addition to `FactoryBean`, Aspectran provides a way to create beans using a dedicated factory method. This is a powerful pattern for encapsulating complex object creation logic or integrating third-party libraries.

#### Using Annotations (`@Bean` on a method)

The most common way to use a factory method is to annotate a method with `@Bean` inside a `@Component` class. The object returned by the method is registered as a bean.

```java
@Component
public class AppConfig {
    @Bean(id = "someClient")
    public SomeLibraryClient createSomeLibraryClient() {
        // Complex setup logic
        SomeLibraryClient client = new SomeLibraryClient();
        client.setApiKey("your-api-key");
        client.setEndpoint("api.example.com");
        return client;
    }
}
```
In this case, any lifecycle annotations like `@Initialize` or `@Destroy` should be placed on the `SomeLibraryClient` class itself, as they apply to the product object.

#### Using XML Configuration

There are two distinct ways to declare a factory method in XML, and the key difference lies in what the `<bean>` tag defines and where lifecycle callbacks (`initMethod`, `destroyMethod`) are applied.

**Style 1: Defining the Product Bean (using `factoryBean`)**

This is the true factory method pattern where the `<bean>` tag defines the final **product object**. All lifecycle methods apply to this product.

```xml
<!-- First, define the factory itself as a regular bean -->
<bean id="myProductFactory" class="com.example.MyProductFactory"/>

<!-- Then, define the product bean using the factory -->
<bean id="myProduct"
      factoryBean="myProductFactory"
      factoryMethod="createInstance"
      initMethod="initializeProduct"
      destroyMethod="cleanupProduct"/>
```
In this case, `initializeProduct` and `cleanupProduct` methods must exist on the `MyProduct` class (the product), not on `MyProductFactory`.

For **static** factory methods, you can use the `class:` prefix without defining a separate factory bean:
```xml
<bean id="myProduct"
      factoryBean="class:com.example.MyProductFactory"
      factoryMethod="createStaticInstance"
      initMethod="initializeProduct"/>
```
Here too, `initializeProduct` is called on the product object.

**Style 2: Defining the Factory Bean (using `class` + `factoryMethod`)**

This pattern is more analogous to implementing `FactoryBean`. The `<bean>` tag defines the **factory object itself**, and lifecycle methods apply to this factory instance.

```xml
<bean id="myProduct"
      class="com.example.MyProductFactory"
      factoryMethod="createStaticInstance"
      initMethod="initializeFactory"
      destroyMethod="cleanupFactory"/>
```
In this style, `initializeFactory` and `cleanupFactory` methods must exist on the `MyProductFactory` class. The `createStaticInstance` method is then called on this initialized factory to produce the final object that gets exposed as the "myProduct" bean. The product itself does not receive these lifecycle calls.

Understanding this distinction is crucial for correctly managing bean lifecycles in XML configurations.

### Accessing the Framework with `Aware` Interfaces

By implementing `Aware` interfaces like `ActivityContextAware`, a bean can access Aspectran's internal objects (e.g., `ActivityContext`).

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

### Event Handling (Publish-Subscribe)

Aspectran provides a publish-subscribe event handling mechanism for loose coupling between components (beans) within the application. This allows you to easily implement scenarios where the result of a specific logic needs to be propagated to multiple other components without creating direct dependencies, simply through events.

#### Creating an Event Listener (`@EventListener`)

You can easily create a listener to receive and handle events using the `@EventListener` annotation.

*   Annotate the method that will handle the event with `@EventListener`.
*   The method **must have exactly one parameter**, and the type of this parameter becomes the type of the event to subscribe to.
*   When the framework starts, it finds methods annotated with `@EventListener` in beans registered with `@Component` and automatically registers them as event listeners.

**Example: A listener that handles an order completion event**

```java
// 1. Define the event (POJO)
public class OrderCompletedEvent {
    private final String orderId;

    public OrderCompletedEvent(String orderId) {
        this.orderId = orderId;
    }

    public String getOrderId() {
        return orderId;
    }
}

// 2. Define the event listener bean
@Component
public class OrderEventListener {

    @EventListener
    public void handleOrderCompleted(OrderCompletedEvent event) {
        // This method is called when an OrderCompletedEvent is published.
        System.out.println("Order [" + event.getOrderId() + "] has been completed.");
        // ... Subsequent processing logic such as decreasing stock, sending notifications, etc. ...
    }

    @EventListener
    public void handleAnyObject(Object event) {
        // You can declare the type as Object to receive all types of events.
    }
}
```

#### Publishing an Event (`EventPublisher`)

Events are published through the `EventPublisher` interface. You just need to inject a bean of this type and call the `publish()` method.

*   Define an event publishing bean and inject it.
*   Call the `publish(Object event)` method to publish an event.
*   The `EventPublisher` checks the type of the published event object and propagates the event to all `@EventListener`s that subscribe to that event.

**Example: Publishing an order completion event from an order service**

```java
// Explicitly define the order event publishing bean
@Component
public class OrderEventPublisher extends InstantActivitySupport {

    // Publish order completed event
    public void publish(OrderCompletedEvent orderCompletedEvent) {
        getEventPublisher().publish(orderCompletedEvent);
    }

    // Publish order canceled event
    public void publish(OrderCanceledEvent orderCanceledEvent) {
        getEventPublisher().publish(orderCanceledEvent);
    }
}

@Component
public class OrderService {

    private final EventPublisher orderEventPublisher;

    @Autowired
    public OrderService(OrderEventPublisher orderEventPublisher) {
        this.orderEventPublisher = orderEventPublisher;
    }

    public void completeOrder(String orderId) {
        // ... Order completion processing logic ...
        System.out.println("Processing completion for order [" + orderId + "]");

        // Create and publish the event
        OrderCompletedEvent event = new OrderCompletedEvent(orderId);
        this.orderEventPublisher.publish(event);
    }

    public void cancelOrder(String orderId) {
        // ... Order cancellation processing logic ...
        System.out.println("Processing cancellation for order [" + orderId + "]");

        // Create and publish the event
        OrderCanceledEvent event = new OrderCanceledEvent(orderId);
        this.orderEventPublisher.publish(event);
    }
}
```

By using the event mechanism, the `OrderService` can focus on its core responsibility without needing to know what tasks should be performed after an order is completed. Other components interested in the event will continue the work through `@EventListener`, greatly improving the system's flexibility and extensibility.

### Asynchronous Method Execution (`@Async`)

Using the `@Async` annotation, you can execute long-running tasks asynchronously in a separate thread, allowing the current request processing thread to return immediately without being blocked. This feature is implemented through Aspectran's bean proxy.

#### Basic Usage of `@Async`

When you add the `@Async` annotation to a bean's method, that method will be called asynchronously in a separate thread. The return type must be `void` or an implementation of `java.util.concurrent.Future`.

```java
@Component
@Bean("myAsyncTaskService")
public class MyAsyncTaskService {

    @Async
    public void doSomething() {
        // This code runs in a separate thread.
    }

    @Async
    public Future<String> doSomethingAndReturn() {
        // Executes the task and returns the result via a Future object.
        return new CompletableFuture<>(() -> "Hello from async task!");
    }
}
```

#### Asynchronous Context and `ProxyActivity`

*   When an `@Async` method is called, if there is no `Activity` in the current thread, a new lightweight context for executing advice, a **`ProxyActivity`, is created**.
*   If multiple `@Advisable` methods are called in a chain within a single asynchronous task, **the initially created `ProxyActivity` instance is continuously shared within that thread**. This allows for maintaining a consistent context within the unit of work.
*   If `@Async` is called in a thread where an `Activity` already exists, the `ProxyActivity` is created by **wrapping** the existing `Activity`. In this case, it shares the original `Activity`'s data (`ActivityData`), enabling data exchange between the asynchronous task and the caller.

#### Caution when using `CompletableFuture`

If you use combinations of `CompletableFuture` that execute code in a new thread pool, such as `CompletableFuture.supplyAsync()` or `thenApplyAsync()`, within an `@Async` method, Aspectran's `Activity` context will not be propagated to that thread. In other words, calling `getCurrentActivity()` in the new thread created by `CompletableFuture` will result in a `NoActivityStateException`.

It is safer to handle all tasks synchronously within the thread created by `@Async` and wrap only the final result with `CompletableFuture.completedFuture()`.

```java
@Async
public Future<String> correctUsage() {
    // This block runs in the thread managed by @Async, so it can access the Activity context
    getCurrentActivity().getActivityData().put("key", "value");

    // Use CompletableFuture only for returning the result
    return CompletableFuture.completedFuture("some-result");
}

@Async
public Future<String> wrongUsage() {
    // Wrong usage example: Cannot access the Activity context inside supplyAsync
    return CompletableFuture.supplyAsync(() -> {
        // This block runs in a separate thread, so
        // calling getCurrentActivity() will cause a NoActivityStateException.
        getCurrentActivity().getActivityData().put("key", "value"); // Exception occurs!
        return "some-result";
    });
}
```

#### Using a Custom Executor

If you want to apply a separate thread pool policy instead of the default Executor, you can define a bean of type `AsyncTaskExecutor` yourself and specify the bean's ID or class in the `@Async` annotation.

```java
// Use an Executor registered with the ID "myCustomExecutor"
@Async("myCustomExecutor")
public void doSomethingWithCustomExecutor() {
    // ...
}
```

---

## 5. Bean Lifecycle Management

### Complete Lifecycle Sequence

A singleton bean is created and destroyed in the following order:

1.  **Instantiation**: Constructor call
2.  **Dependency Injection**: Inject dependencies into fields and setters annotated with `@Autowired`
3.  **Aware Interface Processing**: Call the `set*()` methods of `Aware` interfaces
4.  **Post-Initialization Callbacks**:
    -   Call methods annotated with `@Initialize`
    -   Call the `initialize()` method of the `InitializableBean` interface
5.  **(Bean is ready to use)**
6.  **Pre-Destruction Callbacks**:
    -   Call methods annotated with `@Destroy`
    -   Call the `destroy()` method of the `DisposableBean` interface

### Annotation-based Callbacks: `@Initialize` & `@Destroy`

-   `@Initialize`: Executes initialization logic after all dependencies have been injected.
-   `@Destroy`: Executes cleanup logic just before the bean is destroyed.

```java
@Component
public class LifecycleBean {
    @Initialize
    public void setup() { /* ... */ }

    @Destroy
    public void cleanup() { /* ... */ }
}
```

### Interface-based Callbacks: `InitializableBean` & `DisposableBean`

You can also achieve the same purpose by directly implementing the framework interfaces.

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

## 6. Configuration

### Enabling Annotation-based Configuration

To enable beans using annotations, you must specify the base packages to scan in the `context.scan` parameter of Aspectran's main configuration file (in APON format).

```apon
context: {
    scan: [
        com.example.myapp
    ]
}
```

### XML-based Configuration

XML provides high flexibility by allowing you to define the configuration and relationships of beans without changing the source code.

#### Basic Definition and Dependency Injection

Define a bean with the `<bean>` element and set dependencies using the `<argument>` (constructor injection) and `<property>` (setter injection) child elements.

```xml
<bean id="myService" class="com.example.myapp.service.MyService"/>

<bean id="myController" class="com.example.myapp.controller.MyController">
    <!-- Constructor argument injection -->
    <argument>#{myService}</argument>
    <!-- Setter property injection -->
    <property name="timeout" value="5000"/>
</bean>
```

#### Conditional Item Grouping with Profiles

If you need to activate or deactivate multiple `<argument>` or `<property>` elements together only in a specific profile, you can use the `<arguments>` or `<properties>` wrapper elements. By specifying the `profile` attribute on these wrapper elements, all contained `<item>` elements become dependent on that profile.

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
The recommended style is to use `<argument>`/`<property>` for defining individual items and `<arguments>`/`<properties>` only for grouping multiple items according to a profile.

#### Separating Configuration Files by Profile with `<append>`

While grouping properties is useful, a more powerful way to manage environment-specific beans in XML is to separate them into different files and include them conditionally using the `<append>` element. By adding the `profile` attribute to the `<append>` element, you can instruct Aspectran to load a specific configuration file only when the corresponding profile is active.

This is the idiomatic way to control which beans are registered in XML based on the environment.

**Example:**

Imagine you have separate bean definitions for development and production environments.

1.  **Create profile-specific XML files:**
    -   `conf/db/dev-beans.xml`: Contains beans for the development environment.
    -   `conf/db/prod-beans.xml`: Contains beans for the production environment.

2.  **Conditionally include them in your main configuration file:**
    ```xml
    <!-- Main Configuration -->
    <aspectran>
        ...
        <append resource="conf/common-beans.xml"/>
        <append resource="conf/db/dev-beans.xml" profile="dev"/>
        <append resource="conf/db/prod-beans.xml" profile="prod"/>
        ...
    </aspectran>
    ```
In this setup, if the `dev` profile is active, `dev-beans.xml` will be loaded. If the `prod` profile is active, `prod-beans.xml` will be loaded instead. This allows for a clean and complete separation of environment-specific bean definitions.

#### Component Scanning (`<bean scan="...">`)

You can also enable component scanning in XML using `<bean scan="...">`.

```xml
<!-- Scan the 'com.example.myapp' package and all its sub-packages -->
<bean scan="com.example.myapp.**"/>
```

#### Inner Beans and Nesting Limits

You can define an anonymous inner bean that will only be used as a property of another bean. Thanks to a flexible parsing architecture, there is no arbitrary limit on the nesting depth of inner beans, but it is recommended to keep the structure simple for readability.

```xml
<bean id="outerBean" class="com.example.OuterBean">
    <property name="inner">
        <!-- Inner bean without an ID (level 1) -->
        <bean class="com.example.InnerBean">
            <!-- ... -->
        </bean>
    </property>
</bean>
```

### Combining Annotations and XML Configuration

You can use annotation-based component scanning and explicit XML-based bean definitions together. It is common to use component scanning as the default and use XML to override specific beans or register external libraries. If a bean with the same ID is defined in both, the configuration that is loaded later may take precedence, and you can force an override with the `<bean important="true">` attribute.

---

## 7. Best Practices and Pitfalls

### Prefer Constructor Injection

-   **Immutability**: You can use `final` fields, ensuring that the bean's state does not change.
-   **Explicit Dependencies**: All dependencies required for an object to function are clearly exposed in the constructor.
-   **Circular Reference Prevention**: When using constructor injection, if a circular reference occurs where bean A and B need each other, an error will occur at application startup, allowing you to discover and resolve the problem immediately.

### Avoid Circular Dependencies

A circular dependency can be a sign of a design problem. It may mean that two classes have too many responsibilities, so consider refactoring to move responsibilities to a third class. In unavoidable cases, using setter injection can solve the circular reference problem.

### Understand the Lifecycle of `prototype` Beans

After the container creates and injects dependencies into a `prototype` scope bean, it no longer manages it. Therefore, destruction-related callbacks like `@Destroy` or `DisposableBean` are **not called.** If a `prototype` bean holds important resources like a database connection, you must manually call the logic to release those resources.

### Singleton Beans and State

Since a singleton bean has only one instance throughout the application, it can be accessed by multiple threads simultaneously. If a singleton bean has a mutable state (e.g., member variables), concurrency issues can arise. It is best to design singleton beans to be stateless. If state is absolutely necessary, use `ThreadLocal` or carefully implement synchronization.

### Always Use `@Component` as the Entry Point

Remember that annotations like `@Aspect`, `@Bean`, `@Schedule`, and `@Profile` are only activated on classes that are also marked with `@Component`. The framework's component scanner looks for `@Component` first and then processes other annotations on those classes. Using other configuration annotations without `@Component` will result in them being ignored, which can be a common source of configuration errors. The framework will log a warning if it detects such cases.
