---
title: "Aspectran Daemon: File Commander를 통한 원격 명령 주입 및 제어"
subheadline: 핵심 가이드
---

**File Commander**는 별도의 관리 API를 노출하거나 SSH를 통한 직접적인 상호작용 없이, 파일 시스템을 매개체로 외부에서 Aspectran Daemon에 명령을 주입하고 시스템을 제어할 수 있는 **파일 기반 원격 인터페이스**입니다. 이 가이드는 File Commander의 내부 동작 원리와 이를 활용하여 운영 중인 서버를 안전하게 관리하는 방법을 상세히 설명합니다.

## 1. 설계 철학 및 배경

### 왜 원격 명령 주입인가?
운영 중인 애플리케이션 서버(예: Aspectow)를 제어하기 위해 전통적으로는 전용 관리 API(REST 등)를 구축하거나 SSH로 접속하여 쉘 명령을 수행합니다. 하지만 이러한 방식은 다음과 같은 제약이 있습니다.
*   **보안 리스크**: 관리용 포트를 외부에 노출하거나 SSH 접근 권한을 관리하는 과정에서 취약점이 발생할 수 있습니다.
*   **연동의 복잡성**: 외부 모니터링 시스템이나 자동화 스크립트에서 서버 내부의 특정 상태를 변경하려면 복잡한 프로토콜 구현이 필요합니다.

### File Commander의 접근 방식
File Commander는 **"파일 하나가 하나의 명령어"**라는 단순한 개념에서 출발합니다. 특정 디렉토리에 정해진 형식의 파일만 생성하면, 데몬이 이를 감지하여 내부 로직을 수행합니다. 이는 시스템 간의 결합도를 낮추고, 파일 시스템의 권한 체계만으로도 안전한 제어 창구가 확보할 수 있게 해줍니다.

## 2. 내부 동작 원리와 디렉토리 구조

File Commander는 명령어의 생명주기를 관리하기 위해 물리적으로 분리된 디렉토리 구조를 사용합니다. 모든 상태 전이는 **원자적 이동(Atomic Move)**을 통해 이루어지며, 이는 작업의 유실이나 중복 실행을 원천적으로 방지합니다.

### 디렉토리 역할 상세
1.  **`incoming/` (대기열)**
    *   외부 주입의 관문입니다. 사용자가 제어 명령이 담긴 `.apon` 파일을 이곳에 생성하면 처리 프로세스가 시작됩니다.
    *   폴러(Poller)는 설정된 주기에 따라 이 디렉토리를 감시하며, 파일 이름 순서대로 정렬하여 순차 처리를 보장합니다.
2.  **`queued/` (처리 중)**
    *   데몬이 명령어를 접수하여 현재 실행 중인 상태를 나타냅니다.
    *   이 디렉토리에 파일이 존재한다는 것은 "작업이 진행 중이거나, 진행 도중 비정상적으로 중단됨"을 의미하는 매우 중요한 상태 지표입니다.
3.  **`completed/` (성공 이력)**
    *   성공적으로 수행된 모든 명령의 결과가 저장됩니다.
    *   파일명에 `yyyyMMddTHHmmssSSS` 형태의 타임스탬프가 추가되어 실행 시점을 정확히 추적할 수 있습니다.
4.  **`failed/` (장애 리포트)**
    *   실행 실패 또는 문법 오류가 발생한 명령어가 보관됩니다.
    *   단순한 파일 보관이 아니라, 발생한 에러의 스택트레이스와 원본 내용을 통합한 상세 리포트가 생성되어 사후 분석(Post-mortem)을 돕습니다.

## 3. 핵심 메커니즘: 안정성과 신뢰성

### 단계별 트랜잭션 보장
File Commander는 단순히 파일을 읽는 것이 아니라, 다음과 같은 정교한 트랜잭션 단계를 거칩니다.

