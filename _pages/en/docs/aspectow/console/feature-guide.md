---
title: Aspectow Console Screen & Feature Guide
teaser: A detailed screen-by-screen guide covering cluster node management, remote command center, distributed scheduler, real-time AppMon monitoring, security Vault, and developer utilities provided by Aspectow Console.
subheadline: Aspectow Console
---

## 1. Overview & Overall Console Layout

Aspectow Console is a comprehensive visual management system integrating application monitoring, clustering, scheduling, security, and developer tools built on the Aspectran framework into a single web interface. This guide details the specific features, UI components, usage, and practical operational tips for every screen in the Console.

### Console Layout Structure

*   **Left Sidebar**: A hierarchical navigation menu organized into Management, Utilities, and Governance sections. Menu items are dynamically enabled based on user account Roles and Permissions.
*   **Top Header (Top Bar)**: Displays the current page breadcrumb path, global search, and system environment profile information.
*   **Bottom Right Profile & Logout**: Displays the logged-in user's nickname, account name, avatar, and logout button.

## 2. Home Dashboard (Home Dashboard)

The central control panel rendered upon logging into the Console, helping users grasp overall system health at a glance and quickly navigate to core modules.

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-home-dashboard.png" alt="Aspectow Console Home Dashboard" %}

### Welcome Headline & Status Indicator

The top section displays the `Aspectow Management Console` title alongside a welcome message for the running system, visually conveying overall operational health status.

### Core Module Shortcut Cards (Stat Cards)

*   **Live Monitoring Card**: Navigates directly to real-time traffic, JVM memory heap, thread pool, and activity monitoring (`Aspectow AppMon`).
*   **Cluster Operations Card**: Navigates to cluster node status inspection, remote command execution, and scheduler management.
*   **Security & Vault Card**: Navigates to PBE encryption token management and system encryption configuration.
*   **Developer Tools Card**: Navigates to runtime developer utilities (AsEL Tester, Wildcard Validator, APON Converter).

## 3. Cluster Operations (Cluster Operations)

A suite of screens for central control of server instances and distributed scheduling tasks operating in a cluster environment.

### 3.1. Cluster Nodes (Cluster Nodes)

Monitors the real-time health of all active nodes in the cluster and dispatches bulk control commands.

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-cluster-nodes.png" alt="Cluster Nodes Management Screen" %}

#### Top Control Bar

*   **Total Node Count Badge**: Displays the total number of connected cluster nodes in real time (e.g., `0 Nodes`).
*   **Node Search Field**: Filters nodes instantly by entering node title, IP address, or node ID.
*   **Bulk Control Button**: Available to administrators with `NODE_MANAGE`, `SUPER_ADMIN`, or `DEMO` permissions, invoking the bulk control modal.
*   **Refresh Button**: Re-queries node statuses to update the screen upon clicking.

#### Cluster Group Tabs

In Gateway cluster mode, tabs are automatically generated for each server group. The `All Nodes` tab displays all nodes, while group-specific tabs isolate nodes belonging to a particular server group. Badge counters beside each tab display node counts.

#### Node Information Cards

Each node is rendered as an independent card providing the following metrics and action triggers:
*   **Node Title & ID Badge**: Node title and unique node ID rendered in monospace font.
*   **Status Dot & Status Text**: Clearly indicates node operational health with color-coded LED dots and text (Green `LIVE`: normal running, Yellow `PAUSED`/`STOPPING`: paused or shutting down, Red `DEAD`: disconnected/down).
*   **Host Address & Service Port**: Host IP address and service port number of the node.
*   **Node Group**: Group name to which the node belongs (in Gateway cluster mode).
*   **Commands Button**: Navigates directly to the Remote Command Center with the target node automatically pre-selected.
*   **Metrics Button**: Opens a new popup window displaying real-time AppMon metrics for the selected node.
*   **Actions Dropdown Menu**:
    *   **Pause Node** (Visible when `LIVE`): Temporarily pauses transaction reception and execution on the node.
    *   **Resume Node** (Visible when `PAUSED`): Restores a paused node back to normal operational state.
    *   **Restart Node**: Restarts the target node process.

