---
format: plate solid article
sidebar: toc
title: Aspectran XML 구성 가이드
subheadline: 사용자 가이드
parent_path: /docs
---

Aspectran은 XML 설정을 통해 애플리케이션의 핵심 구성 요소인 빈(Bean), 트랜슬릿(Translet), 애스펙트(Aspect) 등을 정의합니다. XML을 사용하면 소스 코드 변경 없이 구성과 관계를 정의할 수 있어 유연성이 높습니다.

이 설정 파일의 유효성 검증을 위해 Aspectran은 XML 스키마(XSD) 대신 DTD(문서 종류 정의)를 사용합니다. 이는 Aspectran의 실용주의적 설계 철학을 반영하는 선택입니다. DTD는 설정의 구조적 무결성을 검증하는 데 충분하며, 데이터 값의 유효성 같은 세부적인 검증은 프레임워크 내부에서 직접 처리하여 일관성을 유지합니다. 이를 통해 불필요한 복잡성을 배제하고 설정의 명확성을 높였습니다.

이 문서는 Aspectran XML 설정 파일(`aspectran-config.xml`)에 사용되는 모든 요소를 상세히 설명합니다.

## 1. 최상위 및 기본 설정 (Top-level & Basic Configuration)

최상위 레벨에서 Aspectran 애플리케이션의 기본 구조와 환경을 설정하는 요소들입니다.

### 1.1. `<aspectran>`

모든 설정을 감싸는 루트(Root) 요소입니다. Aspectran 설정 파일의 최상위에 반드시 한 번만 존재해야 합니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE aspectran PUBLIC
    "-//ASPECTRAN//DTD Aspectran 9.0//EN"
    "https://aspectran.com/dtd/aspectran-9.dtd">

<aspectran>
    <!-- 모든 Aspectran 설정은 이 안에 위치합니다. -->
    ...
</aspectran>
```

### 1.2. `<description>`

설정 요소에 대한 설명을 추가합니다. 이 요소는 거의 모든 주요 요소(예: `<aspectran>`, `<bean>`, `<translet>` 등)의 자식으로 사용될 수 있어, 설정의 가독성을 높이고 특정 구성의 목적을 문서화하는 데 유용합니다.

```xml
<aspectran>
    <description>
        이 파일은 애플리케이션의 메인 설정을 정의합니다.
        개발 환경에서는 H2 데이터베이스를 사용합니다.
    </description>
</aspectran>
```

### 1.3. `<settings>` 및 `<setting>`

Aspectran 프레임워크의 전역적인 동작을 제어하는 설정을 정의합니다. `<settings>`는 하나 이상의 `<setting>` 자식 요소를 가집니다.

#### `<setting>` 속성 상세

-   `name` (필수): 설정 항목의 이름을 지정합니다. `DefaultSettingType` 열거형에 정의된 값을 사용해야 합니다.
    -   `transletNamePrefix`: 모든 트랜슬릿 이름에 공통적으로 추가될 접두사를 지정합니다.
    -   `transletNameSuffix`: 모든 트랜슬릿 이름에 공통적으로 추가될 접미사를 지정합니다.
    -   `pointcutPatternVerifiable`: `true`로 설정하면 애플리케이션 시작 시 AOP 포인트컷 표현식의 유효성을 검증합니다. `false`로 설정하면 검증을 생략하여 시작 시간을 단축할 수 있지만, 잘못된 표현식이 런타임 오류를 유발할 수 있습니다.
    -   `defaultTemplateEngineBean`: `transform` 액션에서 특정 템플릿 엔진을 지정하지 않았을 때 기본으로 사용할 템플릿 엔진 빈의 ID를 지정합니다.
    -   `defaultSchedulerBean`: `schedule` 규칙에서 특정 스케줄러를 지정하지 않았을 때 기본으로 사용할 스케줄러 빈의 ID를 지정합니다.
-   `value` (필수): 설정할 값을 지정합니다.

```xml
<settings>
    <description>애플리케이션의 전역 설정을 정의합니다.</description>
    <setting name="transletNamePrefix" value="/api"/>
    <setting name="transletNameSuffix" value=".json"/>
    <setting name="pointcutPatternVerifiable" value="true"/>
    <setting name="defaultTemplateEngineBean" value="pebbleEngine"/>
    <setting name="defaultSchedulerBean" value="mainScheduler"/>
