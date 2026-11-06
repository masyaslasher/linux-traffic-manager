import React, { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, FileJson } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { NetworkInterface, SpeedMetrics, StoredTrafficSample } from '../types';

interface AnalyticsPageProps {
  interfaces: NetworkInterface[];
  speedMetrics: SpeedMetrics | null;
  historicalSamples: StoredTrafficSample[];
  selectedRange: '5m' | '15m' | '1h' | '6h' | '24h' | '7d' | '30d';
  onSelectRange: (range: '5m' | '15m' | '1h' | '6h' | '24h' | '7d' | '30d') => void;
  onExportCsv: () => void;
  onExportJson: () => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  interfaces,
  speedMetrics,
  historicalSamples,
  selectedRange,
  onSelectRange,
  onExportCsv,
  onExportJson,
}) => {
  const [activeSeries, setActiveSeries] = useState<{ rx: boolean; tx: boolean }>({
    rx: true,
    tx: true,
  });

  const chartData = historicalSamples.map((s) => ({
    time: new Date(s.timestamp * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    download_mb: parseFloat((s.rx_speed_bps / (1024 * 1024)).toFixed(2)),
    upload_mb: parseFloat((s.tx_speed_bps / (1024 * 1024)).toFixed(2)),
  }));

  const ranges: ('5m' | '15m' | '1h' | '6h' | '24h' | '7d' | '30d')[] = [
    '5m',
    '15m',
    '1h',
    '6h',
    '24h',
    '7d',
    '30d',
  ];

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface p-4 border border-border rounded-lg">
        <div className="flex items-center gap-1.5 bg-surface-secondary p-1 rounded-md border border-border">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => onSelectRange(r)}
              className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                selectedRange === r
                  ? 'bg-primary text-white font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onExportCsv}>
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={onExportJson}>
            <FileJson className="w-3.5 h-3.5 mr-1.5" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Main Bandwidth Analytics Graph */}
      <Card
        title="Network Bandwidth Analytics"
        subtitle={`Historical transfer speeds over ${selectedRange}`}
        action={
          <div className="flex items-center gap-3 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={activeSeries.rx}
                onChange={(e) =>
                  setActiveSeries((prev) => ({ ...prev, rx: e.target.checked }))
                }
                className="rounded border-border text-primary focus:ring-0"
              />
              <span className="text-primary font-medium">Download (MB/s)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={activeSeries.tx}
                onChange={(e) =>
                  setActiveSeries((prev) => ({ ...prev, tx: e.target.checked }))
                }
                className="rounded border-border text-secondary focus:ring-0"
              />
              <span className="text-secondary font-medium">Upload (MB/s)</span>
            </label>
          </div>
        }
      >
        <div className="h-72 w-full mt-4">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsRx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-rx)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--chart-rx)" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="analyticsTx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-tx)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--chart-tx)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" opacity={0.6} />
                <XAxis dataKey="time" stroke="var(--text-dim)" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="var(--text-dim)"
                  fontSize={11}
                  tickLine={false}
                  unit=" MB/s"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'var(--text-main)',
                  }}
                />
                {activeSeries.rx && (
                  <Area
                    type="monotone"
                    dataKey="download_mb"
                    name="Download"
                    stroke="var(--chart-rx)"
                    strokeWidth={1.5}
                    fill="url(#analyticsRx)"
                  />
                )}
                {activeSeries.tx && (
                  <Area
                    type="monotone"
                    dataKey="upload_mb"
                    name="Upload"
                    stroke="var(--chart-tx)"
                    strokeWidth={1.5}
                    fill="url(#analyticsTx)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-text-muted">
              Accumulating time-series data for {selectedRange}...
            </div>
          )}
        </div>
      </Card>

      {/* Metrics Aggregate Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="text-xs text-text-muted">Peak Download</div>
          <div className="text-xl font-bold font-mono text-primary mt-1">
            {speedMetrics?.peak_rx_speed_human || '0 B/s'}
          </div>
          <div className="text-[11px] text-text-dim mt-0.5 font-mono">
            {speedMetrics?.rx_speed_bits_human || '0 bit/s'}
          </div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="text-xs text-text-muted">Peak Upload</div>
          <div className="text-xl font-bold font-mono text-secondary mt-1">
            {speedMetrics?.peak_tx_speed_human || '0 B/s'}
          </div>
          <div className="text-[11px] text-text-dim mt-0.5 font-mono">
            {speedMetrics?.tx_speed_bits_human || '0 bit/s'}
          </div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="text-xs text-text-muted">Session Average Rate</div>
          <div className="text-xl font-bold font-mono text-text-primary mt-1">
            {speedMetrics?.avg_rx_speed_human || '0 B/s'}
          </div>
          <div className="text-[11px] text-text-dim mt-0.5">Rolling geometric mean</div>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="text-xs text-text-muted">Connection Duration</div>
          <div className="text-xl font-bold font-mono text-success mt-1">
            {Math.floor((speedMetrics?.connection_uptime_secs || 0) / 60)}m{' '}
            {(speedMetrics?.connection_uptime_secs || 0) % 60}s
          </div>
          <div className="text-[11px] text-text-dim mt-0.5">Continuous interface uptime</div>
        </div>
      </div>

      {/* Interface Traffic Distribution Table */}
      <Card title="Traffic by Network Adapter" subtitle="Kernel byte counters per interface">
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-text-muted">
                <th className="pb-2 font-medium">Interface</th>
                <th className="pb-2 font-medium">State</th>
                <th className="pb-2 font-medium">Link Speed</th>
                <th className="pb-2 font-medium font-mono text-right">Received (RX)</th>
                <th className="pb-2 font-medium font-mono text-right">Transmitted (TX)</th>
                <th className="pb-2 font-medium font-mono text-right">Packets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono">
              {interfaces.map((iface) => (
                <tr key={String(iface.name)} className="hover:bg-surface-secondary/50">
                  <td className="py-2.5 font-sans font-semibold text-text-primary">
                    {String(iface.name)}
                    {iface.is_loopback && (
                      <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-surface-secondary text-text-dim">
                        loopback
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 font-sans">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] ${
                        iface.is_up
                          ? 'bg-success/15 text-success'
                          : 'bg-error/15 text-error'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {iface.state.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 text-text-secondary">
                    {iface.speed_mbps ? `${iface.speed_mbps} Mbps` : 'Adaptive'}
                  </td>
                  <td className="py-2.5 text-right text-primary">
                    {(iface.rx_bytes / (1024 * 1024)).toFixed(1)} MB
                  </td>
                  <td className="py-2.5 text-right text-secondary">
                    {(iface.tx_bytes / (1024 * 1024)).toFixed(1)} MB
                  </td>
                  <td className="py-2.5 text-right text-text-muted">
                    {((iface.rx_packets + iface.tx_packets) / 1000).toFixed(1)}k
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
