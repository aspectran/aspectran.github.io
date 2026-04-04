---
title: Aspectran Hint 메커니즘 가이드
subheadline: 핵심 가이드
---

Aspectran의 **힌트(Hint) 메커니즘**은 비즈니스 로직을 구현할 때, 해당 메서드의 실행 환경이나 처리에 필요한 부가적인 정보를 프레임워크나 다른 모듈에 전달하는 아주 유연하고 강력한 도구입니다.

이 가이드에서는 힌트의 개념부터 실무 예제까지 초보자도 이해하기 쉽게 상세히 설명합니다.

## 1. 힌트(Hint)란 무엇인가요?

비즈니스 메서드(Service, DAO 등)를 작성하다 보면, 로직 자체와는 별개로 **"이 메서드는 특별하게 처리해 줘"**라는 의도를 전달해야 할 때가 있습니다.

*   "이 데이터 조회 메서드는 성능을 위해 60초 동안 캐시를 적용해 줘."
*   "이 메서드는 보안이 중요하니 로그를 상세히 남겨 줘."
*   "이 응답은 일반 페이지가 아니라 팝업창 레이아웃으로 보여줘."

보통 이런 정보들은 별도의 설정 파일에 복잡하게 적어야 하지만, Aspectran에서는 메서드 바로 위에 **`@Hint` 어노테이션**이라는 "포스트잇(메모)"을 붙여서 아주 간단하게 처리할 수 있습니다.

## 2. 왜 힌트를 사용해야 하나요?

1.  **코드가 깔끔해집니다 (Loose Coupling)**: 서비스 코드가 특정 모듈(MyBatis, JPA, Redis 등)의 구체적인 설정 클래스를 직접 참조할 필요가 없습니다. 단지 "힌트"만 남기면, 해당 모듈이 그 힌트를 보고 알아서 동작합니다.
2.  **유연한 제어**: 자바 코드를 수정하여 다시 컴파일할 필요 없이, 어노테이션의 설정값만 바꿔서 실행 방식을 동적으로 변경할 수 있습니다.
3.  **의도의 명확화**: 메서드 위에 붙은 힌트를 통해 이 메서드가 어떤 의도로 설계되었고, 어떤 환경에서 실행되어야 하는지 동료 개발자가 한눈에 파악할 수 있습니다.

## 3. 기본 사용법

### 3.1 힌트 남기기 (Provider)

힌트는 `@Hint` 어노테이션을 사용하여 메서드에 선언합니다. 정보의 상세 내용은 Aspectran의 간결한 데이터 포맷인 **APON** 형식을 사용합니다.

```java
@Service
public class ProductService {

    // "cache"라는 카테고리의 힌트를 남깁니다.
    // 내용은 name이 'product_list'이고, 만료시간(expire)은 60초입니다.
    @Hint(type = "cache", value = "name: product_list, expire: 60")
    public List<Product> getProducts() {
        return productDao.getProducts();
    }
}
```

### 3.2 힌트 읽기 (Consumer)

남겨진 힌트는 `Translet` 또는 `Activity` 객체의 `peekHint()` 메서드를 통해 어디서든 꺼내볼 수 있습니다. 주로 **Aspect(AOP)**나 **프레임워크 확장 모듈**에서 이를 읽어서 처리합니다.

```java
@Component
@Aspect(id = "cacheApplyAspect")
@Joinpoint(
    pointcut = {
        "+: com.example.service.*Service.get*"
    }
)
public class CacheAspect {

    @Before
    public void applyCache(Translet translet) {
        // "cache" 타입의 힌트가 있는지 확인합니다.
        HintParameters hint = translet.peekHint("cache");

        if (hint != null) {
            String cacheName = hint.getString("name"); // "product_list"
            int expire = hint.getInt("expire");        // 60

            // 읽어온 힌트 정보를 바탕으로 캐시 로직을 적용합니다.
            System.out.println("캐시 적용: " + cacheName + ", 만료시간: " + expire + "초");
        }
    }
}
```

## 4. 여러 개의 힌트 사용하기

