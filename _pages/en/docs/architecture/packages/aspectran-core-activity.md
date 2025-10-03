---
title:
subheadline: Architecture - Package Deep Dive
---

# In-Depth Analysis of the `com.aspectran.core.activity` Package

## 1. Design Goals and Key Roles

This package forms the core of Aspectran's **request processing execution engine**. The design goals of this package are as follows:

-   **Standardization of Request Processing**: Defines a standard execution model (`Activity`) to process any type of request, whether it's a web request, a shell command, or a daemon call, through a consistent pipeline.
-   **Separation from Execution Environment**: Uses the Adapter Pattern to ensure that the core logic (`CoreActivity`) for processing requests operates independently, without dependencies on specific execution environments like servlets or shell consoles.
-   **Single Request Lifecycle Management**: An `Activity` instance acts as a central control object that manages the entire lifecycle from the moment a single request occurs until the response is completed.
-   **Clear Boundary with User Code**: Ensures that business logic written by developers does not directly handle the complex internal structure of the framework, but rather interacts with the request context through a simplified facade called `Translet`.

In conclusion, this package aims to process various types of requests in a consistent manner, separate the framework's core execution logic from the external environment, and provide an easy-to-use API to developers.

## 2. Detailed Analysis of Key Classes and Interfaces

### `Activity` (Interface)

The specification for the central execution engine that governs all processing during a single request-response lifecycle.

**Key Responsibilities:**
-   Provides access to `ActivityContext`, the global context of the application.
-   Defines methods to access adapters (`RequestAdapter`, `ResponseAdapter`, `SessionAdapter`) that abstract the execution environment.
-   Manages exceptions (`raisedException`) that occur during request processing and controls the processing flow (`terminate`).
-   Provides access to AsEL expression evaluators (`TokenEvaluator`, `ItemEvaluator`).

### `CoreActivity` (Abstract Class)

The core implementation of `Activity`, defining the standard pipeline for executing `Translet` rules.

**Key Responsibilities:**
-   Prepares (`prepare`) and performs (`perform`) the entire process for handling a request.
-   Manages core objects needed during request processing, such as `Translet` instances, `ActivityData`, and `Response` objects.
-   Supports passing attributes during redirects by integrating with `FlashMapManager`.

**Key Method Analysis:**
-   `perform()`: Aspectran's **core request processing pipeline**. When this method is called, the following processes occur sequentially:
    1.  Standardizes request/response objects through adapters.
    2.  Executes `BEFORE` advice.
    3.  Sequentially executes actions defined in `<contents>` (`dispatchContent()`).
    4.  Processes the response according to the `<response>` rule. (Forward, Redirect, Transform, Dispatch, etc.)
    5.  Executes `AFTER` advice.
    6.  If an exception occurred, executes `THROWN` advice.
    7.  Executes `FINALLY` advice regardless of success or failure.
    8.  Finally completes the response (`response.end()`).

### `Translet` (Interface)

From the perspective of the action code written by developers, it is a **simplified API facade** for interacting with the currently processed request.

**Key Responsibilities:**
-   Provides easy access to request parameters (`getParameter`), attributes (`getAttribute`), file parameters (`getFileParameter`), etc.
-   Exposes methods to control the response flow (`transform`, `dispatch`, `forward`, `redirect`), allowing dynamic determination of the response method within the action code.
-   Provides access to the results (`ProcessResult`) of executed actions.
-   Delegates and provides key functionalities of `ActivityContext` such as `getBean()` and `getMessage()`.

### `CoreTranslet` (Implementation Class)

A concrete implementation of `Translet` used within `CoreActivity`. It operates by delegating all method calls of the `Translet` interface to the `CoreActivity` instance that created it or to related adapters.

### `ActivityData` (Class)

A map-like facade that integrates and provides all data accessible during request processing into a single view.

**Key Responsibilities:**
-   Allows retrieval of scattered data from various sources (request parameters, request attributes, session attributes, action results (`ProcessResult`)) through a single object.
-   When accessing data through `#{...}` AsEL expressions, this `ActivityData` becomes the primary search target.
-   Uses a lazy loading approach where actual data is retrieved from the original source (Request, Session, etc.) at the time of request.

### `FlashMap` and `FlashMapManager`

A mechanism to pass attributes from the current request to the next request when a redirect occurs, supporting the Post/Redirect/Get (PRG) pattern. `FlashMapManager` temporarily stores `FlashMap` objects in the session, etc., reads them in the next request, and integrates them into `ActivityData`.

### `InstantActivity` (Class)

A lightweight `Activity` for immediately executing short-lived tasks within an existing `Activity` flow. For example, it is used internally when handling programmatic calls like `render()` or `execute()`. It can be executed by inheriting the state (session, etc.) of the parent `Activity`.

## 3. Package Summary and Architectural Significance

The `com.aspectran.core.activity` package is Aspectran's **execution engine** itself. The most important architectural decision of this package is the **separation of roles between `Activity` and `Translet`**.

-   **`Activity`**: Handles the role of a powerful but complex 'engine' within the framework, including complex execution flows, advice integration, exception handling, and lifecycle management.
-   **`Translet`**: Acts as a simple and intuitive 'API' exposed to developers.

Thanks to this separation, developers can utilize all of Aspectran's features with just the simple `Translet` interface, without needing to know the complex internal workings of the framework. Furthermore, by perfectly abstracting the execution environment through `RequestAdapter` and `ResponseAdapter`, the same `CoreActivity` pipeline gains the flexibility to be reused in any environment, whether web, shell, or daemon. This forms the basis of Aspectran's high modularity and extensibility.
