---
title: "Aspectran 실행 환경 심층 분석"
subheadline: 메커니즘
---

## 1. 아키텍처 개요: 다중 런타임 지원 사상

Aspectran은 단일 코어 엔진(`CoreService`, `ActivityContext`, `Activity`) 위에 세분화된 모듈 구조를 채택하여, 동일한 비즈니스 로직을 장기 실행 백그라운드 프로세스, 대화형 명령줄 도구, 임베디드 라이브러리, 고성능 비동기 네트워크 서버, 전통적인 엔터프라이즈 웹 애플리케이션 등 다양한 런타임 환경에서 완벽하게 구동할 수 있도록 지원합니다.

핵심 비즈니스 로직(Translet 및 Bean)은 실행 환경에 대해 전혀 알지 못하며, 각 환경의 물리적 특수성은 **환경별 특화 서비스 구현체**와 **전용 Activity**, 그리고 **Adapter 계층**을 통해 흡수됩니다.

Aspectran이 제공하는 6대 실행 환경 분류는 다음과 같습니다:

1.  **비서블릿 고성능 네트워크 엔진 (Netty)**: 비동기 논블로킹 I/O 기반의 서블릿-프리 초고속 네트워크 웹 환경.
2.  **경량 임베디드 웹 서버 환경 (Undertow)**: JBoss Undertow 기반의 고성능 하이브리드 임베디드 웹 환경.
3.  **임베디드 및 표준 서블릿 환경 (Jetty & Jakarta Servlet)**: 표준 서블릿 컨테이너 및 Jetty 임베디드 웹 환경.
4.  **대화형 콘솔 셸 환경 (Shell)**: 사용자와 터미널에서 대화형으로 상호작용하는 CLI 환경.
5.  **백그라운드 프로세스 환경 (Daemon)**: UI나 웹 인터페이스 없이 장기 구동되는 백그라운드 서버 환경.
6.  **애플리케이션 내장 및 테스트 환경 (Embed)**: 기존 자바 앱이나 단위 테스트 내에 엔진을 내장하는 퍼사드 환경.

## 2. 비서블릿 고성능 네트워크 엔진: Netty 환경 (`with-netty`)

### 2.1. 목적 및 설계 철학
현대적인 마이크로서비스 및 클라우드 네이티브 환경에서는 서블릿 스펙의 스레드 모델 오버헤드를 걷어내고, 초저지연(Ultra-low latency)과 최소한의 메모리 점유율을 달성할 수 있는 고성능 런타임이 요구됩니다.

Aspectran의 Netty 모듈(`with-netty`)은 Netty의 고성능 논블로킹 I/O(NIO) 이벤트 루프 파이프라인 위에서 Aspectran의 Translet 처리 엔진을 직결하여, 초당 수십만 건의 HTTP 요청을 가볍게 처리할 수 있는 서블릿-프리(Servlet-Free) 실행 환경을 제공합니다. 특히 Java Virtual Threads와의 연동에 최적화되어 있습니다.

### 2.2. 주요 진입점
*   `com.aspectran.netty.server.NettyServer` (구현체 `DefaultNettyServer`): Netty의 `ServerBootstrap`을 구성하고, Boss/Worker `EventLoopGroup` 스레드 풀 및 채널 파이프라인을 부트스트랩합니다.
*   `com.aspectran.netty.service.DefaultNettyServiceBuilder`: Netty 서버 구성 설정(`NettyConfig`)을 파싱하여 `NettyService`를 빌드하고 초기화합니다.

### 2.3. 핵심 컴포넌트
*   `NettyService` (구현체 `DefaultNettyService`): Netty 서버의 라이프사이클을 Aspectran의 `CoreService` 체계와 결합하는 특화 서비스입니다.
*   `NettyActivity`: Netty 인바운드 채널 핸들러로부터 `FullHttpRequest`를 전달받아 요청을 처리하는 전용 `Activity`입니다.
*   `NettyRequestAdapter`, `NettyResponseAdapter`, `NettySessionAdapter`: Netty의 바이트 버퍼(`ByteBuf`) 스트림 및 채널 컨텍스트를 Aspectran 4대 어댑터로 매핑합니다.
*   `PathBasedLoggingGroupHandler`: Netty 채널 파이프라인 상에서 요청 URI 경로에 따라 동적으로 로깅 그룹을 분리합니다.

### 2.4. 동작 모델: 비동기 이벤트 기반 논블로킹 (NIO Event-Driven)
요청이 Netty 채널에 도착하면 Netty I/O 스레드가 파이프라인을 통해 HTTP 요청을 디코딩하고, `NettyActivity`가 즉각 인스턴스화되어 비즈니스 로직을 수행한 후 응답 버퍼를 채널에 비동기로 플러시합니다.

