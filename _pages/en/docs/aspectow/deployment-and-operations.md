---
title: Aspectow Deployment and Operations Guide
teaser: This guide provides detailed instructions on how to deploy and manage Aspectow applications as services in Linux/Unix and Windows environments.
subheadline: Aspectow
---

There are two main execution methods described in this guide:
1.  **Automated Deployment and Service Management**: The standard operational method using scripts in the `setup` directory to install the application on a server, build/deploy it, and manage it as a system service. **(Recommended)**
2.  **Manual Execution and Management**: A method for running the application directly for development or testing purposes using scripts in the `app/bin` directory.

## 1. Prerequisites

Before proceeding with the deployment, the following software must be installed on the server.

*   **Java (JDK)**: Version 21 or higher
*   **Git**: Required to fetch the application from the source code repository.
*   **Apache Maven**: Required to build the application source code.
*   **jsvc (Linux/Unix only)**: Part of Apache Commons Daemon, required to run Java applications as Unix daemon processes. It is usually not installed by default on most Linux distributions.
    *   **Ubuntu/Debian**: `sudo apt install jsvc`
    *   **RHEL/CentOS**: `sudo yum install jsvc`

> **Tip**: If it is difficult to install `jsvc` system-wide, you can directly include the `jsvc` executable binary built for your OS and CPU architecture in the application's `app/bin/` directory. Aspectow prioritizes referencing the `app/bin/jsvc` file over the system path.

## 2. Automated Deployment and Service Management (Using `setup` Scripts)

The scripts in the `setup` directory automate most of the tasks required for operations, such as initial application installation, updates, and service registration.

### 2.1. Initial Installation

#### Linux/Unix Environment

1.  Create a `setup` directory in your desired location on the server and navigate into it.
    ```bash
    mkdir setup && cd setup
    ```
2.  Copy the `app.conf` and `install-app.sh` files from the `setup` directory of the original source repository.
3.  Open the `app.conf` file and modify the variable values such as `APP_NAME`, `DAEMON_USER`, and `BASE_DIR` to match your server environment.
4.  Grant execute permission to `install-app.sh`.
    ```bash
    chmod +x install-app.sh
    ```
5.  Run the installation script. This script will download the entire project from the Git repository and install the application in `BASE_DIR`.
    ```bash
    ./install-app.sh
    ```

#### Windows Environment

1.  Create a `setup` directory in your desired location on the server and navigate into it.
    ```cmd
    mkdir setup && cd /d setup
    ```
2.  Copy the `setenv.bat` and `install-app.bat` files from the `setup` directory of the original source repository.
3.  Open the `setenv.bat` file and modify the variable values such as `APP_NAME` and `BASE_DIR` to match your server environment. (`BASE_DIR` should be in a Windows path format, like `C:\Aspectran\aspectow`).
4.  Run the installation script.
    ```cmd
    install-app.bat
    ```

### 2.2. Initial Build and Deployment

The initial installation using `install-app.sh` or `install-app.bat` is a process that only prepares the directory structure and operational scripts required to run the application. After the installation is complete, a first deployment process to build the source code and deploy libraries, configuration files, etc., is essential to actually run the application.

1.  Once the `install-app` script is complete, navigate to the `BASE_DIR` you set in `app.conf` or `setenv.bat`.
    ```bash
    # Linux/Unix
    cd /path/to/your/BASE_DIR
    ```
    ```cmd
    # Windows
    cd /d D:\path\to\your\BASE_DIR
    ```
2.  Run the full deployment script to proceed with the first build and deployment.
    ```bash
    # Linux/Unix
    ./5-pull_build_deploy.sh
    ```
    ```cmd
    # Windows
    5-pull_build_deploy.bat
    ```

### 2.3. Execution and Status Management by Operational Mode

The methods for managing a deployed application are divided into **System Service Mode** and **Direct Execution Mode**. We provide unified scripts (`service.sh`, `daemon.sh`) optimized for each mode.

| Category | System Service Mode (Recommended) | Direct Execution Mode (Manual/Test) |
| :--- | :--- | :--- |
| **Unified Script** | `./service.sh [command]` | `./daemon.sh [command]` |
| **Manager** | OS (`systemd`) | User (Direct Control) |
| **Principle** | Calls `systemctl` | Calls `jsvc` directly |

