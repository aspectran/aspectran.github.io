---
format: plate solid article
sidebar: toc
title: 레거시 시스템과 최신 Aspectran 애플리케이션 서버 연동 가이드
subheadline: 실용 가이드
parent_path: /docs
---

## 서론

기존에 구축된 레거시 시스템은 종종 최신 기술 스택으로 개발된 애플리케이션과의 연동에 어려움을 겪습니다. 특히, Java 개발 환경에서는 JDK 버전 차이로 인해 라이브러리 호환성 문제가 발생할 수 있습니다. Aspectran 프레임워크는 이러한 문제를 해결하기 위해 `aspectran-utils-legacy` 모듈을 제공합니다. 이 문서는 JDK 21 미만 버전을 사용하는 레거시 시스템이 최신 Aspectran 애플리케이션 서버의 API를 효율적으로 호출하고 응답을 처리하는 방법을 안내합니다.

## `aspectran-utils-legacy` 모듈의 목적

`aspectran-utils-legacy` 모듈은 JDK 1.6부터 JDK 17까지의 Java 버전을 사용하는 레거시 시스템과 JDK 21 이상을 사용하는 최신 Aspectran 애플리케이션 서버 간의 원활한 API 호출 및 응답 처리를 지원하기 위한 호환성 계층(Compatibility Layer) 역할을 합니다. 이 모듈은 레거시 환경에서 최신 Aspectran 서버와 통신하는 데 필요한 유틸리티 기능을 제공하여, 기존 코드의 대대적인 수정 없이도 연동이 가능하도록 돕습니다.

**참고:** JDK 21 이상을 사용하는 시스템의 경우, 별도의 `aspectran-utils-legacy` 모듈을 사용할 필요 없이 표준 `aspectran-utils` 모듈을 직접 사용하시면 됩니다.

## 주요 기능 및 이점

*   **광범위한 JDK 호환성:** JDK 1.6부터 JDK 17까지의 다양한 레거시 Java 환경을 지원하여, 오래된 시스템에서도 최신 Aspectran 서버와 연동할 수 있습니다.
*   **API 호출 간소화:** JSON 또는 APON(Aspectran Object Notation) 형식의 데이터를 쉽게 직렬화(Serialization) 및 역직렬화(Deserialization)할 수 있는 기능을 제공하여, API 요청 및 응답 처리를 간소화합니다.
*   **보안 통신 지원:** `PBEncryptionUtils`와 같은 유틸리티를 활용하여 민감한 데이터를 안전하게 암호화하고 복호화할 수 있습니다.
*   **레거시 코드 변경 최소화:** 기존 레거시 시스템의 코드베이스에 최소한의 변경만으로 최신 Aspectran 서버와의 연동 기능을 추가할 수 있도록 설계되었습니다.

## 모듈 사용 방법

### 1. 의존성 추가

Maven 프로젝트의 경우, `pom.xml` 파일에 다음 의존성을 추가합니다.

```xml
<dependency>
    <groupId>com.aspectran</groupId>
    <artifactId>aspectran-utils-legacy</artifactId>
    <version>1.0.0</version> <!-- 실제 버전에 맞게 조정하세요 -->
</dependency>
```

Gradle 프로젝트의 경우, `build.gradle` 파일에 다음 의존성을 추가합니다.

```gradle
implementation 'com.aspectran:aspectran-utils-legacy:1.0.0' // 실제 버전에 맞게 조정하세요
```

### 2. 기본 사용 예시

`aspectran-utils-legacy` 모듈은 주로 데이터 직렬화/역직렬화 및 기타 유틸리티 기능을 통해 최신 Aspectran 서버와의 통신을 지원합니다.

#### JSON 데이터 처리 예시

레거시 시스템에서 최신 Aspectran 서버로 JSON 데이터를 전송하거나 수신할 때 `JsonWriter`와 `JsonReader`를 활용할 수 있습니다.

