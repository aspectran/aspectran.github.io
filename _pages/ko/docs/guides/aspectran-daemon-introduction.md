---
title: Aspectran Daemon 소개
subheadline: 핵심 가이드
---

## 1. Aspectran Daemon이란 무엇인가?

Aspectran Daemon은 Aspectran 프레임워크 기반의 애플리케이션을 독립적인 백그라운드 프로세스(데몬 또는 OS 시스템 서비스)로 실행하고 안정적으로 관리하기 위한 강력한 **서비스 컨테이너이자 런타임 플랫폼**입니다. 단순히 백그라운드에서 Java 스크립트를 실행하는 유틸리티를 넘어, 운영체제(OS)의 서비스 관리자와 깊게 통합되고, 파일 시스템을 매개로 외부에서 실시간으로 명령을 주입하여 제어할 수 있는 헤드리스(Headless) 인터페이스를 제공합니다.

Aspectran Daemon은 웹 인터페이스나 CLI 쉘(Shell) 터미널 접속 없이도, 대규모 데이터 배치 처리, 주기적인 스케줄링 작업(Scheduler), 모니터링 에이전트, 백그라운드 큐 워커 등 24시간 중단 없이 실행되어야 하는 롱-러닝(Long-running) 백엔드 시스템을 운영하는 데 최적화되어 있습니다.

## 2. 핵심 설계 철학 및 특징

### 통일된 Activity 아키텍처 (Unified Activity Architecture)
Aspectran의 핵심 설계 사상에 따라 데몬 환경 역시 `DaemonActivity`를 통해 웹(`ServletWebActivity`, `NettyActivity`)이나 쉘(`ShellActivity`)과 동일한 트랜잭션, AOP 및 액션 실행 파이프라인을 공유합니다.
* 파일 또는 스케줄러를 통해 주입된 명령은 `DaemonActivity` 인스턴스를 통해 처리되며, 기존 비즈니스 로직(Translet 및 Bean)을 코드 수정 없이 데몬 환경에서 그대로 재사용할 수 있습니다.

### 파일 기반 비대면 원격 제어 (File Commander)
관리용 포트를 외부에 열거나 SSH로 접속할 필요 없이, 지정된 디렉토리(`cmd/incoming`)에 APON 형식의 명령어 파일을 생성하는 것만으로 실행 중인 데몬에 안전하게 작업을 지시할 수 있습니다.
* **원자적 파일 이동(Atomic Move)**: 작업의 중복 실행과 유실을 원천 차단합니다.
* **비동기 실행 및 자동 롤백(Rollback)**: 스레드 풀 포화 시 명령어를 대기열로 복구합니다.
* **사후 분석 리포트(Post-mortem Report)**: 오류 발생 시 상세 스택트레이스를 포함한 리포트 파일을 자동 생성합니다.

### 다양한 OS 서비스 통합 지원
Apache Commons Daemon 연동을 통해 다양한 엔터프라이즈 운영 환경에 최적화된 실행 방식을 제공합니다.
* **표준 자바 프로세스 (`DefaultDaemon`)**: Linux/Windows 환경에서 범용 스크립트로 구동
* **Unix/Linux 정식 시스템 데몬 (`JsvcDaemon`)**: root 권한으로 포트 바인딩 후 일반 계정으로 권한 강등(Drop privileges), systemd 연동 지원
* **Windows 서비스 (`ProcrunDaemon`)**: Windows 서비스 관리자(`services.msc`)를 통한 백그라운드 서비스 제어

### 스케줄러 및 내장 웹 서버의 유기적 제어
백그라운드에서 Quartz 기반의 정기 스케줄링 작업(Job)을 수행하면서, 필요 시 내장 Netty, Undertow, Jetty 서버를 함께 기동하여 관리용 엔드포인트나 REST API 서비스를 동시에 제공할 수 있습니다.

## 3. 아키텍처 및 내부 동작 구조

