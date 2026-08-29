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

## 2. 홈 대시보드

Console에 로그인하면 처음 나타나는 중앙 제어판으로, 전체 시스템의 상태를 한눈에 파악하고 주요 모듈로 빠르게 진입할 수 있도록 돕습니다.

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-home-dashboard.png" alt="Aspectow Console Home Dashboard" %}

### 웰컴 헤드라인 및 안내

화면 상단에는 `Aspectow Management Console` 타이틀과 함께 현재 가동 중인 시스템을 환영하는 메세지가 위치하며, 시스템 전체의 가동 헬스 스태터스를 시각적으로 전달합니다.

### 핵심 모듈 바로가기 카드

*   **Live Monitoring 카드**: 실시간 트래픽, JVM 메모리 힙, 쓰레드 풀 및 액티비티 모니터링 화면(`Aspectow AppMon`)으로 즉시 이동합니다.
*   **Cluster Operations 카드**: 클러스터 노드 상태 조회, 원격 명령 실행, 스케줄러 관리 화면으로 이동합니다.
*   **Security & Vault 카드**: PBE 암호화 토큰 관리 및 시스템 암호화 설정 화면으로 이동합니다.
*   **Developer Tools 카드**: AsEL 테스터, 와일드카드 검증기, APON 컨버터 등 런타임 개발 도구 모음으로 진입합니다.

## 3. 클러스터 관리 화면군

분산 클러스터 환경에 참여하고 있는 서버 인스턴스들과 분산 스케줄링 작업을 중앙에서 통제하는 화면 모음입니다.

### 3.1. 클러스터 노드 관리

클러스터 내 모든 활성 노드(Node)의 생존 상태를 실시간 감시하고 일괄 제어 명령을 하사하는 화면입니다.

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-cluster-nodes.png" alt="Cluster Nodes Management Screen" %}

#### 상단 제어 바

*   **Total Node Count 뱃지**: 현재 클러스터에 연결된 총 노드 수를 `0 Nodes` 형태로 실시간 출력합니다.
*   **노드 검색 필드**: 노드 이름, IP 주소 또는 노드 ID를 입력하여 원하는 노드를 즉시 필터링합니다.
*   **Bulk Control 버튼**: `NODE_MANAGE`, `SUPER_ADMIN`, `DEMO` 권한을 가진 관리자에게 제공되며, 여러 노드에 동시 제어 명령을 내리는 모달을 호출합니다.
*   **Refresh 버튼**: 클릭 시 클러스터 노드 상태를 즉시 재조회하여 화면을 갱신합니다.

#### 클러스터 그룹 탭

게이트웨이(Gateway) 클러스터 모드 구동 시, 노드들이 속한 그룹별로 탭이 자동 생성됩니다. `All Nodes` 탭에서는 전체 노드를 관찰하고, `Group Title` 탭에서는 특정 서버 그룹에 속한 노드만 분리하여 조회할 수 있습니다. 각 탭 옆에는 해당 그룹에 속한 노드 개수가 뱃지로 표시됩니다.

#### 노드 정보 카드

각 노드는 독립된 카드로 렌더링되며 다음 상세 정보들과 개별 액션 버튼을 제공합니다.
*   **Node Title & ID Badge**: 노드의 이름과 고정폭 폰트로 표시된 고유 노드 ID.
*   **Status Dot & Status Text**: 노드의 가동 상태를 색상 LED 점과 텍스트로 명확히 표시합니다. (초록색 `LIVE`: 정상 가동 중, 주황색 `PAUSED`/`STOPPING`: 일시 정지 또는 정지 중, 빨간색 `DEAD`: 연결 해제/다운)
*   **Console 뱃지**: 해당 노드가 관리 콘솔 제어 평면(Control Plane) 역할을 수행 중인 경우 하늘색 `Console` 뱃지가 함께 표시됩니다.
*   **Host Address & Service Port**: 노드의 호스트 IP 주소 및 서비스 포트 번호.
*   **Node Group**: Gateway 클러스터 모드일 경우 해당 노드가 속한 노드 그룹명.
*   **Metrics 버튼**: 클릭 시 해당 노드의 실시간 AppMon 모니터링 팝업 창이 새로 호출됩니다.
*   **Commands 버튼**: 클릭 시 원격 명령 센터로 즉시 이동하며, 해당 노드가 타겟으로 자동 선택됩니다.
*   **Actions 드롭다운 메뉴**:
    *   **Pause Node** (노드가 `LIVE` 상태일 때 표시): 노드의 트랜잭션 수신 및 실행을 잠시 일시 정지시킵니다.
    *   **Resume Node** (노드가 `PAUSED` 상태일 때 표시): 일시 정지되었던 노드를 다시 정상 가동 상태로 복원합니다.
    *   **Restart Service (Hot)**: JVM 프로세스를 중단하지 않고 `ActivityContext`를 부드럽게 재생성하여 애플리케이션 빈 규칙과 클래스를 핫 리로드(Hot Reload)합니다.
    *   **Restart Server (Cold)**: OS 데몬/서비스 프로세스를 완전히 종료하고 JVM을 콜드 재기동(Cold Reboot)합니다. 재기동 명령 발송 후 백그라운드에서 `/cluster/build/health/{nodeId}`를 주기적으로 폴링하여 노드가 정상 복구(`LIVE`)될 때까지 상태를 자동으로 추적합니다.
    *   **Audit Trail**: 빌드/배포 권한을 보유한 경우, 해당 노드의 빌드 및 배포 감사 이력 팝업 창(`cluster/build/audit/?nodeId=...`)을 즉시 호출합니다.

