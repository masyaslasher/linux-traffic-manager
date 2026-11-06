import React from 'react';
import {
  Box,
  Compass,
  Database,
  Download,
  Film,
  Gamepad2,
  GitBranch,
  Globe,
  Headphones,
  Lock,
  MessageSquare,
  Server,
  Share2,
  Shield,
  Terminal,
  Tv,
  Wifi,
} from 'lucide-react';

interface AppIconProps {
  name?: string;
  path?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({
  name = '',
  path = '',
  size = 'md',
  className = '',
}) => {
  const query = `${name} ${path}`.toLowerCase();

  const sizeClasses = {
    xs: 'w-4 h-4 text-[9px]',
    sm: 'w-5 h-5 text-[10px]',
    md: 'w-6 h-6 text-xs',
    lg: 'w-8 h-8 text-sm',
  }[size];

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  // 1. Browsers
  if (query.includes('firefox')) {
    return (
      <div
        className={`${sizeClasses} shrink-0 rounded-md bg-gradient-to-tr from-amber-600 via-orange-500 to-rose-500 text-white flex items-center justify-center shadow-sm ${className}`}
        title="Mozilla Firefox"
      >
        <Globe className={iconSizes} />
      </div>
    );
  }
  if (query.includes('chrome') || query.includes('chromium')) {
    return (
      <div
        className={`${sizeClasses} shrink-0 rounded-md bg-gradient-to-tr from-emerald-500 via-amber-400 to-rose-500 text-white flex items-center justify-center shadow-sm ${className}`}
        title="Google Chrome / Chromium"
      >
        <Compass className={iconSizes} />
      </div>
    );
  }
  if (query.includes('brave')) {
    return (
      <div
        className={`${sizeClasses} shrink-0 rounded-md bg-gradient-to-tr from-orange-600 to-red-600 text-white flex items-center justify-center shadow-sm ${className}`}
        title="Brave Browser"
      >
        <Shield className={iconSizes} />
      </div>
    );
  }
  if (query.includes('edge') || query.includes('msedge')) {
    return (
      <div
        className={`${sizeClasses} shrink-0 rounded-md bg-gradient-to-tr from-teal-500 to-blue-600 text-white flex items-center justify-center shadow-sm ${className}`}
        title="Microsoft Edge"
      >
        <Globe className={iconSizes} />
      </div>
    );
  }
  if (query.includes('tor')) {
    return (
      <div
        className={`${sizeClasses} shrink-0 rounded-md bg-gradient-to-tr from-purple-700 to-indigo-600 text-white flex items-center justify-center shadow-sm ${className}`}
        title="Tor Network"
      >
        <Lock className={iconSizes} />
      </div>
    );
  }

  // 2. Messengers
  if (query.includes('telegram') || query.includes('kotatogram') || query.includes('ayugram')) {
    return (
      <div
        className={`${sizeClasses} shrink-0 rounded-md bg-sky-500 text-white flex items-center justify-center shadow-sm ${className}`}
        title="Telegram Messenger"
      >
        <SendPlaneIcon className={iconSizes} />
      </div>
    );
  }
  if (query.includes('discord') || query.includes('vesktop') || query.includes('webcord')) {
    return (
      <div
        className={`${sizeClasses} shrink-0 rounded-md bg-[#5865F2] text-white flex items-center justify-center shadow-sm ${className}`}
        title="Discord"
      >
        <Gamepad2 className={iconSizes} />
      </div>
    );
  }
  if (query.includes('slack')) {
    return (
      <div
        className={`${sizeClasses} shrink-0 rounded-md bg-gradient-to-tr from-amber-500 via-rose-500 to-cyan-500 text-white flex items-center justify-center shadow-sm ${className}`}
        title="Slack"
      >
        <MessageSquare className={iconSizes} />
      </div>
    );
  }
  if (query.includes('signal')) {
    return (
      <div
        className={`${sizeClasses} shrink-0 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-sm ${className}`}
        title="Signal Messenger"
      >
        <MessageSquare className={iconSizes} />
      </div>
    );
  }

  // 3. Media & Entertainment
  if (query.includes('spotify') || query.includes('spicetify')) {
    return (
      <div
        className={`${sizeClasses} shrink-0 rounded-md bg-emerald-500 text-zinc-950 flex items-center justify-center font-bold shadow-sm ${className}`}
        title="Spotify"
      >
        <Headphones className={iconSizes} />
      </div>
    );
  }
  if (query.includes('steam')) {
    return (
      <div
        className={`${sizeClasses} shrink-0 rounded-md bg-gradient-to-b from-[#1b2838] to-[#171a21] border border-blue-500/30 text-sky-400 flex items-center justify-center shadow-sm ${className}`}
        title="Steam"
      >
        <Gamepad2 className={iconSizes} />
      </div>
    );
  }
  if (query.includes('vlc')) {
    return (
      <div
        className={`${sizeClasses} shrink-0 rounded-md bg-orange-500 text-white flex items-center justify-center shadow-sm ${className}`}
        title="VLC Media Player"
      >
        <Tv className={iconSizes} />
      </div>
    );
  }
  if (query.includes('obs')) {
    return (
      <div
        className={`${sizeClasses} shrink-0 rounded-md bg-zinc-900 border border-zinc-700 text-zinc-100 flex items-center justify-center shadow-sm ${className}`}
        title="OBS Studio"
      >
        <Film className={iconSizes} />
      </div>
    );
  }

  // 4. Developer Tools
  if (query.includes('code') || query.includes('cursor') || query.includes('vscodium')) {
    return (
      <div
        className={`${sizeClasses} shrink-0 rounded-md bg-blue-600 text-white flex items-center justify-center shadow-sm ${className}`}
        title="Visual Studio Code / Cursor"
      >
        <CodeRibbonIcon className={iconSizes} />
      </div>
    );
  }
  if (query.includes('git')) {
    return (
      <div
        className={`${sizeClasses} shrink-0 rounded-md bg-orange-600 text-white flex items-center justify-center shadow-sm ${className}`}
        title="Git Version Control"
      >
        <GitBranch className={iconSizes} />
      </div>
    );
  }
  if (query.includes('docker') || query.includes('podman') || query.includes('containerd')) {
    return (
      <div
        className={`${sizeClasses} shrink-0 rounded-md bg-cyan-600 text-white flex items-center justify-center shadow-sm ${className}`}
        title="Docker / Containers"
      >
        <Box className={iconSizes} />
      </div>
    );
  }
  if (
    query.includes('terminal') ||
    query.includes('bash') ||
    query.includes('zsh') ||
    query.includes('fish') ||
    query.includes('alacritty') ||
    query.includes('kitty') ||
    query.includes('ptyxis') ||
    query.includes('konsole')
  ) {
    return (
      <div
        className={`${sizeClasses} shrink-0 rounded-md bg-zinc-800 text-emerald-400 font-mono flex items-center justify-center border border-zinc-700 ${className}`}
        title="Linux Terminal"
      >
        <Terminal className={iconSizes} />
      </div>
    );
  }

  // 5. Torrent & File Sharing
  if (query.includes('transmission')) {
    return (
      <div
        className={`${sizeClasses} shrink-0 rounded-md bg-rose-700 text-white flex items-center justify-center shadow-sm ${className}`}
        title="Transmission BitTorrent"
      >
        <Share2 className={iconSizes} />
      </div>
    );
  }
  if (query.includes('qbittorrent') || query.includes('deluge')) {
    return (
      <div
        className={`${sizeClasses} shrink-0 rounded-md bg-blue-500 text-white flex items-center justify-center shadow-sm ${className}`}
        title="qBittorrent"
      >
        <Download className={iconSizes} />
      </div>
    );
  }

  // 6. Servers & Network Infrastructure
  if (query.includes('nginx')) {
    return (
      <div
        className={`${sizeClasses} shrink-0 rounded-md bg-emerald-600 text-white font-bold flex items-center justify-center shadow-sm ${className}`}
        title="Nginx Web Server"
      >
        <Server className={iconSizes} />
      </div>
    );
  }
  if (query.includes('apache') || query.includes('httpd')) {
    return (
      <div
        className={`${sizeClasses} shrink-0 rounded-md bg-red-600 text-white flex items-center justify-center shadow-sm ${className}`}
        title="Apache HTTP Server"
      >
        <Server className={iconSizes} />
      </div>
    );
  }
  if (query.includes('ssh') || query.includes('sshd')) {
    return (
      <div
        className={`${sizeClasses} shrink-0 rounded-md bg-amber-600 text-white flex items-center justify-center shadow-sm ${className}`}
        title="SSH Secure Shell"
      >
        <Lock className={iconSizes} />
      </div>
    );
  }
  if (query.includes('wireguard') || query.includes('wg') || query.includes('openvpn') || query.includes('tailscale')) {
    return (
      <div
        className={`${sizeClasses} shrink-0 rounded-md bg-rose-600 text-white flex items-center justify-center shadow-sm ${className}`}
        title="VPN / WireGuard"
      >
        <Shield className={iconSizes} />
      </div>
    );
  }
  if (query.includes('networkmanager') || query.includes('systemd') || query.includes('resolved')) {
    return (
      <div
        className={`${sizeClasses} shrink-0 rounded-md bg-slate-700 text-sky-300 flex items-center justify-center border border-slate-600 ${className}`}
        title="Linux System / Network Daemon"
      >
        <Wifi className={iconSizes} />
      </div>
    );
  }
  if (query.includes('curl') || query.includes('wget')) {
    return (
      <div
        className={`${sizeClasses} shrink-0 rounded-md bg-teal-600 text-white flex items-center justify-center shadow-sm ${className}`}
        title="HTTP Downloader"
      >
        <Download className={iconSizes} />
      </div>
    );
  }
  if (query.includes('postgres') || query.includes('mysql') || query.includes('redis') || query.includes('mongo')) {
    return (
      <div
        className={`${sizeClasses} shrink-0 rounded-md bg-indigo-600 text-white flex items-center justify-center shadow-sm ${className}`}
        title="Database Server"
      >
        <Database className={iconSizes} />
      </div>
    );
  }

  // 7. Generic Fallback: Clean Monogram Badge with Color Hash
  const firstLetter = (name.replace(/[^a-zA-Z0-9]/g, '')[0] || 'P').toUpperCase();
  const colorIndex =
    (name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 5);
  const colorSchemes = [
    'bg-orange-500/15 text-orange-400 border border-orange-500/30',
    'bg-sky-500/15 text-sky-400 border border-sky-500/30',
    'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  ];

  return (
    <div
      className={`${sizeClasses} shrink-0 rounded-md font-mono font-bold flex items-center justify-center ${colorSchemes[colorIndex]} ${className}`}
      title={name || 'Process'}
    >
      {firstLetter}
    </div>
  );
};

// Custom SVG Icons for authentic feel
const SendPlaneIcon: React.FC<{ className?: string }> = ({ className = 'w-3 h-3' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

const CodeRibbonIcon: React.FC<{ className?: string }> = ({ className = 'w-3 h-3' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.27a.999.999 0 0 0-.054 1.485l4.877 4.708-4.877 4.707a.999.999 0 0 0 .054 1.485l1.322 1.212a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.94-2.377A1.5 1.5 0 0 0 24 22.96V3.96a1.5 1.5 0 0 0-.85-1.373zM18 16.59l-5.66-4.59L18 7.41v9.18z" />
  </svg>
);
