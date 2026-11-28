---
title: Aspectran 파일 업로드 실용 가이드
subheadline: 실용 가이드
---

웹 애플리케이션에서 파일 업로드는 사용자 프로필 이미지, 문서 첨부, 대용량 미디어 전송 등 다양한 요구사항을 해결하는 필수 기능입니다. 동시에 파일 업로드는 악성 파일 업로드, 무단 디스크 채우기(DoS), 대용량 페이로드로 인한 메모리 고갈 등 보안 공격의 주요 표적이 되는 민감한 영역이기도 합니다.

Aspectran은 이러한 파일 업로드 기능을 안전하고 유연하게 제어할 수 있도록 **보안 중심의 화이트리스트 아키텍처**, **런타임 환경별 최적화된 `MultipartFormDataParser` 구현체**, 그리고 **AOP Aspect 기반의 중앙 집중식 정책 관리**를 제공합니다.

이 가이드에서는 파일 업로드 파서의 종류와 설정, Aspect를 이용한 업로드 정책 통제, `@Multipart` 어노테이션 및 `FileParameter`를 활용한 실전 개발 방법까지 상세히 살펴봅니다.

## 1. 파일 업로드 아키텍처 및 보안 철학

Aspectran의 파일 업로드 처리는 다음과 같은 핵심 원칙을 바탕으로 설계되었습니다.

### 1.1. 화이트리스트 기반 멀티파트 처리

많은 웹 프레임워크가 모든 HTTP 요청에 대해 `multipart/form-data` 헤더가 감지되면 무조건 파싱을 시도합니다. 그러나 이러한 방식은 파일 업로드가 필요 없는 일반 엔드포인트까지 공격 대상이 되게 하며, 불필요한 디스크 I/O나 메모리 할당을 유발합니다.

Aspectran은 기본적으로 **허가되지 않은 엔드포인트의 멀티파트 요청은 파싱하지 않습니다.**
*   액션 메소드에 `FileParameter` 인자가 선언되어 있거나,
*   `@Multipart` 어노테이션으로 명시되어 있거나,
*   AOP Aspect를 통해 특정 URL 패턴(Pointcut)에 파서가 명시적으로 허용된 경우에만

멀티파트 파서가 동작하여 요청 바디를 분석합니다. 인가되지 않은 엔드포인트로 들어온 멀티파트 요청은 보안 경고 로그만 남기고 무시되므로, 잠재적인 멀티파트 기반 서비스 거부(DoS) 공격을 원천 차단합니다.

### 1.2. Aspect 기반의 정책 분리

파일 업로드는 업무 성격에 따라 요구되는 정책이 완전히 다릅니다. 예를 들어 사용자 프로필 이미지는 5MB 이하의 이미지 확장자만 허용해야 하지만, 관리자 자료실은 100MB 이하의 압축 파일이나 문서를 허용해야 할 수 있습니다.

Aspectran에서는 이러한 업로드 정책(크기 제한, 확장자 필터, 임시 파일 임계값)을 각각의 파서 빈으로 정의하고, **AOP Aspect의 Pointcut 규칙을 사용하여 URL 경로별로 적절한 파서를 주입**합니다. 이를 통해 비즈니스 코드의 수정 없이도 인프라 및 보안 정책을 완벽하게 통제할 수 있습니다.

## 2. MultipartFormDataParser 구현체와 설정

Aspectran은 서블릿 기반 엔터프라이즈 환경뿐만 아니라 Netty 기반 논블로킹 런타임(Aspectow Edge)까지 폭넓게 지원하며, 런타임 환경에 최적화된 2가지 표준 네이티브 파서 구현체를 제공합니다.

### 2.1. 파서 구현체 종류

1.  **`ServletMultipartFormDataParserFactoryBean` (서블릿 환경 권장)**:
    Jakarta Servlet 3.0+ / 6.0 사양의 표준 `Part` API를 기반으로 동작합니다. 서블릿 컨테이너(Tomcat, Jetty, Undertow 등) 자체의 고성능 멀티파트 처리 엔진을 활용하므로 서블릿 환경에서 가장 권장되는 표준 파서입니다.
    *   구현 클래스: `com.aspectran.web.servlet.support.multipart.ServletMultipartFormDataParser`
    *   팩토리 빈: `com.aspectran.web.servlet.support.multipart.ServletMultipartFormDataParserFactoryBean`
