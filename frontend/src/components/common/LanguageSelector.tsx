import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useI18n } from '../../i18n';
import { LanguageCode } from '../../i18n';

interface LanguageSelectorProps {
  compact?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ compact = false }) => {
  const { lang, setLang, languages, currentLanguageMeta } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code: LanguageCode) => {
    setLang(code);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Переключение языка (без перезагрузки)"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-secondary border border-border text-xs text-text-primary hover:border-primary/50 transition-colors shadow-sm focus:outline-none"
      >
        <span className="text-sm leading-none" role="img" aria-label={currentLanguageMeta.label}>
          {currentLanguageMeta.flag}
        </span>
        {!compact && (
          <span className="font-medium text-[11px] max-w-[110px] truncate text-text-primary">
            {currentLanguageMeta.nativeName}
          </span>
        )}
        <ChevronDown className={`w-3 h-3 text-text-muted transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-surface border border-border/80 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md">
          <div className="px-3 py-1.5 border-b border-border/60 text-[10px] uppercase tracking-wider font-semibold text-text-muted flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-primary" />
              Язык интерфейса
            </span>
            <span className="text-primary font-mono text-[9px] lowercase">{languages.length} языков</span>
          </div>

          <div className="max-h-80 overflow-y-auto py-1 divide-y divide-border/20">
            {languages.map((item) => {
              const isSelected = item.code === lang;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleSelect(item.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-text-primary hover:bg-surface-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-base leading-none shrink-0" role="img" aria-label={item.label}>
                      {item.flag}
                    </span>
                    <div className="truncate">
                      <div className="truncate text-[12px] font-medium leading-tight">
                        {item.nativeName}
                      </div>
                      <div className="text-[10px] text-text-muted truncate leading-tight">
                        {item.label}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-primary shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
