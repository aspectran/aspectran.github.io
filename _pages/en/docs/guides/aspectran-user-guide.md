---
title: Aspectran User Guide
teaser: This is a guide document for developers who are new to Aspectran.
subheadline: Core Guides
---

{% capture info_message %}
Aspectran is a lightweight, high-performance JVM-based framework designed to efficiently build various types of applications, from simple command-line tools to complex enterprise web services. This guide is designed to help developers new to Aspectran systematically understand the framework's core philosophy and architecture, and properly leverage its key components to build applications.
{% endcapture %}
{% include alert.liquid info=info_message %}

## 1. Introduction to Aspectran

### 1.1. What is Aspectran?

Aspectran is a lightweight, high-performance Java framework capable of developing various applications, from simple command-line tools to complex enterprise web services. It offers a consistent programming environment across different platforms like Web, Shell, and Daemon, enabling developers to easily build flexible and reusable components.

### 1.2. Core Philosophy and Advantages

*   **POJO-Centric Programming**: You can implement business logic using plain old Java objects (POJOs) without implementing special interfaces or inheriting from specific framework classes. This reduces the learning curve for developers and allows them to focus on solving business problems with pure Java code.
*   **Lightweight and High-Performance**: Provides fast startup times and low memory footprint with minimal dependencies and optimized resource usage.
*   **Inversion of Control (IoC) and Dependency Injection (DI)**: The framework takes responsibility for object creation, configuration, and lifecycle management, and automatically injects necessary dependencies to minimize coupling between components and help write flexible and reusable code.
*   **Aspect-Oriented Programming (AOP)**: Modularizes cross-cutting concerns that appear repeatedly throughout the application, such as logging, transactions, and security, and separates them from the core business logic.
*   **Adapter Pattern for Environmental Abstraction**: Provides the flexibility for the same business logic to run without modification in any environment (web, shell, daemon, etc.).

## 2. Getting Started with Aspectran

Aspectran is designed to be easy to start with. You can quickly create a "Hello, World" application to understand the basic structure and workflow of an Aspectran project.

1.  **Project Setup**: Create a Maven project and add the `aspectran-core` dependency.
2.  **Configuration**: Create an `aspectran-config.apon` file to define the base package for component scanning.
3.  **Code**: Write a simple POJO class annotated with `@Component` and `@Request` to handle commands.
4.  **Run**: Build the project and run it as a standalone application.

For a step-by-step tutorial on building your first Aspectran application, please refer to the [Getting Started with Aspectran](/en/docs/guides/aspectran-getting-started/) document.

## 3. Aspectran Core Concepts

To use the Aspectran framework effectively, it is important to understand a few core concepts.

### 3.1. Translet

In Aspectran, the core concepts of request processing are `Activity`, `Translet`, and `Action`. It is important to understand their relationship.

*   **Activity**: The **execution engine** that actually processes the request and generates the final response.
*   **Translet**: A **blueprint or set of rules** that is mapped to a specific request and defines "how to process it."
*   **Action**: An **individual unit of work** executed by the `Activity` that performs the actual business logic.

The name Translet might suggest it is the main entity that processes requests, but this is a misunderstanding from a user's perspective where direct access to the `Activity` is restricted. The actual entity responsible for all processing is the `Activity`.

#### 3.1.1. Role and Importance of Translet

The core role of a Translet is to be a **blueprint that defines the request processing flow**.

*   **Set of Request Processing Rules**: It is mapped to a specific request (e.g., a URL in a web environment, a command in a shell environment) and declaratively defines the entire processing flow, including request parameter handling, actions to be executed, response generation methods, and exception handling.
*   **Programming Interface**: It acts as a channel for data sharing and control between the `Activity` and user code.
*   **Flexible Processing Flow**: By combining various processing rules such as request handling, action execution, content generation, transformation, response, and forwarding, you can flexibly design everything from simple tasks to complex workflows.

#### 3.1.2. How to Define a Translet

Aspectran provides two main ways to define a Translet:

1.  **Declarative Rule-Based (XML/APON)**:
    This is the traditional method where the processing flow of a Translet is declaratively defined using configuration files in XML or APON (Aspectran Parameters Object Notation) format. It completely separates business logic from processing flow, enhancing configuration visibility.

    ```xml
    <translet name="/user/info">
        <action bean="userDao" method="getUserInfo"/>
        <transform format="json"/>
    </translet>
    ```
    The example above defines a Translet that, upon receiving a `/user/info` request, executes the `getUserInfo` method of the `userDao` bean and responds with the result transformed into JSON format.

2.  **Annotation-Based (Java Code)**:
    This is a modern method of defining a Translet directly in Java code using annotations, providing developers with high convenience and intuitive productivity.

    *   **Activity Classes and Action Methods**:
        In Aspectran, it is a standard convention to suffix classes that handle web requests with **`*Activity`** (e.g., `UserActivity`, `ReportActivity`, `OrderActivity`). Within an Activity class, multiple Action methods can be defined for different business operations, and these methods are registered as Actions to be invoked by the Translet.
        Methods annotated with request mapping annotations such as `@RequestToGet` and `@RequestToPost` operate internally as core Actions executed via `InvokeAction` (`AnnotatedAction`).

    *   **The `@Action` Annotation and Model Resolution**:
        You can assign an explicit unique identifier to an Action by declaring the **`@Action("actionId")`** annotation on the action method.
        The return value produced by the action method is seamlessly utilized in view templates and response transformers as follows:
        *   **View Template Model Integration**: When rendering a view via `Dispatch`, the Action ID can be referenced directly as a model attribute in view templates (Thymeleaf, FreeMarker, JSP, etc.). Aspectran internally provides **`ActivityData`** as a unified view model facade that consolidates action results, request parameters, and attributes, allowing templates to easily render data without concerning themselves with underlying storage structures.
        *   **Data Transformation Response (`@Transform`)**: When using transformers such as `@Transform(format = FormatType.JSON)`, the transformer treats the Action ID as the root key or node name, producing structured and intuitive output.
        *   **Java Code Access**: When programmatic access to an action's execution result is needed in Java code, it can be retrieved via `translet.getProcessResult("actionId")` or `translet.getActivityData().get("actionId")`.

        ```java
        @Component
        public class UserActivity {

            private final UserDao userDao;

            @Autowired
            public UserActivity(UserDao userDao) {
                this.userDao = userDao;
            }

            // Map GET /user/info/${userId} request
            // Assign Action ID "userInfo" -> mapped as the root key during JSON transform
            @RequestToGet("/user/info/${userId}")
            @Action("userInfo")
            @Transform(format = FormatType.JSON)
            public User getUserInfo(Long userId) {
                return userDao.getUserById(userId);
            }

            // Map GET /user/profile/${userId} request
            // Action ID "userProfile" is immediately accessible in view templates (Thymeleaf, FreeMarker, JSP)
            @RequestToGet("/user/profile/${userId}")
            @Action("userProfile")
            @Dispatch("user/profile")
            public User getUserProfile(Long userId) {
                return userDao.getUserById(userId);
            }

        }
        ```

    *   **Path Variables and Parameter Mapping**:
        Aspectran natively supports **AsEL token syntax** in URI path patterns, allowing you to declaratively designate where parsed path variables should be stored:
        *   **`${variableName}` (Parameter Token)**:
            Example: `@RequestToGet("/user/info/${userId}")`
            The parsed `userId` value from the URL path is automatically added to the **request parameters (`ParameterMap`)**. As a result, it is automatically bound to method parameters (e.g., `Long userId`) and can also be retrieved directly via `translet.getParameter("userId")`. This is the most commonly used approach.
        *   **`@{variableName}` (Attribute Token)**:
            Example: `@RequestToGet("/user/info/@{userId}")`
            The parsed `userId` value from the URL path is automatically added to the **request attributes (`AttributeMap`)**. Without writing any storage code, it can be retrieved via `translet.getAttribute("userId")` or directly passed as a model attribute to view templates like JSP or Thymeleaf for immediate rendering.
        *   **Standard Request Parameters and DTO Binding**: HTTP query string or form parameters are automatically converted and injected into method arguments matching parameter names. When declaring a composite DTO/Command POJO, properties are automatically populated via their setter methods (model binding). Declaring a `Translet` type in method parameters also automatically injects the current executing `Translet` instance.
        *   **Mandatory Parameter Validation (`@NonNull`)**: You can annotate parameters with standard JSpecify `@NonNull` (`org.jspecify.annotations.NonNull`) to enforce safe validation against missing mandatory parameters.

    *   **Asynchronous Request Handling**: If you need to handle a long-running task, you can execute the Translet asynchronously by setting `async = true`. This prevents blocking request threads and performs processing in the background, keeping the application responsive.

        ```java
        @Component
        public class ReportActivity {

            private final ReportService reportService;

            @Autowired
            public ReportActivity(ReportService reportService) {
                this.reportService = reportService;
            }

            @RequestToPost(translet = "/reports/generate", async = true, timeout = 30000L)
            @Action("generationResult")
            @Transform(format = FormatType.TEXT)
            public String generateReport(Translet translet) {
                Parameters parameters = translet.getRequestAdapter().getBodyAsParameters();
                reportService.generate(parameters);
                return "Report generation has started in the background.";
            }

        }
        ```

    *   **Annotation Details**: The `@Request` annotation is used to define detailed rules such as request paths and HTTP methods. For convenience, dedicated annotations corresponding to each HTTP method are provided: `@RequestToGet`, `@RequestToPost`, `@RequestToPut`, `@RequestToDelete`, and `@RequestToPatch`. These annotations share common attributes such as `value` or `translet` (path), `async`, and `timeout`.

#### 3.1.3. Request Path Mapping and Search Priority

Once Translet rules are registered via XML or Java annotations, Aspectran resolves and executes the best-matching Translet when a client request (URL path and HTTP method) arrives. Aspectran accurately routes requests using a proprietary **wildcard pattern matching engine**—which rigorously extends Ant-style matching—along with a **weight-based priority system**.

##### 1. Wildcards and Path Variable Tokens
*   `*`: Matches zero or more characters within a single segment (between path delimiters `/`). Does not cross delimiter boundaries.
*   `**`: Matches zero or more characters across multiple segments (including delimiters `/`).
*   `?`: Matches zero or one character within a segment.
*   `+`: Matches **exactly one** character within a segment (empty strings not allowed).
*   `${variableName}`: Extracts the path segment at that position and stores it in the **request parameters (`ParameterMap`)**. It can be bound to method arguments or retrieved via `translet.getParameter()`.
*   `@{variableName}`: Extracts the path segment at that position and stores it in the **request attributes (`AttributeMap`)**. It can be supplied directly to view template models or retrieved via `translet.getAttribute()`.

