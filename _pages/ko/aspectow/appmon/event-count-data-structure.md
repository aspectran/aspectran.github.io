---
format: plate solid article
title: AppMon 이벤트 카운트 데이터 구조 및 아키텍처
sidebar: toc
---

{% capture info_message %}
Aspectow AppMon은 대규모 분산 환경에서 발생하는 이벤트를 효율적으로 추적하고 시각화하기 위해 **상태형(Gauge)**과 **변화량(Counter)** 패턴이 결합된 데이터 구조를 사용합니다.
{% endcapture %}
{% include alert.liquid info=info_message %}

## 1. 핵심 데이터 컬럼 설명

이벤트 카운트 테이블(`appmon_event_count`)의 핵심 컬럼들은 다음과 같은 역할을 수행합니다.

| 컬럼 | 유형 | 설명 | 비유 |
| :--- | :--- | :--- | :--- |
| **`total`** | **Gauge** (상태형) | 이벤트가 시작된 시점부터 현재까지의 **전체 누적 합계**입니다. | 자동차의 **적산 거리계** (Total Odometer) |
| **`delta`** | **Counter** (변화량) | 직전 수집 주기(예: 5분) 동안 **새롭게 발생한 이벤트 횟수**입니다. | 자동차의 **구간 거리계** (Trip Meter) |
| **`error`** | **Counter** (변화량) | 직전 수집 주기 동안 발생한 **오류 횟수**입니다. | 구간 내 결함 발생 수 |

### 데이터 기록 예시 (5분 수집 주기 기준)

| 시간 | total (누적) | delta (구간 발생량) | 비고 |
| :--- | :--- | :--- | :--- |
| 10:00 | 1,000 | 50 | 09:55~10:00 사이에 50번 발생 |
| 10:05 | 1,080 | 80 | 10:00~10:05 사이에 80번 발생 |
| 10:10 | 1,110 | 30 | 10:05~10:10 사이에 30번 발생 |

*   **`total`**은 시스템의 전체 규모를 파악하고 데이터 유실 시 정합성을 복구하는 기준점이 됩니다.
*   **`delta`**는 TPS(초당 요청 수)나 분당 요청 수와 같은 실시간 변화율을 차트로 시각화하는 데 사용됩니다.

---

## 2. 사전 집계(Pre-aggregation) 아키텍처

데이터가 수백만 건 이상 쌓이는 환경(특히 Oracle Cloud Free Tier와 같은 제한된 자원)에서도 빠른 조회 성능을 보장하기 위해 도입된 구조입니다.

### 테이블 구성 및 용도

AppMon은 데이터를 수집하는 시점에 원본 테이블과 함께 두 개의 요약 테이블에 데이터를 동시에 기록(또는 집계)합니다.

1.  **`appmon_event_count` (Raw Data)**
    *   기본 5분 단위의 상세 데이터가 저장됩니다.
    *   용도: 최근 1~2시간 내의 실시간 세밀한 변화(5min View) 조회.

2.  **`appmon_event_count_hourly` (Hourly Summary)**
    *   시간 단위로 절삭(`truncated`)된 데이터가 저장됩니다.
    *   `total`은 해당 시간의 마지막 값(`MAX`), `delta/error`는 해당 시간 내 모든 값의 합계(`SUM`)입니다.
    *   용도: 시간 단위 차트(byHour View) 조회.

3.  **`appmon_event_count_daily` (Daily Summary)**
    *   일 단위로 절삭된 데이터가 저장됩니다.
    *   용도: 일/월/년 단위 차트(byDay, byMonth, byYear View) 조회.

### 대시보드 쿼리 최적화 매핑

사전 집계 도입 후, 각 쿼리는 데이터 양에 최적화된 테이블을 참조하게 됩니다.

| 대시보드 보기 | 참조 테이블 | 성능 개선 효과                       |
| :--- | :--- |:-------------------------------|
| **5min View** | `appmon_event_count` | 기존과 동일 (최근 데이터 위주)             |
| **Hour View** | `appmon_event_count_hourly` | 실시간 GROUP BY 연산 제거 (매우 빠름)     |
| **Day View** | `appmon_event_count_daily` | 실시간 GROUP BY 연산 제거 (**가장 빠름**) |
| **Month/Year View** | `appmon_event_count_daily` | 처리 대상 행 수가 **1/288 수준으로 감소**   |

이 아키텍처를 통해 AppMon은 저장 공간을 약간 더 사용하는 대신, 데이터 규모에 상관없이 일관되게 빠른 응답 속도를 제공할 수 있게 되었습니다.
