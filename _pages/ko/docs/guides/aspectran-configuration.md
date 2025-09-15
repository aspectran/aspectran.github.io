---
format: plate solid article
sidebar: toc-left
title: Aspectran 기본 구성 가이드
subheadline: 사용자 가이드
parent_path: /docs
---

"기본 구성 설정"은 Aspectran 애플리케이션의 초기 구동에 필요한 핵심 설정 값을 제공하며, 이를 기반으로 어노테이션 기반의 컴포넌트 스캔 대상을 지정하거나, 추가적인 XML 또는 APON 형식의 규칙 파일을 로드하도록 지시할 수 있습니다.

애플리케이션 구동 시 `com.aspectran.core.context.config.AspectranConfig` 객체를 통해 설정 값을 직접 세팅할 수도 있지만, 일반적으로는 APON(Aspectran Parameter Object Notation) 형식의 `aspectran-config.apon` 파일을 작성하여 사용합니다.

`aspectran-config.apon` 파일은 `AspectranConfig` 객체로 로딩되며, 다음과 같은 주요 섹션으로 구성됩니다:

*   `system`: 시스템 관련 속성 정의 (예: 암호화 키, 스레드 풀 설정 등).
*   `context`: 애플리케이션의 핵심 로직을 담고 있는 ActivityContext 관련 설정 (예: 규칙 파일 로드, 빈 스캔 경로, 프로필 등).
*   `scheduler`: 스케줄러 관련 설정.
*   `shell`: 셸(Shell) 기반 애플리케이션 환경 관련 설정.
*   `daemon`: 데몬(Daemon) 프로세스 환경 관련 설정.
*   `web`: 웹 애플리케이션 환경 관련 설정.

---

## 1. 시스템 설정 (`system`)

시스템 레벨의 속성 값을 추가로 설정할 수 있습니다. 주로 외부 라이브러리나 JVM 시스템 속성에 영향을 주는 값을 정의하는 데 사용됩니다.

**주의:** 데모 애플리케이션에서는 편의상 암호화 키를 직접 지정하고 있지만, **프로덕션 환경에서는 절대로 여기에 패스워드를 평문으로 저장해서는 안 됩니다.** 외부 설정 파일, 환경 변수 또는 Vault와 같은 안전한 방법을 사용해야 합니다.

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

- **`properties`**: 여기에 정의된 키-값 쌍은 `System.setProperty()`를 통해 시스템 속성으로 등록됩니다.

---

## 2. 컨텍스트 설정 (`context`)

애플리케이션의 핵심 로직을 구성하는 `ActivityContext`를 생성하는 데 필요한 설정을 정의합니다. 이 섹션은 Aspectran의 심장부와 같으며, 대부분의 애플리케이션 설정이 이곳에 집중됩니다.

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

- **`name`**: `ActivityContext`의 고유한 이름을 지정합니다.
- **`rules`**: XML 또는 APON 형식으로 작성된 핵심 규칙 파일의 경로를 지정합니다. 배열 형태로 여러 파일을 지정할 수 있습니다. 이 파일들에는 **Bean, Translet, Aspect** 등의 주요 규칙이 정의됩니다.
- **`resources`**: 애플리케이션 클래스로더가 라이브러리(JAR 파일)나 리소스를 찾을 수 있도록 여러 디렉토리 경로를 추가합니다. 예를 들어, `resources: [ /lib/ext ]`는 애플리케이션 실행 위치 하위의 `/lib/ext` 디렉토리를 클래스패스에 추가하라는 의미입니다.
- **`scan`**: 컴포넌트 스캔을 수행할 기본 패키지를 지정합니다. Aspectran은 지정된 패키지 하위에서 `@Component`, `@Bean`, `@Aspect` 등의 어노테이션이 붙은 클래스를 찾아 자동으로 빈(Bean)으로 등록합니다.
- **`profiles`**: 애플리케이션의 실행 환경을 구분하는 프로필을 설정합니다.
    - **`base`**: 항상 활성화되어야 하는 기본 프로필을 지정합니다.
    - **`active`**: 현재 활성화할 프로필을 지정합니다. 여러 프로필은 쉼표(`,`)로 구분합니다.
    - **`default`**: `active` 프로필이 지정되지 않았을 때 기본으로 활성화할 프로필을 지정합니다.
