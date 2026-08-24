---
title: "Aspectran의 대표 얼굴: Translet 이해하기"
subheadline: 핵심 가이드
---

Aspectran 프레임워크에서 **트랜스렛(Translet)**은 그 이름만 보면 요청을 처리하는 주체처럼 보이지만, 실제로는 **"요청을 어떻게 처리할 것인가?"**에 대한 구체적인 **실행 계획서 또는 설계도**입니다. 실제 모든 실행은 `Activity`라는 엔진이 담당하며, Translet은 이 `Activity`와 사용자 코드(Action) 사이의 소통을 위한 **매개체** 역할을 합니다.

웹 애플리케이션의 특정 URL 요청 처리, CLI 명령어 실행(Shell), 백그라운드 서비스(Daemon) 등 Aspectran에서 실행되는 모든 요청-응답 사이클(트랜잭션)은 하나의 Translet 규칙으로 정의되고 실행됩니다.

## 1. Translet의 특징

### 1.1. 선언적 규칙 기반 (Declarative & Rule-Based)

Translet은 XML 또는 APON(Aspectran Object Notation) 형식의 **선언적인 규칙(Rule)들의 집합**으로 정의됩니다. 이를 통해 비즈니스 로직과 처리 흐름을 분리할 수 있습니다.

```xml
<translet name="/user/info">
    <!-- 요청을 어떻게 처리할지 정의하는 규칙들 -->
    <action bean="userDao" method="getUserInfo"/>
    <transform format="json"/>
</translet>
```

### 1.2. 뛰어난 유연성과 재사용성

하나의 Translet은 특정 요청에 대한 처리 흐름을 정의합니다. 여기에는 다음과 같은 다양한 처리 규칙이 포함될 수 있습니다.

-   **요청(Request) 처리**: 요청 파라미터나 페이로드를 어떻게 처리할지 정의합니다.
-   **액션(Action) 실행**: 어떤 비즈니스 로직을 수행할지 정의합니다.
-   **콘텐츠(Content) 생성**: 처리 결과를 조합하여 응답할 콘텐츠를 생성합니다.
-   **변환(Transform)**: 생성된 콘텐츠를 JSON, XML, 텍스트 등 최종적인 응답 형태로 변환합니다.
-   **응답(Response) 제어**: 처리 결과를 JSON, XML 같은 데이터로 직접 응답하거나, 뷰 템플릿으로 디스패치(Dispatch)하여 UI를 렌더링하거나, 다른 Translet으로 포워드(Forward) 또는 리다이렉트(Redirect)할 수 있습니다.

이러한 규칙들을 조합하여 매우 단순한 작업부터 복잡한 워크플로우까지 유연하게 설계할 수 있습니다.

### 1.3. 범용 실행 환경 지원 (Web, Shell, Daemon)

Aspectran은 웹 전용 프레임워크가 아닌 범용 프레임워크입니다. Translet은 HTTP 서블릿 환경(`Mode.WEB`)뿐만 아니라, 대화형 CLI 명령을 처리하는 쉘 환경(`Mode.SHELL`), 백그라운드 주기적 배치 및 서비스를 실행하는 데몬 환경(`Mode.DAEMON`)에서도 동일한 추상화 모델로 일관되게 동작합니다.

## 2. Translet은 어떻게 찾아지고 실행되는가?

애플리케이션이 시작될 때, Aspectran은 정의된 모든 Translet 규칙을 파싱하여 **`TransletRuleRegistry`**라는 중앙 저장소에 등록합니다.

사용자의 요청이 들어오면, `Activity`는 이 레지스트리에서 가장 적합한 Translet 규칙(설계도)을 찾아냅니다. Aspectran은 명확한 우선순위에 따라 규칙을 검색하여 항상 가장 구체적인 규칙이 먼저 선택되도록 보장합니다.

1.  **요청 이름 (Request Name)**: `/user/info`와 같이 정확히 일치하는 이름을 찾습니다.
2.  **요청 메소드 (Request Method)**: 웹 환경에서는 `GET`, `POST`, `PUT`, `DELETE` 등의 HTTP 메소드가 여기에 해당하며, 같은 요청 이름이라도 이 요청 메소드에 따라 다른 Translet을 실행할 수 있습니다.
3.  **와일드카드 및 경로 변수 패턴**: `/users/*`나 `/users/${userId}`와 같은 패턴을 지원하여 RESTful API를 매우 효율적으로 구현할 수 있습니다.