2.  **`NettyMultipartFormDataParser` (Netty / Aspectow Edge 환경 전용)**:
    Jakarta Servlet 환경이 아닌 Netty 기반 논블로킹 서버(Aspectow Edge) 환경에서는 Netty 네이티브 파서를 사용합니다. Netty의 비동기 `HttpPostRequestDecoder`를 기반으로 동작하며, 외부 서블릿 의존성 없이 비동기 논블로킹 환경에서 고성능 파일 업로드를 수행합니다.
    *   구현 클래스: `com.aspectran.netty.support.multipart.NettyMultipartFormDataParser`

### 2.2. 외부 라이브러리 무의존성 (Zero-Dependency)

Aspectran의 멀티파트 파일 업로드는 서블릿 컨테이너 내장 Part API 또는 Netty 내장 HTTP 코덱을 직접 활용합니다. 따라서 레거시 서드파티 라이브러리(Apache Commons FileUpload 등)에 대한 **외부 라이브러리 의존성이 전혀 필요하지 않습니다.**

순수 표준 API와 고성능 네이티브 코덱만을 사용하므로 라이브러리 충돌이나 네임스페이스(`javax` vs `jakarta`) 불일치 문제 없이 완벽한 Jakarta EE 및 Netty 런타임 호환성을 보장합니다.

### 2.3. 주요 설정 프로퍼티

각 파서는 다음과 같은 세밀한 보안 및 제어 프로퍼티를 제공합니다:

| 프로퍼티 이름 | 타입 | 설명 | 설정 예시 |
| :--- | :--- | :--- | :--- |
| `maxRequestSize` | String / Long | 전체 멀티파트 요청(모든 파일과 폼 필드의 합)의 최대 허용 크기 | `"10M"`, `"100M"` |
| `maxFileSize` | String / Long | 단일 파일당 최대 허용 크기 | `"5M"`, `"20M"` |
| `maxInMemorySize` | String / Long / Integer | 디스크에 임시 파일을 생성하기 전까지 메모리에 유지할 최대 바이트 크기 (서블릿 표준의 `fileSizeThreshold`와 동일) | `"256K"`, `"1M"` |
| `allowedFileExtensions` | String | 업로드를 허용할 파일 확장자 목록 (콤마 구분, 화이트리스트) | `"jpg,jpeg,png,gif"` |
| `deniedFileExtensions` | String | 업로드를 차단할 파일 확장자 목록 (콤마 구분, 블랙리스트) | `"exe,sh,jsp,bat"` |
| `tempDir` | String | 임시 파일이 저장될 서버의 디렉토리 경로 (생략 시 시스템 임시 디렉토리) | `"/var/app/tmp"` |

> 💡 **팁**\
> `maxRequestSize`, `maxFileSize`, `maxInMemorySize` 값에는 `B`, `K`, `M`, `G` 단위를 직관적인 문자열로 지정할 수 있습니다 (예: `10M` = 10 메가바이트).

### 2.4. 디스크 I/O 없는 인메모리(In-Memory) 처리 가이드

디스크 임시 파일 생성을 완전히 생략하고 메모리 상에서만 초고속으로 파일을 처리하고 싶은 경우, 별도의 외부 인메모리 파서 없이도 **`maxInMemorySize`를 `maxFileSize`와 동일하거나 크게 설정**하면 디스크 I/O 없는 100% 인메모리 업로드가 가능합니다.

> ⚠️ **주의 (메모리 고갈 방지)**\
> `maxInMemorySize`를 크게 설정하여 디스크 I/O 없이 메모리에서만 처리하는 방식은 썸네일, 아바타 아이콘, 서명 이미지, 경량 텍스트/CSV와 같은 **작은 크기의 파일(수백 KB ~ 최대 1~2MB 내외)에 대해서만 안전하게 적용**해야 합니다. 대용량 파일에 대해 이 값을 무리하게 크게 설정하면, 동시 다발적인 업로드 요청 시 JVM 힙 메모리가 급격히 잠식되어 전체 시스템이 다운되는 치명적인 **OOM(Out Of Memory)** 장애가 발생할 수 있습니다.

