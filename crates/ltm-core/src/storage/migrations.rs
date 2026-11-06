use rusqlite::{Connection, Result};

pub fn apply_migrations(conn: &mut Connection) -> Result<()> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            applied_at INTEGER NOT NULL
        );
        ",
    )?;

    let current_version: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0);

    if current_version < 1 {
        let tx = conn.transaction()?;

        tx.execute_batch(
            "
            -- Table for time-series traffic speed and counter measurements
            CREATE TABLE IF NOT EXISTS traffic_samples (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp INTEGER NOT NULL,
                interface_name TEXT NOT NULL,
                rx_speed_bps REAL NOT NULL,
                tx_speed_bps REAL NOT NULL,
                rx_bytes_total INTEGER NOT NULL,
                tx_bytes_total INTEGER NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_traffic_timestamp ON traffic_samples(timestamp);
            CREATE INDEX IF NOT EXISTS idx_traffic_iface_ts ON traffic_samples(interface_name, timestamp);

            -- Table for persistent network diagnostic runs
            CREATE TABLE IF NOT EXISTS diagnostic_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp INTEGER NOT NULL,
                network_status TEXT NOT NULL,
                dns_status TEXT NOT NULL,
                avg_latency_ms REAL NOT NULL,
                packet_loss_percent REAL NOT NULL,
                raw_json TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_diag_timestamp ON diagnostic_history(timestamp);

            INSERT INTO schema_migrations (version, applied_at)
            VALUES (1, unixepoch());
            ",
        )?;

        tx.commit()?;
    }

    if current_version < 2 {
        let tx = conn.transaction()?;

        tx.execute_batch(
            "
            -- Table for automation rules (WHEN / IF / THEN)
            CREATE TABLE IF NOT EXISTS automation_rules (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                enabled INTEGER NOT NULL DEFAULT 1,
                trigger_type TEXT NOT NULL,
                condition_json TEXT NOT NULL,
                action_type TEXT NOT NULL,
                action_params_json TEXT NOT NULL,
                cooldown_secs INTEGER NOT NULL DEFAULT 60,
                last_triggered_ts INTEGER NOT NULL DEFAULT 0,
                trigger_count INTEGER NOT NULL DEFAULT 0
            );

            CREATE INDEX IF NOT EXISTS idx_rules_trigger ON automation_rules(trigger_type, enabled);

            -- Table for alert notifications and event history
            CREATE TABLE IF NOT EXISTS alert_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp INTEGER NOT NULL,
                rule_id TEXT,
                severity TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                acknowledged INTEGER NOT NULL DEFAULT 0
            );

            CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alert_events(timestamp);

            -- Table for monitoring and network profiles
            CREATE TABLE IF NOT EXISTS user_profiles (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                is_active INTEGER NOT NULL DEFAULT 0,
                settings_json TEXT NOT NULL
            );

            -- Table for persistent application configuration and UI appearance
            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value_json TEXT NOT NULL,
                updated_at INTEGER NOT NULL
            );

            -- Seed default preset profiles
            INSERT OR IGNORE INTO user_profiles (id, name, description, is_active, settings_json) VALUES
            ('balanced', 'Balanced', 'Optimal default monitoring profile with 1s refresh interval and standard thresholds.', 1, '{\"poll_interval_ms\":1000,\"history_retention_days\":30,\"theme\":\"dark\",\"density\":\"normal\"}'),
            ('gaming', 'Gaming Focus', 'Ultra-low overhead monitoring with prioritized latency and packet loss tracking.', 0, '{\"poll_interval_ms\":2000,\"history_retention_days\":14,\"theme\":\"dark\",\"density\":\"compact\"}'),
            ('streaming', 'Media Streaming', 'Prioritizes high throughput consistency and buffer drop detection.', 0, '{\"poll_interval_ms\":1000,\"history_retention_days\":30,\"theme\":\"slate\",\"density\":\"normal\"}'),
            ('downloading', 'Heavy Download', 'Optimized for high-volume file transfers and bandwidth consumption tracking.', 0, '{\"poll_interval_ms\":1500,\"history_retention_days\":60,\"theme\":\"graphite\",\"density\":\"normal\"}'),
            ('work', 'Work / Low Noise', 'Quiet mode with silenced non-critical alerts and minimal UI animation.', 0, '{\"poll_interval_ms\":2000,\"history_retention_days\":30,\"theme\":\"dark\",\"density\":\"compact\"}'),
            ('custom', 'Custom Profile', 'Fully personalized monitoring parameters and automation suite.', 0, '{\"poll_interval_ms\":1000,\"history_retention_days\":30,\"theme\":\"amoled\",\"density\":\"normal\"}');

            -- Seed default template automation rules
            INSERT OR IGNORE INTO automation_rules (id, name, description, enabled, trigger_type, condition_json, action_type, action_params_json, cooldown_secs) VALUES
            ('rule_high_down', 'High Download Rate Alert', 'Notifies when download speed exceeds 50 MB/s for sustained bandwidth usage.', 1, 'download_above', '{\"threshold_bps\":52428800.0}', 'notify', '{\"severity\":\"warning\"}', 120),
            ('rule_conn_lost', 'Internet Disconnection Alert', 'Alerts immediately if the default gateway or WAN connectivity becomes unreachable.', 1, 'connection_lost', '{}', 'notify', '{\"severity\":\"critical\"}', 60),
            ('rule_high_latency', 'High Network Latency Spike', 'Warns when average network round-trip time exceeds 150 ms.', 1, 'high_latency', '{\"threshold_ms\":150.0}', 'notify', '{\"severity\":\"warning\"}', 180),
            ('rule_traffic_cap', 'Daily Traffic Cap Warning', 'Alerts when total transferred data for today exceeds 10 GB.', 1, 'total_traffic_above', '{\"threshold_bytes\":10737418240}', 'notify', '{\"severity\":\"info\"}', 3600);

            INSERT INTO schema_migrations (version, applied_at)
            VALUES (2, unixepoch());
            ",
        )?;

        tx.commit()?;
    }

    Ok(())
}
