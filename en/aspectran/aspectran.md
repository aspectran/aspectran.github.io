---
lang: en
layout: page
sidebar: right
title: "About Aspectran"
headline: "What is Aspectran?"
teaser: "Aspectran is a lightweight framework for building high-performance Java applications. It provides an intuitive and flexible development environment."
header:
  image_fullwidth: "header_gettingstarted.jpg"
  caption: "My cute second daughter"
breadcrumb: true
comments: false
permalink: /aspectran/
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
* **Create Aspectran-powered, production-grade applications**  
  You can create reliable, standalone Java applications that run on multiple operating systems, and even run them in servlet containers or embed them into other Java applications.

Aspectran-powered applications support the following execution environments on the JVM:

* Consistent shell interface for command line applications
* Runs as a background process on Unix-based or Windows operating systems
* Built-in high performance web application server (Undertow, Jetty)
* Can also be run as a servlet in a traditional servlet container like Apache Tomcat or WildFly

Aspectran consists of the following major packages:

* **com.aspectran.core**  
  Package containing the core features of Aspectran
* **com.aspectran.daemon**  
  Package for running Aspectran-based Java applications as background processes on Unix-based or Windows operating systems
* **com.aspectran.embed**  
  Package for embedding Aspectran in non-Aspectran-based Java applications
* **com.aspectran.shell**  
  Package for building interactive shell (aka command line) applications based on Aspectran
* **com.aspectran.shell-jline**  
  Package for building feature-rich Aspectran-based interactive shell applications with JLine 3
* **com.aspectran.web**  
  Package for building web applications using Jakarta EE
* **com.aspectran.websocket**  
  Package required to configure websockets in Aspectran-based web applications
* **com.aspectran.rss-lettuce**  
  Package containing a Redis session store implementation using Lettuce as a client
* **com.aspectran.jetty**  
  Add-on package for using Jetty as the embedded servlet container
* **com.aspectran.undertow**  
  Add-on package for using Undertow as the embedded servlet container
* **com.aspectran.mybatis**  
  Add-on package for using the MyBatis SQL mapper framework that makes using relational databases easy
* **com.aspectran.freemarker**  
  Add-on package for using Freemarker as the templating engine
* **com.aspectran.pebble**  
  Add-on package for using Pebble as the templating engine

## History of Aspectran

I started developing Aspectran in March 2008 and first released it on September 1, 2015.  
At the beginning of development, it was called Translets, but around July 2012, when AOP feature was added,
the name was changed to Aspectran. Aspectran is a compound word of 'Aspect' and 'Translet'.

## License

Aspectran is Open Source software released under the [Apache 2.0 license](http://www.apache.org/licenses/LICENSE-2.0).
