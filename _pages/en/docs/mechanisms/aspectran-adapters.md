---
title: "Adapter Architecture: The Core of Environment Independence"
subheadline: Mechanisms
mermaid: true
---

## 1. Architectural Overview and Design Philosophy

When an application framework is tightly coupled to a specific runtime technology (e.g., Servlet API, Netty channel pipelines, terminal console streams, etc.), extensive code modification or duplicate implementations become inevitable to reuse the same business logic in different execution environments.

Aspectran comprehensively adopts the **GoF Adapter Pattern** to fundamentally eliminate such environment dependencies.

*   **Environment Isolation**: Completely hides the physical differences of runtime environments—such as web containers, asynchronous network sockets, command-line shells, and background daemons—behind Aspectran's standard interfaces.
*   **Single Business Logic, Unmodified Execution Across Multiple Environments**: Business actions (`Action`), beans (`Bean`), and translets (`Translet`) authored by developers depend exclusively on the core abstraction layer. Therefore, the exact same code can run across servlet-based web servers, Netty-based microservices, CLI tools, and background schedulers without changing a single line of code.
*   **Ease of Unit Testing**: Through memory-based adapters, business logic can be tested quickly in an isolated environment without booting a heavy web server or servlet container.

## 2. Four Core Contract Interfaces (`com.aspectran.core.adapter`)

Aspectran's execution engine controls request processing and response flows based strictly on the four core interfaces defined in the `com.aspectran.core.adapter` package.

### 2.1. `ApplicationAdapter`
Abstracts the physical execution environment and the top-level lifecycle of the application:

*   **Base Directory and ClassLoader Management**: Provides the application root path (`basePath`) and the `ClassLoader` used to load resources.
*   **Application-Scoped Attributes**: Supports a consistent API (`getAttribute()`, `setAttribute()`, `removeAttribute()`) for storing and retrieving attributes shared across the global application lifecycle.
*   **Default Implementation**: `DefaultApplicationAdapter` provides a standard environment based on filesystem paths, and integrates with the base path of the `ServletContext` in servlet environments.

### 2.2. `RequestAdapter`
Encapsulates external request data delivered via various ingress paths (HTTP requests, console commands, scheduled job parameters, etc.) in a consistent manner:

*   **Parameter Abstraction**: Retrieves single/multi-valued request parameters uniformly via `getParameter()`, `getParameterValues()`, `getParameterNames()`, and `MultiValueMap`-based `ParameterMap`.
*   **Attribute and Header Access**: Provides access to request attributes and protocol headers maintained throughout the request processing lifecycle.
*   **Body Stream and Encoding**: Provides an `InputStream` to read the request body, sets character encoding, and identifies request methods (`MethodType`: GET, POST, PUT, DELETE, etc.).
*   **File Upload Support**: Standardizes and provides uploaded file data parsed from multipart requests in the form of `FileParameter` and `FileParameterMap`.
*   **`RequestScope` Integration**: Lazily instantiates and binds `RequestScope` to isolate and manage bean instances maintained for the duration of a single request lifecycle.

### 2.3. `ResponseAdapter`
Abstracts the output channel through which request processing results are delivered to clients or callers:

*   **Dual Output Streams**: Provides `getWriter()` (`Writer`) for string-based view rendering or JSON serialization, and `getOutputStream()` (`OutputStream`) for binary file downloads and streaming.
*   **Response Metadata Control**: Consistently controls character encoding (`setEncoding()`), content type (`setContentType()`), HTTP status codes (`setStatus()`), and custom response headers (`setHeader()`).
*   **Redirect Abstraction**: Defines the `redirect(RedirectTarget)` method to handle client browser redirects or internal path dispatches.

### 2.4. `SessionAdapter`
Defines contracts for handling user sessions consistently in environments requiring state management:

*   **Session Identification and Lifecycle**: Provides a unique session identifier (`getId()`), session creation timestamp (`getCreationTime()`), last accessed timestamp (`getLastAccessedTime()`), and maximum inactive interval (`getMaxInactiveInterval()`).
*   **Session Attribute Management**: Provides standard methods (`getAttribute()`, `setAttribute()`, `removeAttribute()`, `invalidate()`) to store and remove session-scoped data.
*   **`SessionScope` Integration**: Responsible for creating `SessionScope` to manage beans bound to the session lifecycle.

### 2.5. Template Class Structure of the Adapter Layer
Abstract template classes applying the Template Method Pattern are provided to prevent duplication of common logic and facilitate easy extension of concrete adapters:

