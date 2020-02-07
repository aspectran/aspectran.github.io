---
layout: page
format: "plate article"
sidebar: toc
title: "User Guide"
subheadline: "User Guides"
teaser: "Aspectran Reference Documentation"
---

소개 (Introduction)
===================

Aspectran은 간결하고 사용하기 쉬운 Java 어플리케이션 프레임워크입니다. 널리 사용되는 Java 어플리케이션 프레임워크들은 성숙함에 따라 더 많은 기능을 보유하며 점점 더 복잡해지고 있습니다. 우리는 프레임워크가 제공하는 많은 기능 중 일부만 사용할 수도 있고, 아니면 원하는 기능이 없거나 불편한 사용성으로 인해 기능을 추가 또는 보완하는 경우도 있습니다. 우리가 사용한 프레임워크 중에 대표적인 것은 바로 Spring Framework일 것 입니다. Aspectran은 Spring Framework의 주요 기능 중 일부를 다른 시각으로 새롭게 구현한 단일 구조의 차세대 프레임워크입니다. 

주요 특징 (Key features)
------------------------

Aspectran은 다음과 같은 핵심 기능으로 구성됩니다.

* 동일한 구성 설정으로 여러 실행 환경 지원  
  웹 및 CLI 기반 어플리케이션과 같은 다른 실행 환경에서 동일한 구성 설정을 공유 할 수 있습니다.
* POJO (Plain Old Java Object) 프로그래밍 모델 지원  
  특정 클래스를 상속하고 기능을 확장하는 대신 실제로 필요한 기능을 구현하는 데 집중할 수 있습니다. 결과 값은 가장 간단한 Java 오브젝트로 리턴 될 수 있습니다.
* IoC (Inversion of Control) 지원  
  프레임 워크는 전체 플로우를 제어하고 개발자가 작성한 모듈의 기능을 호출합니다. 개발자가 비즈니스 로직에 집중할 수 있도록 객체 생성 및 라이프 사이클 관리 기능을 제공합니다.
* 지원 의존성 주입 (DI)  
  프레임 워크는 런타임에 서로 의존하는 모듈을 연결합니다. 모듈 간의 낮은 결합을 유지하고 코드 재사용 성을 높일 수 있습니다.
* Aspect-Oriented Programming (AOP) 지원  
  핵심 기능과 추가 기능을 분리하여 코드를 작성할 수 있습니다. 핵심 기능 구현이 완료되면 트랜잭션, 로깅, 보안 및 예외 처리와 같은 기능을 핵심 기능과 결합 할 수 있습니다.
* RESTful 웹 서비스 구축 지원  
  Aspectran은 RESTful Web Services를 구현하는 데 적합하도록 설계되었다.

Aspectran은 위의 핵심 기능을 기반으로 웹 어플리케이션 서버 및 셸 어플리케이션을 쉽게 구축 할 수있는 환경을 제공합니다. 또한 신속한 실행 및 배포가 가능합니다. Aspectran의 강력하고 간결한 구성 설정으로 POJO로 작성된 Java 코드는 테스트를 용이하게하고 다른 실행 환경에서 애플리케이션을 개발할 때 코드 재사용을 극대화합니다.

com.aspectran.core 패키지를 기반으로하는 다음 패키지는 다양한 실행 환경을 지원하기 위해 존재합니다.

* `com.aspectran.daemon`  
  Aspectran을 Unix 기반 또는 Windows 운영체제에서 백그라운드로 실행할 수 있는 어플리케이션 구축을 위한 패키지
* `com.aspectran.embed`  
  Java 어플리케이션에 Aspectran을 임베드하여 사용할 수있는 인터페이스를 제공합니다.
* `com.aspectran.shell`  
  명령 행에서 직접 Aspectran을 사용하거나 제어할 수있는 대화식 쉘을 제공합니다.
* `com.aspectran.shell-jline`  
  기능이 풍부한 JLine을 사용하여 대화식 쉘을 제공합니다.
* `com.aspectran.web`  
  서블릿 컨테이너 기반의 웹 어플리케이션을 작성하기 위한 전반적인 기능 제공
