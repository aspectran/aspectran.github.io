---
layout: page
show_meta: false
sidebar: toc
title: "Servlet Configuration"
subheadline: "User Guide"
teaser: "Aspectran을 웹컨테이너의 서블릿으로 등록하는 방법에 대해 설명합니다."
breadcrumb: true
---

## 1. 웹 컨테이너에 서블릿으로 등록하기

***Aspectran*** 구동에 필요한 초기화 파라메터 `aspectran:config`를 정의하고,
`AspectranServiceListener`를 등록해서 `ActivityContext`를 생성하도록 합니다.

요청 URI가 `/example/`이면 `WebActivityServlet`라는 서블릿이 처리하도록 했습니다.
스케쥴러를 사용할 경우 개발환경에서 Job을 직접 실행해 볼 수 있도록 `/scheduler/`로 시작하는 URL도 맵핑했습니다.

만약 `WebActivityServlet`라는 서블릿이 처리하지 못하는 요청은 `DefaultServlet`으로 처리권을 넘겨줍니다.
`DefaultServlet`의 이름은 명시적으로 지정하지 않았지만, 내부적으로 웹어플리케이션 서버 종류에 따라서 자동으로 판단합니다.
잘 알려진 웹어플리케이션 서버가 아닐 경우 `DefaultServlet`의 이름을 수동으로 명시할 수도 있습니다.

***web.xml***
{% highlight xml %}
<?xml version="1.0" encoding="utf-8"?>
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee http://xmlns.jcp.org/xml/ns/javaee/web-app_3_1.xsd"
         version="3.1">
  <display-name>aspectran-examples</display-name>
  <welcome-file-list>
    <welcome-file>index.html</welcome-file>
    <welcome-file>index.jsp</welcome-file>
  </welcome-file-list>
  <context-param>
    <param-name>aspectran:config</param-name>
    <param-value>
      context: {
        root: "/WEB-INF/aspectran/config/getting-started.xml"
        encoding: "utf-8"
        resources: [
          "/WEB-INF/aspectran/config"
          "/WEB-INF/aspectran/classes"
          "/WEB-INF/aspectran/lib"
        ]
        hybridLoading: false
        autoReloading: {
          reloadMethod: hard
          observationInterval: 5
          startup: true
        }
      }
      scheduler: {
        startDelaySeconds: 10
        waitOnShutdown: true
        startup: false
      }
    </param-value>
  </context-param>
  <listener>
    <listener-class>com.aspectran.web.startup.listener.AspectranServiceListener</listener-class>
  </listener>
  <servlet>
    <servlet-name>aspectran-example</servlet-name>
    <servlet-class>com.aspectran.web.startup.servlet.WebActivityServlet</servlet-class>
    <load-on-startup>1</load-on-startup>
  </servlet>
  <servlet-mapping>
    <servlet-name>aspectran-example</servlet-name>
    <url-pattern>/example/*</url-pattern>
  </servlet-mapping>
  <!-- 실제 운영환경에서는 스케쥴러의 Job에 직접 접근할 수 없도록 서블릿매핑을 제거하도록 합니다. -->
  <servlet-mapping>
    <servlet-name>aspectran-example</servlet-name>
    <url-pattern>/scheduler/*</url-pattern>
  </servlet-mapping>
</web-app>
{% endhighlight %}

### 1.1 초기화 파라메터 정의

먼저 컨텍스트 초기화 파라메터 `aspectran:config`를 정의합니다.
`aspectran:config` 파라메터는 **APON**(*Aspectran Parameter Object Notation*) 문서형식의 설정 값을 가질 수 있습니다.

> ***APON***(Aspectran Parameter Object Notation)은 ***JSON*** 과 표기법이 비슷합니다.
> 미리 정해진 형식의 파라메터를 주고 받기 위해서 새롭게 개발된 표기법입니다.

**context**
: Aspectran 환경설정을 위한 정의

**context.root**
: 환경 설정을 위해 가장 먼저 참조할 xml 파일의 경로

**context.encoding**
: XML 파일을 APON 문서형식으로 변환시에 문자열 인코딩 방식을 지정

**context.resources**
: Aspectran에서 별도로 관리할 수 있는 리소스의 경로를 배열로 지정  
(Aspectran은 계층형의 ClassLoader를 별도로 내장하고 있습니다.)  
다음과 리소스 경로를 지정할 수 있습니다.  
*/WEB-INF/aspectran/config*  
*/WEB-INF/aspectran/classes*  
*/WEB-INF/aspectran/lib*  
*file:/c:/Users//Projects/java/classes*

