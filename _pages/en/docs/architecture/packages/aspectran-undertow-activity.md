---
format: plate solid article
sidebar: toc-left
title: In-Depth Analysis of the `com.aspectran.undertow.activity` Package
subheadline: Architecture - Package Deep Dive
parent_path: /docs
---

## 1. Design Goals and Key Roles

This package provides the **`Activity` implementation that actually processes** Undertow's native web requests (`HttpServerExchange`) received via `TowService`. This package plays almost the same role as the `web-activity` package, but the target technology is the Undertow API instead of the Servlet API.

The design goals of this package are as follows:

-   **Concretizing the Undertow Execution Environment**: Inherits from the abstract `CoreActivity` to provide `TowActivity`, which can process HTTP requests in an Undertow web server environment.
-   **Encapsulation of the Undertow API**: Encapsulates Undertow's core I/O object, `HttpServerExchange`, behind Aspectran's standard adapter interfaces (`RequestAdapter`, `ResponseAdapter`, etc.). This ensures that the `CoreActivity` execution pipeline does not have a direct dependency on Undertow's native API.
-   **Handling Undertow-based Web Features**: It is responsible for handling web-specific functionalities, such as parsing multipart requests (file uploads), using Undertow's API.

In conclusion, this package aims to provide a **specialized executor** that performs all necessary conversions and adaptations to enable the general execution engine to operate within the specific web server context of Undertow.

## 2. Detailed Class Analysis

### `TowActivity` (Implementation Class)

The final implementation of `Activity` for the Undertow web server environment. A new instance is created for each incoming `HttpServerExchange` by `TowService`.

**Key Responsibilities:**
-   Inherits `CoreActivity`, thus inheriting all of Aspectran's standard request processing pipeline (advice, action execution, etc.).
-   Maintains a reference to the `HttpServerExchange` object and uses this object to read requests and send responses throughout the entire request processing lifecycle.

**Key Method Analysis:**
-   `adapt()`: The **core of adaptation for the Undertow environment**. It is called at the beginning of `CoreActivity`'s `perform()` method and creates and configures adapters that convert the `HttpServerExchange` object into Aspectran's standard interfaces.
    -   `TowRequestAdapter`: Wraps `HttpServerExchange` to act as a `RequestAdapter`. It provides a standardized way to read request parameters, attributes, headers, etc., through the `HttpServerExchange` API.
    -   `TowResponseAdapter`: Similarly wraps `HttpServerExchange` to act as a `ResponseAdapter`. It provides a standardized way to send response data to `HttpServerExchange`'s response channel or set headers.
    -   `TowSessionAdapter`: Wraps Undertow's session management functionality to act as a `SessionAdapter`.
    -   *Design Note*: In a servlet environment, `request` and `response` are separate objects, but in Undertow, `HttpServerExchange` manages both request and response states. Therefore, all adapters essentially refer to the same `HttpServerExchange` object.
-   `parseRequest()`: Similar to `WebActivity`, it performs the logic for parsing the HTTP request body. If the `Content-Type` is `multipart/form-data`, it uses Undertow's built-in parser to handle file uploads.

**Interaction with Other Classes:**
-   `TowService`: Creates a `TowActivity` for every valid request within its `service()` method and calls `prepare()` and `perform()`.
-   `CoreActivity`: `TowActivity` inherits `CoreActivity` and uses its execution pipeline as is.
-   Classes in `com.aspectran.undertow.adapter` package: `TowRequestAdapter`, `TowResponseAdapter`, etc., included in this package are directly created and used within the `adapt()` method.

## 3. Package Summary and Architectural Significance

The `com.aspectran.undertow.activity` package and its core, the `TowActivity` class, are representative examples of **Aspectran's environment-adaptive architecture** alongside `WebActivity`.

The greatest architectural significance of this package is that it once again proves the **perfect separation of core logic from specific environment technology**. `CoreActivity` does not need to know whether the request it is processing came via the Servlet API or via Undertow's `HttpServerExchange`. This is because `TowActivity` acts as an adapter that absorbs all technical differences and provides a standardized interface.

This design gives Aspectran the flexibility to not be dependent on a specific web server technology. If in the future it needs to support Netty or another new high-performance server, it can be extended relatively easily by simply adding new `activity` and `service` packages for that server. This demonstrates that Aspectran has a robust and extensible structure that can adapt to long-term technological changes.
