---
title: Aspectow Enterprise Configuration Guide
teaser: Systematically covers project structure, build, and all advanced embedded WAS server configuration elements for the Aspectow Enterprise Edition equipped with JBoss Undertow and a Servlet/JSP engine.
subheadline: Aspectow Enterprise
---

## 1. Introduction

This document is a comprehensive technical guide for developers and system engineers building and operating applications with the Aspectow Enterprise Edition. Aspectow Enterprise is Aspectran's flagship application server platform built upon JBoss's high-performance non-blocking I/O web server [Undertow](https://undertow.io) and Apache Tomcat's battle-tested JSP engine [Apache Jasper](https://mvnrepository.com/artifact/org.mortbay.jasper/apache-jsp). Faithfully adhering to the Jakarta Servlet specification, it delivers rock-solid stability for large-scale enterprise web applications and centralized management dashboards ([Aspectow Console](/en/docs/aspectow/console/)).

This guide walks through every operational aspect of Aspectow Enterprise—from standard project directory layout and Maven builds to embedded Undertow listeners, I/O and worker thread pools, middleware handler chains (compression, logging groups, access logging), servlet context deployments, static resource managers, JSP and custom tag libraries (TLD), WebSockets, and distributed session clustering.

## 2. Standard Project Structure

Aspectow Enterprise adheres to a well-defined standard directory structure to ensure maintainability and consistency across development, testing, packaging, and production operations. All compiled artifacts and runtime assets reside strictly isolated within the `/app` home directory.

```
/
├── app/                  # Application Home Directory (Runtime Base Path)
│   ├── bin/              # Lifecycle and Control Scripts (daemon.sh, shell.sh)
│   ├── cmd/              # File-based Asynchronous Command Queue Directory
│   ├── config/           # Application and Server Configuration Files
│   │   ├── aspectran-config.apon  # Aspectran Core Runtime Configuration
│   │   ├── aspectran-rules.xml    # Business Components and Translet Rules
│   │   ├── console/               # Aspectow Console Dedicated Configuration
│   │   ├── logging/               # Logback Logging Configuration
│   │   └── server/                # Embedded Undertow WAS Server Configuration
│   │       ├── server.xml         # Master Server Entry Point
│   │       └── undertow/          # Undertow Engine and Context Modules
│   ├── lib/              # Maven Dependency External Libraries (JARs)
│   │   └── ext/          # Packaged Application JAR for Current Project
│   ├── logs/             # System and WAS Server Log Files
│   ├── temp/             # Multipart Uploads and Ephemeral Scratch Files
│   ├── webapps/          # Web Application Context Deployments
│   │   ├── root/         # Default Web Application (Root Context: /)
│   │   └── console/      # Centralized Management Web Console (or appmon)
│   └── work/             # Compiled JSP Class Files, Persistent Session Stores
├── setup/                # Systemd Service Units and Deployment Scripts
├── src/                  # Standard Maven Java Source Code and Resources
└── pom.xml               # Maven Build Specification
```

### Detailed Directory & File Breakdown

- **`/app`**: The application runtime home. In production, server processes launch directly from this base path.
    - **`bin/`**: Houses shell scripts governing server lifecycles, such as `daemon.sh` (background daemon service) and `shell.sh` (interactive diagnostic CLI environment).
    - **`cmd/`**: Directory structure for file-based asynchronous command execution (File Commander), containing `incoming/`, `queued/`, `completed/`, and `failed/`.
    - **`app/config/`**: Centralized configuration repository containing framework options (`aspectran-config.apon`), business rules (`aspectran-rules.xml`), and server definitions (`server.xml`).
    - **`lib/`**: Contains all external dependency JARs gathered via `maven-dependency-plugin`. Packaged bytecode for the current project resides in `lib/ext/`.
    - **`app/logs/`**: Repository for operational logs, scheduler logs, and Undertow HTTP access logs.
    - **`app/temp/`**: Working storage for multipart file upload buffers and template compilation caches.
    - **`webapps/`**: Root directory for web application contexts (`root`, `console`, etc.). Each subfolder operates as an isolated web application with its own class loader and servlet environment.
    - **`app/work/`**: Working storage safely housing Jasper-compiled JSP bytecode and file-based session stores.
- **`/setup`**: Operating system service registration scripts, including Linux systemd service unit templates.
- **`/src`**: Standard Maven source tree containing Java code and resources, compiled into `app/lib/ext/` upon build.
- **`pom.xml`**: Maven build file defining library dependencies and lifecycle packaging targets.

## 3. Maven Build Configuration (`pom.xml`)

The `pom.xml` compiles project source code and strictly isolates application binaries and external libraries according to the standard `/app` directory layout.

### 3.1. Required Compiler Properties

The `-parameters` compiler flag is mandatory for Aspectran to dynamically resolve parameter names via reflection for automatic HTTP request and bean property binding.

```xml
<properties>
    <!-- Target Java 21 LTS release -->
    <maven.compiler.release>21</maven.compiler.release>
    <!-- Preserve parameter names for reflective dynamic binding -->
    <maven.compiler.parameters>true</maven.compiler.parameters>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
</properties>
```

### 3.2. Core Build Plugins

- **`maven-jar-plugin`**: Compiles project source code into a dedicated application JAR inside `app/lib/ext/`.
  ```xml
  <plugin>
      <artifactId>maven-jar-plugin</artifactId>
      <version>3.5.1</version>
      <configuration>
          <outputDirectory>app/lib/ext</outputDirectory>
      </configuration>
  </plugin>
  ```

- **`maven-dependency-plugin`**: Copies all external dependency libraries into `app/lib/` to form a self-contained runtime deployment environment.
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

## 4. Core Application Configuration (`aspectran-config.apon`)

The runtime environment, security encryption keys, application contexts, scheduler, interactive CLI shell, and asynchronous file-based command engine (File Commander) are centrally governed via `/app/config/aspectran-config.apon`.

Notably, instance-specific runtime paths such as `aspectran.workPath` are not hardcoded within this file. This allows a single packaged build artifact to run across multiple isolated nodes simultaneously by dynamically injecting work paths via JVM arguments (`-Daspectran.workPath=...`) or environment variables.

### 4.1. `aspectran-config.apon` Specification

```apon
system: {
    properties: {
        # PBE (Password-Based Encryption) algorithm and master key
        aspectran.encryption.algorithm: PBEWithMD5AndTripleDES
        aspectran.encryption.password: demo!

        # Encoding for property file resolution
        aspectran.properties.encoding: UTF-8

        # Enable JBoss Enhanced Queue Executor thread pool statistics (for performance monitoring)
        jboss.threads.eqe.statistics: true
        jboss.threads.eqe.statistics.active-count: true

        # Default active profiles for the Console context
        # - Embedded Database: 'h2' (Change to 'mariadb', 'mysql' when connecting to external RDBMS)
        # - Web UI Activation: 'console.ui' (Omit 'console.ui' to operate in Headless mode without Web UI)
        aspectran.profiles.base.console: h2,console.ui

        # Return URL redirecting from the Console UI back to the main portal
        aspectow.console.portalUrl: /../
    }
}
context: {
    name: root
    rules: [
        /config/app-description.xml
        /config/aspectran-rules.xml
        /config/server/server.xml
    ]
    resources: [
        /lib/ext
    ]
    scan: [
        com.aspectran.aspectow.enterprise.demo
    ]
    profiles: {
        base: [
            console.ui
        ]
        default: [
            dev
        ]
    }
    autoReload: {
        reloadMode: hard
        scanIntervalSeconds: 5
        enabled: false
    }
    singleton: true
}
scheduler: {
    startDelaySeconds: 3
    waitOnShutdown: true
    enabled: false
}
shell: {
    prompt: "{{green}}aspectow>{{reset}} "
    commands: [
        com.aspectran.undertow.shell.command.UndertowCommand
        com.aspectran.shell.command.builtins.TransletCommand
        com.aspectran.shell.command.builtins.AspectCommand
        com.aspectran.shell.command.builtins.JobCommand
        com.aspectran.shell.command.builtins.PBEncryptCommand
        com.aspectran.shell.command.builtins.PBDecryptCommand
        com.aspectran.shell.command.builtins.SysInfoCommand
        com.aspectran.shell.command.builtins.EchoCommand
        com.aspectran.shell.command.builtins.EvaluateCommand
        com.aspectran.shell.command.builtins.HistoryCommand
        com.aspectran.shell.command.builtins.ClearCommand
        com.aspectran.shell.command.builtins.VerboseCommand
        com.aspectran.shell.command.builtins.HelpCommand
        com.aspectran.shell.command.builtins.RestartCommand
        com.aspectran.shell.command.builtins.QuitCommand
    ]
    session: {
        workerName: shell
        maxActiveSessions: 1
        maxIdleSeconds: 1800
        scavengingIntervalSeconds: 600
        fileStore: {
            storeDir: /work/_sessions/shell
        }
        enabled: true
    }
    historyFile: /logs/history.log
}
daemon: {
    executor: {
        maxThreads: 5
    }
    polling: {
        pollingInterval: 5000
        requeuable: true
        enabled: true
    }
    commands: [
        com.aspectran.undertow.daemon.command.UndertowCommand
        com.aspectran.daemon.command.builtins.InvokeActionCommand
        com.aspectran.daemon.command.builtins.TransletCommand
        com.aspectran.daemon.command.builtins.ComponentCommand
        com.aspectran.daemon.command.builtins.SysInfoCommand
        com.aspectran.daemon.command.builtins.PollingIntervalCommand
        com.aspectran.daemon.command.builtins.RestartCommand
        com.aspectran.daemon.command.builtins.QuitCommand
    ]
    session: {
        workerName: daemon
        enabled: true
    }
}
web: {
    uriDecoding: utf-8
    defaultServletName: none
    trailingSlashRedirect: true
    legacyHeadHandling: true
    acceptable: {
        +: /**
    }
}
```

### 4.2. Detailed Configuration Block Breakdown

* **`system.properties`**:
  * `aspectran.encryption.*`: Defines the PBE master password and algorithm to encrypt sensitive credentials (`enc:...`), preventing plaintext database passwords or tokens from leaking in version control. (Recommended in production: `PBEWITHHMACSHA256ANDAES_128`)
  * `jboss.threads.eqe.statistics`: Enables real-time active thread and queue metric tracking on Undertow's JBoss Enhanced Queue Executor thread pool, delivering accurate WAS load metrics to the Aspectow Console monitoring dashboard.
  * `aspectran.profiles.base.console`: Controls the Console context operating mode. Including `console.ui` activates the full browser Web UI, while omitting `console.ui` transitions the node into a lightweight Headless node when console nodes are separated.
* **`context`**:
  * `rules`: Systematically imports core XML rule files, including master server setup (`server.xml`), business Translet definitions (`aspectran-rules.xml`), and application metadata (`app-description.xml`).
  * `resources`: Dynamically binds packaged application JARs under `/lib/ext` into the runtime classpath.
  * `scan`: Auto-discovers annotated Aspectran components within designated packages (`com.aspectran.aspectow.enterprise.demo`).
* **`scheduler`**: Controls startup delay (`startDelaySeconds`) and graceful termination (`waitOnShutdown`) for scheduled jobs.
* **`shell`**: Configures the interactive diagnostic terminal (`app/bin/shell.sh`). The included `UndertowCommand` enables instant CLI inspection of Undertow listeners and active deployments.
* **`daemon`**: Configures the background service daemon (`app/bin/daemon.sh`) and File Commander queue watching `app/cmd/incoming/` for asynchronous file-based administrative commands.
* **`web`**: Configures URI decoding charsets, default servlet handling, and trailing slash (`/`) canonicalization redirects.

## 5. Embedded Undertow WAS Server Configuration Guide

Aspectow Enterprise's embedded web application server is managed modularly through XML definitions organized inside `/app/config/server/`. Every tier is decoupled to fully harness Undertow's unmatched performance and flexibility.

### 5.1. Modular Server Entry Point (`server.xml`)

`server.xml` serves as the master aggregation entry point, combining the Undertow engine, web application contexts, and support modules via `<append>` directives.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>
    <description>Aspectow Enterprise Undertow Server Master Configuration</description>

    <!-- Undertow Core Engine and Global Handler Chain -->
    <append file="/config/server/undertow/tow-server.xml"/>

    <!-- Web Application Context Definitions -->
    <append file="/config/server/undertow/tow-context-root.xml"/>
    <append file="/config/server/undertow/tow-context-console.xml"/>

    <!-- Runtime Support Components and Listener Registrations -->
    <append file="/config/server/undertow/tow-support.xml"/>
</aspectran>
```

### 5.2. Network Listeners and Engine Configuration (`tow-server.xml`)

`tow-server.xml` defines `DefaultTowServer`, the core Undertow server instance, configuring network socket listeners, I/O worker threads, server tuning options, and the global request handler pipeline.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>

    <environment>
        <property name="tow.server.listener.http.port" valueType="int">8081</property>
        <property name="tow.server.listener.http.host">0.0.0.0</property>
        <property name="tow.server.domain"/>
    </environment>

    <environment>
        <!-- Environment-specific XNIO worker thread tuning -->
        <properties profile="(!stage, !prod)">
            <item name="tow.server.workerIoThreads" valueType="int">4</item>
            <item name="tow.server.workerTaskMaxThreads" valueType="int">32</item>
        </properties>
        <properties profile="stage, prod">
            <item name="tow.server.workerIoThreads" valueType="int">8</item>
            <item name="tow.server.workerTaskMaxThreads" valueType="int">64</item>
        </properties>
    </environment>

    <bean id="tow.server" class="com.aspectran.undertow.server.DefaultTowServer">
        <!-- Auto-start and Graceful Shutdown configuration -->
        <property name="autoStart" valueType="boolean">true</property>
        <property name="shutdownGracefully" valueType="boolean">true</property>
        <property name="shutdownTimeoutSecs" valueType="int">10</property>
        <!-- Restore real client IP behind reverse proxies (Nginx / ALB) -->
        <property name="proxyAddressForwarding" valueType="boolean">true</property>

        <!-- HTTP Network Listener Configuration -->
        <property name="httpListeners" type="array">
            <bean class="com.aspectran.undertow.server.HttpListenerConfig">
                <property name="host">%{tow.server.listener.http.host}</property>
                <property name="port" valueType="int">%{tow.server.listener.http.port}</property>
            </bean>
        </property>

        <!-- Undertow Server Options -->
        <property name="serverOptions">
            <bean class="com.aspectran.undertow.server.TowOptions">
                <property name="decodeUrl" valueType="boolean">true</property>
                <property name="urlCharset">UTF-8</property>
                <property name="maxHeaderSize" valueType="int">65536</property>
                <property name="maxEntitySize" valueType="long">52428800</property>
                <property name="multipartMaxEntitySize" valueType="long">52428800</property>
                <property name="idleTimeout" valueType="int">60000</property>
                <property name="alwaysSetKeepAlive" valueType="boolean">true</property>
            </bean>
        </property>

        <!-- XNIO Worker Thread Pool Options -->
        <property name="workerOptions">
            <bean class="com.aspectran.undertow.server.TowOptions">
                <property name="workerName">TOW</property>
                <property name="workerIoThreads">%{tow.server.workerIoThreads}</property>
                <property name="workerTaskMaxThreads">%{tow.server.workerTaskMaxThreads}</property>
            </bean>
        </property>

        <!-- Global Servlet Request Handler Factory & Middleware Chain -->
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

</aspectran>
```

#### Network Listener Configuration Elements
* **`httpListeners`**: Configures base HTTP port and binding host. Multiple listeners can be declared in an array to open multiple ports simultaneously.
* **`httpsListeners` (`HttpsListenerConfig`)**: Configures TLS/SSL secure communications, supporting direct HTTPS termination with `keyStorePath`, `keyStorePassword`, `keyPassword`, and `trustStorePath`.
* **`ajpListeners` (`AjpListenerConfig`)**: Configures AJP 1.3 protocol listeners for integration with Apache HTTP Server (`mod_jk` or `mod_proxy_ajp`).
* **`proxyAddressForwarding`**: Must be set to `true` when placed behind Nginx or cloud L4/L7 load balancers. This instructs the server to trust headers such as `X-Forwarded-For`, `X-Forwarded-Proto`, `X-Forwarded-Host`, and `X-Forwarded-Port`, ensuring actual remote client IPs and protocols are reflected in servlets and access logs.

#### XNIO Worker Threading Model (`workerOptions`)
Undertow relies on XNIO, a lightweight asynchronous I/O framework:
* **`workerIoThreads`**: Non-blocking I/O threads dedicated to socket read/write events. A small thread count services tens of thousands of concurrent connections and must never perform blocking operations. (Default: `Math.max(CPU Cores, 2)`).
* **`workerTaskMaxThreads`**: Upper bound for worker threads executing blocking operations, such as servlet processing, database queries, and disk I/O. Tune according to application characteristics to prevent queue starvation.

#### Undertow Server Options (`serverOptions`)
* **`decodeUrl` / `urlCharset`**: Governs URL decoding and character encoding (default: `true`, `UTF-8`).
* **`maxHeaderSize`**: Maximum allowed HTTP header size in bytes. Increase when handling large cookies or authentication tokens.
* **`maxEntitySize`**: Maximum allowed request body size.
* **`multipartMaxEntitySize`**: Upper threshold for multipart upload payloads.
* **`idleTimeout`**: Socket idle timeout in milliseconds.

### 5.3. Middleware Handler Chain Configuration

The `handlerChainWrappers` property chains pre/post-processing middleware before requests hit servlet contexts.

#### 5.3.1. Compression Encoding Handler (`EncodingHandlerWrapper`)
Conditionally applies Gzip compression to conserve network bandwidth and accelerate client response times.

```xml
<bean id="tow.server.handler.encodingHandlerWrapper"
      class="com.aspectran.undertow.server.handler.encoding.EncodingHandlerWrapper"
      scope="prototype">
    <property name="encodingProviders" type="array">
        <value>gzip</value>
    </property>
    <property name="encodingPredicates" type="array">
        <!-- Compress text-based web assets -->
        <bean class="com.aspectran.undertow.server.handler.encoding.ContentEncodingPredicates">
            <property name="mediaTypes" type="array">
                <value>text/html</value>
                <value>text/css</value>
                <value>text/javascript</value>
                <value>application/javascript</value>
            </property>
        </bean>
        <!-- Size threshold: Compress payload formats larger than 32 bytes -->
        <bean class="com.aspectran.undertow.server.handler.encoding.ContentEncodingPredicates">
            <property name="contentSizeLargerThan" valueType="long">32</property>
            <property name="mediaTypes" type="array">
                <value>text/xml</value>
                <value>text/plain</value>
                <value>application/json</value>
                <value>application/xml</value>
                <value>application/apon</value>
            </property>
        </bean>
    </property>
</bean>
```

#### 5.3.2. Path-Based Logging Group Handler (`PathBasedLoggingGroupHandlerWrapper`)
Automatically binds a logging group (`loggingGroup`) variable into the SLF4J MDC (Mapped Diagnostic Context) based on incoming request URL patterns. Combined with Logback, this cleanly segregates administrator logs, API logs, and batch logs into separate physical files.

```xml
<bean id="tow.server.handler.loggingGroupHandlerWrapper"
      class="com.aspectran.undertow.server.handler.logging.PathBasedLoggingGroupHandlerWrapper"
      scope="prototype">
    <property name="pathPatternsByGroupName" type="map">
        <entry name="console">
            +: /console/**
        </entry>
        <entry name="api">
            +: /api/**
        </entry>
    </property>
</bean>
```

#### 5.3.3. Access Log Handler (`AccessLogHandlerWrapper`)
Logs all incoming HTTP transaction outcomes in standard web server access log format.

```xml
<bean id="tow.server.handler.accessLogHandlerWrapper"
      class="com.aspectran.undertow.server.handler.accesslog.AccessLogHandlerWrapper"
      scope="prototype">
    <property name="category">io.undertow.accesslog</property>
    <properties profile="prod">
        <!-- Proxy environment: Extract real client IP via %{i,X-Forwarded-For} or %a -->
        <item name="formatString" tokenize="false">%t %a %{c,JSESSIONID} "%r" %s %b "%{i,Referer}" "%{i,User-Agent}"</item>
    </properties>
    <properties profile="!prod">
        <item name="formatString" tokenize="false">%t %a %{c,JSESSIONID} "%r" %s %b "%{i,Referer}" "%{i,User-Agent}"</item>
    </properties>
</bean>
```
* **Format String Token Reference**:
  * `%t`: Request timestamp (Apache standard date format)
  * `%a`: Remote IP address (automatically resolves actual client IP when `proxyAddressForwarding` is active)
  * `%{i,Header-Name}`: Request HTTP header value (`X-Forwarded-For`, `User-Agent`, `Referer`, etc.)
  * `%{c,Cookie-Name}`: Request cookie value (`JSESSIONID`)
  * `%r`: First line of HTTP request (`GET /index.html HTTP/1.1`)
  * `%s`: Response HTTP status code (`200`, `404`, `500`, etc.)
  * `%b`: Transmitted response bytes (excluding headers)
  * `%D`: Request processing duration in milliseconds

### 5.4. Servlet Context Deployment & Detailed Configuration (`tow-context-root.xml`)

`TowServletContext` mounts an independent web application context into Undertow, assembling servlet mappings, static resource managers, JSP compilation engines, custom tag libraries (TLD), WebSockets, and distributed session managers.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>

    <environment>
        <property name="tow.context.root.name">root</property>
    </environment>

    <bean id="tow.context.root.servletContext"
          class="com.aspectran.undertow.server.servlet.TowServletContext"
          scope="prototype">
        <!-- Context Identifier and URL Mount Path -->
        <property name="deploymentName">%{tow.context.root.name}</property>
        <property name="contextPath">/</property>

        <!-- Static Resource Manager Configuration -->
        <property name="resourceManager">
            <bean class="com.aspectran.undertow.server.handler.resource.TowResourceManager">
                <property name="base">/webapps/%{tow.context.root.name}</property>
            </bean>
        </property>

        <!-- Scratch Directory for Temporary Files -->
        <property name="scratchDir">%{system:aspectran.workPath:/work}/_webapps/%{tow.context.root.name}</property>

        <!-- Bind Session Manager and Cookie Policies -->
        <property name="sessionManager">#{tow.context.root.sessionManager}</property>
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

        <!-- Register Servlets (JSP Servlet and Aspectran WebActivityServlet) -->
        <property name="servlets" type="array">
            <bean class="com.aspectran.undertow.server.servlet.DefaultJspServlet">
                <property name="loadOnStartup" valueType="int">0</property>
            </bean>
            <bean class="com.aspectran.undertow.server.servlet.TowServlet">
                <argument>webActivityServlet</argument>
                <argument>com.aspectran.web.servlet.WebActivityServlet</argument>
                <property name="mappings" type="array">
                    <value>/</value>
                </property>
                <property name="loadOnStartup" valueType="int">1</property>
            </bean>
        </property>

        <!-- Initialize JSP Tag Libraries (TLD) and Jasper Container -->
        <property name="servletContainerInitializers" type="array">
            <bean class="com.aspectran.undertow.server.servlet.TowJasperInitializer">
                <property name="tldResources" type="array">
                    <value>classpath:com/aspectran/web/support/tags/aspectran.tld</value>
                    <value>/webapps/%{tow.context.root.name}/WEB-INF/taglibs/</value>
                </property>
            </bean>
        </property>

        <!-- Initialize JSR-356 WebSocket Server Container -->
        <property name="webSocketServerContainerInitializer">
            <bean class="com.aspectran.undertow.server.servlet.TowWebSocketServerContainerInitializer">
                <property name="idleTimeout" valueType="long">60000</property>
            </bean>
        </property>
    </bean>

    <!-- Session Manager Configuration (File vs Redis) -->
    <bean id="tow.context.root.sessionManager"
          class="com.aspectran.undertow.server.session.TowSessionManager"
          scope="prototype">
        <property name="sessionManagerConfig">
            <bean class="com.aspectran.core.context.config.SessionManagerConfig">
                <argument>
                    workerName: rn0
                    maxActiveSessions: 9999
                    maxIdleSeconds: 1800
                    evictionIdleSeconds: 900
                    maxIdleSecondsForNew: 60
                    evictionIdleSecondsForNew: 30
                    scavengingIntervalSeconds: 90
                    clusterEnabled: false
                </argument>
            </bean>
        </property>
        <!-- Local Development: File-based Session Store -->
        <properties profile="!prod">
            <item name="sessionStore">
                <bean class="com.aspectran.core.component.session.FileSessionStoreFactoryBean">
                    <property name="storeDir">%{system:aspectran.workPath:/work}/_sessions/%{tow.context.root.name}</property>
                    <property name="gracePeriodSecs" valueType="int">30</property>
                </bean>
            </item>
        </properties>
        <!-- Production: High-Availability Redis Session Clustering -->
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

</aspectran>
```

#### 5.4.1. Static Resource Management (`TowResourceManager` & `TowClassPathResourceManager`)

Aspectow Enterprise fully supports high-performance static asset delivery from both filesystems and classpaths.

##### 1) Filesystem-Based Resource Serving (`TowResourceManager`)
Extends Undertow's `PathResourceManager`, implementing [`ApplicationAdapterAware`](file:///Users/Aspectran/Projects/workspace/aspectran/with-undertow/src/main/java/com/aspectran/undertow/server/handler/resource/TowResourceManager.java#L35) for dynamic path resolution relative to the application home:

```xml
<property name="resourceManager">
    <bean class="com.aspectran.undertow.server.handler.resource.TowResourceManager">
        <!-- Base webroot directory (relative paths resolve against app root) -->
        <property name="base">/webapps/%{tow.context.root.name}</property>
        <!-- Resource mappings binding URL prefixes to external directories (Optional) -->
        <property name="resourceMappings">
            <item name="/assets">/../shared-assets</item>
            <item name="/upload">/work/upload</item>
        </property>
    </bean>
</property>
```

* **`base`**: Filesystem directory hosting static assets like HTML, CSS, JavaScript, and images (e.g., `/webapps/root`).
* **`resourceMappings`**: Binds external filesystem directories outside the webroot to specific URL path prefixes, simplifying access to shared asset folders or upload directories.

##### 2) Classpath-Based Resource Serving (`TowClassPathResourceManager`)
For modular application architectures where static web assets are packaged inside JAR archives or libraries on the classpath, [`TowClassPathResourceManager`](file:///Users/Aspectran/Projects/workspace/aspectran/with-undertow/src/main/java/com/aspectran/undertow/server/handler/resource/TowClassPathResourceManager.java) serves files directly using the class loader:

```xml
<property name="resourceManager">
    <bean class="com.aspectran.undertow.server.handler.resource.TowClassPathResourceManager">
        <!-- Classpath prefix where static resources reside -->
        <argument>static/</argument>
    </bean>
</property>
```

* **`prefix`**: Package path prefix in the classpath from which to locate assets (e.g., `static/` or `public/`).
* **Aspectran ClassLoader Integration**: Implements [`ActivityContextAware`](file:///Users/Aspectran/Projects/workspace/aspectran/with-undertow/src/main/java/com/aspectran/undertow/server/handler/resource/TowClassPathResourceManager.java#L48) to stream resources seamlessly out of JAR files without runtime unpack overhead.

#### 5.4.2. Servlet and JSP Mapping (`DefaultJspServlet` & `TowServlet`)
* **`DefaultJspServlet`**: Activates the Apache Jasper-based JSP compiler and servlet handler, compiling JSP files dynamically at runtime for rapid execution. (Can be omitted in contexts that rely purely on template engines like Thymeleaf).
* **`TowServlet`**: Registers Aspectran's core `WebActivityServlet` at the root mapping (`/`), dispatching all incoming web requests into the Aspectran Translet engine.

#### 5.4.3. Custom JSP Tag Library (TLD) Configuration (`TowJasperInitializer`)
To use framework tags such as `<aspectran:message>` and `<aspectran:token>` or load custom project TLDs in JSP views, declare paths under `tldResources`:
* `classpath:com/aspectran/web/support/tags/aspectran.tld`: Standard Aspectran tag library
* `/webapps/{contextName}/WEB-INF/taglibs/`: Directory path containing custom `.tld` definitions

#### 5.4.4. JSR-356 WebSocket Configuration (`TowWebSocketServerContainerInitializer`)
Initializes Undertow's low-latency WebSocket engine.
* Supports standard JSR-356 annotations (`@ServerEndpoint`).
* `idleTimeout`: Maximum socket idle duration (in milliseconds) before connection closure.

#### 5.4.5. Servlet Session Management (`TowSessionManager` & `TowServletSessionConfig`)
Bridges Aspectran's enterprise state management engine with Undertow's servlet specification (`io.undertow.server.session.SessionManager`).
* **[`TowSessionManager`](file:///Users/Aspectran/Projects/workspace/aspectran/with-undertow/src/main/java/com/aspectran/undertow/server/session/TowSessionManager.java)**:
  * Delegates standard servlet session lifecycle events directly to Aspectran's core [`DefaultSessionManager`](file:///Users/Aspectran/Projects/workspace/aspectran/core/src/main/java/com/aspectran/core/component/session/DefaultSessionManager.java).
  * Transparently adapts between servlet `HttpSession` contracts and Aspectran's unified `SessionAdapter`.
* **`TowServletSessionConfig` (Servlet Cookie Policies)**:
  * `sessionTrackingModes`: Explicitly configured as `COOKIE` to prevent URL rewriting session leak vulnerabilities.
  * `path`: URL scope for session cookies (default: `/`).
  * `domain`: Top-level domain scope for cross-subdomain sharing (e.g., `.aspectran.com`).
  * `httpOnly` / `secure`: Mitigates XSS injection and enforces TLS-only encrypted transit.
* **Storage Strategy (In-Memory / File / Redis)**:
  * Pure In-Memory Mode: Omitting `sessionStore` entirely runs an ultra-fast in-memory session manager inside the JVM heap with zero disk or network I/O.
  * Local Development (`!prod`): `FileSessionStoreFactoryBean` preserves sessions across server restarts.
  * Production (`prod`): High-availability Redis clustering via `DefaultLettuceSessionStoreFactoryBean`.

> [!TIP]
> For complete details on `SessionManagerConfig` lifecycle tuning, bot/crawler session optimization, `@NonPersistent` attributes, and distributed Redis failover, consult the **[`Aspectran Session Manager Guide`](file:///Users/Aspectran/Projects/workspace/aspectran.github.io/_pages/en/docs/guides/aspectran-session-manager.md)**.

### 5.5. Console Management Context (`tow-context-console.xml`)

Undertow provides full servlet container isolation, enabling the deployment of the centralized **Console management context (`/console`)** alongside the main application context (`/`) on a single port (e.g., 8081).

`/app/config/server/undertow/tow-context-console.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>
    <description>Aspectow Enterprise Console Context Configuration</description>

    <!-- Mount Console Control Plane Rules (Full UI or Headless mode) -->
    <append resource="com/aspectran/aspectow/console/config/rules/context/tow-context-console.xml"/>
</aspectran>
```

* **Complete Servlet Context Isolation**:
  * The main service and the Console context maintain independent servlet session managers, filter/listener chains, and Aspectran DI containers (`ActivityContext`).
  * Admin sessions and management beans in the Console dashboard never interfere with primary business services.
* **Flexible Mode Switching**:
  * In single-node deployments, loading `tow-context-console.xml` activates the full web dashboard for immediate administrative browser access.
  * In clustered deployments with dedicated central console nodes, loading `tow-context-console-headless.xml` runs an ultra-lean backend control plane (WebSocket streaming, remote CLI dispatch, scheduler control APIs) without rendering UI views.

### 5.6. Runtime Support Components (`tow-support.xml`)

`tow-support.xml` registers helper components that intercept server lifecycle events and expose diagnostic telemetry.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>

    <!-- Dynamically register session lifecycle listeners (UserTrackingListener, etc.) for a specific context -->
    <bean id="sessionListenerRegistration"
          class="com.aspectran.undertow.support.SessionListenerRegistrationBean" lazyInit="true">
        <argument>tow.server</argument>
        <argument>root</argument>
    </bean>

    <!-- Expose bound HTTP listener port metadata to the monitoring plane at runtime -->
    <bean class="com.aspectran.aspectow.console.cluster.support.TowServerPortProvider">
        <argument>tow.server</argument>
    </bean>

</aspectran>
```

## 6. Supporting Features Configuration

Application logging and monitoring are managed independently within dedicated subdirectories under `/config`.

### 6.1. Logging Configuration (`/config/logging/`)

Aspectow Enterprise is built upon the Logback framework, adopting a modular architecture where fine-grained XML definitions are aggregated via `<include>` directives.

```
app/config/logging/
├── logback.xml                 # Production Logging Configuration (File-Centric)
├── logback-debug.xml           # Development & Debugging Configuration (Includes Console)
└── included/
    ├── logback-default.xml     # Main Business Application Log (${LOGGING_GROUP}.log)
    ├── logback-undertow.xml    # Undertow Core & Access Log (${LOGGING_GROUP}-undertow.log)
    ├── logback-scheduler.xml   # Dedicated Scheduler Task Log (${LOGGING_GROUP}-scheduler.log)
    └── logback-console.xml     # Terminal Standard Output (STDOUT) Appender
```

#### Key Configuration Files

* **`logback.xml`**:
  * Default entry point for production deployments. Omits console appenders to eliminate terminal I/O latency, activating file-based rolling loggers (`logback-default.xml`, `logback-scheduler.xml`, `logback-undertow.xml`).
* **`logback-debug.xml`**:
  * Entry point for local development and debugging. Loads `logback-console.xml` alongside file appenders to stream ANSI color-highlighted logs to the terminal, elevating package levels to `DEBUG` or `TRACE`.
  * Usage: `app/bin/shell.sh --debug`
* **`included/logback-default.xml`**:
  * Handles application business logs. Couples [`LoggingGroupDiscriminator`](file:///Users/Aspectran/Projects/workspace/aspectran/logging/src/main/java/com/aspectran/logging/LoggingGroupDiscriminator.java) with `SiftingAppender` to route logs into `app/logs/${LOGGING_GROUP}.log` (e.g., `root.log`, `console.log`) based on the logging group resolved by `PathBasedLoggingGroupHandlerWrapper`.
  * Pre-configured with time-and-size rolling policies (`SizeAndTimeBasedRollingPolicy`, 10MB per file, 30-day retention).
* **`included/logback-undertow.xml`**:
  * Collects Undertow server engine logs (`io.undertow`) and access logs (`io.undertow.accesslog`), partitioned into `app/logs/${LOGGING_GROUP}-undertow.log`.
* **`included/logback-scheduler.xml`**:
  * Isolates Aspectran Scheduler (`com.aspectran.core.scheduler.activity`) execution history into `app/logs/${LOGGING_GROUP}-scheduler.log`, ensuring periodic batch logs do not clutter web transaction logs.
* **`included/logback-console.xml`**:
  * Colorized `ConsoleAppender` configuration for terminal readability during development.

### 6.2. Aspectow Console Configuration (`/config/console/`)

The Aspectow Enterprise Edition comes with a **built-in centralized management web console ([Aspectow Console](/en/docs/aspectow/console/))** for cluster node monitoring, remote command execution, and dynamic scheduler control.
* `/config/console/node-config.apon`: Node identification, group, and heartbeat intervals within the cluster
* `/config/console/node-rules.xml`: Registers cluster control plane components (`NodeManagerFactoryBean`)
* For operational and architectural details, consult the [Aspectow Console Configuration Guide](/en/docs/aspectow/console/configuration-guide/).
