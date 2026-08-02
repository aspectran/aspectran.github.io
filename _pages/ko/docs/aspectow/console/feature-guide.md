---
title: Aspectow Console 주요 화면 및 기능 가이드
teaser: Aspectow Console이 제공하는 클러스터 노드 관리, 원격 명령 센터, 분산 스케줄러, 실시간 AppMon 모니터링, 보안 Vault 및 개발자 유틸리티의 화면별 상세 기능 안내서입니다.
subheadline: Aspectow Console
---

## 1. 개요 및 전체 콘솔 레이아웃

Aspectow Console은 Aspectran 프레임워크 기반 애플리케이션의 모니터링, 클러스터링, 스케줄링, 보안 및 개발자 도구를 하나의 시각적 웹 인터페이스로 통합한 종합 관제 시스템입니다. 본 가이드는 Console의 각 화면이 제공하는 구체적인 기능, UI 구성 요소, 사용 방법 및 실무 운영 팁을 상세하게 다룹니다.

### 콘솔 레이아웃 구조

*   **좌측 사이드바 (Sidebar)**: Management, Utilities, Governance 섹션으로 구분된 계층형 내비게이션 메뉴입니다. 사용자의 계정 역할(Role) 및 권한(Permission)에 따라 접근 가능한 메뉴만 활성화됩니다.
*   **상단 헤더 (Top Bar)**: 현재 페이지의 위치 경로(Breadcrumb), 글로벌 검색 및 시스템 환경 프로필 정보가 위치합니다.
*   **우측 하단 프로필 & 로그아웃**: 로그인한 사용자의 닉네임, 계정명, 아바타 및 로그아웃 버튼이 위치합니다.

## 2. 홈 대시보드 (Home Dashboard)

Console에 로그인하면 처음 나타나는 중앙 제어판으로, 전체 시스템의 상태를 한눈에 파악하고 주요 모듈로 빠르게 진입할 수 있도록 돕습니다.

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-home-dashboard.png" alt="Aspectow Console Home Dashboard" %}

### 웰컴 헤드라인 및 안내

화면 상단에는 `Aspectow Management Console` 타이틀과 함께 현재 가동 중인 시스템을 환영하는 메세지가 위치하며, 시스템 전체의 가동 헬스 스태터스를 시각적으로 전달합니다.

### 핵심 모듈 바로가기 카드 (Stat Cards)

*   **Live Monitoring 카드**: 실시간 트래픽, JVM 메모리 힙, 쓰레드 풀 및 액티비티 모니터링 화면(`Aspectow AppMon`)으로 즉시 이동합니다.
*   **Cluster Operations 카드**: 클러스터 노드 상태 조회, 원격 명령 실행, 스케줄러 관리 화면으로 이동합니다.
*   **Security & Vault 카드**: PBE 암호화 토큰 관리 및 시스템 암호화 설정 화면으로 이동합니다.
*   **Developer Tools 카드**: AsEL 테스터, 와일드카드 검증기, APON 컨버터 등 런타임 개발 도구 모음으로 진입합니다.

## 3. 클러스터 관리 화면군 (Cluster Operations)

분산 클러스터 환경에 참여하고 있는 서버 인스턴스들과 분산 스케줄링 작업을 중앙에서 통제하는 화면 모음입니다.

### 3.1. 클러스터 노드 관리 (Cluster Nodes)

클러스터 내 모든 활성 노드(Node)의 생존 상태를 실시간 감시하고 일괄 제어 명령을 하사하는 화면입니다.

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-cluster-nodes.png" alt="Cluster Nodes Management Screen" %}

#### 상단 제어 바

*   **Total Node Count 뱃지**: 현재 클러스터에 연결된 총 노드 수를 `0 Nodes` 형태로 실시간 출력합니다.
*   **노드 검색 필드**: 노드 이름, IP 주소 또는 노드 ID를 입력하여 원하는 노드를 즉시 필터링합니다.
*   **Bulk Control 버튼**: `NODE_MANAGE`, `SUPER_ADMIN`, `DEMO` 권한을 가진 관리자에게 제공되며, 여러 노드에 동시 제어 명령을 내리는 모달을 호출합니다.
*   **Refresh 버튼**: 클릭 시 클러스터 노드 상태를 즉시 재조회하여 화면을 갱신합니다.

#### 클러스터 그룹 탭 (Cluster Tabs)

