---
layout: page
format: "plate solid article"
title: "About Aspectran"
subheadline: "What is Aspectran?"
teaser: "A light-weight Java application framework"
breadcrumb: true
comments: false
permalink: /en/info/
---

<img src="/images/info/aspectran_archtecture_diagram.png" width="50%" align="right" title="Aspectran Archtecture Diagram">
Aspectran is a concise, easy-to-use Java application framework.
Some of the widely used Java application frameworks are becoming more and more complex with more features as they mature. A typical example would be the Spring Framework. Aspectran is a single-structure, next-generation framework that incorporates some of the key features of the Spring Framework with new perspectives.

Aspectran consists of the following core functions:

* **Support multiple execution environments with identical configuration settings**  
  You can share the same configuration settings in different execution environments, such as Web and CLI-based applications.
* **Support POJO (*Plain Old Java Object*) programming model**  
  Rather than inheriting certain classes and extending functionality, you can concentrate on implementing the functionality that is actually needed.
  The result value can be returned as the simplest Java object.
* **Support Inversion of Control (*IoC*)**  
  The framework controls the overall flow and invokes the functionality of the module created by the developer.
  Provides the ability to manage the creation and lifecycle of objects, allowing developers to focus on business logic.
* **Support Dependency Injection (*DI*)**  
  The framework links modules that depend on each other at runtime.
  It can maintain low coupling between modules and increase code reusability.
* **Support Aspect-Oriented Programming (*AOP*)**  
  You can write code by separating core functions and additional functions.
  Once the core functionality implementation is complete, features such as transactions, logging, security, and exception handling can be combined with core functionality.
* **Support building RESTful Web Services**  
  Aspectran is designed to be suitable for building RESTful Web Services.

Aspectran provides the environment to build web application server and shell application easily based on the above core functions. In addition, it enables rapid execution and deployment. Java code written in POJO with Aspectran's powerful and concise configuration settings facilitates testing and maximizes code reuse when developing applications in other execution environments.

The following packages based on the `com.aspectran.core` package exist to support various execution environments.

* `com.aspectran.daemon`: Provides a daemon that runs Aspectran as a service in the background on Unix-based or Windows operating systems
* `com.aspectran.embed`: Provides an interface that can be used by embedding Aspectran in Java applications
* `com.aspectran.shell`: Provides an interactive shell that lets you use or control Aspectran directly from the command line
* `com.aspectran.shell-jline`: Provides an interactive shell using the feature-rich JLine
* `com.aspectran.web`: Provides overall functionality for building web applications within a web application container
* `com.aspectran.freemarker`: Add-on package for integrating Freemarker
* `com.aspectran.jetty`: Add-on package for integrating Embedded Jetty
* `com.aspectran.mybatis`: Add-on package for integrating MyBatis
* `com.aspectran.pebble`: Add-on package for integrating Pebble

## History of Aspectran

The development of Aspectran was started in March 2008, but it was first published on September 1th 2015.  
The name Aspectan was created in July 2012 and it is a combination of Aspect and Translet.
