---
format: plate solid article
sidebar: toc
title: "Aspectran에서 CORS(Cross-Origin Resource Sharing) 활용하기"
subheadline: 실용 가이드
parent_path: /docs
---

{% capture info_message %}
Aspectran 프레임워크에서 CORS(Cross-Origin Resource Sharing)를 설정하여 다른 도메인의 웹 애플리케이션과 안전하게 리소스를 공유하는 방법을 알아봅니다.
{% endcapture %}
{% include alert.liquid info=info_message %}

웹 애플리케이션을 개발할 때, 특히 RESTful API를 구축하는 경우 다른 도메인에서 리소스를 요청하는 상황이 자주 발생합니다. 이때 브라우저의 동일 출처 정책(Same-Origin Policy)으로 인해 요청이 차단될 수 있는데, 이를 해결하기 위해 CORS(교차 출처 리소스 공유) 표준을 사용합니다.

Aspectran은 CORS를 손쉽게 적용할 수 있도록 `DefaultCorsProcessor`를 비롯한 관련 컴포넌트를 기본적으로 제공합니다. 이 가이드에서는 제공된 예제를 바탕으로 Aspectran 설정 파일에서 CORS를 구성하는 방법을 단계별로 설명합니다.

## CORS 구성의 세 가지 핵심 요소

Aspectran에서 CORS를 설정하려면 일반적으로 다음 세 가지 요소를 구성해야 합니다.

1.  **`corsProcessor` 빈(Bean)**: CORS 정책을 정의하는 핵심 컴포넌트입니다. 허용할 출처, HTTP 메서드 등을 설정합니다.
2.  **`corsProcessorAspect` 애스펙트(Aspect)**: 실제 리소스 요청(Actual Request)이 들어왔을 때, `Origin` 헤더를 감지하여 `corsProcessor` 빈을 실행시키는 역할을 합니다.
3.  **`OPTIONS` 메서드 트랜슬릿(Translet)**: Preflight 요청을 처리하기 위한 전용 트랜슬릿입니다.

## 1단계: `corsProcessor` 빈 등록하기

가장 먼저 CORS 정책을 정의하는 `DefaultCorsProcessor`를 빈으로 등록해야 합니다. 이 빈에 어떤 출처와 메서드를 허용할지 상세하게 설정합니다.

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

-   **`allowedOrigins`**: 리소스 접근을 허용할 출처(도메인) 목록을 지정합니다.
-   **`allowedMethods`**: 허용할 HTTP 메서드를 지정합니다.
-   **`maxAgeSeconds`**: Preflight 요청에 대한 응답을 클라이언트가 캐시할 시간(초)을 지정합니다. 이 시간 동안은 Preflight 요청을 다시 보내지 않아 불필요한 네트워크 왕복을 줄일 수 있습니다.
-   **`exposedHeaders`**: 브라우저에서 실행되는 클라이언트(JavaScript)가 접근할 수 있도록 노출할 응답 헤더를 지정합니다. 예제에서는 `Location` 헤더를 노출하여 리소스 생성 후 해당 위치를 클라이언트가 알 수 있도록 했습니다.

## 2단계: 실제 요청 처리를 위한 애스펙트(Aspect) 적용하기

다음으로, 실제 리소스 요청이 왔을 때 CORS 정책을 검사하도록 애스펙트를 설정합니다. 이 애스펙트는 `Origin` 헤더가 포함된 특정 HTTP 메서드 요청을 감지하여 `corsProcessor`를 실행합니다.

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

-   **`joinpoint`**: 애스펙트가 적용될 지점을 정의합니다.
    -   `methods`: `GET`, `POST`, `PATCH`, `PUT`, `DELETE` 요청에 대해 적용됩니다.
    -   `headers`: 요청 헤더에 `Origin`이 포함된 경우에만 적용됩니다.
    -   `pointcut`: `/**`는 모든 경로의 요청에 적용됨을 의미합니다.
-   **`advice`**: `joinpoint`에 해당하는 요청이 들어오면 `corsProcessor` 빈의 `processActualRequest` 메서드를 실행하여 CORS 정책을 검사합니다.
-   **`exception`**: CORS 정책 위반 시 `CorsException`이 발생하며, 이때 지정된 형식으로 오류 메시지를 응답합니다.

## 3단계: Preflight 요청 처리를 위한 트랜슬릿(Translet) 설정하기

복잡한 요청(예: `PUT`, `DELETE` 메서드 사용)의 경우, 브라우저는 실제 요청을 보내기 전에 `OPTIONS` 메서드를 사용해 Preflight 요청을 보냅니다. 이 요청을 처리하기 위한 트랜슬릿을 다음과 같이 설정합니다.

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

-   `name="/**"`과 `method="OPTIONS"`는 모든 경로에 대한 `OPTIONS` 요청을 이 트랜슬릿이 처리하도록 합니다.
-   `action`은 `corsProcessor` 빈의 `processPreflightRequest` 메서드를 호출하여 Preflight 요청을 처리합니다.

## 결론

위와 같이 Aspectran에서는 **`빈(Bean)`**, **`애스펙트(Aspect)`**, **`트랜슬릿(Translet)`** 세 가지 요소를 조합하여 선언적으로 CORS 정책을 손쉽게 구현할 수 있습니다. 이 방식을 통해 코드 변경 없이 설정만으로 다양한 CORS 시나리오에 유연하게 대응할 수 있습니다.
