---
title: "Deep Dive into Aspectran Execution Environments"
subheadline: Mechanisms
---

## 1. Architectural Overview: Multi-Runtime Philosophy

Aspectran adopts a fine-grained modular architecture built upon a single core engine (`CoreService`, `ActivityContext`, `Activity`), enabling the exact same business logic to operate seamlessly across diverse runtime environments—from long-running background processes and interactive command-line tools to embedded libraries, high-performance asynchronous network servers, and traditional enterprise web applications.

Core business logic (Translets and Beans) remains completely agnostic of the execution environment. The physical idiosyncrasies of each environment are gracefully encapsulated by **environment-specific service implementations**, **dedicated Activity variants**, and the **Adapter layer**.

Aspectran classifies its supported runtimes into six major execution environments:

1.  **Servlet-Free High-Performance Network Engine (Netty)**: An ultra-fast, servlet-free network web runtime based on asynchronous non-blocking I/O.
2.  **Lightweight Embedded Web Server Environment (Undertow)**: A high-performance hybrid embedded web runtime powered by JBoss Undertow.
3.  **Embedded and Standard Servlet Environment (Jetty & Jakarta Servlet)**: Standard servlet container deployments and embedded Jetty web runtimes.
4.  **Interactive Console Shell Environment (Shell)**: A CLI environment interactively communicating with users in the terminal.
5.  **Background Process Environment (Daemon)**: A background server environment operating long-term without user interfaces or web ports.
6.  **Application-Embedded and Testing Environment (Embed)**: A facade environment embedding the engine inside existing Java applications or unit tests.

## 2. Servlet-Free High-Performance Network Engine: Netty Environment (`with-netty`)

### 2.1. Purpose and Design Philosophy
Modern microservice and cloud-native environments demand high-performance runtimes that eliminate the thread model overhead of the servlet specification to achieve ultra-low latency and minimal memory footprint.

Aspectran's Netty module (`with-netty`) directly couples Aspectran's Translet execution engine onto Netty's high-performance non-blocking I/O (NIO) event loop pipeline, delivering a servlet-free execution environment capable of serving hundreds of thousands of HTTP requests per second with ease. In particular, it is optimized for integration with Java Virtual Threads.

### 2.2. Main Entry Points
*   `com.aspectran.netty.server.NettyServer` (implemented by `DefaultNettyServer`): Configures Netty's `ServerBootstrap`, instantiating Boss and Worker `EventLoopGroup` thread pools and bootstrapping channel pipelines.
*   `com.aspectran.netty.service.DefaultNettyServiceBuilder`: Parses Netty server configuration rules (`NettyConfig`) to build and initialize `NettyService`.

### 2.3. Key Components
*   `NettyService` (implemented by `DefaultNettyService`): A specialized service binding the Netty server lifecycle to Aspectran's `CoreService` hierarchy.
*   `NettyActivity`: A dedicated `Activity` that receives `FullHttpRequest` payloads from Netty inbound channel handlers and drives request processing.
*   `NettyRequestAdapter`, `NettyResponseAdapter`, `NettySessionAdapter`: Maps Netty byte buffer (`ByteBuf`) streams and channel contexts into Aspectran's four core adapters.
*   `PathBasedLoggingGroupHandler`: An inbound Netty pipeline handler that dynamically switches logging groups based on request URI path prefixes.

### 2.4. Operating Model: Asynchronous Event-Driven Non-Blocking (NIO Event-Driven)
When a request arrives on a Netty channel, Netty I/O threads decode the HTTP request through the pipeline, a `NettyActivity` is immediately instantiated to execute business logic, and the response buffer is asynchronously flushed to the channel.

## 3. Lightweight Embedded Web Server Environment: Undertow (`with-undertow`)

### 3.1. Purpose and Design Philosophy
An embedded environment powered by Red Hat's JBoss Undertow web server, providing an extremely lightweight footprint and exceptional concurrency handling. It aims for servlet-less, high-performance web deployment by directly processing Undertow's native objects without passing through the Servlet API.

### 3.2. Main Entry Points
*   Programmatically configures the Undertow server via `DefaultTowServiceBuilder`, binding and starting Aspectran's `TowService` as the root handler of the Undertow handler chain.

### 3.3. Key Components
*   `TowService` (implemented by `DefaultTowService`): A `CoreService` implementation governing the Undertow web server runtime.
*   `TowActivity`: A high-speed `Activity` directly wrapping Undertow's central native exchange object, `io.undertow.server.HttpServerExchange`.
*   `TowRequestAdapter`, `TowResponseAdapter`, `TowSessionAdapter`: Maps Undertow's native I/O channels and session managers into Aspectran standard adapters.
*   `PathBasedLoggingGroupHandlerWrapper` and `PathBasedLoggingGroupHandler`: Manages path-based log group separation according to request paths.

