# Linux Traffic Manager (LTM)

<div align="center">

```
   __   _____ __  ___
  / /  /__   //  |/  /
 / /     / / / /|_/ / 
/ /___  / / / /  / /  
\____/ /_/ /_/  /_/   
```

**Understand your network.**

*A modern, lightweight and privacy-focused network traffic monitor for Linux, built with Rust and Tauri 2.*

[![CI](https://github.com/linux-traffic-manager/linux-traffic-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/linux-traffic-manager/linux-traffic-manager/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![Fedora](https://img.shields.io/badge/Fedora-40%20%7C%2041%20%7C%2042%20%7C%2044-blue.svg)](https://fedoraproject.org/)
[![Rust](https://img.shields.io/badge/Rust-1.80%2B-orange.svg)](https://www.rust-lang.org/)

</div>

---

## 🌟 Highlights

- **⚡ Performance First:** Asynchronous polling powered by Tokio. Minimal idle CPU overhead (<1%), bounded memory buffers, and zero unnecessary disk thrashing.
- **🛡️ Privacy First:** Local-only processing. No cloud connections, no user accounts, no telemetry, and no tracking. Your socket metadata never leaves your machine.
- **🎨 Beautiful by Design:** AMOLED-inspired dark UI (`#090811`) with vibrant purple and violet accents, smooth transitions, and high-readability responsive dashboards.
- **🔍 Real System Metrics:** Direct Linux `/proc` and `/sys` integration. We never fabricate data or mislead users with speculative per-process byte attribution.
- **📊 6 Comprehensive Sections:**
  1. **Dashboard:** Real-time download/upload graph, active interface status, and live traffic counters.
  2. **Applications:** Processes actively utilizing sockets with associated connection counts.
  3. **Connections:** Filterable and searchable table of TCP/UDP IPv4 & IPv6 connections with state indicators.
  4. **Diagnostics:** Automated DNS resolution, gateway reachability, latency, and packet loss tests.
  5. **History:** Historical traffic analytics backed by local SQLite storage with configurable retention.
  6. **Settings:** Configurable polling frequencies, interface selection, and data management.

---

## 🎨 Design System

| Element | Hex Color | Description |
|---|---|---|
| Background | `#090811` | Deep AMOLED dark tone |
| Surface | `#12101C` | Card and panel container |
| Surface Secondary | `#1A1728` | Hover states and active selections |
| Border | `#29243A` | Subtle division borders |
| Primary Accent | `#A78BFA` | Soft violet highlights |
| Primary Hover | `#8B5CF6` | Vibrant purple interactive state |
| Secondary Accent | `#EC4899` | Subtle pink highlights |
| Success / Warning / Error | `#34D399` / `#FBBF24` / `#F87171` | Crisp semantic status indicators |

---

## 🏛️ Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                      LTM Frontend (React 19 + Vite)         │
│  - Tailwind CSS AMOLED theme                                │
│  - Recharts real-time download/upload visualization        │
│  - Typed IPC client (@tauri-apps/api)                       │
└──────────────────────────────▲──────────────────────────────┘
                               │ Tauri 2 IPC
┌──────────────────────────────▼──────────────────────────────┐
│                    src-tauri (Rust Desktop Host)            │
│  - Native window management (Wayland / X11)                 │
│  - Tauri command handlers                                   │
└──────────────────────────────▲──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                  ltm-core (Modular Rust Engine)             │
│  ├── network/      -> /proc/net/dev, speed delta calculation│
│  ├── processes/    -> /proc/net/tcp*, /proc/[pid]/fd maps   │
│  ├── diagnostics/  -> Gateway discovery, DNS & ping tests   │
│  ├── storage/      -> Local SQLite database with migrations │
│  └── monitoring/   -> Tokio async interval loop             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Installation & Fedora Packaging

### Fedora Prerequisites

To build and run LTM natively on Fedora Workstation:

```bash
sudo dnf install -y \
  webkit2gtk4.1-devel \
  gtk3-devel \
  libsoup3-devel \
  javascriptcoregtk4.1-devel \
  openssl-devel \
  librsvg2-devel
```

### Building From Source

```bash
# 1. Clone the repository
git clone https://github.com/linux-traffic-manager/linux-traffic-manager.git
cd linux-traffic-manager

# 2. Install frontend dependencies
cd frontend
pnpm install
cd ..

# 3. Run Rust unit tests
cargo test --workspace

# 4. Launch in development mode
pnpm --prefix frontend tauri dev
```

### Packaging as RPM

```bash
cargo tauri build --bundles rpm
```
The resulting package will be generated at `src-tauri/target/release/bundle/rpm/`.

---

## 🔒 Security & Linux Permissions

LTM runs entirely in **user space** without requiring `root` or `sudo`:
- Interface counters are read from world-readable `/proc/net/dev` and `/sys/class/net`.
- Connection sockets are read from `/proc/net/tcp`, `/proc/net/tcp6`, `/proc/net/udp`, `/proc/net/udp6`.
- Process correlation inspects the user's accessible `/proc/[pid]/fd` descriptors.
- Future eBPF kernel probes for kernel-level per-socket byte accounting will use a strictly scoped, privileged helper binary rather than running the desktop app with elevated privileges.

---

## 🧪 Automated Testing

LTM features an extensive test suite verifying:
- Speed calculation under standard sampling intervals.
- 32-bit and 64-bit counter overflow handling.
- Monotonic reset detection when network interfaces change state.
- Hexadecimal IPv4 and IPv6 network address endianness conversion.
- Linux socket inode resolution to PID mapping.
- SQLite schema migrations, inserts, and retention cleanup.

Run all tests via:
```bash
cargo test --workspace
```

---

## 🗺️ Roadmap

- [x] **Phase 1:** Project foundation, CI, AMOLED design system, and frontend shell.
- [x] **Phase 2:** Live interface metrics, `/proc/net/dev` parsing, real-time speed graph.
- [x] **Phase 3:** Process and connection monitoring with socket inode mapping.
- [x] **Phase 4:** Diagnostics suite (DNS lookup timing, gateway ping, packet loss).
- [x] **Phase 5:** SQLite historical analytics and configurable retention.
- [ ] **Phase 6:** Optional eBPF helper for kernel-level per-process byte accounting.
- [x] **Phase 7:** Fedora RPM packaging and automated GitHub Release workflows.

---

## 📄 License

Licensed under the [MIT License](LICENSE).
