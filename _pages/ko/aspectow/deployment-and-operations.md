---
format: plate solid article
title: Aspectow 배포 및 운영 가이드
teaser: 이 가이드는 Linux/Unix 및 Windows 환경에서 Aspectow 애플리케이션을 배포하고 서비스로 관리하는 방법을 상세히 설명합니다.
sidebar: toc
---

이 가이드에서 설명하는 실행 방식은 크게 두 가지입니다.
1.  **자동화된 배포 및 서비스 관리**: `setup` 디렉터리의 스크립트를 사용하여 서버에 애플리케이션을 설치하고, 빌드/배포하며, 시스템 서비스로 관리하는 표준적인 운영 방식입니다. **(권장)**
2.  **수동 실행 및 관리**: `app/bin` 디렉터리의 스크립트를 사용하여 개발 또는 테스트 목적으로 애플리케이션을 직접 실행하는 방식입니다.

## 1. 사전 준비

배포를 진행하기 전에, 서버에 다음 소프트웨어가 설치되어 있어야 합니다.

*   **Java (JDK)**: 버전 21 이상
*   **Git**: 소스 코드 저장소로부터 애플리케이션을 가져오기 위해 필요합니다.
*   **Apache Maven**: 애플리케이션 소스 코드를 빌드하기 위해 필요합니다.
*   **jsvc (Linux/Unix 전용)**: Apache Commons Daemon의 일부로, Java 애플리케이션을 유닉스 데몬 프로세스로 실행하기 위해 필요합니다. 대부분의 리눅스 배포판에서 기본적으로 제공되지 않으므로 별도로 설치해야 합니다.
    *   **Ubuntu/Debian**: `sudo apt install jsvc`
    *   **RHEL/CentOS**: `sudo yum install jsvc`

> **Tip**: 시스템 전체에 `jsvc`를 설치하기 어려운 환경이라면, 해당 OS와 CPU 아키텍처에 맞게 빌드된 `jsvc` 실행 파일을 애플리케이션의 `app/bin/` 디렉터리에 직접 포함할 수도 있습니다. Aspectow는 시스템 경로보다 `app/bin/jsvc` 파일을 우선적으로 참조합니다.

## 2. 자동화된 배포 및 서비스 관리 (`setup` 스크립트 활용)

`setup` 디렉터리의 스크립트들은 애플리케이션의 최초 설치, 업데이트, 서비스 등록 등 운영에 필요한 대부분의 작업을 자동화합니다.

### 2.1. 최초 설치

#### Linux/Unix 환경

1.  서버의 원하는 위치에 `setup` 디렉터리를 만들고, 그 안으로 이동합니다.
    ```bash
    mkdir setup && cd setup
    ```
2.  원본 소스 저장소의 `setup` 디렉터리에서 `app.conf`와 `install-app.sh` 파일을 복사해옵니다.
3.  `app.conf` 파일을 열어 `APP_NAME`, `DAEMON_USER`, `BASE_DIR` 등 자신의 서버 환경에 맞게 변수 값을 수정합니다.
4.  `install-app.sh`에 실행 권한을 부여합니다.
    ```bash
    chmod +x install-app.sh
    ```
5.  설치 스크립트를 실행합니다. 이 스크립트는 Git 저장소에서 전체 프로젝트를 내려받아 `BASE_DIR`에 애플리케이션을 설치합니다.
    ```bash
    ./install-app.sh
    ```

#### Windows 환경

1.  서버의 원하는 위치에 `setup` 디렉터리를 만들고, 그 안으로 이동합니다.
    ```cmd
    mkdir setup && cd /d setup
    ```
2.  원본 소스 저장소의 `setup` 디렉터리에서 `setenv.bat`와 `install-app.bat` 파일을 복사해옵니다.
3.  `setenv.bat` 파일을 열어 `APP_NAME`, `BASE_DIR` 등 자신의 서버 환경에 맞게 변수 값을 수정합니다. (`BASE_DIR`은 `C:\Aspectran\aspectow`와 같은 윈도우 경로 형식이어야 합니다.)
4.  설치 스크립트를 실행합니다.
    ```cmd
    install-app.bat
    ```

