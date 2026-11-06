use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredTrafficSample {
    pub id: Option<i64>,
    pub timestamp: i64,
    pub interface_name: String,
    pub rx_speed_bps: f64,
    pub tx_speed_bps: f64,
    pub rx_bytes_total: u64,
    pub tx_bytes_total: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredDiagnosticReport {
    pub id: Option<i64>,
    pub timestamp: i64,
    pub network_status: String,
    pub dns_status: String,
    pub avg_latency_ms: f64,
    pub packet_loss_percent: f64,
    pub raw_json: String,
}
