---
title: Aspectow Console 구성 가이드
teaser: Aspectow Console 및 노드 관리자(Node Manager)의 클러스터 통신 모드, APON 설정 파일 명세, DB 및 Redis 환경 구성, AppMon 모니터링 설정 및 Aspectran 빈 설정 방법을 다루는 종합 구성 안내서입니다.
subheadline: Aspectow Console
---

## 1. 개요 및 구성 파일 체계

Aspectow Console은 Aspectran 프레임워크 기반의 선언적 APON(Aspectran Parameter Object Notation) 설정 파일과 Aspectran XML 룰(Rule) 파일을 활용하여 유연하게 환경을 구성할 수 있습니다.

Console의 환경 구성 파일은 크게 노드 및 클러스터 제어 설정(`node-config.apon`), 데이터베이스 접속 구성(`aspectow-console.db-*.properties`), Redis 클러스터링 설정(`redis.properties`), Console 내장 AppMon 모니터링 설정(`appmon-config.apon`), 그리고 Aspectran 빈 정의 파일(`node-rules.xml`, `db.xml`)로 분리됩니다.

### 주요 구성 파일 위치 (`/config/console/`)

*   **`console-rules.xml`**: 노드 관리 규칙(`node-rules.xml`) 및 AppMon 모니터링 규칙(`appmon-rules.xml`)을 통합 포함하며, Console 전용 환경 프로퍼티를 구성하는 최상위 Aspectran XML 정의 파일
*   **`node-config.apon`**: 클러스터 식별자, 통신 모드(`direct` / `gateway`), 암호화 보안 키, 핑 주기를 정의하는 노드 관리자 핵심 설정 파일
*   **`node-rules.xml`**: `NodeConfigResolver`, `NodeManagerFactoryBean`, `RemoteNodeManager`, `RemoteCommandManager`, `RemoteSchedulerManager` 등의 핵심 컴포넌트를 등록하는 Aspectran XML 정의 파일
*   **`appmon-config.apon`**: Console에 내장 탑재된 AppMon 모니터링 엔진의 데이터 수집기(`app`), 이벤트, 메트릭, 로그 및 집계 주기 설정 파일
*   **`appmon-rules.xml`**: AppMon 모니터링 수집 엔진 및 DB 영속성 스케줄러를 초기화하는 Aspectran XML 정의 파일
*   **`aspectow-console.db-*.properties`**: Console 데이터베이스(H2, MariaDB, MySQL, Oracle, Supabase 지원) 접속 정보 프로퍼티 파일
*   **`redis-*.properties`**: Gateway 클러스터 모드 구동 시 Pub/Sub 메시지 브릿지로 활용되는 Redis 연결 풀 설정 파일

## 2. 노드 및 클러스터 설정 (`node-config.apon`)

`node-config.apon`은 노드 관리자(`NodeManager`)가 클러스터를 구성하고 통신 모드를 결정하는 핵심 파일입니다.

### APON 설정 파일 구조 예시

```apon
# 클러스터 전역 설정
cluster: {
    id: console-demo-cluster1
    mode: gateway  # direct 또는 gateway 모드 선택
    secret: {
        password: "your-node-management-password"
        salt: "optional-encryption-salt"
    }
    pulseInterval: 50000
    scheduler: {
        releasedOnUnlock: false
    }
    endpoint: {
        mode: auto  # auto, websocket, 또는 polling
    }
}

# 서버 그룹 정의 (gateway 모드 시 필수)
group: {
    id: backend-api
    title: Backend API Service Group
    description: 백엔드 REST API 전용 서버 그룹입니다.
}

# 정적 노드 선언 (선택 사항: Autoscaling 모드 시 자동 등록됨)
node: {
    id: node01
    group: backend-api
    title: Backend API Server 01
    endpoint: {
        mode: auto
    }
}
node: {
    id: node02
    group: backend-api
    title: Backend API Server 02
    endpoint: {
        mode: auto
    }
}
```

### 파라미터 상세 명세

#### `cluster` 섹션 (클러스터 전역 설정)

*   **`id`** (`string`, 필수): 클러스터의 고유 식별자입니다. 동일한 클러스터 ID를 공유하는 노드들끼리 그룹화됩니다.
*   **`mode`** (`string`, 필수): 클러스터 통신 방식을 지정합니다.
    *   `direct`: 노드 간 또는 Console과 노드 간에 직접 HTTP/WebSocket 통신을 수행합니다.
    *   `gateway`: Redis Pub/Sub 메시지 버스를 통한 브릿지 패킷 통신을 수행하며, 동적 오토스케일링(Autoscaling) 및 사설망 인프라 제어에 최적화되어 있습니다.
