---
format: plate solid article
sidebar: toc
title: Guide to Integrating Legacy Systems with Modern Aspectran Application Servers
subheadline: Practical Guides
parent_path: /docs
---

## Introduction

Existing legacy systems often face challenges when integrating with applications developed using modern technology stacks. In the Java development environment, in particular, library compatibility issues can arise due to differences in JDK versions. The Aspectran framework provides the `aspectran-utils-legacy` module to address these problems. This document guides you on how legacy systems using JDK versions below 21 can efficiently call APIs and process responses from modern Aspectran application servers.

## Purpose of the `aspectran-utils-legacy` Module

The `aspectran-utils-legacy` module acts as a Compatibility Layer to support seamless API calls and response processing between legacy systems using Java versions from JDK 1.6 to JDK 17, and modern Aspectran application servers running on JDK 21 or higher. This module provides utility functions necessary for communication with modern Aspectran servers in a legacy environment, helping to integrate without extensive modifications to existing code.

**Note:** For systems using JDK 21 or higher, there is no need to use the separate `aspectran-utils-legacy` module; you can directly use the standard `aspectran-utils` module.

## Key Features and Benefits

*   **Broad JDK Compatibility:** Supports various legacy Java environments from JDK 1.6 to JDK 17, allowing older systems to integrate with modern Aspectran servers.
*   **Simplified API Calls:** Provides functions to easily serialize and deserialize data in JSON or APON (Aspectran Object Notation) formats, simplifying API request and response processing.
*   **Secure Communication Support:** Utilizes utilities like `PBEncryptionUtils` to securely encrypt and decrypt sensitive data in configuration files or within data itself.
*   **Minimal Legacy Code Changes:** Designed to add integration capabilities with modern Aspectran servers with minimal changes to the existing codebase of legacy systems.

## How to Use the Module

### 1. Adding Dependencies

For Maven projects, add the following dependency to your `pom.xml` file:

```xml
<dependency>
    <groupId>com.aspectran</groupId>
    <artifactId>aspectran-utils-legacy</artifactId>
    <version>1.0.0-SNAPSHOT</version> <!-- Adjust to the actual version -->
</dependency>
```

For Gradle projects, add the following dependency to your `build.gradle` file:

```gradle
implementation 'com.aspectran:aspectran-utils-legacy:1.0.0-SNAPSHOT' // Adjust to the actual version
```

### 2. Basic Usage Examples

The `aspectran-utils-legacy` module primarily supports communication with modern Aspectran servers through data serialization/deserialization and other utility functions.

#### JSON Data Processing Example

When sending or receiving JSON data to/from a modern Aspectran server from a legacy system, you can use `JsonWriter` and `JsonReader`.

```java
import com.aspectran.utils.json.JsonWriter;
import com.aspectran.utils.json.JsonReader;
import com.aspectran.utils.apon.Parameters;
import com.aspectran.utils.apon.VariableParameters;

import java.io.StringWriter;
import java.io.IOException;

public class LegacyApiCaller {

    public static void main(String[] args) throws IOException {
        // 1. Create data to send to the modern Aspectran server (JSON Serialization)
        Parameters requestParams = new VariableParameters();
        requestParams.putValue("userId", "legacyUser");
        requestParams.putValue("data", "hello from legacy");

        StringWriter stringWriter = new StringWriter();
        JsonWriter jsonWriter = new JsonWriter(stringWriter);
        jsonWriter.write(requestParams); // Convert Parameters object to JSON string
        String jsonRequest = stringWriter.toString();

        System.out.println("Generated JSON Request: " + jsonRequest);

        // 2. Process JSON response received from the modern Aspectran server (JSON Deserialization)
        String jsonResponse = "{\"status\":\"success\",\"message\":\"Data received!\"}";
        JsonReader jsonReader = new JsonReader(jsonResponse);
        Parameters responseParams = new VariableParameters();
        jsonReader.read(responseParams); // Convert JSON string to Parameters object

        System.out.println("Received Status: " + responseParams.getString("status"));
        System.out.println("Received Message: " + responseParams.getString("message"));
    }
}
```

#### APON Data Processing Example

APON format is a lightweight data representation used internally within the Aspectran framework. You can also process data using APON if needed.

