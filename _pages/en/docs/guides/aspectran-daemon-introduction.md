---
title: Introduction to Aspectran Daemon
subheadline: Core Guides
---

## 1. What is Aspectran Daemon?

Aspectran Daemon is a robust **service container and runtime platform** designed to run and reliably manage Aspectran framework-based applications as standalone background processes (daemons or OS system services). Far beyond a simple utility for executing Java background scripts, it is a fully integrated service runtime that interfaces deeply with operating system service managers and provides a headless file-based control interface for injecting real-time commands.

Aspectran Daemon is optimized for operating mission-critical, long-running backend systems—such as large-scale data batch processing, periodic scheduler workflows, system monitoring agents, and background queue workers—24/7 without requiring active web interfaces or interactive CLI shell sessions.

## 2. Core Architectural Philosophy & Features

### Unified Activity Architecture
Following Aspectran's core architectural principle, the daemon environment shares the exact same transaction, AOP, and action execution pipeline via `DaemonActivity` as web environments (`ServletWebActivity`, `NettyActivity`) and the shell environment (`ShellActivity`).
* Commands injected via files or background schedulers are executed inside a `DaemonActivity` instance, allowing existing business logic (Translets and Beans) to be reused in daemon environments without modifying a single line of code.

### Headless File-Based Remote Control (File Commander)
Without exposing administrative HTTP ports or requiring SSH terminal sessions, operators can safely instruct and control the active daemon simply by placing APON-formatted command files into a designated directory (`cmd/incoming`).
* **Atomic File Moves**: Eliminates race conditions, duplicate execution, and file corruption at the OS level.
* **Asynchronous Execution & Automatic Rollback**: Requeues commands back to the incoming queue if thread pools are saturated.
* **Post-Mortem Error Reporting**: Automatically captures complete exception stack traces alongside original inputs upon failure.

### Comprehensive OS Service Integration
Integrates with Apache Commons Daemon to provide native service management across diverse enterprise operating environments:
* **Standard Java Process (`DefaultDaemon`)**: Universal script-based execution (`daemon.sh`, `daemon.bat`) across all platforms.
* **Unix/Linux System Daemon (`JsvcDaemon`)**: Binds privileged ports as `root`, drops privileges to a standard user account, and integrates cleanly with `systemd`.
* **Windows System Service (`ProcrunDaemon`)**: Runs natively as a registered Windows Service manageable via Windows Services (`services.msc`).

### Seamless Scheduler and Web Server Integration
Executes Quartz-based periodic background jobs while simultaneously controlling embedded Netty, Undertow, or Jetty web servers on demand for administrative endpoints or auxiliary REST APIs.

## 3. Architecture and Internal Execution Model

Aspectran Daemon comprises the top-level service coordinator (`DaemonService`), the file polling and ingestion engine (`FileCommander`), the thread-pool-based `AsyncCommandExecutor`, and the execution context (`DaemonActivity`).

```
+-------------------------------------------------------------+
|                      OS / File System                       |
|           /app/cmd/incoming  -->  .apon command files       |
+-------------------------------------------------------------+
                              |
                              v (Polling & Atomic Move)
+-------------------------------------------------------------+
|                     DefaultFileCommander                    |
|          incoming/  -->  queued/  -->  completed/ failed/   |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                     AsyncCommandExecutor                    |
|               ThreadPoolExecutor & CommandRegistry          |
+-------------------------------------------------------------+
         |                                           |
         v (Built-in Commands)                       v (Translet / Action Commands)
+----------------------------+            +-------------------------+
|  Built-in Command Handlers |            |      DaemonActivity     |
|  sysinfo, component        |            |  - DaemonRequestAdapter |
|  pollingInterval, etc.     |            |  - DaemonResponseAdapter|
+----------------------------+            |  - DaemonSessionAdapter |
                                          +-------------------------+
                                                     |
                                                     v
                                          +-------------------------+
                                          |   ActivityContext Core  |
                                          |   Bean, AOP, Scheduler  |
                                          +-------------------------+
```

