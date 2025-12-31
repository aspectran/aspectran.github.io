---
title: Aspectran XML 구성 가이드
subheadline: 사용자 가이드
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
    <property name="db.driver" value="org.h2.Driver"/>
    <property name="db.url" value="jdbc:h2:mem:devdb"/>
</environment>

<!-- 'prod' 프로파일이 활성화될 때 적용될 환경 설정 -->
<environment profile="prod">
    <property name="db.driver" value="com.mysql.cj.jdbc.Driver"/>
    <property name="db.url" value="jdbc:mysql://prod.db.server/main"/>
</environment>
```

### 1.6. `<append>`

다른 XML 또는 APON 설정 파일을 현재 설정에 포함시킵니다. 이 요소는 설정을 모듈화하는 기본이며, 특히 XML에서 환경별 빈(Bean) 정의를 관리하는 핵심적인 메커니즘입니다.

`profile` 속성을 사용하면 전체 설정 파일을 조건부로 포함시킬 수 있는데, 이것이 활성화된 환경(예: 개발, 운영)에 따라 어떤 빈을 등록할지 제어하는 가장 관용적인 방법입니다.

#### `<append>` 속성 상세

-   `file`: 파일 시스템 경로를 기준으로 파일을 포함합니다.
-   `resource`: 클래스패스 경로를 기준으로 리소스를 포함합니다. 가장 일반적으로 사용됩니다.
-   `url`: URL을 통해 원격 파일을 포함합니다.
-   `format`: 포함할 파일의 형식 (`xml` 또는 `apon`)을 지정합니다. 생략 시 파일 확장자에 따라 자동 감지되며, 확장자가 없으면 `xml`이 기본값입니다.
-   `profile`: 특정 프로파일이 활성화되었을 때만 해당 파일을 포함하는 강력한 속성입니다.

**예시: 프로파일별로 데이터베이스 빈 관리하기**

가장 흔한 사용 사례는 각 환경에 맞는 데이터베이스 커넥션 빈을 다르게 정의하는 것입니다.

1.  **프로파일별 XML 파일 생성:**
    -   `config/db/dev-db.xml`: 개발 환경을 위한 `dataSource` 빈을 정의합니다. (예: 인메모리 H2 데이터베이스)
    -   `config/db/prod-db.xml`: 운영 환경을 위한 `dataSource` 빈을 정의합니다. (예: 커넥션 풀이 적용된 MySQL)

2.  **메인 설정에서 조건부로 포함:**
    ```xml
    <aspectran>
        ...
        <!-- 공통 설정 포함 -->
        <append resource="config/common-context.xml"/>

        <!-- 활성화된 프로파일에 따라 적절한 데이터베이스 설정 포함 -->
        <append resource="config/db/dev-db.xml" profile="dev"/>
        <append resource="config/db/prod-db.xml" profile="prod"/>
        ...
    </aspectran>
    ```
이 설정에서 `dev` 프로파일이 활성화되면 `dev-db.xml`만 로드되어 H2 `dataSource`가 등록되고, `prod` 프로파일이 활성화되면 `prod-db.xml`이 로드되어 MySQL `dataSource`가 등록됩니다. 이를 통해 환경별 구성을 깔끔하고 견고하게 관리할 수 있습니다.

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
-   `tokenize`: `value` 속성의 문자열에서 특별한 토큰(예: `#{...}`, `@{...}`)을 파싱할지 여부를 결정하는 불리언 속성입니다. `true`(기본값)이면 토큰 표현식을 파싱하고, `false`이면 전체 값을 단일 리터럴 문자열로 취급합니다.
-   `mandatory`: `true`로 설정하면, 해당 항목이 필수 값임을 나타냅니다. (주로 `<parameter>`에서 사용)
-   `secret`: `true`로 설정하면, 해당 항목의 값을 암호화된 상태로 관리합니다.

### 2.2. 프로파일 적용을 위한 래퍼 요소

여러 항목을 그룹화하고, 그룹 전체에 `profile`을 적용해야 할 때 래퍼(wrapper) 요소를 사용합니다. 이 래퍼 요소들은 자식으로 `<item>` 요소만을 가질 수 있다는 특징이 있습니다.

-   **`<parameters>`**: 여러 개의 요청 파라미터(`<item>`)를 그룹화합니다.
-   **`<attributes>`**: 여러 개의 컨텍스트 속성(`<item>`)을 그룹화합니다.
-   **`<arguments>`**: 여러 개의 생성자 인자(`<item>`)를 그룹화합니다.
-   **`<properties>`**: 여러 개의 빈 속성(`<item>`)을 그룹화합니다.

## 3. 애스펙트(`<aspect>`) 관련 요소

Aspectran에서 애스펙트는 로깅, 트랜잭션, 보안과 같이 애플리케이션의 여러 지점에 적용되는 횡단 관심사를 모듈화합니다. 이는 `조인포인트`(어디에 개입할 것인가)와 `어드바이스`(무엇을 할 것인가)로 구성됩니다. Aspectran의 AOP는 핵심 실행 모델과 독특하게 통합되어, 전체 트랜슬릿 실행 또는 특정 빈 메소드에 어드바이스를 적용하는 강력한 방법을 제공합니다.

#### `<aspect>` 속성 상세

-   `id`: 애스펙트를 식별하는 고유 ID입니다.
-   `order`: 여러 애스펙트가 동일한 조인포인트에 적용될 때의 실행 순서를 지정합니다. 숫자가 낮을수록 우선순위가 높습니다(먼저 실행됨).
-   `isolated`: `true`로 설정하면, 이 애스펙트 내에서 실행되는 어드바이스는 다른 애스펙트의 대상이 되지 않습니다. 이는 무한 재귀를 방지합니다. 기본값은 `false`입니다.
-   `disabled`: `true`로 설정하면, 이 애스펙트가 비활성화되어 적용되지 않습니다. 기본값은 `false`입니다.

### 3.1. `<joinpoint>`: 포인트컷 정의하기

**포인트컷**은 어드바이스가 적용될 위치를 지정합니다. Aspectran은 `<joinpoint>` 요소의 본문 내에 **APON(Aspectran Parameter Object Notation)** 형식을 사용하여 포인트컷을 정의합니다.

