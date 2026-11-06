use std::collections::HashMap;
use std::fs;
use std::path::Path;

#[derive(Debug, Clone)]
pub struct ProcessMetadata {
    pub pid: u32,
    pub name: String,
    pub executable_path: String,
    pub uid: u32,
    pub username: String,
}

/// Convert a numeric UID to a system username via libc getpwuid
pub fn resolve_username(uid: u32) -> String {
    #[cfg(unix)]
    unsafe {
        let passwd = libc::getpwuid(uid as libc::uid_t);
        if !passwd.is_null() && !(*passwd).pw_name.is_null() {
            std::ffi::CStr::from_ptr((*passwd).pw_name)
                .to_string_lossy()
                .into_owned()
        } else {
            uid.to_string()
        }
    }
    #[cfg(not(unix))]
    {
        if uid == 0 {
            "SYSTEM".to_string()
        } else {
            "User".to_string()
        }
    }
}

/// Read basic metadata for a given process PID
pub fn read_process_metadata(pid: u32) -> Option<ProcessMetadata> {
    let proc_path = Path::new("/proc").join(pid.to_string());
    if !proc_path.is_dir() {
        return None;
    }

    // Process comm name (fallback to cmdline or empty)
    let comm = fs::read_to_string(proc_path.join("comm"))
        .map(|s| s.trim().to_string())
        .unwrap_or_else(|_| "unknown".to_string());

    // Executable path (symlink /proc/[pid]/exe)
    let exe = fs::read_link(proc_path.join("exe"))
        .map(|p| p.to_string_lossy().into_owned())
        .unwrap_or_else(|_| comm.clone());

    // Read UID from /proc/[pid]/status
    let mut uid = 1000;
    if let Ok(status) = fs::read_to_string(proc_path.join("status")) {
        for line in status.lines() {
            if line.starts_with("Uid:") {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 2 {
                    if let Ok(u) = parts[1].parse::<u32>() {
                        uid = u;
                        break;
                    }
                }
            }
        }
    }

    let username = resolve_username(uid);

    Some(ProcessMetadata {
        pid,
        name: comm,
        executable_path: exe,
        uid,
        username,
    })
}

/// Build a map of socket inode -> ProcessMetadata by scanning /proc/[pid]/fd
pub fn scan_socket_inodes_to_processes() -> HashMap<u64, ProcessMetadata> {
    let mut inode_map = HashMap::new();
    let mut process_cache: HashMap<u32, ProcessMetadata> = HashMap::new();

    let proc_entries = match fs::read_dir("/proc") {
        Ok(entries) => entries,
        Err(_) => return inode_map,
    };

    for entry in proc_entries.flatten() {
        let file_name = entry.file_name();
        let name_str = file_name.to_string_lossy();

        // Check if directory name is numeric (PID)
        let pid: u32 = match name_str.parse() {
            Ok(p) => p,
            Err(_) => continue,
        };

        let fd_dir = entry.path().join("fd");
        let fd_entries = match fs::read_dir(fd_dir) {
            Ok(entries) => entries,
            Err(_) => continue, // Permission denied for other users is expected on Linux
        };

        for fd_entry in fd_entries.flatten() {
            let target = match fs::read_link(fd_entry.path()) {
                Ok(t) => t,
                Err(_) => continue,
            };

            let target_str = target.to_string_lossy();
            // Targets look like "socket:[12345]"
            if target_str.starts_with("socket:[") && target_str.ends_with(']') {
                let inode_str = &target_str[8..target_str.len() - 1];
                if let Ok(inode) = inode_str.parse::<u64>() {
                    let meta = process_cache
                        .entry(pid)
                        .or_insert_with(|| {
                            read_process_metadata(pid).unwrap_or(ProcessMetadata {
                                pid,
                                name: format!("pid-{}", pid),
                                executable_path: format!("/proc/{}", pid),
                                uid: 0,
                                username: "unknown".to_string(),
                            })
                        })
                        .clone();

                    inode_map.insert(inode, meta);
                }
            }
        }
    }

    inode_map
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_current_process_metadata() {
        let my_pid = std::process::id();
        let meta = read_process_metadata(my_pid).expect("Current process metadata");
        assert_eq!(meta.pid, my_pid);
        assert!(!meta.name.is_empty());
    }

    #[test]
    fn test_resolve_root_username() {
        let name = resolve_username(0);
        assert_eq!(name, "root");
    }
}
