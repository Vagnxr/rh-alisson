import { useEffect, useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, Plus, Pencil, Trash2, Loader2, Store, Building2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import type { Loja, CreateLojaDTO, UpdateLojaDTO } from '@/types/loja';
import { useLojaStore } from '@/stores/lojaStore';
import { useTenantStore } from '@/stores/tenantStore';
import { LojaForm } from '@/components/loja/LojaForm';
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
import { ExportButtons } from '@/components/ui/export-buttons';
import { cn } from '@/lib/cn';
import { buildTableColumns } from '@/lib/buildTableColumns';

const LOJA_TABLE_DEFAULT_ORDER = ['apelido', 'razaoSocial', 'cnpj', 'endereco', 'contato', 'isAtiva'];

export function LojasPage() {
  const { lojas, columns: columnsFromApi, isLoading, error, addLoja, updateLoja, deleteLoja } = useLojaStore();
  const { currentTenant } = useTenantStore();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLoja, setEditingLoja] = useState<Loja | null>(null);
  const [deleteLojaId, setDeleteLojaId] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');

  // Lojas sao carregadas pelo Header ao montar a area protegida; aqui apenas usamos o store

  // Filtra lojas pelo tenant atual (API pode nao retornar tenantId; nesse caso considera do tenant atual)
  const lojasDoTenant = useMemo(() => {
    if (!currentTenant) return lojas;
    return lojas.filter((l) => l.tenantId === currentTenant.id || l.tenantId == null);
  }, [lojas, currentTenant]);

  const handleOpenDialog = (loja?: Loja) => {
    if (loja) {
      setEditingLoja(loja);
    } else {
      setEditingLoja(null);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingLoja(null);
  };

  const handleSubmit = async (data: CreateLojaDTO | UpdateLojaDTO) => {
    try {
      if (editingLoja) {
        await updateLoja(editingLoja.id, data as UpdateLojaDTO);
        toast.success('Loja atualizada com sucesso!');
      } else {
        await addLoja(data as CreateLojaDTO);
        toast.success('Loja adicionada com sucesso!');
      }
      handleCloseDialog();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar loja';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!deleteLojaId) return;

    try {
      await deleteLoja(deleteLojaId);
      toast.success('Loja excluida com sucesso!');
      setDeleteLojaId(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir loja';
      toast.error(errorMessage);
    }
  };

  const columnDefsByKey = useMemo<Record<string, ColumnDef<Loja>>>(
    () => ({
      apelido: {
        accessorKey: 'apelido',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Apelido
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => {
          const loja = row.original;
          return (
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-emerald-600" />
              <div>
                <div className="font-medium text-slate-900">{loja.apelido}</div>
                {loja.isMatriz && (
                  <span className="inline-flex items-center rounded-full bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                    MATRIZ
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      razaoSocial: {
        accessorKey: 'razaoSocial',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Razao Social
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => {
          const loja = row.original;
          return (
            <div>
              <div className="font-medium text-slate-900">{loja.razaoSocial}</div>
              <div className="text-xs text-slate-500">{loja.nomeFantasia}</div>
            </div>
          );
        },
      },
      cnpj: {
        accessorKey: 'cnpj',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            CNPJ
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">{row.getValue('cnpj')}</span>
        ),
      },
      endereco: {
        accessorKey: 'endereco',
        header: 'Endereco',
        cell: ({ row }) => {
          const endereco = row.original.endereco;
          const text =
            typeof endereco === 'string'
              ? endereco
              : `${(endereco as { cidade?: string; uf?: string }).cidade ?? ''} / ${(endereco as { cidade?: string; uf?: string }).uf ?? ''}`.trim() || '-';
          return (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="text-sm text-slate-600">{text}</span>
            </div>
          );
        },
      },
      contato: {
        accessorKey: 'contato',
        header: 'Contato',
        cell: ({ row }) => {
          const contato = row.original.contato;
          if (typeof contato === 'string') {
            return <span className="text-sm text-slate-600">{contato}</span>;
          }
          const c = contato as { emailPrincipal?: string; telefonePrincipal?: string };
          return (
            <div className="text-sm">
              {c.emailPrincipal && <div className="text-slate-900">{c.emailPrincipal}</div>}
              {c.telefonePrincipal && (
                <div className="text-xs text-slate-500">{c.telefonePrincipal}</div>
              )}
            </div>
          );
        },
      },
      isAtiva: {
        accessorKey: 'isAtiva',
        header: 'Status',
        cell: ({ row }) => {
          const isAtiva = row.getValue('isAtiva') as boolean;
          return (
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                isAtiva ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
              )}
            >
              {isAtiva ? 'Ativa' : 'Inativa'}
            </span>
          );
        },
      },
    }),
    []
  );

  const columns = useMemo(
    () =>
      buildTableColumns<Loja>(
        columnDefsByKey,
        columnsFromApi ?? null,
        LOJA_TABLE_DEFAULT_ORDER,
        {
          id: 'actions',
          header: () => <span className="sr-only">Acoes</span>,
          cell: ({ row }) => {
            const loja = row.original;
            return (
              <div className="flex items-center justify-end gap-1">
                <button
                  className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  title="Editar"
                  onClick={() => handleOpenDialog(loja)}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {!loja.isMatriz && (
                  <button
                    className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    title="Excluir"
                    onClick={() => setDeleteLojaId(loja.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          },
        }
      ),
    [columnDefsByKey, columnsFromApi, handleOpenDialog, setDeleteLojaId]
  );

  const table = useReactTable({
    data: lojasDoTenant,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (isLoading && lojas.length === 0) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Lojas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gerencie as lojas/filiais da empresa
            {currentTenant && (
              <span className="ml-1 font-medium text-slate-700">({currentTenant.name})</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Busca */}
          <input
            type="text"
            placeholder="Buscar lojas..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:w-64"
          />
          {/* Exportacao */}
          <ExportButtons
            data={lojasDoTenant.map((l) => {
              const endereco = l.endereco;
              const contato = l.contato;
              const cidade = typeof endereco === 'string' ? '' : endereco?.cidade ?? '';
              const uf = typeof endereco === 'string' ? '' : endereco?.uf ?? '';
              const email = typeof contato === 'string' ? '' : contato?.emailPrincipal ?? '';
              const telefone = typeof contato === 'string' ? '' : contato?.telefonePrincipal ?? '';
              return {
                apelido: l.apelido,
                razaoSocial: l.razaoSocial,
                nomeFantasia: l.nomeFantasia,
                cnpj: l.cnpj,
                cidade,
                uf,
                email,
                telefone,
                tipo: l.isMatriz ? 'MATRIZ' : 'FILIAL',
                status: l.isAtiva ? 'ATIVA' : 'INATIVA',
              };
            })}
            columns={[
              { key: 'apelido', label: 'Apelido' },
              { key: 'razaoSocial', label: 'Razao Social' },
              { key: 'nomeFantasia', label: 'Nome Fantasia' },
              { key: 'cnpj', label: 'CNPJ' },
              { key: 'cidade', label: 'Cidade' },
              { key: 'uf', label: 'UF' },
              { key: 'email', label: 'E-mail' },
              { key: 'telefone', label: 'Telefone' },
              { key: 'tipo', label: 'Tipo' },
              { key: 'status', label: 'Status' },
            ]}
            filename="lojas"
            title="Relatorio de Lojas"
          />
          <button
            onClick={() => handleOpenDialog()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Loja</span>
          </button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <Store className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total de Lojas</p>
              <p className="text-lg font-bold text-slate-900">{lojasDoTenant.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <Building2 className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Matriz</p>
              <p className="text-lg font-bold text-slate-900">
                {lojasDoTenant.find((l) => l.isMatriz)?.apelido || '-'}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Filiais</p>
              <p className="text-lg font-bold text-slate-900">
                {lojasDoTenant.filter((l) => !l.isMatriz).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-slate-200 bg-white">
        {/* Tabela Desktop */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs uppercase tracking-wider text-slate-500"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-200">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    {globalFilter ? 'Nenhuma loja encontrada' : 'Nenhuma loja cadastrada'}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="whitespace-nowrap px-6 py-4 text-sm text-slate-600"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Lista Mobile */}
        <div className="divide-y divide-slate-200 sm:hidden">
          {table.getRowModel().rows.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-slate-500">
              {globalFilter ? 'Nenhuma loja encontrada' : 'Nenhuma loja cadastrada'}
            </div>
          ) : (
            table.getRowModel().rows.map((row) => {
              const loja = row.original;
              return (
                <div key={row.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Store className="h-4 w-4 text-emerald-600" />
                        <p className="font-medium text-slate-900">{loja.apelido}</p>
                        {loja.isMatriz && (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                            MATRIZ
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{loja.cnpj}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {typeof loja.endereco === 'string'
                          ? loja.endereco
                          : `${loja.endereco?.cidade ?? ''} / ${loja.endereco?.uf ?? ''}`.trim() || '-'}
                      </div>
                    </div>
                    <div className="ml-4 flex gap-1">
                      <button
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        title="Editar"
                        onClick={() => handleOpenDialog(loja)}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {!loja.isMatriz && (
                        <button
                          className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Excluir"
                          onClick={() => setDeleteLojaId(loja.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Dialog Adicionar/Editar */}
      <LojaForm
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        loja={editingLoja || undefined}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />

      {/* Alert Dialog Confirmar Exclusao */}
      <AlertDialog
        open={!!deleteLojaId}
        onOpenChange={(open) => !open && setDeleteLojaId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta loja? Esta acao nao pode ser desfeita.
              Todos os dados vinculados a esta loja serao perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
