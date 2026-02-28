/**
 * Integração com ReceitaWS para consulta de CNPJ.
 * A consulta é feita via backend (GET /consulta-cnpj?cnpj=...) para evitar CORS.
 * O backend deve chamar a API ReceitaWS (https://receitaws.com.br/v1) e retornar { success: true, data: ReceitaWSResponse }.
 * Documentação backend: docs/05-backend/12-consulta-cnpj-receitaws.md
 */

import { api } from '@/lib/api';

export interface ReceitaWSResponse {
  status?: string;
  nome?: string;
  fantasia?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  email?: string;
  telefone?: string;
  message?: string;
}

/** Remove tudo que não for dígito. */
export function onlyDigitsCnpj(str: string): string {
  return (str || '').replace(/\D/g, '');
}

/**
 * Busca dados do CNPJ via backend (proxy para ReceitaWS).
 * O backend chama a ReceitaWS e retorna os dados; assim evita-se CORS no browser.
 * @param cnpj - CNPJ com ou sem formatação (será limpo para 14 dígitos)
 * @returns Dados mapeados para uso no formulário ou null se falhar
 */
export async function fetchCNPJReceitaWS(cnpj: string): Promise<ReceitaWSResponse | null> {
  const digits = onlyDigitsCnpj(cnpj);
  if (digits.length !== 14) return null;

  try {
    const res = await api.get<ReceitaWSResponse>('consulta-cnpj', { params: { cnpj: digits } });
    const data = res.data;
    if (!data || data.status === 'ERROR' || data.message) return null;
    return data;
  } catch {
    return null;
  }
}
