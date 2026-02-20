---
format: plate solid article
title: AppMon 이벤트 카운트 데이터 구조 및 아키텍처
teaser: Aspectow AppMon은 대규모 분산 환경에서 발생하는 애플리케이션 지표를 실시간으로 모니터링하고, 방대한 데이터를 효율적으로 집계 및 시각화하기 위해 설계되었습니다.
sidebar: toc
---

{% capture info_message %}
이 문서는 AppMon의 핵심 데이터 모델과 성능 최적화를 위한 사전 집계(Pre-aggregation) 아키텍처를 상세히 설명합니다.
{% endcapture %}
{% include alert.liquid info=info_message %}

## 1. 핵심 메타데이터 컬럼

이벤트 카운트 테이블은 `domain`, `instance`, `event`, `datetime`으로 구성된 복합 기본 키(PK)를 사용하여 데이터를 식별합니다.

| 컬럼 | 데이터 타입 | 설명 |
| :--- | :--- | :--- |
| **`domain`** | `varchar(30)` | **서버 노드(Server Node)**의 식별자입니다. 클러스터링된 환경에서 각 물리적 서버를 구분합니다 (예: `backend1`, `backend2`, `localhost`). |
| **`instance`** | `varchar(30)` | 서버 내에서 실행되는 **애플리케이션(Application/Context)**의 이름입니다. 컨텍스트 경로와 동일한 명칭을 사용합니다 (예: `jpetstore`, `petclinic`, `demo`). |
| **`event`** | `varchar(30)` | 추적 중인 특정 지표 또는 활동의 이름입니다 (예: `activity`, `session`). |
| **`datetime`** | `datetime` | 데이터 수집 시점의 타임스탬프 (UTC). |

---

## 2. 지표 컬럼과 데이터 기록 원리

AppMon은 상태를 나타내는 **Gauge** 방식과 변화량을 나타내는 **Counter** 방식을 혼합하여 데이터를 기록합니다.

| 컬럼 | 지표 유형 | 설명 | 비유 |
| :--- | :--- | :--- | :--- |
| **`total`** | **Gauge** | 이벤트 시작 시점부터 현재까지의 **전체 누적 합계**입니다. | 자동차의 **적산 거리계** (Total Odometer) |
| **`delta`** | **Counter** | 직전 수집 주기(예: 5분) 동안 발생한 **신규 이벤트 횟수**입니다. | 자동차의 **구간 거리계** (Trip Meter) |
| **`error`** | **Counter** | 직전 수집 주기 동안 발생한 **오류 횟수**입니다. | 구간 내 결함 발생 수 |

### 데이터 기록 예시 (5분 수집 주기 기준)

실제 데이터베이스에는 다음과 같은 논리로 데이터가 쌓이게 됩니다.

| 시간 (datetime) | total (누적) | delta (변화량) | 비고 |
| :--- | :--- | :--- | :--- |
| 10:00:00 | 1,000 | 50 | 09:55~10:00 사이에 50번 발생 |
| 10:05:00 | 1,080 | 80 | 10:00~10:05 사이에 80번 발생 |
| 10:10:00 | 1,110 | 30 | 10:05~10:10 사이에 30번 발생 |

*   **`total`**은 전체 누적치를 보여주며, 시스템 재시작이나 데이터 유실 시에도 정합성을 유지하는 기준이 됩니다.
*   **`delta`**는 TPS(초당 요청 수)나 분당 요청 수와 같은 실시간 변화율을 차트로 시각화하는 핵심 데이터입니다.

## 3. 실제 활용 사례 (데시보드 챠트)

AppMon은 현재 이 데이터 구조를 사용하여 대시보드의 두 가지 주요 영역을 제공합니다.

### A. 활동(Activities)
Aspectran 트랜슬릿(요청)의 실행을 추적합니다.
- **이벤트 이름**: 주로 `activity`으로 명명됩니다.
- **용도**: 요청 처리량(TPS)과 오류율을 시각화합니다. 대시보드의 **Activities** 차트는 이 이벤트의 `delta`와 `error` 값을 기반으로 그려집니다.

