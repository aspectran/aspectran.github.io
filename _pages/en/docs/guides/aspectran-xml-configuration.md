---
format: plate solid article
sidebar: toc-left
title: Aspectran XML Configuration Guide
subheadline: User Guides
parent_path: /docs
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
    <description>Defines the global settings for the application.</description>
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
    <properties>
        <item name="db.driver" value="org.h2.Driver"/>
        <item name="db.url" value="jdbc:h2:mem:devdb"/>
    </properties>
</environment>

<!-- Environment settings to be applied when the 'prod' profile is active -->
<environment profile="prod">
    <properties>
        <item name="db.driver" value="com.mysql.cj.jdbc.Driver"/>
        <item name="db.url" value="jdbc:mysql://prod.db.server/main"/>
    </properties>
</environment>
```

### 1.6. `<append>`

Includes other XML or APON configuration files into the current configuration, allowing for modularization of settings.

#### `<append>` Attribute Details

-   `file`: Includes a file based on a file system path.
-   `resource`: Includes a resource based on a classpath path.
-   `url`: Includes a remote file via a URL.
-   `format`: Specifies the format of the file to be included (`xml` or `apon`). If omitted, it is auto-detected based on the file extension. If there is no extension, `xml` is the default.
-   `profile`: Includes the file only when a specific profile is active.

```xml
<!-- Include a common bean configuration file -->
<append resource="config/common-beans.xml"/>

<!-- Include a metrics-related configuration file only in the 'prod' profile -->
<append resource="config/metrics-context.xml" profile="prod"/>
```

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
-   `tokenize`: If set to `true`, the string in the `value` attribute is split by a delimiter (default: `,`) to create an array or list.
-   `mandatory`: If set to `true`, it indicates that the item is a required value (mainly used in `<parameter>`).
-   `secret`: If set to `true`, the value of the item is managed in an encrypted state.

### 2.2. Wrapper Elements for Applying Profiles

When you need to group multiple items and apply a `profile` to the entire group, you use wrapper elements. A characteristic of these wrapper elements is that they can only have `<item>` elements as children.

-   **`<parameters>`**: Groups multiple request parameters (`<item>`).
-   **`<attributes>`**: Groups multiple context attributes (`<item>`).
-   **`<arguments>`**: Groups multiple constructor arguments (`<item>`).
-   **`<properties>`**: Groups multiple bean properties (`<item>`).

## 3. Aspect-related Elements (`<aspect>`)

Defines an **aspect** for AOP (Aspect-Oriented Programming). An aspect is a modularization of a cross-cutting concern that is repeated in multiple places, and it is composed of a combination of `Advice` and `Pointcut`.

#### `<aspect>` Attribute Details

-   `id`: A unique ID to identify the aspect.
-   `order`: Specifies the execution order when multiple aspects are applied to the same joinpoint. A lower number means higher priority.
-   `isolated`: If set to `true`, the advice executed within this aspect is not affected by other aspects. The default is `false`.
-   `disabled`: If set to `true`, this aspect is disabled. The default is `false`.

### 3.1. `<joinpoint>`

Defines a **pointcut** expression that specifies the location where the advice will be applied, i.e., the **joinpoint**.

#### `<joinpoint>` Attribute Details

-   `target`: Specifies the target of the pointcut (`method` or `activity`). The default is `method`.
    -   `method`: Specifies the execution of a bean's method as the joinpoint.
    -   `activity`: Specifies the execution of the translet itself as the joinpoint.
-   `pointcut` (required): Specifies the joinpoint in detail using a pointcut expression.

### 3.2. `<advice>`

Defines the actual logic to be executed at the joinpoint, i.e., the **advice**.

#### `<advice>` Attribute Details

-   `bean` (required): Specifies the ID of the bean that contains the advice logic.

## 4. Bean-related Elements (`<bean>`)

Defines a **bean**, which is an object created and managed by the IoC (Inversion of Control) container.

#### `<bean>` Attribute Details

-   `id`: A unique name to identify the bean. You can use this ID to reference it from other beans or configurations in the form `#{beanId}`.
-   `class`: Specifies the fully qualified name or alias of the class to be created as a bean. Cannot be used with the `scan` attribute.
-   `scan`: Scans for classes in the specified package path and automatically registers them as beans. You can use Ant-style wildcards (`*`, `**`).
-   `mask`: Used with the `scan` attribute. It extracts a part of the fully qualified name of the scanned class that matches the `mask` pattern to dynamically generate a bean ID.
-   `scope`: Specifies the lifecycle scope of the bean (`singleton`, `prototype`, `request`, `session`). The default is `singleton`.
-   `factoryBean`: When creating the current bean using another bean as a factory, specifies the ID of the factory bean.
-   `factoryMethod`: Specifies the name of the static or instance method to be called to create the bean's instance.
-   `initMethod`: Specifies the initialization method to be called after the bean is created and its properties are injected.
-   `destroyMethod`: Specifies the destruction method to be called when the bean is destroyed.
-   `lazyInit`: If set to `true`, it delays the creation of the bean until it is first used. (Applies only to singleton scope). The default is `false`.
-   `important`: If set to `true`, it becomes a priority candidate for injection when there are other beans of the same type during dependency injection. The default is `false`.

