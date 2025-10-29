---
title: "Aspectran의 얼굴마담: Translet 이해하기"
subheadline: 사용자 가이드
---

Aspectran 프레임워크에서 **트랜스렛(Translet)**은 그 이름만 보면 요청을 처리하는 주체처럼 보이지만, 실제로는 **"요청을 어떻게 처리할 것인가?"**에 대한 구체적인 **실행 계획서 또는 설계도**입니다. 실제 모든 실행은 `Activity`라는 엔진이 담당하며, Translet은 이 `Activity`와 사용자 코드(Action) 사이의 소통을 위한 **매개체** 역할을 합니다.

웹 애플리케이션의 특정 URL 요청 처리, 배치 작업 실행 등 Aspectran에서 실행되는 모든 것은 하나의 Translet 규칙으로 정의됩니다.

## 1. Translet의 특징

### 1.1. 선언적 규칙 기반 (Declarative & Rule-Based)

Translet은 XML 또는 APON(Aspectran Object Notation) 형식의 **선언적인 규칙(Rule)들의 집합**으로 정의됩니다. 이를 통해 비즈니스 로직과 처리 흐름을 분리할 수 있습니다.

```xml
<translet name="/user/info">
  <!-- 요청을 어떻게 처리할지 정의하는 규칙들 -->
  <action bean="userDao" method="getUserInfo"/>
  <transform format="json"/>
</translet>
```

### 1.2. 뛰어난 유연성과 재사용성

하나의 Translet은 특정 요청에 대한 처리 흐름을 정의합니다. 여기에는 다음과 같은 다양한 처리 규칙이 포함될 수 있습니다.

-   **요청(Request) 처리**: 요청 파라미터나 페이로드를 어떻게 처리할지 정의합니다.
-   **액션(Action) 실행**: 어떤 비즈니스 로직을 수행할지 정의합니다.
-   **콘텐츠(Content) 생성**: 처리 결과를 조합하여 응답할 콘텐츠를 생성합니다.
-   **변환(Transform)**: 생성된 콘텐츠를 JSON, XML, 텍스트 등 최종적인 응답 형태로 변환합니다.
-   **응답(Response) 제어**: 처리 결과를 JSON, XML 같은 데이터로 직접 응답하거나, 뷰 템플릿으로 디스패치(Dispatch)하여 UI를 렌더링하거나, 다른 Translet으로 포워드(Forward) 또는 리다이렉트(Redirect)할 수 있습니다.

이러한 규칙들을 조합하여 매우 단순한 작업부터 복잡한 워크플로우까지 유연하게 설계할 수 있습니다.

## 2. Translet은 어떻게 찾아지고 실행되는가?

애플리케이션이 시작될 때, Aspectran은 정의된 모든 Translet 규칙을 파싱하여 **`TransletRuleRegistry`**라는 중앙 저장소에 등록합니다.

사용자의 요청이 들어오면, `Activity`는 이 레지스트리에서 가장 적합한 Translet 규칙(설계도)을 찾아냅니다. Aspectran은 명확한 우선순위에 따라 규칙을 검색하여 항상 가장 구체적인 규칙이 먼저 선택되도록 보장합니다.

1.  **요청 이름 (Request Name)**: `/user/info`와 같이 정확히 일치하는 이름을 찾습니다.
2.  **요청 메소드 (Request Method)**: 웹 환경에서는 `GET`, `POST` 등의 HTTP 메소드가 여기에 해당하며, 같은 요청 이름이라도 이 요청 메소드에 따라 다른 Translet을 실행할 수 있습니다.
3.  **와일드카드 및 경로 변수 패턴**: `/users/*`나 `/users/${userId}`와 같은 패턴을 지원하여 RESTful API를 매우 효율적으로 구현할 수 있습니다.

`Activity`는 찾아낸 Translet 규칙에 따라 실제 요청 처리 작업을 수행합니다. 즉, **Translet은 '설계도'이고 Activity는 그 설계도를 보고 일하는 '건설 인부'**와 같습니다.

### 검색 우선순위: 가장 구체적인 규칙이 먼저!

Translet을 찾을 때는 다음과 같은 우선순위가 적용됩니다.

