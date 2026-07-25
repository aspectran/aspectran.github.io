---
title: Aspectow Console 개요 및 통합 아키텍처
teaser: Aspectow Console은 Aspectran 기반 애플리케이션 서버 생태계의 노드 클러스터, 스케줄러, 실시간 모니터링, 보안 Vault 및 개발자 도구를 중앙에서 통합 제어하는 차세대 관제 시스템입니다.
subheadline: Aspectow Console
---

## 1. Aspectow Console의 탄생 배경과 비전

Aspectran 프레임워크와 Aspectow 서버 생태계가 엔터프라이즈 환경으로 확장됨에 따라, 단일 서버 인스턴스를 넘어 다수의 분산 노드(Node Cluster)와 복잡한 배치 스케줄러, 실시간 성능 지표, 그리고 보안 암호화 키를 체계적으로 관리해야 하는 필요성이 대두되었습니다.

이전에는 모니터링 기능이 `Aspectow AppMon`이라는 별도의 솔루션으로 제공되었습니다. 그러나 운영 환경에서는 시스템 상태를 관찰하는 것에 그치지 않고, 문제가 발생한 노드에 원격 명령을 하사하거나, 스케줄러 잡을 수동으로 재실행하고, 암호화 토큰의 상태를 즉시 변경하는 등의 **통합 제어 능력**이 필요했습니다.

Aspectow Console은 이러한 요구를 완벽히 충족하기 위해 기존 AppMon의 고성능 실시간 모니터링 엔진을 내부로 통합하는 동시에, 분산 노드 제어, 원격 명령 센터, 보안 Vault 관리, 런타임 프레임워크 진단 및 사용자 거버넌스 기능을 하나의 웹 콘솔 인터페이스로 완성한 종합 관제 솔루션입니다.

## 2. 통합 아키텍처 및 시스템 레이어

### 노드 내장형 관제 아키텍처 (Self-Contained Every-Node Console)

Aspectow Console은 별도의 중앙 관리 서버(Admin Server/DMGR)를 추가 설치할 필요가 없는 **노드 내장형 관제 아키텍처**를 채택하고 있습니다. 클러스터 내 모든 서버 노드가 자체적으로 관제 콘솔 기능을 내장하고 있어, 특정 관리 전용 서버의 단일 장애점(SPOF) 우려를 해소하며, 살아있는 어떤 노드의 웹 인터페이스에 접속하더라도 클러스터 전체 상태를 모니터링하고 제어할 수 있는 높은 가용성을 선사합니다.

Aspectow Console은 이러한 노드 내장형 관제 기능을 통해 높은 응답성과 낮은 모니터링 오버헤드를 달성하며, 아래와 같은 시스템 레이어로 구성되어 있습니다.

### 제어 노드(Console Web Context) 레이어

Console은 Aspectran 애플리케이션 서버 위에서 중앙 제어 노드(Control Node) 역할을 수행합니다. Thymeleaf 템플릿 기반의 모던 HTML5 인터페이스와 반응형 웹 디자인을 채택하여, 데스크톱과 모바일 환경 모두에서 끊김 없는 관리 환경을 제공합니다.

### 클러스터 통신 및 노드 관리자 (NodeManager Architecture)

Console은 `com.aspectran.aspectow.node` 패키지에 구현된 노드 관리자 엔진을 통해 클러스터 내의 모든 워커 노드들과 통신합니다.

*   **`NodeManager` & `NodeRegistry`**: 클러스터에 참여한 모든 노드의 생존 상태(Pulse/Heartbeat), 시스템 프로필, 힙 메모리 및 구동 중인 애플리케이션 정보를 수집하여 레지스트리에 유지보수합니다.
*   **`RemoteNodeManager`**: 웹 UI의 클러스터 노드 관제 요청을 수신하여 노드 개별 핑(Ping) 테스트, 노드 상세 정보 수집, 노드 일괄 제어(Bulk Control: Graceful Shutdown, Hard Stop, Config Reload 등) 작업을 중계합니다.
*   **`RemoteCommandManager`**: 웹 UI의 Command Center와 연동되어 지정된 대상 노드로 CLI/쉘 명령을 전달하고, 노드에서 출력되는 실시간 StdOut 및 StdErr 스트리밍 데이터를 UI로 브릿징합니다.
*   **`RemoteSchedulerManager`**: 클러스터 내 각 노드에 분산 등록된 Aspectran Scheduler 서비스들의 잡(Job) 상태를 조회하고, 일시 정지(Pause), 재개(Resume) 제어 패킷을 전달하며 실행 로그를 실시간 중계합니다.

### 통신 모드 및 메시지 파이프라인 (`direct` vs `gateway`)

