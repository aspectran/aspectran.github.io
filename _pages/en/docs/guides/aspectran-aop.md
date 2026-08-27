---
title: "Aspectran AOP: Features and Architecture"
subheadline: Core Guides
---

**Aspect-Oriented Programming (AOP)** is a foundational technique that reduces code complexity by modularizing **cross-cutting concerns**—such as logging, security, transactions, response header injection, and global exception handling—away from core business logic.

While Spring AOP primarily focuses on proxying bean method invocations, **Aspectran** provides a highly optimized, **pragmatic AOP architecture** built upon two distinct pillars: the **`Activity` Lifecycle** and **Selective Bean Proxying**.

## 1. The Two Architectural Pillars of Aspectran AOP

Aspectran AOP offers two dimensions of join points and interception mechanisms tailored to their respective architectural purposes.

| Architectural Pillar | Target | Mechanism | Primary Use Cases |
| :--- | :--- | :--- | :--- |
| **Activity Lifecycle AOP**<br/>*(Translet Lifecycle)* | `Activity` (The entire request-processing flow) | Zero proxy overhead; the `CoreActivity` engine directly executes aspects according to lifecycle stages (Non-Proxy Core Interception) | Web security response headers, global character encoding and view dispatcher injection, pre/post-processing, authentication/authorization, global exception handling |
| **Bean Proxy AOP**<br/>*(Method Interception)* | Bean method invocations (`JoinpointTargetType.METHOD`) | Runtime dynamic proxy (`AbstractBeanProxy`, Javassist/JDK) intercepts methods annotated with `@Advisable` | Declarative database transactions, business method profiling, audit logging |
{: .text-nowrap}

### 1.1. Activity Lifecycle AOP (Non-Proxy Core Interception)

In Aspectran, incoming client requests (Web, Daemon, Shell) are executed by an `Activity` instance. The `Activity` engine traverses predefined lifecycle stages from initiation to completion, directly invoking matched aspects without intermediate proxy overhead.

| Stage | Lifecycle Stage | Primary Tasks & Responsibilities |
| :---: | :--- | :--- |
| **Stage 1** | **Before Advice** | Executes pre-processing logic, injects `<settings>` (encoding, view dispatcher) and security `<headers>`, validates authentication |
| **Stage 2** | **Translet Action Execution** | Executes core business actions and process routines, generating response data |
| **Stage 3** | **After Advice** | Performs post-processing on results, records audit logs |
| **Stage 4** | **Exception Handling (`<exception>`)** | Catches exceptions and maps them to error view pages (`<dispatch>`) or RESTful JSON (`<transform>`) error responses |
| **Stage 5** | **Finally Advice** | Always runs at the end regardless of success or failure to clean up resources and session states |
{: .text-nowrap}

* **Zero Overhead**: Directly executed within the framework core flow without proxy creation or reflective overhead, ensuring maximum throughput.
* **Structural Flow Control**: Beyond simple method interception, it declaratively injects and manages request context (`Activity`) attributes such as encoding, view dispatchers, security headers, and global exception screens.

### 1.2. Bean Proxy AOP (Selective Dynamic Proxying)

When applying AOP at the level of individual service methods, Aspectran employs dynamic proxies based on bytecode generation with **Javassist** (`JavassistProxyBean`) or standard **JDK Dynamic Proxies** (`JdkDynamicProxyBean`).

* **`@Advisable` Selective Proxying (Performance Optimization)**:
  * Dynamic proxies do not indiscriminately intercept every method invocation.
  * Pointcut evaluation and advice chains are triggered **only for methods annotated with `@Advisable`**.
  * Unannotated regular methods bypass the proxy chain entirely, immediately delegating to the target method with **zero proxy overhead**.

## 2. Core Components of the `<aspect>` Rule

In Aspectran, aspects can be configured declaratively via `<aspect>` XML rules or Java annotations.

### 2.1. Fundamental Aspect Attributes

```xml
<aspect id="sampleAspect" order="0" isolated="true" disabled="false">
    ...
</aspect>
```

| Attribute | Description |
| :--- | :--- |
| **`id`** | Unique identifier of the Aspect. |
| **`order`** | Defines the execution precedence among multiple aspects. Lower integer values denote higher priority (default: `Integer.MAX_VALUE`). If two aspects have identical order values, the one declared first takes precedence. |
| **`isolated`** | Configures **Exception Isolation Mode (`true`/`false`)**. When `isolated="true"`, any unhandled exception occurring inside the aspect's advice will not halt the main request flow; an error log is recorded and the request proceeds normally. Ideal for non-critical cross-cutting concerns like statistics, monitoring, or external telemetry. |
| **`disabled`** | When set to `true`, disables the aspect at runtime. |
{: .text-nowrap}

