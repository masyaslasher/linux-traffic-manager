import React, { useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
  Cpu,
  Download,
  Gauge,
  History,
  LayoutDashboard,
  Network,
  Search,
  Settings,
  Wifi,
  Workflow,
  X,
} from 'lucide-react';
import { NavigationTab } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: NavigationTab) => void;
  onRunDiagnostics: () => void;
  onExportCsv: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onRunDiagnostics,
  onExportCsv,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'tab-dashboard',
      title: 'Go to Dashboard',
      subtitle: 'Real-time bandwidth graph, traffic totals, interface status',
      icon: <LayoutDashboard className="w-4 h-4 text-primary" />,
      action: () => {
        onSelectTab('dashboard');
        onClose();
      },
    },
    {
      id: 'tab-apps',
      title: 'Go to Process Monitor',
      subtitle: 'Active processes utilizing network sockets',
      icon: <Cpu className="w-4 h-4 text-primary" />,
      action: () => {
        onSelectTab('applications');
        onClose();
      },
    },
    {
      id: 'tab-conns',
      title: 'Go to Connection Inspector',
      subtitle: 'Inspect established and listening sockets, remote hosts',
      icon: <Network className="w-4 h-4 text-primary" />,
      action: () => {
        onSelectTab('connections');
        onClose();
      },
    },
    {
      id: 'tab-analytics',
      title: 'Go to Network Analytics',
      subtitle: 'Long-term bandwidth breakdown, peak spikes, interface metrics',
      icon: <BarChart3 className="w-4 h-4 text-primary" />,
      action: () => {
        onSelectTab('analytics');
        onClose();
      },
    },
    {
      id: 'tab-diagnostics',
      title: 'Go to Diagnostics Suite',
      subtitle: 'Test DNS, router gateway, packet loss, TCP port reachability',
      icon: <Activity className="w-4 h-4 text-primary" />,
      action: () => {
        onSelectTab('diagnostics');
        onClose();
      },
    },
    {
      id: 'tab-automation',
      title: 'Go to Automation Center',
      subtitle: 'Configure WHEN / IF / THEN alerting and traffic triggers',
      icon: <Workflow className="w-4 h-4 text-primary" />,
      action: () => {
        onSelectTab('automation');
        onClose();
      },
    },
    {
      id: 'tab-bandwidth',
      title: 'Go to Bandwidth Control',
      subtitle: 'Traffic control profiles, bandwidth limit simulations',
      icon: <Gauge className="w-4 h-4 text-primary" />,
      action: () => {
        onSelectTab('bandwidth');
        onClose();
      },
    },
    {
      id: 'tab-interfaces',
      title: 'Go to Network Interface Manager',
      subtitle: 'View adapter hardware, MTU, carrier, DNS servers, MAC',
      icon: <Wifi className="w-4 h-4 text-primary" />,
      action: () => {
        onSelectTab('interfaces');
        onClose();
      },
    },
    {
      id: 'tab-history',
      title: 'Go to History & Logs',
      subtitle: 'View persistent SQLite samples and diagnostic records',
      icon: <History className="w-4 h-4 text-primary" />,
      action: () => {
        onSelectTab('history');
        onClose();
      },
    },
    {
      id: 'tab-settings',
      title: 'Go to Settings Center',
      subtitle: 'Appearance, themes, polling rates, privacy configuration',
      icon: <Settings className="w-4 h-4 text-primary" />,
      action: () => {
        onSelectTab('settings');
        onClose();
      },
    },
    {
      id: 'action-diag',
      title: 'Run Network Diagnostics Now',
      subtitle: 'Executes rapid gateway, DNS, and latency test',
      icon: <Activity className="w-4 h-4 text-warning" />,
      action: () => {
        onSelectTab('diagnostics');
        onRunDiagnostics();
        onClose();
      },
    },
    {
      id: 'action-export-csv',
      title: 'Export Traffic History (CSV)',
      subtitle: 'Download stored time-series samples to file',
      icon: <Download className="w-4 h-4 text-success" />,
      action: () => {
        onExportCsv();
        onClose();
      },
    },
  ];

  const filtered = actions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
      <div className="w-full max-w-xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface-secondary">
          <Search className="w-4 h-4 text-text-muted shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to section..."
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-primary rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <button
                key={item.id}
                onClick={item.action}
                className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-secondary transition-colors group"
              >
                <div className="p-1.5 rounded-md bg-surface border border-border group-hover:border-primary/30">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-text-primary group-hover:text-primary transition-colors">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-text-muted truncate">{item.subtitle}</div>
                </div>
              </button>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-text-muted">
              No matching commands found for "{query}"
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-border bg-surface text-[10px] text-text-muted flex items-center justify-between">
          <span>Navigate with mouse or Esc to close</span>
          <span className="font-mono">Linux Traffic Manager 2.0</span>
        </div>
      </div>
    </div>
  );
};
