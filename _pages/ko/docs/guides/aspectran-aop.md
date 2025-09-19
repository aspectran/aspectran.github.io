---
format: plate solid article
sidebar: toc-left
title: Aspectran AOP 특징 분석
subheadline: 사용자 가이드
parent_path: /docs
---

Aspectran의 AOP는 일반적인 Spring AOP나 AspectJ처럼 애플리케이션의 모든 메서드 호출을 대상으로 하기보다는, **핵심 실행 모델인 `Activity`의 실행 흐름과 Bean 메소드 호출에 깊숙이 통합된 독자적인 AOP 모델**을 가지고 있습니다. 이는 요청 처리의 전체 단계나 특정 메소드 호출을 Join Point로 삼아 더 강력하고 구조적인 AOP를 구현할 수 있게 합니다.

주요 특징은 다음과 같습니다.

---

### 1. Join Point (언제 개입할 것인가?)

Aspectran AOP의 Join Point는 크게 두 가지로 나뉩니다.

*   **Activity 실행 (Translet 실행 단위)**: Aspectran의 가장 독특하고 강력한 Join Point입니다. 특정 **Translet**의 규칙에 따라 요청을 처리하는 `Activity`의 실행 전/후, 예외 발생 시 등 전체 흐름에 개입할 수 있습니다. 이를 통해 로깅, 트랜잭션, 인증 등과 같이 요청 처리 전반에 걸쳐 필요한 공통 기능을 매우 효과적으로 모듈화할 수 있습니다.
*   **Bean 메소드 실행**: 다른 AOP 프레임워크와 유사하게, 특정 Bean의 메소드 실행을 Join Point로 삼을 수 있습니다.

### 2. Pointcut (어디에 적용할 것인가?)

Pointcut은 Advice를 적용할 대상을 정밀하게 지정하는 표현식입니다. Aspectran에서는 설정 파일의 `<aspect>` 규칙 내 `<joinpoint>` 엘리먼트를 통해 선언적으로 Pointcut을 정의합니다.

*   **APON 형식을 이용한 상세한 정의**: `<joinpoint>` 엘리먼트 내부에는 APON(Aspectran Parameter Object Notation) 형식을 사용하여 매우 상세하고 강력한 규칙을 설정할 수 있습니다. 와일드카드(`*`)나 정규식(regexp)을 사용하여 여러 대상을 한 번에 지정하는 것이 가능합니다.

*   **포인트컷 표현식의 구조**: 포인트컷 문자열은 다음 구조를 가집니다.
    ```
    transletNamePattern[@beanOrClassPattern][^methodNamePattern]
    ```
    *   `@` 구분자 앞은 **Translet 이름 패턴**입니다. Advice를 적용할 대상 Translet의 이름 패턴을 지정합니다.
    *   `@` 구분자 뒤는 **Bean ID 또는 클래스 이름 패턴**입니다.
    *   `^` 구분자 뒤는 **메소드 이름 패턴**입니다.

*   **다양한 패턴 형식 예시**:
    *   **모든 Translet에서 특정 Bean을 대상**: Translet 이름 패턴을 생략하고 `@`로 시작하면 모든 Translet이 대상이 됩니다.
        ```xml
        <joinpoint>
            pointcut: {
                type: wildcard
                +: @someService^execute*
            }
        </joinpoint>
        ```
    *   **특정 Translet의 특정 Bean을 대상**:
        ```xml
        <joinpoint>
            pointcut: {
                type: wildcard
                +: /user/list@userService^get*
            }
        </joinpoint>
        ```
    *   **특정 Translet 자체를 대상**: Bean이나 메소드를 지정하지 않으면 해당 Translet을 실행하는 Activity의 실행 자체가 대상이 됩니다.
        ```xml
        <joinpoint>
            pointcut: {
                type: wildcard
                +: /user/*
            }
        </joinpoint>
        ```

*   **포함 및 제외 규칙**: `+` 접두사는 대상을 포함하며, `-` 접두사는 대상을 제외하는 규칙을 만들 수 있어 더욱 정교한 제어가 가능합니다.

### 3. Advice (무엇을 할 것인가?)

