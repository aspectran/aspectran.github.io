---
format: plate solid article
sidebar: toc-left
title: "`com.aspectran.core.scheduler.service` 패키지 상세 분석"
headline:
teaser:
---

## 1. 설계 목표 및 주요 역할

이 패키지는 강력한 오픈소스 스케줄링 라이브러리인 **Quartz를 Aspectran 프레임워크에 완벽하게 통합**하는 역할을 합니다. 이 패키지의 설계 목표는 다음과 같습니다.

-   **선언적 스케줄링 제공**: 개발자가 Quartz API를 직접 사용하여 복잡한 스케줄링 코드를 작성하는 대신, Aspectran 설정 파일에 `<schedule>` 규칙을 선언하는 것만으로 간단하게 스케줄링을 구현할 수 있도록 합니다.
-   **Aspectran 컨텍스트 내에서 작업 실행**: 스케줄된 작업(트랜슬릿)이 실행될 때, Aspectran의 완전한 컨텍스트 내에서 동작하도록 보장합니다. 이를 통해 스케줄된 작업에서도 DI(의존성 주입)를 통해 빈을 사용하거나 AOP(애스펙트)를 적용받는 등 프레임워크의 모든 기능을 활용할 수 있습니다.
-   **Quartz와의 브릿지 역할**: Aspectran의 서비스 생명주기 및 설정 모델과 외부 라이브러리인 Quartz의 스케줄링 모델 사이의 간극을 메우는 어댑터(Adapter) 또는 브릿지(Bridge) 역할을 수행합니다.

결론적으로, 이 패키지는 스케줄링을 Aspectran의 일급 시민(first-class citizen)으로 만들어, 개발자가 예약된 작업을 애플리케이션의 핵심 설정의 일부로 쉽게 정의하고 관리할 수 있게 하는 것을 목표로 합니다.

## 2. 주요 클래스 및 인터페이스 상세 분석

### `SchedulerService` (인터페이스)

Aspectran 내의 스케줄링 서비스를 위한 명세입니다.

**주요 책임 (Key Responsibilities):**
-   `ServiceLifeCycle`을 상속하여, 부모 `CoreService`에 의해 생명주기가 관리되는 하위 서비스(sub-service)로 동작합니다.
-   `pauseAll()`, `resumeAll()`, `pause(scheduleId)` 등 스케줄러의 동작을 제어하는 메서드를 정의합니다.
-   스케줄된 작업이 실행될 `ActivityContext`에 대한 접근점을 제공합니다.

### `DefaultSchedulerService` (구현 클래스)

`SchedulerService`의 최종 구현체로, Aspectran의 `ScheduleRule`을 읽어 실제 Quartz 스케줄러에 작업을 등록하고 관리하는 모든 로직을 담당합니다.

**주요 책임 (Key Responsibilities):**
-   `AbstractServiceLifeCycle`을 상속하여 표준 서비스 생명주기를 따릅니다.
-   내부적으로 Quartz의 `Scheduler` 인스턴스들을 관리합니다.

**핵심 메서드 분석:**
-   `doStart()`: `CoreService`가 시작될 때 호출되는 핵심 초기화 메서드입니다.
    1.  `ActivityContext`에서 모든 `ScheduleRule` 목록을 가져옵니다.
    2.  각 `ScheduleRule`에 대해, 설정에 명시된 `schedulerBean`을 참조하여 Quartz `Scheduler` 인스턴스를 가져옵니다. (만약 `schedulerBean`이 없으면, `SchedulerFactoryBean`을 통해 기본 스케줄러를 생성합니다.)
    3.  `ScheduleRule`에 정의된 각 작업(`ScheduledJobRule`)에 대해 Quartz의 `JobDetail`을 생성합니다. 이때, 실제 실행될 Quartz Job 클래스는 항상 **`ActivityLauncherJob`**으로 고정됩니다.
    4.  `ActivityLauncherJob`이 실행될 때 필요한 정보(실행할 `translet`의 이름, `CoreService` 인스턴스 등)를 `JobDataMap`에 담아 `JobDetail`에 설정합니다.
    5.  `ScheduleRule`의 `<trigger>` 설정에 따라 `CronTrigger` 또는 `SimpleTrigger`를 생성합니다.
    6.  생성된 `JobDetail`과 `Trigger`를 Quartz `Scheduler`에 등록(`scheduler.scheduleJob()`)하여 스케줄링을 시작합니다.
