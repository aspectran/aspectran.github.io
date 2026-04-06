---
title: MyBatis Transaction Management in Aspectran
subheadline: Practical Guides
---

Aspectran leverages **MyBatis** to efficiently map SQL queries to Java objects and automatically manages the entire transaction lifecycle—from start to finish—through **Aspect-Oriented Programming (AOP)**. This guide provides a detailed explanation of core MyBatis components, such as **SqlSession** and **SqlSessionFactory**, as well as Aspectran's **transaction advice** and **advanced management techniques for different ExecutorTypes**.

## 1. Background and How It Works

### Overview of MyBatis
MyBatis is a **SQL Mapper** framework that separates SQL queries from Java code, managing them via XML files or annotations. It provides full control over complex SQL queries while significantly reducing repetitive JDBC boilerplate code.

### Roles of SqlSession and SqlSessionFactory
*   **SqlSessionFactory**: Acts as a factory for creating `SqlSession` objects. It is created once during application startup based on database connection and MyBatis configuration.
*   **SqlSession**: A single connection session for executing SQL commands. It serves as the unit of a transaction and must be closed after use to prevent resource leaks.

**Integration with Aspectran**: Aspectran automates the opening/closing of `SqlSession` and the execution of `commit`/`rollback` using AOP. This allows developers to focus on business logic and SQL authoring without manual session management.

### Transaction Lifecycle
MyBatis transactions in Aspectran are integrated into the lifecycle of a request processing unit called an **`Activity`**. An AOP proxy intercepts method calls and performs the following steps:
1.  **Initialization (Before)**: `SqlSessionAdvice` is called to set up the transaction environment. It employs a **Lazy Opening** strategy by default, delaying the physical database connection until an actual query is executed.
2.  **Logic Execution (Logic)**: When the first SQL operation is requested via a Mapper, the `SqlSession` is activated and a physical transaction begins.
3.  **Successful Completion (After)**: If logic succeeds and no exceptions occur during execution, the transaction is committed using `commit()` to finalize data changes.
4.  **Exception Handling (Exception)**: If an exception occurs, a `rollback()` is performed immediately to maintain data consistency.
5.  **Resource Cleanup (Finally)**: Regardless of success or failure, the used `SqlSession` is safely closed and resources are returned.

### Intelligent Session Reuse and @Hint
*   **Consistency First**: If a write session is already open in the current request, subsequent read operations reuse it to ensure data consistency.
*   **@Hint Safety**: Using `@Hint(type = "transactional", value = "readOnly: true")` not only routes to a read-only session but also prevents data modifications (INSERT/UPDATE/DELETE) at the session level by throwing an `IllegalStateException`.

## 2. Dynamic Routing (Read-Write Splitting)

In environments where Primary (Write-only) and Replica (Read-only) databases are operated separately for load balancing, Aspectran automatically routes queries to the appropriate database based on the method name.

```java
@Component
@Bean(id = "sqlSession")
public class AppSqlSession extends RoutingSqlSessionAgent {
    public AppSqlSession() {
        // (Primary Aspect ID, Replica Aspect ID)
        super("primaryTxAspect", "replicaTxAspect");
    }
}
```
*   **Routing Logic**: If a primary session (`primaryTxAspect`) is already open, it is prioritized even for read operations to avoid unnecessary session creation.
*   **Replica (Read-only)**: Methods matching the `select*` pattern are routed to the read-only session.
*   **Primary (Write-only)**: All other methods are routed to the write-only session.

## 3. Declarative Constraints via @Hint

Aspectran's hint mechanism allows you to define execution intent directly on service or DAO methods, providing more granular control than method name patterns.

```java
@Service
public class MemberService {

    @Autowired
    private MemberMapper memberMapper;

    @Hint(type = "transactional", value = "readOnly: true")
    public List<Member> getMembers() {
        // This method is routed to the read-only session.
        // If memberMapper.insertMember() is accidentally called here, 
        // an IllegalStateException will occur.
        return memberMapper.selectMemberList();
    }

}
```

## 4. Explicit Aspect Definition

If you need to control transaction behavior more precisely at the code level, you can directly define an Aspect class that inherits from `SqlSessionAdvice`.

### Flexible Transaction Opening Strategies
When defining an explicit Aspect, you can choose a transaction opening strategy that fits your needs. **Note that the `@Before` method must always be defined to activate the transaction context, even when using Lazy Opening.**

*   **Lazy Opening (Recommended)**: Omit the `super.open()` call in the `@Before` method. This activates the transaction context but delays the physical DB connection until the query execution.
*   **Eager Opening**: You **must call `super.open()`** in the `@Before` method. Use this when you need to verify the DB connection status immediately (Fail-Fast) before executing business logic.

### Defining the SqlSession Class
First, define a new `SampleSqlSession` class targeting "sampleTxAspect". If an Aspect with the ID "sampleTxAspect" is not defined when `SampleSqlSession` is initialized, it will be created automatically.
```java
@Component
@Bean(id = "sampleSqlSession", lazyDestroy = true)
public class SampleSqlSession extends DefaultSqlSessionAgent {
    
    public SampleSqlSession() {
        super("sampleTxAspect");
        setSqlSessionFactoryBeanId("sampleSqlSessionFactory");
    }
}
```

