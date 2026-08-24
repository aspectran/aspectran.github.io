---
title: "Understanding Translet: The Face of Aspectran"
subheadline: Core Guides
---

In the Aspectran framework, the **Translet**, by its name alone, might seem like the entity that processes requests. However, it is actually a specific **execution plan or blueprint** for **"how to handle a request?"** All actual execution is handled by an engine called `Activity`, and the Translet acts as a **medium** for communication between this `Activity` and the user code (Action).

Everything that runs in Aspectran—from handling HTTP requests in web applications to executing interactive CLI commands (Shell) and running background services (Daemon)—is defined and executed as a single request-response cycle (transaction) governed by a Translet rule.

## 1. Characteristics of a Translet

### 1.1. Declarative & Rule-Based

A Translet is defined as a **collection of declarative rules** in XML or APON (Aspectran Object Notation) format. This allows for the separation of business logic and processing flow.

```xml
<translet name="/user/info">
    <!-- Rules that define how to handle the request -->
    <action bean="userDao" method="getUserInfo"/>
    <transform format="json"/>
</translet>
```

### 1.2. Excellent Flexibility and Reusability

A single Translet defines the processing flow for a specific request. This can include various processing rules such as:

-   **Request Handling**: Defines how to handle request parameters or payloads.
-   **Action Execution**: Defines which business logic to perform.
-   **Content Generation**: Combines processing results to generate content for the response.
-   **Transformation**: Transforms the generated content into a final response format like JSON, XML, or text.
-   **Response Control**: Allows you to directly respond with data like JSON or XML, dispatch to a view template for UI rendering, or forward/redirect the processing to another Translet or URL.

By combining these rules, you can flexibly design everything from very simple tasks to complex workflows.

### 1.3. Multi-Environment Support (Web, Shell, Daemon)

Aspectran is a general-purpose framework, not limited to web environments. A Translet operates consistently under a unified abstraction model across HTTP servlet environments (`Mode.WEB`), interactive command-line interfaces (`Mode.SHELL`), and background daemons running scheduled services (`Mode.DAEMON`).

## 2. How is a Translet Found and Executed?

When the application starts, Aspectran parses all defined Translet rules and registers them in a central repository called the **`TransletRuleRegistry`**.

When a user request comes in, the `Activity` finds the most suitable Translet rule (blueprint) from this registry. Aspectran searches for rules based on a clear priority system, ensuring that the most specific rule is always chosen first.

1.  **Request Name**: It looks for an exact match, like `/user/info`.
2.  **Request Method**: In a web environment, this corresponds to HTTP methods like `GET`, `POST`, `PUT`, `DELETE`, etc. Even with the same request name, a different Translet can be executed based on this request method.
3.  **Wildcard and Path Variable Patterns**: It supports patterns like `/users/*` or `/users/${userId}`, allowing for very efficient implementation of RESTful APIs.

The `Activity` performs the actual request processing task according to the found Translet rule. In other words, **the Translet is the 'blueprint', and the Activity is the 'construction worker'** that works by looking at that blueprint.

### Search Priority: The Most Specific Rule Wins!

When finding a Translet, the following priorities are applied:

1.  **Exact Match First**: Rules with a name that exactly matches the request, without any wildcards (`*`) or path variables (`${...}`), are always chosen first.
2.  **More Specific Patterns Take Precedence**: If multiple wildcard patterns match a request, the rule with the more specific pattern wins.
    -   **Example**: For a `GET /users/info` request, if both a `/users/*` rule and a `/users/info` rule exist, the more specific `/users/info` rule will be selected. Similarly, a `/users/${userId}/profile` pattern is more specific than `/users/${userId}/*` and would be chosen first.
3.  **Fallback for Non-GET Requests**: If no exact match is found for a `POST`, `PUT`, etc., request, Aspectran will look for a rule that has no method specified (implicitly a `GET` rule) as a fallback.
    -   **Example**: If a `POST /users` request arrives, but there is no `/users` rule explicitly defined with `method="post"`, and only a `<translet name="/users">...</translet>` rule (with no method) exists, that rule will be selected to handle the request.
