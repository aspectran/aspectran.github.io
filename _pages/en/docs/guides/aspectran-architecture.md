---
title: Aspectran Architecture
teaser: Integrated Architecture Blueprint (Full-Text Blueprint)
subheadline: Architecture
---

{% include image.liquid src="/images/docs/architecture_en.svg" alt="Integration of Aspectran Architecture" %}

## 1. Introduction

### 1.1. Aspectran Framework Overview
Aspectran is a lightweight, high-performance application framework built on the JVM, meticulously engineered to span a wide spectrum of computing workloads—from simple command-line tools (CLI) to high-throughput asynchronous microservices and traditional enterprise web applications.

This document presents the overarching system architecture blueprint of Aspectran. Moving beyond isolated descriptions of individual components, it provides a holistic perspective on how the framework's layered components synergistically assemble to process requests, guarantee environmental independence, and establish an end-to-end execution model.

### 1.2. Core Design Philosophy and Principles
Aspectran's architecture is anchored in the following foundational design principles:

*   **POJO (Plain Old Java Object) Centric**: Ensures business logic remains uncontaminated by framework-specific interfaces. Developers implement business functionality as pure Java objects, while the framework composes them through declarative rules.
*   **IoC (Inversion of Control) and DI (Dependency Injection)**: The framework engine governs the instantiation, configuration, and lifecycle of objects, utilizing constructor, field, and method injection to minimize coupling and maximize unit testability.
*   **Seamless AOP (Aspect-Oriented Programming) Integration**: Cross-cutting concerns (security, transactions, logging, profiling, etc.) are physically decoupled from core business logic. Runtime dynamic proxies intelligently weave advice with minimal overhead.
*   **Complete Environment Abstraction**: Extensively adopts the Adapter pattern to isolate technological differences across diverse execution environments (servlet web, non-servlet network servers, console shells, background daemons). Business logic operates completely unaware of its underlying runtime.
*   **Micro-Modular Architecture and Diverse Runtimes**: Assembles only necessary capabilities (Servlet, Netty, Undertow, Jetty, session stores, etc.) as modular plug-ins on top of a minimal core, delivering an ultra-lightweight and fast runtime footprint.

### 1.3. Layered System Architecture Model
The entire Aspectran architecture is organized into five distinct logical layers with well-defined responsibilities:

1.  **Service & Server Runtimes Layer**: Acts as the entry point for external requests and manages the lifecycle of the host execution environment (Servlet, Netty, Undertow, Jetty, Shell, Daemon, Embed).
2.  **Environment Abstraction Layer (Adapters)**: Normalizes runtime-specific I/O constructs (`HttpServletRequest`, Netty channels, Undertow `HttpServerExchange`, console streams, etc.) into unified Aspectran standard interfaces.
3.  **Execution Engine Layer (Activities & Translets)**: Orchestrates the request processing flow, executes business actions and translet rules, and collects execution results.
4.  **Core Container Layer (Context & Rules)**: Centered around `ActivityContext`, this layer oversees bean lifecycles, AOP rules, translet blueprints, and system environment configurations.
5.  **Infrastructure & Utilities Layer**: The foundational utility suite supporting the entire framework, including `SiblingClassLoader` (dynamic reloading), `nodelet` (lightweight streaming parser), PBE encryption, and unified logging (SLF4J/Logback).

## 2. Service Architecture and Diverse Execution Environments

### 2.1. Foundation of the Service Container: `CoreService`

In Aspectran, a `Service` is the fundamental operational unit that governs the framework engine's lifecycle and serves as the container for a specific execution environment.

#### 2.1.1. Top-Level Abstraction: `CoreService` and `DefaultCoreService`
The `CoreService` interface in `com.aspectran.core.service` defines the top-level contract for all Aspectran services.

*   **Role**: Controls the entire lifecycle (`ServiceLifeCycle`), including starting (`start`), stopping (`stop`), pausing (`pause`), and resuming (`resume`). It acts as the standard bootstrapper responsible for instantiating and initializing `ActivityContext`—the central hub of all framework components.
*   **Standard Implementation**: `DefaultCoreService` loads configuration files (`AspectranConfig`), builds the context via `ActivityContextBuilder`, registers a singleton file lock (`FileLocker`) to prevent duplicate process instances, and hooks into JVM shutdown (`ShutdownHook`).
*   **Service Registry**: Every active service is safely registered in the global `CoreServiceHolder`, allowing context and service lookups from anywhere across the application.

