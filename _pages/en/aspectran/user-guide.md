---
format: plate solid article
title: Aspectran User Guide
teaser: This is a guide document for developers who are new to Aspectran.
sidebar: toc
---

Aspectran is a lightweight, high-performance framework based on the JVM, designed to efficiently build a wide range of applications, from simple command-line applications to complex enterprise web services. This guide is written to help developers new to Aspectran gain a deep understanding of the framework's core concepts and to cope with various situations that may arise while developing real applications.

## 1. Introduction to Aspectran

### 1.1. What is Aspectran?

Aspectran is a lightweight, high-performance Java framework capable of developing various applications, from simple command-line tools to complex enterprise web services. It offers a consistent programming environment across different platforms like Web, Shell, and Daemon, enabling developers to easily build flexible and reusable components.

### 1.2. Core Philosophy and Advantages

*   **POJO-Centric Programming**: You can implement business logic using plain old Java objects (POJOs) without implementing special interfaces or inheriting from specific framework classes. This reduces the learning curve for developers and allows them to focus on solving business problems with pure Java code.
*   **Lightweight and High-Performance**: Provides fast startup times and low memory footprint with minimal dependencies and optimized resource usage.
*   **Inversion of Control (IoC) and Dependency Injection (DI)**: The framework takes responsibility for object creation, configuration, and lifecycle management, and automatically injects necessary dependencies to minimize coupling between components and help write flexible and reusable code.
*   **Aspect-Oriented Programming (AOP)**: Modularizes cross-cutting concerns that appear repeatedly throughout the application, such as logging, transactions, and security, and separates them from the core business logic.
*   **Adapter Pattern for Environmental Abstraction**: Provides the flexibility for the same business logic to run without modification in any environment (web, shell, daemon, etc.).

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

For a step-by-step tutorial on building your first Aspectran application, please refer to the [Getting Started with Aspectran](/en/aspectran/getting-started/) document.

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

Aspectran provides two main ways to define a Translet.

1.  **Declarative Rule-Based (XML/APON)**:
    This is the traditional method, where the processing flow of a Translet is declaratively defined using configuration files in XML or APON (Aspectran Parameter Object Notation) format. This allows for the separation of business logic and processing flow.

    ```xml
    <translet name="/user/info">
        <action bean="userDao" method="getUserInfo"/>
        <transform format="json"/>
    </translet>
    ```
    The example above defines a Translet that, upon receiving a `/user/info` request, executes the `getUserInfo` method of the `userDao` bean and responds with the result transformed into JSON format.

