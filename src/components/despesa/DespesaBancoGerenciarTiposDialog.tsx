import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface TipoItem {
  label: string;
  id?: string;
}

interface DespesaBancoGerenciarTiposDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  novoTipoLabel: string;
  setNovoTipoLabel: (v: string) => void;
  tiposParaListar: TipoItem[];
  addTipo: (contexto: string, label: string) => Promise<unknown>;
  deleteTipo: (id: string) => Promise<void>;
}

export function DespesaBancoGerenciarTiposDialog({
  open,
  onOpenChange,
  novoTipoLabel,
  setNovoTipoLabel,
  tiposParaListar,
  addTipo,
  deleteTipo,
}: DespesaBancoGerenciarTiposDialogProps) {
  const handleAdd = () => {
    const label = novoTipoLabel.trim().toUpperCase();
    if (!label) return;
    addTipo('despesa-banco', label)
      .then(() => {
        setNovoTipoLabel('');
        toast.success('Tipo adicionado.');
      })
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : 'Erro ao adicionar tipo')
      );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar tipos</DialogTitle>
          <DialogDescription>
            Adicione ou remova tipos de despesa bancaria. Tipos padrao nao podem ser excluidos.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nome do tipo"
              value={novoTipoLabel}
              onChange={(e) => setNovoTipoLabel(e.target.value.trim().toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (novoTipoLabel.trim()) handleAdd();
                }
              }}
              className="flex flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm uppercase placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            />
            <button
              type="button"
              disabled={!novoTipoLabel.trim()}
              onClick={handleAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Adicionar
            </button>
          </div>
          <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
            {tiposParaListar.length === 0 ? (
              <li className="py-4 text-center text-sm text-slate-500">Nenhum tipo. Adicione acima.</li>
            ) : (
              tiposParaListar.map((t) => (
                <li
                  key={t.id ?? t.label}
                  className="flex items-center justify-between rounded bg-white px-3 py-2 text-sm text-slate-800"
                >
                  <span>{t.label}</span>
                  {t.id ? (
                    <button
                      type="button"
                      onClick={() => {
                        deleteTipo(t.id!)
                          .then(() => toast.success('Tipo removido.'))
                          .catch((err) =>
                            toast.error(err instanceof Error ? err.message : 'Erro ao remover')
                          );
                      }}
                      className="rounded p-1 text-red-600 hover:bg-red-50"
                      title="Excluir tipo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
