---
layout: module
format: article
title:  HttpAccessControlAllowOriginFilter
subheadline: Aspectran Modules - HTTP
teaser: Enabling Cross Origin Requests for a RESTful Web Service
category: HTTP
download:
  source: https://github.com/aspectran/aspectran-modules/blob/master/aspectran-http/src/main/java/com/aspectran/support/http/HttpAccessControlAllowOriginFilter.java
---

## Configuration

```xml
<bean id="httpAccessControlAllowOriginFilter" class="com.aspectran.support.http.HttpAccessControlAllowOriginFilter">
    <property>
        <item name="withCredentials" valueType="boolean">true</item>
        <item name="origins" type="set">
            <value>https://www.aspectran.com</value>
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
```
