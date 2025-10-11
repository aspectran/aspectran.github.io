---
format: plate solid article
title: Aspectow 구성 가이드
teaser: Aspectow 애플리케이션이 어떤 구조를 가지며, 어떻게 빌드되고, 실제 운영을 위해 핵심 기능들을 어떻게 설정하는지에 대해 체계적으로 안내합니다.
sidebar: toc
---

## 1. 서론

이 문서는 Aspectow를 처음 접하는 개발자 또는 표준 프로젝트 구조에 대한 깊은 이해를 원하는 분들을 위한 기술 가이드입니다. Aspectow 애플리케이션이 어떤 구조를 가지며, 어떻게 빌드되고, 실제 운영을 위해 핵심 기능들을 어떻게 설정하는지에 대해 체계적으로 안내합니다.

Aspectow는 유지보수성과 확장성을 높이고, 설정의 역할을 명확하게 분리하기 위해 잘 정의된 프로젝트 구조를 따릅니다. 이 가이드를 통해 개발자는 Aspectow의 표준 프로젝트 구조부터 빌드, 핵심 설정에 이르는 전 과정을 이해하고, 이를 바탕으로 안정적이고 효율적인 애플리케이션을 개발하고 운영하는 데 필요한 지식을 얻게 될 것입니다.

## 2. 표준 프로젝트 구조

Aspectow 애플리케이션은 개발, 빌드, 배포, 운영의 전 과정에서 편의성과 일관성을 제공하기 위해 다음과 같은 표준 디렉토리 구조를 따릅니다. 모든 디렉토리는 프로젝트 생성 시에 미리 만들어져 있으며, 빌드 과정은 주로 `app/lib`와 `app/lib/ext` 디렉토리를 채우는 역할을 합니다.

```
/
├── app/                  # 애플리케이션 홈 디렉토리
│   ├── bin/              # 실행 스크립트
│   ├── cmd/              # 파일 기반 명령 처리 디렉토리
│   ├── config/           # 애플리케이션 설정 파일
│   ├── lib/              # 외부 라이브러리 (JARs)
│   ├── logs/             # 로그 파일
│   ├── temp/             # 임시 파일 저장소
│   ├── webapps/          # 웹 애플리케이션 배포 디렉토리
│   └── work/             # 웹 애플리케이션 작업 디렉토리
├── setup/                # 시스템 서비스 배포/관리 스크립트
├── src/                  # Java 소스 및 리소스 파일
└── pom.xml               # Maven 빌드 스크립트
```

### 디렉토리 및 파일 상세 설명

- **`/app`**: 빌드된 애플리케이션의 홈 디렉토리입니다. 실제 운영 시 이 디렉토리를 기준으로 애플리케이션이 실행됩니다.
    - **`bin/`**: `daemon.sh`, `shell.sh` 등 애플리케이션을 실행하고 제어하는 셸 스크립트가 위치합니다.
    - **`cmd/`**: 파일 기반의 비동기 명령을 처리하기 위한 디렉토리 구조입니다. (`incoming`, `queued`, `completed`, `failed` 등으로 구성)
    - **`config/`**: `aspectran-config.apon`, `root-context.xml`, `server.xml` 등 애플리케이션과 서버의 모든 설정을 관리합니다.
    - **`lib/`**: `maven-dependency-plugin`에 의해 복사된 모든 외부 의존성 라이브러리(.jar)가 위치합니다. `lib/ext/`에는 현재 프로젝트의 애플리케이션 .jar 파일이 위치합니다.
    - **`logs/`**: 애플리케이션 실행 중에 발생하는 모든 로그 파일이 저장됩니다.
    - **`temp/`**: 파일 업로드나 리소스 리로딩 등 애플리케이션이 동작하면서 사용하는 임시 파일들이 저장됩니다.
    - **`webapps/`**: 웹 애플리케이션 컨텍스트의 루트 디렉토리입니다. `root`와 `appmon`이 기본으로 제공되며, 각 하위 디렉토리가 독립적인 웹 애플리케이션이 됩니다.
    - **`work/`**: 세션 파일, 컴파일된 JSP 파일 등 WAS가 내부적으로 사용하는 작업 파일들이 저장됩니다.