```java
import com.aspectran.utils.json.JsonWriter;
import com.aspectran.utils.json.JsonReader;
import com.aspectran.utils.apon.Parameters;
import com.aspectran.utils.apon.VariableParameters;

import java.io.StringWriter;
import java.io.IOException;

public class LegacyApiCaller {

    public static void main(String[] args) throws IOException {
        // 1. 최신 Aspectran 서버로 전송할 데이터 생성 (JSON 직렬화)
        Parameters requestParams = new VariableParameters();
        requestParams.putValue("userId", "legacyUser");
        requestParams.putValue("data", "hello from legacy");

        StringWriter stringWriter = new StringWriter();
        JsonWriter jsonWriter = new JsonWriter(stringWriter);
        jsonWriter.write(requestParams); // Parameters 객체를 JSON 문자열로 변환
        String jsonRequest = stringWriter.toString();

        System.out.println("Generated JSON Request: " + jsonRequest);

        // 2. 최신 Aspectran 서버로부터 받은 JSON 응답 처리 (JSON 역직렬화)
        String jsonResponse = "{\"status\":\"success\",\"message\":\"Data received!\"}";
        JsonReader jsonReader = new JsonReader(jsonResponse);
        Parameters responseParams = new VariableParameters();
        jsonReader.read(responseParams); // JSON 문자열을 Parameters 객체로 변환

        System.out.println("Received Status: " + responseParams.getString("status"));
        System.out.println("Received Message: " + responseParams.getString("message"));
    }
}
```

#### APON 데이터 처리 예시

APON 형식은 Aspectran 프레임워크에서 내부적으로 사용되는 경량 데이터 표현 방식입니다. 필요에 따라 APON을 사용하여 데이터를 처리할 수도 있습니다.

```java
import com.aspectran.utils.apon.AponWriter;
import com.aspectran.utils.apon.AponReader;
import com.aspectran.utils.apon.Parameters;
import com.aspectran.utils.apon.VariableParameters;

import java.io.IOException;
import java.io.StringWriter;

public class LegacyAponApiCaller {

    public static void main(String[] args) throws IOException {
        // 1. 최신 Aspectran 서버로 전송할 데이터 생성 (APON 직렬화)
        Parameters requestParams = new VariableParameters();
        requestParams.putValue("action", "processOrder");
        requestParams.putValue("orderId", 12345);

        StringWriter stringWriter = new StringWriter();
        AponWriter aponWriter = new AponWriter(stringWriter);
        aponWriter.write(requestParams); // Parameters 객체를 APON 문자열로 변환
        String aponRequest = stringWriter.toString();

        System.out.println("Generated APON Request:\n" + aponRequest);

        // 2. 최신 Aspectran 서버로부터 받은 APON 응답 처리 (APON 역직렬화)
        String aponResponse = "status: success\nmessage: Order processed successfully\n";
        AponReader aponReader = new AponReader(aponResponse);
        Parameters responseParams = new VariableParameters();
        aponReader.read(responseParams); // APON 문자열을 Parameters 객체로 변환

        System.out.println("Received Status: " + responseParams.getString("status"));
        System.out.println("Received Message: " + responseParams.getString("message"));
    }
}
```

#### 암호화된 속성 처리 예시

`PBEncryptionUtils`를 사용하여 설정 파일이나 데이터 내의 민감한 정보를 암호화하고 복호화할 수 있습니다.

```java
import com.aspectran.utils.PBEncryptionUtils;

public class LegacyEncryptionExample {

    public static void main(String[] args) {
        String password = "my-secret-key";
        String originalText = "SensitiveData123!";

        // 암호화
        String encryptedText = PBEncryptionUtils.encrypt(originalText, password);
        System.out.println("Original: " + originalText);
        System.out.println("Encrypted: " + encryptedText);

        // 복호화
        String decryptedText = PBEncryptionUtils.decrypt(encryptedText, password);
        System.out.println("Decrypted: " + decryptedText);

        // 검증
        System.out.println("Decryption successful: " + originalText.equals(decryptedText));
    }
}
```

