---
title: "Aspectran Actions: 개념, 종류 및 처리 결과"
subheadline: 아키텍처
---

Aspectran 프레임워크에서 **Action**은 트랜슬릿(Translet)의 실행 흐름 내에서 특정 작업을 수행하는 가장 기본적인 실행 단위입니다. Action은 비즈니스 로직 호출, 데이터 조작, 흐름 제어 등 애플리케이션의 실질적인 행위를 담당합니다.

## 1. Action의 핵심: `Executable` 인터페이스

모든 Action은 `com.aspectran.core.activity.process.action.Executable` 인터페이스를 구현합니다. 이 인터페이스는 단 하나의 핵심 메서드를 정의합니다.

-   `Object execute(Activity activity)`: Action이 수행할 구체적인 작업을 캡슐화한 메서드입니다. `Activity` 객체를 파라미터로 받아 현재 실행 컨텍스트에 접근할 수 있으며, 처리 결과 값을 `Object` 타입으로 반환합니다. 이 반환 값은 후속 Action이나 최종 응답을 생성하는 데 사용됩니다.

Action들은 설정 파일(XML/APON)의 `<action>` 태그에 대응하는 `ActionRule`에 의해 정의되고, `Activity`의 실행 파이프라인에 의해 순차적으로 실행됩니다.

## 2. 내장 Action의 종류와 상세 설명

`com.aspectran.core.activity.process.action` 패키지에는 다양한 내장 Action 구현체가 포함되어 있습니다.

-   **`InvokeAction`**: 가장 일반적으로 사용되는 Action으로, 지정된 빈(Bean)의 특정 메서드를 호출합니다. 비즈니스 로직을 트랜슬릿에 통합하는 핵심적인 역할을 합니다.
    -   **설정 예시**:
        ```xml
        <action id="user" bean="userService" method="getUserById">
            <argument name="id">#{userId}</argument>
        </action>
        ```

-   **`EchoAction`**: 현재 `Activity` 컨텍스트(파라미터, 속성, 빈 프로퍼티 등)의 데이터를 평가하여 그 결과를 `ActionResult`로 반환합니다. 주로 뷰 템플릿에 전달할 모델 데이터를 구성하거나, 특정 값을 결과로 노출할 때 사용됩니다.
    -   **설정 예시**:
        ```xml
        <echo id="pageInfo">
            <argument name="title">사용자 목록</argument>
            <argument name="totalCount">#{@userDao^countAll}</argument>
        </echo>
        ```

-   **`HeaderAction`**: HTTP 응답에 하나 이상의 헤더를 설정합니다. 웹 환경에서 `Content-Type`이나 `Cache-Control`과 같은 응답 헤더를 동적으로 추가하거나 수정하는 데 사용됩니다.
    -   **설정 예시**:
        ```xml
        <headers>
            <header name="Cache-Control" value="no-cache, no-store, must-revalidate"/>
            <header name="Pragma" value="no-cache"/>
        </headers>
        ```

-   **`IncludeAction`**: 다른 트랜슬릿을 실행하고 그 결과를 현재 트랜슬릿의 `ProcessResult`에 포함시킵니다. 이를 통해 공통 로직(예: 인증, 공통 데이터 조회)을 모듈화하고 재사용성을 높일 수 있습니다.
    -   **설정 예시**:
        ```xml
        <!-- 공통 사용자 인증 트랜슬릿을 포함 -->
        <include translet="/other-translet">
            <parameter name="param">${param}</parameter>
            <attribute name="attr">${attr}</attribute>
        </include>
        ```

-   **`ChooseAction`**: 조건부 실행 흐름을 제공하는 Action으로, `switch` 문과 유사하게 작동합니다. 내부에 정의된 여러 `<when>` 조건 중 첫 번째로 참(true)이 되는 조건의 Action들을 실행합니다.
    -   **설정 예시**:
        ```xml
        <choose>
            <when test="${userType} == 'admin'">
                <forward translet="/admin/dashboard"/>
            </when>
            <when test="${userType} == 'user'">
                <forward translet="/user/dashboard"/>
            </when>
            <otherwise>
                <redirect path="/login"/>
            </otherwise>
        </choose>
        ```

