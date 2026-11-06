import {
  DiagnosticReport,
  NetworkConnection,
  NetworkInterface,
  PermissionReport,
  ProcessAppSummary,
  SpeedMetrics,
  StoredDiagnosticReport,
  StoredTrafficSample,
  TrafficHistoryPoint,
} from '../types';

export const mockInterfaces: NetworkInterface[] = [
  {
    name: 'eth0',
    ip_addresses: ['10.0.0.15', 'fe80::1ff:fe00:1'],
    mac_address: '52:54:00:12:34:56',
    state: 'up',
    is_up: true,
    is_loopback: false,
    speed_mbps: 1000,
    rx_bytes: 345829120,
    tx_bytes: 142859100,
    rx_packets: 285910,
    tx_packets: 235100,
    rx_errors: 0,
    tx_errors: 0,
    rx_dropped: 1,
    tx_dropped: 0,
  },
  {
    name: 'lo',
    ip_addresses: ['127.0.0.1', '::1'],
    mac_address: null,
    state: 'up',
    is_up: true,
    is_loopback: true,
    speed_mbps: null,
    rx_bytes: 16412278,
    tx_bytes: 16412278,
    rx_packets: 19635,
    tx_packets: 19635,
    rx_errors: 0,
    tx_errors: 0,
    rx_dropped: 0,
    tx_dropped: 0,
  },
];

export const mockSpeedMetrics: SpeedMetrics = {
  rx_speed_bps: 1258291.0,
  tx_speed_bps: 245100.0,
  rx_speed_human: '1.20 MB/s',
  tx_speed_human: '239.4 KB/s',
  rx_bytes_total: 345829120,
  tx_bytes_total: 142859100,
  rx_total_human: '329.8 MB',
  tx_total_human: '136.2 MB',
};

export const generateMockHistoryPoints = (): TrafficHistoryPoint[] => {
  const points: TrafficHistoryPoint[] = [];
  const now = Math.floor(Date.now() / 1000);
  for (let i = 59; i >= 0; i--) {
    const rx = 800000 + Math.sin(i / 5) * 500000 + Math.random() * 200000;
    const tx = 200000 + Math.cos(i / 4) * 100000 + Math.random() * 50000;
    points.push({
      timestamp: now - i,
      rx_speed_bps: Math.max(0, rx),
      tx_speed_bps: Math.max(0, tx),
      rx_speed_human: `${(rx / (1024 * 1024)).toFixed(2)} MB/s`,
      tx_speed_human: `${(tx / 1024).toFixed(1)} KB/s`,
    });
  }
  return points;
};

export const mockConnections: NetworkConnection[] = [
  {
    id: 'TCP-10.0.0.15:52310-142.250.180.206:443-42806',
    protocol: 'TCP',
    local_address: '10.0.0.15',
    local_port: 52310,
    remote_address: '142.250.180.206',
    remote_port: 443,
    state: 'ESTABLISHED',
    inode: 42806,
    uid: 1000,
    pid: 5154,
    process_name: 'firefox',
    user: 'user',
    first_seen: Math.floor(Date.now() / 1000) - 300,
  },
  {
    id: 'TCP-127.0.0.1:37229-0.0.0.0:0-91338',
    protocol: 'TCP',
    local_address: '127.0.0.1',
    local_port: 37229,
    remote_address: '0.0.0.0',
    remote_port: 0,
    state: 'LISTEN',
    inode: 91338,
    uid: 1000,
    pid: 3201,
    process_name: 'code',
    user: 'user',
    first_seen: Math.floor(Date.now() / 1000) - 1800,
  },
  {
    id: 'UDP-10.0.0.15:5353-224.0.0.251:5353-10705',
    protocol: 'UDP',
    local_address: '10.0.0.15',
    local_port: 5353,
    remote_address: '224.0.0.251',
    remote_port: 5353,
    state: 'ESTABLISHED',
    inode: 10705,
    uid: 193,
    pid: 840,
    process_name: 'avahi-daemon',
    user: 'avahi',
    first_seen: Math.floor(Date.now() / 1000) - 7200,
  },
];

