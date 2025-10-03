---
title: Aspectran View Technologies
subheadline: User Guides
---

Aspectran provides a very flexible view processing architecture for generating the final response. At the core of this architecture is the **`ViewDispatcher`**, which handles the integration of various view technologies.

Additionally, it provides a separate mechanism for generating responses in specific formats like XML, JSON, or text, rather than full-page rendering, using templates within the **`<transform>`** response rule.

## 1. View Rendering with ViewDispatcher

In Aspectran, web page rendering is primarily done through the `<dispatch>` response rule and the `ViewDispatcher` implementation that handles it. The `ViewDispatcher` is responsible for rendering the final screen using a specific view technology (JSP, Thymeleaf, FreeMarker, etc.).

In the `<dispatch>` rule, the `name` attribute specifies the path to the template file, and the `dispatcher` attribute can specify the `ViewDispatcher` bean responsible for rendering. If the `dispatcher` attribute is omitted, the default `ViewDispatcher` is used.

> **Note:** Instead of including the character encoding in the `contentType` attribute, you must specify it using a separate `encoding` attribute. If the `encoding` attribute is omitted, it inherits the encoding setting of the parent response rule.

### Supported View Technologies:

#### a. JSP (JavaServer Pages)

JSP is a classic view technology that is executed directly by the servlet container. Aspectran delegates rendering by forwarding the request to a JSP file through the `JspViewDispatcher`.

**Maven Dependency:**
```xml
<dependency>
    <groupId>com.aspectran</groupId>
    <artifactId>aspectran-web</artifactId>
    <version>9.0.0</version>
</dependency>
```

**Configuration Example:**
```xml
<!-- 1. JSP View Dispatcher Bean Configuration -->
<bean id="jspViewDispatcher" class="com.aspectran.web.support.view.JspViewDispatcher">
    <properties>
        <property name="prefix" value="/WEB-INF/jsp/"/>
        <property name="suffix" value=".jsp"/>
    </properties>
</bean>

<!-- 2. Dispatch Rule Definition -->
<dispatch name="hello" dispatcher="jspViewDispatcher" contentType="text/html" encoding="UTF-8"/>
```

#### b. Thymeleaf