하나의 메서드에 여러 종류의 힌트를 동시에 남길 수도 있습니다. Aspectran은 동일한 어노테이션을 여러 번 쓰는 것을 허용합니다.

```java
@Service
public class UserService {

    @Hint(type = "logging", value = "level: verbose, target: 'file'")
    @Hint(type = "transaction", value = "readOnly: true, timeout: 10")
    public UserProfile getUserProfile(String userId) {
        return userDao.getUserById(userId);
    }
}
```

## 5. 힌트의 전파와 격리 (Advanced)

메서드가 다른 메서드를 호출할 때(Nested Calls), 상위 메서드에서 남긴 힌트가 하위 메서드에 어떻게 전달될지를 결정할 수 있습니다.

### 5.1 전파 (Propagation)
기본적으로 상위 메서드에서 남긴 힌트는 하위 메서드 호출 시에도 계속 유지됩니다. 이를 **전파(Propagation)**라고 합니다.

### 5.2 격리 (Isolation)
만약 상위 메서드의 특별한 설정이 하위 메서드까지 영향을 주는 것을 막고 싶다면 `propagated = false` 옵션을 사용합니다.

```java
@Service
public class OrderService {

    // 이 힌트는 하위 메서드로 전달되지 않도록 '격리'시킵니다.
    @Hint(type = "security", value = "encrypt: true", propagated = false)
    public void processOrder() {
        // 내부에서 다른 서비스를 호출하더라도 security 힌트는 보이지 않습니다.
        internalHelperService.doSomething();
    }
}
```

## 6. 실무 적용 예제: 페이지 레이아웃 제어

가장 흔히 쓰이는 사례 중 하나는 웹 페이지의 레이아웃을 결정하는 것입니다.

### 서비스 계층 (DashboardActivity.java)
일반 페이지와 팝업창 페이지를 구분하는 힌트를 남깁니다.

```java
@Component("/app")
public class DashboardActivity {

    @Request("/dashboard")
    public void fullPage() {
        // 기본 레이아웃 사용
    }

    @Request("/dashboard/popup")
    @Hint(type = "layout", value = "mode: popup") // 이 메서드는 팝업 모드임을 표시
    public void popupPage() {
        // 팝업용 데이터 처리...
    }
}
```

### 공통 처리 계층 (UserAuthAspect.java)
로그인 여부를 체크하는 Aspect에서 힌트를 보고 적절한 응답을 결정합니다.

```java
@Component
@Aspect(
    id = "userAuthAspect",
    order = 1
)
@Joinpoint(
    pointcut = {
        "+: /app/**",
        "-: /auth/**"
    }
)
public class UserAuthAspect {

    @Before
    public void checkLogin(Translet translet) {
        if (!isLoggedIn(translet)) {
            // "layout" 힌트를 확인합니다.
            HintParameters layoutHint = translet.peekHint("layout");

            if (layoutHint != null && "popup".equals(layoutHint.getString("mode"))) {
                // 팝업 모드일 때는 단순히 403 에러를 보냅니다.
                translet.transform(new FailureResponse().forbidden());
            } else {
                // 일반 페이지일 때는 로그인 페이지로 리다이렉트 시킵니다.
                translet.redirect("/login");
            }
        }
    }
}
```

## 7. 요약

*   **힌트(Hint)**: 메서드 실행 시 필요한 부가 정보를 전달하는 "메모"입니다.
*   **유형(Type)**: 메모의 종류를 구분합니다. (예: `cache`, `layout`, `auth`)
*   **값(Value)**: 메모의 상세 내용이며 **APON** 포맷을 사용합니다.
*   **전파 제어(Propagated)**: 부모의 메모리가 자식에게까지 전달될지(`true`) 말지(`false`) 결정합니다.
*   **프레임 격리**: Aspectran은 메서드 호출 단위로 프레임을 나누어 힌트를 안전하게 관리하므로 안심하고 사용할 수 있습니다.

Aspectran의 힌트 메커니즘을 사용하면 프레임워크와 비즈니스 로직 사이의 의사소통이 훨씬 유연해지며, 결과적으로 훨씬 유지보수하기 좋은 코드를 작성할 수 있습니다.
