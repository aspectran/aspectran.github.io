---
title: Aspectran에서의 MyBatis 트랜잭션 관리 가이드
subheadline: 핵심 가이드
---

Aspectran은 AOP(Aspect-Oriented Programming)를 통해 MyBatis의 `SqlSession` 생명주기를 관리하며, 선언적이고 명시적인 트랜잭션 처리 방식을 제공합니다. 이 가이드에서는 Aspectran 트랜잭션의 핵심 원리와 설정 방법, 그리고 다이나믹 라우팅을 이용한 고도화된 기법을 설명합니다.

## 1. 배경 및 작동 원리

### 트랜잭션 관리 원리
Aspectran의 트랜잭션은 **`Activity`**라는 요청 처리 단위의 생명주기에 단단히 결합되어 있습니다. AOP 프록시가 메서드 호출을 가로채어 다음과 같은 과정을 수행합니다:
1.  **Before**: `SqlSessionAdvice` 인스턴스를 생성하고 현재 `Activity` 컨텍스트에 바인딩합니다. **주의: 이 시점에는 실제 DB 연결이 열리지 않습니다 (지연 오픈).**
2.  **Logic**: 실제 비즈니스 로직을 수행합니다. 실제 DB 작업이 요청되는 시점에 비로소 `SqlSession`이 오픈됩니다.
3.  **After**: 로직이 성공하고 세션이 오픈된 상태라면 `commit()`을 호출합니다.
4.  **Exception**: 예외 발생 시 세션이 활성 상태라면 `rollback()`을 수행합니다.
5.  **Finally**: 사용된 `SqlSession`을 안전하게 닫고, 커넥션 상태(예: read-only 플래그)를 초기화합니다.

### 지능적 라우팅 및 세션 재사용
Master-Slave 구조에서 Aspectran은 다음과 같은 지능적 라우팅 전략을 제공합니다:
*   **일관성 우선**: 현재 Activity 내에서 이미 쓰기용(Master) 세션이 열려 있다면, 읽기 전용 작업이라도 해당 세션을 재사용합니다. 이를 통해 커밋되지 않은 변경 사항을 즉시 조회할 수 있으며 커넥션 오버헤드를 줄입니다.
*   **효율성**: DB 연결은 꼭 필요한 시점에만 맺어집니다. `getMapper()`나 `getConfiguration()` 같은 관리용 메서드 호출만으로는 세션이 오픈되지 않습니다.

## 2. 다이나믹 라우팅 (Read-Write Splitting)

메서드 명에 따라 Read-Only와 Writable 세션을 자동으로 분리하여 Master-Slave 구조 등에 최적화된 트랜잭션을 제공합니다.

```java
@Component
@Bean(id = "sqlSession")
public class AppSqlSession extends SqlSessionAgent {
    public AppSqlSession() {
        // (쓰기용 Aspect ID, 읽기용 Aspect ID)
        super("txAspect", "readOnlyAspect");
    }
}
```
*   **Intelligent Routing**: 쓰기용 세션(`txAspect`)이 이미 열려 있다면 읽기 전용 작업에서도 이를 우선적으로 재사용하여 불필요한 세션 생성을 방지합니다.
*   **ReadOnly**: `select*` 패턴의 메서드 호출 시 작동합니다.
*   **Writable**: 그 외의 모든 수정 메서드 호출 시 작동합니다.
*   **제외 패턴**: `getMapper`, `getConnection` 등 관리용 메서드들은 자동 세션 오픈 대상에서 제외되어 불필요한 연결을 방지합니다.

## 3. 명시적 Aspect 정의 (Explicit Definition)

개발자가 직접 Aspect 클래스를 작성하여 트랜잭션의 동작을 정교하게 제어하는 표준 방식입니다.

### 지연 오픈 vs 즉시 오픈 유연성
명시적 Aspect 정의 시, 세션 오픈 전략을 상황에 맞게 선택할 수 있는 유연성을 제공합니다. **주의할 점은 지연 로딩을 사용하더라도 트랜잭션 컨텍스트를 활성화하기 위해 `@Before` 메서드는 반드시 정의되어야 합니다.**

*   **지연 오픈 (Lazy Opening - 권장)**: `@Before` 메서드를 정의하되 내부를 비워둡니다(또는 `super.open()` 호출을 생략합니다). 이 메서드는 트랜잭션 세션 인스턴스를 생성하고 Activity에 바인딩하는 트리거 역할을 하며, 실제 DB 연결은 작업 발생 시점까지 미룹니다.
*   **즉시 오픈 (Eager Opening)**: `@Before` 메서드에서 **반드시 `super.open()`을 호출**해야 합니다. 비즈니스 로직 실행 전에 DB 연결 상태를 즉시 확인(Fail-Fast)해야 할 때 유용합니다.

