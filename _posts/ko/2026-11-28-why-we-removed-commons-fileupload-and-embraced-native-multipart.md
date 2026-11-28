---
subheadline: Case Study
title: "왜 Apache Commons FileUpload를 버렸는가: 서블릿 표준과 Netty 네이티브로 완성한 Zero-Dependency 파일 업로드 아키텍처"
teaser: "20년 된 레거시 의존성 commons-fileupload와 commons-io를 과감히 걷어내고, Jakarta Servlet 6.0 표준과 Netty 네이티브 코덱을 바탕으로 가볍고 견고한 Zero-Dependency 멀티파트 아키텍처로 탈바꿈한 리팩토링 여정을 공유합니다."
categories:
  - architecture
tags: [Aspectran, Architecture, File Upload, Servlet, Netty, Zero Dependency, Jakarta EE, Case Study, Refactoring]
published: true
mermaid: true
---

{% capture info_message %}
**사례 연구:** 본 포스트는 Aspectran의 웹 서블릿 모듈(`aspectran-web-servlet`)에서 오랫동안 유지되어 오던 `commons-fileupload` 및 `commons-io` 의존성을 완전히 제거하고, Jakarta Servlet 6.0 표준 `Part` API와 Netty 비동기 코덱 중심의 **순수 네이티브 멀티파트 아키텍처**로 재편한 기술적 배경과 설계 의사결정 과정을 상세히 기록한 글입니다.
{% endcapture %}
{% include alert.liquid info=info_message %}

프레임워크를 개발하고 발전시키는 과정에서 가장 경계해야 할 유혹 중 하나는 **"과거에 잘 동작했으니 그대로 둔다"**는 타성입니다. 특히 자바 웹 생태계가 Java EE 8에서 Jakarta EE 10(Servlet 6.0)으로 거대한 패러다임 전환을 이루고, 가상 스레드(Virtual Threads)와 논블로킹 비동기 런타임(Netty)이 주류로 자리 잡은 오늘날, 수십 년 된 레거시 서드파티 라이브러리를 관성적으로 유지하는 것은 기술 부채이자 잠재적인 런타임 리스크가 됩니다.

최근 Aspectran의 멀티파트 파일 업로드 서브시스템을 전면 점검하던 중, 우리는 오랫동안 깊숙이 자리 잡고 있던 **Apache Commons FileUpload**와 마주했습니다.

그리고 면밀한 바이트코드 분석, 생태계 동향 파악, 아키텍처 재설계를 거친 끝에, 마침내 **Commons FileUpload와 관련 의존성을 Aspectran에서 완전히 제거(Drop)**하기로 결정했습니다.

이 글에서는 Aspectran이 왜 20년 역사의 검증된 라이브러리를 버리게 되었는지, Spring Framework 6가 내린 결정과 어떤 공통된 기술적 배경이 있었는지, 그리고 이를 통해 어떻게 서블릿과 Netty 양대 런타임 모두에서 **단 1바이트의 외부 라이브러리도 필요 없는 Zero-Dependency 파일 업로드 아키텍처**를 완성했는지 그 생생한 리팩토링 여정을 공유합니다.
<!--more-->

## 1. 문제의 발단: Jakarta Servlet 6.0 환경에 도사린 `javax`의 유령

Aspectran 9.x는 Jakarta Servlet 6.0(Jakarta EE 10)과 Java 21+ 최신 스펙을 완벽하게 지원하는 현대적인 고성능 애플리케이션 프레임워크입니다. 그런데 파일 업로드 모듈인 `aspectran-web-servlet`의 `pom.xml`에는 여전히 다음과 같은 의존성이 남아 있었습니다:

```xml
<dependency>
    <groupId>commons-fileupload</groupId>
    <artifactId>commons-fileupload</artifactId>
    <version>1.6.0</version>
    <optional>true</optional>
</dependency>
<dependency>
    <groupId>commons-io</groupId>
    <artifactId>commons-io</artifactId>
    <version>2.22.0</version>
</dependency>
```

겉으로 보기에는 최신 릴리스인 `1.6.0` 버전을 사용하고 있었으므로 별문제가 없어 보였습니다. 하지만 라이브러리 내부를 바이트코드 수준에서 열어보았을 때 심각한 모순이 드러났습니다.

