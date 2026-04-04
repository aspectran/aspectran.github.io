---
title: Aspectran Hint Mechanism Guide
subheadline: Core Guides
---

The **Hint Mechanism** in Aspectran is a flexible and powerful tool used to convey execution "intents" or supplementary metadata from business logic (Service, DAO, etc.) to the framework or other underlying modules.

This guide explains the concept of hints, from basic usage to advanced features like propagation and isolation, in a way that is easy for beginners to understand.

## 1. What is a Hint?

While implementing business methods, you often need to provide instructions about the execution environment that are separate from the core logic itself.

*   "Apply a cache to this data retrieval method for 60 seconds."
*   "Log this method's execution in detail because it is security-sensitive."
*   "Display this response using a popup window layout instead of a full page."

Typically, such information would be scattered across complex configuration files. In Aspectran, you can simply attach a "sticky note" directly onto your method using the **`@Hint` annotation**.

## 2. Why Use Hints?

1.  **Loose Coupling**: Your service code doesn't need to know the specific configuration classes of underlying modules (e.g., MyBatis, JPA, Redis). You just leave a "hint," and the corresponding module acts accordingly.
2.  **Flexible Control**: You can change execution behavior dynamically by modifying annotation values without having to refactor and recompile your Java code.
3.  **Clear Intent**: Hints serve as documentation, allowing fellow developers to instantly understand the intended execution environment and purpose of a method.

## 3. Basic Usage

### 3.1 Providing a Hint (Provider)

Hints are declared on methods using the `@Hint` annotation. The metadata content uses Aspectran's concise data format, **APON**.

```java
@Service
public class ProductService {

    // Leaves a hint of type "cache".
    // The content specifies the name as 'product_list' and expiration as 60 seconds.
    @Hint(type = "cache", value = "name: product_list, expire: 60")
    public List<Product> getProducts() {
        return productDao.getProducts();
    }
}
```

### 3.2 Consuming a Hint (Consumer)

Hints can be retrieved from anywhere using the `peekHint()` method of the `Translet` or `Activity` object. This is typically done within an **Aspect (AOP)** or a **framework extension module**.

```java
@Component
@Aspect(id = "cacheApplyAspect")
@Joinpoint(
    pointcut = {
        "+: com.example.service.*Service.get*"
    }
)
public class CacheAspect {

    @Before
    public void applyCache(Translet translet) {
        // Check if there is a hint of type "cache".
        HintParameters hint = translet.peekHint("cache");

        if (hint != null) {
            String cacheName = hint.getString("name"); // "product_list"
            int expire = hint.getInt("expire");        // 60

            // Apply caching logic based on the retrieved hint.
            System.out.println("Applying cache: " + cacheName + ", expire: " + expire + "s");
        }
    }
}
```

## 4. Using Multiple Hints

You can provide multiple types of hints on a single method. Aspectran allows the `@Hint` annotation to be repeated.

```java
@Service
public class UserService {

    @Hint(type = "logging", value = "level: verbose, target: 'file'")
    @Hint(type = "transaction", value = "readOnly: true, timeout: 10")
    public UserProfile getUserProfile(String userId) {
        return userDao.getUserById(userId);
    }
}
```

## 5. Propagation and Isolation (Advanced)

When a method calls another method (nested calls), you can decide how the hints from the parent method are passed down.

### 5.1 Propagation
By default, hints from a parent method remain active and visible during child method calls. This is called **Propagation**.

### 5.2 Isolation
If you want to prevent a parent method's hint from affecting inner calls, use the `propagated = false` option.

```java
@Service
public class OrderService {

    // This hint is 'isolated' and will not be passed to child methods.
    @Hint(type = "security", value = "encrypt: true", propagated = false)
    public void processOrder() {
        // Even if another service is called here, the 'security' hint will be hidden.
        internalHelperService.doSomething();
    }
}
```

## 6. Practical Example: Page Layout Control

One of the most common use cases is controlling the web page layout.

### Service Layer (DashboardActivity.java)
Distinguish between a full page and a popup page using hints.

```java
@Component("/app")
public class DashboardActivity {

    @Request("/dashboard")
    public void fullPage() {
        // Uses default layout
    }

    @Request("/dashboard/popup")
    @Hint(type = "layout", value = "mode: popup") // Mark this as a popup mode
    public void popupPage() {
        // Process data for popup...
    }
}
```

### Shared Logic Layer (UserAuthAspect.java)
An aspect that checks authentication can decide on the appropriate response by looking at the hint.

```java
@Component
@Aspect(
    id = "userAuthAspect",
    order = 1
)
@Joinpoint(
    pointcut = {
        "+: /app/**",
        "-: /auth/**"
    }
)
public class UserAuthAspect {

    @Before
    public void checkLogin(Translet translet) {
        if (!isLoggedIn(translet)) {
            // Check the "layout" hint.
            HintParameters layoutHint = translet.peekHint("layout");

            if (layoutHint != null && "popup".equals(layoutHint.getString("mode"))) {
                // Return a simple 403 error for popup mode.
                translet.transform(new FailureResponse().forbidden());
            } else {
                // Redirect to the login page for regular pages.
                translet.redirect("/login");
            }
        }
    }
}
```

## 7. Summary

*   **Hint**: A "sticky note" used to convey supplementary metadata during method execution.
*   **Type**: Categorizes the hint (e.g., `cache`, `layout`, `auth`).
*   **Value**: The detailed content of the hint, formatted in **APON**.
*   **Propagated**: Determines whether the hint is passed to children (`true`) or isolated (`false`).
*   **Frame Isolation**: Aspectran manages hints within logical "call frames," ensuring reliable isolation between method calls.

By leveraging the Aspectran Hint Mechanism, you can create a more flexible communication channel between the framework and your business logic, resulting in highly maintainable and clean code.
