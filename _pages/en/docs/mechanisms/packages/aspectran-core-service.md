---
title: In-Depth Analysis of the `com.aspectran.core.service` Package
subheadline: Architecture - Package Deep Dive
---

## 1. Design Goals and Key Roles

This package defines the **most core foundation of Aspectran framework's service layer**. The design goals of this package are as follows:

-   **Consistent Lifecycle Management**: Provides a standardized lifecycle contract for predictably and stably managing application state changes such as start, stop, restart, and pause.
-   **Hierarchical Service Structure**: Supports a hierarchical structure where services can have parent-child relationships, ensuring that the lifecycle of a parent service propagates to its child services. This is essential for consistently managing the state of the entire application.
-   **Providing a Central Access Point**: Defines `CoreService`, the sole gateway to access `ActivityContext`, which contains all core components of the framework (beans, translets, aspects, etc.).
-   **Laying the Foundation for Diverse Execution Environment Support**: Provides an extensible foundation for implementing services specialized for various execution environments (web, daemon, shell, etc.) by inheriting from `CoreService`.

The **Template Method Pattern** is applied to `AbstractServiceLifeCycle` and `AbstractCoreService` to provide a template for lifecycle management logic, and the **Service Locator Pattern** is implemented through `CoreServiceHolder`.

## 2. Detailed Analysis of Key Classes and Interfaces

### `ServiceLifeCycle` (Interface)

The top-level interface that all service components with a lifecycle in Aspectran must implement.

**Key Responsibilities:**
-   Defines standard methods (`start`, `stop`, `restart`, `pause`, `resume`) to control the state of a service.
-   Provides methods (`getParentService`, `addService`) to form a hierarchical structure between services, allowing a parent service to manage the lifecycle of its child services.
-   Defines functions to query the current active state (`isActive`) and paused state (`isPaused`) of a service.

**Key Method Analysis:**
-   `start()`: Starts the service and makes it active. Throws an exception if already started.
-   `stop()`: Stops the service and releases all associated resources.
-   `restart()`: Restarts the service. Internally, it is equivalent to calling `stop()` then `start()`.
-   `addService(ServiceLifeCycle service)`: Adds another service as a child of the current service. The added child service is controlled along with the parent service's lifecycle.

### `AbstractServiceLifeCycle` (Abstract Class)

An abstract class that pre-implements the core logic of the `ServiceLifeCycle` interface. It helps subclasses easily implement common lifecycle management logic.

**Key Responsibilities:**
-   Manages the service's state (`active`, `paused`) with `volatile` variables to ensure visibility in a multi-threaded environment.
-   Manages child services through the `subServices` list and synchronizes the state of child services when its own lifecycle state changes.
-   Implements the observer pattern to notify external parties of service state change events through `ServiceStateListener`.
-   Ensures that lifecycle change methods operate in a thread-safe manner using the `synchronized` keyword.

**Key Method Analysis:**
-   `start()`: After checking the service's state within a `synchronized` block, it calls the `doStart()` abstract method, which must implement the concrete start logic in subclasses. Then, it sequentially calls `start()` for all child services.
-   `stop()`: Similar in structure to `start()`, it calls the `doStop()` abstract method to release resources and stop all child services.
-   `doStart()`, `doStop()`, `doPause()`, `doResume()`: Template methods where subclasses must implement the actual logic.

### `CoreService` (Interface)

The core service interface representing the **actual body** of an Aspectran application.

**Key Responsibilities:**
-   Provides access (`getActivityContext()`) to the `ActivityContext` where all framework components are registered. This acts as a gateway to access all of Aspectran's features.
-   Defines the `isDerived()` method to check whether it is a derived service dependent on another `CoreService`.
-   Provides access to the application's default adapter, `ApplicationAdapter`.

### `DefaultCoreService` (Implementation Class)

The final implementation of `CoreService`, acting as the **Bootstrapper** for an Aspectran application.

**Key Responsibilities:**
-   Receives an `AspectranConfig` configuration object, creates an `ActivityContextBuilder`, and is responsible for the entire bootstrap process of building and initializing the `ActivityContext` through it.
-   Manages the lifecycle of `SchedulerService`. When `CoreService` starts/stops, `SchedulerService` also starts/stops along with it.
-   Provides a feature to ensure that only one Aspectran instance is running by creating a lock file in a specific path via `FileLocker`.
-   Registers a JVM Shutdown Hook to ensure that the `stop()` method is called when the application terminates unexpectedly, safely releasing resources.

**Key Method Analysis:**
-   `DefaultCoreService(AspectranConfig aspectranConfig)`: In the constructor, it receives `AspectranConfig` to prepare for bootstrapping.
-   `doStart()`: Implements the template method of `AbstractServiceLifeCycle` and contains the actual start logic of Aspectran. Internally, it creates an `ActivityContextBuilder` and calls `builder.build()` to complete the `ActivityContext`. Then, it initializes and starts `SchedulerService`.
-   `service(Activity activity)`: A method implemented in `AbstractCoreService`, serving as the entry point for executing an `Activity`. It sequentially calls `activity.prepare()` and `activity.perform()` to drive the entire processing pipeline of the translet.

### `CoreServiceHolder` (Utility Class)

A **Service Locator** that manages static references to all running `CoreService` instances.

**Key Responsibilities:**
-   Stores and manages `CoreService` instances in `serviceMap` using `ClassLoader` as the key. This is to support environments where multiple contexts with separated classloaders coexist, similar to how multiple web applications operate on a single WAS (Web Application Server).
-   Allows finding the correct `CoreService` and `ActivityContext` based on the current thread's context classloader (`Thread.currentThread().getContextClassLoader()`).

**Key Method Analysis:**
-   `acquire()`: Returns the `CoreService` instance corresponding to the current thread's context classloader. Aspectran's various internal components use this method when they need to access the current execution context.
-   `putService(CoreService coreService)`: Registers a new `CoreService` instance in `serviceMap`.
-   `release(CoreService coreService)`: Removes the instance from `serviceMap` when the service stops.

## 3. Package Summary and Architectural Significance

The `com.aspectran.core.service` package is the core foundation that makes Aspectran not just a simple library, but a **robust service framework with a lifecycle**. It presents a consistent state management model through `ServiceLifeCycle`, provides a central gateway to access all features through `CoreService`, and encapsulates complex initialization processes through `DefaultCoreService`.

In particular, the way `CoreServiceHolder` manages services based on `ClassLoader` is an important design decision that ensures Aspectran operates stably even in complex enterprise environments. By implementing specialized sub-services for each environment (`web`, `daemon`, `shell`, etc.) on top of this robust service layer, Aspectran gains the flexibility and extensibility to support various environments.
