---
title: "Aspectran 구성 로딩 메커니즘: `nodelet` 엔진 심층 분석"
subheadline: 아키텍처 및 메커니즘
---

Aspectran은 XML 또는 APON(Aspectran Object Notation) 형식의 설정 파일을 파싱하여 애플리케이션의 핵심 컴포넌트(Bean, Translet, Aspect 등)의 설계도인 `*Rule` 객체 트리를 생성합니다. 이 과정의 핵심에는 `com.aspectran.utils.nodelet` 패키지에 구현된, Aspectran을 위해 특별히 설계된 고성능 이벤트 기반 파싱 엔진 **`nodelet`**이 있습니다.

```text
[XML/APON 설정 파일] ---> [NodeletParser] --uses--> [AspectranNodeletGroup] ---> [*Rule 객체 트리] ---> [ActivityContext]
```

## 1. 핵심 파싱 엔진: `com.aspectran.utils.nodelet`

`nodelet`은 일반적인 SAX 파서와 유사하게 이벤트 기반으로 작동하지만, 특정 XPath 경로에 콜백을 직접 매핑하여 복잡한 XML 문서를 훨씬 직관적이고 구조적으로 처리할 수 있게 해주는 경량 파싱 프레임워크입니다.

#### 주요 구성 요소:

*   **`NodeletParser`**: 파싱 프로세스를 주도하는 메인 엔진입니다. XML 문서를 순차적으로 읽어 들이면서 각 노드(엘리먼트)의 시작과 끝을 감지하고, 현재 경로에 해당하는 적절한 이벤트를 발생시킵니다.
*   **`Nodelet` / `EndNodelet`**: 이벤트 핸들러(콜백) 인터페이스입니다.
    *   `Nodelet`: XML 엘리먼트의 **시작 태그**를 만났을 때 호출됩니다. 해당 엘리먼트의 속성(attributes) 정보를 파라미터로 받아 처리합니다.
    *   `EndNodelet`: XML 엘리먼트의 **종료 태그**를 만났을 때 호출됩니다. 해당 엘리먼트가 포함하는 텍스트(CDATA 포함) 내용을 처리합니다.
*   **`NodeletGroup`**: **`nodelet` 엔진의 핵심 설계**입니다. `Nodelet`과 `EndNodelet`을 특정 XPath 경로와 함께 그룹으로 묶어 관리합니다. 이 클래스는 파싱 규칙을 선언적으로 정의할 수 있는 일종의 DSL(Domain-Specific Language) 역할을 하는 Fluent API를 제공합니다.
    *   `.child("elementName")`: 현재 경로의 자식 엘리먼트에 대한 규칙 정의를 시작합니다.
    *   `.parent()`: 현재 경로에서 부모 경로로 이동합니다.
    *   `.nodelet(...)`: 현재 경로의 시작 태그에 대한 `Nodelet`을 등록합니다.
    *   `.endNodelet(...)`: 현재 경로의 종료 태그에 대한 `EndNodelet`을 등록합니다.
    *   `.with(NodeletAdder)`: 재사용 가능한 규칙 세트를 현재 그룹에 추가합니다.
    *   `.mount(NodeletGroup)`: 다른 `NodeletGroup`을 현재 경로에 동적으로 "마운트"합니다.
*   **`NodeletAdder`**: `NodeletGroup`에 재사용 가능한 규칙 세트를 추가하는 역할을 하는 인터페이스입니다. 이를 통해 공통적인 XML 구조(예: `<item>`, `<argument>`)에 대한 파싱 로직을 모듈화하고 여러 곳에서 재사용할 수 있습니다.

#### 혁신적인 `mount` 기능

`NodeletGroup`의 `mount` 기능은 `nodelet` 엔진을 매우 강력하고 효율적으로 만드는 핵심 요소입니다. 이 기능은 특정 엘리먼트가 나타났을 때, 미리 정의된 다른 `NodeletGroup`의 규칙 세트를 동적으로 활성화시킵니다. 이는 다음과 같은 중요한 이점을 가집니다.

