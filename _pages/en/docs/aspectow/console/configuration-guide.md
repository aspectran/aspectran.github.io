---
title: Aspectow Console Configuration Guide
teaser: A comprehensive configuration guide detailing cluster communication modes, APON configuration specifications, DB and Redis setups, embedded AppMon monitoring settings, and Aspectran Bean definitions for Aspectow Console and Node Manager.
subheadline: Aspectow Console
---

## 1. Overview & Configuration File System

Aspectow Console provides flexible environment configurations leveraging declarative APON (Aspectran Parameter Object Notation) configuration files and Aspectran XML rule files based on the Aspectran framework.

Console configuration files are divided into node and cluster control settings (`node-config.apon`), database connection properties (`aspectow-console.db-*.properties`), Redis clustering settings (`redis.properties`), embedded AppMon monitoring configurations (`appmon-config.apon`), and Aspectran Bean definition files (`node-rules.xml`, `db.xml`).

### Major Configuration File Locations (`/config/console/`)

*   **`console-rules.xml`**: Top-level Aspectran XML definition file encapsulating both node management rules (`node-rules.xml`) and AppMon monitoring rules (`appmon-rules.xml`).
*   **`node-config.apon`**: Core Node Manager configuration defining cluster identifiers, communication modes (`direct` / `gateway`), encryption keys, and pulse intervals.
*   **`node-rules.xml`**: Aspectran XML definition file registering core components such as `NodeConfigResolver`, `NodeManagerFactoryBean`, `RemoteNodeManager`, `RemoteCommandManager`, and `RemoteSchedulerManager`.
*   **`appmon-config.apon`**: Configuration file defining target applications (`app`), events, metrics, logs, and aggregation intervals for the embedded AppMon monitoring engine.
*   **`appmon-rules.xml`**: Aspectran XML definition file initializing the AppMon monitoring collection engine and DB persistence scheduler.
*   **`aspectow-console.db-*.properties`**: Property files for Console database connections (supporting H2, MariaDB, MySQL, Oracle, and Supabase).
*   **`redis-*.properties`**: Redis connection pool configuration used as a Pub/Sub message bridge when running in Gateway cluster mode.

## 2. Node & Cluster Configurations (`node-config.apon`)

`node-config.apon` is the core configuration file used by Node Manager (`NodeManager`) to form clusters and select communication modes.

### APON Configuration Example

```apon
# Global Cluster Settings
cluster: {
    id: console-demo-cluster1
    mode: gateway  # Choose direct or gateway mode
    secret: {
        password: "your-node-management-password"
        salt: "optional-encryption-salt"
    }
    pulseInterval: 50000
    scheduler: {
        releasedOnUnlock: false
    }
    endpoint: {
        mode: auto  # auto, websocket, or polling
    }
}

# Server Group Definition (Required for gateway mode)
group: {
    id: backend-api
    title: Backend API Service Group
    description: Dedicated server group for backend REST APIs.
}

# Static Node Declaration (Optional: Automatically registered in Autoscaling mode)
node: {
    id: node01
    group: backend-api
    title: Backend API Server 01
    endpoint: {
        mode: auto
    }
}
node: {
    id: node02
    group: backend-api
    title: Backend API Server 02
    endpoint: {
        mode: auto
    }
}
```

### Detailed Parameter Specifications

#### `cluster` Section (Global Cluster Settings)

*   **`id`** (`string`, required): Unique identifier for the cluster. Nodes sharing the same cluster ID are grouped together.
*   **`mode`** (`string`, required): Specifies the cluster communication method.
    *   `direct`: Direct HTTP/WebSocket communication between nodes or between Console and nodes.
    *   `gateway`: Bridged packet communication via Redis Pub/Sub message bus, optimized for dynamic Autoscaling and private network infrastructure.
