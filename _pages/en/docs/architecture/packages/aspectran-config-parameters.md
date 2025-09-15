---
format: plate solid article
sidebar: toc-left
title: In-Depth Analysis of the `com.aspectran.core.context.config` Package
subheadline: Architecture - Package Deep Dive
parent_path: /docs
---

## 1. Design Goals and Key Roles

This package is a **collection of type-safe data container classes** that hold all configuration values for the Aspectran framework. The design goals of this package are as follows:

-   **Objectification of Configuration**: Parses the content of external configuration files in XML or APON format and converts them into an object model that can be easily accessed and used in Java code.
-   **Hierarchical Structure**: With `AspectranConfig` as the top-level root, objects containing settings for each function and environment form a hierarchical structure. This allows for a clear understanding of the relationships within the overall configuration.
-   **Modularity and Separation**: Separates settings specific to each execution environment (web, daemon, shell, etc.) into separate classes (`WebConfig`, `DaemonConfig`, etc.), reducing dependencies on specific environments and increasing the modularity of the configuration.
-   **Immutability-Oriented**: Configuration classes are designed with the premise that they will not be changed once the context is built by `ActivityContextBuilder`. This ensures the consistency and predictability of configuration values at runtime.

In conclusion, this package **converts text-based configuration files into a structured object model** that the framework can understand and use, and is responsible for decoupling the configuration source (XML/APON) from the components that use the configuration.

## 2. Detailed Analysis of Key Classes

### `AspectranConfig` (Class)

The top-level root container for all Aspectran configurations.

**Key Responsibilities:**
-   Maintains references to all child configuration objects (`ContextConfig`, `WebConfig`, `DaemonConfig`, etc.).
-   Can hold global default values such as the application's default encoding (`encoding`) or auto-reload scan interval (`scanIntervalSeconds`).

**Interaction with Other Classes:**
-   Created and populated by parsers like `AspectranConfigReader`.
-   Passed as an argument to the constructor when `DefaultCoreService` is created, becoming the starting point for all configuration information needed by `ActivityContextBuilder` to build the context.

### `ContextConfig` (Class)

Contains the most essential configurations that apply commonly to all Aspectran applications, regardless of the execution environment.

**Key Responsibilities:**
-   Manages essential information that defines the core behavior of `ActivityContext`.

**Key Attribute Analysis:**
-   `basePath`: Specifies the base path of the application. All relative paths are interpreted based on this path.
-   `contextRules`: Specifies the paths of configuration files or resources where Aspectran's core rules (`bean`, `translet`, etc.) are defined. Multiple paths can be specified.
-   `basePackages`: Specifies the base packages to start scanning for classes annotated with `@Component` to automatically register them as beans.
-   `profiles`: Specifies the profiles to activate. Divided into `activeProfiles` and `defaultProfiles`, with `activeProfiles` taking precedence.
-   `autoReload`: If set to `true`, it enables the hot-reloading feature, which automatically reflects changes when configuration files specified in `contextRules` are modified, without restarting the application.

### `WebConfig` / `DaemonConfig` / `ShellConfig` / `EmbedConfig` (Classes)

Classes that contain settings specific to each execution environment.

**Key Responsibilities:**
-   **`WebConfig`**: Manages settings required when running as a web application. It allows detailed configuration of session management via `sessionConfig`, specifies URI character encoding with `uriDecoding`, and defines how to handle trailing slashes (`/`) in URLs with `trailingSlashRedirect`.
-   **`DaemonConfig`**: Manages settings required when running as a background daemon. It can define command scripts for the daemon to execute via `commandExecutor` or configure tasks to run at specific intervals via `polling` settings.
-   **`ShellConfig`**: Manages settings required when running as an interactive shell (CLI). It includes settings related to the user interface, such as `greetings` for the startup message, `prompt` for the prompt appearance, and `historyFile` for the command history file location.
-   **`EmbedConfig`**: Manages settings when running embedded within another Java application. Similar to `WebConfig` and `DaemonConfig`, it supports session management (`sessionConfig`) even in an embedded environment.

### `SessionConfig` / `SchedulerConfig` (Classes)

Contain detailed settings for specific functional modules such as sessions and schedulers.

**Key Responsibilities:**
-   **`SessionConfig`**: Defines HTTP session management in detail. It allows setting `timeout` (session expiration time) and `maxSessions` (maximum number of sessions), and provides an option to persist sessions to files via `FileBasedSessionStoreConfig`.
-   **`SchedulerConfig`**: Defines the behavior of the scheduler. It allows setting `startDelaySeconds` (delay before scheduler execution after service start) and `waitOnShutdown` (whether to wait for ongoing tasks on shutdown).

## 3. Package Summary and Architectural Significance

The `com.aspectran.core.context.config` package forms the foundation of Aspectran's flexible and powerful configuration management capabilities. By abstracting all configurations into type-safe Java objects, it ensures that other components using the configuration do not need to know the specific format of the configuration source (XML, APON, etc.).

In particular, modularizing configurations into multiple classes based on function and environment is a good example of Aspectran's highly extensible architecture. If a new execution environment needs to be added, it can be extended relatively easily by defining a new `*Config` class for that environment and adding it to `AspectranConfig`. This design adheres well to the SOLID principles, where each component focuses solely on its own responsibility.
