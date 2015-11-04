---
layout: page
format: article
sidebar: toc
title: "Overview"
subheadline: "Getting Started with Aspectran"
teaser: "빠른 시작을 위한 안내 문서입니다."
article_heading: true
breadcrumb: true
---

## Aspectran 소개

Aspectran은 엔터프라이즈급 자바 웹 응용 프로그램을 구축에 필요한 가장 핵심적인 기능을 제공하는 프레임워크입니다.
구축환경에 따라 달라질 수 있는 부가적인 기능은 직접적으로 제공을 하지 않고, 핵심 기능을 확장 또는 외부 라이브러와 연동을 통해서 부가 기능을 쉽게 추가할 수 있도록 설계되었습니다.

### Aspectran의 특징

* POJO(*Plain Old Java Object*) 방식의 경량 프레임워크입니다.  
  기능 구현을 위해 특정 인터페이스를 구현하거나 상속을 받을 필요가 없습니다.
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

## Getting Started with Aspectran

앞으로 Aspectran의 기능을 소개하고, 사용방법을 설명하려고 합니다.

각 문서에 사용된 예제 응용프로그램의 소스는 [GitHub 저장소][1]{:target="_blank"}에서 보관하고 있습니다.

[1]: https://github.com/aspectran-guides "Aspectran Guides "
