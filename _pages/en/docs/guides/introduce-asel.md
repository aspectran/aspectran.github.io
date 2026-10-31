---
title: Introduction to AsEL (Aspectran Expression Language)
subheadline: Core Guides
---

AsEL (Aspectran Expression Language) is a powerful and lightweight expression language built into the Aspectran framework. The most significant feature of AsEL is its ability to dynamically evaluate values by combining Aspectran's core **Token Expressions** with the powerful **OGNL (Object-Graph Navigation Language)**.

In Aspectran, Token Expressions are primarily used to access specific data. When multiple tokens are combined or complex operations are needed, OGNL evaluates the entire expression as AsEL.

## 1. Token Expressions (Aspectran's Core Feature)

Token expressions are placeholders used to directly access specific data (Beans, attributes, parameters, etc.) within Aspectran's configuration. They act as bridges connecting your configuration to runtime data.

| Token Type | Expression Syntax | Description | Usage Example |
| :--- | :--- | :--- | :--- |
| **Bean** | `#{beanId}` | References the Bean object with the ID `beanId`. | `#{userService}` |
| **Attribute** | `@{attributeName}` | References an attribute in the current request context. | `@{userInfo}` |
| **Parameter** | `${parameterName}` | References a request parameter (e.g., HTTP query parameter). | `${userId}` |
| **Property** | `%{propertyName}` | References an environment property from properties files or system. | `%{app.uploadDir}` |
| **Template** | `~{templateId}` | Renders the template with the ID `templateId` and includes the result. | `~{emailTemplate}` |

### 1.1. Property Accessor: `^`

To access a specific property (Getter) of an object referenced by a token expression, use the `^` separator instead of `.`. This distinguishes between dot-delimited IDs and property access.

*   **Syntax**: `#{beanId^propertyName}`
*   **Java Equivalent**: `getBean("beanId").getPropertyName()`
*   **Explanation**: Using `^` explicitly tells Aspectran to "get the data first, then access its property".

### 1.2. Setting Default Values

You can use the `:` separator within a token to specify a default value if the token resolves to null or is missing.

```xml
<attributes>
    <!-- If 'page' parameter is missing, default to "1" -->
    <item name="page">${page:1}</item>

    <!-- If 'sort' parameter is missing, default to "desc" -->
    <item name="sort">${sort:desc}</item>
</attributes>
```

### 1.3. Token Directives

Directives provide explicit instructions on how to resolve a token's value. This is a crucial feature for accessing static members or specific resources.

| Directive | Description | Example |
| :--- | :--- | :--- |
| **`field`** | References the value of a static field. | `#{field:java.awt.Color^RED}` |
| **`method`** | Calls a static method and uses its return value. | `#{method:java.lang.System^currentTimeMillis}` |
| **`class`** | References a static property (getter) of a class. | `#{class:java.io.File^separator}` |
| **`classpath`** | Loads properties from a classpath resource. | `%{classpath:config/jdbc.properties^jdbc.url}` |
| **`system`** | Accesses a Java System Property. | `%{system:user.home}` |

## 2. AsEL Expressions (Token Integration + OGNL)

When multiple tokens are combined or used within the `@Value` annotation or Thymeleaf templates, they form an AsEL expression. If only one token is present, Aspectran simply retrieves that single value. If multiple tokens or operators are involved, the expression is evaluated using OGNL.

### 2.1. Single Token Usage Example

*   **Bean Property Reference**
    ```java
    // References a property using the getter method
    @Value("%{properties^serverPort}")
    public int port;
    ```

*   **Parameter Reference**
    ```xml
    <item name="userId">${userId}</item>
    ```

### 2.2. Complex Expressions

*   **Arithmetic & Logical Operations**
    ```java
    @Value("#{cart^totalPrice} * 1.1") // 10% tax calculation
    ```

*   **Conditional Logic (Ternary Operator)**
    ```java
    @Value("%{app.mode} == 'dev' ? 'DEBUG' : 'INFO'")
    ```

*   **List and Map Access**
    ```java
    @Value("@{userList}[0]") // First element in a list
    ```

### 2.3. String Concatenation Rules

When an AsEL expression contains multiple tokens or a mix of literal text and tokens, Aspectran substitutes each token with a temporary OGNL variable (e.g., `#__var1__`) and evaluates the entire string as a **single OGNL expression**. Therefore, you must follow strict OGNL/Java syntax for string concatenation.