1.  **감지 및 원자적 접수**: `incoming`의 파일을 `queued`로 이동할 때 Java NIO의 `StandardCopyOption.ATOMIC_MOVE`를 사용합니다. 이는 OS 레벨에서 단일 연산으로 수행되므로, 복사 도중 에러가 발생하여 파일이 깨지는 현상이 없습니다.
2.  **비동기 실행 및 즉각 롤백(Rollback)**: 명령어는 별도의 스레드 풀에서 비동기로 실행됩니다. 만약 스레드 풀이 포화 상태여서 실행이 거절(Rejected)될 경우, File Commander는 즉시 `queued`의 파일을 다시 `incoming`으로 되돌려 놓습니다. 이 롤백 매커니즘을 통해 명령어가 실행되지 않고 사라지는 'Silent Loss' 문제를 완벽히 해결합니다.
3.  **장애 발생 시 자동 리포팅**: 파일 파싱 단계에서 오류가 발생하면 원본 내용을 `source` 필드에 보존하고 상세 예외 내용을 `error` 필드에 기록한 통합 APON 파일을 생성합니다.

### 고립된 명령어 (Isolated Command)
시스템 재시작(`restart`)이나 종료(`quit`)와 같은 명령은 다른 비즈니스 로직과 동시에 수행될 때 예측 불가능한 결과를 초래할 수 있습니다.
*   `Command.isIsolated()`가 `true`인 명령은 데몬 내부에서 **단독 실행**을 보장받습니다.
*   다른 일반 작업이 수행 중일 때 고립 명령이 들어오면, 실행이 유보되거나 롤백되어 안전한 시점에 다시 시도됩니다.

### 비정상 종료 복구 (Requeue)
데몬이 실행 도중 갑자기 죽더라도, `queued` 디렉토리에는 처리 중이던 파일이 남아 있습니다. 데몬이 재시작될 때 `requeue()` 프로세스가 구동되어 이 파일들을 모두 `incoming`으로 복구시킵니다. 이를 통해 어떠한 장애 상황에서도 주입된 제어 명령은 반드시 한 번은 수행되도록 보장합니다.

## 4. 커스텀 명령어 구현 및 등록

사용자는 서비스 특성에 맞춰 직접 명령어를 정의할 수 있습니다.

### Step 1: Command 구현
`AbstractCommand`를 상속받아 `execute` 메서드에 제어 로직을 작성합니다. 아래 예제는 운영 중인 서버를 점검 모드로 전환하는 기능을 구현한 것입니다.

```java
public class MaintenanceModeCommand extends AbstractCommand {
    @Override
    public CommandResult execute(CommandParameters parameters) {
        try {
            // 주입된 파라미터에서 모드(on/off) 추출
            String mode = null;
            ItemHolderParameters itemHolder = parameters.getParameters();
            if (itemHolder != null) {
                mode = itemHolder.getString("mode");
            }

            if (mode == null) {
                return failed("mode 파라미터가 필요합니다. (on/off)");
            }

            boolean enable = "on".equalsIgnoreCase(mode);
            
            // 애플리케이션의 특정 서비스 빈을 가져와 상태 변경
            MaintenanceService service = getDaemonService().getActivityContext().getBeanRegistry().getBean("maintenanceService");
            service.setMaintenanceMode(enable);

            String status = enable ? "활성화" : "비활성화";
            return success("서비스 점검 모드가 " + status + " 되었습니다.");
        } catch (Exception e) {
            // 실패 시 failed(e)를 호출하면 스택트레이스가 자동으로 error 필드에 담깁니다.
            return failed("점검 모드 변경 중 오류 발생", e);
        }
    }

    @Override
    public boolean isIsolated() {
        return true; // 상태 변경 작업이므로 다른 명령과 동시에 실행되지 않도록 설정
    }

    @Override
    public Descriptor getDescriptor() {
        return new CommandDescriptor("custom", "maintenance", "서비스 점검 모드 제어");
    }
}
```

