---
title: Aspectran의 표준 REST 응답 처리 가이드
subheadline: 실용 가이드
---

Aspectran은 RESTful 웹 서비스를 구축할 때 응답의 일관성을 유지하고, 개발자가 HTTP 상태 코드, 헤더, 데이터 변환을 직관적이고 세밀하게 제어할 수 있도록 표준화된 응답 모델을 제공합니다. 이 가이드는 `RestResponse`와 그 구현체들을 활용하여 Aspectran의 표준 규격에 맞는 API를 설계하는 모든 방법을 상세히 다룹니다.

## 1. 핵심 개념 (Core Concepts)

Aspectran의 REST 응답 처리는 단순히 데이터를 반환하는 것이 아니라, 응답의 성공 여부, 데이터 페이로드, 에러 정보를 하나의 표준 규격으로 캡슐화하는 것을 지향합니다.

### 1.1 응답 컨테이너: ResponsePayload
모든 표준 REST 응답은 내부적으로 `ResponsePayload` 객체에 담겨 전달됩니다. 이 객체는 클라이언트가 응답을 일관되게 처리할 수 있도록 다음과 같은 표준 구조를 가집니다.

*   **success**: 작업의 성공 여부를 나타내는 불리언(`boolean`) 값입니다.
*   **data**: 작업이 성공했을 때 클라이언트에 전달할 실제 데이터 객체(`Object`)입니다.
*   **error**: 작업이 실패했을 때 에러의 상세 정보를 담는 `ErrorPayload` 객체입니다.
    *   `code`: 에러를 식별할 수 있는 고유 코드
    *   `message`: 에러에 대한 상세 메시지

### 1.2 표준 응답 클래스
사용자는 상황에 따라 다음 두 가지 핵심 클래스를 사용하여 응답을 생성합니다. 두 클래스 모두 `DefaultRestResponse`를 상속받아 강력한 데이터 변환 기능을 공유합니다.

*   **SuccessResponse**: 2xx 상태 코드와 함께 성공적인 결과를 반환할 때 사용합니다. 내부적으로 `success`를 `true`로 설정하고 전달된 데이터를 `data` 필드에 할당합니다.
*   **FailureResponse**: 4xx 또는 5xx 상태 코드와 함께 실패 원인을 반환할 때 사용합니다. 내부적으로 `success`를 `false`로 설정하고 에러 코드와 메시지를 포함합니다.

## 2. 응답 적용 방식 (How to Apply)

Aspectran에서 `RestResponse`를 사용하여 클라이언트에게 응답을 전달하는 방식은 크게 두 가지가 있습니다.

### 2.1 액션 메서드의 리턴값으로 사용 (추천)
가장 권장되는 방식으로, 액션 메서드의 리턴 타입을 `RestResponse` (또는 그 구현체)로 지정합니다.

**핵심 특징: 자동 변환 (Self-Transformation)**
`RestResponse`는 `CustomTransformer` 인터페이스를 구현하고 있습니다. Aspectran 엔진은 액션의 결과값이 `CustomTransformer` 타입인 경우, 별도의 `@Transform` 어노테이션이나 XML의 `<transform>` 설정이 없더라도 **객체 스스로가 정의한 변환 로직을 실행**합니다. 즉, 응답 포맷 결정과 직렬화 로직을 프레임워크가 아닌 응답 객체에게 위임합니다.

```java
@Request("/api/data")
// 별도의 @Transform이나 @Dispatch 설정이 필요 없음!
public RestResponse getData() {
    return new SuccessResponse(dataService.findAll());
}
```

### 2.2 Translet을 통한 명시적 변환
메서드의 리턴 타입이 `void`이거나, Aspect(Interceptor)와 같이 리턴값을 통해 응답을 제어할 수 없는 환경에서는 `translet.transform(RestResponse)` 메서드를 직접 호출합니다. 호출 즉시 해당 응답 객체를 사용하여 변환 및 응답 프로세스가 진행됩니다.

```java
@Before
public void checkAuth(Translet translet) {
    if (!isAuthenticated()) {
        // 즉시 403 Forbidden 에러 응답으로 변환 프로세스 실행
        translet.transform(new FailureResponse().forbidden());
    }
}
```