#### 일괄 제어 모달

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-cluster-nodes-bulk-control.png" alt="Cluster Nodes Bulk Control Modal" %}

여러 노드를 다중 선택한 뒤 한 번의 클릭으로 일괄 제어 명령을 내릴 수 있습니다.
*   **1. Select Target Nodes**:
    *   `Select All` / `Deselect All` 버튼을 통해 클러스터 내 모든 노드 또는 특정 그룹 체크박스를 손쉽게 다중 선택 및 해제할 수 있습니다.
    *   **Exclude Console 체크박스**: 일괄 제어 명령 실행 시 관제 콘솔 노드가 함께 중단되어 관제가 불가능해지는 위험을 막기 위해, 콘솔 노드를 일괄 대상에서 안전하게 제외하는 옵션입니다.
    *   **그룹별 계층 선택**: 그룹 폴더 체크박스를 통해 해당 그룹에 속한 워커 노드들을 한 번에 선택할 수 있습니다.
*   **2. Action (4대 제어 액션 카드)**:
    *   **PAUSE (일시 정지)**: 선택된 노드들의 유입 트래픽 수신을 일시 중단하고 백그라운드 활동을 멈춥니다. (콘솔 노드는 안전을 위해 자동으로 대상에서 제외됨)
    *   **RESUME (재개)**: 일시 정지되어 있던 선택 노드들을 정상 가동 상태로 복귀시켜 트래픽을 재수신합니다.
    *   **RESTART SERVICE (Hot)**: JVM을 끄지 않고 `ActivityContext`를 안전하게 재생성하여 변경된 설정을 핫 반영합니다.
    *   **RESTART SERVER (Cold)**: 선택 노드들의 OS 데몬 프로세스를 전면 재기동하며, 재시작 완료 후 헬스체크를 통해 노드 복구를 자동 감지합니다.

### 3.2. 빌드 및 배포 관리

클러스터 내의 노드들을 대상으로 원격 Git 소스 패치, Maven 빌드, 설정 및 웹 애플리케이션 배포 스크립트를 비동기로 실행하고, 실시간 웹 터미널을 통해 진행 상태를 모니터링하는 화면입니다.

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-build-deploy-main.png" alt="Build & Deployment Screen" %}

#### 상단 제어 바

*   **대상 선택기 (Target Selector)**:
    *   `All Service Nodes` (기본값): 콘솔 노드를 제외한 모든 비즈니스 서비스 노드 대상 일괄 배포.
    *   `All Nodes in Cluster`: 콘솔 노드를 포함한 클러스터 전체 노드 대상 배포.
    *   `Specific Group`: 지정된 서버 그룹(예: `api-group`, `batch-group`) 대상 배포.
    *   `Individual Node`: 특정 단일 노드 대상 배포.
*   **Manage Nodes 버튼**: 클러스터 노드 현황 관리 전용 팝업 창(`cluster/nodes/popup/`)을 호출합니다.
*   **Audit Trail 버튼**: 과거 모든 빌드/배포 이력과 상세 로그를 조회 및 다운로드할 수 있는 빌드 감사 이력 팝업 창(`cluster/build/audit/`)을 호출합니다.
*   **Quick Action Bar (빠른 실행 바)**:
    *   자주 사용하는 핵심 배포 스크립트(`Full Build & Deploy`, `1. Pull`, `2. Maven Build`, `3. Config Deploy`, `4. Webapps Deploy`)를 원클릭으로 즉시 실행할 수 있는 단축 버튼 모음입니다.

#### 좌측 제어 및 메타데이터 패널

*   **스크립트 선택 (Script Execution)**:
    *   **Standard Deploy**: 전체 풀 빌드&배포(`5-pull_build_deploy.sh`), 빌드 생략 고속 배포(`6-pull_deploy.sh`).
    *   **Single Step**: Git Pull(`1-pull.sh`), Maven 빌드(`2-build.sh`), 설정 배포(`3-deploy_config.sh`), 웹앱 배포(`4-deploy_webapps.sh`).
    *   **Selective Deploy**: 설정 전용(`7-pull_deploy_config_only.sh`), 웹앱 전용(`8-pull_deploy_webapps_only.sh`), 설정+웹앱(`9-pull_deploy_config_webapps_only.sh`).
