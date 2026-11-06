use std::time::{Duration, Instant};
use tokio::net::TcpStream;
use tokio::time::timeout;

use super::types::TcpPortCheckResult;

/// Probe a remote TCP host and port with configurable timeout
pub async fn check_tcp_port(target: &str, port: u16, timeout_ms: u64) -> TcpPortCheckResult {
    let host_port = format!("{}:{}", target, port);

    let lookup_res = timeout(
        Duration::from_millis(timeout_ms),
        tokio::net::lookup_host(host_port),
    )
    .await;

    match lookup_res {
        Ok(Ok(mut addrs)) => {
            if let Some(addr) = addrs.next() {
                let conn_start = Instant::now();
                match timeout(Duration::from_millis(timeout_ms), TcpStream::connect(addr)).await {
                    Ok(Ok(_stream)) => {
                        let latency = conn_start.elapsed().as_secs_f64() * 1000.0;
                        TcpPortCheckResult {
                            target: target.to_string(),
                            port,
                            is_open: true,
                            latency_ms: Some(latency),
                            error: None,
                        }
                    }
                    Ok(Err(err)) => TcpPortCheckResult {
                        target: target.to_string(),
                        port,
                        is_open: false,
                        latency_ms: None,
                        error: Some(err.to_string()),
                    },
                    Err(_) => TcpPortCheckResult {
                        target: target.to_string(),
                        port,
                        is_open: false,
                        latency_ms: None,
                        error: Some("Connection timed out".to_string()),
                    },
                }
            } else {
                TcpPortCheckResult {
                    target: target.to_string(),
                    port,
                    is_open: false,
                    latency_ms: None,
                    error: Some("Unable to resolve hostname".to_string()),
                }
            }
        }
        Ok(Err(err)) => TcpPortCheckResult {
            target: target.to_string(),
            port,
            is_open: false,
            latency_ms: None,
            error: Some(format!("DNS resolution failed: {err}")),
        },
        Err(_) => TcpPortCheckResult {
            target: target.to_string(),
            port,
            is_open: false,
            latency_ms: None,
            error: Some("DNS resolution timed out".to_string()),
        },
    }
}
