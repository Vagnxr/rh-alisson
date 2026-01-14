import { useState, useCallback } from 'react';
import { buscarCEP, type Endereco } from '@/lib/viacep';
import { onlyNumbers } from '@/lib/masks';

interface UseCEPReturn {
  endereco: Endereco | null;
  isLoading: boolean;
  error: string | null;
  buscar: (cep: string) => Promise<Endereco | null>;
  limpar: () => void;
}

export function useCEP(): UseCEPReturn {
  const [endereco, setEndereco] = useState<Endereco | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscar = useCallback(async (cep: string): Promise<Endereco | null> => {
    const cepLimpo = onlyNumbers(cep);
    
    if (cepLimpo.length !== 8) {
      setError('CEP deve ter 8 digitos');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const resultado = await buscarCEP(cep);
      
      if (resultado) {
        setEndereco(resultado);
        setError(null);
        return resultado;
      } else {
        setError('CEP nao encontrado');
        setEndereco(null);
        return null;
      }
    } catch (err) {
      setError('Erro ao buscar CEP');
      setEndereco(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const limpar = useCallback(() => {
    setEndereco(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    endereco,
    isLoading,
    error,
    buscar,
    limpar,
  };
}
