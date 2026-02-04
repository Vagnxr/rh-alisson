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
import { ArrowUpDown, Plus, Pencil, Trash2, Loader2, Building2, User } from 'lucide-react';
import { toast } from 'sonner';
import type { Fornecedor } from '@/types/fornecedor';
import { useFornecedorStore } from '@/stores/fornecedorStore';
import { FornecedorForm } from '@/components/fornecedor/FornecedorForm';
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
import type { CreateFornecedorDto, UpdateFornecedorDto } from '@/types/fornecedor';

const FORNECEDOR_TABLE_DEFAULT_ORDER = ['tipo', 'nome', 'documento', 'contatoEmpresa', 'endereco', 'isAtivo'];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR');
}

export function FornecedoresPage() {
  const {
    fornecedores,
    columns: columnsFromApi,
    isLoading,
    fetchFornecedores,
    addFornecedor,
    updateFornecedor,
    deleteFornecedor,
  } = useFornecedorStore();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);
  const [deleteFornecedorId, setDeleteFornecedorId] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');

  useEffect(() => {
    fetchFornecedores();
  }, [fetchFornecedores]);

  const handleOpenDialog = (fornecedor?: Fornecedor) => {
    if (fornecedor) {
      setEditingFornecedor(fornecedor);
    } else {
      setEditingFornecedor(null);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingFornecedor(null);
  };

  const handleSubmit = async (data: CreateFornecedorDto | UpdateFornecedorDto) => {
    try {
      if (editingFornecedor) {
        await updateFornecedor(editingFornecedor.id, data as UpdateFornecedorDto);
        toast.success('Fornecedor atualizado com sucesso!');
      } else {
        await addFornecedor(data as CreateFornecedorDto);
        toast.success('Fornecedor adicionado com sucesso!');
      }
      handleCloseDialog();
    } catch (error) {
      toast.error('Erro ao salvar fornecedor');
    }
  };

  const handleDelete = async () => {
    if (!deleteFornecedorId) return;

    try {
      await deleteFornecedor(deleteFornecedorId);
      toast.success('Fornecedor excluído com sucesso!');
      setDeleteFornecedorId(null);
    } catch (error) {
      toast.error('Erro ao excluir fornecedor');
    }
  };

  const columnDefsByKey = useMemo<Record<string, ColumnDef<Fornecedor>>>(
    () => ({
      tipo: {
        accessorKey: 'tipo',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Tipo
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => {
          const tipo = row.getValue('tipo') as string;
          return (
            <div className="flex items-center gap-2">
              {tipo === 'cnpj' ? (
                <Building2 className="h-4 w-4 text-slate-400" />
              ) : (
                <User className="h-4 w-4 text-slate-400" />
              )}
              <span className="text-sm text-slate-600">{tipo.toUpperCase()}</span>
            </div>
          );
        },
      },
      nome: {
        accessorFn: (row) => (row.tipo === 'cnpj' ? row.razaoSocial : row.nomeCompleto),
        id: 'nome',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Nome / Razao Social
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => {
          const fornecedor = row.original;
          if (fornecedor.tipo === 'cnpj') {
            return (
              <div>
                <div className="font-medium text-slate-900">{fornecedor.razaoSocial}</div>
                <div className="text-xs text-slate-500">{fornecedor.nomeFantasia}</div>
              </div>
            );
          }
          return (
            <div>
              <div className="font-medium text-slate-900">{fornecedor.nomeCompleto}</div>
              {fornecedor.nomeComercial && (
                <div className="text-xs text-slate-500">{fornecedor.nomeComercial}</div>
              )}
            </div>
          );
        },
      },
      documento: {
        accessorFn: (row) => (row.tipo === 'cnpj' ? row.cnpj : row.cpf),
        id: 'documento',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Documento
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => {
          const fornecedor = row.original;
          return <span className="text-sm text-slate-600">{fornecedor.tipo === 'cnpj' ? fornecedor.cnpj : fornecedor.cpf}</span>;
        },
      },
      contatoEmpresa: {
        accessorKey: 'contatoEmpresa',
        header: 'Contato',
        cell: ({ row }) => {
          const contato = row.original.contatoEmpresa;
          return (
            <div className="text-sm">
              <div className="text-slate-900">{contato.emailPrincipal}</div>
              {contato.telefonePrincipal && (
                <div className="text-xs text-slate-500">{contato.telefonePrincipal}</div>
              )}
            </div>
          );
        },
      },
      endereco: {
        accessorKey: 'endereco',
        header: 'Cidade / UF',
        cell: ({ row }) => {
          const endereco = row.original.endereco;
          return (
            <span className="text-sm text-slate-600">
              {endereco.cidade} / {endereco.uf}
            </span>
          );
        },
      },
      isAtivo: {
        accessorKey: 'isAtivo',
        header: 'Status',
        cell: ({ row }) => {
          const isAtivo = row.getValue('isAtivo') as boolean;
          return (
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                isAtivo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
              )}
            >
              {isAtivo ? 'Ativo' : 'Inativo'}
            </span>
          );
        },
      },
    }),
    []
  );

  const columns = useMemo(
    () =>
      buildTableColumns<Fornecedor>(
        columnDefsByKey,
        columnsFromApi ?? null,
        FORNECEDOR_TABLE_DEFAULT_ORDER,
        {
          id: 'actions',
          header: () => <span className="sr-only">Acoes</span>,
          cell: ({ row }) => (
            <div className="flex items-center justify-end gap-1">
              <button
                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                title="Editar"
                onClick={() => handleOpenDialog(row.original)}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                title="Excluir"
                onClick={() => setDeleteFornecedorId(row.original.id)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ),
        }
      ),
    [columnDefsByKey, columnsFromApi]
  );

  const table = useReactTable({
    data: fornecedores,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (isLoading && fornecedores.length === 0) {
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
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Fornecedores</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gerencie seus fornecedores (CNPJ e CPF)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Busca */}
          <input
            type="text"
            placeholder="Buscar fornecedores..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:w-64"
          />
          {/* Exportação */}
          <ExportButtons
            data={fornecedores.map((f) => ({
              tipo: f.tipo.toUpperCase(),
              nome: f.tipo === 'cnpj' ? f.razaoSocial : f.nomeCompleto,
              documento: f.tipo === 'cnpj' ? f.cnpj : f.cpf,
              email: f.contatoEmpresa.emailPrincipal,
              telefone: f.contatoEmpresa.telefonePrincipal || '',
              cidade: f.endereco.cidade,
              uf: f.endereco.uf,
              status: f.isAtivo ? 'ATIVO' : 'INATIVO',
            }))}
            columns={[
              { key: 'tipo', label: 'Tipo' },
              { key: 'nome', label: 'Nome / Razão Social' },
              { key: 'documento', label: 'Documento' },
              { key: 'email', label: 'E-mail' },
              { key: 'telefone', label: 'Telefone' },
              { key: 'cidade', label: 'Cidade' },
              { key: 'uf', label: 'UF' },
              { key: 'status', label: 'Status' },
            ]}
            filename="fornecedores"
            title="Relatório de Fornecedores"
          />
          <button
            onClick={() => handleOpenDialog()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Fornecedor</span>
          </button>
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
                    {globalFilter ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado'}
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
              {globalFilter ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado'}
            </div>
          ) : (
            table.getRowModel().rows.map((row) => {
              const fornecedor = row.original;
              return (
                <div key={row.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {fornecedor.tipo === 'cnpj' ? (
                          <Building2 className="h-4 w-4 text-slate-400" />
                        ) : (
                          <User className="h-4 w-4 text-slate-400" />
                        )}
                        <p className="font-medium text-slate-900">
                          {fornecedor.tipo === 'cnpj'
                            ? fornecedor.razaoSocial
                            : fornecedor.nomeCompleto}
                        </p>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {fornecedor.tipo === 'cnpj' ? fornecedor.cnpj : fornecedor.cpf}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {fornecedor.contatoEmpresa.emailPrincipal}
                      </div>
                    </div>
                    <div className="ml-4 flex gap-1">
                      <button
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        title="Editar"
                        onClick={() => handleOpenDialog(fornecedor)}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Excluir"
                        onClick={() => setDeleteFornecedorId(fornecedor.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Dialog Adicionar/Editar */}
      <FornecedorForm
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        fornecedor={editingFornecedor || undefined}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />

      {/* Alert Dialog Confirmar Exclusão */}
      <AlertDialog
        open={!!deleteFornecedorId}
        onOpenChange={(open) => !open && setDeleteFornecedorId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita.
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
