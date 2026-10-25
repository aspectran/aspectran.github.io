---
title: "Deep Dive into the Aspectran Logging Mechanism"
subheadline: Mechanisms
---

Aspectran provides a sophisticated and robust logging architecture designed to maintain isolated log files for various application modules, REST API route prefixes, and background schedulers within a single server JVM process. This document provides an in-depth analysis of Aspectran's logging abstraction foundation, the `LoggingGroupDiscriminator`, and the dynamic path-based logging group routing mechanism integrated across multiple server engines including Netty, Undertow, and Jetty.

## 1. Standard Logging Technology: SLF4J and Logback

Aspectran adopts **SLF4J (Simple Logging Facade for Java)** as its logging abstraction layer and defaults to **Logback** as its primary implementation. This ensures application code remains completely decoupled from any specific logging library while funneling logs from diverse third-party libraries through a single unified logging pipeline.

### 1.1. Integrated Bridge Dependency Architecture (`aspectran-logging`)
The `aspectran-logging` module bundles Logback core libraries alongside essential SLF4J bridge adapters for legacy logging frameworks:

```xml
<dependencies>
    <dependency>
        <groupId>${project.groupId}</groupId>
        <artifactId>aspectran-core</artifactId>
        <version>${project.version}</version>
    </dependency>
    <dependency>
        <groupId>ch.qos.logback</groupId>
        <artifactId>logback-classic</artifactId>
        <version>${logback.version}</version>
    </dependency>
    <!-- Bridge libraries routing third-party logging into SLF4J -->
    <dependency>
        <groupId>org.slf4j</groupId>
        <artifactId>jcl-over-slf4j</artifactId>
        <version>${slf4j.version}</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>org.slf4j</groupId>
        <artifactId>jul-to-slf4j</artifactId>
        <version>${slf4j.version}</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>org.slf4j</groupId>
        <artifactId>log4j-over-slf4j</artifactId>
        <version>${slf4j.version}</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>org.apache.logging.log4j</groupId>
        <artifactId>log4j-to-slf4j</artifactId>
        <version>${log4j-to-slf4j.version}</version>
        <scope>runtime</scope>
    </dependency>
</dependencies>
```

Thanks to this configuration, log statements originating from third-party libraries using Spring, Apache Commons Logging, Java Util Logging (JUL), or Log4j 1/2 are consistently governed by Aspectran's centralized logging policies.

## 2. Core Discrimination Engine: `LoggingGroupDiscriminator`

The core innovation of Aspectran's logging system is the `com.aspectran.logging.LoggingGroupDiscriminator` class. Implementing Logback's `Discriminator` interface, this class dynamically determines which logical **Logging Group** a log event belongs to at the exact millisecond the event occurs.

### 2.1. Three-Tier Group Name Decision Precedence
When a log event arrives, `LoggingGroupDiscriminator` determines the logging group key using the following 3-tier hierarchy:

1.  **SLF4J MDC (Mapped Diagnostic Context) - Highest Priority**:
    *   Inspects the `LOGGING_GROUP` key from the MDC of the thread processing the current request.
    *   Because MDC is thread-local storage, it is used to dynamically route logging groups per web request or background task execution.
2.  **`ActivityContext` Name**:
    *   If no `LOGGING_GROUP` key is found in the MDC, it queries the unique name of the active `ActivityContext` bound to the current thread.
    *   This is particularly useful when multiple independent Aspectran application contexts run side-by-side within a single JVM process.
3.  **Logback Configuration Default (`defaultValue`)**:
    *   If neither of the above yields a group name, the default value specified in `logback.xml` (typically `root` or `aspectran`) is used as the fallback group name.

### 2.2. Context Helper: `LoggingGroupHelper`
To safely manipulate logging groups programmatically, the framework provides the `com.aspectran.utils.logging.LoggingGroupHelper` utility:

```java
// Enter logging group
LoggingGroupHelper.set("petclinic");

try {
    // All logs emitted within this block are isolated into petclinic.log
    doBusinessLogic();
} finally {
    // Safely clear MDC context upon completion
    LoggingGroupHelper.clear();
}
```

