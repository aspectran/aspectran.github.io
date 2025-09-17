---
format: plate solid article
sidebar: toc-left
title: Aspectran 사용자 가이드
teaser: Aspectran을 처음 접하는 개발자들을 위한 가이드 문서입니다.
---

## 1. Aspectran 소개

Aspectran은 JVM 기반의 경량 고성능 프레임워크로, 단순한 명령줄 애플리케이션부터 복잡한 엔터프라이즈 웹 서비스에 이르기까지 다양한 유형의 애플리케이션을 효율적으로 구축할 수 있도록 설계되었습니다. 이 가이드는 Aspectran을 처음 접하는 개발자들이 프레임워크의 핵심 개념을 깊이 이해하고, 실제 애플리케이션을 개발하며 발생할 수 있는 다양한 상황에 대처할 수 있도록 돕기 위해 작성되었습니다.

### 1.1. Aspectran이란?

Aspectran은 최소한의 종속성과 최적화된 리소스 사용을 통해 빠른 시작 시간과 낮은 메모리 점유율을 자랑하는 프레임워크입니다. 이는 특히 마이크로서비스 아키텍처나 클라우드 환경에 적합합니다.

개발자는 Aspectran을 통해 복잡한 프레임워크 내부 구조를 깊이 이해할 필요 없이, 일반 Java 객체(POJO)를 사용하여 비즈니스 로직에 집중할 수 있도록 직관적인 POJO 중심 프로그래밍 모델을 강조합니다.

### 1.2. 핵심 철학 및 장점

*   **POJO 중심 프로그래밍**: 특별한 인터페이스 구현이나 특정 프레임워크 클래스 상속 없이 일반 Java 객체(POJO)를 사용하여 비즈니스 로직을 구현할 수 있습니다. 이는 개발자가 프레임워크에 대한 학습 부담을 줄이고, 순수한 Java 코드로 비즈니스 문제를 해결하는 데 집중할 수 있게 합니다.
*   **경량 및 고성능**: 최소한의 종속성과 최적화된 리소스 사용으로 빠른 시작 시간과 낮은 메모리 점유율을 제공합니다.
*   **제어의 역전 (IoC) 및 의존성 주입 (DI)**: 프레임워크가 객체의 생성, 구성, 생명주기 관리를 담당하며, 필요한 의존성을 자동으로 주입하여 컴포넌트 간의 결합도를 최소화하고 유연하며 재사용 가능한 코드를 작성할 수 있도록 돕습니다.
*   **관점 지향 프로그래밍 (AOP)**: 로깅, 트랜잭션, 보안 등 애플리케이션 전반에 걸쳐 반복적으로 나타나는 횡단 관심사를 모듈화하여 핵심 비즈니스 로직과 분리합니다.
*   **환경 추상화를 위한 어댑터 패턴**: 동일한 비즈니스 로직이 어떤 환경(웹, 셸, 데몬 등)에서든 수정 없이 실행될 수 있도록 유연성을 제공합니다.

## 2. Aspectran 시작하기

자세한 내용은 [Aspectran 시작하기](/ko/aspectran/getting-started/) 문서를 참고하세요.

## 3. Aspectran 핵심 개념

Aspectran 프레임워크를 효과적으로 사용하기 위해서는 몇 가지 핵심 개념을 이해하는 것이 중요합니다.

### 3.1. Translet (트랜슬렛)

Aspectran에서 요청 처리의 핵심 개념은 `Activity`, `Translet`, `Action`입니다. 이들의 관계를 이해하는 것이 중요합니다.

*   **Activity**: 실제로 요청을 처리하고 최종 응답을 생성하는 **실행 엔진**입니다.
*   **Translet**: 특정 요청에 매핑되어 "어떻게 처리할 것인가"를 정의하는 **설계도 또는 규칙의 집합**입니다.
*   **Action**: `Activity`에 의해 실행되며, 실제 비즈니스 로직을 수행하는 **개별 작업 단위**입니다.

Translet이라는 이름만 보면 실제 요청을 처리하는 주체로 보일 수 있으나, 이는 `Activity`에 직접 접근이 제한되는 사용자 관점에서 비롯된 오해입니다. 실제 모든 처리의 주체는 `Activity`입니다.

#### 3.1.1. Translet의 역할 및 중요성

Translet의 핵심 역할은 **요청 처리 흐름을 정의하는 설계도**가 되는 것입니다.

*   **요청 처리 규칙의 집합**: 특정 요청(웹 환경의 URL, 셸 환경의 명령어 등)에 매핑되어, 요청 파라미터 처리, 실행할 액션, 응답 생성 방식, 예외 처리 등 전체 처리 흐름을 선언적으로 정의합니다.
*   **프로그래밍 인터페이스**: `Activity`와 사용자 코드 간의 데이터 공유 및 제어를 위한 통로 역할을 합니다.
*   **유연한 처리 흐름**: 요청 처리, 액션 실행, 콘텐츠 생성, 변환, 응답 및 전달 등 다양한 처리 규칙을 조합하여 단순한 작업부터 복잡한 워크플로우까지 유연하게 설계할 수 있습니다.

#### 3.1.2. Translet 정의 방법

Aspectran은 Translet을 정의하는 두 가지 주요 방법을 제공합니다.

1.  **선언적 규칙 기반 (XML/APON)**:
    전통적인 방식이며, XML 또는 APON(Aspectran Parameter Object Notation) 형식의 설정 파일을 사용하여 Translet의 처리 흐름을 선언적으로 정의합니다. 이를 통해 비즈니스 로직과 처리 흐름을 분리할 수 있습니다.

    ```xml
    <translet name="/user/info">
      <action bean="userDao" method="getUserInfo"/>
      <transform format="json"/>
    </translet>
    ```
    위 예제는 `/user/info` 요청이 들어오면 `userDao` 빈의 `getUserInfo` 메소드를 실행하고, 그 결과를 JSON 형식으로 변환하여 응답하는 Translet을 정의합니다.

2.  **어노테이션 기반 (Java 코드)**:
    Spring MVC의 `@RequestMapping`과 유사하게, Java 코드 내에서 어노테이션을 사용하여 Translet을 직접 정의하는 현대적인 방법입니다. 이는 개발자에게 더 높은 편의성과 생산성을 제공합니다.

    *   **기본 요청 처리**: `@Component`로 등록된 빈 클래스 내에서 `@RequestToGet`, `@RequestToPost` 등 HTTP 요청 메소드에 대응되는 어노테이션을 특정 메소드에 붙이면, Aspectran은 해당 메소드를 핵심 액션으로 삼아 암시적으로 Translet 규칙을 생성합니다.

        ```java
        @Component
        public class UserApiController {

            @Autowired
            private UserDao userDao;

            @RequestToGet("/user/info/${userId}") // GET /user/info/${userId} 요청에 매핑
            @Transform(format = "json") // 결과를 JSON으로 변환
            public User getUserInfo(Long userId) {
                return userDao.getUserById(userId);
            }
        }
        ```

    *   **비동기 요청 처리**: 시간이 오래 걸리는 작업을 처리해야 할 경우, `async = true` 속성을 사용하여 Translet을 비동기적으로 실행할 수 있습니다. 이는 요청 스레드를 차단하지 않고 백그라운드에서 작업을 수행하여 애플리케이션의 응답성을 유지하는 데 도움을 줍니다.

        ```java
        @Component
        public class ReportController {
            @Autowired
            private ReportService reportService;

            @RequestToPost(path = "/reports/generate", async = true, timeout = 30000L)
            @Transform(format = "text")
            public String generateReport(Translet translet) {
                // 요청 본문을 Aspectran의 Parameters 객체로 파싱합니다.
                // Content-Type에 따라 JSON, XML 등이 자동으로 파싱됩니다.
                Parameters parameters = translet.getRequestAdapter().getBodyAsParameters();

                // 비즈니스 로직은 Parameters 객체를 직접 사용합니다.
                reportService.generate(parameters);

                return "Report generation has started in the background.";
            }
        }
        ```

    *   **어노테이션 상세**: `@Request` 어노테이션은 요청 경로, HTTP 메소드 등 상세한 규칙을 정의할 때 사용합니다. 편의를 위해 `GET`, `POST` 등 각 HTTP 메소드에 해당하는 `@RequestToGet`, `@RequestToPost` 같은 전용 어노테이션도 제공됩니다. 이 어노테이션들은 `value` (경로), `async`, `timeout` 속성을 공통으로 가집니다.

    *   **동적 Translet 생성 (Scanning)**: 수백 개의 유사한 Translet을 반복해서 정의하는 대신, 단 하나의 규칙으로 런타임에 동적으로 Translet을 생성할 수 있습니다. 예를 들어, 특정 디렉터리 아래의 모든 JSP 파일을 스캔하여 각 파일을 뷰로 사용하는 Translet을 자동으로 생성하는 방식입니다.

        ```xml
        <translet name="*" scan="/WEB-INF/jsp/**/*.jsp">
          <description>
            '/WEB-INF/jsp/' 디렉토리 하위 경로에서 모든 JSP 파일을 찾아서 Translet 등록을 자동으로 합니다.
            검색된 jsp 파일의 경로는 template 요소의 file 속성 값으로 지정됩니다.
          </description>
          <dispatch>
            <template/>
          </dispatch>
        </translet>
        ```
        위 규칙은 `/WEB-INF/jsp/` 디렉터리와 그 하위 경로에 있는 모든 `.jsp` 파일을 스캔하여, 파일 경로에 따라 동적으로 Translet을 생성하고 등록합니다. 예를 들어, `/WEB-INF/jsp/user/list.jsp` 파일이 발견되면 `user/list`라는 이름의 Translet이 생성됩니다. 이 기능은 정적인 뷰 파일을 대량으로 서빙할 때 매우 유용하며, 반복적인 Translet 정의를 획기적으로 줄여줍니다.

