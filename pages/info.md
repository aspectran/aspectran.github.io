---
layout: page
format: article
title: "About Aspectran"
subheadline: "What is Aspectran?"
teaser: "Aspectran is a lightweight Java framework for building Enterprise-ready Web applications. Also, It will be able to launch as a Console-based and Embedded application."
header:
  image_fullwidth: "header_aspectran.png"
  slogan_hidden: true
article_heading: false
comments: true
permalink: "/info/"
---
*Aspectran은 방대한 개념으로 포장되어 있지 않습니다.*  
*Aspectran 은 생소한 개념을 창조하지 않습니다.*  
*Aspectran의 직관적인 몇 가지의 개념으로 명확하고 신뢰할 수 있는 결과물을 만들 수 있습니다.*  

8년 전 *Aspectran* 이라는 프레임워크를 만들어야겠다는 생각을 했을 때 그 때의 설레임은 아직도 가슴 한 켠에 남아 있습니다.
작고 빠른 프레임워크를 만들기 위해 잘 알려진 범용 라이브러리에 의존하기 보다는 최적화된 기능을 직접 구현하는데 중점을 두었습니다.

Aspectran은 현존하는 자바 기반 프레임워크의 핵심 기술을 대부분 수용하면서 새롭게 디자인된 초경량 프레임워크입니다.
다음과 같은 목적을 달성하기 위해 디자인되었습니다.

* POJO(*Plain Old Java Object*) 방식의 프로그래밍을 지향합니다.  
  특정 클래스를 상속받아서 기능을 확장하는 방식이 아니고, 실제 필요한 핵심 로직과 기능 구현에만 집중할 수 있습니다.
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

2015년 가을 어느 날 드디어 정식 버전을 출시하였습니다.
여러분과 함께 만들어 가는 Aspectran이 되었으면 좋겠습니다.
