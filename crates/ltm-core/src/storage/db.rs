use rusqlite::{params, Connection, Result};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

use super::migrations::apply_migrations;
use super::models::{StoredDiagnosticReport, StoredTrafficSample};
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

        Ok(deleted_samples + deleted_diags)
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
