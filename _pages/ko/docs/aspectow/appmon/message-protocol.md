---
title: AppMon 메시지 프로토콜 명세
teaser: AppMon 서버와 클라이언트 간의 실시간 데이터 통신 및 제어 패킷을 위한 메시지 형식과 프로토콜 규격을 정의합니다.
subheadline: Aspectow Aspectow AppMon
---

{% capture info_message %}
본 프로토콜은 가독성이 높은 텍스트 기반 구조와 선언적 APON(Aspectran Parameter Object Notation) 포맷을 채택하여 디버깅이 용이하면서도, 게이트웨이 브릿지 및 멀티 노드 환경에서 뛰어난 확장성을 제공합니다.
{% endcapture %}
{% include alert.liquid info=info_message %}

## 1. 서버-클라이언트 데이터 메시지 구조 (Push/Broadcast)

서버에서 클라이언트로 전송되는 모든 데이터 및 지표 메시지는 노드 프리픽스와 콜론(`:`) 구분자를 사용하는 주요 필드로 구성됩니다.

```text
{nodeId}:{exporterType}[/{subType}]:{exporterName}:{content}
```

### 1.1 필드 정의

| 필드명 | 설명 | 비고 |
| :--- | :--- | :--- |
| **nodeId** | 데이터를 생성한 물리/논리 서버 노드의 식별자 | 예: `node01`, `appmon-demo-node1` |
| **exporterType** | 데이터의 대분류 (Base Type) | `log`, `event`, `data`, `metric` |
| **subType** | (선택) 데이터의 구체적인 종류나 상태를 나타내는 서브 타입 | `/` 뒤에 위치. 예: `p` (과거 로그), `chart` (차트 데이터) |
| **exporterName** | 해당 타입 내에서의 고유 리소스 이름 | 예: `activity`, `session`, `app` |
| **content** | 실제 전송되는 데이터 본문 | 텍스트, JSON, 또는 수치 |

### 1.2 클라이언트 파싱 및 매핑 규칙

1.  **노드 식별자 분리**: 메시지 최상단의 `nodeId:` 구분자를 통해 패킷을 전달한 원격 노드를 식별합니다.
2.  **타입 분석**: `exporterType` 필드에서 `/` 문자를 찾아 기본 타입과 서브타입(`subType`)을 분리합니다.
3.  **식별자 생성 (exporterKey)**: `nodeId:pureType:exporterName` 조합으로 **exporterKey**를 생성합니다. 이 키는 클라이언트 UI 요소(콘솔 박스, 차트 등)를 식별하는 유일한 열쇠가 됩니다.
4.  **데이터 처리**: `subType`에 따라 적절한 UI 처리 로직(예: 과거 로그 상단 추가, 차트 갱신 등)을 수행합니다.

## 2. Exporter 타입별 명세

### 2.1 로그 (Log)
실시간 로그 스트리밍 및 과거 로그 데이터를 전송합니다. 본문은 일반 텍스트입니다.

*   **실시간 로그 (LOG)**: 별도의 서브타입이 없습니다.
    *   형식: `node01:log:app:로그 내용...`
*   **과거 로그 (PREVIOUS)**: `p` 서브타입을 사용합니다.
    *   형식: `node01:log/p:app:과거 로그 내용...`
    *   클라이언트는 이를 인식하여 로그 박스 상단에 데이터를 역방향 추가(Prepend)합니다.

### 2.2 시각화 데이터 (Data)
차트 등을 그리기 위한 통계 데이터를 전송합니다.

*   **차트 데이터 (CHART)**: `chart` 서브타입을 사용하며 본문은 JSON입니다.
    *   형식: `node01:data/chart:activity:{"labels":[...], "data1":[...], "rolledUp":false}`

### 2.3 이벤트 (Event)
시스템 상태 변경이나 사용자 세션 이벤트를 전송합니다. 본문은 JSON입니다.

*   형식: `node01:event:session:{"numberOfActives":10, "createdSessions":[...], ...}`

### 2.4 메트릭 (Metric)
단일 지표 값을 전송합니다. 본문은 JSON입니다.

*   형식: `node01:metric:heap:{"format":"{used}/{max}", "data":{"used":"512MB", "max":"2GB"}}`

## 3. 클라이언트-서버 명령 구조 (Pull/Request)

클라이언트가 서버에 특정 동작이나 데이터를 요청할 때 사용하는 프로토콜입니다. **APON(Aspectran Object Notation)** 인라인 형식을 기반으로 하며, 세미콜론(`;`)으로 구분된 `key:value` 쌍으로 전송됩니다.

서버의 `CommandOptions` 클래스는 이 문자열을 파싱하여 파라미터 객체로 변환하며, `command` 키의 값을 확인하여 수행할 작업을 수행합니다.

### 3.1 명령 전송 포맷
```text
command:{commandName};nodeId:{nodeId};{optionKey1}:{value1};{optionKey2}:{value2}
```

### 3.2 주요 명령 및 파라미터 명세

