---
title: JPA Transaction Management Guide in Aspectran
subheadline: Practical Guides
---

Aspectran provides a powerful integration environment for processing complex database operations in an object-oriented manner by leveraging the **Jakarta Persistence API (JPA)**. In particular, it automatically manages the lifecycle of the `EntityManager` through **Aspect-Oriented Programming (AOP)** and supports both declarative and explicit transaction management.

This guide explains the core components of JPA, such as the **EntityManager**, the type-safe query builder **QueryDSL**, the supported implementations (**Hibernate** and **EclipseLink**), and the required **dependencies**.

## 1. Understanding JPA and EntityManager

### Overview of JPA (Jakarta Persistence API)
JPA is a standard specification for **Object-Relational Mapping (ORM)** technology that automatically connects Java objects with relational databases (RDB). It allows developers to manage data through Java classes (Entities) instead of writing complex SQL queries manually.

### Core Role of the EntityManager
The `EntityManager` is the central interface for managing entity states and performing database operations in a JPA environment.
*   **Data Manipulation**: Provides methods to save (`persist`), update (`merge`), delete (`remove`), and retrieve (`find`) objects in the database.
*   **Persistence Context**: Acts as a cache between the application and the database. It tracks changes to entity objects within a transaction and synchronizes them with the database (Flush) at the most appropriate time to optimize performance.

**Integration with Aspectran**: Aspectran automates the lifecycle of the `EntityManager` and the start and completion of transactions through AOP. This allows developers to focus on implementing business logic without worrying about repetitive boilerplate code like connection management.

## 2. Querydsl Integration and EntityQuery

While the standard JPA `EntityManager` is powerful, it has limitations when writing complex dynamic queries, often requiring the use of string-based JPQL. Aspectran resolves this by integrating **QueryDSL** at the engine level.

### Benefits of Adopting Querydsl
1.  **Type-safety**: Queries are written in Java code rather than strings, allowing syntax errors to be caught immediately at compile time.
2.  **Ease of Dynamic Queries**: Complex conditional query generation is handled intuitively through Java method calls.
3.  **Increased Productivity**: IDE autocomplete features can be used to write queries, reducing typos and speeding up development.

### Aspectran's EntityQuery Interface
Aspectran provides the **`EntityQuery`** interface, which combines the functionality of the `EntityManager` and Querydsl's `JPQLQueryFactory`. A single interface allows you to use both standard JPA methods and Querydsl's flexible API simultaneously.

#### Example Usage in a Data Access Object (DAO)
```java
@Component
public class MemberDao {

    private final EntityQuery entityQuery;

    @Autowired
    public MemberDao(EntityQuery entityQuery) {
        this.entityQuery = entityQuery;
    }

    public Member findById(Long id) {
        // Retrieve a single object using the standard JPA method
        return entityQuery.find(Member.class, id);
    }

    public List<Member> findAllActive(String name) {
        // Write a type-safe dynamic query using the Querydsl API
        QMember qMember = QMember.member;
        return entityQuery.selectFrom(qMember)
                .where(qMember.status.eq(Status.ACTIVE)
                       .and(qMember.name.contains(name)))
                .fetch();
    }

    public void save(Member member) {
        // Persist (save) the entity
        entityQuery.persist(member);
    }
}
```

## 3. Supported JPA Providers (Hibernate and EclipseLink)

JPA is a specification, and a provider (implementation) is required to actually run it. Aspectran officially supports the two most widely used providers in the industry.

*   **Hibernate**: The most popular implementation, featuring powerful functionality and a vast ecosystem. This is the default recommended combination for Aspectran projects.
*   **EclipseLink**: The JPA reference implementation, which strictly adheres to the standard specification. It is often used in environments where Oracle database integration or strict standards compliance is required.

Aspectran provides a consistent transaction management experience regardless of the provider used through abstracted configurations, allowing you to choose the best fit for your project.

## 4. How Transactions Work

JPA transactions in Aspectran are integrated into the lifecycle of a request processing unit called an **`Activity`**.

1.  **Initialization (Before)**: `EntityManagerAdvice` is called to set up the transaction configuration for the current context. It employs a **Lazy Opening** strategy, where the database connection is not established immediately but delayed until it is actually needed.
2.  **Logic Execution (Logic)**: When the first database operation occurs in the application, the `EntityManager` is activated, and a physical transaction begins.
3.  **Successful Completion (After)**: If no exception occurs during logic execution, the transaction is committed using `commit()`, and changes are permanently reflected in the database.
4.  **Exception Handling (Exception)**: If an exception occurs, the transaction is immediately rolled back via `rollback()` to ensure data consistency.
5.  **Resource Cleanup (Finally)**: After the operation is complete, the `EntityManager` and database connection are safely released.