### Key Components
* **`DaemonService` (`DefaultDaemonService`)**: Manages the complete lifecycle of the daemon (initialize, start, pause, restart, destroy), internal thread pools, and background resources.
* **`FileCommander` (`DefaultFileCommander`)**: Periodically monitors the `incoming` directory, detects new command files, and transitions them atomically for execution.
* **`AsyncCommandExecutor`**: Dispatches ingested commands asynchronously to background worker threads.
* **`DaemonActivity`**: The execution context for a single command invocation (Translet or Action).
  * `DaemonRequestAdapter`: Converts APON arguments and parameters into Translet request attributes.
  * `DaemonResponseAdapter`: Writes execution results to specified target files or response logs.
  * `DaemonSessionAdapter`: Manages execution session state for daemon activities.

## 4. Execution Modes & Launcher Classes

Aspectran Daemon provides four runtime modes tailored for different deployment environments.

| Launcher Class | Execution Mode | Target Environment | Key Features |
| :--- | :--- | :--- | :--- |
| **`DefaultDaemon`** | Standalone Java Process (`daemon.sh`, `daemon.bat`) | Any OS, Local Development & Testing | Easiest mode to run and debug using standard `main()` methods |
| **`JsvcDaemon`** | Apache Commons Daemon `Jsvc` (`jsvc-daemon.sh`) | Linux, Unix | Starts as `root`, drops privileges to a standard user, integrates with systemd |
| **`ProcrunDaemon`** | Apache Commons Daemon `Procrun` (`prunsrv`) | Windows Server | Native Windows Service registered in `services.msc` |
| **`SimpleDaemon`** | Lightweight Embedded Launcher | Unit Tests, Embedded Java Hosts | Starts only the core daemon container and scheduler without web/shell engines |

## 5. Built-in Commands Reference

Standard built-in commands available for injection via File Commander:

| Command | Description | Key Parameters & Attributes |
| :--- | :--- | :--- |
| `invokeAction` | Directly invokes a specific bean method (Action). | `bean`: Bean ID, `method`: Method name |
| `translet` | Executes a registered Translet business workflow. | `translet`: Translet name, `parameters`: Request parameters |
| `template` | Renders a specified template and writes output to disk. | `template`: Template ID, `parameters`: Template token values |
| `component` | Inspects registered Translets, Aspects, Jobs, and Beans. | `type`: `translet`/`aspect`/`job`, `mode`: `list`/`list-all`/`detail` |
| `sysinfo` | Queries JVM memory, system properties, and OS statistics. | `arguments`: `mem`, `props` |
| `pollingInterval` | Dynamically updates the File Commander polling interval (ms). | `arguments`: New interval in milliseconds (long) |
| `netty` / `undertow` / `jetty` | Controls embedded web servers (start, stop, restart, status). | `mode`: `start`/`stop`/`restart`/`status`, `server`: Server bean ID |
| `restart` | Hot-reloads all resources and restarts the Aspectran context. | `isolated`: `true` (executes in isolation) |
| `quit` | Gracefully shuts down the daemon process. | `requeuable`: `false` (prevents restart loops) |

## 6. Headless File-Based Remote Control (File Commander)

File Commander utilizes a physically segregated directory structure to manage command lifecycles under strict transactional guarantees.

### 1) Directory Structure and Responsibilities
* **`incoming/` (Incoming Queue)**: The gateway where external systems or administrators drop `.apon` command files.
* **`queued/` (Processing)**: Indicates that the command has been ingested and is currently executing in a worker thread.
* **`completed/` (Success History)**: Successfully finished command files are archived here with execution timestamps (`yyyyMMddTHHmmssSSS`).
* **`failed/` (Failure Reports)**: Failed or malformed commands are moved here alongside comprehensive exception stack traces.

