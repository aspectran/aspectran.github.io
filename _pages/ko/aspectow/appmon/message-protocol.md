---
format: plate solid article
title: AppMon 메시지 프로토콜 명세
teaser: AppMon 서버와 클라이언트 간의 실시간 데이터 통신을 위한 메시지 형식과 통신 규칙을 정의합니다.
sidebar: toc
---

AppMon 서버와 클라이언트 간의 실시간 데이터 통신을 위한 메시지 형식과 통신 규칙을 정의합니다. 본 프로토콜은 가독성이 높은 텍스트 기반 구조를 채택하여 디버깅이 용이하면서도, 서브타입을 통한 유연한 확장성을 제공합니다.

## 1. 서버-클라이언트 메시지 구조 (Push/Broadcast)

서버에서 클라이언트로 전송되는 모든 데이터 메시지는 콜론(`:`)을 구분자로 사용하는 4개의 주요 필드로 구성됩니다.

```text
{instanceName}:{exporterType}[/{subType}]:{exporterName}:{content}
```

### 1.1 필드 정의

| 필드명 | 설명 | 비고 |
| :--- | :--- | :--- |
| **instanceName** | 데이터를 생성한 서버 인스턴스의 식별자 | 예: `appmon`, `server1` |
| **exporterType** | 데이터의 대분류 (Base Type) | `log`, `event`, `data`, `metric` |
| **subType** | (선택) 데이터의 구체적인 종류나 상태를 나타내는 서브 타입 | `/` 뒤에 위치. 예: `p` (과거 로그), `chart` (차트 데이터) |
| **exporterName** | 해당 타입 내에서의 고유 리소스 이름 | 예: `activity`, `session`, `app.log` |
| **content** | 실제 전송되는 데이터 본문 | 문자열 또는 JSON 형식 |

### 1.2 클라이언트 파싱 및 매핑 규칙

1.  **필드 분리**: 메시지를 콜론(`:`) 기준으로 분리합니다. 단, 본문(`content`) 내에 콜론이 포함될 수 있으므로 앞의 3개 인덱스만 먼저 찾습니다.
2.  **타입 분석**: `exporterType` 필드에서 `/` 문자를 찾아 기본 타입과 서브타입(`subType`)을 분리합니다.
3.  **식별자 생성 (exporterKey)**: `instanceName:pureType:exporterName` 조합으로 **exporterKey**를 생성합니다. 이 키는 클라이언트 UI 요소(콘솔 박스, 차트 등)를 식별하는 유일한 열쇠가 됩니다.
4.  **데이터 처리**: `subType`에 따라 적절한 UI 처리 로직(예: 상단 추가, 하단 추가, 차트 갱신 등)을 수행합니다.

---

## 2. Exporter 타입별 명세

### 2.1 로그 (Log)
실시간 로그 스트리밍 및 과거 로그 데이터를 전송합니다. 본문은 일반 텍스트입니다.

*   **실시간 로그 (LOG)**: 별도의 서브타입이 없습니다.
    *   형식: `server1:log:root.log:로그내용...`
*   **과거 로그 (PREVIOUS)**: `p` 서브타입을 사용합니다.
    *   형식: `server1:log/p:root.log:로그내용...`
    *   클라이언트는 이를 인식하여 로그 박스 상단에 데이터를 추가(Prepend)합니다.

### 2.2 시각화 데이터 (Data)
차트 등을 그리기 위한 통계 데이터를 전송합니다.

*   **차트 데이터 (CHART)**: `chart` 서브타입을 사용하며 본문은 JSON입니다.
    *   형식: `server1:data/chart:activity:{"labels":[...], "data1":[...], "rolledUp":false}`
    *   기존의 래핑 레이어를 제거하고 평탄화된 JSON 구조를 제공합니다.

### 2.3 이벤트 (Event)
시스템 상태 변경이나 사용자 세션 이벤트를 전송합니다. 본문은 JSON입니다.

*   형식: `server1:event:session:{"numberOfActives":10, "createdSessions":[...], ...}`

### 2.4 메트릭 (Metric)
단일 지표 값을 전송합니다. 본문은 JSON입니다.

*   형식: `server1:metric:jvm.memory:{"format":"{used}/{max}", "data":{"used":"512MB", "max":"2GB"}}`

---

## 3. 클라이언트-서버 명령 구조 (Pull/Request)

클라이언트가 서버에 특정 동작을 요청할 때 사용하는 프로토콜입니다. **APON(Aspectran Object Notation)** 형식을 기반으로 하며, 세미콜론(`;`)으로 구분된 `key:value` 쌍들의 집합으로 구성됩니다.

서버의 `CommandOptions` 클래스는 이 문자열을 파싱하여 객체로 변환하며, 특히 `command` 키의 값을 확인하여 수행할 작업의 종류를 결정합니다.

### 3.1 명령 형식
```text
command:{commandName};{optionKey1}:{value1};{optionKey2}:{value2}
```

### 3.2 주요 명령 및 옵션 파라미터

| 명령(`command`) | 설명 | 가용 옵션 파라미터 |
| :--- | :--- | :--- |
| **refresh** | 차트나 메트릭 등의 최신 데이터를 명시적으로 요청 | `instance`, `dateUnit`, `dateOffset` |
| **loadPrevious** | 로그 박스 상단에서 이전 로그 데이터를 요청 | `instance`, `logName`, `loadedLines` |
| **join** | 실시간 모니터링 세션을 시작하고 인스턴스 그룹에 참여 | `instancesToJoin`, `timeZone` |

### 3.3 명령 예시

*   **로그 박스 이전 로그 요청**:
    `command:loadPrevious;instance:appmon;logName:root.log;loadedLines:500`
    *(설명: appmon 인스턴스의 root.log에서 이미 로딩된 500라인 이전의 데이터를 요청함)*

*   **특정 인스턴스 데이터 리프레시**:
    `command:refresh;instance:server1;dateUnit:hour`
    *(설명: server1 인스턴스의 데이터를 시간(hour) 단위로 다시 집계하여 요청함)*

*   **모니터링 세션 참여**:
    `command:join;instancesToJoin:server1,server2;timeZone:Asia/Seoul`
    *(설명: 두 개 인스턴스의 모니터링 그룹에 조인하며 클라이언트의 타임존 정보를 전달함)*

---

## 4. 확장 가이드

새로운 데이터 형식이나 상태를 추가해야 할 경우:
1.  기존 `exporterType` 중 가장 적절한 기본 타입을 선택합니다.
2.  필요한 경우 `/` 뒤에 새로운 `subType`을 정의합니다.
    *   예: 에러 로그만 구분하고 싶다면 `log/e`
    *   예: 실시간 알림 이벤트를 추가하고 싶다면 `event/alert`
3.  클라이언트의 `processMessage` 스위치 문에서 해당 `subType`에 대한 처리 로직을 추가합니다.
