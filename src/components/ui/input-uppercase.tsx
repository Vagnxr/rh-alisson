import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { useUppercase } from '@/hooks/useUppercase';

export interface InputUppercaseProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  hint?: string;
  isEmail?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface TextareaUppercaseProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label?: string;
  error?: string;
  hint?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

/**
 * Input de texto que converte automaticamente para maiúsculas
 * Exceto quando isEmail=true
 */
export const InputUppercase = forwardRef<HTMLInputElement, InputUppercaseProps>(
  ({ label, error, hint, isEmail = false, onChange, className, required, ...props }, ref) => {
    const { toUppercase, handleChange } = useUppercase();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const normalizedEvent = handleChange(e, isEmail) as React.ChangeEvent<HTMLInputElement>;
      onChange?.(normalizedEvent);
    };

    // Garante que o valor exibido está em maiúsculas
    const displayValue = props.value ? toUppercase(String(props.value), isEmail) : '';

    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-foreground">
            {label}
            {required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
        )}

        <input
          ref={ref}
          type={isEmail ? 'email' : 'text'}
          {...props}
          value={displayValue}
          onChange={handleInputChange}
          className={cn(
            // Tokens do tema, nunca cores fixas: com bg-white/text-slate-900 o
            // campo ficava branco no dark mode (o cliente reportou os campos
            // brancos no cadastro de fornecedor na "tela preta").
            'w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground transition-colors',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-1',
            error
              ? 'border-destructive focus:border-destructive focus:ring-destructive'
              : 'border-input focus:border-emerald-500 focus:ring-emerald-500',
            className
          )}
        />

        {(error || hint) && (
          <p className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

InputUppercase.displayName = 'InputUppercase';

/**
 * Textarea que converte automaticamente para maiúsculas
 */
export const TextareaUppercase = forwardRef<HTMLTextAreaElement, TextareaUppercaseProps>(
  ({ label, error, hint, onChange, className, required, ...props }, ref) => {
    const { toUppercase, handleChange } = useUppercase();

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const normalizedEvent = handleChange(e, false) as React.ChangeEvent<HTMLTextAreaElement>;
      onChange?.(normalizedEvent);
    };

    // Garante que o valor exibido está em maiúsculas
    const displayValue = props.value ? toUppercase(String(props.value), false) : '';

    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-foreground">
            {label}
            {required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          {...props}
          value={displayValue}
          onChange={handleTextareaChange}
          className={cn(
            'w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground transition-colors',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-1',
            'min-h-[80px] resize-y',
            error
              ? 'border-destructive focus:border-destructive focus:ring-destructive'
              : 'border-input focus:border-emerald-500 focus:ring-emerald-500',
            className
          )}
        />

        {(error || hint) && (
          <p className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

TextareaUppercase.displayName = 'TextareaUppercase';
