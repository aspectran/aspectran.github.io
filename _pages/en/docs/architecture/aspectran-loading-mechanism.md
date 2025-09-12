---
format: plate solid article
sidebar: toc-left
title: "Aspectran Configuration Loading Mechanism: An In-Depth Analysis of the `nodelet` Engine"
headline:
teaser:
---

Aspectran parses configuration files in XML or APON (Aspectran Object Notation) format to create a tree of `*Rule` objects, which serve as the blueprint for the application's core components (Bean, Translet, Aspect, etc.). At the heart of this process is the high-performance, event-based parsing engine **`nodelet`**, specially designed for Aspectran and implemented in the `com.aspectran.utils.nodelet` package.

```text
[XML/APON Config File] ---> [NodeletParser] --uses--> [AspectranNodeletGroup] ---> [*Rule Object Tree] ---> [ActivityContext]
```

## 1. The Core Parsing Engine: `com.aspectran.utils.nodelet`

`nodelet` operates on an event basis, similar to a typical SAX parser, but it is a lightweight parsing framework that allows for much more intuitive and structured processing of complex XML documents by directly mapping callbacks to specific XPath paths.

#### Key Components:

*   **`NodeletParser`**: The main engine that drives the parsing process. It sequentially reads an XML document, detects the start and end of each node (element), and fires the appropriate event corresponding to the current path.
*   **`Nodelet` / `EndNodelet`**: Event handler (callback) interfaces.
    *   `Nodelet`: Called when the **start tag** of an XML element is encountered. It processes the attribute information of that element, which is passed as a parameter.
    *   `EndNodelet`: Called when the **end tag** of an XML element is encountered. It processes the text content (including CDATA) contained within that element.
*   **`NodeletGroup`**: The **core design of the `nodelet` engine**. It manages `Nodelet`s and `EndNodelet`s in groups along with specific XPath paths. This class provides a Fluent API that acts as a kind of DSL (Domain-Specific Language) for declaratively defining parsing rules.
    *   `.child("elementName")`: Starts defining rules for a child element of the current path.
    *   `.parent()`: Moves from the current path to the parent path.
    *   `.nodelet(...)`: Registers a `Nodelet` for the start tag of the current path.
    *   `.endNodelet(...)`: Registers an `EndNodelet` for the end tag of the current path.
    *   `.with(NodeletAdder)`: Adds a reusable set of rules to the current group.
    *   `.mount(NodeletGroup)`: Dynamically "mounts" another `NodeletGroup` at the current path.
*   **`NodeletAdder`**: An interface that adds a reusable set of rules to a `NodeletGroup`. This allows for the modularization and reuse of parsing logic for common XML structures (e.g., `<item>`, `<argument>`) in multiple places.

#### The Innovative `mount` Feature

The `mount` feature of `NodeletGroup` is a key element that makes the `nodelet` engine very powerful and efficient. This feature dynamically activates a pre-defined set of rules from another `NodeletGroup` when a specific element appears. This provides the following important advantages:

1.  **Memory Efficiency and Performance Improvement**: When using `mount`, the parser finds the `Nodelet` using a **relative path** from the mounted point, instead of the full absolute XPath path (`a/b/c/...`). This dramatically reduces memory usage and improves parsing performance by avoiding the cost of generating and comparing long XPath strings, even in very deep nested structures.
2.  **Maximizing Rule Reusability**: Complex structures that can appear repeatedly, such as `<choose>/<when>/<otherwise>`, can be defined as a separate `NodeletGroup` (`ChooseNodeletGroup`), and this set of parsing rules can be reused anywhere with a single line of `.mount()`.
3.  **Removing Nesting Level Limits**: Since `mount` effectively resets the parsing context, there is theoretically no limit to the nesting level of XML elements.

## 2. Aspectran's Implementation: `com.aspectran.core.context.rule.parser.xml`

Aspectran uses the `nodelet` engine described above to parse its complex XML configuration files (e.g., `aspectran-config.xml`) and convert their contents into a tree of `*Rule` objects.

