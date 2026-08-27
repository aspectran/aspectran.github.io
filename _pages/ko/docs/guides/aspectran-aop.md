---
title: "Aspectran AOP: 기능과 아키텍처"
subheadline: 핵심 가이드
---

**AOP(Aspect-Oriented Programming, 관점 지향 프로그래밍)**는 로깅, 보안, 트랜잭션, 응답 헤더 주입, 예외 처리 등 애플리케이션 전반에 걸친 **횡단 관심사(Cross-cutting Concerns)**를 핵심 비즈니스 로직과 분리하여 모듈화하는 핵심 기술입니다.

Spring AOP가 주로 빈(Bean) 메서드 호출을 프록시로 가로채는 방식에 집중되어 있다면, **Aspectran**은 프레임워크의 요청 처리 핵심 단위인 **`Activity`의 생명주기(Lifecycle)**와 **`Bean` 메서드 인터셉션**이라는 두 개의 명확한 축을 기반으로 고도로 최적화된 **실용적 AOP 아키텍처**를 제공합니다.

## 1. Aspectran AOP의 2대 아키텍처 축

Aspectran AOP는 목적과 적용 대상에 따라 두 가지 차원의 Join Point 및 인터셉션 메커니즘을 제공합니다.

| 아키텍처 축 | 대상 (Target) | 동작 원리 | 주요 적용 사례 |
| :--- | :--- | :--- | :--- |
| **Activity 생명주기 AOP**<br/>*(Translet Lifecycle)* | `Activity` (Translet 요청 처리 전체 흐름) | 프록시가 전혀 개입하지 않으며, `CoreActivity` 엔진이 생명주기 단계에 따라 Aspect를 직접 실행 (Non-Proxy Core Interception) | 웹 보안 응답 헤더 주입, 전역 인코딩/뷰 디스패처 설정 주입, 요청 전/후 처리, 인증/인가, 글로벌 예외 처리 |
| **Bean 프록시 AOP**<br/>*(Method Interception)* | Bean의 메서드 실행 (`JoinpointTargetType.METHOD`) | 런타임 동적 프록시(`AbstractBeanProxy`, Javassist/JDK)가 `@Advisable` 어노테이션이 선언된 메서드 호출을 가로채 Advice 실행 | 선언적 데이터베이스 트랜잭션, 비즈니스 메서드 실행 시간 측정, 메서드 파라미터 감사(Audit) 로깅 |
{: .text-nowrap}

### 1.1. Activity 생명주기 AOP (Non-Proxy Core Interception)

Aspectran에서 클라이언트의 요청(Web, Daemon, Shell)은 하나의 `Activity` 인스턴스에 의해 실행됩니다. `Activity` 엔진은 요청의 시작부터 종료까지 정해진 생명주기 단계를 거치며, 해당 요청에 매칭되는 Aspect들을 프록시 없이 직접 순차적으로 실행합니다.

| 단계 | 생명주기 단계 (Lifecycle Stage) | 주요 수행 작업 및 역할 |
| :---: | :--- | :--- |
| **1단계** | **Before Advice** | 전처리 로직 실행, `<settings>`(인코딩, 뷰 디스패처) 및 보안 `<headers>` 주입, 인증/인가 검사 |
| **2단계** | **Translet Action 실행** | 핵심 비즈니스 로직(Action 메서드) 실행, 프로세스 처리 및 응답 데이터 생성 |
| **3단계** | **After Advice** | 정상 실행 완료 후 결과 데이터 후가공, 감사(Audit) 로그 기록 |
| **4단계** | **Exception Handling (`<exception>`)** | 예외 발생 시 에러 화면(`<dispatch>`) 또는 JSON(`<transform>`) 에러 응답 매핑 |
| **5단계** | **Finally Advice** | 성공/실패 여부와 무관하게 항상 마지막에 실행되어 리소스 및 ThreadLocal 정리 |
{: .text-nowrap}

