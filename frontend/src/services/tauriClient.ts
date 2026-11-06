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

import {
  mockApplications,
  mockConnections,
  mockDiagnosticHistory,
  mockDiagnosticReport,
  mockHistoricalSamples,
  mockInterfaces,
  mockPermissionReport,
  mockSpeedMetrics,
  generateMockHistoryPoints,
} from './mockData';

// Check if Tauri desktop IPC is available
export const isTauriEnvironment = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
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
};
