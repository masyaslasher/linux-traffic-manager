import React, { useState } from 'react';
import {
  Check,
  Filter,
  Layers,
  Palette,
  Power,
  Puzzle,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useExtensions } from '../context/ExtensionContext';
import { useI18n } from '../i18n';

export const StorePage: React.FC = () => {
  const { t } = useI18n();
  const {
    themes,
    extensions,
    activeThemeId,
    toggleTheme,
    resetToDefaultTheme,
    enabledExtensions,
    toggleExtension,
  } = useExtensions();

  const [activeTab, setActiveTab] = useState<'all' | 'themes' | 'extensions'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredThemes = themes.filter((theme) => {
    if (activeTab === 'extensions') return false;
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
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-[11px] font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              LTM Hub
            </div>
            <h2 className="text-xl font-bold tracking-tight text-text-primary">
              {t.store}
            </h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Все 10 тем и 5 полезных модулей уже встроены в программу. Не нужно ничего скачивать — просто включайте и выключайте то, что вам нужно, в один клик.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <div className="p-3 rounded-xl bg-surface border border-border text-center">
              <div className="text-lg font-bold text-primary">10</div>
              <div className="text-[10px] text-text-dim uppercase">Темы</div>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-border text-center">
              <div className="text-lg font-bold text-cyan-400">5</div>
              <div className="text-[10px] text-text-dim uppercase">Модули</div>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-border text-center">
              <div className="text-lg font-bold text-emerald-400">1-Click</div>
              <div className="text-[10px] text-text-dim uppercase">Включение</div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Categories & Search */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 bg-surface border border-border p-1 rounded-xl text-xs font-medium">
          {[
            { id: 'all', label: 'Все темы и модули', icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'themes', label: 'Темы оформления (10)', icon: <Palette className="w-3.5 h-3.5" /> },
            { id: 'extensions', label: 'Расширения (5)', icon: <Puzzle className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
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
            placeholder="Быстрый поиск тем..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Tag Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-text-dim text-[11px] flex items-center gap-1 shrink-0">
          <Filter className="w-3 h-3" /> Фильтр:
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
      {(activeTab === 'all' || activeTab === 'themes') && filteredThemes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" />
              Темы оформления — включение в 1 клик ({filteredThemes.length})
            </h3>
            {activeThemeId !== 'orange-default' && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetToDefaultTheme}
                className="text-[11px] text-text-secondary hover:text-primary"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Сбросить на оранжевую тему
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredThemes.map((theme) => {
              const isActive = activeThemeId === theme.id;

              return (
                <div
                  key={theme.id}
                  onClick={() => toggleTheme(theme.id)}
                  className={`group rounded-xl border p-4 flex flex-col justify-between transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'border-primary ring-2 ring-primary/50 bg-surface shadow-xl'
                      : 'border-border bg-surface hover:border-primary/50 hover:shadow-md'
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
                        {isActive ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-primary text-white border border-primary shadow-sm flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Включена
                          </span>
                        ) : theme.badge ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-black/40 text-white border border-white/20">
                            {theme.badge}
                          </span>
                        ) : null}
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

                  {/* Toggle Button */}
                  <div className="pt-2 border-t border-border/50">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTheme(theme.id);
                      }}
                      className={`w-full py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                        isActive
                          ? 'bg-primary text-white border border-primary shadow-[0_0_12px_rgba(249,115,22,0.4)]'
                          : 'bg-surface-secondary text-text-primary border border-border hover:border-primary/50'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{isActive ? 'Включено (клик для выключения)' : 'Включить тему'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------- SECTION 2: EXTENSIONS ---------------- */}
      {(activeTab === 'all' || activeTab === 'extensions') && filteredExtensions.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Puzzle className="w-4 h-4 text-cyan-400" />
              Функциональные модули — переключатели ({filteredExtensions.length})
            </h3>
            <span className="text-xs text-text-dim font-mono">
              Включено: {Object.values(enabledExtensions).filter(Boolean).length} из {extensions.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredExtensions.map((ext) => {
              const isEnabled = !!enabledExtensions[ext.id];

              return (
                <div
                  key={ext.id}
                  className={`rounded-xl border p-5 flex flex-col justify-between bg-surface transition-all ${
                    isEnabled
                      ? 'border-emerald-500/40 shadow-sm'
                      : 'border-border opacity-75'
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
                            {ext.author}
                          </div>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${isEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-surface-secondary text-text-dim'}`}>
                        {isEnabled ? 'Активен' : 'Выключен'}
                      </span>
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed">
                      {ext.description}
                    </p>

                    {/* Features list */}
                    <div className="space-y-1.5 bg-surface-secondary/50 rounded-lg p-3 border border-border/60 text-xs">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-primary" />
                        Что делает этот модуль:
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
                    <span className="text-xs text-text-dim font-sans">
                      {isEnabled ? 'Модуль активен во всех вкладках' : 'Модуль отключен'}
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleExtension(ext.id)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-sm ${
                        isEnabled
                          ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                          : 'bg-surface-secondary border border-border text-text-muted hover:text-text-primary'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-zinc-600'}`} />
                      <span>{isEnabled ? 'Включено' : 'Выключено'}</span>
                    </button>
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
            100% Встроенный функционал без скачивания
          </span>
          <p className="text-text-muted leading-relaxed">
            Все 10 тем и расширения скомпилированы прямо внутри приложения. Никаких сетевых загрузок, ожидания скачивания или прав администратора — переключайте мгновенно.
          </p>
        </div>
      </div>
    </div>
  );
};