#### Parsing Flow:

1.  **Initialization of `AspectranNodeParser`**: This is the starting point of the parsing. It internally creates a `NodeletParser` and registers `AspectranNodeletGroup`, the master `NodeletGroup` where all of Aspectran's XML rules are defined, with the parser. It also sets up `AspectranDtdResolver` for DTD validation.

2.  **`AspectranNodeletGroup` and `*NodeletAdder`**:
    *   `AspectranNodeletGroup` is the top-level rule group for the `<aspectran>` root element. This group assembles the entire set of parsing rules by adding `BeanNodeletAdder`, `AspectNodeletAdder`, `TransletNodeletAdder`, etc., which handle each top-level element, through the `with()` method.
    *   Each `*NodeletAdder` uses the Fluent API of `NodeletGroup` to define in detail how to parse the XML element it is responsible for and its child elements. For example, `TransletNodeletAdder` defines the rule for the `<translet>` element, and also defines the rules for child elements that can come inside it, such as `<request>`, `<response>`, and `<content>`.
    *   In particular, Adders with 'Inner' in their name, like `ActionInnerNodeletAdder` or `ArgumentNodeletAdder`, or those that handle specific elements (argument, property, etc.), are made to parse common XML structures used inside various other rules (e.g., `<translet>`, `<advice>`, `<bean>`). This maximizes the reusability of parsing logic.

3.  **State Management: `AspectranNodeParsingContext` and `ObjectStack`**:
    *   XML parsing is a stateful task that needs to handle parent-child relationships. For example, when parsing an `<action>` element, you need to know which `<translet>` this action belongs to.
    *   Aspectran solves this problem through `AspectranNodeParsingContext`. This class provides a thread-safe `ArrayStack` (Object Stack) for each thread using a `ThreadLocal` variable.
    *   **How it works**:
        1.  When the `Nodelet` for an element's start tag is called (e.g., `<translet>`), it creates a `TransletRule` object to hold that rule and pushes it onto the stack using `AspectranNodeParsingContext.pushObject()`.
        2.  In the `Nodelet` for a child element (e.g., `<request>`), it calls `AspectranNodeParsingContext.peekObject()` to get the parent object (`TransletRule`) at the top of the stack and connects itself (`RequestRule`) to the parent.
        3.  When the `EndNodelet` for an element's end tag is called, the completed object is removed from the stack using `AspectranNodeParsingContext.popObject()`.

## 3. Parsing Process with a Real Example

#### Example 1: Basic `<translet>` Parsing and the Object Stack

Let's assume we have the following simple XML configuration:

```xml
<translet name="/example/hello">
    <action bean="helloAction" method="sayHello" />
</translet>
```

The process of parsing this XML is as follows:

1.  **`<translet>` Start**:
    *   `NodeletParser` encounters the `<translet>` start tag.
    *   The `nodelet` defined in `TransletNodeletAdder` is executed.
    *   The `nodelet` reads the `name` attribute value ("/example/hello") and creates a `TransletRule` object.
    *   The created `transletRule` object is pushed onto the Object Stack via `AspectranNodeParsingContext.pushObject()`.
    *   **Object Stack State**: `[ TransletRule(...) ]`

2.  **`<action>` Start**:
    *   The parser encounters the child node `<action>` start tag.
    *   The `nodelet` of `ActionInnerNodeletAdder`, which was added by `TransletNodeletAdder` via `.with(ActionInnerNodeletAdder.instance())`, is executed.
    *   The `nodelet` reads the `bean` and `method` attributes and creates an `InvokeActionRule` object.
    *   The created `invokeActionRule` object is pushed onto the stack.
    *   **Object Stack State**: `[ TransletRule(...), InvokeActionRule(...) ]`