#### Method 1: System Service Mode (Recommended)

If you have registered the application as a service via `setup/install-service.sh`, **make sure to use `service.sh`** for management. This script is a wrapper for `systemctl`, ensuring state management at the OS level.

*   **Check Status**: `./service.sh status`
*   **Start Service**: `./service.sh start`
*   **Stop Service**: `./service.sh stop`
*   **Restart Service**: `./service.sh restart`

> **Warning**: Do not run `daemon.sh` directly while managing the application as a service. This could lead to inconsistency between the service state managed by `systemd` and the actual process state, potentially resulting in unintended automatic restarts or duplicate execution issues.

#### Method 2: Direct Execution Mode (Manual Management)

Used when you haven't registered the application as a service or need to control the process directly for development and testing purposes.

*   **Start Background**: `./daemon.sh start`
*   **Stop Process**: `./daemon.sh stop`
*   **Check Status**: `./daemon.sh status`
*   **Version Info**: `./daemon.sh version`

#### Log Monitoring

All logs of the application are stored in the `app/logs` directory.

**In Linux/Unix environments**, you can use the `logtail.sh` script to check the running logs in real-time.

*   **Check Application Logs**: `./logtail.sh app`
    *   Outputs the contents of the `app/logs/app.log` file in real-time. (Most commonly used)
*   **Check Daemon Standard Output**: `./logtail.sh daemon-stdout`
    *   Check JVM output or standard output logs that occur when the application starts.
*   **Check Scheduler Logs**: `./logtail.sh scheduler`
    *   Check the execution records of scheduled jobs.

> **Tip**: Use the format `./logtail.sh [filename]` and omit the `.log` extension.

**In Windows environments**, you can check logs as follows:

*   **Manual Execution (`daemon.bat`)**: Logs are output directly to the console window.
*   **Service Execution**: You can check logs in real-time using PowerShell's `Get-Content` command.
    ```powershell
    Get-Content -Path "app\logs\app.log" -Wait -Tail 100
    ```

### 2.4. Service Installation and Management

Once the initial installation and deployment are complete, you can register and manage the application as a system service.

*   **Linux/Unix**: Register as a `systemd` service
    ```bash
    # [BASE_DIR] is the path set in app.conf.
    cd [BASE_DIR]
    ./setup/install-service.sh
    ```
    *   Start/Stop/Status Check: `sudo systemctl start|stop|status [APP_NAME]`
    *   Remove Service: `./setup/uninstall-service.sh`

*   **Windows**: Register as a Windows Service
    *   As guided at the end of the `install-app.bat` execution, run `install.bat` in the `app\bin\procrun` directory of the new installation path with **Administrator privileges**.
    *   Start/Stop Service: `net start|stop [ServiceName]` or manage from the `Services` app (`services.msc`).
    *   Remove Service: Run `uninstall.bat` in `app\bin\procrun` with Administrator privileges.

#### `procrun.options` File Settings

The `app/bin/procrun/procrun.options` file defines the detailed settings for when the application is registered as a Windows service. You can modify this file to change the service's properties before running `install.bat`.

*   `SERVICE_NAME`: The unique name of the Windows service (e.g., `MyWebApp`).
*   `DISPLAY_NAME`: The name to be displayed in the 'Services' management console (e.g., `My Web Application`).
*   `DESCRIPTION`: A brief description of the service.
*   `JAVA_HOME`, `JVM_MS`, `JVM_MX`, `JVM_SS`: JVM settings that serve the same role as in `run.options`.

### 2.4. Deployment Script Details (`setup/scripts`)

The `setup/scripts` directory is divided by platform (`linux`/`windows`) and contains various scripts for deployment automation. These scripts are copied to `[BASE_DIR]` and are used for the initial deployment and continuous updates of the application.

