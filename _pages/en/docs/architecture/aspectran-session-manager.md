---
title: "Aspectran Session Manager: Deep Dive"
subheadline: Architecture
---

## 1. Introduction

Aspectran aims to provide a consistent development experience across various execution environments, going beyond being just a framework. At the core of this philosophy is the **Aspectran Session Manager**. This component is a powerful and flexible State Management solution that redefines the concept of 'session', which was traditionally considered exclusive to web applications, to be usable in all execution environments (Web, Shell, Daemon, etc.).

This document aims to deeply analyze the internal architecture, core features, and configuration methods of the Aspectran Session Manager to help developers fully utilize its potential.

---

## 2. Core Architecture and Components

Aspectran's session manager is composed of an organic combination of components clearly separated by role. It is important to understand the role and interaction of each component.

### 2.1. Detailed Core Components

- **`SessionManager`** (Implementation: `DefaultSessionManager`)
  - **Role**: The central controller that manages all session management flows and acts as an external entry point. It oversees the entire lifecycle of sessions, including creation, retrieval, and invalidation.
  - **Internal Operation**: It operates by coordinating other core components such as `SessionCache`, `SessionStore`, and `HouseKeeper`. When a session retrieval request comes in, it first checks the `SessionCache`, and if not found, it uses a strategy of loading from the `SessionStore`.

- **`Session`** (Implementation: `ManagedSession`)
  - **Role**: A data object representing a single session. It stores metadata such as session ID, creation time, last access time, and user-stored attributes internally.

- **`SessionCache`** (Implementation: `DefaultSessionCache`)
  - **Role**: A caching layer that stores active session objects in memory. It maximizes session retrieval performance by minimizing physical access to the `SessionStore` (file, Redis, etc.).

- **`SessionStore`** (Interface)
  - **Role**: A **storage abstraction layer** that persistently stores and manages session data. Thanks to this interface, the session storage method can be freely replaced (`Pluggable`).
  - **Key Implementations**: `FileSessionStore`, `LettuceSessionStore`

- **`HouseKeeper`**
  - **Role**: A background thread that periodically runs to clean up expired sessions, i.e., a **session scavenger**. Without `HouseKeeper`, expired sessions would remain in the system, causing resource leaks.

- **`SessionIdGenerator`**
  - **Role**: Generates a globally unique ID for every session.

### 2.2. Component Interaction Flow

- **Session Creation Flow**
  1. Call `SessionManager.createSession()`
  2. `SessionIdGenerator` generates a new ID
  3. `ManagedSession` object is created
  4. Session is added to `SessionCache`
  5. Session is written to persistent storage via `SessionStore.save()`

- **Session Retrieval Flow**
  1. Call `SessionManager.getSession(id)`
  2. First retrieve from memory cache with `SessionCache.get(id)`
  3. (On cache miss) Load from persistent storage with `SessionStore.load(id)`
  4. Add the loaded session to `SessionCache` and return

- **Session Cleanup Flow**
  1. `SessionScheduler` runs `HouseKeeper` at regular intervals
  2. `HouseKeeper` retrieves all session IDs from `SessionStore` and checks for expiration
  3. If an expired session is found, `session.invalidate()` is called
  4. The session is removed from `SessionCache`
  5. Finally deleted from persistent storage via `SessionStore.delete()`

---

## 3. Pluggable Storage and Clustering

The `SessionStore` interface is one of the most powerful features of Aspectran's session management, determining the scalability of the application.

### 3.1. `FileSessionStore`

- **Operation**: Stores `SessionData` objects as files using Java serialization. Each session is managed as a separate file.
- **Advantages**: No external dependencies, simple configuration, convenient for single-server environments or development environments.
- **Disadvantages**: Unsuitable for session clustering environments because it is difficult for multiple server instances to share the file system.

### 3.2. `LettuceSessionStore` (Redis-based)

- **Operation**: Uses **Lettuce**, a high-performance asynchronous Redis client, to store session data in Redis. This allows for **session clustering** where multiple application servers share sessions via a central Redis.
- **Redis Data Structure**: Each session is stored as a Redis **String** type. The key is in the format `namespace:sessionID` (e.g., `aspectran:session:xxxxx`), and the value is the serialized byte array of the `SessionData` object.

### 3.3. Comparison of Operation Modes: Single Server vs. Cluster

The `clusterEnabled` flag in `SessionManagerConfig` is a key switch that determines the reliability and synchronization strategy of session data.

#### Single Server Mode (`clusterEnabled: false`)