게이트웨이(Gateway) 클러스터 모드 구동 시, 노드들이 속한 그룹별로 탭이 자동 생성됩니다. `All Nodes` 탭에서는 전체 노드를 관찰하고, `Group Title` 탭에서는 특정 서버 그룹에 속한 노드만 분리하여 조회할 수 있습니다. 각 탭 옆에는 해당 그룹에 속한 노드 개수가 뱃지로 표시됩니다.

#### 노드 정보 카드

각 노드는 독립된 카드로 렌더링되며 다음 상세 정보들과 개별 액션 버튼을 제공합니다.
*   **Node Title & ID Badge**: 노드의 이름과 고정폭 폰트로 표시된 고유 노드 ID.
*   **Status Dot & Status Text**: 노드의 가동 상태를 색상 LED 점과 텍스트로 명확히 표시합니다. (초록색 `LIVE`: 정상 가동 중, 주황색 `PAUSED`/`STOPPING`: 일시 정지 또는 정지 중, 빨간색 `DEAD`: 연결 해제/다운)
*   **Host Address & Service Port**: 노드의 호스트 IP 주소 및 서비스 포트 번호.
*   **Node Group**: Gateway 클러스터 모드일 경우 해당 노드가 속한 노드 그룹명.
*   **Commands 버튼**: 클릭 시 원격 명령 센터로 즉시 이동하며, 해당 노드가 타겟으로 자동 선택됩니다.
*   **Metrics 버튼**: 클릭 시 해당 노드의 실시간 AppMon 모니터링 팝업 창이 새로 호출됩니다.
*   **Actions 드롭다운 메뉴**:
    *   **Pause Node** (노드가 `LIVE` 상태일 때 표시): 노드의 트랜잭션 수신 및 실행을 잠시 일시 정지시킵니다.
    *   **Resume Node** (노드가 `PAUSED` 상태일 때 표시): 일시 정지되었던 노드를 다시 정상 가동 상태로 복원합니다.
    *   **Restart Node**: 대상 노드 프로세스를 재시작합니다.

#### Bulk Control (일괄 제어) 모달

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-cluster-nodes-bulk-control.png" alt="Cluster Nodes Bulk Control Modal" %}

여러 노드를 다중 선택한 뒤 한 번의 클릭으로 일괄 제어 명령을 내릴 수 있습니다.
*   **1. Select Target Nodes**: `Select All` / `Deselect All` 버튼을 통해 클러스터 내 모든 노드 또는 특정 그룹/노드 체크박스를 손쉽게 다중 선택 및 해제할 수 있습니다.
*   **2. Action (제어 액션 선택)**:
    *   **PAUSE (일시 정지)**: 선택된 노드들의 상태를 일괄적으로 PAUSE(일시 정지) 상태로 전환합니다.
    *   **RESUME (재개)**: 일시 정지되어 있던 선택 노드들을 일괄적으로 RESUME(정상 가동) 상태로 복원합니다.
    *   **RESTART (재시작)**: 선택된 노드들을 일괄적으로 재시작합니다.

### 3.2. 원격 명령 센터 (Remote Commands)

클러스터 내의 원하는 대상 노드로 대화형 원격 명령(CLI/Shell Command)을 발송하고 결과를 확인하는 Command Center입니다.

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-remote-commands.png" alt="Remote Commands Center Screen" %}

#### 화면 레이아웃 (Grid System)

좌측의 350px 고정 폭 **명령 히스토리 패널**과 우측의 **대상 선택기, 명령 에디터, 콘솔 출력 패널**로 분할되어 있습니다.

#### Target Selector (대상 선택기)

명령을 수행할 대상을 선택합니다. `All Active Nodes`를 선택하면 클러스터 전체 노드에서 동시 실행되며, 특정 노드를 선택하면 해당 단일 노드로만 명령이 수신됩니다.

#### Command Editor (명령 에디터)

수행할 쉘 명령(Shell Command)이나 Aspectran 관리자 명령을 작성하는 입력창입니다. 멀티 라인 스크립트 작성을 지원하며 `Execute` 버튼을 누르면 비동기 명령 버스를 통해 명령이 수신 및 실행됩니다.

#### Console Output (실시간 콘솔 출력)

명령 실행 결과가 노드별 탭(Tab)으로 구분되어 실시간 스트리밍됩니다.
*   **Standard Output**: 일반 실행 결과는 표준 흰색/밝은 텍스트로 출력됩니다.
*   **Standard Error**: 실행 실패나 에러 메시지는 빨간색 텍스트로 명확히 구분 출력됩니다.