#### 3.1.3. Translet의 생명주기 및 Activity와의 관계

`Activity`는 요청이 들어오면 **`TransletRuleRegistry`**에서 가장 적합한 Translet 규칙(설계도)을 찾아 인스턴스를 생성하고, 그 규칙에 따라 요청을 처리합니다. 즉, Translet은 '설계도'이고 `Activity`는 그 설계도를 보고 일하는 '실행 엔진'과 같습니다. `TransletRuleRegistry`는 빠르고 효율적인 조회를 위해 고도로 최적화된 자료구조이며, 요청 이름, 요청 메소드, 와일드카드 및 경로 변수 패턴을 사용하여 Translet을 찾아냅니다.

`Activity`는 Translet에 정의된 규칙에 따라 요청 정보를 파싱하고, 비즈니스 로직을 담고 있는 Action들을 순차적으로 실행합니다. `@RequestToGet`과 같은 어노테이션이 붙는 메소드를 Action 메소드라고 부르며, 기본적으로 Bean의 메소드를 호출하는 Invoke Action 외에 Echo Action, Header Action, Include Action 등 다양한 유형의 Action이 있습니다.

이 과정에서 생성된 `Translet` 인스턴스는 `Activity`와 사용자 코드(주로 Action 메소드) 사이의 **'소통을 위한 매개체'** 역할을 합니다. Action 메소드의 인자로 `Translet` 타입이 선언되어 있으면, `Activity`는 메소드 호출 시 `Translet` 인스턴스를 자동으로 주입해 줍니다. 개발자는 이 `Translet` 인스턴스를 통해 `Activity`가 생성한 데이터에 접근(`getActivityData()` 메소드)하거나, 데이터를 추가적으로 가공하고 응답 로직을 임의로 제어하는 등 프레임워크와 상호작용할 수 있습니다.

이처럼 Translet은 복잡한 내부 실행 로직(`Activity`)을 감추고 사용자에게는 명확하고 단순한 '설계도'와 '인터페이스'만을 보여주는, 잘 설계된 **퍼사드(Facade)**입니다.

### 3.2. Bean (빈)

Bean은 Aspectran의 IoC(Inversion of Control) 컨테이너에 의해 관리되는 자바 객체입니다. 애플리케이션의 서비스, 데이터 접근 객체(DAO), 유틸리티 등 모든 구성 요소는 Bean으로 등록되어 프레임워크에 의해 생명주기가 관리되고, 필요한 곳에 의존성 주입(DI)을 통해 제공됩니다.

#### 3.2.1. IoC와 DI의 이해

*   **IoC (제어의 역전)**: 객체의 생성, 구성, 생명주기 관리를 개발자가 직접 하는 대신, Aspectran 컨테이너가 이를 대신합니다. 개발자는 객체를 정의하기만 하면, 프레임워크가 적절한 시점에 객체를 인스턴스화하고 필요한 의존성을 연결해 줍니다. 이를 통해 개발자는 비즈니스 로직에만 집중할 수 있습니다.
*   **DI (의존성 주입)**: IoC를 구현하는 핵심 메커니즘입니다. 객체가 자신이 필요로 하는 다른 객체(의존성)를 직접 생성하거나 찾지 않고, 외부(IoC 컨테이너)로부터 주입받는 방식입니다. 이는 컴포넌트 간의 결합도를 낮추어 코드의 재사용성, 테스트 용이성, 유지보수성을 크게 향상시킵니다.

#### 3.2.2. 빈 정의 방법

Aspectran에서 Bean을 정의하는 가장 일반적인 방법은 어노테이션을 사용하는 것입니다.

*   **`@Component`를 사용한 자동 탐지**: 클래스에 `@Component` 어노테이션을 추가하는 것이 가장 쉽고 권장되는 방법입니다. Aspectran의 클래스패스 스캐너가 애플리케이션 시작 시 이를 자동으로 탐지하여 Bean으로 등록합니다.

    ```java
    package com.example.myapp.service;

    import com.aspectran.core.component.bean.annotation.Component;

    @Component
    public class MyService {
        public String getMessage() {
            return "Hello from MyService!";
        }
    }
    ```

*   **`@Bean`을 사용한 명시적 정의**: `@Bean` 어노테이션은 Bean에 특정 ID를 부여하거나, 복잡한 초기화 로직이 필요한 경우, 또는 서드파티 라이브러리 객체를 Bean으로 등록할 때 유용합니다. `@Component` 클래스 내부에 객체를 반환하는 메소드에 `@Bean`을 붙여 사용할 수 있습니다.

    ```java
    @Component
    public class AppConfig {
        @Bean("myCustomClient") // Bean의 ID를 myCustomClient로 지정
        public SomeLibraryClient someLibraryClient() {
            // 복잡한 초기화 로직 또는 외부 라이브러리 객체 생성
            return new SomeLibraryClient("api.example.com", "your-api-key");
        }
    }
    ```

#### 3.2.3. 의존성 주입 (`@Autowired`)

`@Autowired` 어노테이션을 사용하여 Aspectran 컨테이너가 관리하는 다른 Bean을 현재 Bean에 자동으로 주입받을 수 있습니다.

*   **생성자 주입 (권장)**: 의존성을 `final`로 선언하여 불변(immutable)하게 만들고, 객체가 생성될 때 모든 필수 의존성이 주입되었음을 보장합니다. 이는 코드의 안정성과 테스트 용이성을 높이는 가장 좋은 방법입니다.

    ```java
    @Component
    public class MyController {
        private final MyService myService;

        @Autowired
        public MyController(MyService myService) {
            this.myService = myService;
        }
    }
    ```

*   **필드 및 수정자(Setter) 주입**: 선택적 의존성을 주입할 때 유용하지만, 생성자 주입을 우선적으로 고려해야 합니다. 필드 주입은 `public` 필드에만 가능하며, 일반적으로 권장되지 않습니다.

*   **`@Qualifier`로 모호성 해결**: 동일한 타입의 Bean이 여러 개 있을 때, `@Qualifier("beanId")`를 사용하여 주입할 특정 Bean의 ID를 지정할 수 있습니다.

    ```java
    public interface NotificationService { /* ... */ }

    @Component @Bean("email")
    public class EmailNotificationService implements NotificationService { /* ... */ }

    @Component @Bean("sms")
    public class SmsNotificationService implements NotificationService { /* ... */ }

    @Component
    public class OrderService {
        private final NotificationService notificationService;

        @Autowired
        public OrderService(@Qualifier("email") NotificationService notificationService) {
            this.notificationService = notificationService;
        }
    }
    ```

*   **`@Value`로 설정값 주입**: `@Value` 어노테이션을 사용하여 AsEL 표현식의 평가 결과(주로 외부 설정값)를 Bean의 필드나 생성자 파라미터에 주입할 수 있습니다.

    ```java
    @Component
    public class AppInfo {
        private final String appVersion;

        @Autowired
        public AppInfo(@Value("%{app^version:1.0.0}") String appVersion) {
            this.appVersion = appVersion;
        }
    }
    ```

