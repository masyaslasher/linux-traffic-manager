use ltm_core::diagnostics::types::{DiagnosticReport, RouteHop, TcpPortCheckResult};
use ltm_core::monitoring::state::SharedMonitorState;
use ltm_core::network::types::{NetworkInterface, SpeedMetrics, TrafficHistoryPoint};
use ltm_core::permissions::checker::{inspect_permissions, PermissionReport};
use ltm_core::processes::types::{NetworkConnection, ProcessAppSummary};
use ltm_core::storage::models::{
    StoredAlertEvent, StoredAutomationRule, StoredDiagnosticReport, StoredTrafficSample,
    StoredUserProfile,
};
use tauri::State;

#[tauri::command]
pub fn get_interfaces() -> Vec<NetworkInterface> {
    ltm_core::network::interfaces::discover_interfaces()
}

#[tauri::command]
pub fn get_speed_metrics(state: State<'_, SharedMonitorState>) -> Option<SpeedMetrics> {
    let s = state.lock().unwrap_or_else(|e| e.into_inner());
    s.latest_metrics.clone()
}

#[tauri::command]
pub fn get_traffic_history(state: State<'_, SharedMonitorState>) -> Vec<TrafficHistoryPoint> {
    let s = state.lock().unwrap_or_else(|e| e.into_inner());
    s.get_history()
}

#[tauri::command]
pub fn get_connections() -> Vec<NetworkConnection> {
    let now = chrono::Utc::now().timestamp();
    let snapshot = ltm_core::processes::attribution::get_process_attribution_snapshot(now);
    snapshot.connections
}

#[tauri::command]
pub fn get_applications() -> Vec<ProcessAppSummary> {
    let now = chrono::Utc::now().timestamp();
    let snapshot = ltm_core::processes::attribution::get_process_attribution_snapshot(now);
    snapshot.applications
}

#[tauri::command]
pub async fn run_diagnostics(
    state: State<'_, SharedMonitorState>,
) -> Result<DiagnosticReport, String> {
    let report = ltm_core::diagnostics::runner::run_network_diagnostics().await;
    {
        let s = state.lock().unwrap_or_else(|e| e.into_inner());
        if let Some(ref db) = s.db {
            let _ = db.record_diagnostic_report(&report);
        }
    }
    Ok(report)
}

#[tauri::command]
pub async fn check_tcp_port(
    target: String,
    port: u16,
    timeout_ms: Option<u64>,
) -> TcpPortCheckResult {
    ltm_core::diagnostics::check_tcp_port(&target, port, timeout_ms.unwrap_or(2000)).await
}

#[tauri::command]
pub async fn probe_route_hops(target: String, max_hops: Option<u8>) -> Vec<RouteHop> {
    ltm_core::diagnostics::probe_route_hops(&target, max_hops.unwrap_or(15)).await
}

#[tauri::command]
pub fn query_history(
    state: State<'_, SharedMonitorState>,
    interface_name: Option<String>,
    start_ts: i64,
    end_ts: i64,
    limit: Option<usize>,
) -> Result<Vec<StoredTrafficSample>, String> {
    let s = state.lock().unwrap_or_else(|e| e.into_inner());
    if let Some(ref db) = s.db {
        db.query_traffic_history(
            interface_name.as_deref(),
            start_ts,
            end_ts,
            limit.unwrap_or(200),
        )
        .map_err(|e| e.to_string())
    } else {
        Ok(Vec::new())
    }
}

#[tauri::command]
pub fn query_diagnostic_history(
    state: State<'_, SharedMonitorState>,
    limit: Option<usize>,
) -> Result<Vec<StoredDiagnosticReport>, String> {
    let s = state.lock().unwrap_or_else(|e| e.into_inner());
    if let Some(ref db) = s.db {
        db.query_diagnostic_history(limit.unwrap_or(50))
            .map_err(|e| e.to_string())
    } else {
        Ok(Vec::new())
    }
}

#[tauri::command]
pub fn get_permissions() -> PermissionReport {
    inspect_permissions()
}

#[tauri::command]
pub fn set_monitored_interface(
    state: State<'_, SharedMonitorState>,
    interface_name: Option<String>,
) {
    let mut s = state.lock().unwrap_or_else(|e| e.into_inner());
    s.config.selected_interface = interface_name;
}

#[tauri::command]
pub fn prune_database(
    state: State<'_, SharedMonitorState>,
    retention_days: u32,
) -> Result<usize, String> {
    let s = state.lock().unwrap_or_else(|e| e.into_inner());
    if let Some(ref db) = s.db {
        db.prune_retention(retention_days)
            .map_err(|e| e.to_string())
    } else {
        Ok(0)
    }
}

#[tauri::command]
pub fn get_db_stats(state: State<'_, SharedMonitorState>) -> u64 {
    let s = state.lock().unwrap_or_else(|e| e.into_inner());
    if let Some(ref db) = s.db {
        db.get_database_size_bytes()
    } else {
        0
    }
}