#### History Panel (명령 히스토리)

과거 실행했던 명령들의 기록이 타임스탬프, 타겟 노드, 성공/실패 뱃지, 명령 텍스트 미니 프리뷰 형태로 저장됩니다. 히스토리 항목을 클릭하면 작성 중이던 에디터에 해당 명령과 타겟 설정이 즉시 복원되어 손쉽게 재실행할 수 있습니다.

### 3.3. 스케줄러 관리자 (Scheduler Manager)

클러스터 환경에 등록된 Aspectran Scheduler 서비스 및 분산 잡(Job)을 모니터링하고 통제하는 화면입니다. 상단 뷰 전환 컨트롤을 통해 전체 노드를 한눈에 관찰하는 **Dashboard 뷰**와 특정 노드를 집중 제어하는 **Detail View**의 두 가지 뷰 모드를 지원합니다.

#### Dashboard (대시보드) 뷰

클러스터 전체 노드의 스케줄러 가동 상태와 통합 로그를 종합 관찰하는 뷰 모드입니다.

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-scheduler-dashboard.png" alt="Scheduler Manager Dashboard View" %}

*   **요약 지표 카운터 (Summary Section)**: 클러스터 전체의 Active Schedules(활성 스케줄 수), Active Jobs(활성 잡 수), Isolated Items(격리 항목 수) 및 Target Node 수치를 한눈에 조망합니다.
*   **전체 노드 카드 그리드**: 클러스터 내 각 노드가 그리드 카드로 렌더링됩니다. 노드 카드에는 노드 타이틀, 소속 그룹, 헬스 상태(Live/Dead/Connecting LED 인디케이터) 및 실행 중인 스케줄/잡의 수치가 표시됩니다. 특정 노드 카드를 클릭하면 펄싱(Pulsing) 애니메이션과 함께 해당 노드의 Detail View로 즉시 전환됩니다.
*   **클러스터 통합 스케줄러 로그 콘솔**: 화면 하단에 위치한 다크 테마 콘솔 박스로, **클러스터 내 모든 노드에서 발생하는 스케줄러 시작, 종료, 트리거 실행 및 에러 로그**가 실시간으로 수집 및 스트리밍됩니다. 로그 일시정지(Pause), 화면 지우기(Clear), 로그 창 전체 화면(Expanded) 확장 기능을 제공합니다.

#### Detail View (상세 보기) 뷰

노드 셀렉터를 통해 선택한 특정 노드의 스케줄러 서비스를 집중 모니터링하고 잡(Job)을 동적으로 통제하는 뷰 모드입니다.

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-scheduler-detail-view.png" alt="Scheduler Manager Detail View Screen" %}

*   **스케줄러 서비스 카드**: 선택된 노드에 등록된 스케줄러 서비스명, 전체 잡 수, 활성 크론 수, Running/Paused 가동 상태 뱃지를 보여줍니다.
*   **Isolated Mode (격리 모드) 안내**: 해당 스케줄러 잡이 특정 노드에 전속되어 실행 중인지, 클러스터 공유 분산 락(Distributed Lock) 기반으로 구동 중인지를 황색 경고 아이콘으로 안내합니다.
*   **스케줄 잡 상세 테이블 (Job Table)**: 각 배치 잡의 이름, Trigger Type(Cron vs Simple Interval), Cron 표현식(예: `0 0/5 * * * ?` - 5분 주기로 실행), 다음 실행 예정 시각, 직전 실행 시각 및 수동 실행 상태 뱃지를 제공합니다.
*   **잡 동적 제어 버튼**:
    *   `Pause` / `Resume`: 특정 잡의 자동 실행을 일시 정지하거나 다시 재개합니다.
    *   `Job Details`: 잡에 정의된 세부 파라미터 및 실행 히스토리 모달을 불러옵니다.
*   **선택 노드 전용 스케줄러 로그 콘솔**: 선택한 특정 노드에서 발생하는 스케줄러 실행 로그만 필터링하여 실시간 테일링으로 관찰할 수 있습니다.

#### 스케줄러 일괄 제어 (Bulk Control) 모달

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-scheduler-bulk-control.png" alt="Scheduler Manager Bulk Control Modal" %}