### 1.1 바이트코드 역어셈블이 드러낸 진실

`commons-fileupload-1.6.0.jar`에 포함된 핵심 서블릿 클래스들을 `javap`로 역어셈블하여 분석한 결과는 명백했습니다:

```java
// javap -cp commons-fileupload-1.6.0.jar org.apache.commons.fileupload.servlet.ServletFileUpload
public class org.apache.commons.fileupload.servlet.ServletFileUpload extends org.apache.commons.fileupload.FileUpload {
    public static final boolean isMultipartContent(javax.servlet.http.HttpServletRequest);
    public FileItemIterator getItemIterator(javax.servlet.http.HttpServletRequest) ...;
    public Map<String, List<FileItem>> parseParameterMap(javax.servlet.http.HttpServletRequest) ...;
    public List<FileItem> parseRequest(javax.servlet.http.HttpServletRequest) ...;
}

// javap -cp commons-fileupload-1.6.0.jar org.apache.commons.fileupload.servlet.FileCleanerCleanup
public class org.apache.commons.fileupload.servlet.FileCleanerCleanup implements javax.servlet.ServletContextListener {
    public static FileCleaningTracker getFileCleaningTracker(javax.servlet.ServletContext);
    public void contextDestroyed(javax.servlet.ServletContextEvent);
    public void contextInitialized(javax.servlet.ServletContextEvent);
}
```

Apache Commons FileUpload 1.x 계열(1.6.0 포함)은 2000년대 초반의 설계 원형을 그대로 유지하고 있었으며, **서블릿 인터페이스 전체가 `javax.servlet` 패키지에 강하게 결속**되어 있었습니다.

### 1.2 어떻게 그동안 런타임 에러 없이 동작했을까?

Jakarta EE 10 환경에서 `javax.servlet` 클래스를 호출하면 즉시 `NoClassDefFoundError`가 발생해야 마땅합니다. 그럼에도 Aspectran의 `CommonsMultipartFormDataParser`가 동작할 수 있었던 이유는 프레임워크 내부의 교묘한 우회 어댑터 덕분이었습니다:

```java
// 과거 Aspectran의 처리 방식
FileUpload upload = new ServletFileUpload(factory);
RequestContext requestContext = new CommonsRequestContext(requestAdapter);
fileItemListMap = upload.parseParameterMap(requestContext); // HttpServletRequest 대신 자체 RequestContext 전달
```

Aspectran은 `HttpServletRequest`를 직접 인자로 받는 `ServletFileUpload.parseRequest(request)` 메서드를 호출하지 않고, 자체 `RequestAdapter`로부터 스트림과 헤더를 읽어내는 `CommonsRequestContext`를 구현하여 상위 클래스의 `upload.parseParameterMap(RequestContext)`로 우회했습니다.

즉, **JVM이 `javax.servlet.http.HttpServletRequest` 바이트코드를 실제로 링크하지 않도록 곡예를 하듯 피해 가고 있었을 뿐**, 라이브러리 자체는 언제 터질지 모르는 시한폭탄과 같은 `javax` 종속성을 품고 있었던 것입니다.

## 2. 2.x 마이그레이션의 딜레마: Commons FileUpload 2.x는 진정한 대안인가?

첫 번째로 고려한 선택지는 당연히 Jakarta EE 환경을 공식 지원한다는 **Apache Commons FileUpload 2.x**로의 업그레이드였습니다:

```xml
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-fileupload2-jakarta-servlet6</artifactId>
    <version>2.0.0-M5</version>
</dependency>
```

그러나 도입을 면밀히 검토할수록 다음과 같은 치명적인 한계와 딜레마가 드러났습니다.

### 2.1 수년째 마일스톤에 갇힌 릴리스 생태계
Commons FileUpload 2.x는 놀랍게도 **2022년 봄부터 지금까지 수년째 정식 GA(General Availability) 버전을 출시하지 못하고 마일스톤(`2.0.0-M1` ~ `2.0.0-M5`) 단계에 정체**되어 있습니다. 

엔터프라이즈 환경에서 미션 크리티컬한 시스템을 지탱해야 하는 프레임워크 코어가, 정식 릴리스도 되지 않고 언제 내부 빌더 API나 제네릭 시그니처가 바뀔지 모르는 마일스톤 라이브러리를 공식 의존성으로 채택하는 것은 중대한 아키텍처 리스크였습니다.

