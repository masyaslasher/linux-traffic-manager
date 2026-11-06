import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  Bell,
  RefreshCw,
  Search,
  UserCheck,
} from 'lucide-react';
import { SpeedMetrics, SpeedUnit } from '../../types';

interface HeaderProps {
  title: string;
  description: string;
  speedMetrics: SpeedMetrics | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  speedUnit?: SpeedUnit;
  onToggleSpeedUnit?: () => void;
  onOpenCommandPalette?: () => void;
  activeProfileName?: string;
  alertCount?: number;
  onOpenAlerts?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  description,
  speedMetrics,
  onRefresh,
  isRefreshing = false,
  speedUnit = 'bytes',
  onToggleSpeedUnit,
  onOpenCommandPalette,
  activeProfileName = 'Balanced',
  alertCount = 0,
  onOpenAlerts,
}) => {
  const rxDisplay =
    speedUnit === 'bits'
      ? speedMetrics?.rx_speed_bits_human || '0 bit/s'
      : speedMetrics?.rx_speed_human || '0 B/s';

  const txDisplay =
    speedUnit === 'bits'
      ? speedMetrics?.tx_speed_bits_human || '0 bit/s'
      : speedMetrics?.tx_speed_human || '0 B/s';

  return (
    <header className="h-14 px-6 border-b border-border bg-surface flex items-center justify-between shrink-0 select-none">
      <div>
        <h2 className="text-sm font-semibold text-text-primary tracking-tight">{title}</h2>
        <p className="text-[11px] text-text-muted">{description}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Active Profile Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-secondary border border-border text-xs">
          <UserCheck className="w-3.5 h-3.5 text-primary" />
          <span className="text-text-muted text-[11px]">Profile:</span>
          <span className="font-semibold text-text-primary text-[11px]">{activeProfileName}</span>
        </div>

        {/* Live Bandwidth Pill */}
        {speedMetrics && (
          <div
            onClick={onToggleSpeedUnit}
            title="Click to toggle between Bytes/s and Bits/s"
            className="flex items-center gap-2.5 px-2.5 py-1 bg-surface-secondary border border-border rounded-md text-xs font-mono cursor-pointer hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center gap-1 text-primary">
              <ArrowDown className="w-3.5 h-3.5" />
              <span>{rxDisplay}</span>
            </div>
            <div className="w-px h-3 bg-border" />
            <div className="flex items-center gap-1 text-secondary">
              <ArrowUp className="w-3.5 h-3.5" />
              <span>{txDisplay}</span>
            </div>
          </div>
        )}

        {/* Command Palette Button */}
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            title="Search / Command Palette (Ctrl+K)"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-secondary border border-border text-xs text-text-muted hover:text-text-primary hover:border-primary/40 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <kbd className="text-[9px] font-mono px-1 py-0.5 rounded bg-surface border border-border/80">
              Ctrl+K
            </kbd>
          </button>
        )}

        {/* Alerts Bell */}
        {onOpenAlerts && (
          <button
            onClick={onOpenAlerts}
            title={`${alertCount} alert(s)`}
            className="relative p-1.5 text-text-muted hover:text-text-primary bg-surface-secondary rounded-md border border-border transition-colors"
          >
            <Bell className="w-3.5 h-3.5" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-error" />
            )}
          </button>
        )}

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh system data"
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-secondary rounded-md border border-border transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
          </button>
        )}
      </div>
    </header>
  );
};
