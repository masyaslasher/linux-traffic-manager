import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Download,
  Filter,
  Layers,
  Palette,
  Puzzle,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  Star,
  Trash2,
  Zap,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useExtensions } from '../context/ExtensionContext';
import { useI18n } from '../i18n';
import { StoreCategory } from '../types/store';

export const StorePage: React.FC = () => {
  const { t } = useI18n();
  const {
    themes,
    extensions,
    installedExtensions,
    enabledExtensions,
    installedThemes,
    activeCustomTheme,
    installExtension,
    uninstallExtension,
    toggleExtension,
    installTheme,
    uninstallTheme,
    applyTheme,
  } = useExtensions();

  const [activeTab, setActiveTab] = useState<StoreCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredThemes = themes.filter((theme) => {
    if (activeTab === 'extensions') return false;
    if (activeTab === 'installed' && !installedThemes.includes(theme.id)) return false;
    if (selectedTag && !theme.tags.includes(selectedTag)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        theme.name.toLowerCase().includes(q) ||
        theme.description.toLowerCase().includes(q) ||
        theme.author.toLowerCase().includes(q) ||
        theme.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const filteredExtensions = extensions.filter((ext) => {
    if (activeTab === 'themes') return false;
    if (activeTab === 'installed' && !installedExtensions.includes(ext.id)) return false;
    if (selectedTag && !ext.tags.includes(selectedTag)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        ext.name.toLowerCase().includes(q) ||
        ext.description.toLowerCase().includes(q) ||
        ext.author.toLowerCase().includes(q) ||
        ext.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Collect all unique tags for quick filter pills
  const allTags = Array.from(
    new Set([
      ...themes.flatMap((t) => t.tags),
      ...extensions.flatMap((e) => e.tags),
    ])
  ).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600/20 via-surface-secondary to-cyan-600/15 border border-border p-6 shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[11px] font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              LTM Ecosystem Hub
            </div>
            <h2 className="text-xl font-bold tracking-tight text-text-primary">
              {t.store} & Custom Themes
            </h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Персонализируйте сетевой менеджер: 10 авторских тем с уникальными цветовыми схемами и 5 полезных модулей для анализа трафика, приватности и контроля бюджета.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <div className="p-3 rounded-xl bg-surface border border-border text-center">
              <div className="text-lg font-bold text-orange-400">10</div>
              <div className="text-[10px] text-text-dim uppercase">Темы</div>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-border text-center">
              <div className="text-lg font-bold text-cyan-400">5</div>
              <div className="text-[10px] text-text-dim uppercase">Плагины</div>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-border text-center">
              <div className="text-lg font-bold text-emerald-400">100%</div>
              <div className="text-[10px] text-text-dim uppercase">Offline</div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Categories & Search */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 bg-surface border border-border p-1 rounded-xl text-xs font-medium">
          {[
            { id: 'all', label: 'Все', icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'themes', label: 'Темы оформления (10)', icon: <Palette className="w-3.5 h-3.5" /> },
            { id: 'extensions', label: 'Расширения (5)', icon: <Puzzle className="w-3.5 h-3.5" /> },
            { id: 'installed', label: 'Установленные', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as StoreCategory);
                setSelectedTag(null);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-white font-semibold shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="w-full md:w-72">
          <Input
            placeholder="Поиск тем и расширений..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Tag Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-text-dim text-[11px] flex items-center gap-1 shrink-0">
          <Filter className="w-3 h-3" /> Теги:
        </span>
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all shrink-0 ${
              selectedTag === tag
                ? 'bg-primary/20 border-primary text-primary font-bold shadow-sm'
                : 'bg-surface border-border text-text-muted hover:text-text-primary hover:border-border/80'
            }`}
          >
            #{tag}
          </button>
        ))}
        {selectedTag && (
          <button
            onClick={() => setSelectedTag(null)}
            className="text-[11px] text-text-dim hover:text-primary underline ml-1 shrink-0"
          >
            Сбросить
          </button>
        )}
      </div>

      {/* ---------------- SECTION 1: THEMES ---------------- */}
      {(activeTab === 'all' || activeTab === 'themes' || activeTab === 'installed') && filteredThemes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Palette className="w-4 h-4 text-orange-400" />
              Темы оформления ({filteredThemes.length})
            </h3>
            {activeCustomTheme && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyTheme(null)}
                className="text-[11px] text-text-secondary hover:text-primary"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Сбросить на фирменную оранжевую
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredThemes.map((theme) => {
              const isInstalled = installedThemes.includes(theme.id);
              const isActive = activeCustomTheme === theme.id;

              return (
                <div
                  key={theme.id}
                  className={`group rounded-xl border p-4 flex flex-col justify-between transition-all duration-150 ${
                    isActive
                      ? 'border-primary ring-2 ring-primary/40 bg-surface shadow-lg'
                      : 'border-border bg-surface hover:border-primary/40 hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* Visual Palette Header Banner */}
                    <div
                      className="h-20 rounded-lg p-2.5 mb-3 flex flex-col justify-between border border-white/10 shadow-inner relative overflow-hidden"
                      style={{ backgroundColor: theme.colors.bgApp }}
                    >
                      {/* Gradient Accent Flare */}
                      <div
                        className={`absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-gradient-to-tr ${theme.previewGradient} opacity-30 blur-xl pointer-events-none`}
                      />

                      <div className="flex items-center justify-between z-10">
                        <span
                          className="text-xs font-bold font-mono tracking-tight"
                          style={{ color: theme.colors.textPrimary }}
                        >
                          {theme.name}
                        </span>
                        {theme.badge && (
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-black/40 text-white border border-white/20"
                          >
                            {theme.badge}
                          </span>
                        )}
                      </div>

                      {/* Swatch color circles */}
                      <div className="flex items-center gap-2 z-10">
                        <span
                          className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: theme.colors.bgSurface }}
                          title="Surface"
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: theme.colors.accent }}
                          title="Accent"
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: theme.colors.chartRx }}
                          title="Rx Download"
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: theme.colors.chartTx }}
                          title="Tx Upload"
                        />
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-text-dim mb-1 font-mono">
                      <span>{theme.author} • v{theme.version}</span>
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{theme.rating}</span>
                        <span className="text-text-dim">({theme.downloads})</span>
                      </div>
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed mb-3">
                      {theme.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {theme.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-secondary text-text-dim border border-border"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    {isActive ? (
                      <div className="w-full py-1.5 rounded-lg bg-primary/15 border border-primary/30 text-primary font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm">
                        <Check className="w-3.5 h-3.5 text-primary" />
                        Текущая тема
                      </div>
                    ) : isInstalled ? (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1"
                          onClick={() => applyTheme(theme.id)}
                        >
                          Применить
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Удалить тему"
                          onClick={() => uninstallTheme(theme.id)}
                          className="text-text-dim hover:text-error"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          installTheme(theme.id);
                          applyTheme(theme.id);
                        }}
                      >
                        <Download className="w-3.5 h-3.5 mr-1" />
                        Установить и включить
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------- SECTION 2: EXTENSIONS ---------------- */}
      {(activeTab === 'all' || activeTab === 'extensions' || activeTab === 'installed') && filteredExtensions.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Puzzle className="w-4 h-4 text-cyan-400" />
              Расширения и модули ({filteredExtensions.length})
            </h3>
            <span className="text-xs text-text-dim font-mono">
              Активно: {enabledExtensions.length} из {extensions.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredExtensions.map((ext) => {
              const isInstalled = installedExtensions.includes(ext.id);
              const isEnabled = enabledExtensions.includes(ext.id);

              return (
                <div
                  key={ext.id}
                  className={`rounded-xl border p-5 flex flex-col justify-between bg-surface transition-all ${
                    isEnabled
                      ? 'border-cyan-500/40 shadow-sm'
                      : 'border-border opacity-90'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-surface-secondary border border-border flex items-center justify-center text-xl shadow-sm shrink-0">
                          {ext.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-text-primary leading-tight">
                              {ext.name}
                            </h4>
                            {ext.badge && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                                {ext.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-text-dim font-mono">
                            {ext.author} • v{ext.version}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-mono text-amber-400 shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{ext.rating}</span>
                      </div>
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed">
                      {ext.description}
                    </p>

                    {/* Features list */}
                    <div className="space-y-1.5 bg-surface-secondary/50 rounded-lg p-3 border border-border/60 text-xs">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-primary" />
                        Возможности расширения:
                      </div>
                      <ul className="space-y-1 text-text-secondary">
                        {ext.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-[11px] leading-tight">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Actions & Toggle */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted font-mono">{ext.downloads} загрузок</span>
                      {isInstalled && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Установлено
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isInstalled ? (
                        <>
                          <button
                            onClick={() => toggleExtension(ext.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                              isEnabled
                                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                                : 'bg-surface-secondary border border-border text-text-muted hover:text-text-primary'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-zinc-600'}`} />
                            {isEnabled ? 'Включено' : 'Выключено'}
                          </button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => uninstallExtension(ext.id)}
                            title="Удалить расширение"
                            className="text-text-dim hover:text-error"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => installExtension(ext.id)}
                        >
                          <Download className="w-3.5 h-3.5 mr-1" />
                          Установить
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Security & Sandbox Notice */}
      <div className="p-4 bg-surface-secondary/40 border border-border rounded-xl flex items-start gap-3 text-xs">
        <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-text-primary">
            Безопасность и автономность LTM Store
          </span>
          <p className="text-text-muted leading-relaxed">
            Все расширения и темы работают полностью локально на вашем компьютере внутри песочницы Linux Traffic Manager. Нет внешних облачных зависимостей, сбора аналитики или скрытых сетевых запросов.
          </p>
        </div>
      </div>
    </div>
  );
};
