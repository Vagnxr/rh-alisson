import { useState } from 'react';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import {
  INPUT_CLASS,
  CATEGORIAS_INICIAIS,
  MODELOS_NOTA_INICIAIS,
  type FormaPagamentoFromApi,
} from './constants';

interface EntradaConfigDialogsProps {
  configDialog: 'modelo' | 'categoria' | 'forma' | null;
  setConfigDialog: (d: 'modelo' | 'categoria' | 'forma' | null) => void;
  modelosNota: string[];
  setModelosNota: React.Dispatch<React.SetStateAction<string[]>>;
  novoModelo: string;
  setNovoModelo: (v: string) => void;
  categorias: { id: string; nome: string }[];
  setCategorias: React.Dispatch<React.SetStateAction<{ id: string; nome: string }[]>>;
  novaCategoria: string;
  setNovaCategoria: (v: string) => void;
  /** Formas de pagamento vindas da API (GET formas-pagamento). */
  formasPagamento: FormaPagamentoFromApi[];
  loadingFormas: boolean;
  novaForma: string;
  setNovaForma: (v: string) => void;
  onAddForma: (nome: string) => Promise<void>;
  onEditForma: (id: string, nome: string) => Promise<void>;
  onDeleteForma: (id: string) => Promise<void>;
  slugify: (s: string) => string;
}

