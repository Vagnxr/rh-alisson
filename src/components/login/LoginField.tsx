import { useState, type ReactNode } from 'react';
import { IconAlert, IconCheck, IconEye, IconEyeOff } from './icons';

type LoginFieldProps = {
  id: string;
  label: string;
  type?: string;
  icon: ReactNode;
  value: string;
  onChange: (value: string) => void;
  valid?: boolean;
  invalid?: boolean;
  msg?: string;
  msgError?: string;
  autoComplete?: string;
  hint?: string;
  inputTestId?: string;
};

export function LoginField({
  id,
  label,
  type = 'text',
  icon,
  value,
  onChange,
  valid,
  invalid,
  msg,
  msgError,
  autoComplete,
  hint,
  inputTestId,
}: LoginFieldProps) {
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const realType = type === 'password' && showPass ? 'text' : type;
  const has = value.length > 0;
  const cls = [
    'field',
    focused ? 'is-focused' : '',
    has ? 'has-value' : '',
    invalid ? 'is-invalid' : valid ? 'is-valid' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cls}>
      <div className="input-shell">
        <span className="lead-icon">{icon}</span>
        <input
          id={id}
          type={realType}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder=" "
          data-testid={inputTestId}
        />
        <label htmlFor={id}>{label}</label>
        <div className="trail">
          {type === 'password' && has && (
            <button
              type="button"
              className="eye"
              onClick={() => setShowPass((s) => !s)}
              aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPass ? <IconEyeOff /> : <IconEye />}
            </button>
          )}
          <span className="status-icon">{invalid ? <IconAlert /> : <IconCheck />}</span>
        </div>
      </div>
      <div
        className={`field-msg ${(invalid && msgError) || (valid && msg) || (!invalid && !valid && hint) ? 'show' : ''} ${invalid ? 'err' : ''}`}
        data-testid={invalid ? 'login-mensagem-erro' : undefined}
      >
        {invalid ? msgError : valid ? msg : hint || '\u00A0'}
      </div>
    </div>
  );
}
