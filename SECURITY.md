# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Privacy-First Security Model

Linux Traffic Manager (LTM) adheres to strict privacy and local-only processing guidelines:
1. **Local-only execution:** All network metrics, sockets, and process states are parsed directly from Linux kernel interfaces (`/proc` and `/sys`) and stored exclusively in a local SQLite database (`~/.local/share/linux-traffic-manager/ltm.db`).
2. **No telemetry or external reporting:** LTM contains zero external trackers, analytics, cloud syncing, or diagnostic uploaders.
3. **Least privilege:** LTM is engineered to run as an unprivileged standard desktop user. It never requires running the desktop frontend as `root`.
4. **Traffic content safety:** LTM monitors packet metadata, socket status, and interface byte counters. It does not inspect, intercept, decrypt, or log packet payloads.

## Reporting a Vulnerability

If you discover a security vulnerability in Linux Traffic Manager, please do **NOT** open a public issue.

Instead, please send an advisory report to the maintainers via GitHub Private Vulnerability Reporting or via email.

Please include:
- A description of the vulnerability and its potential impact.
- Clear steps to reproduce the issue (PoC).
- Your operating system and desktop environment (e.g. Fedora 44, GNOME Wayland).

We appreciate your responsible disclosure and will respond within 48 hours.
