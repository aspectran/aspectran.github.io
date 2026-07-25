---
title: Aspectow Configuration Guide
teaser: A comprehensive guide systematically explaining the structure of Aspectow applications, how they are built, and how to configure core features for production operations.
subheadline: Aspectow
---

## 1. Introduction

This document is a technical guide for developers new to Aspectow or those seeking a deep understanding of its standard project structure. It systematically explains how Aspectow applications are structured, how they are built, and how to configure core features for actual operations.

Aspectow follows a well-defined project structure to enhance maintainability and scalability while clearly separating configuration roles. Through this guide, developers will understand the entire process from Aspectow's standard project structure to building and core configurations, gaining the knowledge required to develop and operate stable and efficient applications.

## 2. Standard Project Structure

Aspectow applications follow a standard directory structure to provide convenience and consistency throughout development, build, deployment, and operational phases. All directories are pre-created during project initialization, and the build process primarily populates the `app/lib` and `app/lib/ext` directories.

```
/
├── app/                  # Application Home Directory
│   ├── bin/              # Execution Scripts
│   ├── cmd/              # File-based Command Processing Directory
│   ├── config/           # Application Configuration Files
│   ├── lib/              # External Libraries (JARs)
│   ├── logs/             # Log Files
│   ├── temp/             # Temporary File Storage
│   ├── webapps/          # Web Application Deployment Directory
│   └── work/             # Web Application Work Directory
├── setup/                # System Service Deployment/Management Scripts
├── src/                  # Java Source and Resource Files
└── pom.xml               # Maven Build Script
```

### Detailed Directory & File Specification

- **`/app`**: Home directory of the built application. In production operations, the application executes relative to this directory.
    - **`bin/`**: Contains shell scripts (e.g., `daemon.sh`, `shell.sh`) that launch and control the application.
    - **`cmd/`**: Directory structure for processing file-based asynchronous commands (composed of `incoming`, `queued`, `completed`, `failed`, etc.).
    - **`app/config/`**: Manages all application and server configurations, including `aspectran-config.apon`, `aspectran-rules.xml`, and `server.xml`.
    - **`lib/`**: Houses all external dependency libraries (.jar) copied by `maven-dependency-plugin`. `lib/ext/` holds the current project's application .jar file.
    - **`app/logs/`**: Stores all log files generated during application execution.
    - **`app/temp/`**: Stores temporary files used during operation, such as file uploads and resource reloading.
    - **`webapps/`**: Root directory for web application contexts. `root` and `appmon` are provided by default, with each subdirectory acting as an independent web application.
    - **`app/work/`**: Stores internal work files used by the WAS, such as session files and compiled JSP results.
- **`/setup`**: Houses scripts and configuration files for deploying applications to production environments and managing them as system services (e.g., .deb, .rpm packaging, Systemd/init.d registration).
- **`/src`**: Standard Maven directory containing Java source code and resource files. Compiled during build to generate JAR files under `app/lib/ext/`.
- **`pom.xml`**: Maven build script that manages project dependencies and defines the build lifecycle.

## 3. Maven Build Configuration (`pom.xml`)

The `pom.xml` file defines all processes for compiling Java source code and packaging executable artifacts matching the standard `app` directory structure described in Section 2.

### 3.1. Required Properties

To build Aspectow projects correctly, the following properties must be defined in the `<properties>` section of `pom.xml`.

```xml
<properties>
    <!-- Sets the Java compiler to version 21 and preserves parameter names,
    which is critical for Aspectran's runtime argument mapping. -->
    <maven.compiler.release>21</maven.compiler.release>
    <maven.compiler.parameters>true</maven.compiler.parameters>
</properties>
```

- `maven.compiler.parameters`: Must be set to `true` for Aspectran to dynamically recognize method parameter names at runtime.
- `maven.compiler.release`: Specifies the Java version used to compile the project.

### 3.2. Core Build Plugins

Core plugins position built artifacts into standard locations under `/app`, clearly separating application code from external libraries. The following shows the actual setup from the `aspectow-todo-webapp` sample project:

- **`maven-jar-plugin`**: Compiles and packages source code to generate the application JAR file inside `app/lib/ext/`.
  ```xml
  <plugin>
      <artifactId>maven-jar-plugin</artifactId>
      <version>3.4.2</version>
      <configuration>
          <outputDirectory>app/lib/ext</outputDirectory>
      </configuration>
  </plugin>
  ```

- **`maven-dependency-plugin`**: Copies all dependency libraries defined in `pom.xml` into `app/lib/`. Configured to execute the `copy-dependencies` goal during the `package` phase.
  ```xml
  <plugin>
      <artifactId>maven-dependency-plugin</artifactId>
      <version>3.8.1</version>
      <executions>
          <execution>
              <id>copy-dependencies</id>
              <phase>package</phase>
              <goals>
                  <goal>copy-dependencies</goal>
              </goals>
              <configuration>
                  <excludeTypes>pom</excludeTypes>
                  <outputDirectory>app/lib</outputDirectory>
                  <overWriteIfNewer>true</overWriteIfNewer>
              </configuration>
          </execution>
      </executions>
  </plugin>
  ```

## 4. Core Application Configuration

Core application behaviors and business logic are controlled via configuration files under the `/config` directory. `aspectran-config.apon` serves as the entry point, defining both Context and Web settings.

- **`aspectran-config.apon`**: Specifies framework operational parameters and the locations of context rule files (such as `aspectran-rules.xml`) where Beans and Translets are defined.
- **`aspectran-rules.xml`**: Defines all elements constituting actual application logic, including database connections, service Beans, and common Aspects.

For comprehensive details and itemized explanations regarding application context configuration, refer to the main configuration guide.

**Reference Guide:** [Aspectran Basic Configuration Guide](/en/docs/guides/aspectran-configuration/)

## 5. Embedded WAS Server Configuration

The behavior of the embedded web server (Undertow/Jetty) itself is controlled via XML files under `/config/server/`. These settings directly impact server performance, security, and feature extensions.

### 5.1. Modularized Server Setup (`server.xml`)

`server.xml` acts as the main entry file for server settings, delegating granular configurations to specialized `tow-*.xml` files and including them using `<append>` tags. This modular structure improves readability and maintainability.

```xml
<aspectran>
    <append file="/config/server/undertow/tow-server.xml"/>
    <append file="/config/server/undertow/tow-context-root.xml"/>
    <append file="/config/server/undertow/tow-context-appmon.xml"/>
    <append file="/config/server/undertow/tow-support.xml"/>
</aspectran>
```

### 5.2. Core Engine Configuration (`tow-server.xml`)

`tow-server.xml` defines fundamental WAS operations (threads, request processing handlers, etc.).

```xml
<bean id="tow.server" class="com.aspectran.undertow.server.DefaultTowServer">
    <property name="workerOptions">
        <bean class="com.aspectran.undertow.server.TowOptions">
            <property name="workerIoThreads">%{tow.server.workerIoThreads}</property>
            <property name="workerTaskMaxThreads">%{tow.server.workerTaskMaxThreads}</property>
        </bean>
    </property>
    <property name="requestHandlerFactory">
        <bean class="com.aspectran.undertow.server.handler.ServletRequestHandlerFactory">
            <property name="handlerChainWrappers" type="array">
                <value>#{tow.server.handler.encodingHandlerWrapper}</value>
                <value>#{tow.server.handler.accessLogHandlerWrapper}</value>
                <value>#{tow.server.handler.loggingGroupHandlerWrapper}</value>
            </property>
        </bean>
    </property>
</bean>
```

- **`tow.server`**: An instance of `DefaultTowServer`, acting as the primary Bean representing the Undertow server itself.
    - `workerOptions`: Configures I/O and worker task thread counts. Optimized values can be set per profile.
    - `requestHandlerFactory`: Factory creating handlers to process requests. Chains handlers (Gzip compression, access logging, etc.) via `handlerChainWrappers` to function like middleware.
