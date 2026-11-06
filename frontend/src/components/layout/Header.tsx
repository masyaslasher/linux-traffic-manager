import React from 'react';
import { ArrowDown, ArrowUp, RefreshCw } from 'lucide-react';
import { SpeedMetrics } from '../../types';

interface HeaderProps {
  title: string;
  description: string;
  speedMetrics: SpeedMetrics | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  description,
  speedMetrics,
  onRefresh,
  isRefreshing = false,
}) => {
  return (
    <header className="h-16 px-6 border-b border-border bg-surface/80 backdrop-blur flex items-center justify-between shrink-0 select-none">
      <div>
        <h2 className="text-lg font-bold text-text-primary tracking-tight">{title}</h2>
        <p className="text-xs text-text-secondary">{description}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Live Bandwidth Pill */}
        {speedMetrics && (
          <div className="flex items-center gap-3 px-3 py-1.5 bg-surface-secondary border border-border rounded-lg text-xs font-mono">
            <div className="flex items-center gap-1.5 text-primary">
              <ArrowDown className="w-3.5 h-3.5" />
              <span>{speedMetrics.rx_speed_human}</span>
            </div>
            <div className="w-px h-3 bg-border" />
            <div className="flex items-center gap-1.5 text-secondary">
              <ArrowUp className="w-3.5 h-3.5" />
              <span>{speedMetrics.tx_speed_human}</span>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh system data"
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-lg border border-border transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
          </button>
        )}
      </div>
    </header>
  );
};
