---
title: Aspectran Property Configuration and Utilization
subheadline: Core Guides
---

Aspectran provides a hierarchical property system that supports flexible configuration management based on execution environments, as well as runtime dynamic evaluation and caching. Developers can manage application settings through various injection paths.

## 1. Property Injection Methods

There are several paths for injecting properties from outside the application or from internal configuration files.

### 1.1. JVM System Properties (-D option)
This is the most common method, injecting properties in the form of `-Dproperty.name=value` when starting the Java application.

### 1.2. Deployment Configuration for Production (`app.conf`)
For Aspectow-based applications, properties can be managed through the `setup/app.conf` deployment configuration file. When startup scripts like `startup.sh` or `daemon.sh` are executed, they read the settings defined in this file and convert them into JVM system properties (VM Options) to run the process.

### 1.3. Initial Application Configuration (`aspectran-config.apon`)
Properties can be defined in the `system.properties` section within the `aspectran-config.apon` file, which is the core configuration for the application. The values defined here are internally registered via `System.setProperty()` during application startup.

```apon
system: {
    properties: {
        # Example: Setting for a specific system library
        jboss.threads.eqe.statistics: true
    }
}
```

## 2. Aspectran-specific Properties

These are reserved properties used to control the behavior of the Aspectran framework or to enable its core features.

### 2.1. Profile Control
Used to enable or disable configuration blocks based on the environment.
*   `aspectran.profiles.active`: Specifies the profiles to activate currently. (Multiple profiles can be separated by commas)
*   `aspectran.profiles.default`: The default profile applied when no active profile is specified.
*   `aspectran.profiles.base`: A base profile that is always active regardless of the environment.

### 2.2. Context-based Base Profiles
In a multi-context environment, you can specify a base profile to be applied only to a specific context.
*   **Syntax**: `-Daspectran.profiles.base.{contextName}={profileName}`
*   **Example**: `-Daspectran.profiles.base.appmon=mariadb` (Fixes the default DB setting for the `appmon` context to mariadb)

### 2.3. Framework Functional Settings
*   `aspectran.encryption.algorithm`: The algorithm used to decrypt encrypted values in configuration files. (Default: `PBEWithMD5AndTripleDES`)
*   `aspectran.encryption.password`: The password used for encryption and decryption.
*   `aspectran.properties.encoding`: The encoding used when loading property files. (Default: `UTF-8`)

## 3. Rule-based Environment Configuration (XML `<environment>`)

Properties are defined within XML rule files, and different sets of configurations can be organized for different environments using the `profile` attribute.

### 3.1. Profile Branching of the `<environment>` Element
By assigning a `profile` attribute to the `<environment>` tag itself, you can ensure that a specific set of properties is loaded only in a particular environment.

```xml
<!-- Property set active only in the production (prod) environment -->
<environment profile="prod">
    <property name="db.url">jdbc:mysql://prod-server:3306/prod_db</property>
</environment>

<!-- Property set active when not in the production environment -->
<environment profile="!prod">
    <property name="db.url">jdbc:h2:mem:testdb</property>
</environment>
```

### 3.2. Property Redefinition and Caching (Property Chaining)
When a property value definition refers to another property token (`%{...}`), Aspectran **caches** the result to ensure consistency. Redefining a property within another property is treated as an intent to fix the value in its evaluated state for subsequent use.

*   **How it works**: If a property definition contains **at least one property token (`%{...}`)**, the entire value is evaluated upon the first call, and the resulting value is stored in an internal cache for reuse. If the definition consists only of dynamic tokens like bean tokens (`#{...}`) or parameter tokens (`${...}`) without any property tokens, it is not cached and is re-evaluated on every call.
*   **Example**:

```xml
<environment profile="test">
    <!-- A source property that generates a new UUID on every call (not cached) -->
    <property name="db.name.uuid">#{method:java.util.UUID^randomUUID}</property>

    <!-- Defined as a fixed suffix by referencing the generated UUID.
         Contains a property token (%{...}), so it is cached and the value is fixed upon the first call. -->
    <property name="db.name.suffix">%{db.name.uuid}</property>

    <properties>
        <item name="petclinic.database.name">test_db_%{db.name.suffix}</item>
    </properties>
</environment>
```

## 4. Using PropertiesFactoryBean

`PropertiesFactoryBean` is a utility bean that integrates external `.properties` files into the Aspectran property system.

### 4.1. Key Features
*   **AsEL Support**: You can use `%{...}` tokens within loaded property files to reference other Aspectran properties, which are automatically replaced during initialization.
*   **Profile-based Path Specification**: You can dynamically change the path of the file to be loaded based on the active profile.

### 4.2. Configuration Example

```xml
<bean id="appmonAssets" class="com.aspectran.core.support.PropertiesFactoryBean">
    <properties>
        <!-- Configuration for whether to throw an error if the file is missing -->
        <item name="ignoreInvalidResource" valueType="boolean">false</item>
    </properties>

    <!-- When the production (prod) profile is active -->
    <properties profile="prod">
        <item name="locations" type="array">
            <value>/config/appmon/appmon-assets-prod.properties</value>
        </item>
    </properties>

    <!-- When the production profile is not active -->
    <properties profile="!prod">
        <item name="locations" type="array">
            <value>/config/appmon/appmon-assets-dev.properties</value>
        </item>
    </properties>
</bean>
```

### 4.3. File Path Rules
*   **`classpath:` prefix**: Searches for the file relative to the classpath root. (e.g., `classpath:config/db.properties`)
*   **No prefix**: Searches for the file relative to the application's base path. (e.g., `/config/appmon/assets.properties`)
