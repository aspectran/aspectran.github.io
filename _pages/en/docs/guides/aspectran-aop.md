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
| **Activity Lifecycle AOP**<br/>*(Translet Lifecycle)* | `Activity` (The entire request-processing flow) | Zero proxy overhead; the `CoreActivity` engine directly and sequentially executes aspects according to lifecycle stages (Non-Proxy Core Interception) | Web security response headers, global character encoding and view dispatcher injection, pre/post-processing, authentication/authorization, global exception handling |
| **Bean Proxy AOP**<br/>*(Method Interception)* | Bean method invocations (`JoinpointTargetType.METHOD`) | Runtime dynamic proxy (`AbstractBeanProxy`, Javassist/JDK) intercepts methods annotated with `@Advisable` | Declarative database transactions, business method profiling, audit logging |

### 1.1. Activity Lifecycle AOP (Non-Proxy Core Interception)

In Aspectran, incoming client requests (Web, Daemon, Shell) are executed by an `Activity` instance. The `Activity` engine traverses predefined lifecycle stages from initiation to completion, directly invoking matched aspects without intermediate proxy overhead.

#### a. Normal Execution Flow

The standard execution flow when no unhandled exception occurs during request processing:

| Stage | Lifecycle Stage | Primary Tasks & Responsibilities |
| :---: | :--- | :--- |
| **Stage 1** | **Before Advice** | Executes pre-processing logic, injects `<settings>` (encoding, view dispatcher) and security `<headers>`, validates authentication and authorization |
| **Stage 2** | **Translet Action Execution** | Executes core business actions and process routines, generating response data (`ProcessResult`) |
| **Stage 3** | **After Advice** | Performs post-processing on results, records audit logs |
| **Stage 4** | **Finally Advice** | Always runs at the end regardless of success or failure to clean up resources, close sessions, and release ThreadLocal state |
{: .table-nowrap-1}

#### b. Exception Handling Flow

When an exception occurs during the execution of business actions or Before advice, execution shifts to a strictly ordered sequence designed to preserve data integrity and ensure resource cleanup:

| Order | Lifecycle Stage | Primary Tasks & Responsibilities |
| :---: | :--- | :--- |
| **Step 1** | **Skip After Advice** | Any pending After advice is immediately skipped upon exception. |
| **Step 2** | **Execute Thrown Advice and Exception Rules (`<thrown>`, `<exception>`)** | **Executed before the Finally stage** so that transaction rollback, error logging, and alerts execute safely while database sessions and connections are still open. According to matched exception rules, an error view dispatch (`<dispatch>`) or JSON (`<transform>`) error response is reserved. |
| **Step 3** | **Execute Finally Advice** | Guaranteed to run regardless of success or failure, safely closing resources (e.g., `SqlSession.close()`) and clearing memory. |
| **Step 4** | **Send Exception Response or Rethrow** | Dispatches the reserved exception response (view page or JSON) to the client, or rethrows unhandled exceptions to the container. |
{: .table-nowrap-1}

* **Zero Overhead**: Directly executed within the framework core flow without proxy creation or reflective overhead, ensuring maximum throughput.
* **Structural Flow Control**: Beyond simple method interception, it declaratively injects and manages request context (`Activity`) attributes such as encoding, view dispatchers, security headers, and global exception screens.
* **Guaranteed Transactional Integrity**: Because `THROWN` advice (rollback) always executes before `FINALLY` advice (resource cleanup), transactions are never orphaned or left uncommitted by premature connection closing.

### 1.2. Bean Proxy AOP (Selective Dynamic Proxying)

When applying AOP at the level of individual service methods, Aspectran employs dynamic proxies based on bytecode generation with **Javassist** (`JavassistBeanProxy`) or standard **JDK Dynamic Proxies** (`JdkBeanProxy`).

* **`@Advisable` Selective Proxying (Performance Optimization)**:
  * Dynamic proxies do not indiscriminately intercept every method invocation.
  * Pointcut evaluation and advice chains are triggered **only for methods annotated with `@Advisable` or `@Async`**.
  * Unannotated regular methods bypass the proxy chain entirely, immediately delegating to the target method with **zero proxy overhead**.
