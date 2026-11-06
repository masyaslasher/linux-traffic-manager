import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Globe,
  Play,
  Router,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { api } from '../services/tauriClient';
import {
  DiagnosticReport,
  RouteHop,
  StoredDiagnosticReport,
  TcpPortCheckResult,
} from '../types';

interface DiagnosticsPageProps {
  diagnosticReport: DiagnosticReport | null;
  historyReports: StoredDiagnosticReport[];
  isRunning: boolean;
  onRunDiagnostics: () => void;
}

export const DiagnosticsPage: React.FC<DiagnosticsPageProps> = ({
  diagnosticReport,
  historyReports,
  isRunning,
  onRunDiagnostics,
}) => {
  // Custom port tester state
  const [portHost, setPortHost] = useState('cloudflare.com');
  const [portNum, setPortNum] = useState('443');
  const [isCheckingPort, setIsCheckingPort] = useState(false);
  const [portResult, setPortResult] = useState<TcpPortCheckResult | null>(null);

  // Custom route hop tester state
  const [traceHost, setTraceHost] = useState('1.1.1.1');
  const [isTracingRoute, setIsTracingRoute] = useState(false);
  const [routeHops, setRouteHops] = useState<RouteHop[] | null>(null);

  const handleTestPort = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portHost || !portNum) return;
    setIsCheckingPort(true);
    try {
      const res = await api.checkTcpPort(portHost, parseInt(portNum, 10));
      setPortResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingPort(false);
    }
  };

  const handleTraceRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!traceHost) return;
    setIsTracingRoute(true);
    try {
      const hops = await api.probeRouteHops(traceHost, 15);
      setRouteHops(hops);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTracingRoute(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header action bar */}
      <div className="flex items-center justify-between bg-surface p-4 border border-border rounded-lg">
        <div>
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Network Diagnostics & Path Analysis
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Gateway discovery, DNS resolve benchmarks, multi-probe latency, and custom TCP port checking.
          </p>
        </div>
        <Button
          onClick={onRunDiagnostics}
          loading={isRunning}
          size="sm"
          variant="primary"
        >
          <Play className="w-3.5 h-3.5 mr-1.5" />
          Run Full Diagnostics
        </Button>
      </div>

      {/* Diagnostics KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Network Status"
          value={diagnosticReport?.network_status ?? 'Pending'}
          subvalue={
            diagnosticReport
              ? `Tested ${new Date(diagnosticReport.timestamp * 1000).toLocaleTimeString()}`
              : 'Click Run to test'
          }
          icon={<Activity className="w-4 h-4" />}
          color={
            diagnosticReport?.network_status === 'Connected'
              ? 'success'
              : diagnosticReport?.network_status === 'Degraded'
              ? 'warning'
              : 'default'
          }
        />
        <StatCard
          label="DNS Resolution"
          value={diagnosticReport?.dns_status ?? 'Pending'}
          subvalue={
            diagnosticReport
              ? `Avg Latency: ${diagnosticReport.dns_latency_ms.toFixed(1)} ms`
              : 'Domain lookups'
          }
          icon={<Globe className="w-4 h-4" />}
          color={diagnosticReport?.dns_status === 'Working' ? 'primary' : 'warning'}
        />
        <StatCard
          label="Default Gateway"
          value={
            diagnosticReport?.gateway?.is_reachable
              ? 'Reachable'
              : diagnosticReport?.gateway
              ? 'Unreachable'
              : 'Pending'
          }
          subvalue={
            diagnosticReport?.gateway
              ? `${diagnosticReport.gateway.gateway_ip} (${diagnosticReport.gateway.interface})`
              : 'Router hop'
          }
          icon={<Router className="w-4 h-4" />}
          color={diagnosticReport?.gateway?.is_reachable ? 'success' : 'warning'}
        />
        <StatCard
          label="Ping & Packet Loss"
          value={
            diagnosticReport
              ? `${diagnosticReport.average_latency_ms.toFixed(0)} ms`
              : '0 ms'
          }
          subvalue={
            diagnosticReport
              ? `Packet Loss: ${diagnosticReport.packet_loss_percent.toFixed(0)}%`
              : 'Probe tests'
          }
          icon={<Clock className="w-4 h-4" />}
          color={
            (diagnosticReport?.packet_loss_percent ?? 0) === 0 ? 'secondary' : 'warning'
          }
        />
      </div>

      {/* Synthesized Diagnostic Summary & Recommendations */}
      {diagnosticReport && (
        <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-semibold text-text-primary">
              Diagnostic Summary & Health Assessment
            </h4>
          </div>

          <p className="text-xs text-text-secondary leading-relaxed font-sans">
            {diagnosticReport.summary || 'All network probes concluded normally.'}
          </p>

          {diagnosticReport.issues_found && diagnosticReport.issues_found.length > 0 && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-md text-xs text-error space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Detected Abnormalities:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-text-secondary pl-1">
                {diagnosticReport.issues_found.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {diagnosticReport.recommendations && diagnosticReport.recommendations.length > 0 && (
            <div className="p-3 bg-surface-secondary border border-border rounded-md text-xs space-y-1">
              <div className="font-semibold text-text-primary">Actionable Suggestions:</div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-text-muted pl-1">
                {diagnosticReport.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Interactive Tools: TCP Port Checker & Route Hop Tracer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* TCP Port Checker */}
        <Card title="TCP Port Reachability" subtitle="Test socket connectivity to any remote service">
          <form onSubmit={handleTestPort} className="space-y-3 mt-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="Target host (e.g. google.com)"
                  value={portHost}
                  onChange={(e) => setPortHost(e.target.value)}
                  className="w-full bg-surface-secondary border border-border rounded px-2.5 py-1.5 text-xs text-text-primary focus:outline-none"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Port (443)"
                  value={portNum}
                  onChange={(e) => setPortNum(e.target.value)}
                  className="w-full bg-surface-secondary border border-border rounded px-2.5 py-1.5 text-xs text-text-primary font-mono focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {['80', '443', '53', '22'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPortNum(p)}
                    className="px-1.5 py-0.5 rounded bg-surface-secondary border border-border font-mono text-[10px] text-text-muted hover:text-text-primary"
                  >
                    :{p}
                  </button>
                ))}
              </div>
              <Button type="submit" size="sm" variant="secondary" loading={isCheckingPort}>
                Check Port
              </Button>
            </div>

            {portResult && (
              <div
                className={`p-2.5 rounded border text-xs font-mono flex items-center justify-between ${
                  portResult.is_open
                    ? 'bg-success/10 border-success/30 text-success'
                    : 'bg-error/10 border-error/30 text-error'
                }`}
              >
                <div className="flex items-center gap-2">
                  {portResult.is_open ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <span>
                    {portResult.target}:{portResult.port} — {portResult.is_open ? 'OPEN' : 'CLOSED / FILTERED'}
                  </span>
                </div>
                {portResult.latency_ms && (
                  <span>{portResult.latency_ms.toFixed(1)} ms</span>
                )}
              </div>
            )}
          </form>
        </Card>

        {/* Route Hop Tracer */}
        <Card title="Route Path Exploration" subtitle="Analyze gateway and WAN hops to target">
          <form onSubmit={handleTraceRoute} className="space-y-3 mt-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Target address or host"
                value={traceHost}
                onChange={(e) => setTraceHost(e.target.value)}
                className="w-full bg-surface-secondary border border-border rounded px-2.5 py-1.5 text-xs text-text-primary font-mono focus:outline-none"
              />
              <Button type="submit" size="sm" variant="secondary" loading={isTracingRoute}>
                Trace Route
              </Button>
            </div>

            {routeHops && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto font-mono text-xs mt-2">
                {routeHops.map((h) => (
                  <div
                    key={h.hop}
                    className="p-2 rounded bg-surface-secondary border border-border/70 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-5 text-text-muted text-[10px]">#{h.hop}</span>
                      <span className="text-text-primary truncate">{h.ip || '* * *'}</span>
                      <span className="text-text-dim text-[10px] font-sans">({h.status})</span>
                    </div>
                    {h.rtt_ms && (
                      <span className="text-primary font-bold shrink-0">{h.rtt_ms.toFixed(1)} ms</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </form>
        </Card>
      </div>

      {/* Detailed Diagnostics Breakdown */}
      {diagnosticReport && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* DNS Resolution Tests */}
          <Card title="DNS Domain Lookup Benchmarks" subtitle="Resolution latency across global test roots">
            <div className="space-y-2.5">
              {diagnosticReport.dns_checks.map((check) => (
                <div
                  key={check.domain}
                  className="flex items-center justify-between p-3 bg-surface-secondary/40 border border-border/70 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-3">
                    {check.is_working ? (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : (
                      <XCircle className="w-4 h-4 text-error" />
                    )}
                    <div>
                      <span className="font-semibold text-text-primary font-sans">
                        {check.domain}
                      </span>
                      {check.resolved_ips.length > 0 && (
                        <div className="font-mono text-[10px] text-text-muted mt-0.5">
                          IP: {check.resolved_ips.slice(0, 2).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-primary font-bold">
                      {check.latency_ms.toFixed(1)} ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Latency & Packet Loss Probes */}
          <Card title="Probe Latency & Loss Breakdown" subtitle="Multi-sample TCP socket latency measurements">
            <div className="space-y-2.5">
              {diagnosticReport.probes.map((probe) => (
                <div
                  key={probe.target}
                  className="flex items-center justify-between p-3 bg-surface-secondary/40 border border-border/70 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-surface rounded border border-border text-secondary">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-mono font-semibold text-text-primary">
                        {probe.target}
                      </span>
                      <div className="text-[10px] text-text-muted mt-0.5">
                        {probe.successful_probes}/{probe.total_probes} probes responded
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-text-primary font-bold">
                      {probe.avg_latency_ms
                        ? `${probe.avg_latency_ms.toFixed(1)} ms`
                        : 'Timed Out'}
                    </div>
                    <div
                      className={`text-[10px] ${
                        probe.packet_loss_percent > 0 ? 'text-error' : 'text-success'
                      }`}
                    >
                      {probe.packet_loss_percent.toFixed(0)}% loss
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Historical Diagnostics Runs */}
      {historyReports.length > 0 && (
        <Card title="Diagnostic Run History" subtitle="Persistent records stored in local SQLite database">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-text-muted text-[11px] uppercase tracking-wider font-semibold">
                  <th className="pb-2.5 pl-2">Timestamp</th>
                  <th className="pb-2.5">Overall Status</th>
                  <th className="pb-2.5">DNS Status</th>
                  <th className="pb-2.5">Average Latency</th>
                  <th className="pb-2.5 pr-2 text-right">Packet Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono">
                {historyReports.slice(0, 8).map((hist) => (
                  <tr key={hist.id} className="hover:bg-surface-secondary/30 transition-colors">
                    <td className="py-2.5 pl-2 text-text-secondary">
                      {new Date(hist.timestamp * 1000).toLocaleString()}
                    </td>
                    <td className="py-2.5 font-sans">
                      <Badge
                        variant={hist.network_status === 'Connected' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {hist.network_status}
                      </Badge>
                    </td>
                    <td className="py-2.5 font-sans">
                      <Badge
                        variant={hist.dns_status === 'Working' ? 'primary' : 'warning'}
                        size="sm"
                      >
                        {hist.dns_status}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-text-primary">
                      {hist.avg_latency_ms.toFixed(1)} ms
                    </td>
                    <td className="py-2.5 pr-2 text-right text-text-secondary">
                      {hist.packet_loss_percent.toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