#### Bulk Control Modal

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-cluster-nodes-bulk-control.png" alt="Cluster Nodes Bulk Control Modal" %}

Allows administrators to select multiple nodes and dispatch bulk control commands with a single click:
*   **1. Select Target Nodes**: Easily multi-select or deselect all cluster nodes or specific group/node checkboxes via `Select All` / `Deselect All` buttons.
*   **2. Action Selection**:
    *   **PAUSE (Pause)**: Transitions selected nodes to `PAUSED` (paused) status simultaneously.
    *   **RESUME (Resume)**: Restores paused nodes back to `LIVE` (normal running) status simultaneously.
    *   **RESTART (Restart)**: Restarts selected nodes simultaneously.

### 3.2. Remote Commands (Remote Commands)

An interactive Command Center for dispatching interactive CLI/Shell commands to target cluster nodes and inspecting results in real time.

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-remote-commands.png" alt="Remote Commands Center Screen" %}

#### Screen Layout (Grid System)

Divided into a 350px left **History Panel** and a right panel containing the **Target Selector, Command Editor, and Console Output**.

#### Target Selector

Selects execution targets. Choosing `All Active Nodes` executes commands across all cluster nodes simultaneously, while choosing a specific node limits execution to that single target.

#### Command Editor

An input window for writing shell commands or Aspectran admin commands, supporting multi-line scripts. Clicking `Execute` dispatches the command via the asynchronous command bus.

#### Console Output

Streams execution results in real time separated by node tabs.
*   **Standard Output**: Standard execution output rendered in clear light text.
*   **Standard Error**: Execution failures or error messages highlighted in red text.

#### History Panel

Stores past command executions with timestamps, target node names, success/failure badges, and command previews. Clicking an entry restores the command and target settings into the editor for instant re-execution.

### 3.3. Scheduler Manager (Scheduler Manager)

Monitors and controls Aspectran Scheduler services and distributed jobs registered in a cluster environment. Supports two view modes via top view controls: **Dashboard View** for a cluster-wide overview and **Detail View** for node-specific job management.

#### Dashboard View

Displays overall scheduler operational health and aggregated logs across all cluster nodes.

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-scheduler-dashboard.png" alt="Scheduler Manager Dashboard View" %}

*   **Summary Section**: Displays counters for Active Schedules, Active Jobs, Isolated Items, and Target Node metrics at a glance.
*   **Node Card Grid**: Renders each cluster node as a grid card displaying node title, group, health status (Live/Dead/Connecting LED indicator), and active schedule/job counts. Clicking a card transitions with a pulsing animation directly to that node's Detail View.
*   **Cluster Integrated Log Console**: A dark-themed console box located at the bottom of the screen, where **scheduler start, stop, trigger execution, and error logs across all nodes** are collected and streamed in real time. Supports Pause, Clear, and Full-screen expansion.

#### Detail View

Monitors specific scheduler services and dynamically controls individual jobs for a selected node via the node selector.

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-scheduler-detail-view.png" alt="Scheduler Manager Detail View Screen" %}

*   **Scheduler Service Card**: Displays registered scheduler service names, total job counts, active cron counts, and Running/Paused status badges for the selected node.
*   **Isolated Mode Indicator**: Indicates whether a job is isolated to a specific node or shared via distributed locks using a yellow warning icon.
*   **Job Table**: Lists job names, Trigger Type (Cron vs Simple Interval), Cron expressions (e.g., `0 0/5 * * * ?` - runs every 5 minutes), Next Fire Time, Last Fire Time, and status pills.
*   **Job Control Buttons**:
    *   `Pause` / `Resume`: Temporarily pauses or resumes automatic execution for a specific job.
    *   `Job Details`: Opens a modal displaying detailed job parameters and execution history.
*   **Node-Specific Log Console**: Filters and streams scheduler logs exclusively for the selected node.