#[tauri::command]
pub fn get_automation_rules(
    state: State<'_, SharedMonitorState>,
) -> Result<Vec<StoredAutomationRule>, String> {
    let s = state.lock().unwrap_or_else(|e| e.into_inner());
    if let Some(ref db) = s.db {
        db.get_automation_rules().map_err(|e| e.to_string())
    } else {
        Ok(Vec::new())
    }
}

#[tauri::command]
pub fn save_automation_rule(
    state: State<'_, SharedMonitorState>,
    rule: StoredAutomationRule,
) -> Result<(), String> {
    let s = state.lock().unwrap_or_else(|e| e.into_inner());
    if let Some(ref db) = s.db {
        db.save_automation_rule(&rule).map_err(|e| e.to_string())
    } else {
        Err("Database unavailable".to_string())
    }
}

#[tauri::command]
pub fn delete_automation_rule(
    state: State<'_, SharedMonitorState>,
    rule_id: String,
) -> Result<bool, String> {
    let s = state.lock().unwrap_or_else(|e| e.into_inner());
    if let Some(ref db) = s.db {
        db.delete_automation_rule(&rule_id).map_err(|e| e.to_string())
    } else {
        Ok(false)
    }
}

#[tauri::command]
pub fn toggle_automation_rule(
    state: State<'_, SharedMonitorState>,
    rule_id: String,
    enabled: bool,
) -> Result<(), String> {
    let s = state.lock().unwrap_or_else(|e| e.into_inner());
    if let Some(ref db) = s.db {
        db.toggle_automation_rule(&rule_id, enabled).map_err(|e| e.to_string())
    } else {
        Err("Database unavailable".to_string())
    }
}

#[tauri::command]
pub fn get_alert_events(
    state: State<'_, SharedMonitorState>,
    limit: Option<usize>,
) -> Result<Vec<StoredAlertEvent>, String> {
    let s = state.lock().unwrap_or_else(|e| e.into_inner());
    if let Some(ref db) = s.db {
        db.get_alert_events(limit.unwrap_or(50)).map_err(|e| e.to_string())
    } else {
        Ok(Vec::new())
    }
}

#[tauri::command]
pub fn acknowledge_alert(
    state: State<'_, SharedMonitorState>,
    alert_id: i64,
) -> Result<(), String> {
    let s = state.lock().unwrap_or_else(|e| e.into_inner());
    if let Some(ref db) = s.db {
        db.acknowledge_alert(alert_id).map_err(|e| e.to_string())
    } else {
        Err("Database unavailable".to_string())
    }
}

#[tauri::command]
pub fn clear_alert_events(
    state: State<'_, SharedMonitorState>,
) -> Result<usize, String> {
    let s = state.lock().unwrap_or_else(|e| e.into_inner());
    if let Some(ref db) = s.db {
        db.clear_alert_events().map_err(|e| e.to_string())
    } else {
        Ok(0)
    }
}

#[tauri::command]
pub fn get_user_profiles(
    state: State<'_, SharedMonitorState>,
) -> Result<Vec<StoredUserProfile>, String> {
    let s = state.lock().unwrap_or_else(|e| e.into_inner());
    if let Some(ref db) = s.db {
        db.get_user_profiles().map_err(|e| e.to_string())
    } else {
        Ok(Vec::new())
    }
}

#[tauri::command]
pub fn set_active_profile(
    state: State<'_, SharedMonitorState>,
    profile_id: String,
) -> Result<(), String> {
    let s = state.lock().unwrap_or_else(|e| e.into_inner());
    if let Some(ref db) = s.db {
        db.set_active_profile(&profile_id).map_err(|e| e.to_string())
    } else {
        Err("Database unavailable".to_string())
    }
}

#[tauri::command]
pub fn get_setting(
    state: State<'_, SharedMonitorState>,
    key: String,
) -> Result<Option<String>, String> {
    let s = state.lock().unwrap_or_else(|e| e.into_inner());
    if let Some(ref db) = s.db {
        db.get_setting(&key).map_err(|e| e.to_string())
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn set_setting(
    state: State<'_, SharedMonitorState>,
    key: String,
    value_json: String,
) -> Result<(), String> {
    let s = state.lock().unwrap_or_else(|e| e.into_inner());
    if let Some(ref db) = s.db {
        db.set_setting(&key, &value_json).map_err(|e| e.to_string())
    } else {
        Err("Database unavailable".to_string())
    }
}

#[tauri::command]
pub fn export_history_csv(
    state: State<'_, SharedMonitorState>,
    start_ts: i64,
    end_ts: i64,
) -> Result<String, String> {
    let s = state.lock().unwrap_or_else(|e| e.into_inner());
    if let Some(ref db) = s.db {
        db.export_traffic_samples_csv(start_ts, end_ts).map_err(|e| e.to_string())
    } else {
        Err("Database unavailable".to_string())
    }
}

#[tauri::command]
pub fn export_history_json(
    state: State<'_, SharedMonitorState>,
    start_ts: i64,
    end_ts: i64,
) -> Result<String, String> {
    let s = state.lock().unwrap_or_else(|e| e.into_inner());
    if let Some(ref db) = s.db {
        db.export_traffic_samples_json(start_ts, end_ts).map_err(|e| e.to_string())
    } else {
        Err("Database unavailable".to_string())
    }
}
