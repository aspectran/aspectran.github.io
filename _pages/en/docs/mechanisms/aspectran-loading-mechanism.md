---
title: "Aspectran Configuration Loading Mechanism: In-Depth Analysis of the `nodelet` Engine"
subheadline: Mechanisms
mermaid: true
---

Aspectran parses configuration files in XML or APON (Aspectran Parameters Object Notation) format to create a tree of `*Rule` objects—the blueprints for the application's core components (Beans, Translets, Aspects, etc.). At the heart of this process lies **`nodelet`**, a high-performance event-driven parsing engine specially designed for Aspectran, implemented in the `com.aspectran.utils.nodelet` package.

```text
[XML/APON Configuration Files] ---> [NodeletParser] --uses--> [AspectranNodeletGroup] ---> [*Rule Object Tree] ---> [ActivityContext]
```

## 1. Core Parsing Engine: `com.aspectran.utils.nodelet`

`nodelet` operates on an event-driven basis similar to a standard SAX parser, but is a lightweight parsing framework that maps callbacks directly to specific XPath paths, allowing complex XML documents to be processed much more intuitively and structurally.

#### Key Components:

*   **`NodeletParser`**: The main engine that drives the parsing process. It sequentially reads XML documents, detects the start and end of each node (element), and triggers the appropriate event corresponding to the current path.
*   **`Nodelet` / `EndNodelet`**: Event handler (callback) interfaces.
    *   `Nodelet`: Called when an XML element's **start tag** is encountered. It receives and processes the attribute information of that element as parameters.
    *   `EndNodelet`: Called when an XML element's **end tag** is encountered. It processes the text content (including CDATA) contained within that element.
*   **`NodeletGroup`**: The **core design of the `nodelet` engine**. Manages `Nodelet` and `EndNodelet` bundled together with specific XPath paths in a group. This class provides a Fluent API acting as a kind of DSL (Domain-Specific Language) to declaratively define parsing rules:
    *   `.child("elementName")`: Begins defining rules for a child element of the current path.
    *   `.parent()`: Moves from the current path back to the parent path.
    *   `.nodelet(...)`: Registers a `Nodelet` for the start tag of the current path.
    *   `.endNodelet(...)`: Registers an `EndNodelet` for the end tag of the current path.
    *   `.with(NodeletAdder)`: Adds a reusable rule set to the current group.
    *   `.mount(NodeletGroup)`: Dynamically "mounts" another `NodeletGroup` onto the current path.
*   **`NodeletAdder`**: An interface responsible for adding reusable rule sets to a `NodeletGroup`. Through this, parsing logic for common XML structures (e.g., `<item>`, `<argument>`) can be modularized and reused across multiple places.

#### Innovative `mount` Capability

The `mount` feature of `NodeletGroup` is a key element that makes the `nodelet` engine exceptionally powerful and efficient. When a specific element appears, this feature dynamically activates the rule set of another pre-defined `NodeletGroup`. This provides the following significant advantages:

1.  **Memory Efficiency and Performance Enhancement**: When using `mount`, the parser searches for `Nodelet`s using **relative paths** scoped from the mount point rather than full absolute XPath paths (`a/b/c/...`). Consequently, even in deeply nested structures, the overhead of creating and comparing long XPath strings is eliminated, drastically reducing memory usage and boosting parsing performance.
2.  **Maximizing Rule Reusability**: Complex structures that can recur repeatedly, such as `<choose>/<when>/<otherwise>`, can be defined as an independent `NodeletGroup` (`ChooseNodeletGroup`) and reused anywhere needed with a single line of `.mount()`.
3.  **Removing Nesting Depth Limitations**: Because `mount` effectively resets the parsing context, there is theoretically no limit to the nesting depth of XML elements.

## 2. Aspectran Implementation: `com.aspectran.core.context.rule.parser.xml`

Aspectran uses the `nodelet` engine described above to parse its complex XML configuration files (such as `aspectran-config.xml`) and transforms their contents into a tree of `*Rule` objects.

