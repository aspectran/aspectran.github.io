---
format: plate solid article
sidebar: toc
title: "SiblingClassLoader: The Key to Dynamic and Flexible Class Loading"
subheadline: Architecture
parent_path: /docs
---

The Aspectran framework uses its own proprietary `com.aspectran.core.context.loader.SiblingClassLoader`, which goes beyond Java's standard class loading mechanism. It is specially designed to provide advanced features such as dynamic reloading (Hot Reloading) and a modular application structure, going beyond simple class loading.

## 1. The Limitation of the Standard ClassLoader: The Parent-First Delegation Model

A typical Java ClassLoader (e.g., `URLClassLoader`) follows the **"Parent-First Delegation Model"**. The way this model works is as follows:

1.  When a class loading request comes in, the classloader first delegates the request to its parent classloader before attempting to find the class itself.
2.  This delegation continues up to the top of the hierarchy, the Bootstrap ClassLoader.
3.  Only if the parent classloader fails to find the class does the child classloader finally begin to search for the class in its own path.

While this approach is stable, ensuring that core classes like `java.lang.Object` are loaded only once, it has clear limitations in a dynamic environment:

-   **Inability to Replace Classes**: Once a class is loaded by a parent classloader (e.g., the application classloader), a child classloader can never reload that class, even if it has a new version of the class file. This is because the version loaded by the parent always takes precedence. This fundamentally makes dynamic reloading (Hot Reloading) impossible.

## 2. Aspectran's Solution: The "Sibling-First" Delegation Model

`SiblingClassLoader` adopts a strategy that is closer to **"Sibling-First"** or **"Child-First"** by inverting the delegation model to solve this problem. The `loadClass()` method works as follows:

1.  **Search Self and Siblings First**: When a class loading request comes in, it first searches for the class in the resource paths managed by itself and all its connected "sibling" `SiblingClassLoader`s before delegating to the parent.
2.  **Delegate to Parent as a Last Resort**: Only if the class is not found within the resources of itself and its siblings does it delegate the loading to the parent of the top-level `root` loader (usually the application's default classloader).

Thanks to this unique approach, multiple `SiblingClassLoader` instances, each responsible for different directories or JAR files, can share each other's classes and act as if they are one giant virtual classloader. This enables dependency management between modules and flexible resource sharing.

## 3. Key Features and Mechanisms of SiblingClassLoader

### a. Dynamic Hot Reloading

The most powerful feature of `SiblingClassLoader` is the ability to **reload application components or classes without a JVM restart** through the `reload()` method.

-   **Internal Workings**: When `reload()` is called, `SiblingClassLoader` does not simply re-read the class. Instead, it **discards the entire existing group of `SiblingClassLoader` instances and creates a new group of `SiblingClassLoader` instances**. As the classloader that loaded the old class becomes a target for Garbage Collection (GC), all the classes loaded by that classloader can also be released from memory. After that, the new classloader reloads the modified class files.
-   **Usage**: It is used to immediately check changes after code modification during development without a server restart, or to update a specific module (plugin) on a running server without downtime.

### b. Hierarchical Sibling Structure

`SiblingClassLoader` does not have a single structure, but a hierarchical one composed of a `root` loader and several `siblings` belonging to it. This structure allows for the systematic management of multiple resource locations (e.g., the `classes` folders or `jar` files of different modules) by grouping them into a single logical group.

### c. Selective Class Exclusion Feature

You can explicitly exclude specific packages or classes from being loaded by `SiblingClassLoader` through the `excludePackage()` and `excludeClass()` methods. This is a very important safety feature that prevents serious problems that can arise from classloader isolation.

-   **Problem Scenario**: If a library commonly used by multiple modules (e.g., `slf4j-api.jar`) is not excluded, each module's `SiblingClassLoader` might load its own version of the `org.slf4j.Logger` class. In this case, although the class names are the same, they are recognized by the JVM as completely different classes because they were loaded by different classloaders. As a result, a `ClassCastException` will occur when passing a `Logger` object created in one module to another.
-   **Solution**: By excluding common libraries like `excludePackage("org.slf4j")`, class loading requests for that package are always delegated to the parent classloader. This ensures that the classes of that library are unique throughout the application, preventing class conflicts.

## 4. Conclusion

`SiblingClassLoader` is a key technology that supports the flexibility and extensibility of the Aspectran framework. By overcoming the limitations of the standard class loading model and providing **modularity, dynamic updates, and development convenience**, it effectively supports complex and modern application architectures.
