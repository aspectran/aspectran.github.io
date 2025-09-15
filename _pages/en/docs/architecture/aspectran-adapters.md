---
format: plate solid article
sidebar: toc-left
title: "Adapter Architecture: The Core of Environmental Independence"
subheadline: Architecture
parent_path: /docs
---
#

The comprehensive adoption of the **Adapter Pattern** is one of the most powerful architectural features of the Aspectran framework. Adapters are responsible for converting the specific implementation technologies of a runtime environment (web, console, daemon, etc.) to match Aspectran's standard interfaces. Through this, they provide **perfect environmental abstraction**, allowing the same business logic to run without modification in any environment.

## 1. Core Interfaces: `com.aspectran.core.adapter`

This package defines the **core contract** that all adapters must implement. Aspectran's `Activity` execution engine depends only on these abstract interfaces, so it does not need to know at all whether the actual execution environment is a servlet container, a console, or any other environment.

-   **`ApplicationAdapter`**: Abstracts the application's overall lifecycle and environment (base path, classloader, etc.). In a web environment, it serves to wrap the `ServletContext`.

-   **`SessionAdapter`**: Abstracts the user's session. It corresponds to `HttpSession` in a web environment but is generalized so that the concept of a session that can maintain state can be used in other environments as well.

-   **`RequestAdapter`**: Abstracts the request information from the outside. It provides a standardized way to access all data related to a request, such as request parameters, attributes, headers, and the request body.

-   **`ResponseAdapter`**: Abstracts the response to a request. It provides a `Writer` or `OutputStream` for outputting response data and includes functionality for setting the response's character encoding or content type.

-   **`Abstract*Adapter` (Template Classes)**: Abstract classes like `AbstractApplicationAdapter` and `AbstractRequestAdapter` apply the template method pattern. They serve as a skeleton with pre-implemented common functionalities to make it easier to create concrete adapters for each environment.

## 2. Concrete Adapter Implementations for Each Environment

When an `Activity` is executed, concrete adapters suitable for the current execution environment are created inside the `adapt()` method and connected to the `Activity`. The adapters for each environment are as follows.

### a. Web Environment Adapters

-   **`com.aspectran.web.adapter` (Standard Servlet-based)**
    -   `WebApplicationAdapter`: Wraps the `ServletContext` to provide overall information about the web application.
    -   `HttpSessionAdapter`: Implements session functionality by wrapping `HttpSession`.
    -   `HttpRequestAdapter`: Handles HTTP request information by wrapping `HttpServletRequest`.
    -   **Features**: This is the most common web adapter that operates in a standard servlet container environment like Tomcat or Jetty.

-   **`com.aspectran.undertow.adapter` (Native Undertow-based)**
    -   `UndertowApplicationAdapter`, `UndertowSessionAdapter`, etc.
    -   **Features**: Operates by directly wrapping the native objects (`HttpServerExchange`) of the high-performance web server Undertow, without going through the standard Servlet API. It can be expected to have higher performance as there is no overhead from Servlet API wrapping.

### b. Console (CLI) Environment Adapter (`com.aspectran.shell.adapter`)

-   `ShellApplicationAdapter`: Manages the execution environment of the shell application.
-   `ShellRequestAdapter`: Treats the command and arguments entered by the user in the terminal as 'request parameters'.
-   `ShellResponseAdapter`: Treats `System.out` or `System.err` as the 'response stream' to output the processing results to the console.
-   `ShellSessionAdapter`: Implements a memory-based session that stores state while the shell session is maintained.
-   **Features**: It perfectly maps the 'request/response' concept of the web to the 'command input/result output' of the console environment.

### c. Daemon and Embedded Environment Adapters

-   **`com.aspectran.daemon.adapter` / `com.aspectran.embed.adapter`**
    -   `DaemonRequestAdapter`, `EmbeddedRequestAdapter`, etc.
    -   **Features**: These environments do not have direct external requests. Instead, a programmatic call from a scheduler or internal logic (a `translate()` method call) is considered a 'request'. The `RequestAdapter` is responsible for holding the parameters and attributes passed at this time, and the `ResponseAdapter` is mainly used to capture the response result as a string using a `StringWriter`.
    -   In particular, `EmbeddedApplicationAdapter` is a pure Java implementation with no external environment dependencies, making it very useful for testing business logic without having to run a complex server.

## 3. Conclusion: The Power of the Adapter Architecture

Aspectran's Adapter architecture provides the following powerful advantages:

1.  **Perfect Environment Separation**: The business logic (Translet, Bean, etc.) does not need to know at all in which environment it is running; it only depends on the abstract interfaces of `com.aspectran.core.adapter`.

2.  **Highest Level of Code Reusability**: Code containing the same business logic can be reused in web applications, batch job CLIs, and background services without a single line of modification.

3.  **Testability**: Even for web logic, the correctness of the business logic can be tested quickly and simply using `EmbeddedAdapter` without having to run a web server.

4.  **Extensibility**: Even if a new execution environment (e.g., gRPC, WebSocket, Kafka, etc.) emerges, you can create a new type of application by simply implementing an adapter to handle the requests/responses of that environment, while still leveraging all existing Aspectran assets (AOP, DI, transactions, etc.).

As such, the Adapter structure can be said to be the core design philosophy that makes Aspectran not just a simple web framework, but a **Universal Application Framework** that can operate in any environment.
