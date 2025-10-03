---
title:  Aspectran Translet 실용 가이드
subheadline: 실용 가이드
---

이 문서는 Aspectran에서 요청 처리 단위인 Translet을 정의하고 활용하는 실용적인 방법을 안내합니다. 개발자가 실제 코드를 작성할 때 주로 고민하는 요청 데이터 처리, 비즈니스 로직 실행, 응답 제어에 초점을 맞춥니다.

## 1. Translet과 액션 메소드

Translet은 **"요청을 어떻게 처리할 것인가?"**에 대한 설계도 또는 레시피입니다. Aspectran에서는 `@Request*` 어노테이션이 붙은 public 메소드를 **액션 메소드(Action Method)**라고 부르며, 이 액션 메소드가 Translet의 핵심적인 비즈니스 로직을 처리하는 진입점이 됩니다.

```java
@Component // 1. 컴포넌트 빈으로 선언
public class UserActivity {

    // 2. @Request* 어노테이션으로 Translet과 매핑된 액션 메소드
    @RequestToGet("/users/${userId}")
    public User getUser(long userId) {
        // 3. 비즈니스 로직 처리
        // ...
    }
}
```

## 2. 요청 매핑 어노테이션

액션 메소드를 특정 요청 URL 및 메소드와 연결하기 위해 사용합니다.

*   **`@Request`**: 가장 일반적인 요청 매핑 어노테이션입니다. `method` 속성을 사용하여 허용할 요청 메소드를 직접 지정할 수 있습니다. 만약 `method` 속성을 생략하면, **모든 요청 메소드**를 허용합니다.
    ```java
    // GET과 POST 요청만 허용
    @Request(path = "/some/path", method = {MethodType.GET, MethodType.POST})
    public void handleGetAndPost() { ... }

    // 모든 요청 메소드 허용
    @Request("/any/path")
    public void handleAllMethods() { ... }
    ```

*   **`@RequestToGet`, `@RequestToPost`, `@RequestToPut`, `@RequestToPatch`, `@RequestToDelete`**: 특정 요청 메소드에 대한 단축(Shortcut) 어노테이션입니다. 코드를 더 간결하고 직관적으로 만들어 줍니다.
    ```java
    // @Request(path = "/users", method = MethodType.GET)과 동일
    @RequestToGet("/users")
    public List<User> listUsers() { ... }

    // @Request(path = "/users", method = MethodType.POST)과 동일
    @RequestToPost("/users")
    public void createUser(User user) { ... }
    ```

## 3. 액션 메소드의 인자 (Argument Injection)

Aspectran의 가장 강력한 기능 중 하나는 액션 메소드의 인자를 자동으로 분석하고 주입해주는 것입니다. 별도의 어노테이션 없이, 파라미터의 이름과 타입만으로 대부분의 주입이 완료됩니다.

### 3.1. 요청 데이터 주입

*   **경로 변수 (Path Variables)**: Translet 경로에 토큰을 사용하여 URL 경로의 일부를 변수로 추출할 수 있습니다.
    *   `${...}`: **파라미터(Parameter)**로 추출합니다. (예: `/users/${userId}`)
    *   `@{...}`: **속성(Attribute)**으로 추출합니다. (예: `/users/@{userId}`)
    추출된 값은 메소드 인자 이름으로 매핑됩니다. 대부분의 경우 `${...}` 토큰을 사용합니다.

*   **요청 파라미터 (Request Parameters)**: URL 쿼리 스트링(`?name=value`)이나 POST 폼 데이터는 이름으로 메소드 인자에 자동 매핑됩니다.

*   **POJO 매핑**: 요청 파라미터들을 자동으로 POJO(Plain Old Java Object)의 필드에 매핑할 수 있습니다.

```java
@Component
public class ProductActivity {

    /**
     * 경로 변수와 요청 파라미터 자동 주입
     * 요청 예: /categories/BOOKS/products/123?includeDetails=true
     */
    @Request("/categories/${categoryId}/products/${productId}")
    public Product getProduct(String categoryId, long productId, boolean includeDetails) {
        // categoryId = "BOOKS"
        // productId = 123L
        // includeDetails = true
    }

    /**
     * POJO 객체 자동 매핑
     * 요청 파라미터: username=jdoe&password=1234&email=...
     */
    @RequestToPost("/account/new")
    public void createAccount(Account account) {
        // account 객체의 각 필드에 파라미터 값이 자동으로 채워짐
        accountService.create(account);
    }
}
```

### 3.2. 컨텍스트 객체 및 Bean 주입