*   **Pipeline Flow Preview**: 선택된 스크립트가 내부적으로 수행하는 파이프라인 단계(예: `Git Pull` → `Maven Build` → `Config Deploy` → `Webapps Deploy`)를 시각적 배지로 미리 안내합니다.
*   **Git Branch / Tag (선택 사항)**: 배포할 특정 Git 브랜치(예: `main`, `release/v2.0`), 릴리즈 태그(예: `v1.2.0`), 또는 커밋 해시를 지정합니다. 미입력 시 기본 브랜치의 최신 커밋이 적용됩니다.
*   **실행 및 중단 버튼**: `Execute Script` 버튼으로 비동기 배포를 시작하며, 실행 중에는 `Abort / Cancel` 버튼이 활성화되어 원격 노드에 안전한 취소 시그널을 전달할 수 있습니다.
*   **Current Execution (실행 메타데이터 요약)**:
    *   개별 노드 탭 선택 시: Execution ID, Target Node, Git Branch, Before/After Commit Hash, Started At, 실시간 Duration 소요 시간, 프로세스 종료 코드(Exit Code)를 정밀 출력합니다.
    *   All Nodes 탭 선택 시: 클러스터 전체 노드들의 실행 상태와 소요 시간을 한눈에 비교하는 카드 요약 목록을 표시합니다.

#### 우측 실시간 터미널 패널

*   **동적 노드 탭 바**:
    *   다중 노드 배포 시 상단에 `All Nodes` 통합 탭 및 각 노드별(`node1`, `node2` 등) 탭이 자동 생성됩니다. 탭마다 실시간 실행 상태 뱃지(`RUNNING`, `SUCCESS`, `FAILED`)가 동적으로 업데이트됩니다.
*   **터미널 제어 도구**:
    *   **Daemon Logs 드롭다운**: 배포 또는 재시작 시 발생할 수 있는 이상 현상을 즉각 진단할 수 있도록, 대상 노드의 `daemon-stderr.log` 및 `daemon-stdout.log`의 최근 로그(200줄)를 터미널로 직접 불러옵니다.
    *   **Auto-scroll 토글 스위치**: 로그 출력 시 최하단으로 자동 스크롤 여부를 제어합니다.
    *   **Clear Terminal 버튼**: 현재 선택된 탭의 터미널 출력을 깨끗이 비웁니다.
    *   **Download Logs 버튼**: 현재 탭의 전체 터미널 텍스트 로그를 로컬 파일(`.log`)로 즉시 다운로드합니다.
*   **ANSI 컬러 터미널**: 스크립트에서 출력되는 ANSI 색상 코드를 실시간 파싱하여 성공(초록), 에러(빨강), 경고(노랑), 정보(파랑) 등 가독성 높은 라이브 스트림 콘솔을 렌더링합니다.

#### 빌드 및 배포 감사 이력 모달

화면 상단의 `Audit Trail` 버튼을 클릭하면 배포 작업의 이력과 암호학적 무결성을 검증할 수 있는 전용 감사 팝업 창(`cluster/build/audit/`)이 호출됩니다.

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-build-audit-trail.png" alt="Build & Deployment Audit Trail Screen" %}

*   **상단 도구 모음**:
    *   **Go to Build Console**: 특정 이력의 실행 컨텍스트(Execution ID)를 유지한 채 실시간 빌드 콘솔 화면으로 즉시 전환합니다.
    *   **Print Report**: 브라우저의 인쇄 대화상자를 호출하며, 헤더와 필터 패널이 자동으로 숨겨지고 인쇄용 고대비 레이아웃으로 최적화된 감사 보고서를 출력합니다.
    *   **Export CSV Report**: 현재 설정된 검색 필터(노드, 상태, 검색어) 조건이 반영된 전체 감사 이력 데이터를 스프레드시트 호환 CSV 파일로 즉시 다운로드합니다.
*   **검색 및 필터 패널**:
    *   **Target Node**: 특정 노드 또는 전체 노드로 필터링합니다.
    *   **Status**: 실행 결과 상태(`SUCCESS`, `FAILED`, `RUNNING`, `CANCELLED`)별로 조회합니다.
    *   **Keyword Search**: Execution ID, 스크립트명, 커밋 해시, 실행자(Requester) 계정명 등 통합 키워드 검색을 지원합니다.
*   **감사 이력 테이블**:
    *   각 행마다 Execution ID, 대상 노드, 스크립트명, 실행자, 실행 상태 뱃지, Git 커밋 변경 내역(Before 커밋 → After 커밋 및 브랜치명), 시작 시각, 소요 시간(Duration), SHA-256 무결성 검증 뱃지가 표시됩니다.
