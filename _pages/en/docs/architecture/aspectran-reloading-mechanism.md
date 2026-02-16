---
title: "In-Depth Analysis of the Aspectran Auto-Reloading Mechanism"
subheadline: "Architecture & Mechanisms"
---

## 1. Overview

Aspectran's auto-reloading (Hot-Reloading) feature is a powerful mechanism that allows dynamic application of configuration changes during application runtime without restarting the JVM. The main purposes of this feature are as follows:

-   **Improved Development Productivity**: Shortens the development cycle by allowing immediate verification of changes after modifying code or configurations during development, without the time-consuming server restart.
-   **Dynamic Updates in Production**: Enables the application of configuration changes (e.g., toggling feature flags, updating data source information) on a running server without downtime.

The core of this mechanism works by detecting file changes and then destroying and rebuilding the `ActivityContext`, the heart of an Aspectran application, from scratch.

## 2. Core Components

The auto-reloading feature is implemented through the organic interaction of the following core classes:

-   **`ContextReloadingTimer`**: A timer class that internally uses a `ScheduledExecutorService` to schedule and execute the reloading task at a configured interval.
-   **`ContextReloadingTask`**: A `Runnable` implementation that performs the actual task of monitoring for file changes. It records the `lastModified` timestamp of each configuration file and periodically checks if it has changed from the previously stored value.
-   **`ActivityContextBuilder`**: The component responsible for creating and starting the `ContextReloadingTimer` at the final stage of the context build process if the `autoReload` setting is enabled.
-   **`ServiceLifeCycle`**: The interface that `ContextReloadingTask` calls to trigger an application restart when a change is detected.

## 3. Operational Flow

Auto-reloading is performed through the following clear steps:

1.  **Configuration and Activation**: A developer enables the feature by adding the `autoReload` setting to the `context` section of the `aspectran-config.apon` file.
    ```apon
    context: {
        autoReload: {
            enabled: true
            scanIntervalSeconds: 5
        }
    }
    ```
2.  **Initialization and Monitoring Start**: At the final stage of the context build process, if the `autoReload` setting is `true`, `ActivityContextBuilder` starts the `ContextReloadingTimer`. At this time, all configuration files referenced during the build process and resources specified in `<resourceLocations>` are registered as monitoring targets.
3.  **Change Monitoring**: `ContextReloadingTask` checks the `lastModified` timestamp of the registered files at the interval specified by `scanIntervalSeconds` (e.g., every 5 seconds).
4.  **Change Detection and Restart Trigger**: The reloading logic is designed to be safe against incomplete file updates (e.g., when copying multiple files). A restart is triggered only after a "quiet period" with no detected changes has passed.
    - When a file change is first detected, the task simply notes the change and waits for the next scan.
    - If the next scan reveals no further changes, it means a quiet period equivalent to `scanIntervalSeconds` has passed. The task then calls the `restart()` method of the `ServiceLifeCycle` instance.
    - If changes are detected continuously in every scan, the restart is deferred until a scan completes with no new changes.
5.  **Restart Execution**: The service that receives the `restart()` call destroys the existing `ActivityContext` and re-executes the context build process from the beginning. In this process, a new `ActivityContext` with the changed settings applied is created and reflected in the application.

## 4. Hierarchical Services and Reloading

Aspectran supports a hierarchical structure where multiple services can have parent-child relationships. The auto-reloading mechanism operates as follows to maintain stability and consistency in this structure:

-   **Distributed Monitoring, Centralized Execution**: Each sub-service can have its own `autoReload` settings, which leads to the creation of an independent `ContextReloadingTimer` that monitors only the resources belonging to it. However, regardless of which sub-service's timer detects a change, the actual `restart()` command is always passed to the **`RootService`**.
-   **Ensuring Safety**: This 'centralized execution' approach is guaranteed by the logic within `AbstractActivityContextBuilder`.
    ```java
    // The restart command must be delivered to the root service to safely reload the entire application.
    contextReloadingTimer = new ContextReloadingTimer(masterService.getRootService().getServiceLifeCycle());
    ```
    By concentrating all restart requests to the root service, the `Assert.state(isRootService(), ...)` constraint defined in `AbstractServiceLifeCycle` is naturally satisfied. This is a safe design that prevents the complex state inconsistency problems that can arise from partial reloads and ensures the consistency of the entire application.

