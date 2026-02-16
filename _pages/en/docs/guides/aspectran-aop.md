---
title: "Aspectran AOP: Features & Architecture"
subheadline: Core Guides
---

**Aspect-Oriented Programming (AOP)** is a key technique for reducing complexity by separating **Cross-cutting Concerns**—such as logging, security, and transactions—from core business logic.

**Spring AOP** offers powerful and granular control by combining bean method interception with AspectJ's extensive expression language. However, this flexibility can sometimes lead to complex configurations and a steeper learning curve.

**Aspectran** takes a more **pragmatic approach**, focusing on structural efficiency rather than exhaustive control. It centers its AOP model around the **lifecycle of the `Activity`**, the core unit of request processing. This allows developers to intuitively manage the flow from request to response, while still providing essential bean method-level interception. Aspectran aims to simplify AOP by optimizing it for the framework's execution flow, offering a lightweight yet effective solution for most enterprise needs.

## Key Features

### 1. Join Point: Execution Timing

Aspectran AOP provides two main categories of Join Points:

*   **Activity Execution (Translet Lifecycle)**: This is Aspectran's most distinct and powerful Join Point. It allows intervention throughout the lifecycle of an `Activity` (which processes requests based on **Translet** rules)—such as before/after execution or on exception. This is ideal for modularizing cross-cutting concerns like logging, transactions, and authentication at the request level.
*   **Bean Method Execution**: Similar to other AOP frameworks, specific Bean method executions can serve as Join Points.

### 2. Pointcut: Target Selection

A Pointcut is an expression that precisely defines where Advice should be applied. In Aspectran, Pointcuts are declaratively defined via the `<joinpoint>` element within an `<aspect>` rule.

*   **APON Format Definition**: The `<joinpoint>` element uses APON (Aspectran Parameter Object Notation) for detailed rule configuration, supporting wildcards (`*`) and regular expressions.

*   **Expression Structure**:
    ```
    transletNamePattern[@beanOrClassPattern][^methodNamePattern]
    ```
    *   **Translet Pattern** (Pre-`@`): Specifies the target Translet name pattern.
    *   **Bean/Class Pattern** (Post-`@`): Specifies the target Bean ID or class name pattern.
    *   **Method Pattern** (Post-`^`): Specifies the target method name pattern.

*   **Examples**:
    *   **Specific Bean in ALL Translets**: Omit Translet pattern, start with `@`.
        ```xml
        <joinpoint>
            pointcut: {
                type: wildcard
                +: @someService^execute*
            }
        </joinpoint>
        ```
    *   **Specific Bean in Specific Translet**:
        ```xml
        <joinpoint>
            pointcut: {
                type: wildcard
                +: /user/list@userService^get*
            }
        </joinpoint>
        ```
    *   **Translet Itself**: Omit Bean/Method patterns to target the Activity execution.
        ```xml
        <joinpoint>
            pointcut: {
                type: wildcard
                +: /user/*
            }
        </joinpoint>
        ```

*   **Inclusion & Exclusion Rules**:
    *   Use the `+` prefix to **include** targets and the `-` prefix to **exclude** them.
    *   Rules are applied in order, allowing for precise control (e.g., include all beans in a package, then exclude specific ones).

### 3. Advice: Action Logic

*   **Types**: Supports 5 standard advice types (`com.aspectran.core.context.rule.type.AdviceType`):
    *   `BEFORE`: Prior to Join Point execution.
    *   `AFTER`: After successful execution.
    *   `AROUND`: Wraps execution (defines both `BEFORE` and `AFTER`).
    *   `THROWN`: On exception.
    *   `FINALLY`: Always executed (regardless of success/failure).

*   **Execution Mechanism**: Advice logic is implemented as a method within a Bean. The invoker depends on the target:
    1.  **Bean Method Advice**: Handled by `com.aspectran.core.component.bean.proxy.AbstractBeanProxy`. It intercepts the call, runs Advice, then invokes the original method.
    2.  **Activity Advice**: Handled by `com.aspectran.core.activity.CoreActivity`. It invokes Advice at specific lifecycle moments (start, end, etc.).

### 4. Aspect: Modularization

*   **`<aspect>` Rule**: Defines the combination of Advice (Bean method) and Pointcut. This encapsulates cross-cutting concerns into a single reusable module.

### 5. Weaving: Selective Dynamic Proxying

Aspectran uses a **runtime Dynamic Proxy** mechanism based on `AbstractBeanProxy`, optimized for performance.

*   **Zero Overhead for Non-Targeted Methods**:
    *   The proxy performs AOP logic **only if the method is annotated with `@Advisable`**.
    *   Methods without this annotation bypass all AOP processing (including Pointcut matching) and immediately invoke the original method, **eliminating unnecessary proxy overhead**.

