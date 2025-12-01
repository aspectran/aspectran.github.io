---
title: "Aspectran Scheduler: Translet을 이용한 강력한 작업 자동화"
subheadline: 사용자 가이드
---

Aspectran Scheduler는 애플리케이션 내의 특정 작업을 정해진 시간에 또는 주기적으로 실행할 수 있도록 하는 강력한 기능입니다. 이 기능을 통해 개발자는 배치(Batch) 작업, 데이터 동기화, 리포트 생성 등 다양한 백그라운드 태스크를 Aspectran의 핵심 컴포넌트인 **Translet**을 사용하여 손쉽게 구현하고 관리할 수 있습니다.

## 1. 핵심 아키텍처: 내장된 Quartz 기반 프레임워크

Aspectran Scheduler의 가장 중요한 특징은 **Quartz 스케줄러 기반의 강력한 스케줄링 프레임워크를 코어에 내장**하고 있다는 점입니다. 개발자는 별도의 스케줄링 라이브러리를 직접 통합하는 복잡한 과정 없이, Aspectran이 제공하는 설정 규칙만으로 즉시 스케줄링 기능을 활성화하고 사용할 수 있습니다.

핵심은 **`SchedulerService`** 인터페이스이며, Aspectran은 이 인터페이스의 기본 구현체로 Quartz를 사용하는 `DefaultSchedulerService`를 제공합니다. 따라서 개발자는 스케줄링의 복잡한 내부 동작을 신경 쓸 필요 없이, 자신이 가장 잘 아는 **Translet**을 사용하여 원하는 작업을 손쉽게 자동화할 수 있습니다.

## 2. 스케줄러 설정 방법

Aspectran은 스케줄러를 설정하는 두 가지 주요 방법을 제공합니다.

1.  **XML/APON 기반 설정**: 전통적이고 명시적인 방법으로, 모든 규칙을 설정 파일에 정의합니다.
2.  **어노테이션 기반 설정**: Java 클래스 내에서 어노테이션을 사용하여 스케줄링 규칙을 직접 정의하는 현대적인 방법입니다.

---

### 방법 1: XML/APON 기반 설정

이 방식은 스케줄러 빈(Bean)과 스케줄 규칙(`<schedule>`)을 XML 또는 APON 파일에 명시적으로 정의합니다.

#### 1단계: 스케줄러 빈(Bean) 정의하기

스케줄러 인스턴스를 생성하는 빈을 정의합니다. Aspectran이 제공하는 `QuartzSchedulerFactoryBean`을 사용하는 것이 가장 간결하고 권장되는 방법입니다.

```xml
<bean id="scheduler1" class="com.aspectran.core.scheduler.support.QuartzSchedulerFactoryBean">
    <property type="properties" name="quartzProperties">
        <entry name="org.quartz.scheduler.instanceName">MyScheduler</entry>
        <entry name="org.quartz.threadPool.threadCount">10</entry>
        <!-- 기타 모든 Quartz 속성... -->
    </property>
</bean>
```

