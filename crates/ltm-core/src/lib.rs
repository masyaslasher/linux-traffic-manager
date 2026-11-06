//! Linux Traffic Manager (LTM) - Core Engine
//!
//! A high-performance, modular library for Linux network monitoring,
//! procfs / sysfs parsing, socket inode discovery, SQLite persistence,
//! and network diagnostics.

pub mod diagnostics;
pub mod monitoring;
pub mod network;
pub mod permissions;
pub mod processes;
pub mod storage;

pub use diagnostics::{
    check_domain_dns, check_gateway_reachability, discover_default_gateway, probe_target_latency,
    run_network_diagnostics, DiagnosticReport, DnsCheckResult, GatewayInfo, TargetProbeResult,
};

pub use network::{
    discover_interfaces, format_bytes, format_speed, InterfaceState, NetworkInterface,
    RawDevCounters, SpeedCalculator, SpeedMetrics, TrafficHistoryPoint,
};

pub use permissions::{inspect_permissions, PermissionReport};

pub use processes::{
    get_process_attribution_snapshot, parse_ipv4_hex, parse_ipv6_hex, parse_proc_net_sockets,
    read_all_system_sockets, read_process_metadata, scan_socket_inodes_to_processes,
    ByteAttributionStatus, NetworkConnection, ProcessAppSummary, ProcessAttributionSnapshot,
    ProcessMetadata, Protocol, SocketState,
};

pub use storage::{DatabaseManager, StoredDiagnosticReport, StoredTrafficSample};
