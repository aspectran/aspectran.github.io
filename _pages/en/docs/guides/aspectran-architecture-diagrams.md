---
format: fluid article
sidebar: toc
title: Aspectran Architecture Diagrams
subheadline: Architecture
mermaid: true
---

Aspectran is a lightweight, high-performance JVM framework that provides a single, unified programming model across diverse execution environments—including Web, Command-Line Shell, Background Daemon, and Embedded systems—based on a Request-Oriented Architecture and environment abstraction mechanisms.

This document brings together diagrams that visualize Aspectran's internal architecture and core operating principles across nine complementary perspectives (layered structures, request processing pipelines, conceptual models, package dependencies, runtime lifecycles, and AOP mechanisms). Each diagram focuses on specific architectural facets, helping developers and system architects develop a comprehensive understanding of the framework's design philosophy and component interactions.

## Overview of Core Components

*   **Adapters**: Standardize inputs and outputs across disparate execution environments—Web, CLI Shell, Background Daemon, and Embedded API—into uniform interfaces, delivering incoming requests to the `Activity` and returning responses in a consistent manner.
*   **Activity**: The execution engine that governs the entire lifecycle of an individual request. It manages the whole process from entry point, context resolution, and translet lookup/execution to view rendering, response delivery, and resource cleanup.
*   **Translet**: A declarative unit of execution rules for handling a request. It specifies under what conditions and in what sequence `Action`s are executed, as well as which `View` template or format receives the final results.
*   **Actions**: The atomic units that carry out concrete business operations. Actions invoke methods on Java Beans (InvokeAction), branch execution conditionally (ChooseAction), or dispatch control to another translet or view.
*   **Core Components**: Foundational infrastructure services powering the framework, including the IoC/DI Bean Container, AOP Proxy Engine, AsEL (Aspectran Expression Language), Session Manager, and Scheduler.
*   **View & Response**: Represents and delivers the outcome of executed actions into user-facing responses:
    *   **View Dispatcher**: Integrates with template engines (FreeMarker, Pebble, Thymeleaf, JSP) to render dynamic server-side UI views (`<dispatch>`).
    *   **Data Transformation**: Automatically serializes results into modern REST API and data exchange formats including JSON, XML, APON, and Plain Text (`<transform>`).
    *   **Redirect & Forward**: Supports client-side HTTP redirects (`RedirectResponse`) and internal server-side forwarding (`ForwardResponse`).
*   **Services**: Lifecycle-managed (`ServiceLifeCycle`) containers that bootstrap the framework within specific runtime environments. Rooted in `CoreService`, specialized implementations like `WebService`, `ShellService`, and `DaemonService` assemble and run the system.

## 1. Modular Layered Architecture

This diagram shows all the components of Aspectran divided into functional layers. External requests (HTTP, CLI, Daemon Trigger, Embed API) enter and become standardized through the Adapter Layer, initiate request lifecycles and pipeline orchestration within the integrated Activity & Translet Layer, and organically connect to Core Layer infrastructure (ActivityContext) and the View & Response Layer in a cohesive 4-layer architecture.

