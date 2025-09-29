---
format: plate solid article
title: Aspectow Architecture
teaser: This document explains the architecture and key components of Aspectow to provide an in-depth understanding for developing and operating Aspectow-based applications.
sidebar: toc
---

## 1. Relationship with the Aspectran Engine

Aspectow is an enterprise WAS (Web Application Server) 'product' built on the powerful open-source framework, **Aspectran**. Aspectran is an all-in-one framework that provides Dependency Injection (DI), Aspect-Oriented Programming (AOP), and a request handling flow similar to MVC.

Aspectow leverages these core concepts of Aspectran (such as Translet, Activity, Bean, Aspect) to process the application's business logic, adding value on top as a WAS in terms of stability, performance, and management convenience. In other words, if Aspectran is the 'brain' of the application, Aspectow is the 'body' and 'environment' that helps the brain function optimally.

## 2. AOP-Centric Architecture: The Translet

As the name Aspectran suggests, Aspectow's architecture is centered around the philosophy of **Aspect-Oriented Programming (AOP)**. It aims to maximize code modularity and reusability by separating cross-cutting concerns from business logic.

### The Birth of the Translet

In the traditional MVC pattern, the controller often takes on multiple responsibilities, such as handling requests, calling business logic, and rendering views, which can easily lead to complex code. Aspectran views this entire request-response process as a single, independent 'aspect' and encapsulates it into a concept called the **Translet**.

A Translet is a **complete blueprint of processing rules** that defines what tasks to perform for a specific request. This allows developers to focus purely on business logic, while common functionalities like transactions, security, and logging can be transparently applied before and after the Translet's execution through aspects.

### Core Components

- **Translet**: A set of rules mapped to a web request (URL) that defines what tasks to perform.
- **Activity**: The execution agent that performs the actual request processing work according to the rules defined in the Translet.
- **Action**: An individual unit of work executed within an Activity. For example, it can perform tasks like querying a database or executing business logic.

This structure clearly separates the request handling flow from the actual business logic, complementing the shortcomings of the traditional MVC pattern and significantly improving maintainability.

## 3. Aspectow as a WAS

Based on the AOP/Translet core architecture described above, Aspectow provides features as an enterprise-grade WAS.

### 3.1. Web Server Integration

Aspectow comes with high-performance embedded web servers like JBoss's **Undertow** or Eclipse's **Jetty**. This allows you to run the application and handle web requests immediately without any separate web server configuration.

### 3.2. Servlet Container Support

- **Enterprise and Jetty Editions**: Fully support the Servlet 6.0 specification based on Jakarta EE 10, meaning existing servlet-based web applications can be stably operated in the Aspectow environment.
- **Light Edition's Lightweight Strategy**: Optimized for high-performance REST API services, the Light Edition intentionally excludes the servlet specification to reduce unnecessary overhead, achieving faster response times and lower resource consumption.

## 4. Technical Deep Dive into Core Competitiveness

Aspectow's core competitive advantages are powerful built-in features provided on top of this architecture.

- **Native High-Performance Redis Session Store**: Provides high-performance session clustering that maximizes the asynchronous I/O characteristics of Redis using the `Lettuce` client.
- **AppMon (Built-in Application Monitoring)**: Monitors application logs, events, and performance metrics in real-time without any external tools.
- **Fine-Grained Server Customization via XML**: Allows for much more powerful and systematic server-level customization of the WAS's core behavior, such as server lifecycle and handler chains, through `server.xml`, compared to Spring Boot's `application.properties` approach.

## 5. Deployment and Operations Model

Aspectow's flexible architecture supports various deployment and operational environments.

### 5.1. Efficient Resource Management and Reloading

Aspectran manages JAR files from a specified resource directory by copying them to a `temp` directory, which allows for safe resource reloading without file locking issues. This enables flexible deployments that minimize downtime.

### 5.2. Provision of Production Deployment Scripts

Through the `setup` directory, Aspectow provides various scripts for production deployment and management, including installation, service registration/unregistration, and start/stop scripts, significantly reducing operational overhead.

### 5.3. Daemon/Shell Environment Support

In addition to web environments, Aspectow can be operated as a background service, batch job, or CLI tool by leveraging Aspectran's powerful daemon and shell features.