*   **`secret`** (`object`, 선택): 노드 간 및 Console 제어 패킷의 인증과 암호화를 위한 보안 비밀번호(`password`)와 Salt(`salt`)를 설정합니다.
*   **`pulseInterval`** (`integer`, 선택): 노드의 생존 상태(Heartbeat)를 수집하고 갱신하는 주기(밀리초 단위, 기본값: `50000`ms)입니다.
*   **`scheduler.releasedOnUnlock`** (`boolean`, 선택): 노드가 클러스터 락(Lock)을 해제할 때 스케줄러 잡의 소유권을 자율 반납할지 여부를 설정합니다.
*   **`endpoint.mode`** (`string`, 선택): 엔드포인트 수집 방식을 지정합니다 (`auto`, `websocket`, `polling`).

#### `group` 섹션 (서버 그룹 정의)

`gateway` 모드 구동 시 Console 화면에 노드들을 그룹별 탭(Tab)으로 분리 렌더링하기 위해 그룹 정보를 정의합니다.
*   **`id`**: 그룹 식별자 (예: `backend-api`, `frontend-web`)
*   **`title`**: 콘솔 UI 탭에 출력될 그룹 이름 (예: `Backend API Service Group`)
*   **`description`**: 그룹에 대한 상세 설명

#### `node` 섹션 (개별 노드 정의)

정적으로 관리되는 노드를 선언합니다. 자율 등록(Autoscaling) 모드 구동 시에는 별도의 정적 `node` 선언 없이 노드가 자발적으로 클러스터에 조인할 수 있습니다.
*   **`id`**: 개별 노드의 고유 식별자 (예: `node01`)
*   **`group`**: 노드가 속한 그룹 ID
*   **`title`**: 콘솔 UI 노드 카드에 표시될 친숙한 노드 타이틀명

## 3. Console 내장 AppMon 수집 설정 (`appmon-config.apon`)

Aspectow Console에는 모니터링 엔진인 AppMon이 1급 구성 요소로 내장 통합되어 있습니다. `/config/console/appmon-config.apon` 파일에서 수집 대상 애플리케이션(`app`), 이벤트, 메트릭, 로그 및 집계 주기를 통합 관리합니다.

### APON 설정 파일 구조 예시 (`appmon-config.apon`)

```apon
# DB 카운터 저장 주기 (분 단위, 예: 1분)
counterPersistInterval: 1

# Long-Polling 설정 (WebSocket 미지원 환경)
pollingConfig: {
    pollingInterval: 3000
    sessionTimeout: 30000
}

# 모니터링 대상 애플리케이션 정의
app: {
    id: jpetstore
    title: JPetStore Webapp
    event: {
        id: activity
        target: jpetstore
        parameters: {
            +: /**
        }
    }
    event: {
        id: session
        target: tow.server/jpetstore
        parameters: {
            # 코드 수정 없이 세션 객체에서 사용자명을 선언적으로 추출
            usernameAttribute: user.account.username
        }
    }
    metric: {
        id: heap
        title: Heap Usage
        description: JVM Heap 메모리 사용량을 모니터링합니다.
        reader: com.aspectran.aspectow.appmon.engine.exporter.metric.jvm.HeapMemoryUsageReader
        sampleInterval: 500
    }
    metric: {
        id: undertow-tp
        title: Undertow Thread Pool
        description: Undertow NIO 워커 스레드 풀을 모니터링합니다.
        reader: com.aspectran.aspectow.appmon.engine.exporter.metric.undertow.NioWorkerMetricsReader
        target: tow.server
        sampleInterval: 500
    }
    log: {
        id: app
        file: /logs/jpetstore.log
        sampleInterval: 300
        lastLines: 300
    }
}
```

### 파라미터 명세

