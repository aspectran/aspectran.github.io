---
title: Aspectran Wildcard Matching Guide
subheadline: Core Guides
---

Aspectran provides its own wildcard engine to efficiently match paths, bean names, package structures, and more. While based on the widely known Ant-style matching, this engine has been significantly extended to provide the flexibility and precise control required by the framework.

## Key Features

- **Intuitive Ant-style Foundation**: Uses familiar tokens like `*`, `**`, and `?`.
- **Precise Control Tokens**: Includes the `+` token for matching exactly one character, allowing for more granular pattern definitions.
- **Weight-based Priority**: Features a built-in weighting system that automatically selects the most specific pattern when multiple patterns match.
- **Data Extraction (Masking)**: Allows extracting the actual strings matched by wildcards for use as variables.
- **Separator Flexibility**: Supports custom separators (e.g., `/` for paths, `.` for packages) or plain string matching.

## Wildcard Tokens

Aspectran supports four types of wildcard tokens.

| Token | Description | Remarks |
| :--- | :--- | :--- |
| `*` | Matches zero or more characters within a single segment. | Does not cross separators. |
| `**` | Matches zero or more characters across multiple segments. | Matches across separators. |
| `?` | Matches **zero or one** character within a segment. | Used for optional single-character matching. |
| `+` | Matches **exactly one** character within a segment. | Empty strings are not allowed. |

### Token Usage Examples

- `*`: `abc*` matches `abc`, `abcd`, `abcdef` but not `abc/def`.
- `**`: `/static/**` matches `/static/a.jpg`, `/static/js/main.js`, `/static/css/theme/dark.css`.
- `?`: `abc?` matches both `abc` and `abcd`.
- `+`: `abc+` matches `abcd` but not `abc`.

## Separator-Aware Matching

Aspectran logically divides strings into segments based on the separator specified during pattern compilation.

### Role of the Separator
1. Tokens like `*`, `?`, and `+` are only valid until the next separator.
2. The `**` token is the only wildcard that can match across separators.

### Flexible Structure Matching (Optional Segments)
Aspectran's wildcard engine supports flexible matching for intuitive configuration and convenience:

- **Optional Leading `**/`**: A pattern like `**/a` matches both `/a` and a top-level `a`.
- **Optional Trailing `/**`**: A pattern like `a/**` matches both `a/` and **`a` itself**.
- **Optional Middle `/**/`**: A pattern like `a/**/b` matches both `a/x/b` and `a/b`.

This flexibility allows you to represent both a resource and its sub-paths in a **single concise line**.

**Configuration Example:**
```xml
<entry name="jpetstore">
    +: /jpetstore/**
</entry>
```

### Safe Matching (Word Boundary Protection)
Despite its flexibility, the engine strictly respects segment boundaries defined by the separator. This prevents accidental matches with partial words.

- **Pattern**: `/jpetstore/**`
- **Successful Matches**: `/jpetstore`, `/jpetstore/`, `/jpetstore/list.do`
- **Failed Matches**: `/jpetstorehome`, `/jpetstore_old` (no separator after the word)

## Pattern Weight and Priority

When multiple patterns match a single input, Aspectran calculates a **Weight** for each and selects the one with the highest value. This allows the system to find the most appropriate handler without requiring explicit priority settings.

### Weighting Principles
1. **Literal Preference**: Patterns with more literal characters have higher weights.
2. **Specificity Preference**: `+` or `?` is more specific than `*`, and `*` is more specific than `**`.
3. **Length Preference**: For otherwise identical conditions, longer patterns have higher weights.

## Utility Classes (`com.aspectran.utils.wildcard`)

Aspectran provides four primary utility classes for using wildcard matching in Java code.

### 1. WildcardPattern
Compiles a wildcard string into an efficient internal representation. Instances are immutable and thread-safe.

```java
import com.aspectran.utils.wildcard.WildcardPattern;

// Compile without a separator (plain string matching)
WildcardPattern pattern1 = WildcardPattern.compile("abc*");

// Compile with a separator ('/') for path matching
WildcardPattern pattern2 = WildcardPattern.compile("/static/**", '/');

// Check the weight
float weight = pattern2.getWeight();
```

### 2. WildcardMatcher
Uses a compiled `WildcardPattern` to check for matches against input strings.

```java
import com.aspectran.utils.wildcard.WildcardMatcher;

WildcardPattern pattern = WildcardPattern.compile("/app/**/view.jsp", '/');

boolean isMatched = WildcardMatcher.match(pattern, "/app/user/profile/view.jsp"); // true
```

### 3. WildcardMasker
Extracts only the parts of an input string covered by wildcards (masking) or retains only the literal parts.

```java
import com.aspectran.utils.wildcard.WildcardMasker;

WildcardPattern pattern = WildcardPattern.compile("/WEB-INF/views/**/*.jsp", '/');
String input = "/WEB-INF/views/admin/userList.jsp";

// Extract only the wildcard parts
String masked = WildcardMasker.mask(pattern, input);
System.out.println(masked); // Output: admin/userList
```

### 4. WildcardPatterns and IncludeExcludeWildcardPatterns
Useful for handling multiple patterns or applying inclusion/exclusion rules simultaneously.

- **WildcardPatterns**: Checks if an input matches any of multiple patterns.
- **IncludeExcludeWildcardPatterns**: Evaluates the rule "included by include patterns but not excluded by exclude patterns."

```java
import com.aspectran.utils.wildcard.IncludeExcludeWildcardPatterns;

String[] includes = {"/api/**"};
String[] excludes = {"/api/admin/**", "/api/test/**"};

IncludeExcludeWildcardPatterns filter = IncludeExcludeWildcardPatterns.of(includes, excludes, '/');

filter.matches("/api/user/info"); // true
filter.matches("/api/admin/system"); // false (matches exclude pattern)
filter.matches("/home"); // false (does not match include pattern)
```

## Use Cases

### 1. Aspect Joinpoint Configuration
You can use `+:` (include) and `-:` (exclude) symbols to precisely define the scope of an Aspect.

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
This configuration applies the aspect to all requests (`/**`) but excludes the authentication expiry page (`/auth-expired`).

### 2. Package Scanning
Set the separator to `.` to find classes within specific packages.
- Pattern: `com.aspectran.core.**.Service*`
- Matches: `com.aspectran.core.service.MemberService`, `com.aspectran.core.component.ServiceBase`

### 3. File System Traversal
Recursively find files with specific extensions.
- Pattern: `C:/data/**/*.xml`
- Matches: `C:/data/config.xml`, `C:/data/backup/2024/settings.xml`

We hope this guide helps you understand and leverage Aspectran's powerful pattern matching engine.
