---
title: Aspectran에서의 JPA 트랜잭션 관리 가이드
subheadline: 실용 가이드
---

Aspectran은 **JPA(Jakarta Persistence API)**를 활용하여 복잡한 데이터베이스 작업을 객체 지향적으로 처리할 수 있도록 강력한 통합 환경을 제공합니다. 특히 **AOP(Aspect-Oriented Programming)**를 통해 `EntityManager`의 생명주기를 자동으로 관리하며, 선언적이고 명시적인 트랜잭션 처리 방식을 지원합니다.

이 가이드에서는 JPA의 핵심인 **EntityManager**, 타입 세이프한 쿼리 빌더인 **QueryDSL**, 그리고 이를 지원하는 **Hibernate**와 **EclipseLink** 구현체 및 필요한 **의존성**에 대해 상세히 설명합니다.

## 1. JPA와 EntityManager의 이해

### JPA(Jakarta Persistence API) 개요
JPA는 자바 객체와 관계형 데이터베이스(RDB) 간의 데이터를 자동으로 연결해 주는 **ORM(Object-Relational Mapping)** 기술의 표준 사양입니다. 개발자가 복잡한 SQL 쿼리를 직접 작성하는 대신, 자바 클래스(Entity)를 통해 데이터를 관리할 수 있는 환경을 제공합니다.

### EntityManager의 핵심 역할
`EntityManager`는 JPA 환경에서 엔티티의 상태를 관리하고 데이터베이스 작업을 수행하는 핵심 인터페이스입니다.
*   **데이터 조작**: 객체를 DB에 저장(`persist`), 수정(`merge`), 삭제(`remove`), 조회(`find`)하는 기능을 제공합니다.
*   **영속성 컨텍스트(Persistence Context)**: 애플리케이션과 데이터베이스 사이에서 엔티티 객체를 관리하는 일종의 캐시 역할을 합니다. 트랜잭션 내에서 변경된 데이터를 추적하고, 가장 적절한 시점에 데이터베이스에 반영(Flush)하여 성능을 최적화합니다.

**Aspectran과의 통합**: Aspectran은 `EntityManager`의 생성부터 종료까지의 생명주기와 트랜잭션의 시작 및 완료를 AOP를 통해 자동화합니다. 이를 통해 개발자는 데이터베이스 연결 관리와 같은 반복적인 코드에서 벗어나 비즈니스 로직 구현에만 집중할 수 있습니다.

## 2. QueryDSL 통합 및 EntityQuery 활용

표준 JPA의 `EntityManager`는 강력한 기능을 제공하지만, 복잡한 동적 쿼리를 작성할 때 문자열 기반의 JPQL을 사용해야 한다는 제약이 있습니다. Aspectran은 이러한 제약을 극복하고 개발 생산성을 높이기 위해 **QueryDSL**을 엔진 레벨에서 통합하여 제공합니다.

### QueryDSL의 도입 이점
1.  **타입 안정성(Type-safety)**: 쿼리를 문자열이 아닌 자바 코드로 작성하므로, 구문 오류를 컴파일 시점에 즉시 발견할 수 있습니다.
2.  **동적 쿼리 구현의 용이성**: 복잡한 조건에 따른 쿼리 생성을 자바 메서드 호출 방식으로 직관적으로 처리할 수 있습니다.
3.  **생산성 향상**: IDE의 자동 완성 기능을 활용하여 쿼리를 작성할 수 있어 오타를 줄이고 개발 속도를 높일 수 있습니다.

### Aspectran의 EntityQuery 인터페이스
Aspectran은 `EntityManager`와 QueryDSL의 `JPQLQueryFactory` 기능을 결합한 **`EntityQuery`**를 제공합니다. 단일 인터페이스를 통해 표준 JPA 메서드와 QueryDSL의 유연한 API를 동시에 사용할 수 있습니다.

