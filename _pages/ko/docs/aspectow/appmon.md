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
*   **다양한 데이터 소스 지원**:
    *   **이벤트(Events)**: HTTP 요청 처리, 세션 생성/소멸 등 애플리케이션의 주요 이벤트를 추적하고 카운팅합니다.
    *   **메트릭(Metrics)**: JVM 힙 메모리 사용량(`HeapMemoryUsageReader`), Undertow 스레드 풀 상태(`NioWorkerMetricsReader`), HikariCP 커넥션 풀 상태(`HikariPoolMBeanReader`) 등 다양한 시스템 메트릭을 수집합니다.
    *   **로그(Logs)**: 지정된 애플리케이션 및 액세스 로그 파일을 실시간으로 테일링(Tailing)하여 UI에 표시합니다.
*   **데이터 영속성**: 주요 이벤트 카운트 데이터를 내장된 H2 데이터베이스 또는 RDBMS에 주기적으로 저장하여, 애플리케이션 재시작 시에도 통계 데이터가 유지될 수 있도록 합니다.
*   **유연한 APON 설정**: APON(Aspectran Object Notation) 기반의 설정 파일을 통해 모니터링 대상 노드 그룹(`group`), 서버 노드(`node`), 애플리케이션(`app`), 이벤트, 메트릭, 로그 대상을 유연하게 정의합니다.

## 3. 핵심 아키텍처 및 3계층 식별 체계

Aspectow AppMon은 분산 모니터링을 위해 **`Group` (노드 그룹) - `Node` (서버 노드) - `App` (애플리케이션)**으로 이어지는 3계층 식별 체계를 사용합니다.

### 주요 엔진 컴포넌트

*   **AppMonManager**: AppMon의 전체적인 생명주기와 설정을 관리하는 핵심 엔진입니다.
*   **Exporter**: 특정 데이터 소스(로그, 메트릭, 이벤트)로부터 데이터를 수집하는 역할을 담당합니다.
    *   **Reader**: `Exporter`가 데이터를 수집하는 구체적인 방법을 구현합니다 (예: `HeapMemoryUsageReader`, `NioWorkerMetricsReader` 등).
*   **PersistManager**: 수집된 카운터 데이터를 데이터베이스에 주기적으로 보관하는 영속성 처리를 담당합니다.
    *   **CounterPersistSchedule**: 스케줄러에 의해 주기적으로 실행되어 카운터 데이터를 DB에 저장합니다.
*   **ExportService**: 클라이언트(웹 UI)와의 통신을 담당하며, 수집된 데이터를 WebSocket 또는 Polling 방식으로 전송합니다.
*   **Activity (Front/Backend)**: 웹 UI 또는 외부 에이전트로부터의 HTTP 요청을 처리하는 컨트롤러 역할을 합니다.

## 4. 데이터 영속성 구조

Aspectow AppMon은 이벤트 카운팅 데이터를 데이터베이스에 저장하여 통계를 유지합니다. 기본적으로 내장된 H2 데이터베이스를 사용하며, 스키마는 다음과 같습니다.

*   **`appmon_event_count`**
    *   분, 시간, 일, 월, 년 단위로 집계된 이벤트 카운트 데이터를 저장합니다. 이 테이블의 데이터는 통계 차트를 그리는 데 사용됩니다.
    *   주요 컬럼: `group_id`, `node_id`, `app_id`, `event_id`, `datetime`, `total`(누적 합계), `delta`(구간 발생 횟수), `error`(오류 발생 횟수).

*   **`appmon_event_count_last`**
    *   각 이벤트의 마지막 카운트 상태를 저장합니다. 애플리케이션이 재시작될 때 이 테이블의 데이터를 읽어 카운터를 복원함으로써 통계 유실을 방지합니다.

## 5. Console 없이 AppMon 단독(Standalone) 설치 및 설정 가이드

Console 구축 없이 특정 애플리케이션 서버에 AppMon만 단독으로 가볍게 구동하고자 할 때는 프로젝트의 **`/config/appmon/`** 디렉토리에 설정 파일들을 구성합니다.

