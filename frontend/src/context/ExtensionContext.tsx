import React, { createContext, useContext, useEffect, useState } from 'react';
import { ExtensionItem, ThemeItem } from '../types/store';
import { STORE_EXTENSIONS, STORE_THEMES } from '../store/extensionsData';

interface ExtensionContextValue {
  themes: ThemeItem[];
  extensions: ExtensionItem[];
  installedExtensions: string[];
  enabledExtensions: string[];
  installedThemes: string[];
  activeCustomTheme: string | null;
  installExtension: (id: string) => void;
  uninstallExtension: (id: string) => void;
  toggleExtension: (id: string) => void;
  isExtensionEnabled: (id: string) => boolean;
  installTheme: (id: string) => void;
  uninstallTheme: (id: string) => void;
  applyTheme: (id: string | null) => void;
  quotaSettings: { limitGb: number; usedGb: number };
  updateQuotaSettings: (settings: { limitGb: number; usedGb: number }) => void;
}

const ExtensionContext = createContext<ExtensionContextValue | undefined>(undefined);

const STORAGE_INSTALLED_EXTS = 'ltm_installed_extensions';
const STORAGE_ENABLED_EXTS = 'ltm_enabled_extensions';
const STORAGE_INSTALLED_THEMES = 'ltm_installed_themes';
const STORAGE_ACTIVE_THEME = 'ltm_active_custom_theme';
const STORAGE_QUOTA = 'ltm_quota_settings';

export const ExtensionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // By default, install the top 3 extensions so the user immediately gets rich data (GeoIP, Adblock, Quota)
  const [installedExtensions, setInstalledExtensions] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_INSTALLED_EXTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return ['geoip-flag-tracker', 'dns-adblock-guard', 'data-quota-sentinel', 'speedtest-quickbench'];
  });

  const [enabledExtensions, setEnabledExtensions] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_ENABLED_EXTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return ['geoip-flag-tracker', 'dns-adblock-guard', 'data-quota-sentinel', 'speedtest-quickbench'];
  });

  const [installedThemes, setInstalledThemes] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_INSTALLED_THEMES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return ['cyberpunk', 'dracula', 'matrix', 'tokyo'];
  });

  const [activeCustomTheme, setActiveCustomTheme] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_ACTIVE_THEME) || null;
  });

  const [quotaSettings, setQuotaSettings] = useState<{ limitGb: number; usedGb: number }>(() => {
    const saved = localStorage.getItem(STORAGE_QUOTA);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return { limitGb: 50, usedGb: 34.6 };
  });

  // Apply or remove custom theme styles dynamically
  useEffect(() => {
    if (!activeCustomTheme) {
      // Clear dynamic style overrides
      const props = [
        '--bg-app',
        '--bg-surface',
        '--bg-surface-elevated',
        '--border-subtle',
        '--accent',
        '--accent-hover',
        '--accent-subtle',
        '--chart-rx',
        '--chart-tx',
        '--text-main',
        '--text-muted',
      ];
      props.forEach((prop) => document.documentElement.style.removeProperty(prop));
      localStorage.removeItem(STORAGE_ACTIVE_THEME);
      return;
    }

    const theme = STORE_THEMES.find((t) => t.id === activeCustomTheme);
    if (theme) {
      const root = document.documentElement;
      root.style.setProperty('--bg-app', theme.colors.bgApp);
      root.style.setProperty('--bg-surface', theme.colors.bgSurface);
      root.style.setProperty('--bg-surface-elevated', theme.colors.bgSurfaceElevated);
      root.style.setProperty('--border-subtle', theme.colors.border);
      root.style.setProperty('--accent', theme.colors.accent);
      root.style.setProperty('--accent-hover', theme.colors.accentHover);
      root.style.setProperty('--accent-subtle', `${theme.colors.accent}22`);
      root.style.setProperty('--chart-rx', theme.colors.chartRx);
      root.style.setProperty('--chart-tx', theme.colors.chartTx);
      root.style.setProperty('--text-main', theme.colors.textPrimary);
      root.style.setProperty('--text-muted', theme.colors.textSecondary);
      localStorage.setItem(STORAGE_ACTIVE_THEME, activeCustomTheme);
    }
  }, [activeCustomTheme]);

  // Persist installed & enabled extensions
  useEffect(() => {
    localStorage.setItem(STORAGE_INSTALLED_EXTS, JSON.stringify(installedExtensions));
  }, [installedExtensions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_ENABLED_EXTS, JSON.stringify(enabledExtensions));
  }, [enabledExtensions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_INSTALLED_THEMES, JSON.stringify(installedThemes));
  }, [installedThemes]);

  const installExtension = (id: string) => {
    if (!installedExtensions.includes(id)) {
      setInstalledExtensions((prev) => [...prev, id]);
      if (!enabledExtensions.includes(id)) {
        setEnabledExtensions((prev) => [...prev, id]);
      }
    }
  };

  const uninstallExtension = (id: string) => {
    setInstalledExtensions((prev) => prev.filter((item) => item !== id));
    setEnabledExtensions((prev) => prev.filter((item) => item !== id));
  };

  const toggleExtension = (id: string) => {
    if (enabledExtensions.includes(id)) {
      setEnabledExtensions((prev) => prev.filter((item) => item !== id));
    } else {
      if (!installedExtensions.includes(id)) {
        setInstalledExtensions((prev) => [...prev, id]);
      }
      setEnabledExtensions((prev) => [...prev, id]);
    }
  };

  const isExtensionEnabled = (id: string) => enabledExtensions.includes(id);

  const installTheme = (id: string) => {
    if (!installedThemes.includes(id)) {
      setInstalledThemes((prev) => [...prev, id]);
    }
  };

  const uninstallTheme = (id: string) => {
    setInstalledThemes((prev) => prev.filter((item) => item !== id));
    if (activeCustomTheme === id) {
      setActiveCustomTheme(null);
    }
  };

  const applyTheme = (id: string | null) => {
    if (id && !installedThemes.includes(id)) {
      installTheme(id);
    }
    setActiveCustomTheme(id);
  };

  const updateQuotaSettings = (settings: { limitGb: number; usedGb: number }) => {
    setQuotaSettings(settings);
    localStorage.setItem(STORAGE_QUOTA, JSON.stringify(settings));
  };

  return (
    <ExtensionContext.Provider
      value={{
        themes: STORE_THEMES,
        extensions: STORE_EXTENSIONS,
        installedExtensions,
        enabledExtensions,
        installedThemes,
        activeCustomTheme,
        installExtension,
        uninstallExtension,
        toggleExtension,
        isExtensionEnabled,
        installTheme,
        uninstallTheme,
        applyTheme,
        quotaSettings,
        updateQuotaSettings,
      }}
    >
      {children}
    </ExtensionContext.Provider>
  );
};

export const useExtensions = (): ExtensionContextValue => {
  const ctx = useContext(ExtensionContext);
  if (!ctx) {
    throw new Error('useExtensions must be used within an ExtensionProvider');
  }
  return ctx;
};