* **오버헤드 제로**: 프록시 객체 생성이나 리플렉션 호출 없이 프레임워크 코어 흐름 내에서 직접 실행되므로 극도로 빠릅니다.
* **구조적 흐름 제어**: 단순한 메서드 가로채기를 넘어, 현재 요청 컨텍스트(`Activity`)의 인코딩, 뷰 디스패처, 보안 헤더, 전역 예외 처리 화면을 선언적으로 주입하고 제어할 수 있습니다.

### 1.2. Bean 프록시 AOP (Selective Dynamic Proxying)

서비스 계층의 개별 비즈니스 메서드 단위로 AOP를 적용할 때는 동적 프록시 메커니즘을 사용합니다. Aspectran은 바이트코드 생성 라이브러리인 **Javassist**(`JavassistProxyBean`) 또는 표준 **JDK Dynamic Proxy**(`JdkDynamicProxyBean`)를 기반으로 프록시를 생성합니다.

* **`@Advisable` 기반 선택적 프록싱 (성능 최적화)**:
  * 프록시 객체는 모든 메서드 호출을 무차별적으로 가로채지 않습니다.
  * **`@Advisable` 어노테이션이 선언된 메서드에 대해서만** Pointcut 검사 및 Advice 체인을 실행합니다.
  * `@Advisable`이 붙지 않은 일반 메서드는 프록시를 거치지 않고 원본 메서드를 즉시 호출하므로 불필요한 프록시 오버헤드가 완전히 제거됩니다.

## 2. `<aspect>` 규칙의 핵심 구성 요소

Aspectran의 AOP는 XML 설정 파일의 `<aspect>` 요소 또는 자바 어노테이션을 통해 선언적으로 정의됩니다.

### 2.1. Aspect 기본 속성

```xml
<aspect id="sampleAspect" order="0" isolated="true" disabled="false">
    ...
</aspect>
```

| 속성 | 설명 |
| :--- | :--- |
| **`id`** | Aspect의 고유 식별자입니다. |
| **`order`** | 다중 Aspect 간의 실행 우선순위를 지정합니다. 정수 값이 작을수록 높은 우선순위를 가지며(기본값: `Integer.MAX_VALUE`), 동일한 `order`일 경우 먼저 정의된 Aspect가 우선 실행됩니다. |
| **`isolated`** | **예외 격리 모드(`true`/`false`)**를 설정합니다. `isolated="true"`로 지정하면 해당 Aspect의 Advice 실행 중 예외가 발생하더라도 전체 요청 처리 흐름이 중단되지 않고 오류 로그만 기록한 후 정상 진행됩니다. 비즈니스 로직에 영향을 주지 않아야 하는 통계, 모니터링, 외부 알림 Aspect에 매우 유용합니다. |
| **`disabled`** | `true`로 설정하면 해당 Aspect를 런타임에 비활성화합니다. |
{: .text-nowrap}

### 2.2. Joinpoint 및 Pointcut 정밀 제어 (`<joinpoint>`)

`<joinpoint>` 요소는 Aspect가 적용될 대상과 시점을 정밀하게 지정합니다.

```xml
<joinpoint>
    methods: [
        GET
        POST
    ]
    headers: [
        "Accept=text/html"
        "Origin"
    ]
    pointcut: {
        type: wildcard
        +: /user/**@userService^get*
        +: /order/**
        -: /order/temp-*
    }
</joinpoint>
```

#### a. Pointcut 표현식 구조
Pointcut은 APON 형식으로 작성되며, 다음과 같은 패턴 구조를 가집니다:

$$\text{transletPattern}[\text{@beanOrClassPattern}][\text{^methodNamePattern}]$$

* **Translet 패턴** (`@` 앞): 대상 Translet의 URI/이름 패턴을 지정합니다 (예: `/user/**`, `/api/*`).
* **Bean/Class 패턴** (`@` 뒤): 대상 Bean ID 또는 완전한 클래스명 패턴을 지정합니다 (예: `@userService`, `@com.mycompany.service.*`).
* **Method 패턴** (`^` 뒤): 대상 메서드 이름 패턴을 지정합니다 (예: `^get*`, `^execute`).

