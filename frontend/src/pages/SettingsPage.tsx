import React, { useState } from 'react';
import {
  Check,
  Database,
  Gauge,
  Globe,
  Info,
  Lock,
  Palette,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { useI18n } from '../i18n';
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
  const { lang, setLang, languages, t } = useI18n();
  const [activeCategory, setActiveCategory] = useState<
    'appearance' | 'language' | 'monitoring' | 'storage' | 'profiles' | 'security' | 'about'
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
      name: 'Dark Warm Orange',
      desc: 'Modern dark theme with vibrant tangerine orange accents',
      bg: '#101114',
      text: '#F3F4F6',
      accent: '#F97316',
    },
    {
      id: 'amoled',
      name: 'AMOLED Pure Black',
      desc: 'Deep black for OLED panels with glowing amber highlights',
      bg: '#000000',
      text: '#F9FAFB',
      accent: '#FB923C',
    },
    {
      id: 'graphite',
      name: 'Graphite Charcoal',
      desc: 'Industrial dark gray matte with warm orange accents',
      bg: '#151517',
      text: '#F4F4F5',
      accent: '#F97316',
    },
    {
      id: 'slate',
      name: 'Slate Night',
      desc: 'Midnight slate navy palette with neon orange and cyan highlights',
      bg: '#0F172A',
      text: '#F8FAFC',
      accent: '#FB923C',
    },
    {
      id: 'light',
      name: 'Ivory Tangerine Light',
      desc: 'Warm paper-white daylight theme with crisp orange tones',
      bg: '#FFFBF7',
      text: '#18181B',
      accent: '#EA580C',
    },
    {
      id: 'custom',
      name: 'Obsidian Neon',
      desc: 'High-contrast studio dark obsidian with glowing accents',
      bg: '#121214',
      text: '#ECEFF4',
      accent: '#F97316',
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Settings Navigation Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-surface border border-border rounded-lg overflow-x-auto text-xs shadow-sm">
        {[
          { id: 'appearance', label: t.appearanceTitle, icon: <Palette className="w-3.5 h-3.5" /> },
          { id: 'language', label: t.languageSelect, icon: <Globe className="w-3.5 h-3.5" /> },
          { id: 'monitoring', label: 'Monitoring Engine', icon: <Gauge className="w-3.5 h-3.5" /> },
          { id: 'storage', label: 'Storage & Database', icon: <Database className="w-3.5 h-3.5" /> },
          { id: 'profiles', label: t.profile, icon: <UserCheck className="w-3.5 h-3.5" /> },
          { id: 'security', label: 'Security & Capabilities', icon: <Lock className="w-3.5 h-3.5" /> },
          { id: 'about', label: 'About LTM', icon: <Info className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id as any)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-colors ${
              activeCategory === tab.id
                ? 'bg-primary text-white font-semibold shadow-sm'
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
          <Card title={t.themes} subtitle="Select an orange/amber accented flat desktop scheme">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
              {themes.map((item) => {
                const isSelected = appearance.theme === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => onChangeAppearance({ theme: item.id })}
                    className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/40 shadow-md'
                        : 'border-border hover:border-border/80'
                    }`}
                    style={{ backgroundColor: item.bg }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold" style={{ color: item.text }}>
                        {item.name}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-orange-500" />}
                    </div>
                    <div className="text-[11px] opacity-70 mb-3" style={{ color: item.text }}>
                      {item.desc}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.6)]" style={{ backgroundColor: item.accent }} />
                      <span className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: item.bg }} />
                      <span className="text-[10px] font-mono opacity-60" style={{ color: item.text }}>
                        {item.id}
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
                <label className="block font-medium text-text-secondary mb-1.5">{t.density}</label>
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
                <label className="block font-medium text-text-secondary mb-1.5">{t.speedUnitTitle}</label>
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
                      {u === 'bytes' ? 'Bytes (B/s, MB/s)' : 'Bits (bit/s, Mbit/s)'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-text-secondary mb-1.5">{t.animations}</label>
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

      {/* 2. Language Selection (Reactive without page reload) */}
      {activeCategory === 'language' && (
        <Card
          title={t.languageSelect}
          subtitle="Переключение языка интерфейса в реальном времени без перезагрузки приложения"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            {languages.map((item) => {
              const isSelected = item.code === lang;
              return (
                <div
                  key={item.code}
                  onClick={() => setLang(item.code)}
                  className={`p-3.5 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-primary/10 border-primary ring-1 ring-primary/50 shadow-sm'
                      : 'bg-surface-secondary/40 border-border hover:border-primary/40 hover:bg-surface-secondary'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl leading-none" role="img" aria-label={item.label}>
                      {item.flag}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-text-primary">
                        {item.nativeName}
                      </div>
                      <div className="text-xs text-text-muted">
                        {item.label} ({item.code})
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                      <Check className="w-4 h-4 text-primary" />
                      Активен
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 3. Monitoring Engine */}
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
            <div className="p-3 bg-surface-secondary/50 rounded border border-border space-y-1">
              <span className="font-semibold text-text-primary">Background Polling Cadence:</span>
              <p className="text-text-muted">
                1000 ms (1 Hz) for live traffic deltas • 3000 ms for socket table correlates. Zero CPU polling when idling.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 4. Storage & Database */}
      {activeCategory === 'storage' && (
        <Card title="SQLite Local Storage Management" subtitle="Time-series persistence and database size control">
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-surface-secondary rounded border border-border">
              <div>
                <span className="font-semibold text-text-primary">Current Database Size:</span>
                <p className="text-text-muted text-[11px]">Located in user app data directory (ltm_metrics.db)</p>
              </div>
              <span className="text-lg font-mono font-bold text-primary">{formatDbSize(dbSizeBytes)}</span>
            </div>

            <div className="pt-2">
              <label className="block font-medium text-text-primary mb-1">Prune Historical Samples</label>
              <div className="flex items-center gap-3">
                <select
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(Number(e.target.value))}
                  className="bg-surface-secondary border border-border rounded px-3 py-1.5 text-xs text-text-primary focus:outline-none"
                >
                  <option value={7}>Keep past 7 days</option>
                  <option value={14}>Keep past 14 days</option>
                  <option value={30}>Keep past 30 days</option>
                  <option value={90}>Keep past 90 days</option>
                  <option value={0}>Delete all history</option>
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrune}
                  disabled={isPruning}
                  className="text-error border-error/40 hover:bg-error/10 hover:border-error"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  {isPruning ? 'Pruning...' : 'Prune Database Now'}
                </Button>
              </div>

              {pruneResult && (
                <p className="mt-2 text-xs text-primary font-medium">{pruneResult}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* 5. Profiles */}
      {activeCategory === 'profiles' && (
        <Card title="Traffic Management Profiles" subtitle="Predefined operational profiles for gaming, streaming, and battery conservation">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            {profiles.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectProfile(p.id)}
                className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
                  p.is_active
                    ? 'bg-primary/10 border-primary'
                    : 'bg-surface-secondary/50 border-border hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-text-primary text-xs">{p.name}</span>
                  {p.is_active && <Badge variant="primary" size="sm">Active</Badge>}
                </div>
                <p className="text-[11px] text-text-muted">{p.description}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 6. Security & Capabilities */}
      {activeCategory === 'security' && (
        <Card title="Linux Kernel Capabilities & Permissions" subtitle="Diagnostics and process attribution rights">
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-surface-secondary rounded border border-border flex items-center justify-between">
              <div>
                <span className="font-semibold text-text-primary">Linux Capabilities (CAP_NET_RAW / CAP_NET_ADMIN)</span>
                <p className="text-text-muted text-[11px]">Enables raw socket probing and traffic shaping tc calls</p>
              </div>
              <Badge variant={permissions?.is_root ? 'success' : 'neutral'}>
                {permissions?.is_root ? 'Elevated (Root)' : 'User Mode'}
              </Badge>
            </div>
            <div className="p-3 bg-surface-secondary rounded border border-border flex items-center justify-between">
              <div>
                <span className="font-semibold text-text-primary">Process Attribution Integrity</span>
                <p className="text-text-muted text-[11px]">Strict procfs /proc/[pid]/fd socket correlation without fake stats</p>
              </div>
              <Badge variant="success">Active (100% Truthful)</Badge>
            </div>
          </div>
        </Card>
      )}

      {/* 7. About */}
      {activeCategory === 'about' && (
        <Card title="Linux Traffic Manager (LTM)" subtitle="Universal Network Control Center for Linux desktops">
          <div className="space-y-3 text-xs leading-relaxed text-text-secondary">
            <p>
              LTM is a modern, privacy-focused open source Linux network monitor built with Rust, Tauri 2, and React.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-2 py-1 rounded bg-surface-secondary border border-border text-[11px] font-mono text-primary font-bold">
                Version 0.2.0
              </span>
              <span className="px-2 py-1 rounded bg-surface-secondary border border-border text-[11px] font-mono text-text-primary">
                Tauri 2 • Rust Core • SQLite
              </span>
              <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-medium text-emerald-400">
                100% Offline • Zero Telemetry
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
