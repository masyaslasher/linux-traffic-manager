pub mod interfaces;
pub mod speed;
pub mod types;

pub use interfaces::discover_interfaces;
pub use speed::{format_bits, format_bytes, format_speed, format_speed_bits, SpeedCalculator};
pub use types::{
    InterfaceState, NetworkInterface, RawDevCounters, SpeedMetrics, TrafficHistoryPoint,
};
