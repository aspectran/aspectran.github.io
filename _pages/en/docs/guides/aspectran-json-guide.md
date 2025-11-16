---
title: Aspectran JSON Utilities Guide
subheadline: User Guides
---

Aspectran provides a set of lightweight, dependency-free utilities for handling JSON data. These tools allow you to parse, generate, and manipulate JSON content efficiently without needing external libraries like Jackson or Gson. This guide covers the core components and provides practical examples for their use.

## Core Concepts

Aspectran's JSON module is built around a few key classes:

- **`JsonParser`**: A simple, one-shot parser for converting a JSON string into standard Java `Map` and `List` objects.
- **`JsonReader`**: A streaming pull-parser for reading JSON token by token, ideal for large files or fine-grained processing.
- **`JsonWriter`**: A streaming writer for producing JSON text, with options for pretty-printing and custom serialization.
- **`JsonBuilder`**: A fluent API for programmatically constructing JSON objects and arrays.
- **`JsonString`**: A wrapper to embed raw, pre-formatted JSON into a `JsonWriter` stream without re-escaping.
- **`JsonToParameters`**: A utility to convert JSON text directly into Aspectran's `Parameters` objects, which is particularly useful in API development.

---

## Usage and Examples

### 1. Simple Parsing with `JsonParser`

For quick and simple use cases, `JsonParser` can convert a JSON string into a nested structure of `Map<String, Object>` and `List<Object>`.

When parsing numbers, `JsonParser` attempts to infer the most appropriate Java numeric type:
- Integers that fit within `int` range are parsed as `java.lang.Integer`.
- Larger integers are parsed as `java.lang.Long`.
- Numbers with decimal points are parsed as `java.lang.Double`.

**Example:**

```java
String json = "{\"name\":\"John Doe\",\"age\":30,\"isStudent\":false,\"bigNumber\":123456789012345,\"pi\":3.14}";
Map<String, Object> result = (Map<String, Object>)JsonParser.parse(json);

assertEquals("John Doe", result.get("name"));
assertEquals(30, result.get("age")); // Parsed as Integer
assertTrue(result.get("bigNumber") instanceof Long); // Parsed as Long
assertEquals(123456789012345L, result.get("bigNumber"));
assertTrue(result.get("pi") instanceof Double); // Parsed as Double
assertEquals(3.14, result.get("pi"));
```

### 2. Streaming with `JsonReader`

`JsonReader` is a low-level streaming parser that reads a JSON stream one token at a time. This is highly efficient for large JSON files as it doesn't load the entire content into memory.

**Example: Reading a simple object**

`JsonReader` provides specific methods like `nextInt()`, `nextLong()`, `nextDouble()`, and `nextString()` to retrieve values as their respective types. It's important to use the correct method for the expected type, as attempting to read a value with an incompatible method (e.g., `nextInt()` for a very large number or a decimal) may result in a `NumberFormatException` or `IllegalStateException`.

```java
String json = "{\"name\":\"John Doe\",\"age\":30,\"balance\":123456789012345.67,\"count\":10000000000}";
JsonReader reader = new JsonReader(new StringReader(json));

reader.beginObject();
while (reader.hasNext()) {
    String name = reader.nextName();
    switch (name) {
        case "name":
            System.out.println("Name: " + reader.nextString());
            break;
        case "age":
            System.out.println("Age: " + reader.nextInt()); // Reads as int
            break;
        case "balance":
            System.out.println("Balance: " + reader.nextDouble()); // Reads as double
            break;
        case "count":
            System.out.println("Count: " + reader.nextLong()); // Reads as long
            break;
        default:
            reader.skipValue(); // Ignore other properties
            break;
    }
}
reader.endObject();
```

#### Lenient Parsing

`JsonReader` can be configured to parse non-standard JSON (e.g., with comments, single quotes, or trailing commas) by enabling lenient mode.

```java
String lenientJson = "{ 'key': \"value\", } // Trailing comma and single quotes";
JsonReader reader = new JsonReader(new StringReader(lenientJson));
reader.setLenient(true); // Enable lenient mode

reader.beginObject();
assertEquals("key", reader.nextName());
assertEquals("value", reader.nextString());
reader.endObject();
```

### 3. Generating JSON with `JsonWriter`

`JsonWriter` provides a streaming API to build JSON strings. It supports pretty-printing for human-readable output.

