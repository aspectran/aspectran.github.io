---
title: Aspectow Node Manager 가이드
teaser: 분산 멀티 노드 클러스터를 유기적으로 결합하고 라우팅 및 릴레이 패킷을 통제하는 핵심 제어 평면(Control Plane) 라이브러리 가이드입니다.
subheadline: Aspectow
---

## 1. 개요

**Aspectow Node Manager**(`aspectow-node`)는 분산 환경에서 동작하는 여러 노드들을 하나의 통합된 유기적 클러스터로 묶어주는 제어 평면(Control Plane) 라이브러리입니다.

기존 WAS 관제가 단일 서버 제어에 그쳤던 한계를 극복하고, Redis를 중앙 브로커 및 메타데이터 저장소로 활용하여 노드와 관제 콘솔 간의 의존성을 완벽히 분리합니다. 이를 통해 노드의 동적 추가/소멸이 빈번한 클라우드 및 컨테이너 환경에서도 유연한 확장성과 높은 관찰 가능성(Observability)을 보장합니다.

## 2. 핵심 기능

Aspectow Node Manager는 안정적인 클러스터 운영을 위해 다음과 같은 핵심 기능을 제공합니다.

### 2.1. 노드 생명주기 및 생존 모니터링 (Node Status & Pulse)
클러스터에 참여하는 모든 노드의 생명주기를 관장합니다. 노드는 기동 시 자신의 상세 메타데이터(`NodeInfo`)를 등록하고, 주기적인 생존 신호(Pulse, 기본 10초 간격)를 발송합니다. 관제 콘솔(Aspectow Console)은 이 펄스 신호를 감지하여 활성 노드의 실시간 상태(Live, Paused, Dead)를 직관적으로 추적하며, 지정된 타임아웃(기본 60초) 동안 펄스가 수신되지 않는 좀비 노드는 자동으로 감지 및 정리됩니다.

### 2.2. 투명한 메시지 릴레이 (Transparent Relay)
Console과 노드 간, 또는 노드와 노드 간의 제어 명령 및 모니터링 데이터 패킷을 중계합니다. Redis Pub/Sub 기반의 **투명한 릴레이(Transparent Relay)** 방식을 채택하여 중계 주체가 패킷 본문을 파싱하지 않고 고속 전송하므로, 높은 트래픽 환경에서도 처리 지연이 거의 발생하지 않습니다.

### 2.3. 공유 비밀키 및 암호화 토큰 보안 (Security & Authentication)
클러스터 내 신뢰할 수 있는 노드 간 통신만 허용하기 위해 **Shared Secret** 기반의 암호화 검증을 수행합니다. 생성된 토큰은 단기 유효기간(기본 30초)과 AES 암호화를 적용하여 외부 트래픽의 무단 침입을 차단합니다.

## 3. 클러스터 구동 모드 상세 비교

인프라 환경과 확장 요구사항에 따라 두 가지 구동 모드를 지원합니다.

### 3.1. Gateway 모드 (Cloud-Native & Autoscaling)

Redis를 메시지 버스 및 분산 저장소로 활용하는 현대적인 Cloud-Native 방식입니다.

*   **오토스케일링 최적화**: 노드가 기동될 때 UUID 기반의 고유 식별자(`Node ID`)를 자율 생성하여 등록합니다. 인스턴스가 수시로 생기고 사라지는 **쿠버네티스(K8s) Pod 및 AWS Auto Scaling** 환경에 완벽하게 대응합니다.
*   **사설망 및 방화벽 통과**: 노드가 방화벽이나 사설 IP(NAT) 뒤에 배치되어 있더라도 외장 포트 개방 없이 안전하게 통합 제어됩니다.
*   **인프라 유연성**: L4/L7 로드밸런서 구분 없이 작동하므로 별도의 URL 경로 라우팅 설정이 필요 없어 인프라 구성이 단순해집니다.

### 3.2. Direct 모드 (Static & Fixed Infrastructure)