2.  **Annotation-Based (Java Code)**:
    Similar to `@RequestMapping` in Spring MVC, this is a modern method of defining a Translet directly in Java code using annotations. This provides developers with greater convenience and productivity.

    *   **Basic Request Handling**: If you attach an annotation corresponding to an HTTP request method, such as `@RequestToGet` or `@RequestToPost`, to a specific method within a bean class registered with `@Component`, Aspectran will implicitly create a Translet rule with that method as the core action.

        ```java
        @Component
        public class UserApiController {

            @Autowired
            private UserDao userDao;

            @RequestToGet("/user/info/${userId}") // Mapped to GET /user/info/${userId} request
            @Transform(format = FormatType.JSON) // Transform the result to JSON
            public User getUserInfo(Long userId) {
                return userDao.getUserById(userId);
            }
        }
        ```

    *   **Asynchronous Request Handling**: If you need to handle a long-running task, you can execute the Translet asynchronously by using the `async = true` attribute. This helps maintain the application's responsiveness by performing the task in the background without blocking the request thread.

        ```java
        @Component
        public class ReportController {
            @Autowired
            private ReportService reportService;

            @RequestToPost(path = "/reports/generate", async = true, timeout = 30000L)
            @Transform(format = FormatType.TEXT)
            public String generateReport(Translet translet) {
                // Parse the request body into Aspectran's Parameters object.
                // JSON, XML, etc., are automatically parsed based on the Content-Type.
                Parameters parameters = translet.getRequestAdapter().getBodyAsParameters();

                // The business logic directly uses the Parameters object.
                reportService.generate(parameters);

                return "Report generation has started in the background.";
            }
        }
        ```

    *   **Annotation Details**: The `@Request` annotation is used to define detailed rules such as the request path and HTTP method. For convenience, dedicated annotations like `@RequestToGet` and `@RequestToPost` corresponding to each HTTP method are also provided. These annotations share common attributes like `value` (path), `async`, and `timeout`.

    *   **Dynamic Translet Generation (Scanning)**: Instead of repeatedly defining hundreds of similar Translets, you can dynamically generate Translets at runtime with a single rule. For example, you can scan all JSP files under a specific directory and automatically create a Translet that uses each file as a view.

        ```xml
        <translet name="*" scan="/WEB-INF/jsp/**/*.jsp">
            <description>
                This automatically finds all JSP files in the '/WEB-INF/jsp/' directory and its subdirectories and registers them as Translets.
                The path of the discovered jsp file is specified as the value of the file attribute of the template element.
            </description>
            <dispatch>
                <template/>
            </dispatch>
        </translet>
        ```
        The rule above scans for all `.jsp` files in the `/WEB-INF/jsp/` directory and its subdirectories, and dynamically creates and registers Translets based on the file paths. For example, if a file `/WEB-INF/jsp/user/list.jsp` is found, a Translet named `user/list` is created. This feature is very useful for serving a large number of static view files and dramatically reduces repetitive Translet definitions.

#### 3.1.3. Translet Lifecycle and Relationship with Activity

When a request comes in, the `Activity` finds the most suitable Translet rule (blueprint) from the **`TransletRuleRegistry`**, creates an instance, and processes the request according to that rule. In other words, the Translet is the 'blueprint' and the `Activity` is the 'execution engine' that works by looking at that blueprint. The `TransletRuleRegistry` is a highly optimized data structure for fast and efficient lookups, using the request name, request method, wildcards, and path variable patterns to find a Translet.

The `Activity` parses the request information according to the rules defined in the Translet and sequentially executes the Actions that contain the business logic. Methods annotated with `@RequestToGet` and the like are called Action methods. In addition to the Invoke Action, which by default calls a bean's method, there are various types of Actions such as Echo Action, Header Action, and Include Action.

During this process, the created `Translet` instance acts as a **'medium for communication'** between the `Activity` and the user code (mainly the Action method). If a `Translet` type is declared as an argument in an Action method, the `Activity` will automatically inject the `Translet` instance when calling the method. Through this `Translet` instance, the developer can access the data created by the `Activity` (using the `getActivityData()` method), further process the data, and arbitrarily control the response logic, thus interacting with the framework.

As such, the Translet is a well-designed **Facade** that hides the complex internal execution logic (`Activity`) and presents only a clear and simple 'blueprint' and 'interface' to the user.

### 3.2. Bean

A Bean is a Java object managed by Aspectran's IoC (Inversion of Control) container. All components of an application, such as services, data access objects (DAOs), and utilities, are registered as Beans, their lifecycle is managed by the framework, and they are provided where needed through dependency injection (DI).

#### 3.2.1. Understanding IoC and DI

