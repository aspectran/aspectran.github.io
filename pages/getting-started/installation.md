---
layout: page
format: "plate solid article"
sidebar: toc_left
title: "Installation"
subheadline: ""
teaser: "Aspectran은 Java 8 이상을 필요로 하며, 최신 버전의 Java와도 호환성을 쉽게 유지할 수 있도록 개발되었습니다."
breadcrumb: true
permalink: /getting-started/installation/
---

## Requirements

Aspectran-based applications require Aspectran JAR files for their execution environment.
These JAR files are published to the Maven Repository, therefore you can use any Java build
tool to build an Aspectran project. 

* Java SE 1.8 or higher
* Maven 3.4 or higher

## Maven

[![Maven central](https://maven-badges.herokuapp.com/maven-central/com.aspectran/aspectran-all/badge.svg#v{{ site.data.aspectran.stable_version }})](https://maven-badges.herokuapp.com/maven-central/com.aspectran/aspectran-all)

If you're using Maven, you will find all Aspectran Maven artifacts directly in the central Maven repository here:  
[http://repo1.maven.org/maven2/com/aspectran/][1]

See [all versions available on the Maven Central Repository][2].

Use the following definition to use Aspectran in your maven project:

```xml
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-all</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```

Aspectran can also be used with more low-level jars:

```xml
<!-- To build a daemon application that runs in the background -->
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-daemon</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```
```xml
<!-- To embed Aspectran in your application -->
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-embed</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```
```xml
<!-- To build command-line based applications -->
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-shell</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```
```xml
<!-- To build command-line based applications that use the feature-rich JLine -->
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-shell-jline</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```
```xml
<!-- To build a servlet-based web application -->
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-web</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```
```xml
<!-- To build a web application server with embedded Jetty -->
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-with-jetty</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```
```xml
<!-- To build MyBatis applications on top of the Aspectran -->
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-with-mybatis</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```
```xml
<!-- To build a web application server with embedded Undertow -->
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-with-undertow</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```

Note that Aspectran 6 requires Java 8, so an explicit declaration of 1.8 compatibility to the compiler may also be required:

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.apache.maven.plugins</groupId>
      <artifactId>maven-compiler-plugin</artifactId>
      <configuration>
        <compilerVersion>1.8</compilerVersion>
        <source>1.8</source>
        <target>1.8</target>
      </configuration>
    </plugin>
  </plugins>
</build>
```

[1]: http://repo1.maven.org/maven2/com/aspectran/
[2]: https://search.maven.org/search?q=com.aspectran

## Latest release

[![Build Status](https://travis-ci.org/aspectran/aspectran.svg?branch=master)](https://travis-ci.org/aspectran/aspectran)
[![Coverage Status](https://coveralls.io/repos/github/aspectran/aspectran/badge.svg?branch=master)](https://coveralls.io/github/aspectran/aspectran?branch=master)
[![Maven central](https://maven-badges.herokuapp.com/maven-central/com.aspectran/aspectran/badge.svg#v6.6.0-RC2)](https://maven-badges.herokuapp.com/maven-central/com.aspectran/aspectran)
[![Sonatype Nexus (Snapshots)](https://img.shields.io/nexus/s/https/oss.sonatype.org/com.aspectran/aspectran.svg)](https://oss.sonatype.org/content/repositories/snapshots/com/aspectran/aspectran/)

Aspectran {{ site.data.aspectran.stable_version }} is the latest release and recommended version for all users.

{% include label-link-box label="Aspectran releases on GitHub" href="https://github.com/aspectran/aspectran/releases" %}

## API Reference

{% include link-box href=site.data.aspectran.api_site.url %}