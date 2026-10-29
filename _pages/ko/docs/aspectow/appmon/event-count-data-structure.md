---
title: "AppMon 이벤트 카운트 데이터 구조 및 아키텍처"
subheadline: "Aspectow AppMon"
---

Aspectow AppMon은 대규모 분산 환경에서 발생하는 애플리케이션 지표를 실시간으로 모니터링하고, 방대한 데이터를 효율적으로 집계 및 시각화하기 위해 설계되었습니다.

이 문서는 AppMon의 핵심 데이터 모델과 보조 지표(`aux`)의 유연한 활용 방식, 그리고 성능 최적화를 위한 사전 집계(Pre-aggregation) 아키텍처를 상세히 설명합니다.

## 1. 핵심 메타데이터 컬럼

이벤트 카운트 테이블은 `node_id`, `app_id`, `event_id`, `datetime`으로 구성된 복합 기본 키(PK)와 그룹 단위 집계를 위한 `group_id` 인덱스를 사용하여 데이터를 관리에 최적화된 형태로 식별합니다.

| 컬럼 | 데이터 타입 | 설명 |
| :--- | :--- | :--- |
| **`node_id`** | `varchar(30)` | **서버 노드(Server Node)**의 식별자입니다. 클러스터링된 환경에서 각 물리적/논리적 서버를 구분합니다 (예: `appmon-node1`, `node01`). |
| **`group_id`** | `varchar(30)` | **노드 그룹(Node Group)**의 식별자입니다. 여러 노드를 논리적인 서버 그룹으로 묶어 통합 관제할 수 있게 합니다 (예: `group1`, `backend-api`). |
| **`app_id`** | `varchar(30)` | 서버 내에서 실행되는 **애플리케이션**의 식별자입니다. 컨텍스트 경로와 동일한 명칭을 주로 사용합니다 (예: `jpetstore`, `petclinic`, `demo`). |
| **`event_id`** | `varchar(30)` | 추적 중인 특정 지표 또는 활동의 식별자입니다 (예: `activity`, `session`). |
| **`datetime`** | `datetime` | 데이터 수집 시점의 타임스탬프 (UTC). |

## 2. 지표 컬럼과 데이터 기록 원리

AppMon은 전체 누적 상태를 나타내는 **Gauge** 방식과 구간 변화량을 나타내는 **Counter** 방식을 유기적으로 결합하여 데이터를 수집 및 영속화합니다. 특히 보조 지표인 **`aux`** 컬럼은 이벤트 유형(`event_id`)에 따라 지표의 성격을 유연하게 전환하여 기록합니다.

| 컬럼 | 지표 유형 | 설명 | 비유 |
| :--- | :--- | :--- | :--- |
| **`total`** | **Gauge** | 이벤트 시작 시점부터 현재까지의 **전체 누적 합계**입니다. | 자동차의 **적산 거리계** (Total Odometer) |
| **`delta`** | **Counter** | 직전 수집 주기(예: 5분) 동안 발생한 **신규 이벤트 횟수**입니다. | 자동차의 **구간 거리계** (Trip Meter) |
| **`aux`** | **복합 (Counter / Gauge)** | 이벤트 유형에 맞추어 유연하게 활용되는 **보조 지표 (Auxiliary Metric)**입니다.<br>• `activity`: 직전 주기 동안 발생한 **오류 횟수 (Errors)** (Counter)<br>• `session`: 수집 시점의 **현재 활성 사용자 수 (Active Users)** (Gauge) | • 오류 횟수 (결함 수)<br>• 현재 탑승객 수 (스냅샷) |

### `aux` 컬럼의 설계 배경
초기 버전의 AppMon 테이블에는 `error` 컬럼이 존재하여 트랜잭션 요청 중 발생한 오류 횟수만을 수집했습니다. 하지만 사용자 세션(`session`) 이벤트의 경우 시스템 구조상 오류가 발생하지 않아 해당 컬럼이 완전히 방치되는 비효율이 존재했습니다.
이에 따라 컬럼 명칭을 보다 범용적인 `aux`(Auxiliary)로 전환하고, 세션 이벤트에서는 별도의 테이블이나 이벤트 타입을 추가하지 않고도 **Active Users(현재 접속 중인 활성 사용자 수)**를 해당 컬럼에 기록하도록 설계했습니다. 이를 통해 테이블 스키마의 단순성을 유지하면서 모니터링 분석 가치를 극대화했습니다.

