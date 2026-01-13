import { forwardRef, useState, useCallback, type InputHTMLAttributes } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  applyMask,
  onlyNumbers,
  isValidCPF,
  isValidCNPJ,
  isValidCelular,
  isValidCEP,
  type MaskType,
} from '@/lib/masks';

export interface InputMaskedProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  mask: MaskType;
  value?: string;
  onValueChange?: (value: string, rawValue: string) => void;
  showValidation?: boolean;
  label?: string;
  error?: string;
  hint?: string;
}

const InputMasked = forwardRef<HTMLInputElement, InputMaskedProps>(
  ({ mask, value = '', onValueChange, showValidation = false, label, error, hint, className, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isTouched, setIsTouched] = useState(false);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = onlyNumbers(e.target.value);
        const maskedValue = applyMask(rawValue, mask);
        onValueChange?.(maskedValue, rawValue);
      },
      [mask, onValueChange]
    );

    const getValidation = useCallback(() => {
      if (!showValidation || !isTouched || !value) return null;

      const rawValue = onlyNumbers(value);
      let isValid = false;
      let minLength = 0;

      switch (mask) {
        case 'cpf':
          isValid = isValidCPF(rawValue);
          minLength = 11;
          break;
        case 'cnpj':
          isValid = isValidCNPJ(rawValue);
          minLength = 14;
          break;
        case 'celular':
          isValid = isValidCelular(rawValue);
          minLength = 11;
          break;
        case 'cep':
          isValid = isValidCEP(rawValue);
          minLength = 8;
          break;
        default:
          return null;
      }

      // Ainda digitando
      if (rawValue.length < minLength && rawValue.length > 0) {
        return { status: 'typing' as const, message: 'Digitando...' };
      }

      return isValid
        ? { status: 'valid' as const, message: 'Valido' }
        : { status: 'invalid' as const, message: 'Invalido' };
    }, [mask, value, showValidation, isTouched]);

    const validation = getValidation();

    const getPlaceholder = () => {
      switch (mask) {
        case 'cpf':
          return '000.000.000-00';
        case 'cnpj':
          return '00.000.000/0000-00';
        case 'celular':
          return '(00) 00000-0000';
        case 'telefone':
          return '(00) 0000-0000';
        case 'cep':
          return '00000-000';
        case 'currency':
          return 'R$ 0,00';
        case 'date':
          return 'DD/MM/AAAA';
        default:
          return '';
      }
    };

    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-slate-700">
            {label}
            {props.required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            type="text"
            inputMode="numeric"
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              setIsTouched(true);
            }}
            placeholder={props.placeholder || getPlaceholder()}
            className={cn(
              'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 transition-colors',
              'placeholder:text-slate-400',
              'focus:outline-none focus:ring-1',
              error
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : validation?.status === 'invalid'
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : validation?.status === 'valid'
                    ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500'
                    : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500',
              showValidation && 'pr-10',
              className
            )}
            {...props}
          />

          {/* Icone de validacao */}
          {showValidation && validation && value && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {validation.status === 'valid' && (
                <Check className="h-4 w-4 text-emerald-500" />
              )}
              {validation.status === 'invalid' && (
                <X className="h-4 w-4 text-red-500" />
              )}
              {validation.status === 'typing' && (
                <div className="h-4 w-4 animate-pulse rounded-full bg-slate-300" />
              )}
            </div>
          )}
        </div>

        {/* Mensagem de erro ou hint */}
        {(error || hint) && (
          <p className={cn('text-xs', error ? 'text-red-500' : 'text-slate-500')}>
            {error || hint}
          </p>
        )}
      </div>
    );
  }
);

InputMasked.displayName = 'InputMasked';

// Componentes especializados para facilitar o uso

export interface SpecializedInputProps extends Omit<InputMaskedProps, 'mask'> {}

export const InputCPF = forwardRef<HTMLInputElement, SpecializedInputProps>((props, ref) => (
  <InputMasked ref={ref} mask="cpf" showValidation {...props} />
));
InputCPF.displayName = 'InputCPF';

export const InputCNPJ = forwardRef<HTMLInputElement, SpecializedInputProps>((props, ref) => (
  <InputMasked ref={ref} mask="cnpj" showValidation {...props} />
));
InputCNPJ.displayName = 'InputCNPJ';

export const InputCelular = forwardRef<HTMLInputElement, SpecializedInputProps>((props, ref) => (
  <InputMasked ref={ref} mask="celular" showValidation {...props} />
));
InputCelular.displayName = 'InputCelular';

export const InputTelefone = forwardRef<HTMLInputElement, SpecializedInputProps>((props, ref) => (
  <InputMasked ref={ref} mask="telefone" {...props} />
));
InputTelefone.displayName = 'InputTelefone';

export const InputCEP = forwardRef<HTMLInputElement, SpecializedInputProps>((props, ref) => (
  <InputMasked ref={ref} mask="cep" showValidation {...props} />
));
InputCEP.displayName = 'InputCEP';

export const InputCurrency = forwardRef<HTMLInputElement, SpecializedInputProps>((props, ref) => (
  <InputMasked ref={ref} mask="currency" {...props} />
));
InputCurrency.displayName = 'InputCurrency';

export const InputDate = forwardRef<HTMLInputElement, SpecializedInputProps>((props, ref) => (
  <InputMasked ref={ref} mask="date" {...props} />
));
InputDate.displayName = 'InputDate';

export { InputMasked };