`Activity`는 찾아낸 Translet 규칙에 따라 실제 요청 처리 작업을 수행합니다. 즉, **Translet은 '설계도'이고 Activity는 그 설계도를 보고 일하는 '건설 인부'**와 같습니다.

### 검색 우선순위: 가장 구체적인 규칙이 먼저!

Translet을 찾을 때는 다음과 같은 우선순위가 적용됩니다.

1.  **완전 일치 (Exact Match)가 최우선**: 와일드카드(`*`)나 경로 변수(`${...}`)가 없는, 이름이 완전히 일치하는 규칙이 가장 먼저 선택됩니다.
2.  **더 구체적인 패턴이 우선**: 여러 와일드카드 패턴이 일치할 경우, 더 구체적인 패턴을 가진 규칙이 우선권을 갖습니다.
    -   **예시**: `GET /users/info` 요청이 들어왔을 때, `/users/*` 규칙과 `/users/info` 규칙이 모두 존재한다면, 더 구체적인 `/users/info` 규칙이 선택됩니다. 마찬가지로, `/users/${userId}/profile` 패턴은 `/users/${userId}/*` 패턴보다 더 구체적이므로 우선 선택됩니다.
3.  **GET이 아닌 요청의 대체(Fallback) 규칙**: `POST`, `PUT` 등의 요청에 대해 정확히 일치하는 규칙이 없다면, Aspectran은 메소드가 지정되지 않은(암묵적 `GET`) 규칙을 차선책으로 찾습니다.
    -   **예시**: `POST /users` 요청이 들어왔는데 `method="post"`로 명시된 `/users` 규칙이 없고, 메소드 지정 없이 정의된 `<translet name="/users">...</translet>` 규칙만 있다면, 이 규칙이 선택되어 처리됩니다.
4.  **나중에 정의된 규칙이 우선 (규칙 덮어쓰기)**: 만약 동일한 요청 이름과 메소드를 가진 Translet 규칙이 여러 번 정의되면, **가장 나중에 정의(등록)된 규칙**이 이전에 정의된 규칙을 덮어쓰고 최종적으로 사용됩니다. 이는 Aspectran 설정 파일이 여러 개로 분리되어 있거나, include 기능으로 다른 파일의 설정을 가져올 때 특정 규칙을 오버라이드(override)하는 용도로 유용하게 사용될 수 있습니다.

이러한 우선순위 덕분에 개발자는 일반적인 경우를 처리하는 규칙과 특정 경우를 처리하는 규칙을 함께 정의하여 코드를 유연하고 직관적으로 관리할 수 있습니다.

## 3. 동적 Translet 생성 (Scanning)

Aspectran의 가장 강력한 기능 중 하나는 **동적 Translet 생성**입니다. 예를 들어, 수백 개의 JSP 파일을 각각 다른 Translet으로 서빙해야 할 때, 수백 개의 `<translet>` 규칙을 반복해서 정의하는 대신, 다음과 같이 단 하나의 규칙만 정의할 수 있습니다.

```xml
<translet name="*" scan="/WEB-INF/jsp/**/*.jsp">
    <description>
        '/WEB-INF/jsp/' 디렉토리 하위 경로에서 모든 JSP 파일을 찾아서 Translet 등록을 자동으로 합니다.
        검색된 jsp 파일의 경로는 template 요소의 file 속성 값으로 지정됩니다.
    </description>
    <dispatch name="/"/>
</translet>
```

위 규칙은 `/WEB-INF/jsp/` 디렉터리와 그 하위 경로에 있는 모든 `.jsp` 파일을 스캔하여, 파일 경로에 따라 동적으로 Translet을 생성하고 등록합니다. 예를 들어, `/WEB-INF/jsp/user/list.jsp` 파일이 발견되면 `user/list`라는 이름의 Translet이 생성됩니다. 이 기능은 정적인 뷰 파일을 대량으로 서빙할 때 매우 유용하며, 반복적인 Translet 정의를 획기적으로 줄여줍니다.

## 4. 어노테이션 기반 Translet 정의: `@RequestTo*`

