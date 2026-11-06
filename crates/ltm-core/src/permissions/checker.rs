use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionReport {
    pub is_root: bool,
    pub uid: u32,
    pub can_read_proc_net_dev: bool,
    pub can_read_proc_net_tcp: bool,
    pub can_read_proc_net_route: bool,
    pub can_read_proc_fds: bool,
    pub ebpf_supported: bool,
    pub security_notice: String,
}

/// Inspect current process permissions and Linux environment capabilities
pub fn inspect_permissions() -> PermissionReport {
    #[cfg(unix)]
    let uid = unsafe { libc::getuid() };
    #[cfg(not(unix))]
    let uid = 1000;

    let is_root = uid == 0;

    let can_read_proc_net_dev =
        Path::new("/proc/net/dev").exists() && fs::read_to_string("/proc/net/dev").is_ok();
    let can_read_proc_net_tcp =
        Path::new("/proc/net/tcp").exists() && fs::read_to_string("/proc/net/tcp").is_ok();
    let can_read_proc_net_route =
        Path::new("/proc/net/route").exists() && fs::read_to_string("/proc/net/route").is_ok();

    // Check if we can read our own /proc/self/fd
    let can_read_proc_fds =
        Path::new("/proc/self/fd").exists() && fs::read_dir("/proc/self/fd").is_ok();

    // Check if eBPF filesystem /sys/fs/bpf exists
    let ebpf_supported = Path::new("/sys/fs/bpf").exists();

    let security_notice = if is_root {
        "Running as root is not recommended for desktop graphical applications. LTM functions safely with standard user privileges.".to_string()
    } else {
        "Running safely as unprivileged desktop user. All interface metrics and user socket connections are monitored without root access.".to_string()
    };

    PermissionReport {
        is_root,
        uid,
        can_read_proc_net_dev,
        can_read_proc_net_tcp,
        can_read_proc_net_route,
        can_read_proc_fds,
        ebpf_supported,
        security_notice,
    }
}
