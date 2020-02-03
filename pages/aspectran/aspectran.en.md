---
layout: page_en
format: article
sidebar: right
title: "Aspectran"
subheadline: "What is Aspectran?"
teaser: "Aspectran is a lightweight framework for building high performance Java applications."
header:
  image_fullwidth: "header_gettingstarted.jpg"
  caption: "My cute second daughter"
breadcrumb: true
comments: false
permalink: /en/aspectran/
---

![Aspectran Archtecture Diagram](/images/info/aspectran_archtecture_diagram.png "Aspectran Archtecture Diagram")

Aspectran is an intuitive and easy to use Java application framework.

Aspectan's core features and built-in web application server make it easy to build 
high-performance REST API services and enterprise web applications. It also provides 
a consistent shell interface for creating simple command line applications.

Aspectran consists of the following key features:

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
* `com.aspectran.rss-lettuce`: Add-on package for providing session clustering via persistence to Redis using Lettuce as the client
* `com.aspectran.shell`: Provides an interactive shell that lets you use or control Aspectran directly from the command line
* `com.aspectran.shell-jline`: Provides an interactive shell using the feature-rich JLine
* `com.aspectran.web`: Provides overall functionality for building web applications within a web application container
* `com.aspectran.jetty`: Add-on package for integrating Embedded Jetty
* `com.aspectran.mybatis`: Add-on package for integrating MyBatis
* `com.aspectran.undertow`: Add-on package for integrating Embedded Undertow

## History of Aspectran

The development of Aspectran was started in March 2008, but it was first published on September 1th 2015.  
The name Aspectan was created in July 2012 and it is a combination of Aspect and Translet.

## License

Aspectran is Open Source software released under the [Apache 2.0 license](http://www.apache.org/licenses/LICENSE-2.0).
