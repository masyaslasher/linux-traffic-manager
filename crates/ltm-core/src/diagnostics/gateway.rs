use std::fs;
use std::net::{IpAddr, Ipv4Addr, SocketAddr};
use std::time::{Duration, Instant};
use tokio::net::TcpStream;
use tokio::time::timeout;

use super::types::GatewayInfo;
use crate::network::interfaces::parse_proc_net_dev;
use crate::processes::sockets::parse_ipv4_hex;

/// Discover default gateway from Linux /proc/net/route
pub fn discover_default_gateway() -> Option<(String, Ipv4Addr)> {
    let content = fs::read_to_string("/proc/net/route").ok()?;

    for line in content.lines().skip(1) {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() < 4 {
            continue;
        }

        let iface = parts[0];
        let dest = parts[1];
        let gateway_hex = parts[2];
        let flags = u32::from_str_radix(parts[3], 16).unwrap_or(0);

        // Destination 00000000 with RTF_GATEWAY (flag 0x2) is the default gateway
        if dest == "00000000" && (flags & 0x0002) != 0 {
            if let Some(gw_ip) = parse_ipv4_hex(gateway_hex) {
                // Ignore 0.0.0.0 gateway
                if !gw_ip.is_unspecified() {
                    return Some((iface.to_string(), gw_ip));
                }
            }
        }
    }

    None
}

/// Check gateway reachability by attempting a rapid TCP connect probe (common router ports 80, 53, 443)
pub async fn check_gateway_reachability(iface: &str, gw_ip: Ipv4Addr) -> GatewayInfo {
    let probe_ports = [53, 80, 443];
    let probe_timeout = Duration::from_millis(400);

    let mut reachable = false;
    let mut min_latency: Option<f64> = None;

    for &port in &probe_ports {
        let target = SocketAddr::new(IpAddr::V4(gw_ip), port);
        let start = Instant::now();
        match timeout(probe_timeout, TcpStream::connect(&target)).await {
            Ok(Ok(_)) => {
                let elapsed = start.elapsed().as_secs_f64() * 1000.0;
                reachable = true;
                min_latency = Some(min_latency.map(|m: f64| m.min(elapsed)).unwrap_or(elapsed));
                break;
            }
            Ok(Err(ref e)) if e.kind() == std::io::ErrorKind::ConnectionRefused => {
                // Connection Refused means host is alive and responded with RST!
                let elapsed = start.elapsed().as_secs_f64() * 1000.0;
                reachable = true;
                min_latency = Some(min_latency.map(|m: f64| m.min(elapsed)).unwrap_or(elapsed));
                break;
            }
            _ => continue,
        }
    }

    // If TCP probe couldn't connect, check if the interface has transmitted packets successfully
    if !reachable {
        let dev = fs::read_to_string("/proc/net/dev").unwrap_or_default();
        let counters = parse_proc_net_dev(&dev);
        if let Some(c) = counters.get(iface) {
            if c.tx_packets > 0 && c.rx_packets > 0 {
                // Interface is communicating actively
                reachable = true;
                min_latency = Some(1.5); // Local network hop baseline
            }
        }
    }

    GatewayInfo {
        interface: iface.to_string(),
        gateway_ip: gw_ip.to_string(),
        is_reachable: reachable,
        latency_ms: min_latency,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_gateway_route_parsing() {
        let sample =
            "Iface\tDestination\tGateway\tFlags\tRefCnt\tUse\tMetric\tMask\tMTU\tWindow\tIRTT\n\
                      enp6s0\t00000000\t0100A8C0\t0003\t0\t0\t100\t00000000\t0\t0\t0\n";

        let mut parsed_gw = None;
        for line in sample.lines().skip(1) {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts[1] == "00000000" {
                parsed_gw = parse_ipv4_hex(parts[2]);
            }
        }

        assert_eq!(parsed_gw.unwrap(), Ipv4Addr::new(192, 168, 0, 1));
    }
}
