---
title: Aspectran XML Configuration Guide
subheadline: User Guides
---

Aspectran uses XML configuration to define the core components of an application, such as beans, translets, and aspects. Using XML provides high flexibility by allowing you to define configurations and relationships without changing the source code.

For validating this configuration file, Aspectran uses DTD (Document Type Definition) instead of XML Schema (XSD). This choice reflects Aspectran's pragmatic design philosophy. DTD is sufficient for verifying the structural integrity of the configuration, while detailed validation, such as data value validation, is handled directly within the framework to maintain consistency. This approach eliminates unnecessary complexity and enhances the clarity of the configuration.

This document provides a detailed explanation of all the elements used in the Aspectran XML configuration file (`aspectran-config.xml`).

## 1. Top-level & Basic Configuration

These are the elements that set up the basic structure and environment of the Aspectran application at the top level.

### 1.1. `<aspectran>`

This is the root element that wraps all configurations. It must exist only once at the top level of the Aspectran configuration file.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC
    "-//ASPECTRAN//DTD Aspectran 9.0//EN"
    "https://aspectran.com/dtd/aspectran-9.dtd">

<aspectran>
    <!-- All Aspectran settings are placed within this element. -->
    ...
</aspectran>
```

### 1.2. `<description>`

Adds a description to a configuration element. This element can be used as a child of almost all major elements (e.g., `<aspectran>`, `<bean>`, `<translet>`), which is useful for improving the readability of the configuration and documenting the purpose of a specific configuration.

```xml
<aspectran>
    <description>
        This file defines the main settings for the application.
        The development environment uses an H2 database.
    </description>
</aspectran>
```

### 1.3. `<settings>` and `<setting>`

Defines settings that control the global behavior of the Aspectran framework. `<settings>` has one or more `<setting>` child elements.

#### `<setting>` Attribute Details

-   `name` (required): Specifies the name of the setting item. You must use a value defined in the `DefaultSettingType` enum.
    -   `transletNamePrefix`: Specifies a prefix to be added to all translet names.
    -   `transletNameSuffix`: Specifies a suffix to be added to all translet names.
    -   `pointcutPatternVerifiable`: If set to `true`, it validates the AOP pointcut expressions at application startup. Setting it to `false` can reduce startup time by skipping validation, but an invalid expression could cause a runtime error.
    -   `defaultTemplateEngineBean`: Specifies the ID of the default template engine bean to use when a specific template engine is not specified in a `transform` action.
    -   `defaultSchedulerBean`: Specifies the ID of the default scheduler bean to use when a specific scheduler is not specified in a `schedule` rule.
-   `value` (required): Specifies the value to be set.

```xml
<settings>
    <setting name="transletNamePrefix" value="/api"/>
    <setting name="transletNameSuffix" value=".json"/>
    <setting name="pointcutPatternVerifiable" value="true"/>
    <setting name="defaultTemplateEngineBean" value="pebbleEngine"/>
    <setting name="defaultSchedulerBean" value="mainScheduler"/>
</settings>
```

### 1.4. `<typeAliases>` and `<typeAlias>`

Defines short aliases for long Fully Qualified Class Names to improve the readability of the XML configuration.

#### `<typeAlias>` Attribute Details

-   `alias` (required): Specifies the alias to be used.
-   `type` (required): Specifies the fully qualified name of the actual class to be mapped to the alias.

```xml
<typeAliases>
    <typeAlias alias="MyService" type="com.example.myapp.service.MyService"/>
    <typeAlias alias="MyController" type="com.example.myapp.controller.MyController"/>
</typeAliases>

<!-- Now you can refer to the class with the 'MyService' alias. -->
<bean id="myService" class="MyService"/>
```

### 1.5. `<environment>`

Defines properties that will only be applied when a specific profile is active. This makes it easy to manage different configurations for environments like development, testing, and production.

#### `<environment>` Attribute Details

-   `profile` (required): Specifies the name of the profile to which the settings will be applied. If you prefix the profile name with `!`, it means the settings will be applied when that profile is not active. Multiple profiles can be specified, separated by commas or spaces.

```xml
<!-- Environment settings to be applied when the 'dev' profile is active -->
<environment profile="dev">
    <property name="db.driver" value="org.h2.Driver"/>
    <property name="db.url" value="jdbc:h2:mem:devdb"/>
</environment>

<!-- Environment settings to be applied when the 'prod' profile is active -->
<environment profile="prod">
    <property name="db.driver" value="com.mysql.cj.jdbc.Driver"/>
    <property name="db.url" value="jdbc:mysql://prod.db.server/main"/>