*   **`counterPersistInterval`**: 이벤트 카운터 집계 데이터를 Console DB에 저장하는 주기 (분 단위, 기본값: `5`분). `0` 설정 시 DB 저장 비활성화.
*   **`pollingConfig`**: Long-Polling 클라이언트 접속 동작을 설정합니다 (`pollingInterval`, `sessionTimeout`).
*   **`app`**: 모니터링할 개별 애플리케이션 단위.
    *   **`event`**:
        *   `id`: 이벤트 종류 (`activity`, `session`).
        *   `target`: 대상 컨텍스트 식별자 또는 서버 배포 경로 (`tow.server/<deploymentName>`).
        *   `parameters`:
            *   `activity`인 경우: Pointcut `+`/`-` 경로 필터.
            *   `session`인 경우: `usernameAttribute` (프로퍼티 경로, 예: `user.account.username`), `userResolver` (커스텀 `SessionUserResolver` 구현 클래스명 또는 빈 ID).
    *   **`metric`**: `reader` (수집 담당 `MetricReader` 구현 클래스 풀네임), `parameters` (추가 인자).
    *   **`log`**: `file` (테일링 대상 로그 파일 경로), `lastLines` (UI 접속 시 초기 로드 라인 수).

### 3.1. 세션 사용자 추적 및 위치(국가 코드) 변환 설정

AppMon은 세션 이벤트에 대한 강력한 내장 추적 기능을 제공합니다:

*   **원격 IP 자동 추출**: WAS 전용 API에 종속되지 않고 Aspectran의 `WebUtils`를 활용하여 세션 생성 시 클라이언트 IP 주소를 안전하게 자동 추출합니다.
*   **국가 코드 변환 (`IPCountryResolver`)**: Console 활성 세션 대시보드에 클라이언트 접속 국가(ISO 2자리 코드)를 표시하려면, `appmon-rules.xml`에 `IPCountryResolver` 구현 빈(예: KISA WHOIS OpenAPI 연동 빈 등)을 등록합니다:
    ```xml
    <bean id="ipCountryResolver" class="com.aspectran.aspectow.demo.root.common.WhoisIPCountryResolver"/>
    ```
*   **비침투적 사용자명 추출**: `appmon-config.apon`에 `usernameAttribute: user.account.username`과 같이 선언하면, 애플리케이션 코드를 전혀 수정하지 않고도 세션 내 복합 객체로부터 로그인 계정명을 자동 추출하여 실시간 모니터링 화면에 표시합니다.

## 4. 클러스터 통신 모드 선택 가이드 (Direct vs Gateway)

Aspectow Console은 사용자의 네트워크 인프라 환경과 클러스터 시스템 규모에 맞춰 가장 적합한 통신 방식을 선택할 수 있도록 두 가지 클러스터 통신 아키텍처를 제공합니다.

### Direct 통신 모드 (`mode: direct`)

Console 서버가 각 워커 노드의 IP 주소와 포트 엔드포인트로 직접 HTTP 및 WebSocket 통신을 연결하는 방식입니다.

*   **특징 및 장점**: Redis와 같은 외부 메시지 브로커를 추가로 설치할 필요가 없어 가볍고 빠르게 단일 또는 소규모 클러스터를 구축할 수 있습니다.
*   **권장 환경**: 고정 IP 환경, 단일 데이터센터 내부망, 소규모 서버군 환경에 완벽하게 부합합니다.

### Gateway 통신 모드 (`mode: gateway`)

Console과 워커 노드들이 Redis의 Pub/Sub 메시지 버스를 거쳐 관리 패킷을 안전하게 분산 교환하는 방식입니다.

*   **특징 및 장점**: 워커 노드가 방화벽 뒤에 있거나 사설 IP를 사용하더라도 연결 문제가 발생하지 않으며, 클라우드 오토스케일링(Autoscaling) 환경에서 노드가 동적으로 추가되거나 제거될 때 자율적으로 클러스터 상태를 유지합니다.
*   **권장 환경**: 쿠버네티스(Kubernetes), AWS Auto Scaling Group, 멀티 리전(Multi-region) 분산 서버군 환경에 권장됩니다.

## 5. Redis 클러스터링 설정 (`redis.properties`)

`gateway` 통신 모드 선택 시 메시지 브릿지로 활용되는 Redis 접속 정보는 Lettuce 기반의 표준 `RedisURI` 형식을 따르는 **`aspectow.redis.uri`** 단 하나의 간결한 프로퍼티로 설정됩니다.

### 설정 프로퍼티 예시 (`redis-dev.properties` / `redis-prod.properties`)

```properties
# 개발 환경 예시 (redis-dev.properties)
aspectow.redis.uri=redis://127.0.0.1:6379/0

# 운영 환경 예시 (비밀번호 인증 및 DB 인덱스가 포함된 redis-prod.properties)
aspectow.redis.uri=redis://:your-redis-password@10.0.0.3:6379/5
```

