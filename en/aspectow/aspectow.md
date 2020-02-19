---
lang: en
layout: page
sidebar: right
title: "About Aspectow"
subheadline: "What is Aspectow?"
teaser: "Aspectow is an all-in-one web application server built on Aspectran."
header:
  image_fullwidth: header_guides.jpg
  caption: Ultimate Raspberry Pi Backend Server
breadcrumb: true
comments: false
permalink: /en/aspectow/
---

```
     ___                         __
    /   |  _________  ___  _____/ /_____ _      __
   / /| | / ___/ __ \/ _ \/ ___/ __/ __ \ | /| / /
  / ___ |(__  ) /_/ /  __/ /__/ /_/ /_/ / |/ |/ /
 /_/  |_/____/ .___/\___/\___/\__/\____/|__/|__/    Light & Enterprise
=========== /_/ =======================================================
```

Aspectow is an all-in-one web application server based on Aspectran. It is divided into two products.

* **[Aspectran Light](/en/aspectow/aspectow-light)**  
  It is a lightweight version that does not support the servlet specification and is suitable for building high performance REST API services.
  JBoss's [Undertow](http://undertow.io) web server is built-in.

* **[Aspectran Enterprise](/en/aspectow/aspectow-enterprise)**  
  It fully supports the servlet specification and is suitable for building enterprise web applications.
  JBoss's [Undertow](http://undertow.io) or Eclipse [Jetty](https://www.eclipse.org/jetty/) can be used as a web server.
  [Apache Jasper](https://mvnrepository.com/artifact/org.mortbay.jasper/apache-jsp) is used to support JSP and it is the same JSP engine that Apache Tomcat uses.
  