## 3. Dynamic Log Sifting via Logback `SiftingAppender`

`LoggingGroupDiscriminator` achieves its full power when paired with Logback's `SiftingAppender`. The `SiftingAppender` creates separate subordinate appenders on-the-fly based on the key returned by the discriminator and routes log events accordingly.

### 3.1. Standard `logback-default.xml` Configuration

```xml
<?xml version="1.0" encoding="UTF-8"?>
<included>

    <appender name="SIFT" class="ch.qos.logback.classic.sift.SiftingAppender">
        <!-- 1. Extract logging group key via LoggingGroupDiscriminator -->
        <discriminator class="com.aspectran.logging.LoggingGroupDiscriminator">
            <key>LOGGING_GROUP</key>
            <defaultValue>root</defaultValue>
        </discriminator>
        <sift>
            <!-- 2. Dynamically create a RollingFileAppender based on the resolved group (${LOGGING_GROUP}) -->
            <appender name="FILE-${LOGGING_GROUP}" class="ch.qos.logback.core.rolling.RollingFileAppender">
                <!-- 3. Dynamic group-isolated log file path -->
                <file>${aspectran.logsDir:-${aspectran.basePath:-app}/logs}/${LOGGING_GROUP}.log</file>
                <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
                    <fileNamePattern>${aspectran.archivedLogsDir:-${aspectran.logsDir:-${aspectran.basePath:-app}/logs}/archived}/${LOGGING_GROUP}.%d{yyyy-MM-dd}.%i.log</fileNamePattern>
                    <maxFileSize>10MB</maxFileSize>
                    <maxHistory>30</maxHistory>
                    <totalSizeCap>1GB</totalSizeCap>
                </rollingPolicy>
                <encoder class="ch.qos.logback.classic.encoder.PatternLayoutEncoder">
                    <charset>${aspectran.logCharset:-UTF-8}</charset>
                    <pattern>%-5level %d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %msg - %logger{30}.%M\(%line\)%n</pattern>
                </encoder>
            </appender>
        </sift>
    </appender>

    <root level="info">
        <appender-ref ref="SIFT"/>
    </root>

    <logger name="com.aspectran" level="debug"/>
    <logger name="org.quartz" level="info"/>

</included>
```

When a new logging group (e.g., `petclinic`, `jpetstore`) is first encountered at runtime, separate rolling files (`logs/petclinic.log`, `logs/jpetstore.log`) are generated dynamically without requiring prior static XML declarations, each with independent rotation policies.

## 4. Flexible Path and Charset Resolution Strategy

Production deployments often require log files to be stored outside the application root directory (`basePath`) or mounted to high-speed NVMe storage volumes. Aspectran supports nested fallback property expansion in Logback configurations:

*   **System Properties**:
    *   `aspectran.logsDir`: Directory where active log files are written.
    *   `aspectran.archivedLogsDir`: Directory where rolled and compressed archived logs are stored.
    *   `aspectran.logCharset`: Character encoding charset for log output (defaults to `UTF-8`).
*   **Nested Fallback Expression**:
    `${aspectran.logsDir:-${aspectran.basePath:-app}/logs}`
    1.  If the system property `aspectran.logsDir` is explicitly defined, its absolute/relative path takes highest precedence.
    2.  If unset, it resolves to `${aspectran.basePath}/logs`.
    3.  If `aspectran.basePath` is also unset, it safely falls back to `app/logs`.

## 5. Path-Based Logging Group Integration Across Server Engines

When hosting multiple microservice modules or API endpoint clusters (e.g., `/petclinic/**`, `/jpetstore/**`) inside a single server instance, Aspectran provides dedicated path-based handlers that inspect incoming HTTP request URI paths and physically isolate logs.

Aspectran provides dedicated `PathBasedLoggingGroupHandler` implementations across all three major web/network server engines (Netty, Undertow, Jetty) supporting identical wildcard pattern syntax (`+:`, `-:`).

