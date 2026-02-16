---
title: Aspectran 뷰(View) 기술
subheadline: 핵심 가이드
---

Aspectran은 최종 응답을 생성하기 위해 매우 유연한 뷰(View) 처리 아키텍처를 제공합니다. 이 아키텍처의 핵심에는 다양한 뷰 기술을 통합 처리하는 **`ViewDispatcher`**가 있습니다.

또한, 전체 페이지 렌더링이 아닌 XML, JSON, 텍스트 등 특정 형식의 응답을 생성하기 위해 **`<transform>`** 응답 규칙 내에서 템플릿을 사용하는 별도의 메커니즘도 제공합니다.

## 1. ViewDispatcher를 이용한 뷰 렌더링

Aspectran에서 웹 페이지 렌더링은 주로 `<dispatch>` 응답 규칙과 이를 처리하는 `ViewDispatcher` 구현체를 통해 이루어집니다. `ViewDispatcher`는 특정 뷰 기술(JSP, Thymeleaf, FreeMarker 등)을 사용하여 최종 화면을 렌더링하는 책임을 가집니다.

`<dispatch>` 규칙의 `name` 속성에는 템플릿 파일의 경로를 지정하며, `dispatcher` 속성에는 렌더링을 담당할 `ViewDispatcher` 빈(bean)을 지정할 수 있습니다. 만약 `dispatcher` 속성이 생략되면 기본 `ViewDispatcher`가 사용됩니다.

> **Note:** 문자 인코딩은 `contentType` 속성에 포함하는 대신, 별도의 `encoding` 속성을 사용하여 지정해야 합니다. 만약 `encoding` 속성이 생략되면 상위 응답 규칙의 인코딩 설정을 상속받습니다.

### 지원되는 뷰 기술:

#### 가. JSP (JavaServer Pages)

JSP는 서블릿 컨테이너에 의해 직접 실행되는 고전적인 뷰 기술입니다. Aspectran은 `JspViewDispatcher`를 통해 JSP 파일로 요청을 전달(forward)하여 렌더링을 위임합니다.

**Maven 의존성:**
```xml
<dependency>
    <groupId>com.aspectran</groupId>
    <artifactId>aspectran-web</artifactId>
    <version>9.4.2</version>
</dependency>
```

**설정 예제:**
```xml
<!-- 1. JSP 뷰 디스패처 빈 설정 -->
<bean id="jspViewDispatcher" class="com.aspectran.web.support.view.JspViewDispatcher">
    <property name="prefix" value="/WEB-INF/jsp/"/>
    <property name="suffix" value=".jsp"/>
</bean>

<!-- 2. Dispatch 규칙 정의 -->
<dispatch name="hello" dispatcher="jspViewDispatcher" contentType="text/html" encoding="UTF-8"/>
```

#### 나. Thymeleaf

