import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
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
import { api } from '@/lib/api';
import { formatDateToLocalYYYYMMDD } from '@/lib/date';
import { DateInput } from '@/components/ui/date-input';
import { cn } from '@/lib/cn';
import { PAGE_TITLE, PAGE_SUBTITLE, INPUT_CLASS } from '@/lib/uiClasses';

export interface ItemPedido {
  id: string;
  qtde: string;
  und: string;
  descricao: string;
  unit: string;
  total: string;
  percent: string;
}

export interface PedidoVenda {
  id: string;
  nomeEmpresa: string;
  numeroPedido: string;
  dataPedido: string;
  comprador: string;
  comercio: string;
  escopo: string;
  formaPgto: string;
  codigo: string;
  razaoSocial: string;
  cnpj: string;
  inscEstadual: string;
  inscMun: string;
  telefone: string;
  celular: string;
  endereco: string;
  cep: string;
  municipioUf: string;
  email: string;
  contato: string;
  obs: string;
  itens: ItemPedido[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function parseNum(v: string): number {
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

const emptyItem = (): ItemPedido => ({
  id: crypto.randomUUID(),
  qtde: '',
  und: '',
  descricao: '',
  unit: '',
  total: '',
  percent: '',
});

function defaultPedido(): PedidoVenda {
  const hoje = formatDateToLocalYYYYMMDD(new Date());
  return {
    id: '',
    nomeEmpresa: '',
    numeroPedido: '',
    dataPedido: hoje,
    comprador: '',
    comercio: '',
    escopo: '',
    formaPgto: 'BOLETO',
    codigo: '',
    razaoSocial: '',
    cnpj: '',
    inscEstadual: '',
    inscMun: '',
    telefone: '',
    celular: '',
    endereco: '',
    cep: '',
    municipioUf: '',
    email: '',
    contato: '',
    obs: '',
    itens: [emptyItem(), emptyItem()],
  };
}

const inputClass = cn(INPUT_CLASS, 'h-9 px-2 py-1.5');

export function PedidoVendaPage() {
  const [pedidos, setPedidos] = useState<PedidoVenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<PedidoVenda>(defaultPedido());

  const fetchList = useCallback(() => {
    setLoading(true);
    api
      .get<PedidoVenda[]>('financeiro/pedidos-venda')
      .then((res) => setPedidos(Array.isArray(res.data) ? res.data : []))
      .catch((err) => toast.error(err?.message ?? 'Erro ao carregar pedidos'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const totalGeral = form.itens.reduce((acc, i) => acc + parseNum(i.total), 0);
  const proximoNumero = pedidos.length > 0
    ? String(Math.max(...pedidos.map((p) => parseInt(p.numeroPedido, 10) || 0)) + 1)
    : '1';

  const handleNovo = () => {
    setEditingId(null);
    setForm({
      ...defaultPedido(),
      numeroPedido: String((pedidos.length ? Math.max(...pedidos.map((p) => parseInt(p.numeroPedido, 10) || 0)) : 0) + 1),
      itens: [emptyItem(), emptyItem()],
    });
    toast.success('Novo pedido em branco.');
  };

  const handleSalvar = () => {
    const dataPedido = form.dataPedido.slice(0, 10);
    const payload = { ...form, dataPedido, itens: form.itens };
    if (editingId) {
      api
        .patch<PedidoVenda>(`financeiro/pedidos-venda/${editingId}`, payload)
        .then(() => {
          toast.success('Pedido atualizado.');
          fetchList();
          setEditingId(null);
          setForm({ ...defaultPedido(), numeroPedido: proximoNumero, itens: [emptyItem(), emptyItem()] });
        })
        .catch((err) => toast.error(err?.message ?? 'Erro ao atualizar'));
    } else {
      api
        .post<PedidoVenda>('financeiro/pedidos-venda', payload)
        .then((res) => {
          toast.success('Pedido salvo.');
          setPedidos((prev) => [...prev, res.data]);
          setEditingId(null);
          setForm({ ...defaultPedido(), numeroPedido: String(parseInt(proximoNumero, 10) + 1), itens: [emptyItem(), emptyItem()] });
        })
        .catch((err) => toast.error(err?.message ?? 'Erro ao criar'));
    }
  };

  const handleEditar = (p: PedidoVenda) => {
    setLoadingDetail(true);
    api
      .get<PedidoVenda>(`financeiro/pedidos-venda/${p.id}`)
      .then((res) => {
        const full = res.data;
        setForm({ ...full, itens: full.itens?.length ? full.itens : [emptyItem(), emptyItem()] });
        setEditingId(full.id);
      })
      .catch((err) => toast.error(err?.message ?? 'Erro ao carregar pedido'))
      .finally(() => setLoadingDetail(false));
  };

  const handleExcluir = () => {
    if (!deleteId) return;
    api
      .delete(`financeiro/pedidos-venda/${deleteId}`)
      .then(() => {
        setPedidos((prev) => prev.filter((p) => p.id !== deleteId));
        if (editingId === deleteId) {
          setEditingId(null);
          setForm(defaultPedido());
        }
        setDeleteId(null);
        toast.success('Pedido excluido.');
      })
      .catch((err) => toast.error(err?.message ?? 'Erro ao excluir'));
  };

  const updateForm = (updates: Partial<PedidoVenda>) => setForm((f) => ({ ...f, ...updates }));

  const updateItem = (index: number, updates: Partial<ItemPedido>) => {
    setForm((f) => ({
      ...f,
      itens: f.itens.map((item, i) => (i === index ? { ...item, ...updates } : item)),
    }));
  };

  const addItem = () => {
    setForm((f) => ({ ...f, itens: [...f.itens, emptyItem()] }));
  };

  const removeItem = (index: number) => {
    if (form.itens.length <= 1) return;
    setForm((f) => ({ ...f, itens: f.itens.filter((_, i) => i !== index) }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={PAGE_TITLE}>Pedido de Venda</h1>
          <p className={PAGE_SUBTITLE}>
            Formulario de pedido com dados do fornecedor e itens. Salve para listar; edite ou exclua na lista.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleNovo}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40"
          >
            <Plus className="h-4 w-4" />
            Novo
          </button>
          <button
            type="button"
            onClick={handleSalvar}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            {editingId ? 'Atualizar' : 'Salvar'} pedido
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-6 space-y-6 max-w-5xl">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase">Nome da empresa</label>
              <input
                type="text"
                value={form.nomeEmpresa}
                onChange={(e) => updateForm({ nomeEmpresa: e.target.value })}
                placeholder="(preencher)"
                className={inputClass}
              />
            </div>
            <div className="flex flex-wrap items-center gap-4 justify-end">
              <div>
                <label className="block text-xs text-muted-foreground">Numero do Pedido</label>
                <input
                  type="text"
                  value={form.numeroPedido}
                  onChange={(e) => updateForm({ numeroPedido: e.target.value })}
                  className="w-20 rounded border border-border px-2 py-1 text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground">Data do Pedido</label>
                <DateInput
                  value={form.dataPedido}
                  onChange={(v) => updateForm({ dataPedido: v })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase">Comprador</label>
              <input type="text" value={form.comprador} onChange={(e) => updateForm({ comprador: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase">Comercio</label>
              <input type="text" value={form.comercio} onChange={(e) => updateForm({ comercio: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase">Escopo</label>
            <input type="text" value={form.escopo} onChange={(e) => updateForm({ escopo: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase">Forma PGTO</label>
            <input type="text" value={form.formaPgto} onChange={(e) => updateForm({ formaPgto: e.target.value })} className={inputClass} />
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Dados do Fornecedor</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm md:grid-cols-4">
              {[
                { key: 'codigo', label: 'Codigo' },
                { key: 'razaoSocial', label: 'Razao Social' },
                { key: 'cnpj', label: 'CNPJ' },
                { key: 'inscEstadual', label: 'Insc. Estadual' },
                { key: 'inscMun', label: 'Insc. Mun.' },
                { key: 'telefone', label: 'Telefone' },
                { key: 'celular', label: 'Celular' },
                { key: 'endereco', label: 'Endereco' },
                { key: 'cep', label: 'CEP' },
                { key: 'municipioUf', label: 'Mun. / UF' },
                { key: 'email', label: 'Email' },
                { key: 'contato', label: 'Contato' },
                { key: 'obs', label: 'OBS' },
              ].map(({ key, label }) => (
                <div key={key} className={key === 'razaoSocial' || key === 'endereco' || key === 'obs' ? 'col-span-2 md:col-span-3' : ''}>
                  <label className="block text-xs text-muted-foreground">{label}</label>
                  <input
                    type="text"
                    value={form[key as keyof PedidoVenda] as string}
                    onChange={(e) => updateForm({ [key]: e.target.value } as Partial<PedidoVenda>)}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">Itens</h3>
              <button type="button" onClick={addItem} className="text-xs text-emerald-600 hover:underline">
                + Adicionar item
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-medium uppercase text-muted-foreground w-12">ITEM</th>
                    <th className="px-2 py-2 text-left text-xs font-medium uppercase text-muted-foreground w-20">QTDE</th>
                    <th className="px-2 py-2 text-left text-xs font-medium uppercase text-muted-foreground w-14">UND</th>
                    <th className="px-2 py-2 text-left text-xs font-medium uppercase text-muted-foreground">DESCRICAO</th>
                    <th className="px-2 py-2 text-right text-xs font-medium uppercase text-muted-foreground w-24">UNIT (R$)</th>
                    <th className="px-2 py-2 text-right text-xs font-medium uppercase text-muted-foreground w-24">TOTAL (R$)</th>
                    <th className="px-2 py-2 text-right text-xs font-medium uppercase text-muted-foreground w-16">%</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {form.itens.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-muted/40">
                      <td className="px-2 py-2 font-medium text-foreground">{idx + 1}</td>
                      <td className="px-2 py-2">
                        <input type="text" value={item.qtde} onChange={(e) => updateItem(idx, { qtde: e.target.value })} className="w-full rounded border border-border px-1.5 py-1 text-sm" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="text" value={item.und} onChange={(e) => updateItem(idx, { und: e.target.value })} className="w-full rounded border border-border px-1.5 py-1 text-sm" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="text" value={item.descricao} onChange={(e) => updateItem(idx, { descricao: e.target.value })} className="w-full rounded border border-border px-1.5 py-1 text-sm" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="text" value={item.unit} onChange={(e) => updateItem(idx, { unit: e.target.value })} className="w-full rounded border border-border px-1.5 py-1 text-sm text-right" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="text" value={item.total} onChange={(e) => updateItem(idx, { total: e.target.value })} className="w-full rounded border border-border px-1.5 py-1 text-sm text-right" />
                      </td>
                      <td className="px-2 py-2">
                        <input type="text" value={item.percent} onChange={(e) => updateItem(idx, { percent: e.target.value })} className="w-full rounded border border-border px-1.5 py-1 text-sm text-right" />
                      </td>
                      <td className="px-2 py-2">
                        <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 text-xs" title="Remover item">
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted">
                  <tr>
                    <td colSpan={5} className="px-2 py-2 text-right text-sm font-semibold text-foreground">Total:</td>
                    <td className="px-2 py-2 text-right font-bold text-foreground">{formatCurrency(totalGeral)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border bg-muted/40 px-4 py-2">
          <h2 className="text-sm font-semibold text-foreground">Pedidos salvos</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pedidos.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhum pedido salvo.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Numero</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Data</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Comprador</th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase text-muted-foreground">Total</th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase text-muted-foreground w-24">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pedidos.map((p) => {
                  const total = (p.itens ?? []).reduce((acc, i) => acc + parseNum(i.total), 0);
                  return (
                    <tr key={p.id} className="hover:bg-muted/40">
                      <td className="px-4 py-2 font-medium text-foreground">{p.numeroPedido}</td>
                      <td className="px-4 py-2 text-foreground">{p.dataPedido?.slice?.(0, 10) ?? p.dataPedido}</td>
                      <td className="px-4 py-2 text-foreground">{p.comprador || '-'}</td>
                      <td className="px-4 py-2 text-right font-medium text-foreground">{formatCurrency(total)}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-muted-foreground" title="Editar" onClick={() => handleEditar(p)}>
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button type="button" className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-red-600" title="Excluir" onClick={() => setDeleteId(p.id)}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este pedido? Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluir}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
