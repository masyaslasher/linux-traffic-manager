pub mod interfaces;
pub mod speed;
pub mod types;

pub use interfaces::discover_interfaces;
pub use speed::{format_bytes, format_speed, SpeedCalculator};
pub use types::{
    InterfaceState, NetworkInterface, RawDevCounters, SpeedMetrics, TrafficHistoryPoint,
};
