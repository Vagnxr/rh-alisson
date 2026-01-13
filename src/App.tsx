import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { TenantSelectPage } from '@/pages/TenantSelectPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { DespesaFixaPage } from '@/pages/DespesaFixaPage';
import { DespesaExtraPage } from '@/pages/DespesaExtraPage';
import { DespesaFuncionarioPage } from '@/pages/DespesaFuncionarioPage';
import { DespesaImpostoPage } from '@/pages/DespesaImpostoPage';
import { DespesaVeiculoPage } from '@/pages/DespesaVeiculoPage';
import { DespesaBancoPage } from '@/pages/DespesaBancoPage';
import { ParcelamentoPage } from '@/pages/ParcelamentoPage';
import { RendaExtraPage } from '@/pages/RendaExtraPage';
import { InvestimentoPage } from '@/pages/InvestimentoPage';
import { SociosPage } from '@/pages/SociosPage';
import { BalancoGeralPage } from '@/pages/BalancoGeralPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminTenantsPage } from '@/pages/admin/AdminTenantsPage';
import { ProtectedRoute, AuthOnlyRoute, SuperAdminRoute } from '@/components/ProtectedRoute';
import { Toaster } from '@/components/ui/sonner';
import '@/index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas publicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />

        {/* Rota de selecao de tenant (requer autenticacao, mas nao tenant) */}
        <Route element={<AuthOnlyRoute />}>
          <Route path="/selecionar-empresa" element={<TenantSelectPage />} />
        </Route>

        {/* Rotas administrativas - Super Admin Only */}
        <Route element={<SuperAdminRoute />}>
          <Route path="/admin/usuarios" element={<AdminUsersPage />} />
          <Route path="/admin/empresas" element={<AdminTenantsPage />} />
        </Route>

        {/* Rotas protegidas (requer autenticacao + tenant) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* Paginas de Despesas */}
          <Route path="/despesa-fixa" element={<DespesaFixaPage />} />
          <Route path="/despesa-extra" element={<DespesaExtraPage />} />
          <Route path="/despesa-funcionario" element={<DespesaFuncionarioPage />} />
          <Route path="/despesa-imposto" element={<DespesaImpostoPage />} />
          <Route path="/despesa-veiculo" element={<DespesaVeiculoPage />} />
          <Route path="/despesa-banco" element={<DespesaBancoPage />} />
          
          {/* Outras paginas */}
          <Route path="/parcelamento" element={<ParcelamentoPage />} />
          <Route path="/renda-extra" element={<RendaExtraPage />} />
          <Route path="/investimento" element={<InvestimentoPage />} />
          <Route path="/socios" element={<SociosPage />} />
          <Route path="/balanco-geral" element={<BalancoGeralPage />} />
          
          {/* Financeiro - Submenus */}
          <Route path="/financeiro" element={<Navigate to="/financeiro/caixa" replace />} />
          <Route path="/financeiro/caixa" element={<PlaceholderPage title="Caixa" />} />
          <Route path="/financeiro/controle-cartoes" element={<PlaceholderPage title="Controle Cartoes" />} />
          <Route path="/financeiro/vendas" element={<PlaceholderPage title="Vendas" />} />
          <Route path="/financeiro/controle-dinheiro" element={<PlaceholderPage title="Controle Dinheiro" />} />
          <Route path="/financeiro/controle-deposito" element={<PlaceholderPage title="Controle Deposito" />} />
          <Route path="/financeiro/venda-cartoes" element={<PlaceholderPage title="Venda Cartoes" />} />
          <Route path="/financeiro/ativo-imobiliario" element={<PlaceholderPage title="Ativo Imobiliario" />} />
          <Route path="/financeiro/entrada" element={<PlaceholderPage title="Entrada" />} />
          <Route path="/financeiro/saida" element={<PlaceholderPage title="Saida" />} />
          <Route path="/financeiro/pago-dinheiro" element={<PlaceholderPage title="Pago em Dinheiro" />} />
          <Route path="/financeiro/calculadora-margem" element={<PlaceholderPage title="Calculadora de Margem" />} />
          <Route path="/financeiro/pedido-venda" element={<PlaceholderPage title="Pedido de Venda" />} />
          <Route path="/financeiro/agenda" element={<PlaceholderPage title="Agenda" />} />

          <Route path="/recursos-humanos" element={<PlaceholderPage title="Recursos Humanos" />} />
        </Route>

        {/* Redirect padrao */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  );
}

// Componente placeholder para paginas ainda nao implementadas
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">Pagina em desenvolvimento</p>
      </div>
    </div>
  );
}

export default App;