Redis 없이 노드 간 직접 HTTP/WebSocket 연결을 수행하는 정적 인프라 방식입니다.

*   **적합한 환경**: IP와 노드 수량이 고정되어 있고 오토스케일링이 발생하지 않는 소규모 전용망 환경에 적합합니다.
*   **인프라 요구사항**: Nginx 등의 L7 역방향 프록시(Reverse Proxy) 또는 로드밸런서가 필수적입니다. 각 노드의 개별 접근 경로(예: `/console/nodes/node1/`, `/console/nodes/node2/`)를 해당 백엔드 서버의 고정 IP/포트로 정확히 전달하는 경로 기반 라우팅(Path-based Routing) 설정이 필요합니다.

**실제 Nginx 라우팅 설정 예시:**

```nginx
location /console/nodes/node1/ {
    proxy_pass          http://10.0.0.2:8080/console/nodes/node1/;
    proxy_http_version  1.1;
    proxy_buffering     off;
    proxy_cache_bypass  $http_upgrade;

    proxy_set_header    Upgrade             $http_upgrade;
    proxy_set_header    Connection          $http_connection;
    proxy_set_header    Host                $host;
    proxy_set_header    X-Real-IP           $remote_addr;
    proxy_set_header    X-Forwarded-For     $http_x_forwarded_for;
    proxy_set_header    X-Forwarded-Proto   $scheme;
    proxy_set_header    X-Forwarded-Host    $host;
    proxy_set_header    X-Forwarded-Port    $server_port;
    proxy_set_header    X-NginX-Proxy       true;

    # This is necessary to pass the correct IP to be hashed
    real_ip_header X-Real-IP;
}

location /console/nodes/node2/ {
    proxy_pass          http://10.0.0.3:8080/console/nodes/node2/;
    proxy_http_version  1.1;
    proxy_buffering     off;
    proxy_cache_bypass  $http_upgrade;

    proxy_set_header    Upgrade             $http_upgrade;
    proxy_set_header    Connection          $http_connection;
    proxy_set_header    Host                $host;
    proxy_set_header    X-Real-IP           $remote_addr;
    proxy_set_header    X-Forwarded-For     $http_x_forwarded_for;
    proxy_set_header    X-Forwarded-Proto   $scheme;
    proxy_set_header    X-Forwarded-Host    $host;
    proxy_set_header    X-Forwarded-Port    $server_port;
    proxy_set_header    X-NginX-Proxy       true;

    # This is necessary to pass the correct IP to be hashed
    real_ip_header X-Real-IP;
}
```

## 4. 노드 정체성 결정 메커니즘 (Node Identity Resolution)

노드가 기동될 때 수동 설정 없이도 자신의 정체성을 확립하는 자동 리졸빙 규칙을 가집니다.

### 4.1. 소속 그룹 (`Group ID`) 결정
1.  **System Property**: 자바 실행 속성 `-Daspectow.node.group` 값이 최우선 적용됩니다.
2.  **APON 설정**: `node-config.apon` 파일 내 `group` 블록의 ID를 자동으로 할당받습니다.
3.  **기본값**: 위 정보가 모두 없는 경우 `group1`이 기본 할당됩니다.

### 4.2. 노드 식별자 (`Node ID`) 결정
1.  **System Property**: 자바 실행 속성 `-Daspectow.node.id` 값이 최우선 적용됩니다.
2.  **동적 생성 (Gateway 모드)**: 지정된 ID가 없을 경우 **UUID 기반 고유 ID가 동적 생성**되어 오토스케일링 시 ID 충돌을 방지합니다.
3.  **기본값 (Direct 모드)**: Direct 모드에서는 고정된 `node1`을 기본값으로 사용합니다.

### 4.3. 콘솔 전용 노드 (`console`) 여부 결정 및 역할 분리
클러스터 내에서 관리 콘솔(Aspectow Console)을 호스팅하는 관리 전용 노드와 비즈니스 애플리케이션을 구동하는 서비스 노드의 역할을 분리할 수 있습니다.

