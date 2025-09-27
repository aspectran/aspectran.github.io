---
format: plate solid article
title: Aspectow Deployment and Operations Guide
teaser: This guide provides instructions for deploying Aspectow applications and managing them as services on various operating systems.
sidebar: toc
---

This guide provides detailed instructions on how to deploy and manage Aspectow applications as services in Linux/Unix and Windows environments. You can build an efficient operational environment by utilizing the provided scripts.

There are two main execution methods described in this guide:
1.  **Automated Deployment and Service Management**: The standard operational method using scripts in the `setup` directory to install the application on a server, build/deploy it, and manage it as a system service. **(Recommended)**
2.  **Manual Execution and Management**: A method for running the application directly for development or testing purposes using scripts in the `app/bin` directory.

---

## 1. Prerequisites

Before proceeding with the deployment, the following software must be installed on the server.

*   **Java (JDK)**: Version 21 or higher
*   **Git**: Required to fetch the application from the source code repository.
*   **Apache Maven**: Required to build the application source code.

---

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
Now the application is fully ready to be executed.

### 2.3. Service Installation and Management

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

---

## 3. Manual Execution and Management (Using `app/bin` Scripts)

Used when running the application directly without registering it as a service, for purposes such as development and debugging. All related scripts are located in the `[BASE_DIR]/app/bin` directory.

### `run.options` File Settings

The `app/bin/run.options` file defines common settings for all manually executed scripts, such as `shell.sh` and `daemon.sh`. You can uncomment and modify the values to use them.

*   `JAVA_HOME`: Directly specifies the path of the JDK to use. If not set, it follows the system's default `JAVA_HOME`.
*   `JVM_MS`: JVM initial heap size (in MB). E.g., `JVM_MS=256`
*   `JVM_MX`: JVM maximum heap size (in MB). E.g., `JVM_MX=1024`
*   `JVM_SS`: Thread stack size (in KB). E.g., `JVM_SS=1024`
*   `WAIT_TIMEOUT`: The maximum time (in seconds) that the `daemon.sh` script waits for the daemon to start or stop. If this time is exceeded, it is considered a failure. E.g., `WAIT_TIMEOUT=60`

### Linux/Unix Environment

*   `daemon.sh`: Runs as a simple background daemon. Automatically cleans up lock files left behind on abnormal termination.
*   `jsvc-daemon.sh`: Runs as a daemon using Apache Commons `jsvc` (more stable). Automatically cleans up PID files left behind on abnormal termination.
*   `shell.sh`: Runs in interactive shell mode.

### Windows Environment

*   `daemon.bat`: Runs as a daemon, displaying the execution process in a console window.
*   `shell.bat`: Runs in interactive shell mode with JLine applied **(Recommended)**.
*   `legacy-shell.bat`: A basic shell for older console environments where compatibility is important.
*   `procrun\` directory: Scripts related to `prunsrv.exe` for Windows service installation/uninstallation/management.