</environment>
```

### 1.6. `<append>`

Includes other XML or APON configuration files into the current configuration. This element is fundamental for modularizing settings and is the primary mechanism for managing environment-specific bean definitions in XML.

By using the `profile` attribute, you can conditionally include entire configuration files, which is the idiomatic way to control which beans are registered based on the active environment (e.g., development, production).

#### `<append>` Attribute Details

-   `file`: Includes a file based on a file system path.
-   `resource`: Includes a resource based on a classpath path. This is the most common attribute.
-   `url`: Includes a remote file via a URL.
-   `format`: Specifies the format of the file to be included (`xml` or `apon`). If omitted, it is auto-detected based on the file extension. If there is no extension, `xml` is the default.
-   `profile`: A powerful attribute that includes the file only when a specific profile is active.

**Example: Managing Database Beans by Profile**

A common use case is to define different database connection beans for each environment.

1.  **Create profile-specific XML files:**
    -   `config/db/dev-db.xml`: Defines the `dataSource` bean for the development environment (e.g., an in-memory H2 database).
    -   `config/db/prod-db.xml`: Defines the `dataSource` bean for the production environment (e.g., a pooled connection to MySQL).

2.  **Conditionally include them in your main configuration:**
    ```xml
    <aspectran>
        ...
        <!-- Include common configurations -->
        <append resource="config/common-context.xml"/>

        <!-- Include the appropriate database configuration based on the active profile -->
        <append resource="config/db/dev-db.xml" profile="dev"/>
        <append resource="config/db/prod-db.xml" profile="prod"/>
        ...
    </aspectran>
    ```
In this setup, if the `dev` profile is active, only `dev-db.xml` is loaded, registering the H2 `dataSource`. If the `prod` profile is active, `prod-db.xml` is loaded, registering the MySQL `dataSource`. This provides a clean and robust way to manage environment-specific configurations.

## 2. Common Parameters and Properties

These are elements used commonly across various other elements to pass values or define attributes.

### 2.1. Basic Item Elements

These are basic elements for defining individual values, arguments, properties, etc.

-   **`<item>`**: The most general item element, mainly used within wrapper elements (`arguments`, `properties`, etc.) to define individual elements of a collection.
-   **`<value>`**: Used when you want to explicitly wrap the value itself.
-   **`<entry>`**: Used to define a key-value (`name`-`value`) pair for a `Map` type.

The elements below are like aliases for `<item>` named for a specific purpose and can be used alone for readability.

-   **`<parameter>`**: Defines a request parameter.
-   **`<attribute>`**: Defines an attribute to be used within the translet context.
-   **`<argument>`**: Defines an argument to be passed to a bean's constructor.
-   **`<property>`**: Injects a value into a bean's property (setter).

#### Item Element Attribute Details

-   `name`: Specifies the name (key) of the item (e.g., property name, parameter name).
-   `value`: Specifies the value of the item as a literal. You can use AsEL (e.g., `#{...}`, `%{...}`) to reference other beans or properties.
-   `valueType`: Explicitly specifies the type of the value (`string`, `int`, `long`, `float`, `double`, `boolean`, `file`, `bean`, etc.).
-   `type`: Specifies the collection type (`array`, `list`, `set`, `map`, `properties`).
-   `tokenize`: A boolean attribute that determines whether to parse the value for special tokens (like `#{...}`, `@{...}`). If `true` (the default), the value is parsed for token expressions. If `false`, the entire value is treated as a single literal string.
-   `mandatory`: If set to `true`, it indicates that the item is a required value (mainly used in `<parameter>`).
-   `secret`: If set to `true`, the value of the item is managed in an encrypted state.

### 2.2. Wrapper Elements for Applying Profiles

When you need to group multiple items and apply a `profile` to the entire group, you use wrapper elements. A characteristic of these wrapper elements is that they can only have `<item>` elements as children.

-   **`<parameters>`**: Groups multiple request parameters (`<item>`).
-   **`<attributes>`**: Groups multiple context attributes (`<item>`).
-   **`<arguments>`**: Groups multiple constructor arguments (`<item>`).
-   **`<properties>`**: Groups multiple bean properties (`<item>`).

## 3. Aspect-related Elements (`<aspect>`)

In Aspectran, an aspect modularizes a cross-cutting concern (like logging, transactions, or security) that applies to multiple points in an application. It is composed of a `joinpoint` (where to intervene) and `advice` (what to do). Aspectran's AOP is uniquely integrated with its core execution model, offering powerful ways to apply advice to either the execution of a whole translet or to specific bean methods.

#### `<aspect>` Attribute Details

-   `id`: A unique ID to identify the aspect.
-   `order`: Specifies the execution order when multiple aspects are applied to the same joinpoint. A lower number indicates higher priority (executed first).
-   `isolated`: If `true`, advice executed within this aspect is not a target for other aspects. This prevents infinite recursion. The default is `false`.
-   `disabled`: If `true`, this aspect is disabled and will not be applied. The default is `false`.

### 3.1. `<joinpoint>`: Defining a Pointcut

A **pointcut** specifies where advice should be applied. Aspectran defines the pointcut inside the `<joinpoint>` element's body using **APON (Aspectran Parameter Object Notation)**.

The APON block for a pointcut has two main properties:

-   `type`: The pattern matching style. It can be `wildcard` (the default) or `regexp` (for regular expressions).
-   `pointcut`: One or more pattern strings. A `+:` prefix includes matches, while a `-:` prefix excludes them.

#### Pointcut Pattern Syntax

The pattern string follows a specific structure: `transletNamePattern[@beanOrClassPattern][^methodNamePattern]`.

-   **`transletNamePattern`**: Matches the translet name.
-   **`@beanOrClassPattern`**: (Optional) Matches the bean ID or a full class name (prefixed with `class:`).
-   **`^methodNamePattern`**: (Optional) Matches the method name.