*   **`Translet` 객체**: 현재 요청의 컨텍스트 정보를 담고 있는 `Translet` 객체가 필요하면, 인자에 선언하는 것만으로 주입받을 수 있습니다.
*   **다른 Bean 객체**: `@Autowired` 없이, 현재 컨테이너에 등록된 다른 Bean들도 타입과 이름으로 찾아 자동으로 주입해줍니다.

```java
@Component
public class AccountActivity {

    @RequestToPost("/account/new")
    public void newAccount(
            Translet translet,   // 1. Translet 객체 주입
            Account account,      // 2. POJO 매핑
            BeanValidator validator // 3. 컨테이너의 다른 Bean 주입
    ) {
        validator.validate(account);
        if (validator.hasErrors()) {
            translet.forward("/account/newAccountForm"); // 4. 주입받은 Translet 사용
        } else {
            // ...
        }
    }
}
```

### 3.3. 파라미터 세부 제어 어노테이션

*   **`@Required`**: 인자 앞에 붙여주면, 해당 파라미터가 요청에 반드시 포함되어야 함을 의미합니다. 누락 시 예외가 발생합니다.
*   **`@Qualifier("name")`**: 주입받을 파라미터나 Bean의 이름이 모호할 경우(같은 타입의 Bean이 여러 개 등), 명시적으로 이름을 지정합니다.
*   **`@Format("pattern")`**: `Date`, `LocalDateTime` 등 날짜/시간 타입의 인자에 사용하여 문자열 값의 포맷을 지정합니다.

```java
@Request("/orders")
public void getOrders(
        @Required String status, // status 파라미터는 필수
        @Format("yyyy-MM-dd") Date fromDate, // "2025-01-20" 형식의 파라미터
        @Qualifier("userBean") User user // ID가 "userBean"인 Bean 주입
) {
    // ...
}
```

## 4. 응답 처리

액션 메소드의 반환 값이나 어노테이션을 통해 응답을 간단하게 제어할 수 있습니다.

### 4.1. 어노테이션 기반 응답 규칙

*   **`@Transform(format = "...")`**: 메소드가 반환하는 객체(주로 POJO나 `Map`)를 지정된 형식(json, xml, text 등)의 문자열로 변환하여 응답합니다. REST API 구현에 매우 유용합니다.
    ```java
    @RequestToGet("/api/users/${userId}")
    @Transform(format = "json")
    public User getUser(@Required long userId) {
        return userService.getUser(userId);
    }
    ```
*   **`@Dispatch("...")`**: 지정된 뷰 템플릿(JSP, Thymeleaf 등)으로 처리를 전달(dispatch)하여 HTML을 렌더링합니다.
    ```java
    @Request("/account/signonForm")
    @Dispatch("account/SignonForm") // account/SignonForm.jsp 뷰로 디스패치
    public void signonForm() {
    }
    ```
*   **`@Forward(translet = "...")`**: 지정된 다른 Translet으로 서버 내부에서 처리를 전달합니다. `@AttrItem`으로 속성을 함께 전달할 수 있습니다.
    ```java
    @Request("/legacy/path")
    @Forward(
        translet = "/new/path",
        attributes = {
            @AttrItem(name = "attr1", value = "some value")
        }
    )
    public void forwardToNewPath() {
    }
    ```
*   **`@Redirect("...")`**: 지정된 URL로 클라이언트를 리다이렉트시킵니다. `@ParamItem`으로 파라미터를 함께 전달할 수 있습니다.
    ```java
    @RequestToPost("/orders")
    @Redirect(
        path = "/order/view",
        parameters = {
            @ParamItem(name = "orderId", value = "#{result.orderId}")
        }
    )
    public Order createOrder(Order order) {
        return orderService.create(order); // 반환된 Order 객체는 'result'라는 이름으로 참조 가능
    }
    ```

### 4.2. 프로그래밍 방식 응답

메소드 내에서 `Translet` 객체의 응답 메소드를 직접 호출하여 조건에 따라 동적으로 응답을 제어할 수 있습니다. 프로그래밍 방식 응답이 호출되면, 해당 액션 메소드에 적용된 `@Transform`, `@Dispatch` 등의 응답 어노테이션은 무시됩니다.

