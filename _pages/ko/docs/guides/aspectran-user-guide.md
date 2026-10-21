---
title: Aspectran 사용자 가이드
teaser: Aspectran을 처음 접하는 개발자들을 위한 가이드 문서입니다.
subheadline: 핵심 가이드
---

{% capture info_message %}
Aspectran은 JVM 기반의 경량 고성능 프레임워크로, 단순한 명령줄 애플리케이션부터 복잡한 엔터프라이즈 웹 서비스에 이르기까지 다양한 유형의 애플리케이션을 효율적으로 구축할 수 있도록 설계되었습니다. 이 가이드는 Aspectran을 처음 접하는 개발자가 프레임워크의 핵심 철학과 아키텍처를 체계적으로 이해하고, 애플리케이션 구축에 필요한 주요 구성 요소를 올바르게 활용할 수 있도록 돕기 위해 작성되었습니다.
{% endcapture %}
{% include alert.liquid info=info_message %}

## 1. Aspectran 소개

### 1.1. Aspectran이란?

Aspectran은 간단한 커맨드 라인 도구부터 복잡한 엔터프라이즈 웹 서비스까지 다양한 애플리케이션을 개발할 수 있는 자바(Java) 기반의 경량 고성능 프레임워크입니다. 웹(Web), 셸(Shell), 데몬(Daemon) 등 다양한 플랫폼에서 일관된 프로그래밍 환경을 제공하며, 개발자가 유연하고 재사용 가능한 컴포넌트를 쉽게 구축할 수 있도록 지원합니다.

### 1.2. 핵심 철학 및 장점

*   **POJO 중심 프로그래밍**: 특별한 인터페이스 구현이나 특정 프레임워크 클래스 상속 없이 일반 Java 객체(POJO)를 사용하여 비즈니스 로직을 구현할 수 있습니다. 이는 개발자가 프레임워크에 대한 학습 부담을 줄이고, 순수한 Java 코드로 비즈니스 문제를 해결하는 데 집중할 수 있게 합니다.
*   **경량 및 고성능**: 최소한의 종속성과 최적화된 리소스 사용으로 빠른 시작 시간과 낮은 메모리 점유율을 제공합니다.
*   **제어의 역전 (IoC) 및 의존성 주입 (DI)**: 프레임워크가 객체의 생성, 구성, 생명주기 관리를 담당하며, 필요한 의존성을 자동으로 주입하여 컴포넌트 간의 결합도를 최소화하고 유연하며 재사용 가능한 코드를 작성할 수 있도록 돕습니다.
*   **관점 지향 프로그래밍 (AOP)**: 로깅, 트랜잭션, 보안 등 애플리케이션 전반에 걸쳐 반복적으로 나타나는 횡단 관심사를 모듈화하여 핵심 비즈니스 로직과 분리합니다.
*   **환경 추상화를 위한 어댑터 패턴**: 동일한 비즈니스 로직이 어떤 환경(웹, 셸, 데몬 등)에서든 수정 없이 실행될 수 있도록 유연성을 제공합니다.

## 2. Aspectran 시작하기

Aspectran은 쉽게 시작할 수 있도록 설계되었습니다. 간단한 "Hello, World" 애플리케이션을 직접 만들어보며 Aspectran 프로젝트의 기본 구조와 동작 방식을 빠르게 파악할 수 있습니다.

1.  **프로젝트 설정**: Maven 프로젝트를 생성하고 `aspectran-core` 의존성을 추가합니다.
2.  **구성**: `aspectran-config.apon` 파일을 생성하여 컴포넌트 스캔을 위한 베이스 패키지를 지정합니다.
3.  **코드 작성**: `@Component`와 `@Request` 어노테이션을 사용하여 명령을 처리할 간단한 POJO 클래스를 작성합니다.
4.  **실행**: 프로젝트를 빌드하고 독립형 애플리케이션으로 실행합니다.

첫 번째 Aspectran 애플리케이션을 만드는 단계별 튜토리얼은 [Aspectran 시작하기](/ko/docs/guides/aspectran-getting-started/) 문서를 참고하세요.

## 3. Aspectran 핵심 개념

Aspectran 프레임워크를 효과적으로 사용하기 위해서는 몇 가지 핵심 개념을 이해하는 것이 중요합니다.

### 3.1. Translet (트랜슬렛)

Aspectran에서 요청 처리의 핵심 개념은 `Activity`, `Translet`, `Action`입니다. 이들의 관계를 이해하는 것이 중요합니다.

*   **Activity**: 실제로 요청을 처리하고 최종 응답을 생성하는 **실행 엔진**입니다.
*   **Translet**: 특정 요청에 매핑되어 "어떻게 처리할 것인가"를 정의하는 **설계도 또는 규칙의 집합**입니다.
*   **Action**: `Activity`에 의해 실행되며, 실제 비즈니스 로직을 수행하는 **개별 작업 단위**입니다.

Translet이라는 이름만 보면 실제 요청을 처리하는 주체로 보일 수 있으나, 이는 `Activity`에 직접 접근이 제한되는 사용자 관점에서 비롯된 오해입니다. 실제 모든 처리의 주체는 `Activity`입니다.

#### 3.1.1. Translet의 역할 및 중요성

Translet의 핵심 역할은 **요청 처리 흐름을 정의하는 설계도**가 되는 것입니다.

*   **요청 처리 규칙의 집합**: 특정 요청(웹 환경의 URL, 셸 환경의 명령어 등)에 매핑되어, 요청 파라미터 처리, 실행할 액션, 응답 생성 방식, 예외 처리 등 전체 처리 흐름을 선언적으로 정의합니다.
*   **프로그래밍 인터페이스**: `Activity`와 사용자 코드 간의 데이터 공유 및 제어를 위한 통로 역할을 합니다.
*   **유연한 처리 흐름**: 요청 처리, 액션 실행, 콘텐츠 생성, 변환, 응답 및 전달 등 다양한 처리 규칙을 조합하여 단순한 작업부터 복잡한 워크플로우까지 유연하게 설계할 수 있습니다.

#### 3.1.2. Translet 정의 방법

Aspectran은 Translet을 정의하는 두 가지 주요 방법을 제공합니다.

1.  **선언적 규칙 기반 (XML/APON)**:
    전통적인 방식이며, XML 또는 APON(Aspectran Parameters Object Notation) 형식의 설정 파일을 사용하여 Translet의 처리 흐름을 선언적으로 정의합니다. 비즈니스 로직과 처리 흐름을 완벽히 분리할 수 있어 설정의 가시성을 높여줍니다.

    ```xml
    <translet name="/user/info">
        <action bean="userDao" method="getUserInfo"/>
        <transform format="json"/>
    </translet>
    ```
    위 예제는 `/user/info` 요청이 들어오면 `userDao` 빈의 `getUserInfo` 메소드를 실행하고, 그 결과를 JSON 형식으로 변환하여 응답하는 Translet을 정의합니다.

2.  **어노테이션 기반 (Java 코드)**:
    Java 코드 내에서 어노테이션을 사용하여 Translet을 직접 정의하는 현대적인 방법입니다. 개발자에게 높은 편의성과 직관적인 생산성을 제공합니다.

    *   **Activity 클래스와 Action 메서드**:
        Aspectran에서는 웹 요청을 처리하는 컴포넌트의 클래스명에 **`*Activity`** 접미사(예: `UserActivity`, `ReportActivity`, `OrderActivity`)를 붙이는 것을 표준 관례로 삼습니다. 하나의 Activity 클래스 안에는 비즈니스 단위별로 여러 Action 메서드가 정의되며, 이 메서드들이 Translet에서 호출할 Action으로 등록됩니다.
        `@RequestToGet`, `@RequestToPost` 등 요청 매핑 어노테이션이 부여된 메서드는 실제 내부적으로 `InvokeAction`(`AnnotatedAction`)에 의해 실행되는 핵심 Action으로 작동합니다.

    *   **`@Action` 어노테이션과 결과값 모델 활용**:
        액션 메서드에 **`@Action("actionId")`** 어노테이션을 선언하여 해당 Action에 고유한 ID를 명시적으로 부여할 수 있습니다.
        Action 메서드가 실행되고 반환한 결과값은 View 템플릿이나 응답 변환기에서 다음과 같이 자연스럽게 활용됩니다:
        *   **뷰 템플릿 모델 연동**: `Dispatch`를 통해 화면을 렌더링할 때 Action ID는 뷰 템플릿(Thymeleaf, FreeMarker, JSP 등)의 모델 속성으로 직접 참조할 수 있습니다. Aspectran은 내부적으로 **`ActivityData`**를 통해 액션 결과, 요청 파라미터, 속성을 통합된 단일 뷰 모델로 제공하므로 복잡한 데이터 저장 구조를 신경 쓰지 않고도 템플릿에서 손쉽게 데이터를 출력할 수 있습니다.
        *   **데이터 변환 응답 (`@Transform`)**: `@Transform(format = FormatType.JSON)` 등을 사용할 때 변환기(Transformer)는 Action ID를 최상위 키 또는 노드 이름으로 취급하여 직관적이고 구조화된 응답을 생성합니다.
        *   **자바 코드 접근**: 자바 코드 내에서 액션의 실행 결과에 직접 접근해야 할 경우 `translet.getProcessResult("actionId")`나 `translet.getActivityData().get("actionId")`를 통해 조회할 수 있습니다.

        ```java
        @Component
        public class UserActivity {

            private final UserDao userDao;

            @Autowired
            public UserActivity(UserDao userDao) {
                this.userDao = userDao;
            }

            // GET /user/info/${userId} 요청 매핑
            // Action ID "userInfo" 부여 -> JSON 변환 시 "userInfo"가 루트 키로 매핑됨
            @RequestToGet("/user/info/${userId}")
            @Action("userInfo")
            @Transform(format = FormatType.JSON)
            public User getUserInfo(Long userId) {
                return userDao.getUserById(userId);
            }

            // GET /user/profile/${userId} 요청 매핑
            // "userProfile" Action ID로 뷰 템플릿(Thymeleaf, FreeMarker, JSP)에서 모델 데이터 바로 사용
            @RequestToGet("/user/profile/${userId}")
            @Action("userProfile")
            @Dispatch("user/profile")
            public User getUserProfile(Long userId) {
                return userDao.getUserById(userId);
            }

        }
        ```

    *   **경로 변수 및 파라미터 매핑**:
        Aspectran은 URI 경로 패턴에서 **AsEL 토큰 문법**을 직접 지원하여, URL 경로에서 파싱된 값이 저장될 대상 스코프를 선언적으로 지정할 수 있습니다:
        *   **`${variableName}` (파라미터 토큰)**:
            예: `@RequestToGet("/user/info/${userId}")`
            경로에서 파싱된 `userId` 값이 **요청 파라미터(`ParameterMap`)**에 자동으로 추가됩니다. 따라서 메서드 매개변수(`Long userId` 등)로 자동 바인딩되거나 `translet.getParameter("userId")`로 바로 조회할 수 있습니다. 가장 보편적으로 사용되는 방식입니다.
        *   **`@{variableName}` (어트리뷰트 토큰)**:
            예: `@RequestToGet("/user/info/@{userId}")`
            경로에서 파싱된 `userId` 값이 **요청 속성(`AttributeMap`)**에 자동으로 추가됩니다. 별도의 저장 코드 없이도 `translet.getAttribute("userId")`로 조회되거나, JSP나 Thymeleaf 같은 뷰 템플릿의 모델 속성으로 즉시 전달되어 렌더링에 바로 활용할 수 있습니다.
        *   **일반 요청 파라미터 및 DTO 바인딩**: HTTP 쿼리 스트링이나 폼 파라미터 역시 메서드 인자 이름과 일치하면 기본 타입으로 자동 변환 주입되며, 복합 DTO/Command 객체(POJO)를 선언하면 Setter 메서드를 통해 자동으로 주입(Model Binding)됩니다. 메서드 인자에 `Translet` 타입을 선언하면 현재 실행 중인 `Translet` 인스턴스도 함께 주입받을 수 있습니다.
        *   **필수 인자 검증 (`@NonNull`)**: 표준 JSpecify의 `@NonNull`(`org.jspecify.annotations.NonNull`) 어노테이션을 매개변수에 선언하여 필수 파라미터 누락 시 유효성 검증을 안전하게 수행합니다.

    *   **비동기 요청 처리**: 시간이 오래 걸리는 작업을 처리해야 할 경우, `async = true` 속성을 사용하여 Translet을 비동기적으로 실행할 수 있습니다. 이는 요청 스레드를 차단하지 않고 백그라운드에서 작업을 수행하여 애플리케이션의 응답성을 유지하는 데 도움을 줍니다.

        ```java
        @Component
        public class ReportActivity {

            private final ReportService reportService;

            @Autowired
            public ReportActivity(ReportService reportService) {
                this.reportService = reportService;
            }

            @RequestToPost(translet = "/reports/generate", async = true, timeout = 30000L)
            @Action("generationResult")
            @Transform(format = FormatType.TEXT)
            public String generateReport(Translet translet) {
                Parameters parameters = translet.getRequestAdapter().getBodyAsParameters();
                reportService.generate(parameters);
                return "Report generation has started in the background.";
            }

        }
        ```

    *   **어노테이션 상세**: `@Request` 어노테이션은 요청 경로, 요청 메소드 등 상세한 규칙을 정의할 때 사용합니다. 편의를 위해 `GET`, `POST` 등 각 요청 메소드에 해당하는 `@RequestToGet`, `@RequestToPost`, `@RequestToPut`, `@RequestToDelete`, `@RequestToPatch` 같은 전용 어노테이션도 제공됩니다. 이 어노테이션들은 `value` 또는 `translet` (경로), `async`, `timeout` 속성을 공통으로 가집니다.

#### 3.1.3. 요청 경로 매핑 및 검색 우선순위

Translet 규칙이 XML이나 Java 어노테이션으로 등록되면, 클라이언트의 요청(URL 경로 및 HTTP 메소드)이 들어왔을 때 가장 적합한 Translet을 찾아 실행해야 합니다. Aspectran은 Ant-style을 정밀하게 확장한 독자적인 **와일드카드 패턴 매칭 엔진**과 **가중치 기반 우선순위 시스템**을 통해 요청을 정확하게 라우팅합니다.

