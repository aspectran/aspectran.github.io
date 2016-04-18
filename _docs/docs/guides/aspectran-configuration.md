---
layout: page
format: article
sidebar: toc
title: "Aspectran Configuration"
subheadline: "User Guides"
teaser: "Aspectran 설정 메타데이터 구성요소에 대해서 설명합니다."
---

{% include alert warning='Draft 문서 입니다. 작성된 사항은 변경될 수 있음을 알려둡니다.' %}

## 1. 주요 구성요소

***Aspectran***이 구동되기 위해서는 구조화된 설정 메타데이터를 필요로 합니다.  
설정 메타데이터는 전통적인 XML 형식 또는 APON 형식의 파일로 작성해야 하며, 계층적으로 모듈화되어 여러 개의 파일로 나눌 수도 있습니다.

***Aspectran***은 설정 메타데이터를 자바 소스코드와 완전히 분리하는 것을 기본 원칙으로 합니다.  
어플리케이션 개발자가 작성하는 자바 소스코드는 POJO 형태를 최대한 유지할 수 있습니다.  
또한, 설정 메타데이터 구성에 필요한 요소는 오랜 시간에 걸쳐서 최적화가 되었기 때문에
최소한의 구성요소를 가지고도 다양한 설정이 가능합니다.

설정 메타데이터를 구성하는 대표적인 요소는 다음과 같습니다.

***settings***
: 기본 설정항목을 정의합니다.  
하위 설정 파일은 상위 설정 파일의 기본 설정 값을 물려 받습니다.

***aspect***
: Bean과 Translet이 가진 원래의 기능에 다른 부가 기능을 주입하는 방법을 정의합니다.  
관점지향프로그래밍(AOP)을 지원하기 위한 핵심 요소입니다.

***bean***
: IoC, DI의 대상이 되고, 기능을 가진 객체를 정의합니다.  
객체를 인스턴스화 하는 방법, 객체의 생명주기, 객체의 속성 값, 객체의 의존관계를 설정할 수 있습니다.

***translet***
: 요청 URI와 맵핑되어 비지니스 로직을 가지고 있는 Action Method를 호출하는 방법 및 응답 컨텐츠를 출력하는 방법을 정의합니다.

***import***
: 다른 설정 파일을 불러오는 방법을 정의합니다.

다음 예제는 XML 기반의 설정 메타데이터의 기본 구조를 보여주기 위해 작성되었습니다.
이 예제를 통하여 구성요소를 정의하는 방법에 대해서 알아 보겠습니다.

***getting-started.xml***
{% highlight xml %}
<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE aspectran PUBLIC "-//aspectran.com//DTD Aspectran 1.0//EN"
                           "http://aspectran.github.io/dtd/aspectran-1.0.dtd">

