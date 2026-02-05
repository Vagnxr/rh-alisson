export interface Tenant {
  id: string;
  name: string; // Razao Social
  nomeFantasia: string; // Nome Fantasia (exibido no seletor)
  cnpj?: string;
  logo?: string;
  isActive: boolean;
  isMultiloja?: boolean; // Permite multiplas lojas
  /** Ids das paginas que a empresa tem acesso. Null/undefined = todas (comportamento backend). */
  paginasPermitidas?: string[] | null;
  createdAt: string;
}

export interface TenantUser {
  tenantId: string;
  role: 'admin' | 'manager' | 'user';
  permissions: string[];
}
