import { forwardRef, useState, useMemo, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { checkPasswordStrength } from '@/lib/masks';

export interface InputPasswordProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  value?: string;
  onValueChange?: (value: string) => void;
  showStrength?: boolean;
  showRequirements?: boolean;
  label?: string;
  error?: string;
  hint?: string;
}

const InputPassword = forwardRef<HTMLInputElement, InputPasswordProps>(
  (
    {
      value = '',
      onValueChange,
      showStrength = false,
      showRequirements = false,
      label,
      error,
      hint,
      className,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const strength = useMemo(() => checkPasswordStrength(value), [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange?.(e.target.value);
    };

    const requirements = [
      { key: 'minLength', label: 'Minimo 8 caracteres', met: strength.requirements.minLength },
      { key: 'hasUppercase', label: 'Letra maiuscula', met: strength.requirements.hasUppercase },
      { key: 'hasLowercase', label: 'Letra minuscula', met: strength.requirements.hasLowercase },
      { key: 'hasNumber', label: 'Numero', met: strength.requirements.hasNumber },
      { key: 'hasSpecial', label: 'Caractere especial (!@#$%)', met: strength.requirements.hasSpecial },
    ];

    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-slate-700">
            {label}
            {props.required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              'w-full rounded-lg border bg-white px-3 py-2 pr-10 text-sm text-slate-900 transition-colors',
              'placeholder:text-slate-400',
              'focus:outline-none focus:ring-1',
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500',
              className
            )}
            {...props}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Barra de forca */}
        {showStrength && value && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1.5 flex-1 rounded-full transition-colors',
                    i < strength.score ? strength.color : 'bg-slate-200'
                  )}
                />
              ))}
            </div>
            <p className={cn('text-xs font-medium', strength.color.replace('bg-', 'text-'))}>
              {strength.label}
            </p>
          </div>
        )}

        {/* Requisitos */}
        {showRequirements && (isFocused || value) && (
          <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-600">Requisitos da senha:</p>
            <ul className="grid gap-1 sm:grid-cols-2">
              {requirements.map((req) => (
                <li
                  key={req.key}
                  className={cn(
                    'flex items-center gap-1.5 text-xs transition-colors',
                    req.met ? 'text-emerald-600' : 'text-slate-400'
                  )}
                >
                  {req.met ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                  {req.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Mensagem de erro ou hint */}
        {(error || hint) && !showRequirements && (
          <p className={cn('text-xs', error ? 'text-red-500' : 'text-slate-500')}>
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

InputPassword.displayName = 'InputPassword';

export { InputPassword };
