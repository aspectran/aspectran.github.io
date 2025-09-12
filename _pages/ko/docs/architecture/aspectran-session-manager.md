---
format: plate solid article
sidebar: toc-left
title: "Aspectran Session Manager: Deep Dive"
headline: Architecture Details
teaser:
---

## 1. 소개

Aspectran은 단순한 프레임워크를 넘어, 다양한 실행 환경에서 일관된 개발 경험을 제공하는 것을 목표로 합니다. 이러한 철학의 핵심에 **Aspectran Session Manager**가 있습니다. 이 컴포넌트는 웹 애플리케이션의 전유물로 여겨졌던 '세션'의 개념을 모든 실행 환경(Web, Shell, Daemon 등)에서 사용 가능하도록 재정의한, 강력하고 유연한 상태 관리(State Management) 솔루션입니다.

이 문서는 Aspectran Session Manager의 내부 아키텍처, 핵심 기능, 설정 방법을 심도 있게 분석하여 개발자가 그 잠재력을 최대한 활용할 수 있도록 돕는 것을 목표로 합니다.

---

## 2. 핵심 아키텍처와 컴포넌트

Aspectran 세션 매니저는 역할별로 명확하게 분리된 컴포넌트들의 유기적인 조합으로 구성됩니다. 각 컴포넌트의 역할과 상호작용을 이해하는 것이 중요합니다.

### 2.1. 주요 컴포넌트 상세

- **`SessionManager`** (구현체: `DefaultSessionManager`)
  - **역할**: 세션 관리의 모든 흐름을 제어하는 중앙 컨트롤러이자 외부로 노출되는 진입점입니다. 세션의 생성, 조회, 무효화 등 전체 생명주기를 총괄합니다.
  - **내부 동작**: `SessionCache`, `SessionStore`, `HouseKeeper` 등 다른 핵심 컴포넌트들을 조율하여 동작합니다. 세션 조회 요청이 오면, 먼저 `SessionCache`를 확인하고, 없으면 `SessionStore`에서 로드하는 전략을 사용합니다.

- **`Session`** (구현체: `ManagedSession`)
  - **역할**: 하나의 세션을 나타내는 데이터 객체입니다. 세션 ID, 생성 시각, 마지막 접근 시각과 같은 메타데이터와 사용자가 저장하는 속성(attribute)들을 내부에 저장합니다.

- **`SessionCache`** (구현체: `DefaultSessionCache`)
  - **역할**: 활성화된 세션 객체들을 메모리에 보관하는 캐시 계층입니다. `SessionStore`(파일, Redis 등)에 대한 물리적 접근을 최소화하여 세션 조회 성능을 극대화합니다.

- **`SessionStore`** (인터페이스)
  - **역할**: 세션 데이터를 영속적으로 저장하고 관리하는 **저장소 추상화 계층**입니다. 이 인터페이스 덕분에 세션 저장 방식을 자유롭게 교체(`Pluggable`)할 수 있습니다.
  - **주요 구현체**: `FileSessionStore`, `LettuceSessionStore`

- **`HouseKeeper`**
  - **역할**: 주기적으로 실행되어 만료된 세션을 정리하는 백그라운드 스레드, 즉 **세션 청소부(Scavenger)**입니다. `HouseKeeper`가 없다면 만료된 세션이 시스템에 계속 남아 리소스 누수를 유발하게 됩니다.

- **`SessionIdGenerator`**
  - **역할**: 모든 세션에 대해 전역적으로 고유한(globally unique) ID를 생성합니다.

### 2.2. 컴포넌트 상호작용 흐름

- **세션 생성 흐름**
  1. `SessionManager.createSession()` 호출
  2. `SessionIdGenerator`가 새 ID 생성
  3. `ManagedSession` 객체 생성
  4. `SessionCache`에 세션 추가
  5. `SessionStore.save()`를 통해 세션을 영구 저장소에 기록

- **세션 조회 흐름**
  1. `SessionManager.getSession(id)` 호출
  2. `SessionCache.get(id)`로 메모리 캐시에서 우선 조회
  3. (캐시 miss 시) `SessionStore.load(id)`로 영구 저장소에서 로드
  4. 로드한 세션을 `SessionCache`에 추가 후 반환

