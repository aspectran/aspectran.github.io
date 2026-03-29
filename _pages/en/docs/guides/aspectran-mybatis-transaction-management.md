---
title: MyBatis Transaction Management in Aspectran
subheadline: Core Guides
---

Aspectran manages the lifecycle of MyBatis `SqlSession` through AOP (Aspect-Oriented Programming), providing a declarative and explicit way to handle database transactions. This guide covers the core principles, configuration methods, and advanced techniques such as dynamic routing.

## 1. Background & Principles

### Transaction Management Principle
Aspectran's transactions are tightly bound to the lifecycle of an **`Activity`**, the fundamental unit of request processing. An AOP proxy intercepts method calls and performs the following steps:
1.  **Before**: Creates a `SqlSessionAdvice` instance and binds it to the current `Activity` context. **Note: The actual DB connection is not opened yet (Lazy Opening).**
2.  **Logic**: Executes the business logic. A `SqlSession` is lazily opened only when a DB operation is actually requested.
3.  **After**: Calls `commit()` if the logic completes successfully and a session was opened.
4.  **Exception**: Performs `rollback()` if an exception occurs and a session was active.
5.  **Finally**: Safely closes the used `SqlSession` and resets connection states (e.g., read-only flag).

### Intelligent Routing & Session Reuse
In a Master-Slave architecture, Aspectran provides an intelligent routing strategy:
*   **Consistency First**: If a writable (Master) session is already open in the current activity, Aspectran will reuse it even for read-only operations. This ensures that uncommitted changes are visible and reduces connection overhead.
*   **Efficiency**: DB connections are only established when necessary. Management methods like `getMapper()` or `getConfiguration()` do not trigger a session open.

## 2. Dynamic Routing (Read-Write Splitting)

Automatically separates Read-Only and Writable sessions based on method names, optimized for Master-Slave database architectures.

```java
@Component
@Bean(id = "sqlSession")
public class AppSqlSession extends SqlSessionAgent {
    public AppSqlSession() {
        // (Writable Aspect ID, Read-Only Aspect ID)
        super("txAspect", "readOnlyAspect");
    }
}
```
*   **Intelligent Routing**: If a writable session (`txAspect`) is already open, it is prioritized even for read-only operations to prevent unnecessary session creation.
*   **ReadOnly**: Triggered for method calls matching the `select*` pattern.
*   **Writable**: Triggered for all other modification methods.
*   **Exclusion**: Management methods (`getMapper`, `getConnection`, etc.) are excluded from automatic session opening to prevent redundant connections.

## 3. Explicit Aspect Definition

The standard approach where developers create a dedicated Aspect class to gain fine-grained control over transaction behavior.

### Flexibility: Eager vs. Lazy Opening
When defining an explicit aspect, you have the flexibility to choose the session opening strategy. **Note that the `@Before` method must be defined to activate the transaction context, even when using lazy opening.**

*   **Lazy Opening (Recommended)**: Define the `@Before` method but leave it empty (or omit the `super.open()` call). this method acts as a trigger to instantiate the transaction session and bind it to the Activity, while postponing the actual DB connection until an operation is requested.
*   **Eager Opening**: Explicitly call `super.open()` in the `@Before` method. This allows you to verify the database connection status immediately before executing business logic (Fail-Fast).

### Example: Single Writable Transaction
```java
@Component
@Bean(lazyDestroy = true)
@Scope(ScopeType.PROTOTYPE)
@Aspect(id = "txAspect")
@Joinpoint(pointcut = "+: **@sqlSession")
public class ConsoleTxAspect extends SqlSessionAdvice {

    @Autowired
    public ConsoleTxAspect(@Qualifier("sqlSessionFactory") SqlSessionFactory factory) {
        super(factory);
        setIsolationLevel(TransactionIsolationLevel.READ_COMMITTED);
    }

    @Before
    public void before() {
        // Required: The method must be defined to activate the transaction.
        // Option 1: Lazy Opening (Leave empty)
        // Option 2: Eager Opening (Call super.open())
    }

    @After public void commit() { super.commit(); }
    @ExceptionThrown public void rollback() { super.rollback(); }
    @Finally public void close() { super.close(); }
}
```

## 4. Pointcut Pattern Examples

Aspectran pointcuts use `+:` (include) and `-:` (exclude) prefixes.

*   **Target Specific Bean ID**: `+: **@sqlSession`
*   **Target Specific Class**: `+: **@class:com.example.db.MemberDao`
*   **Nested Tracking**: Aspectran uses an internal stack to track nested transactions, ensuring the innermost transaction settings are prioritized.

## 5. Handling Multiple SqlSessionFactories