#### 2.1.2. Feature Extension Module: `SchedulerService`
`SchedulerService` is a sub-service that operates subordinately to the lifecycle of its parent service (`CoreService`).

*   **Scheduling Abstraction**: Reads `ScheduleRule` definitions from the Aspectran configuration and drives a Quartz scheduler instance in the background.
*   **Execution Integration**: When a schedule interval triggers, the Quartz job `ActivityLauncherJob` executes `JobActivity`, a specialized activity dedicated to background scheduled tasks.
*   **Distributed Locking Support**: Integrates `ScheduledJobLockProvider` to enforce precise distributed execution locks, preventing duplicate task executions in multi-node clusters.

### 2.2. Analysis of Diverse Runtime Environments

Aspectran employs a granular, modular structure on top of a single core engine, allowing developers to flexibly select the ideal runtime matching infrastructure requirements.

#### 2.2.1. Modern Separation of Web Environments: `aspectran-web` vs `aspectran-web-servlet`
Aspectran's web architecture is cleanly bifurcated into a pure web abstraction module and a servlet specification binding layer:

*   **Pure Web Abstraction Layer (`aspectran-web`)**:
    *   A pure web module completely independent of servlet APIs (`jakarta.servlet.*`).
    *   Provides foundational infrastructure common to all web environments, including HTTP request parsing and parameter binding (`WebRequestBodyParser`, `RequestHeaderParser`), internationalization (`AcceptHeaderLocaleResolver`), standardized REST response encapsulation (`RestResponse`, `ResponsePayload`), and CORS processing (`DefaultCorsProcessor`).
*   **Standard Servlet Integration Layer (`aspectran-web-servlet`)**:
    *   Integrates Aspectran into standard Java Servlet/Jakarta Servlet container environments (Tomcat, Jetty, external WAS deployments).
    *   **Primary Entry Points**: Servlet lifecycle listener `WebServiceListener` and HTTP routing servlet `WebActivityServlet`.
    *   **Core Components**: `ServletWebService` (implemented by `DefaultServletWebService`), servlet request executor `ServletWebActivity`, and servlet request wrapper `ActivityRequestWrapper`.

#### 2.2.2. Servlet-Free High-Performance Network Engine: Netty Environment (`with-netty`)
A servlet-free runtime engineered for modern high-performance microservices and asynchronous event-driven networking.

*   **Purpose**: Eliminates servlet container overhead by connecting Aspectran's translet processing engine directly onto Netty's non-blocking I/O (NIO) pipeline, delivering minimal memory footprints and ultra-low latency. It is also optimized for Java Virtual Threads.
*   **Primary Entry Points and Components**:
    *   `NettyServer` (implemented by `DefaultNettyServer`): Bootstraps Netty's `ServerBootstrap` and channel pipelines.
    *   `NettyService` (implemented by `DefaultNettyService`): The specialized `CoreService` coordinating with the Netty server.
    *   `NettyActivity`: Dedicated `Activity` handling inbound Netty HTTP requests.

#### 2.2.3. Lightweight Embedded Web Server: Undertow (`with-undertow`)
An execution environment based on JBoss Undertow, a high-performance, lightweight web server.

*   **Purpose**: Delivers a high-throughput embedded web runtime allowing flexible composition of blocking and non-blocking handler chains.
*   **Key Components**:
    *   `TowService` (implemented by `DefaultTowService`): Service governing the Undertow runtime.
    *   `TowActivity`: Directly wraps Undertow's native `HttpServerExchange` to dispatch requests at maximum speed.

#### 2.2.4. Embedded Servlet Web Server: Jetty (`with-jetty`)
Embeds a standard servlet container directly into the application for familiar and lightweight operations.

*   **Purpose**: Bootstraps Eclipse Jetty as an embedded servlet engine, maintaining standard servlet compatibility within standalone (fat JAR) web deployments.
*   **Key Components**: Configures `ServletContextHandler` via `JettyServer` and mounts `WebServiceListener` for bootstrapping.

#### 2.2.5. Interactive Console (CLI) Environment: Shell (`aspectran-shell`)
An interactive command-line interface environment interacting with users via terminal consoles.

*   **Primary Entry Point**: `AspectranShell.main()`, which internally governs the console lifecycle via `DefaultShellCommander`.
*   **Key Components**:
    *   `ShellService` (implemented by `DefaultShellService`)
    *   `ShellActivity`: Maps command-line arguments and standard I/O streams to activity executions.
    *   `ShellConsole`: Abstraction layer managing JLine terminals and standard console I/O.