*패턴 지정 예시:*
* **특정 Translet 내의 특정 Bean 메서드**: `+: /user/list@userService^get*`
* **모든 Translet에서 특정 Bean 메서드**: `+: @orderService^process*` (Translet 패턴 생략)
* **특정 Translet 자체 (Activity 생명주기 대상)**: `+: /order/**` (Bean/Method 패턴 생략)

#### b. 포함(`+:`) 및 제외(`-:`) 규칙과 평가 순서

Aspectran의 Pointcut 필터링 엔진은 선언된 **순서(Top-Down)**대로 규칙을 순차 평가하여 최종 적용 대상을 정밀하게 결정합니다:

* **`+:` (Include, 포함)**: 지정한 패턴에 매칭되는 대상을 AOP 적용 대상에 포함합니다.
* **`-:` (Exclude, 제외)**: 지정한 패턴에 매칭되는 대상을 AOP 적용 대상에서 제외합니다.

> **💡 중요 (순서 기반 정교한 제어):**
> 상위에 넓은 범위를 포함(`+:`)시킨 후, 하위에 특정 예외 대상을 제외(`-:`)시키는 방식으로 복잡한 타겟팅을 직관적으로 구성할 수 있습니다. 반대로 특정 대상을 먼저 포함하고 상위 범위를 제외하는 순서로도 구성할 수 있습니다.

**와일드카드 방식 예제 (`type: wildcard`):**
```xml
<joinpoint>
    pointcut: {
        type: wildcard
        +: /api/**                     # 1. /api/ 하위의 모든 요청 포함
        -: /api/auth/login             # 2. 로그인 API는 인증 검사 대상에서 제외
        -: /api/health-check           # 3. 헬스체크 API 제외
        +: /admin/**@adminService^*    # 4. /admin/ 요청 중 adminService의 메서드 포함
        -: /admin/**@adminService^get* # 5. 단, get으로 시작하는 조회 메서드는 제외
    }
</joinpoint>
```

**정규 표현식 방식 예제 (`type: regexp`):**
정규식을 사용할 경우 `include`와 `exclude` 블록을 분리하여 더욱 엄격한 패턴 검사를 수행할 수 있습니다.
```xml
<joinpoint>
    pointcut: {
        type: regexp
        include: {
            translet: "^/api/v[1-9]/.*"
            bean: "^(user|order)Service$"
            method: "^(create|update|delete).*"
        }
        exclude: {
            translet: "^/api/v.*/temp-.*"
            bean: "^.*TestBean$"
        }
    }
</joinpoint>
```

#### c. 요청 메서드 (`methods`) 필터링
`GET`, `POST`, `PUT`, `DELETE`, `PATCH` 등 특정 HTTP 요청 메서드에 대해서만 Aspect가 동작하도록 제한할 수 있습니다.

#### d. 요청 헤더 (`headers`) 필터링
클라이언트의 요청 헤더 상태에 따라 Aspect의 실행 여부를 선언적으로 제어합니다:
* **헤더 존재 여부**: `"Origin"` (해당 요청 헤더가 존재하는 경우에만 실행)
* **값 일치 검사**: `"X-Requested-With=XMLHttpRequest"` (헤더 값이 일치하는 경우)
* **부정 비교**: `"Accept!=application/json"` (헤더에 특정 미디어 타입이 포함되지 않은 경우)
* **복합 미디어 타입 매칭 (Web 환경)**: 브라우저가 전송하는 복합 `Accept` 헤더(예: `text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8`)를 분석하여, 품질 계수(q-value)에 따라 실제 HTML 요청인지(`"Accept=text/html"`) 정교하게 판별하여 매칭합니다.

### 2.3. Settings 컨텍스트 주입 (`<settings>`)

`<settings>`는 매칭된 Translet의 `Activity` 컨텍스트에 환경 설정을 자동으로 주입합니다. 이를 통해 각 Translet마다 반복 설정할 필요 없이 전역/공통 설정을 일괄 적용할 수 있습니다.

