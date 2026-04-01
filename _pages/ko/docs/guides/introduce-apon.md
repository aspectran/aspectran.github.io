---
title: APON(Aspectran Parameters Object Notation) 소개
subheadline: 핵심 가이드
---

## 1. APON 이란?

APON(Aspectran Parameters Object Notation)은 구조화된 데이터를 표현하기 위한 경량 데이터 교환 형식입니다.
JSON과 유사한 구조를 가지면서도, YAML처럼 사람이 쉽게 읽고 쓸 수 있도록 가독성을 높인 것이 특징입니다.

APON은 특히 Aspectran 프레임워크의 설정 파일을 간결하게 작성하고, 애플리케이션이 설정 값을 정확하게 읽어 들일 수 있도록 설계되었습니다.

### 주요 특징

*   **뛰어난 가독성**: 줄바꿈이나 쉼표(`,`)를 사용하여 항목을 유연하게 구분할 수 있습니다. 값에 특수문자가 없다면 따옴표를 생략할 수 있어 코드가 간결하고 명확합니다.
*   **명시적 타입 지원**: 값(Value)에 대한 데이터 타입을 직접 명시할 수 있어, 설정 값의 정확성과 안정성을 보장합니다.
*   **계층적 데이터 구조**: 중괄호(`{ }`)를 사용하여 데이터를 계층적으로 구성할 수 있어 복잡한 설정도 체계적으로 표현할 수 있습니다.
*   **긴 문자열 지원**: 여러 줄로 이루어진 텍스트를 작성할 수 있는 `text` 타입을 지원하며, 상황에 따라 이스케이프된 한 줄 문자열로 자동 변환될 수 있습니다.
*   **인라인 주석 지원**: `#` 문자를 사용하여 새로운 라인은 물론 기존 라인의 끝에도 코드에 대한 설명을 추가할 수 있습니다.

### JSON, YAML과의 비교

APON은 JSON과 YAML의 특징을 조합하여 가독성과 편의성을 높인 데이터 형식입니다. 각 형식과의 주요 차이점은 다음과 같습니다.

| 구분 | JSON | YAML | APON |
| :--- | :--- | :--- | :--- |
| **주요 목적** | 데이터 교환 (API) | 범용 설정 파일 | **Aspectran 전용 설정** |
| **구조 정의** | 괄호 (`{ }`, `[ ]`) | **들여쓰기** | 괄호 (`{ }`, `[ ]`) |
| **항목 구분** | 쉼표 (`,`) | 줄바꿈 + 들여쓰기 | **줄바꿈 또는 쉼표** |
| **주석** | 미지원 | 지원 (`#`) | 지원 (`#`) |

가장 큰 차이점은 **구조를 정의하는 방식**과 **항목을 구분하는 방식**입니다. APON은 JSON처럼 괄호로 명시적인 구조를 만들지만, 항목 구분자로는 줄바꿈을 주로 사용하여 가독성을 극대화합니다. 또한 쉼표(`,`)를 사용하여 한 줄에 여러 항목을 나열할 수 있어 더욱 유연한 작성이 가능합니다. 콤마(`,`) 사용 여부를 선택할 수 있게 함으로써 항목을 추가하거나 삭제할 때 발생할 수 있는 문법 오류를 방지하고, 버전 관리 시스템(Git 등)에서의 변경 이력을 깔끔하게 유지할 수 있습니다.

## 2. 기본 문법

### 주석 (Comments)

APON에서 주석은 `#` 문자로 시작하며, 해당 라인의 끝까지를 주석으로 처리합니다.
새로운 라인뿐만 아니라 파라미터 값 뒤에 붙는 **인라인 주석(Inline Comment)**도 지원합니다.

```apon
# 올바른 주석 사용 예
timeout: 30

# 인라인 주석 사용 예 (값 뒤에 바로 설명 추가 가능)
timeout: 30 # 30 seconds

# 주석 기호(#)가 값의 일부인 경우 반드시 따옴표를 사용해야 합니다.
color: "#FF5733"
```

**주의:** APON의 주석은 **Line-end 주석**입니다. `SINGLE_LINE` 스타일처럼 한 줄에 여러 항목을 나열할 때 중간에 `#`이 들어가면 그 뒤의 모든 내용은 주석으로 간주되어 무시됩니다.

### 단일 값 (Parameter)

