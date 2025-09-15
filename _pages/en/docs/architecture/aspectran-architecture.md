---
format: plate solid article
sidebar: toc-left
title: "Aspectran Architecture: An Integrated Deep Dive"
subheadline: Architecture
parent_path: /docs
---
#

---

## 1. Introduction

### 1.1. Aspectran Framework Overview
Aspectran is a lightweight, high-performance framework based on the JVM, designed to efficiently build a wide range of applications, from simple command-line applications to complex enterprise web services. This document provides an in-depth analysis of Aspectran's internal architecture from a framework developer's perspective, helping to understand its core components, design principles, and extension points.

### 1.2. Core Design Principles
Aspectran's architecture is based on the following core design principles:
*   **POJO-Centric**: Actively utilizes Plain Old Java Objects (POJOs) to hide the complexity of the framework and allow focus on business logic.
*   **IoC (Inversion of Control) and DI (Dependency Injection)**: The framework manages the creation and lifecycle of objects and automatically injects dependencies to increase modularity and testability.
*   **AOP (Aspect-Oriented Programming)**: Separates cross-cutting concerns from business logic to increase code cohesion and maximize reusability.
*   **Environment Abstraction**: Abstracts the differences of various execution environments (web, shell, daemon, etc.) through the Adapter pattern, allowing the same business logic to run independently of the environment.
*   **Modularity and Extensibility**: Supports flexible extension and customization through fine-grained modules and a layered architecture.

---

## 2. Top-Level Architecture: Services and Execution Environments

### 2.1. Aspectran Service Architecture

Aspectran's `Service` is a core container that manages the framework's lifecycle and acts as an entry point for a specific execution environment. The appropriate service implementation is used depending on the environment (web, shell, daemon, etc.) in which the application will run. This service architecture provides high flexibility and extensibility through a hierarchical and modular structure.

#### 2.1.1. The Foundation of All Services: `CoreService`

Located in the `com.aspectran.core.service` package, `CoreService` is the top-level abstraction that forms the basis of all Aspectran services.

-   **Role**: `CoreService` is the **standard Bootstrapper** that manages the entire lifecycle (`ServiceLifeCycle`) of the service, including starting, stopping, and restarting, and creates and initializes the `ActivityContext`, which contains all of Aspectran's settings and components (Bean, Translet, Aspect, etc.).
-   **Implementation**: `DefaultCoreService` is the standard implementation of `CoreService` and includes all the core logic for parsing configuration files and building the `ActivityContext`.
-   **Relationship**: All environment-specific services to be described later are implemented by either directly inheriting from this `DefaultCoreService` or by containing it internally to extend its functionality. In other words, all services share the core mechanism of `CoreService`.

#### 2.1.2. Feature Extension Module: `SchedulerService`

`SchedulerService` is a good example of Aspectran's modular architecture. It is not an independent service, but a **Sub-service** that adds **scheduling functionality** to `CoreService`.

-   **Operation**: It is dependent on the lifecycle of the parent service (`CoreService`) and starts and stops along with it.
-   **Abstraction**: It reads the schedule rules (`ScheduleRule`) defined in the Aspectran configuration file and automatically configures and runs the Quartz scheduler. Developers can define scheduling in Aspectran's way without having to deal with the complex Quartz API directly.
-   **Context Integration**: When a scheduled job is executed, it runs Aspectran's `Activity` through `ActivityLauncherJob`. Thanks to this, even within a scheduled job, you can inject all the Beans registered in the application or apply AOP Aspects, just like in any other web request or shell command.

### 2.2. Analysis of Aspectran's Execution Environments

Aspectran is designed to be highly adaptable, supporting various execution environments by providing specialized modules built upon its core service and activity concepts. This modularity allows developers to deploy Aspectran applications in a manner that best suits their specific use case, whether it be a long-running background process, an interactive command-line tool, an embedded library, or a traditional web application.

Here is an analysis of each environment:

#### 2.2.1. Daemon Environment (`com.aspectran.daemon`)

