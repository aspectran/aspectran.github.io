---
format: plate solid article
sidebar: toc-left
title: In-Depth Analysis of the `com.aspectran.embed.activity` Package
subheadline: Package Deep Dive
teaser:
---

## 1. Design Goals and Key Roles

This package provides the **`Activity` implementation that actually executes** programmatic calls initiated from the `EmbeddedAspectran` service. This package plays a very similar role to the `daemon-activity` package but is adapted to the specific context of an embedded environment.

The design goals of this package are as follows:

-   **Concretizing the Execution Context of an Embedded Environment**: Inherits from the abstract `CoreActivity` to provide `AspectranActivity`, which can process requests in an environment embedded within another Java application.
-   **Standardization of Programmatic Calls**: Provides adapters that convert `Map`-shaped parameters, attributes, and request bodies passed through `EmbeddedAspectran`'s `translate()` method into standard request/response forms that the Aspectran core engine can understand.

In conclusion, this package acts as a **bridge that converts and connects data and call methods** between the simplified facade `EmbeddedAspectran` and the complex execution engine `CoreActivity`.

## 2. Detailed Class Analysis

### `AspectranActivity` (Implementation Class)

The final implementation of `Activity` for the embedded environment. A new instance is created each time `DefaultEmbeddedAspectran`'s `translate()` method is called.

**Key Responsibilities:**
-   Inherits `CoreActivity`, thus inheriting all of Aspectran's standard request processing pipeline (advice, action execution, etc.).
-   Maintains the request name, method, attribute map, parameter map, and request body passed via the `translate()` method as internal state.
-   Creates and manages request/response/session adapters specific to the embedded environment.

**Key Method Analysis:**
-   `adapt()`: The **core of adaptation for the embedded environment**. It is called at the beginning of `CoreActivity`'s `perform()` method to convert programmatic calls into standard interfaces.
    -   `AspectranRequestAdapter`: Wraps the `attributeMap`, `parameterMap`, and `body` passed to the `translate()` method to act as a `RequestAdapter`. It is functionally slightly more extended than `DaemonRequestAdapter` in that it can handle `body`, making it easier to programmatically simulate requests like POST/PUT.
    -   `AspectranResponseAdapter`: Internally wraps an `OutputStringWriter` or a `Writer` directly provided during the `translate()` call to act as a `ResponseAdapter`. All response results are written to this `Writer`.
    -   `DefaultSessionAdapter`: If session management is enabled in the parent `EmbeddedAspectran` service, it creates a session adapter to support state persistence.

**Interaction with Other Classes:**
-   `DefaultEmbeddedAspectran`: Within its `translate()` method, it directly creates `AspectranActivity`, sets parameters, and then calls `prepare()` and `perform()` to execute it.
-   `CoreActivity`: `AspectranActivity` inherits `CoreActivity` and uses its execution pipeline as is.
-   Classes in `com.aspectran.embed.adapter` package: `AspectranRequestAdapter` and `AspectranResponseAdapter` are directly created and used within the `adapt()` method.

## 3. Package Summary and Architectural Significance

The `com.aspectran.embed.activity` package, along with the `activity` packages for `daemon` and `shell` environments, demonstrates how highly reusable Aspectran's core execution engine, `CoreActivity`, is designed.

`AspectranActivity` handles all the heavy lifting of converting actual programmatic calls into Aspectran's standard execution model, behind the user-friendly facade of `EmbeddedAspectran`. Thanks to this adapter layer, the `CoreActivity` execution engine does not need to distinguish whether its execution was triggered by an HTTP request, an internal daemon call, or a method call from another Java application.

This perfect decoupling makes it very easy to embed Aspectran into other applications and use it as a service component to perform specific functions (e.g., template rendering, rule-based logic execution). This is a key architectural design that allows Aspectran to not only be a standalone application framework but also to fully function as a **high-functionality embedded library**.
