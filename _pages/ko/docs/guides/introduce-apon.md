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

### JSON, YAML과의 비교

APON은 JSON과 YAML의 특징을 조합하여 가독성과 편의성을 높인 데이터 형식입니다. 각 형식과의 주요 차이점은 다음과 같습니다.

| 구분 | JSON | YAML | APON |
| :--- | :--- | :--- | :--- |
| **주요 목적** | 데이터 교환 (API) | 범용 설정 파일 | **Aspectran 전용 설정** |
| **구조 정의** | 괄호 (`{ }`, `[ ]`) | **들여쓰기** | 괄호 (`{ }`, `[ ]`) |
| **항목 구분** | 쉼표 (`,`) | 줄바꿈 + 들여쓰기 | **줄바꿈** |
| **주석** | 미지원 | 지원 (`#`) | 지원 (`#`) |

가장 큰 차이점은 **구조를 정의하는 방식**과 **항목을 구분하는 방식**입니다. APON은 JSON처럼 괄호로 명시적인 구조를 만들지만, 항목 구분자로는 줄바꿈을 사용하여 가독성을 극대화합니다. 이는 줄바꿈과 들여쓰기의 조합으로 구조 전체를 정의하는 YAML과는 구분되는 특징입니다.

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

Parameter의 집합은 중괄호(`{ }`)로 감싸서 표현합니다. 다른 하위 Parameter들을 포함하는 계층적 구조를 가질 수 있습니다.

APON의 기본이자 가장 일반적인 루트 레벨 파라미터 스타일은 바깥쪽 중괄호가 생략된 "컴팩트 스타일"입니다. 루트 레벨 파라미터가 중괄호로 감싸진 비컴팩트 스타일도 JSON과 유사하게 보이기 위해 존재하지만, 기능적인 차이는 없습니다.

**중첩된 Parameters 집합의 예:**
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

**컴팩트 스타일의 루트 레벨 파라미터 (바깥쪽 중괄호 없음):**
```apon
name: John Doe
age: 30
city: New York
```

### 배열 (Array)

배열은 대괄호(`[ ]`) 안에 여러 값을 넣어 표현합니다. 각 요소는 줄바꿈으로 구분합니다.

APON은 또한 루트 레벨 배열을 지원하며, 이는 `ArrayParameters` 객체로 직접 파싱될 수 있습니다.

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

**루트 레벨 배열의 예:**
```apon
[
  "apple"
  "banana"
  "cherry"
]
```

## 3. 데이터 타입

APON은 다양한 데이터 타입을 지원하며, `이름(타입): 값`의 형태로 타입을 명시할 수 있습니다.
타입을 생략하면 값의 형태에 따라 자동으로 타입이 결정됩니다. 숫자 값의 경우, 파서는 가장 적절한 유형을 추론하려고 시도합니다: 정수는 일반적으로 `java.lang.Integer`(더 큰 값의 경우 `java.lang.Long`)로 파싱되며, 소수점이 있는 숫자는 `java.lang.Double`로 파싱됩니다.

**`float`에 대한 중요 참고 사항:** 소수점 숫자를 `java.lang.Float`로 파싱하려면 APON 텍스트에서 `float`로 명시적으로 타입을 지정하거나(예: `score(float): 95.5`) `ValueType.FLOAT`를 가진 `ParameterKey`를 정의해야 합니다. 그렇지 않으면 소수점 숫자는 기본적으로 `java.lang.Double`로 처리됩니다.


| Value Type | Java Object Type | 예시                            |
| :--- | :--- |:------------------------------|
| `string` | `java.lang.String` | `name(string): Hello, World.` |
| `text` | `java.lang.String` | 아래 `text` 타입 예제 참조            |
| `int` | `java.lang.Integer` | `age(int): 30`                |
| `long` | `java.lang.Long` | `id(long): 12345`            |
| `float` | `java.lang.Float` | `score(float): 95.5`         |
| `double` | `java.lang.Double` | `pi(double): 3.14159`        |
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

### `Parameters` 클래스로 스키마 정의하기