- **Data Reliability**: Primarily trusts `SessionCache` (memory).
- **Operation**: When a session is requested, it first checks the memory cache and immediately returns the data if found. The `SessionStore` (persistent storage) is mainly used for backup purposes for recovery during server restarts. Since there is no concern about data being changed simultaneously in multiple places, the goal is to read and write only in memory for optimal performance.
- **Save Points**:
  - If `saveOnCreate` is `false`, the session is saved when the **last request using it completes**. This is a performance optimization that prevents unnecessary storage access for short-lived sessions (e.g., bot access) that are created and destroyed within a single request.
  - If `saveOnCreate` is `true`, the session is saved immediately upon creation.
- **Main Goal**: **Maximum Performance**. Minimizes unnecessary storage I/O.

#### Cluster Mode (`clusterEnabled: true`)

- **Data Reliability**: Trusts `SessionStore` (e.g., Redis, a central store) as the sole **Single Source of Truth**.
- **Operation**: Assumes an environment where requests are distributed across multiple servers by a load balancer. Each server's local memory cache is treated as a "copy" and is continuously synchronized with the central store for data consistency.
  - **Session Load**: Even if a session exists in the local cache, it considers the possibility that it has been changed by another server and compares it with the data in the central store to maintain the latest state.
  - **Session Save**: To ensure data consistency, save operations occur actively at multiple points in time.
    1.  **On Creation**: When a new session is created, it is immediately saved to the central store so that all servers in the cluster can recognize it.
    2.  **On Last Request Completion**: When the last request finishes, any changes to session attributes during request processing are reflected in the central store.
    3.  **On Eviction from Memory**: When an inactive session is removed from a specific server's memory, its final state is safely stored in the central store just before removal.
- **Main Goal**: **Data Consistency**. Always ensures the same session state regardless of which server node processes the request.

| Category | Single Server Mode (`clusterEnabled: false`) | Cluster Mode (`clusterEnabled: true`) |
| :--- | :--- | :--- |
| **Data Reliability** | Primarily trusts `SessionCache` (memory) | Ultimately trusts `SessionStore` (central store) |
| **Session Load Strategy** | No storage access if in cache | Checks data consistency by comparing with Store even if in cache |
| **Session Save Strategy** | Mainly saves on last request completion (performance-optimized) | Saves at multiple points like creation, completion, and eviction (consistency-focused) |
| **Main Goal** | **Maximum Performance** | **Data Consistency** |

---

## 4. Sophisticated Session Lifecycle Management

Aspectran has a sophisticated timeout policy that quickly removes unnecessary sessions to protect system resources.

### 4.1. Separation of New and Regular Sessions

- **Problem**: Web crawlers, bots, load balancer health checks, etc., may create sessions without actual interaction, leading to a large accumulation of unnecessary "ghost sessions."
- **Solution**: Aspectran considers a session a "new session" only for the first request after its creation, applying a special timeout. From the second request onwards, it is promoted to a "regular session" and the normal timeout is applied.

### 4.2. Detailed Configuration Item Analysis

The following are the session settings applied to the demo site.
Due to the nature of the demo site, it may be subject to testing by web crawlers or web automation tools.
In such cases, it is advantageous to set the maximum idle time for new sessions as short as possible to prevent exceeding the maximum number of sessions.

```xml
<bean class="com.aspectran.core.context.config.SessionManagerConfig">
    <arguments>
        <item>
            workerName: jn0
            maxActiveSessions: 99999
            maxIdleSeconds: 489
            evictionIdleSeconds: 258
            maxIdleSecondsForNew: 60
            evictionIdleSecondsForNew: 30
            scavengingIntervalSeconds: 90
            clusterEnabled: true
        </item>
    </arguments>
</bean>
```