### 2) Core Reliability Guarantees
* **Atomic Ingestion (Atomic Move)**: Files are moved using `StandardCopyOption.ATOMIC_MOVE`, ensuring corruption-free, single-operation transitions at the filesystem level.
* **Thread Pool Saturation Rollback**: If worker threads are exhausted, the file is immediately rolled back from `queued` to `incoming` to prevent silent job loss.
* **Isolated Commands**: System-critical commands such as `restart` or `quit` are guaranteed isolated execution after active business jobs complete.
* **Crash Recovery (Requeue)**: If the daemon terminates abruptly, uncompleted jobs left in `queued` are automatically restored to `incoming` upon restart.

## 7. Configuration Guide (`aspectran-config.apon`)

Configure the `daemon` section in `aspectran-config.apon` to define runtime behavior:

```apon
daemon: {
    # Worker thread pool for asynchronous command execution
    executor: {
        maxThreads: 5
    }

    # File Commander polling configuration
    polling: {
        pollingInterval: 5000       # Polling interval in milliseconds
        requeuable: true            # Automatic recovery of pending jobs on startup
        incoming: /app/cmd/incoming # Target directory to watch (optional)
        enabled: true               # Enable File Commander
    }

    # Registered command handlers
    commands: [
        com.aspectran.netty.daemon.command.NettyCommand
        com.aspectran.undertow.daemon.command.UndertowCommand
        com.aspectran.jetty.daemon.command.JettyCommand
        com.aspectran.daemon.command.builtins.InvokeActionCommand
        com.aspectran.daemon.command.builtins.TransletCommand
        com.aspectran.daemon.command.builtins.ComponentCommand
        com.aspectran.daemon.command.builtins.SysInfoCommand
        com.aspectran.daemon.command.builtins.PollingIntervalCommand
        com.aspectran.daemon.command.builtins.RestartCommand
        com.aspectran.daemon.command.builtins.QuitCommand
    ]

    # Daemon session management
    session: {
        enabled: true
    }

    # Translet exposure filter
    acceptable: {
        -: /**
        +: /batch/**
        +: hello
    }
}
```

## 8. Practical Command Samples (APON)

Example APON command files ready to be placed into `cmd/incoming`:

### 1) Query System Statistics (`11-sysinfo.apon`)
```apon
command: sysinfo
arguments: {
    item: {
        value: mem
    }
    item: {
        value: props
    }
}
```

### 2) Execute Translet with Parameters (`31-hello-translet.apon`)
```apon
command: translet
translet: hello
parameters: {
    item: {
        name: user
        value: Aspectran
    }
}
```

### 3) Start Embedded Netty Server (`20-netty-start.apon`)
```apon
command: netty
parameters: {
    item: {
        name: mode
        value: start
    }
    item: {
        name: server
        value: netty.server
    }
}
```

### 4) Graceful Daemon Shutdown (`99-quit.apon`)
```apon
command: quit
# Set requeuable to false to prevent infinite restart loops upon requeue recovery
requeuable: false
```

## 9. Implementing Custom Commands

Create custom control commands for domain-specific operations (e.g., emergency cache eviction, on-demand batch triggers):

```java
package com.aspectran.demo.daemon;

import com.aspectran.core.component.bean.ItemHolderParameters;
import com.aspectran.daemon.command.AbstractCommand;
import com.aspectran.daemon.command.CommandParameters;
import com.aspectran.daemon.command.CommandResult;

public class CacheEvictCommand extends AbstractCommand {

    @Override
    public CommandResult execute(CommandParameters parameters) {
        try {
            ItemHolderParameters itemHolder = parameters.getParameters();
            String cacheName = (itemHolder != null ? itemHolder.getString("cacheName") : "all");

            // Look up cache manager bean from Application Context
            CacheService cacheService = getDaemonService().getActivityContext()
                    .getBeanRegistry().getBean(CacheService.class, "cacheService");
            cacheService.evict(cacheName);

            return success("Cache '" + cacheName + "' successfully evicted.");
        } catch (Exception e) {
            return failed("Failed to evict cache: " + e.getMessage(), e);
        }
    }

    @Override
    public Descriptor getDescriptor() {
        return new CommandDescriptor("custom", "cacheEvict", "Evicts specified application cache");
    }

}
```