*   **컬렉션 주입 (`List<T>`, `Map<String, T>`)**: 동일한 인터페이스를 구현하는 모든 Bean을 `List`나 `Map`으로 한 번에 주입받을 수 있습니다. 이는 전략 패턴(Strategy Pattern) 등을 구현할 때 매우 유용합니다.

    ```java
    @Component
    public class NotificationManager {
        private final List<NotificationService> services;

        @Autowired
        public NotificationManager(List<NotificationService> services) {
            this.services = services;
        }

        public void sendToAll(String message) {
            for (NotificationService service : services) {
                service.send(message);
            }
        }
    }
    ```

*   **선택적 의존성 주입 (`Optional<T>`)**: 특정 프로파일에서만 활성화되는 등, 존재하지 않을 수도 있는 Bean을 주입받아야 할 때 `java.util.Optional<T>`을 사용할 수 있습니다.

    ```java
    @Component
    public class MainService {
        private final Optional<OptionalService> optionalService;

        @Autowired
        public MainService(Optional<OptionalService> optionalService) {
            this.optionalService = optionalService;
        }

        public void doSomething() {
            optionalService.ifPresent(service -> service.performAction());
        }
    }
    ```

#### 3.2.4. 빈 스코프 (Bean Scopes)

Bean 스코프는 Bean 인스턴스의 생명주기와 가시성을 제어합니다. `@Scope` 어노테이션으로 설정할 수 있습니다.

| 스코프 (Scope) | 설명 | 생명주기 | 주요 사용 사례 |
| :--- | :--- | :--- | :--- |
| **`singleton`** | 컨테이너 내 단일 인스턴스 | 애플리케이션 전체 | 상태 없는 서비스, DAO |
| **`prototype`** | 요청 시마다 새 인스턴스 | GC에 의해 관리 | 상태 있는 객체, Builder |
| **`request`** | 요청마다 새 인스턴스 | 단일 `Activity` 실행 | 웹 요청 관련 데이터 처리 |
| **`session`** | 세션마다 새 인스턴스 | 단일 사용자 세션 | 사용자별 데이터 관리 |

*   **`singleton` (기본값)**: IoC 컨테이너 내에서 단 하나의 인스턴스만 생성되어 애플리케이션 전체에서 공유됩니다. 대부분의 서비스 Bean에 적합합니다.
*   **`prototype`**: Bean을 주입받거나 요청할 때마다 매번 새로운 인스턴스가 생성됩니다. 컨테이너는 생성 이후의 생명주기를 관리하지 않으므로, `prototype` Bean이 리소스를 점유한다면 개발자가 직접 해제해야 합니다.
*   **`request`**: 웹 환경에서 HTTP 요청마다 새로운 인스턴스가 생성되고, 해당 요청이 완료되면 소멸됩니다. 요청 관련 데이터를 담는 데 유용합니다.
*   **`session`**: 웹 환경에서 사용자 세션마다 새로운 인스턴스가 생성되고, 해당 세션이 종료되면 소멸됩니다. 사용자별 데이터를 관리하는 데 사용됩니다.

#### 3.2.5. 빈 생명주기 콜백

Aspectran은 Bean의 생성 및 소멸 시점에 특정 로직을 실행할 수 있도록 생명주기 콜백을 제공합니다. 주로 `@Initialize`와 `@Destroy` 어노테이션을 사용합니다.

*   **`@Initialize`**: 모든 의존성이 주입된 후, Bean이 초기화될 때 실행됩니다. 초기화 작업(예: 데이터베이스 연결 설정)에 사용됩니다.
*   **`@Destroy`**: Bean이 소멸되기 직전, 정리 작업(예: 리소스 해제)을 위해 실행됩니다.

    ```java
    @Component
    public class LifecycleBean {
        @Initialize
        public void setup() {
            System.out.println("LifecycleBean 초기화됨");
        }

        @Destroy
        public void cleanup() {
            System.out.println("LifecycleBean 소멸됨");
        }
    }
    ```

*   **인터페이스 기반 콜백**: `InitializableBean` 및 `DisposableBean` 인터페이스를 구현하여 동일한 목적을 달성할 수도 있습니다.

    ```java
    @Component
    public class InterfaceBasedLifecycleBean implements InitializableBean, DisposableBean {
        @Override
        public void initialize() throws Exception {
            System.out.println("InterfaceBasedLifecycleBean 초기화됨");
        }

        @Override
        public void destroy() throws Exception {
            System.out.println("InterfaceBasedLifecycleBean 소멸됨");
        }
    }
    ```

#### 3.2.6. 고급 기능

*   **`FactoryBean`으로 복잡한 빈 생성하기**: 생성 로직이 매우 복잡하거나 캡슐화가 필요할 때 `FactoryBean` 인터페이스를 구현합니다. `getObject()` 메소드가 반환하는 객체가 실제 Bean으로 등록됩니다.

    ```java
    @Component
    @Bean("myProduct")
    public class MyProductFactory implements FactoryBean<MyProduct> {
        @Override
        public MyProduct getObject() throws Exception {
            // 복잡한 생성 및 설정 로직
            return new MyProduct();
        }
        @Override
        public Class<?> getObjectType() {
            return MyProduct.class;
        }
    }
    ```

*   **`Aware` 인터페이스로 프레임워크에 접근하기**: `ActivityContextAware`와 같은 `Aware` 인터페이스를 구현하면, Bean이 Aspectran의 내부 객체(예: `ActivityContext`, `BeanRegistry`)에 접근할 수 있습니다. 이는 프레임워크의 특정 부분과 상호작용해야 할 때 유용합니다.

    ```java
    @Component
    public class MyAwareBean implements ActivityContextAware {
        private ActivityContext context;

        @Override
        public void setActivityContext(ActivityContext context) {
            this.context = context;
        }

        public void doSomethingWithContext() {
            if (context != null) {
                System.out.println("ActivityContext에 접근: " + context.getName());
            }
        }
    }
    ```

*   **이벤트 발행 및 구독 (Event Handling)**: Aspectran은 애플리케이션 내의 컴포넌트(Bean) 간의 느슨한 결합을 위해 발행-구독(Publish-Subscribe) 방식의 이벤트 처리 메커니즘을 제공합니다. 이를 통해 특정 로직의 수행 결과를 다른 여러 컴포넌트에 전파해야 할 때, 직접 의존 관계를 맺지 않고 이벤트를 통해 간단하게 구현할 수 있습니다.

    *   **이벤트 리스너 만들기 (`@EventListener`)**: 이벤트를 수신하여 처리하는 리스너는 `@EventListener` 어노테이션을 사용하여 간단하게 만들 수 있습니다. 메소드는 반드시 하나의 파라미터를 가져야 하며, 이 파라미터의 타입이 구독할 이벤트의 타입이 됩니다.

        ```java
        // 1. 이벤트 정의 (POJO)
        public class OrderCompletedEvent {
            private final String orderId;
            public OrderCompletedEvent(String orderId) { this.orderId = orderId; }
            public String getOrderId() { return orderId; }
        }

        // 2. 이벤트 리스너 빈 정의
        @Component
        public class OrderEventListener {
            @EventListener
            public void handleOrderCompleted(OrderCompletedEvent event) {
                System.out.println("주문 완료 이벤트 수신: " + event.getOrderId());
            }
        }
        ```

    *   **이벤트 발행하기 (`EventPublisher`)**: `EventPublisher` 인터페이스를 통해 이벤트를 발행합니다. 이 타입의 Bean을 주입받아 `publish()` 메소드를 호출하기만 하면 됩니다.

        ```java
        @Component
        public class OrderService {
            private final EventPublisher eventPublisher;

            @Autowired
            public OrderService(EventPublisher eventPublisher) {
                this.eventPublisher = eventPublisher;
            }

            public void completeOrder(String orderId) {
                System.out.println("주문 처리 완료: " + orderId);
                eventPublisher.publish(new OrderCompletedEvent(orderId)); // 이벤트 발행
            }
        }
        ```

*   **비동기 메소드 실행 (`@Async`)**: `@Async` 어노테이션을 사용하면, 시간이 오래 걸리는 작업을 별도의 스레드에서 비동기적으로 실행하여 현재 요청 처리 스레드를 차단하지 않고 즉시 반환할 수 있습니다. 이 기능은 Aspectran의 Bean 프록시를 통해 구현됩니다.

    ```java
    @Component
    public class MyAsyncTaskService {
        @Async
        public void doSomethingAsync() {
            System.out.println("비동기 작업 실행 중...");
            // 오래 걸리는 작업
        }

        @Async
        public Future<String> doSomethingAndReturnAsync() {
            return CompletableFuture.completedFuture("비동기 작업 완료!");
        }
    }
    ```