APON 데이터 구조에 맞춰 자바에서 `Parameters` 인터페이스를 구현하는 클래스를 정의해야 합니다. 각 클래스는 APON의 계층 구조에 대응되며, `ParameterKey`를 통해 각 Parameter의 이름, 타입, 배열 여부 등을 정의합니다. 더 유연한 파싱을 위해 파라미터에 대한 대체 이름(별칭)을 정의할 수도 있습니다.

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
import com.aspectran.utils.apon.DefaultParameters;
import com.aspectran.utils.apon.ParameterKey;
import com.aspectran.utils.apon.ValueType;
import com.aspectran.utils.apon.Parameters;

public class RootConfig extends DefaultParameters implements Parameters {

    public static final ParameterKey server;

    private static final ParameterKey[] parameterKeys;

    static {
        // 다른 Parameter를 포함하는 계층적 구조를 가짐
        server = new ParameterKey("server", ServerConfig.class);

        parameterKeys = new ParameterKey[] {
                server
        };
    }

    public RootConfig() {
        super(parameterKeys);
    }
}
```

***ServerConfig.java***
```java
import com.aspectran.utils.apon.DefaultParameters;
import com.aspectran.utils.apon.ParameterKey;
import com.aspectran.utils.apon.ValueType;
import com.aspectran.utils.apon.Parameters;

public class ServerConfig extends DefaultParameters implements Parameters {

    public static final ParameterKey name;
    public static final ParameterKey port;
    public static final ParameterKey features;

    private static final ParameterKey[] parameterKeys;

    static {
        name = new ParameterKey("name", ValueType.STRING);
        port = new ParameterKey("port", ValueType.INT);
        // features Parameter는 string 타입이며, 여러 값을 가질 수 있는 배열임 (세 번째 인자 true)
        features = new ParameterKey("features", ValueType.STRING, true);

        parameterKeys = new ParameterKey[] {
                name,
                port,
                features
        };
    }

    public ServerConfig() {
        super(parameterKeys);
    }
}
```

### APON 텍스트 읽기 (AponReader)

`AponReader` 클래스를 사용하면 APON 형식의 텍스트 파일을 읽어 정의된 `Parameters` 자바 객체로 변환할 수 있습니다.

**예제: 루트 객체 및 루트 배열 읽기**

```java
import com.aspectran.utils.apon.AponReader;
import com.aspectran.utils.apon.Parameters;
import com.aspectran.utils.apon.RootConfig; // 1단계에서 정의된 RootConfig 가정
import com.aspectran.utils.apon.ArrayParameters; // ArrayParameters 임포트
import com.aspectran.utils.apon.DefaultParameters; // DefaultParameters 임포트

