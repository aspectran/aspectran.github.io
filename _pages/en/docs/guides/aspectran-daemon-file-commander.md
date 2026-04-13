---
title: "Aspectran Daemon: Remote Command Injection and Control via File Commander"
subheadline: Core Guides
---

**File Commander** is a **file-based remote interface** that allows you to inject commands into the Aspectran Daemon and control the system via the filesystem, without exposing separate management APIs or requiring direct SSH interaction. This guide explains the internal operation of File Commander and how to use it to safely manage running servers.

## 1. Design Philosophy and Background

### Why Remote Command Injection?
Controlling a running application server (e.g., Aspectow) traditionally involves building a dedicated management API (like REST) or connecting via SSH to execute shell commands. However, these methods have limitations:
*   **Security Risks**: Exposing management ports externally or managing SSH access permissions can create vulnerabilities.
*   **Integration Complexity**: Implementing complex protocols is often required for external monitoring systems or automation scripts to change specific internal states of the server.

### File Commander's Approach
File Commander starts from the simple concept that **"one file is one command."** By simply creating a file in a designated format within a specific directory, the daemon detects it and executes the internal logic. This reduces coupling between systems and provides a secure control channel using only the filesystem's permission system.

## 2. Internal Operation and Directory Structure

File Commander uses a physically separated directory structure to manage the lifecycle of a command. All state transitions are performed via **Atomic Move**, which fundamentally prevents task loss or duplicate execution.

### Detailed Directory Roles
1.  **`incoming/` (Input Queue)**
    *   The gateway for external injection. When a user creates a `.apon` file containing a control command here, the processing begins.
    *   The poller monitors this directory at set intervals and ensures sequential processing by sorting files by name.
2.  **`queued/` (Processing)**
    *   Indicates that the daemon has accepted the command and it is currently executing.
    *   The presence of a file in this directory is a critical status indicator meaning "task in progress or abnormally interrupted."
3.  **`completed/` (Success History)**
    *   Stores the results of all successfully executed commands.
    *   A timestamp in the format `yyyyMMddTHHmmssSSS` is added to the filename for accurate tracking of execution time.
4.  **`failed/` (Failure Reports)**
    *   Stores commands that failed to execute or had syntax errors.
    *   Rather than just keeping the file, an integrated report is generated combining the error stack trace and the original content to aid in post-mortem analysis.

## 3. Core Mechanics: Stability and Reliability

### Step-by-Step Transaction Guarantee
File Commander does not just read files; it goes through the following sophisticated transaction steps:

1.  **Detection and Atomic Staging**: When moving a file from `incoming` to `queued`, it uses Java NIO's `StandardCopyOption.ATOMIC_MOVE`. Since this is performed as a single operation at the OS level, there is no risk of file corruption during copying.
2.  **Asynchronous Execution and Immediate Rollback**: Commands are executed asynchronously in a separate thread pool. If execution is rejected because the thread pool is full, File Commander immediately returns the file from `queued` to `incoming`. This rollback mechanism solves the 'silent loss' problem where commands disappear without being executed.
3.  **Automatic Error Reporting**: If an error occurs during the file parsing stage, an integrated APON file is created that preserves the original content in the `source` field and records the detailed exception in the `error` field.

### Isolated Command
Commands such as system restart (`restart`) or shutdown (`quit`) can lead to unpredictable results if performed simultaneously with other business logic.
*   Commands where `Command.isIsolated()` is `true` are guaranteed **exclusive execution** within the daemon.
*   If an isolated command arrives while other general tasks are running, its execution is deferred or rolled back to wait for a safe point.

### Abnormal Termination Recovery (Requeue)
Even if the daemon crashes unexpectedly, the files being processed remain in the `queued` directory. When the daemon restarts, the `requeue()` process runs and restores these files to `incoming`. This ensures that even in the event of a system failure, every injected control command is guaranteed to be executed at least once.

## 4. Creating and Registering Custom Commands

Users can define their own commands according to the characteristics of their service.

### Step 1: Implementation
Inherit from `AbstractCommand` and write the control logic in the `execute` method. The following example implements a feature to switch a running server to maintenance mode.

```java
public class MaintenanceModeCommand extends AbstractCommand {
    @Override
    public CommandResult execute(CommandParameters parameters) {
        try {
            // Extract mode (on/off) from injected parameters
            String mode = null;
            ItemHolderParameters itemHolder = parameters.getParameters();
            if (itemHolder != null) {
                mode = itemHolder.getString("mode");
            }

            if (mode == null) {
                return failed("The 'mode' parameter is required. (on/off)");
            }

            boolean enable = "on".equalsIgnoreCase(mode);
            
            // Get a specific service bean from the application and change its state
            MaintenanceService service = getDaemonService().getActivityContext().getBeanRegistry().getBean("maintenanceService");
            service.setMaintenanceMode(enable);

            String status = enable ? "enabled" : "disabled";
            return success("Service maintenance mode has been " + status + ".");
        } catch (Exception e) {
            // Calling failed(e) automatically records the stack trace in the 'error' field.
            return failed("Error changing maintenance mode", e);
        }
    }

    @Override
    public boolean isIsolated() {
        return true; // Ensure exclusive execution as it is a state-changing operation
    }

    @Override
    public Descriptor getDescriptor() {
        return new CommandDescriptor("custom", "maintenance", "Control service maintenance mode");
    }
}
```

