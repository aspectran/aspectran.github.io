---
title: Aspectran 와일드카드 패턴 매칭 가이드
subheadline: 핵심 가이드
---

Aspectran은 경로, 빈 이름, 패키지 구조 등을 효율적으로 매칭하기 위해 자체적인 와일드카드 엔진을 제공합니다. 이 엔진은 널리 알려진 Ant-style 매칭을 기반으로 하되, 프레임워크의 유연성과 정밀한 제어를 위해 기능을 대폭 확장했습니다.

## 주요 특징

- **Ant-style 기반의 직관성**: `*`, `**`, `?` 등 친숙한 토큰을 사용합니다.
- **정밀한 제어 토큰 추가**: 정확히 한 글자만 매칭하는 `+` 토큰을 추가하여 정교한 패턴 정의가 가능합니다.
- **가중치 기반 우선순위**: 여러 패턴이 매칭될 때 가장 구체적인 패턴을 자동으로 선택하는 가중치 시스템을 내장하고 있습니다.
- **데이터 추출(Masking)**: 매칭된 부분의 실제 문자열을 추출하여 변수처럼 활용할 수 있습니다.
- **구분자 유연성**: 경로(`/`), 패키지(`.`) 등 상황에 맞는 구분자를 자유롭게 지정할 수 있습니다.

## 와일드카드 토큰

Aspectran은 총 4가지의 와일드카드 토큰을 지원합니다.

| 토큰 | 설명 | 비고 |
| :--- | :--- | :--- |
| `*` | 세그먼트 내에서 0개 이상의 문자와 매칭됩니다. | 구분자(Separator)를 넘지 못합니다. |
| `**` | 여러 세그먼트를 가로질러 0개 이상의 문자와 매칭됩니다. | 구분자를 포함하여 매칭됩니다. |
| `?` | 세그먼트 내에서 **0개 또는 1개**의 문자와 매칭됩니다. | 선택적인 한 글자 매칭에 사용됩니다. |
| `+` | 세그먼트 내에서 **정확히 1개**의 문자와 매칭됩니다. | 빈 문자열은 허용되지 않습니다. |

### 토큰 활용 예시

- `*`: `abc*`는 `abc`, `abcd`, `abcdef`와 매칭되지만 `abc/def`와는 매칭되지 않습니다.
- `**`: `/static/**`는 `/static/a.jpg`, `/static/js/main.js`, `/static/css/theme/dark.css` 모두와 매칭됩니다.
- `?`: `abc?`는 `abc`와 `abcd` 모두와 매칭됩니다.
- `+`: `abc+`는 `abcd`와는 매칭되지만 `abc`와는 매칭되지 않습니다.

## 구분자(Separator) 인식 매칭

Aspectran은 패턴 컴파일 시 지정된 구분자를 기준으로 세그먼트를 논리적으로 분리합니다.

### 구분자의 역할
1. `*`, `?`, `+` 토큰은 지정된 구분자를 만날 때까지만 유효합니다.
2. `**` 토큰은 구분자를 포함하여 매칭할 수 있는 유일한 와일드카드입니다.

### 유연한 구조 매칭 (선택적 세그먼트)
Aspectran의 와일드카드 엔진은 구조적 직관성과 설정의 편의성을 위해 다음과 같은 유연한 매칭을 지원합니다.

- **선행 `**/` 무시**: `**/a` 패턴은 `/a`뿐만 아니라 최상위의 `a`와도 매칭됩니다.
- **후행 `/**` 무시**: `a/**` 패턴은 `a/`뿐만 아니라 **`a` 자체와도 매칭**됩니다.
- **중간 `/**/` 무시**: `a/**/b` 패턴은 `a/x/b`뿐만 아니라 `a/b`와도 매칭됩니다.

이러한 특성 덕분에 리소스 자체와 하위 경로를 모두 포함해야 하는 경우에도 다음과 같이 **한 줄로 간결하게 표현**할 수 있습니다.

**설정 예시:**
```xml
<entry name="jpetstore">
    +: /jpetstore/**
</entry>
```

### 안전한 매칭 (단어 경계 보호)
유연한 매칭을 지원하면서도, 구분자(Separator)를 기준으로 한 세그먼트 경계는 엄격하게 보호됩니다. 따라서 **단어의 일부분만 매칭되어 발생하는 오작동은 원천적으로 차단**됩니다.

- **패턴**: `/jpetstore/**`
- **매칭 성공**: `/jpetstore`, `/jpetstore/`, `/jpetstore/list.do`
- **매칭 실패**: `/jpetstorehome`, `/jpetstore_old` (단어 뒤에 구분자가 없으므로 매칭되지 않음)

## 패턴 가중치와 우선순위

여러 패턴이 하나의 입력과 매칭될 경우, Aspectran은 각 패턴의 **가중치(Weight)**를 계산하여 가장 높은 값을 가진 패턴을 선택합니다. 이는 사용자가 별도의 우선순위를 지정하지 않아도 시스템이 가장 적절한 핸들러를 찾을 수 있게 해줍니다.