APON의 가장 기본적인 단위는 `이름: 값` 형식의 단일 값을 가질 수 있습니다.
키와 값은 콜론(`:`)으로 구분되며, 콜론 이후부터 주석 기호(#)나 **행의 끝(End of Line)** 전까지가 모두 값으로 간주됩니다.

이러한 특징 덕분에 다음과 같은 장점이 있습니다.
*   값 중간에 공백이 있어도 따옴표가 필요 없습니다.
*   값의 끝을 알리기 위해 콤마(`,`)를 입력할 필요가 없습니다. (단, 한 줄에 여러 항목 작성 시에는 필요)

값(Value)에 다음과 같은 조건이 포함된 경우 반드시 따옴표(`"`)로 감싸야 하며, 이 경우 표준 이스케이프 규칙이 적용됩니다.

*   값의 **시작**이 공백, `{`, `[`, `(`, `#` 인 경우
*   값의 **내부**에 `"`, `'`, `,`, `:`, `{`, `}`, `[`, `]`, `#`, `\n`, `\r` 등이 포함된 경우
*   값의 **끝**이 공백인 경우
*   값이 빈 문자열인 경우

```apon
# 따옴표를 사용하지 않은 예 (행 끝까지 값으로 인식)
name: John Doe
age: 30
city: New York

# 따옴표를 사용해야 하는 예 (구조적 문자나 이스케이프가 필요한 경우)
url: "https://example.com/api?query=value" # 콜론(:)이 포함된 경우
color: "#FF5733" # 주석 기호(#)로 시작하는 경우
message: "Hello, \"Aspectran\"" # 따옴표 포함 및 이스케이프 필요
path: "C:\\Program Files\\Aspectran" # 백슬래시 이스케이프 필요
indented: "  앞에 공백이 있음"
indented: "뒤에 공백이 있음  "
empty: ""
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

배열은 대괄호(`[ ]`) 안에 여러 값을 넣어 표현합니다.

배열 요소의 구분자는 매우 유연합니다. 줄바꿈이나 쉼표(`,`) 중 하나를 사용하거나, 두 가지를 혼용하여 사용할 수도 있습니다. 이러한 유연성 덕분에 항목을 추가하거나 삭제할 때 구분자 처리에 대한 고민을 덜어주어 매우 편리합니다.

APON은 또한 루트 레벨 배열을 지원하며, 이는 `ArrayParameters` 객체로 직접 파싱될 수 있습니다.

```apon
# 줄바꿈으로만 구분
users: [
  John
  Jane
  Peter
]

# 쉼표로만 구분
numbers: [ 1, 2, 3 ]

# 줄바꿈과 쉼표를 혼용한 유연한 표현
features: [
  HTTP2,
  SSL,
  Web Sockets
]
```

**루트 레벨 배열의 예:**
```apon
[
  apple
  banana
  cherry
]
```

## 3. 데이터 타입

APON은 다양한 데이터 타입을 지원하며, `이름(타입): 값`의 형태로 타입을 명시할 수 있습니다.
타입을 생략하면 값의 형태에 따라 자동으로 타입이 결정됩니다. 숫자 값의 경우, 파서는 가장 적절한 유형을 추론하려고 시도합니다: 정수는 일반적으로 `java.lang.Integer`(더 큰 값의 경우 `java.lang.Long`)로 파싱되며, 소수점이 있는 숫자는 `java.lang.Double`로 파싱됩니다.

| Value Type | Java Object Type | 예시 |
| :--- | :--- | :--- |
| `string` | `java.lang.String` | `name(string): Hello, World.` |
| `text` | `java.lang.String` | 아래 `text` 타입 예제 참조 |
| `int` | `java.lang.Integer` | `age(int): 30` |
| `long` | `java.lang.Long` | `id(long): 12345` |
| `float` | `java.lang.Float` | `score(float): 95.5` |
| `double` | `java.lang.Double` | `pi(double): 3.14159` |
| `boolean` | `java.lang.Boolean` | `isAdmin(boolean): true` |
| `parameters` | `com.aspectran.utils.apon.Parameters` | 중첩된 Parameter 구조 |
| `variable` | (런타임 결정) | 타입이 고정되지 않은 가변 파라미터 |
| `object` | `java.lang.Object` | 특정 타입이 지정되지 않은 임의의 객체 |

**`float`에 대한 중요 참고 사항:** 소수점 숫자를 `java.lang.Float`로 파싱하려면 APON 텍스트에서 `float`로 명시적으로 타입을 지정하거나(예: `score(float): 95.5`) `ValueType.FLOAT`를 가진 `ParameterKey`를 정의해야 합니다. 그렇지 않으면 소수점 숫자는 기본적으로 `java.lang.Double`로 처리됩니다.

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

**참고:** `text` 타입 데이터를 `SINGLE_LINE`이나 `COMPACT` 스타일로 출력하면, 자동으로 개행 문자가 포함된 이스케이프 문자열(`"line1\nline2"`)로 변환되어 한 줄로 작성됩니다.

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

### APON 데이터 읽기 (AponReader)

APON 형식의 텍스트를 자바 객체로 변환하기 위해 `AponReader`를 사용합니다. 현재 APON의 모든 파싱은 문자 단위의 고성능 엔진인 `AponParser`가 담당하며, `AponReader`는 이를 편리하게 사용할 수 있도록 도와주는 래퍼 역할을 합니다. 특히 `AponReader`는 다차원 배열 및 중첩 구조를 자바의 `List` 또는 `Parameters` 객체로 매우 직관적으로 처리합니다.

**예제: 객체 및 다차원 배열 읽기**

```java
import com.aspectran.utils.apon.AponReader;
import com.aspectran.utils.apon.Parameters;
import com.aspectran.utils.apon.ArrayParameters;
import java.util.List;

public class AponReadTest {
    public static void main(String[] args) {
        try {
            // 1. 문자열로부터 객체 읽기
            String apon1 = "name: John Doe, age: 30";
            Parameters params1 = AponReader.read(apon1, new RootConfig());
            System.out.println("Name: " + params1.getString("name"));

            // 2. 다차원 배열 파싱 (ArrayParameters 활용)
            String apon2 = "[[a, b], [c, d, e]]";
            ArrayParameters rootArray = AponReader.read(apon2, new ArrayParameters());
            List<List<String>> matrix = (List<List<String>>)rootArray.getValueList();
            System.out.println("Matrix: " + matrix);
            // 출력: Matrix: [[a, b], [c, d, e]]

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### APON 데이터 작성하기 (AponWriter)

`AponWriter` 클래스를 사용하면 `Parameters` 자바 객체를 APON 형식의 문자열로 변환할 수 있습니다. `AponWriter`는 값의 내용에 따라 따옴표 필요 여부를 자동으로 판단하고 적절한 이스케이프 처리를 수행합니다.

특히 `AponRenderStyle`을 통해 출력 형식을 세밀하게 제어할 수 있습니다.

1.  **PRETTY (기본값)**: 사람이 읽기 좋게 들여쓰기와 줄바꿈을 적용합니다. `text` 타입은 멀티라인 블록(`|`)으로 출력됩니다.
2.  **SINGLE_LINE**: 가독성을 유지하면서 모든 내용을 한 줄로 출력합니다. 항목은 `, `로 구분되며, `text` 타입은 이스케이프된 문자열(`"line1\nline2"`)로 자동 변환됩니다.
3.  **COMPACT**: 전송 효율을 극대화하기 위해 공백을 최소화하여 한 줄로 압축 출력합니다.

**예제: 출력 스타일 설정**

```java
import com.aspectran.utils.apon.AponWriter;
import com.aspectran.utils.apon.AponRenderStyle;
import com.aspectran.utils.apon.Parameters;

public class AponWriteTest {
    public static void main(String[] args) {
        try {
            Parameters serverConfig = new ServerConfig();
            serverConfig.putValue("name", "NewServer");
            serverConfig.putValue("port", 9090);
            serverConfig.putValue("features", new String[] {"WebService", "Security"});

            AponWriter writer = new AponWriter();

            // SINGLE_LINE 스타일로 출력 설정
            serverConfig.setRenderStyle(AponRenderStyle.SINGLE_LINE);
            String result = writer.write(serverConfig).toString();
            System.out.println(result);
            // 출력: name: NewServer, port: 9090, features: [ WebService, Security ]

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
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

*   **패키지 경로**: `com.aspectran.utils.apon`
*   **소스 코드**: [GitHub에서 보기](https://github.com/aspectran/aspectran/tree/master/utils/src/main/java/com/aspectran/utils/apon)

{% include label-link-box.liquid label="Source" href="https://github.com/aspectran/aspectran/tree/master/utils/src/main/java/com/aspectran/utils/apon" %}
