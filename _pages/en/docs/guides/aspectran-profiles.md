---
title: Aspectran Profiles
subheadline: Core Guides
---

Aspectran's Profiles feature is a powerful tool that allows you to enable or disable parts of an application's configuration only in specific environments. It is especially useful when you need to use different database connection information or bean configurations depending on the execution environment, such as development (dev), testing (test), or production (prod).

This document provides a detailed guide, covering everything from profile activation and conditional configuration using XML and annotations to a practical real-world example.

## 1. Activating Profiles

You can specify which profiles to activate when running an application through JVM System Properties. Aspectran provides three main properties:

### 1.1. Main Properties

*   **`aspectran.profiles.active`**: Specifies the name of the profiles to activate. To activate multiple profiles simultaneously, list them separated by a comma (`,`).
*   **`aspectran.profiles.default`**: Specifies the default profile to be activated if `aspectran.profiles.active` is not set.
*   **`aspectran.profiles.base`**: Specifies the base profile that should always be active regardless of the execution environment.

### 1.2. Execution Examples

**Activating a single profile:**
Run the application with the `dev` profile active.
```bash
java -Daspectran.profiles.active=dev -jar my-application.jar
```

**Activating multiple profiles:**
Run the application with both `prod` and `metrics` profiles active simultaneously.
```bash
java -Daspectran.profiles.active=prod,metrics -jar my-application.jar
```

## 2. Profile Expression Syntax

In addition to simply writing a profile name, you can use logical operators to create complex activation conditions.

### 2.1. Logical Operators

*   **`!` (NOT)**: Indicates the condition is met when a specific profile is **not** active.
    - Example: `profile="!dev"` (Active when dev is NOT active)
*   **`()` (AND)**: Indicates that **all** listed profiles in the parentheses must be active.
    - Example: `profile="(prod, metrics)"` (Active when both prod AND metrics are active)
*   **`[]` (OR)**: Indicates that the condition is met if **at least one** of the listed profiles is active.
    - Example: `profile="[dev, test]"` (Active when either dev OR test is active)
*   **Default Operation (OR)**: Listing profiles separated by a comma without a symbol is treated as an OR operation.
    - Example: `profile="dev, test"` (Active when either dev OR test is active)

### 2.2. Syntax Summary Examples

| Expression | Description |
| :--- | :--- |
| `dev` | When the `dev` profile is active |
| `!dev` | When the `dev` profile is not active |
| `dev, test` | When either `dev` or `test` profile is active (OR) |
| `(prod, metrics)` | When both `prod` and `metrics` profiles are active (AND) |
| `!(prod, metrics)` | When both `prod` and `metrics` are not active at the same time |
| `[(dev, test), prod]` | When (both `dev` and `test` are active) **OR** `prod` is active |

## 3. Conditional Configuration in XML

In XML configuration files, you use the `profile` attribute on various elements to apply conditional settings. However, it is important to note that not all elements support the `profile` attribute directly.

### 3.1. Supported Elements and Wrapper Elements

The following elements in Aspectran's XML schema can have the `profile` attribute directly:
*   `<arguments>`, `<properties>`, `<parameters>`, `<attributes>`, `<environment>`, `<append>`

**CRITICAL NOTE:**
Individual elements such as `<bean>`, `<property>`, `<parameter>`, `<attribute>`, and `<argument>` **do not directly support** the `profile` attribute. To apply a profile to these items, you must use their corresponding **wrapper elements**.

Each wrapper element serves the following purpose:

*   **`<arguments>`**: A group of constructor arguments for a bean.
*   **`<properties>`**: A group of properties for a bean or an action.
*   **`<parameters>`**: A group of request parameters.
*   **`<attributes>`**: A group of request attributes.

These wrapper elements can contain multiple `<item>` elements, and all items within them become valid only when the profile specified on the wrapper element is active.

### 3.2. Grouping with Wrapper Elements Example

If you want to activate multiple properties only in a specific profile, use the `<properties>` wrapper element and place `<item>` elements inside it. Note that a standalone `<property>` and an `<item>` inside a wrapper perform the same role; they simply have different names.

```xml
<aspectran>
    <!-- Property group active only in the 'dev' profile -->
    <properties profile="dev">
        <item name="service.url">http://dev.api.example.com</item>
        <item name="debug.mode">true</item>
    </properties>

    <!-- Property group active only in the 'prod' profile -->
    <properties profile="prod">
        <item name="service.url">https://api.example.com</item>
        <item name="debug.mode">false</item>
    </properties>
</aspectran>
```

### 3.3. Registering Beans by Profile (`<append>`)

Since the `<bean>` element does not support the `profile` attribute, if you need to register completely different beans depending on the environment, you should separate the configuration files and use the `<append>` element.

```xml
<aspectran>
    <!-- Includes settings from dev-beans.xml only when the 'dev' profile is active -->
    <append resource="config/dev-beans.xml" profile="dev"/>

    <!-- Includes settings from prod-beans.xml only when the 'prod' profile is active -->
    <append resource="config/prod-beans.xml" profile="prod"/>
</aspectran>
```

## 4. Conditional Configuration with Annotations

When defining beans in Java code, you can use the `@Profile` annotation to specify conditions very intuitively.

### 4.1. Class-level Configuration

Use `@Profile` alongside `@Component` to make an entire class be registered as a bean only in a specific profile.

```java
import com.aspectran.core.component.bean.annotation.Component;
import com.aspectran.core.component.bean.annotation.Profile;

@Component
@Profile("dev")
public class DevDataService implements DataService {
    // This class is registered in the bean container only when the 'dev' profile is active.
}
```

### 4.2. Method-level Configuration (`@Bean`)

You can also apply `@Profile` to factory methods within a configuration class.

```java
@Component
public class AppConfig {

    @Bean
    @Profile("prod")
    public DataSource dataSource() {
        // MySqlDataSource is created as a bean only in the 'prod' profile.
        return new MySqlDataSource();
    }

}
```

## 5. Practical Example: Environment-specific Database Configuration

The recommended approach is to use `PropertiesFactoryBean` to load different `.properties` files for each profile and reference them in other beans.

**`config/db.xml`**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<aspectran>
    <description>Configures database connection settings by environment.</description>

    <!-- 1. Bean that loads the appropriate configuration file based on the profile -->
    <bean id="dbProperties" class="com.aspectran.core.support.PropertiesFactoryBean">
        <properties>
            <!-- Set to ignore errors if the file is missing -->
            <item name="ignoreInvalidResource" valueType="boolean">true</item>
        </properties>
        
        <!-- Configuration file location for 'h2' profile -->
        <properties profile="h2">
            <item name="locations" type="array">
                <value>classpath:config/db/db-h2.properties</value>
            </item>
        </properties>
        
        <!-- Configuration file location for 'mysql' profile -->
        <properties profile="mysql">
            <item name="locations" type="array">
                <value>classpath:config/db/db-mysql.properties</value>
                <value>/config/external/db-prod.properties</value>
            </item>
        </properties>
    </bean>

    <!-- 2. Configure the actual Data Source using loaded properties -->
    <!-- Use expressions in the form of #{dbProperties^key} to reference values. -->
    <bean id="dataSource" class="com.zaxxer.hikari.HikariDataSource">
        <property name="driverClassName">#{dbProperties^driver}</property>
        <property name="jdbcUrl">#{dbProperties^url}</property>
        <property name="username">#{dbProperties^username}</property>
        <property name="password">#{dbProperties^password}</property>
    </bean>

</aspectran>
```

By leveraging Aspectran's Profiles feature like this, you can build applications that flexibly adapt to various execution environments through configuration and execution options alone, without any code changes.
