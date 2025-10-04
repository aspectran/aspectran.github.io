---
format: plate solid article
title: Aspectow AppMon
teaser: Aspectow AppMon은 Aspectran 프레임워크 기반의 애플리케이션을 위한 경량(Lightweight) 실시간 모니터링 솔루션입니다.
sidebar: toc
---

## 1. 개요

Aspectow AppMon은 Aspectran 프레임워크 기반의 애플리케이션을 위한 경량(Lightweight) 실시간 모니터링 솔루션입니다. 애플리케이션의 성능에 미치는 영향을 최소화하면서, 운영 중에 발생하는 다양한 이벤트, 로그, 시스템 메트릭 등을 웹 UI를 통해 실시간으로 관찰할 수 있도록 설계되었습니다.

복잡한 설정 없이 Aspectran 애플리케이션에 쉽게 통합할 수 있으며, 개발자와 운영자가 애플리케이션의 내부 동작을 직관적으로 파악하고 문제를 신속하게 진단할 수 있도록 돕습니다.

## 2. 주요 특징

- **실시간 모니터링**: WebSocket 또는 Long-Polling 방식을 통해 서버에서 발생하는 데이터를 실시간으로 스트리밍하여 UI에 표시합니다.
- **경량성 및 쉬운 통합**: 모니터링 대상 애플리케이션에 Aspectran 빈(Bean)으로 간단하게 등록할 수 있으며, 최소한의 리소스를 사용하여 애플리케이션 성능 저하를 최소화합니다.
- **동적 모니터링**: Aspectran의 AOP 기능을 활용하여 애플리케이션 코드 변경 없이 특정 트랜잭션(Activity)의 실행을 동적으로 추적하고 성능을 측정합니다.
- **다양한 데이터 소스 지원**:
  - **이벤트(Events)**: HTTP 요청 처리, 세션 생성/소멸 등 애플리케이션의 주요 이벤트를 추적하고 카운팅합니다.
  - **메트릭(Metrics)**: JVM 힙 메모리 사용량, Undertow 스레드 풀 상태, HikariCP 커넥션 풀 상태 등 다양한 시스템 메트릭을 수집합니다.
  - **로그(Logs)**: 지정된 로그 파일을 실시간으로 테일링(Tailing)하여 UI에 표시합니다.
- **데이터 영속성**: 주요 이벤트 카운트 데이터를 내장된 H2 데이터베이스에 주기적으로 저장하여, 애플리케이션 재시작 시에도 통계 데이터가 유지될 수 있도록 합니다.
- **유연한 설정**: APON(Aspectran Object Notation) 기반의 설정 파일을 통해 어떤 인스턴스의 어떤 데이터를 모니터링할지 유연하게 정의할 수 있습니다.

## 3. 핵심 아키텍처

Aspectow AppMon은 다음과 같은 주요 컴포넌트로 구성됩니다.

- **AppMonManager**: AppMon의 전체적인 생명주기와 설정을 관리하는 핵심 엔진입니다.
- **Exporter**: 특정 데이터 소스(로그, 메트릭, 이벤트)로부터 데이터를 수집하는 역할을 담당합니다.
  - **Reader**: `Exporter`가 데이터를 수집하는 구체적인 방법을 구현합니다. (예: JMX를 통해 JVM 메트릭 조회, 파일 시스템에서 로그 파일 읽기 등)
- **PersistManager**: 수집된 데이터(주로 이벤트 카운트)를 데이터베이스에 저장하는 영속성 처리를 담당합니다.
  - **CounterPersistSchedule**: 스케줄러에 의해 주기적으로 실행되어 카운터 데이터를 DB에 저장합니다.
- **ExportService**: 클라이언트(웹 UI)와의 통신을 담당하며, 수집된 데이터를 WebSocket 또는 Polling 방식으로 전송합니다.
- **Activity (Front/Backend)**: 웹 UI 또는 외부 에이전트로부터의 HTTP 요청을 처리하는 컨트롤러 역할을 합니다.

## 4. 시작하기 (간단 가이드)

1.  **의존성 추가**: `pom.xml`에 `aspectow-appmon` 의존성을 추가합니다.
2.  **팩토리 빈 등록**: Aspectran 설정 파일에 `AppMonManagerFactoryBean`을 컴포넌트로 등록합니다. 이 팩토리 빈이 AppMon의 모든 기능을 활성화합니다.
3.  **설정 파일 작성**: `appmon-config.apon` 파일을 작성하여 모니터링할 인스턴스, 이벤트, 메트릭, 로그 등의 대상을 상세하게 정의합니다.
4.  **애플리케이션 실행**: Aspectran 애플리케이션을 실행하면 AppMon이 함께 구동됩니다.
5.  **웹 UI 접속**: 지정된 URL로 접속하여 실시간 모니터링을 시작합니다.

