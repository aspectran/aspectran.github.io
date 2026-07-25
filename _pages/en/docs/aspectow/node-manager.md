---
title: Aspectow Node Manager Guide
teaser: A detailed guide to the core Control Plane library that organically binds distributed multi-node clusters and controls routing and relay packets.
subheadline: Aspectow
---

## 1. Overview

**Aspectow Node Manager** (`aspectow-node`) is a core Control Plane library designed to bind multiple distributed nodes into an organic, unified cluster.

Moving beyond traditional single-server WAS management, Aspectow Node Manager adopts Redis as a central message broker and metadata repository, completely decoupling node-console dependencies. This guarantees flexible scalability and high observability even in cloud and containerized environments where nodes dynamically scale up and down.

## 2. Core Capabilities

Aspectow Node Manager performs three essential roles to ensure cluster stability:

### 2.1. Node Lifecycle and Pulse Monitoring
Manages the lifecycle of all participating nodes. Nodes register detailed metadata (`NodeInfo`) upon startup and periodically send a pulse (survival signal). Aspectow Console observes these signals to track real-time active node states (Live, Paused, Dead).

### 2.2. Transparent Message Relay
Relays control commands and telemetry data packets between Console and nodes or between nodes. Adopting a **Transparent Relay** model based on Redis Pub/Sub, the relaying agent forwards messages as text without parsing payloads, eliminating latency even in high-throughput environments.

### 2.3. Shared Secret & Encrypted Token Security
Enforces **Shared Secret**-based cryptographic verification to ensure communication only occurs between trusted nodes. Tokens feature short validity periods (default 30 seconds) and AES encryption to prevent unauthorized external access.

## 3. Operation Modes Comparison

Aspectow Node Manager supports two operation modes tailored to network topology and scaling requirements:

### 3.1. Gateway Mode (Cloud-Native & Autoscaling)

A modern Cloud-Native architecture utilizing Redis as a message bus and distributed state store.

*   **Autoscaling Optimization**: Nodes automatically generate UUID-based unique identifiers (`Node ID`) upon startup. Perfectly adapts to **Kubernetes (K8s) Pods and AWS Auto Scaling** environments where instances scale dynamically.
*   **Private Network & Firewall Traversal**: Nodes hidden behind firewalls or private IPs (NAT) can be securely controlled without opening external ports.
*   **Infrastructure Flexibility**: Operates seamlessly across L4/L7 load balancers without requiring URL path routing configurations.

### 3.2. Direct Mode (Static & Fixed Infrastructure)

A static architecture establishing direct P2P HTTP/WebSocket connections between nodes without Redis.

*   **Target Environment**: Suited for small-scale private networks with fixed node counts and IPs where autoscaling does not occur.
*   **Infrastructure Requirements**: Requires L7 load balancers (e.g., Nginx) configured with path-based routing (e.g., `/nodes/node1`).

## 4. Node Identity Resolution Mechanism

Nodes follow autonomous resolution rules to establish identity upon startup without manual intervention:

### 4.1. Group ID Resolution
1.  **System Property**: `-Daspectow.node.group` takes highest precedence.
2.  **APON Config**: Automatically resolves the group ID defined in `node-config.apon`.
3.  **Default**: Defaults to `group1` if omitted.

### 4.2. Node ID Resolution
1.  **System Property**: `-Daspectow.node.id` takes highest precedence.
2.  **Dynamic Generation (Gateway Mode)**: Generates a **UUID-based unique ID** dynamically to prevent collisions during autoscaling.
3.  **Default (Direct Mode)**: Defaults to fixed `node1`.

## 5. Redis Dynamic Metadata Management & Automatic Cleanup (GC)

In Gateway mode, a dynamic metadata management system keeps management dashboards updated even as nodes change continuously:

*   **Automatic Registration**: Nodes register telemetry definitions (Group $ightarrow$ Node $ightarrow$ App) in central Redis upon startup.
*   **Automatic Cleanup (GC)**: When nodes terminate or scale down, Pulse monitoring detects missing signals and automatically purges stale metadata from Redis.

## 6. Configuration Examples & XML Rules

### 6.1. Gateway Mode Setup (`/config/console/node-config.apon`)

```apon
cluster: {
    id: cloud-cluster1
    mode: gateway
    secret: {
        password: "your-cluster-secret-password"
    }
}
group: {
    id: backend-api
    title: Backend API Group
}
```

### 6.2. Direct Mode Setup (`/config/console/node-config.apon`)

```apon
cluster: {
    id: static-cluster1
    mode: direct
}
node: {
    id: node01
    group: group1
    title: Primary Server 01
}
```

### 6.3. Aspectran XML Bean Definitions (`node-rules.xml`)

```xml
<aspectran>
    <bean class="com.aspectran.aspectow.node.config.NodeConfigResolver">
        <properties>
            <item name="configLocation">/config/console/node-config.apon</item>
        </properties>
    </bean>

    <bean id="nodeManager" class="com.aspectran.aspectow.node.manager.NodeManagerFactoryBean" lazyDestroy="true"/>
    <bean id="remoteNodeManager" class="com.aspectran.aspectow.node.management.nodes.RemoteNodeManager"/>
    <bean id="remoteCommandManager" class="com.aspectran.aspectow.node.management.commands.RemoteCommandManager"/>
</aspectran>
```

## 7. Conclusion

Aspectow Node Manager transforms standalone servers into an **organically connected and securely controlled intelligent cluster system**.
