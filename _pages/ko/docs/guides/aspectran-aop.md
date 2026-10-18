---
title: "Aspectran AOP: 기능과 아키텍처"
subheadline: 핵심 가이드
---

**AOP(Aspect-Oriented Programming, 관점 지향 프로그래밍)**는 로깅, 보안, 트랜잭션, 응답 헤더 주입, 예외 처리 등 애플리케이션 전반에 걸친 **횡단 관심사(Cross-cutting Concerns)**를 핵심 비즈니스 로직과 분리하여 모듈화하는 핵심 기술입니다.

Spring AOP가 주로 빈(Bean) 메서드 호출을 프록시로 가로채는 단일 방식에 집중되어 있다면, **Aspectran**은 프레임워크의 요청 처리 핵심 단위인 **`Activity`의 생명주기(Lifecycle)**와 **`Bean` 메서드 인터셉션**이라는 두 개의 명확한 축을 기반으로 고도로 최적화된 **실용적 AOP 아키텍처**를 제공합니다.

## 1. Aspectran AOP의 2대 아키텍처 축

Aspectran AOP는 목적과 적용 대상에 따라 두 가지 차원의 Join Point 및 인터셉션 메커니즘을 제공합니다.

| 아키텍처 축 | 대상 (Target) | 동작 원리 | 주요 적용 사례 |
| :--- | :--- | :--- | :--- |
| **Activity 생명주기 AOP**<br/>*(Translet Lifecycle)* | `Activity` (Translet 요청 처리 전체 흐름) | 프록시가 전혀 개입하지 않으며, `CoreActivity` 엔진이 생명주기 단계에 따라 Aspect를 직접 순차 실행 (Non-Proxy Core Interception) | 웹 보안 응답 헤더 주입, 전역 인코딩/뷰 디스패처 설정 주입, 요청 전/후 처리, 인증/인가, 글로벌 예외 처리 |
| **Bean 프록시 AOP**<br/>*(Method Interception)* | Bean의 메서드 실행 (`JoinpointTargetType.METHOD`) | 런타임 동적 프록시(`AbstractBeanProxy`, Javassist/JDK)가 `@Advisable` 어노테이션이 선언된 메서드 호출을 가로채 Advice 실행 | 선언적 데이터베이스 트랜잭션, 비즈니스 메서드 실행 시간 측정, 메서드 파라미터 감사(Audit) 로깅 |

### 1.1. Activity 생명주기 AOP (Non-Proxy Core Interception)

Aspectran에서 클라이언트의 모든 요청(Web, Daemon, Shell)은 하나의 `Activity` 인스턴스에 의해 실행됩니다. `Activity` 엔진은 요청의 시작부터 종료까지 정해진 생명주기 단계를 거치며, 해당 요청에 매칭되는 Aspect들을 프록시 없이 직접 순차적으로 실행합니다.

#### a. 정상 처리 흐름 (Normal Execution Flow)

요청 처리 과정에서 예외가 발생하지 않는 일반적인 실행 흐름입니다:

| 단계 | 생명주기 단계 (Lifecycle Stage) | 주요 수행 작업 및 역할 |
| :---: | :--- | :--- |
| **1단계** | **Before Advice** | 전처리 로직 실행, `<settings>`(인코딩, 뷰 디스패처) 및 보안 `<headers>` 주입, 인증/인가 검사 |
| **2단계** | **Translet Action 실행** | 핵심 비즈니스 로직(Action 메서드) 실행, 프로세스 처리 및 응답 데이터(`ProcessResult`) 생성 |
| **3단계** | **After Advice** | 정상 실행 완료 후 결과 데이터 후가공, 감사(Audit) 로그 기록 |
| **4단계** | **Finally Advice** | 성공/실패 여부와 무관하게 항상 마지막에 실행되어 세션/커넥션 정리 및 ThreadLocal 해제 |
{: .table-nowrap-1}

