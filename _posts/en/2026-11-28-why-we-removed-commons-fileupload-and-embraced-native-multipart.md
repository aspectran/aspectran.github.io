---
subheadline: Case Study
title: "Why We Dropped Apache Commons FileUpload: Building a Zero-Dependency Multipart Architecture with Servlet Standards and Netty Native Codecs"
teaser: "A deep dive into how Aspectran eliminated the 20-year-old legacy dependencies commons-fileupload and commons-io, modernizing into a lightweight, resilient, zero-dependency multipart architecture powered by Jakarta Servlet 6.0 standards and Netty native codecs."
categories:
  - architecture
tags: [Aspectran, Architecture, File Upload, Servlet, Netty, Zero Dependency, Jakarta EE, Case Study, Refactoring]
published: true
mermaid: true
---

{% capture info_message %}
**Case Study:** This article details the technical background and design decisions behind completely removing the long-standing `commons-fileupload` and `commons-io` dependencies from Aspectran's web servlet module (`aspectran-web-servlet`), transitioning to a **purely native, zero-dependency multipart architecture** centered on the standard Jakarta Servlet 6.0 `Part` API and Netty asynchronous codecs.
{% endcapture %}
{% include alert.liquid info=info_message %}

One of the most dangerous temptations in software framework engineering is **"leaving things as they are simply because they still work."** As the Java web ecosystem underwent a monumental paradigm shift from Java EE 8 to Jakarta EE 10 (Servlet 6.0), and as virtual threads and non-blocking asynchronous runtimes (such as Netty) became mainstream, passively maintaining decades-old legacy third-party libraries incurs accumulating technical debt and introduces unpredictable runtime hazards.

During a recent architectural review of Aspectran's multipart file upload subsystem, we confronted **Apache Commons FileUpload**, which had remained deeply rooted in the codebase for years.

Following in-depth bytecode analysis, an assessment of library ecosystem trends, and careful architectural evaluation, we made the definitive decision: **completely drop Commons FileUpload and its associated dependencies from Aspectran.**

In this article, we share why Aspectran retired this 20-year-old library, how our findings mirror the decision made by the Spring Framework 6 team, and how we established a **zero-dependency file upload architecture** across both servlet and Netty runtimes without requiring a single byte of external third-party libraries.
<!--more-->

## 1. The Genesis: The Ghost of `javax` Lurking in Jakarta Servlet 6.0

Aspectran 9.x is a modern, high-performance application framework with first-class support for Jakarta Servlet 6.0 (Jakarta EE 10) and Java 21+. However, inside the `pom.xml` of the file upload module, `aspectran-web-servlet`, the following dependencies still lingered:

```xml
<dependency>
    <groupId>commons-fileupload</groupId>
    <artifactId>commons-fileupload</artifactId>
    <version>1.6.0</version>
    <optional>true</optional>
</dependency>
<dependency>
    <groupId>commons-io</groupId>
    <artifactId>commons-io</artifactId>
    <version>2.22.0</version>
</dependency>
```

On the surface, using version `1.6.0` seemed benign because it was the latest release in the 1.x line. However, inspecting the library at the bytecode level revealed a severe architectural contradiction.

### 1.1 Disassembling the Bytecode: Uncovering the Truth

Using `javap` to disassemble the core servlet classes inside `commons-fileupload-1.6.0.jar` laid bare the underlying reality:

```java
// javap -cp commons-fileupload-1.6.0.jar org.apache.commons.fileupload.servlet.ServletFileUpload
public class org.apache.commons.fileupload.servlet.ServletFileUpload extends org.apache.commons.fileupload.FileUpload {
    public static final boolean isMultipartContent(javax.servlet.http.HttpServletRequest);
    public FileItemIterator getItemIterator(javax.servlet.http.HttpServletRequest) ...;
    public Map<String, List<FileItem>> parseParameterMap(javax.servlet.http.HttpServletRequest) ...;
    public List<FileItem> parseRequest(javax.servlet.http.HttpServletRequest) ...;
}

// javap -cp commons-fileupload-1.6.0.jar org.apache.commons.fileupload.servlet.FileCleanerCleanup
public class org.apache.commons.fileupload.servlet.FileCleanerCleanup implements javax.servlet.ServletContextListener {
    public static FileCleaningTracker getFileCleaningTracker(javax.servlet.ServletContext);
    public void contextDestroyed(javax.servlet.ServletContextEvent);
    public void contextInitialized(javax.servlet.ServletContextEvent);
}
```

The Apache Commons FileUpload 1.x line (including 1.6.0) maintained its early-2000s architectural foundation, with **all servlet bindings tightly coupled to the legacy `javax.servlet` package**.

### 1.2 How Did It Run Without Runtime Exceptions?

In a pure Jakarta EE 10 runtime, referencing `javax.servlet` classes typically triggers an immediate `NoClassDefFoundError`. The reason Aspectran's `CommonsMultipartFormDataParser` managed to avoid this runtime error was a deliberate workaround inside Aspectran's adapter layer:

```java
// Aspectran's historical bypass mechanism
FileUpload upload = new ServletFileUpload(factory);
RequestContext requestContext = new CommonsRequestContext(requestAdapter);
fileItemListMap = upload.parseParameterMap(requestContext); // Passes custom RequestContext instead of HttpServletRequest
```

Aspectran never called `ServletFileUpload.parseRequest(request)` with an `HttpServletRequest` argument. Instead, it implemented a custom `CommonsRequestContext` that read headers and input streams directly from Aspectran's `RequestAdapter`, dispatching to the superclass method `upload.parseParameterMap(RequestContext)`.

In other words, **the JVM avoided linking `javax.servlet.http.HttpServletRequest` bytecode purely by circumstance**. The library itself remained a ticking time bomb tied to the deprecated `javax` namespace.

## 2. The 2.x Dilemma: Was Commons FileUpload 2.x a Viable Solution?

The initial alternative we considered was upgrading to **Apache Commons FileUpload 2.x**, which claims official support for the Jakarta EE namespace:

```xml
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-fileupload2-jakarta-servlet6</artifactId>
    <version>2.0.0-M5</version>
</dependency>
```

However, a thorough evaluation quickly brought critical shortcomings and architectural friction to light.

### 2.1 An Ecosystem Stalled in Milestones
Commons FileUpload 2.x has remained in **milestone status (`2.0.0-M1` through `2.0.0-M5`) since spring 2022, without a final General Availability (GA) release**.

For an enterprise-grade framework responsible for mission-critical production workloads, adopting an unfinalized milestone library whose internal Builder methods and generic type signatures could change at any moment was an unacceptable risk.

### 2.2 Sweeping Breaking Changes
Version 2.x was not a simple repackaging from `javax` to `jakarta`. The entire library was redesigned around the Builder pattern and generic types:

```java
// 1.x: Direct constructor instantiation
DiskFileItemFactory factory = new DiskFileItemFactory();
FileUpload upload = new ServletFileUpload(factory);

// 2.x: Verbose Builder pattern and generic declarations
DiskFileItemFactory factory = DiskFileItemFactory.builder()
        .setBufferSize(maxInMemorySize)
        .setPath(tempPath)
        .get();
JakartaServletFileUpload<DiskFileItem, DiskFileItemFactory> upload =
        new JakartaServletFileUpload<>(factory);
```

Adopting 2.x required extensive rewrites across `CommonsMultipartFormDataParser`, `CommonsMultipartFileParameter`, and `CommonsRequestContext`.

This brought us to a fundamental engineering question:

> **"Does it make architectural sense to invest significant engineering effort into supporting a third-party library that has remained in milestone status for years?"**

## 3. Standing on the Shoulders of Giants: Lessons from Spring Framework 6