#### 2.2.6. Background Process Environment: Daemon (`aspectran-daemon`)
A headless background server process environment designed for continuous execution without a direct user interface.

*   **Primary Entry Points**: `DefaultDaemon`, `ProcrunDaemon` (for Windows Services), `JsvcDaemon` (for Linux/Unix Daemons).
*   **Key Components**:
    *   `DaemonService` (implemented by `DefaultDaemonService`)
    *   `DaemonActivity`
    *   `CommandExecutor`, `FileCommander`: Asynchronously receives external control commands via file watching or polling queues to trigger translets.

#### 2.2.7. Embedded Library Environment: Embed (`aspectran-embed`)
Embeds the Aspectran engine as an in-process library within existing Java applications or unit tests.

*   **Key Components**:
    *   `EmbeddedAspectran` (implemented by `DefaultEmbeddedAspectran`): A high-level facade API providing intuitive calls to `translate()`, `render()`, `execute()`, and `getBean()`.
    *   `AspectranActivity`: Specialized lightweight `Activity` designed for programmatic invocations.

> 🔍 **Related Detailed Mechanisms**\
> For deeper insights into service lifecycles, bootstrapping sequences, and runtime entry points, refer to [Aspectran Service Architecture In-Depth](/en/docs/mechanisms/aspectran-services/) and [Aspectran Execution Environments In-Depth](/en/docs/mechanisms/aspectran-execution-environments/).

## 3. Environment Abstraction: Adapter Architecture

One of the most distinctive strengths of Aspectran's architecture is its **thorough adoption of the Adapter pattern**. Adapters abstract the distinct I/O and session mechanisms of diverse runtimes, completely decoupling business logic (Translets and Beans) from physical execution platforms.

### 3.1. Core Contract Interfaces: `com.aspectran.core.adapter`
Aspectran's core execution engine depends strictly on the four foundational contract interfaces defined in `com.aspectran.core.adapter`:

*   `ApplicationAdapter`: Abstracts baseline environment properties such as the application's root path, classloader, and application-scoped attributes.
*   `RequestAdapter`: Normalizes external request data, providing standard access to parameters, headers, attributes, body input streams, and uploaded files.
*   `ResponseAdapter`: Abstracts response output, providing unified APIs for character streams (`Writer`), binary streams (`OutputStream`), encoding definitions, and response headers.
*   `SessionAdapter`: Generalizes user session state. It extends beyond web `HttpSession` to provide identical session abstractions across console shells and daemon processes.

### 3.2. Runtime Implementation Adapter Mapping
The table below illustrates how the four core contract interfaces are symmetrically implemented across each runtime environment:

| Execution Environment | Module & Package | RequestAdapter | ResponseAdapter | SessionAdapter |
| :--- | :--- | :--- | :--- | :--- |
| **Servlet Web** | `aspectran-web-servlet`<br>`com.aspectran.web.servlet.adapter` | `HttpServletRequestAdapter` | `HttpServletResponseAdapter` | `HttpSessionAdapter` |
| **Netty** | `with-netty`<br>`com.aspectran.netty.adapter` | `NettyRequestAdapter` | `NettyResponseAdapter` | `NettySessionAdapter` |
| **Undertow** | `with-undertow`<br>`com.aspectran.undertow.adapter` | `TowRequestAdapter` | `TowResponseAdapter` | `TowSessionAdapter` |
| **Shell (CLI)** | `aspectran-shell`<br>`com.aspectran.shell.adapter` | `ShellRequestAdapter` | `ShellResponseAdapter` | `ShellSessionAdapter` |
| **Daemon** | `aspectran-daemon`<br>`com.aspectran.daemon.adapter` | `DaemonRequestAdapter` | `DaemonResponseAdapter` | `DaemonSessionAdapter` |
| **Embedded** | `aspectran-embed`<br>`com.aspectran.embed.adapter` | `AspectranRequestAdapter` | `AspectranResponseAdapter` | `AspectranSessionAdapter` |
| **Scheduler** | `aspectran-core`<br>`com.aspectran.core.scheduler.adapter` | `QuartzJobRequestAdapter` | `QuartzJobResponseAdapter` | *(Stateless)* |

