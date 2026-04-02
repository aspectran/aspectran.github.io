---
title: Aspectran Profiles
subheadline: 핵심 가이드
---

Aspectran의 Profiles 기능은 애플리케이션의 설정 중 일부를 특정 환경에서만 활성화하거나 비활성화할 수 있도록 지원하는 강력한 도구입니다. 개발 환경(dev), 테스트 환경(test), 운영 환경(prod) 등 실행 환경에 따라 데이터베이스 연결 정보나 빈(bean) 구성을 다르게 가져가야 할 때 유용하게 사용할 수 있습니다.

이 문서는 프로필을 활성화하는 방법부터 XML과 어노테이션을 이용한 조건부 설정 방법, 그리고 실전 예제까지 상세히 설명합니다.

## 1. 프로필 활성화 (Activating Profiles)

애플리케이션을 실행할 때 어떤 프로필을 활성화할지는 JVM 시스템 프로퍼티(System Properties)를 통해 지정할 수 있습니다. Aspectran은 다음과 같은 세 가지 주요 프로퍼티를 제공합니다.

### 1.1. 주요 프로퍼티

*   **`aspectran.profiles.active`**: 현재 활성화할 프로필의 이름을 지정합니다. 여러 개의 프로필을 동시에 활성화하려면 쉼표(`,`)로 구분하여 나열합니다.
*   **`aspectran.profiles.default`**: `aspectran.profiles.active`가 지정되지 않았을 때 기본으로 활성화될 프로필을 지정합니다.
*   **`aspectran.profiles.base`**: 실행 환경과 관계없이 항상 활성화되어야 하는 기본 프로필을 지정합니다.

### 1.2. 실행 예시

**단일 프로필 활성화:**
`dev` 프로필을 활성화하여 실행합니다.
```bash
java -Daspectran.profiles.active=dev -jar my-application.jar
```

**복수 프로필 활성화:**
`prod`와 `metrics` 프로필을 동시에 활성화하여 실행합니다.
```bash
java -Daspectran.profiles.active=prod,metrics -jar my-application.jar
```

## 2. 프로필 표현식 문법 (Profile Expression Syntax)

단순히 프로필 이름을 적는 것 외에도, 논리 연산자를 사용하여 복잡한 활성화 조건을 만들 수 있습니다.

### 2.1. 논리 연산자

*   **`!` (NOT)**: 특정 프로필이 활성화되지 **않았을** 때를 의미합니다.
    - 예: `profile="!dev"` (dev가 아닐 때 활성화)
*   **`()` (AND)**: 괄호 안에 나열된 모든 프로필이 **모두** 활성화되어야 함을 의미합니다.
    - 예: `profile="(prod, metrics)"` (prod와 metrics가 모두 켜져 있어야 활성화)
*   **`[]` (OR)**: 나열된 프로필 중 **하나라도** 활성화되면 됨을 의미합니다.
    - 예: `profile="[dev, test]"` (dev 또는 test 중 하나만 켜져도 활성화)
*   **기본 연산 (OR)**: 별도의 기호 없이 쉼표로 나열하면 OR 연산으로 취급됩니다.
    - 예: `profile="dev, test"` (dev 또는 test 중 하나만 켜져도 활성화)

### 2.2. 문법 예시 요약

| 표현식 | 설명 |
| :--- | :--- |
| `dev` | `dev` 프로필이 활성화된 경우 |
| `!dev` | `dev` 프로필이 활성화되지 않은 경우 |
| `dev, test` | `dev` 또는 `test` 프로필이 활성화된 경우 (OR) |
| `(prod, metrics)` | `prod`와 `metrics` 프로필이 모두 활성화된 경우 (AND) |
| `!(prod, metrics)` | `prod`와 `metrics`가 동시에 활성화된 상태가 아닌 경우 |
| `[(dev, test), prod]` | (`dev`와 `test`가 모두 활성화됨) **또는** `prod`가 활성화된 경우 |

## 3. XML에서의 조건부 설정

XML 설정 파일에서는 각 요소의 `profile` 속성을 사용하여 조건부 설정을 적용합니다. 하지만 모든 요소가 `profile` 속성을 직접 지원하는 것은 아니므로 주의가 필요합니다.

### 3.1. 프로필 지원 요소와 래퍼(Wrapper) 요소

Aspectran의 XML 스키마에서 `profile` 속성을 직접 가질 수 있는 요소는 다음과 같습니다.
*   `<arguments>`, `<properties>`, `<parameters>`, `<attributes>`, `<environment>`, `<append>`

**중요 주의사항:**
`<bean>`, `<property>`, `<parameter>`, `<attribute>`, `<argument>`와 같은 개별 요소들은 `profile` 속성을 **직접 지원하지 않습니다.** 따라서 여러 항목에 프로필을 적용하려면 이들을 감싸는 **래퍼(Wrapper) 요소**를 사용해야 합니다.

각 래퍼 요소의 용도는 다음과 같습니다.

*   **`<arguments>`**: 빈(Bean)의 생성자 인자들의 묶음입니다.
*   **`<properties>`**: 빈이나 액션(Action)의 속성(Property)들의 묶음입니다.
*   **`<parameters>`**: 요청(Request) 파라미터들의 묶음입니다.
*   **`<attributes>`**: 요청 속성(Attribute)들의 묶음입니다.

