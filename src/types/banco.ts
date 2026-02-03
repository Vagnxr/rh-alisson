// Tipos para Bancos

export interface Banco {
  id: string;
  nome: string;
  codigo: string;
  cor: string; // Cor principal do banco para UI
  logo?: string; // URL do logo (se tiver)
}

// Bancos pre-criados com cores oficiais
export const BANCOS_PADRAO: Banco[] = [
  { id: 'bb', nome: 'BANCO DO BRASIL', codigo: '001', cor: '#FFEF00' },
  { id: 'bradesco', nome: 'BRADESCO', codigo: '237', cor: '#CC092F' },
  { id: 'caixa', nome: 'CAIXA ECONOMICA', codigo: '104', cor: '#005CA9' },
  { id: 'itau', nome: 'ITAU', codigo: '341', cor: '#EC7000' },
  { id: 'santander', nome: 'SANTANDER', codigo: '033', cor: '#EC0000' },
  { id: 'nubank', nome: 'NUBANK', codigo: '260', cor: '#820AD1' },
  { id: 'inter', nome: 'BANCO INTER', codigo: '077', cor: '#FF7A00' },
  { id: 'c6', nome: 'C6 BANK', codigo: '336', cor: '#1A1A1A' },
  { id: 'picpay', nome: 'PICPAY', codigo: '380', cor: '#21C25E' },
  { id: 'mercadopago', nome: 'MERCADO PAGO', codigo: '323', cor: '#009EE3' },
  { id: 'pagbank', nome: 'PAGBANK', codigo: '290', cor: '#00A94F' },
  { id: 'sicoob', nome: 'SICOOB', codigo: '756', cor: '#003641' },
  { id: 'sicredi', nome: 'SICREDI', codigo: '748', cor: '#33A02C' },
  { id: 'original', nome: 'BANCO ORIGINAL', codigo: '212', cor: '#00A551' },
  { id: 'btg', nome: 'BTG PACTUAL', codigo: '208', cor: '#001E62' },
  { id: 'safra', nome: 'BANCO SAFRA', codigo: '422', cor: '#003366' },
  { id: 'neon', nome: 'NEON', codigo: '735', cor: '#00E7F9' },
  { id: 'next', nome: 'NEXT', codigo: '237', cor: '#00FF87' },
  { id: 'will', nome: 'WILL BANK', codigo: '280', cor: '#FFDE59' },
  { id: 'outros', nome: 'OUTROS', codigo: '000', cor: '#64748B' },
];

// Icone SVG generico para bancos
export function getBancoIcon(banco: Banco): string {
  // Retorna as iniciais do banco como fallback
  const iniciais = banco.nome
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');
  return iniciais;
}
