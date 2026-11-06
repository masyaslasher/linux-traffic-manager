import React, { useEffect, useState } from 'react';
import { Layout } from './components/layout/Layout';
import { CommandPalette } from './components/common/CommandPalette';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { AutomationPage } from './pages/AutomationPage';
import { BandwidthPage } from './pages/BandwidthPage';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { DashboardPage } from './pages/DashboardPage';
import { DiagnosticsPage } from './pages/DiagnosticsPage';
import { HistoryPage } from './pages/HistoryPage';
import { InterfacesPage } from './pages/InterfacesPage';
import { SettingsPage } from './pages/SettingsPage';
import { StorePage } from './pages/StorePage';
import { api } from './services/tauriClient';
import { useI18n } from './i18n';
import {
  AppAppearanceSettings,
  DiagnosticReport,
  NavigationTab,
  NetworkConnection,
  NetworkInterface,
  PermissionReport,
  ProcessAppSummary,
  SpeedMetrics,
  StoredAlertEvent,
  StoredAutomationRule,
  StoredDiagnosticReport,
  StoredTrafficSample,
  StoredUserProfile,
  TrafficHistoryPoint,
} from './types';

export const App: React.FC = () => {
  const { t } = useI18n();
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
  const [historyRange, setHistoryRange] = useState<'5m' | '15m' | '1h' | '6h' | '24h' | '7d' | '30d'>('24h');
  const [permissions, setPermissions] = useState<PermissionReport | null>(null);
  const [dbSizeBytes, setDbSizeBytes] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRunningDiag, setIsRunningDiag] = useState(false);

  // New Ultimate Center state
  const [automationRules, setAutomationRules] = useState<StoredAutomationRule[]>([]);
  const [alertEvents, setAlertEvents] = useState<StoredAlertEvent[]>([]);
  const [userProfiles, setUserProfiles] = useState<StoredUserProfile[]>([]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const [appearance, setAppearance] = useState<AppAppearanceSettings>(() => {
    const saved = localStorage.getItem('ltm_appearance');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      theme: 'dark',
      density: 'normal',
      speedUnit: 'bytes',
      accentColor: '#F97316',
      fontSize: 'normal',
      animations: true,
      borderRadius: 'small',
    };
  });

  // Apply theme class to body
  useEffect(() => {
    document.body.className = `theme-${appearance.theme}`;
    localStorage.setItem('ltm_appearance', JSON.stringify(appearance));
  }, [appearance]);

  // Periodic polling for real-time monitoring (1 Hz)
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

    fetchRealtime();
    const intervalId = setInterval(fetchRealtime, 1000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [selectedInterface]);

  // Slower background poll for connections, apps, rules, alerts (3 Hz)
  useEffect(() => {
    let mounted = true;

    const fetchSocketsAndMeta = async () => {
      try {
        const [conns, apps, rules, alerts] = await Promise.all([
          api.getConnections(),
          api.getApplications(),
          api.getAutomationRules(),
          api.getAlertEvents(50),
        ]);
        if (mounted) {
          setConnections(conns);
          setApplications(apps);
          setAutomationRules(rules);
          setAlertEvents(alerts);
        }
      } catch (err) {
        console.error('Sockets/Rules polling error:', err);
      }
    };

    fetchSocketsAndMeta();
    const intervalId = setInterval(fetchSocketsAndMeta, 3000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // Initial metadata fetch on mount
  useEffect(() => {
    const initStatic = async () => {
      try {
        const [perms, diagHist, dbSize, profiles] = await Promise.all([
          api.getPermissions(),
          api.queryDiagnosticHistory(20),
          api.getDbStats(),
          api.getUserProfiles(),
        ]);
        setPermissions(perms);
        setDiagnosticHistory(diagHist);
        setDbSizeBytes(dbSize);
        setUserProfiles(profiles);
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
      const rangeMap: Record<string, number> = {
        '5m': 300,
        '15m': 900,
        '1h': 3600,
        '6h': 21600,
        '24h': 86400,
        '7d': 7 * 86400,
        '30d': 30 * 86400,
      };

      const rangeSeconds = rangeMap[historyRange] || 86400;
      const startTs = now - rangeSeconds;
      try {
        const samples = await api.queryHistory(selectedInterface, startTs, now, 500);
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
      const [ifaces, conns, apps, perms, dbSize, alerts] = await Promise.all([
        api.getInterfaces(),
        api.getConnections(),
        api.getApplications(),
        api.getPermissions(),
        api.getDbStats(),
        api.getAlertEvents(50),
      ]);
      setInterfaces(ifaces);
      setConnections(conns);
      setApplications(apps);
      setPermissions(perms);
      setDbSizeBytes(dbSize);
      setAlertEvents(alerts);
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

  // Rule Handlers
  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    setAutomationRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled } : r))
    );
    await api.toggleAutomationRule(ruleId, enabled);
  };

  const handleDeleteRule = async (ruleId: string) => {
    setAutomationRules((prev) => prev.filter((r) => r.id !== ruleId));
    await api.deleteAutomationRule(ruleId);
  };

  const handleSaveRule = async (rule: StoredAutomationRule) => {
    setAutomationRules((prev) => [...prev.filter((r) => r.id !== rule.id), rule]);
    await api.saveAutomationRule(rule);
  };

  const handleAcknowledgeAlert = async (alertId: number) => {
    setAlertEvents((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
    await api.acknowledgeAlert(alertId);
  };

  const handleClearAlerts = async () => {
    setAlertEvents([]);
    await api.clearAlertEvents();
  };

  const handleSelectProfile = async (profileId: string) => {
    setUserProfiles((prev) =>
      prev.map((p) => ({ ...p, is_active: p.id === profileId }))
    );
    await api.setActiveProfile(profileId);
  };

  // Export handlers
  const handleExportCsv = async () => {
    const now = Math.floor(Date.now() / 1000);
    const start = now - 30 * 86400;
    try {
      const csv = await api.exportHistoryCsv(start, now);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ltm-traffic-history-${now}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    }
  };

  const handleExportJson = async () => {
    const now = Math.floor(Date.now() / 1000);
    const start = now - 30 * 86400;
    try {
      const json = await api.exportHistoryJson(start, now);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ltm-traffic-history-${now}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export JSON:', err);
    }
  };

  const handleToggleSpeedUnit = () => {
    setAppearance((prev) => ({
      ...prev,
      speedUnit: prev.speedUnit === 'bytes' ? 'bits' : 'bytes',
    }));
  };

  const getPageMeta = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: t.dashboard,
          description: t.realTimeSubtitle,
        };
      case 'applications':
        return {
          title: t.applications,
          description: t.processNoticeTitle,
        };
      case 'connections':
        return {
          title: t.connections,
          description: 'TCP / UDP / RAW Sockets & Reverse DNS',
        };
      case 'interfaces':
        return {
          title: t.interfaces,
          description: t.networkAdapters,
        };
      case 'analytics':
        return {
          title: t.analytics,
          description: t.totalTraffic,
        };
      case 'diagnostics':
        return {
          title: t.diagnostics,
          description: t.diagSubtitle,
        };
      case 'automation':
        return {
          title: t.automation,
          description: t.automationSubtitle,
        };
      case 'bandwidth':
        return {
          title: t.bandwidth,
          description: t.bandwidthSubtitle,
        };
      case 'history':
        return {
          title: t.history,
          description: t.eventLogs,
        };
      case 'settings':
        return {
          title: t.settings,
          description: t.appearanceTitle,
        };
      case 'store':
        return {
          title: t.store,
          description: 'Каталог тем оформления, расширений и сетевых инструментов',
        };
    }
  };

  const { title, description } = getPageMeta();
  const activeInterface =
    interfaces.find((i) => i.name === selectedInterface) ||
    interfaces.find((i) => !i.is_loopback && i.is_up) ||
    interfaces[0] ||
    null;

  const activeProfile = userProfiles.find((p) => p.is_active)?.name || 'Balanced';
  const unacknowledgedAlerts = alertEvents.filter((a) => !a.acknowledged).length;

  return (
    <>
      <Layout
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeInterface={activeInterface}
        speedMetrics={speedMetrics}
        title={title}
        description={description}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        speedUnit={appearance.speedUnit}
        onToggleSpeedUnit={handleToggleSpeedUnit}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        activeProfileName={activeProfile}
        alertCount={unacknowledgedAlerts}
        onOpenAlerts={() => setCurrentTab('automation')}
      >
        {currentTab === 'dashboard' && (
          <DashboardPage
            speedMetrics={speedMetrics}
            historyPoints={historyPoints}
            interfaces={interfaces}
            connections={connections}
            applications={applications}
            diagnosticReport={diagnosticReport}
            selectedInterface={selectedInterface}
            onSelectInterface={handleSelectInterface}
            speedUnit={appearance.speedUnit}
            onToggleSpeedUnit={handleToggleSpeedUnit}
          />
        )}
        {currentTab === 'applications' && (
          <ApplicationsPage applications={applications} />
        )}
        {currentTab === 'connections' && (
          <ConnectionsPage connections={connections} />
        )}
        {currentTab === 'interfaces' && (
          <InterfacesPage
            interfaces={interfaces}
            selectedInterface={selectedInterface}
            onSelectInterface={handleSelectInterface}
          />
        )}
        {currentTab === 'analytics' && (
          <AnalyticsPage
            interfaces={interfaces}
            speedMetrics={speedMetrics}
            historicalSamples={historicalSamples}
            selectedRange={historyRange}
            onSelectRange={setHistoryRange}
            onExportCsv={handleExportCsv}
            onExportJson={handleExportJson}
          />
        )}
        {currentTab === 'diagnostics' && (
          <DiagnosticsPage
            diagnosticReport={diagnosticReport}
            historyReports={diagnosticHistory}
            isRunning={isRunningDiag}
            onRunDiagnostics={handleRunDiagnostics}
          />
        )}
        {currentTab === 'automation' && (
          <AutomationPage
            rules={automationRules}
            alerts={alertEvents}
            onToggleRule={handleToggleRule}
            onDeleteRule={handleDeleteRule}
            onSaveRule={handleSaveRule}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            onClearAlerts={handleClearAlerts}
          />
        )}
        {currentTab === 'bandwidth' && (
          <BandwidthPage
            applications={applications}
            speedMetrics={speedMetrics}
          />
        )}
        {currentTab === 'history' && (
          <HistoryPage
            samples={historicalSamples}
            selectedRange={
              historyRange === '1h' || historyRange === '24h' || historyRange === '7d' || historyRange === '30d'
                ? historyRange
                : '24h'
            }
            onSelectRange={(r) => setHistoryRange(r)}
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
            appearance={appearance}
            onChangeAppearance={(patch) => setAppearance((prev) => ({ ...prev, ...patch }))}
            profiles={userProfiles}
            onSelectProfile={handleSelectProfile}
          />
        )}
        {currentTab === 'store' && <StorePage />}
      </Layout>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={setCurrentTab}
        onRunDiagnostics={handleRunDiagnostics}
        onExportCsv={handleExportCsv}
      />
    </>
  );
};

export default App;