**Example 1: Wildcard Pointcut (Default)**
This is the most common type. It uses `*` to match any characters within a segment and `**` to match any characters across segments (e.g., multiple directories).

```xml
<joinpoint>
    pointcut: {
        type: wildcard        // This is the default, so it can be omitted
        +: /api/**            // Matches all translets under /api/
        -: /api/internal/*    // Excludes translets directly under /api/internal/
    }
</joinpoint>
```

**Example 2: Regular Expression Pointcut**
This pointcut uses a regular expression to target translets that have a numeric ID in their path.

```xml
<joinpoint>
    pointcut: {
        type: regexp
        +: /users/\d+        // Matches /users/1, /users/123, etc.
    }
</joinpoint>
```

**Example 3: Bean Method Pointcut**
This pointcut targets all methods (`^*`) on the bean with the ID `orderService` (`@orderService`) within any translet (`**`).

```xml
<joinpoint>
    pointcut: {
        +: **@orderService^*
    }
</joinpoint>
```

### 3.2. `<advice>`: Defining Advice

The `<advice>` element defines the logic to execute at the selected joinpoints. It links to a bean containing the advice methods. The timing of the advice is declared using the following child elements:

-   `<before>`: Executes an action **before** the joinpoint.
-   `<after>`: Executes an action only **after** the joinpoint completes successfully.
-   `<around>`: A simple advice type that executes a single action. Note that this is different from AspectJ's `@Around` advice, as it does not wrap the joinpoint and there is no `proceed()` call to manage. It's a straightforward action execution.
-   `<finally>`: Executes an action **after** the joinpoint finishes, regardless of success or failure. This is the ideal place for resource cleanup.
    -   **Conditional logic with `<thrown>`**: The `<finally>` block can contain a `<thrown>` child element. The action inside this nested `<thrown>` will *only* execute if the joinpoint threw an exception. This is perfect for scenarios like transaction management, where you commit on success but must rollback on failure.

The declarative transaction example from the next section illustrates this perfectly:
```xml
<advice bean="sqlSessionTxAdvice">
    <before>
        <invoke method="open"/>
    </before>
    <after>
        <invoke method="commit"/>
    </after>
    <finally>
        <thrown>
            <!-- Executes only if an exception was thrown -->
            <invoke method="rollback"/>
        </thrown>
        <!-- Always executes after the joinpoint finishes -->
        <invoke method="close"/>
    </finally>
</advice>
```

### 3.3. Performance: The `@Advisable` Annotation

For **bean method-level AOP**, Aspectran includes a critical performance optimization. The AOP proxy only intercepts methods that are explicitly marked as targets for advice. To mark a method, you must add the `@com.aspectran.core.component.bean.annotation.Advisable` annotation.

-   **Why is it needed?**: If a method is not annotated, the proxy skips all AOP-related processing (like checking pointcut rules) and calls the original method directly. This eliminates proxy overhead for the vast majority of method calls that don't need advice, significantly improving performance.
-   **When is it NOT needed?**: This annotation is **only** for bean method joinpoints. For **activity-level AOP** (where the pointcut targets a translet name), this annotation is not necessary because the advice is triggered by the activity's lifecycle, not a method proxy.

```java
import com.aspectran.core.component.bean.annotation.Advisable;

public class MyService {
    @Advisable
    public void doTransactionalWork() {
        // This method can be advised by an aspect.
    }

    public void doSimpleWork() {
        // This method will NOT be advised, even if a pointcut matches.
    }
}
```

### 3.4. Exception Handling in Aspects (`<exception>`)

In addition to the main advice logic, an `<aspect>` can contain an `<exception>` block to define dedicated exception handling advice. This provides a clean way to manage cross-cutting error handling, such as logging or transforming exceptions, without cluttering the main advice bean.

The `<exception>` block contains one or more `<thrown>` elements, each configured to catch a specific exception `type`.

```xml
<aspect id="serviceLayerExceptionAspect">
    <joinpoint>
        pointcut: {
            +: **@*Service^**
        }
    </joinpoint>
    <advice bean="loggingAdviceBean"/> <!-- Can have other advice -->
    <exception>
        <description>Catches DataAccessExceptions from any service method and transforms them into a user-friendly error.</description>
        <thrown type="com.example.app.exceptions.DataAccessLayerException">
            <!-- Forwards to a translet that renders a standard error page or JSON response -->
            <forward translet="/error/databaseError"/>
        </thrown>
        <thrown> <!-- Catches any other exception -->
            <invoke bean="errorLoggingService" method="logGenericError"/>
        </thrown>
    </exception>
</aspect>
```
In this example:
-   If a service method throws a `DataAccessLayerException`, the request is forwarded to the `/error/databaseError` translet.
-   If any other exception is thrown, the `logGenericError` method on the `errorLoggingService` bean is invoked.

### 3.5. AOP Examples

**Example 1: Activity-level Request Logging**

This aspect logs requests for all translets under `/api/`. No `@Advisable` annotation is needed.

*Step 1: Advice Bean*
```java
package com.example.app.aop;

import com.aspectran.core.activity.Activity;
import com.aspectran.core.util.logging.Logger;
import com.aspectran.core.util.logging.LoggerFactory;

public class RequestLoggingAdvice {

    private static final Logger logger = LoggerFactory.getLogger(RequestLoggingAdvice.class);

    public void startLog(Activity activity) {
        logger.info(">> Request received for: " + activity.getTransletName());
    }

    public void endLog(Activity activity) {
        logger.info("<< Request finished for: " + activity.getTransletName());
    }
}
```

