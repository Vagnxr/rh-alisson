import { useState } from 'react';
import { LoginField } from './LoginField';
import { IconArrowRight, IconCheck, IconHelp, IconMail } from './icons';

type ForgotViewProps = {
  onBack: () => void;
};

export function ForgotView({ onBack }: ForgotViewProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [shake, setShake] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailInvalid = email.length > 0 && !emailValid;

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid) {
      setShake(true);
      window.setTimeout(() => setShake(false), 500);
      return;
    }
    setLoading(true);
    await new Promise((r) => window.setTimeout(r, 1300));
    setLoading(false);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="view">
        <button className="back-link rise rise-1" type="button" onClick={onBack}>
          <IconArrowRight style={{ transform: 'rotate(180deg)' }} /> Voltar para o login
        </button>
        <div className="success-card rise rise-2">
          <div className="success-icon">
            <IconCheck size={28} />
          </div>
          <h2>Link enviado!</h2>
          <p>
            Enviamos um link de recuperação para <strong>{email}</strong>. Verifique sua caixa de entrada (e a
            pasta de spam) e siga as instruções.
          </p>
          <div className="success-meta">
            <div className="meta-item">
              <span className="meta-label">Validade do link</span>
              <span className="meta-value">30 minutos</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Não recebeu?</span>
              <button type="button" className="link" onClick={() => setSent(false)}>
                Tentar novamente
              </button>
            </div>
          </div>
          <button type="button" className="submit" onClick={onBack}>
            <span className="label" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              Voltar para o login <IconArrowRight className="arrow" />
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`view ${shake ? 'shake' : ''}`}>
      <button className="back-link rise rise-1" type="button" onClick={onBack}>
        <IconArrowRight style={{ transform: 'rotate(180deg)' }} /> Voltar para o login
      </button>
      <div className="form-head rise rise-2">
        <h2>Esqueceu sua senha?</h2>
        <p>
          Sem problemas. Digite o e-mail da sua conta e enviaremos um link seguro para você criar uma nova senha.
        </p>
      </div>

      <form className="login" onSubmit={handle} noValidate>
        <div className="rise rise-3">
          <LoginField
            id="forgot-email"
            label="E-mail da conta"
            type="email"
            autoComplete="email"
            icon={<IconMail />}
            value={email}
            onChange={setEmail}
            valid={emailValid}
            invalid={emailInvalid}
            msg="Pronto para enviar"
            msgError="Digite um e-mail válido"
          />
        </div>

        <button
          type="submit"
          className={`submit rise rise-4 ${loading ? 'loading' : ''}`}
          disabled={!emailValid || loading}
        >
          <span className="label" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            Enviar link de recuperação <IconArrowRight className="arrow" />
          </span>
          {loading && <span className="spin" />}
        </button>
      </form>

      <div className="help-card rise rise-5">
        <div className="help-icon">
          <IconHelp />
        </div>
        <div>
          <div className="help-title">Precisa de mais ajuda?</div>
          <div className="help-body">
            Se você não tem mais acesso a este e-mail, entre em contato com o administrador da sua empresa ou
            fale com nosso suporte em <a href="mailto:suporte@msystem.com">suporte@msystem.com</a>.
          </div>
        </div>
      </div>
    </div>
  );
}
