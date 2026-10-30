---
title: "Aspectow AppMon: Real-time Dashboard Guide"
subheadline: Aspectow AppMon
---

Aspectow AppMon provides a powerful real-time dashboard that allows you to grasp the operating status of node groups, server nodes, and application instances at a glance and observe them intuitively.
Beyond a simple listing of metrics, this guide introduces the key components and usage methods of the AppMon dashboard, which visually and dynamically expresses activities occurring within the system.

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/appmon-v4-dashboard-dark.png" alt="AppMon Dashboard Screenshot" %}

## 1. 3-Tier Intelligent Tab Navigation (Group - Node - App)
AppMon provides a 3-tier hierarchical tab navigation system consisting of Groups, Nodes, and Applications to seamlessly monitor large-scale distributed architectures and microservices.

*   **Node Group Tabs (Group Tabs)**:
    *   Logically separates and manages system domains by server clusters or business units (e.g., Web group, API group, etc.).
    *   Each group tab features a real-time lightning indicator on its right side to immediately signal communication health: normal connection (green), transient disconnection (orange), or failure (red).
    *   Selecting a group tab automatically enters the **Group View**, which aggregates monitoring streams across all member nodes to provide a holistic overview of the entire cluster.
*   **Node Tabs (Node Tabs)**:
    *   Switches between physical or logical server nodes (`Node-1`, `Node-2`, etc.) belonging to the selected group.
    *   Each node tab reflects real-time summaries of instance resource utilization and heartbeat survival states.
    *   Operators can effortlessly alternate between the cluster-wide **Group View** and the deep-inspection **Single Node View** with a single click.
*   **Application Tabs (App Tabs)**:
    *   Switches between individual application contexts (`App 1`, `App 2`, etc.) running within the selected node or group.
    *   Employs a seamless synchronization architecture where background data streaming and client-side caching remain active across tab switches, ensuring that previously observed application data is preserved and resumed instantly without loss.

## 2. Group View for Cluster-wide Integrated Monitoring
The Group View is a dedicated enterprise monitoring mode that eliminates the need to inspect individual server nodes one by one in a distributed cluster, **bringing together traffic, sessions, charts, and logs for the entire group into a single consolidated view in real time**.

### Differences from Single Node View
*   **Single Node View**: Independently and precisely monitors the CPU, heap memory, thread pool, local sessions, and incoming request traffic of a single physical/virtual server.
*   **Group View**: Automatically aggregates real-time metric streams from all active nodes across the group via the client-side engine, allowing operators to oversee overall throughput and user distribution at the cluster level.

### Component Behaviors in Group View
*   **Aggregated Traffic Flow**:
    *   Request bullets originating from all nodes across the group converge into a single shared traffic track and fly in real time.
    *   The central Black Box (processing zone) hosts and retains requests concurrently processed by all cluster nodes, immediately exposing whether the entire cluster is experiencing processing bottlenecks.
    *   The `Active Activity` (concurrent active requests), `Current Period Count` (cumulative requests in 5 minutes), and `Cumulative Total` (all-time requests) counters automatically aggregate sum metrics across all group nodes in real time.
*   **Deduplicated Unified Sessions & Node Filtering**:
    *   **Global Active User Deduplication**: Even when user requests are load-balanced across multiple nodes, the engine automatically deduplicates users based on their unique user keys, calculating the true count of unique active users (`Active Users`) across the entire cluster.
    *   **Session Node Filter**: In Group View, node selection buttons (`All`, `Node-1`, `Node-2`, etc.) automatically appear at the top of the session list. Selecting `All` displays all sessions across the cluster, while selecting a specific node button isolates and displays only the sessions maintained by that particular physical node.
*   **Cluster-wide Time-Series Analysis Charts**:
    *   The chart engine plots aggregated activities and active session counts across the entire group on a unified time axis.
    *   Whether analyzing 5-minute live streaming or long-term historical intervals (1D, 1W, 1M, 1Y), it coordinates with server-side group rollup data (`scope: group`) to thoroughly inspect cluster-level traffic patterns and peak intervals.
*   **Interleaved Logs with Node Badges**:
    *   Log streams from all member nodes within the group are interleaved and streamed into a single console window in real time.
    *   Each log line is prefixed with a node identification badge (e.g., `[Node-1]`, `[Node-2]`), allowing operators to instantly trace which server instance generated a specific warning, error, or event.