4.  **Later Definitions Override Earlier Ones**: If multiple Translet rules are defined with the same request name and method, the **last one defined (or registered)** will overwrite the previous ones. This can be useful for overriding specific rules when your Aspectran configuration is split across multiple files or when using the include feature to import settings from another file.

This priority system allows developers to define general-purpose rules alongside specific ones, leading to flexible and intuitive code management.

## 3. Dynamic Translet Generation (Scanning)

One of Aspectran's most powerful features is **dynamic Translet generation**. For example, if you need to serve hundreds of JSP files as different Translets, instead of repeatedly defining hundreds of `<translet>` rules, you can define just one rule as follows:

```xml
<translet name="*" scan="/WEB-INF/jsp/**/*.jsp">
    <description>
        This automatically finds all JSP files in the '/WEB-INF/jsp/' directory and its subdirectories and registers them as Translets.
        The path of the discovered jsp file is specified as the value of the file attribute of the template element.
    </description>
    <dispatch name="/"/>
</translet>
```

The rule above scans for all `.jsp` files in the `/WEB-INF/jsp/` directory and its subdirectories, and dynamically creates and registers Translets based on the file paths. For example, if a file `/WEB-INF/jsp/user/list.jsp` is found, a Translet named `user/list` is created. This feature is very useful for serving a large number of static view files and dramatically reduces repetitive Translet definitions.

## 4. Annotation-based Translet Definition: `@RequestTo*`

In addition to the rule-based XML/APON method, Aspectran provides a modern way to define Translets directly in Java code using **annotations**. Within a bean class declared with `@Component`, if you directly attach an annotation corresponding to a request method, such as `@RequestToGet`, `@RequestToPost`, `@RequestToPut`, or `@RequestToDelete`, to a specific method, Aspectran will **implicitly create a Translet rule** with that method as the core action.

```java
package com.aspectran.demo;

import com.aspectran.core.activity.Translet;
import com.aspectran.core.component.bean.annotation.Autowired;
import com.aspectran.core.component.bean.annotation.Component;
import com.aspectran.core.component.bean.annotation.RequestToGet;
import com.aspectran.core.component.bean.annotation.Transform;
import com.aspectran.core.context.rule.type.FormatType;
import org.jspecify.annotations.NonNull;

@Component // Indicates that this class is a bean.
public class UserApiController {

    private final UserDao userDao;

    @Autowired
    public UserApiController(UserDao userDao) {
        this.userDao = userDao;
    }

    // Creates a Translet rule for a GET /user/info/${userId} request.
    // This method becomes an Action executed by the Activity.
    @RequestToGet("/user/info/${userId}")
    @Transform(format = FormatType.JSON) // Transforms the result to JSON.
    public User getUserInfo(@NonNull Translet translet, long userId) { // (1)
        // The return value of the method becomes the response content.
        return userDao.getUserById(userId);
    }
}
```

### 4.1. Parameter Mapping & Mandatory Argument Validation (`@NonNull` Standardization)

In **(1)** of the example above, the path variable `${userId}` is automatically converted and injected into the method parameter named `userId`. Aspectran intelligently injects path variables, request parameters, and registered beans based on name and type matching without requiring boilerplate annotations. Furthermore, declaring a `Translet` parameter injects the active `Translet` instance currently executing the request.

> **💡 Deprecation of `@Required` and Adoption of `@NonNull` Standard**
> 
> Previously, Aspectran provided its own `@Required` annotation (`com.aspectran.core.component.bean.annotation.Required`) to denote non-null parameters and mandatory dependencies.
> 
> In modern Aspectran development, `@Required` is **`@Deprecated`** in favor of the industry-standard **JSpecify `@NonNull` (`org.jspecify.annotations.NonNull`)** annotation, which ensures maximum compatibility with IDE static analysis tools and explicit nullability contracts.

### 4.2. Asynchronous Request Handling

If you need to handle a long-running task, you can instruct the `Activity` to **execute the Translet asynchronously** by setting the `async` attribute to `true`.