Console은 인프라 환경에 맞춰 두 가지 클러스터 통신 모드를 선택할 수 있습니다.
*   **Direct 통신 모드**: 외부 메시지 브로커 없이 Console과 노드 간에 직접 HTTP/WebSocket 통신을 수행하며, 소규모 및 고정 IP 환경에 적합합니다.
*   **Gateway 통신 모드 (Redis Pub/Sub)**: `RedisConnectionPoolConfig` 기반의 Redis 메시지 버스를 활용하여 메시지를 주고받습니다. 사설망, 쿠버네티스(Kubernetes) 및 오토스케일링(Autoscaling) 환경에서 노드가 동적으로 조인/탈퇴하더라도 완벽하게 상태를 감시하고 제어할 수 있습니다.

### AppMon 통합 모니터링 엔진

AppMon 모듈은 Console 내부에 1급 구성 요소(First-class citizen)로 탑재되어 구동됩니다.
*   **내장(Embedded) 구동 모드**: Console 서버가 구동될 때 AppMon 엔진이 함께 활성화되어 별도의 전용 모니터링 서버를 배포하지 않고도 실시간 트래픽(Traffic Flow), 세션 상태, 로그 테일링을 관찰할 수 있습니다.
*   **독립(Standalone) AppMon 엔진 호환성**: 기존에 독립적으로 설치되어 구동 중인 Aspectow AppMon 서버들과의 연동을 지원합니다. Console은 외부 AppMon 엔드포인트를 등록하여 모니터링 뷰어를 멀티 도메인 형태로 중앙에서 통합 관찰할 수 있습니다.

### 데이터 영속성 및 보안 Vault 레이어

Console은 관리자 계정, 역할 권한(Role Permissions), 시스템 암호화 토큰, 그리고 스케줄러 실행 이력을 안전하게 보관합니다.
*   **PBE (Password-Based Encryption) 기반 데이터 보호**: Vault 모듈은 시스템의 민감한 비밀번호와 토큰을 PBE 알고리즘으로 암호화하여 저장소에 기록합니다.
*   **사전 집계(Pre-aggregation) 모니터링 DB**: AppMon 모니터링 데이터는 5분, 1시간, 1일 단위로 사전 집계되어 DB에 저장되므로, 대용량 트래픽 상황에서도 대시보드 조회가 지연되지 않습니다.

## 3. 권한 및 세분화된 접근 제어 (Governance & Security)

운영 환경에서의 안전한 관리를 위해 Aspectow Console은 정교한 RBAC(Role-Based Access Control) 권한 체계를 탑재하고 있습니다.

### 기본 제공 역할 (Roles)

*   **SUPER_ADMIN (최고 관리자)**: 시스템의 모든 설정 변경, 사용자 계정 관리, 원격 명령 실행, Vault 토큰 발행 및 클러스터 노드 일괄 제어 권한을 행사합니다.
*   **ADMIN (운영 관리자)**: 클러스터 노드 상태 조회, 스케줄러 잡 실행/정지, 모니터링 및 실시간 로그 조회를 수행할 수 있습니다.
*   **DEMO / MONITOR_VIEW (관찰자)**: 데이터 변경이나 시스템 제어가 불가능하며, 모니터링 대시보드와 읽기 전용 뷰어에만 접근 가능한 안전한 조회 전용 권한입니다.

### 핀포인트 권한 (Fine-grained Permissions)

역할 외에도 특정 기능 단위로 권한을 부여하거나 박탈할 수 있습니다.
*   `NODE_MANAGE`: 클러스터 노드 일괄 제어 및 상태 변경 권한
*   `COMMAND_EXECUTE`: 원격 명령 센터를 통한 쉘/콘솔 명령 실행 권한
*   `MONITOR_VIEW`: 실시간 트래픽, 세션 및 로그 모니터링 접근 권한
*   `USER_MANAGE`: 계정 등록, 수정, 역할 부여 및 비밀번호 재설정 권한

## 4. 독립 AppMon과의 관계 및 활용 시나리오

Aspectow Console의 탄생으로 기존 `Aspectow AppMon`의 입지가 대체되는 것은 아닙니다. 두 기술은 상호 보완적으로 운용됩니다.

*   **단독 모니터링이 필요한 경우**: 관제 기능이나 노드 제어 없이 순수하게 특정 애플리케이션의 이벤트/로그 모니터링만 원할 때는 `Aspectow AppMon`을 독립 모듈로 가볍게 설치하여 운용할 수 있습니다.
*   **통합 관리 및 제어가 필요한 경우**: 여러 서버 인스턴스를 클러스터로 묶고, 스케줄러와 원격 제어, 보안 토큰 관리까지 포함된 통합 관제 시스템이 필요할 때는 `Aspectow Console`을 도입하여 구동합니다.

다음 문서인 [Aspectow Console 주요 화면 및 기능 가이드](/ko/docs/aspectow/console/feature-guide/) 및 [Aspectow Console 구성 가이드](/ko/docs/aspectow/console/configuration-guide/)를 참조하여 실제 화면 기능과 환경 설정 방법을 상세히 확인해 보세요.