export const mockApplications: ProcessAppSummary[] = [
  {
    pid: 5154,
    name: 'firefox',
    executable_path: '/usr/lib64/firefox/firefox',
    user: 'user',
    connection_count: 14,
    tcp_count: 14,
    udp_count: 0,
    attribution_status: 'connection_based_only',
    attribution_notice: 'Socket correlation active. eBPF kernel accounting required for per-process byte streaming.',
  },
  {
    pid: 3201,
    name: 'code',
    executable_path: '/usr/share/code/code',
    user: 'user',
    connection_count: 6,
    tcp_count: 6,
    udp_count: 0,
    attribution_status: 'connection_based_only',
    attribution_notice: 'Socket correlation active.',
  },
  {
    pid: 840,
    name: 'avahi-daemon',
    executable_path: '/usr/sbin/avahi-daemon',
    user: 'avahi',
    connection_count: 2,
    tcp_count: 0,
    udp_count: 2,
    attribution_status: 'connection_based_only',
    attribution_notice: 'Socket correlation active.',
  },
];

export const mockDiagnosticReport: DiagnosticReport = {
  timestamp: Math.floor(Date.now() / 1000),
  network_status: 'Connected',
  dns_status: 'Working',
  dns_latency_ms: 18.4,
  gateway: {
    interface: 'eth0',
    gateway_ip: '10.0.0.1',
    is_reachable: true,
    latency_ms: 1.2,
  },
  average_latency_ms: 22.8,
  packet_loss_percent: 0.0,
  dns_checks: [
    {
      domain: 'cloudflare.com',
      is_working: true,
      latency_ms: 14.2,
      resolved_ips: ['104.16.132.229', '104.16.133.229'],
      error: null,
    },
    {
      domain: 'google.com',
      is_working: true,
      latency_ms: 18.6,
      resolved_ips: ['142.250.180.206'],
      error: null,
    },
    {
      domain: 'kernel.org',
      is_working: true,
      latency_ms: 22.4,
      resolved_ips: ['139.178.84.217'],
      error: null,
    },
  ],
  probes: [
    {
      target: '1.1.1.1:53',
      successful_probes: 4,
      total_probes: 4,
      min_latency_ms: 19.5,
      max_latency_ms: 24.1,
      avg_latency_ms: 21.3,
      packet_loss_percent: 0.0,
    },
    {
      target: '8.8.8.8:53',
      successful_probes: 4,
      total_probes: 4,
      min_latency_ms: 21.0,
      max_latency_ms: 26.5,
      avg_latency_ms: 24.3,
      packet_loss_percent: 0.0,
    },
  ],
};

export const mockPermissionReport: PermissionReport = {
  is_root: false,
  uid: 1000,
  can_read_proc_net_dev: true,
  can_read_proc_net_tcp: true,
  can_read_proc_net_route: true,
  can_read_proc_fds: true,
  ebpf_supported: true,
  security_notice: 'Running safely as unprivileged desktop user. All interface metrics and user socket connections are monitored without root access.',
};

export const mockHistoricalSamples: StoredTrafficSample[] = [
  {
    id: 1,
    timestamp: Math.floor(Date.now() / 1000) - 3600,
    interface_name: 'eth0',
    rx_speed_bps: 1024000,
    tx_speed_bps: 128000,
    rx_bytes_total: 300000000,
    tx_bytes_total: 100000000,
  },
  {
    id: 2,
    timestamp: Math.floor(Date.now() / 1000) - 1800,
    interface_name: 'eth0',
    rx_speed_bps: 2048000,
    tx_speed_bps: 512000,
    rx_bytes_total: 320000000,
    tx_bytes_total: 120000000,
  },
  {
    id: 3,
    timestamp: Math.floor(Date.now() / 1000),
    interface_name: 'eth0',
    rx_speed_bps: 1258291,
    tx_speed_bps: 245100,
    rx_bytes_total: 345829120,
    tx_bytes_total: 142859100,
  },
];

export const mockDiagnosticHistory: StoredDiagnosticReport[] = [
  {
    id: 1,
    timestamp: Math.floor(Date.now() / 1000) - 7200,
    network_status: 'Connected',
    dns_status: 'Working',
    avg_latency_ms: 24.5,
    packet_loss_percent: 0.0,
    raw_json: '{}',
  },
  {
    id: 2,
    timestamp: Math.floor(Date.now() / 1000) - 3600,
    network_status: 'Connected',
    dns_status: 'Working',
    avg_latency_ms: 22.8,
    packet_loss_percent: 0.0,
    raw_json: '{}',
  },
];