*Step 2: XML Configuration*
```xml
<bean id="requestLoggingAdvice" class="com.example.app.aop.RequestLoggingAdvice"/>

<aspect id="apiRequestLoggingAspect">
    <joinpoint>
        pointcut: {
            +: /api/**
        }
    </joinpoint>
    <advice bean="requestLoggingAdvice">
        <before>
            <invoke method="startLog"/>
        </before>
        <finally>
            <invoke method="endLog"/>
        </finally>
    </advice>
</aspect>
```

**Example 2: Bean-level Declarative Transaction**

This aspect applies transactions to methods on `orderService`. The target methods within `OrderService` must be annotated with `@Advisable`.

*Step 1: Mark Service Methods as Advisable*
```java
// com.example.app.services.OrderService
import com.aspectran.core.component.bean.annotation.Advisable;

public class OrderService {
    @Advisable
    public void createOrder(Order order) {
        // ... business logic ...
    }
}
```

*Step 2: XML Configuration*
```xml
<!-- 1. Advice Bean for transaction logic -->
<bean id="sqlSessionTxAdvice" class="com.aspectran.mybatis.SqlSessionAdvice" scope="prototype">
    <argument>#{sqlSessionFactory}</argument>
</bean>

<!-- 2. Service bean -->
<bean id="orderService" class="com.example.app.services.OrderService"/>

<!-- 3. Aspect to apply transactions -->
<aspect id="orderServiceTxAspect">
    <joinpoint>
        pointcut: {
            +: **@orderService^create*
        }
    </joinpoint>
    <advice bean="sqlSessionTxAdvice">
        <before>
            <invoke method="open"/>
        </before>
        <after>
            <invoke method="commit"/>
        </after>
        <finally>
            <thrown>
                <invoke method="rollback"/>
            </thrown>
            <invoke method="close"/>
        </finally>
    </advice>
</aspect>
```

## 4. Bean-related Elements (`<bean>`)

Defines a **bean**, which is a fundamental building block in Aspectran. A bean is an object that is instantiated, assembled, and otherwise managed by the Aspectran IoC (Inversion of Control) container. These beans and their dependencies are defined in the XML configuration file.

#### `<bean>` Attribute Details

-   `id`: A unique name to identify the bean. This ID is used to reference the bean from other parts of the configuration, typically using the expression `#{beanId}`.
-   `class`: The fully qualified class name (or a defined `<typeAlias>`) of the bean to be instantiated. This cannot be used with the `scan` attribute.
-   `scan`: Scans one or more base packages for classes to automatically register as beans. This is a powerful feature for component scanning, reducing the need for explicit XML definitions for every bean. You can use Ant-style wildcards (`*`, `**`).
-   `mask`: Used with the `scan` attribute. It defines a pattern to dynamically generate a bean ID from the fully qualified class name of a scanned class. The `*` in the mask is replaced by the part of the class name that matches the wildcard in the `scan` attribute.
-   `scope`: Specifies the lifecycle scope of the bean. The default is `singleton`.
    -   `singleton`: Only one instance of the bean is created per container. This is the default scope.
    -   `prototype`: A new instance is created every time the bean is requested.
    -   `request`: A new instance is created for each request. (Only applicable in a web or similar request-based environment).
    -   `session`: A new instance is created for each user session. (Only applicable in a web or similar session-based environment).
-   `factoryBean`: The ID of a factory bean to use for creating the current bean's instance. The container will call the `factoryMethod` on this factory bean.
-   `factoryMethod`: The name of the method to call to create the bean instance. This can be a static method (if `factoryBean` is not specified) or an instance method (if `factoryBean` is specified).
-   `initMethod`: Specifies a method to be called on the bean instance immediately after it is created and all its properties have been set. This is useful for custom initialization logic.
-   `destroyMethod`: Specifies a method to be called when the bean is being removed from the container (e.g., when the container is shutting down). Useful for releasing resources.
-   `lazyInit`: If `true`, the bean will be created only when it is first requested, rather than at application startup. This applies only to `singleton` beans. The default is `false`.
-   `important`: If `true`, this bean is marked as a primary candidate for dependency injection when multiple beans of the same type exist. The default is `false`.

### 4.1. Defining a Simple Bean

Here is the most basic way to define a bean. The Aspectran container will use the `class` attribute to instantiate the object using its default constructor.

```xml
<bean id="myService" class="com.example.app.MyServiceImpl"/>
```

### 4.2. Dependency Injection

Aspectran supports two main types of dependency injection: constructor injection and setter injection.

#### Constructor Injection with `<argument>`

You can provide arguments to a bean's constructor using the `<arguments>` or `<argument>` element.

```xml
<bean id="myService" class="com.example.app.MyServiceImpl">
    <arguments>
        <item value="Hello, Aspectran!"/>
        <item value="#{someOtherBean}"/>
    </arguments>
</bean>
```
Assuming `MyServiceImpl` has a constructor like `public MyServiceImpl(String message, SomeOtherBean otherBean)`.

#### Setter Injection with `<property>`

