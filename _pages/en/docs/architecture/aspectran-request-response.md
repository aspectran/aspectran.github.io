---
format: plate solid article
sidebar: toc-left
title: Request and Response Handling Mechanism
subheadline: Architecture
parent_path: /docs
---

The Aspectran framework provides a powerful and flexible mechanism for processing incoming requests and generating appropriate responses during the lifecycle of an `Activity`. This mechanism consists of core abstractions and specific extensions tailored to each execution environment.

## 1. Request Handling

Request handling is the process of converting external input into a data structure that Aspectran can understand and parsing it.

### 1.1. Core Request Handling: `com.aspectran.core.activity.request`

This package defines the fundamental components and abstractions for capturing, parsing, and making incoming request data available within an `Activity`.

-   **`AbstractRequest`**: An abstract base class for all request implementations, providing access and management functions for common data such as parameters, attributes, headers, and the request body.
-   **`ParameterMap` / `FileParameterMap`**: Special `Map` implementations for storing and managing request parameters and uploaded files.
-   **`PathVariableMap`**: Parses and stores path variables (e.g., `/users/{userId}`) used in RESTful APIs, etc.
-   **`RequestBodyParser`**: A utility for parsing request bodies of various `Content-Type`s, such as `application/x-www-form-urlencoded` and `application/json`, and converting them into a `ParameterMap`.

### 1.2. Web-Specific Request Handling: `com.aspectran.web.activity.request`

In a web environment, it extends the functionality of `com.aspectran.core.activity.request` and integrates with the `jakarta.servlet` API to handle complex aspects of HTTP requests.

-   **`MultipartFormDataParser`**: An interface for parsing `multipart/form-data` requests, including file uploads. It allows setting maximum request/file sizes, temporary storage paths, etc.
-   **`WebRequestBodyParser`**: A static utility class that parses all web request bodies, including multipart requests, by utilizing `MultipartFormDataParser`.

## 2. Response Handling

Response handling is the process of delivering the results of an `Activity`'s execution to the client or the next processing stage. Aspectran provides several response strategies.

### 2.1. Core Response Types (`com.aspectran.core.activity.response`)

-   **`Response` (Interface)**: The basic contract for all response types, responsible for actual response generation through the `respond(Activity activity)` method.

-   **`ForwardResponse`**: Forwards a request to another resource (another translet, JSP, etc.) internally on the server. The client's URL does not change.
    -   **Configuration Example**: `<forward translet="/user/detail" />`

-   **`RedirectResponse`**: Sends an HTTP redirect (3xx status code) response to the client, instructing it to re-request a specified URL. `FlashMap` can be used to pass temporary data between redirect requests.
    -   **Configuration Example**: `<redirect path="/login?error=1" />`

### 2.2. View Rendering: `...response.dispatch`

This package integrates processing results with specific view technologies (JSP, Pebble, FreeMarker, etc.) to generate the final UI.

-   **`ViewDispatcher` (Interface)**: The contract for dispatching to a specific view technology. A separate implementation (e.g., `PebbleViewDispatcher`) exists for each view technology.
-   **`DispatchResponse`**: A `Response` implementation that represents a dispatch response. This class acts as a **mediator** that finds the appropriate `ViewDispatcher` bean according to the configured `DispatchRule` and delegates the rendering task.
    -   **Configuration Example**: `<dispatch name="user/list.peb" contentType="text/html"/>`

### 2.3. Data Transformation: `...response.transform`

This package is used to transform the processing results of an `Activity` into various data formats such as JSON, XML, and TEXT, for generating RESTful API responses, etc.

-   **`TransformResponse` (Abstract Class)**: The base for all transformation responses, defining the logic for converting an `Activity`'s `ProcessResult` into a specific output format.
-   **Concrete Implementations**: `JsonTransformResponse`, `XmlTransformResponse`, `AponTransformResponse`, `TextTransformResponse`, etc., are provided.
-   **`TransformResponseFactory`**: A factory that creates the appropriate `TransformResponse` object according to the `<transform>` configuration rule (`TransformRule`).
    -   **Configuration Example**: `<transform type="json" indent="true"/>` (Converts the result to pretty-printed JSON)

### 2.4. Web-Specific Response: `com.aspectran.web.activity.response`

This package provides response handling features specialized for web, especially RESTful services.

-   **`RestResponse` (Interface)**: The basic contract representing an HTTP response for a REST resource. It defines methods for fine-grained control over response data, content type, HTTP status codes, and headers.
-   **`DefaultRestResponse`**: The concrete implementation of `RestResponse`, supporting APON, JSON, and XML data types. It includes logic for converting `Activity` data into these formats and sending them as responses. It also supports **Content Negotiation**, which automatically selects the appropriate data format by analyzing the client's `Accept` header.

## 3. Conclusion

Aspectran's request and response handling mechanism enables the development of highly flexible and powerful applications through core abstractions and extensions specialized for each environment and use case. It is designed to consistently process request data from various sources and generate responses using multiple strategies (forward, redirect, transform, dispatch), thereby helping developers effectively meet complex business logic and diverse client requirements.