-   **`AdviceAction`**: AOP(관점 지향 프로그래밍)의 어드바이스(Advice) 빈의 메서드를 실행하는 특수한 `InvokeAction`입니다. AOP 컨텍스트에서 `@Before`, `@After` 등과 같은 어드바이스 로직을 실행할 때 내부적으로 사용됩니다.

-   **`AnnotatedAction`**: `@RequestToGet`, `@Action` 등 특정 Aspectran 어노테이션으로 식별된 빈의 메서드를 실행하는 Action입니다. XML 규칙 대신 어노테이션 기반의 CoC(Convention over Configuration)를 가능하게 합니다.

## 3. Action 처리 결과의 구조와 활용

Aspectran에서 Action의 처리 결과 값은 단순한 반환 값을 넘어, 트랜슬릿(Translet)의 실행 흐름 전반에 걸쳐 데이터를 전달하고 제어하는 핵심적인 역할을 수행합니다. 이 값들은 `Activity`의 생명 주기 동안 생성된 데이터를 구조화하고, 후속 처리 단계에서 이 데이터에 접근하고 활용할 수 있도록 하는 정교한 데이터 모델입니다.

### 3.1. 결과 값의 계층 구조 (`com.aspectran.core.activity.process.result`)

Action의 처리 결과 값은 다음 세 가지 클래스를 통해 계층적으로 관리됩니다.

-   **`ActionResult`**: 계층의 가장 작은 단위로, 개별 `Executable` Action이 실행된 후 반환하는 값(`resultValue`)을 캡처합니다. 이 값은 Action에 부여된 고유 ID(`actionId`)와 함께 저장됩니다.
    -   만약 `actionId`에 구분자(예: `.`)가 포함된 경우(예: `user.address`), 결과는 `ResultValueMap`이라는 특수한 `Map` 형태로 중첩되어 저장될 수 있어 복잡한 데이터 구조를 표현할 수 있습니다.

-   **`ContentResult`**: 여러 `ActionResult` 객체들을 논리적으로 그룹화합니다. 이는 트랜슬릿 설정의 `<contents>` 블록과 같이 특정 콘텐츠 영역 내에서 실행된 Action들의 결과를 모아두는 역할을 합니다. `ContentResult`는 이름으로 식별될 수 있으며(예: `<contents name="main">`), 해당 블록 내의 모든 Action 결과를 한데 묶어 관리합니다.

-   **`ProcessResult`**: 단일 `Activity`의 전체 실행 결과에 대한 최상위 컨테이너입니다. 모든 `ContentResult` 객체들을 포함하며, `Activity`가 완료된 후 최종적으로 반환되는 결과 집합입니다. `ProcessResult`는 `Activity`의 전체 처리 과정에서 발생한 모든 Action의 결과에 대한 포괄적인 뷰를 제공합니다.

### 3.2. 결과 값의 주요 활용처

Action의 처리 결과 값은 다음과 같은 다양한 시나리오에서 핵심적인 역할을 합니다.

#### 가. 뷰 렌더링 (View Rendering)
가장 일반적인 사용 사례로, Action의 결과를 뷰 템플릿(예: FreeMarker, Pebble, JSP)에 모델로 전달하여 동적인 UI를 생성합니다.

**예제:** `InvokeAction`으로 사용자 정보를 조회하고, 그 결과를 Pebble 템플릿에 전달하기

*   **Translet 설정:**
    ```xml
    <translet name="/user/detail">
        <action id="userInfo" bean="userDao" method="getUser">
            <argument name="id">#(param:userId)</argument>
        </action>
        <response>
            <dispatch name="user/detail.peb"/>
        </response>
    </translet>
    ```
