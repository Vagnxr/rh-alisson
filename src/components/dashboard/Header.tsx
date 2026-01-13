import { LogOut, User, Bell, Menu } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useNavigate } from 'react-router-dom';

export function Header() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const toggleSidebar = useSidebarStore((s) => s.toggle);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 sm:h-16 sm:px-6">
      <div className="flex items-center gap-3">
        {/* Botao menu mobile */}
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h2 className="hidden text-lg font-semibold text-slate-800 sm:block">
          Plataforma Financeira
        </h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notificacoes */}
        <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* Usuario */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-2 sm:gap-3 sm:pl-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 sm:h-9 sm:w-9">
            <User className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-700">{user?.nome}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            title="Sair"
          >
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
