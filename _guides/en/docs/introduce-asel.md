---
layout: page
format: plate solid article
headline: Aspectran Expression Language
title:  AsEL을 소개합니다.
teaser: |
  AsEL은 Aspectran Expression Language의 약자로, Aspectran 프레임워크에서 객체가 가진 값을 동적으로 평가하기 위해 사용되는 표현 언어입니다.
breadcrumb: true
comments: true
sidebar: toc-left
tags:
  - AsEL
category: docs
date: 2025-08-21
---

## AsEL 이란?

AsEL(Aspectran Expression Language)은 Aspectran 프레임워크에 내장된 강력하고 경량화된 표현 언어입니다. AsEL의 가장 큰 특징은 Aspectran의 자체적인 **토큰 표현식(Token Expressions)**과 강력한 **OGNL(Object-Graph Navigation Language) 표현식**을 조합하여, 객체가 가진 값을 동적으로 평가할 수 있다는 점입니다.

이 가이드에서는 먼저 Aspectran의 기본 기능인 '토큰 표현식'에 대해 알아보고, 이어서 '토큰 표현식'과 OGNL이 결합된 완전한 형태의 'AsEL 표현식'에 대해 설명합니다.

## 1. 토큰 표현식 (Aspectran 기본 기능)

토큰 표현식은 Aspectran의 설정 내에서 특정 데이터(Bean, 속성, 파라미터 등)에 직접 접근하기 위한 간단한 표현식입니다. 각 토큰은 정해진 구문과 역할을 가집니다.

| 토큰 종류 | 표현식 구문 | 설명 |
| :--- | :--- | :--- |
| **Bean** | `#{beanId}` | ID가 `beanId`인 Bean 객체를 참조합니다. |
| **Attribute** | `@{attributeName}` | 현재 요청(Request)의 `attributeName` 어트리뷰트를 참조합니다. |
| **Parameter** | `${parameterName}` | 현재 요청(Request)의 `parameterName` 파라미터를 참조합니다. |
| **Property** | `%{propertyName}` | 애플리케이션의 `propertyName` 환경 속성을 참조합니다. |
| **Template** | `~{templateId}` | ID가 `templateId`인 템플릿을 렌더링하고 **그 결과를 포함**시킵니다. |

### 1.1. 프로퍼티(속성) 접근자: `^`

토큰 표현식이 참조하는 객체의 특정 속성(Getter)에 접근할 때는 `.` 대신 `^` 구분자를 사용합니다.

*   **구문**: `#{beanId^propertyName}`
*   **설명**: `.`를 사용하면 `bean.property` 전체가 하나의 ID로 인식되지만, `^`를 사용하면 `beanId` 토큰이 참조하는 객체에서 `propertyName` 속성을 찾습니다.

### 1.2. 기본값 설정

`:` 구분자를 사용하여 파라미터나 어트리뷰트가 없을 경우 사용할 기본값을 지정할 수 있습니다. 이 기능은 주로 `<item>` 태그 내에서 사용됩니다.

```xml
<attributes>
    <!-- 'name' 파라미터가 없으면 "Jane"을 기본값으로 사용 -->
    <item name="name">${name:Jane}</item>
</attributes>
```

### 1.3. 토큰 지시자 (Token Directives)

토큰 표현식 내에서 콜론(`:`)을 사용하여 값의 출처를 명시할 수 있습니다. 이를 토큰 지시자라고 하며, `TokenDirectiveType`에 정의된 유형들을 사용할 수 있습니다.

| 지시자 | 설명 | 예시 |
| :--- | :--- | :--- |
| **`field`** | 정적(static) 필드의 값을 참조합니다. | `#{field:com.example.Constant^STATIC_FIELD}` |
| **`method`** | 정적(static) 메소드를 호출하고 반환 값을 사용합니다. | `#{method:java.lang.System^currentTimeMillis}` |
| **`class`** | 클래스의 정적(static) 프로퍼티(getter)를 참조합니다. | `#{class:java.io.File^separator}` |
| **`classpath`** | 클래스패스에 있는 자원(주로 .properties 파일)의 속성을 참조합니다. | `%{classpath:config/app.properties^db.url}` |
| **`system`** | 자바 시스템 속성(System Property) 값을 참조합니다. | `%{system:java.version}` |

## 2. AsEL 표현식 (토큰 표현식 + OGNL)

AsEL 표현식은 위에서 설명한 토큰 표현식을 OGNL 표현식과 조합하여 사용합니다. 이를 통해 단순한 값 참조를 넘어, 동적인 데이터 처리와 연산이 가능해집니다. `@Value` 어노테이션이나 템플릿 등에서 자유롭게 사용할 수 있습니다.

*   **Bean 속성 참조 (`^` 사용)**
    ```java
    @Value("%{properties^property1}")
    public String property1;
    ```

*   **여러 토큰 표현식과 OGNL 연산자 조합**
    ```java
    @Value("#{properties^property1} + '/' + #{properties^property2}")
    public String combinedPath;
    ```

*   **토큰 표현식의 값으로 조건부 로직 수행**
    ```java
    @Value("%{app.mode} == 'development'")
    public boolean isDevelopmentMode;
    ```

## 3. 템플릿 활용

템플릿은 AsEL을 활용하여 동적 콘텐츠를 생성하는 강력한 기능입니다. Aspectran은 내장 템플릿과 외부 템플릿 엔진 연동의 두 가지 방식을 지원합니다.

### 3.1. 템플릿 처리 방식

*   **내장 템플릿**: 템플릿 내용에 포함된 AsEL 토큰 표현식 및 표현식을 Aspectran의 `TokenEvaluator`가 직접 파싱하고 처리하여 최종 결과를 만들어냅니다. 간단한 동적 텍스트를 생성하는 데 적합합니다.
*   **외부 템플릿 엔진**: FreeMarker, Thymeleaf 등과 같은 외부 템플릿 엔진을 Bean으로 등록하여 템플릿 처리를 위임할 수 있습니다. 복잡한 뷰를 생성할 때 유용합니다.

### 3.2. `~{templateId}` 토큰 표현식 사용 예제

`~{...}` 토큰은 지정된 ID의 템플릿을 현재 위치에 렌더링하여 그 결과를 포함시킬 때 사용됩니다.

```xml
<!-- 내장 템플릿 규칙 정의 -->
<template id="welcomeMailTemplate">
  <content>
    Hello, @{user^name}! Welcome to our service.
    Your current point balance is #{pointBean^currentPoints}.
  </content>
</template>

<!-- 다른 곳에서 템플릿을 변환(transform)하여 사용 -->
<transform format="text">
  <content>~{welcomeMailTemplate}</content>
</transform>
```
*   **설명**: 위 예제에서 `~{welcomeMailTemplate}` 토큰은 `welcomeMailTemplate` ID를 가진 템플릿을 찾아 렌더링합니다. 템플릿 내부의 `@{user^name}`과 `#{pointBean^currentPoints}` 토큰들이 먼저 평가된 후, 최종적으로 완성된 텍스트가 `<transform>`의 내용으로 포함됩니다.

## 4. 주의 사항: 중첩 불가

AsEL의 가장 중요한 규칙 중 하나는 **토큰 표현식 안에 다른 토큰 표현식을 포함할 수 없다**는 것입니다. 즉, 중첩이 불가능합니다.

*   **올바른 예**: `#{bean1} + #{bean2}`
*   **잘못된 예**: `#{bean^~{anotherTemplate}}`

이는 표현식의 간결함과 명확성을 확보하여, 궁극적으로는 코드의 가독성과 사용 편의성을 높이는 설계 철학에 기반합니다.
