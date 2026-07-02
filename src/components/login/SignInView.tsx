import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { GoogleIcon, IconEye, IconEyeOff, IconLock, IconMail } from './icons';

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
  const [showPwd, setShowPwd] = useState(false);
  const [shake, setShake] = useState(false);
  const [done, setDone] = useState(false);
  const [emailErr, setEmailErr] = useState(false);
  const [pwdErr, setPwdErr] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 6;

  useEffect(() => {
    if (apiError) {
      setShake(true);
      const t = window.setTimeout(() => setShake(false), 500);
      return () => window.clearTimeout(t);
    }
  }, [apiError]);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    let ok = true;
    if (!emailValid) {
      setEmailErr(true);
      ok = false;
    }
    if (!passwordValid) {
      setPwdErr(true);
      ok = false;
    }
    if (!ok) {
      setShake(true);
      window.setTimeout(() => setShake(false), 350);
      return;
    }
    const success = await onLogin({ email, password });
    if (success) {
      setDone(true);
    } else {
      setShake(true);
      window.setTimeout(() => setShake(false), 350);
    }
    void remember;
  };

  const ctaClass = `cta${isLoading ? ' loading' : ''}${done ? ' done' : ''}`;

  return (
    <div className={shake ? 'shake' : ''}>
      <div className="form-head">
        <h2 className="form-title">Bem-vindo de volta</h2>
        <p className="form-sub">Entre com suas credenciais para acessar o painel</p>
      </div>

      <div className="socials">
        <button type="button" className="social-btn" onClick={() => toast.info('Google em breve!')}>
          <GoogleIcon /> Google
        </button>
        <button type="button" className="social-btn" onClick={() => toast.info('Microsoft em breve!')}>
          <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden>
            <path fill="#f25022" d="M1 1h10v10H1z" />
            <path fill="#00a4ef" d="M13 1h10v10H13z" />
            <path fill="#7fba00" d="M1 13h10v10H1z" />
            <path fill="#ffb900" d="M13 13h10v10H13z" />
          </svg>
          Microsoft
        </button>
      </div>

      <div className="divider">
        <div className="div-line" />
        <span className="div-txt">ou continue com e-mail</span>
        <div className="div-line" />
      </div>

      <form onSubmit={handle} noValidate>
        <div className={`field${emailErr ? ' err' : ''}`}>
          <div className="field-label">
            <span>E-mail</span>
          </div>
          <div className="input-row">
            <span className="input-icon-l">
              <IconMail size={14} />
            </span>
            <input
              className="inp"
              type="email"
              placeholder="seuemail@empresa.com"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailErr(false);
              }}
              data-testid="login-email"
            />
          </div>
          <div className="field-err">E-mail invalido.</div>
        </div>

        <div className={`field${pwdErr ? ' err' : ''}`}>
          <div className="field-label">
            <span>Senha</span>
          </div>
          <div className="input-row">
            <span className="input-icon-l">
              <IconLock size={14} />
            </span>
            <input
              className="inp"
              type={showPwd ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPwdErr(false);
              }}
              data-testid="login-password"
            />
            <button type="button" className="eye-btn" onClick={() => setShowPwd((v) => !v)} aria-label="Mostrar senha">
              {showPwd ? <IconEyeOff size={14} /> : <IconEye size={14} />}
            </button>
          </div>
          <div className="field-err">Minimo 6 caracteres.</div>
        </div>

        <div className="opts">
          <label className="check-wrap">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <span>Manter conectado</span>
          </label>
          <button type="button" className="link" onClick={onForgot}>
            Esqueceu a senha?
          </button>
        </div>

        <button type="submit" className={ctaClass} disabled={isLoading || done} data-testid="login-submit">
          <span className="cta-text">Entrar no sistema</span>
          <div className="cta-spinner" />
          <div className="cta-check">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </button>

        {apiError && (
          <p className="api-err" data-testid="login-mensagem-erro">
            {apiError}
          </p>
        )}
      </form>

      <p className="register">
        Nao tem uma conta?{' '}
        <button type="button" className="link" onClick={onSignup} data-testid="login-link-criar-conta">
          Solicite seu acesso
        </button>
      </p>

      <div className="secure">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span>Conexao segura · SSL 256-bit</span>
      </div>
    </div>
  );
}
