---
layout: page
format: article
sidebar: toc
title: "Installation"
subheadline: "User Guides"
teaser: "Aspectran을 사용하기 위해 필요한 라이브러리에 대해 설명합니다."
---

## 1. 작동 환경

Aspectran을 이용해서 Java 웹 어플리케이션을 개발하기 위해서는 다음 요건을 충족해야 합니다.

* Java 6 이상
* Servlet 2.5 이상

## 2. Aspectran 라이브러리 다운로드

[다운로드](/downloads/) 페이지에서 jar 라이브러리의 복사본을 받을 수 있습니다.

Maven 사용한다면 [Maven Central Repository](http://search.maven.org/#search%7Cga%7C1%7Cg%3A%22com.aspectran%22)에서 Aspectran 라이브러리를 쉽게 구할 수 있습니다.

## 3. 의존 라이브러리

Aspectran은 다음과 같은 필수 의존 라이브러리를 필요로 합니다.

* javassist or cglib
* commons-fileupload
* commons-io
* logging 라이브러리(commons-logging, log4j, slf4j)

각 라이브러리의 버전은 [pom.xml](https://github.com/aspectran/aspectran/blob/master/pom.xml) 파일을 참고해 주시기 바랍니다.