You can inject values into a bean's properties (via setter methods) using the `<properties>` or `<property>` element.

```xml
<bean id="dataSource" class="com.example.app.SimpleDataSource">
    <property name="driver" value="com.mysql.cj.jdbc.Driver"/>
    <property name="url" value="jdbc:mysql://localhost:3306/mydb"/>
    <properties profile="dev">
        <item name="username" value="sa"/>
        <item name="password" value=""/>
    </properties>
    <properties profile="prod">
        <item name="username" value="sa"/>
        <item name="password" value="secret"/>
    </properties>
</bean>
```
This assumes the `SimpleDataSource` class has methods like `setDriver(String)`, `setUrl(String)`, etc.

### 4.3. Component Scanning with `<bean scan="...">`

Instead of defining each bean individually in XML, you can instruct Aspectran to automatically discover and register them by scanning specified packages. This feature simplifies configuration, especially in large applications.

```xml
<!-- Scans all classes under com.example.app.services and its sub-packages -->
<bean scan="com.example.app.services.**"/>
```
Aspectran will scan the given package (and its sub-packages, thanks to `**`) and register the discovered classes as beans. By default, the bean ID is generated from the unqualified class name (e.g., `UserService` becomes `userService`).

To give scanned beans a predictable ID, you can use the `mask` attribute. For example, if you scan `com.example.app.services.UserService`, and you want the bean ID to be `userService`:

```xml
<!--
  Scans classes like 'com.example.app.services.UserService'
  and registers it with the ID 'userService'.
-->
<bean scan="com.example.app.services.*Service" mask="*Service"/>
```
In `mask`, the `*` acts as a placeholder for the part of the class name matched by `*` in the `scan` pattern. `*Service` will be converted to a camel-case bean ID, so `UserService` becomes `userService`.

### 4.4. Using a Factory Method

#### Static Factory Method

If a bean needs to be created by calling a static method on another class.

```xml
<bean id="calendar" class="java.util.Calendar" factoryMethod="getInstance"/>
```

#### Instance Factory Method

If a bean needs to be created by calling a method on another bean (the factory bean).

```xml
<bean id="connectionFactory" class="com.example.app.ConnectionFactory"/>

<bean id="databaseConnection"
      factoryBean="connectionFactory"
      factoryMethod="createConnection"/>
```

### 4.5. Bean Lifecycle: `initMethod` and `destroyMethod`

You can specify methods to be called at certain points in a bean's lifecycle.

```xml
<bean id="resourceManager" class="com.example.app.ResourceManager"
      initMethod="initialize"
      destroyMethod="cleanup">
    <property name="resourcePath" value="/data/my-resource.dat"/>
</bean>
```
When `resourceManager` is created, `initialize()` is called after its `resourcePath` property is set. When the application shuts down, `cleanup()` is called.

### 4.6. `<filter>` for Component Scanning

When using `<bean scan="...">`, you can use `<filter>` to include or exclude specific classes based on patterns. The filter is written in APON format.

```xml
<bean scan="com.example.app.**">
    <filter>
        exclude: [
            *.*Repository
        ]
    </filter>
</bean>
```
This example scans the `com.example.app` package and all its sub-packages, but excludes any class whose name ends with `Repository`.

## 5. Translet-related Elements (`<translet>`)

A **translet** is the core unit of work in Aspectran that defines how to handle a request and generate a response. It maps a request name (often a URL in web applications) to a series of actions and a view.

#### `<translet>` Attribute Details

-   `name` (required): A unique name to identify the translet. In a web environment, this is typically a URL path. You can use Ant-style wildcards (`*`, `**`) to map multiple URLs to a single translet.
-   `scan`: Scans for files in a specified directory (e.g., JSP, HTML files) to automatically create translets. This is useful for creating simple view-based translets without explicit definitions.
-   `mask`: Used with `scan`. It extracts a portion of the scanned file path to be used as the translet name.
-   `method`: Specifies the allowed request methods. In a web context, this corresponds to HTTP methods like `GET`, `POST`, `PUT`, `DELETE`. Multiple methods can be listed, separated by commas. If a request with an unsupported method arrives, a `405 Method Not Allowed` error is returned.
-   `async`: If `true`, the translet is processed asynchronously, and the request-handling thread is released immediately. This is useful for long-running tasks. The default is `false`.
-   `timeout`: Specifies the timeout in milliseconds (ms) for asynchronous processing.

### 5.1. `<request>`

Defines rules and parameters for the incoming request.

#### `<request>` Attribute Details

-   `method`: Same as the `method` attribute on `<translet>`. Defining it here can sometimes improve readability.
-   `encoding`: Specifies the character encoding for request parameters.

You can also define required parameters for the translet. If a required parameter is missing, Aspectran will automatically return a `400 Bad Request` error.

```xml
<translet name="/users/view" method="GET">
    <request>
        <!-- The 'userId' parameter is mandatory for this translet. -->
        <parameter name="userId" mandatory="true"/>
    </request>
    ...
</translet>
```

### 5.2. Content Section: Actions and Flow Control

The "content" section of a translet (represented by `<content>` or implicitly by its children) defines what work to perform.

