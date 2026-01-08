---
title: Aspectran AOP Feature Analysis
subheadline: User Guides
---

Rather than targeting all method calls in an application like general Spring AOP or AspectJ, Aspectran's AOP has a **unique AOP model that is deeply integrated with the execution flow of its core execution model, the `Activity`, and Bean method calls**. This allows for the implementation of more powerful and structured AOP by using the entire request processing stage or specific method calls as Join Points.

Key features are as follows:

### 1. Join Point (When to intervene?)

Aspectran AOP's Join Points are broadly divided into two categories:

*   **Activity Execution (Translet Execution Unit)**: This is Aspectran's most unique and powerful Join Point. It allows intervention in the entire flow of an `Activity` that processes a request according to a specific **Translet**'s rules, such as before/after execution or when an exception occurs. This makes it highly effective for modularizing common functionalities required throughout request processing, such as logging, transactions, and authentication.
*   **Bean Method Execution**: Similar to other AOP frameworks, the execution of a specific Bean's method can be used as a Join Point.

### 2. Pointcut (Where to apply?)

A Pointcut is an expression that precisely specifies the target to which Advice will be applied. In Aspectran, Pointcuts are declaratively defined through the `<joinpoint>` element within an `<aspect>` rule in the configuration file.

*   **Detailed Definition using APON Format**: Inside the `<joinpoint>` element, you can set very detailed and powerful rules using the APON (Aspectran Parameter Object Notation) format. It is possible to specify multiple targets at once using wildcards (`*`) or regular expressions (regexp).

*   **Structure of a Pointcut Expression**: A pointcut string has the following structure:
    ```
    transletNamePattern[@beanOrClassPattern][^methodNamePattern]
    ```
    *   The part before the `@` delimiter is the **Translet name pattern**. It specifies the name pattern of the target Translet to which the Advice will be applied.
    *   The part after the `@` delimiter is the **Bean ID or class name pattern**.
    *   The part after the `^` delimiter is the **method name pattern**.

*   **Examples of Various Pattern Formats**:
    *   **Targeting a specific Bean in all Translets**: If you omit the Translet name pattern and start with `@`, all Translets become the target.
        ```xml
        <joinpoint>
            pointcut: {
                type: wildcard
                +: @someService^execute*
            }
        </joinpoint>
        ```
    *   **Targeting a specific Bean of a specific Translet**:
        ```xml
        <joinpoint>
            pointcut: {
                type: wildcard
                +: /user/list@userService^get*
            }
        </joinpoint>
        ```
    *   **Targeting a specific Translet itself**: If you do not specify a Bean or method, the execution of the Activity that runs the Translet itself becomes the target.
        ```xml
        <joinpoint>
            pointcut: {
                type: wildcard
                +: /user/*
            }
        </joinpoint>
        ```

*   **Inclusion and Exclusion Rules**: The `+` prefix includes a target, and the `-` prefix creates a rule to exclude a target, allowing for more precise control.

### 3. Advice (What to do?)