Register the custom command in `aspectran-config.apon` under `daemon.commands`.

## 10. Running in Development Environment (IDE)

Create a test runner class (`DemoTestDaemon.java`) under `src/test/java` to launch and debug the daemon and scheduler directly in an IDE:

```java
package com.aspectran.demo;

import com.aspectran.daemon.DefaultDaemon;
import com.aspectran.utils.ResourceUtils;

import java.io.File;
import java.io.IOException;

import static com.aspectran.core.context.config.AspectranConfig.BASE_PATH_PROPERTY;

public class DemoTestDaemon {

    public static void main(String[] args) {
        try {
            File baseDir = new File(ResourceUtils.getResourceAsFile(""), "../../app");
            System.setProperty(BASE_PATH_PROPERTY, baseDir.getCanonicalPath()); // for logback

            // Bootstrap DefaultDaemon
            DefaultDaemon.main(new String[] {
                baseDir.getCanonicalPath(),
                "config/aspectran-config.apon"
            });
        } catch (IOException e) {
            e.printStackTrace(System.err);
        }
    }

}
```

## 11. Production Deployment & Service Registration

### 1) Universal Shell Scripts (`daemon.sh` / `daemon.bat`)
Manage background Java processes in Linux/macOS environments:

```bash
$ cd app/bin
$ ./daemon.sh start      # Start daemon in background
$ ./daemon.sh status     # Check process status
$ ./daemon.sh --debug    # Run with detailed debug logging
$ ./daemon.sh restart    # Restart daemon
$ ./daemon.sh stop       # Gracefully stop daemon
```

### 2) Unix/Linux System Service via `jsvc` (`jsvc-daemon.sh`)
Using Apache Commons Daemon `jsvc`, bind privileged ports (80/443) as `root`, then drop privileges to a non-privileged user (e.g., `aspectran`):

```bash
$ cd app/bin
$ ./jsvc-daemon.sh start
$ ./jsvc-daemon.sh stop
```

Sample systemd service unit (`aspectran.service`):
```ini
[Unit]
Description=Aspectran Daemon Service
After=network.target

[Service]
Type=forking
ExecStart=/opt/aspectran/app/bin/jsvc-daemon.sh start
ExecStop=/opt/aspectran/app/bin/jsvc-daemon.sh stop
User=aspectran
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### 3) Windows `Procrun` Service Registration
Register as a native Windows service using the batch scripts in `app/bin/procrun/`:
* `install-service.bat`: Registers the Windows Service (`prunsrv //IS//AspectranDaemon`)
* `uninstall-service.bat`: Unregisters the service

## 12. Practical Application Scenarios

### 1) Enterprise Batch Scheduler & Data Pipeline
Reliably schedules and executes Quartz-based batch processing routines, transforming large datasets and generating reports periodically.

### 2) Headless Microservices & Background Workers
Processes message queues and database polling workflows in the background without exposing external web ports, providing file-based emergency restart and diagnostics.

### 3) IoT & Edge Gateway System Daemons
Runs as a lightweight Java service on embedded Linux devices, aggregating local telemetry sensor data and dispatching it to central cloud gateways.

## 13. Related Documentation

* [Aspectran Daemon: Remote Command Injection and Control via File Commander](https://aspectran.com/en/docs/guides/aspectran-daemon-file-commander/)
* [Aspectran Scheduler: Task Automation with Translets](https://aspectran.com/en/docs/guides/aspectran-scheduler/)
* [Aspectran User Guide](https://aspectran.com/en/docs/guides/aspectran-user-guide/)
* [Introduction to APON (Aspectran Parameters Object Notation)](https://aspectran.com/en/docs/guides/introduce-apon/)
* [Introduction to Aspectran Shell](https://aspectran.com/en/docs/guides/aspectran-shell-introduction/)