#### Scheduler Bulk Control Modal

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-scheduler-bulk-control.png" alt="Scheduler Manager Bulk Control Modal" %}

Dispatches bulk control commands for specific schedules or jobs across multiple nodes in the cluster:
*   **1. Select Target Nodes**: Multi-select target nodes using checkboxes or `Select All` / `Deselect All` buttons.
*   **2. Service Name (Optional)**: Specifies the target scheduler service name (leave blank to match across all services).
*   **3. Target Type & ID**: Choose `Schedule` or `Job` as target type and enter the target identifier (Schedule ID or Job ID, e.g., `SyncBackupSchedule`).
*   **4. Action**:
    *   **ENABLE (Bulk Enable)**: Enables the target schedule/job across selected nodes simultaneously.
    *   **DISABLE (Bulk Disable)**: Disables (pauses) the target schedule/job across selected nodes simultaneously.

## 4. Real-time Monitoring (AppMon Integration)

Monitors real-time application activities, JVM resources, active sessions, and log streaming via the integrated AppMon engine inside the Console.

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/appmon-v4-dashboard-dark.png" alt="AppMon Live Monitoring Dashboard" %}

### 4.1. Group & App Tabs Navigation (Group & App Tabs)

*   **Group Tabs (Group Tabs)**: Switch between logical server groups or cluster nodes.
*   **Application Tabs (App Tabs)**: Switch between individual application instances (`app`) within the domain with seamless data synchronization across tab switches.

### 4.2. Server Resources & Performance Metrics

*   **Heap Status**: Compares JVM heap memory usage with maximum limits to detect GC state and memory leaks.
*   **Undertow Thread Pool**: Compares active threads against worker pool capacity to monitor concurrent load.
*   **Activity Status**: Displays Active Activity count (real-time requests currently processing), Current Period Count (new entries in current 5-minute period, e.g., `+14`), and Cumulative Total (`p.cumulative` since server start).
*   **5-Minute Aggregation Timer**: Displays 300-second timer progress (e.g., `233/300`). Upon reaching `300/300`, data is persisted to the database and chart metrics roll over.

### 4.3. Canvas Traffic Flow Visualization (Traffic Flow)

Visualizes incoming user requests (Activity) as animated 'bullets' moving from left to right across the canvas.
*   **Response Time Deceleration**: Bullet speed decelerates up to 60% based on response time (`elapsedTime`), providing visual feedback on system latency.
*   **Persistence & Hot Core**: Heavy requests stick longer on the right wall (`elapsedTime + 200ms`), and high-intensity requests from heavy users render a **Hot Core** center for immediate identification.
*   **Status Color Coding**: Green (Normal), Yellow (Warning > 500ms), Red (Error).

### 4.4. Session Management & Geo Location

*   **IP Geo Location**: Resolves client IP addresses to render country flag icons in real time.
*   **Session Activity Counts**: Lists active sessions along with real-time activity counts to detect heavy users.

### 4.5. Multi-dimensional Charts & Log Console

*   **TimeSeries Charts**: Analyzes activity and session trends across 5-minute, hour, day, month, and year units.
*   **Real-time Log Tailing**: Socket-based log streaming with Pause, Clear, and Full-screen options.
*   **Reverse Log Scrolling (Previous Logs)**: Scrolling to the top activates 'Load Previous Logs' to fetch historical logs contextually.

## 5. Security & Vault Management (Security & Vault)

Centralized management for system passwords and Password-Based Encryption (PBE) security tokens.

### 5.1. Vault Management (Vault Management)

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-vault-management.png" alt="Vault Management Screen" %}

#### Control Bar

*   **Total Tokens Badge**: Displays total registered security token count.
*   **Search Field**: Real-time search by token label or keyword.
*   **Page Size Select**: Choose page size (Auto, 10, 20, 30, 50, 100).
*   **Hide Expired Toggle**: Hide or show expired tokens in the list.
*   **New Token Button**: Invokes the new security token issuance modal.

#### System Encryption Configuration Card

