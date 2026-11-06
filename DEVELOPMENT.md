# Linux Traffic Manager (LTM) - Development Guide

## Project Overview

Linux Traffic Manager (LTM) is an open-source, privacy-first network monitor for Linux desktops. It provides deep visibility into network activity, active socket connections, and process network attribution through a high-performance Rust core and an AMOLED-themed Tauri 2 desktop interface.

## Architecture

```text
linux-traffic-manager/
├── crates/
│   └── ltm-core/              # Pure Rust monitoring library (no GUI dependencies)
│       ├── src/
│       │   ├── network/       # procfs /proc/net/dev, speed calculation, sysfs
│       │   ├── processes/     # procfs /proc/net/tcp*, /proc/[pid]/fd socket mapping
│       │   ├── diagnostics/   # gateway discovery, DNS resolution, latency/loss probes
│       │   ├── storage/       # SQLite database, migrations, data retention
│       │   ├── monitoring/    # Tokio-based periodic sampling loop
│       │   └── permissions/   # Linux permission and capability inspection
│       └── tests/             # Comprehensive unit & integration tests
├── src-tauri/                 # Tauri 2 Desktop host & IPC commands
│   ├── src/
│   │   ├── commands/          # IPC handlers mapping frontend invokes to ltm-core
│   │   ├── main.rs            # Desktop window entry point
│   │   └── lib.rs             # Tauri builder & plugin registration
│   ├── Cargo.toml
│   └── tauri.conf.json
├── frontend/                  # React + TypeScript + Tailwind CSS UI
│   ├── src/
│   │   ├── components/        # Reusable AMOLED violet UI components
│   │   ├── pages/             # 6 primary views (Dashboard, Apps, Connections, etc.)
│   │   ├── hooks/             # Reactive state hooks
│   │   ├── services/          # Tauri IPC invoke & fallback client
│   │   └── types/             # TypeScript contract mirroring Rust Serde models
│   └── package.json
└── packaging/                 # RPM spec and desktop integration assets
```

## Architectural Decisions

1. **Decoupled Core (`ltm-core`)**:
   Keeping all system parsing, socket inode mapping, SQLite storage, and network calculations in a distinct crate guarantees that the business and monitoring logic can be built, verified, and tested on any Linux machine or CI runner without requiring GTK/WebKit dev headers.

2. **Accurate Process Attribution**:
   In Linux, socket inodes in `/proc/net/tcp` and `/proc/net/udp` link directly to file descriptors in `/proc/[pid]/fd/*`. We map these open sockets to their originating processes without fabricating byte counts. Per-process bandwidth is labeled connection-based or estimated unless kernel-level accounting (e.g. eBPF) is explicitly enabled.

3. **Counter Overflow & Reset Handling**:
   Network interface byte counters in `/proc/net/dev` can wrap around or reset when an interface toggles state (e.g. Wi-Fi reconnection or DHCP renewal). The `SpeedCalculator` tracks previous values and monotonically detects wraps/resets to prevent negative or spurious traffic spikes.

4. **Resource Footprint**:
   - Background monitoring ticks on a Tokio interval (1000ms by default).
   - In-memory ring buffer keeps the latest 60-300 points for immediate UI graph rendering without continuous disk hits.
   - Batch database commits write aggregated metrics every 10 seconds or on demand.
   - Automatic SQLite retention pruning cleans historical points older than the configured threshold.

## Testing Strategy

- **Unit tests:**
  - `network::speed`: verifies delta calculations, 32-bit wraps, counter resets.
  - `processes::sockets`: verifies parsing of hex IPv4/IPv6 addresses, port endianness, and state codes.
  - `storage::db`: verifies table creation, migrations, insert operations, and retention pruning.
  - `diagnostics`: verifies DNS queries and ping simulations.
- **Frontend checks:**
  - `pnpm tsc --noEmit` verifies strict TypeScript types.
  - `pnpm build` verifies asset compilation.