### 3.3. AOP (관점 지향 프로그래밍)

AOP(Aspect-Oriented Programming)는 로깅, 트랜잭션 관리, 보안, 캐싱 등 애플리케이션 전반에 걸쳐 반복적으로 나타나는 공통 기능(횡단 관심사)을 핵심 비즈니스 로직과 분리하여 모듈화하는 프로그래밍 패러다임입니다. Aspectran의 AOP는 프레임워크의 핵심 실행 모델인 `Activity`의 실행 흐름과 Bean 메소드 호출에 깊숙이 통합된 독자적인 모델을 가지고 있습니다.

#### 3.3.1. AOP의 필요성

애플리케이션을 개발하다 보면 여러 모듈에서 반복적으로 나타나는 코드들이 있습니다. 예를 들어, 모든 서비스 메소드 시작 전에 로그를 남기거나, 데이터베이스 작업을 트랜잭션으로 묶는 것 등이 그렇습니다. 이러한 공통 기능들을 비즈니스 로직 코드 안에 직접 작성하면 코드가 복잡해지고, 변경이 어려워지며, 재사용성이 떨어집니다. AOP는 이러한 문제를 해결하여 비즈니스 로직을 깔끔하게 유지하고, 공통 기능을 한 곳에서 관리할 수 있도록 돕습니다.

#### 3.3.2. Aspectran AOP의 주요 개념

*   **Join Point (조인 포인트)**: `Advice`가 적용될 수 있는 애플리케이션 실행 중의 특정 지점입니다. Aspectran에서는 주로 Translet의 실행 단위(Activity 실행) 또는 Bean 메소드 실행이 Join Point가 됩니다.
    *   **Activity 실행**: Translet 규칙에 따라 요청을 처리하는 `Activity`의 실행 전/후, 예외 발생 시 등 전체 흐름에 개입할 수 있습니다. 로깅, 트랜잭션, 인증 등 요청 처리 전반에 걸쳐 필요한 공통 기능을 효과적으로 모듈화할 수 있습니다.
    *   **Bean 메소드 실행**: 특정 Bean의 메소드 실행을 Join Point로 삼을 수 있습니다.

*   **Pointcut (포인트컷)**: `Advice`를 적용할 대상을 정밀하게 지정하는 표현식입니다. Aspectran에서는 설정 파일의 `<aspect>` 규칙 내 `<joinpoint>` 엘리먼트를 통해 선언적으로 Pointcut을 정의합니다.
    *   **포인트컷 표현식 구조**: `transletNamePattern[@beanOrClassPattern][^methodNamePattern]` 형태를 가집니다.
        *   `transletNamePattern`: Translet 이름 패턴 (예: `/user/*`)
        *   `@beanOrClassPattern`: Bean ID 또는 클래스 이름 패턴 (예: `@userService`)
        *   `^methodNamePattern`: 메소드 이름 패턴 (예: `^get*`)
    *   **다양한 패턴 형식 예시**:
        *   모든 Translet에서 특정 Bean의 메소드를 대상: `*: @someService^execute*`
        *   특정 Translet의 특정 Bean 메소드를 대상: `/user/list@userService^get*`
        *   특정 Translet 자체를 대상: `/user/*`
    *   **포함 및 제외 규칙**: `+` 접두사(포함)와 `-` 접두사(제외)를 사용하여 더욱 정교한 제어가 가능합니다.

*   **Advice (어드바이스)**: Join Point에서 실제로 수행될 공통 기능 코드입니다. Aspectran은 다음과 같은 Advice 타입을 지원합니다:
    *   `@Before`: Join Point 실행 전에 수행됩니다.
    *   `@After`: Join Point가 성공적으로 실행된 후에 수행됩니다.
    *   `@Around`: Join Point 실행 전후를 모두 감싸며, Join Point의 실행 여부를 제어할 수 있습니다.
    *   `@Thrown`: Join Point 실행 중 예외가 발생했을 때 수행됩니다.
    *   `@Finally`: Join Point의 성공/실패 여부와 관계없이 항상 수행됩니다.
    *   **Advice의 구현**: Advice 로직은 특정 Bean의 메소드로 구현됩니다. Aspectran은 Join Point 대상에 따라 최적화된 위치에서 Advice를 실행합니다.

*   **Aspect (애스펙트)**: `Advice`와 `Pointcut`을 결합한 모듈입니다. 설정 파일의 `<aspect>` 규칙 또는 `@Aspect` 어노테이션을 사용하여 정의합니다. 여러 공통 기능을 하나의 모듈로 캡슐화하여 관리할 수 있습니다.

#### 3.3.3. Weaving 메커니즘: 지능적인 동적 프록시

Aspectran은 AOP를 적용하기 위해 **런타임에 동적 프록시(Dynamic Proxy)**를 사용합니다. 이 프록시는 매우 효율적이고 지능적으로 동작합니다.

*   **선택적 어드바이스 적용으로 성능 최적화**: Aspectran의 AOP 프록시는 무조건 모든 메소드 호출을 가로채지 않습니다. 대신, 메소드에 `@Advisable` 어노테이션이 붙어 있는 경우에만 AOP 로직을 수행합니다. 이를 통해 불필요한 프록시 오버헤드를 원천적으로 제거하여 시스템 성능을 크게 향상시킵니다.
*   **프록시 생성 방식**: 기본적으로 Javassist를 사용하여 프록시 객체를 생성하며, 인터페이스뿐만 아니라 일반 클래스에 대해서도 프록시를 만들 수 있습니다. 대상 Bean이 인터페이스를 구현한 경우 JDK 동적 프록시를 사용하도록 선택할 수도 있습니다.

#### 3.3.4. 어노테이션 지원

`com.aspectran.core.component.bean.annotation` 패키지를 통해 XML 설정 없이 어노테이션만으로도 AOP를 포함한 다양한 Bean 설정을 할 수 있습니다. 주요 어노테이션은 다음과 같습니다:

*   `@Component`, `@Bean`: Aspect를 Bean으로 등록합니다.
*   `@Aspect`: 해당 Bean이 Aspect임을 정의합니다. `id` 속성으로 ID를 부여하고, `order` 속성으로 적용 우선순위를 지정할 수 있습니다.
*   `@Joinpoint`: 어드바이스를 적용할 대상을 지정하는 Pointcut을 설정합니다.
*   `@Before`, `@After`, `@Around`, `@Finally`, `@ExceptionThrown`: 각 어드바이스 타입을 정의하는 메소드에 사용됩니다.
*   `@Advisable`: AOP 어드바이스를 적용할 메소드임을 명시적으로 선언합니다.

#### 3.3.5. 실용적인 AOP 활용 예제: 선언적 트랜잭션

AOP의 가장 강력한 활용 사례 중 하나는 **선언적 트랜잭션 관리**입니다. 서비스 레이어의 비즈니스 로직 코드에 트랜잭션 시작, 커밋, 롤백 코드를 직접 작성하는 대신, AOP를 사용하여 해당 로직들을 메소드 외부에서 투명하게 적용하는 방식입니다.

Aspectran에서는 트랜잭션의 실제 로직을 담은 **어드바이스 Bean**과, 이를 언제 어디에 적용할지 결정하는 **Aspect**를 분리하여 유연하고 재사용 가능한 설계를 할 수 있습니다.

*   **어노테이션 기반 예시**: `SqlSessionAdvice`를 상속받아 Aspect를 정의하고 `@Joinpoint`로 대상을 지정합니다.

    ```java
    // SimpleTxAspect.java (트랜잭션 Aspect 정의 예시)
    @Component
    @Aspect(order = 0)
    @Joinpoint(pointcut = "+: **@simpleSqlSession") // simpleSqlSession 빈의 모든 public 메소드에 적용
    public class SimpleTxAspect extends SqlSessionAdvice {
        @Autowired
        public SimpleTxAspect(SqlSessionFactory sqlSessionFactory) { super(sqlSessionFactory); }
        @Before public void open() { super.open(); }
        @After public void commit() { super.commit(); }
        @Finally public void close() { super.close(); }
    }

    // OrderService.java (비즈니스 로직)
    @Component
    @Bean(id = "simpleSqlSession") // Aspect의 Pointcut 대상이 되도록 ID 지정
    public class OrderService extends SqlSessionAgent {
        public OrderService() { super("simpleTxAspect"); }
        public void createOrder(Order order) {
            // 이 메소드 호출 시 'simpleTxAspect'가 동작하여 트랜잭션이 자동으로 관리됩니다.
            insert("app.demo.mapper.OrderMapper.insertOrder", order);
        }
    }
    ```