</settings>
```

### 1.4. `<typeAliases>` 및 `<typeAlias>`

긴 정규화된 클래스 이름(Fully Qualified Class Name)을 짧은 별칭으로 정의하여 XML 설정의 가독성을 높입니다.

#### `<typeAlias>` 속성 상세

-   `alias` (필수): 사용할 별칭을 지정합니다.
-   `type` (필수): 별칭에 매핑할 실제 클래스의 정규화된 이름을 지정합니다.

```xml
<typeAliases>
    <typeAlias alias="MyService" type="com.example.myapp.service.MyService"/>
    <typeAlias alias="MyController" type="com.example.myapp.controller.MyController"/>
</typeAliases>

<!-- 이제 'MyService' 별칭으로 클래스를 참조할 수 있습니다. -->
<bean id="myService" class="MyService"/>
```

### 1.5. `<environment>`

특정 프로파일(profile)이 활성화될 때만 적용될 속성(properties)을 정의합니다. 이를 통해 개발, 테스트, 운영 등 환경별로 다른 구성을 쉽게 관리할 수 있습니다.

#### `<environment>` 속성 상세

-   `profile` (필수): 설정을 적용할 프로파일의 이름을 지정합니다. 프로파일 이름 앞에 `!`를 붙이면 해당 프로파일이 활성화되지 않았을 때를 의미합니다. 여러 프로파일은 쉼표나 공백으로 구분하여 지정할 수 있습니다.

```xml
<!-- 'dev' 프로파일이 활성화될 때 적용될 환경 설정 -->
<environment profile="dev">
    <properties>
        <item name="db.driver" value="org.h2.Driver"/>
        <item name="db.url" value="jdbc:h2:mem:devdb"/>
    </properties>
</environment>

<!-- 'prod' 프로파일이 활성화될 때 적용될 환경 설정 -->
<environment profile="prod">
    <properties>
        <item name="db.driver" value="com.mysql.cj.jdbc.Driver"/>
        <item name="db.url" value="jdbc:mysql://prod.db.server/main"/>
    </properties>
</environment>
```

### 1.6. `<append>`

다른 XML 또는 APON 설정 파일을 현재 설정에 포함시켜 설정을 모듈화합니다.

#### `<append>` 속성 상세

-   `file`: 파일 시스템 경로를 기준으로 파일을 포함합니다.
-   `resource`: 클래스패스 경로를 기준으로 리소스를 포함합니다.
-   `url`: URL을 통해 원격 파일을 포함합니다.
-   `format`: 포함할 파일의 형식 (`xml` 또는 `apon`)을 지정합니다. 생략 시 파일 확장자에 따라 자동 감지되며, 확장자가 없으면 `xml`이 기본값입니다.
-   `profile`: 특정 프로파일이 활성화되었을 때만 해당 파일을 포함합니다.

```xml
<!-- 공통 빈 설정 파일 포함 -->
<append resource="config/common-beans.xml"/>