## 3. 지원되는 컨텐츠 타입 (Supported Content Types)

Aspectran의 `DefaultRestResponse`는 별도의 설정 없이도 클라이언트의 요구에 맞춰 데이터를 다양한 미디어 타입으로 자동 변환(Transformation)합니다.

| 미디어 타입 (Media Type) | 확장자 (Extension) | 설명 |
| :--- | :--- | :--- |
| `application/json` | `.json` | 가장 널리 쓰이는 표준 JSON 형식 |
| `application/apon` | `.apon` | Aspectran 고유의 객체 표기법 (APON) |
| `application/xml` | `.xml` | 표준 XML 형식 |
| `text/plain` | `.txt` | 데이터의 문자열 표현(ToString) 출력 |
| `text/html` | `.html`, `.htm` | HTML 형식의 문자열 출력 |

### 컨텐츠 결정 우선순위 (지능형 콘텐츠 협상)
1.  **URL 확장자**: 요청 경로 끝에 `.json`, `.xml` 등이 명시되어 있으면 해당 타입을 최우선으로 선택합니다.
2.  **Accept 헤더**: 확장자가 없는 경우, 클라이언트가 보낸 HTTP `Accept` 헤더를 분석하여 호환되는 최적의 형식을 선택합니다.
3.  **기본 설정**: 위 두 가지 조건으로 결정할 수 없는 경우, 서버에 설정된 기본 미디어 타입(`defaultContentType`)을 사용합니다.

## 4. HTTP 응답 상태 코드 제어 (Fluent API)

`AbstractRestResponse`는 HTTP 상태 코드를 직관적으로 설정할 수 있는 다양한 메서드를 제공합니다. 이 메서드들은 **메서드 체이닝(Method Chaining)**을 지원하여 코드를 간결하고 가독성 높게 작성할 수 있도록 돕습니다.

### 4.1 성공 응답 (2xx Success)
*   `ok()`: **200 OK**. 요청이 성공적으로 처리되었음을 나타냅니다. (기본값)
*   `created()`: **201 Created**. 새 리소스가 성공적으로 생성되었음을 나타냅니다.
*   `created(String location)`: **201 Created**. 생성된 리소스의 URI를 `Location` 헤더에 자동으로 포함합니다.
*   `accepted()`: **202 Accepted**. 요청이 접수되었으나 처리가 아직 완료되지 않았음을 나타냅니다.
*   `noContent()`: **204 No Content**. 성공했으나 응답 바디에 보낼 데이터가 없음을 나타냅니다.

### 4.2 리다이렉션 (3xx Redirection)
*   `movedPermanently()`: **301 Moved Permanently**. 리소스의 URI가 영구적으로 변경되었음을 나타냅니다.
*   `seeOther()`: **303 See Other**. 요청한 리소스를 다른 URI에서 찾아야 함을 나타냅니다.
*   `notModified()`: **304 Not Modified**. 캐시된 리소스가 변경되지 않았음을 나타냅니다.
*   `temporaryRedirect()`: **307 Temporary Redirect**. 임시 리다이렉션을 나타냅니다.

### 4.3 클라이언트 오류 (4xx Client Errors)
*   `badRequest()`: **400 Bad Request**. 잘못된 문구, 유효하지 않은 파라미터 등 클라이언트의 잘못된 요청을 나타냅니다.
*   `unauthorized()`: **401 Unauthorized**. 대상 리소스에 대한 유효한 인증 자격 증명이 없음을 나타냅니다.
*   `forbidden()`: **403 Forbidden**. 서버가 요청을 이해했으나 승인을 거부했음을 나타냅니다. (권한 부족 등)
*   `notFound()`: **404 Not Found**. 서버가 요청받은 리소스를 찾을 수 없음을 나타냅니다.
*   `methodNotAllowed()`: **405 Method Not Allowed**. 요청에 사용된 HTTP 메서드가 리소스에서 허용되지 않음을 나타냅니다.
*   `notAcceptable()`: **406 Not Acceptable**. 요청의 Accept 헤더에 지정된 콘텐츠 타입에 맞는 응답을 생성할 수 없음을 나타냅니다.
*   `conflict()`: **409 Conflict**. 서버의 현재 상태와 요청이 충돌했음을 나타냅니다.
*   `preconditionFailed()`: **412 Precondition Failed**. 대상 리소스에 대한 접근 사전 조건이 실패했음을 나타냅니다.
*   `unsupportedMediaType()`: **415 Unsupported Media Type**. 요청 엔티티의 미디어 타입이 서버나 리소스에서 지원되지 않음을 나타냅니다.