3.  **`</action>` End**:
    *   The parser encounters the `</action>` end tag.
    *   The `endNodelet` of `ActionInnerNodeletAdder` is executed.
    *   `InvokeActionRule invokeActionRule = AspectranNodeParsingContext.popObject()`: The `InvokeActionRule` is popped from the stack.
    *   `HasActionRules hasActionRules = AspectranNodeParsingContext.peekObject()`: The top object of the stack, the `TransletRule`, is checked. (`TransletRule` implements the `HasActionRules` interface.)
    *   `hasActionRules.putActionRule(invokeActionRule)`: The `InvokeActionRule` is added as a child to the `TransletRule`.
    *   **Object Stack State**: `[ TransletRule(...) ]`

4.  **`</translet>` End**:
    *   The parser encounters the `</translet>` end tag.
    *   The `endNodelet` of `TransletNodeletAdder` is executed.
    *   `TransletRule transletRule = AspectranNodeParsingContext.popObject()`: The fully configured `TransletRule` is popped from the stack.
    *   `AspectranNodeParsingContext.assistant().addTransletRule(transletRule)`: The completed rule is finally registered with `ActivityRuleAssistant`.
    *   **Object Stack State**: `[ ]` (empty)

#### Example 2: Reusing Complex Structures with the `mount` Feature

Now let's look at the power of the `mount` feature using the nestable `<choose>` element as an example.

```xml
<translet name="/example/conditional">
    <choose>
        <when test="@{param:type == 'A'}">
            <action bean="actionA" />
        </when>
        <otherwise>
            <!-- Another choose can come here -->
            <action bean="actionB" />
        </otherwise>
    </choose>
</translet>
```

*   `TransletNodeletAdder` adds the `<choose>` rule via `.with(ChooseNodeletAdder.instance())`.
*   `ChooseNodeletAdder`, when defining the rules for the `<when>` and `<otherwise>` elements, calls `.mount(ChooseNodeletGroup.instance())`.
*   `ChooseNodeletGroup` is an independent group that defines the parsing rules for the `<choose>` element itself.

What this means is:

> When the parser enters a `<when>` or `<otherwise>` element, the rules of the `mount`ed `ChooseNodeletGroup` are **dynamically activated**. This means that even if another `<choose>` element is encountered inside `<when>` or `<otherwise>`, the parser can handle the parsing recursively in the same way as the first time.

In this way, the `mount` feature allows you to define the parsing rules for complex and recursive XML structures only once and reuse them wherever needed, eliminating code duplication and optimizing memory usage.

### Example 3: `<aspect>` Rule and Complex Relationship Settings

Since AOP rules involve complex relationships between multiple components, the parsing process is more multi-layered. Let's look at it through the following example.

```xml
<aspect id="myAspect" order="1">
    <joinpoint>
      pointcut: {
        type: "wildcard",
        +: "/example/hello@helloAction^say*"
      }
    </joinpoint>
    <advice bean="loggingAdvice">
        <before>
            <action bean="profiler" method="start"/>
        </before>
    </advice>
</aspect>
```

This XML defines an AOP rule that executes the `profiler.start()` action of the `loggingAdvice` bean `before` any method starting with `say` (`joinpoint`) of the `helloAction` bean is executed in the Translet named `/example/hello`.

In the pointcut string, the part before the `@` delimiter represents the Translet's name, the part after it represents the Bean's ID, and the part after the `^` delimiter represents the method name to be called. Wildcards can be used in each part. If you want to target all Translets instead of a specific one, the pattern must start with the `@` delimiter (e.g., `+ "@helloAction^say*"`).

1.  **`<aspect>` Start**:
    *   The `nodelet` of `AspectNodeletAdder` is executed.
    *   It reads the `id` and `order` attributes, creates an `AspectRule` object, and pushes it onto the stack.
    *   **Object Stack**: `[ AspectRule(...) ]`

