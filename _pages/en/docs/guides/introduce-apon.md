---
title: Introduction to APON (Aspectran Parameters Object Notation)
subheadline: Core Guides
---

## 1. What is APON?

APON (Aspectran Parameters Object Notation) is a lightweight data-interchange format for representing structured data.
While it has a structure similar to JSON, it is characterized by enhanced readability, making it easy for humans to read and write, much like YAML.

APON is specifically designed to simplify the creation of configuration files for the Aspectran framework and to ensure that applications can accurately read configuration values.

### Key Features

*   **Excellent Readability**: Items are separated by newlines instead of commas (`,`), and quotes can be omitted if the value contains no spaces or special characters, resulting in concise and clear code.
*   **Explicit Type Support**: You can explicitly specify the data type for a value, ensuring the accuracy and stability of configuration values.
*   **Hierarchical Data Structure**: Braces (`{ }`) can be used to structure data hierarchically, allowing for the systematic representation of complex configurations.
*   **Long String Support**: Supports a `text` type that makes it easy to write multi-line text.
*   **Comment Support**: The `#` character can be used to add comments to the code. It must be written on a new line.

### Comparison with JSON and YAML

APON is a data format that combines features from both JSON and YAML to enhance readability and convenience. The main differences between each format are as follows.

| Category | JSON | YAML | APON |
| :--- | :--- | :--- | :--- |
| **Primary Purpose** | Data Interchange (API) | General-purpose Configuration | **Aspectran-specific Configuration** |
| **Structure Definition** | Parentheses (`{ }`, `[ ]`) | **Indentation** | Parentheses (`{ }`, `[ ]`) |
| **Item Separation** | Comma (`,`) | Newline + Indentation | **Newline** |
| **Comments** | Not supported | Supported (`#`) | Supported (`#`) |

The biggest differences are in **how the structure is defined** and **how items are separated**. APON creates an explicit structure with parentheses like JSON, but uses newlines as item separators to maximize readability. This is a distinct feature from YAML, which defines the entire structure through the combination of newlines and indentation. Also, by not using commas (`,`), APON prevents syntax errors common in JSON (like trailing comma issues) when adding or removing items, and keeps change history in version control systems (like Git) clean.

## 2. Basic Syntax

### Comments

In APON, comments must start with the `#` character on a **new line**.
**Inline comments** (adding a comment after a parameter value on the same line) are **not supported**.

This design choice avoids forcing the use of quotes when the `#` character is part of the data value (e.g., CSS color codes like `#FFFFFF` or hashtags), thereby increasing input flexibility.

```apon
# Correct usage of comments
timeout: 30

# Incorrect usage (treated as a string value, not a comment)
# The value of timeout becomes the string "30 # 30 seconds", not the number 30.
timeout: 30 # 30 seconds
```

### Single Value (Parameter)

The most basic unit in APON can have a single value in the format `name: value`.
Keys and values are separated by a colon (`:`), and the value extends from the colon to the **end of the line**.

This characteristic offers several advantages:
*   Quotes are not required even if the value contains spaces in the middle.
*   Values containing special characters, like URLs or file paths, can be written as-is without escaping.
*   There is no need to type a comma (`,`) to indicate the end of a value.

It is common to omit quotes (`"`) unless the value has the following special conditions:

*   If there are spaces at the beginning or end of the value (spaces in the middle are fine).
*   If the value contains single (`'`) or double (`"`) quotes.
*   If the value contains a newline character (`\n`).
*   If the value is an empty string.

```apon
# Example without double quotes (Value extends to the end of the line)
name: John Doe
age: 30
city: New York
url: https://example.com/api?query=value
color: #FF5733

# Example requiring double quotes
message: "'Hello, World'"
message: "First line\nNew line"
indented: "  Leading spaces"
indented: "Trailing spaces  "
empty: ""
```

### Set (Parameters)

A set of Parameters is represented by enclosing them in braces (`{ }`). It can have a hierarchical structure containing other sub-Parameters.

APON's default and most common style for root-level parameters is the "compact style," where the outermost braces are omitted. A non-compact style, where root-level parameters are enclosed in braces, also exists for JSON-like appearance but offers no functional difference.

**Example of a nested Parameters set:**
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

**Example of root-level parameters in compact style (without outermost braces):**
```apon
name: John Doe
age: 30
city: New York
```

### Array

An array is represented by putting multiple values inside square brackets (`[ ]`). Each element is separated by a newline.

APON also supports root-level arrays, which can be parsed directly into an `ArrayParameters` object.

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

**Example of a root-level array:**
```apon
[
  apple
  banana
  cherry
]
```

## 3. Data Types