### 2.2. 최초 빌드 및 배포

`install-app.sh` 또는 `install-app.bat`를 이용한 최초 설치는 애플리케이션 실행에 필요한 디렉터리 구조와 운영 스크립트만 준비하는 과정입니다. 설치가 완료된 후, 실제 애플리케이션을 구동하기 위해서는 소스 코드를 빌드하고 라이브러리, 설정 파일 등을 배포하는 첫 배포 과정이 반드시 필요합니다.

1.  `install-app` 스크립트가 완료되면, `app.conf` 또는 `setenv.bat`에 설정했던 `BASE_DIR`로 이동합니다.
    ```bash
    # Linux/Unix
    cd /path/to/your/BASE_DIR
    ```
    ```cmd
    # Windows
    cd /d D:\path\to\your\BASE_DIR
    ```
2.  전체 배포 스크립트를 실행하여 첫 빌드 및 배포를 진행합니다.
    ```bash
    # Linux/Unix
    ./5-pull_build_deploy.sh
    ```
    ```cmd
    # Windows
    5-pull_build_deploy.bat
    ```

### 2.3. 운영 모드별 실행 및 상태 관리

배포된 애플리케이션을 관리하는 방식은 크게 **시스템 서비스 방식**과 **직접 실행 방식**으로 나뉩니다. 각 방식에 최적화된 통합 스크립트(`service.sh`, `daemon.sh`)를 제공합니다.

| 구분 | 시스템 서비스 방식 (권장) | 직접 실행 방식 (수동/테스트) |
| :--- | :--- | :--- |
| **통합 스크립트** | `./service.sh [명령어]` | `./daemon.sh [명령어]` |
| **관리 주체** | OS (`systemd`) | 사용자 (직접 제어) |
| **동작 원리** | `systemctl` 호출 | `jsvc` 직접 호출 |

#### 방법 1: 시스템 서비스 방식 (권장)

`setup/install-service.sh`를 통해 서비스를 등록했다면, **반드시 `service.sh`를 사용**하여 관리하십시오. 이 스크립트는 `systemctl`의 래퍼(wrapper)로, OS 수준에서 안전하게 상태가 관리됩니다.

*   **실행 확인**: `./service.sh status`
*   **서비스 시작**: `./service.sh start`
*   **서비스 중지**: `./service.sh stop`
*   **서비스 재시작**: `./service.sh restart`

> **주의**: 서비스로 관리 중일 때는 `daemon.sh`를 직접 실행하지 마십시오. `systemd`가 관리하는 서비스 상태와 실제 프로세스 상태가 불일치하게 되어, 원치 않는 자동 재시작이 발생하거나 중복 실행 문제가 생길 수 있습니다.

#### 방법 2: 직접 실행 방식 (수동 관리)

서비스를 등록하지 않았거나, 개발 및 테스트 목적으로 프로세스를 직접 제어해야 할 때 사용합니다.

*   **백그라운드 시작**: `./daemon.sh start`
*   **프로세스 중지**: `./daemon.sh stop`
*   **상태 확인**: `./daemon.sh status`
*   **버전 정보**: `./daemon.sh version`

#### 로그 모니터링

애플리케이션의 모든 로그는 `app/logs` 디렉터리에 저장됩니다.

**Linux/Unix 환경**에서는 `logtail.sh` 스크립트를 사용하면 실행 중인 로그를 실시간으로 확인할 수 있습니다.

*   **애플리케이션 로그 확인**: `./logtail.sh app`
    *   `app/logs/app.log` 파일의 내용을 실시간으로 출력합니다. (가장 많이 사용됨)
