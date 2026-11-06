use rusqlite::{params, Connection, Result};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

use super::migrations::apply_migrations;
use super::models::{
    StoredAlertEvent, StoredAppSetting, StoredAutomationRule, StoredDiagnosticReport,
    StoredTrafficSample, StoredUserProfile,
};
use crate::diagnostics::types::DiagnosticReport;

#[derive(Clone)]
pub struct DatabaseManager {
    conn: Arc<Mutex<Connection>>,
    db_path: Option<PathBuf>,
}

impl DatabaseManager {
    /// Initialize SQLite database at the specified path
    pub fn new<P: AsRef<Path>>(path: P) -> Result<Self> {
        let path_ref = path.as_ref();
        if let Some(parent) = path_ref.parent() {
            let _ = fs::create_dir_all(parent);
        }

        let mut conn = Connection::open(path_ref)?;
        // Enable WAL mode and normal synchronous for high-performance concurrent writes
        conn.execute_batch(
            "PRAGMA journal_mode = WAL;
             PRAGMA synchronous = NORMAL;
             PRAGMA busy_timeout = 5000;",
        )?;

        apply_migrations(&mut conn)?;

        Ok(Self {
            conn: Arc::new(Mutex::new(conn)),
            db_path: Some(path_ref.to_path_buf()),
        })
    }

    /// Initialize in-memory SQLite database (ideal for tests and ephemeral runs)
    pub fn new_in_memory() -> Result<Self> {
        let mut conn = Connection::open_in_memory()?;
        apply_migrations(&mut conn)?;

        Ok(Self {
            conn: Arc::new(Mutex::new(conn)),
            db_path: None,
        })
    }

    /// Default database location in standard Linux user data directory:
    /// ~/.local/share/linux-traffic-manager/ltm.db
    pub fn default_path() -> PathBuf {
        let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
        PathBuf::from(home)
            .join(".local")
            .join("share")
            .join("linux-traffic-manager")
            .join("ltm.db")
    }