Thymeleaf is a modern server-side Java template engine for both web and standalone environments. It is well-known for its "Natural Templating" feature, which allows templates to be valid HTML that can be correctly displayed in a browser. (Official Website: https://www.thymeleaf.org/)

**Maven Dependency:**
```xml
<dependency>
    <groupId>com.aspectran</groupId>
    <artifactId>aspectran-with-thymeleaf</artifactId>
    <version>9.0.0</version>
</dependency>
```

**Configuration Example:**
```xml
<!-- 1. Thymeleaf View Dispatcher Bean Configuration -->
<bean id="thymeleafViewDispatcher" class="com.aspectran.thymeleaf.view.ThymeleafViewDispatcher">
    <properties>
        <property name="prefix" value="/WEB-INF/templates/"/>
        <property name="suffix" value=".html"/>
        <property name="templateEngine" value-ref="thymeleafEngine"/>
    </properties>
</bean>

<!-- 2. Dispatch Rule Definition -->
<dispatch name="hello" dispatcher="thymeleafViewDispatcher" contentType="text/html" encoding="UTF-8"/>
```

#### c. FreeMarker

FreeMarker is a powerful and widely used template engine for generating any kind of text output, from HTML to email. (Official Website: https://freemarker.apache.org/)

**Maven Dependency:**
```xml
<dependency>
    <groupId>com.aspectran</groupId>
    <artifactId>aspectran-with-freemarker</artifactId>
    <version>9.0.0</version>
</dependency>
```

**Configuration Example:**
```xml
<!-- 1. FreeMarker View Dispatcher Bean Configuration -->
<bean id="freeMarkerViewDispatcher" class="com.aspectran.freemarker.view.FreeMarkerViewDispatcher">
    <properties>
        <property name="prefix" value="/WEB-INF/templates/"/>
        <property name="suffix" value=".ftl"/>
        <property name="templateEngine" value-ref="freeMarkerEngine"/>
    </properties>
</bean>

<!-- 2. Dispatch Rule Definition -->
<dispatch name="hello" dispatcher="freeMarkerViewDispatcher" contentType="text/html" encoding="UTF-8"/>
```

#### d. Pebble

Pebble is a lightweight yet powerful template engine inspired by Twig, known for its security features and extensibility. (Official Website: https://pebbletemplates.io/)

**Maven Dependency:**
```xml
<dependency>
    <groupId>com.aspectran</groupId>
    <artifactId>aspectran-with-pebble</artifactId>
    <version>9.0.0</version>
</dependency>
```

**Configuration Example:**
```xml
<!-- 1. Pebble Template Engine Bean Configuration -->
<bean id="pebbleEngine" class="com.aspectran.pebble.PebbleTemplateEngine">
    <argument>
        <bean class="com.aspectran.pebble.PebbleEngineFactoryBean">
            <property name="templateLoaderPath" type="array">
                <value>classpath:view</value>
            </property>
        </bean>
    </argument>
</bean>

<!-- 2. Pebble View Dispatcher Bean Configuration -->
<bean id="pebbleViewDispatcher" class="com.aspectran.pebble.view.PebbleViewDispatcher">
    <arguments>
        <item>#{pebbleEngine}</item>
    </arguments>
    <properties>
        <item name="suffix">.peb</item>
    </properties>
</bean>

<!-- 3. Dispatch Rule Definition -->
<dispatch name="template-2" dispatcher="pebbleViewDispatcher" contentType="text/html" encoding="UTF-8"/>
```

## 2. Using Templates in Transform Responses

The `<template>` element is mainly used with the `<transform>` response rule to generate data in a specific format (TEXT, JSON, XML, etc.) rather than a complete web page. This is very useful for creating API responses or simple text results.

The template content can be written directly within the XML configuration file or referenced from an external resource using the `file`, `resource`, or `url` attributes.

The processing method for the template is determined by the `engine` attribute of the `<template>` tag.

### Template Engine (`engine` attribute)

Aspectran's template processing is determined by the `engine` attribute, which can be categorized into three main types:

1.  **`engine="token"` (or omitted)**
    *   **Processing Engine**: Aspectran's built-in token engine.
    *   **Description**: This is the default behavior. It parses and replaces Aspectran's native tokens (e.g., `${...}` for parameters, `@{...}` for attributes) with their corresponding values at runtime. This is the standard way to generate dynamic text responses and replaces the legacy `builtin` engine.

2.  **`engine="none"`**
    *   **Processing Engine**: None (Raw Text).
    *   **Description**: The template content is not processed and is output as is. This is useful when you want to return pre-formatted static content like JSON or XML without any modifications.

3.  **`engine="[custom-bean-id]"`**
    *   **Processing Engine**: External template engine bean.
    *   **Description**: When a value other than `token` or `none` is provided, Aspectran treats it as a bean ID and delegates the template rendering to that bean. This is how you integrate with third-party template engines like FreeMarker, Thymeleaf, or Pebble.

Here is a summary table:

| `engine` Attribute | Processing Engine | Description / Use Case |
| :--- | :--- | :--- |
| **(omitted)** or `token` | Aspectran's built-in token engine | Parses and replaces native tokens like `${...}` and `@{...}`. **(Recommended Default)** |
| `none` | None (Raw Text) | Outputs the template content as is, without any processing. (e.g., for static JSON/XML) |
| (custom bean ID) | External template engine bean | Delegates rendering to a specified bean. (e.g., for FreeMarker, Thymeleaf integration) |

### Template Styles (TextStyleType)

You can control the output format by specifying the `style` attribute in the `<template>`. This attribute corresponds to the `TextStyleType` enum.

*   **`APON ("apon")`**
    Used when writing text in APON (Aspectran Parameter Object Notation) format. It allows for highly readable multi-line strings using the pipe (`|`) character, and indentation and line breaks are preserved as is.

*   **`COMPACT ("compact")`**
    The 'compact' style makes data concise by removing unnecessary whitespace (indentation, line breaks, etc.) from JSON or XML. Minimal whitespace for readability may be retained.

*   **`COMPRESSED ("compressed")`**
    The 'compressed' style is more aggressive than `compact` in removing whitespace to minimize data size. It removes all whitespace that is not syntactically required, making it most effective for reducing network transmission size.

### Configuration Examples

**Example 1: Referencing an external file**
```xml
<transform format="text" encoding="UTF-8">
    <!-- If the engine attribute is omitted, it defaults to "token" -->
    <template file="/path/to/my-template.txt"/>
</transform>
```

**Example 2: Inline template using APON style**
```xml
<transform format="text" encoding="UTF-8">
    <template style="apon">
        |----------------------------------------------------------
        |The input parameters and attributes are as follows:
        |   input-1: ${input-1} - This is a parameter.
        |   input-2: ${input-2} - This is a parameter.
        |   input-3: ${input-3} - This is a parameter.
        |   input-4: @{input-4} - This is an attribute.
        |----------------------------------------------------------
    </template>
</transform>
```

## 3. Conclusion

Aspectran offers high flexibility and extensibility by providing two clear methods for handling views.

*   **`ViewDispatcher` (`<dispatch>` rule):** This is the standard method for rendering web pages. It integrates and processes various view technologies like JSP, Thymeleaf, and FreeMarker in a consistent manner. You can also implement your own view processing logic by extending `AbstractViewDispatcher`.

*   **`TemplateEngine` (`<template>` within `<transform>` rule):** This is a specialized method for generating results in a specific data format, such as API responses. It is useful when you need to dynamically generate only the necessary parts, not a full view page.

Developers can effectively design and implement the view layer of their web applications by choosing and using these two mechanisms according to their purpose.
