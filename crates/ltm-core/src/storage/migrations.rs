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

    Ok(())
}
