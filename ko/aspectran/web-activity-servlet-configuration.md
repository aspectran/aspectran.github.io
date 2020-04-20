---
layout: page
format: "plate solid article"
sidebar: toc-left
title: "웹 활동 서블릿 구성"
subheadline: ""
teaser: "Aspectran을 서블릿 컨테이너에 서블릿으로 등록함으로써, 전통적인 웹애플리케이션을 구축하는 데 사용할 수 있습니다."
breadcrumb: true
permalink: /aspectran/web-activity-servlet-configuration/
---

{% include alert warning='계속 작성 중인 문서로서, 아직은 빈약한 내용으로 구성되어 있습니다.' %}

## 1. 서블릿 컨테이너

Aspectran은 서블릿 컨테이너에 하나의 서블릿으로 등록되어 구동될 수 있으며,
Java 8 이상 버전을 사용하고 있다면 다음과 같은 서블릿 스펙을 안정적으로 지원합니다.

| 서블릿 스펙 | JSP 스펙 |
| :---------: | :------: |
|     4.0     |    2.3   |
|     3.1     |    2.3   |
|     3.0     |    2.2   |

## 2. 웹 활동 서블릿

Aspectran에서는 클라이언트의 요청을 처리하는 것을 단순히 `Activity`라고 부릅니다.
특히 웹 환경에서 클라이언트의 요청을 처리하고 응답하는 것을 `WebActivity`라고 합니다.

서블릿 컨테이너는 클라이언트의 요청을 처리하기 위한 여러 서블릿을 보유할 수 있습니다.
Aspectran은 하나의 서블릿을 통하여 여러 클라이언트의 요청을 받아서 처리할 수 있으며,
Aspectran이 제공하는 그 서블릿을 `WebActivityServlet`이라고 부릅니다.

`WebActivityServlet`을 web.xml 파일에 서블릿으로 등록하면 모든 클라이언트의 요청을
Aspectran이 처리할 수 있게 됩니다.

지금부터 web.xml 파일 안에 `WebActivityServlet`을 등록하는 방법에 대해 알아 봅니다.

### 2.1 초기화 파라메터 정의

먼저 Aspectran의 구동 환경을 구성하기 위한 초기화 파라메터 `aspectran:config`를 정의합니다.
초기화 파라메터 `aspectran:config`에 할당되는 값은 APON(Aspectran Parameters Object Notation) 형식으로 
작성될 수 있습니다.

> 참고로 ***APON***(Aspectran Parameters Object Notation)은 ***JSON*** 과 표기법이 유사하며,
> 매개 변수로 전달되는 설정 값의 작성 및 읽기가 용이하도록 Aspectran을 위해 특별히 개발된 새로운 표기법입니다.

```xml
<context-param>
  <param-name>aspectran:config</param-name>
  <param-value>
    context: {
        root: /WEB-INF/config/app-config.xml
        encoding: utf-8
        resources: [
        ]
        scan: [
            com.aspectran.demosite
        ]
        autoReload: {
            reloadMode: hard
            scanIntervalSeconds: 5
            enabled: false
        }
        profiles: {
        }
    }
    scheduler: {
        startDelaySeconds: 10
        waitOnShutdown: true
        enabled: false
    }
    web: {
        uriDecoding: utf-8
        defaultServletName: default
        exposals: {
            +: /
            +: /examples**
            +: /terminal**
            +: /skylark**
        }
    }
  </param-value>
</context-param>
```

#### 2.1.1 **context** 파라메터

Aspectran을 구동하는데 꼭 필요한 설정 값을 가지고 있습니다.

| 파라메터 | 설명 | 기본 값 |
| -------- | ---- | ------- |
| **context.root** | 루트 구성 파일의 경로 | /WEB-INF/aspectran/root.xml
| **context.encoding** | 환경 구성 파일의 인코딩 방식을 지정
| **context.resources** | Aspectran이 관리하는 리소스 파일의 경로를 배열로 지정
| **context.scan** | 자바 어노테이션에 의한 환경 구성을 위해 스캔할 패키지 경로를 배열로 지정
| **context.autoReload.reloadMethod** | soft: 환경 구성만 재로딩 가능, hard: 환경 구성 및 Java 리소스까지 재로딩 가능 | soft
| **context.autoReload.observationInterval** | 환경 구성 파일 또는 Java 리소스의 변경을 관찰하는 시간 간격을 초 단위로 지정 | 10
| **context.autoReload.startup** | 환경 구성 파일 또는 자바 리소스 파일이 변경될 경우 환경 구성을 백그라운드에서 자동으로 재로딩을 할 지 여부를 지정 | false |

#### 2.1.2 **scheduler** 파라메터

스케쥴러 서비스가 동작하는데 필요한 설정 값을 가지고 있습니다.

| 파라메터 | 설명 | 기본 값 |
| -------- | ---- | ------- |
| **scheduler.startDelaySeconds** | 스케쥴러 서비스가 기동되기 전 지연 시간을 초 단위로 지정 | 5
| **scheduler.waitOnShutdown** | 스케쥴러 서비스가 종료될때 실행중인 모든 Job이 종료되기를 기다릴지 여부를 지정 | false
| **scheduler.startup** | 스케쥴러 서비스를 구동할지 여부를 지정 | false

### 2.2 WebServiceListener

다음으로 `WebServiceListener`는 초기화 파라메터 `aspectran:config`의 값에 따라 내부적으로 `DefaultWebService`를 초기화 합니다.
한 번 초기화 된 `DefaultWebService` 인스턴스는 이후 여러 `WebActivityServlet`에서 사용될 수 있습니다.

```xml
<listener>
  <listener-class>com.aspectran.web.startup.listener.WebServiceListener</listener-class>
</listener>
```