규칙 기반의 XML/APON 방식 외에도, Aspectran은 **어노테이션(Annotation)**을 사용하여 Java 코드 내에서 직접 Translet을 정의하는 현대적인 방법을 제공합니다. `@Component`로 선언된 빈(Bean) 클래스 내에서, `@RequestToGet`, `@RequestToPost`, `@RequestToPut`, `@RequestToDelete` 등 요청 메소드에 대응되는 어노테이션을 특정 메소드에 직접 붙이면, Aspectran은 해당 메소드를 핵심 액션으로 삼아 **암시적으로 Translet 규칙을 생성**합니다.

```java
package com.aspectran.demo;

import com.aspectran.core.activity.Translet;
import com.aspectran.core.component.bean.annotation.Autowired;
import com.aspectran.core.component.bean.annotation.Component;
import com.aspectran.core.component.bean.annotation.RequestToGet;
import com.aspectran.core.component.bean.annotation.Transform;
import com.aspectran.core.context.rule.type.FormatType;
import org.jspecify.annotations.NonNull;

@Component // 이 클래스가 빈(Bean)임을 나타냅니다.
public class UserApiController {

    private final UserDao userDao;

    @Autowired
    public UserApiController(UserDao userDao) {
        this.userDao = userDao;
    }

    // GET /user/info/${userId} 요청에 대한 Translet 규칙을 생성합니다.
    // 이 메소드는 Activity에 의해 실행되는 Action이 됩니다.
    @RequestToGet("/user/info/${userId}")
    @Transform(format = FormatType.JSON) // 결과를 JSON으로 변환합니다.
    public User getUserInfo(@NonNull Translet translet, long userId) { // (1)
        // 메소드의 반환값이 바로 응답 콘텐츠가 됩니다.
        return userDao.getUserById(userId);
    }
}
```

### 4.1. 파라미터 매핑 및 필수 인자 검증 (`@NonNull` 표준 채택)

위 예제 코드의 **(1)**을 보면, 경로 변수 `${userId}`는 이름이 동일한 `userId` 매개변수에 자동으로 타입 변환되어 주입됩니다. Aspectran은 별도의 어노테이션 없이도 매개변수 이름과 타입을 기반으로 경로 변수, 요청 파라미터, 빈 인스턴스를 지능적으로 주입합니다. 또한 메소드 인자에 `Translet` 타입을 선언하면 `Activity`가 현재 실행 중인 `Translet` 인스턴스를 주입해 줍니다.

> **💡 `@Required` 어노테이션의 Deprecation과 `@NonNull` 표준화**
> 
> 과거 Aspectran에서는 필수 의존성 및 non-null 매개변수를 명시하기 위해 자체 `@Required` 어노테이션(`com.aspectran.core.component.bean.annotation.Required`)을 사용했습니다.
> 
> 하지만 최신 Aspectran에서는 표준 사양을 준수하고 정적 분석 도구와의 호환성을 극대화하기 위해 `@Required`를 **`@Deprecated`** 처리하였으며, 현대적인 **JSpecify의 `@NonNull`(`org.jspecify.annotations.NonNull`)** 어노테이션을 표준으로 채택하여 필수 매개변수와 널 불허(Non-null) 조건을 명시하도록 권장합니다.

### 4.2. 비동기 요청 처리

시간이 오래 걸리는 작업을 처리해야 할 경우, `async` 속성을 `true`로 설정하여 Translet을 **비동기적으로 실행**하도록 `Activity`에 지시할 수 있습니다.

```java
@RequestToPost(
    path = "/reports/generate",
    async = true, // 비동기 실행을 활성화합니다.
    timeout = 30000L
)
@Transform(format = FormatType.TEXT)
public String generateReport(@NonNull Translet translet) {
    // 요청 본문을 Aspectran의 Parameters 객체로 파싱합니다.
    // Content-Type에 따라 JSON, XML 등이 자동으로 파싱됩니다.
    Parameters parameters = translet.getRequestAdapter().getBodyAsParameters();

    // 비즈니스 로직은 Parameters 객체를 직접 사용합니다.
    reportService.generate(parameters);

    return "Report generation has started in the background.";
}
```

## 5. Translet API 레퍼런스 및 활용 가이드

