---
title: Aspectran의 표준 REST 응답 처리 가이드
subheadline: 실용 가이드
---

Aspectran은 RESTful 웹 서비스를 구축할 때 응답의 일관성을 유지하고, 개발자가 HTTP 상태 코드, 헤더, 데이터 변환을 직관적이고 세밀하게 제어할 수 있도록 표준화된 응답 모델을 제공합니다. 이 가이드는 `RestResponse`와 그 구현체들을 활용하여 Aspectran의 표준 규격에 맞는 API를 설계하는 모든 방법을 상세히 다룹니다.

## 1. 핵심 개념 (Core Concepts)

Aspectran의 REST 응답 처리는 단순히 원시 데이터를 반환하는 것을 넘어, 응답의 성공 여부(`success`), 데이터 페이로드(`data`), 에러 정보(`error`)를 하나의 표준 규격으로 캡슐화하여 클라이언트와 일관되게 소통하는 것을 지향합니다.

### 1.1 응답 컨테이너: ResponsePayload
모든 표준 REST 응답(`SuccessResponse`, `FailureResponse`)은 내부적으로 `com.aspectran.web.support.rest.response.ResponsePayload` 객체에 담겨 전달됩니다. 이 객체는 클라이언트가 응답을 일관되게 처리할 수 있도록 다음과 같은 표준 구조를 가집니다.

*   **success**: 작업의 성공 여부를 나타내는 불리언(`boolean`) 값입니다. (필수 포함)
*   **data**: 작업 결과로 클라이언트에 전달할 실제 데이터 객체(`Object`)입니다.
    *   성공 응답(`success: true`): `data`가 `null`이 아니면 직렬화에 포함되며, `null`인 경우 `data` 필드가 생략되어 `{"success": true}`만 반환됩니다.
    *   실패 응답(`success: false`): 데이터가 필요한 특수한 경우(예: 부분 성공 결과나 디버깅 메타데이터)에만 포함됩니다.
*   **error**: 작업이 실패했을 때 에러의 상세 정보를 담는 `ErrorPayload` 객체입니다.
    *   `code`: 에러를 식별할 수 있는 고유 코드 (`String`, 필수)
    *   `message`: 에러에 대한 상세 설명 메시지 (`String`, 선택)

`ResponsePayload.toEntity()` 메서드는 불필요한 `null` 필드 직렬화를 방지하고 깔끔한 JSON/APON/XML 구조를 생성하도록 다음과 같은 조건부 맵 엔티티를 구성합니다.

| 응답 상황 | success | data 필드 | error 필드 | 생성되는 페이로드 예시 (JSON) |
| :--- | :--- | :--- | :--- | :--- |
| **성공 (데이터 있음)** | `true` | 포함 (`Object`) | 생략 | `{"success": true, "data": {...}}` |
| **성공 (데이터 없음)** | `true` | 생략 | 생략 | `{"success": true}` |
| **실패 (에러 코드/메시지)** | `false` | 생략 (기본) | 포함 (`ErrorPayload`) | `{"success": false, "error": {"code": "...", "message": "..."}}` |
| **실패 (데이터+에러)** | `false` | 포함 (`Object`) | 포함 (`ErrorPayload`) | `{"success": false, "data": {...}, "error": {...}}` |

### 1.2 표준 클래스 계층 구조
Aspectran의 REST 응답 체계는 유연한 확장성과 일관된 변환 로직을 위해 다음과 같은 계층 구조로 설계되어 있습니다.

```
com.aspectran.core.activity.response.transform.CustomTransformer (Interface)
 └─ com.aspectran.web.activity.response.RestResponse (Interface)
     └─ com.aspectran.web.activity.response.AbstractRestResponse (Abstract Class)
         └─ com.aspectran.web.activity.response.DefaultRestResponse (Class)
             ├─ com.aspectran.web.support.rest.response.SuccessResponse (Class)
             └─ com.aspectran.web.support.rest.response.FailureResponse (Class)
```