1.  **완전 일치 (Exact Match)가 최우선**: 와일드카드(`*`)나 경로 변수(`${...}`)가 없는, 이름이 완전히 일치하는 규칙이 가장 먼저 선택됩니다.
2.  **더 구체적인 패턴이 우선**: 여러 와일드카드 패턴이 일치할 경우, 더 구체적인 패턴을 가진 규칙이 우선권을 갖습니다.
    -   **예시**: `GET /users/info` 요청이 들어왔을 때, `/users/*` 규칙과 `/users/info` 규칙이 모두 존재한다면, 더 구체적인 `/users/info` 규칙이 선택됩니다. 마찬가지로, `/users/${userId}/profile` 패턴은 `/users/${userId}/*` 패턴보다 더 구체적이므로 우선 선택됩니다.
3.  **GET이 아닌 요청의 대체(Fallback) 규칙**: `POST`, `PUT` 등의 요청에 대해 정확히 일치하는 규칙이 없다면, Aspectran은 메소드가 지정되지 않은(암묵적 `GET`) 규칙을 차선책으로 찾습니다.
    -   **예시**: `POST /users` 요청이 들어왔는데 `method="post"`로 명시된 `/users` 규칙이 없고, 메소드 지정 없이 정의된 `<translet name="/users">...</translet>` 규칙만 있다면, 이 규칙이 선택되어 처리됩니다.
4.  **나중에 정의된 규칙이 우선 (규칙 덮어쓰기)**: 만약 동일한 요청 이름과 메소드를 가진 Translet 규칙이 여러 번 정의되면, **가장 나중에 정의(등록)된 규칙**이 이전에 정의된 규칙을 덮어쓰고 최종적으로 사용됩니다. 이는 Aspectran 설정 파일이 여러 개로 분리되어 있거나, include 기능으로 다른 파일의 설정을 가져올 때 특정 규칙을 오버라이드(override)하는 용도로 유용하게 사용될 수 있습니다.

이러한 우선순위 덕분에 개발자는 일반적인 경우를 처리하는 규칙과 특정 경우를 처리하는 규칙을 함께 정의하여 코드를 유연하고 직관적으로 관리할 수 있습니다.

## 3. 동적 Translet 생성 (Scanning)

Aspectran의 가장 강력한 기능 중 하나는 **동적 Translet 생성**입니다. 예를 들어, 수백 개의 JSP 파일을 각각 다른 Translet으로 서빙해야 할 때, 수백 개의 `<translet>` 규칙을 반복해서 정의하는 대신, 다음과 같이 단 하나의 규칙만 정의할 수 있습니다.

```xml
<translet name="*" scan="/WEB-INF/jsp/**/*.jsp">
  <description>
    '/WEB-INF/jsp/' 디렉토리 하위 경로에서 모든 JSP 파일을 찾아서 Translet 등록을 자동으로 합니다.
    검색된 jsp 파일의 경로는 template 요소의 file 속성 값으로 지정됩니다.
  </description>
  <dispatch name="/"/>
</translet>
```

위 규칙은 `/WEB-INF/jsp/` 디렉터리와 그 하위 경로에 있는 모든 `.jsp` 파일을 스캔하여, 파일 경로에 따라 동적으로 Translet을 생성하고 등록합니다. 예를 들어, `/WEB-INF/jsp/user/list.jsp` 파일이 발견되면 `user/list`라는 이름의 Translet이 생성됩니다. 이 기능은 정적인 뷰 파일을 대량으로 서빙할 때 매우 유용하며, 반복적인 Translet 정의를 획기적으로 줄여줍니다.

## 4. 어노테이션 기반 Translet 정의: `@RequestTo*`

규칙 기반의 XML/APON 방식 외에도, Aspectran은 **어노테이션(Annotation)**을 사용하여 Java 코드 내에서 직접 Translet을 정의하는 현대적인 방법을 제공합니다. `@Component`로 선언된 빈(Bean) 클래스 내에서, `@RequestToGet`, `@RequestToPost` 등 요청 메소드에 대응되는 어노테이션을 특정 메소드에 직접 붙이면, Aspectran은 해당 메소드를 핵심 액션으로 삼아 **암시적으로 Translet 규칙을 생성**합니다.