*   **`secret`** (`object`, optional): Configures security password (`password`) and salt (`salt`) for authenticating and encrypting packets between nodes and Console.
*   **`pulseInterval`** (`integer`, optional): Interval (in milliseconds; default: `50000`ms) for collecting and updating node heartbeat status.
*   **`scheduler.releasedOnUnlock`** (`boolean`, optional): Configures whether nodes autonomously release scheduler job ownership upon releasing cluster locks.
*   **`endpoint.mode`** (`string`, optional): Specifies endpoint collection mode (`auto`, `websocket`, `polling`).

#### `group` Section (Server Group Definition)

Defines group details when running in `gateway` mode to render nodes in separate group tabs on the Console UI.
*   **`id`**: Group identifier (e.g., `backend-api`, `frontend-web`)
*   **`title`**: Group display title on Console UI tabs (e.g., `Backend API Service Group`)
*   **`description`**: Detailed group description

#### `node` Section (Individual Node Definition)

Declares statically managed nodes. In autonomous registration (Autoscaling) mode, nodes join the cluster dynamically without explicit static `node` declarations.
*   **`id`**: Unique node identifier (e.g., `node01`)
*   **`group`**: Group ID to which the node belongs
*   **`title`**: Friendly node title displayed on Console UI node cards

## 3. Embedded AppMon Collection Settings (`appmon-config.apon`)

Aspectow Console embeds the AppMon monitoring engine as a first-class integrated component. Target applications (`app`), events, metrics, logs, and aggregation intervals are centrally managed inside `/config/console/appmon-config.apon`.

### APON Configuration Example (`appmon-config.apon`)

```apon
# DB persistence interval (in minutes, e.g., 1 minute)
counterPersistInterval: 1

# Long-Polling configuration for non-WebSocket environments
pollingConfig: {
    pollingInterval: 3000
    sessionTimeout: 30000
}

# Target application definition
app: {
    id: jpetstore
    title: JPetStore Webapp
    event: {
        id: activity
        target: jpetstore
        parameters: {
            +: /**
        }
    }
    event: {
        id: session
        target: tow.server/jpetstore
    }
    metric: {
        id: heap
        title: Heap Usage
        description: Monitors JVM Heap memory usage.
        reader: com.aspectran.aspectow.appmon.engine.exporter.metric.jvm.HeapMemoryUsageReader
        sampleInterval: 500
    }
    metric: {
        id: undertow-tp
        title: Undertow Thread Pool
        description: Monitors Undertow NIO worker thread pool resources.
        reader: com.aspectran.aspectow.appmon.engine.exporter.metric.undertow.NioWorkerMetricsReader
        target: tow.server
        sampleInterval: 500
    }
    log: {
        id: app
        file: /logs/jpetstore.log
        sampleInterval: 300
        lastLines: 300
    }
}
```

### Parameter Specifications

*   **`counterPersistInterval`**: Interval in minutes for saving aggregated event counter metrics to the Console DB (default: `5` minutes; setting `0` disables persistence).
*   **`pollingConfig`**: Configures Long-Polling client connection behavior (`pollingInterval`, `sessionTimeout`).
*   **`app`**: Defines individual application monitoring units.
    *   **`event`**: `id` (`activity`, `session`), `target` (ActivityContext / servlet path), `parameters` (Pointcut `+`/`-` path filters).
    *   **`metric`**: `reader` (fully qualified class name of `MetricReader` implementation), `parameters` (additional arguments).
    *   **`log`**: `file` (target log file path for tailing), `lastLines` (initial line count loaded upon UI access).

## 4. Cluster Communication Mode Selection Guide (Direct vs Gateway)

Aspectow Console provides two cluster communication architectures to suit your network infrastructure environment and cluster scale.

### Direct Communication Mode (`mode: direct`)

Console server directly establishes HTTP and WebSocket connections to each worker node's IP address and port endpoint.

*   **Key Features & Advantages**: Eliminates external message brokers like Redis for fast, lightweight single or small-scale cluster deployments.
*   **Recommended Environment**: Static IP environments, single data center internal networks, small-scale server clusters.

### Gateway Communication Mode (`mode: gateway`)

Console and worker nodes exchange management packets via Redis Pub/Sub message bus safely.

