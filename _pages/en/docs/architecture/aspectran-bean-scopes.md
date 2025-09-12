---
format: plate solid article
sidebar: toc-left
title: In-Depth Analysis of Bean Scopes in Aspectran
headline:
teaser:
---

Aspectran's IoC container supports the concept of **Scope**, which specifies the range for managing the lifecycle of a Bean. The scope determines when a bean instance is created, how long it is maintained, and how it is destroyed. It provides four standard scopes defined in the `com.aspectran.core.context.rule.type.ScopeType` enum class.

## 1. `SINGLETON`

-   **Definition**: **Only one instance is created within the `ActivityContext` for a single bean definition.** It is created when the container is initialized, and all subsequent requests for that bean will share this unique instance.
-   **Lifecycle**: It is maintained from the start to the end of the `ActivityContext`.
-   **Internal Behavior**: `BeanRegistry` stores the instance of a singleton bean in an internal cache (usually a `Map`). When a bean request comes in, it first looks for the bean with the corresponding ID in the cache. If it exists, it is returned immediately. If it does not exist, a new one is created, registered in the cache, and then returned.
-   **Primary Use Case**: Suitable for components that should be shared regardless of the thread, such as stateless service objects, DAOs, and configuration classes.
-   **Caution**: Since it is accessed by multiple threads simultaneously, if it has a mutable state, thread-safety must be ensured through synchronization.
-   **Configuration Alias**: `singleton`

## 2. `PROTOTYPE`

-   **Definition**: **A new instance is created each time a bean is requested.** Unlike a singleton, no instance is shared at all.
-   **Lifecycle**: The container is only involved in the creation and dependency injection of a prototype bean. Once the bean is created and delivered to the client code, **it is out of the container's management.** That is, the destruction of the created instance is handled by the garbage collector (GC), and destruction-related callback methods like `@Destroy` are not called.
-   **Internal Behavior**: When `BeanRegistry` receives a request for a prototype-scoped bean, it creates a new object via the `new` keyword based on the information defined in the `BeanRule`, injects dependencies, and returns it. There is no caching process.
-   **Primary Use Case**: Suitable for stateful objects. It is used when an independent state needs to be maintained for each request.
-   **Caution**: Since a new object is created each time, it can cause more overhead than a singleton.
-   **Configuration Alias**: `prototype`

## 3. `REQUEST`

-   **Definition**: **Creates a single instance that is valid only for the lifecycle of a single request.** The same instance is always returned within the same request, but a new instance is created for a different request.
-   **Lifecycle**: It is created when a request starts and destroyed when that request ends.
-   **Internal Behavior**: This scope is only valid in an environment that supports `RequestAdapter`. When an `Activity` starts, it stores the scoped bean in the internal storage of the `RequestAdapter` (usually a `Map`). If the bean is requested again within the same request, it is retrieved from this storage and returned. When the request processing is finished and the `Activity` is destroyed, the destruction callbacks of all request-scoped beans stored in the `RequestAdapter` are called.
-   **Environmental Constraint**: It is only meaningful in a web environment where a `RequestAdapter` exists, such as `WebActivity` or `TowActivity`. Attempting to use this scope in an environment like `ShellActivity` or `DaemonActivity` will result in an `UnsupportedBeanScopeException`.
-   **Primary Use Case**: Suitable for objects that handle data related to an HTTP request (e.g., request parameters, user authentication information).
-   **Configuration Alias**: `request`

## 4. `SESSION`

-   **Definition**: **Creates a single instance that is valid within a single user session.** The same instance is always returned within the same session, but a new instance is created for a different session.
-   **Lifecycle**: It is created when a session first starts and destroyed when that session is invalidated.
-   **Internal Behavior**: This scope is only valid in an environment that supports `SessionAdapter`. `SessionAdapter` internally wraps `HttpSession` or Aspectran's own `SessionManager`, and session-scoped beans are stored as attributes of this session. When the session is destroyed, the destruction callbacks of all session-scoped beans stored in the session are called.
-   **Environmental Constraint**: It is only meaningful in an environment where a `SessionAdapter` exists, such as when the session feature is enabled in `WebActivity` or `ShellService`. Using it in an environment without session functionality will result in an `UnsupportedBeanScopeException`.
-   **Primary Use Case**: Suitable for objects that manage data that needs to be maintained per user (e.g., login information, shopping cart).
-   **Configuration Alias**: `session`

## 5. Summary

| Scope | Description | Lifecycle | Managed By | Primary Use Case | Environmental Constraint |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`SINGLETON`** | Unique instance in the context | Entire application | `BeanRegistry` | Stateless services, DAOs | None |
| **`PROTOTYPE`** | New instance per request | Managed by GC | `BeanRegistry` (creation only) | Stateful objects | None |
| **`REQUEST`** | New instance per request | Single HTTP request | `RequestAdapter` | Request-related data handling | `RequestAdapter` required |
| **`SESSION`** | New instance per session | Single user session | `SessionAdapter` | User-specific data management | `SessionAdapter` required |