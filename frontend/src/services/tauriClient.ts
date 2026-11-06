import {
  DiagnosticReport,
  NetworkConnection,
  NetworkInterface,
  PermissionReport,
  ProcessAppSummary,
  RouteHop,
  SpeedMetrics,
  StoredAlertEvent,
  StoredAutomationRule,
  StoredDiagnosticReport,
  StoredTrafficSample,
  StoredUserProfile,
  TcpPortCheckResult,
  TrafficHistoryPoint,
} from '../types';

import {
  mockAlertEvents,
  mockApplications,
  mockAutomationRules,
  mockConnections,
  mockDiagnosticHistory,
  mockDiagnosticReport,
  mockHistoricalSamples,
  mockInterfaces,
  mockPermissionReport,
  mockSpeedMetrics,
  mockUserProfiles,
  generateMockHistoryPoints,
} from './mockData';

// Check if Tauri desktop IPC is available
export const isTauriEnvironment = (): boolean => {
  return typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
};

// Safe invoke wrapper
async function safeInvoke<T>(cmd: string, args?: Record<string, unknown>, fallback?: T): Promise<T> {
  if (isTauriEnvironment()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<T>(cmd, args);
    } catch (err) {
      console.warn(`[TauriClient] Failed to invoke "${cmd}":`, err);
      if (fallback !== undefined) return fallback;
      throw err;
    }
  }

  // Standalone browser mode fallback
  if (fallback !== undefined) {
    return fallback;
  }
  throw new Error(`Command "${cmd}" invoked outside Tauri environment without fallback.`);
}

let simulatedHistory = generateMockHistoryPoints();

export const api = {
  getInterfaces: async (): Promise<NetworkInterface[]> => {
    return safeInvoke('get_interfaces', undefined, mockInterfaces);
  },

  getSpeedMetrics: async (): Promise<SpeedMetrics | null> => {
    return safeInvoke('get_speed_metrics', undefined, mockSpeedMetrics);
  },

  getTrafficHistory: async (): Promise<TrafficHistoryPoint[]> => {
    if (isTauriEnvironment()) {
      return safeInvoke('get_traffic_history', undefined, []);
    }
    // Simulate real-time graph evolution in browser preview
    const now = Math.floor(Date.now() / 1000);
    const last = simulatedHistory[simulatedHistory.length - 1];
    if (last && now > last.timestamp) {
      const rx = 800000 + Math.sin(now / 5) * 500000 + Math.random() * 200000;
      const tx = 200000 + Math.cos(now / 4) * 100000 + Math.random() * 50000;
      simulatedHistory.push({
        timestamp: now,
        rx_speed_bps: Math.max(0, rx),
        tx_speed_bps: Math.max(0, tx),
        rx_speed_human: `${(rx / (1024 * 1024)).toFixed(2)} MB/s`,
        tx_speed_human: `${(tx / 1024).toFixed(1)} KB/s`,
      });
      if (simulatedHistory.length > 60) {
        simulatedHistory.shift();
      }
    }
    return [...simulatedHistory];
  },

  getConnections: async (): Promise<NetworkConnection[]> => {
    return safeInvoke('get_connections', undefined, mockConnections);
  },

  getApplications: async (): Promise<ProcessAppSummary[]> => {
    return safeInvoke('get_applications', undefined, mockApplications);
  },

  runDiagnostics: async (): Promise<DiagnosticReport> => {
    return safeInvoke('run_diagnostics', undefined, mockDiagnosticReport);
  },

  queryHistory: async (
    interfaceName: string | null,
    startTs: number,
    endTs: number,
    limit?: number
  ): Promise<StoredTrafficSample[]> => {
    return safeInvoke(
      'query_history',
      { interfaceName, startTs, endTs, limit },
      mockHistoricalSamples
    );
  },

  queryDiagnosticHistory: async (limit?: number): Promise<StoredDiagnosticReport[]> => {
    return safeInvoke('query_diagnostic_history', { limit }, mockDiagnosticHistory);
  },

  getPermissions: async (): Promise<PermissionReport> => {
    return safeInvoke('get_permissions', undefined, mockPermissionReport);
  },

  setMonitoredInterface: async (interfaceName: string | null): Promise<void> => {
    return safeInvoke('set_monitored_interface', { interfaceName }, undefined);
  },

  pruneDatabase: async (retentionDays: number): Promise<number> => {
    return safeInvoke('prune_database', { retentionDays }, 0);
  },

  getDbStats: async (): Promise<number> => {
    return safeInvoke('get_db_stats', undefined, 1048576);
  },

  getAutomationRules: async (): Promise<StoredAutomationRule[]> => {
    return safeInvoke('get_automation_rules', undefined, mockAutomationRules);
  },

  saveAutomationRule: async (rule: StoredAutomationRule): Promise<void> => {
    return safeInvoke('save_automation_rule', { rule }, undefined);
  },

  deleteAutomationRule: async (ruleId: string): Promise<boolean> => {
    return safeInvoke('delete_automation_rule', { ruleId }, true);
  },

  toggleAutomationRule: async (ruleId: string, enabled: boolean): Promise<void> => {
    return safeInvoke('toggle_automation_rule', { ruleId, enabled }, undefined);
  },

  getAlertEvents: async (limit?: number): Promise<StoredAlertEvent[]> => {
    return safeInvoke('get_alert_events', { limit }, mockAlertEvents);
  },

  acknowledgeAlert: async (alertId: number): Promise<void> => {
    return safeInvoke('acknowledge_alert', { alertId }, undefined);
  },

  clearAlertEvents: async (): Promise<number> => {
    return safeInvoke('clear_alert_events', undefined, 0);
  },

  getUserProfiles: async (): Promise<StoredUserProfile[]> => {
    return safeInvoke('get_user_profiles', undefined, mockUserProfiles);
  },

  setActiveProfile: async (profileId: string): Promise<void> => {
    return safeInvoke('set_active_profile', { profileId }, undefined);
  },

  getSetting: async (key: string): Promise<string | null> => {
    return safeInvoke('get_setting', { key }, null);
  },

  setSetting: async (key: string, valueJson: string): Promise<void> => {
    return safeInvoke('set_setting', { key, valueJson }, undefined);
  },

  exportHistoryCsv: async (startTs: number, endTs: number): Promise<string> => {
    return safeInvoke(
      'export_history_csv',
      { startTs, endTs },
      'timestamp,interface,rx_bps,tx_bps\n'
    );
  },

  exportHistoryJson: async (startTs: number, endTs: number): Promise<string> => {
    return safeInvoke('export_history_json', { startTs, endTs }, '[]');
  },

  checkTcpPort: async (
    target: string,
    port: number,
    timeoutMs?: number
  ): Promise<TcpPortCheckResult> => {
    return safeInvoke(
      'check_tcp_port',
      { target, port, timeoutMs },
      { target, port, is_open: true, latency_ms: 18.5, error: null }
    );
  },

  probeRouteHops: async (target: string, maxHops?: number): Promise<RouteHop[]> => {
    return safeInvoke('probe_route_hops', { target, maxHops }, [
      { hop: 1, ip: '10.0.0.1', rtt_ms: 1.2, status: 'Local Gateway' },
      { hop: 2, ip: '1.1.1.1', rtt_ms: 22.4, status: `Target Host (${target})` },
    ]);
  },
};
