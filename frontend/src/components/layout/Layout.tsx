import React from 'react';
import { NavigationTab, NetworkInterface, SpeedMetrics } from '../../types';
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
}) => {
  return (
    <div className="flex h-screen w-screen bg-background text-text-primary overflow-hidden">
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        activeInterface={activeInterface}
        isConnected={activeInterface?.is_up ?? false}
      />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header
          title={title}
          description={description}
          speedMetrics={speedMetrics}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};