```xml
<aspect id="webTransletSettings">
    <joinpoint>
        pointcut: {
            +: /**
        }
    </joinpoint>
    <settings>
        <setting name="characterEncoding" value="utf-8"/>
        <setting name="viewDispatcher" value="thymeleafViewDispatcher"/>
        <setting name="proxyProtocolAware" value="true"/>
    </settings>
</aspect>
```

* **`characterEncoding`**: 요청 및 응답의 기본 문자 인코딩 설정
* **`viewDispatcher`**: 해당 요청 범위에서 사용할 기본 `ViewDispatcher` 빈 지정
* **`proxyProtocolAware`**: Nginx/HAProxy 등 리버스 프록시 뒤에서 실제 클라이언트 IP/포트를 해석할지 여부

### 2.4. Advice 유형 및 구성 (`<advice>`)

Advice는 대상 Joinpoint 시점에 실행할 구체적인 로직을 정의합니다. 5가지 표준 Advice 유형을 지원합니다:

| Advice 유형 | 실행 시점 | 주요 용도 |
| :--- | :--- | :--- |
| **`before`** | Joinpoint 실행 전 | 요청 유효성 검증, 보안 인증 확인, 응답 헤더 주입 |
| **`after`** | Joinpoint 정상 실행 완료 후 | 결과 데이터 추가 가공, 감사 로그 기록 |
| **`around`** | Joinpoint 실행 전과 후 전체 | 실행 시간 측정(Profiling), 트랜잭션 시작 및 커밋 |
| **`thrown`** | 예외 발생 시 | 오류 로깅, 트랜잭션 롤백, 알림 발송 |
| **`finally`** | 성공/실패 여부와 관계없이 항상 마지막 | 리소스 해제, 세션 정리, ThreadLocal 정리 |

`<advice>` 내부에서는 Bean 메서드 호출(`<invoke>`), Action 실행(`<action>`), 그리고 **선언적 응답 헤더 주입(`<headers>`)**을 구성할 수 있습니다:

```xml
<advice bean="securityAdvice">
    <before>
        <!-- 응답 헤더 선언적 주입 -->
        <headers>
            <item name="X-Frame-Options">SAMEORIGIN</item>
            <item name="X-Content-Type-Options">nosniff</item>
            <item name="X-XSS-Protection">1; mode=block</item>
        </headers>
        <!-- Advice Bean 메서드 실행 -->
        <invoke method="checkAuthentication"/>
    </before>
</advice>
```

### 2.5. 글로벌 예외 처리 (`<exception>`)

AOP 레벨에서 `<exception>` 요소를 정의하면, Translet 실행 중 발생하는 특정 예외를 가로채 전용 에러 화면을 디스패치하거나 RESTful JSON 에러 응답으로 변환할 수 있습니다.

```xml
<aspect id="globalExceptionAspect">
    <joinpoint>
        pointcut: {
            +: /**
        }
    </joinpoint>
    <exception>
        <!-- 특정 예외 발생 시 에러 페이지 디스패치 -->
        <thrown type="com.mycompany.common.exception.UserNotFoundException">
            <dispatch name="error/user-not-found" contentType="text/html" encoding="UTF-8"/>
        </thrown>
        <!-- 모든 일반 예외 발생 시 공통 에러 화면 제공 -->
        <thrown type="java.lang.Throwable">
            <action bean="errorLogger" method="logError"/>
            <dispatch name="error/500" contentType="text/html" encoding="UTF-8"/>
        </thrown>
    </exception>
</aspect>
```

## 3. Java 어노테이션 기반 AOP 설정

Aspectran은 XML 설정 없이 순수 Java 클래스와 어노테이션만으로 완전한 AOP를 구성할 수 있습니다.

### 3.1. 주요 AOP 어노테이션

