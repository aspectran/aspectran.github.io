---
title: Guide to Standard REST Response Handling in Aspectran
subheadline: Practical Guides
---

Aspectran provides a standardized response model to maintain consistency in RESTful web services and to allow developers to intuitively and precisely control HTTP status codes, headers, and data transformation. This guide covers all aspects of designing APIs that comply with Aspectran's standard specifications using `RestResponse` and its implementations.

## 1. Core Concepts

REST response handling in Aspectran goes beyond simply returning raw data; it aims to encapsulate the success status (`success`), data payload (`data`), and error information (`error`) into a single standardized format for predictable client communication.

### 1.1 Response Container: ResponsePayload
Every standard REST response (`SuccessResponse`, `FailureResponse`) is internally wrapped in a `com.aspectran.web.support.rest.response.ResponsePayload` object. This object has a consistent structure so that clients can process responses predictably:

*   **success**: A boolean (`boolean`) indicating whether the operation was successful. (Always present)
*   **data**: The actual data object (`Object`) to be delivered to the client as a result of the operation.
    *   Successful responses (`success: true`): Included in serialization when `data` is non-null. When `null`, the `data` field is omitted, returning simply `{"success": true}`.
    *   Failed responses (`success: false`): Only included in special cases where data is required (e.g., partial success results or debugging metadata).
*   **error**: An `ErrorPayload` object containing detailed error information when an operation fails.
    *   `code`: A unique code identifying the error (`String`, required).
    *   `message`: A detailed descriptive error message (`String`, optional).

The `ResponsePayload.toEntity()` method constructs a conditional entity map to avoid unnecessary `null` serialization and produce clean JSON/APON/XML structures:

| Response State | success | data Field | error Field | Resulting Payload Example (JSON) |
| :--- | :--- | :--- | :--- | :--- |
| **Success (with data)** | `true` | Included (`Object`) | Omitted | `{"success": true, "data": {...}}` |
| **Success (without data)** | `true` | Omitted | Omitted | `{"success": true}` |
| **Failure (error code/message)** | `false` | Omitted (default) | Included (`ErrorPayload`) | `{"success": false, "error": {"code": "...", "message": "..."}}` |
| **Failure (data + error)** | `false` | Included (`Object`) | Included (`ErrorPayload`) | `{"success": false, "data": {...}, "error": {...}}` |

### 1.2 Class Hierarchy
Aspectran's REST response architecture is designed with the following class hierarchy for flexible extensibility and consistent transformation logic:

```
com.aspectran.core.activity.response.transform.CustomTransformer (Interface)
 └─ com.aspectran.web.activity.response.RestResponse (Interface)
     └─ com.aspectran.web.activity.response.AbstractRestResponse (Abstract Class)
         └─ com.aspectran.web.activity.response.DefaultRestResponse (Class)
             ├─ com.aspectran.web.support.rest.response.SuccessResponse (Class)
             └─ com.aspectran.web.support.rest.response.FailureResponse (Class)
```

*   **RestResponse**: The core interface defining the fluent API specification for manipulating RESTful HTTP responses. It extends `CustomTransformer` to seamlessly integrate with Aspectran's self-transformation mechanism.
*   **AbstractRestResponse**: An abstract class providing common implementations for status codes, header maps, media types, and the intelligent content negotiation algorithm (`determineAcceptContentType`).
*   **DefaultRestResponse**: The default implementation with built-in serialization logic for JSON, APON, XML, Plain Text, and HTML formats. When given a `ResponsePayload`, it calls `toEntity()` to automatically convert it into the standard payload structure.
*   **SuccessResponse**: Used for returning successful results with 2xx status codes. It internally instantiates `ResponsePayload(true, data)`, defaulting to HTTP status `200 OK`.
*   **FailureResponse**: Used for returning error causes with 4xx or 5xx status codes. It internally instantiates `ResponsePayload(false)` and an `ErrorPayload`, providing fluent chaining methods to set error codes and messages.

## 2. How to Apply

There are two primary ways to deliver a response to a client using `RestResponse` in Aspectran.

### 2.1 Using as an Action Method Return Value (Recommended)
This is the most recommended approach, where the return type of the action method is declared as `RestResponse` (or `SuccessResponse`, `FailureResponse`).