```java
@RequestToPost(
    path = "/reports/generate",
    async = true, // Enables asynchronous execution.
    timeout = 30000L
)
@Transform(format = FormatType.TEXT)
public String generateReport(@NonNull Translet translet) {
    // Parse the request body into Aspectran's Parameters object.
    // JSON, XML, etc., are automatically parsed based on the Content-Type.
    Parameters parameters = translet.getRequestAdapter().getBodyAsParameters();

    // The business logic directly uses the Parameters object.
    reportService.generate(parameters);

    return "Report generation has started in the background.";
}
```

## 5. Translet API Reference and Practical Guide

The `Translet` interface passed to action methods and interceptors provides a rich suite of APIs to inspect request-response state and programmatically control execution flow. Below is a structured guide categorized by capability.

### 5.1. Request Metadata and Execution Environment

Inspect the URI, HTTP method, execution mode, character encoding, and environment settings of the current request.

| Method | Description |
| :--- | :--- |
| `Activity.Mode getMode()` | Returns the execution mode (`WEB`, `SHELL`, `DAEMON`, etc.). |
| `String getContextPath()` | Returns the context path of the application. |
| `String getRequestName()` | Returns the request path excluding the context path (e.g., `/users/123`). |
| `String getActualRequestName()` | Returns the full request URI as seen by the client (e.g., `/myapp/users/123`). |
| `MethodType getRequestMethod()` | Returns the HTTP/activity request method (`GET`, `POST`, `PUT`, `DELETE`, etc.). |
| `String getTransletName()` | Returns the name (pattern) of the matched Translet rule. |
| `String getDescription()` | Returns the description defined on the Translet rule. |
| `Environment getEnvironment()` | Returns the `Environment` object for the current context. |
| `ApplicationAdapter getApplicationAdapter()` | Returns the `ApplicationAdapter` for application-scoped resources. |
| `String getDefinitiveRequestEncoding()` | Returns the character encoding used for the request body. |
| `String getDefinitiveResponseEncoding()` | Returns the character encoding applied to the response. |

```java
public void logRequestInfo(@NonNull Translet translet) {
    Activity.Mode mode = translet.getMode();
    String transletName = translet.getTransletName();
    MethodType method = translet.getRequestMethod();
    String requestName = translet.getRequestName();

    System.out.printf("[%s] %s %s (Matched Rule: %s)%n", mode, method, requestName, transletName);
}
```

### 5.2. Adapters & Native Adaptees Access

Aspectran decouples request, response, and session handling from underlying runtime platforms using adapters. When native platform features are needed, you can access the underlying objects (e.g., `HttpServletRequest`).

| Method | Description |
| :--- | :--- |
| `RequestAdapter getRequestAdapter()` | Returns the `RequestAdapter` for request data and headers. |
| `ResponseAdapter getResponseAdapter()` | Returns the `ResponseAdapter` for status codes, headers, and output. |
| `boolean hasSessionAdapter()` | Checks whether a session adapter is active in the current environment. |
| `SessionAdapter getSessionAdapter()` | Returns the `SessionAdapter` for session state management. |
| `<V> V getRequestAdaptee()` | Returns the native request object (e.g., `HttpServletRequest`). |
| `<V> V getResponseAdaptee()` | Returns the native response object (e.g., `HttpServletResponse`). |
| `<V> V getSessionAdaptee()` | Returns the native session object (e.g., `HttpSession`). |

```java
public void handleAdapters(@NonNull Translet translet) {
    // Access abstracted request adapter
    RequestAdapter requestAdapter = translet.getRequestAdapter();
    String userAgent = requestAdapter.getHeader("User-Agent");

    // Access session adapter
    if (translet.hasSessionAdapter()) {
        SessionAdapter sessionAdapter = translet.getSessionAdapter();
        sessionAdapter.setAttribute("LAST_ACCESS", System.currentTimeMillis());
    }

    // Access native servlet request in web mode
    if (translet.getMode() == Activity.Mode.WEB) {
        HttpServletRequest req = translet.getRequestAdaptee();
        String remoteAddr = req.getRemoteAddr();
    }
}
```

### 5.3. Request Parameters and File Upload Handling

Inspect query parameters, form data, and uploaded multipart files (`FileParameter`), or mutate request parameters dynamically.

