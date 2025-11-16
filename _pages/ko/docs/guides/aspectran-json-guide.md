---
title: Aspectran JSON 유틸리티 가이드
subheadline: 사용자 가이드
---

Aspectran은 JSON 데이터를 처리하기 위한 경량의, 의존성 없는 유틸리티 세트를 제공합니다. 이 도구들을 사용하면 Jackson이나 Gson과 같은 외부 라이브러리 없이도 JSON 콘텐츠를 효율적으로 파싱, 생성 및 조작할 수 있습니다. 이 가이드에서는 핵심 구성 요소와 실제 사용 예제를 다룹니다.

## 핵심 개념

Aspectran의 JSON 모듈은 몇 가지 주요 클래스를 중심으로 구성됩니다:

- **`JsonParser`**: JSON 문자열을 표준 Java `Map` 및 `List` 객체로 변환하는 간단한 일회성 파서입니다.
- **`JsonReader`**: JSON을 토큰 단위로 읽는 스트리밍 풀 파서로, 대용량 파일이나 세밀한 처리에 이상적입니다.
- **`JsonWriter`**: JSON 텍스트를 생성하는 스트리밍 라이터로, 예쁜 출력(pretty-printing) 및 커스텀 직렬화 옵션을 제공합니다.
- **`JsonBuilder`**: 프로그래밍 방식으로 JSON 객체와 배열을 생성하기 위한 fluent API입니다.
- **`JsonString`**: 미리 포맷된 원시(raw) JSON을 재이스케이프하지 않고 `JsonWriter` 스트림에 포함시키기 위한 래퍼입니다.
- **`JsonToParameters`**: JSON 텍스트를 Aspectran의 `Parameters` 객체로 직접 변환하는 유틸리티로, API 개발에 특히 유용합니다.

---

## 사용법 및 예제

### 1. `JsonParser`를 사용한 간단한 파싱

빠르고 간단한 사용 사례의 경우, `JsonParser`는 JSON 문자열을 `Map<String, Object>` 및 `List<Object>`의 중첩된 구조로 변환할 수 있습니다.

숫자를 파싱할 때 `JsonParser`는 가장 적절한 Java 숫자 유형을 추론하려고 시도합니다:
- `int` 범위 내의 정수는 `java.lang.Integer`로 파싱됩니다.
- 더 큰 정수는 `java.lang.Long`으로 파싱됩니다.
- 소수점이 있는 숫자는 `java.lang.Double`로 파싱됩니다.

**예제:**

```java
String json = "{\"name\":\"John Doe\",\"age\":30,\"isStudent\":false,\"bigNumber\":123456789012345,\"pi\":3.14}";
Map<String, Object> result = (Map<String, Object>)JsonParser.parse(json);

assertEquals("John Doe", result.get("name"));
assertEquals(30, result.get("age")); // Integer로 파싱됨
assertTrue(result.get("bigNumber") instanceof Long); // Long으로 파싱됨
assertEquals(123456789012345L, result.get("bigNumber"));
assertTrue(result.get("pi") instanceof Double); // Double로 파싱됨
assertEquals(3.14, result.get("pi"));
```

### 2. `JsonReader`를 사용한 스트리밍

`JsonReader`는 JSON 스트림을 한 번에 하나의 토큰씩 읽는 저수준 스트리밍 파서입니다. 이는 전체 콘텐츠를 메모리에 로드하지 않으므로 대용량 JSON 파일에 매우 효율적입니다.

**예제: 간단한 객체 읽기**

`JsonReader`는 `nextInt()`, `nextLong()`, `nextDouble()`, `nextString()`과 같은 특정 메서드를 제공하여 값을 해당 유형으로 검색합니다. 예상되는 유형에 맞는 올바른 메서드를 사용하는 것이 중요합니다. 호환되지 않는 메서드로 값을 읽으려고 시도하면(예: 매우 큰 숫자나 소수를 `nextInt()`로 읽으려고 시도) `NumberFormatException` 또는 `IllegalStateException`이 발생할 수 있습니다.

