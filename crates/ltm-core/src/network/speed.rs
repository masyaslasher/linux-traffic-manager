use std::collections::HashMap;
use std::time::Instant;

use super::types::{RawDevCounters, SpeedMetrics};

/// Formats a raw byte count (or bytes/sec) into human-readable representation
pub fn format_bytes(bytes: f64) -> String {
    const KB: f64 = 1024.0;
    const MB: f64 = KB * 1024.0;
    const GB: f64 = MB * 1024.0;
    const TB: f64 = GB * 1024.0;

    if bytes < KB {
        format!("{:.0} B", bytes)
    } else if bytes < MB {
        format!("{:.1} KB", bytes / KB)
    } else if bytes < GB {
        format!("{:.2} MB", bytes / MB)
    } else if bytes < TB {
        format!("{:.2} GB", bytes / GB)
    } else {
        format!("{:.2} TB", bytes / TB)
    }
}

/// Formats speed into human-readable B/s, KB/s, MB/s, etc.
pub fn format_speed(bps: f64) -> String {
    format!("{}/s", format_bytes(bps))
}

/// State tracking for previous interface sample
#[derive(Debug, Clone)]
struct SampleRecord {
    timestamp: Instant,
    rx_bytes: u64,
    tx_bytes: u64,
}

/// SpeedCalculator manages rate estimation across arbitrary sampling periods,
/// handling counter resets, wraps, and interval normalization.
#[derive(Debug, Default)]
pub struct SpeedCalculator {
    previous_samples: HashMap<String, SampleRecord>,
}

impl SpeedCalculator {
    pub fn new() -> Self {
        Self {
            previous_samples: HashMap::new(),
        }
    }

    /// Calculate delta between previous and current counter, guarding against overflow & resets.
    pub fn calculate_counter_delta(prev: u64, curr: u64) -> u64 {
        if curr >= prev {
            curr - prev
        } else {
            // Check for potential 32-bit counter wrap-around
            const U32_MAX: u64 = u32::MAX as u64;
            if prev > (U32_MAX - 100_000_000) && curr < 100_000_000 {
                // 32-bit counter wrap occurred
                (U32_MAX - prev).saturating_add(curr).saturating_add(1)
            } else {
                // Counter reset occurred (e.g. driver reloaded or interface reset)
                curr
            }
        }
    }

    /// Calculate speed metrics for a given interface identifier.
    /// Returns `None` on the very first observation, then `Some(SpeedMetrics)` on subsequent samples.
    pub fn update(
        &mut self,
        interface_key: &str,
        counters: RawDevCounters,
        now: Instant,
    ) -> Option<SpeedMetrics> {
        if let Some(prev) = self.previous_samples.get_mut(interface_key) {
            let elapsed_secs = now.duration_since(prev.timestamp).as_secs_f64();
            if elapsed_secs <= 0.001 {
                // Prevent division by tiny or zero intervals
                return None;
            }

            let rx_delta = Self::calculate_counter_delta(prev.rx_bytes, counters.rx_bytes);
            let tx_delta = Self::calculate_counter_delta(prev.tx_bytes, counters.tx_bytes);

            let rx_speed_bps = (rx_delta as f64) / elapsed_secs;
            let tx_speed_bps = (tx_delta as f64) / elapsed_secs;

            // Update stored sample
            prev.timestamp = now;
            prev.rx_bytes = counters.rx_bytes;
            prev.tx_bytes = counters.tx_bytes;

            Some(SpeedMetrics {
                rx_speed_bps,
                tx_speed_bps,
                rx_speed_human: format_speed(rx_speed_bps),
                tx_speed_human: format_speed(tx_speed_bps),
                rx_bytes_total: counters.rx_bytes,
                tx_bytes_total: counters.tx_bytes,
                rx_total_human: format_bytes(counters.rx_bytes as f64),
                tx_total_human: format_bytes(counters.tx_bytes as f64),
            })
        } else {
            // First observation: store baseline sample
            self.previous_samples.insert(
                interface_key.to_string(),
                SampleRecord {
                    timestamp: now,
                    rx_bytes: counters.rx_bytes,
                    tx_bytes: counters.tx_bytes,
                },
            );
            None
        }
    }

    /// Reset tracked state for an interface
    pub fn reset_interface(&mut self, interface_key: &str) {
        self.previous_samples.remove(interface_key);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[test]
    fn test_normal_speed_calculation() {
        let mut calc = SpeedCalculator::new();
        let t0 = Instant::now();

        let initial = RawDevCounters {
            rx_bytes: 1_000_000,
            tx_bytes: 500_000,
            ..Default::default()
        };
        assert!(calc.update("eth0", initial, t0).is_none());

        let t1 = t0 + Duration::from_secs(1);
        let sample1 = RawDevCounters {
            rx_bytes: 2_048_576, // + 1,048,576 bytes (exactly 1.00 MB)
            tx_bytes: 600_000,   // + 100,000 bytes (~97.7 KB)
            ..Default::default()
        };

        let metrics = calc
            .update("eth0", sample1, t1)
            .expect("Metrics calculated");
        assert!((metrics.rx_speed_bps - 1_048_576.0).abs() < 1.0);
        assert!((metrics.tx_speed_bps - 100_000.0).abs() < 1.0);
        assert_eq!(metrics.rx_speed_human, "1.00 MB/s");
        assert_eq!(metrics.tx_speed_human, "97.7 KB/s");
    }

    #[test]
    fn test_counter_overflow_wrap() {
        // 32-bit max is 4_294_967_295
        let prev = 4_294_960_000;
        let curr = 10_000; // wrapped around
        let delta = SpeedCalculator::calculate_counter_delta(prev, curr);
        // delta should be (4_294_967_295 - 4_294_960_000) + 10_000 + 1 = 7_295 + 10_000 + 1 = 17_296
        assert_eq!(delta, 17_296);
    }

    #[test]
    fn test_counter_reset_recovery() {
        // Interface reset from 500MB to 50KB
        let prev = 500_000_000;
        let curr = 50_000;
        let delta = SpeedCalculator::calculate_counter_delta(prev, curr);
        assert_eq!(delta, 50_000);
    }

    #[test]
    fn test_format_bytes() {
        assert_eq!(format_bytes(512.0), "512 B");
        assert_eq!(format_bytes(1024.0), "1.0 KB");
        assert_eq!(format_bytes(1024.0 * 1024.0), "1.00 MB");
        assert_eq!(format_bytes(1024.0 * 1024.0 * 1024.0), "1.00 GB");
    }
}
