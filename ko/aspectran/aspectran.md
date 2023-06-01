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
* **Aspectran 기반 프로덕션 등급 애플리케이션 생성**  
  여러 운영 체제에서 실행되는 안정적인 독립 실행형 Java 애플리케이션을 생성하고, 서블릿 컨테이너에서 실행하거나 다른 Java 애플리케이션에 포함될 수도 있습니다.

Aspectran 기반의 애플리케이션은 JVM 상에서 다음과 같은 실행 환경을 지원합니다.

* 명령행 애플리케이션을 위한 일관된 쉘 인터페이스
* Unix 기반 또는 Windows 운영 체제에서 백그라운드 프로세스로 실행
* 고성능 웹 애플리케이션 서버 내장(Undertow, Jetty)
* Apache Tomcat 또는 WildFly와 같은 전통적인 서블릿 컨테이너에서 서블릿으로 실행

Aspectran은 다음과 같은 주요 패키지로 구성되어 있습니다.

* **com.aspectran.core**  
  Aspectran의 핵심 기능을 포함하는 패키지
* **com.aspectran.daemon**  
  Unix 기반 또는 Windows 운영 체제에서 Aspectran 기반 Java 애플리케이션을 백그라운드 프로세스로 실행하기 위한 패키지
* **com.aspectran.embed**  
  Aspectran 기반이 아닌 다른 Java 애플리케이션에 Aspectran을 내장하기 위한 패키지
* **com.aspectran.shell**  
  Aspectran을 기반으로 대화형 쉘(일명 커맨드 라인) 애플리케이션을 구축하기 위한 패키지
* **com.aspectran.shell-jline**  
  JLine 3을 사용하여 기능이 풍부한 Aspectran 기반 대화형 쉘 애플리케이션을 구축하기 위한 패키지
* **com.aspectran.web**  
  Jakarta EE를 사용하여 웹 애플리케이션을 구축하기 위한 패키지
* **com.aspectran.websocket**  
  Aspectran 기반 웹 애플리케이션에서 웹소켓을 구성하는 데 필요한 패키지
* **com.aspectran.rss-lettuce**  
  Lettuce를 클라이언트로 사용하는 Redis 세션 저장소 구현을 포함하는 패키지
* **com.aspectran.jetty**  
  내장된 서블릿 컨테이너로 Jetty를 사용하기 위한 애드온 패키지
* **com.aspectran.undertow**  
  내장된 서블릿 컨테이너로 Undertow를 사용하기 위한 애드온 패키지
* **com.aspectran.mybatis**  
  관계형 데이터베이스를 쉽게 사용할 수 있게 해주는 MyBatis SQL Mapper 프레임워크를 사용하기 위한 애드온 패키지
* **com.aspectran.freemarker**  
  Freemarker를 템플릿 엔진으로 사용하기 위한 애드온 패키지
* **com.aspectran.pebble**  
  Pebble을 템플릿 엔진으로 사용하기 위한 애드온 패키지

## Aspectran의 유래

저는 2008년 3월에 Aspectran 개발을 시작하여 2015년 9월 1일에 처음 출시했습니다.  
개발 초기에는 Translets로 불렸으나, 2012년 7월경 AOP 기능이 추가되면서 Aspectran이라는 이름으로 변경되었습니다.  
Aspectran은 'Aspect'와 'Translet'의 합성어입니다.

## 라이센스

Aspectran은 [Apache 2.0 라이센스](http://www.apache.org/licenses/LICENSE-2.0)에 따라 공개된 오픈소스 소프트웨어입니다.
