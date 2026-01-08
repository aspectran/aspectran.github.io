---
format: fluid article
sidebar: toc
title: Aspectran Architecture Diagrams
subheadline: Architecture
mermaid: true
---

These are diagrams that represent Aspectran's architecture from various perspectives. Each diagram emphasizes a specific aspect of the system to help understand the overall structure.

- **Adapters**: Abstract the differences in execution environments (e.g., web, shell, daemon) and deliver requests to the `Activity` in a consistent manner.
- **Activity**: The execution engine that manages the lifecycle of a request. It executes the processing steps defined in a `Translet` in sequence.
- **Translet**: A set of rules for processing a request. It defines which `Action` to execute and how to send the result to a `View`.
- **Actions**: The units that perform the actual business logic. They call `Bean`s or interact with databases.
- **Core Components**: Provide core functionalities such as the `Bean` container, AOP engine, AsEL (Aspectran Expression Language), session manager, and scheduler.
- **View**: The part that displays the processing result of an `Action` to the user. It supports various template engines like `JSP`, `Thymeleaf`, etc.
- **Services**: Modules that encapsulate a specific execution environment or functionality and are organically integrated with the core.

---

### 1. Modular Layered Architecture

This diagram shows all the components of Aspectran divided by layer. It illustrates how external requests connect to core functionalities through adapters.

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
  Note1["Adapter: Abstracts execution environments"]:::note
  Note2["Translet: Declaratively designs processing steps"]:::note
  Note3["ViewDispatcher: Renders through a template engine"]:::note
  Note1 --> Adapters
  Note2 --> TransletLayer
  Note3 --> ViewLayer