Aspectran Daemon은 최상위 서비스 관리자인 `DaemonService`, 명령어 수신 및 폴링을 담당하는 `FileCommander`, 스레드 풀 기반의 `AsyncCommandExecutor`, 그리고 실행 컨텍스트인 `DaemonActivity`로 구성됩니다.

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

### 주요 구성 컴포넌트
* **`DaemonService` (`DefaultDaemonService`)**: Daemon의 생명주기(초기화, 시작, 일시중지, 재시작, 파기) 및 내부 스레드 풀, 백그라운드 리소스를 총괄 관리합니다.
* **`FileCommander` (`DefaultFileCommander`)**: `incoming` 디렉토리를 주기적으로 감시하여 새로운 명령어 파일을 감지하고, 원자적 이동(Atomic Move)을 통해 작업을 접수합니다.
* **`AsyncCommandExecutor`**: 유입된 명령어를 백그라운드 워커 스레드에 비동기로 할당하여 처리합니다.
* **`DaemonActivity`**: 데몬에서 1회 명령(Translet 또는 Action)을 실행하는 단위 컨텍스트입니다.
  * `DaemonRequestAdapter`: APON 파일의 인자 및 속성을 Translet 파라미터로 변환합니다.
  * `DaemonResponseAdapter`: 실행 결과를 지정된 출력 파일이나 응답 파일에 기록합니다.
  * `DaemonSessionAdapter`: 데몬 실행 세션 상태를 관리합니다.

## 4. 실행 환경 및 런처 모드 (Execution Modes)

Aspectran Daemon은 배포 및 운영 목적에 따라 4가지 실행 모드를 제공합니다.

| 런처 클래스 | 실행 방식 | 대상 환경 | 주요 특징 |
| :--- | :--- | :--- | :--- |
| **`DefaultDaemon`** | 독립 자바 프로세스 (`daemon.sh`, `daemon.bat`) | 모든 OS, 로컬 개발/테스트 | 표준 `main()` 메서드로 실행되는 가장 간편한 모드 |
| **`JsvcDaemon`** | Apache Commons Daemon `Jsvc` (`jsvc-daemon.sh`) | Linux, Unix | `root` 권한으로 시작 후 지정된 사용자로 권한 강등, systemd 등록 지원 |
| **`ProcrunDaemon`** | Apache Commons Daemon `Procrun` (`prunsrv`) | Windows Server | Windows 서비스 관리자(`services.msc`)에 정식 서비스로 등록 |
| **`SimpleDaemon`** | 경량 임베디드 런처 | 단위 테스트, 타 프로세스 내장 | 웹/쉘 엔진 없이 오직 데몬 컨테이너와 스케줄러만 가볍게 기동 |

## 5. 내장 명령어 (Built-in Commands)

File Commander를 통해 주입할 수 있는 Aspectran Daemon의 표준 내장 명령어 목록입니다.

| 명령어 | 설명 | 주요 파라미터 및 속성 |
| :--- | :--- | :--- |
| `invokeAction` | 특정 Bean의 메서드(Action)를 직접 호출합니다. | `bean`: Bean ID, `method`: 호출할 메서드명 |
| `translet` | 등록된 Translet 비즈니스 로직을 실행합니다. | `translet`: 실행할 Translet 이름, `parameters`: 요청 파라미터 |
| `template` | 특정 템플릿을 렌더링하여 결과를 파일로 생성합니다. | `template`: 템플릿 ID, `parameters`: 템플릿 토큰 값 |
| `component` | Translet, Aspect, Job 등의 컴포넌트 목록과 상세 정보를 조회합니다. | `type`: `translet`/`aspect`/`job`, `mode`: `list`/`list-all`/`detail` |
| `sysinfo` | JVM 메모리, 시스템 프로퍼티, OS 정보를 조회하여 파일로 기록합니다. | `arguments`: `mem`, `props` |
| `pollingInterval` | File Commander의 폴링 주기(ms)를 실시간으로 변경합니다. | `arguments`: 새로운 폴링 간격(long) |
| `netty` / `undertow` / `jetty` | 내장 웹 서버를 시작, 중지, 재시작하거나 상태를 확인합니다. | `mode`: `start`/`stop`/`restart`/`status`, `server`: 서버 Bean ID |
| `restart` | Aspectran 애플리케이션 컨텍스트를 핫 리로드하여 재시작합니다. | `isolated`: `true` (단독 실행) |
| `quit` | 데몬 프로세스를 안전하게 종료합니다. | `requeuable`: `false` (재기동 시 재실행 방지) |