APON supports various data types, and the type can be specified in the format `name(type): value`.
If the type is omitted, it is automatically determined based on the value's format. For numeric values, the parser attempts to infer the most appropriate type: integers are typically parsed as `java.lang.Integer` (or `java.lang.Long` for larger values), and numbers with decimal points are parsed as `java.lang.Double`.

**Important Note on `float`:** If you intend a decimal number to be parsed as a `java.lang.Float`, you must explicitly specify the type as `float` in the APON text (e.g., `score(float): 95.5`) or define a `ParameterKey` with `ValueType.FLOAT`. Otherwise, decimal numbers will default to `java.lang.Double`.

| Value Type | Java Object Type | Example |
| :--- | :--- |:------------------------------|
| `string` | `java.lang.String` | `name(string): Hello, World.` |
| `text` | `java.lang.String` | See the `text` type example below |
| `int` | `java.lang.Integer` | `age(int): 30` |
| `long` | `java.lang.Long` | `id(long): 12345` |
| `float` | `java.lang.Float` | `score(float): 95.5` |
| `double` | `java.lang.Double` | `pi(double): 3.14159` |
| `boolean` | `java.lang.Boolean` | `isAdmin(boolean): true` |
| `parameters` | `com.aspectran.utils.apon.Parameters` | Nested Parameter structure |

### `text` Type Usage Example

For long strings that span multiple lines, using the `text` type is convenient. It is enclosed in parentheses (`( )`), and each line is prefixed with the `|` character.

```apon
description(text): (
  |This is a multi-line text.
  |Each line starts with a pipe character.
  |Within this block, special characters like
  |"double quotes" or 'single quotes' can be used freely.
)
```

## 4. Using APON

Let's explore how to convert APON-formatted text into a Java object and vice versa.

### Defining a Schema with `Parameters` Classes

You need to define classes in Java that implement the `Parameters` interface corresponding to the APON data structure. Each class corresponds to a hierarchical level in APON, and you define the name, type, and array status of each parameter using `ParameterKey`. For more flexible parsing, you can also define alternative names (aliases) for a parameter.

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
        // Has a hierarchical structure containing other Parameters
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
        // The 'features' parameter is of string type and is an array that can hold multiple values (third argument is true)
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

### Reading APON Text (AponReader)

The `AponReader` class allows you to read an APON-formatted text file and convert it into a defined `Parameters` Java object.

**Example: Reading a root object and a root array**

```java
import com.aspectran.utils.apon.AponReader;
import com.aspectran.utils.apon.Parameters;
import com.aspectran.utils.apon.RootConfig; // Assuming RootConfig is defined as in Step 1
import com.aspectran.utils.apon.ArrayParameters; // Import ArrayParameters
import com.aspectran.utils.apon.DefaultParameters; // Import DefaultParameters

public class AponReaderTest {
    public static void main(String[] args) {
        try {
            // Example 1: Reading a root object (can be compact or non-compact style)
            String apon1 = """
                name: John Doe
                age: 30
                """;
            Parameters params1 = AponReader.read(apon1, new RootConfig());
            System.out.println("Object Name: " + params1.getString("name"));

            // Example 2: Reading a root array
            String apon2 = """
                [
                  apple
                  banana
                  cherry
                ]
                """;
            // For root arrays, you should explicitly provide an ArrayParameters instance
            ArrayParameters arrayParams = AponReader.read(apon2, new ArrayParameters());
            System.out.println("Array Content: " + arrayParams.getValueList());

            // If you provide a non-ArrayParameters object for a root array,
            // AponReader will add the array as a parameter named "" (ArrayParameters.NONAME)
            Parameters defaultParams = AponReader.read(apon2, new DefaultParameters());
            System.out.println("Array as named parameter: " + defaultParams.getValueList(ArrayParameters.NONAME));

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### Modern Parsing (AponParser)

`AponParser` provides a more efficient and intuitive alternative to `AponReader`, especially for handling multi-dimensional arrays. `AponParser` parses nested arrays directly into nested `List` objects.

**Example: Parsing a multi-dimensional array with AponParser**

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
                  [
                    a
                    b
                  ],
                  [
                    c
                    d
                    e
                  ]
                ]
                """;

            // Use AponParser to parse the string into an ArrayParameters object
            ArrayParameters rootArrayParams = AponParser.parse(apon, ArrayParameters.class);

            // AponParser correctly parses nested arrays into List<List<Object>>
            List<List<String>> matrix = (List<List<String>>)rootArrayParams.getValueList();

            System.out.println("Matrix: " + matrix);
            // Output: Matrix: [[a, b], [c, d, e]]

            // You can also parse a root object with AponParser
            String objectApon = """
                {
                  name: John Doe
                  age: 30
                }
                """;
            Parameters rootObjectParams = AponParser.parse(objectApon);
            System.out.println("Object Name: " + rootObjectParams.getString("name"));
            // Output: Object Name: John Doe

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

### Writing APON Text (AponWriter)

The `AponWriter` class makes it easy to convert a `Parameters` Java object into an APON-formatted string.

`AponWriter` works intelligently, automatically enclosing values in double quotes and performing necessary escaping when quotes are required (e.g., if the value has leading/trailing spaces, or contains quotes or newline characters). Therefore, developers only need to set the values of the `Parameters` object without worrying about the quoting rules.

By default, `AponWriter` outputs root-level parameters in "compact style" (without outermost braces). While a non-compact style (with outermost braces) can be enabled by setting the `compactStyle` property on your root `Parameters` object to `false`, this is rarely needed as it offers no functional difference.

```java
import com.aspectran.utils.apon.AponWriter;
import com.aspectran.utils.apon.Parameters;
import java.io.StringWriter;
import java.io.Writer;