- **`autoReload`**: 개발 중에 서버를 재시작하지 않고도 변경된 설정 파일을 동적으로 다시 로드할 수 있도록 설정합니다.
    - **`scanIntervalSeconds`**: 변경 사항을 감지하기 위해 파일을 스캔하는 주기를 초 단위로 지정합니다.
    - **`enabled`**: 자동 리로드 기능을 활성화합니다 (`true` 또는 `false`).
- **`singleton`**: 애플리케이션이 이미 구동 중일 때, 중복으로 구동되는 것을 방지하기 위한 설정입니다. `true`로 설정하면 중복 실행을 막을 수 있습니다.

---

## 3. 스케줄러 설정 (`scheduler`)

애플리케이션 내에서 스케줄링된 작업을 관리하는 데 필요한 설정을 정의합니다.

```apon
scheduler: {
    startDelaySeconds: 3
    waitOnShutdown: true
    enabled: false
}
```

- **`startDelaySeconds`**: 스케줄러가 시작된 후, 첫 작업을 실행하기까지 대기하는 시간(초)을 지정합니다.
- **`waitOnShutdown`**: 애플리케이션이 종료될 때, 현재 실행 중인 스케줄링된 작업이 완료될 때까지 대기할지 여부를 설정합니다.
- **`enabled`**: 스케줄러 기능을 활성화할지 여부를 설정합니다. `true`로 설정해야 스케줄링이 동작합니다.

---

## 4. 셸 애플리케이션 설정 (`shell`)

Aspectran을 독립적인 셸(Command-Line Interface) 애플리케이션으로 실행할 때의 환경을 정의합니다.

- **`style`**: 셸 프롬프트 및 출력 메시지의 색상 스타일을 정의합니다.
- **`greetings`**: 셸 시작 시 표시될 환영 메시지를 정의합니다.
- **`prompt`**: 셸 명령줄 프롬프트의 형식을 정의합니다.
- **`commands`**: 셸 환경에서 사용할 명령어 클래스들의 전체 경로를 배열 형태로 등록합니다. 여기에 등록된 명령어만 해당 셸에서 사용할 수 있습니다.
- **`session`**: 셸 세션 관리 설정을 정의합니다.
    - **`workerName`**: 세션 ID에 포함될 워커의 고유 이름입니다. 하나의 애플리케이션에서 여러 세션 매니저를 사용할 경우, 세션 ID 충돌을 방지하기 위해 이 값을 중복되지 않게 설정해야 합니다. (예: 세션 ID `1757036789577_1itojbks5r0jw1fsahrs1se7e70.rn0`에서 `.rn0` 부분이 워커 이름에 해당합니다.)
    - **`maxActiveSessions`**: 동시에 활성화될 수 있는 최대 세션 수를 지정합니다.
    - **`maxIdleSeconds`**: 일반 세션이 비활성 상태로 유지될 수 있는 최대 시간(초)입니다. 이 시간이 지나면 세션이 만료될 수 있습니다.
    - **`maxIdleSecondsForNew`**: 신규 세션의 최대 유휴 시간(초)입니다. 세션 생성 후 이 시간 내에 속성이 추가되지 않으면 만료됩니다.
    - **`scavengingIntervalSeconds`**: 만료된 세션을 정리하는 스캐빈저(scavenger) 스레드의 실행 간격(초)을 지정합니다.
    - **`evictionIdleSeconds`**: 일반 세션이 만료된 후, 이 유예 시간이 지나면 저장소에서 **영구 삭제**됩니다.
    - **`evictionIdleSecondsForNew`**: 신규 세션이 만료된 후, 이 유예 시간이 지나면 영구 삭제됩니다.
    - **`fileStore`**: 세션 데이터를 파일 기반으로 저장할 때 사용합니다.
        - **`storeDir`**: 세션 파일이 저장될 디렉토리 경로를 지정합니다.
    - **`enabled`**: 세션 관리 기능의 활성화 여부를 설정합니다.
- **`historyFile`**: 셸 명령어 기록을 저장할 파일 경로를 지정합니다.
- **`verbose`**: 상세 정보 출력 모드(verbose mode) 활성화 여부를 설정합니다.
- **`acceptable`**: 셸에서 허용되거나 거부될 Translet 요청 패턴을 정의합니다.