### 데이터 수집 및 기록 예시 (5분 주기 기준)

실제 데이터베이스에는 이벤트 종류에 따라 다음과 같이 데이터가 기록됩니다.

#### 1) 활동 이벤트 (`event_id = 'activity'`)
`activity` 이벤트에서는 누적 트랜잭션 수, 5분간 처리된 요청 수, 그리고 해당 구간에 발생한 오류 건수를 추적합니다.

| 시간 (datetime) | total (누적) | delta (요청 변화량) | aux (오류 횟수) | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| 10:00:00 | 1,000 | 50 | 0 | 09:55~10:00 사이에 50건 처리, 오류 없음 |
| 10:05:00 | 1,080 | 80 | 2 | 10:00~10:05 사이에 80건 처리, 2건 오류 발생 |
| 10:10:00 | 1,110 | 30 | 0 | 10:05~10:10 사이에 30건 처리, 오류 없음 |

*   **`total`**: 전체 누적 처리 건수로서 시스템 재시작이나 일시적인 네트워크 지연 시에도 전체 볼륨의 정합성을 보장하는 기준선입니다.
*   **`delta`**: 구간 처리량으로 실시간 TPS 및 분당 요청 수를 측정하는 핵심 지표입니다.
*   **`aux`**: 구간 동안 발생한 오류 수로 대시보드에서 에러 발생 시점을 즉시 파악할 수 있게 합니다.

#### 2) 세션 이벤트 (`event_id = 'session'`)
`session` 이벤트에서는 신규 생성된 세션 수와 함께 현재 시점에 로그인/접속 중인 활성 사용자 수를 동시에 추적합니다.

| 시간 (datetime) | total (누적) | delta (신규 세션 수) | aux (활성 사용자 수) | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| 10:00:00 | 200 | 15 | 42 | 5분간 15개 세션 신규 생성, 수집 시점 활성 사용자 42명 |
| 10:05:00 | 225 | 25 | 58 | 5분간 25개 세션 신규 생성, 수집 시점 활성 사용자 58명 |
| 10:10:00 | 235 | 10 | 50 | 5분간 10개 세션 신규 생성, 수집 시점 활성 사용자 50명 |

*   **`total`**: 애플리케이션 시작 후 누적 생성된 총 세션 수입니다.
*   **`delta`**: 직전 5분 동안 새로 생성된 신규 세션 수입니다.
*   **`aux`**: 해당 타임스탬프 시점에 세션 저장소에 유효하게 유지되고 있는 활성 사용자 수(Active Users)의 스냅샷입니다.

## 3. 실제 활용 사례 및 대시보드 차트 시각화

AppMon 대시보드는 이 데이터 모델을 기반으로 활동 및 세션 지표를 매우 직관적으로 교차 분석할 수 있는 차트를 제공합니다.

### A. 활동 (Activities)
Aspectran 트랜슬릿 및 웹 요청의 실행 볼륨과 안정성을 모니터링합니다.
*   **이벤트 ID**: `activity`
*   **지표 매핑**:
    *   기본 지표: `delta` (요청 처리량, Activities)
    *   보조 지표: `aux` (오류 건수, Errors)
*   **시각화 방식**:
    *   요청 처리량(파란색 영역/바) 위에 오류 건수(빨간색 영역/바)가 쌓이는 **Stacked 차트**로 표현됩니다.
    *   실시간 라인 차트에서는 오류가 발생한 타임스탬프의 x축 그리드 라인이 빨간색(`#ff6384`)으로 자동 강조되어 장애 구간을 즉시 식별할 수 있습니다.

