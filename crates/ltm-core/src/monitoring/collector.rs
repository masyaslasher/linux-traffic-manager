use std::time::Instant;
use tokio::time::{interval, Duration};

use super::state::SharedMonitorState;

/// Start the background monitoring loop in Tokio
pub fn start_monitoring_task(state: SharedMonitorState) -> tokio::task::JoinHandle<()> {
    tokio::spawn(async move {
        let poll_interval_ms = {
            let s = state.lock().unwrap();
            s.config.poll_interval_ms
        };

        let mut timer = interval(Duration::from_millis(poll_interval_ms));

        loop {
            timer.tick().await;
            let now = Instant::now();
            {
                let mut s = state.lock().unwrap();
                s.tick(now);
            }
        }
    })
}
