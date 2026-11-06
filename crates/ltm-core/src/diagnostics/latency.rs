use std::net::SocketAddr;
use std::time::Instant;
use tokio::net::TcpStream;
use tokio::time::{sleep, timeout, Duration};

use super::types::TargetProbeResult;

/// Probe a single target multiple times to measure latency and packet loss
pub async fn probe_target_latency(
    target_addr: SocketAddr,
    count: usize,
    timeout_duration: Duration,
) -> TargetProbeResult {
    let mut successful = 0;
    let mut latencies: Vec<f64> = Vec::with_capacity(count);

    for _ in 0..count {
        let start = Instant::now();
        match timeout(timeout_duration, TcpStream::connect(&target_addr)).await {
            Ok(Ok(_)) => {
                let ms = start.elapsed().as_secs_f64() * 1000.0;
                successful += 1;
                latencies.push(ms);
            }
            Ok(Err(ref e)) if e.kind() == std::io::ErrorKind::ConnectionRefused => {
                // Connection Refused means host responded with TCP RST; host is reachable
                let ms = start.elapsed().as_secs_f64() * 1000.0;
                successful += 1;
                latencies.push(ms);
            }
            _ => {
                // Timeout or network unreachable
            }
        }
        sleep(Duration::from_millis(50)).await;
    }

    let min_latency_ms = latencies.iter().copied().reduce(f64::min);
    let max_latency_ms = latencies.iter().copied().reduce(f64::max);
    let avg_latency_ms = if !latencies.is_empty() {
        Some(latencies.iter().sum::<f64>() / latencies.len() as f64)
    } else {
        None
    };

    let loss_count = count.saturating_sub(successful);
    let packet_loss_percent = (loss_count as f64 / count as f64) * 100.0;

    TargetProbeResult {
        target: target_addr.to_string(),
        successful_probes: successful,
        total_probes: count,
        min_latency_ms,
        max_latency_ms,
        avg_latency_ms,
        packet_loss_percent,
    }
}
