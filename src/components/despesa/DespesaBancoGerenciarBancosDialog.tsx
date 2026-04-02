import { useEffect, useRef, useState } from 'react';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Banco } from '@/types/banco';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
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
import { cn } from '@/lib/cn';
import { Switch } from '@/components/ui/switch';
import { BancoLogo } from './banco';

interface BancoFormState {
  nome: string;
  codigo: string;
  cor: string;
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
  addBanco: (data: { nome: string; codigo?: string; cor: string }) => Promise<unknown>;
  updateBanco: (
    id: string,
    data: Partial<{ nome: string; codigo?: string; cor: string; isActive: boolean; logoUrl: string | null }>,
  ) => Promise<void>;
  uploadBancoLogo: (bancoId: string, file: File) => Promise<void>;
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
  uploadBancoLogo,
  deleteBanco,
  isBancoSaving,
  setIsBancoSaving,
}: DespesaBancoGerenciarBancosDialogProps) {
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const logoBlobRef = useRef<string | null>(null);

  const revokeLogoBlob = () => {
    if (logoBlobRef.current) {
      URL.revokeObjectURL(logoBlobRef.current);
      logoBlobRef.current = null;
    }
  };

  useEffect(() => {
    if (!open) return;
    revokeLogoBlob();
    setLogoFile(null);
    if (editingBanco) {
      setBancoForm({
        nome: editingBanco.nome,
        codigo: editingBanco.codigo || '',
        cor: editingBanco.cor || '#64748B',
      });
      setLogoPreview(editingBanco.logo || '');
    } else {
      setBancoForm({ nome: '', codigo: '', cor: '#64748B' });
      setLogoPreview('');
    }
  }, [open, editingBanco, setBancoForm]);

  useEffect(() => {
    return () => revokeLogoBlob();
  }, []);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      revokeLogoBlob();
      setLogoFile(null);
      setLogoPreview('');
      setEditingBanco(null);
      setBancoForm({ nome: '', codigo: '', cor: '#64748B' });
    }
    onOpenChange(next);
  };

  const onPickLogo = (file: File | undefined) => {
    if (!file) return;
    revokeLogoBlob();
    setLogoFile(file);
    const u = URL.createObjectURL(file);
    logoBlobRef.current = u;
    setLogoPreview(u);
  };

  const onRemoveLogo = () => {
    revokeLogoBlob();
    setLogoFile(null);
    setLogoPreview('');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar bancos</DialogTitle>
            <DialogDescription>
              Adicione, edite ou remova bancos. Ative os bancos que deseja usar nas despesas. Logo enviado para o
              armazenamento em nuvem (GCS).
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
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
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="block w-full text-sm text-slate-600 file:mr-2 file:rounded file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-emerald-700"
                    onChange={(e) => onPickLogo(e.target.files?.[0])}
                  />
                  {logoPreview && (
                    <div className="mt-1 flex items-center gap-2">
                      <img
                        src={logoPreview}
                        alt=""
                        className="h-10 w-10 rounded object-contain bg-white border"
                      />
                      <button
                        type="button"
                        onClick={onRemoveLogo}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remover logo
                      </button>
                    </div>
                  )}
                </div>
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
                              ...(editingBanco.logo && !logoPreview ? { logoUrl: null } : {}),
                            });
                            if (logoFile) {
                              await uploadBancoLogo(editingBanco.id, logoFile);
                            }
                            toast.success('Banco atualizado');
                            revokeLogoBlob();
                            setLogoFile(null);
                            setEditingBanco(null);
                            setBancoForm({ nome: '', codigo: '', cor: '#64748B' });
                            setLogoPreview('');
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
                          revokeLogoBlob();
                          setLogoFile(null);
                          setBancoForm({ nome: '', codigo: '', cor: '#64748B' });
                          setLogoPreview('');
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
                          const created = (await addBanco({
                            nome: bancoForm.nome.trim(),
                            codigo: bancoForm.codigo.trim() || undefined,
                            cor: bancoForm.cor,
                          })) as Banco;
                          if (logoFile && created?.id) {
                            await uploadBancoLogo(created.id, logoFile);
                          }
                          toast.success('Banco adicionado');
                          revokeLogoBlob();
                          setLogoFile(null);
                          setBancoForm({ nome: '', codigo: '', cor: '#64748B' });
                          setLogoPreview('');
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
                  bancosFromApi.map((b) => {
                    const isActive = b.isActive !== false;
                    const isToggling = togglingId === b.id;
                    return (
                      <div
                        key={b.id}
                        className={cn(
                          'flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2',
                          !isActive && 'border-slate-150 bg-slate-50 opacity-90',
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <BancoLogo banco={b} size="sm" />
                          <span className="text-sm font-medium">{b.nome}</span>
                          {b.codigo && <span className="text-xs text-slate-500">({b.codigo})</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          {isToggling ? (
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                          ) : (
                            <Switch
                              checked={isActive}
                              disabled={isToggling}
                              onCheckedChange={async (checked) => {
                                setTogglingId(b.id);
                                try {
                                  await updateBanco(b.id, { isActive: checked });
                                  toast.success(checked ? 'Banco ativado' : 'Banco desativado');
                                } catch (err) {
                                  toast.error(err instanceof Error ? err.message : 'Erro ao atualizar');
                                } finally {
                                  setTogglingId(null);
                                }
                              }}
                            />
                          )}
                          <span className="min-w-16 text-sm text-slate-600">
                            {isActive ? 'Ativo' : 'Inativo'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingBanco(b);
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
                    );
                  })
                )}
              </div>
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteBancoId} onOpenChange={(o) => !o && setDeleteBancoId(null)}>
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
