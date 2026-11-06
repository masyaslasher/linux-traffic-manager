import React from 'react';
import { Radio, Server, Wifi } from 'lucide-react';
import { Button } from '../components/common/Button';
import { NetworkInterface } from '../types';

interface InterfacesPageProps {
  interfaces: NetworkInterface[];
  selectedInterface: string | null;
  onSelectInterface: (ifaceName: string | null) => void;
}

export const InterfacesPage: React.FC<InterfacesPageProps> = ({
  interfaces,
  selectedInterface,
  onSelectInterface,
}) => {
  return (
    <div className="space-y-6">
      {/* Header Overview */}
      <div className="flex items-center justify-between bg-surface p-4 border border-border rounded-lg">
        <div>
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Wifi className="w-4 h-4 text-primary" />
            Network Interface Manager
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Physical, wireless, and virtual network adapters discovered on this Linux host.
          </p>
        </div>
        <div className="text-xs font-mono text-text-muted">
          Total Interfaces: <span className="text-primary font-bold">{interfaces.length}</span>
        </div>
      </div>

      {/* Interfaces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {interfaces.map((iface) => {
          const isMonitored =
            selectedInterface === iface.name ||
            (!selectedInterface && iface.is_up && !iface.is_loopback);

          return (
            <div
              key={String(iface.name)}
              className={`bg-surface border rounded-xl p-5 flex flex-col justify-between transition-colors ${
                isMonitored ? 'border-primary/50 bg-primary/5' : 'border-border'
              }`}
            >
              <div>
                {/* Title & Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-surface-secondary border border-border text-primary">
                      {iface.is_loopback ? (
                        <Radio className="w-4 h-4" />
                      ) : String(iface.name || '').startsWith('wl') ? (
                        <Wifi className="w-4 h-4" />
                      ) : (
                        <Server className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold font-mono text-text-primary flex items-center gap-2">
                        {String(iface.name)}
                        {isMonitored && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-sans font-semibold">
                            Monitored
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-text-muted">
                        {iface.driver ? `Driver: ${iface.driver}` : iface.is_loopback ? 'Virtual Loopback' : 'Linux Net Device'}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-sans font-semibold ${
                      iface.is_up
                        ? 'bg-success/15 text-success'
                        : 'bg-error/15 text-error'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {(iface.state || 'UNKNOWN').toUpperCase()}
                  </span>
                </div>

                {/* Properties List */}
                <div className="grid grid-cols-2 gap-3 mt-4 text-xs font-mono">
                  <div className="p-2 rounded bg-surface-secondary/70 border border-border/60">
                    <span className="text-text-muted text-[10px] block">MAC Address</span>
                    <span className="text-text-primary truncate block">
                      {iface.mac_address || 'N/A'}
                    </span>
                  </div>

                  <div className="p-2 rounded bg-surface-secondary/70 border border-border/60">
                    <span className="text-text-muted text-[10px] block">MTU Size</span>
                    <span className="text-text-primary block">
                      {iface.mtu ? `${iface.mtu} octets` : '1500'}
                    </span>
                  </div>

                  <div className="p-2 rounded bg-surface-secondary/70 border border-border/60">
                    <span className="text-text-muted text-[10px] block">Link Speed / Duplex</span>
                    <span className="text-text-primary block">
                      {iface.speed_mbps ? `${iface.speed_mbps} Mbps` : 'Adaptive'}{' '}
                      {iface.duplex ? `(${iface.duplex})` : ''}
                    </span>
                  </div>

                  <div className="p-2 rounded bg-surface-secondary/70 border border-border/60">
                    <span className="text-text-muted text-[10px] block">Carrier State</span>
                    <span className="text-text-primary block">
                      {iface.carrier !== null && iface.carrier !== undefined
                        ? iface.carrier
                          ? 'Physical Link OK'
                          : 'No Carrier'
                        : iface.is_up
                        ? 'Active'
                        : 'Disconnected'}
                    </span>
                  </div>
                </div>

                {/* IP & Gateway Information */}
                <div className="mt-3 p-3 bg-surface-secondary/40 rounded border border-border/60 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">IPv4 / IPv6:</span>
                    <span className="font-mono text-text-primary truncate max-w-[200px]">
                      {iface.ip_addresses.length > 0
                        ? iface.ip_addresses.join(', ')
                        : 'No IP assigned'}
                    </span>
                  </div>
                  {iface.gateway && (
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">Default Gateway:</span>
                      <span className="font-mono text-success">{iface.gateway}</span>
                    </div>
                  )}
                  {iface.dns_servers && iface.dns_servers.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">DNS Nameservers:</span>
                      <span className="font-mono text-primary truncate max-w-[180px]">
                        {iface.dns_servers.join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Hardware Error Counters */}
                <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[11px] font-mono">
                  <div className="p-1.5 rounded bg-surface-secondary border border-border/40">
                    <div className="text-text-dim text-[9px]">RX Errors</div>
                    <div className={iface.rx_errors > 0 ? 'text-error font-bold' : 'text-text-muted'}>
                      {iface.rx_errors}
                    </div>
                  </div>
                  <div className="p-1.5 rounded bg-surface-secondary border border-border/40">
                    <div className="text-text-dim text-[9px]">TX Errors</div>
                    <div className={iface.tx_errors > 0 ? 'text-error font-bold' : 'text-text-muted'}>
                      {iface.tx_errors}
                    </div>
                  </div>
                  <div className="p-1.5 rounded bg-surface-secondary border border-border/40">
                    <div className="text-text-dim text-[9px]">RX Drops</div>
                    <div className={iface.rx_dropped > 0 ? 'text-warning font-bold' : 'text-text-muted'}>
                      {iface.rx_dropped}
                    </div>
                  </div>
                  <div className="p-1.5 rounded bg-surface-secondary border border-border/40">
                    <div className="text-text-dim text-[9px]">TX Drops</div>
                    <div className={iface.tx_dropped > 0 ? 'text-warning font-bold' : 'text-text-muted'}>
                      {iface.tx_dropped}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                <span className="text-[11px] text-text-dim">
                  Total Traffic: {((iface.rx_bytes + iface.tx_bytes) / (1024 * 1024)).toFixed(1)} MB
                </span>
                {!isMonitored ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onSelectInterface(iface.name)}
                  >
                    Set as Primary Monitor
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectInterface(null)}
                  >
                    Reset to Auto
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