### 2.2 전면적인 파괴적 변경(Breaking Changes)
2.x는 단순한 패키지 이름 변경(`javax` $\rightarrow$ `jakarta`)에 그치지 않고, 라이브러리 아키텍처 전반을 Builder 패턴과 제네릭 타입 기반으로 완전히 뜯어고쳤습니다:

```java
// 1.x 방식: 직관적인 생성자 주입
DiskFileItemFactory factory = new DiskFileItemFactory();
FileUpload upload = new ServletFileUpload(factory);

// 2.x 방식: 복잡한 빌더 패턴 및 제네릭 선언
DiskFileItemFactory factory = DiskFileItemFactory.builder()
        .setBufferSize(maxInMemorySize)
        .setPath(tempPath)
        .get();
JakartaServletFileUpload<DiskFileItem, DiskFileItemFactory> upload =
        new JakartaServletFileUpload<>(factory);
```

이러한 변경은 Aspectran의 `CommonsMultipartFormDataParser`, `CommonsMultipartFileParameter`, `CommonsRequestContext` 등 관련된 모든 어댑터 계층을 대대적으로 리팩토링해야 함을 의미했습니다.

여기서 우리는 근본적인 질문을 던지게 되었습니다:

> **"아직 정식 릴리스조차 나오지 않은 서드파티 라이브러리를 지원하기 위해, 프레임워크 코어에 이토록 많은 엔지니어링 리소스를 투입할 기술적 가치가 과연 존재하는가?"**

## 3. 거인의 발자취: Spring 6의 결단에서 얻은 확신

이 의문에 대한 해답을 찾던 중, 우리는 **Spring Framework 6.0(Spring Boot 3.0)**의 행보에서 결정적인 통찰을 얻었습니다.

Spring 역시 지난 20여 년간 파일 업로드의 상징과도 같았던 `CommonsMultipartResolver`를 탑재하고 있었습니다. 그러나 Spring 팀은 Jakarta EE 9/10 시대로 넘어가는 전환점에서 **`CommonsMultipartResolver`를 완벽하게 삭제(Removed)**하는 결단을 내렸습니다:

```
[Spring Framework 6.0 Migration Guide]
- Removed org.springframework.web.multipart.commons.CommonsMultipartResolver
- In Servlet environments, StandardServletMultipartResolver is the sole recommended mechanism.
```

Spring 팀이 Commons FileUpload를 버린 이유는 명확했습니다:

1. **서블릿 표준 API의 완성**: Servlet 3.0(2009년)에서 처음 도입된 표준 멀티파트 API(`HttpServletRequest.getParts()`, `Part`)는 지난 15년간 성숙하여, Tomcat, Jetty, Undertow 등 모든 모던 서블릿 컨테이너에 완벽하게 최적화되어 안착했습니다.
2. **서드파티 라이브러리의 실익 부재**: 컨테이너가 저수준 네이티브 I/O 레벨에서 고속으로 멀티파트를 처리해 주는데, 굳이 외부 라이브러리를 추가하여 메모리 복사와 래핑 오버헤드를 만들 이유가 전혀 없었습니다.
3. **Commons FileUpload 2.x의 오랜 정체**: Spring 6가 출시된 2022년 말에도, 그리고 지금까지도 Commons FileUpload 2.x는 정식 GA를 내놓지 못하고 있었습니다.

Spring이 내린 용기 있는 결단은 Aspectran이 나아가야 할 방향을 명확하게 비추어 주었습니다.

## 4. In-Memory 파서의 환상과 현실: OOM 위험과 `fileSizeThreshold`

Commons FileUpload를 걷어내는 과정에서 또 하나의 도마 위에 오른 것은 **`InMemoryMultipartFormDataParser`**였습니다.

### 4.1 인메모리 파서가 탄생했던 역사적 배경
과거 Google App Engine(GAE) Standard 환경 등 초기 PaaS 클라우드는 보안을 이유로 로컬 파일 시스템 쓰기(`/tmp` 디렉터리 포함)를 엄격히 금지했습니다. 디스크에 임시 파일을 단 1바이트도 쓸 수 없었기에, 업로드 스트림 전체를 힙 메모리의 바이트 배열(`byte[]`)로 강제 적재하는 전용 인메모리 파서가 필요했습니다.