- **`tow.server.handler.*`**: Defines each handler (such as `encodingHandlerWrapper`, `accessLogHandlerWrapper`) included in the request processing chain as a Bean.

### 5.3. Support Feature Setup (`tow-support.xml`)

Configures auxiliary support features beyond core server operations. For example, `SessionListenerRegistrationBean` can register listeners to observe session lifecycle events for a specific web context (`root`).

```xml
<bean id="sessionListenerRegistration"
      class="com.aspectran.undertow.support.SessionListenerRegistrationBean" lazyInit="true">
    <argument>tow.server</argument>
    <argument>root</argument>
</bean>
```

### 5.4. Web Context Deployment (`tow-context-*.xml`)

`tow-context-*.xml` files deploy individual web applications onto the server.

#### `tow-context-root.xml` Detailed Example

Deploys the default web application to the server root path (`/`), detailing servlets, JSPs, WebSockets, and session management behavior.

```xml
<bean id="tow.context.root.servletContext"
      class="com.aspectran.undertow.server.servlet.TowServletContext"
      scope="prototype">
    <property name="contextPath">/</property>
    <property name="servlets" type="array">
        <bean class="com.aspectran.undertow.server.servlet.DefaultJspServlet"/>
        <bean class="com.aspectran.undertow.server.servlet.TowServlet">
            <argument>webActivityServlet</argument>
            <argument>com.aspectran.web.servlet.WebActivityServlet</argument>
            <property name="mappings" type="array">
                <value>/</value>
            </property>
        </bean>
    </property>
    <property name="servletContainerInitializers" type="array">
        <bean class="com.aspectran.undertow.server.servlet.TowJasperInitializer">
            <property name="tldResources" type="array">
                <value>classpath:com/aspectran/web/support/tags/aspectran.tld</value>
            </property>
        </bean>
    </property>
</bean>

<bean id="tow.context.root.sessionManager"
      class="com.aspectran.undertow.server.session.TowSessionManager"
      scope="prototype">
    <properties profile="!prod">
        <item name="sessionStore">
            <bean class="com.aspectran.core.component.session.FileSessionStoreFactoryBean">
                <property name="storeDir">%{system:aspectran.workPath:/work}/_sessions/root</property>
            </bean>
        </item>
    </properties>
    <properties profile="prod">
        <item name="sessionStore">
            <bean class="com.aspectran.core.component.session.redis.lettuce.DefaultLettuceSessionStoreFactoryBean">
                <property name="poolConfig">
                    <bean class="com.aspectran.core.component.session.redis.lettuce.RedisConnectionPoolConfig">
                        <property name="uri">%{system:redis.uri}/10</property>
                    </bean>
                </property>
            </bean>
        </item>
    </properties>
</bean>
```

- **`tow.context.root.servletContext`**: Primary Bean defining the servlet context for the `root` web application.
    - `servletSessionConfig`: Configures session cookie behavior via `io.undertow.servlet.api.ServletSessionConfig`.
      ```xml
      <property name="servletSessionConfig">
          <bean class="io.undertow.servlet.api.ServletSessionConfig">
              <property name="sessionTrackingModes" type="set">
                  <value>#{class:jakarta.servlet.SessionTrackingMode^COOKIE}</value>
              </property>
              <property name="path" value="/"/>
              <properties profile="prod">
                  <item name="domain" value="%{tow.server.domain}"/>
              </properties>
          </bean>
      </property>
      ```
      - `sessionTrackingModes`: Specifies session tracking methods. Using `COOKIE` prevents `jsessionid` from appending to URLs and tracks sessions strictly via cookies.
      - `path`: Specifies the valid path for session cookies. Setting `/` enables site-wide validity.
      - `domain`: Active only in production (`prod`) profiles, specifying valid domains for session cookies to enable session sharing across subdomains.
    - `servlets`: Registers `DefaultJspServlet` for JSP processing and Aspectran's main `WebActivityServlet`.
    - `servletContainerInitializers`: Initializes the JSP engine (Jasper) and registers custom tag libraries (.tld).
