use std::time::Instant;
use tokio::net::lookup_host;
use tokio::time::{timeout, Duration};

use super::types::DnsCheckResult;

/// Check DNS resolution for a specific domain with a timeout
pub async fn check_domain_dns(domain: &str) -> DnsCheckResult {
    let host_port = format!("{}:443", domain);
    let start = Instant::now();

    // 2-second timeout on DNS lookup
    let lookup_result = timeout(Duration::from_millis(2000), lookup_host(host_port)).await;

    match lookup_result {
        Ok(Ok(addrs)) => {
            let elapsed_ms = start.elapsed().as_secs_f64() * 1000.0;
            let ips: Vec<String> = addrs.map(|a| a.ip().to_string()).collect();

            if ips.is_empty() {
                DnsCheckResult {
                    domain: domain.to_string(),
                    is_working: false,
                    latency_ms: elapsed_ms,
                    resolved_ips: Vec::new(),
                    error: Some("No IP addresses returned".to_string()),
                }
            } else {
                DnsCheckResult {
                    domain: domain.to_string(),
                    is_working: true,
                    latency_ms: elapsed_ms,
                    resolved_ips: ips,
                    error: None,
                }
            }
        }
        Ok(Err(e)) => {
            let elapsed_ms = start.elapsed().as_secs_f64() * 1000.0;
            DnsCheckResult {
                domain: domain.to_string(),
                is_working: false,
                latency_ms: elapsed_ms,
                resolved_ips: Vec::new(),
                error: Some(e.to_string()),
            }
        }
        Err(_) => DnsCheckResult {
            domain: domain.to_string(),
            is_working: false,
            latency_ms: 2000.0,
            resolved_ips: Vec::new(),
            error: Some("DNS resolution timed out (>2000ms)".to_string()),
        },
    }
}

/// Run DNS checks against a set of reliable domains
pub async fn run_dns_checks(domains: &[&str]) -> Vec<DnsCheckResult> {
    let mut tasks = Vec::new();

    for &domain in domains {
        tasks.push(check_domain_dns(domain));
    }

    futures::future::join_all(tasks).await
}

mod futures {
    pub mod future {
        use std::future::Future;

        pub async fn join_all<F>(futures: Vec<F>) -> Vec<F::Output>
        where
            F: Future,
        {
            let mut results = Vec::with_capacity(futures.len());
            for f in futures {
                results.push(f.await);
            }
            results
        }
    }
}
