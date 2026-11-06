use ltm_core::network::{
    discover_interfaces, format_bytes, format_speed, RawDevCounters, SpeedCalculator,
};
use ltm_core::permissions::inspect_permissions;
use ltm_core::processes::{
    parse_ipv4_hex, parse_proc_net_sockets, read_all_system_sockets, read_process_metadata,
    Protocol, SocketState,
};
use ltm_core::storage::{DatabaseManager, StoredTrafficSample};
use std::time::{Duration, Instant};

#[test]
fn test_traffic_speed_and_counter_overflow() {
    let mut calc = SpeedCalculator::new();
    let t0 = Instant::now();

    // Baseline sample
    let initial = RawDevCounters {
        rx_bytes: 4_294_960_000, // Near 32-bit maximum (4_294_967_295)
        tx_bytes: 1_000_000,
        ..Default::default()
    };
    assert!(calc.update("enp1s0", initial, t0).is_none());

    // 1 second later: rx wraps around to 10_000, tx increases by 500,000
    let t1 = t0 + Duration::from_secs(1);
    let sample = RawDevCounters {
        rx_bytes: 10_000,
        tx_bytes: 1_500_000,
        ..Default::default()
    };

    let metrics = calc
        .update("enp1s0", sample, t1)
        .expect("Metrics calculated");
    // (4_294_967_295 - 4_294_960_000) + 10_000 + 1 = 17_296 bytes in 1.0s
    assert_eq!(metrics.rx_speed_bps.round(), 17296.0);
    assert_eq!(metrics.tx_speed_bps.round(), 500000.0);
}

#[test]
fn test_counter_reset_recovery() {
    let mut calc = SpeedCalculator::new();
    let t0 = Instant::now();

    let initial = RawDevCounters {
        rx_bytes: 800_000_000,
        tx_bytes: 400_000_000,
        ..Default::default()
    };
    calc.update("eth0", initial, t0);

    // Interface driver reloaded or reset, counter dropped to 1,000
    let t1 = t0 + Duration::from_secs(1);
    let reset_sample = RawDevCounters {
        rx_bytes: 1_000,
        tx_bytes: 2_000,
        ..Default::default()
    };

    let metrics = calc
        .update("eth0", reset_sample, t1)
        .expect("Metrics on reset");
    // Reset should yield the new counter value without panic or huge underflow
    assert_eq!(metrics.rx_speed_bps.round(), 1000.0);
    assert_eq!(metrics.tx_speed_bps.round(), 2000.0);
}

#[test]
fn test_network_interface_discovery() {
    let interfaces = discover_interfaces();
    // At minimum, loopback (lo) exists on every Linux system
    assert!(!interfaces.is_empty(), "Interfaces must not be empty");
    let has_loopback = interfaces.iter().any(|i| i.name == "lo");
    assert!(has_loopback, "Loopback interface must be present");
}

#[test]
fn test_process_information_and_socket_parsing() {
    let my_pid = std::process::id();
    let meta = read_process_metadata(my_pid);
    assert!(
        meta.is_some(),
        "Should read metadata of current test process"
    );
    let meta = meta.unwrap();
    assert_eq!(meta.pid, my_pid);

    let sample_line = "   0: 0100007F:0050 00000000:0000 0A 00000000:00000000 00:00000000 00000000  1000 0 12345 1 0 100 0 0 10 0\n";
    let sockets = parse_proc_net_sockets(sample_line, Protocol::Tcp, false, 1700000000);
    assert_eq!(sockets.len(), 1);
    assert_eq!(sockets[0].local_address, "127.0.0.1");
    assert_eq!(sockets[0].local_port, 80);
    assert_eq!(sockets[0].inode, 12345);
    assert_eq!(sockets[0].state, SocketState::Listen);
}

#[test]
fn test_system_sockets_reading() {
    let sockets = read_all_system_sockets(1700000000);
    // There should be active system sockets on any running Linux OS
    assert!(!sockets.is_empty(), "System should have active sockets");
}

#[test]
fn test_database_crud_and_retention() {
    let db = DatabaseManager::new_in_memory().expect("In-memory SQLite");

    let sample = StoredTrafficSample {
        id: None,
        timestamp: 1700000500,
        interface_name: "lo".to_string(),
        rx_speed_bps: 12345.0,
        tx_speed_bps: 67890.0,
        rx_bytes_total: 100000,
        tx_bytes_total: 200000,
    };

    db.record_traffic_sample(&sample).expect("Insert sample");

    let history = db
        .query_traffic_history(Some("lo"), 1700000000, 1700001000, 10)
        .expect("Query");
    assert_eq!(history.len(), 1);
    assert_eq!(history[0].rx_speed_bps, 12345.0);

    // Prune with 0 days retention should clean everything
    let pruned = db.prune_retention(0).expect("Prune");
    assert_eq!(pruned, 1);
}