### 5.1. 설정 디렉토리 구성 (`/config/appmon/`)

*   **`appmon-config.apon`**: 모니터링 대상 애플리케이션, 이벤트, 메트릭 및 로그 테일링 대상을 정의하는 메인 APON 파일
*   **`appmon-rules.xml`**: Aspectran XML 규칙 파일로, 노드 프로필에 따라 노드 연동 룰을 append 구성
*   **`appmon.db-h2.properties`**: 내장 H2 DB 보관 경로 설정 프로퍼티 파일

### 5.2. APON 메인 설정 (`appmon-config.apon`) 상세 작성법

```apon
# WebSocket 미지원 환경을 위한 Long-Polling 설정
pollingConfig: {
    pollingInterval: 3000   # 클라이언트가 서버로 새 메시지를 폴링하는 주기(ms)
    sessionTimeout: 30000   # 비활성 폴링 세션 만료 시간(ms)
}

# DB 카운터 저장 주기 (분 단위, 예: 1분)
counterPersistInterval: 1

# 모니터링 대상 애플리케이션 정의 1 (Root 앱)
app: {
    id: appmon-root
    title: Root Application
    event: {
        id: activity
        target: root
        parameters: {
            +: /**
        }
    }
    event: {
        id: session
        target: tow.server/root
    }
    metric: {
        id: heap
        title: Heap
        description: JVM Heap 메모리 사용량을 모니터링합니다.
        reader: com.aspectran.aspectow.appmon.engine.exporter.metric.jvm.HeapMemoryUsageReader
        sampleInterval: 500
        heading: true
    }
    metric: {
        id: undertow-tp
        title: Undertow Thread Pool
        description: Undertow NIO 워커 스레드 풀 자원을 모니터링합니다.
        reader: com.aspectran.aspectow.appmon.engine.exporter.metric.undertow.NioWorkerMetricsReader
        target: tow.server
        sampleInterval: 500
        heading: true
    }
    log: {
        id: app
        file: /logs/root.log
        sampleInterval: 300
        lastLines: 300
    }
    log: {
        id: access
        file: /logs/root-access.log
        sampleInterval: 300
        lastLines: 100
    }
}

# 모니터링 대상 애플리케이션 정의 2 (AppMon 단독 관리 콘솔 예시)
app: {
    id: appmon
    title: AppMon Self
    event: {
        id: activity
        target: appmon
        parameters: {
            +: /**
            -: /nodes/**/polling/**  # 무의미한 폴링 요청 트래픽은 모니터링에서 제외
        }
    }
    event: {
        id: session
        target: tow.server/appmon
    }
    log: {
        id: app
        file: /logs/appmon.log
        sampleInterval: 300
        lastLines: 300
    }
}
```

### 5.3. Aspectran XML 룰 및 DB 경로 설정

#### `appmon-rules.xml` 구성

단독 구동 시 게이트웨이 프로필 선택 여부에 따라 룰 파일을 동적으로 포함하도록 설정합니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>

    <append file="/config/appmon/node-rules.xml" profile="!gateway"/>
    <append file="/config/appmon/node-rules-gateway.xml" profile="gateway"/>

</aspectran>
```

#### `appmon.db-h2.properties` 구성

내장 H2 데이터베이스 경로를 지정합니다:

```properties
aspectow.appmon.config.db.h2.path=~/aspectow-appmon-data
```

RDBMS(MariaDB, MySQL, Oracle 등)를 연동하려는 경우 Java 실행 시 시스템 속성을 전달합니다:

```bash
# MariaDB 연동 예시
-Daspectran.profiles.base.appmon=mariadb -Dappmon.db-mariadb.url=jdbc:mariadb://127.0.0.1:3306/appmon_db -Dappmon.db-mariadb.username=appmon -Dappmon.db-mariadb.password=your-password
```

## 6. 결론

Aspectow AppMon은 Aspectow Console의 통합 모니터링 엔진으로 구동될 수 있을 뿐만 아니라, 필요에 따라 프로젝트의 `/config/appmon/` 설정을 통해 독립된 모니터링 솔루션으로 손쉽게 배포할 수 있는 유연성을 제공합니다.