### 5.1. Netty Environment: `com.aspectran.netty.server.handler.logging.PathBasedLoggingGroupHandler`
Intercepts inbound HTTP requests in Netty's channel pipeline to bind logging groups:

*   **Configuration Example (`netty-server.xml` / `netty-config.apon`)**:

```xml
<bean id="netty.server.handler.loggingGroupHandler"
      class="com.aspectran.netty.server.handler.logging.PathBasedLoggingGroupHandler"
      scope="prototype">
    <properties>
        <item name="pathPatternsByGroupName" type="map">
            <entry name="petclinic">
                +: /petclinic/**
            </entry>
            <entry name="jpetstore">
                +: /jpetstore/**
            </entry>
            <entry name="api">
                +: /api/**
                -: /api/health-check
            </entry>
        </item>
    </properties>
</bean>
```

*   **How it Works**: Extending Netty's `ChannelInboundHandlerAdapter`, when an HTTP request arrives, the handler parses the URI path, matches it against declared patterns, extracts the target group name (e.g., `petclinic`), binds it to the channel attributes and MDC, and passes execution down the pipeline. When channel processing concludes, the context is safely released.

### 5.2. Jetty Environment: `com.aspectran.jetty.server.handler.PathBasedLoggingGroupHandler`
Wraps the handler chain in embedded Jetty servlet environments:

*   **Class Structure**: Extends Jetty's `Handler.Wrapper`.
*   **How it Works**:
    1.  When a client request reaches Jetty, `handle(Request, Response, Callback)` intercepts it.
    2.  Compares the request path against wildcard patterns defined in `pathPatternsByGroupName`.
    3.  Sets the logging group into the MDC via `LoggingGroupHelper.set(loggingGroup)` and delegates to downstream servlet handlers.
    4.  When processing completes and the `Callback` fires, it clears the MDC via `LoggingGroupHelper.clear()`.

### 5.3. Undertow Environment: `PathBasedLoggingGroupHandlerWrapper` and `PathBasedLoggingGroupHandler`
Seamlessly integrates with Undertow's native handler chain (`com.aspectran.undertow.server.handler.logging` package):

*   **Configuration Example (`tow-server.xml`)**:

```xml
<bean id="tow.server.handler.loggingGroupHandlerWrapper"
      class="com.aspectran.undertow.server.handler.logging.PathBasedLoggingGroupHandlerWrapper"
      scope="prototype">
    <properties>
        <item name="pathPatternsByGroupName" type="map">
            <entry name="jpetstore">
                +: /jpetstore/**
            </entry>
            <entry name="petclinic">
                +: /petclinic/**
            </entry>
        </item>
    </properties>
</bean>
```

*   **How it Works**: Extracts `RequestPath` from Undertow's `HttpServerExchange`, resolves matching group names, and registers an `ExchangeCompletionListener` to automatically clear the MDC when the exchange lifecycle ends.

## 6. Logging Group Integration in Scheduler and Daemon Runtimes

Log isolation is supported equally for background scheduler tasks and daemon processes:

*   **Scheduled Tasks (`SchedulerService`)**:
    *   When [`ActivityLauncherJob`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/scheduler/activity/ActivityLauncherJob.java) is triggered by Quartz, it queries `SchedulerService.getLoggingGroup()` and injects it via `LoggingGroupHelper.set()`.
    *   This ensures scheduled batch logs never contaminate web request logs and are cleanly segregated into dedicated files (e.g., `scheduler.log`).
*   **Daemon Processes (`DaemonService`)**:
    *   The unique logging group configured for the daemon isolates overall process lifecycle logs and individual command executions.

## 7. Conclusion and Architectural Significance

Aspectran's logging architecture transcends simple SLF4J/Logback usage to deliver an **intelligent multi-engine log segregation system** essential for modern multi-tenant and microservice operations.

*   By coupling `LoggingGroupDiscriminator` with Logback's `SiftingAppender`, developers can dynamically partition logs through declarative configuration alone without code modifications.
*   By providing consistent path-based logging group handlers across **Netty, Jetty, and Undertow**, Aspectran ensures uniform log partitioning strategies and monitoring observability regardless of the underlying runtime engine.
