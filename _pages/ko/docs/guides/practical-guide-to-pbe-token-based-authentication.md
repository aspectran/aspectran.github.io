---
title: PBE를 이용한 인증 토큰 활용 가이드
subheadline: 실용 가이드
---

## 1. 개요

Aspectran은 패스워드 기반 암호화(Password-Based Encryption, PBE)를 활용하여 안전하고 상태 비저장(stateless) 방식의 인증 토큰을 생성하고 검증하는 강력한 기능을 제공합니다. 이 방식은 웹 애플리케이션, 특히 API 서버나 웹소켓 기반의 실시간 서비스에서 클라이언트의 신원을 확인하는 데 매우 유용합니다.

이 문서에서는 Aspectran의 `com.aspectran.utils.security` 패키지를 중심으로 인증 토큰이 어떻게 생성되고 활용되는지, 그리고 이를 어떻게 커스터마이징할 수 있는지에 대해 설명합니다.

## 2. 핵심 컴포넌트

Aspectran의 토큰 기반 인증은 주로 다음 핵심 컴포넌트를 통해 이루어집니다.

#### 2.1. `PBEncryptionUtils`

- **역할**: 애플리케이션 전반의 암호화 및 복호화 기능을 담당하는 중앙 유틸리티 클래스입니다.
- **설정**: JVM 시스템 속성을 통해 암호화 알고리즘과 패스워드를 설정합니다. 이 설정은 애플리케이션 시작 시 한 번만 로드됩니다.
    - `aspectran.encryption.password`: 암호화에 사용할 패스워드
    - `aspectran.encryption.algorithm`: 암호화 알고리즘 (기본값: `PBEWITHHMACSHA256ANDAES_128`)
- **특징**: 최신 AES 기반 알고리즘을 사용할 경우, 보안 강화를 위해 필요한 초기화 벡터(IV)를 자동으로 관리하여 개발자가 복잡한 암호화 로직을 신경 쓰지 않도록 돕습니다.

#### 2.2. `PBTokenIssuer`

- **역할**: 만료 시간이 없는 기본 토큰을 발급합니다. 토큰이 자동으로 만료될 필요가 없거나, 다른 수단(예: 폐기 목록)을 통해 관리되는 시나리오에 유용합니다.
- **기능**: `Parameters` 객체를 암호화하여 토큰을 생성합니다. 전역적으로 설정된 패스워드를 사용하거나, 작업 단위로 패스워드를 직접 제공하여 토큰을 생성, 분석, 검증하는 메서드를 제공합니다.

#### 2.3. `TimeLimitedPBTokenIssuer`

- **역할**: 인증에 주로 사용되는 **시간제한이 있는 토큰**을 발급하고 검증합니다.
- **토큰 구조**: `암호화(만료_타임스탬프 + "_" + 페이로드)` 형태로 구성됩니다.
    - **만료 타임스탬프**: 만료 시간(밀리초 단위의 Unix 타임스탬프)을 36진수 문자열로 변환하여 길이를 줄입니다.
    - **페이로드**: `Parameters` 객체에 담긴 사용자 정보 등 부가 데이터입니다.
- **기본 만료 시간**: 만료 시간을 별도로 지정하지 않으면 기본값인 30초가 적용됩니다.

#### 2.4. 예외 처리

토큰을 분석하거나 검증할 때, 실패 원인을 나타내기 위해 다음과 같은 특정 예외가 발생합니다.
- `InvalidPBTokenException`: 토큰의 형식이 잘못되었거나, 변조되었거나, 복호화할 수 없는 경우에 발생하는 기본 예외입니다.
- `ExpiredPBTokenException`: `InvalidPBTokenException`의 하위 클래스로, 시간제한이 있는 토큰이 만료 시간을 초과했을 때 특별히 발생합니다. 이를 통해 만료된 토큰을 유효하지 않은 다른 토큰과 다르게 처리할 수 있습니다(예: 사용자에게 세션 갱신을 요청).