*   **XML 기반 예시**: 어드바이스 Bean과 Aspect를 XML로 명확하게 분리하여 정의합니다.

    ```xml
    <!-- 1. 트랜잭션의 실제 동작을 담은 어드바이스 Bean을 정의 -->
    <bean id="sqlSessionTxAdvice" class="com.aspectran.mybatis.SqlSessionAdvice" scope="prototype">
        <argument>#{sqlSessionFactory}</argument>
    </bean>

    <!-- 2. simpleTxAspect: ID가 'simpleSqlSession'인 Bean을 감지 -->
    <aspect id="simpleTxAspect" order="0">
        <joinpoint pointcut="+: **@simpleSqlSession"/>
        <advice bean="sqlSessionTxAdvice">
            <before><invoke method="open"/></before>
            <after><invoke method="commit"/></after>
            <finally><invoke method="close"/></finally>
        </advice>
    </aspect>
    ```

이처럼 Aspectran의 AOP를 활용하면, 비즈니스 로직과 트랜잭션 처리 로직을 완벽하게 분리하여 코드의 가독성과 유지보수성을 크게 향상시킬 수 있습니다.

### 3.4. AsEL (Aspectran Expression Language)

AsEL (Aspectran Expression Language)은 Aspectran의 설정 파일(XML, APON)이나 어노테이션 내에서 동적인 값을 참조하고 주입하기 위해 사용되는 강력한 표현 언어입니다. AsEL을 사용하면, 런타임에 생성되는 요청 데이터나 다른 빈(Bean)의 속성 값을 정적인 설정에 동적으로 결합할 수 있어 프레임워크의 유연성을 크게 높여줍니다. 특히 AsEL은 내부적으로 OGNL(Object-Graph Navigation Language)을 기반으로 동작하므로, 단순한 값 참조를 넘어 객체의 메소드를 호출하거나 속성을 탐색하는 등 복잡하고 동적인 표현식을 사용할 수 있습니다.

#### 3.4.1. AsEL 토큰 유형

AsEL은 세 가지 주요 토큰을 사용하여 서로 다른 스코프의 데이터에 접근합니다.

*   **`${...}` (파라미터 토큰)**: 현재 요청의 **파라미터(Parameter)**에 접근합니다. 주로 Translet의 경로 변수(Path Variable)나 요청 파라미터(Request Parameter) 값을 참조하는 데 사용됩니다.
    ```xml
    <translet name="/users/${userId}">
      <action bean="userService" method="deleteUser">
        <arguments>
          <item value="${userId}"/> <!-- URL 경로에서 추출된 userId 파라미터를 action의 인자로 전달 -->
        </arguments>
      </action>
    </translet>
    ```

*   **`@{...}` (속성 토큰)**: 현재 `Activity` 컨텍스트의 **속성(Attribute)**에 접근합니다. 속성은 다른 액션의 결과나 AOP 어드바이스 등을 통해 `Activity` 내에서 생성되고 공유되는 데이터입니다.
    ```xml
    <action id="userResult" bean="userAction" method="getUser"/>
    <!-- 위 action의 결과는 'userResult'라는 속성으로 저장됨 -->
    <dispatch name="user/detail">
        <attributes>
            <item name="user" value="@{userResult}"/> <!-- 'userResult' 속성을 뷰 템플릿에 'user'라는 이름으로 전달 -->
        </attributes>
    </dispatch>
    ```

*   **`#{...}` (빈 토큰)**: IoC 컨테이너에 등록된 **빈(Bean) 또는 빈의 속성**에 접근합니다. 정적인 설정값이나 다른 빈의 메소드 호출 결과를 참조할 때 유용합니다.
    ```xml
    <bean id="appConfig" class="com.example.AppConfig">
        <properties>
            <item name="defaultPageSize">20</item>
        </properties>
    </bean>

    <action bean="boardService" method="getArticleList">
        <arguments>
            <!-- appConfig 빈의 defaultPageSize 속성 값을 인자로 전달 -->
            <item value="#{appConfig.defaultPageSize}"/>
        </arguments>
    </action>
    ```

#### 3.4.2. @Value 어노테이션과 AsEL

`@Value` 어노테이션과 함께 사용하면 AsEL의 강력함을 코드 레벨까지 확장할 수 있습니다. 외부 설정 파일(`properties`)에 정의된 값을 Bean의 필드나 생성자 인자에 직접 주입할 수 있습니다.

*   **`%{...}` (프로퍼티 토큰)**: `@Value` 어노테이션 내에서 사용되며, `<properties>` 엘리먼트나 외부 설정 파일에 정의된 **프로퍼티(Property)** 값을 참조합니다.

```java
// config.properties 파일 내용: app.version=1.2.3
// XML 설정: <properties file="config.properties"/>

@Component
public class AppInfo {
    private final String appVersion;

    @Autowired
    public AppInfo(@Value("%{app.version:1.0.0}") String appVersion) {
        // config.properties에 값이 있으면 "1.2.3"이 주입되고,
        // 없으면 기본값 "1.0.0"이 주입됨
        this.appVersion = appVersion;
    }
}
```

AsEL을 잘 활용하면 정적인 설정을 동적인 애플리케이션 로직과 효과적으로 연결하여, 코드 변경 없이 설정만으로 다양한 상황에 대응할 수 있는 유연한 애플리케이션을 만들 수 있습니다.

## 4. Aspectran 주요 기능 활용

### 4.1. Profiles (프로필)

Aspectran의 Profiles 기능은 애플리케이션의 전체 또는 일부 설정을 **개발(development), 테스트(test), 운영(production)**과 같은 특정 환경에 따라 다르게 적용할 수 있도록 지원하는 강력한 기능입니다. 이를 통해 코드 변경 없이 설정만으로 여러 환경에 쉽게 대응할 수 있습니다.

#### 4.1.1. 프로필의 필요성 및 활용

*   **환경별 설정 관리**: 데이터베이스 연결 정보, API 키, 로깅 레벨 등 환경마다 달라지는 설정을 효율적으로 관리할 수 있습니다.
*   **조건부 빈 로딩**: 특정 환경에서만 필요한 Bean(예: 개발용 Mock 서비스, 운영용 모니터링 도구)을 조건부로 로드할 수 있습니다.

#### 4.1.2. 프로필 활성화 방법

프로필은 주로 JVM 시스템 프로퍼티(`-D` 옵션)를 통해 활성화합니다.

*   **`aspectran.profiles.active`**: 현재 활성화할 프로필을 지정합니다. 여러 프로필을 지정할 경우 쉼표(`,`)로 구분합니다.
    ```bash
    # 'dev' 프로필을 활성화하여 애플리케이션 실행
    java -Daspectran.profiles.active=dev -jar my-application.jar

    # 'prod'와 'metrics' 두 개의 프로필을 동시에 활성화
    java -Daspectran.profiles.active=prod,metrics -jar my-application.jar
    ```
*   **`aspectran.profiles.default`**: `aspectran.profiles.active`가 지정되지 않았을 때 기본으로 활성화할 프로필을 지정합니다.
*   **`aspectran.profiles.base`**: 항상 활성화되어야 하는 기본 프로필을 지정합니다.

#### 4.1.3. 프로필을 이용한 조건부 설정

Aspectran의 설정 파일(XML 또는 APON) 내 대부분의 엘리먼트에서 `profile` 속성을 사용하여 특정 프로필이 활성화되었을 때만 해당 설정을 적용하도록 할 수 있습니다.

```xml
<aspectran>

    <!-- 'dev' 프로필이 활성화될 때만 적용되는 개발용 데이터베이스 설정 -->
    <properties profile="dev">
        <property name="db.driver">org.h2.Driver</property>
        <property name="db.url">jdbc:h2:mem:devdb;DB_CLOSE_DELAY=-1</property>
        <property name="db.username">sa</property>
        <property name="db.password"></property>
    </properties>

    <!-- 'prod' 프로필이 활성화될 때만 적용되는 운영용 데이터베이스 설정 -->
    <properties profile="prod">
        <property name="db.driver">com.mysql.cj.jdbc.Driver</property>
        <property name="db.url">jdbc:mysql://prod.db.server:3306/main_db</property>
        <property name="db.username">prod_db_user</property>
        <property name="db.password">!PROD_DB_PASSWORD!</property>
    </properties>

    <!-- 'prod' 프로필이 활성화될 때만 특정 설정 파일을 포함 -->
    <append file="/config/metrics-context.xml" profile="prod"/>

    <!-- 'dev' 프로필이 활성화되지 않았을 때만 로드되는 Bean -->
    <bean id="someBean" class="com.example.SomeBean" profile="!dev"/>

</aspectran>
```

