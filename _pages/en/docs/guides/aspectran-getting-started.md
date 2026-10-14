---
title: Getting Started with Aspectran
teaser: This guide will walk you through how to start an Aspectran project by creating a simple "Hello, World" command-line application.
subheadline: Core Guides
---

## 1. Development Environment Setup

* **JDK (Java Development Kit)**: Aspectran requires Java 21 or higher as the minimum runtime version. It is recommended to use the latest Java LTS version.
* **Maven**: Apache Maven 3.9.4 or higher must be installed for project builds.

## 2. Project File Creation

First, create a directory for your project.

```bash
mkdir hello-aspectran
cd hello-aspectran
```

Now, create these three files inside this directory:
* `pom.xml`
* `aspectran-config.apon`
* `src/main/java/com/example/App.java`

### 2.1. Maven Configuration (`pom.xml`)

Create a `pom.xml` file in the project root and copy and paste the content below. This file manages the project's dependencies and defines how to create an executable JAR file.

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

        <!-- Sets the Java compiler to version 21 and preserves parameter names,
        which is critical for Aspectran's runtime argument mapping. -->
        <maven.compiler.release>21</maven.compiler.release>
        <maven.compiler.parameters>true</maven.compiler.parameters>

        <aspectran.version>9.8.1-SNAPSHOT</aspectran.version>
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
                <version>3.16.0</version>
            </plugin>
            <plugin>
                <artifactId>maven-assembly-plugin</artifactId>
                <version>3.8.0</version>
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

### 2.2. Aspectran Configuration (`aspectran-config.apon`)

Create an `aspectran-config.apon` file in the project root and write the following content. This file configures the behavior of the Aspectran shell.

```apon
{% raw %}context: {
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
}{% endraw %}
```

### 2.3. Application Code (`App.java`)

First, create the source directory.
```bash
mkdir -p src/main/java/com/example
```
Then, create the `src/main/java/com/example/App.java` file and write the code below.

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
        // Run the Aspectran shell and pass command-line arguments as is.
        JLineAspectranShell.main(args);
    }

}
```
* `@Component` / `@Bean("helloBean")`: Declares `App` as a managed component and registers it with bean name `helloBean`.
* `@Request("hello")`: Maps the command named `hello` to the `hello()` method.
* `@Transform(FormatType.TEXT)`: Specifies that the return value (`String`) of the `hello()` method should be converted to plain text format and output to the console.
* `main()` method: Starts the shell by passing command-line arguments to `JLineAspectranShell.main()`.

## 3. Build and Run

Now you are ready to build and run the project.

1. **Build**: Run the following command in the terminal to create an executable JAR file.
   ```bash
   mvn package
   ```
   If the build is successful, a `hello-aspectran-jar-with-dependencies.jar` file will be created in the `target` directory.

2. **Run**: Run the application with the following command. You must pass the path to the `aspectran-config.apon` file as an argument.
   ```bash
   java -jar target/hello-aspectran-jar-with-dependencies.jar aspectran-config.apon
   ```

   When the application starts, the Aspectran shell prompt will appear with a welcome message like this:
   ```text
   Welcome to Hello Aspectran!
   To see a list of commands, type 'help'.
   To run the 'hello' command, type 'hello'.
   To exit, type 'quit'.

   hello-aspectran> 
   ```
   * You can check the list of all Translets defined in the current application using the `translet -l` command.
     ```text
     ------+-------------------------------------------------------------+-------
       No. | Translet Name                                               | Async 
     ------+-------------------------------------------------------------+-------
         1 | hello                                                       | false 
     ------+-------------------------------------------------------------+-------
     ```
   * Type `hello` and press Enter to output `Hello, World!`.
   * Type `quit` and press Enter to exit the application.

This method has the advantage of keeping the configuration file outside the JAR file, allowing you to easily change settings without rebuilding the application.

## 4. Understanding Core Concepts

Although this example is concise, it encapsulates the core design principles of Aspectran:

* **ActivityContext**: The foundational IoC/DI container that centrally manages beans, translets, AOP advices, schedulers, and environment configurations.
* **Translet**: The fundamental execution unit that processes a request, coordinates actions, and transforms results into views. Whether it is a CLI console command, an HTTP endpoint, or a scheduled cron job, all requests are executed through uniform Translet abstractions.
* **APON (Aspectran Parameter Object Notation)**: Aspectran's human-readable, lightweight data interchange and configuration format designed to simplify hierarchical configuration.

## 5. Next Steps

Now that you have built a working CLI application, explore these guides to expand into web applications and enterprise deployments:

* **[Aspectow Configuration Guide](/en/docs/aspectow/configuration-guide/)**: Learn how to configure and operate enterprise web applications using embedded Undertow and the Jasper JSP engine.
* **[Aspectran Beans Guide](/en/docs/guides/aspectran-beans/)**: Master dependency injection, bean scopes, lifecycle callbacks, and factory beans using annotations and XML.
* **[Aspectran Translet In-Depth Guide](/en/docs/guides/aspectran-translet/)**: Dive deeper into request parameter mapping, file uploads, and versatile response transformations (JSON, XML, template engines).