- **`workerName`** (jn0): A unique name for the worker to be included in the session ID. If multiple session managers are used in one application, this value must be set to be unique to prevent session ID collisions.
- **`maxActiveSessions`** (99999): Specifies the maximum number of sessions that can be active simultaneously.
- **`maxIdleSeconds`** (489 seconds): Maximum idle time for **regular sessions**. If a session is not used for this duration, it becomes 'expired'.
- **`maxIdleSecondsForNew`** (60 seconds): A special maximum idle time that applies only to **new sessions** (sessions in their first request). From the second request onwards, the session is promoted to a regular session and is not affected by this setting.
- **`scavengingIntervalSeconds`** (90 seconds): The interval (in seconds) at which the `HouseKeeper` (session scavenger) runs to permanently delete expired sessions.
- **`evictionIdleSeconds`** (258 seconds): The idle time in seconds before an inactive session is **evicted from the memory cache**. This setting is key to the memory management cache policy. (Note: Internally, this value is also reused by the `HouseKeeper` as a grace period for permanently deleting expired sessions.)
- **`evictionIdleSecondsForNew`** (30 seconds): The cache eviction policy time (in seconds) for new sessions.
- **`clusterEnabled`** (true): Specifies that it is a clustering environment, operating in a mode that ensures session data consistency. (Refer to section 3.3 for details)
- **`saveOnCreate`** (boolean): If `true`, the session is saved to persistent storage immediately upon creation. If `false`, it provides a performance optimization by saving only when the last request using the session completes, thus reducing unnecessary I/O. (Note: If `clusterEnabled` is `true`, the session is always saved on creation regardless of this value.)
- **`saveOnInactiveEviction`** (boolean): If `true`, when a session is evicted from the memory cache due to inactivity, its data is saved to persistent storage just before eviction. This prevents session data loss. (Note: If `clusterEnabled` is `true`, the session is always saved on eviction regardless of this value.)
- **`removeUnloadableSessions`** (boolean): If `true`, when session data cannot be read from persistent storage (e.g., due to deserialization failure after a class change), the corresponding session data will be deleted from the store.

---

## 5. Environment Independence and API Consistency

- **`SessionManager`**: Used when environment-independent session functionality is required (e.g., daemon applications).
- **`SessionAdapter`**: An adapter that allows native sessions provided by a specific environment, like `HttpSession` in a web environment, to be used with Aspectran's standard API in a consistent manner, maximizing code reusability.

---

## 6. Persistence Control: `@NonPersistent`

If the `@NonPersistent` annotation is attached to the class of an object to be stored in the session, that object will not be stored in the `SessionStore`. When `SessionData` is serialized, it checks for this annotation on the attribute object's class and excludes it from the storage process.

- **Use Cases**:
  - **Non-serializable objects**: `Socket`, `DB Connection`, etc.
  - **Sensitive data**: Passwords, private keys, etc.
  - **Performance optimization**: Reduces serialization overhead by excluding unnecessary temporary data.

```java
import com.aspectran.core.component.session.NonPersistent;

@NonPersistent
public class MyTemporaryData implements java.io.Serializable {
    // This object will not be stored in files or Redis.
}
```

## 7. Configuration Examples

### Example 1: Session Configuration for Shell or Daemon Environment

Directly configure the session for shell or daemon services in the `aspectran-config.apon` file.
Since it is not a web environment, it does not require sophisticated session lifecycle management.

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

### Example 2: Profile-based XML Bean Configuration (Web Environment)

Dynamically switch the session store based on the production environment using profiles.

```xml
<bean id="tow.context.jpetstore.sessionManager"
      class="com.aspectran.undertow.server.session.TowSessionManager">
    <properties>
        <item name="sessionManagerConfig">
            <bean class="com.aspectran.core.component.session.SessionManagerConfig">
                <arguments>
                    <item>
                        workerName: jn0
                        maxActiveSessions: 99999
                        maxIdleSeconds: 489
                        maxIdleSecondsForNew: 60
                        scavengingIntervalSeconds: 90
                        clusterEnabled: true
                    </item>
                </arguments>
            </bean>
        </item>
    </properties>
    <!-- Default profile: Use FileStore -->
    <properties profile="!prod">
        <item name="sessionStore">
            <bean class="com.aspectran.core.component.session.FileSessionStoreFactoryBean">
                <properties>
                    <item name="storeDir">/work/_sessions/jpetstore</item>
                </properties>
            </bean>
        </item>
    </properties>
    <!-- When 'prod' profile is active: Use RedisStore -->
    <properties profile="prod">
        <item name="sessionStore">
            <bean class="com.aspectran.core.component.session.redis.lettuce.DefaultLettuceSessionStoreFactoryBean">
                <properties>
                    <item name="poolConfig">
                        <bean class="com.aspectran.core.component.session.redis.lettuce.RedisConnectionPoolConfig">
                            <properties>
                                <item name="uri">%{system:redis.uri}/11</item>
                            </properties>
                        </bean>
                    </item>
                </properties>
            </bean>
        </item>
    </properties>
</bean>
```

## 8. Conclusion

Aspectran Session Manager is not just a simple state store, but an **enterprise-grade state management framework** that meets the requirements of modern application architectures. By providing pluggable storage, sophisticated lifecycle management, and environment-independent APIs, developers can manage user state stably and efficiently in any environment, from simple single-node applications to large-scale distributed services.