#### 4.1.4. 프로필 표현식 (Profile Expressions)

단순한 프로필 이름 외에도, 논리 연산자를 사용하여 복잡한 조건을 표현할 수 있습니다.

*   **`!` (NOT)**: 특정 프로필이 활성화되지 않았을 때 (예: `profile="!demo"`)
*   **`()` (AND)**: 괄호 안의 모든 프로필이 활성화되었을 때 (예: `profile="(prod, metrics)"`)
*   **`[]` (OR)**: 대괄호 안의 프로필 중 하나라도 활성화되었을 때 (쉼표 `,`로만 구분해도 OR로 동작) (예: `profile="[dev, test]"`)
*   **복합 표현식**: 여러 연산자를 조합하여 복잡한 조건을 만들 수 있습니다.

#### 4.1.5. 사용 예제: 환경별 데이터베이스 설정

`dev`와 `prod` 환경에 따라 다른 데이터베이스 연결 정보를 설정하는 완전한 예제는 다음과 같습니다.

**`config/root-context.xml`**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<aspectran>

    <description>환경에 따라 다른 DB 설정을 로드합니다.</description>

    <!-- 개발 환경 설정 -->
    <properties profile="dev">
        <property name="db.driver">org.h2.Driver</property>
        <property name="db.url">jdbc:h2:mem:devdb;DB_CLOSE_DELAY=-1</property>
        <property name="db.username">sa</property>
        <property name="db.password"></property>
    </properties>

    <!-- 운영 환경 설정 -->
    <properties profile="prod">
        <property name="db.driver">com.mysql.cj.jdbc.Driver</property>
        <property name="db.url">jdbc:mysql://prod.db.server:3306/main_db</property>
        <property name="db.username">prod_db_user</property>
        <property name="db.password">!PROD_DB_PASSWORD!</property>
    </properties>

    <!-- 데이터 소스 빈 정의 -->
    <bean id="dataSource" class="com.zaxxer.hikari.HikariDataSource">
        <property name="driverClassName" value="${db.driver}"/>
        <property name="jdbcUrl" value="${db.url}"/>
        <property name="username" value="${db.username}"/>
        <property name="password" value="${db.password}"/>
    </bean>

</aspectran>
```

**애플리케이션 실행:**

- **개발 환경으로 실행:** `dev` 프로필을 활성화하면 H2 인메모리 데이터베이스를 사용합니다.
  ```bash
  java -Daspectran.profiles.active=dev -jar my-app.jar
  ```

- **운영 환경으로 실행:** `prod` 프로필을 활성화하면 MySQL 데이터베이스를 사용합니다.
  ```bash
  java -Daspectran.profiles.active=prod -jar my-app.jar
  ```

### 4.2. Scheduler (스케줄러)

Aspectran Scheduler는 애플리케이션 내의 특정 작업을 **정해진 시간에 또는 주기적으로 자동 실행**할 수 있도록 하는 강력한 기능입니다. 이 기능을 통해 개발자는 배치(Batch) 작업, 데이터 동기화, 리포트 생성 등 다양한 백그라운드 태스크를 Aspectran의 핵심 컴포넌트인 Translet을 사용하여 손쉽게 구현하고 관리할 수 있습니다.

#### 4.2.1. 스케줄러의 역할 및 Quartz 기반 아키텍처

Aspectran Scheduler는 **Quartz 스케줄러 기반의 강력한 스케줄링 프레임워크를 코어에 내장**하고 있습니다. 개발자는 별도의 스케줄링 라이브러리를 직접 통합하는 복잡한 과정 없이, Aspectran이 제공하는 설정 규칙만으로 즉시 스케줄링 기능을 활성화하고 사용할 수 있습니다. 스케줄링의 복잡한 내부 동작을 신경 쓸 필요 없이, 자신이 가장 잘 아는 Translet을 사용하여 원하는 작업을 손쉽게 자동화할 수 있습니다.

#### 4.2.2. 스케줄러 설정 방법

Aspectran은 스케줄러를 설정하는 두 가지 주요 방법을 제공합니다.

1.  **XML/APON 기반 설정**: 스케줄러 빈(Bean)과 스케줄 규칙(`<schedule>`)을 XML 또는 APON 파일에 명시적으로 정의합니다.

    ```xml
    <!-- 스케줄러 빈 정의 -->
    <bean id="scheduler1" class="com.aspectran.core.scheduler.support.QuartzSchedulerFactoryBean">
        <property type="properties" name="quartzProperties">
            <entry name="org.quartz.scheduler.instanceName" value="MyScheduler"/>
            <entry name="org.quartz.threadPool.threadCount" value="10"/>
            <!-- 기타 모든 Quartz 속성... -->
        </property>
    </bean>

    <!-- 스케줄 규칙 정의 -->
    <schedule id="my-daily-report" schedulerBean="scheduler1">
        <scheduler>
            <trigger type="cron" expression="0 0 2 * * ?" /> <!-- 매일 새벽 2시 실행 -->
        </scheduler>
        <job translet="/batch/daily-report"/> <!-- 실행할 Translet 지정 -->
        <job translet="/batch/log-archive"/>
    </schedule>
    ```

2.  **어노테이션 기반 설정**: `@Schedule` 어노테이션을 사용하면, 스케줄러 빈 정의부터 잡(Job)과 트리거(Trigger) 설정까지 모든 것을 하나의 Java 클래스 안에서 선언적으로 처리할 수 있습니다. 이는 코드의 응집도를 높이고, XML 설정을 최소화하는 장점이 있습니다.

    ```java
    import com.aspectran.core.component.bean.annotation.Bean;
    import com.aspectran.core.component.bean.annotation.Component;
    import com.aspectran.core.component.bean.annotation.Request;
    import com.aspectran.core.context.rule.type.FormatType;
    import com.aspectran.core.scheduler.annotation.CronTrigger;
    import com.aspectran.core.scheduler.annotation.Job;
    import com.aspectran.core.scheduler.annotation.Schedule;
    import com.aspectran.core.scheduler.support.QuartzSchedulerFactoryBean;
    import org.quartz.SchedulerException;
    import org.quartz.impl.StdSchedulerFactory;

    import java.time.LocalDateTime;
    import java.util.Properties;

    @Component
    @Schedule(
        id = "my-annotated-job",
        scheduler = "mySchedulerBean", // 스케줄러 Bean의 ID
        cronTrigger = @CronTrigger(expression = "0 0/1 * * * ?"), // 매 1분마다 실행
        jobs = { @Job(translet = "/annotated/task") }
    )
    public class MyScheduledTasks {

        @Request("/annotated/task") // 스케줄러에 의해 실행될 Translet 메소드
        @Transform(FormatType.TEXT)
        public String executeTask() {
            return "스케줄링된 작업이 실행되었습니다: " + LocalDateTime.now();
        }

        @Bean("mySchedulerBean") // Quartz Scheduler Bean 정의
        public org.quartz.Scheduler createScheduler() throws SchedulerException {
            Properties props = new Properties();
            props.put("org.quartz.scheduler.instanceName", "AnnotatedScheduler");
            props.put("org.quartz.threadPool.threadCount", "5");
            return new StdSchedulerFactory(props).getScheduler();
        }
    }
    ```

#### 4.2.3. 트리거 (Trigger) 타입 상세

트리거는 잡(Job)이 실행될 시점을 정교하게 제어합니다. XML 방식의 `<trigger>` 요소와 어노테이션 방식의 `@SimpleTrigger`, `@CronTrigger` 어노테이션을 통해 설정할 수 있습니다.

*   **`simple` 트리거**: "지금부터 10초 후에 시작해서, 1시간마다, 총 5번 실행"과 같이 단순한 간격으로 작업을 반복할 때 사용합니다. 특정 간격으로 정해진 횟수만큼 또는 무한히 작업을 반복하는 데 가장 적합합니다.
    *   **주요 속성**: `startDelaySeconds`, `intervalInSeconds/Minutes/Hours`, `repeatCount` (`-1`은 무한 반복), `repeatForever`.

    ```xml
    <trigger type="simple">
        startDelaySeconds: 10
        intervalInHours: 1
        repeatForever: true
    </trigger>
    ```
    ```java
    @SimpleTrigger(
        startDelaySeconds = 300,
        intervalInSeconds = 30,
        repeatCount = 9 // 최초 1회 실행 + 9회 반복 = 총 10회
    )
    ```

*   **`cron` 트리거**: "매주 금요일 오후 5시 30분" 또는 "매달 마지막 날 새벽 1시"와 같이 달력과 연관된 복잡한 시간표에 따라 작업을 실행할 때 사용합니다. 강력한 **Cron 표현식**을 기반으로 동작하여 매우 유연하고 강력한 스케줄링을 제공합니다.
    *   **주요 속성**: `expression` (Cron 표현식 문자열).

    ```xml
    <trigger type="cron" expression="0 50 23 * * ?" /> <!-- 매일 밤 11시 50분 -->
    ```
    ```java
    @CronTrigger(expression = "0 30 9 ? * MON-FRI") // 매주 월요일부터 금요일까지, 오전 9시 30분
    ```

#### 4.2.4. 스케줄 잡 로깅 및 모니터링

스케줄링된 작업의 실행 상태를 확인하고 디버깅하는 것은 매우 중요합니다. Aspectran은 스케줄 잡의 실행 이벤트를 Logback을 통해 상세하게 기록할 수 있도록 지원합니다.

*   **로깅 메커니즘**: `com.aspectran.core.scheduler.activity.ActivityJobReporter` 클래스를 통해 잡의 시작, 성공, 실패 등의 이벤트를 로깅합니다. 이 리포터는 Quartz의 `JobListener`와 연동되어 잡의 생명주기 동안 발생하는 주요 정보를 기록합니다.
*   **Logback 설정 예제**: 스케줄러 로그를 별도의 파일로 분리하여 관리하려면 Logback의 `SiftingAppender`와 Aspectran의 `LoggingGroupDiscriminator`를 활용할 수 있습니다. 이를 통해 `LOGGING_GROUP` 값에 따라 별도의 스케줄러 로그 파일로 기록됩니다.

### 4.3. 응답 처리 (Response Handling)

Aspectran은 액션 메소드의 처리 결과를 클라이언트에 반환하기 위해 크게 세 가지 방식을 제공합니다. 첫째, `dispatch`는 JSP나 Thymeleaf 같은 뷰 템플릿으로 처리를 위임하여 완전한 UI 페이지를 렌더링합니다. 둘째, `transform`은 선언적인 규칙을 통해 처리 결과를 JSON, XML 등 특정 데이터 형식으로 간편하게 변환합니다. 마지막으로, `RestResponse`는 Java 코드 내에서 HTTP 상태와 응답 데이터를 프로그래밍 방식으로 세밀하게 제어하여 동적인 REST API 응답을 구성할 때 사용됩니다.

#### 4.3.1. Dispatch: 뷰 템플릿 렌더링

`dispatch` 응답은 JSP, Thymeleaf, FreeMarker와 같은 외부 뷰 템플릿 엔진으로 처리를 위임하여 완전한 HTML 웹 페이지를 렌더링하는 데 사용됩니다. 이는 전통적인 웹 애플리케이션의 UI 화면을 구성하는 데 적합합니다.

`<dispatch>` 규칙의 `name` 속성에는 템플릿 파일의 경로를 지정하며, `dispatcher` 속성에는 렌더링을 담당할 `ViewDispatcher` 빈(bean)을 지정할 수 있습니다. 만약 `dispatcher` 속성이 생략되면 기본 `ViewDispatcher`가 사용됩니다.

```xml
<!-- 1. Thymeleaf 뷰 디스패처 빈 설정 -->
<bean id="thymeleafViewDispatcher" class="com.aspectran.thymeleaf.view.ThymeleafViewDispatcher">
    <properties>
        <property name="prefix" value="/WEB-INF/templates/"/>
        <property name="suffix" value=".html"/>
        <property name="templateEngine" value-ref="thymeleafEngine"/>
    </properties>
