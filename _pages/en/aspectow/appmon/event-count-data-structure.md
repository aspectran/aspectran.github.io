---
format: plate solid article
title: AppMon Event Count Data Structure and Architecture
teaser: Aspectow AppMon is designed to monitor application metrics in real-time across large-scale distributed environments.
sidebar: toc
---

{% capture info_message %}
It efficiently aggregates and visualizes massive amounts of data. This document provides a technical overview of the AppMon data model and its **Pre-aggregation Architecture** for superior performance.
{% endcapture %}
{% include alert.liquid info=info_message %}

## 1. Core Metadata Columns

The event count tables use a composite primary key consisting of `domain`, `instance`, `event`, and `datetime` to uniquely identify each data point.

| Column | Data Type | Description |
| :--- | :--- | :--- |
| **`domain`** | `varchar(30)` | Identifier for the **server node**. In a clustered environment, it distinguishes each physical server (e.g., `backend1`, `backend2`, `localhost`). |
| **`instance`** | `varchar(30)` | The name of the **application (context)** running on the server. Usually matches the context path (e.g., `jpetstore`, `petclinic`, `demo`). |
| **`event`** | `varchar(30)` | Specific metric or activity being tracked (e.g., `activity`, `session`). |
| **`datetime`** | `datetime` | The UTC timestamp of the collection point. |

---

## 2. Metric Columns and Recording Principles

AppMon records metrics using a combination of **Gauge** (state) and **Counter** (change) patterns.

| Column | Metric Type | Description | Analogy |
| :--- | :--- | :--- | :--- |
| **`total`** | **Gauge** | The **cumulative total count** since the beginning of the event. | **Total Odometer** |
| **`delta`** | **Counter** | The **number of new events** within the interval (e.g., 5 min). | **Trip Meter** |
| **`error`** | **Counter** | The **number of error events** within the interval. | Fault occurrences during trip |

### Example Data Recording (5-minute Collection Interval)

Data is recorded in the database according to the following logic:

| Time (datetime) | total (Cumulative) | delta (Incremental) | Remarks |
| :--- | :--- | :--- | :--- |
| 10:00:00 | 1,000 | 50 | 50 occurrences between 09:55–10:00 |
| 10:05:00 | 1,080 | 80 | 80 occurrences between 10:00–10:05 |
| 10:10:00 | 1,110 | 30 | 30 occurrences between 10:05–10:10 |

*   **`total`** provides the overall scale and serves as a reference for data consistency in case of system restarts or data loss.
*   **`delta`** is the core metric for visualizing real-time rates of change, such as TPS (Transactions Per Second), in charts.

---

## 3. Real-world Use Cases (Dashboard Charts)

AppMon uses this data structure to provide two primary monitoring sections on the dashboard.

### A. Activities
Tracks the execution of Aspectran Translets (requests).
- **Event Name**: Typically named `activity`.
- **Purpose**: Visualizes request throughput (TPS) and error rates. The **Activities** chart on the dashboard is powered by the `delta` and `error` values of these events.

### B. Sessions
Tracks the lifecycle of user sessions.
- **Event Name**: Named `session`.
- **Purpose**: Visualizes active session counts and trends in session creation/expiration. The **Sessions** chart on the dashboard provides insights into user traffic and activity.

---

## 4. Pre-aggregation Architecture

Pre-aggregation was introduced to maintain consistent dashboard query performance even with millions of raw records. Instead of performing expensive `GROUP BY` operations on-the-fly, the dashboard utilizes summarized data.

### Tiered Storage Strategy

AppMon manages both raw and summary data at the point of collection:

1.  **Raw Tier (`appmon_event_count`)**
    *   Resolution: 5-minute intervals (default).
    *   **Purpose**: Real-time fine-grained analysis (**5min View**) for the last 1–2 hours.

2.  **Hourly Summary Tier (`appmon_event_count_hourly`)**
    *   Resolution: 1-hour intervals (~1/12th the data volume of raw tier).
    *   Aggregation: `total` is the last cumulative value (`MAX`) of the hour; `delta/error` is the total sum (`SUM`) of changes within the hour.
    *   **Purpose**: Mid-term trend analysis (**Hour View**).

3.  **Daily Summary Tier (`appmon_event_count_daily`)**
    *   Resolution: 1-day intervals (~1/288th the data volume of raw tier).
    *   **Purpose**: Long-term history analysis (**Day, Month, Year Views**).

### Performance Impact and Dashboard Mapping

| Dashboard View | Reference Table | Query Strategy and Performance |
| :--- | :--- | :--- |
| **5min View** | `appmon_event_count` | Directly fetches recent 100–200 rows (Fast). |
| **Hour View** | `appmon_event_count_hourly` | Fetches already summarized hourly rows (Eliminates on-the-fly grouping). |
| **Day View** | `appmon_event_count_daily` | Fetches summarized daily rows (**Fastest response time**). |
| **Month/Year View** | `appmon_event_count_daily` | Groups daily rows by month/year. Target rows **reduced to 0.3%** of raw data. |

### Maintaining Data Integrity
Every time a metric is collected, AppMon uses the `ON DUPLICATE KEY UPDATE` (or `MERGE`) statement to continuously accumulate `delta` and `error` values into the corresponding time/day slots in the summary tables. This ensures that the dashboard always displays up-to-date aggregated data without waiting for background batch jobs.

---

## 5. Database Schema Scripts

The official schema and migration scripts for supported database platforms are available here:

- [MySQL Schema Script](https://github.com/aspectran/aspectow-appmon/blob/master/appmon/src/main/resources/com/aspectran/appmon/persist/db/appmon-schema-mysql.sql)
- [H2 Schema Script](https://github.com/aspectran/aspectow-appmon/blob/master/appmon/src/main/resources/com/aspectran/appmon/persist/db/appmon-schema-h2.sql)
- [Oracle Schema Script](https://github.com/aspectran/aspectow-appmon/blob/master/appmon/src/main/resources/com/aspectran/appmon/persist/db/appmon-schema-oracle.sql)