1.  **메모리 효율성 및 성능 향상**: `mount`를 사용하면 파서가 전체 절대 XPath 경로(`a/b/c/...`) 대신 마운트된 지점부터의 **상대 경로**를 사용하여 `Nodelet`을 찾습니다. 이로 인해 매우 깊은 중첩 구조에서도 긴 XPath 문자열을 생성하고 비교하는 비용이 발생하지 않아 메모리 사용량이 획기적으로 줄고 파싱 성능이 향상됩니다.
2.  **규칙의 재사용성 극대화**: `<choose>/<when>/<otherwise>`와 같이 반복적으로 나타날 수 있는 복잡한 구조를 별도의 `NodeletGroup`(`ChooseNodeletGroup`)으로 정의해두고, 필요한 곳 어디에서든 `.mount()` 한 줄로 해당 파싱 규칙을 재사용할 수 있습니다.
3.  **중첩 단계 제한 해제**: `mount`는 파싱 컨텍스트를 효과적으로 리셋하는 역할을 하므로, 이론적으로 XML 엘리먼트의 중첩 단계에 제한이 없어집니다.

## 2. Aspectran의 구현: `com.aspectran.core.context.rule.parser.xml`

Aspectran은 위에서 설명한 `nodelet` 엔진을 사용하여 자신의 복잡한 XML 설정 파일(`aspectran-config.xml` 등)을 파싱하고, 그 내용을 `*Rule` 객체 트리로 변환합니다.

#### 파싱 흐름:

1.  **`AspectranNodeParser`의 초기화**: 파싱의 시작점입니다. 내부적으로 `NodeletParser`를 생성하고, Aspectran의 모든 XML 규칙이 정의된 마스터 `NodeletGroup`인 `AspectranNodeletGroup`을 파서에 등록합니다. 또한, DTD 유효성 검사를 위한 `AspectranDtdResolver`도 설정합니다.

2.  **`AspectranNodeletGroup`과 `*NodeletAdder`**:
    *   `AspectranNodeletGroup`은 `<aspectran>` 루트 엘리먼트에 대한 최상위 규칙 그룹입니다. 이 그룹은 `with()` 메소드를 통해 `<bean>`, `<aspect>`, `<translet>` 등 각 최상위 엘리먼트를 처리하는 `BeanNodeletAdder`, `AspectNodeletAdder`, `TransletNodeletAdder` 등을 추가하여 전체 파싱 규칙을 조립합니다.
    *   각 `*NodeletAdder`는 담당하는 XML 엘리먼트와 그 자식 엘리먼트들에 대한 파싱 방법을 `NodeletGroup`의 Fluent API를 사용해 상세하게 정의합니다. 예를 들어, `TransletNodeletAdder`는 `<translet>` 엘리먼트 규칙을 정의하면서, 그 내부에 올 수 있는 `<request>`, `<response>`, `<content>` 등의 자식 엘리먼트 규칙도 함께 정의합니다.
    *   특히 `ActionInnerNodeletAdder`나 `ArgumentNodeletAdder`와 같이 이름에 'Inner'가 붙거나 특정 엘리먼트(argument, property 등)를 처리하는 Adder들은 여러 다른 규칙(예: `<translet>`, `<advice>`, `<bean>`) 내부에서 공통적으로 사용되는 XML 구조를 파싱하기 위해 만들어졌습니다. 이를 통해 파싱 로직의 재사용성을 극대화합니다.

3.  **상태 관리: `AspectranNodeParsingContext`와 `ObjectStack`**:
    *   XML 파싱은 부모-자식 관계를 처리해야 하는 상태 기반(stateful) 작업입니다. 예를 들어, `<action>` 엘리먼트를 파싱할 때는 이 액션이 어떤 `<translet>`에 속하는지 알아야 합니다.
    *   Aspectran은 `AspectranNodeParsingContext`를 통해 이 문제를 해결합니다. 이 클래스는 `ThreadLocal` 변수를 사용하여 스레드별로 안전한 `ArrayStack` (Object Stack)을 제공합니다.
    *   **작동 방식**:
        1.  엘리먼트의 시작 태그 `Nodelet`이 호출되면(예: `<translet>`), 해당 규칙을 담을 `TransletRule` 객체를 생성하여 `AspectranNodeParsingContext.pushObject()`를 통해 스택에 넣습니다.
        2.  자식 엘리먼트(예: `<request>`)의 `Nodelet`에서는 `AspectranNodeParsingContext.peekObject()`를 호출하여 스택의 최상단에 있는 부모 객체(`TransletRule`)를 가져와 자신(`RequestRule`)을 부모에게 연결합니다.
        3.  엘리먼트의 종료 태그 `EndNodelet`이 호출되면, 작업이 완료된 객체를 `AspectranNodeParsingContext.popObject()`를 통해 스택에서 제거합니다.

