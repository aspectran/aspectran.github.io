---
title: Aspectow 배포 및 운영 가이드
teaser: 이 가이드는 Linux/Unix 및 Windows 환경에서 Aspectow 애플리케이션을 배포하고 서비스로 관리하는 방법을 상세히 설명합니다.
subheadline: Aspectow
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

#### 개발 환경 자동 감지 및 소스 보호 (Development Mode Support)

배포 스크립트들은 `app.conf`를 통해 현재 실행 위치가 소스 모듈(개발 환경)인지 운영 서버 배포 환경인지를 자동으로 감지합니다 (`pom.xml` 파일 존재 여부 및 Git 작업 트리 감지).

*   **개발 환경(`DEV_MODE=true`)에서의 동작**:
    *   `1-pull.sh`: 작업 중인 로컬 소스 및 커밋 상태를 안전하게 보호하기 위해 `git pull`을 건너뜁니다.
    *   `2-build.sh`: `.build` 디렉터리로 이동하지 않고 현재 모듈 디렉터리에서 `mvn clean package`를 직접 실행하여 `app/lib`에 라이브러리를 빌드 및 배치합니다. (스냅샷 반복 다운로드를 방지하여 빠른 빌드를 지원합니다.)
    *   `3-deploy_config.sh` 및 `4-deploy_webapps.sh`: 버전 관리 중인 로컬 소스(`app/config`, `app/webapps`)를 보존하기 위해 디렉터리 삭제(`rm -rf`) 및 덮어쓰기 복사를 건너뜁니다.
    *   이를 통해 개발 환경에서도 소스 유실 및 충돌 위험 없이 `./5-pull_build_deploy.sh` 등의 통합 배포 스크립트를 안심하고 테스트할 수 있습니다.

#### 다중 노드 동시 빌드 경합 방지 (Build Lock & Concurrency Control)

단일 머신 또는 동일한 작업 디렉터리를 공유하는 로컬 클러스터 환경에서 전체 노드(`All Nodes in Cluster`)를 대상으로 동시 풀빌드 명령이 실행될 때 발생할 수 있는 파일 락 충돌(`Failed to delete target`, `index.lock` 등)을 완벽하게 방지합니다.

*   **원자적 빌드 락 (`.build.lock`, `.pull.lock`)**:
    *   가장 먼저 진입한 노드가 작업 디렉터리에 원자적 락을 획득하고 Maven 빌드 또는 Git Pull을 주도적으로 실행합니다.
*   **안전한 대기 및 중복 빌드 자동 스킵 (Lock Wait & Build Reuse)**:
    *   동시에 진입한 다른 노드들은 `[BUILD LOCK] Another node is currently building... Waiting for completion...` 메시지를 출력하며 안전하게 대기합니다.
    *   선행 노드가 빌드를 정상 완료(`BUILD SUCCESS`)하면, 대기 중이던 노드들은 **중복 Maven 컴파일을 건너뛰고(`Skipping redundant Maven compilation.`) 직전 빌드 산출물을 그대로 재사용하여 즉시 성공 처리**합니다.
    *   이를 통해 파일 경합 에러가 100% 방지되며, 클러스터 전체 풀빌드 소요 시간이 1/N로 단축됩니다.

#### Git Branch 및 Tag 지정 배포 지원 (Target Branch / Tag Deployment)

운영 환경에서는 불변(Immutable) 상태인 정기 릴리즈 버전 태그(예: `v1.2.0`)를 배포하거나, 긴급 결함 조치를 위한 핫픽스 브랜치(예: `hotfix/xxx`)를 신속하게 배포해야 하는 상황이 빈번하게 발생합니다. Aspectow 배포 스크립트와 Aspectow Console은 이러한 상황을 위해 특정 Branch, Tag, Commit SHA를 지정하여 배포할 수 있는 기능을 완벽하게 지원합니다.

