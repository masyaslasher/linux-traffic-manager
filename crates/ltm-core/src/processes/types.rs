use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum Protocol {
    Tcp,
    Udp,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum SocketState {
    Established,
    SynSent,
    SynRecv,
    FinWait1,
    FinWait2,
    TimeWait,
    Close,
    CloseWait,
    LastAck,
    Listen,
    Closing,
    Unknown,
}

impl SocketState {
    pub fn from_tcp_state_code(code: u8) -> Self {
        match code {
            0x01 => SocketState::Established,
            0x02 => SocketState::SynSent,
            0x03 => SocketState::SynRecv,
            0x04 => SocketState::FinWait1,
            0x05 => SocketState::FinWait2,
            0x06 => SocketState::TimeWait,
            0x07 => SocketState::Close,
            0x08 => SocketState::CloseWait,
            0x09 => SocketState::LastAck,
            0x0A => SocketState::Listen,
            0x0B => SocketState::Closing,
            _ => SocketState::Unknown,
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            SocketState::Established => "ESTABLISHED",
            SocketState::SynSent => "SYN_SENT",
            SocketState::SynRecv => "SYN_RECV",
            SocketState::FinWait1 => "FIN_WAIT1",
            SocketState::FinWait2 => "FIN_WAIT2",
            SocketState::TimeWait => "TIME_WAIT",
            SocketState::Close => "CLOSE",
            SocketState::CloseWait => "CLOSE_WAIT",
            SocketState::LastAck => "LAST_ACK",
            SocketState::Listen => "LISTEN",
            SocketState::Closing => "CLOSING",
            SocketState::Unknown => "UNKNOWN",
        }
    }
}

/// A parsed connection socket
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkConnection {
    pub id: String,
    pub protocol: Protocol,
    pub local_address: String,
    pub local_port: u16,
    pub remote_address: String,
    pub remote_port: u16,
    pub state: SocketState,
    pub inode: u64,
    pub uid: u32,
    pub pid: Option<u32>,
    pub process_name: Option<String>,
    pub user: Option<String>,
    pub first_seen: i64,
}

/// Accuracy status for per-process byte attribution
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ByteAttributionStatus {
    /// Kernel eBPF probe is active and accurately accounting per-process bytes
    EbpfAccurate,
    /// Standard Linux unprivileged socket correlation; per-process byte count is not fabricated
    ConnectionBasedOnly,
    /// Process runs under another user or restricted namespace
    PermissionRestricted,
}

/// Summary of an application utilizing network sockets
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessAppSummary {
    pub pid: u32,
    pub name: String,
    pub executable_path: String,
    pub user: String,
    pub connection_count: usize,
    pub tcp_count: usize,
    pub udp_count: usize,
    pub attribution_status: ByteAttributionStatus,
    pub attribution_notice: String,
}
