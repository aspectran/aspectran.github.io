---
lang: ko
layout: page
sidebar: right
title: "Aspectran 소개"
subheadline: "What is Aspectran?"
teaser: "Aspectran은 고성능 Java 애플리케이션을 구축하기 위한 경량 프레임워크로써, 직관적이고 유연한 개발 환경을 제공합니다."
header:
  image_fullwidth: "header_gettingstarted.jpg"
  caption: "My cute second daughter"
breadcrumb: true
comments: false
permalink: /aspectran/
---

![Aspectran Archtecture Diagram](/images/info/aspectran_archtecture_diagram.png "Aspectran Archtecture Diagram")

Aspectran은 Java 애플리케이션을 개발하기 위한 프레임워크로써,
간단한 쉘 애플리케이션과 대규모 엔터프라이즈 웹 애플리케이션을 구축하는 데 사용될 수 있습니다.

Aspectran의 주요 기능은 다음과 같습니다.

* **POJO (*Plain Old Java Object*) 프로그래밍 모델**  
  개발자는 프레임워크에서 내부적으로 사용하는 무겁고 복잡한 오브젝트를 알 필요가 없습니다.
  간단한 Java 클래스를 사용하여 프레임워크와 오브젝트를 교환할 수 있습니다. 
* **Inversion of Control (*IoC*)**  
  또한 프레임워크가 전체 흐름을 제어하면서 개체의 생성 및 생명 주기를 관리하기 때문에 개발자는 비즈니스 논리에 집중할 수 있습니다. 
* **Dependency Injection (*DI*)**  
  프레임워크는 런타임 시 서로 의존하는 모듈을 체계적으로 연결하여 모듈 간의 결합도를 낮추고 코드 재사용성을 높입니다. 
* **Aspect-Oriented Programming (*AOP*)**  
  프레임워크는 트랜잭션, 로깅, 보안 및 예외 처리와 같은 부가적인 기능을 런타임에 개발자가 작성한 코드와 결합합니다. 
* **편리한 RESTful 웹 서비스 구축**  
  Aspectran은 처음부터 REST API 구현을 위해 설계되었으며, 마이크로서비스 아키텍처에 최적화된 프레임워크입니다. 
* **빠른 개발 및 시작 시간**  
  Aspectran의 직관적인 프로그래밍 모델은 빠른 개발 시간을 보장하고, 다른 프레임워크보다 빠르게 실행됩니다. 

Aspectran을 기반의 애플리케이션은 JVM 상에서 다음과 같은 실행 환경을 지원합니다.

* 명령행 애플리케이션을 위한 일관된 쉘 인터페이스
* 내장된 고성능 웹 애플리케이션 서버 (Undertow, Jetty)
* 백그라운드 프로세스로 실행하기 위한 데몬

Aspectran은 다음과 같은 주요 패키지로 구성되었습니다.

* **com.aspectran.core**  
  Aspectran의 주요 기능이 포함된 핵심 패키지
* **com.aspectran.daemon**  
  Unix 기반 또는 Windows 운영 체제에서 백그라운드 프로세스로 실행되는 애플리케이션을 빌드하는데 필요한 패키지
* **com.aspectran.embed**  
  다른 Java 애플리케이션에 Aspectran을 내장하는데 필요한 패키지
* **com.aspectran.shell**  
  쉘 (일명 명령 줄) 응용 프로그램을 빌드하는데 필요한 패키지
* **com.aspectran.shell-jline**  
  대화형 쉘 인터페이스로 기능이 풍부한 JLine을 사용하기 위한 패키지
* **com.aspectran.web**  
  웹 애플리케이션 구축에 필요한 전반적인 기능을 제공하기 위한 패키지
* **com.aspectran.websocket**  
  WebSocket 엔드포인트를 구성하는데 필요한 패키지 
* **com.aspectran.jetty**  
  Jetty를 사용하는 웹 애플리케이션 서버를 구축하기 위한 애드온 패키지 
* **com.aspectran.undertow**  
  Undertow를 사용하는 웹 애플리케이션 서버를 구축하기 위한 애드온 패키지 
* **com.aspectran.rss-lettuce**  
  Lettuce를 클라이언트로 사용하는 Redis 세션 저장소 구현을 포함하는 패키지
* **com.aspectran.mybatis**  
  MyBatis를 통합하기 위한 애드온 패키지
* **com.aspectran.freemarker**  
  FreeMarker 템플릿 엔진을 사용하는데 필요한 애드온 패키지 
* **com.aspectran.pebble**  
  Pebble 템플릿 엔진을 사용하는데 필요한 애드온 패키지 

## Aspectran의 유래

Aspectran의 개발은 2008년 3월부터 시작되었지만, 2015년 9월 1일에 처음으로 발표되었습니다.  
"Aspectan"이라는 이름은 2012년 7월에 만들어졌으며, "Aspect"와 "Translet"의 합성어입니다.

## 라이센스

Aspectran은 [Apache 2.0 라이센스](http://www.apache.org/licenses/LICENSE-2.0)에 따라 공개된 오픈소스 소프트웨어입니다.
