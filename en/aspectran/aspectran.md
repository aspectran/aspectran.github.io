---
lang: en
layout: page
sidebar: right
title: "About Aspectran"
subheadline: "What is Aspectran?"
teaser: "Aspectran is a lightweight framework for building high-performance Java applications. It provides an intuitive and flexible development environment."
header:
  image_fullwidth: "header_gettingstarted.jpg"
  caption: "My cute second daughter"
breadcrumb: true
comments: false
permalink: /en/aspectran/
---

![Aspectran Archtecture Diagram](/images/info/aspectran_archtecture_diagram.png "Aspectran Archtecture Diagram")

Aspectran is a framework for developing Java applications that can be used to build simple shell applications and large enterprise web applications.

The key features of Aspectran are:

* **Support POJO (*Plain Old Java Object*) programming model**  
  Developers do not need to know the heavy and complex objects used internally by the framework. They can exchange objects with the framework using simple Java classes.
* **Support Inversion of Control (*IoC*)**  
  What's more, the framework manages the creation and lifecycle of objects while controlling the overall flow, freeing developers to focus on their business logic.
* **Support Dependency Injection (*DI*)**  
  The framework systematically connects modules that depend on each other at runtime to ensure low coupling between modules and to increase code reusability.
* **Support Aspect-Oriented Programming (*AOP*)**  
  The framework combines additional features such as transactions, logging, security, and exception handling with code written by the developer at runtime.
* **Support building RESTful Web Services**  
  Aspectran is a framework designed from the ground up for REST API implementations and optimized for microservices architectures.
* **Fast development and startup time**  
  Aspectran's intuitive programming model guarantees fast development time and runs faster than other frameworks.

Aspectran-based applications support the following execution environments on the JVM:

* Consistent shell interface for command line applications
* Built-in high performance web application server (Undertow, Jetty)
* Daemons running as background processes

Aspectran consists of the following major packages:

* **com.aspectran.core**  
  Core package containing the main features of Aspectran
* **com.aspectran.daemon**  
  Package required to build applications that run as background processes on Unix-based or Windows operating systems
* **com.aspectran.embed**  
  Package required to embed Aspectran in other Java applications
* **com.aspectran.shell**  
  Package required to build shell (aka command line) applications
* **com.aspectran.shell-jline**  
  Package for using feature-rich JLine as an interactive shell interface 
* **com.aspectran.web**  
  Basic package required for building web applications
* **com.aspectran.websocket**  
  Package required to configure WebSocket endpoints
* **com.aspectran.jetty**  
  Add-on package for building web application servers using Jetty
* **com.aspectran.undertow**  
  Add-on package for building web application servers using Undertow
* **com.aspectran.rss-lettuce**  
  Package containing a Redis session store implementation using Lettuce as a client
* **com.aspectran.mybatis**  
  Add-on package for integrating MyBatis
* **com.aspectran.freemarker**  
  Add-on package required to use the FreeMarker template engine
* **com.aspectran.pebble**  
  Add-on package required to use the Pebble template engine

## History of Aspectran

The development of Aspectran was started in March 2008, but it was first published on September 1th 2015.  
The name Aspectan was created in July 2012 and it is a combination of Aspect and Translet.

## License

Aspectran is Open Source software released under the [Apache 2.0 license](http://www.apache.org/licenses/LICENSE-2.0).