- **세션 정리 흐름**
  1. `SessionScheduler`가 정해진 시간마다 `HouseKeeper` 실행
  2. `HouseKeeper`는 `SessionStore`에서 모든 세션 ID를 가져와 만료 여부 체크
  3. 만료된 세션 발견 시 `session.invalidate()` 호출
  4. `SessionCache`에서 해당 세션 제거
  5. `SessionStore.delete()`를 통해 영구 저장소에서 최종 삭제

---

## 3. 교체 가능한 저장소와 클러스터링

`SessionStore` 인터페이스는 Aspectran 세션 관리의 가장 강력한 특징 중 하나로, 애플리케이션의 확장성을 좌우합니다.

### 3.1. `FileSessionStore`

- **동작**: `SessionData` 객체를 Java 직렬화 메커니즘을 통해 파일로 저장합니다. 각 세션은 별개의 파일로 관리됩니다.
- **장점**: 외부 의존성이 없어 구성이 간단하고, 단일 서버 환경이나 개발 환경에서 사용하기 편리합니다.
- **단점**: 여러 서버 인스턴스가 파일 시스템을 공유하기 어렵기 때문에 세션 클러스터링 환경에는 부적합합니다.

### 3.2. `LettuceSessionStore` (Redis 기반)

- **동작**: 고성능 비동기 Redis 클라이언트인 **Lettuce**를 사용하여 세션 데이터를 Redis에 저장합니다. 이를 통해 여러 애플리케이션 서버가 중앙의 Redis를 통해 세션을 공유하는 **세션 클러스터링**을 구현할 수 있습니다.
- **Redis 데이터 구조**: 각 세션은 Redis의 **String** 타입으로 저장됩니다. 키는 `네임스페이스:세션ID` (예: `aspectran:session:xxxxx`) 형태이며, 값은 `SessionData` 객체가 직렬화된 바이트 배열입니다.

### 3.3. 동작 모드 비교: 단일 서버 vs. 클러스터

`SessionManagerConfig`의 `clusterEnabled` 플래그는 세션 데이터의 신뢰도와 동기화 전략을 결정하는 핵심 스위치입니다.

#### 단일 서버 모드 (`clusterEnabled: false`)

- **데이터 신뢰도**: `SessionCache`(메모리)를 우선적으로 신뢰합니다.
- **동작 방식**: 세션 조회 시, 먼저 메모리 캐시를 확인하고 데이터가 있으면 즉시 반환합니다. 디스크(`FileSessionStore`)는 서버 재시작 시 복구를 위한 백업 용도로만 주로 사용됩니다. 데이터가 여러 곳에서 동시에 변경될 우려가 없으므로, 일단 메모리에 로드된 세션은 최고의 성능을 위해 메모리에서만 읽고 씁니다.
- **주요 목표**: **최고의 성능**. 불필요한 디스크 I/O를 최소화합니다.

#### 클러스터 모드 (`clusterEnabled: true`)

- **데이터 신뢰도**: `SessionStore`(Redis)를 유일한 **최종 데이터 저장소(Single Source of Truth)**로 신뢰합니다.
- **동작 방식**: 로드밸런서에 의해 여러 서버로 요청이 분산되는 환경을 전제로 합니다. 로컬 메모리의 캐시는 "복사본"으로 취급되며, 데이터 일관성을 위해 다음과 같은 추가 검사를 수행합니다.
  - **세션 로드**: 로컬 캐시에 세션이 존재하더라도, 이 데이터가 다른 서버에 의해 변경되었을 가능성을 항상 염두에 둡니다. 따라서 세션의 유효성을 체크할 때, `SessionStore`(Redis)에 저장된 최종 접근 시간과 같은 메타데이터를 비교하여 로컬 캐시의 데이터가 오래된 것(stale)인지 확인합니다. 만약 오래된 데이터라면, 캐시에서 제거하고 `SessionStore`로부터 최신 데이터를 다시 읽어옵니다.
  - **세션 저장**: 세션 데이터가 변경되면, 즉시 `SessionStore`(Redis)에 저장하여 중앙 저장소의 데이터를 갱신합니다. 이를 통해 다른 모든 서버가 다음 요청 시 최신 데이터를 조회할 수 있도록 보장합니다.
