---
format: plate solid article
sidebar: right
title: "Aspectran Overview"
teaser: "Aspectran is a lightweight, high-performance framework based on the JVM, designed to efficiently build a wide range of applications, from simple command-line applications to complex enterprise web services."
---

## Introduction

Aspectran is a lightweight, high-performance framework based on the JVM, designed to efficiently build a wide range of applications, from simple command-line applications to complex enterprise web services. It boasts fast startup times and low memory footprint through minimal dependencies and optimized resource usage, making it particularly suitable for microservices architecture or cloud environments.

Aspectran emphasizes an intuitive POJO-centric programming model, allowing developers to focus on business logic using plain old Java objects (POJOs) without needing to deeply understand the complex internal structure of the framework. It embeds powerful enterprise patterns such as Inversion of Control (IoC), Dependency Injection (DI), and Aspect-Oriented Programming (AOP) to maximize code modularity, reusability, and maintainability. Additionally, it facilitates the building of modern web applications and APIs through optimized support for RESTful web service development and integration with various embedded web servers (Undertow, Jetty). In particular, the **adapter pattern for environment abstraction** is a key strength that enhances Aspectran's flexibility and development productivity.

## Architecture Overview

Aspectran adopts a modular, layered architecture to provide flexibility and extensibility. The core is the Activity-based request processing mechanism implemented in the `aspectran-core` module. Each layer has a clear role, and through the **adapter pattern**, it abstracts the differences of various execution environments, allowing business logic to operate independently of the environment.

*   **Activity Layer**: Receives all external requests (web, shell, etc.) and creates an Activity context to process those requests. This layer manages the lifecycle of the request and finds the appropriate Translet to process the request according to defined rules.
*   **Translet Layer**: This layer defines the `Translet` rules that the `Activity` references when processing requests. The `Activity` controls the flow of executing `Action`s, using `Bean`s, and finally generating a response through `View` according to the `Translet` rules defined in this layer.
*   **Bean Container Layer**: The core layer responsible for IoC/DI, managing all beans (objects) of the application. It handles bean creation, initialization, destruction, and dependency injection, ensuring loose coupling between components.
*   **AOP Layer**: This layer houses Aspectran's AOP engine. It applies Aspects to specific join points, such as before/after Translet execution or before/after Bean method calls, to handle cross-cutting concerns. This operates independently of the core business logic, enhancing code reusability and maintainability.
*   **View Layer**: This layer renders views to display the request processing results to the user. It supports flexible implementation of presentation logic through integration with various template engines (FreeMarker, Pebble, Thymeleaf, etc.).

These layers are organically connected to form the request processing flow, and each module is responsible for a specific functional area, strengthening the overall system's modularity.

## Core Concepts

Aspectran operates based on several core concepts that provide its flexibility and power.

*   **Activity**: The **execution engine** that processes all requests in Aspectran and the context that manages the request's lifecycle. It processes all types of requests, such as web requests and shell commands, in a consistent manner.
*   **Translet**: A **set of processing rules or a blueprint** for "how to handle" a specific request. It defines request/response/exception handling rules and the business logic (Action) to be executed. The `Activity` processes requests according to this blueprint, and the `Translet` instance created during this process acts as an **interface** for data sharing and control between the `Activity` and user code.
*   **Bean**: An object managed by Aspectran's IoC container. Application components (services, DAOs, utilities, etc.) are registered as beans, their lifecycle is managed by the framework, and they are provided where needed through dependency injection. It supports singleton, prototype, request, and session scopes, allowing for flexible object lifecycle management.
*   **Action**: An individual unit of work executed within an `Activity`, whose execution rules are defined in a `Translet`. It performs specific functions such as database queries, external API calls, and business logic processing. It provides various types of actions, and their processing results are hierarchically structured and utilized for subsequent processing or view rendering.
*   **Aspect**: A core element of Aspect-Oriented Programming (AOP), it modularizes and manages cross-cutting concerns such as logging, transaction management, security, and exception handling. The new AOP proxy mechanism optimizes performance and supports flexible context management in asynchronous execution environments.
*   **Template**: Used to render views to display the results processed by Translet to the user. It supports integration with various template engines like FreeMarker, Pebble, and Thymeleaf, enabling flexible UI/UX implementation.

## Key Features

Aspectran provides various powerful features for modern application development.