#### 셸 내장 명령어

Aspectran 프레임워크에서 기본으로 제공하는 명령어들이며, 개발자가 직접 명령어를 구현하여 추가할 수도 있습니다. 아래의 내장 명령어를 사용하려면 위 `commands` 배열에 해당 명령어의 전체 클래스 경로를 명시적으로 추가해야 합니다.

| 명령어 | 설명 |
| :--- | :--- |
| `aspect` | `com.aspectran.shell.command.builtins.AspectCommand`<br/>등록된 Aspect 규칙을 조회하거나 활성/비활성 상태를 변경합니다. |
| `job` | `com.aspectran.shell.command.builtins.JobCommand`<br/>스케줄에 등록된 Job 규칙을 조회하거나 활성/비활성 상태를 변경합니다. |
| `translet` | `com.aspectran.shell.command.builtins.TransletCommand`<br/>등록된 Translet 규칙을 조회하거나 직접 실행합니다. |
| `sysinfo` | `com.aspectran.shell.command.builtins.SysInfoCommand`<br/>JVM 시스템 속성, 클래스패스, 메모리 사용량 등 시스템 정보를 출력합니다. |
| `encrypt` | `com.aspectran.shell.command.builtins.PBEncryptCommand`<br/>PBE(Password-Based Encryption) 방식으로 문자열을 암호화합니다. |
| `decrypt` | `com.aspectran.shell.command.builtins.PBDecryptCommand`<br/>PBE 방식으로 암호화된 문자열을 복호화합니다. |
| `restart` | `com.aspectran.shell.command.builtins.RestartCommand`<br/>셸 서비스를 재시작하여 모든 설정을 다시 로드합니다. |
| `help` | `com.aspectran.shell.command.builtins.HelpCommand`<br/>명령어 목록 또는 특정 명령어에 대한 도움말을 표시합니다. |
| `history` | `com.aspectran.shell.command.builtins.HistoryCommand`<br/>명령어 입력 기록을 보거나 삭제합니다. |
| `clear` | `com.aspectran.shell.command.builtins.ClearCommand`<br/>콘솔 화면을 지웁니다. |
| `echo` | `com.aspectran.shell.command.builtins.EchoCommand`<br/>입력된 메시지를 그대로 출력합니다. |
| `verbose` | `com.aspectran.shell.command.builtins.VerboseCommand`<br/>Translet 실행 전, 해당 Translet에 대한 상세 설명 출력 여부를 설정합니다. |
| `quit` | `com.aspectran.shell.command.builtins.QuitCommand`<br/>셸을 종료합니다. |
| `jetty` | `com.aspectran.jetty.shell.command.JettyCommand`<br/>내장된 Jetty 서버를 제어합니다 (시작/중지/재시작/상태확인). |
| `undertow` | `com.aspectran.undertow.shell.command.UndertowCommand`<br/>내장된 Undertow 서버를 제어합니다 (시작/중지/재시작/상태확인). |

---

## 5. 데몬 애플리케이션 설정 (`daemon`)

Aspectran을 백그라운드 데몬 프로세스로 실행할 때의 환경을 정의합니다.

- **`executor`**: 데몬 작업 실행을 위한 스레드 풀 설정을 정의합니다.
    - **`maxThreads`**: 최대 스레드 수를 지정합니다.
- **`polling`**: 데몬의 폴링(polling) 동작을 정의합니다.
    - **`pollingInterval`**: 폴링 간격(밀리초)을 지정합니다.
    - **`requeuable`**: 작업 실패 시 재큐(re-queue) 가능 여부를 설정합니다.
    - **`incoming`**: 폴링을 통해 들어온 요청을 처리할 Translet 경로를 지정합니다.
- **`commands`**: 데몬 환경에서 사용할 명령어 클래스들의 전체 경로를 배열 형태로 등록합니다. 여기에 등록된 명령어만 해당 데몬에서 사용할 수 있습니다.
- **`session`**: 데몬 세션 관리 설정을 정의합니다. 이 설정은 `shell`의 `session` 설정과 동일한 하위 항목을 가집니다.
- **`acceptable`**: 데몬에서 허용되거나 거부될 Translet 요청 패턴을 정의합니다.

#### 데몬 내장 명령어

