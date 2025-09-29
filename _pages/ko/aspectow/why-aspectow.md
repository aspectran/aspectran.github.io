---
format: plate solid article margin
title: Why Aspectow
teaser: '"마이크로서비스 아키텍처(MSA)를 위한 가장 실용적인 엔터프라이즈 WAS"'
header:
  image_fullwidth: header_aspectow.png
  caption: Aspectow
inside_heading: true
sidebar: toc
permalink: /ko/why-aspectow/
---

## 혹시 이런 고민 없으신가요?

*   **전통적인 WAS (JBoss 등)**는 너무 무겁고 복잡해서 MSA 환경에 맞지 않다고 느끼시나요?
*   **경량 컨테이너 (Tomcat 등)**는 DI, DB 연동 등을 직접 조합해야 하는 번거로움(Assembly Hell)이 있으신가요?
*   **현대적인 플랫폼 (Spring Boot 등)**은 편리하지만, 과도한 자동 설정(Magic) 때문에 내부 동작을 파악하거나 제어하기 어렵지 않으신가요?

## 그래서 Aspectow가 탄생했습니다.

**Aspectow**는 강력한 오픈소스 프로젝트 `Aspectran`을 기반으로 특정 목적에 맞게 최적화하고 안정화한 **엔터프라이즈 WAS 제품**입니다. (`JBoss EAP`와 `WildFly`의 관계를 생각하시면 쉽습니다.)

Aspectow는 기존 솔루션들의 단점을 보완하고, 특히 MSA 환경에서 개발자들이 겪는 문제들을 해결하는 데 중점을 둡니다.

## 왜 Aspectran으로 개발해야 할까요?

Aspectow의 진정한 가치는 그 기반이 되는 `Aspectran` 프레임워크에서 시작됩니다. Aspectran은 개발자에게 다음과 같은 명확한 이점을 제공합니다.

### 1. 제어 가능하고 명시적인 구조

Spring Boot의 복잡한 자동 설정(Magic) 뒤에 숨겨진 동작을 추적하느라 시간을 낭비할 필요가 없습니다. Aspectran은 모든 설정과 흐름이 명시적으로 정의되어 있어, 애플리케이션의 동작을 누구나 쉽게 파악하고 제어할 수 있습니다. **이는 곧 유지보수의 용이성으로 이어집니다.**

### 2. 핵심 기능이 통합된 All-in-One 프레임워크

DI, AOP, MVC 흐름 제어 등 애플리케이션의 뼈대를 이루는 핵심 기능이 프레임워크에 내장되어 있습니다. 개발자는 라이브러리 버전을 맞추는 `Assembly Hell`에서 벗어나, 안정적이고 일관된 환경에서 비즈니스 로직 개발에만 집중할 수 있습니다.

### 3. 직관적인 규칙 기반 개발

Aspectran의 모든 요청은 `Translet`이라는 간단하고 명확한 규칙 단위로 처리됩니다. 단순한 텍스트 응답뿐만 아니라, 아래와 같이 템플릿을 사용하여 동적인 컨텐츠를 자유롭게 생성할 수 있습니다.

```xml
<translet name="hello">
    <transform format="text">
        <template style="apon">
            |Hello, World!
        </template>
    </transform>
</translet>
```

이처럼 직관적인 구조는 개발자가 프레임워크에 대한 깊은 이해 없이도 빠르게 적응하고 생산성을 높일 수 있도록 돕습니다.

---

이렇게 Aspectran으로 만든 강력하고 유지보수하기 쉬운 애플리케이션을, **최고의 성능과 안정성으로 운영할 수 있도록 만들어진 서버가 바로 Aspectow**입니다.

## Aspectow 에디션

Aspectow는 사용 목적에 따라 다음과 같은 에디션을 제공합니다.