export const mockAutomationRules = [
  {
    id: 'rule_high_down',
    name: 'High Download Rate Alert',
    description: 'Notifies when download speed exceeds 50 MB/s for sustained bandwidth usage.',
    enabled: true,
    trigger_type: 'download_above',
    condition_json: '{"threshold_bps":52428800.0}',
    action_type: 'notify',
    action_params_json: '{"severity":"warning"}',
    cooldown_secs: 120,
    last_triggered_ts: Math.floor(Date.now() / 1000) - 3600,
    trigger_count: 3,
  },
  {
    id: 'rule_conn_lost',
    name: 'Internet Disconnection Alert',
    description: 'Alerts immediately if the default gateway or WAN connectivity becomes unreachable.',
    enabled: true,
    trigger_type: 'connection_lost',
    condition_json: '{}',
    action_type: 'notify',
    action_params_json: '{"severity":"critical"}',
    cooldown_secs: 60,
    last_triggered_ts: 0,
    trigger_count: 0,
  },
  {
    id: 'rule_high_latency',
    name: 'High Network Latency Spike',
    description: 'Warns when average network round-trip time exceeds 150 ms.',
    enabled: true,
    trigger_type: 'high_latency',
    condition_json: '{"threshold_ms":150.0}',
    action_type: 'notify',
    action_params_json: '{"severity":"warning"}',
    cooldown_secs: 180,
    last_triggered_ts: Math.floor(Date.now() / 1000) - 7200,
    trigger_count: 1,
  },
  {
    id: 'rule_traffic_cap',
    name: 'Daily Traffic Cap Warning',
    description: 'Alerts when total transferred data for today exceeds 10 GB.',
    enabled: false,
    trigger_type: 'total_traffic_above',
    condition_json: '{"threshold_bytes":10737418240}',
    action_type: 'notify',
    action_params_json: '{"severity":"info"}',
    cooldown_secs: 3600,
    last_triggered_ts: 0,
    trigger_count: 0,
  },
];

export const mockAlertEvents = [
  {
    id: 1,
    timestamp: Math.floor(Date.now() / 1000) - 1800,
    rule_id: 'rule_high_latency',
    severity: 'warning' as const,
    title: 'High Network Latency Spike',
    message: 'Average network latency spiked to 168 ms',
    acknowledged: false,
  },
  {
    id: 2,
    timestamp: Math.floor(Date.now() / 1000) - 5400,
    rule_id: 'rule_high_down',
    severity: 'warning' as const,
    title: 'High Download Rate Alert',
    message: 'Download rate reached 58.4 MB/s (threshold: 50.0 MB/s)',
    acknowledged: true,
  },
];

export const mockUserProfiles = [
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Optimal default monitoring profile with 1s refresh interval and standard thresholds.',
    is_active: true,
    settings_json: '{"poll_interval_ms":1000,"history_retention_days":30,"theme":"dark","density":"normal"}',
  },
  {
    id: 'gaming',
    name: 'Gaming Focus',
    description: 'Ultra-low overhead monitoring with prioritized latency and packet loss tracking.',
    is_active: false,
    settings_json: '{"poll_interval_ms":2000,"history_retention_days":14,"theme":"dark","density":"compact"}',
  },
  {
    id: 'streaming',
    name: 'Media Streaming',
    description: 'Prioritizes high throughput consistency and buffer drop detection.',
    is_active: false,
    settings_json: '{"poll_interval_ms":1000,"history_retention_days":30,"theme":"slate","density":"normal"}',
  },
  {
    id: 'downloading',
    name: 'Heavy Download',
    description: 'Optimized for high-volume file transfers and bandwidth consumption tracking.',
    is_active: false,
    settings_json: '{"poll_interval_ms":1500,"history_retention_days":60,"theme":"graphite","density":"normal"}',
  },
  {
    id: 'work',
    name: 'Work / Low Noise',
    description: 'Quiet mode with silenced non-critical alerts and minimal UI animation.',
    is_active: false,
    settings_json: '{"poll_interval_ms":2000,"history_retention_days":30,"theme":"dark","density":"compact"}',
  },
  {
    id: 'custom',
    name: 'Custom Profile',
    description: 'Fully personalized monitoring parameters and automation suite.',
    is_active: false,
    settings_json: '{"poll_interval_ms":1000,"history_retention_days":30,"theme":"amoled","density":"normal"}',
  },
];
