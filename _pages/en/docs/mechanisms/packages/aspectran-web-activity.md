---
title: In-Depth Analysis of the `com.aspectran.web.activity` Package
subheadline: Architecture - Package Deep Dive
---

## 1. Design Goals and Key Roles

This package acts as an **adapter that adjusts Aspectran's core execution engine (`CoreActivity`) to the standard Java Servlet environment**. The design goals of this package are as follows:

-   **Concretizing the Execution Environment**: Inherits from the protocol-independent `CoreActivity` to provide `WebActivity`, which integrates with specific technologies like the Servlet API (`HttpServletRequest`, `HttpServletResponse`).
-   **Encapsulation of the Servlet API**: Instead of directly handling servlet request/response objects, it encapsulates them behind Aspectran's standard adapter interfaces (`RequestAdapter`, `ResponseAdapter`). This ensures that the `CoreActivity` execution pipeline does not have a direct dependency on the Servlet API.
-   **Handling Web-Specific Features**: It is responsible for handling features required only in a web environment, such as multipart request (file upload) parsing, request encoding processing, and asynchronous request processing (Servlet 3.0+ `AsyncContext`).

In conclusion, this package aims to provide a **specialized executor** that performs all necessary conversions and adaptations to enable the general execution engine to operate within the specific context of the web.

## 2. Detailed Class Analysis

### `WebActivity` (Implementation Class)

The final implementation of `Activity` for the servlet-based web environment. A new instance is created for each incoming `HttpServletRequest` by `WebService`.

**Key Responsibilities:**
-   Inherits `CoreActivity`, thus inheriting all of Aspectran's standard request processing pipeline (advice, action execution, etc.).
-   Maintains references to `HttpServletRequest` and `HttpServletResponse` objects and manages them throughout the entire request processing lifecycle.
-   Integrates web-related features (multipart parsing, asynchronous processing, etc.) into `CoreActivity`'s execution flow.

**Key Method Analysis:**
-   `adapt()`: The **core implementation of the Adapter Pattern**. It is called at the beginning of `CoreActivity`'s `perform()` method and creates and configures adapters that convert Servlet API objects into Aspectran's standard interfaces.
    -   `HttpServletRequestAdapter`: Wraps `HttpServletRequest` to act as a `RequestAdapter`. It provides a standardized way to read request parameters, attributes, headers, etc.
    -   `HttpServletResponseAdapter`: Wraps `HttpServletResponse` to act as a `ResponseAdapter`. It provides a standardized way to write data to the response stream or set headers.
    -   `HttpSessionAdapter`: Wraps `HttpSession` obtained via `HttpServletRequest.getSession()` to act as a `SessionAdapter`.
-   `parseRequest()`: Performs web-specific logic for parsing the HTTP request body. In particular, if the `Content-Type` is `multipart/form-data`, it uses `MultipartFormDataParser` to handle multipart requests, including file uploads. This method is called during the `prepare()` stage.
-   `isAsync()` / `getAsyncContext()`: Methods to support Servlet 3.0's asynchronous processing (`AsyncContext`). If a translet is configured with `async="true"`, these methods are used to switch to asynchronous mode and manage the `AsyncContext`.

**Interaction with Other Classes:**
-   `WebService`: Within its `service()` method, it creates a `WebActivity` for every valid request and calls `prepare()` and `perform()`.
-   `CoreActivity`: `WebActivity` inherits `CoreActivity` and uses its execution pipeline as is. The role of `WebActivity` is to 'connect' the input/output to the Servlet API so that this pipeline can run in a web environment.
-   Classes in `com.aspectran.web.adapter` package: `HttpServletRequestAdapter`, `HttpServletResponseAdapter`, etc., included in this package are directly created and used within the `adapt()` method.

## 3. Package Summary and Architectural Significance

The `com.aspectran.web.activity` package and its core, the `WebActivity` class, are the **clearest examples of the Adapter Pattern** in Aspectran's architecture.

The greatest architectural significance of this package is the **separation of core logic from specific environment technology**. `CoreActivity` only defines an abstract pipeline of 'how to process a request', while `WebActivity` handles the concrete role of 'how to fit the request and response from a servlet environment into that pipeline'. Thanks to this separation, Aspectran's core engine can remain stable and unaffected by changes or limitations of the Servlet API.

Furthermore, other `Activity` implementations for different environments, such as `DaemonActivity` and `ShellActivity`, also inherit `CoreActivity` and implement their own adapters in the same way as `WebActivity`. This is good evidence of how Aspectran supports various execution environments based on consistent and highly reusable design principles.
