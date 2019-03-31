---
layout: page
format: "plate solid article"
title: "Download"
subheadline: "Aspectran Releases"
teaser: "Aspectran is a free and open source Java application framework."
breadcrumb: true
permalink: /getting-started/download/
---

## Latest release: {{ site.data.aspectran.stable_version }}

[![Build Status](https://travis-ci.org/aspectran/aspectran.svg)](https://travis-ci.org/aspectran/aspectran)
[![Coverage Status](https://coveralls.io/repos/aspectran/aspectran/badge.svg?branch=master&service=github)](https://coveralls.io/github/aspectran/aspectran?branch=master)

Aspectran {{ site.data.aspectran.stable_version }} is the latest release and recommended version for all users.

{% include label-link-box label="Aspectran project on GitHub" href="https://github.com/aspectran/aspectran" %}

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
  <version>6.0.0</version>
</dependency>
```

Aspectran can also be used with more low-level jars:
```xml
<!-- This can be used to build a daemon application that runs in the background. -->
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-daemon</artifactId>
  <version>6.0.0</version>
</dependency>
```
```xml
<!-- This can be used to build command-line based applications. -->
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-shell</artifactId>
  <version>6.0.0</version>
</dependency>
```
```xml
<!-- This can be used to build command-line based applications that use the feature-rich JLine. -->
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-shell-jline</artifactId>
  <version>6.0.0</version>
</dependency>
```
```xml
<!-- This can be used to build web applications. -->
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-web</artifactId>
  <version>6.0.0</version>
</dependency>
```
```xml
<!-- This can be used to embed Aspectran in your application. -->
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-embed</artifactId>
  <version>6.0.0</version>
</dependency>
```
```xml
<!-- This can be used to build a web application server with built-in Jetty. -->
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-with-jetty</artifactId>
  <version>6.0.0</version>
</dependency>
```
```xml
<!-- This can be used to build applications that use MyBatis. -->
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-with-mybatis</artifactId>
  <version>6.0.0</version>
</dependency>
```

Note that Aspectran 5 requires Java 8, so an explicit declaration of 1.8 compatibility to the compiler may also be required:

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
