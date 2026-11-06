import React, { createContext, useContext, useEffect, useState } from 'react';
import { ExtensionItem, ThemeItem } from '../types/store';
import { STORE_EXTENSIONS, STORE_THEMES } from '../store/extensionsData';

interface ExtensionContextValue {
  themes: ThemeItem[];
  extensions: ExtensionItem[];
  activeThemeId: string;
  applyTheme: (id: string) => void;
  toggleTheme: (id: string) => void;
  resetToDefaultTheme: () => void;
  enabledExtensions: Record<string, boolean>;
  toggleExtension: (id: string) => void;
  isExtensionEnabled: (id: string) => boolean;
  quotaSettings: { limitGb: number; usedGb: number };
  updateQuotaSettings: (settings: { limitGb: number; usedGb: number }) => void;
}

const ExtensionContext = createContext<ExtensionContextValue | undefined>(undefined);

const STORAGE_ACTIVE_THEME = 'ltm_active_theme_id';
const STORAGE_ENABLED_EXTENSIONS = 'ltm_enabled_extensions_map';
const STORAGE_QUOTA = 'ltm_quota_settings';

export const ExtensionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeThemeId, setActiveThemeId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_ACTIVE_THEME) || 'orange-default';
  });

  const [enabledExtensions, setEnabledExtensions] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(STORAGE_ENABLED_EXTENSIONS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    // Default enabled extensions
    return {
      'geoip-flag-tracker': true,
      'dns-adblock-guard': true,
      'data-quota-sentinel': true,
      'whois-investigator': true,
      'speedtest-quickbench': true,
    };
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

  // Apply theme to DOM
  const applyTheme = (themeId: string) => {
    const theme = STORE_THEMES.find((t) => t.id === themeId) || STORE_THEMES[0];
    const targetId = theme ? theme.id : 'orange-default';
    setActiveThemeId(targetId);
    localStorage.setItem(STORAGE_ACTIVE_THEME, targetId);

    // 1. Update body class
    document.body.className = `theme-${targetId}`;

    // 2. Inject or update override style tag for 100% specificity
    let styleTag = document.getElementById('ltm-theme-override') as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'ltm-theme-override';
      document.head.appendChild(styleTag);
    }

    if (theme) {
      styleTag.innerHTML = `
        :root, body, body.theme-${theme.id} {
          --bg-app: ${theme.colors.bgApp} !important;
          --bg-surface: ${theme.colors.bgSurface} !important;
          --bg-surface-elevated: ${theme.colors.bgSurfaceElevated} !important;
          --border-subtle: ${theme.colors.border} !important;
          --accent: ${theme.colors.accent} !important;
          --accent-hover: ${theme.colors.accentHover} !important;
          --accent-subtle: ${theme.colors.accent}24 !important;
          --chart-rx: ${theme.colors.chartRx} !important;
          --chart-tx: ${theme.colors.chartTx} !important;
          --text-main: ${theme.colors.textPrimary} !important;
          --text-muted: ${theme.colors.textSecondary} !important;
        }
        body {
          background-color: ${theme.colors.bgApp} !important;
          color: ${theme.colors.textPrimary} !important;
        }
      `;
    }
  };

  // Toggle theme: if already active -> return to default orange
  const toggleTheme = (themeId: string) => {
    if (activeThemeId === themeId) {
      applyTheme('orange-default');
    } else {
      applyTheme(themeId);
    }
  };

  const resetToDefaultTheme = () => {
    applyTheme('orange-default');
  };

  // Initial theme application on mount
  useEffect(() => {
    applyTheme(activeThemeId);
  }, []);

  const toggleExtension = (id: string) => {
    setEnabledExtensions((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      localStorage.setItem(STORAGE_ENABLED_EXTENSIONS, JSON.stringify(updated));
      return updated;
    });
  };

  const isExtensionEnabled = (id: string) => !!enabledExtensions[id];

  const updateQuotaSettings = (settings: { limitGb: number; usedGb: number }) => {
    setQuotaSettings(settings);
    localStorage.setItem(STORAGE_QUOTA, JSON.stringify(settings));
  };

  return (
    <ExtensionContext.Provider
      value={{
        themes: STORE_THEMES,
        extensions: STORE_EXTENSIONS,
        activeThemeId,
        applyTheme,
        toggleTheme,
        resetToDefaultTheme,
        enabledExtensions,
        toggleExtension,
        isExtensionEnabled,
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
