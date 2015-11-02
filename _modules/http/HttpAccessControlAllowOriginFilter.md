---
layout: module
format: article
title:  "HttpAccessControlAllowOriginFilter"
subheadline: "Aspectran Modules - HTTP"
teaser: "Enabling Cross Origin Requests for a RESTful Web Service"
category: http
download:
  source: https://github.com/aspectran/aspectran-modules/tree/master/aspectran-http/src/main/java/com/aspectran/support/http
---

## Configuration

{% highlight xml %}
<bean id="httpAccessControlAllowOriginFilter" class="com.aspectran.support.http.HttpAccessControlAllowOriginFilter" scope="singleton">
  <property>
    <item name="withCredentials" valueType="boolean">true</item>
    <item name="origins" type="set">
      <value>http://www.aspectran.com</value>
      <value>http://localhost:4000</value>
    </item>
  </property>
</bean>

<aspect id="httpAccessControlAllowOriginFilterAspect">
  <joinpoint scope="translet">
    <pointcut>
      target: {
        +: "/example/**/*.json"
        +: "/example/**/*.xml"
      }
    </pointcut>
  </joinpoint>
  <advice bean="httpAccessControlAllowOriginFilter">
    <after>
      <action method="checkAccessControlAllowCredentials"/>
    </after>
  </advice>
</aspect>
{% endhighlight %}