*   **Correct Example**:
    ```java
    @Value("'User: ' + @{user^name} + ' (ID: ' + ${userId} + ')'")
    ```
    *   **Why it works**: After token substitution, the expression becomes something like `'User: ' + #__var1__ + ' (ID: ' + #__var2__ + ')'`. This is a perfectly valid OGNL expression that concatenates strings using the `+` operator.

*   **Incorrect Example**:
    ```java
    @Value("User: @{user^name} (ID: ${userId})")
    ```
    *   **Why it fails**: This is substituted as `User: #__var1__ (ID: #__var2__)`. OGNL cannot evaluate this because `User:` and `(ID:` are not enclosed in quotes and there are no `+` operators to join the segments. It results in an `ExpressionParserException`.

### 2.4. Advanced Operators

AsEL provides enhanced operators that go beyond native OGNL, offering a modern syntax similar to Spring Expression Language (SpEL).

#### 2.4.1. Safe Navigation Operator: `?.`
Avoids `NullPointerException` by returning `null` if any element in the chain is null.
*   **Property Chaining**: `@{user}?.address?.city`
*   **Method Call**: `@{user}?.getName()` (Returns null if user is null)
*   **With Collection**: `@{members}?.size()`

#### 2.4.2. Elvis Operator: `?:`
A shorthand for the ternary operator to provide a default value when an expression evaluates to `null`.
*   **Simple Fallback**: `@{user^nickname} ?: 'Anonymous'`
*   **Nested Elvis**: `@{user^nickname} ?: ${guestName} ?: 'Stranger'`
*   **With Safe Navigation**: `@{user}?.profile?.bio ?: 'No bio available'`

#### 2.4.3. Type Operator: `T()`
Accesses static classes, constants, and methods.
*   **Constants**: `T(java.lang.Math).PI`
*   **Static Methods**: `T(java.lang.System).currentTimeMillis()`
*   **Utility Methods**: `T(com.aspectran.utils.StringUtils).hasText(@{user^name})`

#### 2.4.4. Collection Selection & Projection
Enables powerful SpEL-style processing for collections (List, Map, Set).
*   **Selection (Filter)**: `@{members}.?[age > 20]` (Returns a list of members older than 20)
*   **Projection (Transform)**: `@{members}.![name]` (Returns a list of just the names)
*   **Combined**: `@{members}.?[role == 'ADMIN'].![email]` (Names of all admins)
*   **First/Last Match**:
    *   `@{members}.^[age > 18]` (First adult)
    *   `@{members}.$[age > 18]` (Last adult)

#### 2.4.5. Matches Operator
Performs regular expression matching.
*   **Email Validation**: `${email} matches '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$'`
*   **Pattern Check**: `@{user^role} matches 'ADMIN|MANAGER'`

## 3. Template Usage

Templates generate dynamic content using AsEL. The `~{...}` token renders a template and includes its evaluated result.

### 3.1. Built-in Template Example

```xml
<template id="welcomeMail" style="apon">
    |Hello, @{user^name:Guest}!
    |Your score is @{score^total:0}.
</template>
```

> ⚠️ **Note**\
> The built-in template engine performs simple token substitution. It evaluates tokens individually and concatenates them with plain text. Therefore, complex AsEL operators like `?.` or `?:` cannot be used directly in the text body of a built-in template. To fully utilize advanced AsEL operators within templates, it is highly recommended to use an external engine like Thymeleaf.

## 4. Caution: No Nesting

A fundamental rule of AsEL is that **you cannot nest token expressions**.

*   **Correct**: `#{bean1} + #{bean2}`
*   **Incorrect**: `#{bean^~{anotherTemplate}}`

This ensures expressions remain simple, clear, and easy to read.

## 5. Evaluating AsEL in Shell (evaluate command)

In the Aspectran Shell environment, you can use the `evaluate` command to immediately evaluate AsEL expressions within the running application context and view the results. This is extremely useful for pre-validating complex expressions before using them in configurations or for real-time monitoring of the state of loaded Beans.

*   **Basic Usage**: `evaluate "<expression>"`
*   **Example**:
    ```shell
    default> evaluate "1 + 1"
    2
    default> evaluate "#{userService^getUserCount()}"
    150
    default> evaluate "T(java.lang.System)^getProperty('user.home')"
    /Users/Aspectran
    ```

Experience and verify the powerful features of AsEL directly in your development and operation process through the `evaluate` command.
