---
subheadline: Releases
title: "Aspectow AppMon 3.2 Release Notes"
categories:
  - news
tags:
  - Release
published: true
---

This release focuses on adding PostgreSQL support, enhancing the flexibility of the persistence layer, improving chart data accuracy through refined aggregation logic, and a comprehensive overhaul of the configuration structure and operational scripts to strengthen the project's identity.
<!--more-->

### ✨ New Features

*   **PostgreSQL Support and Optimization**: Added a standard schema for PostgreSQL environments (e.g., Supabase) and implemented optimized queries using `date_trunc` and `ON CONFLICT` for efficient time-series aggregation and atomic upserts.
*   **Enhanced Persistence Architecture**: Refactored `EventCountMapper` and its implementation to support bean overriding, allowing external projects to provide custom persistence logic without modifying the core library.

### 🚀 Improvements

*   **Enhanced Chart Data Accuracy**: Removed the daily aggregation table (`appmon_event_count_daily`) and switched entirely to hourly source data for all aggregated charts (Daily, Monthly, Yearly). Applied `zoneOffset` to all aggregations to ensure data is correctly grouped according to the user's local time zone, eliminating discrepancies caused by UTC boundaries.
*   **Configuration Refactoring and New Naming Convention**: Renamed the configuration resource directory from `context` to `config` and transitioned Spring-style `*-context.xml` files to concise, functional names like `database.xml` and `scheduler.xml` to reinforce Aspectran's rule-based identity.
*   **Consolidated Service Management and Script Refinement**: Added `service.sh` as a unified wrapper for `systemctl` and refined script logic for better process management and automatic lock cleanup. Updated shell scripts to display environment information only when the `--debug` flag is provided, reducing console noise.
*   **Updated Dependency Versions**: Updated key plugin versions including `maven-resources-plugin` (3.5.0), `maven-surefire-plugin` (3.5.5), and `maven-bundle-plugin` (6.0.2) to ensure build and test stability.
