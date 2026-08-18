import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES, LanguageCode } from '../context/LanguageContext';

interface Props {
  variant?: 'compact' | 'full' | 'dropdown';
  className?: string;
}

export const LanguageToggle: React.FC<Props> = ({ variant = 'compact', className = '' }) => {
  const { currentLanguage, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentOption = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        id="global-language-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change Application Language"
        title={`Language: ${currentOption.label}`}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white/80 dark:bg-[#161925]/90 hover:bg-slate-100 dark:hover:bg-[#1f2334] border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 shadow-sm hover:shadow transition-all cursor-pointer backdrop-blur-sm"
      >
        <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
        <span className="text-[11px] font-bold uppercase tracking-wider font-mono">
          {currentOption.flag} {currentOption.code.toUpperCase()}
        </span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          id="global-language-dropdown-menu"
          className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-[#0f111a] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-900/30 z-50 py-1.5 focus:outline-none overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800/80 mb-1 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {t('lang.select_language', 'Select Language')}
            </span>
            <span className="text-[9px] font-mono text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">
              GH / INT
            </span>
          </div>

          <div className="space-y-0.5 px-1">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === currentLanguage;
              return (
                <button
                  key={lang.code}
                  type="button"
                  id={`lang-option-${lang.code}`}
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl font-medium transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/25 text-blue-600 dark:text-blue-300 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm">{lang.flag}</span>
                    <div>
                      <span className="block text-xs">{lang.label}</span>
                      <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                        {lang.nativeName}
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
