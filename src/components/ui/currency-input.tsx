import { NumericFormat } from 'react-number-format';

interface CurrencyInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  testId?: string;
}

function isZeroLikeCurrencyValue(value: string): boolean {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return false;
  return /^0+$/.test(digits);
}

export function CurrencyInput({
  id,
  value,
  onChange,
  className,
  placeholder = '0,00',
  required,
  disabled,
  testId,
}: CurrencyInputProps) {
  const normalizedValue = isZeroLikeCurrencyValue(value) ? '' : value;

  return (
    <NumericFormat
      id={id}
      inputMode="numeric"
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={2}
      fixedDecimalScale
      allowNegative={false}
      valueIsNumericString={false}
      placeholder={placeholder}
      value={normalizedValue}
      onValueChange={({ formattedValue }) => {
        onChange(formattedValue);
      }}
      className={className}
      required={required}
      disabled={disabled}
      data-testid={testId}
    />
  );
}
