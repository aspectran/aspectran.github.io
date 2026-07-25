---
title: Aspectow AppMon Overview & Configuration Guide
teaser: Aspectow AppMon is a lightweight monitoring solution for observing real-time events, system metrics, sessions, and log streams in Aspectran framework-based applications.
subheadline: Aspectow AppMon
---

## 1. Overview

Aspectow AppMon is a lightweight real-time monitoring solution for applications built on the Aspectran framework. Designed to minimize impact on application performance, it allows operators and developers to visually observe various runtime events, logs, and system metrics in real time via a web UI.

It can run embedded within Aspectow Console in an integrated control environment, or **deployed as a standalone solution without Console** for lightweight monitoring operations.

## 2. Key Features

*   **Real-time Monitoring**: Streams data generated on the server in real time via WebSocket or Long-Polling to display on the UI.
*   **Lightweight & Easy Integration**: Easily registered as an Aspectran Bean in target applications, utilizing minimal resources to prevent performance degradation.
*   **Dynamic Monitoring**: Leverages Aspectran's AOP capabilities to dynamically trace transaction (`Activity`) executions and measure performance without code modifications.
*   **Diverse Data Sources**:
    *   **Events**: Tracks and counts core application events such as HTTP request handling and session creation/destruction.
    *   **Metrics**: Collects system metrics including JVM heap memory usage (`HeapMemoryUsageReader`), Undertow thread pool status (`NioWorkerMetricsReader`), and HikariCP connection pool metrics (`HikariPoolMBeanReader`).
    *   **Logs**: Streams real-time tailing of specified application and access log files on the UI.
*   **Data Persistence**: Periodically saves event counter metrics to an embedded H2 database or external RDBMS to preserve statistical data across application restarts.
*   **Flexible APON Configuration**: Defines nodes and monitoring target applications flexibly using APON (Aspectran Parameter Object Notation) configuration files.

## 3. Core Architecture & 3-Tier Hierarchy

Aspectow AppMon utilizes a 3-tier hierarchy—**`Group` (Server Group) - `Node` (Server Node) - `App` (Application)**—for distributed monitoring identification.

### Key Engine Components

*   **AppMonManager**: The core engine managing the overall lifecycle and configuration of AppMon.
*   **Exporter**: Responsible for collecting data from specific data sources (logs, metrics, events).
    *   **Reader**: Implements concrete data collection methods for `Exporter` (e.g., querying JVM metrics via JMX, reading log files from filesystem).
*   **PersistManager**: Handles periodic persistence of collected counter metrics to the database.
    *   **CounterPersistSchedule**: Scheduled task executing periodically to store counter data to the DB.
*   **ExportService**: Manages communication with client web UIs, transmitting collected data via WebSocket or Polling.
*   **Activity (Front/Backend)**: Acts as controllers handling HTTP requests from web UIs or external agents.

## 4. Data Persistence Architecture Overview

Aspectow AppMon persistently stores event count metrics in a database to maintain continuous statistics. By default, it uses an embedded H2 database and provides the following primary tables:

*   **`appmon_event_count`**: Stores count metrics aggregated by minute, hour, day, month, and year, queried directly for real-time visualization charts.
*   **`appmon_event_count_last`**: Stores the most recent count state for each event to restore in-memory counters upon application restarts, ensuring statistical continuity.

> For detailed composite PK schemas and pre-aggregation 3-tier storage architecture, refer to the [AppMon Event Count Data Structure and Architecture](/en/docs/aspectow/appmon/event-count-data-structure/) documentation.

## 5. Standalone Installation & Configuration Guide (Without Console)

When deploying AppMon standalone on specific application servers without Console, configuration files are located under the project's **`/config/appmon/`** directory.

### 5.1. Configuration Directory Structure (`/config/appmon/`)

*   **`appmon-config.apon`**: Main configuration file defining target applications (`app`), events, metrics, logs, and counter persistence intervals.
*   **`node-config.apon`**: Server group (`group`) and server node (`node`) definition file.
*   **`appmon-rules.xml` & `node-rules.xml`**: Aspectran XML rule files loading configuration files via `AppMonConfigResolver` and `NodeConfigResolver` and registering `NodeManagerFactoryBean`.
*   **`appmon.db-h2.properties`**: Property file configuring the embedded H2 DB storage path.

### 5.2. APON Main Configuration (`appmon-config.apon`) Example

`appmon-config.apon` defines target applications (`app`), collected events, metrics, logs, and persistence intervals.