*   **Pebble 템플릿 (`user/detail.peb`):**
    ```html
    {% raw %}<h1>사용자 정보</h1>
    <p>이름: {{ userInfo.name }}</p>
    <p>이메일: {{ userInfo.email }}</p>{% endraw %}
    ```
    `userInfo`라는 `actionId`가 템플릿에서 모델 객체의 이름이 되어 `userInfo.name`과 같은 방식으로 데이터에 접근할 수 있습니다.

#### 나. REST API 응답 생성 (Response Generation)
RESTful API에서 Action의 결과는 JSON, XML 등의 데이터 형식으로 변환되어 클라이언트에게 응답으로 전송됩니다. 이때 `TransformResponse`가 주로 사용됩니다.

**예제:** Action 결과를 JSON으로 변환하여 응답하기

*   **Translet 설정:**
    ```xml
    <translet name="/api/user/detail" method="GET">
        <action id="user" bean="userDao" method="getUser"/>
        <transform type="json"/>
    </translet>
    ```
    `userDao.getUser()`가 반환한 `User` 객체는 `user`라는 이름의 `ActionResult`로 저장되고, `TransformResponse`는 `ProcessResult` 전체를 JSON 형식으로 직렬화하여 응답 본문을 생성합니다.

#### 다. 트랜슬릿 간 데이터 전달 (Inter-Translet Communication)
`IncludeAction`을 사용하면 다른 트랜슬릿을 실행하고 그 결과를 현재 트랜슬릿의 컨텍스트로 가져올 수 있습니다. 이를 통해 공통 로직을 모듈화하고 재사용할 수 있습니다.

**예제:** 공통 인증 트랜슬릿을 포함하여 인증 정보 사용하기

*   **인증 트랜슬릿 (`/common/auth`):**
    ```xml
    <translet name="/common/auth">
        <action id="authInfo" bean="authService" method="authenticate"/>
    </translet>
    ```
*   **메인 트랜슬릿:**
    ```xml
    <translet name="/user/dashboard">
        <!-- 인증 트랜슬릿을 실행하고 그 결과를 현재 컨텍스트에 포함 -->
        <incldue translet="/common/auth"/>
        <!-- 포함된 트랜슬릿의 결과(authInfo)를 후속 Action에서 사용 -->
        <action bean="dashboardService" method="getDashboardData">
            <argument name="userId">@{authInfo.userId}</argument>
        </action>
        <dispatch name="dashboard.jsp"/>
    </translet>
    ```

#### 라. 조건부 로직 및 흐름 제어 (Conditional Logic)
`ChooseAction`은 이전 Action의 결과 값을 평가하여 다음 실행 경로를 동적으로 결정하는 데 사용됩니다.

**예제:** 로그인 성공 여부에 따라 다른 페이지로 포워딩하기

*   **Translet 설정:**
    ```xml
    <translet name="/user/loginProc">
        <choose>
            <when test="@{loginResult^success}">
                <!-- 성공 시 대시보드로 포워드 -->
                <forward translet="/user/dashboard"/>
            </when>
            <otherwise>
                <!-- 실패 시 로그인 페이지로 리다이렉트 -->
                <redirect path="/login?error=1"/>
            </otherwise>
        </choose>
    </translet>
    ```
    `@{loginResult^success}` 표현식은 `loginResult`라는 Action의 결과 객체에서 `success` 프로퍼티를 평가하여 `true` 또는 `false`를 반환합니다.

### 3.3. 결과 값 접근 방식

`Translet` 객체는 `ProcessResult`에 접근할 수 있는 메서드를 제공합니다.

-   **`translet.getProcessResult()`**: 전체 `ProcessResult` 객체를 얻습니다.
-   **`translet.getProcessResult().getResultValue(String actionId)`**: 특정 `actionId`에 해당하는 Action의 결과 값을 직접 조회합니다. 이 메서드는 `parentActionId.childKey`와 같은 중첩된 `actionId`도 처리하여 복잡한 구조의 데이터에 쉽게 접근할 수 있도록 합니다.
