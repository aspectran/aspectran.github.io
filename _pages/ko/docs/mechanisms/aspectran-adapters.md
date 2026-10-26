---
title: "Adapter 아키텍처: 환경 독립성의 핵심"
subheadline: 메커니즘
---

## 1. 아키텍처 개요 및 설계 철학

애플리케이션 프레임워크가 특정 런타임 기술(예: 서블릿 API, Netty 채널 파이프라인, 터미널 콘솔 스트림 등)에 강하게 결합되면, 동일한 비즈니스 로직을 다른 실행 환경에서 재사용하기 위해 대대적인 코드 수정이나 중복 작성이 불가피해집니다.

Aspectran은 이러한 환경 종속성을 원천적으로 배제하기 위해 **GoF 어댑터(Adapter) 패턴**을 전면 도입했습니다.

*   **환경 격리 (Environment Isolation)**: 웹 컨테이너, 비동기 네트워크 소켓, 명령줄 셸, 백그라운드 데몬 등 런타임 환경의 물리적 차이를 Aspectran 표준 인터페이스 뒤로 완전히 숨깁니다.
*   **단일 비즈니스 로직, 다중 환경 무수정 실행**: 개발자가 작성한 비즈니스 액션(`Action`), 빈(`Bean`), 그리고 트랜슬릿(`Translet`)은 오직 코어 추상화 계층에만 의존하므로, 동일한 코드를 서블릿 기반 웹 서버, Netty 기반 마이크로서비스, CLI 도구, 백그라운드 스케줄러에서 단 한 줄의 변경 없이 그대로 구동할 수 있습니다.
*   **단위 테스트 용이성**: 무거운 웹 서버나 서블릿 컨테이너를 구동하지 않고도, 메모리 기반 어댑터를 통해 비즈니스 로직을 신속하고 격리된 환경에서 테스트할 수 있습니다.

## 2. 4대 핵심 계약 인터페이스 (`com.aspectran.core.adapter`)

Aspectran의 실행 엔진은 `com.aspectran.core.adapter` 패키지에 정의된 4개의 핵심 인터페이스만을 기반으로 요청 처리 및 응답 흐름을 제어합니다.

### 2.1. `ApplicationAdapter`
애플리케이션의 물리적 실행 환경과 최상위 생명주기를 추상화합니다:

*   **기반 디렉토리 및 클래스로더 관리**: 애플리케이션의 루트 경로(`basePath`)와 리소스를 로딩할 `ClassLoader`를 제공합니다.
*   **애플리케이션 스코프 속성(Attributes)**: 애플리케이션 전역 수명주기 동안 공유되는 속성을 저장하고 조회(`getAttribute()`, `setAttribute()`, `removeAttribute()`)하는 일관된 API를 지원합니다.
*   **기본 구현**: `DefaultApplicationAdapter`는 파일 시스템 경로 기반의 표준 환경을 제공하며, 서블릿 환경에서는 `ServletContext`의 기반 경로와 연동됩니다.

### 2.2. `RequestAdapter`
다양한 유입 경로(HTTP 요청, 콘솔 명령어, 스케줄 작업 파라미터 등)를 통해 전달되는 외부 요청 데이터를 일관된 방식으로 캡슐화합니다:

*   **파라미터 추상화**: `getParameter()`, `getParameterValues()`, `getParameterNames()` 및 `MultiValueMap` 기반의 `ParameterMap`을 통해 단일/다중 요청 파라미터를 통일된 방식으로 조회합니다.
*   **속성 및 헤더 접근**: 요청 처리 생명주기 동안 유지되는 요청 속성(Request Attributes) 및 프로토콜 헤더(Headers)에 접근합니다.
*   **본문 스트림 및 인코딩**: 요청 바디를 읽기 위한 `InputStream`을 제공하며, 문자 인코딩 설정 및 요청 메서드(`MethodType`: GET, POST, PUT, DELETE 등)를 식별합니다.
*   **파일 업로드 지원**: 멀티파트 요청에서 파싱된 파일 데이터를 `FileParameter` 및 `FileParameterMap` 형태로 표준화하여 제공합니다.
*   **`RequestScope` 연동**: 단일 요청 수명주기 동안 유지되는 빈 인스턴스들을 격리 관리하는 `RequestScope`를 지연 생성(Lazy)하여 바인딩합니다.

