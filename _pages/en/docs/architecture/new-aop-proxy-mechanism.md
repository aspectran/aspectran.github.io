---
format: plate solid article
sidebar: toc
title: "Aspectran AOP Proxy Mechanism: `AbstractBeanProxy` and `ProxyActivity`"
subheadline: Architecture
parent_path: /docs
---

## 1. Overview

Aspectran framework's AOP (Aspect-Oriented Programming) proxy mechanism is designed with a focus on **performance optimization** and **flexible context management in asynchronous (`@Async`) execution environments**. At the core of this mechanism are two components: `AbstractBeanProxy` and `ProxyActivity`. This document analyzes the roles and interactions of these two components to explain how the new AOP proxy operates more efficiently and stably.

## 2. Core Component Analysis

### 2.1. `AbstractBeanProxy`: Intelligent AOP Execution Control

`AbstractBeanProxy` is an abstract class that serves as the base for all proxy objects that apply AOP advice. The most important feature of this class is that it eliminates unnecessary overhead through **selective advice application logic**.

-   **Performance Optimization (`isAdvisableMethod`)**: When a method of a proxied bean is called, `AbstractBeanProxy` first checks if the method has the `@Advisable` or `@Async` annotation. If neither annotation is present, it **skips all** complex logic for applying AOP advice (e.g., looking up advice rules, creating contexts) and immediately executes the original method. This fundamentally eliminates unnecessary overhead from numerous internal method calls that do not require advice, significantly improving overall application performance.

-   **Synchronous/Asynchronous Execution Branching**: If the method has an annotation, it branches the execution path as follows:
    -   If the `@Async` annotation is detected, it calls the `invokeAsync()` method for asynchronous execution.
    -   If only the `@Advisable` annotation is present, it calls the `invokeSync()` method for synchronous execution to perform the existing AOP advice logic.

### 2.2. `ProxyActivity`: Lightweight Context for Advice Execution

`ProxyActivity` is a lightweight `Activity` designed for the specific purpose of executing AOP advice. Unlike `WebActivity` or `ShellActivity`, which handle general request-response cycles, it operates very lightly by providing only the minimum functionality required for advice execution.

-   **Two Creation Modes**:
    1.  **Independent Mode (`new ProxyActivity(context)`)**: Created when there is no `Activity` running in the current thread (e.g., when an `@Async` method is called for the first time). This `ProxyActivity` has its own independent `ActivityData` and executes advice in a completely isolated context.
    2.  **Wrapping Mode (`new ProxyActivity(activity)`)**: Created by wrapping an existing `Activity` when an `Activity` already exists in the current thread. The most significant feature of this mode is that it **shares the `ActivityData` of the original `Activity`**. This allows the asynchronous worker thread to read or write request parameters or attributes from the caller thread.

-   **Limited Role**: Most methods unrelated to advice execution, such as `getTranslet()` and `getDeclaredResponse()`, throw `UnsupportedOperationException`, enforcing the clear role of this class. Its core role is to register itself as the `CurrentActivity` in the current thread via the `perform()` method, execute the given logic (advice and original method), and then cleanly remove itself from the thread in the `finally` block.

## 3. Asynchronous (`@Async`) Processing and Context Sharing Mechanism

The advantage of this design is clearly evident in how context is shared in an asynchronous environment. When multiple advice-applied methods are called in a chain within a single asynchronous task, the context (`Activity`) is shared efficiently as follows:

1.  **First `@Async` Method Call**:
    -   The task starts in a new Worker thread by `AsyncTaskExecutor`.
    -   At this point, the Worker thread has no `CurrentActivity`, so `AbstractBeanProxy` **creates a new `ProxyActivity` in independent mode** (hereinafter `PA_1`).

2.  **Context Registration**:
    -   The created `PA_1` is registered as the `CurrentActivity` in the current Worker thread's `ThreadLocal` via its `perform()` method.

3.  **Chained Internal Method Calls**:
    -   If another `@Advisable` method (`methodA`) is called inside the `@Async` method, `AbstractBeanProxy` operates again.
    -   The proxy checks `context.hasCurrentActivity()` and receives `true` because `PA_1` is already registered in the thread.
    -   Therefore, it **reuses the existing `PA_1` instance without creating a new `Activity`** to execute the advice for `methodA`.
    -   Even if `methodA` calls another advice-applied method later, the `PA_1` context continues to be shared as long as it runs in that Worker thread.

4.  **Context Cleanup**:
    -   When the execution of the initial `@Async` method is complete, the `finally` block of `PA_1.perform()` executes, safely removing the `CurrentActivity` from the thread's `ThreadLocal`.

Thanks to this mechanism, a single logical asynchronous task unit **shares a single `ProxyActivity` instance**, allowing it to maintain a consistent context while preventing unnecessary context object creation.

## 4. Expected Effects and Conclusion

The new AOP proxy mechanism offers the following clear advantages:

-   **Performance Improvement**: Eliminates the overhead of unnecessary method calls that do not require advice, improving overall system performance.
-   **Flexible Context Management**: With `ProxyActivity`'s independent and wrapping modes, flexible and stable context management is possible in both synchronous and asynchronous environments.
-   **Code Clarity**: Through `@Advisable` and `@Async` annotations, developers can clearly express which methods are subject to AOP.

In conclusion, Aspectran has further evolved into a lighter, faster, and modern AOP framework that perfectly supports complex asynchronous environments through `AbstractBeanProxy` and `ProxyActivity`.