*   **상세 검증 리포트 모달 (`Detail` 버튼)**:
    *   **Integrity Check 배너**: SHA-256 암호학적 해시 검증을 통해 저장된 실행 기록과 로그가 위변조되지 않았음을 증명하는 `Cryptographically Valid & Untampered` 녹색 뱃지를 출력합니다.
    *   **상세 검증 속성**: Execution ID(빌드 콘솔 바로가기 링크 포함), 타겟 노드, 실행 스크립트, 실행자, 실행 상태 및 종료 코드(Exit Code), 시작/종료 시각, 정확한 소요 시간(초 단위), Git 브랜치, Before/After 커밋 해시, Git 커밋 메시지, SHA-256 Digest 해시 전문, 및 실행 실패 시 상세 에러 요약(Error Summary)을 제공합니다.
*   **터미널 로그 뷰어 모달 (`Logs` 버튼)**:
    *   데이터베이스에 영구 보존된 당시의 전체 콘솔 출력 스트림을 실시간 복원하여 ANSI 컬러 터미널 창으로 렌더링합니다.
    *   **Download Full Log 버튼**: 당시 출력된 전체 텍스트 로그를 로컬 PC로 즉시 다운로드합니다.

> **심화 가이드**: 원격 배포 파이프라인의 내부 아키텍처, 프로세스 독립적 안전 재시작(`DetachedRestartRunner`), 다중 노드 빌드 락 메커니즘 및 릴리즈 운영 정책에 대한 상세한 내용은 [Aspectow Console 빌드 및 배포 가이드](/ko/docs/aspectow/console/build-and-deployment/) 문서를 참조하십시오.

### 3.3. 원격 명령 센터

클러스터 내의 원하는 대상 노드로 대화형 원격 명령(CLI/Shell Command)을 발송하고 결과를 확인하는 Command Center입니다.

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-remote-commands.png" alt="Remote Commands Center Screen" %}

#### 화면 레이아웃

좌측의 350px 고정 폭 **명령 히스토리 패널**과 우측의 **대상 선택기, 명령 에디터, 콘솔 출력 패널**로 분할되어 있습니다.

#### 대상 선택기

명령을 수행할 대상을 선택합니다. `All Active Nodes`를 선택하면 클러스터 전체 노드에서 동시 실행되며, 특정 노드를 선택하면 해당 단일 노드로만 명령이 수신됩니다.

#### 명령 에디터

수행할 쉘 명령(Shell Command)이나 Aspectran 관리자 명령을 작성하는 입력창입니다. 멀티 라인 스크립트 작성을 지원하며 `Execute` 버튼을 누르면 비동기 명령 버스를 통해 명령이 수신 및 실행됩니다.

#### 실시간 콘솔 출력

명령 실행 결과가 노드별 탭(Tab)으로 구분되어 실시간 스트리밍됩니다.
*   **Standard Output**: 일반 실행 결과는 표준 흰색/밝은 텍스트로 출력됩니다.
*   **Standard Error**: 실행 실패나 에러 메시지는 빨간색 텍스트로 명확히 구분 출력됩니다.

#### 명령 히스토리 패널

과거 실행했던 명령들의 기록이 타임스탬프, 타겟 노드, 성공/실패 뱃지, 명령 텍스트 미니 프리뷰 형태로 저장됩니다. 히스토리 항목을 클릭하면 작성 중이던 에디터에 해당 명령과 타겟 설정이 즉시 복원되어 손쉽게 재실행할 수 있습니다.

### 3.4. 스케줄러 관리자

클러스터 환경에 등록된 Aspectran Scheduler 서비스 및 분산 잡(Job)을 모니터링하고 통제하는 화면입니다. 상단 뷰 전환 컨트롤을 통해 전체 노드를 한눈에 관찰하는 **대시보드 뷰**와 특정 노드를 집중 제어하는 **상세 보기 뷰**의 두 가지 뷰 모드를 지원합니다.

#### 대시보드 뷰

클러스터 전체 노드의 스케줄러 가동 상태와 통합 로그를 종합 관찰하는 뷰 모드입니다.

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-scheduler-dashboard.png" alt="Scheduler Manager Dashboard View" %}