| Method | Description |
| :--- | :--- |
| `String getParameter(String name)` | Returns a single parameter value. |
| `String[] getParameterValues(String name)` | Returns an array of values for a multi-valued parameter. |
| `Collection<String> getParameterNames()` | Returns all parameter names. |
| `Map<String, Object> getAllParameters()` | Returns a mutable map of all parameters (flattened single/array values). |
| `void setParameter(String name, String value)` | Dynamically sets or overrides a parameter value. |
| `void copyParametersTo(Map<String, Object> target)` | Copies all request parameters into the specified target map. |
| `FileParameter getFileParameter(String name)` | Returns the single `FileParameter` for a file upload field. |
| `FileParameter[] getFileParameterValues(String name)`| Returns an array of uploaded `FileParameter` objects. |
| `Collection<String> getFileParameterNames()` | Returns all file upload parameter names. |
| `void removeFileParameter(String name)` | Removes a specific file parameter. |
| `boolean hasPathVariables()` | Checks if the current Translet rule matched URI path variables. |

```java
public void processUpload(@NonNull Translet translet) throws IOException {
    String title = translet.getParameter("title");
    FileParameter uploadFile = translet.getFileParameter("attachment");

    if (uploadFile != null && !uploadFile.isEmpty()) {
        String fileName = uploadFile.getFileName();
        long fileSize = uploadFile.getFileSize();
        // Save uploaded file
        uploadFile.saveAs(new File("/uploads/" + fileName));
    }
}
```

### 5.4. Request Attributes and FlashMap

Manage request-scoped attributes to share data between actions and view templates, or use FlashMap to pass flash attributes across client redirects.

| Method | Description |
| :--- | :--- |
| `<V> V getAttribute(String name)` | Retrieves a request-scoped attribute. |
| `void setAttribute(String name, Object value)` | Stores a request-scoped attribute. |
| `Collection<String> getAttributeNames()` | Returns all attribute names in request scope. |
| `void removeAttribute(String name)` | Removes a request-scoped attribute. |
| `void copyAttributesTo(Map<String, Object> target)` | Copies all request attributes into the specified target map. |
| `boolean hasInputFlashMap()` | Checks if an input FlashMap exists from a previous redirect. |
| `Map<String, ?> getInputFlashMap()` | Returns flash attributes passed from the previous request. |
| `boolean hasOutputFlashMap()` | Checks if an output FlashMap is available for subsequent requests. |
| `FlashMap getOutputFlashMap()` | Returns the `FlashMap` used to store flash attributes for the next redirect. |

```java
public void handleFlashAndAttributes(@NonNull Translet translet) {
    // 1. Set request attributes for view rendering
    translet.setAttribute("currentMenu", "admin");

    // 2. Pass one-time notification across redirect using FlashMap
    FlashMap flashMap = translet.getOutputFlashMap();
    flashMap.put("successMessage", "Account created successfully.");

    // 3. Perform redirect
    translet.redirect("/user/welcome");
}
```

### 5.5. Process Results & Activity Data

When actions execute within a Translet, their return values are aggregated into the `ProcessResult` container.

| Method | Description |
| :--- | :--- |
| `ProcessResult getProcessResult()` | Returns the container holding all action results. |
| `Object getProcessResult(String actionId)` | Returns the execution result of a specific action by ID. |
| `void setProcessResult(ProcessResult result)` | Replaces the entire process result container. |
| `ActivityData getActivityData()` | Returns the aggregate `ActivityData` for the active lifecycle. |
| `String getWrittenResponse()` | Returns the response body written to the output buffer so far. |

```java
public void inspectActionResult(@NonNull Translet translet) {
    // Retrieve result produced by a preceding action ('createOrder')
    Object orderResult = translet.getProcessResult("createOrder");
    if (orderResult instanceof Order order) {
        System.out.println("Generated Order ID: " + order.getOrderId());
    }
}
```

### 5.6. Flow Control & Response Handling (Dispatch, Forward, Redirect, Transform)

Programmatically alter the control flow by dispatching to view templates, forwarding internally, redirecting clients, or rendering data transforms immediately.