*   **Advice의 종류**: `com.aspectran.core.context.rule.type.AdviceType` enum에 정의된 5가지 Advice 타입을 지원합니다.
    *   `BEFORE`: Join Point 실행 전
    *   `AFTER`: Join Point가 성공적으로 실행된 후
    *   `AROUND`: `BEFORE`와 `AFTER` Advice를 함께 정의하는 편의 기능 (AspectJ의 `proceed()`와는 다름)
    *   `THROWN`: Join Point 실행 중 예외 발생 시
    *   `FINALLY`: 성공/예외 여부와 관계없이 항상 실행
*   **Advice의 구현**: Advice 로직은 특정 Bean의 메소드로 구현됩니다. 이 Advice 메소드를 호출하는 주체는 Joinpoint의 대상이 무엇이냐에 따라 다음 두 곳으로 나뉩니다.
    1.  **Bean 메소드 실행에 대한 Advice**: Bean의 메소드 호출을 가로채는 일반적인 AOP의 경우, `com.aspectran.core.component.bean.proxy.AbstractBeanProxy`가 Advice 메소드를 실행하는 역할을 합니다. 프록시가 메소드 호출을 가로챈 뒤, Advice를 실행하고 원본 메소드를 호출하는 구조입니다.
    2.  **Activity 실행에 대한 Advice**: `Activity`의 실행 자체를 Joinpoint 대상으로 할 경우, `com.aspectran.core.activity.CoreActivity`가 자신의 실행 흐름(시작 전, 실행 후 등)에 맞춰 직접 Advice를 호출합니다.

    이처럼 Aspectran은 Joinpoint 대상에 따라 최적화된 위치에서 Advice를 실행합니다.

### 4. Aspect (Advice와 Pointcut의 결합)

*   **`<aspect>` 규칙**: 설정 파일의 `<aspect>` 규칙(`AspectRule.java`)이 Aspect 역할을 합니다. 여기에는 어떤 Pointcut에 어떤 Advice(Bean 메서드)를 적용할지가 정의됩니다.
*   이를 통해 여러 공통 기능을 하나의 모듈(Aspect)로 캡슐화하여 관리할 수 있습니다.

### 5. Weaving 메커니즘: 지능적인 동적 프록시

Aspectran은 AOP를 적용하기 위해 **런타임에 동적 프록시(Dynamic Proxy)**를 사용합니다. 이 프록시는 `AbstractBeanProxy`를 기반으로 하며, 매우 효율적이고 지능적으로 동작합니다.

*   **선택적 어드바이스 적용으로 성능 최적화**:
    *   Aspectran의 AOP 프록시는 무조건 모든 메소드 호출을 가로채지 않습니다. 대신, 메소드에 `@Advisable` 어노테이션이 붙어 있는 경우에만 AOP 로직을 수행합니다.
    *   어노테이션이 없는 일반 메소드는 AOP 관련 처리를 완전히 건너뛰고 즉시 원본 메소드를 호출합니다. 이를 통해 **불필요한 프록시 오버헤드를 원천적으로 제거**하여 시스템 성능을 크게 향상시킵니다.

*   **프록시 생성 방식**:
    *   **Javassist 기반 (기본)**: **Javassist**(`JavassistProxyBean.java`)를 기본으로 사용하여 프록시 객체를 생성합니다. 이 방식은 인터페이스뿐만 아니라 일반 클래스에 대해서도 프록시를 만들 수 있어 유연성이 높습니다.
    *   **JDK 동적 프록시 지원**: 대상 Bean이 하나 이상의 인터페이스를 구현한 경우, 별도의 라이브러리가 필요 없는 JDK 기본 동적 프록시(`JdkDynamicProxyBean.java`)를 사용하도록 선택할 수 있습니다.

### 6. 어노테이션 지원

`com.aspectran.core.component.bean.annotation` 패키지를 통해 XML 설정 없이 어노테이션만으로도 AOP를 포함한 다양한 Bean 설정을 할 수 있습니다. 주요 어노테이션은 다음과 같습니다.

