---
title: In-Depth Analysis of the Aspectran Logging Mechanism
subheadline: Architecture
---

Aspectran uses a systematic approach to build a flexible and powerful logging system. This document analyzes and explains Aspectran's logging mechanism with examples.

## 1. Adoption of Standard Logging Technologies: SLF4J and Logback

Aspectran uses **SLF4J (Simple Logging Facade for Java)** as its logging abstraction library and adopts **Logback** as its default implementation. This ensures flexibility by preventing application code from directly depending on a specific logging implementation and consistently manages logs from various libraries such as `java.util.logging`, `log4j`, and `commons-logging`.

### Dependency Configuration (`aspectran-logging/pom.xml`)

The `aspectran-logging` module includes dependencies for Logback and various SLF4J bridges, allowing logs from other logging frameworks to be controlled through SLF4J.

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
    <!-- Bridges to forward logs from other logging frameworks to SLF4J -->
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

## 2. Core Feature: `LoggingGroupDiscriminator`

The most core feature of Aspectran logging is a custom Logback `Discriminator` called `com.aspectran.logging.logback.LoggingGroupDiscriminator`. This class determines which logical "group" a log event belongs to when it occurs, thereby dynamically separating logs.

The group name is determined according to the following priority:

1.  **SLF4J MDC**: The value stored with the key `LOGGING_GROUP` in the current thread's MDC (Mapped Diagnostic Context) is used with the highest priority. MDC is a thread-local storage used to hold information that is valid only within a specific context, such as request processing.
2.  **ActivityContext Name**: If the `LOGGING_GROUP` key is not present in the MDC, the name of the currently running Aspectran `ActivityContext` is used as the group name. This is useful for separating the logs of each instance when multiple Aspectran instances are running in a single JVM.
3.  **Default Value**: If a value cannot be found by the two methods above, the default value specified in the Logback configuration file is used.

## 3. Logback Configuration and How It Works

`LoggingGroupDiscriminator` demonstrates its power when used with Logback's `SiftingAppender`. `SiftingAppender` is responsible for dynamically creating child Appenders based on the value returned by the `discriminator` and forwarding log events to the corresponding Appender.

Here is a configuration example from `logback-default.xml`.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<included>

    <appender name="SIFT" class="ch.qos.logback.classic.sift.SiftingAppender">
        <!-- 1. Identify the logging group using LoggingGroupDiscriminator -->
        <discriminator class="com.aspectran.logging.LoggingGroupDiscriminator">
            <key>LOGGING_GROUP</key>
            <defaultValue>root</defaultValue>
        </discriminator>
        <sift>
            <!-- 2. Dynamically create an Appender based on the identified group name (${LOGGING_GROUP}) -->
            <appender name="FILE-${LOGGING_GROUP}" class="ch.qos.logback.core.rolling.RollingFileAppender">
                <!-- 3. The log file path is dynamically determined by the group name -->
                <file>${aspectran.basePath:-app}/logs/${LOGGING_GROUP}.log</file>
                <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
                    <fileNamePattern>${aspectran.basePath:-app}/logs/archived/${LOGGING_GROUP}.%d{yyyy-MM-dd}.%i.log</fileNamePattern>
                    <maxFileSize>10MB</maxFileSize>
                    <maxHistory>30</maxHistory>
                    <totalSizeCap>1GB</totalSizeCap>
                </rollingPolicy>
                <encoder class="ch.qos.logback.classic.encoder.PatternLayoutEncoder">
                    <charset>UTF-8</charset>
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
    <logger name="org.apache.ibatis" level="error"/>

</included>
```

## 4. Web Application Integration Example

This logging mechanism is particularly powerful when serving multiple web applications from a single server instance. `com.aspectran.undertow.server.handler.logging.PathBasedLoggingGroupHandlerWrapper` is an Undertow handler that dynamically sets the logging group based on the request URI.

### `tow-server.xml` Configuration Example

```xml
<bean id="tow.server.handler.loggingGroupHandlerWrapper"
      class="com.aspectran.undertow.server.handler.logging.PathBasedLoggingGroupHandlerWrapper"
      scope="prototype">
    <properties>
        <item name="pathPatternsByGroupName" type="map">
            <entry name="jpetstore">
                +: /jpetstore
                +: /jpetstore/**
            </entry>
            <entry name="petclinic">
                +: /petclinic
                +: /petclinic/**
            </entry>
            <entry name="demo">
                +: /demo
                +: /demo/**
                -: /demo/examples/gs-rest-service/**
            </entry>
        </item>
    </properties>
</bean>
```

### Operational Flow

1.  An HTTP request (e.g., `/jpetstore/shop.do`) comes in.
2.  `PathBasedLoggingGroupHandlerWrapper` intercepts the request and compares the URI (`/jpetstore/shop.do`) with the configured patterns (`/jpetstore/**`).
3.  It finds the matching group name `jpetstore` and stores the value in SLF4J's MDC via `MDC.put("LOGGING_GROUP", "jpetstore")`.
4.  Subsequently, all log events that occur in the thread processing that request are identified as belonging to the `jpetstore` group by `LoggingGroupDiscriminator`.
5.  `SiftingAppender` dynamically creates a `RollingFileAppender` named `FILE-jpetstore` (if it doesn't already exist) based on the value `jpetstore` and sends the log event to this Appender.
6.  As a result, all logs for requests coming in to `/jpetstore` are recorded in the `logs/jpetstore.log` file.

## 5. Conclusion

Aspectran's logging mechanism implements a very flexible and extensible system by combining its own unique ideas, `LoggingGroupDiscriminator` and `PathBasedLoggingGroupHandlerWrapper`, with standard technologies like SLF4J and Logback. This provides developers with a powerful feature to perfectly separate and manage logs by service or function unit, even in complex multi-tenant or microservice environments.
