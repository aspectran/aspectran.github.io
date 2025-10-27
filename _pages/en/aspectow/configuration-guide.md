---
format: plate solid article
title: Aspectow Configuration Guide
teaser: It provides a systematic guide to the structure of an Aspectow application, how it is built, and how to configure its core features for production operation.
sidebar: toc
---

## 1. Introduction

This document is a technical guide for developers new to Aspectow or those who want a deep understanding of the standard project structure. It provides a systematic guide to the structure of an Aspectow application, how it is built, and how to configure its core features for production operation.

Aspectow follows a well-defined project structure to enhance maintainability and scalability, and to clearly separate the roles of configuration. Through this guide, developers will understand the entire process from the standard project structure to build and core configuration, and based on this, will gain the necessary knowledge to develop and operate stable and efficient applications.

## 2. Standard Project Structure

An Aspectow application follows a standard directory structure to provide convenience and consistency throughout the development, build, deployment, and operation processes. All directories are pre-created when the project is generated, and the build process mainly serves to populate the `app/lib` and `app/lib/ext` directories.

```
/
├── app/                  # Application home directory
│   ├── bin/              # Execution scripts
│   ├── cmd/              # File-based command processing directory
│   ├── config/           # Application configuration files
│   ├── lib/              # External libraries (JARs)
│   ├── logs/             # Log files
│   ├── temp/             # Temporary file storage
│   ├── webapps/          # Web application deployment directory
│   └── work/             # Web application working directory
├── setup/                # System service deployment/management scripts
├── src/                  # Java source and resource files
└── pom.xml               # Maven build script
```

### Detailed Description of Directories and Files

- **`/app`**: The home directory of the built application. In actual operation, the application runs based on this directory.
    - **`bin/`**: Contains shell scripts for running and controlling the application, such as `daemon.sh` and `shell.sh`.
    - **`cmd/`**: A directory structure for processing file-based asynchronous commands (composed of `incoming`, `queued`, `completed`, `failed`, etc.).
    - **`config/`**: Manages all application and server settings, such as `aspectran-config.apon`, `root-context.xml`, and `server.xml`.
    - **`lib/`**: All external dependency libraries (.jar) copied by the `maven-dependency-plugin` are located here. The application's .jar file for the current project is located in `lib/ext/`.
    - **`logs/`**: All log files generated during application execution are stored here.
    - **`temp/`**: Temporary files used by the application during operation, such as for file uploads or resource reloading, are stored here.
    - **`webapps/`**: The root directory for web application contexts. `root` and `appmon` are provided by default, and each subdirectory becomes an independent web application.
    - **`work/`**: Working files used internally by the WAS, such as session files and compiled JSP files, are stored here.
- **`/setup`**: Contains scripts and configuration files for deploying the application to a production environment and managing it as a system service, such as for .deb, .rpm packaging or Systemd/init.d service registration.
- **`/src`**: The standard Maven directory where the application's Java source code and resource files are located. During the build process, it is compiled and generated as a JAR file in `app/lib/ext/`.
- **`pom.xml`**: The Maven build script that manages the project's dependencies and defines the build lifecycle.

## 3. Maven Build Configuration (`pom.xml`)

The `pom.xml` file defines the entire process of compiling Java source code and packaging the executable artifacts according to the standard `app` directory structure described in section 2.

### 3.1. Required Properties

The following properties are essential in the `<properties>` section of `pom.xml` to build an Aspectow project correctly.

```xml
<properties>
    <!-- Sets the Java compiler to version 21 and preserves parameter names,
    which is critical for Aspectran's runtime argument mapping. -->
    <maven.compiler.release>21</maven.compiler.release>
    <maven.compiler.parameters>true</maven.compiler.parameters>
</properties>
```

- `maven.compiler.parameters`: Must be set to `true` for Aspectran to dynamically recognize method argument names at runtime.
- `maven.compiler.release`: Specifies the Java version to compile the project with.

### 3.2. Core Build Plugins