- **`/setup`**: .deb, .rpm 패키징이나 Systemd/init.d 서비스 등록 등 운영 환경에 애플리케이션을 배포하고 시스템 서비스로 관리하기 위한 스크립트와 설정 파일들이 위치합니다.
- **`/src`**: 애플리케이션의 Java 소스 코드와 리소스 파일이 위치하는 표준 Maven 디렉토리입니다. 빌드 과정에서 컴파일되어 `app/lib/ext/`에 JAR 파일로 생성됩니다.
- **`pom.xml`**: 프로젝트의 의존성을 관리하고 빌드 생명주기를 정의하는 Maven 빌드 스크립트입니다.

## 3. Maven 빌드 구성 (`pom.xml`)

`pom.xml` 파일은 Java 소스 코드를 컴파일하고, 2번에서 설명한 표준 `app` 디렉토리 구조에 맞게 실행 가능한 결과물을 패키징하는 모든 과정을 정의합니다.

### 3.1. 필수 속성

Aspectow 프로젝트를 올바르게 빌드하기 위해 `pom.xml`의 `<properties>` 섹션에 다음 속성들이 반드시 필요합니다.

```xml
<properties>
    <!-- [Critical] Must be 'true' to preserve method parameter names, which Aspectran requires for runtime argument mapping. -->
    <maven.compiler.parameters>true</maven.compiler.parameters>
    <maven.compiler.release>21</maven.compiler.release>
</properties>
```

- `maven.compiler.parameters`: Aspectran이 런타임에 메소드 인자 이름을 동적으로 인식하기 위해 `true`로 설정해야 합니다.
- `maven.compiler.release`: 프로젝트를 컴파일할 Java 버전을 지정합니다.

### 3.2. 핵심 빌드 플러그인

핵심 플러그인들은 빌드된 결과물을 `/app` 디렉토리 내의 표준 구조에 맞게 배치하여, 애플리케이션 코드와 외부 라이브러리를 명확히 분리합니다. 다음은 `aspectow-todo-webapp` 예제 프로젝트의 실제 설정입니다.

- **`maven-jar-plugin`**: 현재 프로젝트의 소스 코드를 컴파일하고 패키징하여 `app/lib/ext/` 디렉토리 안에 애플리케이션 JAR 파일을 생성합니다.
  ```xml
  <plugin>
      <artifactId>maven-jar-plugin</artifactId>
      <version>3.4.2</version>
      <configuration>
          <outputDirectory>app/lib/ext</outputDirectory>
      </configuration>
  </plugin>
  ```

- **`maven-dependency-plugin`**: `pom.xml`에 정의된 모든 의존성 라이브러리들을 `app/lib/` 디렉토리로 복사합니다. `package` 단계에서 `copy-dependencies` 골(goal)을 실행하도록 설정합니다.
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

## 4. 애플리케이션 핵심 설정

애플리케이션의 핵심 동작과 비즈니스 로직은 `/config` 디렉토리의 설정 파일들을 통해 제어됩니다. `aspectran-config.apon` 파일이 설정의 시작점 역할을 하며, 이 파일 안에서 컨텍스트(Context)와 웹(Web) 관련 설정을 모두 정의합니다.

- **`aspectran-config.apon`**: 프레임워크의 기본 동작 파라미터와, Bean과 Translet 등이 정의된 `root-context.xml` 같은 컨텍스트 규칙 파일의 위치를 지정합니다.
- **`root-context.xml`**: 데이터베이스 연결, 서비스 Bean, 공통 Aspect 등 애플리케이션의 실질적인 로직을 구성하는 모든 요소를 정의합니다.

애플리케이션 컨텍스트 설정에 대한 모든 상세한 내용과 각 항목에 대한 설명은 다음의 메인 설정 가이드 문서를 참고하십시오.

**참고 문서:** `aspectran-configuration_ko.md`

## 5. 내장 WAS 서버 설정

내장된 웹 서버(Undertow/Jetty) 자체의 동작은 `/config/server/` 디렉토리의 XML 파일들을 통해 제어됩니다. 이 설정들은 서버의 성능, 보안, 기능 확장에 직접적인 영향을 미칩니다.

### 5.1. 모듈화된 서버 설정 (`server.xml`)

`server.xml`은 서버 설정을 위한 메인 파일로, 실제 상세 설정은 기능별로 분리된 다른 `tow-*.xml` 파일에 위임하고 `<append>` 태그를 사용해 이를 포함하는 역할을 합니다. 이러한 모듈화된 구조는 설정의 가독성과 유지보수성을 높여줍니다.

