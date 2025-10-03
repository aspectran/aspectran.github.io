---
title: In-Depth Analysis of Aspectran Configuration Rule Architecture
subheadline: Architecture
---

Aspectran's `com.aspectran.core.context.rule` package is a collection of Java objects representing all of the framework's **configuration information**. Configuration files in XML or APON format are converted into these `Rule` objects by a parser (`NodeletParser`) and loaded into memory. In essence, these are pure data objects (POJOs) that serve as the **Blueprint** of the application.

## 1. Core Component Rules (Top-Level Rules)

These rules define the most important top-level components of the application.

-   **`TransletRule`**: Defines a 'translet', the basic unit of request processing. It acts as a **container** for all rules related to a single request-response cycle, including what requests (`name`, `method`) to respond to, how to process the request (`RequestRule`), what business logic (Action) to execute (`ContentList`), how to respond (`ResponseRule`), and how to handle exceptions (`ExceptionRule`).
-   **`BeanRule`**: Defines a 'bean' to be managed by the IoC container. It contains all the information needed to create and manage a single bean, such as its ID, class, scope (`ScopeType`), constructor arguments (`arguments`), properties (`properties`), and lifecycle methods (`initMethod`, `destroyMethod`).
-   **`AspectRule`**: Defines an 'aspect' for AOP (Aspect-Oriented Programming). It includes a `JoinpointRule` that defines where to intervene (Joinpoint) and `AdviceRule`s that define the logic to be executed at each point (Before, After, Around, etc.).
-   **`ScheduleRule`**: Defines a scheduling task. It defines which Scheduler to use, when to execute (`Trigger`), and what tasks (`ScheduledJobRule`) to perform.
-   **`TemplateRule`**: Defines a view template to be used when generating a response. It includes the template's ID, the `engine` to use, the location (`file`, `resource`, `url`) or content (`content`) of the template file.

## 2. Action & Response Rules

These rules define the actual logic to be executed and the response method within a `TransletRule` or `AdviceRule`. They play a key role in the `Activity`'s processing pipeline.

### 2.1. Action Rules

Action rules define commands that perform actual business logic or control data flow.

-   **`InvokeActionRule`**: The most core action, it calls a specific method of a designated bean.
-   **`IncludeActionRule`**: Executes another translet and includes it at the current location. Very useful for modularizing and reusing common logic.
-   **`EchoActionRule`**: Creates `ActionResult` from the current context's data and includes it in the result. Mainly used to construct model data to be passed to a view template.
-   **`HeaderActionRule`**: Sets HTTP response headers. Only meaningful in a web environment.
-   **`ChooseRule`**: Branches the execution flow based on conditions. It contains one or more `<when>` and an optional `<otherwise>`.

### 2.2. Response Rules

Response rules determine how the `Activity`'s processing result is returned to the client.

-   **`TransformRule`**: Transforms the result of an Action into a specific data format and responds. This is the core of REST API implementation.
-   **`DispatchRule`**: Forwards the processing result to a view template to render the UI. This corresponds to the View in the MVC pattern.
-   **`ForwardRule`**: Forwards the current request to another translet internally on the server. The client's URL does not change, and the request and response objects are preserved.
-   **`RedirectRule`**: Sends an HTTP redirect (3xx status code) response to the client, instructing it to re-request a specified URL.

## 3. Data & Parameter Rules

These rules define and handle the most basic units of configuration: 'values'.

-   **`ItemRule`**: The basic unit for all parameters, attributes, arguments, and properties. It has a `name` and `value`, and can define the type of value (`ItemType`: `SINGLE`, `ARRAY`, `LIST`, `MAP`, etc.) and how the value is interpreted (`ItemValueType`: `STRING`, `INT`, `BEAN`, etc.). This supports type conversion.
-   **`ItemRuleMap` / `ItemRuleList`**: Collections of `ItemRule`s, managing multiple parameters or attributes as a group.

## 4. Structural & Helper Rules

These rules define the structure of the configuration and additional functionalities.

-   **`AppendRule`**: Instructs to import an external configuration file (XML, APON) and merge it into the current configuration. This is a powerful feature that allows for managing configurations by separating them by function or module.
-   **`EnvironmentRule`**: Defines properties that will only be applied when a specific `profile` is active. (e.g., separating development/production DB information)
-   **`ExceptionRule`**: Groups exception handling logic and defines how to handle specific exceptions (`ExceptionThrownRule`) when they occur.
-   **`DescriptionRule`**: Adds a description to each rule to improve the readability of the configuration.

## 5. Ability Interfaces: Key to Composable Design

The interfaces in the `com.aspectran.core.context.rule.ability` package are a core design that demonstrates why Aspectran's `Rule` architecture is flexible and extensible. These interfaces act as a **Contract** that specifies what kind of child rules each `Rule` class can have.

-   **`HasActionRules`**: Rules implementing this interface (`TransletRule`, `AdviceRule`, etc.) can contain action rules like `InvokeActionRule`, `EchoActionRule`.
-   **`HasResponseRules`**: Rules implementing this interface (`TransletRule`, `ExceptionThrownRule`, etc.) can contain response rules like `TransformRule`, `DispatchRule`.
-   **`HasParameters`, `HasAttributes`, `HasProperties`, `HasArguments`**: Indicate that they can have parameters, attributes, properties, and arguments (`ItemRule`) as children, respectively.
-   **`BeanReferenceable`**: A marker interface indicating that the rule can reference other 'beans'. It is used by `BeanReferenceInspector` during context loading to verify that all bean references are valid.
-   **`Replicable`**: Indicates that it can replicate itself through the `replicate()` method. For thread safety, Aspectran keeps the original rules loaded as they are and uses replicated versions of these rules during actual request processing.

This 'Ability' interface-based design utilizes the **Composite Pattern**, allowing features to be assembled like Lego blocks. This gives the framework a very flexible and easy-to-extend structure.

## 6. Conclusion

Aspectran's `rule` package expresses all of the framework's configuration through a **hierarchical and Composable object model**. Each `*Rule.java` file is a data object that corresponds one-to-one to a specific tag or attribute in the configuration file, and their combination defines the structure and behavior of complex applications.

This design has the following advantages:

-   **Clarity**: The XML tag structure maps directly to the Java object structure, making it easy to understand the configuration through code.
-   **Type Safety**: All configurations are converted into type-safe objects, making it easy to validate configuration errors at load time.
-   **Flexibility and Extensibility**: The `ability` interfaces and composite pattern make it easy to add new types of rules or extend existing ones.
-   **Separation of Execution and Definition**: `Rule` objects only 'define' behavior; the actual 'execution' is handled by runtime engines like `Activity` reading these rules. This clearly separates the framework's core logic from user configurations.
