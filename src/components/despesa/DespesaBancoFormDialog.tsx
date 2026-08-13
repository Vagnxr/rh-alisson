import { Plus, Loader2 } from 'lucide-react';
import type { Banco } from '@/types/banco';
import { DateInput } from '@/components/ui/date-input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BancoSelector } from './banco';

export interface DespesaBancoFormData {
  data: string;
  tipo: string;
  descricao: string;
  valor: string;
  bancoId: string;
  comunicarAgenda: boolean;
}

interface DespesaBancoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: { id: string } | null;
  formData: DespesaBancoFormData;
  setFormData: (d: DespesaBancoFormData | ((p: DespesaBancoFormData) => DespesaBancoFormData)) => void;
  selectedBanco: Banco | null;
  bancos: Banco[];
  tiposDisponiveis: string[];
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isLoading: boolean;
  onOpenTipos: () => void;
}

export function DespesaBancoFormDialog({
  open,
  onOpenChange,
  editingItem,
  formData,
  setFormData,
  selectedBanco,
  bancos,
  tiposDisponiveis,
  onSubmit,
  onClose,
  isLoading,
  onOpenTipos,
}: DespesaBancoFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingItem ? 'Editar Registro' : 'Novo Registro'}</DialogTitle>
          <DialogDescription>
            {editingItem
              ? 'Altere os dados do registro.'
              : 'Preencha os dados do novo registro.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody>
          <div className="space-y-4 py-4">
            {!selectedBanco && (
              <BancoSelector
                value={formData.bancoId || ''}
                onChange={(bancoId) => setFormData({ ...formData, bancoId })}
                bancos={bancos}
              />
            )}
            {selectedBanco && (
              <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
                Banco: <span className="font-medium">{selectedBanco.nome}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="data" className="text-sm font-medium text-foreground">
                  Data <span className="text-red-500">*</span>
                </label>
                <DateInput
                  value={formData.data}
                  onChange={(v) => setFormData({ ...formData, data: v })}
                  className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="tipo" className="text-sm font-medium text-foreground">
                  Tipo <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-1">
                  {/* Select do design system: o nativo herdava o realce azul do
                      SO e nao respeitava o tema escuro. */}
                  <Select
                    value={formData.tipo || undefined}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger
                      id="tipo"
                      className="min-w-0 flex-1 uppercase"
                      data-testid="despesa-categoria-tipo"
                    >
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposDisponiveis.map((tipo) => (
                        <SelectItem key={tipo} value={tipo} className="uppercase">
                          {tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    onClick={onOpenTipos}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted/40 hover:text-emerald-600"
                    title="Adicionar ou gerenciar tipos"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="descricao" className="text-sm font-medium text-foreground">
                Descricao
              </label>
              <input
                id="descricao"
                type="text"
                placeholder="Ex: Tarifa mensal, TED, DOC..."
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value.toUpperCase() })
                }
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 uppercase"
                data-testid="despesa-categoria-descricao"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="valor" className="text-sm font-medium text-foreground">
                Valor (R$) <span className="text-red-500">*</span>
              </label>
              <CurrencyInput
                id="valor"
                placeholder="0,00"
                value={formData.valor ?? ''}
                onChange={(valor) => setFormData({ ...formData, valor })}
                className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                required
                testId="despesa-categoria-valor"
              />
            </div>
          </div>
          </DialogBody>

          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              data-testid="despesa-categoria-cancelar"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              data-testid="despesa-categoria-submit"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingItem ? 'Salvar' : 'Adicionar'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