*   **요약 지표 카운터**: 클러스터 전체의 Active Schedules(활성 스케줄 수), Active Jobs(활성 잡 수), Isolated Items(격리 항목 수) 및 Target Node 수치를 한눈에 조망합니다.
*   **전체 노드 카드 그리드**: 클러스터 내 각 노드가 그리드 카드로 렌더링됩니다. 노드 카드에는 노드 타이틀, 소속 그룹, 헬스 상태(Live/Dead/Connecting LED 인디케이터) 및 실행 중인 스케줄/잡의 수치가 표시됩니다. 특정 노드 카드를 클릭하면 펄싱(Pulsing) 애니메이션과 함께 해당 노드의 상세 보기 뷰로 즉시 전환됩니다.
*   **클러스터 통합 스케줄러 로그 콘솔**: 화면 하단에 위치한 다크 테마 콘솔 박스로, **클러스터 내 모든 노드에서 발생하는 스케줄러 시작, 종료, 트리거 실행 및 에러 로그**가 실시간으로 수집 및 스트리밍됩니다. 로그 일시정지(Pause), 화면 지우기(Clear), 로그 창 전체 화면(Expanded) 확장 기능을 제공합니다.

#### 상세 보기 뷰

노드 셀렉터를 통해 선택한 특정 노드의 스케줄러 서비스를 집중 모니터링하고 잡(Job)을 동적으로 통제하는 뷰 모드입니다.

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-scheduler-detail-view.png" alt="Scheduler Manager Detail View Screen" %}

*   **스케줄러 서비스 카드**: 선택된 노드에 등록된 스케줄러 서비스명, 전체 잡 수, 활성 크론 수, Running/Paused 가동 상태 뱃지를 보여줍니다.
*   **격리 모드 안내**: 해당 스케줄러 잡이 특정 노드에 전속되어 실행 중인지, 클러스터 공유 분산 락(Distributed Lock) 기반으로 구동 중인지를 황색 경고 아이콘으로 안내합니다.
*   **스케줄 잡 상세 테이블**: 각 배치 잡의 이름, Trigger Type(Cron vs Simple Interval), Cron 표현식(예: `0 0/5 * * * ?` - 5분 주기로 실행), 다음 실행 예정 시각, 직전 실행 시각 및 수동 실행 상태 뱃지를 제공합니다.
*   **잡 동적 제어 버튼**:
    *   `Pause` / `Resume`: 특정 잡의 자동 실행을 일시 정지하거나 다시 재개합니다.
    *   `Job Details`: 잡에 정의된 세부 파라미터 및 실행 히스토리 모달을 불러옵니다.
*   **선택 노드 전용 스케줄러 로그 콘솔**: 선택한 특정 노드에서 발생하는 스케줄러 실행 로그만 필터링하여 실시간 테일링으로 관찰할 수 있습니다.

#### 스케줄러 일괄 제어 모달

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-scheduler-bulk-control.png" alt="Scheduler Manager Bulk Control Modal" %}

클러스터 내 여러 노드에 분산 등록된 특정 스케줄(Schedule)이나 잡(Job)을 상대로 한 번에 일괄 제어 명령을 하사합니다.
*   **1. Select Target Nodes**: `Select All` / `Deselect All` 버튼을 통해 클러스터 내 모든 노드 또는 특정 그룹/노드 체크박스를 선택/해제합니다.
*   **2. Service Name (선택 사항)**: 제어를 적용할 스케줄러 서비스 이름을 지정합니다. (비워둘 경우 모든 서비스에 매칭 적용)
*   **3. Target Type & ID**: 제어할 대상을 `Schedule` 또는 `Job` 단위로 선택하고, 대상 식별자(Schedule ID 또는 Job ID, 예: `SyncBackupSchedule`)를 입력합니다.
*   **4. Action (일괄 제어 액션)**:
    *   **ENABLE (일괄 활성화)**: 선택 노드들의 대상 스케줄/잡을 동시 활성화합니다.
    *   **DISABLE (일괄 비활성화)**: 선택 노드들의 대상 스케줄/잡을 동시 비활성화(일시 정지)합니다.

## 4. 실시간 모니터링 (Aspectow AppMon)

Console 내에 통합된 AppMon 엔진을 통해 애플리케이션의 실시간 활동, JVM 리소스, 세션 및 로그 스트리밍을 감시합니다.

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/appmon-v4-dashboard-dark.png" alt="AppMon Live Monitoring Dashboard" %}

### 4.1. 노드 그룹 및 애플리케이션 탭 내비게이션

*   **노드 그룹 탭**: 서버 그룹이나 클러스터를 논리적으로 분리하여 전환합니다.
*   **애플리케이션 탭**: 도메인 내의 개별 애플리케이션 인스턴스를 전환하며, 탭 이동 시에도 심리스하게 모니터링 데이터가 동기화됩니다.

### 4.2. 서버 리소스 및 성능 지표

