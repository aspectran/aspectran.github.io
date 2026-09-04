---
title: Aspectow AppMon 개요 및 설정 가이드
teaser: Aspectow AppMon은 Aspectran 프레임워크 기반 애플리케이션의 실시간 이벤트, 시스템 메트릭, 세션 및 로그 스트리밍을 관찰하는 경량 모니터링 솔루션입니다.
subheadline: Aspectow AppMon
---

## 1. 개요

Aspectow AppMon은 Aspectran 프레임워크 기반의 애플리케이션을 위한 경량(Lightweight) 실시간 모니터링 솔루션입니다. 애플리케이션의 성능에 미치는 영향을 최소화하면서, 운영 중에 발생하는 다양한 이벤트, 로그, 시스템 메트릭 등을 웹 UI를 통해 실시간으로 관찰할 수 있도록 설계되었습니다.

Console에 내장 통합되어 통합 관제 환경에서 구동될 수도 있고, Console 없이 **Aspectow AppMon을 단독(Standalone) 솔루션으로 설치하여 가볍게 운용**할 수도 있습니다.

## 2. 주요 특징

*   **실시간 모니터링**: WebSocket 또는 Long-Polling 방식을 통해 서버에서 발생하는 데이터를 실시간으로 스트리밍하여 UI에 표시합니다.
*   **경량성 및 쉬운 통합**: 모니터링 대상 애플리케이션에 Aspectran 빈(Bean)으로 간단하게 등록할 수 있으며, 최소한의 리소스를 사용하여 애플리케이션 성능 저하를 최소화합니다.
*   **동적 모니터링**: Aspectran의 AOP 기능을 활용하여 애플리케이션 코드 변경 없이 특정 트랜잭션(Activity)의 실행을 동적으로 추적하고 성능을 측정합니다.
*   **상시 사용자 추적 및 국가코드 변환 (Always-On User Tracking & Geolocation)**: 비즈니스 코드 수정 없이 세션 생성 시 클라이언트 IP를 자동 추출하고 국가 코드를 변환하여 기록합니다.
*   **비침투적 사용자명 추출 (Non-intrusive Username Resolution)**: 선언적 프로퍼티 경로(`usernameAttribute`) 또는 `SessionUserResolver` 확장을 통해 복잡한 세션 객체에서 사용자명을 손쉽게 추출합니다.
*   **다양한 데이터 소스 지원**:
    *   **이벤트(Events)**: HTTP 요청 처리, 세션 생성/소멸 등 애플리케이션의 주요 이벤트를 추적하고 카운팅합니다.
    *   **메트릭 (Metrics)**: JVM 힙 메모리 사용량 (`HeapMemoryUsageReader`), Undertow 스레드 풀 상태 (`UndertowThreadPoolMetricsReader`), HikariCP 커넥션 풀 상태 (`HikariPoolMBeanReader`) 등 다양한 시스템 메트릭을 수집합니다.
    *   **로그(Logs)**: 지정된 애플리케이션 및 액세스 로그 파일을 실시간으로 테일링(Tailing)하여 UI에 표시합니다.
*   **데이터 영속성**: 주요 이벤트 카운트 데이터를 내장된 H2 데이터베이스 또는 외부 RDBMS에 주기적으로 저장하여, 애플리케이션 재시작 시에도 통계 데이터가 유실되지 않고 유지됩니다.
*   **유연한 APON 설정**: APON(Aspectran Parameter Object Notation) 기반의 설정 파일을 통해 노드 및 모니터링 대상 앱을 유연하게 정의할 수 있습니다.

## 3. 핵심 아키텍처 및 3계층 식별 체계

Aspectow AppMon은 분산 모니터링을 위해 **`Group` (서버 그룹) - `Node` (서버 노드) - `App` (애플리케이션)**으로 이어지는 3계층 식별 체계를 사용합니다.

### 주요 엔진 컴포넌트

*   **AppMonManager**: AppMon의 전체적인 생명주기와 설정을 관리하는 핵심 엔진입니다.
*   **Exporter**: 특정 데이터 소스(로그, 메트릭, 이벤트)로부터 데이터를 수집하는 역할을 담당합니다.
    *   **Reader**: `Exporter`가 데이터를 수집하는 구체적인 방법을 구현합니다 (예: JMX를 통해 JVM 메트릭 조회, 파일 시스템에서 로그 파일 읽기 등).
