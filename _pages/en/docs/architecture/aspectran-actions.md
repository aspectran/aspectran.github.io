---
format: plate solid article
sidebar: toc
title: "Aspectran Actions: Concepts, Types, and Processing Results"
subheadline: Architecture
parent_path: /docs
---

In the Aspectran framework, an **Action** is the most basic unit of execution that performs a specific task within the execution flow of a Translet. Actions are responsible for the actual behavior of the application, such as invoking business logic, manipulating data, and controlling flow.

## 1. The Core of an Action: The `Executable` Interface

All Actions implement the `com.aspectran.core.activity.process.action.Executable` interface. This interface defines a single core method:

-   `Object execute(Activity activity)`: This method encapsulates the specific task that the Action will perform. It takes an `Activity` object as a parameter, allowing it to access the current execution context, and returns the processing result as an `Object` type. This return value is used to generate subsequent Actions or the final response.

Actions are defined by `ActionRule`s, which correspond to the `<action>` tags in the configuration file (XML/APON), and are executed sequentially by the `Activity`'s execution pipeline.

## 2. Types and Detailed Descriptions of Built-in Actions

The `com.aspectran.core.activity.process.action` package includes various built-in Action implementations.

-   **`InvokeAction`**: The most commonly used Action, it calls a specific method of a designated bean. It plays a key role in integrating business logic into a translet.
    -   **Configuration Example**:
        ```xml
        <action id="user" bean="userService" method="getUserById">
            <argument name="id">#{userId}</argument>
        </action>
        ```

-   **`EchoAction`**: Evaluates data from the current `Activity` context (parameters, attributes, bean properties, etc.) and returns the result as an `ActionResult`. It is mainly used to construct model data to be passed to a view template or to expose a specific value as a result.
    -   **Configuration Example**:
        ```xml
        <echo id="pageInfo">
            <argument name="title">User List</argument>
            <argument name="totalCount">#{@userDao^countAll}</argument>
        </echo>
        ```

-   **`HeaderAction`**: Sets one or more headers in the HTTP response. It is used in a web environment to dynamically add or modify response headers such as `Content-Type` or `Cache-Control`.
    -   **Configuration Example**:
        ```xml
        <headers>
            <header name="Cache-Control" value="no-cache, no-store, must-revalidate"/>
            <header name="Pragma" value="no-cache"/>
        </headers>
        ```

-   **`IncludeAction`**: Executes another translet and includes its result in the current translet's `ProcessResult`. This allows for the modularization and reusability of common logic (e.g., authentication, common data retrieval).
    -   **Configuration Example**:
        ```xml
        <!-- Include a common user authentication translet -->
        <include translet="/other-translet">
            <parameter name="param">${param}</parameter>
            <attribute name="attr">${attr}</attribute>
        </include>
        ```

-   **`ChooseAction`**: An Action that provides a conditional execution flow, operating similarly to a `switch` statement. It executes the Actions of the first `<when>` condition that evaluates to true among the several defined within it.
    -   **Configuration Example**:
        ```xml
        <choose>
            <when test="${userType} == 'admin'">
                <forward translet="/admin/dashboard"/>
            </when>
            <when test="${userType} == 'user'">
                <forward translet="/user/dashboard"/>
            </when>
            <otherwise>
                <redirect path="/login"/>
            </otherwise>
        </choose>
        ```

-   **`AdviceAction`**: A special `InvokeAction` that executes a method of an AOP (Aspect-Oriented Programming) advice bean. It is used internally to execute advice logic such as `@Before`, `@After`, etc., in an AOP context.

-   **`AnnotatedAction`**: An Action that executes a method of a bean identified by a specific Aspectran annotation, such as `@RequestToGet` or `@Action`. It enables Convention over Configuration (CoC) based on annotations instead of XML rules.

## 3. Structure and Utilization of Action Processing Results

In Aspectran, the processing result of an Action is more than just a simple return value; it plays a key role in passing and controlling data throughout the execution flow of a Translet. These values are a sophisticated data model that structures the data generated during the `Activity`'s lifecycle, allowing this data to be accessed and utilized in subsequent processing steps.

### 3.1. Hierarchical Structure of Result Values (`com.aspectran.core.activity.process.result`)

The processing results of an Action are managed hierarchically through the following three classes.