*   **데몬 표준 출력 확인**: `./logtail.sh daemon-stdout`
    *   애플리케이션 시작 시 발생하는 JVM 출력이나 표준 출력 로그를 확인합니다.
*   **스케줄러 로그 확인**: `./logtail.sh scheduler`
    *   예약된 작업(Job)들의 실행 기록을 확인합니다.

> **Tip**: `logtail.sh [파일명]` 형식으로 사용하며, 확장자 `.log`는 생략합니다.

**Windows 환경**에서는 다음과 같이 로그를 확인할 수 있습니다.

*   **수동 실행 (`daemon.bat`)**: 콘솔 창에 로그가 직접 출력됩니다.
*   **서비스 실행**: PowerShell의 `Get-Content` 명령어를 사용하여 실시간 로그를 확인할 수 있습니다.
    ```powershell
    Get-Content -Path "app\logs\app.log" -Wait -Tail 100
    ```

### 2.4. 서비스 설치 및 관리

최초 설치 및 배포가 완료되면, 애플리케이션을 시스템 서비스로 등록하여 관리할 수 있습니다.

*   **Linux/Unix**: `systemd` 서비스로 등록
    ```bash
    # [BASE_DIR]은 app.conf에 설정한 경로입니다.
    cd [BASE_DIR]
    ./setup/install-service.sh
    ```
    *   서비스 시작/중지/상태확인: `sudo systemctl start|stop|status [APP_NAME]`
    *   서비스 제거: `./setup/uninstall-service.sh`

*   **Windows**: Windows 서비스로 등록
    *   `install-app.bat` 실행 마지막에 안내되는 대로, 새로 설치된 경로의 `app\bin\procrun\install.bat`를 **관리자 권한**으로 실행합니다.
    *   서비스 시작/중지: `net start|stop [서비스이름]` 또는 `서비스` 앱(`services.msc`)에서 관리
    *   서비스 제거: `app\bin\procrun\uninstall.bat`를 관리자 권한으로 실행

#### `procrun.options` 파일 설정

`app/bin/procrun/procrun.options` 파일은 윈도우 서비스로 등록될 때의 상세 설정을 정의합니다. `install.bat`를 실행하기 전에 이 파일을 수정하여 서비스의 속성을 변경할 수 있습니다.

*   `SERVICE_NAME`: 윈도우 서비스의 고유 이름 (예: `MyWebApp`).
*   `DISPLAY_NAME`: '서비스' 관리 콘솔에 표시될 이름 (예: `My Web Application`).
*   `DESCRIPTION`: 서비스에 대한 간략한 설명.
*   `JAVA_HOME`, `JVM_MS`, `JVM_MX`, `JVM_SS`: `run.options`와 동일한 역할을 하는 JVM 설정.

### 2.4. 배포 스크립트 상세 (`setup/scripts`)

`setup/scripts` 디렉터리는 플랫폼별(`linux`/`windows`)로 나뉘어 있으며, 배포 자동화를 위한 다양한 스크립트를 포함합니다. 이 스크립트들은 `[BASE_DIR]`에 복사되어 애플리케이션의 최초 배포 및 지속적인 업데이트에 사용됩니다.

*   `1-pull.sh|bat`: Git 저장소에서 최신 소스 코드를 가져옵니다.
*   `2-build.sh|bat`: Maven을 사용하여 애플리케이션 소스 코드를 빌드합니다.
*   `3-deploy_config.sh|bat`: `app/config` 디렉터리의 설정 파일들을 배포합니다.
*   `4-deploy_webapps.sh|bat`: `app/webapps` 디렉터리의 웹 애플리케이션 파일들을 배포합니다.
*   `5-pull_build_deploy.sh|bat`: 전체 배포 프로세스(pull → build → deploy)를 실행합니다.
*   `6-pull_deploy.sh|bat`: 빌드 과정을 생략하고 배포만 실행합니다.
*   `7-pull_deploy_config_only.sh|bat`: 최신 소스를 받은 후, 설정 파일만 배포합니다.
*   `8-pull_deploy_webapps_only.sh|bat`: 최신 소스를 받은 후, 웹 애플리케이션 파일만 배포합니다.
*   `9-pull_deploy_config_webapps_only.sh|bat`: 최신 소스를 받은 후, 설정 파일과 웹 애플리케이션 파일을 함께 배포합니다.

