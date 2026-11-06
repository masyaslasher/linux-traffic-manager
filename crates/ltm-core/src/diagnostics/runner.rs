use chrono::Utc;
use std::net::SocketAddr;
use std::time::Duration;

use super::dns::run_dns_checks;
use super::gateway::{check_gateway_reachability, discover_default_gateway};
use super::latency::probe_target_latency;
use super::types::{DiagnosticReport, GatewayInfo};

/// Execute complete network diagnostics suite
pub async fn run_network_diagnostics() -> DiagnosticReport {
    let now_ts = Utc::now().timestamp();

    // 1. Gateway discovery and check
    let gateway_info: Option<GatewayInfo> = if let Some((iface, ip)) = discover_default_gateway() {
        Some(check_gateway_reachability(&iface, ip).await)
    } else {
        None
    };

    // 2. DNS checks on primary domains
    let default_domains = ["cloudflare.com", "google.com", "kernel.org"];
    let dns_results = run_dns_checks(&default_domains).await;

    let successful_dns = dns_results.iter().filter(|d| d.is_working).count();
    let avg_dns_latency: f64 = if successful_dns > 0 {
        dns_results
            .iter()
            .filter(|d| d.is_working)
            .map(|d| d.latency_ms)
            .sum::<f64>()
            / successful_dns as f64
    } else {
        0.0
    };

    let dns_status = if successful_dns == dns_results.len() {
        if avg_dns_latency > 300.0 {
            "Slow".to_string()
        } else {
            "Working".to_string()
        }
    } else if successful_dns > 0 {
        "Degraded".to_string()
    } else {
        "Failing".to_string()
    };

    // 3. Latency & Packet loss probes
    // Cloudflare DNS 1.1.1.1:53 and Google DNS 8.8.8.8:53
    let probe_targets: Vec<SocketAddr> =
        vec![SocketAddr::from(([1, 1, 1, 1], 53)), SocketAddr::from(([8, 8, 8, 8], 53))];

    let mut probe_results = Vec::new();
    for target in probe_targets {
        let res = probe_target_latency(target, 4, Duration::from_millis(500)).await;
        probe_results.push(res);
    }

    let mut total_probes = 0;
    let mut total_successful = 0;
    let mut latency_sum = 0.0;
    let mut latency_count = 0;

    for p in &probe_results {
        total_probes += p.total_probes;
        total_successful += p.successful_probes;
        if let Some(avg) = p.avg_latency_ms {
            latency_sum += avg;
            latency_count += 1;
        }
    }

    let overall_packet_loss = if total_probes > 0 {
        ((total_probes - total_successful) as f64 / total_probes as f64) * 100.0
    } else {
        100.0
    };

    let overall_avg_latency = if latency_count > 0 {
        latency_sum / latency_count as f64
    } else {
        0.0
    };

    // Synthesize overall network state and actionable recommendations
    let mut issues = Vec::new();
    let mut recommendations = Vec::new();

    if let Some(ref gw) = gateway_info {
        if !gw.is_reachable {
            issues.push("Default router / gateway is not answering local probes".to_string());
            recommendations.push("Check physical cable connection or Wi-Fi router status".to_string());
        }
    } else {
        issues.push("No default network route configured on this system".to_string());
        recommendations.push("Reconnect to your Wi-Fi or wired network interface".to_string());
    }

    if successful_dns == 0 {
        issues.push("DNS resolution completely failing across all test domains".to_string());
        recommendations.push("Verify system DNS servers in /etc/resolv.conf or switch to 1.1.1.1 / 8.8.8.8".to_string());
    } else if successful_dns < dns_results.len() {
        issues.push("Some domains failed DNS resolution (partial degradation)".to_string());
    }

    if overall_packet_loss > 15.0 {
        issues.push(format!("High packet loss detected ({:.1}%)", overall_packet_loss));
        recommendations.push("Investigate channel interference, heavy local downloads, or ISP issues".to_string());
    }

    if overall_avg_latency > 150.0 {
        issues.push(format!("High latency observed ({:.0} ms)", overall_avg_latency));
        recommendations.push("High network queueing (bufferbloat) or remote server congestion".to_string());
    }

    let summary = if issues.is_empty() {
        format!("All network systems operating optimally. Average latency: {:.1} ms, DNS response: {:.1} ms.", overall_avg_latency, avg_dns_latency)
    } else {
        format!("Detected {} potential issue(s). Review recommendations below.", issues.len())
    };

    let network_status = if total_successful > 0 && successful_dns > 0 {
        if overall_packet_loss > 30.0 || successful_dns < dns_results.len() {
            "Degraded".to_string()
        } else {
            "Connected".to_string()
        }
    } else if gateway_info
        .as_ref()
        .map(|g| g.is_reachable)
        .unwrap_or(false)
    {
        "Gateway Only".to_string()
    } else {
        "Offline".to_string()
    };

    DiagnosticReport {
        timestamp: now_ts,
        network_status,
        dns_status,
        dns_latency_ms: avg_dns_latency,
        gateway: gateway_info,
        average_latency_ms: overall_avg_latency,
        packet_loss_percent: overall_packet_loss,
        dns_checks: dns_results,
        probes: probe_results,
        summary,
        issues_found: issues,
        recommendations,
    }
}
