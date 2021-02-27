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

Aspectran consists of the following key features:

* **Support POJO (*Plain Old Java Object*) programming model**  
  The complexity of the framework and the complexity of the detailed technology should not be passed on to developers.
  Developers can implement functionality in simple Java classes, and processing results can be returned as native Java objects.
* **Support Inversion of Control (*IoC*)**  
  The framework completes the full functionality by directly invoking the fragmentary functionality implemented by the developer while controlling the overall flow.
  The framework manages the creation and lifecycle of objects so that developers can focus on business logic.
* **Support Dependency Injection (*DI*)**  
  The framework links modules that depend on each other at runtime.
  It can maintain low coupling between modules and increase code reusability.
* **Support Aspect-Oriented Programming (*AOP*)**  
  The framework combines additional functionality such as transactions, logging, security, and exception handling within the core logic implemented by the developer.
  The framework combines additional features such as transactions, logging, security, and exception handling within the core logic implemented by the developer.
  Developers will be able to code the core and add-ons separately.
* **Support building RESTful Web Services**  
  Aspectran is designed from the ground up to be suitable for implementing REST APIs, eliminating the need for a separate framework or additional libraries.
  Intuitive API implementation allows you to send and receive messages in a consistent format quickly.
* **Fast development and startup time**  
  Aspectran's intuitive programming model ensures fast development and start-up time.

Applications developed based on Aspectran support the following execution environments on the JVM:

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
