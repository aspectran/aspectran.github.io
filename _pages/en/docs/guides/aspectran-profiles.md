---
format: plate solid article
sidebar: toc
title: Aspectran Profiles
subheadline: User Guides
parent_path: /docs
---

Aspectran's Profiles feature is a powerful function that allows you to enable or disable all or part of an application's configuration only in a specific environment. For example, it can be usefully employed when you need to apply different database settings or load specific beans for 'development', 'test', and 'production' environments.

## Activating Profiles

Profiles can be easily activated through JVM System Properties. The main properties used are as follows:

- `aspectran.profiles.active`: Specifies the currently active profiles. If specifying multiple profiles, separate them with a comma (`,`).
- `aspectran.profiles.default`: Specifies the default profile to be activated if `aspectran.profiles.active` is not specified.
- `aspectran.profiles.base`: Specifies the base profile that should always be active.

**Examples:**

Here is a command-line example for running an application with the `dev` profile activated.

```bash
java -Daspectran.profiles.active=dev -jar my-application.jar
```

Here is an example of activating two profiles, `prod` and `metrics`, simultaneously.

```bash
java -Daspectran.profiles.active=prod,metrics -jar my-application.jar
```

## Conditional Configuration with Profiles

In most elements within Aspectran's configuration file (XML-based), you can use the `profile` attribute to apply that setting only when a specific profile is active.

- The `profile` attribute can be used in various configuration elements such as `<bean>`, `<arguments>`, `<properties>`, `<environment>`, and `<append>`.
- If the profile expression specified in the `profile` attribute matches the currently active profile, the corresponding element is activated.
- If it does not match, that element and all its child elements are ignored.

```xml
<aspectran>

    <!-- Properties applied only when the 'dev' profile is active -->
    <properties profile="dev">
        <property name="db.driver">org.h2.Driver</property>
        <property name="db.url">jdbc:h2:mem:testdb</property>
        <property name="db.username">sa</property>
        <property name="db.password"></property>
    </properties>

    <!-- Properties applied only when the 'prod' profile is active -->
    <properties profile="prod">
        <property name="db.driver">com.mysql.cj.jdbc.Driver</property>
        <property name="db.url">jdbc:mysql://localhost:3306/prod_db</property>
        <property name="db.username">prod_user</property>
        <property name="db.password">prod_password</property>
    </properties>

    <!-- Include this configuration file only when the 'prod' profile is active -->
    <append file="/config/metrics-context.xml" profile="prod"/>

</aspectran>
```

## Profile Expressions

In addition to simple profile names, you can use logical operators to express complex conditions.

- **`!` (NOT)**: When a specific profile is not active
  ```xml
  <!-- Applied only when the 'demo' profile is not active -->
  <bean id="someBean" class="com.example.SomeBean" profile="!demo"/>
  ```

- **`()` (AND)**: When all profiles within the parentheses are active
  ```xml
  <!-- Applied only when both 'prod' and 'metrics' profiles are active -->
  <bean id="metricsExporter" class="com.example.MetricsExporterBean" profile="(prod, metrics)"/>
  ```

- **`[]` (OR)**: When at least one of the profiles within the square brackets is active (separating with a comma `,` also works as OR)
  ```xml
  <!-- Applied when either 'dev' or 'test' profile is active -->
  <bean id="testHelper" class="com.example.TestHelperBean" profile="[dev, test]"/>
  ```

- **Composite Expressions**: You can create complex conditions by combining multiple operators.
  ```xml
  <!-- Applied when none of the 'rss-lettuce', 'rss-lettuce-masterreplica', 'rss-lettuce-cluster' profiles are active -->
  <properties profile="(!rss-lettuce, !rss-lettuce-masterreplica, !rss-lettuce-cluster)">
      <!-- ... -->
  </properties>
  ```

## Usage Example: Environment-specific Database Configuration

Here is a complete example of setting different database connection information according to `dev` and `prod` environments.

**`config/root-context.xml`**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<aspectran>

    <description>Loads different DB settings depending on the environment.</description>

    <!-- Development environment settings -->
    <properties profile="dev">
        <property name="db.driver">org.h2.Driver</property>
        <property name="db.url">jdbc:h2:mem:devdb;DB_CLOSE_DELAY=-1</property>
        <property name="db.username">sa</property>
        <property name="db.password"></property>
    </properties>

    <!-- Production environment settings -->
    <properties profile="prod">
        <property name="db.driver">com.mysql.cj.jdbc.Driver</property>
        <property name="db.url">jdbc:mysql://prod.db.server:3306/main_db</property>
        <property name="db.username">prod_db_user</property>
        <property name="db.password">!PROD_DB_PASSWORD!</property>
    </properties>

    <!-- Data source bean definition -->
    <bean id="dataSource" class="com.zaxxer.hikari.HikariDataSource">
        <properties>
            <item name="driverClassName" value="${db.driver}"/>
            <item name="jdbcUrl" value="${db.url}"/>
            <item name="username" value="${db.username}"/>
            <item name="password" value="${db.password}"/>
        </properties>
    </bean>

</aspectran>
```

**Running the Application:**

- **Run in development environment:** Activating the `dev` profile uses the H2 in-memory database.
  ```bash
  java -Daspectran.profiles.active=dev -jar my-app.jar
  ```

- **Run in production environment:** Activating the `prod` profile uses the MySQL database.
  ```bash
  java -Daspectran.profiles.active=prod -jar my-app.jar
  ```

By using Aspectran's Profiles feature, you can easily respond to multiple environments just by changing the configuration without any code changes.
