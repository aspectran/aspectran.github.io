---
title: Introduction to APON (Aspectran Parameters Object Notation)
subheadline: User Guides
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

The biggest differences are in **how the structure is defined** and **how items are separated**. APON creates an explicit structure with parentheses like JSON, but uses newlines as item separators to maximize readability. This is a distinct feature from YAML, which defines the entire structure through the combination of newlines and indentation.

## 2. Basic Syntax

### Single Value (Parameter)

The most basic unit in APON can have a single value in the format `name: value`.
It is common to omit quotes (`"`) unless the value has the following special conditions:

*   If there are spaces at the beginning or end of the value.
*   If the value contains single (`'`) or double (`"`) quotes.
*   If the value contains a newline character (`\n`).

```apon
# Example without double quotes
name: John Doe
age: 30
city: New York

# Example requiring double quotes
message: "'Hello, World'"
message: "First line\nNew line"
indented: "  Leading spaces"
indented: "Trailing spaces  "
```

### Set (Parameters)

A set of Parameters is represented by enclosing them in braces (`{ }`). It can have a hierarchical structure containing other sub-Parameters.

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

### Array

An array is represented by putting multiple values inside square brackets (`[ ]`). Each element is separated by a newline.

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

## 3. Data Types

APON supports various data types, and the type can be specified in the format `name(type): value`.
If the type is omitted, it is automatically determined based on the value's format.

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

### Step 1: Define Java Parameters Classes to Map to APON

You need to define classes in Java that implement the `Parameters` interface corresponding to the APON data structure. Each class corresponds to a hierarchical level in APON, and you define the name, type, and array status of each parameter using `ParameterKey`.

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

### Step 2: Reading an APON File (AponReader)

The `AponReader` class allows you to read an APON-formatted text file and convert it into a defined `Parameters` Java object.

```java
import com.aspectran.utils.apon.AponReader;
import com.aspectran.utils.apon.Parameters;
import java.io.FileReader;
import java.io.Reader;

public class AponTest {
    public static void main(String[] args) {
        try {
            // 1. Create a Reader to read the APON file
            Reader fileReader = new FileReader("root-config.apon");

            // 2. Create a top-level Parameters object defined according to the APON structure
            Parameters rootParams = new RootConfig(); // RootConfig contains the server parameter

            // 3. Use AponReader to read the file content into the Parameters object
            AponReader.read(fileReader, rootParams);

            // 4. Use the converted object
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

### Step 3: Creating an APON File (AponWriter)

The `AponWriter` class makes it easy to convert a `Parameters` Java object into an APON-formatted string.

`AponWriter` works intelligently, automatically enclosing values in double quotes and performing necessary escaping when quotes are required (e.g., if the value has leading/trailing spaces, or contains quotes or newline characters). Therefore, developers only need to set the values of the `Parameters` object without worrying about the quoting rules.

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

            // 2. Create a Writer to store the APON text
            Writer writer = new StringWriter();

            // 3. Use AponWriter to write the Parameters object in APON format
            try (AponWriterCloseable aponWriter = new AponWriterCloseable(writer)) {
                aponWriter.write(rootParams);
            }

            // 4. Print the converted APON string
            System.out.println(writer);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

**Output Result:**
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

## 5. Using APON in JavaScript (apon.js)

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

## 6. Library Information

APON-related classes are included in the common utility package of the Aspectran framework.

*   **Package Path**: `com.aspectran.core.util.apon`
*   **Source Code**: [View on GitHub](https://github.com/aspectran/aspectran/tree/master/utils/src/main/java/com/aspectran/utils/apon)

{% include label-link-box.liquid label="Source" href="https://github.com/aspectran/aspectran/tree/master/utils/src/main/java/com/aspectran/utils/apon" %}
