import { Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import type { EntradaRow } from '@/types/financeiro';
import {
  INPUT_CLASS,
  formatCurrency,
  type FormaPagamentoFromApi,
} from './constants';
import { formatValorForInput, parseValorFromInput } from '@/lib/formatValor';
import { cn } from '@/lib/cn';

export interface EntradaFormData {
  data: string;
  dataEmissao: string;
  numeroNota: string;
  tipoEntradaId: string;
  fornecedor: string;
  modeloNotaId: string;
  formaPagamentoId: string;
  valorTotalNota: string;
  valores: { categoriaId: string; valor: string }[];
  contasAPagar: { vencimento: string; valor: string; disabled?: boolean }[];
}

export interface EntradaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: EntradaRow | null;
  formData: EntradaFormData;
  setFormData: React.Dispatch<React.SetStateAction<EntradaFormData>>;
  modelosNota: string[];
  categorias: { id: string; nome: string }[];
  formasPagamento: FormaPagamentoFromApi[];
  fornecedorNome: string | null;
  fornecedorError: string | null;
  somaCategoriasDiverge: boolean;
  totalValores: number;
  valorTotalNotaNum: number;
  formaBoleto: boolean;
  onFornecedorChange: (value: string) => void;
  onFornecedorBlur: () => void;
  onFornecedorPaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  onCadastroFornecedorOpen: () => void;
  addValorLine: () => void;
  removeValorLine: (index: number) => void;
  updateValorLine: (index: number, field: 'categoriaId' | 'valor', value: string) => void;
  addContaAPagar: () => void;
  removeContaAPagar: (index: number) => void;
  updateContaAPagar: (index: number, field: 'vencimento' | 'valor', value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const TIPOS_ENTRADA = ['Compra', 'Outros'];

export function EntradaFormDialog({
  open,
  onOpenChange,
  editingItem,
  formData,
  setFormData,
  modelosNota,
  categorias,
  formasPagamento,
  fornecedorNome,
  fornecedorError,
  somaCategoriasDiverge,
  totalValores,
  valorTotalNotaNum,
  formaBoleto,
  onFornecedorChange,
  onFornecedorBlur,
  onFornecedorPaste,
  onCadastroFornecedorOpen,
  addValorLine,
  removeValorLine,
  updateValorLine,
  addContaAPagar,
  removeContaAPagar,
  updateContaAPagar,
  onSubmit,
  onClose,
}: EntradaFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Editar Entrada' : 'Nova Entrada'}</DialogTitle>
          <DialogDescription>Preencha os dados da entrada.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="min-w-0 overflow-x-hidden overflow-y-auto">
            <div className="mb-4 mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Modelo da nota</label>
                  <select
                    value={formData.modeloNotaId}
                    onChange={e => setFormData(prev => ({ ...prev, modeloNotaId: e.target.value }))}
                    className={INPUT_CLASS}
                  >
                    {[...modelosNota]
                      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
                      .map(m => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Tipo</label>
                  <select
                    value={formData.tipoEntradaId}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, tipoEntradaId: e.target.value }))
                    }
                    className={INPUT_CLASS}
                  >
                    {[...TIPOS_ENTRADA]
                      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
                      .map(t => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">CNPJ ou CPF do fornecedor</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="00.000.000/0000-00 ou 000.000.000-00"
                    maxLength={18}
                    value={formData.fornecedor}
                    onChange={e => onFornecedorChange(e.target.value)}
                    onBlur={onFornecedorBlur}
                    onPaste={onFornecedorPaste}
                    className={cn(INPUT_CLASS, fornecedorError && 'border-red-500')}
                  />
                  {fornecedorNome && (
                    <p className="text-sm font-medium text-emerald-700">{fornecedorNome}</p>
                  )}
                  {fornecedorError && (
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm text-red-600">{fornecedorError}</p>
                      <button
                        type="button"
                        onClick={onCadastroFornecedorOpen}
                        className="text-sm font-medium text-emerald-600 hover:underline"
                      >
                        Cadastrar fornecedor
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Data entrada</label>
                  <input
                    type="date"
                    value={formData.data}
                    onChange={e => setFormData(prev => ({ ...prev, data: e.target.value }))}
                    className={INPUT_CLASS}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Data emissao (nota)</label>
                  <input
                    type="date"
                    value={formData.dataEmissao}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, dataEmissao: e.target.value }))
                    }
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Nº da nota</label>
                  <input
                    type="text"
                    value={formData.numeroNota}
                    onChange={e => setFormData(prev => ({ ...prev, numeroNota: e.target.value }))}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Valor total da nota</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={formData.valorTotalNota}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, valorTotalNota: e.target.value }))
                  }
                  className={cn(INPUT_CLASS, somaCategoriasDiverge && 'border-amber-500')}
                />
              </div>
              <div className="space-y-2">
                <div className="ml-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">
                    Divisão por categoria
                  </label>
                  <button
                    type="button"
                    onClick={addValorLine}
                    className="text-sm text-emerald-600 hover:underline"
                  >
                    Adicionar linha
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  A soma dos valores por categoria deve ser igual ao valor total da nota.
                </p>
                <div className="max-h-40 space-y-2 overflow-y-auto px-2 py-4">
                  {formData.valores.map((v, i) => (
                    <div key={i} className="flex min-w-0 items-center gap-2">
                      <select
                        value={v.categoriaId}
                        onChange={e => updateValorLine(i, 'categoriaId', e.target.value)}
                        className={cn(INPUT_CLASS, 'min-w-[180px] flex-1 shrink-0')}
                        title={categorias.find(c => c.id === v.categoriaId)?.nome}
                      >
                        {[...categorias]
                          .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                          .map(c => (
                            <option key={c.id} value={c.id} title={c.nome}>
                              {c.nome}
                            </option>
                          ))}
                      </select>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={v.valor}
                        onChange={e => updateValorLine(i, 'valor', e.target.value)}
                        className={cn(INPUT_CLASS, 'w-fit')}
                      />
                      <button
                        type="button"
                        onClick={() => removeValorLine(i)}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs">
                  <span className="text-slate-500">
                    Soma das categorias: {formatCurrency(totalValores)}
                  </span>
                  {formData.valorTotalNota.trim() && (
                    <>
                      <span className="text-slate-400">|</span>
                      <span className="text-slate-500">
                        Total da nota: {formatCurrency(valorTotalNotaNum)}
                      </span>
                      {somaCategoriasDiverge && (
                        <span className="text-amber-600">(valores divergentes)</span>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Forma de pagamento</label>
                <select
                  value={formData.formaPagamentoId}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, formaPagamentoId: e.target.value }))
                  }
                  className={INPUT_CLASS}
                  title={
                    editingItem
                      ? 'Ao editar, nao e possivel trocar entre formas que comunicam agenda e formas que nao comunicam agenda.'
                      : undefined
                  }
                >
                  {(() => {
                    const lista = [...formasPagamento];
                    if (editingItem) {
                      const atual = lista.find(f => f.nome === formData.formaPagamentoId);
                      const atualAgenda = atual?.comunicarAgenda === true;
                      return lista.filter(f => f.comunicarAgenda === atualAgenda);
                    }
                    return lista;
                  })()
                    .sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? '', 'pt-BR'))
                    .map(f => (
                      <option key={f.id} value={f.nome}>
                        {f.nome}
                      </option>
                    ))}
                </select>
              </div>
              {formaBoleto && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">Contas a pagar</label>
                    <button
                      type="button"
                      onClick={addContaAPagar}
                      className="text-sm text-emerald-600 hover:underline"
                    >
                      Adicionar parcela
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Vencimento e valor de cada boleto.
                  </p>
                  <div className="max-h-36 space-y-2 overflow-y-auto px-2 py-1">
                    {(formData.contasAPagar?.length
                      ? formData.contasAPagar
                      : [{ vencimento: '', valor: '' }]
                    ).map((p, i) => {
                      const isDisabled = !!p.disabled;
                      return (
                        <div
                          key={i}
                          className={cn(
                            'grid grid-cols-[1fr_1fr_auto] items-center gap-2 min-w-0',
                            isDisabled && 'opacity-60'
                          )}
                        >
                          <input
                            type="date"
                            value={p.vencimento}
                            onChange={e => updateContaAPagar(i, 'vencimento', e.target.value)}
                            className={cn(INPUT_CLASS, 'min-w-0')}
                            disabled={isDisabled}
                          />
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0,00"
                            value={p.valor}
                            onChange={e => updateContaAPagar(i, 'valor', e.target.value)}
                            className={cn(INPUT_CLASS, 'min-w-0')}
                            disabled={isDisabled}
                          />
                          <button
                            type="button"
                            onClick={() => removeContaAPagar(i)}
                            className="shrink-0 rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                            title={
                              isDisabled
                                ? 'Parcela já paga não pode ser removida'
                                : 'Remover'
                            }
                            disabled={isDisabled}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              {editingItem ? 'Salvar' : 'Adicionar'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