*   **Aspectow Enterprise Edition**
    > 서블릿 사양을 완벽하게 지원하며 엔터프라이즈 웹 애플리케이션 구축에 적합합니다. JBoss의 [Undertow](https://undertow.io) 웹서버와 Apache Tomcat에서 사용하는 JSP 엔진인 [Apache Jasper](https://mvnrepository.com/artifact/org.mortbay.jasper/apache-jsp)가 내장되어 있습니다.

*   **Aspectow Light Edition**
    > 서블릿 사양이 제거된 경량화 버전이며, 고성능 REST API 서비스를 구축하는데 적합합니다. JBoss의 [Undertow](https://undertow.io) 웹서버가 내장되어 있습니다.

*   **Aspectow Jetty Edition**
    > Jetty 웹서버가 내장된 버전으로, 서블릿 기반의 웹 애플리케이션을 실행할 수 있습니다.

## Aspectow의 차별화된 핵심 경쟁력

Aspectow는 다른 WAS와 차별화되는, 실질적이고 강력한 5가지 경쟁력을 기본으로 제공합니다.

### 1. Redis 네이티브 고성능 세션 스토어

`aspectran-rss-lettuce` 모듈을 통해 고성능 Redis 클라이언트인 `Lettuce`를 사용하여 세션 데이터를 직접 관리합니다. 이는 범용 JDBC를 거치는 기존 방식보다 월등히 빠르고 효율적이며, MSA 환경에서 상태 저장(Stateful) 서비스의 수평적 확장을 가속화하는 핵심 기술입니다.

### 2. 목적 기반의 모듈화된 에디션

Aspectow는 '하나로 모든 것을 해결'하려는 무거운 접근 방식을 버렸습니다.
*   **Enterprise Edition:** 서블릿과 JSP를 완벽히 지원하여 전통적인 웹 애플리케이션에 적합합니다.
*   **Light Edition:** 서블릿 기능을 제외하여 경량화했으며, 고성능 REST API 서버 구축에 최적화되어 있습니다.
*   **Jetty Edition:** Undertow 대신 Jetty 웹서버를 사용하여, 특정 환경에 맞는 유연한 선택지를 제공합니다.

이러한 모듈성은 사용자가 자신의 목적에 맞는 최소한의 리소스로 최대의 효율을 낼 수 있도록 돕습니다.

### 3. 실증된 엔터프라이즈 스택과 안정성

'Battle-Tested'라는 말은 단순한 구호가 아닙니다. `aspectow-demo` 프로젝트는 `HikariCP`(고성능 DB 커넥션 풀), `Querydsl`(타입-세이프 쿼리) 등 업계 최고의 라이브러리들로 구성된 실전적인 엔터프라이즈 스택을 갖추고 있습니다. 이 스택 위에서 복잡한 애플리케이션을 운영하며 안정성을 검증했기에, 사용자는 복잡한 튜닝 없이도 신뢰할 수 있는 기반 위에서 개발을 시작할 수 있습니다.

### 4. 내장된 실시간 애플리케이션 모니터링

`Aspectow AppMon`이라는 내장 모니터링 솔루션을 기본으로 제공합니다. 별도의 모니터링 도구를 설치하고 설정하는 복잡한 과정 없이, 실시간으로 애플리케이션의 로그와 이벤트를 관찰할 수 있습니다. 이는 개발 편의성을 넘어, 운영 단계에서의 안정성과 신속한 문제 해결 능력을 크게 향상시키는 강력한 엔터프라이즈 기능입니다.

### 5. XML 기반의 자유로운 서버 커스터마이징

`app/config/server/server.xml`과 같은 설정 파일을 통해 서버의 생명주기, 웹서버 핸들러 체인 등 내부 동작을 세밀하게 제어할 수 있습니다. 이는 Spring Boot의 `application.properties` 방식보다 훨씬 강력하고 체계적인 서버 레벨의 커스터마이징을 가능하게 하여, 복잡한 엔터프라이즈 환경의 요구사항에 유연하게 대응할 수 있습니다.

## 프로젝트 템플릿 및 샘플

Aspectow는 Apache Tomcat처럼 설치 가능한 패키지를 제공하는 대신, 바로 새로운 프로젝트 개발에 착수할 수 있는 **스타터 프로젝트**와 특정 기술의 사용법을 보여주는 **샘플 프로젝트**를 GitHub를 통해 제공합니다. 이 프로젝트들을 기반으로 여러분의 애플리케이션을 개발할 수 있습니다.

### 스타터 프로젝트 (Starter Projects)

기본 환경만 구성되어 있어, 새로운 프로젝트를 시작하는 뼈대로 사용하기 위한 프로젝트입니다.

*   [Aspectow](https://github.com/aspectran/aspectow): Aspectow Enterprise 에디션의 기본 스타터입니다.
*   [Aspectow Light](https://github.com/aspectran/aspectow-light): Aspectow Light 에디션의 기본 스타터입니다.
*   [Aspectow Jetty](https://github.com/aspectran/aspectow-jetty): Aspectow Jetty 에디션의 기본 스타터입니다.

### 샘플 프로젝트 (Sample Projects)

특정 기능이나 라이브러리 활용법을 보여주는 완전한 예제이며, 바로 실행해 볼 수 있는 프로젝트입니다.

*   [ToDo 웹앱](https://github.com/aspectran/aspectow-todo-webapp): Aspectow Enterprise 에디션 기반의 간단한 ToDo 예제 애플리케이션입니다.
*   [JPetStore 웹앱](https://github.com/aspectran/aspectran-jpetstore): MyBatis를 사용하는 데이터베이스 연동 예제 애플리케이션입니다.
*   [Petclinic 웹앱](https://github.com/aspectran/aspectran-petclinic): JPA와 Thymeleaf를 사용하는 웹 애플리케이션 예제입니다.