```java
@Component // 이 클래스가 빈(Bean)임을 나타냅니다.
public class UserApiController {

    @Autowired
    private UserDao userDao;

    // GET /user/info/${userId} 요청에 대한 Translet 규칙을 생성합니다.
    // 이 메소드는 Activity에 의해 실행되는 Action이 됩니다.
    @RequestToGet("/user/info/${userId}")
    @Transform(format = "json") // 결과를 JSON으로 변환합니다.
    public User getUserInfo(long userId, Translet translet) { // (1)
        // 메소드의 반환값이 바로 응답 콘텐츠가 됩니다.
        return userDao.getUserById(userId);
    }
}
```
**(1)** 경로 변수 `${userId}`는 이름이 동일한 `userId` 인자에 자동으로 주입됩니다. 이처럼 Aspectran은 별도 어노테이션 없이 이름과 타입으로 인자를 주입하는 강력한 기능을 제공합니다. 또한, `Translet` 타입을 인자로 선언하면 `Activity`가 현재 `Translet` 인스턴스를 주입해 줍니다.

### 4.1. 비동기 요청 처리

시간이 오래 걸리는 작업을 처리해야 할 경우, `async` 속성을 `true`로 설정하여 Translet을 **비동기적으로 실행**하도록 `Activity`에 지시할 수 있습니다.

```java
@RequestToPost(
    path = "/reports/generate",
    async = true, // 비동기 실행을 활성화합니다.
    timeout = 30000L
)
@Transform(format = "text")
public String generateReport(Translet translet) {
    // 요청 본문을 Aspectran의 Parameters 객체로 파싱합니다.
    // Content-Type에 따라 JSON, XML 등이 자동으로 파싱됩니다.
    Parameters parameters = translet.getRequestAdapter().getBodyAsParameters();

    // 비즈니스 로직은 Parameters 객체를 직접 사용합니다.
    reportService.generate(parameters);

    return "Report generation has started in the background.";
}
```

## 5. 결론: Translet의 진정한 역할 - '인터페이스'

Translet을 한마디로 정의하면 **'얼굴마담(Figurehead)' 또는 '퍼사드(Facade)'**라고 할 수 있습니다. 사용자가 보는 관점과 프레임워크 내부에서의 실제 역할이 구분되기 때문입니다.

**사용자의 관점**에서 Translet은 명확한 요청 처리 단위입니다. 개발자는 특정 요청 경로(`path`)에 Translet을 매핑하고, 그 안에 실행할 액션과 응답 방식을 정의합니다. 이처럼 사용자는 Translet을 통해 애플리케이션의 동작을 설계하고 제어하는 것처럼 보입니다.

하지만 **프레임워크 내부의 관점**에서, Translet 규칙은 요청을 직접적으로 처리하지 않는 **'설계도'**에 불과합니다. 실제 모든 처리 작업(액션 실행, 규칙 해석, AOP 적용 등)은 **`Activity`라는 실행 엔진**의 몫입니다.

Translet의 진정한 역할은 이 둘 사이의 **'소통을 위한 인터페이스'**입니다. `Activity`는 요청 처리 중 `Translet` 인스턴스를 생성하며, 이 인스턴스는 다음과 같은 중요한 임무를 수행합니다.

*   **프로그래밍 인터페이스**: `Activity`는 Action 메소드를 호출할 때 `Translet` 인스턴스를 인자로 전달할 수 있습니다. 사용자 코드는 이 인스턴스를 통해 프레임워크와 상호작용합니다.
*   **데이터 저장소**: `Activity`가 처리한 결과(`ProcessResult`)를 보관하여 사용자 코드가 접근할 수 있도록 합니다.
*   **제어 통로**: 사용자 코드가 `Translet` 인스턴스를 통해 응답 방식을 일부 제어할 수 있는 통로를 제공합니다.

이처럼 Translet은 복잡한 내부 실행 로직(`Activity`)을 감추고 사용자에게는 명확하고 단순한 '설계도'와 '인터페이스'만을 보여줍니다. 이러한 역할 덕분에 개발자는 내부의 복잡한 동작을 몰라도 애플리케이션의 기능을 쉽고 유연하게 설계하고 확장해 나갈 수 있습니다.
