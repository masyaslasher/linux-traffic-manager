use std::time::Instant;
use tokio::time::{interval, Duration};

use super::state::SharedMonitorState;

/// Start the background monitoring loop on a dedicated thread with its own Tokio runtime.
pub fn start_monitoring_task(state: SharedMonitorState) -> std::thread::JoinHandle<()> {
    std::thread::Builder::new()
        .name("ltm-collector".to_string())
        .spawn(move || {
            let rt = match tokio::runtime::Builder::new_current_thread().enable_time().build() {
                Ok(rt) => rt,
                Err(err) => {
                    log::error!("Failed to initialize tokio runtime for collector: {err}");
                    return;
                }
            };

            rt.block_on(async move {
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
            });
        })
        .expect("failed to spawn ltm-collector thread")
}
