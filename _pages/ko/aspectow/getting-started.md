---
format: plate solid article
title: Aspectow 시작하기
teaser: 이 가이드를 통해 Aspectow 기반의 웹 애플리케이션을 실행하고 관리하는 방법을 알아볼 수 있습니다.
sidebar: toc
---

## 1. 준비물

*   **Java Development Kit (JDK) 21 이상**: Aspectow는 Java 21 이상 환경에서 동작합니다.
*   **Git**: 샘플 프로젝트를 클론하기 위해 필요합니다.
*   **Apache Maven**: 프로젝트를 빌드하고 실행하기 위해 필요합니다.

## 2. 샘플 프로젝트 클론

먼저, Aspectow ToDo 웹앱 샘플 프로젝트를 GitHub에서 클론합니다.

```bash
git clone https://github.com/aspectran/aspectow-todo-webapp.git
cd aspectow-todo-webapp
```

## 3. 프로젝트 실행

클론한 프로젝트 디렉토리로 이동하여 Maven 명령어로 애플리케이션을 빌드하고, 쉘 스크립트로 실행합니다.

- `mvn clean package`: 프로젝트를 빌드하여 `app/lib` 디렉터리에 라이브러리들을 생성합니다.
- `shell.sh` 또는 `shell.bat`: Aspectow 대화형 쉘을 시작합니다.

**Linux/macOS**
```bash
mvn clean package
./bin/shell.sh
```

**Windows**
```cmd
mvn clean package
bin\shell.bat
```

애플리케이션이 성공적으로 시작되면, 다음과 같은 그리팅 메시지와 함께 `aspectow` 프롬프트가 명령을 기다립니다.

> `aspectow-todo-webapp` 샘플 애플리케이션은 동시에 여러 인스턴스가 실행되는 것을 방지하는 기능이 기본적으로 활성화되어 있습니다. 만약 `shell.sh`를 실행했을 때 애플리케이션이 시작되지 않고 멈춘다면, 다른 터미널에서 이미 애플리케이션이 실행 중인지 확인해 보세요.

```
---------------------------------------------------------------------------------
 Aspectran : 9.2.2
 JVM       : OpenJDK 64-Bit Server VM (build 23.0.2+7, mixed mode, sharing)
 OS        : Mac OS X 26.0 aarch64
---------------------------------------------------------------------------------
... (생략) ...
DEBUG 2025-09-25 20:02:28.080 [demo] Initialized DefaultSessionManager@1e0a864d(shell) - c.a.c.c.AbstractComponent.initialize(65)

     ___                         __
    /   |  _________  ___  _____/ /_____ _      __
   / /| | / ___/ __ \/ _ \/ ___/ __/ __ \ | /| / /
  / ___ |(__  ) /_/ /  __/ /__/ /_/ /_/ / |/ |/ /
 /_/  |_/____/ .___/\___/\___/\__/\____/|__/|__/    Enterprise Edition
=========== /_/ ==========================================================
:: Built with Aspectran :: 9.2.2

To see a list of all built-in commands, type help.
To get help for a specific command, type command_name -h.
To list all available translets, type translet -l.
To run a translet, type translet <translet_name> or just translet_name.


Use the command 'undertow' to control the Undertow Server.
Since Undertow Server is running, have your web browser point to:
   http://localhost:8080/todos

Current profiles: [dev]

aspectow>
```

## 4. 결과 확인

그리팅 메시지의 안내 내용에 따라 웹 브라우저를 열고 다음 주소로 접속하여 ToDo 웹 애플리케이션을 확인합니다.

```
http://localhost:8080/todos
```

웹 브라우저에 ToDo 목록 관리 페이지가 나타나면 성공적으로 애플리케이션을 실행한 것입니다.

## 5. 애플리케이션 종료

`aspectow` 프롬프트에 `quit` 명령을 입력하면 애플리케이션을 종료할 수 있습니다.

```
aspectow> quit
Are you sure you want to quit [Y/n]?
```

## 6. 프로젝트 디렉토리 구조

Aspectow 애플리케이션의 주요 디렉토리 구조는 다음과 같습니다. 이 구조를 이해하면 설정 파일, 로그, 웹 콘텐츠 등이 어디에 위치하는지 파악하는 데 도움이 됩니다.

```
app
├── bin             # 실행 스크립트 (daemon.sh, shell.sh 등)
│   └── procrun     # Apache Commons Procrun 관련 스크립트와 설정 파일 (Windows 환경)
├── cmd             # 명령 파일 처리 디렉토리. 파일 기반 명령 실행을 위해 사용됩니다.
│   ├── incoming    # 외부에서 전달된 명령 파일이 위치하는 디렉토리
│   ├── queued      # 실행 대기 중인 명령 파일이 이동되는 디렉토리
│   ├── completed   # 성공적으로 실행 완료된 명령 파일이 보관되는 디렉토리
│   ├── failed      # 실행 중 오류가 발생한 명령 파일이 보관되는 디렉토리
│   └── sample      # 샘플 명령 파일
├── config          # 애플리케이션 설정 파일 (aspectran-config.apon, root-context.xml 등)
│   ├── appmon      # AppMon 관련 설정
│   ├── logging     # 로깅 설정 (logback.xml 등)
│   ├── mail        # 메일 관련 설정
│   └── server      # 서버 설정 (server.xml, undertow 설정 등)
├── lib             # Maven 빌드 시 외부 JAR 파일이 복사되는 디렉토리
│   └── ext         # 애플리케이션 라이브러리
├── logs            # 애플리케이션 로그 파일
├── temp            # 임시 파일 저장소
├── webapps         # 웹 애플리케이션 배포 디렉토리 (root, appmon, manager 등)
│   ├── appmon      # AppMon 웹 애플리케이션
│   └── root        # 기본 웹 애플리케이션
└── work            # 웹 애플리케이션 작업 디렉토리 (세션, 컴파일된 JSP 등)
```

