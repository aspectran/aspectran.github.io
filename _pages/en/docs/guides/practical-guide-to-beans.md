---
format: plate solid article
sidebar: toc
title: "Aspectran Beans: A Practical Guide to IoC/DI"
subheadline: Practical Guides
parent_path: /docs
---

Aspectran Beans is a powerful Inversion of Control (IoC) container built into the core of the Aspectran framework.
Inspired by the robust concepts of Spring Beans (IoC, DI, etc.), it has been redesigned from the ground up to align with Aspectran's core philosophy of being **POJO-based, simple, and fast in development and startup speed**.

---

## 1. Core Concepts: IoC and DI

The core of Aspectran Beans is to help you write cleaner, more modular, and easier-to-test code by managing your application's objects (called "beans").

-   **IoC (Inversion of Control)**: Instead of you creating and managing the lifecycle of your objects, the Aspectran container does it for you. You just define the objects, and the framework instantiates, configures, and assembles them at the appropriate time. This "inversion" of control allows you to focus solely on your business logic.

-   **DI (Dependency Injection)**: This is the primary mechanism for implementing IoC. Instead of an object creating its own dependencies (`new MyService()`), it receives them from an external source (the IoC container). This reduces the coupling between components, making them easier to manage, test, and reuse.

---

## 2. Defining Beans

You can declare a class as a bean using simple annotations.

### Automatic Detection with `@Component`

The easiest way to register a bean is to add the `@Component` annotation, which indicates that it is a component class.
At application startup, Aspectran's classpath scanner will automatically detect it and register it as a bean.

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

The `@Bean` annotation is used to explicitly declare a bean and can specify additional attributes. It can be applied to a class or method along with the `@Component` annotation.

#### On a Class
You can explicitly declare a bean using `@Bean` on a class.

```java
package com.example.myapp.service;

import com.aspectran.core.component.bean.annotation.Bean;

@Component
@Bean(id = "anotherService")
public class AnotherService {
    // ...
}
```

#### On a Method (Factory Method Pattern)
This is a powerful technique that is useful when complex initialization logic is needed or when you need to register an object from a third-party library.
Define a method that returns an object within a class that contains components (`@Component`), and annotate that method with `@Bean`.

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
        // Perform complex initialization if necessary
        return new MyService();
    }

    @Bean
    public SomeLibraryClient someLibraryClient() {
        // Configure and return a client from an external library
        return new SomeLibraryClient("api.example.com", "your-api-key");
    }
}
```

---

## 3. Dependency Injection

Once beans are defined, you can inject them into each other using the `@Autowired` annotation.

### Constructor Injection (Recommended)

This is the most recommended approach. It ensures that dependencies are provided when the bean is created, guaranteeing that the object is always in a valid state. It also makes dependencies explicit and prevents circular dependency issues at runtime.

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

### Field and Setter Injection

While constructor injection is most recommended, setter injection can also be used for optional dependencies.

-   **Setter Injection**: Useful for optional dependencies, but has the disadvantage that the object can exist in an incomplete state until the dependency is injected.
-   **Field Injection**: Aspectran only supports dependency injection for `public` fields. It does not support injecting dependencies directly into `private` fields and is not recommended due to difficulties in testing and dependency hiding issues. Constructor injection should always be considered first.

```java
// Setter injection example (used for optional dependencies)
@Component
public class MyController {
    private MyService myService;

    @Autowired
    public void setMyService(MyService myService) {
        this.myService = myService;
    }
}
```

### Resolving Ambiguity with `@Qualifier`

When injecting a dependency, an ambiguity problem arises if multiple beans of the same type are found. This is because Aspectran does not know which bean to choose. This problem can be solved by giving each bean a unique ID with `@Bean` and specifying the specific bean to inject with `@Qualifier`.

**Step 1: Assign a Unique ID with `@Bean`**

First, add the `@Bean` annotation to each implementation class to assign a unique ID.

**Step 2: Specify a Specific Bean with `@Qualifier`**

Next, use the `@Qualifier` annotation where the dependency is injected to specify the ID of the bean to be injected.

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

    // Inject the bean qualified with "email"
    @Autowired
    public OrderService(@Qualifier("email") NotificationService notificationService) {
        this.notificationService = notificationService;
    }
}
```

### Injecting Configuration Values with `@Value`

You can use the `@Value` annotation to inject the evaluated result of an AsEL expression into a bean.
Constructor injection is generally recommended to ensure dependency clarity and immutability.
Field injection is only possible for `public` fields; direct injection into `private` fields is not supported.
You can also inject values through a `public` setter method.

