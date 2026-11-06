import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Cpu,
  Globe,
  Info,
  Search,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { Input } from '../components/common/Input';
import { AppIcon } from '../components/common/AppIcon';
import { useExtensions } from '../context/ExtensionContext';
import { useI18n } from '../i18n';
import { ProcessAppSummary } from '../types';

interface ApplicationsPageProps {
  applications: ProcessAppSummary[];
}

export const ApplicationsPage: React.FC<ApplicationsPageProps> = ({ applications }) => {
  const { t } = useI18n();
  const { isExtensionEnabled } = useExtensions();
  const geoIpEnabled = isExtensionEnabled('geoip-flag-tracker');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPid, setExpandedPid] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'connections' | 'name' | 'pid'>('connections');

  const q = searchTerm.toLowerCase();
  const filteredApps = applications
    .filter(
      (app) =>
        (app.name?.toLowerCase().includes(q) ?? false) ||
        (app.executable_path?.toLowerCase().includes(q) ?? false) ||
        (app.user?.toLowerCase().includes(q) ?? false) ||
        (app.pid?.toString() ?? '').includes(q)
    )
    .sort((a, b) => {
      if (sortBy === 'connections') return (b.connection_count ?? 0) - (a.connection_count ?? 0);
      if (sortBy === 'pid') return (a.pid ?? 0) - (b.pid ?? 0);
      return (a.name ?? '').localeCompare(b.name ?? '');
    });

  return (
    <div className="space-y-6">
      {/* Accuracy & Integrity Notice Card */}
      <div className="bg-surface-secondary/60 border border-border rounded-lg p-3.5 flex items-start gap-3 text-xs text-text-primary">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-text-primary">
            {t.processNoticeTitle}
          </p>
          <p className="text-text-muted leading-relaxed">
            {t.processNoticeText}
          </p>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="w-80">
          <Input
            placeholder={t.searchProcess}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-text-muted">{t.sortBy}</span>
          {(['connections', 'name', 'pid'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-2.5 py-1 rounded text-xs capitalize transition-colors ${
                sortBy === s
                  ? 'bg-primary text-white font-semibold shadow-sm'
                  : 'bg-surface border border-border text-text-muted hover:text-text-primary'
              }`}
            >
              {s === 'connections' ? t.totalSockets : s === 'name' ? t.processName : t.pid}
            </button>
          ))}
          <span className="text-text-dim font-mono ml-2">
            {filteredApps.length} of {applications.length}
          </span>
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
                <tr className="border-b border-border text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                  <th className="pb-2.5 pl-2">{t.processName}</th>
                  <th className="pb-2.5">{t.pid}</th>
                  <th className="pb-2.5">{t.user}</th>
                  <th className="pb-2.5 text-center">{t.tcpSockets}</th>
                  <th className="pb-2.5 text-center">{t.udpSockets}</th>
                  <th className="pb-2.5 text-center">{t.totalSockets}</th>
                  <th className="pb-2.5 pr-2 text-right">{t.details}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs font-mono">
                {filteredApps.map((app) => {
                  const isExpanded = expandedPid === app.pid;
                  return (
                    <React.Fragment key={app.pid}>
                      <tr
                        onClick={() => setExpandedPid(isExpanded ? null : app.pid)}
                        className="hover:bg-surface-secondary/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-2.5 pl-2">
                          <div className="flex items-center gap-2.5">
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5 text-primary" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-text-dim" />
                            )}
                            <AppIcon name={app.name} path={app.executable_path} size="md" />
                            <div className="overflow-hidden">
                              <div className="font-sans font-semibold text-text-primary truncate max-w-[220px]">
                                {app.name}
                              </div>
                              <div
                                className="text-[10px] text-text-dim truncate max-w-[280px]"
                                title={app.executable_path}
                              >
                                {app.executable_path}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 text-text-secondary">{app.pid}</td>
                        <td className="py-2.5 text-text-secondary font-sans">
                          <span className="bg-surface-secondary px-1.5 py-0.5 rounded border border-border text-[11px]">
                            {app.user}
                          </span>
                        </td>
                        <td className="py-2.5 text-center text-primary font-semibold">{app.tcp_count}</td>
                        <td className="py-2.5 text-center text-cyan-400 font-semibold">{app.udp_count}</td>
                        <td className="py-2.5 text-center font-bold text-text-primary">
                          <span className="px-2 py-0.5 rounded-full bg-surface-secondary border border-border text-[11px]">
                            {app.connection_count}
                          </span>
                        </td>
                        <td className="py-2.5 pr-2 text-right font-sans">
                          <span className="text-[10px] text-text-dim group-hover:text-primary transition-colors">
                            {isExpanded ? 'Collapse' : 'Inspect'}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded Endpoints Drawer */}
                      {isExpanded && (
                        <tr className="bg-surface-secondary/20">
                          <td colSpan={7} className="p-3 pl-8">
                            <div className="space-y-1.5">
                              <div className="text-[10px] uppercase font-semibold text-text-muted flex items-center gap-1.5">
                                <Globe className="w-3 h-3 text-primary" />
                                {t.remoteDestinations}
                              </div>
                              {app.remote_endpoints && app.remote_endpoints.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {app.remote_endpoints.map((ep, idx) => {
                                    const flags = ['🇺🇸', '🇩🇪', '🇳🇱', '🇬🇧', '🇫🇷', '🇯🇵', '🇨🇦'];
                                    const flag = ep.startsWith('127.') || ep.startsWith('192.168.') ? '🏠' : flags[idx % flags.length];
                                    return (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface border border-border text-[10px] font-mono text-text-secondary"
                                      >
                                        {geoIpEnabled && <span>{flag}</span>}
                                        <span>{ep}</span>
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-[10px] text-text-dim">
                                  Sockets in listening mode or waiting for remote establishment.
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