```java
String json = "{\"name\":\"John Doe\",\"age\":30,\"balance\":123456789012345.67,\"count\":10000000000}";
JsonReader reader = new JsonReader(new StringReader(json));

reader.beginObject();
while (reader.hasNext()) {
    String name = reader.nextName();
    switch (name) {
        case "name":
            System.out.println("이름: " + reader.nextString());
            break;
        case "age":
            System.out.println("나이: " + reader.nextInt()); // int로 읽음
            break;
        case "balance":
            System.out.println("잔액: " + reader.nextDouble()); // double로 읽음
            break;
        case "count":
            System.out.println("개수: " + reader.nextLong()); // long으로 읽음
            break;
        default:
            reader.skipValue(); // 다른 속성은 무시
            break;
    }
}
reader.endObject();
```

#### 관대한 파싱 (Lenient Parsing)

`JsonReader`는 관대한 모드를 활성화하여 비표준 JSON(예: 주석, 작은따옴표, 후행 쉼표 포함)을 파싱하도록 구성할 수 있습니다.

```java
String lenientJson = "{ 'key': \"value\", } // 후행 쉼표와 작은따옴표";
JsonReader reader = new JsonReader(new StringReader(lenientJson));
reader.setLenient(true); // 관대한 모드 활성화

reader.beginObject();
assertEquals("key", reader.nextName());
assertEquals("value", reader.nextString());
reader.endObject();
```

### 3. `JsonWriter`를 사용한 JSON 생성

`JsonWriter`는 JSON 문자열을 빌드하기 위한 스트리밍 API를 제공합니다. 가독성을 높이기 위한 예쁜 출력(pretty-printing)을 지원합니다.

**예제: 기본 JSON 생성**

```java
StringWriter stringWriter = new StringWriter();
JsonWriter writer = new JsonWriter(stringWriter);

writer.beginObject();
writer.name("id").value(1);
writer.name("name").value("Test Item");
writer.name("tags").beginArray().value("A").value("B").endArray();
writer.endObject();

// 압축된 출력을 얻으려면 prettyPrint(false)를 사용합니다.
// new JsonWriter(stringWriter).prettyPrint(false).value(myMap);

System.out.println(writer.toString());
```

**출력 (예쁜 출력):**

```json
{
  "id": 1,
  "name": "Test Item",
  "tags": [
    "A",
    "B"
  ]
}
```

#### 고급: `JsonSerializer`를 사용한 커스텀 직렬화

`JsonWriter`의 강력한 기능 중 하나는 모든 객체 유형에 대한 커스텀 직렬 변환기를 등록하는 기능입니다. 이를 통해 직렬화에 대한 세밀한 제어가 가능합니다.

**예제: `BigDecimal`을 위한 커스텀 직렬 변환기**

```java
// BigDecimal을 소수점 이하 두 자리 문자열로 포맷하는 커스텀 직렬 변환기
JsonSerializer<BigDecimal> bigDecimalSerializer = (value, writer) -> {
    writer.value(value.setScale(2, RoundingMode.HALF_UP).toPlainString());
};

BigDecimal price = new BigDecimal("19.991");

StringWriter stringWriter = new StringWriter();
JsonWriter writer = new JsonWriter(stringWriter);
writer.registerSerializer(BigDecimal.class, bigDecimalSerializer);

writer.beginObject();
writer.name("price").value(price);
writer.endObject();

// 예상 출력: { "price": "19.99" }
assertEquals("{\n  \"price\": \"19.99\"\n}", writer.toString().trim());
```

#### `JsonString`으로 원시(Raw) JSON 포함하기

때로는 이미 유효한 JSON 형식의 문자열이 있고, 이를 문자열 리터럴이 아닌 JSON 객체나 배열로 포함하고 싶을 때가 있습니다. 일반 문자열을 `JsonWriter`에 전달하면 이스케이프 처리됩니다. 이를 방지하려면 `JsonString` 객체로 감싸면 됩니다.

**예제:**

```java
String rawJson = "{\"active\":true,\"value\":100}";
JsonString jsonString = new JsonString(rawJson);

StringWriter stringWriter = new StringWriter();
JsonWriter writer = new JsonWriter(stringWriter);

writer.beginObject();
writer.name("config").value(jsonString); // 원시 JSON으로 포함
writer.name("description").value(rawJson); // 이스케이프된 문자열로 포함
writer.endObject();

System.out.println(writer.toString());
```