Aspectran 프레임워크에서 기본으로 제공하는 명령어들이며, 개발자가 직접 명령어를 구현하여 추가할 수도 있습니다. 아래의 내장 명령어를 사용하려면 위 `commands` 배열에 해당 명령어의 전체 클래스 경로를 명시적으로 추가해야 합니다.

| 명령어 | 설명 |
| :--- | :--- |
| `component` | `com.aspectran.daemon.command.builtins.ComponentCommand`<br/>Aspect, Translet, Job 등 컴포넌트의 상세 정보를 조회하거나 상태를 제어합니다. |
| `invokeAction` | `com.aspectran.daemon.command.builtins.InvokeActionCommand`<br/>지정된 Bean의 메소드를 직접 실행합니다. |
| `translet` | `com.aspectran.daemon.command.builtins.TransletCommand`<br/>등록된 Translet을 실행합니다. |
| `pollingInterval` | `com.aspectran.daemon.command.builtins.PollingIntervalCommand`<br/>파일 기반의 명령어 폴링 간격을 동적으로 변경합니다. |
| `sysinfo` | `com.aspectran.daemon.command.builtins.SysInfoCommand`<br/>JVM 시스템 정보를 출력합니다. |
| `restart` | `com.aspectran.daemon.command.builtins.RestartCommand`<br/>데몬 서비스를 재시작합니다. |
| `quit` | `com.aspectran.daemon.command.builtins.QuitCommand`<br/>데몬을 종료합니다. |
| `jetty` | `com.aspectran.jetty.daemon.command.JettyCommand`<br/>내장된 Jetty 서버를 제어합니다. |
| `undertow` | `com.aspectran.undertow.daemon.command.UndertowCommand`<br/>내장된 Undertow 서버를 제어합니다. |

---

## 6. 웹 애플리케이션 설정 (`web`)

Aspectran을 웹 애플리케이션으로 실행할 때의 환경을 정의합니다.

- **`uriDecoding`**: URI 디코딩에 사용할 문자 인코딩을 지정합니다.
- **`defaultServletName`**: 정적 리소스 등을 처리할 기본 서블릿의 이름을 지정합니다. `none`으로 설정하면 Aspectran이 처리하지 못한 요청을 기본 서블릿으로 넘기지 않습니다.
- **`trailingSlashRedirect`**: URI 끝에 슬래시(`/`)가 없을 때 자동으로 슬래시를 붙여 리디렉션할지 여부를 설정합니다.
- **`legacyHeadHandling`**: 레거시 시스템과의 호환성을 위해 HEAD 요청을 GET 요청처럼 처리할지 여부를 설정합니다.
- **`acceptable`**: 웹 환경에서 허용(`+`)하거나 거부(`-`)할 Translet 요청 URL 패턴을 정의합니다. `/**`는 모든 요청을 의미합니다.

---

## 7. 전체 설정 예제

다음은 위에서 설명한 모든 섹션을 포함하는 `aspectran-config.apon` 파일의 전체 예제입니다.

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
        |{{WHITE,bold}}     ___                         __
        |{{CYAN      }}    /   |  ___  ____  ___  ___  / /____   ___  ____
        |{{GREEN     }}   / /| | / __|/ __ |/ _ |/ __|/ __/ __|/ __ |/ __ |
        |{{YELLOW    }}  / ___ |(__  ) /_/ /  __/ /  / / / /  / /_/ / / / /
        |{{RED       }} /_/  |_|____/ .___/|___/|___/|__/_/   |__(_(_/ /_/   {{WHITE,bold}}ASPECTOW-DEMO
        |{{gray      }}=========== /_/ ====================================================
        |{{MAGENTA   }}:: Built with Aspectran :: {{reset}}#{class:com.aspectran.core.AboutMe^version}
        |
        |{{gray}}To see a list of all built-in commands, type {{GREEN,bold}}help{{gray}}.
        |{{gray}}To get help for a specific command, type {{GREEN,bold}}command_name -h{{gray}}.
        |{{gray}}To list all available translets, type {{CYAN,bold}}translet -l{{gray}}.
        |{{gray}}To run a translet, type {{CYAN,bold}}translet <translet_name>{{gray}} or just {{CYAN,bold}}translet_name{{gray}}.
        |{{reset}}
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