## 3. 경량 임베디드 웹 서버 환경: Undertow (`with-undertow`)

### 3.1. 목적 및 설계 철학
Red Hat의 JBoss Undertow 웹 서버를 기반으로 하는 임베디드 환경으로, 극도로 가벼운 풋프린트와 뛰어난 동시 처리 성능을 제공합니다. 서블릿 API를 거치지 않고 Undertow의 네이티브 객체를 직접 처리하는 서블릿-리스(Servlet-less) 고성능 웹 배포를 지향합니다.

### 3.2. 주요 진입점
*   `DefaultTowServiceBuilder`를 통해 프로그래밍 방식으로 Undertow 서버를 구성하고, Aspectran의 `TowService`를 Undertow 핸들러 체인의 루트 핸들러로 바인딩하여 기동합니다.

### 3.3. 핵심 컴포넌트
*   `TowService` (구현체 `DefaultTowService`): Undertow 웹 서버 런타임을 총괄하는 `CoreService` 구현체입니다.
*   `TowActivity`: Undertow의 핵심 네이티브 교환 객체인 `HttpServerExchange`를 직접 래핑하는 초고속 `Activity`입니다.
*   `TowRequestAdapter`, `TowResponseAdapter`, `TowSessionAdapter`: Undertow의 네이티브 I/O 채널 및 세션 매니저를 Aspectran 표준 어댑터로 매핑합니다.
*   `PathBasedLoggingGroupHandlerWrapper` 및 `PathBasedLoggingGroupHandler`: 요청 경로에 따른 로그 분리를 담당합니다.

### 3.4. 동작 모델: 블로킹/논블로킹 하이브리드 핸들러 체인
Undertow의 `HttpServerExchange`를 통해 정적 리소스는 논블로킹 I/O로 빠르게 전달하고, 복잡한 비즈니스 트랜슬릿은 워커 스레드 풀에서 안전하게 실행합니다.

## 4. 서블릿 기반 웹 환경 (`aspectran-web-servlet` 및 `with-jetty`)

Aspectran의 서블릿 아키텍처는 순수 웹 추상화(`aspectran-web`)와 Jakarta Servlet 표준 스펙 결합 계층(`aspectran-web-servlet`)으로 깔끔하게 정돈되어 있습니다.

### 4.1. 표준 서블릿 컨테이너 환경 (`aspectran-web-servlet`)
*   **목적**: Tomcat, Jetty, WildFly 등 기존 Java 서블릿 컨테이너 및 WAR 파일 배포 환경에서 Aspectran 애플리케이션을 구동합니다.
*   **주요 진입점**:
    *   `WebServiceListener`: `jakarta.servlet.ServletContextListener` 구현체로, 서블릿 컨텍스트가 초기화될 때 루트 `ServletWebService`를 생성하고 시작합니다.
    *   `WebActivityServlet`: 프론트 컨트롤러(Front Controller) 역할을 수행하는 표준 서블릿으로, 모든 HTTP 요청을 가로채 Aspectran의 트랜슬릿 처리 파이프라인으로 라우팅합니다.
*   **핵심 컴포넌트**:
    *   `ServletWebService` (구현체 `DefaultServletWebService`): 서블릿 컨테이너 환경을 주관하는 특화 서비스입니다.
    *   `ServletWebActivity`: `HttpServletRequest`와 `HttpServletResponse`를 래핑하여 실행 파이프라인을 총괄하는 `Activity`.
    *   `ActivityRequestWrapper`: 서블릿 요청을 래핑하여 파라미터 및 본문 스트림 재사용성을 보장하는 래퍼.
    *   `HttpServletRequestAdapter`, `HttpServletResponseAdapter`, `HttpSessionAdapter`: 표준 서블릿 객체를 4대 어댑터로 완벽 변환.
*   **동작 모델: 반응형 (Servlet-based Reactive)**
    클라이언트 HTTP 요청에 반응하여 서블릿 스레드 풀 내에서 동기/비동기 서블릿 처리를 완벽하게 지원합니다.

### 4.2. 임베디드 서블릿 환경: Jetty (`with-jetty`)
*   **목적**: 경량 서블릿 컨테이너인 Eclipse Jetty를 애플리케이션 내에 직접 임베딩하여, 서블릿 표준 호환성을 온전히 누리면서도 단독 실행형(Fat JAR) 웹 서비스를 운영할 수 있도록 합니다.
*   **핵심 컴포넌트**: `com.aspectran.jetty.server.JettyServer`를 통해 `ServletContextHandler`를 구성하고, `WebServiceListener`와 `WebActivityServlet`을 프로그래밍 방식으로 등록하여 부트스트랩합니다. Jetty 전용 `PathBasedLoggingGroupHandler`를 통해 요청 경로 기반 로깅 그룹 분리도 지원합니다.