## 3. 인증 토큰의 생성 및 활용 예시

실제 Aspectran 애플리케이션에서 토큰이 어떻게 설정되고 사용되는지 `aspectow-appmon` 데모 프로젝트를 예로 들어 살펴보겠습니다.

#### 3.1. 암호화 패스워드 설정

먼저, `aspectran-config.apon` 파일에서 시스템 속성을 통해 암호화에 사용할 패스워드를 설정합니다.

```apon
system: {
    properties: {
        aspectran.encryption.password: demo!
        # ... other properties
    }
}
```

애플리케이션이 시작되면 `PBEncryptionUtils`는 이 `demo!`라는 패스워드를 읽어 기본 암호화기를 초기화합니다.

#### 3.2. 토큰 발급

서비스 로직(예: 로그인 성공 후)에서 다음과 같이 간단하게 시간제한이 있는 토큰을 발급할 수 있습니다.

```java
import com.aspectran.utils.security.TimeLimitedPBTokenIssuer;
import com.aspectran.utils.apon.Parameters;
import com.aspectran.utils.apon.VariableParameters;

public class AuthService {

    /**
     * 기본 만료 시간(30초)을 가진 토큰을 발급합니다.
     */
    public String issueSimpleToken() {
        return TimeLimitedPBTokenIssuer.createToken();
    }

    /**
     * 사용자 정보를 페이로드에 담고, 만료 시간을 1시간으로 지정하여 토큰을 발급합니다.
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

#### 3.3. 토큰 검증

클라이언트(예: 웹소켓 클라이언트)는 발급받은 토큰을 요청에 포함하여 전송합니다. 서버에서는 이 토큰을 검증하여 인가된 요청인지 확인합니다. 만료된 토큰과 유효하지 않은 토큰 같은 다양한 실패 시나리오를 처리하는 견고한 구현이 필요합니다.

```java
import com.aspectran.utils.apon.Parameters;
import com.aspectran.utils.security.ExpiredPBTokenException;
import com.aspectran.utils.security.InvalidPBTokenException;
import com.aspectran.utils.security.TimeLimitedPBTokenIssuer;

...