-   `doStop()`: 서비스가 중지될 때, 관리하던 모든 Quartz `Scheduler` 인스턴스를 안전하게 종료(`shutdown()`)합니다.

### `ActivityLauncherJob` (Quartz Job 구현체)

이 클래스는 `com.aspectran.core.scheduler.job` 패키지에 있지만, 스케줄러 서비스의 동작을 이해하는 데 가장 핵심적인 클래스입니다.

**주요 책임 (Key Responsibilities):**
-   Quartz의 `org.quartz.Job` 인터페이스를 구현한, Aspectran과 Quartz를 잇는 **가교 역할**을 합니다.
-   Quartz 스케줄러에 의해 지정된 시간에 실행되도록 약속된 범용 작업 실행기입니다.

**핵심 메서드 분석:**
-   `execute(JobExecutionContext context)`: Quartz 스케줄러가 작업 실행 시간이 되면 이 메서드를 호출합니다.
    1.  `JobExecutionContext`에 담겨 있는 `JobDataMap`으로부터 `CoreService` 인스턴스와 실행할 `transletName`을 꺼냅니다.
    2.  획득한 `CoreService`를 사용하여, 해당 `transletName`을 실행하기 위한 새로운 `Activity`를 생성하고 실행합니다. (내부적으로 `DaemonService.translate()`와 유사한 방식으로 동작)

## 3. 다른 패키지와의 상호작용

-   **`com.aspectran.core.service`**: `SchedulerService`는 `CoreService`의 하위 서비스로 관리됩니다. `CoreService`의 `doStart()` 메서드가 `SchedulerService`를 생성하고 시작시킵니다.
-   **`com.aspectran.core.context.rule`**: `ActivityContext`에 등록된 `ScheduleRule`과 `ScheduledJobRule` 객체를 읽어와서 어떤 작업을 언제 실행할지 결정합니다.
-   **`org.quartz`**: 이 패키지는 Quartz 라이브러리와의 직접적인 연동을 담당합니다. `Scheduler`, `JobDetail`, `Trigger` 등 Quartz의 핵심 API를 사용하여 실제 스케줄링 기능을 구현합니다.

## 4. 패키지 요약 및 아키텍처적 의미

`com.aspectran.core.scheduler.service` 패키지는 **어댑터/브릿지 패턴(Adapter/Bridge Pattern)**의 훌륭한 예시입니다. 강력하지만 사용법이 복잡할 수 있는 외부 라이브러리(Quartz)를 Aspectran의 선언적 설정 모델(`<schedule>` 규칙)과 생명주기 안에 완벽하게 통합하여, 사용자가 매우 쉽고 일관된 방식으로 스케줄링 기능을 사용할 수 있도록 합니다.

이 통합의 핵심적인 설계는 **`ActivityLauncherJob`**입니다. 이 범용 Job 클래스는 Quartz의 실행 컨텍스트에서 Aspectran의 실행 컨텍스트로 넘어오는 '콜백(Callback)' 역할을 수행합니다. 이 가교 덕분에, 스케줄러에 의해 실행되는 작업은 단순한 Java 코드가 아니라, DI, AOP 등 Aspectran의 모든 컨텍스트 기능이 적용되는 완전한 트랜슬릿이 됩니다. 이는 스케줄링 작업의 재사용성과 확장성을 극대화하는 매우 강력한 아키텍처입니다.