*   **Purpose:** To run an Aspectran application as a long-running background process without a direct user or web interface. Ideal for batch processing, scheduled tasks (if not using the built-in scheduler service), or inter-service communication.
*   **Main Entry Points:**
    *   `com.aspectran.daemon.DefaultDaemon` (and `SimpleDaemon`): Provides a `main` method to bootstrap the daemon from the command line. It handles loading the Aspectran configuration and starting the `DaemonService`.
    *   `com.aspectran.daemon.Daemon`: The core interface defining the contract for an Aspectran daemon process, including access to the `DaemonService` and command handling capabilities.
*   **Key Components:**
    *   `DaemonService`: A `CoreService` specialized for daemon tasks, allowing for programmatic `translate()` calls.
    *   `DaemonActivity`: An `Activity` implementation tailored for the daemon's internal request/response model.
    *   `CommandExecutor`, `CommandRegistry`, `FileCommander`: Components for handling administrative commands and polling-based tasks.
*   **Characteristics:** Proactive (initiates its own work), background execution, robust lifecycle management (including JVM shutdown hooks), optional session support for stateful background tasks.

#### 2.2.2. Embedded Environment (`com.aspectran.embed`)

*   **Purpose:** To integrate Aspectran's powerful features as a library or component within an existing Java application (standalone, desktop, or another web framework). It provides a simplified facade for interacting with Aspectran without exposing its internal complexities.
*   **Main Entry Point:**
    *   `com.aspectran.embed.service.EmbeddedAspectran`: The primary interface for embedding. It provides static `run()` methods that act as convenient factory methods for starting an embedded Aspectran instance from various configuration sources (file, reader, `AspectranConfig`).
*   **Key Components:**
    *   `EmbeddedAspectran` (Interface): A high-level facade over `CoreService` that provides methods like `translate()`, `render()`, `execute()`, `getBean()`, and `getMessage()`.
    *   `com.aspectran.embed.service.DefaultEmbeddedAspectran`: The concrete implementation of `EmbeddedAspectran`, which manages a `DefaultCoreService` internally.
    *   `com.aspectran.embed.activity.AspectranActivity`: An `Activity` implementation for the embedded context, adapting programmatic calls to Aspectran's processing pipeline.
*   **Characteristics:** Facade pattern, easy bootstrapping, use-case-oriented API, provides all of Aspectran's features with a simplified interface, optional session support.

#### 2.2.3. Shell Environment (`com.aspectran.shell`)

*   **Purpose:** To provide an interactive command-line interface (CLI) for an Aspectran application. It allows users to execute commands (translets) directly from a terminal and interact with the application.
*   **Main Entry Point:**
    *   `com.aspectran.shell.AspectranShell`: Contains the `main` method to bootstrap the interactive shell. It uses a `DefaultConsoleCommander` to manage the shell's lifecycle.
*   **Key Components:**
    *   `com.aspectran.shell.service.ShellService`: A `CoreService` specialized for the shell environment, providing access to the `ShellConsole` and a `translate()` method for command execution.
    *   `com.aspectran.shell.activity.ShellActivity`: An `Activity` implementation tailored for console I/O, handling features like procedural prompts and output redirection.
    *   `ShellConsole`: An abstraction for console interaction (reading input, writing output).
*   **Characteristics:** Interactive, command-line based, user-facing features (greetings, help, verbose mode), optional session support for maintaining state between commands.

#### 2.2.4. Web Environments (`com.aspectran.web` and `com.aspectran.undertow`)

Aspectran supports web environments through two primary modules: one for generic servlet containers and another for the Undertow web server.

*   **Generic Servlet Environment (`com.aspectran.web`)**
    *   **Purpose:** To run an Aspectran application within any standard Java Servlet container (e.g., Tomcat, Jetty, WildFly). It acts as a bridge between Aspectran's core and the Servlet API.
    *   **Main Entry Points:** `com.aspectran.web.servlet.listener.WebServiceListener`, `com.aspectran.web.servlet.WebActivityServlet`
    *   **Key Components:** `WebService`, `WebActivity`, `DefaultServletHttpRequestHandler`
    *   **Characteristics:** Reactive (responds to HTTP requests), Servlet API-based, supports all web features (sessions, encoding, multipart, async), traditional WAR deployment.

