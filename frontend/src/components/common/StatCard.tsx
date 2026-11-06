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
    primary: 'border-border text-primary hover:border-primary/40',
    secondary: 'border-border text-secondary hover:border-secondary/40',
    success: 'border-border text-success hover:border-success/40',
    warning: 'border-border text-warning hover:border-warning/40',
    default: 'border-border text-text-primary hover:border-border/80',
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
      className={`bg-surface border rounded-lg p-4 transition-colors duration-150 ${colorMap[color]}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">
          {label}
        </span>
        <div className={`p-1.5 rounded-md ${bgIconMap[color]}`}>{icon}</div>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-semibold tracking-tight text-text-primary font-mono">
          {value}
        </div>
        {subvalue && (
          <div className="text-xs text-text-secondary mt-1 font-mono">{subvalue}</div>
        )}
      </div>
    </div>
  );
};