### 2.5. 파서 빈 정의 예제

다음은 런타임 환경과 용도에 따른 XML 파서 빈 등록 예제입니다.

```xml
<!-- 1. 표준 서블릿 기반 멀티파트 파서 (서블릿 환경, 일반 파일용) -->
<bean id="standardFileUploader"
      class="com.aspectran.web.servlet.support.multipart.ServletMultipartFormDataParserFactoryBean">
    <description>
        Jakarta Servlet 표준 Part API를 사용하는 일반 파일 업로더
    </description>
    <properties>
        <item name="maxRequestSize" value="20M"/>
        <item name="maxFileSize" value="10M"/>
        <item name="maxInMemorySize" value="512K"/>
        <item name="allowedFileExtensions" value="jpg,jpeg,png,gif,pdf,zip"/>
        <item name="deniedFileExtensions" value="jsp,sh,bat,exe"/>
    </properties>
</bean>

<!-- 2. 인메모리 고속 처리 전용 파서 (경량 썸네일/아이콘 전용, 작은 파일에만 권장) -->
<bean id="inMemoryFileUploader"
      class="com.aspectran.web.servlet.support.multipart.ServletMultipartFormDataParserFactoryBean">
    <description>
        소용량 파일에 대해 임시 파일 생성 없이 메모리에서만 초고속 처리하는 경량 업로더
    </description>
    <properties>
        <item name="maxRequestSize" value="1M"/>
        <item name="maxFileSize" value="500K"/>
        <!-- maxInMemorySize를 maxFileSize와 동일하게 설정하여 디스크 I/O 원천 차단 -->
        <item name="maxInMemorySize" value="500K"/>
        <item name="allowedFileExtensions" value="jpg,png,svg"/>
    </properties>
</bean>

<!-- 3. Netty 네이티브 멀티파트 파서 (Aspectow Edge 전용) -->
<bean id="nettyFileUploader"
      class="com.aspectran.netty.support.multipart.NettyMultipartFormDataParser">
    <description>
        Netty의 비동기 디코더를 사용하는 Aspectow Edge 전용 고성능 업로더
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

## 3. Aspect를 통한 업로드 정책 중앙 관리

Aspectran에서는 업로드 파서를 액션 코드에 하드코딩하지 않고, **AOP Aspect의 `<settings>`를 통해 특정 엔드포인트에 주입하는 방식**을 권장합니다.

### 3.1. XML 기반 Aspect 정의

특정 URL 패턴으로 들어오는 `POST`, `PUT` 요청에 대해서만 파일 업로더를 허용하는 Aspect를 정의합니다.

```xml
<!-- 파일 업로드를 허용하는 URL 패턴에만 standardFileUploader 주입 -->
<aspect id="fileUploadAspect">
    <description>
        지정된 업로드 엔드포인트에 표준 파일 업로더 정책을 적용합니다.
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

*   `pointcut`에 명시된 URL 패턴으로 `POST`나 `PUT` 요청이 들어오면, Aspectran은 요청 라이프사이클의 초기 단계에서 `multipartFormDataParser` 설정 값을 확인하고 `standardFileUploader` 빈을 주입하여 멀티파트 바디를 파싱합니다.
*   이 Aspect의 적용 범위 밖인 일반 URL로 악의적인 멀티파트 데이터가 전송되더라도 파서가 동작하지 않으므로 안전합니다.

### 3.2. Java 어노테이션 기반 Aspect 정의