## 5. 대화형 콘솔 셸 환경 (`aspectran-shell`)

### 5.1. 목적 및 특징
터미널 콘솔을 통해 사용자와 상호작용하는 대화형 명령줄 인터페이스(CLI) 환경입니다. 시스템 관리자나 개발자가 터미널에서 애플리케이션에 등록된 트랜슬릿을 직접 명령어로 실행하고 실시간 상태를 조회할 수 있습니다.

### 5.2. 주요 진입점
*   `com.aspectran.shell.AspectranShell` 클래스의 `main(String[] args)` 메서드.
*   명령행 인자로부터 구성 파일 경로를 감지하고, `DefaultShellCommander`를 인스턴스화하여 대화형 루프(REPL)를 실행합니다.

### 5.3. 핵심 컴포넌트
*   `ShellService` (구현체 `DefaultShellService`): 셸 수명주기 및 콘솔 세션을 총괄하는 `CoreService`.
*   `ShellActivity`: 콘솔 입력 인자(`TransletCommandLine`)를 요청 파라미터로 매핑하고, 표준 출력을 응답으로 제어하는 `Activity`.
*   `ShellConsole` (구현체 `DefaultShellConsole`): JLine3 라이브러리를 기반으로 명령어 히스토리, 탭 자동완성, ANSI 컬러 스타일링(`ConsoleStyler`), 패스워드 마스킹 입력을 추상화합니다.
*   `ShellCommandRegistry`: 내장 관리 명령어(`help`, `sysinfo`, `restart`, `verbose`, `clear`, `job`, `translet` 등)를 등록하고 실행합니다.

### 5.4. 동작 모델: 상호작용 REPL (Interactive)
사용자의 프롬프트 입력에 실시간으로 반응하며, 다중 명령 실행 간에 사용자 상태를 유지할 수 있는 `ShellSessionAdapter` 메모리 세션을 지원합니다.

## 6. 백그라운드 프로세스 환경: Daemon (`aspectran-daemon`)

### 6.1. 목적 및 특징
직접적인 사용자 UI나 HTTP 웹 소켓 없이 서버 백그라운드에서 상시 구동되는 장기 실행 프로세스 환경입니다. 대규모 배치 작업, 예약된 트랜슬릿 자동 처리, 내부 메시지 큐 폴링 등에 최적화되어 있습니다.

### 6.2. 다양한 부트스트랩 진입점
Aspectran 데몬은 운영체제 환경별 서비스 등록 요구사항에 맞춰 다양한 부트스트래퍼를 제공합니다:

*   `DefaultDaemon`: 명령줄 터미널에서 직접 실행할 수 있는 표준 데몬 진입점.
*   `ProcrunDaemon`: Windows 서비스(Apache Commons Daemon Procrun)로 등록되어 Windows OS 백그라운드 서비스로 구동될 때 사용하는 진입점.
*   `JsvcDaemon`: Linux/Unix 환경에서 `jsvc` 데몬 유틸리티와 연동하여 root 권한으로 포트를 연 후 일반 계정으로 권한을 낮춰 안전하게 실행할 수 있는 진입점.
*   `SimpleDaemon`: 최소한의 설정만으로 빠르게 데몬을 띄울 수 있는 간소화된 진입점.

### 6.3. 핵심 컴포넌트
*   `DaemonService` (구현체 `DefaultDaemonService`): 프로그래밍적 `translate()` 호출 및 백그라운드 폴링 작업을 통제하는 `CoreService`.
*   `DaemonActivity`: 데몬 환경 전용 `Activity`.
*   `FileCommander`: 지정된 감시 디렉토리에 명령 파일(Command File)이 인입되는 것을 실시간 폴링하여, 파일 내용을 분석하고 해당 트랜슬릿을 비동기로 실행하는 지능형 원격 제어 컴포넌트.
*   `CommandExecutor` 및 `DaemonCommandRegistry`: 데몬 내부 컴포넌트 상태 제어 및 작업 재시작 명령 처리.

### 6.4. 동작 모델: 능동적 백그라운드 (Proactive Background)
외부 요청을 수동적으로 기다리지 않고, 스케줄러나 파일 폴러를 통해 스스로 작업을 능동적으로 시작합니다. JVM 종료 훅(`ShutdownHook`)을 통해 예기치 않은 종료 시에도 안전한 리소스 해제를 보장합니다.

## 7. 애플리케이션 내장 환경: Embed (`aspectran-embed`)

