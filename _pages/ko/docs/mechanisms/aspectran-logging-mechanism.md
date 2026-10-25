---
title: "Aspectran 로깅 메커니즘 심층 분석"
subheadline: 메커니즘
mermaid: true
---

Aspectran은 단일 서버 프로세스 내에서 다양한 애플리케이션 모듈, REST API 경로, 백그라운드 스케줄러 등이 독립적인 로그 파일을 유지할 수 있도록 정교하고 강력한 로깅 아키텍처를 제공합니다. 본 문서는 Aspectran의 로깅 추상화 기반과 `LoggingGroupDiscriminator`, 그리고 Netty, Undertow, Jetty 등 다중 서버 엔진과 결합된 동적 경로 기반 로깅 그룹(Logging Group) 분리 메커니즘을 심층 분석합니다.

## 1. 표준 로깅 기술 채택: SLF4J와 Logback

Aspectran은 로깅 추상화 라이브러리로 **SLF4J (Simple Logging Facade for Java)**를 사용하며, 기본 구현체로는 **Logback**을 채택하고 있습니다. 이를 통해 애플리케이션 코드가 특정 로깅 구현체에 직접 결합되지 않도록 방지하고, 타사 라이브러리들이 사용하는 다양한 로깅 API를 단일 통로로 일원화합니다.

### 1.1. 통합 브릿지 의존성 구성 (`aspectran-logging`)
`aspectran-logging` 모듈은 Logback 핵심 라이브러리와 함께 주요 레거시 로깅 프레임워크에 대한 SLF4J 리다이렉션 브릿지들을 기본 내장하고 있습니다:

```xml
<dependencies>
    <dependency>
        <groupId>${project.groupId}</groupId>
        <artifactId>aspectran-core</artifactId>
        <version>${project.version}</version>
    </dependency>
    <dependency>
        <groupId>ch.qos.logback</groupId>
        <artifactId>logback-classic</artifactId>
        <version>${logback.version}</version>
    </dependency>
    <!-- 타 로깅 프레임워크의 로그를 SLF4J로 전달하는 브릿지 라이브러리들 -->
    <dependency>
        <groupId>org.slf4j</groupId>
        <artifactId>jcl-over-slf4j</artifactId>
        <version>${slf4j.version}</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>org.slf4j</groupId>
        <artifactId>jul-to-slf4j</artifactId>
        <version>${slf4j.version}</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>org.slf4j</groupId>
        <artifactId>log4j-over-slf4j</artifactId>
        <version>${slf4j.version}</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>org.apache.logging.log4j</groupId>
        <artifactId>log4j-to-slf4j</artifactId>
        <version>${log4j-to-slf4j.version}</version>
        <scope>runtime</scope>
    </dependency>
</dependencies>
```

이 구성 덕분에 Spring, Apache Commons, Java Util Logging, Log4j 1/2 등을 사용하는 서드파티 라이브러리의 로그까지 Aspectran의 통합 로깅 정책에 따라 일관되게 제어됩니다.

## 2. 핵심 분별 엔진: `LoggingGroupDiscriminator`

Aspectran 로깅 시스템의 핵심 혁신은 `com.aspectran.logging.LoggingGroupDiscriminator` 클래스입니다. 이 클래스는 Logback의 `Discriminator`(구분자) 인터페이스를 구현하여, 로그 이벤트가 발생하는 순간 해당 이벤트가 어떤 논리적인 **로깅 그룹(Logging Group)**에 속하는지를 동적으로 판별합니다.

### 2.1. 그룹명 결정 우선순위 메커니즘
`LoggingGroupDiscriminator`는 로그 이벤트가 들어올 때 다음 3단계 우선순위에 따라 그룹명을 결정합니다:

1.  **SLF4J MDC (Mapped Diagnostic Context) - 최우선 순위**:
    *   현재 요청을 처리 중인 스레드의 MDC에서 `LOGGING_GROUP` 키 값을 조회합니다.
    *   MDC는 스레드-로컬(Thread-Local) 저장소이므로, 웹 요청이나 백그라운드 작업 단위로 로깅 그룹을 즉각 분기시키는 데 사용됩니다.
