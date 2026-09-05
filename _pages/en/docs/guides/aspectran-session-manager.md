---
title: "Aspectran Session Manager: State Management & Session Clustering Guide"
subheadline: Core Guide
permalink: /en/docs/guides/aspectran-session-manager/
---

Aspectran provides its own dedicated session management architecture to support **consistent state management across all execution environments**—from standalone daemons and interactive CLI shells to microservices and enterprise web application servers—without being bound to any specific web container or servlet specification.

This guide provides an end-to-end reference covering the internal design principles and component architecture of the Aspectran Session Manager, sophisticated lifecycle control distinguishing new and normal sessions, pluggable storage backends (local files and Redis distributed clustering), concrete configuration practices for Aspectow Enterprise (Undertow) and Aspectow Edge (Netty), and application-level API usage.

## 1. Core Architecture and Design Philosophy

Rather than treating HTTP sessions as a mechanism exclusive to servlet containers, Aspectran abstracts state management so that it can be applied seamlessly across any application runtime. Going beyond merely emulating servlet container sessions, it features a cleanly decoupled component ecosystem designed for high availability, fault tolerance, and elastic scalability in cloud-native deployments.

### 1.1. Core Components

* **[`SessionManager`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/component/session/SessionManager.java)** (Default implementation: [`DefaultSessionManager`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/component/session/DefaultSessionManager.java))
  * The central entry point and orchestrator for all session management flows.
  * Governs the entire session lifecycle, including creation, retrieval, updates, and explicit invalidation.
  * Coordinates underlying core components such as `SessionCache`, `SessionStore`, and `HouseKeeper` to ensure optimal I/O efficiency. When a session retrieval request arrives, it inspects the primary memory cache first, loading state from persistent storage only upon a cache miss.
* **[`Session`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/component/session/Session.java)** (Implementation: [`ManagedSession`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/component/session/ManagedSession.java))
  * Represents an individual user's stateful session data object.
  * Encapsulates metadata (session ID, creation timestamp, last accessed timestamp, max idle intervals) and a thread-safe map of user-bound attributes.
* **[`SessionCache`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/component/session/SessionCache.java)** (Default implementation: [`DefaultSessionCache`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/component/session/DefaultSessionCache.java))
  * High-speed caching layer maintaining active session instances in the JVM heap.
  * Minimizes disk and network I/O toward physical storage (files, Redis, etc.), maximizing concurrent request throughput.
* **[`SessionStore`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/component/session/SessionStore.java)** (Storage Abstraction Interface)
  * Pluggable persistence layer responsible for physical durability and cross-instance session sharing.
  * Designed with a pluggable architecture, allowing developers to switch freely between local disk storage and distributed Redis clusters purely via configuration without altering business logic.
* **`HouseKeeper`**
  * Periodic background scavenger thread that detects and purges expired sessions.
  * Permanently deletes stale, unattended sessions to prevent heap memory exhaustion and storage leakage.
* **`SessionIdGenerator`**
  * Employs cryptographically secure pseudo-random number generation (`SecureRandom`) to issue globally unique, tamper-resistant session IDs. Appends worker node identifiers (`workerName`) in clustered topologies.

### 1.2. Component Interaction Lifecycle

1. **Session Creation Flow**:
   * `SessionManager.createSession()` invoked.
   * `SessionIdGenerator` issues a cryptographically secure, unique session identifier.
   * `ManagedSession` instance instantiated containing initial metadata.
   * Registered into the `SessionCache` memory tier.
   * Persisted via `SessionStore.save()` according to the active strategy (deferred in single-server mode; immediate in clustered mode).
2. **Session Retrieval Flow**:
   * `SessionManager.getSession(id)` called with the client's session identifier.
   * Checks the in-memory `SessionCache.get(id)` first.
   * Upon cache miss, loads and deserializes session state from `SessionStore.load(id)`.
   * Re-populates the loaded instance into `SessionCache` and returns it to the caller.
3. **Session Scavenging Flow**:
   * Background `SessionScheduler` periodically triggers the `HouseKeeper` thread.
   * Scans active memory registries and persistent storage indexes for expired timestamps.
   * Invokes `session.invalidate()` on expired sessions.
   * Notifies registered `SessionListener` callbacks, evicting the session permanently from both cache and persistent store.

## 2. Pluggable Storage and Clustering Strategies

