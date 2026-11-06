import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ icon, className = '', ...props }) => {
  return (
    <div className="relative flex items-center w-full">
      {icon && (
        <span className="absolute left-3 text-text-muted pointer-events-none">
          {icon}
        </span>
      )}
      <input
        className={`w-full bg-surface-secondary border border-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors ${
          icon ? 'pl-9 pr-3 py-2' : 'px-3 py-2'
        } ${className}`}
        {...props}
      />
    </div>
  );
};