### B. 세션 (Sessions)
사용자 유입 트래픽과 실제 시스템에 머무르고 있는 동시 접속자 수를 복합 비교합니다.
*   **이벤트 ID**: `session`
*   **지표 매핑**:
    *   기본 지표: `delta` (신규 생성 세션 수, Sessions)
    *   보조 지표: `aux` (실시간 뷰: **Active Users**, 시간/일/월/년 뷰: **Peak Users**)
*   **시각화 방식**:
    *   생성 세션 수와 활성 사용자 수는 서로 물리적 성격이 다른 지표(구간 발생량 vs 시점 동시 접속자)이므로, Y축 값이 왜곡되지 않도록 **Unstacked (독립 척도) 콤보 차트**로 표현됩니다.
    *   신규 세션 수는 막대 또는 영역 차트(녹색 계열)로 표시되고, 활성 사용자 수(Active Users / Peak Users)는 뚜렷한 보라색 라인 차트(`#9b59b6`)로 그 위에 중첩 렌더링됩니다.
    *   이를 통해 "신규 사용자 유입이 급증할 때 실제 동시 접속자 수(Active Users)가 어떻게 반응하는가"를 단 하나의 차트에서 직관적으로 파악할 수 있습니다.

## 4. 사전 집계(Pre-aggregation) 아키텍처

수억 건의 원본 데이터가 장기간 축적되더라도 대시보드 조회 속도를 항상 밀리초(ms) 단위로 유지하기 위해 고도화된 사전 집계 아키텍처를 적용했습니다.

### 데이터 계층 구조 (Tiered Storage)

AppMon은 데이터 수집 시점에 원본과 시간 요약본을 동시에 갱신합니다.

1.  **원본 계층 (`appmon_event_count`)**
    *   해상도: 5분 단위 (기본값)
    *   용도: 최근 1~2시간 내의 매우 정밀한 실시간 변화 분석 (**5min View**).
    *   인덱스: `group_id`, `app_id`, `event_id`, `datetime` 복합 인덱스를 통해 노드 및 그룹 단위 조회를 초고속으로 수행합니다.

2.  **시간 요약 계층 (`appmon_event_count_hourly`)**
    *   해상도: 1시간 단위 (원본 대비 데이터 볼륨 약 1/12로 감소)
    *   집계 논리:
        *   `total`: 해당 시간의 최종 누적값
        *   `delta`: 해당 1시간 내에 발생한 모든 5분 구간 delta의 합계 (`SUM`)
        *   `aux`: 이벤트 성격에 맞추어 지능적 분기 집계
            *   `activity`: 구간 내 발생한 모든 오류 건수의 합계 (`SUM`)
            *   `session`: 해당 1시간 동안 기록된 활성 사용자 수 중 **최고치(Peak Active Users)** (`GREATEST(aux, #{aux})`)
    *   용도: 최근 수일~수주일간의 시간대별 트렌드 분석 (**Hour View**).

3.  **최종 상태 관리 (`appmon_event_count_last`)**
    *   용도: 각 노드/애플리케이션/이벤트별 가장 최근 수집된 지표 스냅샷을 보관하여, 프로세스 재시작 시의 연속성 보장 및 증분 계산의 기준점으로 활용됩니다.

### 지표 성격에 따른 집계 전략 분기 (Counter vs Gauge)

지표 수집에서 가장 흔히 발생하는 통계 왜곡은 **Gauge(순간 상태값)**를 **Counter(변화량)**처럼 단순 합산(`SUM`)하는 오류입니다.
*   예를 들어, 1시간 동안 5분마다 활성 사용자가 50명으로 유지되었다면 실제 평균 및 피크 접속자는 50명입니다.
*   만약 이를 `SUM`으로 집계해 버리면 12번의 슬롯이 합산되어 1시간 동안 활성 사용자가 600명이었던 것으로 잘못 표시됩니다.

AppMon은 이러한 왜곡을 방지하기 위해 데이터베이스 저장 프로시저 및 MyBatis 매퍼 레벨에서 다음과 같은 최적화된 SQL 전략을 채택했습니다.