*   **Undertow Environment (`com.aspectran.undertow`)**
    *   **Purpose:** To run an Aspectran application on top of the high-performance, embedded Undertow web server. This provides a servlet-less alternative to the generic web environment, enabling a more lightweight and potentially faster deployment.
    *   **Main Entry Point:** Started by programmatically embedding Undertow and wiring up Aspectran's `TowService` as a handler.
    *   **Key Components:** `TowService`, `TowActivity`
    *   **Characteristics:** Servlet-less web, direct Undertow API interaction, high performance, reusable web configuration (`WebConfig`), ideal for building lightweight microservices with an embedded web server.

---

## 3. Environment Abstraction: The Adapter Architecture

One of the most powerful architectural features of the Aspectran framework is the **Adapter**. Adapters play a key role in abstracting the differences of the runtime environment (web, console, daemon, etc.), allowing the same business logic to run without modification in any environment.

### 3.1. Core Interfaces: `com.aspectran.core.adapter`
This package defines the **core interfaces** that all adapters must implement. Aspectran's core engine depends only on these abstract interfaces, so it does not need to know at all whether the actual execution environment is a web server, a console, or any other environment.

*   `ApplicationAdapter`: Abstracts the application's overall lifecycle and environment (base path, classloader, etc.).
*   `SessionAdapter`: Abstracts the user's session. It corresponds to `HttpSession` in a web environment but is generalized so that the concept of a session can be used in other environments as well.
*   `RequestAdapter`: Abstracts the user's request information. It includes parameters, attributes, etc.
*   `ResponseAdapter`: Abstracts the response to a request. It provides a stream for outputting response data, etc.

In addition, abstract classes in the form of `Abstract*Adapter` serve as templates that help to more easily create implementation adapters for each environment by pre-implementing common functionalities.

### 3.2. Environment-specific Implementation Adapters
The packages below contain classes that specifically implement the abstract interfaces of `com.aspectran.core.adapter` to fit their respective execution environments.

*   **Web Environment Adapters**
    *   **`com.aspectran.web.adapter` (Standard Servlet-based)**: `WebApplicationAdapter`, `HttpSessionAdapter`, `HttpRequestAdapter`, etc., wrap `ServletContext`, `HttpSession`, and `HttpServletRequest` respectively to operate in a standard servlet container environment.
    *   **`com.aspectran.undertow.adapter` (Native Undertow-based)**: Operates by directly wrapping the native objects (`HttpServerExchange`) of the high-performance web server Undertow, without going through the standard Servlet API.

*   **Console (CLI) Environment Adapter (`com.aspectran.shell.adapter`)**
    *   `ShellRequestAdapter` treats the user's input command and arguments as a 'request', and `ShellResponseAdapter` treats `System.out` as a 'response'.

*   **Daemon Environment Adapter (`com.aspectran.daemon.adapter`)**
    *   `DaemonRequestAdapter` treats a task triggered by a scheduler or an internal event as a 'request'.

*   **Embedded Environment Adapter (`com.aspectran.embed.adapter`)**
    *   Used when embedding Aspectran in another Java application, everything is implemented simply in memory, making it very useful for unit testing.

### 3.3. Advantages of the Adapter Architecture
1.  **Perfect Environment Separation**: The business logic (Translet, Bean, etc.) does not need to know at all in which environment it is running.
2.  **Highest Level of Code Reusability**: Code containing the same business logic can be reused in web, CLI, and background services without a single line of modification.
3.  **Testability**: Business logic can be tested quickly and simply using `com.aspectran.embed.adapter` without having to run a web server or a complex environment.
4.  **Extensibility**: Even if a new execution environment (e.g., gRPC, WebSocket, etc.) emerges, all existing Aspectran assets can be utilized as is, just by implementing an adapter for that environment.

