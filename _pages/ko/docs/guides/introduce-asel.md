---
title: AsEL(Aspectran Expression Language) 소개
subheadline: 핵심 가이드
---

AsEL(Aspectran Expression Language)은 Aspectran 프레임워크에 내장된 강력하고 경량화된 표현 언어입니다. AsEL의 가장 큰 특징은 Aspectran의 핵심 기능인 **토큰 표현식(Token Expressions)**과 강력한 **OGNL(Object-Graph Navigation Language) 표현식**을 조합하여, 객체가 가진 값을 동적으로 평가할 수 있다는 점입니다.

Aspectran에서는 기본적으로 토큰 표현식이 주로 사용됩니다. 여러 토큰이 합성된 표현식이나 복잡한 연산이 필요한 경우, Aspectran은 이를 AsEL의 형태로 OGNL을 이용하여 한 번에 평가합니다.

## 1. 토큰 표현식 (Aspectran 기본 기능)

토큰 표현식은 Aspectran의 설정 내에서 특정 데이터(Bean, 속성, 파라미터 등)에 직접 접근하기 위한 간단하지만 강력한 플레이스홀더입니다. 설정 파일과 실행 시간(Runtime)의 데이터를 연결해 주는 다리 역할을 합니다.

| 토큰 종류 | 표현식 구문 | 설명 | 사용 예시 |
| :--- | :--- | :--- | :--- |
| **Bean** | `#{beanId}` | ID가 `beanId`인 Bean 객체를 참조합니다. | `#{userService}` |
| **Attribute** | `@{attributeName}` | 현재 요청 컨텍스트의 `attributeName` 속성을 참조합니다. | `@{userInfo}` |
| **Parameter** | `${parameterName}` | 현재 요청의 `parameterName` 파라미터를 참조합니다. (예: HTTP 쿼리 파라미터) | `${userId}` |
| **Property** | `%{propertyName}` | 애플리케이션의 `propertyName` 환경 속성을 참조합니다. | `%{app.uploadDir}` |
| **Template** | `~{templateId}` | ID가 `templateId`인 템플릿을 렌더링하고 그 결과를 포함시킵니다. | `~{emailTemplate}` |

### 1.1. 프로퍼티(속성) 접근자: `^`

토큰 표현식이 참조하는 객체의 특정 속성(Getter)에 접근할 때는 `.` 대신 `^` 구분자를 사용합니다. 이는 점(.)으로 구분된 ID와 실제 프로퍼티 접근을 명확히 구별하기 위한 Aspectran만의 특징입니다.

*   **구문**: `#{beanId^propertyName}`
*   **Java 대응**: `getBean("beanId").getPropertyName()`
*   **설명**: `^`를 사용함으로써 "데이터를 먼저 찾고, 그 다음 프로퍼티에 접근하라"고 명시적으로 지시하는 것입니다.

### 1.2. 기본값 설정

`:` 구분자를 사용하여 파라미터나 어트리뷰트가 없거나 null일 경우 사용할 기본값을 지정할 수 있습니다.

```xml
<attributes>
    <!-- 'page' 파라미터가 없으면 "1"을 기본값으로 사용 -->
    <item name="page">${page:1}</item>

    <!-- 'sort' 파라미터가 없으면 "desc"를 기본값으로 사용 -->
    <item name="sort">${sort:desc}</item>
</attributes>
```

### 1.3. 토큰 지시자 (Token Directives)

토큰 표현식 내에서 콜론(`:`)을 사용하여 값의 출처를 명시할 수 있습니다. 정적 멤버 접근이나 특정 자원을 불러올 때 매우 중요한 기능입니다.

