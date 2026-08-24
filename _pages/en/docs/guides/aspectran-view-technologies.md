---
title: Aspectran View Technologies
subheadline: Core Guides
---

Aspectran provides a highly flexible and unified view processing architecture for generating the final response. At the core of this architecture is the **`ViewDispatcher`**, which abstracts and integrates various view rendering technologies.

In addition to full-page HTML rendering, Aspectran provides the **`<transform>`** response rule and **`TemplateEngine`** integration mechanisms to serialize responses into structured data formats (JSON, XML, TEXT, APON) or render dynamic text from templates.

## 1. View Rendering with ViewDispatcher

In Aspectran, web page rendering is primarily managed through the `<dispatch>` response rule within a `<translet>` (or the `@Dispatch` annotation on Java controller methods) and its corresponding `ViewDispatcher` implementation. The `ViewDispatcher` is responsible for taking the results of request processing and delegating to a specific view technology (JSP, Thymeleaf, FreeMarker, Pebble, etc.) to render the final response.

In a `<dispatch>` rule, the `name` attribute specifies the view name or path to the template file, and the `dispatcher` attribute optionally specifies the `ViewDispatcher` bean responsible for rendering. If `dispatcher` is omitted, the default `ViewDispatcher` defined in the context configuration is used.

### 1.1. Unified Data Model (`ActivityData`) and Lazy Resolution

Aspectran's view rendering engine provides template engines with a unified data model called **[`ActivityData`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/activity/ActivityData.java)**, which acts as a consolidated map facade.

| Order | Data Source | Description & Origin | Template / Token Reference Example |
| :---: | :--- | :--- | :--- |
| **1st** | **Action Results (`ActionResult`)** | Return objects produced by action methods (`action id` or property) | `@{status.hostName}`, `status.hostName` |
| **2nd** | **Request Attributes (`Attribute`)** | Attributes set via `translet.setAttribute("key", value)` | `@{currentMenu}`, `currentMenu` |
| **3rd** | **Request Parameters (`Parameter`)** | Query/form parameters and `${...}` path variables | `${requestedBy}`, `requestedBy` |
| **4th** | **Session Attributes (`Session`)** | Data stored in the user's active session (`SessionAdapter`) | `session.userName` |

Thanks to this unified lazy model, developers do not need to manually copy model objects into intermediate view maps; template files can transparently access any relevant data across the request lifecycle.

### 1.2. Supported View Technologies and Production Configuration

#### a. JSP (JavaServer Pages)

JSP is a classic view technology executed directly by the servlet container. Aspectran provides two dedicated dispatchers for servlet environments:

1. **`JspViewDispatcher`**: Forwards the request to a single JSP file for rendering.
2. **`JspTemplateViewDispatcher`**: Implements the Composite View Pattern by forwarding to a main layout template and passing the content JSP view name dynamically.

**Maven Dependency:**
```xml
<dependency>
    <groupId>com.aspectran</groupId>
    <artifactId>aspectran-web</artifactId>
    <version>9.6.5</version>
</dependency>
```

**Production Configuration Example (Single JSP View & Aspect Global Injection):**
```xml
<!-- 1. JSP View Dispatcher Bean Configuration -->
<bean id="jspViewDispatcher" class="com.aspectran.web.support.view.JspViewDispatcher">
    <property name="prefix" value="/WEB-INF/jsp/"/>
    <property name="suffix" value=".jsp"/>
</bean>

<!-- 2. Aspect to inject default viewDispatcher and web environment settings globally -->
<aspect id="webTransletSettings">
    <joinpoint>
        pointcut: {
            +: /**
        }
    </joinpoint>
    <settings>
        <setting name="characterEncoding" value="utf-8"/>
        <setting name="viewDispatcher" value="jspViewDispatcher"/>
    </settings>
</aspect>

<!-- 3. Clean Dispatch Rule Definition inside Translet -->
<translet name="/user/profile">
    <action id="user" bean="userService" method="getUser"/>
    <dispatch name="user/profile"/>
</translet>
```

**Composite Layout Example (`JspTemplateViewDispatcher`):**
```xml
<!-- Forwards to main-layout.jsp and injects the view name under the 'includePage' attribute -->
<bean id="jspTemplateViewDispatcher" class="com.aspectran.web.support.view.JspTemplateViewDispatcher">
    <property name="template" value="/WEB-INF/jsp/layout/main-layout.jsp"/>
    <property name="includePageKey" value="includePage"/>
    <property name="prefix" value="/WEB-INF/jsp/"/>
    <property name="suffix" value=".jsp"/>
</bean>
```