**Key Feature: Self-Transformation**
`RestResponse` implements the `CustomTransformer` interface. When an action's result is of type `CustomTransformer`, the Aspectran engine allows the **object itself to execute its own defined transformation logic (`transform(Activity)`)**, even without an explicit `@Transform` annotation or `<transform>` configuration in XML. This delegates the responsibility of determining the response format and serialization to the response object itself.

```java
@Request("/api/data")
// No @Transform or @Dispatch configuration required!
public RestResponse getData() {
    return new SuccessResponse(dataService.findAll());
}
```

### 2.2 Explicit Transformation via Translet
In environments where the method return type is `void` or where the response cannot be directly controlled via a return value (such as in an Aspect, Interceptor, or Advice), call the `translet.transform(RestResponse)` method. Calling this immediately triggers the transformation and response process using the provided response object.

```java
@Before
public void checkAuth(Translet translet) {
    if (!isAuthenticated()) {
        // Immediately execute transformation process with a 403 Forbidden error response
        translet.transform(new FailureResponse().forbidden().setError("FORBIDDEN", "Authentication required."));
    }
}
```

## 3. Supported Content Types

Aspectran's `DefaultRestResponse` automatically transforms data into various media types based on client requirements without requiring third-party library configuration.

| Media Type | Extension | Description |
| :--- | :--- | :--- |
| `application/json` | `.json` | Standard JSON format (`JsonWriter`, JSONP callback support) |
| `application/apon` | `.apon` | Aspectran Parameters Object Notation (APON, concise text-based format) |
| `application/xml` | `.xml` | Standard XML format (`XmlTransformResponse`, root tag via `name`) |
| `text/plain` | `.txt` | Plain text output of the data's string representation |
| `text/html` | `.html`, `.htm` | HTML string output |

### Content Negotiation Priority Algorithm
`AbstractRestResponse.determineAcceptContentType(Activity)` resolves the optimal media type using a 4-step precedence order:

1.  **URL Path Extension (`favorPathExtension`)**:
    *   If the request path ends with an extension like `.json`, `.xml`, `.apon`, `.txt`, `.html`, or `.htm`, that media type is selected first. (Default: `true`)
    *   If an unknown extension is requested and `ignoreUnknownPathExtensions` is `false`, a `406 Not Acceptable` error is thrown.
2.  **HTTP Accept Header (`ignoreAcceptHeader`)**:
    *   If no extension is present or no type was resolved by extension, the client's `Accept` header quality values are analyzed and matched against the server's supported media types (`supportedContentTypes`).
3.  **Default Media Type (`defaultContentType`)**:
    *   If the `Accept` header is `*/*` or no matching media type is found, the instance's `defaultContentType` or the Translet setting key `response.defaultContentType` (`RestResponse.RESPONSE_DEFAULT_CONTENT_TYPE`) is applied.
4.  **406 Not Acceptable**:
    *   If no compatible media type can be resolved through any of the above steps, HTTP status code `406 Not Acceptable` is returned.

## 4. HTTP Status Code Control (Fluent API)

`AbstractRestResponse` provides various methods to intuitively configure HTTP status codes. These methods support **Method Chaining**, resulting in concise and readable code.

### 4.1 Success Responses (2xx Success)
*   `ok()`: **200 OK**. Indicates the request succeeded. (Default)
*   `created()`: **201 Created**. Indicates a new resource was created.
*   `created(String location)`: **201 Created**. Automatically adds the URI of the created resource to the `Location` response header.
*   `accepted()`: **202 Accepted**. Indicates the request has been accepted for processing, but processing has not completed.
*   `noContent()`: **204 No Content**. Indicates success, but there is no entity body to return.

### 4.2 Redirection (3xx Redirection)
*   `movedPermanently()`: **301 Moved Permanently**. Resource URI has changed permanently.
*   `seeOther()`: **303 See Other**. Directs client to get the resource at another URI.
*   `notModified()`: **304 Not Modified**. Cached resource has not been modified.
*   `temporaryRedirect()`: **307 Temporary Redirect**. Temporary redirection to another URI.