클러스터 내 여러 노드에 분산 등록된 특정 스케줄(Schedule)이나 잡(Job)을 상대로 한 번에 일괄 제어 명령을 하사합니다.
*   **1. Select Target Nodes**: `Select All` / `Deselect All` 버튼을 통해 클러스터 내 모든 노드 또는 특정 그룹/노드 체크박스를 선택/해제합니다.
*   **2. Service Name (선택 사항)**: 제어를 적용할 스케줄러 서비스 이름을 지정합니다. (비워둘 경우 모든 서비스에 매칭 적용)
*   **3. Target Type & ID**: 제어할 대상을 `Schedule` 또는 `Job` 단위로 선택하고, 대상 식별자(Schedule ID 또는 Job ID, 예: `SyncBackupSchedule`)를 입력합니다.
*   **4. Action (일괄 제어 액션)**:
    *   **ENABLE (일괄 활성화)**: 선택 노드들의 대상 스케줄/잡을 동시 활성화합니다.
    *   **DISABLE (일괄 비활성화)**: 선택 노드들의 대상 스케줄/잡을 동시 비활성화(일시 정지)합니다.

## 4. 실시간 모니터링 (AppMon Integration)

Console 내에 통합된 AppMon 엔진을 통해 애플리케이션의 실시간 활동, JVM 리소스, 세션 및 로그 스트리밍을 감시합니다.

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/appmon-v4-dashboard-dark.png" alt="AppMon Live Monitoring Dashboard" %}

### 4.1. 노드 그룹 & 애플리케이션 탭 내비게이션 (Group & App Tabs)

*   **노드 그룹 탭 (Group Tabs)**: 서버 그룹이나 클러스터를 논리적으로 분리하여 전환합니다.
*   **애플리케이션 탭 (App Tabs)**: 도메인 내의 개별 애플리케이션 인스턴스를 전환하며, 탭 이동 시에도 심리스하게 모니터링 데이터가 동기화됩니다.

### 4.2. 서버 리소스 및 성능 지표

*   **Heap Status**: JVM 힙 메모리의 현재 사용량과 최대 한도를 비교하여 GC 상태와 메모리 누수를 감지합니다.
*   **Undertow Thread Pool**: 활성 쓰레드와 전체 풀 크기를 비교하여 서버의 동시 처리 부하를 체크합니다.
*   **Activity Status**: Active Activity(현재 동시 처리 중인 실시간 요청 수), Current Period Count(현재 5분 주기의 신규 유입 수, 예: `+14`), Cumulative Total(서버 가동 후 누적 전체 활동 수 `p.cumulative`).
*   **5분 주기 집계 타이머**: 하단의 타이머(예: `233/300`)가 300초(5분) 집계 구간의 진행 상태를 나타냅니다. `300/300` 도달 시 집계 데이터를 DB에 저장하고 차트에 반영합니다.

### 4.3. Canvas 기반 트래픽 시각화 (Traffic Flow)

사용자 요청(Activity)이 화면 좌측에서 우측으로 이동하는 '총알(Bullet)' 애니메이션으로 실시간 시각화됩니다.
*   **응답 시간 비례 감속**: 응답 시간이 길수록 총알 속도가 최대 60%까지 감속되어 시스템 지연을 시각적으로 체감시킵니다.
*   **체류 시간 & 핫스팟 (Hot Core)**: 무거운 요청일수록 우측 벽면에 오래 박혀 머무르며, 활동 지수가 높은 헤비 유저의 요청은 총알 중심에 **하얀 핵(Hot Core)**이 생성되어 즉시 눈에 띕니다.
*   **상태별 색상**: 초록색(정상), 노란색(500ms 이상 지연), 빨간색(오류 발생).

### 4.4. 세션 관리 및 IP 기반 국가 식별

*   **IP 기반 Geo Location**: 접속자의 IP 주소를 해석하여 국가별 국기 아이콘을 실시간 표시합니다.
*   **세션별 활동 카운트**: 활성 세션 리스트와 함께 각 세션이 발생시킨 실시간 활동량을 숫자로 보여주어 헤비 유저를 탐지합니다.

### 4.5. 다차원 차트 및 전문 로그 콘솔