## 5. 데이터 영속성 구조

Aspectow AppMon은 이벤트 카운팅 데이터를 데이터베이스에 저장하여 통계를 유지합니다. 기본적으로 내장된 H2 데이터베이스를 사용하며, 스키마는 다음과 같습니다.

- **`appmon_event_count`**
  - 분, 시간, 일, 월, 년 단위로 집계된 이벤트 카운트 데이터를 저장합니다.
  - 이 테이블의 데이터는 통계 차트를 그리는 데 사용됩니다.
  - 주요 컬럼:
    - `domain`, `instance`, `event`: 어떤 이벤트의 카운트인지를 식별합니다.
    - `datetime`: 집계된 시간 단위 (예: `yyyyMMddHHmm`).
    - `total`: 누적 전체 카운트.
    - `delta`: 해당 시간 단위 동안 발생한 카운트.
    - `error`: 해당 시간 단위 동안 발생한 오류 카운트.

- **`appmon_event_count_last`**
  - 각 이벤트의 마지막 카운트 상태를 저장합니다.
  - 애플리케이션이 재시작될 때 이 테이블의 데이터를 읽어 카운터를 복원함으로써, 재시작 전의 통계가 유실되지 않도록 합니다.
  - `appmon_event_count` 테이블과 유사한 구조를 가지지만, `datetime` 대신 마지막 등록 시간을 나타내는 `reg_dt` 컬럼이 있습니다.

## 6. AppMon 설정 방법

AppMon의 모든 동작은 `appmon-config.apon` 파일을 통해 설정됩니다. 또한, AppMon은 기본 설정을 라이브러리에 내장하고, 사용자가 프로젝트의 `/config/appmon` 디렉토리에서 이를 재정의하는 유연한 구조를 가집니다.

### 6.1. `appmon-config.apon` 파일 상세

이 파일은 모니터링할 대상과 방법을 정의하는 여러 섹션으로 구성됩니다.

#### 주요 설정 섹션

- **`counterPersistInterval`**: 이벤트 카운터의 집계 데이터를 데이터베이스에 저장하는 주기를 분(minute) 단위로 설정합니다. 설정하지 않으면 기본값인 5분으로 동작합니다.
- **`pollingConfig`**: 클라이언트가 Long-Polling 방식으로 접속할 때의 동작을 설정합니다. (`pollingInterval`, `sessionTimeout` 등)
- **`domain`**: 모니터링 대상이 되는 서버 인스턴스를 정의하고 논리적으로 그룹화합니다. 각 `domain`은 하나의 모니터링 대상 서버를 가리키며, 해당 서버에 접속하기 위한 엔드포인트(`endpoint`) 정보를 포함합니다.
- **`instance`**: 모니터링할 개별 애플리케이션 또는 컴포넌트 단위를 정의합니다. 대부분의 상세 설정이 이 섹션 아래에 위치합니다.

#### `instance` 상세 설정

`instance` 섹션 아래에는 `event`, `metric`, `log`를 설정하여 원하는 데이터를 수집할 수 있습니다.

- **`event` 설정**:
  - `name`: `activity` 또는 `session`과 같이 미리 정의된 이벤트 타입을 지정합니다.
  - `target`: 모니터링할 대상을 지정합니다.
    - `activity`의 경우: Aspectran의 ActivityContext 이름 (예: `jpetstore`).
    - `session`의 경우: 서블릿 컨텍스트 경로 (예: `tow.server/jpetstore`).
  - `parameters`: `activity` 이벤트에 대한 Pointcut을 설정하여 특정 요청 경로만 포함하거나 제외할 수 있습니다.

- **`metric` 설정**:
  - `reader`: 메트릭을 수집할 `MetricReader` 구현 클래스의 전체 이름을 지정합니다. 이 설정을 통해 커스텀 메트릭 수집기를 쉽게 추가할 수 있습니다.
    - 예: `com.aspectran.appmon.exporter.metric.jvm.HeapMemoryUsageReader`
  - `parameters`: `reader` 클래스에 전달할 파라미터를 설정합니다. (예: HikariCP의 `poolName`)

- **`log` 설정**:
  - `file`: 테일링할 로그 파일의 경로를 지정합니다.
  - `lastLines`: UI에 처음 접속했을 때 보여줄 로그의 마지막 라인 수를 지정합니다.

#### 설정 예시 (`appmon-config.apon`)

