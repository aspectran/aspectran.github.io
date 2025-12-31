---
title: Introduction to AsEL (Aspectran Expression Language)
subheadline: User Guides
---

AsEL (Aspectran Expression Language) is a powerful and lightweight expression language built into the Aspectran framework. The most significant feature of AsEL is its ability to dynamically evaluate the values of objects by combining Aspectran's own **Token Expressions** with the powerful **OGNL (Object-Graph Navigation Language) expressions**.

This guide will first explore 'Token Expressions', a basic feature of Aspectran, and then explain the complete form of 'AsEL Expressions', which combine 'Token Expressions' with OGNL.

## 1. Token Expressions (Aspectran's Basic Feature)

Token expressions are simple yet powerful placeholders used to directly access specific data (Beans, attributes, parameters, etc.) within Aspectran's configuration. They act as bridges connecting your configuration to the runtime data.

| Token Type | Expression Syntax | Description | Usage Example |
| :--- | :--- | :--- | :--- |
| **Bean** | `#{beanId}` | References the Bean object with the ID `beanId`. | `#{userService}` |
| **Attribute** | `@{attributeName}` | References the `attributeName` attribute of the current request context. Attributes are often used to pass data between actions. | `@{userInfo}` |
| **Parameter** | `${parameterName}` | References the `parameterName` parameter of the current request (e.g., HTTP query parameter). | `${userId}` |
| **Property** | `%{propertyName}` | References the `propertyName` environment property (e.g., from properties files or system properties). | `%{app.uploadDir}` |
| **Template** | `~{templateId}` | Renders the template with the ID `templateId` and **includes the result**. | `~{emailTemplate}` |

### 1.1. Property Accessor: `^`

To access a specific property (Getter) of an object referenced by a token expression, use the `^` separator instead of `.`. This is a unique feature of Aspectran to distinguish between dot-delimited IDs and property access.

*   **Syntax**: `#{beanId^propertyName}`
*   **Java Equivalent**: `getBean("beanId").getPropertyName()`
*   **Explanation**: If you use `.`, Aspectran interprets `bean.property` as the full ID of the bean. Using `^` explicitly tells Aspectran to "get the bean first, then access its property".

### 1.2. Setting Default Values

You can use the `:` separator to specify a default value to be used if a parameter or attribute is null or missing. This prevents runtime errors and simplifies configuration.

```xml
<attributes>
    <!-- If 'page' parameter is missing, default to "1" -->
    <item name="page">${page:1}</item>

    <!-- If 'sort' parameter is missing, default to "desc" -->
    <item name="sort">${sort:desc}</item>
</attributes>
```

### 1.3. Token Directives

You can specify the source of a value within a token expression using a colon (`:`). These are called token directives.

| Directive | Description | Example |
| :--- | :--- | :--- |
| **`field`** | References the value of a static field. | `#{field:java.awt.Color^RED}` |
| **`method`** | Calls a static method and uses its return value. | `#{method:java.lang.System^currentTimeMillis}` |
| **`class`** | References a static property (getter) of a class. | `#{class:java.io.File^separator}` |
| **`classpath`** | References a property from a resource on the classpath. | `%{classpath:config/jdbc.properties^jdbc.url}` |
| **`system`** | References a Java System Property value. | `%{system:user.home}` |

## 2. AsEL Expressions (Token Expressions + OGNL)

AsEL expressions combine the simplicity of token expressions with the power of OGNL (Object-Graph Navigation Language). This enables dynamic data processing, mathematical operations, and complex conditional logic directly in your configuration.

*   **Bean Property Reference**
    ```java
    // Accessing a property using the getter method
    @Value("%{properties^serverPort}")
    public int port;
    ```

*   **String Concatenation**
    ```java
    // Combining static strings with dynamic values
    @Value("'User: ' + @{user^name} + ' (ID: ' + ${userId} + ')'")
    public String userDescription;
    ```

*   **Arithmetic & Logical Operations**
    ```java
    // Calculating values dynamically
    @Value("#{cart^totalPrice} * 1.1") // Adding 10% tax
    public double totalWithTax;
    ```

*   **Conditional Logic (Ternary Operator)**
    ```java
    // Switching values based on conditions
    @Value("%{app.mode} == 'dev' ? 'DEBUG' : 'INFO'")
    public String logLevel;
    ```

*   **List and Map Access**
    ```java
    // Accessing elements in a List or Map
    @Value("@{userList}[0]") // First user in the list
    public User firstUser;

    @Value("@{configMap}['timeout']") // Value for key 'timeout'
    public int timeout;
    ```

### 2.1. String Concatenation Rules

When an AsEL expression contains multiple tokens or a mix of literal text and tokens, the entire string is evaluated as a single OGNL expression. Therefore, you must strictly follow OGNL syntax, such as using single quotes (`'`) for literal text and the `+` operator for concatenation.

*   **Correct Example**:
    ```java
    @Value("'User: ' + @{user^name} + ' (ID: ' + ${userId} + ')'")
    ```
    In this case, `@{user^name}` and `${userId}` are substituted with OGNL variables (e.g., `#__var1__`), and OGNL evaluates the combined string successfully.

*   **Incorrect Example**:
    ```java
    @Value("User: @{user^name} (ID: ${userId})")
    ```
    This will cause an `ExpressionParserException` because `User:` and `(ID:` are not valid OGNL syntax when used without quotes and operators.

## 3. Template Usage

Templates are a powerful feature for generating dynamic content using AsEL. Aspectran supports two methods: built-in templates and integration with external template engines.

### 3.1. Template Processing Methods

*   **Built-in Template**: Aspectran's `TokenEvaluator` directly parses and processes the AsEL token expressions and expressions contained in the template content to produce the final result. It is suitable for generating simple dynamic text.
*   **External Template Engine**: You can delegate template processing by registering an external template engine like FreeMarker or Thymeleaf as a Bean. This is useful for creating complex views.

### 3.2. `~{templateId}` Token Expression Usage Example

The `~{...}` token is used to render the template with the specified ID at the current location and include its result.

```xml
<!-- Built-in template rule definition -->
<template id="welcomeMailTemplate" style="apon">
    |Hello, @{user^name}! Welcome to our service.
    |Your current point balance is #{pointBean^currentPoints}.
</template>

<!-- Use the template by transforming it elsewhere -->
<transform format="text">
  <template>~{welcomeMailTemplate}</template>
</transform>
```
*   **Explanation**: In the example above, the `~{welcomeMailTemplate}` token finds and renders the template with the ID `welcomeMailTemplate`. The `@{user^name}` and `#{pointBean^currentPoints}` tokens inside the template are evaluated first, and then the final completed text is included as the content of the `<transform>`.

## 4. Caution: No Nesting

One of the most important rules of AsEL is that **you cannot include another token expression inside a token expression**. In other words, nesting is not possible.

*   **Correct Example**: `#{bean1} + #{bean2}`
*   **Incorrect Example**: `#{bean^~{anotherTemplate}}`

This is based on a design philosophy that ensures the simplicity and clarity of expressions, ultimately enhancing the readability and ease of use of the code.
