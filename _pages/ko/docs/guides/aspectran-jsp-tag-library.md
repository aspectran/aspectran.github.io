---
title: Aspectran JSP Tag Library 가이드
subheadline: 핵심 가이드
---

Aspectran JSP Tag Library는 Aspectran 프레임워크와 JSP 뷰 기술을 유기적으로 연동하여 표현식 평가, 다국어 메시지 처리, URL 생성, 환경별 컨텐츠 제어, HTML/JavaScript 이스케이프 등을 간편하고 안전하게 처리할 수 있는 강력한 커스텀 태그 세트를 제공합니다.

Jakarta EE 10 표준 및 Apache Jasper 컴파일러 환경에 완벽히 부합하도록 설계되었으며, Aspectran의 고유 표현식 언어인 AsEL(Aspectran Expression Language) 및 토큰 매커니즘을 JSP 화면 전반에서 유연하게 활용할 수 있습니다.

## 1. 태그 라이브러리 선언

JSP 페이지 상단에 다음과 같이 지시자를 선언하여 사용합니다.

```jsp
<%@ taglib prefix="aspectran" uri="aspectran.tags" %>
```

### 하위 호환성 (Legacy URI 지원)
기존 프로젝트에서 널리 사용되던 레거시 네임스페이스 `http://aspectran.com/tags` 역시 Undertow([`TowTldScanner`](file:///home/aspectran/projects/public/aspectran/with-undertow/src/main/java/com/aspectran/undertow/server/servlet/TowTldScanner.java)) 및 Jetty([`JettyTldScanner`](file:///home/aspectran/projects/public/aspectran/with-jetty/src/main/java/com/aspectran/jetty/server/servlet/JettyTldScanner.java))의 양방향 Alias 매핑을 통해 완벽하게 지원됩니다. 기존 코드를 일일이 수정하지 않고도 최신 Aspectran 런타임에서 오류 없이 그대로 동작합니다.

```jsp
<%-- 레거시 선언도 그대로 호환됩니다 --%>
<%@ taglib prefix="aspectran" uri="http://aspectran.com/tags" %>
```

### Jakarta EE 10 JSTL과의 병행 사용 권장
Jakarta EE 10 표준 환경에서는 JSTL 표준 태그 라이브러리도 최신 `jakarta.tags.*` URI 체계를 사용하므로, 다음과 같이 함께 선언하여 사용하는 것을 권장합니다:

```jsp
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<%@ taglib prefix="fn" uri="jakarta.tags.functions" %>
<%@ taglib prefix="aspectran" uri="aspectran.tags" %>
```

## 2. 전체 태그 레퍼런스

Aspectran JSP Tag Library([`aspectran.tld`](file:///home/aspectran/projects/public/aspectran/web-servlet/src/main/resources/com/aspectran/web/servlet/support/tags/aspectran.tld))는 다음 8개의 태그를 제공합니다.

| 태그명 | 설명 | 태그 핸들러 클래스 |
| :--- | :--- | :--- |
| `<aspectran:eval>` | AsEL 표현식을 평가하여 결과를 출력하거나 변수에 할당 | [`EvalTag`](file:///home/aspectran/projects/public/aspectran/web-servlet/src/main/java/com/aspectran/web/servlet/support/tags/HtmlEscapeTag.java) |
| `<aspectran:message>` | 다국어 메시지 소스(MessageSource)로부터 코드에 해당하는 메시지를 조회 | [`MessageTag`](file:///home/aspectran/projects/public/aspectran/web-servlet/src/main/java/com/aspectran/web/servlet/support/tags/MessageTag.java) |
| `<aspectran:argument>` | `<aspectran:message>` 내부에서 인자를 전달하는 서브 태그 | [`ArgumentTag`](file:///home/aspectran/projects/public/aspectran/web-servlet/src/main/java/com/aspectran/web/servlet/support/tags/ArgumentTag.java) |
| `<aspectran:url>` | 컨텍스트 경로 자동 처리 및 URL 템플릿 파라미터를 지원하는 URL 생성 | [`UrlTag`](file:///home/aspectran/projects/public/aspectran/web-servlet/src/main/java/com/aspectran/web/servlet/support/tags/UrlTag.java) |
| `<aspectran:param>` | `<aspectran:url>` 내부에서 쿼리 및 경로 파라미터를 전달하는 서브 태그 | [`ParamTag`](file:///home/aspectran/projects/public/aspectran/web-servlet/src/main/java/com/aspectran/web/servlet/support/tags/ParamTag.java) |
| `<aspectran:profile>` | 활성화된 프로필(Profile) 조건식에 따라 내부 콘텐츠를 조건부 렌더링 | [`ProfileTag`](file:///home/aspectran/projects/public/aspectran/web-servlet/src/main/java/com/aspectran/web/servlet/support/tags/ProfileTag.java) |
| `<aspectran:token>` | Aspectran 고유의 개별 토큰(bean, parameter, property 등)을 직접 평가 | [`TokenTag`](file:///home/aspectran/projects/public/aspectran/web-servlet/src/main/java/com/aspectran/web/servlet/support/tags/TokenTag.java) |
| `<aspectran:htmlEscape>` | 현재 페이지 또는 요청 컨텍스트의 기본 HTML 이스케이프 여부 설정 | [`HtmlEscapeTag`](file:///home/aspectran/projects/public/aspectran/web-servlet/src/main/java/com/aspectran/web/servlet/support/tags/HtmlEscapeTag.java) |
| `<aspectran:escapeBody>` | 태그 바디 내부의 텍스트에 대해 HTML 및/또는 JavaScript 이스케이프 적용 | [`EscapeBodyTag`](file:///home/aspectran/projects/public/aspectran/web-servlet/src/main/java/com/aspectran/web/servlet/support/tags/EscapeBodyTag.java) |

### 2.1. `<aspectran:eval>`
AsEL(Aspectran Expression Language)을 평가하고 결과를 화면에 직접 출력하거나 지정된 스코프 변수에 할당합니다. `AselExpressionPreprocessor`가 적용되어 세이프 네비게이션, 엘비스 연산자, 컬렉션 프로젝션/셀렉션 등 최신 연산자를 폭넓게 지원합니다.

* **속성 목록**:
  * `expression` (필수): 평가할 AsEL 표현식 문자열입니다.
  * `var` (선택): 평가 결과를 저장할 변수명입니다. 생략 시 화면(Writer)에 즉시 출력됩니다.
  * `scope` (선택): `var`가 정의되었을 때 변수가 저장될 유효 범위(`page`, `request`, `session`, `application`)입니다. 기본값은 `page`입니다.
  * `htmlEscape` (선택): 결과 문자열의 HTML 이스케이프 여부(`true`/`false`)를 지정합니다. 기본 설정값을 재정의합니다.
  * `javaScriptEscape` (선택): 결과 문자열의 JavaScript 이스케이프 여부(`true`/`false`)를 지정합니다. 기본값은 `false`입니다.

#### **전처리기 지원 연산자**

1. **Safe Navigation (`?.`)**: 객체가 `null`인지 확인하고 안전하게 하위 속성에 접근합니다.
   ```jsp
   <%-- user 또는 cart가 null이면 NPE 없이 null 반환 --%>
   <aspectran:eval expression="user?.cart?.numberOfItems"/>
   ```
2. **Elvis Operator (`?:`)**: 표현식 결과가 `null`일 때 대체할 기본값을 지정합니다.
   ```jsp
   <%-- 결과가 null이면 0 출력 --%>
   <aspectran:eval expression="user?.cart?.numberOfItems ?: 0"/>
   ```
3. **Collection Selection (`.?[...]`)**: 컬렉션에서 조건식을 만족하는 요소들만 필터링하여 새 리스트를 만듭니다.
   ```jsp
   <%-- 가격이 100 이상인 상품 목록 --%>
   <aspectran:eval expression="products.?[price >= 100]"/>
   ```
4. **Collection Projection (`.![...]`)**: 컬렉션 내 각 요소의 특정 속성을 추출하여 새로운 하위 리스트를 만듭니다.
   ```jsp
   <%-- 모든 상품의 이름(name)만 추출한 리스트 --%>
   <aspectran:eval expression="products.![name]"/>
   ```
5. **First/Last Selection (`.^[...]`, `.$[...]`)**: 조건을 만족하는 첫 번째 또는 마지막 단일 요소를 추출합니다.
   ```jsp
   <%-- 카테고리가 Electronics인 첫 번째 상품 --%>
   <aspectran:eval expression="products.^[category == 'Electronics']"/>
   ```
6. **Matches Operator (`matches`)**: 정규표현식과 문자열이 일치하는지 불리언 값으로 평가합니다.
   ```jsp
   <aspectran:eval expression="user.email matches '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$'"/>
   ```
7. **Type Operator (`T(...)`)**: 정적(Static) 클래스 타입에 직접 접근하여 상수나 정적 메소드를 호출합니다.
   ```jsp
   <aspectran:eval expression="T(java.lang.Math).PI"/>
   <aspectran:eval expression="T(com.example.Constants).DEFAULT_PAGE_SIZE"/>
   ```

### 2.2. `<aspectran:message>` & `<aspectran:argument>`
Aspectran의 `MessageSource`로부터 다국어 메시지를 가져와 렌더링합니다. 단순 메시지 출력뿐 아니라 동적 인자(arguments) 치환, 변수 바인딩, HTML/JavaScript 자동 이스케이프를 지원합니다.

* **`<aspectran:message>` 속성 목록**:
  * `code` (선택): 조회할 메시지 키 코드입니다.
  * `text` (선택): 코드가 없거나 메시지를 찾을 수 없을 때 대체 출력할 기본 텍스트입니다.
  * `arguments` (선택): 메시지 포맷에 바인딩할 인자입니다. 쉼표(`,`)로 구분된 문자열, 단일 객체, 또는 객체 배열을 전달할 수 있습니다.
  * `argumentSeparator` (선택): `arguments` 문자열을 분리할 구분자 문자입니다. 기본값은 쉼표(`,`)입니다.
  * `var` (선택): 조회된 메시지를 저장할 변수명입니다.
  * `scope` (선택): `var` 변수의 유효 범위(`page`, `request`, `session`, `application`)입니다.
  * `htmlEscape` (선택): 메시지 내용의 HTML 이스케이프 적용 여부입니다.
  * `javaScriptEscape` (선택): 메시지 내용의 JavaScript 이스케이프 적용 여부입니다.

* **`<aspectran:argument>` 속성 목록**:
  * `value` (선택): 부모 `<aspectran:message>`에 전달할 단일 인자 값입니다. 태그 바디 콘텐츠로도 값을 전달할 수 있습니다.

#### **실무 활용 예제**
```jsp
<%-- 1. 단순 메시지 키 출력 --%>
<aspectran:message code="label.username"/>

<%-- 2. arguments 속성을 통한 동적 인자 전달 --%>
<aspectran:message code="msg.welcome" arguments="${user.name}"/>

<%-- 3. 중첩된 argument 태그를 통한 복수 인자 전달 --%>
<aspectran:message code="order.confirmation">
    <aspectran:argument value="${order.id}"/>
    <aspectran:argument value="${order.formattedTotalAmount}"/>
</aspectran:message>

<%-- 4. 메시지 키가 없을 때 기본 텍스트 출력 --%>
<aspectran:message code="missing.label" text="기본 안내 문구입니다."/>

<%-- 5. 변수에 저장하여 HTML 속성이나 다른 태그에서 재사용 --%>
<aspectran:message code="page.title" var="pageTitle" scope="request"/>
<title>${pageTitle}</title>

<%-- 6. JavaScript 코드 내에서 안전하게 메시지 삽입 (JS 이스케이프) --%>
<script>
    const alertMsg = '<aspectran:message code="alert.delete.confirm" javaScriptEscape="true"/>';
    if (confirm(alertMsg)) {
        // 삭제 로직 진행
    }
</script>
```

### 2.3. `<aspectran:url>` & `<aspectran:param>`
웹 애플리케이션 컨텍스트 경로를 자동으로 반영하고, 쿼리 파라미터 인코딩 및 URL 템플릿(PathVariable) 치환을 지원하는 고급 URL 생성 태그입니다.

* **`<aspectran:url>` 속성 목록**:
  * `value` (필수): 생성할 기본 URL 경로입니다. `{paramName}` 형식의 템플릿 치환자를 포함할 수 있습니다.
  * `context` (선택): 다른 원격 애플리케이션 컨텍스트 경로를 명시적으로 지정할 때 사용합니다. 기본값은 현재 애플리케이션의 컨텍스트입니다.
  * `var` (선택): 생성된 URL을 저장할 변수명입니다. 생략 시 화면에 직접 출력됩니다.
  * `scope` (선택): 저장될 변수 스코프(`page`, `request`, `session`, `application`)입니다. 기본값은 `page`입니다.
  * `htmlEscape` (선택): 생성된 URL에 HTML 이스케이프를 적용할지 여부입니다.
  * `javaScriptEscape` (선택): 생성된 URL에 JavaScript 이스케이프를 적용할지 여부입니다.

* **`<aspectran:param>` 속성 목록**:
  * `name` (필수): 파라미터 이름입니다. `value`의 `{name}` 치환자와 일치할 경우 해당 위치에 URL 인코딩되어 치환되며, 일치하는 치환자가 없으면 쿼리 스트링(`?name=value`)으로 자동 추가됩니다.
  * `value` (선택): 파라미터 값입니다. 속성 또는 태그 본문으로 전달할 수 있습니다.

#### **실무 활용 예제**
```jsp
<%-- 1. 컨텍스트 경로가 자동 반영된 단순 링크 --%>
<a href="<aspectran:url value="/main"/>">홈으로 이동</a>

<%-- 2. URL 템플릿(PathVariable) 파라미터 치환 --%>
<%-- 결과: /myapp/products/P10023?view=detail --%>
<aspectran:url value="/products/{id}" var="productUrl">
    <aspectran:param name="id" value="${product.id}"/>
    <aspectran:param name="view" value="detail"/>
</aspectran:url>
<a href="${productUrl}">상품 상세보기</a>

<%-- 3. 쿼리 파라미터 자동 인코딩 및 복수 파라미터 전달 --%>
<aspectran:url value="/search" var="searchUrl">
    <aspectran:param name="keyword" value="Aspectran & JSTL"/>
    <aspectran:param name="page" value="1"/>
</aspectran:url>
<a href="${searchUrl}">검색하기</a>
```

### 2.4. `<aspectran:profile>`
현재 실행 환경에서 활성화된 Aspectran 프로필(Profile) 상태를 평가하여, 조건이 일치할 때만 감싼 JSP 콘텐츠를 조건부 렌더링합니다.

* **속성 목록**:
  * `expression` (필수): 프로필 조건식 문자열입니다. 단일 프로필 이름(`dev`), 부정 연산(`!prod`), OR 연산(`dev | staging`), AND 연산(`dev & test`) 등을 지원합니다.

#### **실무 활용 예제**
```jsp
<%-- 1. 개발(dev) 환경에서만 디버그 도구 노출 --%>
<aspectran:profile expression="dev">
    <div id="debug-toolbar" class="alert alert-warning">
        <strong>Debug Mode:</strong> Active Translet: ${translet.name}
    </div>
</aspectran:profile>

<%-- 2. 운영(prod) 환경이 아닐 때만 테스트 스크립트 로드 --%>
<aspectran:profile expression="!prod">
    <script src="/assets/js/mock-api-helper.js"></script>
</aspectran:profile>

<%-- 3. 개발 또는 스테이징 환경에서 안내 배너 노출 --%>
<aspectran:profile expression="dev | staging">
    <div class="banner">현재 테스트용 서버에서 접속 중입니다.</div>
</aspectran:profile>
```

### 2.5. `<aspectran:token>`
Aspectran의 핵심 기능인 토큰 표현식을 JSP에서 직접 평가하여 출력하거나 변수로 바인딩합니다.

* **속성 목록**:
  * `type` (필수): 평가할 토큰의 종류입니다.
    * `bean`: Aspectran 빈 컨테이너에서 빈을 조회하거나 빈의 프로퍼티/메소드 결과 추출
    * `parameter`: HTTP 요청 파라미터 값 추출
    * `attribute`: 요청, 세션, 애플리케이션 스코프의 어트리뷰트 추출
    * `property`: Aspectran 환경 프로퍼티(`environment`) 값 조회
    * `template`: 템플릿 토큰 문자열 평가
    * `text`: 텍스트 토큰 평가
  * `expression` (필수): 평가할 토큰의 이름 또는 표현식 본문입니다.
  * `var` (선택): 평가 결과를 저장할 변수명입니다.
  * `scope` (선택): 변수가 저장될 스코프입니다.
  * `htmlEscape` / `javaScriptEscape`: 이스케이프 여부 설정입니다.

#### **실무 활용 예제**
```jsp
<%-- 1. Aspectran 환경 프로퍼티 직접 읽기 --%>
<p>사이트 기본 URL: <aspectran:token type="property" expression="site.baseUrl"/></p>

<%-- 2. 특정 빈(Bean)의 메소드나 프로퍼티 호출 결과를 변수로 바인딩 --%>
<aspectran:token type="bean" expression="siteConfigBean.supportEmail" var="supportEmail"/>
<a href="mailto:${supportEmail}">고객지원 문의</a>

<%-- 3. HTTP 요청 파라미터 안전하게 출력 --%>
<aspectran:token type="parameter" expression="searchKeyword" htmlEscape="true"/>
```

### 2.6. `<aspectran:htmlEscape>` & `<aspectran:escapeBody>`
크로스 사이트 스크립팅(XSS) 공격을 방어하고, HTML 및 JavaScript 환경에서 동적 데이터를 안전하게 출력할 수 있도록 지원하는 이스케이프 전용 태그입니다.

#### **`<aspectran:htmlEscape>`**
현재 JSP 페이지의 기본 HTML 이스케이프 동작을 전역적으로 제어합니다.
* `defaultHtmlEscape` (필수): `true`로 설정하면 이후에 실행되는 `<aspectran:message>`, `<aspectran:eval>`, `<aspectran:token>` 태그들이 명시적 옵션이 없어도 기본적으로 HTML 이스케이프를 수행합니다.

```jsp
<%-- 페이지 최상단에서 전역 HTML 이스케이프 기본 활성화 --%>
<aspectran:htmlEscape defaultHtmlEscape="true"/>
```

#### **`<aspectran:escapeBody>`**
태그 바디로 감싼 본문 텍스트 전체에 대해 HTML 이스케이프 또는 JavaScript 이스케이프를 적용합니다.
* `htmlEscape` (선택): 본문 콘텐츠에 HTML 특수문자(`<`, `>`, `&`, `"`, `'`) 이스케이프를 적용합니다.
* `javaScriptEscape` (선택): 본문 콘텐츠에 JavaScript 문자열 이스케이프(따옴표, 줄바꿈 등)를 적용합니다.

```jsp
<%-- HTML 이스케이프 적용 --%>
<div class="user-comment">
    <aspectran:escapeBody htmlEscape="true">
        사용자가 입력한 <script>alert('xss');</script> 내용
    </aspectran:escapeBody>
</div>

<%-- JavaScript 문자열 내 안전한 임베딩 --%>
<script>
    const userBio = "<aspectran:escapeBody javaScriptEscape="true">${user.bio}</aspectran:escapeBody>";
</script>
```

## 3. JSP EL과의 충돌 해결 가이드

JSP 2.1 이상 및 Jakarta Servlet 환경에서 `#{...}` 문법은 JSF(JavaServer Faces) 호환을 위한 **Deferred Expression**으로 사전 해석되어 런타임 구문 파싱 오류를 일으킬 수 있습니다. Aspectran의 토큰 문법(`#{...}`)을 JSP `<aspectran:eval>` 내에서 사용할 때는 다음 권장 패턴을 따르십시오.

### 권장 방식: 직접 접근 (Direct Object Access)
`<aspectran:eval>` 태그는 현재 실행 중인 Aspectran `Activity` 컨텍스트 내에서 동작하므로, 굳이 `#{currentActivityData}`와 같은 토큰 래퍼를 거칠 필요 없이 컨텍스트 객체 이름을 직접 참조하면 됩니다.

```jsp
<%-- AS-IS: Deferred Expression 충돌 위험 --%>
<aspectran:eval expression="#{currentActivityData}.user.name"/>

<%-- TO-BE (권장): 안전하고 명확함 --%>
<aspectran:eval expression="user.name"/>
```

### 대안: 백슬래시 이스케이프 (`\#{...}`)
만약 반드시 `#{...}` 형태의 토큰 구문을 표현식 문자열 내에 그대로 유지해야 한다면, `#` 앞에 백슬래시(`\`)를 추가하여 서블릿 컨테이너의 JSP EL 컴파일러가 이를 처리하지 못하도록 이스케이프합니다.

```jsp
<aspectran:eval expression="\#{currentActivityData}.user.name"/>
```

## 4. 웹 서버 환경 자동 스캔 연동 안내

Aspectow(Undertow) 및 Aspectran with Jetty 서버 엔진은 애플리케이션 구동 시 클래스패스 상의 `aspectran.tld`를 자동으로 감지합니다:

* **클래스패스 자동 스캔**: `aspectran-web-servlet.jar` 내부에 포함된 `com/aspectran/web/servlet/support/tags/aspectran.tld`가 자동으로 스캔되어 등록되므로, `web.xml`이나 서버 설정 파일에 별도의 `<taglib>` 매핑을 수동 등록할 필요가 없습니다.
* **양방향 URI 자동 해석**: JSP에서 `aspectran.tags` 또는 `http://aspectran.com/tags` 중 어느 것을 사용하더라도 TLD 스캐너가 동일한 리소스로 자동 연결합니다.
* **JSTL 자동 통합**: GlassFish JSTL(`jakarta.servlet.jsp.jstl-3.0.1.jar`)의 표준 TLD들(`c`, `fmt`, `fn` 등) 또한 클래스패스에서 자동으로 감지되어 즉시 사용 가능합니다.