포인트컷의 APON 블록은 두 가지 주요 속성을 가집니다:

-   `type`: 패턴 매칭 스타일입니다. `wildcard`(기본값) 또는 `regexp`(정규 표현식)가 될 수 있습니다.
-   `pointcut`: 하나 이상의 패턴 문자열입니다. `+:` 접두사는 일치 항목을 포함하고, `-:` 접두사는 제외합니다.

#### 포인트컷 패턴 구문

패턴 문자열은 `transletNamePattern[@beanOrClassPattern][^methodNamePattern]` 구조를 따릅니다.

-   **`transletNamePattern`**: 트랜슬릿 이름과 일치합니다.
-   **`@beanOrClassPattern`**: (선택 사항) 빈 ID 또는 `class:` 접두사가 붙은 전체 클래스 이름과 일치합니다.
-   **`^methodNamePattern`**: (선택 사항) 메소드 이름과 일치합니다.

**예제 1: 와일드카드 포인트컷 (기본값)**
가장 일반적인 유형입니다. 세그먼트 내의 모든 문자와 일치하는 `*`와 여러 세그먼트에 걸쳐 모든 문자와 일치하는 `**`를 사용합니다.

```xml
<joinpoint>
    pointcut: {
        type: wildcard        // 기본값이므로 생략 가능
        +: /api/**            // /api/ 아래의 모든 트랜슬릿과 일치
        -: /api/internal/*    // /api/internal/ 바로 아래의 트랜슬릿은 제외
    }
</joinpoint>
```

**예제 2: 정규 표현식 포인트컷**
이 포인트컷은 경로에 숫자 ID가 있는 트랜슬릿을 대상으로 하는 정규 표현식을 사용합니다.

```xml
<joinpoint>
    pointcut: {
        type: regexp
        +: /users/\d+        // /users/1, /users/123 등과 일치
    }
</joinpoint>
```

**예제 3: 빈 메소드 포인트컷**
이 포인트컷은 모든 트랜슬릿(`**`) 내에서 ID가 `orderService`인 빈(`@orderService`)의 모든 메소드(`^*`)를 대상으로 합니다.

```xml
<joinpoint>
    pointcut: {
        +: **@orderService^*
    }
</joinpoint>
```

### 3.2. `<advice>`: 어드바이스 정의하기

`<advice>` 요소는 선택된 조인포인트에서 실행할 로직을 정의합니다. 어드바이스 메소드를 포함하는 빈에 연결됩니다. 어드바이스의 실행 시점은 다음 자식 요소들을 사용하여 선언됩니다.

-   `<before>`: 조인포인트 **전**에 액션을 실행합니다.
-   `<after>`: 조인포인트가 성공적으로 완료된 **후**에만 액션을 실행합니다.
-   `<around>`: 단일 액션을 실행하는 간단한 어드바이스 유형입니다. 조인포인트를 감싸지 않으며 관리할 `proceed()` 호출이 없으므로 AspectJ의 `@Around` 어드바이스와는 다릅니다. 간단한 액션 실행입니다.
-   `<finally>`: 조인포인트가 성공 또는 실패 여부에 관계없이 완료된 **후**에 액션을 실행합니다. 리소스 정리에 가장 이상적인 위치입니다.
    -   **`<thrown>`을 이용한 조건부 로직**: `<finally>` 블록은 `<thrown>` 자식 요소를 포함할 수 있습니다. 이 중첩된 `<thrown>` 내부의 액션은 조인포인트가 예외를 던진 경우에만 실행됩니다. 이는 성공 시 커밋하지만 실패 시 롤백해야 하는 트랜잭션 관리와 같은 시나리오에 완벽합니다.

다음 섹션의 선언적 트랜잭션 예제는 이를 완벽하게 보여줍니다.
```xml
<advice bean="sqlSessionTxAdvice">
    <before>
        <invoke method="open"/>
    </before>
    <after>
        <invoke method="commit"/>
    </after>
    <finally>
        <thrown>
            <!-- 예외가 발생한 경우에만 실행됩니다 -->
            <invoke method="rollback"/>
        </thrown>
        <!-- 조인포인트가 끝난 후 항상 실행됩니다 -->
        <invoke method="close"/>
    </finally>
</advice>
```

### 3.3. 성능: `@Advisable` 어노테이션

**빈 메소드 레벨 AOP**의 경우, Aspectran은 중요한 성능 최적화 기능을 포함합니다. AOP 프록시는 명시적으로 어드바이스 대상으로 표시된 메소드만 가로챕니다. 메소드를 대상으로 표시하려면 `@com.aspectran.core.component.bean.annotation.Advisable` 어노테이션을 추가해야 합니다.

-   **필요한 이유**: 메소드에 어노테이션이 없으면 프록시는 모든 AOP 관련 처리(포인트컷 규칙 확인 등)를 건너뛰고 원본 메소드를 직접 호출합니다. 이는 어드바이스가 필요 없는 대다수의 메소드 호출에서 프록시 오버헤드를 제거하여 성능을 크게 향상시킵니다.
-   **필요 없는 경우**: 이 어노테이션은 **오직** 빈 메소드 조인포인트에만 해당됩니다. **액티비티 레벨 AOP**(포인트컷이 트랜슬릿 이름을 대상으로 하는 경우)의 경우, 어드바이스가 메소드 프록시가 아닌 액티비티의 생명주기에 의해 트리거되므로 이 어노테이션이 필요하지 않습니다.

```java
import com.aspectran.core.component.bean.annotation.Advisable;

public class MyService {
    @Advisable
    public void doTransactionalWork() {
        // 이 메소드는 애스펙트에 의해 어드바이스를 받을 수 있습니다.
    }

    public void doSimpleWork() {
        // 이 메소드는 포인트컷과 일치하더라도 어드바이스를 받지 않습니다.
    }
}
```

### 3.4. 애스펙트에서 예외 처리 (`<exception>`)

주요 어드바이스 로직 외에도, `<aspect>`는 전용 예외 처리 어드바이스를 정의하기 위해 `<exception>` 블록을 포함할 수 있습니다. 이는 로깅이나 예외 변환과 같은 횡단 관심사의 오류 처리를 메인 어드바이스 빈을 복잡하게 만들지 않고 깔끔하게 관리하는 방법을 제공합니다.