| 지시자 | 설명 | 예시 |
| :--- | :--- | :--- |
| **`field`** | 정적(static) 필드의 값을 참조합니다. | `#{field:java.awt.Color^RED}` |
| **`method`** | 정적(static) 메소드를 호출하고 반환 값을 사용합니다. | `#{method:java.lang.System^currentTimeMillis}` |
| **`class`** | 클래스의 정적(static) 프로퍼티(getter)를 참조합니다. | `#{class:java.io.File^separator}` |
| **`classpath`** | 클래스패스에 있는 자원의 속성을 참조합니다. | `%{classpath:config/jdbc.properties^jdbc.url}` |
| **`system`** | 자바 시스템 속성(System Property) 값을 참조합니다. | `%{system:user.home}` |

## 2. AsEL 표현식 (토큰과 OGNL의 결합)

여러 개의 토큰이 결합되거나 `@Value` 어노테이션, Thymeleaf 템플릿 등에서 사용될 때 AsEL 표현식이 형성됩니다. 토큰이 하나만 있으면 해당 값만 가져오지만, 여러 개이거나 연산자가 포함되면 OGNL을 이용해 복합 연산을 수행합니다.

### 2.1. 단일 토큰 사용 예제

*   **Bean 속성 참조**
    ```java
    // Getter 메소드를 통한 속성 값 참조
    @Value("%{properties^serverPort}")
    public int port;
    ```

*   **파라미터 참조**
    ```xml
    <item name="userId">${userId}</item>
    ```

### 2.2. 복합 표현식

*   **산술 및 논리 연산**
    ```java
    @Value("#{cart^totalPrice} * 1.1") // 10% 세금 계산
    ```

*   **조건부 로직 (삼항 연산자)**
    ```java
    @Value("%{app.mode} == 'dev' ? 'DEBUG' : 'INFO'")
    ```

*   **리스트 및 맵 접근**
    ```java
    @Value("@{userList}[0]") // 리스트의 첫 번째 요소
    ```

### 2.3. 문자열 결합 규칙

AsEL 표현식에 여러 개의 토큰이 포함되거나 일반 텍스트와 토큰이 혼합된 경우, Aspectran은 각 토큰을 임시 OGNL 변수(예: `#__var1__`)로 치환한 후 전체 문자열을 **하나의 OGNL 표현식**으로 평가합니다. 따라서 자바 코드와 유사한 엄격한 OGNL 문법을 따라야 합니다.

*   **올바른 예**:
    ```java
    @Value("'사용자: ' + @{user^name} + ' (ID: ' + ${userId} + ')'")
    ```
    *   **이유**: 토큰이 치환되면 `'사용자: ' + #__var1__ + ' (ID: ' + #__var2__ + ')'`와 같은 형태가 됩니다. 이는 작은따옴표로 감싸진 문자열 리터럴과 변수들이 `+` 연산자로 연결된 올바른 OGNL/자바 문법입니다.

*   **잘못된 예**:
    ```java
    @Value("사용자: @{user^name} (ID: ${userId})")
    ```
    *   **이유**: 토큰 치환 시 `사용자: #__var1__ (ID: #__var2__)`와 같은 형태가 됩니다. OGNL은 `사용자:`나 `(ID:`와 같은 텍스트를 따옴표 없이 처리할 수 없으며, 각 세그먼트를 연결할 연산자도 없기 때문에 문법 오류(`ExpressionParserException`)를 발생시킵니다.

### 2.4. 고급 연산자

AsEL은 네이티브 OGNL을 넘어 Spring Expression Language(SpEL)와 유사한 현대적이고 직관적인 연산자들을 지원합니다.

#### 2.4.1. Safe Navigation 연산자: `?.`
`NullPointerException`을 방지하기 위해 사용됩니다. 객체가 `null`이면 예외를 던지는 대신 `null`을 반환합니다.
*   **객체 체이닝**: `@{user}?.address?.city`
*   **메서드 호출**: `@{user}?.getName()` (user가 null이면 null 반환)
*   **컬렉션 연동**: `@{members}?.size()`

#### 2.4.2. Elvis 연산자: `?:`
표현식 결과가 `null`일 때 사용할 기본값을 간단히 지정합니다.
*   **단순 대체**: `@{user^nickname} ?: '익명'`
*   **중첩 사용**: `@{user^nickname} ?: ${guestName} ?: '이방인'`
*   **Safe Navigation과 조합**: `@{user}?.profile?.bio ?: '자기소개가 없습니다.'`