*   **Dynamic Membership & Heartbeat Detection**:
    *   When nodes join (`Node Joined`) or terminate/fail (`Node Left`) dynamically due to auto-scaling or maintenance restarts, the Group View detects these topology changes immediately.
    *   Terminated node sessions and traffic are safely reconciled from group aggregations and node filter buttons update in real time, reflecting cluster topology shifts without requiring manual operator intervention.

## 3. Server Resource & Performance Monitoring (Metrics Bar)
A high-precision resource monitoring area dedicated to observing system resource consumption and processing capacity in real time.

*   **Real-time Resource Metrics**:
    *   **CPU Usage**: Measures JVM process CPU utilization, host operating system CPU utilization, available processor core counts, and system load average in real time (`CpuUsageReader`).
    *   **Heap Status**: Tracks current JVM heap memory usage against maximum configured allocation limits to detect garbage collection (GC) behavior and potential memory leak symptoms (`HeapMemoryUsageReader`).
    *   **Thread Pool Status**: Monitors Undertow or Netty worker thread pool resources (`UndertowThreadPoolMetricsReader`, `NettyThreadPoolMetricsReader`). Evaluates running active threads (including Java Virtual Threads), total pool capacity, and queued task counts in real time to assess concurrent concurrency pressure.
    *   **Separated Unit Display**: Visually separates metric values from measurement units (`%`, `MB`, `ms`, etc.) and renders units in a compact, subtle style to maximize numerical readability.
*   **Activity Status (Real-time Activity Counts)**: Delivers quantitative request processing metrics for each server application:
    1.  **Active Activity**: Number of real-time requests currently being processed concurrently inside the server.
    2.  **Current Period Count**: Number of requests received and processed during the current 5-minute sampling interval.
    3.  **Cumulative Total**: Total cumulative request count processed since system bootup.
*   **5-Minute Aggregation Lifecycle**:
    *   The progress bar and timer (e.g., `280/300`) positioned beneath the numbers indicate the elapsed progress of the 5-minute (300-second) sampling interval.
    *   Once the progress reaches 300 seconds, accumulated interval data is permanently archived into the analytics database, updated on time-series charts, and the next sampling interval commences.
*   **Statistical Archiving**: Periodically saved data is permanently recorded on the server, facilitating not only short-term load tracking but also historical comparative analysis over time.

## 4. Metric Trend Visualization (Inline Sparklines & Detail Popover Charts)

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectran-assets@main/assets/screenshots/appmon-metric-visualization.png" alt="AppMon Metric Trend Sparklines and Detail Popover" %}

The Metrics Bar located at the top of the dashboard and on each application card goes beyond merely presenting static current numbers; it provides dynamic visualization capabilities that allow operators to intuitively observe the real-time trend of metrics (retaining the most recent 60 incoming data points) while the dashboard remains open.

*   **Inline Sparklines**:
    *   **Real-time Mini Trends**: Renders compact trend lines, gradient fills, and latest-point dots to the right of each metric value, making rising and falling resource tendencies identifiable at a glance.
    *   **Threshold Alert Visualization**: When heavy system load is detected—such as CPU usage surging to 85% or higher—the sparkline color automatically transitions from default blue to alert red, instantly signaling potential risks.
*   **Interactive Detail Popover Mini Charts**:
    *   **One-Click In-Depth Analysis**: Clicking on any metric item opens an anchored floating popover card that presents a detailed historical trend (closed via outside click, close button, or `ESC` key).
    *   **Precise Time-Series Chart & Gridlines**: Plots the data trajectory of the recent 60 points alongside precise gridlines and value labels, allowing operators to visually inspect exact fluctuations.
    *   **Composite Dual Metric Visualization (Primary / Secondary)**:
        *   **CPU Usage**: Concurrently displays JVM process CPU usage (solid line) and host system CPU usage (dashed line).
        *   **Heap Memory**: Plots currently used memory (solid line) alongside maximum allocated memory capacity (dashed line).
        *   **Thread Pool**: Compares actively working thread counts (solid line) against total pool capacity (dashed line).
    *   **Real-time Statistical Summary (Min / Max / Avg)**: Dynamically computes and displays the Minimum (Min), Maximum (Max), and Average (Avg) values accumulated during the current active monitoring session.
    *   **Detailed Attribute Breakdown**: Presents in-depth underlying properties—such as CPU core count and system load average, precise heap KB measurements, thread pool queue backlog, and worker names—as clean chip tags at the bottom.