<!-- 'prod' 프로파일에서만 통계 관련 설정 파일 포함 -->
<append resource="config/metrics-context.xml" profile="prod"/>
```

## 2. 공통 파라미터 및 속성

여러 요소에 공통적으로 사용되어 값을 전달하거나 속성을 정의하는 요소들입니다.

### 2.1. 기본 항목 요소

개별적인 값, 인자, 속성 등을 정의하는 기본 요소들입니다.

-   **`<item>`**: 가장 일반적인 항목 요소로, 주로 래퍼 요소(`arguments`, `properties` 등) 안에서 컬렉션의 개별 원소를 정의할 때 사용됩니다.
-   **`<value>`**: 값 자체를 명시적으로 감싸고 싶을 때 사용합니다.
-   **`<entry>`**: `Map` 타입의 키-값(`name`-`value`) 쌍을 정의할 때 사용됩니다.

아래 요소들은 특정 목적을 위해 이름이 부여된 `<item>`의 별칭(alias)과 같으며, 가독성을 위해 단독으로 사용될 수 있습니다.

-   **`<parameter>`**: 요청 파라미터를 정의합니다.
-   **`<attribute>`**: 트랜슬릿 컨텍스트 내에서 사용할 속성을 정의합니다.
-   **`<argument>`**: 빈의 생성자에 전달할 인자를 정의합니다.
-   **`<property>`**: 빈의 속성(수정자)에 값을 주입합니다.

#### 항목 요소 속성 상세

-   `name`: 항목의 이름(키)을 지정합니다. (예: 속성명, 파라미터명)
-   `value`: 항목의 값을 리터럴로 지정합니다. AsEL(e.g., `#{...}`, `%{...}`)을 사용하여 다른 빈이나 속성을 참조할 수 있습니다.
-   `valueType`: 값의 타입을 명시적으로 지정합니다. (`string`, `int`, `long`, `float`, `double`, `boolean`, `file`, `bean` 등)
-   `type`: 컬렉션 타입을 지정합니다. (`array`, `list`, `set`, `map`, `properties`)
-   `tokenize`: `true`로 설정하면, `value` 속성의 문자열을 구분자(기본: `,`)로 분리하여 배열이나 리스트를 생성합니다.
-   `mandatory`: `true`로 설정하면, 해당 항목이 필수 값임을 나타냅니다. (주로 `<parameter>`에서 사용)
-   `secret`: `true`로 설정하면, 해당 항목의 값을 암호화된 상태로 관리합니다.

### 2.2. 프로파일 적용을 위한 래퍼 요소

여러 항목을 그룹화하고, 그룹 전체에 `profile`을 적용해야 할 때 래퍼(wrapper) 요소를 사용합니다. 이 래퍼 요소들은 자식으로 `<item>` 요소만을 가질 수 있다는 특징이 있습니다.

-   **`<parameters>`**: 여러 개의 요청 파라미터(`<item>`)를 그룹화합니다.
-   **`<attributes>`**: 여러 개의 컨텍스트 속성(`<item>`)을 그룹화합니다.
-   **`<arguments>`**: 여러 개의 생성자 인자(`<item>`)를 그룹화합니다.
-   **`<properties>`**: 여러 개의 빈 속성(`<item>`)을 그룹화합니다.

## 3. 애스펙트(`<aspect>`) 관련 요소

AOP(관점 지향 프로그래밍)의 **애스펙트**를 정의합니다. 애스펙트는 여러 곳에서 반복되는 공통 기능(횡단 관심사)을 모듈화한 것으로, `어드바이스(Advice)`와 `포인트컷(Pointcut)`의 조합으로 구성됩니다.

#### `<aspect>` 속성 상세

-   `id`: 애스펙트를 식별하는 고유 ID입니다.
-   `order`: 여러 애스펙트가 동일한 조인포인트에 적용될 때의 실행 순서를 지정합니다. 숫자가 낮을수록 우선순위가 높습니다.
-   `isolated`: `true`로 설정하면, 이 애스펙트 내에서 실행되는 어드바이스는 다른 애스펙트의 영향을 받지 않습니다. 기본값은 `false`입니다.
-   `disabled`: `true`로 설정하면, 이 애스펙트를 비활성화합니다. 기본값은 `false`입니다.

### 3.1. `<joinpoint>`

어드바이스를 적용할 위치, 즉 **조인포인트**를 지정하는 **포인트컷** 표현식을 정의합니다.

#### `<joinpoint>` 속성 상세

