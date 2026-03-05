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
import { ArrowUpDown, Plus, Pencil, Loader2, Building2, User, UserX, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { Fornecedor } from '@/types/fornecedor';
import { useFornecedorStore } from '@/stores/fornecedorStore';
import { FornecedorForm } from '@/components/fornecedor/FornecedorForm';
import { ExportButtons } from '@/components/ui/export-buttons';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/cn';
import { buildTableColumns } from '@/lib/buildTableColumns';
import type { CreateFornecedorDto, UpdateFornecedorDto } from '@/types/fornecedor';

/** Ordem padrao quando a API nao envia columns. */
const FORNECEDOR_TABLE_DEFAULT_ORDER = [
  'tipo', 'cnpj', 'cpf', 'razaoSocial', 'nomeFantasia', 'nomeCompleto', 'nomeComercial',
  'endereco', 'contatoEmpresa', 'contatoVendedor', 'observacoes', 'isAtivo', 'createdAt', 'updatedAt',
];

function SortableHeader({ column, children }: { column: { getIsSorted: () => false | 'asc' | 'desc'; toggleSorting: (asc: boolean) => void }; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="flex items-center gap-1 font-medium"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {children}
      <ArrowUpDown className="h-4 w-4" />
    </button>
  );
}

export function FornecedoresPage() {
  const {
    fornecedores,
    columns: columnsFromApi,
    isLoading,
    fetchFornecedores,
    addFornecedor,
    updateFornecedor,
    toggleFornecedorStatus,
  } = useFornecedorStore();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [viewStatus, setViewStatus] = useState<'ativos' | 'inativos'>('ativos');
  const [viewTipo, setViewTipo] = useState<'todos' | 'cnpj' | 'cpf'>('todos');

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

  const handleToggleStatus = async (id: string, isAtivo: boolean) => {
    try {
      await toggleFornecedorStatus(id);
      toast.success(isAtivo ? 'Fornecedor inativado.' : 'Fornecedor reativado.');
      fetchFornecedores();
    } catch {
      toast.error('Erro ao alterar status do fornecedor.');
    }
  };

  const columnDefsByKey = useMemo<Record<string, ColumnDef<Fornecedor>>>(() => ({
      tipo: {
        accessorKey: 'tipo',
        header: ({ column }) => <SortableHeader column={column}>Tipo</SortableHeader>,
        cell: ({ row }) => {
          const tipo = row.getValue('tipo') as string;
          return (
            <div className="flex items-center gap-2">
              {tipo === 'cnpj' ? <Building2 className="h-4 w-4 text-slate-400" /> : <User className="h-4 w-4 text-slate-400" />}
              <span className="text-sm text-slate-600">{tipo?.toUpperCase() ?? '-'}</span>
            </div>
          );
        },
      },
      cnpj: {
        accessorKey: 'cnpj',
        header: ({ column }) => <SortableHeader column={column}>CNPJ</SortableHeader>,
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">{row.original.tipo === 'cnpj' ? row.original.cnpj : '-'}</span>
        ),
      },
      cpf: {
        accessorFn: (row) => (row.tipo === 'cpf' ? row.cpf : ''),
        id: 'cpf',
        header: ({ column }) => <SortableHeader column={column}>CPF</SortableHeader>,
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">{row.original.tipo === 'cpf' ? row.original.cpf : '-'}</span>
        ),
      },
      razaoSocial: {
        accessorKey: 'razaoSocial',
        header: ({ column }) => <SortableHeader column={column}>Razao Social</SortableHeader>,
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">{row.original.tipo === 'cnpj' ? row.original.razaoSocial : '-'}</span>
        ),
      },
      nomeFantasia: {
        accessorKey: 'nomeFantasia',
        header: ({ column }) => <SortableHeader column={column}>Nome Fantasia</SortableHeader>,
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">{row.original.tipo === 'cnpj' ? row.original.nomeFantasia : '-'}</span>
        ),
      },
      nomeCompleto: {
        accessorKey: 'nomeCompleto',
        header: ({ column }) => <SortableHeader column={column}>Nome Completo</SortableHeader>,
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">{row.original.tipo === 'cpf' ? row.original.nomeCompleto : '-'}</span>
        ),
      },
      nomeComercial: {
        accessorKey: 'nomeComercial',
        header: ({ column }) => <SortableHeader column={column}>Nome Comercial</SortableHeader>,
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">{row.original.tipo === 'cpf' ? row.original.nomeComercial ?? '-' : '-'}</span>
        ),
      },
      endereco: {
        accessorKey: 'endereco',
        header: 'Endereco',
        cell: ({ row }) => {
          const e = row.original.endereco;
          return <span className="text-sm text-slate-600">{e?.cidade && e?.uf ? `${e.cidade} / ${e.uf}` : '-'}</span>;
        },
      },
      contatoEmpresa: {
        accessorKey: 'contatoEmpresa',
        header: 'Contato',
        cell: ({ row }) => {
          const c = row.original.contatoEmpresa;
          return (
            <div className="text-sm">
              {c?.emailPrincipal && <div className="text-slate-900">{c.emailPrincipal}</div>}
              {c?.telefonePrincipal && <div className="text-xs text-slate-500">{c.telefonePrincipal}</div>}
              {!c?.emailPrincipal && !c?.telefonePrincipal && '-'}
            </div>
          );
        },
      },
      contatoVendedor: {
        accessorKey: 'contatoVendedor',
        header: 'Contato Vendedor',
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">{row.original.contatoVendedor?.nome ?? '-'}</span>
        ),
      },
      observacoes: {
        accessorKey: 'observacoes',
        header: 'Observacoes',
        cell: ({ row }) => (
          <span className="max-w-[200px] truncate text-sm text-slate-600" title={row.original.observacoes ?? ''}>
            {row.original.observacoes ?? '-'}
          </span>
        ),
      },
      isAtivo: {
        accessorKey: 'isAtivo',
        header: 'Status',
        cell: ({ row }) => {
          const isAtivo = row.getValue('isAtivo') as boolean;
          return (
            <span
              className={cn(
                'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                isAtivo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
              )}
            >
              {isAtivo ? 'Ativo' : 'Inativo'}
            </span>
          );
        },
      },
      createdAt: {
        accessorKey: 'createdAt',
        header: ({ column }) => <SortableHeader column={column}>Criado em</SortableHeader>,
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">
            {row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString('pt-BR') : '-'}
          </span>
        ),
      },
      updatedAt: {
        accessorKey: 'updatedAt',
        header: ({ column }) => <SortableHeader column={column}>Atualizado em</SortableHeader>,
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">
            {row.original.updatedAt ? new Date(row.original.updatedAt).toLocaleDateString('pt-BR') : '-'}
          </span>
        ),
      },
    }),
  []);

  const columns = useMemo(
    () =>
      buildTableColumns<Fornecedor>(
        columnDefsByKey,
        columnsFromApi ?? null,
        FORNECEDOR_TABLE_DEFAULT_ORDER,
        {
          id: 'actions',
          header: () => <span className="sr-only">Ações</span>,
          cell: ({ row }) => {
            const f = row.original;
            const isAtivo = f.isAtivo !== false;
            return (
              <div className="flex items-center justify-end gap-1">
                <button
                  className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  title="Editar"
                  onClick={() => handleOpenDialog(f)}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  className="rounded p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-700"
                  title={isAtivo ? 'Inativar' : 'Reativar'}
                  onClick={() => handleToggleStatus(f.id, isAtivo)}
                >
                  {isAtivo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                </button>
              </div>
            );
          },
        }
      ),
    [columnDefsByKey, columnsFromApi]
  );

  const fornecedoresFiltrados = useMemo(() => {
    let list = viewStatus === 'ativos'
      ? fornecedores.filter((f) => f.isAtivo !== false)
      : fornecedores.filter((f) => f.isAtivo === false);
    if (viewTipo === 'cnpj') list = list.filter((f) => f.tipo === 'cnpj');
    else if (viewTipo === 'cpf') list = list.filter((f) => f.tipo === 'cpf');
    return list;
  }, [fornecedores, viewStatus, viewTipo]);

  const columnVisibility = useMemo((): Record<string, boolean> => {
    if (viewTipo === 'cpf') {
      return { razaoSocial: false, nomeFantasia: false, cnpj: false };
    }
    if (viewTipo === 'cnpj') {
      return { cpf: false, nomeCompleto: false };
    }
    return {};
  }, [viewTipo]);

  const table = useReactTable({
    data: fornecedoresFiltrados,
    columns,
    state: { sorting, globalFilter, columnVisibility },
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
    <div className="min-w-0 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">Fornecedores</h1>
          <p className="mt-1 truncate text-sm text-slate-500">
            Gerencie seus fornecedores (CNPJ e CPF)
          </p>
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          {/* Aba Ativos / Inativos */}
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setViewStatus('ativos')}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                viewStatus === 'ativos'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Ativos
            </button>
            <button
              type="button"
              onClick={() => setViewStatus('inativos')}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                viewStatus === 'inativos'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Inativos
            </button>
          </div>
          {/* Aba CNPJ / CPF */}
          <Tabs value={viewTipo} onValueChange={(v) => setViewTipo(v as 'todos' | 'cnpj' | 'cpf')}>
            <TabsList className="h-auto rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <TabsTrigger value="todos" className="rounded-md px-3 py-1.5 text-sm data-[state=active]:shadow-sm">
                Todos
              </TabsTrigger>
              <TabsTrigger value="cnpj" className="rounded-md px-3 py-1.5 text-sm data-[state=active]:shadow-sm">
                <Building2 className="mr-1.5 h-4 w-4" />
                CNPJ
              </TabsTrigger>
              <TabsTrigger value="cpf" className="rounded-md px-3 py-1.5 text-sm data-[state=active]:shadow-sm">
                <User className="mr-1.5 h-4 w-4" />
                CPF
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {/* Busca */}
          <input
            type="text"
            placeholder="Buscar fornecedores..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:w-64"
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
      <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {/* Tabela Desktop - scroll horizontal apenas na tabela */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[600px]">
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
                    {globalFilter
                      ? 'Nenhum fornecedor encontrado'
                      : viewTipo === 'cnpj'
                        ? viewStatus === 'ativos'
                          ? 'Nenhum fornecedor ativo com CNPJ'
                          : 'Nenhum fornecedor inativo com CNPJ'
                        : viewTipo === 'cpf'
                          ? viewStatus === 'ativos'
                            ? 'Nenhum fornecedor ativo com CPF'
                            : 'Nenhum fornecedor inativo com CPF'
                          : viewStatus === 'ativos'
                            ? 'Nenhum fornecedor ativo'
                            : 'Nenhum fornecedor inativo'}
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
              {globalFilter
                ? 'Nenhum fornecedor encontrado'
                : viewTipo === 'cnpj'
                  ? viewStatus === 'ativos'
                    ? 'Nenhum fornecedor ativo com CNPJ'
                    : 'Nenhum fornecedor inativo com CNPJ'
                  : viewTipo === 'cpf'
                    ? viewStatus === 'ativos'
                      ? 'Nenhum fornecedor ativo com CPF'
                      : 'Nenhum fornecedor inativo com CPF'
                    : viewStatus === 'ativos'
                      ? 'Nenhum fornecedor ativo'
                      : 'Nenhum fornecedor inativo'}
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
                        className="rounded p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-700"
                        title={fornecedor.isAtivo !== false ? 'Inativar' : 'Reativar'}
                        onClick={() => handleToggleStatus(fornecedor.id, fornecedor.isAtivo !== false)}
                      >
                        {fornecedor.isAtivo !== false ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
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
    </div>
  );
}
