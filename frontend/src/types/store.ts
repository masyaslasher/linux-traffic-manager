export type StoreCategory = 'all' | 'extensions' | 'themes' | 'installed';

export interface ThemeColors {
  bgApp: string;
  bgSurface: string;
  bgSurfaceElevated: string;
  border: string;
  accent: string;
  accentHover: string;
  chartRx: string;
  chartTx: string;
  textPrimary: string;
  textSecondary: string;
}

export interface ThemeItem {
  id: string;
  name: string;
  author: string;
  version: string;
  rating: number;
  downloads: string;
  description: string;
  tags: string[];
  colors: ThemeColors;
  previewGradient: string;
  badge?: string;
}

export interface ExtensionItem {
  id: string;
  name: string;
  author: string;
  version: string;
  rating: number;
  downloads: string;
  description: string;
  icon: string;
  category: 'security' | 'privacy' | 'analytics' | 'networking' | 'tools';
  tags: string[];
  features: string[];
  badge?: string;
  isBuiltIn?: boolean;
}