As we evaluated our options, we found clear affirmation in the decisions made by the **Spring Framework 6.0 (Spring Boot 3.0)** team.

For two decades, Spring offered `CommonsMultipartResolver` as its cornerstone multipart resolver. However, when transitioning to Jakarta EE 9/10, the Spring team **completely removed `CommonsMultipartResolver`**:

```
[Spring Framework 6.0 Migration Guide]
- Removed org.springframework.web.multipart.commons.CommonsMultipartResolver
- In Servlet environments, StandardServletMultipartResolver is the sole recommended mechanism.
```

The Spring team's rationale was unmistakable:

1. **Maturity of Servlet Standard APIs**: The standard multipart API (`HttpServletRequest.getParts()`, `Part`) introduced in Servlet 3.0 (2009) had matured over 15 years, becoming deeply integrated and optimized across all major servlet containers (Tomcat 10+, Jetty 12+, Undertow, etc.).
2. **Absence of Practical Benefit**: When the underlying servlet container already processes multipart payloads at the native I/O layer with maximum performance, wrapping external libraries only adds redundant memory buffers and layer overhead.
3. **The 2.x Milestone Gridlock**: Just as when Spring 6 launched in late 2022, Commons FileUpload 2.x has still not reached a GA release.

Spring's decision confirmed that eliminating legacy external parsers in favor of platform standards is the modern industry best practice.

## 4. The Illusion of the In-Memory Parser: OOM Risks and `fileSizeThreshold`

In evaluating Commons FileUpload, we also re-examined **`InMemoryMultipartFormDataParser`**.

### 4.1 Historical Context of the In-Memory Parser
In the early days of PaaS (such as Google App Engine Standard), local filesystem writes—including `/tmp`—were strictly forbidden. Because temporary files could not be staged to disk, an in-memory parser buffering the entire upload stream into byte arrays (`byte[]`) in JVM heap memory was necessary.

However, inspecting its implementation revealed that it was not a standalone parser; it was simply a custom extension of Commons FileUpload's `FileItemFactory`:

```java
// Internal structure of InMemoryMultipartFormDataParser
InMemoryFileItemFactory factory = new InMemoryFileItemFactory();
FileUpload upload = new ServletFileUpload(factory); // Still strictly dependent on Commons FileUpload!
```

Dropping `commons-fileupload` naturally meant `InMemoryMultipartFormDataParser` could no longer exist in its current form.

### 4.2 Modern Cloud Infrastructure and Out-Of-Memory (OOM) Hazards
Today, modern cloud platforms—AWS Lambda, GCP Cloud Run, Kubernetes, and Docker containers—universally provide writable `/tmp` directories or ultra-fast `tmpfs` RAM disks. Environments that prohibit disk writes are a relic of the past.

Furthermore, unconditionally loading uploaded files into heap memory is an **operational anti-pattern**. If multiple clients upload 10–20 MB files concurrently, the JVM heap is rapidly exhausted, triggering catastrophic **Out Of Memory (OOM) crashes**.

### 4.3 True In-Memory Processing via the Servlet Standard `fileSizeThreshold`
Crucially, **the standard Servlet specification (`MultipartConfigElement`) already provides first-class in-memory processing**:

```
[Incoming Multipart File Stream]
               │
               ▼
      [Size Threshold Check]
      /                    \
     ▼                      ▼
[Below Threshold]      [Above Threshold]
     │                      │
     ▼                      ▼
[Retained in RAM]      [Spill-over to Disk Temp File]
(Fast In-Memory)       (Prevents OOM / Ensures Stability)
```

The Servlet standard **`fileSizeThreshold`** (represented in Aspectran as **`maxInMemorySize`**) provides an optimal hybrid design: files below the threshold remain in memory without disk I/O, while oversized files spill over to temporary disk storage to safeguard the JVM.

