---
format: "plate solid article"
sidebar: toc-left
title: "Installing and Running Aspectow"
teaser: "This tutorial will walk you through how to download, install and run Aspectow – an all-in-one web application server based on Aspectran."
---

## 1. Prerequisites

The following tools must be installed to install and run Aspectow.

* JDK 1.8 or higher
* Maven 3.4 or higher
* Git

## 2. Downloading

Aspectow는 GitHub의 저장소로부터 Aspectow를 다운로드 할 수 있으며,
Light 버전과 Enterprise 버전의 저장소는 서로 다릅니다.

서블릿 스펙을 지원하지 않는 Aspectow Light는 다음 저장소에서 다운로드 받을 수 있습니다.
{% include label-link-box.liquid label="Aspectow Light on GitHub" href="https://github.com/aspectran/aspectow-light" %}

서블릿 스펙을 지원하는 Aspectow Enterprise는 다음 저장소에서 다운로드 받을 수 있습니다.
{% include label-link-box.liquid label="Aspectow Enterprise on GitHub" href="https://github.com/aspectran/aspectow-enterprise" %}

## 3. Directory Structure

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

## 4. Installing

## 5. Running
