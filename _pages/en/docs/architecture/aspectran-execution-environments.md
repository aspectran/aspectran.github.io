---
format: plate solid article
sidebar: toc-left
title: In-Depth Analysis of Aspectran Execution Environments
subheadline: Architecture
parent_path: /docs
---

Based on its core concepts of `CoreService` and `Activity`, Aspectran provides specialized modules that support various execution environments. This modularity allows developers to deploy Aspectran applications in a manner that best suits their specific use case, whether it be a long-running background process, an interactive command-line tool, an embedded library, or a high-performance web application.

Here is a detailed analysis of each environment:

## 1. Daemon Environment (`com.aspectran.daemon`)

-   **Purpose**: To run an Aspectran application as a long-running background process without a direct user interface. Ideal for batch processing, scheduled tasks, and inter-service communication.
-   **Main Entry Point**: Bootstrapped through the `main` method of the `com.aspectran.daemon.DefaultDaemon` class. This class is responsible for loading the Aspectran configuration and starting the `DaemonService`.
-   **Core Components**:
    -   `DaemonService`: A `CoreService` implementation specialized for the daemon environment, providing the ability to execute translets internally through programmatic `translate()` calls.
    -   `DaemonActivity`: An `Activity` implementation for handling the `translate()` calls of the `DaemonService`. It uses `DaemonRequestAdapter` and `DaemonResponseAdapter` to handle I/O.
    -   `FileCommander`: Provides advanced functionality to process file-based commands by periodically polling a specific directory.
-   **Operational Model**: **Proactive**. Instead of waiting for external requests, it initiates tasks on its own or operates according to an internal schedule. It ensures safe lifecycle management through a JVM Shutdown Hook and can activate session functionality for stateful background tasks.

## 2. Embedded Environment (`com.aspectran.embed`)

-   **Purpose**: To integrate Aspectran's powerful features as a library or component within an existing Java application (standalone, desktop, other web frameworks, etc.). It provides a facade that hides Aspectran's internal complexity and allows interaction through a simple API.
-   **Main Entry Point**: Can be started very easily through the static `run()` factory method of the `com.aspectran.embed.service.EmbeddedAspectran` interface.
-   **Core Components**:
    -   `EmbeddedAspectran`: A high-level facade interface for `CoreService`, providing frequently used methods in an embedding environment such as `translate()`, `render()`, `execute()`, and `getBean()`.
    -   `DefaultEmbeddedAspectran`: The concrete implementation of `EmbeddedAspectran`, which internally inherits from and manages `DefaultCoreService`.
    -   `AspectranActivity`: An `Activity` implementation for the embedded context, which adapts programmatic calls to Aspectran's processing pipeline.
-   **Operational Model**: **Facade**. It simplifies complex lifecycle management and provides a use-case-oriented, intuitive API, making it easy to integrate Aspectran's functionality into any Java application.

## 3. Shell Environment (`com.aspectran.shell`)

-   **Purpose**: To provide an interactive command-line interface (CLI) for an Aspectran application. It allows users to execute commands (translets) directly from a terminal and interact with the application.
-   **Main Entry Point**: Starts the interactive shell through the `main` method of the `com.aspectran.shell.AspectranShell` class.
-   **Core Components**:
    -   `ShellService`: A `CoreService` implementation specialized for the shell environment, providing access to the `ShellConsole` and command execution via the `translate(TransletCommandLine)` method.
    -   `ShellActivity`: An `Activity` implementation tailored for console I/O, handling features like procedural prompts and output redirection.
    -   `ShellConsole`: Abstracts console interaction (reading input, color output, tab completion, etc.) based on libraries like JLine and Jansi.
-   **Operational Model**: **Interactive**. It reacts to user input in real-time and provides user-friendly features such as a welcome message, help, and verbose mode. It can use session functionality to maintain state between command executions.

## 4. Web Environments (`com.aspectran.web` and `com.aspectran.undertow`)

Aspectran supports web environments through two main modules.

### 4.1. Generic Servlet Environment (`com.aspectran.web`)

-   **Purpose**: To run an Aspectran application within any standard Java Servlet container (e.g., Tomcat, Jetty, WildFly).
-   **Main Entry Point**: The `com.aspectran.web.servlet.listener.WebServiceListener` registered in `web.xml` initializes the `WebService`, and `com.aspectran.web.servlet.WebActivityServlet` acts as a Front Controller, receiving all HTTP requests and delegating them to the `WebService`.
-   **Core Components**:
    -   `WebService`: A `CoreService` specialized for the web environment, with the `service(HttpServletRequest, HttpServletResponse)` method as its core entry point.
    -   `WebActivity`: An `Activity` implementation that wraps `HttpServletRequest` and `HttpServletResponse` to adapt them to Aspectran's processing pipeline.
-   **Operational Model**: **Reactive**. It operates in response to external HTTP requests and supports all web features based on the Servlet API (sessions, encoding, multipart, asynchronous processing).

### 4.2. Undertow Environment (`com.aspectran.undertow`)

-   **Purpose**: To run an Aspectran application directly on top of Undertow, a high-performance embedded web server. This is a servlet-less alternative that enables a more lightweight and potentially faster deployment.
-   **Main Entry Point**: The developer programmatically starts by building an Undertow server and linking Aspectran's `TowService` to the chain as an `HttpHandler`.
-   **Core Components**:
    *   `TowService`: A `CoreService` specialized for Undertow, providing a `service(HttpServerExchange)` method that handles the native `HttpServerExchange` object directly, without going through the Servlet API.
    *   `TowActivity`: An `Activity` implementation that wraps `HttpServerExchange`.
-   **Operational Model**: **Servlet-less Web**. It aims for high performance by interacting directly with Undertow's native API without the overhead of the Servlet API. Ideal for building lightweight microservices.

## 5. Conclusion

Aspectran's execution environment architecture demonstrates the core philosophy of **separating core logic from the runtime environment**. It has a reusable core logic of `CoreService` and `CoreActivity`, and the specifics of each environment are absorbed through `Adapter`s and environment-specific service/activity implementations. This approach ensures the perfect portability of core business logic while allowing for the maximum utilization of the specific features and performance characteristics of each environment.
