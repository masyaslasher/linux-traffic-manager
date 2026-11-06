import React from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  Globe,
  Play,
  Router,
  XCircle,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { DiagnosticReport, StoredDiagnosticReport } from '../types';

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
  return (
    <div className="space-y-6">
      {/* Header action bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-text-primary">Network Diagnostic Suite</h3>
          <p className="text-xs text-text-secondary">
            Execute real-time gateway probes, DNS latency benchmarks, and packet loss tests.
          </p>
        </div>
        <Button
          onClick={onRunDiagnostics}
          loading={isRunning}
          icon={<Play className="w-4 h-4 fill-current" />}
        >
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
          icon={<Activity className="w-5 h-5" />}
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
          icon={<Globe className="w-5 h-5" />}
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
          icon={<Router className="w-5 h-5" />}
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
          icon={<Clock className="w-5 h-5" />}
          color={
            (diagnosticReport?.packet_loss_percent ?? 0) === 0 ? 'secondary' : 'warning'
          }
        />
      </div>

      {/* Detailed Diagnostics Breakdown */}
      {diagnosticReport && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* DNS Resolution Tests */}
          <Card title="DNS Domain Lookup Benchmarks" subtitle="Resolution latency across global test roots">
            <div className="space-y-3">
              {diagnosticReport.dns_checks.map((check) => (
                <div
                  key={check.domain}
                  className="flex items-center justify-between p-3 bg-surface-secondary/50 border border-border/80 rounded-lg text-xs"
                >
                  <div className="flex items-center gap-3">
                    {check.is_working ? (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : (
                      <XCircle className="w-4 h-4 text-error" />
                    )}
                    <div>
                      <span className="font-semibold text-text-primary">
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
            <div className="space-y-3">
              {diagnosticReport.probes.map((probe) => (
                <div
                  key={probe.target}
                  className="flex items-center justify-between p-3 bg-surface-secondary/50 border border-border/80 rounded-lg text-xs"
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