### `aspectow.redis.uri` 작성 형식 가이드

*   **기본 형식**: `redis://{host}:{port}/{dbIndex}` (예: `redis://localhost:6379/0`)
*   **비밀번호 인증 필요 시**: `redis://:{password}@{host}:{port}/{dbIndex}` (예: `redis://:mySecretPassword@redis-server:6379/2`)
*   **사용자 계정 및 비밀번호 포함 시**: `redis://{username}:{password}@{host}:{port}/{dbIndex}`

Console 및 워커 노드는 `RedisConnectionPoolConfig`를 통해 이 URI를 파싱하고 `Lettuce` 클라이언트 커넥션 풀을 동적으로 생성하여 고성능 Pub/Sub 메시징 버스를 활성화합니다. Profile에 따라 `redis-dev.properties` 또는 `redis-prod.properties`를 지정하여 환경별로 안전하게 구분할 수 있습니다.

## 6. Console 데이터베이스 접속 및 프로필 설정 (`aspectow-console.db-*.properties`)

Aspectow Console은 관리자 계정, RBAC 권한, Vault 보안 토큰, 감사 로그, 그리고 내장 AppMon의 5분/시간/일/월/년 사전 집계(Pre-aggregation) 통계를 데이터베이스에 보관합니다.

### 6.1. 기본 프로필 및 H2 DB

기본 구성(`aspectran-config.apon`)에서는 내장 `h2` 프로필이 디폴트로 활성화되어 있어, 별도의 RDBMS 설치 없이도 즉시 개발 및 시연 환경을 구동할 수 있습니다.

### 6.2. RDBMS 변경 및 접속 프로퍼티 구성

`h2` 대신 외부 데이터베이스(MariaDB, MySQL, PostgreSQL, Oracle, Supabase)를 연동하려면, 해당 DB 프로필(예: `mariadb`)을 지정하고 프로젝트의 `/config/console/` 디렉토리에 맞는 프로퍼티 파일(**`aspectow-console.db-mariadb.properties`**)을 추가로 작성해야 합니다.

`db.xml`의 `consoleDBProperties` 빈은 지정된 프로필에 맞춰 해당 위치의 프로퍼티 파일을 자동으로 읽어들입니다.

```xml
<!-- db.xml 예시 -->
<bean id="consoleDBProperties" class="com.aspectran.core.support.PropertiesFactoryBean">
    <properties profile="mariadb">
        <item name="locations" type="array">
            <value>classpath:com/aspectran/aspectow/console/config/db/aspectow-console.db-mariadb.properties</value>
            <value>/config/console/aspectow-console.db-mariadb.properties</value>
        </item>
    </properties>
</bean>
```

#### MariaDB 접속 프로퍼티 작성 예시 (`/config/console/aspectow-console.db-mariadb.properties`)

```properties
aspectow-console.db-mariadb.url=jdbc:mariadb://127.0.0.1:3306/aspectow_console?characterEncoding=UTF-8
aspectow-console.db-mariadb.username=console_user
aspectow-console.db-mariadb.password=ENC(EncryptedPasswordHere)
```

#### 시스템 속성(System Property) 전달 구동

Java 실행 시 시스템 속성을 전달하여 Console DB 프로필을 활성화합니다.

```bash
# MariaDB 연동 구동 예시
-Daspectran.profiles.base.console=mariadb -Daspectow-console.db-mariadb.url=jdbc:mariadb://127.0.0.1:3306/aspectow_console -Daspectow-console.db-mariadb.username=console_user -Daspectow-console.db-mariadb.password=your-password
```

## 7. Aspectran XML 룰 및 빈 구성 (`console-rules.xml`, `node-rules.xml`, `appmon-rules.xml`)

Aspectow Console 환경에서는 모듈화된 규칙 구성을 위해 최상위 콘솔 규칙 파일(`console-rules.xml`)을 중심으로 노드 제어 규칙(`node-rules.xml`)과 AppMon 모니터링 규칙(`appmon-rules.xml`)을 조화롭게 캡슐화합니다.

### 7.1. 최상위 콘솔 통합 룰 (`console-rules.xml`)

`console-rules.xml`은 Console 환경의 제어 룰들을 하나로 묶어 제공하는 대표 규칙 파일입니다. `node-rules.xml`과 `appmon-rules.xml`을 하위로 어펜드(`<append>`)하여 포함합니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>

    <!-- 노드 관리 및 제어 룰 포함 -->
    <append file="/config/console/node-rules.xml"/>

    <!-- 내장 AppMon 모니터링 룰 포함 -->
    <append file="/config/console/appmon-rules.xml"/>