*   **IoC (Inversion of Control)**: Instead of the developer directly managing the creation, configuration, and lifecycle of objects, the Aspectran container does it. The developer only needs to define the objects, and the framework will instantiate them at the appropriate time and connect the necessary dependencies. This allows the developer to focus solely on the business logic.
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
    public class MyController {
        private final MyService myService;

        @Autowired
        public MyController(MyService myService) {
            this.myService = myService;
        }
    }
    ```

*   **Field and Setter Injection**: Useful for injecting optional dependencies, but constructor injection should be considered first. Field injection is only possible for `public` fields and is generally not recommended.

*   **Resolving Ambiguity with `@Qualifier`**: When there are multiple Beans of the same type, you can use `@Qualifier("beanId")` to specify the ID of the specific Bean to inject.

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

*   **Injecting Configuration Values with `@Value`**: You can use the `@Value` annotation to inject the evaluation result of an AsEL expression (usually an external configuration value) into a Bean's field or constructor parameter.

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

AOP (Aspect-Oriented Programming) is a programming paradigm that modularizes common functionalities (cross-cutting concerns) that appear repeatedly throughout an application, such as logging, transaction management, security, and caching, by separating them from the core business logic. Aspectran's AOP has its own unique model that is deeply integrated with the framework's core execution model, the `Activity`'s execution flow, and Bean method calls.

#### 3.3.1. The Need for AOP

When developing an application, you often find code that is repeated across multiple modules. For example, logging before every service method starts, or wrapping database operations in a transaction. Writing these common functionalities directly within the business logic code makes the code complex, difficult to change, and less reusable. AOP helps solve these problems by allowing you to keep the business logic clean and manage common functionalities in one place.

#### 3.3.2. Key Concepts of Aspectran AOP

*   **Join Point**: A specific point during the execution of an application where `Advice` can be applied. In Aspectran, the execution of a Translet (Activity execution) or a Bean method execution are the main Join Points.
    *   **Activity Execution**: You can intervene in the entire flow of an `Activity` that processes a request according to a Translet rule, such as before/after execution or when an exception occurs. This allows for effective modularization of common functionalities needed throughout request processing, such as logging, transactions, and authentication.
    *   **Bean Method Execution**: The execution of a specific Bean's method can be a Join Point.

*   **Pointcut**: An expression that precisely specifies the target where `Advice` will be applied. In Aspectran, Pointcuts are declaratively defined through the `<joinpoint>` element within an `<aspect>` rule in the configuration file.
    *   **Pointcut Expression Structure**: It has the form `transletNamePattern[@beanOrClassPattern][^methodNamePattern]`.
        *   `transletNamePattern`: Translet name pattern (e.g., `/user/*`)
        *   `@beanOrClassPattern`: Bean ID or class name pattern (e.g., `@userService`)
        *   `^methodNamePattern`: Method name pattern (e.g., `^get*`)
    *   **Examples of Various Pattern Formats**:
        *   Targeting a method of a specific Bean in all Translets: `*: @someService^execute*`
        *   Targeting a specific Bean method of a specific Translet: `/user/list@userService^get*`
        *   Targeting a specific Translet itself: `/user/*`
    *   **Inclusion and Exclusion Rules**: More precise control is possible using the `+` prefix (include) and `-` prefix (exclude).

*   **Advice**: The actual common functionality code to be executed at a Join Point. Aspectran supports the following Advice types:
    *   `@Before`: Executed before the Join Point.
    *   `@After`: Executed after the Join Point successfully completes.
    *   `@Around`: Wraps around the Join Point execution and can control whether the Join Point is executed.
    *   `@Thrown`: Executed when an exception occurs during the Join Point execution.
    *   `@Finally`: Always executed regardless of the success or failure of the Join Point.
    *   **Implementation of Advice**: The Advice logic is implemented as a method of a specific Bean. Aspectran executes the Advice at an optimized location depending on the Join Point target.

*   **Aspect**: A module that combines `Advice` and `Pointcut`. It is defined using an `<aspect>` rule in the configuration file or the `@Aspect` annotation. It allows for the encapsulation and management of multiple common functionalities as a single module.

#### 3.3.3. Weaving Mechanism: Intelligent Dynamic Proxy

Aspectran uses a **runtime Dynamic Proxy** to apply AOP. This proxy operates very efficiently and intelligently.

*   **Performance Optimization with Selective Advice Application**: Aspectran's AOP proxy does not intercept all method calls unconditionally. Instead, it performs AOP logic only if the method is annotated with `@Advisable`. This fundamentally eliminates unnecessary proxy overhead, significantly improving system performance.
*   **Proxy Creation Method**: By default, it uses Javassist to create proxy objects, and can create proxies for regular classes as well as interfaces. If the target Bean implements an interface, you can also choose to use the JDK dynamic proxy.

#### 3.3.4. Annotation Support

Through the `com.aspectran.core.component.bean.annotation` package, you can configure various Bean settings, including AOP, using only annotations without XML configuration. The main annotations are as follows:

*   `@Component`, `@Bean`: Registers an Aspect as a Bean.
*   `@Aspect`: Defines that the Bean is an Aspect. You can assign an ID with the `id` attribute and specify the application priority with the `order` attribute.
*   `@Joinpoint`: Sets the Pointcut that specifies the target to apply the advice to.
*   `@Before`, `@After`, `@Around`, `@Finally`, `@ExceptionThrown`: Used on methods that define each advice type.
*   `@Advisable`: Explicitly declares that the method is one to which AOP advice will be applied.

#### 3.3.5. Practical AOP Example: Declarative Transactions

One of the most powerful use cases for AOP is **declarative transaction management**. Instead of writing transaction start, commit, and rollback code directly in the business logic code of the service layer, AOP is used to apply that logic transparently from outside the method.

In Aspectran, you can create a flexible and reusable design by separating the **advice Bean** that contains the actual transaction logic and the **Aspect** that decides when and where to apply it.

*   **Annotation-Based Example**: Define an Aspect by extending `SqlSessionAdvice` and specify the target with `@Joinpoint`.

    ```java
    // SimpleTxAspect.java (Example of defining a transaction Aspect)
    @Component
    @Aspect(order = 0)
    @Joinpoint(pointcut = "+: **@simpleSqlSession") // Applies to all public methods of the simpleSqlSession bean
    public class SimpleTxAspect extends SqlSessionAdvice {
        @Autowired
        public SimpleTxAspect(SqlSessionFactory sqlSessionFactory) { super(sqlSessionFactory); }
        @Before public void open() { super.open(); }
        @After public void commit() { super.commit(); }
        @Finally public void close() { super.close(); }
    }

    // OrderService.java (Business logic)
    @Component
    @Bean(id = "simpleSqlSession") // Specify ID to be the target of the Aspect's Pointcut
    public class OrderService extends SqlSessionAgent {
        public OrderService() { super("simpleTxAspect"); }
        public void createOrder(Order order) {
            // When this method is called, 'simpleTxAspect' will operate, and the transaction will be managed automatically.
            insert("app.demo.mapper.OrderMapper.insertOrder", order);
        }
    }
    ```

*   **XML-Based Example**: Clearly separate and define the advice Bean and the Aspect in XML.

    ```xml
    <!-- 1. Define the advice Bean that contains the actual transaction logic -->
    <bean id="sqlSessionTxAdvice" class="com.aspectran.mybatis.SqlSessionAdvice" scope="prototype">
        <argument>#{sqlSessionFactory}</argument>
    </bean>

    <!-- 2. simpleTxAspect: Detects the Bean with ID 'simpleSqlSession' -->
    <aspect id="simpleTxAspect" order="0">
        <joinpoint pointcut="+: **@simpleSqlSession"/>
        <advice bean="sqlSessionTxAdvice">
            <before><invoke method="open"/></before>
            <after><invoke method="commit"/></after>
            <finally><invoke method="close"/></finally>
        </advice>
    </aspect>
    ```

By leveraging Aspectran's AOP in this way, you can perfectly separate business logic from transaction processing logic, greatly improving code readability and maintainability.

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

When used with the `@Value` annotation, the power of AsEL can be extended to the code level. You can inject values defined in an external configuration file (`properties`) directly into a Bean's fields or constructor arguments.

*   **`%{...}` (Property Token)**: Used within the `@Value` annotation, it references a **property** value defined in a `<properties>` element or an external configuration file.

```java
// content of config.properties file: app.version=1.2.3
// XML configuration: <properties file="config.properties"/>

@Component
public class AppInfo {
    private final String appVersion;

    @Autowired
    public AppInfo(@Value("%{app.version:1.0.0}") String appVersion) {
        // If the value exists in config.properties, "1.2.3" is injected.
        // Otherwise, the default value "1.0.0" is injected.
        this.appVersion = appVersion;
    }
}
```

By making good use of AsEL, you can effectively connect static configurations with dynamic application logic to create flexible applications that can respond to various situations just by changing the configuration without modifying the code.

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
    <append file="/config/metrics-context.xml" profile="prod"/>

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

**`config/root-context.xml`**
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

### 4.2. Scheduler

Aspectran Scheduler is a powerful feature that allows specific tasks within an application to be **executed automatically at a set time or periodically**. With this feature, developers can easily implement and manage various background tasks such as batch jobs, data synchronization, and report generation using Aspectran's core component, the Translet.

#### 4.2.1. Role of the Scheduler and Quartz-based Architecture

Aspectran Scheduler has a **powerful scheduling framework based on the Quartz scheduler built into its core**. Developers can immediately activate and use the scheduling feature with just the configuration rules provided by Aspectran, without the complex process of integrating a separate scheduling library themselves. Without worrying about the complex internal workings of scheduling, you can easily automate the tasks you want using the Translet you know best.

#### 4.2.2. How to Configure the Scheduler

Aspectran provides two main ways to configure the scheduler.

1.  **XML/APON-based Configuration**: Explicitly define the scheduler bean and schedule rules (`<schedule>`) in an XML or APON file.

    ```xml
    <!-- Scheduler bean definition -->
    <bean id="scheduler1" class="com.aspectran.core.scheduler.support.QuartzSchedulerFactoryBean">
        <property type="properties" name="quartzProperties">
            <entry name="org.quartz.scheduler.instanceName" value="MyScheduler"/>
            <entry name="org.quartz.threadPool.threadCount" value="10"/>
            <!-- All other Quartz properties... -->
        </property>
    </bean>

    <!-- Schedule rule definition -->
    <schedule id="my-daily-report">
        <scheduler bean="scheduler1">
            <trigger type="cron">
                expression: 0 0 2 * * ? <!-- Run every day at 2 AM -->
            </trigger>
        </scheduler>
        <job translet="/batch/daily-report"/> <!-- Specify the Translet to run -->
        <job translet="/batch/log-archive"/>
    </schedule>
    ```

2.  **Annotation-based Configuration**: Using the `@Schedule` annotation, you can declaratively handle everything from defining the scheduler bean to setting up jobs and triggers, all within a single Java class. This has the advantage of increasing code cohesion and minimizing XML configuration.

    ```java
    import com.aspectran.core.component.bean.annotation.Bean;
    import com.aspectran.core.component.bean.annotation.Component;
    import com.aspectran.core.component.bean.annotation.Request;
    import com.aspectran.core.context.rule.type.FormatType;
    import com.aspectran.core.scheduler.annotation.CronTrigger;
    import com.aspectran.core.scheduler.annotation.Job;
    import com.aspectran.core.scheduler.annotation.Schedule;
    import com.aspectran.core.scheduler.support.QuartzSchedulerFactoryBean;
    import org.quartz.SchedulerException;
    import org.quartz.impl.StdSchedulerFactory;

    import java.time.LocalDateTime;
    import java.util.Properties;

    @Component
    @Schedule(
        id = "my-annotated-job",
        scheduler = "mySchedulerBean", // ID of the scheduler Bean
        cronTrigger = @CronTrigger(expression = "0 0/1 * * * ?"), // Run every 1 minute
        jobs = { @Job(translet = "/annotated/task") }
    )
    public class MyScheduledTasks {

        @Request("/annotated/task") // Translet method to be executed by the scheduler
        @Transform(FormatType.TEXT)
        public String executeTask() {
            return "Scheduled task has been executed: " + LocalDateTime.now();
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

#### 4.2.3. Trigger Type Details

Triggers precisely control when a job is executed. They can be configured through the `<trigger>` element in XML or the `@SimpleTrigger` and `@CronTrigger` annotations in the annotation-based approach.

*   **`simple` trigger**: Used to repeat a task at simple intervals, such as "start 10 seconds from now, and run every hour, for a total of 5 times." It is best suited for repeating a task a set number of times or indefinitely at a specific interval.
    *   **Main attributes**: `startDelaySeconds`, `intervalInSeconds/Minutes/Hours`, `repeatCount` (`-1` for infinite repeat), `repeatForever`.

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
        repeatCount = 9 // 1 initial execution + 9 repeats = 10 total executions
    )
    ```

*   **`cron` trigger**: Used to execute tasks according to a complex calendar-related schedule, such as "every Friday at 5:30 PM" or "at 1 AM on the last day of every month." It operates based on the powerful **Cron expression**, providing very flexible and powerful scheduling.
    *   **Main attribute**: `expression` (Cron expression string).

    ```xml
    <trigger type="cron">
        expression: 0 50 23 * * ?
    </trigger>
    ```
    ```java
    @CronTrigger(expression = "0 30 9 ? * MON-FRI") // Every week from Monday to Friday, at 9:30 AM
    ```

#### 4.2.4. Schedule Job Logging and Monitoring

It is very important to check the execution status of scheduled tasks and to debug them. Aspectran supports detailed logging of schedule job execution events through Logback.

*   **Logging Mechanism**: The `com.aspectran.core.scheduler.activity.ActivityJobReporter` class logs events such as the start, success, and failure of a job. This reporter is linked with Quartz's `JobListener` to record key information that occurs during the job's lifecycle.
*   **Logback Configuration Example**: To manage scheduler logs in a separate file, you can use Logback's `SiftingAppender` and Aspectran's `LoggingGroupDiscriminator`. This allows scheduler logs to be recorded in a separate file based on the `LOGGING_GROUP` value.

### 4.3. Response Handling

Aspectran provides three main ways to return the processing results of an action method to the client. First, `dispatch` delegates processing to a view template like JSP or Thymeleaf to render a complete UI page. Second, `transform` easily converts the processing result into a specific data format like JSON or XML through declarative rules. Finally, `RestResponse` is used to programmatically control the HTTP status and response data in detail within Java code to construct dynamic REST API responses.

#### 4.3.1. Dispatch: View Template Rendering

The `dispatch` response is used to render a complete HTML web page by delegating processing to an external view template engine such as JSP, Thymeleaf, or FreeMarker. This is suitable for constructing the UI screens of a traditional web application.

The `name` attribute of the `<dispatch>` rule specifies the path to the template file, and the `dispatcher` attribute can specify the `ViewDispatcher` bean responsible for rendering. If the `dispatcher` attribute is omitted, the default `ViewDispatcher` is used.

```xml
<!-- 1. Thymeleaf view dispatcher bean configuration -->
<bean id="thymeleafViewDispatcher" class="com.aspectran.thymeleaf.view.ThymeleafViewDispatcher">
    <property name="prefix" value="/WEB-INF/templates/"/>
    <property name="suffix" value=".html"/>
    <property name="templateEngine" value-ref="thymeleafEngine"/>
</bean>

<!-- 2. Using a Dispatch rule in a Translet to call a Thymeleaf view -->
<translet name="/hello">
    <dispatch name="hello" dispatcher="thymeleafViewDispatcher" contentType="text/html" encoding="UTF-8"/>
</translet>
```

#### 4.3.2. Transform: Data Format Conversion

The `transform` response is used to directly generate the response body by converting the processing result of an action into a specific data format (JSON, XML, text, etc.). This is very useful for generating responses for REST APIs or for returning text in a specific format for data integration.

*   **JSON Conversion**: Use `format="json"` to convert the processing result into a JSON string. This is most commonly used in REST APIs. Adding the `pretty="true"` attribute will format the output for readability.
    ```xml
    <translet name="/api/users/1">
        <action bean="userService" method="getUser" id="user"/>
        <transform format="json" pretty="true"/>
    </translet>
    ```

*   **XML Conversion**: Use `format="xml"` to convert to XML.
    ```xml
    <translet name="/api/users/1.xml">
        <action bean="userService" method="getUser" id="user"/>
        <transform format="xml" pretty="true"/>
    </translet>
    ```

*   **Text Conversion and Template Usage**: Use `format="text"` to convert to plain text. When used with a `<template>` rule, you can create dynamic text content using AsEL tokens.
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

By understanding these two response methods, you can effectively build flexible applications that support both web pages and REST APIs.

#### 4.3.3. RestResponse: Programmatic REST Response

While the `transform` rule provides a convenient way to generate responses declaratively, the `RestResponse` interface offers a more flexible and powerful way to dynamically construct RESTful responses programmatically within Java code. This approach allows you to finely control the HTTP status code, headers, and response data based on conditions.

Typically, you create an instance of `DefaultRestResponse` in an action method, set the data, and then call methods like `.ok()`, `.notFound()`, or `.created()` to return the final `RestResponse` object.

*   **Key Features**:
    *   **Set Data**: Set the response data via `setData("key", value)` or through the constructor.
    *   **Status Code Chaining**: Set the HTTP status code and return the response object by chaining intuitive methods like `.ok()`, `.created(location)`, `.notFound()`, `.forbidden()`.
    *   **Flexibility**: Very useful when you need to dynamically determine the response content and status based on the results of complex business logic.

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
        public RestResponse getCustomer(@Required Integer id) {
            Customer customer = repository.getCustomer(id);
            RestResponse response = new DefaultRestResponse();
            if (customer != null) {
                // Return 200 OK status with data
                response.setData("customer", customer);
                response.ok();
            } else {
                // Return 404 Not Found status
                response.notFound();
            }
            return response;
        }

        @RequestToPost("/customers")
        public RestResponse addCustomer(@NonNull Translet translet, @Required Customer customer) {
            int id = repository.insertCustomer(customer);
            String resourceUri = translet.getActualRequestName() + "/" + id;
            // Return 201 Created status with the URI of the created resource
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

### 5.3. Servlet-based Web Application Configuration

To run Aspectran in a traditional servlet container (like Tomcat or Jetty), you need to register Aspectran's `WebActivityServlet` and `WebServiceListener` in the `web.xml` deployment descriptor.

*   **`WebServiceListener`**: Manages the lifecycle (start/stop) of the Aspectran service.
*   **`WebActivityServlet`**: Acts as a Front Controller that handles all incoming web requests and dispatches them to the appropriate Translets.
*   **`aspectran:config`**: A context parameter used to specify the location of the root configuration file (e.g., `classpath:config/aspectran-config.apon`).

For more details, please refer to the [Servlet-based Web Application Configuration](/en/docs/guides/aspectran-servlet-configuration/) document.

### 5.4. Combining Annotations and XML Configuration

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

For more details, please refer to the [Aspectran Logging Mechanism](architecture/aspectran-logging-mechanism_en.md) document.

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
*   [Servlet-based Web Application Configuration](https://aspectran.com/en/docs/guides/aspectran-servlet-configuration/)
*   [Aspectran Beans](https://aspectran.com/en/docs/guides/aspectran-beans/)
*   [Aspectran AOP: Features & Architecture](https://aspectran.com/en/docs/guides/aspectran-aop/)
*   [Understanding Translet: The Face of Aspectran](https://aspectran.com/en/docs/guides/aspectran-translet/)
*   [Aspectran Scheduler: Powerful Task Automation with Translets](https://aspectran.com/en/docs/guides/aspectran-scheduler/)
*   [Aspectran View Technologies](https://aspectran.com/en/docs/guides/aspectran-view-technologies/)
*   [Aspectran Profiles](https://aspectran.com/en/docs/guides/aspectran-profiles/)
*   [Introduction to AsEL (Aspectran Expression Language)](https://aspectran.com/en/docs/guides/introduce-asel/)
*   [Introduction to APON (Aspectran Parameters Object Notation)](https://aspectran.com/en/docs/guides/introduce-apon/)
*   [Aspectran JSON Utilities Guide](https://aspectran.com/en/docs/guides/aspectran-json-guide/)
