import React, { useState } from 'react';
import {
  ArrowUpDown,
  Network,
  Search,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { Input } from '../components/common/Input';
import { NetworkConnection, Protocol, SocketState } from '../types';

interface ConnectionsPageProps {
  connections: NetworkConnection[];
}

export const ConnectionsPage: React.FC<ConnectionsPageProps> = ({ connections }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [protocolFilter, setProtocolFilter] = useState<'ALL' | Protocol>('ALL');
  const [stateFilter, setStateFilter] = useState<'ALL' | 'ESTABLISHED' | 'LISTEN' | 'OTHER'>('ALL');
  const [sortField, setSortField] = useState<'pid' | 'local_port' | 'state'>('state');
  const [sortAsc, setSortAsc] = useState(true);

  // Filter logic
  const filtered = connections.filter((conn) => {
    // Protocol filter
    if (protocolFilter !== 'ALL' && conn.protocol !== protocolFilter) return false;

    // State filter
    if (stateFilter === 'ESTABLISHED' && conn.state !== 'ESTABLISHED') return false;
    if (stateFilter === 'LISTEN' && conn.state !== 'LISTEN') return false;
    if (
      stateFilter === 'OTHER' &&
      (conn.state === 'ESTABLISHED' || conn.state === 'LISTEN')
    )
      return false;

    // Search term
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        (conn.process_name?.toLowerCase().includes(q) ?? false) ||
        conn.local_address.includes(q) ||
        conn.remote_address.includes(q) ||
        conn.local_port.toString().includes(q) ||
        conn.remote_port.toString().includes(q) ||
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
                    ? 'bg-primary text-background font-semibold shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {proto}
              </button>
            ))}
          </div>

          {/* State Toggle */}
          <div className="flex items-center bg-surface-secondary border border-border rounded-lg p-1 text-xs">
            {(['ALL', 'ESTABLISHED', 'LISTEN', 'OTHER'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStateFilter(st)}
                className={`px-3 py-1 rounded-md transition-colors font-medium ${
                  stateFilter === st
                    ? 'bg-secondary text-text-primary font-semibold shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Socket Connections Table */}
      <Card>
        {sorted.length === 0 ? (
          <EmptyState
            icon={<Network className="w-8 h-8" />}
            title="No Sockets Match Filters"
            description="Try modifying search keywords or relaxing socket state filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/80 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                  <th className="pb-3 pl-2">Proto</th>
                  <th className="pb-3">
                    <button
                      onClick={() => toggleSort('local_port')}
                      className="flex items-center gap-1 hover:text-text-primary"
                    >
                      <span>Local Endpoint</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="pb-3">Remote Endpoint</th>
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
                  <th className="pb-3 pr-2 text-right">User / Inode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs font-mono">
                {sorted.map((conn) => (
                  <tr
                    key={conn.id}
                    className="hover:bg-surface-secondary/40 transition-colors"
                  >
                    <td className="py-3 pl-2">
                      <span
                        className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${
                          conn.protocol === 'TCP'
                            ? 'text-primary bg-primary/10 border-primary/20'
                            : 'text-secondary bg-secondary/10 border-secondary/20'
                        }`}
                      >
                        {conn.protocol}
                      </span>
                    </td>
                    <td className="py-3 text-text-primary">
                      {conn.local_address}:<span className="font-bold text-primary">{conn.local_port}</span>
                    </td>
                    <td className="py-3 text-text-secondary">
                      {conn.remote_address}:{conn.remote_port}
                    </td>
                    <td className="py-3 font-sans">
                      <Badge variant={getStateBadgeVariant(conn.state)} size="sm">
                        {conn.state}
                      </Badge>
                    </td>
                    <td className="py-3 font-sans">
                      {conn.process_name ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-text-primary">
                            {conn.process_name}
                          </span>
                          <span className="font-mono text-xs text-text-muted">
                            ({conn.pid})
                          </span>
                        </div>
                      ) : (
                        <span className="text-text-muted text-xs italic">
                          System / Kernel
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-2 text-right text-text-muted text-[11px]">
                      {conn.user ?? 'root'} • #{conn.inode}
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
