import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'button' | 'compact' | 'pill';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabel = false,
  variant = 'pill'
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        title={`Current: ${isDark ? 'Dark Mode' : 'Light Mode'} (Click to toggle)`}
        className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-center ${
          isDark
            ? 'bg-slate-900/90 border-slate-700/80 text-amber-400 hover:bg-slate-800 hover:text-amber-300 shadow-sm'
            : 'bg-white/95 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-sm'
        } ${className}`}
      >
        {isDark ? (
          <Sun className="w-4 h-4 transition-transform duration-300 rotate-0 hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 transition-transform duration-300 -rotate-12 hover:rotate-0 text-slate-800" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-200 cursor-pointer select-none shadow-sm ${
        isDark
          ? 'bg-slate-900/90 border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600'
          : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100 hover:border-slate-400'
      } ${className}`}
    >
      <div className="relative flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-amber-400">
        {isDark ? (
          <Sun className="w-3.5 h-3.5 text-amber-400 transition-transform duration-300 rotate-0" />
        ) : (
          <Moon className="w-3.5 h-3.5 text-slate-700 transition-transform duration-300" />
        )}
      </div>
      {showLabel && (
        <span className="font-medium tracking-tight">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      )}
    </button>
  );
};