| Method | Description |
| :--- | :--- |
| `void dispatch(String name)` | Dispatches the request to a view template (JSP, Thymeleaf, Pebble, etc.). |
| `void dispatch(String name, String dispatcherName)` | Dispatches to a view template using a specific dispatcher bean. |
| `void dispatch(DispatchRule dispatchRule)` | Dispatches according to a declarative `DispatchRule`. |
| `void forward(String transletName)` | Forwards execution internally to another Translet. |
| `void forward(ForwardRule forwardRule)` | Forwards execution according to a declarative `ForwardRule`. |
| `void redirect(String path)` | Initiates a client-side redirect to the specified URL. |
| `void redirect(String path, Map<String, String> params)` | Initiates a client-side redirect with appended query parameters. |
| `void redirect(RedirectRule redirectRule)` | Initiates a redirect according to a declarative `RedirectRule`. |
| `void transform(TransformRule transformRule)` | Immediately transforms content (JSON, XML, etc.) and completes the response. |
| `void transform(CustomTransformer transformer)` | Immediately transforms content using a custom transformer instance. |
| `void response()` | Flushes and sends the current response immediately, concluding processing. |
| `void response(Response response)` | Executes the given response rule immediately and halts processing. |
| `Response getDeclaredResponse()` | Returns the original response definition declared in the Translet rule. |
| `boolean isResponseReserved()` | Checks whether a response flow control (redirect, forward, transform) has been reserved. |

```java
public void dynamicFlowControl(@NonNull Translet translet) {
    boolean isAdmin = checkAdminRole(translet);

    if (!isAdmin) {
        // Redirect unauthorized users to login page with parameters
        translet.redirect("/login", Map.of("error", "unauthorized"));
        return;
    }

    // Dynamically choose view template based on query parameter
    if ("compact".equals(translet.getParameter("mode"))) {
        translet.dispatch("dashboard/compactView");
    } else {
        translet.dispatch("dashboard/fullView");
    }
}
```

### 5.7. Bean Registry and Environment Properties

Look up beans from the Aspectran IoC container or resolve environment properties and Translet-scoped settings.

| Method | Description |
| :--- | :--- |
| `<V> V getBean(String id)` | Retrieves a bean instance by its ID. |
| `<V> V getBean(Class<V> type)` | Retrieves a bean instance by its class or interface type. |
| `<V> V getBean(Class<V> type, String id)` | Retrieves a bean instance by both type and ID. |
| `boolean containsBean(String id)` | Checks if a bean with the specified ID exists. |
| `boolean containsBean(Class<?> type)` | Checks if a bean of the specified type exists. |
| `<V> V getProperty(String name)` | Retrieves an environment property (`%{...}`). |
| `<V> V getSetting(String settingName)` | Retrieves a setting value defined within the Translet scope. |

```java
public void loadServiceDynamically(@NonNull Translet translet) {
    // Dynamic bean retrieval
    MailService mailService = translet.getBean(MailService.class);
    
    // Resolve environment property
    String adminEmail = translet.getProperty("app.admin.email");
    mailService.sendNotification(adminEmail, "Service operation completed.");
}
```

### 5.8. Dynamic Evaluation with AsEL (Aspectran Expression Language)

Evaluate AsEL expressions and OGNL token expressions dynamically at runtime.

| Method | Description |
| :--- | :--- |
| `<V> V evaluate(String expression)` | Evaluates an AsEL expression string. |
| `<V> V evaluate(String expression, Class<V> type)` | Evaluates an expression and converts the result to the specified type. |
| `<V> V evaluate(Token[] tokens)` | Evaluates an array of pre-parsed tokens. |

```java
public void evaluateExpressions(@NonNull Translet translet) {
    // Evaluate request parameter tokens and environment properties
    String greeting = translet.evaluate("Hello, ${param.userName}! Server port is %{server.port}.");

    // Evaluate OGNL object graph navigation and arithmetic formulas
    Integer calculated = translet.evaluate("@{totalPrice} * (100 - @{discountRate}) / 100", Integer.class);
}
```

### 5.9. Internationalization (i18n) & Message Resolution

Resolve localized messages from configured `MessageSource` bundles according to the client's locale.