#### 데이터 접근 객체(DAO)에서의 활용 예시
```java
@Component
public class MemberDao {

    private final EntityQuery entityQuery;

    @Autowired
    public MemberDao(EntityQuery entityQuery) {
        this.entityQuery = entityQuery;
    }

    public Member findById(Long id) {
        // 표준 JPA 방식을 사용한 단일 객체 조회
        return entityQuery.find(Member.class, id);
    }

    public List<Member> findAllActive(String name) {
        // QueryDSL API를 사용한 타입 세이프한 동적 쿼리 작성
        QMember qMember = QMember.member;
        return entityQuery.selectFrom(qMember)
                .where(qMember.status.eq(Status.ACTIVE)
                       .and(qMember.name.contains(name)))
                .fetch();
    }

    public void save(Member member) {
        // 엔티티 영속화(저장)
        entityQuery.persist(member);
    }
}
```

## 3. JPA 구현체 지원 (Hibernate 및 EclipseLink)

JPA는 표준 명세(Specification)이며, 이를 실제로 동작하게 하는 구현체(Provider)가 필요합니다. Aspectran은 업계에서 가장 널리 사용되는 두 가지 구현체를 공식 지원합니다.

*   **Hibernate**: 가장 높은 점유율을 가진 구현체로, 강력한 기능과 방대한 생태계를 갖추고 있습니다. Aspectran 프로젝트에서 기본적으로 권장되는 조합입니다.
*   **EclipseLink**: JPA 표준 참조 구현체(Reference Implementation)로, 표준 사양에 매우 충실합니다. 오라클 데이터베이스와의 연동이나 특정 표준 준수가 엄격한 환경에서 주로 사용됩니다.

Aspectran은 추상화된 설정을 통해 어떠한 구현체를 사용하더라도 동일한 트랜잭션 관리 경험을 제공하므로, 프로젝트의 특성에 맞춰 자유롭게 선택할 수 있습니다.

## 4. 트랜잭션 작동 원리

Aspectran의 JPA 트랜잭션은 **`Activity`**라고 불리는 요청 처리 단위의 생명주기에 통합되어 작동합니다.

1.  **초기화 단계(Before)**: `EntityManagerAdvice`가 호출되어 현재 컨텍스트에 트랜잭션 설정을 수행합니다. 이때 DB 커넥션을 즉시 맺지 않고, 실제 필요 시점까지 지연시키는 **지연 오픈(Lazy Opening)** 전략을 취합니다.
2.  **비즈니스 로직 실행(Logic)**: 애플리케이션에서 최초의 데이터베이스 작업이 발생할 때 `EntityManager`가 활성화되고 물리적인 트랜잭션이 시작됩니다.
3.  **성공적인 완료(After)**: 로직 실행 중 예외가 발생하지 않으면 트랜잭션을 `commit()`하여 변경 사항을 데이터베이스에 영구적으로 반영합니다.
4.  **예외 처리(Exception)**: 실행 중 예외가 발생하면 트랜잭션을 즉시 `rollback()`하여 데이터의 일관성을 보장합니다.
5.  **리소스 반환(Finally)**: 작업 완료 후 사용된 `EntityManager`와 데이터베이스 연결을 안전하게 해제합니다.

## 5. 다이나믹 라우팅 (Read-Write Splitting)

고가용성 환경을 위해 Primary(쓰기 전용)와 Replica(읽기 전용) 데이터베이스를 분리하여 운영하는 경우, Aspectran은 메서드 명칭 패턴에 따라 자동으로 트랜잭션을 라우팅합니다.

```java
@Component
@Bean(id = "entityQuery")
public class AppEntityQuery extends RoutingEntityQuery {
    public AppEntityQuery() {
        // (프라이머리 Aspect ID, 레플리카 Aspect ID)
        super("primaryTxAspect", "replicaTxAspect");
    }
}
```
*   **라우팅 우선순위**: 현재 실행 컨텍스트에서 이미 쓰기 세션이 열려 있다면, 읽기 작업이라도 일관성을 위해 쓰기 세션을 재사용합니다.
*   **자동 분석**: `find*`, `select*`, `query*` 등의 명칭으로 시작하는 메서드는 자동으로 읽기 전용 세션으로 연결됩니다.

## 6. @Hint 어노테이션을 통한 정밀 제어

