---
layout: page
format: "plate solid"
title: "Download"
subheadline: "Aspectran Releases"
teaser: "Aspectran is an open source, free of charge, based on the Apache 2.0 License."
---

## Latest stable release: 2.4.0

[![Build Status](https://travis-ci.org/aspectran/aspectran.svg)](https://travis-ci.org/aspectran/aspectran)
[![Dependency Status](https://www.versioneye.com/user/projects/56eec08e35630e0029dafca6/badge.svg?style=flat)](https://www.versioneye.com/user/projects/56eec08e35630e0029dafca6)

Aspectran is open source. It's hosted, developed, and maintained on GitHub.

{% include label-link-box label="Aspectran projects on GitHub" href="https://github.com/aspectran/aspectran" %}

## Maven

[![Maven central](https://maven-badges.herokuapp.com/maven-central/com.aspectran/aspectran/badge.svg)](https://maven-badges.herokuapp.com/maven-central/com.aspectran/aspectran)
[![Dependency Status](https://www.versioneye.com/user/projects/56eec08e35630e0029dafca6/badge.svg?style=flat)](https://www.versioneye.com/user/projects/56eec08e35630e0029dafca6)

If you're using Maven, you will find all Aspectran Maven artifacts directly in the central Maven repository here: [http://repo1.maven.org/maven2/com/aspectran/aspectran/][1]

See [all versions available on the Maven Central Repository][2].

***Artifact information (Maven Central)***

| Group Id | Artifact Id | Version | Download |
|----------|-------------|---------|----------|
| com.aspectran | [aspectran][3] | [2.4.0][4] | [pom][5] [jar][6] [javadoc (jar)][7] [sources (jar)][8] |

Add the following dependency to your pom.xml:

{% highlight xml %}
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran</artifactId>
  <version>2.4.0</version>
</dependency>
{% endhighlight %}

Note that Aspectran 2 requires Java 8, so an explicit declaration of 1.8 compatibility to the compiler may also be required:

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


[1]: http://repo1.maven.org/maven2/com/aspectran/aspectran/
[2]: http://search.maven.org/#search%7Cga%7C1%7Cg%3A%22com.aspectran%22
[3]: http://search.maven.org/#search|ga|1|a%3A%22aspectran%22
[4]: http://search.maven.org/#artifactdetails|com.aspectran|aspectran|2.4.0|jar
[5]: http://search.maven.org/remotecontent?filepath=com/aspectran/aspectran/2.4.0/aspectran-2.4.0.pom
[6]: http://search.maven.org/remotecontent?filepath=com/aspectran/aspectran/2.4.0/aspectran-2.4.0.jar
[7]: http://search.maven.org/remotecontent?filepath=com/aspectran/aspectran/2.4.0/aspectran-2.4.0-javadoc.jar
[8]: http://search.maven.org/remotecontent?filepath=com/aspectran/aspectran/2.4.0/aspectran-2.4.0-sources.jar