2.  **`ActivityContext` 이름**:
    *   MDC에 `LOGGING_GROUP` 값이 설정되어 있지 않다면, 현재 스레드에 바인딩된 `ActivityContext`의 고유 이름을 그룹명으로 채택합니다.
    *   단일 JVM 프로세스 내에서 여러 개의 Aspectran 컨텍스트가 독립 구동될 때 유용합니다.
3.  **Logback 설정 파일 기본값 (`defaultValue`)**:
    *   위의 두 조건에서 그룹명을 찾지 못하면, `logback.xml`에 지정된 기본값(보통 `root` 또는 `aspectran`)을 최종 그룹명으로 사용합니다.

### 2.2. 컨텍스트 헬퍼: `LoggingGroupHelper`
애플리케이션이나 프레임워크 내부에서 안전하게 로깅 그룹을 제어할 수 있도록 `com.aspectran.utils.logging.LoggingGroupHelper` 유틸리티를 제공합니다:

```java
// 로깅 그룹 진입 시 설정
LoggingGroupHelper.set("petclinic");

try {
    // 해당 블록 내에서 발생하는 모든 로그는 petclinic.log로 격리 기록됨
    doBusinessLogic();
} finally {
    // 작업 완료 후 안전하게 MDC 컨텍스트 해제
    LoggingGroupHelper.clear();
}
```

## 3. Logback `SiftingAppender` 기반의 동적 로그 분리 원리

`LoggingGroupDiscriminator`는 Logback의 `SiftingAppender`와 결합될 때 강력한 시너지를 발휘합니다. `SiftingAppender`는 구분자가 반환한 그룹명에 따라 동적으로 새로운 하위 Appender를 메모리에 생성하고 로그 이벤트를 라우팅합니다.

### 3.1. `logback-default.xml` 표준 구성 예제

```xml
<?xml version="1.0" encoding="UTF-8"?>
<included>

    <appender name="SIFT" class="ch.qos.logback.classic.sift.SiftingAppender">
        <!-- 1. LoggingGroupDiscriminator를 통해 로깅 그룹 키 추출 -->
        <discriminator class="com.aspectran.logging.LoggingGroupDiscriminator">
            <key>LOGGING_GROUP</key>
            <defaultValue>root</defaultValue>
        </discriminator>
        <sift>
            <!-- 2. 식별된 그룹명(${LOGGING_GROUP})에 따라 롤링 파일 Appender 동적 생성 -->
            <appender name="FILE-${LOGGING_GROUP}" class="ch.qos.logback.core.rolling.RollingFileAppender">
                <!-- 3. 그룹별로 분리된 로그 파일 경로 -->
                <file>${aspectran.logsDir:-${aspectran.basePath:-app}/logs}/${LOGGING_GROUP}.log</file>
                <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
                    <fileNamePattern>${aspectran.archivedLogsDir:-${aspectran.logsDir:-${aspectran.basePath:-app}/logs}/archived}/${LOGGING_GROUP}.%d{yyyy-MM-dd}.%i.log</fileNamePattern>
                    <maxFileSize>10MB</maxFileSize>
                    <maxHistory>30</maxHistory>
                    <totalSizeCap>1GB</totalSizeCap>
                </rollingPolicy>
                <encoder class="ch.qos.logback.classic.encoder.PatternLayoutEncoder">
                    <charset>${aspectran.logCharset:-UTF-8}</charset>
                    <pattern>%-5level %d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %msg - %logger{30}.%M\(%line\)%n</pattern>
                </encoder>
            </appender>
        </sift>
    </appender>

    <root level="info">
        <appender-ref ref="SIFT"/>
    </root>

    <logger name="com.aspectran" level="debug"/>
    <logger name="org.quartz" level="info"/>

</included>
```

