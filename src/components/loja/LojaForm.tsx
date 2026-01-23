import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InputCNPJ, InputCPF, InputCelular, InputTelefone, InputCEP } from '@/components/ui/inputs';
import { InputUppercase, TextareaUppercase } from '@/components/ui/input-uppercase';
import type {
  Loja,
  CreateLojaDTO,
  UpdateLojaDTO,
  EnderecoLoja,
  ContatoLoja,
  ResponsavelLoja,
  TipoLogradouro,
} from '@/types/loja';
import { TIPOS_LOGRADOURO } from '@/types/loja';
import { useCEP } from '@/hooks/useCEP';
import { useTenantStore } from '@/stores/tenantStore';

interface LojaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loja?: Loja;
  onSubmit: (data: CreateLojaDTO | UpdateLojaDTO) => Promise<void>;
  isLoading?: boolean;
}

const initialEndereco: EnderecoLoja = {
  cep: '',
  tipoLogradouro: 'RUA',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
};

const initialContato: ContatoLoja = {
  telefonePrincipal: '',
  whatsapp: '',
  emailPrincipal: '',
  emailFinanceiro: '',
};

const initialResponsavel: ResponsavelLoja = {
  nome: '',
  cpf: '',
  whatsapp: '',
  email: '',
};

const initialFormData = {
  cnpj: '',
  razaoSocial: '',
  nomeFantasia: '',
  apelido: '',
  endereco: initialEndereco,
  contato: initialContato,
  responsavel: initialResponsavel,
  observacoes: '',
  isMatriz: false,
};

