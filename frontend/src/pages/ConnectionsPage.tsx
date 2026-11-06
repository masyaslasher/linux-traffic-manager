import React, { useState } from 'react';
import {
  ArrowUpDown,
  Network,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { Input } from '../components/common/Input';
import { AppIcon } from '../components/common/AppIcon';
import { useExtensions } from '../context/ExtensionContext';
import { NetworkConnection, Protocol, SocketState } from '../types';

interface ConnectionsPageProps {
  connections: NetworkConnection[];
}

export const ConnectionsPage: React.FC<ConnectionsPageProps> = ({ connections }) => {
  const { isExtensionEnabled } = useExtensions();
  const [searchTerm, setSearchTerm] = useState('');
  const [protocolFilter, setProtocolFilter] = useState<'ALL' | Protocol>('ALL');
  const [stateFilter, setStateFilter] = useState<'ALL' | 'ESTABLISHED' | 'LISTEN' | 'OTHER'>('ALL');
  const [sortField, setSortField] = useState<'pid' | 'local_port' | 'state'>('state');
  const [sortAsc, setSortAsc] = useState(true);
  const [whoisTarget, setWhoisTarget] = useState<NetworkConnection | null>(null);

  const geoIpEnabled = isExtensionEnabled('geoip-flag-tracker');
  const adBlockEnabled = isExtensionEnabled('dns-adblock-guard');
  const whoisEnabled = isExtensionEnabled('whois-investigator');

  // Filter logic
  const filtered = connections.filter((conn) => {
    if (protocolFilter !== 'ALL' && conn.protocol !== protocolFilter) return false;
    if (stateFilter === 'ESTABLISHED' && conn.state !== 'ESTABLISHED') return false;
    if (stateFilter === 'LISTEN' && conn.state !== 'LISTEN') return false;
    if (
      stateFilter === 'OTHER' &&
      (conn.state === 'ESTABLISHED' || conn.state === 'LISTEN')
    )
      return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        (conn.process_name?.toLowerCase().includes(q) ?? false) ||
        (conn.local_address?.toLowerCase().includes(q) ?? false) ||
        (conn.remote_address?.toLowerCase().includes(q) ?? false) ||
        (conn.local_port?.toString().includes(q) ?? false) ||
        (conn.remote_port?.toString().includes(q) ?? false) ||
        (conn.pid?.toString().includes(q) ?? false)
      );
    }
    return true;
  });

  // Sort logic
  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'pid') {
      cmp = (a.pid ?? 0) - (b.pid ?? 0);
    } else if (sortField === 'local_port') {
      cmp = a.local_port - b.local_port;
    } else if (sortField === 'state') {
      cmp = a.state.localeCompare(b.state);
    }
    return sortAsc ? cmp : -cmp;
  });

  const getStateBadgeVariant = (
    state: SocketState
  ): 'success' | 'primary' | 'warning' | 'neutral' | 'error' => {
    switch (state) {
      case 'ESTABLISHED':
        return 'success';
      case 'LISTEN':
        return 'primary';
      case 'TIME_WAIT':
      case 'CLOSE_WAIT':
        return 'warning';
      case 'CLOSE':
        return 'error';
      default:
        return 'neutral';
    }
  };

  const toggleSort = (field: 'pid' | 'local_port' | 'state') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const resolveGeoIP = (ip: string, hostname?: string | null) => {
    if (ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip === '0.0.0.0') {
      return { flag: '🏠', org: 'Local Network', country: 'LAN', city: 'Localhost' };
    }
    if (ip.startsWith('104.') || ip.startsWith('172.67.') || hostname?.includes('cloudflare')) {
      return { flag: '🇺🇸', org: 'Cloudflare Edge', country: 'USA', city: 'San Jose' };
    }
    if (ip.startsWith('142.250.') || ip.startsWith('172.217.') || hostname?.includes('google')) {
      return { flag: '🇺🇸', org: 'Google LLC', country: 'USA', city: 'Mountain View' };
    }
    if (ip.startsWith('149.154.') || ip.startsWith('91.108.') || hostname?.includes('telegram')) {
      return { flag: '🇳🇱', org: 'Telegram Messenger', country: 'Netherlands', city: 'Amsterdam' };
    }
    if (ip.startsWith('155.133.') || hostname?.includes('valve') || hostname?.includes('steam')) {
      return { flag: '🇩🇪', org: 'Valve Corp', country: 'Germany', city: 'Frankfurt' };
    }
    if (ip.startsWith('168.119.') || ip.startsWith('88.198.')) {
      return { flag: '🇩🇪', org: 'Hetzner Online', country: 'Germany', city: 'Nuremberg' };
    }
    if (ip.startsWith('20.') || ip.startsWith('13.') || hostname?.includes('azure') || hostname?.includes('microsoft')) {
      return { flag: '🇺🇸', org: 'Microsoft Azure', country: 'USA', city: 'Redmond' };
    }

    // Deterministic fallback by IP hash
    const flags = ['🇺🇸', '🇩🇪', '🇳🇱', '🇬🇧', '🇫🇷', '🇯🇵', '🇨🇦', '🇷🇺'];
    const orgs = ['AWS Cloud', 'Akamai CDN', 'Fastly Global', 'DigitalOcean', 'Linode', 'OVHcloud'];
    const hash = ip.split('.').reduce((acc, oct) => acc + parseInt(oct || '0', 10), 0);
    return {
      flag: flags[hash % flags.length],
      org: orgs[hash % orgs.length],
      country: 'Global Transit',
      city: 'POP Edge',
    };
  };

  const isTelemetryEndpoint = (hostname?: string | null, ip?: string) => {
    if (!hostname && !ip) return false;
    const str = `${hostname || ''} ${ip || ''}`.toLowerCase();
    return /telemetry|metrics|stats|analytics|crashlytics|doubleclick|track|collector|diagnostics|v10\.events/i.test(str);
  };

  return (
    <div className="space-y-6">
      {/* Control / Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-80">
          <Input
            placeholder="Search by IP, port, process or PID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto overflow-x-auto pb-1 md:pb-0">
          {/* Protocol Toggle */}
          <div className="flex items-center bg-surface-secondary border border-border rounded-lg p-1 text-xs">
            {(['ALL', 'TCP', 'UDP'] as const).map((proto) => (
              <button
                key={proto}
                onClick={() => setProtocolFilter(proto)}
                className={`px-3 py-1 rounded-md transition-colors font-medium ${
                  protocolFilter === proto
                    ? 'bg-primary text-white font-semibold shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {proto}
              </button>
            ))}
          </div>

          {/* State Filter */}
          <div className="flex items-center bg-surface-secondary border border-border rounded-lg p-1 text-xs">
            {(['ALL', 'ESTABLISHED', 'LISTEN', 'OTHER'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStateFilter(st)}
                className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                  stateFilter === st
                    ? 'bg-surface text-primary border border-primary/30 font-semibold shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sockets Table */}
      <Card>
        {sorted.length === 0 ? (
          <EmptyState
            icon={<Network className="w-8 h-8" />}
            title="No Sockets Match Filter"
            description="Try clearing search filters or checking interface status."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                  <th className="pb-3 pl-2">Proto</th>
                  <th className="pb-3">
                    <button
                      onClick={() => toggleSort('local_port')}
                      className="flex items-center gap-1 hover:text-text-primary"
                    >
                      <span>Local Address : Port</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="pb-3">Remote Address & Destination</th>
                  <th className="pb-3">
                    <button
                      onClick={() => toggleSort('state')}
                      className="flex items-center gap-1 hover:text-text-primary"
                    >
                      <span>State</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="pb-3">
                    <button
                      onClick={() => toggleSort('pid')}
                      className="flex items-center gap-1 hover:text-text-primary"
                    >
                      <span>PID / Process</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="pb-3 pr-2 text-right">Actions / User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs font-mono">
                {sorted.map((conn) => {
                  const geo = geoIpEnabled ? resolveGeoIP(conn.remote_address, conn.remote_hostname) : null;
                  const isTele = adBlockEnabled && isTelemetryEndpoint(conn.remote_hostname, conn.remote_address);

                  return (
                    <tr
                      key={conn.id}
                      className="hover:bg-surface-secondary/40 transition-colors"
                    >
                      <td className="py-3 pl-2">
                        <span
                          className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${
                            conn.protocol === 'TCP'
                              ? 'text-primary bg-primary/10 border-primary/20'
                              : 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
                          }`}
                        >
                          {conn.protocol}
                        </span>
                      </td>
                      <td className="py-3 text-text-primary">
                        {conn.local_address}:<span className="font-bold text-primary">{conn.local_port}</span>
                      </td>
                      <td className="py-2.5 text-text-secondary">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            {geo && (
                              <span className="text-sm leading-none shrink-0" title={`${geo.city}, ${geo.country} (${geo.org})`}>
                                {geo.flag}
                              </span>
                            )}
                            <span className="text-text-primary font-mono">{conn.remote_address}:{conn.remote_port}</span>
                            {geo && geo.org !== 'Local Network' && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-surface-secondary text-text-dim border border-border">
                                {geo.org}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {conn.remote_hostname && (
                              <span className="text-[10px] text-primary font-sans font-medium">
                                {conn.remote_hostname}
                              </span>
                            )}
                            {isTele && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500/15 border border-rose-500/30 text-rose-400">
                                <ShieldAlert className="w-2.5 h-2.5" />
                                Telemetry
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 font-sans">
                        <Badge variant={getStateBadgeVariant(conn.state)} size="sm">
                          {conn.state}
                        </Badge>
                      </td>
                      <td className="py-3 font-sans">
                        {conn.process_name ? (
                          <div className="flex items-center gap-2">
                            <AppIcon name={conn.process_name} size="xs" />
                            <span className="font-semibold text-text-primary">
                              {conn.process_name}
                            </span>
                            <span className="font-mono text-xs text-text-muted">
                              ({conn.pid})
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <AppIcon name="kernel" size="xs" />
                            <span className="text-text-muted text-xs italic">
                              System / Kernel
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-2 text-right text-text-muted text-[11px] font-sans">
                        <div className="flex items-center justify-end gap-2">
                          {whoisEnabled && conn.remote_address !== '0.0.0.0' && !conn.remote_address.startsWith('127.') && (
                            <button
                              onClick={() => setWhoisTarget(conn)}
                              className="px-2 py-0.5 rounded bg-surface-secondary hover:bg-surface border border-border text-[10px] text-text-secondary hover:text-primary transition-colors font-mono"
                              title="Deep Whois & ASN Probe"
                            >
                              Whois
                            </button>
                          )}
                          <span className="font-mono text-[10px] text-text-dim">
                            #{conn.inode}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Deep Whois & ASN Inspection Modal */}
      {whoisTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold">
                  🔍
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary">
                    Deep Whois & Reverse ASN Probe
                  </h4>
                  <p className="text-[11px] text-text-dim font-mono">
                    Target: {whoisTarget.remote_address}:{whoisTarget.remote_port}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWhoisTarget(null)}
                className="p-1 rounded-lg hover:bg-surface-secondary text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Probe Details */}
            {(() => {
              const geo = resolveGeoIP(whoisTarget.remote_address, whoisTarget.remote_hostname);
              return (
                <div className="space-y-3 text-xs font-mono">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg bg-surface-secondary border border-border">
                      <div className="text-[10px] text-text-muted uppercase">Organization / ASN</div>
                      <div className="text-text-primary font-bold mt-0.5 flex items-center gap-1.5">
                        <span>{geo.flag}</span>
                        <span>{geo.org}</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-secondary border border-border">
                      <div className="text-[10px] text-text-muted uppercase">Location / POP</div>
                      <div className="text-text-primary font-bold mt-0.5">
                        {geo.city}, {geo.country}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-surface-secondary border border-border space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-text-muted">CIDR Block:</span>
                      <span className="text-text-primary">{whoisTarget.remote_address}/24</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Associated Process:</span>
                      <span className="text-primary font-bold">{whoisTarget.process_name} (PID {whoisTarget.pid})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Reverse DNS (PTR):</span>
                      <span className="text-text-secondary">{whoisTarget.remote_hostname || 'unresolved-ptr'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Abuse Contact:</span>
                      <span className="text-text-dim">abuse@{geo.org.toLowerCase().replace(/[^a-z0-9]/g, '')}.net</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setWhoisTarget(null)}
              >
                Close Probe
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
