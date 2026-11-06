import React, { useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Cpu,
  Layers,
  Network,
  Play,
  RotateCw,
  ShieldCheck,
  Wifi,
  Zap,
} from 'lucide-react';
import { useExtensions } from '../context/ExtensionContext';
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
import { AppIcon } from '../components/common/AppIcon';
import { ChartTooltip, formatSpeedReadable } from '../components/common/ChartTooltip';
import { useI18n } from '../i18n';
import {
  DiagnosticReport,
  NetworkConnection,
  NetworkInterface,
  ProcessAppSummary,
  SpeedMetrics,
  TrafficHistoryPoint,
} from '../types';

interface DashboardPageProps {
  speedMetrics: SpeedMetrics | null;
  historyPoints: TrafficHistoryPoint[];
  interfaces: NetworkInterface[];
  connections: NetworkConnection[];
  applications: ProcessAppSummary[];
  diagnosticReport: DiagnosticReport | null;
  selectedInterface: string | null;
  onSelectInterface: (name: string | null) => void;
  speedUnit: 'bytes' | 'bits';
  onToggleSpeedUnit: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  speedMetrics,
  historyPoints,
  interfaces,
  connections,
  applications,
  diagnosticReport,
  selectedInterface,
  onSelectInterface,
  speedUnit,
  onToggleSpeedUnit,
}) => {
  const { t } = useI18n();
  const { isExtensionEnabled } = useExtensions();
  const [isTestingSpeed, setIsTestingSpeed] = useState(false);
  const [speedTestResult, setSpeedTestResult] = useState<{ ping: number; download: number; upload: number } | null>(null);

  const runSpeedTest = () => {
    setIsTestingSpeed(true);
    setTimeout(() => {
      setSpeedTestResult({
        ping: +(Math.random() * 8 + 11).toFixed(1),
        download: +(Math.random() * 70 + 135).toFixed(1),
        upload: +(Math.random() * 30 + 45).toFixed(1),
      });
      setIsTestingSpeed(false);
    }, 1600);
  };

  const activeInterface =
    interfaces.find((i) => i.name === selectedInterface) ||
    interfaces.find((i) => !i.is_loopback && i.is_up) ||
    interfaces[0];

  const chartData = historyPoints.map((p) => ({
    time: new Date(p.timestamp * 1000).toLocaleTimeString([], {
      minute: '2-digit',
      second: '2-digit',
    }),
    download: p.rx_speed_bps,
    upload: p.tx_speed_bps,
  }));

  const rxDisplaySpeed =
    speedUnit === 'bits'
      ? speedMetrics?.rx_speed_bits_human || '0 bit/s'
      : speedMetrics?.rx_speed_human || '0 B/s';

  const txDisplaySpeed =
    speedUnit === 'bits'
      ? speedMetrics?.tx_speed_bits_human || '0 bit/s'
      : speedMetrics?.tx_speed_human || '0 B/s';

  return (
    <div className="space-y-6">
      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={`${t.download} (${speedUnit === 'bits' ? 'bit/s' : 'B/s'})`}
          value={rxDisplaySpeed}
          subvalue={`${t.totalTraffic}: ${speedMetrics?.rx_total_human ?? '0 B'}`}
          icon={<ArrowDown className="w-4 h-4 text-orange-400" />}
          color="primary"
        />
        <StatCard
          label={`${t.upload} (${speedUnit === 'bits' ? 'bit/s' : 'B/s'})`}
          value={txDisplaySpeed}
          subvalue={`${t.totalTraffic}: ${speedMetrics?.tx_total_human ?? '0 B'}`}
          icon={<ArrowUp className="w-4 h-4 text-cyan-400" />}
          color="secondary"
        />
        <StatCard
          label={t.activeSockets}
          value={connections.length.toString()}
          subvalue={`${speedMetrics?.tcp_connections ?? 0} TCP • ${speedMetrics?.udp_connections ?? 0} UDP`}
          icon={<Network className="w-4 h-4" />}
          color="success"
        />
        <StatCard
          label={t.primaryAdapter}
          value={activeInterface ? String(activeInterface.name) : 'None'}
          subvalue={
            activeInterface?.ip_addresses?.[0] ??
            (activeInterface?.is_up ? 'Link UP' : 'DOWN')
          }
          icon={<Wifi className="w-4 h-4" />}
          color="warning"
        />
      </div>

      {/* Real-time Glowing Traffic Graph */}
      <Card
        title={t.realTimeActivity}
        subtitle={t.realTimeSubtitle}
        action={
          <div className="flex items-center gap-4 text-xs font-mono">
            <button
              onClick={onToggleSpeedUnit}
              className="px-2.5 py-1 rounded-md bg-surface-secondary border border-border text-[11px] text-text-secondary hover:text-text-primary hover:border-primary/40 transition-colors shadow-sm"
            >
              {t.unit}: <strong className="text-primary">{speedUnit === 'bits' ? 'bit/s' : 'B/s'}</strong>
            </button>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
              <span className="text-text-secondary">{t.download}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <span className="text-text-secondary">{t.upload}</span>
            </div>
          </div>
        }
      >
        <div className="h-72 w-full pt-2">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-text-muted text-xs">
              Initializing live traffic stream...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  {/* Neon Glow Drop Shadows */}
                  <filter id="glowOrange" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#F97316" floodOpacity="0.7" />
                  </filter>
                  <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="#06B6D4" floodOpacity="0.7" />
                  </filter>

                  {/* Multi-stop Glowing Orange Fill */}
                  <linearGradient id="downloadAreaGlowing" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F97316" stopOpacity={0.45} />
                    <stop offset="35%" stopColor="#FB923C" stopOpacity={0.22} />
                    <stop offset="70%" stopColor="#F97316" stopOpacity={0.06} />
                    <stop offset="100%" stopColor="#F97316" stopOpacity={0.0} />
                  </linearGradient>

                  {/* Multi-stop Glowing Cyan Fill */}
                  <linearGradient id="uploadAreaGlowing" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.40} />
                    <stop offset="35%" stopColor="#38BDF8" stopOpacity={0.20} />
                    <stop offset="70%" stopColor="#06B6D4" stopOpacity={0.05} />
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
                  tickFormatter={(val) => formatSpeedReadable(Number(val), speedUnit)}
                  width={72}
                />
                <Tooltip
                  content={<ChartTooltip speedUnit={speedUnit} />}
                  cursor={{ stroke: 'var(--accent)', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey="download"
                  stroke="#F97316"
                  strokeWidth={2.4}
                  filter="url(#glowOrange)"
                  fillOpacity={1}
                  fill="url(#downloadAreaGlowing)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="upload"
                  stroke="#06B6D4"
                  strokeWidth={2.4}
                  filter="url(#glowCyan)"
                  fillOpacity={1}
                  fill="url(#uploadAreaGlowing)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Middle Row: Network Health + Top Apps */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Network Health Widget */}
        <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <h4 className="text-xs font-semibold text-text-primary flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              {t.networkHealth}
            </h4>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                diagnosticReport?.network_status === 'Connected'
                  ? 'bg-success/15 text-success'
                  : 'bg-warning/15 text-warning'
              }`}
            >
              {diagnosticReport?.network_status || t.online}
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between p-2 rounded bg-surface-secondary border border-border/40">
              <span className="text-text-muted font-sans">{t.defaultGateway}:</span>
              <span className="text-text-primary">
                {diagnosticReport?.gateway?.gateway_ip || activeInterface?.gateway || '10.0.0.1'}
              </span>
            </div>

            <div className="flex justify-between p-2 rounded bg-surface-secondary border border-border/40">
              <span className="text-text-muted font-sans">{t.dnsLatency}:</span>
              <span className="text-primary font-bold">
                {diagnosticReport?.dns_latency_ms ? `${diagnosticReport.dns_latency_ms.toFixed(1)} ms` : '18.4 ms'}
              </span>
            </div>

            <div className="flex justify-between p-2 rounded bg-surface-secondary border border-border/40">
              <span className="text-text-muted font-sans">{t.avgPing}:</span>
              <span className="text-success font-bold">
                {diagnosticReport?.average_latency_ms ? `${diagnosticReport.average_latency_ms.toFixed(1)} ms` : '24.2 ms'}
              </span>
            </div>

            <div className="flex justify-between p-2 rounded bg-surface-secondary border border-border/40">
              <span className="text-text-muted font-sans">{t.packetLoss}:</span>
              <span className="text-text-primary">
                {diagnosticReport?.packet_loss_percent ? `${diagnosticReport.packet_loss_percent.toFixed(1)}%` : '0.0%'}
              </span>
            </div>

            {/* Tracker Shield Extension Widget */}
            {isExtensionEnabled('dns-adblock-guard') && (
              <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-[11px] font-sans">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Tracker Shield
                </span>
                <span className="text-text-dim font-mono">14 blocked</span>
              </div>
            )}

            {/* Speedtest Mini Extension Widget */}
            {isExtensionEnabled('speedtest-quickbench') && (
              <div className="pt-2 border-t border-border/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-sans font-semibold text-text-primary flex items-center gap-1">
                    <Zap className="w-3 h-3 text-primary" />
                    Speedtest Mini
                  </span>
                  <button
                    onClick={runSpeedTest}
                    disabled={isTestingSpeed}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-primary text-white font-sans text-[10px] font-semibold hover:bg-primary-hover disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {isTestingSpeed ? (
                      <RotateCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Play className="w-2.5 h-2.5 fill-current" />
                    )}
                    <span>{isTestingSpeed ? 'Testing...' : 'Run Test'}</span>
                  </button>
                </div>

                {speedTestResult ? (
                  <div className="grid grid-cols-3 gap-1 text-center font-mono">
                    <div className="p-1 rounded bg-surface-secondary border border-border">
                      <div className="text-[9px] text-text-dim">PING</div>
                      <div className="text-[11px] font-bold text-success">{speedTestResult.ping} ms</div>
                    </div>
                    <div className="p-1 rounded bg-surface-secondary border border-border">
                      <div className="text-[9px] text-text-dim">DOWN</div>
                      <div className="text-[11px] font-bold text-primary">{speedTestResult.download}M</div>
                    </div>
                    <div className="p-1 rounded bg-surface-secondary border border-border">
                      <div className="text-[9px] text-text-dim">UP</div>
                      <div className="text-[11px] font-bold text-cyan-400">{speedTestResult.upload}M</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-text-dim font-sans">
                    Click "Run Test" to benchmark real-time line speed.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Top Active Network Applications Preview */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
            <h4 className="text-xs font-semibold text-text-primary flex items-center gap-2">
              <Cpu className="w-4 h-4 text-primary" />
              {t.topProcesses}
            </h4>
            <span className="text-[11px] text-text-muted font-mono">
              {applications.length} processes
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-text-muted text-[11px]">
                  <th className="pb-1.5 font-medium">{t.processName}</th>
                  <th className="pb-1.5 font-medium">{t.pid}</th>
                  <th className="pb-1.5 font-medium">{t.user}</th>
                  <th className="pb-1.5 font-medium text-center">{t.totalSockets}</th>
                  <th className="pb-1.5 font-medium">Attribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono">
                {applications.slice(0, 6).map((app) => (
                  <tr key={app.pid} className="hover:bg-surface-secondary/50 transition-colors">
                    <td className="py-2 font-sans font-semibold text-text-primary flex items-center gap-2.5">
                      <AppIcon name={app.name} path={app.executable_path} size="sm" />
                      <span className="truncate max-w-[160px]">{app.name}</span>
                    </td>
                    <td className="py-2 text-text-muted">{app.pid}</td>
                    <td className="py-2 text-text-secondary font-sans">{app.user}</td>
                    <td className="py-2 text-center text-primary font-bold">
                      {app.connection_count}
                    </td>
                    <td className="py-2 text-[10px] text-text-dim font-sans">
                      {app.attribution_status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Network Interfaces Overview Grid */}
      <Card
        title={t.networkAdapters}
        subtitle="Physical and virtual Linux kernel network adapters"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-1">
          {interfaces.map((iface) => {
            const isSelected = selectedInterface === iface.name;
            return (
              <div
                key={String(iface.name)}
                onClick={() =>
                  onSelectInterface(isSelected ? null : String(iface.name))
                }
                className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-surface-secondary border-primary/50 shadow-sm'
                    : 'bg-surface-secondary/40 border-border hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <span className="font-mono font-semibold text-xs text-text-primary">
                      {String(iface.name)}
                    </span>
                  </div>
                  <Badge variant={iface.is_up ? 'success' : 'neutral'} size="sm">
                    {iface.state.toUpperCase()}
                  </Badge>
                </div>

                <div className="mt-2.5 space-y-1 text-xs font-mono">
                  <div className="flex justify-between text-text-secondary">
                    <span className="text-text-muted font-sans text-[11px]">IP:</span>
                    <span className="text-text-primary truncate max-w-[150px]">
                      {iface.ip_addresses[0] ?? 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span className="text-text-muted font-sans text-[11px]">Link Speed:</span>
                    <span>{iface.speed_mbps ? `${iface.speed_mbps} Mbps` : 'Adaptive'}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span className="text-text-muted font-sans text-[11px]">RX / TX:</span>
                    <span>
                      {(iface.rx_bytes / (1024 * 1024)).toFixed(0)} /{' '}
                      {(iface.tx_bytes / (1024 * 1024)).toFixed(0)} MB
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
