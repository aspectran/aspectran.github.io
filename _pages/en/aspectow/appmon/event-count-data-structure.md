---
format: plate solid article
title: AppMon Event Count Data Structure and Architecture
sidebar: toc
---

{% capture info_message %}
Aspectow AppMon uses a data structure that combines **Gauge** (state) and **Counter** (change) patterns to efficiently track and visualize events occurring in large-scale distributed environments.
{% endcapture %}
{% include alert.liquid info=info_message %}

## 1. Key Data Column Descriptions

The core columns of the event count table (`appmon_event_count`) serve the following roles:

| Column | Type | Description | Analogy |
| :--- | :--- | :--- | :--- |
| **`total`** | **Gauge** (State) | The **cumulative total count** from the moment the event began to the present. | A car's **Total Odometer** |
| **`delta`** | **Counter** (Change) | The **number of new events** that occurred during the last collection interval (e.g., 5 minutes). | A car's **Trip Meter** |
| **`error`** | **Counter** (Change) | The **number of error events** that occurred during the last collection interval. | Fault occurrences within the trip |

### Example Data Recording (Based on a 5-minute collection interval)

| Time | total (Cumulative) | delta (Interval Volume) | Remarks |
| :--- | :--- | :--- | :--- |
| 10:00 | 1,000 | 50 | 50 occurrences between 09:55~10:00 |
| 10:05 | 1,080 | 80 | 80 occurrences between 10:00~10:05 |
| 10:10 | 1,110 | 30 | 30 occurrences between 10:05~10:10 |

*   **`total`** serves as a baseline for grasping the overall scale of the system and restoring consistency in case of data loss.
*   **`delta`** is used for visualizing real-time rates of change, such as TPS (Transactions Per Second) or requests per minute, in charts.

---

## 2. Pre-aggregation Architecture

This structure was introduced to guarantee fast query performance even in environments where millions of rows are accumulated, especially with limited resources like Oracle Cloud Free Tier.

### Table Configuration and Purpose

AppMon simultaneously records (or aggregates) data into raw and summary tables at the point of collection.

1.  **`appmon_event_count` (Raw Data)**
    *   Stores detailed data in the default 5-minute interval.
    *   **Purpose**: Real-time fine-grained changes (5min View) within the last 1–2 hours.

2.  **`appmon_event_count_hourly` (Hourly Summary)**
    *   Stores data truncated by hour.
    *   `total` is the last value (`MAX`) of the hour, while `delta/error` is the total sum (`SUM`) within the hour.
    *   **Purpose**: Hourly chart (byHour View) retrieval.

3.  **`appmon_event_count_daily` (Daily Summary)**
    *   Stores data truncated by day.
    *   **Purpose**: Daily, monthly, and yearly chart (byDay, byMonth, byYear View) retrieval.

### Dashboard Query Optimization Mapping

After implementing pre-aggregation, each query references the table optimized for the data volume.

| Dashboard View | Reference Table | Performance Improvement |
| :--- | :--- | :--- |
| **5min View** | `appmon_event_count` | Consistent with the previous behavior (Focus on recent data). |
| **Hour View** | `appmon_event_count_hourly` | Elimination of on-the-fly GROUP BY (Extremely fast). |
| **Day View** | `appmon_event_count_daily` | Elimination of on-the-fly GROUP BY (**Fastest performance**). |
| **Month/Year View** | `appmon_event_count_daily` | Target row count for processing **reduced to 1/288th**. |

Through this architecture, AppMon ensures consistently fast response times regardless of data scale, at the cost of using slightly more storage space.
