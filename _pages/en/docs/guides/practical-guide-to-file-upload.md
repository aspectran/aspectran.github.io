---
title: Practical Guide to Aspectran File Uploads
subheadline: Practical Guides
---

In web applications, file uploading is an essential feature that addresses diverse requirements such as user profile images, document attachments, and large media transfers. At the same time, file uploading is a sensitive area and a frequent target for security threats, including malicious file uploads, disk-filling Denial-of-Service (DoS) attacks, and memory exhaustion caused by oversized payloads.

To help you manage file upload capabilities safely and flexibly, Aspectran provides a **security-focused whitelist architecture**, **diverse `MultipartFormDataParser` implementations**, and **centralized policy management based on AOP Aspects**.

This guide covers everything you need to know about file upload parsing in Aspectran: parser types and configuration, upload policy enforcement using Aspects, and hands-on development using the `@Multipart` annotation and `FileParameter`.

## 1. File Upload Architecture and Security Philosophy

Aspectran's file upload processing is designed based on several core principles.

### 1.1. Whitelist-Based Multipart Processing

Many web frameworks attempt to parse every HTTP request unconditionally whenever a `multipart/form-data` Content-Type header is detected. However, this approach exposes regular endpoints—which do not even require file uploads—to potential attacks and causes unnecessary disk I/O and memory allocation.

By default, Aspectran **does not parse multipart requests for unauthorized endpoints.**
*   An action method explicitly declares a `FileParameter` argument,
*   An action or class is marked with the `@Multipart` annotation, or
*   A parser is explicitly authorized for specific URL patterns (Pointcuts) via an AOP Aspect.

Only when one of these conditions is met will the multipart parser activate and inspect the request body. Any multipart request submitted to an unauthorized endpoint is safely ignored with a security warning log, fundamentally blocking potential multipart-based Denial-of-Service (DoS) attacks.

### 1.2. Aspect-Based Policy Separation

File upload policies vary significantly across different functional areas of an application. For instance, user profile uploads should restrict files to image formats with a maximum size of 5 MB, whereas an administrator release archive may require allowing archive or document files up to 100 MB.

In Aspectran, you can define these upload policies (size limits, extension filters, temporary file thresholds) as distinct parser beans and **inject the appropriate parser per URL path using AOP Aspect Pointcut rules**. This decouples infrastructure and security enforcement from business logic without requiring modifications to action code.

## 2. MultipartFormDataParser Implementations and Configuration

Aspectran supports both servlet-based enterprise environments and Netty-based non-blocking runtimes (Aspectow Edge), providing four standard parser implementations tailored to different deployment environments and requirements.

### 2.1. Parser Implementation Types

1.  **`StandardServletMultipartFormDataParserFactoryBean` (Recommended for Servlet environments)**:
    Operates on top of the standard Jakarta Servlet 3.0+ `Part` API. Because it leverages the high-performance multipart engine built directly into the servlet container (Tomcat, Jetty, Undertow, etc.), it is the standard and recommended parser in servlet-based web environments.
2.  **`NettyMultipartFormDataParser` (Dedicated to Netty / Aspectow Edge environments)**:
    In non-servlet environments running on the Netty runtime (such as Aspectow Edge), the Netty-native parser is used. Powered by Netty's asynchronous `HttpPostRequestDecoder`, it provides high-performance, non-blocking file upload handling without servlet dependencies.
3.  **`CommonsMultipartFormDataParserFactoryBean`**:
    Powered by the time-tested Apache Commons FileUpload library. Useful when standalone parsing policies and temporary file buffering strategies independent of the servlet container are desired.
4.  **`InMemoryMultipartFormDataParserFactoryBean`**:
    Buffers uploaded file data **purely in memory** without writing temporary files to disk. Ideal for high-performance APIs that process lightweight assets—such as thumbnails, icons, or small text files—instantly in memory.

### 2.2. Library Dependency Configuration

Required dependencies vary depending on which parser implementation is chosen:

*   **`StandardServlet` and `Netty` Parsers**:
    Because they directly leverage the servlet container's built-in Part API or Netty's built-in HTTP codecs, **no additional external library dependencies are required.**