*   `1-pull.sh|bat`: Pulls the latest source code from the Git repository.
*   `2-build.sh|bat`: Builds the application source code using Maven.
*   `3-deploy_config.sh|bat`: Deploys configuration files in the `app/config` directory.
*   `4-deploy_webapps.sh|bat`: Deploys web application files in the `app/webapps` directory.
*   `5-pull_build_deploy.sh|bat`: Executes the entire deployment process (pull → build → deploy).
*   `6-pull_deploy.sh|bat`: Skips the build process and only executes deployment.
*   `7-pull_deploy_config_only.sh|bat`: After pulling the latest source, deploys only the configuration files.
*   `8-pull_deploy_webapps_only.sh|bat`: After pulling the latest source, deploys only the web application files.
*   `9-pull_deploy_config_webapps_only.sh|bat`: After pulling the latest source, deploys both configuration and web application files.

#### Development Environment Auto-Detection (Development Mode Support)

Deployment scripts automatically detect whether they are running in a source module (development environment) or a production deployment environment via `app.conf` (by checking for the existence of `pom.xml` and a Git working tree).

*   **Behavior in Development Mode (`DEV_MODE=true`)**:
    *   `1-pull.sh`: Skips `git pull` to preserve uncommitted local changes and working tree state.
    *   `2-build.sh`: Runs `mvn clean package` directly in the current module directory without navigating to `.build`, copying libraries into `app/lib`. (Avoids repeated snapshot downloads for fast local builds.)
    *   `3-deploy_config.sh` and `4-deploy_webapps.sh`: Skip directory wiping (`rm -rf`) and overwrite copying to preserve version-controlled local source files (`app/config`, `app/webapps`).
    *   This allows developers to safely test full deployment scripts such as `./5-pull_build_deploy.sh` locally without risking loss of uncommitted work or modifying version-controlled directories.

#### Multi-Node Build Lock & Concurrency Control

In single-machine or shared-directory cluster environments, concurrent full-build commands on all nodes (`All Nodes in Cluster`) could cause file lock and directory cleanup conflicts (such as `Failed to delete target` or `index.lock`).

*   **Atomic Build Lock (`.build.lock`, `.pull.lock`)**:
    *   The first node entering the build step acquires an atomic filesystem lock in the target directory and leads the Maven compile or Git pull operation.
*   **Lock Waiting & Build Reuse (Redundant Compilation Skipping)**:
    *   Other nodes that enter concurrently detect the active build and output `[BUILD LOCK] Another node is currently building... Waiting for completion...`.
    *   Once the lead node finishes with `BUILD SUCCESS`, waiting nodes **skip redundant Maven compilation (`Skipping redundant Maven compilation.`) and immediately complete with success by reusing the fresh build artifacts**.
    *   This completely eliminates race conditions and reduces total cluster build time to 1/N.

#### Git Branch and Tag Targeted Deployment Support (Target Branch / Tag Deployment)

In production operations, you often need to deploy an immutable release version tag (e.g., `v1.2.0`) or quickly roll out a hotfix branch (e.g., `hotfix/xxx`) to address critical defects. Aspectow deployment scripts and Aspectow Console fully support deploying targeted Branches, Tags, or Commit SHAs.

*   **Command-Line Arguments & Environment Variables**:
    *   You can pass the branch or tag name as the first argument when executing `1-pull.sh|bat` or any compound deployment script (`5-pull_build_deploy.sh|bat` through `9-pull_deploy_config_webapps_only.sh|bat`):
        ```bash
        # Deploy a specific release tag (Recommended for immutable releases)
        ./5-pull_build_deploy.sh v1.2.0

        # Deploy an urgent hotfix branch
        ./5-pull_build_deploy.sh hotfix/auth-patch

        # Update only web application files from a specific branch
        ./8-pull_deploy_webapps_only.sh release/v1.1
        ```
    *   If no argument is specified, the script pulls the latest commit from the currently checked out branch or the default branch (`main`), maintaining backward compatibility.
    *   You can also pass the parameter via the `PARAM_BRANCH` environment variable.
*   **Aspectow Console Web UI Integration**:
    *   In the Aspectow Console **Build & Deployment** interface, you can enter the branch or tag name in the `Git Branch / Tag (Optional)` field. The target will be pulled, built, and deployed across single nodes, node groups, or the entire cluster remotely.