```java
import com.aspectran.utils.apon.AponWriter;
import com.aspectran.utils.apon.AponReader;
import com.aspectran.utils.apon.Parameters;
import com.aspectran.utils.apon.VariableParameters;

import java.io.IOException;
import java.io.StringWriter;

public class LegacyAponApiCaller {

    public static void main(String[] args) throws IOException {
        // 1. Create data to send to the modern Aspectran server (APON Serialization)
        Parameters requestParams = new VariableParameters();
        requestParams.putValue("action", "processOrder");
        requestParams.putValue("orderId", 12345);

        StringWriter stringWriter = new StringWriter();
        AponWriter aponWriter = new AponWriter(stringWriter);
        aponWriter.write(requestParams); // Convert Parameters object to APON string
        String aponRequest = stringWriter.toString();

        System.out.println("Generated APON Request:\n" + aponRequest);

        // 2. Process APON response received from the modern Aspectran server (APON Deserialization)
        String aponResponse = "status: success\nmessage: Order processed successfully\n";
        AponReader aponReader = new AponReader(aponResponse);
        Parameters responseParams = new VariableParameters();
        aponReader.read(responseParams); // Convert APON string to Parameters object

        System.out.println("Received Status: " + responseParams.getString("status"));
        System.out.println("Received Message: " + responseParams.getString("message"));
    }
}
```

#### Encrypted Property Handling Example

You can use `PBEncryptionUtils` to encrypt and decrypt sensitive information in configuration files or within data.

```java
import com.aspectran.utils.PBEncryptionUtils;

public class LegacyEncryptionExample {

    public static void main(String[] args) {
        String password = "my-secret-key";
        String originalText = "SensitiveData123!";

        // Encryption
        String encryptedText = PBEncryptionUtils.encrypt(originalText, password);
        System.out.println("Original: " + originalText);
        System.out.println("Encrypted: " + encryptedText);

        // Decryption
        String decryptedText = PBEncryptionUtils.decrypt(encryptedText, password);
        System.out.println("Decrypted: " + decryptedText);

        // Verification
        System.out.println("Decryption successful: " + originalText.equals(decryptedText));
    }
}
```

## Environment Configuration

The `aspectran-utils-legacy` module's behavior can be controlled through specific environment variables related to encryption and properties file encoding. These environment variables can be set via the `-D` option when starting the JVM, or by using the `System.setProperty()` method within your application code.

### Encryption Settings

When processing encrypted properties using `PBEncryptionUtils`, you can set the following system properties:

*   **`aspectran.encryption.algorithm`**: Specifies the algorithm to be used for encryption. The default value is `PBEWithMD5AndTripleDES`.
    *   **Warning**: `PBEWithMD5AndTripleDES` is currently considered an insecure algorithm. For higher security, it is recommended to use stronger algorithms such as `PBEWITHHMACSHA256ANDAES_128`.
    ```
    -Daspectran.encryption.algorithm=PBEWITHHMACSHA256ANDAES_128
    ```
*   **`aspectran.encryption.password`**: Specifies the password to be used for encryption and decryption. This password must be managed securely.
    ```
    -Daspectran.encryption.password=your-secure-password
    ```

### Properties File Encoding Settings

You can specify the default encoding to be used when loading properties files (`*.properties`).

*   **`aspectran.properties.encoding`**: Specifies the encoding for properties files. The default value is `ISO-8859-1`. If you are using other encodings like `UTF-8`, you should set this property.
    ```
    -Daspectran.properties.encoding=UTF-8
    ```

**Example (Setting at JVM startup):**

```bash
java -Daspectran.encryption.algorithm=PBEWITHHMACSHA256ANDAES_128 \
     -Daspectran.encryption.password=your-secure-password \
     -Daspectran.properties.encoding=UTF-8 \
     -jar your-legacy-app.jar
```

## Considerations and Limitations

*   **Compatibility Layer:** The `aspectran-utils-legacy` module is designed for compatibility with legacy systems and does not aim to perfectly replicate all features of the modern Aspectran framework in a legacy environment. It primarily focuses on data format conversion and basic utility functions.
*   **Performance:** Since it uses reference-based caches like `WeakHashMap`, memory efficiency is good, but in certain high-load environments, it may not achieve the same performance as `ConcurrentHashMap` in modern JDKs.
*   **Dependency Management:** Dependency management via Maven/Gradle can be somewhat complex depending on the legacy system's build environment. If necessary, you might need to build the `aspectran-utils-legacy` module directly and include the JAR file in your legacy project.

## Conclusion

The `aspectran-utils-legacy` module provides a practical solution for effectively integrating existing legacy systems with modern Aspectran application servers. This module can extend the lifespan of legacy systems and facilitate a gradual transition to modern microservice architectures.