---

## 4. Core Container and Processing Flow

### 4.1. ActivityContext: The Heart of Aspectran
The `ActivityContext` is the **core container (IoC Container)** of an Aspectran application and a central hub that oversees and manages all configurations, components, and execution states.

*   **Key Responsibilities and Roles**:
    *   **Lifecycle Management**: Manages the creation, initialization, and destruction of all registered core components.
    *   **Core Component Registry**: Provides an access point to registries that store and manage all rules and components, such as `BeanRegistry`, `AspectRuleRegistry`, `TransletRuleRegistry`, and `ScheduleRuleRegistry`.
    *   **Environment Information Access**: Provides access to the `Environment` object for active profiles, property values, etc.
    *   **Activity Management**: Manages the lifecycle of `Activity` objects and ensures stability in a multi-threaded environment by managing each thread's `Activity` independently using `ThreadLocal`.
    *   **Resource Loading and Internationalization**: Provides access to `ClassLoader` and `MessageSource`.

*   **Build Process (`ActivityContextBuilder`)**: `HybridActivityContextBuilder` builds the `ActivityContext` in four stages: **configuration, parsing, creation, and initialization**.
    1.  **Configuration**: The builder is configured through methods like `setContextRules()` (configuration file paths), `setBasePackages()` (component scanning), and `setActiveProfiles()` (profile activation).
    2.  **Parsing**: When the `build()` method is called, `HybridActivityContextParser` reads the configuration files (XML/APON), converts them into internal `Rule` objects like `AspectRule` and `BeanRule`, and also creates `BeanRule`s for scanned classes, temporarily storing them in `ActivityRuleAssistant`.
    3.  **Creation**: A `DefaultActivityContext` instance is created based on the parsed rules, and all registries are set up. The validity of bean references and aspect rules is verified through `BeanReferenceInspector` and `AspectRuleValidator`.
    4.  **Initialization**: The `initialize()` method of `ActivityContext` is called to complete the instantiation and dependency injection of all singleton beans. The **auto-reloading (Hot-Reloading)** feature is activated through `ContextReloadingTimer` according to the configuration.

### 4.2. Activity Architecture
Aspectran's Activity architecture is the **core of its request processing model**, a hierarchical and modular structure designed to handle requests consistently across various execution environments.

*   **Core Foundation (`com.aspectran.core.activity`)**: This package is the **execution engine** of Aspectran. It defines the fundamental concepts and pipeline needed to handle all kinds of requests.
    *   **`Activity`**: The central execution object for a single request-response lifecycle. It accesses the `ActivityContext`, abstracts the environment through adapters, and is responsible for exception handling and flow control.
    *   **`Translet`**: A **medium for communication between the `Activity` that actually processes the request and the user code**. It encapsulates the rules and data for a single request and serves as the main API for the business logic to interact with the execution state.
    *   **`CoreActivity`**: Provides the core logic to **process a request according to the rules defined in a `Translet`** and orchestrates the entire processing pipeline.
    *   **`InstantActivity`**: A lightweight `Activity` variant that can be executed from user code, useful for short-term programmatic tasks that leverage the Aspectran context.

### 4.3. Actions and Processing Results
The `com.aspectran.core.activity.process` package plays a key role in defining and executing the processing flow within an `Activity`.

*   **Concept of Action**: An Action refers to any command that implements the `com.aspectran.core.activity.process.action.Executable` interface. They are organized hierarchically within `ActionList` and `ContentList` to define the entire processing flow of a translet.
*   **Types of Actions**: Various built-in Actions are provided, such as `InvokeAction`, `AnnotatedAction`, `ChooseAction`, `EchoAction`, `HeaderAction`, and `IncludeAction`.
*   **Structure of Action Processing Results**: The results of Action execution are managed hierarchically through the classes in the `com.aspectran.core.activity.process.result` package.
    *   **`ActionResult`**: Encapsulates the result of a single `Executable` Action execution.
    *   **`ContentResult`**: A container for the results of a logical group of Actions (e.g., a `<contents>` block).
    *   **`ProcessResult`**: The top-level container for all execution results within a single `Activity` lifecycle.
