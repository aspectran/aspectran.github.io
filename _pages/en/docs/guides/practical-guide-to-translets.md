---
title: Practical Guide to Aspectran Translets
subheadline: Practical Guides
---

This document provides a practical guide to defining and utilizing Translets, the request processing units in Aspectran. It focuses on handling request data, executing business logic, and controlling responses, which are common concerns for developers when writing actual code.

## 1. Translets and Action Methods

A Translet is a blueprint or recipe for **"how to handle a request?"** In Aspectran, a public method annotated with `@Request*` is called an **Action Method**, and this action method serves as the entry point for handling the core business logic of a Translet.

```java
@Component // 1. Declare as a component bean
public class UserActivity {

    // 2. Action method mapped to a Translet with a @Request* annotation
    @RequestToGet("/users/${userId}")
    public User getUser(long userId) {
        // 3. Handle business logic
        // ...
    }
}
```

## 2. Request Mapping Annotations

These are used to associate an action method with a specific request URL and method.

*   **`@Request`**: The most general request mapping annotation. You can use the `method` attribute to specify the allowed request methods directly. If the `method` attribute is omitted, it allows **all request methods**.
    ```java
    // Allow only GET and POST requests
    @Request(path = "/some/path", method = {MethodType.GET, MethodType.POST})
    public void handleGetAndPost() { ... }

    // Allow all request methods
    @Request("/any/path")
    public void handleAllMethods() { ... }
    ```

*   **`@RequestToGet`, `@RequestToPost`, `@RequestToPut`, `@RequestToPatch`, `@RequestToDelete`**: These are shortcut annotations for specific request methods. They make the code more concise and intuitive.
    ```java
    // Same as @Request(path = "/users", method = MethodType.GET)
    @RequestToGet("/users")
    public List<User> listUsers() { ... }

    // Same as @Request(path = "/users", method = MethodType.POST)
    @RequestToPost("/users")
    public void createUser(User user) { ... }
    ```

## 3. Arguments of Action Methods (Argument Injection)

One of Aspectran's most powerful features is its ability to automatically analyze and inject arguments for action methods. In most cases, injection is completed with just the parameter's name and type, without needing separate annotations.

### 3.1. Request Data Injection

*   **Path Variables**: You can use tokens in the Translet path to extract parts of the URL path as variables.
    *   `${...}`: Extracts as a **Parameter**. (e.g., `/users/${userId}`)
    *   `@{...}`: Extracts as an **Attribute**. (e.g., `/users/@{userId}`)
The extracted value is mapped to the method argument name. In most cases, the `${...}` token is used.

*   **Request Parameters**: URL query strings (`?name=value`) or POST form data are automatically mapped to method arguments by name.

*   **POJO Mapping**: Request parameters can be automatically mapped to the fields of a POJO (Plain Old Java Object).

*   **APON Parameters Mapping (Automatic JSON/APON Request Body Injection)**: Request bodies sent by clients in JSON or APON format can be directly injected into a `com.aspectran.utils.apon.Parameters` object. This allows you to safely and conveniently extract dynamic or variable JSON data with type safety without having to define separate DTO classes for every request structure.
    *   Key extraction methods: `getString(name)`, `getInt(name)`, `getLong(name)`, `getBoolean(name)`, `getDouble(name)`, `getParameters(name)`, `getParametersList(name)`, `hasValue(name)`, etc.
    *   Default value support: Overloaded helper methods such as `parameters.getString("key", "defaultValue")` and `parameters.getInt("key", 0)` allow safe handling of missing fields with fallback values.