If your application connects to multiple databases and has multiple `SqlSessionFactory` beans in the context, you must specify which factory to use in your `SqlSessionAgent`.

```java
@Component
@Bean(id = "appmonSqlSession")
public class AppMonSqlSession extends SqlSessionAgent {
    public AppMonSqlSession() {
        super("appmonTxAspect");
        // Explicitly specify the bean ID of the SqlSessionFactory to use
        setSqlSessionFactoryBeanId("appmonSqlSessionFactory");
    }
}
```
If not specified explicitly, an `IllegalStateException` will be thrown if there is no unique `SqlSessionFactory` in the context.

## Appendix: Transaction Management for different ExecutorTypes

MyBatis supports three execution modes: `SIMPLE`, `BATCH`, and `REUSE`. In Aspectran, you can define a separate `SqlSessionAgent` for each mode and integrate them using the `SqlMapperProvider`.

### 1. Defining SqlSessionAgent for each ExecutorType

Write `SqlSessionAgent` classes for each execution mode.

```java
// SIMPLE mode (Default)
@Component
@Bean(id = "simpleSqlSession", lazyDestroy = true)
public class SimpleSqlSession extends SqlSessionAgent {
    public SimpleSqlSession() {
        super("simpleTxAspect");
    }
}

// BATCH mode (Optimized for bulk inserts/updates)
@Component
@Bean(id = "batchSqlSession", lazyDestroy = true)
public class BatchSqlSession extends SqlSessionAgent {
    public BatchSqlSession() {
        super("batchTxAspect");
        setExecutorType(ExecutorType.BATCH);
    }
}

// REUSE mode (Reuses PreparedStatements)
@Component
@Bean(id = "reuseSqlSession", lazyDestroy = true)
public class ReuseSqlSession extends SqlSessionAgent {
    public ReuseSqlSession() {
        super("reuseTxAspect");
        setExecutorType(ExecutorType.REUSE);
    }
}
```

### 2. Implementing SqlMapperProvider

Implement the `SqlMapperProvider` interface to conveniently use multiple session types in your DAOs.

```java
@Component
@Bean("sqlMapperProvider")
public class AppSqlMapperProvider implements SqlMapperProvider {

    private final SqlSession simpleSqlSession;
    private final SqlSession batchSqlSession;
    private final SqlSession reuseSqlSession;

    @Autowired
    public AppSqlMapperProvider(
            @Qualifier("simpleSqlSession") SqlSession simpleSqlSession,
            @Qualifier("batchSqlSession") SqlSession batchSqlSession,
            @Qualifier("reuseSqlSession") SqlSession reuseSqlSession) {
        this.simpleSqlSession = simpleSqlSession;
        this.batchSqlSession = batchSqlSession;
        this.reuseSqlSession = reuseSqlSession;
    }

    @Override public SqlSession getSimpleSqlSession() { return simpleSqlSession; }
    @Override public SqlSession getBatchSqlSession() { return batchSqlSession; }
    @Override public SqlSession getReuseSqlSession() { return reuseSqlSession; }
}
```

### 3. Usage in DAOs

You can choose the execution mode through `SqlMapperAccess` or `SqlMapperProvider` depending on the situation.

```java
@Component
public class MemberDao extends SqlMapperAccess<MemberMapper> {

    @Autowired
    public MemberDao(SqlMapperProvider provider) {
        super(provider);
    }

    public void insertLargeVolume(List<Member> members) {
        // Use the BATCH mode mapper for bulk processing
        MemberMapper mapper = batchMapper();
        for (Member m : members) {
            mapper.insertMember(m);
        }
        // Manual control is also possible, e.g., batchSession().flushStatements()
    }

    public Member findMember(Long id) {
        // Use the SIMPLE mode for typical queries (Default)
        return mapper().selectMember(id);
    }
}
```

## Appendix: Writing Mappers and DAOs

### 1. Defining the Mapper Interface
```java
@Mapper
public interface MemberMapper {
    Member selectMember(Long id);
    int insertMember(Member member);
}
```

### 2. Implementing the DAO Class
Using `SqlMapperAccess` simplifies the implementation by automatically resolving the mapper type.

```java
@Component
@Bean("memberDao")
public class MemberDao extends SqlMapperAccess<MemberMapper> implements MemberMapper {

    @Autowired
    public MemberDao(SqlMapperProvider provider) {
        super(provider);
    }

    @Override
    public Member selectMember(Long id) {
        // Reuses Master session if already in a write transaction,
        // otherwise opens a Slave session.
        return mapper().selectMember(id);
    }

    @Override
    public int insertMember(Member member) {
        return mapper().insertMember(member);
    }
}
```