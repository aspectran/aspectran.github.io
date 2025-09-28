---
format: plate solid article
title: Why Aspectow
teaser: '"The Most Practical Enterprise WAS for Microservices Architecture (MSA)"'
header:
  image_fullwidth: header_aspectow.png
  caption: Aspectow
inside_heading: true
sidebar: toc
permalink: /en/why-aspectow/
---

## Are You Facing These Challenges?

*   Do you feel that **traditional WAS (like JBoss)** is too heavy and complex for an MSA environment?
*   Do you experience the hassle of "Assembly Hell" with **lightweight containers (like Tomcat)**, where you have to manually combine DI, DB integration, and more?
*   Is it difficult to understand or control the internal workings of **modern platforms (like Spring Boot)** because of excessive auto-configuration (Magic), despite their convenience?

## That's Why Aspectow Was Born.

**Aspectow** is an **enterprise WAS product** based on the powerful open-source project `Aspectran`, optimized and stabilized for specific purposes. (Think of the relationship between `JBoss EAP` and `WildFly`.)

Aspectow complements the shortcomings of existing solutions, focusing particularly on solving the problems developers face in an MSA environment.

## Why Should You Develop with Aspectran?

The true value of Aspectow begins with its foundation, the `Aspectran` framework. Aspectran offers developers the following clear advantages.

### 1. A Controllable and Explicit Structure

You don't need to waste time tracing hidden behaviors behind Spring Boot's complex auto-configuration (Magic). In Aspectran, all configurations and flows are explicitly defined, allowing anyone to easily understand and control the application's behavior. **This directly leads to ease of maintenance.**

### 2. An All-in-One Framework with Integrated Core Features

Core features that form the backbone of an application, such as DI, AOP, and MVC flow control, are built into the framework. Developers can escape "Assembly Hell"—the struggle of matching library versions—and focus solely on developing business logic in a stable and consistent environment.

### 3. Intuitive Rule-Based Development

In Aspectran, all requests are processed in simple, clear rule units called `Translets`. You can freely generate not only simple text responses but also dynamic content using templates, as shown below.

```xml
<translet name="hello">
    <transform format="text">
        <template style="apon">
            |Hello, World!
        </template>
    </transform>
</translet>
```

This intuitive structure helps developers quickly adapt and increase productivity without needing a deep understanding of the framework.

---

**Aspectow is the server built to run these powerful and easy-to-maintain applications, created with Aspectran, at peak performance and stability.**

## Aspectow Editions

Aspectow offers the following editions based on the intended use:

*   **Aspectow Enterprise Edition**
    > Fully supports the Servlet specification and is suitable for building enterprise web applications. It includes JBoss's [Undertow](https://undertow.io) web server and [Apache Jasper](https://mvnrepository.com/artifact/org.mortbay.jasper/apache-jsp), the JSP engine used by Apache Tomcat.

*   **Aspectow Light Edition**
    > A lightweight version with the Servlet specification removed, suitable for building high-performance REST API services. It includes JBoss's [Undertow](https://undertow.io) web server.

*   **Aspectow Jetty Edition**
    > A version with the Jetty web server built-in, capable of running Servlet-based web applications.

## Aspectow's Differentiated Core Competencies

Aspectow provides five practical and powerful core competencies that differentiate it from other WAS.

### 1. Native High-Performance Redis Session Store

Through the `aspectran-rss-lettuce` module, session data is managed directly using `Lettuce`, a high-performance Redis client. This is significantly faster and more efficient than traditional methods that go through generic JDBC and is a key technology for accelerating the horizontal scaling of stateful services in an MSA environment.

### 2. Purpose-Driven Modular Editions

Aspectow abandons the heavy, 'one-size-fits-all' approach.
*   **Enterprise Edition:** Fully supports Servlets and JSP, making it suitable for traditional web applications.
*   **Light Edition:** Lightweight by excluding Servlet features, optimized for building high-performance REST API servers.
*   **Jetty Edition:** Uses the Jetty web server instead of Undertow, providing a flexible option for specific environments.

This modularity helps users achieve maximum efficiency with minimal resources tailored to their specific needs.

### 3. Proven Enterprise Stack and Stability

The term 'Battle-Tested' is not just a slogan. The `aspectow-demo` project features a practical enterprise stack composed of industry-leading libraries like `HikariCP` (high-performance DB connection pool) and `Querydsl` (type-safe queries). Because we have verified its stability by running complex applications on this stack, users can start developing on a reliable foundation without complex tuning.

### 4. Built-in Real-Time Application Monitoring

It provides a built-in monitoring solution called `Aspectow AppMon` by default. You can observe application logs and events in real-time without the complex process of installing and configuring separate monitoring tools. This goes beyond development convenience and is a powerful enterprise feature that significantly enhances operational stability and rapid problem-solving capabilities.

### 5. Flexible XML-Based Server Customization

Through configuration files like `app/config/server/server.xml`, you can finely control internal operations such as the server lifecycle and web server handler chain. This enables far more powerful and systematic server-level customization than Spring Boot's `application.properties` approach, allowing for flexible responses to the requirements of complex enterprise environments.

## Project Templates and Samples

Instead of providing an installable package like Apache Tomcat, Aspectow offers **starter projects** to kickstart new development and **sample projects** that demonstrate how to use specific technologies, all available via GitHub. You can develop your applications based on these projects.

### Starter Projects

These projects provide only the basic environment and are intended to be used as a skeleton for starting a new project.

*   **Aspectow**: The default starter for the Aspectow Enterprise Edition.
*   **Aspectow Light**: The default starter for the Aspectow Light Edition.
*   **Aspectow Jetty**: The default starter for the Aspectow Jetty Edition.

### Sample Projects

These are complete, runnable projects that demonstrate how to use specific features or libraries.

*   **ToDo Webapp**: A simple ToDo example application based on the Aspectow Enterprise Edition.
*   **JPetStore Webapp**: A database integration example application using MyBatis.
*   **Petclinic Webapp**: A web application example using JPA and Thymeleaf.