## 5. SiblingClassLoader and Reloading

Auto-reloading is closely related to Aspectran's proprietary `SiblingClassLoader` to reflect class-level changes.

-   **`hardReload` Mode**: If the `reloadMode="hard"` option is given in the `autoReload` setting, the restart process discards the entire existing `SiblingClassLoader` group and creates a new instance. This allows new classes to be loaded when JAR files specified in `<resourceLocations>` are changed.
-   **Fundamental Limitation**: This mechanism only applies to classes loaded by `SiblingClassLoader`. Classes loaded by the application's main classloader (the parent classloader), such as framework core classes or application bootstrap-related classes, cannot be reloaded without a JVM restart.

## 6. Constraints and Practical Use

While the auto-reloading feature is very powerful, it is important to understand and use it with the following characteristics and constraints in mind:

-   **In-Memory State Loss**: Reloading is a process that destroys and recreates the entire `ActivityContext`, so all in-memory states, such as instance variables of singleton beans, are reset.
-   **Brief Downtime**: The service may be unable to process requests for the short period during which the context is restarting.
-   **IDE Constraint**: When running in an IDE, `<resourceLocations>` settings may be ignored to avoid class loading conflicts. Therefore, detecting JAR file changes is mainly relevant in actual deployment environments.
-   **Recommended Deployment Strategy**: An effective strategy is to separate the build/deployment units of the root application and sub-services, and then update by copying the changed sub-service JAR files to the directory specified by `<resourceLocations>`.

## 7. Advanced Topics: Partial Restarts and Comparison with Other Frameworks

### a. The Complexity of Restarting Intermediate Services

While Aspectran supports a hierarchical service structure, the auto-reloading mechanism is intentionally centralized to restart the entire root service. This is by design, as independently restarting only an intermediate sub-service carries the following potential risks:

-   **State Inconsistency**: The consistency of shared resources or states between the restarting sub-service and the continuously running parent/sibling services could be broken.
-   **Broken Dependencies**: If other components in the parent context were referencing a bean from the restarting sub-service, they could temporarily enter a state where dependencies cannot be resolved.
-   **Difficulty in Handling Ongoing Tasks**: Safely completing or rolling back transactions or asynchronous tasks that the service was processing at the time of restart is a very complex problem.

Therefore, instead of the complexity of partial restarts, Aspectran has adopted a method that ensures a predictable and stable state by rebuilding the entire context.

### b. Comparison with Other Frameworks

Dynamic reloading is a challenge for all frameworks, and they approach it in various ways.

-   **OSGi**: A technical specification for managing the independent lifecycle of modules (bundles), which allows for true 'partial restarts'. However, it is not widely used due to its high complexity.
-   **Spring Boot DevTools**: Uses an approach very similar to Aspectran's, quickly restarting the entire application context when a change is detected. This is a 'fast full restart' rather than a partial restart, and it is a pragmatic approach adopted by most modern frameworks.
-   **Microservices Architecture (MSA)**: Solves the problem at the architectural level rather than the framework level. Each service is separated into an independent process, allowing it to be restarted individually without affecting other services.
-   **JRebel**: Goes beyond simple class hot-swapping. Through framework-aware plugins, it re-creates only the beans associated with the changed class within the container (e.g., Spring `ApplicationContext`) and re-injects dependencies. This is a very powerful commercial tool that requires deep integration with the framework.

### c. The Trade-off between Performance and Flexibility

If a framework were designed from the ground up to be perfectly dynamically swappable like JRebel, it would likely suffer a runtime performance penalty. This is because dynamic swapping requires layers of indirection like proxies for all component calls, hinders JIT compiler optimizations, and increases the use of reflection.

Most mainstream frameworks, including Aspectran, are optimized under the premise that 'once built, it rarely changes'. They are designed to perform heavy optimization tasks at startup and then operate on the fastest path at runtime. This is a rational design choice that prioritizes 'stable runtime performance' over 'dynamic flexibility'.

## 8. Conclusion

Aspectran's auto-reloading mechanism is a powerful feature that improves development productivity and enables dynamic updates. It notably adopts a centralized 'full root service restart' model for safety and predictability, avoiding the complexities of partial reloads. Developers should leverage the benefits of this mechanism while being aware of its characteristics, such as state loss and brief downtime, to apply it appropriately to their scenarios.