*   **Adapter Layer**: Abstracts environment and protocol differences (Web, Shell, Daemon, Embedded) into unified request specifications.
*   **Activity & Translet Layer**: Harmoniously integrates the execution engine (`Activity`) that governs request lifecycles with `Translet` blueprints that encapsulate processing rules, orchestrating and managing the execution of business actions (`Actions`).
*   **Core Layer (ActivityContext)**: Centered on `ActivityContext`—the heart of the framework—providing foundational infrastructure including the IoC/DI Bean Container, AOP Engine, AsEL expression language, Session Manager, and Scheduler.
*   **View & Response Layer**: The output tier that delivers business logic outcomes to clients. It encompasses template-driven dynamic UI rendering (`ViewDispatcher`), data format serialization for RESTful APIs (`TransformResponse` - JSON, XML, APON, Plain Text), and response flow control (`Redirect & Forward`).

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
    Web["Web Adapter"]:::adapter
    Shell["Shell Adapter"]:::adapter
    DaemonAdp["Daemon Adapter"]:::adapter
    Embed["Embed Adapter"]:::adapter
  end

  %% Activity & Translet Layer
  subgraph ActivityProcessing[Activity & Translet Layer]
    Activity["Activity (Lifecycle & Execution Engine)"]
    Translet["Translet (Request / Content / Response Rules)"]
    Actions["Actions (Invoke, Choose, Transform, ...)"]
    Activity -->|orchestrates & executes| Translet
    Translet -->|executes steps| Actions
  end

  %% Core Capabilities
  subgraph Core[Core Layer / ActivityContext]
    ActCtx["ActivityContext (Central Hub)"]:::core
    Beans["IoC/DI Bean Container"]:::core
    AOP["AOP Engine"]:::core
    AsEL["AsEL"]:::core
    SessionMgr["Session Manager"]:::core
    Sched["Scheduler"]:::core
    ActCtx --- Beans & AOP & AsEL & SessionMgr & Sched
  end

  %% View & Response Layer
  subgraph ViewLayer[View & Response Layer]
    ViewDispatcher["View Dispatcher<br>(Thymeleaf, FreeMarker, Pebble, JSP)"]:::layer
    TransformResponse["Data Transformer<br>(JSON, XML, APON, Plain Text)"]:::layer
    RedirectForward["Flow Controller<br>(Redirect, Forward)"]:::layer
  end

  %% Wiring
  Adapters -->|dispatch request| Activity
  Activity -.->|accesses context| ActCtx
  Actions --> Beans
  Actions --> AsEL
  Actions --> AOP
  Actions --> SessionMgr
  Actions --> Sched
  Actions -->|dispatch view| ViewDispatcher
  Actions -->|serialize data| TransformResponse
  Actions -->|redirect / forward| RedirectForward

  %% Notes
  Note1["Adapter: Abstracts execution environments"]:::note
  Note2["Activity & Translet: Orchestrates request lifecycles and execution pipelines"]:::note
  Note3["View & Response: UI templates, REST API data serialization, flow control"]:::note
  Note1 --> Adapters
  Note2 --> ActivityProcessing
  Note3 --> ViewLayer
```

## 2. Detailed Layered Structure

A comprehensive view of the subsystem groups within the `Aspectran Runtime` container and their runtime interactions. The `Services` tier bootstraps and supervises environment-specific services (`CoreServices`, `SchedulerServices`, `WebServices`, `DaemonServices`, `ShellServices`, `EmbedServices`). Incoming requests channeled through adapters transition through Activity -> Translet -> Actions, tapping into core capabilities (Beans, AOP, AsEL, Session, Scheduler) before being routed to various response channels such as view dispatching, data transformations, and redirects.

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

    subgraph ViewLayer["View & Response"]
      ViewDispatcher["ViewDispatcher (Thymeleaf/FreeMarker/Pebble/JSP)"]
      TransformResponse["TransformResponse (JSON/XML/APON/Text)"]
      RedirectForward["Redirect & Forward"]
    end

    subgraph Adapters["Execution Adapters"]
      Web["Web Adapter"]
      Shell["Shell Adapter"]
      DaemonAdp["Daemon Adapter"]
      Embed["Embed Adapter"]
    end

    subgraph Services["Services"]
      ServicesHub["Services"]
      CoreSvc["Core Services"]
      SchedSvc["Scheduler Services"]
      WebSvc["Web Services"]
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
  Actions -->|transform| TransformResponse
  Actions -->|redirect/forward| RedirectForward

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

## 3. Pipeline-Centric View

A data-flow-oriented diagram illustrating how requests traverse the processing pipeline until a final response is generated. Requests originating from diverse entrypoints (HTTP, CLI, Daemon, Embedded, Scheduler) pass through dedicated adapters (WebActivity, ShellActivity, DaemonActivity, etc.) into an integrated pipeline (`RequestAdapter` → `Activity` → `Translet` → `Advice/Actions` → `ResponseAdapter`).

*   `DefaultCoreService` instantiates `ActivityContext`, feeding beans, AOP aspects, translet rules, messages, and profile configurations into the pipeline.
*   The Scheduler service drives scheduled/periodic executions through `ActivityLauncherJob` directly into the activity pipeline.

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
  HTTP --> WA
  CLI --> SA
  Daemon --> DA
  Embedded --> EA
  Scheduler --> Sch

  %% Adapters run pipeline
  WA & SA & DA & EA --> Req

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
  class WA,SA,DA,EA adapt
  class Sch,AJ ext
```

## 4. Simplified Pipeline View

A streamlined diagram focusing on the core request processing flow, abstracting away secondary details. It presents the four foundational pillars (`Entrypoints` → `Execution Adapters` → `Request Pipeline` → `Core Context`), allowing developers to build an intuitive mental model of Aspectran's request-response lifecycle.

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

## 5. Core Concept Map