*   **명령줄 인자 및 환경 변수 전달**:
    *   `1-pull.sh|bat` 및 모든 복합 배포 스크립트(`5-pull_build_deploy.sh|bat` ~ `9-pull_deploy_config_webapps_only.sh|bat`) 실행 시 첫 번째 인자로 브랜치 또는 태그명을 전달할 수 있습니다.
        ```bash
        # 릴리즈 태그 지정 배포 (불변 배포 권장 방식)
        ./5-pull_build_deploy.sh v1.2.0

        # 긴급 핫픽스 브랜치 배포
        ./5-pull_build_deploy.sh hotfix/auth-patch

        # 웹 애플리케이션만 특정 브랜치 기준으로 업데이트
        ./8-pull_deploy_webapps_only.sh release/v1.1
        ```
    *   인자를 지정하지 않을 경우 기존과 동일하게 현재 체크아웃된 브랜치 또는 기본 브랜치(`main`)의 최신 커밋을 가져옵니다.
    *   환경 변수 `PARAM_BRANCH`를 설정하여 전달할 수도 있습니다.
*   **Aspectow Console 웹 UI 연동**:
    *   Aspectow Console의 **Build & Deployment** 화면에서 `Git Branch / Tag (Optional)` 입력란에 브랜치나 태그명을 입력하고 실행하면, 원격 클러스터의 단일 노드, 노드 그룹 또는 전체 노드에 지정된 브랜치/태그가 즉시 빌드 및 배포됩니다.
*   **안전한 Ref 사전 검증 및 작업 트리 보존 (Safe Ref Validation)**:
    *   브랜치나 태그명을 전환하기 전에 원격 저장소의 최신 메타데이터를 갱신(`git fetch --all --tags --prune`)하고, 로컬 태그(`refs/tags/*`), 로컬 브랜치(`refs/heads/*`), 원격 트래킹 브랜치(`origin/*`), 커밋 해시 여부를 사전 검증(`git rev-parse --verify`)합니다.
    *   사용자가 오타 등으로 존재하지 않는 브랜치/태그명을 입력한 경우, 기존 로컬 작업 트리를 전혀 변경하지 않고 즉시 스크립트를 중단(`exit 1`)하며 명확한 에러 로그(`[ERROR] Branch, tag, or commit '...' not found in repository.`)를 출력합니다.
    *   Aspectow Console 웹 화면에도 즉시 `FAILED` 상태와 에러 요약이 표시되어 잘못된 배포 시도로 인한 시스템 불안정을 사전에 방지합니다.

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

*   **런타임 디렉터리 자동 생성 (Zero Dummy Files)**:
    *   `app/lib`, `app/logs`, `app/temp`, `app/work`, `app/cmd/*` 등의 런타임 디렉터리는 Git에 `.gitignore`나 더미 파일 없이 관리됩니다.
    *   빌드 도구(`mvn package`)와 Aspectran 프레임워크(코어/데몬/셸 스크립트)가 기동 시점에 필요한 디렉터리를 스스로 생성(`mkdirs`)하므로, 실제 운영 환경에서는 불필요한 더미 파일이 전혀 존재하지 않는 100% 순수한 런타임 디렉토리 상태가 유지됩니다.

### 2.6. 다중 인스턴스 실행 (Running Multiple Instances)

동일한 서버 또는 하나의 배포 디렉터리(`BASE_DIR`)에서 여러 개의 독립적인 애플리케이션 인스턴스(예: `node1`, `node2`)를 구동해야 하는 경우가 있습니다. 예를 들어, 동일한 소스 및 배포 라이브러리를 공유하면서 서로 다른 HTTP 포트, 로그 디렉터리, 활성 프로필을 가지는 다중 노드 클러스터를 구성할 때입니다.

#### 다중 인스턴스 실행의 원리
Aspectow는 `context.singleton` 설정이 `true`(기본값)일 경우, 같은 `basePath` 내에서 프로세스가 중복 구동되는 것을 방지하기 위해 단일 인스턴스 전용 `.lock` 파일과 PID 파일을 참조합니다. 동일한 `BASE_DIR`에서 여러 인스턴스를 격리 구동하기 위해서는 각 인스턴스가 독립된 **프로세스 이름(PROC_NAME)**과 **PID 파일**, 그리고 **런타임 격리 디렉터리 설정**을 가져야 합니다.