*   `@Component`: 클래스를 컴포넌트 스캔 대상으로 만들어 컨테이너가 관리하는 Bean으로 등록합니다. Aspect 클래스 또한 `@Aspect` 어노테이션과 더불어 `@Component`가 있어야만 스캔을 통해 자동으로 인식됩니다. `@Component`만으로 선언된 Aspect는 ID가 없는 암시적인(implicit) Advice Bean으로 등록됩니다.
*   `@Bean`: Advice Bean에 명시적인 ID를 부여하고 싶을 때 `@Component`와 함께 사용합니다. 예를 들어, `@Bean("myAdviceBean")`과 같이 ID를 지정할 수 있습니다.
*   `@Aspect`: 해당 Bean이 Aspect임을 정의합니다. `id` 속성으로 Aspect에 ID를 부여할 수 있으며, `order` 속성으로는 다른 Aspect와의 적용 우선순위를 지정할 수 있습니다. (숫자가 낮을수록 우선순위가 높습니다.)
*   `@Joinpoint`: 어드바이스를 적용할 대상을 지정하는 Pointcut을 설정합니다. `target`, `methods`, `pointcut` 표현식 등을 정의할 수 있습니다.
*   `@Settings`: Joinpoint로 선언된 어드바이스가 적용될 때, 현재 실행중인 `Activity` 컨텍스트에 설정 값을 주입합니다. 이렇게 주입된 값은 `Activity.getSetting()` 메소드를 통해 조회할 수 있습니다.
*   `@Description`: Aspect에 대한 설명을 추가합니다.
*   `@Before`, `@After`, `@Around`, `@Finally`, `@ExceptionThrown`: 각 어드바이스 타입을 정의하는 메소드에 사용됩니다.
*   `@Advisable`: AOP 어드바이스를 적용할 메소드임을 명시적으로 선언합니다.

### 7. 실용적인 AOP 활용 예제: 선언적 트랜잭션

AOP의 가장 강력한 활용 사례 중 하나는 바로 **선언적 트랜잭션 관리**입니다. 서비스 레이어의 비즈니스 로직 코드에 트랜잭션 시작(begin), 커밋(commit), 롤백(rollback) 코드를 직접 작성하는 대신, AOP를 사용하여 해당 로직들을 메소드 외부에서 투명하게 적용하는 방식입니다.

Aspectran에서는 트랜잭션의 실제 로직을 담은 **어드바이스 Bean**과, 이를 언제 어디에 적용할지 결정하는 **Aspect**를 분리하여 유연하고 재사용 가능한 설계를 할 수 있습니다. 여기서는 MyBatis 연동을 예로 들어 어노테이션 기반과 XML 기반의 트랜잭션 설정 방법을 비교하여 알아보겠습니다.

#### 1. 어노테이션 기반 선언적 트랜잭션

`jpetstore` 예제에서 사용하는 방식과 같이, 트랜잭션 제어 로직을 가진 `SqlSessionAdvice`를 상속받아 Aspect를 정의할 수 있습니다.

**`SimpleTxAspect.java` 예시:**
```java
import com.aspectran.core.component.bean.annotation.*;
import com.aspectran.core.context.rule.type.ScopeType;
import com.aspectran.mybatis.SqlSessionAdvice;
import org.apache.ibatis.session.SqlSessionFactory;

/**
 * 단순 트랜잭션 처리를 위한 Aspect.
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

*   **Pointcut 타겟**: `@Joinpoint`의 `**: @simpleSqlSession`은 ID가 `simpleSqlSession`인 Bean의 모든 public 메소드를 대상으로 Advice를 적용하라는 의미입니다.

#### 2. XML 기반 선언적 트랜잭션

XML 설정은 어노테이션 방식과 개념적으로 동일하지만, Aspect와 Advice Bean을 명확하게 분리하여 정의하는 특징이 있습니다.

**`mybatis-context.xml` 예시:**
```xml
<!-- 1. 트랜잭션의 실제 동작을 담은 어드바이스 Bean을 정의 -->
<bean id="sqlSessionTxAdvice" class="com.aspectran.mybatis.SqlSessionAdvice" scope="prototype">
    <arguments>
        <item>#{sqlSessionFactory}</item>
    </arguments>
</bean>

