---
format: plate solid article
sidebar: toc
title: Aspectran Basic Configuration Guide
subheadline: User Guides
parent_path: /docs
---

The "Basic Configuration" provides the core settings required for the initial startup of an Aspectran application. Based on this, you can specify targets for annotation-based component scanning or instruct the application to load additional rule files in XML or APON format.

While you can set the configuration values directly through the `com.aspectran.core.context.config.AspectranConfig` object at application startup, it is common practice to create and use an `aspectran-config.apon` file in APON (Aspectran Parameter Object Notation) format.

The `aspectran-config.apon` file is loaded into an `AspectranConfig` object and consists of the following main sections:

*   `system`: Defines system-related properties (e.g., encryption keys, thread pool settings).
*   `context`: Contains settings related to the ActivityContext, which holds the core logic of the application (e.g., loading rule files, bean scan paths, profiles).
*   `scheduler`: Settings related to the scheduler.
*   `shell`: Settings for the shell-based application environment.
*   `daemon`: Settings for the daemon process environment.
*   `web`: Settings for the web application environment.

---

## 1. System Settings (`system`)

You can add system-level properties. This is mainly used to define values that affect external libraries or JVM system properties.

**Warning:** Although the demo application specifies an encryption key directly for convenience, **you should never store passwords in plaintext here in a production environment.** You must use secure methods such as external configuration files, environment variables, or a Vault.

```apon
system: {
    properties: {
        aspectran.encryption.password: "demo!"
        aspectran.encryption.algorithm: PBEWithMD5AndTripleDES
        jboss.threads.eqe.statistics: true
        jboss.threads.eqe.statistics.active-count: true
    }
}
```

- **`properties`**: The key-value pairs defined here are registered as system properties via `System.setProperty()`.

---

## 2. Context Settings (`context`)

Defines the settings required to create the `ActivityContext`, which constitutes the core logic of the application. This section is like the heart of Aspectran, and most application settings are concentrated here.

```apon
context: {
    name: root
    rules: /config/root-context.xml
    resources: [
        /lib/ext
    ]
    scan: [
        app.root
    ]
    profiles: {
        default: [
            dev
        ]
    }
    autoReload: {
        scanIntervalSeconds: 5
        enabled: false
    }
    singleton: true
}
```

- **`name`**: Specifies a unique name for the `ActivityContext`.
- **`rules`**: Specifies the path to the core rule files written in XML or APON format. You can specify multiple files in an array. These files define major rules such as **Bean, Translet, and Aspect**.
- **`resources`**: Adds multiple directory paths for the application classloader to find libraries (JAR files) or resources. For example, `resources: [ /lib/ext ]` means adding the `/lib/ext` directory under the application's execution location to the classpath.
- **`scan`**: Specifies the base packages for component scanning. Aspectran finds classes annotated with `@Component`, `@Bean`, `@Aspect`, etc., in the specified packages and automatically registers them as beans.
- **`profiles`**: Sets up profiles to distinguish the application's execution environment.
    - **`base`**: Specifies the base profiles that should always be active.
    - **`active`**: Specifies the currently active profiles. Multiple profiles are separated by commas (`,`).
    - **`default`**: Specifies the default profiles to be activated if no `active` profiles are specified.
- **`autoReload`**: Allows dynamic reloading of changed configuration files without restarting the server during development.
    - **`scanIntervalSeconds`**: Specifies the interval in seconds for scanning files for changes.
    - **`enabled`**: Enables or disables the auto-reload feature (`true` or `false`).
- **`singleton`**: A setting to prevent the application from running concurrently if it is already running. Setting it to `true` can prevent duplicate execution.

---

## 3. Scheduler Settings (`scheduler`)

Defines the settings required to manage scheduled tasks within the application.

```apon
scheduler: {
    startDelaySeconds: 3
    waitOnShutdown: true
    enabled: false
}
```

- **`startDelaySeconds`**: Specifies the time in seconds to wait before the scheduler starts executing the first job after it has started.
- **`waitOnShutdown`**: Sets whether to wait for currently executing scheduled jobs to complete when the application shuts down.
- **`enabled`**: Sets whether to enable the scheduler feature. Scheduling will only work if this is set to `true`.

---

## 4. Shell Application Settings (`shell`)

Defines the environment for running Aspectran as a standalone shell (Command-Line Interface) application.

- **`style`**: Defines the color styles for the shell prompt and output messages.
- **`greetings`**: Defines the welcome message to be displayed when the shell starts.
- **`prompt`**: Defines the format of the shell command-line prompt.
- **`commands`**: Registers the full class paths of command classes to be used in the shell environment as an array. Only the commands registered here can be used in that shell.
- **`session`**: Defines the shell session management settings.
    - **`workerName`**: A unique name for the worker to be included in the session ID. If you use multiple session managers in one application, you must set this value to be unique to avoid session ID collisions. (e.g., in the session ID `1757036789577_1itojbks5r0jw1fsahrs1se7e70.rn0`, the `.rn0` part corresponds to the worker name).
    - **`maxActiveSessions`**: Specifies the maximum number of sessions that can be active at the same time.
    - **`maxIdleSeconds`**: The maximum time in seconds that a regular session can remain inactive. The session may expire after this time.
    - **`maxIdleSecondsForNew`**: The maximum idle time in seconds for a new session. If no attributes are added within this time after session creation, it expires.
    - **`scavengingIntervalSeconds`**: Specifies the execution interval in seconds for the scavenger thread that cleans up expired sessions.
    - **`evictionIdleSeconds`**: After a regular session expires, it is **permanently deleted** from the store after this grace period.
    - **`evictionIdleSecondsForNew`**: After a new session expires, it is permanently deleted after this grace period.
    - **`fileStore`**: Used to store session data in a file-based store.
        - **`storeDir`**: Specifies the directory path where session files will be stored.
    - **`enabled`**: Sets whether the session management feature is enabled.
