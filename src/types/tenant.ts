export interface Tenant {
  id: string;
  name: string; // Razao Social
  nomeFantasia: string; // Nome Fantasia (exibido no seletor)
  cnpj?: string;
  logo?: string;
  isActive: boolean;
  isMultiloja?: boolean; // Permite multiplas lojas
  createdAt: string;
}

export interface TenantUser {
  tenantId: string;
  role: 'admin' | 'manager' | 'user';
  permissions: string[];
}