`<exception>` 블록은 특정 예외 `type`을 잡도록 구성된 하나 이상의 `<thrown>` 요소를 포함합니다.

```xml
<aspect id="serviceLayerExceptionAspect">
    <joinpoint>
        pointcut: {
            +: **@*Service^**
        }
    </joinpoint>
    <advice bean="loggingAdviceBean"/> <!-- 다른 어드바이스를 가질 수 있음 -->
    <exception>
        <description>모든 서비스 메소드에서 발생하는 DataAccessExceptions를 잡아 사용자 친화적인 오류로 변환합니다.</description>
        <thrown type="com.example.app.exceptions.DataAccessLayerException">
            <!-- 표준 오류 페이지나 JSON 응답을 렌더링하는 트랜슬릿으로 포워드합니다. -->
            <forward translet="/error/databaseError"/>
        </thrown>
        <thrown> <!-- 다른 모든 예외를 잡습니다. -->
            <invoke bean="errorLoggingService" method="logGenericError"/>
        </thrown>
    </exception>
</aspect>
```
이 예제에서:
-   서비스 메소드가 `DataAccessLayerException`을 발생시키면, 요청은 `/error/databaseError` 트랜슬릿으로 포워드됩니다.
-   다른 예외가 발생하면, `errorLoggingService` 빈의 `logGenericError` 메소드가 호출됩니다.

### 3.5. AOP 예제

**예제 1: 액티비티 레벨 요청 로깅**

이 애스펙트는 `/api/` 아래의 모든 트랜슬릿에 대한 요청을 로깅합니다. `@Advisable` 어노테이션은 필요하지 않습니다.

*1단계: 어드바이스 빈*
```java
package com.example.app.aop;

import com.aspectran.core.activity.Activity;
import com.aspectran.core.util.logging.Logger;
import com.aspectran.core.util.logging.LoggerFactory;

public class RequestLoggingAdvice {

    private static final Logger logger = LoggerFactory.getLogger(RequestLoggingAdvice.class);

    public void startLog(Activity activity) {
        logger.info(">> Request received for: " + activity.getTransletName());
    }

    public void endLog(Activity activity) {
        logger.info("<< Request finished for: " + activity.getTransletName());
    }
}
```

*2단계: XML 설정*
```xml
<bean id="requestLoggingAdvice" class="com.example.app.aop.RequestLoggingAdvice"/>

<aspect id="apiRequestLoggingAspect">
    <joinpoint>
        pointcut: {
            +: /api/**
        }
    </joinpoint>
    <advice bean="requestLoggingAdvice">
        <before>
            <invoke method="startLog"/>
        </before>
        <finally>
            <invoke method="endLog"/>
        </finally>
    </advice>
</aspect>
```

**예제 2: 빈 레벨 선언적 트랜잭션**

이 애스펙트는 `orderService`의 메소드에 트랜잭션 로직을 적용합니다. `OrderService` 내의 대상 메소드들은 반드시 `@Advisable`로 어노테이션되어야 합니다.

*1단계: 서비스 메소드를 어드바이스 가능으로 표시*
```java
// com.example.app.services.OrderService
import com.aspectran.core.component.bean.annotation.Advisable;

public class OrderService {
    @Advisable
    public void createOrder(Order order) {
        // ... 비즈니스 로직 ...
    }
}
```

*2단계: XML 설정*
```xml
<!-- 1. 트랜잭션 로직을 위한 어드바이스 빈 -->
<bean id="sqlSessionTxAdvice" class="com.aspectran.mybatis.SqlSessionAdvice" scope="prototype">
    <argument>#{sqlSessionFactory}</argument>
</bean>

<!-- 2. 서비스 빈 -->
<bean id="orderService" class="com.example.app.services.OrderService"/>

<!-- 3. 트랜잭션을 적용할 애스펙트 -->
<aspect id="orderServiceTxAspect">
    <joinpoint>
        pointcut: {
            +: **@orderService^create*
        }
    </joinpoint>
    <advice bean="sqlSessionTxAdvice">
        <before>
            <invoke method="open"/>
        </before>
        <after>
            <invoke method="commit"/>
        </after>
        <finally>
            <thrown>
                <invoke method="rollback"/>
            </thrown>
            <invoke method="close"/>
        </finally>
    </advice>
</aspect>
```

## 4. 빈(`<bean>`) 관련 요소

**빈(Bean)**은 Aspectran의 핵심적인 구성 요소입니다. 빈은 Aspectran IoC(제어의 역전) 컨테이너가 인스턴스화하고, 조립하며, 관리하는 객체입니다. 이러한 빈과 그 의존성은 XML 설정 파일에 정의됩니다.

#### `<bean>` 속성 상세

-   `id`: 빈을 식별하는 고유한 이름입니다. 이 ID는 `#{beanId}`와 같은 표현식을 사용하여 설정의 다른 부분에서 빈을 참조하는 데 사용됩니다.
-   `class`: 인스턴스화할 빈의 정규화된 클래스 이름(또는 정의된 `<typeAlias>`)입니다. `scan` 속성과 함께 사용할 수 없습니다.
-   `scan`: 하나 이상의 기본 패키지를 스캔하여 클래스를 자동으로 빈으로 등록합니다. 모든 빈을 명시적으로 XML에 정의할 필요를 줄여주는 강력한 컴포넌트 스캔 기능입니다. Ant 스타일의 와일드카드(`*`, `**`)를 사용할 수 있습니다.
-   `mask`: `scan` 속성과 함께 사용됩니다. 스캔된 클래스의 정규화된 클래스 이름으로부터 빈 ID를 동적으로 생성하기 위한 패턴을 정의합니다. `mask`의 `*`는 `scan` 속성의 와일드카드와 일치하는 클래스 이름의 일부로 대체됩니다.
-   `scope`: 빈의 생명주기 범위를 지정합니다. 기본값은 `singleton`입니다.
    -   `singleton`: 컨테이너당 빈의 인스턴스가 하나만 생성됩니다. 기본 스코프입니다.
    -   `prototype`: 빈이 요청될 때마다 새로운 인스턴스가 생성됩니다.
    -   `request`: 각 요청마다 새로운 인스턴스가 생성됩니다. (웹 또는 유사한 요청 기반 환경에만 적용 가능).
    -   `session`: 각 사용자 세션마다 새로운 인스턴스가 생성됩니다. (웹 또는 유사한 세션 기반 환경에만 적용 가능).
