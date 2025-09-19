---
format: plate solid article
sidebar: toc
title: A Practical Guide to PBE Token-Based Authentication
subheadline: User Guides
parent_path: /docs
---

## 1. Overview

Aspectran provides a powerful feature for generating and validating secure, stateless authentication tokens using Password-Based Encryption (PBE). This method is very useful for verifying a client's identity in web applications, especially in API servers or real-time services based on WebSockets.

This document explains how authentication tokens are generated and utilized, centered around Aspectran's `com.aspectran.utils.security` package, and how you can customize them.

## 2. Core Components

Token-based authentication in Aspectran is primarily achieved through the following three core components.

#### 2.1. `PBEncryptionUtils`

- **Role**: A central utility class responsible for application-wide encryption and decryption functions.
- **Configuration**: The encryption algorithm and password are set via JVM system properties. This configuration is loaded only once at application startup.
    - `aspectran.encryption.password`: The password to be used for encryption.
    - `aspectran.encryption.algorithm`: The encryption algorithm (default: `PBEWITHHMACSHA256ANDAES_128`).
- **Features**: When using modern AES-based algorithms, it helps developers avoid worrying about complex encryption logic by automatically managing the necessary initialization vector (IV) for enhanced security.

#### 2.2. `PBTokenIssuer`

- **Role**: Issues the most basic form of a token. It creates a token by encrypting a `Parameters` object but does not include an expiration time.

#### 2.3. `TimeLimitedPBTokenIssuer`

- **Role**: Issues and validates **time-limited tokens**, which are mainly used for authentication. It extends `PBTokenIssuer` to add expiration time functionality.
- **Token Structure**: It is structured as `encrypt(expiration_timestamp + "_" + payload)`.
    - **Expiration Timestamp**: The time when the token expires, converted to a base-36 string.
    - **Payload**: Additional data, such as user information, contained in a `Parameters` object.
- **Exception Handling**: When token validation fails, it throws an `InvalidPBTokenException` (invalid token) or `ExpiredPBTokenException` (expired token), enabling clear error handling.

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
        return TimeLimitedPBTokenIssuer.getToken();
    }

    /**
     * Issues a token with user information in the payload and sets the expiration time to 1 hour.
     */
    public String issueUserToken(String userId, String role) {
        Parameters payload = new VariableParameters();
        payload.putValue("userId", userId);
        payload.putValue("role", role);

        long expirationMillis = 1000 * 60 * 60; // 1 hour
        return TimeLimitedPBTokenIssuer.getToken(payload, expirationMillis);
    }

}
```

#### 3.3. Validating a Token

The client (e.g., a WebSocket client) sends the issued token included in its request. The server validates this token to check if the request is authorized.

In `WebsocketExportService`, the token included in the URL path is validated upon WebSocket connection.

`/Users/Aspectran/Projects/aspectran/aspectow-appmon/appmon/src/main/java/com/aspectran/appmon/service/websocket/WebsocketExportService.java`
```java
@Override
protected boolean checkAuthorized(@NonNull Session session) {
    // Extract the token from the URL path. (e.g., /backend/{token}/websocket)
    String token = session.getPathParameters().get("token");
    try {
        // Validate the token's validity (whether it has been tampered with) and expiration time at once.
        // AppMonManager.validateToken(token) internally calls TimeLimitedPBTokenIssuer.validate(token).
        TimeLimitedPBTokenIssuer.validate(token);
    } catch (InvalidPBTokenException e) {
        // If the token is invalid or expired
        logger.error("Invalid token: {}", token);
        return false;
    }
    // Validation successful
    return true;
}
```

If the token validation is successful, you can extract the user information contained in the payload and use it in your business logic as needed.

```java
try {
    Parameters payload = TimeLimitedPBTokenIssuer.getPayload(token);
    String userId = payload.getString("userId");
    // ... perform additional logic using userId
} catch (InvalidPBTokenException e) {
    // Handle exception
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

## 5. Conclusion

Aspectran's PBE-based token authentication method offers the following advantages:

- **Simplicity**: You can generate and validate secure authentication tokens with just a few lines of code, without complex configuration.
- **Stateless**: Since the token itself contains the expiration time and user information, there is no need to store separate session information on the server, making it highly scalable.
- **Flexibility**: You can easily change the encryption algorithm and password through system properties, allowing you to adjust to various environmental requirements.

We hope this guide helps you to effectively apply Aspectran's powerful security features to your application.
