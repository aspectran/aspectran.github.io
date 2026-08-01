---
title: Aspectow Console Operational Security Architecture & Hardening Guide
teaser: A comprehensive security guide for operating Aspectow Console safely in enterprise and small-scale server environments, covering management node deployment architecture, IP restrictions, built-in security mechanisms, and operational checklists.
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

### 3.3 Standalone Package Deployment Strategy
To clearly separate business applications from management consoles, customers can build dedicated management servers independently using standalone deployment packages (Distribution ZIP, Executable JAR, Docker Image, etc.).


## 4. Console Built-in Core Security Mechanisms & Operating Guide

Aspectow Console comes equipped with core security mechanisms at the codebase level to ensure safe operation for customers.

### 4.1 User/Role-based IP Restriction
* **Fine-Grained Operator-Level IP Limits**: Aligned with web console characteristics where access is limited to a small team of dedicated system administrators, allowed IP patterns (`allowedIps`) can be specified for each individual user (`User`).
* **Wildcards & Multiple IP Patterns**: Supports exact single IPs (`192.168.1.50`, `10.0.0.100`), octet-level wildcards (`192.168.1.*`, `10.0.*.*`), and comma/space-separated multiple patterns. (If `null` or unconfigured, access is allowed without IP restrictions.)
* **Login-Time Denial & Audit Logging**: Validates client IP immediately upon successful password verification. If the IP does not match the allowed pattern, login is denied immediately, and a security audit log (`asc_audit_log`) is recorded in real time with the reason **[LOGIN_FAILED_UNALLOWED_IP]** and the remote attempt IP.
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

### 4.5 Declarative Security HTTP Response Headers & XSS Protection
* **Declarative Security Headers**: Applied automatically to all HTML view responses via the `htmlWebSecuritySettings` Aspect joinpoint condition (`headers: [ "Accept=text/html" ]`) in `web.xml`:
  * `Content-Type: text/html; charset=utf-8`: Prevents HTML source code from rendering as Plain Text when `nosniff` is enabled.
  * `Content-Security-Policy`: Blocks XSS attacks and specifies allowed CDN/font domains.
  * `X-Frame-Options: SAMEORIGIN`: Prevents Clickjacking attacks.
  * `X-Content-Type-Options: nosniff`: Blocks execution of MIME-sniffing script modifications.
  * `X-XSS-Protection: 1; mode=block`: Enables legacy browser built-in XSS filters.
  * `Referrer-Policy: strict-origin-when-cross-origin`: Prevents leakage of sensitive URL paths.
* **XSS Sanitizer Utilities**: Protects against script execution in user-submitted tags and text data via `escapeHtml` and `cleanInput` methods in `ConsoleWebUtils`.

### 4.6 Sensitive Data Response Masking
* **Password Hash Clearing**: Clears (`null`s) the `password` hash field of `User` objects during user list queries at the server response stage, blocking DOM and JSON data exposure at the source.
* **Data Masking Utilities**: Protects sensitive information on UI screens using masking helpers for email (`maskEmail`), IP addresses (`maskIpAddress`), and secret keys (`maskSecret`) in `ConsoleWebUtils`.


## 5. Customer Operational Security Checklist

When deploying Aspectow Console in production environments, customer security administrators must verify the following items:

1. **Apply IP Whitelisting in Single-Node Deployments**: For small-scale integrated environments, verify that the console access IP Whitelist and inbound firewall rules are properly applied.
2. **Network Isolation Inspection**: For enterprise environments, ensure that the Console web binding port is not exposed to public interfaces (`0.0.0.0`) and is bound exclusively to internal VPN or Private IPs.
3. **SUPER_ADMIN Account Hygiene**: Restrict access permissions for master keys and encryption configurations to `SUPER_ADMIN` only, and change administrator passwords periodically.
4. **Regular Audit Log Database Backups**: Periodically back up data in the `asc_audit_log` table and block unauthorized modifications to audit logs.
5. **External CDN & Domain Policy Verification**: When new static libraries are required, place them in the local static resource directory (`/assets/`), or inspect allowed domains in `web.xml`'s `Content-Security-Policy` when using external CDNs.
