import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { DespesaFixaPage } from '@/pages/DespesaFixaPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Toaster } from '@/components/ui/sonner';
import '@/index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas publicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />

        {/* Rotas protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/despesa-fixa" element={<DespesaFixaPage />} />
          
          {/* Placeholder para outras paginas */}
          <Route path="/despesa-extra" element={<PlaceholderPage title="Despesa Extra" />} />
          <Route path="/despesa-funcionario" element={<PlaceholderPage title="Despesa Funcionario" />} />
          <Route path="/despesa-imposto" element={<PlaceholderPage title="Despesa Imposto" />} />
          <Route path="/despesa-veiculo" element={<PlaceholderPage title="Despesa Veiculo" />} />
          <Route path="/despesa-banco" element={<PlaceholderPage title="Despesa Banco" />} />
          <Route path="/parcelamento" element={<PlaceholderPage title="Parcelamento" />} />
          <Route path="/renda-extra" element={<PlaceholderPage title="Renda Extra" />} />
          <Route path="/investimento" element={<PlaceholderPage title="Investimento" />} />
          
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
          <Route path="/socios" element={<PlaceholderPage title="Socios" />} />
          <Route path="/balanco-geral" element={<PlaceholderPage title="Balanco Geral" />} />
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
