---
title: Aspectran Shell 소개
subheadline: 핵심 가이드
---

## 1. Aspectran Shell이란 무엇인가?

Aspectran Shell은 Aspectran 애플리케이션을 실시간으로 개발, 테스트, 운영 및 관리하기 위한 강력한 **대화형 명령줄 인터페이스(Interactive Command-Line Interface, REPL)**입니다. 이는 단순히 몇 가지 정적 유틸리티 명령어를 실행하는 쉘 도구를 넘어, 실행 중인 Aspectran 애플리케이션 컨텍스트(ActivityContext)의 내부 컴포넌트, 비즈니스 로직(Translet), 빈(Bean), AOP 어드바이스 및 세션 상태와 직접 상호작용할 수 있는 완전한 독립 실행형 콘솔 플랫폼입니다.

Aspectran Shell은 실행 환경에 따라 경량 표준 콘솔(Plain Shell)과 JLine 3 기반의 리치 콘솔(Rich Shell) 두 가지 모드를 모두 지원합니다. 명령어 히스토리 탐색, 탭(Tab) 자동 완성, ANSI 컬러/스타일 텍스트 렌더링, 출력 리다이렉션(`>`, `>>`) 등 현대적인 터미널 사용자 경험을 제공하여, 복잡한 웹 UI나 외부 테스트 도구 없이도 터미널 환경에서 백엔드 로직을 직접 구동하고 모니터링할 수 있습니다.