그러나 이 파서 역시 내부를 들여다보면 순수 자체 파서가 아니라, Commons FileUpload의 `FileItemFactory`를 커스텀 구현한 변종이었습니다:

```java
// InMemoryMultipartFormDataParser의 내부 구조
InMemoryFileItemFactory factory = new InMemoryFileItemFactory();
FileUpload upload = new ServletFileUpload(factory); // 여전히 Commons FileUpload에 종속!
```

`commons-fileupload`를 제거하면 `InMemoryMultipartFormDataParser` 역시 설 자리를 잃게 되는 구조였습니다.

### 4.2 현대 클라우드 환경과 OOM(Out Of Memory) 위험
오늘날 AWS Lambda, GCP Cloud Run, Kubernetes, Docker 컨테이너 등 현대의 모든 클라우드 인프라는 쓰기 가능한 `/tmp` 디렉터리나 초고속 `tmpfs`(램디스크)를 기본 제공합니다. 디스크 쓰기가 원천 차단되는 환경은 더 이상 존재하지 않습니다.

오히려 모든 업로드 파일을 무조건 힙 메모리에 적재하는 방식은 실무 운영 관점에서 **극도로 위험한 안티패턴**입니다. 수십 명의 사용자가 동시에 10~20MB 크기의 파일을 업로드하기만 해도 JVM 힙 메모리가 순식간에 잠식되어 서버 전체가 다운되는 **치명적인 OOM Crash**를 유발하기 때문입니다.

### 4.3 서블릿 표준의 `fileSizeThreshold`가 제공하는 진정한 인메모리
결정적으로, **서블릿 표준 API(`StandardServlet` / `MultipartConfigElement`)는 이미 인메모리 처리를 완벽하게 지원**하고 있었습니다:

```
[멀티파트 파일 스트림 유입]
           │
           ▼
    [파일 크기 검사]
     /          \
    ▼            ▼
[임계값 이하]   [임계값 초과]
    │            │
    ▼            ▼
[RAM 메모리 유지]  [디스크 임시 파일 전환 (Spill-over)]
(고속 인메모리 처리) (OOM 방지 및 안전성 확보)
```

서블릿 표준 스펙의 **`fileSizeThreshold`**(Aspectran의 **`maxInMemorySize`**)는 파일 크기가 임계값 이하일 때는 디스크 I/O 없이 순수 RAM 메모리 상에 데이터를 유지하고, 임계값을 초과할 때만 안전하게 디스크로 넘기는(Spill-over) 최적의 하이브리드 아키텍처를 제공합니다.

만약 특정 엔드포인트(예: 썸네일, 아이콘)에서 디스크 I/O를 원천 차단하고 싶다면, `maxInMemorySize`를 `maxFileSize`와 동일한 크기(예: 500KB)로 지정하기만 하면 서블릿 표준 파서가 디스크 쓰기 없이 100% 메모리 상에서 초고속 처리를 완료합니다.

따라서 OOM 위험을 안고 있고 외부 라이브러리에 종속된 별도의 `InMemoryMultipartFormDataParser`를 유지할 이유는 완전히 소멸했습니다.

## 5. 새로운 아키텍처: Zero-Dependency 네이티브 멀티파트의 완성

모든 분석과 검증을 마친 후, 우리는 과감한 리팩토링을 단행했습니다.

### 5.1 불필요한 의존성의 완전한 제거
`web-servlet/pom.xml`에서 `commons-fileupload`와 이에 딸려 있던 `commons-io` 의존성을 완전히 제거했습니다. 이로써 Aspectran의 파일 업로드 계층은 **외부 라이브러리 의존성이 제로(Zero-Dependency)**인 순수 네이티브 모듈로 거듭났습니다.

```
[AS-IS: 무거운 외부 종속 구조]
aspectran-web-servlet
  ├── commons-fileupload:1.6.0 (javax.servlet 종속)
  └── commons-io:2.22.0

[TO-BE: 완전한 Zero-Dependency]
aspectran-web-servlet
  └── (외부 파일 업로드 라이브러리 없음 - 순수 Jakarta Servlet 6.0 표준 활용)
```

