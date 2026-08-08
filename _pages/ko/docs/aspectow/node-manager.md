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
클러스터에 참여하는 모든 노드의 생명주기를 관장합니다. 노드는 기동 시 자신의 상세 메타데이터(`NodeInfo`)를 등록하고, 주기적인 생존 신호(Pulse)를 발송합니다. 관제 콘솔(Aspectow Console)은 이 펄스 신호를 감지하여 활성 노드의 실시간 상태(Live, Paused, Dead)를 직관적으로 추적합니다.

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

## 5. Redis 기반 동적 메타데이터 관리 및 자율 삭제 (GC)

Gateway 모드에서는 노드가 수시로 생성되거나 소멸하더라도 관제 콘솔 대시보드가 항상 최신 클러스터 토폴로지를 유지할 수 있도록 Redis 기반의 동적 메타데이터 관리 및 자율 정리(Garbage Collection) 시스템을 운용합니다.

*   **자동 메타데이터 등록 (Automatic Registration)**: 노드가 기동되면 자신이 속한 클러스터 및 그룹 정보, 노드 상세 사양, 구동 중인 애플리케이션 계층 구조(`그룹` $\rightarrow$ `노드` $\rightarrow$ `애플리케이션`)와 텔레메트리 지표 구성을 중앙 Redis 저장소에 즉시 등록합니다.
*   **실시간 계층 구조 구성 (Topology Construction)**: 관제 콘솔(Console)은 Redis에 수집된 동적 메타데이터를 기반으로 전체 클러스터의 계층 구조와 활성 노드 목록을 실시간으로 구성하고 대시보드에 시각화합니다.
*   **자율 데이터 정리 (Automatic Cleanup / GC)**: 노드가 정상 종료되거나, 비정상 종료(Crash) 또는 오토스케일인(Scale-in)으로 인해 동적으로 제거되는 경우, 생존 신호(Pulse) 모니터링 메커니즘이 신호 만료를 감지합니다. 일정 대기 시간 후 더 이상 유효하지 않은 묵은(Stale) 노드 메타데이터를 Redis에서 자동으로 깨끗하게 자율 정리(Cleanup)하여 메모리 누수와 오탐을 방지합니다.

## 6. 실전 APON 설정 및 XML 룰 구성

### 6.1. Gateway 모드 설정 (`/config/console/node-config.apon`)

```apon
cluster: {
    id: cloud-cluster1
    mode: gateway
    secret: {
        password: "your-cluster-secret-password"
    }
}
group: {
    id: backend-api
    title: Backend API Group
}
```

### 6.2. Direct 모드 설정 (`/config/console/node-config.apon`)

```apon
cluster: {
    id: static-cluster1
    mode: direct
}
node: {
    id: node01
    group: group1
    title: Primary Server 01
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
