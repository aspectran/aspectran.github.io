---
lang: en
layout: page
format: plate solid article
sidebar: right
headline: Everything you need to know about Aspectran
title: Aspectran Documentation
teaser: 이 페이지는 Aspectran 공식 문서의 색인입니다. Aspectran 프레임워크를 배우고 사용하는 데 도움이 되는 모든 문서를 여기에서 찾아볼 수 있습니다. 설정 가이드, 사용자 가이드, 실용 가이드, 아키텍처 문서 등 필요한 정보를 쉽게 탐색하고 접근할 수 있도록 구성했습니다.
breadcrumb: true
permalink: /docs/
---

원하는 정보를 빠르게 찾아 Aspectran의 강력한 기능을 최대한 활용해 보세요.

## Aspectran Configuration

-   [Aspectran 기본 구성 가이드](aspectran-configuration_ko.md)
-   [Aspectran XML 구성 가이드](aspectran-xml-configuration_ko.md)
-   [WebActivityServlet 구성 가이드](aspectran-servlet-configuration_ko.md)

## User Guide

-   [Aspectran User Guide](aspectran-user-guide_ko.md)

## Practical Guides

-   [APON 소개](introduce-apon.md)
-   [AsEL 소개](introduce-asel.md)
-   [Aspectran Bean 실용 가이드](practical-guide-to-beans.md)
-   [Aspectran Translet 실용 가이드](practical-guide-to-translets.md)
-   [PBE를 이용한 인증 토큰 활용 가이드](practical-guide-to-pbe-token-based-authentication.md)

## Architecture

-   [Aspectran Architectural Philosophy](aspectran-architectural-philosophy_ko.md)
-   [Aspectran Architecture](aspectran-architecture_ko.md)

### Architecture 상세

*   [ActivityContext 빌드 과정: 심층 분석](architecture/activity-context-building.md)
*   [ActivityContext: Aspectran의 심장부](architecture/activity-context.md)
*   [Environment: 프로필과 속성을 이용한 환경 제어](architecture/activity-environment.md)
*   [Aspectran Actions: 개념, 종류 및 처리 결과](architecture/aspectran-actions.md)
*   [Activity 아키텍처: 요청 처리의 실행 엔진](architecture/aspectran-activities.md)
*   [Adapter 아키텍처: 환경 독립성의 핵심](architecture/aspectran-adapters.md)
*   [Aspectran의 빈 스코프(Bean Scopes) 심층 분석](architecture/aspectran-bean-scopes.md)
*   [SiblingClassLoader: 동적이고 유연한 클래스 로딩의 핵심](architecture/aspectran-classloader.md)
*   [Aspectran 실행 환경 심층 분석](architecture/aspectran-execution-environments.md)
*   [Aspectran 구성 로딩 메커니즘](architecture/aspectran-loading-mechanism.md)
*   [Aspectran 로깅 메커니즘](architecture/aspectran-logging-mechanism.md)
*   [요청(Request) 및 응답(Response) 처리 메커니즘](architecture/aspectran-request-response.md)
*   [Aspectran 설정 규칙 아키텍처 심층 분석](architecture/aspectran-rule-architecture.md)
*   [Aspectran 서비스 아키텍처 심층 분석](architecture/aspectran-services.md)
*   [Aspectran Session Manager](architecture/aspectran-session-manager.md)
*   [Aspectran AOP 프록시 메커니즘](architecture/new-aop-proxy-mechanism.md)

### Package Deep Dive

*   Core Package
    *   [Aspectran Core Service](architecture/packages/aspectran-core-service.md)
    *   [Aspectran Scheduler Service](architecture/packages/aspectran-scheduler-service.md)
    *   [Aspectran Core Activity](architecture/packages/aspectran-core-activity.md)
*   Daemon Package
    *   [Aspectran Daemon Service](architecture/packages/aspectran-daemon-service.md)
    *   [Aspectran Daemon Activity](architecture/packages/aspectran-daemon-activity.md)
*   Embed Package
    *   [Aspectran Embed Service](architecture/packages/aspectran-embed-service.md)
    *   [Aspectran Embed Activity](architecture/packages/aspectran-embed-activity.md)
*   Shell Package
    *   [Aspectran Shell Service](architecture/packages/aspectran-shell-service.md)
    *   [Aspectran Shell Activity](architecture/packages/aspectran-shell-activity.md)
*   Undertow Package
    *   [Aspectran Undertow Service](architecture/packages/aspectran-undertow-service.md)
    *   [Aspectran Undertow Activity](architecture/packages/aspectran-undertow-activity.md)
*   Web Package
    *   [Aspectran Web Service](architecture/packages/aspectran-web-service.md)
    *   [Aspectran Web Activity](architecture/packages/aspectran-web-activity.md)