### Defining the Aspect Class
Explicitly define the Aspect with the ID "sampleTxAspect" to prevent `SampleSqlSession` from creating it automatically.
```java
@Component
@Bean(lazyDestroy = true)
@Aspect(id = "sampleTxAspect")
@Joinpoint(pointcut = {
        "+: **@sampleSqlSession"
})
public class SampleTxAspect extends SqlSessionAdvice {

    @Autowired
    public SampleTxAspect(@Qualifier("sampleSqlSessionFactory") SqlSessionFactory factory) {
        super(factory);
        // Additional settings like isolation level can be configured
        setIsolationLevel(TransactionIsolationLevel.READ_COMMITTED);
    }

    @Before
    public void before() {
        // Required: Method must be defined to activate the transaction.
        // Option 1: Lazy Opening (Leave body empty)
        // Option 2: Eager Opening (Call super.open())
    }

    @After
    public void commit() {
        super.commit();
    }
    
    @ExceptionThrown
    public void rollback() {
        super.rollback();
    }
    
    @Finally
    public void close() {
        super.close();
    }
}
```

### Pointcut Patterns
Aspectran pointcuts use `+:` (include) and `-:` (exclude) prefixes.
*   **Target specific Bean ID**: `+: **@sqlSession`
*   **Target specific Class**: `+: **@class:com.example.db.MemberDao`
*   **Package scope**: `+: **@com.example.service.**`

## 5. Multi-SqlSessionFactory Environments

When integrating multiple database systems, specify which factory each session agent should use.

```java
@Component
@Bean(id = "appmonSqlSession")
public class AppMonSqlSession extends SqlSessionAgent {
    public AppMonSqlSession() {
        super("appmonTxAspect");
        // Explicitly set the bean ID of the SqlSessionFactory to be linked
        setSqlSessionFactoryBeanId("appmonSqlSessionFactory");
    }
}
```
If not specified, an `IllegalStateException` will occur if there is more than one `SqlSessionFactory` in the context.

## 6. Transaction Management by ExecutorType

MyBatis supports three execution modes (`SIMPLE`, `BATCH`, `REUSE`). Aspectran allows you to define specialized `SqlSessionAgent` instances for each mode and integrate them via `SqlMapperProvider`.

### Defining SqlSessionAgent for each ExecutorType
Create `SqlSessionAgent` classes for each execution mode.
```java
// SIMPLE mode (Default)
@Component
@Bean(id = "simpleSqlSession", lazyDestroy = true)
public class SimpleSqlSession extends SqlSessionAgent {
    public SimpleSqlSession() {
        super("simpleTxAspect");
    }
}

// BATCH mode (Optimized for bulk data processing)
@Component
@Bean(id = "batchSqlSession", lazyDestroy = true)
public class BatchSqlSession extends SqlSessionAgent {
    public BatchSqlSession() {
        super("batchTxAspect");
        setExecutorType(ExecutorType.BATCH);
    }
}

// REUSE mode (Reuse PreparedStatements)
@Component
@Bean(id = "reuseSqlSession", lazyDestroy = true)
public class ReuseSqlSession extends SqlSessionAgent {
    public ReuseSqlSession() {
        super("reuseTxAspect");
        setExecutorType(ExecutorType.REUSE);
    }
}
```

### Implementing SqlMapperProvider
Implement `SqlMapperProvider` so that DAOs can choose the appropriate session type.
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

    @Override
    public SqlSession getSimpleSqlSession() { return simpleSqlSession; }

    @Override
    public SqlSession getBatchSqlSession() { return batchSqlSession; }

    @Override
    public SqlSession getReuseSqlSession() { return reuseSqlSession; }
}
```

## 7. DAO and Mapper Implementation Details

Aspectran provides the `SqlMapperAccess` abstract class to keep mapper usage concise by automatically analyzing mapper interfaces.

### Defining the Mapper Interface
```java
@Mapper
public interface MemberMapper {
    Member selectMember(Long id);
    int insertMember(Member member);
}
```

### DAO Implementation (Using SqlMapperAccess)
Inheriting from `SqlMapperAccess` allows you to immediately call the appropriate execution mode via methods like `mapper()`, `batchMapper()`, and `reuseMapper()`.
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
        // Standard retrieval (SIMPLE mode)
        return mapper().selectMember(id);
    }

    public void insertLargeVolume(List<Member> members) {
        // Use BATCH mode mapper for bulk processing
        MemberMapper mapper = batchMapper();
        for (Member m : members) {
            mapper.insertMember(m);
        }
    }

    @Override
    public int insertMember(Member member) {
        return mapper().insertMember(member);
    }
}
```

## 8. Dependencies

### Core Integration Module
```xml
<dependency>
    <groupId>com.aspectran</groupId>
    <artifactId>aspectran-with-mybatis</artifactId>
    <version>9.4.5</version>
</dependency>
```

### MyBatis and JDBC Libraries
```xml
<dependency>
    <groupId>org.mybatis</groupId>
    <artifactId>mybatis</artifactId>
    <version>3.5.19</version>
</dependency>
<dependency>
    <groupId>com.zaxxer</groupId>
    <artifactId>HikariCP</artifactId>
    <version>6.2.1</version>
</dependency>
```
