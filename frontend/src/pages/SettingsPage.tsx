import React, { useState } from 'react';
import {
  Database,
  Trash2,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { NetworkInterface, PermissionReport } from '../types';

interface SettingsPageProps {
  interfaces: NetworkInterface[];
  selectedInterface: string | null;
  onSelectInterface: (name: string | null) => void;
  permissions: PermissionReport | null;
  dbSizeBytes: number;
  onPruneDatabase: (retentionDays: number) => Promise<number>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  interfaces,
  selectedInterface,
  onSelectInterface,
  permissions,
  dbSizeBytes,
  onPruneDatabase,
}) => {
  const [retentionDays, setRetentionDays] = useState(14);
  const [isPruning, setIsPruning] = useState(false);
  const [pruneResult, setPruneResult] = useState<string | null>(null);

  const handlePrune = async () => {
    setIsPruning(true);
    try {
      const deleted = await onPruneDatabase(retentionDays);
      setPruneResult(`Successfully removed ${deleted} historical records.`);
      setTimeout(() => setPruneResult(null), 4000);
    } catch (e: any) {
      setPruneResult(`Error pruning database: ${e?.message ?? e}`);
    } finally {
      setIsPruning(false);
    }
  };

  const formatDbSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Network Monitoring Settings */}
      <Card
        title="Monitoring Settings"
        subtitle="Configure network interface polling and capture parameters"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-2">
              Monitored Network Interface
            </label>
            <select
              value={selectedInterface ?? 'AUTO'}
              onChange={(e) =>
                onSelectInterface(e.target.value === 'AUTO' ? null : e.target.value)
              }
              className="w-full max-w-md bg-surface-secondary border border-border rounded-lg px-3 py-2 text-xs font-mono text-text-primary focus:outline-none focus:border-primary"
            >
              <option value="AUTO">Auto-detect (Active non-loopback interface)</option>
              {interfaces.map((i) => (
                <option key={String(i.name)} value={String(i.name)}>
                  {String(i.name)} {i.ip_addresses[0] ? `(${i.ip_addresses[0]})` : ''} -{' '}
                  {i.state.toUpperCase()}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-text-muted mt-1">
              Select specific interface or let LTM prioritize the primary internet uplink.
            </p>
          </div>

          <div className="pt-3 border-t border-border/60">
            <label className="block text-xs font-semibold text-text-primary mb-1">
              Sample Cadence
            </label>
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              <span className="font-mono bg-surface-secondary px-2 py-1 rounded border border-border text-primary font-bold">
                1000 ms (1 Hz)
              </span>
              <span>• Standard asynchronous non-blocking Tokio interval</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Database & Data Management */}
      <Card
        title="Database & Storage Retention"
        subtitle="Manage local SQLite history database (~/.local/share/linux-traffic-manager/ltm.db)"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-surface-secondary/50 border border-border/80 rounded-lg text-xs">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-primary" />
              <div>
                <span className="font-semibold text-text-primary">SQLite Local Database</span>
                <p className="text-[11px] text-text-muted mt-0.5">
                  WAL Mode • Indexed Timestamps • No Cloud Sync
                </p>
              </div>
            </div>
            <div className="font-mono font-bold text-text-primary text-sm">
              {formatDbSize(dbSizeBytes)}
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Data Retention Window
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(Number(e.target.value))}
                  className="w-20 bg-surface-secondary border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-text-primary focus:outline-none focus:border-primary"
                />
                <span className="text-xs text-text-secondary">Days of history</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              loading={isPruning}
              onClick={handlePrune}
              icon={<Trash2 className="w-4 h-4 text-error" />}
            >
              Prune Older Records
            </Button>
          </div>

          {pruneResult && (
            <div className="p-2.5 rounded-lg bg-surface-secondary border border-primary/30 text-xs text-primary font-mono">
              {pruneResult}
            </div>
          )}
        </div>
      </Card>

      {/* Linux Security & Permissions Model */}
      <Card
        title="Linux Security & Capabilities"
        subtitle="Verification of least-privilege sandbox and procfs accessibility"
      >
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-surface-secondary/40 border border-border/70 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-primary">Execution Model</span>
              <Badge variant={permissions?.is_root ? 'warning' : 'success'} size="sm">
                {permissions?.is_root ? 'Root (Elevated)' : 'Unprivileged Standard User'}
              </Badge>
            </div>
            <p className="text-[11px] text-text-secondary">
              {permissions?.security_notice}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="flex items-center justify-between p-2.5 bg-surface-secondary/30 border border-border rounded-lg font-mono text-[11px]">
              <span>/proc/net/dev</span>
              <Badge variant={permissions?.can_read_proc_net_dev ? 'success' : 'error'} size="sm">
                {permissions?.can_read_proc_net_dev ? 'Accessible' : 'Restricted'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-surface-secondary/30 border border-border rounded-lg font-mono text-[11px]">
              <span>/proc/net/tcp & udp</span>
              <Badge variant={permissions?.can_read_proc_net_tcp ? 'success' : 'error'} size="sm">
                {permissions?.can_read_proc_net_tcp ? 'Accessible' : 'Restricted'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-surface-secondary/30 border border-border rounded-lg font-mono text-[11px]">
              <span>/proc/[pid]/fd inspection</span>
              <Badge variant={permissions?.can_read_proc_fds ? 'success' : 'warning'} size="sm">
                {permissions?.can_read_proc_fds ? 'User Scope' : 'Restricted'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-surface-secondary/30 border border-border rounded-lg font-mono text-[11px]">
              <span>Kernel eBPF Subsystem</span>
              <Badge variant={permissions?.ebpf_supported ? 'primary' : 'neutral'} size="sm">
                {permissions?.ebpf_supported ? 'Kernel Ready' : 'Disabled'}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* About Linux Traffic Manager */}
      <Card title="About Linux Traffic Manager" subtitle="Release metadata & licensing">
        <div className="space-y-3 text-xs text-text-secondary leading-relaxed">
          <p>
            <strong className="text-text-primary">Linux Traffic Manager (LTM)</strong> is built with Rust and Tauri 2 for Linux desktops. It prioritizes system performance, zero-telemetry user privacy, and strict measurement accuracy.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-mono">
            <span className="bg-surface-secondary px-2 py-1 rounded border border-border">
              Version: 0.1.0
            </span>
            <span className="bg-surface-secondary px-2 py-1 rounded border border-border">
              License: MIT
            </span>
            <span className="bg-surface-secondary px-2 py-1 rounded border border-border">
              Target: Fedora 44 (x86_64)
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};