사용자 액션(Action) 메소드나 인터셉터에서 인자로 전달받은 `Translet` 인터페이스는 현재 요청-응답 트랜잭션의 모든 상태에 접근하고 실행 흐름을 제어할 수 있는 풍부한 API들을 제공합니다. 주요 기능을 그룹별로 분류하여 소개합니다.

### 5.1. 요청 메타데이터 및 실행 환경 정보

현재 요청의 URI, HTTP 메소드, 실행 모드, 인코딩 및 환경 설정을 조회합니다.

| 메소드 | 설명 |
| :--- | :--- |
| `Activity.Mode getMode()` | 현재 실행 모드(`WEB`, `SHELL`, `DAEMON` 등)를 반환합니다. |
| `String getContextPath()` | 애플리케이션의 컨텍스트 경로(Context Path)를 반환합니다. |
| `String getRequestName()` | 컨텍스트 경로를 제외한 요청 이름(예: `/users/123`)을 반환합니다. |
| `String getActualRequestName()` | 클라이언트 관점의 실제 전체 요청 경로(예: `/myapp/users/123`)를 반환합니다. |
| `MethodType getRequestMethod()` | 현재 요청의 메소드(`GET`, `POST`, `PUT`, `DELETE` 등)를 반환합니다. |
| `String getTransletName()` | 현재 실행 중인 Translet 규칙의 이름(패턴)을 반환합니다. |
| `String getDescription()` | Translet 규칙에 정의된 설명(Description)을 반환합니다. |
| `Environment getEnvironment()` | 현재 액티비티 컨텍스트의 `Environment` 객체를 반환합니다. |
| `ApplicationAdapter getApplicationAdapter()` | 애플리케이션 레벨 자원에 접근하는 `ApplicationAdapter`를 반환합니다. |
| `String getDefinitiveRequestEncoding()` | 요청 본문 디코딩에 사용된 최종 문자 인코딩을 반환합니다. |
| `String getDefinitiveResponseEncoding()` | 응답 생성에 사용될 최종 문자 인코딩을 반환합니다. |

```java
public void logRequestInfo(@NonNull Translet translet) {
    Activity.Mode mode = translet.getMode();
    String transletName = translet.getTransletName();
    MethodType method = translet.getRequestMethod();
    String requestName = translet.getRequestName();

    System.out.printf("[%s] %s %s (Matched Rule: %s)%n", mode, method, requestName, transletName);
}
```

### 5.2. 어댑터 및 네이티브 객체 접근 (Adapters & Adaptees)

Aspectran은 특정 플랫폼에 종속되지 않도록 요청/응답/세션을 `Adapter`로 추상화합니다. 필요 시 서블릿 등의 네이티브 객체(Adaptee)에도 안전하게 접근할 수 있습니다.

| 메소드 | 설명 |
| :--- | :--- |
| `RequestAdapter getRequestAdapter()` | 요청 데이터 및 헤더 등에 접근하는 `RequestAdapter`를 반환합니다. |
| `ResponseAdapter getResponseAdapter()` | 응답 헤더, 상태 코드 등을 제어하는 `ResponseAdapter`를 반환합니다. |
| `boolean hasSessionAdapter()` | 세션 어댑터가 활성화되어 있는지 여부를 확인합니다. |
| `SessionAdapter getSessionAdapter()` | 세션에 접근하고 제어하는 `SessionAdapter`를 반환합니다. |
| `<V> V getRequestAdaptee()` | 기저 플랫폼의 네이티브 요청 객체(예: `HttpServletRequest`)를 반환합니다. |
| `<V> V getResponseAdaptee()` | 기저 플랫폼의 네이티브 응답 객체(예: `HttpServletResponse`)를 반환합니다. |
| `<V> V getSessionAdaptee()` | 기저 플랫폼의 네이티브 세션 객체(예: `HttpSession`)를 반환합니다. |

```java
public void handleAdapters(@NonNull Translet translet) {
    // Aspectran의 추상화된 어댑터 사용
    RequestAdapter requestAdapter = translet.getRequestAdapter();
    String userAgent = requestAdapter.getHeader("User-Agent");

    // 세션 어댑터 사용
    if (translet.hasSessionAdapter()) {
        SessionAdapter sessionAdapter = translet.getSessionAdapter();
        sessionAdapter.setAttribute("LAST_ACCESS", System.currentTimeMillis());
    }

    // 웹 환경인 경우 네이티브 서블릿 객체 직접 활용
    if (translet.getMode() == Activity.Mode.WEB) {
        HttpServletRequest req = translet.getRequestAdaptee();
        String remoteAddr = req.getRemoteAddr();
    }
}
```

