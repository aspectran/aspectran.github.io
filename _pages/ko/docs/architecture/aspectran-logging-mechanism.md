---
format: plate solid article
sidebar: toc-left
title: Aspectran 로깅 메커니즘 심층 분석
subheadline: Architecture Details
teaser:
---

Aspectran은 유연하고 강력한 로깅 시스템을 구축하기 위해 체계적인 접근 방식을 사용합니다. 이 문서는 Aspectran의 로깅 메커니즘을 분석하고 예제를 통해 설명합니다.

## 1. 표준 로깅 기술 채택: SLF4J와 Logback

Aspectran은 로깅 추상화 라이브러리로 **SLF4J (Simple Logging Facade for Java)**를 사용하며, 기본 구현체로는 **Logback**을 채택하고 있습니다. 이를 통해 애플리케이션 코드가 특정 로깅 구현체에 직접 의존하지 않도록 하여 유연성을 확보하고, `java.util.logging`, `log4j`, `commons-logging` 등 다양한 라이브러리의 로그를 일관되게 관리합니다.

### 의존성 설정 (`aspectran-logging/pom.xml`)

`aspectran-logging` 모듈은 Logback 및 다양한 SLF4J 브릿지에 대한 의존성을 포함하여, 다른 로깅 프레임워크의 로그까지 모두 SLF4J를 통해 제어할 수 있도록 합니다.

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
    <!-- 다른 로깅 프레임워크의 로그를 SLF4J로 전달하기 위한 브릿지들 -->
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

## 2. 핵심 기능: `LoggingGroupDiscriminator`

Aspectran 로깅의 가장 핵심적인 특징은 `com.aspectran.logging.logback.LoggingGroupDiscriminator`라는 사용자 정의 Logback `Discriminator`(구분자)입니다. 이 클래스는 로그 이벤트가 발생했을 때, 해당 로그를 어떤 논리적인 "그룹"에 포함시킬지 결정하여 로그를 동적으로 분리하는 역할을 합니다.

그룹명은 다음 우선순위에 따라 결정됩니다.

1.  **SLF4J MDC**: 현재 스레드의 MDC(Mapped Diagnostic Context)에 `LOGGING_GROUP`이라는 키로 저장된 값을 최우선으로 사용합니다. MDC는 스레드-로컬(thread-local) 저장소로, 요청 처리와 같은 특정 컨텍스트 내에서만 유효한 정보를 담는 데 사용됩니다.
2.  **ActivityContext 이름**: MDC에 `LOGGING_GROUP` 키가 없을 경우, 현재 실행 중인 Aspectran의 `ActivityContext` 이름을 그룹명으로 사용합니다. 이는 여러 Aspectran 인스턴스가 하나의 JVM에서 실행될 때 각 인스턴스의 로그를 분리하는 데 유용합니다.
3.  **기본값**: 위 두 가지 방법으로 값을 찾지 못하면 Logback 설정 파일에 지정된 기본값(defaultValue)을 사용합니다.

## 3. Logback 설정 및 동작 원리

`LoggingGroupDiscriminator`는 Logback의 `SiftingAppender`와 함께 사용될 때 그 강력함을 발휘합니다. `SiftingAppender`는 구분자(`discriminator`)가 반환한 값에 따라 동적으로 하위 Appender를 생성하고 로그 이벤트를 해당 Appender로 전달하는 역할을 합니다.