#### b. 예외 발생 시 처리 흐름 (Exception Handling Flow)

비즈니스 로직이나 Before 단계 실행 도중 예외가 발생하면, 시스템의 데이터 일관성과 자원 정리를 위해 다음과 같은 엄격한 순서로 제어가 전환됩니다:

| 순서 | 생명주기 단계 (Lifecycle Stage) | 주요 수행 작업 및 역할 |
| :---: | :--- | :--- |
| **1단계** | **After Advice 건너뜀 (Skip)** | 예외가 발생한 즉시 After Advice의 실행은 중단되고 건너뜁니다. |
| **2단계** | **Thrown Advice 및 예외 룰 실행 (`<thrown>`, `<exception>`)** | **Finally 단계보다 먼저 실행**되어, 데이터베이스 세션이나 리소스가 닫히기 전에 트랜잭션 롤백, 에러 로깅, 관리자 알림을 안전하게 수행합니다. 매칭된 예외 규칙에 따라 에러 뷰 디스패치(`<dispatch>`) 또는 JSON(`<transform>`) 에러 응답을 예약합니다. |
| **3단계** | **Finally Advice 실행** | 성공/실패 여부와 무관하게 항상 실행되어 `SqlSession.close()` 등 사용 중인 리소스를 안전하게 닫고 메모리를 정리합니다. |
| **4단계** | **예외 응답 전송 또는 Rethrow** | 2단계에서 예약된 예외 응답(에러 화면/JSON)을 클라이언트에 전송하거나, 처리되지 않은 예외를 상위 컨테이너로 안전하게 전파합니다. |
{: .table-nowrap-1}

* **오버헤드 제로**: 프록시 객체 생성이나 리플렉션 호출 없이 프레임워크 코어 흐름 내에서 직접 실행되므로 극도로 빠릅니다.
* **구조적 흐름 제어**: 단순한 메서드 가로채기를 넘어, 현재 요청 컨텍스트(`Activity`)의 인코딩, 뷰 디스패처, 보안 헤더, 전역 예외 처리 화면을 선언적으로 주입하고 제어할 수 있습니다.
* **완벽한 트랜잭션 무결성**: 예외 발생 시 `THROWN` 롤백 처리가 `FINALLY` 리소스 해제보다 항상 먼저 실행되므로, 커넥션이 닫혀 롤백에 실패하는 문제를 원천 방지합니다.

### 1.2. Bean 프록시 AOP (Selective Dynamic Proxying)

서비스 계층의 개별 비즈니스 메서드 단위로 AOP를 적용할 때는 동적 프록시 메커니즘을 사용합니다. Aspectran은 바이트코드 생성 라이브러리인 **Javassist**(`JavassistBeanProxy`) 또는 표준 **JDK Dynamic Proxy**(`JdkBeanProxy`)를 기반으로 프록시를 생성합니다.

* **`@Advisable` 기반 선택적 프록싱 (성능 최적화)**:
  * 프록시 객체는 모든 메서드 호출을 무차별적으로 가로채지 않습니다.
  * **`@Advisable` 또는 `@Async` 어노테이션이 선언된 메서드에 대해서만** Pointcut 검사 및 Advice 체인을 실행합니다.
  * `@Advisable`이 붙지 않은 일반 메서드는 프록시 체인을 거치지 않고 원본 메서드를 즉시 호출하므로 불필요한 프록시 오버헤드가 완전히 제거됩니다.
