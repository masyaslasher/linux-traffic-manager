import React from 'react';
import { ArrowDown, ArrowUp, Clock } from 'lucide-react';

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  speedUnit?: 'bytes' | 'bits';
}

export const formatSpeedReadable = (val: number, unit: 'bytes' | 'bits' = 'bytes'): string => {
  if (unit === 'bits') {
    const bits = val * 8;
    if (bits < 1000) return `${bits.toFixed(0)} bit/s`;
    if (bits < 1_000_000) return `${(bits / 1000).toFixed(1)} Kbit/s`;
    if (bits < 1_000_000_000) return `${(bits / 1_000_000).toFixed(2)} Mbit/s`;
    return `${(bits / 1_000_000_000).toFixed(2)} Gbit/s`;
  }
  if (val < 1024) return `${val.toFixed(0)} B/s`;
  if (val < 1024 * 1024) return `${(val / 1024).toFixed(1)} KB/s`;
  if (val < 1024 * 1024 * 1024) return `${(val / (1024 * 1024)).toFixed(2)} MB/s`;
  return `${(val / (1024 * 1024 * 1024)).toFixed(2)} GB/s`;
};

export const ChartTooltip: React.FC<ChartTooltipProps> = ({
  active,
  payload,
  label,
  speedUnit = 'bytes',
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const downloadVal = payload.find((p) => p.dataKey === 'download')?.value ?? 0;
  const uploadVal = payload.find((p) => p.dataKey === 'upload')?.value ?? 0;

  return (
    <div className="bg-surface/95 backdrop-blur-md border border-border/80 shadow-2xl rounded-xl p-3 min-w-[210px] text-xs font-mono pointer-events-none transition-all">
      {/* Time Header */}
      <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-border/60 text-text-muted font-sans font-medium text-[11px]">
        <Clock className="w-3.5 h-3.5 text-primary" />
        <span>{label}</span>
      </div>

      {/* Metrics */}
      <div className="space-y-2">
        {/* Download */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-orange-400 font-sans">
            <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
            <ArrowDown className="w-3.5 h-3.5" />
            <span>Download:</span>
          </div>
          <div className="text-right">
            <span className="font-bold text-text-primary text-[13px]">
              {formatSpeedReadable(Number(downloadVal), speedUnit)}
            </span>
            <div className="text-[10px] text-text-dim">
              {formatSpeedReadable(Number(downloadVal), speedUnit === 'bytes' ? 'bits' : 'bytes')}
            </div>
          </div>
        </div>

        {/* Upload */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-cyan-400 font-sans">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Upload:</span>
          </div>
          <div className="text-right">
            <span className="font-bold text-text-primary text-[13px]">
              {formatSpeedReadable(Number(uploadVal), speedUnit)}
            </span>
            <div className="text-[10px] text-text-dim">
              {formatSpeedReadable(Number(uploadVal), speedUnit === 'bytes' ? 'bits' : 'bytes')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