*Example `/WEB-INF/jsp/layout/main-layout.jsp`:*
```jsp
<%@ page contentType="text/html; charset=UTF-8" %>
<!DOCTYPE html>
<html>
<head><title>My Application</title></head>
<body>
    <jsp:include page="/WEB-INF/jsp/layout/header.jsp"/>
    <main>
        <!-- The specific content JSP is included dynamically -->
        <jsp:include page="${includePage}"/>
    </main>
    <jsp:include page="/WEB-INF/jsp/layout/footer.jsp"/>
</body>
</html>
```

#### b. Thymeleaf

Thymeleaf is a modern server-side Java template engine for both web and standalone environments. It is renowned for its **Natural Templating** capability (allowing templates to remain prototype-valid HTML in browsers) and fragment expressions (`template::fragment`). (Official Website: [https://www.thymeleaf.org/](https://www.thymeleaf.org/))

**Maven Dependency:**
```xml
<dependency>
    <groupId>com.aspectran</groupId>
    <artifactId>aspectran-with-thymeleaf</artifactId>
    <version>9.6.5</version>
</dependency>
```

**Production Configuration Example (Aspect Global Injection & Fragment Usage):**
```xml
<!-- 1. Thymeleaf Template Engine & View Dispatcher Configuration -->
<bean id="thymeleafEngine" class="com.aspectran.thymeleaf.ThymeleafTemplateEngine">
    <property name="templateResolver">
        <bean class="org.thymeleaf.templateresolver.ClassLoaderTemplateResolver">
            <property name="prefix" value="templates/"/>
            <property name="suffix" value=".html"/>
            <property name="templateMode" value="HTML"/>
            <property name="characterEncoding" value="UTF-8"/>
            <property name="cacheable" value="false"/>
        </bean>
    </property>
</bean>

<bean id="thymeleafViewDispatcher" class="com.aspectran.thymeleaf.view.ThymeleafViewDispatcher">
    <argument>#{thymeleafEngine}</argument>
</bean>

<!-- 2. Aspect to inject default viewDispatcher globally -->
<aspect id="webTransletSettings">
    <joinpoint>
        pointcut: {
            +: /**
        }
    </joinpoint>
    <settings>
        <setting name="characterEncoding" value="utf-8"/>
        <setting name="viewDispatcher" value="thymeleafViewDispatcher"/>
    </settings>
</aspect>

<!-- 3. Clean Dispatch Rule Definition inside Translet -->
<translet name="/user/profile">
    <action id="user" bean="userService" method="getUser"/>
    <!-- Default dispatcher (thymeleafViewDispatcher) is automatically applied -->
    <dispatch name="user/profile"/>
    <!-- Fragment specification example: <dispatch name="user/profile :: mainContent"/> -->
</translet>
```

#### c. FreeMarker

FreeMarker is a mature and powerful template engine for generating HTML web pages, complex data processing views, or automated email templates. (Official Website: [https://freemarker.apache.org/](https://freemarker.apache.org/))

**Maven Dependency:**
```xml
<dependency>
    <groupId>com.aspectran</groupId>
    <artifactId>aspectran-with-freemarker</artifactId>
    <version>9.6.5</version>
</dependency>
```

**Production Configuration Example:**
```xml
<!-- 1. FreeMarker Template Engine & View Dispatcher Configuration -->
<bean id="freeMarkerEngine" class="com.aspectran.freemarker.FreeMarkerTemplateEngine">
    <property name="templateLoaderPath" type="array">
        <value>classpath:templates</value>
    </property>
    <property name="defaultEncoding" value="UTF-8"/>
</bean>

<bean id="freeMarkerViewDispatcher" class="com.aspectran.freemarker.view.FreeMarkerViewDispatcher">
    <argument>#{freeMarkerEngine}</argument>
    <property name="suffix" value=".ftl"/>
</bean>

<!-- 2. Aspect to inject default viewDispatcher globally -->
<aspect id="webTransletSettings">
    <joinpoint>
        pointcut: {
            +: /**
        }
    </joinpoint>
    <settings>
        <setting name="characterEncoding" value="utf-8"/>
        <setting name="viewDispatcher" value="freeMarkerViewDispatcher"/>
    </settings>
</aspect>

<!-- 3. Clean Dispatch Rule Definition inside Translet -->
<translet name="/user/profile">
    <action id="user" bean="userService" method="getUser"/>
    <dispatch name="user/profile"/>
</translet>
```

#### d. Pebble

Pebble is a lightweight yet fast template engine inspired by Twig. It features intuitive syntax, template inheritance (`extends`), and an isolated security sandbox. (Official Website: [https://pebbletemplates.io/](https://pebbletemplates.io/))

**Maven Dependency:**
```xml
<dependency>
    <groupId>com.aspectran</groupId>
    <artifactId>aspectran-with-pebble</artifactId>
    <version>9.6.5</version>
</dependency>
```

**Production Configuration Example:**
```xml
<!-- 1. Pebble Template Engine & View Dispatcher Configuration -->
<bean id="pebbleEngine" class="com.aspectran.pebble.PebbleTemplateEngine">
    <argument>
        <bean class="com.aspectran.pebble.PebbleEngineFactoryBean">
            <property name="templateLoaderPath" type="array">
                <value>classpath:templates</value>
            </property>
        </bean>
    </argument>
</bean>

<bean id="pebbleViewDispatcher" class="com.aspectran.pebble.view.PebbleViewDispatcher">
    <argument>#{pebbleEngine}</argument>
    <property name="suffix" value=".peb"/>
</bean>

<!-- 2. Aspect to inject default viewDispatcher globally -->
<aspect id="webTransletSettings">
    <joinpoint>
        pointcut: {
            +: /**
        }
    </joinpoint>
    <settings>
        <setting name="characterEncoding" value="utf-8"/>
        <setting name="viewDispatcher" value="pebbleViewDispatcher"/>
    </settings>
</aspect>

<!-- 3. Clean Dispatch Rule Definition inside Translet -->
<translet name="/user/profile">
    <action id="user" bean="userService" method="getUser"/>
    <dispatch name="user/profile"/>
</translet>
```


### 1.3. Annotation-Based View Dispatching (`@Dispatch`)

In addition to XML `<dispatch>` rules, Aspectran allows declaring view dispatching metadata directly on Java `@Component` controller methods using the **`@Dispatch`** annotation.

```java
package com.aspectran.demo;

import com.aspectran.core.activity.Translet;
import com.aspectran.core.component.bean.annotation.Autowired;
import com.aspectran.core.component.bean.annotation.Component;
import com.aspectran.core.component.bean.annotation.Dispatch;
import com.aspectran.core.component.bean.annotation.RequestToGet;
import org.jspecify.annotations.NonNull;

@Component
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @RequestToGet("/user/profile/${userId}")
    @Dispatch("user/profile") // Specifies view name (uses default ViewDispatcher)
    public User showProfile(@NonNull Translet translet, long userId) {
        User user = userService.getUserById(userId);
        // The returned User object is automatically registered into ActivityData as an Action Result
        return user;
    }

    @RequestToGet("/admin/dashboard")
    @Dispatch(
        name = "admin/dashboard",
        dispatcher = "thymeleafViewDispatcher", // Optional custom dispatcher bean
        contentType = "text/html",
        encoding = "UTF-8"
    )
    public void showDashboard(@NonNull Translet translet) {
        translet.setAttribute("serverTime", System.currentTimeMillis());
    }
}
```

## 2. Data Transformation and Templates in Transform Responses

The `<transform>` response rule converts or serializes action results into structured data formats (JSON, XML, TEXT, APON) rather than rendering full HTML pages. It is commonly used for building RESTful APIs, generating CLI text outputs, or rendering formatted messages.

### 2.1. Supported Transform Formats (`format` attribute)

The `format` attribute of `<transform>` accepts valid identifier aliases defined in [`FormatType`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/context/rule/type/FormatType.java):

| `format` Value | Default Content-Type | Description and Use Cases |
| :--- | :--- | :--- |
| **`json`** | `application/json` | Serializes action results and process outputs into JSON format. Supports `pretty="true"`. |
| **`xml`** | `application/xml` | Serializes action results and process outputs into XML format. Supports `pretty="true"`. |
| **`text`** | `text/plain` | Outputs text response. Can be combined with `<template>` for token replacement. |
| **`apon`** | `text/plain` | Serializes results into Aspectran Parameter Object Notation (APON). |
| **`xsl`** | (Custom) | Transforms XML output using an XSLT stylesheet template. |
| **`custom`** | (Custom) | Executes custom transformation logic via a `CustomTransformer` implementation. |
| **`none`** | `text/plain` | Sends raw string output without transformation. |

> **⚠️ Warning:** Always specify the format name (e.g., `text`, `json`, `xml`) in the `format` attribute. Standard MIME types (e.g., `text/plain`, `text/html`) must be configured separately in the `contentType` attribute.

**Java Annotation Example (`@Transform`):**
```java
@RequestToGet("/api/users")
@Transform(format = FormatType.JSON, pretty = true)
public List<User> getUserList() {
    return userService.getAllUsers();
}
```

### 2.2. `<template>` Elements and Template Engines (`engine` attribute)

Embedding a `<template>` element inside `<transform>` allows generating dynamic text responses. Template content can be embedded directly inline or referenced externally using `file`, `resource`, or `url` attributes.

| `engine` Value | Processing Engine | Description / Use Case |
| :--- | :--- | :--- |
| **(omitted)** or `token` | Aspectran Built-in Token Engine | Replaces native tokens such as `${...}` (params) and `@{...}` (attributes). **(Recommended Default)** |
| `none` | None (Raw Text) | Outputs the template string verbatim without token evaluation (e.g., static JSON/XML). |
| (Custom Bean ID) | External Template Engine Bean | Delegates rendering to a registered `TemplateEngine` bean (e.g., FreeMarker, Thymeleaf). |

### 2.3. Template Text Styles (`style` attribute)

You can control output formatting and whitespace handling using the `style` attribute on `<template>`:

* **`APON ("apon")`**: Enables APON pipe (`|`) syntax, preserving line breaks and indentation cleanly without compromising XML/JSON code formatting.
* **`COMPACT ("compact")`**: Removes unnecessary whitespace and empty lines from JSON/XML output while preserving basic readability.
* **`COMPRESSED ("compressed")`**: Aggressively strips all non-essential whitespace to minimize payload transmission size.

### 2.4. Transform and Template Configuration Examples

**Example 1: Token Template with APON Style**
```xml
<translet name="/system/status">
    <!-- Action must have an ID to register its return value into ActionResult/Attribute, accessible via @{status.hostName} -->
    <action id="status" bean="systemService" method="getStatus"/>
    <transform format="text" contentType="text/plain" encoding="UTF-8">
        <template style="apon">
            |======================================================
            | SYSTEM STATUS REPORT
            |======================================================
            | Host Name     : @{status.hostName}
            | Active Users  : @{status.userCount}
            | Free Memory   : @{status.freeMemory} MB
            | Requested By  : ${requestedBy}
            | Generated At  : #{method:java.lang.System^currentTimeMillis}
            |======================================================
        </template>
    </transform>
</translet>
```

**Example 2: Dynamic Text File Generation via External Engine (FreeMarker)**
```xml
<translet name="/reports/daily-text">
    <action id="report" bean="reportService" method="getDailySummary"/>
    <transform format="text" contentType="text/plain" encoding="UTF-8">
        <!-- Delegates rendering of template-report.ftl to the freeMarkerEngine bean -->
        <template engine="freeMarkerEngine" file="/templates/template-report.ftl"/>
    </transform>
</translet>
```

## 3. Implementing a Custom ViewDispatcher

Because Aspectran's view rendering layer is decoupled from underlying technologies, you can easily implement your own `ViewDispatcher` by extending **[`AbstractViewDispatcher`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/activity/response/dispatch/AbstractViewDispatcher.java)**.

```java
package com.mycompany.view;

import com.aspectran.core.activity.Activity;
import com.aspectran.core.activity.response.dispatch.AbstractViewDispatcher;
import com.aspectran.core.activity.response.dispatch.ViewDispatcherException;
import com.aspectran.core.adapter.ResponseAdapter;
import com.aspectran.core.context.rule.DispatchRule;
import java.io.Writer;
import java.util.Map;

public class CustomViewDispatcher extends AbstractViewDispatcher {

    @Override
    public void dispatch(Activity activity, DispatchRule dispatchRule) throws ViewDispatcherException {
        try {
            // 1. Resolve final view name with configured prefix and suffix
            String viewName = resolveViewName(dispatchRule, activity);

            // 2. Set response Content-Type and encoding
            ResponseAdapter responseAdapter = activity.getResponseAdapter();
            String contentType = (dispatchRule.getContentType() != null) ? dispatchRule.getContentType() : getContentType();
            if (contentType != null) {
                responseAdapter.setContentType(contentType);
            }

            // 3. Obtain unified model data from ActivityData
            Map<String, Object> model = activity.getActivityData();
            Writer writer = responseAdapter.getWriter();

            // 4. Invoke custom template rendering engine
            MyCustomTemplateEngine.render(viewName, model, writer);
            writer.flush();
        } catch (Exception e) {
            throw new ViewDispatcherException("Failed to render custom view", e);
        }
    }
}
```

## 4. Conclusion

Aspectran provides two primary mechanisms for view rendering and response generation:

1. **`ViewDispatcher` (`<dispatch>` / `@Dispatch`)**: Integrates diverse web view technologies (JSP, Thymeleaf, FreeMarker, Pebble) with the unified **`ActivityData`** model to render consistent, production-grade UI screens.
2. **`Transform` & `TemplateEngine` (`<transform>` / `@Transform`)**: Combines structured data serialization (JSON, XML) with built-in and external template engines to generate RESTful API payloads and formatted text outputs.

By leveraging declarative rules or Java annotations, developers can design flexible, high-performance view rendering pipelines tailored to their application requirements.
