import React, {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
  forwardRef,
  useState
} from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  Eye,
  EyeOff,
  Search,
  X,
  Calendar,
  Hash,
  DollarSign
} from 'lucide-react';

/* =============================================================================
   DESIGN TOKENS & TYPOGRAPHY STANDARDS
   Spacing: py-2.5 px-3.5 (10px / 14px)
   Borders: rounded-xl (12px), border-slate-200 dark:border-slate-800
   Typography: text-xs font-bold uppercase tracking-wider for labels; text-sm for inputs
   Error States: border-rose-300 dark:border-rose-700/80, bg-rose-50/10, text-rose-600
   ============================================================================= */

export interface FormFieldProps {
  label?: string;
  error?: string | null;
  helperText?: string;
  required?: boolean;
  optional?: boolean;
  tooltip?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  helperText,
  required,
  optional,
  tooltip,
  children,
  className = '',
  id
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={id}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 select-none"
          >
            <span>{label}</span>
            {required && <span className="text-rose-500 font-bold ml-0.5">*</span>}
            {tooltip && (
              <span className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" title={tooltip}>
                <Info className="w-3 h-3 cursor-help" />
              </span>
            )}
          </label>
          {optional && (
            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Optional
            </span>
          )}
        </div>
      )}

      {children}

      {error ? (
        <p className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1.5 mt-1 animate-in fade-in duration-150">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
          <span>{helperText}</span>
        </p>
      ) : null}
    </div>
  );
};

/* =============================================================================
   INPUT COMPONENT
   ============================================================================= */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
  required?: boolean;
  optional?: boolean;
  tooltip?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  prefixText?: string;
  suffixText?: string;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  required,
  optional,
  tooltip,
  leftIcon,
  rightIcon,
  prefixText,
  suffixText,
  className = '',
  containerClassName = '',
  id,
  type = 'text',
  disabled,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : undefined);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <FormField
      label={label}
      error={error}
      helperText={helperText}
      required={required}
      optional={optional}
      tooltip={tooltip}
      id={inputId}
      className={containerClassName}
    >
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        )}

        {prefixText && (
          <span className="absolute left-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 pointer-events-none font-mono">
            {prefixText}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          type={effectiveType}
          disabled={disabled}
          className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed ${
            error
              ? 'border-rose-300 dark:border-rose-700/80 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/10'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          } ${leftIcon ? 'pl-10' : prefixText ? 'pl-12' : ''} ${
            rightIcon || isPassword ? 'pr-10' : suffixText ? 'pr-12' : ''
          } ${className}`}
          {...props}
        />

        {suffixText && (
          <span className="absolute right-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 pointer-events-none font-mono">
            {suffixText}
          </span>
        )}

        {isPassword ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg focus:outline-none cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        ) : (
          rightIcon && (
            <div className="absolute right-3.5 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center justify-center">
              {rightIcon}
            </div>
          )
        )}
      </div>
    </FormField>
  );
});

Input.displayName = 'Input';

/* =============================================================================
   SELECT COMPONENT
   ============================================================================= */

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
  required?: boolean;
  optional?: boolean;
  tooltip?: string;
  options?: SelectOption[];
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  helperText,
  required,
  optional,
  tooltip,
  options,
  className = '',
  containerClassName = '',
  children,
  id,
  disabled,
  ...props
}, ref) => {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : undefined);

  return (
    <FormField
      label={label}
      error={error}
      helperText={helperText}
      required={required}
      optional={optional}
      tooltip={tooltip}
      id={selectId}
      className={containerClassName}
    >
      <select
        ref={ref}
        id={selectId}
        disabled={disabled}
        className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed ${
          error
            ? 'border-rose-300 dark:border-rose-700/80 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/10'
            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
        } ${className}`}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
    </FormField>
  );
});

Select.displayName = 'Select';

/* =============================================================================
   TEXTAREA COMPONENT
   ============================================================================= */

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
  required?: boolean;
  optional?: boolean;
  tooltip?: string;
  maxLength?: number;
  showCount?: boolean;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  helperText,
  required,
  optional,
  tooltip,
  maxLength,
  showCount = false,
  className = '',
  containerClassName = '',
  id,
  disabled,
  rows = 3,
  value,
  defaultValue,
  onChange,
  ...props
}, ref) => {
  const textareaId = id || (label ? `textarea-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : undefined);
  const currentLength = typeof value === 'string' ? value.length : typeof defaultValue === 'string' ? defaultValue.length : 0;

  return (
    <FormField
      label={label}
      error={error}
      helperText={helperText}
      required={required}
      optional={optional}
      tooltip={tooltip}
      id={textareaId}
      className={containerClassName}
    >
      <div className="relative">
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          disabled={disabled}
          className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-sm font-normal text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed ${
            error
              ? 'border-rose-300 dark:border-rose-700/80 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/10'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          } ${className}`}
          {...props}
        />
        {showCount && maxLength && (
          <div className="text-[10px] text-right text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
            {currentLength} / {maxLength}
          </div>
        )}
      </div>
    </FormField>
  );
});

Textarea.displayName = 'Textarea';

/* =============================================================================
   SEARCH INPUT COMPONENT
   ============================================================================= */

export interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'rightIcon'> {
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(({
  placeholder = 'Search...',
  value,
  onChange,
  onClear,
  className = '',
  ...props
}, ref) => {
  const hasValue = !!value;

  return (
    <Input
      ref={ref}
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      leftIcon={<Search className="w-4 h-4 text-slate-400" />}
      rightIcon={
        hasValue && onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer pointer-events-auto"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null
      }
      className={className}
      {...props}
    />
  );
});

SearchInput.displayName = 'SearchInput';

/* =============================================================================
   SWITCH / TOGGLE COMPONENT
   ============================================================================= */

export interface SwitchProps {
  label?: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  className = ''
}) => {
  return (
    <label className={`flex items-start gap-3 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer ${
          checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>

      {(label || description) && (
        <div className="text-xs">
          {label && <span className="font-bold text-slate-800 dark:text-slate-200 block">{label}</span>}
          {description && <span className="text-slate-500 dark:text-slate-400 block mt-0.5">{description}</span>}
        </div>
      )}
    </label>
  );
};

/* =============================================================================
   CHECKBOX COMPONENT
   ============================================================================= */

export interface CheckboxProps {
  label?: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  error?: string | null;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  error,
  className = ''
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className={`flex items-start gap-2.5 cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-700 focus:ring-indigo-500 focus:ring-offset-0 transition-colors cursor-pointer"
        />
        {(label || description) && (
          <div className="text-xs">
            {label && <span className="font-semibold text-slate-800 dark:text-slate-200 block">{label}</span>}
            {description && <span className="text-slate-500 dark:text-slate-400 block mt-0.5">{description}</span>}
          </div>
        )}
      </label>
      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 ml-6">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
