# Changelog

All notable changes to **Linux Traffic Manager (LTM)** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-11-06

### Added
- **Core Architecture (`ltm-core`)**:
  - Linux procfs `/proc/net/dev` and `/sys/class/net` parser for network interfaces.
  - Robust bandwidth speed calculation with interval normalization, counter wrap-around detection, and reset handling.
  - Socket discovery supporting IPv4 and IPv6 from `/proc/net/tcp`, `/proc/net/tcp6`, `/proc/net/udp`, and `/proc/net/udp6`.
  - Process attribution engine mapping open socket inodes to process PIDs via `/proc/[pid]/fd`.
  - Network diagnostics engine supporting gateway discovery (`/proc/net/route`), DNS resolution timing, and multi-target TCP/ICMP ping latency with packet loss computation.
  - SQLite persistence layer for network metrics, speed history, and diagnostic events with automatic migration and retention management.
- **Frontend Presentation Layer (`frontend`)**:
  - AMOLED dark mode design system (`#090811` background, `#12101C` surface, `#A78BFA` primary violet accent).
  - Navigation sidebar across 6 modules: Dashboard, Applications, Connections, Diagnostics, History, Settings.
  - Real-time download/upload SVG/Recharts line graph with 1-second cadence.
  - Detailed connection table with search, sorting, protocol filtering, and process attribution badges.
  - Applications overview displaying associated socket counts and connection stats.
  - Diagnostic suite with latency measurements, DNS resolution, and gateway status.
  - History viewer with selectable time windows and database retention options.
- **Packaging & CI/CD**:
  - GitHub Actions CI matrix with Cargo formatting, Clippy, Rust unit tests, TypeScript typechecking, and frontend build.
  - GitHub Actions Release workflow targeting Fedora RPM and Linux tarballs.
  - Desktop integration files: `.desktop` entry, SVG application icon, and RPM spec.