### 2.3. `ResponseAdapter`
요청 처리 결과가 클라이언트나 호출자에게 전달되는 출력 채널을 추상화합니다:

*   **출력 스트림 이원화**: 문자열 기반 뷰 렌더링이나 JSON 직렬화를 위한 `getWriter()`(`Writer`)와 바이너리 파일 다운로드 등을 위한 `getOutputStream()`(`OutputStream`)을 제공합니다.
*   **응답 메타데이터 제어**: 문자 인코딩(`setEncoding()`), 콘텐츠 타입(`setContentType()`), HTTP 상태 코드(`setStatus()`), 사용자 정의 응답 헤더(`setHeader()`)를 일관되게 제어합니다.
*   **리다이렉트 추상화**: 클라이언트 브라우저 리다이렉트나 내부 경로 전환을 처리하는 `redirect(RedirectTarget)` 메서드를 정의합니다.

### 2.4. `SessionAdapter`
상태 유지가 필요한 환경에서 사용자 세션을 일관되게 다루기 위한 계약을 정의합니다:

*   **세션 식별 및 수명주기**: 고유한 세션 식별자(`getId()`), 세션 생성 시각(`getCreationTime()`), 마지막 접근 시각(`getLastAccessedTime()`), 최대 유휴 시간(`getMaxInactiveInterval()`)을 제공합니다.
*   **세션 속성 관리**: 세션 범위에 데이터를 저장하고 삭제하는 `getAttribute()`, `setAttribute()`, `removeAttribute()`, `invalidate()` 표준 메서드를 제공합니다.
*   **`SessionScope` 연동**: 세션 수명주기와 결합된 빈들을 관리하는 `SessionScope`의 생성을 담당합니다.

### 2.5. 어댑터 계층의 템플릿 클래스 구조
공통 로직의 중복을 방지하고 구체 어댑터를 손쉽게 확장할 수 있도록 템플릿 메서드 패턴이 적용된 추상 클래스군이 제공됩니다:

*   `AbstractApplicationAdapter<T>`: 기본 속성 맵 및 기반 경로 관리 구현.
*   `AbstractRequestAdapter<T>`: 파라미터 파싱, 로케일 해석, 타임존 바인딩 및 `RequestScope` 지연 생성 공통 처리.
*   `AbstractResponseAdapter<T>`: 응답 커밋 상태 추적, 스트림 닫기 및 버퍼 관리 공통 처리.
*   `AbstractSessionAdapter<T>`: 세션 유효성 검사 및 `SessionScope` 바인딩 처리.

> 💡 **참고**\
> 제네릭 파라미터 `<T>`는 어댑터가 내부적으로 래핑하는 원본 네이티브 객체(Adaptee)의 타입(예: `HttpServletRequest`, Netty 채널, Undertow `HttpServerExchange` 등)을 의미하며, `getAdaptee()`를 통해 타입 세이프하게 원본 객체에 접근할 수도 있습니다.

## 3. 7대 실행 환경별 구체적 어댑터 구현 심층 분석

Aspectran은 지원하는 7대 런타임 환경에 맞추어 계약 인터페이스를 대칭적으로 완벽하게 구현하고 있습니다.

### 3.1. 표준 서블릿 웹 환경 (`aspectran-web-servlet`)
전통적인 Java 서블릿 컨테이너(Tomcat, Jetty 등) 및 외부 WAS 배포 환경에서 작동하는 어댑터 세트입니다 (`com.aspectran.web.servlet.adapter` 패키지):

