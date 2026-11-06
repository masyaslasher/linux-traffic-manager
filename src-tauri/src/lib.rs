pub mod commands;

use ltm_core::monitoring::collector::start_monitoring_task;
use ltm_core::monitoring::state::{MonitorConfig, MonitorState, SharedMonitorState};
use ltm_core::storage::db::DatabaseManager;
use std::sync::{Arc, Mutex};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db_path = DatabaseManager::default_path();
    let db = DatabaseManager::new(db_path).ok();

    let monitor_config = MonitorConfig::default();
    let monitor_state: SharedMonitorState =
        Arc::new(Mutex::new(MonitorState::new(monitor_config, db)));

    // Start background asynchronous monitoring task
    start_monitoring_task(Arc::clone(&monitor_state));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(monitor_state)
        .invoke_handler(tauri::generate_handler![
            commands::get_interfaces,
            commands::get_speed_metrics,
            commands::get_traffic_history,
            commands::get_connections,
            commands::get_applications,
            commands::run_diagnostics,
            commands::check_tcp_port,
            commands::probe_route_hops,
            commands::query_history,
            commands::query_diagnostic_history,
            commands::get_permissions,
            commands::set_monitored_interface,
            commands::prune_database,
            commands::get_db_stats,
            commands::get_automation_rules,
            commands::save_automation_rule,
            commands::delete_automation_rule,
            commands::toggle_automation_rule,
            commands::get_alert_events,
            commands::acknowledge_alert,
            commands::clear_alert_events,
            commands::get_user_profiles,
            commands::set_active_profile,
            commands::get_setting,
            commands::set_setting,
            commands::export_history_csv,
            commands::export_history_json,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