[![asciicast](https://asciinema.org/a/1264203.png)](https://asciinema.org/a/1264203)

## 2. 핵심 설계 철학 및 특징

### 통일된 Activity 실행 모델 (Unified Activity Architecture)
Aspectran의 가장 독보적인 설계 사상은 **서블릿 기반 웹 환경(`ServletWebActivity`), 고성능 비동기 웹 환경(`NettyActivity`), 독립 데몬 환경(`DaemonActivity`), 그리고 CLI 쉘 환경(`ShellActivity`)의 실행 모델이 완전히 동일하다는 점**입니다.
* 사용자가 쉘 프롬프트에서 명령어를 입력하면 `ShellActivity`가 생성되며, 이는 웹 요청 처리와 동일하게 Aspectran의 트랜잭션 및 액션 실행 파이프라인을 거칩니다.
* 동일한 Translet 정의를 웹 브라우저(`GET /login`), 백그라운드 스케줄러(Job), 쉘 명령어(`aspectran-demo> login`)에서 코드 한 줄 수정 없이 그대로 재사용할 수 있습니다.

### 지능적인 대화형 파라미터 처리 (Interactive Parameter Prompting)
명령어 실행에 필요한 파라미터가 누락되었거나 동적 플레이스홀더를 포함하고 있을 때, `TransletPreProcedure`를 통해 사용자에게 즉각 대화형 프롬프트(Interactive Prompt)를 띄워 값을 입력받습니다.
* CLI 옵션 형태(`--id=admin --domain=aspectran.com`)로 즉시 전달할 수 있습니다.
* Translet 정의에 `mandatory="true"`로 지정된 필수 파라미터나 `${placeholder}` 형태의 미확정 값이 있으면 콘솔에서 실시간으로 입력을 요청합니다.
* 비밀번호와 같은 민감한 정보는 `secret="true"` 속성을 통해 콘솔 입력 시 마스킹(Masking, `****`) 처리가 지원됩니다.

### AOP와 세션이 완벽하게 지원되는 콘솔 환경
단순한 1회성 스크립트 실행기와 달리, Aspectran Shell은 상태를 유지하는 세션(Session)과 AOP 프록시 메커니즘을 지원합니다.
* **상태 유지 세션(Stateful Session)**: CLI 접속 세션 동안 사용자 인증 상태 및 세션 스코프 빈(Session Scope Bean)이 유지되며, 설정에 따라 파일 저장소(`fileStore`) 등에 세션 정보를 안전하게 보관할 수 있습니다.
* **AOP 적용**: 쉘에서 실행되는 명령어 호출 전/후에 Advice를 적용하여 실행 시간 측정, 파라미터 감사 로그(Audit Log), 접근 권한 검증 등을 유기적으로 수행합니다.

### 즉각적인 피드백과 AsEL 표현식 평가
* **실시간 결과 변환(Transform)**: Translet 실행 결과는 Plain Text, JSON, APON, 토큰 템플릿 등을 통해 즉시 포맷팅되어 콘솔에 렌더링됩니다.
* **AsEL(Aspectran Expression Language) 평가**: `evaluate` 명령어를 통해 실행 중인 컨텍스트 내의 Bean 메서드를 직접 호출하거나 시스템 프로퍼티, 프로필 상태를 실시간으로 조회/검증할 수 있습니다.

### 내장 서버 및 컴포넌트 실시간 제어
Shell 내부에서 독립 프로세스로 구동되는 내장 Undertow, Jetty, Netty 웹 서버를 시작, 중지, 상태 점검하거나, 등록된 스케줄링 작업(Job)을 실시간으로 트리거하고 비활성화/활성화할 수 있습니다.

## 3. Plain Shell vs Rich (JLine) Shell

Aspectran Shell은 실행 환경 및 목적에 따라 두 가지 런처 모드를 제공합니다.

| 구분 | Plain Shell (`AspectranShell`) | Rich Shell (`JLineAspectranShell`) |
| :--- | :--- | :--- |
| **모듈** | `aspectran-shell` | `aspectran-shell-jline` |
| **콘솔 구현체** | `DefaultShellConsole` (표준 입출력) | `JLineShellConsole` (JLine 3 기반) |
| **스타일러** | `DefaultConsoleStyler` | `JLineConsoleStyler`, `JLineTextStyler` |
| **자동 완성 (Tab)** | 미지원 | 지원 (명령어, 옵션, 서브커맨드, 파일 경로) |
| **명령어 히스토리** | 단순 메모리 | 화살표 키 내비게이션 및 파일 영속화 |
| **터미널 제어** | 기본 콘솔 I/O | ANSI 색상 스타일, 커서 제어, 라인 편집 |
| **적합한 환경** | CI/CD 파이프라인, 비대화형 자동화 배치, 경량 컨테이너 | 로컬 개발 환경(IDE), 대화형 운영 터미널 |

## 4. 아키텍처 및 내부 동작 구조

Aspectran Shell은 서비스 계층(`ShellService`), 명령어 실행 계층(`ShellCommander`), 콘솔 입출력 계층(`ShellConsole`), 그리고 실행 단위인 `ShellActivity`로 유기적으로 결합되어 있습니다.

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

### 주요 구성 컴포넌트
* **`ShellService` (`DefaultShellService`)**: Shell의 전체 라이프사이클(초기화, 시작, 일시중지, 재시작, 종료)을 관리하는 최상위 서비스 컴포넌트입니다.
* **`ShellConsole` (`DefaultShellConsole` / `JLineShellConsole`)**: 터미널과의 모든 입출력을 추상화한 인터페이스로, 입력 스트림 제어와 ANSI 마크업 렌더링을 처리합니다.
* **`ShellCommander` (`DefaultShellCommander` / `JLineShellCommander`)**: 사용자 입력을 파싱하여 등록된 내장 명령어(`Command`) 또는 Translet으로 디스패치합니다.
* **`ShellActivity`**: 쉘 명령어 1회 실행 단위의 실행 컨텍스트입니다.
  * `ShellRequestAdapter`: CLI 인자 및 대화형 입력을 Translet 파라미터 및 속성(Attribute)으로 변환하여 제공합니다.
  * `ShellResponseAdapter`: Translet 실행 결과를 콘솔 화면 또는 리다이렉션 대상 파일로 전송하는 Writer를 관리합니다.
  * `ShellSessionAdapter`: 쉘 사용자 세션과 Aspectran 세션 매니저를 연결합니다.

## 5. 콘솔 텍스트 스타일링 및 ANSI 컬러 시스템

Aspectran Shell(특히 `aspectran-shell-jline`)은 `JLineConsoleStyler`와 `JLineTextStyler`를 통해 풍부하고 직관적인 콘솔 텍스트 스타일링 마크업을 지원합니다.

### 1) 스타일 마크업 구문
{% raw %}텍스트 내에 `{{style1,style2,...}}` 형태로 스타일 태그를 삽입하고, 필요 시 `{{reset}}` 태그로 초기화합니다.{% endraw %}

```text
{% raw %}This is {{bold,red}}important{{reset}} text.
Welcome to {{bold,CYAN}}Aspectran Shell{{reset}}!{% endraw %}
```

### 2) 지원하는 텍스트 속성 (Text Attributes)

| 속성 키워드 | 설명 | 속성 해제 키워드 |
| :--- | :--- | :--- |
| `bold` | 텍스트를 굵게 표시 | `bold:off` |
| `faint` | 텍스트를 흐리게(낮은 강도) 표시 | `bold:off` |
| `italic` | 이탤릭(기울임꼴) 적용 | `italic:off` |
| `underline` | 밑줄 적용 | `underline:off` |
| `blink` | 텍스트 깜빡임 효과 | `blink:off` |
| `inverse` | 전경색(글자색)과 배경색을 반전 | `inverse:off` |
| `conceal` | 텍스트 숨김 | `conceal:off` |
| `crossedOut` | 취소선 적용 | `crossedOut:off` |

### 3) 색상 지정 방식 (Colors)
글자색(전경색)은 색상명 또는 `fg:` 접두사를 사용하며, 배경색은 `bg:` 접두사를 사용합니다.
{% raw %}
* **표준 및 밝은 명명 색상 (Named Colors)**
  * 표준 색상 (소문자): `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`, `gray`
  * 밝은 색상 (대문자): `RED`, `GREEN`, `YELLOW`, `BLUE`, `MAGENTA`, `CYAN`, `WHITE`, `GRAY`
* **256 색상 팔레트 (256-Color Palette)**
  * 0부터 255까지의 숫자 코드 지정
  * 전경색: `{{208}}` 또는 `{{fg:208}}`
  * 배경색: `{{bg:208}}`
* **24비트 TrueColor RGB 색상 (Hex RGB)**
  * 6자리 16진수 코드 지정 (앞의 `#` 제외)
  * 전경색: `{{ff8800}}` 또는 `{{fg:ff8800}}`
  * 배경색: `{{bg:ffffff}}`
{% endraw %}
### 4) 스타일 초기화 (Resetting)
* `reset`: 적용된 모든 속성 및 색상을 터미널 기본값으로 복원
* `fg:off`: 전경색만 기본값으로 복원 (굵기 및 배경색 유지)
* `bg:off`: 배경색만 기본값으로 복원

### 5) 시맨틱 스타일(Semantic Style) 설정 및 캐싱
`aspectran-config.apon`의 `shell.style`에 정의된 의미론적 스타일(`primary`, `secondary`, `success`, `danger`, `warning`, `info`)은 `JLineConsoleStyler`에 의해 JLine의 `AttributedStyle` 객체로 변환 및 캐싱되어 고성능으로 렌더링됩니다.

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

## 6. JLine 탭(Tab) 자동 완성 (Auto-Completion)

Rich Shell(`JLineAspectranShell`) 환경에서는 JLine 3의 고성능 `Completer` 파이프라인이 내장되어 터미널 생산성을 극대화합니다.

* **명령어 자동 완성**: 프롬프트에서 `Tab` 키를 누르면 사용 가능한 모든 내장 명령어와 공개된 Translet 이름이 후보 목록으로 나타나며 자동 완성됩니다.
* **명령어 옵션 완성**: `-` 또는 `--`를 입력하고 `Tab`을 누르면 해당 명령어가 지원하는 모든 옵션 플래그(예: `-l`, `--list`, `-d`, `--detail`)를 추천합니다.
* **서브커맨드(Subcommand) 완성**: `netty`, `undertow`, `jetty` 뒤에서 `Tab`을 누르면 `start`, `stop`, `restart`, `status` 서브커맨드를 자동으로 제안합니다.
* **파일시스템 경로 완성**: 출력 리다이렉션(`>`, `>>`)을 입력한 후 `Tab`을 누르면 대상 파일 및 디렉토리 경로가 자동으로 완성됩니다.

## 7. 내장 명령어 (Built-in Commands)

Aspectran Shell은 시스템 점검, 리소스 제어 및 관리를 위해 다양한 내장 명령어를 제공합니다.

| 명령어 | 설명 | 주요 옵션 및 사용 예시 |
| :--- | :--- | :--- |
| `help` | 사용 가능한 전체 명령어 목록 및 상세 도움말을 표시합니다. | `help`, `translet -h` |
| `translet` | 등록된 Translet을 조회하고 실행하거나 세부 정의를 확인합니다. | `translet -l` (목록), `translet -la` (전체 목록), `translet -d <name>` (상세), `translet <name>` |
| `aspect` | 등록된 Aspect(AOP) 목록을 확인하고 동적으로 활성화/비활성화합니다. | `aspect -l`, `aspect -d <id>`, `aspect -enable <id>`, `aspect -disable <id>` |
| `job` | 스케줄러에 등록된 작업(Job) 목록을 조회하고 일시정지/재개합니다. | `job -l`, `job -d <job_name>`, `job -pause <job_name>`, `job -resume <job_name>` |
| `netty` | 내장 Netty 서버를 시작, 중지, 상태 점검 및 재시작합니다. | `netty start`, `netty stop`, `netty status`, `netty restart` |
| `undertow` | 내장 Undertow 서버를 시작, 중지, 상태 점검 및 재시작합니다. | `undertow start`, `undertow stop`, `undertow status` |
| `jetty` | 내장 Jetty 서버를 시작, 중지, 상태 점검 및 재시작합니다. | `jetty start`, `jetty stop`, `jetty status` |
| `sysinfo` | JVM 버전, 메모리 사용량, OS 환경 및 시스템 프로퍼티를 출력합니다. | `sysinfo`, `sysinfo -props` |
| `echo` | 입력한 문자열을 콘솔에 출력합니다. (스타일 마크업 테스트 등에 유용) | `echo Hello {{GREEN}}Aspectran{{reset}}` |
| `evaluate` | AsEL(Aspectran Expression Language) 표현식을 실시간으로 평가합니다. | `evaluate "#{class:com.aspectran.core.AboutMe^version}"` |
| `history` | 세션 동안 입력된 명령어 히스토리 목록을 출력합니다. | `history` |
| `clear` | 현재 터미널 콘솔 화면을 깨끗하게 지웁니다. | `clear` |
| `verbose` | Translet 실행 전 상세 설명(Description) 출력 모드를 켜거나 끕니다. | `verbose` |
| `restart` | Aspectran 컨텍스트와 리소스를 핫 리로드하여 재시작합니다. | `restart` |
| `quit` | 쉘 콘솔을 안전하게 종료합니다. | `quit`, `quit -f` (확인 없이 즉시 종료) |
| `encrypt` / `decrypt` | PBE(Password-Based Encryption) 기반 문자열 암호화 및 복호화를 수행합니다. | `encrypt <text>`, `decrypt <encrypted_text>` |

## 8. Translet 실행 및 대화형 파라미터 활용

### 1) 기본 Translet 실행
쉘에 등록된 Translet은 `translet <name>` 형식뿐만 아니라 명령어 이름 그대로 단축 호출할 수 있습니다.

```bash
aspectran-demo> hello
Executes the method helloActivity.helloWorld() and prints the
returned value to the console.
Hello, World!
```

### 2) 커맨드라인 옵션을 통한 파라미터 전달
`--<param_name>=<value>` 구문을 사용하여 Translet에 파라미터를 직접 전달할 수 있습니다.

```bash
aspectran-demo> login --id=admin --domain=aspectran.com --password=secret
-------------------------------------------------------------------------
You have entered the following parameters for login:
   email: admin@aspectran.com
   password: secret
-------------------------------------------------------------------------
```

### 3) 대화형 프롬프팅 및 마스킹 입력 (Interactive Prompting & Masking)
Translet 정의에 필수 파라미터(`mandatory="true"`)나 템플릿 변수가 정의되어 있는 경우, 옵션을 생략하고 실행하면 Shell이 자동으로 대화형 입력 모드로 전환되며, `secret="true"` 속성이 지정된 경우 비밀번호 마스킹을 수행합니다.

**Translet 정의 예시 (`login.xml`):**
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

**대화형 실행 과정:**
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

### 4) 출력 리다이렉션 (Output Redirection)
명령어나 Translet의 실행 결과를 콘솔 화면 대신 파일로 바로 저장할 수 있습니다.
* `>`: 파일 새로 쓰기 (덮어쓰기)
* `>>`: 파일 끝에 추가하기 (이어쓰기)

```bash
aspectran-demo> sysinfo > sysinfo.txt
aspectran-demo> login --id=admin --domain=aspectran.com >> login_history.log
```

## 9. 비동기 Translet (`async="true"`) 실행 메커니즘

대용량 데이터 집계, 외부 API 호출, 배치 처리 등 처리 시간이 오래 소요되는 로직은 Translet에 `async="true"` 속성을 부여하여 비동기로 처리할 수 있습니다.

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

* **동작 원리**: 쉘에서 `async1`을 실행하면 Shell 메인 스레드를 블로킹하지 않고 Aspectran 백그라운드 Executor 스레드 풀에 작업을 디스패치합니다.
* **콘솔 출력**: 비동기 작업이 완료되면 결과 스트림이 `ShellResponseAdapter`를 통해 콘솔 화면에 즉시 렌더링됩니다.

## 10. 세션 기반 상태 유지(Stateful Session) 실전 시나리오

Aspectran Shell은 접속된 세션 동안 `ShellSessionAdapter`를 통해 사용자의 인증 상태와 세션 스코프 빈(Session Scope Bean)을 완벽히 유지합니다.

```
[사용자 셸 접속] ---> [ShellSession 생성 (Session ID 부여)]
                           |
                           v
           aspectran-demo> login (성공)
           ==> Session에 인증 정보 및 계정 프로필 바인딩
                           |
                           v
           aspectran-demo> my-profile / execute-job
           ==> 세션 속성(Attribute) 자동 주입 및 권한 통과
                           |
                           v
           [세션 만료 또는 셸 종료 시 FileStore에 안전하게 영속화]
```

* **세션 속성 공유**: 로그인 후 바인딩된 세션 값과 세션 스코프 빈은 다른 Translet이나 토큰 표현식(예: `#{userSession^userId}`, `@{userProfile}`)에서 즉시 참조할 수 있습니다.
* **세션 영속화 (`fileStore`)**: `aspectran-config.apon`의 `session.fileStore` 설정을 통해 쉘을 재시작하더라도 작업 세션 데이터를 디스크에 보존할 수 있습니다.

## 11. Translet 노출 및 접근 제어 (`acceptable` 규칙)

하나의 Aspectran 애플리케이션 안에는 웹 전용, 데몬 전용, 쉘 전용 Translet이 공존할 수 있습니다. `aspectran-config.apon`의 `shell.acceptable` 규칙을 사용하여 쉘에 노출할 Translet을 정밀하게 제어합니다.

```apon
shell: {
    # 모든 Translet을 기본적으로 비노출(-)한 후, 특정 패턴만 선택적 노출(+)
    acceptable: {
        -: /**
        +: /admin/**
        +: hello*
        +: echo*
        +: login
    }
}
```

* **`translet -l` (List)**: `acceptable` 규칙에 의해 노출이 허용된 공개 Translet 목록만 표시합니다.
* **`translet -la` (List All)**: 비노출 처리된 내부 Translet까지 포함하여 시스템에 등록된 전체 Translet 목록을 조회합니다. (상세 조회 시 `translet -d` vs `translet -da`)

## 12. 콘솔 뷰 변환(Transform) 및 템플릿 포맷팅 팁

쉘 환경에서는 웹의 HTML 대신 텍스트 기반 템플릿 엔진을 활용하여 가독성 높은 텍스트 UI(TUI)를 생성합니다.

* **`format="text"` + `style="apon"` (권장)**: APON의 파이프(`|`) 라인 구문을 결합하여 코드 들여쓰기와 콘솔 출력 레이아웃을 정확하게 일치시킵니다.
* **토큰 치환 (`engine="token"`)**:
  * `${parameterName}`: 현재 요청의 파라미터 값 참조
  * `@{attributeName}`: 현재 요청/Activity 컨텍스트의 속성(Attribute) 및 액션(Action) 실행 결과 참조
  * `#{beanId^propertyName}`: Bean 객체 참조 및 프로퍼티/메서드 접근
  * `%{propertyName}`: 시스템 및 애플리케이션 환경 프로퍼티 참조
  * `~{templateId}`: 지정된 ID의 템플릿 렌더링 결과 포함
* **ANSI 스타일 태그 결합**: `{{CYAN}}`, `{{bold}}`, `{{reset}}` 등의 스타일 태그를 템플릿 내에 자연스럽게 배치하여 가시성 높은 표나 상태 박스를 렌더링합니다.

## 13. 커스텀 명령어(Custom Command) 구현 및 등록

개발자는 내장 명령어 외에 애플리케이션 고유의 CLI 명령어를 손쉽게 작성하여 등록할 수 있습니다.

### 커스텀 Command 클래스 작성
`AbstractCommand`를 상속받아 명령어 이름, 설명, 옵션(`Options`)을 정의하고 실행 로직(`execute`)을 구현합니다.

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

        // 옵션 정의
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

### `aspectran-config.apon`에 등록
작성한 Command 클래스를 `shell.commands` 배열에 추가합니다.

```apon
shell: {
    commands: [
        com.aspectran.demo.shell.CustomGreetingCommand
        # ... 기타 내장 명령어 ...
    ]
}
```

## 14. 설정 가이드 (`aspectran-config.apon`)

Aspectran 애플리케이션의 루트 설정 파일(`aspectran-config.apon`)에서 `shell` 섹션을 정의하여 쉘의 모든 동작 방식을 구성합니다.

```apon
{% raw %}shell: {
    # 텍스트 강조 및 메시지 레벨별 ANSI 컬러 스타일 정의
    style: {
        primary: GRAY
        secondary: green
        success: cyan
        danger: red
        warning: YELLOW
        info: BLUE
    }

    # 쉘 시작 시 출력할 배너 및 안내 메시지
    greetings: (
        |{{CYAN}}:: Built with Aspectran :: {{RED}}#{class:com.aspectran.core.AboutMe^version}{{reset}}
        |
        |To see a list of all built-in commands, type {{GREEN}}help{{reset}}.
        |To list all available translets, type {{CYAN}}translet -l{{reset}}.
    )

    # 쉘 프롬프트 문자열 (ANSI 스타일 태그 지원)
    prompt: "{{green}}aspectran-demo>{{reset}} "

    # 쉘에서 사용할 명령어 클래스 목록 등록
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

    # 쉘 세션 관리자 설정 (세션 스코프 빈 및 상태 유지)
    session: {
        maxActiveSessions: 1
        maxIdleSeconds: 1800
        scavengingIntervalSeconds: 600
        fileStore: {
            storeDir: /work/_sessions/shell
        }
        enabled: true
    }

    # 명령어 히스토리 저장 파일 경로
    historyFile: /logs/history.log

    # 실행 전 Translet Description 출력 여부 기본값
    verbose: true

    # Translet 노출 및 접근 제어 패턴
    acceptable: {
        -: /**
        +: hello*
        +: echo*
        +: login
        +: chpw
    }
}{% endraw %}
```

## 15. 개발 환경(IDE)에서의 런처 구성

Aspectran Shell은 복잡한 배포 절차 없이 Java 표준 `main()` 메서드를 통해 IDE 내에서 즉시 실행하고 디버깅할 수 있습니다. `src/test/java`에 런처 클래스를 작성합니다.

### 1) Rich Shell 런처 (`DemoRichShell.java`)
JLine 3 기반의 자동 완성 및 고급 콘솔 제어 기능을 사용하는 런처입니다.

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

            // 디버그 로그를 콘솔에 출력하려면 logback-debug.xml 설정 활성화 (선택 사항)
            // System.setProperty("logback.configurationFile", new File(baseDir, "config/logging/logback-debug.xml").getCanonicalPath());

            // JLineAspectranShell 부트스트래핑
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

### 2) Plain Shell 런처 (`DemoPlainShell.java`)
표준 System.in/System.out 환경에서 동작하는 경량 런처입니다.

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

            // 기본 AspectranShell 부트스트래핑
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

### 3) IDE 환경에서의 디버깅 로그 활성화
IDE에서 실행할 때 빈(Bean) 생성 과정, Translet 디스패치, AOP 어드바이스 호출 등의 세부 디버그 로그를 콘솔에서 확인하려면 다음과 같은 방법을 사용할 수 있습니다.
* **자바 코드 설정**: `main()` 메서드 시작 부분에서 `logback.configurationFile` 프로퍼티를 `config/logging/logback-debug.xml` 경로로 지정합니다.
* **VM 옵션 전달**: IDE의 Run/Debug Configuration VM 옵션(VM Options)에 `-Dlogback.configurationFile=app/config/logging/logback-debug.xml`을 지정합니다.

## 16. 운영 환경 배포 및 실행 가이드

실제 서버(Linux, macOS, Windows) 배포 환경에서는 `app/bin` 경로의 실행 스크립트를 통해 Aspectran Shell을 구동합니다.

```
app/
├── bin/
│   ├── shell.sh          # Linux/macOS용 쉘 실행 스크립트
│   ├── shell.bat         # Windows용 쉘 실행 배치 파일
│   └── run.options       # JVM 옵션 및 시스템 프로퍼티 정의 파일
├── config/
│   ├── aspectran-config.apon
│   └── logging/
│       ├── logback.xml         # 기본 운영 로깅 설정
│       └── logback-debug.xml   # 디버그 모드 로깅 설정
└── lib/
```

### 1) 실행 스크립트 (`shell.sh` / `shell.bat`)
터미널에서 직접 실행하여 REPL 환경으로 진입합니다.

```bash
$ cd app/bin
$ ./shell.sh
```

### 2) 콘솔 디버깅 로그 출력 모드 (`--debug`)
쉘 기동 시 `--debug` 옵션을 전달하면 기본 `logback.xml` 대신 `config/logging/logback-debug.xml` 설정이 적용되어, 애플리케이션의 초기화 및 Translet 실행 과정의 상세 디버그 로그가 콘솔 화면에 실시간으로 함께 출력됩니다.

```bash
$ cd app/bin
$ ./shell.sh --debug
```

### 3) JVM 옵션 설정 (`run.options`)
힙 메모리 크기, 가비지 컬렉터 옵션, 기본 인코딩 설정 등을 관리합니다.

```text
-Xms256m
-Xmx1024m
-Dfile.encoding=UTF-8
```

## 17. 실무 활용 시나리오

### 1) 신속한 비즈니스 로직 테스트베드 (Rapid Dev Console)
웹 컨트롤러나 프론트엔드 화면이 개발되기 전이라도, 개발 중인 Service/DAO 및 Translet을 쉘에서 직접 호출하여 입력값과 반환 결과를 검증할 수 있습니다.

### 2) 엔터프라이즈 운영 및 Bastion 관리 콘솔 (Ops Bastion Console)
운영 서버의 SSH 접속 환경에서 관리자 전용 쉘로 구성할 수 있습니다.
* 데이터베이스 수동 패치, 특정 캐시 무효화, 정기 배치 작업의 수동 트리거 수행.
* AOP 감사(Audit) 어드바이스를 결합하여 운영자가 입력한 모든 명령과 파라미터, 실행 시각을 파일이나 DB에 기록.

### 3) 대화형 데이터 ETL 및 마이그레이션 도구 (Interactive Data Workbench)
데이터 변환 및 마이그레이션 작업 시, 대상 기간이나 처리 옵션을 쉘의 대화형 프롬프트(`TransletPreProcedure`)를 통해 단계별로 확인받으며 안전하게 데이터 파이프라인을 실행합니다.

### 4) 차세대 AI Agent / 로컬 코파일럿 런타임
Aspectran Shell의 세션 컨텍스트와 명확한 입출력 스키마를 갖춘 Translet 구조를 결합하여, 로컬 LLM 에이전트가 호출할 수 있는 Function Calling 실행 플랫폼으로 활용할 수 있습니다.

## 18. 관련 문서

* [Aspectran 사용자 가이드](https://aspectran.com/ko/docs/guides/aspectran-user-guide/)
* [Aspectran Translet 실용 가이드](https://aspectran.com/ko/docs/guides/practical-guide-to-translets/)
* [Aspectran AOP: 기능과 아키텍처](https://aspectran.com/ko/docs/guides/aspectran-aop/)
* [Aspectran 쉘 그리팅(Greetings) 설정 및 스타일링 가이드](https://aspectran.com/ko/docs/guides/practical-guide-to-shell-greetings/)
* [APON (Aspectran Parameters Object Notation) 소개](https://aspectran.com/ko/docs/guides/introduce-apon/)
* [Aspectran Daemon 소개](https://aspectran.com/ko/docs/guides/aspectran-daemon-introduction/)
