use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TargetProbeResult {
    pub target: String,
    pub successful_probes: usize,
    pub total_probes: usize,
    pub min_latency_ms: Option<f64>,
    pub max_latency_ms: Option<f64>,
    pub avg_latency_ms: Option<f64>,
    pub packet_loss_percent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DnsCheckResult {
    pub domain: String,
    pub is_working: bool,
    pub latency_ms: f64,
    pub resolved_ips: Vec<String>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GatewayInfo {
    pub interface: String,
    pub gateway_ip: String,
    pub is_reachable: bool,
    pub latency_ms: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiagnosticReport {
    pub timestamp: i64,
    pub network_status: String, // "Connected", "Degraded", "Offline"
    pub dns_status: String,     // "Working", "Slow", "Failing"
    pub dns_latency_ms: f64,
    pub gateway: Option<GatewayInfo>,
    pub average_latency_ms: f64,
    pub packet_loss_percent: f64,
    pub dns_checks: Vec<DnsCheckResult>,
    pub probes: Vec<TargetProbeResult>,
}
