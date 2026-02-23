import { useState, useEffect } from 'react';
import {
  Settings,
  Table2,
  Eye,
  EyeOff,
  GripVertical,
  RotateCcw,
  Lock,
  Plus,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { useConfiguracaoStore } from '@/stores/configuracaoStore';
import type { TabelaConfig, ColunaConfig } from '@/types/configuracao';
import { ID_TABELA_CAIXA, CAIXA_COLUNAS_PADRAO_IDS } from '@/types/configuracao';

/** Gera id unico a partir do label (ex.: "Taxa cartao" -> "taxaCartao"). */
function slugFromLabel(label: string): string {
  const base = label
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .map((s, i) => (i === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1)))
    .join('');
  return base || 'coluna';
}

interface ColunaItemProps {
  coluna: ColunaConfig;
  tabelaId: string;
  onToggle: (isVisible: boolean) => void;
  onToggleSomarNoTotal?: (somarNoTotal: boolean) => void;
  onToggleSubtrairNoTotal?: (subtrairNoTotal: boolean) => void;
  showSomarNoTotal?: boolean;
  showSubtrairNoTotal?: boolean;
  onRemove?: (colunaId: string) => void;
  canAddRemoveColunas?: boolean;
  canRemoveColuna?: (colunaId: string) => boolean;
}