1.  **System Property**: 자바 실행 속성 `-Daspectow.node.console=true` (또는 `false`) 값이 최우선 적용됩니다.
2.  **APON 설정**: `node-config.apon` 파일 내 `node` 블록에 `console: true`를 명시적으로 선언할 수 있습니다.
3.  **기본값**: 지정되지 않은 경우 기본값은 `false`(일반 서비스 노드)입니다.
4.  **역할 분리 및 안전한 클러스터 제어 (Role Separation & Safety)**:
    *   **안전한 빌드 및 배포 (Build & Deployment)**: 콘솔 노드에 `console: true`를 지정하면, Aspectow Console의 빌드 화면에서 `All Service Nodes` 타겟 선택 시 콘솔 노드가 자동으로 제외되어 자기 자신을 덮어쓰거나 재시작하여 관제 세션이 끊어지는 위험을 사전에 방지합니다.
    *   **클러스터 일괄 제어 (Cluster Bulk Control)**: 일괄 제어 모달에서 `Exclude Console` 옵션을 통해 콘솔 노드를 손쉽게 보호할 수 있으며, 콘솔 컨텍스트에 지원되지 않는 `PAUSE`/`RESUME` 명령이 콘솔 노드로 전송되지 않도록 원천 차단합니다.
    *   **시각적 식별성 강화**: Cluster Nodes 및 Scheduler 화면에서 콘솔 노드에 `[Console]` 뱃지가 부여되어 운영자가 역할을 한눈에 식별할 수 있습니다.

### 4.4. 그룹(Group)의 개념과 서비스 일관성 원칙
Aspectow Node Manager에서 **그룹(Group)**은 동일한 역할을 수행하는 노드 인스턴스들의 **논리적 스케일아웃(Scale-out) 집합**을 의미합니다.

*   **서비스 구성의 일관성**: 동일한 `Group ID`를 공유하는 노드들은 동일한 서비스 및 애플리케이션 명세를 제공하는 복제본(Replica)으로 간주됩니다.
*   **독립적인 서비스 분리**: 노드마다 호스팅하는 서비스나 내부 애플리케이션 구성이 서로 다른 경우, 단일 그룹에 혼합하지 않고 **서로 다른 `Group ID`로 분리**하여 독립적인 서비스 풀로 관리해야 합니다.
*   **설정 변경 시 운영 원칙**: 그룹 내 서비스 구성(예: AppMon 메타데이터 등)이 변경되는 경우, 해당 그룹 전체의 일관성을 유지하기 위해 **그룹 단위 롤링 재시작** 또는 **블루/그린 그룹 전환**을 권장합니다.

## 5. Redis 기반 동적 메타데이터 관리, 자가 치유(Self-Healing) 및 자율 삭제 (GC)

Gateway 모드에서는 노드가 수시로 생성되거나 소멸하더라도 관제 콘솔 대시보드가 항상 최신 클러스터 토폴로지를 유지할 수 있도록 Redis 기반의 동적 메타데이터 관리 및 자율 정리(Garbage Collection) 시스템을 운용합니다.

