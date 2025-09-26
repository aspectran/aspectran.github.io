---
format: plate solid article
title: Aspectow Core Concepts
teaser: This document describes the architecture and key components of Aspectow.
sidebar: toc
---

## 1. Aspectran 엔진과의 관계

Aspectow는 강력한 오픈소스 프레임워크인 **Aspectran**을 기반으로 구축된 엔터프라이즈 WAS '제품'입니다. Aspectran은 DI(Dependency Injection), AOP(Aspect-Oriented Programming), MVC와 유사한 요청 처리 흐름 등을 자체적으로 제공하는 All-in-One 프레임워크입니다.

Aspectow는 이러한 Aspectran의 핵심 개념(Translet, Activity, Bean, Aspect 등)을 활용하여 애플리케이션의 비즈니스 로직을 처리하고, 그 위에 WAS로서의 안정성, 성능, 관리 편의성 등의 가치를 더합니다. 즉, Aspectran이 애플리케이션의 '두뇌'라면, Aspectow는 그 두뇌가 최적으로 작동하도록 돕는 '몸체'이자 '환경'이라고 할 수 있습니다.

## 2. WAS로서의 Aspectow

Aspectow는 단순한 프레임워크 실행 환경을 넘어, 엔터프라이즈급 WAS로서의 기능을 제공합니다.

### 2.1. 웹서버 통합

Aspectow는 JBoss의 **Undertow** 또는 Eclipse의 **Jetty**와 같은 고성능 내장 웹서버를 통합하여 제공합니다. 이를 통해 별도의 웹서버 설정 없이도 애플리케이션을 즉시 실행하고 웹 요청을 처리할 수 있습니다. Undertow는 비동기 I/O에 강점을 가지며, Jetty는 경량성과 유연성으로 잘 알려져 있습니다.

### 2.2. 서블릿 컨테이너 지원

*   **Enterprise Edition 및 Jetty Edition:** Jakarta EE 10 기반의 서블릿 6.0 스펙을 완벽하게 지원합니다. 이는 기존 서블릿 기반의 웹 애플리케이션을 Aspectow 환경에서 안정적으로 운영할 수 있음을 의미합니다.
*   **Light Edition의 경량화 전략:** 고성능 REST API 서비스에 최적화된 Light Edition은 서블릿 스펙을 의도적으로 제외하여 불필요한 오버헤드를 줄이고, 더욱 빠른 응답 속도와 낮은 리소스 사용량을 달성합니다.

## 3. 핵심 경쟁력의 기술적 심화

[Aspectow 소개 문서](/ko/aspectow/)에서 언급된 Aspectow의 핵심 경쟁력들은 다음과 같은 기술적 기반 위에서 구현됩니다.

### 3.1. Redis 네이티브 고성능 세션 스토어

Aspectow는 `aspectran-rss-lettuce` 모듈을 통해 고성능 Redis 클라이언트인 `Lettuce`를 사용하여 세션 데이터를 직접 관리합니다. 이는 범용 JDBC 기반의 세션 저장소와 달리, Redis의 비동기 I/O 특성을 최대한 활용하여 세션 처리 성능을 극대화합니다. 복잡한 설정 없이 즉시 사용 가능한 고성능 세션 클러스터링을 제공하여 MSA 환경에서 상태 저장 서비스의 수평적 확장을 용이하게 합니다.

### 3.2. AppMon (내장 애플리케이션 모니터링)

`Aspectow AppMon`은 Aspectow에 내장된 실시간 애플리케이션 모니터링 솔루션입니다. 별도의 외부 도구 연동 없이, 애플리케이션의 로그, 이벤트, 성능 지표 등을 통합된 뷰로 제공하여 운영 편의성을 크게 향상시킵니다. 개발자는 물론 운영자도 애플리케이션의 상태를 직관적으로 파악하고 문제 발생 시 신속하게 대응할 수 있습니다.

### 3.3. XML 기반의 세밀한 서버 커스터마이징

Aspectow는 `server.xml`과 같은 XML 설정 파일을 통해 서버의 생명주기(Lifecycle), 웹 핸들러 체인, 가상 호스트 등 WAS의 핵심 동작을 매우 세밀하게 제어할 수 있도록 설계되었습니다. 이는 Spring Boot의 `application.properties` 방식보다 훨씬 강력하고 체계적인 서버 레벨의 커스터마이징을 가능하게 하여, 복잡하고 다양한 엔터프라이즈 환경의 요구사항에 유연하게 대응할 수 있는 기반을 제공합니다.

## 4. 배포 및 운영 모델

Aspectow는 다양한 배포 및 운영 환경을 지원합니다.

### 4.1. 효율적인 리소스 관리 및 리로딩

Aspectran은 `LocalResourceManager`를 통해 `/lib/ext`와 같은 지정된 리소스 디렉토리에서 JAR 파일을 로드합니다. 이때, 리소스 리로딩 시 파일 락킹(File Locking) 문제를 피하기 위해 해당 JAR 파일을 애플리케이션의 `temp` 디렉토리로 복사하여 관리합니다. 이는 애플리케이션을 재시작하지 않고도 리소스를 안전하게 업데이트할 수 있게 하여, 운영 중단 시간을 최소화하고 유연한 배포를 가능하게 합니다. 또한, 애플리케이션 종료 시 임시 리소스 파일들을 자동으로 정리하는 메커니즘도 갖추고 있습니다.

예를 들어, `aspectran-config.apon` 설정에서 다음과 같이 리소스 경로를 지정할 수 있습니다.

```apon
context: {
    name: root
    rules: /config/root-context.xml
    resources: [
        /lib/ext
    ]
}
```

### 4.3. 운영 환경 배포 스크립트 제공

Aspectow는 운영 환경에서의 배포 및 관리를 위한 다양한 스크립트를 `setup` 디렉토리를 통해 제공합니다. `install-app.sh`와 같은 설치 스크립트부터 서비스 등록/해제 스크립트(`install-service.sh`, `uninstall-service.sh`), 그리고 `scripts` 디렉토리 내의 `startup.sh`, `shutdown.sh`, `status.sh` 등 서비스 시작/종료/상태 확인 스크립트까지 포함합니다. 이러한 스크립트들은 운영 환경에서의 배포 및 관리를 간소화하여 운영 오버헤드를 크게 줄여줍니다.

### 4.4. 단일 JAR 배포

애플리케이션과 WAS가 통합된 단일 JAR 파일 형태로 배포하여 간편하게 실행할 수 있습니다.

### 4.5. 데몬/쉘 환경 지원

웹 환경뿐만 아니라, Aspectran의 강력한 데몬 및 쉘 기능을 활용하여 백그라운드 서비스, 배치 작업, CLI 도구 등으로도 운영될 수 있습니다.

이러한 유연성은 Aspectow가 웹 애플리케이션 서버를 넘어, 다양한 형태의 엔터프라이즈 애플리케이션을 위한 범용적인 실행 환경임을 보여줍니다.