*   **`HttpServletRequestAdapter`**:
    *   `jakarta.servlet.http.HttpServletRequest`를 래핑합니다.
    *   서블릿의 파라미터 맵을 Aspectran의 `ParameterMap`으로 자동 변환하며, 프록시 환경에서의 클라이언트 원 IP 식별(`proxyAddressForwarding`) 및 최대 요청 크기 제한(`maxRequestSize`)을 지원합니다.
*   **`HttpServletResponseAdapter`**:
    *   `jakarta.servlet.http.HttpServletResponse`를 래핑합니다.
    *   서블릿의 `getWriter()` 또는 `getOutputStream()`을 상황에 맞게 획득하여 뷰 디스패처나 트랜스폼 응답기에 전달하며, HEAD 요청 처리용 `NoBodyResponse`와도 유기적으로 결합됩니다.
*   **`HttpSessionAdapter`**:
    *   표준 `jakarta.servlet.http.HttpSession`을 래핑하여 서블릿 세션을 Aspectran의 표준 `SessionAdapter`로 노출합니다. 세션 스코프 빈 관리를 위한 `HttpSessionScope`를 생성합니다.

### 3.2. 비서블릿 고성능 Netty 환경 (`with-netty`)
비동기 이벤트 루프 기반의 논블로킹 네트워크 서버 환경을 위한 어댑터 세트입니다 (`com.aspectran.netty.adapter` 패키지):

*   **`NettyRequestAdapter`**:
    *   Netty의 `FullHttpRequest`와 `ChannelHandlerContext`를 래핑합니다.
    *   Netty 바이트 버퍼(ByteBuf) 스트림으로부터 HTTP 본문 데이터를 스트리밍 방식으로 읽어 들이고, URI 쿼리 문자열과 폼 파라미터를 Aspectran 파라미터 맵으로 디코딩합니다. 가상 스레드 환경에서도 안전하게 채널 컨텍스트를 유지합니다.
*   **`NettyResponseAdapter`**:
    *   Netty의 `FullHttpResponse`를 생성하고 채널 파이프라인에 비동기로 플러시합니다.
    *   버퍼 크기 제어, 청크 인코딩, Keep-Alive 연결 제어 및 HTTP/2 프로토콜 변환을 지원합니다.
*   **`NettySessionAdapter`**:
    *   서블릿 컨테이너가 없는 순수 Netty 환경에서 Aspectran Session Manager와 연동하여 쿠키 기반의 분산 세션을 완벽하게 구현합니다.

### 3.3. 경량 임베디드 Undertow 환경 (`with-undertow`)
JBoss Undertow 고성능 임베디드 웹 서버를 위한 네이티브 어댑터 세트입니다 (`com.aspectran.undertow.adapter` 패키지):

*   **`TowRequestAdapter`**:
    *   Undertow의 핵심 교환 객체인 `io.undertow.server.HttpServerExchange`를 직접 래핑합니다.
    *   서블릿 API 래핑 오버헤드가 전혀 없이 Undertow의 고속 헤더 맵과 쿼리 파라미터를 다이렉트로 매핑합니다.
*   **`TowResponseAdapter`**:
    *   `HttpServerExchange`의 응답 채널 및 `io.undertow.io.Sender`를 래핑하여 블로킹 및 논블로킹 I/O를 최적의 성능으로 처리합니다.
*   **`TowSessionAdapter`**:
    *   Undertow 네이티브 세션 매니저 인터페이스와 Aspectran 세션을 유기적으로 결합합니다.

### 3.4. 대화형 콘솔(CLI) 환경 (`aspectran-shell`)
사용자가 터미널 콘솔에서 대화형으로 명령을 실행하는 환경을 위한 어댑터 세트입니다 (`com.aspectran.shell.adapter` 패키지):

