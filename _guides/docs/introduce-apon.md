---
layout: page
format: plate article
subheadline: Aspectran Parameters Object Notation
title:  APON을 소개합니다.
teaser: |
  APON은 구조화된 형식의 데이터를 교환하기 위해 새롭게 개발된 표기법이며,
  JSON과 비슷한 표기 형식을 가지면서도, YAML처럼 사람이 읽고 쓰기에 더 용이한 특징을 가집니다.
breadcrumb: true
comments: true
sidebar: toc-left
tags:
  - APON
category: docs
date: 2015-10-15
---

## APON 소개

APON은 구조화된 형식의 데이터를 교환하기 위해 새롭게 개발된 표기법입니다. JSON과 비슷한 표기 형식을 가지면서도, YAML처럼 사람이 읽고 쓰기에 더 용이한 특징을 가집니다. APON은 특히 Aspectran 프레임워크의 설정 파일(`aspectran-config.apon`)을 쉽게 작성하고, 애플리케이션이 정확하게 읽어 들일 수 있도록 하는 데 최적화되어 있습니다.

## 주요 특징

*   **쉬운 가독성**: 콤마(`,`) 대신 줄바꿈으로 항목을 구분하고, 따옴표를 생략할 수 있어 코드가 간결하고 명확합니다.
*   **타입 명시**: 파라미터(Parameter)의 값(Value)에 대한 타입을 명시할 수 있어, JSON이나 YAML보다 설정 값의 정확성과 안정성을 높일 수 있습니다.
*   **계층적 구조**: `Parameters`는 내부에 다른 `Parameters`를 포함하는 계층적 구조를 가질 수 있어, 복잡한 설정도 체계적으로 표현할 수 있습니다.
*   **긴 문자열 지원**: 여러 줄로 이루어진 긴 문자열을 표기하기 위한 `text` 타입을 지원하여 가독성을 크게 향상시킵니다.
*   **주석 지원**: `#` 문자를 사용하여 주석을 작성할 수 있습니다.

## 데이터 표기 규칙

*   **파라미터 (Parameter)**: 이름(Name)과 값(Value)이 `이름: 값`의 형태로 쌍을 이룬 항목을 말합니다.
*   **파라미터스 (Parameters)**: 이러한 파라미터들의 집합을 의미하며, `{ }` (중괄호)로 감싸 표현합니다.
*   **값의 타입 (Value Type)**: `string`, `text`, `int`, `long`, `boolean`, `parameters` 등 다양한 타입을 가질 수 있으며, `이름(타입): 값`의 형태로 명시할 수 있습니다. 타입을 생략하면 값에 따라 자동으로 타입이 결정됩니다.
*   **배열 (Array)**: `[ ]` (대괄호) 안에 여러 값을 넣어 배열을 표현합니다. 각 요소는 줄바꿈으로 구분합니다.
*   **여러 줄 문자열 (Text)**: `( )` (소괄호)로 감싸고, 각 줄의 시작에 `|` 문자를 붙여 표현합니다. 이 블록 안에서는 이스케이프 문자 없이 자유롭게 특수문자를 사용할 수 있습니다.

## 값의 타입 (Value Type)

APON의 파라미터는 다음과 같은 값의 타입을 가질 수 있습니다.

| Value Type | Java Object Type | 예시 |
| :--- | :--- | :--- |
| `string` | `java.lang.String` | `Hello, World.` |
| `text` | `java.lang.String` | 아래 `text` 타입 사용 예제 참조 |
| `int` | `java.lang.Integer` | `123` |
| `long` | `java.lang.Long` | `123L` |
| `float` | `java.lang.Float` | `123.0f` |
| `double` | `java.lang.Double` | `123.0d` |
| `boolean` | `java.lang.Boolean` | `true` 또는 `false` |
| `variable` | `java.lang.Object` | 실제 값에 따라 자동으로 타입을 정합니다. (기본값) |
| `parameters` | `com.aspectran.utils.apon.Parameters` | 여러 `Parameter`를 포함하는 중첩 구조 |