### B. 세션(Sessions)
사용자 세션의 생명주기를 추적합니다.
- **이벤트 이름**: `session`으로 명명됩니다.
- **용도**: 활성 세션 수 및 세션 생성/만료 트렌드를 시각화합니다. 대시보드의 **Sessions** 차트를 통해 사용자 트래픽과 활동성을 파악할 수 있습니다.

## 4. 사전 집계(Pre-aggregation) 아키텍처

수백만 건의 원본 데이터가 쌓여도 대시보드 조회 성능을 일정하게 유지하기 위해 도입된 핵심 기술입니다. 실시간으로 방대한 양의 로우를 `GROUP BY` 하는 대신, 미리 요약된 데이터를 사용합니다.

### 데이터 계층 구조 (Tiered Storage)

AppMon은 데이터를 수집할 때 원본과 요약본을 동시에 관리합니다.

1.  **원본 계층 (`appmon_event_count`)**
    *   해상도: 5분 단위 (기본값)
    *   용도: 최근 1~2시간 내의 매우 정밀한 실시간 변화 분석 (**5min View**).

2.  **시간 요약 계층 (`appmon_event_count_hourly`)**
    *   해상도: 1시간 단위 (원본 대비 데이터양 약 1/12)
    *   집계 논리: `total`은 해당 시간의 마지막 누적값(`MAX`), `delta/error`는 해당 시간 내 모든 변화량의 합계(`SUM`).
    *   용도: 최근 며칠간의 시간대별 트렌드 분석 (**Hour View**).

3.  **일 요약 계층 (`appmon_event_count_daily`)**
    *   해상도: 1일 단위 (원본 대비 데이터양 약 1/288)
    *   용도: 장기 이력 데이터 분석 (**Day, Month, Year Views**).

### 성능 개선 효과 및 대시보드 매핑

| 대시보드 보기 | 참조 테이블 | 조회 방식 및 성능 효과 |
| :--- | :--- | :--- |
| **5min View** | `appmon_event_count` | 최근 100~200건의 로우를 직접 조회 (기존과 동일하게 빠름) |
| **Hour View** | `appmon_event_count_hourly` | 이미 요약된 시간당 1개의 로우를 조회 (실시간 집계 연산 제거) |
| **Day View** | `appmon_event_count_daily` | 이미 요약된 일당 1개의 로우를 조회 (**가장 빠른 응답 속도**) |
| **Month/Year View** | `appmon_event_count_daily` | 일 단위 데이터를 월/년으로 묶음. 처리 대상 로우가 **원본 대비 0.3% 수준**으로 감소 |

### 집계 데이터의 정합성 유지
데이터가 수집될 때마다 `ON DUPLICATE KEY UPDATE` (또는 `MERGE`) 구문을 사용하여 요약 테이블의 해당 시간/일 슬롯에 `delta`와 `error` 값을 지속적으로 합산(Accumulate)합니다. 이를 통해 스케줄러를 기다릴 필요 없이 언제나 최신화된 집계 데이터를 대시보드에 즉시 반영할 수 있습니다.

---

## 5. 데이터베이스 스키마 스크립트

각 DB 플랫폼별 공식 스키마와 마이그레이션 스크립트는 다음 경로에서 확인할 수 있습니다.

*   [MySQL Schema Script](https://github.com/aspectran/aspectow-appmon/blob/master/appmon/src/main/resources/com/aspectran/appmon/persist/db/appmon-schema-mysql.sql)
*   [H2 Schema Script](https://github.com/aspectran/aspectow-appmon/blob/master/appmon/src/main/resources/com/aspectran/appmon/persist/db/appmon-schema-h2.sql)
*   [Oracle Schema Script](https://github.com/aspectran/aspectow-appmon/blob/master/appmon/src/main/resources/com/aspectran/appmon/persist/db/appmon-schema-oracle.sql)
