---
format: plate solid article
sidebar: toc
title: "Aspectran Scheduler: Powerful Task Automation with Translets"
subheadline: User Guides
parent_path: /docs
---

Aspectran Scheduler is a powerful feature that allows specific tasks within an application to be executed at a set time or periodically. With this feature, developers can easily implement and manage various background tasks such as batch jobs, data synchronization, and report generation using Aspectran's core component, the **Translet**.

## 1. Core Architecture: Built-in Quartz-based Framework

The most important feature of Aspectran Scheduler is that it has a **powerful scheduling framework based on the Quartz scheduler built into its core**. Developers can immediately activate and use the scheduling feature with just the configuration rules provided by Aspectran, without the complex process of integrating a separate scheduling library themselves.

The core is the **`SchedulerService`** interface, and Aspectran provides `DefaultSchedulerService`, which uses Quartz as the default implementation of this interface. Therefore, developers do not need to worry about the complex internal workings of scheduling and can easily automate the tasks they want using the **Translet** they know best.

## 2. How to Configure the Scheduler

Aspectran provides two main ways to configure the scheduler.

1.  **XML/APON-based Configuration**: A traditional and explicit method where all rules are defined in a configuration file.
2.  **Annotation-based Configuration**: A modern method of defining scheduling rules directly in a Java class using annotations.

---

### Method 1: XML/APON-based Configuration

This approach explicitly defines the scheduler bean and schedule rules (`<schedule>`) in an XML or APON file.

#### Step 1: Define the Scheduler Bean

Define a bean that creates the scheduler instance. Using the `QuartzSchedulerFactoryBean` provided by Aspectran is the most concise and recommended method.

```xml
<bean id="scheduler1" class="com.aspectran.core.scheduler.support.QuartzSchedulerFactoryBean">
    <properties>
        <item type="properties" name="quartzProperties">
            <entry name="org.quartz.scheduler.instanceName">MyScheduler</entry>
            <entry name="org.quartz.threadPool.threadCount">10</entry>
            <!-- All other Quartz properties... -->
        </item>
    </properties>
</bean>
```