The core plugins place the built artifacts into the standard structure within the `/app` directory, clearly separating application code from external libraries. The following are the actual settings from the `aspectow-todo-webapp` example project.

- **`maven-jar-plugin`**: Compiles and packages the current project's source code to generate the application JAR file in the `app/lib/ext/` directory.
  ```xml
  <plugin>
      <artifactId>maven-jar-plugin</artifactId>
      <version>3.4.2</version>
      <configuration>
          <outputDirectory>app/lib/ext</outputDirectory>
      </configuration>
  </plugin>
  ```

- **`maven-dependency-plugin`**: Copies all dependency libraries defined in `pom.xml` to the `app/lib/` directory. It is configured to run the `copy-dependencies` goal during the `package` phase.
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

The core behavior and business logic of the application are controlled through configuration files in the `/config` directory. The `aspectran-config.apon` file serves as the starting point for configuration, defining both context and web-related settings.

- **`aspectran-config.apon`**: Specifies the framework's basic operational parameters and the location of context rule files like `root-context.xml`, where Beans and Translets are defined.
- **`root-context.xml`**: Defines all elements that constitute the application's actual logic, such as database connections, service Beans, and common Aspects.

For all the details about application context configuration and a description of each item, please refer to the main configuration guide document.

**Reference Document:** `aspectran-configuration_en.md`

## 5. Embedded WAS Server Configuration

The behavior of the embedded web server (Undertow/Jetty) itself is controlled through XML files in the `/config/server/` directory. These settings directly affect the server's performance, security, and feature extensions.

### 5.1. Modular Server Configuration (`server.xml`)

The `server.xml` file is the main file for server configuration. It delegates detailed settings to other `tow-*.xml` files separated by function and includes them using the `<append>` tag. This modular structure enhances the readability and maintainability of the configuration.

```xml
<aspectran>
    <append file="/config/server/undertow/tow-server.xml"/>
    <append file="/config/server/undertow/tow-context-root.xml"/>
    <append file="/config/server/undertow/tow-context-appmon.xml"/>
    <append file="/config/server/undertow/tow-support.xml"/>
</aspectran>
```

### 5.2. Core Engine Settings (`tow-server.xml`)

`tow-server.xml` defines the most fundamental behavior of the WAS (threads, request processing handlers, etc.).

- **`tow.server`**: An instance of the `DefaultTowServer` class, this is the core Bean representing the Undertow server itself. Its properties, such as HTTP listeners, worker threads, and the request handler chain, configure the overall behavior of the server.
- **`tow.server.handler.*`**: Defines each handler to be included in the request processing chain as a Bean, such as `encodingHandlerWrapper` and `accessLogHandlerWrapper`.

### 5.3. Support Feature Settings (`tow-support.xml`)

Configures additional support features beyond the server's main functions.

- **`sessionListenerRegistrationBean`**: An instance of the `SessionListenerRegistrationBean` class, it is responsible for registering a listener that detects session lifecycle events (creation, destruction) for a specific web context (`root`).

### 5.4. Web Context Deployment (`tow-context-*.xml`)

`tow-context-*.xml` files are responsible for deploying individual web applications to the server. Each file defines an independent servlet context.

#### `tow-context-root.xml` Detailed Description

Deploys the main web application to the server's root path (`/`) and has the following key Beans and properties:

- **`tow.context.root.servletContext`**: An instance of the `TowServletContext` class, this is the core Bean that defines the servlet context for the `root` web application.
    - `servletSessionConfig`: Defines a `io.undertow.servlet.api.ServletSessionConfig` Bean to configure the behavior of session cookies in detail.
    - `servlets`: Defines the servlets that will operate within the context, such as `DefaultJspServlet` for JSP processing and `WebActivityServlet` for handling Aspectran's requests.
    - `servletContainerInitializers`: Defines components to be initialized along with the servlet container. `TowJasperInitializer` initializes the JSP engine (Jasper) and specifies the location of TLD (Tag Library Descriptor) files.