**출력 (예쁜 출력):**

```json
{
  "config": {
    "active": true,
    "value": 100
  },
  "description": "{\"active\":true,\"value\":100}"
}
```

### 4. `JsonBuilder`를 사용한 Fluent JSON 생성

프로그래밍 방식으로 JSON을 구성할 때 `JsonBuilder`는 편리하고 가독성 높은 fluent API를 제공합니다. 내부 `JsonWriter`의 상태를 수동으로 관리할 필요 없이 복잡한 객체와 배열을 간단하게 생성할 수 있습니다.

**예제:**

```java
import com.aspectran.utils.json.JsonBuilder;

String json = new JsonBuilder()
    .object() // 루트 객체
        .put("id", 123)
        .put("name", "Product")
        .array("tags")
            .put("A")
            .put("B")
        .endArray()
    .endObject()
    .toString();

// 예쁘게 출력된 결과를 얻으려면 new JsonBuilder().prettyPrint(true)를 사용하세요.
System.out.println(json);
```

**출력 (압축):**

```json
{"id":123,"name":"Product","tags":["A","B"]}
```

### 5. 실용 가이드: Aspectran API에서의 JSON

일반적인 Aspectran API에서는 들어오는 JSON 요청 본문을 `Parameters` 객체로 변환하여 트랜슬릿(translet) 내부에서 작업해야 하는 경우가 많습니다. `JsonToParameters` 유틸리티는 바로 이러한 목적을 위해 설계되었습니다.

#### 기본 변환

간단한 경우, JSON 문자열을 `VariableParameters` 객체로 변환할 수 있습니다. 이는 유연하며 미리 정의된 구조를 필요로 하지 않습니다.

**예제:**

```java
String jsonRequestBody = "{\"userId\": 123, \"query\":\"test\"}";

// JSON을 VariableParameters 객체로 변환
Parameters params = JsonToParameters.from(jsonRequestBody);

int userId = params.getInt("userId");
String query = params.getString("query");

assertEquals(123, userId);
assertEquals("test", query);
```

#### 타입이 지정된 Parameters를 사용한 타입 안전 변환

더 견고하고 타입 안전한 처리를 위해 `DefaultParameters`를 확장하고 예상되는 파라미터와 해당 타입을 지정하는 클래스를 정의할 수 있습니다. 이는 런타임 타입 오류를 방지하므로 강력히 권장됩니다.

**예제: 타입이 지정된 `Parameters` 객체 사용**

먼저, 타입이 지정된 `Parameters` 클래스를 정의합니다:

```java
public class SearchQuery extends DefaultParameters {
    private static final ParameterKey userId = new ParameterKey("userId", ValueType.INT);
    private static final ParameterKey query = new ParameterKey("query", ValueType.STRING);
    private static final ParameterKey maxResults = new ParameterKey("maxResults", ValueType.FLOAT);

    private static final ParameterKey[] parameterKeys = { userId, query, maxResults };

    public SearchQuery() {
        super(parameterKeys);
    }

    public int getUserId() { return getInt(userId); }
    public String getQuery() { return getString(query); }
    public float getMaxResults() { return getFloat(maxResults); }
}
```

이제 `JsonToParameters`를 사용하여 JSON을 타입이 지정된 객체로 직접 파싱합니다. 파서가 미리 정의된 `ValueType`을 존중하므로 `float` 유형에도 작동합니다.

```java
String jsonRequestBody = "{\"userId\": 456, \"query\":\"advanced\", \"maxResults\":50.5}";

// JSON을 특정 SearchQuery 객체로 변환
SearchQuery searchQuery = JsonToParameters.from(jsonRequestBody, SearchQuery.class);

assertEquals(456, searchQuery.getUserId());
assertEquals("advanced", searchQuery.getQuery());
assertEquals(50.5f, searchQuery.getMaxResults());
```

이 접근 방식은 Aspectran 애플리케이션에서 JSON 페이로드를 처리할 때 컴파일 타임 안전성을 제공하고 코드를 더 깔끔하고 유지보수하기 쉽게 만듭니다.