*   **Apache Commons FileUpload-based Parsers (`Commons`, `InMemory`)**:
    These two parsers internally rely on Apache Commons FileUpload. You must add the following dependency to your project's `pom.xml`:

```xml
<dependency>
    <groupId>commons-fileupload</groupId>
    <artifactId>commons-fileupload</artifactId>
    <version>1.6.0</version>
</dependency>
```

### 2.3. Key Configuration Properties

Each parser provides granular security and operational properties:

| Property Name | Type | Description | Configuration Example |
| :--- | :--- | :--- | :--- |
| `maxRequestSize` | String / Long | Maximum allowed size for the entire multipart request (sum of all files and form fields) | `"10M"`, `"100M"` |
| `maxFileSize` | String / Long | Maximum allowed size per individual file | `"5M"`, `"20M"` |
| `tempFileThreshold` / `maxInMemorySize` | String / Long / Integer | Maximum byte threshold retained in memory before creating a temporary file on disk | `"256K"`, `"1M"` |
| `allowedFileExtensions` | String | Comma-delimited list of permitted file extensions (whitelist) | `"jpg,jpeg,png,gif"` |
| `deniedFileExtensions` | String | Comma-delimited list of disallowed file extensions (blacklist) | `"exe,sh,jsp,bat"` |
| `temporaryFilePath` / `tempFileDir` | String | Server directory path where temporary files are written (defaults to system temp dir if omitted) | `"/var/app/tmp"` |

> **Tip:** Values for `maxRequestSize`, `maxFileSize`, and `tempFileThreshold` (or `maxInMemorySize`) accept intuitive unit suffixes such as `B`, `K`, `M`, and `G` (e.g., `10M` = 10 Megabytes).

### 2.4. Parser Bean Definition Examples

Below are XML configuration examples registering parser beans tailored to different runtime environments and use cases:

```xml
<!-- 1. Standard servlet-based multipart parser (Servlet environment, general files) -->
<bean id="standardFileUploader"
      class="com.aspectran.web.servlet.support.multipart.standard.StandardServletMultipartFormDataParserFactoryBean">
    <description>
        General-purpose file uploader leveraging the Jakarta Servlet standard Part API
    </description>
    <properties>
        <item name="maxRequestSize" value="20M"/>
        <item name="maxFileSize" value="10M"/>
        <item name="tempFileThreshold" value="512K"/>
        <item name="allowedFileExtensions" value="jpg,jpeg,png,gif,pdf,zip"/>
        <item name="deniedFileExtensions" value="jsp,sh,bat,exe"/>
    </properties>
</bean>

<!-- 2. In-memory multipart parser (Lightweight thumbnails/icons, requires commons-fileupload) -->
<bean id="inMemoryFileUploader"
      class="com.aspectran.web.servlet.support.multipart.inmemory.InMemoryMultipartFormDataParserFactoryBean">
    <description>
        Lightweight uploader buffering directly in memory without disk temporary files
    </description>
    <properties>
        <item name="maxRequestSize" value="1M"/>
        <item name="maxFileSize" value="500K"/>
        <item name="allowedFileExtensions" value="jpg,png,svg"/>
    </properties>
</bean>

<!-- 3. Netty-native multipart parser (Dedicated to Aspectow Edge) -->
<bean id="nettyFileUploader"
      class="com.aspectran.netty.support.multipart.NettyMultipartFormDataParser">
    <description>
        High-performance uploader leveraging Netty's asynchronous decoder for Aspectow Edge
    </description>
    <properties>
        <item name="maxRequestSize" value="20M"/>
        <item name="maxFileSize" value="10M"/>
        <item name="maxInMemorySize" value="512K"/>
        <item name="allowedFileExtensions" value="jpg,jpeg,png,gif,pdf,zip"/>
        <item name="deniedFileExtensions" value="jsp,sh,bat,exe"/>
    </properties>
</bean>
```

## 3. Centralized Upload Policy Management via Aspects

Rather than hardcoding upload parsers into action code, Aspectran recommends **injecting them into specific endpoints via `<settings>` inside AOP Aspects**.

### 3.1. XML-Based Aspect Definition

Define an Aspect that enables the file uploader only for `POST` and `PUT` requests matching specific URL patterns:

```xml
<!-- Injects standardFileUploader only into authorized upload URL patterns -->
<aspect id="fileUploadAspect">
    <description>
        Applies standard file uploader policy to designated upload endpoints.
    </description>
    <joinpoint>
        methods: [
            POST,
            PUT
        ]
        pointcut: {
            +: /examples/file-upload/files
            +: /members/*/profile-image
            +: /board/*/attachments
        }
    </joinpoint>
    <settings>
        <setting name="multipartFormDataParser" value="standardFileUploader"/>
    </settings>
</aspect>
```

*   When a `POST` or `PUT` request matches the URL patterns declared in the `pointcut`, Aspectran checks the `multipartFormDataParser` setting early in the request lifecycle and injects the `standardFileUploader` bean to parse the multipart body.
*   If malicious multipart data is sent to a regular URL outside of this Aspect's pointcut, the parser is not executed, safeguarding server resources.

### 3.2. Java Annotation-Based Aspect Definition

If you prefer Java configuration, you can achieve the exact same policy using the `@Aspect`, `@Joinpoint`, and `@Settings` annotations:

```java
@Component
@Aspect("fileUploadAspect")
@Joinpoint(
    methods = {MethodType.POST, MethodType.PUT},
    pointcut = {
        "+: /examples/file-upload/files",
        "+: /members/*/profile-image"
    }
)
@Settings({
    @Setting(name = "multipartFormDataParser", value = "standardFileUploader")
})
public class FileUploadPolicyAspect {
    // You can optionally add @Before or @After advice methods here
    // for pre/post-upload logging, authorization checks, or auditing.
}
```

### 3.3. Multi-Parser Separation Strategy

As your application grows, different endpoints require different policies:
*   `/members/*/profile-image`: A 2 MB limit uploader restricted strictly to image extensions
*   `/admin/releases`: A high-capacity uploader allowing files up to 500 MB
*   `/api/icons`: An `inMemoryFileUploader` that bypasses disk operations entirely

By declaring individual parser beans and mapping them to distinct Pointcut rules, you achieve complete separation of concerns and robust security governance.

## 4. Integration with Translets (@Multipart, FileParameter)

Whether running in a servlet-based web environment (such as Aspectow Enterprise) or a Netty-based non-blocking environment (such as Aspectow Edge), the programming model for receiving and handling file uploads in Translet action methods is 100% identical. On top of an Aspect-managed environment, developers interact with upload requests in a completely consistent manner.

### 4.1. Automatic File Parameter Detection (Zero-Configuration)

If an action method declares `FileParameter`, `FileParameter[]`, or `FileParameterMap` as a parameter, Aspectran automatically recognizes that translet as requiring multipart processing:

```java
@Component
public class UploadController {

    // 1. Single file reception (field name automatically matches parameter name)
    @RequestToPost("/upload/single")
    public void uploadSingle(FileParameter file) {
        if (file != null && !file.isEmpty()) {
            // Process file
        }
    }

    // 2. Multiple files reception (specifying form field name with @Qualifier)
    @RequestToPost("/upload/multiple")
    public void uploadMultiple(@Qualifier("attachments") FileParameter[] files) {
        if (files != null) {
            for (FileParameter file : files) {
                // Process each file
            }
        }
    }

    // 3. Receiving all uploaded files as a Map
    @RequestToPost("/upload/map")
    public void uploadAll(FileParameterMap fileMap) {
        FileParameter[] profileImages = fileMap.getFileParameter("profile");
        FileParameter[] documents = fileMap.getFileParameter("document");
    }
}
```

### 4.2. Leveraging the @Multipart Annotation

When you need to parse form data without binding a `FileParameter`, or when you want to assign a dedicated parser bean to a specific action method, use the `@Multipart` annotation:

*   `@Multipart`: Processes the multipart request using the default parser.
*   `@Multipart("customParser")`: Explicitly uses the parser bean with the specified ID.
*   When placed at the class level, multipart processing applies to all request-mapped methods in that class.