-   **`<action>`**: Executes a method on a bean and optionally stores the result in an attribute.
    -   `id`: A name for the action's result attribute.
    -   `bean`: The ID of the bean to execute.
    -   `method`: The name of the method to call.
    -   `singleton`: if `false`, the action is not executed if an attribute with the same `id` already exists. Default is `true`.

    ```xml
    <!-- Call the 'getUser' method on the 'userService' bean -->
    <!-- The return value will be stored in an attribute named 'user' -->
    <action id="user" bean="userService" method="getUser">
        <!-- Pass the 'userId' request parameter to the method -->
        <argument value="@{userId}"/>
    </action>
    ```

-   **`<include>`**: Includes the content of another translet. This is useful for reusing common logic.
    -   `translet` (required): The name of the translet to include.

    ```xml
    <translet name="/api/orders/detail">
        <!-- First, execute a common authentication check -->
        <include translet="/common/authenticate"/>
        <!-- Then, perform the main logic -->
        <action id="order" bean="orderService" method="getOrderDetails"/>
        <transform format="json"/>
    </translet>
    ```

-   **`<choose>`, `<when>`, `<otherwise>`**: Implements conditional logic, similar to a switch statement.

    ```xml
    <choose>
        <when test="!@{user.isAdmin}">
            <!-- If the user is not an admin, forward to an error translet -->
            <forward translet="/error/unauthorized"/>
        </when>
        <otherwise>
            <!-- Otherwise, proceed to fetch sensitive data -->
            <action id="adminData" bean="adminService" method="getDashboardData"/>
        </otherwise>
    </choose>
    ```

-   **`<headers>`**: Sets HTTP response headers.

    ```xml
    <headers>
        <item name="Cache-Control" value="no-cache, no-store, must-revalidate"/>
        <item name="Pragma" value="no-cache"/>
    </headers>
    ```

-   **`<echo>`**: Directly writes the value of an attribute to the response body.

    ```xml
    <!-- Get a greeting message -->
    <action id="greeting" bean="greetingService" method="getGreeting"/>
    <!-- Output the message directly -->
    <echo>
        <item value="@{greeting}"/>
    </echo>
    ```

### 5.3. Response Section: Views and Redirections

The "response" section of a translet (represented by `<response>` or implicitly by its children) determines how to present the result to the client.

-   **`<transform>`**: Transforms an action's result (or another attribute) into a specific format, such as JSON or XML. This is the primary way to build REST APIs.
    -   `id`: The ID of the template to use for transformation.
    -   `format`: The output format (e.g., `json`, `xml`, `text`).
    -   `engine`: The template engine bean to use.
    -   `contentType`: The `Content-Type` of the response.
    -   `pretty`: If `true`, formats the output for readability (e.g., indented JSON).

    ```xml
    <translet name="/api/users/${userId}" method="GET">
        <action id="user" bean="userService" method="getUser" />
        <!-- Transform the 'user' attribute into a pretty-printed JSON response -->
        <transform format="json" pretty="true"/>
    </translet>
    ```

-   **`<dispatch>`**: Forwards the request to a view technology (like JSP, Thymeleaf, or Pebble) for rendering. The view can then access attributes set by `<action>`s.
    -   `name`: The name of the view template to render.
    -   `contentType`: The `Content-Type` of the response.

    ```xml
    <translet name="/users/profile" method="GET">
        <action id="user" bean="userService" method="getCurrentUser"/>
        <!-- Dispatch to 'profile.jsp' to render the view -->
        <dispatch name="profile.jsp"/>
    </translet>
    ```

-   **`<forward>`**: Forwards the request internally to another translet. The client's URL does not change.
    -   `translet` (required): The name of the target translet.

    ```xml
    <translet name="/legacy/user/info">
        <!-- This is an old URL. Forward it to the new one. -->
        <forward translet="/api/users/info"/>
    </translet>
    ```

-   **`<redirect>`**: Sends a redirect response to the client, telling it to request a new path.
    - `path` (required): The path to redirect to.

    ```xml
    <translet name="/login/process" method="POST">
        <action bean="authService" method="login"/>
        <!-- After successful login, redirect to the user's dashboard -->
        <redirect path="/dashboard"/>
    </translet>
    ```

### 5.4. Automatic Translet Creation with `<translet scan>`

For applications with many simple, view-based pages, defining a `<translet>` for each one can become repetitive. Aspectran provides a powerful `scan` feature to automatically generate translets by scanning a directory for view files (like JSP, Thymeleaf, Pebble, etc.).

-   `scan`: Specifies a base directory and a pattern (using Ant-style wildcards) to find files.
-   `mask`: Defines a pattern to extract a part of the scanned file's path to use as the translet's `name`. The portion of the path matched by the wildcard in the `mask` is captured.

**Example: Scanning for View Files**

Imagine you have a `webapp/WEB-INF/views` directory with the following structure:
```
/WEB-INF/views/
├── user/
│   ├── profile.jsp
│   └── list.jsp
└── index.jsp
```

You can create translets for all `.jsp` files with a single definition:
```xml
<!--
  This will create three translets:
  - name="/user/profile" -> dispatches to /WEB-INF/views/user/profile.jsp
  - name="/user/list"    -> dispatches to /WEB-INF/views/user/list.jsp
  - name="/index"        -> dispatches to /WEB-INF/views/index.jsp
-->
<translet scan="/WEB-INF/views/**/*.jsp" mask="/WEB-INF/views/**/*.jsp">
    <description>
        Automatically creates translets for all JSP files under the /WEB-INF/views/ directory.
        The translet name is derived from the file path, and the dispatch path is constructed using a wildcard pattern.
    </description>
    <dispatch name="/"/>
</translet>
```