*   **Key Features & Advantages**: Resolves connection issues even when worker nodes are behind firewalls or use private IPs, autonomously maintaining cluster state during cloud Autoscaling events.
*   **Recommended Environment**: Kubernetes, AWS Auto Scaling Groups, multi-region distributed server clusters.

## 5. Redis Clustering Configuration (`redis.properties`)

When selecting `gateway` communication mode, Redis connection details used as a message bridge are configured via a single concise property, **`aspectow.redis.uri`**, following standard Lettuce `RedisURI` format.

### Configuration Examples (`redis-dev.properties` / `redis-prod.properties`)

```properties
# Development environment example (redis-dev.properties)
aspectow.redis.uri=redis://127.0.0.1:6379/0

# Production environment example (redis-prod.properties with authentication and DB index)
aspectow.redis.uri=redis://:your-redis-password@10.0.0.3:6379/5
```

### `aspectow.redis.uri` Format Guide

*   **Standard Format**: `redis://{host}:{port}/{dbIndex}` (e.g., `redis://localhost:6379/0`)
*   **With Password Authentication**: `redis://:{password}@{host}:{port}/{dbIndex}` (e.g., `redis://:mySecretPassword@redis-server:6379/2`)
*   **With Username and Password**: `redis://{username}:{password}@{host}:{port}/{dbIndex}`

Console and worker nodes parse this URI via `RedisConnectionPoolConfig` to dynamically create Lettuce connection pools for high-performance Pub/Sub messaging.

## 6. Console Database Connection & Profile Configuration (`aspectow-console.db-*.properties`)

Aspectow Console stores administrator accounts, RBAC permissions, Vault security tokens, audit logs, and embedded AppMon pre-aggregated statistics (minute, hour, day, month, year) in the database.

### 6.1. Default Profile & H2 Database

In the default configuration (`aspectran-config.apon`), the embedded `h2` profile is active by default, allowing instant development and demo execution without external RDBMS setups.

### 6.2. RDBMS Switching & Connection Property Setup

To connect to external databases (MariaDB, MySQL, PostgreSQL, Oracle, Supabase) instead of `h2`, specify the corresponding DB profile (e.g., `mariadb`) and add the matching property file (**`aspectow-console.db-mariadb.properties`**) under the project's `/config/console/` directory.

The `consoleDBProperties` Bean inside `db.xml` automatically resolves and loads the property file corresponding to the active profile.

```xml
<!-- Example db.xml -->
<bean id="consoleDBProperties" class="com.aspectran.core.support.PropertiesFactoryBean">
    <properties profile="mariadb">
        <item name="locations" type="array">
            <value>classpath:com/aspectran/aspectow/console/config/db/aspectow-console.db-mariadb.properties</value>
            <value>/config/console/aspectow-console.db-mariadb.properties</value>
        </item>
    </properties>
</bean>
```

#### MariaDB Connection Property Example (`/config/console/aspectow-console.db-mariadb.properties`)

```properties
aspectow-console.db-mariadb.url=jdbc:mariadb://127.0.0.1:3306/aspectow_console?characterEncoding=UTF-8
aspectow-console.db-mariadb.username=console_user
aspectow-console.db-mariadb.password=ENC(EncryptedPasswordHere)
```

#### Startup via System Property

Pass Java system properties at application startup to activate the target Console DB profile:

```bash
# Example running with MariaDB
-Daspectran.profiles.base.console=mariadb -Daspectow-console.db-mariadb.url=jdbc:mariadb://127.0.0.1:3306/aspectow_console -Daspectow-console.db-mariadb.username=console_user -Daspectow-console.db-mariadb.password=your-password
```

## 7. Aspectran XML Rule & Bean Definitions (`console-rules.xml`, `node-rules.xml`, `appmon-rules.xml`)

In the Aspectow Console environment, Aspectran XML rule files are modularized around the top-level console rule file (`console-rules.xml`), encapsulating both node control rules (`node-rules.xml`) and AppMon monitoring rules (`appmon-rules.xml`).