*   **RestResponse**: RESTful HTTP 응답을 조작하기 위한 Fluent API 규격을 정의하는 핵심 인터페이스입니다. `CustomTransformer`를 상속하여 Aspectran의 자체 변환(Self-Transformation) 메커니즘과 완벽하게 통합됩니다.
*   **AbstractRestResponse**: 상태 코드, 헤더 맵, 미디어 타입, 지능형 콘텐츠 협상 알고리즘(`determineAcceptContentType`)의 공통 기능을 구현한 추상 클래스입니다.
*   **DefaultRestResponse**: JSON, APON, XML, Plain Text, HTML 형식으로의 직렬화 로직을 내장한 기본 구현체입니다. `ResponsePayload`를 전달받으면 `toEntity()`를 호출하여 표준 구조로 자동 변환합니다.
*   **SuccessResponse**: 2xx 상태 코드와 함께 성공적인 결과를 반환할 때 사용합니다. 내부적으로 `ResponsePayload(true, data)`를 생성하며, 기본 상태 코드는 `200 OK`입니다.
*   **FailureResponse**: 4xx 또는 5xx 상태 코드와 함께 실패 원인을 반환할 때 사용합니다. 내부적으로 `ResponsePayload(false)` 및 `ErrorPayload`를 생성하며, 체이닝 메서드로 에러 코드와 메시지를 설정할 수 있습니다.

## 2. 응답 적용 방식 (How to Apply)

Aspectran에서 `RestResponse`를 사용하여 클라이언트에게 응답을 전달하는 방식은 크게 두 가지가 있습니다.

### 2.1 액션 메서드의 리턴값으로 사용 (추천)
가장 권장되는 방식으로, 액션 메서드의 리턴 타입을 `RestResponse` (또는 `SuccessResponse`, `FailureResponse`)로 지정합니다.

**핵심 특징: 자동 변환 (Self-Transformation)**
`RestResponse`는 `CustomTransformer` 인터페이스를 구현하고 있습니다. Aspectran 엔진은 액션의 결과값이 `CustomTransformer` 타입인 경우, 별도의 `@Transform` 어노테이션이나 XML의 `<transform>` 설정이 없더라도 **객체 스스로가 정의한 변환 로직(`transform(Activity)`)을 실행**합니다. 즉, 응답 포맷 결정과 직렬화 로직을 프레임워크가 아닌 응답 객체에게 완전히 위임합니다.

```java
@Request("/api/data")
// 별도의 @Transform이나 @Dispatch 설정이 필요 없음!
public RestResponse getData() {
    return new SuccessResponse(dataService.findAll());
}
```

### 2.2 Translet을 통한 명시적 변환
메서드의 리턴 타입이 `void`이거나, Aspect(Interceptor, Advice)와 같이 리턴값을 통해 응답을 직접 제어하기 어려운 환경에서는 `translet.transform(RestResponse)` 메서드를 호출합니다. 호출 즉시 해당 응답 객체를 사용하여 변환 및 응답 프로세스가 진행됩니다.

```java
@Before
public void checkAuth(Translet translet) {
    if (!isAuthenticated()) {
        // 즉시 403 Forbidden 에러 응답으로 변환 프로세스 실행
        translet.transform(new FailureResponse().forbidden().setError("FORBIDDEN", "인증이 필요합니다."));
    }
}
```

## 3. 지원되는 컨텐츠 타입 (Supported Content Types)

Aspectran의 `DefaultRestResponse`는 별도의 서드파티 라이브러리 설정 없이도 클라이언트의 요구에 맞춰 데이터를 다양한 미디어 타입으로 자동 변환(Transformation)합니다.

| 미디어 타입 (Media Type) | 확장자 (Extension) | 설명 |
| :--- | :--- | :--- |
| `application/json` | `.json` | 가장 널리 쓰이는 표준 JSON 형식 (`JsonWriter`, JSONP callback 지원) |
| `application/apon` | `.apon` | Aspectran 고유의 객체 표기법 (APON, 간결한 텍스트 기반 객체 포맷) |
| `application/xml` | `.xml` | 표준 XML 형식 (`XmlTransformResponse`, `name` 지정 시 루트 태그 적용) |
| `text/plain` | `.txt` | 데이터의 문자열 표현(ToString) 출력 |
| `text/html` | `.html`, `.htm` | HTML 형식의 문자열 출력 |

