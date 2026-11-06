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

            if let Some(mut metrics) = self.speed_calc.update(&iface.name, counters, now) {
                // Socket counts from procfs
                let (tcp_cnt, udp_cnt) = {
                    let tcp4 = std::fs::read_to_string("/proc/net/tcp").map(|s| s.lines().count().saturating_sub(1)).unwrap_or(0);
                    let tcp6 = std::fs::read_to_string("/proc/net/tcp6").map(|s| s.lines().count().saturating_sub(1)).unwrap_or(0);
                    let udp4 = std::fs::read_to_string("/proc/net/udp").map(|s| s.lines().count().saturating_sub(1)).unwrap_or(0);
                    let udp6 = std::fs::read_to_string("/proc/net/udp6").map(|s| s.lines().count().saturating_sub(1)).unwrap_or(0);
                    (tcp4 + tcp6, udp4 + udp6)
                };

                metrics.tcp_connections = tcp_cnt;
                metrics.udp_connections = udp_cnt;
                metrics.active_connections = tcp_cnt + udp_cnt;

                // Bandwidth utilization if interface link speed is known
                metrics.bandwidth_utilization_percent = if let Some(spd) = iface.speed_mbps {
                    if spd > 0 {
                        let total_bits_sec = (metrics.rx_speed_bps + metrics.tx_speed_bps) * 8.0;
                        let cap_bits_sec = (spd as f64) * 1_000_000.0;
                        Some(((total_bits_sec / cap_bits_sec) * 100.0).clamp(0.0, 100.0))
                    } else {
                        None
                    }
                } else {
                    None
                };

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

                // Evaluate automation rules and batch flush to SQLite
                if let Some(ref db) = self.db {
                    // Check rules every few seconds
                    if self.tick_counter.is_multiple_of(3) {
                        if let Ok(rules) = db.get_automation_rules() {
                            for mut rule in rules {
                                if !rule.enabled {
                                    continue;
                                }
                                let is_cooled_down = (now_ts - rule.last_triggered_ts) >= (rule.cooldown_secs as i64);
                                if !is_cooled_down {
                                    continue;
                                }

                                let mut should_trigger = false;
                                let mut alert_msg = String::new();

                                match rule.trigger_type.as_str() {
                                    "download_above" => {
                                        let threshold: f64 = serde_json::from_str::<serde_json::Value>(&rule.condition_json)
                                            .ok()
                                            .and_then(|v| v.get("threshold_bps").and_then(|t| t.as_f64()))
                                            .unwrap_or(52_428_800.0);
                                        if metrics.rx_speed_bps > threshold {
                                            should_trigger = true;
                                            alert_msg = format!("Download rate reached {} (threshold: {})", metrics.rx_speed_human, crate::network::speed::format_speed(threshold));
                                        }
                                    }
                                    "upload_above" => {
                                        let threshold: f64 = serde_json::from_str::<serde_json::Value>(&rule.condition_json)
                                            .ok()
                                            .and_then(|v| v.get("threshold_bps").and_then(|t| t.as_f64()))
                                            .unwrap_or(20_971_520.0);
                                        if metrics.tx_speed_bps > threshold {
                                            should_trigger = true;
                                            alert_msg = format!("Upload rate reached {} (threshold: {})", metrics.tx_speed_human, crate::network::speed::format_speed(threshold));
                                        }
                                    }
                                    "total_traffic_above" => {
                                        let threshold: u64 = serde_json::from_str::<serde_json::Value>(&rule.condition_json)
                                            .ok()
                                            .and_then(|v| v.get("threshold_bytes").and_then(|t| t.as_u64()))
                                            .unwrap_or(10_737_418_240);
                                        let total = metrics.rx_bytes_total + metrics.tx_bytes_total;
                                        if total > threshold {
                                            should_trigger = true;
                                            alert_msg = format!("Total interface data reached {} (limit: {})", crate::network::speed::format_bytes(total as f64), crate::network::speed::format_bytes(threshold as f64));
                                        }
                                    }
                                    "connection_lost" => {
                                        if !iface.is_up {
                                            should_trigger = true;
                                            alert_msg = format!("Network interface {} went DOWN", iface.name);
                                        }
                                    }
                                    _ => {}
                                }

                                if should_trigger {
                                    let alert = crate::storage::models::StoredAlertEvent {
                                        id: None,
                                        timestamp: now_ts,
                                        rule_id: Some(rule.id.clone()),
                                        severity: "warning".to_string(),
                                        title: rule.name.clone(),
                                        message: alert_msg,
                                        acknowledged: false,
                                    };
                                    let _ = db.record_alert_event(&alert);

                                    rule.last_triggered_ts = now_ts;
                                    rule.trigger_count += 1;
                                    let _ = db.save_automation_rule(&rule);
                                }
                            }
                        }
                    }

                    // Flush sample periodically
                    if self.tick_counter.is_multiple_of(self.config.db_flush_interval_ticks) {
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