- **`historyFile`**: Specifies the file path to save the shell command history.
- **`verbose`**: Sets whether to enable verbose mode.
- **`acceptable`**: Defines Translet request patterns to be allowed or denied in the shell.

#### Shell Built-in Commands

These are the default commands provided by the Aspectran framework, and developers can also implement and add their own commands. To use the built-in commands below, you must explicitly add the full class path of the command to the `commands` array above.

| Command | Description |
| :--- | :--- |
| `aspect` | `com.aspectran.shell.command.builtins.AspectCommand`<br/>Views registered Aspect rules or changes their active/inactive state. |
| `job` | `com.aspectran.shell.command.builtins.JobCommand`<br/>Views scheduled Job rules or changes their active/inactive state. |
| `translet` | `com.aspectran.shell.command.builtins.TransletCommand`<br/>Views registered Translet rules or executes them directly. |
| `sysinfo` | `com.aspectran.shell.command.builtins.SysInfoCommand`<br/>Prints system information such as JVM system properties, classpath, and memory usage. |
| `encrypt` | `com.aspectran.shell.command.builtins.PBEncryptCommand`<br/>Encrypts a string using Password-Based Encryption (PBE). |
| `decrypt` | `com.aspectran.shell.command.builtins.PBDecryptCommand`<br/>Decrypts a string encrypted with PBE. |
| `restart` | `com.aspectran.shell.command.builtins.RestartCommand`<br/>Restarts the shell service to reload all settings. |
| `help` | `com.aspectran.shell.command.builtins.HelpCommand`<br/>Displays a list of commands or help for a specific command. |
| `history` | `com.aspectran.shell.command.builtins.HistoryCommand`<br/>Views or deletes the command input history. |
| `clear` | `com.aspectran.shell.command.builtins.ClearCommand`<br/>Clears the console screen. |
| `echo` | `com.aspectran.shell.command.builtins.EchoCommand`<br/>Prints the input message as is. |
| `verbose` | `com.aspectran.shell.command.builtins.VerboseCommand`<br/>Sets whether to print a detailed description of a Translet before its execution. |
| `quit` | `com.aspectran.shell.command.builtins.QuitCommand`<br/>Exits the shell. |
| `jetty` | `com.aspectran.jetty.shell.command.JettyCommand`<br/>Controls the embedded Jetty server (start/stop/restart/status). |
| `undertow` | `com.aspectran.undertow.shell.command.UndertowCommand`<br/>Controls the embedded Undertow server (start/stop/restart/status). |

---

## 5. Daemon Application Settings (`daemon`)

Defines the environment for running Aspectran as a background daemon process.

- **`executor`**: Defines thread pool settings for executing daemon tasks.
    - **`maxThreads`**: Specifies the maximum number of threads.
- **`polling`**: Defines the polling behavior of the daemon.
    - **`pollingInterval`**: Specifies the polling interval in milliseconds.
    - **`requeuable`**: Sets whether a task can be re-queued on failure.
    - **`incoming`**: Specifies the Translet path to handle requests coming in through polling.
- **`commands`**: Registers the full class paths of command classes to be used in the daemon environment as an array. Only commands registered here can be used in that daemon.
- **`session`**: Defines daemon session management settings. This setting has the same sub-items as the `shell`'s `session` setting.
- **`acceptable`**: Defines Translet request patterns to be allowed or denied in the daemon.

#### Daemon Built-in Commands

These are the default commands provided by the Aspectran framework, and developers can also implement and add their own commands. To use the built-in commands below, you must explicitly add the full class path of the command to the `commands` array above.

| Command | Description |
| :--- | :--- |
| `component` | `com.aspectran.daemon.command.builtins.ComponentCommand`<br/>Views detailed information or controls the state of components like Aspect, Translet, and Job. |
| `invokeAction` | `com.aspectran.daemon.command.builtins.InvokeActionCommand`<br/>Directly executes a method of a specified Bean. |
| `translet` | `com.aspectran.daemon.command.builtins.TransletCommand`<br/>Executes a registered Translet. |
| `pollingInterval` | `com.aspectran.daemon.command.builtins.PollingIntervalCommand`<br/>Dynamically changes the command polling interval for file-based commands. |
| `sysinfo` | `com.aspectran.daemon.command.builtins.SysInfoCommand`<br/>Prints JVM system information. |
| `restart` | `com.aspectran.daemon.command.builtins.RestartCommand`<br/>Restarts the daemon service. |
| `quit` | `com.aspectran.daemon.command.builtins.QuitCommand`<br/>Stops the daemon. |
| `jetty` | `com.aspectran.jetty.daemon.command.JettyCommand`<br/>Controls the embedded Jetty server. |
| `undertow` | `com.aspectran.undertow.daemon.command.UndertowCommand`<br/>Controls the embedded Undertow server. |

