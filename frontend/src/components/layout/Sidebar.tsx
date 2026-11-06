import React from 'react';
import {
  Activity,
  Cpu,
  History,
  LayoutDashboard,
  Network,
  Radio,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { NavigationTab, NetworkInterface } from '../../types';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  activeInterface: NetworkInterface | null;
  isConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeInterface,
  isConnected,
}) => {
  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'applications', label: 'Applications', icon: <Cpu className="w-4 h-4" /> },
    { id: 'connections', label: 'Connections', icon: <Network className="w-4 h-4" /> },
    { id: 'diagnostics', label: 'Diagnostics', icon: <Activity className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 h-screen bg-surface border-r border-border flex flex-col shrink-0 select-none">
      {/* Brand & Identity */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-secondary to-primary flex items-center justify-center shadow-glow-primary/20 shrink-0">
            <Radio className="w-5 h-5 text-background" />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold tracking-tight text-text-primary truncate">
              Linux Traffic Manager
            </h1>
            <p className="text-[11px] text-text-muted truncate">Understand your network</p>
          </div>
        </div>

        {/* Network Status Pill */}
        <div className="mt-4 flex items-center justify-between px-3 py-1.5 bg-surface-secondary rounded-lg border border-border/70 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-success animate-pulse' : 'bg-error'
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
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-primary/15 text-primary border border-primary/30 shadow-glow-primary/10'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
              }`}
            >
              <span className={isActive ? 'text-primary' : 'text-text-muted'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer / Privacy & Version */}
      <div className="p-4 border-t border-border bg-surface/50">
        <div className="flex items-center gap-2 text-[11px] text-text-muted mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-success" />
          <span>Local Only • No Telemetry</span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-text-muted">
          <span>Fedora Linux Target</span>
          <span className="font-mono bg-surface-secondary px-1.5 py-0.5 rounded border border-border">
            v0.1.0
          </span>
        </div>
      </div>
    </aside>
  );
};