*   **UserTrackingListener**: 세션 생성 시 클라이언트 IP 주소(`user.ipAddress`)와 해석된 국가 코드(`user.countryCode`)를 세션 속성에 상시 주입하는 리스너입니다.
*   **PersistManager**: 수집된 카운터 데이터를 데이터베이스에 주기적으로 보관하는 영속성 처리를 담당합니다.
    *   **CounterPersistSchedule**: 스케줄러에 의해 주기적으로 실행되어 카운터 데이터를 DB에 저장합니다.
*   **ExportService**: 클라이언트(웹 UI)와의 통신을 담당하며, 수집된 데이터를 WebSocket 또는 Polling 방식으로 전송합니다.
*   **Activity (Front/Backend)**: 웹 UI 또는 외부 에이전트로부터의 HTTP 요청을 처리하는 컨트롤러 역할을 합니다.

## 4. 세션 모니터링 및 사용자 추적 아키텍처

AppMon은 **상시 세션 추적(Always-On User Tracking)**과 **온디맨드 실시간 브로드캐스트(On-Demand Live Broadcasting)**를 유기적으로 결합한 정교한 세션 모니터링 아키텍처를 제공합니다.

### 4.1. 생명주기 분리: 상시 동작(Always-On) vs 온디맨드(On-Demand)

*   **상시 세션 추적 (`UserTrackingListener`)**:
    *   서버 기동 시 `SessionEventReader.init()`에서 대상 배포(`deploymentName`)의 `SessionManager`에 **영구 상시 등록**됩니다.
    *   관리자가 AppMon 웹 UI를 보고 있지 않은 평상시에도 24시간 365일 모든 신규 세션에 클라이언트 IP 주소와 국가 코드를 안전하게 주입합니다.
    *   이를 통해 관리자가 나중에 접속하여 전체 활성 세션 목록(`getAllActiveSessions`)을 조회하더라도 모든 세션의 위치/IP 정보가 누락 없이 완전하게 표시됩니다.
    *   내장된 중복 등록 방지 가드(`registeredTrackingTargets`)를 통해 동일한 배포 타겟(`tow.server/demo`)을 여러 `app`에서 참조하더라도 리스너는 정확히 단 1회만 등록됩니다.
*   **온디맨드 실시간 브로드캐스트 (`SessionEventReadingListener`)**:
    *   관리자가 특정 앱의 대시보드에 접속(`subscribe`)할 때만 등록되고, 구독자가 0명이 되면 해제(`stop()`)되어 런타임 리소스 낭비를 최소화합니다.

### 4.2. 국가 코드 해석 (`IPCountryResolver`)

AppMon은 플러그형 인터페이스인 `IPCountryResolver`를 통해 클라이언트 IP 주소로부터 ISO 2자리 국가 코드(예: `KR`, `US`, `JP`)를 자동 판별합니다:

```java
package com.aspectran.aspectow.appmon.common.support;

public interface IPCountryResolver {
    String resolveCountryCode(String ipAddress, Locale locale);
    default String resolveCountryCode(String ipAddress) { ... }
}
```

KISA WHOIS OpenAPI 연동 구현체(`WhoisIPCountryResolver`)나 MaxMind GeoIP 데이터베이스 연동 구현체를 `appmon-rules.xml`에 빈으로 등록해 두면, AppMon이 세션 생성 시 이를 자동으로 조회하여 `user.countryCode`에 주입합니다.

### 4.3. 비침투적 사용자명 추출 (`usernameAttribute` & `SessionUserResolver`)

실제 웹 애플리케이션은 단순 문자열이 아니라 `UserSession`, `Account`, `Principal` 같은 커스텀 객체 단위로 세션에 로그인 정보를 보관합니다. AppMon은 애플리케이션 코드를 전혀 수정하지 않고도 사용자명을 추출할 수 있도록 3단계 우선순위 체계를 지원합니다:

1.  **커스텀 리졸버 (`userResolver`)**: `event.parameters.userResolver` 또는 컨텍스트에 등록된 `SessionUserResolver` 빈/클래스를 우선 호출합니다:
    ```java
    public interface SessionUserResolver {
        String resolveUsername(String deploymentName, Session session);
    }
    ```
2.  **선언적 프로퍼티 경로 탐색 (`usernameAttribute`)**: JavaBean 프로퍼티 경로(예: `user.account.username`)를 선언하면 세션 내 객체의 중첩 게터(`session.getAttribute("user").getAccount().getUsername()`)를 자동 탐색합니다:
    ```apon
    event: {
        id: session
        target: tow.server/jpetstore
        parameters: {
            usernameAttribute: user.account.username
        }
    }
    ```
3.  **기본값 폴백 (Default Fallback)**: 세션에 설정된 `user.name` 속성이 존재할 경우 이를 기본 조회합니다.

