---
format: plate solid article
sidebar: toc-left
title: "Activity 아키텍처: 요청 처리의 실행 엔진"
subheadline: Architecture Details
teaser:
---

Aspectran의 **Activity 아키텍처**는 프레임워크의 요청 처리 모델의 핵심입니다. 다양한 실행 환경(웹, 셸, 데몬 등)에 걸쳐 일관된 방식으로 요청을 처리할 수 있도록 설계된 계층적이고 모듈화된 구조를 가집니다.

## 1. 핵심 기반: `com.aspectran.core.activity`

이 패키지는 Aspectran의 **실행 엔진** 그 자체입니다. 모든 종류의 요청을 처리하는 데 필요한 근본적인 개념과 처리 파이프라인을 정의합니다.

-   **`Activity` (인터페이스)**: 단일 요청-응답 생명주기를 위한 중앙 실행 객체입니다. `ActivityContext`에 접근하고, 어댑터를 통해 환경을 추상화하며, 예외 처리 및 흐름 제어를 담당하는 런타임 엔진입니다.

-   **`Translet` (인터페이스)**: **`Activity`와 사용자 코드 간의 소통을 위한 매개체**입니다. 하나의 요청에 대한 규칙(`TransletRule`)과 데이터(`ActivityData`)를 캡슐화하며, 비즈니스 로직이 실행 상태와 상호작용하는 주된 API 역할을 합니다.

-   **`CoreActivity` (추상 클래스)**: `Activity`의 핵심 로직을 구현한 추상 클래스입니다. `Translet`에 정의된 규칙에 따라 요청을 처리하는 전체 파이프라인을 조율합니다. 이 파이프라인은 다음과 같은 순서로 진행됩니다.
    1.  **준비 (`prepare`)**: 요청에 해당하는 `TransletRule`을 찾아 `Translet` 인스턴스를 생성합니다.
    2.  **환경 적응 (`adapt`)**: 현재 실행 환경에 맞는 `RequestAdapter`, `ResponseAdapter` 등을 생성하고 연결합니다.
    3.  **요청 파싱 (`parseRequest`)**: 요청 파라미터, 속성, 경로 변수 등을 파싱하여 `ActivityData`에 저장합니다.
    4.  **실행 (`perform`)**:
        -   `BEFORE` 어드바이스 실행
        -   `Content` 섹션의 `Action`들 실행
        -   `Response` 처리 (Forward, Redirect, Transform, Dispatch 등)
        -   `AFTER` 어드바이스 실행
        -   예외 발생 시 `THROWN` 어드바이스 실행
        -   `FINALLY` 어드바이스 실행
    5.  **종료 (`finish`)**: 응답을 최종 마무리하고 리소스를 정리합니다.

-   **`InstantActivity`**: 사용자 코드에서 Aspectran의 컨텍스트(빈 조회, AOP 적용 등)를 활용하여 특정 작업을 프로그래밍 방식으로 실행할 수 있는 경량 `Activity` 변형입니다.

## 2. 실행 환경별 특화 Activity

`CoreActivity`의 강력한 파이프라인은 각 실행 환경의 특성을 반영한 구체적인 `Activity` 클래스들에 의해 상속되고 확장됩니다. 이들은 모두 동일한 핵심 처리 로직을 재사용하면서, 각 환경의 고유한 입출력 방식을 처리하기 위한 **적응 계층(Adaptation Layer)**을 제공합니다.

| 패키지 | Activity 클래스 | 실행 환경 | 주요 특징 및 역할 |
| :--- | :--- | :--- | :--- |
| `com.aspectran.daemon.activity` | `DaemonActivity` | 독립 실행형 백그라운드 프로세스 | **프로그래밍 방식 요청 실행**: 데몬 애플리케이션 내에서 `DaemonService.translate()` 호출을 통해 내부적으로 트랜슬릿을 실행합니다.<br>**비-웹 컨텍스트**: 웹 특화 요청/응답 객체 대신, 내부적으로 입출력을 캡처하는 `DaemonRequestAdapter`와 `DaemonResponseAdapter`를 사용합니다. |
| `com.aspectran.embed.activity` | `AspectranActivity` | 다른 Java 애플리케이션에 내장 | **프로그래밍 방식 요청 실행**: 임베딩하는 애플리케이션이 `EmbeddedAspectran.translate()` 호출을 통해 Aspectran 요청을 시작합니다.<br>**비-웹 컨텍스트**: 웹 특화 요청/응답 객체 대신, 내부적으로 입출력을 캡처하는 `EmbeddedRequestAdapter`와 `EmbeddedResponseAdapter`를 사용합니다. |
| `com.aspectran.shell.activity` | `ShellActivity` | 대화형 커맨드-라인 (CLI) | **대화형 사용자 경험**: 콘솔을 통한 직접적인 사용자 상호작용을 위해 설계되었으며, 입력 프롬프트, 환영 메시지, 출력 리다이렉션 등을 지원합니다.<br>**커맨드-라인 기반**: 파싱된 커맨드 라인 명령(`TransletCommandLine`)을 `ShellRequestAdapter`를 통해 Aspectran 트랜슬릿으로 변환하여 실행합니다. |
| `com.aspectran.web.activity` | `WebActivity` | 표준 서블릿 컨테이너 (Tomcat, Jetty 등) | **HTTP 요청/응답 처리**: 들어오는 `HttpServletRequest`를 처리하고 `HttpServletResponse`를 생성하는 데 특화되어 있습니다.<br>**서블릿 API 가교**: `HttpServletRequestAdapter`와 `HttpServletResponseAdapter`를 통해 서블릿 API와 Aspectran 코어 간의 간극을 메웁니다. |
| `com.aspectran.undertow.activity` | `TowActivity` | 임베디드 Undertow 서버 | **서블릿 없는 웹(Servlet-less Web)**: 서블릿 API를 우회하고 Undertow의 네이티브 `HttpServerExchange` 객체와 직접 통신하여 고성능을 지향합니다.<br>**어댑터 패턴**: `TowRequestAdapter`와 `TowResponseAdapter`가 `HttpServerExchange`를 표준 `Activity`가 이해할 수 있는 형태로 변환하는 어댑터 역할을 합니다. |

## 3. 아키텍처의 핵심 설계 원칙

-   **재사용 가능한 핵심 파이프라인**: 모든 `Activity` 구현체는 `CoreActivity`를 확장하여 Aspectran의 강력한 요청 처리 파이프라인(AOP, DI, 규칙 실행 등)을 그대로 재사용합니다.
-   **환경별 적응 계층**: 각 환경의 고유한 입출력 메커니즘(HTTP 요청/응답, 콘솔 입출력, 내부 메서드 호출)을 Aspectran의 표준 `Activity` 모델에 맞게 변환하는 어댑터와 특화된 `Activity` 구현체를 제공합니다.
-   **일관된 프로그래밍 모델**: 개발자는 어떤 환경에서든 `Activity`와 `Translet`이라는 일관된 추상화를 통해 비즈니스 로직을 작성할 수 있으며, 이는 코드의 재사용성을 극대화합니다.

이러한 구조 덕분에 Aspectran은 경량의 임베디드 라이브러리부터, 독립 실행형 데몬, 대화형 셸, 그리고 고성능 웹 애플리케이션 서버에 이르기까지 매우 넓은 범위의 애플리케이션을 구축할 수 있는 유연하고 강력한 프레임워크가 될 수 있습니다.
