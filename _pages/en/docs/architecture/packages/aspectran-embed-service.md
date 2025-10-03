---
title: In-Depth Analysis of the `com.aspectran.embed.service` Package
subheadline: Architecture - Package Deep Dive
---

## 1. Design Goals and Key Roles

This package is designed to allow Aspectran to be **easily used like a library by embedding it** within other Java applications. The design goals of this package are as follows:

-   **Provide a Developer-Friendly Facade**: Provides a simple and intuitive high-level API that allows the use of Aspectran's core features without directly dealing with the complex lifecycle or detailed configurations of `CoreService`.
-   **Easy Bootstrapping**: Enables setting up and starting an Aspectran instance with a single line of code through the static factory method `EmbeddedAspectran.run(...)`.
-   **Use Case-Oriented API Design**: The API is structured around the most commonly needed functionalities when embedding Aspectran, such as translet execution (`translate`), template rendering (`render`), code block execution within the context (`execute`), and bean lookup (`getBean`).
-   **Application of the Facade Pattern**: A classic example of the Facade Pattern, which wraps a complex internal service (`DefaultCoreService`) and exposes a simple interface (`EmbeddedAspectran`) to the outside.

In conclusion, this package aims to provide the most ideal entry point for **developers who want to use Aspectran as part of a larger application**, rather than as the main container for the entire application.

## 2. Detailed Analysis of Key Classes and Interfaces

### `EmbeddedAspectran` (Interface)

The core entry point for interacting with Aspectran in embedded mode. It does not directly inherit `CoreService`, but instead acts as a simplified facade that internally wraps a `CoreService` instance.

**Key Responsibilities:**
-   Provides simple lifecycle methods (`run`, `release`) to start and stop Aspectran.
-   Exposes core functionalities frequently used in embedded environments (e.g., `translate`, `render`, `execute`, `getBean`) with intuitive method names.

**Key Method Analysis:**
-   `run(...)` (Static Factory Method): **The primary way to start an embedded Aspectran instance**. It takes various configuration sources (file paths, `File` objects, `Reader`, etc.) as arguments and handles the entire process of creating and starting the `DefaultEmbeddedAspectran` service in one go.
-   `translate(...)`: Programmatically executes a translet. (Similar to `DaemonService`'s `translate`.)
-   `render(...)`: A convenience method for directly rendering a view by specifying a template ID or source.
-   `execute(InstantAction)`: Executes a given lambda code block within the context managed by Aspectran. This allows access to beans or utilization of other Aspectran features within the code block.
-   `release()`: Safely shuts down the embedded Aspectran instance.

### `DefaultEmbeddedAspectran` (Implementation Class)

The final implementation of the `EmbeddedAspectran` interface. The core design of this class is that it **directly inherits `DefaultCoreService`** while exposing only the simpler `EmbeddedAspectran` interface to the outside.

**Key Responsibilities:**
-   Internally possesses all the functionalities of a complete `CoreService`, but exposes only a selected, simpler API to the outside.
-   Implements the actual logic for convenience methods defined in the `EmbeddedAspectran` interface, such as `translate`, `render`, and `execute`.

**Key Method Analysis:**
-   `translate(...)`: Very similar to the `DaemonService` implementation, it creates an `AspectranActivity` and executes it through the entire processing pipeline.
-   `render(...)` / `execute(...)`: These methods are implemented internally using a lightweight, one-time `Activity` called **`InstantActivity`**. `InstantActivity` inherits existing context information and is optimized for performing short tasks like template rendering or code execution.

## 3. Interaction with Other Packages

-   **`com.aspectran.core.service`**: `DefaultEmbeddedAspectran` internalizes all the functionalities of `DefaultCoreService` but hides them behind the `EmbeddedAspectran` interface facade.
-   **`com.aspectran.embed.activity`**: Used to create an `AspectranActivity` each time the `translate()` method is called.
-   **`com.aspectran.core.activity`**: Uses `InstantActivity` for the internal implementation of convenience methods like `render()` and `execute()`.

## 4. Package Summary and Architectural Significance

The `com.aspectran.embed.service` package is a textbook example of the **Facade Design Pattern**. This package standardizes access to Aspectran's powerful but potentially complex `CoreService` subsystem through a very simple and clear `EmbeddedAspectran` interface.

The `EmbeddedAspectran.run(...)` static method drastically simplifies the bootstrapping process, significantly lowering the entry barrier for new users adopting Aspectran. Furthermore, the provided APIs like `translate`, `render`, and `execute` are designed around the **most common use cases** for embedding Aspectran, making them very practical.

Thanks to this "simple interface, powerful internal" design, developers can easily integrate all of Aspectran's features, such as AOP, DI, and scheduling, into their applications without needing a deep understanding of Aspectran's internal workings.