### 4.4. 실시간 로그인 상태 변경 감지

사용자가 로그인하여 세션에 인증 객체(예: `"user"`)가 추가되거나 갱신될 때, `SessionEventReader`가 `attributeAdded` / `attributeUpdated` 이벤트를 즉시 감지하여 AppMon 대시보드로 실시간 세션 갱신 이벤트를 전송합니다.

## 5. 데이터 영속성 구조 개요

Aspectow AppMon은 이벤트 카운팅 데이터를 데이터베이스에 안정적으로 보관하여 통계를 유지합니다. 기본적으로 내장된 H2 데이터베이스를 사용하며 다음과 같은 주요 테이블을 제공합니다.

*   **`appmon_event_count`**: 분, 시간, 일, 월, 년 단위로 집계된 카운트 데이터를 저장하며 대시보드 시각화 차트에 직접 활용됩니다.
*   **`appmon_event_count_last`**: 각 이벤트의 직전 카운트 상태를 보관하여 애플리케이션 재시작 시 인메모리 카운터를 복원함으로써 통계 연속성을 제공합니다.

> 자세한 복합 PK 스키마 및 사전 집계(Pre-aggregation) 3계층 저장소 아키텍처에 대해서는 [AppMon 이벤트 카운트 데이터 구조 및 아키텍처](/ko/docs/aspectow/appmon/event-count-data-structure/) 문서를 참조하세요.

## 6. Console 없이 AppMon 단독(Standalone) 설치 및 설정 가이드

Console 구축 없이 특정 애플리케이션 서버에 AppMon만 단독으로 구동하고자 할 때는 프로젝트의 **`/config/appmon/`** 디렉토리에 설정 파일들을 구성합니다.

### 6.1. 설정 디렉토리 구성 (`/config/appmon/`)

*   **`appmon-config.apon`**: 수집 대상 애플리케이션(`app`), 이벤트, 메트릭, 로그 및 카운터 저장 주기를 정의하는 메인 설정 파일
*   **`node-config.apon`**: 서버 그룹(`group`) 및 노드(`node`) 정의 파일
*   **`appmon-rules.xml` & `node-rules.xml`**: `AppMonConfigResolver` 및 `NodeConfigResolver`를 통해 설정 파일들을 로드하고 `NodeManagerFactoryBean`을 등록하는 Aspectran XML 규칙 파일
*   **`appmon.db-h2.properties`**: 내장 H2 DB 보관 경로 설정 프로퍼티 파일

### 6.2. APON 메인 설정 (`appmon-config.apon`) 예시

`appmon-config.apon` 파일에는 모니터링할 애플리케이션(`app`), 수집 이벤트, 메트릭, 로그 및 저장 주기를 정의합니다.

```apon
# DB 카운터 저장 주기 (분 단위, 예: 1분)
counterPersistInterval: 1

# Long-Polling 설정 (WebSocket 미지원 환경)
pollingConfig: {
    pollingInterval: 3000   # 폴링 주기(ms)
    sessionTimeout: 30000   # 세션 만료 시간(ms)
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

### 6.3. 주요 APON 파라미터 명세

*   **`counterPersistInterval`**: 이벤트 카운터의 집계 데이터를 DB에 저장하는 주기(분 단위, 기본값: 5분). `0` 설정 시 DB 저장 비활성화.
*   **`pollingConfig`**: Long-Polling 접속 동작을 설정합니다 (`pollingInterval`, `sessionTimeout`).
*   **`app`**: 모니터링할 개별 애플리케이션 단위.
    *   **`event`**:
        *   `id`: 이벤트 종류 (`activity`, `session`).
        *   `target`: 대상 컨텍스트 식별자 또는 서버 배포 경로 (`tow.server/<deploymentName>`).
        *   `parameters`:
            *   `activity`인 경우: Pointcut `+`/`-` 경로 필터.
            *   `session`인 경우: `usernameAttribute` (프로퍼티 경로, 예: `user.account.username`), `userResolver` (커스텀 `SessionUserResolver` 구현 클래스명 또는 빈 ID).
    *   **`metric`**: `reader` (수집을 담당하는 `MetricReader` 구현 클래스 풀네임), `parameters` (추가 인자).
    *   **`log`**: `file` (테일링 대상 로그 파일 경로), `lastLines` (UI 접속 시 초기 로드 라인 수).

> 서버 그룹(`group`) 및 노드(`node`) 정의는 `node-config.apon` 또는 `node-config-gateway.apon` 파일에 별도로 작성됩니다.

### 6.4. 단계별 설치 및 구동 가이드

#### 1단계: 수집 대상 애플리케이션 정의 (`/config/appmon/appmon-config.apon`)
`appmon-config.apon` 파일에 모니터링할 `app`, `event`, `metric`, `log` 대상을 정의합니다.

#### 2단계: 노드 클러스터 정의 (`/config/appmon/node-config.apon`)
`node-config.apon` (또는 `node-config-gateway.apon`) 파일에 서버 그룹(`group`)과 서버 노드(`node`)를 정의합니다.

```apon
cluster: {
    id: appmon-cluster1
    mode: direct
}
group: {
    id: group1
    title: Group 1
}
node: {
    id: appmon-node1
    group: group1
    title: Localhost
    endpoint: {
        mode: auto
    }
}
```

#### 3단계: XML 룰 구성 (`appmon-rules.xml` & `node-rules.xml`)
`appmon-rules.xml`에서 `AppMonConfigResolver`를 통해 설정 파일을 지정하고, 적절한 노드 룰(`node-rules.xml`)을 append 합니다.

```xml
<!-- appmon-rules.xml 예시 -->
<aspectran>
    <bean class="com.aspectran.aspectow.appmon.engine.config.AppMonConfigResolver">
        <properties profile="!prod">
            <item name="configLocation">/config/appmon/appmon-config.apon</item>
        </properties>
        <properties profile="prod">
            <item name="configLocation">/config/appmon/appmon-config-prod.apon</item>
        </properties>
    </bean>

    <!-- 선택 사항: 국가 코드 해석기 빈 등록 -->
    <!-- <bean id="ipCountryResolver" class="com.aspectran.aspectow.demo.root.common.WhoisIPCountryResolver"/> -->

    <append file="/config/appmon/node-rules.xml"/>
