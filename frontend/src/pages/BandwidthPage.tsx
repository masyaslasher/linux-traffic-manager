import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Info,
  Layers,
  Lock,
  Sliders,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { ProcessAppSummary, SpeedMetrics } from '../types';

interface BandwidthPageProps {
  applications: ProcessAppSummary[];
  speedMetrics: SpeedMetrics | null;
}

export const BandwidthPage: React.FC<BandwidthPageProps> = ({
  applications,
  speedMetrics,
}) => {
  const [selectedProfile, setSelectedProfile] = useState<'standard' | 'gaming' | 'streaming' | 'throttled'>('standard');
  const [downloadLimitMbps, setDownloadLimitMbps] = useState('100');
  const [uploadLimitMbps, setUploadLimitMbps] = useState('50');
  const [showApplyModal, setShowApplyModal] = useState(false);

  const profiles = [
    {
      id: 'standard',
      name: 'Standard (Unrestricted)',
      desc: 'Default kernel FIFO packet queuing without bandwidth rate ceilings.',
      icon: <Gauge className="w-4 h-4 text-primary" />,
    },
    {
      id: 'gaming',
      name: 'Low-Latency Gaming',
      desc: 'Prioritizes small interactive UDP packets (DNS, games) over bulk file transfers.',
      icon: <Layers className="w-4 h-4 text-success" />,
    },
    {
      id: 'streaming',
      name: 'Media Streaming Buffer',
      desc: 'Smoothes throughput variance and avoids packet bursts causing video rebuffering.',
      icon: <Sliders className="w-4 h-4 text-secondary" />,
    },
    {
      id: 'throttled',
      name: 'Constrained Cap Mode',
      desc: 'Applies explicit egress shaping to stay under metered tethering bandwidth.',
      icon: <Lock className="w-4 h-4 text-warning" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Gauge className="w-4 h-4 text-primary" />
              Bandwidth Management & Traffic Control
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Inspect application socket utilization and configure Linux Traffic Control (tc / qdisc) profiles.
            </p>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="text-text-muted">Current Rate:</span>
            <span className="text-primary font-bold">{speedMetrics?.rx_speed_human || '0 B/s'}</span>
            <span className="text-border">/</span>
            <span className="text-secondary font-bold">{speedMetrics?.tx_speed_human || '0 B/s'}</span>
          </div>
        </div>
      </div>

      {/* Linux Traffic Control Transparency Notice */}
      <div className="p-3.5 bg-surface-secondary/60 border border-border rounded-lg flex items-start gap-3 text-xs">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-text-primary">System Traffic Control Architecture</div>
          <div className="text-text-muted leading-relaxed">
            Linux controls traffic through kernel packet schedulers (<code className="px-1 py-0.5 rounded bg-surface border border-border text-primary font-mono text-[11px]">tc qdisc</code>) and <code className="px-1 py-0.5 rounded bg-surface border border-border text-primary font-mono text-[11px]">cgroup v2</code> network controllers. Per-process bandwidth throttling applies to unified cgroup slices with explicit administrator authorization. No hidden or destructive system changes are ever made without your verification.
          </div>
        </div>
      </div>

      {/* Traffic Control Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profiles.map((p) => {
          const isSelected = selectedProfile === p.id;
          return (
            <div
              key={p.id}
              onClick={() => setSelectedProfile(p.id as any)}
              className={`bg-surface border rounded-lg p-4 cursor-pointer transition-colors ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-border/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-md bg-surface-secondary border border-border">
                    {p.icon}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-text-primary">{p.name}</div>
                    <div className="text-[11px] text-text-muted mt-0.5">{p.desc}</div>
                  </div>
                </div>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Limit Configuration */}
      <Card title="Traffic Shaping Parameters" subtitle="Specify link limits for selected profile">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Max Ingress (Download) Cap
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={downloadLimitMbps}
                onChange={(e) => setDownloadLimitMbps(e.target.value)}
                className="w-full bg-surface-secondary border border-border rounded px-3 py-1.5 text-xs text-text-primary font-mono focus:outline-none focus:border-primary"
              />
              <span className="text-xs font-mono text-text-muted">Mbps</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Max Egress (Upload) Cap
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={uploadLimitMbps}
                onChange={(e) => setUploadLimitMbps(e.target.value)}
                className="w-full bg-surface-secondary border border-border rounded px-3 py-1.5 text-xs text-text-primary font-mono focus:outline-none focus:border-primary"
              />
              <span className="text-xs font-mono text-text-muted">Mbps</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowApplyModal(true)}
          >
            Review & Apply Profile
          </Button>
        </div>
      </Card>

      {/* Application Sockets & Bandwidth Correlation Table */}
      <Card
        title="Application Network Activity"
        subtitle="Active applications and associated network sockets"
      >
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-text-muted">
                <th className="pb-2 font-medium">Process Name</th>
                <th className="pb-2 font-medium">PID</th>
                <th className="pb-2 font-medium">User</th>
                <th className="pb-2 font-medium text-center">TCP Sockets</th>
                <th className="pb-2 font-medium text-center">UDP Sockets</th>
                <th className="pb-2 font-medium">Attribution Model</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono">
              {applications.slice(0, 10).map((app) => (
                <tr key={app.pid} className="hover:bg-surface-secondary/50">
                  <td className="py-2.5 font-sans font-semibold text-text-primary flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    {app.name}
                  </td>
                  <td className="py-2.5 text-text-secondary">{app.pid}</td>
                  <td className="py-2.5 text-text-muted font-sans">{app.user}</td>
                  <td className="py-2.5 text-center text-primary">{app.tcp_count}</td>
                  <td className="py-2.5 text-center text-secondary">{app.udp_count}</td>
                  <td className="py-2.5 font-sans">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-surface-secondary text-text-muted border border-border">
                      {app.attribution_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Confirmation Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface border border-border rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 text-warning">
              <AlertTriangle className="w-6 h-6" />
              <h4 className="text-sm font-bold text-text-primary">Confirm Traffic Control Profile</h4>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Applying the <strong className="text-text-primary uppercase">{selectedProfile}</strong> profile will configure Linux kernel packet queueing disciplines. This requires explicit confirmation to ensure your active SSH or network sessions remain uninterrupted.
            </p>

            <div className="p-3 bg-surface-secondary rounded-lg border border-border text-xs font-mono space-y-1">
              <div>Download Limit: {downloadLimitMbps} Mbps</div>
              <div>Upload Limit: {uploadLimitMbps} Mbps</div>
              <div>Interface: Default active interface</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowApplyModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setShowApplyModal(false);
                  alert(`Profile "${selectedProfile}" registered.`);
                }}
              >
                Authorize & Activate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
