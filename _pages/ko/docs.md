---
format: plate solid article
sidebar: right
title: Aspectran 공식 문서
teaser: Aspectran 문서를 통해 배우고 설정하며, 강력한 기능을 마음껏 활용해 보세요.
---

이 페이지는 Aspectran 공식 문서의 색인입니다. Aspectran 프레임워크를 배우고 사용하는 데 도움이 되는 모든 문서를 여기에서 찾아볼 수 있습니다.
구성 가이드, 사용자 가이드, 실용 가이드, 아키텍처 문서 등 필요한 정보를 쉽게 탐색하고 접근할 수 있도록 구성했습니다.

---

## 구성 가이드

환경에 맞춘 설정과 최적화 방법을 제공합니다.

*   [Aspectran 기본 구성 가이드](/ko/docs/guides/aspectran-configuration/)
*   [Aspectran XML 구성 가이드](/ko/docs/guides/aspectran-xml-configuration/)
*   [서블릿 기반 웹 애플리케이션 구성](/ko/docs/guides/aspectran-servlet-configuration/)

## 사용자 가이드

Aspectran의 사용법을 알아보고 기능을 최대한 활용하세요.

*   [Aspectran 사용자 가이드](/ko/aspectran/user-guide/)
*   [Aspectran Beans: 공식 가이드](/ko/docs/guides/aspectran-beans/)
*   [Aspectran AOP 특징 분석](/ko/docs/guides/aspectran-aop/)
*   [Aspectran의 얼굴마담: Translet 이해하기](/ko/docs/guides/aspectran-translet/)
*   [Aspectran Scheduler: Translet을 이용한 강력한 작업 자동화](/ko/docs/guides/aspectran-scheduler/)
*   [Aspectran 뷰(View) 기술](/ko/docs/guides/aspectran-view-technologies/)
*   [Aspectran Profiles](/ko/docs/guides/aspectran-profiles/)
*   [APON (Aspectran Parameters Object Notation) 소개](/ko/docs/guides/introduce-apon/)
*   [AsEL (Aspectran Expression Language) 소개](/ko/docs/guides/introduce-asel/)

## 실용 가이드

실제 시나리오에서 Aspectran을 효과적으로 적용하는 방법에 대한 실습 가이드를 살펴보세요.

-   [Aspectran Bean 실용 가이드](/ko/docs/guides/practical-guide-to-beans/)
-   [Aspectran Translet 실용 가이드](/ko/docs/guides/practical-guide-to-translets/)
-   [PBE를 이용한 인증 토큰 활용 가이드](/ko/docs/guides/practical-guide-to-pbe-token-based-authentication/)

## 아키텍처

Aspectran의 고수준 아키텍처와 핵심 구성 요소를 이해합니다.

-   [지속 가능한 단순성을 위한 설계: Aspectran 아키텍처 철학](/ko/why-aspectran/)
-   [Aspectran 아키텍처: 통합 심층 분석](/ko/aspectran/architecture/)

자세한 설명과 함께 Aspectran의 아키텍처를 더 자세히 알아보세요.

*   [ActivityContext 빌드 과정: 심층 분석](/ko/docs/architecture/activity-context-building/)
*   [ActivityContext: Aspectran의 심장부](/ko/docs/architecture/activity-context/)
*   [Environment: 프로필과 속성을 이용한 환경 제어](/ko/docs/architecture/activity-environment/)
*   [Aspectran Actions: 개념, 종류 및 처리 결과](/ko/docs/architecture/aspectran-actions/)
*   [Activity 아키텍처: 요청 처리의 실행 엔진](/ko/docs/architecture/aspectran-activities/)
*   [Adapter 아키텍처: 환경 독립성의 핵심](/ko/docs/architecture/aspectran-adapters/)
*   [Aspectran의 빈 스코프(Bean Scopes) 심층 분석](/ko/docs/architecture/aspectran-bean-scopes/)
*   [SiblingClassLoader: 동적이고 유연한 클래스 로딩의 핵심](/ko/docs/architecture/aspectran-classloader/)
*   [Aspectran 실행 환경 심층 분석](/ko/docs/architecture/aspectran-execution-environments/)
*   [Aspectran 구성 로딩 메커니즘](/ko/docs/architecture/aspectran-loading-mechanism/)
*   [Aspectran 로깅 메커니즘](/ko/docs/architecture/aspectran-logging-mechanism/)
*   [요청(Request) 및 응답(Response) 처리 메커니즘](/ko/docs/architecture/aspectran-request-response/)
*   [Aspectran 설정 규칙 아키텍처 심층 분석](/ko/docs/architecture/aspectran-rule-architecture/)
*   [Aspectran 서비스 아키텍처 심층 분석](/ko/docs/architecture/aspectran-services/)
*   [Aspectran Session Manager: Deep Dive](/ko/docs/architecture/aspectran-session-manager/)
*   [Aspectran AOP 프록시 메커니즘: `AbstractBeanProxy`와 `ProxyActivity`](/ko/docs/architecture/new-aop-proxy-mechanism/)

### 패키지 심층 분석

Aspectran의 패키지를 자세히 살펴보고 기능을 이해해 보세요.

*   Core Package
    *   [Aspectran Core Service](/ko/docs/architecture/packages/aspectran-core-service/)
    *   [Aspectran Scheduler Service](/ko/docs/architecture/packages/aspectran-scheduler-service/)
    *   [Aspectran Core Activity](/ko/docs/architecture/packages/aspectran-core-activity/)
*   Daemon Package
    *   [Aspectran Daemon Service](/ko/docs/architecture/packages/aspectran-daemon-service/)
    *   [Aspectran Daemon Activity](/ko/docs/architecture/packages/aspectran-daemon-activity/)
*   Embed Package
    *   [Aspectran Embed Service](/ko/docs/architecture/packages/aspectran-embed-service/)
    *   [Aspectran Embed Activity](/ko/docs/architecture/packages/aspectran-embed-activity/)
*   Shell Package
    *   [Aspectran Shell Service](/ko/docs/architecture/packages/aspectran-shell-service/)
    *   [Aspectran Shell Activity](/ko/docs/architecture/packages/aspectran-shell-activity/)
*   Undertow Package
    *   [Aspectran Undertow Service](/ko/docs/architecture/packages/aspectran-undertow-service/)
    *   [Aspectran Undertow Activity](/ko/docs/architecture/packages/aspectran-undertow-activity/)
*   Web Package
    *   [Aspectran Web Service](/ko/docs/architecture/packages/aspectran-web-service/)
    *   [Aspectran Web Activity](/ko/docs/architecture/packages/aspectran-web-activity/)
*   Other packages
    *   [Aspectran Config Parameters](architecture/packages/aspectran-config-parameters/)