A structured map visualizing the five foundational pillars of Aspectran (`Activity`, `Translet`, `Bean`, `Action`, `Aspect`) alongside the presentation tier (`Template / View`), highlighting their relationships and individual responsibilities.

*   **Activity**: The execution engine and lifecycle management context for every request.
*   **Translet**: The declarative blueprint specifying request processing rules.
*   **Bean**: Components whose lifecycles and dependency graphs are managed by the IoC/DI container.
*   **Action**: Concrete business logic units executed in sequence or conditionally within a Translet.
*   **Aspect**: Modular cross-cutting concern logic applied transparently across Activities and Beans.
*   **Template / View**: The output tier that dynamically renders action results for presentation.

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

## 6. Core Package Relationships

Shows package-level dependency hierarchies and runtime interactions among primary classes. Execution environment modules (`daemon`, `shell`, `web`) and service extensions (`scheduler`) depend on the core service package (`core.service`), which coordinates the activity (`core.activity`) and context (`core.context`) modules.

*   `CoreService` creates `Activity` instances to process requests.
*   `Activity` utilizes `ActivityContext` resources to execute configured `Translet`s.

```mermaid
graph TD
  subgraph ExecEnv [Execution Environments]
    direction LR
    DAEMON[com.aspectran.daemon]
    SHELL[com.aspectran.shell]
    WEB[com.aspectran.web]
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

  class DAEMON,SHELL,WEB,SCHED,CORE_SVC,CORE_ACT,CORE_CTX pkg
```

## 7. Request Lifecycle Sequence

A step-by-step sequence diagram tracing chronological interactions among major components from initial request arrival to final response delivery:

1.  **Request Entry (Steps 1–3)**: The client request arrives at the execution adapter (Web/Shell, etc.), requests activity processing from CoreService, and initializes an `Activity` instance.
2.  **Rule Resolution & Execution (Steps 4–5)**: The `Activity` resolves the matching `Translet` rule for the request path and initiates execution.
3.  **Action & Bean Invocation (Steps 6–9)**: Actions defined within the Translet execute, invoking business bean methods and aggregating execution results (`ActionResult`).
4.  **View Dispatching (Steps 10–12)**: When response dispatching (`dispatch`) is configured, control passes to `ViewDispatcher` to select and execute the appropriate template engine.
5.  **Completion & Response (Steps 13–15)**: Upon translet completion, the `Activity` finalizes the response and delivers it back to the client via the adapter.

```mermaid
sequenceDiagram
    autonumber

    actor Client
    participant Adapter as "Execution Adapter<br>(Web/Shell...)"
    participant CoreService as "Core Service"
    participant Activity as "Activity"
    participant Translet as "Translet"
    participant Action as "Action"
    participant Bean as "Business Bean"
    participant ViewDispatcher as "View Dispatcher"

    Client->>Adapter: 1. Request
    Adapter->>CoreService: 2. Request activity execution
    CoreService->>Activity: 3. Create & initialize Activity

    activate Activity
    Activity->>Activity: 4. Resolve Translet for request
    Activity->>+Translet: 5. Execute Translet

    Translet->>+Action: 6. Execute Actions
    Action->>+Bean: 7. Invoke business logic
    Bean-->>-Action: 8. Return business logic result
    Action-->>-Translet: 9. Return Action result (ActionResult)

    alt When view rendering is required (dispatch)
        Translet->>+ViewDispatcher: 10. Delegate view rendering
        ViewDispatcher->>ViewDispatcher: 11. Select & execute template engine
        ViewDispatcher-->>-Translet: 12. Return rendered view (response)
    end

    Translet-->>-Activity: 13. Translet execution completed

    Activity->>Adapter: 14. Build final response
    deactivate Activity

    Adapter->>Client: 15. Deliver final response
```

## 8. Bean Lifecycle & Scopes

Details how the Aspectran IoC container creates, manages, and destroys Beans, outlining scope lifecycle policies across the application lifetime:

*   **Application Startup**: During container boot, bean definitions and metadata are registered via XML, APON configuration files, and annotation-driven component scanning.
*   **Singleton Bean Lifecycle**: Singleton beans progress through `Instantiation` → `Dependency Injection (DI)` → `Initialization Callbacks (InitializableBean, @Initialize)` and remain available for reuse throughout the runtime.
*   **Application Runtime Scopes**:
    *   `request` scope: Created when an `Activity` starts and destroyed when the request completes.
    *   `session` scope: Created alongside user sessions and destroyed when sessions expire.
    *   `prototype` scope: Instantiated anew each time requested from the container.
