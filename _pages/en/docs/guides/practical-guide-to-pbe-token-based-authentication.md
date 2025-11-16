---
title: A Practical Guide to PBE Token-Based Authentication
subheadline: Practical Guides
---

## 1. Overview

Aspectran provides a powerful feature for generating and validating secure, stateless authentication tokens using Password-Based Encryption (PBE). This method is very useful for verifying a client's identity in web applications, especially in API servers or real-time services based on WebSockets.

This document explains how authentication tokens are generated and utilized, centered around Aspectran's `com.aspectran.utils.security` package, and how you can customize them.

## 2. Core Components

Token-based authentication in Aspectran is primarily achieved through the following core components.

#### 2.1. `PBEncryptionUtils`

- **Role**: A central utility class responsible for application-wide encryption and decryption functions.
- **Configuration**: The encryption algorithm and password are set via JVM system properties. This configuration is loaded only once at application startup.
    - `aspectran.encryption.password`: The password to be used for encryption.
    - `aspectran.encryption.algorithm`: The encryption algorithm (default: `PBEWITHHMACSHA256ANDAES_128`).
- **Features**: When using modern AES-based algorithms, it helps developers avoid worrying about complex encryption logic by automatically managing the necessary initialization vector (IV) for enhanced security.

#### 2.2. `PBTokenIssuer`

- **Role**: Issues a basic token without an expiration time. It's useful for scenarios where tokens do not need to expire automatically or are managed through other means (e.g., a revocation list).
- **Functionality**: It encrypts a `Parameters` object to create a token. It provides methods to create, parse, and validate these tokens, either using the globally configured password or by supplying a password on a per-operation basis.

#### 2.3. `TimeLimitedPBTokenIssuer`

- **Role**: Issues and validates **time-limited tokens**, which are primarily used for authentication.
- **Token Structure**: The token is structured as `encrypt(expiration_timestamp + "_" + payload)`.
    - **Expiration Timestamp**: The expiration time (as a Unix timestamp in milliseconds) is converted to a base-36 string to make it shorter.
    - **Payload**: Additional data, such as user information, contained in a `Parameters` object.
- **Default Expiration**: If no expiration time is specified, a default of 30 seconds is used.

#### 2.4. Exception Handling

When parsing or validating a token, specific exceptions are thrown to indicate the nature of the failure:
- `InvalidPBTokenException`: This is the base exception, thrown when a token is malformed, has been tampered with, or cannot be decrypted.
- `ExpiredPBTokenException`: A subclass of `InvalidPBTokenException`, this is thrown specifically when a time-limited token has passed its expiration time. This allows you to handle expired tokens differently from invalid ones, for example, by prompting the user to refresh their session.

## 3. Example of Authentication Token Generation and Usage

Let's look at how tokens are configured and used in a real Aspectran application, using the `aspectow-appmon` demo project as an example.

#### 3.1. Setting the Encryption Password

First, set the password to be used for encryption through system properties in the `aspectran-config.apon` file.

`/Users/Aspectran/Projects/aspectran/aspectran/demo/app/config/aspectran-config.apon`
```apon
system: {
    properties: {
        aspectran.encryption.password: demo!
        # ... other properties
    }
}
```

When the application starts, `PBEncryptionUtils` reads this `demo!` password and initializes the default encryptor.

#### 3.2. Issuing a Token

In your service logic (e.g., after a successful login), you can easily issue a time-limited token as follows.

```java
import com.aspectran.utils.security.TimeLimitedPBTokenIssuer;
import com.aspectran.utils.apon.Parameters;
import com.aspectran.utils.apon.VariableParameters;

public class AuthService {

    /**
     * Issues a token with the default expiration time (30 seconds).
     */
    public String issueSimpleToken() {
        return TimeLimitedPBTokenIssuer.createToken();
    }

    /**
     * Issues a token with user information in the payload and sets the expiration time to 1 hour.
     */
    public String issueUserToken(String userId, String role) {
        Parameters payload = new VariableParameters();
        payload.putValue("userId", userId);
        payload.putValue("role", role);

        long expirationMillis = 1000 * 60 * 60; // 1 hour
        return TimeLimitedPBTokenIssuer.createToken(payload, expirationMillis);
    }

}
```

#### 3.3. Validating a Token

The client (e.g., a WebSocket client) sends the issued token included in its request. The server validates this token to check if the request is authorized. A robust implementation should handle different failure scenarios, such as expired tokens versus invalid ones.