-   `target`: 포인트컷의 적용 대상을 지정합니다. (`method` 또는 `activity`). 기본값은 `method`입니다.
    -   `method`: 빈의 메소드 실행을 조인포인트로 지정합니다.
    -   `activity`: 트랜슬릿 실행 자체를 조인포인트로 지정합니다.
-   `pointcut` (필수): 포인트컷 표현식을 사용하여 조인포인트를 상세하게 지정합니다.

### 3.2. `<advice>`

조인포인트에서 실행될 실제 로직, 즉 **어드바이스**를 정의합니다.

#### `<advice>` 속성 상세

-   `bean` (필수): 어드바이스 로직을 담고 있는 빈의 ID를 지정합니다.

## 4. 빈(`<bean>`) 관련 요소

IoC(제어의 역전) 컨테이너가 생성하고 관리하는 객체인 **빈**을 정의합니다.

#### `<bean>` 속성 상세

-   `id`: 빈을 식별하는 고유한 이름입니다. 이 ID를 사용하여 다른 빈이나 설정에서 `#{beanId}` 형태로 참조할 수 있습니다.
-   `class`: 빈으로 생성할 클래스의 정규화된 이름 또는 별칭을 지정합니다. `scan` 속성과 함께 사용할 수 없습니다.
-   `scan`: 지정된 패키지 경로를 기준으로 클래스를 검색하여 자동으로 빈으로 등록합니다. Ant 스타일의 와일드카드(`*`, `**`)를 사용할 수 있습니다.
-   `mask`: `scan` 속성과 함께 사용됩니다. 스캔된 클래스의 정규화된 이름에서 `mask` 패턴과 일치하는 부분을 추출하여 동적으로 빈 ID를 생성합니다.
-   `scope`: 빈의 생명주기 범위를 지정합니다. (`singleton`, `prototype`, `request`, `session`). 기본값은 `singleton`입니다.
-   `factoryBean`: 다른 빈을 팩토리로 사용하여 현재 빈을 생성할 때, 팩토리 빈의 ID를 지정합니다.
-   `factoryMethod`: 빈의 인스턴스를 생성하기 위해 호출할 정적(static) 또는 인스턴스 메소드의 이름을 지정합니다.
-   `initMethod`: 빈 생성 및 속성 주입이 완료된 후 호출될 초기화 메소드를 지정합니다.
-   `destroyMethod`: 빈이 소멸될 때 호출될 소멸 메소드를 지정합니다.
-   `lazyInit`: `true`로 설정하면, 빈을 처음 사용할 때까지 생성을 지연시킵니다. (싱글톤 스코프에만 적용) 기본값은 `false`입니다.
-   `important`: `true`로 설정하면, 의존성 주입 시 동일한 타입의 다른 빈보다 우선적으로 주입될 후보가 됩니다. 기본값은 `false`입니다.

### 4.1. `<filter>`

`<bean scan="...">`을 사용하여 빈을 일괄 등록할 때, 특정 조건을 만족하는 클래스만 포함하거나 제외하는 필터를 APON 형식으로 정의합니다.

## 5. 트랜슬릿(`<translet>`) 관련 요소

사용자의 요청을 처리하는 핵심 작업 단위인 **트랜슬릿**을 정의합니다.

#### `<translet>` 속성 상세

-   `name` (필수): 트랜슬릿을 식별하는 고유한 이름입니다. 웹 환경에서는 주로 URL 경로가 사용되며, `*`, `**` 와일드카드를 사용할 수 있습니다.
-   `scan`: 지정된 경로의 파일(예: JSP, HTML)을 스캔하여 동적으로 트랜슬릿을 생성합니다.
-   `mask`: `scan` 속성과 함께 사용되며, 파일 경로에서 특정 패턴을 추출하여 트랜슬릿 이름으로 사용합니다.
-   `method`: 허용할 요청 메소드를 지정합니다. 웹 환경에서는 `GET`, `POST` 등과 같은 HTTP 요청 메소드에 해당합니다. 쉼표로 여러 개 지정 가능합니다.
-   `async`: `true`로 설정하면, 트랜슬릿을 비동기 방식으로 처리합니다. 기본값은 `false`입니다.
-   `timeout`: 비동기 처리 시 타임아웃 시간을 밀리초(ms) 단위로 지정합니다.