- **`tow.context.root.sessionManager`**: An instance of `TowSessionManager` defining the session manager for the `root` context.
    - `sessionManagerConfig`: Configures session manager behavior via `SessionManagerConfig` Bean using concise APON arguments.
      ```xml
      <bean class="com.aspectran.core.context.config.SessionManagerConfig">
          <argument>
              workerName: rn0
              maxActiveSessions: 9999
              maxIdleSeconds: 1800
              evictionIdleSeconds: 900
              maxIdleSecondsForNew: 60
              evictionIdleSecondsForNew: 30
              scavengingIntervalSeconds: 90
              clusterEnabled: true
          </argument>
      </bean>
      ```
      - `workerName` (string): Unique worker name identifying each server instance in clustered environments, included in session IDs.
      - `maxActiveSessions` (integer): Limits maximum concurrent active sessions held in memory.
      - `maxIdleSeconds` (integer): Maximum idle time (seconds) for regular sessions. Sessions expire if inactive beyond this limit.
      - `maxIdleSecondsForNew` (integer): Special idle time (seconds) applied strictly to the first request of new sessions. Promoted to regular sessions upon the second request to follow `maxIdleSeconds`. Used to rapidly expire single-request bot/crawler sessions.
      - `scavengingIntervalSeconds` (integer): Execution interval (seconds) for scavenging operations that locate and **permanently delete** expired sessions.
      - `evictionIdleSeconds` (integer): Idle wait time (seconds) before inactive sessions are **evicted from memory cache** to conserve RAM. Sessions are not deleted and can be reloaded from persistent storage if accessed again.
      - `evictionIdleSecondsForNew` (integer): Cache eviction policy identical to `evictionIdleSeconds`, applied exclusively to new sessions.
      - `saveOnCreate` (boolean): When `false`, sessions are saved to persistent storage upon completion of the last request using the session, reducing I/O. When `clusterEnabled` is `true`, sessions are always saved upon creation regardless of this setting.
      - `saveOnInactiveEviction` (boolean): When `true`, inactive sessions are saved to persistent storage upon memory eviction to prevent data loss. When `clusterEnabled` is `true`, sessions are always saved upon eviction regardless of this setting.
      - `removeUnloadableSessions` (boolean): Determines whether to purge session data from storage if loading fails (e.g., deserialization failure).
      - `clusterEnabled` (boolean): When set to `true`, session data is aggressively saved to central storage across creation, request completion, and memory eviction for data consistency.
    - `sessionStore`: Specifies persistent storage for session data. Configured per profile to use file-based sessions (`FileSessionStoreFactoryBean`) in development and Redis-based sessions (`DefaultLettuceSessionStoreFactoryBean`) in production to support high-availability clustering.

#### `tow-context-appmon.xml`

Deploys the embedded AppMon monitoring tool as a separate web application under the `/appmon` path, following a structure similar to `tow-context-root.xml`.

### 5.5. Common Configuration Example: Server Port Change

The most common server configuration change is modifying HTTP listener ports, located in `/config/server/undertow/tow-server.xml`.

Simply edit the `value` of `tow.server.listener.http.port` inside the `<environment>` section at the top of the file:

```xml
<environment>
    <property name="tow.server.listener.http.port" valueType="int">8081</property>
    <property name="tow.server.listener.http.host">0.0.0.0</property>
    ...
</environment>
```

Changing `8081` to a different port and restarting Aspectow binds the server to the new port.

## 6. Auxiliary Feature Configurations

Auxiliary application features are configured under dedicated subdirectories within `/config`.

### 6.1. Logging Configuration (`/config/logging/`)

Logging policies are configured via Logback XML files under `/config/logging/`. Aspectow uses a modular structure where `logback.xml` or `logback-debug.xml` includes functional files from the `included/` directory.