**context.hybridLoading**
: 환경 설정을 빠르게 로딩하기 위해 다수의 XML 파일을 APON 문서형식으로 변환할지 여부를 지정합니다.
XML 형식의 환경 설정 파일이 수정되면 APON 파일로 변환되고, 다음 기동 시에 XML 파일을 로딩하는 것이 아니라 APON 파일을 찾아서 로딩합니다.
다수의 XML 파일을 파싱하는 걸리는 시간을 단축할 수 있습니다.

**context.autoReloading**
: 리소스 자동 갱신 기능에 대한 정의
(Aspectran에서 별도로 관리하는 리소스에 대해서는 WAS를 재시작을 하지 않더라도 자동 갱신이 가능합니다.)

**context.autoReloading.reloadMethod**
: 리소스의 갱신 방법을 지정
(hard: Java Class 갱신 가능 , soft: 환경 설정 내역만 갱신 가능)

**context.autoReloading.observationInterval**
: 리소스가 수정 여부를 관찰하는 시간 간격을 초 단위로 지정

**context.autoReloading.startup**
: 리소스 자동 갱신 기능을 사용할지 여부를 지정

**scheduler**
: 스케쥴러 동작환경을 위한 정의

**scheduler.startDelaySeconds**
: 모든 환경이 초기화된 후 스케쥴러가 기동 지연 시간을 초 단위로 지정

**scheduler.waitOnShutdown**
: 실행중인 모든 Job이 종료되기를 기다렸다가 스케쥴러를 종료할지 여부를 지정

**scheduler.startup**
: 스케쥴러를 기동할지 여부를 지정

각 초기화 파라메터 별로 기본 값은 다음과 같습니다.

| 파라메터 | 기본 값 |
|--------- |--------|
| **context** |  |
| **context.root** | /WEB-INF/aspectran/root.xml |
| **context.encoding** |  |
| **context.resources** |  |
| **context.hybridLoading** | false |
| **context.autoReloading** | false |
| **context.autoReloading.reloadMethod** | soft |
| **context.autoReloading.observationInterval** | 10 |
| **context.autoReloading.startup** | false |
| **scheduler** |  |
| **scheduler.startDelaySeconds** | 5 |
| **scheduler.waitOnShutdown** | false |
| **scheduler.startup** | false |

### 1.2 AspectranServiceListener 등록
`<listner-class>`에  `com.aspectran.web.startup.listener.AspectranServiceListener`를 지정합니다.
AspectranServiceListener는 컨텍스트 초기화 파라메터 `aspectran:config`의 설정 내용으로 Aspectran 서비스 환경을 구성하고, Application Scope를 가지고 있습니다.

> AspectranServiceListener에 의해 기동된 Aspectran 서비스는 여러 WebActivityServlet에서 사용될 수 있습니다.
> 즉, 전역적인 하나의 Aspectran 서비스 환경을 구성할 수 있습니다.

### 1.3 WebActivityServlet 등록
`<servlet-class>`에 `com.aspectran.web.startup.servlet.WebActivityServlet`을 지정합니다.
`<servlet-name>`에는 Aspectran 서비스를 위한 서블릿이라는 의미의 고유한 서블릿 이름을 부여해 주기 바랍니다.

> 서블릿 초기화 파라메터로 `aspectran:cofnig`를 정의하면 서블릿만의 단독 Aspectran 서비스 환경을 구성합니다.
> 즉, 전역 Aspectran 서비스를 사용하지 않습니다.

### 1.4 서블릿 URL 패턴 등록
`<url-pattern>`에 해당하는 요청은 `WebActivityServlet`이 처리할 수 있도록 합니다.
만약 `<url-pattern>`을 `/example/*`로 지정하면 `/example/`로 시작하는 이름을 가진 Translet이 실행됩니다.

> Aspectran의 Translet이란?
> 요청을 받고 결과 값을 적절히 가공해서 응답하는 처리자를 Aspectran 내부에서는 Translet이라고 명명하였습니다.
> Translet은 고유 이름을 가지고 있으며, 요청 URI와 직접적으로 매핑이 됩니다.
> 스케쥴러의 Job도 Translet을 통해서 실행이 됩니다.

### 1.5 DefaultServlet 이름 지정하기
요청 URI에 해당하는 Translet이 존재하지 않을 경우 서블릿 컨테이너의 DefaultServlet에게 넘겨주는 역할을 하는 핸들러가 항상 동작하고 있습니다.
그 핸들러의 이름은 DefaultServletHttpRequestHandler입니다. DefaultServletHttpRequestHandler는 DefaultServlet의 이름이 무엇인지 자동으로 판단합니다.
만약 DefaultServlet의 이름이 다르게 지정되어야 할 경우 아래와 같은 초기화 파라메터를 추가합니다.

{% highlight xml %}
<context-param>
    <param-name>aspectran:defaultServletName</param-name>
    <param-value>default</param-value>
</context-param>
{% endhighlight %}
