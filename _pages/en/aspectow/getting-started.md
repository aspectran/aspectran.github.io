---
format: plate solid article
title: Getting Started with Aspectow
teaser: This guide will walk you through running and managing an Aspectow-based web application from an interactive shell.
sidebar: toc
---

## 1. Prerequisites

*   **Java Development Kit (JDK) 21 or higher**: Aspectow runs on Java 21 or a later version.
*   **Git**: Required to clone the sample project.
*   **Apache Maven**: Required to build and run the project.

## 2. Clone the Sample Project

First, clone the Aspectow ToDo web app sample project from GitHub.

```bash
git clone https://github.com/aspectran/aspectow-todo-webapp.git
cd aspectow-todo-webapp
```

## 3. Run the Project

Navigate to the cloned project directory, build the application using Maven, and run it with the shell script.

- `mvn clean package`: Builds the project and generates libraries in the `app/lib` directory.
- `shell.sh` or `shell.bat`: Starts the Aspectow interactive shell.

**Linux/macOS**
```bash
mvn clean package
./bin/shell.sh
```

**Windows**
```cmd
mvn clean package
bin\shell.bat
```

Once the application starts successfully, you will see a greeting message and the `aspectow` prompt awaiting your command.

> The `aspectow-todo-webapp` sample application has a feature enabled by default that prevents multiple instances from running simultaneously. If the application seems to hang and does not start when you run `shell.sh`, check if it is already running in another terminal.

```
---------------------------------------------------------------------------------
 Aspectran : 9.1.0
 JVM       : OpenJDK 64-Bit Server VM (build 23.0.2+7, mixed mode, sharing)
 OS        : Mac OS X 26.0 aarch64
---------------------------------------------------------------------------------
... (omitted) ...
DEBUG 2025-09-25 20:02:28.080 [demo] Initialized DefaultSessionManager@1e0a864d(shell) - c.a.c.c.AbstractComponent.initialize(65)

     ___                         __
    /   |  _________  ___  _____/ /_____ _      __
   / /| | / ___/ __ \/ _ \/ ___/ __/ __ \ | /| / /
  / ___ |(__  ) /_/ /  __/ /__/ /_/ /_/ / |/ |/ /
 /_/  |_/____/ .___/\___/\___/\__/\____/|__/|__/    Enterprise Edition
=========== /_/ ==========================================================
:: Built with Aspectran :: 9.1.0

To see a list of all built-in commands, type help.
To get help for a specific command, type command_name -h.
To list all available translets, type translet -l.
To run a translet, type translet <translet_name> or just translet_name.


Use the command 'undertow' to control the Undertow Server.
Since Undertow Server is running, have your web browser point to:
   http://localhost:8080/todos

Current profiles: [dev]

aspectow>
```

## 4. Check the Result

As instructed in the greeting message, open your web browser and navigate to the following address to see the ToDo web application.

```
http://localhost:8080/todos
```

If the ToDo list management page appears in your browser, you have successfully run the application.

## 5. Shut Down the Application

You can shut down the application by typing the `quit` command at the `aspectow` prompt.

```
aspectow> quit
Are you sure you want to quit [Y/n]?
```

## 6. Project Directory Structure

The main directory structure of an Aspectow application is as follows. Understanding this structure will help you locate configuration files, logs, and web content.

```
app
├── bin             # Execution scripts (daemon.sh, shell.sh, etc.)
│   └── procrun     # Scripts and configuration files for Apache Commons Procrun (for Windows)
├── cmd             # Directory for file-based command processing.
│   ├── incoming    # Directory for incoming command files from external sources
│   ├── queued      # Directory where queued command files are moved
│   ├── completed   # Directory where successfully completed command files are archived
│   ├── failed      # Directory where failed command files are archived
│   └── sample      # Sample command files
├── config          # Application configuration files (aspectran-config.apon, root-context.xml, etc.)
│   ├── appmon      # AppMon related settings
│   ├── logging     # Logging settings (logback.xml, etc.)
│   ├── mail        # Mail related settings
│   └── server      # Server settings (server.xml, undertow settings, etc.)
├── lib             # Directory where external JAR files are copied during Maven build
│   └── ext         # Application libraries
├── logs            # Application log files
├── temp            # Temporary file storage
├── webapps         # Web application deployment directory (root, appmon, manager, etc.)
│   ├── appmon      # AppMon web application
│   └── root        # Default web application
└── work            # Web application working directory (sessions, compiled JSPs, etc.)
```