- **`logback.xml`**: Primary configuration for production environments. Includes `logback-default.xml`, `logback-scheduler.xml`, and `logback-undertow.xml` for file-based logging.
- **`logback-debug.xml`**: Configuration for development and debugging. Includes all files from `logback.xml` plus `logback-console.xml` to output logs to the console.

#### Switching Logging Files

Production environments default to `logback.xml`. To enable console output and detailed logs during development, switch to `logback-debug.xml` by passing debug flags to execution scripts.

`shell.sh` and `shell.bat` scripts under `app/bin` check for `--debug` and `debug` arguments, setting the `logback.configurationFile` Java system property to `logback-debug.xml` when present.

**Executing in Debug Mode**

Linux/macOS:
```bash
app/bin/shell.sh --debug
```

Windows:
```cmd
app\bin\shell.bat debug
```

### 6.2. Aspectow Console and Standalone AppMon Configurations (`/config/console/` & `/config/appmon/`)

The Aspectow ecosystem supports **Aspectow Console** (an integrated management platform) and **Aspectow AppMon** (a real-time monitoring solution), with configuration directories clearly separated based on execution modes and editions.

- **Aspectow Console Configuration (`/config/console/`)**:
  Aspectow Enterprise Edition comes with **Aspectow Console pre-integrated by default**. In the Console environment, node cluster configurations (`node-config.apon`), database properties (`aspectow-console.db-*.properties`), node and AppMon XML rule files (`node-rules.xml`, `appmon-rules.xml`), and embedded AppMon collection settings (`appmon-config.apon`) are centrally managed under the **`/config/console/`** directory.
  *   **`node-rules.xml`**: Aspectran XML rule file registering node management components (`NodeConfigResolver`, `NodeManagerFactoryBean`, etc.).
  *   **`appmon-rules.xml`**: Aspectran XML rule file dynamically loading `/config/console/appmon-config.apon` via `AppMonConfigResolver`.
  *   **Detailed Guide:** [Aspectow Console Configuration Guide](/en/docs/aspectow/console/configuration-guide/)

- **Standalone AppMon Configuration (`/config/appmon/`)**:
  When configuring **Standalone AppMon** on specific servers or applications without Console for lightweight monitoring, dedicated configuration files (`appmon-config.apon`, `node-config.apon`, `appmon-rules.xml`, `node-rules.xml`, `appmon.db-*.properties`) are placed in the project's **`/config/appmon/`** directory to override default behaviors.
  *   **Detailed Guide:** [Aspectow AppMon Overview & Configuration Guide](/en/docs/aspectow/appmon/)

## 7. Major Feature Utilization: Integrated Dashboard Security & Access Control

In the Aspectow ecosystem, server health and application metrics are observed in real time via the integrated management platform, **Aspectow Console**, and **AppMon Dashboard**. Access control mechanisms are enforced in production environments to prevent unauthorized access to dashboards and node controls.

### 7.1. Aspectow Console Integrated Access Control (RBAC-Based)

Aspectow Console provides fine-grained Role-Based Access Control (RBAC) to secure dashboard access and node control operations.

*   **Role-Based Governance**: Clear separation between read-only monitoring access and remote command/node control permissions via roles such as `SUPER_ADMIN`, `ADMIN`, and `DEMO`.
*   **Security Token Authentication**: Protects monitoring contexts from unauthorized external traffic using PBE (Password-Based Encryption) tokens and secure sessions.

### 7.2. Standalone AppMon Access Control

When running AppMon standalone without Console, security is maintained by issuing temporary authentication token cookies from the main application context and validating them within the AppMon context.

1.  **Authentication Cookie Issuance**: The main web application issues a time-limited `HttpOnly` security cookie to authenticated users and redirects them to the AppMon dashboard path (`/appmon/dashboard/`).
2.  **Authentication Cookie Validation**: The AppMon context intercepts incoming requests to validate token existence and expiration, ensuring only authorized users access dashboard metrics.

For detailed security governance and permission configurations, refer to the [Aspectow Console Feature & Screen Guide](/en/docs/aspectow/console/feature-guide/).