```xml
<aspectran>
    <append file="/config/server/undertow/tow-server.xml"/>
    <append file="/config/server/undertow/tow-context-root.xml"/>
    <append file="/config/server/undertow/tow-context-appmon.xml"/>
    <append file="/config/server/undertow/tow-support.xml"/>
</aspectran>
```

### 5.2. 핵심 엔진 설정 (`tow-server.xml`)

`tow-server.xml`은 WAS의 가장 근본적인 동작(스레드, 요청 처리 핸들러 등)을 정의합니다.

```xml
<bean id="tow.server" class="com.aspectran.undertow.server.DefaultTowServer">
    <property name="workerOptions">
        <bean class="com.aspectran.undertow.server.TowOptions">
            <property name="workerIoThreads">%{tow.server.workerIoThreads}</property>
            <property name="workerTaskMaxThreads">%{tow.server.workerTaskMaxThreads}</property>
        </bean>
    </property>
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
```

- **`tow.server`**: `DefaultTowServer` 클래스의 인스턴스로, Undertow 서버 자체를 나타내는 핵심 Bean입니다.
    - `workerOptions`: I/O 및 작업 스레드 개수를 설정합니다. 프로파일에 따라 최적화된 값을 지정할 수 있습니다.
    - `requestHandlerFactory`: 요청을 처리할 핸들러를 생성하는 팩토리입니다. `handlerChainWrappers` 속성을 통해 Gzip 압축, 접근 로그 등의 핸들러를 체인으로 엮어 미들웨어처럼 동작하게 합니다.
- **`tow.server.handler.*`**: `encodingHandlerWrapper`, `accessLogHandlerWrapper` 등 요청 처리 체인에 포함될 각 핸들러를 Bean으로 정의합니다.

### 5.3. 지원 기능 설정 (`tow-support.xml`)

서버의 주 기능 외에 추가적인 지원 기능을 설정합니다. 예를 들어, `SessionListenerRegistrationBean`을 통해 특정 웹 컨텍스트(`root`)에 세션 생명주기 이벤트를 감지하는 리스너를 등록할 수 있습니다.

```xml
<bean id="sessionListenerRegistration"
      class="com.aspectran.undertow.support.SessionListenerRegistrationBean" lazyInit="true">
    <argument>tow.server</argument>
    <argument>root</argument>
</bean>
```

### 5.4. 웹 컨텍스트 배포 (`tow-context-*.xml`)

`tow-context-*.xml` 파일들은 개별 웹 애플리케이션을 서버에 배포하는 역할을 합니다.

#### `tow-context-root.xml` 상세 예제

기본 웹 애플리케이션을 서버의 루트 경로(`/`)에 배포하며, 서블릿, JSP, 웹소켓, 세션 관리 등 웹 컨텍스트의 모든 동작을 상세하게 정의합니다.

```xml
<bean id="tow.context.root.servletContext"
      class="com.aspectran.undertow.server.servlet.TowServletContext"
      scope="prototype">
    <property name="contextPath">/</property>
    <property name="servlets" type="array">
        <bean class="com.aspectran.undertow.server.servlet.DefaultJspServlet"/>
        <bean class="com.aspectran.undertow.server.servlet.TowServlet">
            <argument>webActivityServlet</argument>
            <argument>com.aspectran.web.servlet.WebActivityServlet</argument>
            <property name="mappings" type="array">
                <value>/</value>
            </property>
        </bean>
    </property>
    <property name="servletContainerInitializers" type="array">
        <bean class="com.aspectran.undertow.server.servlet.TowJasperInitializer">
            <property name="tldResources" type="array">
                <value>classpath:com/aspectran/web/support/tags/aspectran.tld</value>
            </property>
        </bean>
    </property>
</bean>

<bean id="tow.context.root.sessionManager"
      class="com.aspectran.undertow.server.session.TowSessionManager"
      scope="prototype">
    <properties profile="!prod">
        <item name="sessionStore">
            <bean class="com.aspectran.core.component.session.FileSessionStoreFactoryBean">
                <property name="storeDir">/work/_sessions/root</property>
            </bean>
        </item>
    </properties>
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
```

