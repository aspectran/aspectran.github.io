---
lang: ko
layout: page
format: "plate solid article"
sidebar: toc-left
title: "Aspectran 시작하기"
subheadline: ""
teaser: "Aspectran은 Java 8 이상을 필요로 하며, Maven을 통해 빌드 및 배포됩니다."
breadcrumb: true
permalink: /ko/aspectran/getting-started/
---

## 요구 사항

Aspectran 기반 애플리케이션 개발에 필요한 Java 버전은 다음과 같습니다.

* JDK 8 이상

빌드 도구 및 의존성 관리자로 Maven을 권장합니다.

* Maven 3.4 이상

Aspectran 기반 애플리케이션은 실행 환경에 여러 Aspectran JAR 파일들을 필요로 하며,
이 JAR 파일들은 Maven 저장소에 공개되고 있습니다.

## Maven

[![Maven central](https://maven-badges.herokuapp.com/maven-central/com.aspectran/aspectran-all/badge.svg#v{{ site.data.aspectran.stable_version }})](https://maven-badges.herokuapp.com/maven-central/com.aspectran/aspectran-all)

최신 출시 버전은 [여기][1]에서 직접 다운로드 할 수 있으며,
모든 Aspectran 메이븐 아티팩트를 찾아 볼 수 있는 URL은 다음과 같습니다.  
[https://repo1.maven.org/maven2/com/aspectran/][1]

## 의존성 추가하기

기본적으로 Aspectran을 사용하기 위해서는 모든 의존성을 포함하는 다음과 같은 정의를 pom.xml에 추가하면 됩니다.  
그러나, 구축하려는 Aspectran 기반 애플리케이션의 실행 환경에 맞는 의존성 정의만 추가하는 것을 권장합니다.

```xml
<!-- 모든 의존성을 간편하게 포함할 수 있지만, 권장되지 않습니다. -->
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-all</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```

Aspectran 기반 애플리케이션의 실행 환경에 따른 의존성 정의는 다음과 같으며,
일반적으로 실행 환경에 맞는 한 개의 정의만 추가하면 됩니다. 

백그라운드에서 실행되는 데몬 애플리케이션을 구축하려면
```xml
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-daemon</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```

명령행 애플리케이션을 구축하려면
```xml
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-shell</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```

기능이 풍부한 JLine을 이용하는 명령행 애플리케이션을 구축하려면
```xml
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-shell-jline</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```

서블릿 기반 웹 애플리케이션을 구축하려면
```xml
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-web</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```

Aspectran 기반이 아닌 Java 애플리케이션에 Aspectran을 내장하기 위해서는
```xml
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-embed</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```

위와 같은 실행 환경에 따른 의존성 정의와 함께 추가적으로 정의할 수 있는 의존성은 다음과 같습니다.

독립 실행형 웹 애플리케이션 구축을 위해 내장형 Jetty를 통합하려면
```xml
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-with-jetty</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```

독립 실행형 웹 애플리케이션 구축을 위해 Undertow를 통합하려면
```xml
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-with-undertow</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```

관계형 데이터베이스를 쉽게 이용할 수 있는 MyBatis를 통합하려면
```xml
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-with-mybatis</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```

텍스트 템플릿 엔진 FreeMarker를 통합하려면
```xml
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-with-freemarker</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```

텍스트 템플릿 엔진 Pebble을 통합하려면
```xml
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-with-freemarker</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```

Lettuce를 이용한 Redis 세션 저장소를 사용하거나 세션 클러스터링을 지원하려면
```xml
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-rss-lettuce</artifactId>
  <version>{{ site.data.aspectran.stable_version }}</version>
</dependency>
```

[1]: https://search.maven.org/search?q=com.aspectran
[2]: https://repo1.maven.org/maven2/com/aspectran/

## 최신 소스 코드

[![Build Status](https://api.travis-ci.com/aspectran/aspectran.svg?branch=master)](https://travis-ci.com/github/aspectran/aspectran)
[![Coverage Status](https://coveralls.io/repos/github/aspectran/aspectran/badge.svg?branch=master)](https://coveralls.io/github/aspectran/aspectran?branch=master)
[![Sonatype Nexus (Snapshots)](https://img.shields.io/nexus/s/https/oss.sonatype.org/com.aspectran/aspectran.svg)](https://oss.sonatype.org/content/repositories/snapshots/com/aspectran/aspectran/)

Aspectran의 최신 소스 코드는 GitHub에서 유지 관리되고 있습니다.

{% include label-link-box label="Aspectran on GitHub" href="https://github.com/aspectran/aspectran" %}

## API 참고

{% include link-box href=site.data.aspectran.api_site.url %}