</bean>

<!-- 2. Translet에서 Dispatch 규칙을 사용하여 Thymeleaf 뷰 호출 -->
<translet name="/hello">
    <dispatch name="hello" dispatcher="thymeleafViewDispatcher" contentType="text/html" encoding="UTF-8"/>
</translet>
```

#### 4.3.2. Transform: 데이터 형식 변환

`transform` 응답은 액션의 처리 결과를 특정 데이터 형식(JSON, XML, 텍스트 등)으로 변환하여 응답 본문을 직접 생성하는 데 사용됩니다. 이는 주로 REST API의 응답을 생성하거나, 데이터 연동을 위한 특정 형식의 텍스트를 반환할 때 매우 유용합니다.

*   **JSON 변환**: `format="json"`을 사용하여 처리 결과를 JSON 문자열로 변환합니다. REST API에서 가장 흔하게 사용됩니다. `pretty="true"` 속성을 추가하면 가독성 좋게 출력됩니다.
    ```xml
    <translet name="/api/users/1">
      <action bean="userService" method="getUser" id="user"/>
      <transform format="json" pretty="true"/>
    </translet>
    ```

*   **XML 변환**: `format="xml"`을 사용하여 XML로 변환합니다.
    ```xml
    <translet name="/api/users/1.xml">
      <action bean="userService" method="getUser" id="user"/>
      <transform format="xml" pretty="true"/>
    </translet>
    ```

*   **텍스트 변환 및 템플릿 활용**: `format="text"`을 사용하여 일반 텍스트로 변환합니다. `<template>` 규칙과 함께 사용하면 AsEL 토큰을 통해 동적인 텍스트 내용을 만들 수 있습니다.
    ```xml
    <translet name="/api/users/1/info">
        <action bean="userService" method="getUser" id="user"/>
        <transform format="text">
          <template>
            사용자 이름: @{user.name}
            이메일: @{user.email}
          </template>
        </transform>
    </translet>
    ```

이 두 가지 응답 방식을 이해하면, 웹 페이지와 REST API를 모두 지원하는 유연한 애플리케이션을 효과적으로 구축할 수 있습니다.

#### 4.3.3. RestResponse: 프로그래밍 방식의 REST 응답

`transform` 규칙이 선언적으로 응답을 생성하는 간편한 방법을 제공하는 반면, `RestResponse` 인터페이스는 Java 코드 내에서 프로그래밍 방식으로 RESTful 응답을 동적으로 구성할 수 있는 더 유연하고 강력한 방법을 제공합니다. 이 방식을 사용하면, 조건에 따라 HTTP 상태 코드, 헤더, 응답 데이터를 세밀하게 제어할 수 있습니다.

일반적으로 액션 메소드에서 `DefaultRestResponse`의 인스턴스를 생성하고, 데이터를 설정한 뒤, `.ok()`, `.notFound()`, `.created()` 와 같은 메소드를 호출하여 최종 `RestResponse` 객체를 반환합니다.

*   **주요 특징**:
    *   **데이터 설정**: `setData("key", value)` 또는 생성자를 통해 응답 데이터를 설정합니다.
    *   **상태 코드 체이닝**: `.ok()`, `.created(location)`, `.notFound()`, `.forbidden()` 등 직관적인 메소드를 체이닝하여 HTTP 상태 코드를 설정하고 응답 객체를 반환합니다.
    *   **유연성**: 복잡한 비즈니스 로직의 결과에 따라 응답 내용과 상태를 동적으로 결정해야 할 때 매우 유용합니다.

*   **사용 예제**:
    ```java
    @Component
    public class CustomerActivity {

        private final CustomerRepository repository;

        @Autowired
        public CustomerActivity(CustomerRepository repository) {
            this.repository = repository;
        }

        @RequestToGet("/customers/${id}")
        public RestResponse getCustomer(@Required Integer id) {
            Customer customer = repository.getCustomer(id);
            RestResponse response = new DefaultRestResponse();
            if (customer != null) {
                // 데이터와 함께 200 OK 상태를 반환
                response.setData("customer", customer);
                response.ok();
            } else {
                // 404 Not Found 상태를 반환
                response.notFound();
            }
            return response;
        }

        @RequestToPost("/customers")
        public RestResponse addCustomer(@NonNull Translet translet, @Required Customer customer) {
            int id = repository.insertCustomer(customer);
            String resourceUri = translet.getActualRequestName() + "/" + id;
            // 생성된 리소스의 URI와 함께 201 Created 상태를 반환
            return new DefaultRestResponse(customer).created(resourceUri);
        }
    }
    ```
`RestResponse`를 사용하면, 선언적 방식인 `<transform>` 규칙보다 더 복잡하고 동적인 REST API 응답을 효과적으로 구현할 수 있습니다.

## 5. Aspectran 구성 설정

Aspectran 애플리케이션의 초기 구동 설정은 `com.aspectran.core.context.config.AspectranConfig` 객체를 통해 관리됩니다.
이 설정은 주로 APON(Aspectran Parameter Object Notation) 형식의 `aspectran-config.apon` 파일로 로드되며,
이 파일을 통해 XML 형식의 설정 파일(`context.rules`로 지정)을 포함하거나 어노테이션 기반 설정을 활성화할 수 있습니다.

### 5.1. Aspectran 기본 구성 설정

자세한 내용은 [Aspectran 기본 구성 설정](/en/docs/aspectran-configuration/) 문서를 참고하세요.

### 5.2. Aspectran XML 구성 설정

자세한 내용은 [Aspectran XML 구성 설정](/en/docs/aspectran-xml-configuration/) 문서를 참고하세요.

### 5.3. 어노테이션과 XML 설정의 조합

대부분의 경우 어노테이션 기반의 컴포넌트 스캔을 기본으로 사용하고, 특정 Bean을 재정의하거나 외부 라이브러리를 등록할 때 XML 설정을 조합하여 사용하는 것이 일반적입니다.
동일한 ID의 Bean이 둘 다에 정의된 경우, 나중에 로드되는 설정이 우선권을 가질 수 있으며, `<bean important="true">` 속성으로 덮어쓰기를 강제할 수 있습니다.

## 6. 개발 팁 및 모범 사례

Aspectran 애플리케이션을 개발할 때 다음과 같은 팁과 모범 사례를 따르면 더 견고하고 유지보수하기 쉬운 코드를 작성할 수 있습니다.

### 6.1. 생성자 주입 선호

*   **불변성(Immutability)**: 의존성을 `final` 필드로 선언할 수 있어 Bean의 상태가 변경되지 않음을 보장합니다.
*   **의존성 명시**: 객체가 기능하는 데 필요한 모든 의존성이 생성자에 명확하게 드러나므로, 코드의 가독성이 높아집니다.
*   **순환 참조 방지**: 생성자 주입을 사용할 경우, Bean A와 B가 서로를 필요로 하는 순환 참조가 발생하면 애플리케이션 시작 시점에 오류가 발생하여 문제를 즉시 발견하고 해결할 수 있습니다.

### 6.2. 순환 의존성 피하기

순환 의존성(Circular Dependency)은 두 개 이상의 Bean이 서로를 의존하는 상황을 말합니다. 이는 설계상의 문제를 나타내는 신호일 수 있으며, 코드의 복잡성을 증가시키고 테스트를 어렵게 만듭니다. 대부분의 경우, 책임을 분리하여 제3의 클래스로 옮기는 리팩토링을 통해 순환 의존성을 해결할 수 있습니다. 불가피한 경우, 수정자(setter) 주입을 사용하면 순환 참조 문제를 해결할 수 있지만, 이는 최후의 수단으로 고려해야 합니다.

### 6.3. 싱글톤 빈과 상태 관리

싱글톤 Bean은 애플리케이션 전체에서 단 하나의 인스턴스만 존재하므로, 여러 스레드에서 동시에 접근할 수 있습니다. 만약 싱글톤 Bean이 변경 가능한 상태(예: 멤버 변수)를 가지고 있다면, 동시성(concurrency) 문제가 발생할 수 있습니다. 싱글톤 Bean은 가급적 상태를 가지지 않도록(stateless) 설계하는 것이 가장 좋습니다. 상태가 꼭 필요하다면 `ThreadLocal`을 사용하거나, 동기화(synchronization) 처리를 신중하게 구현해야 합니다.

### 6.4. `prototype` 빈의 생명주기 이해

`prototype` 스코프의 Bean은 컨테이너가 생성하고 의존성을 주입한 후에는 더 이상 관리하지 않습니다. 따라서 `@Destroy`나 `DisposableBean`과 같은 소멸 관련 콜백이 **호출되지 않습니다.** `prototype` Bean이 데이터베이스 커넥션과 같은 중요한 리소스를 점유하고 있다면, 해당 리소스를 해제하는 로직을 개발자가 직접 호출해야 합니다.

## 7. 문제 해결 및 디버깅

Aspectran 애플리케이션 개발 중 발생할 수 있는 일반적인 문제에 대한 해결 팁입니다.

### 7.1. 로깅 활용

Aspectran은 SLF4J와 Logback을 기반으로 유연하고 강력한 로깅 시스템을 구축합니다. 애플리케이션의 동작을 이해하고 문제를 진단하는 데 로깅은 필수적입니다.

*   **로그 레벨 조정**: `logback.xml` 또는 `logback-test.xml` 파일에서 로그 레벨(TRACE, DEBUG, INFO, WARN, ERROR)을 조정하여 필요한 정보를 더 상세하게 얻을 수 있습니다.
*   **스케줄러 로그 분리**: 스케줄링된 작업의 로그는 별도의 파일로 분리하여 모니터링할 수 있습니다. (`com.aspectran.core.scheduler.activity.ActivityJobReporter` 클래스 로그 활용)

자세한 내용은 [Aspectran 로깅 메카니즘](/en/docs/architecture/aspectran-logging-mechanism/) 문서를 참고하세요.

### 7.2. 일반적인 오류 메시지 및 해결 팁

*   **`BeanNotFoundException`**: 요청한 Bean을 컨테이너에서 찾을 수 없을 때 발생합니다. 다음을 확인하세요:
    *   Bean이 `@Component` 또는 `@Bean` 어노테이션으로 올바르게 정의되었는지.
    *   메인 설정 파일(`aspectran.apon` 또는 `aspectran.xml`)의 `context.scan` 또는 `<bean-scan>`에 해당 Bean이 포함된 패키지가 올바르게 지정되었는지.
    *   Bean ID나 타입이 올바르게 참조되었는지.
*   **`NoActivityStateException`**: 현재 스레드에 `Activity` 컨텍스트가 없을 때 발생합니다. 주로 `@Async` 메소드 내에서 `CompletableFuture.supplyAsync()`와 같이 새로운 스레드 풀에서 코드를 실행할 때 발생할 수 있습니다. `@Async`에 의해 생성된 스레드 내에서 모든 작업을 동기적으로 처리하고 최종 결과만 `CompletableFuture.completedFuture()`로 감싸서 반환하는 것이 안전합니다.
*   **설정 파일 파싱 오류**: XML 또는 APON 설정 파일의 문법 오류로 인해 발생합니다. 오류 메시지에 표시된 줄 번호와 위치를 확인하여 문법을 수정하세요.

## 8. 참고 문서

이 가이드가 Aspectran을 사용하는 데 도움이 되기를 바랍니다. 각 주제에 대한 더 상세한 정보는 아래 문서들을 참고하십시오.

*   [Aspectran 기본 구성 가이드](https://aspectran.com/ko/docs/guides/aspectran-configuration/)
*   [Aspectran XML 구성 가이드](https://aspectran.com/ko/docs/guides/aspectran-xml-configuration/)
*   [WebActivityServlet 구성 가이드](https://aspectran.com/ko/docs/guides/aspectran-servlet-configuration/)
*   [Aspectran Beans](https://aspectran.com/ko/docs/guides/aspectran-beans/)
*   [Aspectran AOP 특징 분석](https://aspectran.com/ko/docs/guides/aspectran-aop/)
*   [Aspectran의 얼굴마담: Translet 이해하기](https://aspectran.com/ko/docs/guides/aspectran-translet/)
*   [Aspectran Scheduler: Translet을 이용한 강력한 작업 자동화](https://aspectran.com/ko/docs/guides/aspectran-scheduler/)
*   [Aspectran 뷰(View) 기술](https://aspectran.com/ko/docs/guides/aspectran-view-technologies/)
*   [Aspectran Profiles](https://aspectran.com/ko/docs/guides/aspectran-profiles/)
*   [APON(Aspectran Parameters Object Notation) 소개](https://aspectran.com/ko/docs/guides/introduce-apon/)
*   [AsEL(Aspectran Expression Language) 소개](https://aspectran.com/ko/docs/guides/introduce-asel/)
