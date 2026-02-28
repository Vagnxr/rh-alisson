import { useNavigate } from 'react-router-dom';

/**
 * Tela em branco (privacidade): ao clicar no logo o usuario esconde o conteudo
 * (ex.: ir ao banheiro sem que ninguem veja a tela). Clique em qualquer lugar para voltar.
 */
export function TelaBrancaPage() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate('/dashboard')}
      className="flex h-full min-h-[60vh] w-full cursor-pointer flex-col items-center justify-center rounded-xl bg-slate-100/90 p-8 transition-colors hover:bg-slate-200/90 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      title="Clique para voltar"
    >
      {/* Ilustracao: janela/privacidade - cortina fechada com flor */}
      <svg
        viewBox="0 0 200 160"
        className="h-48 w-48 max-w-[220px] text-slate-400 sm:h-56 sm:w-56"
        aria-hidden
      >
        <defs>
          <linearGradient id="tb-cortina" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
          <linearGradient id="tb-vaso" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#78716c" />
            <stop offset="100%" stopColor="#a8a29e" />
          </linearGradient>
        </defs>
        {/* Moldura da janela */}
        <rect x="20" y="25" width="160" height="110" rx="6" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
        <line x1="100" y1="25" x2="100" y2="135" stroke="#94a3b8" strokeWidth="2" />
        {/* Cortinas fechadas */}
        <path d="M26 31 L26 129 Q26 133 70 133 L70 31 Z" fill="url(#tb-cortina)" stroke="#64748b" strokeWidth="1" />
        <path d="M174 31 L174 129 Q174 133 130 133 L130 31 Z" fill="url(#tb-cortina)" stroke="#64748b" strokeWidth="1" />
        {/* Vaso com flor no parapeito */}
        <ellipse cx="100" cy="128" rx="22" ry="8" fill="url(#tb-vaso)" />
        <path d="M78 128 L78 95 Q78 88 100 88 Q122 88 122 95 L122 128" fill="url(#tb-vaso)" stroke="#57534e" strokeWidth="1" />
        <circle cx="100" cy="72" r="14" fill="#fde047" stroke="#facc15" strokeWidth="1" />
        <path d="M100 58 Q92 72 100 86 Q108 72 100 58" fill="#fde047" stroke="#facc15" strokeWidth="0.8" />
        <path d="M100 58 Q108 72 100 86 Q92 72 100 58" fill="#fef08a" stroke="#facc15" strokeWidth="0.8" />
        <path d="M86 72 Q100 58 114 72 Q100 86 86 72" fill="#fde047" stroke="#facc15" strokeWidth="0.8" />
        <path d="M86 72 Q100 86 114 72 Q100 58 86 72" fill="#fef08a" stroke="#facc15" strokeWidth="0.8" />
        <path d="M100 86 L100 58" stroke="#65a30d" strokeWidth="2" fill="none" />
      </svg>
      <p className="mt-8 text-center text-base font-medium text-slate-600">
        Ninguém está vendo.
      </p>
      <p className="mt-2 text-center text-sm text-slate-500">
        Clique aqui ou no logo para voltar
      </p>
    </button>
  );
}