### 3.3. Core Values of the Adapter Architecture
1.  **Ultimate Business Code Reusability**: The exact same business actions and translet definitions run without altering a single line of code across servlet web servers, Netty asynchronous servers, CLI consoles, and background schedulers.
2.  **Isolated and Fast Testing**: Rapid, fully isolated unit tests can be executed in memory using `AspectranRequestAdapter` and `AspectranResponseAdapter` without launching external servlet containers or binding network sockets.
3.  **Frictionless Adaptation of New Runtimes**: When emerging protocols or transports arise (e.g., gRPC, RSocket), implementing the four core adapter contracts immediately integrates Aspectran's rich framework assets.

> 🔍 **Related Detailed Mechanisms**\
> For adapter lifecycles, the `adapt()` orchestration sequence, and environment-specific translation logic, refer to [Adapter Architecture: The Core of Environmental Independence](/en/docs/mechanisms/aspectran-adapters/).

## 4. Core Container and Rule Pipeline

### 4.1. IoC/DI Container: `ActivityContext`
`ActivityContext` serves as the **central hub** and core IoC container of an Aspectran application.

*   **Comprehensive Component Registries**:
    *   `BeanRegistry`: Manages dependency injection and lifecycles for singleton and prototype beans.
    *   `AspectRuleRegistry`: Stores AOP pointcut definitions and advice rules.
    *   `TransletRuleRegistry`: Maps request URL patterns to translet execution blueprints.
    *   `ScheduleRuleRegistry`, `TemplateRuleRegistry`: Manages task schedules and template rendering definitions.
*   **Build Pipeline (`HybridActivityContextBuilder`)**:
    1.  **Configuration**: Defines configuration paths, component scanning packages, and active profiles (`ActiveProfiles`).
    2.  **Declarative Parsing**: Employs `HybridActivityContextRuleParser` to parse XML/APON configurations into pure POJO `Rule` instances.
    3.  **Creation & Validation**: Instantiates `DefaultActivityContext` after verifying bean references (`BeanReferenceInspector`) and validating AOP rules (`AspectRuleValidator`).
    4.  **Initialization**: Instantiates and injects dependencies for all eager-init singleton beans, optionally activating file-watching hot reloads via `ContextReloadingTimer`.

### 4.2. Configuration Loading Engine: `nodelet` (`com.aspectran.utils.nodelet`)
To eliminate the memory and performance overheads of traditional DOM-based XML parsing, Aspectran implements a proprietary lightweight streaming parser called **`nodelet`**:

*   **XPath-Based Callback Mapping**: Avoids loading heavy DOM trees into memory by registering lambda callbacks (`Nodelet`) directly against specific XPaths on top of a SAX event stream, rapidly populating `Rule` objects.
*   **Dynamic `mount` Feature**: Dynamically connects and reuses sub-rule sets (`NodeletGroup`) when processing nested XML structures, minimizing parser allocations and supporting unlimited structural nesting.

### 4.3. Configuration Rule Architecture (`com.aspectran.core.context.rule`)
All application behavior blueprints are modeled as pure data objects (POJOs) known as `Rule` classes:

*   **Top-Level Entity Rules**: `TransletRule`, `BeanRule`, `AspectRule`, `ScheduleRule`, `TemplateRule`.
*   **Execution & Control Rules**: `InvokeActionRule`, `TransformRule`, `DispatchRule`.
*   **Ability Interfaces (`com.aspectran.core.context.rule.ability`)**: Contracts such as `HasActionRules` and `HasResponseRules` allow composite rules to be assembled in a type-safe manner.

> 🔍 **Related Detailed Mechanisms**\
> For detailed algorithms on the 4-stage build pipeline, refer to [ActivityContext Building Process: An In-Depth Analysis](/en/docs/mechanisms/activity-context-building/) and [ActivityContext: The Heart of Aspectran](/en/docs/mechanisms/activity-context/). For advanced streaming parsing, refer to [Aspectran Configuration Loading Mechanism](/en/docs/mechanisms/aspectran-loading-mechanism/) and [In-Depth Analysis of Aspectran Configuration Rule Architecture](/en/docs/mechanisms/aspectran-rule-architecture/).

## 5. Execution Engine and End-to-End Request Processing Pipeline

### 5.1. Activity Execution Model
The execution engine controls the entire lifecycle of a request from arrival to completion:

*   `Activity`: The central coordinator for a single request-response lifecycle. It leverages `ThreadLocal` storage to bind request state and adapters safely in multi-threaded environments.
*   `Translet`: Serves as the **communication medium and public API** between the internal processing engine and user business code, unifying request parameters, attributes, action outputs, and session access.
*   **Specialized Activity Variants**:
    *   `CoreActivity`: Standard activity executing the full translet rule pipeline.
    *   `InstantActivity`: Lightweight activity for executing programmatic Aspectran context tasks directly within business code.
    *   `JobActivity`: Activity dedicated to scheduled background tasks.
    *   `ProxyActivity`: Lightweight activity tailored for executing AOP advice.