public class AponWriteTest {
    public static void main(String[] args) {
        try {
            // 1. Create and set values for the Parameters object to be converted to APON
            Parameters serverConfig = new ServerConfig();
            serverConfig.putValue("name", "NewServer");
            serverConfig.putValue("port", 9090);
            serverConfig.putValue("features", new String[] {"WebService", "Security"});

            Parameters rootParams = new RootConfig(); // RootConfig contains the server parameter
            rootParams.putValue("server", serverConfig);

            // Example: Default compact style output (no outermost braces)
            String apon = new AponWriter().write(rootParams).toString();
            System.out.println("Default Compact Style Output:\n" + apon);
            // Output:
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

`AponWriter` also offers several configuration options for advanced control over the output. For example, you can disable pretty-printing for a compact output or configure how `null` values are handled.

It's important to note that even when `prettyPrint(false)` is used, newlines are not entirely removed. This is because newlines serve as fundamental delimiters for parameters and array elements in APON, unlike formats that use commas. Disabling pretty-printing primarily removes indentation.

```java
// Example of compact output (without indentation, but retaining newlines as delimiters)
String compactApon = new AponWriter().prettyPrint(false).write(rootParams).toString();
System.out.println(compactApon);
// Output: server:{
// name:NewServer
// port:9090
// features:[
// HTTP2
// SSL
// ]
// }
```

### Creating APON Programmatically (AponLines)

For situations where you need to build an APON string dynamically in your code, the `AponLines` class provides a convenient fluent API. It simplifies the process of creating nested structures and arrays without manual string concatenation.

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

**Output:**
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

## 5. Converting Other Formats to APON

The `com.aspectran.utils.apon` package includes powerful utilities to convert data from other common formats like JSON, XML, and Java objects directly into `Parameters` objects.

### From JSON

Use `JsonToParameters` to parse a JSON string into a `Parameters` object.

```java
import com.aspectran.utils.apon.JsonToParameters;
import com.aspectran.utils.apon.Parameters;

String json = "{\"name\":\"John\", \"age\":30, \"cars\":[\"Ford\", \"BMW\"]}";
Parameters params = JsonToParameters.from(json);

System.out.println(params.getString("name")); // John
System.out.println(params.getInt("age")); // 30
```

### From XML

Use `XmlToParameters` to convert an XML document into a `Parameters` object. XML elements become parameter names, and attributes are treated as nested parameters.

```java
import com.aspectran.utils.apon.XmlToParameters;
import com.aspectran.utils.apon.Parameters;

String xml = "<user><name>John</name><age>30</age></user>";
Parameters params = XmlToParameters.from(xml);

System.out.println(params.getParameters("user").getString("name")); // John
```

### From a Java Object

Use `ObjectToParameters` to convert a JavaBean-style object into a `Parameters` object by reflecting its properties.

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

For web and Node.js environments, you can use the official `apon.js` library to parse and stringify APON-formatted strings.

### Installation (npm)

You can install `apon.js` via npm:

```bash
npm install apon
```

### Resources

*   **GitHub Repository**: [https://github.com/aspectran/apon.js](https://github.com/aspectran/apon.js)
*   **Live Demo**: [https://aspectran.github.io/apon.js/](https://aspectran.github.io/apon.js/)

For detailed API usage, please refer to the `README.md` file in the GitHub repository.

## 7. Library Information

APON-related classes are included in the common utility package of the Aspectran framework.

*   **Package Path**: `com.aspectran.core.util.apon`
*   **Source Code**: [View on GitHub](https://github.com/aspectran/aspectran/tree/master/utils/src/main/java/com/aspectran/utils/apon)

{% include label-link-box.liquid label="Source" href="https://github.com/aspectran/aspectran/tree/master/utils/src/main/java/com/aspectran/utils/apon" %}