*   **Safe Ref Pre-Validation & Working Tree Preservation (Safe Ref Validation)**:
    *   Before switching branches or tags, the script fetches the latest remote metadata (`git fetch --all --tags --prune`) and validates the ref across local tags (`refs/tags/*`), local branches (`refs/heads/*`), remote tracking branches (`origin/*`), and commit SHAs using `git rev-parse --verify`.
    *   If a nonexistent branch or tag name is provided (such as a typo), the script aborts immediately with exit code `1` (`[ERROR] Branch, tag, or commit '...' not found in repository.`) without touching or corrupting the existing working tree.
    *   The failure status and detailed error message are instantly reported to the Aspectow Console web interface, preventing accidental downtime due to invalid deployment requests.

### 2.5. Deployment Directory Structure and Build Workspace

The installed `BASE_DIR` has the following structure. In particular, the `.build` directory plays an important role when troubleshooting build problems or manually checking source code during operations.

```text
BASE_DIR
├── .build/             # Build workspace (created during initial deployment)
│   └── [APP_NAME]/     # Where the source code cloned from Git and Maven builds are performed
├── app/                # Executable files, libraries, configuration, and logs used for the actual service
├── app-restore/        # Workspace for restoring server-specific configurations (requires manual creation)
├── setup/              # Scripts for initial installation and service registration
├── app.conf            # Environment configuration file for deployment and operations
└── *-sh|bat            # Deployment automation and operation scripts numbered 1 to 9
```

*   **Role of the `.build/` Directory**:
    *   **Source Code Repository**: Contains the original source code fetched from Git. If a build fails, you can run `mvn` commands directly in this directory to check detailed error logs.
    *   **Build Isolation**: Acts as a sandbox to safely build a new version without affecting the `app/` directory currently in operation.

