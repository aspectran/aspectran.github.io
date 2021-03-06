---
layout: page
format: "plate article"
title: "Quick Start Guide"
subheadline: "Getting Started with Aspectran"
teaser: "Aspectran으로 간단한 Java 웹 어플리케이션을 만드는 과정을 설명합니다."
breadcrumb: true
sidebar: toc
permalink: /getting-started/quickstart/
---

## 1. 웹 어플리케이션 프로젝트 생성

Aspectran을 이용해서 Java 웹 어플리케이션을 개발하기 위해서는 다음 요건을 충족해야 합니다.

* Java 8 이상
* Servlet 3.1.0 이상

빠른 시작을 위해 GitHub 저장소를 Clone 또는 소스 파일을 다운로드해서 새로운 Maven 프로젝트를 생성해 주세요.  
본 문서에서 사용된 모든 소스 파일은 아래의 GitHub 저장소에서 구할 수 있습니다.

{% include link-box href="https://github.com/aspectran-guides/ga-quick-start" %}

Maven 프로젝트가 아닌 경우 [다운로드](/getting-started/download/) 페이지에서 jar 라이브러리의 복사본을 받아서 구성하시기 바랍니다.


## 2. Aspectran 서비스 구동환경 설정

Aspectran을 웹 컨테이너 안에서 구동하기 위해서 web.xml 파일을 수정해야 합니다.

Aspectran 서비스 구동환경을 설정하기 위한 초기화 파라메터 `aspectran:config`를 정의하고,
리스너 *AspectranServiceListener* 와 서블릿 *WebActivityServlet* 를 지정합니다.

> AspectranServiceListener는 Aspectran Service 인스턴스를 생성하는 역할을 합니다.  
> WebActivityServlet은 클라이언트로부터 받은 요청을 Aspectran Service에 위임하는 역할을 합니다.  
> 만약 WebActivityServlet이 처리할 수 없는 요청은 DefaultServlet이 대신 처리하도록 합니다.  
> DefaultServlet의 이름은 명시적으로 지정하지 않았지만, 내부적으로 웹어플리케이션 서버 종류에 따라서 자동으로 지정됩니다.
> 잘 알려진 웹어플리케이션 서버가 아닐 경우 DefaultServlet의 이름을 수동으로 명시할 수도 있습니다.

`/ga-quick-start/`로 시작되는 요청 URI에 대해서는 `aspectran-activity`라는 이름을 가진 서블릿이 처리하도록 설정을 합니다.

`/scheduler/`로 시작되는 요청 URI도 `aspectran-activity` 서블릿이 처리하도록 설정되어 있습니다.
이는 스케쥴러에 의해 실행되는 Job을 웹브라우저에서도 실행할 수 있도록 하기 위한 것이며,
실제 운영환경에서는 스케쥴러의 Job에 직접 접근할 수 없도록 서블릿 맵핑을 반드시 제거하도록 합니다.

