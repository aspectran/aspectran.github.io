---
title: "Using CORS (Cross-Origin Resource Sharing) in Aspectran"
subheadline: Practical Guides
---

{% capture info_message %}
Learn how to configure CORS (Cross-Origin Resource Sharing) in the Aspectran framework to securely share resources with web applications from different domains.
{% endcapture %}
{% include alert.liquid info=info_message %}

When developing web applications, especially when building RESTful APIs, it is common to request resources from a different domain. By default, these requests can be blocked by the browser's Same-Origin Policy. To solve this, the CORS (Cross-Origin Resource Sharing) standard is used.

Aspectran provides built-in components, including `DefaultCorsProcessor`, to easily apply CORS. This guide explains step-by-step how to configure CORS in an Aspectran configuration file based on the provided example.

## Three Core Components of CORS Configuration

To set up CORS in Aspectran, you generally need to configure the following three elements:

1.  **`corsProcessor` Bean**: The core component that defines the CORS policy. It sets the allowed origins, HTTP methods, etc.
2.  **`corsProcessorAspect` Aspect**: When an actual resource request (Actual Request) arrives, this aspect detects the `Origin` header and executes the `corsProcessor` bean.
3.  **`OPTIONS` Method Translet**: A dedicated translet for handling Preflight Requests.

## Step 1: Register the `corsProcessor` Bean

First, you need to register the `DefaultCorsProcessor`, which defines the CORS policy, as a bean. In this bean, you configure in detail which origins and methods to allow.

```xml
<bean id="corsProcessor" class="com.aspectran.web.support.cors.DefaultCorsProcessor">
  <property name="allowedOrigins" type="set">
    <value>https://aspectran.com</value>
    <value>https://backend1.aspectran.com</value>
    <value>https://backend2.aspectran.com</value>
  </property>
  <property name="allowedMethods" type="set">
    <value>GET</value>
    <value>POST</value>
    <value>PATCH</value>
    <value>PUT</value>
    <value>DELETE</value>
    <value>HEAD</value>
    <value>OPTIONS</value>
  </property>
  <property name="maxAgeSeconds" value="360" valueType="int"/>
  <property name="exposedHeaders" value="Location"/>
</bean>
```

-   **`allowedOrigins`**: Specifies the list of origins (domains) that are allowed to access the resource.
-   **`allowedMethods`**: Specifies the allowed HTTP methods.
-   **`maxAgeSeconds`**: Specifies the time (in seconds) that the client can cache the response to a Preflight Request. During this time, the Preflight Request is not sent again, reducing unnecessary network round-trips.
-   **`exposedHeaders`**: Specifies the response headers that can be exposed to the client-side script (JavaScript). In the example, the `Location` header is exposed so that the client can know the location of a resource after it has been created.

## Step 2: Apply an Aspect for Actual Requests

Next, configure an aspect to check the CORS policy when an actual resource request arrives. This aspect detects requests with specific HTTP methods that include an `Origin` header and executes the `corsProcessor`.

```xml
<aspect id="corsProcessorAspect">
  <joinpoint>
    methods: [
      GET, POST, PATCH, PUT, DELETE
    ]
    headers: [
      Origin
    ]
    pointcut: {
      +: /**
    }
  </joinpoint>
  <advice bean="corsProcessor">
    <before>
      <invoke method="processActualRequest"/>
    </before>
  </advice>
  <exception>
    <thrown type="com.aspectran.web.support.cors.CorsException">
      <transform format="transform/text">
        <template>
          @{CORS.HTTP_STATUS_CODE}: @{CORS.HTTP_STATUS_TEXT}
        </template>
      </transform>
    </thrown>
  </exception>
</aspect>
```

-   **`joinpoint`**: Defines the point at which the aspect is applied.
    -   `methods`: Applies to `GET`, `POST`, `PATCH`, `PUT`, `DELETE` requests.
    -   `headers`: Applies only if the request header contains `Origin`.
    -   `pointcut`: `/**` means it applies to requests for all paths.
-   **`advice`**: When a request matching the `joinpoint` arrives, it executes the `processActualRequest` method of the `corsProcessor` bean to check the CORS policy.
-   **`exception`**: If a CORS policy violation occurs, a `CorsException` is thrown, and an error message is returned in the specified format.

## Step 3: Configure a Translet for Preflight Requests

For complex requests (e.g., using `PUT` or `DELETE` methods), the browser sends a Preflight Request using the `OPTIONS` method before sending the actual request. Configure a translet to handle this request as follows.

```xml
<translet name="/**" method="OPTIONS">
  <action bean="corsProcessor" method="processPreflightRequest"/>
  <exception>
    <thrown type="com.aspectran.web.support.cors.CorsException">
      <transform format="transform/text">
        <template>
          @{CORS.HTTP_STATUS_CODE}: @{CORS.HTTP_STATUS_TEXT}
        </template>
      </transform>
    </thrown>
  </exception>
</translet>
```

-   `name="/**"` and `method="OPTIONS"` ensure that this translet handles all `OPTIONS` requests for all paths.
-   The `action` calls the `processPreflightRequest` method of the `corsProcessor` bean to handle the Preflight Request.

## Conclusion

As shown above, Aspectran allows you to easily implement a CORS policy declaratively by combining three elements: a **`Bean`**, an **`Aspect`**, and a **`Translet`**. This approach enables you to flexibly respond to various CORS scenarios through configuration alone, without any code changes.