##### 2. Flexible Structural Matching
*   **Leading `**/` Can Be Omitted**: `**/user` matches `/user` as well as the root-level `user`.
*   **Trailing `/**` Can Be Omitted**: `/api/**` matches not only `/api/` subpaths, but also `/api` itself.
*   **Intermediate `/**/` Can Be Omitted**: `a/**/b` matches `a/x/b` as well as direct `a/b`.

##### 3. Translet Resolution Priority
When an `Activity` receives a request, the `TransletRuleRegistry` resolves the matching Translet using the following priority order:
1.  **Exact Match Takes Top Precedence**: Rules without wildcards or path variables are selected first.
2.  **More Specific Patterns Take Precedence**: Patterns that are more concrete and less abstract receive higher priority through the weighting system (e.g., `/users/${id}/profile` takes precedence over `/users/${id}/*`).
3.  **Fallback to Translets Without Specified HTTP Methods**: If no dedicated HTTP method rule matches, an unconstrained fallback Translet rule matching the path is selected.
4.  **Later Defined Rules Take Precedence (Override)**: When multiple rules share identical names and methods, rules loaded later override existing ones.

#### 3.1.4. Internal Components of Translet and Action Pipeline

A Translet is not merely a request-mapping object, but a **workflow pipeline blueprint** that executes multiple tasks sequentially and conditionally from request ingestion to response delivery.

##### 1. Four Standard Action Types
Work units executed within a Translet are categorized into four standard Action types:

*   **Invoke Action (`<invoke>`)**:
    Invokes a specific business method of a Bean registered in the IoC container. In Java annotation-based configurations, action methods inside Activity classes combine with `@RequestTo*` to operate internally as `InvokeAction` (`AnnotatedAction`), and can be assigned unique IDs via `@Action("actionId")`. The action result is saved in `ProcessResult` using the Action ID as its key, seamlessly integrating with view template models.
    ```xml
    <action id="order" bean="orderService" method="createOrder"/>
    ```

*   **Echo Action (`<echo>`)**:
    Echoes request parameters or specific attributes into the response model or passes them to the view.
    ```xml
    <echo id="echoInfo">
        <item name="orderId"/>
        <item name="customerName"/>
    </echo>
    ```

*   **Header Action (`<headers>`)**:
    Declaratively sets HTTP response headers (cache control, custom security headers, etc.) sent to clients in batch.
    ```xml
    <headers>
        <item name="Cache-Control">no-cache, no-store, must-revalidate</item>
        <item name="Pragma">no-cache</item>
    </headers>
    ```

*   **Include Action (`<include>`)**:
    Invokes another Translet like a subroutine and includes its result within the current Translet's pipeline. Very useful for modularizing reusable data queries or common widgets.
    ```xml
    <include id="userProfile" translet="/user/profile-widget"/>
    ```

##### 2. Content Blocks (`<contents>`) and Result Management (`ProcessResult` & `ActivityData`)
When multiple Actions are defined within a Translet, the execution results of each Action are systematically stored in the **`ProcessResult`** container under their respective Action IDs.
Aspectran provides **`ActivityData`** as a unified facade that brings together action results, request parameters, and attributes, allowing view templates (Thymeleaf, FreeMarker, JSP, etc.) and Java code to access data naturally by Action ID without worrying about internal storage locations:
*   **View Template Integration**: When rendering via `Dispatch`, data can be output directly in templates by referencing Action IDs.
*   **Java Code & AsEL Queries**: Results can be retrieved effortlessly in Java code via `translet.getProcessResult("actionId")` or `translet.getActivityData().get("actionId")`.
*   **Full Result Tree Traversal**: In complex multi-step pipelines, developers can inspect and control the entire structured hierarchy of content blocks (`ContentResult`) via `translet.getProcessResult()`.

##### 3. Conditional Branch Execution (`<choose>`, `<when>`, `<otherwise>`)
Aspectran provides declarative conditional control tags to selectively execute Actions or Responses based on request parameters, headers, and properties, without writing nested `if-else` branching in Java code:

```xml
<translet name="/dashboard">
    <choose>
        <when test="${role == 'admin'}">
            <action id="dashboardData" bean="adminService" method="getAdminDashboard"/>
            <dispatch name="dashboard/admin"/>
        </when>
        <otherwise>
            <action id="dashboardData" bean="userService" method="getUserDashboard"/>
            <dispatch name="dashboard/user"/>
        </otherwise>
    </choose>
</translet>
```

#### 3.1.5. Declarative Exception Handling in Translets (`<exception>` / `<thrown>`)

When an exception occurs during business logic (Action) execution or view rendering within a Translet, it can be declaratively intercepted to dispatch to dedicated error views or return transformed responses (JSON/XML):

```xml
<translet name="/order/checkout">
    <action bean="orderService" method="checkout"/>
    <dispatch name="order/complete"/>
    <exception>
        <thrown type="com.example.OutOfStockException">
            <transform format="json">
                <template>{"status": "fail", "message": "Product is out of stock."}</template>
            </transform>
        </thrown>
        <thrown type="java.lang.Exception">
            <dispatch name="error/general"/>
        </thrown>
    </exception>
</translet>
```
Specifying a target exception class type in the `thrown` tag matches matching subclasses as well, with the most specific matching exception handler being prioritized.

#### 3.1.6. Translet Lifecycle and Relationship with Activity

When a request arrives, the `Activity` resolves the best matching Translet rule (blueprint) from the **`TransletRuleRegistry`**, creates an instance, and processes the request according to those rules. In short, the Translet is the 'blueprint' and the `Activity` is the 'execution engine' that works against that blueprint. The `TransletRuleRegistry` is a highly optimized data structure designed for fast lookups, utilizing request paths, HTTP methods, wildcards, and path variable patterns.

The `Activity` parses incoming request data according to the rules defined in the Translet and sequentially executes the Actions carrying the business logic. Methods annotated with annotations like `@RequestToGet` are called Action methods; in addition to Invoke Actions that call bean methods, various Action types such as Echo Actions, Header Actions, and Include Actions are supported.

During this process, the generated `Translet` instance acts as a **'communication medium'** between the `Activity` and user code (primarily Action methods). When a `Translet` type parameter is declared in an Action method, the `Activity` automatically injects the `Translet` instance upon invocation. Developers can leverage this `Translet` instance to access activity data (`getActivityData()` method), apply further transformations, and programmatically manipulate response logic.

As such, the Translet serves as a well-designed **Facade** that encapsulates complex internal processing (`Activity`) while exposing a clear, intuitive blueprint and interface to developers.

For detailed practical examples and in-depth discussions, refer to the [Understanding Translet: The Face of Aspectran](/en/docs/guides/aspectran-translet/) and [Practical Guide to Translets](/en/docs/guides/practical-guide-to-translets/) guides.

### 3.2. Bean

A Bean is a Java object managed by Aspectran's IoC (Inversion of Control) container. All components of an application, such as services, data access objects (DAOs), and utilities, are registered as Beans, their lifecycle is managed by the framework, and they are provided where needed through dependency injection (DI).

#### 3.2.1. Understanding IoC and DI

*   **IoC (Inversion of Control)**: Instead of the developer manually managing the creation, configuration, and lifecycle of objects, the Aspectran container takes over this responsibility. The developer only needs to define the objects, and the framework will instantiate them at the appropriate time and connect the necessary dependencies. This allows the developer to focus solely on the business logic.
*   **DI (Dependency Injection)**: This is the core mechanism for implementing IoC. It is a style where an object receives its dependencies (other objects it needs) from an external source (the IoC container) rather than creating or finding them itself. This lowers the coupling between components, greatly improving code reusability, testability, and maintainability.

#### 3.2.2. How to Define a Bean

The most common way to define a Bean in Aspectran is by using annotations.

*   **Automatic Detection with `@Component`**: Adding the `@Component` annotation to a class is the easiest and most recommended method. Aspectran's classpath scanner will automatically detect it at application startup and register it as a Bean.

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

*   **Explicit Definition with `@Bean`**: The `@Bean` annotation is useful for giving a Bean a specific ID, when complex initialization logic is needed, or when registering a third-party library object as a Bean. It can be used on a method that returns an object within a `@Component` class.

    ```java
    @Component
    public class AppConfig {
        @Bean("myCustomClient") // Specifies the Bean's ID as myCustomClient
        public SomeLibraryClient someLibraryClient() {
            // Complex initialization logic or creation of an external library object
            return new SomeLibraryClient("api.example.com", "your-api-key");
        }
    }
    ```

#### 3.2.3. Dependency Injection (`@Autowired`)

You can use the `@Autowired` annotation to automatically inject other Beans managed by the Aspectran container into the current Bean.

*   **Constructor Injection (Recommended)**: It makes dependencies `final`, ensuring they are immutable, and guarantees that all required dependencies are injected when the object is created. This is the best way to increase code stability and testability.

    ```java
    @Component
    public class MyActivity {
        private final MyService myService;

        @Autowired
        public MyActivity(MyService myService) {
            this.myService = myService;
        }
    }
    ```

*   **Field and Setter Injection**: Useful for injecting optional dependencies, but constructor injection should be considered first. Field injection is only possible for `public` fields and is generally not recommended.

