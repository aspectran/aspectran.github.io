---
title: Introduction to Aspectran Shell
subheadline: Core Guides
---

## 1. What is Aspectran Shell?

Aspectran Shell is a powerful **Interactive Command-Line Interface (REPL)** designed for real-time development, testing, operation, and administration of Aspectran applications. Far beyond a simple script runner for executing static utility commands, it is a fully integrated, standalone console platform capable of interacting directly with internal components, business logic (Translets), beans, AOP advices, and session states inside an active Aspectran application context (`ActivityContext`).

Aspectran Shell supports two runtime modes depending on the execution environment: a lightweight standard console (**Plain Shell**) and a JLine 3-powered rich console (**Rich Shell**). It delivers a modern terminal user experience complete with command history navigation, tab auto-completion, ANSI color/style text rendering, and output redirection (`>`, `>>`), enabling developers and operators to run and inspect backend logic directly in the terminal without requiring complex web UIs or external test clients.

[<img alt="asciicast" src="https://asciinema.org/a/1264203.png" class="img-fluid"/>](https://asciinema.org/a/1264203)

## 2. Core Architectural Philosophy & Features

### Unified Activity Architecture
The core design philosophy of Aspectran is that **the execution model across servlet-based web environments (`ServletWebActivity`), high-performance Netty web environments (`NettyActivity`), standalone daemon environments (`DaemonActivity`), and the CLI shell environment (`ShellActivity`) is identical**.
* When a user enters a command at the shell prompt, a `ShellActivity` instance is created, proceeding through the same action execution and transaction pipeline as a web request.
* The exact same Translet definition can be reused across web browsers (`GET /login`), background schedulers (Jobs), and shell commands (`aspectran-demo> login`) without modifying a single line of code.

### Interactive Parameter Prompting
When parameters required for execution are missing or contain dynamic placeholders, `TransletPreProcedure` prompts the user interactively in real time.
* Parameters can be passed directly as CLI options (e.g., `--id=admin --domain=aspectran.com`).
* If mandatory parameters (`mandatory="true"`) or `${placeholder}` expressions are left unspecified, the Shell automatically prompts the user for values.
* Sensitive values such as passwords support terminal masking (`****`) via the `secret="true"` attribute.

### Full AOP and Stateful Session Support in Console
Unlike transient command-line utilities, Aspectran Shell provides stateful session management and AOP proxy integration.
* **Stateful Sessions**: User authentication state and session-scoped beans are preserved across commands throughout the shell session, with optional persistence via a file store (`fileStore`).
* **AOP Integration**: Before and after advices can be applied to shell command execution for audit logging, execution timing, security verification, and exception handling.

### Immediate Feedback & AsEL Expression Evaluation
* **Real-time Result Transformation**: Translet execution outputs are immediately formatted and rendered on the console via Plain Text, JSON, APON, or token-based text templates.
* **AsEL (Aspectran Expression Language) Evaluation**: The built-in `evaluate` command allows developers to dynamically evaluate AsEL expressions, inspect bean properties, invoke methods, and check runtime environment properties on the fly.

### Embedded Server and Component Control
Embedded Undertow, Jetty, and Netty web servers running as background components can be started, stopped, restarted, and monitored directly from within the shell, as well as managing scheduled background jobs.

## 3. Plain Shell vs. Rich (JLine) Shell

Aspectran Shell provides two launcher modes to suit different environments and operational requirements.

| Feature | Plain Shell (`AspectranShell`) | Rich Shell (`JLineAspectranShell`) |
| :--- | :--- | :--- |
| **Module** | `aspectran-shell` | `aspectran-shell-jline` |
| **Console Implementation** | `DefaultShellConsole` (Standard I/O) | `JLineShellConsole` (JLine 3 Terminal) |
| **Styler** | `DefaultConsoleStyler` | `JLineConsoleStyler`, `JLineTextStyler` |
| **Auto-Completion (Tab)** | Not Supported | Supported (Commands, Options, Subcommands, File Paths) |
| **Command History** | In-Memory Only | Arrow Key Navigation & Persistent File Logging |
| **Terminal Control** | Basic Console I/O | Full ANSI Styling, Cursor Control, Line Editing |
| **Recommended Use Cases** | CI/CD Pipelines, Non-interactive Automation, Headless Containers | Local Development (IDE), Interactive Operations Terminal |

## 4. Architecture and Internal Execution Model

Aspectran Shell cleanly decouples its responsibilities into the service layer (`ShellService`), command execution layer (`ShellCommander`), console I/O layer (`ShellConsole`), and the single-execution context (`ShellActivity`).

```
+-------------------------------------------------------------+
|               Shell Console (Plain or JLine 3)              |
|           Prompt, LineReader, History, Completer            |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                      DefaultShellCommander                  |
|          CommandRegistry, OptionParser, Redirection         |
+-------------------------------------------------------------+
         |                                           |
         v (Built-in Commands)                       v (Translet Commands)
+----------------------------+            +-------------------------+
|  Built-in Command Handlers |            |   TransletPreProcedure  |
|  help, sysinfo, aspect     |            |   - Interactive Prompt  |
|  netty, undertow, etc.     |            |   - Parameter Binding   |
+----------------------------+            +-------------------------+
                                                     |
                                                     v
                                          +-------------------------+
                                          |      ShellActivity      |
                                          |  - ShellRequestAdapter  |
                                          |  - ShellResponseAdapter |
                                          |  - ShellSessionAdapter  |
                                          +-------------------------+
                                                     |
                                                     v
                                          +-------------------------+
                                          |   ActivityContext Core  |
                                          |   Bean, AOP, Translet   |
                                          +-------------------------+
```

### Key Components
* **`ShellService` (`DefaultShellService`)**: The top-level service managing the entire shell lifecycle (initialize, start, pause, restart, destroy).
* **`ShellConsole` (`DefaultShellConsole` / `JLineShellConsole`)**: The console I/O abstraction managing input streams, terminal properties, and ANSI text rendering.
* **`ShellCommander` (`DefaultShellCommander` / `JLineShellCommander`)**: Parses user inputs and dispatches them to registered built-in commands or Translets.
* **`ShellActivity`**: The execution context for a single command invocation.
  * `ShellRequestAdapter`: Converts CLI arguments and interactive inputs into Translet parameters and attributes.
  * `ShellResponseAdapter`: Manages the output stream/writer directing response data to the console or redirected output files.
  * `ShellSessionAdapter`: Bridges the interactive user session with Aspectran's session management engine.

## 5. Console Text Styling & ANSI Color System

Aspectran Shell (particularly `aspectran-shell-jline`) provides rich, intuitive inline text styling markup through `JLineConsoleStyler` and `JLineTextStyler`.

### 1) Style Markup Syntax
{% raw %}Styles are embedded directly inside strings using `{{style1,style2,...}}` tags and reset using `{{reset}}`.{% endraw %}

```text
{% raw %}This is {{bold,red}}important{{reset}} text.
Welcome to {{bold,CYAN}}Aspectran Shell{{reset}}!{% endraw %}
```

### 2) Supported Text Attributes

| Attribute Keyword | Description | Disable Keyword |
| :--- | :--- | :--- |
| `bold` | Bold text | `bold:off` |
| `faint` | Faint (dimmed) text | `bold:off` |
| `italic` | Italicized text | `italic:off` |
| `underline` | Underlined text | `underline:off` |
| `blink` | Blinking text | `blink:off` |
| `inverse` | Swaps foreground and background colors | `inverse:off` |
| `conceal` | Hidden/concealed text | `conceal:off` |
| `crossedOut` | Strikethrough text | `crossedOut:off` |

### 3) Color Specification Modes
Foreground colors can be named directly or prefixed with `fg:`. Background colors must be prefixed with `bg:`.
{% raw %}
* **Standard and Bright Named Colors**
  * Standard (Lowercase): `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`, `gray`
  * Bright (Uppercase): `RED`, `GREEN`, `YELLOW`, `BLUE`, `MAGENTA`, `CYAN`, `WHITE`, `GRAY`
* **256-Color Palette**
  * Specified by an integer code between 0 and 255.
  * Foreground: `{{208}}` or `{{fg:208}}`
  * Background: `{{bg:208}}`
* **24-Bit TrueColor RGB (Hex RGB)**
  * Specified by a 6-digit hexadecimal string (without `#`).
  * Foreground: `{{ff8800}}` or `{{fg:ff8800}}`
  * Background: `{{bg:ffffff}}`
{% endraw %}
### 4) Resetting Styles
* `reset`: Reverts all styles, attributes, and colors back to the terminal default.
* `fg:off`: Reverts only the foreground color (preserves font weight and background color).
* `bg:off`: Reverts only the background color.

### 5) Semantic Styles and Caching
Semantic style names defined under `shell.style` in `aspectran-config.apon` (`primary`, `secondary`, `success`, `danger`, `warning`, `info`) are parsed and cached by `JLineConsoleStyler` as JLine `AttributedStyle` instances for high-performance console output.

```apon
shell: {
    style: {
        primary: GRAY
        secondary: green
        success: cyan
        danger: red
        warning: YELLOW
        info: BLUE
    }
}
```

## 6. JLine Tab Auto-Completion

In the Rich Shell (`JLineAspectranShell`) environment, JLine 3's built-in `Completer` pipeline provides extensive auto-completion:

* **Command Completion**: Pressing `Tab` at the prompt lists and completes all registered built-in commands and publicly accessible Translets.
* **Option Flag Completion**: Typing `-` or `--` followed by `Tab` suggests all valid option flags (e.g., `-l`, `--list`, `-d`, `--detail`).
* **Subcommand Completion**: Pressing `Tab` after server commands such as `netty`, `undertow`, or `jetty` automatically suggests `start`, `stop`, `restart`, and `status`.
* **Filesystem Path Completion**: Pressing `Tab` after output redirection operators (`>`, `>>`) completes relative and absolute file paths on the local filesystem.

## 7. Built-in Commands Reference

Aspectran Shell provides a comprehensive set of built-in system and management commands.

| Command | Description | Common Options & Usage Examples |
| :--- | :--- | :--- |
| `help` | Displays the list of available commands and specific command usage. | `help`, `translet -h` |
| `translet` | Inspects and executes registered Translets. | `translet -l` (list), `translet -la` (list all), `translet -d <name>` (detail), `translet <name>` |
| `aspect` | Inspects registered Aspects (AOP) and dynamically enables or disables them. | `aspect -l`, `aspect -d <id>`, `aspect -enable <id>`, `aspect -disable <id>` |
| `job` | Manages scheduled background jobs (list, pause, resume). | `job -l`, `job -d <job_name>`, `job -pause <job_name>`, `job -resume <job_name>` |
| `netty` | Controls the embedded Netty server (start, stop, restart, status). | `netty start`, `netty stop`, `netty status`, `netty restart` |
| `undertow` | Controls the embedded Undertow server. | `undertow start`, `undertow stop`, `undertow status` |
| `jetty` | Controls the embedded Jetty server. | `jetty start`, `jetty stop`, `jetty status` |
| `sysinfo` | Displays JVM version, memory statistics, OS details, and system properties. | `sysinfo`, `sysinfo -props` |
| `echo` | Prints text to the console (useful for testing markup and expressions). | `echo Hello {{GREEN}}Aspectran{{reset}}` |
| `evaluate` | Evaluates AsEL expressions in the current application context. | `evaluate "#{class:com.aspectran.core.AboutMe^version}"` |
| `history` | Displays command history for the active session. | `history` |
| `clear` | Clears the terminal screen. | `clear` |
| `verbose` | Toggles verbose mode (displays Translet descriptions before execution). | `verbose` |
| `restart` | Hot-reloads all resources and restarts the Aspectran context. | `restart` |
| `quit` | Gracefully exits the shell console. | `quit`, `quit -f` (force exit without confirmation) |
| `encrypt` / `decrypt` | Encrypts or decrypts strings using password-based encryption (PBE). | `encrypt <text>`, `decrypt <encrypted_text>` |

## 8. Translet Execution & Interactive Parameters

### 1) Basic Translet Execution
Registered Translets can be executed either via `translet <name>` or simply by typing the Translet name as a shorthand command.

```bash
aspectran-demo> hello
Executes the method helloActivity.helloWorld() and prints the
returned value to the console.
Hello, World!
```

### 2) Passing Parameters via Command-Line Options
Parameters can be passed directly using `--<param_name>=<value>` syntax.

```bash
aspectran-demo> login --id=admin --domain=aspectran.com --password=secret
-------------------------------------------------------------------------
You have entered the following parameters for login:
   email: admin@aspectran.com
   password: secret
-------------------------------------------------------------------------
```

### 3) Interactive Prompting & Masked Input
When a Translet defines mandatory parameters (`mandatory="true"`) or placeholder tokens and the user executes the command without specifying them, the Shell automatically initiates interactive prompting. Passwords configured with `secret="true"` are masked on the screen.

**Translet Definition (`login.xml`):**
```xml
<translet name="login">
    <description style="apon">
        |It accepts parameters required for login and prints them.
    </description>
    <parameters>
        <item name="id" mandatory="true"/>
        <item name="email" mandatory="true">${id}@${domain}</item>
        <item name="password" secret="true" value="${password:(none)}"/>
    </parameters>
    <transform format="text">
        <template style="apon">
            |-------------------------------------------------------------------------
            |You have entered the following parameters for login:
            |   email: ${email}
            |   password: ${password}
            |-------------------------------------------------------------------------
        </template>
    </transform>
</translet>
```

**Interactive Execution Flow:**
```bash
aspectran-demo> login
Required parameters:
 * id: ${id}
 * email: ${id}@${domain}
   password: ********
Please enter a value for each placeholder:
   ${id}: tester
   ${domain}: aspectran.com
   ${password}: ****
-------------------------------------------------------------------------
You have entered the following parameters for login:
   email: tester@aspectran.com
   password: pass
-------------------------------------------------------------------------
```

### 4) Output Redirection
Command and Translet outputs can be redirected directly to files on disk:
* `>`: Overwrite file with output
* `>>`: Append output to the end of the file

```bash
aspectran-demo> sysinfo > sysinfo.txt
aspectran-demo> login --id=admin --domain=aspectran.com >> login_history.log
```

## 9. Asynchronous Translet Execution (`async="true"`)

Long-running operations such as large data aggregation, external batch calls, or background processing can be executed asynchronously by setting `async="true"` on the Translet.

```xml
{% raw %}<translet name="async1" async="true">
    <description style="apon">
        |Executes a long-running task asynchronously in background.
    </description>
    <action id="sleepAction" bean="asyncActivity" method="sleep">
        <argument valueType="long">2000</argument>
    </action>
    <transform format="text">
        <template engine="token" style="apon">
            |{{gray}}----------------------------------------------------------{{reset}}
            |@{sleepAction}
            |{{gray}}----------------------------------------------------------{{reset}}
        </template>
    </transform>
</translet>{% endraw %}
```

* **Execution Flow**: When `async1` is invoked in the shell, execution is dispatched to Aspectran's background executor thread pool without blocking the shell's main interaction thread.
* **Output Streaming**: Upon completion, the result stream is flushed to the terminal console through `ShellResponseAdapter`.

## 10. Stateful Session Management in CLI

Aspectran Shell maintains user authentication state and session-scoped beans across invocations via `ShellSessionAdapter`.

```
[User Shell Connection] ---> [ShellSession Created (Assigned Session ID)]
                                        |
                                        v
                        aspectran-demo> login (Success)
                        ==> Authentication profile bound to session
                                        |
                                        v
                        aspectran-demo> my-profile / execute-job
                        ==> Session attributes injected & permissions granted
                                        |
                                        v
                        [On Timeout or Shell Exit: Persisted via FileStore]
```

* **Session Attribute Sharing**: Attributes bound upon login can be referenced in subsequent Translet executions or token expressions (e.g., `#{userSession^userId}`, `@{userProfile}`).
* **Session Persistence (`fileStore`)**: With `session.fileStore` configured in `aspectran-config.apon`, active session states can survive shell restarts.

## 11. Translet Access Control & Visibility (`acceptable` Rules)

Web, daemon, and shell translets can coexist in the same application. The `shell.acceptable` configuration defines which translets are exposed in the shell environment.

```apon
shell: {
    # Deny all by default, then selectively expose patterns
    acceptable: {
        -: /**
        +: hello*
        +: echo*
        +: login
        +: chpw
    }
}
```

* **`translet -l` (List)**: Lists only exposed Translets matching the `acceptable` rules.
* **`translet -la` (List All)**: Lists all registered Translets in the application, including non-exposed internal Translets (similarly, `translet -d` vs. `translet -da` for details).

## 12. Console View Transformation & Formatting Tips

Rather than HTML templates used in web environments, Shell Translets utilize text-based templates to generate clean Text User Interfaces (TUI).

* **`format="text"` + `style="apon"` (Recommended)**: Utilizes APON pipe (`|`) multiline syntax to align code indentation with terminal output formatting.
* **Token Substitution (`engine="token"`)**:
  * `${parameterName}`: References current request parameter values.
  * `@{attributeName}`: References current request/activity attributes and action execution results.
  * `#{beanId^propertyName}`: References Bean instances and property/method invocations.
  * `%{propertyName}`: References system and application configuration properties.
  * `~{templateId}`: Inlines the rendered output of another template.
* **ANSI Style Integration**: Embed style tags like `{{CYAN}}`, `{{bold}}`, and `{{reset}}` inside template bodies to create visually structured tables and status boxes.

## 13. Implementing Custom Commands

Developers can easily create custom CLI commands tailored to their application by extending `AbstractCommand`.

### Writing a Custom Command Class
Extend `AbstractCommand`, define command descriptors, options (`Options`), and implement the `execute` method.

```java
package com.aspectran.demo.shell;

import com.aspectran.shell.command.AbstractCommand;
import com.aspectran.shell.command.CommandRegistry;
import com.aspectran.shell.command.option.Option;
import com.aspectran.shell.command.option.Options;
import com.aspectran.shell.command.option.ParsedOptions;

public class CustomGreetingCommand extends AbstractCommand {

    public CustomGreetingCommand(CommandRegistry registry) {
        super(registry);

        // Define options
        Options options = new Options();
        options.addOption(new Option("name", "n", true, "The name of the user to greet"));
        setOptions(options);
    }

    @Override
    public Object execute(ParsedOptions parsedOptions) throws Exception {
        String name = parsedOptions.getValue("name", "Aspectran User");
        getConsole().writeLine("Hello, " + name + "! Welcome to Custom Shell Command.");
        return null;
    }

    @Override
    public String getDescriptor() {
        return "Prints a customized greeting message to the console";
    }

}
```

### Registering in `aspectran-config.apon`
Add the fully qualified class name of the custom command to the `shell.commands` list.

```apon
shell: {
    commands: [
        com.aspectran.demo.shell.CustomGreetingCommand
        # ... other built-in commands ...
    ]
}
```

## 14. Configuration Guide (`aspectran-config.apon`)

The root configuration file (`aspectran-config.apon`) defines all operational parameters for the shell environment.

```apon
{% raw %}shell: {
    # Text styling and semantic ANSI color palette definitions
    style: {
        primary: GRAY
        secondary: green
        success: cyan
        danger: red
        warning: YELLOW
        info: BLUE
    }

    # Greeting banner displayed upon shell startup
    greetings: (
        |{{CYAN}}:: Built with Aspectran :: {{RED}}#{class:com.aspectran.core.AboutMe^version}{{reset}}
        |
        |To see a list of all built-in commands, type {{GREEN}}help{{reset}}.
        |To list all available translets, type {{CYAN}}translet -l{{reset}}.
    )

    # Shell prompt string (supports ANSI style tags)
    prompt: "{{green}}aspectran-demo>{{reset}} "

    # Registered command handlers
    commands: [
        com.aspectran.netty.shell.command.NettyCommand
        com.aspectran.undertow.shell.command.UndertowCommand
        com.aspectran.jetty.shell.command.JettyCommand
        com.aspectran.shell.command.builtins.TransletCommand
        com.aspectran.shell.command.builtins.AspectCommand
        com.aspectran.shell.command.builtins.JobCommand
        com.aspectran.shell.command.builtins.PBEncryptCommand
        com.aspectran.shell.command.builtins.PBDecryptCommand
        com.aspectran.shell.command.builtins.SysInfoCommand
        com.aspectran.shell.command.builtins.EchoCommand
        com.aspectran.shell.command.builtins.EvaluateCommand
        com.aspectran.shell.command.builtins.HistoryCommand
        com.aspectran.shell.command.builtins.ClearCommand
        com.aspectran.shell.command.builtins.VerboseCommand
        com.aspectran.shell.command.builtins.HelpCommand
        com.aspectran.shell.command.builtins.RestartCommand
        com.aspectran.shell.command.builtins.QuitCommand
    ]

    # Session management configuration
    session: {
        maxActiveSessions: 1
        maxIdleSeconds: 1800
        scavengingIntervalSeconds: 600
        fileStore: {
            storeDir: /work/_sessions/shell
        }
        enabled: true
    }

    # Command history log file path
    historyFile: /logs/history.log

    # Default verbose mode for translet execution
    verbose: true

    # Translet visibility and access filter
    acceptable: {
        -: /**
        +: hello*
        +: echo*
        +: login
        +: chpw
    }
}{% endraw %}
```

## 15. Running in Development Environment (IDE)

Aspectran Shell can be launched and debugged directly in an IDE using standard Java `main()` methods without requiring deployment packages. Place runner classes under `src/test/java`.

### 1) Rich Shell Runner (`DemoRichShell.java`)
Launches the JLine 3-based shell with full auto-completion and interactive styling.

```java
package com.aspectran.demo;

import com.aspectran.shell.jline.JLineAspectranShell;
import com.aspectran.utils.ResourceUtils;

import java.io.File;
import java.io.IOException;

import static com.aspectran.core.context.config.AspectranConfig.BASE_PATH_PROPERTY;

public class DemoRichShell {

    public static void main(String[] args) {
        try {
            File baseDir = new File(ResourceUtils.getResourceAsFile(""), "../../app");
            System.setProperty(BASE_PATH_PROPERTY, baseDir.getCanonicalPath()); // for logback

            // To output debug logs to console, enable logback-debug.xml (optional)
            // System.setProperty("logback.configurationFile", new File(baseDir, "config/logging/logback-debug.xml").getCanonicalPath());

            // Bootstrap JLineAspectranShell
            JLineAspectranShell.main(new String[] {
                baseDir.getCanonicalPath(),
                "config/aspectran-config.apon"
            });
        } catch (IOException e) {
            e.printStackTrace(System.err);
        }
    }

}
```

### 2) Plain Shell Runner (`DemoPlainShell.java`)
Launches the lightweight shell operating on standard System.in/System.out streams.

```java
package com.aspectran.demo;

import com.aspectran.shell.AspectranShell;
import com.aspectran.utils.ResourceUtils;

import java.io.File;
import java.io.IOException;

import static com.aspectran.core.context.config.AspectranConfig.BASE_PATH_PROPERTY;

public class DemoPlainShell {

    public static void main(String[] args) {
        try {
            File baseDir = new File(ResourceUtils.getResourceAsFile(""), "../../app");
            System.setProperty(BASE_PATH_PROPERTY, baseDir.getCanonicalPath()); // for logback

            // Bootstrap standard AspectranShell
            AspectranShell.main(new String[] {
                baseDir.getCanonicalPath(),
                "config/aspectran-config.apon"
            });
        } catch (IOException e) {
            e.printStackTrace(System.err);
        }
    }

}
```

### 3) Enabling Debug Logging in IDE
To inspect bean creation, translet dispatching, and AOP advice execution in the IDE console:
* **In Java Code**: Set `System.setProperty("logback.configurationFile", "config/logging/logback-debug.xml");` before calling `main()`.
* **Via VM Options**: Add `-Dlogback.configurationFile=app/config/logging/logback-debug.xml` in the IDE Run/Debug Configuration.

## 16. Production Deployment & Execution Guide

In production server environments (Linux, macOS, Windows), start Aspectran Shell using the scripts located in `app/bin`.

```
app/
├── bin/
│   ├── shell.sh          # Linux/macOS shell script
│   ├── shell.bat         # Windows batch file
│   └── run.options       # JVM options and system property configuration
├── config/
│   ├── aspectran-config.apon
│   └── logging/
│       ├── logback.xml         # Standard production logging configuration
│       └── logback-debug.xml   # Debug mode logging configuration
└── lib/
```

### 1) Execution Script (`shell.sh` / `shell.bat`)
Run the shell directly in a terminal session:

```bash
$ cd app/bin
$ ./shell.sh
```

### 2) Debug Logging Mode (`--debug`)
Passing the `--debug` option switches from `logback.xml` to `config/logging/logback-debug.xml`, streaming real-time initialization and execution debug logs to the terminal.

```bash
$ cd app/bin
$ ./shell.sh --debug
```

### 3) JVM Options (`run.options`)
Configure JVM heap memory, garbage collection parameters, and file encodings.

```text
-Xms256m
-Xmx1024m
-Dfile.encoding=UTF-8
```

## 17. Practical Application Scenarios

### 1) Rapid Business Logic Testbed (Developer Console)
Test DAO/Service layers and Translets directly from the terminal with real parameters before developing web controllers or front-end UIs.

### 2) Enterprise Operations & Bastion Management Console
Provide an interactive, restricted admin console for operations teams over SSH.
* Perform emergency DB patches, cache invalidation, and manual batch job triggers.
* Combine with AOP audit advices to record every executed command, parameter, and timestamp to files or audit databases.

### 3) Interactive Data ETL & Migration Workbench
Guide operators step-by-step through parameter entry via `TransletPreProcedure` before executing large-scale database migrations or data processing pipelines.

### 4) Next-Gen AI Agent & Local Copilot Runtime
Leverage the structured input/output schemas of Translets and session management to serve as a robust Function Calling execution platform for local LLM agents and CLI copilots.

## 18. Related Documentation

* [Aspectran User Guide](https://aspectran.com/en/docs/guides/aspectran-user-guide/)
* [Practical Guide to Aspectran Translets](https://aspectran.com/en/docs/guides/practical-guide-to-translets/)
* [Aspectran AOP: Features & Architecture](https://aspectran.com/en/docs/guides/aspectran-aop/)
* [Guide to Setting and Styling Shell Greetings in Aspectran](https://aspectran.com/en/docs/guides/practical-guide-to-shell-greetings/)
* [Introduction to APON (Aspectran Parameters Object Notation)](https://aspectran.com/en/docs/guides/introduce-apon/)
* [Introduction to Aspectran Daemon](https://aspectran.com/en/docs/guides/aspectran-daemon-introduction/)
* [Aspectran Daemon: Remote Command Injection and Control](https://aspectran.com/en/docs/guides/aspectran-daemon-introduction/)
