---
title: "Understanding Translet: The Face of Aspectran"
subheadline: Core Guides
---

In the Aspectran framework, the **Translet**, by its name alone, might seem like the entity that processes requests. However, it is actually a specific **execution plan or blueprint** for **"how to handle a request?"** All actual execution is handled by an engine called `Activity`, and the Translet acts as a **medium** for communication between this `Activity` and the user code (Action).

Everything that runs in Aspectran, from handling a specific URL request in a web application to executing a batch job, is defined by a single Translet rule.

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

## 2. How is a Translet Found and Executed?

When the application starts, Aspectran parses all defined Translet rules and registers them in a central repository called the **`TransletRuleRegistry`**.

When a user request comes in, the `Activity` finds the most suitable Translet rule (blueprint) from this registry. Aspectran searches for rules based on a clear priority system, ensuring that the most specific rule is always chosen first.

1.  **Request Name**: It looks for an exact match, like `/user/info`.
2.  **Request Method**: In a web environment, this corresponds to HTTP methods like `GET`, `POST`, etc. Even with the same request name, a different Translet can be executed based on this request method.
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

In addition to the rule-based XML/APON method, Aspectran provides a modern way to define Translets directly in Java code using **annotations**. Within a bean class declared with `@Component`, if you directly attach an annotation corresponding to a request method, such as `@RequestToGet` or `@RequestToPost`, to a specific method, Aspectran will **implicitly create a Translet rule** with that method as the core action.

```java
@Component // Indicates that this class is a bean.
public class UserApiController {

    @Autowired
    private UserDao userDao;

    // Creates a Translet rule for a GET /user/info/${userId} request.
    // This method becomes an Action executed by the Activity.
    @RequestToGet("/user/info/${userId}")
    @Transform(format = FormatType.JSON) // Transforms the result to JSON.
    public User getUserInfo(long userId, Translet translet) { // (1)
        // The return value of the method becomes the response content.
        return userDao.getUserById(userId);
    }
}
```
**(1)** The path variable `${userId}` is automatically injected into the `userId` argument with the same name. Aspectran provides this powerful feature of injecting arguments by name and type without a separate annotation. Also, if you declare a `Translet` type as an argument, the `Activity` will inject the current `Translet` instance.

### 4.1. Asynchronous Request Handling

If you need to handle a long-running task, you can instruct the `Activity` to **execute the Translet asynchronously** by setting the `async` attribute to `true`.

```java
@RequestToPost(
    path = "/reports/generate",
    async = true, // Enables asynchronous execution.
    timeout = 30000L
)
@Transform(format = FormatType.TEXT)
public String generateReport(Translet translet) {
    // Parse the request body into Aspectran's Parameters object.
    // JSON, XML, etc., are automatically parsed based on the Content-Type.
    Parameters parameters = translet.getRequestAdapter().getBodyAsParameters();

    // The business logic directly uses the Parameters object.
    reportService.generate(parameters);

    return "Report generation has started in the background.";
}
```

## 5. Conclusion: The True Role of Translet - an 'Interface'

If we were to define a Translet in one word, it would be a **'Figurehead' or 'Facade'**. This is because its role from the user's perspective is different from its actual role within the framework.

From the **user's perspective**, a Translet is a clear unit of request processing. A developer maps a Translet to a specific request path and defines the actions to be executed and the response method within it. As such, it seems as though the user designs and controls the application's behavior through the Translet.

However, from the **framework's internal perspective**, a Translet rule is nothing more than a **'blueprint'** that does not directly process the request. All actual processing tasks (executing actions, interpreting rules, applying AOP, etc.) are the responsibility of the **`Activity` execution engine**.

The true role of the Translet is as an **'interface for communication'** between these two. During request processing, the `Activity` creates a `Translet` instance, and this instance performs the following important tasks:

*   **Programming Interface**: The `Activity` can pass the `Translet` instance as an argument when calling an Action method. The user code interacts with the framework through this instance.
*   **Data Store**: It stores the result of the `Activity`'s processing (`ProcessResult`) so that the user code can access it.
*   **Control Channel**: It provides a channel for the user code to partially control the response method through the `Translet` instance.

In this way, the Translet hides the complex internal execution logic (`Activity`) and presents only a clear and simple 'blueprint' and 'interface' to the user. Thanks to this role, developers can easily and flexibly design and extend the application's functionality without knowing the complex internal workings.