```

---

### 2. Detailed Layered Structure

A diagram that shows in more detail the main component groups within the `Aspectran Runtime` and their interactions.

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

### 3. Pipeline-Centric View

This diagram represents the process from when a request comes in until a response goes out in a pipeline format. It shows the architecture focusing on data flow and major processing steps.

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

### 4. Simplified Pipeline View

A more concise representation of the pipeline view. It is useful for quickly grasping the core processing flow.

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

### 5. Core Concept Map

A diagram that illustrates the relationships between the five most important concepts that make up Aspectran (Activity, Translet, Bean, Action, Aspect) and the View (Template).

```mermaid
flowchart TB
  A[Aspectran Core Concepts]

  A --> ACT[Activity]
  ACT --> ACT1[Execution engine for all requests]
  ACT --> ACT2[Request lifecycle management context]
  ACT --> ACT3[Consistent handling of all requests]

  A --> TR[Translet]
  TR --> TR1["Blueprint of processing rules (request, response, etc.)"]
  TR --> TR2[Referenced and executed by Activity]
  TR --> TR3[Reusable service unit]

  A --> BEAN["Bean (IoC/DI)"]
  BEAN --> BEAN1[Lifecycle managed by the container]
  BEAN --> BEAN2["Dependency Injection (DI)"]
  BEAN --> BEAN3[Scopes: singleton, prototype, request, session]

  A --> ACTN[Action]
  ACTN --> ACTN1[Defined as part of a Translet's rules]
  ACTN --> ACTN2[Performs business logic]
  ACTN --> ACTN3["Hierarchical results determine follow-up actions and view rendering"]

  A --> ASP["Aspect (AOP)"]
  ASP --> ASP1["Separation of cross-cutting concerns (logging, tx, security)"]
  ASP --> ASP2[AOP proxy performance optimization]
  ASP --> ASP3[Asynchronous execution support]

  A --> TPL[Template / View]
  TPL --> TPL1[Renders the result of Translet processing]
  TPL --> TPL2[Supports FreeMarker, Pebble, Thymeleaf, etc.]
  TPL --> TPL3[Dynamic UI/UX composition]

  ACT -- references --> TR
  TR -- execution plan --> ACTN
  ACTN -- depends on/uses --> BEAN
  ASP -- applies to --> ACT
  ASP -- applies to --> BEAN
  ACTN -- passes result to --> TPL

  classDef concept stroke:#ff5544,stroke-width:3px
  class ACT,TR,BEAN,ACTN,ASP,TPL concept
```

---

### 6. Core Package Relationships

This diagram shows the dependency relationships between major packages. It helps to understand the structure of how high-level execution environments depend on the core packages.

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

---

### 7. Request Lifecycle Sequence

This diagram shows the interaction between major components in chronological order, from when a user request occurs until the final response is delivered.

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
    Adapter->>CoreService: 2. Request to perform activity
    CoreService->>Activity: 3. Create and initialize Activity

    activate Activity
    Activity->>Activity: 4. Find Translet for the request
    Activity->>+Translet: 5. Execute Translet

    Translet->>+Action: 6. Execute Action
    Action->>+Bean: 7. Invoke business logic
    Bean-->>-Action: 8. Return result of logic
    Action-->>-Translet: 9. Return Action Result

    alt If view rendering is needed (dispatch)
        Translet->>+ViewDispatcher: 10. Delegate view rendering
        ViewDispatcher->>ViewDispatcher: 11. Select and execute template engine
        ViewDispatcher-->>-Translet: 12. Return rendered view (response)
    end

    Translet-->>-Activity: 13. Translet processing complete

    Activity->>Adapter: 14. Generate final response
    deactivate Activity

    Adapter->>Client: 15. Send final response
```

---

### 8. Bean Lifecycle & Scopes

This shows the entire process of how the IoC container creates and manages beans. It explains the lifecycle of a `singleton` bean and when `request`, `session`, and `prototype` scope beans are created and destroyed.

```mermaid
graph TD
    subgraph "Application Startup"
        A[Application Start] --> B{IoC Container Initialization};
        B --> C["Scan Bean Definitions<br>(XML/APON) and<br>Component Auto-Scan"];
    end

    subgraph "Singleton Bean Lifecycle"
        C --> D{Singleton Bean Creation};
        D --> E["1. Instantiation"];
        E --> F["2. Dependency Injection (DI)"];
        F --> G["3. Execute Initialization Callbacks<br>(e.g., InitializableBean, @Initialize)"];
        G --> H((Ready for use));
    end

    subgraph "Application Runtime"
        H --> I{Application Running};
        I -- "On Request" --> J{"'request' scope bean<br>Create & Destroy"};
        I -- "On Session Creation" --> K{"'session' scope bean<br>Create & Destroy"};
        I -- "On every call" --> L{"'prototype' scope bean<br>Create (destruction not managed)"};
    end

    subgraph "Application Shutdown"
        I --> M{Application Shutdown};
        M --> N["4. Execute Destruction Callbacks<br>(e.g., DisposableBean, @Destroy)"];
        N --> O((Singleton Bean Destroyed));
    end

    style H stroke:#155724
    style O stroke:#721c24
```

---

### 9. AOP Mechanism

This shows the process where a method call is intercepted by an AOP proxy to execute advice that handles cross-cutting concerns like transactions and logging.

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Proxy as "AOP Proxy"
    participant Aspect as "Aspect"
    participant Target as "Target Bean"

    Client->>Proxy: 1. Method Call

    activate Proxy
    Proxy->>+Aspect: 2. Execute @Around or @Before advice

    note right of Aspect: Execute cross-cutting concern logic (e.g., start transaction, logging)

    Aspect->>+Target: 3. Invoke original method

    note right of Target: Execute core business logic

    Target-->>-Aspect: 4. Return business logic result

    Aspect->>Aspect: 5. Execute @Around or @After advice

    note right of Aspect: Execute post-processing logic (e.g., commit/rollback transaction)

    Aspect-->>-Proxy: 6. Return final result

    Proxy-->>Client: 7. Return final result
    deactivate Proxy
```

These diagrams will be a useful guide to understanding Aspectran's design philosophy and internal workings.
