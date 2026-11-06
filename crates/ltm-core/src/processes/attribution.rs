use std::collections::HashMap;

use super::discovery::scan_socket_inodes_to_processes;
use super::sockets::read_all_system_sockets;
use super::types::{ByteAttributionStatus, NetworkConnection, ProcessAppSummary, Protocol};

/// Result of complete system connection & process attribution
#[derive(Debug, Clone, Default)]
pub struct ProcessAttributionSnapshot {
    pub connections: Vec<NetworkConnection>,
    pub applications: Vec<ProcessAppSummary>,
}

/// Collect current connections and accurately associate them with Linux processes
pub fn get_process_attribution_snapshot(now: i64) -> ProcessAttributionSnapshot {
    let mut raw_connections = read_all_system_sockets(now);
    let inode_to_proc = scan_socket_inodes_to_processes();

    // Map to group connections by process
    let mut app_map: HashMap<u32, ProcessAppSummary> = HashMap::new();

    for conn in &mut raw_connections {
        if let Some(proc_meta) = inode_to_proc.get(&conn.inode) {
            conn.pid = Some(proc_meta.pid);
            conn.process_name = Some(proc_meta.name.clone());
            conn.user = Some(proc_meta.username.clone());

            let entry = app_map.entry(proc_meta.pid).or_insert_with(|| ProcessAppSummary {
                pid: proc_meta.pid,
                name: proc_meta.name.clone(),
                executable_path: proc_meta.executable_path.clone(),
                user: proc_meta.username.clone(),
                connection_count: 0,
                tcp_count: 0,
                udp_count: 0,
                attribution_status: ByteAttributionStatus::ConnectionBasedOnly,
                attribution_notice: "Socket-level discovery. Accurate per-process byte accounting requires eBPF kernel tracing.".to_string(),
            });

            entry.connection_count += 1;
            match conn.protocol {
                Protocol::Tcp => entry.tcp_count += 1,
                Protocol::Udp => entry.udp_count += 1,
            }
        }
    }

    let mut applications: Vec<ProcessAppSummary> = app_map.into_values().collect();
    // Sort applications by connection count descending
    applications.sort_by_key(|a| std::cmp::Reverse(a.connection_count));

    ProcessAttributionSnapshot {
        connections: raw_connections,
        applications,
    }
}