*   **POJO Programming**: Aspectran allows implementing business logic using plain old Java objects (POJOs) without implementing special interfaces or inheriting from specific framework classes. This reduces the learning curve for developers and allows them to focus on solving business problems with pure Java code.
*   **Inversion of Control (IoC)**: The framework is responsible for object creation, configuration, and lifecycle management. Developers can reduce code complexity and improve testability by delegating object creation to the framework instead of creating or managing objects directly.
*   **Dependency Injection (DI)**: A core function of the IoC container, it automatically injects dependencies (other objects) that an object needs at runtime, instead of the object creating or finding them itself. This minimizes coupling between components and allows for writing flexible and reusable code.
*   **Aspect-Oriented Programming (AOP)**: Modularizes cross-cutting concerns that appear repeatedly throughout the application, such as logging, transaction management, security, and caching, and separates them from the core business logic. Aspectran's AOP is dynamically applied at runtime, eliminating code duplication and improving maintainability.
*   **Session Management**: Aspectran provides a **high-performance, environment-independent session management component** that can maintain state consistently across various execution environments such as web, shell, and daemon. It features enterprise-grade capabilities with pluggable storage (files, Redis, etc.), fine-grained lifecycle management, and clustering support.
*   **Configuration and Loading**: Aspectran configures applications through configuration files in APON (Aspectran Object Notation) or XML format. It uses its self-developed `nodelet` parsing engine to efficiently load configuration files and supports dynamic reloading for enhanced development convenience.
*   **AsEL (Aspectran Expression Language)**: Aspectran provides its own expression language, AsEL, for handling dynamic values within configuration files. AsEL supports powerful features such as dynamically referencing and injecting request data or properties of other beans at runtime using tokens like `${...}` (parameters), `@{...}` (attributes), and `#{...}` (beans or bean properties). Additionally, it can process complex expressions, such as calling object methods or navigating properties within tokens, by internally using OGNL (Object-Graph Navigation Language).
*   **Logging**: Aspectran builds a flexible and powerful logging system based on SLF4J and Logback. It provides a powerful feature to separate and manage logs by service or function unit through its unique `LoggingGroupDiscriminator`.
*   **RESTful Web Services**: Aspectran provides optimized features for RESTful API development. It can process requests based on HTTP methods (GET, POST, PUT, DELETE, etc.) with concise configuration and generate responses in various formats like JSON/XML. This enables efficient API server construction in microservice architectures.
*   **Rapid Development and Startup**: Actively utilizes the Convention over Configuration principle to minimize boilerplate code that developers need to write. It also shortens application startup time through lightweight design and optimized initialization processes, enhancing development and deployment efficiency.
*   **Production-Grade Applications**: Aspectran is designed with stability and scalability in mind and can be flexibly deployed in various operating environments. It can be deployed as a standalone JVM application, a web application in traditional servlet containers (Tomcat, WildFly), or embedded within other Java applications, ensuring stable operation. The **adapter pattern for environment abstraction** allows the same business logic to run without modification in any environment.

## Modules

Aspectran provides fine-grained modules by function, allowing you to selectively use only the features you need.

*   **`aspectran-all`**: A single JAR file that includes all Aspectran modules and their dependencies. Useful when you want to include all features at once for development and deployment convenience.
*   **`aspectran-bom`**: Maven Bill of Materials (BOM), which helps manage consistent versions of Aspectran-related modules. You can add it to your project's `pom.xml` to prevent dependency version conflicts.
*   **`aspectran-core`**: The heart of the Aspectran framework. It includes the core APIs and implementations of the framework, such as Activity, Translet, Bean container, and AOP engine, forming the basis of all Aspectran-based applications.
*   **`aspectran-daemon`**: Provides functionality to run Aspectran applications as background daemons on Unix-like systems or as Windows services. Suitable for long-running server applications or batch jobs.
*   **`aspectran-embed`**: Allows Aspectran to be embedded and used within other Java applications. Useful when you want to add Aspectran's powerful features to an existing application, and integration is possible without separate container configuration.
*   **`aspectran-logging`**: Provides a flexible interface for logging in Aspectran applications. It uses SLF4J and Logback by default and provides bridges for other logging APIs like JCL, JUL, and Log4j to ensure compatibility with existing logging systems.
*   **`aspectran-shell`**: Supports easy building of interactive command-line interface (CLI) applications. It provides functions to process user input, execute business logic through Translets, and output results to the console.
*   **`aspectran-shell-jline`**: Integrates the `aspectran-shell` module with the JLine 3 library to provide a richer interactive shell environment, including command-line auto-completion, history management, and colored output.
*   **`aspectran-utils`**: A module that collects various general utility classes that can be usefully employed both inside and outside the Aspectran framework.
*   **`aspectran-web`**: Provides functionality for building web applications based on the Jakarta EE (formerly Java EE) Servlet API. It includes core elements necessary for web development, such as web request processing, session management, filters, and interceptors.
*   **`aspectran-rss-lettuce`**: Provides a Redis-based high-performance Lettuce client implementation for session storage, allowing efficient management of session data in distributed environments.
*   **`aspectran-with-jetty`**: Integrates the embedded Jetty web server into Aspectran applications. It simplifies deployment by allowing Aspectran applications to run independently without separate web server installation.
*   **`aspectran-with-undertow`**: Integrates the embedded Undertow web server into Aspectran applications. Undertow is a lightweight, high-performance web server suitable for environments requiring fast startup and low resource usage.
*   **`aspectran-with-freemarker`**: Integrates the FreeMarker template engine with Aspectran's View layer. It allows for the creation of dynamic web pages through server-side template rendering.
*   **`aspectran-with-pebble`**: Integrates the Pebble template engine with Aspectran, providing flexible and powerful template features.
*   **`aspectran-with-thymeleaf`**: Integrates the Thymeleaf template engine with Aspectran. It supports HTML5-friendly template writing and makes it easy to create web-standard-compliant views.
*   **`aspectran-with-jpa`**: Provides integration with Jakarta Persistence API (JPA), allowing efficient database operations through object-relational mapping (ORM).
*   **`aspectran-with-mybatis`**: Provides integration with the MyBatis persistence framework. Useful for developers who prefer a SQL Mapper-based approach to database access.
*   **`aspectran-with-logback`**: A POM module for conveniently managing Logback logging framework dependencies. Primarily used in build and test environments of other modules.