*   **시계열 분석 차트**: Activities & Sessions 추이를 5분, 시간, 일, 월, 년 단위로 전환해가며 장단기 트래픽 흐름을 분석합니다.
*   **실시간 로그 테일링**: 소켓 기반으로 서버 로그를 지연 없이 스트리밍하며 일시정지(Pause), 화면 지우기(Clear), 전체 화면(Full-screen)을 지원합니다.
*   **역방향 무한 스크롤 (Previous Logs)**: 로그 박스 최상단으로 스크롤 시 '이전 로그 더 보기' 버튼이 활성화되어, 실시간 스트리밍 중에도 과거 로그 데이터로 거슬러 올라가 전후 맥락을 탐색할 수 있습니다.

## 5. 보안 및 Vault 관리 (Security & Vault)

시스템 보안 비밀번호 및 PBE(Password-Based Encryption) 암호화 토큰을 중앙 관리하는 섹션입니다.

### 5.1. Vault 토큰 관리 (Vault Management)

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-vault-management.png" alt="Vault Management Screen" %}

#### 상단 컨트롤 바

*   **Total Tokens 뱃지**: 등록된 전체 보안 토큰 수를 표시합니다.
*   **검색 필드**: 토큰 이름이나 키워드로 실시간 검색합니다.
*   **Page Size Select**: 페이지당 표시할 토큰 수(Auto, 10, 20, 30, 50, 100)를 선택합니다.
*   **Hide Expired 토글 스위치**: 만료된 토큰을 목록에서 숨기거나 표시합니다.
*   **New Token 버튼**: 신규 보안 토큰 발급 모달을 호출합니다.

#### System Encryption Configuration 카드

현재 애플리케이션에 설정된 시스템 암호화 구성을 검증하는 헤더 카드입니다.
*   **PBE Algorithm**: 적용된 암호화 알고리즘 (예: `PBEWithHmacSHA256AndAES_256`).
*   **Key Parameters**: Key Length, Iteration Count 및 Salt 생성기 렌더링 상태 표시.

#### Vault Table (토큰 상세 목록)

각 토큰의 이름, 암호화된 키/값 미니 프리뷰, 생성 일자, 만료 일자 및 상태(Active/Expired 뱃지)가 표시되며, 키 복사(Copy Key), 상세 보기, 토큰 폐기(Revoke) 액션을 제공합니다.

#### New Token (신규 보안 토큰 발급) 모달

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-vault-new-token.png" alt="Vault Management New Token Modal" %}

새로운 보안 토큰을 생성하고 대용량/단일 암호화 데이터를 PBE 알고리즘으로 안전하게 저장합니다.
*   **Label**: 보안 토큰의 식별 이름을 입력합니다. (예: `DB_PASSWORD`, `API_SECRET_KEY`)
*   **Token Type**:
    *   `SIMPLE`: 단순 원시 암호화(Raw Encryption) 토큰으로 암호화 문자열을 직접 보관합니다.
    *   `PERSISTENT`: APON 데이터 구조 기반의 지속성 보안 토큰으로 보관합니다.
    *   `TIME_LIMITED`: APON 데이터 구조와 만료 시간이 함께 적용되는 시한성 토큰입니다.
*   **Plain Text Value**: PBE 암호화하여 Vault 저장소에 기록할 평문(Plaintext) 데이터를 입력합니다. (다중 행 입력 필드)
*   **Description**: 토큰의 사용 목적 및 비고 설명을 작성합니다.
*   **Expiration (Minutes)**: 토큰의 유효 기간을 분 단위로 설정합니다. `0` 입력 시 만료 시간이 적용되지 않는 영구 토큰으로 발급됩니다.
*   **보안 제약 및 수정 정책**: `Save & Encrypt` 버튼 클릭 시 평문 데이터가 즉시 PBE 암호화되어 기록됩니다. 보안 유지를 위해 발급 완료된 토큰은 **토큰 유형(Token Type), 유효 기간, 평문 데이터의 수정이 불가능(Read-only)**하며, 라벨 및 설명 수정만 허용됩니다.

### 5.2. Vault Tool (보안 유틸리티)

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-vault-tool.png" alt="Vault Interactive Tool Screen" %}

개발자와 관리자가 민감한 데이터(DB 비밀번호, API 키 등)를 암호화하거나 복호화할 수 있는 대화형 실험실 도구입니다.

*   **암/복호화 실행 폼**: 알고리즘(Algorithm), 비밀번호(Password), Salt 값 및 모드(Encrypt/Decrypt)를 설정하고 텍스트 암/복호화를 실행합니다.
*   **실행 결과 및 히스토리**: 연산된 결과 텍스트 복사 기능 및 과거 암/복호화 실행 이력(시간, 모드, 알고리즘)을 확인하고 손쉽게 재실행(Restore)할 수 있는 히스토리 목록을 제공합니다.

