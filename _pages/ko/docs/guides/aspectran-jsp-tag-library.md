---
title: Aspectran JSP Tag Library 가이드
subheadline: 핵심 가이드
---

Aspectran JSP Tag Library는 Aspectran 프레임워크와 JSP 뷰 기술을 연동하여 표현식 평가, 다국어 메시지 처리, URL 생성, 환경별 컨텐츠 제어 등을 간편하게 처리할 수 있는 커스텀 태그 세트를 제공합니다.

## 1. 태그 라이브러리 선언

JSP 페이지 상단에 다음과 같이 선언하여 사용합니다.

```jsp
<%@ taglib uri="http://aspectran.com/tags" prefix="aspectran" %>
```

## 2. 주요 태그 상세 안내

### `<aspectran:eval>`
AsEL(Aspectran Expression Language)을 평가하고 결과를 출력하거나 변수에 할당합니다. `AselExpressionPreprocessor`가 적용되어 현대적인 연산자들을 모두 사용할 수 있습니다.

#### **전처리기 지원 연산자**

1.  **Safe Navigation (`?.`)**: 객체가 `null`인지 확인하고 하위 속성에 접근합니다.
    ```jsp
    <%-- user가 null이면 null 반환, 아니면 cart 접근 --%>
    <aspectran:eval expression="user?.cart?.numberOfItems"/>
    ```
2.  **Elvis Operator (`?:`)**: 표현식 결과가 `null`일 때 사용할 기본값을 지정합니다.
    ```jsp
    <%-- 결과가 null이면 0 출력 --%>
    <aspectran:eval expression="user?.cart?.numberOfItems ?: 0"/>
    ```
3.  **Collection Selection (`.?[...]`)**: 컬렉션에서 조건에 맞는 요소만 필터링합니다.
    ```jsp
    <%-- 가격이 100 이상인 상품 목록 --%>
    <aspectran:eval expression="products.?[price >= 100]"/>
    ```
4.  **Collection Projection (`.![...]`)**: 컬렉션의 요소를 변환하여 새로운 리스트를 만듭니다.
    ```jsp
    <%-- 모든 상품의 이름만 추출한 리스트 --%>
    <aspectran:eval expression="products.![name]"/>
    ```
5.  **First/Last Selection (`.^[...]`, `.$[...]`)**: 조건에 맞는 첫 번째 또는 마지막 요소를 선택합니다.
    ```jsp
    <aspectran:eval expression="products.^[category == 'Electronics']"/>
    ```
6.  **Matches Operator (`matches`)**: 정규표현식과 매칭되는지 확인합니다.
    ```jsp
    <aspectran:eval expression="user.email matches '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$'"/>
    ```
7.  **Type Operator (`T(...)`)**: 정적(Static) 클래스 타입에 접근하여 상수나 메소드를 호출합니다.
    ```jsp
    <aspectran:eval expression="T(java.lang.Math).PI"/>
    <aspectran:eval expression="T(com.example.Constants).DEFAULT_PAGE_SIZE"/>
    ```

### `<aspectran:message>`
다국어 메시지 소스에서 메시지를 가져옵니다.

*   **실무 예제**:
    ```jsp
    <%-- 단순 메시지 출력 --%>
    <aspectran:message code="label.username"/>

    <%-- 인자값 전달 --%>
    <aspectran:message code="msg.welcome" arguments="${user.name}"/>

    <%-- 메시지가 없을 때 기본 텍스트 --%>
    <aspectran:message code="non.existent.code" text="기본 메시지입니다."/>

    <%-- 결과를 변수에 저장하여 재사용 --%>
    <aspectran:message code="page.title" var="pTitle"/>
    <title>${pTitle}</title>
    ```

### `<aspectran:url>`
URL 템플릿과 파라미터 인코딩을 지원하는 URL을 생성합니다.

*   **실무 예제**:
    ```jsp
    <%-- 기본적인 컨텍스트 경로 포함 URL --%>
    <a href="<aspectran:url value="/main"/>">홈으로</a>

    <%-- 쿼리 파라미터 추가 --%>
    <aspectran:url value="/search" var="searchUrl">
        <aspectran:param name="keyword" value="Aspectran"/>
        <aspectran:param name="page" value="1"/>
    </aspectran:url>
    <a href="${searchUrl}">검색 결과 보기</a>

    <%-- URL 템플릿 파라미터 (PathVariable) --%>
    <aspectran:url value="/products/{id}">
        <aspectran:param name="id" value="${product.id}"/>
    </aspectran:url>
    ```

### `<aspectran:profile>`
실행 환경 프로필에 따라 화면 구성을 제어합니다.

*   **실무 예제**:
    ```jsp
    <%-- 개발 환경에서만 디버그 도구 노출 --%>
    <aspectran:profile expression="dev">
        <div id="debug-toolbar">...</div>
    </aspectran:profile>

    <%-- 운영 환경이 아닐 때만 특정 스크립트 포함 --%>
    <aspectran:profile expression="!prod">
        <script src="/js/test-helper.js"></script>
    </aspectran:profile>

    <%-- 다중 프로필 조건 (OR 연산) --%>
    <aspectran:profile expression="dev | staging">
        <p>테스트 서버입니다.</p>
    </aspectran:profile>
    ```

## 3. JSP EL과의 충돌 해결 가이드

JSP 2.1 이상에서 `#{...}`는 **Deferred Expression**으로 인식되어 서버 오류가 발생할 수 있습니다. `eval` 태그에서 Aspectran 토큰 문법을 사용할 때는 다음 방식을 따르십시오.

### 권장 방식: 직접 접근
`eval` 태그는 현재 실행 중인 `Activity` 컨텍스트 내에서 동작하므로, 굳이 `#{currentActivityData}`와 같은 토큰을 쓸 필요 없이 객체 이름을 직접 사용하면 됩니다.

```jsp
<%-- AS-IS (충돌 위험) --%>
<aspectran:eval expression="#{currentActivityData}.user.name"/>

<%-- TO-BE (안전하고 간결함) --%>
<aspectran:eval expression="user.name"/>
```

### 필요한 경우: 이스케이프 처리
만약 반드시 `#{...}` 문법을 그대로 사용해야 한다면, `#` 앞에 백슬래시(`\`)를 추가하여 JSP 엔진의 처리를 방해합니다.

```jsp
<aspectran:eval expression="\#{currentActivityData}.user.name"/>
```