public class AponReaderTest {
    public static void main(String[] args) {
        try {
            // 예제 1: 루트 객체 읽기 (컴팩트 또는 비컴팩트 스타일 가능)
            String apon1 = """
                name: John Doe
                age: 30
                """;
            Parameters params1 = AponReader.read(apon1, new RootConfig());
            System.out.println("객체 이름: " + params1.getString("name"));

            // 예제 2: 루트 배열 읽기
            String apon2 = """
                [
                  "apple"
                  "banana"
                  "cherry"
                ]
                """;
            // 루트 배열의 경우, 명시적으로 ArrayParameters 인스턴스를 제공해야 합니다.
            ArrayParameters arrayParams = AponReader.read(apon2, new ArrayParameters());
            System.out.println("배열 내용: " + arrayParams.getValueList());

            // 루트 배열에 대해 ArrayParameters가 아닌 객체를 제공하면,
            // AponReader는 배열을 "" (ArrayParameters.NONAME) 이름의 파라미터로 추가합니다.
            Parameters defaultParams = AponReader.read(apon2, new DefaultParameters());
            System.out.println("이름 있는 파라미터로서의 배열: " + defaultParams.getValueList(ArrayParameters.NONAME));

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### 최신 파싱 방식 (AponParser)

`AponParser`는 특히 다차원 배열을 처리하는 데 있어 `AponReader`보다 더 효율적이고 직관적인 대안을 제공합니다. `AponParser`는 중첩된 배열을 중첩된 `List` 객체로 직접 파싱합니다.

**예제: AponParser로 다차원 배열 파싱**

```java
import com.aspectran.utils.apon.AponParser;
import com.aspectran.utils.apon.ArrayParameters;
import com.aspectran.utils.apon.Parameters;
import java.util.List;

public class AponParserTest {
    public static void main(String[] args) {
        try {
            String apon = """
                [
                  [ "a", "b" ],
                  [ "c", "d", "e" ]
                ]
                """;

            // AponParser를 사용하여 문자열을 ArrayParameters 객체로 파싱
            ArrayParameters rootArrayParams = AponParser.parse(apon, ArrayParameters.class);

            // AponParser는 중첩된 배열을 List<List<Object>>로 올바르게 파싱합니다.
            List<List<String>> matrix = (List<List<String>>)rootArrayParams.getValueList();

            System.out.println("Matrix: " + matrix);
            // 출력: Matrix: [[a, b], [c, d, e]]

            // AponParser로 루트 객체도 파싱할 수 있습니다.
            String objectApon = """
                {
                  name: John Doe
                  age: 30
                }
                """;
            Parameters rootObjectParams = AponParser.parse(objectApon);
            System.out.println("Object Name: " + rootObjectParams.getString("name"));
            // 출력: Object Name: John Doe

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### APON 텍스트 작성하기 (AponWriter)

`AponWriter` 클래스를 사용하면 `Parameters` 자바 객체를 APON 형식의 문자열로 쉽게 변환할 수 있습니다.

`AponWriter`는 지능적으로 작동하여, 문자열 값에 따옴표가 필요한 경우(예: 값의 앞/뒤에 공백이 있거나, 내부에 따옴표나 줄바꿈 문자가 포함된 경우) 자동으로 값을 큰따옴표로 감싸고 필요한 이스케이프 처리를 수행합니다. 따라서 개발자는 따옴표 사용 규칙을 일일이 신경 쓰지 않고 `Parameters` 객체의 값을 설정하기만 하면 됩니다.

기본적으로 `AponWriter`는 루트 레벨 파라미터를 "컴팩트 스타일"(바깥쪽 중괄호 없음)로 출력합니다. 루트 `Parameters` 객체의 `compactStyle` 속성을 `false`로 설정하여 비컴팩트 스타일(바깥쪽 중괄호 있음)을 활성화할 수 있지만, 기능적인 차이가 없으므로 거의 필요하지 않습니다.

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

            // 예제: 기본 컴팩트 스타일 출력 (바깥쪽 중괄호 없음)
            String apon = new AponWriter().write(rootParams).toString();
            System.out.println("기본 컴팩트 스타일 출력:\n" + apon);
            // 출력:
            // server: {
            //   name: NewServer
            //   port: 9090
            //   features: [
            //     WebService
            //     Security
            //   ]
            // }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

`AponWriter`는 또한 출력에 대한 고급 제어를 위한 몇 가지 구성 옵션을 제공합니다. 예를 들어, 압축된 출력을 위해 예쁘게 인쇄하는 기능을 비활성화하거나 `null` 값이 처리되는 방식을 구성할 수 있습니다.

`prettyPrint(false)`를 사용하더라도 개행 문자가 완전히 제거되지 않는다는 점에 유의해야 합니다. 이는 콤마를 사용하는 다른 형식과 달리, APON에서는 개행 문자가 파라미터와 배열 요소의 기본적인 구분자 역할을 하기 때문입니다. 예쁘게 인쇄하는 기능을 비활성화하면 주로 들여쓰기가 제거됩니다.

```java
// 압축 출력 예제 (들여쓰기 없이, 하지만 구분자로서의 개행 문자는 유지)
String compactApon = new AponWriter().prettyPrint(false).write(rootParams).toString();
System.out.println(compactApon);
// 출력: server:{
// name:NewServer
// port:9090
// features:[
// HTTP2
// SSL
// ]
// }
```

### 프로그래밍 방식으로 APON 생성하기 (AponLines)

코드에서 APON 문자열을 동적으로 생성해야 하는 경우, `AponLines` 클래스는 편리한 fluent API를 제공합니다. 이 클래스는 수동으로 문자열을 연결하지 않고도 중첩된 구조와 배열을 간단하게 만들 수 있도록 도와줍니다.

```java
import com.aspectran.utils.apon.AponLines;

public class AponLinesTest {
    public static void main(String[] args) {
        AponLines lines = new AponLines()
            .block("server")
                .line("name", "MyWebApp")
                .line("port", 8080)
                .array("features")
                    .line("HTTP2")
                    .line("SSL")
                .end()
            .end();

        String apon = lines.toString();
        System.out.println(apon);
    }
}
```

**출력:**
```apon
server: {
  name: MyWebApp
  port: 8080
  features: [
    HTTP2
    SSL
  ]
}
```

## 5. 다른 형식에서 APON으로 변환하기

`com.aspectran.utils.apon` 패키지에는 JSON, XML, Java 객체와 같은 다른 일반적인 형식의 데이터를 `Parameters` 객체로 직접 변환하는 강력한 유틸리티가 포함되어 있습니다.

### JSON에서 변환

`JsonToParameters`를 사용하여 JSON 문자열을 `Parameters` 객체로 파싱합니다.

```java
import com.aspectran.utils.apon.JsonToParameters;
import com.aspectran.utils.apon.Parameters;

String json = "{\"name\":\"John\", \"age\":30, \"cars\":[\"Ford\", \"BMW\"]}";
Parameters params = JsonToParameters.from(json);

System.out.println(params.getString("name")); // John
System.out.println(params.getInt("age")); // 30
```

### XML에서 변환

`XmlToParameters`를 사용하여 XML 문서를 `Parameters` 객체로 변환합니다. XML 엘리먼트는 파라미터 이름이 되고, 속성은 중첩된 파라미터로 처리됩니다.

```java
import com.aspectran.utils.apon.XmlToParameters;
import com.aspectran.utils.apon.Parameters;

String xml = "<user><name>John</name><age>30</age></user>";
Parameters params = XmlToParameters.from(xml);

System.out.println(params.getParameters("user").getString("name")); // John
```

### Java 객체에서 변환

`ObjectToParameters`를 사용하여 JavaBean 스타일 객체를 리플렉션을 통해 프로퍼티를 읽어 `Parameters` 객체로 변환합니다.

```java
import com.aspectran.utils.apon.ObjectToParameters;
import com.aspectran.utils.apon.Parameters;

public class User {
    public String getName() { return "John"; }
    public int getAge() { return 30; }
}

User user = new User();
Parameters params = ObjectToParameters.from(user);

System.out.println(params.getString("name")); // John
System.out.println(params.getInt("age")); // 30
```

## 6. JavaScript에서 APON 활용하기 (apon.js)

웹 및 Node.js 환경에서는 공식 `apon.js` 라이브러리를 사용하여 APON 형식의 문자열을 파싱하거나 객체를 APON 문자열로 변환할 수 있습니다.

### 설치 (npm)

npm을 통해 `apon.js`를 설치할 수 있습니다.

```bash
npm install apon
```

### 관련 링크

*   **GitHub 저장소**: [https://github.com/aspectran/apon.js](https://github.com/aspectran/apon.js)
*   **라이브 데모**: [https://aspectran.github.io/apon.js/](https://aspectran.github.io/apon.js/)

자세한 API 사용법은 GitHub 저장소의 `README.md` 파일을 참고해 주세요.

## 7. 라이브러리 정보

APON 관련 클래스들은 Aspectran 프레임워크의 공통 유틸리티 패키지에 포함되어 있습니다.

*   **패키지 경로**: `com.aspectran.core.util.apon`
*   **소스 코드**: [GitHub에서 보기](https://github.com/aspectran/aspectran/tree/master/utils/src/main/java/com/aspectran/utils/apon)

{% include label-link-box.liquid label="Source" href="https://github.com/aspectran/aspectran/tree/master/utils/src/main/java/com/aspectran/utils/apon" %}