### 5.2. Action Pipeline and Result Aggregation
Processing steps inside a translet are executed as a sequence of actions implementing the `Executable` interface:

*   **Diverse Built-in Actions**:
    *   `InvokeAction`: Invokes registered bean methods via reflection or proxies.
    *   `MethodAction`: Executes declared methods with automatic argument binding.
    *   `IncludeAction`: Includes and executes other translets as subroutines.
    *   `EchoAction`, `HeaderAction`, `ChooseAction`, etc.
*   **Hierarchical Result Collection Structure (`com.aspectran.core.activity.process.result`)**:
    *   `ActionResult`: Encapsulates the return value of an individual action.
    *   `ContentResult`: Aggregates results of an action group (`<contents>`).
    *   `ProcessResult`: Top-level container holding all execution outputs of an activity, serving as the direct data source for view rendering and REST serializers.

### 5.3. Response Handling and View Strategies
The `com.aspectran.core.activity.response` package provides flexible output strategies:

*   **View Dispatching (`DispatchResponse`)**: Delegates data to view template engines (JSP, Thymeleaf, FreeMarker, Pebble, etc.) via the `ViewDispatcher` interface to render HTML.
*   **Data Transformation (`TransformResponse`)**: Automatically serializes `ProcessResult` data into standard formats:
    *   `JsonTransformResponse`: High-performance JSON serialization.
    *   `AponTransformResponse`: Serialization into Aspectran's proprietary APON format.
    *   `XmlTransformResponse`, `TextTransformResponse`, etc.
*   **REST-Specific Responses (`RestResponse`)**: Finely controls HTTP status codes, headers, and payloads (`ResponsePayload`) tailored for RESTful architectures.

### 5.4. End-to-End Request Processing Flow
The chronological sequence of component interactions from external request arrival to response transmission unfolds as follows:

1.  **Request Arrival**: A client request arrives at the host environment (`WebActivityServlet` in a servlet container, Netty channel handler, Undertow handler, or shell console).
2.  **Adapter Wrapping**: Instantiates standard `RequestAdapter`, `ResponseAdapter`, and `SessionAdapter` instances wrapping runtime-specific I/O constructs.
3.  **Activity Instantiation**: The host service instantiates an `Activity` for the request, injects the adapters, and binds the activity to the active thread (`ThreadLocal`).
4.  **Translet Rule Matching**: Locates the matching `TransletRule` from `TransletRuleRegistry` based on the request URI and HTTP method.
5.  **AOP Before Advice Execution**: If Before advice is declared for the translet, the proxy engine executes it prior to business actions.
6.  **Action Chain Dispatching**: Sequentially executes configured actions according to the `ActionList`, accumulating return values into `ProcessResult`.
7.  **Response Generation**: Executes `DispatchResponse` (view rendering) or `TransformResponse` (JSON/XML serialization) to write data directly into the `ResponseAdapter` output stream.
8.  **AOP After/Finally Advice and Teardown**: Executes After and Finally advice, commits or rolls back transactions, updates sessions, clears `ThreadLocal` context, and cleans up logging group bindings.

> 🔍 **Related Detailed Mechanisms**\
> For state machine transitions and translet pipeline internals, refer to [Activity Architecture: The Execution Engine of Request Processing](/en/docs/mechanisms/aspectran-activities/), [Aspectran Actions: Concepts, Types, and Processing Results](/en/docs/mechanisms/aspectran-actions/), and [Request and Response Handling Mechanisms](/en/docs/mechanisms/aspectran-request-response/).

## 6. Advanced System Services

### 6.1. High-Performance Dynamic AOP Proxy Mechanism
Aspectran's AOP employs an intelligent proxy architecture that fundamentally eliminates unnecessary overhead:

*   `AbstractBeanProxy`: Foundation class built on Javassist or standard JDK dynamic proxies.
*   **Annotation-Based Targeting Optimization**: Inspects pointcut registries only for methods annotated with `@Advisable` or `@Async`, ensuring regular internal method calls experience zero performance degradation.
*   `ProxyActivity`: Lightweight executor that propagates contexts thread-safely when executing independent advice or `@Async` thread pool tasks.