## 환경 설정

`aspectran-utils-legacy` 모듈은 암호화 및 속성 파일 인코딩과 관련된 특정 환경 변수를 통해 동작을 제어할 수 있습니다. 이러한 환경 변수는 JVM 시작 시 `-D` 옵션을 통해 설정하거나, 애플리케이션 코드 내에서 `System.setProperty()` 메서드를 사용하여 설정할 수 있습니다.

### 암호화 설정

`PBEncryptionUtils`를 사용하여 암호화된 속성을 처리할 경우, 다음 시스템 속성을 설정할 수 있습니다.

*   **`aspectran.encryption.algorithm`**: 암호화에 사용될 알고리즘을 지정합니다. 기본값은 `PBEWithMD5AndTripleDES`입니다.
    *   **경고**: `PBEWithMD5AndTripleDES`는 현재 안전하지 않은(insecure) 알고리즘으로 간주됩니다. 더 높은 보안을 위해서는 `PBEWITHHMACSHA256ANDAES_128`과 같은 더 강력한 알고리즘을 사용하는 것을 권장합니다.
    ```
    -Daspectran.encryption.algorithm=PBEWITHHMACSHA256ANDAES_128
    ```
*   **`aspectran.encryption.password`**: 암호화 및 복호화에 사용될 비밀번호를 지정합니다. 이 비밀번호는 안전하게 관리되어야 합니다.
    ```
    -Daspectran.encryption.password=your-secure-password
    ```

### 속성 파일 인코딩 설정

속성 파일(`*.properties`)을 로드할 때 사용할 기본 인코딩을 지정할 수 있습니다.

*   **`aspectran.properties.encoding`**: 속성 파일의 인코딩을 지정합니다. 기본값은 `ISO-8859-1`입니다. `UTF-8`과 같이 다른 인코딩을 사용하는 경우 이 속성을 설정해야 합니다.
    ```
    -Daspectran.properties.encoding=UTF-8
    ```

**예시 (JVM 시작 시 설정):**

```bash
java -Daspectran.encryption.algorithm=PBEWITHHMACSHA256ANDAES_128 \
     -Daspectran.encryption.password=your-secure-password \
     -Daspectran.properties.encoding=UTF-8 \
     -jar your-legacy-app.jar
```

## 고려 사항 및 제한 사항

*   **호환성 계층:** `aspectran-utils-legacy` 모듈은 레거시 시스템과의 호환성을 위해 설계되었으며, 최신 Aspectran 프레임워크의 모든 기능을 레거시 환경에서 완벽하게 재현하는 것을 목표로 하지 않습니다. 주로 데이터 형식 변환 및 기본 유틸리티 기능에 중점을 둡니다.
*   **성능:** `WeakHashMap`과 같은 참조 기반 캐시를 사용하므로, 메모리 효율성은 좋지만, 특정 고부하 환경에서는 최신 JDK의 `ConcurrentHashMap`만큼의 성능을 기대하기 어려울 수 있습니다.
*   **의존성 관리:** 레거시 시스템의 빌드 환경에 따라 Maven/Gradle 의존성 관리가 다소 복잡할 수 있습니다. 필요한 경우, `aspectran-utils-legacy` 모듈을 직접 빌드하여 JAR 파일을 레거시 프로젝트에 포함해야 할 수도 있습니다.

## 결론

`aspectran-utils-legacy` 모듈은 기존 레거시 시스템을 최신 Aspectran 애플리케이션 서버와 효과적으로 연동할 수 있는 실용적인 솔루션을 제공합니다. 이 모듈을 통해 레거시 시스템의 수명 주기를 연장하고, 현대적인 마이크로서비스 아키텍처로의 점진적인 전환을 용이하게 할 수 있습니다.
