import { useEffect, useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ArrowUpDown,
  Loader2,
  Building2,
  Power,
  PowerOff,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
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
import { useAdminTenantsStore } from '@/stores/adminTenantsStore';
import { useAuthStore } from '@/stores/authStore';
import type { AdminTenant, AdminTenantFormData } from '@/types/admin';
import { cn } from '@/lib/cn';
import { buildTableColumns } from '@/lib/buildTableColumns';
import { InputCNPJ, InputTelefone } from '@/components/ui/input-masked';
import { PAGINAS_PERMISSAO, fetchAdminPaginas } from '@/lib/paginasPermissao';

const ADMIN_TENANTS_TABLE_DEFAULT_ORDER = ['name', 'responsavel', 'telefone', 'usersCount', 'isActive', 'createdAt'];

export function AdminTenantsPage() {
  const user = useAuthStore((s) => s.user);
  const { tenants, columns: columnsFromApi, isLoading, fetchTenants, addTenant, updateTenant, deleteTenant, toggleTenantStatus } =
    useAdminTenantsStore();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<AdminTenant | null>(null);
  const [tenantToDelete, setTenantToDelete] = useState<AdminTenant | null>(null);
  const [paginasList, setPaginasList] = useState<typeof PAGINAS_PERMISSAO>(PAGINAS_PERMISSAO);
  const [loadingPaginas, setLoadingPaginas] = useState(false);

  const [formData, setFormData] = useState<AdminTenantFormData>({
    name: '',
    cnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    responsavel: '',
    isActive: true,
    isMultiloja: false,
    paginasPermitidas: [],
    logo: '',
  });

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const columnDefsByKey = useMemo<Record<string, ColumnDef<AdminTenant>>>(
    () => ({
      name: {
        accessorKey: 'name',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Empresa
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-slate-900">{row.original.name}</p>
            {row.original.cnpj && (
              <p className="text-sm text-slate-500">CNPJ: {row.original.cnpj}</p>
            )}
          </div>
        ),
      },
      responsavel: {
        accessorKey: 'responsavel',
        header: 'Responsavel',
        cell: ({ row }) => (
          <div>
            <p className="text-slate-600">{row.original.responsavel || '-'}</p>
            {row.original.email && (
              <p className="text-sm text-slate-500">{row.original.email}</p>
            )}
          </div>
        ),
      },
      telefone: {
        accessorKey: 'telefone',
        header: 'Telefone',
        cell: ({ row }) => (
          <span className="text-slate-600">{row.original.telefone || '-'}</span>
        ),
      },
      usersCount: {
        accessorKey: 'usersCount',
        header: 'Usuarios',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-slate-400" />
            <span className="text-slate-600">{row.original.usersCount || 0}</span>
          </div>
        ),
      },
      isActive: {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => (
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-medium',
              row.original.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            )}
          >
            {row.original.isActive ? 'Ativa' : 'Inativa'}
          </span>
        ),
      },
      createdAt: {
        accessorKey: 'createdAt',
        header: 'Criada em',
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleDateString('pt-BR'),
      },
    }),
    []
  );

  const columns = useMemo(
    () =>
      buildTableColumns<AdminTenant>(
        columnDefsByKey,
        columnsFromApi ?? null,
        ADMIN_TENANTS_TABLE_DEFAULT_ORDER,
        {
          id: 'actions',
          header: 'Acoes',
          cell: ({ row }) => (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleToggleStatus(row.original)}
                className={cn(
                  'rounded-lg p-2 transition-colors',
                  row.original.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'
                )}
                title={row.original.isActive ? 'Desativar' : 'Ativar'}
              >
                {row.original.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
              </button>
              <button
                onClick={() => handleEdit(row.original)}
                className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteClick(row.original)}
                className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                title="Excluir"
                disabled={(row.original.usersCount ?? 0) > 0}
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
    data: tenants,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const loadPaginasForDialog = (
    tenantId?: string | null,
    onLoaded?: (list: Awaited<ReturnType<typeof fetchAdminPaginas>>) => void
  ) => {
    setLoadingPaginas(true);
    setPaginasList(PAGINAS_PERMISSAO);
    fetchAdminPaginas(tenantId)
      .then((list) => {
        setPaginasList(list);
        onLoaded?.(list);
      })
      .finally(() => setLoadingPaginas(false));
  };

  const handleAdd = () => {
    setEditingTenant(null);
    setFormData({
      name: '',
      cnpj: '',
      email: '',
      telefone: '',
      endereco: '',
      responsavel: '',
      isActive: true,
      isMultiloja: false,
      paginasPermitidas: [],
      logo: '',
    });
    setIsDialogOpen(true);
    loadPaginasForDialog();
  };

  const handleEdit = (tenant: AdminTenant) => {
    setEditingTenant(tenant);
    setFormData({
      name: tenant.name,
      cnpj: tenant.cnpj || '',
      email: tenant.email || '',
      telefone: tenant.telefone || '',
      endereco: tenant.endereco || '',
      responsavel: tenant.responsavel || '',
      isActive: tenant.isActive,
      isMultiloja: tenant.isMultiloja ?? false,
      paginasPermitidas: Array.isArray(tenant.paginasPermitidas) ? [...tenant.paginasPermitidas] : [],
      logo: (tenant as { logo?: string }).logo || '',
    });
    setIsDialogOpen(true);
    const tenantIdForPaginas = user?.isSuperAdmin ? undefined : tenant.id;
    loadPaginasForDialog(tenantIdForPaginas, (list) => {
      const ids = list.every((p) => p.permitido === undefined)
        ? list.map((p) => p.id)
        : list.filter((p) => p.permitido).map((p) => p.id);
      setFormData((prev) => ({ ...prev, paginasPermitidas: ids }));
    });
  };

  const handleDeleteClick = (tenant: AdminTenant) => {
    if (tenant.usersCount && tenant.usersCount > 0) {
      toast.error('Nao e possivel excluir uma empresa com usuarios vinculados');
      return;
    }
    setTenantToDelete(tenant);
    setIsDeleteDialogOpen(true);
  };

  const handleToggleStatus = async (tenant: AdminTenant) => {
    const success = await toggleTenantStatus(tenant.id);
    if (success) {
      toast.success(
        tenant.isActive ? 'Empresa desativada com sucesso' : 'Empresa ativada com sucesso'
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('O nome da empresa e obrigatorio');
      return;
    }

    let success: boolean;
    if (editingTenant) {
      success = await updateTenant(editingTenant.id, formData);
      if (success) toast.success('Empresa atualizada com sucesso');
    } else {
      success = await addTenant(formData);
      if (success) toast.success('Empresa criada com sucesso');
    }

    if (success) {
      setIsDialogOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!tenantToDelete) return;

    const success = await deleteTenant(tenantToDelete.id);
    if (success) {
      toast.success('Empresa excluida com sucesso');
      setIsDeleteDialogOpen(false);
      setTenantToDelete(null);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Empresas</h1>
          <p className="text-sm text-slate-500">Gerencie as empresas do sistema</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Nova Empresa
        </button>
      </div>

      {/* Filtro */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nome, CNPJ ou responsavel..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:max-w-xs"
        />
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : tenants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-slate-300" />
            <p className="mt-4 font-medium text-slate-900">Nenhuma empresa cadastrada</p>
            <p className="mt-1 text-sm text-slate-500">
              Clique em "Nova Empresa" para adicionar
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-slate-200 bg-slate-50">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-sm font-semibold text-slate-600"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-sm text-slate-600">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {tenants.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-600">
              Total: <span className="font-medium">{tenants.length}</span> empresas
            </p>
          </div>
        )}
      </div>

      {/* Dialog de Adicionar/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="flex max-h-[90vh] flex-col max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTenant ? 'Editar Empresa' : 'Nova Empresa'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <DialogBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Razao Social da Empresa"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Logo / Imagem da empresa
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-slate-600 file:mr-2 file:rounded file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-emerald-700"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setFormData((f) => ({ ...f, logo: String(reader.result ?? '') }));
                    reader.readAsDataURL(file);
                  }}
                />
                {formData.logo && (
                  <div className="mt-2 flex items-center gap-3">
                    <img src={formData.logo} alt="Logo" className="h-14 w-14 rounded border border-slate-200 object-contain bg-white" />
                    <button
                      type="button"
                      onClick={() => setFormData((f) => ({ ...f, logo: '' }))}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Remover imagem
                    </button>
                  </div>
                )}
              </div>

              <InputCNPJ
                label="CNPJ"
                value={formData.cnpj}
                onValueChange={(masked) => setFormData({ ...formData, cnpj: masked })}
              />

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Responsavel
                </label>
                <input
                  type="text"
                  value={formData.responsavel}
                  onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Nome do responsavel"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="contato@empresa.com"
                />
              </div>

              <InputTelefone
                label="Telefone"
                value={formData.telefone}
                onValueChange={(masked) => setFormData({ ...formData, telefone: masked })}
              />

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Endereco
                </label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Endereco completo"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="isActive" className="text-sm text-slate-700">
                  Empresa ativa
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isMultiloja"
                  checked={formData.isMultiloja ?? false}
                  onChange={(e) => setFormData({ ...formData, isMultiloja: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="isMultiloja" className="text-sm text-slate-700">
                  Multiloja (acesso à tela Lojas)
                </label>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <p className="mb-2 text-sm font-medium text-slate-700">
                Telas permitidas para esta empresa
              </p>
              <p className="mb-3 text-xs text-slate-500">
                Selecione quais paginas todos os usuarios desta empresa poderao acessar. Deixe em branco para permitir todas (conforme backend).
              </p>
              {loadingPaginas && (
                <p className="text-xs text-slate-500">Carregando paginas...</p>
              )}
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  {paginasList.map((pagina) => {
                    const checked = (formData.paginasPermitidas ?? []).includes(pagina.id);
                    return (
                      <label
                        key={pagina.id}
                        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-slate-100"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...(formData.paginasPermitidas ?? []), pagina.id]
                              : (formData.paginasPermitidas ?? []).filter((id) => id !== pagina.id);
                            setFormData({ ...formData, paginasPermitidas: next });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-slate-700">{pagina.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, paginasPermitidas: [] })}
                className="mt-2 text-xs text-slate-500 underline hover:text-slate-700"
              >
                Limpar selecao (backend pode tratar como todas)
              </button>
            </div>
            </DialogBody>
            <DialogFooter className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingTenant ? 'Salvar' : 'Criar'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmacao de Exclusao */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir empresa?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a empresa{' '}
              <span className="font-medium">{tenantToDelete?.name}</span>? Esta acao nao pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