## 3. 실제 예제로 보는 파싱 과정

#### 예제 1: 기본 `<translet>` 파싱과 Object Stack

다음과 같은 간단한 XML 구성이 있다고 가정해 보겠습니다.

```xml
<translet name="/example/hello">
    <action bean="helloAction" method="sayHello" />
</translet>
```

이 XML을 파싱하는 과정은 다음과 같습니다.

1.  **`<translet>` 시작**:
    *   `NodeletParser`가 `<translet>` 시작 태그를 만납니다.
    *   `TransletNodeletAdder`에 정의된 `nodelet`이 실행됩니다.
    *   `nodelet`은 `name` 속성 값("/example/hello")을 읽어 `TransletRule` 객체를 생성합니다.
    *   생성된 `transletRule` 객체를 `AspectranNodeParsingContext.pushObject()`를 통해 Object Stack에 넣습니다.
    *   **Object Stack 상태**: `[ TransletRule(...) ]`

2.  **`<action>` 시작**:
    *   파서가 자식 노드인 `<action>` 시작 태그를 만납니다.
    *   `TransletNodeletAdder`가 `.with(ActionInnerNodeletAdder.instance())`로 추가한 `ActionInnerNodeletAdder`의 `nodelet`이 실행됩니다.
    *   `nodelet`은 `bean`과 `method` 속성을 읽어 `InvokeActionRule` 객체를 생성합니다.
    *   생성된 `invokeActionRule` 객체를 스택에 넣습니다.
    *   **Object Stack 상태**: `[ TransletRule(...), InvokeActionRule(...) ]`

3.  **`</action>` 종료**:
    *   파서가 `</action>` 종료 태그를 만납니다.
    *   `ActionInnerNodeletAdder`의 `endNodelet`이 실행됩니다.
    *   `InvokeActionRule invokeActionRule = AspectranNodeParsingContext.popObject()`: 스택에서 `InvokeActionRule`을 꺼냅니다.
    *   `HasActionRules hasActionRules = AspectranNodeParsingContext.peekObject()`: 스택의 최상단 객체, 즉 `TransletRule`을 확인합니다. (`TransletRule`은 `HasActionRules` 인터페이스를 구현합니다.)
    *   `hasActionRules.putActionRule(invokeActionRule)`: `TransletRule`에 `InvokeActionRule`을 자식으로 추가합니다.
    *   **Object Stack 상태**: `[ TransletRule(...) ]`

4.  **`</translet>` 종료**:
    *   파서가 `</translet>` 종료 태그를 만납니다.
    *   `TransletNodeletAdder`의 `endNodelet`이 실행됩니다.
    *   `TransletRule transletRule = AspectranNodeParsingContext.popObject()`: 완전히 구성된 `TransletRule`을 스택에서 꺼냅니다.
    *   `AspectranNodeParsingContext.getCurrentRuleParsingContext().addTransletRule(transletRule)`: 완성된 규칙을 `RuleParsingContext`에 최종 등록합니다.
    *   **Object Stack 상태**: `[ ]` (비어 있음)

#### 예제 2: `mount` 기능을 활용한 복잡한 구조 재사용

이번에는 중첩이 가능한 `<choose>` 엘리먼트를 예로 들어 `mount` 기능의 강력함을 살펴보겠습니다.

```xml
<translet name="/example/conditional">
    <choose>
        <when test="@{param:type == 'A'}">
            <action bean="actionA" />
        </when>
        <otherwise>
            <!-- 여기에 또 다른 choose가 올 수 있음 -->
            <action bean="actionB" />
        </otherwise>
    </choose>
</translet>
```