##### 1. 와일드카드 및 경로 변수 토큰
*   `*`: 세그먼트(경로 구분자 `/`) 내에서 0개 이상의 문자와 매칭됩니다. (구분자를 넘지 못함)
*   `**`: 여러 세그먼트를 가로질러 0개 이상의 문자와 매칭됩니다. (구분자를 포함하여 매칭)
*   `?`: 세그먼트 내에서 0개 또는 1개의 문자와 매칭됩니다.
*   `+`: 세그먼트 내에서 **정확히 1개**의 문자와 매칭됩니다. (빈 문자열 불허)
*   `${variableName}`: 해당 위치의 경로 세그먼트를 추출하여 **요청 파라미터(`ParameterMap`)**에 등록합니다. 메서드 인자 바인딩이나 `translet.getParameter()`로 조회할 수 있습니다.
*   `@{variableName}`: 해당 위치의 경로 세그먼트를 추출하여 **요청 속성(`AttributeMap`)**에 등록합니다. 뷰 템플릿 모델 전달이나 `translet.getAttribute()`로 조회할 수 있습니다.

##### 2. 유연한 구조 매칭
*   **선행 `**/` 생략 가능**: `**/user`는 `/user`뿐만 아니라 최상위의 `user`와도 매칭됩니다.
*   **후행 `/**` 생략 가능**: `/api/**`는 `/api/`의 하위 경로뿐만 아니라 `/api` 자체와도 매칭됩니다.
*   **중간 `/**/` 생략 가능**: `a/**/b`는 `a/x/b`뿐만 아니라 `a/b`와도 매칭됩니다.

##### 3. Translet 검색 우선순위 (Resolution Priority)
`Activity`가 요청을 수신했을 때 `TransletRuleRegistry`에서 처리할 Translet을 결정하는 우선순위는 다음과 같습니다:
1.  **완전 일치 (Exact Match) 최우선**: 와일드카드나 경로 변수가 없는 정확한 경로 규칙이 가장 먼저 선택됩니다.
2.  **더 구체적인 패턴 우선**: 가중치 시스템에 의해 덜 추상적이고 구체적인 패턴이 우선권을 갖습니다. (예: `/users/${id}/profile`은 `/users/${id}/*`보다 우선함)
3.  **HTTP 메소드 미지정 Translet으로의 대체 (Fallback)**: `POST`, `PUT` 등 특정 메소드가 명시되지 않은 Translet 규칙이 있다면, 일치하는 전용 메소드 규칙이 없을 때 기본 규칙으로 폴백 처리됩니다.
4.  **나중에 정의된 규칙이 우선 (오버라이드)**: 동일한 이름과 메소드로 정의된 규칙이 여러 개일 경우, 나중에 등록된 규칙이 기존 규칙을 덮어씁니다.

#### 3.1.4. Translet 내부 구성 요소와 Action 파이프라인

Translet은 단순한 요청 매핑 객체가 아니라, 요청 수신부터 응답 반환까지의 여러 작업을 순차적이고 조건적으로 실행할 수 있는 **워크플로우 파이프라인 설계도**입니다.

##### 1. 4대 표준 Action 유형
Translet 내부에서 실행되는 작업 단위인 Action은 크게 네 가지 표준 유형으로 나뉩니다:

*   **Invoke Action (`<invoke>`)**:
    IoC 컨테이너에 등록된 Bean의 특정 비즈니스 메서드를 호출합니다. Java 어노테이션 기반에서는 Activity 클래스 내의 액션 메서드가 `@RequestTo*`와 결합하여 내부적으로 `InvokeAction`(`AnnotatedAction`)으로 등록되며, `@Action("actionId")`를 통해 고유한 Action ID를 부여받습니다. Action의 실행 결과는 Action ID를 키로 삼아 `ProcessResult`에 저장되어 후속 처리나 뷰 템플릿 모델로 자연스럽게 연결됩니다.
    ```xml
    <action id="order" bean="orderService" method="createOrder"/>
    ```

*   **Echo Action (`<echo>`)**:
    요청 파라미터나 특정 속성을 응답 모델에 포함하거나 화면에 전달하기 위해 에코(Echo)합니다.
    ```xml
    <echo id="echoInfo">
        <item name="orderId"/>
        <item name="customerName"/>
    </echo>
    ```

*   **Header Action (`<headers>`)**:
    클라이언트에 전송될 HTTP 응답 헤더(캐시 제어, 커스텀 보안 헤더 등)를 선언적으로 일괄 설정합니다.
    ```xml
    <headers>
        <item name="Cache-Control">no-cache, no-store, must-revalidate</item>
        <item name="Pragma">no-cache</item>
    </headers>
    ```

*   **Include Action (`<include>`)**:
    다른 Translet을 서브루틴처럼 호출하여 실행하고, 그 결과를 현재 Translet의 처리 파이프라인 내에 포함합니다. 공통 위젯이나 반복되는 데이터 조회를 모듈화하여 재사용할 때 매우 유용합니다.
    ```xml
    <include id="userProfile" translet="/user/profile-widget"/>
    ```

##### 2. 콘텐츠 블록 (`<contents>`) 및 실행 결과 관리 (`ProcessResult` 및 `ActivityData`)
하나의 Translet 내에 여러 Action이 정의될 경우, 각 Action의 실행 결과는 Action ID를 키로 하여 **`ProcessResult`** 컨테이너에 체계적으로 저장됩니다.
Aspectran은 **`ActivityData`**를 통해 이러한 Action 실행 결과, 요청 파라미터, 속성을 단일 모델 퍼사드로 통합 제공하므로, 뷰 템플릿(Thymeleaf, FreeMarker, JSP 등)이나 자바 코드에서는 복잡한 내부 저장 구조를 신경 쓸 필요 없이 Action ID를 통해 데이터에 자연스럽게 접근할 수 있습니다:
*   **뷰 템플릿 연동**: `Dispatch` 응답을 통해 화면을 렌더링할 때 Action ID를 이름으로 바로 참조하여 화면에 출력할 수 있습니다.
*   **자바 코드 및 AsEL 조회**: 자바 코드 내에서 `translet.getProcessResult("actionId")` 또는 `translet.getActivityData().get("actionId")`로 손쉽게 조회할 수 있습니다.
*   **전체 결과 트리 제어**: 복잡한 다단계 액션 파이프라인에서는 `translet.getProcessResult()`를 통해 콘텐츠 블록(`ContentResult`) 단위로 구조화된 전체 실행 결과를 직접 순회하고 제어할 수 있습니다.

##### 3. 조건부 분기 실행 제어 (`<choose>`, `<when>`, `<otherwise>`)
Aspectran은 자바 코드로 복잡한 `if-else` 분기를 작성하지 않고도, 선언적 규칙 레벨에서 요청 파라미터, 헤더, 프로퍼티 조건에 따라 특정 Action이나 Response를 선택적으로 실행할 수 있는 조건부 제어 태그를 제공합니다.

```xml
<translet name="/dashboard">
    <choose>
        <when test="${role == 'admin'}">
            <action id="dashboardData" bean="adminService" method="getAdminDashboard"/>
            <dispatch name="dashboard/admin"/>
        </when>
        <otherwise>
            <action id="dashboardData" bean="userService" method="getUserDashboard"/>
            <dispatch name="dashboard/user"/>
        </otherwise>
    </choose>
</translet>
```

#### 3.1.5. Translet 선언적 예외 처리 (`<exception>` / `<thrown>`)

Translet 실행 중 비즈니스 로직(Action)이나 뷰 렌더링 단계에서 특정 예외가 발생할 경우, 이를 선언적으로 가로채어 에러 전용 뷰로 디스패치하거나 변환 응답(JSON/XML)으로 처리할 수 있습니다.

```xml
<translet name="/order/checkout">
    <action bean="orderService" method="checkout"/>
    <dispatch name="order/complete"/>
    <exception>
        <thrown type="com.example.OutOfStockException">
            <transform format="json">
                <template>{"status": "fail", "message": "상품 재고가 부족합니다."}</template>
            </transform>
        </thrown>
        <thrown type="java.lang.Exception">
            <dispatch name="error/general"/>
        </thrown>
    </exception>
</translet>
```
`thrown` 태그에 대상 예외 클래스 타입을 지정하면 하위 타입까지 포괄하여 매칭되며, 가장 구체적인 예외 타입에 일치하는 처리가 우선적으로 실행됩니다.

#### 3.1.6. Translet의 생명주기 및 Activity와의 관계

`Activity`는 요청이 들어오면 **`TransletRuleRegistry`**에서 가장 적합한 Translet 규칙(설계도)을 찾아 인스턴스를 생성하고, 그 규칙에 따라 요청을 처리합니다. 즉, Translet은 '설계도'이고 `Activity`는 그 설계도를 보고 일하는 '실행 엔진'과 같습니다. `TransletRuleRegistry`는 빠르고 효율적인 조회를 위해 고도로 최적화된 자료구조이며, 요청 이름, 요청 메소드, 와일드카드 및 경로 변수 패턴을 사용하여 Translet을 찾아냅니다.

`Activity`는 Translet에 정의된 규칙에 따라 요청 정보를 파싱하고, 비즈니스 로직을 담고 있는 Action들을 순차적으로 실행합니다. `@RequestToGet`과 같은 어노테이션이 붙는 메소드를 Action 메소드라고 부르며, 기본적으로 Bean의 메소드를 호출하는 Invoke Action 외에 Echo Action, Header Action, Include Action 등 다양한 유형의 Action이 있습니다.

이 과정에서 생성된 `Translet` 인스턴스는 `Activity`와 사용자 코드(주로 Action 메소드) 사이의 **'소통을 위한 매개체'** 역할을 합니다. Action 메소드의 인자로 `Translet` 타입이 선언되어 있으면, `Activity`는 메소드 호출 시 `Translet` 인스턴스를 자동으로 주입해 줍니다. 개발자는 이 `Translet` 인스턴스를 통해 `Activity`가 생성한 데이터에 접근(`getActivityData()` 메소드)하거나, 데이터를 추가적으로 가공하고 응답 로직을 임의로 제어하는 등 프레임워크와 상호작용할 수 있습니다.

이처럼 Translet은 복잡한 내부 실행 로직(`Activity`)을 감추고 사용자에게는 명확하고 단순한 '설계도'와 '인터페이스'만을 보여주는, 잘 설계된 **퍼사드(Facade)**입니다.

자세한 내용은 [Aspectran의 대표 얼굴: Translet 이해하기](/ko/docs/guides/aspectran-translet/) 및 [Aspectran Translet 실용 가이드](/ko/docs/guides/practical-guide-to-translets/) 문서를 참고하세요.

### 3.2. Bean (빈)

Bean은 Aspectran의 IoC(Inversion of Control) 컨테이너에 의해 관리되는 자바 객체입니다. 애플리케이션의 서비스, 데이터 접근 객체(DAO), 유틸리티 등 모든 구성 요소는 Bean으로 등록되어 프레임워크에 의해 생명주기가 관리되고, 필요한 곳에 의존성 주입(DI)을 통해 제공됩니다.

#### 3.2.1. IoC와 DI의 이해

*   **IoC (제어의 역전)**: 객체의 생성, 구성, 생명주기 관리를 개발자가 직접 하는 대신, Aspectran 컨테이너가 이 역할을 전담합니다. 개발자는 객체를 정의하기만 하면, 프레임워크가 적절한 시점에 객체를 인스턴스화하고 필요한 의존성을 연결해 줍니다. 이를 통해 개발자는 비즈니스 로직에만 집중할 수 있습니다.
*   **DI (의존성 주입)**: IoC를 구현하는 핵심 메커니즘입니다. 객체가 자신이 필요로 하는 다른 객체(의존성)를 직접 생성하거나 찾지 않고, 외부(IoC 컨테이너)로부터 주입받는 방식입니다. 이는 컴포넌트 간의 결합도를 낮추어 코드의 재사용성, 테스트 용이성, 유지보수성을 크게 향상시킵니다.

#### 3.2.2. 빈 정의 방법

Aspectran에서 Bean을 정의하는 가장 일반적인 방법은 어노테이션을 사용하는 것입니다.

*   **`@Component`를 사용한 자동 탐지**: 클래스에 `@Component` 어노테이션을 추가하는 것이 가장 쉽고 권장되는 방법입니다. Aspectran의 클래스패스 스캐너가 애플리케이션 시작 시 이를 자동으로 탐지하여 Bean으로 등록합니다.

    ```java
    package com.example.myapp.service;

    import com.aspectran.core.component.bean.annotation.Component;

    @Component
    public class MyService {
        public String getMessage() {
            return "Hello from MyService!";
        }
    }
    ```

*   **`@Bean`을 사용한 명시적 정의**: `@Bean` 어노테이션은 Bean에 특정 ID를 부여하거나, 복잡한 초기화 로직이 필요한 경우, 또는 서드파티 라이브러리 객체를 Bean으로 등록할 때 유용합니다. `@Component` 클래스 내부에 객체를 반환하는 메소드에 `@Bean`을 붙여 사용할 수 있습니다.

    ```java
    @Component
    public class AppConfig {
        @Bean("myCustomClient") // Bean의 ID를 myCustomClient로 지정
        public SomeLibraryClient someLibraryClient() {
            // 복잡한 초기화 로직 또는 외부 라이브러리 객체 생성
            return new SomeLibraryClient("api.example.com", "your-api-key");
        }
    }
    ```

#### 3.2.3. 의존성 주입 (`@Autowired`)

`@Autowired` 어노테이션을 사용하여 Aspectran 컨테이너가 관리하는 다른 Bean을 현재 Bean에 자동으로 주입받을 수 있습니다.

*   **생성자 주입 (권장)**: 의존성을 `final`로 선언하여 불변(immutable)하게 만들고, 객체가 생성될 때 모든 필수 의존성이 주입되었음을 보장합니다. 이는 코드의 안정성과 테스트 용이성을 높이는 가장 좋은 방법입니다.

    ```java
    @Component
    public class MyActivity {
        private final MyService myService;

        @Autowired
        public MyActivity(MyService myService) {
            this.myService = myService;
        }
    }
    ```

*   **필드 및 수정자(Setter) 주입**: 선택적 의존성을 주입할 때 유용하지만, 생성자 주입을 우선적으로 고려해야 합니다. 필드 주입은 `public` 필드에만 가능하며, 일반적으로 권장되지 않습니다.