### 4.4 서버 오류 (5xx Server Errors)
*   `internalServerError()`: **500 Internal Server Error**. 서버 내부에서 예기치 못한 오류가 발생하여 요청을 수행할 수 없음을 나타냅니다.

## 5. 데이터 및 헤더 부가 설정 메서드

상태 코드 외에도 응답의 세부적인 형태를 제어할 수 있는 메서드들이 제공됩니다.

*   `setHeader(String name, String value)`: 특정 헤더 값을 설정합니다. 이미 존재하는 헤더라면 값을 덮어씁니다.
*   `addHeader(String name, String value)`: 특정 헤더에 값을 추가합니다. 동일한 이름의 헤더에 여러 값을 설정할 때 유용합니다.
*   `setData(Object data)`: 응답 페이로드의 `data` 필드에 들어갈 객체를 명시적으로 설정합니다.
*   `setData(String name, Object data)`: 데이터에 이름을 부여하여 루트 키로 사용합니다. 특히 XML로 변환할 때 최상위 엘리먼트 이름을 지정하는 데 유용합니다.
*   `prettyPrint(boolean)`: 응답 데이터(JSON, XML, APON 등)를 줄바꿈과 들여쓰기를 포함하여 읽기 좋은 형태로 포맷팅할지 여부를 결정합니다.
*   `nullWritable(boolean)`: 데이터 객체를 직렬화할 때 `null` 값을 가진 필드도 출력할지 여부를 설정합니다.

## 6. 실무 적용 예제 (Practical Examples)

### 예제 1: 기본적인 성공 응답 (200 OK)
단순히 조회된 데이터를 클라이언트에게 반환하는 가장 일반적인 케이스입니다.

```java
@Request("/api/user/{userId}")
public RestResponse getUser(@NonNull Translet translet) {
    String userId = translet.getAttribute("userId");
    User user = userService.getUserById(userId);

    // 200 OK 상태 코드와 함께 데이터를 캡슐화하여 반환
    return new SuccessResponse(user);
}
```

**응답 데이터 샘플 (JSON):**
```json
{
  "success": true,
  "data": {
    "userId": "user-01",
    "username": "aspectran"
  }
}
```

### 예제 2: 리소스 생성 및 헤더 제어 (201 Created)
새로운 데이터를 생성한 후, 클라이언트에게 생성된 리소스의 위치(URI)를 함께 알려주는 케이스입니다.

```java
@RequestToPost("/api/orders")
public RestResponse createOrder(Order order) {
    orderService.placeOrder(order);

    // 201 Created 상태 코드를 설정하고 Location 헤더를 자동으로 추가
    return new SuccessResponse(order)
            .created("/api/orders/" + order.getId());
}
```

**응답 데이터 샘플 (JSON):**
```json
{
  "success": true,
  "data": {
    "orderId": "ORD-1004",
    "item": "Coffee",
    "status": "COMPLETED"
  }
}
```

### 예제 3: 유효성 검사 실패 및 에러 처리 (400 Bad Request)
입력값이 잘못되었을 때 상세한 에러 코드와 사용자 친화적인 메시지를 함께 반환합니다.

```java
@RequestToPost("/api/register")
public RestResponse register(User user) {
    if (StringUtils.isEmpty(user.getEmail())) {
        return new FailureResponse()
                .badRequest() // HTTP 400 상태 코드 지정
                .setError("REQUIRED_FIELD", "이메일은 필수 항목입니다.");
    }
    // 등록 로직 수행...
    return new SuccessResponse("Registered successfully");
}
```

