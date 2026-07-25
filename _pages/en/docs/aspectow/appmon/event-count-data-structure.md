---
title: "AppMon Event Count Data Structure and Architecture"
teaser: "Detailed specification of Aspectow AppMon's 3-tier (Group - Node - App) data model and pre-aggregation architecture."
subheadline: "Aspectow AppMon"
---

Aspectow AppMon is designed to monitor application metrics occurring across large-scale distributed environments in real time, efficiently aggregating and visualizing vast amounts of telemetry data. This document details AppMon's core data model and pre-aggregation architecture optimized for high performance.

## 1. Core Metadata Columns

The event count table identifies data in an optimized format using a composite Primary Key (PK) consisting of `node_id`, `app_id`, `event_id`, and `datetime`, along with a `group_id` index for group-level aggregation.

| Column | Data Type | Description |
| :--- | :--- | :--- |
| **`node_id`** | `varchar(30)` | Identifier for the **Server Node**. Distinguishes physical or logical servers in clustered environments (e.g., `appmon-node1`, `node01`). |
| **`group_id`** | `varchar(30)` | Identifier for the **Node Group**. Groups multiple server nodes logically for unified monitoring (e.g., `group1`, `backend-api`). |
| **`app_id`** | `varchar(30)` | Identifier for the **Application** running on the server. Usually matches context paths (e.g., `jpetstore`, `petclinic`, `demo`). |
| **`event_id`** | `varchar(30)` | Identifier for specific metrics or tracked activities (e.g., `activity`, `session`). |
| **`datetime`** | `datetime` | Data collection timestamp (UTC). |

## 2. Metric Columns and Data Recording Principles

AppMon records metric data using a combination of **Gauge** (state representation) and **Counter** (delta tracking) modes.

| Column | Metric Type | Description | Analogy |
| :--- | :--- | :--- | :--- |
| **`total`** | **Gauge** | Cumulative total count from event initiation to present. | Vehicle **Total Odometer** |
| **`delta`** | **Counter** | Incremental new event occurrences during the last sampling interval (e.g., 5 minutes). | Vehicle **Trip Meter** |
| **`error`** | **Counter** | Incremental error occurrences during the last sampling interval. | Defects occurring in trip |

### Data Recording Example (5-Minute Sampling Interval)

Data accumulates inside the database following this logic:

| Timestamp (datetime) | total (Cumulative) | delta (Interval) | Remarks |
| :--- | :--- | :--- | :--- |
| 10:00:00 | 1,000 | 50 | 50 occurrences between 09:55 and 10:00 |
| 10:05:00 | 1,080 | 80 | 80 occurrences between 10:00 and 10:05 |
| 10:10:00 | 1,110 | 30 | 30 occurrences between 10:05 and 10:10 |

*   **`total`** represents overall cumulative counts, serving as a baseline to maintain integrity across system restarts or data losses.
*   **`delta`** represents real-time rate metrics (such as TPS or requests per minute) visualized on charts.

## 3. Practical Use Cases (Dashboard Charts)

AppMon utilizes this data structure to power two primary dashboard areas:

### A. Activities
Traces execution of Aspectran translets (HTTP requests).
- **Event ID**: Typically named `activity`.
- **Purpose**: Visualizes request throughput (TPS) and error rates. The dashboard **Activities** chart is rendered based on `delta` and `error` values of this event.

### B. Sessions
Traces user session lifecycles.
- **Event ID**: Named `session`.
- **Purpose**: Visualizes active session counts and creation/expiration trends. The dashboard **Sessions** chart presents user traffic and engagement trends.

## 4. Pre-aggregation Architecture

A core optimization technology introduced to maintain consistent dashboard query performance even as millions of raw rows accumulate. Instead of running real-time `GROUP BY` operations over raw logs, pre-summarized data is queried.

### Data Storage Hierarchy (Tiered Storage)

AppMon manages raw and summarized data concurrently during ingestion:

1.  **Raw Layer (`appmon_event_count`)**
    *   Resolution: 5-minute intervals (Default)
    *   Purpose: High-precision real-time trend analysis over the last 1–2 hours (**5min View**).
    *   Index: Composite index on `group_id`, `app_id`, `event_id`, and `datetime` accelerates group-level chart queries.

2.  **Hourly Summary Layer (`appmon_event_count_hourly`)**
    *   Resolution: 1-hour intervals (approx. 1/12th the data size of raw layer)
    *   Aggregation Logic: `total` uses the last cumulative value of the hour; `delta/error` accumulates the sum (`SUM`) of all interval deltas within the hour.
    *   Purpose: Hourly trend analysis over recent days (**Hour View**).

3.  **Last State Management (`appmon_event_count_last`)**
    *   Purpose: Manages the most recent collected metric for each node/app/event to support incremental updates and fast state recovery.

### Performance Impact & Dashboard Mapping

| Dashboard View | Target Table | Query Pattern & Performance Benefit |
| :--- | :--- | :--- |
| **5min View** | `appmon_event_count` | Direct query over recent 100–200 rows (Extremely fast) |
| **Hour View** | `appmon_event_count_hourly` | Queries pre-summarized hourly rows (Eliminates runtime aggregation overhead) |
| **Day/Month/Year View** | `appmon_event_count_hourly` | Groups hourly data into Day/Month/Year. Rows scanned reduced to **8.3% of raw volume** |

### Data Consistency Maintenance
During ingestion, `ON DUPLICATE KEY UPDATE` (or `MERGE`) statements continuously accumulate `delta` and `error` values into the corresponding hourly slot, ensuring real-time dashboard updates without waiting for batch processing.

## 5. Database Schema Scripts

Official database schema scripts for each supported database platform are available at:

*   [H2 Schema Script](https://github.com/aspectran/aspectow/blob/main/appmon/src/main/resources/com/aspectran/aspectow/appmon/config/db/appmon-schema-h2.sql)
*   [MySQL Schema Script](https://github.com/aspectran/aspectow/blob/main/appmon/src/main/resources/com/aspectran/aspectow/appmon/config/db/appmon-schema-mysql.sql)
*   [PostgreSQL Schema Script](https://github.com/aspectran/aspectow/blob/main/appmon/src/main/resources/com/aspectran/aspectow/appmon/config/db/appmon-schema-postgresql.sql)
*   [Oracle Schema Script](https://github.com/aspectran/aspectow/blob/main/appmon/src/main/resources/com/aspectran/aspectow/appmon/config/db/appmon-schema-oracle.sql)