### Step 2: Registration
Register the implemented class in the `aspectran-config.apon` file. For details on daemon configuration, please refer to the [Daemon Application Configuration (daemon)](https://aspectran.com/en/docs/guides/aspectran-configuration/) section.

```apon
daemon: {
    executor: {
        maxThreads: 5
    }
    polling: {
        pollingInterval: 1000
        requeuable: true
        incoming: /app/cmd/incoming
        enabled: true
    }
    commands: [
        com.aspectran.undertow.daemon.command.UndertowCommand
        com.aspectran.daemon.command.builtins.InvokeActionCommand
        com.aspectran.daemon.command.builtins.TransletCommand
        com.aspectran.daemon.command.builtins.ComponentCommand
        com.aspectran.daemon.command.builtins.SysInfoCommand
        com.aspectran.daemon.command.builtins.PollingIntervalCommand
        com.aspectran.daemon.command.builtins.RestartCommand
        com.aspectran.daemon.command.builtins.QuitCommand
        com.yourpackage.MaintenanceModeCommand  # Register custom command
    ]
}
```

## 5. Practical Command Examples (Samples)

Below are various command examples that can be used immediately in a real production environment (Aspectow). All examples follow the APON format with newlines for readability.

### 5.1 System and Control Settings
You can change the daemon's operational settings in real-time or query system information.

*   **Change Polling Interval** (`10-pollingInterval.apon`)
    ```apon
    command: pollingInterval
    arguments: {
        item: {
            value: 4000
            valueType: long
        }
    }
    ```
*   **Query System Information** (`11-sysinfo.apon`)
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

### 5.2 Undertow Server Control
Manage the state of the web server remotely.

*   **Start Undertow Server** (`20-undertow-start.apon`)
    ```apon
    # Start the Undertow server
    command: undertow
    parameters: {
        item: {
            name: mode
            value: start
        }
        item: {
            name: server
            value: tow.server
        }
    }
    ```
*   **Restart Undertow Server** (`21-undertow-restart.apon`)
    ```apon
    # Restart the Undertow server
    command: undertow
    parameters: {
        item: {
            name: mode
            value: restart
        }
        item: {
            name: server
            value: tow.server
        }
    }
    ```

### 5.3 Business Logic and Template Execution
Directly call specific functions within the application.

*   **Call Bean Method** (`30-hello-action.apon`)
    ```apon
    command: invokeAction
    bean: helloActivity
    method: helloWorld
    ```
*   **Execute Translet** (`31-hello-translet.apon`)
    ```apon
    command: translet
    translet: hello
    ```
*   **Render Template** (`32-hello-template.apon`)
    ```apon
    command: template
    template: hello
    parameters: {
        item: {
            name: what
            value: World
        }
    }
    ```

### 5.4 Monitoring Components and Tasks
Get detailed information about the resources registered in the daemon.

*   **Query All Translets and Details**
    ```apon
    # List all (41-translet-list-all.apon)
    command: component
    parameters: {
        item: { name: type, value: translet }
        item: { name: mode, value: list-all }
    }

    # Specific Translet details (43-translet-detail-hello.apon)
    command: component
    parameters: {
        item: { name: type, value: translet }
        item: { name: mode, value: detail }
        item: { type: array, name: targets, value: [ hello ] }
    }
    ```
*   **Query Jobs (Scheduler) and Aspects**
    ```apon
    # List running jobs (60-job-list.apon)
    command: component
    parameters: {
        item: { name: type, value: job }
        item: { name: mode, value: list }
    }

    # Detailed Aspect information (51-aspect-detail-all.apon)
    command: component
    parameters: {
        item: { name: type, value: aspect }
        item: { name: mode, value: detail }
    }
    ```

### 5.5 Lifecycle Management
Restart or shutdown the daemon itself.

*   **Restart Daemon** (`98-restart.apon`)
    ```apon
    command: restart
    ```
*   **Shutdown Daemon** (`99-quit.apon`)
    ```apon
    command: quit
    requeuable: false
    ```

## 6. Operational Considerations

### Preventing Restart Loops
The `requeuable` property of `CommandParameters` is `true` by default. However, for the `quit` command that shuts down the system, if this value is `true`, the following situation may occur:
1. `quit` command injected → Daemon is forced to close while attempting to shutdown.
2. Daemon restarts → `requeue` restores the `quit` command to `incoming`.
3. Daemon shuts down again immediately upon startup (infinite loop).

Therefore, it is safer to explicitly set `requeuable: false` when issuing shutdown or destructive control commands.

## 7. Conclusion and Future Extensibility

Aspectran Daemon's File Commander provides a powerful and secure remote control environment through the most universal medium: the filesystem. The enhanced atomic transaction and detailed reporting features meet the high reliability requirements of enterprise environments.

While maintaining this philosophy, File Commander is poised to evolve into a more professional distributed control system by extending the injection medium beyond the filesystem to **Database (DB)** or **Redis**-based queue services.
