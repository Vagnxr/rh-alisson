import { useState } from 'react';
// @ts-expect-error - useForm existe em runtime; resolução de tipos falha com moduleResolution bundler (react-hook-form)
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getFirstAllowedPath } from '@/lib/paginasPermissao';
import LogotipoColorido from '@/assets/logotipo-novo.png';

const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Senha deve ter no minimo 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const CORES = {
  verde: '#199c61',
  azul: '#1d3853',
} as const;

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);
  const isLoading = useAuthStore(s => s.isLoading);
  const error = useAuthStore(s => s.error);
  const clearError = useAuthStore(s => s.clearError);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    const success = await login(data);
    if (success) {
      const user = useAuthStore.getState().user;
      const permissoes = user?.permissoes ?? [];
      const path = getFirstAllowedPath(permissoes);
      navigate(path);
    }
  };

  return (
    <div className="relative flex min-h-screen">
      {/* Fundo: capa em tela cheia (2/3 visivel no desktop; atras do painel) */}
      <div className="absolute inset-0">
        <img
          src="/CAPA.jpeg"
          alt=""
          className="h-full w-full object-cover object-center"
        />
        {/* Overlay sutil para dar contraste ao painel */}
        <div
          className="absolute inset-0 md:bg-linear-to-r md:from-black/50 md:via-transparent md:to-black/30"
          aria-hidden
        />
      </div>

      {/* Painel de login: efeito glass (Apple-style) - ocupa 1/3 à direita no desktop */}
      <div
        className="relative z-10 flex w-full flex-col justify-center px-6 py-12 md:ml-auto md:w-1/3 md:max-w-md md:px-12 bg-[#1d3853]/25 backdrop-blur-md backdrop-saturate-150"
        style={{ boxShadow: '-8px 0 32px rgba(0,0,0,0.18)' }}
      >
        <div className="mx-auto w-full max-w-sm">
          {/* <img src={LogotipoColorido} className="mx-auto" aria-hidden alt="" /> */}

          <h2 className="mt-8 text-center text-xl font-semibold text-white drop-shadow-sm">
            Entrar na conta
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-white/95">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="seu@email.com"
                className="w-full rounded-xl border border-white/25 bg-white/15 px-4 py-3 text-white placeholder-white/50 shadow-inner transition-colors focus:border-[#199c61] focus:ring-2 focus:ring-[#199c61]/40 focus:outline-none"
                data-testid="login-email"
              />
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-300" data-testid="login-mensagem-erro">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-white/95">
                Senha
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="******"
                  className="w-full rounded-xl border border-white/25 bg-white/15 px-4 py-3 pr-12 text-white placeholder-white/50 shadow-inner transition-colors focus:border-[#199c61] focus:ring-2 focus:ring-[#199c61]/40 focus:outline-none"
                  data-testid="login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-white/70 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-300" data-testid="login-mensagem-erro">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/25 backdrop-blur-sm p-3 text-center text-sm text-red-200" data-testid="login-mensagem-erro">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-white shadow-lg transition-all hover:opacity-95 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: CORES.verde }}
              data-testid="login-submit"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/80">
            Nao tem uma conta?{' '}
            <Link
              to="/cadastro"
              className="font-medium hover:underline"
              style={{ color: CORES.verde }}
              data-testid="login-link-criar-conta"
            >
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
