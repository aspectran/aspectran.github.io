---
title: APON(Aspectran Parameters Object Notation) 소개
subheadline: 사용자 가이드
---

## 1. APON 이란?

APON(Aspectran Parameters Object Notation)은 구조화된 데이터를 표현하기 위한 경량 데이터 교환 형식입니다.
JSON과 유사한 구조를 가지면서도, YAML처럼 사람이 쉽게 읽고 쓸 수 있도록 가독성을 높인 것이 특징입니다.

APON은 특히 Aspectran 프레임워크의 설정 파일을 간결하게 작성하고, 애플리케이션이 설정 값을 정확하게 읽어 들일 수 있도록 설계되었습니다.

### 주요 특징

*   **뛰어난 가독성**: 콤마(`,`) 대신 줄바꿈으로 항목을 구분하고, 값에 공백이나 특수문자가 없다면 따옴표를 생략할 수 있어 코드가 간결하고 명확합니다.
*   **명시적 타입 지원**: 값(Value)에 대한 데이터 타입을 직접 명시할 수 있어, 설정 값의 정확성과 안정성을 보장합니다.
*   **계층적 데이터 구조**: 중괄호(`{ }`)를 사용하여 데이터를 계층적으로 구성할 수 있어 복잡한 설정도 체계적으로 표현할 수 있습니다.
*   **긴 문자열 지원**: 여러 줄로 이루어진 텍스트를 쉽게 작성할 수 있는 `text` 타입을 지원합니다.
*   **주석 지원**: `#` 문자를 사용하여 코드에 대한 설명을 추가할 수 있습니다. 반드시 새로운 줄에 작성되어야 합니다.

## 2. 기본 문법

### 단일 값 (Parameter)

APON의 가장 기본적인 단위는 `이름: 값` 형식의 단일 값을 가질 수 있습니다.
값(value)에 다음과 같은 특수 조건이 없는 한 따옴표(`"`)를 생략하는 것이 일반적입니다.

*   값의 앞이나 뒤에 공백이 있는 경우
*   값에 작은따옴표(`'`)나 큰따옴표(`"`)가 포함된 경우
*   값에 줄바꿈 문자(`\n`)가 포함된 경우

```apon
# 큰따옴표를 사용하지 않은 예
name: John Doe
age: 30
city: New York

# 큰따옴표를 사용해야 하는 예
message: "'Hello, World'"
message: "First line\nNew line"
indented: "  앞에 공백이 있음"
indented: "뒤에 공백이 있음  "
```

### 집합 (Parameters)
```

Parameter의 집합은 중괄호(`{ }`)로 감싸서 표현합니다. 다른 하위 Parameter들을 포함하는 계층적 구조를 가질 수 있습니다.

```apon
user: {
  name: John Doe
  age: 30
  address: {
    city: New York
    zipCode: 10001
  }
}
```

### 배열 (Array)

배열은 대괄호(`[ ]`) 안에 여러 값을 넣어 표현합니다. 각 요소는 줄바꿈으로 구분합니다.

```apon
users: [
  John
  Jane
  Peter
]
numbers: [
  1
  2
  3
]
```

## 3. 데이터 타입

APON은 다양한 데이터 타입을 지원하며, `이름(타입): 값`의 형태로 타입을 명시할 수 있습니다.
타입을 생략하면 값의 형태에 따라 자동으로 타입이 결정됩니다.

| Value Type | Java Object Type | 예시                            |
| :--- | :--- |:------------------------------|
| `string` | `java.lang.String` | `name(string): Hello, World.` |
| `text` | `java.lang.String` | 아래 `text` 타입 예제 참조            |
| `int` | `java.lang.Integer` | `age(int): 30`                |
| `long` | `java.lang.Long` | `id(long): 12345L`            |
| `float` | `java.lang.Float` | `score(float): 95.5f`         |
| `double` | `java.lang.Double` | `pi(double): 3.14159d`        |
| `boolean` | `java.lang.Boolean` | `isAdmin(boolean): true`      |
| `parameters` | `com.aspectran.utils.apon.Parameters` | 중첩된 Parameter 구조                   |

### `text` 타입 사용 예제

여러 줄로 구성된 긴 문자열은 `text` 타입을 사용하면 편리합니다. 괄호(`( )`)로 감싸고, 각 줄의 시작에 `|` 문자를 붙여 표현합니다.

```apon
description(text): (
  |이것은 여러 줄로 된 텍스트입니다.
  |각 줄은 파이프 문자로 시작합니다.
  |이 블록 안에서는 "큰따옴표"나 '작은따옴표' 같은
  |특수문자를 자유롭게 사용할 수 있습니다.
)
```

## 4. APON 활용하기

APON 형식의 텍스트를 자바 객체로 변환하거나, 자바 객체를 APON 텍스트로 변환하는 방법을 알아봅니다.

### 1단계: APON에 매핑될 자바 Parameters 클래스 정의

APON 데이터 구조에 맞춰 자바에서 `Parameters` 인터페이스를 구현하는 클래스를 정의해야 합니다. 각 클래스는 APON의 계층 구조에 대응되며,
`ParameterDefinition`을 통해 각 Parameter의 이름, 타입, 배열 여부 등을 정의합니다.

**예시 APON:**
```apon
server: {
  name: MyServer
  port: 8080
  features: [
    HTTP2
    SSL
  ]
}
```

**위 APON에 매핑될 자바 클래스:**

***RootConfig.java***
```java
import com.aspectran.utils.apon.AbstractParameters;
import com.aspectran.utils.apon.ParameterDefinition;
import com.aspectran.utils.apon.ParameterValueType;
import com.aspectran.utils.apon.Parameters;

