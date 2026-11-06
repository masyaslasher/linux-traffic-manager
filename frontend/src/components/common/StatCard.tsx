import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  subvalue?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'default';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subvalue,
  icon,
  color = 'default',
}) => {
  const colorMap = {
    primary: 'border-primary/30 text-primary shadow-glow-primary/10',
    secondary: 'border-secondary/30 text-secondary shadow-glow-secondary/10',
    success: 'border-success/30 text-success',
    warning: 'border-warning/30 text-warning',
    default: 'border-border text-primary',
  };

  const bgIconMap = {
    primary: 'bg-primary/10 text-primary',
    secondary: 'bg-secondary/10 text-secondary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    default: 'bg-surface-secondary text-text-secondary',
  };

  return (
    <div
      className={`bg-surface border rounded-xl p-4 transition-all duration-200 hover:border-border/80 ${colorMap[color]}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">
          {label}
        </span>
        <div className={`p-2 rounded-lg ${bgIconMap[color]}`}>{icon}</div>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold tracking-tight text-text-primary font-mono">
          {value}
        </div>
        {subvalue && (
          <div className="text-xs text-text-secondary mt-1 font-mono">{subvalue}</div>
        )}
      </div>
    </div>
  );
};