Aspectran Session Manager provides a flexible storage hierarchy adaptable to distinct persistence requirements and traffic scales. Crucially, it supports **a 3-tier persistence strategy ranging from pure in-memory mode without any `sessionStore`, to local filesystem durability, to enterprise-grade Redis clustering**.

### 2.1. Pure In-Memory Sessions (Storeless / SessionStore Omitted)

* **Operating Principle**: Configured simply by omitting the `sessionStore` property entirely from the session manager bean definition and injecting only the [`SessionManagerConfig`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/context/config/SessionManagerConfig.java) bean.
* **Characteristics**:
  * Incurs zero disk I/O and zero network communication; sessions are maintained purely within JVM heap memory (`ConcurrentHashMap`).
  * Yields the **absolute highest throughput and lowest latency** among all configurations due to zero persistence overhead.
  * Ideal for console demos (such as `aspectow-demo-console`), local testing, short-lived ephemeral session tokens, or lightweight microservices where persistence across restarts is unnecessary.
  * When the server process terminates or restarts, all active session data is reset.

```xml
<!-- Pure In-Memory Lightweight Session Manager (No SessionStore) -->
<bean id="netty.context.root.sessionManager"
      class="com.aspectran.netty.server.session.NettySessionManager"
      scope="prototype">
    <property name="sessionManagerConfig">
        <bean class="com.aspectran.core.context.config.SessionManagerConfig">
            <argument>
                workerName: rn0
                maxActiveSessions: 100
                maxIdleSeconds: 300
            </argument>
        </bean>
    </property>
</bean>
```

### 2.2. Local File Session Store (`FileSessionStore`)

* **Operating Principle**: Serializes `SessionData` onto local disk directories as individual files using Java serialization.
* **Advantages**: Requires zero external databases or middleware dependencies. Ideal for standalone daemons, local development, and single-node production environments.
* **Resilience**: Automatically restores valid sessions from disk upon server restarts, preserving active logins across redeployments.
* **Limitations**: Unsuitable for multi-instance load-balanced environments because local filesystem state is not shared across nodes.

### 2.3. High-Performance Redis Session Store (`LettuceSessionStore`)

* **Operating Principle**: Uses **Lettuce**, a high-performance non-blocking asynchronous Redis client, to persist session state into a centralized Redis instance or Redis Cluster.
* **Data Layout**: Stored as Redis binary-safe `String` entries under the key format `namespace:sessionId`. Values contain serialized byte arrays of session attributes.
* **Advantages**: Enables true stateless application server architectures. Multiple WAS instances share real-time session state, providing seamless zero-downtime failover if any node crashes.

### 2.4. Single Server Mode vs. Clustered Mode

The `clusterEnabled` flag in [`SessionManagerConfig`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/context/config/SessionManagerConfig.java) defines the single source of truth and synchronization semantics:

| Dimension | Single Server Mode (`clusterEnabled: false`) | Distributed Clustered Mode (`clusterEnabled: true`) |
| :--- | :--- | :--- |
| **Source of Truth** | Prioritizes local heap memory (`SessionCache`) | Central store (`SessionStore` / Redis) is the definitive authority |
| **Load Strategy** | If present in memory cache, never queries external store (maximum performance) | Verifies cache freshness against central store to guarantee consistency across nodes |
| **Save Strategy** | Batched at end of last request or during cache eviction | Saved immediately upon creation, after every request completion, and upon cache eviction |
| **Primary Goal** | Maximum single-node throughput via I/O minimization | Absolute data consistency and zero-downtime high availability |

## 3. Session Lifecycle Management and Timeout Optimization

Web environments frequently suffer from resource exhaustion caused by search engine crawlers, bots, and automated health checks that trigger session creation without subsequent interaction. Aspectran eliminates these "ghost sessions" using a dual timeout architecture.

### 3.1. Separation of New and Normal Sessions

* **New Session**: A newly minted session that has only processed its initial request and has not yet made a second roundtrip.
* **Normal Session**: A session that has presented a valid session cookie and performed two or more requests.
* **Optimization Principle**: Automated bots rarely send a second request with the same session cookie. By configuring a drastically shortened timeout (`maxIdleSecondsForNew`) for new sessions, phantom sessions are scavenged within seconds rather than lingering for 30 minutes, preventing heap and Redis saturation.

### 3.2. `SessionManagerConfig` Core Configuration Parameters

The parameter specification for [`SessionManagerConfig`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/context/config/SessionManagerConfig.java) in XML Bean definitions or APON configuration blocks is as follows:

```xml
<bean class="com.aspectran.core.context.config.SessionManagerConfig">
    <argument>
        workerName: node1
        maxActiveSessions: 50000
        maxIdleSeconds: 1800
        evictionIdleSeconds: 600
        maxIdleSecondsForNew: 60
        evictionIdleSecondsForNew: 30
        scavengingIntervalSeconds: 60
        clusterEnabled: true
        saveOnCreate: true
        saveOnInactiveEviction: true
        removeUnloadableSessions: true
    </argument>
</bean>
```

* **`workerName`**:
  * Unique node identifier in a cluster.
  * Appended as a suffix to generated session IDs (e.g., `session123.node1`) for L4/L7 sticky session routing and cross-node collision prevention.
* **`maxActiveSessions`**:
  * Maximum number of concurrent active session instances held in the memory cache.
  * When exceeded, the least recently used idle sessions are proactively evicted from memory to prevent OutOfMemory errors.
* **`maxIdleSeconds`**:
  * Maximum idle lifetime (in seconds) for normal sessions before permanent expiration (e.g., 1800s = 30 minutes).
  * If no request arrives within this duration, the session is permanently expired.
* **`maxIdleSecondsForNew`**:
  * Special short timeout (in seconds) applied strictly to new sessions (recommended: 30s to 60s).
  * Even if crawlers request thousands of sessions, they expire within a minute and are purged immediately.
* **`evictionIdleSeconds`**:
  * Idle duration before an active session is **evicted from the local JVM heap cache** to reclaim memory.
  * Because data remains safe in the `SessionStore`, returning users will have their session restored transparently.
* **`evictionIdleSecondsForNew`**:
  * Heap cache eviction timeout for new sessions.
* **`scavengingIntervalSeconds`**:
  * Execution interval (in seconds) of the background `HouseKeeper` cleaner thread.
  * Setting it too low incurs CPU overhead, while setting it too high leaves stale sessions in memory (recommended: 60s to 120s).
* **`clusterEnabled`**:
  * Set to `true` to enable distributed Redis clustering and multi-node consistency synchronization.
* **`saveOnCreate`**:
  * Dictates whether sessions are written to storage immediately upon creation. (Single-server optimization; in clustered mode (`clusterEnabled: true`), sessions are always saved immediately upon creation.)
* **`saveOnInactiveEviction`**:
  * Ensures that sessions evicted from heap memory due to inactivity are written to backing storage prior to memory dereferencing.
* **`removeUnloadableSessions`**:
  * When `true`, automatically purges unreadable or deserialization-corrupted session records from storage (e.g., after application class refactorings) to prevent cascading errors.

### 3.3. Best Practice Profiles by Deployment Scenario

To eliminate guesswork when configuring session timeouts and cache thresholds, Aspectran provides four battle-tested configuration profiles tailored to typical enterprise deployment scenarios.

#### Configuration Matrix Across Environments

| Parameter | 1) Admin Console | 2) High-Traffic Public Web | 3) Lightweight Edge API | 4) Local Dev & Testing |
| :--- | :--- | :--- | :--- | :--- |
| **`workerName`** | `cn0` | `rn0` | `edge0` | `dev0` |
| **`maxActiveSessions`** | `999` | `50000` | `5000` | `100` |
| **`maxIdleSeconds`** | `600` (10m) | `1800` (30m) | `300` (5m) | `3600` (1h) |
| **`evictionIdleSeconds`** | `300` (5m) | `600` (10m) | `120` (2m) | `1800` (30m) |
| **`maxIdleSecondsForNew`** | `120` (2m) | `60` (1m) | `30` (30s) | `300` (5m) |
| **`evictionIdleSecondsForNew`** | `60` (1m) | `30` (30s) | `15` (15s) | `180` (3m) |
| **`scavengingIntervalSeconds`**| `180` (3m) | `60` (1m) | `60` (1m) | `300` (5m) |
| **`clusterEnabled`** | `false` | `true` | `false` | `false` |
| **Recommended Store** | Pure In-Memory or File | Redis Cluster (`Lettuce`) | Pure In-Memory | File (`FileSessionStore`)|

#### Profile 1: Administrative Console Context (`cn0` / Console Context)

Designed for the dedicated `/console` management plane accessed exclusively by authorized administrators and operators.