*   **`translet.forward(transletName)`**: 서버 내부에서 다른 Translet으로 요청 처리를 위임합니다.
    ```java
    @Request("/orders/viewOrEdit/${orderId}")
    public void viewOrEditOrder(Translet translet, long orderId, boolean editable) {
        if (editable) {
            // 편집 가능한 상태면 /orders/edit/${orderId} Translet으로 전달
            translet.forward("/orders/edit/" + orderId);
        } else {
            // 그 외에는 /orders/view/${orderId} Translet으로 전달
            translet.forward("/orders/view/" + orderId);
        }
    }
    ```

*   **`translet.redirect(path)`**: 클라이언트에게 지정된 URL로 재요청하라는 리다이렉트 응답을 보냅니다.
    ```java
    @RequestToPost("/account/signon")
    public void signon(Translet translet, String username, String password) {
        Account account = accountService.getAccount(username, password);
        if (account == null) {
            translet.redirect("/account/signonForm?retry=true");
        } else {
            translet.redirect("/");
        }
    }
    ```

*   **`translet.dispatch(name)`**: 지정된 뷰 템플릿(JSP, Thymeleaf 등)으로 디스패치하여 UI를 렌더링합니다.
    ```java
    @Request("/products/${productId}")
    public void viewProduct(Translet translet, String productId) {
        Product product = catalogService.getProduct(productId);
        if (product == null) {
            // 상품이 없으면 'not_found' 뷰를 보여줌
            translet.dispatch("error/not_found");
        } else {
            translet.setAttribute("product", product);
            translet.dispatch("catalog/product_details");
        }
    }
    ```

*   **`translet.transform(rule)`**: 특정 변환 규칙(`TransformRule`)을 동적으로 적용하여 응답을 생성합니다.
    ```java
    @Request("/api/legacy/data")
    public void getLegacyData(Translet translet) {
        // ... 데이터 처리 로직 ...
        if (isJsonNeeded(translet)) {
            TransformRule jsonRule = new TransformRule();
            jsonRule.setFormatType(FormatType.JSON);
            jsonRule.setContentType(ContentType.APPLICATION_JSON);
            translet.transform(jsonRule);
        }
    }
    ```

*   **`translet.response(response)`**: `ResponseTemplate` 등을 사용하여 완전히 사용자 정의된 응답을 생성할 때 사용합니다. HTTP 헤더를 직접 제어하거나, 파일 다운로드와 같이 출력 스트림에 직접 데이터를 써야 할 때 유용합니다.
    ```java
    @Request("/api/csv/download")
    public void downloadCsv(Translet translet) throws IOException {
        ResponseTemplate template = new ResponseTemplate(translet.getResponseAdapter());
        template.setContentType("text/csv");
        template.setHeader("Content-Disposition", "attachment; filename=\"report.csv\"");

        try (Writer writer = template.getWriter()) {
            writer.write("id,name,value\n");
            writer.write("1,apple,100\n");
            writer.write("2,banana,200\n");
        }

        translet.response(template);
    }
    ```

## 5. 핵심 로직(Action) 분리 및 참조

`@Action` 어노테이션을 사용하면, 메소드의 실행 결과를 Translet 내에서 재사용 가능한 데이터로 만들 수 있습니다.

```java
@Request("/cart/viewCart")
@Dispatch("cart/Cart")
@Action("cart") // 이 메소드의 반환값은 "cart"라는 이름으로 저장됨
public Cart viewCart() {
    return cartService.getCart();
}

// XML이나 다른 규칙에서 #{cart} 형태로 위 Action의 결과를 참조할 수 있음
```

## 6. 리다이렉트 시 1회성 데이터 전달: FlashMap

웹 애플리케이션에서 PRG(Post-Redirect-Get) 패턴을 사용할 때, POST 요청 처리 후 리다이렉트된 GET 요청으로 '성공적으로 처리되었습니다' 같은 메시지를 **단 한번만** 전달하고 싶을 때가 있습니다. 세션을 직접 사용하면 데이터를 수동으로 삭제해야 하는 번거로움이 있지만, **FlashMap**을 사용하면 이 과정을 매우 간단하게 처리할 수 있습니다.

FlashMap은 리다이렉트 직전에 저장되었다가, 리다이렉트된 다음 요청에서만 조회할 수 있고 그 후에는 자동으로 소멸되는 임시 데이터 저장소입니다.

### FlashMap에 데이터 저장하기

액션 메소드에서 `Translet` 객체를 통해 `getOutputFlashMap()`을 호출하여 데이터를 저장합니다. 데이터 저장 후 `redirect()`를 호출하면, FlashMap이 다음 요청으로 전달될 준비를 합니다.

