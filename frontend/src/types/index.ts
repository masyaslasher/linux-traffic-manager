export type NavigationTab =
  | 'dashboard'
  | 'applications'
  | 'connections'
  | 'analytics'
  | 'diagnostics'
  | 'automation'
  | 'bandwidth'
  | 'interfaces'
  | 'history'
  | 'settings';

export type ThemeMode = 'dark' | 'amoled' | 'light' | 'graphite' | 'slate' | 'custom';
export type InterfaceDensity = 'compact' | 'normal' | 'spacious';
export type SpeedUnit = 'bytes' | 'bits';

export type InterfaceState = 'up' | 'down' | 'unknown';

export interface NetworkInterface {
  name: string;
  ip_addresses: string[];
  mac_address: string | null;
  state: InterfaceState;
  is_up: boolean;
  is_loopback: boolean;
  speed_mbps: number | null;
  mtu?: number | null;
  carrier?: boolean | null;
  duplex?: string | null;
  driver?: string | null;
  dns_servers?: string[];
  gateway?: string | null;
  rx_bytes: number;
  tx_bytes: number;
  rx_packets: number;
  tx_packets: number;
  rx_errors: number;
  tx_errors: number;
  rx_dropped: number;
  tx_dropped: number;
}

export interface SpeedMetrics {
  rx_speed_bps: number;
  tx_speed_bps: number;
  rx_speed_human: string;
  tx_speed_human: string;
  rx_speed_bits_human?: string;
  tx_speed_bits_human?: string;
  rx_bytes_total: number;
  tx_bytes_total: number;
  rx_total_human: string;
  tx_total_human: string;
  peak_rx_speed_bps?: number;
  peak_tx_speed_bps?: number;
  peak_rx_speed_human?: string;
  peak_tx_speed_human?: string;
  avg_rx_speed_bps?: number;
  avg_tx_speed_bps?: number;
  avg_rx_speed_human?: string;
  avg_tx_speed_human?: string;
  active_connections?: number;
  tcp_connections?: number;
  udp_connections?: number;
  connection_uptime_secs?: number;
  bandwidth_utilization_percent?: number | null;
}

export interface TrafficHistoryPoint {
  timestamp: number;
  rx_speed_bps: number;
  tx_speed_bps: number;
  rx_speed_human: string;
  tx_speed_human: string;
}

export type Protocol = 'TCP' | 'UDP';

export type SocketState =
  | 'ESTABLISHED'
  | 'SYN_SENT'
  | 'SYN_RECV'
  | 'FIN_WAIT1'
  | 'FIN_WAIT2'
  | 'TIME_WAIT'
  | 'CLOSE'
  | 'CLOSE_WAIT'
  | 'LAST_ACK'
  | 'LISTEN'
  | 'CLOSING'
  | 'UNKNOWN';

export interface NetworkConnection {
  id: string;
  protocol: Protocol;
  local_address: string;
  local_port: number;
  remote_address: string;
  remote_port: number;
  remote_hostname?: string | null;
  state: SocketState;
  inode: number;
  uid: number;
  pid: number | null;
  process_name: string | null;
  user: string | null;
  first_seen: number;
}

export type ByteAttributionStatus =
  | 'ebpf_accurate'
  | 'connection_based_only'
  | 'permission_restricted';

export interface ProcessAppSummary {
  pid: number;
  name: string;
  executable_path: string;
  user: string;
  connection_count: number;
  tcp_count: number;
  udp_count: number;
  attribution_status: ByteAttributionStatus;
  attribution_notice: string;
  remote_endpoints?: string[];
}

export interface GatewayInfo {
  interface: string;
  gateway_ip: string;
  is_reachable: boolean;
  latency_ms: number | null;
}

export interface DnsCheckResult {
  domain: string;
  is_working: boolean;
  latency_ms: number;
  resolved_ips: string[];
  error: string | null;
}

export interface TargetProbeResult {
  target: string;
  successful_probes: number;
  total_probes: number;
  min_latency_ms: number | null;
  max_latency_ms: number | null;
  avg_latency_ms: number | null;
  packet_loss_percent: number;
}

export interface TcpPortCheckResult {
  target: string;
  port: number;
  is_open: boolean;
  latency_ms: number | null;
  error: string | null;
}

export interface RouteHop {
  hop: number;
  ip: string | null;
  rtt_ms: number | null;
  status: string;
}

export interface DiagnosticReport {
  timestamp: number;
  network_status: string;
  dns_status: string;
  dns_latency_ms: number;
  gateway: GatewayInfo | null;
  average_latency_ms: number;
  packet_loss_percent: number;
  dns_checks: DnsCheckResult[];
  probes: TargetProbeResult[];
  summary?: string;
  issues_found?: string[];
  recommendations?: string[];
}

export interface StoredTrafficSample {
  id: number | null;
  timestamp: number;
  interface_name: string;
  rx_speed_bps: number;
  tx_speed_bps: number;
  rx_bytes_total: number;
  tx_bytes_total: number;
}

export interface StoredDiagnosticReport {
  id: number | null;
  timestamp: number;
  network_status: string;
  dns_status: string;
  avg_latency_ms: number;
  packet_loss_percent: number;
  raw_json: string;
}

export interface PermissionReport {
  is_root: boolean;
  uid: number;
  can_read_proc_net_dev: boolean;
  can_read_proc_net_tcp: boolean;
  can_read_proc_net_route: boolean;
  can_read_proc_fds: boolean;
  ebpf_supported: boolean;
  security_notice: string;
}

export interface StoredAutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger_type: string;
  condition_json: string;
  action_type: string;
  action_params_json: string;
  cooldown_secs: number;
  last_triggered_ts: number;
  trigger_count: number;
}

export interface StoredAlertEvent {
  id: number | null;
  timestamp: number;
  rule_id: string | null;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  acknowledged: boolean;
}

export interface StoredUserProfile {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  settings_json: string;
}

export interface AppAppearanceSettings {
  theme: ThemeMode;
  density: InterfaceDensity;
  speedUnit: SpeedUnit;
  accentColor: string;
  fontSize: 'small' | 'normal' | 'large';
  animations: boolean;
  borderRadius: 'none' | 'small' | 'medium' | 'rounded';
}
