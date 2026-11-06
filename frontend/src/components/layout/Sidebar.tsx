import React from 'react';
import {
  Activity,
  BarChart3,
  Cpu,
  Gauge,
  History,
  LayoutDashboard,
  Network,
  Radio,
  Settings,
  ShieldCheck,
  Workflow,
  Wifi,
} from 'lucide-react';
import { NavigationTab, NetworkInterface } from '../../types';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  activeInterface: NetworkInterface | null;
  isConnected: boolean;
  onOpenCommandPalette?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeInterface,
  isConnected,
  onOpenCommandPalette,
}) => {
  const navSections: {
    title: string;
    items: { id: NavigationTab; label: string; icon: React.ReactNode }[];
  }[] = [
    {
      title: 'MONITORING',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'applications', label: 'Process Monitor', icon: <Cpu className="w-4 h-4" /> },
        { id: 'connections', label: 'Connection Inspector', icon: <Network className="w-4 h-4" /> },
        { id: 'interfaces', label: 'Interface Manager', icon: <Wifi className="w-4 h-4" /> },
      ],
    },
    {
      title: 'ANALYTICS & DIAGNOSTICS',
      items: [
        { id: 'analytics', label: 'Network Analytics', icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'diagnostics', label: 'Diagnostics Suite', icon: <Activity className="w-4 h-4" /> },
        { id: 'history', label: 'History & Logs', icon: <History className="w-4 h-4" /> },
      ],
    },
    {
      title: 'CONTROL & AUTOMATION',
      items: [
        { id: 'automation', label: 'Automation Center', icon: <Workflow className="w-4 h-4" /> },
        { id: 'bandwidth', label: 'Bandwidth Control', icon: <Gauge className="w-4 h-4" /> },
        { id: 'settings', label: 'Settings Center', icon: <Settings className="w-4 h-4" /> },
      ],
    },
  ];

  return (
    <aside className="w-64 h-screen bg-surface border-r border-border flex flex-col shrink-0 select-none">
      {/* Brand & Identity */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary border border-primary/30 flex items-center justify-center shrink-0 font-bold">
            <Radio className="w-4 h-4 text-primary" />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-sm font-semibold tracking-tight text-text-primary truncate">
              Linux Traffic Manager
            </h1>
            <p className="text-[11px] text-text-muted truncate">Control Center v0.2.0</p>
          </div>
        </div>

        {/* Network Status Pill */}
        <div className="mt-3 flex items-center justify-between px-2.5 py-1.5 bg-surface-secondary rounded-md border border-border text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-success' : 'bg-error'
              }`}
            />
            <span className="text-text-secondary text-[11px]">
              {isConnected ? 'Online' : 'Offline'}
            </span>
          </div>
          {activeInterface && (
            <span className="font-mono text-[11px] text-primary truncate max-w-[90px]">
              {String(activeInterface.name)}
            </span>
          )}
        </div>

        {/* Command Palette Trigger */}
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            className="w-full mt-2 flex items-center justify-between px-2.5 py-1.5 rounded-md bg-surface border border-border text-[11px] text-text-muted hover:text-text-primary hover:border-primary/40 transition-colors"
          >
            <span>Command Palette</span>
            <kbd className="px-1.5 py-0.5 rounded bg-surface-secondary border border-border font-mono text-[9px]">
              Ctrl+K
            </kbd>
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 p-2.5 space-y-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title}>
            <div className="px-3 mb-1 text-[10px] font-semibold tracking-wider text-text-muted uppercase">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-100 ${
                      isActive
                        ? 'bg-primary/10 text-primary border border-primary/20 font-semibold'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                    }`}
                  >
                    <span className={isActive ? 'text-primary' : 'text-text-muted'}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border bg-surface">
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted mb-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-success" />
          <span>Local Only • No Telemetry</span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-text-muted">
          <span>Fedora Linux Target</span>
          <span className="font-mono bg-surface-secondary px-1.5 py-0.5 rounded border border-border">
            v0.2.0
          </span>
        </div>
      </div>
    </aside>
  );
};