*   **`@Qualifier`로 모호성 해결**: 동일한 타입의 Bean이 여러 개 있을 때, `@Qualifier("beanId")`를 사용하여 주입할 특정 Bean의 ID를 지정할 수 있습니다.

    ```java
    public interface NotificationService { /* ... */ }

    @Component
    @Bean("email")
    public class EmailNotificationService implements NotificationService { /* ... */ }

    @Component
    @Bean("sms")
    public class SmsNotificationService implements NotificationService { /* ... */ }

    @Component
    public class OrderService {
        private final NotificationService notificationService;

        @Autowired
        public OrderService(@Qualifier("email") NotificationService notificationService) {
            this.notificationService = notificationService;
        }
    }
    ```

*   **`@Value`로 설정값 주입**: `@Value` 어노테이션을 사용하여 AsEL 표현식의 평가 결과(주로 외부 설정값)를 Bean의 필드나 생성자 파라미터에 주입할 수 있습니다.

    ```java
    @Component
    public class AppInfo {
        private final String appVersion;

        @Autowired
        public AppInfo(@Value("%{app.version:1.0.0}") String appVersion) {
            this.appVersion = appVersion;
        }
    }
    ```

*   **컬렉션 주입 (`List<T>`, `Map<String, T>`)**: 동일한 인터페이스를 구현하는 모든 Bean을 `List`나 `Map`으로 한 번에 주입받을 수 있습니다. 이는 전략 패턴(Strategy Pattern) 등을 구현할 때 매우 유용합니다.

    ```java
    @Component
    public class NotificationManager {
        private final List<NotificationService> services;

        @Autowired
        public NotificationManager(List<NotificationService> services) {
            this.services = services;
        }

        public void sendToAll(String message) {
            for (NotificationService service : services) {
                service.send(message);
            }
        }
    }
    ```

*   **선택적 의존성 주입 (`Optional<T>`)**: 특정 프로파일에서만 활성화되는 등, 존재하지 않을 수도 있는 Bean을 주입받아야 할 때 `java.util.Optional<T>`을 사용할 수 있습니다.

    ```java
    @Component
    public class MainService {
        private final Optional<OptionalService> optionalService;

        @Autowired
        public MainService(Optional<OptionalService> optionalService) {
            this.optionalService = optionalService;
        }

        public void doSomething() {
            optionalService.ifPresent(service -> service.performAction());
        }
    }
    ```

#### 3.2.4. 빈 스코프 (Bean Scopes)

Bean 스코프는 Bean 인스턴스의 생명주기와 가시성을 제어합니다. `@Scope` 어노테이션으로 설정할 수 있습니다.

| 스코프 (Scope) | 설명 | 생명주기 | 주요 사용 사례 |
| :--- | :--- | :--- | :--- |
| **`singleton`** | 컨테이너 내 단일 인스턴스 | 애플리케이션 전체 | 상태 없는 서비스, DAO |
| **`prototype`** | 요청 시마다 새 인스턴스 | GC에 의해 관리 | 상태 있는 객체, Builder |
| **`request`** | 요청마다 새 인스턴스 | 단일 `Activity` 실행 | 웹 요청 관련 데이터 처리 |
| **`session`** | 세션마다 새 인스턴스 | 단일 사용자 세션 | 사용자별 데이터 관리 |

*   **`singleton` (기본값)**: IoC 컨테이너 내에서 단 하나의 인스턴스만 생성되어 애플리케이션 전체에서 공유됩니다. 대부분의 서비스 Bean에 적합합니다.
*   **`prototype`**: Bean을 주입받거나 요청할 때마다 매번 새로운 인스턴스가 생성됩니다. 컨테이너는 생성 이후의 생명주기를 관리하지 않으므로, `prototype` Bean이 리소스를 점유한다면 개발자가 직접 해제해야 합니다.
*   **`request`**: 웹 환경에서 HTTP 요청마다 새로운 인스턴스가 생성되고, 해당 요청이 완료되면 소멸됩니다. 요청 관련 데이터를 담는 데 유용합니다.
*   **`session`**: 웹 환경에서 사용자 세션마다 새로운 인스턴스가 생성되고, 해당 세션이 종료되면 소멸됩니다. 사용자별 데이터를 관리하는 데 사용됩니다.

#### 3.2.5. 빈 생명주기 콜백

Aspectran은 Bean의 생성 및 소멸 시점에 특정 로직을 실행할 수 있도록 생명주기 콜백을 제공합니다. 주로 `@Initialize`와 `@Destroy` 어노테이션을 사용합니다.

*   **`@Initialize`**: 모든 의존성이 주입된 후, Bean이 초기화될 때 실행됩니다. 초기화 작업(예: 데이터베이스 연결 설정)에 사용됩니다.
*   **`@Destroy`**: Bean이 소멸되기 직전, 정리 작업(예: 리소스 해제)을 위해 실행됩니다.

    ```java
    @Component
    public class LifecycleBean {
        @Initialize
        public void setup() {
            System.out.println("LifecycleBean 초기화됨");
        }

        @Destroy
        public void cleanup() {
            System.out.println("LifecycleBean 소멸됨");
        }
    }
    ```

*   **인터페이스 기반 콜백**: `InitializableBean` 및 `DisposableBean` 인터페이스를 구현하여 동일한 목적을 달성할 수도 있습니다.

    ```java
    @Component
    public class InterfaceBasedLifecycleBean implements InitializableBean, DisposableBean {
        @Override
        public void initialize() throws Exception {
            System.out.println("InterfaceBasedLifecycleBean 초기화됨");
        }

        @Override
        public void destroy() throws Exception {
            System.out.println("InterfaceBasedLifecycleBean 소멸됨");
        }
    }
    ```

#### 3.2.6. 고급 기능

*   **`FactoryBean`으로 복잡한 빈 생성하기**: 생성 로직이 매우 복잡하거나 캡슐화가 필요할 때 `FactoryBean` 인터페이스를 구현합니다. `getObject()` 메소드가 반환하는 객체가 실제 Bean으로 등록됩니다.

    ```java
    @Component
    @Bean("myProduct")
    public class MyProductFactory implements FactoryBean<MyProduct> {
        @Override
        public MyProduct getObject() throws Exception {
            // 복잡한 생성 및 설정 로직
            return new MyProduct();
        }
        @Override
        public Class<?> getObjectType() {
            return MyProduct.class;
        }
    }
    ```

*   **`Aware` 인터페이스로 프레임워크에 접근하기**: `ActivityContextAware`와 같은 `Aware` 인터페이스를 구현하면, Bean이 Aspectran의 내부 객체(예: `ActivityContext`, `BeanRegistry`)에 접근할 수 있습니다. 이는 프레임워크의 특정 부분과 상호작용해야 할 때 유용합니다.

    ```java
    @Component
    public class MyAwareBean implements ActivityContextAware {
        private ActivityContext context;

        @Override
        public void setActivityContext(ActivityContext context) {
            this.context = context;
        }

        public void doSomethingWithContext() {
            if (context != null) {
                System.out.println("ActivityContext에 접근: " + context.getName());
            }
        }
    }
    ```

*   **이벤트 발행 및 구독 (Event Handling)**: Aspectran은 애플리케이션 내의 컴포넌트(Bean) 간의 느슨한 결합을 위해 발행-구독(Publish-Subscribe) 방식의 이벤트 처리 메커니즘을 제공합니다. 이를 통해 특정 로직의 수행 결과를 다른 여러 컴포넌트에 전파해야 할 때, 직접 의존 관계를 맺지 않고 이벤트를 통해 간단하게 구현할 수 있습니다.

    *   **이벤트 리스너 만들기 (`@EventListener`)**: 이벤트를 수신하여 처리하는 리스너는 `@EventListener` 어노테이션을 사용하여 간단하게 만들 수 있습니다. 메소드는 반드시 하나의 파라미터를 가져야 하며, 이 파라미터의 타입이 구독할 이벤트의 타입이 됩니다.

        ```java
        // 1. 이벤트 정의 (POJO)
        public class OrderCompletedEvent {
            private final String orderId;
            public OrderCompletedEvent(String orderId) { this.orderId = orderId; }
            public String getOrderId() { return orderId; }
        }

        // 2. 이벤트 리스너 빈 정의
        @Component
        public class OrderEventListener {
            @EventListener
            public void handleOrderCompleted(OrderCompletedEvent event) {
                System.out.println("주문 완료 이벤트 수신: " + event.getOrderId());
            }
        }
        ```

    *   **이벤트 발행하기 (`EventPublisher`)**: `EventPublisher` 인터페이스를 통해 이벤트를 발행합니다. 이 타입의 Bean을 주입받아 `publish()` 메소드를 호출하기만 하면 됩니다.

        ```java
        @Component
        public class OrderService {
            private final EventPublisher eventPublisher;

            @Autowired
            public OrderService(EventPublisher eventPublisher) {
                this.eventPublisher = eventPublisher;
            }

            public void completeOrder(String orderId) {
                System.out.println("주문 처리 완료: " + orderId);
                eventPublisher.publish(new OrderCompletedEvent(orderId)); // 이벤트 발행
            }
        }
        ```

*   **비동기 메소드 실행 (`@Async`)**: `@Async` 어노테이션을 사용하면, 시간이 오래 걸리는 작업을 별도의 스레드에서 비동기적으로 실행하여 현재 요청 처리 스레드를 차단하지 않고 즉시 반환할 수 있습니다. 이 기능은 Aspectran의 Bean 프록시를 통해 구현됩니다.

    ```java
    @Component
    public class MyAsyncTaskService {
        @Async
        public void doSomethingAsync() {
            System.out.println("비동기 작업 실행 중...");
            // 오래 걸리는 작업
        }

        @Async
        public Future<String> doSomethingAndReturnAsync() {
            return CompletableFuture.completedFuture("비동기 작업 완료!");
        }
    }
    ```

### 3.3. AOP (관점 지향 프로그래밍)

**AOP(Aspect-Oriented Programming, 관점 지향 프로그래밍)**는 로깅, 보안, 트랜잭션 관리, 예외 처리, 응답 헤더 주입 등 애플리케이션 전반에 걸쳐 반복적으로 나타나는 **횡단 관심사(Cross-cutting Concerns)**를 핵심 비즈니스 로직과 분리하여 모듈화하는 핵심 프로그래밍 패러다임입니다.

**Aspectran**은 프레임워크의 요청 처리 핵심 단위인 **`Activity`의 생명주기(Translet Lifecycle)**와 **`Bean` 메서드 인터셉션**이라는 두 개의 명확한 축을 기반으로 고도로 최적화된 **실용적 AOP 아키텍처**를 제공합니다.

#### 3.3.1. AOP의 필요성

애플리케이션을 개발하다 보면 여러 모듈에서 공통적으로 필요한 부가 기능들이 존재합니다. 예를 들어 서비스 메서드 진입 시의 매개변수 유효성 검증이나 보안 인증, 데이터베이스 작업의 트랜잭션 커밋과 롤백, 웹 응답 보안 헤더 설정 등이 대표적입니다.

이러한 공통 기능들을 비즈니스 로직 코드 내에 직접 작성하면 다음과 같은 문제들이 발생합니다:
*   **코드 중복 및 복잡도 증가**: 동일하거나 유사한 부가 기능 코드가 수많은 클래스와 메서드에 중복되어 전체적인 가독성을 떨어뜨립니다.
*   **유지보수성 저하**: 공통 정책이 변경될 경우 관련된 모든 비즈니스 코드를 일일이 찾아 수정해야 하며, 누락으로 인한 잠재적 오류 위험이 큽니다.
*   **핵심 비즈니스 관심사 흐림**: 순수한 비즈니스 로직과 부가 인프라 코드가 뒤섞여 코드의 본래 목적과 흐름을 파악하기 어려워집니다.

AOP는 이러한 횡단 관심사들을 독립된 모듈인 **Aspect(애스펙트)**로 캡슐화하고 원하는 지점에 선언적으로 적용함으로써, 비즈니스 로직의 순수성을 유지하고 시스템 전체의 결합도를 획기적으로 낮출 수 있도록 돕습니다.

#### 3.3.2. Aspectran AOP의 2대 아키텍처 축

Aspectran AOP는 적용 목적과 대상에 따라 두 가지 차원의 실행 모델을 제공합니다:

| 아키텍처 축 | 대상 (Target) | 동작 원리 | 주요 적용 사례 |
| :--- | :--- | :--- | :--- |
| **Activity 생명주기 AOP**<br/>*(Translet Lifecycle)* | `Activity` (Translet 요청 처리 전체 흐름) | 프록시가 전혀 개입하지 않으며, `CoreActivity` 엔진이 생명주기 단계에 따라 Aspect를 직접 순차 실행 (Non-Proxy Core Interception) | 웹 보안 응답 헤더 주입, 전역 인코딩/뷰 디스패처 설정 주입, 요청 전/후 처리, 인증/인가, 글로벌 예외 처리 |
| **Bean 프록시 AOP**<br/>*(Method Interception)* | Bean의 메서드 실행 (`target="method"`) | 런타임 동적 프록시(`AbstractBeanProxy`, Javassist/JDK)가 `@Advisable` 어노테이션이 선언된 메서드 호출을 가로채 Advice 실행 | 선언적 데이터베이스 트랜잭션, 비즈니스 메서드 실행 시간 측정, 메서드 파라미터 감사(Audit) 로깅 |

##### 1) Activity 생명주기 AOP (Non-Proxy Core Interception)
*   클라이언트의 모든 요청(Web, Shell, Daemon)은 하나의 `Activity` 인스턴스에 의해 실행됩니다.
*   `Activity` 엔진은 요청의 시작부터 종료까지 정해진 생명주기 단계를 거치며, 해당 요청에 매칭되는 Aspect들을 프록시 객체 생성이나 리플렉션 오버헤드 없이 **프레임워크 코어 엔진 레벨에서 직접 순차적으로 실행**합니다.
*   **오버헤드 제로**: 프록시 생성이 개입하지 않으므로 성능 저하가 전혀 발생하지 않으며, 보안 응답 헤더(`<headers>`), 기본 문자 인코딩 및 뷰 디스패처(`<settings>`), 글로벌 예외 매핑(`<exception>`) 등 웹 요청 전반에 걸친 환경을 선언적으로 통제할 수 있습니다.

