---
title: Aspectran 뷰(View) 기술
subheadline: 핵심 가이드
---

Aspectran은 최종 응답을 생성하기 위해 매우 유연하고 일관된 뷰(View) 처리 아키텍처를 제공합니다. 이 아키텍처의 중심에는 다양한 뷰 기술을 추상화하여 통합 처리하는 **`ViewDispatcher`**가 있습니다.

또한, 전체 HTML 페이지 렌더링뿐만 아니라 JSON, XML, TEXT, APON 등 특정 데이터 형식의 응답을 직렬화하거나 템플릿을 통해 생성하기 위해 **`<transform>`** 응답 규칙 및 **`TemplateEngine`** 연동 메커니즘을 제공합니다.

## 1. ViewDispatcher를 이용한 뷰 렌더링

Aspectran에서 웹 페이지 렌더링은 주로 `<translet>` 내의 `<dispatch>` 응답 규칙(또는 Java 컨트롤러 메소드의 `@Dispatch` 어노테이션)과 이를 처리하는 `ViewDispatcher` 구현체를 통해 이루어집니다. `ViewDispatcher`는 특정 뷰 기술(JSP, Thymeleaf, FreeMarker, Pebble 등)을 사용하여 최종 사용자 화면을 렌더링하는 책임을 가집니다.

`<dispatch>` 규칙의 `name` 속성에는 템플릿 파일의 경로 또는 뷰 이름을 지정하며, `dispatcher` 속성에는 렌더링을 담당할 `ViewDispatcher` 빈(bean)을 지정할 수 있습니다. 만약 `dispatcher` 속성이 생략되면 환경 설정에 등록된 기본 `ViewDispatcher`가 사용됩니다.

### 1.1. 통합 데이터 모델 (`ActivityData`) 및 지연 조회(Lazy Resolution)

Aspectran의 뷰 렌더링 엔진은 템플릿에서 참조하는 모델 데이터를 **[`ActivityData`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/activity/ActivityData.java)**라는 단일 파사드(Facade) 맵 객체로 통합하여 제공합니다.

| 우선순위 | 데이터 소스 (Data Source) | 설명 및 출처 | 템플릿/토큰 참조 예시 |
| :---: | :--- | :--- | :--- |
| **1순위** | **Action Results (`ActionResult`)** | 액션 메소드의 반환 객체 (`action id` 또는 프로퍼티명) | `@{status.hostName}`, `status.hostName` |
| **2순위** | **Request Attributes (`Attribute`)** | `translet.setAttribute("key", value)`로 등록된 속성 | `@{currentMenu}`, `currentMenu` |
| **3순위** | **Request Parameters (`Parameter`)** | 클라이언트 쿼리/폼 파라미터 및 `${...}` 경로 변수 | `${requestedBy}`, `requestedBy` |
| **4순위** | **Session Attributes (`Session`)** | 사용자 세션(`SessionAdapter`)에 저장된 데이터 | `session.userName` |

이 통합 모델 덕분에 컨트롤러나 액션에서 명시적으로 모델 객체를 뷰 맵으로 복사하지 않아도, 템플릿에서는 필요한 데이터에 즉시 일관되게 접근할 수 있습니다.

### 1.2. 지원되는 뷰 기술 및 실전 설정

#### 가. JSP (JavaServer Pages)

JSP는 서블릿 컨테이너에 의해 직접 실행되는 고전적인 뷰 기술입니다. Aspectran은 서블릿 환경에 맞추어 두 가지 뷰 디스패처를 제공합니다:

1. **`JspViewDispatcher`**: 단일 JSP 파일로 요청을 포워딩(`forward`)하여 렌더링을 위임합니다.
2. **`JspTemplateViewDispatcher`**: 공통 레이아웃 템플릿(Composite View Pattern)을 적용하여 전체 페이지 레이아웃과 개별 본문 JSP를 결합 렌더링합니다.

**Maven 의존성:**
```xml
<dependency>
    <groupId>com.aspectran</groupId>
    <artifactId>aspectran-web</artifactId>
    <version>9.6.5</version>
</dependency>
```