| 어노테이션 | 설명 | 주요 속성 |
| :--- | :--- | :--- |
| **`@Aspect`** | 클래스를 Aspect로 선언합니다. (`@Component`와 함께 사용) | `id`, `order`, `isolated`, `disabled` |
| **`@Joinpoint`** | Aspect의 적용 대상(Pointcut)을 선언합니다. | `pointcut`, `target`, `methods`, `headers` |
| **`@Before`** | 대상 실행 전에 호출될 Advice 메서드 지정 | - |
| **`@After`** | 대상 정상 실행 후 호출될 Advice 메서드 지정 | - |
| **`@Around`** | 대상 실행 전후를 감싸는 Advice 메서드 지정 | - |
| **`@Finally`** | 항상 마지막에 실행될 Advice 메서드 지정 | - |
| **`@ExceptionThrown`** | 예외 발생 시 실행될 Advice 메서드 지정 | `value` (대상 예외 클래스 타입) |
| **`@Settings`** | Activity 컨텍스트에 주입할 설정을 지정 | `name`, `value` |
| **`@Advisable`** | Bean 프록시 AOP의 적용 대상 메서드임을 명시 | - |

### 3.2. 어노테이션 기반 Aspect 구현 예제

```java
package com.aspectran.demo.aspect;

import com.aspectran.core.activity.Activity;
import com.aspectran.core.activity.Translet;
import com.aspectran.core.component.bean.annotation.After;
import com.aspectran.core.component.bean.annotation.Aspect;
import com.aspectran.core.component.bean.annotation.Before;
import com.aspectran.core.component.bean.annotation.Component;
import com.aspectran.core.component.bean.annotation.ExceptionThrown;
import com.aspectran.core.component.bean.annotation.Finally;
import com.aspectran.core.component.bean.annotation.Joinpoint;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
@Aspect(id = "loggingAspect", order = 1, isolated = true)
@Joinpoint(
    pointcut = {
        "+: /api/**",
        "-: /api/health-check"
    }
)
public class LoggingAspect {

    private static final Logger logger = LoggerFactory.getLogger(LoggingAspect.class);

    @Before
    public void beforeRequest(Translet translet) {
        logger.info("[Request Start] {} {}", translet.getRequestMethod(), translet.getRequestName());
    }

    @After
    public void afterRequest(Translet translet) {
        logger.info("[Request Success] {}", translet.getRequestName());
    }

    @ExceptionThrown(Exception.class)
    public void onError(Translet translet, Exception e) {
        logger.error("[Request Error] {} - {}", translet.getRequestName(), e.getMessage(), e);
    }

    @Finally
    public void onFinally(Activity activity) {
        // 리소스 정리 로직 수행
    }
}
```

## 4. 실무 베스트 프랙티스 활용 패턴

### 패턴 1: 전역 웹 보안 및 환경 설정 자동화

웹 애플리케이션의 모든 HTML 요청에 대해 보안 응답 헤더(CSP, X-Frame-Options 등)와 기본 `ViewDispatcher`를 자동으로 주입합니다.

```xml
<aspectran>
    <!-- 1. 뷰 디스패처 등록 -->
    <bean id="thymeleafViewDispatcher" class="com.aspectran.thymeleaf.view.ThymeleafViewDispatcher">
        <argument>#{thymeleafEngine}</argument>
    </bean>

    <!-- 2. 전역 웹 트랜스릿 설정 Aspect -->
    <aspect id="webTransletSettings">
        <joinpoint>
            pointcut: {
                +: /**
            }
        </joinpoint>
        <settings>
            <setting name="characterEncoding" value="utf-8"/>
            <setting name="viewDispatcher" value="thymeleafViewDispatcher"/>
        </settings>
        <advice>
            <before>
                <headers>
                    <item name="X-Frame-Options">SAMEORIGIN</item>
                    <item name="X-Content-Type-Options">nosniff</item>
                    <item name="X-XSS-Protection">1; mode=block</item>
                    <item name="Referrer-Policy">strict-origin-when-cross-origin</item>
                </headers>
            </before>
        </advice>
    </aspect>

    <!-- 3. HTML 페이지 전용 보안 헤더 Aspect -->
    <aspect id="htmlWebSecuritySettings">
        <joinpoint>
            headers: [
                "Accept=text/html"
            ]
            pointcut: {
                +: /**
            }
        </joinpoint>
        <advice>
            <before>
                <headers>
                    <item name="Content-Type">text/html; charset=utf-8</item>
                    <item name="Content-Security-Policy">default-src 'self'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com;</item>
                </headers>
            </before>
        </advice>
    </aspect>
</aspectran>
```

