---
format: plate solid article
title: Aspectow AppMon
teaser: Aspectow AppMon is a lightweight, real-time monitoring solution for applications based on the Aspectran framework.
sidebar: toc
---

## 1. Overview

Aspectow AppMon is a lightweight, real-time monitoring solution for applications based on the Aspectran framework. It is designed to minimize the impact on application performance while allowing real-time observation of various events, logs, and system metrics that occur during operation through a web UI.

It can be easily integrated into Aspectran applications without complex setup, helping developers and operators to intuitively understand the internal workings of the application and quickly diagnose problems.

## 2. Key Features

- **Real-time Monitoring**: Streams data generated from the server in real-time to the UI using WebSocket or Long-Polling methods.
- **Lightweight and Easy Integration**: Can be simply registered as an Aspectran bean in the target application, minimizing performance degradation by using minimal resources.
- **Dynamic Monitoring**: Utilizes Aspectran's AOP features to dynamically track the execution of specific transactions (Activity) and measure performance without code changes.
- **Support for Various Data Sources**:
  - **Events**: Tracks and counts major application events such as HTTP request processing and session creation/destruction.
  - **Metrics**: Collects various system metrics like JVM heap memory usage, Undertow thread pool status, and HikariCP connection pool status.
  - **Logs**: Tails specified log files in real-time and displays them on the UI.
- **Data Persistence**: Periodically saves key event count data to an embedded H2 database, ensuring that statistics are maintained even after an application restart.
- **Flexible Configuration**: Allows flexible definition of which instances and what data to monitor through an APON (Aspectran Object Notation) based configuration file.

## 3. Core Architecture

Aspectow AppMon consists of the following main components:

- **AppMonManager**: The core engine that manages the overall lifecycle and configuration of AppMon.
- **Exporter**: Responsible for collecting data from specific data sources (logs, metrics, events).
  - **Reader**: Implements the specific method for how the `Exporter` collects data (e.g., querying JVM metrics via JMX, reading log files from the filesystem).
- **PersistManager**: Handles the persistence of collected data (mainly event counts) to the database.
  - **CounterPersistSchedule**: Periodically executed by a scheduler to save counter data to the DB.
- **ExportService**: Responsible for communication with the client (web UI), transmitting collected data via WebSocket or Polling.
- **Activity (Front/Backend)**: Acts as a controller that handles HTTP requests from the web UI or external agents.

## 4. Getting Started (Quick Guide)

1.  **Add Dependency**: Add the `aspectow-appmon` dependency to your `pom.xml`.
2.  **Register Factory Bean**: Register `AppMonManagerFactoryBean` as a component in your Aspectran configuration file. This factory bean activates all of AppMon's features.
3.  **Create Configuration File**: Create an `appmon-config.apon` file to define in detail the instances, events, metrics, and logs to be monitored.
4.  **Run Application**: When you run your Aspectran application, AppMon will start up with it.
5.  **Access Web UI**: Access the provided URL to start real-time monitoring.

## 5. Data Persistence Structure

Aspectow AppMon saves event counting data to a database to maintain statistics. By default, it uses an embedded H2 database, and the schema is as follows:

- **`appmon_event_count`**
  - Stores event count data aggregated by minute, hour, day, month, and year.
  - The data in this table is used to draw statistical charts.
  - Key Columns:
    - `domain`, `instance`, `event`: Identifies which event is being counted.
    - `datetime`: The aggregated time unit (e.g., `yyyyMMddHHmm`).
    - `total`: The cumulative total count.
    - `delta`: The count that occurred during that time unit.
    - `error`: The error count that occurred during that time unit.

- **`appmon_event_count_last`**
  - Stores the last count state for each event.
  - When the application restarts, it reads the data from this table to restore the counters, ensuring that statistics are not lost.
  - It has a similar structure to the `appmon_event_count` table but has a `reg_dt` column indicating the last registration time instead of `datetime`.

## 6. How to Configure AppMon

All of AppMon's behavior is configured through the `appmon-config.apon` file. Furthermore, AppMon has a flexible architecture where default settings are built into the library, and users can override them in the project's `/config/appmon` directory.

### 6.1. `appmon-config.apon` File Details

This file consists of several sections that define what to monitor and how.

#### Main Configuration Sections

- **`counterPersistInterval`**: Sets the interval, in minutes, for saving aggregated event counter data to the database. If not set, it defaults to 5 minutes.
- **`pollingConfig`**: Configures the behavior when a client connects via Long-Polling (`pollingInterval`, `sessionTimeout`, etc.).
- **`domain`**: Defines and logically groups the server instances to be monitored. Each `domain` points to a single monitoring target server and contains the endpoint information for connecting to it.
- **`instance`**: Defines the individual application or component unit to be monitored. Most of the detailed settings are located under this section.