public class RootConfig extends AbstractParameters implements Parameters {

    public static final ParameterDefinition server;

    private static final ParameterDefinition[] parameterDefinitions;

    static {
        // 다른 Parameter를 포함하는 계층적 구조를 가짐
        naserverme = new ParameterDefinition("server", ServerConfig.class);

        parameterDefinitions = new ParameterDefinition[] {
                server
        };
    }

    public RootConfig() {
        super(parameterDefinitions);
    }
}
```

***ServerConfig.java***
```java
import com.aspectran.utils.apon.AbstractParameters;
import com.aspectran.utils.apon.ParameterDefinition;
import com.aspectran.utils.apon.ParameterValueType;
import com.aspectran.utils.apon.Parameters;

public class ServerConfig extends AbstractParameters implements Parameters {

    public static final ParameterDefinition name;
    public static final ParameterDefinition port;
    public static final ParameterDefinition features;

    private static final ParameterDefinition[] parameterDefinitions;

    static {
        name = new ParameterDefinition("name", ParameterValueType.STRING);
        port = new ParameterDefinition("port", ParameterValueType.INT);
        // features Parameter는 string 타입이며, 여러 값을 가질 수 있는 배열임 (세 번째 인자 true)
        features = new ParameterDefinition("features", ParameterValueType.STRING, true);

        parameterDefinitions = new ParameterDefinition[] {
                name,
                port,
                features
        };
    }

    public ServerConfig() {
        super(parameterDefinitions);
    }
}
```

### 2단계: APON 파일 읽기 (AponReader)

`AponReader` 클래스를 사용하면 APON 형식의 텍스트 파일을 읽어 정의된 `Parameters` 자바 객체로 변환할 수 있습니다.

```java
import com.aspectran.utils.apon.AponReader;
import com.aspectran.utils.apon.Parameters;
import java.io.FileReader;
import java.io.Reader;

public class AponTest {
    public static void main(String[] args) {
        try {
            // 1. APON 파일을 읽기 위한 Reader 생성
            Reader fileReader = new FileReader("root-config.apon");

            // 2. APON 구조에 맞게 정의된 최상위 Parameters 객체 생성
            Parameters rootParams = new RootConfig(); // RootConfig는 server Parameter를 포함

            // 3. AponReader를 사용하여 파일 내용을 Parameters 객체로 읽어들임
            AponReader.read(fileReader, rootParams);

            // 4. 변환된 객체 사용
            Parameters serverConfig = rootParams.getParameters("server");
            String serverName = serverConfig.getString("name");
            int port = serverConfig.getInt("port");

            System.out.println("Server Name: " + serverName);
            System.out.println("Port: " + port);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### 3단계: APON 파일 생성하기 (AponWriter)

`AponWriter` 클래스를 사용하면 `Parameters` 자바 객체를 APON 형식의 문자열로 쉽게 변환할 수 있습니다.

`AponWriter`는 지능적으로 작동하여, 문자열 값에 따옴표가 필요한 경우(예: 값의 앞/뒤에 공백이 있거나, 내부에 따옴표나 줄바꿈 문자가 포함된 경우) 자동으로 값을 큰따옴표로 감싸고 필요한 이스케이프 처리를 수행합니다. 따라서 개발자는 따옴표 사용 규칙을 일일이 신경 쓰지 않고 `Parameters` 객체의 값을 설정하기만 하면 됩니다.

```java
import com.aspectran.utils.apon.AponWriter;
import com.aspectran.utils.apon.Parameters;
import java.io.StringWriter;
import java.io.Writer;

public class AponWriteTest {
    public static void main(String[] args) {
        try {
            // 1. APON으로 변환할 Parameters 객체 생성 및 값 설정
            Parameters serverConfig = new ServerConfig();
            serverConfig.putValue("name", "NewServer");
            serverConfig.putValue("port", 9090);
            serverConfig.putValue("features", new String[] {"WebService", "Security"});

            Parameters rootParams = new RootConfig(); // RootConfig는 server Parameter를 포함
            rootParams.putValue("server", serverConfig);

            // 2. APON 텍스트를 저장할 Writer 생성
            Writer writer = new StringWriter();

            // 3. AponWriter를 사용하여 Parameters 객체를 APON 형식으로 씀
            try (AponWriterCloseable aponWriter = new AponWriterCloseable(writer)) {
                aponWriter.write(rootParams);
            }

            // 4. 변환된 APON 문자열 출력
            System.out.println(writer);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

**출력 결과:**
```apon
server: {
  name: NewServer
  port: 9090
  features: [
    WebService
    Security
  ]
}
```

## 5. 라이브러리 정보

APON 관련 클래스들은 Aspectran 프레임워크의 공통 유틸리티 패키지에 포함되어 있습니다.

*   **패키지 경로**: `com.aspectran.core.util.apon`
*   **소스 코드**: [GitHub에서 보기](https://github.com/aspectran/aspectran/tree/master/utils/src/main/java/com/aspectran/utils/apon)

{% include label-link-box.liquid label="Source" href="https://github.com/aspectran/aspectran/tree/master/utils/src/main/java/com/aspectran/utils/apon" %}