*   **Proxy Generation**:
    *   **Javassist (Default)**: Flexible proxy creation for classes and interfaces (`JavassistProxyBean`).
    *   **JDK Dynamic Proxy**: Available for Beans implementing interfaces (`JdkDynamicProxyBean`).

### 6. Annotation Support

The `com.aspectran.core.component.bean.annotation` package allows full AOP configuration without XML.

*   `@Component`: Registers the class as a Bean via component scanning. An Aspect class must also have `@Component` (along with `@Aspect`) to be detected.
    *   If used alone on an Aspect, it registers as an implicit Advice Bean without a specific ID.
*   `@Bean`: Used with `@Component` to assign an explicit ID to the Advice Bean (e.g., `@Bean("myAdvice")`).
*   `@Aspect`: Marks a Bean as an Aspect. Attributes: `id`, `order`.
*   `@Joinpoint`: Defines the Pointcut.
*   `@Before`, `@After`, `@Around`, `@Finally`, `@ExceptionThrown`: Maps methods to Advice types.
*   `@Advisable`: Explicitly marks a method for AOP interception.
*   `@Settings`: Injects values into the current `Activity` context.

### 7. Practical Example: Declarative Transactions

AOP is essential for separating transaction logic (begin, commit, rollback) from business logic. Below is a comparison of Annotation vs. XML configuration for MyBatis transactions.

#### 1. Annotation-based Configuration

Define an Aspect extending `SqlSessionAdvice`.

**`SimpleTxAspect.java`**:
```java
import com.aspectran.core.component.bean.annotation.*;
import com.aspectran.core.context.rule.type.ScopeType;
import com.aspectran.mybatis.SqlSessionAdvice;
import org.apache.ibatis.session.SqlSessionFactory;

@Component
@Bean(id = "simpleTxAspect", lazyDestroy = true)
@Scope(ScopeType.PROTOTYPE)
@Aspect(order = 0)
@Joinpoint(pointcut = "+: **@simpleSqlSession")
public class SimpleTxAspect extends SqlSessionAdvice {

    @Autowired
    public SimpleTxAspect(SqlSessionFactory sqlSessionFactory) {
        super(sqlSessionFactory);
    }

    @Before
    public void open() { super.open(); }

    @After
    public void commit() { super.commit(); }

    @Finally
    public void close() { super.close(); }
}
```
*   **Target**: Applies to all public methods of the bean with ID `simpleSqlSession`.

#### 2. XML-based Configuration

Separates the Advice Bean and Aspect definition.

**`mybatis-context.xml`**:
```xml
<!-- 1. Advice Bean -->
<bean id="sqlSessionTxAdvice" class="com.aspectran.mybatis.SqlSessionAdvice" scope="prototype">
    <arguments>
        <item>#{sqlSessionFactory}</item>
    </arguments>
</bean>

<!-- 2. Aspect Definition -->
<aspect id="simpleTxAspect" order="0">
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

#### 3. Service Layer Usage

**1. Define the Transactional Resource**
The `SimpleSqlSession` bean connects to the Aspect via its constructor or ID matching.

```java
@Component
@Bean(id = "simpleSqlSession")
public class SimpleSqlSession extends SqlSessionAgent {
    public SimpleSqlSession() {
        super("simpleTxAspect"); // Links to the Aspect ID
    }
}
```

**2. Apply in Business Logic**
Inject `SimpleSqlSession` into your service.

```java
@Component
public class OrderService {

    private final SimpleSqlSession sqlSession;

    @Autowired
    public OrderService(SimpleSqlSession sqlSession) {
        this.sqlSession = sqlSession;
    }

    public void createOrder(Order order) {
        // Direct database operation.
        // The 'simpleTxAspect' automatically handles the transaction lifecycle around this call.
        sqlSession.insert("app.demo.mapper.OrderMapper.insertOrder", order);
    }
}
```

*   **How it works**:
    1.  When `OrderService` calls `sqlSession.insert(...)`, it invokes the method on the injected `SimpleSqlSession` bean.
    2.  This triggers the `simpleTxAspect` because the bean ID (`simpleSqlSession`) matches the Pointcut (`**: @simpleSqlSession`).
    3.  The `@Before` advice opens the transaction.
    4.  The database operation executes.
    5.  Finally, `@After` commits the transaction, and `@Finally` closes the session.

By leveraging AOP, business logic is perfectly separated from transaction management code, greatly improving maintainability.

### Summary

1.  **Lifecycle Integration**: Uniquely utilizes **Translet/Activity** lifecycles as Join Points.
2.  **High Performance**: Selective proxying via `@Advisable` minimizes overhead.
3.  **Flexibility**: Supports both XML and Annotation styles for diverse architectural needs.
