---
format: plate solid article
sidebar: toc-left
title: Aspectran에서 Thymeleaf 레이아웃 적용 가이드
subheadline: 사용자 가이드
parent_path: /docs
---

이 가이드는 Aspectran 프레임워크 환경에서 Thymeleaf 템플릿 엔진과 Thymeleaf Layout Dialect를 사용하여 공통 레이아웃을 적용하는 방법을 단계별로 안내합니다.

## 1. `pom.xml`에 의존성 추가

먼저, 프로젝트의 `pom.xml` 파일에 Thymeleaf 및 Layout Dialect를 사용하기 위한 의존성을 추가해야 합니다.

```xml
<dependencies>
    <!-- Aspectran-Thymeleaf 통합 라이브러리 -->
    <dependency>
        <groupId>com.aspectran</groupId>
        <artifactId>aspectran-with-thymeleaf</artifactId>
        <version>${aspectran.version}</version>
    </dependency>

    <!-- Thymeleaf Layout Dialect -->
    <dependency>
        <groupId>nz.net.ultraq.thymeleaf</groupId>
        <artifactId>thymeleaf-layout-dialect</artifactId>
        <version>3.4.0</version>
    </dependency>

    <!-- 기타 필요한 의존성 -->
</dependencies>
```

- `aspectran-with-thymeleaf`: Aspectran과 Thymeleaf를 통합하는 핵심 라이브러리입니다.
- `thymeleaf-layout-dialect`: Thymeleaf에서 레이아웃 기능을 사용할 수 있도록 해주는 라이브러리입니다.

## 2. Aspectran 컨텍스트 설정 (`web-context.xml`)