*   **Heap Status**: JVM 힙 메모리의 현재 사용량과 최대 한도를 비교하여 GC 상태와 메모리 누수를 감지합니다.
*   **Undertow Thread Pool**: 활성 쓰레드와 전체 풀 크기를 비교하여 서버의 동시 처리 부하를 체크합니다.
*   **Activity Status**: Active Activity(현재 동시 처리 중인 실시간 요청 수, 예: `11`), Current Period Count(현재 5분 주기의 신규 유입 수, 예: `+94`), Cumulative Total(서버 가동 후 누적 전체 활동 수, 예: `12883893`).
*   **5분 주기 집계 타이머**: 하단의 타이머(예: `280/300`)가 300초(5분) 집계 구간의 진행 상태를 나타냅니다. `300/300` 도달 시 집계 데이터를 DB에 저장하고 차트에 반영합니다.

### 4.3. Canvas 기반 트래픽 시각화

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

## 5. 보안 및 Vault 관리

Aspectran 프레임워크의 내장 PBE(Password-Based Encryption) 암호화 엔진을 기반으로 보안 토큰을 안전하게 등록·보관하고, 시스템 암호화 구성을 중앙에서 통제하는 섹션입니다.

### 5.1. Vault 관리

Aspectran의 PBE 암호화 기반 보안 토큰을 안전하게 보관하는 전용 저장소(Vault)를 총괄 관리하는 화면입니다. 외부 별도 Vault 솔루션 연동이 아닌, 프레임워크 자체의 PBE 암호화 규격에 맞춰 민감 자산(DB 비밀번호, API 키 등)을 암호화 토큰 형태로 격리·저장하여 평문 노출 위험을 원천 차단합니다.

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

#### 토큰 상세 목록

각 토큰의 이름, 암호화된 키/값 미니 프리뷰, 생성 일자, 만료 일자 및 상태(Active/Expired 뱃지)가 표시되며, 키 복사(Copy Key), 상세 보기, 토큰 폐기(Revoke) 액션을 제공합니다.

#### 신규 보안 토큰 발급 모달

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

### 5.2. Vault Tool

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-vault-tool.png" alt="Vault Interactive Tool Screen" %}

개발자와 관리자가 민감한 데이터(DB 비밀번호, API 키 등)를 암호화하거나 복호화할 수 있는 대화형 실험실 도구입니다.

*   **암/복호화 실행 폼**: 알고리즘(Algorithm), 비밀번호(Password), Salt 값 및 모드(Encrypt/Decrypt)를 설정하고 텍스트 암/복호화를 실행합니다.
*   **실행 결과 및 히스토리**: 연산된 결과 텍스트 복사 기능 및 과거 암/복호화 실행 이력(시간, 모드, 알고리즘)을 확인하고 손쉽게 재실행(Restore)할 수 있는 히스토리 목록을 제공합니다.

## 6. 프레임워크 진단 및 개발자 도구

Aspectran 프레임워크 런타임 진단 및 개발 생산성을 극대화하기 위한 도구 모음입니다.

### 6.1. 프레임워크 구성 뷰어

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-framework-config.png" alt="Framework Configuration Viewer" %}

현재 구동 중인 Aspectran 프레임워크의 런타임 구성 정보, 로딩된 규칙 파일(Rule Files)의 계층 구조 및 활성화된 환경 프로필(`dev`, `prod`, `test` 등)을 트립 뷰어로 조회합니다.

### 6.2. 프레임워크 해부 뷰어

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-framework-anatomy.png" alt="Framework Anatomy Viewer" %}

Aspectran의 심장부인 `ActivityContext` 내부 구조를 해부학적으로 분석합니다.
*   **Bean Registry**: 등록된 모든 빈(Bean)의 ID, 클래스 타입, 스코프(singleton, prototype, request, session), Lazy Init 여부 및 의존성 관계.
*   **Translet Registry**: 정의된 모든 트랜슬릿(Translet)의 이름, HTTP 요청 매핑 방식, Action 실행 구조 및 View Forwarding 설정.
*   **Aspect Registry**: AOP 어스펙트의 Pointcut 패턴 및 Before/After/Around Advice 동작 정의.

### 6.3. Wildcard Tester

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-wildcard-tester.png" alt="Wildcard Pattern Tester Tool" %}

