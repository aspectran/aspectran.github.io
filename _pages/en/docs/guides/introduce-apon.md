---
title: Introduction to APON (Aspectran Parameters Object Notation)
subheadline: Core Guides
---

## 1. What is APON?

APON (Aspectran Parameters Object Notation) is a lightweight data exchange format for representing structured data. It features a structure similar to JSON while enhancing readability to be as easy to read and write as YAML.

APON is specifically designed to allow concise configuration files for the Aspectran framework and to ensure that applications can accurately read configuration values.

### Key Features

*   **Excellent Readability**: Items can be flexibly separated using line breaks or commas (`,`). If a value does not contain special characters, quotes can be omitted, making the code concise and clear.
*   **Explicit Type Support**: Data types for values can be explicitly specified, ensuring the accuracy and stability of configuration values.
*   **Hierarchical Data Structure**: Data can be organized hierarchically using curly braces (`{ }`), allowing complex settings to be expressed systematically.
*   **Long String Support**: It supports the `text` type for writing multi-line text, which can be automatically converted into an escaped single-line string depending on the situation.
*   **Inline Comment Support**: The `#` character can be used to add descriptions to code at the end of a line as well as on new lines.

### Comparison with JSON and YAML

APON is a data format that combines the features of JSON and YAML to improve readability and convenience. Key differences from each format are as follows:

| Category | JSON | YAML | APON |
| :--- | :--- | :--- | :--- |
| **Primary Purpose** | Data Exchange (API) | General Purpose Config | **Aspectran-specific Config** |
| **Structure Definition** | Braces (`{ }`, `[ ]`) | **Indentation** | Braces (`{ }`, `[ ]`) |
| **Item Separation** | Comma (`,`) | Line break + Indentation | **Line break or Comma** |
| **Comments** | Not Supported | Supported (`#`) | Supported (`#`) |

The biggest differences are the **way structures are defined** and the **way items are separated**. APON creates an explicit structure with braces like JSON, but primarily uses line breaks as item separators to maximize readability. Furthermore, using commas (`,`) allows multiple items to be listed on a single line, providing even more flexible writing. By making the use of commas optional, it prevents syntax errors that can occur when adding or deleting items and maintains a clean change history in version control systems like Git.

## 2. Basic Syntax

### Comments

In APON, a comment starts with the `#` character and continues to the end of that line. It supports **inline comments** placed immediately after a parameter value, as well as comments on new lines.

```apon
# Example of correct comment usage
timeout: 30

# Example of inline comment (description can be added immediately after the value)
timeout: 30 # 30 seconds

# If the comment symbol (#) is part of the value, quotes must be used.
color: "#FF5733"
```

**Note:** APON comments are **line-end comments**. When listing multiple items on one line, such as in the `SINGLE_LINE` style, if a `#` is inserted, all content following it is considered a comment and ignored.

### Parameter (Single Value)