```apon
# DB persistence interval (in minutes, e.g., 1 minute)
counterPersistInterval: 1

# Long-Polling configuration for non-WebSocket environments
pollingConfig: {
    pollingInterval: 3000   # Polling interval (ms)
    sessionTimeout: 30000   # Session expiration (ms)
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

### 5.3. Key APON Parameter Specifications

*   **`counterPersistInterval`**: Interval in minutes for saving event counter data to DB (default: 5 minutes; setting to `0` disables DB persistence).
*   **`pollingConfig`**: Long-Polling configuration (`pollingInterval`, `sessionTimeout`).
*   **`app`**: Defines individual application monitoring units.
    *   **`event`**: `name` (`activity`, `session`), `target` (ActivityContext / servlet path), `parameters` (Pointcut `+`/`-` path filters).
    *   **`metric`**: `reader` (fully qualified class name of `MetricReader` implementation), `parameters` (additional arguments).
    *   **`log`**: `file` (target log file path for tailing), `lastLines` (initial line count loaded upon UI access).

> Server group (`group`) and server node (`node`) definitions are specified separately in `node-config.apon` or `node-config-gateway.apon`.

### 5.4. Step-by-Step Installation & Operational Guide

#### Step 1: Define Target Applications (`/config/appmon/appmon-config.apon`)
Specify target `app`, `event`, `metric`, and `log` entries inside `appmon-config.apon`.

#### Step 2: Define Node Cluster (`/config/appmon/node-config.apon`)
Define server group (`group`) and server node (`node`) inside `node-config.apon` (or `node-config-gateway.apon`).

```apon
cluster: {
    id: appmon-cluster1
    mode: direct
}
group: {
    id: group1
    title: Group 1
}
node: {
    id: appmon-node1
    group: group1
    title: Localhost
    endpoint: {
        mode: auto
    }
}
```

#### Step 3: Configure XML Rules (`appmon-rules.xml` & `node-rules.xml`)
Specify configuration files using `AppMonConfigResolver` inside `appmon-rules.xml` and append appropriate node rules (`node-rules.xml`):

```xml
<!-- Example appmon-rules.xml -->
<aspectran>
    <bean class="com.aspectran.aspectow.appmon.engine.config.AppMonConfigResolver">
        <properties profile="!prod">
            <item name="configLocation">/config/appmon/appmon-config.apon</item>
        </properties>
        <properties profile="prod">
            <item name="configLocation">/config/appmon/appmon-config-prod.apon</item>
        </properties>
    </bean>

    <append file="/config/appmon/node-rules.xml"/>
</aspectran>
```

In `node-rules.xml`, load `node-config.apon` via `NodeConfigResolver` and register `NodeManagerFactoryBean`:

```xml
<!-- Example node-rules.xml -->
<aspectran>
    <bean class="com.aspectran.aspectow.node.config.NodeConfigResolver">
        <properties>
            <item name="configLocation">/config/appmon/node-config.apon</item>
        </properties>
    </bean>

    <bean id="nodeManager" class="com.aspectran.aspectow.node.manager.NodeManagerFactoryBean" lazyDestroy="true"/>
</aspectran>
```

#### Step 4: Database Connection and Profile Configuration (Database & Profile Configuration)

To run standalone AppMon, execution profiles and database connection details must be configured correctly.

*   **Mandatory Standalone Profile (`appmon.standalone`)**: To run AppMon as an independent solution without Console, specifying the **`appmon.standalone` profile is mandatory**.
*   **Default Profile & H2 Database**: In the default configuration (`aspectran-config.apon`), `appmon.standalone` and embedded `h2` profiles are activated by default, allowing instant development and demo execution without additional DB setups.
*   **RDBMS Switching & Property File Addition**: To connect to a database other than `h2` (e.g., MariaDB, MySQL, PostgreSQL, Oracle), specify the corresponding DB profile (e.g., `mariadb`) and add the matching property file (**`appmon.db-mariadb.properties`**) under the project's `/config/appmon/` directory.

Standalone AppMon typically runs under the `appmon` context name, so execution profiles and connection properties are passed via Java System Properties as follows:

```bash
# Example of running standalone (appmon.standalone) mode with MariaDB
-Daspectran.profiles.base.appmon=appmon.standalone,mariadb -Dappmon.db-mariadb.url=jdbc:mariadb://127.0.0.1:3306/appmon_db -Dappmon.db-mariadb.username=appmon -Dappmon.db-mariadb.password=your-password
```

## 6. Conclusion

Aspectow AppMon can run embedded as an integrated monitoring engine within Aspectow Console, or be easily deployed as a standalone monitoring solution via `/config/appmon/` settings as needed to enhance application transparency and observability.