## 7. Key Aspectran Configuration Files

In the `aspectow-todo-webapp` project, the main configuration files that control the behavior of the Aspectran application are as follows:

*   **`app/config/aspectran-config.apon`**: Defines the overall behavior of the Aspectran context, specifying component scan paths, etc.
*   **`app/config/root-context.xml`**: Contains the core context settings for the application, handling Translet and Bean definitions, view settings, and more related to web request processing.
*   **`app/config/server/server.xml`**: Includes other XML files used to configure the Undertow web server's port, context path, servlet filters, etc.

For more details on each configuration file, refer to the [Aspectran Configuration documentation](/en/docs/guides/aspectran-configuration/).

## 8. Request Handling Flow with Translets

Translet, Activity, and Action, the core concepts of Aspectran, are the main components that handle incoming web requests.

*   **Translet**: A **blueprint of processing rules** that is mapped to a web request (URL) and defines what tasks to perform.
*   **Activity**: The **main agent of request processing** that performs the actual work according to the rules defined in the Translet.
*   **Action**: An **individual unit of work** executed within an Activity. For example, it can retrieve data from a database or execute business logic.

In short, when a web request comes in, the Translet accepts it and starts an Activity. The Activity then uses Actions to perform the necessary tasks and returns the result to the user.

For more details on each concept, please refer to the [Translet documentation](/en/docs/guides/aspectran-translet/) and the [Action documentation](/en/docs/architecture/aspectran-actions/).

## 9. Direct Execution and Debugging in a Development Environment

In a local development environment, the `src/test/java` directory is more than just a space for unit or integration tests; it can also contain directly executable classes for development and debugging. This is an important feature that demonstrates the flexibility of Aspectran-based development.

When using an IDE (e.g., IntelliJ IDEA, Eclipse), you can directly run a specific class (e.g., `aspectow-todo-webapp\src\test\java\app\ToDoDemo.java`) to quickly check the behavior of a specific feature or set breakpoints to trace the code flow. Running and debugging a class like `aspectow-todo-webapp\src\test\java\app\ToDoDemo.java` is particularly useful for directly observing which service beans are called and how data is processed when a web request comes in. This allows you to clearly understand how Translets integrate with the service layer. It is also possible to run it directly via the `java` command outside the IDE and connect a remote debugger.

This approach is highly effective for getting immediate feedback and resolving issues for a specific module or feature under development, without going through the entire process of building and deploying the application.

## 10. Development Tips and Best Practices

Consider the following tips and best practices when developing Aspectran web applications like `aspectow-todo-webapp`.

### 1. Logging Configuration

To effectively check the application's debug logs, you need to adjust the logging settings appropriately.

*   **`logback-test.xml`**: In the `src/test/resources/logback-test.xml` file, you can properly view debug logs by modifying the logger name to your app's package path, like `<logger name="com.example.todo" level="debug"/>`.
*   **`logback.xml` and `logback-debug.xml`**: You can also optimize logging settings in these files by modifying the app's package path.

## 11. Next Steps

*   **Explore the Code**: Look through the code of the cloned project to understand the structure and behavior of Aspectran.
*   **Learn Core Concepts**: Read [Aspectow Architecture](/en/aspectow/archtecture/) to delve deeper into the main features of the Aspectran framework and Aspectow WAS.
*   **Develop Your Own Application**: Start developing your own application based on an Aspectow [starter project](/en/projects/).