export function LojaForm({
  open,
  onOpenChange,
  loja,
  onSubmit,
  isLoading = false,
}: LojaFormProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { buscar, isLoading: isLoadingCEP } = useCEP();
  const { currentTenant } = useTenantStore();

  useEffect(() => {
    if (loja) {
      setFormData({
        cnpj: loja.cnpj,
        razaoSocial: loja.razaoSocial,
        nomeFantasia: loja.nomeFantasia,
        apelido: loja.apelido,
        endereco: loja.endereco,
        contato: loja.contato,
        responsavel: loja.responsavel || initialResponsavel,
        observacoes: loja.observacoes || '',
        isMatriz: loja.isMatriz,
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [loja, open]);

  const handleCEPChange = async (cep: string) => {
    setFormData((prev) => ({
      ...prev,
      endereco: { ...prev.endereco, cep },
    }));

    // Busca o CEP se tiver 8 digitos (sem mascara)
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      const resultado = await buscar(cepLimpo);
      if (resultado) {
        setFormData((prev) => ({
          ...prev,
          endereco: {
            ...prev.endereco,
            logradouro: resultado.logradouro.toUpperCase(),
            bairro: resultado.bairro.toUpperCase(),
            cidade: resultado.cidade.toUpperCase(),
            uf: resultado.estado.toUpperCase(),
          },
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validacoes basicas
    const newErrors: Record<string, string> = {};

    if (!formData.cnpj) newErrors.cnpj = 'CNPJ e obrigatorio';
    if (!formData.razaoSocial) newErrors.razaoSocial = 'Razao Social e obrigatoria';
    if (!formData.nomeFantasia) newErrors.nomeFantasia = 'Nome Fantasia e obrigatorio';
    if (!formData.apelido) newErrors.apelido = 'Apelido e obrigatorio';
    if (!formData.endereco.cep) newErrors.cep = 'CEP e obrigatorio';
    if (!formData.endereco.numero) newErrors.numero = 'Numero e obrigatorio';
    if (!formData.contato.telefonePrincipal) newErrors.telefonePrincipal = 'Telefone e obrigatorio';
    if (!formData.contato.emailPrincipal) newErrors.emailPrincipal = 'E-mail e obrigatorio';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!currentTenant) {
      setErrors({ general: 'Nenhuma empresa selecionada' });
      return;
    }

    // Monta o DTO
    const dto: CreateLojaDTO = {
      tenantId: currentTenant.id,
      cnpj: formData.cnpj,
      razaoSocial: formData.razaoSocial,
      nomeFantasia: formData.nomeFantasia,
      apelido: formData.apelido,
      endereco: formData.endereco,
      contato: formData.contato,
      responsavel: formData.responsavel.nome ? formData.responsavel : undefined,
      observacoes: formData.observacoes || undefined,
      isMatriz: formData.isMatriz,
    };

    await onSubmit(dto);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{loja ? 'Editar Loja' : 'Nova Loja'}</DialogTitle>
          <DialogDescription>
            {loja ? 'Altere os dados da loja' : 'Preencha os dados da nova loja'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{errors.general}</div>
          )}

          {/* Identificacao */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Identificacao da Loja</h3>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <InputCNPJ
                  label="CNPJ"
                  value={formData.cnpj}
                  onValueChange={(value) => setFormData({ ...formData, cnpj: value })}
                  error={errors.cnpj}
                  required
                />
                <div className="flex items-end">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isMatriz}
                      onChange={(e) => setFormData({ ...formData, isMatriz: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-slate-700">Esta e a loja matriz</span>
                  </label>
                </div>
              </div>
              <InputUppercase
                label="Razao Social"
                value={formData.razaoSocial}
                onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                error={errors.razaoSocial}
                required
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <InputUppercase
                  label="Nome Fantasia"
                  value={formData.nomeFantasia}
                  onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                  error={errors.nomeFantasia}
                  required
                />
                <InputUppercase
                  label="Apelido (exibido no seletor)"
                  value={formData.apelido}
                  onChange={(e) => setFormData({ ...formData, apelido: e.target.value })}
                  error={errors.apelido}
                  placeholder="Ex: LOJA CENTRO"
                  required
                />
              </div>
            </div>
          </div>

          {/* Endereco */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Endereco</h3>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <InputCEP
                  label="CEP"
                  value={formData.endereco.cep}
                  onValueChange={handleCEPChange}
                  error={errors.cep}
                  required
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Tipo <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.endereco.tipoLogradouro}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endereco: {
                          ...formData.endereco,
                          tipoLogradouro: e.target.value as TipoLogradouro,
                        },
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {TIPOS_LOGRADOURO.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>
                <InputUppercase
                  label="Numero"
                  value={formData.endereco.numero}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      endereco: { ...formData.endereco, numero: e.target.value },
                    })
                  }
                  error={errors.numero}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputUppercase
                  label="Logradouro"
                  value={formData.endereco.logradouro}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      endereco: { ...formData.endereco, logradouro: e.target.value },
                    })
                  }
                  disabled={isLoadingCEP}
                />
                <InputUppercase
                  label="Complemento"
                  value={formData.endereco.complemento || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      endereco: { ...formData.endereco, complemento: e.target.value },
                    })
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <InputUppercase
                  label="Bairro"
                  value={formData.endereco.bairro}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      endereco: { ...formData.endereco, bairro: e.target.value },
                    })
                  }
                  disabled={isLoadingCEP}
                />
                <InputUppercase
                  label="Cidade"
                  value={formData.endereco.cidade}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      endereco: { ...formData.endereco, cidade: e.target.value },
                    })
                  }
                  disabled={isLoadingCEP}
                />
                <InputUppercase
                  label="UF"
                  value={formData.endereco.uf}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      endereco: { ...formData.endereco, uf: e.target.value },
                    })
                  }
                  maxLength={2}
                  disabled={isLoadingCEP}
                />
              </div>
            </div>
          </div>

          {/* Contato */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Contato da Loja</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <InputTelefone
                label="Telefone Principal"
                value={formData.contato.telefonePrincipal}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    contato: { ...formData.contato, telefonePrincipal: value },
                  })
                }
                error={errors.telefonePrincipal}
                required
              />
              <InputCelular
                label="WhatsApp"
                value={formData.contato.whatsapp || ''}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    contato: { ...formData.contato, whatsapp: value },
                  })
                }
              />
              <InputUppercase
                label="E-mail Principal"
                type="email"
                isEmail
                value={formData.contato.emailPrincipal}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contato: { ...formData.contato, emailPrincipal: e.target.value },
                  })
                }
                error={errors.emailPrincipal}
                required
              />
              <InputUppercase
                label="E-mail Financeiro"
                type="email"
                isEmail
                value={formData.contato.emailFinanceiro || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contato: { ...formData.contato, emailFinanceiro: e.target.value },
                  })
                }
              />
            </div>
          </div>

          {/* Responsavel */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Responsavel (Opcional)</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <InputUppercase
                label="Nome"
                value={formData.responsavel.nome}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    responsavel: { ...formData.responsavel, nome: e.target.value },
                  })
                }
              />
              <InputCPF
                label="CPF"
                value={formData.responsavel.cpf}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    responsavel: { ...formData.responsavel, cpf: value },
                  })
                }
              />
              <InputCelular
                label="WhatsApp"
                value={formData.responsavel.whatsapp}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    responsavel: { ...formData.responsavel, whatsapp: value },
                  })
                }
              />
              <InputUppercase
                label="E-mail"
                type="email"
                isEmail
                value={formData.responsavel.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    responsavel: { ...formData.responsavel, email: e.target.value },
                  })
                }
              />
            </div>
          </div>

          {/* Observacoes */}
          <div>
            <TextareaUppercase
              label="Observacoes Gerais"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Anotacoes internas sobre a loja..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loja ? 'Salvar' : 'Adicionar'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
