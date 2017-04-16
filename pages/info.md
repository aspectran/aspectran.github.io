---
layout: page
format: article
title: "About Aspectran"
subheadline: "What is Aspectran?"
teaser: "The Next Generation Java Application Framework"
header:
  image_fullwidth: "header_aspectran.png"
  slogan_hidden: true
outside_heading: false
inside_heading: true
comments: true
permalink: /info/
---
Aspectran is a lightweight Java application framework for building Web, console-based, and embedded applications.
Aspectran will support most of the functionality required in an enterprise environment, and will grow into a next-generation Java application framework.

The main features of Aspectran are as follows:

* Support various execution environments with the same configuration settings  
  You can use the same configuration settings for different execution environments, such as Web, console-based, and other applications.
* Support POJO (*Plain Old Java Object*) programming model  
  You can concentrate on implementing the actual functionality you need, rather than extending the functionality by inheriting specific classes.
  The resulting value can be returned to the most simple Java object.
* Support Inversion of Control (*IoC*)  
  The framework controls the overall flow and invokes the functionality of the module created by the developer.
  Provides the ability to manage the creation and lifecycle of objects, allowing developers to focus on business logic.
* Support Dependency Injection (*DI*)  
  The framework links modules that depend on each other at runtime.
  It can maintain low coupling between modules and increase code reusability.
* Support Aspect-Oriented Programming (*AOP*)  
  You can write code by separating core functions and additional functions.
  Once the core functionality implementation is complete, features such as transactions, logging, security, and exception handling can be combined with core functionality.
* Support building RESTful Web Services

The following packages based on the `core` package exist to support various execution environments.

* The `com.aspectran.console` package: Support ability to build console-based applications
* The `com.aspectran.embedded` package: Support ability to embed Aspectran in other applications
* The `com.aspectran.web` package: Support ability to build web applications

## Package Structure

Aspectran consists of the following major packages:

```
com.aspectran
├── core          Provides core interfaces and classes for the Aspectran infrastructure
│   ├── activity    A package for providing a core activity for processing request and response
│   ├── adapter     A package for providing basic adapters for integration with a core activity
│   ├── context     A Package for providing core components and configuring an execution environment
│   ├── service     A package for providing a core service using Aspectran infrastrucre
│   └── util        A package that contain miscellaneous utilities
├── console       A package for building console-based applications based on the Aspectran infrastructure
│   ├── activity    Contains a variant of the activity interface for console-based application
│   ├── adapter     Contains a variant of the adapter interface for console-based application
│   ├── inout       A package to provide console input / output handling
│   └── service     Contains a variant of the service interface for console-based application
├── embedded      A package that provides the ability to embed Aspectran in other applications
│   ├── activity    Contains a variant of the activity interface for embedded Aspectran
│   ├── adapter     Contains a variant of the adapter interface for embedded Aspectran
│   └── service     Contains a variant of the service interface for embedded Aspectran
├── scheduler     Built-in scheduler package that integrates with Aspectran infrastructure
│   ├── activity    Contains a variant of the activity interface for built-in scheduler
│   ├── adapter     Contains a variant of the adapter interface for built-in scheduler
│   ├── service     Contains a variant of the service interface for built-in scheduler
│   └── support     A package to support external modules for built-in scheduler
└── web           A package for building web applications based on the Aspectran infrastructure
    ├── activity    Contains a variant of the activity interface for web application
    ├── adapter     Contains a variant of the adapter interface for web application
    ├── service     Contains a variant of the service interface for web application
    ├── startup     Provides servlets and listeners for integration with web application
    └── support     A package to support external modules for web application integration
```

## History of Aspectran

The development of Aspectran was started in March 2008, but it was first published on September 1th 2015.  
The name Aspectan was created in July 2012 and it is a combination of Aspect and Translet.  
Aspectran is a lightweight framework developed to replace the conceptually complex Spring Framework.  
The Spring Framework is still widely used as an alternative to EJB, but soon Aspectran will become the next runner.