### 컨텐츠 결정 우선순위 (지능형 콘텐츠 협상 알고리즘)
`AbstractRestResponse.determineAcceptContentType(Activity)`는 다음과 같은 4단계 우선순위로 최적의 미디어 타입을 결정합니다.

1.  **URL 경로 확장자 (`favorPathExtension`)**:
    *   요청 경로 끝에 `.json`, `.xml`, `.apon`, `.txt`, `.html`, `.htm` 등이 명시되어 있으면 해당 미디어 타입을 최우선으로 선택합니다. (기본값: `true`)
    *   알 수 없는 확장자가 요청되고 `ignoreUnknownPathExtensions`가 `false`인 경우 `406 Not Acceptable` 에러를 발생시킵니다.
2.  **HTTP Accept 헤더 (`ignoreAcceptHeader`)**:
    *   확장자가 없거나 확장자로 타입을 결정하지 못한 경우, 클라이언트가 전송한 `Accept` 헤더의 우선순위(Quality Value 등)를 분석하여 서버가 지원하는 미디어 타입 목록(`supportedContentTypes`)과 매칭합니다.
3.  **기본 미디어 타입 (`defaultContentType`)**:
    *   `Accept` 헤더가 `*/*`이거나 매칭되는 미디어 타입이 없을 때, 인스턴스에 설정된 `defaultContentType` 또는 Translet 설정 키 `response.defaultContentType` (`RestResponse.RESPONSE_DEFAULT_CONTENT_TYPE`)에 정의된 기본값을 사용합니다.
4.  **406 Not Acceptable**:
    *   위 모든 단계에서 적합한 미디어 타입을 찾지 못한 경우, HTTP 상태 코드 `406 Not Acceptable`을 반환합니다.

## 4. HTTP 응답 상태 코드 제어 (Fluent API)

`AbstractRestResponse`는 HTTP 상태 코드를 직관적으로 설정할 수 있는 다양한 메서드를 제공합니다. 이 메서드들은 **메서드 체이닝(Method Chaining)**을 지원하여 코드를 간결하고 가독성 높게 작성할 수 있도록 돕습니다.

### 4.1 성공 응답 (2xx Success)
*   `ok()`: **200 OK**. 요청이 성공적으로 처리되었음을 나타냅니다. (기본값)
*   `created()`: **201 Created**. 새 리소스가 성공적으로 생성되었음을 나타냅니다.
*   `created(String location)`: **201 Created**. 생성된 리소스의 URI를 `Location` 응답 헤더에 자동으로 추가합니다.
*   `accepted()`: **202 Accepted**. 요청이 접수되었으나 처리가 아직 완료되지 않았음을 나타냅니다.
*   `noContent()`: **204 No Content**. 성공했으나 응답 바디에 보낼 데이터가 없음을 나타냅니다.

### 4.2 리다이렉션 (3xx Redirection)
*   `movedPermanently()`: **301 Moved Permanently**. 리소스의 URI가 영구적으로 변경되었음을 나타냅니다.
*   `seeOther()`: **303 See Other**. 요청한 리소스를 다른 URI에서 찾아야 함을 나타냅니다.
*   `notModified()`: **304 Not Modified**. 캐시된 리소스가 변경되지 않았음을 나타냅니다.
*   `temporaryRedirect()`: **307 Temporary Redirect**. 임시 리다이렉션을 나타냅니다.

### 4.3 클라이언트 오류 (4xx Client Errors)
*   `badRequest()`: **400 Bad Request**. 잘못된 파라미터나 요청 구문 오류를 나타냅니다.
*   `unauthorized()`: **401 Unauthorized**. 대상 리소스에 대한 유효한 인증 자격 증명이 없음을 나타냅니다.
*   `forbidden()`: **403 Forbidden**. 서버가 요청을 이해했으나 승인을 거부했음을 나타냅니다. (권한 부족 등)
*   `notFound()`: **404 Not Found**. 서버가 요청받은 리소스를 찾을 수 없음을 나타냅니다.
*   `methodNotAllowed()`: **405 Method Not Allowed**. 요청에 사용된 HTTP 메서드가 리소스에서 허용되지 않음을 나타냅니다.
*   `notAcceptable()`: **406 Not Acceptable**. 요청의 Accept 헤더에 맞는 응답 콘텐츠를 생성할 수 없음을 나타냅니다.
*   `conflict()`: **409 Conflict**. 서버의 현재 상태와 요청이 충돌했음을 나타냅니다.
*   `preconditionFailed()`: **412 Precondition Failed**. 대상 리소스에 대한 접근 사전 조건이 실패했음을 나타냅니다.
*   `unsupportedMediaType()`: **415 Unsupported Media Type**. 요청 페이로드의 미디어 타입이 지원되지 않음을 나타냅니다.