function ColunaItem({
  coluna,
  tabelaId,
  onToggle,
  onToggleSomarNoTotal,
  onToggleSubtrairNoTotal,
  showSomarNoTotal,
  showSubtrairNoTotal,
  onRemove,
  canAddRemoveColunas,
  canRemoveColuna,
}: ColunaItemProps) {
  const podeRemover =
    canAddRemoveColunas &&
    onRemove &&
    !coluna.isRequired &&
    (canRemoveColuna === undefined || canRemoveColuna(coluna.id));
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
          {canRemoveColuna && !canRemoveColuna(coluna.id) && canAddRemoveColunas && (
            <p className="text-xs text-slate-500">Padrao do sistema; use desativar para ocultar.</p>
          )}
          {(showSomarNoTotal || showSubtrairNoTotal) && (
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
              {showSomarNoTotal && onToggleSomarNoTotal && (
                <span className="flex items-center gap-2">
                  Somar no total:
                  <button
                    type="button"
                    onClick={() => {
                      if (coluna.somarNoTotal) {
                        onToggleSomarNoTotal(false);
                      } else {
                        onToggleSomarNoTotal(true);
                        onToggleSubtrairNoTotal?.(false);
                      }
                    }}
                    className={cn(
                      'rounded px-2 py-0.5 text-xs font-medium',
                      coluna.somarNoTotal ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {coluna.somarNoTotal ? 'Sim' : 'Nao'}
                  </button>
                </span>
              )}
              {showSubtrairNoTotal && onToggleSubtrairNoTotal && (
                <span className="flex items-center gap-2">
                  Subtrair no total:
                  <button
                    type="button"
                    onClick={() => {
                      if (coluna.subtrairNoTotal) {
                        onToggleSubtrairNoTotal(false);
                      } else {
                        onToggleSubtrairNoTotal(true);
                        onToggleSomarNoTotal?.(false);
                      }
                    }}
                    className={cn(
                      'rounded px-2 py-0.5 text-xs font-medium',
                      coluna.subtrairNoTotal ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {coluna.subtrairNoTotal ? 'Sim' : 'Nao'}
                  </button>
                </span>
              )}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {podeRemover && (
          <button
            type="button"
            onClick={() => onRemove(coluna.id)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
            title="Remover coluna"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
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
    </div>
  );
}

interface TabelaConfigCardProps {
  tabela: TabelaConfig;
  onToggleColuna: (colunaId: string, isVisible: boolean) => void;
  onToggleSomarNoTotal?: (colunaId: string, somarNoTotal: boolean) => void;
  onToggleSubtrairNoTotal?: (colunaId: string, subtrairNoTotal: boolean) => void;
  onReset: () => void;
  onRemoveColuna?: (tabelaId: string, colunaId: string) => void;
  onReorderColunas?: (tabelaId: string, colunas: ColunaConfig[]) => void;
}

function TabelaConfigCard({
  tabela,
  onToggleColuna,
  onToggleSomarNoTotal,
  onToggleSubtrairNoTotal,
  onReset,
  onRemoveColuna,
  onReorderColunas,
}: TabelaConfigCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dialogNovaColuna, setDialogNovaColuna] = useState(false);
  const [novaColunaLabel, setNovaColunaLabel] = useState('');
  const [novaColunaTipo, setNovaColunaTipo] = useState<'soma' | 'subtrai' | 'neutro'>('soma');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const colunasVisiveis = tabela.colunas.filter((c) => c.isVisible).length;
  const canAddRemoveColunas =
    tabela.id === ID_TABELA_CAIXA || tabela.nome.toLowerCase() === 'caixa';
  const isCaixa = tabela.id === ID_TABELA_CAIXA || tabela.nome.toLowerCase() === 'caixa';

  const colunasOrdenadas = [...tabela.colunas].sort((a, b) => a.order - b.order);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDraggedIndex(null);
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (Number.isNaN(fromIndex) || fromIndex === dropIndex || !onReorderColunas) return;
    const reordered = [...colunasOrdenadas];
    const [removed] = reordered.splice(fromIndex, 1);
    reordered.splice(dropIndex, 0, removed);
    const withNewOrder = reordered.map((c, i) => ({ ...c, order: i + 1 }));
    onReorderColunas(tabela.id, withNewOrder);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

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
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-500">
              {canAddRemoveColunas
                ? 'Inclua ou remova colunas e marque as que deseja exibir'
                : 'Marque as colunas que deseja exibir na tabela'}
            </p>
            <div className="flex items-center gap-2">
              {canAddRemoveColunas && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNovaColunaLabel('');
                    setDialogNovaColuna(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova coluna
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onReset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Restaurar padrao
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {colunasOrdenadas.map((coluna, index) => (
              <div
                key={coluna.id}
                draggable={!!onReorderColunas}
                onDragStart={(e) => onReorderColunas && handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => onReorderColunas && handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  onReorderColunas && 'cursor-grab active:cursor-grabbing',
                  draggedIndex === index && 'opacity-50'
                )}
              >
                <ColunaItem
                  coluna={coluna}
                  tabelaId={tabela.id}
                  onToggle={(isVisible) => onToggleColuna(coluna.id, isVisible)}
                  onToggleSomarNoTotal={
                    onToggleSomarNoTotal
                      ? (somarNoTotal) => onToggleSomarNoTotal(coluna.id, somarNoTotal)
                      : undefined
                  }
                  showSomarNoTotal={tabela.id === 'balanco' || tabela.id === ID_TABELA_CAIXA || tabela.nome.toLowerCase() === 'caixa'}
                  showSubtrairNoTotal={tabela.id === ID_TABELA_CAIXA || tabela.nome.toLowerCase() === 'caixa'}
                  onToggleSubtrairNoTotal={
                    onToggleSubtrairNoTotal ? (subtrairNoTotal) => onToggleSubtrairNoTotal(coluna.id, subtrairNoTotal) : undefined
                  }
                  onRemove={onRemoveColuna ? (colunaId) => onRemoveColuna(tabela.id, colunaId) : undefined}
                  canAddRemoveColunas={canAddRemoveColunas}
                  canRemoveColuna={
                    tabela.id === ID_TABELA_CAIXA || tabela.nome.toLowerCase() === 'caixa'
                      ? (colunaId) => !CAIXA_COLUNAS_PADRAO_IDS.includes(colunaId)
                      : undefined
                  }
                />
              </div>
            ))}
          </div>

          {canAddRemoveColunas && (
            <Dialog open={dialogNovaColuna} onOpenChange={(open) => { setDialogNovaColuna(open); if (!open) setNovaColunaTipo('soma'); }}>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>Nova coluna</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <p className="text-sm text-slate-500">
                    Informe o nome da coluna. Ela aparecera na tabela e no formulario do Caixa.
                  </p>
                  <input
                    type="text"
                    value={novaColunaLabel}
                    onChange={(e) => setNovaColunaLabel(e.target.value)}
                    placeholder="Ex.: Taxa cartao"
                    className="flex h-10 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {isCaixa && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-700">No total do dia:</p>
                      <div className="flex flex-wrap gap-2">
                        {(['soma', 'subtrai', 'neutro'] as const).map((tipo) => (
                          <label key={tipo} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                            <input
                              type="radio"
                              name="novaColunaTipo"
                              checked={novaColunaTipo === tipo}
                              onChange={() => setNovaColunaTipo(tipo)}
                              className="text-emerald-600"
                            />
                            {tipo === 'soma' && 'SOMA'}
                            {tipo === 'subtrai' && 'SUBTRAI'}
                            {tipo === 'neutro' && 'NEUTRO'}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter className="mt-2">
                  <Button variant="outline" onClick={() => setDialogNovaColuna(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => {
                      const label = novaColunaLabel.trim();
                      if (!label) {
                        toast.error('Informe o nome da coluna.');
                        return;
                      }
                      const tabelaRef = useConfiguracaoStore.getState().getTabela(tabela.id);
                      const existingIds = tabelaRef?.colunas.map((c) => c.id) ?? [];
                      let id = slugFromLabel(label);
                      let n = 1;
                      while (existingIds.includes(id)) {
                        id = slugFromLabel(label) + String(n);
                        n++;
                      }
                      const somarNoTotal = isCaixa ? novaColunaTipo === 'soma' : true;
                      const subtrairNoTotal = isCaixa ? novaColunaTipo === 'subtrai' : false;
                      useConfiguracaoStore.getState().addColuna(tabela.id, {
                        id,
                        label,
                        isVisible: true,
                        somarNoTotal,
                        subtrairNoTotal,
                      });
                      toast.success('Coluna adicionada.');
                      setNovaColunaLabel('');
                      setNovaColunaTipo('soma');
                      setDialogNovaColuna(false);
                    }}
                  >
                    Adicionar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
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
    updateColunaSubtrairNoTotal,
    updateColunaOrdem,
    resetTabela,
    removeColuna,
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

  const handleToggleSubtrairNoTotal = (tabelaId: string, colunaId: string, subtrairNoTotal: boolean) => {
    updateColunaSubtrairNoTotal?.(tabelaId, colunaId, subtrairNoTotal);
    toast.success(subtrairNoTotal ? 'Coluna subtraida no total' : 'Coluna nao subtraida no total');
  };

  const handleReset = (tabelaId: string) => {
    resetTabela(tabelaId);
    toast.success('Configuracoes restauradas para o padrao');
  };

  const handleReorderColunas = (tabelaId: string, colunas: ColunaConfig[]) => {
    updateColunaOrdem(tabelaId, colunas);
    toast.success('Ordem das colunas atualizada.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Configuracoes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Personalize a exibicao de colunas em cada tabela do sistema
          </p>
        </div>
        <Link to="/configuracoes/nova-pagina-despesa" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          Criar pagina de despesa
        </Link>
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
            onToggleSubtrairNoTotal={
              updateColunaSubtrairNoTotal
                ? (colunaId, subtrairNoTotal) => handleToggleSubtrairNoTotal(tabela.id, colunaId, subtrairNoTotal)
                : undefined
            }
            onReset={() => handleReset(tabela.id)}
            onRemoveColuna={
              tabela.id === ID_TABELA_CAIXA || tabela.nome.toLowerCase() === 'caixa'
                ? (tid, colunaId) => {
                    removeColuna(tid, colunaId);
                    toast.success('Coluna removida.');
                  }
                : undefined
            }
            onReorderColunas={handleReorderColunas}
          />
        ))}
      </div>
    </div>
  );
}