* `com.aspectran.jetty`  
  Embedded Jetty를 통합하기위한 애드온 패키지
* `com.aspectran.mybatis`  
  MyBatis 통합을위한 애드온 패키지


시작하기 (Getting Started)
==========================

요구 사항 (Requirements)
------------------------

Aspectran 기반의 어플리케이션을 개발하기 위해서는 다음 세 가지가 필요합니다.

* JDK (Java Development Kit), 버전 1.8 이상
* Maven (프로젝트 관리 도구), 버전 3.3 이상
* 인터넷 연결 (라이브러리 가져 오기)

빌드하기 (Building)
-------------------

다음과 같이 Git 저장소로부터 체크아웃하고, 빌드 스크립트를 실행하세요.

```shell
git clone git://github.com/aspectran/aspectran.git
cd aspectran
./build rebuild
```

데모 어플리케이션 실행하기
--------------------------

빌드에 성공 후에 다음 명령을 콘솔에서 실행하면 데모 어플리케이션을 실행할 수 있습니다.

```shell
./build demo
```

Maven dependencies
------------------

Aspectran의 모든 모듈을 포함하는 의존성 라이브러리 정의를 Maven 프로젝트에 추가할 수 있습니다.
```xml
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-all</artifactId>
  <version>6.0.2</version>
</dependency>
```

일반적으로는 필요한 모듈에 해당하는 의존성 라이브러리를 추가하는 것을 권장합니다.

다음은 백그라운드에서 실행되는 데몬 어플리케이션을 빌드하는데 사용될 수 있습니다.
```xml
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-daemon</artifactId>
  <version>6.0.2</version>
</dependency>
```

다음은 명령 라인 기반의 어플리케이션을 빌드하는데 사용될 수 있습니다.
```xml
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-shell</artifactId>
  <version>6.0.2</version>
</dependency>
```

다음은 편리한 기능을 가진 명령 라인 기반의 어플리케이션을 빌드하는데 사용될 수 있습니다. `JLine3`의 활용하여 편리한 콘솔 입력 기능을 제공합니다.
```xml
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-shell-jline</artifactId>
  <version>6.0.2</version>
</dependency>
```

Aspectran의 내장하는 다른 어플리케이션을 빌드하는데 사용할 수 있습니다.
Aspectran 기반으로 개발된 어플리케이션을 테스트할 때 주로 사용되고 있습니다.
```xml
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-embed</artifactId>
  <version>6.0.2</version>
</dependency>
```

다음은 외부 라이브러리를 연동하기 위한 것이며, 실제로 필요한 것만 추가하면 됩니다.

독립적인 웹 어플리케이션 서버를 빌드하는데 사용할 수 있습니다.
Aspectran은 현재 Jetty만 지원하고 있습니다.
```xml
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-with-jetty</artifactId>
  <version>6.0.2</version>
</dependency>
```

Java persistence framework로 `MyBatis 3`를 사용하고 있습니다.
향상된 데이터베이스 트랜잭션을 처리를 지원합니다.

```xml
<dependency>
  <groupId>com.aspectran</groupId>
  <artifactId>aspectran-with-mybatis</artifactId>
  <version>6.0.2</version>
</dependency>
```


Aspectran 기반의 독립 실행형 어플리케이션
=========================================

Aspectran을 기반으로 웹 어플리케이션 서버 또는 명령행 기반의 콘솔 어플리케이션을 쉽게 구축할 수 있습니다.

Aspectran은 다른 프레임워크 처럼 널리 사용되는 웹 컨테이너의 일부에 종속되어 구동될 수도 있으며, 자체적으로 두 종류의 어플리케이션 구동 방식을 제공합니다.

* Aspectran Shell: 콘솔 환경에서 사용자가 입력한 명령을 해석하고 처리한 결과를 출력하는 어플리케이션
* Aspectran Daemon: 백그라운드에서 작동하는 어플리케이션

