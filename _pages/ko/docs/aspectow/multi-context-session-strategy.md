---
title: 멀티 컨텍스트 세션 구성 전략 및 패턴
teaser: 멀티 컨텍스트 환경에서 세션 격리 및 공유를 위한 3가지 주요 패턴과 아키텍처 설계 전략을 알아봅니다.
subheadline: Aspectow
---

Aspectow는 Undertow 엔진을 기반으로 여러 웹 컨텍스트를 동시에 운영할 수 있는 멀티 컨텍스트 환경을 제공합니다. 이러한 환경에서 사용자의 상태(Session)를 어떻게 관리하고 공유할지는 애플리케이션의 아키텍처 설계에서 매우 중요한 부분입니다.

본 문서는 세 가지 핵심 컴포넌트(`SessionManager`, `SessionConfig`, `SessionStore`)의 조합을 통해 구현할 수 있는 세션 관리 패턴과 설정 시 주의사항을 설명합니다.

Aspectran 세션 매니저에 대한 보다 상세한 아키텍처와 핵심 컴포넌트 설명은 [Aspectran Session Manager: Deep Dive](https://aspectran.com/ko/docs/architecture/aspectran-session-manager/) 문서를 참조하십시오.

## 1. 세션 관리의 3가지 패턴

멀티 컨텍스트 환경에서 세션은 공유 범위에 따라 다음과 같이 세 가지 패턴으로 구성될 수 있습니다.

### 패턴 1: 완전 격리 (Complete Isolation)
각 컨텍스트가 자신만의 `SessionManager`와 `SessionConfig`를 가집니다.
*   **공유 범위**: 없음. 컨텍스트마다 세션 ID가 다르고 데이터도 별도로 관리됩니다.
*   **특징**: 컨텍스트 간 간섭이 전혀 없어 가장 안전하며, 각 앱의 세션 정책(타임아웃 등)을 자유롭게 설정할 수 있습니다.

### 패턴 2: 세션 ID 공유 (Session ID Sharing)
여러 컨텍스트가 **동일한 `SessionConfig`(쿠키 설정)를 공유**하지만, `SessionManager`는 각자 가집니다.
*   **공유 범위**: 세션 ID(쿠키)만 공유. 브라우저는 모든 관련 컨텍스트에 대해 동일한 세션 쿠키를 전송합니다.
*   **데이터 특징**: 세션 ID는 같아도 각 컨텍스트의 세션 데이터는 독립적입니다. 즉, A 컨텍스트에서 저장한 속성을 B 컨텍스트에서 읽을 수 없습니다.
*   **추적성**: 각 매니저가 고유한 `workerName`을 가지므로, 세션 ID 접미사를 통해 어느 컨텍스트에서 세션이 생성되었는지 추적할 수 있습니다.

### 패턴 3: 세션 데이터 공유 (Session Data Sharing)
여러 컨텍스트가 **하나의 `SessionManager` 인스턴스를 공유**합니다.
*   **공유 범위**: 세션 ID와 세션 데이터 모두 공유.
*   **구현 방법**: 서버 레벨에서 정의된 단일 `SessionManager` 빈(Bean)을 여러 컨텍스트가 참조하도록 설정합니다.
*   **특징**: 진정한 의미의 공유 세션이며, 한 컨텍스트에서 로그인한 정보를 다른 컨텍스트에서 즉시 참조할 수 있습니다. 단, 모든 컨텍스트가 동일한 세션 정책과 저장소를 사용하게 됩니다.

## 2. 설정 시 필수 주의 사항 (Best Practices)

### ⚠️ 저장소 경로 중복 절대 금지 (각자 다른 매니저 사용 시)
패턴 1 또는 패턴 2와 같이 **서로 다른 `SessionManager` 인스턴스들을 사용할 때, 이들이 동일한 물리적 디렉토리를 `SessionStore` 경로로 사용하게 해서는 절대 안 됩니다.**

*   **위험 요소**: 각 `SessionManager`에는 만료된 세션 파일을 정리하는 `HouseKeeper`가 내장되어 있습니다. 만약 경로가 중복되면 서로 다른 매니저들이 같은 파일을 두고 삭제나 수정을 경쟁하게 되어 데이터 유실 및 파일 잠금(Lock) 오류가 발생합니다.
*   **해결책**: 반드시 컨텍스트(매니저)별로 유일한 `baseDirectory`를 지정하십시오.

### ⚠️ `workerName`의 고유성 확보 (필수)
`SessionIdGenerator`가 생성하는 세션 ID에는 `workerName`이 접미사(`.workerName`)로 포함됩니다. 한 서버 내에서 여러 개의 `SessionManager`를 운영할 경우, 다음 이유로 인해 각 매니저마다 고유한 `workerName`을 부여해야 합니다.
*   **ID 충돌 방지**: 생성되는 세션 ID의 유일성을 보장합니다.
*   **생성 출처 추적**: 세션 ID만 공유하는 환경(패턴 2)에서도 로그 분석을 통해 해당 세션이 어떤 컨텍스트의 세션 매니저에서 최초로 생성되었는지 명확히 파악할 수 있습니다.
*   **설정 제약**: `workerName`에는 마침표(`.`)를 포함할 수 없습니다.

### ⚠️ 별도 설정이 없는 경우의 기본 동작
어떤 컨텍스트든 `SessionManager`를 명시적으로 설정하지 않으면 Undertow의 내장 세션 매니저가 기본으로 작동합니다. 정교한 세션 제어(신규 세션 타임아웃, 클러스터링 등)가 필요한 컨텍스트에만 Aspectran의 `SessionManager`를 설정하면 됩니다.

## 3. 설정 예시 (패턴 2: 세션 ID 공유, 데이터 격리)

세션 저장소는 컨텍스트별로 분리되어 데이터는 격리되지만, 동일한 세션 ID를 공유하도록 설정하는 방식입니다. 이는 여러 컨텍스트를 넘나드는 사용자의 활동을 일관되게 추적(User Tracking)해야 하는 특수한 경우에 주로 사용됩니다.

```xml
<!-- 공유할 세션 쿠키 설정 (보통 상위 경로로 설정) -->
<bean id="tow.server.servletSessionConfig" class="com.aspectran.undertow.server.session.TowServletSessionConfig">
    <property name="cookieConfig">
        <bean class="com.aspectran.undertow.server.session.TowSessionCookieConfig">
            <property name="path">/</property>
        </bean>
    </property>
</bean>

<!-- 컨텍스트 A의 매니저: 세션 ID는 공유하지만 데이터는 별도 디렉토리에 저장 -->
<bean id="tow.appmon.sessionManager" class="com.aspectran.undertow.server.session.TowSessionManager">
    <property name="workerName" value="appmon"/> <!-- 고유한 이름 지정 -->
    <property name="sessionStore">
        <bean class="com.aspectran.core.component.session.FileSessionStoreFactoryBean">
            <property name="storeDir">/app/work/_sessions/appmon</property> <!-- 경로 분리 필수 -->
        </bean>
    </property>
</bean>
```

## 4. 결론

Aspectow의 세션 설정은 유연하지만, **"하나의 디렉토리는 하나의 SessionManager 인스턴스만 관리해야 한다"**는 원칙과 **"매니저별 고유한 workerName 부여"** 원칙을 반드시 지켜야 합니다. 세션 공유가 필요한 경우 ID만 공유할지(패턴 2), 아니면 단일 매니저 공유를 통해 데이터까지 공유할지(패턴 3)를 설계 단계에서 명확히 결정하십시오.
