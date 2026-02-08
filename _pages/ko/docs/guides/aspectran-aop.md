---
title: "Aspectran AOP: 기능과 아키텍처"
subheadline: 사용자 가이드
---

**AOP(Aspect-Oriented Programming)**는 로깅, 보안, 트랜잭션 등 애플리케이션 전반에 걸친 **공통 관심사(Cross-cutting Concerns)**를 비즈니스 로직과 분리하여 코드의 복잡성을 줄이는 핵심 기술입니다.

**Spring AOP**는 빈(Bean) 메서드 인터셉트와 AspectJ의 강력한 표현식을 결합하여 매우 세밀한 제어를 제공합니다. 하지만 그만큼 설정이 방대해질 수 있고, 학습 곡선이 높을 수 있습니다.

**Aspectran**은 이러한 복잡성을 줄이고, 프레임워크의 동작 원리에 최적화된 **실용적인 AOP**를 지향합니다. Aspectran은 복잡한 설정 대신, 요청 처리의 핵심 단위인 **`Activity`의 생명주기(Lifecycle)**에 초점을 맞췄습니다. 이를 통해 개발자는 요청의 시작부터 끝까지의 흐름을 직관적으로 제어하면서도, 필요한 경우 Bean 메서드 레벨의 AOP도 간편하게 적용할 수 있습니다. 즉, Aspectran의 AOP는 '모든 것을 제어'하기보다는 **'구조적인 흐름 제어'**에 특화되어 있습니다.

## 주요 특징

### 1. Join Point: 실행 시점 (Execution Timing)

Aspectran AOP는 크게 두 가지 범주의 Join Point를 제공합니다.

*   **Activity 실행 (Translet 생명주기)**: Aspectran의 가장 독특하고 강력한 Join Point입니다. **Translet** 규칙에 따라 요청을 처리하는 `Activity`의 생명주기 전반(실행 전/후, 예외 발생 시 등)에 개입할 수 있습니다. 이는 로깅, 트랜잭션, 인증과 같이 요청 단위로 처리되어야 할 공통 관심사(Cross-cutting Concerns)를 모듈화하는 데 최적화되어 있습니다.
*   **Bean 메서드 실행**: 다른 AOP 프레임워크와 유사하게, 특정 Bean의 메서드 실행을 Join Point로 사용할 수 있습니다.

### 2. Pointcut: 대상 선택 (Target Selection)

Pointcut은 Advice를 적용할 대상을 정밀하게 정의하는 표현식입니다. Aspectran에서는 `<aspect>` 규칙 내의 `<joinpoint>` 요소를 통해 선언적으로 정의합니다.

*   **APON 형식 정의**: `<joinpoint>` 요소는 APON(Aspectran Parameter Object Notation) 형식을 사용하여 상세 규칙을 설정하며, 와일드카드(`*`)와 정규식을 지원합니다.

*   **표현식 구조**:
    ```
    transletNamePattern[@beanOrClassPattern][^methodNamePattern]
    ```
    *   **Translet 패턴** (`@` 앞): 대상 Translet 이름 패턴을 지정합니다.
    *   **Bean/Class 패턴** (`@` 뒤): 대상 Bean ID 또는 클래스 이름 패턴을 지정합니다.
    *   **Method 패턴** (`^` 뒤): 대상 메서드 이름 패턴을 지정합니다.

*   **예시**:
    *   **모든 Translet 내의 특정 Bean**: Translet 패턴을 생략하고 `@`로 시작합니다.
        ```xml
        <joinpoint>
            pointcut: {
                type: wildcard
                +: @someService^execute*
            }
        </joinpoint>
        ```
    *   **특정 Translet 내의 특정 Bean**:
        ```xml
        <joinpoint>
            pointcut: {
                type: wildcard
                +: /user/list@userService^get*
            }
        </joinpoint>
        ```
    *   **Translet 자체**: Bean/Method 패턴을 생략하여 Activity 실행 자체를 대상으로 합니다.
        ```xml
        <joinpoint>
            pointcut: {
                type: wildcard
                +: /user/*
            }
        </joinpoint>
        ```

*   **포함 및 제외 규칙**:
    *   `+` 접두사는 대상을 **포함**하고, `-` 접두사는 대상을 **제외**합니다.
    *   규칙은 순서대로 적용되므로, 정교한 제어가 가능합니다 (예: 패키지 내 모든 Bean을 포함한 후, 특정 Bean만 제외).

### 3. Advice: 수행 로직 (Action Logic)

*   **종류**: 5가지 표준 Advice 유형(`com.aspectran.core.context.rule.type.AdviceType`)을 지원합니다.
    *   `BEFORE`: Join Point 실행 전.
    *   `AFTER`: 성공적으로 실행된 후.
    *   `AROUND`: 실행을 감쌈 (`BEFORE`와 `AFTER`를 모두 정의).
    *   `THROWN`: 예외 발생 시.
    *   `FINALLY`: 항상 실행 (성공/실패 여부 무관).

*   **실행 메커니즘**: Advice 로직은 Bean 내의 메서드로 구현됩니다. 호출 주체는 대상에 따라 달라집니다.
    1.  **Bean 메서드 Advice**: `com.aspectran.core.component.bean.proxy.AbstractBeanProxy`가 처리합니다. 호출을 가로채 Advice를 실행한 후 원본 메서드를 호출합니다.
    2.  **Activity Advice**: `com.aspectran.core.activity.CoreActivity`가 처리합니다. 생명주기의 특정 시점(시작, 종료 등)에 Advice를 호출합니다.

### 4. Aspect: 모듈화