### 7.1. 목적 및 특징
Aspectran 프레임워크 전체를 별도의 서버 프로세스로 띄우지 않고, 기존 Java 애플리케이션(Spring, Quarkus, 데스크톱 GUI, 배치 스크립트 등) 내에 라이브러리로 임베딩하는 환경입니다. Aspectran의 풍부한 빈 컨테이너, 템플릿 엔진, 규칙 기반 실행 파이프라인만을 선택적으로 차용하고자 할 때 최적입니다.

### 7.2. 주요 진입점
*   `com.aspectran.embed.service.EmbeddedAspectran` 인터페이스의 정적 팩토리 메서드 `run()`: 단 한 줄의 코드로 구성 파일을 로드하고 임베디드 인스턴스를 부트스트랩합니다.

### 7.3. 핵심 컴포넌트
*   `EmbeddedAspectran`: `CoreService`에 대한 고수준 퍼사드(Facade) 인터페이스입니다.
    *   `translate(transletName, ...)`: 트랜슬릿 직접 실행 및 결과 반환.
    *   `render(templateName, ...)`: 템플릿 렌더링 결과 문자열 획득.
    *   `getBean(beanId)`: 컨텍스트 내 등록된 Bean 인스턴스 룩업.
    *   `getMessage(code)`: 국제화 메시지 조회.
*   `DefaultEmbeddedAspectran`: `EmbeddedAspectran`의 표준 구현체로, 내부에 `DefaultCoreService`를 컴포지션하여 관리합니다.
*   `AspectranActivity`: 프로그래밍 방식 호출을 위한 인메모리 전용 `Activity`.

### 7.4. 동작 모델: 퍼사드 기반 인메모리 실행 (In-Memory Facade)
네트워크 소켓이나 파일 I/O 없이 순수 JVM 힙 메모리 상에서 초고속으로 트랜슬릿과 빈을 실행하므로, 복잡한 인프라 설정 없이 비즈니스 로직을 완벽하게 단위 테스트(Unit Test)할 수 있습니다.

## 8. 실행 환경별 특성 비교 및 선택 가이드

| 실행 환경 | 핵심 모듈 | 주요 진입점 | 통신 모델 | 권장 용도 |
| :--- | :--- | :--- | :--- | :--- |
| **Netty** | `with-netty` | `NettyServer`<br>`DefaultNettyService` | 비동기 논블로킹 (NIO 이벤트 루프) | 초저지연 마이크로서비스, 비서블릿 고성능 API 게이트웨이 |
| **Undertow** | `with-undertow` | `DefaultTowServiceBuilder` | 블로킹/논블로킹 하이브리드 | 경량 고성능 임베디드 웹 서버, 독립 마이크로서비스 |
| **Servlet Web** | `aspectran-web-servlet` | `WebServiceListener`<br>`WebActivityServlet` | 서블릿 기반 반응형 | 표준 WAS(Tomcat 등) 배포, 엔터프라이즈 레거시 웹 호환 |
| **Jetty** | `with-jetty` | `JettyServer` | 임베디드 서블릿 기반 | 서블릿 스펙 호환 단독 실행형(Fat JAR) 웹 애플리케이션 |
| **Shell (CLI)** | `aspectran-shell` | `AspectranShell` | 대화형 콘솔 (REPL) | 시스템 관리 콘솔 도구, 대화형 배치 러너, 터미널 도구 |
| **Daemon** | `aspectran-daemon` | `DefaultDaemon`<br>`ProcrunDaemon`<br>`JsvcDaemon` | 능동적 백그라운드 (파일/스케줄 폴링) | 장기 실행 백그라운드 데몬, 파일 기반 원격 제어, OS 서비스 |
| **Embed** | `aspectran-embed` | `EmbeddedAspectran.run()` | 인메모리 퍼사드 호출 | 기존 앱 내 라이브러리 통합, 단위 테스트 시뮬레이션 |

## 9. 결론

Aspectran의 실행 환경 아키텍처는 **"핵심 비즈니스 로직과 물리적 런타임 환경의 완벽한 분리"**를 증명합니다.

`CoreService`와 `CoreActivity`라는 견고한 공통 기반 위에, 각 환경의 기술적 장점을 극대화하는 어댑터와 전용 액티비티를 정밀하게 결합함으로써, 개발자는 단 한 번 작성한 비즈니스 로직을 코드 한 줄 변경 없이 고성능 Netty 서버, 임베디드 Undertow, 전통적인 서블릿 WAS, 콘솔 CLI 셸, 백그라운드 데몬 등 어디에나 자유롭게 배포할 수 있는 진정한 환경 독립성을 누리게 됩니다.