새로운 로깅 그룹(예: `petclinic`, `jpetstore`)이 감지되면 사전 정의 없이도 런타임에 즉시 `logs/petclinic.log`, `logs/jpetstore.log` 파일이 생성되고 각각 독립된 파일 로테이션 정책이 적용됩니다.

## 4. 유연한 경로 및 캐릭터셋 구성 전략

운영 환경에 따라 로그 파일을 애플리케이션 루트(`basePath`) 외부에 보관해야 하거나 별도의 고속 스토리지 볼륨에 마운트해야 할 수 있습니다. Aspectran은 중첩 Fallback 패턴을 통해 유연한 경로 구성을 지원합니다.

*   **시스템 프로퍼티**:
    *   `aspectran.logsDir`: 활성 로그가 기록될 디렉토리.
    *   `aspectran.archivedLogsDir`: 일자별/용량별로 로테이션된 압축 아카이브 로그 디렉토리.
    *   `aspectran.logCharset`: 로그 인코딩 캐릭터셋 (기본값: UTF-8).
*   **중첩 Fallback 표현식**:
    `${aspectran.logsDir:-${aspectran.basePath:-app}/logs}`
    1.  시스템 프로퍼티 `aspectran.logsDir`이 명시되어 있으면 해당 절대/상대 경로를 최우선 사용합니다.
    2.  설정되지 않은 경우 `${aspectran.basePath}` 하위의 `/logs` 디렉토리를 사용합니다.
    3.  `basePath`조차 지정되지 않은 경우 `app/logs` 디렉토리를 기본값으로 안전하게 채택합니다.

## 5. 다중 서버 엔진별 경로 기반 로깅 그룹(Logging Group) 연동

단일 서버 인스턴스에서 다수의 마이크로서비스 모듈이나 엔드포인트 군(예: `/petclinic/**`, `/jpetstore/**`)을 호스팅할 때, 유입되는 HTTP 요청 URI 경로 패턴을 분석하여 로그를 물리적으로 분리 기록하는 전용 핸들러를 제공합니다.

Aspectran은 지원하는 3대 주요 웹/네트워크 서버 엔진(Netty, Undertow, Jetty) 모두에 대해 동일한 와일드카드 패턴 규칙(`+:`, `-:`)을 지원하는 전용 `PathBasedLoggingGroupHandler`를 완비하고 있습니다.

### 5.1. Netty 환경: `com.aspectran.netty.server.handler.logging.PathBasedLoggingGroupHandler`
서블릿 없는 고성능 Netty 서버 파이프라인에서 인바운드 HTTP 요청을 가로채 로깅 그룹을 바인딩합니다:

*   **설정 예제 (`netty-server.xml` / `netty-config.apon`)**:
```xml
<bean id="netty.server.handler.loggingGroupHandler"
      class="com.aspectran.netty.server.handler.logging.PathBasedLoggingGroupHandler"
      scope="prototype">
    <properties>
        <item name="pathPatternsByGroupName" type="map">
            <entry name="petclinic">
                +: /petclinic/**
            </entry>
            <entry name="jpetstore">
                +: /jpetstore/**
            </entry>
            <entry name="api">
                +: /api/**
                -: /api/health-check
            </entry>
        </item>
    </properties>
</bean>
```

*   **동작 원리**: Netty의 `ChannelInboundHandlerAdapter`를 상속하여 구현되었습니다. HTTP 요청이 인입되면 URI 경로를 파싱하여 매칭되는 그룹명(`petclinic` 등)을 추출하고, 채널 속성 및 MDC에 바인딩한 후 다음 핸들러로 넘깁니다. 요청 처리가 완료되면 채널 비활성화 시점에 컨텍스트를 안전하게 정리합니다.

### 5.2. Jetty 환경: `com.aspectran.jetty.server.handler.PathBasedLoggingGroupHandler`
임베디드 Jetty 서블릿 서버 환경에서 핸들러 체인을 래핑하여 동작합니다:

*   **클래스 구조**: Jetty의 `Handler.Wrapper`를 확장하여 구현되었습니다.
*   **동작 원리**:
    1.  클라이언트 요청이 Jetty 서버로 진입하면 `handle(Request, Response, Callback)` 메서드가 가로챕니다.
    2.  `pathPatternsByGroupName`에 설정된 와일드카드 패턴과 요청 경로를 비교하여 그룹명을 결정합니다.
    3.  `LoggingGroupHelper.set(loggingGroup)`을 통해 MDC에 등록한 뒤 하위 서블릿 핸들러로 위임합니다.
    4.  요청 처리가 완료되어 `Callback`이 호출되면 `LoggingGroupHelper.clear()`로 MDC를 해제합니다.

### 5.3. Undertow 환경: `PathBasedLoggingGroupHandlerWrapper` 및 `PathBasedLoggingGroupHandler`
Undertow의 고성능 핸들러 체인과 완벽히 연동됩니다 (`com.aspectran.undertow.server.handler.logging` 패키지):

*   **설정 예제 (`tow-server.xml`)**:
```xml
<bean id="tow.server.handler.loggingGroupHandlerWrapper"
      class="com.aspectran.undertow.server.handler.logging.PathBasedLoggingGroupHandlerWrapper"
      scope="prototype">
    <properties>
        <item name="pathPatternsByGroupName" type="map">
            <entry name="jpetstore">
                +: /jpetstore/**
            </entry>
            <entry name="petclinic">
                +: /petclinic/**
            </entry>
        </item>
    </properties>
</bean>
```

*   **동작 원리**: Undertow의 `HttpServerExchange`에서 `RequestPath`를 추출하고, 설정된 규칙에 매칭되는 그룹명을 찾아 MDC에 바인딩합니다. `ExchangeCompletionListener`를 등록하여 익스체인지 라이프사이클이 종료되는 시점에 MDC를 자동으로 안전하게 회수합니다.

## 6. 스케줄러 및 데몬 환경에서의 로깅 그룹 연동

웹 요청 외에 백그라운드에서 주기적으로 도는 스케줄러나 데몬 프로세스에서도 일관된 로깅 분리가 지원됩니다:

*   **스케줄러 작업 (`SchedulerService`)**:
    *   [`ActivityLauncherJob`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/scheduler/activity/ActivityLauncherJob.java)이 Quartz 트리거를 수신하여 작업을 시작할 때, 등록된 `SchedulerService.getLoggingGroup()` 값을 조회하여 `LoggingGroupHelper.set()`으로 즉시 주입합니다.
    *   덕분에 웹 요청 로그와 스케줄러 배치 작업 로그가 뒤섞이지 않고 별도의 로그 파일(예: `scheduler.log`)로 깔끔하게 격리됩니다.
*   **데몬 프로세스 (`DaemonService`)**:
    *   데몬 서비스 구성 시 지정된 고유 로깅 그룹명을 기반으로 프로세스 전반의 시스템 로그와 개별 커맨드 실행 로그를 분리 기록합니다.

## 7. 결론 및 아키텍처적 의의

Aspectran의 로깅 아키텍처는 표준 SLF4J/Logback 환경의 단순한 활용을 넘어, 현대적인 멀티 테넌트 및 마이크로서비스 운영 환경이 요구하는 **지능형 다중 엔진 로그 분리 시스템**을 완성했습니다.

*   `LoggingGroupDiscriminator`와 Logback `SiftingAppender`의 유기적 결합을 통해, 별도의 코드 수정 없이 선언적 설정만으로 로그를 무한히 분기할 수 있습니다.
*   **Netty, Jetty, Undertow** 3대 핵심 서버 런타임 전반에 걸쳐 일관된 경로 기반 로깅 핸들러를 제공함으로써, 어떤 런타임을 선택하더라도 동일한 로그 분할 전략과 모니터링 가시성을 완벽하게 보장합니다.