메서드 명칭 기반의 자동 라우팅 외에도, `@Hint` 어노테이션을 사용하여 메서드 단위의 트랜잭션 속성을 직접 정의할 수 있습니다.

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
        // 읽기 전용 세션으로 강제 라우팅하며, 
        // 해당 컨텍스트 내에서 데이터 변경 시도 시 예외를 발생시켜 안전성을 높입니다.
        return entityQuery.select(qMember).from(qMember).fetch();
    }
}
```

## 7. 명시적 Aspect 정의 (Explicit Definition)

트랜잭션의 동작 방식을 코드 레벨에서 더욱 정교하게 제어해야 할 경우, `EntityManagerAdvice`를 상속받는 Aspect 클래스를 직접 정의하여 사용할 수 있습니다. 이를 통해 트랜잭션의 오픈 전략(Lazy vs Eager)을 상황에 맞게 설정할 수 있습니다.

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
        // 필수: 메서드가 정의되어야 트랜잭션이 활성화됩니다.
        // 옵션 1: 지연 오픈 (내용 비움)
        // 옵션 2: 즉시 오픈 (super.open() 호출)
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

## 8. 다중 EntityManagerFactory 환경 구성

서로 다른 데이터베이스 시스템을 동시에 연결해야 하는 경우, 각 `EntityQuery` 빈이 어떤 `EntityManagerFactory`를 사용할지 명시적으로 지정할 수 있습니다.

```java
@Component
@Bean(id = "secondEntityQuery")
public class SecondEntityQuery extends DefaultEntityQuery {
    public SecondEntityQuery() {
        super("secondTxAspect");
        // 연동할 EntityManagerFactory 빈 ID를 명시적으로 설정
        setEntityManagerFactoryBeanId("secondEntityManagerFactory");
    }
}
```

## 9. 의존성 구성 (Dependencies)

Aspectran JPA 환경을 구축하기 위해 `pom.xml`에 포함해야 할 주요 모듈 정보입니다.

### 핵심 통합 모듈
```xml
<dependency>
    <groupId>com.aspectran</groupId>
    <artifactId>aspectran-with-jpa</artifactId>
    <version>${aspectran.version}</version>
</dependency>
```

### JPA 사양 및 QueryDSL 관련 의존성
```xml
<!-- Jakarta Persistence API 표준 인터페이스 -->
<dependency>
    <groupId>jakarta.persistence</groupId>
    <artifactId>jakarta.persistence-api</artifactId>
    <version>3.2.0</version>
</dependency>

<!-- QueryDSL JPA 지원 라이브러리 -->
<dependency>
    <groupId>io.github.openfeign.querydsl</groupId>
    <artifactId>querydsl-jpa</artifactId>
    <version>7.1</version>
</dependency>
```

### JPA 구현체 선택 (택 1)
프로젝트 환경에 맞는 구현체 하나를 선택하여 추가합니다.
```xml
<!-- Hibernate Core -->
<dependency>
    <groupId>org.hibernate.orm</groupId>
    <artifactId>hibernate-core</artifactId>
    <version>7.3.0.Final</version>
</dependency>

<!-- 또는 EclipseLink -->
<dependency>
    <groupId>org.eclipse.persistence</groupId>
    <artifactId>eclipselink</artifactId>
    <version>5.0.0-B13</version>
</dependency>
```

## 부록: 포인트컷 패턴 예제 (Pointcut Patterns)

트랜잭션 어드바이스를 적용할 대상을 정교하게 필터링하는 방법입니다.
Aspectran의 포인트컷은 `+:`(포함)와 `-:`(제외) 접두사를 사용합니다.
*   **특정 빈 ID 대상**: `+: **@entityQuery`
*   **특정 클래스/인터페이스 대상**: `+: **@class:com.example.repository.*Repository`
*   **패키지 범위 지정**: `+: **@com.example.service.**`

Aspectran은 내부 트랜잭션 스택을 활용하여 중첩된 호출 구조에서도 데이터 무결성과 안전한 전파(Propagation)를 보장합니다.
