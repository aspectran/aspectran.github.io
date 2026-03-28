---
title: Aspectran JSP Tag Library Guide
subheadline: Core Guides
---

The Aspectran JSP Tag Library provides a set of custom tags that simplify expression evaluation, multi-language message handling, URL generation, and environment-based content control within JSP views.

## 1. Tag Library Declaration

To use the Aspectran tags, include the following directive at the top of your JSP page:

```jsp
<%@ taglib uri="http://aspectran.com/tags" prefix="aspectran" %>
```

## 2. Main Tags Overview

### `<aspectran:eval>`
Evaluates an AsEL (Aspectran Expression Language) expression and either prints the result or assigns it to a variable. Since the `AselExpressionPreprocessor` is applied, you can use modern operators.

#### **Preprocessor Supported Operators**

1.  **Safe Navigation (`?.`)**: Checks if an object is `null` before accessing its properties.
    ```jsp
    <%-- If user is null, returns null; otherwise, accesses the cart --%>
    <aspectran:eval expression="user?.cart?.numberOfItems"/>
    ```
2.  **Elvis Operator (`?:`)**: Provides a default value if the expression result is `null`.
    ```jsp
    <%-- If the result is null, prints 0 --%>
    <aspectran:eval expression="user?.cart?.numberOfItems ?: 0"/>
    ```
3.  **Collection Selection (`.?[...]`)**: Filters elements in a collection that match a condition.
    ```jsp
    <%-- List of products with price >= 100 --%>
    <aspectran:eval expression="products.?[price >= 100]"/>
    ```
4.  **Collection Projection (`.![...]`)**: Transforms elements in a collection into a new list.
    ```jsp
    <%-- A list of only the names of all products --%>
    <aspectran:eval expression="products.![name]"/>
    ```
5.  **First/Last Selection (`.^[...]`, `.$[...]`)**: Selects the first or last element matching a condition.
    ```jsp
    <aspectran:eval expression="products.^[category == 'Electronics']"/>
    ```
6.  **Matches Operator (`matches`)**: Checks if a string matches a regular expression.
    ```jsp
    <aspectran:eval expression="user.email matches '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$'"/>
    ```
7.  **Type Operator (`T(...)`)**: Accesses static class types to call constants or methods.
    ```jsp
    <aspectran:eval expression="T(java.lang.Math).PI"/>
    <aspectran:eval expression="T(com.example.Constants).DEFAULT_PAGE_SIZE"/>
    ```

### `<aspectran:message>`
Retrieves a message from the multi-language message source.

*   **Practical Examples**:
    ```jsp
    <%-- Simple message output --%>
    <aspectran:message code="label.username"/>

    <%-- Passing arguments --%>
    <aspectran:message code="msg.welcome" arguments="${user.name}"/>

    <%-- Default text if the code is not found --%>
    <aspectran:message code="non.existent.code" text="This is a default message."/>

    <%-- Store the result in a variable for reuse --%>
    <aspectran:message code="page.title" var="pTitle"/>
    <title>${pTitle}</title>
    ```

### `<aspectran:url>`
Generates a URL with support for URL templates and parameter encoding.

*   **Practical Examples**:
    ```jsp
    <%-- Simple URL with context path --%>
    <a href="<aspectran:url value="/main"/>">Go Home</a>

    <%-- Adding query parameters --%>
    <aspectran:url value="/search" var="searchUrl">
        <aspectran:param name="keyword" value="Aspectran"/>
        <aspectran:param name="page" value="1"/>
    </aspectran:url>
    <a href="${searchUrl}">View Search Results</a>

    <%-- URL Template Parameter (PathVariable) --%>
    <aspectran:url value="/products/{id}">
        <aspectran:param name="id" value="${product.id}"/>
    </aspectran:url>
    ```

### `<aspectran:profile>`
Controls UI components based on the active execution environment profiles.

*   **Practical Examples**:
    ```jsp
    <%-- Show debug tools only in the development environment --%>
    <aspectran:profile expression="dev">
        <div id="debug-toolbar">...</div>
    </aspectran:profile>

    <%-- Include specific scripts only if not in production --%>
    <aspectran:profile expression="!prod">
        <script src="/js/test-helper.js"></script>
    </aspectran:profile>

    <%-- Multiple profile conditions (OR operation) --%>
    <aspectran:profile expression="dev | staging">
        <p>This is a test server.</p>
    </aspectran:profile>
    ```

## 3. Resolving Conflicts with JSP EL

In JSP 2.1 and higher, `#{...}` is recognized as a **Deferred Expression**, which can cause server errors. When using Aspectran token syntax in the `eval` tag, follow these recommendations:

### Recommended: Direct Access
The `eval` tag operates within the current `Activity` context, so you can access objects directly by name without using tokens like `#{currentActivityData}`.

```jsp
<%-- AS-IS (Potential Conflict) --%>
<aspectran:eval expression="#{currentActivityData}.user.name"/>

<%-- TO-BE (Safe and Concise) --%>
<aspectran:eval expression="user.name"/>
```

### Alternative: Escaping the Character
If you must use the `#{...}` syntax, add a backslash (`\`) before the `#` character to prevent the JSP engine from processing it.

```jsp
<aspectran:eval expression="\#{currentActivityData}.user.name"/>
```