## 7. Aspectran 주요 설정 파일

`aspectow-todo-webapp` 프로젝트에서 Aspectran 애플리케이션의 동작을 제어하는 주요 설정 파일들은 다음과 같습니다.

*   **`app/config/aspectran-config.apon`**: Aspectran 컨텍스트의 전반적인 동작을 정의하며, 컴포넌트 스캔 경로 등을 지정합니다.
*   **`app/config/root-context.xml`**: 애플리케이션의 핵심 컨텍스트 설정을 포함하며, 웹 요청 처리와 관련된 Translet, Bean 정의, 뷰 설정 등을 담당합니다.
*   **`app/config/server/server.xml`**: Undertow 웹 서버의 포트, 컨텍스트 경로, 서블릿 필터 등을 설정하는 데 사용되는 다른 XML 파일들을 포함합니다.

각 설정 파일에 대한 더 자세한 내용은 [Aspectran 설정 문서](/ko/docs/guides/aspectran-configuration/)를 참조하세요.

## 8. Translet을 통한 요청 처리 흐름

Aspectran의 핵심 개념인 Translet, Activity, Action은 웹 요청이 들어왔을 때 이를 처리하는 주요 구성 요소입니다.

*   **Translet**: 웹 요청(URL)과 매핑되어 어떤 작업을 수행할지 정의하는 **처리 규칙의 설계도**입니다.
*   **Activity**: Translet에 정의된 규칙에 따라 실제 작업을 수행하는 **요청 처리의 주체**입니다.
*   **Action**: Activity 내에서 실행되는 **개별적인 작업 단위**입니다. 예를 들어, 데이터베이스에서 데이터를 조회하거나 비즈니스 로직을 실행하는 등의 역할을 합니다.

간단히 말해, 웹 요청이 들어오면 Translet이 해당 요청을 받아 Activity를 실행하고, Activity는 Action을 통해 필요한 작업을 처리한 후 결과를 사용자에게 응답합니다.

각 개념에 대한 더 자세한 내용은 [Translet 문서](/ko/docs/guides/aspectran-translet/) 및 [Action 문서](/ko/docs/architecture/aspectran-actions/)를 참조하시기 바랍니다.

## 9. 개발 환경에서 직접 실행 및 디버깅

로컬 개발 환경에서 `src/test/java` 디렉토리는 단순히 단위 테스트나 통합 테스트를 위한 공간을 넘어, 개발 및 디버깅을 위해 직접 실행 가능한 클래스들을 포함할 수 있습니다. 이는 Aspectran 기반 개발의 유연성을 보여주는 중요한 특징입니다.

IDE(예: IntelliJ IDEA, Eclipse)를 사용하는 경우, 특정 클래스(예: `aspectow-todo-webapp\src\test\java\app\ToDoDemo.java`)를 직접 실행하여 빠르게 특정 기능의 동작을 확인하거나, 디버깅 포인트를 설정하여 코드의 흐름을 추적할 수 있습니다. 특히 `aspectow-todo-webapp\src\test\java\app\ToDoDemo.java`와 같은 클래스를 실행하고 디버깅하는 것은, 웹 요청이 들어왔을 때 어떤 서비스 빈이 호출되고 데이터가 어떻게 처리되는지 직접 확인하는 데 매우 유용합니다. 이를 통해 Translet이 서비스 계층과 어떻게 연동되는지 명확하게 이해할 수 있습니다. 또한, IDE 외부에서 `java` 명령어를 통해 직접 실행하고 원격 디버깅을 연결하는 것도 가능합니다.

이러한 방식은 전체 애플리케이션을 빌드하고 배포하는 과정 없이, 개발 중인 특정 모듈이나 기능에 대한 즉각적인 피드백을 얻고 문제를 해결하는 데 매우 효과적입니다.

## 10. 개발 팁 및 모범 사례

`aspectow-todo-webapp`과 같은 Aspectran 웹 애플리케이션을 개발할 때 다음 팁과 모범 사례를 참고하면 좋습니다.

### 1. 로깅 설정

애플리케이션의 디버깅 로그를 효과적으로 확인하려면 로깅 설정을 적절히 조정해야 합니다.

*   **`logback-test.xml`**: `src/test/resources/logback-test.xml` 파일에서 `<logger name="com.example.todo" level="debug"/>`와 같이 해당 앱의 패키지 경로로 로거 이름을 수정하면 디버깅 로그를 제대로 확인할 수 있습니다.
*   **`logback.xml` 및 `logback-debug.xml`**: 이 파일들에서도 앱의 패키지 경로를 수정하여 로깅 설정을 최적화할 수 있습니다.

## 11. 다음 단계

*   **코드 탐색**: 클론한 프로젝트의 코드를 살펴보며 Aspectran의 구조와 동작 방식을 이해해 보세요.
*   **핵심 개념 학습**: [Aspectow 아키텍처](/ko/aspectow/architecture/)를 읽고 Aspectran 프레임워크와 Aspectow WAS의 주요 특징을 더 깊이 알아보세요.
*   **나만의 애플리케이션 개발**: Aspectow [스타터 프로젝트](/ko/projects/)를 기반으로 자신만의 애플리케이션 개발을 시작해 보세요.