##### 2) Bean 프록시 AOP (Selective Dynamic Proxying)
*   서비스 계층의 개별 비즈니스 메서드 단위로 AOP를 적용할 때는 런타임 동적 프록시 메커니즘을 사용합니다.
*   Aspectran은 Javassist(`JavassistBeanProxy`) 또는 표준 JDK Dynamic Proxy(`JdkBeanProxy`)를 기반으로 프록시 객체를 생성합니다.
*   **`@Advisable` 기반 선택적 프록싱 (핵심 성능 최적화)**: Aspectran의 AOP 프록시는 모든 메서드 호출을 무차별적으로 가로채지 않습니다. 오직 **`@Advisable` 또는 `@Async` 어노테이션이 선언된 메서드에 대해서만 Pointcut 검사 및 Advice 체인을 가동**합니다. 어노테이션이 선언되지 않은 일반 메서드는 프록시 체인을 거치지 않고 원본 객체의 메서드가 즉시 직접 호출되므로, 불필요한 프록시 오버헤드를 원천적으로 제거합니다.

#### 3.3.3. Aspectran AOP의 핵심 구성 요소

##### 1. Join Point (조인 포인트)
Advice가 적용될 수 있는 애플리케이션 실행 흐름 상의 특정 지점입니다:
*   **Activity 실행 (`target="activity"`, 기본값)**: Translet의 요청 처리 생명주기 전체(Before, Translet Action, After, Thrown, Finally)가 대상이 됩니다.
*   **Bean 메서드 실행 (`target="method"`)**: `@Advisable`이 선언된 특정 Bean 메서드의 실행 전/후 및 예외 발생 시점이 대상이 됩니다.

##### 2. Pointcut (포인트컷)
Advice를 어디에 적용할지 정밀하게 지정하는 대상 필터링 규칙입니다. 설정 파일의 `<aspect>` 규칙 내 `<joinpoint>` 요소 또는 `@Joinpoint(pointcut = ...)` 어노테이션을 통해 선언적으로 정의합니다.

*   **포인트컷 표현식 구조**:
    ```text
    transletPattern[@beanOrClassPattern][^methodNamePattern]
    ```
    구분자(`@`, `^`)를 기준으로 3개의 영역으로 구성되며, 필요한 영역만 선택적으로 조합할 수 있습니다:
    *   **Translet 패턴** (`@` 앞): 대상 Translet의 이름 또는 요청 URI 경로 패턴 (예: `/user/**`, `/api/v1/*`). 생략 시 모든 Translet을 대상으로 합니다.
    *   **Bean ID 패턴** (`@` 뒤, `^` 앞): 대상 Bean의 식별자(ID) 패턴 (예: `@userService`, `@*Service`).
    *   **Class 패턴** (`@class:` 뒤, `^` 앞): 대상 클래스의 완전한 패키지명/클래스명 패턴. 클래스 타입을 타겟팅할 때는 **반드시 `class:` 접두사**를 붙여야 합니다 (예: `@class:com.mycompany.service.*`, `@class:*.UserServiceImpl`).
    *   **Method 패턴** (`^` 뒤): 대상 메서드 이름 패턴 (예: `^get*`, `^save*`, `^execute*`).

*   **다양한 패턴 형식 예시**:
    *   `/order/**`: `/order/` 하위 모든 Translet의 Activity 생명주기를 대상
    *   `@someService^execute*`: 모든 Translet에서 `someService` 빈의 `execute`로 시작하는 메서드를 대상
    *   `/user/list@userService^get*`: `/user/list` Translet 내 `userService` 빈의 `get`으로 시작하는 메서드를 대상
    *   `@class:com.mycompany.service.*Service^process*`: 모든 Service 클래스의 `process`로 시작하는 메서드를 대상
    *   `@^execute*`: 모든 Translet 및 빈에서 `execute`로 시작하는 메서드를 대상

*   **포함(`+:`) 및 제외(`-:`) 규칙과 순차 평가**:
    *   `+:` (Include): 지정한 패턴에 매칭되는 대상을 AOP 적용 대상에 포함합니다.
    *   `-:` (Exclude): 지정한 패턴에 매칭되는 대상을 AOP 적용 대상에서 제외합니다.
    *   선언된 순서(Top-Down)대로 순차 평가되므로, 상위에 넓은 범위를 포함시키고 하위에 특정 예외 대상을 제외하는 방식으로 매우 정교한 타겟팅이 가능합니다.

##### 3. Advice (어드바이스) - 4대 표준 Advice
Join Point에서 실행될 실제 부가 기능 코드입니다.

> **💡 4대 표준 Advice 기반의 명확한 생명주기 제어:**
> Aspectran은 선언적이고 명확한 **4단계 표준 생명주기(Before / After / Thrown / Finally)**를 기반으로 동작합니다. 이를 통해 복잡한 프록시 체이닝 오버헤드 없이도 트랜잭션 경계 관리, 성능 프로파일링, 보안 검증, 리소스 정리를 직관적이고 견고하게 달성할 수 있습니다.

| Advice 유형 | 어노테이션 | 실행 시점 | 주요 역할 및 특징 |
| :--- | :--- | :--- | :--- |
| **`before`** | `@Before` | Join Point 실행 전 | 전처리 유효성 검증, 보안 인증/인가 확인, 응답 `<headers>` 선언적 주입, 시작 시각 기록 |
| **`after`** | `@After` | Join Point 정상 실행 완료 후 | 결과 데이터 후가공, 성공 감사(Audit) 로깅 (예외 발생 시 실행 건너뜀) |
| **`thrown`** | `@ExceptionThrown` | Join Point 실행 중 예외 발생 시 | 오류 로깅, 데이터베이스 트랜잭션 롤백, 관리자 알림 발송 (**Finally 단계보다 먼저 실행됨**) |
| **`finally`** | `@Finally` | 성공/실패 여부와 무관하게 항상 마지막 | 리소스 해제(`close()`), 세션 및 ThreadLocal 정리, 소요 시간 계산 및 성능 프로파일링 |

##### 4. Aspect (애스펙트) 및 고급 제어 속성
Pointcut과 Advice를 결합하여 독립된 모듈로 정의한 것입니다. XML의 `<aspect>` 태그나 자바의 `@Aspect` 어노테이션으로 정의합니다.

*   **`order` (실행 우선순위)**:
    *   동일한 Join Point에 여러 Aspect가 매칭될 때 실행 순서를 제어합니다. 숫자가 작을수록 높은 우선순위를 가집니다 (기본값: `Integer.MAX_VALUE`).
    *   Aspectran의 `AdviceRuleRegistry`는 일반 Advice뿐만 아니라 예외 처리 규칙(`ExceptionRule`)까지 `order` 오름차순(0, 1, 2...)으로 엄격하게 정렬 관리합니다.
    *   따라서 트랜잭션 관리와 같은 인프라 Aspect를 `order="0"`으로 지정하면, 비즈니스 Aspect보다 항상 먼저 실행 및 등록되어 예외 발생 시 트랜잭션 롤백이 누락 없이 최우선으로 보장됩니다.
*   **`isolated` (예외 격리 모드)**:
    *   `isolated="true"`로 설정하면 해당 Aspect의 Advice 실행 중 예외가 발생하더라도 전체 요청 처리 흐름이 중단되지 않고 오류 로그만 남긴 후 정상 진행됩니다.
    *   비즈니스 로직에 영향을 주지 않아야 하는 통계 수집, 성능 모니터링, 외부 알림 발송 Aspect에 매우 유용합니다.
    *   또한 프레임워크 코어 차원에서도 예외 처리 중 특정 액션 실패 시 2중 `try-catch` 격리를 통해 뒤따르는 트랜잭션 롤백과 자원 정리가 100% 끝까지 완주되도록 보호합니다.
*   **`disabled`**: `true`로 설정 시 런타임에 해당 Aspect를 비활성화합니다.

#### 3.3.4. 생명주기 및 예외 처리 흐름

Aspectran AOP의 4대 표준 Advice는 정상 처리 흐름과 예외 발생 흐름에서 매우 엄격하고 일관된 순서로 동작합니다.

##### a. 정상 처리 흐름 (Normal Execution Flow)
1.  **Before Advice 실행**: 전처리, 유효성 검증, `<settings>` 및 보안 `<headers>` 주입.
2.  **핵심 비즈니스 로직 실행**: Translet Action 또는 대상 Bean 메서드 본문 실행.
3.  **After Advice 실행**: 정상 완료 후 결과 데이터 후가공 및 감사 로깅.
4.  **Finally Advice 실행**: 리소스 정리 및 세션 종료.

##### b. 예외 발생 시 처리 흐름 (Exception Handling Flow)
비즈니스 로직이나 Before 단계에서 예외가 발생하면 시스템의 데이터 무결성과 안전한 복구를 위해 다음과 같은 순서로 제어가 전환됩니다:
1.  **After Advice 건너뜀 (Skip)**: 예외 발생 즉시 After Advice의 실행은 건너뜁니다.
2.  **Thrown Advice 및 예외 룰 실행 (`<thrown>`, `<exception>`)**:
    *   **Finally 단계보다 먼저 실행**됩니다.
    *   데이터베이스 세션이나 리소스가 닫히기 전에 트랜잭션 롤백, 에러 로깅, 관리자 알림을 안전하게 수행합니다.
    *   글로벌 예외 처리(`<exception>`)에 매칭된 경우 클라이언트에 전달할 에러 화면(`<dispatch>`)이나 JSON 에러 응답(`<transform>`)을 예약합니다.
3.  **Finally Advice 실행**:
    *   성공/실패 여부와 무관하게 항상 실행되어 `SqlSession.close()` 등 사용 중인 리소스를 안전하게 닫고 메모리를 정리합니다.
4.  **예외 응답 전송 또는 Rethrow**:
    *   예약된 예외 응답을 클라이언트로 전송하거나, 처리되지 않은 예외를 상위 컨테이너로 안전하게 전파합니다.

> **💡 완벽한 트랜잭션 무결성의 핵심 원리:**
> 예외 발생 시 Thrown(롤백) 처리가 Finally(자원 해제)보다 항상 먼저 실행되므로, 커넥션이 먼저 닫혀 트랜잭션 롤백에 실패하는 전형적인 자원 누수 및 데이터 불일치 문제를 원천적으로 방지합니다.

#### 3.3.5. 자바 어노테이션 기반 AOP 지원

`com.aspectran.core.component.bean.annotation` 패키지의 어노테이션들을 활용하여 XML 설정 없이도 순수 자바 클래스만으로 완전한 Aspect를 구성할 수 있습니다:

*   `@Component`: Aspect 클래스를 빈으로 자동 등록합니다.
*   `@Aspect(id = "...", order = 0, isolated = true)`: 해당 클래스가 Aspect임을 정의하고 고유 ID, 우선순위, 격리 여부를 지정합니다.
*   `@Joinpoint(pointcut = "...", target = JoinpointTargetType.ACTIVITY)`: 적용 대상과 Pointcut 패턴을 정의합니다.
*   `@Before`: Join Point 실행 전에 호출될 메서드에 선언합니다.
*   `@After`: Join Point 정상 완료 후 호출될 메서드에 선언합니다.
*   `@ExceptionThrown(Exception.class)`: 예외 발생 시 호출될 메서드에 선언하며, 특정 예외 타입을 지정할 수 있습니다.
*   `@Finally`: 성공/실패 여부와 무관하게 항상 마지막에 호출될 메서드에 선언합니다.
*   `@Advisable`: Bean 프록시 AOP의 적용 대상 메서드임을 명시합니다.

**어노테이션 기반 로깅 Aspect 예시:**
```java
package com.aspectran.demo.aspect;

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
        logger.info("[요청 시작] {} {}", translet.getRequestMethod(), translet.getRequestName());
    }

    @After
    public void afterRequest(Translet translet) {
        logger.info("[요청 성공] {}", translet.getRequestName());
    }

    @ExceptionThrown(Exception.class)
    public void onError(Translet translet) {
        Throwable e = translet.getRaisedException();
        logger.error("[요청 오류] {} - {}", translet.getRequestName(), e.getMessage(), e);
    }

    @Finally
    public void onFinally(Translet translet) {
        // 성공/실패와 상관없이 항상 실행되는 리소스 정리 로직
    }
}
```

#### 3.3.6. 실무 AOP 활용 패턴

##### 패턴 1: 선언적 트랜잭션 관리 (`SqlSessionAdvice` + `@Advisable`)

비즈니스 로직에 데이터베이스 트랜잭션 코드(open, commit, rollback, close)를 직접 작성하지 않고, AOP를 통해 투명하게 분리합니다.

**1. 자바 어노테이션 기반 트랜잭션 Aspect:**
`SqlSessionAdvice`를 상속받아 Aspect를 정의하고 `@Joinpoint`로 대상을 지정합니다:

```java
package com.aspectran.demo.aspect;

import com.aspectran.core.component.bean.annotation.After;
import com.aspectran.core.component.bean.annotation.Aspect;
import com.aspectran.core.component.bean.annotation.Autowired;
import com.aspectran.core.component.bean.annotation.Before;
import com.aspectran.core.component.bean.annotation.Component;
import com.aspectran.core.component.bean.annotation.ExceptionThrown;
import com.aspectran.core.component.bean.annotation.Finally;
import com.aspectran.core.component.bean.annotation.Joinpoint;
import com.aspectran.mybatis.SqlSessionAdvice;
import org.apache.ibatis.session.SqlSessionFactory;

@Component
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

**2. XML 기반 선언적 트랜잭션 구성:**
어드바이스 빈과 애스펙트 규칙을 XML로 명확히 분리하여 정의합니다:

```xml
<!-- 1. MyBatis SqlSession 생명주기를 관리하는 어드바이스 빈 (요청별 독립 인스턴스를 위해 prototype 설정) -->
<bean id="sqlSessionTxAdvice" class="com.aspectran.mybatis.SqlSessionAdvice" scope="prototype">
    <argument>#{sqlSessionFactory}</argument>
</bean>

<!-- 2. 선언적 트랜잭션 Aspect (order="0"으로 최우선 순위 부여) -->
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
            <thrown>
                <!-- 예외 발생 시 close 전에 롤백이 먼저 실행됨 -->
                <invoke method="rollback"/>
            </thrown>
            <!-- 정상 완료 및 예외 시 항상 최종적으로 세션을 닫음 -->
            <invoke method="close"/>
        </finally>
    </advice>