*   **Utilization of Result Values**: This structured result value plays a crucial role in various key functions such as **view rendering**, **response generation (e.g., REST API)**, **inter-translet communication**, **conditional logic and flow control**, and **debugging and logging**.

---

## 5. Request and Response Handling Mechanism

Aspectran provides a robust and flexible mechanism for processing incoming requests and generating appropriate responses during the lifecycle of an `Activity`.

### 5.1. Request Handling
*   **Core Request Handling (`com.aspectran.core.activity.request`)**: Provides core abstractions for capturing, parsing, and managing request data through `AbstractRequest`, `ParameterMap`, `FileParameter`, `PathVariableMap`, and `RequestBodyParser`.
*   **Web-specific Request Handling (`com.aspectran.web.activity.request`)**: Handles complex HTTP requests such as multipart form data and header parsing by integrating with the `jakarta.servlet` API through `ActivityRequestWrapper` (a servlet request wrapper), `MultipartFormDataParser`, and `WebRequestBodyParser`.

### 5.2. Response Handling
Supports various response strategies centered around the `com.aspectran.core.activity.response` package.

*   **Basic Response Types**: Based on the `Response` interface, it supports the following:
    *   `ForwardResponse`: Performs a server-side forward.
    *   `RedirectResponse`: Sends an HTTP redirect to the client.
    *   `ResponseTemplate`: Programmatically generates a dynamic response.

*   **View Dispatching (`...response.dispatch`)**: Dispatches a request to a specific view technology (JSP, Thymeleaf, etc.) to render the UI through the `ViewDispatcher` interface and `DispatchResponse`. `DispatchResponse` acts as a mediator that finds the `ViewDispatcher` bean and delegates the rendering task.

*   **Data Transformation (`...response.transform`)**: Transforms the processing result of an `Activity` (`ProcessResult`) into various output formats based on the `TransformResponse` abstract class.
    *   **Implementations**: `AponTransformResponse`, `JsonTransformResponse`, `XmlTransformResponse`, `TextTransformResponse`, etc.
    *   **Factory**: `TransformResponseFactory` creates the appropriate `TransformResponse` object according to the `TransformRule`.

*   **Web-specific Response Handling (`com.aspectran.web.activity.response`)**: Finely controls HTTP responses (status code, headers, data format) specialized for RESTful services through the `RestResponse` interface.

---

## 6. Settings and Configuration

### 6.1. Configuration Rule Architecture (`com.aspectran.core.context.rule`)
All configuration information (XML/APON) of an Aspectran application is converted into `Rule` objects by a parser and loaded into memory. These are pure data objects (POJOs) that act as the **Blueprint** of the application.

*   **Core Component Rules**: Define top-level components like `TransletRule`, `BeanRule`, `AspectRule`, `ScheduleRule`, and `TemplateRule`.
*   **Behavior and Response Rules**: Define the actual logic to be executed and the response method, such as `InvokeActionRule`, `TransformRule`, and `DispatchRule`.
*   **Data and Parameter Rules**: `ItemRule` is the basic unit for all parameters, attributes, and arguments.
*   **Ability Interfaces (`...rule.ability`)**: Interfaces like `HasActionRules` and `HasResponseRules` act as a **Contract** that specifies what kind of child rules each `Rule` class can have, creating a flexible and type-safe structure.

### 6.2. Configuration Loading Mechanism (`com.aspectran.utils.nodelet`)
Aspectran loads configuration files using its own lightweight parsing framework, **`nodelet`**.

