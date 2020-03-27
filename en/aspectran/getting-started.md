---
lang: en
layout: page
format: "plate solid article"
sidebar: toc-left
title: "Getting Started with Aspectran"
subheadline: ""
teaser: "Aspectran requires Java 8 or higher, and is built and deployed using Maven."
breadcrumb: true
permalink: /en/aspectran/getting-started/
---

## Requirements

Java version required for Aspectran-based application development is as follows.

* JDK 1.8 or higher

Maven is recommended as a build tool and dependency manager.

* Maven 3.4 or higher

Aspectran-based applications require several Aspectran JAR files in the execution environment, 
and these JAR files are published in the Maven repository.

## Maven

[![Maven central](https://maven-badges.herokuapp.com/maven-central/com.aspectran/aspectran-all/badge.svg#v{{ site.data.aspectran.stable_version }})](https://maven-badges.herokuapp.com/maven-central/com.aspectran/aspectran-all)

The latest released version can be downloaded directly from [here][1],
and you can find all Aspectran Maven artifacts at the following URL:  
[https://repo1.maven.org/maven2/com/aspectran/][2]

## Adding dependencies

Basically, to use Aspectran, the following definition including all dependencies can be added to pom.xml.
However, it is recommended to add only the dependency definition suitable for the execution environment of the Aspectran-based application to be built.

```xml
<!-- You can easily include all dependencies, but it is not recommended. -->
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-all</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```

The dependency definition according to the execution environment of Aspectran-based application is as follows.
In general, only one definition that fits the execution environment needs to be added.

To build a daemon application running in the background
```xml
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-daemon</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```

To build a command line application
```xml
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-shell</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```

To build a command line application that uses a feature-rich JLine
```xml
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-shell-jline</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```

To build a servlet-based web application
```xml
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-web</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```

To embed Aspectran in a Java application that is not based on Aspectran
```xml
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-embed</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```

In addition to defining dependencies according to the execution environment as above, 
the dependencies that can be additionally defined are as follows.

To integrate embedded Jetty to build a standalone web application
```xml
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-with-jetty</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```

To integrate Undertow to build a standalone web application
```xml
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-with-undertow</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```

To integrate MyBatis with easy access to relational databases
```xml
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-with-mybatis</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```

To integrate the text template engine FreeMarker
```xml
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-with-freemarker</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```

To integrate the text template engine Pebble
```xml
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-with-freemarker</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```

To use Redis Session Store with Lettuce or support session clustering
```xml
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-rss-lettuce</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```

[1]: https://search.maven.org/search?q=com.aspectran
[2]: https://repo1.maven.org/maven2/com/aspectran/

## Latest source code

[![Build Status](https://api.travis-ci.com/aspectran/aspectran.svg?branch=master)](https://travis-ci.com/github/aspectran/aspectran)
[![Coverage Status](https://coveralls.io/repos/github/aspectran/aspectran/badge.svg?branch=master)](https://coveralls.io/github/aspectran/aspectran?branch=master)
[![Sonatype Nexus (Snapshots)](https://img.shields.io/nexus/s/https/oss.sonatype.org/com.aspectran/aspectran.svg)](https://oss.sonatype.org/content/repositories/snapshots/com/aspectran/aspectran/)

Aspectran's latest source code is maintained on GitHub.

{% include label-link-box label="Aspectran releases on GitHub" href="https://github.com/aspectran/aspectran" %}

## API Reference

{% include link-box href=site.data.aspectran.api_site.url %}