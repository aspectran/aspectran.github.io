---
title: AsEL(Aspectran Expression Language) 소개
subheadline: 사용자 가이드
---

AsEL(Aspectran Expression Language)은 Aspectran 프레임워크에 내장된 강력하고 경량화된 표현 언어입니다. AsEL의 가장 큰 특징은 Aspectran의 자체적인 **토큰 표현식(Token Expressions)**과 강력한 **OGNL(Object-Graph Navigation Language) 표현식**을 조합하여, 객체가 가진 값을 동적으로 평가할 수 있다는 점입니다.

이 가이드에서는 먼저 Aspectran의 기본 기능인 '토큰 표현식'에 대해 알아보고, 이어서 '토큰 표현식'과 OGNL이 결합된 완전한 형태의 'AsEL 표현식'에 대해 설명합니다.

## 1. 토큰 표현식 (Aspectran 기본 기능)

토큰 표현식은 Aspectran의 설정 내에서 특정 데이터(Bean, 속성, 파라미터 등)에 직접 접근하기 위한 간단하지만 강력한 플레이스홀더입니다. 설정 파일과 실행 시간(Runtime)의 데이터를 연결해 주는 다리 역할을 합니다.

| 토큰 종류 | 표현식 구문 | 설명 | 사용 예시 |
| :--- | :--- | :--- | :--- |
| **Bean** | `#{beanId}` | ID가 `beanId`인 Bean 객체를 참조합니다. | `#{userService}` |
| **Attribute** | `@{attributeName}` | 현재 요청(Request) 컨텍스트의 `attributeName` 속성을 참조합니다. 액션 간 데이터 전달에 주로 사용됩니다. | `@{userInfo}` |
| **Parameter** | `${parameterName}` | 현재 요청의 `parameterName` 파라미터를 참조합니다. (예: HTTP 쿼리 파라미터) | `${userId}` |
| **Property** | `%{propertyName}` | 애플리케이션의 `propertyName` 환경 속성을 참조합니다. (프로퍼티 파일이나 시스템 속성 등) | `%{app.uploadDir}` |
| **Template** | `~{templateId}` | ID가 `templateId`인 템플릿을 렌더링하고 **그 결과를 포함**시킵니다. | `~{emailTemplate}` |

### 1.1. 프로퍼티(속성) 접근자: `^`

토큰 표현식이 참조하는 객체의 특정 속성(Getter)에 접근할 때는 `.` 대신 `^` 구분자를 사용합니다. 이는 Aspectran만의 독특한 문법으로, 점(.)으로 구분된 ID와 실제 프로퍼티 접근을 명확히 구별하기 위함입니다.

*   **구문**: `#{beanId^propertyName}`
*   **Java 대응**: `getBean("beanId").getPropertyName()`
*   **설명**: 만약 `.`를 사용하면 Aspectran은 `bean.property` 전체를 하나의 빈 ID로 해석합니다. `^`를 사용함으로써 "빈을 먼저 찾고, 그 다음 프로퍼티에 접근하라"고 명시적으로 지시하는 것입니다.

### 1.2. 기본값 설정

`:` 구분자를 사용하여 파라미터나 어트리뷰트가 없거나 null일 경우 사용할 기본값을 지정할 수 있습니다. 이를 통해 런타임 오류를 방지하고 설정을 단순화할 수 있습니다.

```xml
<attributes>
    <!-- 'page' 파라미터가 없으면 "1"을 기본값으로 사용 -->
    <item name="page">${page:1}</item>

    <!-- 'sort' 파라미터가 없으면 "desc"를 기본값으로 사용 -->
    <item name="sort">${sort:desc}</item>
</attributes>
```

### 1.3. 토큰 지시자 (Token Directives)

토큰 표현식 내에서 콜론(`:`)을 사용하여 값의 출처를 명시할 수 있습니다. 이를 토큰 지시자라고 합니다.

| 지시자 | 설명 | 예시 |
| :--- | :--- | :--- |
| **`field`** | 정적(static) 필드의 값을 참조합니다. | `#{field:java.awt.Color^RED}` |
| **`method`** | 정적(static) 메소드를 호출하고 반환 값을 사용합니다. | `#{method:java.lang.System^currentTimeMillis}` |
| **`class`** | 클래스의 정적(static) 프로퍼티(getter)를 참조합니다. | `#{class:java.io.File^separator}` |
| **`classpath`** | 클래스패스에 있는 자원(주로 .properties 파일)의 속성을 참조합니다. | `%{classpath:config/jdbc.properties^jdbc.url}` |
| **`system`** | 자바 시스템 속성(System Property) 값을 참조합니다. | `%{system:user.home}` |

## 2. AsEL 표현식 (토큰 표현식 + OGNL)

AsEL 표현식은 토큰 표현식의 간결함과 OGNL(Object-Graph Navigation Language)의 강력함을 결합한 것입니다. 이를 통해 설정 파일 내에서 직접 동적인 데이터 처리, 수학 연산, 복잡한 조건부 로직 등을 수행할 수 있습니다.

