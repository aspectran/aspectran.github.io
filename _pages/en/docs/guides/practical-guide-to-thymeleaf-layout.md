---
format: plate solid article
sidebar: toc
title: Guide to Applying Thymeleaf Layout in Aspectran
subheadline: Practical Guides
parent_path: /docs
---

This guide provides a step-by-step explanation of how to apply a common layout using the Thymeleaf template engine and Thymeleaf Layout Dialect in an Aspectran framework environment.

## 1. Add Dependencies to `pom.xml`

First, you need to add dependencies for Thymeleaf and Layout Dialect to your project's `pom.xml` file.

```xml
<dependencies>
    <!-- Aspectran-Thymeleaf integration library -->
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

    <!-- Other necessary dependencies -->
</dependencies>
```

- `aspectran-with-thymeleaf`: The core library for integrating Aspectran and Thymeleaf.
- `thymeleaf-layout-dialect`: A library that enables layout functionality in Thymeleaf.

## 2. Configure Aspectran Context (`web-context.xml`)

After adding the dependencies, you need to register the Thymeleaf template engine and view dispatcher as Beans in Aspectran's configuration file (e.g., `web-context.xml`).

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC "-//ASPECTRAN//DTD Aspectran 9.0//EN"
        "https://aspectran.com/dtd/aspectran-9.dtd">
<aspectran>

    <!-- 1. Configure Thymeleaf Template Engine Bean -->
    <bean id="thymeleaf" class="com.aspectran.thymeleaf.ThymeleafTemplateEngine">
        <argument>
            <bean class="com.aspectran.thymeleaf.TemplateEngineFactoryBean">
                <!-- Configure template file location and properties -->
                <property name="templateResolvers" type="set">
                    <bean class="com.aspectran.thymeleaf.template.FileTemplateResolver">
                        <property name="prefix">#{basePath}/webroot/WEB-INF/thymeleaf/</property>
                        <property name="suffix">.html</property>
                        <property name="templateMode">HTML</property>
                        <property name="cacheable" valueType="boolean">false</property>
                    </bean>
                </property>
                <!-- Add Layout Dialect -->
                <property type="set" name="dialects">
                    <bean class="nz.net.ultraq.thymeleaf.layoutdialect.LayoutDialect"/>
                </property>
            </bean>
        </argument>
    </bean>

    <!-- 2. Configure Thymeleaf View Dispatcher Bean -->
    <bean id="thymeleafViewDispatcher" class="com.aspectran.thymeleaf.view.ThymeleafViewDispatcher">
        <argument>#{thymeleaf}</argument>
    </bean>

    <!-- 3. Configure Aspect to map specific URL requests to Thymeleaf views -->
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

**Configuration Explanation:**
1.  **Thymeleaf Template Engine (`thymeleaf`)**:
    -   Uses `FileTemplateResolver` to specify the location (`prefix`) and extension (`suffix`) of template files.
    -   Activates the layout feature by adding `LayoutDialect` to the `dialects` property. This is the most crucial part.
    -   Setting the `cacheable` attribute to `false` allows immediate reflection of template modifications during development without a server restart. It is recommended to set this to `true` in a production environment.
2.  **Thymeleaf View Dispatcher (`thymeleafViewDispatcher`)**:
    -   Responsible for rendering views using the `thymeleaf` engine created above.
3.  **Aspect Configuration (`thymeleafTransletSettings`)**:
    -   Configures all incoming requests with the URL pattern `/thymeleaf/**` to use the `thymeleafViewDispatcher`. This means Thymeleaf templates will be used for responses to these requests.

## 3. Create a Base Layout Template

Now, create a base layout file that includes common UI elements (like headers, footers, etc.).
According to the `prefix` setting in `web-context.xml`, create the file at `webroot/WEB-INF/thymeleaf/templates/default.html`.

**`webroot/WEB-INF/thymeleaf/templates/default.html`**
```html
<!DOCTYPE html>
<html lang="en"
      xmlns:th="http://www.thymeleaf.org"
      xmlns:layout="http://www.ultraq.net.nz/thymeleaf/layout">
<head>
    <meta charset="UTF-8">
    <title>My Application</title>
    <!-- Common CSS -->
    <link rel="stylesheet" th:href="@{/assets/css/style.css}">
</head>
<body>
    <header>
        <h1>Application Header</h1>
    </header>

    <!-- The content of the content page will be inserted here -->
    <main layout:fragment="content">
        <p>Content will be displayed here.</p>
    </main>

    <footer>
        <p>&copy; 2025 My Company</p>
    </footer>

    <!-- Common JS -->
    <script th:src="@{/assets/js/common.js}"></script>
</body>
</html>
```

-   `xmlns:layout="http://www.ultraq.net.nz/thymeleaf/layout"`: Declares the namespace to use the Layout Dialect.
-   `<main layout:fragment="content">`: Defines this area as the part that will be replaced by the content of each content page. `content` is the name of the fragment.

## 4. Create a Content Page

Finally, create the actual content page that inherits from the base layout created above.

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
            <p>This page is using the `default.html` layout.</p>
        </div>
    </div>
</div>

</body>
</html>
```

-   `layout:decorate="~{templates/default}"`: Specifies that this page will use the `templates/default.html` file as its layout. `~{...}` is Thymeleaf's Fragment Expression syntax.
-   `layout:fragment="content"`: Indicates that the content within the `<body>` tag of this HTML document will be inserted into the `layout:fragment="content"` section of the layout.

Now, when you send a request to a URL like `/thymeleaf/index`, the content of `index.html` will be applied to the `default.html` layout, rendering a complete HTML page.

---
This concludes the guide on how to set up and use Thymeleaf Layout Dialect in Aspectran.
