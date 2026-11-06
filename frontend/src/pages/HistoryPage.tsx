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
import { ChartTooltip, formatSpeedReadable } from '../components/common/ChartTooltip';
import { useI18n } from '../i18n';
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
  const { t } = useI18n();

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
    const firstRx = first?.rx_bytes_total ?? 0;
    const lastRx = last?.rx_bytes_total ?? 0;
    const firstTx = first?.tx_bytes_total ?? 0;
    const lastTx = last?.tx_bytes_total ?? 0;
    totalRx = lastRx >= firstRx ? lastRx - firstRx : lastRx;
    totalTx = lastTx >= firstTx ? lastTx - firstTx : lastTx;
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
          <h3 className="text-base font-bold text-text-primary">{t.history}</h3>
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
                  ? 'bg-primary text-white font-semibold shadow-sm'
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
          label={t.peakDownload}
          value={formatSpeedReadable(peakRx, 'bytes')}
          subvalue="Max Recorded Rx Rate"
          icon={<ArrowDown className="w-5 h-5 text-orange-400" />}
          color="primary"
        />
        <StatCard
          label={t.peakUpload}
          value={formatSpeedReadable(peakTx, 'bytes')}
          subvalue="Max Recorded Tx Rate"
          icon={<ArrowUp className="w-5 h-5 text-cyan-400" />}
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
              <AreaChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <filter id="histGlowOrange" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#F97316" floodOpacity="0.6" />
                  </filter>
                  <filter id="histGlowCyan" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#06B6D4" floodOpacity="0.6" />
                  </filter>
                  <linearGradient id="histDownloadGlowing" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F97316" stopOpacity={0.4} />
                    <stop offset="40%" stopColor="#FB923C" stopOpacity={0.18} />
                    <stop offset="80%" stopColor="#F97316" stopOpacity={0.04} />
                    <stop offset="100%" stopColor="#F97316" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="histUploadGlowing" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.35} />
                    <stop offset="40%" stopColor="#38BDF8" stopOpacity={0.16} />
                    <stop offset="80%" stopColor="#06B6D4" stopOpacity={0.04} />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--border-subtle)" opacity={0.6} vertical={false} />
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
                  tickFormatter={(val) => formatSpeedReadable(Number(val), 'bytes')}
                  width={75}
                />
                <Tooltip
                  content={<ChartTooltip speedUnit="bytes" />}
                  cursor={{ stroke: 'var(--accent)', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey="download"
                  stroke="#F97316"
                  strokeWidth={2.2}
                  filter="url(#histGlowOrange)"
                  fillOpacity={1}
                  fill="url(#histDownloadGlowing)"
                />
                <Area
                  type="monotone"
                  dataKey="upload"
                  stroke="#06B6D4"
                  strokeWidth={2.2}
                  filter="url(#histGlowCyan)"
                  fillOpacity={1}
                  fill="url(#histUploadGlowing)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>
    </div>
  );
};