- **`tow.context.root.servletContext`**: `root` 웹 애플리케이션의 서블릿 컨텍스트를 정의하는 핵심 Bean입니다.
    - `servletSessionConfig`: `io.undertow.servlet.api.ServletSessionConfig` Bean을 통해 세션 쿠키의 동작 방식을 상세하게 설정합니다.
      ```xml
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
      ```
      - `sessionTrackingModes`: 세션을 추적하는 방법을 지정합니다. 예제에서는 `COOKIE`를 사용하여, URL에 `jsessionid`가 붙는 것을 방지하고 쿠키를 통해서만 세션을 추적하도록 설정합니다.
      - `path`: 세션 쿠키가 유효한 경로를 지정합니다. `/`로 설정하면 사이트 전체에서 쿠키가 유효합니다.
      - `domain`: 운영 환경(`prod`) 프로파일에서만 활성화되며, 세션 쿠키가 유효한 도메인을 지정합니다. 이를 통해 서브도메인 간에 세션을 공유할 수 있습니다.
    - `servlets`: JSP 처리를 위한 `DefaultJspServlet`과 Aspectran의 메인 `WebActivityServlet`을 등록합니다.
    - `servletContainerInitializers`: JSP 엔진(Jasper)을 초기화하고 커스텀 태그 라이브러리(.tld)를 등록합니다.
- **`tow.context.root.sessionManager`**: `TowSessionManager` 클래스의 인스턴스로, `root` 컨텍스트의 세션 관리자를 정의합니다. 이 Bean은 다음과 같은 주요 속성을 가집니다.
    - `sessionManagerConfig`: `SessionManagerConfig` Bean을 통해 세션 관리자의 상세 동작을 설정합니다. APON 형식의 인자를 사용하여 간결하게 설정할 수 있습니다.
      ```xml
      <bean class="com.aspectran.core.context.config.SessionManagerConfig">
          <argument>
              workerName: rn0
              maxActiveSessions: 9999
              maxIdleSeconds: 1800
              evictionIdleSeconds: 900
              maxIdleSecondsForNew: 60
              evictionIdleSecondsForNew: 30
              scavengingIntervalSeconds: 90
              clusterEnabled: true
          </argument>
      </bean>
      ```
      - `workerName` (문자열): 클러스터 환경에서 각 서버 인스턴스를 식별하기 위한 고유한 워커 이름입니다. 세션 ID에 포함됩니다.
      - `maxActiveSessions` (정수): 동시에 메모리에 유지할 수 있는 최대 세션 수를 제한합니다.
      - `maxIdleSeconds` (정수): 일반 세션의 최대 유효 시간(초)입니다. 이 시간 동안 요청이 없으면 세션은 '만료'되어 더 이상 사용할 수 없게 됩니다.
      - `maxIdleSecondsForNew` (정수): 세션 생성 후 첫 번째 요청에만 적용되는 특별 유휴 시간(초)입니다. 두 번째 요청이 시작되면 세션은 일반 세션으로 승격되어 `maxIdleSeconds`를 따르게 됩니다. 봇, 크롤러 등의 단일 요청 세션을 빠르게 만료시키는 데 사용됩니다.
      - `scavengingIntervalSeconds` (정수): `maxIdleSeconds`에 의해 '만료'된 세션들을 찾아서 **영구적으로 삭제**하는 정리 작업(Scavenging)의 실행 주기(초)입니다.
      - `evictionIdleSeconds` (정수): 메모리 관리를 위해, 비활성 세션을 **메모리 캐시에서 제거(Evict)하기까지 대기하는 유휴 시간(초)**입니다. 세션이 영구 삭제되는 것이 아니며, 필요시 영구 저장소에서 다시 읽어올 수 있습니다.
      - `evictionIdleSecondsForNew` (정수): `evictionIdleSeconds`와 동일한 캐시 제거 정책이지만, '신규' 세션(첫 번째 요청 중인 세션)에만 적용됩니다.
      - `saveOnCreate` (불리언): `false`인 경우, 세션을 사용한 마지막 요청이 완료될 때 영구 저장소에 저장됩니다. 이는 불필요한 I/O를 줄여 성능을 최적화합니다. `clusterEnabled`가 `true`이면 이 값과 무관하게 항상 생성 시점에 저장됩니다.
      - `saveOnInactiveEviction` (불리언): `true`인 경우, 비활성 세션이 메모리에서 제거(evict)될 때 영구 저장소에 저장하여 데이터 유실을 방지합니다. `clusterEnabled`가 `true`이면 이 값과 무관하게 항상 제거 시점에 저장됩니다.
      - `removeUnloadableSessions` (불리언): 영구 저장소에서 세션 데이터를 읽어올 수 없을 경우(예: 역직렬화 실패), 해당 세션을 저장소에서 삭제할지 여부를 결정합니다.
      - `clusterEnabled` (불리언): `true`로 설정하면 데이터 일관성을 위해 생성, 요청 완료, 메모리 제거 등 여러 시점에 걸쳐 세션 데이터가 중앙 저장소에 적극적으로 저장됩니다.
    - `sessionStore`: 실제 세션 데이터가 저장될 저장소를 지정합니다. 프로파일에 따라 개발 환경에서는 파일 기반 세션(`FileSessionStoreFactoryBean`)을, 운영 환경에서는 Redis 기반 세션(`DefaultLettuceSessionStoreFactoryBean`)을 사용하도록 설정하여 고가용성 클러스터링 환경을 지원합니다.

