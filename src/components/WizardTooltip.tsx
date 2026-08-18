import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Info, Sparkles, X, CheckCircle2 } from 'lucide-react';

interface Props {
  title: string;
  description: string;
  example?: string;
  tip?: string;
  badge?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const WizardTooltip: React.FC<Props> = ({
  title,
  description,
  example,
  tip,
  badge = 'Setup Context',
  position = 'top'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-flex items-center ml-1.5" ref={tooltipRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        className={`p-0.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
          isOpen
            ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300'
            : 'text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
        }`}
        aria-label={`Context help for ${title}`}
        title={`Click for helper info on ${title}`}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 w-72 sm:w-80 p-4 bg-slate-900 text-slate-100 border border-slate-700/80 rounded-2xl shadow-2xl space-y-2.5 text-xs animate-in fade-in zoom-in-95 duration-150 ${
            position === 'top'
              ? 'bottom-full mb-2 left-1/2 -translate-x-1/2'
              : position === 'bottom'
              ? 'top-full mt-2 left-1/2 -translate-x-1/2'
              : position === 'left'
              ? 'right-full mr-2 top-1/2 -translate-y-1/2'
              : 'left-full ml-2 top-1/2 -translate-y-1/2'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-extrabold text-[10px] uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                {badge}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-0.5 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <h5 className="font-bold text-white text-xs leading-snug">{title}</h5>
          <p className="text-slate-300 text-[11px] leading-relaxed">{description}</p>

          {example && (
            <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-800 font-mono text-[10px] text-emerald-400">
              <span className="text-slate-500 font-sans block text-[9px] uppercase font-bold mb-0.5">Format Example:</span>
              {example}
            </div>
          )}

          {tip && (
            <div className="flex items-start gap-1.5 text-[10px] text-amber-300 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
              <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>{tip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