### 5.2 직관적이고 대칭적인 네이밍과 패키지 평탄화
과거 `commons`, `inmemory`, `standard` 3개의 파서가 난립하던 시절에는 구현체를 구분하기 위해 `StandardServletMultipartFormDataParser`(38자), `StandardServletMultipartFormDataParserFactoryBean`(49자)과 같은 기형적으로 긴 이름이 필요했습니다.

이제 서블릿 환경의 표준 파서 단 하나만 남았으므로, 군더더기 접두사를 걷어내고 서브패키지를 상위 패키지로 평탄화(Flattening)했습니다:

| 구분 | 이전 (AS-IS) | 현재 (TO-BE) |
| :--- | :--- | :--- |
| **패키지 경로** | `support.multipart.standard` | **`support.multipart`** |
| **서블릿 파서** | `StandardServletMultipartFormDataParser` (38자) | **`ServletMultipartFormDataParser`** (30자) |
| **팩토리 빈** | `StandardServletMultipartFormDataParserFactoryBean` (49자) | **`ServletMultipartFormDataParserFactoryBean`** (41자) |
| **파일 파라미터** | `StandardServletMultipartFileParameter` | **`ServletMultipartFileParameter`** |

이 리팩토링을 통해 Netty 논블로킹 런타임과 서블릿 런타임 간에 **아름다운 대칭 구조**가 완성되었습니다:

```
com.aspectran
  ├── web.servlet.support.multipart
  │     └── ServletMultipartFormDataParser      <-- 서블릿 환경 표준 파서
  │
  └── netty.support.multipart
        └── NettyMultipartFormDataParser        <-- Netty 논블로킹 네이티브 파서
```

### 5.3 런타임별 최적화된 고성능 파싱 엔진
새로운 아키텍처에서 두 파서는 각자의 런타임이 제공하는 최선의 저수준 I/O 기능을 극한으로 활용합니다:

1. **`ServletMultipartFormDataParser` (서블릿 환경)**:
   * 컨테이너(Tomcat/Jetty/Undertow)의 고도로 최적화된 저수준 C/Epoll/NIO 버퍼 풀과 직접 연동되는 `HttpServletRequest.getParts()`를 호출합니다.
   * 프레임워크 레벨의 불필요한 중간 스트림 래핑이나 바이트 버퍼 복사가 전혀 발생하지 않습니다.
2. **`NettyMultipartFormDataParser` (Netty / Aspectow Edge 환경)**:
   * Netty의 고성능 논블로킹 HTTP 코덱인 `HttpPostRequestDecoder`를 사용합니다.
   * Netty의 `ByteBuf` 다이렉트 메모리 풀링을 완벽하게 활용하여 제로 오버헤드로 멀티파트 데이터를 처리합니다.

## 6. 결론: 더하는 것보다 덜어내는 것이 진정한 아키텍처 혁신이다

소프트웨어 아키텍처를 발전시키는 과정에서 새로운 기술이나 기능을 추가하는 것은 비교적 쉽습니다. 하지만 오랜 기간 시스템에 기생해 온 레거시 의존성을 과감히 도려내고, 표준과 본질에 집중하도록 코드를 단순화하는 것은 깊은 고찰과 결단력이 필요한 작업입니다.

이번 리팩토링을 통해 Aspectran은 다음과 같은 가치를 얻었습니다:

* **기술 부채의 완벽한 청산**: 잠재적 위험 요인이었던 레거시 `javax` 종속성과 불안정한 마일스톤 라이브러리를 완전히 털어냈습니다.
* **Zero-Dependency 달성**: 외부 라이브러리 충돌 가능성을 원천 차단하고 모듈 배포 크기를 가볍게 줄였습니다.
* **유지보수성과 일관성의 극대화**: `ServletMultipartFormDataParser`와 `NettyMultipartFormDataParser`라는 명확한 대칭 구조를 정립하여 프레임워크의 설계 완성도를 한 단계 끌어올렸습니다.

우리는 앞으로도 낡은 관성을 답습하지 않고, 현대적인 자바 표준 생태계의 발전에 발맞추어 가장 가볍고, 안전하며, 직관적인 프레임워크 아키텍처를 구축해 나갈 것입니다.