*   **Role of the `app-restore/` Directory (Important)**:
    *   **Maintaining Server-Specific Settings**: Securely stores environment-specific configuration files (e.g., `.properties` files containing DB passwords) that are not included in the Git repository.
    *   **Automatic Restore After Deployment**: When deployment scripts (e.g., #3, #4) run, they overwrite the files in the newly deployed `app/` directory with the contents of this directory. This eliminates the need to manually re-configure settings after every deployment.
    *   **Structure**: Place files in `app-restore/config/` or `app-restore/webapps/` using the same directory structure as the `app/` directory.

*   **Automatic Runtime Directory Creation (Zero Dummy Files)**:
    *   Runtime directories such as `app/lib`, `app/logs`, `app/temp`, `app/work`, and `app/cmd/*` are kept in Git without `.gitignore` or dummy placeholder files.
    *   Build tools (`mvn package`) and the Aspectran framework/scripts create missing directories on-demand (`mkdirs`) during build and startup, keeping production runtime directories 100% clean and free of unnecessary auxiliary files.

### 2.6. Running Multiple Instances

In some environments, you may need to run multiple independent application instances (e.g., `node1`, `node2`) on a single server or from a single deployment directory (`BASE_DIR`). For example, configuring a multi-node cluster where instances share the same binary and libraries but run on different HTTP ports, log directories, and active profiles.

#### Principles of Multi-Instance Execution
Aspectow uses a single-instance `.lock` file and PID file within the same `basePath` to prevent duplicate execution when `context.singleton` is set to `true` (default). To run multiple instances in isolation within the same `BASE_DIR`, each instance must have an independent **Process Name (PROC_NAME)**, **PID File**, and **isolated runtime directory settings**.

1. **Automatic PID File Mapping**: If `--proc-name` (`PROC_NAME`) is set to a value other than the default (`jsvc-daemon`), `jsvc-daemon.sh` automatically determines and manages the PID file path as `$BASE_DIR/.$PROC_NAME.pid` without needing an explicit `--pid-file` argument.
2. **Stop Isolation**: When executing `jsvc-daemon.sh stop`, the script precisely matches and terminates only the process matching the `-pidfile` argument in the process command line, avoiding any impact on other instances running under the same `BASE_DIR`.
3. **Required Isolated System Properties and Shell Options**:
   - `aspectran.basePath`: Common root path (`BASE_DIR`). Can be shared across all instances.
   - `aspectran.logsDir` and `--logs-dir`: Log file output path (`logs` vs `logs2`) and daemon stdout/stderr log paths (`daemon-stdout.log`, `daemon-stderr.log`). **Must be separated per instance** to prevent interleaved logs and file lock conflicts.
   - `aspectran.workPath`: Runtime class compilation cache and workspace (`work` vs `work2`). **Must be separated per instance**.
   - `aspectran.tempPath` / `java.io.tmpdir` and `--temp-dir`: Temporary file storage (`temp` vs `temp2`). **Must be separated per instance**.
   - `aspectran.commandsPath`: Shell/Daemon IPC command pipe socket path (`cmd` vs `cmd2`). **Must be separated per instance**.
   - `tow.server.listener.http.port`: HTTP listening port (`8082` vs `8092`, etc.). **Must be separated per instance**.
   - `aspectow.node.id`: Node identifier within a cluster (`node1` vs `node2`). **Must be separated per instance**.

#### Step-by-Step Configuration Guide (Multi-Node Cluster Example)

##### Step 1: Maintain Common `app.conf`
Keep the default `setup/app.conf` file as the shared configuration containing application name, deployment directory (`DEPLOY_DIR`), and common JVM options used across all instances on the server.

##### Step 2: Create Instance-Specific Execution Scripts (`daemon-node1.sh`, `daemon-node2.sh`)
Copy the shared `setup/scripts/linux/daemon.sh` script to create dedicated scripts for each instance. Declare `NODE_ID`, `PORT`, and directory variables at the top of each script, and pass them via `ASPECTRAN_OPTS` and shell options (`--logs-dir`, `--temp-dir`).

```bash
#!/bin/sh
# setup/scripts/linux/daemon-node2.sh
set -e

SCRIPT_DIR=$(dirname "$(readlink -f "$0")")
. "$SCRIPT_DIR/app.conf"

NODE_ID="node2"
PORT="8092"

[ -d "$DEPLOY_DIR" ] && DEPLOY_DIR="$(cd "$DEPLOY_DIR" && pwd)"

PROC_NAME="${APP_NAME}-${NODE_ID}"
WORK_DIR="$DEPLOY_DIR/work2"
TEMP_DIR="$DEPLOY_DIR/temp2"
COMMANDS_DIR="$DEPLOY_DIR/cmd2"
LOGS_DIR="$DEPLOY_DIR/logs2"

ASPECTRAN_OPTS="
-Duser.timezone=UTC
-Daspectran.profiles.active=dev,gateway
-Daspectran.profiles.base.console=dev,h2
-Daspectran.workPath=$WORK_DIR
-Daspectran.tempPath=$TEMP_DIR
-Daspectran.commandsPath=$COMMANDS_DIR
-Daspectran.logsDir=$LOGS_DIR
-Daspectow.node.id=$NODE_ID
-Djava.io.tmpdir=$TEMP_DIR
-Dtow.server.listener.http.port=$PORT
-Dtow.context.root.session.cookieName=JSESSIONID-$PORT
-Dtow.context.console.session.cookieName=JSESSIONID-$PORT
-Daspectow.console.config.db.h2.path_explicit=~/aspectow-console-demo-${NODE_ID}
"

"$DEPLOY_DIR/bin/jsvc-daemon.sh" \
  --proc-name "$PROC_NAME" \
  --logs-dir "$LOGS_DIR" \
  --temp-dir "$TEMP_DIR" \
  --user "$DAEMON_USER" \
  "$@"
```

##### Step 3: Run and Control Instances Independently
Control each instance independently using its dedicated script.

```bash
# Start and check status of node1 (port 8082 / node1)
./daemon-node1.sh start
./daemon-node1.sh status

# Start and check status of node2 (port 8092 / node2)
./daemon-node2.sh start
./daemon-node2.sh status

# Stop only a specific instance
./daemon-node2.sh stop
```

## 3. Manual Execution and Management (Using `app/bin` Scripts)

Used when running the application directly without registering it as a service, for purposes such as development and debugging. All related scripts are located in the `[BASE_DIR]/app/bin` directory.

### `run.options` File Settings

The `app/bin/run.options` file defines common settings for all manually executed scripts, such as `shell.sh` and `daemon.sh`. You can uncomment and modify the values to use them.

*   `JAVA_HOME`: Directly specifies the path of the JDK to use. If not set, it follows the system's default `JAVA_HOME`.
*   `JVM_MS`: JVM initial heap size (in MB). E.g., `JVM_MS=256`
*   `JVM_MX`: JVM maximum heap size (in MB). E.g., `JVM_MX=1024`
*   `JVM_SS`: Thread stack size (in KB). E.g., `JVM_SS=1024`
*   `SERVICE_START_WAIT_TIME`: The maximum time (in seconds) to wait to determine success when starting the daemon. If the process does not start normally within this time, it is considered a failure. E.g., `SERVICE_START_WAIT_TIME=90`
*   `SERVICE_STOP_WAIT_TIME`: The maximum time (in seconds) to wait for the process to fully terminate when stopping the daemon. If this time is exceeded, the fallback kill procedure may be initiated. E.g., `SERVICE_STOP_WAIT_TIME=60`

### Linux/Unix Environment

*   `daemon.sh`: Runs as a simple background daemon. Automatically cleans up lock files left behind on abnormal termination.
*   `jsvc-daemon.sh`: Runs as a daemon using Apache Commons `jsvc` (more stable). It features **automatic detection and cleanup of stale locks (.lock) or PID files** upon restart, making it even more reliable.
*   `shell.sh`: Runs in interactive shell mode.

#### Why use jsvc?

`jsvc` is a tool used internally by Apache Tomcat and other services, offering several powerful benefits:

1.  **Drop Privileges**: It can start with `root` privileges to bind to privileged ports (like 80 or 443) and then immediately switch to a non-privileged user (`DAEMON_USER`) for security.
2.  **Unix Signal Handling**: It handles process termination signals like `TERM` and `INT` and passes them to the Java application to ensure a Graceful Shutdown.
3.  **Reliable Process Management**: It includes sophisticated daemonization logic to prevent the process from terminating unexpectedly or becoming a zombie.

#### How to Obtain the jsvc Binary

`jsvc` is a native program written in C, so you need a binary that matches your execution environment's CPU architecture (x86_64, ARM, etc.) and OS. Choose one of the following methods:

1.  **Use Package Manager (Highly Recommended)**: Install via `sudo apt install jsvc` or `sudo yum install jsvc`. The installed binary is usually located at `/usr/bin/jsvc`.
2.  **Build from Source**: If a package manager is not available, you can download the 'Native Source Code' from the [Apache Commons Daemon](https://commons.apache.org/proper/commons-daemon/download_daemon.cgi) site and compile it yourself.
    ```bash
    # Build Example (requires gcc and make)
    tar xvfz commons-daemon-x.x.x-native-src.tar.gz
    cd unix
    ./configure --with-java=$JAVA_HOME
    make
    ```
    After compilation, copy the generated `jsvc` file to the `app/bin/` directory.

### Windows Environment

*   `daemon.bat`: Runs as a daemon, displaying the execution process in a console window.
*   `shell.bat`: Runs in interactive shell mode with JLine applied **(Recommended)**.
*   `legacy-shell.bat`: A basic shell for older console environments where compatibility is important.
*   `procrun\` directory: Scripts related to `prunsrv.exe` for Windows service installation/uninstallation/management.

## 4. Recovery and Process Management

### 4.1. Automatic Stale Lock Cleanup
If the application terminates abnormally (e.g., forced kill) and leaves a `.lock` file, Aspectow's `jsvc-daemon.sh` script automatically detects that the lock file is stale upon restart and removes it. Users can safely use the `restart` command without manually deleting the `.lock` file.

### 4.2. Handling jsvc Stop Failures (Fallback Kill)
Even if the `jsvc` stop command fails, the script ensures that the process is terminated using the `kill` command and cleans up the associated files (`.pid`, `.lock`). This prevents situations where a daemon is considered 'stopped' but cannot be restarted due to file locks.

### Related Guides

After deploying the application, it is recommended to configure a reverse proxy like Nginx in a production environment. Learn more in the guide below.

- [Nginx Reverse Proxy and Clustering Guide](/en/docs/aspectow/nginx-reverse-proxy-guide/)