### 가중치 계산 원칙
1. **리터럴 우선**: 와일드카드보다 실제 문자가 많이 포함된 패턴이 가중치가 높습니다.
2. **구체성 우선**: `*` 보다는 `+`나 `?`가, `**` 보다는 `*`가 더 구체적인 것으로 간주되어 가중치가 높습니다.
3. **길이 우선**: 동일한 조건이라면 패턴의 전체 길이가 긴 것이 더 높은 가중치를 가집니다.

## 유틸리티 클래스 사용법 (`com.aspectran.utils.wildcard`)

Aspectran은 Java 코드에서 와일드카드 매칭을 쉽게 사용할 수 있도록 네 가지 주요 클래스를 제공합니다.

### 1. WildcardPattern
와일드카드 문자열을 효율적으로 매칭할 수 있는 내부 형태로 컴파일합니다. 불변 객체이며 스레드 안전합니다.

```java
import com.aspectran.utils.wildcard.WildcardPattern;

// 구분자 없이 컴파일 (일반 문자열 매칭)
WildcardPattern pattern1 = WildcardPattern.compile("abc*");

// 구분자(/)를 지정하여 컴파일 (경로 매칭)
WildcardPattern pattern2 = WildcardPattern.compile("/static/**", '/');

// 가중치 확인
float weight = pattern2.getWeight();
```

### 2. WildcardMatcher
컴파일된 `WildcardPattern`을 사용하여 실제 문자열과 매칭 여부를 확인합니다.

```java
import com.aspectran.utils.wildcard.WildcardMatcher;

WildcardPattern pattern = WildcardPattern.compile("/app/**/view.jsp", '/');

boolean isMatched = WildcardMatcher.match(pattern, "/app/user/profile/view.jsp"); // true
```

### 3. WildcardMasker
매칭된 문자열에서 와일드카드 부분(와일드카드가 "덮어씌운" 부분)만 추출하거나, 리터럴 부분만 남기는 마스킹 기능을 수행합니다.

```java
import com.aspectran.utils.wildcard.WildcardMasker;

WildcardPattern pattern = WildcardPattern.compile("/WEB-INF/views/**/*.jsp", '/');
String input = "/WEB-INF/views/admin/userList.jsp";

// 와일드카드 부분만 추출
String masked = WildcardMasker.mask(pattern, input);
System.out.println(masked); // 출력: admin/userList
```

### 4. WildcardPatterns와 IncludeExcludeWildcardPatterns
여러 개의 패턴을 동시에 다루거나, 포함/제외 규칙을 한꺼번에 적용할 때 유용합니다.

- **WildcardPatterns**: 여러 패턴 중 하나라도 매칭되는지 확인합니다.
- **IncludeExcludeWildcardPatterns**: "포함 패턴에 해당하되, 제외 패턴에는 해당하지 않음"이라는 규칙을 평가합니다.

```java
import com.aspectran.utils.wildcard.IncludeExcludeWildcardPatterns;

String[] includes = {"/api/**"};
String[] excludes = {"/api/admin/**", "/api/test/**"};

IncludeExcludeWildcardPatterns filter = IncludeExcludeWildcardPatterns.of(includes, excludes, '/');

filter.matches("/api/user/info"); // true
filter.matches("/api/admin/system"); // false (제외 패턴에 해당)
filter.matches("/home"); // false (포함 패턴에 해당하지 않음)
```

## 활용 사례

### 1. Aspect 조인포인트(Joinpoint) 설정
특정 범위의 트랜슬릿에 공통 로직(예: 권한 체크)을 적용할 때 `+:`(포함)와 `-:`(제외) 기호를 사용하여 정교한 범위를 지정할 수 있습니다.

```xml
<aspect id="authCheckAspect" bean="authCheckAspect">
    <joinpoint>
        pointcut: {
            +: /**
            -: /auth-expired
        }
    </joinpoint>
</aspect>
```
위 설정은 모든 요청(`/**`)에 대해 어스펙트를 적용하되, 인증 만료 안내 페이지(`/auth-expired`)는 보안 검사에서 제외하도록 지정합니다. 이때 `/**` 패턴은 `/` 경로 자체도 포함하므로 매우 간결한 설정이 가능합니다.

### 2. 패키지 스캐닝
구분자를 `.`으로 설정하여 특정 패키지 하위의 클래스들을 찾는 데 사용합니다.
- 패턴: `com.aspectran.core.**.Service*`
- 매칭: `com.aspectran.core.service.MemberService`, `com.aspectran.core.component.ServiceBase`

### 3. 파일 시스템 탐색
특정 확장자를 가진 파일들을 재귀적으로 찾을 때 사용합니다.
- 패턴: `C:/data/**/*.xml`
- 매칭: `C:/data/config.xml`, `C:/data/backup/2024/settings.xml`

이 가이드가 Aspectran의 강력한 패턴 매칭 엔진을 이해하고 활용하는 데 도움이 되기를 바랍니다.