</aspect>
```

**3. 비즈니스 서비스 계층:**
```java
@Component
public class OrderService {

    private final SimpleSqlSession sqlSession;

    @Autowired
    public OrderService(SimpleSqlSession sqlSession) {
        this.sqlSession = sqlSession;
    }

    public void processOrder(Order order) {
        // 메서드 실행 시 txAspect가 발동하여 트랜잭션이 자동으로 관리됩니다.
        sqlSession.insert("app.demo.mapper.OrderMapper.insertOrder", order);
        sqlSession.update("app.demo.mapper.ItemMapper.updateStock", order.getItemId());
        // 정상 완료 시 after(commit) -> finally(close)
        // 예외 발생 시 after는 건너뛰고 thrown(rollback) -> finally(close) 순으로 안전하게 완주됩니다.
    }
}
```

##### 패턴 2: Before + Finally 패턴을 이용한 성능 프로파일링

Aspectran에서는 `@Before`와 `@Finally` 어드바이스의 협업과 프레임워크의 **자동 결과 바인딩(Automatic Result Binding)**을 통해 오버헤드 없는 정밀한 실행 시간 모니터링을 구현할 수 있습니다.

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
        // @Before 메서드의 반환값은 현재 Activity의 beforeAdviceResult에 Aspect ID("profilingAspect")로 자동 저장됨
        return System.currentTimeMillis();
    }

    @Finally
    public void endProfiling(Translet translet) {
        // translet.getBeforeAdviceResult()를 통해 간편하게 시작 시각 조회
        Long startTime = translet.getBeforeAdviceResult("profilingAspect");
        if (startTime != null) {
            long elapsedTime = System.currentTimeMillis() - startTime;
            if (elapsedTime > 500) {
                logger.warn("[SLOW API] {} {} 실행 소요 시간: {} ms (상태: {})",
                        translet.getRequestMethod(),
                        translet.getRequestName(),
                        elapsedTime,
                        (translet.isExceptionRaised() ? "ERROR" : "SUCCESS"));
            }
        }
    }
}
```

*   **Before + Finally 패턴의 장점**:
    *   **프레임워크 자동 결과 바인딩**: `@Before` 어드바이스 메서드가 값을 반환하면, Aspectran 엔진이 해당 실행 결과를 현재 `Activity`의 `beforeAdviceResult`에 애스펙트 ID(`"profilingAspect"`)를 키로 자동 보관합니다. 개발자가 별도로 요청 속성(Request Attribute)에 수동 저장할 필요가 없습니다.
    *   **체이닝 오버헤드 제로**: 중첩된 인터셉터 호출을 거치지 않으므로 콜 스택 증가와 메모리 부담이 전혀 없습니다.
    *   **완벽한 스레드 안전성**: 단일 요청 컨텍스트(`Activity`) 내에서 관리되므로 멀티스레드 환경에서도 동시성 이슈 없이 안전합니다.
    *   **예외 발생 시에도 100% 측정 보장**: 예외가 발생하더라도 `Finally` 블록은 반드시 실행되므로, 에러 발생 시의 실행 시간까지 누락 없이 정밀하게 집계할 수 있습니다.

##### 패턴 3: 전역 웹 보안 응답 헤더 및 환경 설정 자동화 (Activity 생명주기 AOP)

개별 Translet마다 반복적으로 보안 헤더나 설정을 지정하지 않고, Activity 생명주기 AOP의 Non-Proxy Core Interception을 통해 일괄 적용합니다:

```xml
<aspect id="webSecurityAspect">
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
```

프록시 객체 생성 없이 코어 엔진 레벨에서 모든 매칭 요청에 대해 보안 헤더와 인코딩 설정이 즉시 주입되므로 최고의 런타임 성능을 유지합니다.

이처럼 Aspectran의 AOP는 프록시 오버헤드 없이 전역 웹 환경 설정을 제어하는 **Activity 생명주기 AOP**와, 필요한 비즈니스 메서드에만 선택적으로 적용되는 **Bean 프록시 AOP**, 그리고 명확한 **4대 표준 Advice**를 통해 가볍고 직관적이며 강력한 엔터프라이즈 아키텍처를 완성합니다.

### 3.4. AsEL (Aspectran Expression Language)

AsEL (Aspectran Expression Language)은 Aspectran의 설정 파일(XML, APON)이나 어노테이션 내에서 동적인 값을 참조하고 주입하기 위해 사용되는 강력한 표현 언어입니다. AsEL을 사용하면, 런타임에 생성되는 요청 데이터나 다른 빈(Bean)의 속성 값을 정적인 설정에 동적으로 결합할 수 있어 프레임워크의 유연성을 크게 높여줍니다. 특히 AsEL은 내부적으로 OGNL(Object-Graph Navigation Language)을 기반으로 동작하므로, 단순한 값 참조를 넘어 객체의 메소드를 호출하거나 속성을 탐색하는 등 복잡하고 동적인 표현식을 사용할 수 있습니다.

#### 3.4.1. AsEL 토큰 유형

AsEL은 세 가지 주요 토큰을 사용하여 서로 다른 스코프의 데이터에 접근합니다.

*   **`${...}` (파라미터 토큰)**: 현재 요청의 **파라미터(Parameter)**에 접근합니다. 주로 Translet의 경로 변수(Path Variable)나 요청 파라미터(Request Parameter) 값을 참조하는 데 사용됩니다.
    ```xml
    <translet name="/users/${userId}">
        <action bean="userService" method="deleteUser">
            <argument value="${userId}"/> <!-- URL 경로에서 추출된 userId 파라미터를 action의 인자로 전달 -->
        </action>
    </translet>
    ```

*   **`@{...}` (속성 토큰)**: 현재 `Activity` 컨텍스트의 **속성(Attribute)**에 접근합니다. 속성은 다른 액션의 결과나 AOP 어드바이스 등을 통해 `Activity` 내에서 생성되고 공유되는 데이터입니다.
    ```xml
    <action id="userResult" bean="userAction" method="getUser"/>
    <!-- 위 action의 결과는 'userResult'라는 속성으로 저장됨 -->
    <dispatch name="user/detail">
        <attribute name="user" value="@{userResult}"/> <!-- 'userResult' 속성을 뷰 템플릿에 'user'라는 이름으로 전달 -->
    </dispatch>
    ```

*   **`#{...}` (빈 토큰)**: IoC 컨테이너에 등록된 **빈(Bean) 또는 빈의 속성**에 접근합니다. 정적인 설정값이나 다른 빈의 메소드 호출 결과를 참조할 때 유용합니다.
    ```xml
    <bean id="appConfig" class="com.example.AppConfig">
        <property name="defaultPageSize">20</property>
    </bean>

    <action bean="boardService" method="getArticleList">
        <!-- appConfig 빈의 defaultPageSize 속성 값을 인자로 전달 -->
        <argument value="#{appConfig.defaultPageSize}"/>
    </action>
    ```

#### 3.4.2. @Value 어노테이션과 AsEL

`@Value` 어노테이션과 함께 사용하면 AsEL의 강력함을 코드 레벨까지 확장할 수 있습니다. 환경 설정(`properties`)에 정의된 값을 Bean의 필드나 생성자 인자에 직접 주입할 수 있습니다.

*   **`%{...}` (프로퍼티 토큰)**: `@Value` 어노테이션 내에서 사용되며, `<environment>` 규칙이나 JVM 시스템 프로퍼티, `PropertiesFactoryBean` 등으로 등록된 **프로퍼티(Property)** 값을 참조합니다.

```java
// PropertiesFactoryBean 또는 <environment>에 등록된 app.version 프로퍼티 참조
@Component
public class AppInfo {
    private final String appVersion;

    @Autowired
    public AppInfo(@Value("%{app.version:1.0.0}") String appVersion) {
        // 등록된 app.version 값이 있으면 해당 값이 주입되고,
        // 없으면 콜론(:) 뒤의 기본값 "1.0.0"이 주입됨
        this.appVersion = appVersion;
    }
}
```

AsEL을 잘 활용하면 정적인 설정을 동적인 애플리케이션 로직과 효과적으로 연결하여, 코드 변경 없이 설정만으로 다양한 상황에 대응할 수 있는 유연한 애플리케이션을 만들 수 있습니다.

### 3.5. APON (Aspectran Parameters Object Notation)

**APON(Aspectran Parameters Object Notation)**은 구조화된 데이터를 표현하기 위한 Aspectran 고유의 경량 데이터 교환 포맷이자 객체 모델입니다. JSON의 엄격한 문법(주석 불가, 쉼표 누락 오류 등)과 YAML의 복잡한 들여쓰기 민감성을 극복하여, 사람이 쉽게 읽고 쓸 수 있는 직관성과 시스템 파싱의 안정성을 동시에 제공합니다.

Aspectran의 핵심 환경 설정 파일인 `aspectran-config.apon`을 비롯하여, 내부 파라미터 컨테이너와 동적 데이터 구조 표현에 전방위적으로 사용됩니다.

#### 3.5.1. APON의 핵심 특징

*   **뛰어난 가독성과 유연한 구분자**: 줄바꿈 또는 쉼표(`,`)를 구분자로 자유롭게 사용할 수 있습니다. 특수문자가 포함되지 않은 일반 문자열 값은 따옴표를 생략할 수 있어 설정이 매우 간결해집니다.
*   **완벽한 주석 지원 (`#`)**: 설정 파일 내에 `#` 기호를 사용하여 단독 라인 주석뿐만 아니라 파라미터 값 바로 뒤에 붙는 인라인 주석(Inline comment)을 자연스럽게 기술할 수 있습니다.
*   **명시적 데이터 타입 지원**: `name(type): value` 형식으로 파라미터 이름 뒤에 괄호로 데이터 타입(`string`, `int`, `long`, `boolean`, `text` 등)을 직접 명시할 수 있어 런타임 값의 정확성과 타입 안정성을 보장합니다.
*   **계층적 구조화**: 중괄호(`{ }`)를 이용한 중첩 블록과 대괄호(`[ ]`)를 이용한 배열 구조를 통해 복잡한 설정 데이터도 체계적으로 표현합니다.
*   **멀티라인 긴 문자열(`text`) 지원**: 괄호 `( )`와 파이프(`|`) 기호를 사용하여 SQL 쿼리, 템플릿, 긴 설명문 등을 여러 줄에 걸쳐 깔끔하게 작성할 수 있습니다.

#### 3.5.2. APON 기본 문법 및 구조 예시

```apon
# 서버 환경 설정 예시
server: {
    host: "0.0.0.0"
    port: 8080             # 서비스 포트
    timeout: 30000         # 30초 타임아웃
    sessionTracking: [
        cookie
        url
    ]
}

# 명시적 타입 지정과 멀티라인 텍스트 지원
database: {
    driver: com.mysql.cj.jdbc.Driver
    url: "jdbc:mysql://localhost:3306/aspectran"
    maxActive(int): 20
    autoCommit(boolean): false
    initScript(text): (
        |CREATE TABLE IF NOT EXISTS sample_logs (
        |    id BIGINT AUTO_INCREMENT PRIMARY KEY,
        |    message VARCHAR(255) NOT NULL
        |);
    )
}
```

#### 3.5.3. Parameters 객체 모델과 자바 코드 연동

APON은 단순한 텍스트 포맷에 머무르지 않고, Java 코드 내에서 **`Parameters`(`com.aspectran.core.context.rule.params.Parameters`)** 인터페이스와 일대일로 완벽하게 연동됩니다:

*   **요청 본문 자동 파싱**: 클라이언트가 전송한 JSON, XML, 또는 APON 형식의 페이로드는 `translet.getRequestAdapter().getBodyAsParameters()` 메서드를 통해 별도의 서드파티 파서 없이 즉시 Aspectran 표준 `Parameters` 객체로 파싱됩니다.
*   **타입 세이프한 데이터 접근**:
    ```java
    Parameters parameters = translet.getRequestAdapter().getBodyAsParameters();
    if (parameters != null) {
        String title = parameters.getString("title");
        int count = parameters.getInt("count", 1); // 기본값 지정 가능
        Parameters subParams = parameters.getParameters("subConfig");
    }
    ```
*   **동적 설정 컨테이너**: 복잡한 비즈니스 파라미터나 외부 구성 설정을 전용 DTO 클래스를 일일이 만들지 않고도 `DefaultParameters` 객체를 통해 유연하고 타입 안전하게 전달하고 가공할 수 있습니다.

## 4. Aspectran 주요 기능 활용

### 4.1. Profiles (프로필)

Aspectran의 Profiles 기능은 애플리케이션의 전체 또는 일부 설정을 **개발(development), 테스트(test), 운영(production)**과 같은 특정 환경에 따라 다르게 적용할 수 있도록 지원하는 강력한 기능입니다. 이를 통해 코드 변경 없이 설정만으로 여러 환경에 쉽게 대응할 수 있습니다.

#### 4.1.1. 프로필의 필요성 및 활용

*   **환경별 설정 관리**: 데이터베이스 연결 정보, API 키, 로깅 레벨 등 환경마다 달라지는 설정을 효율적으로 관리할 수 있습니다.
*   **조건부 빈 로딩**: 특정 환경에서만 필요한 Bean(예: 개발용 Mock 서비스, 운영용 모니터링 도구)을 조건부로 로드할 수 있습니다.

#### 4.1.2. 프로필 활성화 방법

프로필은 주로 JVM 시스템 프로퍼티(`-D` 옵션)를 통해 활성화합니다.

*   **`aspectran.profiles.active`**: 현재 활성화할 프로필을 지정합니다. 여러 프로필을 지정할 경우 쉼표(`,`)로 구분합니다.
    ```bash
    # 'dev' 프로필을 활성화하여 애플리케이션 실행
    java -Daspectran.profiles.active=dev -jar my-application.jar

    # 'prod'와 'metrics' 두 개의 프로필을 동시에 활성화
    java -Daspectran.profiles.active=prod,metrics -jar my-application.jar
    ```
*   **`aspectran.profiles.default`**: `aspectran.profiles.active`가 지정되지 않았을 때 기본으로 활성화할 프로필을 지정합니다.
*   **`aspectran.profiles.base`**: 항상 활성화되어야 하는 기본 프로필을 지정합니다.

#### 4.1.3. 프로필을 이용한 조건부 설정

