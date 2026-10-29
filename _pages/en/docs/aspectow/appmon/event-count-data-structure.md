---
title: "AppMon Event Count Data Structure and Architecture"
subheadline: "Aspectow AppMon"
---

Aspectow AppMon is designed to monitor application metrics occurring across large-scale distributed environments in real time, efficiently aggregating and visualizing vast amounts of telemetry data.

This document details AppMon's core data model, the flexible usage of the auxiliary metric (`aux`) column, and the pre-aggregation architecture optimized for high performance.

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

AppMon records and persists metrics by organically combining the **Gauge** approach (representing cumulative state) and the **Counter** approach (representing interval changes). In particular, the auxiliary metric column **`aux`** dynamically changes its semantics based on the event type (`event_id`).

| Column | Metric Type | Description | Analogy |
| :--- | :--- | :--- | :--- |
| **`total`** | **Gauge** | Cumulative total count from event initiation to the present. | Vehicle **Total Odometer** |
| **`delta`** | **Counter** | Incremental new event occurrences during the last sampling interval (e.g., 5 minutes). | Vehicle **Trip Meter** |
| **`aux`** | **Composite (Counter / Gauge)** | An **Auxiliary Metric** flexibly utilized according to the event type.<br>• `activity`: **Error occurrences (Errors)** during the interval (Counter)<br>• `session`: Current **Active Users** snapshot at the collection timestamp (Gauge) | • Number of defects (Trip defects)<br>• Current passenger count (Snapshot) |

### Background Behind the `aux` Column
In earlier versions of AppMon, the schema contained an `error` column dedicated exclusively to recording execution errors during translet requests. However, user session (`session`) events inherently do not produce errors, leaving the column unused and vacant.
To resolve this inefficiency, the column was renamed to the more generic `aux` (Auxiliary Metric). For session events, **Active Users (the number of concurrently logged-in active users)** are recorded directly into this column without creating separate tables or introducing redundant event types. This architectural decision preserves a simple, unified table schema while maximizing monitoring telemetry value.

### Data Collection and Ingestion Examples (5-Minute Sampling Interval)

Inside the database, data is recorded according to the event type as follows:

#### 1) Activity Events (`event_id = 'activity'`)
For `activity` events, the table tracks the cumulative transaction count, request throughput per 5-minute interval, and the number of errors encountered within that window.

| Timestamp (datetime) | total (Cumulative) | delta (Interval Requests) | aux (Interval Errors) | Remarks |
| :--- | :--- | :--- | :--- | :--- |
| 10:00:00 | 1,000 | 50 | 0 | 50 requests processed between 09:55 and 10:00, 0 errors |
| 10:05:00 | 1,080 | 80 | 2 | 80 requests processed between 10:00 and 10:05, 2 errors occurred |
| 10:10:00 | 1,110 | 30 | 0 | 30 requests processed between 10:05 and 10:10, 0 errors |

*   **`total`**: Cumulative processed volume serving as a baseline to maintain volume integrity across system restarts or temporary network delays.
*   **`delta`**: Interval throughput used as the core metric for calculating real-time TPS and requests per minute.
*   **`aux`**: Errors occurred during the interval, allowing instant identification of fault timing on dashboard charts.

#### 2) Session Events (`event_id = 'session'`)
For `session` events, newly created sessions and currently active users residing in the session store are tracked simultaneously.

| Timestamp (datetime) | total (Cumulative) | delta (New Sessions) | aux (Active Users) | Remarks |
| :--- | :--- | :--- | :--- | :--- |
| 10:00:00 | 200 | 15 | 42 | 15 new sessions created over 5 min, 42 active users at sample time |
| 10:05:00 | 225 | 25 | 58 | 25 new sessions created over 5 min, 58 active users at sample time |
| 10:10:00 | 235 | 10 | 50 | 10 new sessions created over 5 min, 50 active users at sample time |

*   **`total`**: Cumulative total sessions created since application startup.
*   **`delta`**: Number of newly created sessions during the last 5 minutes.
*   **`aux`**: Point-in-time snapshot of active users currently maintained within the session store.

## 3. Practical Use Cases and Dashboard Chart Visualization

Based on this data model, the AppMon dashboard provides charts that allow intuitive cross-analysis of activity and session metrics.

### A. Activities
Monitors execution volume and operational stability of Aspectran translets and web requests.
*   **Event ID**: `activity`
*   **Metric Mapping**:
    *   Primary Metric: `delta` (Request Throughput, Activities)
    *   Auxiliary Metric: `aux` (Error Occurrences, Errors)
*   **Visualization**:
    *   Rendered as a **Stacked Chart** where error counts (red bars/areas) stack directly on top of request volumes (blue bars/areas).
    *   In real-time line charts, x-axis grid lines automatically highlight in red (`#ff6384`) at timestamps where errors occurred, making incident periods instantly recognizable.

### B. Sessions
Correlates incoming user traffic with the actual pool of concurrent users remaining in the system.
*   **Event ID**: `session`
*   **Metric Mapping**:
    *   Primary Metric: `delta` (Newly Created Sessions, Sessions)
    *   Auxiliary Metric: `aux` (**Active Users** in real-time view, **Peak Users** in Hour/Day/Month/Year views)
