---
format: plate solid article
sidebar: toc-left
title: "Environment: 프로필과 속성을 이용한 환경 제어"
headline: Architecture Details
teaser:
---
#

`com.aspectran.core.context.env` 패키지는 Aspectran 애플리케이션의 실행 환경을 관리하는 핵심적인 역할을 합니다. 주로 **프로필(Profiles)**과 **속성(Properties)**이라는 두 가지 개념을 통해, 동일한 애플리케이션 코드를 다양한 환경(개발, 테스트, 운영 등)에 맞게 유연하게 설정하고 배포할 수 있도록 지원합니다.

## 1. 주요 클래스 및 역할

-   **`Environment` (인터페이스)**
    -   애플리케이션 환경에 접근하는 표준 방법을 정의하는 최상위 인터페이스입니다.
    -   활성 프로필(`getActiveProfiles()`), 기본 프로필(`getDefaultProfiles()`)을 확인하는 기능과 특정 프로필 표현식이 현재 환경과 일치하는지 검사하는 `acceptsProfiles(Profiles profiles)` 메서드를 제공합니다.
    -   환경에 설정된 속성(`property`) 값을 가져오는 `getProperty()` 메서드를 정의합니다.

-   **`ActivityEnvironment` (구현체)**
    -   `Environment` 인터페이스의 핵심 구현체로, `ActivityContext` 내에서 실제 환경 정보를 제공합니다.
    -   내부적으로 `EnvironmentProfiles` 객체에 프로필 관련 기능을 위임하고, `PropertyToken`과 `ItemEvaluator`를 통해 동적인 속성 값 평가를 처리합니다.

-   **`EnvironmentProfiles`**
    -   `development`, `production`, `test`와 같은 환경 프로필을 관리하는 클래스입니다.
    -   시스템 프로퍼티 (`aspectran.profiles.active`, `aspectran.profiles.default`)나 `setActiveProfiles()` 메서드를 통해 프로필을 설정할 수 있습니다.

-   **`Profiles` (함수형 인터페이스) 및 `ProfilesParser`**
    -   프로필 표현식(expression)을 파싱하고 매칭하는 기능을 담당합니다.
    -   `!` (NOT), `&` (AND), `|` (OR) 같은 논리 연산자를 지원하여 `(p1 & p2) | !p3`와 같은 복잡한 프로필 조건을 사용할 수 있게 해줍니다. 이를 통해 특정 환경 조합에서만 특정 빈(Bean)이나 설정이 활성화되도록 매우 유연하게 제어할 수 있습니다.

## 2. 프로필(Profiles)을 이용한 설정 분리

프로필은 특정 환경에서만 활성화되는 빈(Bean)과 속성(Property)들을 그룹화하는 기능입니다. 예를 들어, 개발 환경에서는 인-메모리 DB를 사용하고, 운영 환경에서는 상용 DB를 사용하도록 분리할 수 있습니다.

### 설정 예제 (XML)

```xml
<!-- 개발(dev) 프로필이 활성화될 때만 등록되는 H2 데이터소스 빈 -->
<bean id="dataSource" class="com.zaxxer.hikari.HikariDataSource" profile="dev">
    <properties>
        <item name="driverClassName">org.h2.Driver</item>
        <item name="jdbcUrl">jdbc:h2:mem:testdb</item>
        <item name="username">sa</item>
    </properties>
</bean>

<!-- 운영(prod) 프로필이 활성화될 때만 등록되는 MySQL 데이터소스 빈 -->
<bean id="dataSource" class="com.zaxxer.hikari.HikariDataSource" profile="prod">
    <properties>
        <item name="driverClassName">com.mysql.cj.jdbc.Driver</item>
        <item name="jdbcUrl">jdbc:mysql://localhost:3306/prod_db</item>
        <item name="username">prod_user</item>
        <item name="password">prod_password</item>
    </properties>
</bean>
```

애플리케이션 실행 시 `-Daspectran.profiles.active=prod` 와 같은 JVM 옵션을 주면, `EnvironmentProfiles`가 이를 감지하여 `prod` 프로필을 활성화하고, MySQL 데이터소스 빈만 `ActivityContext`에 등록됩니다.

## 3. 속성(Properties) 관리

`Environment`는 애플리케이션 전반에서 사용될 설정 값을 관리하는 계층형 구조를 제공합니다.

### 속성 우선순위

속성 값은 다음 순서에 따라 높은 우선순위를 가집니다.

1.  **시스템 프로퍼티**: `System.getProperties()` - JVM 레벨에서 정의된 속성
2.  **환경 변수**: `System.getenv()` - 운영체제 레벨에서 정의된 환경 변수
3.  **설정 파일 내 정의**: `<properties>` 엘리먼트를 통해 Aspectran 설정 파일에 직접 정의된 속성

### 동적 속성 평가

`ActivityEnvironment`의 가장 큰 특징 중 하나는 속성 값이 `Activity` 실행 시점에 동적으로 평가될 수 있다는 점입니다. 즉, 단순한 키-값 쌍을 넘어, 다른 빈의 프로퍼티나 트랜슬릿의 파라미터 값을 참조하여 동적으로 속성 값을 만들어낼 수 있습니다.

```xml
<properties>
    <!-- 'uploadPath'라는 빈의 'path' 프로퍼티 값을 참조 -->
    <item name="file.upload-path" value="#{bean:uploadPath.path}/uploads"/>

    <!-- 현재 트랜슬릿의 'userId' 파라미터 값을 참조 -->
    <item name="user.home.dir" value="/home/#(param:userId)"/>
</properties>
```

애플리케이션 코드에서는 `environment.getProperty("file.upload-path")` 와 같이 호출하기만 하면, `ActivityEnvironment`가 내부적으로 `ItemEvaluator`를 통해 표현식을 평가하여 최종 값을 반환해 줍니다.

## 4. 결론

`com.aspectran.core.context.env` 패키지는 **환경에 따른 구성의 분리**라는 좋은 소프트웨어 설계 원칙을 Aspectran 프레임워크에 구현하는 핵심적인 부분입니다. 프로필을 통해 환경별로 다른 컴포넌트 구성을 가능하게 하고, 계층적이고 동적인 속성 관리를 통해 정적인 설정 파일을 넘어선 유연한 환경 대응 능력을 제공합니다.