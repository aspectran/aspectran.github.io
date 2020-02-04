---
layout: page
format: article
sidebar: right
title: "Aspectran"
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
  프레임워크의 복잡도와 상세 기술의 복잡함을 개발자에게 전가하지 않아야 합니다.
  개발자는 단순한 Java 클래스로 기능을 구현하고, 처리 결과 값은 기본 Java 객체로 반환될 수 있습니다.
* **Inversion of Control (*IoC*)**  
  프레임워크는 전체 흐름을 제어하면서 개발자가 구현한 단위 기능을 직접 호출하면서 전체적인 기능을 완성합니다.
  개발자가 비즈니스 로직에만 집중할 수 있도록 객체의 생성 및 생명주기를 프레임워크가 관리합니다.
* **Dependency Injection (*DI*)**  
  프레임워크는 런타임시 서로 의존하는 모듈을 연결합니다.
  모듈 간의 낮은 결합도를 유지하고 코드 재사용성을 높일 수 있습니다.
* **Aspect-Oriented Programming (*AOP*)**  
  프레임워크는 개발자가 구현한 핵심 로직 내에 트랜잭션, 로깅, 보안 및 예외 처리와 같은 부가적인 기능을 결합합니다.
  개발자는 핵심 기능과 부가 기능을 분리하여 코드를 작성할 수 있습니다.
* **편리한 RESTful 웹 서비스 구축**  
  Aspectran은 REST API 구현에 적합하도록 처음부터 설계되었으므로 별도의 프레임워크나 추가 라이브러리를 필요로 하지 않습니다.
  직관적 인 API 구현을 통해 일관된 형식으로 메시지를 빠르게 보내고 받을 수 있습니다.

Aspectran을 기반으로 개발된 애플리케이션은 JVM 상에서 다음과 같은 실행 환경을 지원합니다.

* 명령행 애플리케이션을 위한 일관된 쉘 인터페이스
* 내장된 고성능 웹 애플리케이션 서버 (Undertow, Jetty)
* 백그라운드 프로세스로 실행되는 데몬

Aspectran은 다음과 같은 주요 패키지로 구성되었습니다.

* **com.aspectran.core**  
  Aspectran의 핵심 기능에 대한 구현을 포함하고 있으며, 다른 하위 구현의 기반이 되는 패키지
* **com.aspectran.daemon**  
  Unix 기반 또는 Windows 운영체제의 백그라운드 프로세스로 Aspectran을 실행하기 위한 데몬 서비스를 제공
* **com.aspectran.embed**  
  다른 Java 애플리케이션에 Aspectran 인스턴스를 내장하기 위한 서비스를 제공하는 패키지
* **com.aspectran.rss-lettuce**  
  Lettuce를 클라이언트로 사용하여 Redis의 지속성을 통해 세션 클러스터링을 제공하기 위한 애드온 패키지
* **com.aspectran.shell**  
  명령 행에서 일관된 대화식 쉘 인터페이스를 제공하기 위한 패키지
* **com.aspectran.shell-jline**  
  기능이 풍부한 JLine을 사용하여 대화식 쉘 인터페이스를 제공하기 위한 패키지
* **com.aspectran.web**  
  웹 애플리케이션 구축에 필요한 전반적인 기능을 제공하기 위한 패키지
* **com.aspectran.jetty**  
  Jetty를 통합하기 위한 애드온 패키지
* **com.aspectran.mybatis**  
  MyBatis를 통합하기 위한 애드온 패키지
* **com.aspectran.undertow**  
  Undertow를 통합하기 위한 애드온 패키지

## Aspectran의 유래

Aspectran의 개발은 2008년 3월부터 시작되었지만, 2015년 9월 1일에 처음으로 발표되었습니다.  
"Aspectan"이라는 이름은 2012년 7월에 만들어졌으며, "Aspect"와 "Translet"의 조합입니다.

## 라이센스

Aspectran은 [Apache 2.0 라이센스](http://www.apache.org/licenses/LICENSE-2.0)에 따라 공개된 오픈소스 소프트웨어입니다.
