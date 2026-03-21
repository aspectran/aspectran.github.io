---
title: Guide to Setting and Styling Shell Greetings in Aspectran
subheadline: Practical Guides
---

{% raw %}
Greeting messages in Aspectran Shell are a key element for communicating your application's identity and status. This guide covers how to compose greetings, use text styling, and leverage dynamic tokens for a rich terminal experience.

## 1. Components of Greeting Messages

Aspectran Shell greetings are combined from two primary sources:
1. **Static Banner and Help (Shell Greetings):** Configured in `aspectran-config.apon`. This typically includes fixed content like logos (ASCII Art) and usage instructions.
2. **Application Identity (Global Description):** The `<description>` element of the **first loaded** configuration file (e.g., `app-description.xml`). This is ideal for dynamic info like server URLs or the execution environment.

## 2. Text Styling (ANSI Markup)

Aspectran provides a powerful markup feature using the `{{style1,style2,...}}` syntax to apply styles to console text.

### Syntax
- **Basic:** `{{styleName}}Text{{reset}}`
- **Multiple:** `{{bold,red,bg:white}}Important Message{{reset}}`

### Key Style Keywords

| Category | Keywords | Description |
| :--- | :--- | :--- |
| **Attributes** | `bold`, `faint`, `italic`, `underline`, `blink`, `inverse` | Defines the shape and effect of the text. |
| **Standard Colors** | `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`, `gray` | Lowercase for standard colors; Uppercase (e.g., `RED`) for bright colors. |
| **256 Colors** | `{{208}}`, `{{fg:208}}`, `{{bg:208}}` | Use palette numbers (0-255) for foreground/background colors. |
| **RGB Colors** | `{{ff8800}}`, `{{bg:ffffff}}` | Use 6-digit hex codes for precise color control. |

### Resetting Styles
Use these keywords to revert terminal attributes after applying styles:
- `reset`: Resets **all** attributes (bold, foreground, background, etc.) to defaults.
- `fg:off`: Resets only the **foreground** color (retains bold, etc.).
- `bg:off`: Resets only the **background** color.

## 3. Dynamic Data Binding (AsEL Tokens)

Both `shell: { greetings: ... }` and `<description>` elements support Aspectran Expression Language (AsEL) tokens for dynamic content.

- **Version Info:** `#{class:com.aspectran.core.AboutMe^version}`
- **Execution Profile:** `#{currentEnvironment^currentProfiles}`
- **Bean Property:** `#{someBean^status}`

Internal token parsers evaluate these tokens in real-time when the shell starts or descriptions are rendered.

## 4. Text Formatting (TextStyleType)

The `style` attribute of the `<description>` element controls how text is formatted before rendering.

- **`style="apon"` (Recommended):** Supports APON multi-line text syntax. It strips the `|` character at the beginning of each line and handles indentation precisely.
- **`style="compact"`:** Trims leading/trailing whitespace from each line and compresses multiple blank lines into a single one.
- **`style="compressed"`:** Removes all newlines and trims each line, joining them into a single continuous line.

## 5. Configuration Example

### aspectran-config.apon (Banner & Help)
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

### app-description.xml (Global Identity)
```xml
<aspectran>
    <!-- The description in the FIRST loaded rule file becomes the Identity -->
    <description style="apon">
        |
        |{{CYAN}}Server Status:{{reset}}
        |   {{bg:green,white}} ACTIVE {{reset}} {{81}}http://localhost:8081/{{reset}}
        |
        |{{gray}}Current profiles:{{reset}} #{currentEnvironment^currentProfiles}
    </description>
</aspectran>
```

### Writing Tips
- **Visual Hierarchy:** Use bright colors (`CYAN`, `GREEN`) for essential info (URLs, Status) and `gray` for supplementary help text.
- **Load Order:** Place your dedicated description file at the **very top** of the `rules` list in `aspectran-config.apon`.
{% endraw %}