Java 설정 코드를 선호하는 경우 `@Aspect`, `@Joinpoint`, `@Settings` 어노테이션을 사용하여 동일한 정책을 구성할 수 있습니다.

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
    // 필요한 경우 @Before나 @After 어드바이스 메소드를 추가하여
    // 업로드 전후의 부가적인 로깅이나 인가 검증을 수행할 수도 있습니다.
}
```

### 3.3. 다중 파서 분리 운용 전략

서비스 규모가 커지면 용도별로 다른 파서 정책을 적용해야 합니다:
*   `/members/*/profile-image`: 이미지 확장자만 허용하는 2MB 제한 파서
*   `/admin/releases`: 500MB까지 허용하는 대용량 파서
*   `/api/icons`: 작은 크기의 아이콘을 디스크 쓰기 없이 처리하는 `inMemoryFileUploader`

각각의 파서 빈을 정의한 후, Pointcut을 나누어 각 URL에 맞는 파서를 매핑하면 업무별 업로드 정책을 완벽하게 분리할 수 있습니다.

## 4. Translet과의 연계 (`@Multipart`, `FileParameter`)

서블릿 기반 웹 환경(Aspectow Enterprise 등)이든 Netty 기반 논블로킹 환경(Aspectow Edge)이든, 트랜슬릿 액션 메소드에서 파일 업로드를 수신하고 처리하는 프로그래밍 모델은 완전히 동일합니다. Aspect로 정의된 환경 위에서 개발자는 일관된 방식으로 업로드 요청을 다룰 수 있습니다.

### 4.1. 파일 파라미터 자동 감지 (Zero-Configuration)

액션 메소드의 파라미터에 `FileParameter`, `FileParameter[]`, `FileParameterMap`이 선언되어 있으면 Aspectran은 해당 트랜슬릿을 자동으로 멀티파트 처리 대상으로 인식합니다.

```java
@Component
public class UploadController {

    // 1. 단일 파일 수신 (폼 필드명과 파라미터명 자동 일치)
    @RequestToPost("/upload/single")
    public void uploadSingle(FileParameter file) {
        if (file != null && !file.isEmpty()) {
            // 파일 처리
        }
    }

    // 2. 다중 파일 수신 (@Qualifier로 필드명 지정)
    @RequestToPost("/upload/multiple")
    public void uploadMultiple(@Qualifier("attachments") FileParameter[] files) {
        if (files != null) {
            for (FileParameter file : files) {
                // 개별 파일 처리
            }
        }
    }

    // 3. 모든 업로드 파일을 Map으로 수신
    @RequestToPost("/upload/map")
    public void uploadAll(FileParameterMap fileMap) {
        FileParameter[] profileImages = fileMap.getFileParameter("profile");
        FileParameter[] documents = fileMap.getFileParameter("document");
    }
}
```

### 4.2. `@Multipart` 어노테이션 활용

파일 파라미터 외에 폼 데이터만 파싱하거나, 특정 액션 메소드에 전용 파서를 직접 지정해야 할 때는 `@Multipart` 어노테이션을 사용합니다.

*   `@Multipart`: 기본 파서를 사용하여 멀티파트 요청을 처리합니다.
*   `@Multipart("customParser")`: 지정된 ID의 파서 빈을 명시적으로 사용합니다.
*   클래스 레벨에 붙이면 해당 클래스의 모든 요청에 멀티파트 처리가 적용됩니다.

```java
@Component
public class AdminReleaseActivity {

    // 대용량 전용 파서 빈 명시적 지정
    @RequestToPost("/admin/releases/upload")
    @Multipart("largeReleaseFileUploader")
    public void uploadRelease(FileParameter binaryFile) {
        // largeReleaseFileUploader 빈의 크기 및 정책에 따라 파싱됨
    }
}
```

### 4.3. 파서 빈 해석 우선순위

멀티파트 요청이 들어왔을 때 Aspectran이 사용할 파서 빈을 찾는 우선순위는 다음과 같습니다:

1.  **1순위 (트랜슬릿 직접 지정)**: `@Multipart("beanName")`에 지정된 빈 이름
2.  **2순위 (Aspect Setting)**: 현재 요청의 Aspect에 정의된 `<setting name="multipartFormDataParser" value="beanName"/>`
3.  **3순위 (기본 빈 ID)**: 컨테이너에 ID가 `"multipartFormDataParser"`로 등록된 빈
4.  **4순위 (타입 기반 단일 빈)**: 컨테이너에 `MultipartFormDataParser` 타입의 빈이 단 1개만 등록되어 있을 때 자동 주입

> 💡 **참고**\
> 일반적인 웹 서비스에서는 하나의 기본 파서 빈만 등록해두고 사용하므로, 복잡한 설정 없이 파서 이름을 생략한 `@Multipart` 또는 `FileParameter` 선언만으로 완벽하게 동작합니다.

### 4.4. 애플리케이션 시작 시점 사전 검증

만약 `@Multipart("myUploader")`처럼 특정 파서 빈의 이름을 지정했는데 해당 빈이 컨테이너에 존재하지 않는다면, Aspectran은 **애플리케이션 시작(Context 빌드) 시점**에 이를 감지하여 `BeanReferenceException`을 발생시킵니다.

```text
ERROR [main] Cannot resolve reference to bean 'myUploader'; Referer: transletRule {name=/admin/releases/upload, method=[POST], ...}

Caused by: com.aspectran.core.context.rule.validation.BeanReferenceException: Found 1 broken bean reference(s):
1. Cannot resolve reference to bean 'myUploader'; Referer: transletRule {name=/admin/releases/upload, method=[POST], ...}
```

실제 사용자가 파일을 업로드하는 런타임 시점에 장애가 발생하는 것을 원천 차단하고, 개발 및 배포 단계에서 설정 오류를 즉시 바로잡을 수 있습니다.

## 5. FileParameter API와 안전한 파일 처리

주입받은 `FileParameter` 객체는 업로드된 파일의 메타데이터와 콘텐츠에 접근하고, 안전하게 저장할 수 있는 강력한 API를 제공합니다.

### 5.1. 주요 메서드

*   **`getFileName()`**: 클라이언트가 전송한 원본 파일 이름을 반환합니다.
*   **`getFileSize()`**: 업로드된 파일의 크기(바이트)를 반환합니다.
*   **`getContentType()`**: 파일의 MIME 타입을 반환합니다.
*   **`isEmpty()`**: 파일이 비어있는지(크기가 0이거나 이름이 없는지) 확인합니다.
*   **`save(File destFile)` / `save(Path destPath)`**: 지정된 파일이나 경로로 업로드된 파일을 영구 저장합니다. (필요한 상위 디렉토리를 자동으로 생성합니다)
*   **`getInputStream()`**: 파일 내용을 스트림으로 직접 읽습니다.
*   **`getBytes()`**: 파일 내용을 메모리 바이트 배열(`byte[]`)로 읽습니다.
*   **`delete()`**: 생성된 임시 파일을 수동으로 즉시 삭제합니다.

### 5.2. 실전 파일 저장 예제

다음은 업로드된 파일을 안전하게 저장하고 파일 메타데이터를 반환하는 모범 예제입니다.

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

        // 1. 원본 파일 이름 및 크기 확인
        String originalFilename = file.getFileName();
        long fileSize = file.getFileSize();

        // 2. 보안: Path Traversal 방어를 위해 순수 파일명만 추출
        String baseName = FilenameUtils.getName(originalFilename);

        // 3. 고유한 저장 파일명 생성 (예: UUID)
        String extension = FilenameUtils.getExtension(baseName);
        String savedFilename = UUID.randomUUID() + (extension.isEmpty() ? "" : "." + extension);

        // 4. 안전한 저장 경로 생성 및 파일 저장
        // save() 메서드는 상위 디렉토리가 없으면 자동으로 생성해 줍니다.
        File destination = new File(uploadDir, savedFilename);
        file.save(destination);

        return new UploadResult(originalFilename, savedFilename, fileSize);
    }
}
```

### 5.3. 임시 파일 생명주기와 리소스 정리

*   업로드된 파일 데이터는 파싱 과정에서 서버의 임시 저장소(또는 메모리)에 보관됩니다.
*   `file.save(destination)`를 호출하면 임시 파일이 지정된 목적지 경로로 안전하게 이동(Rename 또는 Copy)됩니다.
*   저장되지 않고 남은 임시 파일은 **요청 처리(Activity)가 완료되는 시점에 Aspectran 컨테이너에 의해 자동으로 안전하게 삭제**되므로 디스크 누수가 발생하지 않습니다.