## 5. Dynamic Routing (Read-Write Splitting)

For high-availability environments where Primary (Write-only) and Replica (Read-only) databases are operated separately, Aspectran automatically routes transactions based on method name patterns.

```java
@Component
@Bean(id = "entityQuery")
public class AppEntityQuery extends RoutingEntityQuery {
    public AppEntityQuery() {
        // (Primary Aspect ID, Replica Aspect ID)
        super("primaryTxAspect", "replicaTxAspect");
    }
}
```
*   **Routing Priority**: If a write session is already open in the current execution context, it is reused even for read operations to ensure data consistency.
*   **Automatic Analysis**: Methods starting with names like `find*`, `select*`, and `query*` are automatically routed to the read-only session.

## 6. Precise Control via the @Hint Annotation

In addition to automatic routing based on method names, you can use the `@Hint` annotation to directly define transaction attributes for specific methods.

```java
@Service
public class MemberService {

    private final EntityQuery entityQuery;

    @Autowired
    public MemberService(EntityQuery entityQuery) {
        this.entityQuery = entityQuery;
    }

    @Hint(type = "transactional", value = "readOnly: true")
    public List<Member> getMembers() {
        // Forces routing to a read-only session.
        // Also increases safety by throwing an exception if a data modification is attempted within this context.
        return entityQuery.select(qMember).from(qMember).fetch();
    }
}
```

## 7. Explicit Aspect Definition

This method is used when you need fine-grained control over how transactions behave at the code level.

```java
@Component
@Bean(lazyDestroy = true)
@Aspect(id = "txAspect")
@Joinpoint(pointcut = "+: **@entityQuery")
public class ConsoleTxAspect extends EntityManagerAdvice {

    @Autowired
    public ConsoleTxAspect(@Qualifier("entityManagerFactory") EntityManagerFactory factory) {
        super(factory);
    }

    @Before
    public void before() {
        // Essential method definition for transaction activation.
        // You can decide between lazy or eager opening depending on whether you call super.open().
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

## 8. Multi-EntityManagerFactory Environments

When connecting to different database systems simultaneously, you can explicitly specify which `EntityManagerFactory` each `EntityQuery` bean should use.

```java
@Component
@Bean(id = "secondEntityQuery")
public class SecondEntityQuery extends DefaultEntityQuery {
    public SecondEntityQuery() {
        super("secondTxAspect");
        // Explicitly set the bean ID of the EntityManagerFactory to be linked
        setEntityManagerFactoryBeanId("secondEntityManagerFactory");
    }
}
```

## 9. Dependencies

Key module information to include in your `pom.xml` to build an Aspectran JPA environment.

### Core Integration Module
```xml
<dependency>
    <groupId>com.aspectran</groupId>
    <artifactId>aspectran-with-jpa</artifactId>
    <version>${aspectran.version}</version>
</dependency>
```

### JPA Specification and Querydsl Dependencies
```xml
<!-- Jakarta Persistence API Standard Interface -->
<dependency>
    <groupId>jakarta.persistence</groupId>
    <artifactId>jakarta.persistence-api</artifactId>
    <version>3.2.0</version>
</dependency>

<!-- Querydsl JPA Support Library -->
<dependency>
    <groupId>io.github.openfeign.querydsl</groupId>
    <artifactId>querydsl-jpa</artifactId>
    <version>7.1</version>
</dependency>
```

### JPA Implementation Choice (Pick one)
Choose one implementation that fits your project environment.
```xml
<!-- Hibernate Core -->
<dependency>
    <groupId>org.hibernate.orm</groupId>
    <artifactId>hibernate-core</artifactId>
    <version>7.3.0.Final</version>
</dependency>

<!-- OR EclipseLink -->
<dependency>
    <groupId>org.eclipse.persistence</groupId>
    <artifactId>eclipselink</artifactId>
    <version>5.0.0-B13</version>
</dependency>
```

## Appendix: Pointcut Patterns

Method for precisely filtering targets to which the transaction advice will be applied.
*   **Based on specific Bean ID**: `+: **@entityQuery`
*   **Based on interface/class with a specific name pattern**: `+: **@class:com.example.repository.*Repository`
*   **Based on entire package**: `+: com.example.service.**`

Aspectran leverages an internal transaction stack to ensure data integrity and safe propagation even in nested call structures.
