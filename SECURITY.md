# Security Policy

## Supported versions

Only the latest `main` branch is supported with security fixes. There are no long-term release trains yet.

| Branch | Supported |
|--------|-----------|
| `main` | ✅ |
| Older commits / forks | ❌ (please rebase onto `main`) |

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Prefer one of:

1. **GitHub Private Vulnerability Reporting** (if enabled on this repository):  
   Repository → **Security** → **Report a vulnerability**
2. Open a **draft security advisory** on GitHub so maintainers can coordinate a fix privately.

Include:

- Description of the issue and impact
- Steps to reproduce or a proof of concept
- Affected paths/components if known (e.g. auth, API ownership, push subscription handling)
- Whether you believe the issue is already exploited

We aim to acknowledge reports within **7 days** and to share a remediation plan or status update as soon as practical. Timelines depend on severity and maintainer availability (this is a small open-source project).

## Scope notes

This app is typically **self-hosted** by a single tutor. Hardening priorities include:

- Authentication and session handling
- Authorization / ownership of students and bills
- Soft-delete data integrity
- Exposure of secrets or admin surfaces in Docker defaults

Out of scope for “product security” reports (unless they cause real harm): pure UX bugs, feature requests, and theoretical issues with no realistic exploit path on a correctly configured single-user deployment.

## Responsible disclosure

Please give maintainers a reasonable window to fix and release before public disclosure. We appreciate coordinated disclosure and will credit reporters who want acknowledgment (unless you prefer to stay private).
