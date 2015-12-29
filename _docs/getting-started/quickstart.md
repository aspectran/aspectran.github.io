---
layout: page
format: article
title: "Quick Start Guide"
subheadline: "Getting Started with Aspectran"
teaser: "Aspectran의 사용법을 빠르게 습득할 수 있도록 간단한 예제와 함께 설명합니다."
article_heading: true
breadcrumb: true
sidebar: toc
---

## 1. Aspectran 라이브러리 다운로드

Aspectran 홈페이지의 [다운로드](http://www.aspectran.com/downloads/) 페이지에서 jar 라이브러리의 복사본을 받을 수 있습니다.

또한 다음과 같은 필수 의존 라이브러리를 필요로 합니다.

* javassist or cglib
* commons-fileupload
* commons-io
* logging 라이브러리(commons-logging, log4j, slf4j)

Maven을 사용한다면 pom.xml에 다음 설정을 추가하세요.

{% highlight xml %}
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran</artifactId>
  <version>1.5.0</version>
</dependency>
{% endhighlight %}


## 2. 웹 프로젝트 생성

Aspectran을 사용해서 Java 웹 어플리케이션을 개발하기 위해서는 다음 요건을 충족해야 합니다.

* Java 6 이상
* Servlet 2.5 이상

빠른 시작을 위해 다음 GitHub 저장소를 Clone 또는 소스 파일을 다운로드해서 새로운 웹 프로젝트를 생성해 주세요.
이클립스 프로젝트 설정 파일과 본 문서에서 필요로 하는 모든 파일이 포함되어 있습니다.

{% include link-box href="https://github.com/aspectran-guides/quick-start.git" %}


## 3. 웹 컨테이너에 서블릿으로 등록하기

***Aspectran*** 구동에 필요한 초기화 파라메터 `aspectran:config`를 정의하고,
`AspectranServiceListener`를 등록해서 `ActivityContext`를 생성하도록 합니다.

요청 URI가 `/ga-quick-start/`이면 `WebActivityServlet`라는 서블릿이 처리하도록 했습니다.
스케쥴러를 사용할 경우 개발환경에서 Job을 직접 실행해 볼 수 있도록 `/scheduler/`로 시작하는 URL도 맵핑했습니다.

만약 `WebActivityServlet`라는 서블릿이 처리하지 못하는 요청은 `DefaultServlet`으로 처리권을 넘겨줍니다.
`DefaultServlet`의 이름은 명시적으로 지정하지 않았지만, 내부적으로 웹어플리케이션 서버 종류에 따라서 자동으로 판단합니다.
잘 알려진 웹어플리케이션 서버가 아닐 경우 `DefaultServlet`의 이름을 수동으로 명시할 수도 있습니다.

[***web.xml***](https://github.com/aspectran-guides/ga-quick-start/blob/master/src/main/webapp/WEB-INF/web.xml){:target="_blank"}
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
      root: "/WEB-INF/aspectran/config/simplest-configuration.xml"
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
    <url-pattern>/*</url-pattern>
  </servlet-mapping>
  <!-- 실제 운영환경에서는 스케쥴러의 Job에 직접 접근할 수 없도록 서블릿매핑을 제거하도록 합니다. -->
  <servlet-mapping>
    <servlet-name>aspectran-example</servlet-name>
    <url-pattern>/scheduler/*</url-pattern>
  </servlet-mapping>
</web-app>
{% endhighlight %}

### 3.1 초기화 파라메터 정의

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

### 3.2 AspectranServiceListener 등록
`<listner-class>`에  `com.aspectran.web.startup.listener.AspectranServiceListener`를 지정합니다.
AspectranServiceListener는 컨텍스트 초기화 파라메터 `aspectran:config`의 설정 내용으로 Aspectran 서비스 환경을 구성하고, Application Scope를 가지고 있습니다.

> AspectranServiceListener에 의해 기동된 Aspectran 서비스는 여러 WebActivityServlet에서 사용될 수 있습니다.
> 즉, 전역적인 하나의 Aspectran 서비스 환경을 구성할 수 있습니다.

### 3.3 WebActivityServlet 등록
`<servlet-class>`에 `com.aspectran.web.startup.servlet.WebActivityServlet`을 지정합니다.
`<servlet-name>`에는 Aspectran 서비스를 위한 서블릿이라는 의미의 고유한 서블릿 이름을 부여해 주기 바랍니다.

> 서블릿 초기화 파라메터로 `aspectran:cofnig`를 정의하면 서블릿만의 단독 Aspectran 서비스 환경을 구성합니다.
> 즉, 전역 Aspectran 서비스를 사용하지 않습니다.

### 3.4 서블릿 URL 패턴 등록
`<url-pattern>`에 해당하는 요청은 `WebActivityServlet`이 처리할 수 있도록 합니다.
만약 `<url-pattern>`을 `/ga-quick-start/*`로 지정하면 `/ga-quick-start/`로 시작하는 이름을 가진 Translet이 실행됩니다.

> Aspectran의 Translet이란?
> 요청을 받고 결과 값을 적절히 가공해서 응답하는 처리자를 Aspectran 내부에서는 Translet이라고 명명하였습니다.
> Translet은 고유 이름을 가지고 있으며, 요청 URI와 직접적으로 매핑이 됩니다.
> 스케쥴러의 Job도 Translet을 통해서 실행이 됩니다.

### 3.5 DefaultServlet 이름 지정하기
요청 URI에 해당하는 Translet이 존재하지 않을 경우 서블릿 컨테이너의 DefaultServlet에게 넘겨주는 역할을 하는 핸들러가 항상 동작하고 있습니다.
그 핸들러의 이름은 DefaultServletHttpRequestHandler입니다. DefaultServletHttpRequestHandler는 DefaultServlet의 이름이 무엇인지 자동으로 판단합니다.
만약 DefaultServlet의 이름이 다르게 지정되어야 할 경우 아래와 같은 초기화 파라메터를 추가합니다.

{% highlight xml %}
<context-param>
    <param-name>aspectran:defaultServletName</param-name>
    <param-value>default</param-value>
</context-param>
{% endhighlight %}


## 4. 설정 메타데이터 작성

***Aspectran***이 구동되기 위해서는 구조화된 설정 메타데이터를 필요로 합니다.  
설정 메타데이터는 전통적인 XML 형식 또는 APON 형식의 파일로 작성해야 하며, 계층적으로 모듈화되어 여러 개의 파일로 나뉠 수 있습니다.

***Aspectran***을 대표하는 3개의 핵심 구성요소는 다음과 같습니다.

* ***aspect*** - Bean과 Translet이 가진 원래의 기능에 다른 부가 기능을 주입하는 방법을 정의합니다.  
관점지향프로그래밍(AOP)을 지원하기 위한 핵심 요소입니다.
* ***bean*** - IoC, DI의 대상이 되고, 기능을 가진 객체를 정의합니다.  
객체를 인스턴스화 하는 방법, 객체의 생명주기, 객체의 속성 값, 객체의 의존관계를 설정할 수 있습니다.
* ***translet*** - 요청 URI와 맵핑되어 비지니스 로직을 가지고 있는 Action Method를 호출하는 방법 및 응답 컨텐츠를 출력하는 방법을 정의합니다.

> 설정 메타데이터 작성법에 관한 상세한 설명은 Aspectran Configuration 문서를 참조해 주시기 바랍니다.

3개의 핵심 구성요소를 이용해서 "Hello, World." 문자열을 출력하는 설정 메타데이터를 XML 파일로 다음과 같이 작성하였습니다.
Aspectran의 AOP 기능을 이용하여 "Hello, World." 문자열을 출력하는 Action을 호출하기 전과 후에 특정 동작을 주입합니다.

[***simplest-configuration.xml***](https://github.com/aspectran-guides/ga-quick-start/blob/master/src/main/webapp/WEB-INF/aspectran/config/simplest-configuration.xml){:target="_blank"}

{% highlight xml %}
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE aspectran PUBLIC "-//aspectran.com//DTD Aspectran 1.0//EN"
                           "http://aspectran.github.io/dtd/aspectran-1.0.dtd">

<aspectran>

  <description>
    Quick Start Guide를 위한 Aspectran Configuration입니다.
  </description>

  <!-- 기본 설정 -->
  <settings>
    <setting name="transletNamePattern" value="/ga-quick-start/*"/>
  </settings>

  <bean id="simplestAction" class="hello.SimplestAction" scope="singleton">
    <description>
      Action Method를 가지고 있는 singleton 스코프를 가지는 Bean을 정의합니다.
    </description>
  </bean>

  <bean id="simplestAdvice" class="hello.SimplestAdvice" scope="singleton">
    <description>
      Action Method 실행 전 후에 주입할 Advice Action Method를 가지고 있는
      singleton 스코프를 가지는 Bean을 정의합니다.
    </description>
  </bean>

  <aspect id="simplestAdvice">
    <description>
      요청 URI가 "/ga-quick-start/"로 시작하고,
      simplestAction Bean의 helloWorld 메쏘드를 실행하는 Translet이 발견되면,
      해당 Translet의 실행 전에는 simplestAdvice Bean의 wellcome 메쏘드를 실행하고,
      해당 Translet의 실행 후에는 simplestAdvice Bean의 goodbye 메쏘드를 실행합니다.
    </description>
    <joinpoint scope="translet">
      <pointcut>
        target: {
          +: "/ga-quick-start/*@simplestAction^helloWorld"
        }
      </pointcut>
    </joinpoint>
    <advice bean="simplestAdvice">
      <before>
        <action method="wellcome"/>
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
{% endhighlight %}

## 5. Bean 작성하기

"Hello, World." 문자열을 출력하는 Action을 담고 있는 자바 클래스를 작성합니다.

[***SimplestAction.java***](https://github.com/aspectran-guides/ga-quick-start/blob/master/src/main/java/hello/SimplestAction.java){:target="_blank"}

{% highlight java %}
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
{% endhighlight %}

"Hello, World." 문자열을 출력하는 Action을 호출하기 전과 후에 실행되는 Action을 담고 있는 자바 클래스를 작성합니다.

[***SimplestAdvice.java***](https://github.com/aspectran-guides/ga-quick-start/blob/master/src/main/java/hello/SimplestAdvice.java){:target="_blank"}

{% highlight java %}
package hello;

import javax.servlet.http.HttpServletRequest;

import com.aspectran.core.activity.Translet;
import com.aspectran.core.util.logging.Log;
import com.aspectran.core.util.logging.LogFactory;

public class SimplestAdvice {

  private final Log log = LogFactory.getLog(SimplestAdvice.class);

  public String wellcome(Translet translet) {
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
{% endhighlight %}

## 6. 실행 및 결과

`helloWorld` Translet을 실행하기 위해 웹브라우저에서 다음 URL로 접근을 합니다.

* http://localhost:8080/ga-quick-start/helloWorld

다음과 같은 결과 화면이 출력됩니다.
![실행 결과 화면]({{ site.baseurl}}/images/quickstart/quickstart-result1.png)

***전체 실행 과정을 요약하면 다음 순서와 같습니다.***

<div class="panel radius" markdown="1">
1. 요청 URI가 `/ga-quick-start/helloWorld`인 요청이 들어오면 요청 URI와 맵핑된 Translet이 요청을 건네받습니다.
2. Translet이 내부의 `simplestAction` Bean의 `helloWorld` Method를 실행하려고 하지만, Proxy Method입니다.
3. `simplestAction` Bean의 `helloWorld` Proxy Method는 자신이 실행되려면 먼저 Aspect 규칙을 처리해야 한다는 것을 Translet에게 통보합니다.
4. 먼저 `simplestAdvice` Bean의 `wellcome` Method가 실행되면서 Console에 로그를 출력합니다.
5. Translet 내부의 `simplestAction` Bean의 `helloWorld` Method가 실행됩니다.
6. Translet은 실행 결과 값을 집계하여 `plain/text` 형식의 컨텐츠로 출력을 합니다.
7. `simplestAdvice` Bean의 `goodbye` Method가 실행되면서 Console에 로그를 출력합니다.
</div>

***Console에 기록된 로그***

{% highlight text linenos %}
DEBUG translet {name=/ga-quick-start/helloWorld, requestRule={method=null, characterEncoding=null}, responseRule={name=null, characterEncoding=null, response=com.aspectran.core.activity.response.transform.TextTransform@5506e8ba} } ~com.aspectran.core.activity.CoreActivity^ready:144
DEBUG action {qualifiedActionId=null, actionType=bean, beanActionRule={id=null, bean=simplestAction, method=helloWorld, hidden=null}} ~com.aspectran.core.activity.CoreActivity^execute:611
DEBUG register AspectRule {id=simplestAdvice, for=translet, joinpointScope=translet, pointcutRule={pointcutType=null}, settingsAdviceRule=null, aspectAdviceRuleList=[{aspectId=simplestAdvice, aspectAdviceType=before, action={qualifiedActionId=null, actionType=bean, beanActionRule={id=null, bean=null, method=wellcome, hidden=null}}}, {aspectId=simplestAdvice, aspectAdviceType=after, action={qualifiedActionId=null, actionType=bean, beanActionRule={id=null, bean=null, method=goodbye, hidden=null}}}], exceptionHandlingRule=null, onlyTransletRelevanted=false} ~com.aspectran.core.activity.CoreActivity^registerAspectRule:822
INFO  Welcome to Aspectran! (127.0.0.1) ~com.aspectran.example.simplest.SimplestAdvice^wellcome:18
INFO  The message generated by my first aciton is: Hello, World. ~com.aspectran.example.simplest.SimplestAction^helloWorld:13
DEBUG response {transformType=transform/text, contentType=text/plain, characterEncoding=null, templateRule=null} ~com.aspectran.core.activity.response.transform.TextTransform^response:84
INFO  Goodbye! ~com.aspectran.example.simplest.SimplestAdvice^goodbye:26
{% endhighlight %}