<aspectran>

  <description>
    Aspectran Tutorial 작성을 위한 Aspectran Configuration입니다.
  </description>

  <!-- 기본 설정 -->
  <settings>
    <setting name="transletNamePattern" value="/example/*"/>
  </settings>

  <bean id="*" mask="com.aspectran.example.**.*" class="com.aspectran.example.**.*Action" scope="singleton">
    <description>
      com.aspectran.eaxmple 패키지 하위의 모든 경로에서 클래스 이름이 "Action"으로 끝나는 클래스를
      모두 찾아서 Bean으로 등록합니다.
      만약 com.aspectran.example.sample.SampleAction 클래스가 검색되었다면
      Mask 패턴 "com.aspectran.example.**.*"에 의해 최종적으로 Bean ID는 "sample.SampleAction"이 됩니다.
    </description>
    <filter>
      exclude: [
        "com.aspectran.example.common.**.*"
        "com.aspectran.example.sample.**.*"
      ]
    </filter>
  </bean>

  <bean id="advice.*" mask="com.aspectran.example.**.*" class="com.aspectran.example.**.*Advice" scope="singleton">
    <description>
      com.aspectran.eaxmple 패키지 하위의 모든 경로에서 클래스 이름이 "Advice"으로 끝나는 클래스를
      모두 찾아서 ID가 "advice."으로 시작하는 Bean으로 등록합니다.
      만약 com.aspectran.example.sample.SampleAction 클래스가 검색되었다면
      Mask 패턴 "com.aspectran.example.**.*"에 의해 최종적으로 Bean ID는 "advice.sample.SampleAction"이 됩니다.
    </description>
    <filter class="com.aspectran.example.common.UserClassScanFilter"/>
  </bean>

  <bean id="sampleBean" class="com.aspectran.example.sample.SampleBean" scope="singleton"/>

  <bean id="multipartRequestWrapperResolver" class="com.aspectran.support.http.multipart.MultipartRequestWrapperResolver" scope="singleton">
    <description>
      multipart/form-data request를 처리하기 위해서 반드시 지정해야 합니다.
    </description>
    <property>
      <item name="maxRequestSize" value="10M"/>
      <item name="temporaryFilePath" value="/d:/temp"/>
      <item name="allowedFileExtensions" value=""/>
      <item name="deniedFileExtensions" value=""/>
    </property>
  </bean>

  <bean id="jspViewDispatcher" class="com.aspectran.web.view.JspViewDispatcher" scope="singleton">
    <description>
      Aspectran의 Translet이 처리한 결과값을 화면에 표현하기 위해 JSP를 이용합니다.
    </description>
    <property>
      <item name="templateFilePrefix">/WEB-INF/jsp/</item>
      <item name="templateFileSuffix">.jsp</item>
    </property>
  </bean>

  <aspect id="defaultRequestRule">
    <description>
      요청 정보를 분석하는 단계에서 사용할 기본 환경 변수를 정의합니다.
      multipart/form-data request를 처리하기 위해 multipartRequestWrapperResolver를 지정합니다.
    </description>
    <joinpoint scope="request"/>
    <settings>
      <setting name="characterEncoding" value="utf-8"/>
      <setting name="multipartRequestWrapperResolver" value="multipartRequestWrapperResolver"/>
    </settings>
  </aspect>

  <aspect id="defaultResponseRule">
    <description>
      요청에 대해 응답하는 단계에서 사용할 기본 환경 변수를 정의합니다.
      기본 viewDispatcher를 지정합니다.
    </description>
    <joinpoint scope="response"/>
    <settings>
      <setting name="characterEncoding" value="utf-8"/>
      <setting name="defaultContentType" value="text/html"/>
      <setting name="viewDispatcher" value="jspViewDispatcher"/>
    </settings>
  </aspect>

  <aspect id="defaultExceptionHandlingRule">
    <description>
      Translet의 이름이 "/example"로 시작하는 Translet을 실행하는 중에 발생하는 에러 처리 규칙을 정의합니다.
    </description>
    <joinpoint scope="translet">
      <pointcut>
        target: {
          translet: "/example/*"
        }
      </pointcut>
    </joinpoint>
    <exceptionRaised>
      <description>
        에러요인과 응답 컨텐츠의 형식에 따라 처리방식을 다르게 정할 수 있습니다.
        exceptionType을 지정하지 않으면 모든 exception에 반응합니다.
      </description>
      <responseByContentType exceptionType="java.lang.reflect.InvocationTargetException">
        <transform type="transform/xml" contentType="text/xml">
          <echo id="result">
            <item type="map">
              <value name="errorCode">E0001</value>
              <value name="message">error occured.</value>
            </item>
          </echo>
        </transform>
        <transform type="transform/json" contentType="application/json">
          <echo id="result">
            <item type="map">
              <value name="errorCode">E0001</value>
              <value name="message">error occured.</value>
            </item>
          </echo>
        </transform>
      </responseByContentType>
    </exceptionRaised>
  </aspect>

  <aspect id="helloWorldAdvice">
    <description>
      요청 URI가 "/example/"로 시작하고,
      helloworld.HelloWorldAction 빈에서 echo, helloWorld, counting 메쏘드 호출 전 후로
      환영인사와 작별인사를 건넵니다.
    </description>
    <joinpoint scope="translet">
      <pointcut>
        target: {
          +: "/example/**/*@helloworld.HelloWorldAction^echo|helloWorld|counting"
        }
      </pointcut>
    </joinpoint>
    <advice bean="advice.helloworld.HelloWorldAdvice">
      <before>
        <action method="welcome"/>
      </before>
      <after>
        <action method="goodbye"/>
      </after>
    </advice>
  </aspect>

  <aspect id="checkCountRangeAdvice">
    <description>
      요청 URI가 "/example/counting"이고,
      요청 헤더 분석을 완료한 시점에 advice.helloworld.HelloWorldAdvice 빈의 checkCountRange 메쏘드가 실행됩니다.
      checkCountRange 메쏘드는 카운팅할 숫자의 범위가 적합한지 검사합니다.
      만약 적합하지 않을 경우 안전한 값으로 변경합니다.
    </description>
    <joinpoint scope="request">
      <pointcut>
        target: {
          +: "/example/counting"
        }
      </pointcut>
    </joinpoint>
    <advice bean="advice.helloworld.HelloWorldAdvice">
      <after>
        <action method="checkCountRange"/>
      </after>
    </advice>
  </aspect>

  <translet name="echo">
    <description>
      "Hello, World."라는 문구를 텍스트 형식의 컨텐츠로 응답합니다.
      특정 Action을 실행하지 않아도 간단한 텍스트 기반의 컨텐츠를 생산할 수 있습니다.
    </description>
    <transform type="transform/text" contentType="text/plain">
      <template>
        Hello, World.
      </template>
    </transform>
  </translet>

  <translet name="helloWorld">
    <description>
      helloworld.HelloWorldAction 빈에서 helloWorld 메쏘드를 실행해서 "Hello, World."라는
      문구를 텍스트 형식의 컨텐츠로 응답합니다.
    </description>
    <transform type="transform/text" contentType="text/plain">
      <action bean="helloworld.HelloWorldAction" method="helloWorld"/>
    </transform>
  </translet>

  <translet name="counting">
    <description>
      시작 값과 마지막 값을 파라메터로 받아서 숫자를 출력하는 Translet입니다.
      request 영역의 attribute가 생성된 후에 숫자의 범위가 유효한지를 검사하는
      checkCountRangeAdvice Aspect가 작동됩니다.
    </description>
    <request>
      <attribute>
        <item name="from"/>
        <item name="to"/>
      </attribute>
    </request>
    <content>
      <action id="count1" bean="helloworld.HelloWorldAction" method="counting">
        <argument>
          <item valueType="int">@{from}</item>
          <item valueType="int">@{to}</item>
        </argument>
      </action>
    </content>
    <response>
      <transform type="transform/xml"/>
    </response>
  </translet>

  <translet name="*" path="/WEB-INF/jsp/**/*.jsp">
    <description>
      '/WEB-INF/jsp/' 디렉토리 하위 경로에서 모든 JSP 파일을 찾아서 Translet 등록을 자동으로 합니다.
      viewDispatcher는 defaultResponseRule Aspect에서 지정한 jspViewDispatcher를 사용합니다.
      검색된 jsp 파일의 경로는 template 요소의 file 속성 값으로 지정됩니다.
    </description>
    <dispatch>
      <template/>
    </dispatch>
  </translet>

  <!-- RESTful 방식의 Translet을 불러들입니다. -->
  <import file="/WEB-INF/aspectran/config/restful-translets.xml"/>

  <!-- 스케쥴러 환경설정을 불러들입니다. -->
  <import file="/WEB-INF/aspectran/config/example-scheduler.xml"/>