```java
@Component
public class OwnerController {
    @RequestToPost("/owners/new")
    public void processCreationForm(@NonNull Translet translet, Owner owner) {
        // ... owner 저장 로직 ...
        ownerDao.save(owner);

        // 1. OutputFlashMap을 얻어와 "message"라는 키로 데이터를 저장한다.
        translet.getOutputFlashMap().put("message", "New Owner Created");

        // 2. 리다이렉트한다.
        translet.redirect("/owners/" + owner.getId());
    }
}
```

### FlashMap 데이터 조회하기

리다이렉트된 후의 요청에서는 `translet.getInputFlashMap()`을 통해 이전 요청에서 저장한 데이터를 조회할 수 있습니다. 보통 이 작업은 AOP Aspect를 사용하여 공통 로직으로 처리하는 것이 편리합니다.

다음은 `FlashMapEchoAspect` 예제처럼, GET 요청이 올 때 FlashMap에 데이터가 있으면 이를 request attribute로 옮겨서 뷰 템플릿(JSP, Thymeleaf 등)에서 쉽게 사용할 수 있도록 만드는 Aspect입니다.

```java
@Component
@Aspect("flashMapEchoAspect")
@Joinpoint(methods = MethodType.GET, pointcut = "+: /**") // 모든 GET 요청을 대상으로
public class FlashMapEchoAspect {

    @Before
    public void echo(@NonNull Translet translet) {
        if (translet.hasInputFlashMap()) {
            // 뷰에서 ${flashMap.message} 형태로 사용할 수 있도록 attribute로 저장
            translet.setAttribute("flashMap", translet.getInputFlashMap());
        }
    }
}
```

이렇게 하면, 뷰 템플릿에서는 `flashMap`이라는 이름으로 데이터에 접근하여 사용자에게 "New Owner Created" 같은 1회성 메시지를 보여줄 수 있습니다.

### FlashMap 사용 시 주의사항

FlashMap은 `SessionFlashMapManager`에 의해 기본적으로 **사용자의 세션(Session)에 임시 저장**되었다가 다음 요청 처리 시 사용된 후 소멸됩니다. 이러한 동작 방식 때문에 몇 가지 주의할 점이 있습니다.

1.  **1회성 데이터**: FlashMap에 저장된 속성은 리다이렉트 후의 **단일 요청에서만 유효**하며, 조회된 후에는 자동으로 삭제됩니다. 따라서 여러 요청에 걸쳐 데이터가 필요하다면 세션에 직접 저장해야 합니다.

2.  **세션 의존성**: 데이터가 세션에 보관되므로, 사용자의 세션이 만료되거나 브라우저를 닫는 등 세션이 유지되지 않으면 FlashMap의 데이터도 소멸됩니다.

3.  **타임아웃과 메모리 관리**: 리다이렉트가 정상적으로 이루어지지 않는 등의 이유로 FlashMap이 소멸되지 않고 세션에 남아있는 경우를 대비해, FlashMap 데이터는 기본적으로 타임아웃(기본값 180초)이 설정되어 있어 자동으로 제거됩니다. 하지만 너무 많은 데이터를 FlashMap에 저장하는 것은 세션 메모리 사용량을 증가시키므로 주의해야 합니다.

4.  **데이터 보안**: FlashMap의 데이터는 URL에 노출되지는 않지만, 서버의 세션에 저장됩니다. 따라서 비밀번호나 개인 식별 정보와 같은 매우 민감한 정보는 저장하지 않는 것이 안전합니다.

5.  **대상 요청 매칭**: 기본적으로 FlashMap은 데이터를 저장한 요청과 동일한 요청 이름(Request Name)을 가진 다음 요청으로 전달됩니다. 만약 여러 Ajax 요청이 짧은 시간 내에 동일한 URL로 발생하면, 의도치 않은 요청이 FlashMap 데이터를 소모할 수 있으므로 복잡한 화면에서는 사용에 주의가 필요합니다.

## 7. 기본적인 컨텍스트 정보 접근

`Translet` 객체를 통해 현재 요청, 세션, 애플리케이션 스코프에 직접 접근해야 하는 경우, 다음과 같이 어댑터를 사용할 수 있습니다.

```java
public void someMethod(Translet translet) {
    // HttpServletRequest에 직접 접근해야 하는 경우
    RequestAdapter requestAdapter = translet.getRequestAdapter();
    String remoteAddr = requestAdapter.getRemoteAddr();

    // HttpSession에 직접 접근해야 하는 경우
    SessionAdapter sessionAdapter = translet.getSessionAdapter();
    sessionAdapter.setAttribute("user", user);
}
```