*   `AbstractApplicationAdapter<T>`: Implements default attribute maps and base path management.
*   `AbstractRequestAdapter<T>`: Handles common processing for parameter parsing, locale resolution, timezone binding, and lazy `RequestScope` instantiation.
*   `AbstractResponseAdapter<T>`: Handles common logic for tracking response commit status, stream closure, and buffer management.
*   `AbstractSessionAdapter<T>`: Handles session validation and `SessionScope` binding.

> **Note**: The generic parameter `<T>` represents the type of the original native object (Adaptee) that the adapter wraps internally (e.g., `HttpServletRequest`, Netty channel, Undertow `HttpServerExchange`, etc.), allowing type-safe access to the underlying native object via `getAdaptee()`.

## 3. In-Depth Analysis of Concrete Adapter Implementations Across 7 Execution Environments

Aspectran provides symmetrical, fully realized implementations of these contract interfaces tailored to its seven supported runtime environments.

### 3.1. Standard Servlet Web Environment (`aspectran-web-servlet`)
An adapter suite operating in traditional Java servlet containers (Tomcat, Jetty, etc.) and external WAS deployment environments (`com.aspectran.web.servlet.adapter` package):

*   **`HttpServletRequestAdapter`**:
    *   Wraps `jakarta.servlet.http.HttpServletRequest`.
    *   Automatically adapts the servlet's parameter map into Aspectran's `ParameterMap`, supports client original IP identification in proxy environments (`proxyAddressForwarding`), and enforces maximum request size limits (`maxRequestSize`).
*   **`HttpServletResponseAdapter`**:
    *   Wraps `jakarta.servlet.http.HttpServletResponse`.
    *   Acquires the servlet's `getWriter()` or `getOutputStream()` dynamically based on the context to deliver to view dispatchers or transform responders, and integrates seamlessly with `NoBodyResponse` for HTTP HEAD request handling.
*   **`HttpSessionAdapter`**:
    *   Wraps standard `jakarta.servlet.http.HttpSession` to expose the servlet session as Aspectran's standard `SessionAdapter`. Instantiates `HttpSessionScope` for session-scoped bean management.

### 3.2. Servlet-Free High-Performance Netty Environment (`with-netty`)
An adapter suite designed for asynchronous, event-loop-based non-blocking network server environments (`com.aspectran.netty.adapter` package):

*   **`NettyRequestAdapter`**:
    *   Wraps Netty's `FullHttpRequest` and `ChannelHandlerContext`.
    *   Reads HTTP body payloads from Netty byte buffer (`ByteBuf`) streams in a streaming fashion, and decodes URI query strings and form parameters into Aspectran parameter maps. Safely maintains channel contexts even in virtual thread environments.
*   **`NettyResponseAdapter`**:
    *   Generates Netty's `FullHttpResponse` and asynchronously flushes it to the channel pipeline.
    *   Supports buffer size control, chunked encoding, Keep-Alive connection management, and HTTP/2 protocol frames.
*   **`NettySessionAdapter`**:
    *   In a pure Netty environment without a servlet container, coordinates with Aspectran's Session Manager to fully implement cookie-based distributed sessions.

### 3.3. Lightweight Embedded Undertow Environment (`with-undertow`)
A native adapter suite for JBoss Undertow high-performance embedded web servers (`com.aspectran.undertow.adapter` package):

*   **`TowRequestAdapter`**:
    *   Directly wraps Undertow's core exchange object, `io.undertow.server.HttpServerExchange`.
    *   Directly maps Undertow's high-speed header maps and query parameters without any Servlet API wrapping overhead.
*   **`TowResponseAdapter`**:
    *   Wraps `HttpServerExchange`'s response channel and `io.undertow.io.Sender` to process blocking and non-blocking I/O with optimal performance.
*   **`TowSessionAdapter`**:
    *   Seamlessly binds Undertow's native session manager interface with Aspectran sessions.

### 3.4. Interactive Console (CLI) Environment (`aspectran-shell`)
An adapter suite for environments where users interactively execute commands in a terminal console (`com.aspectran.shell.adapter` package):

*   **`ShellRequestAdapter`**:
    *   Maps commands and option arguments entered at the terminal prompt by the user into request parameters.
*   **`ShellResponseAdapter`**:
    *   Maps `ShellConsole`'s standard output stream (JLine terminal or `System.out`) to the response output stream, rendering translet execution results (text, APON, etc.) on the terminal screen with color styling.
*   **`ShellSessionAdapter`**:
    *   Provides an in-memory session maintaining user state or previous command contexts in memory while the shell program runs.

### 3.5. Background Process Environment (`aspectran-daemon`)
An adapter suite for long-running server daemons without direct console I/O or HTTP sockets (`com.aspectran.daemon.adapter` package):