## 6. 프레임워크 진단 및 개발자 유틸리티 (Framework & Developer Tools)

Aspectran 프레임워크 런타임 진단 및 개발 생산성을 극대화하기 위한 도구 모음입니다.

### 6.1. Configuration (프레임워크 구성 뷰어)

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-framework-config.png" alt="Framework Configuration Viewer" %}

현재 구동 중인 Aspectran 프레임워크의 런타임 구성 정보, 로딩된 규칙 파일(Rule Files)의 계층 구조 및 활성화된 환경 프로필(`dev`, `prod`, `test` 등)을 트립 뷰어로 조회합니다.

### 6.2. Anatomy (프레임워크 해부 뷰어)

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-framework-anatomy.png" alt="Framework Anatomy Viewer" %}

Aspectran의 심장부인 `ActivityContext` 내부 구조를 해부학적으로 분석합니다.
*   **Bean Registry**: 등록된 모든 빈(Bean)의 ID, 클래스 타입, 스코프(singleton, prototype, request, session), Lazy Init 여부 및 의존성 관계.
*   **Translet Registry**: 정의된 모든 트랜슬릿(Translet)의 이름, HTTP 요청 매핑 방식, Action 실행 구조 및 View Forwarding 설정.
*   **Aspect Registry**: AOP 어스펙트의 Pointcut 패턴 및 Before/After/Around Advice 동작 정의.

### 6.3. Wildcard Tester (패턴 검증기)

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-wildcard-tester.png" alt="Wildcard Pattern Tester Tool" %}

