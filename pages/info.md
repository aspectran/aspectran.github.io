---
layout: page
format: "plate solid article"
title: "About Aspectran"
subheadline: "What is Aspectran?"
teaser: "A light-weight Java application framework"
breadcrumb: true
comments: true
permalink: /info/
---
![aspectran](/images/header_aspectran.png)

Aspectran is a Java framework for building Web and command-line applications.  
Aspectran will grow into a next-generation Java application framework that supports most of the functionality required in an enterprise environment.

The main features of Aspectran are as follows:

* **Support various execution environments with the same configuration settings**  
  You can share the same configuration settings among different execution environments, such as the Web and CLI-based applications.
* **Support POJO (*Plain Old Java Object*) programming model**  
  You can concentrate on implementing the actual functionality you need, rather than extending the functionality by inheriting specific classes.
  The resulting value can be returned to the most simple Java object.
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

The following packages based on the `com.aspectran.core` package exist to support various execution environments.

* `com.aspectran.console`: Provides an interface for executing commands in an application built with Aspectran
* `com.aspectran.embed`: Provides the ability to embed Aspectran in other Java applications
* `com.aspectran.web`: Provides overall functionality for building web applications within a web application container
* `com.aspectran.with.jetty`: Supports for building standalone Web application that is built-in Jetty server

## History of Aspectran

The development of Aspectran was started in March 2008, but it was first published on September 1th 2015.  
The name Aspectan was created in July 2012 and it is a combination of Aspect and Translet.  
Aspectran is a lightweight framework developed to replace the conceptually complex Spring Framework.  
The Spring Framework is still widely used as an alternative to EJB, but soon Aspectran will become the next runner.