**Example: Basic JSON generation**

```java
StringWriter stringWriter = new StringWriter();
JsonWriter writer = new JsonWriter(stringWriter);

writer.beginObject();
writer.name("id").value(1);
writer.name("name").value("Test Item");
writer.name("tags").beginArray().value("A").value("B").endArray();
writer.endObject();

// To get compact output, use prettyPrint(false)
// new JsonWriter(stringWriter).prettyPrint(false).value(myMap);

System.out.println(writer.toString());
```

**Output (pretty-printed):**

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

#### Advanced: Custom Serialization with `JsonSerializer`

A powerful feature of `JsonWriter` is the ability to register custom serializers for any object type. This allows for fine-grained control over serialization.

**Example: Custom serializer for `BigDecimal`**

```java
// Custom serializer to format BigDecimal as a string with two decimal places
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

// Expected output: { "price": "19.99" }
assertEquals("{\n  \"price\": \"19.99\"\n}", writer.toString().trim());
```

#### Embedding Raw JSON with `JsonString`

Sometimes, you may have a string that is already valid JSON and you want to embed it as a JSON object or array, not as a string literal. If you pass a regular string to `JsonWriter`, it will be escaped. To prevent this, wrap it in a `JsonString` object.

**Example:**

```java
String rawJson = "{\"active\":true,\"value\":100}";
JsonString jsonString = new JsonString(rawJson);

StringWriter stringWriter = new StringWriter();
JsonWriter writer = new JsonWriter(stringWriter);

writer.beginObject();
writer.name("config").value(jsonString); // Embed as raw JSON
writer.name("description").value(rawJson); // Embed as an escaped string
writer.endObject();

System.out.println(writer.toString());
```

**Output (pretty-printed):**

```json
{
  "config": {
    "active": true,
    "value": 100
  },
  "description": "{\"active\":true,\"value\":100}"
}
```

### 4. Fluent JSON Generation with `JsonBuilder`

For programmatically constructing JSON, `JsonBuilder` offers a convenient and readable fluent API. It simplifies the creation of complex objects and arrays without managing the underlying `JsonWriter` state manually.

**Example:**

```java
import com.aspectran.utils.json.JsonBuilder;

String json = new JsonBuilder()
    .object() // Root object
        .put("id", 123)
        .put("name", "Product")
        .array("tags")
            .put("A")
            .put("B")
        .endArray()
    .endObject()
    .toString();

// To get pretty-printed output, use new JsonBuilder().prettyPrint(true)
System.out.println(json);
```

**Output (compact):**

```json
{"id":123,"name":"Product","tags":["A","B"]}
```

### 5. Practical Guide: JSON in Aspectran APIs

In a typical Aspectran API, you often need to convert an incoming JSON request body into a `Parameters` object to work with it inside your translets. The `JsonToParameters` utility is designed for this exact purpose.

#### Basic Conversion

For simple cases, you can convert a JSON string into a `VariableParameters` object, which is flexible and does not require a predefined structure.

**Example:**

```java
String jsonRequestBody = "{\"userId\": 123, \"query\":\"test\"}";

// Convert JSON to a VariableParameters object
Parameters params = JsonToParameters.from(jsonRequestBody);

int userId = params.getInt("userId");
String query = params.getString("query");

assertEquals(123, userId);
assertEquals("test", query);
```

#### Type-Safe Conversion with Typed Parameters

For more robust and type-safe handling, you can define a class that extends `DefaultParameters` and specifies the expected parameters and their types. This is highly recommended as it prevents runtime type errors.

**Example: Using a typed `Parameters` object**

First, define your typed `Parameters` class:

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

Now, use `JsonToParameters` to parse the JSON directly into your typed object. This works even for `float` types because the parser respects the predefined `ValueType`.

```java
String jsonRequestBody = "{\"userId\": 456, \"query\":\"advanced\", \"maxResults\":50.5}";

// Convert JSON into your specific SearchQuery object
SearchQuery searchQuery = JsonToParameters.from(jsonRequestBody, SearchQuery.class);

assertEquals(456, searchQuery.getUserId());
assertEquals("advanced", searchQuery.getQuery());
assertEquals(50.5f, searchQuery.getMaxResults());
```

This approach provides compile-time safety and makes your code cleaner and more maintainable when handling JSON payloads in your Aspectran applications.