### 패턴 2: 선언적 트랜잭션 관리 (`SqlSessionAdvice` + `@Advisable`)

MyBatis `SqlSession`의 생명주기(세션 열기, 커밋, 롤백, 세션 닫기)를 AOP로 완벽히 분리합니다.

**1. 트랜잭션 Aspect 정의 (`mybatis-context.xml`):**
```xml
<!-- 1. SqlSessionAdvice 빈 등록 -->
<bean id="sqlSessionTxAdvice" class="com.aspectran.mybatis.SqlSessionAdvice" scope="prototype">
    <argument>#{sqlSessionFactory}</argument>
</bean>

<!-- 2. 트랜잭션 Aspect 정의 -->
<aspect id="txAspect" order="0">
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

**2. 서비스 계층에서의 트랜잭션 사용:**
```java
@Component
public class OrderService {

    private final SimpleSqlSession sqlSession;

    @Autowired
    public OrderService(SimpleSqlSession sqlSession) {
        this.sqlSession = sqlSession;
    }

    public void processOrder(Order order) {
        // sqlSession.insert 호출 시 txAspect가 발동하여 트랜잭션이 자동으로 관리됩니다.
        sqlSession.insert("app.demo.mapper.OrderMapper.insertOrder", order);
        sqlSession.update("app.demo.mapper.ItemMapper.updateStock", order.getItemId());
    }
}
```

### 패턴 3: RESTful API 성능 프로파일링 (Around Advice)

실행 시간이 오래 걸리는 API 호출을 감지하고 모니터링하기 위해 Around Advice를 구현합니다.

```java
package com.aspectran.demo.aspect;

import com.aspectran.core.activity.Translet;
import com.aspectran.core.component.bean.annotation.Around;
import com.aspectran.core.component.bean.annotation.Aspect;
import com.aspectran.core.component.bean.annotation.Component;
import com.aspectran.core.component.bean.annotation.Joinpoint;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
@Aspect(id = "profilingAspect", isolated = true)
@Joinpoint(pointcut = "+: /api/**")
public class ProfilingAspect {

    private static final Logger logger = LoggerFactory.getLogger(ProfilingAspect.class);

    @Around
    public Object profile(Translet translet) throws Throwable {
        long startTime = System.currentTimeMillis();
        try {
            // 실제 요청 처리 진행
            return null;
        } finally {
            long elapsedTime = System.currentTimeMillis() - startTime;
            if (elapsedTime > 500) {
                logger.warn("[SLOW QUERY/API] {} took {} ms", translet.getRequestName(), elapsedTime);
            }
        }
    }
}
```

## 5. 결론

Aspectran의 AOP는 복잡하고 무거운 AOP 메커니즘 대신, **프레임워크 코어의 요청 생명주기(`Activity`)**와 **선택적 빈 프록싱(`@Advisable`)**이라는 두 가지 최적화된 방식을 제공합니다.

1. **Activity 생명주기 AOP**: 프록시 오버헤드 없이 전역 환경 설정, 보안 헤더 주입, 인증, 공통 예외 처리를 선언적으로 제어합니다.
2. **Bean 프록시 AOP**: 필요한 비즈니스 메서드에만 선택적으로 동적 프록시를 적용하여 트랜잭션 및 비즈니스 로깅을 유연하게 처리합니다.

이를 통해 개발자는 불필요한 설정과 성능 저하 없이 직관적이고 견고한 엔터프라이즈 아키텍처를 설계할 수 있습니다.
