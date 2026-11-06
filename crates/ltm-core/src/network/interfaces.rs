use std::collections::HashMap;
use std::fs;
use std::path::Path;

use super::types::{InterfaceState, NetworkInterface, RawDevCounters};

/// Read and parse /proc/net/dev into a map of interface names to raw counters
pub fn parse_proc_net_dev(content: &str) -> HashMap<String, RawDevCounters> {
    let mut interfaces = HashMap::new();

    for line in content.lines() {
        let line = line.trim();
        // Skip header lines
        if line.starts_with("Inter-") || line.starts_with("face") || !line.contains(':') {
            continue;
        }

        let mut parts = line.splitn(2, ':');
        let iface_name = match parts.next() {
            Some(name) => name.trim().to_string(),
            None => continue,
        };

        let counters_str = match parts.next() {
            Some(rest) => rest.trim(),
            None => continue,
        };

        let values: Vec<u64> = counters_str
            .split_whitespace()
            .filter_map(|s| s.parse::<u64>().ok())
            .collect();

        // Standard Linux /proc/net/dev provides 16 numbers:
        // 8 for RX: bytes, packets, errs, drop, fifo, frame, compressed, multicast
        // 8 for TX: bytes, packets, errs, drop, fifo, colls, carrier, compressed
        if values.len() >= 16 {
            let counters = RawDevCounters {
                rx_bytes: values[0],
                rx_packets: values[1],
                rx_errs: values[2],
                rx_drop: values[3],
                tx_bytes: values[8],
                tx_packets: values[9],
                tx_errs: values[10],
                tx_drop: values[11],
            };
            interfaces.insert(iface_name, counters);
        }
    }

    interfaces
}

/// Retrieve IPv4 and IPv6 addresses for all interfaces using libc getifaddrs
#[cfg(unix)]
pub fn get_system_interface_addresses() -> HashMap<String, Vec<String>> {
    let mut map: HashMap<String, Vec<String>> = HashMap::new();

    unsafe {
        let mut ifaddrs_ptr: *mut libc::ifaddrs = std::ptr::null_mut();
        if libc::getifaddrs(&mut ifaddrs_ptr) != 0 || ifaddrs_ptr.is_null() {
            return map;
        }

        let mut current = ifaddrs_ptr;
        while !current.is_null() {
            let ifa = &*current;
            if !ifa.ifa_name.is_null() && !ifa.ifa_addr.is_null() {
                let name = std::ffi::CStr::from_ptr(ifa.ifa_name)
                    .to_string_lossy()
                    .into_owned();

                let family = (*ifa.ifa_addr).sa_family as i32;
                if family == libc::AF_INET {
                    // IPv4
                    let addr_in = &*(ifa.ifa_addr as *const libc::sockaddr_in);
                    let ip = std::net::Ipv4Addr::from(u32::from_be(addr_in.sin_addr.s_addr));
                    map.entry(name).or_default().push(ip.to_string());
                } else if family == libc::AF_INET6 {
                    // IPv6
                    let addr_in6 = &*(ifa.ifa_addr as *const libc::sockaddr_in6);
                    let ip = std::net::Ipv6Addr::from(addr_in6.sin6_addr.s6_addr);
                    // Filter out link-local or raw scope for cleanliness if desired, or keep all
                    map.entry(name).or_default().push(ip.to_string());
                }
            }
            current = ifa.ifa_next;
        }

        libc::freeifaddrs(ifaddrs_ptr);
    }

    map
}

#[cfg(not(unix))]
pub fn get_system_interface_addresses() -> HashMap<String, Vec<String>> {
    HashMap::new()
}

/// Read DNS nameservers from system /etc/resolv.conf
pub fn read_system_dns_servers() -> Vec<String> {
    let mut servers = Vec::new();
    if let Ok(content) = fs::read_to_string("/etc/resolv.conf") {
        for line in content.lines() {
            let line = line.trim();
            if line.starts_with("nameserver") {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 2 && !servers.contains(&parts[1].to_string()) {
                    servers.push(parts[1].to_string());
                }
            }
        }
    }
    servers
}

/// Extra device attributes from /sys/class/net/<name>
#[derive(Debug, Clone, Default)]
pub struct SysfsAttributes {
    pub operstate: InterfaceState,
    pub mac: Option<String>,
    pub speed_mbps: Option<i64>,
    pub mtu: Option<u32>,
    pub carrier: Option<bool>,
    pub duplex: Option<String>,
    pub driver: Option<String>,
}

