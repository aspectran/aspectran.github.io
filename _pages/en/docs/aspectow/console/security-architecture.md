---
title: Aspectow Console Operational Security Architecture & Hardening Guide
subheadline: Aspectow Console
---

This document serves as the **Aspectow Console Operational Security Guide** for enterprise customers and operators deploying Aspectow WAS (Web Application Server) in enterprise or small-scale server environments.

It provides a systematic overview of architectural threat factors in Aspectow Console, dedicated management node group deployment architectures, IP control measures in single-node integrated environments, and **how to operate the built-in security mechanisms**.

## 1. Overview and Necessity of Security Management

Aspectow Console is a centralized web management console that monitors and controls individual Aspectran nodes (server instances) and clusters.

The console integrates core infrastructure control privileges that directly impact the entire system:

* Node lifecycle management (Start, Stop, Restart, Pause, Resume)
* Infrastructure remote command execution (RCE)
* Encrypted asset and master key management (System Vault / Encryption Configuration)
* User account and role-based access control (User Management & RBAC Permissions)
* Scheduler and batch job management (Scheduler Management)

Because these powerful control privileges are integrated into the console, any unrestricted exposure of the console web interface to the public internet or inadequate access control can put the entire infrastructure at risk. Therefore, customers must isolate the deployment architecture according to this guide and actively utilize the built-in security mechanisms.

## 2. Major Security Threats and Defense Strategies

### 2.1 Brute Force / Credential Stuffing
If the console access endpoint is exposed, administrator accounts can become targets of automated brute-force attacks.
* **Defense Strategy**: Enable the Account Lockout mechanism and enforce access control by using IP Whitelisting or allowing access to the console only through VPN/Private IP networks.

### 2.2 Remote Code Execution (RCE) & Control Hijacking
If an administrator session is hijacked or privileges are abused, arbitrary commands can be executed on the server, handing over full system control to an attacker.
* **Defense Strategy**: Instantly invalidate sessions upon IP address changes via Session IP Binding, and record all control commands and asset access histories in real time to the Security Audit Log.

### 2.3 Secondary Damage from Cryptographic Asset Leakage
The Vault and System Encryption areas store critical assets such as database credentials, external API keys, and encryption keys.
* **Defense Strategy**: Strictly restrict access permissions for encryption keys to the top administrator (`SUPER_ADMIN`), and apply password hash clearing and sensitive data masking when rendering UI screens.

## 3. Recommended Deployment Architecture & Environment Configuration Guide

### 3.1 Node Group Separation Architecture (Recommended for Enterprise Production)

In large-scale enterprise production environments, node groups serving business applications and the Aspectow Console management node group must be strictly separated at the network layer.

#### Business Service Node Group
* A set of instances dedicated exclusively to handling customer service transactions.
* Located in the public network zone (Public Subnet / DMZ) directly accessed by external users.
* The Aspectow Console Web UI module is removed or disabled from the deployment package to minimize the attack surface.

#### Dedicated Management Console Node Group
* Deploy **1 standalone, dedicated Aspectow Console node**.
* Assign a separate, isolated management IP (Private IP or internal VPN-dedicated IP).
* Placed within an internal management network (Internal Management VPC / Private Subnet), protected by firewall ACL rules allowing access only via internal VPN or a Bastion Host.
* Configured so that this dedicated console node performs integrated monitoring and control of individual business service nodes via cluster-internal communication (MQS/gRPC/Internal HTTP).

### 3.2 Single-Node Small-Scale Integrated Environment Guide

In small-scale enterprises or lightweight business services with limited server resources, environments exist where **business services and Aspectow Console run together on a single node (instance)**.

In such integrated environments, because console access paths may be exposed to external networks, the following **IP Whitelisting** serves as an essential primary defense line:

* **Console IP Whitelist Specification**: Enable IP filtering so that only internal corporate static IPs or administrator-dedicated IP ranges (e.g., `192.168.1.0/24`) can access the Console.
* **Firewall Port Separation Control**: Assign different ports for business services (e.g., 8080) and Console management (e.g., 9090), and apply inbound firewall (Security Group) IP restriction rules strictly to the management port.

### 3.3 Profile-based Single Project Deployment Strategy

Aspectow eliminates the need for separate console-only distribution packages. Instead, using a single starter project (`aspectow-enterprise`), administrators can control execution profiles (`console.ui`) to deploy dedicated console servers, headless worker nodes, or all-in-one integrated servers flexibly.

* **Dedicated Console Server Deployment**: Deploy the `aspectow-enterprise` artifact to a dedicated management server and enable the `console.ui` profile (e.g., `mariadb,console.ui`) to run the web management console.
* **Headless Worker Node Deployment**: Deploy the same artifact to business service nodes while omitting the `console.ui` profile (e.g., `mariadb`). Web UI endpoints are blocked with `404 Not Found`, minimizing attack surface and ensuring a safe and lightweight execution environment running only pure node and scheduler engines.