*   **How it works**: It works on an event basis similar to a SAX parser, but it processes complex XML documents intuitively and structurally by directly mapping callbacks (`Nodelet`/`EndNodelet`) to specific XPath paths.
*   **`NodeletGroup`**: Manages XPaths and callbacks in groups and defines parsing rules declaratively through a Fluent API.
*   **Innovative `mount` feature**: When a specific element appears, it dynamically activates a pre-defined set of rules from another `NodeletGroup`, providing advantages such as **memory efficiency, rule reusability, and removal of nesting level limits**.
*   **State Management**: Manages the state for handling parent-child relationships during XML parsing in a thread-safe manner using `AspectranNodeParsingContext` and `ObjectStack`.

### 6.3. Environment Configuration (`com.aspectran.core.context.config`)
This package is a collection of data container (POJO) classes that define the various settings of an Aspectran application.

*   **Hierarchical/Modular Configuration**: `AspectranConfig` is the top-level configuration object, and it contains detailed configuration objects for each execution environment, such as `ContextConfig`, `WebConfig`, `DaemonConfig`, `ShellConfig`, and `EmbedConfig`, allowing you to configure only the necessary environment's settings.
*   **Main Feature Configuration**: The activation and detailed behavior of features such as environment profiles, auto-reloading, session management, and task scheduling are managed through the configuration classes here.

---

## 7. Advanced Features like AOP, Session, and ClassLoader

### 7.1. AOP Mechanism

Aspectran's AOP has its own unique model that is deeply integrated with the execution flow of its core execution model, the `Activity`, and Bean method calls.

*   **Weaving Mechanism: Intelligent Dynamic Proxy**: It uses a **runtime Dynamic Proxy** to apply AOP.
    *   **`AbstractBeanProxy`**: The base class for all AOP proxy objects. It first checks if a method has the `@Advisable` or `@Async` annotation when it is called, thereby **optimizing performance** by fundamentally eliminating the overhead of numerous internal method calls that do not require advice.
    *   **`ProxyActivity`**: A lightweight `Activity` solely for executing AOP advice. It enables flexible and stable context management in both synchronous and asynchronous environments through **independent mode** and **wrapping mode**. In particular, it shares the context through `ProxyActivity` when an `@Async` method is called.

### 7.2. Session Management (`com.aspectran.core.component.session`)

Aspectran Session Manager provides a **high-performance, environment-independent session management component** to maintain state consistently across various execution environments such as web, shell, and daemon.

*   **Core Architecture**: Composed of `SessionManager`, `Session`, `SessionCache` (memory cache), `SessionStore` (persistent storage), `HouseKeeper` (expired session cleanup), and `SessionIdGenerator`.
*   **Pluggable Session Store (`SessionStore`)**: You can choose to use `FileSessionStore` (file system) or `LettuceSessionStore` (Redis-based, **supports clustering**) depending on the configuration.
*   **Sophisticated Session Lifecycle Management**: To quickly remove unnecessary sessions created by bots or crawlers, it supports sophisticated timeout policies and automatic cleanup (`HouseKeeper`), such as applying a short timeout (`maxIdleSecondsForNew`) to "new sessions" without attributes.
*   **Operation Mode Comparison: Single Server vs. Cluster**
    *   **Single Server Mode (`clusterEnabled: false`)**: Aims for the best performance by trusting `SessionCache` (memory) as the primary source.
    *   **Cluster Mode (`clusterEnabled: true`)**: Ensures data consistency across multiple server nodes by trusting `SessionStore` (Redis) as the sole **Single Source of Truth**.
*   **Persistence Control**: You can use the `@NonPersistent` annotation to prevent objects that cannot be serialized or are security-sensitive from being stored in the session store.

### 7.3. Class Loading Mechanism (`SiblingClassLoader`)

Aspectran goes beyond Java's standard class loading mechanism by implementing its own `SiblingClassLoader` to support dynamic reloading (Hot Reloading) and a modular application structure.