Header card validating current application system encryption configuration:
*   **PBE Algorithm**: Applied encryption algorithm (e.g., `PBEWithHmacSHA256AndAES_256`).
*   **Key Parameters**: Key Length, Iteration Count, and Salt Generator parameters.

#### Vault Table (Token Details List)

Lists token Label, encrypted key/value preview, creation date, expiration date, and status badges (`Active`/`Expired`), with Copy Key, View Details, and Revoke actions.

#### New Token (New Security Token Issuance) Modal

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-vault-new-token.png" alt="Vault Management New Token Modal" %}

Issues new security tokens and encrypts payload data using PBE algorithms:
*   **Label**: Unique token identifier (e.g., `DB_PASSWORD`, `API_SECRET_KEY`).
*   **Token Type**:
    *   `SIMPLE`: Raw string PBE encryption payload directly stored.
    *   `PERSISTENT`: Persistent token payload formatted via APON.
    *   `TIME_LIMITED`: Time-limited token payload with APON formatting and expiration limits.
*   **Plain Text Value**: Plaintext data to be encrypted and stored (multi-line input field).
*   **Description**: Description of token usage.
*   **Expiration (Minutes)**: Validity period in minutes (`0` for non-expiring permanent tokens).
*   **Security Restrictions**: Upon clicking `Save & Encrypt`, plaintext values are encrypted. For security integrity, token type, validity period, and plaintext values become **read-only** post-issuance.

### 5.2. Vault Tool (Security Utility)

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-vault-tool.png" alt="Vault Interactive Tool Screen" %}

Interactive laboratory tool allowing developers to encrypt or decrypt sensitive credentials (DB passwords, API keys, etc.).

*   **Encryption/Decryption Execution Form**: Configure Algorithm, Password, Salt (optional), and Operation Mode (Encrypt/Decrypt) to execute text encryption or decryption.
*   **Execution Result & History**: Provides result text clipboard copying and an execution history panel to inspect past runs (Timestamp, Mode, Algorithm) and easily restore them for re-execution.

## 6. Framework Diagnostics & Developer Tools (Framework & Developer Tools)

A suite of tools for Aspectran framework runtime diagnostics and developer productivity.

### 6.1. Configuration (Framework Configuration Viewer)

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-framework-config.png" alt="Framework Configuration Viewer" %}

Inspects runtime framework configurations, rule file hierarchy, and active profiles (`dev`, `prod`, `test`).

### 6.2. Anatomy (Framework Anatomy Viewer)

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-framework-anatomy.png" alt="Framework Anatomy Viewer" %}

Inspects internal `ActivityContext` registries:
*   **Bean Registry**: Registered bean IDs, class types, scopes (singleton, prototype, request, session), lazy-init settings, and dependencies.
*   **Translet Registry**: Translet mappings, HTTP method bindings, Action execution pipelines, and View forwarding.
*   **Aspect Registry**: AOP Pointcut patterns and Advice (Before/After/Around) definitions.

### 6.3. Wildcard Tester (Pattern Validator)

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-wildcard-tester.png" alt="Wildcard Pattern Tester Tool" %}