#### Parsing Flow:

1.  **Initialization of `AspectranNodeParser`**: The starting point of parsing. Internally, it creates a `NodeletParser` and registers `AspectranNodeletGroup`—the master rule group containing all Aspectran XML rules—with the parser. It also configures `AspectranDtdResolver` for DTD validation.

2.  **`AspectranNodeletGroup` and `*NodeletAdder`**:
    *   `AspectranNodeletGroup` is the top-level rule group for the `<aspectran>` root element. This group assembles the complete parsing rules by adding `BeanNodeletAdder`, `AspectNodeletAdder`, `TransletNodeletAdder`, etc., via the `with()` method to process each top-level element such as `<bean>`, `<aspect>`, and `<translet>`.
    *   Each `*NodeletAdder` defines parsing methods in detail for its designated XML element and its child elements using the Fluent API of `NodeletGroup`. For example, `TransletNodeletAdder` defines rules for the `<translet>` element while simultaneously defining rules for child elements that can appear inside it, such as `<request>`, `<response>`, and `<content>`.
    *   In particular, Adders whose names contain 'Inner' or those handling specific elements (argument, property, etc.), such as `ActionInnerNodeletAdder` or `ArgumentNodeletAdder`, are created to parse XML structures commonly shared within multiple different rules (e.g., `<translet>`, `<advice>`, `<bean>`). This maximizes the reusability of parsing logic.

3.  **State Management: `AspectranNodeParsingContext` and `ObjectStack`**:
    *   XML parsing is inherently a stateful operation that must handle parent-child relationships. For example, when parsing an `<action>` element, the parser must know which `<translet>` that action belongs to.
    *   Aspectran solves this problem through `AspectranNodeParsingContext`. This class uses a `ThreadLocal` variable to provide a thread-safe `ArrayStack` (Object Stack).
    *   **Operating Mechanism**:
        1.  When an element's start tag `Nodelet` is called (e.g., `<translet>`), it instantiates a `TransletRule` object to hold that rule and pushes it onto the stack via `AspectranNodeParsingContext.pushObject()`.
        2.  In the `Nodelet` of a child element (e.g., `<request>`), it calls `AspectranNodeParsingContext.peekObject()` to retrieve the parent object (`TransletRule`) at the top of the stack and links itself (`RequestRule`) to the parent.
        3.  When the element's end tag `EndNodelet` is called, it removes the completed object from the stack via `AspectranNodeParsingContext.popObject()`.

## 3. Parsing Process Illustrated with Concrete Examples

#### Example 1: Basic `<translet>` Parsing and Object Stack

Suppose we have the following simple XML configuration:

```xml
<translet name="/example/hello">
    <action bean="helloAction" method="sayHello" />
</translet>
```

The process of parsing this XML proceeds as follows:

1.  **`<translet>` Start Tag**:
    *   `NodeletParser` encounters the `<translet>` start tag.
    *   The `nodelet` defined in `TransletNodeletAdder` is executed.
    *   The `nodelet` reads the `name` attribute value ("/example/hello") and creates a `TransletRule` object.
    *   The created `transletRule` object is pushed onto the Object Stack via `AspectranNodeParsingContext.pushObject()`.
    *   **Object Stack Status**: `[ TransletRule(...) ]`

2.  **`<action>` Start Tag**:
    *   The parser encounters the child node `<action>` start tag.
    *   The `nodelet` of `ActionInnerNodeletAdder` (added by `TransletNodeletAdder` via `.with(ActionInnerNodeletAdder.instance())`) is executed.
    *   The `nodelet` reads the `bean` and `method` attributes and creates an `InvokeActionRule` object.
    *   The created `invokeActionRule` object is pushed onto the stack.
    *   **Object Stack Status**: `[ TransletRule(...), InvokeActionRule(...) ]`

