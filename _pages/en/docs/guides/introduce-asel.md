---
format: plate solid article
sidebar: toc-left
title: Introduction to AsEL (Aspectran Expression Language)
headline:
teaser:
---

AsEL (Aspectran Expression Language) is a powerful and lightweight expression language built into the Aspectran framework. The most significant feature of AsEL is its ability to dynamically evaluate the values of objects by combining Aspectran's own **Token Expressions** with the powerful **OGNL (Object-Graph Navigation Language) expressions**.

This guide will first explore 'Token Expressions', a basic feature of Aspectran, and then explain the complete form of 'AsEL Expressions', which combine 'Token Expressions' with OGNL.

## 1. Token Expressions (Aspectran's Basic Feature)

Token expressions are simple expressions used to directly access specific data (Beans, attributes, parameters, etc.) within Aspectran's configuration. Each token has a defined syntax and role.

| Token Type | Expression Syntax | Description |
| :--- | :--- | :--- |
| **Bean** | `#{beanId}` | References the Bean object with the ID `beanId`. |
| **Attribute** | `@{attributeName}` | References the `attributeName` attribute of the current request. |
| **Parameter** | `${parameterName}` | References the `parameterName` parameter of the current request. |
| **Property** | `%{propertyName}` | References the `propertyName` environment property of the application. |
| **Template** | `~{templateId}` | Renders the template with the ID `templateId` and **includes the result**. |

### 1.1. Property Accessor: `^`

To access a specific property (Getter) of an object referenced by a token expression, use the `^` separator instead of `.`.

*   **Syntax**: `#{beanId^propertyName}`
*   **Explanation**: If you use `.`, the entire `bean.property` is recognized as a single ID. However, using `^` finds the `propertyName` property from the object referenced by the `beanId` token.

### 1.2. Setting Default Values

You can use the `:` separator to specify a default value to be used if a parameter or attribute is not present. This feature is mainly used within the `<item>` tag.

```xml
<attributes>
    <!-- If the 'name' parameter is not present, use "Jane" as the default value -->
    <item name="name">${name:Jane}</item>
</attributes>
```

### 1.3. Token Directives

You can specify the source of a value within a token expression using a colon (`:`). These are called token directives, and you can use the types defined in `TokenDirectiveType`.

| Directive | Description | Example |
| :--- | :--- | :--- |
| **`field`** | References the value of a static field. | `#{field:com.example.Constant^STATIC_FIELD}` |
| **`method`** | Calls a static method and uses its return value. | `#{method:java.lang.System^currentTimeMillis}` |
| **`class`** | References a static property (getter) of a class. | `#{class:java.io.File^separator}` |
| **`classpath`** | References a property from a resource on the classpath (usually a .properties file). | `%{classpath:config/app.properties^db.url}` |
| **`system`** | References a Java System Property value. | `%{system:java.version}` |

## 2. AsEL Expressions (Token Expressions + OGNL)

AsEL expressions are used by combining the token expressions described above with OGNL expressions. This enables dynamic data processing and operations that go beyond simple value references. They can be used freely in places like the `@Value` annotation or templates.

*   **Bean Property Reference (using `^`)**
    ```java
    @Value("%{properties^property1}")
    public String property1;
    ```

*   **Combining Multiple Token Expressions and OGNL Operators**
    ```java
    @Value("#{properties^property1} + '/' + #{properties^property2}")
    public String combinedPath;
    ```

*   **Performing Conditional Logic with the Value of a Token Expression**
    ```java
    @Value("%{app.mode} == 'development'")
    public boolean isDevelopmentMode;
    ```

## 3. Template Usage

Templates are a powerful feature for generating dynamic content using AsEL. Aspectran supports two methods: built-in templates and integration with external template engines.

### 3.1. Template Processing Methods

*   **Built-in Template**: Aspectran's `TokenEvaluator` directly parses and processes the AsEL token expressions and expressions contained in the template content to produce the final result. It is suitable for generating simple dynamic text.
*   **External Template Engine**: You can delegate template processing by registering an external template engine like FreeMarker or Thymeleaf as a Bean. This is useful for creating complex views.

### 3.2. `~{templateId}` Token Expression Usage Example

The `~{...}` token is used to render the template with the specified ID at the current location and include its result.

```xml
<!-- Built-in template rule definition -->
<template id="welcomeMailTemplate">
  <content>
    Hello, @{user^name}! Welcome to our service.
    Your current point balance is #{pointBean^currentPoints}.
  </content>
</template>

<!-- Use the template by transforming it elsewhere -->
<transform format="text">
  <content>~{welcomeMailTemplate}</content>
</transform>
```
*   **Explanation**: In the example above, the `~{welcomeMailTemplate}` token finds and renders the template with the ID `welcomeMailTemplate`. The `@{user^name}` and `#{pointBean^currentPoints}` tokens inside the template are evaluated first, and then the final completed text is included as the content of the `<transform>`.

## 4. Caution: No Nesting

One of the most important rules of AsEL is that **you cannot include another token expression inside a token expression**. In other words, nesting is not possible.

*   **Correct Example**: `#{bean1} + #{bean2}`
*   **Incorrect Example**: `#{bean^~{anotherTemplate}}`

This is based on a design philosophy that ensures the simplicity and clarity of expressions, ultimately enhancing the readability and ease of use of the code.