### 4.3 Client Errors (4xx Client Errors)
*   `badRequest()`: **400 Bad Request**. Malformed request syntax or invalid parameters.
*   `unauthorized()`: **401 Unauthorized**. Missing or invalid authentication credentials.
*   `forbidden()`: **403 Forbidden**. Server understood request but refuses authorization (e.g., insufficient permissions).
*   `notFound()`: **404 Not Found**. Requested resource could not be found.
*   `methodNotAllowed()`: **405 Method Not Allowed**. HTTP method is not supported for the requested resource.
*   `notAcceptable()`: **406 Not Acceptable**. Cannot generate response content matching the Accept header.
*   `conflict()`: **409 Conflict**. Request conflicts with current state of the target resource.
*   `preconditionFailed()`: **412 Precondition Failed**. Target resource precondition failed.
*   `unsupportedMediaType()`: **415 Unsupported Media Type**. Payload media type is not supported.

### 4.4 Server Errors (5xx Server Errors)
*   `internalServerError()`: **500 Internal Server Error**. Unexpected server-side error encountered.

### 4.5 General Status Code Methods
*   `setStatus(int status)`: Sets the integer HTTP status code directly.
*   `setStatus(HttpStatus status)`: Sets the status using `com.aspectran.web.support.http.HttpStatus` enum constant.
*   `getStatus()`: Returns the currently configured integer HTTP status code.

## 5. Data, Header, and Serialization Methods

In addition to status codes, methods are provided to finely control the response data and serialization behavior:

*   `setData(Object data)`: Explicitly sets the object for the `data` field in the payload.
*   `setData(String name, Object data)`: Assigns a root key name to the data, which is useful for naming the root XML element or wrapping root JSON objects.
*   `setHeader(String name, String value)`: Sets an HTTP response header (overwrites any existing value).
*   `addHeader(String name, String value)`: Adds an HTTP response header value (supports multiple values for the same header name).
*   `prettyPrint(boolean prettyPrint)`: Determines whether to format output data (JSON, APON, XML) with indentation and line breaks.
*   `nullWritable(boolean nullWritable)`: Determines whether to include fields with `null` values during serialization. (Default: `false`)
*   `stringifyContext(StringifyContext stringifyContext)`: Explicitly specifies advanced serialization configuration via `StringifyContext`.
*   `defaultContentType(MediaType defaultContentType)`: Dynamically overrides the default media type for the instance.
*   `favorPathExtension(boolean)` / `ignoreAcceptHeader(boolean)` / `ignoreUnknownPathExtensions(boolean)`: Overrides content negotiation settings per instance.

## 6. Practical Examples

Practical examples demonstrating Aspectran's `${...}` path variable mapping and standard REST response classes.

### Example 1: Basic Success Response (200 OK)
Returning a retrieved entity or DTO encapsulated in a standard response.

```java
@Request("/api/user/${userId}")
public RestResponse getUser(String userId) {
    User user = userService.getUserById(userId);
    if (user == null) {
        return new FailureResponse()
                .notFound()
                .setError("USER_NOT_FOUND", "User not found: " + userId);
    }

    // Return data encapsulated in standard ResponsePayload with a 200 OK status code
    return new SuccessResponse(user);
}
```

**Response Data Sample (JSON):**
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

**Response Data Sample (APON - Requested via /api/user/user-01.apon):**
```apon
success: true
data: {
  userId: user-01
  username: aspectran
  email: user@aspectran.com
}
```

**Response Data Sample (XML - Requested via /api/user/user-01.xml):**
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

### Example 2: Resource Creation and Location Header (201 Created)
Informing the client of the location URI of a newly created resource.

```java
@RequestToPost("/api/orders")
public RestResponse createOrder(Order order) {
    orderService.placeOrder(order);

    // Set 201 Created status code and automatically add the Location header
    return new SuccessResponse(order)
            .created("/api/orders/" + order.getId());
}
```

**Response Header and Body Sample (HTTP):**
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

### Example 3: Validation Failure and Error Handling (400 Bad Request)
Returning a detailed error code and user-friendly message when input validation fails.

```java
@RequestToPost("/api/register")
public RestResponse register(User user) {
    if (StringUtils.isEmpty(user.getEmail())) {
        return new FailureResponse()
                .badRequest() // Set HTTP 400 status code
                .setError("REQUIRED_FIELD", "Email is a required field.");
    }

    userService.register(user);
    return new SuccessResponse("Registered successfully");
}
```

