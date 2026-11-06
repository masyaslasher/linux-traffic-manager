# Linux Traffic Manager (LTM) — eBPF Advanced Accounting Architecture

## 1. Executive Summary

Standard Linux `/proc/net/dev` provides global network interface counters (bytes received and transmitted), while `/proc/net/tcp` and `/proc/[pid]/fd` provide connection socket correlation to process identifiers (PIDs).

However, in stock Linux kernels, unprivileged user space cannot query the exact cumulative byte counts transferred by an individual ephemeral socket or process without kernel assistance.

**LTM strictly prohibits fabricating per-process byte numbers.** Rather than guessing or misattributing interface traffic, LTM defines an optional, security-hardened **eBPF-based architecture** for per-process byte accounting.

---

## 2. Security & Least Privilege Design

### The Golden Rule
> **Never run the desktop GUI as root.** Running complex UI frameworks (WebKit, GTK, React) with elevated privileges introduces critical attack surfaces.

### Daemon / Helper Separation

```text
┌────────────────────────────────────────────────────────┐
│               LTM Desktop GUI (Unprivileged)           │
│   - Runs as standard user `user`                       │
│   - Renders React UI and Tauri window                  │
│   - Communicates via local Unix Domain Socket          │
└───────────────────────────▲────────────────────────────┘
                            │ /run/ltm/probe.sock (Unix Domain Socket)
┌───────────────────────────▼────────────────────────────┐
│          ltm-probe (Privileged Helper Process)         │
│   - Minimal, strictly scoped Rust daemon               │
│   - Requires CAP_BPF + CAP_NET_ADMIN                   │
│   - Loads verified eBPF programs into kernel           │
│   - Aggregates per-PID byte counters                   │
└───────────────────────────▲────────────────────────────┘
                            │ eBPF Maps
┌───────────────────────────▼────────────────────────────┐
│                    Linux Kernel                        │
│   - Tracepoints: sock:inet_sock_set_state              │
│   - kprobe / fentry: sock_sendmsg, sock_recvmsg        │
│   - BPF_MAP_TYPE_HASH: <pid, traffic_bytes>            │
└────────────────────────────────────────────────────────┘
```

---

## 3. Kernel Instrumentation Points

1. **`sock:inet_sock_set_state` (Tracepoint):**
   Fires on TCP socket state transitions (e.g. `TCP_ESTABLISHED`, `TCP_CLOSE`). Tracks socket lifecycle and initial PID association.
2. **`sock_sendmsg` & `sock_recvmsg` (kprobe / BPF trampoline):**
   Inspects the length argument of network buffer transfers:
   ```c
   struct bpf_map_def SEC("maps") pid_traffic_map = {
       .type = BPF_MAP_TYPE_HASH,
       .key_size = sizeof(u32),   // PID
       .value_size = sizeof(u64), // Cumulative bytes
       .max_entries = 10240,
   };
   ```
3. **Cgroup Socket Accounting (`BPF_PROG_TYPE_CGROUP_SKB`):**
   On modern systemd systems (Fedora 40+), network traffic can be accounted per-cgroup / systemd user slice, attributing traffic cleanly to desktop apps.

---

## 4. Graceful Fallback Behavior

When `ltm-probe` is not running or eBPF permissions are unavailable:
- LTM automatically operates in **Standard Mode**.
- Active connections, endpoints, socket states, and process names continue to function normally via `/proc`.
- Applications page displays the explicit notice:
  *`"Attribution: Connection-based (eBPF helper optional for per-process byte streaming)"`*.
- No crashes, no permission prompts, and no false metrics.
