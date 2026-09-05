---
title: Aspectow Edge Configuration Guide
teaser: Server configuration guide for Aspectow Edge, combining the Netty event loop, Java 21 Virtual Threads, and a multi-context-based Headless control plane architecture.
subheadline: Aspectow Edge
---

## 1. Introduction: A Lean Runtime for the Post-Reactive Era

Aspectow Edge is a next-generation lightweight runtime platform engineered to overcome the code complexity and debugging barriers introduced by reactive programming (Mono/Flux), delivering peak performance and developer productivity in cloud-native and microservice architectures.

By completely stripping away the legacy overhead of traditional servlet specifications, Aspectow Edge organically combines the asynchronous, event-driven [Netty](https://netty.io) networking engine at the network I/O tier with **Java 21 Virtual Threads** at the business execution tier. This enables developers to write intuitive, familiar synchronous Aspectran Translet code while concurrently servicing tens of thousands of connections at lightning speed without thread pool exhaustion.

Furthermore, Aspectow Edge natively supports a **complete Multi-Context Architecture** in Netty, mirroring Undertow's multi-context isolation. Alongside the main business service context, the **Console Management Context (`/console`)** is mounted as an independent Netty context, integrating seamlessly with [Aspectow Console](/en/docs/aspectow/console/) via identical communication pipelines and configuration files. Depending on your cluster deployment strategy, every service node can directly host the full Console web UI, or if dedicated console nodes are separated, each service node can run a Headless context omitting the UI assets for extreme resource efficiency.

This guide provides an end-to-end walkthrough of Aspectow Edge—from standard project layout and Maven builds to Netty embedded server listeners, virtual thread dispatchers, compression encoding, logging groups, access logs, static resource handlers, WebSockets, sessions, and multi-context Headless Console federation.

## 2. Standard Project Structure

Aspectow Edge dispenses with unnecessary servlet scratch directories, adhering to a clean, minimalist filesystem hierarchy optimized for microservice packaging and containerized (Docker/Kubernetes) deployments.

```
/
├── app/                  # Application Home Directory (Runtime Base Path)
│   ├── bin/              # Lifecycle and Diagnostic Scripts (daemon.sh, shell.sh)
│   ├── cmd/              # File-based Async Command Queue (File Commander)
│   ├── config/           # Application and Netty Server Configuration Files
│   │   ├── aspectran-config.apon  # Runtime Framework and Profile Configuration
│   │   ├── aspectran-rules.xml    # Business Components and Translet Rules
│   │   ├── console/               # Cluster Node Governance & Monitoring Settings
│   │   │   ├── node-config.apon   # Node Identification and Heartbeat Settings
│   │   │   ├── node-rules.xml     # Node Control Component Rules
│   │   │   └── appmon-config.apon # AppMon Metrics Collection Settings
│   │   ├── logging/               # Logback Logging Configuration (logback-netty.xml)
│   │   └── server/                # Netty Server and Context Module Definitions
│   │       ├── server.xml         # Master Server Entry Point
│   │       └── netty/             # Netty Engine, Contexts, and Support Beans
│   │           ├── netty-server.xml          # Core Netty Engine and Listeners
│   │           ├── netty-context-root.xml    # Primary Service Context (/)
│   │           ├── netty-context-console.xml # Headless Control Plane Context (/console)
│   │           └── netty-support.xml         # Runtime Support Components
│   ├── lib/              # Maven Dependency External Libraries (JARs)
│   │   └── ext/          # Packaged Application JAR for the Current Edge Service
│   ├── logs/             # Application Business Logs and Netty Access Logs
│   ├── temp/             # Multipart Uploads and Ephemeral Scratch Files
│   ├── webapps/          # Static Web Resources and Frontend Assets Root
│   │   └── root/         # Static Files for the Default Service Context
│   └── work/             # Persistent File-Based Session Storage (Optional)
├── setup/                # Systemd Service Installation Scripts
├── src/                  # Java Source Code and Development Resources
└── pom.xml               # Maven Build Specification
```

### Key Directory Details

- **`/app/bin`**: Contains background daemon management scripts (`daemon.sh`) and the interactive diagnostic CLI environment (`shell.sh`).
- **`/app/config/console`**: Houses identical node configuration files (`node-config.apon`, `node-rules.xml`, `appmon-config.apon`) to Undertow (Enterprise), governing heartbeats and remote dispatch with central control planes.
- **`/app/config/server/netty`**: Contains modular server components including the core Netty engine (`netty-server.xml`), primary context (`netty-context-root.xml`), Headless Console context (`netty-context-console.xml`), and support beans (`netty-support.xml`).
- **`/app/webapps/root`**: Serves as the webroot when delivering static web assets (HTML/CSS/JS/images) directly through Netty alongside REST APIs.

## 3. Maven Build Configuration (`pom.xml`)

### 3.1. Required Compiler Properties

Because Aspectow Edge actively leverages Java 21 Virtual Threads, the compiler release must be set to `21` or higher, and the `-parameters` flag must be enabled for reflective parameter binding in Translet action methods.

```xml
<properties>
    <maven.compiler.release>21</maven.compiler.release>
    <maven.compiler.parameters>true</maven.compiler.parameters>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <netty.version>4.2.17.Final</netty.version>
</properties>
```

### 3.2. Core Build Plugins

During compilation, `maven-jar-plugin` builds the application bytecode into `app/lib/ext/`, while `maven-dependency-plugin` gathers third-party Netty and Aspectran runtime libraries into `app/lib/`.

```xml
<build>
    <plugins>
        <plugin>
            <artifactId>maven-jar-plugin</artifactId>
            <version>3.5.1</version>
            <configuration>
                <outputDirectory>app/lib/ext</outputDirectory>
            </configuration>
        </plugin>
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
    </plugins>
</build>
```

### 3.3. Netty Native Transport Dependencies (Optional)

Aspectow Edge's embedded Netty server inspects the host operating system at startup to auto-detect and activate kernel-level native socket transports (Linux Epoll, macOS KQueue). To unlock maximum socket throughput, declare the appropriate native transport classifier in your `pom.xml`:

* **Linux (x86_64)**: Standard 64-bit Linux server environments
  ```xml
  <dependency>
      <groupId>io.netty</groupId>
      <artifactId>netty-transport-native-epoll</artifactId>
      <version>${netty.version}</version>
      <classifier>linux-x86_64</classifier>
  </dependency>
  ```
* **Linux (ARM64 / aarch64)**: Cloud ARM instances such as AWS Graviton, Ampere, etc.
  ```xml
  <dependency>
      <groupId>io.netty</groupId>
      <artifactId>netty-transport-native-epoll</artifactId>
      <version>${netty.version}</version>
      <classifier>linux-aarch_64</classifier>
  </dependency>
  ```
* **macOS (Apple Silicon - aarch64)**: Local development workstations (M1/M2/M3/M4)
  ```xml
  <dependency>
      <groupId>io.netty</groupId>
      <artifactId>netty-transport-native-kqueue</artifactId>
      <version>${netty.version}</version>
      <classifier>osx-aarch_64</classifier>
  </dependency>
  ```
* **macOS (Intel - x86_64)**:
  ```xml
  <dependency>
      <groupId>io.netty</groupId>
      <artifactId>netty-transport-native-kqueue</artifactId>
      <version>${netty.version}</version>
      <classifier>osx-x86_64</classifier>
  </dependency>
  ```
* **Windows and Fallback OS**: If native libraries are absent from the classpath or when running on Windows, the runtime automatically and safely falls back to standard Java NIO (`NioEventLoopGroup`).

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
        aspectow.demo
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
        com.aspectran.netty.shell.command.NettyCommand
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
        com.aspectran.netty.daemon.command.NettyCommand
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
    trailingSlashRedirect: true
    acceptable: {
        +: /**
    }
}
```

### 4.2. Detailed Configuration Block Breakdown

* **`system.properties`**:
  * `aspectran.encryption.*`: Defines the PBE master password and algorithm to encrypt sensitive credentials (`enc:...`), preventing plaintext database passwords or tokens from leaking in version control. (Recommended in production: `PBEWITHHMACSHA256ANDAES_128`)
  * `aspectran.profiles.base.console`: The master switch dictating Console context behavior. Including `console.ui` activates the full web browser UI. In distributed clusters with dedicated console nodes, omitting `console.ui` transitions the node into a pure backend Headless control plane.
* **`context`**:
  * `rules`: Systematically imports core XML rule files, including the master server setup (`server.xml`) and business Translet definitions (`aspectran-rules.xml`). In Aspectow Edge, Translets dispatch directly on top of pure Netty contexts without servlets, achieving minimal latency.
  * `resources`: Dynamically binds packaged application JARs under `/lib/ext` into the runtime classpath.
  * `scan`: Auto-discovers annotated Aspectran components within designated packages (`aspectow.demo`).
* **`scheduler`**: Controls startup delay (`startDelaySeconds`) and graceful termination (`waitOnShutdown`) for scheduled jobs.
* **`shell`**: Configures the interactive diagnostic terminal (`app/bin/shell.sh`). The included `NettyCommand` enables instant CLI inspection of bound ports and active channel states.
* **`daemon`**: Configures the background service daemon (`app/bin/daemon.sh`) and File Commander queue watching `app/cmd/incoming/` for asynchronous file-based administrative commands.
* **`web`**: Configures URI decoding charsets and trailing slash (`/`) canonicalization redirects.

## 5. Embedded Netty Server Configuration Guide

Aspectow Edge's embedded server is managed modularly through XML definitions organized inside `/app/config/server/`.

### 5.1. Modular Server Entry Point (`server.xml`)

`server.xml` serves as the master aggregation entry point, combining the Netty server engine, primary service context, Headless Console context, and support modules via `<append>` directives.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>
    <description>Aspectow Edge Netty Server Master Configuration</description>

    <!-- Netty Core Server Engine and Global Handler Chain -->
    <append file="/config/server/netty/netty-server.xml"/>

    <!-- Main Business Service Context (Root Path: /) -->
    <append file="/config/server/netty/netty-context-root.xml"/>

    <!-- Console Management Context (Control Plane: /console) -->
    <append file="/config/server/netty/netty-context-console.xml"/>

    <!-- Runtime Support Beans and Server Port Provider -->
    <append file="/config/server/netty/netty-support.xml"/>
</aspectran>
```

### 5.2. Netty Core Engine & Multi-Context Binding (`netty-server.xml`)

`DefaultNettyServer` is the central server orchestrator responsible for managing the EventLoopGroup, virtual thread dispatchers, network listeners, global handler pipelines, and **multi-context mounts (`contexts`)**.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>

    <environment>
        <property name="netty.server.listener.http.port" valueType="int">8081</property>
        <property name="netty.server.listener.http.host">0.0.0.0</property>
        <properties profile="prod">
            <item name="netty.server.domain">aspectran.com</item>
        </properties>
    </environment>

    <bean id="netty.server" class="com.aspectran.netty.server.DefaultNettyServer">
        <!-- Enable Java 21 Virtual Thread Dispatching (Core Feature) -->
        <property name="virtualThreads" valueType="boolean">true</property>
        <!-- Auto-detect OS Native Transports (Linux Epoll / macOS KQueue) -->
        <property name="nativeTransport" valueType="boolean">true</property>
        <!-- Restore Real Client IP behind Reverse Proxies (Nginx / ALB) -->
        <property name="proxyAddressForwarding" valueType="boolean">true</property>

        <!-- Socket Options and Connection Tuning -->
        <property name="bossThreads" valueType="int">1</property>
        <property name="workerThreads" valueType="int">0</property> <!-- 0: Auto-calculated based on CPU cores -->
        <property name="shutdownTimeoutSecs" valueType="int">5</property>
        <property name="idleTimeout" valueType="int">60</property>
        <property name="maxContentLength" valueType="int">10485760</property> <!-- 10MB -->

        <!-- Global Handler Pipeline -->
        <property name="accessLogHandler">#{netty.server.handler.accessLogHandler}</property>
        <property name="encodingHandler">#{netty.server.handler.encodingHandler}</property>
        <property name="loggingGroupHandler">#{netty.server.handler.loggingGroupHandler}</property>

        <!-- HTTP Listener Configuration -->
        <property name="listeners" type="array">
            <bean class="com.aspectran.netty.server.NettyListenerConfig">
                <property name="host">%{netty.server.listener.http.host}</property>
                <property name="port" valueType="int">%{netty.server.listener.http.port}</property>
            </bean>
        </property>

        <!-- Register Netty Multi-Contexts: Main Service & Console Control Plane -->
        <property name="contexts" type="array">
            <value>#{netty.context.root}</value>
            <value>#{netty.context.console}</value>
        </property>
    </bean>

    <!-- Netty Access Log Handler -->
    <bean id="netty.server.handler.accessLogHandler"
          class="com.aspectran.netty.server.handler.accesslog.NettyAccessLogHandler"
          scope="prototype">
        <property name="category">com.aspectran.netty.accesslog</property>
        <property name="formatString" tokenize="false">%t %a %{c,JSESSIONID} "%r" %s %b "%{i,Referer}" "%{i,User-Agent}"</property>
    </bean>

    <!-- Content Compression Encoding Handler -->
    <bean id="netty.server.handler.encodingHandler"
          class="com.aspectran.netty.server.handler.encoding.NettyEncodingHandler"
          scope="prototype">
        <property name="encodingProviders" type="array">
            <value>gzip</value>
        </property>
        <property name="encodingPredicates" type="array">
            <bean class="com.aspectran.netty.server.handler.encoding.ContentEncodingPredicates">
                <property name="mediaTypes" type="array">
                    <value>text/html</value>
                    <value>text/css</value>
                    <value>text/javascript</value>
                    <value>application/javascript</value>
                </property>
            </bean>
            <bean class="com.aspectran.netty.server.handler.encoding.ContentEncodingPredicates">
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

    <!-- URL Path-Based Logging Group Routing Handler -->
    <bean id="netty.server.handler.loggingGroupHandler"
          class="com.aspectran.netty.server.handler.logging.PathBasedLoggingGroupHandler"
          scope="prototype">
        <property name="pathPatternsByGroupName">
            <item name="order">
                +: /order/**
                +: /checkout/**
            </item>
            <item name="payment">
                +: /payment/**
                +: /billing/**
            </item>
            <item name="api">
                +: /api/**
                -: /api/internal/**
            </item>
        </property>
    </bean>

</aspectran>
```

#### 5.2.1. Virtual Thread Dispatching (`virtualThreads=true`)
Aspectow Edge's standout architectural advantage:
* When `virtualThreads` is set to `true`, Netty's I/O EventLoop only handles incoming socket frames and HTTP aggregation, immediately dispatching the actual business execution (Translet actions, database transactions, external RPC calls) onto a **Java 21 Virtual Thread Pool (`Executors.newVirtualThreadPerTaskExecutor()`)**.
* Because virtual threads carry negligible OS memory overhead, tens of thousands of concurrent blocking I/O operations can execute without exhausting carrier threads, resuming instantly.
* Developers can preserve sequential, readable imperative code without the mental gymnastics of reactive chaining.

#### 5.2.2. OS Native Transport Auto-Detection (`nativeTransport=true`)
With `nativeTransport=true`, the server inspects the host operating system and runtime classpath to dynamically select the optimal network transport:
* **Linux**: Automatically activates kernel Epoll via `EpollEventLoopGroup` and `EpollServerSocketChannel` (requires `netty-transport-native-epoll`).
* **macOS**: Automatically activates BSD KQueue via `KQueueEventLoopGroup` and `KQueueServerSocketChannel` (requires `netty-transport-native-kqueue`).
* **Windows & Fallback**: Automatically and safely falls back to standard Java NIO (`NioEventLoopGroup`, `NioServerSocketChannel`) on unsupported platforms or when native dependencies are omitted.

For architecture-specific Maven dependency configurations (x86_64, aarch64), refer to [3.3. Netty Native Transport Dependencies (Optional)](#33-netty-native-transport-dependencies-optional).

#### 5.2.3. Reverse Proxy & Client Address Forwarding (`proxyAddressForwarding=true`)
When deployed behind Nginx, Kubernetes Ingress, or cloud ALBs, enabling `proxyAddressForwarding` ensures that client IP addresses (`X-Forwarded-For`) and protocols (`X-Forwarded-Proto`) are accurately reconstructed and exposed to Netty access logs and Translet request adapters.

#### 5.2.4. URL Path-Based Logging Group Routing (`PathBasedLoggingGroupHandler`)
In high-throughput microservice environments, writing all request logs to a single monolithic `app.log` causes I/O contention and hinders troubleshooting. [`PathBasedLoggingGroupHandler`](https://github.com/aspectran/aspectran/blob/master/with-netty/src/main/java/com/aspectran/netty/server/handler/logging/PathBasedLoggingGroupHandler.java) analyzes incoming URI paths to route logs into discrete, domain-specific log files in real time.

* **Operating Mechanism**:
  * Evaluates incoming request paths against APON wildcard pattern rules (`+:` include, `-:` exclude) defined in `pathPatternsByGroupName` to determine the active logging group (`groupName`).
  * Attaches the resolved group name to the Netty channel attribute (`LOGGING_GROUP_KEY`) via [`ChannelLoggingGroupHelper`](https://github.com/aspectran/aspectran/blob/master/with-netty/src/main/java/com/aspectran/netty/server/handler/logging/ChannelLoggingGroupHelper.java), binding it simultaneously into the SLF4J MDC context of the virtual thread servicing the request.
  * In Logback (`logback-netty.xml`), configuring `LoggingGroupDiscriminator` or `SiftingAppender` automatically segregates logs into dedicated files (e.g., `order.log`, `payment.log`, `api.log`).
  * Non-matching requests fall back to the default group of the active `NettyContext`, and `LoggingGroupHelper.clear()` is invoked in a `finally` block to prevent thread context leakage.

### 5.3. Main Service Context (`netty-context-root.xml`)

A `NettyContext` represents an isolated application runtime mounted at a specific context path.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>

    <environment>
        <property name="netty.context.root.name">root</property>
    </environment>

    <bean id="netty.context.root" class="com.aspectran.netty.server.NettyContext">
        <!-- Context Mount Path -->
        <property name="contextPath">/</property>

        <!-- Static Resource Handler (Zero-Copy Support) -->
        <property name="resourceHandler">
            <bean class="com.aspectran.netty.server.handler.resource.NettyResourceHandler">
                <property name="basePath">/webapps/%{netty.context.root.name}</property>
            </bean>
        </property>

        <!-- Bind Session Manager -->
        <property name="sessionManager">#{netty.context.root.sessionManager}</property>
    </bean>

    <!-- Lightweight Session Manager Configuration -->
    <bean id="netty.context.root.sessionManager"
          class="com.aspectran.netty.server.session.NettySessionManager"
          scope="prototype">
        <property name="sessionManagerConfig">
            <bean class="com.aspectran.core.context.config.SessionManagerConfig">
                <argument>
                    workerName: edge0
                    maxActiveSessions: 50000
                    maxIdleSeconds: 1800
                    evictionIdleSeconds: 600
                    maxIdleSecondsForNew: 60
                    evictionIdleSecondsForNew: 30
                    scavengingIntervalSeconds: 60
                    clusterEnabled: false
                </argument>
            </bean>
        </property>
        <!-- Local File-based Session Store -->
        <property name="sessionStore">
            <bean class="com.aspectran.core.component.session.FileSessionStoreFactoryBean">
                <property name="storeDir">%{system:aspectran.workPath:/work}/_sessions/%{netty.context.root.name}</property>
                <property name="gracePeriodSecs" valueType="int">30</property>
            </bean>
        </property>
    </bean>

</aspectran>
```

#### 5.3.1. Non-Servlet Static Resource Handlers (`NettyResourceHandler` & `NettyClassPathResourceHandler`)

Aspectow Edge delivers static assets (HTML, CSS, JavaScript, images, web fonts) straight out of the Netty inbound channel pipeline at maximum speed without passing through a servlet container.

##### 1) Filesystem-Based Resource Serving (`NettyResourceHandler`)
To serve assets stored in a local directory on disk, use [`NettyResourceHandler`](https://github.com/aspectran/aspectran/blob/master/with-netty/src/main/java/com/aspectran/netty/server/handler/resource/NettyResourceHandler.java).

```xml
<!-- Filesystem Static Resource Handler Configuration -->
<bean id="netty.resourceHandler"
      class="com.aspectran.netty.server.handler.resource.NettyResourceHandler">
    <!-- Base directory for static files (relative paths resolve against app root) -->
    <property name="basePath">/webapps/%{netty.context.root.name}</property>
    <!-- Context prefix stripped from request URIs (root context uses "/") -->
    <property name="contextPath">%{netty.context.root.contextPath:/}</property>
    <!-- Priority index files for directory requests (default: index.html, index.htm) -->
    <property name="indexFiles" type="array">
        <value>index.html</value>
        <value>index.htm</value>
    </property>
    <!-- Guard sensitive directories such as WEB-INF and META-INF (default: true) -->
    <property name="blockProtectedDirectories" valueType="boolean">true</property>
    <!-- URL path filter patterns (Optional: APON format or pattern array) -->
    <property name="pathPatterns">
        <value>
            +: /assets/**
            +: /css/**
            +: /js/**
            +: /images/**
            +: /favicon.ico
            -: /assets/secret/**
        </value>
    </property>
</bean>
```

##### 2) Classpath-Based Resource Serving (`NettyClassPathResourceHandler`)
For self-contained microservices where static UI assets are packaged directly within JAR archives or libraries on the classpath, use [`NettyClassPathResourceHandler`](https://github.com/aspectran/aspectran/blob/master/with-netty/src/main/java/com/aspectran/netty/server/handler/resource/NettyClassPathResourceHandler.java).

```xml
<!-- Classpath Static Resource Handler Configuration -->
<bean id="netty.resourceHandler"
      class="com.aspectran.netty.server.handler.resource.NettyClassPathResourceHandler">
    <!-- Base classpath package prefix -->
    <property name="prefix">static/</property>
    <!-- Context prefix stripped from request URIs -->
    <property name="contextPath">%{netty.context.root.contextPath:/}</property>
    <!-- Priority index files for directory requests -->
    <property name="indexFiles" type="array">
        <value>index.html</value>
        <value>index.htm</value>
    </property>
    <!-- URL path filter patterns -->
    <property name="pathPatterns">
        <value>
            +: /**
            -: /api/**
        </value>
    </property>
</bean>
```

* `NettyClassPathResourceHandler` extends `NettyResourceHandler`, fully inheriting the **exact same security sanitization (`sanitizePath`), protected directory guards (`blockProtectedDirectories`), APON wildcard filtering (`pathPatterns`), directory index mapping (`indexFiles`), and conditional HTTP caching (`If-Modified-Since` -> `304 Not Modified`)**.
* Implements [`ActivityContextAware`](https://github.com/aspectran/aspectran/blob/master/with-netty/src/main/java/com/aspectran/netty/server/handler/resource/NettyClassPathResourceHandler.java#L59) to obtain the context class loader, streaming resources directly through Netty's `ChunkedStream` without memory overhead.

##### Supported Bean Properties

* **`basePath` / `baseDir`** (`NettyResourceHandler` only):
  * Filesystem directory containing static assets.
  * Implements [`ApplicationAdapterAware`](https://github.com/aspectran/aspectran/blob/master/with-netty/src/main/java/com/aspectran/netty/server/handler/resource/NettyResourceHandler.java#L19); relative paths like `/webapps/root` resolve automatically against the application home directory.
* **`prefix`** (`NettyClassPathResourceHandler` only):
  * Package path prefix in the classpath from which to locate assets (e.g., `static/` or `public/`).
* **`contextPath`**:
  * Context prefix tied to the handler. Stripped from incoming URIs to resolve relative asset paths.
* **`pathPatterns`**:
  * Include/exclude wildcard pattern rules for handled URL paths.
  * Specified as APON strings (`+: /static/**`, `-: /static/secret/**`) or string arrays.
  * When set, matching requests are served as static files, while non-matching requests bypass the handler and pass to subsequent handlers (e.g., the Translet dispatcher) via `ctx.fireChannelRead(request)`.
* **`indexFiles`**:
  * Default files to serve when requesting a directory like `/` or `/docs/` (default: `index.html`, `index.htm`).
  * Setting this to `null` disables directory index auto-resolution.
* **`blockProtectedDirectories`**:
  * Whether to block client requests targeting sensitive system directories like `/WEB-INF/` and `/META-INF/` (default: `true`).
  * Case-insensitively inspects leading, intermediate, and trailing path segments to ensure complete protection.

##### Internal Operations & Performance Mechanisms

* **Hybrid Zero-Copy & Chunked Streaming Transfer**:
  * **Cleartext HTTP (Filesystem)**: Uses [`DefaultFileRegion`](https://github.com/aspectran/aspectran/blob/master/with-netty/src/main/java/com/aspectran/netty/server/handler/resource/NettyResourceHandler.java#L475) leveraging the OS kernel `sendfile` system call to stream data directly from disk to network socket buffers without copying into user-space memory.
  * **Classpath Resources & TLS/Compression**: When serving from JAR archives or when `SslHandler`/`HttpContentCompressor` is present in the pipeline, the handler automatically transitions to 8KB chunked streaming via [`HttpChunkedInput`](https://github.com/aspectran/aspectran/blob/master/with-netty/src/main/java/com/aspectran/netty/server/handler/resource/NettyResourceHandler.java#L471) and `ChunkedFile` or `ChunkedStream` for safe encryption and compression.
* **Directory Traversal Defense**:
  * Sanitizes request paths via `sanitizePath`, rejecting relative navigation (`..`) and hidden segments (`.`).
  * For filesystem serving, enforces `file.getCanonicalPath().startsWith(baseDir.getCanonicalPath())` to prevent path traversal attacks escaping the designated root.
* **HTTP Caching & Conditional Requests (`304 Not Modified`)**:
  * Validates the client's `If-Modified-Since` header against the file's `lastModified` timestamp in seconds; returns a lightweight `304 Not Modified` without body data if unchanged.
  * Automatically sets standard response headers: `Date`, `Expires`, `Cache-Control` (`private, max-age=60`), and `Last-Modified`.
* **MIME Type Auto-Detection**:
  * Probes MIME type via `java.nio.file.Files.probeContentType()`, falling back to file extensions (`html`, `css`, `js`, `json`, `svg`, `png`, `jpg`, `txt`, `xml`, etc.) with proper UTF-8 charset specifications.
* **HTTP Method Validation**:
  * Handles `GET` and `HEAD` requests only. On `HEAD` requests, skips the content body and writes headers exclusively, conserving network bandwidth.

#### 5.3.2. Non-Servlet Session Management (`NettySessionManager` & `NettySessionConfig`)

Aspectow Edge completely eliminates the heavyweight overhead of servlet session tracking by running an ultra-lightweight session manager directly inside Netty's inbound and outbound HTTP pipeline.

##### 1) Architecture & Internal Mechanics

* **[`NettySessionManager`](https://github.com/aspectran/aspectran/blob/master/with-netty/src/main/java/com/aspectran/netty/server/session/NettySessionManager.java)**:
  * Extends Aspectran core's [`DefaultSessionManager`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/component/session/DefaultSessionManager.java) directly.
  * Operates completely independent of the Servlet API (`HttpServletRequest`, `HttpSession`), decoding the HTTP `Cookie` header on incoming requests and encoding the `Set-Cookie` header on outbound responses.
  * Preserves single-node memory caching, idle eviction, and periodic background scavenging (`HouseKeeper`) without container baggage.

##### 2) Configuring Session Cookie Policies via `NettySessionConfig`

Session cookie generation in Netty is configured cleanly via the [`NettySessionConfig`](https://github.com/aspectran/aspectran/blob/master/with-netty/src/main/java/com/aspectran/netty/server/session/NettySessionConfig.java) bean:

```xml
<property name="sessionConfig">
    <bean class="com.aspectran.netty.server.session.NettySessionConfig">
        <property name="cookieName">JSESSIONID</property>
        <property name="cookiePath">/</property>
        <property name="cookieDomain">.aspectran.com</property>
        <property name="httpOnly" valueType="boolean">true</property>
        <property name="secure" valueType="boolean">false</property>
        <property name="sameSite">Lax</property>
        <property name="maxAge" valueType="int">-1</property>
    </bean>
</property>
```

* **`cookieName`**: Cookie name for session tracking (default: `JSESSIONID`).
* **`cookiePath`**: URL scope for the session cookie (default: `/`).
* **`cookieDomain`**: Domain scope for cross-subdomain cookie sharing (e.g., `.aspectran.com`).
* **`httpOnly`**: Blocks JavaScript `document.cookie` access to prevent XSS session theft (default: `true`).
* **`secure`**: Restricts cookie transmission to HTTPS encrypted channels (recommended in production: `true`).
* **`sameSite`**: CSRF defense setting (`Strict`, `Lax`, `None`, default: `Lax`).
* **`maxAge`**: Cookie lifespan in seconds. Default `-1` denotes an in-memory session cookie cleared when the browser closes.

##### 3) Storage Strategy (In-Memory / File / Redis)

* **Pure In-Memory Mode (Omitting `sessionStore`)**:
  * Omit the `sessionStore` property entirely and inject only [`SessionManagerConfig`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/context/config/SessionManagerConfig.java) to operate as a pure in-memory session manager without disk or network I/O.
  * Yields maximum responsiveness with zero persistence overhead, making it ideal for console demos (such as `aspectow-demo-console`), short-lived tokens, and testing.
* **Local Filesystem Persistence (`!prod`)**: Uses `FileSessionStoreFactoryBean` to serialize sessions to local disk (`app/work/_sessions/`), preserving active sessions across server restarts.
* **Production Redis Clustering (`prod`)**: High-availability Redis clustering via `DefaultLettuceSessionStoreFactoryBean`, enabling elastic, stateless microservice scaling with zero-downtime failover.

##### 4) Session Lifecycle Listeners (`SessionListenerRegistrationBean`)

To track session creation/destruction events for audit logging or active user metrics, register listeners via [`SessionListenerRegistrationBean`](https://github.com/aspectran/aspectran/blob/master/with-netty/src/main/java/com/aspectran/netty/support/SessionListenerRegistrationBean.java):

```xml
<bean class="com.aspectran.netty.support.SessionListenerRegistrationBean">
    <property name="targetPath">/</property>
    <property name="sessionListener">
        <bean class="com.aspectran.example.listener.UserSessionTrackingListener"/>
    </property>
</bean>
```

> [!TIP]
> For complete details on `SessionManagerConfig` lifecycle tuning, crawler/bot phantom session mitigation, `@NonPersistent` attributes, and distributed Redis failover, consult the **[`Aspectran Session Manager Guide`](/en/docs/guides/aspectran-session-manager/)**.

### 5.4. Console Management Context (`netty-context-console.xml`)

Just like Undertow, Netty supports multi-context deployment out of the box, mounting an independent Console context under the `/console` path. Depending on your operational topology, the Console context can run in either **Headless Console mode** (omitting UI assets) or **Full Console mode** (with web UI included).

#### 5.4.1. Headless Console Mode (Recommended when separating Console nodes)
When a dedicated centralized console node or an Aspectow Enterprise flagship server provides the administrative web dashboard, Edge service nodes can omit the heavy HTML/JSP UI templates and only activate backend control plane channels (WebSocket sessions, remote CLI execution, and scheduler APIs) for minimal footprint.

`/app/config/server/netty/netty-context-console.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>

    <description>
        Aspectow Edge Headless Console Context Configuration
    </description>

    <!-- Mount Console Core Rules (Headless Mode without UI) -->
    <append resource="com/aspectran/aspectow/console/config/rules/context/netty-context-console-headless.xml"/>

</aspectran>
```

Internally, `netty-context-console-headless.xml` initializes the WebSocket container and backend rules with minimal footprint:

```xml
<bean id="netty.context.console"
      class="com.aspectran.netty.server.NettyContext"
      scope="prototype">
    <property name="contextPath">/console</property>
    <property name="aspectranConfigFile">classpath:com/aspectran/aspectow/console/config/aspectran-config.apon</property>
    <!-- Initialize WebSocket container for real-time remote commands and streaming -->
    <property name="webSocketServerContainerInitializer">
        <bean class="com.aspectran.netty.server.websocket.NettyWebSocketServerContainerInitializer">
            <property name="idleTimeout" valueType="long">60000</property>
        </bean>
    </property>
</bean>
```

#### 5.4.2. Full Console Mode (All-in-One Node Deployment)
Used when every Edge node directly hosts the integrated management web UI without separating a dedicated console node.

`/app/config/server/netty/netty-context-console.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>

    <description>
        Aspectow Edge Full Console Context Configuration
    </description>

    <!-- Mount Console Web UI and Complete Control Plane Rules -->
    <append resource="com/aspectran/aspectow/console/config/rules/context/netty-context-console.xml"/>

</aspectran>
```

* **Single Port Integration**: The main business services (`/`) and the management context (`/console`) are served simultaneously on the same Netty listening port (e.g., 8081), eliminating the need for additional port exposure or separate process management.

### 5.5. Runtime Support Components (`netty-support.xml`)

`netty-support.xml` handles session listener registrations and exposes runtime listening port metadata to the monitoring plane.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>

    <!-- Auto-register Session Event Listeners -->
    <bean id="sessionListenerRegistration"
          class="com.aspectran.netty.support.SessionListenerRegistrationBean" lazyInit="true">
        <argument>netty.server</argument>
        <argument>root</argument>
    </bean>

    <!-- Expose Actual Bound Netty Server Ports to the Control Plane -->
    <bean class="com.aspectran.aspectow.console.cluster.support.NettyServerPortProvider">
        <argument>netty.server</argument>
    </bean>

</aspectran>
```

## 6. Supporting Features and Logging Configuration

Application logging and cluster monitoring configurations are modularly organized within dedicated subdirectories under `/app/config/`.

### 6.1. Logging Configuration (`/config/logging/`)

Aspectow Edge is built upon the Logback framework, employing a modular design where fine-grained XML definitions are aggregated via `<include>` directives.

```
app/config/logging/
├── logback.xml                 # Production Logging Configuration (File-Centric)
├── logback-debug.xml           # Development & Debugging Configuration (Includes Console)
└── included/
    ├── logback-default.xml     # Main Business Application Log (${LOGGING_GROUP}.log)
    ├── logback-accesslog.xml   # Netty HTTP Access Log (${LOGGING_GROUP}-access.log)
    ├── logback-scheduler.xml   # Dedicated Scheduler Task Log (${LOGGING_GROUP}-scheduler.log)
    └── logback-console.xml     # Terminal Standard Output (STDOUT) Appender
```

#### Key Logging Configuration Files

* **`logback.xml`**:
  * Default entry point for production deployments. Omits console appenders and activates file-based rolling loggers (`logback-default.xml`, `logback-scheduler.xml`, `logback-accesslog.xml`) to eliminate console I/O bottlenecks.
* **`logback-debug.xml`**:
  * Entry point for local development and debugging. Includes `logback-console.xml` alongside file appenders to stream ANSI color-highlighted logs to the terminal, elevating package levels to `DEBUG` or `TRACE`.
  * Usage: `app/bin/shell.sh --debug`
* **`included/logback-default.xml`**:
  * Core definition for business logging. Couples [`LoggingGroupDiscriminator`](https://github.com/aspectran/aspectran/blob/master/logging/src/main/java/com/aspectran/logging/LoggingGroupDiscriminator.java) with `SiftingAppender` to route logs into `app/logs/${LOGGING_GROUP}.log` (e.g., `root.log`, `console.log`, `order.log`) based on the logging group resolved by `PathBasedLoggingGroupHandler`.
  * Pre-configured with time-and-size rolling policies (`SizeAndTimeBasedRollingPolicy`, 10MB per file, 30-day retention).
* **`included/logback-accesslog.xml`**:
  * Dedicated collector for Netty HTTP access log events (`com.aspectran.netty.accesslog`), partitioned by logging group into `app/logs/${LOGGING_GROUP}-access.log`.
* **`included/logback-scheduler.xml`**:
  * Isolates Aspectran Scheduler (`com.aspectran.core.scheduler.activity`) execution history into `app/logs/${LOGGING_GROUP}-scheduler.log`, ensuring periodic batch logs do not clutter transaction logs.
* **`included/logback-console.xml`**:
  * Colorized `ConsoleAppender` configuration for terminal readability during development.

### 6.2. Cluster Node Control and Centralized Observability (`/config/console/`)

Aspectow Edge manages node identity and monitoring parameters inside **`/app/config/console/`**, adhering to an identical structure as Undertow (Enterprise).

#### 6.2.1. Node Identification & Heartbeat Communication (`node-config.apon`)

Edge instances report health status and real-time performance metrics to the central Aspectow Enterprise console:

```apon
node: {
    id: edge-node-01
    group: microservices
    heartbeatIntervalSeconds: 5
    cluster: {
        consoleUrl: "https://console.aspectran.com"
        authToken: "enc:PBEWithMD5AndDES:..."
    }
}
```

* **`node-rules.xml`**: Declares control plane components such as `NodeConfigResolver` and `NodeManagerFactoryBean`.
* **`appmon-config.apon`**: Configures JVM heap memory, Netty thread pool metrics, request/session event metrics, and log streaming collectors.

#### 6.2.2. Remote Governance via Aspectow Console

Centralized [Aspectow Console](/en/docs/aspectow/console/) provides unified control over all Edge nodes from a single glass pane:
* **Real-time Health Monitoring**: Inspect live operational states (Live, Paused, Dead) and dispatch immediate Pause, Resume, or Restart signals.
* **Interactive Remote Command Center**: Inject CLI commands directly into remote Edge instances from the web console and stream execution output live.
* **Dynamic Distributed Scheduler Control**: Pause or resume Translet scheduler jobs running inside Edge instances without server restarts.

## 7. Conclusion and Edition Comparison

| Dimension | Aspectow Enterprise | Aspectow Edge |
| :--- | :--- | :--- |
| **Core Engine** | JBoss Undertow + Apache Jasper | Netty 4.x (Native Epoll/KQueue) |
| **Threading Model** | XNIO Worker Thread Pool | Netty EventLoop + Java 21 Virtual Threads |
| **Servlet Specification** | Full Jakarta Servlet & JSP Standard | Non-Servlet (Direct Translet Dispatch) |
| **Console Context** | Full Console Context (Embedded UI & control plane) | Console Context (Freely choose Headless mode for dedicated nodes or Full UI mode for all-in-one nodes) |
| **Architecture Model** | Multi-Context (`tow-context-*.xml`) | Multi-Context (`netty-context-*.xml`) |
| **Ideal Use Cases** | Enterprise portals, public sector, legacy JSP migrations | High-throughput REST APIs, cloud microservices, edge gateways |
