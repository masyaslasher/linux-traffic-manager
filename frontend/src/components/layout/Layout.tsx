import React from 'react';
import { NavigationTab, NetworkInterface, SpeedMetrics, SpeedUnit } from '../../types';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  activeInterface: NetworkInterface | null;
  speedMetrics: SpeedMetrics | null;
  title: string;
  description: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  speedUnit?: SpeedUnit;
  onToggleSpeedUnit?: () => void;
  onOpenCommandPalette?: () => void;
  activeProfileName?: string;
  alertCount?: number;
  onOpenAlerts?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentTab,
  onSelectTab,
  activeInterface,
  speedMetrics,
  title,
  description,
  onRefresh,
  isRefreshing,
  speedUnit = 'bytes',
  onToggleSpeedUnit,
  onOpenCommandPalette,
  activeProfileName = 'Balanced',
  alertCount = 0,
  onOpenAlerts,
}) => {
  return (
    <div className="flex h-screen w-screen bg-background text-text-primary overflow-hidden">
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        activeInterface={activeInterface}
        isConnected={activeInterface?.is_up ?? false}
        onOpenCommandPalette={onOpenCommandPalette}
      />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header
          title={title}
          description={description}
          speedMetrics={speedMetrics}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          speedUnit={speedUnit}
          onToggleSpeedUnit={onToggleSpeedUnit}
          onOpenCommandPalette={onOpenCommandPalette}
          activeProfileName={activeProfileName}
          alertCount={alertCount}
          onOpenAlerts={onOpenAlerts}
        />
        <main className="flex-1 overflow-y-auto p-5">{children}</main>
      </div>
    </div>
  );
};
