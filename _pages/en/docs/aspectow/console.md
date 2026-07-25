---
title: Aspectow Console Overview & Integrated Architecture
teaser: Aspectow Console is a next-generation control system that centrally integrates node clusters, schedulers, real-time monitoring, security Vault, and developer tools across the Aspectran-based application server ecosystem.
subheadline: Aspectow Console
---

## 1. Background and Vision of Aspectow Console

As the Aspectran framework and Aspectow server ecosystem expanded into enterprise environments, the need arose to systematically manage multiple distributed nodes (Node Clusters), complex batch schedulers, real-time performance metrics, and security encryption keys beyond single server instances.

Previously, monitoring functionality was provided as a separate solution called `Aspectow AppMon`. However, in production environments, merely observing system status was insufficient; there was a critical need for **integrated control capabilities**, such as dispatching remote commands to troubled nodes, manually re-executing scheduler jobs, or immediately altering the status of encryption tokens.

Aspectow Console was created to fully satisfy these requirements by integrating AppMon's high-performance real-time monitoring engine internally, while unifying distributed node control, a remote command center, security Vault management, runtime framework diagnostics, and user governance features into a single web console interface.

## 2. Integrated Architecture & System Layers

### Self-Contained Every-Node Console Architecture

Aspectow Console adopts a **Self-Contained Every-Node Console Architecture** that eliminates the need to deploy and run a separate, dedicated administration server (Admin Server/DMGR). Every server node in the cluster embeds the management console natively, completely resolving single points of failure (SPOF) associated with dedicated admin servers. Administrators can monitor and control the entire cluster through the web interface of any active node, providing exceptionally high availability.

Aspectow Console achieves high responsiveness and low monitoring overhead through this node-embedded control mechanism, structured across the following system layers:

### Control Node (Console Web Context) Layer

Console acts as a central Control Node on top of the Aspectran application server. Built on a modern HTML5 interface powered by Thymeleaf templates and responsive web design, it delivers a seamless management experience across both desktop and mobile environments.

### Cluster Communication & Node Manager (NodeManager Architecture)

Console communicates with all worker nodes in the cluster via the Node Manager engine implemented in the `com.aspectran.aspectow.node` package.

*   **`NodeManager` & `NodeRegistry`**: Collects and maintains node health (Pulse/Heartbeat), system profiles, heap memory metrics, and running application information across all cluster nodes within the registry.
*   **`RemoteNodeManager`**: Receives node control requests from the web UI to relay individual node ping tests, detailed profile inspection, and bulk control actions (Graceful Shutdown, Hard Stop, Config Reload, etc.).
*   **`RemoteCommandManager`**: Interfaces with the web UI Command Center to dispatch CLI/Shell commands to target nodes and bridges live StdOut and StdErr streaming data back to the UI.
*   **`RemoteSchedulerManager`**: Queries distributed Aspectran Scheduler services across cluster nodes, relays Pause/Resume control packets, and streams job execution logs in real time.

### Communication Modes & Message Pipelines (`direct` vs `gateway`)

Console supports two cluster communication modes tailored to your infrastructure environment:
*   **Direct Mode**: Performs direct HTTP/WebSocket communication between Console and nodes without external message brokers, ideal for small-scale and fixed-IP environments.
*   **Gateway Mode (Redis Pub/Sub)**: Utilizes a Redis message bus powered by `RedisConnectionPoolConfig` to exchange messages. It monitors and controls cluster state seamlessly even when nodes dynamically join or leave in private networks, Kubernetes, or auto-scaling environments.

### AppMon Integrated Monitoring Engine

The AppMon module is embedded as a first-class citizen inside the Console:
*   **Embedded Execution Mode**: The AppMon engine is activated alongside the Console server, allowing real-time traffic flow, session states, and log tailing without deploying separate dedicated monitoring servers.
*   **Standalone AppMon Engine Compatibility**: Supports integration with existing standalone Aspectow AppMon servers. Console can register external AppMon endpoints to centrally observe multi-domain monitoring views.

### Data Persistence & Security Vault Layer

Console securely stores administrator accounts, Role Permissions, system encryption tokens, and scheduler execution histories.
*   **PBE (Password-Based Encryption) Protection**: The Vault module encrypts sensitive system passwords and tokens using PBE algorithms before writing to storage.
*   **Pre-aggregated Monitoring DB**: AppMon monitoring metrics are pre-aggregated in 5-minute, 1-hour, and 1-day intervals and saved to the database, ensuring dashboard queries remain instant even under heavy traffic.

## 3. Governance & Fine-Grained Access Control (Governance & Security)

For secure management in production environments, Aspectow Console includes a sophisticated Role-Based Access Control (RBAC) permission system.

### Built-in Roles

*   **SUPER_ADMIN (Super Administrator)**: Exercises full permissions to change system configurations, manage user accounts, execute remote commands, issue Vault tokens, and perform cluster node bulk controls.
*   **ADMIN (Operational Administrator)**: Performs cluster node status inspection, schedule job pause/resume, monitoring, and real-time log viewing.
*   **DEMO / MONITOR_VIEW (Observer)**: A safe read-only permission that prevents data modification or system control, granting access only to monitoring dashboards and read-only viewers.

### Fine-Grained Permissions

In addition to roles, granular permissions can be granted or revoked per feature:
*   `NODE_MANAGE`: Permission for cluster node bulk control and status modification.
*   `COMMAND_EXECUTE`: Permission to execute shell/console commands via the Remote Command Center.
*   `MONITOR_VIEW`: Permission to access real-time traffic, session, and log monitoring.
*   `USER_MANAGE`: Permission to register, edit, assign roles to accounts, and reset passwords.

## 4. Relationship with Standalone AppMon & Usage Scenarios

The advent of Aspectow Console does not replace standalone `Aspectow AppMon`. Both technologies complement each other based on operational needs:

*   **When Standalone Monitoring is Needed**: When you purely want event and log monitoring for a specific application without cluster control features, `Aspectow AppMon` can be deployed as a lightweight standalone module.
*   **When Integrated Management & Control is Needed**: When clustering multiple server instances and requiring integrated control—including scheduler management, remote execution, and security tokens—`Aspectow Console` is deployed.

Refer to the next documents, [Aspectow Console Feature & Screen Guide](/en/docs/aspectow/console/feature-guide/) and [Aspectow Console Configuration Guide](/en/docs/aspectow/console/configuration-guide/), to explore screen features and configuration details in depth.
