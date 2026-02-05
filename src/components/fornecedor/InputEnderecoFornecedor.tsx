import { useState, useEffect, useCallback } from 'react';
import { Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { InputCEP } from '@/components/ui/input-masked';
import { useCEP } from '@/hooks/useCEP';
import { onlyNumbers } from '@/lib/masks';
import { InputUppercase } from '@/components/ui/input-uppercase';
import type { EnderecoFornecedor, TipoLogradouro } from '@/types/fornecedor';
import { TIPOS_LOGRADOURO } from '@/types/fornecedor';

export interface EnderecoErrors {
  cep?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
}

interface InputEnderecoFornecedorProps {
  value?: EnderecoFornecedor;
  onChange?: (endereco: EnderecoFornecedor) => void;
  disabled?: boolean;
  required?: boolean;
  errors?: EnderecoErrors;
}

const initialEndereco: EnderecoFornecedor = {
  cep: '',
  tipoLogradouro: 'Rua',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
};

export function InputEnderecoFornecedor({
  value,
  onChange,
  disabled,
  required,
  errors,
}: InputEnderecoFornecedorProps) {
  const [endereco, setEndereco] = useState<EnderecoFornecedor>(value || initialEndereco);
  const { buscar, isLoading, error } = useCEP();
  const [cepPreenchido, setCepPreenchido] = useState(false);

  useEffect(() => {
    if (value) {
      setEndereco(value);
    }
  }, [value]);

  const handleChange = useCallback(
    (field: keyof EnderecoFornecedor, fieldValue: string | TipoLogradouro) => {
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
          const novoEndereco: EnderecoFornecedor = {
            ...endereco,
            cep: maskedCep,
            logradouro: resultado.logradouro,
            bairro: resultado.bairro,
            cidade: resultado.cidade,
            uf: resultado.estado,
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
            error={errors?.cep}
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

      {/* Tipo de Logradouro e Logradouro */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Tipo
            {required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
          <select
            value={endereco.tipoLogradouro}
            onChange={(e) => handleChange('tipoLogradouro', e.target.value as TipoLogradouro)}
            disabled={disabled}
            className={cn(
              'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900',
              'focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500',
              'disabled:bg-slate-50 disabled:text-slate-500'
            )}
          >
            {TIPOS_LOGRADOURO.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-3">
          <InputUppercase
            label="Logradouro"
            value={endereco.logradouro}
            onChange={(e) => handleChange('logradouro', e.target.value.toUpperCase())}
            disabled={disabled}
            required={required}
            error={errors?.logradouro}
            placeholder="Nome da rua, avenida, etc."
          />
        </div>
      </div>

      {/* Número e Complemento */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <InputUppercase
            label="Número"
            value={endereco.numero}
            onChange={(e) => handleChange('numero', e.target.value)}
            disabled={disabled}
            required={required}
            error={errors?.numero}
            placeholder="123"
          />
        </div>
        <div>
          <InputUppercase
            label="Complemento (opcional)"
            value={endereco.complemento || ''}
            onChange={(e) => handleChange('complemento', e.target.value)}
            disabled={disabled}
            placeholder="Apto, Sala, etc."
          />
        </div>
      </div>

      {/* Bairro */}
      <div>
        <InputUppercase
          label="Bairro"
          value={endereco.bairro}
          onChange={(e) => handleChange('bairro', e.target.value)}
          disabled={disabled}
          required={required}
          error={errors?.bairro}
          placeholder="Bairro"
        />
      </div>

      {/* Cidade e Estado */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <InputUppercase
            label="Cidade"
            value={endereco.cidade}
            onChange={(e) => handleChange('cidade', e.target.value)}
            disabled={disabled}
            required={required}
            error={errors?.cidade}
            placeholder="Cidade"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            UF
            {required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
          <select
            value={endereco.uf}
            onChange={(e) => handleChange('uf', e.target.value)}
            disabled={disabled}
            aria-invalid={!!errors?.uf}
            className={cn(
              'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900',
              errors?.uf ? 'border-red-500' : 'border-slate-200',
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
          {errors?.uf && <p className="mt-1 text-xs text-red-500">{errors.uf}</p>}
        </div>
      </div>
    </div>
  );
}
