import React, { useState } from 'react';
import {
  Check,
  Database,
  Gauge,
  Info,
  Lock,
  Palette,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import {
  AppAppearanceSettings,
  InterfaceDensity,
  NetworkInterface,
  PermissionReport,
  SpeedUnit,
  StoredUserProfile,
  ThemeMode,
} from '../types';

interface SettingsPageProps {
  interfaces: NetworkInterface[];
  selectedInterface: string | null;
  onSelectInterface: (name: string | null) => void;
  permissions: PermissionReport | null;
  dbSizeBytes: number;
  onPruneDatabase: (retentionDays: number) => Promise<number>;
  appearance: AppAppearanceSettings;
  onChangeAppearance: (settings: Partial<AppAppearanceSettings>) => void;
  profiles: StoredUserProfile[];
  onSelectProfile: (profileId: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  interfaces,
  selectedInterface,
  onSelectInterface,
  permissions,
  dbSizeBytes,
  onPruneDatabase,
  appearance,
  onChangeAppearance,
  profiles,
  onSelectProfile,
}) => {
  const [activeCategory, setActiveCategory] = useState<
    'appearance' | 'monitoring' | 'storage' | 'profiles' | 'security' | 'about'
  >('appearance');

  const [retentionDays, setRetentionDays] = useState(30);
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

  const themes: { id: ThemeMode; name: string; desc: string; bg: string; text: string; accent: string }[] = [
    {
      id: 'dark',
      name: 'Neutral Dark',
      desc: 'Calm, balanced dark gray with indigo accents',
      bg: '#111318',
      text: '#F3F4F6',
      accent: '#6366F1',
    },
    {
      id: 'amoled',
      name: 'AMOLED Black',
      desc: 'Pure deep black background for OLED screens',
      bg: '#000000',
      text: '#F9FAFB',
      accent: '#818CF8',
    },
    {
      id: 'light',
      name: 'Minimal Light',
      desc: 'Clean, high-contrast daylight theme',
      bg: '#F8FAFC',
      text: '#0F172A',
      accent: '#4F46E5',
    },
    {
      id: 'graphite',
      name: 'Graphite Charcoal',
      desc: 'Monochromatic warm gray utility theme',
      bg: '#18181B',
      text: '#F4F4F5',
      accent: '#38BDF8',
    },
    {
      id: 'slate',
      name: 'Slate Blue',
      desc: 'Cool navy and steel-blue palette',
      bg: '#0F172A',
      text: '#F8FAFC',
      accent: '#38BDF8',
    },
    {
      id: 'custom',
      name: 'Custom Accent',
      desc: 'Deep obsidian surface with violet highlights',
      bg: '#131418',
      text: '#ECEFF4',
      accent: '#8B5CF6',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Settings Navigation Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-surface border border-border rounded-lg overflow-x-auto text-xs">
        {[
          { id: 'appearance', label: 'Appearance & Themes', icon: <Palette className="w-3.5 h-3.5" /> },
          { id: 'monitoring', label: 'Monitoring Engine', icon: <Gauge className="w-3.5 h-3.5" /> },
          { id: 'storage', label: 'Storage & Database', icon: <Database className="w-3.5 h-3.5" /> },
          { id: 'profiles', label: 'Profiles & Presets', icon: <UserCheck className="w-3.5 h-3.5" /> },
          { id: 'security', label: 'Security & Permissions', icon: <Lock className="w-3.5 h-3.5" /> },
          { id: 'about', label: 'About LTM', icon: <Info className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id as any)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
              activeCategory === tab.id
                ? 'bg-primary text-white font-semibold'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 1. Appearance & Themes */}
      {activeCategory === 'appearance' && (
        <div className="space-y-6">
          <Card title="Color Themes" subtitle="Select a flat, calm visual scheme">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
              {themes.map((t) => {
                const isSelected = appearance.theme === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => onChangeAppearance({ theme: t.id })}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-primary ring-1 ring-primary'
                        : 'border-border hover:border-border/80'
                    }`}
                    style={{ backgroundColor: t.bg }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold" style={{ color: t.text }}>
                        {t.name}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                    </div>
                    <div className="text-[11px] opacity-70 mb-3" style={{ color: t.text }}>
                      {t.desc}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: t.accent }} />
                      <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: t.bg }} />
                      <span className="text-[10px] font-mono opacity-60" style={{ color: t.text }}>
                        {t.id}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Display & Interface Preferences" subtitle="Fine-tune typography, density, and animation cadence">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 text-xs">
              <div>
                <label className="block font-medium text-text-secondary mb-1.5">Interface Density</label>
                <div className="flex rounded-md border border-border p-0.5 bg-surface-secondary">
                  {(['compact', 'normal', 'spacious'] as InterfaceDensity[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => onChangeAppearance({ density: d })}
                      className={`flex-1 py-1 rounded text-center capitalize transition-colors ${
                        appearance.density === d
                          ? 'bg-primary text-white font-semibold'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-text-secondary mb-1.5">Default Speed Units</label>
                <div className="flex rounded-md border border-border p-0.5 bg-surface-secondary">
                  {(['bytes', 'bits'] as SpeedUnit[]).map((u) => (
                    <button
                      key={u}
                      onClick={() => onChangeAppearance({ speedUnit: u })}
                      className={`flex-1 py-1 rounded text-center capitalize transition-colors ${
                        appearance.speedUnit === u
                          ? 'bg-primary text-white font-semibold'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {u === 'bytes' ? 'Bytes (MB/s)' : 'Bits (Mbit/s)'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-text-secondary mb-1.5">UI Animations</label>
                <button
                  onClick={() => onChangeAppearance({ animations: !appearance.animations })}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded bg-surface-secondary border border-border text-text-primary"
                >
                  <span>Smooth Transitions</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${appearance.animations ? 'bg-success/20 text-success' : 'bg-surface text-text-dim'}`}>
                    {appearance.animations ? 'ENABLED' : 'REDUCED'}
                  </span>
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 2. Monitoring Engine */}
      {activeCategory === 'monitoring' && (
        <Card title="Kernel Polling & Interface Selection" subtitle="Asynchronous Tokio sampling loop settings">
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-text-primary mb-1">Monitored Network Interface</label>
              <select
                value={selectedInterface ?? 'AUTO'}
                onChange={(e) => onSelectInterface(e.target.value === 'AUTO' ? null : e.target.value)}
                className="w-full max-w-md bg-surface-secondary border border-border rounded px-3 py-1.5 text-xs text-text-primary font-mono focus:outline-none"
              >
                <option value="AUTO">Auto-detect (Active non-loopback interface)</option>
                {interfaces.map((i) => (
                  <option key={String(i.name)} value={String(i.name)}>
                    {String(i.name)} {i.ip_addresses[0] ? `(${i.ip_addresses[0]})` : ''} - {i.state.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-3 border-t border-border">
              <label className="block font-medium text-text-primary mb-1">Cadence / Polling Rate</label>
              <div className="flex items-center gap-2">
                <span className="font-mono bg-surface-secondary px-2.5 py-1 rounded border border-border text-primary font-bold">
                  1000 ms (1.0 Hz)
                </span>
                <span className="text-text-muted">Dedicated lightweight thread, &lt;0.05% CPU overhead</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 3. Storage & Retention */}
      {activeCategory === 'storage' && (
        <Card title="SQLite History & Retention" subtitle="Local user database (~/.local/share/linux-traffic-manager/ltm.db)">
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-surface-secondary rounded border border-border">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-semibold text-text-primary">SQLite Local Database</div>
                  <div className="text-[11px] text-text-muted mt-0.5">WAL Mode • Indexed Timestamps • Strictly Local</div>
                </div>
              </div>
              <div className="font-mono font-bold text-text-primary text-sm">
                {formatDbSize(dbSizeBytes)}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <label className="block font-medium text-text-primary mb-1">Retention Horizon</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={retentionDays}
                    onChange={(e) => setRetentionDays(Number(e.target.value))}
                    className="w-20 bg-surface-secondary border border-border rounded px-2.5 py-1 text-xs font-mono text-text-primary focus:outline-none"
                  />
                  <span className="text-text-muted">Days of samples preserved</span>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                loading={isPruning}
                onClick={handlePrune}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5 text-error" />
                Prune Older Records
              </Button>
            </div>

            {pruneResult && (
              <div className="p-2.5 rounded bg-surface-secondary border border-primary/40 text-primary font-mono text-xs">
                {pruneResult}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 4. Profiles */}
      {activeCategory === 'profiles' && (
        <Card title="Network Profiles" subtitle="Select or switch operating presets">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            {profiles.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectProfile(p.id)}
                className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
                  p.is_active ? 'border-primary bg-primary/5' : 'border-border hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-primary">{p.name}</span>
                  {p.is_active && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-primary text-white font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-text-muted mt-1 leading-relaxed">{p.description}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 5. Security */}
      {activeCategory === 'security' && (
        <Card title="Security & Sandbox Verification" subtitle="Least-privilege Linux kernel model">
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-surface-secondary rounded border border-border flex items-center justify-between">
              <div>
                <span className="font-semibold text-text-primary">Execution Model</span>
                <p className="text-[11px] text-text-muted mt-0.5">{permissions?.security_notice}</p>
              </div>
              <Badge variant={permissions?.is_root ? 'warning' : 'success'} size="sm">
                {permissions?.is_root ? 'Root (Elevated)' : 'Unprivileged Standard User'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-[11px]">
              <div className="p-2.5 bg-surface-secondary/50 border border-border rounded flex justify-between">
                <span>/proc/net/dev</span>
                <span className="text-success">ACCESSIBLE</span>
              </div>
              <div className="p-2.5 bg-surface-secondary/50 border border-border rounded flex justify-between">
                <span>/proc/net/tcp</span>
                <span className="text-success">ACCESSIBLE</span>
              </div>
              <div className="p-2.5 bg-surface-secondary/50 border border-border rounded flex justify-between">
                <span>Socket Inode Lookup</span>
                <span className="text-success">USER SCOPE</span>
              </div>
              <div className="p-2.5 bg-surface-secondary/50 border border-border rounded flex justify-between">
                <span>eBPF Extension</span>
                <span className="text-text-muted">OPTIONAL</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 6. About */}
      {activeCategory === 'about' && (
        <Card title="Linux Traffic Manager (LTM)" subtitle="Network Control Center">
          <div className="space-y-3 text-xs text-text-secondary leading-relaxed">
            <p>
              LTM is an independent open-source network control center built in Rust and React for Linux desktops.
              It focuses on uncompromising data fidelity, low idle resource consumption, and absolute privacy.
            </p>
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
              <span className="px-2 py-0.5 rounded bg-surface-secondary border border-border">v0.2.0</span>
              <span className="px-2 py-0.5 rounded bg-surface-secondary border border-border">License: MIT</span>
              <span className="px-2 py-0.5 rounded bg-surface-secondary border border-border">OS: Fedora 44 (x86_64)</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