Aspectran의 와일드카드 패턴 매처 동작을 실시간 검증하는 도구입니다. 화면 상단의 **Wildcard Guide** 버튼을 통해 [Aspectran 와일드카드 패턴 매칭 가이드](https://aspectran.com/ko/docs/guides/aspectran-wildcard-matching/) 공식 문서로 바로 이동하여 패턴 문법을 상세히 참조할 수 있습니다.
*   **Pattern Input**: 검증할 패턴(예: `/users/**/details`, `*.do`)을 입력합니다.
*   **Test Paths**: 테스트할 여러 경로들을 입력창에 주입합니다.
*   **Match Results**: 각 경로별 매칭 성공(Success) / 실패(Mismatch) 여부와 패턴 매칭 시 추출된 변수(Extracted Variables) 바인딩 결과를 실시간 시연합니다.

### 6.4. AsEL Tester

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-asel-tester.png" alt="AsEL Expression Tester Tool" %}

Aspectran Expression Language (AsEL) 문법을 대화형으로 실행하고 평가하는 도구입니다. 상단의 **AsEL Guide** 버튼을 통해 [AsEL(Aspectran Expression Language) 소개](https://aspectran.com/ko/docs/guides/introduce-asel/) 공식 가이드 문서로 이동하여 표현식 객체 평가 규칙 및 문법 구조를 확인할 수 있습니다.
*   **Expression Input**: AsEL 표현식(예: `#{sysProps['user.home']}`, `@{beanId.methodName()}`) 입력.
*   **Context Variables**: 평가 시 사용할 샘플 변수 데이터 입력.
*   **Evaluation Result**: 평가된 결과값, 리턴 객체 데이터 타입, 실행 소요 시간(ms)을 출력합니다.

### 6.5. APON Converter

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-apon-converter.png" alt="APON Data Converter Tool" %}

APON(Aspectran Parameter Object Notation) 데이터와 JSON 형식 간의 양방향 구조 변환기입니다. 상단의 **APON Guide** 버튼을 통해 [APON(Aspectran Parameters Object Notation) 소개](https://aspectran.com/ko/docs/guides/introduce-apon/) 공식 문서로 바로 이동하여 APON 데이터 명세와 구문 규칙을 탐색할 수 있습니다.
*   **APON 패널 (좌측)**: APON 데이터를 입력하고 `Parse to JSON` 버튼을 통해 JSON으로 변환합니다.
*   **JSON 패널 (우측)**: JSON 데이터를 입력하고 APON 출력 스타일(`PRETTY`, `SINGLE_LINE`, `COMPACT`)을 선택한 뒤 `APON` 버튼을 통해 APON으로 변환합니다.
*   **Quick Tools**: 데이터 초기화(`Clear All`) 및 샘플 데이터 로드(`Load Sample`) 유틸리티를 제공합니다.

## 7. 계정 관리 및 감사

Console 사용자 계정과 보안 감사 로그를 관장하는 섹션입니다.

### 7.1. 사용자 계정 관리

#### 사용자 계정 목록

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-user-management.png" alt="User Management Screen" %}

*   **사용자 목록 & 검색**: 콘솔에 등록된 사용자 계정(Username, Nickname, Email, Status, Roles)을 실시간으로 관리하고 필터링합니다.
*   **Role Permissions 버튼**: `USER_MANAGE` 권한 또는 `SUPER_ADMIN` 역할을 가진 관리자에게 노출되며, 역할별 세부 권한 매핑을 설정하는 모달을 호출합니다.
*   **New User 버튼**: 신규 사용자 계정을 등록하는 생성 모달을 호출합니다.

#### 사용자 생성 및 수정 모달

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-user-management-modal.png" alt="User Management Modal Screen" %}

*   **기본 계정 프로필**:
    *   `Username`: 사용자 식별 계정명 (수정 모드에서는 Read-only로 안전하게 보호).
    *   `Password`: 계정 비밀번호 (신규 등록 시 필수이며, 수정 모드에서는 빈칸으로 둘 경우 기존 비밀번호를 유지합니다. 우측 눈 모양 아이콘으로 비밀번호 표시/숨김을 토글할 수 있습니다).
    *   `Nickname`: 콘솔 상단 및 프로필에 표시될 사용자 별칭.
    *   `Email`: 알림 수신 및 계정 식별용 이메일 주소.
    *   `Status`: 계정 상태(`NORMAL`, `LOCKED`, `EXPIRED`). 비밀번호 5회 연속 오류 등으로 자동 잠긴(`LOCKED`) 계정은 모달에서 상태를 `NORMAL`로 변경하면 실패 횟수(`failedAttempts`)가 즉시 0으로 초기화되며 잠금이 해제됩니다.
*   **접속 허용 IP 제한 (`Allowed IPs`) 설정**:
    *   개별 운영자 계정별로 콘솔 접속이 허용되는 IP 패턴(`allowedIps`)을 지정하여 무단 접속을 엄격히 방어합니다.
    *   단일 IP(`192.168.1.50`, `10.0.0.100`), IP 대역 와일드카드(`192.168.1.*`, `10.0.*.*`), 쉼표 또는 공백으로 구분된 다중 패턴 입력을 지원합니다. (비워둘 경우 IP 제약 없이 어디서나 접속 허용)
    *   지정된 IP 패턴과 일치하지 않는 환경에서 접속 시도 시 비밀번호가 맞더라도 로그인이 즉시 거부되며 보안 감사 로그에 실시간으로 기록됩니다.
*   **역할 (Roles) 부여**:
    *   사용자에게 적용할 역할(Role)을 체크박스로 다중 선택하여 부여합니다.
    *   `SUPER_ADMIN`: 시스템 전체에 대한 최고 관리자 권한 (모든 관리 및 제어 기능에 완전한 접근 가능).
    *   `ADMIN`: 클러스터 노드 관리, 원격 명령 실행, 빌드 및 배포 등 실무 관리자 권한.
    *   `VIEWER`: 모니터링 대시보드 및 빌드 현황 조회 전용 읽기 권한.
    *   `DEMO`: 데모 및 기능 체험용 시뮬레이션 권한 (데이터 수정 및 삭제 차단).
    *   `BUILDER`: CI/CD 빌드 및 배포 파이프라인 스크립트 실행 및 이력 관리 전용 엔지니어 권한.

#### 역할별 권한 관리 모달

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-role-permissions-modal.png" alt="Role Permissions Modal Screen" %}

상단 툴바의 **Role Permissions** 버튼을 클릭하여 호출하며, `USER_MANAGE` 권한 또는 `SUPER_ADMIN` 역할을 보유한 관리자가 시스템 역할별 세부 기능 권한(RBAC)을 동적으로 구성하고 관리하는 화면입니다.

*   **역할 선택 드롭다운**:
    *   권한을 조회하거나 수정할 대상 역할(`SUPER_ADMIN`, `ADMIN`, `BUILDER`, `VIEWER`, `DEMO` 등)을 선택합니다.
    *   드롭다운에서 역할을 선택하면 해당 역할에 현재 할당되어 있는 세부 권한 체크박스가 실시간으로 자동 체크되어 표시됩니다.
*   **세부 기능 권한 목록**:
    *   `MONITOR_VIEW`: AppMon 실시간 모니터링 대시보드, 서버 리소스 지표 및 실시간 로그 뷰어 조회 권한.
    *   `MONITOR_CONTROL`: 실시간 모니터링 설정 변경 및 활성 세션 제어 권한.
    *   `USER_MANAGE`: 사용자 계정 생성, 수정, 삭제 및 역할별 세부 권한 매핑 관리 권한.
    *   `NODE_MANAGE`: 클러스터 노드 생존 감시 및 일시 정지(Pause), 재개(Resume), 핫 리로드/콜드 리부트(Restart) 제어 권한.
    *   `COMMAND_EXECUTE`: 원격 명령 센터(Remote Commands)를 통한 대화형 CLI/Shell 스크립트 실행 권한.
    *   `BUILD_VIEW`: 빌드 및 배포 현황 대시보드, 실시간 터미널 로그 스트림 및 빌드 감사 이력(Audit Trail) 조회 권한.
    *   `BUILD_EXECUTE`: 원격 Git 브랜치 체크아웃, Maven 빌드 및 단계별/전체 배포 스크립트 실행 및 중단(Abort) 권한.
*   **동적 권한 저장**:
    *   역할별 권한 체크박스를 조정한 후 `Save Changes` 버튼을 클릭하면 `asc_role_permission` 매핑 정보가 데이터베이스에 즉시 업데이트되며, 서버 재기동 없이 런타임에 즉각 반영됩니다.

### 7.2. 로그인 이력 탐색

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-login-history.png" alt="Login History Audit Screen" %}

콘솔에 로그인했던 사용자들의 접속 일시, 클라이언트 IP 주소, IP 기반 Geo Location(국가 국기 아이콘), 로그인 성공/실패 여부, 실패 사유 및 User-Agent 정보를 감사(Audit) 로그로 제공하여 시스템 접근 보안을 철저히 검증합니다.

### 7.3. 보안 감사 로그

{% include image.liquid src="https://cdn.jsdelivr.net/gh/aspectran/aspectow@main/assets/screenshots/console-audit-log.png" alt="Security Audit Log Screen" %}

콘솔 제어 권한 행사, 계정 설정 변경, Vault 보안 토큰 관리 등 시스템 전반의 고위험 작업 내역을 실시간으로 추적하고 감사하는 보안 모니터링 화면입니다.

*   **실시간 감사 대상 이벤트**:
    *   사용자 계정 생성, 수정, 삭제 및 계정 잠금/해제 처리
    *   역할(Role) 및 핀포인트 권한(Permission) 변경
    *   Vault 보안 토큰 발급, 수정, 폐기 및 System Encryption 설정 조회
    *   비허용 IP 접속 시도 차단 및 로그인 실패 이력 기록
*   **검색 및 필터링**: 실행자 계정(Username), 작업 유형 키워드(Action), 처리 결과(Success/Failed) 및 기간 조건으로 감사 로그를 정밀 조회합니다.
*   **감사 상세 정보 모달**: 감사 항목 클릭 시 실행자 ID, 접속자 IP 주소, 대상 자원(Target Resource), 작업 수행 전/후 데이터 패킷 및 상세 사유를 JSON/텍스트 뷰어로 확인하여 보안 인시던트 조사를 지원합니다.
