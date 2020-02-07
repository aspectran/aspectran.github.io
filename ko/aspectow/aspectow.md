---
lang: ko
layout: page
format: article
sidebar: right
title: "Aspectow 소개"
subheadline: "What is Aspectow?"
teaser: "Aspectow는 올인원 웹어플리케이션 서버로써, Aspectran을 기반으로 만들졌습니다."
header:
  image_fullwidth: header_guides.jpg
  caption: Ultimate Raspberry Pi Backend Server
breadcrumb: true
comments: false
permalink: /aspectow/
---

```
     ___                         __
    /   |  _________  ___  _____/ /_____ _      __
   / /| | / ___/ __ \/ _ \/ ___/ __/ __ \ | /| / /
  / ___ |(__  ) /_/ /  __/ /__/ /_/ /_/ / |/ |/ /
 /_/  |_/____/ .___/\___/\___/\__/\____/|__/|__/    Light & Enterprise
=========== /_/ =======================================================
```

Aspectow는 Aspectran을 기반으로 제작된 올인원 웹애플리케이션 서버로써, 다음과 같은 두 개의 제품으로 구분됩니다.

* **[Aspectran Light](/aspectow/aspectow-light)**  
  서블릿 스펙을 지원하지 않는 경량 버전으로써, 고성능 REST API 서비스를 구축하기에 적합합니다.  
  JBoss의 [Undertow](http://undertow.io) 웹서버를 내장하고 있습니다.

* **[Aspectran Enterprise](/aspectow/aspectow-enterprise)**  
  서블릿 스펙을 완벽하게 지원하며, 기업용 웹애플리케이션 구축에 적합합니다.  
  JBoss의 [Undertow](http://undertow.io) 또는 Eclipse의 [Jetty](https://www.eclipse.org/jetty/)를 웹서버로 사용할 수 있으며,
  JSP 엔진으로는 Apache Tomcat이 사용하는 것과 동일한 [Apache Jasper](https://mvnrepository.com/artifact/org.mortbay.jasper/apache-jsp)가 사용되고 있습니다.