| Method | Description |
| :--- | :--- |
| `String getMessage(String code)` | Resolves a message by message code. |
| `String getMessage(String code, Object[] args)` | Resolves a message with positional arguments. |
| `String getMessage(String code, String defaultMessage)` | Resolves a message, returning a default message if not found. |
| `String getMessage(String code, Object[] args, String defaultMessage)` | Resolves a message with arguments and a default fallback. |
| `String getMessage(String code, Locale locale)` | Resolves a message for an explicit `Locale`. |
| `String getMessage(String code, Object[] args, Locale locale)` | Resolves a message with arguments for an explicit `Locale`. |
| `String getMessage(String code, Object[] args, String defaultMessage, Locale locale)` | Resolves a message specifying code, arguments, default, and locale. |

```java
public String getWelcomeMessage(@NonNull Translet translet) {
    String userName = translet.getParameter("name");
    // Looks up "user.welcome" and formats with {0}
    return translet.getMessage("user.welcome", new Object[] { userName }, "Welcome, {0}!");
}
```

### 5.10. AOP Advice Results Retrieval

Access the results produced by Aspect advice methods (Before, After, Around, Finally) executed around the Translet.

| Method | Description |
| :--- | :--- |
| `<V> V getAdviceBean(String aspectId)` | Retrieves the advice bean instance for the given aspect ID. |
| `<V> V getBeforeAdviceResult(String aspectId)` | Returns the result returned by the `Before` advice. |
| `<V> V getAfterAdviceResult(String aspectId)` | Returns the result returned by the `After` advice. |
| `<V> V getAroundAdviceResult(String aspectId)` | Returns the result returned by the `Around` advice. |
| `<V> V getFinallyAdviceResult(String aspectId)` | Returns the result returned by the `Finally` advice. |

```java
public void inspectSecurityAspect(@NonNull Translet translet) {
    // Retrieve authenticated principal set by a before-advice in 'jwtAuthAspect'
    Principal principal = translet.getBeforeAdviceResult("jwtAuthAspect");
    if (principal != null) {
        System.out.println("Authenticated user: " + principal.getName());
    }
}
```

### 5.11. Exception Handling and Inspection

Inspect exceptions thrown during activity execution, analyze root causes, or clear exception flags to recover flow.

| Method | Description |
| :--- | :--- |
| `boolean isExceptionRaised()` | Checks whether an unhandled exception occurred during the activity. |
| `Throwable getRaisedException()` | Returns the raised `Throwable` instance. |
| `Throwable getRootCauseOfRaisedException()` | Returns the innermost root cause exception. |
| `void removeRaisedException()` | Clears the stored exception to resume normal execution flow. |

```java
public void handleActivityError(@NonNull Translet translet) {
    if (translet.isExceptionRaised()) {
        Throwable rootCause = translet.getRootCauseOfRaisedException();
        System.err.println("Failure root cause: " + rootCause.getMessage());
    }
}
```

## 6. Conclusion: The True Role of Translet - 'Blueprint and Interface'

If we were to define a Translet in one word, it would be a **'Facade' for the `Activity` execution engine** and the **'primary interface'** for users. This is because its role from the user's perspective is distinct from its actual role within the framework.

*   **User's Perspective**: A Translet is a clear unit of request processing. A developer maps a Translet to a specific request path and defines the actions to be executed and the response method within it. As such, it seems as though the user designs and controls the application's behavior through the Translet.
*   **Framework's Internal Perspective**: A Translet rule is nothing more than a **'blueprint'** that does not directly process the request. All actual processing tasks (executing actions, interpreting rules, applying AOP, configuring encodings, etc.) are the responsibility of the **`Activity` execution engine**.
*   **Communication Interface**: During request processing, the `Activity` creates a request-scoped `Translet` instance and passes it to Action methods and interceptors. Through this `Translet` instance, user code accesses rich APIs to query parameters, manage flash attributes, control template dispatching and redirects, and resolve internationalized messages.

In this way, the Translet hides the complex internal execution logic (`Activity`) and presents only a clear, simple 'blueprint' and a powerful 'interface' to the user. Thanks to this architecture, developers can easily and flexibly design, extend, and maintain high-quality applications across web, shell, and daemon environments without needing to manage low-level execution complexity.