The most basic unit in APON is a single value in the format `name: value`. The key and value are separated by a colon (`:`), and everything after the colon until a comment symbol (#) or the **End of Line (EOL)** is considered the value.

This feature offers the following advantages:
*   Quotes are not required even if there are spaces in the middle of the value.
*   There is no need to enter a comma (`,`) to indicate the end of a value. (Except when writing multiple items on one line)

If the value contains the following conditions, it must be enclosed in double quotes (`"`), in which case standard escape rules apply:

*   The value **starts** with a space, `{`, `[`, `(`, or `#`.
*   The **inside** of the value contains `"`, `'`, `,`, `:`, `{`, `}`, `[`, `]`, `#`, `\n`, or `\r`.
*   The value **ends** with a space.
*   The value is an empty string.

```apon
# Example without quotes (recognized as a value until the end of the line)
name: John Doe
age: 30
city: New York

# Examples where quotes are required (due to structural characters or need for escaping)
url: "https://example.com/api?query=value" # Contains a colon (:)
color: "#FF5733" # Starts with a comment symbol (#)
message: "Hello, \"Aspectran\"" # Includes quotes and needs escaping
path: "C:\\Program Files\\Aspectran" # Backslash needs escaping
indented: "  Leading spaces"
indented: "Trailing spaces  "
empty: ""
```

### Parameters (Set)

A set of parameters is enclosed in curly braces (`{ }`). It can have a hierarchical structure containing other sub-parameters.

The default and most common root-level parameter style in APON is the "compact style," where the outer curly braces are omitted. A non-compact style, where root-level parameters are enclosed in curly braces, also exists to look similar to JSON, but there is no functional difference.

**Example of nested parameters set:**
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

**Root-level parameters in compact style (no outer braces):**
```apon
name: John Doe
age: 30
city: New York
```

### Array

An array is represented by putting multiple values inside square brackets (`[ ]`).

Separators for array elements are very flexible. You can use either line breaks or commas (`,`), or even a mix of both. This flexibility makes it very convenient by reducing concerns about separator handling when adding or deleting items.

APON also supports root-level arrays, which can be parsed directly into `ArrayParameters` objects.

```apon
# Separated by line breaks only
users: [
  John
  Jane
  Peter
]

# Separated by commas only
numbers: [ 1, 2, 3 ]

# Flexible expression mixing line breaks and commas
features: [
  HTTP2,
  SSL,
  Web Sockets
]
```

**Example of a root-level array:**
```apon
[
  apple
  banana
  cherry
]
```

## 3. Data Types

APON supports various data types, and the type can be explicitly specified in the form `name(type): value`. If the type is omitted, it is automatically determined based on the format of the value. For numeric values, the parser attempts to infer the most appropriate type: integers are generally parsed as `java.lang.Integer` (or `java.lang.Long` for larger values), and numbers with a decimal point are parsed as `java.lang.Double`.

| Value Type | Java Object Type | Example |
| :--- | :--- | :--- |
| `string` | `java.lang.String` | `name(string): Hello, World.` |
| `text` | `java.lang.String` | See the `text` type example below |
| `int` | `java.lang.Integer` | `age(int): 30` |
| `long` | `java.lang.Long` | `id(long): 12345` |
| `float` | `java.lang.Float` | `score(float): 95.5` |
| `double` | `java.lang.Double` | `pi(double): 3.14159` |
| `boolean` | `java.lang.Boolean` | `isAdmin(boolean): true` |
| `parameters` | `com.aspectran.utils.apon.Parameters` | Nested Parameter structure |
| `variable` | (Determined at runtime) | Variable parameter with no fixed type |
| `object` | `java.lang.Object` | Arbitrary object with no specific type specified |

**Important Note on `float`**: To parse a decimal number as `java.lang.Float`, you must explicitly specify the type as `float` in the APON text (e.g., `score(float): 95.5`) or define a `ParameterKey` with `ValueType.FLOAT`. Otherwise, decimal numbers are treated as `java.lang.Double` by default.

### Example Using `text` Type

The `text` type is convenient for long strings consisting of multiple lines. It is enclosed in parentheses (`( )`) and each line starts with the `|` character.

```apon
description(text): (
  |This is multi-line text.
  |Each line starts with a pipe character.
  |Inside this block, special characters like "double quotes"
  |or 'single quotes' can be used freely.
)
```

**Note:** When `text` type data is output in `SINGLE_LINE` or `COMPACT` style, it is automatically converted into an escaped string containing newline characters (`"line1\nline2"`) and written on a single line.

## 4. Using APON

Learn how to convert APON-formatted text into Java objects and vice versa.

### Defining a Schema with the `Parameters` Class

To match the APON data structure, you must define a class in Java that implements the `Parameters` interface. Each class corresponds to the hierarchical structure of APON and defines the name, type, and whether it is an array for each parameter via `ParameterKey`. You can also define alternative names (aliases) for parameters for more flexible parsing.

**Example APON:**
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

**Java classes to map to the above APON:**

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
        // Has a hierarchical structure containing another Parameter
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
        // The features Parameter is of string type and is an array that can have multiple values (third argument true)
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

### Reading APON Data (AponReader)

Use `AponReader` to convert APON-formatted text into Java objects. Currently, all APON parsing is handled by `AponParser`, a high-performance engine that works character by character, and `AponReader` acts as a wrapper to make it easier to use. Specifically, `AponReader` handles multi-dimensional arrays and nested structures very intuitively as Java `List` or `Parameters` objects.

**Example: Reading objects and multi-dimensional arrays**

```java
import com.aspectran.utils.apon.AponReader;
import com.aspectran.utils.apon.Parameters;
import com.aspectran.utils.apon.ArrayParameters;
import java.util.List;

public class AponReadTest {
    public static void main(String[] args) {
        try {
            // 1. Reading an object from a string
            String apon1 = "name: John Doe, age: 30";
            Parameters params1 = AponReader.read(apon1, new RootConfig());
            System.out.println("Name: " + params1.getString("name"));

            // 2. Parsing a multi-dimensional array (using ArrayParameters)
            String apon2 = "[[a, b], [c, d, e]]";
            ArrayParameters rootArray = AponReader.read(apon2, new ArrayParameters());
            List<List<String>> matrix = (List<List<String>>)rootArray.getValueList();
            System.out.println("Matrix: " + matrix);
            // Output: Matrix: [[a, b], [c, d, e]]

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### Writing APON Data (AponWriter)

Using the `AponWriter` class, you can convert `Parameters` Java objects into APON-formatted strings. `AponWriter` automatically determines whether quotes are needed based on the content of the value and performs appropriate escaping.

In particular, you can finely control the output format through `AponRenderStyle`.

1.  **PRETTY (Default)**: Applies indentation and line breaks for human readability. The `text` type is output as a multi-line block (`|`).
2.  **SINGLE_LINE**: Outputs everything on one line while maintaining readability. Items are separated by `, `, and the `text` type is automatically converted into an escaped string (`"line1\nline2"`).
3.  **COMPACT**: Compressed output on one line with minimal spaces to maximize transmission efficiency.

**Example: Setting the output style**

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

            // Set output to SINGLE_LINE style
            serverConfig.setRenderStyle(AponRenderStyle.SINGLE_LINE);
            String result = writer.write(serverConfig).toString();
            System.out.println(result);
            // Output: name: NewServer, port: 9090, features: [ WebService, Security ]

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### Generating APON Programmatically (AponLines)

If you need to dynamically generate APON strings in code, the `AponLines` class provides a convenient fluent API. This class helps create nested structures and arrays simply without manually concatenating strings.

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

## 5. Converting to APON from Other Formats

The `com.aspectran.utils.apon` package includes powerful utilities to directly convert data from other common formats such as JSON, XML, and Java objects into `Parameters` objects.

### Conversion from JSON

Use `JsonToParameters` to parse a JSON string into a `Parameters` object.

```java
import com.aspectran.utils.apon.JsonToParameters;
import com.aspectran.utils.apon.Parameters;

String json = "{\"name\":\"John\", \"age\":30, \"cars\":[\"Ford\", \"BMW\"]}";
Parameters params = JsonToParameters.from(json);

System.out.println(params.getString("name")); // John
System.out.println(params.getInt("age")); // 30
```

### Conversion from XML

Use `XmlToParameters` to convert an XML document into a `Parameters` object. XML elements become parameter names, and attributes are treated as nested parameters.

```java
import com.aspectran.utils.apon.XmlToParameters;
import com.aspectran.utils.apon.Parameters;

String xml = "<user><name>John</name><age>30</age></user>";
Parameters params = XmlToParameters.from(xml);

System.out.println(params.getParameters("user").getString("name")); // John
```

### Conversion from Java Objects

Use `ObjectToParameters` to read properties from a JavaBean-style object via reflection and convert it into a `Parameters` object.

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

## 6. Using APON in JavaScript (apon.js)

In web and Node.js environments, you can use the official `apon.js` library to parse APON-formatted strings or convert objects into APON strings.

### Installation (npm)

You can install `apon.js` via npm.

```bash
npm install apon
```

### Related Links

*   **GitHub Repository**: [https://github.com/aspectran/apon.js](https://github.com/aspectran/apon.js)
*   **Live Demo**: [https://aspectran.github.io/apon.js/](https://aspectran.github.io/apon.js/)

For detailed API usage, please refer to the `README.md` file in the GitHub repository.

## 7. Library Information

APON-related classes are included in the common utility package of the Aspectran framework.

*   **Package Path**: `com.aspectran.utils.apon`
*   **Source Code**: [View on GitHub](https://github.com/aspectran/aspectran/tree/master/utils/src/main/java/com/aspectran/utils/apon)

{% include label-link-box.liquid label="Source" href="https://github.com/aspectran/aspectran/tree/master/utils/src/main/java/com/aspectran/utils/apon" %}
