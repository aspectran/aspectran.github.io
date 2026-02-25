---
subheadline: Releases
title: "Aspectow AppMon 3.1 Release Notes"
categories:
  - news
tags:
  - Release
published: true
---

This release focuses on improving database performance through native date-time handling, optimizing aggregation queries, and enhancing frontend maintainability by refactoring the chart engine.
<!--more-->

### 🚀 Improvements

*   **Native Date-Time Support**: Migrated the core `datetime` column from `varchar(12)` to native date types (`DATETIME`, `TIMESTAMP`, or `DATE` depending on the DB). The Java model now uses `LocalDateTime`, eliminating string conversion overhead and improving precision.
*   **Pre-aggregation for Superior Dashboard Performance**: Introduced `hourly` and `daily` summary tables to store pre-aggregated event counts. This architectural shift drastically reduces the overhead of on-the-fly grouping, providing near-instantaneous dashboard response times even with millions of raw event records.
*   **Decoupled Chart Component**: Refactored the dashboard by moving chart-specific rendering and logic from `DashboardViewer` into a standalone `dashboard-chart.js` component, improving modularity and code clarity.