### 5.3. 요청 파라미터 및 파일 업로드 처리

클라이언트가 전송한 쿼리 파라미터, 폼 데이터, 업로드 파일(`FileParameter`)을 조회하고 수정합니다.

| 메소드 | 설명 |
| :--- | :--- |
| `String getParameter(String name)` | 단일 파라미터 값을 반환합니다. |
| `String[] getParameterValues(String name)` | 다중 값 파라미터의 문자열 배열을 반환합니다. |
| `Collection<String> getParameterNames()` | 전체 파라미터 이름 목록을 반환합니다. |
| `Map<String, Object> getAllParameters()` | 모든 파라미터가 담긴 변경 가능한 맵을 반환합니다. |
| `void setParameter(String name, String value)` | 파라미터 값을 동적으로 설정하거나 덮어씁니다. |
| `void copyParametersTo(Map<String, Object> target)` | 모든 파라미터를 주어진 Map 객체로 복사합니다. |
| `FileParameter getFileParameter(String name)` | 업로드된 단일 파일 객체(`FileParameter`)를 반환합니다. |
| `FileParameter[] getFileParameterValues(String name)`| 다중 업로드 파일 배열을 반환합니다. |
| `Collection<String> getFileParameterNames()` | 업로드된 파일 파라미터 이름 목록을 반환합니다. |
| `void removeFileParameter(String name)` | 특정 파일 파라미터를 제거합니다. |
| `boolean hasPathVariables()` | URI 경로 변수(`${...}`)가 존재하는지 여부를 확인합니다. |

```java
public void processUpload(@NonNull Translet translet) throws IOException {
    String title = translet.getParameter("title");
    FileParameter uploadFile = translet.getFileParameter("attachment");

    if (uploadFile != null && !uploadFile.isEmpty()) {
        String fileName = uploadFile.getFileName();
        long fileSize = uploadFile.getFileSize();
        // 업로드 파일 저장
        uploadFile.saveAs(new File("/uploads/" + fileName));
    }
}
```

### 5.4. 요청 속성(Attribute) 및 플래시 맵(FlashMap)

요청 처리 과정에서 액션 간 또는 뷰(View) 템플릿으로 데이터를 전달할 때 사용하는 Request Scope 속성과, 리다이렉트 시 1회성 데이터 전달을 위한 FlashMap을 관리합니다.

| 메소드 | 설명 |
| :--- | :--- |
| `<V> V getAttribute(String name)` | 요청 스코프에 저장된 속성 값을 가져옵니다. |
| `void setAttribute(String name, Object value)` | 요청 스코프에 속성 값을 저장합니다. |
| `Collection<String> getAttributeNames()` | 요청 스코프의 모든 속성 이름 목록을 반환합니다. |
| `void removeAttribute(String name)` | 요청 스코프의 특정 속성을 제거합니다. |
| `void copyAttributesTo(Map<String, Object> target)` | 모든 요청 속성을 주어진 Map 객체로 복사합니다. |
| `boolean hasInputFlashMap()` | 이전 요청(리다이렉트 전)으로부터 전달된 FlashMap이 존재하는지 확인합니다. |
| `Map<String, ?> getInputFlashMap()` | 이전 요청에서 전달된 FlashMap 데이터를 반환합니다. |
| `boolean hasOutputFlashMap()` | 다음 요청으로 전달할 FlashMap이 활성화되어 있는지 확인합니다. |
| `FlashMap getOutputFlashMap()` | 다음 요청으로 전달할 데이터를 담을 `FlashMap` 인스턴스를 반환합니다. |

```java
public void handleFlashAndAttributes(@NonNull Translet translet) {
    // 1. 뷰 템플릿(JSP, Thymeleaf 등)으로 전달할 모델 속성 설정
    translet.setAttribute("currentMenu", "admin");

    // 2. 리다이렉트 후 1회성 알림 메시지 전달을 위한 FlashMap 활용
    FlashMap flashMap = translet.getOutputFlashMap();
    flashMap.put("successMessage", "회원 가입이 성공적으로 완료되었습니다.");

    // 3. 리다이렉트 수행
    translet.redirect("/user/welcome");
}
```

