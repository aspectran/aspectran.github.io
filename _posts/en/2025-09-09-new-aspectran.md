---
headline: Releases
title:  Aspectran 9.0 Releases
breadcrumb: true
categories:
  - notice
tags:
  - release
published: true
excerpt_separator: <!--more-->
---

Aspectran 9.0은 프레임워크의 현대화, 개발 편의성 향상, 그리고 핵심 성능 강화를 목표로 하는 중요한 메이저 업데이트입니다. Java 21 지원을 시작으로, 최신 개발 트렌드에 맞는 강력한 신규 기능들이 대거 도입되었으며, 내부 아키텍처를 혁신하여 안정성과 확장성을 한 차원 높였습니다.
<!--more-->
또한, 이번 릴리즈부터 사용자들이 Aspectran을 더 쉽고 깊이 있게 활용할 수 있도록 **공식 사용자 가이드 문서를 제공**합니다.

## ✨ 주요 변경 사항 (Highlights)

*   **Java 21 지원**: 최신 LTS 버전인 Java 21을 최소 지원 버전으로 지정하여, 최신 Java 생태계의 이점을 최대한 활용할 수 있도록 기반을 강화했습니다.
*   **공식 사용자 가이드 문서 제공**: 이제 Aspectran을 처음 시작하는 개발자부터 고급 기능을 활용하려는 사용자까지 모두를 위한 체계적인 공식 문서를 제공합니다.
*   **핵심 기능 현대화**: `Optional<T>`을 이용한 선택적 의존성 주입, `@EventListener`를 통한 이벤트 기반 아키텍처, `@Async`를 활용한 손쉬운 비동기 처리 등 현대적인 애플리케이션 개발에 필수적인 기능들이 새롭게 추가되었습니다.
*   **XML 파싱 엔진 혁신**: 내부 XML 파싱 엔진(`Nodelet`)을 대대적으로 리팩토링하여 복잡한 설정도 빠르고 효율적으로 처리하며, 메모리 사용량을 획기적으로 개선했습니다.

## 💥 중대한 변경 사항 (Breaking Changes)

*   **Java 21 필수**: Aspectran 9.0을 사용하기 위해서는 반드시 Java 21 이상의 환경이 필요합니다. 이전 버전의 Java에서는 실행되지 않습니다.
*   **Java 21 미만 사용자 안내**: Java 21 미만(Java 17 이상)의 환경에서는 안정 버전인 **Aspectran 8.5.3**을 사용해 주시기 바랍니다.

## 🚀 상세 개선 내역

### 새로운 기능 (New Features)

*   **선택적 의존성 주입 (`Optional<T>`)**
    *   특정 프로파일에서만 활성화되는 등, 존재하지 않을 수도 있는 빈(Bean)을 주입받아야 할 때 `java.util.Optional<T>`을 사용할 수 있습니다. 이를 통해 `NullPointerException` 없이 더 안전하고 유연한 의존성 관리가 가능합니다.
    *   **예시**:
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

*   **이벤트 처리 (`@EventListener`)**
    *   컴포넌트 간의 결합도를 낮추기 위해 이벤트 발행/구독 모델을 도입했습니다. `activityContext.getEventPublisher().publish()`를 통해 이벤트를 발행하고, `@EventListener` 어노테이션을 사용하여 해당 이벤트를 구독하고 처리할 수 있습니다.
    *   **예시**:
        ```java
        // 이벤트 발행
        public class OrderService {
            public void completeOrder(Order order) {
                // ... 주문 처리 로직 ...
                activityContext.getEventPublisher().publish(new OrderCompletedEvent(order));
            }
        }

        // 이벤트 구독
        @Component
        public class NotificationEventListener {
            @EventListener
            public void handleOrderCompleted(OrderCompletedEvent event) {
                // 주문 완료 시 알림 발송 로직
            }
        }
        ```

*   **비동기 메소드 실행 (`@Async`)**
    *   시간이 오래 걸리는 작업을 별도의 스레드에서 비동기적으로 실행하려면 메소드에 `@Async` 어노테이션을 사용하면 됩니다.
    *   **예시**:
        ```java
        @Component
        public class EmailService {
            @Async
            public void sendEmail(String to, String subject, String body) {
                // 시간이 오래 걸리는 이메일 발송 작업
            }
        }
        ```

### 개선 사항 (Enhancements)

*   **XML 파싱 엔진(`Nodelet`) 리팩토링**
    *   XML 설정 파일을 파싱하는 핵심 엔진을 대대적으로 개선하여 성능과 메모리 효율성, 유지보수성을 크게 향상시켰습니다.
    *   Fluent API와 혁신적인 `mount` 기능을 도입하여, 매우 복잡하고 깊은 중첩 구조의 XML 문서도 빠르고 안정적으로 처리할 수 있습니다.

*   **XML 설정 간소화**
    *   `<bean>` 설정 시, 생성자 인자나 속성이 단 하나일 경우 `<arguments>`나 `<properties>`와 같은 래퍼(wrapper) 엘리먼트 없이 `<argument>`와 `<property>`를 직접 사용할 수 있도록 DTD를 개선했습니다. 이를 통해 XML 설정을 더욱 간결하게 작성할 수 있습니다.
    *   **예시**:
        ```xml
        <!-- 개선된 방식 -->
        <bean id="myBean" class="com.example.MyBean">
            <property name="message" value="Hello"/>
        </bean>
        ```