## 4. Console Built-in Core Security Mechanisms & Operating Guide

Aspectow Console comes equipped with core security mechanisms at the codebase level to ensure safe operation for customers.

### 4.1 User/Role-based IP Restriction
* **Fine-Grained Operator-Level IP Limits**: Aligned with web console characteristics where access is limited to a small team of dedicated system administrators, allowed IP patterns (`allowedIps`) can be specified for each individual user (`User`).
* **Wildcards & Multiple IP Patterns**: Supports exact single IPs (`192.168.1.50`, `10.0.0.100`), octet-level wildcards (`192.168.1.*`, `10.0.*.*`), and comma/space-separated multiple patterns. (If `null` or unconfigured, access is allowed without IP restrictions.)
* **Login-Time Denial & Audit Logging**: Validates client IP immediately upon successful password verification. If the IP does not match the allowed pattern, login is denied immediately, and a security audit log (`asc_audit_log`) is recorded in real time with the denial reason and remote attempt IP.
* **Session IP Binding Interlocking**: Once logged in, dual security is maintained via session IP binding. If the IP address changes during an active session (session hijacking attempt), the session is invalidated immediately.
* **User Management UI**: Operating teams can easily register and manage allowed IPs for each user account via the creation/edit modal in **Accounts > Users** on the web console.

### 4.2 Account Brute Force Protection & Account Lockout
* **Automatic Lockout Mechanism**: If 5 consecutive failed password attempts occur for the same account, the account is automatically set to **`LOCKED`** state, blocking all assigned privileges.
* **Operator Management**:
  * When an account is locked, a lock notice message is displayed on the login screen.
  * Administrators can unlock the account by changing its status back to `NORMAL` in **Accounts > Users**.

### 4.3 Session Security Hardening & Session Hijacking Protection
* **Session Fixation Protection**: Upon successful login, the existing session object is completely invalidated (`sessionAdapter.invalidate()`), and a new session ID is generated and bound to prevent session fixation attacks.
* **Session IP Binding**: Binds the client's initial login IP to the session. If an access attempt is made using a stolen session cookie from a different IP address, the session is instantly invalidated and blocked.
* **30-Minute Inactivity Timeout**: Sessions automatically expire after 30 minutes of inactivity, and logging out completely invalidates the server-side session immediately.

### 4.4 Security Audit Logging Operation
* **Multi-RDB Schema Support**: Provides pre-packaged DDL for the `asc_audit_log` table across H2, MySQL, Oracle, and PostgreSQL databases.
* **Real-time Event Tracking**: When high-risk actions are performed—such as creating/editing/deleting user accounts, altering role permissions, managing Vault assets, or viewing System Encryption passwords—the **executor ID, action type, target resource, details, and remote IP** are logged to the database in real time.
* **Audit Log Monitoring**: Administrators can inspect audit logs by user or keyword and monitor security compliance in real time via **Accounts > Audit Log**.

### 4.5 Declarative Security HTTP Response Headers & Profile-based Control (Web Security Headers & XSS)
* **Modularized Security Configuration (`web-security.xml`)**: Web security header configurations are separated from general web configurations (`web.xml`) into a dedicated configuration file (`web-security.xml`) for clean modularity.
* **Automatic Declarative Security Headers**: Applied automatically to all HTML view responses via the `htmlWebSecuritySettings` Aspect joinpoint condition (`headers: [ "Accept=text/html" ]`) in `web-security.xml`:
  * `Content-Type: text/html; charset=utf-8`: Prevents HTML source code from rendering as Plain Text when `nosniff` is enabled.
  * `Content-Security-Policy`: Blocks XSS attacks and specifies allowed external CDN/font domains.
  * `X-Frame-Options: SAMEORIGIN`: Prevents Clickjacking attacks.
  * `X-Content-Type-Options: nosniff`: Blocks execution of MIME-sniffing script modifications.
  * `X-XSS-Protection: 1; mode=block`: Enables legacy browser built-in XSS filters.
  * `Referrer-Policy: strict-origin-when-cross-origin`: Prevents leakage of sensitive URL paths.
* **Profile-based Security Header Deactivation (`no-web-security`)**:
  * For environments where reverse proxies (e.g., Nginx, Cloudflare) globally inject security headers or where the console needs to be embedded within an internal portal `<iframe>`, profile-based control is provided.
  * By activating the `console.no-web-security` profile (or `appmon.no-web-security` for Appmon), the built-in security header injection is cleanly omitted, preventing duplicate headers and policy conflicts.
* **XSS Sanitizer Utilities**: Protects against script execution in user-submitted tags and text data via `escapeHtml` and `cleanInput` methods in `ConsoleWebUtils`.