> **Quartz 속성 설정**
> 스레드 풀(threadPool), 잡 스토어(jobStore) 등 Quartz 스케줄러의 세부 동작은 매우 다양한 속성을 통해 제어할 수 있습니다. 모든 속성에 대한 자세한 내용은 **[Quartz 공식 설정 문서](http://www.quartz-scheduler.org/documentation/quartz-2.3.0/configuration/)**를 참고하시기 바랍니다.

#### 2단계: `<schedule>` 규칙 정의하기

정의된 스케줄러 빈을 사용하여, `<schedule>` 규칙 그룹을 정의합니다. 이 규칙은 **하나의 실행 주기(트리거)를 공유하는 잡(Job)들의 그룹**을 의미합니다.

```xml
<schedule id="my-schedule">
    <!-- 1. 언제 실행할지 정의 (트리거) -->
    <scheduler bean="scheduler1">
        <trigger type="cron">
            expression: 0 0 2 * * ?
        </trigger>
    </scheduler>

    <!-- 2. 무엇을 실행할지 정의 (잡) -->
    <job translet="/batch/daily-report"/>
    <job translet="/batch/log-archive"/>
</schedule>
```

---

### 방법 2: 어노테이션 기반 설정

`@Schedule` 어노테이션을 사용하면, 스케줄러 빈 정의부터 잡(Job)과 트리거(Trigger) 설정까지 모든 것을 하나의 Java 클래스 안에서 선언적으로 처리할 수 있습니다. 이는 코드의 응집도를 높이고, XML 설정을 최소화하는 장점이 있습니다.

#### `@Schedule` 어노테이션 사용 예제

다음 예제는 `AnnotatedScheduledTasks.java` 클래스 하나에 스케줄러 빈, 스케줄 규칙, 그리고 잡이 실행할 Translet까지 모두 정의한 것입니다.

```java
@Component
@Bean("annotatedScheduledTasks")
@Schedule(
    id = "annotated-schedule",
    scheduler = "annotatedScheduler", // 아래 @Bean 메소드에서 생성될 스케줄러 빈의 이름
    cronTrigger = @CronTrigger(
        expression = "0/10 * * * * ?" // 10초마다 실행
    ),
    jobs = {
        @Job(translet = "/annotated/job1") // 실행할 Translet 이름
    }
)
public class AnnotatedScheduledTasks {

    // 1. 잡(Job)이 실행할 Translet을 정의
    @Request("/annotated/job1")
    @Transform(FormatType.TEXT)
    public String myScheduledTask() {
        return "Annotation-based job executed at " + LocalDateTime.now();
    }

    // 2. 스케줄러 빈(Bean)을 정의
    @Bean("annotatedScheduler")
    public org.quartz.Scheduler createScheduler() throws SchedulerException {
        // 필요에 따라 Quartz 속성을 로드하거나 생성
        Properties props = new Properties();
        props.put("org.quartz.scheduler.instanceName", "AnnotatedScheduler");
        props.put("org.quartz.threadPool.threadCount", "5");

        SchedulerFactory factory = new StdSchedulerFactory(props);
        return factory.getScheduler();
    }

}
```

-   **`@Schedule`**: 클래스 레벨에 붙여 스케줄 규칙을 정의합니다. `id`, `scheduler` 빈 이름, 트리거(`cronTrigger` 또는 `simpleTrigger`), 그리고 실행할 `jobs` 배열을 속성으로 가집니다.
-   **`@Job`**: `@Schedule`의 `jobs` 속성 내에서 실행할 Translet을 지정합니다.
-   **`@Request`**: `@Job`에 지정된 `translet` 이름을 처리하는 실제 메소드를 정의합니다. 즉, 이 메소드가 스케줄링된 작업의 본체가 됩니다.
-   **`@Bean` 메소드**: `@Schedule`의 `scheduler` 속성에서 참조할 Quartz `Scheduler` 인스턴스를 생성하여 빈으로 등록합니다.

---

### 트리거(Trigger) 타입 상세 설명

트리거는 잡(Job) 그룹이 실행될 시점을 정교하게 제어합니다. XML 방식의 `<trigger>` 요소와 어노테이션 방식의 `@SimpleTrigger`, `@CronTrigger` 어노테이션을 통해 설정할 수 있습니다.

#### `simple` 트리거: 간격 기반 반복

`simple` 트리거는 "지금부터 10초 후에 시작해서, 1시간마다, 총 5번 실행"과 같이 단순한 간격으로 작업을 반복할 때 사용합니다. 특정 간격으로 정해진 횟수만큼 또는 무한히 작업을 반복하는 데 가장 적합합니다.

-   **주요 속성:**
    -   `startDelaySeconds`: 스케줄러가 시작된 후, 첫 실행을 지연할 시간 (초 단위)
    -   `intervalInSeconds`, `intervalInMinutes`, `intervalInHours`: 반복할 시간 간격
    -   `repeatCount`: 첫 실행 후 추가로 반복할 횟수 (`-1`은 무한 반복)
    -   `repeatForever`: `true`로 설정 시 무한 반복

-   **예제 (XML):** 1시간마다 무한히 반복
    ```xml
    <trigger type="simple">
        startDelaySeconds: 10
        intervalInHours: 1
        repeatForever: true
    </trigger>
    ```

-   **예제 (어노테이션):** 5분 후에 시작하여, 30초 간격으로 총 10번 실행
    ```java
    @Schedule(
        // ...
        simpleTrigger = @SimpleTrigger(
            startDelaySeconds = 300,
            intervalInSeconds = 30,
            repeatCount = 9 // 최초 1회 실행 + 9회 반복 = 총 10회
        )
        // ...
    )
    ```

#### `cron` 트리거: 시간표 기반 예약

`cron` 트리거는 "매주 금요일 오후 5시 30분" 또는 "매달 마지막 날 새벽 1시"와 같이 달력과 연관된 복잡한 시간표에 따라 작업을 실행할 때 사용합니다. 이는 강력한 **Cron 표현식**을 기반으로 동작하여 매우 유연하고 강력한 스케줄링을 제공합니다.

-   **주요 속성:**
    -   `expression`: 실행 시간표를 정의하는 Cron 표현식 문자열.

-   **예제 (XML):** 매일 밤 11시 50분에 실행
    ```xml
    <trigger type="cron">
        expression: 0 50 23 * * ?
    </trigger>
    ```

-   **예제 (어노테이션):** 매주 월요일부터 금요일까지, 오전 9시 30분에 실행
    ```java
    @Schedule(
        // ...
        cronTrigger = @CronTrigger(expression = "0 30 9 ? * MON-FRI")
        // ...
    )
    ```

## 3. 스케줄 잡 로깅 및 모니터링

스케줄링된 작업의 실행 상태를 확인하고 디버깅하는 것은 매우 중요합니다. Aspectran은 스케줄 잡의 실행 이벤트를 Logback을 통해 상세하게 기록할 수 있도록 지원합니다.

### 로깅 메커니즘

Aspectran 스케줄러는 `com.aspectran.core.scheduler.activity.ActivityJobReporter` 클래스를 통해 잡의 시작, 성공, 실패 등의 이벤트를 로깅합니다. 이 리포터는 Quartz의 `JobListener`와 연동되어 잡의 생명주기 동안 발생하는 주요 정보를 기록합니다.

### Logback 설정 예제

스케줄러 로그를 별도의 파일로 분리하여 관리하려면 Logback의 `SiftingAppender`와 Aspectran의 `LoggingGroupDiscriminator`를 활용할 수 있습니다. 다음은 `gs-scheduler` 예제 프로젝트의 설정을 참고한 예시입니다.

```xml
<!-- app/config/logging/included/logback-scheduler.xml -->
<included>

    <appender name="SIFT-SCHEDULER" class="ch.qos.logback.classic.sift.SiftingAppender">
        <discriminator class="com.aspectran.logging.LoggingGroupDiscriminator">
            <key>LOGGING_GROUP</key>
            <defaultValue>root</defaultValue>
        </discriminator>
        <sift>
            <appender name="FILE-SCHEDULER-${LOGGING_GROUP}" class="ch.qos.logback.core.rolling.RollingFileAppender">
                <file>${aspectran.basePath:-app}/logs/${LOGGING_GROUP}-scheduler.log</file>
                <rollingPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedRollingPolicy">
                    <fileNamePattern>${aspectran.basePath:-app}/logs/archived/${LOGGING_GROUP}-scheduler.%d{yyyy-MM-dd}.%i.log</fileNamePattern>
                    <maxFileSize>10MB</maxFileSize>
                    <maxHistory>30</maxHistory>
                    <totalSizeCap>1GB</totalSizeCap>
                </rollingPolicy>
                <encoder class="ch.qos.logback.classic.encoder.PatternLayoutEncoder">
                    <charset>UTF-8</charset>
                    <pattern>%-5level %d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %msg%n</pattern>
                </encoder>
            </appender>
        </sift>
    </appender>

    <!-- ActivityJobReporter에서 발생하는 로그를 SIFT-SCHEDULER 앱펜더로 보냅니다. -->
    <logger name="com.aspectran.core.scheduler.activity.ActivityJobReporter" level="debug" additivity="false">
        <appender-ref ref="SIFT-SCHEDULER"/>
    </logger>

</included>
```

메인 `logback.xml` 파일에서 위 설정을 포함하면 (`<include file=".../logback-scheduler.xml"/>`), `ActivityJobReporter`에서 발생하는 모든 로그는 `LOGGING_GROUP` 값에 따라 별도의 스케줄러 로그 파일로 기록됩니다. 기본 `LOGGING_GROUP`은 `root`이므로, 로그 파일은 `app/logs/root-scheduler.log`에 생성됩니다.

### 로그 파일 확인

애플리케이션 실행 후, 설정된 `aspectran.basePath` (기본값 `app`) 아래의 `logs` 디렉터리에서 `root-scheduler.log` 파일을 확인하여 스케줄 잡의 실행 로그를 모니터링할 수 있습니다.

## 4. 전체 설정 예제 및 참고 자료

Aspectran 스케줄러를 실제로 어떻게 구성하고 사용하는지에 대한 완전한 예제는 다음 GitHub 프로젝트에서 확인하실 수 있습니다. 이 프로젝트는 이 문서에서 설명한 모든 개념을 실제로 구현한 좋은 참고 자료입니다.

-   **Aspectran Scheduler 예제 프로젝트**: [https://github.com/aspectran/gs-scheduler](https://github.com/aspectran/gs-scheduler)

## 5. 결론

Aspectran Scheduler는 프레임워크의 핵심 사상인 **추상화와 모듈화**를 잘 보여주는 기능입니다. 개발자는 Quartz API의 복잡함을 신경 쓸 필요 없이, 자신이 가장 잘 아는 **Translet**을 사용하여 원하는 작업을 손쉽게 자동화하고, **XML/APON 기반의 명시적 설정**과 **어노테이션 기반의 편리한 설정** 중 프로젝트에 가장 적합한 방식을 선택하여 스케줄러를 애플리케이션의 일부로 완벽하게 통합하고 관리할 수 있습니다.
