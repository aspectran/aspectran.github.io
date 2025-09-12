---
format: plate solid article
sidebar: toc-left
title: "Understanding Translet: The Face of Aspectran"
headline:
teaser:
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
-   **Response and Dispatch**: Responds to the user with the final result or forwards the processing to another Translet.

By combining these rules, you can flexibly design everything from very simple tasks to complex workflows.

## 2. How is a Translet Found and Executed?

When the application starts, Aspectran parses all defined Translet rules and registers them in a central repository called the **`TransletRuleRegistry`**.

When a user request comes in, the `Activity` finds the most suitable Translet rule (blueprint) from this registry.

1.  **Request Name**: It looks for an exact match, like `/user/info`.
2.  **Request Method**: In a web environment, this corresponds to HTTP methods like `GET`, `POST`, etc. Even with the same request name, a different Translet can be executed based on this request method.
3.  **Wildcard and Path Variable Patterns**: It supports patterns like `/users/*` or `/users/${userId}`, allowing for very efficient implementation of RESTful APIs.

The `Activity` performs the actual request processing task according to the found Translet rule. In other words, **the Translet is the 'blueprint', and the Activity is the 'construction worker'** that works by looking at that blueprint.

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
    @Transform(format = "json") // Transforms the result to JSON.
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
@Transform(format = "text")
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
