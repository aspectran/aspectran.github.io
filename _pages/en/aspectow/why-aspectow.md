---
format: plate solid article
title: Why Aspectow
teaser: '"The Most Practical Enterprise WAS & Control Platform for Microservices Architecture (MSA) and Cluster Environments"'
header:
  image_fullwidth: header_aspectow.png
  caption: Aspectow
inside_heading: true
sidebar: toc
permalink: /en/why-aspectow/
---

## Are You Facing These Challenges?

*   Do you feel that **traditional WAS (like JBoss)** is too heavy and complex for modern cluster and MSA environments?
*   Do you experience the hassle of "Assembly Hell" with **lightweight containers (like Tomcat)**, where you have to manually combine DI, DB integration, scheduling, and monitoring?
*   Is it difficult to understand or control the internal workings of **modern platforms (like Spring Boot)** because of excessive auto-configuration (Magic), despite their convenience?
*   Do you want to manage node survival monitoring, remote command execution, scheduler control, and real-time traffic monitoring in a **distributed cluster environment** through a single unified web console without installing complex external APM tools?

## That's Why Aspectow Was Born.

**Aspectow** is an **enterprise WAS and control platform** based on the powerful open-source framework `Aspectran`, optimized and stabilized for modern enterprise environments.

Unlike traditional WAS (such as WebSphere or WebLogic) that required deploying and running a separate, dedicated administration server (DMGR/Admin Server), **Aspectow embeds the visual web management console (Aspectow Console) directly into every node (Self-Contained Architecture)** alongside its high-performance WAS engine.

Following modern distributed architecture principles, this eliminates the need for separate external management infrastructure and provides high availability, allowing administrators to seamlessly monitor and control the entire cluster through any active node.

## Why Should You Develop with Aspectran?

The true value of Aspectow begins with its foundation, the `Aspectran` framework. Aspectran offers developers the following clear advantages:

### 1. A Controllable and Explicit Structure

You don't need to waste time tracing hidden behaviors behind Spring Boot's complex auto-configuration (Magic). In Aspectran, all configurations and execution flows are explicitly defined, allowing anyone to easily understand and control the application's behavior. This directly leads to exceptional maintainability.

### 2. An All-in-One Framework with Integrated Core Features

Core features that form the backbone of an application, such as DI, AOP, and MVC flow control, are built into the framework. Developers can escape "Assembly Hell"—the struggle of matching library versions—and focus solely on developing business logic in a stable and consistent environment.

### 3. Intuitive Rule-Based Development

In Aspectran, all requests are processed in simple, clear rule units called `Translets`. You can freely generate not only simple text responses but also dynamic content using templates:

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

Aspectow is the platform built to run these powerful and easy-to-maintain applications with peak performance, stability, and comprehensive visual control.

## Aspectow Editions

Aspectow offers modular editions tailored to specific usage purposes and deployment environments:

*   **Aspectow Enterprise Edition**
    > Fully supports the Servlet specification and is suitable for building enterprise web applications. It **includes the visual management platform, Aspectow Console, by default**, alongside JBoss's [Undertow](https://undertow.io) web server and [Apache Jasper](https://mvnrepository.com/artifact/org.mortbay.jasper/apache-jsp), the JSP engine used by Apache Tomcat.

*   **Aspectow Light Edition**
    > A lightweight, non-servlet version optimized for building high-performance REST API services with a minimal memory footprint. It includes JBoss's [Undertow](https://undertow.io) web server.

*   **Aspectow Jetty Edition**
    > A version with the Jetty web server built-in, providing flexibility for specific infrastructure requirements while running Servlet-based web applications.

## Aspectow's Differentiated Core Competencies

Aspectow provides practical and powerful core competencies that differentiate it from traditional WAS and platforms:

### 1. Unified Management Web Console (Aspectow Console)

Beyond server execution, Aspectow includes **Aspectow Console**, a unified web interface to visually control the entire cluster and applications:
*   **Cluster Node Management**: Real-time monitoring of node statuses (Live, Paused, Dead) and bulk action controls (Pause, Resume, Restart).
*   **Interactive Remote Command Center**: Dispatch interactive CLI/Shell commands to specific nodes or all nodes in real time with live console streaming.
*   **Distributed Scheduler Manager**: Offers a Dashboard view for cluster-wide schedule overview and a Detail View for node-specific job dynamic control (Pause, Resume, Details).
*   **Security & Vault Management**: Securely manages PBE (Password-Based Encryption) security tokens and system encryption configurations.
*   **Runtime Diagnostic Tools**: Built-in developer utilities including Wildcard Pattern Tester, AsEL Expression Evaluator, and APON Data Converter.

