---
title: Aspectran 쉘 그리팅(Greetings) 설정 및 스타일링 가이드
subheadline: 실용 가이드
---

{% raw %}
Aspectran Shell 애플리케이션을 실행할 때 사용자에게 보여지는 첫 메시지인 그리팅(Greetings)은 애플리케이션의 정체성을 전달하는 중요한 요소입니다. 이 가이드에서는 그리팅 메시지를 구성하는 방법과 텍스트 스타일링 도구, 그리고 동적 토큰을 활용하는 방법을 설명합니다.

## 1. 그리팅 메시지의 구성 요소

Aspectran Shell의 그리팅은 두 가지 소스에서 결합되어 출력됩니다.
1. **정적 배너 및 도움말 (Shell Greetings):** `aspectran-config.apon`에서 설정하며, 로고(ASCII Art)나 명령어 사용법 등 고정된 안내 문구를 포함합니다.
2. **애플리케이션 정체성 (Global Description):** 가장 먼저 로드되는 설정 파일(예: `app-description.xml`)의 `<description>` 요소입니다. 서버 접속 URL이나 현재 실행 환경 등 동적인 정보를 제공하는 데 적합합니다.

## 2. 텍스트 스타일링 (ANSI Markup)

Aspectran은 `{{style1,style2,...}}` 구문을 사용하여 콘솔 텍스트에 스타일을 적용할 수 있는 강력한 마크업 기능을 제공합니다.

### 스타일 지정 방법
- **기본 구문:** `{{스타일명}}텍스트{{reset}}`
- **다중 스타일:** `{{bold,red,bg:white}}중요 메시지{{reset}}`

### 주요 스타일 키워드

| 구분 | 키워드 | 설명 |
| :--- | :--- | :--- |
| **속성** | `bold`, `faint`, `italic`, `underline`, `blink`, `inverse` | 텍스트의 형태와 효과 정의 |
| **표준 색상** | `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`, `gray` | 소문자는 일반 색상, 대문자(예: `RED`)는 밝은 색상 적용 |
| **256 색상** | `{{208}}`, `{{fg:208}}`, `{{bg:208}}` | 0~255 사이의 파레트 번호를 사용하여 전경/배경색 지정 |
| **RGB 색상** | `{{ff8800}}`, `{{bg:ffffff}}` | 6자리 16진수(Hex) 코드를 사용하여 정교한 색상 지정 |

### 스타일 초기화 (Resetting)
스타일 적용 후 터미널 상태를 복구할 때는 다음 키워드를 구분하여 사용합니다.
- `reset`: 적용된 **모든** 속성(굵기, 전경색, 배경색 등)을 터미널 기본값으로 되돌립니다.
- `fg:off`: **전경색(글자색)**만 터미널 기본값으로 되돌립니다. (굵기 등은 유지)
- `bg:off`: **배경색**만 터미널 기본값으로 되돌립니다.

## 3. 동적 데이터 바인딩 (AsEL 토큰)

그리팅 메시지와 설명문 내에는 Aspectran Expression Language(AsEL) 토큰을 사용하여 동적인 정보를 출력할 수 있습니다.

- **버전 정보:** `#{class:com.aspectran.core.AboutMe^version}`
- **환경 정보:** `#{currentEnvironment^currentProfiles}`
- **Bean 참조:** `#{someBean^status}`

`shell: { greetings: ... }`와 `<description>` 태그 모두 내부적으로 토큰 파서가 동작하여 시스템의 실시간 상태를 그리팅에 포함할 수 있게 해줍니다.

## 4. 텍스트 형식 지정 (TextStyleType)

`<description>` 요소의 `style` 속성을 통해 텍스트의 형식을 제어할 수 있습니다.

- **`style="apon"` (권장):** APON 형식의 멀티라인 텍스트 문법을 지원합니다. 줄 시작의 `|` 문자를 제거하고 들여쓰기를 정교하게 맞출 때 사용합니다.
- **`style="compact"`:** 각 줄의 앞뒤 공백을 제거하고, 연속된 여러 빈 줄을 하나의 빈 줄로 압축합니다.
- **`style="compressed"`:** 모든 줄 바꿈을 제거하고 텍스트를 한 줄로 합쳐서 출력합니다.

## 5. 설정 예시

### aspectran-config.apon (배너 및 안내)
```apon
shell: {
    greetings: (
        |
        |{{WHITE  }}     ___                         __
        |{{CYAN   }}    /   |  _________  ___  _____/ /_____ _      __
        |{{GREEN  }}   / /| | / ___/ __ \/ _ \/ ___/ __/ __ \ | /| / /
        |{{YELLOW }}  / ___ |(__  ) /_/ /  __/ /__/ /_/ /_/ / |/ |/ /
        |{{RED    }} /_/  |_/____/ .___/\___/\___/\__/\____/|__/|__/    {{WHITE}}Enterprise Edition
        |{{gray   }}=========== /_/ ==========================================================
        |{{MAGENTA}}:: Built with Aspectran :: {{RED}}#{class:com.aspectran.core.AboutMe^version}{{reset}}
        |
        |{{gray}}To see a list of all built-in commands, type {{GREEN}}help{{reset}}.
    )
}
```

### app-description.xml (애플리케이션 설명)
```xml
<aspectran>
    <!-- 가장 먼저 로드되는 파일의 description이 Identity가 됨 -->
    <description style="apon">
        |
        |{{CYAN}}Server Status:{{reset}}
        |   {{bg:green,white}} ACTIVE {{reset}} {{81}}http://localhost:8081/{{reset}}
        |
        |{{gray}}Current profiles:{{reset}} #{currentEnvironment^currentProfiles}
    </description>
</aspectran>
```

### 작성 팁
- **가독성:** 중요한 정보(URL, 상태)는 밝은 색상(`CYAN`, `GREEN`)을 사용하고, 보조 안내 문구는 `gray`를 사용하면 가독성이 높아집니다.
- **배치 순서:** `context.rules` 목록의 **맨 처음**에 설명 전용 파일을 두어 애플리케이션의 Identity를 확정하세요.
{% endraw %}