## 6. 파일 기반 원격 제어 메커니즘 (File Commander)

File Commander는 물리적으로 격리된 디렉토리 구조를 사용하여 명령어의 생명주기를 트랜잭션 단위로 관리합니다.

### 1) 디렉토리 구조 및 역할
* **`incoming/` (대기열)**: 외부 시스템이나 관리자가 실행할 `.apon` 명령어 파일을 생성하는 관문입니다.
* **`queued/` (처리 중)**: 데몬이 명령어를 접수하여 현재 실행 중인 상태입니다.
* **`completed/` (성공 이력)**: 성공적으로 완료된 명령어 파일이 타임스탬프(`yyyyMMddTHHmmssSSS`)와 함께 보관됩니다.
* **`failed/` (장애 리포트)**: 실행 중 오류나 문법 에러가 발생한 파일이 상세 예외 스택트레이스와 함께 기록됩니다.

### 2) 핵심 신뢰성 메커니즘
* **원자적 접수 (Atomic Move)**: `StandardCopyOption.ATOMIC_MOVE`를 사용하여 OS 레벨에서 단일 연산으로 파일을 이동하므로 파일 손상이 없습니다.
* **스레드 풀 포화 시 자동 롤백**: 워커 스레드가 부족하여 실행이 거절되면 `queued`의 파일을 즉시 `incoming`으로 되돌려 작업 유실을 방지합니다.
* **고립된 명령어 (Isolated Command)**: `restart`나 `quit`처럼 시스템 전반에 영향을 주는 명령은 다른 비즈니스 로직이 모두 종료된 후 단독으로 실행됩니다.
* **비정상 종료 복구 (Requeue)**: 데몬이 예기치 않게 다운된 후 재시작되면 `queued` 디렉토리에 남아 있던 미완료 작업을 자동으로 `incoming`으로 복구하여 재실행합니다.

## 7. 설정 가이드 (`aspectran-config.apon`)

Aspectran 루트 설정 파일(`aspectran-config.apon`)에서 `daemon` 섹션을 구성하여 데몬의 동작 방식을 정의합니다.

```apon
daemon: {
    # 비동기 명령어 처리를 위한 백그라운드 스레드 풀 설정
    executor: {
        maxThreads: 5
    }

    # 파일 기반 명령어 폴링(File Commander) 설정
    polling: {
        pollingInterval: 5000       # 감시 주기 (밀리초)
        requeuable: true            # 미완료 작업 자동 복구 여부
        incoming: /app/cmd/incoming # 감시 대상 디렉토리 (생략 시 기본 경로 사용)
        enabled: true               # File Commander 활성화 여부
    }

    # 데몬에서 사용할 수 있는 내장 명령어 목록
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

    # 데몬 세션 관리자 설정
    session: {
        enabled: true
    }

    # Translet 노출 및 접근 제어 패턴
    acceptable: {
        -: /**
        +: /batch/**
        +: hello
    }
}
```

## 8. 실무 명령어 작성 예시 (APON Samples)

`cmd/incoming` 디렉토리에 주입하여 즉시 사용할 수 있는 대표적인 APON 명령어 예시입니다.

### 1) 시스템 정보 조회 (`11-sysinfo.apon`)
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

### 2) Translet 실행 및 파라미터 전달 (`31-hello-translet.apon`)
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

### 3) 내장 Netty 서버 제어 (`20-netty-start.apon`)
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