-   `factoryBean`: 현재 빈의 인스턴스를 생성하는 데 사용할 팩토리 빈의 ID입니다. 컨테이너는 이 팩토리 빈의 `factoryMethod`를 호출합니다.
-   `factoryMethod`: 빈 인스턴스를 생성하기 위해 호출할 메소드의 이름입니다. `factoryBean`이 지정되지 않은 경우 정적 메소드일 수 있으며, `factoryBean`이 지정된 경우 인스턴스 메소드일 수 있습니다.
-   `initMethod`: 빈 인스턴스가 생성되고 모든 속성이 설정된 직후에 호출될 메소드를 지정합니다. 사용자 정의 초기화 로직에 유용합니다.
-   `destroyMethod`: 빈이 컨테이너에서 제거될 때(예: 컨테이너가 종료될 때) 호출될 메소드를 지정합니다. 리소스를 해제하는 데 유용합니다.
-   `lazyInit`: `true`인 경우, 빈은 애플리케이션 시작 시점이 아니라 처음 요청될 때 생성됩니다. `singleton` 빈에만 적용됩니다. 기본값은 `false`입니다.
-   `important`: `true`인 경우, 동일한 타입의 여러 빈이 존재할 때 의존성 주입을 위한 기본 후보로 표시됩니다. 기본값은 `false`입니다.

### 4.1. 간단한 빈 정의하기

가장 기본적인 빈 정의 방법입니다. Aspectran 컨테이너는 `class` 속성을 사용하여 기본 생성자로 객체를 인스턴스화합니다.

```xml
<bean id="myService" class="com.example.app.MyServiceImpl"/>
```

### 4.2. 의존성 주입 (Dependency Injection)

Aspectran은 생성자 주입과 수정자 주입 두 가지 주요 의존성 주입 유형을 지원합니다.

#### `<argument>`를 이용한 생성자 주입

`<arguments>` 또는 `<argument>` 요소를 사용하여 빈의 생성자에 인자를 제공할 수 있습니다.

```xml
<bean id="myService" class="com.example.app.MyServiceImpl">
    <arguments>
        <item value="Hello, Aspectran!"/>
        <item value="#{someOtherBean}"/>
    </arguments>
</bean>
```
위 예시는 `MyServiceImpl` 클래스에 `public MyServiceImpl(String message, SomeOtherBean otherBean)`과 같은 생성자가 있다고 가정합니다.

#### `<property>`를 이용한 수정자 주입

`<properties>` 또는 `<property>` 요소를 사용하여 빈의 속성(수정자 메소드를 통해)에 값을 주입할 수 있습니다.

```xml
<bean id="dataSource" class="com.example.app.SimpleDataSource">
    <property name="driver" value="com.mysql.cj.jdbc.Driver"/>
    <property name="url" value="jdbc:mysql://localhost:3306/mydb"/>
    <properties profile="dev">
        <item name="username" value="sa"/>
        <item name="password" value=""/>
    </properties>
    <properties profile="prod">
        <item name="username" value="sa"/>
        <item name="password" value="secret"/>
    </properties>
</bean>
```
이는 `SimpleDataSource` 클래스에 `setDriver(String)`, `setUrl(String)` 등과 같은 메소드가 있다고 가정합니다.

### 4.3. `<bean scan="...">`을 이용한 컴포넌트 스캔

각 빈을 XML에 개별적으로 정의하는 대신, 지정된 패키지를 스캔하여 Aspectran이 자동으로 빈을 찾아 등록하도록 할 수 있습니다. 이 기능은 특히 대규모 애플리케이션에서 설정을 간소화합니다.

```xml
<!-- com.example.app.services와 그 하위 패키지 아래의 모든 클래스를 스캔합니다. -->
<bean scan="com.example.app.services.**"/>
```
위와 같이 설정하면, Aspectran은 주어진 패키지(`**` 덕분에 하위 패키지 포함)를 스캔하고 발견된 클래스들을 빈으로 등록합니다. 기본적으로 빈 ID는 정규화되지 않은 클래스 이름으로부터 생성됩니다(예: `UserService`는 `userService`가 됨).

스캔된 빈에 예측 가능한 ID를 부여하기 위해 `mask` 속성을 사용할 수 있습니다. 예를 들어, `com.example.app.services.UserService`를 스캔하고 빈 ID를 `userService`로 지정하고 싶을 때:

```xml
<!--
  'com.example.app.services.UserService'와 같은 클래스를 스캔하고
  'userService'라는 ID로 등록합니다.
-->
<bean scan="com.example.app.services.*Service" mask="*Service"/>
```
`mask`에서 `*`는 `scan` 패턴의 `*`와 일치하는 클래스 이름 부분을 위한 플레이스홀더 역할을 합니다. `*Service`는 카멜 케이스(camel-case) 빈 ID로 변환되므로, `UserService`는 `userService`가 됩니다.

### 4.4. 팩토리 메소드 사용하기

#### 정적 팩토리 메소드

다른 클래스의 정적 메소드를 호출하여 빈을 생성해야 하는 경우입니다.

```xml
<bean id="calendar" class="java.util.Calendar" factoryMethod="getInstance"/>
```

#### 인스턴스 팩토리 메소드

다른 빈(팩토리 빈)의 메소드를 호출하여 빈을 생성해야 하는 경우입니다.

```xml
<bean id="connectionFactory" class="com.example.app.ConnectionFactory"/>

<bean id="databaseConnection"
      factoryBean="connectionFactory"
      factoryMethod="createConnection"/>
```

### 4.5. 빈 생명주기: `initMethod`와 `destroyMethod`

빈의 생명주기 특정 시점에 호출될 메소드를 지정할 수 있습니다.