> **Quartz Property Settings**
> The detailed behavior of the Quartz scheduler, such as the threadPool and jobStore, can be controlled through a wide variety of properties. For detailed information on all properties, please refer to the **[Quartz Official Configuration Documentation](http://www.quartz-scheduler.org/documentation/quartz-2.3.0/configuration/)**.

#### Step 2: Define the `<schedule>` Rule

Using the defined scheduler bean, define a `<schedule>` rule group. This rule represents a **group of jobs that share a single execution cycle (trigger)**.

```xml
<schedule id="my-schedule" schedulerBean="scheduler1">
    <!-- 1. Define when to execute (trigger) -->
    <scheduler>
        <trigger type="cron" expression="0 0 2 * * ?" />
    </scheduler>

    <!-- 2. Define what to execute (job) -->
    <job translet="/batch/daily-report"/>
    <job translet="/batch/log-archive"/>
</schedule>
```

---

### Method 2: Annotation-based Configuration

Using the `@Schedule` annotation, you can declaratively handle everything from defining the scheduler bean to setting up jobs and triggers, all within a single Java class. This has the advantage of increasing code cohesion and minimizing XML configuration.

#### `@Schedule` Annotation Usage Example

The following example defines a scheduler bean, a schedule rule, and the Translet that the job will execute, all in a single `AnnotatedScheduledTasks.java` class.

```java
@Component
@Bean("annotatedScheduledTasks")
@Schedule(
    id = "annotated-schedule",
    scheduler = "annotatedScheduler", // The name of the scheduler bean to be created in the @Bean method below
    cronTrigger = @CronTrigger(
        expression = "0/10 * * * * ?" // Run every 10 seconds
    ),
    jobs = {
        @Job(translet = "/annotated/job1") // The name of the Translet to execute
    }
)
public class AnnotatedScheduledTasks {

    // 1. Define the Translet that the job will execute
    @Request("/annotated/job1")
    @Transform(FormatType.TEXT)
    public String myScheduledTask() {
        return "Annotation-based job executed at " + LocalDateTime.now();
    }

    // 2. Define the scheduler bean
    @Bean("annotatedScheduler")
    public org.quartz.Scheduler createScheduler() throws SchedulerException {
        // Load or create Quartz properties as needed
        Properties props = new Properties();
        props.put("org.quartz.scheduler.instanceName", "AnnotatedScheduler");
        props.put("org.quartz.threadPool.threadCount", "5");

        SchedulerFactory factory = new StdSchedulerFactory(props);
        return factory.getScheduler();
    }

}
```

-   **`@Schedule`**: Attached at the class level to define a schedule rule. It has attributes for the `id`, the `scheduler` bean name, a trigger (`cronTrigger` or `simpleTrigger`), and an array of `jobs` to execute.
-   **`@Job`**: Specifies the Translet to be executed within the `jobs` attribute of `@Schedule`.
-   **`@Request`**: Defines the actual method that handles the `translet` name specified in `@Job`. In other words, this method becomes the body of the scheduled task.
-   **`@Bean` Method**: Creates and registers as a bean the Quartz `Scheduler` instance that will be referenced by the `scheduler` attribute of `@Schedule`.

---

### Trigger Type Detailed Description

Triggers precisely control when a job group is executed. They can be configured through the `<trigger>` element in XML or the `@SimpleTrigger` and `@CronTrigger` annotations in the annotation-based approach.

#### `simple` Trigger: Interval-based Repetition

The `simple` trigger is used to repeat a task at simple intervals, such as "start 10 seconds from now, and run every hour, for a total of 5 times." It is best suited for repeating a task a set number of times or indefinitely at a specific interval.

-   **Main Attributes:**
    -   `startDelaySeconds`: The time to delay the first execution after the scheduler has started (in seconds)
    -   `intervalInSeconds`, `intervalInMinutes`, `intervalInHours`: The time interval for repetition
    -   `repeatCount`: The number of times to repeat after the first execution (`-1` for infinite repeat)
    -   `repeatForever`: If set to `true`, repeats indefinitely

-   **Example (XML):** Repeat indefinitely every hour
    ```xml
    <trigger type="simple">
        startDelaySeconds: 10
        intervalInHours: 1
        repeatForever: true
    </trigger>
    ```

-   **Example (Annotation):** Start after 5 minutes, and run a total of 10 times at 30-second intervals
    ```java
    @Schedule(
        // ...
        simpleTrigger = @SimpleTrigger(
            startDelaySeconds = 300,
            intervalInSeconds = 30,
            repeatCount = 9 // 1 initial execution + 9 repeats = 10 total executions
        )
        // ...
    )
    ```

#### `cron` Trigger: Schedule-based Reservation

The `cron` trigger is used to execute tasks according to a complex calendar-related schedule, such as "every Friday at 5:30 PM" or "at 1 AM on the last day of every month." It operates based on the powerful **Cron expression**, providing very flexible and powerful scheduling.

-   **Main Attribute:**
    -   `expression`: A Cron expression string that defines the execution schedule.

-   **Example (XML):** Run every night at 11:50 PM
    ```xml
    <trigger type="cron" expression="0 50 23 * * ?" />
    ```

-   **Example (Annotation):** Run every week from Monday to Friday, at 9:30 AM
    ```java
    @Schedule(
        // ...
        cronTrigger = @CronTrigger(expression = "0 30 9 ? * MON-FRI")
        // ...
    )
    ```

## 3. Schedule Job Logging and Monitoring

It is very important to check the execution status of scheduled tasks and to debug them. Aspectran supports detailed logging of schedule job execution events through Logback.

### Logging Mechanism

Aspectran Scheduler logs events such as the start, success, and failure of a job through the `com.aspectran.core.scheduler.activity.ActivityJobReporter` class. This reporter is linked with Quartz's `JobListener` to record key information that occurs during the job's lifecycle.

### Logback Configuration Example

To manage scheduler logs in a separate file, you can use Logback's `SiftingAppender` and Aspectran's `LoggingGroupDiscriminator`. The following is an example based on the configuration of the `gs-scheduler` example project.

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

    <!-- Sends logs from ActivityJobReporter to the SIFT-SCHEDULER appender. -->
    <logger name="com.aspectran.core.scheduler.activity.ActivityJobReporter" level="debug" additivity="false">
        <appender-ref ref="SIFT-SCHEDULER"/>
    </logger>

</included>
```

If you include the above configuration in your main `logback.xml` file (`<include file=".../logback-scheduler.xml"/>`), all logs from `ActivityJobReporter` will be recorded in a separate scheduler log file based on the `LOGGING_GROUP` value. The default `LOGGING_GROUP` is `root`, so the log file will be created at `app/logs/root-scheduler.log`.

### Checking the Log File

After running the application, you can monitor the execution logs of the schedule jobs by checking the `root-scheduler.log` file in the `logs` directory under the configured `aspectran.basePath` (default `app`).

## 4. Full Configuration Example and References

A complete example of how to actually configure and use the Aspectran Scheduler can be found in the following GitHub project. This project is a good reference that actually implements all the concepts described in this document.

-   **Aspectran Scheduler Example Project**: [https://github.com/aspectran/gs-scheduler](https://github.com/aspectran/gs-scheduler)

## 5. Conclusion

Aspectran Scheduler is a feature that well demonstrates the framework's core philosophy of **abstraction and modularization**. Developers do not need to worry about the complexity of the Quartz API; they can easily automate the tasks they want using the **Translet** they know best, and can choose between **explicit XML/APON-based configuration** and **convenient annotation-based configuration** that best suits their project to perfectly integrate and manage the scheduler as part of the application.
