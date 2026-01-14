import { useState, useEffect, useCallback } from 'react';
import { Loader2, MapPin, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { InputCEP } from './input-masked';
import { useCEP } from '@/hooks/useCEP';
import { onlyNumbers } from '@/lib/masks';

export interface EnderecoData {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

interface InputEnderecoProps {
  value?: EnderecoData;
  onChange?: (endereco: EnderecoData) => void;
  disabled?: boolean;
  required?: boolean;
}

const initialEndereco: EnderecoData = {
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
};

export function InputEndereco({ value, onChange, disabled, required }: InputEnderecoProps) {
  const [endereco, setEndereco] = useState<EnderecoData>(value || initialEndereco);
  const { buscar, isLoading, error } = useCEP();
  const [cepPreenchido, setCepPreenchido] = useState(false);

  useEffect(() => {
    if (value) {
      setEndereco(value);
    }
  }, [value]);

  const handleChange = useCallback(
    (field: keyof EnderecoData, fieldValue: string) => {
      const novoEndereco = { ...endereco, [field]: fieldValue };
      setEndereco(novoEndereco);
      onChange?.(novoEndereco);
    },
    [endereco, onChange]
  );

  const handleCEPChange = useCallback(
    async (maskedCep: string) => {
      handleChange('cep', maskedCep);
      setCepPreenchido(false);

      const cepLimpo = onlyNumbers(maskedCep);
      if (cepLimpo.length === 8) {
        const resultado = await buscar(maskedCep);
        if (resultado) {
          const novoEndereco: EnderecoData = {
            ...endereco,
            cep: maskedCep,
            logradouro: resultado.logradouro,
            bairro: resultado.bairro,
            cidade: resultado.cidade,
            estado: resultado.estado,
            complemento: resultado.complemento || endereco.complemento,
          };
          setEndereco(novoEndereco);
          onChange?.(novoEndereco);
          setCepPreenchido(true);
        }
      }
    },
    [buscar, endereco, handleChange, onChange]
  );

  return (
    <div className="space-y-4">
      {/* CEP */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="relative">
          <InputCEP
            label="CEP"
            value={endereco.cep}
            onValueChange={handleCEPChange}
            disabled={disabled}
            required={required}
            showValidation={false}
          />
          {isLoading && (
            <div className="absolute right-3 top-8">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
            </div>
          )}
          {cepPreenchido && !isLoading && (
            <div className="absolute right-3 top-8">
              <Check className="h-4 w-4 text-emerald-600" />
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-500 sm:col-span-2 sm:self-end sm:pb-2">{error}</p>
        )}
      </div>

      {/* Logradouro e Numero */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="sm:col-span-3">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Logradouro
            {required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={endereco.logradouro}
            onChange={(e) => handleChange('logradouro', e.target.value)}
            disabled={disabled}
            placeholder="Rua, Avenida, etc."
            className={cn(
              'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900',
              'placeholder:text-slate-400',
              'focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500',
              'disabled:bg-slate-50 disabled:text-slate-500'
            )}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Numero
            {required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={endereco.numero}
            onChange={(e) => handleChange('numero', e.target.value)}
            disabled={disabled}
            placeholder="123"
            className={cn(
              'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900',
              'placeholder:text-slate-400',
              'focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500',
              'disabled:bg-slate-50 disabled:text-slate-500'
            )}
          />
        </div>
      </div>

      {/* Complemento e Bairro */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Complemento</label>
          <input
            type="text"
            value={endereco.complemento}
            onChange={(e) => handleChange('complemento', e.target.value)}
            disabled={disabled}
            placeholder="Apto, Sala, etc."
            className={cn(
              'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900',
              'placeholder:text-slate-400',
              'focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500',
              'disabled:bg-slate-50 disabled:text-slate-500'
            )}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Bairro
            {required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={endereco.bairro}
            onChange={(e) => handleChange('bairro', e.target.value)}
            disabled={disabled}
            placeholder="Bairro"
            className={cn(
              'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900',
              'placeholder:text-slate-400',
              'focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500',
              'disabled:bg-slate-50 disabled:text-slate-500'
            )}
          />
        </div>
      </div>

      {/* Cidade e Estado */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Cidade
            {required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={endereco.cidade}
            onChange={(e) => handleChange('cidade', e.target.value)}
            disabled={disabled}
            placeholder="Cidade"
            className={cn(
              'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900',
              'placeholder:text-slate-400',
              'focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500',
              'disabled:bg-slate-50 disabled:text-slate-500'
            )}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Estado
            {required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
          <select
            value={endereco.estado}
            onChange={(e) => handleChange('estado', e.target.value)}
            disabled={disabled}
            className={cn(
              'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900',
              'focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500',
              'disabled:bg-slate-50 disabled:text-slate-500'
            )}
          >
            <option value="">UF</option>
            <option value="AC">AC</option>
            <option value="AL">AL</option>
            <option value="AP">AP</option>
            <option value="AM">AM</option>
            <option value="BA">BA</option>
            <option value="CE">CE</option>
            <option value="DF">DF</option>
            <option value="ES">ES</option>
            <option value="GO">GO</option>
            <option value="MA">MA</option>
            <option value="MT">MT</option>
            <option value="MS">MS</option>
            <option value="MG">MG</option>
            <option value="PA">PA</option>
            <option value="PB">PB</option>
            <option value="PR">PR</option>
            <option value="PE">PE</option>
            <option value="PI">PI</option>
            <option value="RJ">RJ</option>
            <option value="RN">RN</option>
            <option value="RS">RS</option>
            <option value="RO">RO</option>
            <option value="RR">RR</option>
            <option value="SC">SC</option>
            <option value="SP">SP</option>
            <option value="SE">SE</option>
            <option value="TO">TO</option>
          </select>
        </div>
      </div>
    </div>
  );
}