</aspectran>
```

`node-rules.xml`에서는 `NodeConfigResolver`로 `node-config.apon` 경로를 로드하고 `NodeManagerFactoryBean`을 등록합니다.

```xml
<!-- node-rules.xml 예시 -->
<aspectran>
    <bean class="com.aspectran.aspectow.node.config.NodeConfigResolver">
        <properties>
            <item name="configLocation">/config/appmon/node-config.apon</item>
        </properties>
    </bean>

    <bean id="nodeManager" class="com.aspectran.aspectow.node.manager.NodeManagerFactoryBean" lazyDestroy="true"/>
</aspectran>
```

#### 4단계: 데이터베이스 접속 및 프로필 설정 (Database & Profile Configuration)

독립형(Standalone) AppMon을 구동하려면 실행 프로필(Profiles) 및 데이터베이스 접속 정보를 바르게 설정해야 합니다.

*   **독립형 필수 프로필 (`appmon.standalone`)**: Console 없이 AppMon을 독립 솔루션으로 구동하려면 **반드시 `appmon.standalone` 프로필 지정이 필수**입니다.
*   **기본 프로필 및 H2 DB**: 기본 구성(`aspectran-config.apon`)에서는 `appmon.standalone`과 내장 `h2` 프로필이 디폴트로 활성화되어 별도 DB 설정 없이 즉시 개발 및 시연 환경을 구동할 수 있습니다.
*   **RDBMS 변경 및 프로퍼티 파일 추가**: `h2` 대신 다른 데이터베이스(MariaDB, MySQL, PostgreSQL, Oracle 등)를 연동하려면, 해당 DB 프로필(예: `mariadb`)을 지정하고 프로젝트의 `/config/appmon/` 디렉토리에 맞는 프로퍼티 파일(**`appmon.db-mariadb.properties`**)을 추가로 작성해야 합니다.

독립형 AppMon은 일반적으로 `appmon` 컨텍스트 이름으로 구동되므로, 다음과 같이 Java 시스템 속성(System Property)을 통해 실행 프로필과 접속 프로퍼티를 전달합니다.

```bash
# 독립형(appmon.standalone) 모드에서 MariaDB 연동 구동 예시
-Daspectran.profiles.base.appmon=appmon.standalone,mariadb -Dappmon.db-mariadb.url=jdbc:mariadb://127.0.0.1:3306/appmon_db -Dappmon.db-mariadb.username=appmon -Dappmon.db-mariadb.password=your-password
```

## 7. 결론

Aspectow AppMon은 Aspectow Console의 내장 모니터링 엔진으로 구동될 수 있을 뿐만 아니라, 필요에 따라 프로젝트의 `/config/appmon/` 설정을 통해 독립된 모니터링 솔루션으로 손쉽게 배포하여 애플리케이션의 투명성과 관찰 가능성(Observability)을 크게 향상시킬 수 있습니다.