### 2.5. 배포 디렉터리 구조 및 빌드 공간

설치가 완료된 `BASE_DIR`는 다음과 같은 구조를 가집니다. 특히 `.build` 디렉터리는 운영 중 빌드 문제를 해결하거나 소스 코드를 직접 확인해야 할 때 중요한 역할을 합니다.

```text
BASE_DIR
├── .build/             # 빌드 작업 공간 (최초 배포 시 생성됨)
│   └── [APP_NAME]/     # Git에서 클론된 원본 소스 코드 및 Maven 빌드 수행 장소
├── app/                # 실제 서비스에 사용되는 실행 파일, 라이브러리, 설정, 로그 등
├── app-restore/        # 운영 서버 전용 설정 파일 복구 공간 (수동 생성 필요)
├── setup/              # 최초 설치 및 서비스 등록 스크립트
├── app.conf            # 배포 및 운영을 위한 환경 설정 파일
└── *-sh|bat            # 1~9번까지의 배포 자동화 및 운영 통합 스크립트
```

*   **`.build/` 디렉터리의 역할**:
    *   **소스 코드 저장소**: Git에서 내려받은 원본 소스 코드가 위치합니다. 빌드가 실패할 경우 이 디렉터리에서 `mvn` 명령을 직접 실행하여 상세한 오류 로그를 확인할 수 있습니다.
    *   **빌드 격리**: 실제 운영 중인 `app/` 디렉터리에 영향을 주지 않고 안전하게 새로운 버전을 빌드하는 샌드박스 역할을 합니다.

*   **`app-restore/` 디렉터리의 역할 (중요)**:
    *   **서버 전용 설정 유지**: Git 저장소에 포함되지 않는 운영 서버 전용 설정 파일(예: DB 접속 암호가 담긴 `.properties` 파일 등)을 안전하게 보관합니다.
    *   **배포 후 자동 복구**: 배포 스크립트(3번, 4번 등)가 실행될 때, Git 소스 기반으로 새롭게 구성된 `app/` 디렉터리 위에 이 디렉터리의 내용을 덮어씁니다. 이를 통해 매번 배포할 때마다 설정을 수동으로 수정할 필요가 없습니다.
    *   **구조**: `app-restore/config/` 또는 `app-restore/webapps/` 하위에 `app/` 디렉터리와 동일한 경로로 파일을 배치하면 됩니다.

### 2.6. 다중 인스턴스 실행 (Running Multiple Instances)

하나의 서버 또는 하나의 배포 디렉토리에서 여러 개의 독립적인 애플리케이션 인스턴스를 실행해야 할 때가 있습니다. 예를 들어, 동일한 코드를 사용하지만 다른 포트나 프로파일을 사용하는 두 개의 서버를 띄우는 경우입니다.

#### 다중 실행의 원리
Aspectow는 `context.singleton` 설정이 `true`(기본값)일 경우, 같은 `basePath`에서 중복 실행되는 것을 방지하기 위해 `.lock` 파일을 사용합니다. 여러 인스턴스를 띄우려면 각 인스턴스가 서로 다른 **프로세스 이름(PROC_NAME)**과 **PID 파일**을 가져야 합니다.

