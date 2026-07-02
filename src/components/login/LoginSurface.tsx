import { useState } from 'react';
import { ForgotView } from './ForgotView';
import { SignInView } from './SignInView';
import { SignupView } from './SignupView';
import { IconMoon, IconSun, MSystemMark } from './icons';

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

  return (
    <div className="right">
      <div className="controls">
        <button className="ctrl-btn" type="button" aria-label="Alternar tema" onClick={onTheme}>
          {theme === 'dark' ? <IconMoon size={14} /> : <IconSun size={14} />}
        </button>
      </div>

      <div className="form-wrap">
        <div className="form-logo">
          <div className="logo-ring">
            <MSystemMark size={25} />
          </div>
        </div>

        {screen === 'signin' && (
          <SignInView
            onForgot={() => setScreen('forgot')}
            onSignup={() => setScreen('signup')}
            onLogin={onLogin}
            isLoading={isLoading}
            apiError={apiError}
          />
        )}
        {screen === 'forgot' && <ForgotView onBack={() => setScreen('signin')} />}
        {screen === 'signup' && (
          <SignupView
            onBack={() => setScreen('signin')}
            onRegister={onRegister}
            isLoading={isLoading}
            apiError={apiError}
          />
        )}
      </div>
    </div>
  );
}