- **`tow.context.root.sessionManager`**: An instance of the `TowSessionManager` class, it defines the session manager for the `root` context. It has the following key properties:
    - `sessionManagerConfig`: Configures the detailed behavior of the session manager through a `SessionManagerConfig` Bean.
    - `sessionStore`: Specifies the storage where actual session data will be saved. It supports high-availability clustering by allowing different session stores for different profiles, such as `FileSessionStoreFactoryBean` for development and `DefaultLettuceSessionStoreFactoryBean` (Redis) for production.

    Key properties for `SessionManagerConfig` include:
    - `workerName` (String): A unique name to identify each server instance in a cluster environment, which is included in the session ID.
    - `maxActiveSessions` (int): Limits the maximum number of sessions that can be held in memory simultaneously.
    - `maxIdleSeconds` (int): The maximum validity time (in seconds) for a regular session. If there are no requests during this time, the session 'expires' and can no longer be used.
    - `maxIdleSecondsForNew` (int): A special idle time (in seconds) that applies only to the first request after session creation. When the second request begins, the session is promoted to a regular session and will then follow `maxIdleSeconds`. Used to quickly expire single-request sessions from bots, crawlers, etc.
    - `scavengingIntervalSeconds` (int): The execution interval (in seconds) for the cleanup job (Scavenging) that finds sessions 'expired' by `maxIdleSeconds` and **permanently deletes** them.
    - `evictionIdleSeconds` (int): For memory management, this is the **idle time (in seconds) to wait before evicting an inactive session from the memory cache**. The session is not permanently deleted and can be read again from the persistent store if needed.
    - `evictionIdleSecondsForNew` (int): The same cache eviction policy as `evictionIdleSeconds`, but applies only to 'new' sessions (sessions in their first request).
    - `saveOnCreate` (boolean): If `false`, the session is saved to persistent storage only when the last request using it completes. This optimizes performance by avoiding unnecessary I/O. If `clusterEnabled` is `true`, it is always saved on creation regardless of this value.
    - `saveOnInactiveEviction` (boolean): If `true`, it prevents data loss by saving the session to persistent storage when it is evicted from memory due to inactivity. If `clusterEnabled` is `true`, it is always saved on eviction regardless of this value.
    - `removeUnloadableSessions` (boolean): Determines whether to delete a session from the store if its data cannot be loaded (e.g., due to deserialization failure).
    - `clusterEnabled` (boolean): If set to `true`, session data is aggressively saved to the central store at multiple points (creation, request completion, eviction) to ensure data consistency.

#### `tow-context-appmon.xml`

Deploys the built-in monitoring tool, AppMon, as a separate web application at the `/appmon` path. It has a structure similar to `tow-context-root.xml`.

### 5.5. Key Configuration Example: Changing the Server Port

The most common server configuration change is changing the HTTP listener's port. This can be configured in the `/config/server/undertow/tow-server.xml` file.

You can change the `value` of the `tow.server.listener.http.port` property defined in the `<environment>` section at the top of the file to your desired port number.

```xml
<environment>
    <property name="tow.server.listener.http.port" valueType="int">8081</property>
    <property name="tow.server.listener.http.host">0.0.0.0</property>
    ...
</environment>
```

After changing `8081` to another number in the example above and restarting Aspectow, the server will start on the modified port.

## 6. Additional Feature Configuration

Major additional features of the application are configured in their respective subdirectories within the `/config` directory.

### 6.1. Logging Configuration (`/config/logging/`)

The application's logging policy is configured through the `logback`-related XML files in the `/config/logging/` directory. Aspectow uses a modular approach where `logback.xml` or `logback-debug.xml` includes functional configuration files from the `included/` directory.

- **`logback.xml`**: The main configuration file for a typical production environment. It sets up file-based logging by including `logback-default.xml`, `logback-scheduler.xml`, and `logback-undertow.xml`.
- **`logback-debug.xml`**: The configuration file for development and debugging environments. In addition to all the files included by `logback.xml`, it also includes `logback-console.xml` to output logs to the console.

