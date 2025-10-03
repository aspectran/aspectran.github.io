---
title: In-Depth Analysis of the `com.aspectran.undertow.service` Package
subheadline: Architecture - Package Deep Dive
---

## 1. Design Goals and Key Roles

This package provides specialized service implementations for **running Aspectran directly on Undertow**, a high-performance, lightweight web server. This is an alternative to the `web-service` package, which uses the standard Servlet API.

The design goals of this package are as follows:

-   **Provide a Servlet-less Web Environment**: Completely bypasses traditional servlet containers and APIs, interacting directly with Undertow's native I/O objects (`HttpServerExchange`) to provide better performance and a lighter deployment environment.
-   **Support for High-Performance Embedded Servers**: Optimizes the environment for microservice architectures by packaging Aspectran applications as independently executable JAR files that can be launched with an embedded Undertow server.
-   **Maintain Configuration Compatibility**: Reuses the standard web configuration (`WebConfig`) used by servlet-based web applications, making it easy for developers to switch to Undertow-based deployments with minimal changes to existing web application configurations.

In conclusion, this package aims to provide Aspectran with a modern, high-performance web environment option, making it suitable for building lightweight, standalone microservices.

## 2. Detailed Analysis of Key Classes and Interfaces

### `TowService` (Interface)

The specification for Aspectran services based on Undertow. (Tow is presumed to be short for "The Other Web.")

**Key Responsibilities:**
-   Inherits `CoreService` to possess all core service functionalities.
-   Defines `service(HttpServerExchange exchange)`, the core entry point for processing all web requests coming from the Undertow server. This directly corresponds to `WebService.service(HttpServletRequest, ...)` in a servlet environment.

### `DefaultTowService` (Implementation Class)

The final implementation of `TowService`, responsible for receiving Undertow's `HttpServerExchange` and handling the entire process of creating and executing `TowActivity`.

**Key Responsibilities:**
-   Inherits `DefaultCoreService` to act as a fully functional core service.
-   Designed to be connected as an `HttpHandler` implementation in Undertow's handler chain.
-   Reuses the same `<web>` configuration (`WebConfig`) used by the standard `WebService`, enhancing configuration portability.

**Key Method Analysis:**
-   `service(HttpServerExchange exchange)`: This class's core execution method. It is called directly by Undertow's I/O thread.
    1.  Checks if the service is in a paused state.
    2.  Extracts the request URI and method from the `HttpServerExchange` object.
    3.  Checks if Aspectran can handle the request; if not, it sends a 404 Not Found response.
    4.  Creates a `TowActivity` instance specialized for the Undertow environment and passes the `HttpServerExchange` object.
    5.  Calls `activity.prepare()` and `activity.perform()` to drive Aspectran's standard request processing pipeline.
    6.  If an exception occurs during execution, it directly sends appropriate HTTP status codes (e.g., 404, 500) to the client via `HttpServerExchange`.

### `DefaultTowServiceBuilder` (Builder Class)

A factory class that creates and configures `DefaultTowService` instances. It is used when programmatically configuring an embedded Undertow server and adding Aspectran as a handler.

## 3. Interaction with Other Packages

-   **`com.aspectran.core.service`**: Directly inherits `DefaultCoreService` to reuse all of Aspectran's core functionalities (lifecycle, `ActivityContext` management, etc.).
-   **`com.aspectran.undertow.activity`**: `DefaultTowService` creates a `TowActivity` for every valid request. `TowActivity` acts as an adapter between Undertow's native I/O objects and the core engine.
-   **`io.undertow.server`**: This package is responsible for direct integration with the Undertow server. `DefaultTowService` implements the `HttpHandler` interface to be connected to Undertow's handler chain.
-   **`com.aspectran.core.context.config`**: Reuses the `WebConfig` configuration class, maintaining configuration compatibility between servlet and Undertow environments.

## 4. Package Summary and Architectural Significance

The `com.aspectran.undertow.service` package is a **high-performance, servlet-less web adapter** for Aspectran. The greatest architectural significance of this package is that it demonstrates Aspectran's ability to bypass the traditional Servlet API abstraction layer and integrate directly with modern asynchronous I/O-based web servers like Undertow.

The approach where `TowActivity` directly wraps and processes `HttpServerExchange` can reduce potential overhead that occurs when using the Servlet API and lead to better performance. This is particularly well-suited for microservice environments that need to handle a large volume of requests.

Furthermore, thanks to the clever design of reusing `WebConfig`, developers can easily switch deployment environments from a servlet container to an embedded Undertow server with almost no modifications to existing Aspectran web applications. This proves that Aspectran has a robust and extensible architecture that can flexibly adapt to changing technology trends.