*   **`DaemonRequestAdapter`**:
    *   Converts command file submissions by `FileCommander`, polling queues, or parameters issued by administrative command executors (`CommandExecutor`) into Aspectran request parameters.
*   **`DaemonResponseAdapter`**:
    *   Captures task results by redirecting them to log files, response files, or memory buffers (`StringWriter`).
*   **`DaemonSessionAdapter`**:
    *   Supports state sharing across long-running background task workflows.

### 3.6. Standalone Embedded and Unit Testing Environment (`aspectran-embed`)
An adapter suite for embedding Aspectran as a library within existing Java applications or executing mock tests (`com.aspectran.embed.adapter` package):

*   **`AspectranRequestAdapter`**:
    *   Wraps pure memory-based Java map objects (`Map<String, Object>`) into request parameters and attributes without depending on external environments.
*   **`AspectranResponseAdapter`**:
    *   Wraps an internal memory `StringWriter` or custom `Writer`, allowing callers to retrieve final results rendered by translets directly as strings in memory (`toString()`).
*   **`AspectranSessionAdapter`**:
    *   Provides an independent memory-based session, perfectly simulating web session logic in unit tests.

### 3.7. Scheduler Environment (`aspectran-core`)
A dedicated adapter suite for batch tasks executed periodically or aperiodically by the Quartz scheduler (`com.aspectran.core.scheduler.adapter` package):

*   **`QuartzJobRequestAdapter`**:
    *   Wraps Quartz scheduler's `JobExecutionContext` and `JobDataMap`, mapping task parameters defined in schedule rules to Aspectran request data.
*   **`QuartzJobResponseAdapter`**:
    *   A stateless response adapter safely routing scheduled task results to framework logging or result reporters.

## 4. Adapter Lifecycle and `Activity.adapt()` Mechanism

Adapters are coupled with the execution engine through a precise lifecycle from when a request arrives, throughout `Activity` creation, until termination.

### 4.1. `Activity.adapt()` Orchestration Pipeline
Every `Activity` implementation processing requests configures adapters in the following standardized sequence:

1.  **Request Ingress at the Service Layer**: Each runtime service (e.g., `WebActivityServlet`, `NettyServerHandler`, `AspectranShell`) receives an external event.
2.  **Activity Instantiation**: Instantiates an `Activity` object specialized for the current execution environment (e.g., `ServletWebActivity`, `NettyActivity`, `ShellActivity`, etc.).
3.  **Calling the `adapt()` Template Method**:
    *   During `Activity.prepare()`, the overridden `adapt()` method for the specific environment is executed.
    *   Instantiates and binds `RequestAdapter`, `ResponseAdapter`, and if enabled, `SessionAdapter` wrapping the native objects of the execution environment to the `Activity`.
    *   Injects runtime constraints into adapters, such as default character encoding settings and maximum request size limits (`maxRequestSize`).
4.  **Running the Standard Parsing Pipeline**:
    *   Once adapter binding is complete, `parseRequest()` is executed, uniformly performing declared parameter binding, path variable mapping, and internationalization (`LocaleResolver`) resolution through the standard adapter interfaces.

### 4.2. Adapter Handover in Forwarding and Pending Activities
When an internal forward (`ForwardResponse`) occurs during translet processing or child activities are executed nestedly, the following intelligent handover mechanism operates to prevent loss of existing session and request adapters:

*   If session or request adapters are already created in the parent activity (`PendingActivity`), the new child activity shares the parent adapter references directly rather than recreating adapters unnecessarily.
*   This ensures that identical session-scoped and request-scoped beans are preserved consistently before and after forwarding.

### 4.3. Request Termination and Resource Cleanup
When request processing finishes, adapter resource cleanup takes place in the `finally` block of `Activity.perform()`:

*   Flushes and closes the output buffer of `ResponseAdapter`.
*   Safely and automatically purges temporarily stored multipart upload files (`FileParameter`) from disk.
*   Destroys `RequestScope` and clears thread-local adapter references to prevent memory leaks.

## 5. Conclusion and Architectural Significance

Aspectran's Adapter Architecture serves as the **ultimate abstraction buffer** bridging the framework and business logic.

*   Business developers do not need deep knowledge of complex Servlet APIs, Netty channel pipelines, or Undertow exchange structures; they can focus solely on core business logic using pure Java POJOs and consistent Aspectran APIs.
*   Even if the infrastructure or deployment environment changes from a legacy servlet container to a high-speed asynchronous Netty server or embedded Undertow, business code requires zero modification.
*   This complete environment decoupling and high code reusability constitute the architectural foundation that elevates Aspectran beyond a simple web framework into a firmly established **Universal Framework executable in any environment**.
