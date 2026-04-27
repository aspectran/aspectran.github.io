---
title: Guide to Standard REST Response Handling in Aspectran
subheadline: Practical Guides
---

Aspectran provides a standardized response model to maintain consistency in RESTful web services and to allow developers to intuitively and precisely control HTTP status codes, headers, and data transformation. This guide covers all aspects of designing APIs that comply with Aspectran's standard specifications using `RestResponse` and its implementations.

## 1. Core Concepts

REST response handling in Aspectran goes beyond simply returning data; it aims to encapsulate the success status, data payload, and error information into a single standardized format.

### 1.1 Response Container: ResponsePayload
Every standard REST response is internally wrapped in a `ResponsePayload` object. This object has a consistent structure so that clients can process responses predictably:

*   **success**: A boolean indicating whether the operation was successful.
*   **data**: The actual data object (`Object`) to be delivered to the client upon success.
*   **error**: An `ErrorPayload` object containing detailed error information upon failure.
    *   `code`: A unique code identifying the error.
    *   `message`: A detailed error message.

### 1.2 Standard Response Classes
Developers typically use two core classes to generate responses. Both classes inherit from `DefaultRestResponse` and share powerful data transformation capabilities.

*   **SuccessResponse**: Used for successful results with 2xx status codes. It internally sets `success` to `true` and assigns the provided data to the `data` field.
*   **FailureResponse**: Used for failed results with 4xx or 5xx status codes. It internally sets `success` to `false` and includes an error code and message.

## 2. How to Apply

There are two primary ways to deliver a response to a client using `RestResponse` in Aspectran.

### 2.1 Using as an Action Method Return Value (Recommended)
This is the most recommended approach, where the return type of the action method is specified as `RestResponse` (or one of its implementations).

**Key Feature: Self-Transformation**
`RestResponse` implements the `CustomTransformer` interface. When an action's result is of type `CustomTransformer`, the Aspectran engine allows the **object itself to execute its own defined transformation logic**, even without an explicit `@Transform` annotation or `<transform>` configuration in XML. This delegates the responsibility of determining the response format and serialization to the response object itself.

```java
@Request("/api/data")
// No @Transform or @Dispatch configuration required!
public RestResponse getData() {
    return new SuccessResponse(dataService.findAll());
}
```

### 2.2 Explicit Transformation via Translet
In environments where the method return type is `void` or where the response cannot be controlled via a return value (such as in an Aspect/Interceptor), you can call the `translet.transform(RestResponse)` method directly. Calling this immediately triggers the transformation and response process using the provided response object.

```java
@Before
public void checkAuth(Translet translet) {
    if (!isAuthenticated()) {
        // Immediately execute transformation process with a 403 Forbidden error response
        translet.transform(new FailureResponse().forbidden());
    }
}
```

## 3. Supported Content Types

Aspectran's `DefaultRestResponse` automatically transforms data into various media types based on the client's request without additional configuration.

| Media Type | Extension | Description |
| :--- | :--- | :--- |
| `application/json` | `.json` | Standard JSON format (most commonly used) |
| `application/apon` | `.apon` | Aspectran Object Notation (APON) |
| `application/xml` | `.xml` | Standard XML format |
| `text/plain` | `.txt` | Plain text output of the data's string representation |
| `text/html` | `.html`, `.htm` | HTML string output |

### Content Negotiation Priority
1.  **URL Extension**: If a path ends with `.json`, `.xml`, etc., that type is chosen first.
2.  **Accept Header**: If no extension is present, the HTTP `Accept` header is analyzed to choose the best compatible format.
3.  **Default Setting**: If neither of the above can determine a type, the server's `defaultContentType` is used.

## 4. HTTP Status Code Control (Fluent API)

`AbstractRestResponse` provides various methods to intuitively set HTTP status codes. These methods support **Method Chaining**, resulting in concise and readable code.

### 4.1 Success Responses (2xx Success)
*   `ok()`: **200 OK**. Indicates the request succeeded. (Default)
*   `created()`: **201 Created**. Indicates a new resource was created.
*   `created(String location)`: **201 Created**. Automatically includes the URI of the created resource in the `Location` header.
*   `accepted()`: **202 Accepted**. Indicates the request has been accepted but processing is not yet complete.
*   `noContent()`: **204 No Content**. Indicates success but there is no data to return in the response body.

### 4.2 Redirection (3xx Redirection)
*   `movedPermanently()`: **301 Moved Permanently**.
*   `seeOther()`: **303 See Other**.
*   `notModified()`: **304 Not Modified**.
*   `temporaryRedirect()`: **307 Temporary Redirect**.

### 4.3 Client Errors (4xx Client Errors)
*   `badRequest()`: **400 Bad Request**. Indicates a malformed request or invalid parameters.
*   `unauthorized()`: **401 Unauthorized**. Indicates valid authentication credentials are missing.
*   `forbidden()`: **403 Forbidden**. Indicates the server understood the request but refuses to authorize it.
*   `notFound()`: **404 Not Found**. Indicates the requested resource was not found.
*   `methodNotAllowed()`: **405 Method Not Allowed**. Indicates the HTTP method is not supported for the resource.
*   `notAcceptable()`: **406 Not Acceptable**. Indicates no response matches the Accept header.
*   `conflict()`: **409 Conflict**. Indicates a conflict with the current state of the resource.
*   `preconditionFailed()`: **412 Precondition Failed**.
*   `unsupportedMediaType()`: **415 Unsupported Media Type**.