</aspectran>
{% endhighlight %}

## 2. 기본 설정 항목

설정 메타데이터 파일은 기본 설정 구성요소인 `settings` 엘리먼트를 가질 수 있습니다.
만약 설정 메타데이터 파일이 다른 설정 메타데이터 파일을 포함하고 있다면, 기본 설정 항목은 하위 설정 메타데이터 파일로 상속이 됩니다.
하위 설정 메타데이터 파일은 상속 받은 기본 설정 항목을 재설정해서 사용할 수 있습니다.

`settings` 엘리먼트는 다음과 같은 Aspectran의 기본 설정 항목을 가질 수 있습니다.

**transletNamePattern**
: Translet 이름의 패턴. Translet 이름 문자열은 `<servlet-mapping>` 의 `<url-pattern>`의 값으로 시작해야 접근이 가능합니다.

**transletNamePrefix**
: `transletNamePattern` 대신 prefix와 suffix를 지정할 수 있습니다.

**transletNameSuffix**
: `transletNamePattern` 대신 prefix와 suffix를 지정할 수 있습니다.

**transletInterfaceClass**
: 사용자 정의 Translet의 인터페이스 클래스를 지정합니다.

**nullableContentId**
: `<content>`의 id 속성을 생략할 수 있는지 여부를 지정합니다.

