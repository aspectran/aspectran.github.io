---
layout: page
format: article
title: "About Aspectran"
subheadline: "What is Aspectran?"
teaser: "The Next Generation Java Application Framework"
header:
  image_fullwidth: "header_aspectran.png"
  slogan_hidden: true
outside_heading: false
inside_heading: true
comments: true
permalink: /info/
---
Aspectran is a lightweight Java framework for building enterprise-ready Web applications and It can be embedded in Java applications or run in console mode.
Aspectran has a special feature that can provide the same services using the same configuration settings on the Web, console-based, or other applications.
Aspectran will support most of the functionality required in an enterprise environment, and will grow into a next-generation Java application framework.

The main features of Aspectran are as follows:

* Supports POJO (*Plain Old Java Object*) programming model.  
  You can concentrate on implementing the actual functionality you need, rather than extending the functionality by inheriting specific classes.
  The resulting value can be returned to the most simple Java object.
* Supports Inversion of Control (*IoC*).  
  The framework controls the overall flow and invokes the functionality of the module created by the developer.
  Provides the ability to manage the creation and lifecycle of objects, allowing developers to focus on business logic.
* Supports Dependency Injection (*DI*).  
  The framework links modules that depend on each other at runtime.
  It can maintain low coupling between modules and increase code reusability.
* Supports Aspect-Oriented Programming (*AOP*).  
  You can write code by separating core functions and additional functions.
  Once the core functionality implementation is complete, features such as transactions, logging, security, and exception handling can be combined with core functionality.
* Supports building RESTful Web Services.

Aspectran 3 includes the following packages that support different execution environments, based on the `core` package containing core functionality.

* `com.aspectran.console` package: Contains classes to support building Console-based applications.
* `com.aspectran.embedded` package: Contains classes to support embedding Aspectran in other applications.
* `com.aspectran.web` package: Contains classes to support building Web applications.

## 주요 패키지 구조

```
com.aspectran
├── core          핵심 기능 패키지
│   ├── activity    요청과 응답을 처리하는 핵심 기능 패키지
│   ├── adapter     핵심 기능과 구현 기능간의 인터페이스를 위한 패키지
│   ├── context     공통 모듈 및 구동 환경을 구성하기 위한 패키지
│   ├── service     서비스를 제공하기 위한 핵심 기능 패키지
│   └── util        공통 유틸리티 패키지
├── console       Console 기반 어플리케이션 실행 환경을 위한 패키지
│   ├── activity    Console 기반 어플리케이션이 받은 요청과 응답을 처리하기 위한 패키지
│   ├── adapter     Console 기반 어플리케이션 실행 환경과 핵심 기능 간의 인터페이스를 위한 패키지
│   └── service     Console 기반 어플리케이션 실행 환경에 적합한 서비스를 제공하기 위한 패키지
├── embedded      임베디드 어플리케이션 실행 환경을 위한 패키지
│   ├── activity    임베디드 어플리케이션이 받은 요청과 응답을 처리하기 위한 패키지
│   ├── adapter     임베디드 어플리케이션 실행 환경과 핵심 기능 간의 인터페이스를 위한 패키지
│   └── service     임베디드 어플리케이션 실행 환경에 적합한 서비스를 제공하기 위한 패키지
├── scheduler     핵심 기능을 이용해서 내장 스케쥴링 서비스를 구현한 패키지
│   ├── activity    Job을 실행하기 위한 패키지
│   ├── adapter     내장 스케쥴링 서비스와 핵심 기능 간의 인터페이스를 위한 패키지
│   ├── service     내장 스케쥴링 서비스를 구동하기 위한 패키지
│   └── support     내장 스케쥴링 서비스 설정을 지원하는 패키지
└── web           웹 어플리케이션 실행 환경을 위한 패키지
    ├── activity    웹 어플리케이션이 받은 요청과 응답을 처리하기 위한 패키지
    ├── adapter     웹 어플리케이션 실행 환경과 핵심 기능 간의 인터페이스를 위한 패키지
    ├── service     웹 어플리케이션 실행 환경에 적합한 서비스를 제공하기 위한 패키지
    ├── startup     웹 어플리케이션 실행 환경에서 서비스를 구동하기 위한 패키지
    └── support     웹 어플리케이션에 필요한 확장 기능을 지원하기 위한 패키지
```

## History of Aspectran

The development of Aspectran was started in March 2008, but it was first published on September 1th 2015.  
The name Aspectan was created in July 2012 and it is a combination of Aspect and Translet.  
Aspectran is a lightweight framework developed to replace the increasingly conceptually complex Spring Framework.  
The Spring Framework is still widely used as an alternative to EJB, but soon the next runner will be Aspectran.
