---
layout: page
format: article
sidebar: right
title: "About Aspectran"
subheadline: "What is Aspectran?"
teaser: "Aspectran은 엔터프라이즈급 자바 웹 응용 프로그램을 구축하기 위한 가볍고 확장 가능한 프레임워크입니다."
header:
  image_fullwidth: "header_aspectran.png"
  slogan_hidden: true
article_heading: false
comments: true
permalink: "/info/"
---
*Aspectran* 은 방대한 개념으로 포장되어 있지 않습니다.  
*Aspectran* 은 생소한 개념을 창조하지 않습니다.  
*Aspectran* 의 직관적인 몇 가지의 개념으로 명확하고 신뢰할 수 있는 결과물을 만들 수 있습니다.  

## 주요 기능
2008년 봄부터 개발을 시작한 이후로 7년이라는 시간이 지났습니다.
정식 버전 출시와 함께 오픈소스로 공개를 하고 여러분과 함께 만들어 가려고 합니다.
7년 전 *Aspectran* 이라는 프레임워크를 만들어야겠다는 생각을 했을 때 그 때의 감동은 아직도 가슴 한 켠에 에 남아 있습니다.  
작고 간단한 기능을 구현하면서 잠시 자만도 했고,
크고 복잡한 핵심기능은 1년여의 긴 고민 끝에 겨우 완성할때도 있었습니다.  
그렇게 완성된 *Aspectran* 의 주요 기능은 다음과 같습니다.

* POJO(*Plain Old Java Object*) 방식의 경량 프레임워크입니다.  
  특정 클래스를 상속받아서 기능을 확장할 필요가 없기 때문에 간단하고 명확한 프로그래밍을 할 수 있습니다.
  결과 값은 가장 간단한 자바 오브젝트에 담아서 반환하면 됩니다.
* 제어 반전(*Inversion of Control, IoC*)을 지원합니다.  
  프레임워크가 전체적인 흐름을 제어하면서 개발자가 작성한 모듈의 기능을 호출하는 방식입니다.
  객체에 대한 생성 및 생명주기를 관리할 수 있는 기능을 제공하며, 개발자는 비즈니스 로직에 집중하여 개발할 수 있게 됩니다.
* 의존성 주입(*Dependency Injection, DI*)을 지원합니다.  
  프레임워크가 실행시에 서로 의존하는 모듈을 연결합니다.
  모듈 간의 낮은 결합도를 유지할 수 있고, 코드 재사용성을 높일 수 있습니다.
* 관점 지향 프로그래밍(*Aspect-Oriented Programming, AOP*)을 지원합니다.  
  핵심 기능과 부가적인 기능을 분리해서 코드를 작성할 수 있습니다.
  핵심 기능이 구현된 이후에 트랜잭션이나 로깅, 보안, 예외처리와 관련된 기능을 핵심 기능과 결합할 수 있습니다.
* RESTful 웹서비스 구축 환경을 지원합니다.

## 참조한 오픈소스
일부 공통 유틸은 소스코드를 수정해서 사용한 부분도 있고, 핵심 기능은 안타깝게도 모두 새로 구현해야 했습니다.
그 이유는 *Aspectran* 이어야 했기 때문에...

*Aspectran* 을 개발하면서 참조한 오픈소스입니다.

* 자바 플랫폼을 위한 오픈소스 애플리케이션 프레임워크 - [Spring Framework][1]
* 자바 퍼시스턴스 프레임워크  - [MyBatis][2]
* 아파치 소프트웨어 재단에 소속된 여러 프로젝트 - [Apache Software Foundation][3]
* 그 외 디자인 패턴을 소개하고 예제 소스코드를 게제한 여러 블로그의 글

## 감사합니다.
모두 *Aspectran* 으로 보답을 하겠습니다.


 [1]: http://www.springsource.org/
 [2]: http://blog.mybatis.org/
 [3]: http://www.apache.org/