### 4.4 서버 오류 (5xx Server Errors)
*   `internalServerError()`: **500 Internal Server Error**. 서버 내부에서 예기치 못한 오류가 발생하여 요청을 수행할 수 없음을 나타냅니다.

### 4.5 일반 상태 코드 설정 메서드
*   `setStatus(int status)`: 정수형 HTTP 상태 코드를 직접 지정합니다.
*   `setStatus(HttpStatus status)`: `com.aspectran.web.support.http.HttpStatus` 열거형 상수를 지정합니다.
*   `getStatus()`: 현재 설정된 HTTP 상태 코드 정수값을 반환합니다.

## 5. 데이터, 헤더 및 직렬화 설정 메서드

상태 코드 외에도 응답의 세부적인 데이터와 직렬화 방식을 정밀하게 제어할 수 있는 메서드들이 제공됩니다.

*   `setData(Object data)`: 응답 페이로드의 `data` 필드에 들어갈 객체를 명시적으로 설정합니다.
*   `setData(String name, Object data)`: 데이터에 이름을 부여하여 루트 키로 사용합니다. 특히 XML로 변환할 때 최상위 엘리먼트 이름을 지정하거나, JSON 변환 시 루트 객체 감싸기에 유용합니다.
*   `setHeader(String name, String value)`: 특정 헤더 값을 설정합니다. 이미 존재하는 헤더라면 값을 덮어씁니다.
*   `addHeader(String name, String value)`: 특정 헤더에 값을 추가합니다. 동일한 이름의 헤더에 복수 개의 값을 추가할 때 유용합니다.
*   `prettyPrint(boolean prettyPrint)`: 응답 데이터(JSON, APON, XML)를 줄바꿈과 들여쓰기를 포함하여 읽기 좋은 형태로 포맷팅할지 여부를 설정합니다.
*   `nullWritable(boolean nullWritable)`: 데이터 객체를 직렬화할 때 `null` 값을 가진 필드도 출력 결과에 포함할지 여부를 설정합니다. (기본값: `false`)
*   `stringifyContext(StringifyContext stringifyContext)`: 직렬화 세부 옵션을 담고 있는 `StringifyContext`를 직접 지정합니다.
*   `defaultContentType(MediaType defaultContentType)`: 인스턴스별 기본 미디어 타입을 동적으로 지정합니다.
*   `favorPathExtension(boolean)` / `ignoreAcceptHeader(boolean)` / `ignoreUnknownPathExtensions(boolean)`: 콘텐츠 협상 옵션을 인스턴스별로 재정의합니다.

## 6. 실무 적용 예제 (Practical Examples)

Aspectran의 URL 패턴 매핑 구문인 `${...}`과 표준 응답 클래스를 활용한 실무 예제입니다.

### 예제 1: 기본적인 성공 응답 (200 OK)
조회된 엔티티나 DTO를 클라이언트에게 반환하는 가장 일반적인 케이스입니다.

```java
@Request("/api/user/${userId}")
public RestResponse getUser(String userId) {
    User user = userService.getUserById(userId);
    if (user == null) {
        return new FailureResponse()
                .notFound()
                .setError("USER_NOT_FOUND", "사용자를 찾을 수 없습니다: " + userId);
    }

    // 200 OK 상태 코드와 함께 데이터를 표준 ResponsePayload로 캡슐화하여 반환
    return new SuccessResponse(user);
}
```

**응답 데이터 샘플 (JSON):**
```json
{
  "success": true,
  "data": {
    "userId": "user-01",
    "username": "aspectran",
    "email": "user@aspectran.com"
  }
}
```

**응답 데이터 샘플 (APON - /api/user/user-01.apon 요청 시):**
```apon
success: true
data: {
  userId: user-01
  username: aspectran
  email: user@aspectran.com
}
```