### 예제: 단일 Writable 트랜잭션 설정
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
        // 필수: 메서드가 정의되어야 트랜잭션이 활성화됩니다.
        // 옵션 1: 지연 오픈 (내용 비움)
        // 옵션 2: 즉시 오픈 (super.open() 호출)
    }

    @After public void commit() { super.commit(); }
    @ExceptionThrown public void rollback() { super.rollback(); }
    @Finally public void close() { super.close(); }
}
```

## 4. 포인트컷 패턴 예제 (Pointcut Patterns)

Aspectran의 포인트컷은 `+:`(포함)와 `-:`(제외) 접두사를 사용합니다.

*   **특정 빈 ID 대상**: `+: **@sqlSession`
*   **특정 클래스 대상**: `+: **@class:com.example.db.MemberDao`
*   **중첩 트랜잭션 추적**: Aspectran은 내부 스택을 사용하여 중첩된 트랜잭션을 추적하며, 항상 가장 안쪽의 트랜잭션 설정을 우선시합니다.

## 5. 여러 개의 SqlSessionFactory 처리

컨텍스트 내에 여러 개의 데이터베이스 연결이 설정되어 있어 `SqlSessionFactory` 빈이 여러 개 존재하는 경우, `SqlSessionAgent`에서 어떤 팩토리를 사용할지 명시해야 합니다.

```java
@Component
@Bean(id = "appmonSqlSession")
public class AppMonSqlSession extends SqlSessionAgent {
    public AppMonSqlSession() {
        super("appmonTxAspect");
        // 사용할 SqlSessionFactory의 빈 ID를 명시적으로 지정
        setSqlSessionFactoryBeanId("appmonSqlSessionFactory");
    }
}
```
명시적으로 지정하지 않을 경우, 컨텍스트 내에 유일한 `SqlSessionFactory`가 없다면 `IllegalStateException`이 발생합니다.

## 부록: ExecutorType별 트랜잭션 관리

MyBatis는 세 가지 실행 모드(`SIMPLE`, `BATCH`, `REUSE`)를 지원합니다. Aspectran에서는 각 모드별로 별도의 `SqlSessionAgent`를 정의하고, `SqlMapperProvider`를 통해 이를 통합하여 사용할 수 있습니다.

### 1. ExecutorType별 SqlSessionAgent 정의

각 실행 모드에 맞는 `SqlSessionAgent` 클래스를 작성합니다.

```java
// SIMPLE 모드 (기본값)
@Component
@Bean(id = "simpleSqlSession", lazyDestroy = true)
public class SimpleSqlSession extends SqlSessionAgent {
    public SimpleSqlSession() {
        super("simpleTxAspect");
    }
}

// BATCH 모드 (대량 데이터 삽입/수정에 최적화)
@Component
@Bean(id = "batchSqlSession", lazyDestroy = true)
public class BatchSqlSession extends SqlSessionAgent {
    public BatchSqlSession() {
        super("batchTxAspect");
        setExecutorType(ExecutorType.BATCH);
    }
}

// REUSE 모드 (PreparedStatement 재사용)
@Component
@Bean(id = "reuseSqlSession", lazyDestroy = true)
public class ReuseSqlSession extends SqlSessionAgent {
    public ReuseSqlSession() {
        super("reuseTxAspect");
        setExecutorType(ExecutorType.REUSE);
    }
}
```

### 2. SqlMapperProvider 구현

`SqlMapperProvider` 인터페이스를 구현하여 DAO에서 여러 세션 타입을 편리하게 사용할 수 있도록 합니다.

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

### 3. DAO에서의 활용

`SqlMapperAccess` 또는 `SqlMapperProvider`를 통해 상황에 맞는 실행 모드를 선택하여 호출할 수 있습니다.

```java
@Component
public class MemberDao extends SqlMapperAccess<MemberMapper> {

    @Autowired
    public MemberDao(SqlMapperProvider provider) {
        super(provider);
    }

    public void insertLargeVolume(List<Member> members) {
        // 대량 처리를 위해 BATCH 모드 매퍼 사용
        MemberMapper mapper = batchMapper();
        for (Member m : members) {
            mapper.insertMember(m);
        }
        // batchSession().flushStatements() 등으로 수동 제어도 가능
    }

    public Member findMember(Long id) {
        // 일반적인 조회를 위해 SIMPLE 모드 사용 (기본)
        return mapper().selectMember(id);
    }
}
```

## 부록: Mapper 및 DAO 작성 방법

### 1. 매퍼 인터페이스 정의
```java
@Mapper
public interface MemberMapper {
    Member selectMember(Long id);
    int insertMember(Member member);
}
```

### 2. DAO 클래스 구현
`SqlMapperAccess`를 상속받아 구현하면 마스터-슬레이브 라우팅이 자동으로 적용됩니다.

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
        // 쓰기 트랜잭션 중이면 Master 세션을 재사용하고,
        // 그렇지 않으면 Slave 세션을 엽니다.
        return mapper().selectMember(id);
    }

    @Override
    public int insertMember(Member member) {
        return mapper().insertMember(member);
    }
}
```