-   **`ActionResult`**: The smallest unit in the hierarchy, it captures the value (`resultValue`) returned after an individual `Executable` Action is executed. This value is stored along with the unique ID (`actionId`) assigned to the Action.
    -   If the `actionId` contains a delimiter (e.g., `.`), such as `user.address`, the result can be stored in a nested fashion in a special `Map` form called `ResultValueMap`, allowing for the representation of complex data structures.

-   **`ContentResult`**: Logically groups multiple `ActionResult` objects. It serves to collect the results of Actions executed within a specific content area, such as a `<contents>` block in the translet configuration. A `ContentResult` can be identified by name (e.g., `<contents name="main">`) and manages all the Action results within that block together.

-   **`ProcessResult`**: The top-level container for the entire execution result of a single `Activity`. It contains all `ContentResult` objects and is the final set of results returned after the `Activity` is completed. `ProcessResult` provides a comprehensive view of the results of all Actions that occurred during the entire processing of the `Activity`.

### 3.2. Main Uses of Result Values

The processing results of an Action play a key role in various scenarios, such as the following.

#### a. View Rendering
The most common use case is passing the result of an Action as a model to a view template (e.g., FreeMarker, Pebble, JSP) to generate a dynamic UI.

**Example:** Retrieving user information with `InvokeAction` and passing the result to a Pebble template.

*   **Translet Configuration:**
    ```xml
    <translet name="/user/detail">
        <action id="userInfo" bean="userDao" method="getUser">
            <argument name="id">#(param:userId)</argument>
        </action>
        <response>
            <dispatch name="user/detail.peb"/>
        </response>
    </translet>
    ```
*   **Pebble Template (`user/detail.peb`):**
    ```html
    <h1>User Information</h1>
    <p>Name: {{ userInfo.name }}</p>
    <p>Email: {{ userInfo.email }}</p>
    ```
    The `actionId` `userInfo` becomes the name of the model object in the template, allowing access to the data in a way like `userInfo.name`.

#### b. REST API Response Generation
In a RESTful API, the result of an Action is converted into a data format such as JSON or XML and sent as a response to the client. `TransformResponse` is mainly used for this.

**Example:** Responding by converting the Action result to JSON.

*   **Translet Configuration:**
    ```xml
    <translet name="/api/user/detail" method="GET">
        <action id="user" bean="userDao" method="getUser"/>
        <transform type="json"/>
    </translet>
    ```
    The `User` object returned by `userDao.getUser()` is stored as an `ActionResult` named `user`, and `TransformResponse` serializes the entire `ProcessResult` into JSON format to generate the response body.

#### c. Inter-Translet Communication
Using `IncludeAction`, you can execute another translet and bring its result into the context of the current translet. This allows for modularizing and reusing common logic.

**Example:** Using authentication information by including a common authentication translet.

*   **Authentication Translet (`/common/auth`):**
    ```xml
    <translet name="/common/auth">
        <action id="authInfo" bean="authService" method="authenticate"/>
    </translet>
    ```
*   **Main Translet:**
    ```xml
    <translet name="/user/dashboard">
        <!-- Execute the authentication translet and include its result in the current context -->
        <include translet="/common/auth"/>
        <!-- Use the result of the included translet (authInfo) in a subsequent Action -->
        <action bean="dashboardService" method="getDashboardData">
            <argument name="userId">@{authInfo.userId}</argument>
        </action>
        <dispatch name="dashboard.jsp"/>
    </translet>
    ```

#### d. Conditional Logic and Flow Control
`ChooseAction` is used to dynamically determine the next execution path by evaluating the result of a previous Action.

**Example:** Forwarding to a different page based on login success.

*   **Translet Configuration:**
    ```xml
    <translet name="/user/loginProc">
        <choose>
            <when test="@{loginResult^success}">
                <!-- Forward to the dashboard on success -->
                <forward translet="/user/dashboard"/>
            </when>
            <otherwise>
                <!-- Redirect to the login page on failure -->
                <redirect path="/login?error=1"/>
            </otherwise>
        </choose>
    </translet>
    ```
    The expression `@{loginResult^success}` evaluates the `success` property of the result object from the Action named `loginResult` and returns `true` or `false`.

### 3.3. Accessing Result Values

The `Translet` object provides methods to access the `ProcessResult`.

-   **`translet.getProcessResult()`**: Gets the entire `ProcessResult` object.
-   **`translet.getProcessResult().getResultValue(String actionId)`**: Directly retrieves the result value of an Action corresponding to a specific `actionId`. This method can also handle nested `actionId`s like `parentActionId.childKey`, making it easy to access data in complex structures.
