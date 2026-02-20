---
format: plate solid article
title: AppMon Message Protocol Specification
teaser: Defines the message format and communication rules for real-time data exchange between the AppMon server and clients.
sidebar: toc
---

{% capture info_message %}
The protocol employs a highly readable text-based structure for ease of debugging while providing flexible extensibility through the use of sub-types.
{% endcapture %}
{% include alert.liquid info=info_message %}

## 1. Server-to-Client Message Structure (Push/Broadcast)

All data messages sent from the server to the client consist of four primary fields using a colon (`:`) as a delimiter.

```text
{instanceName}:{exporterType}[/{subType}]:{exporterName}:{content}
```

### 1.1 Field Definitions

| Field | Description | Remarks |
| :--- | :--- | :--- |
| **instanceName** | Identifier of the server instance that generated the data | e.g., `appmon`, `server1` |
| **exporterType** | Broad category of the data (Base Type) | `log`, `event`, `data`, `metric` |
| **subType** | (Optional) Specific kind or state of the data | Located after `/`. e.g., `p` (previous logs), `chart` (chart data) |
| **exporterName** | Unique resource name within the given type | e.g., `activity`, `session`, `app.log` |
| **content** | The actual data payload | String or JSON format |

### 1.2 Client-side Parsing and Mapping Rules

1.  **Field Separation**: Split the message based on the colon (`:`) delimiter. Since the `content` may contain colons, locate only the first three indices first.
2.  **Type Analysis**: Check the `exporterType` field for the `/` character to separate the base type and the **subType**.
3.  **Identifier Generation (exporterKey)**: Combine the fields into `instanceName:pureType:exporterName` to create the **exporterKey**. This key serves as a unique identifier to map data to UI elements (console boxes, charts, etc.).
4.  **Data Processing**: Perform appropriate UI logic (e.g., prepend, append, or update chart) based on the `subType`.

---

## 2. Specification by Exporter Type

### 2.1 Log (Log)
Handles real-time log streaming and historical log data. The content is plain text.

*   **Real-time Log (LOG)**: No specific sub-type.
    *   Format: `server1:log:root.log:Log message content...`
*   **Previous Log (PREVIOUS)**: Uses the `p` sub-type.
    *   Format: `server1:log/p:root.log:Log message content...`
    *   The client recognizes this to prepend the data to the top of the console box.

### 2.2 Visualization Data (Data)
Transmits statistical data for rendering charts and graphs.

*   **Chart Data (CHART)**: Uses the `chart` sub-type; content is in JSON format.
    *   Format: `server1:data/chart:activity:{"labels":[...], "data1":[...], "rolledUp":false}`
    *   Provides a flattened JSON structure for direct data access.

### 2.3 Event (Event)
Transmits system status changes or user session events. Content is in JSON format.

*   Format: `server1:event:session:{"numberOfActives":10, "createdSessions":[...], ...}`

### 2.4 Metric (Metric)
Transmits single-value performance indicators. Content is in JSON format.

*   Format: `server1:metric:jvm.memory:{"format":"{used}/{max}", "data":{"used":"512MB", "max":"2GB"}}`

---

## 3. Client-to-Server Command Structure (Pull/Request)

Used when the client requests a specific action from the server. Based on the **APON (Aspectran Object Notation)** format, consisting of a set of `key:value` pairs delimited by semicolons (`;`).

The `CommandOptions` class on the server parses this string into an object and determines the action to perform based on the value of the `command` key.

### 3.1 Command Format
```text
command:{commandName};{optionKey1}:{value1};{optionKey2}:{value2}
```

### 3.2 Key Commands and Option Parameters

| Command (`command`) | Description | Available Option Parameters |
| :--- | :--- | :--- |
| **refresh** | Explicitly request the latest state for charts or metrics | `instance`, `dateUnit`, `dateOffset` |
| **loadPrevious** | Request historical log data from the top of a console box | `instance`, `logName`, `loadedLines` |
| **join** | Start a real-time monitoring session and join instance groups | `instancesToJoin`, `timeZone` |

### 3.3 Command Examples

*   **Requesting Previous Logs**:
    `command:loadPrevious;instance:appmon;logName:root.log;loadedLines:500`
    *(Description: Request data prior to the 500 lines already loaded for root.log on the appmon instance.)*

*   **Refreshing Specific Instance Data**:
    `command:refresh;instance:server1;dateUnit:hour`
    *(Description: Request re-aggregated data for the server1 instance on an hourly basis.)*

*   **Joining a Monitoring Session**:
    `command:join;instancesToJoin:server1,server2;timeZone:Asia/Seoul`
    *(Description: Join monitoring groups for two instances and provide client time zone info.)*

---

## 4. Extension Guide

To add a new data format or state:
1.  Select the most appropriate base type from the existing `exporterType` list.
2.  Define a new `subType` after the `/` character if necessary.
    *   e.g., `log/e` for categorizing error logs.
    *   e.g., `event/alert` for real-time alert notifications.
3.  Add the corresponding processing logic for the new `subType` in the client's `processMessage` dispatch logic.