#### `tow-context-appmon.xml`

내장 모니터링 도구 AppMon을 `/appmon` 경로에 별도의 웹 애플리케이션으로 배포합니다. `tow-context-root.xml`과 유사한 구조를 가집니다.

### 5.5. 주요 설정 예시: 서버 포트 변경

가장 흔한 서버 설정 변경 사례는 HTTP 리스너의 포트를 변경하는 것입니다. 이 설정은 `/config/server/undertow/tow-server.xml` 파일에서 변경할 수 있습니다.

파일 상단의 `<environment>` 섹션에 정의된 `tow.server.listener.http.port` 프로퍼티의 `value`를 원하는 포트 번호로 수정하면 됩니다.

```xml
<environment>
    <property name="tow.server.listener.http.port" valueType="int">8081</property>
    <property name="tow.server.listener.http.host">0.0.0.0</property>
    ...
</environment>
```

위 예시에서 `8081`을 다른 번호로 변경한 후 Aspectow를 재시작하면, 변경된 포트로 서버가 구동됩니다.

## 6. 부가 기능 설정

애플리케이션의 주요 부가 기능들은 `/config` 디렉토리 내의 각 기능별 하위 디렉토리에서 설정합니다.

### 6.1. 로깅 설정 (`/config/logging/`)

애플리케이션의 로깅 정책은 `/config/logging/` 디렉토리의 `logback` 관련 XML 파일들을 통해 설정됩니다. Aspectow는 모듈화된 접근 방식을 사용하여, `logback.xml` 또는 `logback-debug.xml`이 `included/` 디렉토리의 기능별 설정 파일을 포함하는 구조를 가집니다.

- **`logback.xml`**: 일반적인 운영 환경을 위한 메인 설정 파일입니다. `logback-default.xml`, `logback-scheduler.xml`, `logback-undertow.xml`을 포함하여 파일 기반 로깅을 설정합니다.
- **`logback-debug.xml`**: 개발 및 디버깅 환경을 위한 설정 파일입니다. `logback.xml`이 포함하는 모든 파일에 더해 `logback-console.xml`을 추가로 포함하여, 로그를 콘솔에도 출력합니다.

#### 로깅 설정 파일 전환 방법

운영 환경에서는 기본적으로 `logback.xml`이 사용됩니다. 개발 과정에서 콘솔 출력을 포함한 상세 로그를 확인하고 싶다면, 실행 스크립트에 디버그 인자를 추가하여 `logback-debug.xml`을 사용하도록 전환할 수 있습니다.

`app/bin` 디렉토리의 `shell.sh`와 `shell.bat` 스크립트는 각각 `--debug`와 `debug` 인자가 있는지 확인하고, 인자가 주어지면 `logback.configurationFile` 자바 시스템 프로퍼티를 `logback-debug.xml` 파일 경로로 설정하여 로깅 설정을 교체합니다.

**디버그 모드로 실행 예시**

Linux/macOS:
```bash
app/bin/shell.sh --debug
```

Windows:
```cmd
app\bin\shell.bat debug
```

### 6.2. AppMon 설정 (`/config/appmon/`)

내장 모니터링 도구인 AppMon은 기본 설정이 라이브러리에 내장되어 있으며, 사용자는 다음의 파일들을 프로젝트에 배치하거나 수정하여 이 기본 설정을 **재정의(Override)**하는 방식으로 동작을 커스터마이징합니다.