</aspectran>
```

`aspectran-config.apon`에는 `/config/console/console-rules.xml` 하나만 명시하면 노드 관리와 AppMon 모니터링 컴포넌트가 함께 일괄 로드됩니다.

### 7.2. 노드 관리 및 제어 룰 (`node-rules.xml`)

노드 관리자와 원격 제어 매니저들은 `node-rules.xml`을 통해 Aspectran 빈(Bean)으로 활성화됩니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>

    <!-- 프로필에 따른 APON 설정 파일 로더 -->
    <bean class="com.aspectran.aspectow.node.config.NodeConfigResolver">
        <properties profile="!prod">
            <item name="configLocation">/config/console/node-config.apon</item>
        </properties>
        <properties profile="prod">
            <item name="configLocation">/config/console/node-config-prod.apon</item>
        </properties>
    </bean>

    <!-- Redis 커넥션 풀 설정 -->
    <bean id="redisConnectionPoolConfig" class="com.aspectran.aspectow.node.redis.RedisConnectionPoolConfig">
        <argument>
            <bean class="com.aspectran.core.support.PropertiesFactoryBean">
                <properties profile="prod">
                    <item name="locations" type="array">
                        <value>/config/console/redis-prod.properties</value>
                    </item>
                </properties>
                <properties profile="!prod">
                    <item name="locations" type="array">
                        <value>/config/console/redis-dev.properties</value>
                    </item>
                </properties>
            </bean>
        </argument>
    </bean>

    <!-- 노드 관리자 팩토리 빈 -->
    <bean id="nodeManager" class="com.aspectran.aspectow.node.manager.NodeManagerFactoryBean" lazyDestroy="true">
        <properties>
            <item name="redisConnectionPoolConfig">#{redisConnectionPoolConfig}</item>
        </properties>
    </bean>

    <!-- 원격 노드 제어 매니저 -->
    <bean id="remoteNodeManager" class="com.aspectran.aspectow.node.management.nodes.RemoteNodeManager"/>

    <!-- 원격 스케줄러 제어 매니저 -->
    <bean id="remoteSchedulerManager" class="com.aspectran.aspectow.node.management.scheduler.RemoteSchedulerManager"/>

    <!-- 원격 명령 제어 매니저 -->
    <bean id="remoteCommandManager" class="com.aspectran.aspectow.node.management.commands.RemoteCommandManager"/>

</aspectran>
```

이 빈 구성을 통해 `RemoteNodeManager`, `RemoteCommandManager`, `RemoteSchedulerManager`가 활성화되어 콘솔 웹 화면의 요청을 노드 메시지 버스 및 비동기 처리 파이프라인으로 매끄럽게 연결합니다.

### 7.3. 내장 AppMon 모니터링 룰 (`appmon-rules.xml`) 및 독립 구동

Console에 내장 탑재된 AppMon 모니터링 엔진은 `appmon-rules.xml`을 통해 실행 프로필(`!prod`/`prod`)에 맞춰 적절한 APON 수집 설정 경로를 동적으로 로드합니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>

    <bean class="com.aspectran.aspectow.appmon.engine.config.AppMonConfigResolver">
        <properties profile="!prod">
            <item name="configLocation">/config/console/appmon-config.apon</item>
        </properties>
        <properties profile="prod">
            <item name="configLocation">/config/console/appmon-config-prod.apon</item>
        </properties>
    </bean>

    <!-- 국가 코드 해석기 빈 등록 (선택 사항) -->
    <bean id="ipCountryResolver" class="com.aspectran.aspectow.demo.root.common.WhoisIPCountryResolver"/>

</aspectran>
```

#### 독립형 AppMon (Standalone AppMon) 구동 방식과의 차이점
* **Aspectow Console 환경**: `console-rules.xml`을 사용하여 노드 제어 기능(`node-rules.xml`)과 AppMon 모니터링 기능(`appmon-rules.xml`)을 동시에 활성화합니다.
* **Console 없는 독립형 AppMon 환경**: Console UI 컨텍스트 없이 순수 모니터링 수집 노드로 구동할 경우 `console-rules.xml` 없이 **`appmon-rules.xml`만 단독으로 지정하여 실행**함으로써 자원 소모를 최소화하고 가볍게 구동할 수 있습니다.