### 4.1. `<filter>`

When batch-registering beans using `<bean scan="...">`, this defines a filter in APON format to include or exclude only classes that meet certain conditions.

## 5. Translet-related Elements (`<translet>`)

Defines a **translet**, which is the core unit of work that processes user requests.

#### `<translet>` Attribute Details

-   `name` (required): A unique name to identify the translet. In a web environment, a URL path is often used, and wildcards `*`, `**` can be used.
-   `scan`: Scans files at the specified path (e.g., JSP, HTML) to dynamically create translets.
-   `mask`: Used with the `scan` attribute, it extracts a specific pattern from the file path to be used as the translet name.
-   `method`: Specifies the allowed request methods. In a web environment, this corresponds to HTTP request methods like `GET`, `POST`, etc. Multiple methods can be specified, separated by commas.
-   `async`: If set to `true`, the translet is processed asynchronously. The default is `false`.
-   `timeout`: Specifies the timeout in milliseconds (ms) for asynchronous processing.

### 5.1. `<request>`

Defines rules for the request.

#### `<request>` Attribute Details

-   `method`: Specifies the allowed request methods. It has the same role as the `method` attribute of `<translet>`.
-   `encoding`: Specifies the character encoding of the request parameters.

### 5.2. Execution and Flow Control Elements

-   **`<action>`**: Executes a method of a specified bean.
-   **`<include>`**: Includes and executes the processing content of another translet at the current location.
-   **`<choose>`, `<when>`, `<otherwise>`**: Executes different flows based on conditions.
-   **`<headers>`**: Sets HTTP response headers.
-   **`<echo>`**: Directly outputs the value of a specified attribute to the response.

### 5.3. Response Processing Elements

-   **`<transform>`**: Transforms the result of an action into a specific format (JSON, XML, etc.) and responds.
-   **`<dispatch>`**: Forwards the request to a view template (JSP, etc.) to respond with the rendered result.
-   **`<forward>`**: Forwards the current request to another translet to delegate processing.
-   **`<redirect>`**: Sends a redirect response to the client to re-request a specified URL.

## 6. Schedule-related Elements (`<schedule>`)

Defines a **schedule** to execute tasks at a specific time or periodically.

#### `<schedule>` Attribute Details

-   `id`: A unique ID to identify the schedule.

### 6.1. `<scheduler>` and `<trigger>`

Specifies the scheduler bean to execute the schedule and defines the execution time via `<trigger>`.

#### `<trigger>` Attribute Details

-   `type` (required): The trigger type. Currently, only `cron` is supported.
-   `expression` (required): Defines the execution time in detail using a Cron expression.

### 6.2. `<job>`

Specifies the actual task to be executed by the scheduler, i.e., the translet.

#### `<job>` Attribute Details

-   `translet` (required): Specifies the name of the translet to be executed.
-   `disabled`: If set to `true`, the job is disabled. The default is `false`.

## 7. Template-related Elements (`<template>`)

Defines reusable templates at the top level.

#### `<template>` Attribute Details

-   `id`: A unique ID to identify the template.
-   `engine`: Specifies the ID of the template engine bean to use.
-   `name`: Specifies the name or path of the template.
-   `file`: Specifies the template file based on a file system path.
-   `resource`: Specifies the template resource based on a classpath path.
--   `url`: Specifies a remote template via a URL.
-   `style`: Specifies the style if using an APON-formatted template (`apon`, `compact`, `compressed`).
-   `contentType`: Specifies the `Content-Type` of the template result.
-   `encoding`: Specifies the character encoding of the template file.
-   `noCache`: If set to `true`, the template is not cached. The default is `false`.