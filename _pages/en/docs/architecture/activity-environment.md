---
format: plate solid article
sidebar: toc
title: "Environment: Controlling Environments with Profiles and Properties"
subheadline: Architecture
parent_path: /docs
---

The `com.aspectran.core.context.env` package plays a key role in managing the execution environment of an Aspectran application. It primarily supports flexible configuration and deployment for various environments (development, testing, production, etc.) through two main concepts: **Profiles** and **Properties**.

## 1. Key Classes and Roles

-   **`Environment` (Interface)**
    -   The top-level interface that defines the standard way to access the application environment.
    -   It provides functions to check the active profiles (`getActiveProfiles()`) and default profiles (`getDefaultProfiles()`), and a `acceptsProfiles(Profiles profiles)` method to check if a specific profile expression matches the current environment.
    -   It defines the `getProperty()` method to retrieve property values set in the environment.

-   **`ActivityEnvironment` (Implementation)**
    -   The core implementation of the `Environment` interface, providing the actual environment information within the `ActivityContext`.
    -   It internally delegates profile-related functions to an `EnvironmentProfiles` object and handles dynamic property value evaluation through `PropertyToken` and `ItemEvaluator`.

-   **`EnvironmentProfiles`**
    -   A class that manages environment profiles such as `development`, `production`, and `test`.
    -   Profiles can be set through system properties (`aspectran.profiles.active`, `aspectran.profiles.default`) or the `setActiveProfiles()` method.

-   **`Profiles` (Functional Interface) and `ProfilesParser`**
    -   Responsible for parsing and matching profile expressions.
    -   It supports logical operators like `!` (NOT), `&` (AND), and `|` (OR), allowing for the use of complex profile conditions such as `(p1 & p2) | !p3`. This enables very flexible control, allowing specific beans or configurations to be activated only in certain environment combinations.

## 2. Separating Configurations with Profiles

Profiles are a feature that groups beans and properties to be activated only in a specific environment. For example, you can separate configurations to use an in-memory DB in the development environment and a commercial DB in the production environment.

### Configuration Example (XML)

```xml
<!-- H2 datasource bean registered only when the dev profile is active -->
<bean id="dataSource" class="com.zaxxer.hikari.HikariDataSource" profile="dev">
    <properties>
        <item name="driverClassName">org.h2.Driver</item>
        <item name="jdbcUrl">jdbc:h2:mem:testdb</item>
        <item name="username">sa</item>
    </properties>
</bean>

<!-- MySQL datasource bean registered only when the prod profile is active -->
<bean id="dataSource" class="com.zaxxer.hikari.HikariDataSource" profile="prod">
    <properties>
        <item name="driverClassName">com.mysql.cj.jdbc.Driver</item>
        <item name="jdbcUrl">jdbc:mysql://localhost:3306/prod_db</item>
        <item name="username">prod_user</item>
        <item name="password">prod_password</item>
    </properties>
</bean>
```

When running the application, if you provide a JVM option like `-Daspectran.profiles.active=prod`, `EnvironmentProfiles` detects this, activates the `prod` profile, and only the MySQL datasource bean is registered in the `ActivityContext`.

## 3. Property Management

`Environment` provides a hierarchical structure for managing configuration values to be used throughout the application.

### Property Priority

Property values have a high priority in the following order:

1.  **System Properties**: `System.getProperties()` - Properties defined at the JVM level.
2.  **Environment Variables**: `System.getenv()` - Environment variables defined at the operating system level.
3.  **Defined in Configuration File**: Properties defined directly in the Aspectran configuration file through the `<properties>` element.

### Dynamic Property Evaluation

One of the major features of `ActivityEnvironment` is that property values can be evaluated dynamically at the time of `Activity` execution. This means that beyond simple key-value pairs, you can create dynamic property values by referencing the properties of other beans or the parameters of a translet.

```xml
<properties>
    <!-- References the 'path' property of the bean named 'uploadPath' -->
    <item name="file.upload-path" value="#{bean:uploadPath.path}/uploads"/>

    <!-- References the 'userId' parameter of the current translet -->
    <item name="user.home.dir" value="/home/#(param:userId)"/>
</properties>
```

In the application code, you just need to call `environment.getProperty("file.upload-path")`, and `ActivityEnvironment` will internally evaluate the expression through `ItemEvaluator` and return the final value.

## 4. Conclusion

The `com.aspectran.core.context.env` package is a key part of implementing the good software design principle of **separation of concerns based on the environment** in the Aspectran framework. It enables different component configurations for each environment through profiles and provides flexible environmental response capabilities that go beyond static configuration files through hierarchical and dynamic property management.
