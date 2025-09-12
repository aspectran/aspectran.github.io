---
format: plate solid article
sidebar: toc-left
title: In-Depth Analysis of Aspectran Service Architecture
headline:
teaser:
---

Aspectran's `Service` is a core container that manages the framework's lifecycle and acts as an entry point for a specific execution environment. The appropriate service implementation is used depending on the environment (web, shell, daemon, etc.) in which the application will run. This service architecture provides high flexibility and extensibility through a hierarchical and modular structure.

## 1. The Foundation of All Services: `CoreService`

Located in the `com.aspectran.core.service` package, `CoreService` is the top-level abstraction that forms the basis of all Aspectran services.

-   **Role**: `CoreService` implements the `ServiceLifeCycle` interface to manage the entire lifecycle of the service, including starting (`start`), stopping (`stop`), and restarting (`restart`). It also acts as a **standard Bootstrapper** that creates and initializes the `ActivityContext`, which contains all of Aspectran's settings and components (Bean, Translet, Aspect, etc.).
-   **Implementation**: `DefaultCoreService` is the standard implementation of `CoreService` and includes all the core logic for parsing configuration files and building the `ActivityContext` using `ActivityContextBuilder`.
-   **Relationship**: All environment-specific services to be described later are implemented by either directly inheriting from this `DefaultCoreService` or by containing it internally to extend its functionality. In other words, all services share the core mechanism of `CoreService` and have their lifecycle managed in a consistent manner.

## 2. Feature Extension Module: `SchedulerService`

`SchedulerService` is a good example of Aspectran's modular architecture. It is not an independent service, but a **Sub-service** that adds **scheduling functionality** to `CoreService`.

-   **Lifecycle Dependency**: It is dependent on the lifecycle of the parent service, `CoreService`, and starts and stops along with it. When `CoreService` starts, `SchedulerService` also starts to enable scheduling.
-   **Quartz Integration and Abstraction**: It reads the schedule rules (`ScheduleRule`) defined in the Aspectran configuration file and automatically creates and configures `Scheduler`, `JobDetail`, and `Trigger` objects from the well-known scheduling library **Quartz**. This allows developers to define scheduling in Aspectran's declarative way without having to deal with the complex Quartz API directly.
-   **Context Integration**: When a scheduled job is executed, a generic Quartz `Job` called `ActivityLauncherJob` is executed. This Job holds a reference to `CoreService` and then creates and executes an `Activity` to run the specified translet. Thanks to this, even within a scheduled job, you can utilize the full Aspectran context, including injecting all Beans registered in the application or applying AOP Aspects, just like in any other web request or shell command.

## 3. Environment-Specific Services

The core functionality of `CoreService` is provided through specialized service implementations tailored to various execution environments. These services all share the same `ActivityContext` but differ in how they receive and process requests, i.e., their **Entry Point** and **Operational Model**.

| Service | Execution Environment | Operational Model | Key Features and Entry Point |
| :--- | :--- | :--- | :--- |
| **`DaemonService`** | Standalone background process | **Proactive** | Initiates and repeatedly performs tasks without external requests. It executes internally defined Translets by programmatically calling the `translate()` method within a class that inherits from `DaemonService`. |
| **`ShellService`** | Interactive Command-Line (CLI) | **Interactive** | Reacts to user input from the terminal in real-time. Commands entered by the user are converted into `TransletCommandLine` objects, passed to the `translate()` method, and the corresponding Translet is executed. |
| **`EmbeddedAspectran`** | Embedded in another Java application | **Facade** | A facade class that wraps the complex lifecycle management logic of `CoreService` and provides simple and clear APIs like `run()`, `translate()`, and `getBean()`. It helps to easily integrate Aspectran's functionality into existing applications. |
| **`WebService`** | Standard Servlet Container (Tomcat, Jetty, etc.) | **Reactive** | Operates in response to external HTTP requests. The request processing cycle begins when the Front Controller servlet (`WebActivityServlet`) receives the client's `HttpServletRequest` and calls the `service()` method of `WebService`. |
| **`TowService`** | Embedded Undertow Server | **Servlet-less Web** | Unlike `WebService`, it does not go through the Servlet API and communicates directly with Undertow's native API (`HttpServerExchange`), aiming for higher performance with lower overhead. The `service()` method of `TowService` is called within the Undertow handler chain. |

## 4. Core Design Principles of the Architecture

This flexible structure is possible thanks to the following core design principles:

-   **Adapter Pattern**
    Request objects from different environments (e.g., `HttpServletRequest`, `HttpServerExchange`, `TransletCommandLine`) are wrapped by environment-specific **Adapters**. The `Activity` then reads request data and processes responses in a standardized, environment-agnostic way through these adapters. Thanks to this pattern, the core business logic defined in Translets can be perfectly reused without needing to know in which environment it is running.

-   **Configuration Consistency**
    Just as `WebService` (servlet-based) and `TowService` (Undertow-based) share the same web-related configuration information (`WebConfig`), the separation of core logic and configuration makes it very easy to switch services to different environments.

-   **Centralized Context**
    Regardless of the type of service used, all operations are performed through a single `ActivityContext`. This ensures consistent access to all application components (Beans, data sources, etc.) and features (AOP, etc.), even if the execution paths (web requests, scheduled tasks, shell commands) are different.

Thanks to this architecture, Aspectran can establish itself as a powerful and flexible framework capable of building a very wide spectrum of applications with the same core logic, from simple CLI tools to libraries embedded in other applications, background daemons, and high-performance web applications.