### 3.4. Operating Model: Hybrid Blocking/Non-Blocking Handler Chain
Through Undertow's `HttpServerExchange`, static resources are served rapidly via non-blocking I/O, while complex business translets are safely dispatched and executed in worker thread pools.

## 4. Servlet-Based Web Environments (`aspectran-web-servlet` and `with-jetty`)

Aspectran's servlet architecture is cleanly organized into pure web abstractions (`aspectran-web`) and a Jakarta Servlet standard specification integration layer (`aspectran-web-servlet`).

### 4.1. Standard Servlet Container Environment (`aspectran-web-servlet`)
*   **Purpose**: Runs Aspectran applications inside traditional Java servlet containers (Tomcat, Jetty, WildFly, etc.) and external WAR deployment environments.
*   **Main Entry Points**:
    *   `WebServiceListener`: Implements `jakarta.servlet.ServletContextListener` to create and start the root `ServletWebService` when the servlet context initializes.
    *   `WebActivityServlet`: A standard front controller servlet intercepting all incoming HTTP requests and routing them into Aspectran's translet execution pipeline.
*   **Key Components**:
    *   `ServletWebService` (implemented by `DefaultServletWebService`): The specialized service governing servlet container environments.
    *   `ServletWebActivity`: An `Activity` wrapping `HttpServletRequest` and `HttpServletResponse` to coordinate the execution pipeline.
    *   `ActivityRequestWrapper`: A wrapper that wraps servlet requests to guarantee repeatability of parameters and body payload streams.
    *   `HttpServletRequestAdapter`, `HttpServletResponseAdapter`, `HttpSessionAdapter`: Maps standard servlet objects directly into the four core adapters.
*   **Operating Model: Servlet-Based Reactive**
    Responds to incoming client HTTP requests within servlet thread pools, fully supporting both synchronous and asynchronous servlet processing.

### 4.2. Embedded Servlet Environment: Jetty (`with-jetty`)
*   **Purpose**: Embeds Eclipse Jetty, a lightweight servlet container, directly into the application, allowing developers to operate standalone (Fat JAR) web services while fully enjoying servlet standard compatibility.
*   **Key Components**: Programmatically configures `ServletContextHandler` through `com.aspectran.jetty.server.JettyServer`, registering `WebServiceListener` and `WebActivityServlet` to bootstrap the embedded container. Path-based logging group separation is also supported via Jetty-specific `PathBasedLoggingGroupHandler`.

## 5. Interactive Console Shell Environment (`aspectran-shell`)

### 5.1. Purpose and Features
An interactive Command-Line Interface (CLI) environment communicating with users via terminal consoles. System administrators and developers can execute translets registered in the application directly as commands from the terminal and inspect real-time runtime status.

### 5.2. Main Entry Points
*   The `main(String[] args)` method of the `com.aspectran.shell.AspectranShell` class.
*   Detects configuration file paths from command-line arguments and instantiates `DefaultShellCommander` to execute the interactive loop (REPL).

### 5.3. Key Components
*   `ShellService` (implemented by `DefaultShellService`): A `CoreService` governing shell lifecycles and console sessions.
*   `ShellActivity`: An `Activity` mapping console input arguments (`TransletCommandLine`) to request parameters and controlling standard output as the response.
*   `ShellConsole` (implemented by `DefaultShellConsole`): Abstracts command history, tab auto-completion, ANSI color styling (`ConsoleStyler`), and password-masked inputs based on the JLine3 library.
*   `ShellCommandRegistry`: Registers and executes built-in administrative commands (`help`, `sysinfo`, `restart`, `verbose`, `clear`, `job`, `translet`, etc.).

### 5.4. Operating Model: Interactive REPL (Interactive)
Reacts in real time to user prompt inputs and supports `ShellSessionAdapter` memory-based sessions to maintain user state across multiple command executions.

## 6. Background Process Environment: Daemon (`aspectran-daemon`)

### 6.1. Purpose and Features
A long-running process environment operating permanently in the server background without direct user UIs or HTTP web sockets. It is optimized for large-scale batch tasks, automatic processing of scheduled translets, and internal message queue polling.

### 6.2. Diverse Bootstrap Entry Points
Aspectran Daemon provides purpose-built bootstrappers tailored to service registration requirements across diverse operating system environments:

*   `DefaultDaemon`: Standard daemon entry point executable directly from terminal shells.
*   `ProcrunDaemon`: Entry point used when registered as a Windows service (Apache Commons Daemon Procrun) and running as a Windows OS background service.
*   `JsvcDaemon`: Entry point for Linux/Unix environments integrated with the `jsvc` daemon utility, binding ports with root privileges before safely dropping privileges to an unprivileged account.
*   `SimpleDaemon`: A streamlined entry point for quickly launching daemons with minimal configuration.

### 6.3. Key Components
*   `DaemonService` (implemented by `DefaultDaemonService`): A `CoreService` controlling programmatic `translate()` calls and background polling operations.
*   `DaemonActivity`: An `Activity` dedicated to daemon environments.
*   `FileCommander`: An intelligent remote control component that polls watched directories in real time for incoming command files, analyzes file contents, and executes corresponding translets asynchronously.
*   `CommandExecutor` and `DaemonCommandRegistry`: Handles internal daemon component state control and task restart commands.

### 6.4. Operating Model: Proactive Background (Proactive Background)
Rather than passively waiting for external requests, it proactively initiates tasks through schedulers or file pollers. JVM shutdown hooks (`ShutdownHook`) guarantee safe resource release even in the event of unexpected termination.

## 7. Application-Embedded Environment: Embed (`aspectran-embed`)

### 7.1. Purpose and Features
An environment embedding the entire Aspectran framework as a library within existing Java applications (Spring, Quarkus, desktop GUIs, batch scripts, etc.) without launching a separate server process. It is ideal when developers selectively adopt Aspectran's rich bean container, template engine, and rule-based execution pipelines.

### 7.2. Main Entry Points
*   Static factory method `run()` of the `com.aspectran.embed.service.EmbeddedAspectran` interface: Loads configuration files and bootstraps the embedded instance in a single line of code.

### 7.3. Key Components
*   `EmbeddedAspectran`: A high-level facade interface over `CoreService`.
    *   `translate(transletName, ...)`: Directly executes translets and returns results.
    *   `render(templateName, ...)`: Obtains rendered template result strings.
    *   `getBean(beanId)`: Looks up registered bean instances within the context.
    *   `getMessage(code)`: Queries internationalized messages.
*   `DefaultEmbeddedAspectran`: Standard implementation of `EmbeddedAspectran`, managing `DefaultCoreService` internally via composition.
*   `AspectranActivity`: An in-memory dedicated `Activity` for programmatic invocations.

### 7.4. Operating Model: Facade-Based In-Memory Execution (In-Memory Facade)
Executes translets and beans directly on the JVM heap without network sockets or file I/O, enabling thorough unit testing of business logic without complex infrastructure setup.

## 8. Runtime Characteristics Comparison and Selection Guide

| Execution Environment | Core Module | Main Entry Points | Communication Model | Recommended Use Cases |
| :--- | :--- | :--- | :--- | :--- |
| **Netty** | `with-netty` | `NettyServer`<br>`DefaultNettyService` | Asynchronous Non-Blocking (NIO Event Loop) | Ultra-low latency microservices, servlet-free high-performance API gateways |
| **Undertow** | `with-undertow` | `DefaultTowServiceBuilder` | Hybrid Blocking/Non-Blocking | Lightweight high-performance embedded web servers, standalone microservices |
| **Servlet Web** | `aspectran-web-servlet` | `WebServiceListener`<br>`WebActivityServlet` | Servlet-Based Reactive | Standard WAS (Tomcat, etc.) deployments, enterprise legacy web compatibility |
| **Jetty** | `with-jetty` | `JettyServer` | Embedded Servlet-Based | Servlet specification-compliant standalone (Fat JAR) web applications |
| **Shell (CLI)** | `aspectran-shell` | `AspectranShell` | Interactive Console (REPL) | System administration console tools, interactive batch runners, terminal tools |
| **Daemon** | `aspectran-daemon` | `DefaultDaemon`<br>`ProcrunDaemon`<br>`JsvcDaemon` | Proactive Background (File/Schedule Polling) | Long-running background daemons, file-based remote control, OS services |
| **Embed** | `aspectran-embed` | `EmbeddedAspectran.run()` | In-Memory Facade Invocations | Library integration inside existing apps, unit testing simulation |

## 9. Conclusion

Aspectran's execution environment architecture proves **"the complete decoupling of core business logic from physical runtime environments."**

On the solid common foundation of `CoreService` and `CoreActivity`, by precisely combining adapters and dedicated activities that maximize the technical advantages of each environment, developers can author business logic once and deploy it anywhere—high-performance Netty servers, embedded Undertow, traditional servlet WAS, console CLI shells, background daemons, etc.—without changing a single line of code, enjoying true environment independence.
