import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginLeftPanel } from '@/components/login/LoginLeftPanel';
import { LoginSurface } from '@/components/login/LoginSurface';
import { useAuthStore } from '@/stores/authStore';
import { getFirstAllowedPath } from '@/lib/paginasPermissao';
import '@/styles/login.css';

export function LoginPage() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const registerUser = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, []);

  const handleLogin = useCallback(
    async (data: { email: string; password: string }) => {
      clearError();
      const success = await login(data);
      if (success) {
        const user = useAuthStore.getState().user;
        const permissoes = user?.permissoes ?? [];
        const path = getFirstAllowedPath(permissoes);
        navigate(path);
      }
      return success;
    },
    [clearError, login, navigate],
  );

  const handleRegister = useCallback(
    async (data: { nome: string; email: string; password: string }) => {
      clearError();
      const success = await registerUser({
        nome: data.nome,
        email: data.email,
        password: data.password,
        confirmPassword: data.password,
      });
      if (success) {
        navigate('/dashboard');
      }
      return success;
    },
    [clearError, registerUser, navigate],
  );

  return (
    <div
      className="login-page"
      data-theme={theme}
      data-accent="emerald"
      data-density="comfortable"
      data-input="outlined"
    >
      <main className="stage">
        <LoginLeftPanel />
        <LoginSurface
          theme={theme}
          onTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          onLogin={handleLogin}
          onRegister={handleRegister}
          isLoading={isLoading}
          apiError={error}
        />
      </main>
    </div>
  );
}