- **주요 목표**: **데이터 일관성**. 어떤 서버 노드에서 요청을 처리하든 항상 동일한 세션 상태를 보장합니다.

| 구분 | 단일 서버 모드 (`clusterEnabled: false`) | 클러스터 모드 (`clusterEnabled: true`) |
| :--- | :--- | :--- |
| **데이터 신뢰도** | `SessionCache` (메모리)를 우선 신뢰 | `SessionStore` (Redis)를 최종 신뢰 |
| **세션 로드 전략** | 캐시에 있으면 디스크 접근 안 함 | 캐시에 있어도 Store와 비교하여 데이터 정합성 확인 |
| **세션 저장 전략** | 로컬 디스크에만 저장 | 중앙 Redis에 저장하여 모든 노드에 전파 |
| **주요 목표** | **최고의 성능** | **데이터 일관성** |

---

## 4. 정교한 세션 생명주기 관리

Aspectran은 불필요한 세션을 신속하게 제거하여 시스템 리소스를 보호하는 정교한 타임아웃 정책을 가지고 있습니다.

### 4.1. 신규 세션과 일반 세션의 분리

- **문제점**: 웹 크롤러, 봇, 로드밸런서 헬스 체크 등은 세션을 생성만 하고 실제 상호작용은 하지 않아, 불필요한 "유령 세션"이 대량으로 쌓일 수 있습니다.
- **해결책**: Aspectran은 세션에 속성(attribute)이 하나라도 저장되면 "일반 세션"으로, 그렇지 않으면 "신규 세션"으로 구분하여 타임아웃을 차등 적용합니다.

### 4.2. 상세 설정 항목 분석

다음은 데모 사이트에 적용된 세션 설정 값입니다.
데모 사이트의 특성 상 웹 크롤러 또는 웹 오토메이션 도구의 테스트 대상이 될 수 있습니다.
이런 경우 최대 세션 수가 초과되는 현상을 방지하기 위해 신규 세션의 최대 유휴 시간을 최대한 짧게 설정하는 것이 유리합니다.

```xml
<bean class="com.aspectran.core.context.config.SessionManagerConfig">
    <arguments>
        <item>
            workerName: jn0
            maxActiveSessions: 99999
            maxIdleSeconds: 489
            evictionIdleSeconds: 258
            maxIdleSecondsForNew: 60
            evictionIdleSecondsForNew: 30
            scavengingIntervalSeconds: 90
            clusterEnabled: true
        </item>
    </arguments>
</bean>
```

- **`workerName`** (jn0): 세션 ID에 포함될 워커의 고유 이름입니다. 하나의 애플리케이션에서 여러 세션 매니저를 사용할 경우, 세션 ID 충돌을 방지하기 위해 이 값을 중복되지 않게 설정해야 합니다.
- **`maxActiveSessions`** (9999개): 동시에 활성화될 수 있는 최대 세션 수를 9999개로 지정합니다.
- **`maxIdleSeconds`** (489초): **일반 세션**의 최대 유휴 시간. 489초 동안 요청이 없으면 만료됩니다.
- **`maxIdleSecondsForNew`** (60초): **신규 세션**의 최대 유휴 시간. 세션 생성 후 60초 내에 속성이 추가되지 않으면 만료됩니다.
- **`scavengingIntervalSeconds`** (90초): `HouseKeeper`가 90초 간격으로 청소 작업을 실행합니다.
- **`evictionIdleSeconds`** (258초): 일반 세션이 만료된 후, 258초의 유예 시간이 지나면 저장소에서 **영구 삭제**됩니다.
- **`evictionIdleSecondsForNew`** (30초): 신규 세션이 만료된 후, 30초의 유예 시간이 지나면 영구 삭제됩니다.
- **`clusterEnabled`** (true): 클러스터링 환경임을 명시하여 세션 데이터의 일관성을 보장하는 모드로 동작시킵니다. (상세 내용은 3.3절 참조)

---

## 5. 환경 독립성과 API 일관성