#### How to Switch Logging Configuration Files

By default, `logback.xml` is used in a production environment. If you want to check detailed logs, including console output, during development, you can switch to using `logback-debug.xml` by adding a debug argument to the execution script.

The `shell.sh` and `shell.bat` scripts in the `app/bin` directory check for the `--debug` and `debug` arguments, respectively. If the argument is provided, they set the `logback.configurationFile` Java system property to the path of the `logback-debug.xml` file, thereby replacing the logging configuration.

**Example of running in debug mode**

Linux/macOS:
```bash
app/bin/shell.sh --debug
```

Windows:
```cmd
app\bin\shell.bat debug
```

### 6.2. AppMon Configuration (`/config/appmon/`)

The built-in monitoring tool, AppMon, has its default configuration bundled within its library. Users can customize its behavior by placing or modifying files in the `/config/appmon/` directory to **override** these defaults.

- **`/config/appmon/appmon-config.apon`**: The core configuration file that defines what to monitor (instances, events, metrics, logs).
- **`/config/appmon/appmon.db-*.properties`**: A file to configure the database connection for storing monitoring data.
- **`/config/appmon/appmon-assets.xml`**: A file to configure the loading method for AppMon UI's static assets (CSS, JS).
- **`/config/server/undertow/tow-context-appmon.xml`**: A file to customize how AppMon is deployed as a web application.
- **`/webapps/appmon/WEB-INF/jsp/`**: Contains the JSP files that constitute the AppMon UI. The `templates/default.jsp` is the template that handles the overall layout, and you can customize the UI by modifying the JSP files in the `appmon/` directory.

For the complete architecture of AppMon configuration, detailed descriptions of each configuration item, and examples, please refer to the main AppMon introduction document.

**Reference Document:** [Aspectow AppMon](/en/aspectow/appmon/)

## 7. Key Feature Usage: AppMon Dashboard Access Control

AppMon runs in a separate `appmon` web context, distinct from the `root` context. Therefore, a secure access control mechanism is needed when opening the AppMon dashboard screen through a menu in the `root` context. Aspectow solves this using a **Time-Limited, Password-Based Encryption (PBE) Token**.

#### Step 1: Create a 'Gatekeeper' Translet (`root` Context)

First, define a 'gatekeeper' translet in the `root` context to act as an entry point to the AppMon dashboard.

**Example from `aspectow/demo/home/monitoring.xml`**
```xml
<translet name="/monitoring/${instances}">
    <attribute name="token">#{class:com.aspectran.utils.security.TimeLimitedPBTokenIssuer^token}</attribute>
    <redirect path="/appmon/front/@{token}/${instances}"/>
</translet>
```
1.  A user accesses the `/monitoring` path to open AppMon. If they want to directly see the dashboard for a specific instance (e.g., `appmon`), they send a request by appending the instance name to the path, like `/monitoring/appmon`.
2.  The translet generates a short-lived **security token** using `TimeLimitedPBTokenIssuer`.
3.  It then **redirects** the user's browser to the AppMon context's `/appmon/front/...` path, including the generated token and the passed `instances` value in the path.

#### Step 2: Token Validation and Page Processing (`appmon` Context)

The `appmon` context receives the redirected request and validates the token's authenticity. This logic is implemented in `FrontActivity.java`.

**Excerpt from `FrontActivity.java`**
```java
@Request("/front/${token}/${instances}")
public Map<String, String> front(Translet translet, String token, String instances) {
    try {
        // 1. Validate the received token.
        AppMonManager.validateToken(token);
        // 2. If validation is successful, render the AppMon dashboard page.
        return Map.of("include", "appmon/appmon", ...);
    } catch (Exception e) {
        // 3. If validation fails, log an error and redirect to home.
        logger.error("Invalid token: {}", token);
        translet.redirect("/");
        return null;
    }
}
```
This method is a secure access control mechanism that uses the `root` context as a trusted certificate authority, allowing only users who have been issued a valid token to access the `appmon` context.
