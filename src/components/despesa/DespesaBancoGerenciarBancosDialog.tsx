import { useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Banco } from '@/types/banco';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BancoLogo } from './banco';

interface BancoFormState {
  nome: string;
  codigo: string;
  cor: string;
  logo: string;
}

interface DespesaBancoGerenciarBancosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBanco: Banco | null;
  setEditingBanco: (b: Banco | null) => void;
  bancoForm: BancoFormState;
  setBancoForm: (f: BancoFormState | ((prev: BancoFormState) => BancoFormState)) => void;
  deleteBancoId: string | null;
  setDeleteBancoId: (id: string | null) => void;
  bancosFromApi: Banco[];
  addBanco: (data: { nome: string; codigo?: string; cor: string; logo?: string }) => Promise<unknown>;
  updateBanco: (id: string, data: { nome: string; codigo?: string; cor: string; logo?: string }) => Promise<void>;
  deleteBanco: (id: string) => Promise<void>;
  isBancoSaving: boolean;
  setIsBancoSaving: (v: boolean) => void;
}

export function DespesaBancoGerenciarBancosDialog({
  open,
  onOpenChange,
  editingBanco,
  setEditingBanco,
  bancoForm,
  setBancoForm,
  deleteBancoId,
  setDeleteBancoId,
  bancosFromApi,
  addBanco,
  updateBanco,
  deleteBanco,
  isBancoSaving,
  setIsBancoSaving,
}: DespesaBancoGerenciarBancosDialogProps) {
  useEffect(() => {
    if (!open) return;
    if (editingBanco) {
      setBancoForm({
        nome: editingBanco.nome,
        codigo: editingBanco.codigo || '',
        cor: editingBanco.cor || '#64748B',
        logo: editingBanco.logo || '',
      });
    } else {
      setBancoForm({ nome: '', codigo: '', cor: '#64748B', logo: '' });
    }
  }, [open, editingBanco, setBancoForm]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setEditingBanco(null);
      setBancoForm({ nome: '', codigo: '', cor: '#64748B', logo: '' });
    }
    onOpenChange(next);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar bancos</DialogTitle>
            <DialogDescription>
              Adicione, edite ou remova bancos. Bancos padrao aparecem quando nao ha nenhum cadastrado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
              <p className="text-sm font-medium text-slate-700">
                {editingBanco ? 'Editar banco' : 'Novo banco'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nome"
                  value={bancoForm.nome}
                  onChange={(e) => setBancoForm((f) => ({ ...f, nome: e.target.value.toUpperCase() }))}
                  className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
                />
                <input
                  type="text"
                  placeholder="Codigo (opcional)"
                  value={bancoForm.codigo}
                  onChange={(e) => setBancoForm((f) => ({ ...f, codigo: e.target.value }))}
                  className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
                />
              </div>
              {editingBanco && (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-600">Cor:</label>
                    <input
                      type="color"
                      value={bancoForm.cor}
                      onChange={(e) => setBancoForm((f) => ({ ...f, cor: e.target.value }))}
                      className="h-8 w-14 cursor-pointer rounded border border-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-slate-600">Logo (upload):</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="block w-full text-sm text-slate-600 file:mr-2 file:rounded file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-emerald-700"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () =>
                          setBancoForm((f) => ({ ...f, logo: String(reader.result ?? '') }));
                        reader.readAsDataURL(file);
                      }}
                    />
                    {bancoForm.logo && (
                      <div className="mt-1 flex items-center gap-2">
                        <img
                          src={bancoForm.logo}
                          alt=""
                          className="h-10 w-10 rounded object-contain bg-white border"
                        />
                        <button
                          type="button"
                          onClick={() => setBancoForm((f) => ({ ...f, logo: '' }))}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remover logo
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
              <div className="flex gap-2">
                {editingBanco ? (
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!bancoForm.nome.trim()) {
                          toast.error('Nome e obrigatorio');
                          return;
                        }
                        setIsBancoSaving(true);
                        try {
                          await updateBanco(editingBanco.id, {
                            nome: bancoForm.nome.trim(),
                            codigo: bancoForm.codigo.trim() || undefined,
                            cor: bancoForm.cor,
                            logo: bancoForm.logo || undefined,
                          });
                          toast.success('Banco atualizado');
                          setEditingBanco(null);
                          setBancoForm({ nome: '', codigo: '', cor: '#64748B', logo: '' });
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Erro ao atualizar');
                        } finally {
                          setIsBancoSaving(false);
                        }
                      }}
                      disabled={isBancoSaving}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBanco(null);
                        setBancoForm({ nome: '', codigo: '', cor: '#64748B', logo: '' });
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!bancoForm.nome.trim()) {
                        toast.error('Nome e obrigatorio');
                        return;
                      }
                      setIsBancoSaving(true);
                      try {
                        await addBanco({
                          nome: bancoForm.nome.trim(),
                          codigo: bancoForm.codigo.trim() || undefined,
                          cor: bancoForm.cor,
                          logo: bancoForm.logo || undefined,
                        });
                        toast.success('Banco adicionado');
                        setBancoForm({ nome: '', codigo: '', cor: '#64748B', logo: '' });
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : 'Erro ao adicionar');
                      } finally {
                        setIsBancoSaving(false);
                      }
                    }}
                    disabled={isBancoSaving}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Adicionar
                  </button>
                )}
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {bancosFromApi.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum banco cadastrado. Adicione um acima.</p>
              ) : (
                bancosFromApi.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <BancoLogo banco={b} size="sm" />
                      <span className="text-sm font-medium">{b.nome}</span>
                      {b.codigo && (
                        <span className="text-xs text-slate-500">({b.codigo})</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBanco(b);
                          setBancoForm({
                            nome: b.nome,
                            codigo: b.codigo || '',
                            cor: b.cor || '#64748B',
                            logo: b.logo || '',
                          });
                        }}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteBancoId(b.id)}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteBancoId} onOpenChange={(open) => !open && setDeleteBancoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir banco</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este banco? Despesas vinculadas podem ficar sem banco.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteBancoId) return;
                try {
                  await deleteBanco(deleteBancoId);
                  toast.success('Banco excluido');
                  setDeleteBancoId(null);
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Erro ao excluir');
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
