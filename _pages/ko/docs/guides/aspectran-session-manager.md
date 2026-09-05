---
title: "Aspectran Session Manager: 상태 관리 및 세션 클러스터링 가이드"
subheadline: 핵심 가이드
permalink: /ko/docs/guides/aspectran-session-manager/
---

Aspectran은 특정 웹 컨테이너나 서블릿 스펙에 얽매이지 않고, 독립 실행형 데몬, 대화형 CLI 셸, 마이크로서비스, 그리고 대규모 웹 애플리케이션 서버에 이르기까지 **모든 실행 환경에서 일관된 상태 관리(State Management)**를 지원하도록 자체 세션 관리 아키텍처를 제공합니다.

이 가이드에서는 Aspectran Session Manager의 내부 설계 원리와 컴포넌트 구조, 신규/일반 세션 분리 기반의 정교한 생명주기 제어, 파일 및 Redis 기반 분산 클러스터링 저장소 구성, 그리고 Aspectow Enterprise(Undertow)와 Aspectow Edge(Netty) 등 각 서버 환경에서의 구체적인 설정 방법과 API 활용법을 종합적으로 다룹니다.

## 1. 핵심 아키텍처와 설계 철학

웹 애플리케이션의 전유물로 여겨졌던 세션의 개념을 추상화하여 모든 애플리케이션 런타임에서 재사용할 수 있도록 설계되었습니다. 서블릿 컨테이너의 세션 메커니즘을 흉내 내는 것에 그치지 않고, 클라우드 네이티브 환경의 고가용성과 확장성을 충족하도록 역할별로 명확히 분리된 컴포넌트 생태계를 갖추고 있습니다.

### 1.1. 주요 컴포넌트 구성