```java
import com.aspectran.utils.apon.Parameters;
import com.aspectran.utils.security.ExpiredPBTokenException;
import com.aspectran.utils.security.InvalidPBTokenException;
import com.aspectran.utils.security.TimeLimitedPBTokenIssuer;

...

@Override
protected boolean checkAuthorized(@NonNull Session session) {
    // Extract the token from the URL path. (e.g., /backend/{token}/websocket)
    String token = session.getPathParameters().get("token");
    try {
        // Validate the token and parse the payload in one step.
        Parameters payload = TimeLimitedPBTokenIssuer.parseToken(token);
        String userId = payload.getString("userId");
        // Store user information in the session for later use
        session.setAttribute("userId", userId);
        logger.debug("Successfully validated token for user: {}", userId);
        return true;
    } catch (ExpiredPBTokenException e) {
        // Handle expired tokens specifically
        logger.warn("Expired token received: {}", e.getToken());
        // Optionally, you could trigger a token refresh flow here.
        return false;
    } catch (InvalidPBTokenException e) {
        // Handle all other invalid token errors (malformed, tampered, etc.)
        logger.error("Invalid token received: {}", e.getToken(), e);
        return false;
    }
}
```

## 4. Customization and Advanced Usage

#### 4.1. Changing the Encryption Algorithm

The default algorithm, `PBEWITHHMACSHA256ANDAES_128`, is very secure, but the encrypted string is long. If a high level of security is not required and reducing the token length is more important, you can change to an older algorithm by setting the system property as follows.

```apon
system: {
    properties: {
        aspectran.encryption.password: your-password
        aspectran.encryption.algorithm: PBEWithMD5AndTripleDES
    }
}
```

**Warning**: This approach significantly lowers the security level and should only be used in limited cases where sensitive data is not being handled.

#### 4.2. Secure Password Management

Unlike in the demo, **you should never store passwords in plaintext in a configuration file in a production environment.** Instead, use secure methods like the following:

- **Use Environment Variables**: Read the password from an environment variable at application startup and pass it as a JVM system property.

    ```sh
    java -Daspectran.encryption.password=$MY_APP_SECRET -jar my-app.jar
    ```

- **External Configuration Management Tools**: Dynamically inject the password by integrating with external secret management tools like HashiCorp Vault or AWS Secrets Manager.

#### 4.3. Using Different Passwords per Token

While `PBEncryptionUtils` sets a global default password, there may be cases where you need to use a different password for a specific token. Both `PBTokenIssuer` and `TimeLimitedPBTokenIssuer` provide method overloads that accept an `encryptionPassword`.

This is useful in multi-tenant environments or when integrating with external systems that have their own encryption secrets.

**Issuing a token with a custom password:**
```java
import com.aspectran.utils.security.TimeLimitedPBTokenIssuer;
import com.aspectran.utils.apon.Parameters;
import com.aspectran.utils.apon.VariableParameters;

...

String customPassword = "a-very-secret-password-for-a-tenant";
Parameters payload = new VariableParameters();
payload.putValue("data", "confidential");

String token = TimeLimitedPBTokenIssuer.createToken(payload, 3600 * 1000, customPassword);
```

**Validating a token with a custom password:**
```java
try {
    Parameters payload = TimeLimitedPBTokenIssuer.parseToken(token, customPassword);
    // Token is valid and payload is extracted
} catch (InvalidPBTokenException e) {
    // Handle exception
}
```

#### 4.4. Working with Custom Payload Types

For better type safety and code organization, you can define a custom class that extends `com.aspectran.utils.apon.Defaultarameters` to represent your token payload. When parsing the token, you can specify this class to have the payload automatically mapped to your custom type.

**1. Define a custom payload class:**
```java
import com.aspectran.utils.apon.Defaultarameters;
import com.aspectran.utils.apon.ParameterKey;
import com.aspectran.utils.apon.ParameterValueType;

public class UserPayload extends Defaultarameters {

    private static final ParameterKey userId = new ParameterKey("userId", ParameterValueType.STRING);
    private static final ParameterKey role = new ParameterKey("role", ParameterValueType.STRING);

    public UserPayload() {
        super(userId, role);
    }

    public String getUserId() {
        return getString(userId);
    }

    public String getRole() {
        return getString(role);
    }

}
```

**2. Issue and parse a token with the custom type:**
```java
// Issuing
UserPayload payloadToIssue = new UserPayload();
payloadToIssue.putValue("userId", "testuser");
payloadToIssue.putValue("role", "admin");
String token = TimeLimitedPBTokenIssuer.createToken(payloadToIssue);

// Parsing
try {
    UserPayload parsedPayload = TimeLimitedPBTokenIssuer.parseToken(token, UserPayload.class);
    String userId = parsedPayload.getUserId(); // Type-safe access
    String role = parsedPayload.getRole();
    System.out.println("User: " + userId + ", Role: " + role);
} catch (InvalidPBTokenException e) {
    // Handle exception
}
```

## 5. Conclusion

Aspectran's PBE-based token authentication method offers the following advantages:

- **Simplicity**: You can generate and validate secure authentication tokens with just a few lines of code, without complex configuration.
- **Stateless**: Since the token itself contains the expiration time and user information, there is no need to store separate session information on the server, making it highly scalable.
- **Flexibility**: You can easily change the encryption algorithm and password through system properties, allowing you to adjust to various environmental requirements.

We hope this guide helps you to effectively apply Aspectran's powerful security features to your application.