### 7.1. Top-level Console Master Rules (`console-rules.xml`)

`console-rules.xml` is the primary master rule file providing unified control rules for the Console environment. It encapsulates `node-rules.xml` and `appmon-rules.xml` via sub-appends (`<append>`).

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>

    <!-- Include Node Management & Control Rules -->
    <append file="/config/console/node-rules.xml"/>

    <!-- Include Embedded AppMon Monitoring Rules -->
    <append file="/config/console/appmon-rules.xml"/>

</aspectran>
```

By declaring only `/config/console/console-rules.xml` inside `aspectran-config.apon`, both node management and AppMon monitoring components are loaded automatically.

### 7.2. Node Management & Control Rules (`node-rules.xml`)

Node managers and remote control managers are activated as Aspectran Beans via `node-rules.xml`.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>

    <!-- APON Configuration File Loader based on Active Profile -->
    <bean class="com.aspectran.aspectow.node.config.NodeConfigResolver">
        <properties profile="!prod">
            <item name="configLocation">/config/console/node-config.apon</item>
        </properties>
        <properties profile="prod">
            <item name="configLocation">/config/console/node-config-prod.apon</item>
        </properties>
    </bean>

    <!-- Redis Connection Pool Configuration -->
    <bean id="redisConnectionPoolConfig" class="com.aspectran.aspectow.node.redis.RedisConnectionPoolConfig">
        <argument>
            <bean class="com.aspectran.core.support.PropertiesFactoryBean">
                <properties profile="prod">
                    <item name="locations" type="array">
                        <value>/config/console/redis-prod.properties</value>
                    </item>
                </properties>
                <properties profile="!prod">
                    <item name="locations" type="array">
                        <value>/config/console/redis-dev.properties</value>
                    </item>
                </properties>
            </bean>
        </argument>
    </bean>

    <!-- Node Manager Factory Bean -->
    <bean id="nodeManager" class="com.aspectran.aspectow.node.manager.NodeManagerFactoryBean" lazyDestroy="true">
        <properties>
            <item name="redisConnectionPoolConfig">#{redisConnectionPoolConfig}</item>
        </properties>
    </bean>

    <!-- Remote Node Control Manager -->
    <bean id="remoteNodeManager" class="com.aspectran.aspectow.node.management.nodes.RemoteNodeManager"/>

    <!-- Remote Scheduler Control Manager -->
    <bean id="remoteSchedulerManager" class="com.aspectran.aspectow.node.management.scheduler.RemoteSchedulerManager"/>

    <!-- Remote Command Control Manager -->
    <bean id="remoteCommandManager" class="com.aspectran.aspectow.node.management.commands.RemoteCommandManager"/>

</aspectran>
```

This Bean configuration activates `RemoteNodeManager`, `RemoteCommandManager`, and `RemoteSchedulerManager`, seamlessly connecting web UI requests to the node message bus and asynchronous processing pipeline.

### 7.3. Embedded AppMon Monitoring Rules (`appmon-rules.xml`) & Standalone Execution

The embedded AppMon monitoring engine inside Console dynamically loads target APON collection configuration paths via `appmon-rules.xml` according to active execution profiles (`!prod`/`prod`).

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>

    <bean class="com.aspectran.aspectow.appmon.engine.config.AppMonConfigResolver">
        <properties profile="!prod">
            <item name="configLocation">/config/console/appmon-config.apon</item>
        </properties>
        <properties profile="prod">
            <item name="configLocation">/config/console/appmon-config-prod.apon</item>
        </properties>
    </bean>

</aspectran>
```

#### Comparison with Standalone AppMon Execution Mode
* **Aspectow Console Environment**: Uses `console-rules.xml` to activate both node control features (`node-rules.xml`) and AppMon monitoring features (`appmon-rules.xml`).
* **Standalone AppMon Environment (No Console UI)**: When running as a pure monitoring collection node without Console UI, execute **`appmon-rules.xml` standalone** without `console-rules.xml`, minimizing resource footprint and ensuring lightweight execution.
