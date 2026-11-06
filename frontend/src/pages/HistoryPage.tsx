import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  BarChart2,
  Database,
  HardDrive,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { StatCard } from '../components/common/StatCard';
import { StoredTrafficSample } from '../types';

interface HistoryPageProps {
  samples: StoredTrafficSample[];
  selectedRange: '1h' | '24h' | '7d' | '30d';
  onSelectRange: (range: '1h' | '24h' | '7d' | '30d') => void;
  dbSizeBytes: number;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  samples,
  selectedRange,
  onSelectRange,
  dbSizeBytes,
}) => {
  const formatSpeed = (val: number): string => {
    if (val < 1024) return `${val.toFixed(0)} B/s`;
    if (val < 1024 * 1024) return `${(val / 1024).toFixed(1)} KB/s`;
    return `${(val / (1024 * 1024)).toFixed(2)} MB/s`;
  };

  const formatDbSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Compute peak metrics
  let peakRx = 0;
  let peakTx = 0;
  let totalRx = 0;
  let totalTx = 0;

  for (const s of samples) {
    if (s.rx_speed_bps > peakRx) peakRx = s.rx_speed_bps;
    if (s.tx_speed_bps > peakTx) peakTx = s.tx_speed_bps;
  }

  if (samples.length > 0) {
    const first = samples[0];
    const last = samples[samples.length - 1];
    totalRx = last.rx_bytes_total >= first.rx_bytes_total ? last.rx_bytes_total - first.rx_bytes_total : last.rx_bytes_total;
    totalTx = last.tx_bytes_total >= first.tx_bytes_total ? last.tx_bytes_total - first.tx_bytes_total : last.tx_bytes_total;
  }

  const chartData = samples.map((s) => ({
    time: new Date(s.timestamp * 1000).toLocaleString([], {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    download: s.rx_speed_bps,
    upload: s.tx_speed_bps,
  }));

  return (
    <div className="space-y-6">
      {/* Range filter bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-text-primary">Historical Network Analytics</h3>
          <p className="text-xs text-text-secondary">
            Time-series bandwidth logs persisted locally in SQLite.
          </p>
        </div>

        <div className="flex items-center bg-surface border border-border rounded-lg p-1 text-xs">
          {(['1h', '24h', '7d', '30d'] as const).map((rng) => (
            <button
              key={rng}
              onClick={() => onSelectRange(rng)}
              className={`px-3 py-1 rounded-md transition-colors font-medium uppercase ${
                selectedRange === rng
                  ? 'bg-primary text-background font-semibold shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {rng}
            </button>
          ))}
        </div>
      </div>

      {/* Aggregate stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Peak Download"
          value={formatSpeed(peakRx)}
          subvalue="Max Recorded Rx Rate"
          icon={<ArrowDown className="w-5 h-5" />}
          color="primary"
        />
        <StatCard
          label="Peak Upload"
          value={formatSpeed(peakTx)}
          subvalue="Max Recorded Tx Rate"
          icon={<ArrowUp className="w-5 h-5" />}
          color="secondary"
        />
        <StatCard
          label="Session Traffic"
          value={`${((totalRx + totalTx) / (1024 * 1024)).toFixed(1)} MB`}
          subvalue={`Rx: ${(totalRx / (1024 * 1024)).toFixed(1)} MB • Tx: ${(totalTx / (1024 * 1024)).toFixed(1)} MB`}
          icon={<HardDrive className="w-5 h-5" />}
          color="success"
        />
        <StatCard
          label="Database Storage"
          value={formatDbSize(dbSizeBytes)}
          subvalue="SQLite local size"
          icon={<Database className="w-5 h-5" />}
          color="default"
        />
      </div>

      {/* Historical Trend Chart */}
      <Card
        title="Bandwidth History"
        subtitle={`Recorded samples for past ${selectedRange.toUpperCase()}`}
      >
        <div className="h-72 w-full pt-2">
          {chartData.length === 0 ? (
            <EmptyState
              icon={<BarChart2 className="w-8 h-8" />}
              title="No Historical Data"
              description="Historical metrics will populate as LTM records traffic samples to SQLite."
            />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="histDownload" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-rx)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--chart-rx)" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="histUpload" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-tx)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--chart-tx)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="var(--text-dim)"
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis
                  stroke="var(--text-dim)"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={formatSpeed}
                  width={75}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'var(--text-main)',
                  }}
                  formatter={(val: any, name: any) => [
                    formatSpeed(Number(val) || 0),
                    name === 'download' ? 'Download' : 'Upload',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="download"
                  stroke="var(--chart-rx)"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#histDownload)"
                />
                <Area
                  type="monotone"
                  dataKey="upload"
                  stroke="var(--chart-tx)"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#histUpload)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  );
};