### 5.5. 액션 실행 결과 및 프로세스 결과 (ProcessResult)

Translet 규칙에 정의된 여러 액션(Action)들이 실행되면, 그 결과는 `ProcessResult` 컨테이너에 저장됩니다.

| 메소드 | 설명 |
| :--- | :--- |
| `ProcessResult getProcessResult()` | 현재까지 실행된 액션들의 결과 컨테이너를 반환합니다. |
| `Object getProcessResult(String actionId)` | 특정 액션 ID에 해당하는 실행 결과 객체를 반환합니다. |
| `void setProcessResult(ProcessResult result)` | 프로세스 결과 컨테이너를 직접 교체합니다. |
| `ActivityData getActivityData()` | 액티비티와 관련된 전반적인 데이터를 포괄하는 `ActivityData`를 반환합니다. |
| `String getWrittenResponse()` | 현재까지 응답 버퍼에 기록된 문자열을 반환합니다. |

```java
public void inspectActionResult(@NonNull Translet translet) {
    // 이전 액션('createOrder')이 생성한 데이터 조회
    Object orderResult = translet.getProcessResult("createOrder");
    if (orderResult instanceof Order order) {
        System.out.println("생성된 주문 번호: " + order.getOrderId());
    }
}
```

### 5.6. 흐름 제어 및 응답 처리 (Dispatch, Forward, Redirect, Transform)

Translet 내에서 동적으로 뷰 템플릿을 디스패치하거나, 내부 포워드, 클라이언트 리다이렉트, 즉시 데이터 변환 등의 흐름을 프로그래밍 방식으로 제어합니다.

| 메소드 | 설명 |
| :--- | :--- |
| `void dispatch(String name)` | 지정된 뷰 템플릿(JSP, Thymeleaf 템플릿 등)으로 디스패치합니다. |
| `void dispatch(String name, String dispatcherName)` | 특정 디스패처 빈을 지정하여 뷰로 디스패치합니다. |
| `void dispatch(DispatchRule dispatchRule)` | 선언적 `DispatchRule` 규칙에 따라 디스패치합니다. |
| `void forward(String transletName)` | 요청을 내부의 다른 Translet으로 포워딩합니다. |
| `void forward(ForwardRule forwardRule)` | 선언적 `ForwardRule` 규칙에 따라 포워딩합니다. |
| `void redirect(String path)` | 지정된 URL 경로로 클라이언트 리다이렉트를 수행합니다. |
| `void redirect(String path, Map<String, String> params)` | 쿼리 파라미터를 추가하여 클라이언트 리다이렉트를 수행합니다. |
| `void redirect(RedirectRule redirectRule)` | 선언적 `RedirectRule` 규칙에 따라 리다이렉트합니다. |
| `void transform(TransformRule transformRule)` | 변환 규칙에 따라 콘텐츠를 즉시 변환(JSON, XML 등)하여 응답합니다. |
| `void transform(CustomTransformer transformer)` | 커스텀 트랜스포머를 사용하여 즉시 변환 응답합니다. |
| `void response()` | 현재까지 구성된 응답을 즉시 클라이언트로 전송하고 처리를 종료합니다. |
| `void response(Response response)` | 지정된 응답 규칙을 즉시 실행하고 처리를 종료합니다. |
| `Response getDeclaredResponse()` | Translet 규칙에 원래 선언되어 있던 응답 정의를 반환합니다. |
| `boolean isResponseReserved()` | 리다이렉트, 포워드, 변환 등 응답 처리가 이미 예약/수행되었는지 확인합니다. |

```java
public void dynamicFlowControl(@NonNull Translet translet) {
    boolean isAdmin = checkAdminRole(translet);

    if (!isAdmin) {
        // 권한이 없으면 로그인 페이지로 파라미터와 함께 리다이렉트
        translet.redirect("/login", Map.of("error", "unauthorized"));
        return;
    }

    // 조건에 따라 뷰 템플릿 동적 디스패치
    if ("compact".equals(translet.getParameter("mode"))) {
        translet.dispatch("dashboard/compactView");
    } else {
        translet.dispatch("dashboard/fullView");
    }
}
```

