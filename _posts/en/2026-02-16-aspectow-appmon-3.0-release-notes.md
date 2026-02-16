---
subheadline: Releases
title: "Aspectow AppMon 3.0 Release Notes"
categories:
  - news
tags:
  - Release
published: true
---

This release is a major update featuring the new "Load Previous Logs" functionality, frontend optimizations for high-traffic environments, and the introduction of the "Framework Anatomy" feature.
<!--more-->

### ✨ New Features

*   **Load Previous Logs**: Added the ability to load previous logs in reverse order based on scroll position in console boxes.
*   **Archived Log Support**: Enhanced `LogExporter` to seamlessly retrieve older log lines from archived files after rotation.
*   **Seamless Session Synchronization**: Implemented full synchronization and resolved data inconsistencies when switching between browser tabs.
*   **Framework Anatomy**: Introduced a new feature to analyze and visualize the internal structure of the Aspectran framework.
*   **Enhanced Token Authentication**: Improved security by switching to self-session tokens using HttpOnly cookies.

### 🚀 Improvements

*   **High-Traffic Optimization**: Converted all frontend components to ES6 classes. Notably, the traffic visualization engine was completely rewritten from the resource-intensive CSS animation method to a high-performance HTML5 Canvas-based engine using Delta-time, ensuring minimal CPU load and smooth animations even during massive traffic spikes.
*   **Enhanced Message Protocol**: Introduced sub-types for better extensibility and improved data delivery efficiency.
*   **Polished Dashboard UI/UX**: Implemented a new dashboard main page and added chart loading indicators and a full-screen console mode.

### 🛠️ Bug Fixes

*   **Data Consistency Fixes**: Fixed an issue where data could become stale when switching between multiple browser tabs.