@Override
protected boolean checkAuthorized(@NonNull Session session) {
    // URL 경로에서 토큰을 추출합니다. (e.g., /backend/{token}/websocket)
    String token = session.getPathParameters().get("token");
    try {
        // 한 번에 토큰을 검증하고 페이로드를 분석합니다.
        Parameters payload = TimeLimitedPBTokenIssuer.parseToken(token);
        String userId = payload.getString("userId");
        // 나중에 사용하기 위해 세션에 사용자 정보를 저장합니다.
        session.setAttribute("userId", userId);
        logger.debug("사용자 {}에 대한 토큰 검증 성공", userId);
        return true;
    } catch (ExpiredPBTokenException e) {
        // 만료된 토큰을 구체적으로 처리합니다.
        logger.warn("만료된 토큰 수신: {}", e.getToken());
        // 선택적으로, 여기서 토큰 갱신 절차를 시작할 수 있습니다.
        return false;
    } catch (InvalidPBTokenException e) {
        // 다른 모든 유효하지 않은 토큰 오류(형식 오류, 변조 등)를 처리합니다.
        logger.error("유효하지 않은 토큰 수신: {}", e.getToken(), e);
        return false;
    }
}
```

## 4. 커스터마이징 및 고급 활용

#### 4.1. 암호화 알고리즘 변경

기본 알고리즘인 `PBEWITHHMACSHA256ANDAES_128`은 보안성이 매우 높지만, 암호화된 문자열의 길이가 깁니다. 만약 높은 수준의 보안이 필요 없고, 토큰 길이를 줄이는 것이 더 중요하다면 다음과 같이 시스템 속성을 설정하여 구형 알고리즘으로 변경할 수 있습니다.

```apon
system: {
    properties: {
        aspectran.encryption.password: your-password
        aspectran.encryption.algorithm: PBEWithMD5AndTripleDES
    }
}
```

**경고**: 이 방식은 보안 수준을 크게 낮추므로, 민감한 데이터를 다루지 않는 제한적인 경우에만 사용해야 합니다.

#### 4.2. 안전한 패스워드 관리

데모와 달리 **프로덕션 환경에서는 절대로 설정 파일에 패스워드를 평문으로 저장해서는 안 됩니다.** 대신, 다음과 같은 안전한 방법을 사용하세요.

- **환경 변수 사용**: 애플리케이션 실행 시 환경 변수로부터 패스워드를 읽어와 JVM 시스템 속성으로 전달합니다.

    ```sh
    java -Daspectran.encryption.password=$MY_APP_SECRET -jar my-app.jar
    ```

- **외부 설정 관리 도구**: HashiCorp Vault, AWS Secrets Manager 등과 같은 외부 시크릿 관리 도구와 연동하여 패스워드를 동적으로 주입받습니다.

#### 4.3. 토큰별로 다른 패스워드 사용하기

`PBEncryptionUtils`가 전역 기본 패스워드를 설정하지만, 특정 토큰에 대해 다른 패스워드를 사용해야 하는 경우가 있을 수 있습니다. `PBTokenIssuer`와 `TimeLimitedPBTokenIssuer`는 모두 `encryptionPassword`를 인자로 받는 메서드 오버로드를 제공합니다.

이는 멀티테넌트 환경이나 자체 암호화 시크릿을 가진 외부 시스템과 통합할 때 유용합니다.

**사용자 정의 패스워드로 토큰 발급하기:**
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

**사용자 정의 패스워드로 토큰 검증하기:**
```java
try {
    Parameters payload = TimeLimitedPBTokenIssuer.parseToken(token, customPassword);
    // 토큰이 유효하고 페이로드가 추출되었습니다.
} catch (InvalidPBTokenException e) {
    // 예외 처리
}
```

#### 4.4. 사용자 정의 페이로드 타입으로 작업하기

더 나은 타입 안정성과 코드 구성을 위해, `com.aspectran.utils.apon.Defaultarameters`를 확장하는 사용자 정의 클래스를 정의하여 토큰 페이로드를 나타낼 수 있습니다. 토큰을 분석할 때 이 클래스를 지정하면 페이로드가 자동으로 사용자 정의 타입에 매핑됩니다.

**1. 사용자 정의 페이로드 클래스 정의:**
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

**2. 사용자 정의 타입으로 토큰 발급 및 분석:**
```java
// 발급
UserPayload payloadToIssue = new UserPayload();
payloadToIssue.putValue("userId", "testuser");
payloadToIssue.putValue("role", "admin");
String token = TimeLimitedPBTokenIssuer.createToken(payloadToIssue);

// 분석
try {
    UserPayload parsedPayload = TimeLimitedPBTokenIssuer.parseToken(token, UserPayload.class);
    String userId = parsedPayload.getUserId(); // 타입-세이프 접근
    String role = parsedPayload.getRole();
    System.out.println("User: " + userId + ", Role: " + role);
} catch (InvalidPBTokenException e) {
    // 예외 처리
}
```

## 5. 결론

Aspectran이 제공하는 PBE 기반 토큰 인증 방식은 다음과 같은 장점을 가집니다.

- **단순성**: 복잡한 설정 없이 몇 줄의 코드로 안전한 인증 토큰을 생성하고 검증할 수 있습니다.
- **상태 비저장(Stateless)**: 토큰 자체에 만료 시간과 사용자 정보가 포함되므로, 서버에 별도의 세션 정보를 저장할 필요가 없어 확장성이 뛰어납니다.
- **유연성**: 시스템 속성을 통해 암호화 알고리즘과 패스워드를 쉽게 변경할 수 있어 다양한 환경 요구사항에 맞게 조정할 수 있습니다.

이 가이드를 통해 Aspectran의 강력한 보안 기능을 애플리케이션에 효과적으로 적용하시길 바랍니다.