### 4.4 Server Errors (5xx Server Errors)
*   `internalServerError()`: **500 Internal Server Error**.

## 5. Data and Header Configuration Methods

In addition to status codes, methods are provided to control the fine details of the response.

*   `setHeader(String name, String value)`: Sets a header value (overwrites existing).
*   `addHeader(String name, String value)`: Adds a header value (supports multiple values).
*   `setData(Object data)`: Explicitly sets the object for the `data` field in the payload.
*   `setData(String name, Object data)`: Assigns a name to the data to be used as a root key, which is useful for naming the root element in XML.
*   `prettyPrint(boolean)`: Determines whether to format the output (JSON, XML, APON) with indentation and line breaks.
*   `nullWritable(boolean)`: Determines whether to include fields with `null` values during serialization.

## 6. Practical Examples

### Example 1: Basic Success Response (200 OK)
Simply returning queried data encapsulated in a standard response.

```java
@Request("/api/user/{userId}")
public RestResponse getUser(@NonNull Translet translet) {
    String userId = translet.getAttribute("userId");
    User user = userService.getUserById(userId);

    // Return data encapsulated with a 200 OK status code
    return new SuccessResponse(user);
}
```

**Response Data Sample (JSON):**
```json
{
  "success": true,
  "data": {
    "userId": "user-01",
    "username": "aspectran"
  }
}
```

### Example 2: Resource Creation and Header Control (201 Created)
Informing the client of the location (URI) of a newly created resource.

```java
@RequestToPost("/api/orders")
public RestResponse createOrder(Order order) {
    orderService.placeOrder(order);

    // Set 201 Created and automatically add the Location header
    return new SuccessResponse(order)
            .created("/api/orders/" + order.getId());
}
```

**Response Data Sample (JSON):**
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

### Example 3: Validation Failure and Error Handling (400 Bad Request)
Returning a detailed error code and user-friendly message when input is invalid.

```java
@RequestToPost("/api/register")
public RestResponse register(User user) {
    if (StringUtils.isEmpty(user.getEmail())) {
        return new FailureResponse()
                .badRequest() // Set HTTP 400 status code
                .setError("REQUIRED_FIELD", "Email is required.");
    }
    // Registration logic...
    return new SuccessResponse("Registered successfully");
}
```

**Response Data Sample (JSON) - Validation Failure:**
```json
{
  "success": false,
  "error": {
    "code": "REQUIRED_FIELD",
    "message": "Email is required."
  }
}
```

### Example 4: Authentication and Access Denied (401, 403)
Controlling secure access with clear status codes and reasons for denial.

```java
@Request("/api/admin/settings")
public RestResponse getAdminSettings(UserInfo userInfo) {
    if (userInfo == null) {
        // User not logged in
        return new FailureResponse().unauthorized(); // HTTP 401
    }
    if (!userInfo.hasRole("ADMIN")) {
        // User lacks administrative privileges
        return new FailureResponse()
                .forbidden() // HTTP 403
                .setError("ACCESS_DENIED", "Admin privileges are required.");
    }
    return new SuccessResponse(configService.getAdminConfig());
}
```

**Response Data Sample (JSON) - Insufficient Privileges:**
```json
{
  "success": false,
  "error": {
    "code": "ACCESS_DENIED",
    "message": "Admin privileges are required."
  }
}
```

**Response Data Sample (APON):**
```apon
success: false
error: {
  code: ACCESS_DENIED
  message: Admin privileges are required.
}
```

### Example 5: Formatting and Header Control
Customizing headers and formatting the response for debugging or specific client needs.

```java
@Request("/api/system/stats")
public RestResponse getSystemStats() {
    Map<String, Object> stats = statsService.getGlobalStats();

    return new SuccessResponse(stats)
            .prettyPrint(true) // Enable pretty-printing
            .setHeader("Cache-Control", "no-cache") // Set cache prevention header
            .addHeader("X-Server-Id", "node-01"); // Add a custom header
}
```

### Example 6: API Relay (Using Symmetry)
Relaying a response from another server directly using the server-client symmetry of `RestResponse`.

```java
@Request("/relay/weather")
public RestResponse relayWeatherRequest() {
    String targetUrl = "https://api.example.com/weather/today";

    try {
        // The result of RestRequest.retrieve() is already a SuccessResponse or FailureResponse
        RestResponse response = restRequest.get()
                                           .url(targetUrl)
                                           .retrieve();

        // Return the received standard response directly as the Translet response
        return response;
    } catch (IOException e) {
        return new FailureResponse()
                .internalServerError()
                .setError("RELAY_ERROR", "An error occurred while communicating with the target server.");
    }
}
```

## 7. Best Practices

1.  **Use Standard Classes**: Avoid manually creating response bodies using `Map.of(...)` or filling `success` fields in DTOs. Always use `SuccessResponse` and `FailureResponse` to adhere to the `ResponsePayload` specification.
2.  **Consistent Error Codes**: Manage error codes as constants and ensure they are unique across the project for better error handling on the client side.
3.  **Global Exception Handling**: Combine this with Aspects or a global exception handler to intercept exceptions and transform them into `FailureResponse` objects, ensuring a predictable error format for clients.