3.  **`</action>` End Tag**:
    *   The parser encounters the `</action>` end tag.
    *   The `endNodelet` of `ActionInnerNodeletAdder` is executed.
    *   `InvokeActionRule invokeActionRule = AspectranNodeParsingContext.popObject()`: Pops `InvokeActionRule` from the stack.
    *   `HasActionRules hasActionRules = AspectranNodeParsingContext.peekObject()`: Inspects the top object of the stack, namely `TransletRule`. (`TransletRule` implements the `HasActionRules` interface.)
    *   `hasActionRules.putActionRule(invokeActionRule)`: Adds `InvokeActionRule` as a child to `TransletRule`.
    *   **Object Stack Status**: `[ TransletRule(...) ]`

4.  **`</translet>` End Tag**:
    *   The parser encounters the `</translet>` end tag.
    *   The `endNodelet` of `TransletNodeletAdder` is executed.
    *   `TransletRule transletRule = AspectranNodeParsingContext.popObject()`: Pops the fully configured `TransletRule` from the stack.
    *   `AspectranNodeParsingContext.getCurrentRuleParsingContext().addTransletRule(transletRule)`: Finally registers the completed rule into `RuleParsingContext`.
    *   **Object Stack Status**: `[ ]` (empty)

#### Example 2: Reusing Complex Hierarchies with the `mount` Capability

Now let's examine the power of the `mount` feature using the nestable `<choose>` element as an example:

```xml
<translet name="/example/conditional">
    <choose>
        <when test="@{param:type == 'A'}">
            <action bean="actionA" />
        </when>
        <otherwise>
            <!-- Another choose can appear here -->
            <action bean="actionB" />
        </otherwise>
    </choose>
</translet>
```

*   `TransletNodeletAdder` adds the `<choose>` rule via `.with(ChooseNodeletAdder.instance())`.
*   `ChooseNodeletAdder` calls `.mount(ChooseNodeletGroup.instance())` when defining rules for `<when>` and `<otherwise>` elements.
*   `ChooseNodeletGroup` is an independent group that defines parsing rules for the `<choose>` element itself.

What this means is:

> When the parser enters inside a `<when>` or `<otherwise>` element, the rules of the mounted `ChooseNodeletGroup` are **dynamically activated**. In other words, even if another `<choose>` element is encountered inside `<when>` and `<otherwise>`, the parser can process the parsing recursively in the exact same manner as the first time.

In this way, the `mount` capability allows parsing rules for complex and recursive XML structures to be defined only once and reused wherever needed, eliminating code duplication and optimizing memory usage.

### Example 3: `<aspect>` Rules and Complex Relationship Setup

Because AOP rules establish complex relationships among multiple components, the parsing process is more multi-layered. Let's look at the following example:

```xml
<aspect id="myAspect" order="1">
    <joinpoint>
        pointcut: {
            type: wildcard
            +: /example/hello@helloAction^say*
        }
    </joinpoint>
    <advice bean="loggingAdvice">
        <before>
            <invoke method="start"/>
        </before>
    </advice>
</aspect>
```

This XML defines an AOP rule to execute the `start()` method of the `loggingAdvice` bean before (`before`) any method starting with `say` in the `helloAction` bean (`joinpoint`) is executed within the Translet named `/example/hello`.

In the pointcut string, the part before the `@` delimiter represents the name of the Translet, the part after it indicates the ID of the Bean, and the part after the `^` delimiter denotes the method name to invoke. Wildcards can be used in each part. If you want to target all Translets without specifying a particular Translet, you must start the pattern with the `@` delimiter (e.g., `+ "@helloAction^say*"`).

1.  **`<aspect>` Start Tag**:
    *   The `nodelet` of `AspectNodeletAdder` is executed.
    *   Reads `id` and `order` attributes, creates an `AspectRule` object, and pushes it onto the stack.
    *   **Object Stack**: `[ AspectRule(...) ]`