### 2.3 WebActivityFilter

`WebActivityServlet` 서블릿으로 전달되는 요청을 필터링하기 위한 `WebActivityFilter` 필터를 정의합니다.

```xml
    <filter>
        <filter-name>web-activity-filter</filter-name>
        <filter-class>com.aspectran.web.startup.filter.WebActivityFilter</filter-class>
        <init-param>
            <param-name>bypasses</param-name>
            <param-value>
                /assets/**
            </param-value>
        </init-param>
    </filter>
```

`WebActivityFilter` 필터는 기본적으로 `HttpServletRequest`를 `ActivityRequestWrapper`로 랩핑을 해 줌으로써,
Aspectran에 의해 파싱된 요청 데이터 및 모든 활동 결과 데이터에 대한 접근이 가능하게 됩니다.

또한 `WebActivityServlet` 서블릿이 처리할 필요가 없는 우회할 요청 URI를 `bypasses` 파라메터에 지정함으로써,
`WebActivityServlet` 서블릿의 부담을 덜어 줄 수가 있습니다. 주로 스태틱 리소스의 경로를 지정하고, 해당 URL는
`DefaultServlet`이 처리하게 됩니다.

### 2.4 WebActivityServlet

클라이언트의 요청을 처리하기 위한 서블릿 `WebActivityServlet`을 `web-activity-servlet`이라는 이름으로 정의하고,
`/` 경로와 맵핑합니다.

```xml
<servlet>
  <servlet-name>web-activity-servlet</servlet-name>
  <servlet-class>com.aspectran.web.startup.servlet.WebActivityServlet</servlet-class>
  <load-on-startup>1</load-on-startup>
</servlet>
<servlet-mapping>
  <servlet-name>web-activity-servlet</servlet-name>
  <url-pattern>/</url-pattern>
</servlet-mapping>
```

만약 `WebActivityServlet`이 처리하지 못하는 요청은 서블릿 컨테이너가 보유하고 있는 `DefaultServlet`으로 처리권을 
넘겨주도록 설정되어 있습니다. `DefaultServlet`을 호출하기 위한 고유 이름은 웹어플리케이션 서버의 종류에 따라 다를
수 있으며, 내부적으로 잘 알려진 웹어플리케이션에 대해서는 `DefaultServlet`의 이름은 자동으로 결정됩니다.  
`DefaultServlet`의 이름을 다르게 지정해야 할 경우 다음과 같이 Aspectran 초기화 파라메터에 별도로 명시할 수 있습니다.

```text
    web: {
        uriDecoding: utf-8
        defaultServletName: default
        exposals: {
            +: /
            +: /examples**
            +: /terminal**
            +: /skylark**
        }
    }
```

## 3. 예제 프로젝트

다음은 Aspectran의 예제 기능을 시연하기 위해 구축된 데모 사이트 소스가 저장되어 있는 GitHub 저장소입니다.

{% include label-link-box label="Repository on GitHub" href="https://github.com/aspectran/demo-site" %}

데모 사이트는 구글 앱엔진에 통하여 임시로 서비스 되고 있으며, 다음 URL을 통하여 접속이 가능합니다.

{% include label-link-box label="Aspectran Demo Site" href="https://demo-gae.aspectran.com" %}

참고로 구글 앱엔진은 웹 애플리케이션 서버로 Jetty를 사용하고 있으며, Jetty를 위한
[***web.xml***](https://github.com/aspectran/demo-site/blob/master/src/main/webapp/WEB-INF/web.xml) 파일의 전체 내용은 다음과 같습니다.

```xml
<?xml version="1.0" encoding="utf-8"?>
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee http://xmlns.jcp.org/xml/ns/javaee/web-app_3_1.xsd"
         version="3.1">
    <display-name>demo-site</display-name>
    <welcome-file-list>
        <welcome-file>index.html</welcome-file>
        <welcome-file>index.jsp</welcome-file>
    </welcome-file-list>
    <context-param>
        <param-name>aspectran:config</param-name>
        <param-value>
            context: {
                root: /WEB-INF/config/app-config.xml
                encoding: utf-8
                resources: [
                ]
                scan: [
                    com.aspectran.demosite
                ]
                autoReload: {
                    reloadMode: hard
                    scanIntervalSeconds: 5
                    enabled: false
                }
                profiles: {
                }
            }
            scheduler: {
                startDelaySeconds: 10
                waitOnShutdown: true
                enabled: false
            }
            web: {
                uriDecoding: utf-8
                exposals: {
                    +: /
                    +: /examples**
                    +: /terminal**
                    +: /skylark**
                }
            }
        </param-value>
    </context-param>
    <listener>
        <listener-class>com.aspectran.web.startup.listener.AspectranServiceListener</listener-class>
    </listener>
    <filter>
        <filter-name>web-activity-filter</filter-name>
        <filter-class>com.aspectran.web.startup.filter.WebActivityFilter</filter-class>
        <init-param>
            <param-name>bypasses</param-name>
            <param-value>
                /assets/**
            </param-value>
        </init-param>
    </filter>
    <filter-mapping>
        <filter-name>web-activity-filter</filter-name>
        <url-pattern>/</url-pattern>
        <servlet-name>web-activity-servlet</servlet-name>
    </filter-mapping>
    <servlet>
        <servlet-name>web-activity-servlet</servlet-name>
        <servlet-class>com.aspectran.web.startup.servlet.WebActivityServlet</servlet-class>
        <load-on-startup>1</load-on-startup>
    </servlet>
    <servlet-mapping>
        <servlet-name>web-activity-servlet</servlet-name>
        <url-pattern>/</url-pattern>
    </servlet-mapping>
</web-app>
```