#### `instance` Detailed Settings

Under the `instance` section, you can configure `event`, `metric`, and `log` to collect the desired data.

- **`event` Settings**:
  - `name`: Specifies a predefined event type, such as `activity` or `session`.
  - `target`: Specifies the target to be monitored.
    - For `activity`: The name of Aspectran's ActivityContext (e.g., `jpetstore`).
    - For `session`: The servlet context path (e.g., `tow.server/jpetstore`).
  - `parameters`: Sets a Pointcut for `activity` events to include or exclude specific request paths.

- **`metric` Settings**:
  - `reader`: Specifies the full class name of the `MetricReader` implementation that will collect the metrics. This allows for easy addition of custom metric collectors.
    - Example: `com.aspectran.appmon.exporter.metric.jvm.HeapMemoryUsageReader`
  - `parameters`: Sets parameters to be passed to the `reader` class (e.g., `poolName` for HikariCP).

- **`log` Settings**:
  - `file`: Specifies the path to the log file to be tailed.
  - `lastLines`: Specifies the number of last lines of the log to display on initial UI access.

#### Configuration Example (`appmon-config.apon`)

```apon
# DB persistence interval (in minutes), 0 to disable
counterPersistInterval: 10

# Define monitored server targets
domain: {
    name: backend1
    title: Server-1
    endpoint: {
        mode: auto
        url: /appmon/backend1
    }
}
domain: {
    name: backend2
    title: Server-2
    endpoint: {
        mode: auto
        url: /appmon/backend2
    }
}

# Define monitoring instance details
instance: {
    name: jpetstore
    title: JPetStore
    event: {
        name: activity
        target: jpetstore
        parameters: {
            +: /**
        }
    }
    event: {
        name: session
        target: tow.server/jpetstore
    }
    metric: {
        name: cp-jpetstore
        title: CP-jpetstore
        description: Shows the JDBC connection pool usage status
        reader: com.aspectran.appmon.exporter.metric.jdbc.HikariPoolMBeanReader
        parameters: {
            poolName: jpetstore
        }
        sampleInterval: 50
        exportInterval: 900
    }
    log: {
        name: app
        title: JPetStore App
        file: /logs/jpetstore.log
        lastLines: 1000
        sampleInterval: 300
    }
}
```

### 6.2. Step-by-Step Configuration Guide

AppMon's configuration is based on the concept of 'override', and the typical configuration steps are as follows.

#### Step 1: Define Monitoring Targets

> **File to modify: `/config/appmon/appmon-config.apon`**

First and foremost, you need to create the `appmon-config.apon` file described above in the project's `/config/appmon/` directory and specify the `instance`, `event`, `metric`, `log`, etc., to be monitored.

#### Step 2: Select DB Type and Configure Connection

> **Configuration method: Java System Properties**

AppMon uses Java system properties to specify which database to use for storing monitoring data.

1.  **Select DB Profile**: Use the `-Daspectran.profiles.base.appmon` property to select one of `h2`, `mariadb`, `mysql`, or `oracle`.
2.  **Provide DB Connection Info**: Pass the connection details for the selected database as separate system properties.

```bash
# Example of passing system properties on Java startup (MariaDB)
-Daspectran.profiles.base.appmon=mariadb \
-Dappmon.db-mariadb.url=jdbc:mariadb://127.0.0.1:3306/appmon \
-Dappmon.db-mariadb.username=appmon \
-Dappmon.db-mariadb.password=your-password
```

#### Step 3: Configure UI Assets and JSP

> **Related files: `appmon-assets.xml`, `webapps/appmon/WEB-INF/jsp/appmon/**`**

-   **`appmon-assets.xml`**: Determines where to load the AppMon UI's static assets, like CSS and JavaScript, based on the profile (`dev`/`prod`). It can be set to load from a local source or a CDN.
-   **JSP Files**: The JSP files that make up the AppMon UI are not included in the library **to allow users to directly modify the UI for their own use**. Therefore, you must copy the contents of the original project's `/webapps/appmon/WEB-INF/jsp/appmon` directory to the same path within your own project.

#### Step 4: Set the Domain Identifier (Production Environment)

> **Configuration method: Java System Property**

In a production environment where you might be monitoring multiple server groups, you need to tell the current instance which domain it belongs to using the `-Dappmon.domain` system property. This value must match one of the `domain` names defined in `appmon-config.apon`.

```bash
# Specify that the current instance belongs to the 'prod-cluster' domain
-Dappmon.domain=prod-cluster
```

## 7. Conclusion

Aspectow AppMon is a powerful tool that greatly enhances the transparency and observability of Aspectran applications. It can be an optimal choice when a complex APM solution is burdensome, and you want to look into the internal state of your application in real-time with minimal setup to detect performance issues early.
