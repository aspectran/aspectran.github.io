---
title: "ActivityContext Build Process: An In-Depth Analysis"
subheadline: "Architecture & Mechanisms"
---

`ActivityContext`, the heart of an Aspectran application, is created through a systematic process by the `ActivityContextBuilder`. This build process is largely divided into four stages: **Configuration, Parsing, Creation, and Initialization**, and the entire process is led by the `com.aspectran.core.context.builder.HybridActivityContextBuilder` class.

## 1. Builder Creation & Configuration

Everything starts with creating an instance of `ActivityContextBuilder`. After the builder is created, the developer provides the core information needed to configure the context through various `setter` methods.

-   **`setBasePath(String basePath)`**: Specifies the root directory of the application. It serves as the base point for relative paths.
-   **`setContextRules(String[] contextRules)`**: Passes the paths of Aspectran's core configuration files (in XML or APON format) as an array. This allows for managing multiple configuration files like modules.
-   **`setBasePackages(String... basePackages)`**: Specifies the packages to be used for annotation-based component scanning. The builder finds annotations like `@Component`, `@Bean`, and `@Aspect` under these packages and automatically generates rules.
-   **`setActiveProfiles(String... activeProfiles)`**: Specifies the application's execution environment profiles (e.g., `dev`, `prod`). Only configurations that match the specified profiles are activated.
-   **`setResourceLocations(String... resourceLocations)`**: Allows for dynamically adding resource paths to be included in the classpath.
-   **`setAponWriter(AponWriter aponWriter)`**: Used for debugging by outputting the parsed rules in APON format.

## 2. Build & Parsing

Once the configuration is complete, the `build()` method is called to start the actual build process. The substantive work of this stage is handled by `com.aspectran.core.context.rule.parser.HybridActivityContextRuleParser`.

1.  **Parser Initialization**: `HybridActivityContextRuleParser` internally creates a core helper object called `RuleParsingContext`. `RuleParsingContext` temporarily stores all parsed rules (`*Rule` objects), sets up relationships between rules, and is ultimately responsible for configuring the registries.

2.  **Rule Parsing**: The parser performs its work based on the configured `contextRules` and `basePackages`.
    *   **File-based Parsing**: It iterates through the configuration files specified in `contextRules` and parses their content using `XmlActivityContextParser` or `AponActivityContextParser` depending on the file extension. The parsed result is converted into a tree of rule objects defined in the `com.aspectran.core.context.rule` package, such as `AspectRule`, `BeanRule`, and `TransletRule`.
    *   **Annotation-based Parsing**: It scans the package paths specified in `basePackages` to find classes annotated with `@Component`, `@Bean`, `@Aspect`, etc. `AnnotatedClassParser` analyzes these classes and creates equivalent `BeanRule` and `AspectRule` objects.

3.  **Rule Registration**: All created `*Rule` objects are added to the appropriate internal collections by `RuleParsingContext`. At this point, the rules are only loaded into memory; no actual instances have been created yet.

## 3. Context Creation

This is the stage where the actual `ActivityContext` instance is created based on the parsed rules.

1.  **`DefaultActivityContext` Creation**: The `createActivityContext()` method creates an instance of `com.aspectran.core.context.DefaultActivityContext`.

2.  **Registry Injection**: `RuleParsingContext` categorizes all the temporarily stored rules and creates final registry objects like `AspectRuleRegistry`, `BeanRuleRegistry`, and `TransletRuleRegistry`, which are then injected into `DefaultActivityContext`.

3.  **Validation**: The validity of the rules is checked to ensure that the context can operate correctly.
    *   **`BeanReferenceInspector`**: It tracks all relationships that reference other beans from `@Autowired` or configuration files and checks for errors such as referencing a non-existent bean or circular references.
    *   **`AspectRuleValidator`**: It verifies whether the AOP rules are valid, for example, whether the bean and method specified by the advice actually exist.

## 4. Initialization & Completion

This is the final stage of activating the created context so that it can be used by the application.

1.  **`ActivityContext.initialize()` Call**: When this method is called, the initialization of the context begins.
    *   **Singleton Bean Instantiation**: All singleton-scoped beans registered in the `BeanRegistry` are actually instantiated. During this process, constructor injection occurs, and dependency injection for fields and methods annotated with `@Autowired` is completed.
    *   **Initialization Callback Execution**: The initialization methods of beans that are annotated with `@Initialize` or implement the `InitializableBean` interface are called.

2.  **Auto-Reloading Activation (Optional)**: If the `autoReload` setting is enabled, `ContextReloadingTimer` is started. This timer monitors the configuration files for changes at a specified interval (`scanInterval`), and if a change is detected, it calls `serviceLifeCycle.restart()` to perform the build process described above from the beginning. This allows for dynamically reflecting configuration changes without restarting the application.

3.  **Context Return**: After all processes are successfully completed, the fully activated `ActivityContext` object is provided as the final return value of the `build()` method.