*   `TransletNodeletAdder`는 `.with(ChooseNodeletAdder.instance())`를 통해 `<choose>` 규칙을 추가합니다.
*   `ChooseNodeletAdder`는 `<when>`과 `<otherwise>` 엘리먼트 규칙을 정의할 때, `.mount(ChooseNodeletGroup.instance())`를 호출합니다.
*   `ChooseNodeletGroup`은 `<choose>` 엘리먼트 자체에 대한 파싱 규칙을 정의한 독립적인 그룹입니다.

이것이 의미하는 바는 다음과 같습니다.

> 파서가 `<when>` 또는 `<otherwise>` 엘리먼트 내부에 진입하면, `mount`된 `ChooseNodeletGroup`의 규칙이 **동적으로 활성화**됩니다. 즉, `<when>`과 `<otherwise>` 내부에서 또 다른 `<choose>` 엘리먼트를 만나더라도, 파서는 처음과 똑같은 방식으로 재귀적으로 파싱을 처리할 수 있습니다.

이처럼 `mount` 기능은 복잡하고 재귀적인 XML 구조를 위한 파싱 규칙을 단 한 번만 정의하고, 필요한 모든 곳에서 재사용할 수 있게 하여 코드 중복을 없애고 메모리 사용을 최적화합니다.

### 예제 3: `<aspect>` 규칙과 복합적인 관계 설정

AOP 규칙은 여러 컴포넌트가 복합적으로 관계를 맺기 때문에 파싱 과정이 좀 더 다층적입니다. 다음 예제를 통해 살펴보겠습니다.

```xml
<aspect id="myAspect" order="1">
    <joinpoint>
      pointcut: {
        type: "wildcard",
        +: "/example/hello@helloAction^say*"
      }
    </joinpoint>
    <advice bean="loggingAdvice">
        <before>
            <invoke method="start"/>
        </before>
    </advice>
</aspect>
```

이 XML은 이름이 `/example/hello`인 Translet에서 `helloAction` 빈의 `say`로 시작하는 모든 메소드(`joinpoint`)가 실행되기 전(`before`)에 `loggingAdvice` 빈의 `start()` 메소드를 실행하라는 AOP 규칙을 정의합니다.

포인트컷 문자열에서 `@` 구분자 앞은 Translet의 이름, 뒤는 Bean의 ID를 나타내며, `^` 구분자 뒤는 호출할 메소드명을 의미합니다. 각 부분에는 와일드카드를 사용할 수 있습니다. 만약 특정 Translet을 지정하지 않고 모든 Translet을 대상으로 하려면 `@` 구분자로 패턴을 시작해야 합니다 (예: `+ "@helloAction^say*"`).

1.  **`<aspect>` 시작**:
    *   `AspectNodeletAdder`의 `nodelet`이 실행됩니다.
    *   `id`와 `order` 속성을 읽어 `AspectRule` 객체를 생성하고 스택에 push합니다.
    *   **Object Stack**: `[ AspectRule(...) ]`

2.  **`<joinpoint>` 시작 및 종료**:
    *   `AspectNodeletAdder` 내부에 정의된 `joinpoint`의 `nodelet`이 실행되지만, APON 형식을 사용하는 경우 `nodelet` 자체에서는 특별한 작업을 하지 않습니다.
    *   `</joinpoint>`의 `endNodelet`이 실행됩니다.
    *   `endNodelet`은 `text` 파라미터로 `<joinpoint>` 엘리먼트 내부의 APON 형식 텍스트 전체를 전달받습니다.
    *   `JoinpointRule.updateJoinpoint(joinpointRule, text)`와 같은 내부 로직을 통해 APON 텍스트를 파싱하여 `PointcutRule` 등을 생성합니다.
    *   `peek()`으로 스택의 `AspectRule`을 가져와 완성된 `joinpointRule`을 설정합니다.
    *   **Object Stack**: `[ AspectRule(...) ]`

3.  **`<advice>` 시작**:
    *   `AspectNodeletAdder` 내부에 정의된 `advice`의 `nodelet`이 실행됩니다.
    *   `bean` 속성("loggingAdvice")을 읽습니다.
    *   `peek()`으로 `AspectRule`을 가져와 `setAdviceBeanId("loggingAdvice")`를 호출하여 Advice를 수행할 빈을 지정합니다. 이 단계에서는 스택에 아무것도 push하지 않습니다.
    *   **Object Stack**: `[ AspectRule(...) ]`