* **메서드 레벨 생명주기 일관성**:
  * 대상 메서드 호출 전(`Before`) ➔ 원본 메서드 실행 ➔ 정상 완료 후(`After`) ➔ 종료 시(`Finally`) 흐름이 일관되게 적용됩니다.
  * 메서드 내부에서 예외가 발생하면 `After`는 생략되고, 등록된 예외 처리(`ExceptionRule`)가 먼저 실행된 후 `Finally`가 완주됩니다.

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
| **`order`** | 다중 Aspect 간의 실행 우선순위를 지정합니다. 정수 값이 작을수록 높은 우선순위를 가지며(기본값: `Integer.MAX_VALUE`), 동일한 `order`일 경우 먼저 정의된 Aspect가 우선 실행됩니다.<br/>• **오름차순 정렬 삽입**: Aspectran의 `AdviceRuleRegistry`는 일반 Advice뿐만 아니라 `ExceptionRule` 또한 `order` 오름차순(0, 1, 2...)으로 엄격히 정렬 관리합니다.<br/>• **인프라 우선 보장**: 트랜잭션 관리와 같은 인프라 Aspect를 `order="0"`으로 지정하면, 비즈니스 Aspect보다 항상 먼저 실행되어 예외 시 롤백이 누락 없이 확실하게 보장됩니다. |
| **`isolated`** | **예외 격리 모드(`true`/`false`)**를 설정합니다.<br/>• **Aspect 수준 격리**: `isolated="true"`로 지정하면 해당 Aspect의 Advice 실행 중 예외가 발생하더라도 전체 요청 처리 흐름이 중단되지 않고 오류 로그만 기록한 후 정상 진행됩니다. 비즈니스 로직에 영향을 주지 않아야 하는 통계, 모니터링, 외부 알림 Aspect에 매우 유용합니다.<br/>• **코어 수준의 2중 격리 보호**: 예외 처리 단계에서 특정 예외 액션이 실패하더라도 프레임워크 코어가 내부 `try-catch`로 격리하여, 뒤따르는 다른 Aspect의 예외 룰과 데이터베이스 롤백이 100% 끝까지 완주되도록 보장합니다. |
| **`disabled`** | `true`로 설정하면 해당 Aspect를 런타임에 비활성화합니다. |

### 2.2. Joinpoint 및 Pointcut 정밀 제어 (`<joinpoint>`)

`<joinpoint>` 요소는 Aspect가 적용될 대상과 시점을 정밀하게 지정합니다.

