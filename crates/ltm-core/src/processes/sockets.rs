use std::fs;
use std::net::{Ipv4Addr, Ipv6Addr};

use super::types::{NetworkConnection, Protocol, SocketState};

/// Parse a 32-bit hex IPv4 address from /proc/net/tcp
pub fn parse_ipv4_hex(hex_str: &str) -> Option<Ipv4Addr> {
    let val = u32::from_str_radix(hex_str, 16).ok()?;
    let b1 = (val & 0xFF) as u8;
    let b2 = ((val >> 8) & 0xFF) as u8;
    let b3 = ((val >> 16) & 0xFF) as u8;
    let b4 = ((val >> 24) & 0xFF) as u8;
    Some(Ipv4Addr::new(b1, b2, b3, b4))
}

/// Parse a 128-bit hex IPv6 address from /proc/net/tcp6
pub fn parse_ipv6_hex(hex_str: &str) -> Option<Ipv6Addr> {
    if hex_str.len() != 32 {
        return None;
    }

    let mut bytes = [0u8; 16];
    for i in 0..4 {
        let chunk = &hex_str[i * 8..(i + 1) * 8];
        let word = u32::from_str_radix(chunk, 16).ok()?;
        // In Linux /proc/net/tcp6, each 32-bit word is written in little-endian
        let word_bytes = word.to_ne_bytes();
        bytes[i * 4..(i + 1) * 4].copy_from_slice(&word_bytes);
    }

    Some(Ipv6Addr::from(bytes))
}

/// Parse socket endpoint "ADDRESS:PORT"
fn parse_endpoint(endpoint: &str, is_ipv6: bool) -> Option<(String, u16)> {
    let mut parts = endpoint.split(':');
    let addr_hex = parts.next()?;
    let port_hex = parts.next()?;

    let port = u16::from_str_radix(port_hex, 16).ok()?;
    let addr_str = if is_ipv6 {
        parse_ipv6_hex(addr_hex)
            .map(|ip| ip.to_string())
            .unwrap_or_else(|| "::".to_string())
    } else {
        parse_ipv4_hex(addr_hex)
            .map(|ip| ip.to_string())
            .unwrap_or_else(|| "0.0.0.0".to_string())
    };

    Some((addr_str, port))
}

/// Parse contents of /proc/net/tcp, tcp6, udp, or udp6
pub fn parse_proc_net_sockets(
    content: &str,
    protocol: Protocol,
    is_ipv6: bool,
    now: i64,
) -> Vec<NetworkConnection> {
    let mut connections = Vec::new();

    for line in content.lines() {
        let line = line.trim();
        // Skip header line
        if line.starts_with("sl") || line.is_empty() {
            continue;
        }

        let parts: Vec<&str> = line.split_whitespace().collect();
        // Standard Linux socket lines have at least 10 fields:
        // 0: sl, 1: local_address, 2: rem_address, 3: st, 4: tx_queue:rx_queue,
        // 5: tr:tm->when, 6: retrnsmt, 7: uid, 8: timeout, 9: inode
        if parts.len() < 10 {
            continue;
        }

        let local_ep = parts[1];
        let rem_ep = parts[2];
        let state_hex = parts[3];
        let uid_str = parts[7];
        let inode_str = parts[9];

        let (local_address, local_port) = match parse_endpoint(local_ep, is_ipv6) {
            Some(ep) => ep,
            None => continue,
        };

        let (remote_address, remote_port) = match parse_endpoint(rem_ep, is_ipv6) {
            Some(ep) => ep,
            None => continue,
        };

        let state_code = u8::from_str_radix(state_hex, 16).unwrap_or(0);
        let state = if protocol == Protocol::Udp {
            // UDP is connectionless; state 07 is CLOSE/UNCONNECTED
            if state_code == 0x07 && remote_port == 0 {
                SocketState::Listen
            } else {
                SocketState::Established
            }
        } else {
            SocketState::from_tcp_state_code(state_code)
        };

        let uid = uid_str.parse::<u32>().unwrap_or(0);
        let inode = inode_str.parse::<u64>().unwrap_or(0);

        let id = format!(
            "{:?}-{}:{}-{}:{}-{}",
            protocol, local_address, local_port, remote_address, remote_port, inode
        );

        connections.push(NetworkConnection {
            id,
            protocol,
            local_address,
            local_port,
            remote_address,
            remote_port,
            remote_hostname: None,
            state,
            inode,
            uid,
            pid: None,
            process_name: None,
            user: None,
            first_seen: now,
        });
    }

    connections
}

/// Read all active Linux network sockets from /proc/net
pub fn read_all_system_sockets(now: i64) -> Vec<NetworkConnection> {
    let mut all = Vec::new();

    // TCP IPv4
    if let Ok(c) = fs::read_to_string("/proc/net/tcp") {
        all.extend(parse_proc_net_sockets(&c, Protocol::Tcp, false, now));
    }
    // TCP IPv6
    if let Ok(c) = fs::read_to_string("/proc/net/tcp6") {
        all.extend(parse_proc_net_sockets(&c, Protocol::Tcp, true, now));
    }
    // UDP IPv4
    if let Ok(c) = fs::read_to_string("/proc/net/udp") {
        all.extend(parse_proc_net_sockets(&c, Protocol::Udp, false, now));
    }
    // UDP IPv6
    if let Ok(c) = fs::read_to_string("/proc/net/udp6") {
        all.extend(parse_proc_net_sockets(&c, Protocol::Udp, true, now));
    }

    all
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_ipv4_hex() {
        // 0100007F should be 127.0.0.1
        let ip = parse_ipv4_hex("0100007F").expect("Valid IPv4");
        assert_eq!(ip.to_string(), "127.0.0.1");

        // 00000000 should be 0.0.0.0
        let ip_zero = parse_ipv4_hex("00000000").expect("Valid IPv4");
        assert_eq!(ip_zero.to_string(), "0.0.0.0");
    }

    #[test]
    fn test_parse_proc_net_tcp_sample() {
        let sample = r#"  sl  local_address rem_address   st tx_queue rx_queue tr tm->when retrnsmt   uid  timeout inode                                                     
   0: 0100007F:916D 00000000:0000 0A 00000000:00000000 00:00000000 00000000  1000        0 42806 1 000000009652a461 100 0 0 10 0                     
   1: 3600007F:0035 00000000:0000 0A 00000000:00000000 00:00000000 00000000   193        0 10721 1 0000000041c72f1e 100 0 0 10 5                     
"#;
        let conns = parse_proc_net_sockets(sample, Protocol::Tcp, false, 1700000000);
        assert_eq!(conns.len(), 2);

        let c0 = &conns[0];
        assert_eq!(c0.protocol, Protocol::Tcp);
        assert_eq!(c0.local_address, "127.0.0.1");
        assert_eq!(c0.local_port, 37229);
        assert_eq!(c0.remote_address, "0.0.0.0");
        assert_eq!(c0.remote_port, 0);
        assert_eq!(c0.state, SocketState::Listen);
        assert_eq!(c0.inode, 42806);
        assert_eq!(c0.uid, 1000);

        let c1 = &conns[1];
        assert_eq!(c1.local_port, 53);
        assert_eq!(c1.inode, 10721);
    }
}