*   **`<aspect>` 규칙**: Advice(Bean 메서드)와 Pointcut의 조합을 정의합니다. 이를 통해 공통 관심사를 하나의 재사용 가능한 모듈로 캡슐화합니다.

### 5. Weaving: 선택적 동적 프록시 (Selective Dynamic Proxying)

Aspectran은 성능에 최적화된 **런타임 동적 프록시(Runtime Dynamic Proxy)** 메커니즘(`AbstractBeanProxy` 기반)을 사용합니다.

*   **비대상 메서드에 대한 오버헤드 제로**:
    *   프록시는 **`@Advisable` 어노테이션이 붙은 메서드에 대해서만** AOP 로직을 수행합니다.
    *   이 어노테이션이 없는 메서드는 AOP 처리(Pointcut 검사 포함)를 완전히 건너뛰고 원본 메서드를 즉시 호출하므로, **불필요한 프록시 오버헤드가 발생하지 않습니다.**

*   **프록시 생성**:
    *   **Javassist (기본)**: 클래스와 인터페이스 모두에 대해 유연하게 프록시를 생성합니다 (`JavassistProxyBean`).
    *   **JDK Dynamic Proxy**: 인터페이스를 구현한 Bean에 대해 사용 가능합니다 (`JdkDynamicProxyBean`).

### 6. 어노테이션 지원

`com.aspectran.core.component.bean.annotation` 패키지를 통해 XML 없이도 완전한 AOP 설정이 가능합니다.

*   `@Component`: 컴포넌트 스캔을 통해 클래스를 Bean으로 등록합니다. Aspect 클래스도 자동 감지되려면 `@Aspect`와 함께 이 어노테이션이 반드시 필요합니다.
    *   단독 사용 시, ID가 없는 암시적 Advice Bean으로 등록됩니다.
*   `@Bean`: `@Component`와 함께 사용하여 Advice Bean에 명시적인 ID를 부여합니다 (예: `@Bean("myAdvice")`).
*   `@Aspect`: Bean을 Aspect로 지정합니다. 속성: `id`, `order`.
*   `@Joinpoint`: Pointcut을 정의합니다.
*   `@Before`, `@After`, `@Around`, `@Finally`, `@ExceptionThrown`: 메서드를 Advice 유형에 매핑합니다.
*   `@Advisable`: 메서드가 AOP 개입 대상임을 명시합니다.
*   `@Settings`: 현재 `Activity` 컨텍스트에 값을 주입합니다.

### 7. 실용적 예제: 선언적 트랜잭션

AOP는 트랜잭션 로직(시작, 커밋, 롤백)을 비즈니스 로직과 분리하는 데 필수적입니다. 아래는 MyBatis 트랜잭션에 대한 어노테이션 방식과 XML 방식의 설정 비교입니다.

#### 1. 어노테이션 기반 설정

`SqlSessionAdvice`를 상속받아 Aspect를 정의합니다.

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
*   **대상**: ID가 `simpleSqlSession`인 Bean의 모든 public 메서드에 적용됩니다.

#### 2. XML 기반 설정

Advice Bean과 Aspect 정의를 분리합니다.

**`mybatis-context.xml`**:
```xml
<!-- 1. Advice Bean -->
<bean id="sqlSessionTxAdvice" class="com.aspectran.mybatis.SqlSessionAdvice" scope="prototype">
    <arguments>
        <item>#{sqlSessionFactory}</item>
    </arguments>
</bean>

<!-- 2. Aspect 정의 -->
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

#### 3. 서비스 계층 사용

**1. 트랜잭션 리소스 정의**
`SimpleSqlSession` Bean은 생성자나 ID 매칭을 통해 Aspect와 연결됩니다.

```java
@Component
@Bean(id = "simpleSqlSession")
public class SimpleSqlSession extends SqlSessionAgent {
    public SimpleSqlSession() {
        super("simpleTxAspect"); // Aspect ID와 연결
    }
}
```

**2. 비즈니스 로직에 적용**
서비스에 `SimpleSqlSession`을 주입하여 사용합니다.

```java
@Component
public class OrderService {

    private final SimpleSqlSession sqlSession;

    @Autowired
    public OrderService(SimpleSqlSession sqlSession) {
        this.sqlSession = sqlSession;
    }

    public void createOrder(Order order) {
        // 직접적인 데이터베이스 작업 수행.
        // 이 호출을 감싸고 'simpleTxAspect'가 트랜잭션 생명주기를 자동으로 처리합니다.
        sqlSession.insert("app.demo.mapper.OrderMapper.insertOrder", order);
    }
}
```

*   **동작 원리**:
    1.  `OrderService`가 `sqlSession.insert(...)`를 호출하면, 주입받은 `SimpleSqlSession` Bean의 메서드가 실행됩니다.
    2.  이때 Bean ID(`simpleSqlSession`)가 `simpleTxAspect`의 Pointcut(`**: @simpleSqlSession`)과 일치하므로 AOP가 발동합니다.
    3.  `@Before` 어드바이스가 트랜잭션을 시작합니다.
    4.  데이터베이스 작업이 수행됩니다.
    5.  작업 완료 후 `@After`가 커밋을 수행하고, `@Finally`가 세션을 종료합니다.

이처럼 AOP를 활용하면 비즈니스 로직과 트랜잭션 관리 코드를 완벽하게 분리하여 유지보수성을 크게 높일 수 있습니다.

### 요약

1.  **생명주기 통합**: **Translet/Activity**의 생명주기를 고유한 Join Point로 활용합니다.
2.  **고성능**: `@Advisable`을 통한 선택적 프록싱으로 오버헤드를 최소화합니다.
3.  **유연성**: 다양한 아키텍처 요구사항에 맞춰 XML과 어노테이션 스타일을 모두 지원합니다.