**nullableActionId**
: `<action>`의 id 속성을 생략할 수 있는지 여부를 지정합니다.

**beanProxifier**
: 자바 바이트코드 생성기(Byte Code Instumentation, BCI) 라이브러리를 지정합니다.

**pointcutPatternVerifiable**
: pointcut 패턴의 유효성을 체크할지 여부를 지정합니다.

기본 설정 항목 별로 사용가능한 값과 기본 값은 다음과 같습니다.

| 기본 설정 항목 | 사용가능한 값 | 기본 값 |
|---|---|---|
| **transletNamePattern** | /example/*.do | 설정하지 않음 |
| **transletNamePrefix** | /example/ | 설정하지 않음 |
| **transletNameSuffix** | .do | 설정하지 않음 |
| **transletInterfaceClass** | com.aspectran.example.common.MyTranslet | 설정하지 않으면 내장 Translet을 사용 |
| **transletImplementClass** | com.aspectran.example.common.MyTransletImpl | 설정하지 않으면 내장 Translet을 사용 |
| **nullableContentId** | true, false | true |
| **nullableActionId** | true, false | true |
| **beanProxifier** | javassist, cglib, jdk | javassist |
| **pointcutPatternVerifiable** | true, false | true |

기본 설정 항목을 모두 사용한 `settings` 엘리먼트의 예제입니다.

{% highlight xml %}
<settings>
    <setting name="transletNamePattern" value="/example/*"/>
    <setting name="transletInterfaceClass" value="com.aspectran.example.common.MyTranslet"/>
    <setting name="transletImplementClass" value="com.aspectran.example.common.MyTransletImpl"/>
    <setting name="nullableContentId" value="true"/>
    <setting name="nullableActionId" value="true"/>
    <setting name="beanProxifier" value="javassist"/>
    <setting name="pointcutPatternVerifiable" value="true"/>
</settings>
{% endhighlight %}

## 3. Bean 정의

특정 기능을 가진 객체를 모두 Bean으로 정의할 수 있습니다.
Aspectran은 정의된 Bean을 객체로 생성하고 객체간의 관계 설정, 생명주기 관리등의 기능을 제공합니다.

### 3.1 단일 Bean 정의
중요한 역할을 하는 Bean 또는 별도의 속성을 가지는 Bean은 단독으로 정의합니다.

{% highlight xml %}
<!-- Aspectran의 Translet이 처리한 결과값을 화면에 표현하기 위해 JSP를 이용합니다. -->
<bean id="jspViewDispatcher" class="com.aspectran.web.view.JspViewDispatcher" scope="singleton">
  <property>
    <item name="templatePathPrefix">/WEB-INF/jsp/</item>
    <item name="templatePathSuffix">.jsp</item>
  </property>
</bean>
{% endhighlight %}
{% highlight xml %}
<bean id="*" class="com.aspectran.example.sample.SampleBean" scope="singleton"/>
{% endhighlight %}

> `id` 속성값으로 `*` 문자를 지정하면 클래스명이 Bean ID로 지정됩니다.

### 3.2 일괄 Bean 정의

와일드카드를 사용하면 클래스패스에 존재하는 Bean을 일괄 검색해서 한꺼번에 정의할 수 있습니다.

> `class` 속성 값에 사용할 수 있는 와일드카드 문자들은  `*, ?, +` 이고, Escape 문자로 `\` 문자를 사용할 수 있습니다.
> 여러 패키지를 포함할 경우 `.**.` 문자를 중간에 사용하면 되는데, 예를들어 `com.**.service.*.*Action`과 같이 사용할 수 있습니다.

{% highlight xml %}
<beans id="*" class="com.aspectran.example.**.*" class="com.aspectran.example.**.*Action" scope="singleton"/>
{% endhighlight %}

> 위 예제에 대한 설명입니다.  
> `com.aspectran.eaxmple` 패키지 하위의 모든 경로에서 클래스 이름이 "Action"으로 끝나는 클래스를
> 모두 찾아서 Bean으로 등록합니다.
> 만약 `com.aspectran.example.sample.SampleAction` 클래스가 검색되었다면
> Mask 패턴 `com.aspectran.example.**.*`에 의해 최종적으로 Bean의 ID는 `sample.SampleAction`이 됩니다.  
> Mask 패턴에 해당하는 문자열은 제거가 됩니다.

`filter` 엘리멘트를 이용해서 일괄 검색에서 제외할 클래스를 지정할 수 있습니다.

{% highlight xml %}
<bean id="advice.*" mask="com.aspectran.example.**.*" class="com.aspectran.example.**.*Advice" scope="singleton">
	<filter>
		exclude: [
			"com.aspectran.example.common.**.*"
			"com.aspectran.example.sample.**.*"
		]
	</filter>
</bean>
{% endhighlight %}

> 위 예제에 대한 설명입니다.  
> `com.aspectran.eaxmple` 패키지 하위의 모든 경로에서 클래스 이름이 "Advice"으로 끝나는 클래스를
> 모두 찾아서 ID가 `advice.`으로 시작하는 Bean으로 등록합니다.
> 만약 `com.aspectran.example.sample.SampleAction` 클래스가 검색되었다면
> Mask 패턴 `com.aspectran.example.**.*`에 의해 최종적으로 Bean의 ID는 `advice.sample.SampleAction`이 됩니다.
> `filter` 엘리멘트의 `exclude` 파라메터는 배열로 두 개의 제외 패턴 문자열 값을 가지고 있습니다.
> 제외 패턴에 해당하는 클래스는 검색 결과에서 제외됩니다.

사용자 정의 필터 클래스를 지정할 수 있습니다.  
[`com.aspectran.core.context.bean.scan.BeanClassScanFilter`](https://github.com/topframe/aspectran/blob/master/src/main/java/com/aspectran/core/context/bean/scan/BeanClassScanFilter.java) 인터페이스를 구현해야 합니다.

{% highlight xml %}
<bean id="advice.*" mask="com.aspectran.example.**.*" class="com.aspectran.example.**.*Advice" scope="singleton">
	<filter class="com.aspectran.example.common.UserClassScanFilter"/>
</bean>
{% endhighlight %}

사용자 정의 필터 클래스 작성 예제:

{% highlight java %}
package com.aspectran.example.common;

import com.aspectran.core.context.bean.scan.BeanClassScanFilter;

public class UserClassScanFilter implements BeanClassScanFilter {

	public String filter(String beanId, String resourceName, Class<?> scannedClass) {
		return beanId;
	}

}
{% endhighlight %}


### 3.3 Bean ID 부여 규칙

1. 일차적으로 검색된 클래스명을 Bean의 ID로 사용합니다.
2. Mask 패턴을 지정하면 Bean ID에서 불필요한 문자열을 제거할 수 있습니다.  
3. `id` 속성의 값이 `*`이면 검색된 Bean ID 또는 클래스명을 그대로 사용합니다.
4. `id` 속성의 값이 `advice.*`이면 Bean ID 앞에 `advice.` 문자열을 붙입니다.
5. `id` 속성의 값이 `*Action`이면 Bean ID 뒤에 `Action` 문자열을 붙입니다.

예를 들어  
id가 `advice.*`이고,  
mask가 `com.aspectran.example.**.*`이고,  
class가 `com.aspectran.example.**.*Action`이고,  
검색된 클래스의 이름이 `com.aspectran.example.hellloworld.HelloWorldAction`이면  
최종적으로 Bean의 ID는  
`advice.hellloworld.HelloWorldAction` 됩니다.

### 3.4 상세한 Bean 정의 방법

다음 예제를 기준으로 Bean을 정의하기 위해 사용되는 엘리멘트에 대해 설명합니다.

{% highlight xml %}
<bean id="sampleBean">
    <features>
        <class>com.aspectran.sample.SampleAction</class>
        <scope>singleton</scope>
        <initMethod>initialize</initMethod>
        <destroyMethod>destory</destroyMethod>
        <lazyInit>true</lazyInit>
    </features>
    <constructor>
        <argument>
            <item>arg1</item>
            <item type="list" valueType="int">
              <value>1</value>
              <value>2</value>
              <value>3</value>
            </item>
        </argument>
    </constructor>
    <property>
        <item name="name">david</item>
        <item name="grade" type="list">
            <value>A</value>
            <value>B</value>
        </item>
        <item name="amount" type="map">
            <value name="food" valueType="float">123456</value>
            <value name="transportation expenses" valueType="1234">value</value>
        </item>
        <item name="anotherBean">
            <reference bean="anotherBean"/>
        </item>
    </property>
</bean>
{% endhighlight %}

**bean**
: Bean을 정의하기 위한 최상위 엘리멘트입니다.
`mask` 속성 외에 `features` 엘리멘트의 하위 엘리멘트를 속성으로 가질 수 있습니다.

**bean.features**
: Bean의 기본 스펙을 정의하는 엘리멘트입니다.

**bean.features.class**
: Bean의 클래스명을 지정합니다.


## 4. Aspect 정의

***Aspectran***이 지원하는 AOP(Aspect Oriented Programming)는 다른 프레임웤에 비해 사용법이 쉽습니다.
Aspectran의 AOP는 Translet, Bean 영역 내에서의 메쏘드 호출 조인포인트(Joingpoint)를 지원합니다.

Aspect는 주로 다음과 같은 용도로 사용될 수 있습니다.

핵심 비지니스 로직과 공통적인 부가 비지니스 로직을 분리해서 코드를 작성할 수 있습니다.
: ex) 로깅, 인증, 권한, 성능 테스트

트랜잭션 처리
: 주로 데이터베이스 트랜잭션 기능을 지원하기 사용합니다.

### 4.1 Aspect를 이용해서 환경변수 선언하기

Aspectran은 외부의 접속 요청을 Translet이 받아서 처리합니다.
Translet의 내부에는 Request, Contents, Response 라는 세 가지 영역이 있습니다.
Aspect를 이용하면 Translet과 Request, Contents, Response 영역에서 필요로 하는 공통 환경변수에 값을 주입할 수 있습니다.

> **Translet 내부의 세 가지 영역**  
> Request: 요청 정보를 분석하는 영역  
> Contents: 액션을 실행하고 결과 값을 생산하는 영역  
> Response: 생산된 결과 값을 출력하는 영역

{% highlight xml %}
<aspect id="defaultRequestRule">
    <description>
        요청 정보를 분석하는 단계에서 사용할 기본 환경 변수를 정의합니다.
        multipart/form-data request를 처리하기 위해 multipartRequestWrapperResolver를 지정합니다.
    </description>
    <joinpoint scope="request"/>
    <settings>
        <setting name="characterEncoding" value="utf-8"/>
        <setting name="multipartRequestWrapperResolver" value="multipartRequestWrapperResolver"/>
    </settings>
</aspect>

<aspect id="defaultResponseRule">
    <description>
        요청에 대해 응답하는 단계에서 사용할 기본 환경 변수를 정의합니다.
        기본 viewDispatcher를 지정합니다.
    </description>
    <joinpoint scope="response"/>
    <settings>
        <setting name="characterEncoding" value="utf-8"/>
        <setting name="defaultContentType" value="text/html"/>
        <setting name="viewDispatcher" value="jspViewDispatcher"/>
    </settings>
</aspect>
{% endhighlight %}

**각 영역에서 환경변수의 값을 참조하는 방법**

## 5. Translet 정의

## 6. 다른 설정 메타데이터 파일 포함하기

## 7. 변수 정의 및 값의 할당

### 7.1 변수 정의하고 값을 할당하는 방법

### 7.2 동적으로 변수의 값을 할당하는 방법

### 7.3 Aspectran Expression Language

(계속 작성 중입니다.)