### Step 2: 데몬 설정 등록
`aspectran-config.apon` 파일에 구현한 클래스를 등록합니다. 데몬 설정에 대한 상세 내용은 [데몬 애플리케이션 설정 (daemon)](https://aspectran.com/ko/docs/guides/aspectran-configuration/) 섹션을 참고하시기 바랍니다.

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
        com.yourpackage.MaintenanceModeCommand  # 커스텀 명령 등록
    ]
}
```

## 5. 실무 활용 명령어 예시 (Samples)

다음은 실제 운영 환경(Aspectow)에서 즉시 사용할 수 있는 다양한 명령어 예시입니다. 모든 예제는 가독성을 위해 개행이 포함된 APON 형식을 따릅니다.

### 5.1 시스템 및 제어 설정
데몬의 동작 설정을 실시간으로 변경하거나 시스템 정보를 조회할 수 있습니다.

*   **폴링 주기 변경** (`10-pollingInterval.apon`)
    ```apon
    command: pollingInterval
    arguments: {
        item: {
            value: 4000
            valueType: long
        }
    }
    ```
*   **시스템 정보 조회** (`11-sysinfo.apon`)
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

### 5.2 Undertow 서버 제어
웹 서버의 상태를 비대면으로 관리합니다.

*   **Undertow 서버 시작** (`20-undertow-start.apon`)
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
*   **Undertow 서버 재시작** (`21-undertow-restart.apon`)
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

### 5.3 비즈니스 로직 및 템플릿 실행
애플리케이션 내부의 특정 기능을 직접 호출합니다.

*   **Bean 메서드 호출** (`30-hello-action.apon`)
    ```apon
    command: invokeAction
    bean: helloActivity
    method: helloWorld
    ```
*   **Translet 실행** (`31-hello-translet.apon`)
    ```apon
    command: translet
    translet: hello
    ```
*   **템플릿 렌더링** (`32-hello-template.apon`)
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

### 5.4 컴포넌트 및 작업 모니터링
데몬에 등록된 리소스들의 상태를 상세히 파악할 수 있습니다.

*   **전체 Translet 목록 및 상세 조회**
    ```apon
    # 전체 목록 조회 (41-translet-list-all.apon)
    command: component
    parameters: {
        item: { name: type, value: translet }
        item: { name: mode, value: list-all }
    }

    # 특정 Translet 상세 정보 (43-translet-detail-hello.apon)
    command: component
    parameters: {
        item: { name: type, value: translet }
        item: { name: mode, value: detail }
        item: { type: array, name: targets, value: [ hello ] }
    }
    ```
*   **Job(스케줄러) 및 Aspect 조회**
    ```apon
    # 실행 중인 Job 목록 (60-job-list.apon)
    command: component
    parameters: {
        item: { name: type, value: job }
        item: { name: mode, value: list }
    }

    # 전체 Aspect 상세 정보 (51-aspect-detail-all.apon)
    command: component
    parameters: {
        item: { name: type, value: aspect }
        item: { name: mode, value: detail }
    }
    ```

### 5.5 생명주기 관리
데몬 자체를 재시작하거나 종료합니다.

*   **데몬 재시작** (`98-restart.apon`)
    ```apon
    command: restart
    ```
*   **데몬 종료** (`99-quit.apon`)
    ```apon
    command: quit
    requeuable: false
    ```

## 6. 운영상의 주의사항

### 재시작 루프 방지
`CommandParameters`의 `requeuable` 속성은 기본적으로 `true`입니다. 하지만 시스템을 종료시키는 `quit` 명령어의 경우, 이 값이 `true`이면 다음과 같은 상황이 발생할 수 있습니다.
1. `quit` 명령 주입 → 데몬 종료 시도 중 강제 종료됨.
2. 데몬 재시작 → `requeue`에 의해 `quit` 명령이 다시 `incoming`으로 복구됨.
3. 데몬 시작하자마자 다시 종료됨 (무한 반복).

따라서 시스템 종료나 파괴적인 제어 명령을 내릴 때는 `requeuable: false`를 명시하는 것이 안전합니다.

## 7. 결론 및 향후 확장성

Aspectran Daemon의 File Commander는 파일 시스템이라는 가장 보편적인 매개체를 통해 강력하고 안전한 원격 제어 환경을 제공합니다. 이번에 강화된 원자적 트랜잭션과 상세 리포팅 기능은 엔터프라이즈 환경에서 요구되는 높은 신뢰성을 만족시킵니다.

향후 File Commander의 이러한 철학은 유지하면서, 주입 매개체를 파일 시스템을 넘어 **데이터베이스(DB)**나 **Redis** 기반의 큐 서비스로 확장함으로써 더욱 전문적인 분산 제어 시스템으로 진화할 수 있는 토대를 갖추고 있습니다.