4.  **`<before>` 시작**:
    *   `advice`의 자식 노드 규칙은 `AdviceInnerNodeletAdder`가 담당합니다. 이 Adder의 `before`에 대한 `nodelet`이 실행됩니다.
    *   `peek()`으로 `AspectRule`을 가져와 `newBeforeAdviceRule()` 메소드를 호출하여 `AdviceRule` 객체를 생성합니다.
    *   생성된 `adviceRule`을 스택에 push합니다.
    *   **Object Stack**: `[ AspectRule(...), AdviceRule(type=BEFORE, ...) ]`

5.  **`<action>` 시작 및 종료 (in `<before>`)**:
    *   `before` 규칙은 `ActionInnerNodeletAdder`의 규칙을 재사용(`with(...)`)합니다.
    *   `<action>`의 `nodelet`이 실행되어 `InvokeActionRule`("profiler.start")을 생성하고 스택에 push합니다.
    *   **Object Stack**: `[ AspectRule(...), AdviceRule(...), InvokeActionRule(...) ]`
    *   `</action>`의 `endNodelet`이 실행됩니다.
    *   `InvokeActionRule`을 pop하고, `peek()`으로 `AdviceRule`을 가져와 `putActionRule()`을 통해 자식으로 추가합니다.
    *   **Object Stack**: `[ AspectRule(...), AdviceRule(...) ]`

6.  **`</before>` 종료**:
    *   `before`의 `endNodelet`이 실행됩니다.
    *   `AdviceRule`을 pop합니다. 이 `AdviceRule`은 이미 부모인 `AspectRule`에 연결되어 있습니다.
    *   **Object Stack**: `[ AspectRule(...) ]`

7.  **`</advice>` 종료**:
    *   `advice` 엘리먼트 자체에는 `endNodelet`이 특별히 정의되어 있지 않으므로 아무 작업도 수행하지 않습니다.

8.  **`</aspect>` 종료**:
    *   `AspectNodeletAdder`의 `endNodelet`이 실행됩니다.
    *   모든 정보(joinpoint, advice 등)가 채워진 `AspectRule`을 스택에서 pop합니다.
    *   완성된 `aspectRule`을 `RuleParsingContext`에 최종 등록합니다.
    *   **Object Stack**: `[ ]` (비어 있음)

이처럼 복잡한 AOP 규칙조차도 `Nodelet`과 `Object Stack`을 이용한 상태 관리, 그리고 `with()`를 통한 규칙 재사용을 통해 매우 체계적이고 예측 가능하게 파싱되는 것을 확인할 수 있습니다.

## 4. 결론

Aspectran의 구성 로딩 메커니즘은 자체 제작한 `nodelet` 파싱 엔진 위에 정교하게 설계된 아키텍처의 정수입니다. 이 메커니즘의 핵심적인 장점은 **유연성, 재사용성, 성능** 세 가지 키워드로 요약할 수 있습니다.

*   **유연성**: `NodeletGroup`의 Fluent API와 `mount` 기능은 복잡하고 가변적인 XML 구조에 매우 유연하게 대응할 수 있게 해줍니다.
*   **재사용성**: `NodeletAdder`를 통해 `<action>`, `<item>` 등 공통적인 XML 구조에 대한 파싱 로직을 완벽하게 모듈화하고, 필요한 곳 어디에서든 `with()` 메소드로 쉽게 재사용하여 코드 중복을 최소화합니다.
*   **성능**: `mount` 기능은 파싱 컨텍스트를 동적으로 전환하여, 깊은 계층 구조의 XML 문서에서도 전체 XPath를 사용하지 않으므로 효율적인 파싱 성능을 보장합니다.

이렇게 파싱을 통해 생성된 `*Rule` 객체들은 일종의 "청사진"입니다. 파싱이 완료된 후, `ActivityContext`는 이 청사진들을 기반으로 실제 Bean 인스턴스를 생성하고, 의존성을 주입하며, AOP 프록시를 적용하여 애플리케이션의 실행 가능한 런타임 환경을 최종적으로 구축하게 됩니다. 이 아키텍처는 Aspectran 프레임워크의 유연성과 확장성의 핵심 기반이라고 할 수 있습니다.