| 명령(`command`) | 설명 | 가용 파라미터 |
| :--- | :--- | :--- |
| **`subscribe`** | 특정 노드 및 애플리케이션의 모니터링 이벤트 구독 | `nodeId`, `nodeToSubscribe`, `appsToSubscribe`, `timeZone` |
| **`established`** | 커넥션 연결 수립 신호 및 하트비트 핸드셰이크 동기화 | `nodeId`, `nodeToSubscribe`, `appsToSubscribe` |
| **`unsubscribe`** | 특정 노드/애플리케이션의 모니터링 이벤트 구독 해제 | `nodeId`, `nodeToSubscribe`, `appsToSubscribe` |
| **`refresh`** | 특정 차트나 메트릭 지표의 최신 데이터를 명시적으로 재요청 | `nodeId`, `appId`, `dateUnit`, `dateOffset` |
| **`loadPrevious`** | 로그 박스 최상단에서 이전 실시간 로그 이력 데이터 요청 | `nodeId`, `appId`, `logId`, `loadedLines` |
| **`focus`** | 대시보드 화면 상에서 특정 노드 및 애플리케이션으로 포커스 전환 | `nodeId`, `appId` |
| **`ping`** | 서버와의 웹소켓 통신 생존 상태(Liveness) 및 퐁(Pong) 토큰 갱신 요청 | `nodeId` |

### 3.3 최신 명령 예시

*   **모니터링 이벤트 구독 요청 (`subscribe`)**:
    ```text
    command:subscribe;timeZone:Asia/Seoul;nodeToSubscribe:node01;appsToSubscribe:jpetstore;nodeId:node01
    ```
    *(설명: node01 노드의 jpetstore 애플리케이션 이벤트 수집을 구독하고 타임존 정보를 전송함)*

*   **연결 수립 핸드셰이크 동기화 (`established`)**:
    ```text
    command:established;nodeToSubscribe:node01;appsToSubscribe:jpetstore;nodeId:node01
    ```
    *(설명: 웹소켓 물리 연결이 준비되었음을 서버에 알리고 구독 상태를 최종 확정함)*

*   **로그 박스 이전 로그 추가 로드 (`loadPrevious`)**:
    ```text
    command:loadPrevious;nodeId:node01;appId:jpetstore;logId:app;loadedLines:300
    ```
    *(설명: node01 노드의 jpetstore 애플리케이션 app 로그에서 이미 화면에 로드된 300라인 이전의 과거 로그를 역방향 추가 로드함)*

*   **시게열 분석 차트 데이터 리프레시 (`refresh`)**:
    ```text
    command:refresh;nodeId:node01;appId:jpetstore;dateUnit:hour
    ```
    *(설명: node01 노드의 jpetstore 애플리케이션 지표 데이터를 시간(hour) 단위로 다시 집계하여 요청함)*

*   **하트비트 생존 확인 (`ping`)**:
    ```text
    command:ping
    ```
    *(설명: 주기적인 통신 핑 패킷을 전송하여 커넥션 유지 및 보안 토큰 갱신을 요청함)*

## 4. 제어 메시지 및 게이트웨이 브릿지 패킷

서버와 클라이언트 간의 하트비트 생존 확인, 구독 확정, 노드 이벤트를 주고받을 때는 제어 패킷 식별자(`:`)로 시작하는 시스템 메시지를 사용합니다. 노드 식별자 뒤에 제어 식별자가 붙어 실제 송수신 시 **`{nodeId}::...`** 형태로 전달됩니다.

### 4.1 실제 제어 패킷 송수신 트레이스 예시

*   **핑/퐁 통신 패킷 (Ping / Pong)**:
    *   **클라이언트 송신 (`Ping`)**: `command:ping`
    *   **서버 생존 응답 (`Pong`)**: `node1::pong:J5qdjrezDfBoF7xjTihK_RLBDeeNHzxlFMsnpg2_czbcqyhVNiq3FaQI7ewzTLesyUmrdjjfUM0`
    *(설명: node1 노드로부터 갱신된 보안 세션 토큰이 포함된 퐁 응답이 반환됨)*

*   **구독 완료 및 활성 상태 응답 (`Subscribed`)**:
    *   **서버 응답**: `node1::subscribed:alive`
    *(설명: node1 노드의 모니터링 수집 구독이 정상 완료되었고 노드가 활성 상태임을 확인)*

*   **클러스터 동적 노드 추가 이벤트 (`Node Joined`)**:
    *   **서버 브로드캐스트**: `node1::node:joined:{"id":"node2","group":"group1","title":"Node 2"}`
    *(설명: Gateway 모드에서 신규 노드가 자율 조인(Autoscaling)되었을 때 클라이언트로 전달되는 이벤트)*

*   **노드 상태 변경 이벤트 (`Node Status Changed`)**:
    *   **서버 브로드캐스트**: `node1::node:statusChanged:{"id":"node2","alive":false}`
    *   *(설명: 특정 노드의 비정상 종료 또는 락 상태 변경 시 전달되는 클러스터 통지 패킷)*