2.  **`<joinpoint>` Start and End Tags**:
    *   The `nodelet` for `joinpoint` defined inside `AspectNodeletAdder` is executed, but when APON format is used, the `nodelet` itself does not perform any special action.
    *   The `endNodelet` of `</joinpoint>` is executed.
    *   `endNodelet` receives the entire APON format text inside the `<joinpoint>` element via the `text` parameter.
    *   Through internal logic such as `JoinpointRule.updateJoinpoint(joinpointRule, text)`, it parses the APON text to create `PointcutRule`, etc.
    *   Retrieves `AspectRule` from the stack via `peek()` and sets the completed `joinpointRule`.
    *   **Object Stack**: `[ AspectRule(...) ]`

3.  **`<advice>` Start Tag**:
    *   The `nodelet` for `advice` defined inside `AspectNodeletAdder` is executed.
    *   Reads the `bean` attribute ("loggingAdvice").
    *   Retrieves `AspectRule` via `peek()` and calls `setAdviceBeanId("loggingAdvice")` to designate the bean that will execute the Advice. Nothing is pushed onto the stack at this stage.
    *   **Object Stack**: `[ AspectRule(...) ]`

4.  **`<before>` Start Tag**:
    *   Rules for child nodes of `advice` are handled by `AdviceInnerNodeletAdder`. The `nodelet` for `before` in this Adder is executed.
    *   Retrieves `AspectRule` via `peek()` and calls `newBeforeAdviceRule()` to create an `AdviceRule` object.
    *   Pushes the created `adviceRule` onto the stack.
    *   **Object Stack**: `[ AspectRule(...), AdviceRule(type=BEFORE, ...) ]`

5.  **`<action>` Start and End Tags (inside `<before>`)**:
    *   The `before` rule reuses the rule of `ActionInnerNodeletAdder` (`with(...)`).
    *   The `nodelet` of `<action>` is executed to create `InvokeActionRule` ("profiler.start") and pushes it onto the stack.
    *   **Object Stack**: `[ AspectRule(...), AdviceRule(...), InvokeActionRule(...) ]`
    *   The `endNodelet` of `</action>` is executed.
    *   Pops `InvokeActionRule`, retrieves `AdviceRule` via `peek()`, and adds it as a child via `putActionRule()`.
    *   **Object Stack**: `[ AspectRule(...), AdviceRule(...) ]`

6.  **`</before>` End Tag**:
    *   The `endNodelet` of `before` is executed.
    *   Pops `AdviceRule`. This `AdviceRule` is already linked to the parent `AspectRule`.
    *   **Object Stack**: `[ AspectRule(...) ]`

7.  **`</advice>` End Tag**:
    *   Because no specific `endNodelet` is defined on the `advice` element itself, no action is performed.

8.  **`</aspect>` End Tag**:
    *   The `endNodelet` of `AspectNodeletAdder` is executed.
    *   Pops `AspectRule`, now populated with all information (joinpoint, advice, etc.), from the stack.
    *   Finally registers the completed `aspectRule` into `RuleParsingContext`.
    *   **Object Stack**: `[ ]` (empty)

As shown above, even complex AOP rules are parsed in a highly systematic and predictable manner through state management using `Nodelet` and `Object Stack`, and rule reuse via `with()`.

## 4. Conclusion

Aspectran's configuration loading mechanism is the quintessential architectural design built on top of its proprietary `nodelet` parsing engine. The core advantages of this mechanism can be summarized by three keywords: **flexibility, reusability, and performance**.

*   **Flexibility**: The Fluent API and `mount` feature of `NodeletGroup` allow it to adapt extremely flexibly to complex and variable XML structures.
*   **Reusability**: Through `NodeletAdder`, parsing logic for common XML structures like `<action>` and `<item>` is completely modularized and easily reused anywhere via the `with()` method, minimizing code duplication.
*   **Performance**: The `mount` feature dynamically transitions the parsing context, ensuring efficient parsing performance without evaluating full XPath paths even in deeply nested XML documents.

The `*Rule` objects generated through this parsing process serve as "blueprints". After parsing is complete, `ActivityContext` creates actual Bean instances based on these blueprints, injects dependencies, applies AOP proxies, and ultimately constructs the application's executable runtime environment. This architecture serves as the core foundation for the flexibility and extensibility of the Aspectran framework.