#### 2.4.3. 타입 연산자: `T()`
정적 클래스, 상수 및 메서드에 깔끔하게 접근할 수 있게 해줍니다.
*   **상수 접근**: `T(java.lang.Math).PI`
*   **정적 메서드 호출**: `T(java.lang.System).currentTimeMillis()`
*   **유틸리티 활용**: `T(com.aspectran.utils.StringUtils).hasText(@{user^name})`

#### 2.4.4. 컬렉션 선택(Selection) 및 투영(Projection)
컬렉션(List, Map, Set) 데이터를 SpEL 스타일로 강력하게 처리합니다.
*   **선택 (Filter)**: `@{members}.?[age > 20]` (20세 초과 회원 목록)
*   **투영 (Transform)**: `@{members}.![name]` (회원 이름 목록 추출)
*   **복합 활용**: `@{members}.?[role == 'ADMIN'].![email]` (관리자들의 이메일 목록)
*   **조건 일치 검색**:
    *   `@{members}.^[age > 18]` (조건에 맞는 첫 번째 요소)
    *   `@{members}.$[age > 18]` (조건에 맞는 마지막 요소)

#### 2.4.5. 일치 연산자 (Matches)
정규표현식을 이용한 패턴 매칭을 수행합니다.
*   **이메일 검증**: `${email} matches '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$'`
*   **패턴 체크**: `@{user^role} matches 'ADMIN|MANAGER'`

## 3. 템플릿 활용

템플릿은 AsEL을 사용하여 동적 콘텐츠를 생성합니다. `~{...}` 토큰은 지정된 ID의 템플릿을 현재 위치에 렌더링하여 그 결과를 포함시킵니다.

### 3.1. 내장 템플릿 예제

```xml
<template id="welcomeMail" style="apon">
    |안녕하세요, @{user^name:손님}!
    |현재 점수는 @{score^total:0} 점입니다.
</template>
```

> ⚠️ **주의**\
> 내장 템플릿 엔진은 단순한 토큰 치환만 수행합니다. 즉, 토큰을 개별적으로 평가한 후 일반 텍스트와 이어 붙입니다. 따라서 `?.`나 `?:` 같은 고급 AsEL 연산자는 내장 템플릿의 텍스트 본문에 직접 사용할 수 없습니다. 템플릿 내부에서 완전한 AsEL 기능을 활용하려면 Thymeleaf와 같은 외부 엔진 사용을 강력히 권장합니다.

## 4. 주의 사항: 중첩 불가

AsEL의 핵심 규칙 중 하나는 **토큰 표현식 안에 다른 토큰 표현식을 포함할 수 없다**는 것입니다.

*   **올바른 예**: `#{bean1} + #{bean2}`
*   **잘못된 예**: `#{bean^~{anotherTemplate}}`

이는 표현식의 간결함과 명확성을 유지하기 위한 설계 철학에 기반합니다.

## 5. 쉘에서의 AsEL 평가 (evaluate 명령어)

Aspectran Shell 환경에서는 `evaluate` 명령어를 사용하여 실행 중인 애플리케이션 컨텍스트 내에서 AsEL 표현식을 즉시 평가하고 결과를 확인할 수 있습니다. 이는 복잡한 표현식을 작성하기 전에 결과를 미리 검증하거나, 현재 로드된 빈(Bean)의 상태를 실시간으로 점검하는 데 매우 유용합니다.

*   **기본 사용법**: `evaluate "<expression>"`
*   **예시**:
    ```shell
    default> evaluate "1 + 1"
    2
    default> evaluate "#{userService^getUserCount()}"
    150
    default> evaluate "T(java.lang.System)^getProperty('user.home')"
    /Users/Aspectran
    ```

`evaluate` 명령어를 통해 개발 및 운영 과정에서 AsEL의 강력한 기능을 직접 체험하고 검증해 보시기 바랍니다.