```java
@Component
public class AppInfo {

    private final String appVersion;
    private final String appName;

    // Inject an external configuration value into a public field using an AsEL expression
    @Value("%{app^description}")
    public String description;

    private boolean startup;

    // Inject external configuration values via the constructor with @Value
    @Autowired
    public AppInfo(
            @Value("%{app^version}") String appVersion,
            @Value("%{app^name:DefaultAppName}") String appName) {
        this.appVersion = appVersion;
        this.appName = appName;
    }

    // Dependency injection via a setter method
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

## 4. Understanding Bean Scopes

Bean scopes control the lifecycle of a bean instance. You can set the scope of a bean with the `@Scope` annotation.
The `@Scope` annotation must be used in conjunction with the `@Bean` annotation.

-   `singleton` (default): Only one instance is created for the entire application container.
-   `prototype`: A new instance is created each time the bean is requested.
-   `request`: A single instance is maintained within the scope of each `Activity` execution (request). The current `Activity` must support a `RequestAdapter`.
-   `session`: A new instance is created for each `Session` instance. The current `Activity` must support a `SessionAdapter`.

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

## 5. Bean Lifecycle Management

You can execute custom logic at specific points in a bean's lifecycle, such as after initialization or before destruction.

### Annotation-based Callbacks: `@Initialize` & `@Destroy`

-   `@Initialize`: Called after all dependencies have been injected.
-   `@Destroy`: Called just before the bean is removed from the container.

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

### Interface-based Callbacks: `InitializableBean` & `DisposableBean`

Alternatively, you can implement framework interfaces for the same purpose.

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

## 6. Advanced Features

### Creating Complex Beans with `FactoryBean`

For very complex object creation logic, you can implement the `FactoryBean` interface.
This is useful for encapsulating a complex creation process or for creating proxies.
The instance of the bean returned by the `getObject()` method is exposed to the application, not the factory itself.

```java
import com.aspectran.core.component.bean.ablility.FactoryBean;
import com.aspectran.core.component.bean.annotation.Component;

// Assume MyProduct is a complex class to instantiate
public class MyProduct {
    // ...
}

@Component
@Bean("myProduct") // The name of the bean will be "myProduct"
public class MyProductFactory implements FactoryBean<MyProduct> {

    @Override
    public MyProduct getObject() throws Exception {
        // Encapsulate complex creation and configuration logic here
        MyProduct product = new MyProduct();
        // ... set properties
        return product;
    }
}
```

### Accessing the Framework with `Aware` Interfaces

If a bean needs to access Aspectran's internal framework objects, it can implement an `Aware` interface.
For example, `ActivityContextAware` provides access to the current `ActivityContext`.

```java
import com.aspectran.core.component.bean.annotation.Bean;
import com.aspectran.core.component.bean.annotation.Component;
import com.aspectran.core.component.bean.aware.ActivityContextAware;
import com.aspectran.core.context.ActivityContext;

@Component
@Bean
public class MyAwareBean implements ActivityContextAware {

    private ActivityContext context;

    // Dependency injection via a setter method
    @Override
    public void setActivityContext(ActivityContext context) {
        this.context = context; // The container injects the ActivityContext here
    }

    public void printCurrentTransletName() {
        if (this.context != null) {
            System.out.println("Executing in translet: " + context.getTransletName());
        }
    }
}
```

---

## 7. Bean-related Configuration

To enable all these features, you need to tell Aspectran where to find the beans.

### Enabling Component Scanning

By default, you need to add the path of the package to be scanned to the `context.scan` parameter in the Aspectran main configuration file (`aspectran-config.apon`).
When Aspectran starts, it automatically scans for classes annotated with `@Component` and `@Bean` and registers them as beans.
It is recommended to add the path of the application's base package first.

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

### XML-based Bean Definition

Although annotations are preferred for their simplicity, you can also define beans directly in XML.
This can be useful for overriding or configuring beans without modifying the source code.

```xml
<aspectran>
    ...
    <bean id="myService" class="com.example.myapp.service.MyService"/>

    <bean id="myController" class="com.example.myapp.controller.MyController">
        <argument>#{myService}</argument>
    </bean>
    ...
</aspectran>
```

### XML-based Component Scanning (Batch Bean Definition)

In an XML-based Aspectran configuration file (e.g., `root-config.xml`), you can batch-register all classes corresponding to a specific class pattern as beans by specifying the `scan` attribute of the `<bean>` element. This is a convenient way to define a large number of beans through XML configuration, separate from automatic detection (component scanning) via the `@Component` annotation.

You can specify classes more flexibly by using wildcard patterns in the `scan` attribute. This works similarly to Ant path patterns.

-   `*`: Matches zero or more characters in a single package path level.
-   `**`: Matches multiple package path levels.

```xml
<aspectran>
    ...
    <!-- Find and batch-register all classes in the 'com.example.myapp' package and its sub-packages as beans -->
    <bean scan="com.example.myapp.**"/>

    <!-- Find and batch-register all classes with names ending in 'Bean' in the 'com.example.myapp' package and its sub-packages as beans -->
    <bean scan="com.example.myapp.**.*Bean"/>
    ...
</aspectran>
```

#### Bean ID Naming Convention and the `mask` Attribute

You can also include a wildcard pattern in the `id` attribute of the `<bean>` element itself to dynamically generate bean IDs based on the scanned classes.

When beans are automatically detected through scanning, the bean ID is by default generated by converting the simple name of the class to lower camel case.
-   `MyService` class → `myService` ID
-   `OrderController` class → `orderController` ID

You can override this default ID generation rule by using the `mask` attribute, which allows you to extract only a specific part of the class's fully qualified class name to be used as the bean's ID.
The part of the class name that corresponds to the wildcard (`*`) in the `mask` pattern becomes the ID.

For example, let's assume the class `com.example.myapp.services.member.MemberService` was scanned.

```xml
<!-- Use mask to use 'member.MemberService' as the ID -->
<bean scan="com.example.myapp.services.**" mask="com.example.myapp.services.*"/>
```
In the configuration above, the `*` part of the `mask` pattern corresponds to `member.MemberService`, so the final bean ID will be `member.MemberService`.

If an ID is explicitly specified in an annotation (`@Bean("customId")`), it takes precedence over the `mask` setting.