**응답 데이터 샘플 (JSON) - 유효성 검사 실패 시:**
```json
{
  "success": false,
  "error": {
    "code": "REQUIRED_FIELD",
    "message": "이메일은 필수 항목입니다."
  }
}
```

### 예제 4: 권한 인증 및 접근 금지 (401, 403)
API 엔드포인트에 대한 보안 접근을 제어할 때 명확한 상태 코드로 거부 사유를 알립니다.

```java
@Request("/api/admin/settings")
public RestResponse getAdminSettings(UserInfo userInfo) {
    if (userInfo == null) {
        // 로그인되지 않은 사용자
        return new FailureResponse().unauthorized(); // HTTP 401
    }
    if (!userInfo.hasRole("ADMIN")) {
        // 관리자 권한이 없는 사용자
        return new FailureResponse()
                .forbidden() // HTTP 403
                .setError("ACCESS_DENIED", "관리자 권한이 필요합니다.");
    }
    return new SuccessResponse(configService.getAdminConfig());
}
```

**응답 데이터 샘플 (JSON) - 권한 부족 시:**
```json
{
  "success": false,
  "error": {
    "code": "ACCESS_DENIED",
    "message": "관리자 권한이 필요합니다."
  }
}
```

**응답 데이터 샘플 (APON):**
```apon
success: false
error: {
  code: ACCESS_DENIED
  message: 관리자 권한이 필요합니다.
}
```

### 예제 5: 응답 형식 및 포맷팅 제어
클라이언트나 개발자가 디버깅하기 쉽도록 데이터를 예쁘게 출력하거나 커스텀 헤더를 추가합니다.

```java
@Request("/api/system/stats")
public RestResponse getSystemStats() {
    Map<String, Object> stats = statsService.getGlobalStats();

    return new SuccessResponse(stats)
            .prettyPrint(true) // 읽기 좋은 형태로 출력 설정
            .setHeader("Cache-Control", "no-cache") // 캐시 방지 헤더 설정
            .addHeader("X-Server-Id", "node-01"); // 커스텀 헤더 추가
}
```

### 예제 6: API Relay (서버-클라이언트 대칭성 활용)
`RestRequest` 클래스를 사용하여 다른 서버의 API를 호출하고, 그 결과를 가공 없이 현재 서버의 응답으로 바로 중계(Relay)하는 강력한 패턴입니다.

```java
@Request("/relay/weather")
public RestResponse relayWeatherRequest() {
    String targetUrl = "https://internal-api.example.com/weather/today";

    try {
        // RestRequest.retrieve() 호출 결과는 이미 SuccessResponse 또는 FailureResponse 형태임
        RestResponse response = restRequest.get()
                                           .url(targetUrl)
                                           .retrieve();

        // 반환받은 표준 응답 객체를 Translet의 응답으로 그대로 전달
        return response;
    } catch (IOException e) {
        return new FailureResponse()
                .internalServerError()
                .setError("RELAY_ERROR", "대상 서버와 통신 중 오류가 발생했습니다.");
    }
}
```

## 7. 모범 사례 및 권장 사항

1.  **Map 대신 표준 클래스 사용**: 응답 바디를 구성하기 위해 `Map.of(...)`를 사용하거나 DTO를 직접 만들어 `success` 필드를 채우는 방식은 피해야 합니다. 항상 `SuccessResponse`와 `FailureResponse`를 사용하여 `ResponsePayload` 표준 규격을 준수하십시오.
2.  **일관된 에러 코드 관리**: `FailureResponse`에서 사용하는 에러 코드는 프로젝트 전체에서 식별 가능하고 고유하도록 규칙을 정하여 상수로 관리하는 것이 좋습니다.
3.  **예외 처리 로직과의 결합**: 애플리케이션 전역에서 발생하는 예외를 Aspect나 전역 Exception Handler에서 낚아채어 `FailureResponse`로 변환하도록 구성하면, 클라이언트에게 항상 예측 가능한 동일한 형태의 에러 응답을 보장할 수 있습니다.