Aspectran의 설정 파일(XML 또는 APON) 내 대부분의 엘리먼트에서 `profile` 속성을 사용하여 특정 프로필이 활성화되었을 때만 해당 설정을 적용하도록 할 수 있습니다.

```xml
<aspectran>

    <!-- 'dev' 프로필이 활성화될 때만 적용되는 개발용 데이터베이스 설정 -->
    <environment profile="dev">
        <property name="db.driver">org.h2.Driver</property>
        <property name="db.url">jdbc:h2:mem:devdb;DB_CLOSE_DELAY=-1</property>
        <property name="db.username">sa</property>
        <property name="db.password"></property>
    </environment>

    <!-- 'prod' 프로필이 활성화될 때만 적용되는 운영용 데이터베이스 설정 -->
    <environment profile="prod">
        <property name="db.driver">com.mysql.cj.jdbc.Driver</property>
        <property name="db.url">jdbc:mysql://prod.db.server:3306/main_db</property>
        <property name="db.username">prod_db_user</property>
        <property name="db.password">!PROD_DB_PASSWORD!</property>
    </environment>

    <!-- 'prod' 프로필이 활성화될 때만 특정 설정 파일을 포함 -->
    <append file="/config/metrics-rules.xml" profile="prod"/>

</aspectran>
```

#### 4.1.4. 프로필 표현식 (Profile Expressions)

단순한 프로필 이름 외에도, 논리 연산자를 사용하여 복잡한 조건을 표현할 수 있습니다.

*   **`!` (NOT)**: 특정 프로필이 활성화되지 않았을 때 (예: `profile="!demo"`)
*   **`()` (AND)**: 괄호 안의 모든 프로필이 활성화되었을 때 (예: `profile="(prod, metrics)"`)
*   **`[]` (OR)**: 대괄호 안의 프로필 중 하나라도 활성화되었을 때 (쉼표 `,`로만 구분해도 OR로 동작) (예: `profile="[dev, test]"`)
*   **복합 표현식**: 여러 연산자를 조합하여 복잡한 조건을 만들 수 있습니다.

#### 4.1.5. 사용 예제: 환경별 데이터베이스 설정

`dev`와 `prod` 환경에 따라 다른 데이터베이스 연결 정보를 설정하는 완전한 예제는 다음과 같습니다.

**`config/aspectran-rules.xml`**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<aspectran>

    <description>환경에 따라 다른 DB 설정을 로드합니다.</description>

    <!-- 개발 환경 설정 -->
    <environment profile="dev">
        <property name="db.driver">org.h2.Driver</property>
        <property name="db.url">jdbc:h2:mem:devdb;DB_CLOSE_DELAY=-1</property>
        <property name="db.username">sa</property>
        <property name="db.password"></property>
    </environment>

    <!-- 운영 환경 설정 -->
    <environment profile="prod">
        <property name="db.driver">com.mysql.cj.jdbc.Driver</property>
        <property name="db.url">jdbc:mysql://prod.db.server:3306/main_db</property>
        <property name="db.username">prod_db_user</property>
        <property name="db.password">!PROD_DB_PASSWORD!</property>
    </environment>

    <!-- 데이터 소스 빈 정의 -->
    <bean id="dataSource" class="com.zaxxer.hikari.HikariDataSource">
        <property name="driverClassName" value="${db.driver}"/>
        <property name="jdbcUrl" value="${db.url}"/>
        <property name="username" value="${db.username}"/>
        <property name="password" value="${db.password}"/>
    </bean>

</aspectran>
```

**애플리케이션 실행:**

- **개발 환경으로 실행:** `dev` 프로필을 활성화하면 H2 인메모리 데이터베이스를 사용합니다.
  ```bash
  java -Daspectran.profiles.active=dev -jar my-app.jar
  ```

- **운영 환경으로 실행:** `prod` 프로필을 활성화하면 MySQL 데이터베이스를 사용합니다.
  ```bash
  java -Daspectran.profiles.active=prod -jar my-app.jar
  ```

### 4.2. Properties (프로퍼티 시스템)

Aspectran은 실행 환경에 따른 유연한 설정 관리와 런타임 동적 평가 및 캐싱 기능을 지원하는 강력한 계층적 **프로퍼티(Properties) 시스템**을 제공합니다. 이를 통해 데이터베이스 접속 정보, 외부 API 키, 파일 저장 경로 등 환경마다 달라지는 설정들을 자바 소스 코드로부터 완전히 분리하여 안전하게 관리할 수 있습니다.

#### 4.2.1. 프로퍼티 주입 경로와 우선순위

Aspectran은 다음과 같은 다양한 경로를 통해 프로퍼티를 주입받아 통합 관리하며, 상위 경로의 설정이 하위 경로의 설정을 오버라이드합니다:

1.  **JVM 시스템 프로퍼티 (`-D` 옵션)**: 가장 보편적이며 최우선권을 가집니다. (`-Dproperty.name=value`)
2.  **운영 배포 설정 (`setup/app.conf`)**: Aspectow 기반 애플리케이션의 구동 스크립트(`startup.sh`, `daemon.sh`) 실행 시 JVM 시스템 프로퍼티(VM Options)로 자동 변환되어 적용됩니다.
3.  **애플리케이션 초기 설정 (`aspectran-config.apon`)**: 뼈대 설정 파일의 `system.properties` 섹션에 정의된 값들로, 애플리케이션 구동 시 `System.setProperty()`를 통해 등록됩니다.
4.  **외부 프로퍼티 파일 (`PropertiesFactoryBean`)**: 파일시스템이나 클래스패스에 위치한 `.properties` 파일을 읽어와 컨테이너 프로퍼티로 통합합니다.
5.  **규칙 기반 환경 설정 (XML `<environment>`)**: XML 규칙 파일 내에서 선언적으로 정의한 프로퍼티들입니다.

#### 4.2.2. 규칙 기반 프로퍼티 정의 (`<environment>`)

XML 설정 파일 내에서는 **`<environment>`** 엘리먼트 내에 `<property>` 태그를 사용하여 프로퍼티를 정의합니다. 특히 앞서 살펴본 `profile` 속성과 결합하여 환경별로 서로 다른 프로퍼티 세트를 선언할 수 있습니다.

```xml
<aspectran>

    <!-- 1. 기본 프로퍼티 정의 -->
    <environment>
        <property name="app.title">Aspectran Demo Service</property>
        <property name="upload.maxSize">10485760</property>
    </environment>

    <!-- 2. 프로필(Profile)별 조건부 프로퍼티 정의 -->
    <environment profile="dev">
        <property name="upload.dir">/tmp/uploads</property>
        <property name="db.url">jdbc:h2:mem:devdb;DB_CLOSE_DELAY=-1</property>
    </environment>

    <environment profile="prod">
        <property name="upload.dir">/nas/storage/uploads</property>
        <property name="db.url">jdbc:mysql://prod-server:3306/prod_db</property>
    </environment>

</aspectran>
```

#### 4.2.3. 외부 프로퍼티 파일 통합 (`PropertiesFactoryBean`)

외부의 `.properties` 파일들을 읽어와 Aspectran 프로퍼티 시스템에 통합할 때는 유틸리티 빈인 **`com.aspectran.core.support.PropertiesFactoryBean`**을 등록하여 사용합니다.

```xml
<bean id="appProperties" class="com.aspectran.core.support.PropertiesFactoryBean">
    <properties>
        <!-- 파일 부재 시 에러 발생 방지 여부 설정 -->
        <item name="ignoreInvalidResource" valueType="boolean">false</item>
    </properties>

    <!-- 운영(prod) 프로필 활성화 시 로드할 파일 -->
    <properties profile="prod">
        <item name="locations" type="array">
            <value>/config/app-prod.properties</value>
        </item>
    </properties>

    <!-- 운영 프로필 미활성화 시(개발/테스트) 로드할 파일 -->
    <properties profile="!prod">
        <item name="locations" type="array">
            <value>classpath:config/app-dev.properties</value>
        </item>
    </properties>
</bean>
```

*   **경로 규칙**: `classpath:` 접두사를 사용하면 클래스패스 루트에서 탐색하고, 접두사가 없으면 애플리케이션의 베이스 경로(Base Path)를 기준으로 탐색합니다.
*   **AsEL 지원**: 로드된 프로퍼티 파일 내부에서도 `%{...}` 토큰을 사용하여 다른 Aspectran 프로퍼티를 참조할 수 있으며, 이는 초기화 시점에 자동으로 치환됩니다.

#### 4.2.4. 프로퍼티 체이닝과 캐싱 (Property Chaining & Caching)

프로퍼티 값 정의 시 다른 프로퍼티 토큰(`%{...}`)을 참조하는 경우, Aspectran은 이를 **캐싱(Caching)**하여 일관성을 보장합니다.

*   프로퍼티 정의 내에 **최소 하나 이상의 프로퍼티 토큰(`%{...}`)**이 포함되어 있는 경우, 최초 호출 시점에 전체 값을 평가하고 결과값을 내부 캐시에 보관하여 이후 재사용합니다.
*   만약 빈 토큰(`#{...}`)이나 파라미터 토큰(`${...}`)만으로 구성된 경우에는 캐싱되지 않고 매번 새로 동적 평가됩니다.

#### 4.2.5. AsEL `%{...}` 토큰 및 `@Value`를 통한 주입

정의된 프로퍼티는 AsEL의 **`%{propertyName}`** 문법을 사용하여 프레임워크 전반에서 자유롭게 참조할 수 있습니다.

*   **XML 설정에서 참조**: Bean의 프로퍼티나 Translet의 액션 파라미터에 주입할 수 있습니다.
    ```xml
    <bean id="fileUploader" class="com.example.FileUploader">
        <!-- 프로퍼티 값을 주입 (기본값 문법 지원: %{propertyName:defaultValue}) -->
        <property name="targetDir" value="%{upload.dir:/tmp}"/>
    </bean>
    ```

*   **Java 코드에서 `@Value`로 주입**:
    ```java
    @Component
    public class FileService {

        private final String uploadDir;
        private final long maxSize;

        @Autowired
        public FileService(
                @Value("%{upload.dir:/tmp}") String uploadDir,
                @Value("%{upload.maxSize:5242880}") long maxSize) {
            this.uploadDir = uploadDir;
            this.maxSize = maxSize;
        }
    }
    ```

### 4.3. Scheduler (스케줄러)

Aspectran Scheduler는 애플리케이션 내의 특정 작업을 **정해진 시간에 또는 주기적으로 자동 실행**할 수 있도록 하는 강력한 기능입니다. 이 기능을 통해 개발자는 배치(Batch) 작업, 데이터 동기화, 리포트 생성 등 다양한 백그라운드 태스크를 Aspectran의 핵심 컴포넌트인 Translet을 사용하여 손쉽게 구현하고 관리할 수 있습니다.

#### 4.3.1. 스케줄러의 역할 및 Quartz 기반 아키텍처

Aspectran Scheduler는 **Quartz 스케줄러 기반의 강력한 스케줄링 프레임워크를 코어에 내장**하고 있습니다. 개발자는 별도의 스케줄링 라이브러리를 직접 통합하는 복잡한 과정 없이, Aspectran이 제공하는 설정 규칙만으로 즉시 스케줄링 기능을 활성화하고 사용할 수 있습니다. 스케줄링의 복잡한 내부 동작을 신경 쓸 필요 없이, 자신이 가장 잘 아는 Translet을 사용하여 원하는 작업을 손쉽게 자동화할 수 있습니다.

#### 4.3.2. 스케줄러 설정 방법

Aspectran은 스케줄러를 설정하는 두 가지 주요 방법을 제공합니다.

1.  **XML/APON 기반 설정**: 스케줄러 빈(Bean)과 스케줄 규칙(`<schedule>`)을 XML 또는 APON 파일에 명시적으로 정의합니다.

    ```xml
    <!-- 스케줄러 빈 정의 -->
    <bean id="scheduler1" class="com.aspectran.core.scheduler.support.QuartzSchedulerFactoryBean">
        <property type="properties" name="quartzProperties">
            <entry name="org.quartz.scheduler.instanceName" value="MyScheduler"/>
            <entry name="org.quartz.threadPool.threadCount" value="10"/>
            <!-- 기타 모든 Quartz 속성... -->
        </property>
    </bean>

    <!-- 스케줄 규칙 정의 -->
    <schedule id="my-daily-report">
        <scheduler bean="scheduler1">
            <trigger type="cron">
                expression: 0 0 2 * * ? <!-- 매일 새벽 2시 실행 -->
            </trigger>
        </scheduler>
        <job translet="/batch/daily-report"/> <!-- 실행할 Translet 지정 -->
        <job translet="/batch/log-archive"/>
    </schedule>
    ```

2.  **어노테이션 기반 설정**: `@Schedule` 어노테이션을 사용하면, 스케줄러 빈 정의부터 잡(Job)과 트리거(Trigger) 설정까지 모든 것을 하나의 Java 클래스 안에서 선언적으로 처리할 수 있습니다. 이는 코드의 응집도를 높이고, XML 설정을 최소화하는 장점이 있습니다.

    ```java
    import com.aspectran.core.component.bean.annotation.Bean;
    import com.aspectran.core.component.bean.annotation.Component;
    import com.aspectran.core.component.bean.annotation.CronTrigger;
    import com.aspectran.core.component.bean.annotation.Job;
    import com.aspectran.core.component.bean.annotation.Request;
    import com.aspectran.core.component.bean.annotation.Schedule;
    import com.aspectran.core.context.rule.type.FormatType;
    import com.aspectran.core.scheduler.support.QuartzSchedulerFactoryBean;
    import org.quartz.SchedulerException;
    import org.quartz.impl.StdSchedulerFactory;

    import java.time.LocalDateTime;
    import java.util.Properties;

    @Component
    @Schedule(
        id = "my-annotated-job",
        scheduler = "mySchedulerBean", // 스케줄러 Bean의 ID
        cronTrigger = @CronTrigger(expression = "0 0/1 * * * ?"), // 매 1분마다 실행
        jobs = { @Job(translet = "/annotated/task") }
    )
    public class MyScheduledTasks {

        @Request("/annotated/task") // 스케줄러에 의해 실행될 Translet 메소드
        @Transform(FormatType.TEXT)
        public String executeTask() {
            return "스케줄링된 작업이 실행되었습니다: " + LocalDateTime.now();
        }

        @Bean("mySchedulerBean") // Quartz Scheduler Bean 정의
        public org.quartz.Scheduler createScheduler() throws SchedulerException {
            Properties props = new Properties();
            props.put("org.quartz.scheduler.instanceName", "AnnotatedScheduler");
            props.put("org.quartz.threadPool.threadCount", "5");
            return new StdSchedulerFactory(props).getScheduler();
        }
    }
    ```