## 5. Canvas-based Traffic Visualization (Traffic Flow)
All user requests (Request/Activity) are visualized in real time as **'bullets'** flying from left to right across the screen. Powered by a high-performance delta-time HTML5 Canvas rendering engine, it maintains fluid animations without frame drops even under intense traffic of thousands of concurrent requests.

*   **Dynamic Visualization & Black Box Residence Mechanism**:
    *   **Entry into the Black Box**: Request bullets depart from the left side of the track and are pulled into the central **Black Box (processing zone)**.
    *   **Residence Proportional to Processing Time**: Bullets **remain inside the Black Box for the exact duration of elapsed processing time (Elapsed Time)** taken by the server. When processing encounters delays, bullets accumulate inside the Black Box, and its surrounding energetic aura and rotational speed escalate dynamically, allowing operators to intuitively sense concurrency bottlenecks.
    *   **Ejection & Arrival**: Once processing completes on the server, bullets are ejected from the Black Box and fly toward the finish line on the right wall to complete their lifecycle.
    *   **Hotspots & Hot Cores**: Requests generated by heavy users with high activity intensity form a luminous **Hot Core** at the center of the bullet upon ejection, clearly distinguishing them from standard traffic.
*   **Status Color Coding**:
    *   **Green (Normal)**: Requests processed successfully within normal response times.
    *   **Yellow (Warning)**: Delayed requests exceeding warning thresholds (500ms or higher) that warrant attention.
    *   **Red (Error)**: Failed requests resulting in HTTP 5xx errors or unhandled application exceptions.
*   **Background Resource Efficiency**:
    *   Integrates with the Page Visibility API to immediately suspend Canvas animation loops when browser tabs are hidden or minimized, conserving client CPU cycles and laptop battery life.

## 6. Session Status & User Activity Management (Session Management)
A specialized monitoring panel that tracks the lifecycle and activity status of user sessions connected to the server. To optimize visual balance and spatial efficiency, the layout is harmoniously divided into a left-side statistics panel and a right-side real-time session card list.

*   **Core KPI Highlight Cards**:
    *   **Active Users**: Highlights the real-time count of unique active users (Unique Active Users) connected to the system using large bold numbers.
    *   **Active Sessions**: Displays the concurrent active session count side by side, allowing immediate assessment of concurrency scale.
*   **Peak Ratio Progress Bar**:
    *   Visualizes the ratio of currently active sessions relative to all-time peak active sessions (Peak) recorded since bootup, showing both percentage (`%`) and a smooth animated progress bar.
    *   Enables operators to intuitively gauge current server utilization against historical peak capacity.
*   **Responsive Sub-metrics Grid**:
    *   **Adaptive Responsive Layout**: Automatically reorganizes into a 1x4 (1 row, 4 columns) or 2x2 grid based on viewport width and display resolution to optimize spatial density.
    *   **Peak**: Highest number of concurrently active sessions recorded since system startup.
    *   **Created**: Cumulative sessions created since bootup.
    *   **Expired**: Cumulative sessions safely invalidated upon session timeout.
    *   **Rejected**: Sessions rejected due to exceeding maximum allowed session limits.
    *   **Automatic Rejected Session Alert**: When rejected sessions (`Rejected`) reach 1 or more, the card dynamically shifts to an alert red badge style (`.has-rejected`), immediately flagging authorization denials or session exhaustion incidents.
*   **Interactive Uptime & Boot Time Toggle**:
    *   The bottom of the session panel displays system uptime accompanied by a clock icon in a clean human-readable format (e.g., `up 5 days, 3 hours`, `up 25 mins`).
    *   **One-Click Toggle**: Clicking the Uptime area toggles the display mode instantly to the absolute boot timestamp (e.g., `Since October 30, 2026 11:11 AM`).
    *   **Intelligent Tooltips & Auto-refresh**: Hovering reveals the alternate format via tooltip, and a lightweight 30-second background timer automatically keeps the uptime elapsed duration updated without requiring page reloads.
*   **Mobile Optimization & Smart Tap Collapsible Pill Handle (Knob Bar)**:
    *   On mobile screens, the statistics panel collapses to a compact default height (`91px`), cleanly presenting only the top 2-column KPI cards (Active Users / Active Sessions) and Uptime.
    *   Features a tactile pill handle at the bottom with a chevron arrow icon that rotates 180 degrees upon expansion.
    *   **Smart Tap**: On mobile touchscreens, users can tap anywhere on the statistics panel to expand the full session metrics view instantly, and tap the pill handle at the bottom to collapse it back.