**How it works:**
1.  The `scan` attribute finds all files ending with `.jsp` under `/WEB-INF/views`.
2.  For a file like `/WEB-INF/views/user/profile.jsp`, the `mask` `/WEB-INF/views/**/*.jsp` is applied. Excluding the literal parts of the `mask` pattern (`"/WEB-INF/views/"`, `".jsp"`), `"user/profile"` corresponding to the wildcard `**` is captured.
3.  This captured value (`"user/profile"`) becomes the base `name` of the translet. (Generally, a leading slash can be added according to global settings like `transletNamePrefix`, resulting in `"/user/profile"`.)

## 6. Schedule-related Elements (`<schedule>`)

Defines a **schedule rule** to execute tasks periodically or at a specific time according to a predefined schedule. A schedule rule represents a **group of jobs that share a single execution cycle (trigger)**. Aspectran has a powerful scheduling framework built into its core, based on the Quartz scheduler.

#### `<schedule>` Attribute Details

-   `id`: A unique ID to identify the schedule rule.

### 6.1. `<scheduler>` and `<trigger>`

The `<scheduler>` element specifies the scheduler bean that will handle this schedule rule and defines a `<trigger>`, which precisely controls when the job group is executed.

#### `<scheduler>` Attribute Details

-   `bean`: Specifies the ID of the scheduler bean that will handle this schedule rule. If not specified, the `defaultSchedulerBean` defined in `<settings>` will be used.

#### `<trigger>` Attribute Details

-   `type` (required): Specifies the trigger type. It supports two types: `simple` and `cron`.
-   The detailed properties of the trigger are written directly in the body of the `<trigger>` element using APON format.

#### `simple` Trigger

Used to repeat a task at simple intervals. It is suitable for scenarios like "start 10 seconds from now, and run every hour, for a total of 5 times."

-   **Main Attributes:**
    -   `startDelaySeconds`: The time to delay the first execution after the scheduler has started (in seconds).
    -   `intervalInSeconds`, `intervalInMinutes`, `intervalInHours`: The time interval for repetition.
    -   `repeatCount`: The number of times to repeat after the first execution (`-1` for infinite repeat).
    -   `repeatForever`: If set to `true`, repeats indefinitely.

-   **Example (XML):** Repeat indefinitely every hour.
    ```xml
    <schedule id="my-simple-schedule">
        <scheduler bean="mainScheduler">
            <trigger type="simple">
                startDelaySeconds: 10
                intervalInHours: 1
                repeatForever: true
            </trigger>
        </scheduler>
        <job translet="/batch/simple-task"/>
    </schedule>
    ```

#### `cron` Trigger

Used to execute tasks according to a complex calendar-related schedule, such as "every Friday at 5:30 PM" or "at 1 AM on the last day of every month."

-   **Main Attributes:**
    -   `expression`: A Cron expression string that defines the execution schedule.

-   **Example (XML):** Run every night at 11:50 PM.
    ```xml
    <schedule id="my-cron-schedule">
        <scheduler bean="mainScheduler">
            <trigger type="cron">
                expression: 0 50 23 * * ?
            </trigger>
        </scheduler>
        <job translet="/batch/daily-report"/>
    </schedule>
    ```

### 6.2. `<job>`

Specifies the actual task to be executed by the scheduler, i.e., the translet. You can define multiple `<job>` elements within a single `<schedule>` rule to execute several tasks in the same cycle.

#### `<job>` Attribute Details

-   `translet` (required): Specifies the name of the translet to be executed.
-   `disabled`: If set to `true`, the job is disabled. The default is `false`.

### 6.3. Full Configuration Example

The following is a complete example that defines a scheduler bean and uses it to execute two batch translets at a specific time every day.

```xml
<!-- 1. Define a Quartz-based scheduler bean -->
<bean id="mainScheduler" class="com.aspectran.core.scheduler.support.QuartzSchedulerFactoryBean">
    <property type="properties" name="quartzProperties">
        <entry name="org.quartz.scheduler.instanceName">MainScheduler</entry>
        <entry name="org.quartz.threadPool.threadCount">10</entry>
    </property>
</bean>

<!-- 2. Define a schedule rule -->
<schedule id="daily-batch">
    <description>Performs daily report generation and log archiving at midnight every day.</description>

    <!-- Execution cycle: every day at midnight -->
    <scheduler bean="mainScheduler">
        <trigger type="cron">
            expression: 0 0 0 * * ?
        </trigger>
    </scheduler>

    <!-- List of jobs to execute -->
    <job translet="/batch/daily-report-generator"/>
    <job translet="/batch/log-archiver"/>
</schedule>
```
In the configuration above, the `daily-batch` schedule is managed by `mainScheduler`. According to the Cron expression, it sequentially executes the two translets, `/batch/daily-report-generator` and `/batch/log-archiver`, every day at midnight.

## 7. Template-related Elements (`<template>`)

Defines reusable templates at the top level. The defined template can be referenced and rendered anywhere in the application using the `~{templateId}` token.