- **`/config/appmon/appmon-config.apon`**: 모니터링할 대상(인스턴스, 이벤트, 메트릭, 로그)을 정의하는 핵심 설정 파일.
- **`/config/appmon/appmon.db-*.properties`**: 모니터링 데이터를 저장할 데이터베이스의 접속 정보를 설정하는 파일.
- **`/config/appmon/appmon-assets.xml`**: AppMon UI의 정적 애셋(CSS, JS) 로딩 방식을 설정하는 파일.
- **`/config/server/undertow/tow-context-appmon.xml`**: AppMon을 웹 애플리케이션으로 배포하는 방식을 커스터마이징하는 파일.
- **`/webapps/appmon/WEB-INF/jsp/`**: AppMon UI를 구성하는 JSP 파일들이 위치합니다. `templates/default.jsp`는 전체 레이아웃을 담당하는 템플릿이며, `appmon/` 디렉토리의 JSP 파일들을 수정하여 UI를 커스터마이징할 수 있습니다.

AppMon 설정의 전체 아키텍처, 각 설정 항목에 대한 상세한 설명 및 예제는 다음의 AppMon 소개 문서를 참고하십시오.

**참고 문서:** [Aspectow AppMon](/ko/aspectow/appmon/)

## 7. 주요 기능 활용: AppMon 대시보드 접근 제어

AppMon은 `root` 컨텍스트와 분리된 별도의 `appmon` 웹 컨텍스트에서 동작합니다. 따라서 `root` 컨텍스트의 메뉴 등을 통해 AppMon 대시보드 화면을 열 때, 두 컨텍스트 간의 안전한 접근 제어 메커니즘이 필요합니다. Aspectow는 이를 **시간제한이 있는 PBE 토큰(Time-Limited, Password-Based Encryption Token)**을 통해 해결합니다.

#### 1단계: '게이트키퍼' 역할의 Translet 생성 (`root` 컨텍스트)

먼저, `root` 컨텍스트에 AppMon 대시보드로 진입하기 위한 '게이트키퍼' 역할의 Translet을 정의합니다.

**`aspectow/demo/home/monitoring.xml` 예시**
```xml
<translet name="/monitoring/${instances}">
    <attribute name="token">#{class:com.aspectran.utils.security.TimeLimitedPBTokenIssuer^token}</attribute>
    <redirect path="/appmon/front/@{token}/${instances}"/>
</translet>
```
1.  사용자는 AppMon을 열기 위해 `/monitoring` 경로로 접근합니다. 만약 특정 인스턴스(예: `appmon`)의 대시보드를 바로 보고 싶다면, `/monitoring/appmon`과 같이 경로 뒤에 인스턴스 이름을 붙여 요청합니다.
2.  Translet은 `TimeLimitedPBTokenIssuer`를 통해 짧은 시간 동안만 유효한 **보안 토큰**을 생성합니다.
3.  생성된 토큰과 전달받은 `instances` 값을 경로에 포함하여, AppMon 컨텍스트의 `/appmon/front/...` 경로로 사용자의 브라우저를 **리다이렉트**시킵니다.

#### 2단계: 토큰 검증 및 페이지 처리 (`appmon` 컨텍스트)

`appmon` 컨텍스트는 리다이렉트된 요청을 받아 토큰의 유효성을 검증합니다. 이 로직은 `FrontActivity.java`에 구현되어 있습니다.

**`FrontActivity.java`의 일부**
```java
@Request("/front/${token}/${instances}")
public Map<String, String> front(Translet translet, String token, String instances) {
   try {
       // 1. 전달받은 토큰을 검증합니다.
       AppMonManager.validateToken(token);
       // 2. 검증 성공 시, AppMon 대시보드 페이지를 렌더링합니다.
       return Map.of("include", "appmon/appmon", ...);
   } catch (Exception e) {
       // 3. 검증 실패 시, 에러를 기록하고 홈으로 리다이렉트합니다.
       logger.error("Invalid token: {}", token);
       translet.redirect("/");
       return null;
   }
}
```
이러한 방식은 `root` 컨텍스트를 신뢰할 수 있는 인증 기관으로 사용하여, 유효한 토큰을 발급받은 사용자만이 `appmon` 컨텍스트에 접근할 수 있도록 하는 안전한 접근 제어 메커니즘입니다.
