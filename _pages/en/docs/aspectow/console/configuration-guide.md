---
title: Aspectow Console Configuration Guide
teaser: A comprehensive configuration guide covering cluster communication modes, APON configuration file specifications, database and Redis environment setups, and Aspectran Bean definitions for Aspectow Console and Node Manager.
subheadline: Aspectow Console
---

## 1. Overview & Configuration Structure

Aspectow Console provides flexible environment configurations using declarative APON (Aspectran Parameter Object Notation) configuration files and Aspectran XML Rule files built on the Aspectran framework.

The configuration files for the Console are divided into node and cluster management (`node-config.apon`), database connection settings (`aspectow-console.db-*.properties`), Redis clustering configuration (`redis.properties`), AppMon monitoring configuration (`appmon-config.apon`), and Aspectran Bean definitions (`node-rules.xml`).

### Key Configuration File Locations (`/config/console/`)

*   **`node-config.apon`**: The core Node Manager configuration file defining cluster identifiers, communication modes (`direct` / `gateway`), security encryption keys, and pulse intervals.
*   **`node-rules.xml`**: The Aspectran XML definition file registering core components such as `NodeConfigResolver`, `NodeManagerFactoryBean`, `RemoteNodeManager`, `RemoteCommandManager`, and `RemoteSchedulerManager`.
*   **`aspectow-console.db-*.properties`**: Database connection property files supporting H2, MariaDB, MySQL, Oracle, and Supabase for the Console.
*   **`redis-*.properties`**: Redis connection pool configuration file used as a Pub/Sub message bridge when running in Gateway cluster mode.
*   **`appmon-config.apon`**: Configuration file for data exporters and rollup intervals for the integrated AppMon monitoring engine.

## 2. Node & Cluster Configuration (`node-config.apon`)

`node-config.apon` is the core configuration file used by the Node Manager (`NodeManager`) to construct clusters and determine communication topology.

### APON Configuration Example

```apon
# Global Cluster Configuration
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

### Parameter Specifications

#### `cluster` Section (Global Cluster Settings)

*   **`id`** (`string`, required): Unique cluster identifier. Nodes sharing the same cluster ID are grouped together.
*   **`mode`** (`string`, required): Specifies the cluster communication topology.
    *   `direct`: Performs direct HTTP/WebSocket communication between nodes or between the Console and nodes.
    *   `gateway`: Performs bridged packet communication via a Redis Pub/Sub message bus, optimized for dynamic autoscaling and private network infrastructure control.
*   **`secret`** (`object`, optional): Configures security password (`password`) and Salt (`salt`) for authentication and encryption of control packets between nodes and the Console.
*   **`pulseInterval`** (`integer`, optional): Interval (in milliseconds, default: `50000`ms) for collecting and updating node heartbeats.
*   **`scheduler.releasedOnUnlock`** (`boolean`, optional): Determines whether a node voluntarily surrenders scheduler job ownership upon releasing a cluster lock.
*   **`endpoint.mode`** (`string`, optional): Specifies endpoint acquisition mode (`auto`, `websocket`, `polling`).

#### `group` Section (Server Group Definition)

Defines group information used to render nodes under separate group tabs on the Console UI in `gateway` mode.
*   **`id`**: Group identifier (e.g., `backend-api`, `frontend-web`)
*   **`title`**: Friendly group title displayed on Console UI tabs (e.g., `Backend API Service Group`)
*   **`description`**: Detailed description of the server group

#### `node` Section (Individual Node Definition)

Declares statically managed nodes. In self-registration (Autoscaling) mode, nodes can dynamically join the cluster without static `node` declarations.
*   **`id`**: Unique node identifier (e.g., `node01`)
*   **`group`**: Group ID to which the node belongs
*   **`title`**: Friendly node title displayed on console UI node cards

## 3. Cluster Communication Topology Guide (Direct vs. Gateway)

Aspectow Console provides two cluster communication architectures to suit your network infrastructure environment and cluster scale.

### Direct Communication Mode (`mode: direct`)

The Console server connects directly to the IP address and port endpoints of each worker node via HTTP and WebSocket.

*   **Features & Advantages**: Lightweight and fast to set up for single or small-scale clusters without installing external message brokers like Redis.
*   **Recommended Environments**: Ideal for fixed IP environments, single data center internal networks, or small server fleets.

### Gateway Communication Mode (`mode: gateway`)

The Console and worker nodes securely exchange management packets over a Redis Pub/Sub message bus.

*   **Features & Advantages**: Eliminates connectivity issues even when worker nodes operate behind firewalls or private IPs, maintaining cluster state autonomously when nodes dynamically scale up or down in cloud autoscaling environments.
*   **Recommended Environments**: Recommended for Kubernetes, AWS Auto Scaling Groups, and multi-region distributed server environments.

## 4. Redis Clustering Configuration (`redis.properties`)

When selecting `gateway` communication mode, Redis connection details used as the message bridge are configured via a single, concise property: **`aspectow.redis.uri`**, following the Lettuce-based standard `RedisURI` format.

### Property Configuration Example (`redis-dev.properties` / `redis-prod.properties`)

```properties
# Development Environment Example (redis-dev.properties)
aspectow.redis.uri=redis://127.0.0.1:6379/0

# Production Environment Example (redis-prod.properties with authentication and DB index)
aspectow.redis.uri=redis://:your-redis-password@10.0.0.3:6379/5
```

### `aspectow.redis.uri` Format Specification

*   **Basic Format**: `redis://{host}:{port}/{dbIndex}` (e.g., `redis://localhost:6379/0`)
*   **With Password Authentication**: `redis://:{password}@{host}:{port}/{dbIndex}` (e.g., `redis://:mySecretPassword@redis-server:6379/2`)
*   **With User Credentials**: `redis://{username}:{password}@{host}:{port}/{dbIndex}`

Console and worker nodes parse this URI via `RedisConnectionPoolConfig` and dynamically create a `Lettuce` client connection pool to activate the high-performance Pub/Sub messaging bus. You can safely isolate environments by specifying `redis-dev.properties` or `redis-prod.properties` based on active Profiles.

## 5. Console Database Configuration (`aspectow-console.db-*.properties`)

Aspectow Console persistently stores admin user accounts, RBAC permissions, Vault security tokens, and monitoring pre-aggregated statistics in a database. Configure connection details by editing the database property file corresponding to your environment (H2, MariaDB, MySQL, Oracle, Supabase).

### MariaDB Property Example (`aspectow-console.db-mariadb.properties`)

```properties
aspectow-console.db-mariadb.url=jdbc:mariadb://127.0.0.1:3306/aspectow_console?characterEncoding=UTF-8
aspectow-console.db-mariadb.username=console_user
aspectow-console.db-mariadb.password=PBE(EncryptedPasswordHere)
```

Activate the desired database profile using a Java system property:
`-Daspectran.profiles.base.console=mariadb`

## 6. Aspectran XML Bean Configuration (`node-rules.xml`)

Node Manager and remote control managers are activated as Aspectran Beans via `node-rules.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>

    <!-- APON Configuration Loader based on Active Profile -->
    <bean class="com.aspectran.aspectow.node.config.NodeConfigResolver">
        <properties profile="direct">
            <item name="configLocation">/config/console/node-config-test-direct.apon</item>
        </properties>
        <properties profile="!direct">
            <item name="configLocation">/config/console/node-config-test-gateway.apon</item>
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

Through this bean configuration, `RemoteNodeManager`, `RemoteCommandManager`, and `RemoteSchedulerManager` are activated to seamlessly connect Console web UI requests to the node message bus and asynchronous processing pipelines.
