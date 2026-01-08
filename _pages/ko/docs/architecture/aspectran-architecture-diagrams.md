---
format: fluid article
sidebar: toc
title: Aspectran 아키텍처 다이어그램
subheadline: 아키텍처
mermaid: true
---

Aspectran의 아키텍처를 다양한 관점에서 표현한 다이어그램입니다. 각 다이어그램은 시스템의 특정 측면을 강조하여 전체 구조를 이해하는 데 도움을 줍니다.

- **어댑터 (Adapters)**: 실행 환경(웹, 셸, 데몬 등)의 차이를 추상화하고, 일관된 방식으로 요청을 `Activity`로 전달합니다.
- **액티비티 (Activity)**: 요청의 생명주기를 관리하는 실행 엔진입니다. `Translet`에 정의된 처리 단계를 순서대로 실행합니다.
- **트랜슬릿 (Translet)**: 요청을 처리하는 규칙의 집합입니다. 어떤 `Action`을 실행하고, 결과를 어떻게 `View`로 보낼지 등을 정의합니다.
- **액션 (Actions)**: 실제 비즈니스 로직을 수행하는 단위입니다. `Bean`을 호출하거나 데이터베이스와 상호작용합니다.
- **코어 컴포넌트 (Core Components)**: `Bean` 컨테이너, AOP 엔진, AsEL(표현 언어), 세션 관리자, 스케줄러 등 핵심 기능을 제공합니다.
- **뷰 (View)**: `Action`의 처리 결과를 사용자에게 보여주는 부분입니다. `JSP`, `Thymeleaf` 등 다양한 템플릿 엔진을 지원합니다.
- **서비스 (Services)**: 특정 실행 환경이나 기능을 캡슐화하여 코어와 유기적으로 통합되는 모듈입니다.

---

### 1. 모듈화 계층형 아키텍처 (Modular Layered Architecture)

Aspectran의 전체 구성 요소를 계층별로 나누어 표현한 다이어그램입니다. 외부 요청이 어댑터를 통해 어떻게 코어 기능과 연결되는지 보여줍니다.

```mermaid
flowchart TB
  %% Styles
  classDef layer stroke:#2a4b8d,stroke-width:1px
  classDef core stroke:#1e7f5c,stroke-width:1px
  classDef adapter stroke:#b23a3a,stroke-width:1px
  classDef note stroke:#aaa

  %% Entrypoints
  Clients((External Requests)):::note
  DaemonTrig["Daemon Trigger"]:::note

  Clients ---|HTTP| Web
  Clients ---|CLI| Shell
  Clients ---|Embed API| Embed
  DaemonTrig --> DaemonAdp

  %% Adapter Layer
  subgraph Adapters[Adapter Layer]
    Web["Web Adapter (Servlet/Undertow)"]:::adapter
    Shell["Shell Adapter"]:::adapter
    DaemonAdp["Daemon Adapter"]:::adapter
    Embed["Embed Adapter"]:::adapter
  end

  %% Activity Layer
  subgraph ActivityLayer[Activity Layer]
    Activity["Activity"]
    ActCtx["ActivityContext"]
    Activity --> ActCtx
  end

  %% Translet Layer
  subgraph TransletLayer[Translet Layer]
    Translet["Translet"]
    Actions["Actions (Invoke, Choose, Dispatch, ...)"]
    Activity -->|select & execute| Translet
    Translet -->|orchestrate| Actions
  end

  %% Core Capabilities
  subgraph Core[Bean Container / Core Capabilities]
    Beans["IoC/DI Bean Container"]:::core
    AOP["AOP Engine"]:::core
    AsEL["AsEL"]:::core
    SessionMgr["Session Manager"]:::core
    Sched["Scheduler"]:::core
  end

  %% View Layer
  subgraph ViewLayer[View Layer]
    ViewDispatcher["ViewDispatcher"]:::layer
    TemplateEngines["Template Engines (FreeMarker, Pebble, Thymeleaf, etc.)"]:::layer
    ViewDispatcher --> TemplateEngines
  end

  %% Wiring
  Adapters --> ActivityLayer
  Actions --> Beans
  Actions --> AsEL
  Actions --> AOP
  Actions --> SessionMgr
  Actions --> Sched
  Actions -->|dispatch| ViewDispatcher

  %% Notes
  Note1["Adapter: 실행 환경 추상화"]:::note
  Note2["Translet: 처리 단계를 선언적으로 설계"]:::note
  Note3["ViewDispatcher: 템플릿 엔진을 통해 렌더링"]:::note
  Note1 --> Adapters
  Note2 --> TransletLayer
  Note3 --> ViewLayer
```