*   **Types of Advice**: Supports the 5 types of Advice defined in the `com.aspectran.core.context.rule.type.AdviceType` enum.
    *   `BEFORE`: Before the Join Point execution
    *   `AFTER`: After the Join Point successfully executes
    *   `AROUND`: A convenience feature to define `BEFORE` and `AFTER` Advice together (different from AspectJ's `proceed()`)
    *   `THROWN`: When an exception occurs during Join Point execution
    *   `FINALLY`: Always executed regardless of success or exception
*   **Implementation of Advice**: The Advice logic is implemented as a method of a specific Bean. The entity that calls this Advice method is one of the following two, depending on the target of the Joinpoint:
    1.  **Advice for Bean Method Execution**: In the case of general AOP that intercepts a Bean's method call, `com.aspectran.core.component.bean.proxy.AbstractBeanProxy` is responsible for executing the Advice method. The proxy intercepts the method call, executes the Advice, and then calls the original method.
    2.  **Advice for Activity Execution**: When the execution of the `Activity` itself is the Joinpoint target, `com.aspectran.core.activity.CoreActivity` directly calls the Advice in line with its own execution flow (before starting, after execution, etc.).

    Thus, Aspectran executes Advice at an optimized location depending on the Joinpoint target.

### 4. Aspect (Combination of Advice and Pointcut)

*   **`<aspect>` Rule**: The `<aspect>` rule (`AspectRule.java`) in the configuration file acts as the Aspect. It defines which Advice (Bean method) is applied to which Pointcut.
*   This allows for the encapsulation and management of multiple common functionalities as a single module (Aspect).

### 5. Weaving Mechanism: Intelligent Dynamic Proxy

Aspectran uses a **runtime Dynamic Proxy** to apply AOP. This proxy is based on `AbstractBeanProxy` and operates very efficiently and intelligently.

*   **Performance Optimization with Selective Advice Application**:
    *   Aspectran's AOP proxy does not unconditionally intercept all method calls. Instead, it performs AOP logic only if the method is annotated with `@Advisable`.
    *   A regular method without the annotation completely bypasses AOP-related processing and immediately calls the original method. This **fundamentally eliminates unnecessary proxy overhead**, significantly improving system performance.

*   **Proxy Creation Method**:
    *   **Javassist-based (Default)**: It uses **Javassist** (`JavassistProxyBean.java`) by default to create proxy objects. This method is highly flexible as it can create proxies for regular classes as well as interfaces.
    *   **JDK Dynamic Proxy Support**: If the target Bean implements one or more interfaces, you can choose to use the JDK's native dynamic proxy (`JdkDynamicProxyBean.java`), which does not require a separate library.

### 6. Annotation Support

Through the `com.aspectran.core.component.bean.annotation` package, you can configure various Bean settings, including AOP, using only annotations without XML configuration. The main annotations are as follows:

*   `@Component`: Makes a class a target for component scanning, registering it as a container-managed Bean. An Aspect class must also have `@Component` in addition to `@Aspect` to be automatically recognized through scanning. An Aspect declared with only `@Component` is registered as an implicit Advice Bean without an ID.
*   `@Bean`: Used with `@Component` when you want to give an explicit ID to an Advice Bean. For example, you can specify an ID like `@Bean("myAdviceBean")`.
*   `@Aspect`: Defines that the Bean is an Aspect. You can assign an ID to the Aspect with the `id` attribute and specify the application priority with the `order` attribute (a lower number means higher priority).
*   `@Joinpoint`: Sets the Pointcut that specifies the target to apply the advice to. You can define `target`, `methods`, `pointcut` expressions, etc.
*   `@Settings`: When advice declared as a Joinpoint is applied, it injects setting values into the currently executing `Activity` context. These injected values can be retrieved via the `Activity.getSetting()` method.
*   `@Description`: Adds a description to the Aspect.
*   `@Before`, `@After`, `@Around`, `@Finally`, `@ExceptionThrown`: Used on methods that define each advice type.
*   `@Advisable`: Explicitly declares that the method is one to which AOP advice will be applied.

### 7. Practical AOP Example: Declarative Transactions

One of the most powerful use cases for AOP is **declarative transaction management**. Instead of writing transaction begin, commit, and rollback code directly in the business logic code of the service layer, AOP is used to apply that logic transparently from outside the method.

In Aspectran, you can create a flexible and reusable design by separating the **advice Bean** that contains the actual transaction logic and the **Aspect** that decides when and where to apply it. Here, we will compare annotation-based and XML-based transaction configuration methods using MyBatis integration as an example.

#### 1. Annotation-based Declarative Transaction

As in the `jpetstore` example, you can define an Aspect by extending `SqlSessionAdvice`, which contains the transaction control logic.

**`SimpleTxAspect.java` Example:**
```java
import com.aspectran.core.component.bean.annotation.*;
import com.aspectran.core.context.rule.type.ScopeType;
import com.aspectran.mybatis.SqlSessionAdvice;
import org.apache.ibatis.session.SqlSessionFactory;

/**
 * Aspect for simple transaction processing.
 */
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
    public void open() {
        super.open();
    }

    @After
    public void commit() {
        super.commit();
    }

    @Finally
    public void close() {
        super.close();
    }
}
```

*   **Pointcut Target**: `**: @simpleSqlSession` in `@Joinpoint` means to apply the Advice to all public methods of the Bean with the ID `simpleSqlSession`.

#### 2. XML-based Declarative Transaction

The XML configuration is conceptually the same as the annotation-based approach, but it is characterized by clearly separating the Aspect and the Advice Bean.

**`mybatis-context.xml` Example:**
```xml
<!-- 1. Define the advice Bean that contains the actual transaction logic -->
<bean id="sqlSessionTxAdvice" class="com.aspectran.mybatis.SqlSessionAdvice" scope="prototype">
    <arguments>
        <item>#{sqlSessionFactory}</item>
    </arguments>
</bean>

<!-- 2. simpleTxAspect: Detects the Bean with ID 'simpleSqlSession' -->
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
*   **Separation and Reuse**: You can define the `sqlSessionTxAdvice` Bean, which contains the actual transaction logic, once and reuse it in multiple `<aspect>` configurations.

#### 3. Usage in Service Methods

To use the transaction Aspect defined above, you need to make the service class a Bean that the Aspect's Pointcut detects.

**1. Define the Service Bean to which the transaction will be applied**

Since `SimpleTxAspect` targets the Bean with the ID `simpleSqlSession`, we specify the service Bean's ID as `simpleSqlSession`. This Bean extends `SqlSessionAgent` to conveniently use `SqlSession`.

```java
import com.aspectran.core.component.bean.annotation.Bean;
import com.aspectran.core.component.bean.annotation.Component;
import com.aspectran.mybatis.SqlSessionAgent;

@Component
@Bean(id = "simpleSqlSession")
public class SimpleSqlSession extends SqlSessionAgent {
    public SimpleSqlSession() {
        // In the constructor, specify the ID of the Aspect associated with this Bean.
        super("simpleTxAspect");
    }
}
```

**2. Using `SqlSession` in Business Logic**

Now, in the service class that contains the actual business logic, we receive and use the `SimpleSqlSession` Bean through constructor injection. Instead of using a MyBatis Mapper interface, we perform database operations by directly using the `SqlSession` object.

```java
@Component
public class OrderService {

    private final SimpleSqlSession sqlSession;

    @Autowired
    public OrderService(SimpleSqlSession sqlSession) {
        this.sqlSession = sqlSession;
    }

    public void createOrder(Order order) {
        // Perform database operations by directly using the injected sqlSession object.
        // When this method is called, 'simpleTxAspect' will operate, and the transaction will be managed automatically.
        sqlSession.insert("app.demo.mapper.OrderMapper.insertOrder", order);
    }
}
```
*   **How it works**: When `OrderService` receives the `SimpleSqlSession` Bean and calls a method like `createOrder`, which in turn calls a method of the `sqlSession` object (`insert`, `update`, etc.), the method of the `SimpleSqlSession` Bean is invoked. At this point, since it matches the Pointcut condition of `simpleTxAspect` (`**: @simpleSqlSession`), the AOP advice is applied. The `@Before` advice starts the transaction, and after the method execution finishes, `@After` and `@Finally` handle the commit and session closing, respectively.

By leveraging Aspectran's AOP in this way, you can perfectly separate business logic from transaction processing logic, greatly improving code readability and maintainability.

### Conclusion

Aspectran's AOP can be summarized as follows:

1.  **Translet/Activity-centric Unique AOP**: It effectively separates common functionalities across the entire service by using the request processing unit, the Translet, and the Activity that executes it, as the Join Point.
2.  **Performance and Efficiency**: It eliminates unnecessary overhead through selective proxy application via `@Advisable`.
3.  **Flexible Configuration**: It supports both XML and annotation-based approaches, allowing developers to choose according to the project's characteristics.

Through these features, Aspectran supports the creation of highly maintainable and efficient application structures by perfectly separating system-level services like transactions, security, and logging from business logic.