```java
@Component
public class AdminReleaseActivity {

    // Explicitly specifies a high-capacity parser bean
    @RequestToPost("/admin/releases/upload")
    @Multipart("largeReleaseFileUploader")
    public void uploadRelease(FileParameter binaryFile) {
        // Parsed according to largeReleaseFileUploader bean limits and policies
    }
}
```

### 4.3. Parser Bean Resolution Precedence

When a multipart request arrives, Aspectran resolves the parser bean according to the following precedence:

1.  **Priority 1 (Explicit Translet Specification)**: The bean name specified in `@Multipart("beanName")`
2.  **Priority 2 (Aspect Setting)**: The `<setting name="multipartFormDataParser" value="beanName"/>` defined on matching Aspects
3.  **Priority 3 (Default Bean ID)**: A bean registered in the container with ID `"multipartFormDataParser"`
4.  **Priority 4 (Single Bean by Type)**: Auto-resolved if exactly one bean implementing `MultipartFormDataParser` exists in the container

> **Note:** In typical web applications where a single default parser bean is registered, you do not need to specify parser names; using `@Multipart` without arguments or simply declaring `FileParameter` works out of the box.

### 4.4. Pre-Validation at Application Startup

If you specify a parser bean name such as `@Multipart("myUploader")` and that bean does not exist in the container, Aspectran detects this during **application startup (Context building)** and throws a `BeanReferenceException`:

```text
ERROR [main] Cannot resolve reference to bean 'myUploader'; Referer: transletRule {name=/admin/releases/upload, method=[POST], ...}

Caused by: com.aspectran.core.context.rule.validation.BeanReferenceException: Found 1 broken bean reference(s):
1. Cannot resolve reference to bean 'myUploader'; Referer: transletRule {name=/admin/releases/upload, method=[POST], ...}
```

This prevents unexpected runtime failures when users attempt to upload files, allowing configuration errors to be caught and corrected immediately during development and deployment.

## 5. FileParameter API and Safe File Handling

The injected `FileParameter` object provides a rich API to inspect uploaded file metadata and safely store contents.

### 5.1. Key Methods

*   **`getFileName()`**: Returns the original client-side file name.
*   **`getFileSize()`**: Returns the size of the uploaded file in bytes.
*   **`getContentType()`**: Returns the MIME type of the file.
*   **`isEmpty()`**: Checks whether the file is empty (size is 0 or name is blank).
*   **`save(File destFile)` / `save(Path destPath)`**: Permanently saves the uploaded file to the specified destination file or path. (Automatically creates any missing parent directories)
*   **`getInputStream()`**: Reads the file content directly as an `InputStream`.
*   **`getBytes()`**: Reads the file content into an in-memory byte array (`byte[]`).
*   **`delete()`**: Manually and immediately removes the underlying temporary file.

### 5.2. Practical File Saving Example

The following example demonstrates how to safely save an uploaded file and return its metadata:

```java
@Component
public class FileUploadController {

    private final File uploadDir = new File("/var/app/data/uploads");

    @RequestToPost("/files")
    @Transform(FormatType.JSON)
    public UploadResult handleUpload(@Qualifier("attachment") FileParameter file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No file was uploaded");
        }

        // 1. Inspect original file name and size
        String originalFilename = file.getFileName();
        long fileSize = file.getFileSize();

        // 2. Security: Extract pure file name to defend against Path Traversal attacks
        String baseName = FilenameUtils.getName(originalFilename);

        // 3. Generate a unique storage file name (e.g., UUID)
        String extension = FilenameUtils.getExtension(baseName);
        String savedFilename = UUID.randomUUID() + (extension.isEmpty() ? "" : "." + extension);

        // 4. Create destination file and save
        // The save() method automatically creates any missing parent directories.
        File destination = new File(uploadDir, savedFilename);
        file.save(destination);

        return new UploadResult(originalFilename, savedFilename, fileSize);
    }
}
```

### 5.3. Temporary File Lifecycle and Resource Cleanup

*   During multipart parsing, uploaded file data is temporarily staged on the server's disk storage (or memory).
*   Calling `file.save(destination)` moves (renames or copies) the temporary file safely to its permanent destination.
*   Any unsaved temporary files are **automatically and safely deleted by the Aspectran container when request processing (Activity) completes**, preventing disk storage leaks.