```apon
# DB 저장 주기 (분 단위), 0으로 설정하면 비활성화
counterPersistInterval: 10

# 모니터링 대상 서버 정의
domain: {
    name: backend1
    title: Server-1
    endpoint: {
        mode: auto
        url: /appmon/backend1
    }
}
domain: {
    name: backend2
    title: Server-2
    endpoint: {
        mode: auto
        url: /appmon/backend2
    }
}

# 모니터링할 인스턴스 상세 정의
instance: {
    name: jpetstore
    title: JPetStore
    event: {
        name: activity
        target: jpetstore
        parameters: {
            +: /**
        }
    }
    event: {
        name: session
        target: tow.server/jpetstore
    }
    metric: {
        name: cp-jpetstore
        title: CP-jpetstore
        description: Shows the JDBC connection pool usage status
        reader: com.aspectran.appmon.exporter.metric.jdbc.HikariPoolMBeanReader
        parameters: {
            poolName: jpetstore
        }
        sampleInterval: 50
        exportInterval: 900
    }
    log: {
        name: app
        title: JPetStore App
        file: /logs/jpetstore.log
        lastLines: 1000
        sampleInterval: 300
    }
}
```

### 6.2. 단계별 설정 가이드

AppMon의 설정은 '재정의(Override)' 개념을 기반으로 동작하며, 일반적인 설정 단계는 다음과 같습니다.

#### 1단계: 모니터링 대상 정의

> **수정할 파일: `/config/appmon/appmon-config.apon`**

가장 먼저, 위에서 설명한 `appmon-config.apon` 파일을 프로젝트의 `/config/appmon/` 디렉토리에 생성하고, 모니터링할 `instance`, `event`, `metric`, `log` 등을 지정합니다.

#### 2단계: 데이터베이스 종류 선택 및 접속 정보 설정

> **설정 방법: Java 시스템 속성(System Properties) 사용**

AppMon은 모니터링 데이터를 저장할 DB를 Java 시스템 속성을 통해 지정합니다.

1.  **DB 프로필 선택**: `-Daspectran.profiles.base.appmon` 속성을 사용하여 `h2`, `mariadb`, `mysql`, `oracle` 중 하나를 선택합니다.
2.  **DB 접속 정보 전달**: 선택한 DB에 맞는 접속 정보를 별도의 시스템 속성으로 전달합니다.

```bash
# Java 실행 시 시스템 속성 전달 예시 (MariaDB)
-Daspectran.profiles.base.appmon=mariadb \
-Dappmon.db-mariadb.url=jdbc:mariadb://127.0.0.1:3306/appmon \
-Dappmon.db-mariadb.username=appmon \
-Dappmon.db-mariadb.password=your-password
```

#### 3단계: UI 애셋 및 JSP 설정

> **관련 파일: `appmon-assets.xml`, `webapps/appmon/WEB-INF/jsp/appmon/**`**

-   **`appmon-assets.xml`**: 프로파일(`dev`/`prod`)에 따라 AppMon UI의 CSS, JavaScript 등 정적 애셋을 로컬에서 가져올지, CDN에서 가져올지 결정합니다.
-   **JSP 파일 복사**: AppMon UI를 구성하는 JSP 파일들은 **사용자가 직접 UI를 수정해서 사용할 수 있도록** 라이브러리에 포함되어 있지 않습니다. 따라서, 원본 프로젝트의 `/webapps/appmon/WEB-INF/jsp/appmon` 디렉토리 내용을 자신의 프로젝트 내 동일 경로로 복사해 와야 합니다.

#### 4단계: 도메인 식별자 설정 (운영 환경)

> **설정 방법: Java 시스템 속성 사용**

여러 서버 그룹을 모니터링하는 운영 환경에서는, `-Dappmon.domain` 시스템 속성을 사용하여 현재 인스턴스가 어떤 도메인에 속하는지 알려주어야 합니다. 이 값은 `appmon-config.apon`에 정의된 여러 `domain` 중 하나와 일치해야 합니다.

```bash
# 현재 인스턴스가 'prod-cluster' 도메인에 속함을 지정
-Dappmon.domain=prod-cluster
```

## 7. 결론

Aspectow AppMon은 Aspectran 애플리케이션의 투명성과 관찰 가능성(Observability)을 크게 향상시키는 강력한 도구입니다. 복잡한 APM 솔루션 도입이 부담스러운 환경에서 최소한의 설정으로 애플리케이션의 내부 상태를 실시간으로 들여다보고, 성능 문제를 조기에 발견하고 싶을 때 최적의 선택이 될 수 있습니다.