### 4.6 Sensitive Data Response Masking
* **Password Hash Clearing**: Clears (`null`s) the `password` hash field of `User` objects during user list queries at the server response stage, blocking DOM and JSON data exposure at the source.
* **Data Masking Utilities**: Protects sensitive information on UI screens using masking helpers for email (`maskEmail`), IP addresses (`maskIpAddress`), and secret keys (`maskSecret`) in `ConsoleWebUtils`.

### 4.7 Persistent Token-based Remember-Me Architecture (Token Rotation & Theft Detection)
While Aspectow Console supports persistent Remember-Me authentication allowing administrators to maintain login state across browser restarts, it incorporates an **enterprise-grade four-tier defense architecture** to safeguard sensitive infrastructure management privileges:

* **Environment-Based Opt-In Control (Disabled by Default)**:
  * In standard enterprise production environments, Remember-Me is completely disabled (**`false`**) by default for defense in depth.
  * It is activated declaratively only when the `demo` profile is active or explicitly enabled in `console-rules.xml` via `<property name="aspectow.console.auth.rememberMe.enabled" valueType="boolean">true</property>`.
  * When disabled, the "Stay signed in" checkbox is not rendered on the login view, and server-side persistent token issuance is blocked at the source.
* **Series & Token Rotation Mechanism**:
  * Overcoming the vulnerabilities of naive static cookie hashing, Aspectow Console utilizes a dual-key (`series`, `token`) persistence model backed by the `asc_persistent_login` table.
  * `series`: A persistent unique UUID (Primary Key) identifying a specific browser or device instance.
  * `token`: A single-use cryptographic token refreshed upon every successful auto-login.
  * Each time a client authenticates via a valid Remember-Me cookie, **the server immediately rotates the token, updates the database, and issues a freshly minted cookie**.
* **Theft Detection & Global Invalidation**:
  * If an attacker steals an administrator's cookie, the moment the legitimate administrator logs in, the token is rotated and the stolen token becomes stale.
  * When the attacker subsequently attempts access with the stale cookie, the server matches the `series` but discovers a `token` mismatch, immediately triggering a **Token Theft Detected** alert.
  * In response, the server **purges all persistent login records for that user across the entire database** and logs a critical security audit event (`REMEMBER_ME_THEFT_DETECTED`) to `asc_audit_log`, preventing further unauthorized access.
* **Multi-Factor Environment Context Binding (IP & User-Agent Verification)**:
  * The client's remote IP address and browser `User-Agent` are persisted alongside the token upon issuance.
  * During auto-login verification, if the requesting IP address or `User-Agent` differs from the persisted values, auto-login is denied immediately, audit events (`REMEMBER_ME_IP_MISMATCH`, `REMEMBER_ME_DEVICE_MISMATCH`) are recorded, and the cookie is purged.
  * Configured user `allowedIps` restrictions are also enforced strictly.
* **PBE Encrypted Cookies & HTTP Transport Hardening**:
  * The cookie payload (`series:token`) is never transmitted or stored in plaintext; it is strongly encrypted using Aspectran's password-based encryption utility (`PBEncryptionUtils.encrypt`).
  * Cookies enforce `HttpOnly: true`, `SameSite: Lax`, and `Path: /` attributes to prevent XSS script access and mitigate cross-site request forgery (CSRF).
* **Complete Revocation on Explicit Logout**:
  * When an administrator clicks [Logout], the server invalidates the active HTTP session, permanently deletes the corresponding `series` record from the database, and expires the browser cookie immediately (`Max-Age=0`).

## 5. Customer Operational Security Checklist

When deploying Aspectow Console in production environments, customer security administrators must verify the following items:

1. **Apply IP Whitelisting in Single-Node Deployments**: For small-scale integrated environments, verify that the console access IP Whitelist and inbound firewall rules are properly applied.
2. **Network Isolation Inspection**: For enterprise environments, ensure that the Console web binding port is not exposed to public interfaces (`0.0.0.0`) and is bound exclusively to internal VPN or Private IPs.
3. **SUPER_ADMIN Account Hygiene**: Restrict access permissions for master keys and encryption configurations to `SUPER_ADMIN` only, and change administrator passwords periodically.
4. **Regular Audit Log Database Backups**: Periodically back up data in the `asc_audit_log` table and block unauthorized modifications to audit logs.
5. **External CDN & Domain Policy Verification**: When new static libraries are required, place them in the local static resource directory (`/assets/`), or inspect allowed domains in `web-security.xml`'s `Content-Security-Policy` when using external CDNs.
6. **Reverse Proxy Integration & Header Deduplication**: If an upstream reverse proxy (e.g., Nginx, HAProxy) globally manages security headers, activate the `console.no-web-security` profile or configure `proxy_hide_header` in the proxy to prevent duplicate response headers.
7. **Remember-Me Operational Policy Verification**: In production environments with sensitive server control privileges, verify that `aspectow.console.auth.rememberMe.enabled` is `false` (or unconfigured) to prevent the issuance of unnecessary long-lived authentication tokens.