```xml
<bean id="resourceManager" class="com.example.app.ResourceManager"
      initMethod="initialize"
      destroyMethod="cleanup">
    <property name="resourcePath" value="/data/my-resource.dat"/>
</bean>
```
`resourceManager`가 생성될 때, `resourcePath` 속성이 설정된 후 `initialize()`가 호출됩니다. 애플리케이션이 종료될 때 `cleanup()`이 호출됩니다.

### 4.6. 컴포넌트 스캔을 위한 `<filter>`

`<bean scan="...">`을 사용할 때, `<filter>`를 사용하여 패턴에 따라 특정 클래스를 포함하거나 제외할 수 있습니다. 필터는 APON 형식으로 작성됩니다.

```xml
<bean scan="com.example.app.**">
    <filter>
        exclude: [
            *.*Repository
        ]
    </filter>
</bean>
```
이 예제는 `com.example.app` 패키지와 모든 하위 패키지를 스캔하지만, 이름이 `Repository`로 끝나는 모든 클래스를 제외합니다.

## 5. 트랜슬릿(`<translet>`) 관련 요소

**트랜슬릿(Translet)**은 요청을 처리하고 응답을 생성하는 방법을 정의하는 Aspectran의 핵심 작업 단위입니다. 트랜슬릿은 요청 이름(웹 애플리케이션에서는 주로 URL)을 일련의 액션 및 뷰와 매핑합니다.

#### `<translet>` 속성 상세

-   `name` (필수): 트랜슬릿을 식별하는 고유한 이름입니다. 웹 환경에서는 일반적으로 URL 경로가 사용됩니다. Ant 스타일의 와일드카드(`*`, `**`)를 사용하여 여러 URL을 단일 트랜슬릿에 매핑할 수 있습니다.
-   `scan`: 지정된 디렉터리의 파일(예: JSP, HTML 파일)을 스캔하여 트랜슬릿을 자동으로 생성합니다. 명시적인 정의 없이 간단한 뷰 기반 트랜슬릿을 만드는 데 유용합니다.
-   `mask`: `scan`과 함께 사용됩니다. 스캔된 파일 경로의 일부를 추출하여 트랜슬릿 이름으로 사용합니다.
-   `method`: 허용되는 요청 메소드를 지정합니다. 웹 컨텍스트에서는 `GET`, `POST`, `PUT`, `DELETE`와 같은 HTTP 메소드에 해당합니다. 쉼표로 구분하여 여러 메소드를 나열할 수 있습니다. 지원되지 않는 메소드로 요청이 들어오면 `405 Method Not Allowed` 오류가 반환됩니다.
-   `async`: `true`이면 트랜슬릿이 비동기적으로 처리되고 요청 처리 스레드는 즉시 해제됩니다. 장기 실행 작업에 유용합니다. 기본값은 `false`입니다.
-   `timeout`: 비동기 처리 시 타임아웃 시간을 밀리초(ms) 단위로 지정합니다.

### 5.1. `<request>`

들어오는 요청에 대한 규칙과 매개변수를 정의합니다.

#### `<request>` 속성 상세

-   `method`: `<translet>`의 `method` 속성과 동일합니다. 여기에 정의하면 가독성이 향상될 수 있습니다.
-   `encoding`: 요청 매개변수의 문자 인코딩을 지정합니다.

트랜슬릿에 필요한 매개변수를 정의할 수도 있습니다. 필수 매개변수가 누락된 경우 Aspectran은 자동으로 `400 Bad Request` 오류를 반환합니다.

```xml
<translet name="/users/view" method="GET">
    <request>
        <!-- 이 트랜슬릿에는 'userId' 매개변수가 필수입니다. -->
        <parameter name="userId" mandatory="true"/>
    </request>
    ...
</translet>
```

### 5.2. 콘텐츠 섹션: 액션과 흐름 제어

트랜슬릿의 "콘텐츠" 섹션(`<content>`로 표현되거나 자식 요소로 암시됨)은 수행할 작업을 정의합니다.

-   **`<action>`**: 빈의 메소드를 실행하고 선택적으로 결과를 속성에 저장합니다.
    -   `id`: 액션 결과 속성의 이름입니다.
    -   `bean`: 실행할 빈의 ID입니다.
    -   `method`: 호출할 메소드의 이름입니다.
    -   `singleton`: `false`이면 동일한 `id`를 가진 속성이 이미 존재하는 경우 액션이 실행되지 않습니다. 기본값은 `true`입니다.

    ```xml
    <!-- 'userService' 빈에서 'getUser' 메소드 호출 -->
    <!-- 반환 값은 'user'라는 이름의 속성에 저장됩니다. -->
    <action id="user" bean="userService" method="getUser">
        <!-- 'userId' 요청 매개변수를 메소드에 전달 -->
        <argument value="@{userId}"/>
    </action>
    ```

-   **`<include>`**: 다른 트랜슬릿의 내용을 포함합니다. 공통 로직을 재사용하는 데 유용합니다.
    -   `translet` (필수): 포함할 트랜슬릿의 이름입니다.

    ```xml
    <translet name="/api/orders/detail">
        <!-- 먼저 공통 인증 확인 실행 -->
        <include translet="/common/authenticate"/>
        <!-- 그런 다음 주 로직 수행 -->
        <action id="order" bean="orderService" method="getOrderDetails"/>
        <transform format="json"/>
    </translet>
    ```

-   **`<choose>`, `<when>`, `<otherwise>`**: switch 문과 유사하게 조건부 로직을 구현합니다.

    ```xml
    <choose>
        <when test="!@{user.isAdmin}">
            <!-- 사용자가 관리자가 아니면 오류 트랜슬릿으로 포워드 -->
            <forward translet="/error/unauthorized"/>
        </when>
        <otherwise>
            <!-- 그렇지 않으면 민감한 데이터를 가져오기 위해 진행 -->
            <action id="adminData" bean="adminService" method="getDashboardData"/>
        </otherwise>
    </choose>
    ```

-   **`<headers>`**: HTTP 응답 헤더를 설정합니다.

    ```xml
    <headers>
        <item name="Cache-Control" value="no-cache, no-store, must-revalidate"/>
        <item name="Pragma" value="no-cache"/>
    </headers>
    ```