#### 4.3.3. 트리거 (Trigger) 타입 상세

트리거는 잡(Job)이 실행될 시점을 정교하게 제어합니다. XML 방식의 `<trigger>` 요소와 어노테이션 방식의 `@SimpleTrigger`, `@CronTrigger` 어노테이션을 통해 설정할 수 있습니다.

*   **`simple` 트리거**: "지금부터 10초 후에 시작해서, 1시간마다, 총 5번 실행"과 같이 단순한 간격으로 작업을 반복할 때 사용합니다. 특정 간격으로 정해진 횟수만큼 또는 무한히 작업을 반복하는 데 가장 적합합니다.
    *   **주요 속성**: `startDelaySeconds`, `intervalInSeconds/Minutes/Hours`, `repeatCount` (`-1`은 무한 반복), `repeatForever`.

    ```xml
    <trigger type="simple">
        startDelaySeconds: 10
        intervalInHours: 1
        repeatForever: true
    </trigger>
    ```
    ```java
    @SimpleTrigger(
        startDelaySeconds = 300,
        intervalInSeconds = 30,
        repeatCount = 9 // 최초 1회 실행 + 9회 반복 = 총 10회
    )
    ```

*   **`cron` 트리거**: "매주 금요일 오후 5시 30분" 또는 "매달 마지막 날 새벽 1시"와 같이 달력과 연관된 복잡한 시간표에 따라 작업을 실행할 때 사용합니다. 강력한 **Cron 표현식**을 기반으로 동작하여 매우 유연하고 강력한 스케줄링을 제공합니다.
    *   **주요 속성**: `expression` (Cron 표현식 문자열).

    ```xml
    <trigger type="cron">
        expression: 0 50 23 * * ?
    </trigger>
    ```
    ```java
    @CronTrigger(expression = "0 30 9 ? * MON-FRI") // 매주 월요일부터 금요일까지, 오전 9시 30분
    ```

#### 4.3.4. 스케줄 잡 로깅 및 모니터링

스케줄링된 작업의 실행 상태를 확인하고 디버깅하는 것은 매우 중요합니다. Aspectran은 스케줄 잡의 실행 이벤트를 Logback을 통해 상세하게 기록할 수 있도록 지원합니다.

*   **로깅 메커니즘**: `com.aspectran.core.scheduler.activity.ActivityJobReporter` 클래스를 통해 잡의 시작, 성공, 실패 등의 이벤트를 로깅합니다. 이 리포터는 Quartz의 `JobListener`와 연동되어 잡의 생명주기 동안 발생하는 주요 정보를 기록합니다.
*   **Logback 설정 예제**: 스케줄러 로그를 별도의 파일로 분리하여 관리하려면 Logback의 `SiftingAppender`와 Aspectran의 `LoggingGroupDiscriminator`를 활용할 수 있습니다. 이를 통해 `LOGGING_GROUP` 값에 따라 별도의 스케줄러 로그 파일로 기록됩니다.

### 4.4. 응답 처리 (Response Handling)

Aspectran은 Translet 처리 결과를 클라이언트에 반환하거나 다음 단계로 전달하기 위해 다양한 응답 처리 방식을 제공합니다:
1.  **`dispatch`**: JSP나 Thymeleaf 같은 뷰 템플릿으로 처리를 위임하여 완전한 UI 화면을 렌더링합니다.
2.  **`transform`**: 선언적인 규칙을 통해 처리 결과를 JSON, XML, Text 등의 데이터 형식으로 직렬화합니다.
3.  **`forward`**: 현재 요청 컨텍스트와 속성을 유지한 채 서버 내부에서 다른 Translet으로 처리를 전달합니다.
4.  **`redirect`**: 클라이언트 브라우저에 새로운 URL로 이동하도록 리다이렉트 지시를 내립니다.
5.  **`RestResponse`**: Java 코드 내에서 HTTP 상태 코드, 헤더, 응답 본문을 동적으로 조합하여 반환합니다.

#### 4.4.1. Dispatch: 뷰 템플릿 렌더링

`dispatch` 응답은 JSP, Thymeleaf, FreeMarker와 같은 외부 뷰 템플릿 엔진으로 처리를 위임하여 완전한 HTML 웹 페이지를 렌더링하는 데 사용됩니다. 이는 전통적인 웹 애플리케이션의 UI 화면을 구성하는 데 적합합니다.

`<dispatch>` 규칙의 `name` 속성에는 템플릿 파일의 경로를 지정하며, `dispatcher` 속성에는 렌더링을 담당할 `ViewDispatcher` 빈(bean)을 지정할 수 있습니다. 만약 `dispatcher` 속성이 생략되면 기본 `ViewDispatcher`가 사용됩니다.

```xml
<!-- 1. Thymeleaf 뷰 디스패처 빈 설정 -->
<bean id="thymeleafViewDispatcher" class="com.aspectran.thymeleaf.view.ThymeleafViewDispatcher">
    <property name="prefix" value="/WEB-INF/templates/"/>
    <property name="suffix" value=".html"/>
    <property name="templateEngine" value-ref="thymeleafEngine"/>
</bean>

<!-- 2. Translet에서 Dispatch 규칙을 사용하여 Thymeleaf 뷰 호출 -->
<translet name="/hello">
    <dispatch name="hello" dispatcher="thymeleafViewDispatcher" contentType="text/html" encoding="UTF-8"/>
</translet>
```

#### 4.4.2. Transform: 데이터 형식 변환

`transform` 응답은 액션의 처리 결과를 특정 데이터 형식(JSON, XML, 텍스트 등)으로 변환하여 응답 본문을 직접 생성하는 데 사용됩니다. 이는 주로 REST API의 응답을 생성하거나, 데이터 연동을 위한 특정 형식의 텍스트를 반환할 때 매우 유용합니다.

*   **JSON 변환**: `format="json"`을 사용하여 처리 결과를 JSON 문자열로 변환합니다. REST API에서 가장 흔하게 사용됩니다. `pretty="true"` 속성을 추가하면 가독성 좋게 출력됩니다.
    ```xml
    <translet name="/api/users/1">
        <action bean="userService" method="getUser" id="user"/>
        <transform format="json" pretty="true"/>
    </translet>
    ```

*   **XML 변환**: `format="xml"`을 사용하여 XML로 변환합니다.
    ```xml
    <translet name="/api/users/1.xml">
        <action bean="userService" method="getUser" id="user"/>
        <transform format="xml" pretty="true"/>
    </translet>
    ```

*   **텍스트 변환 및 템플릿 활용**: `format="text"`을 사용하여 일반 텍스트로 변환합니다. `<template>` 규칙과 함께 사용하면 AsEL 토큰을 통해 동적인 텍스트 내용을 만들 수 있습니다.
    ```xml
    <translet name="/api/users/1/info">
        <action bean="userService" method="getUser" id="user"/>
        <transform format="text">
            <template>
                사용자 이름: @{user.name}
                이메일: @{user.email}
            </template>
        </transform>
    </translet>
    ```

#### 4.4.3. Forward: 내부 Translet 전달

`forward` 응답은 클라이언트에게 응답을 바로 보내지 않고, **서버 내부에서 현재 요청을 다른 Translet으로 즉시 전달(Forwarding)**하여 처리를 위임하는 방식입니다.

*   **요청 컨텍스트 유지**: 클라이언트의 새로운 HTTP 요청이 발생하는 것이 아니므로, 현재 `Activity`에 저장된 요청 속성(`translet.getAttribute()`)과 파라미터들이 그대로 대상 Translet으로 안전하게 전달됩니다.
*   **선언적 XML 설정**:
    ```xml
    <translet name="/order/process">
        <action bean="orderService" method="processPayment"/>
        <!-- 결제 완료 후 내부 요약 Translet으로 포워딩 -->
        <forward translet="/order/summary"/>
    </translet>
    ```
*   **Java 코드에서 동적 포워딩**:
    ```java
    @RequestToPost("/login")
    public void handleLogin(Translet translet) {
        boolean success = authService.authenticate(translet);
        if (success) {
            translet.forward("/dashboard");
        } else {
            translet.setAttribute("loginError", "아이디 또는 비밀번호가 일치하지 않습니다.");
            translet.forward("/login-form");
        }
    }
    ```

#### 4.4.4. Redirect: 클라이언트 리다이렉션과 FlashMap

`redirect` 응답은 클라이언트 웹 브라우저에게 HTTP 리다이렉트 응답(기본 302 Found)을 보내 새로운 URL로 다시 요청하도록 지시하는 방식입니다. 주로 양식 제출 후 브라우저 새로고침으로 인한 중복 처리를 방지하는 **POST-Redirect-GET(PRG) 패턴**을 구현할 때 핵심적으로 사용됩니다.

*   **선언적 XML 설정**:
    ```xml
    <translet name="/user/register" method="POST">
        <action bean="userService" method="register"/>
        <!-- 회원 가입 완료 후 환영 페이지로 리다이렉트 -->
        <redirect path="/user/welcome"/>
    </translet>
    ```

*   **Java 코드에서 동적 리다이렉트 및 FlashMap 연계**:
    리다이렉트는 브라우저가 새로운 요청을 생성하므로 일반적인 요청 속성(`Request Scope`)은 소멸됩니다. Aspectran은 이 문제를 우아하게 해결하기 위해 1회성 데이터 임시 보관소인 **`FlashMap`**을 기본 제공합니다:

    ```java
    @RequestToPost("/user/signup")
    public void registerUser(@NonNull Translet translet, UserRegistrationDto dto) {
        userService.register(dto);

        // 1. 다음 요청(리다이렉트된 페이지)에서만 1회성으로 사용할 알림 메시지 설정
        FlashMap flashMap = translet.getOutputFlashMap();
        flashMap.put("welcomeMsg", dto.getUsername() + "님, 가입을 환영합니다!");

        // 2. 환영 페이지로 리다이렉트 (쿼리 파라미터 맵 전달도 가능)
        translet.redirect("/user/welcome");
    }

    @RequestToGet("/user/welcome")
    public void welcomePage(@NonNull Translet translet) {
        // 이전 요청에서 전달된 FlashMap 데이터가 현재 요청 속성(Attribute)으로 자동 복원됨
        if (translet.hasInputFlashMap()) {
            Map<String, ?> flashData = translet.getInputFlashMap();
            // 뷰 템플릿에서 바로 참조 가능
        }
        translet.dispatch("user/welcome");
    }
    ```

#### 4.4.5. RestResponse: 프로그래밍 방식의 REST 응답

`transform` 규칙이 선언적으로 응답을 생성하는 간편한 방법을 제공하는 반면, `RestResponse` 인터페이스는 Java 코드 내에서 프로그래밍 방식으로 RESTful 응답을 동적으로 구성할 수 있는 더 유연하고 강력한 방법을 제공합니다. 이 방식을 사용하면, 조건에 따라 HTTP 상태 코드, 헤더, 응답 데이터를 세밀하게 제어할 수 있습니다.

일반적으로 액션 메소드에서 `DefaultRestResponse`의 인스턴스를 생성하고, 데이터를 설정한 뒤, `.ok()`, `.notFound()`, `.created()` 와 같은 메소드를 호출하여 최종 `RestResponse` 객체를 반환합니다.

*   **주요 특징**:
    *   **데이터 설정**: `setData("key", value)` 또는 생성자를 통해 응답 데이터를 설정합니다.
    *   **상태 코드 체이닝**: `.ok()`, `.created(location)`, `.notFound()`, `.forbidden()` 등 직관적인 메소드를 체이닝하여 HTTP 상태 코드를 설정하고 응답 객체를 반환합니다.
    *   **유연성**: 복잡한 비즈니스 로직의 결과에 따라 응답 내용과 상태를 동적으로 결정해야 할 때 매우 유용합니다.

*   **사용 예제**:
    ```java
    @Component
    public class CustomerActivity {

        private final CustomerRepository repository;

        @Autowired
        public CustomerActivity(CustomerRepository repository) {
            this.repository = repository;
        }

        @RequestToGet("/customers/${id}")
        public RestResponse getCustomer(@NonNull Integer id) {
            Customer customer = repository.getCustomer(id);
            RestResponse response = new DefaultRestResponse();
            if (customer != null) {
                // 데이터와 함께 200 OK 상태를 반환
                response.setData("customer", customer);
                response.ok();
            } else {
                // 404 Not Found 상태를 반환
                response.notFound();
            }
            return response;
        }

        @RequestToPost("/customers")
        public RestResponse addCustomer(@NonNull Translet translet, @NonNull Customer customer) {
            int id = repository.insertCustomer(customer);
            String resourceUri = translet.getActualRequestName() + "/" + id;
            // 생성된 리소스의 URI와 함께 201 Created 상태를 반환
            return new DefaultRestResponse(customer).created(resourceUri);
        }
    }
    ```
`RestResponse`를 사용하면, 선언적 방식인 `<transform>` 규칙보다 더 복잡하고 동적인 REST API 응답을 효과적으로 구현할 수 있습니다.

## 5. Aspectran 구성 설정

Aspectran 애플리케이션의 초기 구동 설정은 `com.aspectran.core.context.config.AspectranConfig` 객체를 통해 관리됩니다.
이 설정은 주로 APON(Aspectran Parameters Object Notation) 형식의 `aspectran-config.apon` 파일로 로드되며,
이 파일을 통해 XML 형식의 설정 파일(`context.rules`로 지정)을 포함하거나 어노테이션 기반 설정을 활성화할 수 있습니다.

### 5.1. Aspectran 기본 구성 설정

"기본 구성 설정"은 Aspectran 애플리케이션의 초기 구동에 필요한 핵심 설정을 다룹니다. 주로 `aspectran-config.apon` 파일을 통해 시스템 속성, 컨텍스트 규칙, 환경별 설정 등을 정의합니다.