### 2. High-Performance Cluster Architecture & Node Manager (Node Manager Control Plane)

Aspectow embeds **`Aspectow Node Manager`**, a core Control Plane library that binds multiple distributed nodes into an organic, cohesive cluster. Developers can flexibly select between **Gateway Mode** and **Direct Mode** based on infrastructure environments and scaling plans.

*   **Gateway Mode (Cloud-Native & Autoscaling Optimized)**:
    *   **Dynamic Clustering**: Utilizes Redis as a central message broker and metadata repository. Nodes autonomously generate UUID-based unique identifiers upon startup and register dynamically, perfectly adapting to **Kubernetes (K8s) and AWS Auto Scaling** environments where instances are frequently added or removed.
    *   **Infrastructure Flexibility & Private Network Traversal**: Operates seamlessly across L4/L7 load balancers. Nodes hidden behind firewalls or private IPs (NAT) can be securely controlled without opening external ports.
    *   **Automatic Cleanup (GC)**: Automatically purges stale metadata (Group - Node - App) via Pulse survival signal monitoring when nodes detach.
*   **Direct Mode (Static & Fixed Infrastructure)**:
    *   A static operation mode performing direct P2P communication between nodes without Redis.
    *   Optimized for small-scale private networks or L7 Nginx path-based routing environments with fixed node counts and IPs.

With just a single-line configuration change (`mode: gateway`) inside `node-config.apon`, you can seamlessly evolve your cluster architecture as your infrastructure grows.

### 3. Native High-Performance Redis Session Store

Through the `aspectran-rss-lettuce` module, session data is managed directly using `Lettuce`, a high-performance Redis client. This is significantly faster and more efficient than traditional JDBC-based methods, accelerating the horizontal scaling of stateful services in MSA and cluster environments.

### 4. Built-in Real-Time AppMon Monitoring (Group - Node - App)

Includes the `Aspectow AppMon` monitoring engine by default. Without complex external APM setups, observe Canvas-based traffic flow, JVM heap/thread metrics, active session tracking, and real-time/historical reverse log tailing via a 3-tier navigation (Group - Node - App).

### 5. Battle-Tested Enterprise Stack and Samples

Through the `aspectow-demo` project, Aspectow provides a practical enterprise stack combining battle-tested libraries such as `HikariCP` (high-performance DB connection pool), `Querydsl` (type-safe queries), `JPetStore`, and `PetClinic`, allowing users to start development on a proven foundation.

## Project Templates and Samples

Aspectow offers starter projects to kickstart new development and sample/demo projects that demonstrate how to use specific technologies, all available via GitHub. You can develop your applications based on these projects.

### Starter Projects

These projects provide only the basic environment and are intended to be used as a skeleton for starting a new project.

*   [Aspectow Enterprise](https://github.com/aspectran/aspectow-enterprise): The default starter for the Aspectow Enterprise Edition.
*   [Aspectow Light](https://github.com/aspectran/aspectow-light): The default starter for the Aspectow Light Edition.
*   [Aspectow Jetty](https://github.com/aspectran/aspectow-jetty): The default starter for the Aspectow Jetty Edition.

### Demo and Sample Projects

These are complete, runnable projects that demonstrate how to use specific features or libraries.

*   [Aspectow Demo Site](https://github.com/aspectran/aspectow-demo): A comprehensive demo site showcasing JPetStore, PetClinic, Examples, and AppMon running together on the Aspectow WAS.
*   [ToDo Webapp](https://github.com/aspectran/aspectow-todo-webapp): A simple ToDo example application based on the Aspectow Enterprise Edition.
*   [JPetStore Webapp](https://github.com/aspectran/aspectran-jpetstore): A database integration example application using MyBatis.
*   [Petclinic Webapp](https://github.com/aspectran/aspectran-petclinic): A web application example using JPA and Thymeleaf.
