import { useState, useEffect } from 'react';
import {
  Settings,
  Table2,
  Eye,
  EyeOff,
  GripVertical,
  RotateCcw,
  Check,
  Lock,
} from 'lucide-react';
import { useConfiguracaoStore } from '@/stores/configuracaoStore';
import type { TabelaConfig, ColunaConfig } from '@/types/configuracao';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';

interface ColunaItemProps {
  coluna: ColunaConfig;
  tabelaId: string;
  onToggle: (isVisible: boolean) => void;
  onToggleSomarNoTotal?: (somarNoTotal: boolean) => void;
  showSomarNoTotal?: boolean;
}

function ColunaItem({ coluna, tabelaId, onToggle, onToggleSomarNoTotal, showSomarNoTotal }: ColunaItemProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-lg border px-4 py-3 transition-colors',
        coluna.isVisible
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-slate-200 bg-slate-50'
      )}
    >
      <div className="flex items-center gap-3">
        <GripVertical className="h-4 w-4 cursor-grab text-slate-400" />
        <div>
          <p className="font-medium text-slate-900">{coluna.label}</p>
          {coluna.isRequired && (
            <p className="flex items-center gap-1 text-xs text-slate-500">
              <Lock className="h-3 w-3" />
              Coluna obrigatoria
            </p>
          )}
          {showSomarNoTotal && onToggleSomarNoTotal && (
            <p className="mt-1 flex items-center gap-2 text-xs text-slate-600">
              <span>Somar no total:</span>
              <button
                type="button"
                onClick={() => onToggleSomarNoTotal(!coluna.somarNoTotal)}
                className={cn(
                  'rounded px-2 py-0.5 text-xs font-medium',
                  coluna.somarNoTotal
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600'
                )}
              >
                {coluna.somarNoTotal !== false ? 'Sim' : 'Nao'}
              </button>
            </p>
          )}
        </div>
      </div>
      <button
        onClick={() => onToggle(!coluna.isVisible)}
        disabled={coluna.isRequired}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
          coluna.isRequired
            ? 'cursor-not-allowed bg-slate-100 text-slate-400'
            : coluna.isVisible
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
        )}
      >
        {coluna.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
    </div>
  );
}

interface TabelaConfigCardProps {
  tabela: TabelaConfig;
  onToggleColuna: (colunaId: string, isVisible: boolean) => void;
  onToggleSomarNoTotal?: (colunaId: string, somarNoTotal: boolean) => void;
  onReset: () => void;
}

function TabelaConfigCard({ tabela, onToggleColuna, onToggleSomarNoTotal, onReset }: TabelaConfigCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const colunasVisiveis = tabela.colunas.filter((c) => c.isVisible).length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex cursor-pointer items-center justify-between p-4 hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
            <Table2 className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{tabela.nome}</h3>
            <p className="text-sm text-slate-500">{tabela.descricao}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
            {colunasVisiveis} de {tabela.colunas.length} colunas
          </span>
          <svg
            className={cn(
              'h-5 w-5 text-slate-400 transition-transform',
              isExpanded && 'rotate-180'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-200 p-4">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Marque as colunas que deseja exibir na tabela
            </p>
            <Button variant="outline" size="sm" onClick={onReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Restaurar padrao
            </Button>
          </div>

          <div className="space-y-2">
            {tabela.colunas
              .sort((a, b) => a.order - b.order)
              .map((coluna) => (
                <ColunaItem
                  key={coluna.id}
                  coluna={coluna}
                  tabelaId={tabela.id}
                  onToggle={(isVisible) => onToggleColuna(coluna.id, isVisible)}
                  onToggleSomarNoTotal={
                    onToggleSomarNoTotal
                      ? (somarNoTotal) => onToggleSomarNoTotal(coluna.id, somarNoTotal)
                      : undefined
                  }
                  showSomarNoTotal={tabela.id === 'balanco'}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ConfiguracoesPage() {
  const {
    tabelas,
    fetchConfiguracoes,
    updateColunaVisibilidade,
    updateColunaSomarNoTotal,
    resetTabela,
  } = useConfiguracaoStore();

  useEffect(() => {
    fetchConfiguracoes();
  }, [fetchConfiguracoes]);

  const handleToggleColuna = (tabelaId: string, colunaId: string, isVisible: boolean) => {
    updateColunaVisibilidade(tabelaId, colunaId, isVisible);
    toast.success(isVisible ? 'Coluna ativada' : 'Coluna desativada');
  };

  const handleToggleSomarNoTotal = (tabelaId: string, colunaId: string, somarNoTotal: boolean) => {
    updateColunaSomarNoTotal?.(tabelaId, colunaId, somarNoTotal);
    toast.success(somarNoTotal ? 'Coluna somada no total' : 'Coluna nao somada no total');
  };

  const handleReset = (tabelaId: string) => {
    resetTabela(tabelaId);
    toast.success('Configuracoes restauradas para o padrao');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Configuracoes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Personalize a exibicao de colunas em cada tabela do sistema
        </p>
      </div>

      {/* Info card */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <Settings className="h-5 w-5 text-blue-600" />
        <div>
          <p className="font-medium text-blue-900">Configuracoes de Colunas</p>
          <p className="text-sm text-blue-700">
            Escolha quais colunas deseja visualizar em cada tabela. As configuracoes sao salvas
            automaticamente e aplicadas em todas as suas sessoes.
          </p>
        </div>
      </div>

      {/* Lista de tabelas */}
      <div className="space-y-4">
        {tabelas.map((tabela) => (
          <TabelaConfigCard
            key={tabela.id}
            tabela={tabela}
            onToggleColuna={(colunaId, isVisible) =>
              handleToggleColuna(tabela.id, colunaId, isVisible)
            }
            onToggleSomarNoTotal={
              updateColunaSomarNoTotal
                ? (colunaId, somarNoTotal) => handleToggleSomarNoTotal(tabela.id, colunaId, somarNoTotal)
                : undefined
            }
            onReset={() => handleReset(tabela.id)}
          />
        ))}
      </div>
    </div>
  );
}