### 6.2. Environment-Independent Session Manager (`com.aspectran.core.component.session`)
A high-performance distributed session engine maintaining state across Servlet, Netty, Undertow, and Shell environments without servlet dependencies:

*   **Core Components**: `SessionManager` (lifecycle management), `SessionCache` (in-memory caching), `SessionStore` (persistence), and `HouseKeeper` (automated eviction of expired sessions).
*   **Redis-Based Clustering**: Fully supports non-disruptive clustered session synchronization via `LettuceSessionStore`.
*   **Granular Persistence Control**: Selectively prevents sensitive or non-serializable objects from being persisted using the `NonPersistent` marker interface, `NonPersistentValue` wrappers, or `nonPersistentAttributes` configuration.

### 6.3. Dynamic Hot-Reloading ClassLoader: `SiblingClassLoader`
A proprietary classloader architecture enabling immediate hot-reloading of classes and resources without restarting the JVM:

*   **Sibling-First Delegation Model**: Unlike Java's standard parent-first model, `SiblingClassLoader` searches resource paths managed by itself and its sibling loaders first before delegating to parent loaders.
*   **Module Isolation and Hot Reloading**: When a specific module or resource updates, its corresponding `SiblingClassLoader` is selectively discarded and recreated (`reload()`), achieving seamless zero-downtime hot reloads.

### 6.4. Multi-Engine Logging Group Architecture
Integrated with SLF4J and Logback, Aspectran provides an advanced logging architecture that dynamically routes and isolates log files based on request URI paths or service groups:

*   `LoggingGroupDiscriminator`: Coordinates with Logback's `SiftingAppender` to dynamically resolve logging group identifiers configured in SLF4J MDC and context environments.
*   **Unified Path-Based Handlers Across Multi-Engines**:
    *   **Netty Environment**: `com.aspectran.netty.server.handler.logging.PathBasedLoggingGroupHandler`
    *   **Jetty Environment**: `com.aspectran.jetty.server.handler.PathBasedLoggingGroupHandler`
    *   **Undertow Environment**: `com.aspectran.undertow.server.handler.logging.PathBasedLoggingGroupHandlerWrapper` (and `PathBasedLoggingGroupHandler`)
*   **Architectural Benefits**: Enables physical separation of log files for distinct applications or API path groups (e.g., `/petclinic/**`, `/jpetstore/**`) running within a single server instance.

> 🔍 **Related Detailed Mechanisms**\
> For AOP proxy creation, refer to [Aspectran AOP Proxy Mechanism](/en/docs/mechanisms/new-aop-proxy-mechanism/). For dynamic class loading and hot reloading, refer to [SiblingClassLoader In-Depth Analysis](/en/docs/mechanisms/aspectran-classloader/) and [Aspectran Automatic Reloading Mechanism In-Depth](/en/docs/mechanisms/aspectran-reloading-mechanism/). For multi-environment logging segregation, refer to [Aspectran Logging Mechanism](/en/docs/mechanisms/aspectran-logging-mechanism/).

## 7. Conclusion

Aspectran's architecture firmly rests upon three foundational pillars: **Simplicity, Environment Independence, and High Performance**.

*   By decoupling layers around `CoreService` and `ActivityContext`, complex enterprise capabilities are governed through consistent, predictable patterns.
*   Through the `Adapter` pattern, business logic is completely isolated from physical execution platforms, achieving unmatched portability: identical source code executes flawlessly across Servlet containers, Netty asynchronous servers, Undertow, Jetty, console shells, and background daemons.
*   With the clear separation of `aspectran-web` and `aspectran-web-servlet`, the native integration of non-servlet Netty runtimes, and multi-engine logging groups, Aspectran continues to evolve as a robust, agile framework capable of mastering both traditional enterprise architectures and cutting-edge asynchronous microservices.

## 8. Next Steps: Exploring Detailed Mechanisms and Package Specifications

This blueprint document provided a top-level architectural overview and highlighted how framework components synergize. For source-code level implementation algorithms, deep mechanism specifications, and granular package details, explore the official documentation index:

*   **[Aspectran Detailed Mechanisms and Package Specifications Index](/en/docs/mechanisms/)**: Offers in-depth analyses covering the execution engine, build pipelines, classloaders, AOP proxies, and technical specifications across core, daemon, shell, embed, session, and web packages.
*   **[Aspectran User Guide](/en/docs/guides/aspectran-user-guide/)**: A practical guide for configuring and building real-world enterprise applications with Aspectran.