### 5.1. `<request>`

요청에 대한 규칙을 정의합니다.

#### `<request>` 속성 상세

-   `method`: 허용할 요청 메소드를 지정합니다. `<translet>`의 `method` 속성과 동일한 역할을 합니다.
-   `encoding`: 요청 파라미터의 문자 인코딩을 지정합니다.

### 5.2. 실행 및 흐름 제어 요소

-   **`<action>`**: 지정된 빈의 메소드를 실행합니다.
-   **`<include>`**: 다른 트랜슬릿의 처리 내용을 현재 위치에 포함하여 실행합니다.
-   **`<choose>`, `<when>`, `<otherwise>`**: 조건에 따라 다른 흐름을 실행합니다.
-   **`<headers>`**: HTTP 응답 헤더를 설정합니다.
-   **`<echo>`**: 지정된 속성의 값을 응답에 직접 출력합니다.

### 5.3. 응답 처리 요소

-   **`<transform>`**: 액션의 실행 결과를 특정 형식(JSON, XML 등)으로 변환하여 응답합니다.
-   **`<dispatch>`**: 요청을 뷰 템플릿(JSP 등)으로 전달하여 렌더링된 결과를 응답합니다.
-   **`<forward>`**: 현재 요청을 다른 트랜슬릿으로 전달하여 처리를 위임합니다.
-   **`<redirect>`**: 클라이언트에게 지정된 URL로 재요청하도록 리다이렉트 응답을 보냅니다.

## 6. 스케줄(`<schedule>`) 관련 요소

특정 시간에 또는 주기적으로 작업을 실행하도록 **스케줄**을 정의합니다.

#### `<schedule>` 속성 상세

-   `id`: 스케줄을 식별하는 고유 ID입니다.

### 6.1. `<scheduler>` 및 `<trigger>`

스케줄을 실행할 스케줄러 빈을 지정하고, `<trigger>`를 통해 실행 시점을 정의합니다.

#### `<trigger>` 속성 상세

-   `type` (필수): 트리거 타입. 현재는 `cron`만 지원합니다.
-   `expression` (필수): Cron 표현식을 사용하여 실행 시점을 상세하게 정의합니다.

### 6.2. `<job>`

스케줄러가 실행할 실제 작업, 즉 트랜슬릿을 지정합니다.

#### `<job>` 속성 상세

-   `translet` (필수): 실행할 트랜슬릿의 이름을 지정합니다.
-   `disabled`: `true`로 설정하면, 해당 작업을 비활성화합니다. 기본값은 `false`입니다.

## 7. 템플릿(`<template>`) 관련 요소

최상위 레벨에서 재사용 가능한 템플릿을 정의합니다.

#### `<template>` 속성 상세

-   `id`: 템플릿을 식별하는 고유 ID입니다.
-   `engine`: 사용할 템플릿 엔진 빈의 ID를 지정합니다.
-   `name`: 템플릿의 이름 또는 경로를 지정합니다.
-   `file`: 파일 시스템 경로를 기준으로 템플릿 파일을 지정합니다.
-   `resource`: 클래스패스 경로를 기준으로 템플릿 리소스를 지정합니다.
-   `url`: URL을 통해 원격 템플릿을 지정합니다.
-   `style`: APON 형식의 템플릿을 사용할 경우 스타일을 지정합니다. (`apon`, `compact`, `compressed`)
-   `contentType`: 템플릿 결과물의 `Content-Type`을 지정합니다.
-   `encoding`: 템플릿 파일의 문자 인코딩을 지정합니다.
-   `noCache`: `true`로 설정하면, 템플릿을 캐시하지 않습니다. 기본값은 `false`입니다.