---
format: plate solid article
sidebar: toc-left
title: 서블릿 기반 웹 애플리케이션 구성
subheadline: Aspectran Configuration
teaser:
---

전통적인 서블릿 컨테이너 환경에서 Aspectran을 서블릿으로 등록하여 웹 애플리케이션을 구축하는 방법을 안내합니다.

## 1. 서블릿 컨테이너 호환성

Aspectran 9.0부터는 컴파일을 위해 Java 21 이상이 필요하지만, Jakarta EE 10 스펙을 기반으로 합니다. 따라서 다음 서블릿 스펙을 안정적으로 지원합니다.

| 서블릿 스펙 | JSP 스펙 |
|:---------:|:--------:|
| 6.0       | 3.1      |

## 2. web.xml 구성

`web.xml` 배포 서술자(Deployment Descriptor)에 Aspectran을 구동하기 위한 서블릿과 리스너를 등록합니다.
가장 간단한 최신 구성 방식은 다음과 같습니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="https://jakarta.ee/xml/ns/jakartaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="https://jakarta.ee/xml/ns/jakartaee https://jakarta.ee/xml/ns/jakartaee/web-app_6_0.xsd"
         version="6.0">

    <display-name>my-web-app</display-name>

    <!-- (1) Aspectran 설정 파일 경로 지정 -->
    <context-param>
        <param-name>aspectran:config</param-name>
        <param-value>classpath:config/aspectran-config.apon</param-value>
    </context-param>

    <!-- (2) Aspectran 서비스를 시작하고 종료하는 리스너 -->
    <listener>
        <listener-class>com.aspectran.web.servlet.listener.WebServiceListener</listener-class>
    </listener>

    <!-- (3) 모든 웹 요청을 처리할 Aspectran의 메인 서블릿 -->
    <servlet>
        <servlet-name>web-activity-servlet</servlet-name>
        <servlet-class>com.aspectran.web.servlet.WebActivityServlet</servlet-class>
        <load-on-startup>1</load-on-startup>
    </servlet>
    <servlet-mapping>
        <servlet-name>web-activity-servlet</servlet-name>
        <url-pattern>/</url-pattern>
    </servlet-mapping>

</web-app>
```

### 2.1. `WebServiceListener`

`WebServiceListener`는 서블릿 컨테이너가 시작될 때 `aspectran:config` 파라미터에 지정된 설정 정보를 읽어 Aspectran 서비스를 초기화하는 역할을 합니다. 웹 애플리케이션이 종료될 때는 Aspectran 서비스를 안전하게 종료시킵니다.

### 2.2. `WebActivityServlet`

`WebActivityServlet`은 클라이언트의 모든 요청을 받아 처리하는 Aspectran의 핵심 서블릿입니다. `url-pattern`을 `/`로 지정하면, 정적 리소스를 포함한 모든 요청이 이 서블릿을 통해 처리됩니다.

## 3. Aspectran 설정

`web.xml`의 `context-param`에 정의된 `aspectran:config` 초기화 파라미터는 Aspectran의 동작을 상세하게 설정합니다.

### 3.1. 설정 파일 경로

`param-value`에는 Aspectran 설정 파일의 경로를 지정합니다. 경로는 다음 접두사로 시작할 수 있습니다.

- `classpath:`: 클래스패스 상의 리소스 경로 (주로 `src/main/resources` 내부)
- `file:`: 파일 시스템의 절대 또는 상대 경로

```xml
<context-param>
    <param-name>aspectran:config</param-name>
    <!-- 클래스패스에 있는 설정 파일을 사용하는 경우 -->
    <param-value>classpath:config/aspectran-config.apon</param-value>
</context-param>
```

```xml
<context-param>
    <param-name>aspectran:config</param-name>
    <!-- 웹 애플리케이션 디렉토리의 파일을 사용하는 경우 -->
    <param-value>file:/WEB-INF/config/aspectran-config.apon</param-value>