### 2.2. Precision Joinpoint and Pointcut Control (`<joinpoint>`)

The `<joinpoint>` element precisely specifies where and when advice should be triggered.

```xml
<joinpoint>
    methods: [
        GET
        POST
    ]
    headers: [
        "Accept=text/html"
        "Origin"
    ]
    pointcut: {
        type: wildcard
        +: /user/**@userService^get*
        +: /order/**
        -: /order/temp-*
    }
</joinpoint>
```

#### a. Pointcut Expression Structure
Pointcuts are defined in APON format and follow this pattern:

$$\text{transletPattern}[\text{@beanOrClassPattern}][\text{^methodNamePattern}]$$

* **Translet Pattern** (Pre-`@`): Matches target Translet URI/name patterns (e.g., `/user/**`, `/api/*`).
* **Bean/Class Pattern** (Post-`@`): Matches target Bean IDs or fully-qualified class names (e.g., `@userService`, `@com.mycompany.service.*`).
* **Method Pattern** (Post-`^`): Matches target method names (e.g., `^get*`, `^execute`).

*Pattern Examples:*
* **Specific Bean method in a specific Translet**: `+: /user/list@userService^get*`
* **Specific Bean method across all Translets**: `+: @orderService^process*` (Translet pattern omitted)
* **Specific Translet itself (Activity Lifecycle Target)**: `+: /order/**` (Bean/Method patterns omitted)

#### b. Include (`+:`) and Exclude (`-:`) Rules with Top-Down Evaluation

Aspectran evaluates pointcut rules sequentially in **top-down declaration order**:

* **`+:` (Include)**: Includes matched targets into the AOP execution scope.
* **`-:` (Exclude)**: Excludes matched targets from the AOP execution scope.

> **💡 Note (Order-based Granular Control):**
> You can easily define complex filtering by including a broad range at the top (`+:`) and excluding specific exceptions underneath (`-:`).

**Wildcard Pointcut Example (`type: wildcard`):**
```xml
<joinpoint>
    pointcut: {
        type: wildcard
        +: /api/**                     # 1. Include all endpoints under /api/
        -: /api/auth/login             # 2. Exclude login endpoint from auth check
        -: /api/health-check           # 3. Exclude health check endpoint
        +: /admin/**@adminService^*    # 4. Include adminService methods under /admin/
        -: /admin/**@adminService^get* # 5. Exclude read-only methods starting with 'get'
    }
</joinpoint>
```

**Regular Expression Pointcut Example (`type: regexp`):**
When using regular expressions, separate `include` and `exclude` blocks allow strict regex matching.
```xml
<joinpoint>
    pointcut: {
        type: regexp
        include: {
            translet: "^/api/v[1-9]/.*"
            bean: "^(user|order)Service$"
            method: "^(create|update|delete).*"
        }
        exclude: {
            translet: "^/api/v.*/temp-.*"
            bean: "^.*TestBean$"
        }
    }
</joinpoint>
```

#### c. Request Method (`methods`) Filtering
Restricts aspect execution to specific HTTP request methods such as `GET`, `POST`, `PUT`, `DELETE`, or `PATCH`.

#### d. Request Header (`headers`) Filtering
Controls aspect execution based on client request headers:
* **Header Presence**: `"Origin"` (Matches if the header exists)
* **Exact Value Matching**: `"X-Requested-With=XMLHttpRequest"` (Matches if the header equals the value)
* **Negative Comparison**: `"Accept!=application/json"` (Matches if the header does not contain the value)
* **Complex Media Type Matching (Web Environment)**: Analyzes complex browser `Accept` headers (e.g., `text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8`) with quality factors (q-values) to accurately determine if it is an HTML page request (`"Accept=text/html"`).

### 2.3. Settings Context Injection (`<settings>`)

The `<settings>` element injects configuration parameters directly into the matched Translet's `Activity` context, avoiding redundant per-Translet declarations.

```xml
<aspect id="webTransletSettings">
    <joinpoint>
        pointcut: {
            +: /**
        }
    </joinpoint>
    <settings>
        <setting name="characterEncoding" value="utf-8"/>
        <setting name="viewDispatcher" value="thymeleafViewDispatcher"/>
        <setting name="proxyProtocolAware" value="true"/>
    </settings>
</aspect>
```

* **`characterEncoding`**: Sets the default request/response character encoding.
* **`viewDispatcher`**: Assigns the default `ViewDispatcher` bean for the matching scope.
* **`proxyProtocolAware`**: Enables parsing client IPs/ports behind reverse proxies (Nginx/HAProxy).

### 2.4. Advice Types and Composition (`<advice>`)

