---
title: Aspectran 프로퍼티 구성 및 활용
subheadline: 핵심 가이드
---

Aspectran은 실행 환경에 따른 유연한 설정 관리와 런타임 동적 평가 및 캐싱 기능을 지원하는 계층적 프로퍼티 시스템을 제공합니다. 개발자는 다양한 주입 경로를 통해 애플리케이션 설정을 관리할 수 있습니다.

## 1. 프로퍼티 주입 방법

애플리케이션 외부 또는 내부 설정 파일에서 프로퍼티를 주입하는 다양한 경로가 존재합니다.

### 1.1. JVM 시스템 프로퍼티 (-D 옵션)
가장 보편적인 방식으로, Java 실행 시 `-Dproperty.name=value` 형태로 주입합니다.

### 1.2. 운영 환경 배포 설정 (`app.conf`)
Aspectow 기반 애플리케이션의 배포 설정 파일인 `setup/app.conf`를 통해 프로퍼티를 관리할 수 있습니다. `startup.sh`나 `daemon.sh` 스크립트가 실행될 때 이 파일에 정의된 설정값들을 읽어 JVM 시스템 프로퍼티(VM Options)로 변환하여 프로세스를 구동합니다.

### 1.3. 애플리케이션 초기 설정 (`aspectran-config.apon`)
애플리케이션의 뼈대 설정인 `aspectran-config.apon` 파일 내 `system.properties` 섹션에 정의합니다. 이곳에 정의된 값들은 애플리케이션 구동 시 내부적으로 `System.setProperty()`를 통해 등록됩니다.

```apon
system: {
    properties: {
        # 예시: 특정 시스템 라이브러리 설정 등
        jboss.threads.eqe.statistics: true
    }
}
```

## 2. Aspectran 전용 프로퍼티

Aspectran 프레임워크의 동작을 제어하거나 핵심 기능을 활성화하기 위해 예약된 프로퍼티들입니다.

### 2.1. 프로필(Profiles) 제어
애플리케이션의 설정 블록을 환경별로 활성화하거나 비활성화할 때 사용합니다.
*   `aspectran.profiles.active`: 현재 활성화할 프로필을 지정합니다. (쉼표로 구분하여 다중 지정 가능)
*   `aspectran.profiles.default`: 활성화된 프로필이 없을 때 적용될 기본값입니다.
*   `aspectran.profiles.base`: 어떤 환경에서도 상시 활성화되는 기본 프로필입니다.

### 2.2. 컨텍스트별 베이스 프로필 지정
멀티 컨텍스트 환경에서 특정 컨텍스트(Context)에만 적용될 베이스 프로필을 지정할 수 있습니다.
*   **구문**: `-Daspectran.profiles.base.{contextName}={profileName}`
*   **예시**: `-Daspectran.profiles.base.appmon=mariadb` (`appmon` 컨텍스트의 기본 DB 설정을 mariadb로 고정)

### 2.3. 프레임워크 기능 설정
*   `aspectran.encryption.algorithm`: 설정 파일 내 암호화된 값을 복호화할 때 사용하는 알고리즘입니다. (기본값: `PBEWithMD5AndTripleDES`)
*   `aspectran.encryption.password`: 암호화 복호화에 사용할 패스워드입니다.
*   `aspectran.properties.encoding`: 프로퍼티 파일 로딩 시 사용할 인코딩입니다. (기본값: `UTF-8`)

## 3. 규칙 기반 환경 설정 (XML `<environment>`)

XML 규칙 파일 내부에서 프로퍼티를 정의하며, `profile` 속성을 통해 환경별로 다른 설정 셋을 구성할 수 있습니다.

### 3.1. `<environment>` 요소의 프로필 분기
`<environment>` 태그 자체에 `profile` 속성을 부여하여 특정 환경에서만 해당 프로퍼티 세트가 로드되도록 할 수 있습니다.