#### 1) 시간 요약 계층 저장 시점 (Upsert)
새로운 5분 데이터가 인입될 때 `ON DUPLICATE KEY UPDATE` (또는 `MERGE`) 구문에서 `aux`를 갱신하는 방식:
*   MySQL:
    ```sql
    aux = CASE WHEN #{eventId} = 'session' THEN GREATEST(aux, #{aux}) ELSE aux + #{aux} END
    ```
*   H2:
    ```sql
    aux = CASE WHEN b.event_id = 'session' THEN GREATEST(a.aux, b.aux) ELSE a.aux + b.aux END
    ```
*   PostgreSQL:
    ```sql
    aux = CASE WHEN EXCLUDED.event_id = 'session' THEN GREATEST(appmon_event_count_hourly.aux, EXCLUDED.aux) ELSE appmon_event_count_hourly.aux + EXCLUDED.aux END
    ```
*   Oracle:
    ```sql
    aux = CASE WHEN b.event_id = 'session' THEN GREATEST(a.aux, b.aux) ELSE a.aux + b.aux END
    ```

#### 2) 장기 트렌드 조회 시점 (Day / Month / Year View)
일, 월, 년 단위로 시간 요약 데이터를 다시 집계하여 대시보드에 뿌려줄 때의 쿼리:
```sql
SELECT
    group_id,
    app_id,
    event_id,
    <날짜 포맷 함수>(datetime) AS datetime,
    MAX(total) AS total,
    SUM(delta) AS delta,
    CASE WHEN #{eventId} = 'session' THEN MAX(aux) ELSE SUM(aux) END AS aux
FROM
    appmon_event_count_hourly
WHERE
    app_id = #{appId}
    AND event_id = #{eventId}
    AND datetime >= #{from} AND datetime < #{to}
GROUP BY
    group_id, app_id, event_id, <날짜 포맷 함수>(datetime)
ORDER BY
    datetime ASC
```
이 전략을 통해 활동 이벤트는 기간 내의 **총 오류 발생 건수(Errors)**를 정확히 보여주고, 세션 이벤트는 해당 일/월/년의 **구간별 최고 동시 접속자 수(Peak Users)**를 정밀하게 제공합니다.

### 성능 개선 효과 및 대시보드 매핑

| 대시보드 보기 | 참조 테이블 | 조회 방식 및 성능 효과 |
| :--- | :--- | :--- |
| **5min View** | `appmon_event_count` | 최근 100~200건의 로우를 인덱스를 통해 직접 고속 조회 |
| **Hour View** | `appmon_event_count_hourly` | 이미 1시간 단위로 요약된 로우를 직접 조회 (실시간 집계 연산 전면 배제) |
| **Day/Month/Year View** | `appmon_event_count_hourly` | 1시간 단위 요약 데이터를 일/월/년으로 그룹화. 원본 테이블 대비 스캔 대상 로우가 **약 8.3% 수준**으로 대폭 감소 |

## 5. 데이터베이스 스키마 스크립트

각 RDBMS 환경에 최적화된 테이블 정의 및 인덱스 스크립트는 다음 경로에서 확인할 수 있습니다.

*   [H2 Schema Script](https://github.com/aspectran/aspectow/blob/main/appmon/src/main/resources/com/aspectran/aspectow/appmon/config/db/appmon-schema-h2.sql)
*   [MySQL Schema Script](https://github.com/aspectran/aspectow/blob/main/appmon/src/main/resources/com/aspectran/aspectow/appmon/config/db/appmon-schema-mysql.sql)
*   [PostgreSQL Schema Script](https://github.com/aspectran/aspectow/blob/main/appmon/src/main/resources/com/aspectran/aspectow/appmon/config/db/appmon-schema-postgresql.sql)
*   [Oracle Schema Script](https://github.com/aspectran/aspectow/blob/main/appmon/src/main/resources/com/aspectran/aspectow/appmon/config/db/appmon-schema-oracle.sql)