```xml
<joinpoint target="activity">
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

| 속성 / 요소 | 기본값 | 설명 |
| :--- | :--- | :--- |
| **`target`** | `activity` | Joinpoint 대상 유형을 지정합니다.<br/>• **`activity`**: Translet 요청의 전체 생명주기 단계에 인터셉션합니다 (Non-Proxy Core Interception).<br/>• **`method`**: Bean 내부의 `@Advisable` 어노테이션이 선언된 메서드 호출을 동적 프록시로 가로챕니다 (Selective Dynamic Proxying). |
| **`methods`** | 전체 | Aspect가 동작할 HTTP 요청 메서드 목록을 제한합니다 (`GET`, `POST` 등). |
| **`headers`** | 전체 | 클라이언트의 특정 요청 헤더 조건을 검사하여 Aspect 실행 여부를 결정합니다. |
| **`pointcut`** | 전체 | 대상 Translet, Bean ID, Class명, Method 패턴을 조합하여 정밀 필터링합니다. |

#### a. Pointcut 표현식 구조
Pointcut은 APON 형식으로 작성되며, 다음과 같은 패턴 구조를 가집니다:

<div style="display: inline-flex; align-items: center; gap: 6px; font-family: monospace; font-size: 0.95em; margin-bottom: 1rem;">
  <span style="background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.35); padding: 3px 8px; border-radius: 4px;">transletPattern</span>
  <span style="color: #f87171; font-weight: bold; font-size: 1.15em;">@</span>
  <span style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.35); padding: 3px 8px; border-radius: 4px;">beanOrClassPattern</span>
  <span style="color: #f87171; font-weight: bold; font-size: 1.15em;">^</span>
  <span style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); padding: 3px 8px; border-radius: 4px;">methodNamePattern</span>
</div>

Pointcut 표현식은 3개의 영역으로 구성되며, 구분자(`@`, `^`)를 통해 각 대상을 정밀하게 조합할 수 있습니다. 각 영역은 필요에 따라 생략 가능합니다.

* **구분자(Delimiters)**:
  * **`@` (Bean/Class 구분자)**: Translet 패턴과 Bean/Class 패턴을 구분합니다.
  * **`^` (Method 구분자)**: Bean/Class 패턴과 Method 패턴을 구분합니다.

* **영역별 구성 요소**:
  * **Translet 패턴** (`@` 앞): 대상 Translet의 이름 또는 요청 URI 경로 패턴을 지정합니다 (예: `/user/**`, `/api/v1/*`). 생략 시 모든 Translet을 대상으로 합니다.
  * **Bean ID 패턴** (`@` 뒤, `^` 앞): 대상 빈의 식별자(ID) 패턴을 지정합니다 (예: `@userService`, `@*Service`). 지시자 없이 이름만 작성하면 Bean ID로 해석됩니다.
  * **Class 패턴** (`@class:` 뒤, `^` 앞): 대상 클래스의 완전한 패키지명/클래스명 패턴을 지정합니다. 클래스 타입을 타겟팅할 때는 **반드시 `class:` 지시자(Prefix)**를 붙여야 합니다 (예: `@class:com.mycompany.service.*`, `@class:*.UserServiceImpl`). 특정 인터페이스 구현체나 익명 빈(ID가 없는 빈)을 일괄 타겟팅할 때 필수적입니다.
  * **Method 패턴** (`^` 뒤): 대상 메서드 이름 패턴을 지정합니다 (예: `^get*`, `^save*`, `^execute`). 생략 시 대상 빈의 모든 메서드 또는 Activity 생명주기 단계에 적용됩니다.

| 패턴 형식 | 패턴 예시 | 타겟팅 대상 설명 |
| :--- | :--- | :--- |
| `transletPattern` | `/order/**` | `/order/` 하위 모든 Translet 자체의 **Activity 생명주기**를 타겟팅 |
| `transletPattern@beanId` | `/user/*@userDao` | `/user/*` Translet 내에서 실행되는 `userDao` 빈을 타겟팅 |
| `transletPattern@class:className` | `/api/**@class:com.mycompany.dao.*` | `/api/**` Translet 내에서 해당 패키지에 속한 클래스 타입의 빈들을 타겟팅 |
| `transletPattern@beanId^methodName` | `/user/*@userService^get*` | `/user/*` Translet 내 `userService` 빈의 `get`으로 시작하는 메서드를 타겟팅 |
| `transletPattern@class:className^methodName` | `/translet@class:hello.Simplest^hello*` | `/translet` 요청 내 `hello.Simplest` 클래스의 `hello`로 시작하는 메서드를 타겟팅 |
| `@beanId` | `@orderService` | 모든 Translet에서 `orderService` 빈을 타겟팅 |
| `@class:className` | `@class:com.mycompany.service.*` | 모든 Translet에서 `com.mycompany.service` 패키지 하위 클래스 빈들을 타겟팅 |
| `@beanId^methodName` | `@orderService^process*` | 모든 Translet에서 `orderService` 빈의 `process`로 시작하는 메서드를 타겟팅 |
| `@class:className^methodName` | `@class:com.mycompany.service.*Service^process*` | 모든 Service 클래스의 `process`로 시작하는 메서드를 타겟팅 |
| `@^methodName` | `@^execute*` | Translet 및 빈 종류와 상관없이 모든 빈의 `execute`로 시작하는 메서드를 타겟팅 |

* **패턴 매칭 고급 기능**:
  * **단일 세그먼트 와일드카드 (`*`)**: 구분자(`/` 또는 `.`)를 제외한 단일 세그먼트 내에서 0개 이상의 임의 문자열과 매칭됩니다 (예: `/api/*`는 `/api/users`와 매칭되나 `/api/v1/users`와는 불일치, `com.example.*Service`는 `com.example.UserService`와 매칭).
  * **다중 계층 와일드카드 (`**`)**: 구분자를 포함하여 모든 하위 경로 또는 하위 패키지 전체와 매칭됩니다 (예: `/user/**`는 `/user/list`, `/user/a/b/c` 모두 매칭, `@class:com.mycompany.**Service`는 `com.mycompany.order.OrderService`와 매칭).
  * **단일 문자 와일드카드 (`?`)**: 1개의 임의 문자와 매칭됩니다.
  * **다중 패턴 OR 결합 (`|`)**: 파이프라인(`|`) 기호로 복수 패턴을 연결하여 단일 규칙에서 OR 조건을 평가할 수 있습니다 (예: `+: /user/**|/order/**@userService|orderService^get*|find*`).
  * **계층형 경로 및 네임스페이스 매칭**: Translet 이름은 슬래시(`/`) 구분자를, 빈 ID 및 클래스명은 점(`.`) 구분자를 기반으로 정밀하게 매칭됩니다.

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
    </settings>
</aspect>
```

* **`characterEncoding`**: 요청 및 응답의 기본 문자 인코딩 설정
* **`viewDispatcher`**: 해당 요청 범위에서 사용할 기본 `ViewDispatcher` 빈 지정

### 2.4. Advice 유형 및 구성 (`<advice>`)

Advice는 대상 Joinpoint 시점에 실행할 구체적인 로직을 정의합니다. Aspectran은 명확하고 예측 가능한 흐름 제어를 위해 **4가지 표준 Advice 유형**을 지원합니다:

| Advice 유형 | 실행 시점 | 주요 용도 |
| :--- | :--- | :--- |
| **`before`** | Joinpoint 실행 전 | 요청 유효성 검증, 보안 인증 확인, 응답 헤더 주입, 시작 시각 기록 |
| **`after`** | Joinpoint 정상 실행 완료 후 | 결과 데이터 추가 가공, 감사 로그 기록 (예외 발생 시 실행 생략) |
| **`thrown`** | 예외 발생 시 | 오류 로깅, 트랜잭션 롤백, 알림 발송 (Finally 실행 전에 호출됨) |
| **`finally`** | 성공/실패 여부와 관계없이 항상 마지막 | 리소스 해제, 세션 정리, ThreadLocal 정리, 소요 시간 계산 및 프로파일링 |

> **💡 Around Advice를 지양하고 4대 표준 Advice를 채택한 이유:**
> 다중 프록시를 중첩 호출하는 Around Advice 방식은 호출 스택의 급격한 증가, 디버깅 복잡성, 예외 전파 추적의 어려움을 야기합니다. Aspectran은 선언적이고 명확한 4단계 생명주기(Before / After / Thrown / Finally)를 제공함으로써, 프록시 체이닝 오버헤드 없이도 트랜잭션 경계, 성능 프로파일링, 보안 검증, 리소스 정리를 완벽하고 명료하게 해결합니다.

`<advice>` 내부에서는 Bean 메서드 호출(`<invoke>`), Action 실행(`<action>`), 그리고 **선언적 응답 헤더 주입(`<headers>`)**을 자유롭게 구성할 수 있습니다:

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

#### `<thrown>`의 정밀한 예외 매칭
`<advice>`의 `<thrown>` 및 `<exception>`의 `<thrown>`은 `type` 속성에 특정 예외 클래스를 지정할 수 있습니다 (`type="com.mycompany.MyException"`). Aspectran의 내부 매칭 엔진은 지정된 예외 클래스뿐만 아니라 **상속 계층(`isAssignableFrom`) 및 원인 예외(`getCause()`)**까지 깊이 탐색하여 해당 예외를 정확하게 포착합니다.

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
        <!-- 특정 예외 발생 시 전용 에러 페이지 디스패치 -->
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

#### a. `<advice><thrown>`과 `<exception><thrown>`의 차이점

Aspectran에서는 예외 발생 시 동작을 정의할 때 `<advice>` 내부의 `<thrown>`과 `<exception>` 내부의 `<thrown>` 두 가지 방식을 제공합니다. 두 기능은 목적과 예외 전파 방식에서 명확한 차이가 있습니다:

| 구분 | `<advice><thrown>` (예외 발생 시 부가 처리) | `<exception><thrown>` (글로벌 예외 응답 매핑) |
| :--- | :--- | :--- |
| **주요 목적** | 예외 발생 시 로깅, 트랜잭션 롤백, 관리자 알림 등 부가 로직 실행 | 발생한 예외를 가로채 전용 에러 화면 디스패치 또는 JSON 에러 응답 반환 |
| **예외 전파** | Advice 로직을 실행한 후 **예외를 삼키지 않고 상위로 계속 전파(Rethrow)** | 예외를 완전히 처리(Catch)하여 **클라이언트에게 정상적인 에러 응답 전송** |
| **사용 가능한 액션** | Bean 메서드 호출(`<invoke>`), Action 실행(`<action>`), 헤더 주입(`<headers>`) | 화면 디스패치(`<dispatch>`), 데이터 변환(`<transform>`), Action 실행(`<action>`) |
| **어노테이션 대응** | `@ExceptionThrown` 어노테이션이 선언된 Advice 메서드 | Translet/Aspect 예외 처리 규칙 매핑 |

#### b. 다중 예외 처리 규칙의 우선순위 평가 원칙

애플리케이션 내에 여러 예외 처리 규칙이 정의되어 있을 때, Aspectran은 다음 원칙에 따라 최우선 규칙을 선정합니다:

1. **`TransletRule`의 로컬 `<exception>` 최우선**:
   개별 Translet에 직접 선언된 `<exception>` 규칙이 언제나 최우선으로 평가됩니다. 특정 API나 페이지에 특화된 비즈니스 에러 응답이 글로벌 설정보다 우선권을 갖습니다.
2. **Aspect의 글로벌 `<exception>`은 `order` 오름차순으로 순차 평가**:
   매칭된 Aspect들의 `<exception>` 규칙 목록은 `order` 속성값이 작은 순서(0, 1, 2...)대로 순차 평가됩니다.
3. **가장 구체적인 예외 타입 우선 매칭**:
   동일한 블록 내에서는 발생한 예외와 가장 상속 거리가 가까운 구체적인 예외(`UserNotFoundException`)가 범용 예외(`Throwable`)보다 먼저 매칭됩니다.
4. **격리된 완주 보장**:
   어느 하나의 예외 액션에서 새로운 에러가 발생하더라도 프레임워크 코어가 이를 격리 로깅하고 뒤이어 등록된 다른 Aspect의 예외 룰(트랜잭션 롤백 등)을 끝까지 호출합니다.

## 3. Java 어노테이션 기반 AOP 설정

Aspectran은 XML 설정 없이 순수 Java 클래스와 어노테이션만으로 완전한 AOP를 구성할 수 있습니다.

### 3.1. 주요 AOP 어노테이션

| 어노테이션 | 설명 | 주요 속성 |
| :--- | :--- | :--- |
| **`@Aspect`** | 클래스를 Aspect로 선언합니다. (`@Component`와 함께 사용) | `id`, `order`, `isolated`, `disabled` |
| **`@Joinpoint`** | Aspect의 적용 대상(Pointcut)을 선언합니다. | `pointcut`, `target`, `methods`, `headers` |
| **`@Before`** | 대상 실행 전에 호출될 Advice 메서드 지정 | - |
| **`@After`** | 대상 정상 실행 후 호출될 Advice 메서드 지정 | - |
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
    public void onError(Translet translet) {
        Throwable e = translet.getRaisedException();
        logger.error("[Request Error] {} - {}", translet.getRequestName(), e.getMessage(), e);
    }

    @Finally
    public void onFinally(Translet translet) {
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
        <property name="contentType">text/html</property>
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
                    <item name="Content-Security-Policy">default-src 'self'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com;</item>
                </headers>
            </before>
        </advice>
    </aspect>
</aspectran>
```

### 패턴 2: 선언적 트랜잭션 관리 (`SqlSessionAdvice` + `@Advisable`)

MyBatis `SqlSession`의 생명주기(세션 열기, 커밋, 롤백, 세션 닫기)를 AOP로 완벽히 분리하여 선언적으로 관리합니다.

**1. 트랜잭션 Aspect 정의 (`mybatis-rules.xml`):**
```xml
<!-- 1. SqlSessionAdvice 빈 등록 (요청별로 새 인스턴스를 사용하도록 prototype으로 설정) -->
<bean id="sqlSessionTxAdvice" class="com.aspectran.mybatis.SqlSessionAdvice" scope="prototype">
    <argument>#{sqlSessionFactory}</argument>
</bean>

<!-- 2. 선언적 트랜잭션 관리 Aspect (order="0"으로 최우선 순위 부여) -->
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
            <thrown>
                <invoke method="rollback"/>
            </thrown>
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
        // 예외가 발생하면 after(commit)가 생략되고, finally/thrown(rollback)에서 안전하게 롤백된 후 세션이 닫힙니다.
    }
}
```

* **트랜잭션 안전성 원리**:
  * 정상 완료 시: `before(open)` ➔ 비즈니스 로직 ➔ `after(commit)` ➔ `finally(close)`
  * 예외 발생 시: `before(open)` ➔ 비즈니스 로직(예외 발생) ➔ `after(commit)` 자동 생략 ➔ `<finally><thrown>`에서 명시적 `rollback` 실행 ➔ `finally(close)`에서 세션 안전 종료 및 반환.

### 패턴 3: 성능 프로파일링 및 감사 로깅 (Before + Finally 패턴)

실행 시간이 오래 걸리는 API 호출을 감지하고 모니터링하기 위해 `Before`와 `Finally` Advice를 조합하여 오버헤드 없는 정밀한 성능 프로파일링을 구현합니다.

```java
package com.aspectran.demo.aspect;

import com.aspectran.core.activity.Translet;
import com.aspectran.core.component.bean.annotation.Aspect;
import com.aspectran.core.component.bean.annotation.Before;
import com.aspectran.core.component.bean.annotation.Component;
import com.aspectran.core.component.bean.annotation.Finally;
import com.aspectran.core.component.bean.annotation.Joinpoint;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
@Aspect(id = "profilingAspect", order = 10, isolated = true)
@Joinpoint(pointcut = "+: /api/**")
public class ProfilingAspect {

    private static final Logger logger = LoggerFactory.getLogger(ProfilingAspect.class);

    @Before
    public long startProfiling(Translet translet) {
        // 반환값은 현재 Activity의 beforeAdviceResult에 Aspect ID("profilingAspect")로 자동 저장됨
        return System.currentTimeMillis();
    }

    @Finally
    public void endProfiling(Translet translet) {
        // beforeAdviceResult에서 시작 시간을 조회
        Long startTime = translet.getBeforeAdviceResult("profilingAspect");
        if (startTime != null) {
            long elapsedTime = System.currentTimeMillis() - startTime;
            if (elapsedTime > 500) {
                logger.warn("[SLOW API] {} {} took {} ms (status: {})",
                        translet.getRequestMethod(),
                        translet.getRequestName(),
                        elapsedTime,
                        (translet.isExceptionRaised() ? "ERROR" : "SUCCESS"));
            }
        }
    }
}
```

* **이 방식의 장점**:
  * **프레임워크 자동 결과 바인딩**: `@Before` 어드바이스 메서드가 값을 반환하면(예: `long`), Aspectran 엔진이 해당 실행 결과를 현재 `Activity`의 `beforeAdviceResult`에 애스펙트 ID(`"profilingAspect"`) 키로 자동 보관합니다. 따라서 `@Finally` 메서드에서 `translet.getBeforeAdviceResult("profilingAspect")`를 호출하여 별도의 수동 속성 관리 없이도 즉시 시작 시각을 깔끔하게 조회할 수 있습니다.
  * Around Advice의 중첩 인터셉터 체이닝 오버헤드가 전혀 발생하지 않습니다.
  * 요청 컨텍스트에 안전하게 저장되므로 동시성 문제 없이 완벽한 스레드 세이프티를 유지합니다.
  * 성공/실패 여부와 상관없이 `Finally` 단계에서 소요 시간을 정밀하게 집계할 수 있습니다.

### 패턴 4: 비즈니스 오류 응답 매핑과 트랜잭션 롤백의 조화

비즈니스 예외 발생 시 RESTful JSON 에러 응답을 반환하면서도, 데이터베이스 트랜잭션 롤백이 누락되지 않도록 AOP를 구성합니다.

```xml
<aspectran>
    <!-- 1. 트랜잭션 관리 Aspect (order="0") -->
    <aspect id="txAspect" order="0">
        <joinpoint>
            pointcut: {
                +: /api/**@*Service^*
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
                <thrown>
                    <invoke method="rollback"/>
                </thrown>
                <invoke method="close"/>
            </finally>
        </advice>
    </aspect>

    <!-- 2. 전역 RESTful 예외 응답 Aspect (order="1") -->
    <aspect id="apiExceptionAspect" order="1">
        <joinpoint>
            pointcut: {
                +: /api/**
            }
        </joinpoint>
        <exception>
            <!-- 비즈니스 유효성 검증 실패 시 400 Bad Request JSON 반환 -->
            <thrown type="com.mycompany.common.exception.ValidationException">
                <transform type="json" contentType="application/json; charset=UTF-8">
                    <template>
                        {"code": "INVALID_INPUT", "message": "@{exception.message}"}
                    </template>
                </transform>
            </thrown>
            <!-- 서버 내부 오류 시 500 JSON 반환 -->
            <thrown type="java.lang.Throwable">
                <action bean="errorAlertService" method="sendAlert"/>
                <transform type="json" contentType="application/json; charset=UTF-8">
                    <template>
                        {"code": "SERVER_ERROR", "message": "An unexpected error occurred."}
                    </template>
                </transform>
            </thrown>
        </exception>
    </aspect>
</aspectran>
```

* `order="0"`인 `txAspect`가 먼저 등록되어 있으므로 예외 발생 시 트랜잭션 롤백과 리소스 해제가 보장되며, 뒤이어 `order="1"`인 `apiExceptionAspect`가 동작하여 클라이언트에게 알맞은 JSON 응답을 전송합니다.

## 5. 결론

Aspectran의 AOP는 복잡하고 무거운 범용 프록시 메커니즘 대신, **프레임워크 코어의 요청 생명주기(`Activity`)**와 **선택적 빈 프록싱(`@Advisable`)**이라는 두 가지 최적화된 방식을 제공합니다.

1. **Activity 생명주기 AOP**: 프록시 오버헤드 없이 전역 환경 설정, 보안 헤더 주입, 인증, 공통 예외 처리를 선언적으로 제어합니다.
2. **Bean 프록시 AOP**: 필요한 비즈니스 메서드에만 선택적으로 동적 프록시를 적용하여 트랜잭션 및 비즈니스 로깅을 유연하게 처리합니다.
3. **완벽한 생명주기 보장**: 4대 표준 Advice(Before, After, Thrown, Finally)와 정밀한 `order` 오름차순 정렬, 코어 수준의 2중 예외 격리를 통해 어떤 상황에서도 엔터프라이즈급 트랜잭션 무결성과 리소스 정리를 완벽히 수행합니다.

이를 통해 개발자는 불필요한 설정과 성능 저하 없이 직관적이고 견고한 엔터프라이즈 아키텍처를 설계할 수 있습니다.