위 두 종류의 어플리케이션은 일반적으로 다음과 같은 디렉토리 구조를 가지고 있습니다.

     └── app
         ├── bin
         │   ├── prorun
         │   │   ├── DemoService.exe
         │   │   ├── install.bat
         │   │   ├── prunsrv.exe
         │   │   ├── prunsrv_amd64.exe
         │   │   └── uninstall.bat
         │   ├── daemon.bat
         │   ├── daemon.sh
         │   ├── jsvc_daemon.sh
         │   ├── shell.bat
         │   └── shell.sh
         ├── config
         ├── inbound
         │   ├── completed
         │   ├── failed
         │   ├── queued
         │   └── sample
         ├── lib
         ├── logs
         ├── temp
         ├── webapps
         │   └── root
         │       ├── index.html
         │       ├── ...
         │       └── WEB-INF
         │           ├── jsp
         │           ├── lib
         │           └── web.xml
         └── work

이제부터 예제에 언급되는 어플리케이션은 Aspectran Demo 어플리케이션을 기준으로 합니다.


Aspectran Shell
---------------

모든 어플리케이션이 화려한 사용자 인터페이스를 필요로 하는 것은 아닙니다. 멋진 어플리케이션의 뒤에는 부수적인 역할을 담당하거나, 테스트를 하기 위한 목적의 간단한 대화형 어플리케이션이 필요할 수도 있습니다.

Aspectran을 기반으로 작성된 모든 소스 코드들은 Aspectran Shell 어플리케이션을 통하여 실행할 수 있습니다. 예를 들어 서블릿 컨테이너 내의 서블릿으로 전달되는 요청 URI를 쉘 명령을 통하여 요청할 수도 있습니다. Aspectran Shell 형식으로 개발된 어플리케이션을 Aspectran Daemon으로 전환하여 구동할 수 있는 명령 스크립트가 제공됩니다.

다음은 Aspectran Shell 어플리케이션을 구동하기 위한 명령입니다.
```shell
cd app/bin
./shell.sh
```

Windows 운영체제에서는 다음과 같이 실행할 수 있습니다.
```shell
cd app\bin
shell.bat
```

Aspectran Shell 어플리케이션이 구동되면 다음과 같은 초기 화면과 함께 `aspectran-demo>` 프롬프트를 볼 수 있습니다.
```

     ___                         __                      ____  __         ____
    /   |  ___  ____  ___  ___  / /____   ___  ____     / ___|/ /_  ___  / / /
   / /| | / __|/ __ |/ _ |/ __|/ __/ __|/ __ |/ __ |   (___  / __ |/ _ |/ / /
  / ___ |(__  ) /_/ /  __/ /  / / / /  / /_/ / / / /   ___/ / / / /  __/ / /
 /_/  |_|____/ .___/|___/|___/|__/_/   |__(_(_/ /_/   /____/_/ /_/|___/_/_/
=========== /_/ ==========================================================

Welcome To Aspectran Shell 6.0.2

If you want a list of all supported built-in commands, type 'help'.
To get help on a specific command, type 'command_name -h'.
If you want a list of all available translets, type 'translet -l'.
To run a translet, type 'translet <translet_name>' or 'translet_name'.

Commands that can run examples:
   hello      Prints "Hello, World!" in your console
   hello2     Prints "Hello, World!" in your console using ANSI color codes
   echo1      It accepts parameters and print as is
   --- for more examples, type 'translet -l' ---

The Jetty Server is currently running.
Use the command 'jetty' to control the Jetty Server.
When your Jetty Server is running, point your web browser to:
   http://localhost:8088/

aspectran-demo> 
```

초기 화면에 표시되는 환영 인사말과 프롬프트는 Aspectran 초기화 설정 파일 `app/config/aspectran-config.apon`에 기술되어 있으며, 현재 구동되고 있는 어플리케이션과 밀접한 내용은 최초 로딩되는 어플리케이션 설정 XML 파일 `/app/config/app-config.xml`의 `<description>` 요소에 추가적으로 기술하고 있습니다.