Aspectran의 와일드카드 패턴 매처 동작을 실시간 검증하는 도구입니다. 화면 상단의 **Wildcard Guide** 버튼을 통해 [Aspectran 와일드카드 패턴 매칭 가이드](https://aspectran.com/ko/docs/guides/aspectran-wildcard-matching/) 공식 문서로 바로 이동하여 패턴 문법을 상세히 참조할 수 있습니다.
*   **Pattern Input**: 검증할 패턴(예: `/users/**/details`, `*.do`)을 입력합니다.
*   **Test Paths**: 테스트할 여러 경로들을 입력창에 주입합니다.
*   **Match Results**: 각 경로별 매칭 성공(Success) / 실패(Mismatch) 여부와 패턴 매칭 시 추출된 변수(Extracted Variables) 바인딩 결과를 실시간 시연합니다.

### 6.4. AsEL Tester (표현식 평가기)

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-asel-tester.png" alt="AsEL Expression Tester Tool" %}

Aspectran Expression Language (AsEL) 문법을 대화형으로 실행하고 평가하는 도구입니다. 상단의 **AsEL Guide** 버튼을 통해 [AsEL(Aspectran Expression Language) 소개](https://aspectran.com/ko/docs/guides/introduce-asel/) 공식 가이드 문서로 이동하여 표현식 객체 평가 규칙 및 문법 구조를 확인할 수 있습니다.
*   **Expression Input**: AsEL 표현식(예: `#{sysProps['user.home']}`, `@{beanId.methodName()}`) 입력.
*   **Context Variables**: 평가 시 사용할 샘플 변수 데이터 입력.
*   **Evaluation Result**: 평가된 결과값, 리턴 객체 데이터 타입, 실행 소요 시간(ms)을 출력합니다.

### 6.5. APON Converter (데이터 변환기)

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-apon-converter.png" alt="APON Data Converter Tool" %}

APON(Aspectran Parameter Object Notation) 데이터와 JSON 형식 간의 양방향 구조 변환기입니다. 상단의 **APON Guide** 버튼을 통해 [APON(Aspectran Parameters Object Notation) 소개](https://aspectran.com/ko/docs/guides/introduce-apon/) 공식 문서로 바로 이동하여 APON 데이터 명세와 구문 규칙을 탐색할 수 있습니다.
*   **APON 패널 (좌측)**: APON 데이터를 입력하고 `Parse to JSON` 버튼을 통해 JSON으로 변환합니다.
*   **JSON 패널 (우측)**: JSON 데이터를 입력하고 APON 출력 스타일(`PRETTY`, `SINGLE_LINE`, `COMPACT`)을 선택한 뒤 `APON` 버튼을 통해 APON으로 변환합니다.
*   **Quick Tools**: 데이터 초기화(`Clear All`) 및 샘플 데이터 로드(`Load Sample`) 유틸리티를 제공합니다.

## 7. 계정 관리 및 감사 (Governance & Accounts)

Console 사용자 계정과 보안 감사 로그를 관장하는 섹션입니다.

### 7.1. 사용자 계정 관리 (User Management)

#### 사용자 계정 목록 (User Accounts List)

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-user-management.png" alt="User Management Screen" %}

*   **사용자 목록 & 검색**: 콘솔에 등록된 사용자 계정(Username, Nickname, Email, Status, Roles)을 관리합니다.
*   **Role Permissions 모달**: `SUPER_ADMIN`, `ADMIN`, `DEMO` 역할에 매핑된 세부 권한 현황표를 조회합니다.

#### 사용자 생성 및 수정 모달 (New / Edit User Modal)

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-user-management-modal.png" alt="User Management Modal Screen" %}

*   **기본 계정 프로필**: 사용자 식별 ID(`Username`), 닉네임(`Nickname`), 이메일 주소(`Email`), 계정 상태(`Status`: `NORMAL`, `LOCKED`, `DISABLED`)를 설정합니다.
*   **계정 잠금(Lockout) 해제**: 비밀번호 5회 연속 오류로 자동 잠긴(`LOCKED`) 계정은 모달에서 상태를 `NORMAL`로 변경하여 즉시 잠금을 해제할 수 있습니다.
*   **역할 및 핀포인트 권한 (Roles & Direct Permissions)**: `SUPER_ADMIN`, `ADMIN`, `DEMO` 등 기본 역할 외에 기능별 세부 권한(`USER_MANAGE`, `NODE_MANAGE`, `VAULT_MANAGE` 등)을 체크박스로 정교하게 개별 부여합니다.
*   **접속 허용 IP 제한 (`Allowed IPs`) 설정**:
    *   개별 운영자 계정별로 콘솔 접속이 허용되는 IP 패턴(`allowedIps`)을 지정하여 무단 접속을 엄격히 방어합니다.
    *   단일 IP(`192.168.1.50`, `10.0.0.100`), IP 대역 와일드카드(`192.168.1.*`, `10.0.*.*`), 쉼표/공백으로 구분된 다중 패턴 입력을 지원합니다. (`null` 또는 미입력 시 IP 제약 없이 접속 허용)
    *   지정된 IP 패턴과 일치하지 않는 환경에서 접속 시도 시 비밀번호가 맞더라도 로그인이 즉시 거부되며 감사 로그에 기록됩니다.

### 7.2. 로그인 이력 탐색 (Login History Audit)

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-login-history.png" alt="Login History Audit Screen" %}

콘솔에 로그인했던 사용자들의 접속 일시, 클라이언트 IP 주소, IP 기반 Geo Location(국가 국기 아이콘), 로그인 성공/실패 여부, 실패 사유 및 User-Agent 정보를 감사(Audit) 로그로 제공하여 시스템 접근 보안을 철저히 검증합니다.

### 7.3. 보안 감사 로그 (Security Audit Log)

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-audit-log.png" alt="Security Audit Log Screen" %}

콘솔 제어 권한 행사, 계정 설정 변경, Vault 보안 토큰 관리 등 시스템 전반의 고위험 작업 내역을 실시간으로 추적하고 감사하는 보안 모니터링 화면입니다.

*   **실시간 감사 대상 이벤트**:
    *   사용자 계정 생성, 수정, 삭제 및 계정 잠금/해제 처리
    *   역할(Role) 및 핀포인트 권한(Permission) 변경
    *   Vault 보안 토큰 발급, 수정, 폐기 및 System Encryption 설정 조회
    *   비허용 IP 접속 시도 차단 (`[LOGIN_FAILED_UNALLOWED_IP]`)
*   **검색 및 필터링**: 실행자 계정(Username), 작업 유형 키워드(Action), 처리 결과(Success/Failed) 및 기간 조건으로 감사 로그를 정밀 조회합니다.
*   **감사 상세 정보 모달**: 감사 항목 클릭 시 실행자 ID, 접속자 IP 주소, 대상 자원(Target Resource), 작업 수행 전/후 데이터 패킷 및 상세 사유를 JSON/텍스트 뷰어로 확인하여 보안 인시던트 조사를 지원합니다.