### 5.7. 빈(Bean) 검색 및 환경 프로퍼티 조회

Aspectran IoC 컨테이너에 등록된 빈 인스턴스를 가져오거나 환경 변수 및 설정을 조회합니다.

| 메소드 | 설명 |
| :--- | :--- |
| `<V> V getBean(String id)` | Bean ID로 빈 인스턴스를 검색하여 반환합니다. |
| `<V> V getBean(Class<V> type)` | 타입(클래스/인터페이스)으로 빈 인스턴스를 검색하여 반환합니다. |
| `<V> V getBean(Class<V> type, String id)` | 타입과 ID를 모두 지정하여 빈 인스턴스를 반환합니다. |
| `boolean containsBean(String id)` | 해당 ID의 빈이 컨테이너에 존재하는지 확인합니다. |
| `boolean containsBean(Class<?> type)` | 해당 타입의 빈이 존재하는지 확인합니다. |
| `<V> V getProperty(String name)` | 환경 프로퍼티(`%{...}`) 값을 조회합니다. |
| `<V> V getSetting(String settingName)` | Translet 스코프에 정의된 설정값을 조회합니다. |

```java
public void loadServiceDynamically(@NonNull Translet translet) {
    // 컨테이너에서 빈 동적 획득
    MailService mailService = translet.getBean(MailService.class);
    
    // 환경 설정 프로퍼티 조회
    String adminEmail = translet.getProperty("app.admin.email");
    mailService.sendNotification(adminEmail, "서비스 작업 완료");
}
```

### 5.8. AsEL(Aspectran Expression Language) 표현식 동적 평가

Aspectran 고유의 강력한 표현식 언어(AsEL)와 OGNL 엔진을 활용하여 표현식을 런타임에 동적으로 평가합니다.

| 메소드 | 설명 |
| :--- | :--- |
| `<V> V evaluate(String expression)` | AsEL 문자열 표현식을 평가하여 결과를 반환합니다. |
| `<V> V evaluate(String expression, Class<V> type)` | 표현식을 평가한 후 지정된 타입으로 변환하여 반환합니다. |
| `<V> V evaluate(Token[] tokens)` | 사전 파싱된 토큰 배열을 평가합니다. |

```java
public void evaluateExpressions(@NonNull Translet translet) {
    // 요청 파라미터 토큰과 환경 프로퍼티 표현식 평가
    String greeting = translet.evaluate("Hello, ${param.userName}! Server port is %{server.port}.");

    // OGNL 객체 그래프 탐색 및 수식 계산
    Integer calculated = translet.evaluate("@{totalPrice} * (100 - @{discountRate}) / 100", Integer.class);
}
```

### 5.9. 국제화(i18n) 다국어 메시지 처리

등록된 MessageSource로부터 클라이언트 로케일에 맞는 다국어 메시지를 편리하게 가져옵니다.

| 메소드 | 설명 |
| :--- | :--- |
| `String getMessage(String code)` | 메시지 코드로 다국어 메시지를 조회합니다. |
| `String getMessage(String code, Object[] args)` | 가변 인자(인자 배열)를 포맷팅하여 메시지를 조회합니다. |
| `String getMessage(String code, String defaultMessage)` | 메시지가 없을 경우 기본 메시지를 반환합니다. |
| `String getMessage(String code, Object[] args, String defaultMessage)` | 인자 포맷팅 및 기본 메시지를 지정하여 조회합니다. |
| `String getMessage(String code, Locale locale)` | 특정 로케일을 직접 지정하여 메시지를 조회합니다. |
| `String getMessage(String code, Object[] args, Locale locale)` | 특정 로케일과 인자를 지정하여 메시지를 조회합니다. |
| `String getMessage(String code, Object[] args, String defaultMessage, Locale locale)` | 모든 조건(인자, 기본값, 로케일)을 지정하여 조회합니다. |

```java
public String getWelcomeMessage(@NonNull Translet translet) {
    String userName = translet.getParameter("name");
    // 메시지 번들의 "user.welcome" 코드를 조회하고 {0}에 userName 전달
    return translet.getMessage("user.welcome", new Object[] { userName }, "반갑습니다, {0}님!");
}
```

### 5.10. AOP 어드바이스 결과 조회

