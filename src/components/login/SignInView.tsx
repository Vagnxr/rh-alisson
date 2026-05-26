import { useEffect, useState } from 'react';
import { LoginField } from './LoginField';
import {
  GoogleIcon,
  IconAlert,
  IconArrowRight,
  IconCheck,
  IconLock,
  IconMail,
  IconShield,
} from './icons';

type SignInViewProps = {
  onForgot: () => void;
  onSignup: () => void;
  onLogin: (data: { email: string; password: string }) => Promise<boolean>;
  isLoading: boolean;
  apiError: string | null;
};

export function SignInView({ onForgot, onSignup, onLogin, isLoading, apiError }: SignInViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [shake, setShake] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 6;
  const emailInvalid = email.length > 0 && !emailValid;
  const passwordInvalid = password.length > 0 && !passwordValid;
  const canSubmit = emailValid && passwordValid && !isLoading;

  useEffect(() => {
    if (apiError) {
      setShake(true);
      const t = window.setTimeout(() => setShake(false), 500);
      return () => window.clearTimeout(t);
    }
  }, [apiError]);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid || !passwordValid) {
      setShake(true);
      window.setTimeout(() => setShake(false), 500);
      return;
    }
    const ok = await onLogin({ email, password });
    if (!ok) {
      setShake(true);
      window.setTimeout(() => setShake(false), 500);
    }
    void remember;
  };

  return (
    <div className={`view ${shake ? 'shake' : ''}`}>
      <div className="form-head rise rise-2">
        <h2>Bem-vindo de volta</h2>
        <p>Entre com suas credenciais para acessar o painel de gestão.</p>
      </div>

      <div className="social rise rise-3">
        <button type="button" className="btn-social" disabled title="Em breve">
          <GoogleIcon /> Continuar com Google
        </button>
      </div>

      <div className="or rise rise-3">ou continue com e-mail</div>

      <form className="login" onSubmit={handle} noValidate>
        <div className="rise rise-4">
          <LoginField
            id="email"
            label="E-mail"
            type="email"
            autoComplete="email"
            icon={<IconMail />}
            value={email}
            onChange={setEmail}
            valid={emailValid}
            invalid={emailInvalid}
            msg="E-mail válido"
            msgError="Digite um e-mail válido (ex.: voce@empresa.com)"
            inputTestId="login-email"
          />
        </div>
        <div className="rise rise-5">
          <LoginField
            id="password"
            label="Senha"
            type="password"
            autoComplete="current-password"
            icon={<IconLock />}
            value={password}
            onChange={setPassword}
            valid={passwordValid}
            invalid={passwordInvalid}
            msg="Senha aceita"
            msgError="Mínimo de 6 caracteres"
            inputTestId="login-password"
          />
        </div>

        <div className="row rise rise-5">
          <label className="check">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <span className="box">
              <IconCheck />
            </span>
            <span>Manter conectado</span>
          </label>
          <button type="button" className="link" onClick={onForgot}>
            Esqueceu a senha?
          </button>
        </div>

        <button
          type="submit"
          className={`submit rise rise-6 ${isLoading ? 'loading' : ''}`}
          disabled={!canSubmit}
          data-testid="login-submit"
        >
          <span className="label" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            Entrar no sistema <IconArrowRight className="arrow" />
          </span>
          {isLoading && <span className="spin" />}
        </button>

        {apiError && (
          <div className="submit-error rise" data-testid="login-mensagem-erro">
            <IconAlert /> {apiError}
          </div>
        )}
      </form>

      <p className="signup rise rise-7">
        Não tem uma conta?{' '}
        <button type="button" className="link" onClick={onSignup} data-testid="login-link-criar-conta">
          Solicite seu acesso
        </button>
      </p>

    </div>
  );
}