*   **Resolving Ambiguity with `@Qualifier`**: When there are multiple Beans of the same type, you can use `@Qualifier("beanId")` to specify the ID of the specific Bean to inject.

    ```java
    public interface NotificationService { /* ... */ }

    @Component
    @Bean("email")
    public class EmailNotificationService implements NotificationService { /* ... */ }

    @Component
    @Bean("sms")
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

*   **Injecting Configuration Values with `@Value`**: You can use the `@Value` annotation to inject the evaluation result of an AsEL expression (usually an external configuration value) into a Bean's field or constructor parameter.

    ```java
    @Component
    public class AppInfo {
        private final String appVersion;

        @Autowired
        public AppInfo(@Value("%{app.version:1.0.0}") String appVersion) {
            this.appVersion = appVersion;
        }
    }
    ```

*   **Collection Injection (`List<T>`, `Map<String, T>`)**: You can inject all Beans that implement the same interface at once into a `List` or `Map`. This is very useful for implementing patterns like the Strategy Pattern.

    ```java
    @Component
    public class NotificationManager {
        private final List<NotificationService> services;

        @Autowired
        public NotificationManager(List<NotificationService> services) {
            this.services = services;
        }

        public void sendToAll(String message) {
            for (NotificationService service : services) {
                service.send(message);
            }
        }
    }
    ```

*   **Optional Dependency Injection (`Optional<T>`)**: When you need to inject a Bean that may not exist, such as one that is only active in a specific profile, you can use `java.util.Optional<T>`.

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

#### 3.2.4. Bean Scopes

Bean scopes control the lifecycle and visibility of a Bean instance. They can be set with the `@Scope` annotation.

| Scope         | Description                     | Lifecycle                | Primary Use Case          |
| :------------ | :------------------------------ | :----------------------- | :------------------------ |
| **`singleton`** | Single instance in the container| Entire application       | Stateless services, DAOs  |
| **`prototype`** | New instance per request        | Managed by GC            | Stateful objects, Builders|
| **`request`**   | New instance per request        | Single `Activity` execution| Web request data handling |
| **`session`**   | New instance per session        | Single user session      | User-specific data management|

*   **`singleton` (default)**: Only one instance is created within the IoC container and shared throughout the application. Suitable for most service Beans.
*   **`prototype`**: A new instance is created each time the Bean is injected or requested. The container does not manage the lifecycle after creation, so if a `prototype` Bean holds resources, the developer must release them manually.
*   **`request`**: In a web environment, a new instance is created for each HTTP request and destroyed when the request is completed. Useful for holding request-related data.
*   **`session`**: In a web environment, a new instance is created for each user session and destroyed when the session ends. Used for managing user-specific data.

#### 3.2.5. Bean Lifecycle Callbacks

Aspectran provides lifecycle callbacks to execute specific logic at the time of a Bean's creation and destruction. The `@Initialize` and `@Destroy` annotations are mainly used for this.

*   **`@Initialize`**: Executed after all dependencies have been injected, when the Bean is initialized. Used for initialization tasks (e.g., setting up a database connection).
*   **`@Destroy`**: Executed just before the Bean is destroyed, for cleanup tasks (e.g., releasing resources).

    ```java
    @Component
    public class LifecycleBean {
        @Initialize
        public void setup() {
            System.out.println("LifecycleBean initialized");
        }

        @Destroy
        public void cleanup() {
            System.out.println("LifecycleBean destroyed");
        }
    }
    ```

*   **Interface-based Callbacks**: You can also achieve the same purpose by implementing the `InitializableBean` and `DisposableBean` interfaces.

    ```java
    @Component
    public class InterfaceBasedLifecycleBean implements InitializableBean, DisposableBean {
        @Override
        public void initialize() throws Exception {
            System.out.println("InterfaceBasedLifecycleBean initialized");
        }

        @Override
        public void destroy() throws Exception {
            System.out.println("InterfaceBasedLifecycleBean destroyed");
        }
    }
    ```

#### 3.2.6. Advanced Features

*   **Creating Complex Beans with `FactoryBean`**: Implement the `FactoryBean` interface when the creation logic is very complex or requires encapsulation. The object returned by the `getObject()` method is registered as the actual Bean.

    ```java
    @Component
    @Bean("myProduct")
    public class MyProductFactory implements FactoryBean<MyProduct> {
        @Override
        public MyProduct getObject() throws Exception {
            // Complex creation and configuration logic
            return new MyProduct();
        }
        @Override
        public Class<?> getObjectType() {
            return MyProduct.class;
        }
    }
    ```

*   **Accessing the Framework with `Aware` Interfaces**: By implementing `Aware` interfaces like `ActivityContextAware`, a Bean can access Aspectran's internal objects (e.g., `ActivityContext`, `BeanRegistry`). This is useful when you need to interact with specific parts of the framework.

    ```java
    @Component
    public class MyAwareBean implements ActivityContextAware {
        private ActivityContext context;

        @Override
        public void setActivityContext(ActivityContext context) {
            this.context = context;
        }

        public void doSomethingWithContext() {
            if (context != null) {
                System.out.println("Accessed ActivityContext: " + context.getName());
            }
        }
    }
    ```

*   **Event Handling (Publish-Subscribe)**: Aspectran provides a publish-subscribe event handling mechanism for loose coupling between components (Beans) within the application. This allows you to easily implement scenarios where the result of a specific logic needs to be propagated to multiple other components without creating direct dependencies.

    *   **Creating an Event Listener (`@EventListener`)**: You can easily create a listener to receive and handle events using the `@EventListener` annotation. The method must have exactly one parameter, and the type of this parameter becomes the type of the event to subscribe to.

        ```java
        // 1. Define the event (POJO)
        public class OrderCompletedEvent {
            private final String orderId;
            public OrderCompletedEvent(String orderId) { this.orderId = orderId; }
            public String getOrderId() { return orderId; }
        }

        // 2. Define the event listener bean
        @Component
        public class OrderEventListener {
            @EventListener
            public void handleOrderCompleted(OrderCompletedEvent event) {
                System.out.println("Received order completed event: " + event.getOrderId());
            }
        }
        ```

    *   **Publishing an Event (`EventPublisher`)**: You publish an event through the `EventPublisher` interface. You just need to inject a Bean of this type and call the `publish()` method.

        ```java
        @Component
        public class OrderService {
            private final EventPublisher eventPublisher;

            @Autowired
            public OrderService(EventPublisher eventPublisher) {
                this.eventPublisher = eventPublisher;
            }

            public void completeOrder(String orderId) {
                System.out.println("Order processing complete: " + orderId);
                eventPublisher.publish(new OrderCompletedEvent(orderId)); // Publish event
            }
        }
        ```

*   **Asynchronous Method Execution (`@Async`)**: Using the `@Async` annotation, you can execute long-running tasks asynchronously in a separate thread, allowing the current request processing thread to return immediately without being blocked. This feature is implemented through Aspectran's Bean proxy.

    ```java
    @Component
    public class MyAsyncTaskService {
        @Async
        public void doSomethingAsync() {
            System.out.println("Executing async task...");
            // Long-running task
        }

        @Async
        public Future<String> doSomethingAndReturnAsync() {
            return CompletableFuture.completedFuture("Async task complete!");
        }
    }
    ```

### 3.3. AOP (Aspect-Oriented Programming)

**AOP (Aspect-Oriented Programming)** is a core programming paradigm that modularizes **cross-cutting concerns**—such as logging, security, transaction management, exception handling, and response header injection—by decoupling them from core business logic.

Unlike Spring AOP, which primarily relies on a single mechanism of intercepting bean method calls via proxies, **Aspectran** provides a highly optimized, **pragmatic AOP architecture** built upon two distinct foundational pillars: the **`Activity` Lifecycle (Translet Lifecycle)** and **`Bean` Method Interception**.

#### 3.3.1. The Need for AOP

When developing applications, common secondary functionalities are needed across multiple modules. Typical examples include parameter validation, authentication checks upon service method entry, database transaction commit and rollback, and security response header configuration.

Writing these common functionalities directly inside business logic classes causes significant architectural problems:
*   **Code Duplication and Increased Complexity**: The same or similar cross-cutting code is scattered across numerous classes and methods, reducing overall readability.
*   **Degraded Maintainability**: If a common policy changes, every business method must be located and modified individually, introducing high risks of omissions and regression bugs.
*   **Obscured Business Focus**: Pure business logic becomes cluttered with infrastructure boilerplate, making it difficult to understand the true intent of the code.

AOP encapsulates cross-cutting concerns into standalone modular units called **Aspects** and applies them declaratively to designated target execution points, thereby preserving the purity of business logic and significantly decoupling system architecture.

#### 3.3.2. Two Architectural Pillars of Aspectran AOP

Aspectran AOP provides two distinct execution dimensions tailored to specific operational targets:

| Architectural Pillar | Target | Mechanism | Primary Use Cases |
| :--- | :--- | :--- | :--- |
| **Activity Lifecycle AOP**<br/>*(Translet Lifecycle)* | `Activity` (The entire Translet request execution flow) | No proxy is involved; the `CoreActivity` engine executes aspects directly and sequentially according to lifecycle stages (Non-Proxy Core Interception) | Web security response header injection, global character encoding and view dispatcher injection, pre/post-request processing, authentication/authorization, global exception handling |
| **Bean Proxy AOP**<br/>*(Method Interception)* | Method execution on Beans (`target="method"`) | Runtime dynamic proxies (`AbstractBeanProxy`, Javassist/JDK) intercept method calls annotated with `@Advisable` to execute advice | Declarative database transactions, business method execution time measurement, method parameter audit logging |

##### 1) Activity Lifecycle AOP (Non-Proxy Core Interception)
*   Every client request (Web, Shell, Daemon) is executed by a single `Activity` instance.
*   The `Activity` engine traverses predetermined lifecycle stages from request dispatch to completion, executing matching aspects **directly and sequentially at the core engine level** without proxy instantiation or reflection overhead.
*   **Zero Overhead**: Because no dynamic proxies or reflections are involved, execution achieves near-native speed while declaratively governing request-wide settings such as security response headers (`<headers>`), default character encodings and view dispatchers (`<settings>`), and global exception response mappings (`<exception>`).

##### 2) Bean Proxy AOP (Selective Dynamic Proxying)
*   When applying AOP at the individual business method level within the service layer, a dynamic proxy mechanism is utilized.
*   Aspectran generates proxy objects using either Javassist (`JavassistBeanProxy`) or standard JDK Dynamic Proxies (`JdkBeanProxy`).
*   **Selective Proxying via `@Advisable` (Key Performance Optimization)**: Aspectran's AOP proxy does not indiscriminately intercept every method invocation. Instead, it activates Pointcut evaluations and Advice chains **only for methods explicitly annotated with `@Advisable` or `@Async`**. Standard methods without these annotations bypass proxy logic entirely and invoke the target method directly, eliminating unnecessary proxy overhead at its source.

#### 3.3.3. Core Components of Aspectran AOP

##### 1. Join Point
A specific point in the application execution flow where Advice can be applied:
*   **Activity Execution (`target="activity"`, Default)**: The entire request processing lifecycle of a Translet (Before, Translet Action, After, Thrown, Finally).
*   **Bean Method Execution (`target="method"`)**: Before, after, and exceptional completion of specific Bean methods annotated with `@Advisable`.

##### 2. Pointcut
A filtering rule that precisely defines where Advice should be applied. Pointcuts are declaratively configured within the `<joinpoint>` element of an `<aspect>` rule or via the `@Joinpoint(pointcut = ...)` annotation.

*   **Pointcut Expression Syntax**:
    ```text
    transletPattern[@beanOrClassPattern][^methodNamePattern]
    ```
    Divided into three segments using delimiters (`@`, `^`), where each part is optional:
    *   **Translet Pattern** (Before `@`): Target Translet name or URI request path pattern (e.g., `/user/**`, `/api/v1/*`). If omitted, all Translets are targeted.
    *   **Bean ID Pattern** (After `@`, Before `^`): Target Bean ID pattern (e.g., `@userService`, `@*Service`).
    *   **Class Pattern** (After `@class:`, Before `^`): Fully qualified package/class name pattern. When targeting class types, the **`class:` directive prefix is mandatory** (e.g., `@class:com.mycompany.service.*`, `@class:*.UserServiceImpl`).
    *   **Method Pattern** (After `^`): Target method name pattern (e.g., `^get*`, `^save*`, `^execute*`).

*   **Examples of Various Pattern Formats**:
    *   `/order/**`: Targets the Activity lifecycle of all Translets under `/order/`
    *   `@someService^execute*`: Targets methods starting with `execute` on the `someService` bean across all Translets
    *   `/user/list@userService^get*`: Targets methods starting with `get` on the `userService` bean within the `/user/list` Translet
    *   `@class:com.mycompany.service.*Service^process*`: Targets methods starting with `process` on all Service classes across all Translets
    *   `@^execute*`: Targets methods starting with `execute` across all beans and all Translets

*   **Inclusion (`+:`) and Exclusion (`-:`) Rules with Sequential Evaluation**:
    *   `+:` (Include): Matches and includes targets for AOP application.
    *   `-:` (Exclude): Matches and excludes targets from AOP application.
    *   Evaluated strictly in top-down sequential order, enabling fine-grained targeting by declaring broad inclusions first and carving out specific exclusions below.

##### 3. Advice - 4 Standard Advice Types
The actual secondary functionality code executed at a Join Point.

> **💡 Clear Lifecycle Control with 4 Standard Advice Stages:**
> Aspectran provides 4 declarative and well-defined lifecycle stages (Before, After, Thrown, Finally). This design cleanly separates transactional boundaries, performance telemetry, security checks, and resource cleanup without proxy chaining overhead or deep call stacks.

| Advice Type | Annotation | Execution Timing | Primary Role & Characteristics |
| :--- | :--- | :--- | :--- |
| **`before`** | `@Before` | Prior to Join Point execution | Input validation, security verification, declarative response `<headers>` injection, recording start timestamps |
| **`after`** | `@After` | After successful Join Point execution | Result data enrichment, success audit logging (skipped if an exception is raised) |
| **`thrown`** | `@ExceptionThrown` | Upon exception during Join Point execution | Error logging, database transaction rollback, alert dispatching (**Invoked prior to Finally**) |
| **`finally`** | `@Finally` | Always executed at the end | Resource cleanup (`close()`), session closing, ThreadLocal clearing, elapsed time calculation and profiling |

##### 4. Aspect and Advanced Control Attributes
A module encapsulating Pointcuts and Advice into an independent unit, defined via the `<aspect>` XML element or the `@Aspect` annotation.

*   **`order` (Execution Priority)**:
    *   Controls execution sequence when multiple Aspects match the same Join Point. Lower numerical values have higher priority (Default: `Integer.MAX_VALUE`).
    *   Aspectran's `AdviceRuleRegistry` strictly manages general Advice and exception rules (`ExceptionRule`) in ascending `order` (0, 1, 2...).
    *   Assigning `order="0"` to infrastructural Aspects (such as transaction management) guarantees that they are registered and executed prior to business Aspects, ensuring transaction rollbacks are never missed during exceptions.
*   **`isolated` (Fault-Tolerant Isolation Mode)**:
    *   When set to `true`, exceptions thrown inside the Aspect's Advice are logged without terminating the main request processing flow.
    *   Ideal for non-critical Aspects such as telemetry, metrics collection, and external alerting.
    *   Furthermore, the core framework engine isolates exceptions during error handling via dual `try-catch` guards, ensuring subsequent rollback rules and resource cleanup execute to completion.
*   **`disabled`**: Setting this attribute to `true` deactivates the Aspect at runtime.

#### 3.3.4. Lifecycle and Exception Handling Flow

Aspectran AOP's 4 standard advice types follow strict and consistent sequences in both normal and exceptional flows.

##### a. Normal Execution Flow
1.  **Before Advice Execution**: Pre-processing, validation checks, `<settings>` and security `<headers>` injection.
2.  **Core Business Logic Execution**: Translet Actions or target Bean method bodies execute.
3.  **After Advice Execution**: Post-processing of results and success audit logging upon normal completion.
4.  **Finally Advice Execution**: Safe resource cleanup and session closing.

##### b. Exception Handling Flow
When an exception occurs during business logic or Before execution, control shifts strictly in the following order to guarantee data integrity and resource release:
1.  **After Advice Skipped**: After advice execution is immediately skipped.
2.  **Thrown Advice and Exception Rules Executed (`<thrown>`, `<exception>`)**:
    *   **Executes before the Finally stage**.
    *   Performs transaction rollback, error logging, and administrative notifications safely before database sessions or connections are closed.
    *   If matched against a global exception rule (`<exception>`), reserves error views (`<dispatch>`) or JSON error representations (`<transform>`) for client response.
3.  **Finally Advice Execution**:
    *   Always executes regardless of success or failure to safely release active resources such as `SqlSession.close()` and clean up ThreadLocal storage.
4.  **Exception Response Dispatch or Rethrow**:
    *   Sends the reserved error response to the client or rethrows unhandled exceptions to the container.

> **💡 Core Principle of Transactional Integrity:**
> Because Thrown (rollback) handling is always completed prior to Finally (resource release), transaction rollbacks succeed reliably without connection closure failures, preventing common resource leaks and data inconsistencies.

#### 3.3.5. Java Annotation-Based AOP Configuration

You can build complete Aspects using pure Java classes without XML configurations through the `com.aspectran.core.component.bean.annotation` package:

*   `@Component`: Automatically registers the Aspect class as a Bean.
*   `@Aspect(id = "...", order = 0, isolated = true)`: Declares that the class is an Aspect with a unique ID, execution priority, and isolation mode.
*   `@Joinpoint(pointcut = "...", target = JoinpointTargetType.ACTIVITY)`: Specifies the target pointcut expression and join point target.
*   `@Before`: Declares a method to be invoked before Join Point execution.
*   `@After`: Declares a method to be invoked after successful Join Point completion.
*   `@ExceptionThrown(Exception.class)`: Declares a method to be invoked upon exception, with optional target exception type filtering.
*   `@Finally`: Declares a method to always be invoked at the end.
*   `@Advisable`: Explicitly indicates that a Bean method is a target for Bean Proxy AOP.

**Annotation-Based Logging Aspect Example:**
```java
package com.aspectran.demo.aspect;

import com.aspectran.core.activity.Translet;
import com.aspectran.core.component.bean.annotation.After;
import com.aspectran.core.component.bean.annotation.Aspect;
import com.aspectran.core.component.bean.annotation.Before;
import com.aspectran.core.component.bean.annotation.Component;
import com.aspectran.core.component.bean.annotation.ExceptionThrown;
import com.aspectran.core.component.bean.annotation.Finally;
import com.aspectran.core.component.bean.annotation.Joinpoint;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
@Aspect(id = "loggingAspect", order = 1, isolated = true)
@Joinpoint(
    pointcut = {
        "+: /api/**",
        "-: /api/health-check"
    }
)
public class LoggingAspect {

    private static final Logger logger = LoggerFactory.getLogger(LoggingAspect.class);

    @Before
    public void beforeRequest(Translet translet) {
        logger.info("[Request Start] {} {}", translet.getRequestMethod(), translet.getRequestName());
    }

    @After
    public void afterRequest(Translet translet) {
        logger.info("[Request Success] {}", translet.getRequestName());
    }

    @ExceptionThrown(Exception.class)
    public void onError(Translet translet) {
        Throwable e = translet.getRaisedException();
        logger.error("[Request Error] {} - {}", translet.getRequestName(), e.getMessage(), e);
    }

    @Finally
    public void onFinally(Translet translet) {
        // Resource cleanup logic executed regardless of success or failure
    }
}
```

#### 3.3.6. Practical AOP Patterns

##### Pattern 1: Declarative Transaction Management (`SqlSessionAdvice` + `@Advisable`)

Transparently separates database transaction boundaries (open, commit, rollback, close) from business services using AOP.

**1. Java Annotation-Based Transaction Aspect:**
Define an Aspect extending `SqlSessionAdvice` and target the desired service with `@Joinpoint`:

```java
package com.aspectran.demo.aspect;

import com.aspectran.core.component.bean.annotation.After;
import com.aspectran.core.component.bean.annotation.Aspect;
import com.aspectran.core.component.bean.annotation.Autowired;
import com.aspectran.core.component.bean.annotation.Before;
import com.aspectran.core.component.bean.annotation.Component;
import com.aspectran.core.component.bean.annotation.ExceptionThrown;
import com.aspectran.core.component.bean.annotation.Finally;
import com.aspectran.core.component.bean.annotation.Joinpoint;
import com.aspectran.mybatis.SqlSessionAdvice;
import org.apache.ibatis.session.SqlSessionFactory;

@Component
@Aspect(order = 0)
@Joinpoint(pointcut = "+: **@simpleSqlSession")
public class SimpleTxAspect extends SqlSessionAdvice {

    @Autowired
    public SimpleTxAspect(SqlSessionFactory sqlSessionFactory) {
        super(sqlSessionFactory);
    }

    @Before
    public void open() {
        super.open();
    }

    @After
    public void commit() {
        super.commit();
    }

    @ExceptionThrown
    public void rollback() {
        super.rollback();
    }

    @Finally
    public void close() {
        super.close();
    }
}
```

**2. XML-Based Declarative Transaction Configuration:**
Clearly separate the advice bean and the aspect rule using XML:

```xml
<!-- 1. MyBatis SqlSession advice bean (prototype scope ensures a fresh instance per request) -->
<bean id="sqlSessionTxAdvice" class="com.aspectran.mybatis.SqlSessionAdvice" scope="prototype">
    <argument>#{sqlSessionFactory}</argument>
</bean>

<!-- 2. Declarative Transaction Aspect (order="0" grants highest priority) -->
<aspect id="simpleTxAspect" order="0">
    <joinpoint>
        pointcut: {
            +: **@simpleSqlSession
        }
    </joinpoint>
    <advice bean="sqlSessionTxAdvice">
        <before>
            <invoke method="open"/>
        </before>
        <after>
            <invoke method="commit"/>
        </after>
        <finally>
            <thrown>
                <!-- Rollback executes before session closure upon exception -->
                <invoke method="rollback"/>
            </thrown>
            <!-- Session closes on both normal completion and exceptions -->
            <invoke method="close"/>
        </finally>
    </advice>
</aspect>
```

**3. Business Service Layer:**
```java
@Component
public class OrderService {

    private final SimpleSqlSession sqlSession;

    @Autowired
    public OrderService(SimpleSqlSession sqlSession) {
        this.sqlSession = sqlSession;
    }

    public void processOrder(Order order) {
        // When invoked, txAspect triggers to manage the transaction automatically
        sqlSession.insert("app.demo.mapper.OrderMapper.insertOrder", order);
        sqlSession.update("app.demo.mapper.ItemMapper.updateStock", order.getItemId());
        // On success: after(commit) -> finally(close)
        // On exception: after is skipped; thrown(rollback) -> finally(close) executes safely
    }
}
```

##### Pattern 2: Performance Profiling with the Before + Finally Pattern

Aspectran combines `@Before` and `@Finally` advice with the framework's **Automatic Result Binding** mechanism to deliver precision elapsed-time monitoring without runtime overhead.

```java
package com.aspectran.demo.aspect;

import com.aspectran.core.activity.Translet;
import com.aspectran.core.component.bean.annotation.Aspect;
import com.aspectran.core.component.bean.annotation.Before;
import com.aspectran.core.component.bean.annotation.Component;
import com.aspectran.core.component.bean.annotation.Finally;
import com.aspectran.core.component.bean.annotation.Joinpoint;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
@Aspect(id = "profilingAspect", order = 10, isolated = true)
@Joinpoint(pointcut = "+: /api/**")
public class ProfilingAspect {

    private static final Logger logger = LoggerFactory.getLogger(ProfilingAspect.class);

    @Before
    public long startProfiling(Translet translet) {
        // The return value of @Before is automatically stored in the Activity's beforeAdviceResult under the aspect ID ("profilingAspect")
        return System.currentTimeMillis();
    }

    @Finally
    public void endProfiling(Translet translet) {
        // Retrieve the start timestamp seamlessly via translet.getBeforeAdviceResult()
        Long startTime = translet.getBeforeAdviceResult("profilingAspect");
        if (startTime != null) {
            long elapsedTime = System.currentTimeMillis() - startTime;
            if (elapsedTime > 500) {
                logger.warn("[SLOW API] {} {} took {} ms (status: {})",
                        translet.getRequestMethod(),
                        translet.getRequestName(),
                        elapsedTime,
                        (translet.isExceptionRaised() ? "ERROR" : "SUCCESS"));
            }
        }
    }
}
```

*   **Advantages of the Before + Finally Pattern**:
    *   **Automatic Framework Result Binding**: When a `@Before` method returns a value, the Aspectran engine automatically caches the result in the current `Activity`'s `beforeAdviceResult` map under the aspect ID (`"profilingAspect"`). Developers do not need to manually manage request attributes.
    *   **Zero Chaining Overhead**: Eliminates nested interceptor invocations, preventing call stack expansion and unnecessary memory overhead.
    *   **Complete Thread Safety**: Managed within the scoped request context (`Activity`), ensuring thread safety without concurrency locks.
    *   **Guaranteed Execution**: Because `Finally` blocks are guaranteed to execute even during unhandled exceptions, elapsed execution time is captured accurately under all circumstances.

##### Pattern 3: Global Web Security Headers and Environment Configuration (Activity Lifecycle AOP)

Instead of configuring security headers and view dispatchers redundantly across individual Translets, declare them globally using Activity Lifecycle AOP's Non-Proxy Core Interception:

```xml
<aspect id="webSecurityAspect">
    <joinpoint>
        pointcut: {
            +: /**
        }
    </joinpoint>
    <settings>
        <setting name="characterEncoding" value="utf-8"/>
        <setting name="viewDispatcher" value="thymeleafViewDispatcher"/>
    </settings>
    <advice>
        <before>
            <headers>
                <item name="X-Frame-Options">SAMEORIGIN</item>
                <item name="X-Content-Type-Options">nosniff</item>
                <item name="X-XSS-Protection">1; mode=block</item>
                <item name="Referrer-Policy">strict-origin-when-cross-origin</item>
            </headers>
        </before>
    </advice>
</aspect>
```

Settings and security response headers are injected directly at the core engine level without proxy generation, maintaining peak runtime performance.

In summary, Aspectran AOP combines lightweight **Activity Lifecycle AOP** for global environment control with selective **Bean Proxy AOP** for targeted business methods, all backed by an unambiguous **4 Standard Advice lifecycle**, delivering an intuitive, performant, and resilient enterprise architecture.

### 3.4. AsEL (Aspectran Expression Language)

AsEL (Aspectran Expression Language) is a powerful expression language used to reference and inject dynamic values within Aspectran's configuration files (XML, APON) or annotations. By using AsEL, you can dynamically combine runtime-generated request data or the property values of other beans with static configurations, greatly enhancing the framework's flexibility. In particular, since AsEL is based on OGNL (Object-Graph Navigation Language) internally, it can handle complex and dynamic expressions that go beyond simple value references, such as calling object methods or navigating properties.

#### 3.4.1. AsEL Token Types

AsEL uses three main tokens to access data in different scopes.

*   **`${...}` (Parameter Token)**: Accesses the **parameters** of the current request. It is mainly used to reference path variables or request parameters of a Translet.
    ```xml
    <translet name="/users/${userId}">
      <action bean="userService" method="deleteUser">
          <argument value="${userId}"/> <!-- Passes the userId parameter extracted from the URL path as an argument to the action -->
      </action>
    </translet>
    ```

*   **`@{...}` (Attribute Token)**: Accesses the **attributes** of the current `Activity` context. Attributes are data created and shared within the `Activity`, such as the results of other actions or AOP advice.
    ```xml
    <action id="userResult" bean="userAction" method="getUser"/>
    <!-- The result of the above action is stored as an attribute named 'userResult' -->
    <dispatch name="user/detail">
        <attribute name="user" value="@{userResult}"/> <!-- Passes the 'userResult' attribute to the view template as 'user' -->
    </dispatch>
    ```

*   **`#{...}` (Bean Token)**: Accesses a **bean or a bean's property** registered in the IoC container. It is useful for referencing static configuration values or the results of other bean method calls.
    ```xml
    <bean id="appConfig" class="com.example.AppConfig">
        <property name="defaultPageSize">20</property>
    </bean>

    <action bean="boardService" method="getArticleList">
        <!-- Passes the value of the defaultPageSize property of the appConfig bean as an argument -->
        <argument value="#{appConfig.defaultPageSize}"/>
    </action>
    ```

#### 3.4.2. @Value Annotation and AsEL

When used with the `@Value` annotation, the power of AsEL can be extended to the code level. Configuration values defined in environments (`properties`) can be injected directly into a Bean's fields or constructor arguments.

*   **`%{...}` (Property Token)**: Used within the `@Value` annotation, it references a **property** value registered via `<environment>` rules, JVM system properties, or `PropertiesFactoryBean`.

```java
// References the app.version property registered in PropertiesFactoryBean or <environment>
@Component
public class AppInfo {
    private final String appVersion;

    @Autowired
    public AppInfo(@Value("%{app.version:1.0.0}") String appVersion) {
        // If app.version exists, that value is injected;
        // otherwise, the default value "1.0.0" following the colon (:) is injected.
        this.appVersion = appVersion;
    }
}
```

By making good use of AsEL, you can effectively connect static configurations with dynamic application logic to create flexible applications that can respond to various situations just by changing the configuration without modifying the code.

### 3.5. APON (Aspectran Parameters Object Notation)

**APON (Aspectran Parameters Object Notation)** is Aspectran's proprietary, lightweight data interchange format and object model designed to represent structured data. By overcoming the strict syntactic constraints of JSON (disallowance of comments, trailing comma errors) and the indentation-sensitive complexity of YAML, APON offers both human-friendly intuitiveness for reading and writing, and rock-solid stability for system parsing.

APON is pervasive across Aspectran: it powers the core system configuration file `aspectran-config.apon`, internal parameter containers, and dynamic data structure definitions throughout the framework.

#### 3.5.1. Key Characteristics of APON

*   **Exceptional Readability and Flexible Delimiters**: Line breaks or commas (`,`) can be used interchangeably as delimiters. Quotation marks can be omitted for standard strings containing no special characters, making configurations concise and clean.
*   **Complete Comment Support (`#`)**: The `#` symbol enables both standalone line comments and inline comments directly following parameter values.
*   **Explicit Data Typing**: Data types (`string`, `int`, `long`, `boolean`, `text`, etc.) can be explicitly declared within parentheses following parameter names in `name(type): value` format, guaranteeing runtime correctness and type safety.
*   **Hierarchical Structuring**: Systematic structuring is achieved using curly braces (`{ }`) for nested blocks and square brackets (`[ ]`) for arrays.
*   **Multiline Long Text (`text`)**: Multiline strings such as SQL queries, templates, and extended descriptions can be neatly defined using parentheses `( )` and pipe (`|`) symbols.

#### 3.5.2. APON Syntax and Structure Example

```apon
# Server environment configuration example
server: {
    host: "0.0.0.0"
    port: 8080             # Service port
    timeout: 30000         # 30-second timeout
    sessionTracking: [
        cookie
        url
    ]
}

# Explicit typing and multiline text support
database: {
    driver: com.mysql.cj.jdbc.Driver
    url: "jdbc:mysql://localhost:3306/aspectran"
    maxActive(int): 20
    autoCommit(boolean): false
    initScript(text): (
        |CREATE TABLE IF NOT EXISTS sample_logs (
        |    id BIGINT AUTO_INCREMENT PRIMARY KEY,
        |    message VARCHAR(255) NOT NULL
        |);
    )
}
```

#### 3.5.3. Parameters Object Model and Java Integration

APON is more than a file format; it integrates one-to-one with the **`Parameters` (`com.aspectran.core.context.rule.params.Parameters`)** interface in Java:

*   **Automatic Request Body Parsing**: Payloads in JSON, XML, or APON sent by clients are instantly parsed into Aspectran's standard `Parameters` object via `translet.getRequestAdapter().getBodyAsParameters()` without requiring third-party parsing dependencies.
*   **Type-Safe Data Access**:
    ```java
    Parameters parameters = translet.getRequestAdapter().getBodyAsParameters();
    if (parameters != null) {
        String title = parameters.getString("title");
        int count = parameters.getInt("count", 1); // Default value supported
        Parameters subParams = parameters.getParameters("subConfig");
    }
    ```
*   **Dynamic Configuration Container**: Complex business parameters or external settings can be flexibly and type-safely encapsulated using `DefaultParameters` without having to define dedicated boilerplate DTO classes.

## 4. Utilizing Aspectran's Main Features

### 4.1. Profiles

Aspectran's Profiles feature is a powerful function that supports applying all or part of an application's configuration differently according to a specific environment, such as **development, test, or production**. This makes it easy to respond to multiple environments just by changing the configuration without any code changes.

#### 4.1.1. Need for and Use of Profiles

*   **Environment-specific Configuration Management**: You can efficiently manage settings that differ for each environment, such as database connection information, API keys, and logging levels.
*   **Conditional Bean Loading**: You can conditionally load Beans that are needed only in a specific environment (e.g., mock services for development, monitoring tools for production).

#### 4.1.2. How to Activate Profiles

Profiles are mainly activated through JVM system properties (`-D` option).

*   **`aspectran.profiles.active`**: Specifies the currently active profiles. If specifying multiple profiles, separate them with a comma (`,`).
    ```bash
    # Run the application with the 'dev' profile activated
    java -Daspectran.profiles.active=dev -jar my-application.jar

    # Activate both 'prod' and 'metrics' profiles simultaneously
    java -Daspectran.profiles.active=prod,metrics -jar my-application.jar
    ```
*   **`aspectran.profiles.default`**: Specifies the default profile to be activated if `aspectran.profiles.active` is not specified.
*   **`aspectran.profiles.base`**: Specifies the base profile that should always be active.

#### 4.1.3. Conditional Configuration Using Profiles

In Aspectran's configuration files (XML or APON), you can use the `profile` attribute on most elements to apply that setting only when a specific profile is active.

```xml
<aspectran>

    <!-- Development database settings applied only when the 'dev' profile is active -->
    <environment profile="dev">
        <property name="db.driver">org.h2.Driver</property>
        <property name="db.url">jdbc:h2:mem:devdb;DB_CLOSE_DELAY=-1</property>
        <property name="db.username">sa</property>
        <property name="db.password"></property>
    </environment>

    <!-- Production database settings applied only when the 'prod' profile is active -->
    <environment profile="prod">
        <property name="db.driver">com.mysql.cj.jdbc.Driver</property>
        <property name="db.url">jdbc:mysql://prod.db.server:3306/main_db</property>
        <property name="db.username">prod_db_user</property>
        <property name="db.password">!PROD_DB_PASSWORD!</property>
    </environment>

    <!-- Include a specific configuration file only when the 'prod' profile is active -->
    <append file="/config/metrics-rules.xml" profile="prod"/>

</aspectran>
```

#### 4.1.4. Profile Expressions

In addition to simple profile names, you can use logical operators to express complex conditions.

*   **`!` (NOT)**: When a specific profile is not active (e.g., `profile="!demo"`)
*   **`()` (AND)**: When all profiles within the parentheses are active (e.g., `profile="(prod, metrics)"`)
*   **`[]` (OR)**: When at least one of the profiles within the square brackets is active (separating with a comma `,` also works as OR) (e.g., `profile="[dev, test]"`)
*   **Composite Expressions**: You can create complex conditions by combining multiple operators.

#### 4.1.5. Usage Example: Environment-specific Database Configuration

Here is a complete example of setting different database connection information according to `dev` and `prod` environments.

**`config/aspectran-rules.xml`**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<aspectran>

    <description>Loads different DB settings depending on the environment.</description>

    <!-- Development environment settings -->
    <environment profile="dev">
        <property name="db.driver">org.h2.Driver</property>
        <property name="db.url">jdbc:h2:mem:devdb;DB_CLOSE_DELAY=-1</property>
        <property name="db.username">sa</property>
        <property name="db.password"></property>
    </environment>

    <!-- Production environment settings -->
    <environment profile="prod">
        <property name="db.driver">com.mysql.cj.jdbc.Driver</property>
        <property name="db.url">jdbc:mysql://prod.db.server:3306/main_db</property>
        <property name="db.username">prod_db_user</property>
        <property name="db.password">!PROD_DB_PASSWORD!</property>
    </environment>

    <!-- Data source bean definition -->
    <bean id="dataSource" class="com.zaxxer.hikari.HikariDataSource">
        <property name="driverClassName" value="${db.driver}"/>
        <property name="jdbcUrl" value="${db.url}"/>
        <property name="username" value="${db.username}"/>
        <property name="password" value="${db.password}"/>
    </bean>

</aspectran>
```

**Running the Application:**

- **Run in development environment:** Activating the `dev` profile uses the H2 in-memory database.
  ```bash
  java -Daspectran.profiles.active=dev -jar my-app.jar
  ```

- **Run in production environment:** Activating the `prod` profile uses the MySQL database.
  ```bash
  java -Daspectran.profiles.active=prod -jar my-app.jar
  ```

### 4.2. Properties (Property System)

Aspectran provides a powerful, hierarchical **Properties System** supporting flexible configuration management across runtime environments, dynamic runtime evaluation, and intelligent caching. Configuration values that differ across environments—such as database connection info, external API keys, and storage paths—are completely separated from Java source code, ensuring secure and maintainable operations.

#### 4.2.1. Property Ingestion Channels and Precedence

Aspectran ingests properties through multiple channels into a unified container, with higher-priority channels overriding lower ones:

1.  **JVM System Properties (`-D` Options)**: Most common and carries top precedence. (`-Dproperty.name=value`)
2.  **Deployment Configurations (`setup/app.conf`)**: In Aspectow-based applications, properties are automatically converted to JVM system properties (VM options) during boot script execution (`startup.sh`, `daemon.sh`).
3.  **Application Bootstrap Settings (`aspectran-config.apon`)**: Values defined in the `system.properties` section of the skeleton configuration file, registered at startup via `System.setProperty()`.
4.  **External Property Files (`PropertiesFactoryBean`)**: `.properties` files located on the filesystem or classpath integrated into container properties.
5.  **Rule-Based Environment Definitions (XML `<environment>`)**: Properties declaratively defined in XML rule files.

#### 4.2.2. Rule-Based Property Definitions (`<environment>`)

In XML configuration files, properties are defined within the **`<environment>`** element using `<property>` tags. By combining them with the `profile` attribute, you can declare distinct property sets per environment.

```xml
<aspectran>

    <!-- 1. Default property definitions -->
    <environment>
        <property name="app.title">Aspectran Demo Service</property>
        <property name="upload.maxSize">10485760</property>
    </environment>

    <!-- 2. Conditional property definitions per profile -->
    <environment profile="dev">
        <property name="upload.dir">/tmp/uploads</property>
        <property name="db.url">jdbc:h2:mem:devdb;DB_CLOSE_DELAY=-1</property>
    </environment>

    <environment profile="prod">
        <property name="upload.dir">/nas/storage/uploads</property>
        <property name="db.url">jdbc:mysql://prod-server:3306/prod_db</property>
    </environment>

</aspectran>
```

#### 4.2.3. Integrating External Property Files (`PropertiesFactoryBean`)

To read external `.properties` files and integrate them into the Aspectran property system, register the utility bean **`com.aspectran.core.support.PropertiesFactoryBean`**:

```xml
<bean id="appProperties" class="com.aspectran.core.support.PropertiesFactoryBean">
    <properties>
        <!-- Determine whether to ignore missing files without raising an error -->
        <item name="ignoreInvalidResource" valueType="boolean">false</item>
    </properties>

    <!-- File loaded when the 'prod' profile is active -->
    <properties profile="prod">
        <item name="locations" type="array">
            <value>/config/app-prod.properties</value>
        </item>
    </properties>

    <!-- File loaded when the 'prod' profile is not active (dev/test) -->
    <properties profile="!prod">
        <item name="locations" type="array">
            <value>classpath:config/app-dev.properties</value>
        </item>
    </properties>
</bean>
```

*   **Path Resolution**: The `classpath:` prefix resolves resources from the classpath root; paths without a prefix are resolved relative to the application's base path.
*   **AsEL Support**: Inside loaded property files, tokens in `%{...}` syntax can reference other Aspectran properties and are automatically resolved during initialization.

#### 4.2.4. Property Chaining & Caching

When a property definition references other properties via `%{...}` tokens, Aspectran guarantees consistency through internal **caching**:

*   If a property definition contains **at least one property token (`%{...}`)**, the full expression is evaluated upon first access, and the resulting value is stored in an internal cache for subsequent reuse.
*   If an expression contains only bean tokens (`#{...}`) or parameter tokens (`${...}`), it is evaluated dynamically on each access without being cached.

#### 4.2.5. Injection via AsEL `%{...}` Tokens and `@Value`

Defined properties can be referenced across the framework using AsEL's **`%{propertyName}`** syntax:

*   **XML Configuration References**: Can be injected into bean properties or Translet action parameters.
    ```xml
    <bean id="fileUploader" class="com.example.FileUploader">
        <!-- Injects property value with fallback syntax: %{propertyName:defaultValue} -->
        <property name="targetDir" value="%{upload.dir:/tmp}"/>
    </bean>
    ```

*   **Java Code Injection via `@Value`**:
    ```java
    @Component
    public class FileService {

        private final String uploadDir;
        private final long maxSize;

        @Autowired
        public FileService(
                @Value("%{upload.dir:/tmp}") String uploadDir,
                @Value("%{upload.maxSize:5242880}") long maxSize) {
            this.uploadDir = uploadDir;
            this.maxSize = maxSize;
        }
    }
    ```

### 4.3. Scheduler

Aspectran Scheduler is a powerful feature that allows specific tasks within an application to be **executed automatically at set times or periodically**. With this feature, developers can implement and manage various background tasks—such as batch jobs, data synchronization, and report generation—using Translets as the core execution unit.

#### 4.3.1. Role of the Scheduler and Quartz-Based Architecture

Aspectran Scheduler has a **robust scheduling framework based on Quartz built directly into its core**. Developers can immediately activate scheduling capabilities through Aspectran configuration rules without dealing with the complexity of third-party library integrations. You can easily automate tasks using Translets without having to manage low-level scheduler threading or job mechanics.

#### 4.3.2. How to Configure the Scheduler

Aspectran provides two main ways to configure the scheduler:

1.  **XML/APON-Based Configuration**: Explicitly define the scheduler bean and schedule rules (`<schedule>`) in XML or APON:

    ```xml
    <!-- Scheduler bean definition -->
    <bean id="scheduler1" class="com.aspectran.core.scheduler.support.QuartzSchedulerFactoryBean">
        <property type="properties" name="quartzProperties">
            <entry name="org.quartz.scheduler.instanceName" value="MyScheduler"/>
            <entry name="org.quartz.threadPool.threadCount" value="10"/>
            <!-- Other Quartz properties... -->
        </property>
    </bean>

    <!-- Schedule rule definition -->
    <schedule id="my-daily-report">
        <scheduler bean="scheduler1">
            <trigger type="cron">
                expression: 0 0 2 * * ? <!-- Run every day at 2:00 AM -->
            </trigger>
        </scheduler>
        <job translet="/batch/daily-report"/> <!-- Specify Translet to run -->
        <job translet="/batch/log-archive"/>
    </schedule>
    ```

2.  **Annotation-Based Configuration**: Using the `@Schedule` annotation, you can declaratively manage everything—from defining the scheduler bean to configuring jobs and triggers—within a single Java class. This enhances code cohesion and minimizes XML configuration.

    ```java
    import com.aspectran.core.component.bean.annotation.Bean;
    import com.aspectran.core.component.bean.annotation.Component;
    import com.aspectran.core.component.bean.annotation.CronTrigger;
    import com.aspectran.core.component.bean.annotation.Job;
    import com.aspectran.core.component.bean.annotation.Request;
    import com.aspectran.core.component.bean.annotation.Schedule;
    import com.aspectran.core.context.rule.type.FormatType;
    import com.aspectran.core.scheduler.support.QuartzSchedulerFactoryBean;
    import org.quartz.SchedulerException;
    import org.quartz.impl.StdSchedulerFactory;

    import java.time.LocalDateTime;
    import java.util.Properties;

    @Component
    @Schedule(
        id = "my-annotated-job",
        scheduler = "mySchedulerBean", // ID of the scheduler Bean
        cronTrigger = @CronTrigger(expression = "0 0/1 * * * ?"), // Run every minute
        jobs = { @Job(translet = "/annotated/task") }
    )
    public class MyScheduledTasks {

        @Request("/annotated/task") // Translet method executed by the scheduler
        @Transform(FormatType.TEXT)
        public String executeTask() {
            return "Scheduled task executed: " + LocalDateTime.now();
        }

        @Bean("mySchedulerBean") // Quartz Scheduler Bean definition
        public org.quartz.Scheduler createScheduler() throws SchedulerException {
            Properties props = new Properties();
            props.put("org.quartz.scheduler.instanceName", "AnnotatedScheduler");
            props.put("org.quartz.threadPool.threadCount", "5");
            return new StdSchedulerFactory(props).getScheduler();
        }
    }
    ```

#### 4.3.3. Trigger Type Details

Triggers control when jobs are executed. They can be configured via XML `<trigger>` elements or annotations like `@SimpleTrigger` and `@CronTrigger`:

*   **`simple` Trigger**: Used to repeat tasks at straightforward intervals, such as "start 10 seconds from now and repeat every hour, 5 times in total."
    *   **Key Attributes**: `startDelaySeconds`, `intervalInSeconds/Minutes/Hours`, `repeatCount` (`-1` for infinite repetition), `repeatForever`.

    ```xml
    <trigger type="simple">
        startDelaySeconds: 10
        intervalInHours: 1
        repeatForever: true
    </trigger>
    ```
    ```java
    @SimpleTrigger(
        startDelaySeconds = 300,
        intervalInSeconds = 30,
        repeatCount = 9 // 1 initial run + 9 repetitions = 10 total runs
    )
    ```

*   **`cron` Trigger**: Used to run tasks according to calendar-driven schedules, such as "every Friday at 5:30 PM" or "at 1:00 AM on the last day of every month," powered by standard **Cron expressions**.
    *   **Key Attribute**: `expression` (Cron expression string).

    ```xml
    <trigger type="cron">
        expression: 0 50 23 * * ?
    </trigger>
    ```
    ```java
    @CronTrigger(expression = "0 30 9 ? * MON-FRI") // Monday through Friday at 9:30 AM
    ```

#### 4.3.4. Schedule Job Logging and Monitoring

Monitoring and debugging scheduled tasks is vital for production stability. Aspectran records detailed schedule execution events via Logback:

*   **Logging Mechanism**: The `com.aspectran.core.scheduler.activity.ActivityJobReporter` logs job start, success, and failure events. It interfaces with Quartz's `JobListener` to record lifecycle milestones.
*   **Logback Configuration Example**: To separate scheduler logs into dedicated files, utilize Logback's `SiftingAppender` along with Aspectran's `LoggingGroupDiscriminator`, which routes logs based on `LOGGING_GROUP`.

### 4.4. Response Handling

Aspectran provides versatile response handling mechanisms to return Translet results to clients or forward them to downstream components:
1.  **`dispatch`**: Delegates processing to view template engines like JSP or Thymeleaf to render complete UI pages.
2.  **`transform`**: Serializes processing results into formats such as JSON, XML, or Text through declarative rules.
3.  **`forward`**: Forwards processing to another Translet internally on the server while preserving request context and attributes.
4.  **`redirect`**: Instructs client web browsers to issue a new request to a different URL.
5.  **`RestResponse`**: Programmatically assembles HTTP status codes, headers, and response payloads directly in Java code.

#### 4.4.1. Dispatch: View Template Rendering

The `dispatch` response renders complete HTML pages by delegating to external view template engines (JSP, Thymeleaf, FreeMarker, etc.), ideal for traditional web applications:

The `name` attribute of `<dispatch>` specifies the template file path, and `dispatcher` specifies the `ViewDispatcher` bean responsible for rendering. If omitted, the default `ViewDispatcher` is used.

```xml
<!-- 1. Thymeleaf view dispatcher bean configuration -->
<bean id="thymeleafViewDispatcher" class="com.aspectran.thymeleaf.view.ThymeleafViewDispatcher">
    <property name="prefix" value="/WEB-INF/templates/"/>
    <property name="suffix" value=".html"/>
    <property name="templateEngine" value-ref="thymeleafEngine"/>
</bean>

<!-- 2. Using Dispatch rule in Translet to invoke Thymeleaf view -->
<translet name="/hello">
    <dispatch name="hello" dispatcher="thymeleafViewDispatcher" contentType="text/html" encoding="UTF-8"/>
</translet>
```

#### 4.4.2. Transform: Data Format Conversion

The `transform` response generates response payloads directly by serializing action results into data formats (JSON, XML, text, etc.), essential for REST APIs:

*   **JSON Conversion**: Use `format="json"` to convert results into JSON strings. Adding `pretty="true"` formats the output for readability.
    ```xml
    <translet name="/api/users/1">
        <action bean="userService" method="getUser" id="user"/>
        <transform format="json" pretty="true"/>
    </translet>
    ```

*   **XML Conversion**: Use `format="xml"` to convert results into XML.
    ```xml
    <translet name="/api/users/1.xml">
        <action bean="userService" method="getUser" id="user"/>
        <transform format="xml" pretty="true"/>
    </translet>
    ```

*   **Text Conversion and Template Usage**: Use `format="text"` for plain text. When combined with `<template>`, dynamic content can be constructed using AsEL tokens.
    ```xml
    <translet name="/api/users/1/info">
        <action bean="userService" method="getUser" id="user"/>
        <transform format="text">
            <template>
                User Name: @{user.name}
                Email: @{user.email}
            </template>
        </transform>
    </translet>
    ```

#### 4.4.3. Forward: Internal Translet Routing

A `forward` response transfers request execution to another Translet internally on the server without immediately sending a response to the client:

*   **Preserving Request Context**: Because a new HTTP request is not generated by the client, existing request attributes (`translet.getAttribute()`) and parameters stored in the current `Activity` are seamlessly preserved.
*   **Declarative XML Configuration**:
    ```xml
    <translet name="/order/process">
        <action bean="orderService" method="processPayment"/>
        <!-- Forward to internal summary Translet upon payment completion -->
        <forward translet="/order/summary"/>
    </translet>
    ```
*   **Dynamic Forwarding in Java Code**:
    ```java
    @RequestToPost("/login")
    public void handleLogin(Translet translet) {
        boolean success = authService.authenticate(translet);
        if (success) {
            translet.forward("/dashboard");
        } else {
            translet.setAttribute("loginError", "Invalid username or password.");
            translet.forward("/login-form");
        }
    }
    ```

#### 4.4.4. Redirect: Client Redirection and FlashMap

A `redirect` response issues an HTTP redirect instruction (default: 302 Found) to the client web browser, directing it to request a new URL. This is the cornerstone of the **POST-Redirect-GET (PRG) pattern**, preventing duplicate form submissions upon page refresh.

*   **Declarative XML Configuration**:
    ```xml
    <translet name="/user/register" method="POST">
        <action bean="userService" method="register"/>
        <!-- Redirect to welcome page upon registration completion -->
        <redirect path="/user/welcome"/>
    </translet>
    ```

*   **Dynamic Redirection in Java Code with FlashMap Integration**:
    Because redirection causes the browser to issue an entirely new request, standard request scope attributes are discarded. Aspectran provides **`FlashMap`** as a temporary store for one-time attributes across redirects:

    ```java
    @RequestToPost("/user/signup")
    public void registerUser(@NonNull Translet translet, UserRegistrationDto dto) {
        userService.register(dto);

        // 1. Set one-time notification message for subsequent redirected request
        FlashMap flashMap = translet.getOutputFlashMap();
        flashMap.put("welcomeMsg", "Welcome aboard, " + dto.getUsername() + "!");

        // 2. Redirect to welcome page (query parameters can also be appended)
        translet.redirect("/user/welcome");
    }

    @RequestToGet("/user/welcome")
    public void welcomePage(@NonNull Translet translet) {
        // FlashMap attributes from the previous request are automatically restored to request attributes
        if (translet.hasInputFlashMap()) {
            Map<String, ?> flashData = translet.getInputFlashMap();
            // Accessible directly in view templates
        }
        translet.dispatch("user/welcome");
    }
    ```

#### 4.4.5. RestResponse: Programmatic REST Response

While the `transform` rule offers declarative simplicity, the `RestResponse` interface provides full programmatic control in Java code to construct dynamic RESTful responses. You can finely control HTTP status codes, headers, and body payloads conditionally.

Typically, instantiate `DefaultRestResponse` inside an action method, set data, and chain methods such as `.ok()`, `.notFound()`, or `.created()` to return the final response:

*   **Key Features**:
    *   **Set Data**: Pass payload data via `setData("key", value)` or constructors.
    *   **Status Code Chaining**: Easily chain status methods like `.ok()`, `.created(location)`, `.notFound()`, `.forbidden()`.
    *   **Dynamic Flexibility**: Ideal when response structures and statuses depend on complex conditional business logic.

*   **Usage Example**:
    ```java
    @Component
    public class CustomerActivity {

        private final CustomerRepository repository;

        @Autowired
        public CustomerActivity(CustomerRepository repository) {
            this.repository = repository;
        }

        @RequestToGet("/customers/${id}")
        public RestResponse getCustomer(@NonNull Integer id) {
            Customer customer = repository.getCustomer(id);
            RestResponse response = new DefaultRestResponse();
            if (customer != null) {
                // Return 200 OK with data
                response.setData("customer", customer);
                response.ok();
            } else {
                // Return 404 Not Found
                response.notFound();
            }
            return response;
        }

        @RequestToPost("/customers")
        public RestResponse addCustomer(@NonNull Translet translet, @NonNull Customer customer) {
            int id = repository.insertCustomer(customer);
            String resourceUri = translet.getActualRequestName() + "/" + id;
            // Return 201 Created with the location URI of the newly created resource
            return new DefaultRestResponse(customer).created(resourceUri);
        }
    }
    ```
With `RestResponse`, you can implement more complex and dynamic REST API responses more effectively than with the declarative `<transform>` rule.

## 5. Aspectran Configuration

The initial startup configuration of an Aspectran application is managed through the `com.aspectran.core.context.config.AspectranConfig` object.
This configuration is typically loaded from an `aspectran-config.apon` file in APON (Aspectran Parameter Object Notation) format.
Through this file, you can include configuration files in XML format (specified with `context.rules`) or enable annotation-based configuration.

### 5.1. Aspectran Basic Configuration

The "Basic Configuration" covers the core settings required for the initial startup of an Aspectran application. It is primarily managed via the `aspectran-config.apon` file, where you define system properties, context rules, and environment-specific settings.

*   **`system`**: Defines system-level properties (e.g., encryption keys, thread pool settings).
*   **`context`**: Configures the `ActivityContext`, including paths to XML rule files (`rules`), base packages for component scanning (`scan`), and active profiles (`profiles`).
*   **`web` / `scheduler` / `shell` / `daemon`**: Specific settings for each runtime environment.

For more details, please refer to the [Aspectran Basic Configuration](/en/docs/guides/aspectran-configuration/) document.

### 5.2. Aspectran XML Configuration

XML configuration is used to explicitly define the core components of an application, such as Beans, Translets, and Aspects. It provides high flexibility by allowing you to change configurations and relationships without modifying the source code.

*   **Structure**: The root element is `<aspectran>`, and it contains child elements like `<bean>`, `<translet>`, `<aspect>`, and `<schedule>`.
*   **DTD Validation**: Aspectran uses DTD (Document Type Definition) for structural validation of configuration files, prioritizing simplicity and clarity.

For more details, please refer to the [Aspectran XML Configuration](/en/docs/guides/aspectran-xml-configuration/) document.

### 5.3. Configuration File Modularization and Division (`<append>`)

In enterprise-scale applications, managing countless Beans, Translets, and AOP rules within a single XML file severely degrades readability and maintainability. Aspectran provides a modularization mechanism via the **`<append>`** element, enabling you to split configurations by roles and domains and assemble them flexibly in the root rule file.

#### 1) Resource Types Supported by `<append>`
*   **`resource` Attribute**: Loads a configuration file from the classpath (including inside JARs). This is the standard, recommended approach.
    ```xml
    <append resource="config/common-beans.xml"/>
    ```
*   **`file` Attribute**: Loads a configuration file from an absolute or relative filesystem path. Useful for referencing external server configurations.
    ```xml
    <append file="/etc/myapp/config/external-rules.xml"/>
    ```
*   **`url` Attribute**: Dynamically loads configuration files from remote HTTP/HTTPS URLs.
    ```xml
    <append url="https://config-server.internal/rules/common-rules.xml"/>
    ```

#### 2) Environment-Specific Module Loading with Profiles
The `<append>` element fully supports the `profile` attribute, allowing you to selectively load dedicated configuration modules required only in specific runtime environments:

```xml
<!-- Include monitoring rules only when the 'prod' profile is active -->
<append resource="config/prod/monitoring.xml" profile="prod"/>
```

#### 3) Hierarchical Modularization Following Aspectran Rule File Naming Conventions

Aspectran adopts a rule-based naming convention that cleanly separates the **Skeleton** (structural framework) from the **Content** (business rules and domain resources):

*   **Structural Entry Points (Skeleton - `*-rules.xml`)**: Entry-point files that define the structural skeleton of the application and assemble (`append`) child modules.
    *   `aspectran-rules.xml`: Root rule entry point for the entire application
    *   `web-rules.xml`: Rule entry point for web environments
    *   `shell-rules.xml`, `daemon-rules.xml`: Dedicated rule entry points for CLI and daemon environments
*   **Functional & Domain Modules (Content - Concise Names)**: Content files housing actual translet groups or specific resources (Beans, database, etc.). Because they are included by parent rule files, they use concise, semantic names without redundant suffixes.
    *   `database.xml`, `server.xml`, `home.xml`, `monitoring.xml`, `order.xml`, etc.

```text
aspectran-config.apon (System Configuration)
└── aspectran-rules.xml (Root Rule Entry Point)
    ├── database.xml (Resource Definitions)
    ├── common-beans.xml (Common Bean Definitions)
    └── web-rules.xml (Web Environment Rule Entry Point)
        ├── home.xml (Home Translet Group)
        └── order.xml (Order Translet Group)
```

**Root Rule File Example (`aspectran-rules.xml`):**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>

    <description>Application Root Rule Entry Point</description>

    <!-- 1. Load resources and common infrastructure modules -->
    <append resource="config/database.xml"/>
    <append resource="config/common-beans.xml"/>

    <!-- 2. Load common AOP security and interceptor rules -->
    <append resource="config/security-rules.xml"/>

    <!-- 3. Assemble environment-specific rule entry points -->
    <append resource="config/web-rules.xml"/>
    <append resource="config/scheduler-rules.xml"/>

</aspectran>
```

### 5.4. Servlet-based Web Application Configuration

To run Aspectran in a traditional servlet container (like Tomcat or Jetty), you need to register Aspectran's `WebActivityServlet` and `WebServiceListener` in the `web.xml` deployment descriptor.

*   **`WebServiceListener`**: Manages the lifecycle (start/stop) of the Aspectran service.
*   **`WebActivityServlet`**: Acts as a Front Controller that handles all incoming web requests and dispatches them to the appropriate Translets.
*   **`aspectran:config`**: A context parameter used to specify the location of the root configuration file (e.g., `classpath:config/aspectran-config.apon`).

For more details, please refer to the [Servlet-based Web Application Configuration](/en/docs/guides/aspectran-servlet-configuration/) document.

### 5.5. Combining Annotations and XML Configuration

In most cases, it is common to use annotation-based component scanning as the default and combine it with XML configuration when you need to override a specific Bean or register an external library.
If a Bean with the same ID is defined in both, the configuration that is loaded later may take precedence, and you can force an override with the `<bean important="true">` attribute.

## 6. Development Tips and Best Practices

Following these tips and best practices when developing Aspectran applications will help you write more robust and maintainable code.

### 6.1. Prefer Constructor Injection

*   **Immutability**: You can declare dependencies as `final` fields, ensuring that the Bean's state does not change.
*   **Explicit Dependencies**: All dependencies required for an object to function are clearly exposed in the constructor, which improves code readability.
*   **Circular Reference Prevention**: When using constructor injection, if a circular reference occurs where Bean A and B need each other, an error will occur at application startup, allowing you to immediately discover and resolve the problem.

### 6.2. Avoid Circular Dependencies

A Circular Dependency is a situation where two or more Beans depend on each other. This can be a sign of a design problem, increasing code complexity and making testing difficult. In most cases, circular dependencies can be resolved by refactoring to separate responsibilities into a third class. In unavoidable cases, using setter injection can solve the circular reference problem, but this should be considered a last resort.

### 6.3. Singleton Beans and State Management

Since a singleton Bean has only one instance throughout the application, it can be accessed by multiple threads simultaneously. If a singleton Bean has a mutable state (e.g., member variables), concurrency issues can arise. It is best to design singleton Beans to be stateless if possible. If state is absolutely necessary, you should use `ThreadLocal` or carefully implement synchronization.

### 6.4. Understanding the Lifecycle of `prototype` Beans

After the container creates and injects dependencies into a `prototype` scope Bean, it no longer manages it. Therefore, destruction-related callbacks like `@Destroy` or `DisposableBean` are **not called.** If a `prototype` Bean holds important resources like a database connection, the developer must manually call the logic to release those resources.

## 7. Troubleshooting and Debugging

Here are some tips for solving common problems that may arise during Aspectran application development.

### 7.1. Utilizing Logging

Aspectran builds a flexible and powerful logging system based on SLF4J and Logback. Logging is essential for understanding the application's behavior and diagnosing problems.

*   **Adjusting Log Levels**: You can get more detailed information by adjusting the log levels (TRACE, DEBUG, INFO, WARN, ERROR) in the `logback.xml` or `logback-test.xml` file.
*   **Separating Scheduler Logs**: You can monitor the logs of scheduled tasks by separating them into a separate file. (Utilize the logs of the `com.aspectran.core.scheduler.activity.ActivityJobReporter` class)

For more details, please refer to the [Aspectran Logging Mechanism](/en/docs/mechanisms/aspectran-logging-mechanism/) document.

### 7.2. Common Error Messages and Troubleshooting Tips

*   **`BeanNotFoundException`**: Occurs when the requested Bean cannot be found in the container. Check the following:
    *   Whether the Bean is correctly defined with the `@Component` or `@Bean` annotation.
    *   Whether the package containing the Bean is correctly specified in the `context.scan` or `<bean-scan>` of the main configuration file (`aspectran.apon` or `aspectran.xml`).
    *   Whether the Bean ID or type is correctly referenced.
*   **`NoActivityStateException`**: Occurs when there is no `Activity` context in the current thread. This can often happen when executing code in a new thread pool, such as with `CompletableFuture.supplyAsync()` inside an `@Async` method. It is safer to handle all tasks synchronously within the thread created by `@Async` and wrap only the final result with `CompletableFuture.completedFuture()`.
*   **Configuration File Parsing Error**: Occurs due to a syntax error in the XML or APON configuration file. Check the line number and location indicated in the error message to correct the syntax.

## 8. Reference Documents

We hope this guide helps you in using Aspectran. For more detailed information on each topic, please refer to the documents below.

*   [Aspectran Basic Configuration Guide](https://aspectran.com/en/docs/guides/aspectran-configuration/)
*   [Aspectran XML Configuration Guide](https://aspectran.com/en/docs/guides/aspectran-xml-configuration/)
*   [Aspectran Rule File Naming Conventions](https://aspectran.com/en/docs/guides/aspectran-rule-file-naming/)
*   [Aspectran Properties Configuration and Usage](https://aspectran.com/en/docs/guides/aspectran-properties/)
*   [Aspectran Wildcard Pattern Matching Guide](https://aspectran.com/en/docs/guides/aspectran-wildcard-matching/)
*   [Servlet-based Web Application Configuration](https://aspectran.com/en/docs/guides/aspectran-servlet-configuration/)
*   [Aspectran Beans](https://aspectran.com/en/docs/guides/aspectran-beans/)
*   [Aspectran AOP: Features & Architecture](https://aspectran.com/en/docs/guides/aspectran-aop/)
*   [Understanding Translet: The Face of Aspectran](https://aspectran.com/en/docs/guides/aspectran-translet/)
*   [Practical Guide to Translets](https://aspectran.com/en/docs/guides/practical-guide-to-translets/)
*   [Aspectran Scheduler: Task Automation with Translets](https://aspectran.com/en/docs/guides/aspectran-scheduler/)
*   [Aspectran View Technologies](https://aspectran.com/en/docs/guides/aspectran-view-technologies/)
*   [Aspectran Profiles](https://aspectran.com/en/docs/guides/aspectran-profiles/)
*   [Introduction to AsEL (Aspectran Expression Language)](https://aspectran.com/en/docs/guides/introduce-asel/)
*   [Introduction to APON (Aspectran Parameters Object Notation)](https://aspectran.com/en/docs/guides/introduce-apon/)
*   [Aspectran JSON Utilities Guide](https://aspectran.com/en/docs/guides/aspectran-json-guide/)