-   **`<echo>`**: 속성 값을 응답 본문에 직접 씁니다.

    ```xml
    <!-- 인사말 메시지 가져오기 -->
    <action id="greeting" bean="greetingService" method="getGreeting"/>
    <!-- 메시지를 직접 출력 -->
    <echo>
        <item value="@{greeting}"/>
    </echo>
    ```

### 5.3. 응답 섹션: 뷰와 리다이렉션

트랜슬릿의 "응답" 섹션(`<response>`으로 표현되거나 자식 요소로 암시됨)은 결과를 클라이언트에게 어떻게 제시할지 결정합니다.

-   **`<transform>`**: 액션의 결과(또는 다른 속성)를 JSON이나 XML과 같은 특정 형식으로 변환합니다. 이는 REST API를 구축하는 주요 방법입니다.
    -   `id`: 변환에 사용할 템플릿의 ID입니다.
    -   `format`: 출력 형식(예: `json`, `xml`, `text`).
    -   `engine`: 사용할 템플릿 엔진 빈입니다.
    -   `contentType`: 응답의 `Content-Type`입니다.
    -   `pretty`: `true`이면 가독성을 위해 출력을 형식화합니다(예: 들여쓰기된 JSON).

    ```xml
    <translet name="/api/users/${userId}" method="GET">
        <action id="user" bean="userService" method="getUser" />
        <!-- 'user' 속성을 예쁘게 형식화된 JSON 응답으로 변환 -->
        <transform format="json" pretty="true"/>
    </translet>
    ```

-   **`<dispatch>`**: 렌더링을 위해 요청을 뷰 기술(JSP, Thymeleaf, Pebble 등)로 전달합니다. 그러면 뷰는 `<action>`에 의해 설정된 속성에 접근할 수 있습니다.
    -   `name`: 렌더링할 뷰 템플릿의 이름입니다.
    -   `contentType`: 응답의 `Content-Type`입니다.

    ```xml
    <translet name="/users/profile" method="GET">
        <action id="user" bean="userService" method="getCurrentUser"/>
        <!-- 뷰 렌더링을 위해 'profile.jsp'로 디스패치 -->
        <dispatch name="profile.jsp"/>
    </translet>
    ```

-   **`<forward>`**: 요청을 내부적으로 다른 트랜슬릿으로 전달합니다. 클라이언트의 URL은 변경되지 않습니다.
    -   `translet` (필수): 대상 트랜슬릿의 이름입니다.

    ```xml
    <translet name="/legacy/user/info">
        <!-- 이것은 이전 URL입니다. 새 URL로 전달합니다. -->
        <forward translet="/api/users/info"/>
    </translet>
    ```

-   **`<redirect>`**: 클라이언트에게 새 경로로 재요청하도록 리다이렉트 응답을 보냅니다.
    - `path` (필수): 리다이렉트할 경로입니다.

    ```xml
    <translet name="/login/process" method="POST">
        <action bean="authService" method="login"/>
        <!-- 성공적인 로그인 후 사용자의 대시보드로 리다이렉트 -->
        <redirect path="/dashboard"/>
    </translet>
    ```

### 5.4. `<translet scan>`을 이용한 자동 트랜슬릿 생성

단순한 뷰 기반 페이지가 많은 애플리케이션의 경우, 각 페이지에 대해 `<translet>`을 정의하는 것은 반복적인 작업이 될 수 있습니다. Aspectran은 뷰 파일(JSP, Thymeleaf, Pebble 등)이 있는 디렉터리를 스캔하여 자동으로 트랜슬릿을 생성하는 강력한 `scan` 기능을 제공합니다.

-   `scan`: 파일을 찾을 기본 디렉터리와 패턴(Ant 스타일 와일드카드 사용)을 지정합니다.
-   `mask`: 스캔한 파일 경로의 일부를 추출하여 트랜슬릿의 `name`으로 사용하기 위한 패턴을 정의합니다. `mask`의 와일드카드와 일치하는 경로 부분이 캡처됩니다.

**예제: 뷰 파일 스캔하기**

`webapp/WEB-INF/views` 디렉터리에 다음과 같은 구조가 있다고 가정해 보겠습니다.
```
/WEB-INF/views/
├── user/
│   ├── profile.jsp
│   └── list.jsp
└── index.jsp
```

단일 정의로 모든 `.jsp` 파일에 대한 트랜슬릿을 생성할 수 있습니다.
```xml
<!--
  이 설정은 세 개의 트랜슬릿을 생성합니다:
  - name="/user/profile" -> dispatches to /WEB-INF/views/user/profile.jsp
  - name="/user/list"    -> dispatches to /WEB-INF/views/user/list.jsp
  - name="/index"        -> dispatches to /WEB-INF/views/index.jsp
-->
<translet name="/*" scan="/WEB-INF/views/**/*.jsp" mask="/WEB-INF/views/**/*.jsp">
    <description>
        /WEB-INF/views/ 디렉터리 아래의 모든 JSP 파일에 대한 트랜슬릿을 자동으로 생성합니다.
        트랜슬릿 이름은 파일 경로에서 파생되며, 디스패치 경로는 와일드카드 패턴을 사용하여 구성됩니다.
    </description>
    <dispatch name="/"/>
</translet>
```

**동작 방식:**
1.  `scan` 속성은 `/WEB-INF/views` 아래에서 `.jsp`로 끝나는 모든 파일을 찾습니다.
2.  `/WEB-INF/views/user/profile.jsp`와 같은 파일에 대해 `mask` `/WEB-INF/views/**/*.jsp`가 적용됩니다. `mask` 패턴의 리터럴 부분(`"/WEB-INF/views/"`, `".jsp"`)을 제외하고 와일드카드 `**`에 해당하는 `"user/profile"`이 캡처됩니다.
3.  이 캡처된 값(`"user/profile"`)은 트랜슬릿의 기본 `name`이 됩니다. (일반적으로 전역 설정인 `transletNamePrefix`에 따라 최종적으로 `"/user/profile"`과 같이 선행 슬래시가 추가될 수 있습니다.)

## 6. 스케줄(`<schedule>`) 관련 요소

