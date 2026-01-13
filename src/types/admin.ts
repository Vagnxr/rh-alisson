import type { Tenant } from './tenant';

export interface AdminUser {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  tenantId: string | null;
  tenantName?: string;
  role: 'super_admin' | 'admin' | 'manager' | 'user';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface AdminUserFormData {
  nome: string;
  email: string;
  telefone?: string;
  tenantId: string;
  role: AdminUser['role'];
  password?: string;
  isActive: boolean;
}

export interface AdminTenant extends Tenant {
  email?: string;
  telefone?: string;
  endereco?: string;
  responsavel?: string;
  usersCount?: number;
}

export interface AdminTenantFormData {
  name: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  responsavel?: string;
  isActive: boolean;
}

export const ROLE_LABELS: Record<AdminUser['role'], string> = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  manager: 'Gerente',
  user: 'Usuario',
};

export const ROLE_COLORS: Record<AdminUser['role'], string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  manager: 'bg-amber-100 text-amber-700',
  user: 'bg-slate-100 text-slate-700',
};
