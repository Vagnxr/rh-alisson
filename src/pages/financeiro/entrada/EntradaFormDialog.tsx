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
import { CurrencyInput } from '@/components/ui/currency-input';
import { DateInput } from '@/components/ui/date-input';
import { BTN_CANCEL } from '@/lib/uiClasses';

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
  isBonificacao: boolean;
  fornecedorDocumentoValido: boolean;
  totalContasAPagar: number;
  somaContasAPagarDiverge: boolean;
  contasAPagarValidasCount: number;
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

const TIPOS_ENTRADA = ['Compra', 'Outros', 'Bonificação'];

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
  isBonificacao,
  fornecedorDocumentoValido,
  totalContasAPagar,
  somaContasAPagarDiverge,
  contasAPagarValidasCount,
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
  const restDisabled = !fornecedorDocumentoValido;

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
              {/* Fornecedor primeiro (e o inicio de tudo): valida CPF/CNPJ antes de liberar demais campos.
                  CNPJ/CPF dividindo a primeira linha com Modelo da nota + Tipo (3 campos em row). */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    CNPJ ou CPF do fornecedor <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    value={formData.fornecedor}
                    onChange={e => onFornecedorChange(e.target.value)}
                    onBlur={onFornecedorBlur}
                    onPaste={onFornecedorPaste}
                    className={cn(INPUT_CLASS, fornecedorError && 'border-red-500')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Modelo da nota</label>
                  <select
                    value={formData.modeloNotaId}
                    onChange={e => setFormData(prev => ({ ...prev, modeloNotaId: e.target.value }))}
                    className={INPUT_CLASS}
                    disabled={restDisabled}
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
                  <label className="text-sm font-medium text-foreground">Tipo</label>
                  <select
                    value={formData.tipoEntradaId}
                    onChange={e => {
                      const novoTipo = e.target.value;
                      setFormData(prev => {
                        if (novoTipo === 'Bonificação') {
                          return { ...prev, tipoEntradaId: novoTipo, formaPagamentoId: '', contasAPagar: [] };
                        }
                        const formaRestaurada = prev.formaPagamentoId || (formasPagamento[0]?.nome ?? '');
                        return { ...prev, tipoEntradaId: novoTipo, formaPagamentoId: formaRestaurada };
                      });
                    }}
                    className={INPUT_CLASS}
                    disabled={restDisabled}
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
              </div>

              {/* Mensagens do fornecedor (ocupam linha cheia abaixo do grid) */}
              {(fornecedorNome || fornecedorError || (!fornecedorDocumentoValido && !fornecedorError)) && (
                <div className="space-y-1">
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
                  {!fornecedorDocumentoValido && !fornecedorError && (
                    <p className="text-xs text-amber-700">
                      Informe um CPF/CNPJ válido e cadastrado para liberar os demais campos.
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Data entrada</label>
                  <DateInput
                    value={formData.data}
                    onChange={v => setFormData(prev => ({ ...prev, data: v }))}
                    className={INPUT_CLASS}
                    required
                    disabled={restDisabled}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Data emissao (nota)</label>
                  <DateInput
                    value={formData.dataEmissao}
                    onChange={v =>
                      setFormData(prev => ({ ...prev, dataEmissao: v }))
                    }
                    className={INPUT_CLASS}
                    disabled={restDisabled}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Nº da nota</label>
                  <input
                    type="text"
                    value={formData.numeroNota}
                    onChange={e => setFormData(prev => ({ ...prev, numeroNota: e.target.value }))}
                    className={INPUT_CLASS}
                    disabled={restDisabled}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Valor total da entrada</label>
                <CurrencyInput
                  placeholder="0,00"
                  value={formData.valorTotalNota}
                  onChange={(valorTotalNota) =>
                    setFormData(prev => ({ ...prev, valorTotalNota }))
                  }
                  className={cn(INPUT_CLASS, somaCategoriasDiverge && 'border-amber-500')}
                  disabled={restDisabled}
                />
              </div>
              <div className="space-y-2">
                <div className="ml-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    Divisão por categoria
                  </label>
                  <button
                    type="button"
                    onClick={addValorLine}
                    className="text-sm text-emerald-600 hover:underline"
                    disabled={restDisabled}
                  >
                    Adicionar linha
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  A soma dos valores por categoria deve ser igual ao valor total da nota.
                </p>
                <div className="max-h-40 space-y-2 overflow-y-auto px-2 py-4">
                  {formData.valores.map((v, i) => (
                    <div key={i} className="flex min-w-0 items-center gap-2">
                      <select
                        value={v.categoriaId}
                        onChange={e => updateValorLine(i, 'categoriaId', e.target.value)}
                        className={cn(
                          INPUT_CLASS,
                          'min-w-[180px] flex-1 shrink-0',
                          !v.categoriaId && 'text-muted-foreground',
                        )}
                        title={categorias.find(c => c.id === v.categoriaId)?.nome}
                        disabled={restDisabled}
                        required
                      >
                        <option value="" disabled>
                          Selecione a categoria...
                        </option>
                        {[...categorias]
                          .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                          .map(c => (
                            <option key={c.id} value={c.id} title={c.nome}>
                              {c.nome}
                            </option>
                          ))}
                      </select>
                      <CurrencyInput
                        placeholder="0,00"
                        value={v.valor}
                        onChange={(valor) => updateValorLine(i, 'valor', valor)}
                        className={cn(INPUT_CLASS, 'w-fit')}
                        disabled={restDisabled}
                      />
                      <button
                        type="button"
                        onClick={() => removeValorLine(i)}
                        className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-red-600"
                        title="Remover"
                        disabled={restDisabled}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-xs">
                  <span className="text-muted-foreground">
                    Soma das categorias: {formatCurrency(totalValores)}
                  </span>
                  {formData.valorTotalNota.trim() && (
                    <>
                      <span className="text-muted-foreground">|</span>
                      <span className="text-muted-foreground">
                        Total da nota: {formatCurrency(valorTotalNotaNum)}
                      </span>
                      {somaCategoriasDiverge && (
                        <span className="text-amber-600">(valores divergentes)</span>
                      )}
                    </>
                  )}
                </div>
              </div>
              {!isBonificacao && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Forma de pagamento</label>
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
                    disabled={restDisabled}
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
              )}
              {!isBonificacao && formaBoleto && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">Contas a pagar</label>
                    <button
                      type="button"
                      onClick={addContaAPagar}
                      className="text-sm text-emerald-600 hover:underline"
                      disabled={restDisabled}
                    >
                      Adicionar parcela
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
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
                          <DateInput
                            value={p.vencimento}
                            onChange={v => updateContaAPagar(i, 'vencimento', v)}
                            className={cn(INPUT_CLASS, 'min-w-0')}
                            disabled={isDisabled || restDisabled}
                          />
                          <CurrencyInput
                            placeholder="0,00"
                            value={p.valor}
                            onChange={(valor) => updateContaAPagar(i, 'valor', valor)}
                            className={cn(INPUT_CLASS, 'min-w-0')}
                            disabled={isDisabled || restDisabled}
                          />
                          <button
                            type="button"
                            onClick={() => removeContaAPagar(i)}
                            className="shrink-0 rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                            title={
                              isDisabled
                                ? 'Parcela já paga não pode ser removida'
                                : 'Remover'
                            }
                            disabled={isDisabled || restDisabled}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <p
                    className={cn(
                      'text-xs',
                      somaContasAPagarDiverge ? 'font-medium text-red-600' : 'text-muted-foreground',
                    )}
                  >
                    {somaContasAPagarDiverge ? 'Ajuste: ' : ''}
                    Total contas a pagar: {formatCurrency(totalContasAPagar)}
                    <span className="ml-1.5">
                      ({contasAPagarValidasCount}{' '}
                      {contasAPagarValidasCount === 1 ? 'parcela' : 'parcelas'})
                    </span>
                    <span className="ml-2">Nota: {formatCurrency(valorTotalNotaNum)}</span>
                  </p>
                </div>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              className={BTN_CANCEL}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={restDisabled}
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