</context-param>
```

설정 파일의 내용은 APON(Aspectran Parameters Object Notation) 형식으로 작성합니다.

> **APON (Aspectran Parameters Object Notation)**
> JSON과 유사한 표기법으로, 설정 값을 쉽게 작성하고 읽을 수 있도록 Aspectran을 위해 개발되었습니다.

### 3.2. 주요 설정 파라미터

다음은 `aspectran-config.apon` 파일에 설정할 수 있는 주요 파라미터입니다.

```apon
context: {
    rules: classpath:config/app-rules.xml
    scan: [
        com.example.app
    ]
    autoReload: {
        reloadMode: hard
        scanIntervalSeconds: 5
        enabled: true
    }
}
scheduler: {
    enabled: false
}
web: {
    acceptable: {
        +: /**
        -: /assets/**
        -: /favicon.ico
    }
}
```

#### `context` 파라미터

Aspectran의 핵심 실행 환경을 설정합니다.

| 파라미터                  | 설명                                                                 | 기본값 |
|---------------------------|----------------------------------------------------------------------|--------|
| `rules`                   | 트랜잭션 흐름을 정의하는 규칙 파일(XML)의 경로                       |        |
| `encoding`                | 규칙 파일의 인코딩                                                   | `utf-8`|
| `scan`                    | `@Component` 어노테이션이 붙은 빈을 찾기 위해 스캔할 패키지          |        |
| `autoReload.enabled`      | 애플리케이션 재시작 없이 설정 및 클래스를 다시 로드할지 여부         | `false`|
| `autoReload.reloadMode`   | `soft`: 설정만 리로드, `hard`: 설정 및 클래스 리로드                 | `soft` |
| `autoReload.scanIntervalSeconds` | 변경 감지를 위한 스캔 주기 (초)                               | `10`   |

#### `scheduler` 파라미터

내장 스케줄러의 동작을 설정합니다.

| 파라미터               | 설명                                                         | 기본값 |
|------------------------|--------------------------------------------------------------|--------|
| `enabled`              | 스케줄러 서비스를 활성화할지 여부                            | `false`|
| `startDelaySeconds`    | 서비스 시작 후 스케줄러가 작업을 시작하기까지 대기하는 시간  | `5`    |
| `waitOnShutdown`       | 종료 시 실행 중인 모든 작업이 완료될 때까지 기다릴지 여부    | `false`|

#### `web` 파라미터

웹 환경과 관련된 동작을 설정합니다.

| 파라미터             | 설명                                                                                             | 기본값 |
|----------------------|--------------------------------------------------------------------------------------------------|--------|
| `uriDecoding`        | 요청 URI의 인코딩                                                                                | `utf-8`|
| `acceptable`         | `WebActivityServlet`이 처리할 요청 URI 패턴을 지정. `+`는 포함, `-`는 제외                       |        |
| `defaultServletName` | 처리되지 않은 요청을 넘길 기본 서블릿의 이름 (예: `default`)                                     | (자동 감지)|

`web.acceptable` 속성은 `WebActivityServlet`이 어떤 요청을 처리하고 어떤 요청을 무시할지 결정하는 가장 중요하고 효율적인 방법입니다. 예를 들어, 위 예제는 모든 요청(`/**`)을 처리하지만, `/assets/`로 시작하는 경로와 `/favicon.ico`는 제외하여 기본 서블릿(보통 정적 리소스를 처리)으로 넘깁니다.

## 4. 레거시 구성: `WebActivityFilter` 사용

과거에는 `WebActivityFilter`를 사용하여 특정 요청이 `WebActivityServlet`에 도달하기 전에 제외하는 방식을 사용했습니다. 현재는 `web.acceptable` 설정을 사용하는 것이 더 간편하고 권장되지만, 기존 프로젝트와의 호환성을 위해 이 방법을 알아둘 수 있습니다.

```xml
<filter>
    <filter-name>web-activity-filter</filter-name>
    <filter-class>com.aspectran.web.servlet.filter.WebActivityFilter</filter-class>
    <init-param>
        <param-name>bypasses</param-name>
        <param-value>
            /assets/**
            /css/**
            /images/**
        </param-value>
    </init-param>
</filter>
<filter-mapping>
    <filter-name>web-activity-filter</filter-name>
    <url-pattern>/</url-pattern>
    <servlet-name>web-activity-servlet</servlet-name>
</filter-mapping>
```

이 필터는 `bypasses` 파라미터에 지정된 경로의 요청을 `WebActivityServlet`으로 전달하지 않고 체인의 다음 필터로 넘깁니다.
