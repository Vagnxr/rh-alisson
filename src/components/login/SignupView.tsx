import { useState } from 'react';
import { LoginField } from './LoginField';
import { passwordStrength } from './passwordStrength';
import { IconArrowRight, IconCheck, IconLock, IconMail, IconShield } from './icons';

type SignupData = {
  name: string;
  email: string;
  company: string;
  segment: string;
  password: string;
  agree: boolean;
};

type SignupViewProps = {
  onBack: () => void;
  onRegister: (data: { nome: string; email: string; password: string }) => Promise<boolean>;
  isLoading: boolean;
  apiError: string | null;
};

const SEGMENTS = [
  { id: 'conveniencia', label: 'Conveniência' },
  { id: 'mercado', label: 'Mercado' },
  { id: 'supermercado', label: 'Supermercado' },
  { id: 'atacado', label: 'Atacado' },
  { id: 'padaria', label: 'Padaria' },
  { id: 'outros', label: 'Outros' },
] as const;

export function SignupView({ onBack, onRegister, isLoading, apiError }: SignupViewProps) {
  const [step, setStep] = useState(1);
  const [stepDir, setStepDir] = useState<'forward' | 'back'>('forward');
  const [data, setData] = useState<SignupData>({
    name: '',
    email: '',
    company: '',
    segment: '',
    password: '',
    agree: false,
  });
  const set = (k: keyof SignupData) => (v: string | boolean) => setData((d) => ({ ...d, [k]: v }));

  const [done, setDone] = useState(false);

  const nameValid = data.name.trim().split(/\s+/).length >= 2;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
  const companyValid = data.company.trim().length >= 2;
  const passwordValid = data.password.length >= 8;
  const strength = passwordStrength(data.password);

  const step1Valid = nameValid && emailValid;
  const step2Valid = companyValid && !!data.segment;
  const step3Valid = passwordValid && data.agree;

  const next = () => {
    setStepDir('forward');
    setStep((s) => s + 1);
  };
  const back = () => {
    setStepDir('back');
    setStep((s) => Math.max(1, s - 1));
  };

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!step3Valid) return;
    const ok = await onRegister({
      nome: data.name.trim(),
      email: data.email.trim(),
      password: data.password,
    });
    if (ok) setDone(true);
  };

  if (done) {
    return (
      <div className="view">
        <div className="success-card rise rise-2">
          <div className="success-icon">
            <IconCheck size={28} />
          </div>
          <h2>Conta criada</h2>
          <p>
            Tudo certo, <strong>{data.name.split(' ')[0]}</strong>! Seu acesso foi liberado. Você já pode usar o
            sistema com o e-mail <strong>{data.email}</strong>.
          </p>
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
    <div className="view">
      <button
        className="back-link rise rise-1"
        type="button"
        onClick={() => {
          if (step === 1) onBack();
          else back();
        }}
      >
        <IconArrowRight style={{ transform: 'rotate(180deg)' }} />
        {step === 1 ? 'Voltar para o login' : 'Etapa anterior'}
      </button>

      <div className="form-head rise rise-2">
        <h2>Criar sua conta</h2>
        <p>
          {step === 1 && 'Para começar, conte um pouco sobre você.'}
          {step === 2 && 'Agora nos fale do seu negócio.'}
          {step === 3 && 'Por fim, defina uma senha segura.'}
        </p>
      </div>

      <div className="stepper rise rise-2">
        {[1, 2, 3].map((n) => (
          <div key={n} className={`step ${step === n ? 'active' : ''} ${step > n ? 'done' : ''}`}>
            <span className="step-dot">{step > n ? <IconCheck size={12} /> : n}</span>
            <span className="step-label">{n === 1 ? 'Você' : n === 2 ? 'Negócio' : 'Senha'}</span>
          </div>
        ))}
      </div>

      <form className="login" onSubmit={handle} noValidate>
        <div key={step} className="signup-step-panel" data-dir={stepDir}>
        {step === 1 && (
          <>
            <div className="rise rise-3">
              <LoginField
                id="su-name"
                label="Nome completo"
                type="text"
                autoComplete="name"
                icon={<IconShield />}
                value={data.name}
                onChange={set('name')}
                valid={nameValid}
                invalid={data.name.length > 0 && !nameValid}
                msgError="Digite seu nome completo"
              />
            </div>
            <div className="rise rise-4">
              <LoginField
                id="su-email"
                label="E-mail corporativo"
                type="email"
                autoComplete="email"
                icon={<IconMail />}
                value={data.email}
                onChange={set('email')}
                valid={emailValid}
                invalid={data.email.length > 0 && !emailValid}
                msgError="Digite um e-mail válido"
              />
            </div>
            <button type="button" className="submit rise rise-5" disabled={!step1Valid} onClick={next}>
              <span className="label" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                Continuar <IconArrowRight className="arrow" />
              </span>
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="rise rise-3">
              <LoginField
                id="su-company"
                label="Nome da empresa"
                type="text"
                autoComplete="organization"
                icon={<IconShield />}
                value={data.company}
                onChange={set('company')}
                valid={companyValid}
                invalid={data.company.length > 0 && !companyValid}
                msgError="Mínimo de 2 caracteres"
              />
            </div>

            <div className="rise rise-4">
              <div className="seg-label">Segmento do negócio</div>
              <div className="segment-grid">
                {SEGMENTS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`seg-opt ${data.segment === opt.id ? 'active' : ''}`}
                    onClick={() => set('segment')(opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button type="button" className="submit rise rise-5" disabled={!step2Valid} onClick={next}>
              <span className="label" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                Continuar <IconArrowRight className="arrow" />
              </span>
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <div className="rise rise-3">
              <LoginField
                id="su-pass"
                label="Senha"
                type="password"
                autoComplete="new-password"
                icon={<IconLock />}
                value={data.password}
                onChange={set('password')}
                valid={passwordValid}
                invalid={data.password.length > 0 && !passwordValid}
                msg={`Senha ${strength.label.toLowerCase()}`}
                msgError="Mínimo de 8 caracteres"
              />
            </div>

            <div className="strength rise rise-3">
              <div className="strength-bars">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={`bar ${i < strength.score ? `on ${strength.cls}` : ''}`} />
                ))}
              </div>
              <div className="strength-label">
                {data.password.length > 0 ? strength.label : 'Use 8+ caracteres, com letras e números'}
              </div>
            </div>

            <label className="check rise rise-4" style={{ marginTop: 6 }}>
              <input type="checkbox" checked={data.agree} onChange={(e) => set('agree')(e.target.checked)} />
              <span className="box">
                <IconCheck />
              </span>
              <span style={{ fontSize: 13.5, lineHeight: 1.5 }}>
                Aceito os <a href="#" className="link">termos de uso</a> e a{' '}
                <a href="#" className="link">política de privacidade</a>.
              </span>
            </label>

            <button
              type="submit"
              className={`submit rise rise-5 ${isLoading ? 'loading' : ''}`}
              disabled={!step3Valid || isLoading}
            >
              <span className="label" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                Solicitar acesso <IconArrowRight className="arrow" />
              </span>
              {isLoading && <span className="spin" />}
            </button>

            {apiError && (
              <div className="submit-error rise" data-testid="login-mensagem-erro">
                {apiError}
              </div>
            )}
          </>
        )}
        </div>
      </form>
    </div>
  );
}
