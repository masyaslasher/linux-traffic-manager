import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-surface-secondary/40 border border-border/60 rounded-xl">
      <div className="p-3 text-text-muted bg-surface rounded-full mb-3">{icon}</div>
      <h4 className="text-sm font-semibold text-text-primary">{title}</h4>
      <p className="text-xs text-text-secondary mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