**실전 설정 예제 (단일 JSP 뷰 & Aspect 전역 주입):**
```xml
<!-- 1. JSP 뷰 디스패처 빈 등록 -->
<bean id="jspViewDispatcher" class="com.aspectran.web.servlet.support.view.JspViewDispatcher">
    <property name="prefix" value="/WEB-INF/jsp/"/>
    <property name="suffix" value=".jsp"/>
</bean>

<!-- 2. Aspect를 통한 기본 viewDispatcher 및 웹 환경 설정 전역 주입 -->
<aspect id="webTransletSettings">
    <joinpoint>
        pointcut: {
            +: /**
        }
    </joinpoint>
    <settings>
        <setting name="characterEncoding" value="utf-8"/>
        <setting name="viewDispatcher" value="jspViewDispatcher"/>
    </settings>
</aspect>

<!-- 3. Translet 내에서 간결하게 Dispatch 규칙 정의 -->
<translet name="/user/profile">
    <action id="user" bean="userService" method="getUser"/>
    <dispatch name="user/profile"/>
</translet>
```

**레이아웃 템플릿 적용 예제 (`JspTemplateViewDispatcher`):**
```xml
<!-- 메인 레이아웃 JSP에 본문 JSP 경로를 includePageKey 속성으로 전달 -->
<bean id="jspTemplateViewDispatcher" class="com.aspectran.web.servlet.support.view.JspTemplateViewDispatcher">
    <property name="template" value="/WEB-INF/jsp/layout/main-layout.jsp"/>
    <property name="includePageKey" value="includePage"/>
    <property name="prefix" value="/WEB-INF/jsp/"/>
    <property name="suffix" value=".jsp"/>
</bean>
```

*`/WEB-INF/jsp/layout/main-layout.jsp` 예시:*
```jsp
<%@ page contentType="text/html; charset=UTF-8" %>
<!DOCTYPE html>
<html>
<head><title>My Application</title></head>
<body>
    <jsp:include page="/WEB-INF/jsp/layout/header.jsp"/>
    <main>
        <!-- 본문 뷰가 동적으로 인클루드됨 -->
        <jsp:include page="${includePage}"/>
    </main>
    <jsp:include page="/WEB-INF/jsp/layout/footer.jsp"/>
</body>
</html>
```

#### 나. Thymeleaf