2.  **`<joinpoint>` Start and End**:
    *   The `nodelet` for `joinpoint` defined inside `AspectNodeletAdder` is executed, but it does no special work when using APON format.
    *   The `endNodelet` of `</joinpoint>` is executed.
    *   The `endNodelet` receives the entire APON-formatted text inside the `<joinpoint>` element as the `text` parameter.
    *   Internal logic like `JoinpointRule.updateJoinpoint(joinpointRule, text)` parses the APON text to create `PointcutRule`, etc.
    *   It gets the `AspectRule` from the stack with `peek()` and sets the completed `joinpointRule`.
    *   **Object Stack**: `[ AspectRule(...) ]`

3.  **`<advice>` Start**:
    *   The `nodelet` for `advice` defined inside `AspectNodeletAdder` is executed.
    *   It reads the `bean` attribute ("loggingAdvice").
    *   It gets the `AspectRule` with `peek()` and calls `setAdviceBeanId("loggingAdvice")` to specify the bean that will perform the Advice. Nothing is pushed onto the stack at this stage.
    *   **Object Stack**: `[ AspectRule(...) ]`

4.  **`<before>` Start**:
    *   The child node rules of `advice` are handled by `AdviceInnerNodeletAdder`. The `nodelet` for `before` in this Adder is executed.
    *   It gets the `AspectRule` with `peek()` and calls the `newBeforeAdviceRule()` method to create an `AdviceRule` object.
    *   The created `adviceRule` is pushed onto the stack.
    *   **Object Stack**: `[ AspectRule(...), AdviceRule(type=BEFORE, ...) ]`

5.  **`<action>` Start and End (in `<before>`)**:
    *   The `before` rule reuses the rules of `ActionInnerNodeletAdder` (`with(...)`).
    *   The `nodelet` of `<action>` is executed, creates an `InvokeActionRule`("profiler.start"), and pushes it onto the stack.
    *   **Object Stack**: `[ AspectRule(...), AdviceRule(...), InvokeActionRule(...) ]`
    *   The `endNodelet` of `</action>` is executed.
    *   It pops the `InvokeActionRule`, gets the `AdviceRule` with `peek()`, and adds it as a child via `putActionRule()`.
    *   **Object Stack**: `[ AspectRule(...), AdviceRule(...) ]`

6.  **`</before>` End**:
    *   The `endNodelet` of `before` is executed.
    *   It pops the `AdviceRule`. This `AdviceRule` is already connected to its parent `AspectRule`.
    *   **Object Stack**: `[ AspectRule(...) ]`

7.  **`</advice>` End**:
    *   No `endNodelet` is specifically defined for the `advice` element, so no action is taken.

8.  **`</aspect>` End**:
    *   The `endNodelet` of `AspectNodeletAdder` is executed.
    *   It pops the `AspectRule`, which is now filled with all information (joinpoint, advice, etc.), from the stack.
    *   The completed `aspectRule` is finally registered with `ActivityRuleAssistant`.
    *   **Object Stack**: `[ ]` (empty)

As you can see, even complex AOP rules are parsed in a very systematic and predictable way through state management using `Nodelet` and `Object Stack`, and rule reuse via `with()`.

## 4. Conclusion

Aspectran's configuration loading mechanism is the essence of a sophisticated architecture designed on top of its custom `nodelet` parsing engine. The key advantages of this mechanism can be summarized in three keywords: **flexibility, reusability, and performance**.

*   **Flexibility**: The Fluent API of `NodeletGroup` and the `mount` feature allow for very flexible responses to complex and variable XML structures.
*   **Reusability**: `NodeletAdder` perfectly modularizes the parsing logic for common XML structures like `<action>` and `<item>`, and minimizes code duplication by easily reusing it wherever needed with the `with()` method.
*   **Performance**: The `mount` feature dynamically switches the parsing context, so it does not use the full XPath in deeply hierarchical XML documents, thus ensuring efficient parsing performance.

After parsing, the created `*Rule` objects are a kind of "blueprint". Based on these blueprints, `ActivityContext` then creates the actual Bean instances, injects dependencies, and applies AOP proxies to finally build the application's executable runtime environment. This architecture can be said to be the core foundation of the Aspectran framework's flexibility and extensibility.
