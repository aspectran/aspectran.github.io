---
title: Aspectran에서의 MyBatis 트랜잭션 관리 가이드
subheadline: 실용 가이드
---

Aspectran은 **MyBatis**를 활용하여 SQL 쿼리와 자바 객체를 효율적으로 매핑하고, **AOP(Aspect-Oriented Programming)**를 통해 트랜잭션의 시작부터 종료까지 모든 생명주기를 자동으로 관리합니다. 이 가이드에서는 MyBatis의 핵심 구성 요소인 **SqlSession**과 **SqlSessionFactory**, 그리고 Aspectran의 **트랜잭션 어드바이스** 및 **ExecutorType별 고도화된 관리 기법**에 대해 상세히 설명합니다.

## 1. 배경 및 작동 원리

### MyBatis 개요
MyBatis는 SQL 쿼리를 자바 코드에서 분리하여 XML 파일이나 어노테이션으로 관리할 수 있게 해주는 **SQL 매퍼(Mapper)** 프레임워크입니다. 복잡한 SQL 쿼리를 자유롭게 제어하면서도 JDBC 코드의 반복을 획기적으로 줄여줍니다.

### SqlSession과 SqlSessionFactory의 역할
*   **SqlSessionFactory**: 이름 그대로 `SqlSession` 객체를 생성하는 공장 역할을 합니다. 데이터베이스 연결 정보와 MyBatis 설정 정보를 바탕으로 애플리케이션 실행 시 단 한 번 생성됩니다.
*   **SqlSession**: 데이터베이스에 SQL 명령을 실행하기 위한 단일 연결 세션입니다. 트랜잭션의 단위가 되며, 작업이 완료되면 반드시 닫아야(Close) 리소스 누수를 방지할 수 있습니다.

**Aspectran의 역할**: Aspectran은 `SqlSessionFactory`를 통해 `SqlSession`을 언제 열고 닫아야 하는지, 그리고 `commit`과 `rollback`을 어느 시점에 수행해야 하는지를 AOP를 통해 자동화합니다. 개발자는 세션 관리 코드 없이 비즈니스 로직과 SQL 작성에만 집중할 수 있습니다.

### 트랜잭션 작동 원리
Aspectran의 MyBatis 트랜잭션은 **`Activity`**라고 불리는 요청 처리 단위의 생명주기에 통합되어 작동하며, AOP 프록시가 메서드 호출을 가로채어 다음과 같은 과정을 수행합니다:
1.  **초기화 단계(Before)**: `SqlSessionAdvice`가 호출되어 현재 컨텍스트에 트랜잭션 환경을 설정합니다. 이때 실제 데이터베이스 연결을 즉시 맺지 않고, 실제 쿼리 실행 시점까지 미루는 **지연 오픈(Lazy Opening)** 전략을 기본적으로 취합니다.
2.  **비즈니스 로직 실행(Logic)**: 매퍼(Mapper)를 통해 첫 번째 SQL 작업이 요청되는 시점에 `SqlSession`이 활성화되고 물리적인 트랜잭션이 시작됩니다.
3.  **성공적인 완료(After)**: 로직이 성공하고 실행 결과에 예외가 없으면 트랜잭션을 `commit()`하여 데이터 변경 사항을 확정합니다.
4.  **예외 처리(Exception)**: 실행 중 예외가 발생하면 즉시 `rollback()`을 수행하여 데이터의 일관성을 유지합니다.
5.  **리소스 반환(Finally)**: 작업의 성공 여부와 관계없이 사용된 `SqlSession`을 안전하게 닫고 리소스를 반환합니다.

### 지능적 세션 재사용 및 @Hint 활용
*   **일관성 우선**: 현재 요청 내에서 이미 쓰기 세션이 열려 있다면, 이후의 읽기 작업도 데이터 일관성을 위해 기존 쓰기 세션을 재사용합니다.
*   **@Hint 안전성**: `@Hint(type = "transactional", value = "readOnly: true")`를 사용하면 명시적으로 읽기 전용 세션으로 라우팅할 뿐만 아니라, 세션 레벨에서 데이터 변경 시도(INSERT/UPDATE/DELETE)를 감지하여 `IllegalStateException`을 발생시킵니다.

## 2. 다이나믹 라우팅 (Read-Write Splitting)

데이터베이스의 부하 분산을 위해 Primary(쓰기 전용)와 Replica(읽기 전용) 데이터베이스를 분리하여 운영하는 환경에서, Aspectran은 호출되는 메서드의 명칭에 따라 자동으로 적절한 데이터베이스로 쿼리를 보냅니다.

```java
@Component
@Bean(id = "sqlSession")
public class AppSqlSession extends RoutingSqlSessionAgent {
    public AppSqlSession() {
        // (프라이머리 Aspect ID, 레플리카 Aspect ID)
        super("primaryTxAspect", "replicaTxAspect");
    }
}
```
*   **라우팅 로직**: 프라이머리 세션(`primaryTxAspect`)이 이미 열려 있다면 읽기 전용 작업에서도 이를 우선적으로 재사용하여 불필요한 세션 생성을 방지합니다.
*   **Replica(읽기 전용)**: `select*` 패턴의 메서드 호출 시 읽기 전용 세션으로 라우팅합니다.
*   **Primary(쓰기 전용)**: 그 외의 모든 메서드는 쓰기 전용 세션으로 라우팅합니다.

## 3. @Hint를 통한 선언적 제약사항

Aspectran의 힌트 메커니즘을 사용하면 서비스나 DAO 메서드에 직접 실행 의도를 정의할 수 있어, 메서드 명칭 패턴보다 더 세밀한 제어가 가능합니다.