*   **자동 메타데이터 등록 및 자가 치유 (Automatic Registration & Self-Healing)**: 노드가 기동되면 자신이 속한 클러스터 및 그룹 정보, 노드 상세 사양, 구동 중인 애플리케이션 계층 구조(`그룹` &rarr; `노드` &rarr; `애플리케이션`)와 텔레메트리 지표 구성을 중앙 Redis 저장소에 즉시 등록합니다. 만약 일시적인 GC Pause나 네트워크 지연으로 노드가 일시 추방되었다가 재연결되더라도, `NodeRegistryListener`를 통해 애플리케이션 및 노드 메타데이터가 Redis에 자동으로 재등록되는 자가 치유(Self-Healing)를 지원합니다.
*   **실시간 계층 구조 구성 (Topology Construction)**: 관제 콘솔(Console)은 Redis에 수집된 동적 메타데이터를 기반으로 전체 클러스터의 계층 구조와 활성 노드 목록을 실시간으로 구성하고 대시보드에 시각화합니다.
*   **역할 분리 및 자율 데이터 정리 (Separation of Concerns & Cleanup)**: `NodeRegistry`는 순수하게 노드와 그룹 레지스트리 관리를 전담하며, 노드가 정상 종료되거나 좀비 타임아웃(기본 60초) 만료로 추방될 때 활성 노드가 없는 고아 그룹(Orphaned Group)을 Redis에서 자동으로 정리합니다. 애플리케이션 등 각 도메인 메타데이터의 등록과 정리는 `NodeRegistryListener`를 구독하는 해당 컴포넌트(예: AppMon)가 안전하게 자율 처리합니다.

## 6. 실전 APON 설정 및 XML 룰 구성

### 6.1. Gateway 모드 설정 (`/config/console/node-config.apon`)

```apon
cluster: {
    id: cloud-cluster1
    mode: gateway
    pulseInterval: 10000    # 펄스 전송 주기 (밀리초 단위, 기본값: 10000ms = 10초)
    pulseTimeout: 60000     # 좀비 판정 타임아웃 (밀리초 단위, 기본값: 60000ms = 60초)
    secret: {
        password: "your-cluster-secret-password"
    }
}
group: {
    id: backend-api
    title: Backend API Group
}
# 콘솔 전용 노드인 경우 (선택 사항)
node: {
    id: admin-console-node1
    title: Admin Console Node
    console: true
}
```

> **설정 가이드:**
> * `pulseInterval`: 노드가 자신의 생존 타임스탬프를 Redis에 갱신하는 주기입니다. 10초 설정을 통해 Redis 트래픽 부하를 최소화하면서 안정적인 상태 갱신을 유지합니다.
> * `pulseTimeout`: 노드 펄스가 수신되지 않을 때 좀비 노드로 판정하는 만료 기준 시간입니다. 기본값 60초는 일시적인 GC 지연이나 네트워크 순단 상황에서 오탐(Flapping)을 방지할 수 있는 충분한 유예 시간을 제공합니다.
> * `console`: 관리 콘솔 전용 인스턴스인 경우 `console: true`를 지정하거나 `-Daspectow.node.console=true`를 부여합니다.

### 6.2. Direct 모드 설정 (`/config/console/node-config.apon`)

```apon
cluster: {
    id: static-cluster1
    mode: direct
}
# 관리 콘솔 전용 노드
node: {
    id: console-node1
    title: Aspectow Console Node
    console: true
    port: 8082
    endpoint: {
        mode: auto
    }
}
# 서비스 노드 1
node: {
    id: node1
    title: Service Node 01
    port: 8091
    endpoint: {
        mode: auto
    }
}
# 서비스 노드 2
node: {
    id: node2
    title: Service Node 02
    port: 8092
    endpoint: {
        mode: auto
    }
}
```

### 6.3. Aspectran XML 빈 등록 (`node-rules.xml`)

```xml
<aspectran>
    <bean class="com.aspectran.aspectow.node.config.NodeConfigResolver">
        <property name="configLocation">/config/console/node-config.apon</property>
    </bean>

    <bean id="nodeManager" class="com.aspectran.aspectow.node.manager.NodeManagerFactoryBean" lazyDestroy="true"/>
    <bean id="remoteNodeManager" class="com.aspectran.aspectow.node.management.nodes.RemoteNodeManager"/>
    <bean id="remoteCommandManager" class="com.aspectran.aspectow.node.management.commands.RemoteCommandManager"/>
</aspectran>
```

## 7. 결론

Aspectow Node Manager는 분산 환경의 개별 서버들을 단순한 개별 인스턴스 모음이 아닌, **유기적이고 안전하게 연결된 지능형 클러스터 시스템**으로 진화시키는 결합체 역할을 수행합니다.
