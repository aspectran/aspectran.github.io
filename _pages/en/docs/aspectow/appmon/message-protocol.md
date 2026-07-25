---
title: AppMon Message Protocol Specification
teaser: Defines message formats and communication protocols for real-time telemetry data transmission and control packets between AppMon server and client.
subheadline: Aspectow AppMon
---

{% capture info_message %}
This protocol adopts a human-readable text-based structure and declarative APON (Aspectran Object Notation) inline format, ensuring easy debugging and high scalability across Gateway bridges and multi-node environments.
{% endcapture %}
{% include alert.liquid info=info_message %}

## 1. Server-to-Client Data Message Structure (Push/Broadcast)

All data and metric messages pushed from server to client consist of key fields separated by node prefixes and colons (`:`).

```text
{nodeId}:{exporterType}[/{subType}]:{exporterName}:{content}
```

### 1.1 Field Definitions

| Field | Description | Remarks |
| :--- | :--- | :--- |
| **nodeId** | Identifier of the physical/logical server node generating data | e.g., `node01`, `appmon-demo-node1` |
| **exporterType** | Base type classification of telemetry data | `log`, `event`, `data`, `metric` |
| **subType** | (Optional) Specific subtype or state indicator | Located after `/`. e.g., `p` (previous log), `chart` (chart data) |
| **exporterName** | Unique resource name within the specified type | e.g., `activity`, `session`, `app` |
| **content** | Actual telemetry data payload | Text, JSON, or numerical value |

### 1.2 Client Parsing & Mapping Rules

1.  **Node Identifier Extraction**: Identifies the remote node sending packets via the leading `{nodeId}:` prefix.
2.  **Type Analysis**: Locates the `/` character in `exporterType` to separate base type from `subType`.
3.  **Key Generation (exporterKey)**: Constructs a unique **exporterKey** matching `nodeId:pureType:exporterName`, which uniquely identifies UI elements (console boxes, charts).
4.  **Data Processing**: Executes UI rendering logic (e.g., prepending past logs, refreshing charts) based on `subType`.

## 2. Exporter Type Specifications

### 2.1 Log (Log)
Delivers real-time log streams and historical log records as plain text.

*   **Real-time Log (LOG)**: Standard log without subtype.
    *   Format: `node01:log:app:Log line content...`
*   **Previous Log (PREVIOUS)**: Uses subtype `p`.
    *   Format: `node01:log/p:app:Historical log content...`
    *   Clients prepend this content to the top of the log box.

### 2.2 Visual Data (Data)
Delivers statistical aggregation data for chart rendering.

*   **Chart Data (CHART)**: Uses subtype `chart` with JSON payload.
    *   Format: `node01:data/chart:activity:{"labels":[...], "data1":[...], "rolledUp":false}`

### 2.3 Event (Event)
Delivers system status changes or user session events as JSON payloads.

*   Format: `node01:event:session:{"numberOfActives":10, "createdSessions":[...], ...}`

### 2.4 Metric (Metric)
Delivers single metric values as JSON payloads.

*   Format: `node01:metric:heap:{"format":"{used}/{max}", "data":{"used":"512MB", "max":"2GB"}}`

## 3. Client-to-Server Command Structure (Pull/Request)

Protocol used by clients to request specific operations or data from the server. Formatted as semicolon-delimited (`;`) `key:value` pairs based on **APON (Aspectran Object Notation)** inline syntax.

The server's `CommandOptions` class parses this string into parameter objects and executes tasks according to the `command` key value.

### 3.1 Command Transmission Format
```text
command:{commandName};nodeId:{nodeId};{optionKey1}:{value1};{optionKey2}:{value2}
```

### 3.2 Key Commands & Parameter Specifications

| Command (`command`) | Description | Available Parameters |
| :--- | :--- | :--- |
| **`subscribe`** | Subscribes to monitoring events for specified nodes/apps | `nodeId`, `nodeToSubscribe`, `appsToSubscribe`, `timeZone` |
| **`established`** | Signals connection establishment and synchronizes heartbeat handshake | `nodeId`, `nodeToSubscribe`, `appsToSubscribe` |
| **`unsubscribe`** | Unsubscribes from monitoring events for specified nodes/apps | `nodeId`, `nodeToSubscribe`, `appsToSubscribe` |
| **`refresh`** | Explicitly re-requests latest data for charts or metrics | `nodeId`, `appId`, `dateUnit`, `dateOffset` |
| **`loadPrevious`** | Requests historical log data at the top of log boxes | `nodeId`, `appId`, `logId`, `loadedLines` |
| **`focus`** | Switches dashboard focus to a specific node/app | `nodeId`, `appId` |
| **`ping`** | Checks WebSocket liveness and requests refreshed pong tokens | `nodeId` |

### 3.3 Modern Command Examples

*   **Monitoring Event Subscription (`subscribe`)**:
    ```text
    command:subscribe;timeZone:Asia/Seoul;nodeToSubscribe:node01;appsToSubscribe:jpetstore;nodeId:node01
    ```
    *(Description: Subscribes to telemetry events for jpetstore on node01 while sending client time zone)*

*   **Connection Establishment Handshake (`established`)**:
    ```text
    command:established;nodeToSubscribe:node01;appsToSubscribe:jpetstore;nodeId:node01
    ```
    *(Description: Confirms physical WebSocket readiness and finalizes active subscription)*

*   **Load Previous Logs (`loadPrevious`)**:
    ```text
    command:loadPrevious;nodeId:node01;appId:jpetstore;logId:app;loadedLines:300
    ```
    *(Description: Requests historical log lines prior to the 300 lines already loaded for jpetstore app log on node01)*

*   **Refresh Analytics Chart Data (`refresh`)**:
    ```text
    command:refresh;nodeId:node01;appId:jpetstore;dateUnit:hour
    ```
    *(Description: Requests re-aggregated metric data grouped by hour for jpetstore on node01)*

*   **Heartbeat Liveness Ping (`ping`)**:
    ```text
    command:ping
    ```
    *(Description: Sends periodic ping packets to keep connection alive and refresh security tokens)*

## 4. Control Messages & Gateway Bridge Packets

When exchanging heartbeat liveness checks, subscription confirmations, and node cluster events between server and client, system control messages prefixed with a control indicator (`:`) are used. Appended to the node identifier, actual runtime packets are transmitted in the **`{nodeId}::...`** format.

### 4.1 Actual Control Packet Transmission Traces

*   **Ping / Pong Packets**:
    *   **Client Request (`Ping`)**: `command:ping`
    *   **Server Response (`Pong`)**: `node1::pong:J5qdjrezDfBoF7xjTihK_RLBDeeNHzxlFMsnpg2_czbcqyhVNiq3FaQI7ewzTLesyUmrdjjfUM0`
    *(Description: Pong response returned from node1 containing an updated security session token)*

*   **Subscription Confirmation (`Subscribed`)**:
    *   **Server Response**: `node1::subscribed:alive`
    *(Description: Confirms monitoring subscription for node1 is complete and the node is active)*

*   **Cluster Dynamic Node Join Event (`Node Joined`)**:
    *   **Server Broadcast**: `node1::node:joined:{"id":"node2","group":"group1","title":"Node 2"}`
    *(Description: Event broadcast to clients when a new node joins dynamically in Gateway mode)*

*   **Node Status Change Event (`Node Status Changed`)**:
    *   **Server Broadcast**: `node1::node:statusChanged:{"id":"node2","alive":false}`
    *(Description: Notification packet broadcast when a node terminates or changes lock status)*
