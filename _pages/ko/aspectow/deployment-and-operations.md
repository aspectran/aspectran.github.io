---
format: plate solid article
title: 배포 및 운영 가이드
teaser: 이 가이드에서는 Aspectow 애플리케이션을 배포하고 다양한 운영 체제에서 서비스로 관리하는 방법에 대한 지침을 제공합니다.
sidebar: toc
---

이 가이드는 Linux/Unix 및 Windows 환경에서 Aspectow 애플리케이션을 배포하고 서비스로 관리하는 방법을 상세히 설명합니다. 제공되는 스크립트들을 활용하여 효율적인 운영 환경을 구축할 수 있습니다.

이 가이드에서 설명하는 실행 방식은 크게 두 가지입니다.
1.  **자동화된 배포 및 서비스 관리**: `setup` 디렉터리의 스크립트를 사용하여 서버에 애플리케이션을 설치하고, 빌드/배포하며, 시스템 서비스로 관리하는 표준적인 운영 방식입니다. **(권장)**
2.  **수동 실행 및 관리**: `app/bin` 디렉터리의 스크립트를 사용하여 개발 또는 테스트 목적으로 애플리케이션을 직접 실행하는 방식입니다.

---

## 1. 사전 준비

배포를 진행하기 전에, 서버에 다음 소프트웨어가 설치되어 있어야 합니다.

*   **Java (JDK)**: 버전 21 이상
*   **Git**: 소스 코드 저장소로부터 애플리케이션을 가져오기 위해 필요합니다.
*   **Apache Maven**: 애플리케이션 소스 코드를 빌드하기 위해 필요합니다.

---

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

1.  원본 소스 저장소에서 **`setup` 디렉터리 전체**를 서버의 원하는 위치로 복사합니다. `setup` 디렉터리에는 다음이 반드시 포함되어야 합니다.
    *   `install-app.bat`
    *   `setenv.bat`
    *   `scripts\` 하위 디렉터리와 그 안의 모든 파일
2.  복사한 `setup` 디렉터리로 이동합니다.
    ```cmd
    cd /d path\to\setup
    ```
3.  `setenv.bat` 파일을 열어 `APP_NAME`, `BASE_DIR` 등 자신의 서버 환경에 맞게 변수 값을 수정합니다. (`BASE_DIR`은 `C:\Aspectran\aspectow`와 같은 윈도우 경로 형식이어야 합니다.)
4.  설치 스크립트를 실행합니다.
    ```cmd
    install-app.bat
    ```

### 2.2. 서비스 설치 및 관리

최초 설치가 완료되면, 애플리케이션을 시스템 서비스로 등록하여 관리할 수 있습니다.

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

### 2.3. 배포 스크립트 상세 (`setup/scripts`)

`setup/scripts` 디렉터리는 플랫폼별(`linux`/`windows`)로 나뉘어 있으며, 배포 자동화를 위한 다양한 스크립트를 포함합니다. 이 스크립트들은 `[BASE_DIR]`에 복사되어 애플리케이션 업데이트 등에 사용됩니다.

*   `1-pull.sh|bat`: 최신 소스 코드 가져오기
*   `2-build.sh|bat`: Maven으로 프로젝트 빌드
*   `3-deploy_config.sh|bat`: 설정 파일만 배포
*   `4-deploy_webapps.sh|bat`: 웹 애플리케이션 파일만 배포
*   `5-pull_build_deploy.sh|bat`: 소스 가져오기, 빌드, 전체 배포 (가장 일반적인 전체 배포)
*   `6-pull_deploy.sh|bat`: 소스 가져오기, 전체 배포 (빌드 생략)
*   ... (이하 생략)

---

## 3. 수동 실행 및 관리 (`app/bin` 스크립트 활용)

개발, 디버깅 등의 목적으로 서비스로 등록하지 않고 애플리케이션을 직접 실행할 때 사용합니다. 모든 관련 스크립트는 `[BASE_DIR]/app/bin` 디렉터리에 있습니다.

### `run.options` 파일 설정

`app/bin/run.options` 파일은 `shell.sh`, `daemon.sh` 등 수동으로 실행하는 모든 스크립트에 대한 공통 설정을 정의합니다. 주석 처리된 값을 해제하고 수정하여 사용할 수 있습니다.

*   `JAVA_HOME`: 사용할 JDK의 경로를 직접 지정합니다. 설정하지 않으면 시스템의 기본 `JAVA_HOME`을 따릅니다.
*   `JVM_MS`: JVM 초기 힙 크기 (MB 단위). 예: `JVM_MS=256`
*   `JVM_MX`: JVM 최대 힙 크기 (MB 단위). 예: `JVM_MX=1024`
*   `JVM_SS`: 스레드 스택 크기 (KB 단위). 예: `JVM_SS=1024`
*   `WAIT_TIMEOUT`: `daemon.sh` 스크립트가 데몬의 시작 또는 종료를 기다리는 최대 시간 (초 단위). 이 시간을 초과하면 실패로 간주합니다. 예: `WAIT_TIMEOUT=60`

### Linux/Unix 환경

*   `daemon.sh`: 간단한 백그라운드 데몬으로 실행. 비정상 종료 시 남겨진 잠금 파일을 자동으로 정리합니다.
*   `jsvc-daemon.sh`: Apache Commons `jsvc`를 이용한 데몬으로 실행 (더 안정적). 비정상 종료 시 남겨진 PID 파일을 자동으로 정리합니다.
*   `shell.sh`: 대화형 셸 모드로 실행

### Windows 환경

*   `daemon.bat`: 콘솔 창에 실행 과정을 표시하며 데몬으로 실행
*   `shell.bat`: 대화형 셸 모드로 실행
*   `procrun\` 디렉터리: Windows 서비스 설치/제거/관리를 위한 `prunsrv.exe` 관련 스크립트
