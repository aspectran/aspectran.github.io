---
layout: page
format: "plate solid article"
title: "Downloads"
subheadline: "Aspectran Releases"
teaser: "Aspectran is a free and open source Java application framework."
breadcrumb: true
permalink: /getting-started/downloads/
---

## Latest release: {{ site.data.aspectran.stable_version }}

[![Build Status](https://travis-ci.org/aspectran/aspectran.svg)](https://travis-ci.org/aspectran/aspectran)
[![Coverage Status](https://coveralls.io/repos/aspectran/aspectran/badge.svg?branch=master&service=github)](https://coveralls.io/github/aspectran/aspectran?branch=master)

Aspectran {{ site.data.aspectran.stable_version }} is the latest release and recommended version for all users.

{% include label-link-box label="Aspectran project on GitHub" href="https://github.com/aspectran/aspectran" %}

## Maven

[![Maven central](https://maven-badges.herokuapp.com/maven-central/com.aspectran/aspectran-all/badge.svg)](https://maven-badges.herokuapp.com/maven-central/com.aspectran/aspectran-all)

If you're using Maven, you will find all Aspectran Maven artifacts directly in the central Maven repository here:  
[http://repo1.maven.org/maven2/com/aspectran/aspectran-all/][1]

See [all versions available on the Maven Central Repository][2].

***Artifact information (Maven Central)***

| Group Id      | Artifact Id        | Version    | Download                                                   |
|---------------|--------------------|------------|------------------------------------------------------------|
| com.aspectran | [aspectran-all][3] | [{{ site.data.aspectran.stable_version }}][4] | [pom][5], [jar][6], [javadoc (jar)][7], [sources (jar)][8] |

Use the following definition to use Aspectran in your maven project:

{% highlight xml %}
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-all</artifactId>
  <version>5.0.0.RC1</version>
</dependency>
{% endhighlight %}

Aspectran can also be used with more low-level jars:

{% highlight xml %}
<!-- You can use this to build a command line application. -->
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-shell</artifactId>
  <version>5.0.0.RC1</version>
</dependency>
<!-- You can use this as a library for building other applications. -->
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-embed</artifactId>
  <version>5.0.0.RC1</version>
</dependency>
<!-- You can use it to build a web application. -->
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-web</artifactId>
  <version>5.0.0.RC1</version>
</dependency>
<!-- You can use it to build a web application with built-in Jetty 9. -->
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-with-jetty</artifactId>
  <version>5.0.0.RC1</version>
</dependency>
{% endhighlight %}

Note that Aspectran 5 requires Java 8, so an explicit declaration of 1.8 compatibility to the compiler may also be required:

{% highlight xml %}
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
{% endhighlight %}


[1]: http://repo1.maven.org/maven2/com/aspectran/aspectran-all/
[2]: http://search.maven.org/#search%7Cga%7C1%7Cg%3A%22com.aspectran%22
[3]: http://search.maven.org/#search|ga|1|a%3A%22aspectran-all%22
[4]: http://search.maven.org/#artifactdetails|com.aspectran|aspectran-all|{{ site.data.aspectran.stable_version }}|jar
[5]: http://search.maven.org/remotecontent?filepath=com/aspectran/aspectran-all/{{ site.data.aspectran.stable_version }}/aspectran-{{ site.data.aspectran.stable_version }}.pom
[6]: http://search.maven.org/remotecontent?filepath=com/aspectran/aspectran-all/{{ site.data.aspectran.stable_version }}/aspectran-{{ site.data.aspectran.stable_version }}.jar
[7]: http://search.maven.org/remotecontent?filepath=com/aspectran/aspectran-all/{{ site.data.aspectran.stable_version }}/aspectran-{{ site.data.aspectran.stable_version }}-javadoc.jar
[8]: http://search.maven.org/remotecontent?filepath=com/aspectran/aspectran-all/{{ site.data.aspectran.stable_version }}/aspectran-{{ site.data.aspectran.stable_version }}-sources.jar