Translet 실행 전후로 적용된 Aspect의 각 Advice(Before, After, Around, Finally) 실행 결과를 가져옵니다.

| 메소드 | 설명 |
| :--- | :--- |
| `<V> V getAdviceBean(String aspectId)` | Aspect ID에 해당하는 Advice 빈 인스턴스를 조회합니다. |
| `<V> V getBeforeAdviceResult(String aspectId)` | `Before` 어드바이스의 실행 결과를 반환합니다. |
| `<V> V getAfterAdviceResult(String aspectId)` | `After` 어드바이스의 실행 결과를 반환합니다. |
| `<V> V getAroundAdviceResult(String aspectId)` | `Around` 어드바이스의 실행 결과를 반환합니다. |
| `<V> V getFinallyAdviceResult(String aspectId)` | `Finally` 어드바이스의 실행 결과를 반환합니다. |

```java
public void inspectSecurityAspect(@NonNull Translet translet) {
    // 보안 Aspect('jwtAuthAspect')의 Before 어드바이스가 반환한 인증 사용자 정보 획득
    Principal principal = translet.getBeforeAdviceResult("jwtAuthAspect");
    if (principal != null) {
        System.out.println("인증된 사용자: " + principal.getName());
    }
}
```

### 5.11. 예외(Exception) 확인 및 제어

요청 처리 도중 발생한 예외를 확인하고 근본 원인을 추적하거나 예외 상태를 관리합니다.

| 메소드 | 설명 |
| :--- | :--- |
| `boolean isExceptionRaised()` | 현재 액티비티 처리 중 예외가 발생했는지 여부를 반환합니다. |
| `Throwable getRaisedException()` | 발생한 예외(`Throwable`) 객체를 반환합니다. |
| `Throwable getRootCauseOfRaisedException()` | 발생한 예외의 가장 깊은 근본 원인(Root Cause)을 반환합니다. |
| `void removeRaisedException()` | 저장된 예외 객체를 제거하여 정상 흐름으로 복구합니다. |

```java
public void handleActivityError(@NonNull Translet translet) {
    if (translet.isExceptionRaised()) {
        Throwable rootCause = translet.getRootCauseOfRaisedException();
        System.err.println("오류 발생 원인: " + rootCause.getMessage());
    }
}
```

## 6. 결론: Translet의 진정한 역할 - '설계도와 인터페이스'

Translet을 한마디로 정의하면 **`Activity` 실행 엔진의 '퍼사드(Facade)'**이자 사용자를 위한 **'대표 인터페이스'**라고 할 수 있습니다. 사용자가 보는 관점과 프레임워크 내부에서의 실제 역할이 구분되기 때문입니다.

*   **사용자의 관점**: Translet은 명확한 요청 처리 단위입니다. 개발자는 특정 요청 경로(`path`)에 Translet을 매핑하고, 그 안에 실행할 액션과 응답 방식을 정의합니다. 이처럼 사용자는 Translet을 통해 애플리케이션의 동작을 설계하고 제어합니다.
*   **프레임워크 내부의 관점**: Translet 규칙은 요청을 직접적으로 처리하지 않는 **'설계도'**에 불과합니다. 실제 모든 처리 작업(액션 실행, 규칙 해석, AOP 적용, 인코딩 설정 등)은 **`Activity`라는 실행 엔진**의 몫입니다.
*   **소통을 위한 인터페이스**: `Activity`는 요청을 처리하는 동안 요청 스코프의 `Translet` 인스턴스를 생성하여 Action 메소드나 Advice에 전달합니다. 사용자 코드는 이 `Translet` 인스턴스가 제공하는 풍부한 API를 통해 요청 데이터 조회, 플래시 맵 활용, 뷰 디스패치 및 리다이렉트 제어, i18n 메시지 조회 등을 직관적으로 수행할 수 있습니다.

이처럼 Translet은 복잡한 내부 실행 로직(`Activity`)을 감추고 사용자에게는 명확하고 단순한 '설계도'와 강력한 '인터페이스'만을 보여줍니다. 이러한 역할 덕분에 개발자는 내부의 복잡한 동작을 몰라도 웹, 쉘, 데몬 등 다양한 환경에서 동작하는 고품질 애플리케이션을 쉽고 유연하게 설계하고 확장해 나갈 수 있습니다.