의존성을 추가한 후, Aspectran의 설정 파일(예: `web-context.xml`)에 Thymeleaf 템플릿 엔진과 뷰 디스패처를 Bean으로 등록해야 합니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>

    <!-- 1. Thymeleaf 템플릿 엔진 Bean 설정 -->
    <bean id="thymeleaf" class="com.aspectran.thymeleaf.ThymeleafTemplateEngine">
        <argument>
            <bean class="com.aspectran.thymeleaf.TemplateEngineFactoryBean">
                <!-- 템플릿 파일의 위치와 속성 설정 -->
                <property name="templateResolvers" type="set">
                    <bean class="com.aspectran.thymeleaf.template.FileTemplateResolver">
                        <property name="prefix">#{basePath}/webroot/WEB-INF/thymeleaf/</property>
                        <property name="suffix">.html</property>
                        <property name="templateMode">HTML</property>
                        <property name="cacheable" valueType="boolean">false</property>
                    </bean>
                </property>
                <!-- Layout Dialect 추가 -->
                <property type="set" name="dialects">
                    <bean class="nz.net.ultraq.thymeleaf.layoutdialect.LayoutDialect"/>
                </property>
            </bean>
        </argument>
    </bean>

    <!-- 2. Thymeleaf 뷰 디스패처 Bean 설정 -->
    <bean id="thymeleafViewDispatcher" class="com.aspectran.thymeleaf.view.ThymeleafViewDispatcher">
        <argument>#{thymeleaf}</argument>
    </bean>

    <!-- 3. 특정 URL 요청을 Thymeleaf 뷰로 연결하는 Aspect 설정 -->
    <aspect id="thymeleafTransletSettings">
        <joinpoint>
            pointcut: {
                +: /thymeleaf/**
            }
        </joinpoint>
        <settings>
            <setting name="characterEncoding" value="utf-8"/>
            <setting name="viewDispatcher" value="thymeleafViewDispatcher"/>
        </settings>
    </aspect>

</aspectran>
```

### 설정 설명:
1.  **Thymeleaf 템플릿 엔진 (`thymeleaf`)**:
    - `FileTemplateResolver`를 사용하여 템플릿 파일의 위치(`prefix`)와 확장자(`suffix`)를 지정합니다.
    - `dialects` 프로퍼티에 `LayoutDialect`를 추가하여 레이아웃 기능을 활성화합니다. 이것이 가장 중요한 부분입니다.
    - `cacheable` 속성을 `false`로 설정하면 개발 중에 템플릿을 수정했을 때 서버 재시작 없이 바로 반영됩니다. 운영 환경에서는 `true`로 설정하는 것이 좋습니다.
2.  **Thymeleaf 뷰 디스패처 (`thymeleafViewDispatcher`)**:
    - 위에서 생성한 `thymeleaf` 엔진을 사용하여 뷰를 렌더링하는 역할을 합니다.
3.  **Aspect 설정 (`thymeleafTransletSettings`)**:
    - `/thymeleaf/**` 패턴의 URL로 들어오는 모든 요청을 `thymeleafViewDispatcher`를 사용하도록 설정합니다. 즉, 해당 요청에 대한 응답으로 Thymeleaf 템플릿이 사용됩니다.

## 3. 기본 레이아웃 템플릿 작성

이제 공통으로 사용될 UI 요소(헤더, 푸터 등)를 포함하는 기본 레이아웃 파일을 작성합니다.
`web-context.xml`의 `prefix` 설정에 따라 `webroot/WEB-INF/thymeleaf/templates/default.html` 경로에 파일을 생성합니다.

**`webroot/WEB-INF/thymeleaf/templates/default.html`**
```html
<!DOCTYPE html>
<html lang="ko"
      xmlns:th="http://www.thymeleaf.org"
      xmlns:layout="http://www.ultraq.net.nz/thymeleaf/layout">
<head>
    <meta charset="UTF-8">
    <title>My Application</title>
    <!-- 공통 CSS -->
    <link rel="stylesheet" th:href="@{/assets/css/style.css}">
</head>
<body>
    <header>
        <h1>애플리케이션 헤더</h1>
    </header>

    <!-- 콘텐츠 페이지의 내용이 이 부분에 삽입됩니다 -->
    <main layout:fragment="content">
        <p>여기에 콘텐츠가 표시됩니다.</p>
    </main>

    <footer>
        <p>&copy; 2025 My Company</p>
    </footer>

    <!-- 공통 JS -->
    <script th:src="@{/assets/js/common.js}"></script>
</body>
</html>
```

- `xmlns:layout="http://www.ultraq.net.nz/thymeleaf/layout"`: Layout Dialect를 사용하기 위해 네임스페이스를 선언합니다.
- `<main layout:fragment="content">`: 이 부분이 각 콘텐츠 페이지의 내용으로 대체될 영역임을 정의합니다. `content`는 프래그먼트의 이름입니다.

## 4. 콘텐츠 페이지 작성

마지막으로, 위에서 만든 기본 레이아웃을 상속받는 실제 콘텐츠 페이지를 작성합니다.

**`webroot/WEB-INF/thymeleaf/index.html`**
```html
<!DOCTYPE html>
<html lang="en"
      xmlns:layout="http://www.ultraq.net.nz/thymeleaf/layout"
      layout:decorate="~{templates/default}"
      layout:fragment="content">
<body>

<div class="container">
    <div class="row">
        <div class="col">
            <h2>Welcome to Aspectran with Thymeleaf!</h2>
            <p>이 페이지는 `default.html` 레이아웃을 사용하고 있습니다.</p>
        </div>
    </div>
</div>

</body>
</html>
```

- `layout:decorate="~{templates/default}"`: 이 페이지가 `templates/default.html` 파일을 레이아웃으로 사용하도록 지정합니다. `~{...}`는 Thymeleaf의 Fragment Expression 구문입니다.
- `layout:fragment="content"`: 이 HTML 문서의 `<body>` 태그 안의 내용이 레이아웃의 `layout:fragment="content"` 부분에 삽입될 것임을 나타냅니다.

이제 `/thymeleaf/index`와 같은 URL로 요청을 보내면, `index.html`의 콘텐츠가 `default.html` 레이아웃에 적용되어 완전한 HTML 페이지가 렌더링됩니다.

---
이상으로 Aspectran에서 Thymeleaf Layout Dialect를 설정하고 사용하는 방법에 대한 설명을 마칩니다.
