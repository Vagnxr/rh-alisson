export interface Tenant {
  id: string;
  name: string;
  cnpj?: string;
  logo?: string;
  isActive: boolean;
  createdAt: string;
}

export interface TenantUser {
  tenantId: string;
  role: 'admin' | 'manager' | 'user';
  permissions: string[];
}