*   **`system`**: 시스템 레벨의 속성(예: 암호화 키, 스레드 풀 설정)을 정의합니다.
*   **`context`**: `ActivityContext` 구성을 위한 설정으로, XML 규칙 파일 경로(`rules`), 컴포넌트 스캔 대상 패키지(`scan`), 활성 프로필(`profiles`) 등을 지정합니다.
*   **`web` / `scheduler` / `shell` / `daemon`**: 각 런타임 환경에 특화된 상세 설정을 제공합니다.

자세한 내용은 [Aspectran 기본 구성 설정](/ko/docs/guides/aspectran-configuration/) 문서를 참고하세요.

### 5.2. Aspectran XML 구성 설정

XML 구성은 Bean, Translet, Aspect 등 애플리케이션의 핵심 구성 요소를 명시적으로 정의하는 데 사용됩니다. 소스 코드를 수정하지 않고도 구성과 관계를 변경할 수 있어 높은 유연성을 제공합니다.

*   **구조**: `<aspectran>`을 루트 엘리먼트로 하며, 그 하위에 `<bean>`, `<translet>`, `<aspect>`, `<schedule>` 등의 요소를 배치합니다.
*   **DTD 검증**: Aspectran은 설정 파일의 구조적 유효성을 검증하기 위해 복잡한 XSD 대신 단순하고 명확한 DTD(Document Type Definition)를 사용합니다.

자세한 내용은 [Aspectran XML 구성 설정](/ko/docs/guides/aspectran-xml-configuration/) 문서를 참고하세요.

### 5.3. 설정 파일 모듈화와 분할 구성 (`<append>`)

엔터프라이즈 규모의 애플리케이션에서는 수많은 Bean과 Translet, AOP 규칙이 정의되므로 단일 XML 파일에서 모든 설정을 관리하면 가독성과 유지보수성이 크게 떨어집니다. Aspectran은 **`<append>`** 엘리먼트를 통해 여러 설정 파일들을 역할별, 기능별로 분할하고 루트 규칙 파일에서 유연하게 조립(`append`)할 수 있는 모듈화 메커니즘을 제공합니다.

#### 1) `<append>` 지원 리소스 유형
*   **`resource` 속성**: 클래스패스(JAR 내부 포함) 경로에서 설정 파일을 로드합니다. 가장 권장되는 표준 방식입니다.
    ```xml
    <append resource="config/common-beans.xml"/>
    ```
*   **`file` 속성**: 파일 시스템의 절대 경로 또는 상대 경로에서 설정 파일을 로드합니다. 서버 외부의 특정 경로 설정을 불러올 때 유용합니다.
    ```xml
    <append file="/etc/myapp/config/external-rules.xml"/>
    ```
*   **`url` 속성**: 원격 HTTP/HTTPS 주소로부터 설정 파일을 동적으로 로드합니다.
    ```xml
    <append url="https://config-server.internal/rules/common-rules.xml"/>
    ```

#### 2) 프로필과의 결합을 통한 환경별 모듈 로딩
`<append>` 엘리먼트는 앞서 살펴본 `profile` 속성을 완벽하게 지원하므로, 특정 실행 환경에서만 필요한 전용 설정 모듈을 선택적으로 로드할 수 있습니다:

```xml
<!-- 운영(prod) 환경에서만 모니터링 관련 규칙 모듈을 포함 -->
<append resource="config/prod/monitoring.xml" profile="prod"/>
```

#### 3) Aspectran 규칙 파일 명명 규칙에 따른 계층적 모듈 분할

Aspectran은 설정의 **뼈대(Skeleton)**와 실제 비즈니스 및 자원을 담은 **내용(Content)**을 명확하게 구분하는 규칙 기반(Rule-based) 명명 규칙을 적용합니다:

*   **구조적 진입점 (Skeleton - `*-rules.xml`)**: 애플리케이션의 설정 뼈대를 잡고 하위 모듈들을 조립(`append`)하는 진입점 파일입니다.
    *   `aspectran-rules.xml`: 애플리케이션 전체의 루트 규칙 진입점
    *   `web-rules.xml`: 웹 환경을 위한 규칙 진입점
    *   `shell-rules.xml`, `daemon-rules.xml`: CLI 및 데몬 환경 전용 규칙 진입점
*   **기능 및 도메인 모듈 (Content - 간결한 이름)**: 실제 트랜슬렛 그룹이나 특정 자원(Bean, DB 등)을 담고 있는 내용물 파일입니다. 상위 규칙 파일에서 포함되므로 불필요한 접미사 없이 의미 중심의 간결한 이름을 사용합니다.
    *   `database.xml`, `server.xml`, `home.xml`, `monitoring.xml`, `order.xml` 등

```text
aspectran-config.apon (시스템 설정)
└── aspectran-rules.xml (루트 규칙 진입점)
    ├── database.xml (자원 정의)
    ├── common-beans.xml (공통 빈 정의)
    └── web-rules.xml (웹 환경 규칙 진입점)
        ├── home.xml (홈 트랜슬렛 그룹)
        └── order.xml (주문 트랜슬렛 그룹)
```

**루트 규칙 파일 예시 (`aspectran-rules.xml`):**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>

    <description>애플리케이션 루트 규칙 진입점</description>

    <!-- 1. 자원 및 공통 인프라 설정 모듈 로드 -->
    <append resource="config/database.xml"/>
    <append resource="config/common-beans.xml"/>

    <!-- 2. 공통 AOP 보안 및 인터셉터 규칙 로드 -->
    <append resource="config/security-rules.xml"/>

    <!-- 3. 실행 환경별 전용 규칙 진입점 조립 -->
    <append resource="config/web-rules.xml"/>
    <append resource="config/scheduler-rules.xml"/>

</aspectran>
```

### 5.4. 서블릿 기반 웹 애플리케이션 구성

전통적인 서블릿 컨테이너(Tomcat, Jetty 등) 환경에서 Aspectran을 구동하기 위해서는 `web.xml` 배포 서술자에 Aspectran의 `WebActivityServlet`과 `WebServiceListener`를 등록해야 합니다.

*   **`WebServiceListener`**: Aspectran 서비스의 생명주기(시작/종료)를 관리합니다.
*   **`WebActivityServlet`**: 모든 웹 요청을 받아 적절한 Translet으로 연결해 주는 프론트 컨트롤러(Front Controller) 역할을 수행합니다.
*   **`aspectran:config`**: 루트 설정 파일의 위치(예: `classpath:config/aspectran-config.apon`)를 지정하는 컨텍스트 파라미터입니다.

자세한 내용은 [서블릿 기반 웹 애플리케이션 구성](/ko/docs/guides/aspectran-servlet-configuration/) 문서를 참고하세요.

### 5.5. 어노테이션과 XML 설정의 조합

대부분의 경우 어노테이션 기반의 컴포넌트 스캔을 기본으로 사용하고, 특정 Bean을 재정의하거나 외부 라이브러리를 등록할 때 XML 설정을 조합하여 사용하는 것이 일반적입니다.
동일한 ID의 Bean이 둘 다에 정의된 경우, 나중에 로드되는 설정이 우선권을 가질 수 있으며, `<bean important="true">` 속성으로 덮어쓰기를 강제할 수 있습니다.

## 6. 개발 팁 및 모범 사례

Aspectran 애플리케이션을 개발할 때 다음과 같은 팁과 모범 사례를 따르면 더 견고하고 유지보수하기 쉬운 코드를 작성할 수 있습니다.

### 6.1. 생성자 주입 선호

*   **불변성(Immutability)**: 의존성을 `final` 필드로 선언할 수 있어 Bean의 상태가 변경되지 않음을 보장합니다.
*   **의존성 명시**: 객체가 기능하는 데 필요한 모든 의존성이 생성자에 명확하게 드러나므로, 코드의 가독성이 높아집니다.
*   **순환 참조 방지**: 생성자 주입을 사용할 경우, Bean A와 B가 서로를 필요로 하는 순환 참조가 발생하면 애플리케이션 시작 시점에 오류가 발생하여 문제를 즉시 발견하고 해결할 수 있습니다.

### 6.2. 순환 의존성 피하기

순환 의존성(Circular Dependency)은 두 개 이상의 Bean이 서로를 의존하는 상황을 말합니다. 이는 설계상의 문제를 나타내는 신호일 수 있으며, 코드의 복잡성을 증가시키고 테스트를 어렵게 만듭니다. 대부분의 경우, 책임을 분리하여 제3의 클래스로 옮기는 리팩토링을 통해 순환 의존성을 해결할 수 있습니다. 불가피한 경우, 수정자(setter) 주입을 사용하면 순환 참조 문제를 해결할 수 있지만, 이는 최후의 수단으로 고려해야 합니다.

### 6.3. 싱글톤 빈과 상태 관리

싱글톤 Bean은 애플리케이션 전체에서 단 하나의 인스턴스만 존재하므로, 여러 스레드에서 동시에 접근할 수 있습니다. 만약 싱글톤 Bean이 변경 가능한 상태(예: 멤버 변수)를 가지고 있다면, 동시성(concurrency) 문제가 발생할 수 있습니다. 싱글톤 Bean은 가급적 상태를 가지지 않도록(stateless) 설계하는 것이 가장 좋습니다. 상태가 꼭 필요하다면 `ThreadLocal`을 사용하거나, 동기화(synchronization) 처리를 신중하게 구현해야 합니다.

### 6.4. `prototype` 빈의 생명주기 이해

`prototype` 스코프의 Bean은 컨테이너가 생성하고 의존성을 주입한 후에는 더 이상 관리하지 않습니다. 따라서 `@Destroy`나 `DisposableBean`과 같은 소멸 관련 콜백이 **호출되지 않습니다.** `prototype` Bean이 데이터베이스 커넥션과 같은 중요한 리소스를 점유하고 있다면, 해당 리소스를 해제하는 로직을 개발자가 직접 호출해야 합니다.

## 7. 문제 해결 및 디버깅

Aspectran 애플리케이션 개발 중 발생할 수 있는 일반적인 문제에 대한 해결 팁입니다.

### 7.1. 로깅 활용

Aspectran은 SLF4J와 Logback을 기반으로 유연하고 강력한 로깅 시스템을 구축합니다. 애플리케이션의 동작을 이해하고 문제를 진단하는 데 로깅은 필수적입니다.

*   **로그 레벨 조정**: `logback.xml` 또는 `logback-test.xml` 파일에서 로그 레벨(TRACE, DEBUG, INFO, WARN, ERROR)을 조정하여 필요한 정보를 더 상세하게 얻을 수 있습니다.
*   **스케줄러 로그 분리**: 스케줄링된 작업의 로그는 별도의 파일로 분리하여 모니터링할 수 있습니다. (`com.aspectran.core.scheduler.activity.ActivityJobReporter` 클래스 로그 활용)

자세한 내용은 [Aspectran 로깅 메커니즘](/ko/docs/mechanisms/aspectran-logging-mechanism/) 문서를 참고하세요.

### 7.2. 일반적인 오류 메시지 및 해결 팁

*   **`BeanNotFoundException`**: 요청한 Bean을 컨테이너에서 찾을 수 없을 때 발생합니다. 다음을 확인하세요:
    *   Bean이 `@Component` 또는 `@Bean` 어노테이션으로 올바르게 정의되었는지.
    *   메인 설정 파일(`aspectran.apon` 또는 `aspectran.xml`)의 `context.scan` 또는 `<bean-scan>`에 해당 Bean이 포함된 패키지가 올바르게 지정되었는지.
    *   Bean ID나 타입이 올바르게 참조되었는지.
*   **`NoActivityStateException`**: 현재 스레드에 `Activity` 컨텍스트가 없을 때 발생합니다. 주로 `@Async` 메소드 내에서 `CompletableFuture.supplyAsync()`와 같이 새로운 스레드 풀에서 코드를 실행할 때 발생할 수 있습니다. `@Async`에 의해 생성된 스레드 내에서 모든 작업을 동기적으로 처리하고 최종 결과만 `CompletableFuture.completedFuture()`로 감싸서 반환하는 것이 안전합니다.
*   **설정 파일 파싱 오류**: XML 또는 APON 설정 파일의 문법 오류로 인해 발생합니다. 오류 메시지에 표시된 줄 번호와 위치를 확인하여 문법을 수정하세요.

## 8. 참고 문서

이 가이드가 Aspectran을 사용하는 데 도움이 되기를 바랍니다. 각 주제에 대한 더 상세한 정보는 아래 문서들을 참고하십시오.

*   [Aspectran 기본 구성 가이드](https://aspectran.com/ko/docs/guides/aspectran-configuration/)
*   [Aspectran XML 구성 가이드](https://aspectran.com/ko/docs/guides/aspectran-xml-configuration/)
*   [Aspectran 규칙 파일 명명 규칙](https://aspectran.com/ko/docs/guides/aspectran-rule-file-naming/)
*   [Aspectran 프로퍼티 구성 및 활용](https://aspectran.com/ko/docs/guides/aspectran-properties/)
*   [Aspectran 와일드카드 패턴 매칭 가이드](https://aspectran.com/ko/docs/guides/aspectran-wildcard-matching/)
*   [서블릿 기반 웹 애플리케이션 구성](https://aspectran.com/ko/docs/guides/aspectran-servlet-configuration/)
*   [Aspectran Beans](https://aspectran.com/ko/docs/guides/aspectran-beans/)
*   [Aspectran AOP: 기능과 아키텍처](https://aspectran.com/ko/docs/guides/aspectran-aop/)
*   [Aspectran의 대표 얼굴: Translet 이해하기](https://aspectran.com/ko/docs/guides/aspectran-translet/)
*   [Aspectran Translet 실용 가이드](https://aspectran.com/ko/docs/guides/practical-guide-to-translets/)
*   [Aspectran Scheduler: Translet을 이용한 작업 자동화](https://aspectran.com/ko/docs/guides/aspectran-scheduler/)
*   [Aspectran 뷰(View) 기술](https://aspectran.com/ko/docs/guides/aspectran-view-technologies/)
*   [Aspectran Profiles](https://aspectran.com/ko/docs/guides/aspectran-profiles/)
*   [AsEL(Aspectran Expression Language) 소개](https://aspectran.com/ko/docs/guides/introduce-asel/)
*   [APON(Aspectran Parameters Object Notation) 소개](https://aspectran.com/ko/docs/guides/introduce-apon/)
*   [Aspectran JSON 유틸리티 가이드](https://aspectran.com/ko/docs/guides/aspectran-json-guide/)