*   **Real-time Session List & User Tracking**:
    *   Active user session cards are arranged in a dynamic grid layout in real time.
    *   **Country Identification**: Resolves visitor IP addresses to geographical locations and displays country flag icons to visualize global visitor distributions.
    *   **Activity Counter Animations**: A numeric badge inside each session card increments with a green pulse animation whenever a request is fired, allowing immediate identification of heavy user interactions.
    *   **Session Inactivity & Expiry**: Cards gradually fade to an inactive state after periods of user idle time, smoothly exiting the list when session timeouts expire.
*   **Cluster Group View Node Filter**:
    *   In Group View, node filter buttons (`All`, `Node-1`, `Node-2`, etc.) appear above the session cards.
    *   Operators can isolate and inspect sessions handled by a specific physical node or view all clustered sessions simultaneously.

## 7. Multi-dimensional Analysis Charts & Smart Date Navigation (Charts Box)
A charting engine that visualizes real-time request volume trends and active session fluctuations on a precision time-series canvas, supporting everything from micro traffic spikes to long-term usage patterns.

*   **Activities & Sessions Time-Series Charts**:
    *   Plots request processing throughput and active session counts concurrently on a unified temporal axis.
    *   Supports zooming (Zoom-in) and panning (Pan) via mouse wheel or dragging across chart areas, with a `Reset Zoom` button to restore default bounds instantly.
*   **Flexible Time-Unit Presets (Date Unit Options)**:
    *   **`5m` (Live)**: A real-time 5-minute sliding window mode designed to observe immediate traffic swings second by second.
    *   **`1D` (Day)**: Analyzes hourly traffic distributions and peak periods across a 24-hour cycle.
    *   **`1W` (Week)**: Compares daily traffic trends from Monday through Sunday over a 1-week span.
    *   **`1M` (Month)**: Inspects day-by-day utilization patterns across an entire month.
    *   **`1Y` (Year)**: Examines long-term service growth trajectories and monthly seasonality over 12 months.
*   **Live Offset Navigation (Date Offset Options)**:
    *   In Live (`5m`) mode, `Previous (<<)` and `Latest (>>)` buttons become active, enabling seamless toggling between real-time streaming and the preceding 5-minute sampling window.
*   **Smart Date Navigator (Date Navigator)**:
    *   A dedicated navigation toolbar activated during `1D`, `1W`, `1M`, and `1Y` historical modes.
    *   **Stepping Navigation**: Jump forward and backward by the selected duration unit (day, week, month, or year) using previous (`‹`) and next (`›`) controls.
    *   **Today Shortcut (`Today`)**: Return instantly to the current timeline from deep historical exploration with a single click.
    *   **Future Navigation Guard**: Next (`›`) controls are automatically disabled when navigating near the present timestamp to prevent invalid queries into future intervals.
*   **Cross-Platform Native Date Picker**:
    *   Clicking the date label opens a calendar picker dialog to select specific historical dates directly.
    *   Utilizes transparent overlay technology and WebKit touch adaptations so that native OS calendar wheels and sheets open effortlessly on desktop and mobile browsers alike (iOS Safari, Android Chrome).

## 8. Professional Log Console & Reverse History Exploration (Console Box)
A high-performance terminal console streaming runtime server application logs with zero perceived latency.

*   **Real-time Streaming & Tailing Control**:
    *   Streams incoming server log lines instantly over lightweight WebSocket protocols.
    *   **Tailing Switch**: Toggles automatic auto-scrolling on or off, allowing operators to pause stream scrolling and scrutinize specific log lines even amidst rapid log surges.
    *   **Console Utilities**: Provides one-click log clearing (Clear) and full-screen expansion/restoration controls.
*   **Multi-log Partitioned Consoles (Multi-log Box)**:
    *   When an application records to multiple distinct log destinations (e.g., system logs, access logs, error-only logs), individual console boxes are automatically provisioned to monitor each stream side by side.
*   **Width Toggle Switch (Wide Switch)**:
    *   Allows operators to toggle individual console boxes between half-width (`col-lg-6`) and full-screen width (`col-lg-12`) via the top-right header button.
    *   Ensures wide formatting space for lengthy stack traces, JSON payloads, and complex SQL queries without disruptive line-wrapping distortions.
*   **Load Previous Logs (Reverse Infinite Scroll)**:
    *   Scrolling to the top of the console reveals a 'Load Previous Logs' trigger button.
    *   Clicking it safely retrieves preceding historical log chunks from the server in reverse chronological order and prepends them to the console, allowing seamless root-cause analysis without interrupting live streaming.
