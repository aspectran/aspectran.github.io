---
lang: ko
layout: page
format: "plate solid article"
sidebar: toc-left
title: "Aspectow 설치 및 실행"
headline: "All-in-one web application server"
teaser: "이 학습서는 Aspectran을 기반으로 제작된 올인원 웹애플리케이션 서버인 Aspectow를 다운로드, 설치 및 실행하는 방법을 안내합니다."
breadcrumb: true
permalink: /ko/aspectow/installing-and-running/
---

## 1. 준비 사항

Aspectow를 설치하고 실행하기 위해서는 다음과 같은 툴이 필요합니다.

* JDK 1.8 이상
* Maven 3.4 이상
* Git

## 2. 다운로드

Aspectow는 GitHub의 저장소로부터 Aspectow를 다운로드 할 수 있으며,
Light 버전과 Enterprise 버전의 저장소는 서로 다릅니다.

서블릿 스펙을 지원하지 않는 Aspectow Light는 다음 저장소에서 다운로드 받을 수 있습니다.
{% include label-link-box label="Aspectow Light on GitHub" href="https://github.com/aspectran/aspectow-light" %}

서블릿 스펙을 지원하는 Aspectow Enterprise는 다음 저장소에서 다운로드 받을 수 있습니다.
{% include label-link-box label="Aspectow Enterprise on GitHub" href="https://github.com/aspectran/aspectow-enterprise" %}

## 3. 디렉토리 구조

```text
Aspectow Light & Enterprise
├── app
│   ├── bin
│   │   └── procrun
│   │       └── amd64
│   ├── commands
│   │   ├── completed
│   │   ├── failed
│   │   ├── incoming
│   │   ├── queued
│   │   └── sample
│   ├── config
│   │   ├── shell
│   │   │   └── examples
│   │   ├── undertow
│   │   └── web
│   │       ├── examples
│   │       ├── home
│   │       └── terminal
│   ├── lib
│   ├── logs
│   │   └── archived
│   ├── temp
│   │   └── sessions
│   │       ├── shell
│   │       └── tow
│   ├── webapps
│   │   └── root
│   │       ├── WEB-INF
│   │       │   └── pages
│   │       │       ├── examples
│   │       │       ├── home
│   │       │       ├── templates
│   │       │       └── terminal
│   │       └── assets
│   │           ├── css
│   │           ├── img
│   │           └── js
│   │               ├── cors
│   │               └── vendor
│   └── work
├── setup
│   ├── init.d
│   └── scripts
└── src
    ├── main
    │   └── java
    │       └── app
    │           └── demo
    │               ├── examples
    │               │   ├── customer
    │               │   ├── hello
    │               │   └── upload
    │               ├── terminal
    │               └── tts
    └── test
        ├── java
        │   └── app
        └── resources
```

## 4. 설치하기

## 5. 실행하기