---

### 2. 계층 구조 상세 (Detailed Layered Structure)

`Aspectran Runtime` 내부의 주요 컴포넌트 그룹과 그들 간의 상호작용을 더 상세하게 보여주는 다이어그램입니다.

```mermaid
flowchart TB
  subgraph Runtime["Aspectran Runtime"]
    subgraph Core["Core"]
      Beans["IoC Container (Beans)"]
      AOP["AOP (Aspects, Proxies)"]
      AsEL["AsEL (Expression Language)"]
      Scheduler["Scheduler"]
      SessionMgr["Session Manager"]
    end

    subgraph ActivityLayer["Activity Processing"]
      Activity["Activity"]
      Translet["Translet (Request/Content/Response)"]
      Actions["Actions (Invoke, Choose, Dispatch, ...)"]
    end

    subgraph ViewLayer["View / Template"]
      ViewDispatcher["ViewDispatcher (JSP/Thymeleaf/FreeMarker/Pebble)"]
      TemplateEngine["TemplateEngine"]
    end

    subgraph Adapters["Execution Adapters"]
      Web["Web Adapter (Servlet/Undertow)"]
      Shell["Shell Adapter"]
      DaemonAdp["Daemon Adapter"]
      Embed["Embed Adapter"]
    end

    subgraph Services["Services"]
      ServicesHub["Services"]
      CoreSvc["Core Services"]
      SchedSvc["Scheduler Services"]
      WebSvc["Web/Undertow Services"]
      DaemonSvc["Daemon Services"]
      ShellSvc["Shell Services"]
      EmbedSvc["Embed Services"]
    end
  end

  Client["Client (HTTP/CLI)"]
  DaemonTrig["Daemon Trigger"]
  Embedded["Embedded API"]

  Client -->|HTTP| Web
  Client -->|CLI| Shell
  DaemonTrig -->|Startup/Signal| DaemonAdp
  Embedded --> Embed

  Web --> Activity
  Shell --> Activity
  DaemonAdp --> Activity
  Embed --> Activity

  Activity -->|exec plan| Translet
  Translet -->|steps| Actions

  Actions --> Beans
  Actions --> AsEL
  Actions --> AOP
  Actions --> SessionMgr
  Actions --> Scheduler

  Actions -->|dispatch| ViewDispatcher
  ViewDispatcher -->|render| TemplateEngine

  ServicesHub -.-> CoreSvc
  ServicesHub -.-> SchedSvc
  ServicesHub -.-> WebSvc
  ServicesHub -.-> DaemonSvc
  ServicesHub -.-> ShellSvc
  ServicesHub -.-> EmbedSvc

  classDef title stroke:#567,stroke-width:1px,color:#123
  classDef group stroke:#999,stroke-width:1px
  class Core,ActivityLayer,ViewLayer,Adapters,Services group
  class Runtime title
```

---

### 3. 파이프라인 중심 뷰 (Pipeline-Centric View)

요청이 들어와서 응답이 나갈 때까지의 처리 과정을 파이프라인 형태로 표현한 다이어그램입니다. 데이터 흐름과 주요 처리 단계를 중심으로 아키텍처를 보여줍니다.