[***web.xml***](https://github.com/aspectran-guides/ga-quick-start/blob/master/src/main/webapp/WEB-INF/web.xml)

```xml
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
                root: /WEB-INF/aspectran/config/root-configuration.xml
                encoding: utf-8
                resources: [
                    /WEB-INF/aspectran/config
                    /WEB-INF/aspectran/classes
                    /WEB-INF/aspectran/lib
                ]
                hybridLoad: false
                autoReload: {
                    reloadMode: hard
                    observationInterval: 5
                    startup: true
                }
                profiles: {
                }
            }
            scheduler: {
                startDelaySeconds: 10
                waitOnShutdown: true
                startup: false
            }
            web: {
                uriDecoding: utf-8
            }
        </param-value>
    </context-param>
    <listener>
        <listener-class>com.aspectran.web.startup.listener.AspectranServiceListener</listener-class>
    </listener>
    <servlet>
        <servlet-name>aspectran-activity</servlet-name>
        <servlet-class>com.aspectran.web.startup.servlet.WebActivityServlet</servlet-class>
        <load-on-startup>1</load-on-startup>
    </servlet>
    <servlet-mapping>
        <servlet-name>aspectran-activity</servlet-name>
        <url-pattern>/ga-quick-start/*</url-pattern>
    </servlet-mapping>
    <!-- 실제 운영환경에서는 스케쥴러의 Job에 직접 접근할 수 없도록 서블릿매핑을 제거하도록 합니다. -->
    <servlet-mapping>
        <servlet-name>aspectran-activity</servlet-name>
        <url-pattern>/scheduler/*</url-pattern>
    </servlet-mapping>
</web-app>
```

### 2.1 초기화 파라메터 설정

Aspectran 서비스 구동환경을 설정하기 위한 초기화 파라메터 `aspectran:config`는
**APON**(*Aspectran Parameters Object Notation*) 형식의 설정 값을 가질 수 있습니다.

> ***APON***(Aspectran Parameters Object Notation)은 ***JSON*** 과 표기법이 유사하며,
> 미리 정의된 형식의 파라메터를 주고 받기 위해서 새롭게 개발된 표기법입니다.
> 어플리케이션의 초기 설정 값을 APON 형식으로 작성하면 자동으로 Java Object로 맵핑되기 때문에 정확한 설정 값을 편리하게 전달받을 수 있습니다.  
> 참고로 Aspectran은 설정 메터데이터를 XML 형식뿐만 아니라 APON 형식으로도 작성할 수 있습니다.

다음은 초기화 파라메터를 구성하는 세부 항목에 대한 설명입니다.

---
**context**
: Aspectran 구동환경 설정

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

**context.hybridLoad**
: 설정 메타데이터를 빠르게 로딩하기 위해 다수의 XML 파일을 APON 문서형식으로 변환할지 여부를 지정합니다.
XML 형식의 설정 메타데이터 파일이 수정되면 APON 파일로 변환되고, 다음 기동 시에 XML 파일을 로딩하는 것이 아니라 APON 파일을 찾아서 로딩합니다.
다수의 XML 파일을 파싱하는데 걸리는 시간을 단축할 수 있습니다.

**context.autoReload**
: 리소스 자동 갱신 기능에 대한 정의
(Aspectran에서 별도로 관리하는 리소스에 대해서는 WAS를 재시작을 하지 않더라도 자동 갱신이 가능합니다.)

**context.autoReload.reloadMethod**
: 리소스의 갱신 방법을 지정
(hard: Java Class 갱신 가능, soft: 환경 설정 내역만 갱신 가능)

**context.autoReload.observationInterval**
: 리소스가 수정 여부를 관찰하는 시간 간격을 초 단위로 지정

**context.autoReload.startup**
: 리소스 자동 갱신 기능을 사용할지 여부를 지정

**context.profiles**
: 빌드 대상에 따라 설정을 다르게 적용할 수 있는 Profile을 설정

**context.profiles.active**
: 활성 Profile을 지정

**context.profiles.default**
: 활성 Profile을 지정하지 않았을 경우 기본 Profile을 지정

**scheduler**
: 스케쥴러 동작환경 설정

**scheduler.startDelaySeconds**
: 모든 환경이 초기화된 후 스케쥴러가 기동 지연 시간을 초 단위로 지정

**scheduler.waitOnShutdown**
: 실행중인 모든 Job이 종료되기를 기다렸다가 스케쥴러를 종료할지 여부를 지정

**scheduler.startup**
: 스케쥴러를 기동할지 여부를 지정

**web**
: 웹 환경을 위한 설정

**web.uriDecoding**
: get 방식으로 전달되는 파라메터에 대한 문자열 디코딩 방식을 지정

---
각 세부 항목의 기본 값은 다음과 같습니다.

| 파라메터 | 기본 값 |
|--------|-------|
| context |  |
| context.root | /WEB-INF/aspectran/root.xml |
| context.encoding |  |
| context.resources |  |
| context.hybridLoad | false |
| context.autoReload | false |
| context.autoReload.reloadMethod | soft |
| context.autoReload.observationInterval | 10 |
| context.autoReload.startup | false |
| profiles |  |
| profiles.active |  |
| profiles.default |  |
| scheduler |  |
| scheduler.startDelaySeconds | 5 |
| scheduler.waitOnShutdown | false |
| scheduler.startup | false |

### 2.2 AspectranServiceListener 지정
`<listner-class>`에  *com.aspectran.web.startup.listener.AspectranServiceListener* 를 지정합니다.
*AspectranServiceListener* 는 컨텍스트 초기화 파라메터 `aspectran:config`의 설정 내용으로 Aspectran 서비스 환경을 구성하고, Application Scope를 가지고 있습니다.

> AspectranServiceListener에 의해 기동된 Aspectran 서비스는 여러 WebActivityServlet에서 사용될 수 있습니다.
> 즉, 전역적인 하나의 Aspectran 서비스 환경을 구성할 수 있습니다.

### 2.3 WebActivityServlet 지정
`<servlet-class>`에 *com.aspectran.web.startup.servlet.WebActivityServlet* 을 지정합니다.
`<servlet-name>`에는 Aspectran을 위한 서블릿이라는 의미의 고유한 이름을 부여해 주기 바랍니다.

> 서블릿 초기화 파라메터로 `aspectran:config`를 정의하면 서블릿만의 단독 Aspectran 서비스 환경을 구성합니다.
> 즉, 전역 Aspectran 서비스를 사용하지 않습니다.

### 2.4 서블릿 URL 패턴 지정
`<servlet-name>`에 서블릿 *WebActivityServlet* 의 고유 이름을 지정합니다.  
`<url-pattern>`에 서블릿 *WebActivityServlet* 이 처리해야 하는 URL의 패턴을 지정합니다.  

만약 `<url-pattern>`을 `/ga-quick-start/*`로 지정하면 최종적으로 `/ga-quick-start/`로 시작하는 이름을 가진 *Translet* 이 실행됩니다.

> Translet이란?  
> 클라이언트의 요청 정보를 분석해서 정해진 내부 비지니스 로직을 수행한 후에 결과 값을 특정한 형태로 가공해서 응답하는 처리자를
> Aspectran 내부에서는 Translet이라고 명명하였습니다.
> Translet은 고유 이름을 가지고 있으며, 요청 URI와 직접적으로 매핑이 됩니다.
> 참고로 스케쥴러의 Job도 Translet을 통해서 실행이 됩니다.

### 2.5 DefaultServlet 이름 지정하기
요청 URI에 해당하는 *Translet* 이 존재하지 않을 경우 서블릿 컨테이너의 *DefaultServlet* 에게 넘겨주는 역할을 하는 핸들러가 항상 동작하고 있습니다.
그 핸들러의 이름은 *DefaultServletHttpRequestHandler* 입니다. *DefaultServletHttpRequestHandler* 는 *DefaultServlet* 의 이름이 무엇인지 자동으로 판단합니다.
만약 *DefaultServlet* 의 이름이 다르게 지정되어야 할 경우 아래와 같은 초기화 파라메터를 추가합니다.

```xml
<context-param>
  <param-name>aspectran:defaultServletName</param-name>
  <param-value>default</param-value>
</context-param>
```


## 3. 설정 메타데이터 작성

***Aspectran*** 이 구동되기 위해서는 구조화된 설정 메타데이터를 필요로 합니다.  
설정 메타데이터는 전통적인 XML 형식 또는 APON 형식의 파일로 작성해야 하며, 계층적으로 모듈화되어 여러 개의 파일로 나뉠 수 있습니다.

***Aspectran*** 을 대표하는 4개의 핵심 구성요소는 다음과 같습니다.

* ***aspect*** - Bean과 Translet이 가진 원래의 기능에 다른 부가 기능을 주입하는 방법을 정의합니다.  
관점지향프로그래밍(AOP)을 지원하기 위한 핵심 요소입니다.
* ***bean*** - IoC, DI의 대상이 되고, 기능을 가진 객체를 정의합니다.  
객체를 인스턴스화 하는 방법, 객체의 생명주기, 객체의 속성 값, 객체의 의존관계를 설정할 수 있습니다.
* ***translet*** - 요청 URI와 맵핑되어 비지니스 로직을 가지고 있는 Action Method를 호출하는 방법 및 응답 컨텐츠를 출력하는 방법을 정의합니다.
* ***template*** - Java Template Engine을 사용해서 형식화된 텍스트를 생산하는 역할을 합니다.

> 주로 많이 작성하는 ***bean*** 과 ***translet*** 은 Java 소스코드에서 직접 설정할 수 있는 Annotation 기반의 설정도 지원하고 있습니다.
> 설정 메타데이터 작성법에 관한 자세한 설명은 Aspectran Configuration 문서를 참조하세요.

"Hello, World." 문자열을 출력하는 웹어플리케이션을 위한 설정 메타데이터를 XML 형식으로 아래와 같이 작성하였습니다.

"Hello, World." 문자열을 출력하기 위한 `simplestAction` ***bean*** 과 `helloWorld` ***translet*** 이 정의되어 있고,
Aspectran의 AOP 기능을 이용하여 "Hello, World." 문자열을 출력하는 Action을 호출하기 전과 후에 특정 동작을 주입하는 `simplestAdvice` ***aspect*** 가 정의되어 있습니다.
`helloWorld` ***translet*** 은 `simplestAction` ***bean*** 의 `helloWorld` Method를 실행하고, 결과를 텍스트형식으로 출력하는 역할을 합니다.

[***root-configuration.xml***](https://github.com/aspectran-guides/ga-quick-start/blob/master/src/main/webapp/WEB-INF/aspectran/config/root-configuration.xml)

```xml
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran Configuration 2.0//EN"
                           "https://aspectran.github.io/dtd/aspectran-2.dtd">

<aspectran>

  <description>
    Quick Start Guide를 위한 Aspectran Configuration입니다.
  </description>

  <!-- 기본 설정 -->
  <settings>
    <setting name="transletNamePattern" value="/ga-quick-start/*"/>
  </settings>

  <bean id="simplestAction" class="hello.SimplestAction">
    <description>
      Action Method를 가지고 있는 singleton 스코프에 해당하는 Bean을 정의합니다.
    </description>
  </bean>

  <bean id="simplestAdvice" class="hello.SimplestAdvice">
    <description>
      Action Method 실행 전 후에 주입할 Advice Action Method를 가지고 있는
      singleton 스코프에 해당하는 Bean을 정의합니다.
    </description>
  </bean>

  <aspect id="simplestAdvice">
    <description>
      요청 URI가 "/ga-quick-start/"로 시작하고,
      simplestAction Bean의 helloWorld 메쏘드를 실행하는 Translet이 발견되면,
      해당 Translet의 실행 전에는 simplestAdvice Bean의 welcome 메쏘드를 실행하고,
      해당 Translet의 실행 후에는 simplestAdvice Bean의 goodbye 메쏘드를 실행합니다.
    </description>
    <joinpoint type="translet">
      pointcut: {
        +: /ga-quick-start/*@simplestAction^helloWorld
      }
    </joinpoint>
    <advice bean="simplestAdvice">
      <before>
        <action method="welcome"/>
      </before>
      <after>
        <action method="goodbye"/>
      </after>
    </advice>
  </aspect>

  <translet name="helloWorld">
    <description>
      simplestAction 빈에서 helloWorld 메쏘드를 실행해서 "Hello, World."라는 문구를
      텍스트 형식의 컨텐츠로 응답합니다.
    </description>
    <transform type="transform/text" contentType="text/plain">
      <action bean="simplestAction" method="helloWorld"/>
    </transform>
  </translet>

</aspectran>
```


## 4. Bean 작성하기

"Hello, World." 문자열을 출력하는 Action을 담고 있는 자바 클래스를 작성합니다.

[***SimplestAction.java***](https://github.com/aspectran-guides/ga-quick-start/blob/master/src/main/java/hello/SimplestAction.java)

```java
package hello;

import com.aspectran.core.util.logging.Log;
import com.aspectran.core.util.logging.LogFactory;

public class SimplestAction {

  private final Log log = LogFactory.getLog(SimplestAction.class);

  public String helloWorld() {
    String msg = "Hello, World.";

    log.info("The message generated by my first aciton is: " + msg);

    return msg;
  }

}
```

"Hello, World." 문자열을 출력하는 Action을 호출하기 전과 후에 실행되는 Action을 담고 있는 자바 클래스를 작성합니다.

[***SimplestAdvice.java***](https://github.com/aspectran-guides/ga-quick-start/blob/master/src/main/java/hello/SimplestAdvice.java)

```java
package hello;

import javax.servlet.http.HttpServletRequest;

import com.aspectran.core.activity.Translet;
import com.aspectran.core.util.logging.Log;
import com.aspectran.core.util.logging.LogFactory;

public class SimplestAdvice {

  private final Log log = LogFactory.getLog(SimplestAdvice.class);

  public String welcome(Translet translet) {
    HttpServletRequest req = translet.getRequestAdaptee();
    String ip = req.getRemoteAddr();
    String msg = "Welcome to Aspectran! (" + ip + ")";

    log.info(msg);

    return msg;
  }

  public String goodbye() {
    String msg = "Goodbye!";

    log.info(msg);

    return msg;
  }

}
```

## 5. 실행 및 결과

`helloWorld` Translet을 실행하기 위해 웹브라우저에서 다음 URL로 접근을 합니다.

* http://localhost:8080/ga-quick-start/helloWorld

다음과 같은 결과 화면이 출력됩니다.  
![실행 결과 화면]({{ site.baseurl }}/images/quickstart/quickstart-result1.png)

***전체 실행 과정을 요약하면 다음 순서와 같습니다.***

1. 요청 URI가 `/ga-quick-start/helloWorld`인 요청이 들어오면 요청 URI와 맵핑된 Translet이 요청을 건네받습니다.
2. Translet이 내부의 `simplestAction` Bean의 `helloWorld` Method를 실행하려고 하지만, Proxy Method입니다.
3. `simplestAction` Bean의 `helloWorld` Proxy Method는 자신이 실행되려면 먼저 Aspect 규칙을 처리해야 한다는 것을 Translet에게 통보합니다.
4. 먼저 `simplestAdvice` Bean의 `welcome` Method가 실행되면서 Console에 로그를 출력합니다.
5. Translet 내부의 `simplestAction` Bean의 `helloWorld` Method가 실행됩니다.
6. Translet은 실행 결과 값을 집계하여 `plain/text` 형식의 컨텐츠로 출력을 합니다.
7. `simplestAdvice` Bean의 `goodbye` Method가 실행되면서 Console에 로그를 출력합니다.

***Console에 기록된 로그***

```text
DEBUG translet {name=/ga-quick-start/helloWorld, requestRule={method=null, characterEncoding=null}, responseRule={name=null, characterEncoding=null, response=com.aspectran.core.activity.response.transform.TextTransform@5506e8ba} } ~com.aspectran.core.activity.CoreActivity^ready:144
DEBUG action {qualifiedActionId=null, actionType=bean, beanActionRule={id=null, bean=simplestAction, method=helloWorld, hidden=null}} ~com.aspectran.core.activity.CoreActivity^execute:611
DEBUG register AspectRule {id=simplestAdvice, for=translet, joinpointScope=translet, pointcutRule={pointcutType=null}, settingsAdviceRule=null, aspectAdviceRuleList=[{aspectId=simplestAdvice, aspectAdviceType=before, action={qualifiedActionId=null, actionType=bean, beanActionRule={id=null, bean=null, method=welcome, hidden=null}}}, {aspectId=simplestAdvice, aspectAdviceType=after, action={qualifiedActionId=null, actionType=bean, beanActionRule={id=null, bean=null, method=goodbye, hidden=null}}}], exceptionRule=null, onlyTransletRelevanted=false} ~com.aspectran.core.activity.CoreActivity^registerAspectRule:822
INFO  Welcome to Aspectran! (127.0.0.1) ~com.aspectran.example.simplest.SimplestAdvice^welcome:18
INFO  The message generated by my first aciton is: Hello, World. ~com.aspectran.example.simplest.SimplestAction^helloWorld:13
DEBUG response {transformType=transform/text, contentType=text/plain, characterEncoding=null, templateRule=null} ~com.aspectran.core.activity.response.transform.TextTransform^response:84
INFO  Goodbye! ~com.aspectran.example.simplest.SimplestAdvice^goodbye:26
```
