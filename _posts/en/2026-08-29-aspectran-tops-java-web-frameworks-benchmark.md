---
subheadline: Benchmark
title: "Aspectran Ranks #1 Among Java Web Frameworks in Global Benchmark"
categories:
  - news
tags: [Benchmark, Performance, Java, Aspectran, Undertow]
published: true
---

Aspectran has officially been registered and evaluated in the open-source **[Web Frameworks Benchmark](https://github.com/the-benchmarker/web-frameworks)** project.

In the latest benchmark results released today, Aspectran achieved **#1 in Average Throughput (Average RPS)** and **#1 across Concurrency 64 and 256** among all tested Java web frameworks.
<!--more-->

Competing against 353 web frameworks across various programming languages (including native languages like C++, Rust, and Go), Aspectran secured a position in the **top 12% globally (Rank 44 / 353)**, demonstrating industry-leading performance.

## 📊 Web Frameworks Benchmark Overview

The [Web Frameworks Benchmark](https://github.com/the-benchmarker/web-frameworks) is a reputable open-source benchmarking suite that measures raw HTTP request handling throughput under standardized, isolated container environments.

* **Tested Endpoints**:
    * `GET /` (Plain root request)
    * `GET /user/${id}` (Route parameter extraction and plain text response)
    * `POST /user` (Basic payload handling)
* **Tested Concurrency Levels**: 64, 256, and 512 concurrent connections
* **Runtime Environment**: Java 21, Linux isolated container

## 🏆 Java Web Frameworks Benchmark Results

Below are the detailed performance metrics for all 21 Java web frameworks running on Java 21, sorted by Average RPS.

| Rank | Framework | Concurrency 64 (req/s) | Concurrency 256 (req/s) | Concurrency 512 (req/s) | Average RPS | Category / Note |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **1** | **Aspectran (9.6)** | **34,305** (#1) | **36,482** (#1) | **37,807** | **36,198.0** | **Overall #1 in Java** |
| 2 | ActiveJ (5.5) | 33,245 | 33,117 | 41,749 | 36,037.0 | Async I/O Specialized |
| 3 | Undertow (2.4) | 28,925 | 34,351 | 43,948 | 35,741.3 | Base HTTP Engine |
| 4 | Light-4j (2.2) | 27,983 | 32,465 | 42,111 | 34,186.3 | Microservices Framework |
| 5 | Rapidoid (5.5) | 28,783 | 31,498 | 41,030 | 33,770.3 | High-Speed HTTP Server |
| 6 | Spark (2.9) | 32,042 | 32,421 | 33,004 | 32,489.0 | Lightweight Web Framework |
| 7 | Vert.x (5.1) | 16,455 | 31,122 | 42,948 | 30,175.0 | Event-Driven Reactive |
| 8 | Jooby (4.5) | 17,582 | 31,041 | 40,947 | 29,856.7 | Modular Micro Web |
| 9 | Vertx4Web (5.1) | 14,985 | 30,812 | 42,640 | 29,479.0 | Vert.x Web Module |
| 10 | Restheart (9.7) | 11,613 | 31,481 | 41,362 | 28,152.0 | REST API Server |
| 11 | Quarkus (3.37) | 5,989 | 31,882 | 41,917 | 26,596.0 | Cloud-Native Stack |
| 12 | Micronaut (5) | 2,550 | 30,758 | 38,314 | 23,874.0 | Microservices Framework |
| 13 | Spring (4.1) | 2,224 | 27,133 | 22,826 | 17,394.3 | Enterprise Standard Stack |
| 14 | Spring WebFlux (4.1) | 2,253 | 23,733 | 19,133 | 15,039.7 | Reactive Web Stack |
| 15 | Javalin (7.2) | 4,278 | 17,133 | 14,599 | 12,003.3 | Lightweight REST Framework |
| 16 | Struts2 (7) | 11,141 | 11,293 | 11,378 | 11,270.7 | Traditional MVC Framework |
| 17 | Jersey 3 (Grizzly2) | 2,224 | 7,886 | 8,334 | 6,148.0 | JAX-RS Reference |
| 18 | Jersey (Grizzly2) | 2,238 | 7,149 | 7,214 | 5,533.7 | JAX-RS Reference |
| 19 | Armeria (1.41) | 1,322 | 1,664 | 1,658 | 1,548.0 | Async RPC / REST |
| 20 | Helidon SE (4.5) | 1,285 | 1,672 | 1,663 | 1,540.0 | Microservices Framework |
| 21 | Blade (2.1) | 1,318 | 1,656 | 1,643 | 1,539.0 | Lightweight MVC Framework |

{% include image.liquid src="/images/news/web-frameworks-benchmark-chart-20260829.png" alt="Web Frameworks Benchmark - Aspectran vs Spring vs Spring WebFlux" %}

## 🌟 Key Performance Highlights

### 1. Superior Immediate Responsiveness from Initial Load
While many enterprise frameworks experienced cold starts or thread pool allocation bottlenecks at 64 concurrency (yielding 2,000–6,000 req/s), Aspectran delivered **34,305 req/s immediately at 64 concurrency**, outperforming all other Java frameworks from the very first test tier.

As concurrency increased to 256 and 512, throughput scaled steadily to **36,482 req/s** and **37,807 req/s**, exhibiting rock-solid stability without request latency spikes.

### 2. Synergy Exceeding the Underlying Undertow Engine
Aspectran runs on embedded Undertow via `aspectran-with-undertow`. While high-level application frameworks typically introduce latency over the raw server engine, Aspectran posted an average throughput of **36,198.0 req/s**, surpassing raw Undertow's **35,741.3 req/s**. This demonstrates that Aspectran's `LightRequestHandlerFactory` and translet execution pipeline introduce zero noticeable runtime overhead and extract maximum capability from the underlying NIO engine.

### 3. More Than Double the Throughput of Mainstream Frameworks
Aspectran delivered **more than 2.0x to 2.4x the throughput** of Spring (17,394 req/s) and Spring WebFlux (15,039 req/s), and **1.3x to 1.5x higher throughput** than cloud-native stacks such as Quarkus (26,596 req/s) and Micronaut (23,874 req/s).

## 💡 How Aspectran Delivers Both Performance and Enterprise Capability

In web framework design, it is often assumed that **"comprehensive enterprise frameworks are inherently heavy, and fast frameworks are merely barebones routing libraries."**

Aspectran was purposefully architected from its inception to break this compromise: delivering **deep enterprise-grade capabilities alongside raw, engine-level throughput**.

### 1. Translet-Based Shortest Path Execution
At the core of Aspectran is the **Translet**, an execution unit that links request reception, parameter mapping, action execution, transformation, and response rendering in a direct, streamlined pipeline. By removing multi-layered filter chains and redundant object allocations, requests travel through the shortest execution path.

### 2. Zero-Overhead ActivityContext & Lightweight IoC/AOP
Rather than incurring continuous runtime reflection penalties and heavy dynamic proxy lookup costs, Aspectran operates on a pre-compiled, optimized `ActivityContext`. Enterprise features such as IoC/DI and non-invasive AOP are applied with minimal memory allocation during active request cycles.

### 3. A Full-Featured Enterprise Framework, Not a Stripped-Down Router
What makes this achievement particularly meaningful is that Aspectran was not stripped of features for this benchmark. Aspectran competed with its complete runtime stack—including its **full IoC/DI container, declarative transaction management, task scheduling (Scheduler), background daemons (Daemon), session clustering, APON data serialization, and multi-format template engines**.

## 🎯 Looking Forward

These benchmark results validate years of rigorous architectural refinement and optimization.

Aspectran will continue to evolve, empowering developers to build high-throughput cloud-native services and mission-critical enterprise systems with uncompromising performance and high developer productivity.

You can inspect Aspectran's benchmark setup and configuration files directly in the [Web Frameworks GitHub Repository](https://github.com/the-benchmarker/web-frameworks/tree/master/java/aspectran).
