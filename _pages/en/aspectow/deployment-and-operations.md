---
format: plate solid article
title: Aspectow Deployment and Operations Guide
teaser: This guide provides detailed instructions on how to deploy and manage Aspectow applications as services in Linux/Unix and Windows environments.
sidebar: toc
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

### 2.6. Running Multiple Instances

Sometimes, you need to run multiple independent application instances on a single server or from a single deployment directory. For example, running two servers that use the same code but different ports or profiles.

#### Principles of Multi-Instance Execution
When `context.singleton` is set to `true` (the default) in Aspectran, it uses a `.lock` file to prevent multiple instances from running in the same `basePath`. To run multiple instances, each must have a unique **Process Name (PROC_NAME)** and **PID file**.

#### Step-by-Step Configuration (Example: adding a second instance 'inst2')
1.  **Create Instance-Specific Configuration**: Copy `setup/app.conf` to `setup/app-inst2.conf`. Modify the `PROC_NAME` inside to be unique and specify the port number in `ASPECTRAN_OPTS` to avoid conflicts.
    ```bash
    # setup/app-inst2.conf
    APP_NAME="aspectow-demo"
    PROC_NAME="aspectow-demo-inst2" # Specify a unique name
    export ASPECTRAN_OPTS="-Dtow.server.listener.http.port=8081 ..."
    ```
2.  **Create Execution Script**: Copy `setup/scripts/linux/daemon.sh` to `setup/scripts/linux/daemon-inst2.sh`. Modify it to reference the new configuration file.
    ```bash
    # setup/scripts/linux/daemon-inst2.sh
    . "$SCRIPT_DIR/app-inst2.conf" # Load the new configuration file
    "$DEPLOY_DIR/bin/jsvc-daemon.sh" --proc-name "$PROC_NAME" --pid-file "$DEPLOY_DIR/.$PROC_NAME.pid" --user "$DAEMON_USER" "$@"
    ```
3.  **Run Instances**: You can now control each instance independently using its respective script.
    ```bash
    ./daemon.sh start        # Primary instance (e.g., port 8080)
    ./daemon-inst2.sh start  # Second instance (e.g., port 8081)
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

- [Nginx Reverse Proxy and Clustering Guide](/en/aspectow/nginx-reverse-proxy-guide/)
