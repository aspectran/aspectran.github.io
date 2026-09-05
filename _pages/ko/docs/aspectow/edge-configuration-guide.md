---
title: Aspectow Edge 구성 가이드
teaser: Netty 이벤트 루프와 Java 21 가상 스레드(Virtual Threads), 그리고 멀티 컨텍스트 기반의 Headless 관제 아키텍처를 결합한 Aspectow Edge의 서버 구성 가이드.
subheadline: Aspectow Edge
---

## 1. 서론: 포스트 리액티브 시대를 위한 초경량 런타임

Aspectow Edge는 리액티브 프로그래밍(Mono/Flux)이 초래한 코드 복잡성과 디버깅 장벽을 극복하고, 클라우드 네이티브 및 마이크로서비스 환경에서 최고의 성능과 개발 생산성을 제공하기 위해 설계된 차세대 초경량 런타임 플랫폼입니다.

전통적인 서블릿(Servlet) 사양의 레거시 오버헤드를 완전히 털어내고, 네트워크 I/O 계층에는 비동기 이벤트 주도 엔진인 [Netty](https://netty.io)를, 비즈니스 실행 계층에는 **Java 21 가상 스레드(Virtual Threads)**를 유기적으로 결합했습니다. 이를 통해 개발자는 친숙하고 직관적인 동기식 Aspectran Translet 코드를 작성하면서도, 수만 개의 동시 연결을 스레드 고갈 없이 번개처럼 처리할 수 있습니다.

특히 Aspectow Edge는 Netty 환경에서도 Undertow와 동일한 **완전한 멀티 컨텍스트(Multi-Context) 아키텍처**를 기본 지원합니다. 메인 서비스 컨텍스트와 함께 **Console 관제 컨텍스트(`/console`)**를 Netty 멀티 컨텍스트로 마운트하여, [Aspectow Console](/ko/docs/aspectow/console/)과 동일한 통신 파이프라인과 설정 파일 체계로 유기적으로 연동되어 제어됩니다. 클러스터 구성 전략에 따라 콘솔 노드를 분리하지 않고 모든 서비스 노드가 직접 Console 웹 UI를 제공할 수도 있고, 콘솔 노드를 분리할 경우 각 서비스 노드에는 웹 UI를 제외한 Headless 컨텍스트를 추가하여 극단적인 리소스 경량화를 달성할 수도 있습니다.

이 가이드에서는 Aspectow Edge의 표준 프로젝트 구조와 빌드 방법부터 Netty 내장 서버의 네트워크 리스너, 가상 스레드 디스패처, 압축 인코딩, 로깅 그룹, Access 로그, 정적 리소스 핸들러, 웹소켓(WebSocket), 세션, 그리고 멀티 컨텍스트 기반의 Headless Console 연동에 이르는 모든 설정 요소를 상세히 다룹니다.

## 2. 표준 프로젝트 구조

Aspectow Edge는 불필요한 서블릿 관련 작업 디렉터리를 배제하고, 마이크로서비스 배포와 컨테이너(Docker/K8s) 구동에 최적화된 미니멀하고 직관적인 디렉토리 구조를 따릅니다.

```
/
├── app/                  # 애플리케이션 홈 디렉토리 (런타임 기준 경로)
│   ├── bin/              # 실행 및 관리 스크립트 (daemon.sh, shell.sh)
│   ├── cmd/              # 파일 기반 비동기 명령 큐 (File Commander)
│   ├── config/           # 애플리케이션 및 Netty 서버 설정 파일
│   │   ├── aspectran-config.apon  # 프레임워크 런타임 및 프로파일 설정
│   │   ├── aspectran-rules.xml    # 비즈니스 컴포넌트 및 Translet 규칙
│   │   ├── console/               # 클러스터 노드 제어 및 모니터링 설정
│   │   │   ├── node-config.apon   # 노드 식별자 및 Heartbeat 설정
│   │   │   ├── node-rules.xml     # 노드 관리 컴포넌트 규칙
│   │   │   └── appmon-config.apon # AppMon 메트릭 수집 설정
│   │   ├── logging/               # Logback 로깅 구성 (logback-netty.xml)
│   │   └── server/                # Netty 서버 및 컨텍스트 모듈 파일
│   │       ├── server.xml         # 서버 루트 진입점
│   │       └── netty/             # Netty 서버, 컨텍스트, 지원 컴포넌트
│   │           ├── netty-server.xml          # Netty 코어 엔진 및 리스너
│   │           ├── netty-context-root.xml    # 메인 서비스 컨텍스트 (/)
│   │           ├── netty-context-console.xml # Headless 관제 컨텍스트 (/console)
│   │           └── netty-support.xml         # 지원 컴포넌트
│   ├── lib/              # Maven 의존성 외부 라이브러리 JARs
│   │   └── ext/          # 현재 Edge 애플리케이션의 패키징된 JAR
│   ├── logs/             # 애플리케이션 로그 및 Netty Access 로그
│   ├── temp/             # 파일 업로드 및 임시 작업 파일 저장소
│   ├── webapps/          # 정적 리소스 및 프론트엔드 자산 루트
│   │   └── root/         # 기본 서비스 컨텍스트 자산
│   └── work/             # 파일 세션 저장소 (선택 사항)
├── setup/                # Systemd 서비스 등록 스크립트
├── src/                  # Java 소스 코드 및 개발 리소스
└── pom.xml               # Maven 빌드 명세 파일
```

### 주요 디렉토리 안내

- **`/app/bin`**: 백그라운드 서비스 데몬 구동 스크립트(`daemon.sh`)와 대화형 진단 CLI 환경(`shell.sh`)이 포함되어 있습니다.
- **`/app/config/console`**: Undertow(Enterprise)와 완전히 동일한 노드 구성 파일들(`node-config.apon`, `node-rules.xml`, `appmon-config.apon`)을 관리하며, 중앙 관제 시스템과의 Heartbeat 및 원격 명령을 처리합니다.
- **`/app/config/server/netty`**: Netty 서버 엔진(`netty-server.xml`), 메인 서비스 컨텍스트(`netty-context-root.xml`), Headless 관제 컨텍스트(`netty-context-console.xml`), 지원 컴포넌트(`netty-support.xml`)가 위치합니다.
- **`/app/webapps/root`**: REST API 응답 외에 정적 웹 리소스(HTML/CSS/JS/이미지)를 Netty로 직접 서빙할 때 참조하는 루트 디렉토리입니다.

## 3. Maven 빌드 구성 (`pom.xml`)

### 3.1. 필수 컴파일러 속성

Aspectow Edge는 Java 21 가상 스레드를 적극적으로 활용하므로 컴파일러 릴리스를 `21` 이상으로 설정해야 하며, Translet 액션 메서드의 파라미터 매핑을 위해 `-parameters` 플래그를 활성화합니다.

```xml
<properties>
    <maven.compiler.release>21</maven.compiler.release>
    <maven.compiler.parameters>true</maven.compiler.parameters>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <netty.version>4.2.17.Final</netty.version>
</properties>
```

### 3.2. 핵심 빌드 플러그인

빌드 시에는 `maven-jar-plugin`으로 애플리케이션 코드를 `app/lib/ext/`에 생성하고, `maven-dependency-plugin`을 통해 Netty 및 Aspectran 라이브러리들을 `app/lib/`로 일괄 복사합니다.

```xml
<build>
    <plugins>
        <plugin>
            <artifactId>maven-jar-plugin</artifactId>
            <version>3.5.1</version>
            <configuration>
                <outputDirectory>app/lib/ext</outputDirectory>
            </configuration>
        </plugin>
        <plugin>
            <artifactId>maven-dependency-plugin</artifactId>
            <version>3.8.1</version>
            <executions>
                <execution>
                    <id>copy-dependencies</id>
                    <phase>package</phase>
                    <goals>
                        <goal>copy-dependencies</goal>
                    </goals>
                    <configuration>
                        <excludeTypes>pom</excludeTypes>
                        <outputDirectory>app/lib</outputDirectory>
                        <overWriteIfNewer>true</overWriteIfNewer>
                    </configuration>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

### 3.3. Netty Native Transport 의존성 구성 (선택 사항)

Aspectow Edge의 내장 Netty 서버는 호스트 OS를 분석하여 커널 수준의 고성능 소켓 I/O(Linux Epoll, macOS KQueue)를 자동 감지하여 활성화합니다. 이를 극대화하기 위해 배포 대상 운영체제 및 CPU 아키텍처에 맞는 네이티브 트랜스포트 라이브러리를 `pom.xml`의 의존성으로 포함할 수 있습니다.

* **Linux (x86_64)**: 일반적인 리눅스 64비트 서버 환경
  ```xml
  <dependency>
      <groupId>io.netty</groupId>
      <artifactId>netty-transport-native-epoll</artifactId>
      <version>${netty.version}</version>
      <classifier>linux-x86_64</classifier>
  </dependency>
  ```
* **Linux (ARM64 / aarch64)**: AWS Graviton, Ampere 등 클라우드 ARM 인스턴스
  ```xml
  <dependency>
      <groupId>io.netty</groupId>
      <artifactId>netty-transport-native-epoll</artifactId>
      <version>${netty.version}</version>
      <classifier>linux-aarch_64</classifier>
  </dependency>
  ```
* **macOS (Apple Silicon - aarch64)**: 로컬 개발 장비 (M1/M2/M3/M4 등)
  ```xml
  <dependency>
      <groupId>io.netty</groupId>
      <artifactId>netty-transport-native-kqueue</artifactId>
      <version>${netty.version}</version>
      <classifier>osx-aarch_64</classifier>
  </dependency>
  ```
* **macOS (Intel - x86_64)**:
  ```xml
  <dependency>
      <groupId>io.netty</groupId>
      <artifactId>netty-transport-native-kqueue</artifactId>
      <version>${netty.version}</version>
      <classifier>osx-x86_64</classifier>
  </dependency>
  ```
* **Windows 및 기타 OS**: 네이티브 라이브러리가 클래스패스에 없거나 Windows 환경인 경우, 표준 Java NIO(`NioEventLoopGroup`)로 안전하게 자동 폴백되어 정상 구동됩니다.

## 4. 애플리케이션 핵심 설정 (`aspectran-config.apon`)

Aspectow Edge 애플리케이션의 런타임 환경, 보안 암호화, 실행 컨텍스트, 스케줄러, 대화형 CLI 셸, 그리고 파일 기반 비동기 명령 큐(File Commander)는 `/app/config/aspectran-config.apon` 파일을 통해 통합 관리됩니다.

특히 `aspectran.workPath`와 같은 인스턴스별 고유 작업 경로는 단일 패키징 결과물로 여러 노드를 동시에 구동할 수 있도록 파일 내에 하드코딩하지 않고, JVM 옵션(`-Daspectran.workPath=...`)이나 시스템 환경변수를 통해 외부에서 동적으로 주입받도록 설계되어 있습니다.

### 4.1. `aspectran-config.apon` 구성

```apon
system: {
    properties: {
        # PBE(Password-Based Encryption) 암호화 알고리즘 및 마스터 비밀번호
        aspectran.encryption.algorithm: PBEWithMD5AndTripleDES
        aspectran.encryption.password: demo!

        # 프로퍼티 파일 읽기 인코딩
        aspectran.properties.encoding: UTF-8

        # Console 컨텍스트의 기본 활성 프로파일 지정
        # - 기본 임베디드 DB: 'h2' (외부 RDBMS 사용 시 'mariadb', 'mysql' 등으로 변경)
        # - Web UI 활성화: 'console.ui' (웹 UI 없이 Headless 모드로 구동하려면 'console.ui' 생략)
        aspectran.profiles.base.console: h2,console.ui

        # Console UI에서 메인 포털로 돌아갈 복귀 URL
        aspectow.console.portalUrl: /../
    }
}
context: {
    name: root
    rules: [
        /config/app-description.xml
        /config/aspectran-rules.xml
        /config/server/server.xml
    ]
    resources: [
        /lib/ext
    ]
    scan: [
        aspectow.demo
    ]
    profiles: {
        base: [
            console.ui
        ]
        default: [
            dev
        ]
    }
    autoReload: {
        reloadMode: hard
        scanIntervalSeconds: 5
        enabled: false
    }
    singleton: true
}
scheduler: {
    startDelaySeconds: 3
    waitOnShutdown: true
    enabled: false
}
shell: {
    prompt: "{{green}}aspectow>{{reset}} "
    commands: [
        com.aspectran.netty.shell.command.NettyCommand
        com.aspectran.shell.command.builtins.TransletCommand
        com.aspectran.shell.command.builtins.AspectCommand
        com.aspectran.shell.command.builtins.JobCommand
        com.aspectran.shell.command.builtins.PBEncryptCommand
        com.aspectran.shell.command.builtins.PBDecryptCommand
        com.aspectran.shell.command.builtins.SysInfoCommand
        com.aspectran.shell.command.builtins.EchoCommand
        com.aspectran.shell.command.builtins.EvaluateCommand
        com.aspectran.shell.command.builtins.HistoryCommand
        com.aspectran.shell.command.builtins.ClearCommand
        com.aspectran.shell.command.builtins.VerboseCommand
        com.aspectran.shell.command.builtins.HelpCommand
        com.aspectran.shell.command.builtins.RestartCommand
        com.aspectran.shell.command.builtins.QuitCommand
    ]
    session: {
        workerName: shell
        maxActiveSessions: 1
        maxIdleSeconds: 1800
        scavengingIntervalSeconds: 600
        fileStore: {
            storeDir: /work/_sessions/shell
        }
        enabled: true
    }
    historyFile: /logs/history.log
}
daemon: {
    executor: {
        maxThreads: 5
    }
    polling: {
        pollingInterval: 5000
        requeuable: true
        enabled: true
    }
    commands: [
        com.aspectran.netty.daemon.command.NettyCommand
        com.aspectran.daemon.command.builtins.InvokeActionCommand
        com.aspectran.daemon.command.builtins.TransletCommand
        com.aspectran.daemon.command.builtins.ComponentCommand
        com.aspectran.daemon.command.builtins.SysInfoCommand
        com.aspectran.daemon.command.builtins.PollingIntervalCommand
        com.aspectran.daemon.command.builtins.RestartCommand
        com.aspectran.daemon.command.builtins.QuitCommand
    ]
    session: {
        workerName: daemon
        enabled: true
    }
}
web: {
    uriDecoding: utf-8
    trailingSlashRedirect: true
    acceptable: {
        +: /**
    }
}
```

### 4.2. 핵심 설정 블록별 상세 설명

* **`system.properties`**:
  * `aspectran.encryption.*`: DB 접속 암호나 보안 토큰을 암호화(`enc:...`)하여 형상 관리 저장소에 평문 노출 없이 안전하게 보관할 수 있도록 PBE 마스터 암호키와 알고리즘을 지정합니다. (운영 환경 권장: `PBEWITHHMACSHA256ANDAES_128`)
  * `aspectran.profiles.base.console`: Console 컨텍스트의 동작 모드를 결정하는 핵심 스위치입니다. `console.ui`를 포함하면 웹 브라우저 접속용 Full Console UI가 활성화되며, 별도 콘솔 노드를 분리한 클러스터 환경에서는 `console.ui`를 생략하여 순수 백엔드 제어 평면만 구동하는 Headless 노드로 즉시 전환할 수 있습니다.
* **`context`**:
  * `rules`: 마스터 서버 설정(`server.xml`)과 비즈니스 Translet 규칙(`aspectran-rules.xml`)을 포함한 핵심 XML 파일들을 체계적으로 로드합니다. Aspectow Edge에서는 서블릿 없이 순수 Netty 컨텍스트 위에서 Translet이 요청을 직접 디스패치하므로 지연 시간(Latency)이 극도로 단축됩니다.
  * `resources`: `/lib/ext` 디렉터리의 애플리케이션 JAR을 동적 클래스패스 리소스로 바인딩합니다.
  * `scan`: 지정된 패키지 경로(`aspectow.demo` 등)에서 Aspectran 컴포넌트를 자동 탐색합니다.
* **`scheduler`**: 서버 시작 후 지연 기동 시간(`startDelaySeconds`) 및 정상 종료 대기(`waitOnShutdown`) 정책을 설정합니다.
* **`shell`**: 대화형 CLI 도구인 `app/bin/shell.sh`를 위한 설정입니다. `NettyCommand`를 통해 셸 터미널에서 Netty 서버의 바인딩 포트 및 활성 채널 상태를 즉시 점검할 수 있습니다.
* **`daemon`**: 백그라운드 서비스 데몬(`app/bin/daemon.sh`)이 `app/cmd/incoming/` 디렉터리를 감시하며 파일 기반의 비동기 명령을 처리하는 File Commander 엔진 설정입니다.
* **`web`**: 수신 URI 디코딩 인코딩 및 트레일링 슬래시(`/`) 정규화 리다이렉트 정책을 선언합니다.

## 5. Netty 내장 서버 설정 가이드

Aspectow Edge의 내장 서버는 `/app/config/server/` 디렉토리의 XML 파일들을 통해 모듈화되어 관리됩니다.

### 5.1. 모듈화된 서버 진입점 (`server.xml`)

`server.xml`은 서버 설정을 통합하는 메인 파일로, Netty 서버 엔진, 메인 컨텍스트, Headless Console 컨텍스트, 지원 모듈을 `<append>` 태그로 조합합니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>
    <description>Aspectow Edge Netty Server Master Configuration</description>

    <!-- Netty 코어 서버 및 핸들러 체인 -->
    <append file="/config/server/netty/netty-server.xml"/>

    <!-- 메인 비즈니스 서비스 컨텍스트 (루트 경로: /) -->
    <append file="/config/server/netty/netty-context-root.xml"/>

    <!-- Console 관제 컨텍스트 (노드 제어 평면: /console) -->
    <append file="/config/server/netty/netty-context-console.xml"/>

    <!-- 런타임 지원 컴포넌트 및 포트 프로바이더 -->
    <append file="/config/server/netty/netty-support.xml"/>
</aspectran>
```

### 5.2. Netty 코어 엔진 및 멀티 컨텍스트 바인딩 (`netty-server.xml`)

`DefaultNettyServer`는 Netty 기반 서버의 핵심 인스턴스로, EventLoopGroup, 가상 스레드 디스패처, 네트워크 리스너, 그리고 전역 핸들러 체인과 **멀티 컨텍스트(`contexts`)**를 총괄합니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>

    <environment>
        <property name="netty.server.listener.http.port" valueType="int">8081</property>
        <property name="netty.server.listener.http.host">0.0.0.0</property>
        <properties profile="prod">
            <item name="netty.server.domain">aspectran.com</item>
        </properties>
    </environment>

    <bean id="netty.server" class="com.aspectran.netty.server.DefaultNettyServer">
        <!-- Java 21 가상 스레드 디스패처 활성화 (핵심) -->
        <property name="virtualThreads" valueType="boolean">true</property>
        <!-- Linux Epoll / macOS KQueue 등 OS 네이티브 트랜스포트 자동 감지 -->
        <property name="nativeTransport" valueType="boolean">true</property>
        <!-- 리버스 프록시(Nginx/ALB) 뒤에서 실제 클라이언트 IP 복원 -->
        <property name="proxyAddressForwarding" valueType="boolean">true</property>

        <!-- 네트워크 소켓 옵션 및 튜닝 -->
        <property name="bossThreads" valueType="int">1</property>
        <property name="workerThreads" valueType="int">0</property> <!-- 0: CPU 코어 수 기반 자동 산출 -->
        <property name="shutdownTimeoutSecs" valueType="int">5</property>
        <property name="idleTimeout" valueType="int">60</property>
        <property name="maxContentLength" valueType="int">10485760</property> <!-- 10MB -->

        <!-- 전역 핸들러 바인딩 -->
        <property name="accessLogHandler">#{netty.server.handler.accessLogHandler}</property>
        <property name="encodingHandler">#{netty.server.handler.encodingHandler}</property>
        <property name="loggingGroupHandler">#{netty.server.handler.loggingGroupHandler}</property>

        <!-- HTTP 네트워크 리스너 설정 -->
        <property name="listeners" type="array">
            <bean class="com.aspectran.netty.server.NettyListenerConfig">
                <property name="host">%{netty.server.listener.http.host}</property>
                <property name="port" valueType="int">%{netty.server.listener.http.port}</property>
            </bean>
        </property>

        <!-- Netty 멀티 컨텍스트 등록: 메인 서비스와 Console 관제 컨텍스트 -->
        <property name="contexts" type="array">
            <value>#{netty.context.root}</value>
            <value>#{netty.context.console}</value>
        </property>
    </bean>

    <!-- 접근 로그 핸들러 -->
    <bean id="netty.server.handler.accessLogHandler"
          class="com.aspectran.netty.server.handler.accesslog.NettyAccessLogHandler"
          scope="prototype">
        <property name="category">com.aspectran.netty.accesslog</property>
        <property name="formatString" tokenize="false">%t %a %{c,JSESSIONID} "%r" %s %b "%{i,Referer}" "%{i,User-Agent}"</property>
    </bean>

    <!-- 압축 인코딩 핸들러 -->
    <bean id="netty.server.handler.encodingHandler"
          class="com.aspectran.netty.server.handler.encoding.NettyEncodingHandler"
          scope="prototype">
        <property name="encodingProviders" type="array">
            <value>gzip</value>
        </property>
        <property name="encodingPredicates" type="array">
            <bean class="com.aspectran.netty.server.handler.encoding.ContentEncodingPredicates">
                <property name="mediaTypes" type="array">
                    <value>text/html</value>
                    <value>text/css</value>
                    <value>text/javascript</value>
                    <value>application/javascript</value>
                </property>
            </bean>
            <bean class="com.aspectran.netty.server.handler.encoding.ContentEncodingPredicates">
                <property name="contentSizeLargerThan" valueType="long">32</property>
                <property name="mediaTypes" type="array">
                    <value>text/xml</value>
                    <value>text/plain</value>
                    <value>application/json</value>
                    <value>application/xml</value>
                    <value>application/apon</value>
                </property>
            </bean>
        </property>
    </bean>

    <!-- 경로 패턴 기반 로깅 그룹 분기 핸들러 -->
    <bean id="netty.server.handler.loggingGroupHandler"
          class="com.aspectran.netty.server.handler.logging.PathBasedLoggingGroupHandler"
          scope="prototype">
        <property name="pathPatternsByGroupName">
            <item name="order">
                +: /order/**
                +: /checkout/**
            </item>
            <item name="payment">
                +: /payment/**
                +: /billing/**
            </item>
            <item name="api">
                +: /api/**
                -: /api/internal/**
            </item>
        </property>
    </bean>

</aspectran>
```

#### 5.2.1. 가상 스레드 디스패칭 (`virtualThreads=true`)
Aspectow Edge의 가장 혁신적인 특징입니다:
* `virtualThreads`가 `true`로 설정되면, Netty의 I/O EventLoop는 클라이언트의 소켓 연결 및 HTTP 패킷 조합까지만 담당하고, 실제 비즈니스 로직(Translet 실행, DB 쿼리, 외부 API 호출)은 **Java 21 가상 스레드 풀(`Executors.newVirtualThreadPerTaskExecutor()`)**로 즉시 위임(Dispatch)합니다.
* 가상 스레드는 OS 스레드를 거의 소모하지 않으므로, 수만 건의 동시 블로킹 I/O 작업이 발생하더라도 서버 스레드가 고갈되지 않으며 찰나의 순간에 복구됩니다.
* 개발자는 리액티브 체인 없이 가장 직관적이고 편안한 순차 코드를 그대로 유지할 수 있습니다.

#### 5.2.2. OS 네이티브 트랜스포트 자동 감지 (`nativeTransport=true`)
`nativeTransport`가 `true`로 활성화되면, 서버 기동 시 호스트 운영체제와 런타임 클래스패스를 분석하여 최적의 네트워크 트랜스포트 드라이버를 자동으로 선택합니다:
* **Linux**: 리눅스 커널 Epoll 기반 `EpollEventLoopGroup` 및 `EpollServerSocketChannel` 자동 적용 (`netty-transport-native-epoll` 라이브러리 필요)
* **macOS**: BSD KQueue 기반 `KQueueEventLoopGroup` 및 `KQueueServerSocketChannel` 자동 적용 (`netty-transport-native-kqueue` 라이브러리 필요)
* **Windows 및 폴백**: 해당 네이티브 라이브러리가 없거나 지원되지 않는 플랫폼인 경우, 표준 Java NIO(`NioEventLoopGroup`, `NioServerSocketChannel`)로 안전하게 폴백(Fallback)

각 OS 및 CPU 아키텍처(x86_64, aarch64)에 따른 세부 Maven 의존성 설정 방법은 상단의 [3.3. Netty Native Transport 의존성 구성](#33-netty-native-transport-의존성-구성-선택-사항)을 참조하십시오.

#### 5.2.3. 리버스 프록시 및 클라이언트 주소 복원 (`proxyAddressForwarding=true`)
Nginx나 Kubernetes Ingress, 클라우드 ALB 뒤에 배치될 경우, `proxyAddressForwarding`을 `true`로 활성화하면 클라이언트의 실제 IP(`X-Forwarded-For`)와 프로토콜(`X-Forwarded-Proto`)을 정확히 복원하여 Access 로그와 Translet Request Adapter에 제공합니다.

#### 5.2.4. URL 경로 기반 로깅 그룹 분기 (`PathBasedLoggingGroupHandler`)
마이크로서비스에서 대용량 트래픽이 유입될 때 모든 요청 로그를 단일 `app.log` 파일에 기록하면 가독성이 떨어지고 I/O 병목이 발생합니다. [`PathBasedLoggingGroupHandler`](https://github.com/aspectran/aspectran/blob/master/with-netty/src/main/java/com/aspectran/netty/server/handler/logging/PathBasedLoggingGroupHandler.java)는 수신 요청의 URI 경로를 분석하여 로그를 업무 도메인별로 물리적인 개별 로그 파일에 실시간 분기 저장합니다.

* **동작 메커니즘**:
  * 클라이언트 요청이 들어오면 설정된 `pathPatternsByGroupName`의 APON 와일드카드 패턴(`+:` include, `-:` exclude)과 대조하여 해당 요청이 속할 로깅 그룹명(`groupName`)을 결정합니다.
  * 결정된 그룹명은 [`ChannelLoggingGroupHelper`](https://github.com/aspectran/aspectran/blob/master/with-netty/src/main/java/com/aspectran/netty/server/handler/logging/ChannelLoggingGroupHelper.java)를 통해 Netty 채널 속성(`LOGGING_GROUP_KEY`)에 저장되는 동시에, 현재 요청을 수행하는 가상 스레드의 SLF4J MDC 컨텍스트에 즉시 바인딩됩니다.
  * Logback 설정 파일(`logback-netty.xml`)에서 `LoggingGroupDiscriminator`나 `SiftingAppender`를 지정하면, 업무 도메인별 전용 로그 파일(예: `order.log`, `payment.log`, `api.log`)로 자동 라우팅되어 기록됩니다.
  * 패턴과 일치하지 않는 요청은 해당 컨텍스트(`NettyContext`)의 기본 로깅 그룹으로 폴백되며, 요청 처리가 완료되면 `finally` 블록에서 `LoggingGroupHelper.clear()`가 호출되어 스레드 오염을 방지합니다.

### 5.3. 메인 서비스 컨텍스트 (`netty-context-root.xml`)

`NettyContext`는 특정 URL 경로(Context Path)에 배포되는 독립된 애플리케이션 런타임입니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>

    <environment>
        <property name="netty.context.root.name">root</property>
    </environment>

    <bean id="netty.context.root" class="com.aspectran.netty.server.NettyContext">
        <!-- 컨텍스트 마운트 경로 -->
        <property name="contextPath">/</property>

        <!-- 정적 리소스 핸들러 설정 (Zero-Copy 지원) -->
        <property name="resourceHandler">
            <bean class="com.aspectran.netty.server.handler.resource.NettyResourceHandler">
                <property name="basePath">/webapps/%{netty.context.root.name}</property>
            </bean>
        </property>

        <!-- 세션 관리자 바인딩 -->
        <property name="sessionManager">#{netty.context.root.sessionManager}</property>
    </bean>

    <!-- 경량 세션 관리자 설정 -->
    <bean id="netty.context.root.sessionManager"
          class="com.aspectran.netty.server.session.NettySessionManager"
          scope="prototype">
        <property name="sessionManagerConfig">
            <bean class="com.aspectran.core.context.config.SessionManagerConfig">
                <argument>
                    workerName: edge0
                    maxActiveSessions: 50000
                    maxIdleSeconds: 1800
                    evictionIdleSeconds: 600
                    maxIdleSecondsForNew: 60
                    evictionIdleSecondsForNew: 30
                    scavengingIntervalSeconds: 60
                    clusterEnabled: false
                </argument>
            </bean>
        </property>
        <!-- 로컬 파일 기반 세션 스토어 -->
        <property name="sessionStore">
            <bean class="com.aspectran.core.component.session.FileSessionStoreFactoryBean">
                <property name="storeDir">%{system:aspectran.workPath:/work}/_sessions/%{netty.context.root.name}</property>
                <property name="gracePeriodSecs" valueType="int">30</property>
            </bean>
        </property>
    </bean>

</aspectran>
```

#### 5.3.1. 논-서블릿(Non-Servlet) 정적 리소스 핸들러 (`NettyResourceHandler` & `NettyClassPathResourceHandler`)

Aspectow Edge는 서블릿 컨테이너를 거치지 않고 Netty 인바운드 채널 파이프라인에서 파일시스템 또는 클래스패스의 정적 파일(HTML, CSS, JavaScript, 이미지, 폰트 등)을 직접 클라이언트에게 초고속으로 서빙합니다.

##### 1) 파일시스템 기반 리소스 서빙 (`NettyResourceHandler`)
로컬 디스크의 특정 디렉터리로부터 정적 파일을 서빙할 때는 [`NettyResourceHandler`](https://github.com/aspectran/aspectran/blob/master/with-netty/src/main/java/com/aspectran/netty/server/handler/resource/NettyResourceHandler.java)를 사용합니다.

```xml
<!-- 파일시스템 정적 리소스 핸들러 설정 예시 -->
<bean id="netty.resourceHandler"
      class="com.aspectran.netty.server.handler.resource.NettyResourceHandler">
    <!-- 정적 파일이 위치한 기본 디렉터리 (상대 경로는 앱 루트 기준 자동 해석) -->
    <property name="basePath">/webapps/%{netty.context.root.name}</property>
    <!-- 요청 URI에서 제거할 컨텍스트 접두사 (루트 컨텍스트는 "/") -->
    <property name="contextPath">%{netty.context.root.contextPath:/}</property>
    <!-- 디렉터리 요청 시 우선 서빙할 인덱스 파일 목록 (기본값: index.html, index.htm) -->
    <property name="indexFiles" type="array">
        <value>index.html</value>
        <value>index.htm</value>
    </property>
    <!-- WEB-INF, META-INF 등 민감 보호 디렉터리 접근 차단 (기본값: true) -->
    <property name="blockProtectedDirectories" valueType="boolean">true</property>
    <!-- 정적 리소스로 처리할 URL 경로 패턴 (선택 사항: APON 포맷 또는 패턴 배열) -->
    <property name="pathPatterns">
        <value>
            +: /assets/**
            +: /css/**
            +: /js/**
            +: /images/**
            +: /favicon.ico
            -: /assets/secret/**
        </value>
    </property>
</bean>
```

##### 2) 클래스패스 기반 리소스 서빙 (`NettyClassPathResourceHandler`)
정적 리소스가 애플리케이션 JAR 파일 내부나 클래스패스에 패키징되어 배포되는 단일 실행 아티팩트/마이크로서비스 환경에서는 [`NettyClassPathResourceHandler`](https://github.com/aspectran/aspectran/blob/master/with-netty/src/main/java/com/aspectran/netty/server/handler/resource/NettyClassPathResourceHandler.java)를 사용합니다.

```xml
<!-- 클래스패스 정적 리소스 핸들러 설정 예시 -->
<bean id="netty.resourceHandler"
      class="com.aspectran.netty.server.handler.resource.NettyClassPathResourceHandler">
    <!-- 정적 파일이 위치한 클래스패스 기준 접두사 -->
    <property name="prefix">static/</property>
    <!-- 요청 URI에서 제거할 컨텍스트 접두사 -->
    <property name="contextPath">%{netty.context.root.contextPath:/}</property>
    <!-- 디렉터리 요청 시 우선 서빙할 인덱스 파일 목록 -->
    <property name="indexFiles" type="array">
        <value>index.html</value>
        <value>index.htm</value>
    </property>
    <!-- 정적 리소스로 처리할 URL 경로 패턴 -->
    <property name="pathPatterns">
        <value>
            +: /**
            -: /api/**
        </value>
    </property>
</bean>
```

* `NettyClassPathResourceHandler`는 `NettyResourceHandler`를 상속하여 **동일한 보안 필터링(`sanitizePath`, `blockProtectedDirectories`), APON 와일드카드 패턴 매칭(`pathPatterns`), 디렉터리 인덱스 매핑(`indexFiles`), 그리고 HTTP 캐싱(`If-Modified-Since` 기반 `304 Not Modified`) 메커니즘**을 모두 공유합니다.
* [`ActivityContextAware`](https://github.com/aspectran/aspectran/blob/master/with-netty/src/main/java/com/aspectran/netty/server/handler/resource/NettyClassPathResourceHandler.java#L59)를 구현하여 컨텍스트 클래스로더로부터 리소스 `InputStream`을 열고, Netty의 `ChunkedStream`을 통해 메모리 부하 없이 클라이언트에게 고속 스트리밍 전송합니다.

##### 지원 프로퍼티 (Bean Properties)

* **`basePath` / `baseDir`** (`NettyResourceHandler` 전용):
  * 정적 리소스 파일이 위치한 파일시스템 디렉터리 경로입니다.
  * [`ApplicationAdapterAware`](https://github.com/aspectran/aspectran/blob/master/with-netty/src/main/java/com/aspectran/netty/server/handler/resource/NettyResourceHandler.java#L19)를 구현하여 `/webapps/root`와 같은 상대 경로를 지정하면 애플리케이션 루트 디렉터리를 기준으로 자동 변환됩니다.
* **`prefix`** (`NettyClassPathResourceHandler` 전용):
  * 클래스패스 내에서 정적 파일을 탐색할 패키지 접두사 경로(예: `static/` 또는 `public/`)를 지정합니다.
* **`contextPath`**:
  * 핸들러에 연결된 컨텍스트 경로 접두사입니다. 수신된 요청 URI에서 해당 접두사를 제거하여 리소스 상대 경로를 산출합니다.
* **`pathPatterns`**:
  * 리소스 핸들러가 처리할 URL 경로의 include/exclude 와일드카드 패턴 규칙입니다.
  * APON 문자열(`+: /static/**`, `-: /static/secret/**`) 또는 문자열 배열로 선언할 수 있습니다.
  * 패턴이 설정된 경우 일치하는 요청만 정적 파일로 서빙하며, 일치하지 않는 요청은 파이프라인의 다음 단계(예: Translet 디스패처)로 즉시 패스(`ctx.fireChannelRead(request)`)합니다.
* **`indexFiles`**:
  * `/` 또는 `/docs/`와 같이 디렉터리 경로가 요청되었을 때 우선 탐색하여 서빙할 기본 인덱스 파일 목록입니다. (기본값: `index.html`, `index.htm`)
  * `null`을 지정하면 디렉터리 인덱스 자동 매핑이 비활성화됩니다.
* **`blockProtectedDirectories`**:
  * `/WEB-INF/`, `/META-INF/`와 같은 보안상 민감한 보호 디렉터리에 대한 클라이언트 접근을 차단할지 여부입니다. (기본값: `true`)
  * 대소문자 무관하게 요청 경로의 선두, 중간, 끝 세그먼트를 모두 검사하여 안전하게 차단합니다.

##### 핵심 내부 동작 및 성능 최적화 메커니즘

* **Zero-Copy 전송과 청크 스트리밍의 하이브리드 지원**:
  * **일반 비암호화 HTTP (파일시스템)**: OS 커널 수준의 `sendfile` 시스템 콜을 활용하는 [`DefaultFileRegion`](https://github.com/aspectran/aspectran/blob/master/with-netty/src/main/java/com/aspectran/netty/server/handler/resource/NettyResourceHandler.java#L475)을 사용하여 사용자 공간 메모리 복사 없이 디스크에서 소켓 버퍼로 다이렉트 전송합니다.
  * **클래스패스 리소스 및 TLS/SSL/압축 환경**: JAR 내부 리소스 서빙 또는 파이프라인에 `SslHandler`/`HttpContentCompressor`가 활성화된 경우, [`HttpChunkedInput`](https://github.com/aspectran/aspectran/blob/master/with-netty/src/main/java/com/aspectran/netty/server/handler/resource/NettyResourceHandler.java#L471)과 `ChunkedFile` 또는 `ChunkedStream`을 통한 8KB 청크 스트리밍으로 자동 전환되어 안전하게 서빙됩니다.
* **디렉터리 순회(Directory Traversal) 공격 원천 방어**:
  * `sanitizePath` 메서드를 통해 `..` 상대 경로 이동이나 숨김 세그먼트(`.`)가 포함된 경로 조작을 즉시 무효화합니다.
  * 실제 파일시스템 서빙 시 정규 경로(`getCanonicalPath()`)가 `baseDir` 하위에 위치하는지 엄격히 검증하여 파일시스템 외부 디렉터리로의 탈출을 원천 방어합니다.
* **HTTP 캐싱 및 조건부 요청 (`304 Not Modified`)**:
  * 클라이언트의 `If-Modified-Since` 헤더와 파일의 최종 수정 시간(`lastModified`)을 초 단위로 비교하여, 파일이 변경되지 않은 경우 바디 전송 없이 즉시 `304 Not Modified` 응답을 반환하여 대역폭을 절약합니다.
  * `Date`, `Expires`, `Cache-Control` (`private, max-age=60`), `Last-Modified` 헤더를 자동으로 생성하여 응답에 주입합니다.
* **MIME 타입(Content-Type) 자동 판별**:
  * `java.nio.file.Files.probeContentType()`을 1차로 시도하고, 확인되지 않을 경우 파일 확장자(`html`, `css`, `js`, `json`, `svg`, `png`, `jpg`, `txt`, `xml` 등)를 기반으로 UTF-8 인코딩이 지정된 표준 MIME 타입을 자동 설정합니다.
* **HTTP 메서드 지원**:
  * `GET` 및 `HEAD` 요청만 처리하며, `HEAD` 요청 시에는 바디 전송 없이 HTTP 헤더만 반환하여 네트워크 자원을 절약합니다.

#### 5.3.2. 논-서블릿(Non-Servlet) 세션 관리자 (`NettySessionManager` & `NettySessionConfig`)

Aspectow Edge는 서블릿 컨테이너의 무거운 세션 오버헤드를 완전히 배제하고, Netty 인바운드/아웃바운드 HTTP 채널 파이프라인에서 직결 구동되는 초경량 세션 관리자를 제공합니다.

##### 1) 핵심 아키텍처 및 동작 원리

* **[`NettySessionManager`](https://github.com/aspectran/aspectran/blob/master/with-netty/src/main/java/com/aspectran/netty/server/session/NettySessionManager.java)**:
  * Aspectran 코어의 [`DefaultSessionManager`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/component/session/DefaultSessionManager.java)를 직접 상속하여 구현되었습니다.
  * 서블릿 API(`HttpServletRequest`, `HttpSession`)에 전혀 의존하지 않으며, Netty 네이티브 HTTP 요청(`FullHttpRequest`) 수신 시 `Cookie` 헤더를 디코딩하여 세션을 식별하고, 응답 송신 시 `Set-Cookie` 헤더를 안전하게 주입합니다.
  * 논-서블릿 환경에서도 단일 서버 메모리 캐싱 및 백그라운드 세션 청소(`HouseKeeper`)가 동일하게 작동합니다.

##### 2) `NettySessionConfig`를 통한 세션 쿠키 정책 설정

Netty 환경에서의 세션 쿠키 발급 정책은 [`NettySessionConfig`](https://github.com/aspectran/aspectran/blob/master/with-netty/src/main/java/com/aspectran/netty/server/session/NettySessionConfig.java) Bean을 통해 정밀하게 제어합니다.

```xml
<property name="sessionConfig">
    <bean class="com.aspectran.netty.server.session.NettySessionConfig">
        <property name="cookieName">JSESSIONID</property>
        <property name="cookiePath">/</property>
        <property name="cookieDomain">.aspectran.com</property>
        <property name="httpOnly" valueType="boolean">true</property>
        <property name="secure" valueType="boolean">false</property>
        <property name="sameSite">Lax</property>
        <property name="maxAge" valueType="int">-1</property>
    </bean>
</property>
```

* **`cookieName`**: 세션 식별 쿠키 이름입니다. (기본값: `JSESSIONID`)
* **`cookiePath`**: 세션 쿠키가 적용되는 URL 경로 범위입니다. (기본값: `/`)
* **`cookieDomain`**: 서브도메인 간 세션 공유가 필요한 경우 최상위 도메인을 설정합니다. (예: `.aspectran.com`)
* **`httpOnly`**: JavaScript의 `document.cookie`를 통한 접근을 차단하여 XSS 공격 시 세션 탈취를 방지합니다. (기본값: `true`)
* **`secure`**: HTTPS 암호화 채널에서만 쿠키가 전송되도록 제한합니다. 운영 환경에서는 `true` 권장.
* **`sameSite`**: CSRF 공격을 방어하기 위한 정책으로 `Strict`, `Lax`, `None`을 지정할 수 있습니다. (기본값: `Lax`)
* **`maxAge`**: 쿠키의 유효 수명(초 단위)입니다. 기본값 `-1`은 브라우저 종료 시 삭제되는 표준 세션 쿠키로 동작함을 의미합니다.

##### 3) 세션 저장소(`sessionStore`) 전략 (인메모리 / 파일 / Redis)

* **순수 인메모리 세션 (`sessionStore` 생략)**:
  * `sessionStore` Bean을 정의하지 않고 [`SessionManagerConfig`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/context/config/SessionManagerConfig.java)만 주입하면, 디스크나 외부 네트워크 I/O 없이 오직 JVM 힙 메모리에서만 구동되는 초경량 세션 매니저로 동작합니다.
  * 파일 기록 오버헤드가 없어 최고 수준의 반응 속도를 제공하며, 콘솔 데모 환경(예: `aspectow-demo-console`), 임시 토큰 보관, 단기 테스트 등 세션 영속화가 불필요한 환경에 매우 적합합니다.
* **로컬 파일 영속화 (`!prod`)**: `FileSessionStoreFactoryBean`을 사용하여 디스크 파일(`app/work/_sessions/`)에 세션을 기록하므로, 로컬 개발 시 서버 재기동 후에도 로그인 상태가 유지됩니다.
* **운영 환경 Redis 클러스터링 (`prod`)**: 무상태(Stateless) 마이크로서비스 확장을 위해 Lettuce 기반의 `DefaultLettuceSessionStoreFactoryBean`을 주입하여 중앙 집중형 Redis 클러스터와 세션을 실시간 동기화합니다.

##### 4) 세션 이벤트 리스너 등록 (`SessionListenerRegistrationBean`)

Netty 환경에서 세션의 생성 및 소멸 이벤트를 감지하여 감사 로그를 기록하거나 접속자 수를 추적할 때는 [`SessionListenerRegistrationBean`](https://github.com/aspectran/aspectran/blob/master/with-netty/src/main/java/com/aspectran/netty/support/SessionListenerRegistrationBean.java)을 컨텍스트에 등록합니다.

```xml
<bean class="com.aspectran.netty.support.SessionListenerRegistrationBean">
    <property name="targetPath">/</property>
    <property name="sessionListener">
        <bean class="com.aspectran.example.listener.UserSessionTrackingListener"/>
    </property>
</bean>
```

> [!TIP]
> 세션 유휴 시간 관리(`SessionManagerConfig`), 신규/일반 세션 분리를 통한 봇/크롤러 세션 차단 최적화, `@NonPersistent`를 통한 선택적 영속화, 그리고 Redis 분산 클러스터링의 세부 동작 메커니즘은 **[`Aspectran Session Manager 가이드`](/ko/docs/guides/aspectran-session-manager/)**를 참조하십시오.

### 5.4. Console 관제 컨텍스트 (`netty-context-console.xml`)

Undertow와 마찬가지로 Netty 역시 멀티 컨텍스트를 기본 지원하므로, `/console` 경로에 독립된 Console 컨텍스트를 마운트합니다. Console 컨텍스트는 클러스터 구성 전략에 따라 **Headless Console 모드(UI 제외)**와 **Full Console 모드(UI 포함)**를 자유롭게 선택할 수 있습니다.

#### 5.4.1. Headless Console 모드 (콘솔 노드 분리 시 권장)
별도의 독립된 콘솔 전용 노드나 Aspectow Enterprise 기함 서버에서 중앙 관제 웹 UI를 제공하고, 각 서비스 노드(Edge)에서는 웹 UI를 제외한 백엔드 제어 평면(웹소켓 세션, 원격 CLI, 스케줄러 제어 API)만을 활성화하여 리소스 점유를 극소화하는 구성입니다.

`/app/config/server/netty/netty-context-console.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>

    <description>
        Aspectow Edge Headless Console Context Configuration
    </description>

    <!-- 콘솔 코어 설정 참조 (UI 제외 Headless 모드) -->
    <append resource="com/aspectran/aspectow/console/config/rules/context/netty-context-console-headless.xml"/>

</aspectran>
```

내부적으로 `netty-context-console-headless.xml`은 웹소켓 컨테이너와 백엔드 규칙만을 최소한으로 초기화합니다:

```xml
<bean id="netty.context.console"
      class="com.aspectran.netty.server.NettyContext"
      scope="prototype">
    <property name="contextPath">/console</property>
    <property name="aspectranConfigFile">classpath:com/aspectran/aspectow/console/config/aspectran-config.apon</property>
    <!-- 실시간 원격 제어 및 양방향 스트리밍을 위한 웹소켓 컨테이너 초기화 -->
    <property name="webSocketServerContainerInitializer">
        <bean class="com.aspectran.netty.server.websocket.NettyWebSocketServerContainerInitializer">
            <property name="idleTimeout" valueType="long">60000</property>
        </bean>
    </property>
</bean>
```

#### 5.4.2. Full Console 모드 (올인원 노드 구성)
콘솔 전용 노드를 따로 분리하지 않고, 모든 서비스 노드가 직접 브라우저로 접속 가능한 통합 관제 웹 UI를 함께 제공하고자 할 때 사용합니다.

`/app/config/server/netty/netty-context-console.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>

    <description>
        Aspectow Edge Full Console Context Configuration
    </description>

    <!-- 콘솔 웹 UI 및 제어 평면 전체 참조 -->
    <append resource="com/aspectran/aspectow/console/config/rules/context/netty-context-console.xml"/>

</aspectran>
```

* **단일 포트 통합**: Netty 서버의 단일 포트(예: 8081)에서 메인 서비스(`/`)와 관제 컨텍스트(`/console`)를 동시에 서빙하므로 추가 포트 개방이나 별도의 프로세스 관리가 필요 없습니다.

### 5.5. 부가 지원 컴포넌트 (`netty-support.xml`)

`netty-support.xml`은 세션 리스너 등록과 런타임 바인딩 포트 정보를 관제 제어 평면에 노출합니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>

    <!-- 세션 이벤트 리스너 자동 등록 -->
    <bean id="sessionListenerRegistration"
          class="com.aspectran.netty.support.SessionListenerRegistrationBean" lazyInit="true">
        <argument>netty.server</argument>
        <argument>root</argument>
    </bean>

    <!-- Netty 서버의 실제 바인딩 포트 정보를 관제 시스템에 노출 -->
    <bean class="com.aspectran.aspectow.console.cluster.support.NettyServerPortProvider">
        <argument>netty.server</argument>
    </bean>

</aspectran>
```

## 6. 부가 기능 및 로깅 설정

애플리케이션의 로깅과 클러스터 관제 설정은 `/app/config/` 하위의 전용 디렉토리에서 독립적으로 모듈화되어 관리됩니다.

### 6.1. 로깅 구성 (`/config/logging/`)

Aspectow Edge는 Logback 프레임워크를 기반으로 하며, 기능별로 분리된 하위 XML 파일을 상위 파일에서 `<include>` 지시자로 조합하는 모듈화된 구조를 채택하고 있습니다.

```
app/config/logging/
├── logback.xml                 # 일반 운영 환경 로깅 구성 (파일 로깅 중심)
├── logback-debug.xml           # 개발 및 디버깅 환경 로깅 구성 (콘솔 출력 포함)
└── included/
    ├── logback-default.xml     # 애플리케이션 메인 로그 설정 (${LOGGING_GROUP}.log)
    ├── logback-accesslog.xml   # Netty HTTP 접근 로그 설정 (${LOGGING_GROUP}-access.log)
    ├── logback-scheduler.xml   # 스케줄러 작업 전용 로그 설정 (${LOGGING_GROUP}-scheduler.log)
    └── logback-console.xml     # 터미널 콘솔 표준 출력(STDOUT) Appender
```

#### 주요 구성 파일 안내

* **`logback.xml`**:
  * 운영 환경의 기본 진입 파일입니다. 콘솔 출력을 배제하고 파일 기반 롤링 로거(`logback-default.xml`, `logback-scheduler.xml`, `logback-accesslog.xml`)만을 활성화하여 I/O 오버헤드를 극소화합니다.
* **`logback-debug.xml`**:
  * 개발 및 로컬 테스트를 위한 진입 파일입니다. 파일 로깅과 더불어 `logback-console.xml`을 포함하여 ANSI 컬러 하이라이팅이 적용된 로그를 터미널 콘솔로 동시 출력하며, 세부 패키지의 로그 레벨을 `DEBUG` 또는 `TRACE`로 상향합니다.
  * 실행 예시: `app/bin/shell.sh --debug`
* **`included/logback-default.xml`**:
  * 애플리케이션 비즈니스 로그의 핵심 파일입니다. [`LoggingGroupDiscriminator`](https://github.com/aspectran/aspectran/blob/master/logging/src/main/java/com/aspectran/logging/LoggingGroupDiscriminator.java)와 `SiftingAppender`를 결합하여, `PathBasedLoggingGroupHandler`가 판별한 로깅 그룹에 따라 `app/logs/${LOGGING_GROUP}.log`(예: `root.log`, `console.log`, `order.log` 등)로 로그를 자동 분기 저장합니다.
  * 일자별 및 크기별 롤링 정책(`SizeAndTimeBasedRollingPolicy`, 최대 10MB, 30일 보관)이 기본 적용됩니다.
* **`included/logback-accesslog.xml`**:
  * Netty HTTP 접근 로그 카테고리(`com.aspectran.netty.accesslog`)를 전담 수집합니다. 메인 로그와 동일하게 로깅 그룹별로 `app/logs/${LOGGING_GROUP}-access.log` 파일에 분리 기록됩니다.
* **`included/logback-scheduler.xml`**:
  * Aspectran Scheduler(`com.aspectran.core.scheduler.activity`)의 Job 실행 이력을 전담 수집하여 `app/logs/${LOGGING_GROUP}-scheduler.log`에 별도 기록하므로, 주기적인 배치 작업 로그가 비즈니스 트랜잭션 로그와 뒤섞이지 않습니다.
* **`included/logback-console.xml`**:
  * 터미널 개발 환경에서 가독성을 높여주는 표준 콘솔(`ConsoleAppender`) 출력 설정입니다.

### 6.2. 클러스터 노드 제어 및 통합 관제 연동 (`/config/console/`)

Aspectow Edge는 Undertow(Enterprise)와 동일한 설정 구조로 **`/app/config/console/`** 디렉토리에서 노드 및 모니터링 파라미터를 관리합니다.

#### 6.2.1. 노드 식별 및 통신 구성 (`node-config.apon`)

Edge 인스턴스는 기함 서버인 Aspectow Enterprise의 관제 콘솔과 통신하며 자신의 생존 상태와 실시간 성능 지표를 보고합니다:

```apon
node: {
    id: edge-node-01
    group: microservices
    heartbeatIntervalSeconds: 5
    cluster: {
        consoleUrl: "https://console.aspectran.com"
        authToken: "enc:PBEWithMD5AndDES:..."
    }
}
```

* **`node-rules.xml`**: `NodeConfigResolver`, `NodeManagerFactoryBean` 등 클러스터 제어 평면 컴포넌트를 등록합니다.
* **`appmon-config.apon`**: JVM 힙(Heap) 메모리, Netty 스레드 풀 리소스 메트릭, 요청/세션 이벤트 및 로그 수집 설정을 정의합니다.

#### 6.2.2. Aspectow Console에서의 원격 통제

중앙의 [Aspectow Console](/ko/docs/aspectow/console/)을 통해 모든 Edge 노드를 한 화면에서 통제할 수 있습니다:
* **실시간 헬스체크**: 모든 Edge 노드의 생존 상태(Live, Paused, Dead)를 확인하고 Pause, Resume, Restart 명령을 즉시 전파합니다.
* **대화형 원격 명령 센터**: Console 웹 화면에서 특정 Edge 노드로 직접 CLI 명령을 주입하고 실시간 콘솔 스트리밍 출력을 확인합니다.
* **분산 스케줄러 동적 제어**: Edge 노드 내부에서 실행되는 Translet 스케줄러 Job의 동작을 일시 중단하거나 재개할 수 있습니다.

## 7. 결론 및 에디션 비교

| 구분 | Aspectow Enterprise | Aspectow Edge |
| :--- | :--- | :--- |
| **코어 엔진** | JBoss Undertow + Apache Jasper | Netty 4.x (Native Epoll/KQueue) |
| **스레드 모델** | XNIO Worker Thread Pool | Netty EventLoop + Java 21 Virtual Threads |
| **서블릿 사양** | Jakarta Servlet / JSP 표준 지원 | 서블릿 배제 (Non-Servlet Translet 직결) |
| **관제 컨텍스트** | Full Console 컨텍스트 (웹 UI 및 관제 기능 내장) | Console 컨텍스트 (콘솔 노드 분리 시 Headless 모드, 단일 노드 시 Full UI 모드 자유 선택) |
| **아키텍처 모델** | 멀티 컨텍스트 (`tow-context-*.xml`) | 멀티 컨텍스트 (`netty-context-*.xml`) |
| **적합한 분야** | 금융/공공 포털, 대규모 엔터프라이즈 웹 시스템 | 고성능 REST API, 클라우드 마이크로서비스, 엣지 게이트웨이 |
