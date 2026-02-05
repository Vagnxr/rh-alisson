import { useState } from 'react';
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
    <div className="flex min-h-screen">
      {/* Esquerda: capa 2/3 */}
      <div className="relative hidden w-2/3 overflow-hidden md:block">
        <img src="/CAPA.png" alt="" className="h-full w-full object-cover object-center" />
      </div>

      {/* Direita: login 1/3 */}
      <div
        className="flex w-fit flex-col justify-center px-6 py-12 md:w-1/3 md:px-12"
        style={{ backgroundColor: CORES.azul }}
      >
        <div className="mx-auto w-full max-w-sm flex-col items-center justify-center ">
          <img src={LogotipoColorido} className="mx-auto" aria-hidden />

          <h2 className="mt-8 text-center text-xl font-semibold text-white">Entrar na conta</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-white/90">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                placeholder="seu@email.com"
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 transition-colors focus:border-[#199c61] focus:ring-2 focus:ring-[#199c61]/30 focus:outline-none"
              />
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-300">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-white/90">
                Senha
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="******"
                  className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 pr-12 text-white placeholder-white/50 transition-colors focus:border-[#199c61] focus:ring-2 focus:ring-[#199c61]/30 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-white/60 hover:text-white/90"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-300">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/20 p-3 text-center text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: CORES.verde }}
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

          <p className="mt-6 text-center text-sm text-white/70">
            Nao tem uma conta?{' '}
            <Link
              to="/cadastro"
              className="font-medium hover:underline"
              style={{ color: CORES.verde }}
            >
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
