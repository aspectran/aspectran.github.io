---
format: plate solid article
sidebar: toc-left
title: Aspectran Profiles
subheadline: 사용자 가이드
parent_path: /docs
---

Aspectran의 Profiles 기능은 애플리케이션의 전체 또는 일부 설정을 특정 환경에서만 활성화하거나 비활성화할 수 있도록 지원하는 강력한 기능입니다. 예를 들어, '개발(development)', '테스트(test)', '운영(production)' 환경에 따라 서로 다른 데이터베이스 설정을 적용하거나 특정 빈(bean)을 로드해야 할 때 유용하게 사용할 수 있습니다.

## 프로필 활성화

프로필은 JVM 시스템 프로퍼티(System Properties)를 통해 간단하게 활성화할 수 있습니다. 주로 사용하는 프로퍼티는 다음과 같습니다.

- `aspectran.profiles.active`: 현재 활성화할 프로필을 지정합니다. 여러 프로필을 지정할 경우 쉼표(`,`)로 구분합니다.
- `aspectran.profiles.default`: `aspectran.profiles.active`가 지정되지 않았을 때 기본으로 활성화할 프로필을 지정합니다.
- `aspectran.profiles.base`: 항상 활성화되어야 하는 기본 프로필을 지정합니다.

**예시:**

`dev` 프로필을 활성화하여 애플리케이션을 실행하는 커맨드 라인 예제입니다.

```bash
java -Daspectran.profiles.active=dev -jar my-application.jar
```

`prod`와 `metrics` 두 개의 프로필을 동시에 활성화하는 예제입니다.

```bash
java -Daspectran.profiles.active=prod,metrics -jar my-application.jar
```

## 프로필을 이용한 조건부 설정

Aspectran의 설정 파일 (XML 기반) 내 대부분의 엘리먼트에서 `profile` 속성을 사용하여 특정 프로필이 활성화되었을 때만 해당 설정을 적용하도록 할 수 있습니다.

- `<bean>`, `<arguments>`, `<properties>`, `<environment>`, `<append>` 등 다양한 설정 엘리먼트에서 `profile` 속성을 사용할 수 있습니다.
- `profile` 속성에 지정된 프로필 표현식이 현재 활성화된 프로필과 일치하면 해당 엘리먼트가 활성화됩니다.
- 일치하지 않으면 해당 엘리먼트와 그 하위 엘리먼트들은 모두 무시됩니다.

```xml
<aspectran>

    <!-- 'dev' 프로필이 활성화될 때만 적용되는 프로퍼티 -->
    <properties profile="dev">
        <property name="db.driver">org.h2.Driver</property>
        <property name="db.url">jdbc:h2:mem:testdb</property>
        <property name="db.username">sa</property>
        <property name="db.password"></property>
    </properties>

    <!-- 'prod' 프로필이 활성화될 때만 적용되는 프로퍼티 -->
    <properties profile="prod">
        <property name="db.driver">com.mysql.cj.jdbc.Driver</property>
        <property name="db.url">jdbc:mysql://localhost:3306/prod_db</property>
        <property name="db.username">prod_user</property>
        <property name="db.password">prod_password</property>
    </properties>

    <!-- 'prod' 프로필이 활성화될 때만 해당 설정 파일을 포함 -->
    <append file="/config/metrics-context.xml" profile="prod"/>

</aspectran>
```

## 프로필 표현식 (Profile Expressions)

단순한 프로필 이름 외에도, 논리 연산자를 사용하여 복잡한 조건을 표현할 수 있습니다.

- **`!` (NOT)**: 특정 프로필이 활성화되지 않았을 때
  ```xml
  <!-- 'demo' 프로필이 활성화되지 않았을 때만 적용 -->
  <bean id="someBean" class="com.example.SomeBean" profile="!demo"/>
  ```

- **`()` (AND)**: 괄호 안의 모든 프로필이 활성화되었을 때
  ```xml
  <!-- 'prod'와 'metrics' 프로필이 모두 활성화되었을 때만 적용 -->
  <bean id="metricsExporter" class="com.example.MetricsExporterBean" profile="(prod, metrics)"/>
  ```

- **`[]` (OR)**: 대괄호 안의 프로필 중 하나라도 활성화되었을 때 (쉼표 `,`로만 구분해도 OR로 동작)
  ```xml
  <!-- 'dev' 또는 'test' 프로필이 활성화되었을 때 적용 -->
  <bean id="testHelper" class="com.example.TestHelperBean" profile="[dev, test]"/>
  ```

- **복합 표현식**: 여러 연산자를 조합하여 복잡한 조건을 만들 수 있습니다.
  ```xml
  <!-- 'rss-lettuce', 'rss-lettuce-masterreplica', 'rss-lettuce-cluster' 프로필이 모두 활성화되지 않았을 때 적용 -->
  <properties profile="(!rss-lettuce, !rss-lettuce-masterreplica, !rss-lettuce-cluster)">
      <!-- ... -->
  </properties>
  ```

## 사용 예제: 환경별 데이터베이스 설정

다음은 `dev`와 `prod` 환경에 따라 다른 데이터베이스 연결 정보를 설정하는 완전한 예제입니다.

**`config/root-context.xml`**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<aspectran>

    <description>환경에 따라 다른 DB 설정을 로드합니다.</description>

    <!-- 개발 환경 설정 -->
    <properties profile="dev">
        <property name="db.driver">org.h2.Driver</property>
        <property name="db.url">jdbc:h2:mem:devdb;DB_CLOSE_DELAY=-1</property>
        <property name="db.username">sa</property>
        <property name="db.password"></property>
    </properties>

    <!-- 운영 환경 설정 -->
    <properties profile="prod">
        <property name="db.driver">com.mysql.cj.jdbc.Driver</property>
        <property name="db.url">jdbc:mysql://prod.db.server:3306/main_db</property>
        <property name="db.username">prod_db_user</property>
        <property name="db.password">!PROD_DB_PASSWORD!</property>
    </properties>

    <!-- 데이터 소스 빈 정의 -->
    <bean id="dataSource" class="com.zaxxer.hikari.HikariDataSource">
        <properties>
            <item name="driverClassName" value="${db.driver}"/>
            <item name="jdbcUrl" value="${db.url}"/>
            <item name="username" value="${db.username}"/>
            <item name="password" value="${db.password}"/>
        </properties>
    </bean>

</aspectran>
```

**애플리케이션 실행:**

- **개발 환경으로 실행:** `dev` 프로필을 활성화하면 H2 인메모리 데이터베이스를 사용합니다.
  ```bash
  java -Daspectran.profiles.active=dev -jar my-app.jar
  ```

- **운영 환경으로 실행:** `prod` 프로필을 활성화하면 MySQL 데이터베이스를 사용합니다.
  ```bash
  java -Daspectran.profiles.active=prod -jar my-app.jar
  ```

이처럼 Aspectran의 Profiles 기능을 사용하면 코드 변경 없이 설정만으로 여러 환경에 쉽게 대응할 수 있습니다.
