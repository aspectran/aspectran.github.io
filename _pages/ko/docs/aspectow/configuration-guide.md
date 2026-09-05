---
title: Aspectow Enterprise 구성 가이드
teaser: JBoss Undertow와 서블릿/JSP 엔진을 탑재한 Aspectow Enterprise 에디션의 프로젝트 구조, 빌드, 그리고 내장 WAS 서버의 모든 고급 설정 요소를 체계적으로 안내합니다.
subheadline: Aspectow Enterprise
---

## 1. 서론

이 문서는 Aspectow Enterprise 에디션을 사용하는 개발자 및 시스템 엔지니어를 위한 종합 기술 가이드입니다. Aspectow Enterprise는 JBoss의 고성능 논블로킹 I/O 웹 서버인 [Undertow](https://undertow.io)와 Apache Tomcat의 검증된 JSP 엔진인 [Apache Jasper](https://mvnrepository.com/artifact/org.mortbay.jasper/apache-jsp)를 기반으로 구축된 기함(Flagship) 애플리케이션 서버입니다. 서블릿(Jakarta Servlet) 사양을 충실히 준수하며, 기업용 대규모 웹 애플리케이션과 통합 관제 웹 콘솔([Aspectow Console](/ko/docs/aspectow/console/))을 안정적으로 구동할 수 있습니다.

이 가이드에서는 표준 프로젝트 구조와 Maven 빌드 구성부터 시작하여, 내장 Undertow 서버의 네트워크 리스너, I/O 및 워커 스레드 옵션, 미들웨어 핸들러 체인(인코딩, 로깅 그룹, Access 로그), 서블릿 컨텍스트 배포, 정적 리소스 핸들러, JSP 및 커스텀 태그 라이브러리(TLD), 웹소켓(WebSocket), 그리고 분산 세션 클러스터링에 이르는 모든 구성 요소를 상세하게 다룹니다.

## 2. 표준 프로젝트 구조

Aspectow Enterprise 애플리케이션은 개발, 빌드, 배포, 운영의 전 과정에서 일관성과 유지보수성을 극대화하기 위해 잘 정의된 표준 디렉토리 구조를 따릅니다. 빌드 결과물은 운영 환경의 기준 경로인 `/app` 디렉토리 하위에 명확히 격리되어 배치됩니다.

```
/
├── app/                  # 애플리케이션 홈 디렉토리 (운영 런타임 기준 경로)
│   ├── bin/              # 실행 및 제어 스크립트 (daemon.sh, shell.sh)
│   ├── cmd/              # 파일 기반 비동기 명령 큐 디렉토리
│   ├── config/           # 애플리케이션 및 서버 설정 파일 디렉토리
│   │   ├── aspectran-config.apon  # Aspectran 기본 런타임 설정
│   │   ├── aspectran-rules.xml    # 비즈니스 컴포넌트 및 Translet 규칙
│   │   ├── console/               # Aspectow Console 전용 설정
│   │   ├── logging/               # Logback 로깅 구성
│   │   └── server/                # 내장 Undertow WAS 서버 설정
│   │       ├── server.xml         # 서버 루트 진입점 설정
│   │       └── undertow/          # Undertow 엔진 및 컨텍스트 모듈 파일
│   ├── lib/              # Maven 의존성 외부 라이브러리 JARs
│   │   └── ext/          # 현재 애플리케이션의 패키징된 JAR
│   ├── logs/             # 애플리케이션 및 WAS 로그 파일 저장소
│   ├── temp/             # 파일 업로드 및 임시 작업 파일 저장소
│   ├── webapps/          # 웹 애플리케이션 컨텍스트 배포 디렉토리
│   │   ├── root/         # 기본 웹 애플리케이션 (루트 컨텍스트)
│   │   └── console/      # 통합 관제 웹 콘솔 (또는 appmon)
│   └── work/             # 서블릿 컴파일 결과물, 파일 세션 저장소 등
├── setup/                # Systemd 서비스 등록 및 OS 패키징 스크립트
├── src/                  # Java 소스 코드 및 개발 리소스 (Maven 표준)
└── pom.xml               # Maven 빌드 명세 파일
```

### 디렉토리 및 파일 상세 설명

- **`/app`**: 빌드된 애플리케이션의 홈 디렉토리입니다. 실제 운영 시 이 디렉토리를 기준으로 프로세스가 기동됩니다.
    - **`bin/`**: `daemon.sh`(백그라운드 데몬 구동), `shell.sh`(대화형 CLI 셸 환경) 등 서버 라이프사이클을 제어하는 셸 스크립트가 위치합니다.
    - **`cmd/`**: 파일 기반 비동기 명령 제어(File Commander)를 위한 디렉토리 구조입니다. (`incoming`, `queued`, `completed`, `failed` 등으로 구성)
    - **`app/config/`**: 프레임워크 설정(`aspectran-config.apon`), 비즈니스 규칙(`aspectran-rules.xml`), 서버 설정(`server.xml`) 등 모든 설정 파일이 집중 관리됩니다.
    - **`lib/`**: `maven-dependency-plugin`에 의해 복사된 모든 외부 의존성 라이브러리(.jar)가 위치합니다. `lib/ext/`에는 현재 프로젝트 소스 코드가 컴파일된 애플리케이션 .jar 파일이 위치합니다.
    - **`app/logs/`**: 시스템 로그, 스케줄러 로그, Undertow 접근 로그(Access Log) 등 실행 중 발생하는 모든 로그가 저장됩니다.
    - **`app/temp/`**: 대용량 파일 업로드 처리, 템플릿 컴파일 임시 파일 등이 저장됩니다.
    - **`webapps/`**: 웹 애플리케이션 컨텍스트의 루트 디렉토리입니다. `root`와 `console`(또는 `appmon`)이 위치하며, 각 하위 디렉토리는 독립된 클래스로더와 서블릿 환경을 가지는 웹 애플리케이션이 됩니다.
    - **`app/work/`**: Jasper에 의해 컴파일된 JSP 클래스 파일, 파일 기반 세션 데이터 등이 안전하게 보관되는 WAS 작업 영역입니다.
- **`/setup`**: Linux Systemd 서비스 유닛 등록 스크립트 및 환경별 배포 자동화 파일이 포함됩니다.
- **`/src`**: 애플리케이션의 Java 소스 코드와 리소스가 위치하는 표준 Maven 디렉토리입니다. 빌드 시 컴파일되어 `app/lib/ext/`에 JAR로 저장됩니다.
- **`pom.xml`**: 프로젝트 의존성 관리 및 빌드 수명주기를 정의하는 Maven 빌드 스크립트입니다.

## 3. Maven 빌드 구성 (`pom.xml`)

`pom.xml` 파일은 소스 코드를 컴파일하고, 위에서 설명한 표준 `/app` 디렉토리 구조에 맞게 외부 라이브러리와 애플리케이션 바이너리를 정확하게 분리하여 패키징합니다.

### 3.1. 필수 컴파일러 속성

Aspectran이 런타임에 메서드의 매개변수 이름을 동적으로 인식하여 HTTP 요청 파라미터나 Bean 프로퍼티에 자동 바인딩하려면 `-parameters` 플래그가 반드시 필요합니다.

```xml
<properties>
    <!-- Java 21 LTS 릴리스 지정 -->
    <maven.compiler.release>21</maven.compiler.release>
    <!-- 리플렉션 시 매개변수 이름을 보존 (Aspectran 동적 바인딩 필수) -->
    <maven.compiler.parameters>true</maven.compiler.parameters>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
</properties>
```

### 3.2. 핵심 빌드 플러그인

- **`maven-jar-plugin`**: 현재 프로젝트 소스 코드를 컴파일하여 `app/lib/ext/` 디렉토리에 전용 애플리케이션 JAR로 생성합니다.
  ```xml
  <plugin>
      <artifactId>maven-jar-plugin</artifactId>
      <version>3.5.1</version>
      <configuration>
          <outputDirectory>app/lib/ext</outputDirectory>
      </configuration>
  </plugin>
  ```

- **`maven-dependency-plugin`**: 선언된 모든 외부 의존성 라이브러리를 `app/lib/` 디렉토리로 일괄 복사하여 독립적인 런타임 배포 환경을 구성합니다.
  ```xml
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
  ```

## 4. 애플리케이션 핵심 설정 (`aspectran-config.apon`)

Aspectow Enterprise 애플리케이션의 런타임 환경, 보안 암호화, 실행 컨텍스트, 스케줄러, 대화형 CLI 셸, 그리고 파일 기반 비동기 명령 큐(File Commander)는 `/app/config/aspectran-config.apon` 파일을 통해 통합 관리됩니다.

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

        # JBoss 스레드 풀(Enhanced Queue Executor) 통계 수집 활성화 (성능 모니터링용)
        jboss.threads.eqe.statistics: true
        jboss.threads.eqe.statistics.active-count: true

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
        com.aspectran.aspectow.enterprise.demo
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
        com.aspectran.undertow.shell.command.UndertowCommand
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
        com.aspectran.undertow.daemon.command.UndertowCommand
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
    defaultServletName: none
    trailingSlashRedirect: true
    legacyHeadHandling: true
    acceptable: {
        +: /**
    }
}
```

### 4.2. 핵심 설정 블록별 상세 설명

* **`system.properties`**:
  * `aspectran.encryption.*`: DB 접속 암호나 보안 토큰을 암호화(`enc:...`)하여 형상 관리 저장소에 평문 노출 없이 안전하게 보관할 수 있도록 PBE 마스터 암호키와 알고리즘을 지정합니다. (운영 환경 권장: `PBEWITHHMACSHA256ANDAES_128`)
  * `jboss.threads.eqe.statistics`: Undertow의 고성능 스레드 풀인 JBoss Enhanced Queue Executor의 실시간 활성 스레드 수 및 큐 메트릭 수집을 활성화하여 Aspectow Console 관제 대시보드에 정확한 WAS 부하 지표를 제공합니다.
  * `aspectran.profiles.base.console`: Console 컨텍스트의 동작 모드를 제어합니다. `console.ui`를 포함하면 브라우저 접근용 Full Console Web UI가 활성화되며, 별도 콘솔 노드를 분리한 클러스터 환경에서는 `console.ui`를 생략하여 Headless 노드로 즉시 전환할 수 있습니다.
* **`context`**:
  * `rules`: 마스터 서버 설정(`server.xml`)과 비즈니스 Translet 규칙(`aspectran-rules.xml`), 애플리케이션 명세(`app-description.xml`)를 체계적으로 로드합니다.
  * `resources`: `/lib/ext` 디렉터리의 애플리케이션 JAR을 동적 클래스패스 리소스로 바인딩합니다.
  * `scan`: 지정된 패키지 경로(`com.aspectran.aspectow.enterprise.demo` 등)에서 Aspectran 컴포넌트를 자동 탐색합니다.
* **`scheduler`**: 서버 시작 후 지연 기동 시간(`startDelaySeconds`) 및 정상 종료 대기(`waitOnShutdown`) 정책을 설정합니다.
* **`shell`**: 대화형 CLI 도구인 `app/bin/shell.sh`를 위한 설정입니다. `UndertowCommand`를 통해 셸 터미널에서 Undertow WAS 서버의 리스너 및 배포 상태를 즉시 점검할 수 있습니다.
* **`daemon`**: 백그라운드 서비스 데몬(`app/bin/daemon.sh`)이 `app/cmd/incoming/` 디렉터리를 감시하며 파일 기반의 비동기 명령을 처리하는 File Commander 엔진 설정입니다.
* **`web`**: 수신 URI 디코딩 인코딩, 기본 서블릿 처리 방식, 트레일링 슬래시(`/`) 정규화 리다이렉트 정책을 선언합니다.

## 5. Undertow 내장 WAS 서버 설정 가이드

Aspectow Enterprise의 내장 웹 애플리케이션 서버는 `/app/config/server/` 디렉토리의 XML 파일들을 통해 구성됩니다. Undertow의 탁월한 성능과 유연성을 극대화할 수 있도록 모든 계층이 모듈화되어 있습니다.

### 5.1. 모듈화된 서버 진입점 (`server.xml`)

`server.xml`은 서버 설정의 마스터 파일로, `<append>` 지시자를 사용하여 기능별, 컨텍스트별로 분리된 하위 XML 파일들을 조합합니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>
    <description>Aspectow Enterprise Undertow Server Master Configuration</description>

    <!-- Undertow 엔진 및 핸들러 체인 설정 -->
    <append file="/config/server/undertow/tow-server.xml"/>

    <!-- 웹 애플리케이션 컨텍스트 정의 -->
    <append file="/config/server/undertow/tow-context-root.xml"/>
    <append file="/config/server/undertow/tow-context-console.xml"/>

    <!-- 런타임 지원 컴포넌트 및 리스너 등록 -->
    <append file="/config/server/undertow/tow-support.xml"/>
</aspectran>
```

### 5.2. 네트워크 리스너 및 엔진 설정 (`tow-server.xml`)

`tow-server.xml`은 Undertow 엔진의 코어 인스턴스인 `DefaultTowServer`를 정의하며, 네트워크 소켓 리스너, I/O 워커 스레드, 서버 옵션, 그리고 전역 요청 핸들러 체인을 구성합니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>

    <environment>
        <property name="tow.server.listener.http.port" valueType="int">8081</property>
        <property name="tow.server.listener.http.host">0.0.0.0</property>
        <property name="tow.server.domain"/>
    </environment>

    <environment>
        <!-- 환경별 XNIO 워커 스레드 튜닝 -->
        <properties profile="(!stage, !prod)">
            <item name="tow.server.workerIoThreads" valueType="int">4</item>
            <item name="tow.server.workerTaskMaxThreads" valueType="int">32</item>
        </properties>
        <properties profile="stage, prod">
            <item name="tow.server.workerIoThreads" valueType="int">8</item>
            <item name="tow.server.workerTaskMaxThreads" valueType="int">64</item>
        </properties>
    </environment>

    <bean id="tow.server" class="com.aspectran.undertow.server.DefaultTowServer">
        <!-- 자동 시작 및 안정적 종료(Graceful Shutdown) 설정 -->
        <property name="autoStart" valueType="boolean">true</property>
        <property name="shutdownGracefully" valueType="boolean">true</property>
        <property name="shutdownTimeoutSecs" valueType="int">10</property>
        <!-- 리버스 프록시(Nginx/ALB) 뒤에서 클라이언트 실제 IP 복원 -->
        <property name="proxyAddressForwarding" valueType="boolean">true</property>

        <!-- HTTP 네트워크 리스너 설정 -->
        <property name="httpListeners" type="array">
            <bean class="com.aspectran.undertow.server.HttpListenerConfig">
                <property name="host">%{tow.server.listener.http.host}</property>
                <property name="port" valueType="int">%{tow.server.listener.http.port}</property>
            </bean>
        </property>

        <!-- Undertow 서버 옵션 -->
        <property name="serverOptions">
            <bean class="com.aspectran.undertow.server.TowOptions">
                <property name="decodeUrl" valueType="boolean">true</property>
                <property name="urlCharset">UTF-8</property>
                <property name="maxHeaderSize" valueType="int">65536</property>
                <property name="maxEntitySize" valueType="long">52428800</property>
                <property name="multipartMaxEntitySize" valueType="long">52428800</property>
                <property name="idleTimeout" valueType="int">60000</property>
                <property name="alwaysSetKeepAlive" valueType="boolean">true</property>
            </bean>
        </property>

        <!-- XNIO 워커 스레드 풀 옵션 -->
        <property name="workerOptions">
            <bean class="com.aspectran.undertow.server.TowOptions">
                <property name="workerName">TOW</property>
                <property name="workerIoThreads">%{tow.server.workerIoThreads}</property>
                <property name="workerTaskMaxThreads">%{tow.server.workerTaskMaxThreads}</property>
            </bean>
        </property>

        <!-- 전역 서블릿 요청 핸들러 팩토리 및 미들웨어 체인 -->
        <property name="requestHandlerFactory">
            <bean class="com.aspectran.undertow.server.handler.ServletRequestHandlerFactory">
                <property name="handlerChainWrappers" type="array">
                    <value>#{tow.server.handler.encodingHandlerWrapper}</value>
                    <value>#{tow.server.handler.accessLogHandlerWrapper}</value>
                    <value>#{tow.server.handler.loggingGroupHandlerWrapper}</value>
                </property>
            </bean>
        </property>
    </bean>

</aspectran>
```

#### 네트워크 리스너 설정 요소
* **`httpListeners`**: 기본 HTTP 포트와 바인딩 호스트를 지정합니다. 복수의 리스너를 배열로 등록하여 여러 포트를 동시에 개방할 수 있습니다.
* **`httpsListeners` (`HttpsListenerConfig`)**: SSL/TLS 보안 통신을 위한 리스너입니다. `keyStorePath`, `keyStorePassword`, `keyPassword`, `trustStorePath` 등을 설정하여 HTTPS를 직접 종단(Termination)할 수 있습니다.
* **`ajpListeners` (`AjpListenerConfig`)**: Apache HTTP Server의 `mod_jk` 또는 `mod_proxy_ajp` 연동을 위한 AJP 1.3 프로토콜 리스너를 구성할 수 있습니다.
* **`proxyAddressForwarding`**: Nginx나 클라우드 L4/L7 로드밸런서 뒤에 배치될 경우 `true`로 활성화합니다. 이를 통해 클라이언트 요청 헤더인 `X-Forwarded-For`, `X-Forwarded-Proto`, `X-Forwarded-Host`, `X-Forwarded-Port`를 신뢰하여 서블릿 및 로깅 시스템에 실제 클라이언트 원격 IP와 프로토콜이 정확하게 반영됩니다.

#### XNIO 워커 스레드 모델 (`workerOptions`)
Undertow는 초경량 비동기 I/O 라이브러리인 XNIO를 사용합니다.
* **`workerIoThreads`**: 네트워크 소켓 읽기/쓰기 이벤트를 담당하는 논블로킹 I/O 스레드 수입니다. 소수의 스레드로 수만 개의 동시 접속을 처리하므로, 절대 블로킹 작업을 수행하지 않습니다. (미지정 시 기본값: `Math.max(CPU 코어 수, 2)`)
* **`workerTaskMaxThreads`**: 서블릿 실행, 데이터베이스 쿼리, 파일 I/O 등 블로킹 작업을 수행하는 작업자 스레드의 최대 풀 크기입니다. 요청이 몰릴 때 큐잉 지연이 발생하지 않도록 애플리케이션 특성에 맞게 조정합니다.

#### Undertow 서버 옵션 (`serverOptions`)
* **`decodeUrl` / `urlCharset`**: URL 디코딩 여부와 문자 인코딩을 지정합니다. (기본값: `true`, `UTF-8`)
* **`maxHeaderSize`**: 허용되는 최대 HTTP 헤더 크기(바이트 단위)입니다. 대형 쿠키나 인증 토큰을 사용하는 경우 적절히 증설합니다.
* **`maxEntitySize`**: 요청 본문(Body)의 최대 허용 크기입니다.
* **`multipartMaxEntitySize`**: 멀티파트 파일 업로드 시의 전체 요청 크기 상한선입니다.
* **`idleTimeout`**: 소켓 유휴(Idle) 타임아웃(밀리초)입니다.

### 5.3. 미들웨어 핸들러 체인 구성

`handlerChainWrappers` 속성을 통해 요청이 서블릿 컨텍스트로 전달되기 전/후에 동작하는 미들웨어를 체인 형태로 결합합니다.

#### 5.3.1. 압축 인코딩 핸들러 (`EncodingHandlerWrapper`)
Gzip 등의 압축 알고리즘을 조건부로 적용하여 네트워크 대역폭을 절감하고 클라이언트 응답 속도를 향상시킵니다.

```xml
<bean id="tow.server.handler.encodingHandlerWrapper"
      class="com.aspectran.undertow.server.handler.encoding.EncodingHandlerWrapper"
      scope="prototype">
    <property name="encodingProviders" type="array">
        <value>gzip</value>
    </property>
    <property name="encodingPredicates" type="array">
        <!-- 텍스트 기반 자산 압축 -->
        <bean class="com.aspectran.undertow.server.handler.encoding.ContentEncodingPredicates">
            <property name="mediaTypes" type="array">
                <value>text/html</value>
                <value>text/css</value>
                <value>text/javascript</value>
                <value>application/javascript</value>
            </property>
        </bean>
        <!-- 크기 임계값 조건: 32바이트를 초과하는 데이터 포맷만 압축 -->
        <bean class="com.aspectran.undertow.server.handler.encoding.ContentEncodingPredicates">
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
```

#### 5.3.2. 경로 기반 로깅 그룹 핸들러 (`PathBasedLoggingGroupHandlerWrapper`)
요청 URL 패턴에 따라 SLF4J MDC(Mapped Diagnostic Context)에 로깅 그룹(`loggingGroup`) 변수를 자동으로 바인딩합니다. Logback 설정과 결합하여 콘솔 관리자 로그, 일반 API 로그, 배치 로그를 별도의 로그 파일로 분리 저장할 수 있습니다.

```xml
<bean id="tow.server.handler.loggingGroupHandlerWrapper"
      class="com.aspectran.undertow.server.handler.logging.PathBasedLoggingGroupHandlerWrapper"
      scope="prototype">
    <property name="pathPatternsByGroupName" type="map">
        <entry name="console">
            +: /console/**
        </entry>
        <entry name="api">
            +: /api/**
        </entry>
    </property>
</bean>
```

#### 5.3.3. 접근 로그 핸들러 (`AccessLogHandlerWrapper`)
모든 수신 HTTP 요청의 처리 결과를 표준 웹 서버 포맷으로 기록합니다.

```xml
<bean id="tow.server.handler.accessLogHandlerWrapper"
      class="com.aspectran.undertow.server.handler.accesslog.AccessLogHandlerWrapper"
      scope="prototype">
    <property name="category">io.undertow.accesslog</property>
    <properties profile="prod">
        <!-- 프록시 환경: 실제 클라이언트 IP를 %{i,X-Forwarded-For} 또는 %a로 추출 -->
        <item name="formatString" tokenize="false">%t %a %{c,JSESSIONID} "%r" %s %b "%{i,Referer}" "%{i,User-Agent}"</item>
    </properties>
    <properties profile="!prod">
        <item name="formatString" tokenize="false">%t %a %{c,JSESSIONID} "%r" %s %b "%{i,Referer}" "%{i,User-Agent}"</item>
    </properties>
</bean>
```
* **포맷 스트링 토큰 설명**:
  * `%t`: 요청 처리 일시 (Apache 표준 날짜 포맷)
  * `%a`: 원격 IP 주소 (`proxyAddressForwarding` 활성화 시 실제 클라이언트 IP 자동 판별)
  * `%{i,Header-Name}`: 요청 HTTP 헤더 값 (`X-Forwarded-For`, `User-Agent`, `Referer` 등)
  * `%{c,Cookie-Name}`: 요청 쿠키 값 (`JSESSIONID`)
  * `%r`: HTTP 요청 최초 라인 (`GET /index.html HTTP/1.1`)
  * `%s`: 응답 HTTP 상태 코드 (`200`, `404`, `500` 등)
  * `%b`: 전송된 응답 바이트 수 (헤더 제외)
  * `%D`: 요청 처리 소요 시간 (밀리초)

### 5.4. 서블릿 컨텍스트 배포 및 상세 구성 (`tow-context-root.xml`)

`TowServletContext` Bean은 독립적인 웹 애플리케이션 컨텍스트를 Undertow 서버에 마운트하며, 서블릿 매핑, 정적 리소스 핸들러, JSP 엔진, 커스텀 태그 라이브러리(TLD), 웹소켓, 그리고 분산 세션 관리자를 결합합니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>

    <environment>
        <property name="tow.context.root.name">root</property>
    </environment>

    <bean id="tow.context.root.servletContext"
          class="com.aspectran.undertow.server.servlet.TowServletContext"
          scope="prototype">
        <!-- 컨텍스트 식별자 및 URL 마운트 경로 -->
        <property name="deploymentName">%{tow.context.root.name}</property>
        <property name="contextPath">/</property>

        <!-- 정적 리소스 핸들러 설정 -->
        <property name="resourceManager">
            <bean class="com.aspectran.undertow.server.handler.resource.TowResourceManager">
                <property name="base">/webapps/%{tow.context.root.name}</property>
            </bean>
        </property>

        <!-- 임시 작업 디렉터리 -->
        <property name="scratchDir">%{system:aspectran.workPath:/work}/_webapps/%{tow.context.root.name}</property>

        <!-- 세션 관리자 및 쿠키 정책 바인딩 -->
        <property name="sessionManager">#{tow.context.root.sessionManager}</property>
        <property name="servletSessionConfig">
            <bean class="io.undertow.servlet.api.ServletSessionConfig">
                <property name="sessionTrackingModes" type="set">
                    <value>#{class:jakarta.servlet.SessionTrackingMode^COOKIE}</value>
                </property>
                <property name="path" value="/"/>
                <properties profile="prod">
                    <item name="domain" value="%{tow.server.domain}"/>
                </properties>
            </bean>
        </property>

        <!-- 서블릿 등록 (JSP 서블릿 및 Aspectran WebActivityServlet) -->
        <property name="servlets" type="array">
            <bean class="com.aspectran.undertow.server.servlet.DefaultJspServlet">
                <property name="loadOnStartup" valueType="int">0</property>
            </bean>
            <bean class="com.aspectran.undertow.server.servlet.TowServlet">
                <argument>webActivityServlet</argument>
                <argument>com.aspectran.web.servlet.WebActivityServlet</argument>
                <property name="mappings" type="array">
                    <value>/</value>
                </property>
                <property name="loadOnStartup" valueType="int">1</property>
            </bean>
        </property>

        <!-- JSP 태그 라이브러리(TLD) 및 Jasper 컨테이너 초기화 -->
        <property name="servletContainerInitializers" type="array">
            <bean class="com.aspectran.undertow.server.servlet.TowJasperInitializer">
                <property name="tldResources" type="array">
                    <value>classpath:com/aspectran/web/support/tags/aspectran.tld</value>
                    <value>/webapps/%{tow.context.root.name}/WEB-INF/taglibs/</value>
                </property>
            </bean>
        </property>

        <!-- JSR-356 웹소켓 서버 컨테이너 초기화 -->
        <property name="webSocketServerContainerInitializer">
            <bean class="com.aspectran.undertow.server.servlet.TowWebSocketServerContainerInitializer">
                <property name="idleTimeout" valueType="long">60000</property>
            </bean>
        </property>
    </bean>

    <!-- 세션 관리자 설정 (File vs Redis) -->
    <bean id="tow.context.root.sessionManager"
          class="com.aspectran.undertow.server.session.TowSessionManager"
          scope="prototype">
        <property name="sessionManagerConfig">
            <bean class="com.aspectran.core.context.config.SessionManagerConfig">
                <argument>
                    workerName: rn0
                    maxActiveSessions: 9999
                    maxIdleSeconds: 1800
                    evictionIdleSeconds: 900
                    maxIdleSecondsForNew: 60
                    evictionIdleSecondsForNew: 30
                    scavengingIntervalSeconds: 90
                    clusterEnabled: false
                </argument>
            </bean>
        </property>
        <!-- 로컬 개발 환경: 파일 기반 세션 저장소 -->
        <properties profile="!prod">
            <item name="sessionStore">
                <bean class="com.aspectran.core.component.session.FileSessionStoreFactoryBean">
                    <property name="storeDir">%{system:aspectran.workPath:/work}/_sessions/%{tow.context.root.name}</property>
                    <property name="gracePeriodSecs" valueType="int">30</property>
                </bean>
            </item>
        </properties>
        <!-- 운영 환경: 고가용성 Redis 세션 클러스터링 -->
        <properties profile="prod">
            <item name="sessionStore">
                <bean class="com.aspectran.core.component.session.redis.lettuce.DefaultLettuceSessionStoreFactoryBean">
                    <property name="poolConfig">
                        <bean class="com.aspectran.core.component.session.redis.lettuce.RedisConnectionPoolConfig">
                            <property name="uri">%{system:redis.uri}/10</property>
                        </bean>
                    </property>
                </bean>
            </item>
        </properties>
    </bean>

</aspectran>
```

#### 5.4.1. 정적 리소스 관리자 (`TowResourceManager` & `TowClassPathResourceManager`)

Aspectow Enterprise는 파일시스템과 클래스패스 두 가지 방식의 고성능 정적 리소스 서빙을 완벽히 지원합니다.

##### 1) 파일시스템 기반 리소스 서빙 (`TowResourceManager`)
Undertow의 `PathResourceManager`를 상속 및 확장한 컴포넌트로, [`ApplicationAdapterAware`](file:///Users/Aspectran/Projects/workspace/aspectran/with-undertow/src/main/java/com/aspectran/undertow/server/handler/resource/TowResourceManager.java#L35)를 구현하여 애플리케이션 루트 경로에 맞춘 유연한 경로 해석을 제공합니다.

```xml
<property name="resourceManager">
    <bean class="com.aspectran.undertow.server.handler.resource.TowResourceManager">
        <!-- 기본 웹 루트 디렉터리 (상대 경로는 앱 루트 기준 자동 해석) -->
        <property name="base">/webapps/%{tow.context.root.name}</property>
        <!-- 특정 URL 경로를 외부 디렉터리로 매핑하는 리소스 매핑 (선택 사항) -->
        <property name="resourceMappings">
            <item name="/assets">/../shared-assets</item>
            <item name="/upload">/work/upload</item>
        </property>
    </bean>
</property>
```

* **`base`**: HTML, CSS, JavaScript, 이미지 등 정적 파일이 위치한 파일시스템 기준 디렉터리를 지정합니다. (예: `/webapps/root`)
* **`resourceMappings`**: 웹 루트 외부의 디렉터리를 특정 URL 경로 접두사에 연결합니다. 이를 통해 공용 에셋 디렉터리나 업로드 폴더를 손쉽게 정적 웹 경로로 노출할 수 있습니다.

##### 2) 클래스패스 기반 리소스 서빙 (`TowClassPathResourceManager`)
정적 리소스가 애플리케이션 JAR 파일 내부나 클래스패스에 패키징되어 배포되는 모듈형 아키텍처를 위해 [`TowClassPathResourceManager`](file:///Users/Aspectran/Projects/workspace/aspectran/with-undertow/src/main/java/com/aspectran/undertow/server/handler/resource/TowClassPathResourceManager.java)를 제공합니다.

```xml
<property name="resourceManager">
    <bean class="com.aspectran.undertow.server.handler.resource.TowClassPathResourceManager">
        <!-- 정적 리소스가 위치한 클래스패스 기준 접두사 -->
        <argument>static/</argument>
    </bean>
</property>
```

* **`prefix`**: 클래스패스 내에서 정적 파일을 탐색할 패키지 접두사 경로(예: `static/` 또는 `public/`)를 지정합니다.
* **Aspectran 클래스로더 연동**: [`ActivityContextAware`](file:///Users/Aspectran/Projects/workspace/aspectran/with-undertow/src/main/java/com/aspectran/undertow/server/handler/resource/TowClassPathResourceManager.java#L48)를 통해 현재 컨텍스트의 클래스로더를 사용하여 JAR 파일 내부 리소스라도 지연 없이 신속하게 추출하여 서빙합니다.

#### 5.4.2. 서블릿 및 JSP 매핑 (`DefaultJspServlet` & `TowServlet`)
* **`DefaultJspServlet`**: Apache Jasper 기반의 JSP 컴파일러 및 서블릿 핸들러를 활성화합니다. JSP 파일을 런타임에 동적으로 컴파일하여 고속 실행합니다. (PetClinic 등 순수 템플릿 엔진만 사용하는 컨텍스트에서는 생략 가능)
* **`TowServlet`**: Aspectran의 메인 서블릿인 `WebActivityServlet`을 루트 매핑(`/`)으로 등록하여, 모든 수신 요청을 Aspectran Translet 엔진으로 전달합니다.

#### 5.4.3. 커스텀 JSP 태그 라이브러리(TLD) 설정 (`TowJasperInitializer`)
JSP 뷰에서 `<aspectran:message>`, `<aspectran:token>` 등 프레임워크 제공 태그를 사용하거나 프로젝트 고유의 JSTL/커스텀 태그 라이브러리를 로드하려면 `tldResources` 속성에 경로를 등록합니다:
* `classpath:com/aspectran/web/support/tags/aspectran.tld`: Aspectran 표준 태그 라이브러리
* `/webapps/{contextName}/WEB-INF/taglibs/`: 프로젝트 고유의 `.tld` 정의 파일들이 위치한 디렉터리 경로

#### 5.4.4. 웹소켓(WebSocket) 설정 (`TowWebSocketServerContainerInitializer`)
Undertow의 고성능 웹소켓 엔진을 초기화합니다.
* JSR-356 표준 어노테이션(`@ServerEndpoint`) 기반의 웹소켓 엔드포인트를 지원합니다.
* `idleTimeout`: 클라이언트와 웹소켓 연결 후 데이터 교환이 없을 때 연결을 유지할 최대 시간(밀리초)입니다.

#### 5.4.5. 서블릿 세션 관리자 (`TowSessionManager` & `TowServletSessionConfig`)
Aspectran 고유의 엔터프라이즈 세션 관리 엔진을 Undertow 서블릿 스펙(`io.undertow.server.session.SessionManager`)과 매끄럽게 브릿징합니다.
* **[`TowSessionManager`](file:///Users/Aspectran/Projects/workspace/aspectran/with-undertow/src/main/java/com/aspectran/undertow/server/session/TowSessionManager.java)**:
  * 서블릿 컨테이너의 표준 세션 라이프사이클 이벤트를 Aspectran 코어 [`DefaultSessionManager`](file:///Users/Aspectran/Projects/workspace/aspectran/core/src/main/java/com/aspectran/core/component/session/DefaultSessionManager.java)로 위임합니다.
  * 서블릿 API(`HttpSession`)와 Aspectran 내부 세션 어댑터 간의 상호작용을 투명하게 중계합니다.
* **`TowServletSessionConfig` (서블릿 세션 쿠키 정책)**:
  * `sessionTrackingModes`: `COOKIE`로 지정하여 URL Rewriting에 세션 식별자가 노출되는 보안 취약점을 원천 방지합니다.
  * `path`: 쿠키 적용 경로 (기본값: `/`)
  * `domain`: 다중 서브도메인 간 세션 공유가 필요한 경우 최상위 도메인을 설정합니다. (예: `.aspectran.com`)
  * `httpOnly` / `secure`: XSS 스크립팅 공격 방어 및 SSL/TLS 암호화 채널 강제 적용
* **세션 저장소(`sessionStore`) 전략 (인메모리 / 파일 / Redis)**:
  * 순수 인메모리 운용: `sessionStore`를 생략하면 외부 디스크나 네트워크 I/O 없이 JVM 힙 메모리에서만 동작하는 최고 속도의 인메모리 세션으로 가동됩니다.
  * 로컬 개발 환경(`!prod`): `FileSessionStoreFactoryBean`을 통해 서버 재시작 시에도 로그인 세션 복구 지원
  * 운영 환경(`prod`): Lettuce 기반 `DefaultLettuceSessionStoreFactoryBean`을 통한 무중단 Redis 분산 세션 클러스터링

> [!TIP]
> 세션 생명주기 옵션(`SessionManagerConfig`), 봇/크롤러 유휴 세션 신속 회수 메커니즘, `@NonPersistent` 영속화 제어, 그리고 Redis 분산 클러스터링의 심층 동작 원리는 **[`Aspectran Session Manager 가이드`](file:///Users/Aspectran/Projects/workspace/aspectran.github.io/_pages/ko/docs/guides/aspectran-session-manager.md)**를 참조하십시오.

### 5.5. Console 관제 컨텍스트 (`tow-context-console.xml`)

Undertow는 완전한 서블릿 컨테이너 격리를 지원하므로, 단일 포트(예: 8081) 안에서 메인 서비스 컨텍스트(`/`)와 함께 독립된 **Console 관제 컨텍스트(`/console`)**를 서블릿 컨텍스트로 격리 배포합니다.

`/app/config/server/undertow/tow-context-console.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>
    <description>Aspectow Enterprise Console Context Configuration</description>

    <!-- Console 관제 규칙 마운트 (Full UI 또는 Headless 모드) -->
    <append resource="com/aspectran/aspectow/console/config/rules/context/tow-context-console.xml"/>
</aspectran>
```

* **완전한 서블릿 컨텍스트 격리**:
  * 메인 서비스와 Console 컨텍스트는 서로 독립된 서블릿 세션 매니저, 서블릿 필터/리스너 체인, 그리고 Aspectran DI 컨테이너(`ActivityContext`)를 가집니다.
  * Console 관리자 화면에서 발생하는 관리자 세션이나 Bean 정의가 메인 비즈니스 서비스에 전혀 간섭하지 않습니다.
* **운영 전략에 따른 유연한 모드 전환**:
  * 단일 노드 운영 시에는 Full UI가 포함된 `tow-context-console.xml`을 로드하여 통합 웹 대시보드로 즉시 접속합니다.
  * 별도의 중앙 전용 콘솔 노드를 둔 클러스터 환경에서는 `tow-context-console-headless.xml`을 로드하여, 웹 UI 뷰 렌더링 없이 백엔드 제어 평면(웹소켓 스트리밍, 원격 CLI 디스패치, 스케줄러 제어 API)만을 초경량으로 구동할 수 있습니다.

### 5.6. 부가 지원 컴포넌트 (`tow-support.xml`)

`tow-support.xml`은 서버 동작 중 발생하는 이벤트를 가로채거나 런타임 진단 정보를 제공하는 헬퍼 컴포넌트들을 등록합니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>

    <!-- 특정 컨텍스트(root)에 세션 생명주기 리스너(UserTrackingListener 등) 동적 등록 -->
    <bean id="sessionListenerRegistration"
          class="com.aspectran.undertow.support.SessionListenerRegistrationBean" lazyInit="true">
        <argument>tow.server</argument>
        <argument>root</argument>
    </bean>

    <!-- 런타임에 바인딩된 실제 HTTP 리스너 포트 번호를 관제 시스템에 제공 -->
    <bean class="com.aspectran.aspectow.console.cluster.support.TowServerPortProvider">
        <argument>tow.server</argument>
    </bean>

</aspectran>
```

## 6. 부가 기능 설정

애플리케이션의 로깅과 모니터링은 `/config` 하위의 전용 디렉토리에서 독립적으로 관리됩니다.

### 6.1. 로깅 구성 (`/config/logging/`)

Aspectow Enterprise는 Logback 프레임워크를 기반으로 하며, 기능별로 분리된 하위 XML 파일을 상위 파일에서 `<include>` 지시자로 조합하는 모듈화된 구조를 채택하고 있습니다.

```
app/config/logging/
├── logback.xml                 # 일반 운영 환경 로깅 구성 (파일 로깅 중심)
├── logback-debug.xml           # 개발 및 디버깅 환경 로깅 구성 (콘솔 출력 포함)
└── included/
    ├── logback-default.xml     # 애플리케이션 메인 로그 설정 (${LOGGING_GROUP}.log)
    ├── logback-undertow.xml    # Undertow 코어 및 Access 로그 설정 (${LOGGING_GROUP}-undertow.log)
    ├── logback-scheduler.xml   # 스케줄러 작업 전용 로그 설정 (${LOGGING_GROUP}-scheduler.log)
    └── logback-console.xml     # 터미널 콘솔 표준 출력(STDOUT) Appender
```

#### 주요 구성 파일 안내

* **`logback.xml`**:
  * 운영 환경의 기본 진입 파일입니다. 터미널 I/O 지연을 방지하기 위해 콘솔 출력을 배제하고, 파일 기반 롤링 로거(`logback-default.xml`, `logback-scheduler.xml`, `logback-undertow.xml`)만을 활성화합니다.
* **`logback-debug.xml`**:
  * 개발 및 로컬 테스트를 위한 진입 파일입니다. 파일 로깅과 함께 `logback-console.xml`을 로드하여 ANSI 컬러 하이라이팅이 적용된 실시간 로그를 터미널 콘솔로 동시 출력하며, 세부 패키지의 로그 레벨을 `DEBUG` 또는 `TRACE`로 상향합니다.
  * 실행 예시: `app/bin/shell.sh --debug`
* **`included/logback-default.xml`**:
  * 애플리케이션 비즈니스 로그를 담당합니다. [`LoggingGroupDiscriminator`](file:///Users/Aspectran/Projects/workspace/aspectran/logging/src/main/java/com/aspectran/logging/LoggingGroupDiscriminator.java)와 `SiftingAppender`를 결합하여, `PathBasedLoggingGroupHandlerWrapper`가 판별한 로깅 그룹에 따라 `app/logs/${LOGGING_GROUP}.log`(예: `root.log`, `console.log`)로 로그를 자동 분기 저장합니다.
  * 일자별 및 크기별 롤링 정책(`SizeAndTimeBasedRollingPolicy`, 최대 10MB, 30일 보관)이 기본 적용됩니다.
* **`included/logback-undertow.xml`**:
  * Undertow 서버 엔진(`io.undertow`) 및 Access 로그(`io.undertow.accesslog`)를 전담 수집하여 `app/logs/${LOGGING_GROUP}-undertow.log`에 분리 기록합니다.
* **`included/logback-scheduler.xml`**:
  * Aspectran Scheduler(`com.aspectran.core.scheduler.activity`)의 Job 실행 이력을 전담 수집하여 `app/logs/${LOGGING_GROUP}-scheduler.log`에 별도 보관하므로, 주기적인 배치 작업 로그가 웹 트랜잭션 로그와 뒤섞이지 않습니다.
* **`included/logback-console.xml`**:
  * 터미널 개발 환경에서 가독성을 높여주는 표준 콘솔(`ConsoleAppender`) 출력 설정입니다.

### 6.2. Aspectow Console 설정 (`/config/console/`)

Aspectow Enterprise 에디션에는 클러스터 노드 감시, 원격 명령 실행, 스케줄러 동적 제어를 수행하는 **통합 관제 웹 콘솔([Aspectow Console](/ko/docs/aspectow/console/))이 기본 내장**되어 있습니다.
* `/config/console/node-config.apon`: 클러스터 내 노드 식별자, 그룹, Heartbeat 주기 설정
* `/config/console/node-rules.xml`: 노드 관리자 컴포넌트(`NodeManagerFactoryBean`) 등록
* 상세한 운영 구성은 [Aspectow Console 구성 가이드](/ko/docs/aspectow/console/configuration-guide/)를 참조하십시오.
