---
format: plate solid article
sidebar: toc-left
title: Aspectran 설정 규칙 아키텍처 심층 분석
subheadline: 아키텍처
parent_path: /docs
---

Aspectran의 `com.aspectran.core.context.rule` 패키지는 프레임워크의 모든 **설정 정보**를 자바 객체로 표현한 집합입니다. XML이나 APON 형식의 설정 파일은 파서(`NodeletParser`)에 의해 이 `Rule` 객체들로 변환되어 메모리에 로드됩니다. 즉, 이들은 애플리케이션의 **설계도(Blueprint)** 역할을 하는 순수한 데이터 객체(POJO)들입니다.

## 1. 핵심 구성 요소 규칙 (Top-Level Rules)

애플리케이션의 가장 중요한 최상위 구성 요소를 정의하는 규칙들입니다.

-   **`TransletRule`**: 요청 처리의 기본 단위인 '트랜슬릿'을 정의합니다. 어떤 요청(`name`, `method`)에 반응할지, 요청을 어떻게 처리할지(`RequestRule`), 어떤 비즈니스 로직(Action)을 실행할지(`ContentList`), 어떻게 응답할지(`ResponseRule`), 예외는 어떻게 처리할지(`ExceptionRule`) 등 하나의 요청-응답 사이클에 대한 모든 규칙을 포함하는 **컨테이너** 역할입니다.
-   **`BeanRule`**: IoC 컨테이너가 관리할 '빈(Bean)'을 정의합니다. 빈의 ID, 클래스, 스코프(`ScopeType`), 생성자 인자(`arguments`), 프로퍼티(`properties`), 생명주기 메소드(`initMethod`, `destroyMethod`) 등 빈 하나를 생성하고 관리하는 데 필요한 모든 정보를 담고 있습니다.
-   **`AspectRule`**: AOP(관점 지향 프로그래밍)를 위한 '애스펙트'를 정의합니다. 어떤 지점(Joinpoint)에 개입할지를 정의하는 `JoinpointRule`과, 각 시점(Before, After, Around 등)에 실행될 로직을 정의하는 `AdviceRule`들을 포함합니다.
-   **`ScheduleRule`**: 스케줄링 작업을 정의합니다. 어떤 스케줄러(Scheduler)를 사용하고, 언제 실행할지(`Trigger`), 어떤 작업(`ScheduledJobRule`)을 수행할지를 정의합니다.
-   **`TemplateRule`**: 응답을 생성할 때 사용할 뷰 템플릿을 정의합니다. 템플릿의 ID, 사용할 템플릿 엔진(`engine`), 템플릿 파일의 위치(`file`, `resource`, `url`) 또는 내용(`content`) 등을 포함합니다.

## 2. 행위 및 응답 규칙 (Action & Response Rules)

`TransletRule`이나 `AdviceRule` 내에서 실제 실행될 로직과 응답 방식을 정의하는 규칙들입니다. 이들은 `Activity`의 처리 파이프라인에서 핵심적인 역할을 수행합니다.

### 2.1. 액션 규칙 (Action Rules)

액션 규칙은 실제 비즈니스 로직을 수행하거나 데이터 흐름을 제어하는 명령을 정의합니다.

-   **`InvokeActionRule`**: 가장 핵심적인 액션으로, 지정된 빈(Bean)의 특정 메서드를 호출합니다.
-   **`IncludeActionRule`**: 다른 트랜슬릿을 현재 위치에 포함시켜 실행합니다. 공통 로직을 모듈화하고 재사용하는 데 매우 유용합니다.
-   **`EchoActionRule`**: 현재 컨텍스트의 데이터를 `ActionResult`로 생성하여 결과에 포함시킵니다. 주로 뷰 템플릿에 전달할 모델 데이터를 구성하는 데 사용됩니다.
-   **`HeaderActionRule`**: HTTP 응답 헤더를 설정합니다. 웹 환경에서만 의미가 있습니다.
-   **`ChooseRule`**: 조건에 따라 실행 흐름을 분기합니다. 내부에 하나 이상의 `<when>`과 선택적인 `<otherwise>`를 가집니다.

### 2.2. 응답 규칙 (Response Rules)

응답 규칙은 `Activity`의 처리 결과를 클라이언트에게 어떻게 반환할지를 결정합니다.

-   **`TransformRule`**: Action의 처리 결과를 특정 데이터 형식으로 변환하여 응답합니다. REST API 구현의 핵심입니다.
-   **`DispatchRule`**: 처리 결과를 뷰 템플릿으로 전달하여 UI를 렌더링합니다. MVC 패턴의 View에 해당합니다.
-   **`ForwardRule`**: 현재 요청을 서버 내부의 다른 트랜슬릿으로 전달합니다. 클라이언트의 URL은 변경되지 않으며, 요청과 응답 객체가 그대로 유지됩니다.
-   **`RedirectRule`**: 클라이언트에게 지정된 URL로 재요청하라는 HTTP 리다이렉트(3xx 상태 코드) 응답을 보냅니다.

## 3. 데이터 및 파라미터 규칙 (Data & Parameter Rules)

설정의 가장 기본 단위인 '값'을 정의하고 다루는 규칙들입니다.

