import { useState } from 'react';
import { ForgotView } from './ForgotView';
import { SignInView } from './SignInView';
import { SignupView } from './SignupView';
import { IconHelp, IconMoon, IconSun, MSystemMark } from './icons';

export type LoginScreen = 'signin' | 'forgot' | 'signup';

type LoginSurfaceProps = {
  theme: 'dark' | 'light';
  onTheme: () => void;
  onLogin: (data: { email: string; password: string }) => Promise<boolean>;
  onRegister: (data: { nome: string; email: string; password: string }) => Promise<boolean>;
  isLoading: boolean;
  apiError: string | null;
};

export function LoginSurface({
  theme,
  onTheme,
  onLogin,
  onRegister,
  isLoading,
  apiError,
}: LoginSurfaceProps) {
  const [screen, setScreen] = useState<LoginScreen>('signin');
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const go = (next: LoginScreen, dir: 'forward' | 'back' = 'forward') => {
    setDirection(dir);
    setScreen(next);
  };

  return (
    <div className="right">
      <div className="right-top">
        <div className="right-top-left">
          <span className="brand-mark" style={{ width: 36, height: 36, color: 'var(--accent)' }}>
            <MSystemMark size={22} />
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>MSystem</span>
        </div>
        <button className="icon-btn" type="button" aria-label="Ajuda" title="Precisa de ajuda?">
          <IconHelp />
        </button>
        <button className="icon-btn" type="button" aria-label="Alternar tema" onClick={onTheme} title="Alternar tema">
          {theme === 'dark' ? <IconSun /> : <IconMoon />}
        </button>
      </div>

      <div className="right-body">
        <div className="form-wrap" data-screen={screen} data-dir={direction} key={screen}>
          {screen === 'signin' && (
            <SignInView
              onForgot={() => go('forgot')}
              onSignup={() => go('signup')}
              onLogin={onLogin}
              isLoading={isLoading}
              apiError={apiError}
            />
          )}
          {screen === 'forgot' && <ForgotView onBack={() => go('signin', 'back')} />}
          {screen === 'signup' && (
            <SignupView
              onBack={() => go('signin', 'back')}
              onRegister={onRegister}
              isLoading={isLoading}
              apiError={apiError}
            />
          )}
        </div>
      </div>

      <footer className="right-foot">
        <span>© 2026 MSystem</span>
        <span className="foot-links">
          <a href="#">Termos</a>
          <a href="#">Privacidade</a>
          <a href="#">Status</a>
        </span>
      </footer>
    </div>
  );
}
