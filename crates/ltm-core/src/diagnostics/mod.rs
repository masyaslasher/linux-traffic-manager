pub mod dns;
pub mod gateway;
pub mod latency;
pub mod port_check;
pub mod runner;
pub mod traceroute;
pub mod types;

pub use dns::{check_domain_dns, run_dns_checks};
pub use gateway::{check_gateway_reachability, discover_default_gateway};
pub use latency::probe_target_latency;
pub use port_check::check_tcp_port;
pub use runner::run_network_diagnostics;
pub use traceroute::probe_route_hops;
pub use types::{
    DiagnosticReport, DnsCheckResult, GatewayInfo, RouteHop, TargetProbeResult, TcpPortCheckResult,
};
