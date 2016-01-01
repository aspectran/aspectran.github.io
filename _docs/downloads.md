---
layout: page
format: article
sidebar: right
title: "Aspectran Releases"
subheadline: "Download a Release of Aspectran"
teaser: "Aspectran은 Apache 2.0 License에 의거하여 무료로 제공되는 오픈소스입니다."
---

## Latest stable release: 1.5.0

Core Libarary
: [aspectran-1.5.0.jar][1] (689KB)

Source
: [aspectran-1.5.0-sources.jar][2] (510KB)

Javadoc
: [aspectran-1.5.0-javadoc.jar][3] (2.4MB)

Aspectran Library is published as a Maven artifact at the [Maven Central Repository][4].

## Maven

Maven을 사용한다면 pom.xml에 다음 설정을 추가하세요.

{% highlight xml %}
<project>
  <dependencies>
    <dependency>
      <groupId>com.aspectran</groupId>
      <artifactId>aspectran</artifactId>
      <version>1.5.0</version>
    </dependency>
  </dependencies>
</project>
{% endhighlight %}

See [all versions available on the Maven Central Repository][5].


## Dependencies

* javassist or cglib
* commons-fileupload
* commons-io
* logging 라이브러리(commons-logging, log4j, slf4j)

의존 라이브러리에 대한 상세한 정보는 [pom.xml][6]을 참고하시기 바랍니다.


[1]: /downloads/1.5.x/aspectran-1.5.0.jar
[2]: /downloads/1.5.x/aspectran-1.5.0-sources.jar
[3]: /downloads/1.5.x/aspectran-1.5.0-javadoc.jar
[4]: http://repo1.maven.org/maven2/com/aspectran/aspectran/
[5]: http://search.maven.org/#search%7Cga%7C1%7Cg%3A%22com.aspectran%22
[6]: https://github.com/aspectran/aspectran/blob/master/pom.xml
