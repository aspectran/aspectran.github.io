---
format: plate solid article margin
title: Why Aspectow
teaser: '"마이크로서비스 아키텍처(MSA) 및 클러스터 환경을 위한 가장 실용적인 엔터프라이즈 WAS & 관제 플랫폼"'
header:
  image_fullwidth: header_aspectow.png
  caption: Aspectow
inside_heading: true
sidebar: toc
permalink: /ko/why-aspectow/
---

## 혹시 이런 고민 없으신가요?

*   **전통적인 WAS (JBoss 등)**는 너무 무겁고 복잡해서 현대적인 클러스터/MSA 환경에 맞지 않다고 느끼시나요?
*   **경량 컨테이너 (Tomcat 등)**는 DI, DB 연동, 스케줄링 및 모니터링을 직접 조합해야 하는 번거로움(Assembly Hell)이 있으신가요?
*   **현대적인 플랫폼 (Spring Boot 등)**은 편리하지만, 과도한 자동 설정(Magic) 때문에 내부 동작을 파악하거나 세밀하게 제어하기 어렵지 않으신가요?
*   **분산 서버 환경**에서 노드 생존 감시, 원격 명령 실행, 스케줄러 모니터링 및 실시간 트래픽 관제를 별도의 복잡한 외부 솔루션 설치 없이 하나의 통합 웹 콘솔로 처리하고 싶으신가요?

## 그래서 Aspectow가 탄생했습니다.

**Aspectow**는 강력한 오픈소스 프레임워크 `Aspectran`을 기반으로 엔터프라이즈 환경에 맞추어 최적화하고 안정화한 **엔터프라이즈 WAS 및 관제 솔루션**입니다.

과거 전통적인 WAS(WebSphere, WebLogic 등)는 독립된 중앙 관리 서버(Admin Server/DMGR)를 별도로 구축하고 구동해야만 클러스터를 관리할 수 있었습니다. 반면 **Aspectow는 클러스터 내 모든 노드가 고성능 WAS 엔진과 함께 시각적 웹 관제 콘솔(Aspectow Console)을 자체 내장(Self-Contained)**하고 있습니다.

이러한 현대적 분산 아키텍처 덕분에 별도의 외부 관제 서버 인프라를 설치할 필요가 없으며, 클러스터 내 살아있는 어떤 노드에 접속하더라도 전체 클러스터를 안정적으로 관제할 수 있는 높은 가용성을 제공합니다.

## 왜 Aspectran으로 개발해야 할까요?

Aspectow의 진정한 가치는 그 기반이 되는 `Aspectran` 프레임워크에서 시작됩니다. Aspectran은 개발자에게 다음과 같은 명확한 이점을 제공합니다.

### 1. 제어 가능하고 명시적인 구조

Spring Boot의 복잡한 자동 설정(Magic) 뒤에 숨겨진 동작을 추적하느라 시간을 낭비할 필요가 없습니다. Aspectran은 모든 설정과 흐름이 명시적으로 정의되어 있어, 애플리케이션의 동작을 누구나 쉽게 파악하고 제어할 수 있습니다. 이는 곧 뛰어난 유지보수의 용이성으로 이어집니다.

### 2. 핵심 기능이 통합된 All-in-One 프레임워크

DI, AOP, MVC 흐름 제어 등 애플리케이션의 뼈대를 이루는 핵심 기능이 프레임워크에 내장되어 있습니다. 개발자는 라이브러리 버전을 맞추는 Assembly Hell에서 벗어나, 안정적이고 일관된 환경에서 비즈니스 로직 개발에만 집중할 수 있습니다.

### 3. 직관적인 규칙 기반 개발

Aspectran의 모든 요청은 `Translet`이라는 간단하고 명확한 규칙 단위로 처리됩니다. 단순한 텍스트 응답뿐만 아니라, 템플릿을 사용하여 동적인 컨텐츠를 자유롭게 생성할 수 있습니다.

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

이렇게 Aspectran으로 만든 강력하고 유지보수하기 쉬운 애플리케이션을, 최고의 성능과 안정성, 그리고 시각적 관제 기능으로 운영할 수 있도록 만들어진 플랫폼이 바로 Aspectow입니다.