* **[`SessionManager`](file:///Users/Aspectran/Projects/workspace/aspectran/core/src/main/java/com/aspectran/core/component/session/SessionManager.java)** (기본 구현체: [`DefaultSessionManager`](file:///Users/Aspectran/Projects/workspace/aspectran/core/src/main/java/com/aspectran/core/component/session/DefaultSessionManager.java))
  * 세션 관리의 전체 흐름을 관장하는 중앙 컨트롤러이자 진입점입니다.
  * 세션의 생성, 조회, 갱신, 무효화(Invalidation) 등 전체 수명주기 이벤트를 총괄합니다.
  * 내부적으로 `SessionCache`, `SessionStore`, `HouseKeeper` 등 핵심 컴포넌트를 조율하여 최적의 I/O 효율을 보장합니다. 세션 조회 요청 시 1차 메모리 캐시를 확인하고, 캐시 미스 발생 시 영속 저장소에서 데이터를 로드합니다.
* **[`Session`](file:///Users/Aspectran/Projects/workspace/aspectran/core/src/main/java/com/aspectran/core/component/session/Session.java)** (구현체: [`ManagedSession`](file:///Users/Aspectran/Projects/workspace/aspectran/core/src/main/java/com/aspectran/core/component/session/ManagedSession.java))
  * 개별 사용자의 상태 정보를 보관하는 세션 데이터 객체입니다.
  * 세션 고유 식별자(ID), 생성 시각, 최종 접근 시각, 최대 유휴 시간 등의 메타데이터와 사용자가 바인딩한 속성(Attribute) 맵을 관리합니다.
* **[`SessionCache`](file:///Users/Aspectran/Projects/workspace/aspectran/core/src/main/java/com/aspectran/core/component/session/SessionCache.java)** (기본 구현체: [`DefaultSessionCache`](file:///Users/Aspectran/Projects/workspace/aspectran/core/src/main/java/com/aspectran/core/component/session/DefaultSessionCache.java))
  * 활성 세션 객체를 JVM 힙 메모리에 상주시키는 고속 캐시 계층입니다.
  * 물리적 저장소(파일, Redis 등)로 향하는 디스크 및 네트워크 I/O를 최소화하여 동시성 처리 성능을 극대화합니다.
* **[`SessionStore`](file:///Users/Aspectran/Projects/workspace/aspectran/core/src/main/java/com/aspectran/core/component/session/SessionStore.java)** (저장소 추상화 인터페이스)
  * 세션 데이터를 물리적으로 영속화하고 인스턴스 간에 공유하는 스토리지 계층입니다.
  * 저장소 플러그형(`Pluggable`) 아키텍처로 구현되어 있어 코드 변경 없이 설정을 통해 파일 스토리지나 Redis 분산 스토리지 등으로 자유롭게 교체할 수 있습니다.
* **`HouseKeeper`**
  * 백그라운드에서 주기적으로 가동되어 만료된 세션을 감지하고 정리하는 세션 청소부(Scavenger) 스레드입니다.
  * 장시간 방치된 비활성 세션을 영구 삭제하여 시스템 메모리와 저장소의 누수를 원천 차단합니다.
* **`SessionIdGenerator`**
  * 보안 난수(SecureRandom) 알고리즘을 활용하여 전역적으로 고유하며 추측 불가능한 세션 ID를 생성합니다. 클러스터 환경에서는 노드 식별을 위한 워커 이름(`workerName`) 접미사를 조합합니다.

### 1.2. 세션 수명주기 상호작용 흐름

1. **세션 생성 흐름**:
   * `SessionManager.createSession()` 호출
   * `SessionIdGenerator`를 통해 안전하고 유일한 세션 ID 발급
   * 신규 세션 메타데이터를 포함하는 `ManagedSession` 인스턴스 생성
   * `SessionCache` 메모리 계층에 세션 등록
   * 단일 서버 모드(지연 저장) 또는 클러스터 모드(즉시 저장) 정책에 따라 `SessionStore.save()` 수행
2. **세션 조회 흐름**:
   * 클라이언트 요청에 포함된 세션 ID로 `SessionManager.getSession(id)` 호출
   * 1차적으로 `SessionCache.get(id)`를 통해 메모리 캐시 탐색
   * 캐시 미스(Miss) 시 `SessionStore.load(id)`를 호출하여 영속 저장소에서 역직렬화 로드
   * 로드된 세션을 `SessionCache`에 재적재한 후 호출자에게 반환
3. **세션 정리(Scavenging) 흐름**:
   * 백그라운드 `SessionScheduler`가 설정된 주기마다 `HouseKeeper` 스레드 트리거
   * `HouseKeeper`가 활성 목록 및 영속 저장소의 세션 메타데이터를 순회하며 만료 여부 확인
   * 유효 시간이 초과된 세션에 대해 `session.invalidate()` 실행
   * 등록된 세션 소멸 리스너에게 통지하고, `SessionCache` 및 `SessionStore`에서 완전 제거

## 2. 저장소 플러그인과 클러스터링 전략

Aspectran Session Manager는 비즈니스 환경의 규모와 영속성 요구사항에 따라 세션 저장 방식을 매끄럽게 확장할 수 있도록 완벽히 분리된 스토리지 플러그인을 제공합니다. 특히 **`sessionStore`를 전혀 지정하지 않는 순수 인메모리 모드부터, 파일 시스템 영속화, 대규모 Redis 분산 클러스터링에 이르기까지 3단계 저장 전략**을 지원합니다.

### 2.1. 순수 인메모리 세션 (스토어리스 / SessionStore 생략)

* **동작 원리**: 세션 관리자 Bean 정의 시 `sessionStore` 프로퍼티를 명시하지 않고, 오직 [`SessionManagerConfig`](file:///Users/Aspectran/Projects/workspace/aspectran/core/src/main/java/com/aspectran/core/context/config/SessionManagerConfig.java)만 주입하여 가동합니다.
* **특징**:
  * 외부 디스크 파일 I/O나 Redis 네트워크 통신이 전혀 발생하지 않으며, 오직 JVM 힙 메모리(`ConcurrentHashMap`) 내에서만 세션 데이터가 관리됩니다.
  * 디스크나 외부 서버 연결에 따른 오버헤드가 전무하므로, 현존하는 모든 구성 중 **가장 빠르고 가벼운 극상의 성능**을 제공합니다.
  * 세션 영속화가 불필요한 콘솔 데모 환경(예: `aspectow-demo-console`), 단기 테스트, 임시 세션 토큰 관리, 또는 상태 유지가 중요하지 않은 경량 서비스에 매우 이상적입니다.
  * 서버 프로세스가 재시작되면 기존 세션 데이터는 모두 초기화됩니다.

```xml
<!-- SessionStore가 없는 순수 인메모리 초경량 세션 관리자 구성 예시 -->
<bean id="netty.context.root.sessionManager"
      class="com.aspectran.netty.server.session.NettySessionManager"
      scope="prototype">
    <property name="sessionManagerConfig">
        <bean class="com.aspectran.core.context.config.SessionManagerConfig">
            <argument>
                workerName: rn0
                maxActiveSessions: 100
                maxIdleSeconds: 300
            </argument>
        </bean>
    </property>
</bean>
```

### 2.2. 로컬 파일 세션 스토어 (`FileSessionStore`)

* **동작 원리**: Java 직렬화 메커니즘을 사용하여 세션 객체를 로컬 디스크의 지정된 디렉터리에 개별 파일로 안전하게 기록합니다.
* **장점**: 외부 데이터베이스나 인메모리 캐시 서버 없이도 동작하므로 로컬 개발 환경, 독립형 데몬, 단일 노드 운영 환경에서 가볍고 빠르게 사용할 수 있습니다.
* **안정성**: 애플리케이션 재시작 시 디스크에 남아있는 유효 세션 파일을 자동으로 복구하여 개발 편의성을 대폭 향상시킵니다.
* **주의점**: 서버 인스턴스 간 파일시스템 공유가 어렵기 때문에 다중 노드 로드밸런싱 환경에서는 적합하지 않습니다.

### 2.3. 고성능 Redis 세션 스토어 (`LettuceSessionStore`)

* **동작 원리**: 넌블로킹 비동기 Redis 클라이언트인 **Lettuce**를 기반으로 세션 데이터를 중앙 집중형 Redis 서버 또는 Redis 클러스터에 영속화합니다.
* **데이터 구조**: 각 세션은 Redis의 바이너리 세이프 `String` 타입으로 저장되며, `네임스페이스:세션ID` 포맷을 가집니다. 값은 고속 직렬화된 세션 바이트 스트림입니다.
* **장점**: 대규모 트래픽 분산 환경에서 여러 WAS 인스턴스가 완벽한 무상태(Stateless) 구조를 유지하면서 실시간으로 세션 상태를 공유할 수 있습니다. 노드가 예기치 않게 다운되더라도 클러스터 내 다른 노드가 즉시 세션을 이어받아 무중단 페일오버를 달성합니다.

### 2.4. 단일 서버 모드 vs 분산 클러스터 모드 동작 비교

[`SessionManagerConfig`](file:///Users/Aspectran/Projects/workspace/aspectran/core/src/main/java/com/aspectran/core/context/config/SessionManagerConfig.java)의 `clusterEnabled` 설정값은 세션 데이터의 신뢰 원천과 동기화 빈도를 제어하는 핵심 분기점입니다.

| 구분 | 단일 서버 모드 (`clusterEnabled: false`) | 분산 클러스터 모드 (`clusterEnabled: true`) |
| :--- | :--- | :--- |
| **데이터 신뢰 기준 (Source of Truth)** | `SessionCache` (로컬 메모리)를 1차 신뢰 | `SessionStore` (중앙 Redis 등)를 절대적 신뢰 원천으로 취급 |
| **세션 로드 전략** | 메모리 캐시에 존재하면 외부 스토어에 일체 접근하지 않음 (최대 성능) | 캐시에 존재하더라도 타 노드에 의한 변경 가능성을 검증하여 최신 상태 동기화 |
| **세션 저장 시점** | 마지막 요청 처리 완료 시점 또는 캐시 축출 시점에 배치 저장 | 세션 생성 즉시, 매 요청 종료 시, 메모리 축출 시 즉각 영속화 |
| **설계 목표** | I/O 최소화를 통한 극한의 단일 처리량 확보 | 다중 인스턴스 간 완벽한 데이터 정합성 보장 |

## 3. 세션 생명주기 제어 및 타임아웃 최적화

웹 서비스 운영 중 발생하는 대표적인 성능 저하 요인 중 하나는 검색 엔진 크롤러, 봇, 헬스 체크 프로브 등이 남기고 가는 대량의 "유령 세션"입니다. Aspectran은 이를 방지하기 위해 신규 세션과 일반 세션을 이원화하여 관리하는 지능형 타임아웃 알고리즘을 내장하고 있습니다.

### 3.1. 신규 세션과 일반 세션의 분리 관리

* **신규 세션 (New Session)**: 클라이언트가 처음 방문하여 세션이 생성되었으나 아직 두 번째 요청을 발생시키지 않은 상태의 세션입니다.
* **일반 세션 (Normal Session)**: 동일 세션 쿠키를 지참하고 두 번째 이상의 유효한 요청을 정상적으로 수행한 상태입니다.
* **최적화 원리**: 웹 크롤러나 일회성 API 호출은 단 한 번의 요청 후 다시 방문하지 않습니다. Aspectran은 이러한 세션에 대해 `maxIdleSecondsForNew`를 매우 짧게 적용하여 메모리와 Redis 저장소를 잠식하기 전에 빠르게 회수합니다.

### 3.2. `SessionManagerConfig` 핵심 설정 파라미터

XML Bean 정의 또는 APON 설정 블록에서 사용되는 [`SessionManagerConfig`](file:///Users/Aspectran/Projects/workspace/aspectran/core/src/main/java/com/aspectran/core/context/config/SessionManagerConfig.java)의 파라미터 명세는 다음과 같습니다.

```xml
<bean class="com.aspectran.core.context.config.SessionManagerConfig">
    <argument>
        workerName: node1
        maxActiveSessions: 50000
        maxIdleSeconds: 1800
        evictionIdleSeconds: 600
        maxIdleSecondsForNew: 60
        evictionIdleSecondsForNew: 30
        scavengingIntervalSeconds: 60
        clusterEnabled: true
        saveOnCreate: true
        saveOnInactiveEviction: true
        removeUnloadableSessions: true
    </argument>
</bean>
```

* **`workerName`**:
  * 클러스터 내에서 개별 서버 인스턴스를 식별하는 고유 이름입니다.
  * 생성되는 세션 ID 뒤에 접미사(예: `session123.node1`)로 부착되어 L4/L7 로드밸런서의 Sticky Session 라우팅과 충돌 방지에 활용됩니다.
* **`maxActiveSessions`**:
  * 메모리 캐시에 동시에 유지할 수 있는 최대 세션 개수입니다.
  * 허용 한도를 초과하면 유휴 시간이 긴 세션부터 메모리 캐시에서 선제적으로 축출(Evict)하여 OutOfMemory 오류를 방지합니다.
* **`maxIdleSeconds`**:
  * 일반 세션의 최대 유휴 시간(초 단위)입니다. (기본 예시: 1800초 = 30분)
  * 마지막 요청 이후 이 시간이 지나면 세션은 영구 만료 처리됩니다.
* **`maxIdleSecondsForNew`**:
  * 신규 세션에만 적용되는 최대 유휴 시간(초 단위)입니다. (권장: 30초~60초)
  * 크롤러가 대량으로 세션을 발급받더라도 1분 이내에 만료 대상으로 분류되어 즉각 정리됩니다.
* **`evictionIdleSeconds`**:
  * 세션이 활성 상태이더라도 메모리 절약을 위해 **로컬 힙 캐시에서만 축출(Evict)**하기까지의 유휴 시간(초)입니다.
  * 캐시에서 제거되어도 `SessionStore`에 데이터가 남아있으므로, 사용자가 다시 요청을 보내면 투명하게 복원됩니다.
* **`evictionIdleSecondsForNew`**:
  * 신규 세션에 대한 로컬 힙 캐시 축출 유휴 시간입니다.
* **`scavengingIntervalSeconds`**:
  * 백그라운드 청소부(`HouseKeeper`)가 실행되는 주기(초)입니다.
  * 너무 자주 실행하면 CPU 오버헤드가 발생하고, 너무 길면 만료 세션이 오래 남아있으므로 일반적으로 60초~120초가 권장됩니다.
* **`clusterEnabled`**:
  * `true` 설정 시 분산 클러스터링 모드로 가동되며 중앙 세션 스토어와의 일관성 동기화가 활성화됩니다.
* **`saveOnCreate`**:
  * 신규 세션 생성 즉시 영속 저장소에 쓸 것인지 여부입니다. (단일 서버 모드 최적화 옵션이며, `clusterEnabled: true`인 경우 항상 생성 즉시 저장됩니다.)
* **`saveOnInactiveEviction`**:
  * 비활성 세션이 메모리 한계로 인해 캐시에서 축출될 때 영속 저장소에 최신 상태를 백업할 것인지 여부입니다.
* **`removeUnloadableSessions`**:
  * 애플리케이션 클래스 구조 변경 등으로 인해 저장소의 세션 바이너리를 역직렬화할 수 없을 때, 에러를 반복 발생시키지 않고 해당 세션 데이터를 저장소에서 즉시 삭제할 것인지 여부입니다.

### 3.3. 대표 환경별 최적화 권장 설정 (Best Practice Profiles)

처음 Aspectran Session Manager를 도입할 때 각 타임아웃과 캐시 수치를 어떻게 조율해야 할지 고민하는 설계자를 위해, 실제 운영에서 검증된 대표적인 4가지 환경별 최적화 프로파일을 제시합니다.

#### 환경별 설정값 비교 매트릭스

| 설정 파라미터 | 1) 관리자 관제 콘솔 | 2) 대규모 대고객 서비스 | 3) 초경량 엣지 API | 4) 로컬 개발 및 테스트 |
| :--- | :--- | :--- | :--- | :--- |
| **`workerName`** | `cn0` | `rn0` | `edge0` | `dev0` |
| **`maxActiveSessions`** | `999` | `50000` | `5000` | `100` |
| **`maxIdleSeconds`** | `600` (10분) | `1800` (30분) | `300` (5분) | `3600` (1시간) |
| **`evictionIdleSeconds`** | `300` (5분) | `600` (10분) | `120` (2분) | `1800` (30분) |
| **`maxIdleSecondsForNew`** | `120` (2분) | `60` (1분) | `30` (30초) | `300` (5분) |
| **`evictionIdleSecondsForNew`** | `60` (1분) | `30` (30초) | `15` (15초) | `180` (3분) |
| **`scavengingIntervalSeconds`**| `180` (3분) | `60` (1분) | `60` (1분) | `300` (5분) |
| **`clusterEnabled`** | `false` | `true` | `false` | `false` |
| **권장 세션 저장소** | 순수 인메모리 또는 File | Redis Cluster (`Lettuce`) | 순수 인메모리 | File (`FileSessionStore`)|

#### 프로파일 1: 관리자 관제 콘솔 컨텍스트 (`cn0` / Console Context)

소수의 인가된 운영진만 접근하는 관리자 전용 평면(`/console`) 환경입니다.

```xml
<bean class="com.aspectran.core.context.config.SessionManagerConfig">
    <argument>
        workerName: cn0
        maxActiveSessions: 999
        maxIdleSeconds: 600
        evictionIdleSeconds: 300
        maxIdleSecondsForNew: 120
        evictionIdleSecondsForNew: 60
        scavengingIntervalSeconds: 180
        clusterEnabled: false
    </argument>
</bean>
```

* **설계 의도**:
  * **보안 강화**: 관리자 화면을 열어두고 자리를 비웠을 때의 보안 사고를 방지하기 위해 일반 유휴 시간을 10분(`maxIdleSeconds: 600`)으로 비교적 타이트하게 제한합니다.
  * **메모리 절약**: 5분(`evictionIdleSeconds: 300`)간 활동이 없으면 힙 메모리에서 우선 축출합니다.
  * **로그인 편의성**: 일반 웹 고객과 달리 관리자는 OTP 입력이나 복잡한 인증 절차를 거치므로 신규 세션 유예 시간을 2분(`maxIdleSecondsForNew: 120`)으로 충분히 부여합니다.
  * **스케줄러 오버헤드 최소화**: 접속자 수가 제한적이므로 청소 주기(`scavengingIntervalSeconds`)를 3분(180초)으로 늦춰 CPU 간섭을 줄입니다.

#### 프로파일 2: 대규모 대고객 웹 서비스 (High-Traffic Public Web / Enterprise)

수많은 동시 접속자와 불특정 다수의 검색 봇/크롤러가 유입되는 대규모 대외 서비스 환경입니다.

```xml
<bean class="com.aspectran.core.context.config.SessionManagerConfig">
    <argument>
        workerName: rn0
        maxActiveSessions: 50000
        maxIdleSeconds: 1800
        evictionIdleSeconds: 600
        maxIdleSecondsForNew: 60
        evictionIdleSecondsForNew: 30
        scavengingIntervalSeconds: 60
        clusterEnabled: true
        saveOnCreate: true
        saveOnInactiveEviction: true
    </argument>
</bean>
```

* **설계 의도**:
  * **크롤러 방어 최적화**: 봇이나 크롤러는 첫 요청 후 재방문하지 않으므로, 신규 세션 타임아웃을 1분(`maxIdleSecondsForNew: 60`), 캐시 축출을 30초로 설정하여 유령 세션이 힙 메모리와 Redis를 잠식하는 것을 원천 차단합니다.
  * **고가용성 클러스터링**: `clusterEnabled: true`와 중앙 Redis 스토어를 결합하여 다중 WAS 노드 간 실시간 세션 동기화 및 무중단 페일오버를 달성합니다.
  * **신속한 청소**: 대량의 만료 세션이 빠르게 쌓이므로 청소 주기를 1분(60초)으로 기민하게 유지합니다.

#### 프로파일 3: 초경량 엣지 마이크로서비스 (Aspectow Edge / In-Memory)

서블릿 컨테이너 없이 Netty 채널 파이프라인에서 빠른 API 응답과 임시 상태만을 다루는 초경량 서비스 환경입니다.

```xml
<bean class="com.aspectran.core.context.config.SessionManagerConfig">
    <argument>
        workerName: edge0
        maxActiveSessions: 5000
        maxIdleSeconds: 300
        evictionIdleSeconds: 120
        maxIdleSecondsForNew: 30
        evictionIdleSecondsForNew: 15
        scavengingIntervalSeconds: 60
        clusterEnabled: false
    </argument>
</bean>
```

* **설계 의도**:
  * **순수 인메모리 극대화**: `sessionStore`를 완전히 생략하여 디스크/네트워크 I/O를 제로화하고 최고 처리량을 보장합니다.
  * **신속한 메모리 회수**: 5분(`maxIdleSeconds: 300`)의 짧은 유효 시간과 30초 신규 세션 정리로 힙 메모리 점유율을 항상 낮게 유지합니다.

#### 프로파일 4: 로컬 개발 및 테스트 환경 (Development & Testing)

개발자가 로컬 머신에서 기능을 개발하고 디버깅하는 환경입니다.

```xml
<bean class="com.aspectran.core.context.config.SessionManagerConfig">
    <argument>
        workerName: dev0
        maxActiveSessions: 100
        maxIdleSeconds: 3600
        evictionIdleSeconds: 1800
        maxIdleSecondsForNew: 300
        evictionIdleSecondsForNew: 180
        scavengingIntervalSeconds: 300
        clusterEnabled: false
    </argument>
</bean>
```

* **설계 의도**:
  * **개발 생산성**: 디버깅 중이나 코드 수정 중에 세션이 자주 끊기면 반복 로그인을 해야 하므로 유휴 시간을 1시간(`maxIdleSeconds: 3600`)으로 넉넉하게 설정합니다.
  * **재기동 복구**: `FileSessionStoreFactoryBean`을 함께 사용하여 서버를 재시작해도 로그인 상태가 그대로 유지되도록 합니다.

## 4. 영속성 제어: `@NonPersistent`

분산 환경에서 세션을 Redis나 파일에 직렬화할 때, 네트워크 소켓, 데이터베이스 커넥션, 대용량 버퍼와 같이 직렬화가 불가능하거나 외부 저장이 부적절한 객체가 포함되어 있으면 예외가 발생하거나 네트워크 대역폭이 낭비됩니다.

Aspectran은 [`@NonPersistent`](file:///Users/Aspectran/Projects/workspace/aspectran/core/src/main/java/com/aspectran/core/component/session/NonPersistent.java) 어노테이션을 통해 세션 속성의 영속화 범위를 세밀하게 제어할 수 있습니다.

```java
package com.aspectran.example;

import com.aspectran.core.component.session.NonPersistent;
import java.io.Serializable;

/**
 * 힙 메모리 세션에는 유지되지만 Redis나 파일 저장소로는 전송되지 않는 임시 데이터
 */
@NonPersistent
public class TemporarySecurityContext implements Serializable {

    private String temporaryToken;
    private transient Object activeConnection;

    // Getter, Setter ...
}
```

* **적용 대상**:
  * 직렬화 불가능한 런타임 리소스 (`Socket`, `Connection`, `Thread`)
  * 민감한 일회성 보안 인증 토큰 (외부 스토리지 노출 방지)
  * 용량이 매우 큰 임시 렌더링 캐시 데이터 (Redis 직렬화/네트워크 전송 비용 절감)
* **동작 방식**: `SessionData`를 스토리지로 직렬화하기 직전 속성 객체의 클래스 및 상속 계층을 검사하여, `@NonPersistent`가 선언되어 있다면 저장 대상 맵에서 안전하게 제외합니다.

## 5. 실행 환경별 세션 구성 실전 가이드

Aspectran Session Manager의 가장 강력한 장점은 동일한 세션 라이프사이클 엔진을 기반으로, 실행 대상 인프라에 맞춰 최적화된 바인딩 구성을 손쉽게 적용할 수 있다는 점입니다.

### 5.1. Standalone / Shell / Daemon 환경 구성

웹 컨테이너가 없는 CLI 쉘 콘솔이나 백그라운드 데몬 프로세스에서도 사용자 로그인 상태나 작업 컨텍스트를 유지하기 위해 세션을 활용합니다. `aspectran-config.apon`에 직접 선언합니다.

`/app/config/aspectran-config.apon`:
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

### 5.2. Aspectow Enterprise 환경 구성 (Undertow 서블릿 바인딩)

Aspectow Enterprise에서는 [`TowSessionManager`](file:///Users/Aspectran/Projects/workspace/aspectran/with-undertow/src/main/java/com/aspectran/undertow/server/session/TowSessionManager.java)를 통해 서블릿 스펙(`io.undertow.server.session.SessionManager`)과 Aspectran 코어 세션 엔진을 브릿징합니다.

`/app/config/server/undertow/tow-context-root.xml`:
```xml
<!-- 서블릿 웹 컨텍스트 정의 -->
<bean id="tow.context.root" class="com.aspectran.undertow.server.servlet.TowServletContext">
    <property name="contextPath">/</property>
    
    <!-- 서블릿 세션 관리자 바인딩 -->
    <property name="sessionManager">#{tow.context.root.sessionManager}</property>
    
    <!-- 서블릿 표준 세션 쿠키 정책 정의 -->
    <property name="servletSessionConfig">
        <bean class="com.aspectran.undertow.server.servlet.TowServletSessionConfig">
            <property name="cookieName">JSESSIONID</property>
            <property name="cookiePath">/</property>
            <property name="cookieDomain">.aspectran.com</property>
            <property name="httpOnly" valueType="boolean">true</property>
            <property name="secure" valueType="boolean">false</property>
            <property name="sessionTrackingModes">
                <value>COOKIE</value>
            </property>
        </bean>
    </property>
</bean>

<!-- Undertow 세션 관리자 및 저장소 프로파일 분기 -->
<bean id="tow.context.root.sessionManager"
      class="com.aspectran.undertow.server.session.TowSessionManager"
      scope="prototype">
    <property name="sessionManagerConfig">
        <bean class="com.aspectran.core.context.config.SessionManagerConfig">
            <argument>
                workerName: ent0
                maxActiveSessions: 10000
                maxIdleSeconds: 1800
                evictionIdleSeconds: 900
                maxIdleSecondsForNew: 60
                evictionIdleSecondsForNew: 30
                scavengingIntervalSeconds: 90
                clusterEnabled: false
            </argument>
        </bean>
    </property>

    <!-- 로컬 개발 환경: 파일 기반 세션 저장소 -->
    <properties profile="!prod">
        <item name="sessionStore">
            <bean class="com.aspectran.core.component.session.FileSessionStoreFactoryBean">
                <property name="storeDir">%{system:aspectran.workPath:/work}/_sessions/%{tow.context.root.name}</property>
                <property name="gracePeriodSecs" valueType="int">30</property>
            </bean>
        </item>
    </properties>

    <!-- 운영 환경: 고가용성 Redis 분산 세션 클러스터링 -->
    <properties profile="prod">
        <item name="sessionStore">
            <bean class="com.aspectran.core.component.session.redis.lettuce.DefaultLettuceSessionStoreFactoryBean">
                <property name="poolConfig">
                    <bean class="com.aspectran.core.component.session.redis.lettuce.RedisConnectionPoolConfig">
                        <property name="uri">%{system:redis.uri}/10</property>
                    </bean>
                </property>
            </bean>
        </item>
    </properties>
</bean>
```

### 5.3. Aspectow Edge 환경 구성 (Netty 논-서블릿 바인딩)

Aspectow Edge에서는 서블릿 컨테이너 오버헤드를 배제하고 Netty 채널 파이프라인에서 직접 가동되는 [`NettySessionManager`](file:///Users/Aspectran/Projects/workspace/aspectran/with-netty/src/main/java/com/aspectran/netty/server/session/NettySessionManager.java)와 [`NettySessionConfig`](file:///Users/Aspectran/Projects/workspace/aspectran/with-netty/src/main/java/com/aspectran/netty/server/session/NettySessionConfig.java)를 사용합니다.

`/app/config/server/netty/netty-context-root.xml`:
```xml
<!-- Netty 컨텍스트 정의 -->
<bean id="netty.context.root" class="com.aspectran.netty.server.NettyContext">
    <property name="contextPath">/</property>
    
    <!-- Netty 경량 세션 관리자 바인딩 -->
    <property name="sessionManager">#{netty.context.root.sessionManager}</property>
</bean>

<!-- Netty 세션 관리자 설정 -->
<bean id="netty.context.root.sessionManager"
      class="com.aspectran.netty.server.session.NettySessionManager"
      scope="prototype">
    <!-- Netty HTTP 세션 쿠키 정책 -->
    <property name="sessionConfig">
        <bean class="com.aspectran.netty.server.session.NettySessionConfig">
            <property name="cookieName">JSESSIONID</property>
            <property name="cookiePath">/</property>
            <property name="cookieDomain">.aspectran.com</property>
            <property name="httpOnly" valueType="boolean">true</property>
            <property name="secure" valueType="boolean">false</property>
            <property name="sameSite">Lax</property>
            <property name="maxAge" valueType="int">-1</property>
        </bean>
    </property>

    <!-- 세션 생명주기 및 클러스터 정책 -->
    <property name="sessionManagerConfig">
        <bean class="com.aspectran.core.context.config.SessionManagerConfig">
            <argument>
                workerName: edge0
                maxActiveSessions: 50000
                maxIdleSeconds: 1800
                evictionIdleSeconds: 600
                maxIdleSecondsForNew: 60
                evictionIdleSecondsForNew: 30
                scavengingIntervalSeconds: 60
                clusterEnabled: false
            </argument>
        </bean>
    </property>

    <!-- 로컬 개발 환경: 파일 세션 스토어 -->
    <properties profile="!prod">
        <item name="sessionStore">
            <bean class="com.aspectran.core.component.session.FileSessionStoreFactoryBean">
                <property name="storeDir">%{system:aspectran.workPath:/work}/_sessions/%{netty.context.root.name}</property>
                <property name="gracePeriodSecs" valueType="int">30</property>
            </bean>
        </item>
    </properties>

    <!-- 운영 환경: 고가용성 Redis 분산 클러스터링 -->
    <properties profile="prod">
        <item name="sessionStore">
            <bean class="com.aspectran.core.component.session.redis.lettuce.DefaultLettuceSessionStoreFactoryBean">
                <property name="poolConfig">
                    <bean class="com.aspectran.core.component.session.redis.lettuce.RedisConnectionPoolConfig">
                        <property name="uri">%{system:redis.uri}/10</property>
                    </bean>
                </property>
            </bean>
        </item>
    </properties>
</bean>
```

#### `NettySessionConfig` 쿠키 설정 파라미터

* **`cookieName`**: 세션 식별 쿠키 이름 (기본값: `JSESSIONID`)
* **`cookiePath`**: 세션 쿠키 유효 경로 (기본값: `/`)
* **`cookieDomain`**: 서브도메인 간 공유를 위한 도메인 범위 (예: `.example.com`)
* **`httpOnly`**: JavaScript의 `document.cookie` 접근을 차단하여 XSS 공격 방어 (기본값: `true`)
* **`secure`**: HTTPS 암호화 채널에서만 전송되도록 제어 (운영 환경 권장: `true`)
* **`sameSite`**: CSRF 공격 방어를 위한 SameSite 정책 (`Strict`, `Lax`, `None` 지원, 기본값: `Lax`)
* **`maxAge`**: 쿠키 생존 시간(초). 기본값 `-1`은 브라우저 종료 시 삭제되는 세션 쿠키 동작을 의미

## 6. 세션 생명주기 이벤트 리스너

세션의 생성, 소멸, 속성 변경 시 감사 로그 기록이나 접속자 수 통계를 집계하기 위해 세션 리스너를 등록할 수 있습니다.

### 6.1. 세션 리스너 구현

```java
package com.aspectran.example.listener;

import com.aspectran.core.component.session.Session;
import com.aspectran.core.component.session.SessionListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class UserSessionTrackingListener implements SessionListener {

    private static final Logger logger = LoggerFactory.getLogger(UserSessionTrackingListener.class);

    @Override
    public void sessionCreated(Session session) {
        logger.info("New session created: id={}, worker={}", session.getId(), session.getWorkerName());
    }

    @Override
    public void sessionDestroyed(Session session) {
        logger.info("Session destroyed: id={}, lastAccessed={}", session.getId(), session.getLastAccessedTime());
    }

}
```

### 6.2. 리스너 등록 Bean 정의

Netty 환경에서는 [`SessionListenerRegistrationBean`](file:///Users/Aspectran/Projects/workspace/aspectran/with-netty/src/main/java/com/aspectran/netty/support/SessionListenerRegistrationBean.java)을 사용하여 특정 컨텍스트 경로(`/`)의 세션 관리자에 리스너를 안전하게 주입합니다.

```xml
<bean class="com.aspectran.netty.support.SessionListenerRegistrationBean">
    <property name="targetPath">/</property>
    <property name="sessionListener">
        <bean class="com.aspectran.example.listener.UserSessionTrackingListener"/>
    </property>
</bean>
```

Undertow 서블릿 환경의 경우 `TowServletSessionConfig`의 서블릿 리스너 체인 또는 Aspectran 세션 매니저 리스너 등록 빈을 통해 동적으로 바인딩할 수 있습니다.

## 7. 다중 컨텍스트 환경에서의 세션 격리 전략

Aspectow 서버 아키텍처의 강력한 보안 특징 중 하나는 **다중 컨텍스트 세션 완전 격리**입니다.

* **격리 원리**: 단일 서버 인스턴스 내에서 일반 사용자가 접속하는 메인 서비스 컨텍스트(`/`)와 운영진이 접속하는 관리자 관제 컨텍스트(`/console`)는 서로 다른 독립된 `SessionManager` 인스턴스를 소유합니다.
* **보안성**: 관리자 콘솔에서 로그인하여 생성된 세션 ID와 인증 정보는 메인 서비스 컨텍스트와 메모리 캐시 및 스토리지 키스페이스 수준에서 완전히 격리됩니다. 메인 웹 애플리케이션의 세션 탈취 취약점이 관리자 권한 탈취로 전이되지 않습니다.
* **도메인 공유 패턴**: 필요에 따라 동일 호스트 내에서 특정 SSO(Single Sign-On)가 요구될 경우, `cookieDomain`과 Redis 스토어 네임스페이스를 일치시켜 도메인 단위로 안전하게 세션을 공유할 수 있습니다.

## 8. 코드 레벨의 일관된 세션 조작 (Session API)

비즈니스 로직(Translet 액션, 컨트롤러, 서비스 Bean) 내부에서는 서블릿 API(`HttpServletRequest`, `HttpSession`)나 Netty 네이티브 객체에 종속되지 않고, Aspectran이 제공하는 통합 [`SessionAdapter`](file:///Users/Aspectran/Projects/workspace/aspectran/core/src/main/java/com/aspectran/core/adapter/SessionAdapter.java) 인터페이스를 통해 세션을 다룹니다.

```java
package com.aspectran.example.action;

import com.aspectran.core.activity.Translet;
import com.aspectran.core.adapter.SessionAdapter;
import com.aspectran.core.component.bean.annotation.Action;
import com.aspectran.core.component.bean.annotation.Component;

@Component
public class LoginAction {

    @Action("login")
    public String login(Translet translet) {
        String username = translet.getParameter("username");
        String password = translet.getParameter("password");

        if (authenticate(username, password)) {
            // 환경 독립적 SessionAdapter 획득
            SessionAdapter sessionAdapter = translet.getSessionAdapter();
            
            // 세션 속성 저장 (자동 캐싱 및 영속 스토어 동기화)
            sessionAdapter.setAttribute("currentUser", username);
            sessionAdapter.setAttribute("loginTime", System.currentTimeMillis());
            
            return "SUCCESS";
        }
        return "FAIL";
    }

    @Action("logout")
    public void logout(Translet translet) {
        SessionAdapter sessionAdapter = translet.getSessionAdapter();
        if (sessionAdapter != null) {
            // 세션 즉시 무효화 및 스토리지 삭제
            sessionAdapter.invalidate();
        }
    }

    private boolean authenticate(String u, String p) {
        return "admin".equals(u) && "secret".equals(p);
    }

}
```

* **환경 이식성**: 위 Java 코드는 Undertow 서블릿 환경이든, Netty 비동기 환경이든, 또는 자동화 테스트 쉘 환경이든 **단 1줄의 코드 수정 없이 100% 동일하게 실행**됩니다.
* **스레드 안전성**: `SessionAdapter` 내부의 속성 조작은 `DefaultSessionManager`에 의해 동시성 보호를 받으므로 멀티스레드 환경에서도 데이터 오염 없이 안전하게 작동합니다.

## 9. 결론

Aspectran Session Manager는 단순한 키-값 저장소를 넘어선 **차세대 엔터프라이즈 상태 관리 솔루션**입니다.

* **인프라 독립성**: 서블릿, Netty, CLI, 데몬 전 영역에 걸친 단일한 개발 및 운영 패러다임을 확립합니다.
* **지능형 리소스 보호**: 신규/일반 세션 분리 알고리즘을 통해 봇과 크롤러로부터 메모리와 스토리지를 완벽하게 방어합니다.
* **유연한 확장성**: 설정 변경만으로 로컬 개발용 파일 스토리지에서 대규모 Redis 분산 세션 클러스터링으로 무중단 전환됩니다.
* **보안과 성능의 양립**: `@NonPersistent`를 통한 선택적 영속화, 정교한 쿠키 보안 플래그(`HttpOnly`, `SameSite`, `Secure`), 다중 컨텍스트 완전 격리를 통해 엔터프라이즈 환경이 요구하는 엄격한 보안 요건을 충족합니다.