### `text` 타입 사용 예제

```apon
desc(text): (
    | 여러 라인으로 구성된 문자열은
    | 괄호로 감싸고 수직문자를 각 라인 앞에 붙입니다.
    | 이 안에서는 특수문자를 자유롭게 사용할 수 있습니다.
)
```

## APON 활용 사례

### Aspectran 초기화 설정

다음은 Aspectran 데모 애플리케이션([demo-app](https://github.com/aspectran/demo-app))을 위한 초기화 설정 파일(aspectran-config.apon)의 내용입니다.

> APON 형식으로 작성된 초기화 설정 값은 [AspectranConfig](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/context/config/AspectranConfig.java)
> 객체로 변환될 수 있습니다.

```text
context: {
    root: /config/app-config.xml
    resources: [
        /config
    ]
    scan: [
        app.demo
    ]
    profiles: {
        default: [
            h2
        ]
    }
    autoReload: {
        reloadMode: hard
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
    greetings: (
        |
        |{{YELLOW}}     ___                         __
        |{{YELLOW}}    /   |  ___  ____  ___  ___  / /____   ___  ____
        |{{GREEN }}   / /| | / __|/ __ |/ _ |/ __|/ __/ __|/ __ |/ __ |
        |{{GREEN }}  / ___ |(__  ) /_/ /  __/ /  / / / /  / /_/ / / / /
        |{{CYAN  }} /_/  |_|____/ .___/|___/|___/|__/_/   |__(_(_/ /_/   Shell
        |{{CYAN  }}=========== /_/ =============================================
        |{{reset }}
        |{{RED   }}Welcome To Aspectran Shell #{class:com.aspectran.core.util.Aspectran^version}
        |{{reset }}
        |If you want a list of all supported built-in commands, type '{{GREEN}}help{{reset}}'.
        |To get help on a specific command, type '{{GREEN}}command_name -h{{reset}}'.
        |If you want a list of all available translets, type '{{GREEN}}translet -l{{reset}}'.
        |To run a translet, type '{{GREEN}}translet <translet_name>{{reset}}' or '{{GREEN}}translet_name{{reset}}'.
    )
    prompt: "{{green}}demo-app>{{reset}} "
    commands: [
        com.aspectran.shell.command.builtins.UndertowCommand
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
    session: {
        enabled: true
    }
    workingDir: /work
    verbose: true
    exposals: {
        -: /**
    }
}
daemon: {
    poller: {
        pollingInterval: 5000
        maxThreads: 5
        requeuable: false
        incoming: /commands/incoming
    }
    commands: [
        com.aspectran.daemon.command.builtins.JettyCommand
        com.aspectran.daemon.command.builtins.InvokeActionCommand
        com.aspectran.daemon.command.builtins.TransletCommand
        com.aspectran.daemon.command.builtins.ComponentCommand
        com.aspectran.daemon.command.builtins.PollingIntervalCommand
        com.aspectran.daemon.command.builtins.RestartCommand
        com.aspectran.daemon.command.builtins.QuitCommand
    ]
    session: {
        enabled: true
    }
    exposals: {
        -: /**
    }
}
web: {
    uriDecoding: utf-8
    defaultServletName: default
    exposals: {
        +: /**
    }
}
```

### Parameters 객체 생성

Parameters 객체는 여러 파라메터를 포함하며, 각 파라메터의 속성을 정의하는 역할을 합니다.
위의 APON 형식의 텍스트를 Object로 변환하기 위해 4개의 Parameters 클래스를 작성했습니다.

> 아래 4개의 Parameters 클래스는 [`com.aspectran.core.util.apon.Parameters`](https://github.com/topframe/aspectran/blob/master/src/main/java/com/aspectran/core/util/apon/Parameters.java) 인터페이스의 구현체입니다.


***AspectranConfig.java***

루트 Parameters로써 `context`, `scheduler` Parameter를 가지고 있습니다.

```java
package com.aspectran.core.context.loader.config;

import com.aspectran.core.util.apon.AbstractParameters;
import com.aspectran.core.util.apon.ParameterDefinition;
import com.aspectran.core.util.apon.Parameters;

public class AspectranConfig extends AbstractParameters implements Parameters {

  public static final ParameterDefinition context;
  public static final ParameterDefinition scheduler;

  private static final ParameterDefinition[] parameterDefinitions;

  static {
    context = new ParameterDefinition("context", AspectranContextConfig.class);
    scheduler = new ParameterDefinition("scheduler", AspectranSchedulerConfig.class);

    parameterDefinitions = new ParameterDefinition[] {
        context,
        scheduler
    };
  }

  public AspectranConfig() {
    super(parameterDefinitions);
  }

  public AspectranConfig(String text) {
    super(parameterDefinitions, text);
  }

}
```

***AspectranContextConfig.java***

`context` Parameters의 멤버 Parameter로는 `root`, `encoding`, `resources`, `hybridLoad`, `autoReload`가 있습니다.

```java
package com.aspectran.core.context.loader.config;

import com.aspectran.core.util.apon.AbstractParameters;
import com.aspectran.core.util.apon.ParameterDefinition;
import com.aspectran.core.util.apon.ParameterValueType;
import com.aspectran.core.util.apon.Parameters;

public class AspectranContextConfig extends AbstractParameters implements Parameters {

  public static final ParameterDefinition root;
  public static final ParameterDefinition encoding;
  public static final ParameterDefinition resources;
  public static final ParameterDefinition hybridLoad;
  public static final ParameterDefinition autoReload;

  private final static ParameterDefinition[] parameterDefinitions;

  static {
    root = new ParameterDefinition("root", ParameterValueType.STRING);
    encoding = new ParameterDefinition("encoding", ParameterValueType.STRING);
    resources = new ParameterDefinition("resources", ParameterValueType.STRING, true);
    hybridLoad = new ParameterDefinition("hybridLoad", ParameterValueType.BOOLEAN);
    autoReload = new ParameterDefinition("autoReload", AspectranContextAutoReloadConfig.class);

    parameterDefinitions = new ParameterDefinition[] {
        root,
        encoding,
        resources,
        hybridLoad,
        autoReload
    };
  }

  public AspectranContextConfig() {
    super(parameterDefinitions);
  }

  public AspectranContextConfig(String text) {
    super(parameterDefinitions, text);
  }

}
```

***AspectranContextAutoReloadConfig.java***

`autoReload` Parameters의 멤버 Parameter로는 `reloadMethod`, `observationInterval`, `startup`이 있습니다.

```java
package com.aspectran.core.context.loader.config;

import com.aspectran.core.util.apon.AbstractParameters;
import com.aspectran.core.util.apon.ParameterDefinition;
import com.aspectran.core.util.apon.ParameterValueType;
import com.aspectran.core.util.apon.Parameters;

public class AspectranContextAutoReloadConfig extends AbstractParameters implements Parameters {

  public static final ParameterDefinition reloadMethod;
  public static final ParameterDefinition observationInterval;
  public static final ParameterDefinition startup;

  private final static ParameterDefinition[] parameterValues;

  static {
    reloadMethod = new ParameterDefinition("reloadMethod", ParameterValueType.STRING);
    observationInterval = new ParameterDefinition("observationInterval", ParameterValueType.INT);
    startup = new ParameterDefinition("startup", ParameterValueType.BOOLEAN);

    parameterValues = new ParameterDefinition[] {
        reloadMethod,
        observationInterval,
        startup
    };
  }

  public AspectranContextAutoReloadConfig() {
    super(parameterValues);
  }

  public AspectranContextAutoReloadConfig(String text) {
    super(parameterValues, text);
  }

}
```

***AspectranSchedulerConfig.java***

`scheduler` Parameters의 멤버 Parameter로는 `startDelaySeconds`, `waitOnShutdown`, `startup`이 있습니다.

```java
package com.aspectran.core.context.loader.config;

import com.aspectran.core.util.apon.AbstractParameters;
import com.aspectran.core.util.apon.ParameterDefinition;
import com.aspectran.core.util.apon.ParameterValueType;
import com.aspectran.core.util.apon.Parameters;

public class AspectranSchedulerConfig extends AbstractParameters implements Parameters {

  public static final ParameterDefinition startDelaySeconds;
  public static final ParameterDefinition waitOnShutdown;
  public static final ParameterDefinition startup;

  private final static ParameterDefinition[] parameterDefinitions;

  static {
    startDelaySeconds = new ParameterDefinition("startDelaySeconds", ParameterValueType.INT);
    waitOnShutdown = new ParameterDefinition("waitOnShutdown", ParameterValueType.BOOLEAN);
    startup = new ParameterDefinition("startup", ParameterValueType.BOOLEAN);

    parameterDefinitions = new ParameterDefinition[] {
        startDelaySeconds,
        waitOnShutdown,
        startup
    };
  }

  public AspectranSchedulerConfig() {
    super(parameterDefinitions);
  }

  public AspectranSchedulerConfig(String plaintext) {
    super(parameterDefinitions, plaintext);
  }

}
```


### AponWriter 사용 예제

[`AponWriter`](https://github.com/aspectran/aspectran/blob/master/src/main/java/com/aspectran/core/util/apon/AponWriter.java) 클래스를
사용하면 Parameters Object를 APON 형식의 텍스트 문서로 쉽게 변환할 수 있습니다.
APON 형식의 텍스트 문서를 Parameters Object로 변환하고, 다시 Parameters Object를 APON 형식의 문자열로 변환해서 콘솔에 출력하는 예제입니다.

```java
package com.aspectran.core.util.apon;

import java.io.File;
import java.io.FileReader;
import java.io.Reader;
import java.io.StringWriter;
import java.io.Writer;

import com.aspectran.core.context.loader.config.AspectranConfig;

public class AponWriterTest {

  public static void main(String argv[]) {
    try {
      Reader reader = new FileReader(new File(argv[0]));

      Parameters aspectranConfig = new AspectranConfig();

      AponReader aponReader = new AponReader(reader);
      aponReader.read(aspectranConfig);
      aponReader.close();

      System.out.println(aspectranConfig);

      Writer writer = new StringWriter();

      AponWriter aponWriter = new AponWriter(writer);
      aponWriter.write(aspectranConfig);
      aponWriter.close();

      System.out.println(writer.toString());

    } catch(Exception e) {
      e.printStackTrace();
    }
  }

}
```


### AponReader 사용 예제

[`AponReader`](https://github.com/aspectran/aspectran/blob/master/src/main/java/com/aspectran/core/util/apon/AponReader.java) 클래스를
사용하면 APON 형식의 텍스트 문서를 Parameters Object로 쉽게 변환할 수 있습니다.

```java
package com.aspectran.core.util.apon;

import java.io.File;
import java.io.FileReader;
import java.io.Reader;

import com.aspectran.core.context.loader.config.AspectranConfig;

public class AponReaderTest {

  public static void main(String argv[]) {
    try {
      Reader fileReader = new FileReader(new File(argv[0]));
      AponReader reader = new AponReader(fileReader);

      try {
        Parameters aspectranConfig = new AspectranConfig();  

        reader.read(aspectranConfig);

        System.out.println(aspectranConfig);
      } finally {
        reader.close();
      }
    } catch(Exception e) {
      e.printStackTrace();
    }
  }

}
```


## APON 라이브러리

현재 APON 라이브러는 Aspectran의 공통 유틸 패키지에 포함되어 있습니다.

APON 패키지: **com.aspectran.core.util.apon**

{% include label-link-box label="Source" href="https://github.com/aspectran/aspectran/tree/master/core/src/main/java/com/aspectran/core/util/apon" %}
