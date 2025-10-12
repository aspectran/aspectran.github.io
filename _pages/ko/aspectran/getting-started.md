---
format: plate solid article
title: Aspectran 시작하기
teaser: 이 가이드에서는 간단한 "Hello, World" 커맨드 라인 애플리케이션을 만들어보면서 Aspectran 프로젝트를 시작하는 방법을 안내합니다.
sidebar: toc
---

## 1. 개발 환경 설정

*   **JDK (Java Development Kit)**: Aspectran은 최소 런타임 버전으로 Java 21 이상을 필요로 합니다. 최신 Java LTS 버전을 사용하는 것을 권장합니다.
*   **Maven**: 프로젝트 빌드를 위해 Apache Maven 3.9.4 이상 버전이 설치되어 있어야 합니다.

## 2. 프로젝트 파일 생성

먼저, 프로젝트를 위한 디렉토리를 생성합니다.

```bash
mkdir hello-aspectran
cd hello-aspectran
```

이제 이 디렉토리 안에 다음 세 개의 파일을 생성합니다: `pom.xml`, `aspectran-config.apon`, 그리고 `src/main/java/com/example/App.java`.

### 2.1. Maven 설정 (`pom.xml`)

프로젝트 루트에 `pom.xml` 파일을 만들고 아래 내용을 복사하여 붙여넣습니다. 이 파일은 프로젝트의 의존성을 관리하고 실행 가능한 JAR 파일을 만드는 방법을 정의합니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>hello-aspectran</artifactId>
    <version>1.0.0-SNAPSHOT</version>

    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>

        <maven.compiler.release>21</maven.compiler.release>
        <!-- [Critical] Must be 'true' to preserve method parameter names, which Aspectran requires for runtime argument mapping. -->
        <maven.compiler.parameters>true</maven.compiler.parameters>

        <aspectran.version>9.1.1</aspectran.version>
    </properties>

    <repositories>
        <repository>
            <id>central-portal-snapshots</id>
            <name>Central Portal Snapshots</name>
            <url>https://central.sonatype.com/repository/maven-snapshots/</url>
            <releases>
                <enabled>false</enabled>
            </releases>
            <snapshots>
                <enabled>true</enabled>
            </snapshots>
        </repository>
    </repositories>

    <dependencies>
        <dependency>
            <groupId>com.aspectran</groupId>
            <artifactId>aspectran-logging</artifactId>
            <version>${aspectran.version}</version>
        </dependency>
        <dependency>
            <groupId>com.aspectran</groupId>
            <artifactId>aspectran-shell-jline</artifactId>
            <version>${aspectran.version}</version>
        </dependency>
    </dependencies>

    <build>
        <finalName>hello-aspectran</finalName>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.14.1</version>
            </plugin>
            <plugin>
                <artifactId>maven-assembly-plugin</artifactId>
                <version>3.6.0</version>
                <executions>
                    <execution>
                        <id>make-assembly</id>
                        <phase>package</phase>
                        <goals>
                            <goal>single</goal>
                        </goals>
                        <configuration>
                            <descriptorRefs>
                                <descriptorRef>jar-with-dependencies</descriptorRef>
                            </descriptorRefs>
                            <archive>
                                <manifest>
                                    <mainClass>com.example.App</mainClass>
                                </manifest>
                            </archive>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>

</project>
```

### 2.2. Aspectran 구성 (`aspectran-config.apon`)

프로젝트 루트에 `aspectran-config.apon` 파일을 만들고 다음 내용을 작성합니다. 이 파일은 Aspectran 셸의 동작을 설정합니다.

```apon
context: {
    scan: [
        com.example
    ]
}
shell: {
    greetings: (
        |
        |{{GREEN,bold}}Welcome to Hello Aspectran!{{reset}}
        |To see a list of commands, type '{{CYAN}}help{{reset}}'.
        |To run the 'hello' command, type '{{CYAN}}hello{{reset}}'.
        |To exit, type '{{CYAN}}quit{{reset}}'.
        |
    )
    prompt: "{{green}}hello-aspectran> {{reset}}"
    commands: [
        com.aspectran.shell.command.builtins.TransletCommand
        com.aspectran.shell.command.builtins.HelpCommand
        com.aspectran.shell.command.builtins.QuitCommand
    ]
}
```

### 2.3. 애플리케이션 코드 (`App.java`)

먼저 소스 디렉토리를 생성합니다.
```bash
mkdir -p src/main/java/com/example
```
그런 다음, `src/main/java/com/example/App.java` 파일을 생성하고 아래 코드를 작성합니다.

```java
package com.example;

import com.aspectran.core.component.bean.annotation.Bean;
import com.aspectran.core.component.bean.annotation.Component;
import com.aspectran.core.component.bean.annotation.Request;
import com.aspectran.core.component.bean.annotation.Transform;
import com.aspectran.core.context.rule.type.FormatType;
import com.aspectran.shell.jline.JLineAspectranShell;

@Component
@Bean("helloBean")
public class App {

    @Request("hello")
    @Transform(FormatType.TEXT)
    public String hello() {
        return "Hello, World!";
    }

    public static void main(String[] args) {
        // Aspectran 셸을 실행하고, 커맨드 라인 인자를 그대로 전달합니다.
        JLineAspectranShell.main(args);
    }

}
```
*   `@Request("hello")`: `hello` 라는 이름의 명령어를 `hello()` 메소드에 매핑합니다.
*   `@Transform(FormatType.TEXT)`: `hello()` 메소드의 반환값(`String`)을 일반 텍스트 형식으로 변환하여 콘솔에 출력하도록 지정합니다.
*   `main()` 메소드: 커맨드 라인 인자를 `JLineAspectranShell.main()`으로 전달하여 셸을 구동합니다.

## 3. 빌드 및 실행

이제 프로젝트를 빌드하고 실행할 준비가 되었습니다.

1.  **빌드**: 터미널에서 다음 명령어를 실행하여 실행 가능한 JAR 파일을 생성합니다.
    ```bash
    mvn package
    ```
    빌드가 성공하면 `target` 디렉토리에 `hello-aspectran-jar-with-dependencies.jar` 파일이 생성됩니다.

2.  **실행**: 다음 명령어로 애플리케이션을 실행합니다. `aspectran-config.apon` 파일의 경로를 인자로 전달해야 합니다.
    ```bash
    java -jar target/hello-aspectran-jar-with-dependencies.jar aspectran-config.apon
    ```

    애플리케이션이 시작되면 다음과 같은 환영 메시지와 함께 Aspectran 셸 프롬프트가 나타납니다.
    ```
    Welcome to Hello Aspectran!
    To see a list of commands, type 'help'.
    To run the 'hello' command, type 'hello'.
    To exit, type 'quit'.

    hello-aspectran>
    ```
    *   `translet -l` 명령어를 사용하면 현재 애플리케이션에 정의된 모든 Translet의 목록을 확인할 수 있습니다.
        ```text
        ------+-------------------------------------------------------------+-------
          No. | Translet Name                                               | Async
        ------+-------------------------------------------------------------+-------
            1 | hello                                                       | false
        ------+-------------------------------------------------------------+-------
        ```
    *   `hello`를 입력하고 Enter를 누르면 `Hello, World!`가 출력됩니다.
    *   `quit`를 입력하고 Enter를 누르면 애플리케이션이 종료됩니다.

이 방법은 구성 파일을 JAR 파일 외부에 두어, 애플리케이션을 다시 빌드하지 않고도 설정을 쉽게 변경할 수 있는 장점이 있습니다.