    /// Record a traffic sample
    pub fn record_traffic_sample(&self, sample: &StoredTrafficSample) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO traffic_samples (timestamp, interface_name, rx_speed_bps, tx_speed_bps, rx_bytes_total, tx_bytes_total)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                sample.timestamp,
                sample.interface_name,
                sample.rx_speed_bps,
                sample.tx_speed_bps,
                sample.rx_bytes_total as i64,
                sample.tx_bytes_total as i64,
            ],
        )?;
        Ok(())
    }

    /// Record a diagnostic report
    pub fn record_diagnostic_report(&self, report: &DiagnosticReport) -> Result<()> {
        let raw_json = serde_json::to_string(report).unwrap_or_default();
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO diagnostic_history (timestamp, network_status, dns_status, avg_latency_ms, packet_loss_percent, raw_json)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                report.timestamp,
                report.network_status,
                report.dns_status,
                report.average_latency_ms,
                report.packet_loss_percent,
                raw_json,
            ],
        )?;
        Ok(())
    }

    /// Query traffic history for an interface between start and end timestamp
    pub fn query_traffic_history(
        &self,
        interface_name: Option<&str>,
        start_ts: i64,
        end_ts: i64,
        limit: usize,
    ) -> Result<Vec<StoredTrafficSample>> {
        let conn = self.conn.lock().unwrap();
        let mut results = Vec::new();

        if let Some(iface) = interface_name {
            let mut stmt = conn.prepare(
                "SELECT id, timestamp, interface_name, rx_speed_bps, tx_speed_bps, rx_bytes_total, tx_bytes_total
                 FROM traffic_samples
                 WHERE interface_name = ?1 AND timestamp >= ?2 AND timestamp <= ?3
                 ORDER BY timestamp ASC
                 LIMIT ?4",
            )?;

            let rows = stmt.query_map(params![iface, start_ts, end_ts, limit as i64], |row| {
                Ok(StoredTrafficSample {
                    id: Some(row.get(0)?),
                    timestamp: row.get(1)?,
                    interface_name: row.get(2)?,
                    rx_speed_bps: row.get(3)?,
                    tx_speed_bps: row.get(4)?,
                    rx_bytes_total: row.get::<_, i64>(5)? as u64,
                    tx_bytes_total: row.get::<_, i64>(6)? as u64,
                })
            })?;

            for row in rows {
                results.push(row?);
            }
        } else {
            let mut stmt = conn.prepare(
                "SELECT id, timestamp, interface_name, rx_speed_bps, tx_speed_bps, rx_bytes_total, tx_bytes_total
                 FROM traffic_samples
                 WHERE timestamp >= ?1 AND timestamp <= ?2
                 ORDER BY timestamp ASC
                 LIMIT ?3",
            )?;

            let rows = stmt.query_map(params![start_ts, end_ts, limit as i64], |row| {
                Ok(StoredTrafficSample {
                    id: Some(row.get(0)?),
                    timestamp: row.get(1)?,
                    interface_name: row.get(2)?,
                    rx_speed_bps: row.get(3)?,
                    tx_speed_bps: row.get(4)?,
                    rx_bytes_total: row.get::<_, i64>(5)? as u64,
                    tx_bytes_total: row.get::<_, i64>(6)? as u64,
                })
            })?;

            for row in rows {
                results.push(row?);
            }
        }

        Ok(results)
    }

    /// Query recent diagnostic reports
    pub fn query_diagnostic_history(&self, limit: usize) -> Result<Vec<StoredDiagnosticReport>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, timestamp, network_status, dns_status, avg_latency_ms, packet_loss_percent, raw_json
             FROM diagnostic_history
             ORDER BY timestamp DESC
             LIMIT ?1",
        )?;

        let rows = stmt.query_map(params![limit as i64], |row| {
            Ok(StoredDiagnosticReport {
                id: Some(row.get(0)?),
                timestamp: row.get(1)?,
                network_status: row.get(2)?,
                dns_status: row.get(3)?,
                avg_latency_ms: row.get(4)?,
                packet_loss_percent: row.get(5)?,
                raw_json: row.get(6)?,
            })
        })?;

        let mut results = Vec::new();
        for row in rows {
            results.push(row?);
        }
        Ok(results)
    }

    /// Get all automation rules
    pub fn get_automation_rules(&self) -> Result<Vec<StoredAutomationRule>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, description, enabled, trigger_type, condition_json, action_type, action_params_json, cooldown_secs, last_triggered_ts, trigger_count
             FROM automation_rules
             ORDER BY name ASC",
        )?;

        let rows = stmt.query_map([], |row| {
            Ok(StoredAutomationRule {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                enabled: row.get::<_, i64>(3)? != 0,
                trigger_type: row.get(4)?,
                condition_json: row.get(5)?,
                action_type: row.get(6)?,
                action_params_json: row.get(7)?,
                cooldown_secs: row.get::<_, i64>(8)? as u32,
                last_triggered_ts: row.get(9)?,
                trigger_count: row.get::<_, i64>(10)? as u64,
            })
        })?;

        let mut rules = Vec::new();
        for r in rows {
            rules.push(r?);
        }
        Ok(rules)
    }

    /// Insert or update an automation rule
    pub fn save_automation_rule(&self, rule: &StoredAutomationRule) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO automation_rules (id, name, description, enabled, trigger_type, condition_json, action_type, action_params_json, cooldown_secs, last_triggered_ts, trigger_count)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
             ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                description = excluded.description,
                enabled = excluded.enabled,
                trigger_type = excluded.trigger_type,
                condition_json = excluded.condition_json,
                action_type = excluded.action_type,
                action_params_json = excluded.action_params_json,
                cooldown_secs = excluded.cooldown_secs,
                last_triggered_ts = excluded.last_triggered_ts,
                trigger_count = excluded.trigger_count",
            params![
                rule.id,
                rule.name,
                rule.description,
                if rule.enabled { 1 } else { 0 },
                rule.trigger_type,
                rule.condition_json,
                rule.action_type,
                rule.action_params_json,
                rule.cooldown_secs as i64,
                rule.last_triggered_ts,
                rule.trigger_count as i64,
            ],
        )?;
        Ok(())
    }

    /// Delete an automation rule by ID
    pub fn delete_automation_rule(&self, rule_id: &str) -> Result<bool> {
        let conn = self.conn.lock().unwrap();
        let affected = conn.execute("DELETE FROM automation_rules WHERE id = ?1", params![rule_id])?;
        Ok(affected > 0)
    }

    /// Toggle rule enabled status
    pub fn toggle_automation_rule(&self, rule_id: &str, enabled: bool) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE automation_rules SET enabled = ?1 WHERE id = ?2",
            params![if enabled { 1 } else { 0 }, rule_id],
        )?;
        Ok(())
    }

    /// Record a triggered alert event
    pub fn record_alert_event(&self, alert: &StoredAlertEvent) -> Result<i64> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO alert_events (timestamp, rule_id, severity, title, message, acknowledged)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                alert.timestamp,
                alert.rule_id,
                alert.severity,
                alert.title,
                alert.message,
                if alert.acknowledged { 1 } else { 0 },
            ],
        )?;
        Ok(conn.last_insert_rowid())
    }

    /// Query recent alerts
    pub fn get_alert_events(&self, limit: usize) -> Result<Vec<StoredAlertEvent>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, timestamp, rule_id, severity, title, message, acknowledged
             FROM alert_events
             ORDER BY timestamp DESC
             LIMIT ?1",
        )?;

        let rows = stmt.query_map(params![limit as i64], |row| {
            Ok(StoredAlertEvent {
                id: Some(row.get(0)?),
                timestamp: row.get(1)?,
                rule_id: row.get(2)?,
                severity: row.get(3)?,
                title: row.get(4)?,
                message: row.get(5)?,
                acknowledged: row.get::<_, i64>(6)? != 0,
            })
        })?;

        let mut alerts = Vec::new();
        for r in rows {
            alerts.push(r?);
        }
        Ok(alerts)
    }

    /// Acknowledge an alert
    pub fn acknowledge_alert(&self, alert_id: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE alert_events SET acknowledged = 1 WHERE id = ?1",
            params![alert_id],
        )?;
        Ok(())
    }

    /// Clear all alerts
    pub fn clear_alert_events(&self) -> Result<usize> {
        let conn = self.conn.lock().unwrap();
        let count = conn.execute("DELETE FROM alert_events", [])?;
        Ok(count)
    }

    /// Retrieve all profiles
    pub fn get_user_profiles(&self) -> Result<Vec<StoredUserProfile>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, description, is_active, settings_json
             FROM user_profiles
             ORDER BY id ASC",
        )?;

        let rows = stmt.query_map([], |row| {
            Ok(StoredUserProfile {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                is_active: row.get::<_, i64>(3)? != 0,
                settings_json: row.get(4)?,
            })
        })?;

        let mut profiles = Vec::new();
        for r in rows {
            profiles.push(r?);
        }
        Ok(profiles)
    }

    /// Set active profile
    pub fn set_active_profile(&self, profile_id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("UPDATE user_profiles SET is_active = 0", [])?;
        conn.execute(
            "UPDATE user_profiles SET is_active = 1 WHERE id = ?1",
            params![profile_id],
        )?;
        Ok(())
    }

    /// Get persistent app setting by key
    pub fn get_setting(&self, key: &str) -> Result<Option<String>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT value_json FROM app_settings WHERE key = ?1")?;
        let mut rows = stmt.query(params![key])?;
        if let Some(row) = rows.next()? {
            Ok(Some(row.get(0)?))
        } else {
            Ok(None)
        }
    }

    /// Get persistent app setting as structured StoredAppSetting
    pub fn get_app_setting(&self, key: &str) -> Result<Option<StoredAppSetting>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT key, value_json, updated_at FROM app_settings WHERE key = ?1")?;
        let mut rows = stmt.query(params![key])?;
        if let Some(row) = rows.next()? {
            Ok(Some(StoredAppSetting {
                key: row.get(0)?,
                value_json: row.get(1)?,
                updated_at: row.get(2)?,
            }))
        } else {
            Ok(None)
        }
    }

    /// Save persistent app setting
    pub fn set_setting(&self, key: &str, value_json: &str) -> Result<()> {
        let now = chrono::Utc::now().timestamp();
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO app_settings (key, value_json, updated_at)
             VALUES (?1, ?2, ?3)
             ON CONFLICT(key) DO UPDATE SET
                value_json = excluded.value_json,
                updated_at = excluded.updated_at",
            params![key, value_json, now],
        )?;
        Ok(())
    }

    /// Export traffic history as CSV format
    pub fn export_traffic_samples_csv(&self, start_ts: i64, end_ts: i64) -> Result<String> {
        let samples = self.query_traffic_history(None, start_ts, end_ts, 100_000)?;
        let mut csv = String::from("id,timestamp,interface_name,rx_speed_bps,tx_speed_bps,rx_bytes_total,tx_bytes_total\n");
        for s in samples {
            csv.push_str(&format!(
                "{},{},\"{}\",{:.2},{:.2},{},{}\n",
                s.id.unwrap_or(0),
                s.timestamp,
                s.interface_name,
                s.rx_speed_bps,
                s.tx_speed_bps,
                s.rx_bytes_total,
                s.tx_bytes_total
            ));
        }
        Ok(csv)
    }

    /// Export traffic history as JSON format
    pub fn export_traffic_samples_json(&self, start_ts: i64, end_ts: i64) -> Result<String> {
        let samples = self.query_traffic_history(None, start_ts, end_ts, 100_000)?;
        serde_json::to_string_pretty(&samples).map_err(|e| {
            rusqlite::Error::FromSqlConversionFailure(
                0,
                rusqlite::types::Type::Text,
                Box::new(e),
            )
        })
    }

    /// Prune data older than retention_days
    pub fn prune_retention(&self, retention_days: u32) -> Result<usize> {
        let cutoff_ts = chrono::Utc::now().timestamp() - (retention_days as i64 * 86400);
        let conn = self.conn.lock().unwrap();

        let deleted_samples = conn.execute(
            "DELETE FROM traffic_samples WHERE timestamp < ?1",
            params![cutoff_ts],
        )?;

        let deleted_diags = conn.execute(
            "DELETE FROM diagnostic_history WHERE timestamp < ?1",
            params![cutoff_ts],
        )?;

        let deleted_alerts = conn.execute(
            "DELETE FROM alert_events WHERE timestamp < ?1",
            params![cutoff_ts],
        )?;

        Ok(deleted_samples + deleted_diags + deleted_alerts)
    }

    /// Returns size of SQLite database file in bytes
    pub fn get_database_size_bytes(&self) -> u64 {
        if let Some(ref path) = self.db_path {
            fs::metadata(path).map(|m| m.len()).unwrap_or(0)
        } else {
            0
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_database_insert_and_query() {
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

        db.record_traffic_sample(&sample).expect("Insert sample");

        let history = db
            .query_traffic_history(Some("eth0"), 1699999000, 1700001000, 100)
            .expect("Query history");

        assert_eq!(history.len(), 1);
        assert_eq!(history[0].interface_name, "eth0");
        assert_eq!(history[0].rx_speed_bps, 1048576.0);
    }

    #[test]
    fn test_retention_pruning() {
        let db = DatabaseManager::new_in_memory().expect("In-memory SQLite DB");
        let old_ts = chrono::Utc::now().timestamp() - (10 * 86400); // 10 days ago

        let old_sample = StoredTrafficSample {
            id: None,
            timestamp: old_ts,
            interface_name: "wlan0".to_string(),
            rx_speed_bps: 100.0,
            tx_speed_bps: 200.0,
            rx_bytes_total: 1000,
            tx_bytes_total: 2000,
        };
        db.record_traffic_sample(&old_sample).expect("Insert old");

        // Pruning with 7 days retention should remove the 10-day-old record
        let deleted = db.prune_retention(7).expect("Prune");
        assert_eq!(deleted, 1);

        let history = db
            .query_traffic_history(None, 0, i64::MAX, 100)
            .expect("Query");
        assert!(history.is_empty());
    }
}