미리 정의된 스케줄에 따라 주기적으로 또는 특정 시간에 작업을 실행하는 **스케줄 규칙**을 정의합니다. 스케줄 규칙은 **하나의 실행 주기(트리거)를 공유하는 잡(Job)들의 그룹**을 의미하며, Aspectran은 Quartz 스케줄러를 기반으로 강력한 스케줄링 프레임워크를 내장하고 있습니다.

#### `<schedule>` 속성 상세

-   `id`: 스케줄 규칙을 식별하는 고유 ID입니다.

### 6.1. `<scheduler>` 및 `<trigger>`

`<scheduler>` 요소는 이 스케줄 규칙을 처리할 스케줄러 빈을 지정하고, 잡(Job) 그룹이 실행될 시점을 정교하게 제어하는 `<trigger>`를 정의합니다.

#### `<scheduler>` 속성 상세

-   `bean`: 이 스케줄 규칙을 처리할 스케줄러 빈의 ID를 지정합니다. 만약 지정하지 않으면 `<settings>`에 정의된 `defaultSchedulerBean`이 사용됩니다.

#### `<trigger>` 속성 상세

-   `type` (필수): 트리거 타입을 지정합니다. `simple`과 `cron` 두 가지를 지원합니다.
-   트리거의 세부 속성은 APON 형식을 사용하여 `<trigger>` 요소의 본문에 직접 작성합니다.

#### `simple` 트리거

단순한 간격으로 작업을 반복할 때 사용합니다. 예를 들어 "지금부터 10초 후에 시작해서, 1시간마다, 총 5번 실행"과 같은 시나리오에 적합합니다.

-   **주요 속성:**
    -   `startDelaySeconds`: 스케줄러가 시작된 후, 첫 실행을 지연할 시간 (초 단위)
    -   `intervalInSeconds`, `intervalInMinutes`, `intervalInHours`: 반복할 시간 간격
    -   `repeatCount`: 첫 실행 후 추가로 반복할 횟수 (`-1`은 무한 반복)
    -   `repeatForever`: `true`로 설정 시 무한 반복

-   **예제 (XML):** 1시간마다 무한히 반복
    ```xml
    <schedule id="my-simple-schedule">
        <scheduler bean="mainScheduler">
            <trigger type="simple">
                startDelaySeconds: 10
                intervalInHours: 1
                repeatForever: true
            </trigger>
        </scheduler>
        <job translet="/batch/simple-task"/>
    </schedule>
    ```

#### `cron` 트리거

달력과 연관된 복잡한 시간표에 따라 작업을 실행할 때 사용합니다. "매주 금요일 오후 5시 30분" 또는 "매달 마지막 날 새벽 1시"와 같은 스케줄링에 사용됩니다.

-   **주요 속성:**
    -   `expression`: 실행 시간표를 정의하는 Cron 표현식 문자열입니다.

-   **예제 (XML):** 매일 밤 11시 50분에 실행
    ```xml
    <schedule id="my-cron-schedule">
        <scheduler bean="mainScheduler">
            <trigger type="cron">
                expression: 0 50 23 * * ?
            </trigger>
        </scheduler>
        <job translet="/batch/daily-report"/>
    </schedule>
    ```

### 6.2. `<job>`

스케줄러가 실행할 실제 작업, 즉 트랜슬릿을 지정합니다. 하나의 `<schedule>` 규칙 내에 여러 개의 `<job>`을 정의하여 동일한 주기로 여러 작업을 실행할 수 있습니다.

#### `<job>` 속성 상세

-   `translet` (필수): 실행할 트랜슬릿의 이름을 지정합니다.
-   `disabled`: `true`로 설정하면, 해당 작업을 비활성화합니다. 기본값은 `false`입니다.

### 6.3. 전체 설정 예제

다음은 스케줄러 빈을 정의하고, 이를 사용하여 매일 특정 시간에 두 개의 배치(Batch) 트랜슬릿을 실행하는 전체 예제입니다.

```xml
<!-- 1. Quartz 기반 스케줄러 빈 정의 -->
<bean id="mainScheduler" class="com.aspectran.core.scheduler.support.QuartzSchedulerFactoryBean">
    <property type="properties" name="quartzProperties">
        <entry name="org.quartz.scheduler.instanceName">MainScheduler</entry>
        <entry name="org.quartz.threadPool.threadCount">10</entry>
    </property>
</bean>

<!-- 2. 스케줄 규칙 정의 -->
<schedule id="daily-batch">
    <description>매일 자정에 일일 리포트 생성과 로그 아카이빙을 수행합니다.</description>

    <!-- 실행 주기: 매일 자정 -->
    <scheduler bean="mainScheduler">
        <trigger type="cron">
            expression: 0 0 0 * * ?
        </trigger>
    </scheduler>

    <!-- 실행할 작업 목록 -->
    <job translet="/batch/daily-report-generator"/>
    <job translet="/batch/log-archiver"/>
</schedule>
```
위 설정에서 `daily-batch` 스케줄은 `mainScheduler`에 의해 관리되며, Cron 표현식에 따라 매일 자정이 되면 `/batch/daily-report-generator`와 `/batch/log-archiver` 두 개의 트랜슬릿을 순차적으로 실행합니다.

## 7. 템플릿(`<template>`) 관련 요소

최상위 레벨에서 재사용 가능한 템플릿을 정의합니다. 정의된 템플릿은 `~{templateId}` 토큰을 사용하여 애플리케이션의 어느 곳에서나 참조하고 렌더링할 수 있습니다.

#### `<template>` 속성 상세

-   `id`: 템플릿을 식별하는 고유 ID입니다.
-   `engine`: 사용할 템플릿 엔진 빈의 ID를 지정합니다.
    -   생략하거나 `token`(기본값)으로 설정하면, Aspectran의 내장 토큰 엔진을 사용하여 `${...}` 및 `@{...}` 토큰을 파싱합니다.
    -   `none`으로 설정하면, 내용을 원시 텍스트(Raw Text)로 취급합니다.
    -   그 외의 경우, 외부 템플릿 엔진 빈(예: FreeMarker, Pebble)의 ID를 지정합니다.