Advice defines the concrete logic executed at a join point. Aspectran supports 5 standard advice types:

| Advice Type | Execution Timing | Primary Use Cases |
| :--- | :--- | :--- |
| **`before`** | Prior to join point execution | Input validation, security verification, response header injection |
| **`after`** | After successful join point execution | Result data enrichment, audit logging |
| **`around`** | Surrounds join point execution | Execution profiling, transaction boundaries (begin & commit) |
| **`thrown`** | Upon exception | Error logging, transaction rollback, alerting |
| **`finally`** | Always executed at the end | Resource cleanup, session cleanup, ThreadLocal clearing |

Inside `<advice>`, you can configure bean method invocations (`<invoke>`), action routines (`<action>`), and **declarative response header injection (`<headers>`)**:

```xml
<advice bean="securityAdvice">
    <before>
        <!-- Declarative response header injection -->
        <headers>
            <item name="X-Frame-Options">SAMEORIGIN</item>
            <item name="X-Content-Type-Options">nosniff</item>
            <item name="X-XSS-Protection">1; mode=block</item>
        </headers>
        <!-- Advice bean method execution -->
        <invoke method="checkAuthentication"/>
    </before>
</advice>
```

### 2.5. Global Exception Handling (`<exception>`)

Defining an `<exception>` element within an aspect allows catching specific exceptions globally and mapping them to error view pages or structured RESTful JSON responses.

```xml
<aspect id="globalExceptionAspect">
    <joinpoint>
        pointcut: {
            +: /**
        }
    </joinpoint>
    <exception>
        <!-- Maps specific exception to a dedicated error page -->
        <thrown type="com.mycompany.common.exception.UserNotFoundException">
            <dispatch name="error/user-not-found" contentType="text/html" encoding="UTF-8"/>
        </thrown>
        <!-- Generic fallback for unhandled exceptions -->
        <thrown type="java.lang.Throwable">
            <action bean="errorLogger" method="logError"/>
            <dispatch name="error/500" contentType="text/html" encoding="UTF-8"/>
        </thrown>
    </exception>
</aspect>
```

## 3. Annotation-Based AOP Configuration

Aspectran allows full AOP configuration using pure Java classes and annotations without XML.

### 3.1. Core AOP Annotations

| Annotation | Description | Key Attributes |
| :--- | :--- | :--- |
| **`@Aspect`** | Declares a class as an Aspect (used alongside `@Component`). | `id`, `order`, `isolated`, `disabled` |
| **`@Joinpoint`** | Configures pointcut matching criteria. | `pointcut`, `target`, `methods`, `headers` |
| **`@Before`** | Designates a Before advice method. | - |
| **`@After`** | Designates an After advice method. | - |
| **`@Around`** | Designates an Around advice method. | - |
| **`@Finally`** | Designates a Finally advice method. | - |
| **`@ExceptionThrown`** | Designates an Exception advice method. | `value` (Target exception class) |
| **`@Settings`** | Injects settings into the Activity context. | `name`, `value` |
| **`@Advisable`** | Marks a bean method as a target for Bean Proxy AOP. | - |

### 3.2. Annotation-Based Aspect Implementation Example

```java
package com.aspectran.demo.aspect;

import com.aspectran.core.activity.Activity;
import com.aspectran.core.activity.Translet;
import com.aspectran.core.component.bean.annotation.After;
import com.aspectran.core.component.bean.annotation.Aspect;
import com.aspectran.core.component.bean.annotation.Before;
import com.aspectran.core.component.bean.annotation.Component;
import com.aspectran.core.component.bean.annotation.ExceptionThrown;
import com.aspectran.core.component.bean.annotation.Finally;
import com.aspectran.core.component.bean.annotation.Joinpoint;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
@Aspect(id = "loggingAspect", order = 1, isolated = true)
@Joinpoint(
    pointcut = {
        "+: /api/**",
        "-: /api/health-check"
    }
)
public class LoggingAspect {

    private static final Logger logger = LoggerFactory.getLogger(LoggingAspect.class);

    @Before
    public void beforeRequest(Translet translet) {
        logger.info("[Request Start] {} {}", translet.getRequestMethod(), translet.getRequestName());
    }

    @After
    public void afterRequest(Translet translet) {
        logger.info("[Request Success] {}", translet.getRequestName());
    }

    @ExceptionThrown(Exception.class)
    public void onError(Translet translet, Exception e) {
        logger.error("[Request Error] {} - {}", translet.getRequestName(), e.getMessage(), e);
    }

    @Finally
    public void onFinally(Activity activity) {
        // Resource cleanup logic
    }
}
```

## 4. Production Best Practice Patterns

### Pattern 1: Global Web Security and Environment Auto-Injection