If a specific endpoint (e.g., icons or thumbnails) requires bypassing disk I/O entirely, developers can simply configure `maxInMemorySize` equal to `maxFileSize` (e.g., 500 KB). The standard parser will process the upload 100% in memory without writing to disk.

Thus, maintaining a separate `InMemoryMultipartFormDataParser` that carries OOM hazards and external library baggage was no longer justified.

## 5. The New Architecture: Zero-Dependency Native Multipart Processing

With all technical evaluations complete, we executed a clean, comprehensive refactoring.

### 5.1 Complete Elimination of Third-Party Dependencies
We removed `commons-fileupload` and `commons-io` from `web-servlet/pom.xml`. Aspectran's file upload subsystem is now **100% Zero-Dependency**:

```
[BEFORE: Heavy External Dependencies]
aspectran-web-servlet
  ├── commons-fileupload:1.6.0 (Tied to javax.servlet)
  └── commons-io:2.22.0

[AFTER: True Zero-Dependency]
aspectran-web-servlet
  └── (Zero external upload libraries - Pure Jakarta Servlet 6.0 standards)
```

### 5.2 Clean, Symmetrical Naming and Package Flattening
Previously, distinguishing between three different parsers required cumbersome names like `StandardServletMultipartFormDataParser` (38 characters) and `StandardServletMultipartFormDataParserFactoryBean` (49 characters).

With only the standard servlet parser remaining, we removed redundant prefixes and flattened the package hierarchy:

| Component | Before (AS-IS) | After (TO-BE) |
| :--- | :--- | :--- |
| **Package** | `support.multipart.standard` | **`support.multipart`** |
| **Servlet Parser** | `StandardServletMultipartFormDataParser` (38 chars) | **`ServletMultipartFormDataParser`** (30 chars) |
| **Factory Bean** | `StandardServletMultipartFormDataParserFactoryBean` (49 chars) | **`ServletMultipartFormDataParserFactoryBean`** (41 chars) |
| **File Parameter** | `StandardServletMultipartFileParameter` | **`ServletMultipartFileParameter`** |

This establishes **clean, symmetrical alignment** between Aspectran's Netty and Servlet runtimes:

```
com.aspectran
  ├── web.servlet.support.multipart
  │     └── ServletMultipartFormDataParser      <-- Standard Servlet Parser
  │
  └── netty.support.multipart
        └── NettyMultipartFormDataParser        <-- Native Netty Parser
```

### 5.3 Runtime-Optimized Native Parsing Engines
Under the new architecture, both parsers harness the best native I/O capabilities of their respective environments:

1. **`ServletMultipartFormDataParser` (Servlet Environment)**:
   * Delegates directly to `HttpServletRequest.getParts()`, which interfaces with the servlet container's (Tomcat/Jetty/Undertow) optimized low-level C/Epoll/NIO buffer pools.
   * Eliminates intermediate stream wrapping and redundant byte copying at the framework level.
2. **`NettyMultipartFormDataParser` (Netty / Aspectow Edge Environment)**:
   * Powered by Netty's native, non-blocking `HttpPostRequestDecoder`.
   * Leverages Netty's `ByteBuf` direct memory pooling for zero-overhead multipart parsing in asynchronous pipelines.

## 6. Conclusion: True Architectural Evolution Lies in Subtraction

When evolving software architecture, adding new libraries and features is straightforward. However, auditing legacy dependencies, courageously excising technical debt, and simplifying code around native standards requires conviction and careful deliberation.

Through this refactoring, Aspectran achieves:

* **Elimination of Technical Debt**: Completely purged deprecated `javax` bindings and unfinalized milestone dependencies.
* **True Zero-Dependency**: Zero risk of classpath conflicts and reduced deployment artifact footprint.
* **Maximized Maintainability and Cohesion**: Established a balanced, intuitive symmetry between `ServletMultipartFormDataParser` and `NettyMultipartFormDataParser`.

Aspectran will continue to embrace modern Java platform standards, delivering a framework architecture that is lean, resilient, and intuitive.