```mermaid
flowchart LR
  %% Clients / Triggers
  subgraph Entrypoints[Entrypoints]
    HTTP[HTTP Clients]
    CLI[Shell]
    Daemon[Daemon]
    Embedded[Embedded API]
    Scheduler[Scheduler Triggers]
  end

  %% Environment Adapters -> Activities
  subgraph Adapters[Execution Adapters]
    WA[WebActivity]
    TA[TowActivity]
    SA[ShellActivity]
    DA[DaemonActivity]
    EA[EmbeddedActivity]
  end

  %% Core Service & Context
  subgraph Core[Core Layer]
    DCS[DefaultCoreService]
    AC[ActivityContext]
    Beans[Beans / IoC Container]
    AOP[Aspects / Advice]
    Translets[Translet Rules]
    Msg[Messages]
    Env[Profiles & Properties]
  end

  %% Pipeline
  subgraph Pipeline[Request Processing Pipeline]
    Req[RequestAdapter]
    Act[Activity]
    TL[Translet Execution]
    Adv[Advice]
    Res[ResponseAdapter]
  end

  %% Extensions
  subgraph Ext[Extensions]
    Sch[SchedulerService]
    AJ[ActivityLauncherJob]
  end

  %% Flows from entrypoints to adapters
  HTTP --> WA & TA
  CLI --> SA
  Daemon --> DA
  Embedded --> EA
  Scheduler --> Sch

  %% Adapters run pipeline
  WA & TA & SA & DA & EA --> Req

  %% Core service builds context
  DCS --> AC
  AC --> Beans & AOP & Translets & Msg & Env

  %% Pipeline interacts with context
  Req --> Act --> TL
  TL -- uses --> Beans & Adv
  Adv -- triggers --> AOP
  Act --> Res

  %% Scheduler triggers Activities
  Sch --> AJ --> Act

  %% Styling
  classDef core stroke:#2a4b8d,stroke-width:1px;
  classDef pipe stroke:#aa7a00,stroke-width:1px;
  classDef adapt stroke:#1e7f5c,stroke-width:1px;
  classDef ext stroke:#5a3e9b,stroke-width:1px;

  class DCS,AC,Beans,AOP,Translets,Msg,Env core
  class Req,Act,TL,Adv,Res pipe
  class WA,TA,SA,DA,EA adapt
  class Sch,AJ ext
```

---

### 4. 파이프라인 축약 뷰 (Simplified Pipeline View)

파이프라인 뷰를 더 간략하게 표현한 다이어그램입니다. 핵심 처리 흐름을 빠르게 파악하는 데 유용합니다.

```mermaid
flowchart LR
  subgraph Entrypoints[Entrypoints]
    HTTP[HTTP]
    CLI[Shell]
    DTRIG[Daemon Trigger]
    EMB[Embedded API]
  end

  subgraph Adpt[Execution Adapters]
    WA[WebActivity]
    DA[DaemonActivity]
    SA[ShellActivity]
    EA[EmbeddedActivity]
  end

  subgraph Pipe[Request Pipeline]
    Req[RequestAdapter]
    Act[Activity]
    TL[Translet Execution]
    Adv[Advice]
    Res[ResponseAdapter]
  end

  subgraph Ctx[Core Context]
    Beans[Beans]
    AOP[AOP]
    EL[AsEL]
    Sess[SessionMgr]
    Sch[Scheduler]
  end

  HTTP --> WA
  CLI --> SA
  DTRIG --> DA
  EMB --> EA

  WA & SA & DA & EA --> Req

  Req --> Act --> TL

  TL -- uses --> Beans & EL & Sess & Sch
  TL -- triggers --> Adv
  Adv --> AOP
  Act --> Res
```

---

### 5. 핵심 개념 맵 (Core Concept Map)

Aspectran을 구성하는 가장 중요한 5가지 개념(Activity, Translet, Bean, Action, Aspect)과 뷰(Template)의 관계를 도식화한 다이어그램입니다.