*   **`ShellRequestAdapter`**:
    *   사용자가 터미널 프롬프트에 입력한 명령어와 옵션 인자(Arguments)를 요청 파라미터로 매핑합니다.
*   **`ShellResponseAdapter`**:
    *   `ShellConsole`의 표준 출력 스트림(JLine 터미널 또는 `System.out`)을 응답 출력 스트림으로 매핑하여, 트랜슬릿 처리 결과(텍스트, APON 등)가 터미널 화면에 컬러 스타일링과 함께 출력되도록 합니다.
*   **`ShellSessionAdapter`**:
    *   셸 프로그램이 실행되는 동안 사용자의 상태나 이전 명령 컨텍스트를 메모리 상에 유지하는 메모리 기반 세션을 제공합니다.

### 3.5. 백그라운드 프로세스 환경 (`aspectran-daemon`)
직접적인 콘솔 입출력이나 HTTP 소켓 없이 장기 구동되는 서버 데몬을 위한 어댑터 세트입니다 (`com.aspectran.daemon.adapter` 패키지):

*   **`DaemonRequestAdapter`**:
    *   `FileCommander`에 의한 명령 파일 인입, 폴링 큐, 또는 관리용 커맨드 실행기(`CommandExecutor`)가 발행한 매개변수를 Aspectran 요청 파라미터로 변환합니다.
*   **`DaemonResponseAdapter`**:
    *   작업 결과를 로그 파일, 응답 파일, 또는 메모리 버퍼(`StringWriter`)로 리다이렉션하여 캡처합니다.
*   **`DaemonSessionAdapter`**:
    *   장기 실행 백그라운드 작업 흐름 간에 상태를 공유할 수 있도록 지원합니다.

### 3.6. 독립 임베디드 및 단위 테스트 환경 (`aspectran-embed`)
기존 자바 애플리케이션 내에 Aspectran을 라이브러리로 임베딩하거나 Mock 테스트를 수행하기 위한 어댑터 세트입니다 (`com.aspectran.embed.adapter` 패키지):

*   **`AspectranRequestAdapter`**:
    *   외부 환경에 의존하지 않는 순수 메모리 기반의 자바 맵 객체(`Map<String, Object>`)를 요청 파라미터 및 속성으로 래핑합니다.
*   **`AspectranResponseAdapter`**:
    *   내부 메모리 `StringWriter` 또는 커스텀 `Writer`를 래핑하여, 트랜슬릿이 렌더링한 최종 결과를 메모리 상에서 직접 문자열(`toString()`)로 회수할 수 있도록 합니다.
*   **`AspectranSessionAdapter`**:
    *   독립적인 메모리 기반 세션을 제공하여 웹 환경과 동일한 세션 로직을 단위 테스트 내에서 완벽하게 시뮬레이션할 수 있습니다.

### 3.7. 스케줄러 환경 (`aspectran-core`)
Quartz 스케줄러에 의해 비주기적/주기적으로 실행되는 배치 작업을 위한 전용 어댑터 세트입니다 (`com.aspectran.core.scheduler.adapter` 패키지):

*   **`QuartzJobRequestAdapter`**:
    *   Quartz 스케줄러의 `JobExecutionContext`와 `JobDataMap`을 래핑하여, 스케줄 규칙에 정의된 작업 파라미터들을 Aspectran 요청 데이터로 매핑합니다.
*   **`QuartzJobResponseAdapter`**:
    *   스케줄된 작업의 결과를 프레임워크 로깅이나 결과 리포터로 안전하게 전달하는 무상태(Stateless) 응답 어댑터입니다.

## 4. 어댑터의 생명주기와 `Activity.adapt()` 메커니즘

어댑터는 요청이 유입되어 `Activity`가 생성되고 종료될 때까지 정밀한 생명주기를 거치며 실행 엔진과 결합됩니다.

### 4.1. `Activity.adapt()` 오케스트레이션 파이프라인
요청을 처리하는 모든 `Activity` 구현체는 다음과 같은 정형화된 순서로 어댑터를 구성합니다:

1.  **서비스 단계의 요청 포착**: 각 런타임 서비스(예: `WebActivityServlet`, `NettyServerHandler`, `AspectranShell`)가 외부 이벤트를 수신합니다.
2.  **Activity 인스턴스화**: 현재 실행 환경에 특화된 `Activity` 객체(예: `ServletWebActivity`, `NettyActivity`, `ShellActivity` 등)를 생성합니다.
3.  **`adapt()` 템플릿 메서드 호출**:
    *   `Activity.prepare()` 과정에서 환경별로 오버라이드된 `adapt()` 메서드가 실행됩니다.
    *   실행 환경의 원본 객체를 감싸는 `RequestAdapter`, `ResponseAdapter`, 그리고 활성화된 경우 `SessionAdapter`를 인스턴스화하여 `Activity`에 바인딩합니다.
    *   기본 인코딩 설정 및 최대 요청 크기(`maxRequestSize`) 등의 런타임 제약 조건을 어댑터에 주입합니다.
4.  **표준 파싱 파이프라인 가동**:
    *   어댑터 바인딩이 완료되면 `parseRequest()`가 실행되어, 선언된 파라미터 바인딩, 경로 변수(Path Variables) 매핑, 다국어 로케일(`LocaleResolver`) 해석이 표준 어댑터 인터페이스를 통해 일괄 수행됩니다.

### 4.2. 포워딩(Forwarding) 및 펜딩 액티비티에서의 어댑터 인계
트랜슬릿 처리 도중 내부 포워딩(`ForwardResponse`)이 발생하거나 하위 액티비티가 중첩 실행될 때, 기존의 세션 어댑터와 요청 어댑터가 유실되지 않도록 다음과 같은 지능적인 인계 메커니즘이 작동합니다:

*   이미 상위 액티비티(`PendingActivity`)에 세션이나 요청 어댑터가 생성되어 있다면, 새로운 하위 액티비티는 어댑터를 불필요하게 재생성하지 않고 상위 어댑터 참조를 그대로 공유합니다.
*   이를 통해 포워딩 전후로 동일한 세션 스코프와 요청 스코프 빈들이 일관되게 보존됩니다.

### 4.3. 요청 종료와 자원 정리
요청 처리가 끝나면 `Activity.perform()`의 `finally` 블록에서 어댑터 자원 정리가 진행됩니다:

*   `ResponseAdapter`의 출력 버퍼를 플러시하고 닫습니다.
*   임시 저장된 멀티파트 업로드 파일(`FileParameter`)들을 디스크에서 안전하게 자동 소거합니다.
*   `RequestScope`를 소멸시키고 스레드 로컬에 바인딩되었던 어댑터 참조를 해제하여 메모리 누수를 방지합니다.

## 5. 결론 및 아키텍처적 의의

Aspectran의 Adapter 아키텍처는 프레임워크와 비즈니스 로직을 연결하는 **궁극의 추상화 완충재(Buffer)**입니다.

*   비즈니스 개발자는 서블릿의 복잡한 API, Netty의 복잡한 채널 파이프라인, Undertow의 익스체인지 구조를 깊이 알 필요 없이, 순수 Java POJO와 일관된 Aspectran API만을 사용하여 핵심 비즈니스 로직에만 집중할 수 있습니다.
*   인프라나 배포 환경이 기존 서블릿 컨테이너에서 초고속 비동기 Netty 서버나 임베디드 Undertow로 바뀌더라도 비즈니스 코드는 단 한 줄도 변경할 필요가 없습니다.
*   이러한 완벽한 환경 분리와 높은 코드 재사용성이야말로 Aspectran이 단순한 웹 프레임워크를 넘어 **어떤 환경에서도 구동 가능한 범용 프레임워크(Universal Framework)**로 확고히 자리매김할 수 있는 아키텍처적 기반입니다.
