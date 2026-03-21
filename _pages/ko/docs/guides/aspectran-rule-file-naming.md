---
title: Aspectran 규칙 파일 명명 규칙 (Rule File Naming Convention)
subheadline: 핵심 가이드
---

Aspectran 프로젝트의 설정(규칙) 파일은 그 역할과 계층에 따라 명확하게 구분하여 관리합니다. 이는 Spring Framework의 관습(`*-context.xml`)에서 벗어나 Aspectran만의 **규칙 기반(Rule-based)** 정체성을 확립하고, 설정의 **뼈대(Skeleton)**와 **내용(Content)**을 직관적으로 구분하기 위함입니다.

본 규칙은 XML(`*.xml`)과 APON(`*.apon`) 형식의 모든 규칙 파일에 동일하게 적용됩니다.

## 1. 계층별 명명 규칙

### 가. 구조적 진입점 (Skeleton): `*-rules.xml` 또는 `*-rules.apon`
애플리케이션의 설정 뼈대를 잡고 다른 모듈들을 조합(`append`)하는 **환경 설정 파일**에 사용합니다. "여기서부터 규칙(Rules)이 정의되기 시작한다"는 의미를 담고 있습니다.

*   **`aspectran-rules.xml`**: 애플리케이션 전체의 루트 규칙 진입점 (기존 `aspectran-rules.xml` 대체)
*   **`web-rules.xml`**: 웹 환경을 위한 활동 컨텍스트(Activity Context) 설정 진입점 (기존 `web-context.xml` 대체)
*   **`shell-rules.xml`**, **`daemon-rules.xml`**: 각 실행 환경별 전용 규칙 진입점

> **참고**: 규칙 파일은 APON 형식(`*-rules.apon`)으로도 작성이 가능합니다. 다만, 복잡한 규칙 정의 시에는 XML의 구조적 가독성이 더 뛰어날 수 있으므로 프로젝트의 성격에 맞게 선택합니다.

### 나. 서블릿 컨텍스트 정의 (Servlet Context): `*-context.xml`
웹 서버(Undertow, Jetty 등) 수준의 **서블릿 컨텍스트(Servlet Context)**를 정의하는 파일에 사용합니다. 이는 Aspectran의 활동 규칙(Activity Rules)과는 다른, 웹 서버 수준의 웹 애플리케이션 환경 정의를 의미하므로 명확히 구분하기 위해 `context` 단어를 유지합니다.

*   **`tow-context-root.xml`**: Undertow 서버의 루트 서블릿 컨텍스트 설정
*   **`tow-context-appmon.xml`**: 특정 경로를 담당하는 서블릿 컨텍스트 설정

### 다. 기능 및 도메인 모듈 (Content): `.xml` 또는 `.apon` (간결한 이름)
실제 비즈니스 로직(트랜스렛 그룹)이나 특정 자원(빈 정의)을 담고 있는 **내용물** 성격의 파일에 사용합니다. 이미 상위의 `*-rules.*` 파일에서 규칙으로 포함되므로 불필요한 접미사 없이 의미 중심의 간결한 이름을 사용합니다.

*   **트랜스렛 그룹**: `home.xml`, `monitoring.xml`, `user-api.apon`
*   **자원 정의**: `i18n.xml`, `server.xml`, `database.xml`

## 2. 설정 파일 계층 구조 예시

설정 파일 간의 참조는 다음과 같은 흐름으로 구성하여 복잡도를 관리합니다.

```text
aspectran-config.apon (시스템 설정)
└── aspectran-rules.xml (루트 규칙 진입점)
    ├── server.xml (서버 리소스)
    ├── database.xml (자원 정의)
    └── web-rules.xml (웹 환경 규칙 진입점)
        ├── home.xml (홈 트랜스렛 그룹)
        └── monitoring.xml (모니터링 트랜스렛 그룹)
```

## 3. 규칙 적용의 이점

1.  **가독성**: 파일 이름만 보고도 설정의 뼈대(Rules)인지 실제 비즈니스 로직(Module)인지 즉시 파악할 수 있습니다.
2.  **명확성**: Aspectran의 '활동 규칙'과 웹 서버의 '서블릿 컨텍스트'를 이름 수준에서 분리하여 개념적 혼동을 방지합니다.
3.  **일관성**: 설정 형식이 XML이든 APON이든 관계없이 동일한 명명 규칙을 적용하여 프로젝트의 구조적 통일성을 유지합니다.
4.  **탈-스프링(Non-Spring)**: 스프링의 명명 관습을 탈피하여 Aspectran만의 고유한 아키텍처 스타일을 프로젝트 전반에 확립합니다.