#### `<template>` Attribute Details

-   `id`: A unique ID to identify the template.
-   `engine`: Specifies the ID of the template engine bean to use.
    -   If omitted or set to `token` (default), Aspectran's built-in token engine is used to parse `${...}` and `@{...}` tokens.
    -   If set to `none`, the content is treated as raw text.
    -   Otherwise, it specifies the ID of an external template engine bean (e.g., FreeMarker, Pebble).
-   `name`: Specifies the name or path of the template.
-   `file`: Specifies the template file based on a file system path.
-   `resource`: Specifies the template resource based on a classpath path.
-   `url`: Specifies a remote template via a URL.
-   `style`: Specifies the style if using an APON-formatted template (`apon`, `compact`, `compressed`).
    -   `apon`: Preserves indentation and line breaks using the pipe (`|`) character.
    -   `compact`: Removes unnecessary whitespace from JSON or XML.
    -   `compressed`: Removes all non-essential whitespace to minimize size.
-   `contentType`: Specifies the `Content-Type` of the template result.
-   `encoding`: Specifies the character encoding of the template file.
-   `noCache`: If set to `true`, the template is not cached. The default is `false`.

### 7.1. Example: Defining a Reusable Token Template

This example defines a simple text template using the `apon` style for readability and token expressions for dynamic values.

```xml
<!-- Define a reusable template at the top level -->
<template id="welcomeMailTemplate" style="apon">
    |Dear @{user^name},
    |
    |Welcome to Aspectran!
    |Your current point balance is: #{pointService^points}
    |
    |Best regards,
    |The Aspectran Team
</template>
```

### 7.2. Example: Using a Template in a Translet

You can use the `~{templateId}` token to render the defined template within a `<transform>` action.

```xml
<translet name="/mail/welcome">
    <action id="user" bean="userService" method="getUser"/>
    <transform format="text">
        <template>~{welcomeMailTemplate}</template>
    </transform>
</translet>
```
In this example, when `/mail/welcome` is requested, the `welcomeMailTemplate` is rendered. The `@{user^name}` and `#{pointService^points}` tokens inside the template are evaluated, and the resulting text is returned as the response.

## 8. Exception Handling (`<exception>`)

Aspectran provides a decentralized way to handle exceptions declaratively, defining handlers within the context where an error might occur. This is done using the `<exception>` element, which can be defined inside a `<translet>` or an `<aspect>`. There is no single, top-level global exception handler block; instead, handlers are co-located with the rules they protect.

### 8.1. Exception Handling in Translets

You can define an `<exception>` block directly inside a `<translet>` to handle exceptions that occur during its execution. This is useful for translet-specific error responses, such as returning a custom JSON error message for an API endpoint.

The `<exception>` block contains one or more `<thrown>` elements, each configured to catch specific exception types.

-   **`<thrown>`**: Defines a handler for one or more exception types.
    -   `type` (optional): A comma-separated list of fully qualified exception class names.
    -   If `type` is omitted, the `<thrown>` block acts as a default handler for any exceptions not caught by other, more specific handlers in the same `<exception>` block.

Inside a `<thrown>` block, you can define a response using elements like `<transform>`, `<dispatch>`, or `<forward>`.

**Example: API Exception Handling in a Translet**

```xml
<translet name="/api/users/${userId}">
    <action id="user" bean="userService" method="getUserById"/>
    <transform format="json"/>

    <!-- Exception handling specific to this translet -->
    <exception>
        <thrown type="com.example.app.exceptions.UserNotFoundException">
            <!-- Forward to a generic 404-response translet -->
            <forward translet="/error/404"/>
        </thrown>
        <thrown type="java.lang.IllegalArgumentException">
            <transform format="json">
                <template>
                    { "error": "Invalid Argument", "message": "The user ID must be a number." }
                </template>
            </transform>
        </thrown>
    </exception>
</translet>
```
> **Note on HTTP Status Codes**: In a web context (using `aspectran-web`), you can typically use a `<status>` element inside a `<response>` block to set the HTTP status code, as shown in the `IllegalArgumentException` handler. This feature is specific to the web environment and is not part of the core XML definition. The more general approach is to `<forward>` to a dedicated error-handling translet.

### 8.2. Exception Handling in Aspects

Exception handling can also be defined within an `<aspect>`. This allows you to centralize exception handling logic that applies across multiple joinpoints (translets or bean methods), making it a powerful tool for cross-cutting concerns like logging or security.

**Example: Centralized Service Layer Exception Logging**

```xml
<aspect id="serviceLayerExceptionLogger">
    <joinpoint>
        pointcut: {
            +: **@*Service^**
        }
    </joinpoint>
    <exception>
        <description>Catches all exceptions in the service layer and logs them.</description>
        <thrown>
            <action bean="exceptionLoggingAdvice" method="logException"/>
        </thrown>
    </exception>
</aspect>

<bean id="exceptionLoggingAdvice" class="com.example.app.aop.ExceptionLoggingAdvice"/>
```
In this example, any exception thrown from a method in a bean whose ID ends with "Service" will be caught. The aspect then invokes the `logException` method on the `exceptionLoggingAdvice` bean to log the error, without stopping the exception from propagating further (unless the advice itself forwards to another translet).