1. **자동 PID 파일 경로 결정**: `jsvc-daemon.sh`는 `--proc-name`(`PROC_NAME`)이 기본값(`jsvc-daemon`)과 다르게 지정되면, 별도로 `--pid-file`을 넘기지 않더라도 자동으로 `$BASE_DIR/.$PROC_NAME.pid` 경로의 고유 PID 파일을 생성하고 관리합니다.
2. **프로세스 정밀 중지(Stop Isolation)**: `jsvc-daemon.sh stop` 실행 시, 프로세스 명령줄의 `-pidfile` 인자를 기준으로 대상 인스턴스의 프로세스만 정밀하게 추적하여 종료하므로 다른 인스턴스에 영향을 주지 않습니다.
3. **격리해야 하는 필수 시스템 프로퍼티 및 셸 옵션**:
   - `aspectran.basePath`: 공통 루트 경로 (`BASE_DIR`). 모든 인스턴스가 동일하게 공유 가능.
   - `aspectran.logsDir` 및 `--logs-dir`: 로그 파일 저장 경로 (`logs` vs `logs2`) 및 데몬 표준 출력/에러 로그(`daemon-stdout.log`, `daemon-stderr.log`) 경로. 로그 뒤섞임 및 파일 락 충돌 방지를 위해 **반드시 인스턴스별로 분리**.
   - `aspectran.workPath`: 런타임 클래스 컴파일 캐시 및 작업 공간 (`work` vs `work2`). **반드시 인스턴스별로 분리**.
   - `aspectran.tempPath` / `java.io.tmpdir` 및 `--temp-dir`: 임시 파일 저장소 (`temp` vs `temp2`). **반드시 인스턴스별로 분리**.
   - `aspectran.commandsPath`: Shell/Daemon IPC 명령 파이프 소켓 경로 (`cmd` vs `cmd2`). **반드시 인스턴스별로 분리**.
   - `tow.server.listener.http.port`: HTTP 수신 포트 (`8082` vs `8092` 등). **반드시 인스턴스별로 분리**.
   - `aspectow.node.id`: 클러스터 내 노드 식별자 (`node1` vs `node2`). **반드시 인스턴스별로 분리**.

#### 단계별 구동 및 관리 방법 (멀티 노드 구성 예시)

##### 1단계: 공통 `app.conf` 유지
기본 `setup/app.conf` 파일은 애플리케이션 이름, 배포 경로(`DEPLOY_DIR`), 기본 JVM 옵션 등 동일 서버 내 인스턴스들이 공통으로 사용하는 기본 설정으로 유지합니다.

##### 2단계: 인스턴스별 구동 스크립트 생성 (`daemon-node1.sh`, `daemon-node2.sh`)
공통 `setup/scripts/linux/daemon.sh`를 복사하여 각 인스턴스에 맞는 실행 스크립트를 작성합니다. 각 스크립트 상단에 `NODE_ID`, `PORT` 및 격리 디렉터리 변수를 선언하고 `ASPECTRAN_OPTS`와 셸 옵션(`--logs-dir`, `--temp-dir`)으로 전달합니다.

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

##### 3단계: 인스턴스 독립 구동 및 제어
각 인스턴스별 구동 스크립트를 사용하여 독자적으로 서비스 관리 작업을 수행합니다.

```bash
# node1 인스턴스 구동 및 상태 확인 (8082 포트 / node1)
./daemon-node1.sh start
./daemon-node1.sh status

# node2 인스턴스 구동 및 상태 확인 (8092 포트 / node2)
./daemon-node2.sh start
./daemon-node2.sh status

# 특정 인스턴스만 개별 종료
./daemon-node2.sh stop
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

- [Nginx 리버스 프록시 및 클러스터링 가이드](/ko/docs/aspectow/nginx-reverse-proxy-guide/)