```xml
<bean class="com.aspectran.core.context.config.SessionManagerConfig">
    <argument>
        workerName: cn0
        maxActiveSessions: 999
        maxIdleSeconds: 600
        evictionIdleSeconds: 300
        maxIdleSecondsForNew: 120
        evictionIdleSecondsForNew: 60
        scavengingIntervalSeconds: 180
        clusterEnabled: false
    </argument>
</bean>
```

* **Rationale**:
  * **Strict Security**: Limits idle lifetime to 10 minutes (`maxIdleSeconds: 600`) to mitigate unattended workstation hijacking risks.
  * **Memory Conservation**: Evicts idle sessions from heap memory after 5 minutes (`evictionIdleSeconds: 300`).
  * **Login Accommodation**: Affords administrators a generous 2 minutes (`maxIdleSecondsForNew: 120`) to complete multi-factor authentication (MFA/OTP).
  * **Minimized Background Interference**: Extends the scavenger interval (`scavengingIntervalSeconds`) to 3 minutes (180s) to avoid unnecessary CPU cycles for small operator counts.

#### Profile 2: High-Traffic Public Web Service (High-Traffic Public Web / Enterprise)

Built for high-volume customer-facing portals subject to relentless search engine crawlers and automated bot probes.

```xml
<bean class="com.aspectran.core.context.config.SessionManagerConfig">
    <argument>
        workerName: rn0
        maxActiveSessions: 50000
        maxIdleSeconds: 1800
        evictionIdleSeconds: 600
        maxIdleSecondsForNew: 60
        evictionIdleSecondsForNew: 30
        scavengingIntervalSeconds: 60
        clusterEnabled: true
        saveOnCreate: true
        saveOnInactiveEviction: true
    </argument>
</bean>
```

* **Rationale**:
  * **Crawler Defense**: Automatically purges bot phantom sessions after 1 minute (`maxIdleSecondsForNew: 60`) with heap eviction at 30 seconds, preventing memory and Redis saturation.
  * **High Availability**: Pairs `clusterEnabled: true` with centralized Redis stores for real-time multi-node synchronization and zero-downtime failover.
  * **Responsive Scavenging**: Maintains a tight 60-second scavenging cadence to rapidly collect expired records.

#### Profile 3: Lightweight Edge Microservices (Aspectow Edge / In-Memory)

Optimized for ultra-fast API endpoints and short-lived request contexts running inside Netty channel pipelines without servlets.

```xml
<bean class="com.aspectran.core.context.config.SessionManagerConfig">
    <argument>
        workerName: edge0
        maxActiveSessions: 5000
        maxIdleSeconds: 300
        evictionIdleSeconds: 120
        maxIdleSecondsForNew: 30
        evictionIdleSecondsForNew: 15
        scavengingIntervalSeconds: 60
        clusterEnabled: false
    </argument>
</bean>
```

* **Rationale**:
  * **Storeless Operation**: Completely omits `sessionStore` to eliminate disk and network serialization latency.
  * **Rapid Memory Reclamation**: Enforces a 5-minute lifespan (`maxIdleSeconds: 300`) with 30-second new session cleanup to preserve low memory footprints.

#### Profile 4: Local Development and Testing (Development & Testing)

Configured for developers running workstations and interactive debugging sessions.

```xml
<bean class="com.aspectran.core.context.config.SessionManagerConfig">
    <argument>
        workerName: dev0
        maxActiveSessions: 100
        maxIdleSeconds: 3600
        evictionIdleSeconds: 1800
        maxIdleSecondsForNew: 300
        evictionIdleSecondsForNew: 180
        scavengingIntervalSeconds: 300
        clusterEnabled: false
    </argument>
</bean>
```

* **Rationale**:
  * **Productivity**: Generously sets idle expiration to 1 hour (`maxIdleSeconds: 3600`) so developers are not repeatedly forced to re-login during debugging pauses.
  * **Persistence Across Restarts**: Pairs with `FileSessionStoreFactoryBean` to preserve active logins across development server restarts.

## 4. Controlling Persistence: `@NonPersistent`

When serializing sessions to Redis or disk files, non-serializable objects (such as network sockets, database connections, or large rendering buffers) can cause exceptions or degrade network bandwidth.

Aspectran provides the [`@NonPersistent`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/component/session/NonPersistent.java) annotation to exclude specific attributes from persistent storage:

```java
package com.aspectran.example;

import com.aspectran.core.component.session.NonPersistent;
import java.io.Serializable;

/**
 * Retained in heap session memory but excluded from Redis or disk storage.
 */
@NonPersistent
public class TemporarySecurityContext implements Serializable {

    private String temporaryToken;
    private transient Object activeConnection;

    // Getter, Setter ...
}
```

* **Target Candidates**:
  * Non-serializable runtime handles (`Socket`, `Connection`, `Thread`)
  * Highly sensitive single-use authentication tokens (preventing external storage leakage)
  * Large ephemeral cache payloads (reducing Redis serialization and network transfer overhead)
* **Execution**: During `SessionData` serialization, Aspectran inspects the type hierarchy of attribute objects; if marked with `@NonPersistent`, the attribute is safely excluded from persistent storage.

## 5. Environment-Specific Configuration Guide

Aspectran Session Manager's strongest advantage is its ability to easily adapt optimized bindings for the target deployment infrastructure while sharing the exact same session lifecycle engine.

### 5.1. Standalone / Shell / Daemon Deployments

CLI shell environments and daemon processes utilize sessions to track interactive user logins and task execution contexts without a web container. Configured directly in `aspectran-config.apon`:

`/app/config/aspectran-config.apon`:
```apon
shell: {
    session: {
        workerName: shell
        maxActiveSessions: 1
        maxIdleSeconds: 1800
        scavengingIntervalSeconds: 600
        fileStore: {
            storeDir: /work/_sessions/shell
        }
        enabled: true
    }
}
```

### 5.2. Aspectow Enterprise Deployments (Undertow Servlet Binding)