-   `name`: 템플릿의 이름 또는 경로를 지정합니다.
-   `file`: 파일 시스템 경로를 기준으로 템플릿 파일을 지정합니다.
-   `resource`: 클래스패스 경로를 기준으로 템플릿 리소스를 지정합니다.
-   `url`: URL을 통해 원격 템플릿을 지정합니다.
-   `style`: APON 형식의 템플릿을 사용할 경우 스타일을 지정합니다. (`apon`, `compact`, `compressed`)
    -   `apon`: 파이프(`|`) 문자를 사용하여 들여쓰기와 줄 바꿈을 보존합니다.
    -   `compact`: JSON이나 XML에서 불필요한 공백을 제거합니다.
    -   `compressed`: 크기를 최소화하기 위해 필수적이지 않은 모든 공백을 제거합니다.
-   `contentType`: 템플릿 결과물의 `Content-Type`을 지정합니다.
-   `encoding`: 템플릿 파일의 문자 인코딩을 지정합니다.
-   `noCache`: `true`로 설정하면, 템플릿을 캐시하지 않습니다. 기본값은 `false`입니다.

### 7.1. 예제: 재사용 가능한 토큰 템플릿 정의

이 예제는 가독성을 위해 `apon` 스타일을 사용하고 동적인 값 처리를 위해 토큰 표현식을 사용하는 간단한 텍스트 템플릿을 정의합니다.

```xml
<!-- 최상위 레벨에서 재사용 가능한 템플릿 정의 -->
<template id="welcomeMailTemplate" style="apon">
    |안녕하세요, @{user^name}님.
    |
    |Aspectran에 오신 것을 환영합니다!
    |현재 보유 포인트는 #{pointService^points}점 입니다.
    |
    |감사합니다.
    |Aspectran 팀 드림
</template>
```

### 7.2. 예제: 트랜슬릿에서 템플릿 사용

`~{templateId}` 토큰을 사용하여 `<transform>` 액션 내에서 정의된 템플릿을 렌더링할 수 있습니다.

```xml
<translet name="/mail/welcome">
    <action id="user" bean="userService" method="getUser"/>
    <transform format="text">
        <template>~{welcomeMailTemplate}</template>
    </transform>
</translet>
```
이 예제에서 `/mail/welcome`이 요청되면 `welcomeMailTemplate`이 렌더링됩니다. 템플릿 내부의 `@{user^name}` 및 `#{pointService^points}` 토큰이 평가되고, 결과 텍스트가 응답으로 반환됩니다.

## 8. 예외 처리 (`<exception>`)

Aspectran은 오류가 발생할 수 있는 컨텍스트 내에서 핸들러를 선언적으로 정의하여 예외를 처리하는 분산된 방법을 제공합니다. 이는 `<translet>` 또는 `<aspect>` 내부에 정의할 수 있는 `<exception>` 요소를 사용하여 수행됩니다. 단일 최상위 전역 예외 핸들러 블록은 없으며, 대신 핸들러는 보호하는 규칙과 함께 배치됩니다.

### 8.1. 트랜슬릿에서 예외 처리

`<translet>` 내부에 직접 `<exception>` 블록을 정의하여 실행 중에 발생하는 예외를 처리할 수 있습니다. 이는 API 엔드포인트에 대한 사용자 정의 JSON 오류 메시지를 반환하는 것과 같이 트랜슬릿별 오류 응답에 유용합니다.

`<exception>` 블록에는 특정 예외 유형을 포착하도록 구성된 하나 이상의 `<thrown>` 요소가 포함됩니다.

-   **`<thrown>`**: 하나 이상의 예외 유형에 대한 핸들러를 정의합니다.
    -   `type` (선택 사항): 쉼표로 구분된 정규화된 예외 클래스 이름 목록입니다.
    -   `type`이 생략되면 `<thrown>` 블록은 동일한 `<exception>` 블록의 다른 특정 핸들러에 의해 포착되지 않은 모든 예외에 대한 기본 핸들러 역할을 합니다.

`<thrown>` 블록 내부에서는 `<transform>`, `<dispatch>` 또는 `<forward>`와 같은 요소를 사용하여 응답을 정의할 수 있습니다.

**예제: 트랜슬릿에서의 API 예외 처리**

```xml
<translet name="/api/users/${userId}">
    <action id="user" bean="userService" method="getUserById"/>
    <transform format="json"/>

    <!-- 이 트랜슬릿에 특정한 예외 처리 -->
    <exception>
        <thrown type="com.example.app.exceptions.UserNotFoundException">
            <!-- 일반적인 404 응답 트랜슬릿으로 포워드 -->
            <forward translet="/error/404"/>
        </thrown>
        <thrown type="java.lang.IllegalArgumentException">
            <transform format="json">
                <template>
                    { "error": "Invalid Argument", "message": "사용자 ID는 숫자여야 합니다." }
                </template>
            </transform>
        </thrown>
    </exception>
</translet>
```

### 8.2. 애스펙트에서 예외 처리

예외 처리는 `<aspect>` 내에서도 정의할 수 있습니다. 이를 통해 로깅이나 보안과 같은 횡단 관심사에 강력한 도구가 되는, 여러 조인포인트(트랜슬릿 또는 빈 메소드)에 적용되는 예외 처리 로직을 중앙에서 관리할 수 있습니다.

**예제: 중앙 집중식 서비스 레이어 예외 로깅**

```xml
<aspect id="serviceLayerExceptionLogger">
    <joinpoint>
        pointcut: {
            +: **@*Service^**
        }
    </joinpoint>
    <exception>
        <description>서비스 레이어의 모든 예외를 포착하여 로깅합니다.</description>
        <thrown>
            <action bean="exceptionLoggingAdvice" method="logException"/>
        </thrown>
    </exception>
</aspect>

<bean id="exceptionLoggingAdvice" class="com.example.app.aop.ExceptionLoggingAdvice"/>
```
이 예제에서 ID가 "Service"로 끝나는 빈의 메소드에서 발생하는 모든 예외는 포착됩니다. 그런 다음 애스펙트는 `exceptionLoggingAdvice` 빈의 `logException` 메소드를 호출하여 오류를 로깅하지만, 예외 전파를 중단시키지는 않습니다(어드바이스 자체가 다른 트랜슬릿으로 포워드하지 않는 한).