*   **Application Shutdown**: On shutdown signals, `Destruction Callbacks (DisposableBean, @Destroy)` execute to cleanly release managed resources.

```mermaid
graph TD
    subgraph "Application Startup"
        A[Application Startup] --> B{IoC Container Init};
        B --> C["Scan Bean Metadata<br>(XML/APON) and<br>Auto Component Scan"];
    end

    subgraph "Singleton Bean Lifecycle"
        C --> D{Create Singleton Beans};
        D --> E["1. Instantiation"];
        E --> F["2. Dependency Injection (DI)"];
        F --> G["3. Execute Init Callbacks<br>(e.g., InitializableBean, @Initialize)"];
        G --> H((Ready for Use));
    end

    subgraph "Application Runtime"
        H --> I{Application Running};
        I -- "On Request" --> J{"'request' scoped beans<br>created & destroyed"};
        I -- "On Session" --> K{"'session' scoped beans<br>created & destroyed"};
        I -- "On Invocation" --> L{"'prototype' scoped beans<br>created (destruction not managed)"};
    end

    subgraph "Application Shutdown"
        I --> M{Application Shutdown};
        M --> N["4. Execute Destroy Callbacks<br>(e.g., DisposableBean, @Destroy)"];
        N --> O((Singleton Beans Destroyed));
    end

    style H stroke:#155724
    style O stroke:#721c24
```

## 9. AOP Mechanism

A sequence diagram detailing how Aspectran's AOP proxy intercepts method invocations to transparently inject cross-cutting concerns (e.g., transactions, logging, security). It comprehensively depicts both the normal execution path and the exception handling (Exception Thrown) flow.

### Execution Flow Overview

1.  **Pre-Processing (Before Advice)**: When a client calls a target bean, the dynamic proxy intercepts the invocation and executes matching `Before` advice on the Aspect first (e.g., initiating transactions, validating parameters, logging request start).
2.  **Target Method Execution**: Upon successful pre-processing, the proxy delegates execution to the actual target bean method to perform core business logic.
3.  **Branch 1: Normal Execution (Normal Flow)**
    *   **After Advice**: When business logic completes successfully, `After` advice executes to perform post-processing tasks or commit transactions.
    *   **Finally Advice**: Always executes regardless of success or failure to safely release managed resources (e.g., closing database sessions).
    *   The final result returns to the client.
4.  **Branch 2: Exception Handling (Exception Thrown Flow)**
    *   **After Skipped**: If an exception occurs during business logic execution, `After` advice is immediately skipped.
    *   **Thrown Advice**: Runs **before the Finally stage** to safely handle transaction rollbacks, log error details, and issue administrative alerts while resources remain open.
    *   **Finally Advice**: Runs after rollback handling to ensure database connections and session resources are reliably closed.
    *   Propagates the exception up the call stack (Exception Re-throw) or returns a designated error response.

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Proxy as "AOP Proxy"
    participant Aspect as "Aspect"
    participant Target as "Target Bean"

    Client->>Proxy: Method Call
    activate Proxy
    Proxy->>Aspect: Execute Before Advice
    note right of Aspect: Pre-processing logic (e.g., start transaction, validation, logging)

    Aspect->>Target: Invoke original method
    note right of Target: Execute core business logic

    alt Normal Execution Flow
        Target-->>Aspect: Return business logic result
        Aspect->>Aspect: Execute After Advice
        note right of Aspect: Post-processing logic (e.g., commit transaction, format result)
        Aspect->>Aspect: Execute Finally Advice
        note right of Aspect: Resource cleanup (e.g., close session/connection)
        Aspect-->>Proxy: Return final result
        Proxy-->>Client: Return final result
    else Exception Thrown Flow
        Target-->>Aspect: Exception Thrown
        note over Aspect: After Advice is skipped
        Aspect->>Aspect: Execute Thrown Advice
        note right of Aspect: Exception handling (e.g., rollback transaction, error logging)
        Aspect->>Aspect: Execute Finally Advice
        note right of Aspect: Resource cleanup (e.g., safe close of connection/session after rollback)
        Aspect-->>Proxy: Propagate exception or return error response
        Proxy-->>Client: Propagate exception or return error response
    end
    deactivate Proxy
```

These diagrams will be a useful guide to understanding Aspectran's design philosophy and internal workings, serving as a dependable reference for architecting robust, scalable systems.