```mermaid
flowchart TB
  A[Aspectran Core Concepts]

  A --> ACT[Activity]
  ACT --> ACT1[모든 요청의 실행 엔진]
  ACT --> ACT2[요청 생명주기 관리 컨텍스트]
  ACT --> ACT3[웹/셸 등 모든 요청 일관 처리]

  A --> TR[Translet]
  TR --> TR1["처리 규칙의 설계도 (요청, 응답, 액션 등)"]
  TR --> TR2[Activity가 참조하여 실행]
  TR --> TR3[재사용 가능한 서비스 단위]

  A --> BEAN["Bean (IoC/DI)"]
  BEAN --> BEAN1[컨테이너가 생명주기 관리]
  BEAN --> BEAN2["의존성 주입 (DI)"]
  BEAN --> BEAN3[스코프: singleton, prototype, request, session]

  A --> ACTN[Action]
  ACTN --> ACTN1[Translet의 일부로 규칙 정의]
  ACTN --> ACTN2[비즈니스 로직 수행]
  ACTN --> ACTN3["계층적 결과로 후속 처리 및 뷰 렌더링 결정"]

  A --> ASP["Aspect (AOP)"]
  ASP --> ASP1["횡단 관심사 분리 (로깅, 트랜잭션, 보안)"]
  ASP --> ASP2[AOP 프록시 성능 최적화]
  ASP --> ASP3[비동기 실행 지원]

  A --> TPL[Template / View]
  TPL --> TPL1[Translet 처리 결과 렌더링]
  TPL --> TPL2[FreeMarker, Pebble, Thymeleaf 등 지원]
  TPL --> TPL3[동적인 UI/UX 구성]

  ACT -- 참조 --> TR
  TR -- 실행 계획 --> ACTN
  ACTN -- 의존성 주입/사용 --> BEAN
  ASP -- 적용 --> ACT
  ASP -- 적용 --> BEAN
  ACTN -- 결과 전달 --> TPL

  classDef concept stroke:#ff5544,stroke-width:3px
  class ACT,TR,BEAN,ACTN,ASP,TPL concept
```

---

### 6. 코어 패키지 관계 (Core Package Relationships)

주요 패키지 간의 의존성 관계를 보여주는 다이어그램입니다. 상위 레벨의 실행 환경이 어떻게 코어 패키지에 의존하는지 구조를 파악할 수 있습니다.

```mermaid
graph TD
  subgraph ExecEnv [Execution Environments]
    direction LR
    DAEMON[com.aspectran.daemon]
    SHELL[com.aspectran.shell]
    WEB[com.aspectran.web/undertow]
  end

  subgraph SvcExt [Service Extensions]
    direction LR
    SCHED[com.aspectran.scheduler]
  end

  subgraph CorePkgs [Core Packages]
    direction LR
    CORE_SVC[com.aspectran.core.service]
    CORE_ACT[com.aspectran.core.activity]
    CORE_CTX[com.aspectran.core.context]
  end

  ExecEnv --> SvcExt
  SvcExt --> CorePkgs

  DAEMON & SHELL & WEB --> CORE_SVC
  SCHED --> CORE_SVC

  CORE_SVC --> CORE_ACT
  CORE_SVC --> CORE_CTX
  CORE_ACT --> CORE_CTX

  subgraph KeyClasses [Key Class Interactions]
    direction LR
    cs[CoreService]
    act[Activity]
    tr[Translet]
    ac[ActivityContext]

    cs -- creates --> act
    act -- executes --> tr
    act -- uses --> ac
  end

  CORE_SVC -.-> cs
  CORE_ACT -.-> act & tr
  CORE_CTX -.-> ac

  classDef pkg fill:#f2f2f2,stroke:#555,stroke-width:1px,color:#333
  class DAEMON,SHELL,WEB,SCHED,CORE_SVC,CORE_ACT,CORE_CTX pkg
```

이 다이어그램들은 Aspectran의 설계 사상과 내부 작동 방식을 이해하는 데 유용한 가이드가 될 것입니다.

---

### 7. 요청 생명주기 시퀀스 (Request Lifecycle Sequence)

사용자 요청이 발생했을 때부터 최종 응답이 전달될 때까지, 주요 컴포넌트 간의 상호작용을 시간 순서에 따라 보여주는 다이어그램입니다.