Thymeleaf는 웹 및 독립 실행형 환경 모두를 위한 최신 서버 사이드 자바 템플릿 엔진입니다. 템플릿 자체가 브라우저에서 올바르게 표시될 수 있는 유효한 HTML이 되도록 하는 "내추럴 템플릿(Natural Templating)" 기능으로 잘 알려져 있습니다. (공식 웹사이트: https://www.thymeleaf.org/)

**Maven 의존성:**
```xml
<dependency>
    <groupId>com.aspectran</groupId>
    <artifactId>aspectran-with-thymeleaf</artifactId>
    <version>9.4.2</version>
</dependency>
```

**설정 예제:**
```xml
<!-- 1. Thymeleaf 뷰 디스패처 빈 설정 -->
<bean id="thymeleafViewDispatcher" class="com.aspectran.thymeleaf.view.ThymeleafViewDispatcher">
    <property name="prefix" value="/WEB-INF/templates/"/>
    <property name="suffix" value=".html"/>
    <property name="templateEngine" value-ref="thymeleafEngine"/>
</bean>

<!-- 2. Dispatch 규칙 정의 -->
<dispatch name="hello" dispatcher="thymeleafViewDispatcher" contentType="text/html" encoding="UTF-8"/>
```

#### 다. FreeMarker

FreeMarker는 HTML부터 이메일까지 모든 종류의 텍스트 출력을 생성하기 위한 강력하고 널리 사용되는 템플릿 엔진입니다. (공식 웹사이트: https://freemarker.apache.org/)

**Maven 의존성:**
```xml
<dependency>
    <groupId>com.aspectran</groupId>
    <artifactId>aspectran-with-freemarker</artifactId>
    <version>9.4.2</version>
</dependency>
```

**설정 예제:**
```xml
<!-- 1. FreeMarker 뷰 디스패처 빈 설정 -->
<bean id="freeMarkerViewDispatcher" class="com.aspectran.freemarker.view.FreeMarkerViewDispatcher">
    <property name="prefix" value="/WEB-INF/templates/"/>
    <property name="suffix" value=".ftl"/>
    <property name="templateEngine" value-ref="freeMarkerEngine"/>
</bean>

<!-- 2. Dispatch 규칙 정의 -->
<dispatch name="hello" dispatcher="freeMarkerViewDispatcher" contentType="text/html" encoding="UTF-8"/>
```

#### 라. Pebble

Pebble은 Twig에서 영감을 받은 가볍지만 강력한 템플릿 엔진으로, 보안 기능과 확장성으로 유명합니다. (공식 웹사이트: https://pebbletemplates.io/)

**Maven 의존성:**
```xml
<dependency>
    <groupId>com.aspectran</groupId>
    <artifactId>aspectran-with-pebble</artifactId>
    <version>9.4.2</version>
</dependency>
```

**설정 예제:**
```xml
<!-- 1. Pebble 템플릿 엔진 빈 설정 -->
<bean id="pebbleEngine" class="com.aspectran.pebble.PebbleTemplateEngine">
    <argument>
        <bean class="com.aspectran.pebble.PebbleEngineFactoryBean">
            <property name="templateLoaderPath" type="array">
                <value>classpath:view</value>
            </property>
        </bean>
    </argument>
</bean>

<!-- 2. Pebble 뷰 디스패처 빈 설정 -->
<bean id="pebbleViewDispatcher" class="com.aspectran.pebble.view.PebbleViewDispatcher">
    <arguments>
        <item>#{pebbleEngine}</item>
    </arguments>
    <properties>
        <item name="suffix">.peb</item>
    </properties>
</bean>

<!-- 3. Dispatch 규칙 정의 -->
<dispatch name="template-2" dispatcher="pebbleViewDispatcher" contentType="text/html" encoding="UTF-8"/>
```

## 2. Transform 응답에서의 템플릿 활용

`<template>` 요소는 주로 `<transform>` 응답 규칙과 함께 사용되어, 완전한 웹 페이지가 아닌 특정 형식(TEXT, JSON, XML 등)의 데이터를 생성할 때 사용됩니다. 이는 API 응답이나 간단한 텍스트 결과를 만들 때 매우 유용합니다.

템플릿 내용은 XML 설정 파일 내에 직접 작성하거나, `file`, `resource`, `url` 속성을 사용하여 외부 리소스를 참조할 수 있습니다.

템플릿을 처리하는 방식은 `<template>` 태그의 `engine` 속성 값에 따라 결정됩니다.

### 템플릿 엔진 (`engine` 속성)

Aspectran의 템플릿 처리는 `engine` 속성에 따라 결정되며, 크게 세 가지 유형으로 나눌 수 있습니다.

1.  **`engine="token"` (또는 생략 시)**
    *   **처리 엔진**: Aspectran 내장 토큰 엔진
    *   **설명**: 기본값입니다. `${...}`(파라미터), `@{...}`(속성) 같은 Aspectran 고유의 토큰을 파싱하여 실행 시점에 실제 값으로 치환합니다. 동적인 텍스트 응답을 생성하는 표준적인 방법이며, 과거의 `builtin` 엔진을 대체합니다.

2.  **`engine="none"`**
    *   **처리 엔진**: 처리 안 함 (Raw Text)
    *   **설명**: 템플릿 내용을 전혀 처리하지 않고 원본 그대로 출력합니다. 미리 서식이 지정된 정적 JSON이나 XML을 수정 없이 반환하고 싶을 때 유용합니다.

3.  **`engine="[사용자 정의 빈 ID]"`**
    *   **처리 엔진**: 외부 템플릿 엔진 빈
    *   **설명**: `token`이나 `none`이 아닌 값이 오면, Aspectran은 이를 빈(Bean) ID로 간주하고 해당 빈에 템플릿 렌더링을 위임합니다. FreeMarker, Thymeleaf, Pebble 같은 서드파티 템플릿 엔진과 연동하는 방식입니다.

다음은 요약 테이블입니다.

| `engine` 속성 값 | 처리 엔진 | 설명 및 용도 |
| :--- | :--- | :--- |
| **(생략)** 또는 `token` | Aspectran 내장 토큰 엔진 | `${...}`, `@{...}` 같은 Aspectran 고유 토큰을 파싱하여 값을 치환합니다. **(권장 기본값)** |
| `none` | 처리 안 함 (Raw Text) | 템플릿 내용을 아무 처리 없이 그대로 출력합니다. (정적 JSON/XML 등) |
| (사용자 정의 빈 ID) | 외부 템플릿 엔진 빈 | 지정된 ID의 빈(Bean)에게 템플릿 처리를 위임합니다. (FreeMarker, Thymeleaf 등 연동) |

### 템플릿 스타일 (TextStyleType)

`<template>`에 `style` 속성을 지정하여 출력 형식을 제어할 수 있습니다. 이 속성은 `TextStyleType` 열거형(enum)에 해당합니다.

*   **`APON ("apon")`**
    APON(Aspectran Parameter Object Notation) 형식으로 텍스트를 작성할 때 사용됩니다. 파이프(`|`) 문자를 사용하여 여러 줄의 문자열을 가독성 높게 표현할 수 있으며, 들여쓰기와 줄바꿈이 그대로 유지됩니다.

*   **`COMPACT ("compact")`**
    '콤팩트' 스타일은 JSON이나 XML 등에서 불필요한 공백(들여쓰기, 줄바꿈 등)을 제거하여 데이터를 간결하게 만듭니다. 가독성을 위한 최소한의 공백은 유지될 수 있습니다.

*   **`COMPRESSED ("compressed")`**
    '압축' 스타일은 `compact`보다 더 공격적으로 공백을 제거하여 데이터 크기를 최소화합니다. 문법적으로 필수가 아닌 모든 공백을 제거하므로, 네트워크 전송량을 줄이는 데 가장 효과적입니다.

### 설정 예제

**예제 1: 외부 파일 참조**
```xml
<transform format="text" encoding="UTF-8">
    <!-- engine 속성을 생략하면 기본값인 "token"으로 처리됩니다 -->
    <template file="/path/to/my-template.txt"/>
</transform>
```

**예제 2: APON 스타일을 사용한 인라인 템플릿**
```xml
<transform format="text" encoding="UTF-8">
    <template style="apon">
        |----------------------------------------------------------
        |The input parameters and attributes are as follows:
        |   input-1: ${input-1} - This is a parameter.
        |   input-2: ${input-2} - This is a parameter.
        |   input-3: ${input-3} - This is a parameter.
        |   input-4: @{input-4} - This is an attribute.
        |----------------------------------------------------------
    </template>
</transform>
```

## 3. 결론

Aspectran은 뷰를 처리하는 두 가지 명확한 방법을 제공하여 높은 유연성과 확장성을 가집니다.

*   **`ViewDispatcher` (`<dispatch>` 규칙):** 웹 페이지 렌더링을 위한 표준적인 방법입니다. JSP, Thymeleaf, FreeMarker 등 다양한 뷰 기술을 일관된 방식으로 통합하고 처리합니다. `AbstractViewDispatcher`를 상속하여 자신만의 뷰 처리 로직을 구현할 수도 있습니다.

*   **`TemplateEngine` (`<transform>` 규칙 내 `<template>`):** API 응답이나 특정 데이터 형식의 결과물을 생성하는 데 특화된 방법입니다. 전체 뷰 페이지가 아닌, 필요한 부분만 동적으로 생성할 때 유용합니다.

개발자는 이 두 가지 메커니즘을 용도에 맞게 선택하여 사용하여, 웹 애플리케이션의 뷰 레이어를 효과적으로 설계하고 구현할 수 있습니다.