```java
@Service
public class MemberService {

    @Autowired
    private MemberMapper memberMapper;

    @Hint(type = "transactional", value = "readOnly: true")
    public List<Member> getMembers() {
        // 이 메서드는 읽기 전용 세션으로 라우팅됩니다.
        // 여기서 실수로 memberMapper.insertMember()를 호출하면 
        // IllegalStateException이 발생합니다.
        return memberMapper.selectMemberList();
    }

}
```

## 4. 명시적 Aspect 정의 (Explicit Definition)

트랜잭션의 동작 방식을 코드 레벨에서 직접 제어해야 할 경우 `SqlSessionAdvice`를 상속받는 Aspect 클래스를 별도로 작성해야 합니다.
개발자가 직접 Aspect 클래스를 작성하여 트랜잭션의 동작을 정교하게 제어하는 표준 방식입니다.

### 세션 오픈 전략의 유연성
명시적 Aspect 정의 시, 세션 오픈 전략을 상황에 맞게 선택할 수 있는 유연성을 제공합니다. **주의할 점은 지연 로딩을 사용하더라도 트랜잭션 컨텍스트를 활성화하기 위해 `@Before` 메서드는 반드시 정의되어야 합니다.**

*   **지연 오픈 (Lazy Opening - 권장)**: `@Before` 메서드에서 `super.open()` 호출을 생략합니다. 트랜잭션 컨텍스트만 활성화하고 실제 DB 연결은 쿼리 시점까지 미룹니다.
*   **즉시 오픈 (Eager Opening)**: `@Before` 메서드에서 **반드시 `super.open()`을 호출**합니다. 비즈니스 로직 실행 전에 DB 연결 상태를 즉시 확인(Fail-Fast)해야 할 때 유용합니다.

### SqlSession 클래스 정의
먼저 "sampleTxAspect"를 대상으로 하는 새로운 `SampleSqlSession` 클래스를 정의합니다.
만약 `SampleSqlSession`가 초기화되는 시점에 "sampleTxAspect"라는 ID를 가진 Aspect가 정의되어 있지 않다면 자동으로 생성됩니다.
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

### Aspect 클래스 정의
`SampleSqlSession`에서 자동으로 생성되지 않도록 "sampleTxAspect"라는 ID를 가진 Aspect를 직접 정의합니다.
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
        // 고립 수준 등 추가 설정 가능
        setIsolationLevel(TransactionIsolationLevel.READ_COMMITTED);
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

### 포인트컷 패턴 예제 (Pointcut Patterns)
Aspectran의 포인트컷은 `+:`(포함)와 `-:`(제외) 접두사를 사용합니다. 
*   **특정 빈 ID 대상**: `+: **@sqlSession`
*   **특정 클래스 대상**: `+: **@class:com.example.db.MemberDao`
*   **패키지 범위 지정**: `+: **@com.example.service.**`

## 5. 다중 SqlSessionFactory 환경 구성

두 개 이상의 데이터베이스 시스템을 연동해야 하는 경우, `SqlSessionAgent`에서 각 세션 에이전트가 어떤 팩토리를 사용할지를 명시해야 합니다.

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

## 6. ExecutorType별 트랜잭션 관리

MyBatis는 세 가지 실행 모드(`SIMPLE`, `BATCH`, `REUSE`)를 지원합니다. Aspectran에서는 각 모드별로 별도의 `SqlSessionAgent`를 정의하고, `SqlMapperProvider`를 통해 이를 통합하여 사용할 수 있습니다.

### ExecutorType별 SqlSessionAgent 정의
각 실행 모드(ExecutorType)에 맞는 `SqlSessionAgent` 클래스를 작성합니다.
```java
// SIMPLE 모드 (기본값)
@Component
@Bean(id = "simpleSqlSession", lazyDestroy = true)
public class SimpleSqlSession extends SqlSessionAgent {
    public SimpleSqlSession() {
        super("simpleTxAspect");
    }
}

// BATCH 모드 (대량 데이터 처리에 최적화)
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

### SqlMapperProvider 구현
DAO에서 여러 세션 타입을 상황에 맞게 선택할 수 있도록 `SqlMapperProvider`를 구현합니다.
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
    public SqlSession getSimpleSqlSession() {
        return simpleSqlSession;
    }

    @Override
    public SqlSession getBatchSqlSession() {
        return batchSqlSession;
    }

    @Override
    public SqlSession getReuseSqlSession() {
        return reuseSqlSession;
    }
}
```

## 7. DAO 및 Mapper 구현 상세

Aspectran은 매퍼 인터페이스를 자동으로 분석하여 코드를 간결하게 작성할 수 있도록 `SqlMapperAccess` 추상 클래스를 제공합니다.

### 매퍼 인터페이스 정의
```java
@Mapper
public interface MemberMapper {
    Member selectMember(Long id);
    int insertMember(Member member);
}
```

### DAO 구현 (SqlMapperAccess 활용)
`SqlMapperAccess`를 상속받으면 `mapper()`, `batchMapper()`, `reuseMapper()` 등의 메서드를 통해 상황에 맞는 실행 모드를 즉시 호출할 수 있습니다.
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
        // 일반적인 조회 (SIMPLE 모드)
        return mapper().selectMember(id);
    }

    public void insertLargeVolume(List<Member> members) {
        // 대량 처리를 위해 BATCH 모드 매퍼 사용
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

## 8. 의존성 구성 (Dependencies)

### 핵심 통합 모듈
```xml
<dependency>
    <groupId>com.aspectran</groupId>
    <artifactId>aspectran-with-mybatis</artifactId>
    <version>9.4.5</version>
</dependency>
```

### MyBatis 및 JDBC 라이브러리
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