Tests Aspectran wildcard pattern matcher rules in real time. Clicking the **Wildcard Guide** button links directly to the official [Aspectran Wildcard Pattern Matching Guide](https://aspectran.com/en/docs/guides/aspectran-wildcard-matching/) for pattern syntax documentation.
*   **Pattern Input**: Input pattern to test (e.g., `/users/**/details`, `*.do`).
*   **Test Paths**: Inject sample test paths.
*   **Match Results**: Displays match success/mismatch status and extracted variable bindings in real time.

### 6.4. AsEL Tester (Expression Evaluator)

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-asel-tester.png" alt="AsEL Expression Tester Tool" %}

Evaluates Aspectran Expression Language (AsEL) expressions interactively. Clicking the **AsEL Guide** button links to the official [Introduction to AsEL (Aspectran Expression Language)](https://aspectran.com/en/docs/guides/introduce-asel/) documentation.
*   **Expression Input**: AsEL expression input (e.g., `#{sysProps['user.home']}`, `@{beanId.methodName()}`).
*   **Context Variables**: Sample context variable inputs.
*   **Evaluation Result**: Displays evaluated result, return object data type, and execution duration (ms).

### 6.5. APON Converter (Data Converter)

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-apon-converter.png" alt="APON Data Converter Tool" %}

Bi-directional converter between APON and JSON formats. Clicking the **APON Guide** button links directly to the official [Introduction to APON (Aspectran Parameters Object Notation)](https://aspectran.com/en/docs/guides/introduce-apon/) documentation.
*   **APON Panel (Left)**: Input APON text and click `Parse to JSON` to convert it into JSON format.
*   **JSON Panel (Right)**: Input JSON text, choose an APON output style (`PRETTY`, `SINGLE_LINE`, `COMPACT`), and click `APON` to convert it back to APON format.
*   **Quick Tools**: Provides `Clear All` for resetting input text and `Load Sample` for loading sample APON data.

## 7. Governance & Accounts (Governance & Accounts)

This section manages Console user accounts and security audit logs.

### 7.1. User Management (User Management)

#### User Accounts List

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-user-management.png" alt="User Management Screen" %}

*   **User List & Search**: Manages registered console user accounts (Username, Nickname, Email, Status, Roles).
*   **Role Permissions Modal**: Views detailed permission mappings for `SUPER_ADMIN`, `ADMIN`, and `DEMO` roles.

#### New & Edit User Modal

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-user-management-modal.png" alt="User Management Modal Screen" %}

*   **Basic Account Profile**: Configures Username, Nickname, Email Address, and Account Status (`NORMAL`, `LOCKED`, `DISABLED`).
*   **Account Lockout Unlock**: Accounts locked automatically after 5 consecutive failed login attempts (`LOCKED`) can be easily unlocked by changing status back to `NORMAL` in this modal.
*   **Roles & Pinpoint Permissions**: Assigns base roles (`SUPER_ADMIN`, `ADMIN`, `DEMO`) along with fine-grained pinpoint permissions (`USER_MANAGE`, `NODE_MANAGE`, `VAULT_MANAGE`, etc.) via checkboxes.
*   **Allowed IP Restrictions (`Allowed IPs`) Configuration**:
    *   Specifies allowed IP patterns (`allowedIps`) for individual operator accounts to block unauthorized access strictly.
    *   Supports exact single IPs (`192.168.1.50`, `10.0.0.100`), IP subnet wildcards (`192.168.1.*`, `10.0.*.*`), and comma/space-separated multiple patterns. (If `null` or unconfigured, access is allowed without IP restrictions.)
    *   If an access attempt is made from an unallowed IP pattern, login is denied immediately even with correct password credentials and recorded in the audit log.

### 7.2. Login History Audit (Login History Audit)

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-login-history.png" alt="Login History Audit Screen" %}

Audits login timestamps, client IP addresses, IP Geo Location flag icons, success/failure statuses, error reasons, and User-Agent strings to verify system access security thoroughly.

### 7.3. Security Audit Log (Security Audit Log)

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-audit-log.png" alt="Security Audit Log Screen" %}

A security monitoring screen tracking and auditing high-risk administrative operations, account modifications, and Vault security token management in real time.

*   **Real-time Audited Security Events**:
    *   User account creation, modification, deletion, and lockout/unlock events.
    *   Role and pinpoint permission updates.
    *   Vault security token issuance, editing, revocation, and System Encryption queries.
    *   Denied login attempts from unauthorized IPs (`[LOGIN_FAILED_UNALLOWED_IP]`).
*   **Search & Filtering**: Filters audit logs by executor username, action keyword, execution status (Success/Failed), and date range.
*   **Audit Details Modal**: Clicking an entry opens a detail modal rendering executor ID, client IP address, target resource, pre/post-change data payloads, and detailed reasons in a JSON/text viewer for security incident investigations.
