/**
 * Integração com ReceitaWS para consulta de CNPJ.
 * API pública: https://www.receitaws.com.br/v1/cnpj/{cnpj}
 * CNPJ deve ser passado apenas com dígitos (14 caracteres).
 */

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
 * Busca dados do CNPJ na ReceitaWS.
 * @param cnpj - CNPJ com ou sem formatação (será limpo para 14 dígitos)
 * @returns Dados mapeados para uso no formulário ou null se falhar
 */
export async function fetchCNPJReceitaWS(cnpj: string): Promise<ReceitaWSResponse | null> {
  const digits = onlyDigitsCnpj(cnpj);
  if (digits.length !== 14) return null;

  try {
    const res = await fetch(`https://www.receitaws.com.br/v1/cnpj/${digits}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const data = (await res.json()) as ReceitaWSResponse;
    if (data.status === 'ERROR' || data.message) return null;
    return data;
  } catch {
    return null;
  }
}