*   **Uploaded Files**: Files submitted via multipart form data can be directly injected by declaring parameters of type `FileParameter`, `FileParameter[]`, or `FileParameterMap`. (See [8. File Upload and Multipart Request Handling](#8-file-upload-and-multipart-request-handling) for details)

```java
@Component
public class ProductActivity {

    /**
     * Automatic injection of path variables and request parameters
     * Request example: /categories/BOOKS/products/123?includeDetails=true
     */
    @Request("/categories/${categoryId}/products/${productId}")
    public Product getProduct(String categoryId, long productId, boolean includeDetails) {
        // categoryId = "BOOKS"
        // productId = 123L
        // includeDetails = true
    }

    /**
     * Automatic POJO object mapping
     * Request parameters: username=jdoe&password=1234&email=...
     */
    @RequestToPost("/account/new")
    public void createAccount(Account account) {
        // The parameter values are automatically populated into the fields of the account object
        accountService.create(account);
    }

    /**
     * Automatic injection of JSON/APON request body into Parameters object
     * Request JSON example: {"title": "Learn Aspectran", "completed": false, "order": 1}
     */
    @RequestToPost("/todos/api")
    @Transform(FormatType.JSON)
    public Todo createTodo(Translet translet, Parameters parameters) {
        Todo todo = new Todo();
        todo.setTitle(parameters.getString("title", ""));
        todo.setCompleted(parameters.getBoolean("completed", false));
        todo.setOrder(parameters.getInt("order", 0));

        todoService.addTodo(todo);
        return todo;
    }
}
```

### 3.2. Context Object and Bean Injection

*   **`Translet` Object**: If you need the `Translet` object, which contains the context information of the current request, you can receive it simply by declaring it as an argument.
*   **Other Bean Objects**: Without `@Autowired`, other Beans registered in the current container are also automatically found and injected by type and name.

```java
@Component
public class AccountActivity {

    @RequestToPost("/account/new")
    public void newAccount(
            Translet translet,   // 1. Inject Translet object
            Account account,      // 2. POJO mapping
            BeanValidator validator // 3. Inject another Bean from the container
    ) {
        validator.validate(account);
        if (validator.hasErrors()) {
            translet.forward("/account/newAccountForm"); // 4. Use the injected Translet
        } else {
            // ...
        }
    }
}
```

### 3.3. Parameter Detail Control Annotations

*   **`@Required`**: When placed before an argument, it means that the corresponding parameter must be included in the request. An exception is thrown if it is missing.
*   **`@Qualifier("name")`**: If the name of the parameter or Bean to be injected is ambiguous (e.g., multiple Beans of the same type), it explicitly specifies the name.
*   **`@Format("pattern")`**: Used on date/time type arguments like `Date` or `LocalDateTime` to specify the format of the string value.

```java
@Request("/orders")
public void getOrders(
        @Required String status, // status parameter is required
        @Format("yyyy-MM-dd") Date fromDate, // parameter in "2025-01-20" format
        @Qualifier("userBean") User user // Inject the Bean with ID "userBean"
) {
    // ...
}
```

## 4. Response Handling

You can easily control the response through the return value of the action method or annotations.

### 4.1. Annotation-based Response Rules

*   **`@Transform`**: Transforms the object returned by the method (usually a POJO or `Map`) into a string of a specified format and responds. The `format` attribute takes a `FormatType` enum value (e.g., `FormatType.JSON`, `FormatType.XML`). Very useful for implementing REST APIs.
    ```java
    @RequestToGet("/api/users/${userId}")
    @Transform(format = FormatType.JSON)
    public User getUser(@Required long userId) {
        return userService.getUser(userId);
    }
    ```
*   **`@Dispatch("...")`**: Forwards processing to the specified view template (JSP, Thymeleaf, etc.) to render HTML.
    ```java
    @Request("/account/signonForm")
    @Dispatch("account/SignonForm") // Dispatches to the account/SignonForm.jsp view
    public void signonForm() {
    }
    ```
*   **`@Forward(translet = "...")`**: Forwards processing internally on the server to another specified Translet. Attributes can be passed along with `@AttrItem`.
    ```java
    @Request("/legacy/path")
    @Forward(
        translet = "/new/path",
        attributes = {
            @AttrItem(name = "attr1", value = "some value")
        }
    )
    public void forwardToNewPath() {
    }
    ```
*   **`@Redirect("...")`**: Redirects the client to the specified URL. Parameters can be passed along with `@ParamItem`.
    ```java
    @RequestToPost("/orders")
    @Redirect(
        path = "/order/view",
        parameters = {
            @ParamItem(name = "orderId", value = "#{result.orderId}")
        }
    )
    public Order createOrder(Order order) {
        return orderService.create(order); // The returned Order object can be referenced as 'result'
    }
    ```

### 4.2. Programmatic Response

You can dynamically control the response based on conditions by directly calling the response methods of the `Translet` object within the method. If a programmatic response is called, response annotations like `@Transform` or `@Dispatch` applied to that action method are ignored.

*   **`translet.forward(transletName)`**: Delegates request processing to another Translet internally on the server.
    ```java
    @Request("/orders/viewOrEdit/${orderId}")
    public void viewOrEditOrder(Translet translet, long orderId, boolean editable) {
        if (editable) {
            // If editable, forward to the /orders/edit/${orderId} Translet
            translet.forward("/orders/edit/" + orderId);
        } else {
            // Otherwise, forward to the /orders/view/${orderId} Translet
            translet.forward("/orders/view/" + orderId);
        }
    }
    ```

*   **`translet.redirect(path)`**: Sends a redirect response to the client to re-request the specified URL.
    ```java
    @RequestToPost("/account/signon")
    public void signon(Translet translet, String username, String password) {
        Account account = accountService.getAccount(username, password);
        if (account == null) {
            translet.redirect("/account/signonForm?retry=true");
        } else {
            translet.redirect("/");
        }
    }
    ```

*   **`translet.dispatch(name)`**: Dispatches to the specified view template (JSP, Thymeleaf, etc.) to render the UI.
    ```java
    @Request("/products/${productId}")
    public void viewProduct(Translet translet, String productId) {
        Product product = catalogService.getProduct(productId);
        if (product == null) {
            // If the product is not found, show the 'not_found' view
            translet.dispatch("error/not_found");
        } else {
            translet.setAttribute("product", product);
            translet.dispatch("catalog/product_details");
        }
    }
    ```

*   **`translet.transform(rule)`**: Dynamically applies a specific transformation rule (`TransformRule`) to generate the response.
    ```java
    @Request("/api/legacy/data")
    public void getLegacyData(Translet translet) {
        // ... data processing logic ...
        if (isJsonNeeded(translet)) {
            TransformRule jsonRule = new TransformRule();
            jsonRule.setFormatType(FormatType.JSON);
            jsonRule.setContentType(ContentType.APPLICATION_JSON);
            translet.transform(jsonRule);
        }
    }
    ```

*   **`translet.response(response)`**: Used to generate a completely custom response, often using a `ResponseTemplate`. Useful when you need to directly control HTTP headers or write data directly to the output stream, such as for file downloads.
    ```java
    @Request("/api/csv/download")
    public void downloadCsv(Translet translet) throws IOException {
        ResponseTemplate template = new ResponseTemplate(translet.getResponseAdapter());
        template.setContentType("text/csv");
        template.setHeader("Content-Disposition", "attachment; filename=\"report.csv\"");

        try (Writer writer = template.getWriter()) {
            writer.write("id,name,value\n");
            writer.write("1,apple,100\n");
            writer.write("2,banana,200\n");
        }

        translet.response(template);
    }
    ```

## 5. Separating and Referencing Core Logic (Action)

Using the `@Action` annotation, you can make the result of a method's execution reusable data within the Translet.

```java
@Request("/cart/viewCart")
@Dispatch("cart/Cart")
@Action("cart") // The return value of this method is stored under the name "cart"
public Cart viewCart() {
    return cartService.getCart();
}

// The result of the above Action can be referenced in XML or other rules as #{cart}
```

## 6. Passing One-Time Data on Redirect: FlashMap

When using the PRG (Post-Redirect-Get) pattern in a web application, you often want to pass a message like 'Successfully processed' to the redirected GET request **only once** after a POST request. Using the session directly is cumbersome as you have to manually delete the data, but **FlashMap** makes this process very simple.

FlashMap is a temporary data store that is saved just before a redirect and can only be retrieved in the next request after the redirect, after which it is automatically destroyed.

### Storing Data in FlashMap

You store data by calling `getOutputFlashMap()` on the `Translet` object in your action method. After storing the data, calling `redirect()` prepares the FlashMap to be passed to the next request.

```java
@Component
public class OwnerController {
    @RequestToPost("/owners/new")
    public void processCreationForm(@NonNull Translet translet, Owner owner) {
        // ... owner saving logic ...
        ownerDao.save(owner);

        // 1. Get the OutputFlashMap and store data with the key "message".
        translet.getOutputFlashMap().put("message", "New Owner Created");

        // 2. Redirect.
        translet.redirect("/owners/" + owner.getId());
    }
}
```

### Retrieving FlashMap Data

In the request after the redirect, you can retrieve the data stored in the previous request via `translet.getInputFlashMap()`. It is usually convenient to handle this as a common logic using an AOP Aspect.

Here is an example of a `FlashMapEchoAspect` that, when a GET request comes in, moves the data from the FlashMap to a request attribute if it exists, making it easy to use in a view template (JSP, Thymeleaf, etc.).

```java
@Component
@Aspect("flashMapEchoAspect")
@Joinpoint(methods = MethodType.GET, pointcut = "+: /**") // Target all GET requests
public class FlashMapEchoAspect {

    @Before
    public void echo(@NonNull Translet translet) {
        if (translet.hasInputFlashMap()) {
            // Store as an attribute so it can be used in the view as ${flashMap.message}
            translet.setAttribute("flashMap", translet.getInputFlashMap());
        }
    }
}
```

This way, the view template can access the data under the name `flashMap` to show a one-time message like "New Owner Created" to the user.

### Cautions When Using FlashMap

By default, FlashMap data is temporarily stored in the **user's session** by the `SessionFlashMapManager`, used in the next request, and then destroyed. Due to this behavior, there are a few points to be aware of:

1.  **One-Time Data**: Attributes stored in FlashMap are **valid only for a single request** after the redirect and are automatically deleted after being retrieved. Therefore, if data is needed across multiple requests, it should be stored directly in the session.

2.  **Session Dependency**: Since the data is stored in the session, if the user's session is not maintained (e.g., session expires, browser is closed), the FlashMap data will also be lost.

3.  **Timeout and Memory Management**: To prepare for cases where the FlashMap is not destroyed and remains in the session (e.g., if the redirect does not happen correctly), FlashMap data has a default timeout (default 180 seconds) and is automatically removed. However, be careful as storing too much data in the FlashMap can increase session memory usage.

4.  **Data Security**: Although FlashMap data is not exposed in the URL, it is stored in the server's session. Therefore, it is safer not to store highly sensitive information such as passwords or personal identification information.

5.  **Target Request Matching**: By default, the FlashMap is passed to the next request that has the same request name as the request that stored the data. If multiple Ajax requests are made to the same URL in a short period, an unintended request might consume the FlashMap data, so caution is needed when using it in complex screens.

## 7. Accessing Basic Context Information

If you need to directly access the current request, session, or application scope through the `Translet` object, you can use adapters as follows:

```java
public void someMethod(Translet translet) {
    // If you need to directly access HttpServletRequest
    RequestAdapter requestAdapter = translet.getRequestAdapter();
    String remoteAddr = requestAdapter.getRemoteAddr();

    // If you need to directly access HttpSession
    SessionAdapter sessionAdapter = translet.getSessionAdapter();
    sessionAdapter.setAttribute("user", user);
}
```

## 8. File Upload and Multipart Request Handling

Aspectran provides intuitive, safe, and flexible features for handling `multipart/form-data` file upload requests.

> **Note:** For in-depth coverage of parser configuration (size limits, extension filters, temporary file thresholds) and managing endpoint-specific upload policies via AOP Aspects, see the [Practical Guide to Aspectran File Uploads](/en/docs/guides/practical-guide-to-file-upload/).

### 8.1. Automatic File Parameter Detection

When you declare action method parameters of type `FileParameter`, `FileParameter[]`, or `FileParameterMap`, Aspectran automatically detects them and configures the Translet to process multipart requests. File uploads are enabled simply by declaring the parameter, without requiring any additional annotations.

*   **`FileParameter`**: Injects a single uploaded file. The parameter name or `@Qualifier("fieldName")` is used to match the form field name.
*   **`FileParameter[]`**: Injects multiple files uploaded under the same form field name as an array.
*   **`FileParameterMap`**: Injects all uploaded files in the request as a map.

```java
@Component
public class FileUploadActivity {

    // 1. Single file upload (form field name: attachment)
    @RequestToPost("/upload/single")
    public void uploadSingle(FileParameter attachment) {
        if (attachment != null && attachment.getFileSize() > 0) {
            String fileName = attachment.getFileName();
            long fileSize = attachment.getFileSize();
            // File saving or business logic processing
            // File savedFile = attachment.save(new File("/path/to/dest", fileName));
        }
    }

    // 2. Multiple file upload (specifying field name with @Qualifier)
    @RequestToPost("/upload/multiple")
    public void uploadMultiple(@Qualifier("photos") FileParameter[] photos) {
        if (photos != null) {
            for (FileParameter photo : photos) {
                // Process each file
            }
        }
    }

    // 3. Complete map of uploaded files
    @RequestToPost("/upload/all")
    public void uploadAll(FileParameterMap fileMap) {
        for (Map.Entry<String, FileParameter[]> entry : fileMap.entrySet()) {
            String fieldName = entry.getKey();
            FileParameter[] files = entry.getValue();
            // Process files by field name
        }
    }
}
```

### 8.2. The `@Multipart` Annotation

The `@Multipart` annotation can be used when you need to parse multipart form parameters even without `FileParameter` arguments, or when you want to explicitly specify a particular parser bean.

*   **Method-level declaration**: Configures multipart handling for a specific action method.
*   **Class-level declaration**: Applies multipart handling as the default for all action methods within the component class. You can override it on individual methods with a different parser.
*   **Supported HTTP methods**: Supports multipart requests using `POST`, `PUT`, or `PATCH`.

```java
@Component
@Multipart // Applies multipart processing to all requests in this class by default
public class ArticleActivity {

    // Parses multipart form data with class-level @Multipart applied
    @RequestToPost("/articles")
    public void createArticle(Article article, FileParameter coverImage) {
        // Both regular fields of article and coverImage are injected
    }

    // Explicitly specifies a dedicated parser bean for this action method
    @RequestToPut("/articles/${articleId}/attachments")
    @Multipart("largeFileUploader")
    public void updateAttachments(long articleId, FileParameter[] attachments) {
        // Parsed using the "largeFileUploader" parser bean
    }
}
```

### 8.3. Multipart Parser Bean Resolution Order

When parsing a multipart request, the `MultipartFormDataParser` bean is resolved in the following priority order:

1.  **Direct Translet specification**: The parser bean name specified in the `@Multipart("beanName")` attribute.
2.  **Aspect environment setting**: The bean name specified by an Aspect's `<setting name="multipartFormDataParser" value="beanName"/>`.
3.  **Default bean ID**: A bean registered in the container with the ID `"multipartFormDataParser"`.
4.  **Unique bean by type**: Automatically injected if exactly **one** bean of type `MultipartFormDataParser` is defined in the container.

In most web applications, only a single multipart parser bean is registered, so omitting the parser name and simply using `@Multipart` or declaring a `FileParameter` argument is sufficient.

> For security reasons, if a request does not have a `@Multipart` annotation, a `FileParameter` argument, or an Aspect `multipartFormDataParser` setting, the multipart request body will not be parsed and a warning will be logged.

### 8.4. Startup-Time Bean Reference Validation

When a specific parser bean name is provided via `@Multipart("someParser")`, Aspectran validates at **application startup and context build time** whether the referenced bean is actually defined.

If an invalid or misspelled bean name is specified, a `BeanReferenceException` is thrown immediately during server boot rather than failing at runtime when an upload request arrives, preventing configuration mistakes early.

```text
ERROR [main] Cannot resolve reference to bean 'standardFileUploader---'; Referer: transletRule {name=/examples/file-upload/files, method=[POST], ...}

Caused by: com.aspectran.core.context.rule.validation.BeanReferenceException: Found 1 broken bean reference(s):
1. Cannot resolve reference to bean 'standardFileUploader---'; Referer: transletRule {name=/examples/file-upload/files, method=[POST], ...}
```