#[test]
fn test_permissions_inspection() {
    let report = inspect_permissions();
    assert!(report.can_read_proc_net_dev);
    assert!(report.can_read_proc_net_tcp);
    assert!(report.can_read_proc_fds);
    assert!(!report.security_notice.is_empty());
}

#[test]
fn test_data_serialization() {
    let ip = parse_ipv4_hex("0100007F").unwrap();
    let json = serde_json::to_string(&ip).expect("Serialize IP");
    assert_eq!(json, "\"127.0.0.1\"");

    assert_eq!(format_bytes(1048576.0), "1.00 MB");
    assert_eq!(format_speed(2097152.0), "2.00 MB/s");
    assert_eq!(ltm_core::network::format_speed_bits(125000.0), "1.00 Mbit/s");
}

#[test]
fn test_automation_rules_and_alerts() {
    let db = DatabaseManager::new_in_memory().expect("In-memory SQLite DB");

    // Verify default rules were seeded in migration v2
    let rules = db.get_automation_rules().expect("Get rules");
    assert!(!rules.is_empty());
    assert!(rules.iter().any(|r| r.trigger_type == "download_above"));

    // Toggle rule
    let first_id = &rules[0].id;
    db.toggle_automation_rule(first_id, false).expect("Toggle rule");
    let updated_rules = db.get_automation_rules().expect("Get rules");
    assert!(!updated_rules.iter().find(|r| &r.id == first_id).unwrap().enabled);

    // Record an alert
    let alert = ltm_core::storage::StoredAlertEvent {
        id: None,
        timestamp: 1700000000,
        rule_id: Some(first_id.clone()),
        severity: "warning".to_string(),
        title: "Test Alert".to_string(),
        message: "High bandwidth utilization".to_string(),
        acknowledged: false,
    };
    let alert_id = db.record_alert_event(&alert).expect("Record alert");
    let alerts = db.get_alert_events(10).expect("Get alerts");
    assert_eq!(alerts.len(), 1);
    assert_eq!(alerts[0].title, "Test Alert");

    // Acknowledge alert
    db.acknowledge_alert(alert_id).expect("Ack alert");
    let alerts = db.get_alert_events(10).expect("Get alerts");
    assert!(alerts[0].acknowledged);
}

#[test]
fn test_user_profiles_and_settings() {
    let db = DatabaseManager::new_in_memory().expect("In-memory SQLite DB");

    // Verify default profiles
    let profiles = db.get_user_profiles().expect("Profiles");
    assert_eq!(profiles.len(), 6);
    let active = profiles.iter().find(|p| p.is_active).unwrap();
    assert_eq!(active.id, "balanced");

    // Switch active profile to gaming
    db.set_active_profile("gaming").expect("Set gaming");
    let profiles = db.get_user_profiles().expect("Profiles");
    assert!(profiles.iter().find(|p| p.id == "gaming").unwrap().is_active);
    assert!(!profiles.iter().find(|p| p.id == "balanced").unwrap().is_active);

    // Setting key-value test
    db.set_setting("theme", "\"slate\"").expect("Set setting");
    let setting = db.get_setting("theme").expect("Get setting");
    assert_eq!(setting.as_deref(), Some("\"slate\""));
}

#[test]
fn test_csv_and_json_export() {
    let db = DatabaseManager::new_in_memory().expect("In-memory SQLite DB");
    let sample = StoredTrafficSample {
        id: None,
        timestamp: 1700000000,
        interface_name: "eth0".to_string(),
        rx_speed_bps: 1048576.0,
        tx_speed_bps: 524288.0,
        rx_bytes_total: 50000000,
        tx_bytes_total: 20000000,
    };
    db.record_traffic_sample(&sample).expect("Record sample");

    let csv = db.export_traffic_samples_csv(0, i64::MAX).expect("Export CSV");
    assert!(csv.contains("eth0"));
    assert!(csv.contains("1048576.00"));

    let json = db.export_traffic_samples_json(0, i64::MAX).expect("Export JSON");
    assert!(json.contains("eth0"));
    assert!(json.contains("1048576"));
}