#### 단계별 설정 방법 (두 번째 인스턴스 추가 예시)
1.  **인스턴스별 설정 파일 생성**: `setup/app.conf`를 복사하여 `setup/app-inst2.conf`를 만듭니다. 내부에서 `PROC_NAME`을 고유하게 수정하고, 포트 충돌을 피하기 위해 `ASPECTRAN_OPTS`에서 포트 번호를 지정합니다.
    ```bash
    # setup/app-inst2.conf
    APP_NAME="aspectow-demo"
    PROC_NAME="aspectow-demo-inst2" # 고유한 이름 지정
    export ASPECTRAN_OPTS="-Dtow.server.listener.http.port=8081 ..."
    ```
2.  **실행 스크립트 생성**: `setup/scripts/linux/daemon.sh`를 복사하여 `setup/scripts/linux/daemon-inst2.sh`를 만듭니다. 새로 만든 설정 파일을 참조하도록 수정합니다.
    ```bash
    # setup/scripts/linux/daemon-inst2.sh
    . "$SCRIPT_DIR/app-inst2.conf" # 새 설정 파일 로드
    "$DEPLOY_DIR/bin/jsvc-daemon.sh" --proc-name "$PROC_NAME" --pid-file "$DEPLOY_DIR/.$PROC_NAME.pid" --user "$DAEMON_USER" "$@"
    ```
3.  **인스턴스 실행**: 이제 각각의 스크립트를 통해 독립적으로 제어할 수 있습니다.
    ```bash
    ./daemon.sh start        # 기본 인스턴스 (8080 포트)
    ./daemon-inst2.sh start  # 두 번째 인스턴스 (8081 포트)
    ```

## 3. 수동 실행 및 관리 (`app/bin` 스크립트 활용)

개발, 디버깅 등의 목적으로 서비스로 등록하지 않고 애플리케이션을 직접 실행할 때 사용합니다. 모든 관련 스크립트는 `[BASE_DIR]/app/bin` 디렉터리에 있습니다.

### `run.options` 파일 설정

`app/bin/run.options` 파일은 `shell.sh`, `daemon.sh` 등 수동으로 실행하는 모든 스크립트에 대한 공통 설정을 정의합니다. 주석 처리된 값을 해제하고 수정하여 사용할 수 있습니다.

*   `JAVA_HOME`: 사용할 JDK의 경로를 직접 지정합니다. 설정하지 않으면 시스템의 기본 `JAVA_HOME`을 따릅니다.
*   `JVM_MS`: JVM 초기 힙 크기 (MB 단위). 예: `JVM_MS=256`
*   `JVM_MX`: JVM 최대 힙 크기 (MB 단위). 예: `JVM_MX=1024`
*   `JVM_SS`: 스레드 스택 크기 (KB 단위). 예: `JVM_SS=1024`
*   `SERVICE_START_WAIT_TIME`: 데몬 시작 시 성공 여부를 판단하기 위해 대기하는 최대 시간 (초 단위). 이 시간 내에 프로세스가 정상적으로 구동되지 않으면 실패로 간주합니다. 예: `SERVICE_START_WAIT_TIME=90`
*   `SERVICE_STOP_WAIT_TIME`: 데몬 중지 시 프로세스가 완전히 종료될 때까지 기다리는 최대 시간 (초 단위). 이 시간을 초과하면 강제 종료(Fallback Kill) 절차가 진행될 수 있습니다. 예: `SERVICE_STOP_WAIT_TIME=60`

### Linux/Unix 환경

*   `daemon.sh`: 간단한 백그라운드 데몬으로 실행. 비정상 종료 시 남겨진 잠금 파일을 자동으로 정리합니다.
*   `jsvc-daemon.sh`: Apache Commons `jsvc`를 이용한 데몬으로 실행 (더 안정적). **재시작 시 남겨진 좀비 락(.lock)이나 PID 파일을 자동으로 감지하여 정리**하는 로직이 내장되어 있어 더욱 안전합니다.
*   `shell.sh`: 대화형 셸 모드로 실행

#### 왜 jsvc를 사용하는가?

`jsvc`는 Apache Tomcat 등에서 내부적으로 사용되는 도구로, 다음과 같은 강력한 이점을 제공합니다.