*   **"Sibling-First" Delegation Model**: Unlike the standard "parent-first" model, when a class loading request is made, it first looks for the class in the resource paths managed by itself and its sibling `SiblingClassLoader`s, and delegates to the parent only as a last resort. This enables class sharing and dynamic replacement between modules.
*   **Key Features**:
    *   **Dynamic Hot Reloading**: You can reload application components or classes without a JVM restart through the `reload()` method.
    *   **Hierarchical Sibling Structure**: A structure composed of a `root` loader and several `siblings` allows for managing multiple resource locations as a single logical group.
    *   **Selective Class Exclusion**: Prevents class conflicts by avoiding duplicate loading of core JRE classes or shared libraries through `excludePackage()` and `excludeClass()`.

### 7.4. Logging Mechanism (`com.aspectran.logging`)

Aspectran uses **SLF4J** as its logging abstraction library and **Logback** as its default implementation.
*   **Core Feature (`LoggingGroupDiscriminator`)**: Identifies the logical "group" where a log occurs through a custom Logback `Discriminator`. The group name is determined by the priority of SLF4J MDC, `ActivityContext` name, etc.
*   **Dynamic Log Separation**: When used with `SiftingAppender`, in the case of a web application, it can dynamically separate and record logs into separate files (e.g., `jpetstore.log`, `petclinic.log`) based on the request URI through `PathBasedLoggingGroupHandlerWrapper`.

---

## 8. Conclusion

Aspectran's architecture is designed with **modularity, flexibility, extensibility, and performance** as its core values. Core components are organically combined around the `ActivityContext` to form a request processing pipeline, and environment abstraction through the Adapter pattern, efficient configuration loading through the `nodelet` engine, and an intelligent dynamic proxy-based AOP mechanism enable Aspectran to effectively respond to various application requirements.

Through this architectural blueprint, framework developers can gain a deep understanding of Aspectran's internal workings and contribute to developing new feature modules or extending and optimizing existing features as needed.

## 9. Reference Documents

This document was created by consolidating the following individual architecture documents. For more detailed information on each topic, please refer to the documents below.

*   [ActivityContext Build Process: An In-Depth Analysis](https://aspectran.com/en/docs/architecture/activity-context-building.md)
*   [ActivityContext: The Heart of Aspectran](https://aspectran.com/en/docs/architecture/activity-context.md)
*   [Environment: Controlling Environments with Profiles and Properties](https://aspectran.com/en/docs/architecture/activity-environment.md)
*   [Aspectran Actions: Concepts, Types, and Processing Results](https://aspectran.com/en/docs/architecture/aspectran-actions.md)
*   [Activity Architecture: The Execution Engine of Request Processing](https://aspectran.com/en/docs/architecture/aspectran-activities.md)
*   [Adapter Architecture: The Core of Environmental Independence](https://aspectran.com/en/docs/architecture/aspectran-adapters.md)
*   [In-Depth Analysis of Bean Scopes in Aspectran](https://aspectran.com/en/docs/architecture/aspectran-bean-scopes.md)
*   [SiblingClassLoader: The Key to Dynamic and Flexible Class Loading](https://aspectran.com/en/docs/architecture/aspectran-classloader.md)
*   [In-Depth Analysis of Aspectran Execution Environments](https://aspectran.com/en/docs/architecture/aspectran-execution-environments.md)
*   [Aspectran Configuration Loading Mechanism](https://aspectran.com/en/docs/architecture/aspectran-loading-mechanism.md)
*   [Aspectran Logging Mechanism](https://aspectran.com/en/docs/architecture/aspectran-logging-mechanism.md)
*   [Request and Response Handling Mechanism](https://aspectran.com/en/docs/architecture/aspectran-request-response.md)
*   [In-Depth Analysis of Aspectran Configuration Rule Architecture](https://aspectran.com/en/docs/architecture/aspectran-rule-architecture.md)
*   [In-Depth Analysis of Aspectran Service Architecture](https://aspectran.com/en/docs/architecture/aspectran-services.md)
*   [Aspectran Session Manager](https://aspectran.com/en/docs/architecture/aspectran-session-manager.md)
*   [Aspectran AOP Proxy Mechanism](https://aspectran.com/en/docs/architecture/new-aop-proxy-mechanism.md)