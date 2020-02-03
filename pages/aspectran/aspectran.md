---
layout: page
format: article
sidebar: right
title: "Aspectran"
subheadline: "What is Aspectran?"
teaser: "Aspectran은 고성능 Java 애플리케이션을 구축하기 위한 경량 프레임워크입니다."
header:
  image_fullwidth: "header_gettingstarted.jpg"
  caption: "My cute second daughter"
breadcrumb: true
comments: false
permalink: /aspectran/
---

![Aspectran Archtecture Diagram](/images/info/aspectran_archtecture_diagram.png "Aspectran Archtecture Diagram")

Aspectran은 Java 애플리케이션을 개발하기 위한 프레임워크로써,
간단한 쉘 애플리케이션과 대규모 엔터프라즈급 웹 애플리케이션을 구축하는 데 사용될 수 있습니다.

Aspectran의 주요 기능은 다음과 같습니다.

* **POJO (*Plain Old Java Object*) 프로그래밍 모델**  
  애플리케이션 로직의 복잡도와 상세 기술의 복잡함을 개발자에게 전가하지 않습니다.
  개발자는 단순한 자바 클래스에 기능을 구현하고, 처리 결과 값도 자바의 기본 객체에 담아서 반환하면 됩니다.
* **Inversion of Control (*IoC*)**  
  프레임워크는 전체 흐름을 제어하면서 개발자가 구현한 단위 기능을 직접 호출합니다.
  개발자가 비즈니스 로직에만 집중할 수 있도록 객체의 생성 및 생명주기를 프레임워크가 관리합니다.
* **Dependency Injection (*DI*)**  
  프레임워크는 런타임시 서로 의존하는 모듈을 연결합니다.
  모듈 간의 낮은 결합도를 유지하고 코드 재사용성을 높일 수 있습니다.
* **Aspect-Oriented Programming (*AOP*)**  
  핵심 기능과 부가 기능을 분리하여 코드를 작성할 수 있습니다.
  핵심 기능 구현이 완료되면 트랜잭션, 로깅, 보안 및 예외 처리와 같은 기능을 핵심 기능과 결합할 수 있습니다.
* **RESTful 웹 서비스 구축 지원**  
  RESTful 웹 서비스 구축에 적합하도록 설계되었습니다.

Aspectran을 기반으로 개발된 애플리케이션은 JVM 상에서 다음과 같은 실행 환경을 지원합니다.

* 명령행 애플리케이션을 위한 일관된 쉘 인터페이스
* 내장된 고성능 웹 애플리케이션 서버 (Undertow, Jetty)
* 백그라운드 프로세스로 실행되는 데몬

The following packages based on the `com.aspectran.core` package exist to support various execution environments.

* `com.aspectran.daemon`: Provides a daemon that runs Aspectran as a service in the background on Unix-based or Windows operating systems
* `com.aspectran.embed`: Provides an interface that can be used by embedding Aspectran in Java applications
* `com.aspectran.rss-lettuce`: Add-on package for providing session clustering via persistence to Redis using Lettuce as the client
* `com.aspectran.shell`: Provides an interactive shell that lets you use or control Aspectran directly from the command line
* `com.aspectran.shell-jline`: Provides an interactive shell using the feature-rich JLine
* `com.aspectran.web`: Provides overall functionality for building web applications within a web application container
* `com.aspectran.jetty`: Add-on package for integrating Embedded Jetty
* `com.aspectran.mybatis`: Add-on package for integrating MyBatis
* `com.aspectran.undertow`: Add-on package for integrating Embedded Undertow

## History of Aspectran

The development of Aspectran was started in March 2008, but it was first published on September 1th 2015.  
The name Aspectan was created in July 2012 and it is a combination of Aspect and Translet.

## License

Aspectran is Open Source software released under the [Apache 2.0 license](http://www.apache.org/licenses/LICENSE-2.0).
