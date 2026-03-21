---
title: Aspectran Rule File Naming Convention
subheadline: Core Guides
---

Aspectran project configuration (rule) files are categorized and managed according to their roles and hierarchies. This establishes Aspectran's unique **rule-based** identity, moving away from Spring Framework's conventions (`*-context.xml`), and provides a clear distinction between the configuration **Skeleton** and its **Content**.

This convention applies to all rule files in both XML (`*.xml`) and APON (`*.apon`) formats.

## 1. Naming by Hierarchy

### A. Structural Entry Points (Skeleton): `*-rules.xml` or `*-rules.apon`
These files serve as the backbone of the configuration, composing other modules using the `<append>` element. They signify where the rules for a specific environment begin.

*   **`aspectran-rules.xml`**: The root rule entry point for the entire application (replaces the old `root-context.xml` or `app-context.xml`).
*   **`web-rules.xml`**: The entry point for Activity Context settings in a web environment (replaces the old `web-context.xml`).
*   **`shell-rules.xml`**, **`daemon-rules.xml`**: Dedicated rule entry points for each execution environment.

> **Note**: While rule files can be written in APON format (`*-rules.apon`), XML is often preferred for complex rule definitions due to its superior structural readability.

### B. Servlet Context Definitions: `*-context.xml`
These files define the **Servlet Context** at the web server level (e.g., Undertow, Jetty). Since this represents the web application environment as defined by the Jakarta Servlet standard—distinct from Aspectran's Activity Rules—the term `context` is retained to prevent conceptual confusion.

*   **`tow-context-root.xml`**: Configuration for the root servlet context in an Undertow server.
*   **`tow-context-appmon.xml`**: Configuration for a servlet context handling a specific path (e.g., `/appmon`).

### C. Functional and Domain Modules (Content): `.xml` or `.apon` (Concise Names)
These files contain the actual **content**, such as business logic (translet groups) or specific resource definitions (bean definitions). Since they are included as rules by the parent `*-rules.*` files, they use concise, meaning-oriented names without unnecessary suffixes.

*   **Translet Groups**: `home.xml`, `monitoring.xml`, `user-api.apon`
*   **Resource Definitions**: `i18n`, `server.xml`, `database.xml`

## 2. Configuration Hierarchy Example

The following diagram illustrates how configuration files are composed to manage complexity.

```text
aspectran-config.apon (System Configuration)
└── aspectran-rules.xml (Root Rules Entry Point)
    ├── server.xml (Server Resources)
    ├── database.xml (Resource Definitions)
    └── web-rules.xml (Web Environment Rules Entry Point)
        ├── home.xml (Home Translet Group)
        └── monitoring.xml (Monitoring Translet Group)
```

## 3. Benefits of the Convention

1.  **Readability**: Instantly identify whether a file is a configuration skeleton (`Rules`) or actual business logic (`Module`) just by its name.
2.  **Clarity**: Prevents conceptual confusion by naming 'Activity Rules' and 'Servlet Contexts' differently at the file level.
3.  **Consistency**: Ensures structural uniformity across the project regardless of whether the configuration format is XML or APON.
4.  **Non-Spring**: Distinguishes the project from Spring's naming conventions and maintains Aspectran's unique architectural style.