## Supported Execution Environments

Aspectran is designed to be flexibly deployed and executed in various environments.

*   **Command-Line Shell (Interactive and Background Modes)**: Aspectran supports the development of powerful CLI applications. In interactive mode, it processes commands in real-time based on user input, while in background mode, it can be used as a daemon for long-running batch jobs or server processes.
*   **Embedded Web Servers (Undertow, Jetty)**: Aspectran applications can run independently by embedding a web server directly within the application itself, without separate web server installation. This is very useful for microservices or single executable JAR/WAR deployments, simplifying the development and deployment process.
*   **Servlet Containers (Apache Tomcat, WildFly, etc.)**: According to traditional web application deployment methods, it can be deployed as a WAR file to standard servlet containers like Apache Tomcat and WildFly. This provides compatibility with existing infrastructure.

## Key Use Cases

Thanks to its flexibility and power, Aspectran can be used for developing various types of applications.

*   **RESTful API Server**: Its lightweight, high-performance characteristics and support for RESTful web services make it very suitable for building API servers, which are central to microservice architectures.
*   **Web Application**: Traditional MVC-based web applications can be efficiently developed through its integration with various template engines and web modules.
*   **Command-Line Tools (CLI Tools)**: Leveraging its powerful shell module, you can build various command-line applications such as complex system management tools, batch scripts, and data processing utilities.
*   **Backend Services**: Through daemon mode, it can stably operate various backend systems such as long-running background services, batch processing systems, and data synchronization services.
*   **Embedded Systems**: Using the `aspectran-embed` module, you can integrate Aspectran's IoC, DI, and AOP functionalities into existing Java applications to enhance the capabilities or flexibility of specific modules.

## Build

Here's how to build and run the Aspectran project in your local environment.

```sh
# Clone and build the project (requires Maven 3.6.3 or higher)
git clone https://github.com/aspectran/aspectran.git
cd aspectran
./build rebuild   # or ./mvnw clean install
```
*   **Java 21 or higher**: Aspectran requires Java 21 as the minimum runtime version. It is recommended to use the latest Java LTS version.
*   **Maven**: Apache Maven 3.6.3 or higher must be installed for project builds.

## Run Demo

You can quickly explore the framework's features by building and running the Aspectran demo application.

```sh
./build demo      # Builds and starts the demo application.
# Access http://localhost:8080 in your web browser to check out the demo.
```
The demo application includes example code demonstrating various Aspectran features (web services, AOP, bean management, etc.).

## Continuous Integration

The Aspectran project manages continuous integration (CI) and continuous deployment (CD) through GitHub Actions workflows.

*   [GitHub Actions](https://github.com/aspectran/aspectran/actions): All changes to the project are automatically built, tested, and verified to ensure code quality and stability.

## Community and Support

Aspectran is continuously evolving through active development and a user community.

*   **GitHub Issues**: Problems, bug reports, and feature suggestions during project use can be shared and discussed via GitHub Issues.
*   **Official Documentation**: You can learn and utilize all features of the framework through the detailed documentation provided on the Aspectran official website.
*   **Contribution**: The Aspectran project is open source, and anyone can participate in its development by contributing code, improving documentation, or fixing bugs.

## Links

*   **Official Site**: [https://aspectran.com/](https://aspectran.com/) - You can find the latest information and documentation about Aspectran.
*   **Demo**: [https://public.aspectran.com/](https://public.aspectran.com/) - Experience actual demo web applications built with Aspectran.
*   **API Documentation**: [https://javadoc.io/doc/com.aspectran/aspectran-all](https://javadoc.io/doc/com.aspectran/aspectran-all) - Provides detailed Javadoc documentation for all Aspectran APIs.

## License

Aspectran is distributed under the [Apache 2.0 License](http://www.apache.org/licenses/LICENSE-2.0). This means it can be freely used, modified, and distributed for commercial and non-commercial purposes.