*   **Bean 속성 참조**
    ```java
    // Getter 메소드를 통한 속성 값 참조
    @Value("%{properties^serverPort}")
    public int port;
    ```

*   **문자열 결합**
    ```java
    // 정적 문자열과 동적 값의 결합
    @Value("'사용자: ' + @{user^name} + ' (ID: ' + ${userId} + ')'")
    public String userDescription;
    ```

*   **산술 및 논리 연산**
    ```java
    // 값을 동적으로 계산
    @Value("#{cart^totalPrice} * 1.1") // 10% 세금 추가
    public double totalWithTax;
    ```

*   **조건부 로직 (삼항 연산자)**
    ```java
    // 조건에 따라 다른 값 사용
    @Value("%{app.mode} == 'dev' ? 'DEBUG' : 'INFO'")
    public String logLevel;
    ```

*   **리스트 및 맵 접근**
    ```java
    // List나 Map의 요소에 접근
    @Value("@{userList}[0]") // 리스트의 첫 번째 사용자
    public User firstUser;

    @Value("@{configMap}['timeout']") // 'timeout' 키에 해당하는 값
    public int timeout;
    ```

### 2.1. 문자열 결합 규칙

AsEL 표현식에 여러 개의 토큰이 포함되거나 일반 텍스트와 토큰이 혼합된 경우, 전체 문자열은 **하나의 OGNL 표현식**으로 평가됩니다. 따라서 일반 텍스트에는 작은따옴표(`'`)를 사용하고 결합에는 `+` 연산자를 사용하는 등 OGNL 문법을 엄격히 따라야 합니다.

*   **올바른 예**:
    ```java
    @Value("'사용자: ' + @{user^name} + ' (ID: ' + ${userId} + ')'")
    ```
    이 경우 `@{user^name}`과 `${userId}`는 OGNL 변수(예: `#__var1__`)로 치환되며, OGNL 엔진에 의해 전체 문자열이 성공적으로 결합됩니다.

*   **잘못된 예**:
    ```java
    @Value("사용자: @{user^name} (ID: ${userId})")
    ```
    이 표현식은 `사용자:`와 `(ID:` 부분이 따옴표와 연산자 없이 사용되었기 때문에 OGNL 문법 오류(`ExpressionParserException`)를 발생시킵니다.

## 3. 템플릿 활용

템플릿은 AsEL을 활용하여 동적 콘텐츠를 생성하는 강력한 기능입니다. Aspectran은 내장 템플릿과 외부 템플릿 엔진 연동의 두 가지 방식을 지원합니다.

### 3.1. 템플릿 처리 방식

*   **내장 템플릿**: 템플릿 내용에 포함된 AsEL 토큰 표현식 및 표현식을 Aspectran의 `TokenEvaluator`가 직접 파싱하고 처리하여 최종 결과를 만들어냅니다. 간단한 동적 텍스트를 생성하는 데 적합합니다.
*   **외부 템플릿 엔진**: FreeMarker, Thymeleaf 등과 같은 외부 템플릿 엔진을 Bean으로 등록하여 템플릿 처리를 위임할 수 있습니다. 복잡한 뷰를 생성할 때 유용합니다.

### 3.2. `~{templateId}` 토큰 표현식 사용 예제

`~{...}` 토큰은 지정된 ID의 템플릿을 현재 위치에 렌더링하여 그 결과를 포함시킬 때 사용됩니다.

```xml
<!-- 내장 템플릿 규칙 정의 -->
<template id="welcomeMailTemplate" style="apon">
    |Hello, @{user^name}! Welcome to our service.
    |Your current point balance is #{pointBean^currentPoints}.
</template>

<!-- 다른 곳에서 템플릿을 변환(transform)하여 사용 -->
<transform format="text">
  <template>~{welcomeMailTemplate}</template>
</transform>
```
*   **설명**: 위 예제에서 `~{welcomeMailTemplate}` 토큰은 `welcomeMailTemplate` ID를 가진 템플릿을 찾아 렌더링합니다. 템플릿 내부의 `@{user^name}`과 `#{pointBean^currentPoints}` 토큰들이 먼저 평가된 후, 최종적으로 완성된 텍스트가 `<transform>`의 내용으로 포함됩니다.

## 4. 주의 사항: 중첩 불가

AsEL의 가장 중요한 규칙 중 하나는 **토큰 표현식 안에 다른 토큰 표현식을 포함할 수 없다**는 것입니다. 즉, 중첩이 불가능합니다.

*   **올바른 예**: `#{bean1} + #{bean2}`
*   **잘못된 예**: `#{bean^~{anotherTemplate}}`

이는 표현식의 간결함과 명확성을 확보하여, 궁극적으로는 코드의 가독성과 사용 편의성을 높이는 설계 철학에 기반합니다.
