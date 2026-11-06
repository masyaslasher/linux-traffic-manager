import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  Layers,
  Network,
  Wifi,
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
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import {
  NetworkConnection,
  NetworkInterface,
  SpeedMetrics,
  TrafficHistoryPoint,
} from '../types';

interface DashboardPageProps {
  speedMetrics: SpeedMetrics | null;
  historyPoints: TrafficHistoryPoint[];
  interfaces: NetworkInterface[];
  connections: NetworkConnection[];
  selectedInterface: string | null;
  onSelectInterface: (name: string | null) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  speedMetrics,
  historyPoints,
  interfaces,
  connections,
  selectedInterface,
  onSelectInterface,
}) => {
  const activeInterface =
    interfaces.find((i) => i.name === selectedInterface) ||
    interfaces.find((i) => !i.is_loopback && i.is_up) ||
    interfaces[0];

  const formatChartSpeed = (val: number): string => {
    if (val < 1024) return `${val.toFixed(0)} B/s`;
    if (val < 1024 * 1024) return `${(val / 1024).toFixed(0)} KB/s`;
    return `${(val / (1024 * 1024)).toFixed(1)} MB/s`;
  };

  const chartData = historyPoints.map((p) => ({
    time: new Date(p.timestamp * 1000).toLocaleTimeString([], {
      minute: '2-digit',
      second: '2-digit',
    }),
    download: p.rx_speed_bps,
    upload: p.tx_speed_bps,
    rx_human: p.rx_speed_human,
    tx_human: p.tx_speed_human,
  }));

  return (
    <div className="space-y-6">
      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Download Speed"
          value={speedMetrics?.rx_speed_human ?? '0 B/s'}
          subvalue={`Total: ${speedMetrics?.rx_total_human ?? '0 B'}`}
          icon={<ArrowDown className="w-5 h-5" />}
          color="primary"
        />
        <StatCard
          label="Upload Speed"
          value={speedMetrics?.tx_speed_human ?? '0 B/s'}
          subvalue={`Total: ${speedMetrics?.tx_total_human ?? '0 B'}`}
          icon={<ArrowUp className="w-5 h-5" />}
          color="secondary"
        />
        <StatCard
          label="Active Connections"
          value={connections.length.toString()}
          subvalue="TCP & UDP Sockets"
          icon={<Network className="w-5 h-5" />}
          color="success"
        />
        <StatCard
          label="Current Interface"
          value={activeInterface ? String(activeInterface.name) : 'None'}
          subvalue={
            activeInterface?.ip_addresses[0] ??
            (activeInterface?.is_up ? 'Link Up' : 'Disconnected')
          }
          icon={<Wifi className="w-5 h-5" />}
          color="warning"
        />
      </div>

      {/* Real-time Traffic Graph */}
      <Card
        title="Real-Time Network Activity"
        subtitle="1-second resolution • Live procfs delta calculation"
        action={
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="text-text-secondary">Download</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
              <span className="text-text-secondary">Upload</span>
            </div>
          </div>
        }
      >
        <div className="h-64 w-full pt-2">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-text-muted text-xs">
              Initializing live traffic stream...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="downloadArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stop-color="#A78BFA" stopOpacity={0.4} />
                    <stop offset="95%" stop-color="#8B5CF6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="uploadArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stop-color="#EC4899" stopOpacity={0.3} />
                    <stop offset="95%" stop-color="#EC4899" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#29243A" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#6B6280"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#29243A' }}
                />
                <YAxis
                  stroke="#6B6280"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#29243A' }}
                  tickFormatter={formatChartSpeed}
                  width={65}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#12101C',
                    borderColor: '#29243A',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F5F3FF',
                  }}
                  formatter={(value: any, name: any) => [
                    formatChartSpeed(Number(value) || 0),
                    name === 'download' ? 'Download' : 'Upload',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="download"
                  stroke="#A78BFA"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#downloadArea)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="upload"
                  stroke="#EC4899"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#uploadArea)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Network Interfaces Overview */}
      <Card
        title="Network Interfaces"
        subtitle="Physical and virtual Linux kernel network adapters"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {interfaces.map((iface) => {
            const isSelected = selectedInterface === iface.name;
            return (
              <div
                key={String(iface.name)}
                onClick={() =>
                  onSelectInterface(isSelected ? null : String(iface.name))
                }
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-surface-secondary border-primary shadow-glow-primary/10'
                    : 'bg-surface-secondary/40 border-border hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <span className="font-mono font-bold text-sm text-text-primary">
                      {String(iface.name)}
                    </span>
                  </div>
                  <Badge variant={iface.is_up ? 'success' : 'neutral'} size="sm">
                    {iface.state.toUpperCase()}
                  </Badge>
                </div>

                <div className="mt-3 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-text-secondary">
                    <span className="text-text-muted font-sans">IP:</span>
                    <span className="text-text-primary truncate max-w-[170px]">
                      {iface.ip_addresses[0] ?? 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span className="text-text-muted font-sans">Speed:</span>
                    <span>{iface.speed_mbps ? `${iface.speed_mbps} Mbps` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span className="text-text-muted font-sans">RX Total:</span>
                    <span>{(iface.rx_bytes / (1024 * 1024)).toFixed(1)} MB</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span className="text-text-muted font-sans">TX Total:</span>
                    <span>{(iface.tx_bytes / (1024 * 1024)).toFixed(1)} MB</span>
                  </div>
                  {iface.rx_dropped > 0 && (
                    <div className="flex justify-between text-warning">
                      <span className="font-sans">Dropped:</span>
                      <span>{iface.rx_dropped} pkts</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