/// Inspect /sys/class/net/<name> attributes (operstate, speed, address, mtu, carrier, duplex, driver)
pub fn read_sysfs_interface_info(iface_name: &str) -> SysfsAttributes {
    let base_path = Path::new("/sys/class/net").join(iface_name);

    // Read operstate
    let operstate = fs::read_to_string(base_path.join("operstate"))
        .map(|s| InterfaceState::from(s.as_str()))
        .unwrap_or(InterfaceState::Unknown);

    // Read MAC address
    let mac = fs::read_to_string(base_path.join("address"))
        .map(|s| s.trim().to_string())
        .ok()
        .filter(|s| !s.is_empty() && s != "00:00:00:00:00:00");

    // Read speed in Mbps (may fail for virtual or wireless interfaces)
    let speed_mbps = fs::read_to_string(base_path.join("speed"))
        .ok()
        .and_then(|s| s.trim().parse::<i64>().ok())
        .filter(|&spd| spd > 0);

    // Read MTU
    let mtu = fs::read_to_string(base_path.join("mtu"))
        .ok()
        .and_then(|s| s.trim().parse::<u32>().ok());

    // Read carrier state
    let carrier = fs::read_to_string(base_path.join("carrier"))
        .ok()
        .and_then(|s| match s.trim() {
            "1" => Some(true),
            "0" => Some(false),
            _ => None,
        });

    // Read duplex (full/half)
    let duplex = fs::read_to_string(base_path.join("duplex"))
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    // Read driver name if device symlink exists
    let driver = fs::read_link(base_path.join("device/driver"))
        .ok()
        .and_then(|p| p.file_name().map(|n| n.to_string_lossy().to_string()));

    SysfsAttributes {
        operstate,
        mac,
        speed_mbps,
        mtu,
        carrier,
        duplex,
        driver,
    }
}

/// Discover all network interfaces on the current Linux host
pub fn discover_interfaces() -> Vec<NetworkInterface> {
    let dev_content = fs::read_to_string("/proc/net/dev").unwrap_or_default();
    let dev_counters = parse_proc_net_dev(&dev_content);
    let mut addresses = get_system_interface_addresses();
    let dns_servers = read_system_dns_servers();

    // Look up default gateway if discoverable
    let default_gw = crate::diagnostics::discover_default_gateway();

    let mut result = Vec::new();

    for (name, counters) in dev_counters {
        let is_loopback = name == "lo";
        let sysfs = read_sysfs_interface_info(&name);
        let ip_list = addresses.remove(&name).unwrap_or_default();

        let is_up = sysfs.operstate == InterfaceState::Up || (is_loopback && counters.rx_packets > 0);

        let gateway_str = if let Some((ref gw_iface, ref gw_ip)) = default_gw {
            if gw_iface == &name {
                Some(gw_ip.to_string())
            } else {
                None
            }
        } else {
            None
        };

        result.push(NetworkInterface {
            name,
            ip_addresses: ip_list,
            mac_address: sysfs.mac,
            state: sysfs.operstate,
            is_up,
            is_loopback,
            speed_mbps: sysfs.speed_mbps,
            mtu: sysfs.mtu,
            carrier: sysfs.carrier,
            duplex: sysfs.duplex,
            driver: sysfs.driver,
            dns_servers: dns_servers.clone(),
            gateway: gateway_str,
            rx_bytes: counters.rx_bytes,
            tx_bytes: counters.tx_bytes,
            rx_packets: counters.rx_packets,
            tx_packets: counters.tx_packets,
            rx_errors: counters.rx_errs,
            tx_errors: counters.tx_errs,
            rx_dropped: counters.rx_drop,
            tx_dropped: counters.tx_drop,
        });
    }

    // Sort: non-loopback first, then by name
    result.sort_by(|a, b| {
        a.is_loopback
            .cmp(&b.is_loopback)
            .then_with(|| a.name.cmp(&b.name))
    });

    result
}

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE_PROC_DEV: &str = r#"Inter-|   Receive                                                |  Transmit
 face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed
    lo: 16412278   19635    0    0    0     0          0         0 16412278   19635    0    0    0     0       0          0
  eth0: 324756337  271850    0    1    0     0          0       289 135704666  229104    0    0    0     0       0          0
"#;

    #[test]
    fn test_parse_proc_net_dev() {
        let parsed = parse_proc_net_dev(SAMPLE_PROC_DEV);
        assert_eq!(parsed.len(), 2);

        let eth = parsed.get("eth0").expect("eth0 parsed");
        assert_eq!(eth.rx_bytes, 324756337);
        assert_eq!(eth.rx_packets, 271850);
        assert_eq!(eth.rx_errs, 0);
        assert_eq!(eth.rx_drop, 1);
        assert_eq!(eth.tx_bytes, 135704666);
        assert_eq!(eth.tx_packets, 229104);

        let lo = parsed.get("lo").expect("lo parsed");
        assert_eq!(lo.rx_bytes, 16412278);
        assert_eq!(lo.tx_bytes, 16412278);
    }
}