***aspectran-config.apon 파일에서 shell 설정 부분***
```{% raw %}
shell: {
    prompt: "{{green}}aspectran-demo>{{reset}} "
    commands: [
        com.aspectran.shell.command.builtins.JettyCommand
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
    greetings: (
        |
        |{{YELLOW}}     ___                         __                      ____  __         ____
        |{{YELLOW}}    /   |  ___  ____  ___  ___  / /____   ___  ____     / ___|/ /_  ___  / / /
        |{{GREEN }}   / /| | / __|/ __ |/ _ |/ __|/ __/ __|/ __ |/ __ |   (___  / __ |/ _ |/ / /
        |{{GREEN }}  / ___ |(__  ) /_/ /  __/ /  / / / /  / /_/ / / / /   ___/ / / / /  __/ / /
        |{{CYAN  }} /_/  |_|____/ .___/|___/|___/|__/_/   |__(_(_/ /_/   /____/_/ /_/|___/_/_/
        |{{CYAN  }}=========== /_/ ==========================================================
        |{{reset }}
        |{{RED   }}Welcome To Aspectran Shell #{class:com.aspectran.core.util.Aspectran^version}{{reset}}
        |
        |If you want a list of all supported built-in commands, type '{{GREEN}}help{{reset}}'.
        |To get help on a specific command, type '{{GREEN}}command_name -h{{reset}}'.
        |If you want a list of all available translets, type '{{GREEN}}translet -l{{reset}}'.
        |To run a translet, type '{{GREEN}}translet <translet_name>{{reset}}' or '{{GREEN}}translet_name{{reset}}'.
    )
    workingDir: /work
    historyFile: /logs/history.log
    verbose: true
    exposals: {
        -: /**
    }
}{% endraw %}
```

***app-config.xml 파일의 description 요소***
```xml{% raw %}
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran Configuration 6.0//EN"
        "https://aspectran.github.io/dtd/aspectran-6.dtd">
<aspectran>

    <description style="apon">
        |
        |{{bold}}Commands that can run examples:{{bold:off}}
        |   {{CYAN}}hello{{fg:reset}}      Prints "Hello, World!" in your console
        |   {{CYAN}}hello2{{fg:reset}}     Prints "Hello, World!" in your console using ANSI color codes
        |   {{CYAN}}echo1{{fg:reset}}      It accepts parameters and print as is
        |   --- for more examples, type '{{GREEN}}translet -l{{reset}}' ---
        |
        |{{bold}}The Jetty Server is currently running.{{bold:off}}
        |Use the command '{{GREEN}}jetty{{reset}}' to control the Jetty Server.
        |When your Jetty Server is running, point your web browser to:
        |   {{81}}http://localhost:8088/{{fg:reset}}
        |
    </description>
</aspectran>{% endraw %}
```

프롬프트에서 `help`명령을 입력 후 엔터키를 치면 이용가능한 명령을 기술하는 도움말이 출력됩니다.
```
aspectran-demo> help
Available commands:
   jetty      Use the command 'jetty' to control the Jetty server
   translet   Translet run, or you can find them
   aspect     Show registered aspects, or disable or enable them
   job        Show scheduled jobs, or disable or enable them
   encrypt    Encrypts the input string using the encryption password
   decrypt    Decrypts the input string using the encryption password
   sysinfo    Displays current JVM runtime information
   echo       Displays a message on the screen
   history    Display or delete all previously run commands
   clear      Clear the terminal screen
   verbose    Turns on or off the translet description display feature
   help       Display helpful information about builtin commands
   restart    Restarts the Aspectran Service
   quit       Releases all resources and exits this application

Commands that can run examples:
   hello      Prints "Hello, World!" in your console
   hello2     Prints "Hello, World!" in your console using ANSI color codes
   echo1      It accepts parameters and print as is
   --- for more examples, type 'translet -l' ---

The Jetty Server is currently running.
Use the command 'jetty' to control the Jetty Server.
When your Jetty Server is running, point your web browser to:
   http://localhost:8088/

aspectran-demo>
```

기본적으로 Shell 명령은 `com.aspectran.daemon.command.Command` 인터페이스를 구현한 클래스로 등록
추가적으로



#### Aspectran Daemon

### Aspectran을 다른 어플리케이션에 내장하기

#### Servlet Container와의 연동

#### Java 어플리케이션에 내장하기


## Configuration XML

### settings
### typeAliases
### evironment
### aspect
### bean
### schedule
### translet
### append


## Anotated Configuration

### @Component
### @Aspect
### @Bean
### @Schedule
### @Translet
