import React, { useEffect, useState } from 'react';
import { Layout } from './components/layout/Layout';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { DashboardPage } from './pages/DashboardPage';
import { DiagnosticsPage } from './pages/DiagnosticsPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './services/tauriClient';
import {
  DiagnosticReport,
  NavigationTab,
  NetworkConnection,
  NetworkInterface,
  PermissionReport,
  ProcessAppSummary,
  SpeedMetrics,
  StoredDiagnosticReport,
  StoredTrafficSample,
  TrafficHistoryPoint,
} from './types';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
  const [selectedInterface, setSelectedInterface] = useState<string | null>(null);
  const [speedMetrics, setSpeedMetrics] = useState<SpeedMetrics | null>(null);
  const [historyPoints, setHistoryPoints] = useState<TrafficHistoryPoint[]>([]);
  const [connections, setConnections] = useState<NetworkConnection[]>([]);
  const [applications, setApplications] = useState<ProcessAppSummary[]>([]);
  const [diagnosticReport, setDiagnosticReport] = useState<DiagnosticReport | null>(null);
  const [diagnosticHistory, setDiagnosticHistory] = useState<StoredDiagnosticReport[]>([]);
  const [historicalSamples, setHistoricalSamples] = useState<StoredTrafficSample[]>([]);
  const [historyRange, setHistoryRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [permissions, setPermissions] = useState<PermissionReport | null>(null);
  const [dbSizeBytes, setDbSizeBytes] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRunningDiag, setIsRunningDiag] = useState(false);

  // Periodic polling for real-time monitoring
  useEffect(() => {
    let mounted = true;

    const fetchRealtime = async () => {
      try {
        const [ifaces, speed, history] = await Promise.all([
          api.getInterfaces(),
          api.getSpeedMetrics(),
          api.getTrafficHistory(),
        ]);

        if (mounted) {
          setInterfaces(ifaces);
          if (speed) setSpeedMetrics(speed);
          if (history.length > 0) setHistoryPoints(history);
        }
      } catch (err) {
        console.error('Real-time polling error:', err);
      }
    };

    // Initial fetch
    fetchRealtime();
    const intervalId = setInterval(fetchRealtime, 1000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [selectedInterface]);

  // Slower background poll for connections & applications
  useEffect(() => {
    let mounted = true;

    const fetchSocketsAndApps = async () => {
      try {
        const [conns, apps] = await Promise.all([
          api.getConnections(),
          api.getApplications(),
        ]);
        if (mounted) {
          setConnections(conns);
          setApplications(apps);
        }
      } catch (err) {
        console.error('Sockets polling error:', err);
      }
    };

    fetchSocketsAndApps();
    const intervalId = setInterval(fetchSocketsAndApps, 3000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // Load permissions, initial diagnostics, and DB stats once on mount
  useEffect(() => {
    const initStatic = async () => {
      try {
        const [perms, diagHist, dbSize] = await Promise.all([
          api.getPermissions(),
          api.queryDiagnosticHistory(20),
          api.getDbStats(),
        ]);
        setPermissions(perms);
        setDiagnosticHistory(diagHist);
        setDbSizeBytes(dbSize);
      } catch (err) {
        console.error('Initial metadata fetch error:', err);
      }
    };
    initStatic();
  }, []);

  // Fetch history when range changes
  useEffect(() => {
    const fetchHistory = async () => {
      const now = Math.floor(Date.now() / 1000);
      const rangeSeconds =
        historyRange === '1h'
          ? 3600
          : historyRange === '24h'
          ? 86400
          : historyRange === '7d'
          ? 7 * 86400
          : 30 * 86400;

      const startTs = now - rangeSeconds;
      try {
        const samples = await api.queryHistory(selectedInterface, startTs, now, 300);
        setHistoricalSamples(samples);
      } catch (err) {
        console.error('History fetch error:', err);
      }
    };
    fetchHistory();
  }, [historyRange, selectedInterface]);

  // Interface selection handler
  const handleSelectInterface = async (name: string | null) => {
    setSelectedInterface(name);
    await api.setMonitoredInterface(name);
  };

  // Run full diagnostics suite
  const handleRunDiagnostics = async () => {
    setIsRunningDiag(true);
    try {
      const report = await api.runDiagnostics();
      setDiagnosticReport(report);
      const updatedHist = await api.queryDiagnosticHistory(20);
      setDiagnosticHistory(updatedHist);
    } catch (err) {
      console.error('Diagnostic execution error:', err);
    } finally {
      setIsRunningDiag(false);
    }
  };

  // Manual refresh button
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [ifaces, conns, apps, perms, dbSize] = await Promise.all([
        api.getInterfaces(),
        api.getConnections(),
        api.getApplications(),
        api.getPermissions(),
        api.getDbStats(),
      ]);
      setInterfaces(ifaces);
      setConnections(conns);
      setApplications(apps);
      setPermissions(perms);
      setDbSizeBytes(dbSize);
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Prune database handler
  const handlePruneDatabase = async (retentionDays: number): Promise<number> => {
    const deleted = await api.pruneDatabase(retentionDays);
    const updatedSize = await api.getDbStats();
    setDbSizeBytes(updatedSize);
    return deleted;
  };

  const getPageMeta = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: 'Network Dashboard',
          description: 'Real-time bandwidth rates, interface telemetry and traffic graphs',
        };
      case 'applications':
        return {
          title: 'Process Applications',
          description: 'Network-active Linux processes correlated through socket descriptors',
        };
      case 'connections':
        return {
          title: 'Active Connections',
          description: 'Real-time TCP and UDP socket states, endpoints, and process mapping',
        };
      case 'diagnostics':
        return {
          title: 'Network Diagnostics',
          description: 'Automated gateway reachability, DNS latency, and packet loss benchmarks',
        };
      case 'history':
        return {
          title: 'Historical Analytics',
          description: 'Persistent time-series traffic records stored in local SQLite',
        };
      case 'settings':
        return {
          title: 'Preferences & Security',
          description: 'Monitoring cadence, interface selection, retention, and Linux permissions',
        };
    }
  };

  const { title, description } = getPageMeta();
  const activeInterface =
    interfaces.find((i) => i.name === selectedInterface) ||
    interfaces.find((i) => !i.is_loopback && i.is_up) ||
    interfaces[0] ||
    null;

  return (
    <Layout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      activeInterface={activeInterface}
      speedMetrics={speedMetrics}
      title={title}
      description={description}
      onRefresh={handleRefresh}
      isRefreshing={isRefreshing}
    >
      {currentTab === 'dashboard' && (
        <DashboardPage
          speedMetrics={speedMetrics}
          historyPoints={historyPoints}
          interfaces={interfaces}
          connections={connections}
          selectedInterface={selectedInterface}
          onSelectInterface={handleSelectInterface}
        />
      )}
      {currentTab === 'applications' && (
        <ApplicationsPage applications={applications} />
      )}
      {currentTab === 'connections' && (
        <ConnectionsPage connections={connections} />
      )}
      {currentTab === 'diagnostics' && (
        <DiagnosticsPage
          diagnosticReport={diagnosticReport}
          historyReports={diagnosticHistory}
          isRunning={isRunningDiag}
          onRunDiagnostics={handleRunDiagnostics}
        />
      )}
      {currentTab === 'history' && (
        <HistoryPage
          samples={historicalSamples}
          selectedRange={historyRange}
          onSelectRange={setHistoryRange}
          dbSizeBytes={dbSizeBytes}
        />
      )}
      {currentTab === 'settings' && (
        <SettingsPage
          interfaces={interfaces}
          selectedInterface={selectedInterface}
          onSelectInterface={handleSelectInterface}
          permissions={permissions}
          dbSizeBytes={dbSizeBytes}
          onPruneDatabase={handlePruneDatabase}
        />
      )}
    </Layout>
  );
};

export default App;