* **Consistent Method-Level Lifecycle**:
  * Applies a consistent execution sequence: `Before` ➔ target method execution ➔ `After` (on success) ➔ `Finally`.
  * If an exception occurs within the target method, `After` advice is skipped, registered exception rules are processed first, and `Finally` advice finishes the lifecycle.

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
| **`order`** | Defines the execution precedence among multiple aspects. Lower integer values denote higher priority (default: `Integer.MAX_VALUE`). If two aspects have identical order values, the one declared first takes precedence.<br/>• **Ascending Sorted Insertion**: Aspectran's `AdviceRuleRegistry` sorts both regular advice and `ExceptionRule` instances in strict ascending order (0, 1, 2...).<br/>• **Infrastructure Precedence**: Assigning `order="0"` to infrastructure aspects (e.g., database transaction management) guarantees they run before business aspects, ensuring rollback is executed first without exception. |
| **`isolated`** | Configures **Exception Isolation Mode (`true`/`false`)**.<br/>• **Aspect-Level Isolation**: When `isolated="true"`, any unhandled exception occurring inside the aspect's advice will not halt the main request flow; an error log is recorded and the request proceeds normally. Ideal for non-critical concerns like metrics, telemetry, or notifications.<br/>• **Core-Level Dual Isolation Protection**: During exception handling, even if an individual exception action fails, the framework core isolates the error via internal `try-catch` blocks, ensuring that subsequent exception rules and database rollbacks run to completion. |
| **`disabled`** | When set to `true`, disables the aspect at runtime. |

### 2.2. Precision Joinpoint and Pointcut Control (`<joinpoint>`)

The `<joinpoint>` element precisely specifies where and when advice should be triggered.