## Aspectow 에디션

Aspectow는 사용 목적과 배포 환경에 따라 다음과 같은 모듈화된 에디션을 제공합니다.

*   **Aspectow Enterprise Edition**
    > 서블릿 사양을 완벽하게 지원하며 엔터프라이즈 웹 애플리케이션 구축에 적합합니다. 시각적 관제 플랫폼인 **Aspectow Console이 기본 내장**되어 있으며, JBoss의 [Undertow](https://undertow.io) 웹서버와 Apache Tomcat의 JSP 엔진인 [Apache Jasper](https://mvnrepository.com/artifact/org.mortbay.jasper/apache-jsp)가 포함되어 있습니다.

*   **Aspectow Edge Edition**
    > 서블릿 오버헤드를 완전히 배제한 초경량 고성능 에디션으로, 임베디드 [Netty](https://netty.io) 서버와 Java 21 가상 스레드(Virtual Threads)를 결합하여 최소 리소스 점유와 극대화된 I/O 처리량으로 고성능 마이크로서비스 및 REST API 서비스를 구축하는 데 최적화되어 있습니다.

*   **Aspectow Jetty Edition**
    > Jetty 웹서버가 내장된 버전으로, 특정 인프라 요구사항에 맞게 서블릿 기반 웹 애플리케이션을 실행할 수 있습니다.

## Aspectow의 차별화된 핵심 경쟁력

Aspectow는 다른 WAS 및 플랫폼과 차별화되는, 실질적이고 강력한 핵심 경쟁력을 기본으로 제공합니다.

### 1. 통합 관제 웹 콘솔 (Aspectow Console)

Aspectow는 서버 구동을 넘어 전체 클러스터와 애플리케이션을 시각적으로 통제하는 **Aspectow Console**을 기본 제공합니다.
*   **클러스터 노드 관리**: 클러스터 내 모든 활성 노드의 생존 상태(Live, Paused, Dead)를 실시간 감시하고, 일괄 제어(Pause, Resume, Restart) 명령을 실행합니다.
*   **대화형 원격 명령 센터**: 클러스터 내 특정 노드 또는 전체 노드로 원격 CLI/Shell 명령을 발송하고 실시간 콘솔 출력을 확인합니다.
*   **분산 스케줄러 관리자**: 전체 노드의 스케줄러 상태와 통합 로그를 관찰하는 Dashboard 뷰 및 특정 노드의 잡(Job)을 집중 동적 제어(Pause, Resume, Details)하는 Detail View를 지원합니다.
*   **보안 및 Vault 관리**: PBE(Password-Based Encryption) 암호화 기반 보안 토큰 발급 및 시스템 암호화 구성을 안전하게 관리합니다.
*   **런타임 진단 도구**: 와일드카드 패턴 검증기, AsEL 표현식 평가기, APON 데이터 변환기 등 개발자 유틸리티를 내장 제공합니다.

### 2. 고성능 분산 클러스터링 아키텍처 및 노드 관리자 (Node Manager Control Plane)

Aspectow는 다중 노드를 하나의 유기적인 클러스터로 묶어주는 핵심 제어 평면(Control Plane) 라이브러리인 **`Aspectow Node Manager`**를 내장하고 있습니다. 개발자는 인프라 환경과 확장 계획에 따라 **Gateway 모드**와 **Direct 모드**를 자유롭게 선택할 수 있습니다.

*   **Gateway 모드 (Cloud-Native & Autoscaling 최적화)**:
    *   **동적 클러스터링**: Redis를 중앙 메시지 브로커 및 메타데이터 저장소로 활용합니다. 노드 기동 시 UUID 기반의 고유 식별자를 자율 생성하고 동적 등록하므로, 노드가 수시로 생성/소멸되는 **쿠버네티스(K8s) 및 AWS Auto Scaling** 환경에 완벽하게 대응합니다.
    *   **인프라 유연성 및 사설망 통과**: L4/L7 로드밸런서 환경 구분 없이 동작하며, 방화벽이나 사설 IP(NAT) 뒤에 숨어 있는 노드들도 별도의 외장 포트 개방 없이 안전하게 통합 관제합니다.
    *   **자동 정리 (GC)**: 노드 이탈 시 생존 신호(Pulse) 모니터링을 통해 묵은 메타데이터(Group - Node - App)를 깨끗하게 자율 삭제(Cleanup)합니다.
*   **Direct 모드 (Static & Fixed Infrastructure)**:
    *   Redis 없이 노드 간 직접 연결(P2P)을 수행하는 정적 운영 방식입니다.
    *   노드의 개수와 IP가 고정되어 있는 소규모 전용망 또는 L7 Nginx 경로 기반 라우팅 환경에 최적화되어 있습니다.

노드 설정 파일(`node-config.apon`)의 `mode: gateway` 단 한 줄의 변경만으로 인프라 성장에 맞춰 클러스터 아키텍처를 자유롭게 전환할 수 있습니다.

### 3. Redis 네이티브 고성능 세션 스토어

`aspectran-rss-lettuce` 모듈을 통해 고성능 Redis 클라이언트인 `Lettuce`를 사용하여 세션 데이터를 직접 관리합니다. 이는 범용 JDBC를 거치는 방식보다 월등히 빠르고 효율적이며, MSA 및 클러스터 환경에서 상태 저장(Stateful) 서비스의 수평적 확장을 가속화합니다.

### 4. 내장된 실시간 AppMon 모니터링 (Group - Node - App)

`Aspectow AppMon` 엔진을 내장 통합하여 제공합니다. 별도의 복잡한 외부 모니터링 설치 없이, Canvas 기반 트래픽 시각화, JVM 힙/스레드 풀 메트릭, 세션 이력 및 실시간/역방향 로그 테일링 콘솔을 3계층(Group - Node - App) 내비게이션으로 관찰할 수 있습니다.

### 5. 실증된 엔터프라이즈 스택과 예제

`aspectow-demo` 프로젝트를 통해 `HikariCP`(고성능 DB 커넥션 풀), `Querydsl`(타입-세이프 쿼리), `JPetStore`, `PetClinic` 등 업계 검증 라이브러리와 애플리케이션이 결합된 실전 스택을 제공하여 신뢰할 수 있는 기반 위에서 개발을 시작할 수 있습니다.

## 프로젝트 템플릿 및 샘플

Aspectow는 바로 새로운 프로젝트 개발에 착수할 수 있도록 GitHub를 통해 스타터 프로젝트와 데모/샘플 프로젝트를 제공합니다. 이 프로젝트들을 기반으로 여러분의 애플리케이션을 개발할 수 있습니다.

### 스타터 프로젝트 (Starter Projects)

기본 환경만 구성되어 있어, 새로운 프로젝트를 시작하는 뼈대로 사용하기 위한 프로젝트입니다.

*   [Aspectow Enterprise](https://github.com/aspectran/aspectow-enterprise): Aspectow Enterprise 에디션의 기본 스타터입니다.
*   [Aspectow Edge](https://github.com/aspectran/aspectow-edge): Aspectow Edge 에디션의 기본 스타터입니다.
*   [Aspectow Jetty](https://github.com/aspectran/aspectow-jetty): Aspectow Jetty 에디션의 기본 스타터입니다.

### 데모 및 샘플 프로젝트 (Demo & Sample Projects)

특정 기능이나 라이브러리 활용법을 보여주는 완전한 예제이며, 바로 실행해 볼 수 있는 프로젝트입니다.

*   [Aspectow Demo 사이트](https://github.com/aspectran/aspectow-demo): Aspectow WAS 상에서 JPetStore, PetClinic, Examples, AppMon이 통합 구동되는 종합 데모 사이트입니다.
*   [ToDo 웹앱](https://github.com/aspectran/aspectow-todo-webapp): Aspectow Enterprise 에디션 기반의 간단한 ToDo 예제 애플리케이션입니다.
*   [JPetStore 웹앱](https://github.com/aspectran/aspectran-jpetstore): MyBatis를 사용하는 데이터베이스 연동 예제 애플리케이션입니다.
*   [Petclinic 웹앱](https://github.com/aspectran/aspectran-petclinic): JPA와 Thymeleaf를 사용하는 웹 애플리케이션 예제입니다.