Automatically injects security response headers (CSP, X-Frame-Options) and default `ViewDispatcher` settings for all browser HTML requests.

```xml
<aspectran>
    <!-- 1. Register View Dispatcher Bean -->
    <bean id="thymeleafViewDispatcher" class="com.aspectran.thymeleaf.view.ThymeleafViewDispatcher">
        <argument>#{thymeleafEngine}</argument>
    </bean>

    <!-- 2. Global Web Translet Settings Aspect -->
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
        <advice>
            <before>
                <headers>
                    <item name="X-Frame-Options">SAMEORIGIN</item>
                    <item name="X-Content-Type-Options">nosniff</item>
                    <item name="X-XSS-Protection">1; mode=block</item>
                    <item name="Referrer-Policy">strict-origin-when-cross-origin</item>
                </headers>
            </before>
        </advice>
    </aspect>

    <!-- 3. HTML Browser Request Security Aspect -->
    <aspect id="htmlWebSecuritySettings">
        <joinpoint>
            headers: [
                "Accept=text/html"
            ]
            pointcut: {
                +: /**
            }
        </joinpoint>
        <advice>
            <before>
                <headers>
                    <item name="Content-Type">text/html; charset=utf-8</item>
                    <item name="Content-Security-Policy">default-src 'self'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com;</item>
                </headers>
            </before>
        </advice>
    </aspect>
</aspectran>
```

### Pattern 2: Declarative Transaction Management (`SqlSessionAdvice` + `@Advisable`)

Completely decouples MyBatis `SqlSession` lifecycle management (open, commit, rollback, close) from business logic.

**1. Transaction Aspect Configuration (`mybatis-context.xml`):**
```xml
<!-- 1. SqlSessionAdvice Bean Definition -->
<bean id="sqlSessionTxAdvice" class="com.aspectran.mybatis.SqlSessionAdvice" scope="prototype">
    <argument>#{sqlSessionFactory}</argument>
</bean>

<!-- 2. Transaction Aspect Definition -->
<aspect id="txAspect" order="0">
    <joinpoint>
        pointcut: {
            +: **@simpleSqlSession
        }
    </joinpoint>
    <advice bean="sqlSessionTxAdvice">
        <before>
            <invoke method="open"/>
        </before>
        <after>
            <invoke method="commit"/>
        </after>
        <finally>
            <invoke method="close"/>
        </finally>
    </advice>
</aspect>
```

**2. Transaction Usage in the Service Layer:**
```java
@Component
public class OrderService {

    private final SimpleSqlSession sqlSession;

    @Autowired
    public OrderService(SimpleSqlSession sqlSession) {
        this.sqlSession = sqlSession;
    }

    public void processOrder(Order order) {
        // Calling sqlSession methods automatically triggers txAspect to handle the transaction
        sqlSession.insert("app.demo.mapper.OrderMapper.insertOrder", order);
        sqlSession.update("app.demo.mapper.ItemMapper.updateStock", order.getItemId());
    }
}
```

### Pattern 3: RESTful API Performance Profiling (Around Advice)

Monitors slow API requests using an Around advice with exception isolation.

```java
package com.aspectran.demo.aspect;

import com.aspectran.core.activity.Translet;
import com.aspectran.core.component.bean.annotation.Around;
import com.aspectran.core.component.bean.annotation.Aspect;
import com.aspectran.core.component.bean.annotation.Component;
import com.aspectran.core.component.bean.annotation.Joinpoint;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
@Aspect(id = "profilingAspect", isolated = true)
@Joinpoint(pointcut = "+: /api/**")
public class ProfilingAspect {

    private static final Logger logger = LoggerFactory.getLogger(ProfilingAspect.class);

    @Around
    public Object profile(Translet translet) throws Throwable {
        long startTime = System.currentTimeMillis();
        try {
            // Proceed with the request flow
            return null;
        } finally {
            long elapsedTime = System.currentTimeMillis() - startTime;
            if (elapsedTime > 500) {
                logger.warn("[SLOW QUERY/API] {} took {} ms", translet.getRequestName(), elapsedTime);
            }
        }
    }
}
```

## 5. Conclusion

Aspectran AOP replaces bulky proxy configurations with two finely-tuned mechanisms: **Framework Core Lifecycle Interception (`Activity`)** and **Selective Bean Proxying (`@Advisable`)**.

1. **Activity Lifecycle AOP**: Provides zero-overhead declarative control over global environment settings, security headers, authentication, and exception routing.
2. **Bean Proxy AOP**: Selectively applies dynamic proxies only where necessary, efficiently managing transactions and business method profiling.

This dual-pillar architecture empowers developers to build clean, maintainable, and high-performance enterprise applications with minimal configuration overhead.