1.  **권한 하향(Drop Privileges)**: `root` 권한으로 프로세스를 시작하여 80 또는 443 포트와 같은 특권 포트를 점유한 뒤, 즉시 일반 사용자(`DAEMON_USER`)로 실행 권한을 변경하여 보안성을 높일 수 있습니다.
2.  **유닉스 시그널 처리**: `TERM`이나 `INT`와 같은 프로세스 종료 신호를 Java 애플리케이션에 전달하여 안전한 종료(Graceful Shutdown)를 유도합니다.
3.  **안정적인 프로세스 관리**: 프로세스가 비정상 종료되거나 좀비 프로세스가 되는 것을 방지하는 정교한 데몬화 로직이 포함되어 있습니다.

#### jsvc 바이너리 구하는 방법

`jsvc`는 C로 작성된 네이티브 프로그램이므로 실행 환경의 CPU 아키텍처(x86_64, ARM 등)와 OS에 맞는 바이너리가 필요합니다. 다음 방법 중 하나를 선택하여 준비하십시오.

1.  **패키지 매니저 이용 (가장 권장)**: 터미널에서 `sudo apt install jsvc` 또는 `sudo yum install jsvc` 명령으로 설치합니다. 설치된 바이너리는 보통 `/usr/bin/jsvc`에 위치합니다.
2.  **소스 코드 직접 빌드**: 패키지 매니저를 사용할 수 없다면, [Apache Commons Daemon](https://commons.apache.org/proper/commons-daemon/download_daemon.cgi) 사이트에서 'Native Source Code'를 다운로드하여 직접 컴파일할 수 있습니다.
    ```bash
    # 빌드 예시 (컴파일러 gcc와 make가 필요함)
    tar xvfz commons-daemon-x.x.x-native-src.tar.gz
    cd unix
    ./configure --with-java=$JAVA_HOME
    make
    ```
    빌드 완료 후 생성된 `jsvc` 파일을 `app/bin/` 디렉터리에 복사하여 사용하면 됩니다.

### Windows 환경

*   `daemon.bat`: 콘솔 창에 실행 과정을 표시하며 데몬으로 실행
*   `shell.bat`: JLine이 적용된 대화형 셸 모드로 실행 **(권장)**
*   `legacy-shell.bat`: 호환성이 중요한 구형 콘솔 환경을 위한 기본 셸
*   `procrun\` 디렉터리: Windows 서비스 설치/제거/관리를 위한 `prunsrv.exe` 관련 스크립트

## 4. 장애 복구 및 프로세스 관리

### 4.1. 좀비 락(Stale Lock) 자동 정리
애플리케이션이 비정상적으로 종료(예: 강제 종료)되어 `.lock` 파일이 남은 경우, Aspectow의 `jsvc-daemon.sh` 스크립트는 재시작 시 해당 락 파일이 유효하지 않음을 자동으로 감지하고 제거합니다. 사용자가 수동으로 `.lock` 파일을 지울 필요 없이 안전하게 `restart` 명령을 사용할 수 있습니다.

### 4.2. 중지 실패 시 대응 (Fallback Kill)
데몬 중지 시 `jsvc` 명령이 실패하더라도 스크립트는 `kill` 명령을 통해 프로세스를 확실히 종료시키고 관련 파일(`.pid`, `.lock`)을 정리합니다. 이는 데몬이 '정지 상태'임에도 불구하고 파일 락 때문에 다시 시작되지 못하는 문제를 방지합니다.

### 관련 가이드

애플리케이션 배포 후, 실제 운영 환경에서는 Nginx와 같은 리버스 프록시를 구성하는 것이 좋습니다. 아래 가이드에서 자세한 방법을 확인하세요.

- [Nginx 리버스 프록시 및 클러스터링 가이드](/ko/aspectow/nginx-reverse-proxy-guide/)