---

## 6. Web Application Settings (`web`)

Defines the environment for running Aspectran as a web application.

- **`uriDecoding`**: Specifies the character encoding to use for URI decoding.
- **`defaultServletName`**: Specifies the name of the default servlet to handle static resources, etc. If set to `none`, requests not handled by Aspectran will not be passed to the default servlet.
- **`trailingSlashRedirect`**: Sets whether to automatically redirect by adding a slash (`/`) to the end of a URI if it is missing.
- **`legacyHeadHandling`**: Sets whether to treat HEAD requests like GET requests for compatibility with legacy systems.
- **`acceptable`**: Defines Translet request URL patterns to be allowed (`+`) or denied (`-`) in the web environment. `/**` means all requests.

---

## 7. Full Configuration Example

The following is a complete example of an `aspectran-config.apon` file that includes all the sections described above.

```apon
{% raw %}system: {
    properties: {
        aspectran.encryption.password: demo!
        aspectran.encryption.algorithm: PBEWithMD5AndTripleDES
        jboss.threads.eqe.statistics: true
        jboss.threads.eqe.statistics.active-count: true
    }
}
context: {
    name: root
    rules: /config/root-context.xml
    resources: [
        /lib/ext
    ]
    scan: [
        app.root
    ]
    profiles: {
        default: [
            dev
        ]
    }
    autoReload: {
        scanIntervalSeconds: 5
        enabled: false
    }
    singleton: true
}
scheduler: {
    startDelaySeconds: 3
    waitOnShutdown: true
    enabled: false
}
shell: {
    style: {
         primary: GRAY
         secondary: green
         success: cyan
         danger: red
         warning: YELLOW
         info: BLUE
    }
    greetings: (
        |
        |{{WHITE  }}     ___                         __
        |{{CYAN   }}    /   |  _________  ___  _____/ /_____ _      __
        |{{GREEN  }}   / /| | / ___/ __ \/ _ \/ ___/ __/ __ \ | /| / /
        |{{YELLOW }}  / ___ |(__  ) /_/ /  __/ /__/ /_/ /_/ / |/ |/ /
        |{{RED    }} /_/  |_/____/ .___/\___/\___/\__/\____/|__/|__/    {{WHITE}}Enterprise Edition
        |{{gray   }}=========== /_/ ==========================================================
        |{{MAGENTA}}:: Built with Aspectran :: {{RED}}#{class:com.aspectran.core.AboutMe^version}{{reset}}
        |
        |{{gray   }}To see a list of all built-in commands, type {{GREEN}}help{{reset}}.
        |{{gray   }}To get help for a specific command, type {{GREEN}}command_name -h{{reset}}.
        |{{gray   }}To list all available translets, type {{CYAN}}translet -l{{reset}}.
        |{{gray   }}To run a translet, type {{CYAN}}translet <translet_name>{{gray}} or just {{CYAN}}translet_name{{reset}}.
    )
    prompt: "{{green}}aspectow-demo>{{reset}} "
    commands: [
        com.aspectran.undertow.shell.command.UndertowCommand
        com.aspectran.shell.command.builtins.TransletCommand
        com.aspectran.shell.command.builtins.AspectCommand
        com.aspectran.shell.command.builtins.JobCommand
        com.aspectran.shell.command.builtins.PBEncryptCommand
        com.aspectran.shell.command.builtins.PBDecryptCommand
        com.aspectran.shell.command.builtins.SysInfoCommand
        com.aspectran.shell.command.builtins.EchoCommand
        com.aspectran.shell.command.builtins.HistoryCommand
        com.aspectran.shell.command.builtins.ClearCommand
        com.aspectran.shell.command.builtins.VerboseCommand
        com.aspectran.shell.command.builtins.HelpCommand
        com.aspectran.shell.command.builtins.RestartCommand
        com.aspectran.shell.command.builtins.QuitCommand
    ]
    session: {
        workerName: shell
        maxActiveSessions: 1
        maxIdleSeconds: 1800
        scavengingIntervalSeconds: 600
        fileStore: {
            storeDir: /work/_sessions/shell
        }
        enabled: true
    }
    historyFile: /logs/history.log
    verbose: true
    acceptable: {
        -: /**
    }
}
daemon: {
    executor: {
        maxThreads: 5
    }
    polling: {
        pollingInterval: 5000
        requeuable: true
        incoming: /cmd/incoming
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
    ]
    session: {
        workerName: daemon
        enabled: true
    }
    acceptable: {
        -: /**
    }
}
web: {
    uriDecoding: utf-8
    defaultServletName: none
    trailingSlashRedirect: true
    legacyHeadHandling: true
    acceptable: {
        +: /**
    }
}{% endraw %}
```