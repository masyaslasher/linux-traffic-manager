import React, { useState } from 'react';
import {
  Cpu,
  Info,
  Search,
  Terminal,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { Input } from '../components/common/Input';
import { ProcessAppSummary } from '../types';

interface ApplicationsPageProps {
  applications: ProcessAppSummary[];
}

export const ApplicationsPage: React.FC<ApplicationsPageProps> = ({ applications }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredApps = applications.filter(
    (app) =>
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.executable_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.pid.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Accuracy & Integrity Notice Card */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3 text-xs text-text-primary">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-text-primary">
            Linux Socket-to-Process Attribution
          </p>
          <p className="text-text-secondary leading-relaxed">
            LTM correlates active sockets to processes via Linux <code className="text-primary font-mono bg-surface-secondary px-1 py-0.5 rounded">/proc/[pid]/fd</code>.
            In compliance with our integrity policy, connection counts are not fabricated into estimated byte counts.
            Per-process byte accounting requires kernel eBPF stream tracking.
          </p>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="w-80">
          <Input
            placeholder="Search by process, executable, PID, or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="text-xs text-text-secondary font-mono">
          Showing {filteredApps.length} of {applications.length} active processes
        </div>
      </div>

      {/* Process Applications Table */}
      <Card>
        {filteredApps.length === 0 ? (
          <EmptyState
            icon={<Cpu className="w-8 h-8" />}
            title="No Processes Found"
            description={
              searchTerm
                ? `No active process matches "${searchTerm}".`
                : 'No processes currently hold open network sockets.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                  <th className="pb-3 pl-2">Application / Process</th>
                  <th className="pb-3">PID</th>
                  <th className="pb-3">User</th>
                  <th className="pb-3 text-center">TCP Sockets</th>
                  <th className="pb-3 text-center">UDP Sockets</th>
                  <th className="pb-3 text-center">Total Connections</th>
                  <th className="pb-3 pr-2 text-right">Attribution Model</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                {filteredApps.map((app) => (
                  <tr
                    key={app.pid}
                    className="hover:bg-surface-secondary/40 transition-colors group"
                  >
                    <td className="py-3.5 pl-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-surface-secondary rounded-lg text-primary border border-border group-hover:border-primary/40">
                          <Terminal className="w-4 h-4" />
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-semibold text-text-primary truncate max-w-[220px]">
                            {app.name}
                          </div>
                          <div
                            className="text-[11px] font-mono text-text-muted truncate max-w-[280px]"
                            title={app.executable_path}
                          >
                            {app.executable_path}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 font-mono text-text-secondary">{app.pid}</td>
                    <td className="py-3 text-text-secondary">
                      <span className="font-mono bg-surface-secondary px-2 py-0.5 rounded border border-border/60">
                        {app.user}
                      </span>
                    </td>
                    <td className="py-3 text-center font-mono text-text-primary">
                      {app.tcp_count}
                    </td>
                    <td className="py-3 text-center font-mono text-text-primary">
                      {app.udp_count}
                    </td>
                    <td className="py-3 text-center">
                      <span className="font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                        {app.connection_count}
                      </span>
                    </td>
                    <td className="py-3 pr-2 text-right">
                      <Badge variant="primary" size="sm">
                        Connection-based
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
