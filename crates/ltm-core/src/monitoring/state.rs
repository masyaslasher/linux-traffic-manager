use chrono::Utc;
use std::collections::VecDeque;
use std::sync::{Arc, Mutex};
use std::time::Instant;

use crate::network::interfaces::discover_interfaces;
use crate::network::speed::SpeedCalculator;
use crate::network::types::{RawDevCounters, SpeedMetrics, TrafficHistoryPoint};
use crate::storage::db::DatabaseManager;
use crate::storage::models::StoredTrafficSample;

#[derive(Debug, Clone)]
pub struct MonitorConfig {
    pub poll_interval_ms: u64,
    pub max_history_points: usize,
    pub selected_interface: Option<String>,
    pub db_flush_interval_ticks: usize,
    pub retention_days: u32,
}

impl Default for MonitorConfig {
    fn default() -> Self {
        Self {
            poll_interval_ms: 1000,
            max_history_points: 60,
            selected_interface: None,
            db_flush_interval_ticks: 10,
            retention_days: 14,
        }
    }
}

pub struct MonitorState {
    pub config: MonitorConfig,
    pub speed_calc: SpeedCalculator,
    pub latest_metrics: Option<SpeedMetrics>,
    pub history_points: VecDeque<TrafficHistoryPoint>,
    pub tick_counter: usize,
    pub db: Option<DatabaseManager>,
}

impl MonitorState {
    pub fn new(config: MonitorConfig, db: Option<DatabaseManager>) -> Self {
        Self {
            config,
            speed_calc: SpeedCalculator::new(),
            latest_metrics: None,
            history_points: VecDeque::with_capacity(120),
            tick_counter: 0,
            db,
        }
    }

    /// Perform a single monitoring tick: polls interface counters and calculates live speed
    pub fn tick(&mut self, now: Instant) -> Option<SpeedMetrics> {
        let interfaces = discover_interfaces();
        let now_ts = Utc::now().timestamp();

        // If an interface is selected, find it; otherwise pick the active non-loopback interface with highest traffic
        let target_iface = if let Some(ref sel) = self.config.selected_interface {
            interfaces.iter().find(|i| &i.name == sel)
        } else {
            interfaces
                .iter()
                .filter(|i| !i.is_loopback && i.is_up)
                .max_by_key(|i| i.rx_bytes + i.tx_bytes)
                .or_else(|| interfaces.iter().find(|i| !i.is_loopback))
        };

        if let Some(iface) = target_iface {
            let counters = RawDevCounters {
                rx_bytes: iface.rx_bytes,
                rx_packets: iface.rx_packets,
                rx_errs: iface.rx_errors,
                rx_drop: iface.rx_dropped,
                tx_bytes: iface.tx_bytes,
                tx_packets: iface.tx_packets,
                tx_errs: iface.tx_errors,
                tx_drop: iface.tx_dropped,
            };

            if let Some(metrics) = self.speed_calc.update(&iface.name, counters, now) {
                // Push to in-memory bounded ring buffer
                let point = TrafficHistoryPoint {
                    timestamp: now_ts,
                    rx_speed_bps: metrics.rx_speed_bps,
                    tx_speed_bps: metrics.tx_speed_bps,
                    rx_speed_human: metrics.rx_speed_human.clone(),
                    tx_speed_human: metrics.tx_speed_human.clone(),
                };

                if self.history_points.len() >= self.config.max_history_points {
                    self.history_points.pop_front();
                }
                self.history_points.push_back(point);

                self.latest_metrics = Some(metrics.clone());
                self.tick_counter += 1;

                // Batch flush to SQLite
                if self
                    .tick_counter
                    .is_multiple_of(self.config.db_flush_interval_ticks)
                {
                    if let Some(ref db) = self.db {
                        let sample = StoredTrafficSample {
                            id: None,
                            timestamp: now_ts,
                            interface_name: iface.name.clone(),
                            rx_speed_bps: metrics.rx_speed_bps,
                            tx_speed_bps: metrics.tx_speed_bps,
                            rx_bytes_total: metrics.rx_bytes_total,
                            tx_bytes_total: metrics.tx_bytes_total,
                        };
                        let _ = db.record_traffic_sample(&sample);
                    }
                }

                return Some(metrics);
            }
        }

        None
    }

    /// Retrieve the in-memory real-time graph points
    pub fn get_history(&self) -> Vec<TrafficHistoryPoint> {
        self.history_points.iter().cloned().collect()
    }
}

pub type SharedMonitorState = Arc<Mutex<MonitorState>>;
