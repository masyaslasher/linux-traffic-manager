use serde::{Deserialize, Serialize};

/// Operstate of a Linux network interface
#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum InterfaceState {
    Up,
    Down,
    #[default]
    Unknown,
}

impl From<&str> for InterfaceState {
    fn from(s: &str) -> Self {
        match s.trim().to_lowercase().as_str() {
            "up" => InterfaceState::Up,
            "down" => InterfaceState::Down,
            _ => InterfaceState::Unknown,
        }
    }
}

/// Linux Network Interface Information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkInterface {
    pub name: String,
    pub ip_addresses: Vec<String>,
    pub mac_address: Option<String>,
    pub state: InterfaceState,
    pub is_up: bool,
    pub is_loopback: bool,
    pub speed_mbps: Option<i64>,
    #[serde(default)]
    pub mtu: Option<u32>,
    #[serde(default)]
    pub carrier: Option<bool>,
    #[serde(default)]
    pub duplex: Option<String>,
    #[serde(default)]
    pub driver: Option<String>,
    #[serde(default)]
    pub dns_servers: Vec<String>,
    #[serde(default)]
    pub gateway: Option<String>,
    pub rx_bytes: u64,
    pub tx_bytes: u64,
    pub rx_packets: u64,
    pub tx_packets: u64,
    pub rx_errors: u64,
    pub tx_errors: u64,
    pub rx_dropped: u64,
    pub tx_dropped: u64,
}

/// Raw interface traffic counters read from /proc/net/dev
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct RawDevCounters {
    pub rx_bytes: u64,
    pub rx_packets: u64,
    pub rx_errs: u64,
    pub rx_drop: u64,
    pub tx_bytes: u64,
    pub tx_packets: u64,
    pub tx_errs: u64,
    pub tx_drop: u64,
}

/// Real-time speed metrics for an interface or system aggregate
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpeedMetrics {
    pub rx_speed_bps: f64,
    pub tx_speed_bps: f64,
    pub rx_speed_human: String,
    pub tx_speed_human: String,
    #[serde(default)]
    pub rx_speed_bits_human: String,
    #[serde(default)]
    pub tx_speed_bits_human: String,
    pub rx_bytes_total: u64,
    pub tx_bytes_total: u64,
    pub rx_total_human: String,
    pub tx_total_human: String,
    #[serde(default)]
    pub peak_rx_speed_bps: f64,
    #[serde(default)]
    pub peak_tx_speed_bps: f64,
    #[serde(default)]
    pub peak_rx_speed_human: String,
    #[serde(default)]
    pub peak_tx_speed_human: String,
    #[serde(default)]
    pub avg_rx_speed_bps: f64,
    #[serde(default)]
    pub avg_tx_speed_bps: f64,
    #[serde(default)]
    pub avg_rx_speed_human: String,
    #[serde(default)]
    pub avg_tx_speed_human: String,
    #[serde(default)]
    pub active_connections: usize,
    #[serde(default)]
    pub tcp_connections: usize,
    #[serde(default)]
    pub udp_connections: usize,
    #[serde(default)]
    pub connection_uptime_secs: u64,
    #[serde(default)]
    pub bandwidth_utilization_percent: Option<f64>,
}

/// A point in time for the real-time speed chart
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrafficHistoryPoint {
    pub timestamp: i64,
    pub rx_speed_bps: f64,
    pub tx_speed_bps: f64,
    pub rx_speed_human: String,
    pub tx_speed_human: String,
}
