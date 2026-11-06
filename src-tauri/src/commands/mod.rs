use ltm_core::diagnostics::types::DiagnosticReport;
use ltm_core::monitoring::state::SharedMonitorState;
use ltm_core::network::types::{NetworkInterface, SpeedMetrics, TrafficHistoryPoint};
use ltm_core::permissions::checker::{inspect_permissions, PermissionReport};
use ltm_core::processes::types::{NetworkConnection, ProcessAppSummary};
use ltm_core::storage::models::{StoredDiagnosticReport, StoredTrafficSample};
use tauri::State;

#[tauri::command]
pub fn get_interfaces() -> Vec<NetworkInterface> {
    ltm_core::network::interfaces::discover_interfaces()
}

#[tauri::command]
pub fn get_speed_metrics(state: State<'_, SharedMonitorState>) -> Option<SpeedMetrics> {
    let s = state.lock().unwrap();
    s.latest_metrics.clone()
}

#[tauri::command]
pub fn get_traffic_history(state: State<'_, SharedMonitorState>) -> Vec<TrafficHistoryPoint> {
    let s = state.lock().unwrap();
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
        let s = state.lock().unwrap();
        if let Some(ref db) = s.db {
            let _ = db.record_diagnostic_report(&report);
        }
    }
    Ok(report)
}

#[tauri::command]
pub fn query_history(
    state: State<'_, SharedMonitorState>,
    interface_name: Option<String>,
    start_ts: i64,
    end_ts: i64,
    limit: Option<usize>,
) -> Result<Vec<StoredTrafficSample>, String> {
    let s = state.lock().unwrap();
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
    let s = state.lock().unwrap();
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
    let mut s = state.lock().unwrap();
    s.config.selected_interface = interface_name;
}

#[tauri::command]
pub fn prune_database(
    state: State<'_, SharedMonitorState>,
    retention_days: u32,
) -> Result<usize, String> {
    let s = state.lock().unwrap();
    if let Some(ref db) = s.db {
        db.prune_retention(retention_days)
            .map_err(|e| e.to_string())
    } else {
        Ok(0)
    }
}

#[tauri::command]
pub fn get_db_stats(state: State<'_, SharedMonitorState>) -> u64 {
    let s = state.lock().unwrap();
    if let Some(ref db) = s.db {
        db.get_database_size_bytes()
    } else {
        0
    }
}
