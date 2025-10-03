---
title: "Activity Architecture: The Execution Engine of Request Processing"
subheadline: Architecture
---

Aspectran's **Activity Architecture** is the core of the framework's request processing model. It has a hierarchical and modular structure designed to handle requests in a consistent manner across various execution environments (web, shell, daemon, etc.).

## 1. Core Foundation: `com.aspectran.core.activity`

This package is the **execution engine** of Aspectran itself. It defines the fundamental concepts and processing pipeline necessary to handle all kinds of requests.

-   **`Activity` (Interface)**: The central execution object for a single request-response lifecycle. It is a runtime engine that accesses the `ActivityContext`, abstracts the environment through adapters, and is responsible for exception handling and flow control.

-   **`Translet` (Interface)**: A **medium for communication between the `Activity` and user code**. It encapsulates the rules (`TransletRule`) and data (`ActivityData`) for a single request and serves as the main API for business logic to interact with the execution state.

-   **`CoreActivity` (Abstract Class)**: An abstract class that implements the core logic of an `Activity`. It orchestrates the entire pipeline that processes a request according to the rules defined in a `Translet`. This pipeline proceeds in the following order:
    1.  **`prepare`**: Finds the `TransletRule` corresponding to the request and creates a `Translet` instance.
    2.  **`adapt`**: Creates and connects `RequestAdapter`, `ResponseAdapter`, etc., suitable for the current execution environment.
    3.  **`parseRequest`**: Parses request parameters, attributes, path variables, etc., and stores them in `ActivityData`.
    4.  **`perform`**:
        -   Execute `BEFORE` advice
        -   Execute `Action`s in the `Content` section
        -   Process `Response` (Forward, Redirect, Transform, Dispatch, etc.)
        -   Execute `AFTER` advice
        -   Execute `THROWN` advice if an exception occurs
        -   Execute `FINALLY` advice
    5.  **`finish`**: Finalizes the response and cleans up resources.

-   **`InstantActivity`**: A lightweight `Activity` variant that allows programmatic execution of specific tasks using Aspectran's context (bean lookup, AOP application, etc.) from user code.

## 2. Environment-Specific Activities

The powerful pipeline of `CoreActivity` is inherited and extended by concrete `Activity` classes that reflect the characteristics of each execution environment. They all reuse the same core processing logic while providing an **Adaptation Layer** to handle the unique input/output methods of each environment.

| Package | Activity Class | Execution Environment | Key Features and Roles |
| :--- | :--- | :--- | :--- |
| `com.aspectran.daemon.activity` | `DaemonActivity` | Standalone background process | **Programmatic Request Execution**: Internally executes a translet via a `DaemonService.translate()` call within a daemon application.<br>**Non-Web Context**: Uses `DaemonRequestAdapter` and `DaemonResponseAdapter` that capture I/O internally, instead of web-specific request/response objects. |
| `com.aspectran.embed.activity` | `AspectranActivity` | Embedded in another Java application | **Programmatic Request Execution**: The embedding application initiates an Aspectran request via an `EmbeddedAspectran.translate()` call.<br>**Non-Web Context**: Uses `EmbeddedRequestAdapter` and `EmbeddedResponseAdapter` that capture I/O internally, instead of web-specific request/response objects. |
| `com.aspectran.shell.activity` | `ShellActivity` | Interactive Command-Line (CLI) | **Interactive User Experience**: Designed for direct user interaction via the console, supporting input prompts, greeting messages, output redirection, etc.<br>**Command-Line Based**: Converts a parsed command-line command (`TransletCommandLine`) into an Aspectran translet via `ShellRequestAdapter` and executes it. |
| `com.aspectran.web.activity` | `WebActivity` | Standard Servlet Container (Tomcat, Jetty, etc.) | **HTTP Request/Response Handling**: Specialized for handling incoming `HttpServletRequest`s and generating `HttpServletResponse`s.<br>**Servlet API Bridge**: Bridges the gap between the Servlet API and the Aspectran core through `HttpServletRequestAdapter` and `HttpServletResponseAdapter`. |
| `com.aspectran.undertow.activity` | `TowActivity` | Embedded Undertow Server | **Servlet-less Web**: Aims for high performance by bypassing the Servlet API and communicating directly with Undertow's native `HttpServerExchange` object.<br>**Adapter Pattern**: `TowRequestAdapter` and `TowResponseAdapter` act as adapters that convert the `HttpServerExchange` into a form that the standard `Activity` can understand. |

## 3. Core Design Principles of the Architecture

-   **Reusable Core Pipeline**: All `Activity` implementations extend `CoreActivity` to reuse Aspectran's powerful request processing pipeline (AOP, DI, rule execution, etc.) as is.
-   **Environment-specific Adaptation Layer**: Provides adapters and specialized `Activity` implementations that convert the unique I/O mechanisms of each environment (HTTP request/response, console I/O, internal method calls) to fit Aspectran's standard `Activity` model.
-   **Consistent Programming Model**: Developers can write business logic using the consistent abstractions of `Activity` and `Translet` in any environment, which maximizes code reusability.

Thanks to this structure, Aspectran can be a flexible and powerful framework capable of building a very wide range of applications, from lightweight embedded libraries to standalone daemons, interactive shells, and high-performance web application servers.