-   **`ItemRule`**: 모든 파라미터, 속성, 인자, 프로퍼티의 기본 단위입니다. `name`과 `value`를 가지며, 값의 타입(`ItemType`: `SINGLE`, `ARRAY`, `LIST`, `MAP` 등)과 값의 해석 방식(`ItemValueType`: `STRING`, `INT`, `BEAN` 등)을 정의할 수 있습니다. 이를 통해 타입 변환을 지원합니다.
-   **`ItemRuleMap` / `ItemRuleList`**: `ItemRule`의 컬렉션으로, 여러 개의 파라미터나 속성을 그룹으로 관리합니다.

## 4. 구조 및 보조 규칙 (Structural & Helper Rules)

설정의 구조를 잡고 부가적인 기능을 정의하는 규칙들입니다.

-   **`AppendRule`**: 외부 설정 파일(XML, APON)을 가져와 현재 설정에 병합하도록 지시합니다. 설정을 기능별, 모듈별로 분리하여 관리할 수 있게 해주는 강력한 기능입니다.
-   **`EnvironmentRule`**: 특정 프로파일(`profile`)이 활성화될 때만 적용될 프로퍼티들을 정의합니다. (e.g., 개발/운영 DB 정보 분리)
-   **`ExceptionRule`**: 예외 처리 로직을 그룹화하며, 어떤 예외(`ExceptionThrownRule`)가 발생했을 때 어떻게 처리할지를 정의합니다.
-   **`DescriptionRule`**: 각 규칙에 대한 설명을 추가하여 설정의 가독성을 높입니다.

## 5. 능력 인터페이스 (Ability Interfaces): 조합 가능한 설계를 위한 핵심

`com.aspectran.core.context.rule.ability` 패키지의 인터페이스들은 Aspectran의 `Rule` 아키텍처가 유연하고 확장 가능한 이유를 보여주는 핵심적인 설계입니다. 이 인터페이스들은 각 `Rule` 클래스가 어떤 종류의 자식 규칙을 가질 수 있는지를 명시하는 **계약(Contract)** 역할을 합니다.

-   **`HasActionRules`**: 이 인터페이스를 구현한 규칙(`TransletRule`, `AdviceRule` 등)은 내부에 `InvokeActionRule`, `EchoActionRule` 같은 액션 규칙들을 포함할 수 있습니다.
-   **`HasResponseRules`**: 이 인터페이스를 구현한 규칙(`TransletRule`, `ExceptionThrownRule` 등)은 내부에 `TransformRule`, `DispatchRule` 같은 응답 규칙들을 포함할 수 있습니다.
-   **`HasParameters`, `HasAttributes`, `HasProperties`, `HasArguments`**: 각각 파라미터, 속성, 프로퍼티, 인자(`ItemRule`)를 자식으로 가질 수 있음을 나타냅니다.
-   **`BeanReferenceable`**: 해당 규칙이 다른 '빈(Bean)'을 참조할 수 있음을 나타내는 마커 인터페이스입니다. 컨텍스트 로딩 시 `BeanReferenceInspector`가 이 인터페이스를 통해 모든 빈 참조가 유효한지 검사하는 데 사용됩니다.
-   **`Replicable`**: `replicate()` 메소드를 통해 자기 자신을 복제할 수 있음을 나타냅니다. Aspectran은 스레드 안정성을 위해 최초에 로드된 원본 규칙은 그대로 두고, 실제 요청 처리 시에는 이 규칙들을 복제하여 사용합니다.

이러한 '능력(Ability)' 인터페이스 기반의 설계는 **조합 패턴(Composite Pattern)**을 활용하여, 필요한 기능을 레고 블록처럼 조립할 수 있게 해줍니다. 이로 인해 프레임워크는 매우 유연하고 확장하기 쉬운 구조를 갖게 됩니다.

## 6. 결론

Aspectran의 `rule` 패키지는 **계층적이고 조합 가능한(Composable) 객체 모델**을 통해 프레임워크의 모든 설정을 표현합니다. 각 `*Rule.java` 파일은 설정 파일의 특정 태그나 속성에 일대일로 대응하는 데이터 객체이며, 이들의 조합을 통해 복잡한 애플리케이션의 구조와 행위를 정의합니다.

이러한 설계는 다음과 같은 장점을 가집니다.

-   **명확성**: XML 태그 구조가 자바 객체 구조로 그대로 매핑되어 코드를 통해 설정을 이해하기 쉽습니다.
-   **타입 안정성**: 모든 설정이 타입이 정해진 객체로 변환되므로, 로딩 시점에 설정 오류를 검증하기 용이합니다.
-   **유연성 및 확장성**: `ability` 인터페이스와 조합 패턴을 통해 새로운 종류의 규칙을 추가하거나 기존 규칙을 확장하기 쉬운 구조입니다.
-   **실행과 정의의 분리**: `Rule` 객체들은 행위를 '정의'만 할 뿐, 실제 '실행'은 `Activity` 같은 런타임 엔진이 이 규칙들을 읽어서 처리합니다. 이는 프레임워크의 핵심 로직과 사용자 설정을 명확하게 분리합니다.
