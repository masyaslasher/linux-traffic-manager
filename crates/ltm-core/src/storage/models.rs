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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredAutomationRule {
    pub id: String,
    pub name: String,
    pub description: String,
    pub enabled: bool,
    pub trigger_type: String,
    pub condition_json: String,
    pub action_type: String,
    pub action_params_json: String,
    pub cooldown_secs: u32,
    pub last_triggered_ts: i64,
    pub trigger_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredAlertEvent {
    pub id: Option<i64>,
    pub timestamp: i64,
    pub rule_id: Option<String>,
    pub severity: String,
    pub title: String,
    pub message: String,
    pub acknowledged: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredUserProfile {
    pub id: String,
    pub name: String,
    pub description: String,
    pub is_active: bool,
    pub settings_json: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredAppSetting {
    pub key: String,
    pub value_json: String,
    pub updated_at: i64,
}