### 4) 데몬 안전 종료 (`99-quit.apon`)
```apon
command: quit
# 재기동 시 Requeue 메커니즘에 의해 다시 종료되는 루프를 방지하기 위해 false 설정
requeuable: false
```

## 9. 커스텀 명령어(Custom Command) 구현

서비스 특화 제어 로직(예: 긴급 캐시 플러시, 배치 작업 강제 트리거 등)을 커스텀 명령어로 구현할 수 있습니다.

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

            // Application Context에서 캐시 관리 빈을 조회하여 실행
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

작성한 커스텀 명령어를 `aspectran-config.apon`의 `daemon.commands` 배열에 등록하면 즉시 사용할 수 있습니다.

## 10. 개발 환경(IDE)에서의 런처 구성

IDE 환경에서 데몬 서비스와 스케줄러를 디버깅 모드로 실행하기 위한 런처 클래스(`TestDaemon.java`)를 작성합니다.

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

            // DefaultDaemon 부트스트래핑
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

## 11. 운영 환경 배포 및 서비스 등록 가이드

### 1) 범용 쉘 스크립트 (`daemon.sh` / `daemon.bat`)
Linux/macOS 환경에서 표준 자바 백그라운드 프로세스로 관리합니다.

```bash
$ cd app/bin
$ ./daemon.sh start      # 데몬 백그라운드 시작
$ ./daemon.sh status     # 프로세스 상태 점검
$ ./daemon.sh --debug    # 상세 디버깅 로그 모드로 실행
$ ./daemon.sh restart    # 데몬 재시작
$ ./daemon.sh stop       # 데몬 정상 종료
```

### 2) Unix/Linux `jsvc` 기반 시스템 서비스 (`jsvc-daemon.sh`)
Apache Commons Daemon `jsvc`를 사용하여 80/443 등 특권 포트를 `root` 권한으로 바인딩한 후, 지정된 일반 사용자(예: `aspectran`)로 권한을 안전하게 강등하여 실행합니다.

```bash
$ cd app/bin
$ ./jsvc-daemon.sh start
$ ./jsvc-daemon.sh stop
```

systemd 서비스 파일(`aspectran.service`) 예시:
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

### 3) Windows `Procrun` 서비스 등록
`app/bin/procrun/` 내의 배치 스크립트를 사용하여 Windows 서비스 관리자에 등록합니다.
* `install-service.bat`: Windows 서비스 등록 (`prunsrv //IS//AspectranDaemon`)
* `uninstall-service.bat`: Windows 서비스 등록 해제

## 12. 실무 활용 시나리오

### 1) 엔터프라이즈 배치 스케줄러 & 데이터 파이프라인
정해진 주기마다 대용량 데이터를 처리하고 리포트를 생성하는 Quartz 기반 스케줄링 작업을 안전하게 수행합니다.

### 2) 헤드리스 마이크로서비스 및 비동기 워커
별도의 UI나 웹 포트 개방 없이 백그라운드에서 큐 메시지나 DB 폴링 작업을 처리하며, 장애 발생 시 파일 기반으로 즉각 재시작 및 상태 점검을 수행합니다.

### 3) IoT / 엣지 게이트웨이 시스템 데몬
임베디드 리눅스 환경에서 경량 Java 서비스로 상시 구동되며, 로컬 센서 데이터 집계 및 상위 서버 전송 작업을 백그라운드에서 수행합니다.

## 13. 관련 문서

* [Aspectran Daemon: File Commander를 통한 원격 명령 주입 및 제어](https://aspectran.com/ko/docs/guides/aspectran-daemon-file-commander/)
* [Aspectran Scheduler: Translet을 이용한 작업 자동화](https://aspectran.com/ko/docs/guides/aspectran-scheduler/)
* [Aspectran 사용자 가이드](https://aspectran.com/ko/docs/guides/aspectran-user-guide/)
* [APON (Aspectran Parameters Object Notation) 소개](https://aspectran.com/ko/docs/guides/introduce-apon/)
* [Aspectran Shell 소개](https://aspectran.com/ko/docs/guides/aspectran-shell-introduction/)