```xml
<!-- 운영 환경(prod)에서만 활성화되는 프로퍼티 세트 -->
<environment profile="prod">
    <property name="db.url">jdbc:mysql://prod-server:3306/prod_db</property>
</environment>

<!-- 운영 환경이 아닐 때 활성화되는 프로퍼티 세트 -->
<environment profile="!prod">
    <property name="db.url">jdbc:h2:mem:testdb</property>
</environment>
```

### 3.2. 프로퍼티 재정의와 캐싱 (Property Chaining)
프로퍼티 값 정의 시 다른 프로퍼티 토큰(`%{...}`)을 참조하는 경우, Aspectran은 이를 **캐싱(Caching)**하여 일관성을 보장합니다. 프로퍼티 내에서 프로퍼티를 다시 정의한다는 것은 해당 값을 평가된 상태로 고정하여 사용하겠다는 의도로 간주됩니다.

*   **동작 원리**: 프로퍼티 정의 내에 **최소 하나 이상의 프로퍼티 토큰(`%{...}`)**이 포함되어 있는 경우, 최초 호출 시점에 전체 값을 평가하고 결과값을 내부 캐시에 보관하여 이후 재사용합니다. 만약 프로퍼티 토큰 없이 빈 토큰(`#{...}`)이나 파라미터 토큰(`${...}`)만으로 구성된 경우에는 캐싱되지 않고 매번 새로 평가됩니다.
*   **활용 예시**:

```xml
<environment profile="test">
    <!-- 호출 시마다 새로운 UUID를 생성하는 원본 프로퍼티 (캐싱되지 않음) -->
    <property name="db.name.uuid">#{method:java.util.UUID^randomUUID}</property>

    <!-- 생성된 UUID를 참조하여 고정된 접미사로 정의.
         프로퍼티 토큰(%{...})을 포함하므로 최초 호출 시점에 캐싱되어 값이 고정됩니다. -->
    <property name="db.name.suffix">%{db.name.uuid}</property>

    <properties>
        <item name="petclinic.database.name">test_db_%{db.name.suffix}</item>
    </properties>
</environment>
```

## 4. PropertiesFactoryBean 활용

`PropertiesFactoryBean`은 외부 `.properties` 파일을 읽어와 Aspectran 프로퍼티 시스템에 통합해주는 유틸리티 빈입니다.

### 4.1. 주요 특징
*   **AsEL 지원**: 로드된 프로퍼티 파일 내부에서도 `%{...}` 토큰을 사용하여 Aspectran의 다른 프로퍼티를 참조할 수 있으며, 이는 초기화 시점에 자동으로 치환됩니다.
*   **프로필 기반 경로 지정**: 활성화된 프로필에 따라 로드할 파일의 경로를 동적으로 변경할 수 있습니다.

### 4.2. 구성 예제

```xml
<bean id="appmonAssets" class="com.aspectran.core.support.PropertiesFactoryBean">
    <properties>
        <!-- 파일 부재 시 에러 발생 여부 설정 -->
        <item name="ignoreInvalidResource" valueType="boolean">false</item>
    </properties>

    <!-- 운영 프로필 활성화 시 -->
    <properties profile="prod">
        <item name="locations" type="array">
            <value>/config/appmon/appmon-assets-prod.properties</value>
        </item>
    </properties>

    <!-- 운영 프로필 미활성화 시 -->
    <properties profile="!prod">
        <item name="locations" type="array">
            <value>/config/appmon/appmon-assets-dev.properties</value>
        </item>
    </properties>
</bean>
```

### 4.3. 파일 경로 규칙
*   **`classpath:` 접두사**: 클래스패스 루트를 기준으로 파일을 탐색합니다. (예: `classpath:config/db.properties`)
*   **접두사 없음**: 애플리케이션의 베이스 경로(Base Path)를 기준으로 상대 경로에서 파일을 탐색합니다. (예: `/config/appmon/assets.properties`)
