---
subheadline: Releases
title:  'Aspectow AppMon 2.0.0 and 2.1.0 Released: Faster and More Flexible!'
categories:
  - news
tags:
  - Release
published: true
---

We are excited to announce the simultaneous release of two important new versions of Aspectow AppMon: **2.0.0** and **2.1.0**.

These releases fundamentally innovate AppMon's architecture and add new features focused on user convenience.
<!--more-->
Version 2.0.0 marks a rebirth, built entirely on the Aspectran framework for maximized performance, while version 2.1.0 takes configuration flexibility and code quality to the next level.

## Major Architectural Change: A Complete Transition to Aspectran 9.0 (v2.0.0)

Aspectow AppMon 2.0.0 has been re-engineered from the ground up on **Aspectran 9.0**. This move modernizes the core dependencies and provides full support for the latest Java 21 environment, delivering the following innovations:

*   **Core Framework Change**: Adopts Aspectran 9.0 as the core framework to provide a lighter and faster application monitoring environment.
*   **Performance and Stability Improvements**: Significantly enhances overall stability and performance through internal logic optimization and improved memory usage.
*   **Improved Real-time Dashboard**: An improved UI/UX allows for more intuitive understanding of the application's status.
*   **Enhanced Distributed Tracing**: Better capabilities for more accurately tracking and analyzing request flows in microservice architectures.

### 💥 Critically Important: Java 21 or Higher is Required!

Following the update to Aspectran 9.0, AppMon 2.0.0 and later versions require **Java 21 or higher**. It will not run on older Java versions, so please be sure to upgrade your environment before use.

## New Features & Enhancements (v2.1.0)

Version 2.1.0 focuses on improving configuration flexibility and the developer experience.

*   ✨ **Added Configurable Counter Persistence Interval**
    - You can now configure the interval at which event counter data is saved to the database by adding the `counterPersistInterval` property (in minutes) to the `appmon-config.apon` file. (Default: 5 minutes)
    - This allows for flexible control over data aggregation volume and system load.

*   📝 **Code Quality and Documentation Improvements**
    - **Overall Javadoc API Improvement**: The Javadoc comments for all classes and methods have been comprehensively improved, significantly enhancing code readability and maintainability.
    - **Improved Class Naming Convention**: Controller classes have been renamed from `...Action` to `...Activity` to align with Aspectran's naming conventions, improving code consistency and clarity.
