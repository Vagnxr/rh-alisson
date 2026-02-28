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
  Users,
  Power,
  PowerOff,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useAdminUsersStore } from '@/stores/adminUsersStore';
import { useAdminTenantsStore } from '@/stores/adminTenantsStore';
import type { AdminUser, AdminUserFormData } from '@/types/admin';
import { ROLE_LABELS, ROLE_COLORS } from '@/types/admin';
import { cn } from '@/lib/cn';
import { buildTableColumns } from '@/lib/buildTableColumns';
import { InputCelular } from '@/components/ui/input-masked';
import { InputPassword } from '@/components/ui/input-password';
import { PAGINAS_PERMISSAO, fetchAdminPaginas } from '@/lib/paginasPermissao';

const ADMIN_USERS_TABLE_DEFAULT_ORDER = ['nome', 'tenantName', 'role', 'isActive', 'lastLogin'];

export function AdminUsersPage() {
  const { users, columns: columnsFromApi, isLoading, fetchUsers, addUser, updateUser, deleteUser, toggleUserStatus } =
    useAdminUsersStore();
  const { tenants, fetchTenants } = useAdminTenantsStore();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [paginasList, setPaginasList] = useState<typeof PAGINAS_PERMISSAO>(PAGINAS_PERMISSAO);
  const [loadingPaginas, setLoadingPaginas] = useState(false);

  const [formData, setFormData] = useState<AdminUserFormData>({
    nome: '',
    email: '',
    telefone: '',
    tenantId: '',
    role: 'user',
    password: '',
    isActive: true,
    permissoes: [],
  });

  useEffect(() => {
    fetchUsers();
    fetchTenants();
  }, [fetchUsers, fetchTenants]);

  const columnDefsByKey = useMemo<Record<string, ColumnDef<AdminUser>>>(
    () => ({
      nome: {
        accessorKey: 'nome',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Nome
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-slate-900">{row.original.nome}</p>
            <p className="text-sm text-slate-500">{row.original.email}</p>
          </div>
        ),
      },
      tenantName: {
        accessorKey: 'tenantName',
        header: 'Empresa',
        cell: ({ row }) => (
          <span className="text-slate-600">{row.original.tenantName || '-'}</span>
        ),
      },
      role: {
        accessorKey: 'role',
        header: 'Perfil',
        cell: ({ row }) => (
          <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', ROLE_COLORS[row.original.role])}>
            {ROLE_LABELS[row.original.role]}
          </span>
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
            {row.original.isActive ? 'Ativo' : 'Inativo'}
          </span>
        ),
      },
      lastLogin: {
        accessorKey: 'lastLogin',
        header: 'Ultimo Acesso',
        cell: ({ row }) =>
          row.original.lastLogin
            ? new Date(row.original.lastLogin).toLocaleDateString('pt-BR')
            : '-',
      },
    }),
    []
  );

  const columns = useMemo(
    () =>
      buildTableColumns<AdminUser>(
        columnDefsByKey,
        columnsFromApi ?? null,
        ADMIN_USERS_TABLE_DEFAULT_ORDER,
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
    data: users,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const selectedTenant = useMemo(
    () => tenants.find((t) => t.id === formData.tenantId),
    [tenants, formData.tenantId]
  );

  const paginasDisponiveisParaUsuario = useMemo(() => {
    const ids = selectedTenant?.paginasPermitidas;
    if (ids && ids.length > 0) return paginasList.filter((p) => ids.includes(p.id));
    return paginasList;
  }, [selectedTenant?.paginasPermitidas, paginasList]);

  const loadPaginasForDialog = (tenantId: string | null) => {
    if (!tenantId) {
      setPaginasList(PAGINAS_PERMISSAO);
      return;
    }
    setLoadingPaginas(true);
    setPaginasList(PAGINAS_PERMISSAO);
    fetchAdminPaginas(tenantId)
      .then((list) => {
        const unicas = list.filter(
          (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i,
        );
        setPaginasList(unicas);
      })
      .catch(() => {})
      .finally(() => setLoadingPaginas(false));
  };

  const handleAdd = () => {
    const defaultTenantId = tenants[0]?.id || '';
    setEditingUser(null);
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      tenantId: defaultTenantId,
      role: 'user',
      password: '',
      isActive: true,
      permissoes: [],
    });
    setIsDialogOpen(true);
    loadPaginasForDialog(defaultTenantId || null);
  };

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    setFormData({
      nome: user.nome,
      email: user.email,
      telefone: user.telefone || '',
      tenantId: user.tenantId || '',
      role: user.role,
      password: '',
      isActive: user.isActive,
      permissoes: Array.isArray(user.permissoes) ? [...user.permissoes] : [],
    });
    setIsDialogOpen(true);
    loadPaginasForDialog(user.tenantId || null);
  };

  const handleDeleteClick = (user: AdminUser) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleToggleStatus = async (user: AdminUser) => {
    const success = await toggleUserStatus(user.id);
    if (success) {
      toast.success(
        user.isActive ? 'Usuario desativado com sucesso' : 'Usuario ativado com sucesso'
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.email || !formData.tenantId) {
      toast.error('Preencha todos os campos obrigatorios');
      return;
    }

    let success: boolean;
    if (editingUser) {
      success = await updateUser(editingUser.id, formData);
      if (success) toast.success('Usuario atualizado com sucesso');
    } else {
      success = await addUser(formData);
      if (success) toast.success('Usuario criado com sucesso');
    }

    if (success) {
      setIsDialogOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    const success = await deleteUser(userToDelete.id);
    if (success) {
      toast.success('Usuario excluido com sucesso');
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 p-4 sm:p-6">
      {/* Header fixo com botao Criar sempre visivel */}
      <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Usuarios</h1>
          <p className="text-sm text-slate-500">Gerencie os usuarios do sistema</p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Novo Usuario
        </button>
      </div>

      {/* Filtro */}
      <div className="relative shrink-0">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nome, email ou empresa..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:max-w-xs"
        />
      </div>

      {/* Tabela com scroll */}
      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-slate-300" />
            <p className="mt-4 font-medium text-slate-900">Nenhum usuario cadastrado</p>
            <p className="mt-1 text-sm text-slate-500">
              Clique em "Novo Usuario" para adicionar
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
        {users.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-600">
              Total: <span className="font-medium">{users.length}</span> usuarios
            </p>
          </div>
        )}
      </div>

      {/* Dialog de Adicionar/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="flex max-h-[90vh] flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Usuario' : 'Novo Usuario'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Nome *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Nome completo"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="email@empresa.com"
              />
            </div>

            <InputCelular
              label="Celular"
              value={formData.telefone}
              onValueChange={(masked) => setFormData({ ...formData, telefone: masked })}
            />

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Empresa *
              </label>
              <select
                value={formData.tenantId}
                onChange={(e) => {
                  const newTenantId = e.target.value;
                  const newTenant = tenants.find((t) => t.id === newTenantId);
                  loadPaginasForDialog(newTenantId || null);
                  const allowedIds = newTenant?.paginasPermitidas;
                  const permissoesValidas =
                    allowedIds?.length ?
                      (formData.permissoes ?? []).filter((id) => allowedIds.includes(id))
                    : (formData.permissoes ?? []);
                  setFormData({
                    ...formData,
                    tenantId: newTenantId,
                    permissoes: permissoesValidas,
                  });
                }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Selecione uma empresa</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Perfil *
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value as AdminUserFormData['role'] })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="user">Usuario</option>
                <option value="manager">Gerente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <p className="mb-1 text-sm font-medium text-slate-700">
                Paginas que o usuario pode acessar
              </p>
              <p className="mb-3 text-xs text-slate-500">
                {selectedTenant?.paginasPermitidas?.length
                  ? 'Apenas as telas permitidas para a empresa estao listadas. O usuario so vera o que estiver marcado.'
                  : 'Selecione as telas para este usuario. Se a empresa nao tiver restricao, todas aparecem aqui.'}
              </p>
              {loadingPaginas && (
                <p className="text-xs text-slate-500">Carregando paginas...</p>
              )}
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  {paginasDisponiveisParaUsuario.map((pagina) => {
                    const checked = (formData.permissoes ?? []).includes(pagina.id);
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
                              ? [...(formData.permissoes ?? []), pagina.id]
                              : (formData.permissoes ?? []).filter((id) => id !== pagina.id);
                            setFormData({ ...formData, permissoes: next });
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-slate-700">{pagina.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {!editingUser && (
              <InputPassword
                label="Senha"
                value={formData.password}
                onValueChange={(value) => setFormData({ ...formData, password: value })}
                showStrength
                showRequirements
                required
                placeholder="Digite uma senha segura"
              />
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="isActive" className="text-sm text-slate-700">
                Usuario ativo
              </label>
            </div>
            </div>

            <div className="flex shrink-0 gap-3 pt-4">
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
                {editingUser ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmacao de Exclusao */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuario{' '}
              <span className="font-medium">{userToDelete?.nome}</span>? Esta acao nao pode
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
