---
title: Aspectran JSP Tag Library Guide
subheadline: Core Guides
---

The Aspectran JSP Tag Library provides a comprehensive suite of custom tags that seamlessly bridges the Aspectran framework with JSP view technologies. It simplifies expression evaluation, multi-language message handling, URL creation, environment-based content filtering, and robust HTML/JavaScript escaping.

Fully compliant with Jakarta EE 10 specifications and the Apache Jasper JSP compilation engine, this library allows developers to leverage AsEL (Aspectran Expression Language) and token mechanisms flexibly and safely within JSP views.

## 1. Tag Library Declaration

To use Aspectran tags, include the following directive at the top of your JSP file:

```jsp
<%@ taglib prefix="aspectran" uri="aspectran.tags" %>
```

### Backward Compatibility (Legacy URI Support)
The legacy namespace `http://aspectran.com/tags`, widely used in earlier projects, remains fully supported through bidirectional alias mapping in both Undertow ([`TowTldScanner`](https://github.com/aspectran/aspectran/blob/master/with-undertow/src/main/java/com/aspectran/undertow/server/servlet/TowTldScanner.java)) and Jetty ([`JettyTldScanner`](https://github.com/aspectran/aspectran/blob/master/with-jetty/src/main/java/com/aspectran/jetty/server/servlet/JettyTldScanner.java)). Existing JSP code functions properly on the latest Aspectran runtime without any code modifications.

```jsp
<%-- Legacy taglib directives continue to work seamlessly --%>
<%@ taglib prefix="aspectran" uri="http://aspectran.com/tags" %>
```

### Recommended Usage with Jakarta EE 10 JSTL
In modern Jakarta EE 10 environments, standard JSTL tags use the new `jakarta.tags.*` URI scheme. The recommended header setup is as follows:

```jsp
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<%@ taglib prefix="aspectran" uri="aspectran.tags" %>
```

## 2. Complete Tag Reference

The Aspectran JSP Tag Library ([`aspectran.tld`](https://github.com/aspectran/aspectran/blob/master/web-servlet/src/main/resources/com/aspectran/web/servlet/support/tags/aspectran.tld)) provides the following tags:

| Tag Name | Description | Tag Handler Class |
| :--- | :--- | :--- |
| `<aspectran:eval>` | Evaluates an AsEL expression and either outputs the result or assigns it to a variable | [`EvalTag`](https://github.com/aspectran/aspectran/blob/master/web-servlet/src/main/java/com/aspectran/web/servlet/support/tags/HtmlEscapeTag.java) |
| `<aspectran:message>` | Retrieves localized messages from the configured `MessageSource` by message code | [`MessageTag`](https://github.com/aspectran/aspectran/blob/master/web-servlet/src/main/java/com/aspectran/web/servlet/support/tags/MessageTag.java) |
| `<aspectran:argument>` | Passes dynamic arguments to an enclosing `<aspectran:message>` tag | [`ArgumentTag`](https://github.com/aspectran/aspectran/blob/master/web-servlet/src/main/java/com/aspectran/web/servlet/support/tags/ArgumentTag.java) |
| `<aspectran:url>` | Generates URLs with automatic context path resolution and URL template parameter support | [`UrlTag`](https://github.com/aspectran/aspectran/blob/master/web-servlet/src/main/java/com/aspectran/web/servlet/support/tags/UrlTag.java) |
| `<aspectran:param>` | Passes query or path template parameters to an enclosing `<aspectran:url>` tag | [`ParamTag`](https://github.com/aspectran/aspectran/blob/master/web-servlet/src/main/java/com/aspectran/web/servlet/support/tags/ParamTag.java) |
| `<aspectran:profile>` | Conditionally renders enclosed content based on active environment profile expressions | [`ProfileTag`](https://github.com/aspectran/aspectran/blob/master/web-servlet/src/main/java/com/aspectran/web/servlet/support/tags/ProfileTag.java) |
| `<aspectran:token>` | Directly evaluates an individual Aspectran token (bean, parameter, property, etc.) | [`TokenTag`](https://github.com/aspectran/aspectran/blob/master/web-servlet/src/main/java/com/aspectran/web/servlet/support/tags/TokenTag.java) |
| `<aspectran:htmlEscape>` | Sets the page-wide default HTML escape behavior for subsequent tags | [`HtmlEscapeTag`](https://github.com/aspectran/aspectran/blob/master/web-servlet/src/main/java/com/aspectran/web/servlet/support/tags/HtmlEscapeTag.java) |
| `<aspectran:escapeBody>` | Escapes its enclosed body content using HTML and/or JavaScript escaping rules | [`EscapeBodyTag`](https://github.com/aspectran/aspectran/blob/master/web-servlet/src/main/java/com/aspectran/web/servlet/support/tags/EscapeBodyTag.java) |

### 2.1. `<aspectran:eval>`
Evaluates an AsEL (Aspectran Expression Language) expression and prints the result or assigns it to a scoped variable. Powered by `AselExpressionPreprocessor`, it supports safe navigation, Elvis operators, collection projections, and selection filters.

* **Attributes**:
  * `expression` (required): The AsEL expression string to evaluate.
  * `var` (optional): Variable name to export the evaluated result to. If omitted, the output is written directly to the JSP writer.
  * `scope` (optional): The scope where `var` is stored (`page`, `request`, `session`, `application`). Defaults to `page`.
  * `htmlEscape` (optional): Boolean flag specifying whether to HTML-escape the string output. Overrides the page default.
  * `javaScriptEscape` (optional): Boolean flag specifying whether to JavaScript-escape the string output. Defaults to `false`.

#### **Preprocessor Supported Operators**

1. **Safe Navigation (`?.`)**: Validates nullability before dereferencing child properties.
   ```jsp
   <%-- Returns null cleanly without NullPointerException if user or cart is null --%>
   <aspectran:eval expression="user?.cart?.numberOfItems"/>
   ```
2. **Elvis Operator (`?:`)**: Provides a fallback value when the expression evaluates to `null`.
   ```jsp
   <%-- Outputs 0 if the expression result is null --%>
   <aspectran:eval expression="user?.cart?.numberOfItems ?: 0"/>
   ```
3. **Collection Selection (`.?[...]`)**: Filters items in a collection matching a boolean predicate.
   ```jsp
   <%-- List of products whose price is 100 or greater --%>
   <aspectran:eval expression="products.?[price >= 100]"/>
   ```
4. **Collection Projection (`.![...]`)**: Extracts a property from each element in a collection to create a new list.
   ```jsp
   <%-- A list containing only product names --%>
   <aspectran:eval expression="products.![name]"/>
   ```
5. **First/Last Selection (`.^[...]`, `.$[...]`)**: Selects the first or last element matching a given condition.
   ```jsp
   <%-- The first product in the 'Electronics' category --%>
   <aspectran:eval expression="products.^[category == 'Electronics']"/>
   ```
6. **Matches Operator (`matches`)**: Evaluates whether a string matches a regular expression pattern.
   ```jsp
   <aspectran:eval expression="user.email matches '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$'"/>
   ```
7. **Type Operator (`T(...)`)**: Accesses static class members, constants, or methods.
   ```jsp
   <aspectran:eval expression="T(java.lang.Math).PI"/>
   <aspectran:eval expression="T(com.example.Constants).DEFAULT_PAGE_SIZE"/>
   ```

### 2.2. `<aspectran:message>` & `<aspectran:argument>`
Retrieves internationalized messages from Aspectran's `MessageSource`. It supports dynamic argument binding, variable assignment, and contextual HTML/JavaScript escaping.

* **`<aspectran:message>` Attributes**:
  * `code` (optional): Message lookup key.
  * `text` (optional): Default text to output if the code cannot be resolved.
  * `arguments` (optional): Message format arguments. Can be a comma-delimited string, a single object, or an object array.
  * `argumentSeparator` (optional): Delimiter character for splitting `arguments` strings. Defaults to a comma (`,`).
  * `var` (optional): Variable name to store the resolved message.
  * `scope` (optional): Scope for `var` (`page`, `request`, `session`, `application`).
  * `htmlEscape` (optional): Sets whether to HTML-escape the message text.
  * `javaScriptEscape` (optional): Sets whether to JavaScript-escape the message text.

* **`<aspectran:argument>` Attributes**:
  * `value` (optional): Argument value passed to the enclosing `<aspectran:message>`. May also be provided as tag body content.

#### **Practical Examples**
```jsp
<%-- 1. Simple message key resolution --%>
<aspectran:message code="label.username"/>

<%-- 2. Passing dynamic arguments via attribute --%>
<aspectran:message code="msg.welcome" arguments="${user.name}"/>

<%-- 3. Supplying multiple arguments via nested argument tags --%>
<aspectran:message code="order.confirmation">
    <aspectran:argument value="${order.id}"/>
    <aspectran:argument value="${order.formattedTotalAmount}"/>
</aspectran:message>

<%-- 4. Providing default text when code is missing --%>
<aspectran:message code="missing.label" text="Default fallback message."/>

<%-- 5. Storing message in a variable for reuse --%>
<aspectran:message code="page.title" var="pageTitle" scope="request"/>
<title>${pageTitle}</title>

<%-- 6. Safe message injection inside JavaScript blocks --%>
<script>
    const alertMsg = '<aspectran:message code="alert.delete.confirm" javaScriptEscape="true"/>';
    if (confirm(alertMsg)) {
        // proceed with deletion
    }
</script>
```

### 2.3. `<aspectran:url>` & `<aspectran:param>`
Generates relative or absolute URLs while automatically prepending the servlet context path. It provides built-in query parameter encoding and URL path template (`{param}`) substitution.

* **`<aspectran:url>` Attributes**:
  * `value` (required): Target URL path. May contain `{paramName}` placeholders.
  * `context` (optional): Path to a remote web application context. Defaults to the current context.
  * `var` (optional): Variable name to store the generated URL. Outputs to the writer if omitted.
  * `scope` (optional): Scope for `var` (`page`, `request`, `session`, `application`). Defaults to `page`.
  * `htmlEscape` (optional): Whether to HTML-escape the generated URL.
  * `javaScriptEscape` (optional): Whether to JavaScript-escape the generated URL.

* **`<aspectran:param>` Attributes**:
  * `name` (required): Parameter name. If matching a `{name}` template in `value`, it replaces the placeholder; otherwise, it is appended as a query parameter (`?name=value`).
  * `value` (optional): Parameter value, provided either as an attribute or tag body content.

#### **Practical Examples**
```jsp
<%-- 1. Simple URL with automatic context path resolution --%>
<a href="<aspectran:url value="/main"/>">Go Home</a>

<%-- 2. URL Path Template (PathVariable) substitution --%>
<%-- Result: /myapp/products/P10023?view=detail --%>
<aspectran:url value="/products/{id}" var="productUrl">
    <aspectran:param name="id" value="${product.id}"/>
    <aspectran:param name="view" value="detail"/>
</aspectran:url>
<a href="${productUrl}">Product Details</a>

<%-- 3. Automatic query parameter URL encoding --%>
<aspectran:url value="/search" var="searchUrl">
    <aspectran:param name="keyword" value="Aspectran & JSTL"/>
    <aspectran:param name="page" value="1"/>
</aspectran:url>
<a href="${searchUrl}">Search</a>
```

### 2.4. `<aspectran:profile>`
Conditionally renders JSP blocks depending on whether the active runtime environment matches the given Aspectran profile expression.

* **Attributes**:
  * `expression` (required): Profile expression string. Supports single profile names (`dev`), negations (`!prod`), logical OR (`dev | staging`), and logical AND (`dev & test`).

#### **Practical Examples**
```jsp
<%-- 1. Display debug tools only in development environments --%>
<aspectran:profile expression="dev">
    <div id="debug-toolbar" class="alert alert-warning">
        <strong>Debug Mode:</strong> Active Translet: ${translet.name}
    </div>
</aspectran:profile>

<%-- 2. Load mock scripts only when outside production --%>
<aspectran:profile expression="!prod">
    <script src="/assets/js/mock-api-helper.js"></script>
</aspectran:profile>

<%-- 3. Display notification banners in dev or staging --%>
<aspectran:profile expression="dev | staging">
    <div class="banner">Connected to staging test server.</div>
</aspectran:profile>
```

### 2.5. `<aspectran:token>`
Evaluates individual Aspectran token expressions directly inside JSP pages and outputs or assigns the result.

* **Attributes**:
  * `type` (required): The token category to evaluate:
    * `bean`: Resolves a bean or accesses its properties/methods from the Aspectran bean registry
    * `parameter`: Extracts an HTTP request parameter
    * `attribute`: Extracts a request, session, or application attribute
    * `property`: Reads a property from the Aspectran environment (`environment`)
    * `template`: Evaluates a template token string
    * `text`: Evaluates a text token
  * `expression` (required): Token name or expression body to evaluate.
  * `var` (optional): Variable name to export the evaluated value to.
  * `scope` (optional): Target scope for `var`.
  * `htmlEscape` / `javaScriptEscape`: Escaping behavior flags.

#### **Practical Examples**
```jsp
<%-- 1. Read an Aspectran environment property directly --%>
<p>Site Base URL: <aspectran:token type="property" expression="site.baseUrl"/></p>

<%-- 2. Bind a bean property/method call to a scoped variable --%>
<aspectran:token type="bean" expression="siteConfigBean.supportEmail" var="supportEmail"/>
<a href="mailto:${supportEmail}">Contact Support</a>

<%-- 3. Safely output a request parameter with HTML escaping --%>
<aspectran:token type="parameter" expression="searchKeyword" htmlEscape="true"/>
```

### 2.6. `<aspectran:htmlEscape>` & `<aspectran:escapeBody>`
Provides dedicated escaping facilities to safeguard JSP pages against Cross-Site Scripting (XSS) and injection vulnerabilities.

#### **`<aspectran:htmlEscape>`**
Configures the default HTML escape setting for the current JSP page.
* `defaultHtmlEscape` (required): When set to `true`, all subsequent `<aspectran:message>`, `<aspectran:eval>`, and `<aspectran:token>` tags automatically apply HTML escaping unless explicitly overridden.

```jsp
<%-- Place at the top of the page to enforce default HTML escaping --%>
<aspectran:htmlEscape defaultHtmlEscape="true"/>
```

#### **`<aspectran:escapeBody>`**
Applies HTML and/or JavaScript escaping to the enclosed body content.
* `htmlEscape` (optional): Escapes HTML characters (`<`, `>`, `&`, `"`, `'`).
* `javaScriptEscape` (optional): Escapes JavaScript string literals (quotes, backslashes, line breaks).

```jsp
<%-- Apply HTML escaping to dynamic content --%>
<div class="user-comment">
    <aspectran:escapeBody htmlEscape="true">
        User input: <script>alert('xss');</script>
    </aspectran:escapeBody>
</div>

<%-- Safe embedding inside inline script variables --%>
<script>
    const userBio = "<aspectran:escapeBody javaScriptEscape="true">${user.bio}</aspectran:escapeBody>";
</script>
```

## 3. Resolving Conflicts with JSP EL

In JSP 2.1 and later Servlet containers, `#{...}` syntax is interpreted as a JSF **Deferred Expression**, which can trigger syntax parsing exceptions at runtime. When writing Aspectran token expressions within `<aspectran:eval>`, adhere to the following recommendations:

### Recommended: Direct Object Access
Because `<aspectran:eval>` executes inside the current Aspectran `Activity` context, you can access context objects directly by name without wrapping them in `#{...}` tokens.

```jsp
<%-- AS-IS: Risk of Deferred Expression conflict --%>
<aspectran:eval expression="#{currentActivityData}.user.name"/>

<%-- TO-BE (Recommended): Clean, safe, and direct --%>
<aspectran:eval expression="user.name"/>
```

### Alternative: Escaping with Backslash (`\#{...}`)
If you specifically need to retain literal `#{...}` syntax inside an expression string, prepend a backslash (`\`) before `#` to prevent the JSP engine from parsing it as a deferred expression.

```jsp
<aspectran:eval expression="\#{currentActivityData}.user.name"/>
```

## 4. Web Server Environment Integration

Both Aspectow (Undertow) and Aspectran with Jetty automatically detect and configure `aspectran.tld` during application startup:

* **Classpath Auto-Scanning**: `com/aspectran/web/servlet/support/tags/aspectran.tld` located in `aspectran-web-servlet.jar` is discovered automatically. Manual `<taglib>` entries in `web.xml` or server configuration files are completely unnecessary.
* **Dual URI Resolution**: Whether a JSP references `aspectran.tags` or legacy `http://aspectran.com/tags`, the scanner transparently links to the same tag definition.
* **Out-of-the-Box JSTL Integration**: Standard GlassFish JSTL tags (`jakarta.servlet.jsp.jstl-3.0.1.jar`) for `c`, `fmt`, `fn`, and other libraries are scanned from the classpath and ready for immediate use.