이 래퍼 요소들은 내부에 여러 개의 `<item>` 요소를 가질 수 있으며, 래퍼 요소에 지정된 프로필이 활성화될 때만 내부의 모든 항목이 유효해집니다.

### 3.2. 래퍼 요소를 이용한 그룹화 예시

여러 개의 속성을 특정 프로필에서만 활성화하고 싶을 때는 다음과 같이 `<properties>` 래퍼 요소를 사용하고 그 안에 `<item>` 요소들을 작성합니다. 이때 단독으로 쓰이는 `<property>`와 래퍼 안의 `<item>`은 이름만 다를 뿐 역할은 동일합니다.

```xml
<aspectran>
    <!-- 'dev' 프로필에서만 활성화되는 속성 그룹 -->
    <properties profile="dev">
        <item name="service.url">http://dev.api.example.com</item>
        <item name="debug.mode">true</item>
    </properties>

    <!-- 'prod' 프로필에서만 활성화되는 속성 그룹 -->
    <properties profile="prod">
        <item name="service.url">https://api.example.com</item>
        <item name="debug.mode">false</item>
    </properties>
</aspectran>
```

### 3.3. 프로필별 빈 등록 (`<append>`)

`<bean>` 요소는 `profile` 속성을 지원하지 않으므로, 환경에 따라 전혀 다른 빈을 등록해야 한다면 설정 파일을 분리한 후 `<append>` 요소를 사용합니다.

```xml
<aspectran>
    <!-- 'dev' 프로필일 때만 dev-beans.xml 파일의 설정을 포함시킴 -->
    <append resource="config/dev-beans.xml" profile="dev"/>

    <!-- 'prod' 프로필일 때만 prod-beans.xml 파일의 설정을 포함시킴 -->
    <append resource="config/prod-beans.xml" profile="prod"/>
</aspectran>
```

## 4. 어노테이션을 이용한 조건부 설정

자바 코드에서 빈을 정의할 때는 `@Profile` 어노테이션을 사용하여 매우 직관적으로 조건을 지정할 수 있습니다.

### 4.1. 클래스 레벨 설정

`@Component`와 `@Profile`을 함께 사용하여 클래스 전체를 특정 프로필에서만 빈으로 등록되게 합니다.

```java
import com.aspectran.core.component.bean.annotation.Component;
import com.aspectran.core.component.bean.annotation.Profile;

@Component
@Profile("dev")
public class DevDataService implements DataService {
    // 이 클래스는 'dev' 프로필이 활성화되었을 때만 빈 컨테이너에 등록됩니다.
}
```

### 4.2. 메서드 레벨 설정 (`@Bean`)

설정 클래스 내의 팩토리 메서드에도 `@Profile`을 적용할 수 있습니다.

```java
@Component
public class AppConfig {

    @Bean
    @Profile("prod")
    public DataSource dataSource() {
        // 'prod' 프로필일 때만 MySqlDataSource가 빈으로 생성됩니다.
        return new MySqlDataSource();
    }

}
```

## 5. 실전 예제: 환경별 데이터베이스 설정

가장 권장되는 방식은 `PropertiesFactoryBean`을 사용하여 프로필별로 다른 `.properties` 파일을 로드하고, 이를 다른 빈에서 참조하는 방식입니다.

**`config/db.xml`**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<aspectran>
    <description>환경별 데이터베이스 연결 설정을 구성합니다.</description>

    <!-- 1. 프로필에 따라 적절한 설정 파일을 로드하는 빈 -->
    <bean id="dbProperties" class="com.aspectran.core.support.PropertiesFactoryBean">
        <properties>
            <!-- 파일이 없어도 오류를 무시하도록 설정 -->
            <item name="ignoreInvalidResource" valueType="boolean">true</item>
        </properties>
        
        <!-- 'dev' 프로필용 설정 파일 위치 -->
        <properties profile="h2">
            <item name="locations" type="array">
                <value>classpath:config/db/db-h2.properties</value>
            </item>
        </properties>
        
        <!-- 'prod' 프로필용 설정 파일 위치 -->
        <properties profile="mysql">
            <item name="locations" type="array">
                <value>classpath:config/db/db-mysql.properties</value>
                <value>/config/external/db-prod.properties</value>
            </item>
        </properties>
    </bean>

    <!-- 2. 로드된 속성을 사용하여 실제 데이터 소스 구성 -->
    <!-- #{dbProperties^key} 형식의 표현식을 사용하여 값을 참조합니다. -->
    <bean id="dataSource" class="com.zaxxer.hikari.HikariDataSource">
        <property name="driverClassName">#{dbProperties^driver}</property>
        <property name="jdbcUrl">#{dbProperties^url}</property>
        <property name="username">#{dbProperties^username}</property>
        <property name="password">#{dbProperties^password}</property>
    </bean>

</aspectran>
```

이와 같이 Aspectran의 Profiles 기능을 활용하면 코드 수정 없이 설정과 실행 옵션만으로 다양한 환경에 유연하게 대응하는 애플리케이션을 구축할 수 있습니다.