```xml
<joinpoint target="activity">
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

| Attribute / Element | Default | Description |
| :--- | :--- | :--- |
| **`target`** | `activity` | Specifies the join point target type.<br/>• **`activity`**: Intercepts the entire request lifecycle stages of Translets (Non-Proxy Core Interception).<br/>• **`method`**: Intercepts bean methods annotated with `@Advisable` via dynamic proxies (Selective Dynamic Proxying). |
| **`methods`** | All | Restricts aspect execution to specific HTTP request methods (`GET`, `POST`, etc.). |
| **`headers`** | All | Evaluates specific client request headers to determine aspect execution. |
| **`pointcut`** | All | Granular filtering combining Translet names, Bean IDs, Class names, and Method patterns. |

#### a. Pointcut Expression Structure
Pointcuts are defined in APON format and follow this pattern:

<div style="display: inline-flex; align-items: center; gap: 6px; font-family: monospace; font-size: 0.95em; margin-bottom: 1rem;">
  <span style="background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.35); padding: 3px 8px; border-radius: 4px;">transletPattern</span>
  <span style="color: #f87171; font-weight: bold; font-size: 1.15em;">@</span>
  <span style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.35); padding: 3px 8px; border-radius: 4px;">beanOrClassPattern</span>
  <span style="color: #f87171; font-weight: bold; font-size: 1.15em;">^</span>
  <span style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); padding: 3px 8px; border-radius: 4px;">methodNamePattern</span>
</div>

A pointcut expression consists of three distinct segments delimited by `@` and `^`, allowing precise targeting combinations. Each segment is optional and can be omitted as needed.

* **Delimiters**:
  * **`@` (Bean/Class Delimiter)**: Separates the Translet pattern from the Bean/Class pattern.
  * **`^` (Method Delimiter)**: Separates the Bean/Class pattern from the Method pattern.

* **Segment Components**:
  * **Translet Pattern** (Pre-`@`): Matches the target Translet name or request URI path pattern (e.g., `/user/**`, `/api/v1/*`). If omitted, all Translets are targeted.
  * **Bean ID Pattern** (Post-`@`, Pre-`^`): Matches the target Bean ID pattern (e.g., `@userService`, `@*Service`). Specifying an identifier without any prefix directive is interpreted as a Bean ID.
  * **Class Pattern** (Post-`@class:`, Pre-`^`): Matches fully-qualified package/class name patterns. To target class types, **the `class:` directive prefix is required** (e.g., `@class:com.mycompany.service.*`, `@class:*.UserServiceImpl`). This is essential for targeting anonymous beans (beans without an ID) or all implementations of a specific package/interface.
  * **Method Pattern** (Post-`^`): Matches the target method name pattern (e.g., `^get*`, `^save*`, `^execute`). If omitted, all methods of the target bean or the entire Activity lifecycle are targeted.

| Pattern Format | Pattern Example | Target Description |
| :--- | :--- | :--- |
| `transletPattern` | `/order/**` | Targets the entire **Activity lifecycle** of all Translets under `/order/` |
| `transletPattern@beanId` | `/user/*@userDao` | Targets the `userDao` bean executing within `/user/*` Translets |
| `transletPattern@class:className` | `/api/**@class:com.mycompany.dao.*` | Targets beans of class types in that package within `/api/**` Translets |
| `transletPattern@beanId^methodName` | `/user/*@userService^get*` | Targets methods starting with `get` on the `userService` bean within `/user/*` Translets |
| `transletPattern@class:className^methodName` | `/translet@class:hello.Simplest^hello*` | Targets methods starting with `hello` on the `hello.Simplest` class within `/translet` requests |
| `@beanId` | `@orderService` | Targets the `orderService` bean across all Translets |
| `@class:className` | `@class:com.mycompany.service.*` | Targets beans under the `com.mycompany.service` package across all Translets |
| `@beanId^methodName` | `@orderService^process*` | Targets methods starting with `process` on the `orderService` bean across all Translets |
| `@class:className^methodName` | `@class:com.mycompany.service.*Service^process*` | Targets methods starting with `process` on all Service classes across all Translets |
| `@^methodName` | `@^execute*` | Targets methods starting with `execute` on all beans regardless of Translet or bean type |

* **Advanced Pattern Matching Features**:
  * **Single-Segment Wildcard (`*`)**: Matches zero or more characters within a single segment excluding delimiters (`/` or `.`) (e.g., `/api/*` matches `/api/users` but not `/api/v1/users`; `com.example.*Service` matches `com.example.UserService`).
  * **Multi-Segment Wildcard (`**`)**: Matches across multiple path or package hierarchy levels including delimiters (e.g., `/user/**` matches `/user/list` and `/user/a/b/c`; `@class:com.mycompany.**Service` matches `com.mycompany.order.OrderService`).
  * **Single-Character Wildcard (`?`)**: Matches exactly one arbitrary character.
  * **Multi-Pattern OR Matching (`|`)**: Connects multiple patterns using the pipeline (`|`) symbol to evaluate OR conditions within a single rule (e.g., `+: /user/**|/order/**@userService|orderService^get*|find*`).
  * **Hierarchical Path and Namespace Matching**: Translet names use the slash (`/`) delimiter, while Bean IDs and class names use the dot (`.`) delimiter for structured matching.

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
    </settings>
</aspect>
```

* **`characterEncoding`**: Sets the default request/response character encoding.
* **`viewDispatcher`**: Assigns the default `ViewDispatcher` bean for the matching scope.

### 2.4. Advice Types and Composition (`<advice>`)

Advice defines the concrete logic executed at a join point. Aspectran supports **4 standard advice types** for clear and predictable flow control:

| Advice Type | Execution Timing | Primary Use Cases |
| :--- | :--- | :--- |
| **`before`** | Prior to join point execution | Input validation, security verification, response header injection, recording start timestamps |
| **`after`** | After successful join point execution | Result data enrichment, audit logging (skipped if an exception is raised) |
| **`thrown`** | Upon exception | Error logging, transaction rollback, alerting (invoked prior to Finally) |
| **`finally`** | Always executed at the end | Resource cleanup, session closing, ThreadLocal clearing, elapsed time profiling |

> 💡 **Clear Lifecycle Control with 4 Standard Advice Stages**\
> Aspectran provides 4 declarative and well-defined lifecycle stages (Before, After, Thrown, Finally). This design cleanly separates transactional boundaries, performance telemetry, security checks, and resource cleanup without proxy chaining overhead or deep call stacks.

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

#### Precise Exception Matching in `<thrown>`
Both `<advice><thrown>` and `<exception><thrown>` support specifying a target exception class via the `type` attribute (e.g., `type="com.mycompany.MyException"`). Aspectran's internal matching engine evaluates both the **type hierarchy (`isAssignableFrom`) and root causes (`getCause()`)** to accurately match the raised exception.

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

#### a. Differences Between `<advice><thrown>` and `<exception><thrown>`

When defining behavior for raised exceptions, Aspectran provides two distinct mechanisms: `<thrown>` inside `<advice>` and `<thrown>` inside `<exception>`. They differ fundamentally in purpose and exception propagation:

| Category | `<advice><thrown>` (Exception Handling Advice) | `<exception><thrown>` (Global Exception Response Mapping) |
| :--- | :--- | :--- |
| **Primary Purpose** | Executes supplementary logic upon exceptions (e.g., error logging, transaction rollback, alerting) | Catches raised exceptions and maps them to dedicated error view pages or JSON error responses |
| **Exception Propagation** | Executes advice logic and **continues to propagate (rethrow) the exception upward** | Completely catches and handles the exception, **returning a normal error response to the client** |
| **Available Actions** | Bean method invocations (`<invoke>`), Action executions (`<action>`), Header injection (`<headers>`) | View dispatching (`<dispatch>`), Data transformations (`<transform>`), Action executions (`<action>`) |
| **Annotation Equivalent** | Advice methods annotated with `@ExceptionThrown` | Translet/Aspect exception handling rule mappings |

#### b. Precedence Rules for Multiple Exception Rules

When multiple exception handling rules are declared, Aspectran resolves them using the following precedence principles:

1. **Local `TransletRule` `<exception>` Takes Precedence**:
   An `<exception>` rule declared directly inside a Translet is always evaluated first. Endpoint-specific business error views take priority over global configurations.
2. **Global Aspect `<exception>` Evaluated in Ascending `order`**:
   Matched aspect exception rules are evaluated in ascending order of their `order` attribute (0, 1, 2...).
3. **Most Specific Exception Type Matches First**:
   Within the same configuration block, rules targeting the most specific exception class (e.g., `UserNotFoundException`) are prioritized over general types (e.g., `Throwable`).
4. **Isolated Completion Guarantee**:
   Even if an exception action fails with a secondary error, the framework core isolates the error in a `try-catch` block, ensuring that subsequent exception rules (such as database rollbacks) continue to run.

## 3. Annotation-Based AOP Configuration

Aspectran allows full AOP configuration using pure Java classes and annotations without XML.

### 3.1. Core AOP Annotations

| Annotation | Description | Key Attributes |
| :--- | :--- | :--- |
| **`@Aspect`** | Declares a class as an Aspect (used alongside `@Component`). | `id`, `order`, `isolated`, `disabled` |
| **`@Joinpoint`** | Configures pointcut matching criteria. | `pointcut`, `target`, `methods`, `headers` |
| **`@Before`** | Designates a Before advice method. | - |
| **`@After`** | Designates an After advice method. | - |
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
    public void onError(Translet translet) {
        Throwable e = translet.getRaisedException();
        logger.error("[Request Error] {} - {}", translet.getRequestName(), e.getMessage(), e);
    }

    @Finally
    public void onFinally(Translet translet) {
        // Perform resource cleanup
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
        <property name="contentType">text/html</property>
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
                    <item name="Content-Security-Policy">default-src 'self'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com;</item>
                </headers>
            </before>
        </advice>
    </aspect>
</aspectran>
```

### Pattern 2: Declarative Transaction Management (`SqlSessionAdvice` + `@Advisable`)

Completely decouples MyBatis `SqlSession` lifecycle management (open, commit, rollback, close) from business logic.

**1. Transaction Aspect Configuration (`mybatis-rules.xml`):**
```xml
<!-- 1. SqlSessionAdvice Bean Definition (prototype scope for fresh per-request instances) -->
<bean id="sqlSessionTxAdvice" class="com.aspectran.mybatis.SqlSessionAdvice" scope="prototype">
    <argument>#{sqlSessionFactory}</argument>
</bean>

<!-- 2. Declarative Transaction Aspect (order="0" for highest priority) -->
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
            <thrown>
                <invoke method="rollback"/>
            </thrown>
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
        // If an exception occurs, after(commit) is skipped, finally/thrown(rollback) safely rolls back, and finally(close) closes the session.
    }
}
```

* **Transactional Safety Mechanism**:
  * On success: `before(open)` ➔ business logic ➔ `after(commit)` ➔ `finally(close)`
  * On exception: `before(open)` ➔ business logic (exception raised) ➔ `after(commit)` automatically skipped ➔ `<finally><thrown>` explicitly executes `rollback` ➔ `finally(close)` safely closes the session and returns connection to pool.

### Pattern 3: Performance Profiling and Audit Logging (Before + Finally Pattern)

Monitors slow API requests without proxy overhead by pairing `Before` and `Finally` advice to calculate elapsed execution time.

```java
package com.aspectran.demo.aspect;

import com.aspectran.core.activity.Translet;
import com.aspectran.core.component.bean.annotation.Aspect;
import com.aspectran.core.component.bean.annotation.Before;
import com.aspectran.core.component.bean.annotation.Component;
import com.aspectran.core.component.bean.annotation.Finally;
import com.aspectran.core.component.bean.annotation.Joinpoint;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
@Aspect(id = "profilingAspect", order = 10, isolated = true)
@Joinpoint(pointcut = "+: /api/**")
public class ProfilingAspect {

    private static final Logger logger = LoggerFactory.getLogger(ProfilingAspect.class);

    @Before
    public long startProfiling(Translet translet) {
        // Return value is automatically saved in the current Activity's beforeAdviceResult keyed by Aspect ID ("profilingAspect")
        return System.currentTimeMillis();
    }

    @Finally
    public void endProfiling(Translet translet) {
        // Retrieve the start timestamp directly from beforeAdviceResult
        Long startTime = translet.getBeforeAdviceResult("profilingAspect");
        if (startTime != null) {
            long elapsedTime = System.currentTimeMillis() - startTime;
            if (elapsedTime > 500) {
                logger.warn("[SLOW API] {} {} took {} ms (status: {})",
                        translet.getRequestMethod(),
                        translet.getRequestName(),
                        elapsedTime,
                        (translet.isExceptionRaised() ? "ERROR" : "SUCCESS"));
            }
        }
    }
}
```

* **Advantages of this Approach**:
  * **Automatic Framework Result Binding**: When a `@Before` advice method returns a value (e.g., `long`), the Aspectran engine automatically stores it in the current `Activity`'s `beforeAdviceResult` under the aspect's ID (`"profilingAspect"`). The `@Finally` method can effortlessly retrieve this value via `translet.getBeforeAdviceResult("profilingAspect")` without manual attribute management.
  * Avoids deep call stacks and proxy chaining overhead by eliminating nested interceptor invocations.
  * Preserves thread safety by storing state in the request context without concurrency issues.
  * Reliably captures elapsed time during `Finally` regardless of whether the request succeeded or failed.

### Pattern 4: Harmonizing Business Error Response Mapping and Transaction Rollback

Configures AOP to return structured RESTful JSON responses upon business exceptions while guaranteeing database transaction rollbacks.

```xml
<aspectran>
    <!-- 1. Transaction Management Aspect (order="0") -->
    <aspect id="txAspect" order="0">
        <joinpoint>
            pointcut: {
                +: /api/**@*Service^*
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
                <thrown>
                    <invoke method="rollback"/>
                </thrown>
                <invoke method="close"/>
            </finally>
        </advice>
    </aspect>

    <!-- 2. Global RESTful Exception Response Aspect (order="1") -->
    <aspect id="apiExceptionAspect" order="1">
        <joinpoint>
            pointcut: {
                +: /api/**
            }
        </joinpoint>
        <exception>
            <!-- Return 400 Bad Request JSON on business validation errors -->
            <thrown type="com.mycompany.common.exception.ValidationException">
                <transform type="json" contentType="application/json; charset=UTF-8">
                    <template>
                        {"code": "INVALID_INPUT", "message": "@{exception.message}"}
                    </template>
                </transform>
            </thrown>
            <!-- Return 500 JSON on unhandled server errors -->
            <thrown type="java.lang.Throwable">
                <action bean="errorAlertService" method="sendAlert"/>
                <transform type="json" contentType="application/json; charset=UTF-8">
                    <template>
                        {"code": "SERVER_ERROR", "message": "An unexpected error occurred."}
                    </template>
                </transform>
            </thrown>
        </exception>
    </aspect>
</aspectran>
```

* Because `txAspect` is configured with `order="0"`, transaction rollback and resource cleanup are guaranteed upon exception before `apiExceptionAspect` (`order="1"`) transforms the exception into a client-friendly JSON response.

## 5. Conclusion

Aspectran AOP replaces bulky proxy configurations with two finely-tuned mechanisms: **Framework Core Lifecycle Interception (`Activity`)** and **Selective Bean Proxying (`@Advisable`)**.

1. **Activity Lifecycle AOP**: Provides zero-overhead declarative control over global environment settings, security headers, authentication, and exception routing.
2. **Bean Proxy AOP**: Selectively applies dynamic proxies only where necessary, efficiently managing transactions and business method profiling.
3. **Guaranteed Lifecycle Integrity**: With 4 standard advice types (Before, After, Thrown, Finally), strict ascending `order` sorting, and core-level dual exception isolation, enterprise applications maintain robust transactional integrity and reliable resource management under all conditions.

This architecture empowers developers to build clean, maintainable, and high-performance enterprise systems with minimal configuration overhead.
