---
format: plate solid article
sidebar: toc-left
title: In-Depth Analysis of the `com.aspectran.web.service` Package
subheadline: Architecture - Package Deep Dive
parent_path: /docs
---

## 1. Design Goals and Key Roles

This package provides the core service implementation for running the Aspectran framework in a **standard Java Servlet container environment**. The design goals of this package are as follows:

-   **Integration with Servlet API**: Acts as a perfect bridge between the Servlet API (`HttpServletRequest`, `HttpServletResponse`, `ServletContext`) and Aspectran's protocol-independent core engine.
-   **Reactive Request Processing Model**: Unlike daemon services that initiate tasks themselves, it implements a reactive request processing model that receives HTTP requests from external sources (web browsers, etc.) and operates in response to them.
-   **Provide a Single Entry Point**: Provides a single entry point, `WebService.service(...)`, which acts as a Front Controller, receiving and processing all web requests.
-   **Separation of Static/Dynamic Resource Processing**: Aspectran directly handles dynamic requests (translet execution), while delegating static resources like CSS/JS/images to the servlet container's Default Servlet for efficiency.

In conclusion, this package aims to extend and adapt the Aspectran core service to the web environment, allowing it to function as a fully featured web framework on top of general web application servers (WAS).

## 2. Detailed Analysis of Key Classes and Interfaces

### `WebService` (Interface)

The specification for Aspectran services specialized for the web environment.

**Key Responsibilities:**
-   Inherits `CoreService` to possess all core service functionalities.
-   Defines `service(HttpServletRequest, HttpServletResponse)`, the single entry point for processing web requests.
-   Provides `getServletContext()` method to access `ServletContext`.
-   Defines constants to be used as attribute names, allowing other web components (JSP, servlet filters, etc.) to easily access the `WebService` instance via `ServletContext`.

### `DefaultWebService` (Implementation Class)

The final implementation of `WebService`, responsible for receiving HTTP requests and handling the entire process of creating and executing `WebActivity`.

**Key Responsibilities:**
-   Inherits `DefaultCoreService` to act as a fully functional core service.
-   Maintains a reference to `ServletContext` and reads necessary web-related configurations from `WebConfig`.
-   Efficiently handles static resource requests through `DefaultServletHttpRequestHandler`.

**Key Method Analysis:**
-   `service(HttpServletRequest request, HttpServletResponse response)`: The heart of this class. All requests from the servlet container come through this method.
    1.  Checks if the service is in a paused state.
    2.  Parses the request URI to determine the name of the translet to execute (`requestName`).
    3.  Checks if Aspectran should handle the request via `RequestAcceptor`. If not, it delegates processing to `DefaultServletHttpRequestHandler`, assuming it's a static resource.
    4.  If it's a target for processing, it creates a `WebActivity` instance. This `WebActivity` acts as an adapter wrapping the `request` and `response` objects.
    5.  Calls `activity.prepare()` to find the translet rule corresponding to `requestName`.
    6.  Calls `activity.perform()` to drive Aspectran's standard request processing pipeline (advice, action execution, etc.).
    7.  If an exception occurs during execution, it performs exception handling logic to send appropriate HTTP error codes (e.g., 404, 500).

### `DefaultWebServiceBuilder` (Builder Class)

A factory class that creates and configures `DefaultWebService` instances.

**Key Responsibilities:**
-   Designed to be called at the startup of the servlet container, such as from `ServletContextListener`'s `contextInitialized()` method or `WebActivityServlet`'s `init()` method.
-   Can read the location of the Aspectran configuration file (`aspectran.config.file`) from `<context-param>` or `<init-param>` defined in `web.xml`.
-   After creating a `WebService` instance, it performs additional web-specific setup tasks, such as registering it with `CoreServiceHolder` via `ServiceStateListener` and initializing WebSocket (`ServerEndpointExporter`) support.

## 3. Interaction with Other Packages

-   **`com.aspectran.core.service`**: Directly inherits `DefaultCoreService` to reuse all of Aspectran's core functionalities (lifecycle, `ActivityContext` management, etc.).
-   **`com.aspectran.web.activity`**: `DefaultWebService` creates a `WebActivity` for every valid request. `WebActivity` is the most important collaborating object, acting as an adapter between the Servlet API and the core engine.
-   **`javax.servlet`**: This package is responsible for direct integration with the Servlet API. It receives `HttpServletRequest` to create `WebActivity` and outputs the result to `HttpServletResponse`.

## 4. Package Summary and Architectural Significance

The `com.aspectran.web.service` package can be called the **Servlet API adapter layer** for Aspectran. Thanks to this package, Aspectran's core engine, designed to be protocol-independent, can communicate with the HTTP protocol, which is dependent on specific technologies (servlets) and environments (web containers).

The most important architectural feature is **abstraction through `WebActivity`**. `WebActivity` wraps the servlet's `request` and `response` objects and converts them into the standard `Activity` model that the Aspectran core understands. As a result, the `CoreActivity` execution pipeline can perform the same logic without needing to know whether the request it is processing came from a servlet or from a shell. This is an excellent example of a very well-designed adapter pattern that **perfectly separates environmental dependencies**.

In conclusion, this package provides the essential foundation for Aspectran to function as a fully featured enterprise web framework on top of all standard servlet containers like Tomcat and Jetty.