Thymeleaf는 웹 및 독립 실행형 환경 모두를 지원하는 최신 서버 사이드 자바 템플릿 엔진입니다. 템플릿 자체가 브라우저에서 올바르게 표시될 수 있는 유효한 HTML이 되도록 하는 **내추럴 템플릿(Natural Templating)** 기능과 조각 표현식(Fragment)을 지원합니다. (공식 웹사이트: [https://www.thymeleaf.org/](https://www.thymeleaf.org/))

**Maven 의존성:**
```xml
<dependency>
    <groupId>com.aspectran</groupId>
    <artifactId>aspectran-with-thymeleaf</artifactId>
    <version>9.6.5</version>
</dependency>
```

**실전 설정 예제 (Aspect 전역 주입 및 Fragment 활용):**
```xml
<!-- 1. Thymeleaf 템플릿 엔진 및 뷰 디스패처 설정 -->
<bean id="thymeleafEngine" class="com.aspectran.thymeleaf.ThymeleafTemplateEngine">
    <property name="templateResolver">
        <bean class="org.thymeleaf.templateresolver.ClassLoaderTemplateResolver">
            <property name="prefix" value="templates/"/>
            <property name="suffix" value=".html"/>
            <property name="templateMode" value="HTML"/>
            <property name="characterEncoding" value="UTF-8"/>
            <property name="cacheable" value="false"/>
        </bean>
    </property>
</bean>

<bean id="thymeleafViewDispatcher" class="com.aspectran.thymeleaf.view.ThymeleafViewDispatcher">
    <argument>#{thymeleafEngine}</argument>
</bean>

<!-- 2. Aspect를 통한 기본 viewDispatcher 및 응답 헤더 주입 -->
<aspect id="webTransletSettings">
    <joinpoint>
        pointcut: {
            +: /**
        }
    </joinpoint>
    <settings>
        <setting name="characterEncoding" value="utf-8"/>
        <setting name="viewDispatcher" value="thymeleafViewDispatcher"/>
    </settings>
</aspect>

<!-- 3. Translet 내에서 Dispatch 규칙 정의 -->
<translet name="/user/profile">
    <action id="user" bean="userService" method="getUser"/>
    <!-- 기본 dispatcher(thymeleafViewDispatcher)가 자동 적용됨 -->
    <dispatch name="user/profile"/>
    <!-- Fragment 지정 예: <dispatch name="user/profile :: mainContent"/> -->
</translet>
```

#### 다. FreeMarker

FreeMarker는 복잡한 매크로, 데이터 가공, 이메일 본문 생성 등 모든 종류의 텍스트 및 HTML 출력을 생성하기 위한 강력하고 성숙한 템플릿 엔진입니다. (공식 웹사이트: [https://freemarker.apache.org/](https://freemarker.apache.org/))

**Maven 의존성:**
```xml
<dependency>
    <groupId>com.aspectran</groupId>
    <artifactId>aspectran-with-freemarker</artifactId>
    <version>9.6.5</version>
</dependency>
```

**실전 설정 예제:**
```xml
<!-- 1. FreeMarker 템플릿 엔진 및 뷰 디스패처 설정 -->
<bean id="freeMarkerEngine" class="com.aspectran.freemarker.FreeMarkerTemplateEngine">
    <property name="templateLoaderPath" type="array">
        <value>classpath:templates</value>
    </property>
    <property name="defaultEncoding" value="UTF-8"/>
</bean>

<bean id="freeMarkerViewDispatcher" class="com.aspectran.freemarker.view.FreeMarkerViewDispatcher">
    <argument>#{freeMarkerEngine}</argument>
    <property name="suffix" value=".ftl"/>
</bean>

<!-- 2. Aspect를 통한 기본 viewDispatcher 주입 -->
<aspect id="webTransletSettings">
    <joinpoint>
        pointcut: {
            +: /**
        }
    </joinpoint>
    <settings>
        <setting name="characterEncoding" value="utf-8"/>
        <setting name="viewDispatcher" value="freeMarkerViewDispatcher"/>
    </settings>
</aspect>

<!-- 3. Translet 내에서 Dispatch 규칙 정의 -->
<translet name="/user/profile">
    <action id="user" bean="userService" method="getUser"/>
    <dispatch name="user/profile"/>
</translet>
```

#### 라. Pebble

Pebble은 Twig과 유사한 직관적인 문법을 가진 가볍고 빠른 고성능 템플릿 엔진으로, 템플릿 상속(Extends)과 엄격한 보안 샌드박스 기능을 제공합니다. (공식 웹사이트: [https://pebbletemplates.io/](https://pebbletemplates.io/))

**Maven 의존성:**
```xml
<dependency>
    <groupId>com.aspectran</groupId>
    <artifactId>aspectran-with-pebble</artifactId>
    <version>9.6.5</version>
</dependency>
```

**실전 설정 예제:**
```xml
<!-- 1. Pebble 템플릿 엔진 및 뷰 디스패처 설정 -->
<bean id="pebbleEngine" class="com.aspectran.pebble.PebbleTemplateEngine">
    <argument>
        <bean class="com.aspectran.pebble.PebbleEngineFactoryBean">
            <property name="templateLoaderPath" type="array">
                <value>classpath:templates</value>
            </property>
        </bean>
    </argument>
</bean>

<bean id="pebbleViewDispatcher" class="com.aspectran.pebble.view.PebbleViewDispatcher">
    <argument>#{pebbleEngine}</argument>
    <property name="suffix" value=".peb"/>
</bean>

<!-- 2. Aspect를 통한 기본 viewDispatcher 주입 -->
<aspect id="webTransletSettings">
    <joinpoint>
        pointcut: {
            +: /**
        }
    </joinpoint>
    <settings>
        <setting name="characterEncoding" value="utf-8"/>
        <setting name="viewDispatcher" value="pebbleViewDispatcher"/>
    </settings>
</aspect>

<!-- 3. Translet 내에서 Dispatch 규칙 정의 -->
<translet name="/user/profile">
    <action id="user" bean="userService" method="getUser"/>
    <dispatch name="user/profile"/>
</translet>
```


### 1.3. Java 어노테이션 기반 뷰 디스패치 (`@Dispatch`)

XML의 `<dispatch>` 설정 외에도 자바 `@Component` 컨트롤러 메소드에 **`@Dispatch`** 어노테이션을 선언하여 뷰 렌더링 규칙을 직관적으로 지정할 수 있습니다.

```java
package com.aspectran.demo;

import com.aspectran.core.activity.Translet;
import com.aspectran.core.component.bean.annotation.Autowired;
import com.aspectran.core.component.bean.annotation.Component;
import com.aspectran.core.component.bean.annotation.Dispatch;
import com.aspectran.core.component.bean.annotation.RequestToGet;
import org.jspecify.annotations.NonNull;

@Component
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @RequestToGet("/user/profile/${userId}")
    @Dispatch("user/profile") // 뷰 이름 지정 (기본 ViewDispatcher 사용)
    public User showProfile(@NonNull Translet translet, long userId) {
        User user = userService.getUserById(userId);
        // 반환된 User 객체는 Action Result로서 템플릿 모델(ActivityData)에 자동 등록됩니다.
        return user;
    }

    @RequestToGet("/admin/dashboard")
    @Dispatch(
        name = "admin/dashboard",
        dispatcher = "thymeleafViewDispatcher", // 특정 ViewDispatcher 지정 가능
        contentType = "text/html",
        encoding = "UTF-8"
    )
    public void showDashboard(@NonNull Translet translet) {
        translet.setAttribute("serverTime", System.currentTimeMillis());
    }
}
```

## 2. Transform 응답에서의 템플릿 및 데이터 변환

`<transform>` 응답 규칙은 전체 웹 페이지를 렌더링하는 대신, 특정 데이터 포맷(JSON, XML, TEXT, APON 등)으로 결과를 변환(Transform)하거나 조립하여 응답할 때 사용합니다. RESTful API 응답이나 CLI 텍스트 출력, 이메일 본문 생성에 주로 사용됩니다.

### 2.1. 지원되는 Transform 포맷 (`format` 속성)

`<transform>` 규칙의 `format` 속성에는 [`FormatType`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/context/rule/type/FormatType.java)에 정의된 식별자를 지정합니다:

| `format` 값 | 기본 Content-Type | 설명 및 용도 |
| :--- | :--- | :--- |
| **`json`** | `application/json` | 액션 결과 및 프로세스 결과를 JSON 형식으로 직렬화하여 응답합니다. `pretty="true"` 지원. |
| **`xml`** | `application/xml` | 액션 결과 및 프로세스 결과를 XML 형식으로 직렬화하여 응답합니다. `pretty="true"` 지원. |
| **`text`** | `text/plain` | 텍스트 형태로 응답합니다. `<template>`과 함께 사용하여 토큰 치환 및 동적 텍스트 생성이 가능합니다. |
| **`apon`** | `text/plain` | Aspectran 고유의 파라미터 표기법(APON) 형식으로 직렬화하여 응답합니다. |
| **`xsl`** | (사용자 지정) | XML 결과물을 XSLT 템플릿을 거쳐 변환 출력합니다. |
| **`custom`** | (사용자 지정) | 사용자 정의 `CustomTransformer`를 통해 임의의 직렬화 로직을 수행합니다. |
| **`none`** | `text/plain` | 별도의 변환 없이 원본 문자열을 그대로 전송합니다. |

> **⚠️ 주의:** `format` 속성에는 `text`, `json`, `xml` 등의 정확한 형식명을 지정해야 합니다. MIME 타입(예: `text/plain`, `text/html`)은 `contentType` 속성에 별도로 지정합니다.

**Java 어노테이션 예시 (`@Transform`):**
```java
@RequestToGet("/api/users")
@Transform(format = FormatType.JSON, pretty = true)
public List<User> getUserList() {
    return userService.getAllUsers();
}
```

### 2.2. Transform 내의 `<template>` 및 템플릿 엔진 (`engine` 속성)

`<transform>` 내부에 `<template>` 요소를 배치하면 텍스트 응답을 동적으로 생성할 수 있습니다. 템플릿 내용은 XML에 직접 작성하거나 `file`, `resource`, `url` 속성으로 외부 파일을 참조할 수 있습니다.

| `engine` 속성 값 | 처리 엔진 | 설명 및 용도 |
| :--- | :--- | :--- |
| **(생략)** 또는 `token` | Aspectran 내장 토큰 엔진 | `${...}`(파라미터), `@{...}`(속성) 등 Aspectran 고유 토큰을 치환합니다. **(기본 권장값)** |
| `none` | 처리 안 함 (Raw Text) | 템플릿 내용을 파싱하지 않고 원본 문자열 그대로 출력합니다. (정적 텍스트/JSON 등) |
| (사용자 정의 빈 ID) | 외부 템플릿 엔진 빈 | 지정된 ID의 `TemplateEngine` 빈(FreeMarker, Thymeleaf, Pebble 등)에 처리를 위임합니다. |

### 2.3. 템플릿 텍스트 스타일 (`style` 속성)

`<template>` 요소에 `style` 속성을 지정하여 출력 서식을 제어할 수 있습니다:

* **`APON ("apon")`**: APON(Aspectran Parameter Object Notation)의 파이프(`|`) 문법을 지원하여 여러 줄 텍스트의 들여쓰기와 줄바꿈을 코드 가독성을 해치지 않고 원본 그대로 표현합니다.
* **`COMPACT ("compact")`**: JSON이나 XML 등에서 불필요한 공백을 줄여 간결하게 포맷팅합니다.
* **`COMPRESSED ("compressed")`**: 문법상 필수가 아닌 모든 공백/줄바꿈을 제거하여 전송량을 극소화합니다.

### 2.4. Transform 및 Template 설정 예제

**예제 1: APON 스타일을 적용한 토큰 템플릿 변환**
```xml
<translet name="/system/status">
    <!-- Action에 id를 부여해야 반환값이 ActionResult/Attribute로 등록되어 @{status.hostName} 등으로 참조 가능 -->
    <action id="status" bean="systemService" method="getStatus"/>
    <transform format="text" contentType="text/plain" encoding="UTF-8">
        <template style="apon">
            |======================================================
            | SYSTEM STATUS REPORT
            |======================================================
            | Host Name     : @{status.hostName}
            | Active Users  : @{status.userCount}
            | Free Memory   : @{status.freeMemory} MB
            | Requested By  : ${requestedBy}
            | Generated At  : #{method:java.lang.System^currentTimeMillis}
            |======================================================
        </template>
    </transform>
</translet>
```

**예제 2: 외부 템플릿 엔진(FreeMarker)을 이용한 텍스트 파일 생성**
```xml
<translet name="/reports/daily-text">
    <action id="report" bean="reportService" method="getDailySummary"/>
    <transform format="text" contentType="text/plain" encoding="UTF-8">
        <!-- freeMarkerEngine 빈을 통해 template-report.ftl을 렌더링 -->
        <template engine="freeMarkerEngine" file="/templates/template-report.ftl"/>
    </transform>
</translet>
```

## 3. 커스텀 ViewDispatcher 확장 구현

Aspectran은 뷰 렌더링 계층이 완전히 추상화되어 있으므로, 사내 표준 뷰 기술이나 새로운 템플릿 엔진을 통합해야 할 경우 **[`AbstractViewDispatcher`](https://github.com/aspectran/aspectran/blob/master/core/src/main/java/com/aspectran/core/activity/response/dispatch/AbstractViewDispatcher.java)**를 상속받아 손쉽게 자체 `ViewDispatcher`를 작성할 수 있습니다.

```java
package com.mycompany.view;

import com.aspectran.core.activity.Activity;
import com.aspectran.core.activity.response.dispatch.AbstractViewDispatcher;
import com.aspectran.core.activity.response.dispatch.ViewDispatcherException;
import com.aspectran.core.adapter.ResponseAdapter;
import com.aspectran.core.context.rule.DispatchRule;
import java.io.Writer;
import java.util.Map;

public class CustomViewDispatcher extends AbstractViewDispatcher {

    @Override
    public void dispatch(Activity activity, DispatchRule dispatchRule) throws ViewDispatcherException {
        try {
            // 1. prefix와 suffix가 결합된 최종 뷰 이름 해석
            String viewName = resolveViewName(dispatchRule, activity);

            // 2. 응답 Content-Type 및 인코딩 설정
            ResponseAdapter responseAdapter = activity.getResponseAdapter();
            String contentType = (dispatchRule.getContentType() != null) ? dispatchRule.getContentType() : getContentType();
            if (contentType != null) {
                responseAdapter.setContentType(contentType);
            }

            // 3. 통합 모델 데이터(ActivityData) 획득
            Map<String, Object> model = activity.getActivityData();
            Writer writer = responseAdapter.getWriter();

            // 4. 자체 뷰 렌더러 호출
            MyCustomTemplateEngine.render(viewName, model, writer);
            writer.flush();
        } catch (Exception e) {
            throw new ViewDispatcherException("Failed to render custom view", e);
        }
    }
}
```

## 4. 결론

Aspectran은 뷰 및 응답 처리를 위해 두 가지 핵심 축을 제공합니다:

1. **`ViewDispatcher` (`<dispatch>` / `@Dispatch`)**: JSP, Thymeleaf, FreeMarker, Pebble 등 다양한 웹 뷰 기술을 `ActivityData` 통합 모델과 결합하여 완전한 UI 화면을 일관되게 렌더링합니다.
2. **`Transform` & `TemplateEngine` (`<transform>` / `@Transform`)**: JSON, XML 등 정형 데이터 직렬화와 내장/외부 템플릿 엔진을 결합하여 RESTful API 및 정밀한 텍스트 응답을 유연하게 생성합니다.

개발자는 아키텍처의 복잡성을 신경 쓰지 않고도 선언적 규칙이나 자바 어노테이션을 통해 애플리케이션에 최적화된 뷰 렌더링 파이프라인을 구축할 수 있습니다.