**Response Data Sample (JSON - Validation Failure):**
```json
{
  "success": false,
  "error": {
    "code": "REQUIRED_FIELD",
    "message": "Email is a required field."
  }
}
```

### Example 4: Authentication and Access Control (401 Unauthorized, 403 Forbidden)
Controlling secure access with clear status codes and reasons for denial.

```java
@Request("/api/admin/settings")
public RestResponse getAdminSettings(UserInfo userInfo) {
    if (userInfo == null) {
        // User not logged in (401 Unauthorized)
        return new FailureResponse()
                .unauthorized()
                .setError("UNAUTHORIZED", "Authentication is required.");
    }
    if (!userInfo.hasRole("ADMIN")) {
        // User lacks administrative privileges (403 Forbidden)
        return new FailureResponse()
                .forbidden()
                .setError("ACCESS_DENIED", "Admin privileges are required.");
    }

    return new SuccessResponse(configService.getAdminConfig());
}
```

**Response Data Sample (JSON - Insufficient Privileges):**
```json
{
  "success": false,
  "error": {
    "code": "ACCESS_DENIED",
    "message": "Admin privileges are required."
  }
}
```

### Example 5: Formatting and Custom Header Control
Formatting response data for readability and setting cache-control alongside custom metadata headers.

```java
@Request("/api/system/stats")
public RestResponse getSystemStats() {
    Map<String, Object> stats = statsService.getGlobalStats();

    return new SuccessResponse(stats)
            .prettyPrint(true) // Enable indentation and line breaks for readability
            .nullWritable(false) // Omit null fields
            .setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
            .addHeader("X-Node-Id", "node-01")
            .addHeader("X-Response-Time", String.valueOf(System.currentTimeMillis()));
}
```

### Example 6: Backend API Relay (Using RestRequest)
Using `RestRequest` to invoke external microservices or internal cluster node APIs and relaying the result directly as the current server's response. `RestRequest.retrieve()` returns either a `SuccessResponse` or `FailureResponse` based on the remote status code, providing seamless client-server symmetry.

```java
@Request("/relay/weather")
public RestResponse relayWeatherRequest(CloseableHttpClient httpClient) {
    String targetUrl = "https://internal-api.example.com/weather/today";

    try {
        RestRequest restRequest = new RestRequest(httpClient);

        // The result of RestRequest.retrieve() is already a SuccessResponse or FailureResponse
        RestResponse response = restRequest.get()
                                           .url(targetUrl)
                                           .retrieve();

        // Return the received standard response directly as the Translet response
        return response;
    } catch (IOException e) {
        return new FailureResponse()
                .internalServerError()
                .setError("RELAY_ERROR", "Failed to communicate with remote server: " + e.getMessage());
    }
}
```

### Example 7: Global Exception Handling via Aspect
Intercepting exceptions thrown across the application and transforming them into standard `FailureResponse` objects ensures predictable and consistent error structures for API consumers.

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
                .setError("INTERNAL_SERVER_ERROR", "An internal server error occurred.");

        translet.transform(response);
    }

}
```

## 7. Best Practices

1.  **Use Standard Classes**: Avoid manually constructing response bodies using `Map.of("success", true, "data", ...)` or defining custom DTOs for `success` fields. Always use `SuccessResponse` and `FailureResponse` to strictly follow the `ResponsePayload` standard specification.
2.  **Clean Empty Success Responses**: When no data payload is needed (e.g., delete operations or state toggles), return `new SuccessResponse()` or `new SuccessResponse().noContent()` to minimize payload overhead.
3.  **Establish a Project-wide Error Code Convention**: Manage error codes (`ErrorPayload.code`) as centralized constants (enums or static constants) across the project for clear client-side error handling.
4.  **Align Frontend Communication Contracts**: Web frontends and API consumers should inspect the top-level `res.success` boolean field (`if (res.success) { ... }`) to branch execution, and access `res.error.code` and `res.error.message` upon failure.
5.  **Leverage Content Negotiation**: When clients append `.json`, `.apon`, or `.xml` extensions, Aspectran automatically performs format serialization, allowing a single action method to serve multi-format APIs effortlessly.