**응답 데이터 샘플 (XML - /api/user/user-01.xml 요청 시):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<response>
  <success>true</success>
  <data>
    <userId>user-01</userId>
    <username>aspectran</username>
    <email>user@aspectran.com</email>
  </data>
</response>
```

### 예제 2: 리소스 생성 및 Location 헤더 (201 Created)
새로운 데이터를 생성한 후, 클라이언트에게 생성된 리소스의 접근 URI를 `Location` 헤더와 함께 전달하는 케이스입니다.

```java
@RequestToPost("/api/orders")
public RestResponse createOrder(Order order) {
    orderService.placeOrder(order);

    // 201 Created 상태 코드를 설정하고 Location 헤더를 자동으로 추가
    return new SuccessResponse(order)
            .created("/api/orders/" + order.getId());
}
```

**응답 헤더 및 바디 샘플 (HTTP):**
```http
HTTP/1.1 201 Created
Location: /api/orders/ORD-1004
Content-Type: application/json;charset=UTF-8

{
  "success": true,
  "data": {
    "orderId": "ORD-1004",
    "item": "Aspectran Pro License",
    "status": "COMPLETED"
  }
}
```

### 예제 3: 유효성 검사 실패 및 에러 처리 (400 Bad Request)
클라이언트 입력값이 유효하지 않을 때 명확한 에러 코드와 사용자 친화적인 메시지를 함께 반환합니다.

```java
@RequestToPost("/api/register")
public RestResponse register(User user) {
    if (StringUtils.isEmpty(user.getEmail())) {
        return new FailureResponse()
                .badRequest() // HTTP 400 상태 코드 지정
                .setError("REQUIRED_FIELD", "이메일은 필수 항목입니다.");
    }

    userService.register(user);
    return new SuccessResponse("Registered successfully");
}
```

**응답 데이터 샘플 (JSON - 유효성 검사 실패 시):**
```json
{
  "success": false,
  "error": {
    "code": "REQUIRED_FIELD",
    "message": "이메일은 필수 항목입니다."
  }
}
```

### 예제 4: 권한 인증 및 접근 제어 (401 Unauthorized, 403 Forbidden)
API 엔드포인트에 대한 접근 권한을 검사하고 실패 시 사유를 알립니다.

```java
@Request("/api/admin/settings")
public RestResponse getAdminSettings(UserInfo userInfo) {
    if (userInfo == null) {
        // 로그인되지 않은 사용자 (401 Unauthorized)
        return new FailureResponse()
                .unauthorized()
                .setError("UNAUTHORIZED", "로그인이 필요합니다.");
    }
    if (!userInfo.hasRole("ADMIN")) {
        // 관리자 권한이 없는 사용자 (403 Forbidden)
        return new FailureResponse()
                .forbidden()
                .setError("ACCESS_DENIED", "관리자 권한이 필요합니다.");
    }

    return new SuccessResponse(configService.getAdminConfig());
}
```

**응답 데이터 샘플 (JSON - 권한 부족 시):**
```json
{
  "success": false,
  "error": {
    "code": "ACCESS_DENIED",
    "message": "관리자 권한이 필요합니다."
  }
}
```

### 예제 5: 응답 포맷팅 및 커스텀 헤더 제어
클라이언트나 개발자가 디버깅하기 쉽도록 데이터를 정렬 출력하고 캐시 방지 및 커스텀 메타데이터 헤더를 추가합니다.

```java
@Request("/api/system/stats")
public RestResponse getSystemStats() {
    Map<String, Object> stats = statsService.getGlobalStats();

    return new SuccessResponse(stats)
            .prettyPrint(true) // 줄바꿈과 들여쓰기를 포함한 가독성 높은 출력
            .nullWritable(false) // null 값 필드 생략
            .setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
            .addHeader("X-Node-Id", "node-01")
            .addHeader("X-Response-Time", String.valueOf(System.currentTimeMillis()));
}
```

### 예제 6: 백엔드 API Relay (RestRequest 활용)
`RestRequest` 클래스를 사용하여 외부 마이크로서비스나 내부 클러스터 노드의 REST API를 호출하고, 그 결과를 가공 없이 현재 서버의 응답으로 바로 중계(Relay)하는 패턴입니다. `RestRequest.retrieve()`는 원격 응답 상태에 따라 이미 `SuccessResponse` 또는 `FailureResponse`를 구성하여 반환하므로 완벽한 대칭성을 가집니다.

```java
@Request("/relay/weather")
public RestResponse relayWeatherRequest(CloseableHttpClient httpClient) {
    String targetUrl = "https://internal-api.example.com/weather/today";

    try {
        RestRequest restRequest = new RestRequest(httpClient);

        // RestRequest.retrieve() 호출 결과는 이미 SuccessResponse 또는 FailureResponse 형태임
        RestResponse response = restRequest.get()
                                           .url(targetUrl)
                                           .retrieve();

        // 반환받은 표준 응답 객체를 Translet의 응답으로 그대로 전달
        return response;
    } catch (IOException e) {
        return new FailureResponse()
                .internalServerError()
                .setError("RELAY_ERROR", "대상 원격 서버와 통신 중 오류가 발생했습니다: " + e.getMessage());
    }
}
```

### 예제 7: 전역 예외 처리(Exception Handling / Aspect)에서의 일관된 응답 변환
애플리케이션 전역에서 발생하는 예외를 Aspect나 Exception Rule에서 가로채어 표준 `FailureResponse`로 변환하면, 클라이언트에게 항상 일관된 형식의 에러 응답을 보장할 수 있습니다.

```java
@Component
@Aspect
public class GlobalRestExceptionAdvice {