다음은 `logback-default.xml`의 설정 예제입니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<included>

    <appender name="SIFT" class="ch.qos.logback.classic.sift.SiftingAppender">
        <!-- 1. LoggingGroupDiscriminator를 사용하여 로깅 그룹을 식별 -->
        <discriminator class="com.aspectran.logging.LoggingGroupDiscriminator">
            <key>LOGGING_GROUP</key>
            <defaultValue>root</defaultValue>
        </discriminator>
        <sift>
            <!-- 2. 식별된 그룹명(${LOGGING_GROUP})에 따라 동적으로 Appender 생성 -->
            <appender name="FILE-${LOGGING_GROUP}" class="ch.qos.logback.core.rolling.RollingFileAppender">
                <!-- 3. 그룹명에 따라 로그 파일 경로가 동적으로 결정됨 -->
                <file>${aspectran.basePath:-app}/logs/${LOGGING_GROUP}.log</file>
                <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
                    <fileNamePattern>${aspectran.basePath:-app}/logs/archived/${LOGGING_GROUP}.%d{yyyy-MM-dd}.%i.log</fileNamePattern>
                    <maxFileSize>10MB</maxFileSize>
                    <maxHistory>30</maxHistory>
                    <totalSizeCap>1GB</totalSizeCap>
                </rollingPolicy>
                <encoder class="ch.qos.logback.classic.encoder.PatternLayoutEncoder">
                    <charset>UTF-8</charset>
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
    <logger name="org.apache.ibatis" level="error"/>

</included>
```

## 4. 웹 애플리케이션 연동 예제

이 로깅 메커니즘은 특히 여러 웹 애플리케이션을 하나의 서버 인스턴스에서 서비스할 때 강력한 기능을 발휘합니다. `com.aspectran.undertow.server.handler.logging.PathBasedLoggingGroupHandlerWrapper`는 요청 URI에 따라 로깅 그룹을 동적으로 설정하는 Undertow 핸들러입니다.

### `tow-server.xml` 설정 예제

```xml
<bean id="tow.server.handler.loggingGroupHandlerWrapper"
      class="com.aspectran.undertow.server.handler.logging.PathBasedLoggingGroupHandlerWrapper"
      scope="prototype">
    <properties>
        <item name="pathPatternsByGroupName" type="map">
            <entry name="jpetstore">
                +: /jpetstore
                +: /jpetstore/**
            </entry>
            <entry name="petclinic">
                +: /petclinic
                +: /petclinic/**
            </entry>
            <entry name="demo">
                +: /demo
                +: /demo/**
                -: /demo/examples/gs-rest-service/**
            </entry>
        </item>
    </properties>
</bean>
```

### 동작 흐름

1.  HTTP 요청 (예: `/jpetstore/shop.do`)이 들어옵니다.
2.  `PathBasedLoggingGroupHandlerWrapper`가 요청을 가로채 URI(`/jpetstore/shop.do`)와 설정된 패턴(`/jpetstore/**`)을 비교합니다.
3.  매칭되는 그룹명 `jpetstore`를 찾아 SLF4J의 MDC에 `MDC.put("LOGGING_GROUP", "jpetstore")` 코드를 통해 값을 저장합니다.
4.  이후 해당 요청을 처리하는 스레드에서 발생하는 모든 로그 이벤트는 `LoggingGroupDiscriminator`에 의해 `jpetstore` 그룹으로 식별됩니다.
5.  `SiftingAppender`는 `jpetstore`라는 값을 기반으로 `FILE-jpetstore`라는 이름의 `RollingFileAppender`를 (아직 없다면) 동적으로 생성하고, 해당 로그 이벤트를 이 Appender로 보냅니다.
6.  결과적으로 `/jpetstore`로 들어온 모든 요청의 로그는 `logs/jpetstore.log` 파일에 기록됩니다.

## 5. 결론

Aspectran의 로깅 메커니즘은 SLF4J와 Logback이라는 표준 기술을 기반으로 하면서, `LoggingGroupDiscriminator`와 `PathBasedLoggingGroupHandlerWrapper`라는 독자적인 아이디어를 접목하여 매우 유연하고 확장성 높은 시스템을 구현했습니다. 이를 통해 개발자는 복잡한 멀티-테넌트 또는 마이크로서비스 환경에서도 서비스나 기능 단위로 로그를 완벽하게 분리하고 관리할 수 있는 강력한 기능을 제공받게 됩니다.