*   **Visualization**:
    *   Because newly created session counts (flow/throughput) and active user counts (stock/concurrent pool) represent fundamentally different physical quantities, they are rendered as an **Unstacked Combo Chart** to prevent scale distortion.
    *   New session counts are presented as bars or areas (green palette), while active user counts (Active Users / Peak Users) are superimposed as a clear purple line chart (`#9b59b6`).
    *   This enables operators to observe how concurrent user levels respond to sudden spikes in new session arrivals within a single, unified chart.

## 4. Pre-aggregation Architecture

To guarantee millisecond-level dashboard query latency even as hundreds of millions of raw rows accumulate over time, an advanced pre-aggregation architecture is employed.

### Data Storage Hierarchy (Tiered Storage)

AppMon updates both raw data and hourly summaries simultaneously during ingestion:

1.  **Raw Layer (`appmon_event_count`)**
    *   Resolution: 5-minute intervals (Default)
    *   Purpose: High-precision real-time trend analysis over the last 1–2 hours (**5min View**).
    *   Index: Composite index on `group_id`, `app_id`, `event_id`, and `datetime` accelerates node- and group-level chart queries.

2.  **Hourly Summary Layer (`appmon_event_count_hourly`)**
    *   Resolution: 1-hour intervals (reduces data volume to approx. 1/12th of raw data)
    *   Aggregation Logic:
        *   `total`: The final cumulative value of that hour.
        *   `delta`: The sum (`SUM`) of all 5-minute interval deltas within that hour.
        *   `aux`: Intelligently branched based on event semantics:
            *   `activity`: The sum (`SUM`) of all error occurrences within that hour.
            *   `session`: The **peak concurrent users (Peak Active Users)** recorded during that hour (`GREATEST(aux, #{aux})`).
    *   Purpose: Hourly trend analysis over recent days and weeks (**Hour View**).

3.  **Last State Management (`appmon_event_count_last`)**
    *   Purpose: Holds the most recent metric snapshot for each node, application, and event, guaranteeing continuity across process restarts and serving as the baseline for incremental delta calculations.

### Differentiating Aggregation Strategies by Metric Characteristics (Counter vs Gauge)

A frequent pitfall in metric telemetry is treating a **Gauge (momentary state)** as a **Counter (delta volume)** by applying a simple `SUM` aggregation:
*   For instance, if active users remained at 50 throughout an entire hour (measured every 5 minutes), the actual average and peak user count for that hour is 50.
*   If `SUM` were applied, all 12 slots would be summed together, erroneously reporting that the system had 600 active users during that hour.

To eliminate this statistical distortion, AppMon employs database upsert operations and MyBatis query strategies that branch logic dynamically based on `event_id`:

#### 1) Hourly Summary Upsert Logic
When a new 5-minute metric arrives, the `ON DUPLICATE KEY UPDATE` (or `MERGE`) statement updates `aux` as follows:
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

#### 2) Long-Term Trend Querying (Day / Month / Year View)
When aggregating hourly summaries into daily, monthly, or yearly views:
```sql
SELECT
    group_id,
    app_id,
    event_id,
    <DATE_FORMAT_FUNCTION>(datetime) AS datetime,
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
    group_id, app_id, event_id, <DATE_FORMAT_FUNCTION>(datetime)
ORDER BY
    datetime ASC
```
With this query strategy, `activity` events accurately calculate the **total error occurrences (Errors)**, while `session` events accurately compute the **highest concurrent active user level (Peak Users)** across each day, month, or year.

### Performance Impact & Dashboard Mapping

| Dashboard View | Target Table | Query Pattern & Performance Benefit |
| :--- | :--- | :--- |
| **5min View** | `appmon_event_count` | Direct, indexed scan over recent 100–200 rows |
| **Hour View** | `appmon_event_count_hourly` | Directly queries pre-summarized 1-hour rows (eliminates runtime aggregation) |
| **Day/Month/Year View** | `appmon_event_count_hourly` | Groups hourly records into Day/Month/Year. Rows scanned reduced to **approx. 8.3% of raw volume** |

## 5. Database Schema Scripts

Official database schema and index definition scripts for each supported database platform are available at:

*   [H2 Schema Script](https://github.com/aspectran/aspectow/blob/main/appmon/src/main/resources/com/aspectran/aspectow/appmon/config/db/appmon-schema-h2.sql)
*   [MySQL Schema Script](https://github.com/aspectran/aspectow/blob/main/appmon/src/main/resources/com/aspectran/aspectow/appmon/config/db/appmon-schema-mysql.sql)
*   [PostgreSQL Schema Script](https://github.com/aspectran/aspectow/blob/main/appmon/src/main/resources/com/aspectran/aspectow/appmon/config/db/appmon-schema-postgresql.sql)
*   [Oracle Schema Script](https://github.com/aspectran/aspectow/blob/main/appmon/src/main/resources/com/aspectran/aspectow/appmon/config/db/appmon-schema-oracle.sql)