Aspectow Enterprise bridges Undertow's servlet specification (`io.undertow.server.session.SessionManager`) with Aspectran's core session engine via [`TowSessionManager`](https://github.com/aspectran/aspectran/blob/master/with-undertow/src/main/java/com/aspectran/undertow/server/session/TowSessionManager.java).

`/app/config/server/undertow/tow-context-root.xml`:
```xml
<!-- Servlet Context Definition -->
<bean id="tow.context.root" class="com.aspectran.undertow.server.servlet.TowServletContext">
    <property name="contextPath">/</property>

    <!-- Bind Servlet Session Manager -->
    <property name="sessionManager">#{tow.context.root.sessionManager}</property>

    <!-- Standard Servlet Cookie Configuration -->
    <property name="servletSessionConfig">
        <bean class="com.aspectran.undertow.server.servlet.TowServletSessionConfig">
            <property name="cookieName">JSESSIONID</property>
            <property name="cookiePath">/</property>
            <property name="cookieDomain">.aspectran.com</property>
            <property name="httpOnly" valueType="boolean">true</property>
            <property name="secure" valueType="boolean">false</property>
            <property name="sessionTrackingModes">
                <value>COOKIE</value>
            </property>
        </bean>
    </property>
</bean>

<!-- Undertow Session Manager and Store Profile Switching -->
<bean id="tow.context.root.sessionManager"
      class="com.aspectran.undertow.server.session.TowSessionManager"
      scope="prototype">
    <property name="sessionManagerConfig">
        <bean class="com.aspectran.core.context.config.SessionManagerConfig">
            <argument>
                workerName: ent0
                maxActiveSessions: 10000
                maxIdleSeconds: 1800
                evictionIdleSeconds: 900
                maxIdleSecondsForNew: 60
                evictionIdleSecondsForNew: 30
                scavengingIntervalSeconds: 90
                clusterEnabled: false
            </argument>
        </bean>
    </property>

    <!-- Local Development: File-based Session Store -->
    <properties profile="!prod">
        <item name="sessionStore">
            <bean class="com.aspectran.core.component.session.FileSessionStoreFactoryBean">
                <property name="storeDir">%{system:aspectran.workPath:/work}/_sessions/%{tow.context.root.name}</property>
                <property name="gracePeriodSecs" valueType="int">30</property>
            </bean>
        </item>
    </properties>

    <!-- Production: High-Availability Redis Distributed Clustering -->
    <properties profile="prod">
        <item name="sessionStore">
            <bean class="com.aspectran.core.component.session.redis.lettuce.DefaultLettuceSessionStoreFactoryBean">
                <property name="poolConfig">
                    <bean class="com.aspectran.core.component.session.redis.lettuce.RedisConnectionPoolConfig">
                        <property name="uri">%{system:redis.uri}/10</property>
                    </bean>
                </property>
            </bean>
        </item>
    </properties>
</bean>
```

### 5.3. Aspectow Edge Deployments (Netty Non-Servlet Binding)

Aspectow Edge eliminates servlet container overhead by running [`NettySessionManager`](https://github.com/aspectran/aspectran/blob/master/with-netty/src/main/java/com/aspectran/netty/server/session/NettySessionManager.java) and [`NettySessionConfig`](https://github.com/aspectran/aspectran/blob/master/with-netty/src/main/java/com/aspectran/netty/server/session/NettySessionConfig.java) directly within Netty's HTTP channel pipeline.

`/app/config/server/netty/netty-context-root.xml`:
```xml
<!-- Netty Context Definition -->
<bean id="netty.context.root" class="com.aspectran.netty.server.NettyContext">
    <property name="contextPath">/</property>

    <!-- Bind Lightweight Netty Session Manager -->
    <property name="sessionManager">#{netty.context.root.sessionManager}</property>
</bean>

<!-- Netty Session Manager Configuration -->
<bean id="netty.context.root.sessionManager"
      class="com.aspectran.netty.server.session.NettySessionManager"
      scope="prototype">
    <!-- Netty HTTP Session Cookie Policy -->
    <property name="sessionConfig">
        <bean class="com.aspectran.netty.server.session.NettySessionConfig">
            <property name="cookieName">JSESSIONID</property>
            <property name="cookiePath">/</property>
            <property name="cookieDomain">.aspectran.com</property>
            <property name="httpOnly" valueType="boolean">true</property>
            <property name="secure" valueType="boolean">false</property>
            <property name="sameSite">Lax</property>
            <property name="maxAge" valueType="int">-1</property>
        </bean>
    </property>

    <!-- Session Lifecycle & Clustering Policy -->
    <property name="sessionManagerConfig">
        <bean class="com.aspectran.core.context.config.SessionManagerConfig">
            <argument>
                workerName: edge0
                maxActiveSessions: 50000
                maxIdleSeconds: 1800
                evictionIdleSeconds: 600
                maxIdleSecondsForNew: 60
                evictionIdleSecondsForNew: 30
                scavengingIntervalSeconds: 60
                clusterEnabled: false
            </argument>
        </bean>
    </property>

    <!-- Local Development: File Session Store -->
    <properties profile="!prod">
        <item name="sessionStore">
            <bean class="com.aspectran.core.component.session.FileSessionStoreFactoryBean">
                <property name="storeDir">%{system:aspectran.workPath:/work}/_sessions/%{netty.context.root.name}</property>
                <property name="gracePeriodSecs" valueType="int">30</property>
            </bean>
        </item>
    </properties>

    <!-- Production: High-Availability Redis Distributed Clustering -->
    <properties profile="prod">
        <item name="sessionStore">
            <bean class="com.aspectran.core.component.session.redis.lettuce.DefaultLettuceSessionStoreFactoryBean">
                <property name="poolConfig">
                    <bean class="com.aspectran.core.component.session.redis.lettuce.RedisConnectionPoolConfig">
                        <property name="uri">%{system:redis.uri}/10</property>
                    </bean>
                </property>
            </bean>
        </item>
    </properties>
</bean>
```

#### `NettySessionConfig` Cookie Parameters

* **`cookieName`**: Cookie name for session tracking (default: `JSESSIONID`).
* **`cookiePath`**: Valid URL path for the session cookie (default: `/`).
* **`cookieDomain`**: Optional domain scope for cross-subdomain cookie sharing (e.g., `.aspectran.com`).
* **`httpOnly`**: Blocks JavaScript `document.cookie` access to prevent XSS theft (default: `true`).
* **`secure`**: Restricts cookie transmission to HTTPS encrypted channels (recommended in production: `true`).
* **`sameSite`**: CSRF defense setting (`Strict`, `Lax`, `None`, default: `Lax`).
* **`maxAge`**: Cookie lifespan in seconds (default `-1` denotes an in-memory session cookie purged on browser close).

## 6. Session Lifecycle Event Listeners

To implement audit logging or track active visitor metrics upon session creation, destruction, or attribute mutation, register custom listeners implementing `SessionListener`.

### 6.1. Custom Listener Implementation

```java
package com.aspectran.example.listener;

import com.aspectran.core.component.session.Session;
import com.aspectran.core.component.session.SessionListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class UserSessionTrackingListener implements SessionListener {

    private static final Logger logger = LoggerFactory.getLogger(UserSessionTrackingListener.class);

    @Override
    public void sessionCreated(Session session) {
        logger.info("New session created: id={}, worker={}", session.getId(), session.getWorkerName());
    }

    @Override
    public void sessionDestroyed(Session session) {
        logger.info("Session destroyed: id={}, lastAccessed={}", session.getId(), session.getLastAccessedTime());
    }

}
```

### 6.2. Listener Registration Bean

In Netty environments, use [`SessionListenerRegistrationBean`](https://github.com/aspectran/aspectran/blob/master/with-netty/src/main/java/com/aspectran/netty/support/SessionListenerRegistrationBean.java) to safely inject listeners into the session manager of a specific context path (`/`):

```xml
<bean class="com.aspectran.netty.support.SessionListenerRegistrationBean">
    <property name="targetPath">/</property>
    <property name="sessionListener">
        <bean class="com.aspectran.example.listener.UserSessionTrackingListener"/>
    </property>
</bean>
```

Under Undertow Servlet environments, attach listeners via `TowServletSessionConfig` servlet listener chains or dynamic session manager listener registration beans.

## 7. Multi-Context Session Isolation Architecture

Aspectow server architectures enforce strict **Multi-Context Session Isolation**:

* **Isolation Principle**: Within a single JVM, the public business service context (`/`) and the administrative management console context (`/console`) maintain dedicated, completely independent `SessionManager` instances.
* **Security**: Administrator session tokens and authentication credentials created under `/console` are isolated at the heap cache and storage keyspace levels from public contexts. Security vulnerabilities in public web modules cannot leak administrative session state.
* **Domain Sharing Pattern**: When single sign-on (SSO) across subdomains is explicitly desired, configuring a shared `cookieDomain` and harmonizing Redis keyspace prefixes allows secure federation across contexts.

## 8. Application Code: Unified Session API

Application components (Translet actions, controllers, business services) interact with sessions using Aspectran's unified [`SessionAdapter`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/adapter/SessionAdapter.java) rather than tying business logic to `HttpServletRequest`, `HttpSession`, or Netty native channel buffers:

```java
package com.aspectran.example.action;

import com.aspectran.core.activity.Translet;
import com.aspectran.core.adapter.SessionAdapter;
import com.aspectran.core.component.bean.annotation.Action;
import com.aspectran.core.component.bean.annotation.Component;

@Component
public class LoginAction {

    @Action("login")
    public String login(Translet translet) {
        String username = translet.getParameter("username");
        String password = translet.getParameter("password");

        if (authenticate(username, password)) {
            // Retrieve container-agnostic SessionAdapter
            SessionAdapter sessionAdapter = translet.getSessionAdapter();

            // Set session attributes (auto-synced to cache and persistent store)
            sessionAdapter.setAttribute("currentUser", username);
            sessionAdapter.setAttribute("loginTime", System.currentTimeMillis());

            return "SUCCESS";
        }
        return "FAIL";
    }

    @Action("logout")
    public void logout(Translet translet) {
        SessionAdapter sessionAdapter = translet.getSessionAdapter();
        if (sessionAdapter != null) {
            // Invalidate session immediately across cluster and storage
            sessionAdapter.invalidate();
        }
    }

    private boolean authenticate(String u, String p) {
        return "admin".equals(u) && "secret".equals(p);
    }

}
```

* **Zero-Modification Portability**: The Java action code above executes identically across Undertow servlet environments, Netty asynchronous pipelines, or standalone automated command-line testing without modifying a single line of source code.
* **Thread Safety**: Attribute mutations within `SessionAdapter` are thread-safe and protected by `DefaultSessionManager` concurrency controls in multithreaded environments.

## 9. Conclusion

Aspectran Session Manager is a comprehensive **enterprise-grade state management framework** that goes far beyond a simple key-value store:

* **Infrastructure Agnostic**: Unifies state management semantics across Servlets, Netty, CLI shells, and daemons into a single developer and operations paradigm.
* **Intelligent Resource Defense**: Safeguards system memory and Redis storage against crawlers via dual new/normal session timeout algorithms.
* **Elastic Scalability**: Smoothly shifts from file-based local development to high-throughput Redis clustering purely via configuration without code modifications.
* **Enterprise Security**: Delivers multi-context isolation, `@NonPersistent` persistence boundary controls, and modern cookie security flags (`HttpOnly`, `SameSite`, `Secure`) to meet rigorous enterprise security requirements.
