// Tipos para Bancos (lista enviada pelo backend via API)

export interface Banco {
  id: string;
  nome: string;
  codigo: string;
  cor: string; // Cor principal do banco para UI
  logo?: string; // URL do logo
}

// Icone fallback quando nao ha logo: iniciais do banco
export function getBancoIcon(banco: Banco): string {
  const iniciais = banco.nome
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('');
  return iniciais || '?';
}
