---
title: Servlet-based Web Application Configuration
subheadline: User Guides
---

{% capture info_message %}
This guide explains how to build a web application by registering Aspectran as a servlet in a traditional servlet container environment.
{% endcapture %}
{% include alert.liquid info=info_message %}

## 1. Servlet Container Compatibility

Starting with Aspectran 9.0, Java 21 or higher is required for compilation, but it is based on the Jakarta EE 10 specification. Therefore, it reliably supports the following servlet specifications.

| Servlet Spec | JSP Spec |
|:------------:|:--------:|
| 6.0          | 3.1      |

## 2. web.xml Configuration

You register the servlet and listener for running Aspectran in the `web.xml` deployment descriptor.
The simplest and most modern configuration is as follows.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="https://jakarta.ee/xml/ns/jakartaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="https://jakarta.ee/xml/ns/jakartaee https://jakarta.ee/xml/ns/jakartaee/web-app_6_0.xsd"
         version="6.0">

    <display-name>my-web-app</display-name>

    <!-- (1) Specify the Aspectran configuration file path -->
    <context-param>
        <param-name>aspectran:config</param-name>
        <param-value>classpath:config/aspectran-config.apon</param-value>
    </context-param>

    <!-- (2) Listener to start and stop the Aspectran service -->
    <listener>
        <listener-class>com.aspectran.web.servlet.listener.WebServiceListener</listener-class>
    </listener>

    <!-- (3) Aspectran's main servlet to handle all web requests -->
    <servlet>
        <servlet-name>web-activity-servlet</servlet-name>
        <servlet-class>com.aspectran.web.servlet.WebActivityServlet</servlet-class>
        <load-on-startup>1</load-on-startup>
    </servlet>
    <servlet-mapping>
        <servlet-name>web-activity-servlet</servlet-name>
        <url-pattern>/</url-pattern>
    </servlet-mapping>

</web-app>
```

### 2.1. `WebServiceListener`

When the servlet container starts, the `WebServiceListener` reads the configuration information specified in the `aspectran:config` parameter to initialize the Aspectran service. When the web application stops, it safely shuts down the Aspectran service.

### 2.2. `WebActivityServlet`

`WebActivityServlet` is the core servlet of Aspectran that receives and processes all client requests. If you set the `url-pattern` to `/`, all requests, including those for static resources, will be processed through this servlet.

## 3. Aspectran Configuration

The `aspectran:config` initialization parameter defined in the `context-param` of `web.xml` sets the detailed behavior of Aspectran.

### 3.1. Configuration File Path

The `param-value` specifies the path to the Aspectran configuration file. The path can start with the following prefixes:

- `classpath:`: A resource path on the classpath (usually inside `src/main/resources`)
- `file:`: An absolute or relative path in the file system

```xml
<context-param>
    <param-name>aspectran:config</param-name>
    <!-- Case for using a configuration file on the classpath -->
    <param-value>classpath:config/aspectran-config.apon</param-value>
</context-param>
```

```xml
<context-param>
    <param-name>aspectran:config</param-name>
    <!-- Case for using a file in the web application directory -->
    <param-value>file:/WEB-INF/config/aspectran-config.apon</param-value>
</context-param>
```

The content of the configuration file is written in APON (Aspectran Parameters Object Notation) format.

> **APON (Aspectran Parameters Object Notation)**
> A notation similar to JSON, developed for Aspectran to make it easy to write and read configuration values.

### 3.2. Main Configuration Parameters

The following are the main parameters that can be set in the `aspectran-config.apon` file.

```apon
context: {
    rules: classpath:config/app-rules.xml
    scan: [
        com.example.app
    ]
    autoReload: {
        reloadMode: hard
        scanIntervalSeconds: 5
        enabled: true
    }
}
scheduler: {
    enabled: false
}
web: {
    acceptable: {
        +: /**
        -: /assets/**
        -: /favicon.ico
    }
}
```

#### `context` Parameters

Configures the core execution environment of Aspectran.

| Parameter                      | Description                                                                 | Default |
|--------------------------------|-----------------------------------------------------------------------------|---------|
| `rules`                        | The path to the rule file (XML) that defines the transaction flow.          |         |
| `encoding`                     | The encoding of the rule file.                                              | `utf-8` |
| `scan`                         | The package to scan for beans with `@Component` annotations.                |         |
| `autoReload.enabled`           | Whether to reload settings and classes without restarting the application.  | `false` |
| `autoReload.reloadMode`        | `soft`: reloads settings only, `hard`: reloads settings and classes.        | `soft`  |
| `autoReload.scanIntervalSeconds` | The scan interval in seconds for detecting changes.                         | `10`    |

#### `scheduler` Parameters

Configures the behavior of the built-in scheduler.

| Parameter              | Description                                                              | Default |
|------------------------|--------------------------------------------------------------------------|---------|
| `enabled`              | Whether to enable the scheduler service.                                 | `false` |
| `startDelaySeconds`    | The time to wait after the service starts before the scheduler begins tasks. | `5`     |
| `waitOnShutdown`       | Whether to wait for all running jobs to complete on shutdown.            | `false` |

#### `web` Parameters

Configures behavior related to the web environment.

| Parameter            | Description                                                                                             | Default        |
|----------------------|---------------------------------------------------------------------------------------------------------|----------------|
| `uriDecoding`        | The encoding for the request URI.                                                                       | `utf-8`        |
| `acceptable`         | Specifies the request URI patterns to be handled by `WebActivityServlet`. `+` includes, `-` excludes. |                |
| `defaultServletName` | The name of the default servlet to which unhandled requests are passed (e.g., `default`).             | (auto-detected)|

`web.acceptable` is the most important and efficient way to determine which requests `WebActivityServlet` handles and which it ignores. For example, the snippet above processes all requests (`/**`) but excludes paths starting with `/assets/` and `/favicon.ico`, passing them to the default servlet (which usually handles static resources).

## 4. Legacy Configuration: Using `WebActivityFilter`

In the past, `WebActivityFilter` was used to exclude certain requests before they reached `WebActivityServlet`. While using the `web.acceptable` setting is now simpler and recommended, you can still learn this method for compatibility with existing projects.

```xml
<filter>
    <filter-name>web-activity-filter</filter-name>
    <filter-class>com.aspectran.web.servlet.filter.WebActivityFilter</filter-class>
    <init-param>
        <param-name>bypasses</param-name>
        <param-value>
            /assets/**
            /css/**
            /images/**
        </param-value>
    </init-param>
</filter>
<filter-mapping>
    <filter-name>web-activity-filter</filter-name>
    <url-pattern>/</url-pattern>
    <servlet-name>web-activity-servlet</servlet-name>
</filter-mapping>
```

This filter passes requests for the paths specified in the `bypasses` parameter to the next filter in the chain without forwarding them to `WebActivityServlet`.