export function EntradaConfigDialogs({
  configDialog,
  setConfigDialog,
  modelosNota,
  setModelosNota,
  novoModelo,
  setNovoModelo,
  categorias,
  setCategorias,
  novaCategoria,
  setNovaCategoria,
  formasPagamento,
  loadingFormas,
  novaForma,
  setNovaForma,
  onAddForma,
  onEditForma,
  onDeleteForma,
  slugify,
}: EntradaConfigDialogsProps) {
  const [editingFormaId, setEditingFormaId] = useState<string | null>(null);
  const [editingFormaNome, setEditingFormaNome] = useState('');
  return (
    <>
      <Dialog open={configDialog === 'modelo'} onOpenChange={o => !o && setConfigDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modelos de nota</DialogTitle>
            <DialogDescription>Adicione ou remova modelos (NF-e, NFC-e, etc.).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ex: NF-e"
                value={novoModelo}
                onChange={e => setNovoModelo(e.target.value)}
                className={INPUT_CLASS}
              />
              <button
                type="button"
                onClick={() => {
                  const t = novoModelo.trim();
                  if (!t) return;
                  if (modelosNota.includes(t)) {
                    toast.error('Ja existe.');
                    return;
                  }
                  setModelosNota(prev => [...prev, t]);
                  setNovoModelo('');
                }}
                className="h-10 shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Adicionar
              </button>
            </div>
            <ul className="max-h-40 space-y-1 overflow-y-auto">
              {[...modelosNota]
                .sort((a, b) => a.localeCompare(b, 'pt-BR'))
                .map(m => {
                  const isPadrao = MODELOS_NOTA_INICIAIS.includes(m);
                  return (
                    <li
                      key={m}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                    >
                      <span className="text-sm">{m}</span>
                      <button
                        type="button"
                        disabled={isPadrao}
                        onClick={() =>
                          !isPadrao && setModelosNota(prev => prev.filter(x => x !== m))
                        }
                        className={cn(
                          'rounded p-1.5',
                          isPadrao
                            ? 'cursor-not-allowed text-slate-300'
                            : 'text-slate-400 hover:bg-red-50 hover:text-red-600',
                        )}
                        title={isPadrao ? 'Padrao do sistema nao pode ser removido' : 'Remover'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={configDialog === 'categoria'} onOpenChange={o => !o && setConfigDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Categorias</DialogTitle>
            <DialogDescription>
              Adicione ou remova categorias (Industrializacao, Embalagem, etc.).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ex: Embalagem"
                value={novaCategoria}
                onChange={e => setNovaCategoria(e.target.value)}
                className={INPUT_CLASS}
              />
              <button
                type="button"
                onClick={() => {
                  const t = novaCategoria.trim();
                  if (!t) return;
                  const id = slugify(t);
                  if (categorias.some(c => c.id === id)) {
                    toast.error('Ja existe.');
                    return;
                  }
                  setCategorias(prev => [...prev, { id, nome: t }]);
                  setNovaCategoria('');
                }}
                className="h-10 shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Adicionar
              </button>
            </div>
            <ul className="max-h-40 space-y-1 overflow-y-auto">
              {[...categorias]
                .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                .map(c => {
                  const isPadrao = CATEGORIAS_INICIAIS.some(x => x.id === c.id);
                  return (
                    <li
                      key={c.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                    >
                      <span className="text-sm">{c.nome}</span>
                      <button
                        type="button"
                        disabled={isPadrao}
                        onClick={() =>
                          !isPadrao && setCategorias(prev => prev.filter(x => x.id !== c.id))
                        }
                        className={cn(
                          'rounded p-1.5',
                          isPadrao
                            ? 'cursor-not-allowed text-slate-300'
                            : 'text-slate-400 hover:bg-red-50 hover:text-red-600',
                        )}
                        title={isPadrao ? 'Padrao do sistema nao pode ser removido' : 'Remover'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={configDialog === 'forma'} onOpenChange={o => !o && setConfigDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Formas de pagamento</DialogTitle>
            <DialogDescription>
              Formas padrao (Boleto, PIX, Dinheiro) nao podem ser editadas nem excluidas. Adicione
              formas customizadas (ex.: Cartao).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ex: Cartao"
                value={novaForma}
                onChange={e => setNovaForma(e.target.value)}
                className={INPUT_CLASS}
              />
              <button
                type="button"
                disabled={loadingFormas}
                onClick={async () => {
                  const t = novaForma.trim();
                  if (!t) return;
                  if (formasPagamento.some(x => x.nome.toLowerCase() === t.toLowerCase())) {
                    toast.error('Ja existe uma forma com esse nome.');
                    return;
                  }
                  await onAddForma(t);
                  setNovaForma('');
                }}
                className="h-10 shrink-0 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {loadingFormas ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Adicionar'}
              </button>
            </div>
            {loadingFormas && formasPagamento.length === 0 ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : (
              <ul className="max-h-40 space-y-1 overflow-y-auto">
                {[...formasPagamento]
                  .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                  .map(f => {
                    const isDefault = f.isDefault;
                    const isEditing = editingFormaId === f.id;
                    return (
                      <li
                        key={f.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
                      >
                        {isEditing ? (
                          <>
                            <input
                              type="text"
                              value={editingFormaNome}
                              onChange={e => setEditingFormaNome(e.target.value)}
                              className={cn(INPUT_CLASS, 'min-w-0 flex-1')}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                const nome = editingFormaNome.trim();
                                if (!nome) return;
                                await onEditForma(f.id, nome);
                                setEditingFormaId(null);
                                setEditingFormaNome('');
                              }}
                              className="shrink-0 rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                            >
                              Salvar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingFormaId(null);
                                setEditingFormaNome('');
                              }}
                              className="shrink-0 rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="text-sm">
                              {f.nome}
                              {isDefault && (
                                <span className="ml-1.5 text-xs text-slate-400">(padrao)</span>
                              )}
                            </span>
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                disabled={isDefault}
                                onClick={() => {
                                  if (!isDefault) {
                                    setEditingFormaId(f.id);
                                    setEditingFormaNome(f.nome);
                                  }
                                }}
                                className={cn(
                                  'rounded p-1.5',
                                  isDefault
                                    ? 'cursor-not-allowed text-slate-300'
                                    : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600',
                                )}
                                title={isDefault ? 'Forma padrao nao pode ser editada' : 'Editar'}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                disabled={isDefault}
                                onClick={async () => {
                                  if (!isDefault) await onDeleteForma(f.id);
                                }}
                                className={cn(
                                  'rounded p-1.5',
                                  isDefault
                                    ? 'cursor-not-allowed text-slate-300'
                                    : 'text-slate-400 hover:bg-red-50 hover:text-red-600',
                                )}
                                title={isDefault ? 'Forma padrao nao pode ser excluida' : 'Excluir'}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
