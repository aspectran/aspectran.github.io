---
layout: page
format: article
sidebar: toc
title: "Installation"
subheadline: "User Guide"
teaser: "Aspectran을 사용하기 위해 필요한 라이브러리에 대해 설명합니다."
breadcrumb: true
---

## 1. 작동 환경
Aspectran을 사용해서 Java 웹 어플리케이션을 개발하기 위해서는 다음 요건을 충족해야 합니다.

* Java 6 이상
* Servlet 2.5 이상

## 2. Aspectran 라이브러리 다운로드

현재 Aspectran 홈페이지의 [다운로드](http://www.aspectran.com/downloads/) 페이지에서 수동으로 jar 라이브러리의 복사본을 받을 수 있습니다.

## 3. 의존 라이브러리

Aspectran은 라이브러리 의존성 문제를 최소화 하기 위해 최소한의 외부 라이브러리를 사용합니다.
Aspectran을 사용하려면 aspectran-x.x.x.jar 파일과 아래와 같은 필수 의존 라이브러리를 필요로 합니다.

* javassist or cglib
* commons-fileupload
* commons-io
* logging 라이브러리(commons-logging, log4j, slf4j)

Maven을 사용한다면 [pom.xml](https://github.com/aspectran/aspectran/blob/master/pom.xml) 파일을 참고해서 의존 라이브러리를 추가해 주세요.