- **`SessionManager`**: 환경에 구애받지 않는 독립적인 세션 기능이 필요할 때 사용합니다. (예: 데몬 애플리케이션)
- **`SessionAdapter`**: 웹 환경의 `HttpSession`처럼, 특정 환경이 제공하는 네이티브 세션을 Aspectran 표준 API로 사용할 수 있게 해주는 어댑터입니다. 개발자는 `activity.getSessionAdapter()`를 통해 환경에 맞는 세션을 일관된 방식으로 사용할 수 있어 코드의 재사용성이 극대화됩니다.

---

## 6. 영속성 제어: `@NonPersistent`

`@NonPersistent` 어노테이션을 세션에 저장할 객체의 클래스에 붙이면, 해당 객체는 `SessionStore`에 저장되지 않습니다. `SessionData`가 직렬화될 때, 속성 객체의 클래스에 이 어노테이션이 있는지 검사하여 저장 과정에서 제외합니다.

- **사용 사례**:
  - **직렬화 불가능 객체**: `Socket`, `DB Connection` 등
  - **보안 데이터**: 비밀번호, 개인키 등 민감 정보
  - **성능 최적화**: 불필요한 임시 데이터를 제외하여 직렬화 오버헤드 감소

```java
import com.aspectran.core.component.session.NonPersistent;

@NonPersistent
public class MyTemporaryData implements java.io.Serializable {
    // 이 객체는 파일이나 Redis에 저장되지 않습니다.
}
```

## 7. 설정 예제

### 예제 1: 쉘 또는 데몬 환경을 위한 세션 설정

`aspectran-config.apon` 파일에서 쉘 또는 데몬 서비스의 세션을 직접 설정합니다.
웹 환경이 아니기 때문에 정교한 세션 생명주기 관리를 필요로 하지 않습니다.

```apon
shell: {
    session: {
        workerName: shell
        maxActiveSessions: 1
        maxIdleSeconds: 1800
        scavengingIntervalSeconds: 600
        fileStore: {
            storeDir: /work/_sessions/shell
        }
        enabled: true
    }
}
```

### 예제 2: 프로필 기반의 XML 빈 설정 (웹 환경)

프로필을 사용하여 운영 환경에 따라 세션 저장소를 동적으로 전환합니다.

```xml
<bean id="tow.context.jpetstore.sessionManager"
      class="com.aspectran.undertow.server.session.TowSessionManager">
    <properties>
        <item name="sessionManagerConfig">
            <bean class="com.aspectran.core.context.config.SessionManagerConfig">
                <arguments>
                    <item>
                        workerName: jn0
                        maxActiveSessions: 99999
                        maxIdleSeconds: 489
                        maxIdleSecondsForNew: 60
                        scavengingIntervalSeconds: 90
                        clusterEnabled: true
                    </item>
                </arguments>
            </bean>
        </item>
    </properties>
    <!-- 기본 프로필: FileStore 사용 -->
    <properties profile="!prod">
        <item name="sessionStore">
            <bean class="com.aspectran.core.component.session.FileSessionStoreFactoryBean">
                <properties>
                    <item name="storeDir">/work/_sessions/jpetstore</item>
                </properties>
            </bean>
        </item>
    </properties>
    <!-- 'prod' 프로필 활성화 시: RedisStore 사용 -->
    <properties profile="prod">
        <item name="sessionStore">
            <bean class="com.aspectran.core.component.session.redis.lettuce.DefaultLettuceSessionStoreFactoryBean">
                <properties>
                    <item name="poolConfig">
                        <bean class="com.aspectran.core.component.session.redis.lettuce.RedisConnectionPoolConfig">
                            <properties>
                                <item name="uri">%{system:redis.uri}/11</item>
                            </properties>
                        </bean>
                    </item>
                </properties>
            </bean>
        </item>
    </properties>
</bean>
```

## 8. 결론

Aspectran Session Manager는 단순한 상태 저장소가 아닌, 현대적인 애플리케이션 아키텍처의 요구사항을 충족하는 **엔터프라이즈급 상태 관리 프레임워크**입니다. 교체 가능한 저장소, 정교한 생명주기 관리, 환경 독립적 API 제공을 통해, 개발자는 단일 노드 기반의 간단한 애플리케이션부터 대규모 분산 서비스에 이르기까지 모든 환경에서 안정적이고 효율적으로 사용자 상태를 관리할 수 있습니다.