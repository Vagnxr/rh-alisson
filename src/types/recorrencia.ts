// Tipos para despesas recorrentes

export type TipoRecorrencia = 'unica' | 'semanal' | 'quinzenal' | 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual';

export interface RecorrenciaConfig {
  tipo: TipoRecorrencia;
  label: string;
  descricao: string;
  diasIntervalo: number | null; // null para unica
}

export const RECORRENCIAS: Record<TipoRecorrencia, RecorrenciaConfig> = {
  unica: {
    tipo: 'unica',
    label: 'Sem recorrência',
    descricao: 'Pagamento único, sem repetição',
    diasIntervalo: null,
  },
  semanal: {
    tipo: 'semanal',
    label: 'Semanal',
    descricao: 'Repete toda semana',
    diasIntervalo: 7,
  },
  quinzenal: {
    tipo: 'quinzenal',
    label: 'Quinzenal',
    descricao: 'Repete a cada 15 dias',
    diasIntervalo: 15,
  },
  mensal: {
    tipo: 'mensal',
    label: 'Mensal',
    descricao: 'Repete todo mes',
    diasIntervalo: 30,
  },
  bimestral: {
    tipo: 'bimestral',
    label: 'Bimestral',
    descricao: 'Repete a cada 2 meses',
    diasIntervalo: 60,
  },
  trimestral: {
    tipo: 'trimestral',
    label: 'Trimestral',
    descricao: 'Repete a cada 3 meses',
    diasIntervalo: 90,
  },
  semestral: {
    tipo: 'semestral',
    label: 'Semestral',
    descricao: 'Repete a cada 6 meses',
    diasIntervalo: 180,
  },
  anual: {
    tipo: 'anual',
    label: 'Anual',
    descricao: 'Repete todo ano',
    diasIntervalo: 365,
  },
};

// Calcula proximas datas de vencimento
export function calcularProximasOcorrencias(
  dataInicial: Date,
  recorrencia: TipoRecorrencia,
  quantidade: number = 12
): Date[] {
  if (recorrencia === 'unica') {
    return [dataInicial];
  }

  const config = RECORRENCIAS[recorrencia];
  if (!config.diasIntervalo) {
    return [dataInicial];
  }

  const datas: Date[] = [];
  let dataAtual = new Date(dataInicial);

  for (let i = 0; i < quantidade; i++) {
    datas.push(new Date(dataAtual));
    
    // Calcula proxima data baseado no tipo
    if (recorrencia === 'mensal') {
      dataAtual.setMonth(dataAtual.getMonth() + 1);
    } else if (recorrencia === 'bimestral') {
      dataAtual.setMonth(dataAtual.getMonth() + 2);
    } else if (recorrencia === 'trimestral') {
      dataAtual.setMonth(dataAtual.getMonth() + 3);
    } else if (recorrencia === 'semestral') {
      dataAtual.setMonth(dataAtual.getMonth() + 6);
    } else if (recorrencia === 'anual') {
      dataAtual.setFullYear(dataAtual.getFullYear() + 1);
    } else {
      dataAtual.setDate(dataAtual.getDate() + config.diasIntervalo);
    }
  }

  return datas;
}