```mermaid
sequenceDiagram
    autonumber

    actor Client
    participant Adapter as "실행 어댑터<br>(Web/Shell...)"
    participant CoreService as "코어 서비스"
    participant Activity as "액티비티"
    participant Translet as "트랜슬릿"
    participant Action as "액션"
    participant Bean as "비즈니스 빈"
    participant ViewDispatcher as "뷰 디스패처"

    Client->>Adapter: 1. 요청 (Request)
    Adapter->>CoreService: 2. 액티비티 수행 요청
    CoreService->>Activity: 3. Activity 생성 및 초기화

    activate Activity
    Activity->>Activity: 4. 요청에 해당하는 Translet 탐색
    Activity->>+Translet: 5. Translet 실행

    Translet->>+Action: 6. Action 실행
    Action->>+Bean: 7. 비즈니스 로직 호출
    Bean-->>-Action: 8. 로직 수행 결과 반환
    Action-->>-Translet: 9. Action 결과 (ActionResult) 반환

    alt 뷰 렌더링이 필요한 경우 (dispatch)
        Translet->>+ViewDispatcher: 10. 뷰 렌더링 위임
        ViewDispatcher->>ViewDispatcher: 11. 템플릿 엔진 선택 및 실행
        ViewDispatcher-->>-Translet: 12. 렌더링된 뷰(응답) 반환
    end

    Translet-->>-Activity: 13. Translet 처리 완료

    Activity->>Adapter: 14. 최종 응답 생성
    deactivate Activity

    Adapter->>Client: 15. 최종 응답 전송
```

---

### 8. 빈 생명주기 및 스코프 (Bean Lifecycle & Scopes)

IoC 컨테이너가 빈(Bean)을 생성하고 관리하는 전체 과정을 보여줍니다. `singleton` 빈의 생명주기와 `request`, `session`, `prototype` 스코프 빈이 언제 생성되고 소멸하는지 설명합니다.

```mermaid
graph TD
    subgraph "Application Startup"
        A[애플리케이션 시작] --> B{IoC 컨테이너 초기화};
        B --> C["빈 설정 정보 스캔<br>(XML/APON) 및<br>컴포넌트 자동 스캔"];
    end

    subgraph "Singleton Bean Lifecycle"
        C --> D{싱글톤 빈 생성};
        D --> E["1. 인스턴스화 (Instantiation)"];
        E --> F["2. 의존성 주입 (DI)"];
        F --> G["3. 초기화 콜백 실행<br>(e.g., InitializableBean, @Initialize)"];
        G --> H((사용 준비 완료));
    end

    subgraph "Application Runtime"
        H --> I{애플리케이션 실행};
        I -- "요청 발생 시" --> J{"'request' 스코프 빈<br>생성 및 소멸"};
        I -- "세션 생성 시" --> K{"'session' 스코프 빈<br>생성 및 소멸"};
        I -- "호출 시마다" --> L{"'prototype' 스코프 빈<br>생성 (소멸은 관리 안 함)"};
    end

    subgraph "Application Shutdown"
        I --> M{애플리케이션 종료};
        M --> N["4. 소멸 콜백 실행<br>(e.g., DisposableBean, @Destroy)"];
        N --> O((싱글톤 빈 소멸));
    end

    style H stroke:#155724
    style O stroke:#721c24
```

---

### 9. AOP 작동 방식 (AOP Mechanism)

메서드 호출이 AOP 프록시에 의해 가로채여, 트랜잭션, 로깅 등 횡단 관심사를 처리하는 어드바이스(Advice)가 실행되는 과정을 보여줍니다.

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Proxy as "AOP 프록시"
    participant Aspect as "애스펙트"
    participant Target as "대상 빈 (Target)"

    Client->>Proxy: 1. 메서드 호출

    activate Proxy
    Proxy->>+Aspect: 2. @Around 또는 @Before 어드바이스 실행

    note right of Aspect: 횡단 관심사 로직 수행 (e.g., 트랜잭션 시작, 로깅)

    Aspect->>+Target: 3. 원본 메서드 호출)

    note right of Target: 핵심 비즈니스 로직 수행

    Target-->>-Aspect: 4. 비즈니스 로직 결과 반환

    Aspect->>Aspect: 5. @Around 또는 @After 어드바이스 실행

    note right of Aspect: 후처리 로직 수행 (e.g., 트랜잭션 커밋/롤백)

    Aspect-->>-Proxy: 6. 최종 결과 반환

    Proxy-->>Client: 7. 최종 결과 반환
    deactivate Proxy
```

이 다이어그램들은 Aspectran의 설계 사상과 내부 작동 방식을 이해하는 데 유용한 가이드가 될 것입니다.