<!-- 2. simpleTxAspect: ID가 'simpleSqlSession'인 Bean을 감지 -->
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
*   **분리와 재사용**: 트랜잭션의 실제 로직을 담은 `sqlSessionTxAdvice` Bean을 한 번만 정의하고, 여러 `<aspect>` 설정에서 이 Bean을 재사용할 수 있습니다.

#### 3. 서비스 메소드에서의 사용

위에서 정의한 트랜잭션 Aspect를 사용하기 위해, 서비스 클래스를 해당 Aspect의 Pointcut이 감지하는 Bean으로 만들어야 합니다.

**1. 트랜잭션이 적용될 서비스 Bean 정의**

`SimpleTxAspect`는 ID가 `simpleSqlSession`인 Bean을 대상으로 하므로, 서비스 Bean의 ID를 `simpleSqlSession`으로 지정합니다. 이 Bean은 `SqlSessionAgent`를 상속하여 `SqlSession`을 편리하게 사용할 수 있습니다.

```java
import com.aspectran.core.component.bean.annotation.Bean;
import com.aspectran.core.component.bean.annotation.Component;
import com.aspectran.mybatis.SqlSessionAgent;

@Component
@Bean(id = "simpleSqlSession")
public class SimpleSqlSession extends SqlSessionAgent {
    public SimpleSqlSession() {
        // 생성자에서 이 Bean과 연관된 Aspect의 ID를 지정합니다.
        super("simpleTxAspect");
    }
}
```

**2. 비즈니스 로직에서 `SqlSession` 사용**

이제 실제 비즈니스 로직을 담은 서비스 클래스에서 생성자 주입을 통해 `SimpleSqlSession` Bean을 받아 사용합니다. MyBatis Mapper 인터페이스를 사용하는 대신, `SqlSession` 객체를 직접 사용하여 데이터베이스 작업을 수행합니다.

```java
@Component
public class OrderService {

    private final SimpleSqlSession sqlSession;

    @Autowired
    public OrderService(SimpleSqlSession sqlSession) {
        this.sqlSession = sqlSession;
    }

    public void createOrder(Order order) {
        // 주입받은 sqlSession 객체를 직접 사용하여 데이터베이스 작업을 수행합니다.
        // 이 메소드 호출 시 'simpleTxAspect'가 동작하여 트랜잭션이 자동으로 관리됩니다.
        sqlSession.insert("app.demo.mapper.OrderMapper.insertOrder", order);
    }
}
```
*   **동작 원리**: `OrderService`가 `SimpleSqlSession` Bean을 주입받고, `createOrder`와 같은 메소드 안에서 `sqlSession` 객체의 메소드(`insert`, `update` 등)를 호출하면, `SimpleSqlSession` Bean의 메소드가 호출됩니다. 이 때 `simpleTxAspect`의 Pointcut (`**: @simpleSqlSession`) 조건과 일치하므로 AOP 어드바이스가 적용됩니다. `@Before` 어드바이스가 트랜잭션을 시작하고, 메소드 실행이 끝나면 `@After`와 `@Finally`가 각각 커밋과 세션 종료를 처리합니다.

이처럼 Aspectran의 AOP를 활용하면, 비즈니스 로직과 트랜잭션 처리 로직을 완벽하게 분리하여 코드의 가독성과 유지보수성을 크게 향상시킬 수 있습니다.

---

### 결론

Aspectran의 AOP는 다음과 같이 요약할 수 있습니다.

1.  **Translet/Activity 중심의 독자적인 AOP**: 요청 처리 단위인 Translet과 이를 실행하는 Activity 전체를 Join Point로 삼아 서비스 전체에 걸친 공통 기능을 효과적으로 분리합니다.
2.  **성능과 효율성**: `@Advisable`을 통한 선택적 프록시 적용으로 불필요한 오버헤드를 제거했습니다.
3.  **유연한 설정**: XML과 어노테이션 두 가지 방식을 모두 지원하여 개발자가 프로젝트 특성에 맞게 선택할 수 있습니다.

이러한 특징들을 통해 Aspectran은 트랜잭션, 보안, 로깅 등의 시스템 레벨 서비스와 비즈니스 로직을 완벽하게 분리하여, 유지보수성이 높고 효율적인 애플리케이션 구조를 만들 수 있도록 지원합니다.