    private static final Logger logger = LoggerFactory.getLogger(GlobalRestExceptionAdvice.class);

    @AfterThrown(target = "activity", thrown = "java.lang.IllegalArgumentException")
    public void handleIllegalArgument(Translet translet, Exception ex) {
        logger.warn("Invalid client argument: {}", ex.getMessage());

        RestResponse response = new FailureResponse()
                .badRequest()
                .setError("INVALID_PARAMETER", ex.getMessage());

        translet.transform(response);
    }

    @AfterThrown(target = "activity", thrown = "java.lang.Exception")
    public void handleGeneralException(Translet translet, Exception ex) {
        logger.error("Unhandled server exception occurred", ex);

        RestResponse response = new FailureResponse()
                .internalServerError()
                .setError("INTERNAL_SERVER_ERROR", "서버 내부 오류가 발생했습니다.");

        translet.transform(response);
    }

}
```

## 7. 모범 사례 및 권장 사항 (Best Practices)

1.  **Map 대신 표준 클래스 사용**: 응답 바디를 구성하기 위해 `Map.of("success", true, "data", ...)`를 임의로 작성하거나 DTO를 직접 만들어 `success` 필드를 채우는 방식은 피해야 합니다. 항상 `SuccessResponse`와 `FailureResponse`를 사용하여 `ResponsePayload` 표준 규격을 준수하십시오.
2.  **데이터가 없는 성공 응답의 간결성**: 삭제(Delete)나 단순 상태 변경 요청에서 응답 데이터가 필요 없을 때는 `new SuccessResponse()` 또는 `new SuccessResponse().noContent()`를 반환하여 클라이언트에게 불필요한 페이로드 전송을 최소화하십시오.
3.  **일관된 에러 코드 체계 구축**: `FailureResponse`에서 사용하는 에러 코드(`ErrorPayload.code`)는 프로젝트 전반에서 식별 가능하고 고유하도록 상수(Enum 또는 Static Constants)로 관리하는 것이 좋습니다.
4.  **프론트엔드 통신 규약 일치**: Aspectran 표준 응답을 수신하는 웹 프론트엔드나 클라이언트는 응답의 최상위 `success` 불리언 필드를 검사(`if (res.success) { ... }`)하여 성공 여부를 분기하고, 실패 시 `res.error.code`와 `res.error.message`를 활용하도록 설계하십시오.
5.  **콘텐츠 협상 활용**: API 설계 시 클라이언트가 `.json`, `.apon`, `.xml` 등의 확장자를 붙여 요청하면 Aspectran이 해당 포맷으로 즉시 변환하므로, 동일한 비즈니스 로직으로 다중 포맷 API를 손쉽게 제공할 수 있습니다.
