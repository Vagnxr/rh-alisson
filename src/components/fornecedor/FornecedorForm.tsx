import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InputCPF, InputCNPJ, InputCelular, InputTelefone } from '@/components/ui/inputs';
import { InputUppercase, TextareaUppercase } from '@/components/ui/input-uppercase';
import { InputEnderecoFornecedor } from './InputEnderecoFornecedor';
import type {
  Fornecedor,
  CreateFornecedorDto,
  UpdateFornecedorDto,
  TipoFornecedor,
  EnderecoFornecedor,
  ContatoEmpresa,
  ContatoVendedor,
} from '@/types/fornecedor';
import { fetchCNPJReceitaWS, onlyDigitsCnpj } from '@/lib/receitaws';

interface FornecedorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fornecedor?: Fornecedor;
  /** Quando aberto para novo fornecedor (sem fornecedor), preenche o campo CNPJ com este valor (ex.: vindo da tela Entrada). */
  initialCnpj?: string;
  onSubmit: (data: CreateFornecedorDto | UpdateFornecedorDto) => Promise<void>;
  isLoading?: boolean;
}

const defaultEndereco: EnderecoFornecedor = {
  cep: '',
  tipoLogradouro: 'Rua',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
};

const defaultContatoEmpresa: ContatoEmpresa = {
  telefonePrincipal: '',
  whatsapp: '',
  emailPrincipal: '',
  emailFinanceiro: '',
  site: '',
  instagram: '',
};

function mergeEndereco(from?: EnderecoFornecedor | null): EnderecoFornecedor {
  if (!from || typeof from !== 'object') return { ...defaultEndereco };
  return {
    ...defaultEndereco,
    ...from,
    tipoLogradouro: (from.tipoLogradouro as EnderecoFornecedor['tipoLogradouro']) || 'Rua',
    cep: from.cep ?? '',
    logradouro: from.logradouro ?? '',
    numero: from.numero ?? '',
    complemento: from.complemento ?? '',
    bairro: from.bairro ?? '',
    cidade: from.cidade ?? '',
    uf: from.uf ?? '',
  };
}

function mergeContatoEmpresa(from?: ContatoEmpresa | null): ContatoEmpresa {
  if (!from || typeof from !== 'object') return { ...defaultContatoEmpresa };
  return {
    ...defaultContatoEmpresa,
    ...from,
    telefonePrincipal: from.telefonePrincipal ?? '',
    whatsapp: from.whatsapp ?? '',
    emailPrincipal: from.emailPrincipal ?? '',
    emailFinanceiro: from.emailFinanceiro ?? '',
    site: from.site ?? '',
    instagram: from.instagram ?? '',
  };
}

const initialFormData = {
  tipo: 'cnpj' as TipoFornecedor,
  cnpj: '',
  razaoSocial: '',
  nomeFantasia: '',
  cpf: '',
  nomeCompleto: '',
  nomeComercial: '',
  endereco: defaultEndereco,
  contatoEmpresa: defaultContatoEmpresa,
  contatoVendedor: {
    nome: '',
    whatsapp: '',
    email: '',
  } as ContatoVendedor,
  observacoes: '',
  isAtivo: true,
};

export function FornecedorForm({
  open,
  onOpenChange,
  fornecedor,
  initialCnpj,
  onSubmit,
  isLoading = false,
}: FornecedorFormProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const lastFetchedCnpjRef = useRef<string | null>(null);

  useEffect(() => {
    if (fornecedor) {
      const endereco = mergeEndereco(fornecedor.endereco);
      const contatoEmpresa = mergeContatoEmpresa(fornecedor.contatoEmpresa);
      const contatoVendedor = fornecedor.contatoVendedor
        ? {
            nome: fornecedor.contatoVendedor.nome ?? '',
            whatsapp: fornecedor.contatoVendedor.whatsapp ?? '',
            email: fornecedor.contatoVendedor.email ?? '',
          }
        : initialFormData.contatoVendedor;
      if (fornecedor.tipo === 'cnpj') {
        setFormData({
          tipo: 'cnpj',
          cnpj: fornecedor.cnpj ?? '',
          razaoSocial: fornecedor.razaoSocial ?? '',
          nomeFantasia: fornecedor.nomeFantasia ?? '',
          cpf: '',
          nomeCompleto: '',
          nomeComercial: '',
          endereco,
          contatoEmpresa,
          contatoVendedor,
          observacoes: fornecedor.observacoes ?? '',
          isAtivo: fornecedor.isAtivo !== false,
        });
      } else {
        setFormData({
          tipo: 'cpf',
          cnpj: '',
          razaoSocial: '',
          nomeFantasia: '',
          cpf: fornecedor.cpf ?? '',
          nomeCompleto: fornecedor.nomeCompleto ?? '',
          nomeComercial: fornecedor.nomeComercial ?? '',
          endereco,
          contatoEmpresa,
          contatoVendedor,
          observacoes: fornecedor.observacoes ?? '',
          isAtivo: fornecedor.isAtivo !== false,
        });
      }
    } else {
      setFormData({
        ...initialFormData,
        cnpj: (initialCnpj ?? '').trim() || initialFormData.cnpj,
      });
    }
    const digits = fornecedor?.tipo === 'cnpj' ? onlyDigitsCnpj(fornecedor.cnpj ?? '') : onlyDigitsCnpj((initialCnpj ?? '').trim());
    lastFetchedCnpjRef.current = digits.length === 14 ? digits : null;
    setErrors({});
  }, [fornecedor, open, initialCnpj]);

  const handleBuscarCNPJ = async (cnpjInput?: string) => {
    const cnpj = cnpjInput ?? formData.cnpj;
    const digits = onlyDigitsCnpj(cnpj);
    if (digits.length !== 14) return;
    if (lastFetchedCnpjRef.current === digits) return;
    lastFetchedCnpjRef.current = digits;
    setLoadingCnpj(true);
    setErrors((e) => ({ ...e, cnpj: '' }));
    try {
      const data = await fetchCNPJReceitaWS(cnpj);
      if (!data) {
        toast.error('Não foi possível obter os dados do CNPJ. Tente novamente.');
        return;
      }
      const endereco: EnderecoFornecedor = {
        ...formData.endereco,
        cep: (() => {
          const raw = (data.cep ?? '').replace(/\D/g, '');
          if (raw.length === 8) return raw.replace(/^(\d{5})(\d{3})$/, '$1-$2');
          return formData.endereco.cep;
        })(),
        tipoLogradouro: 'Rua',
        logradouro: (data.logradouro ?? '').toUpperCase(),
        numero: (data.numero ?? '').toUpperCase(),
        complemento: (data.complemento ?? '').toUpperCase() || formData.endereco.complemento,
        bairro: (data.bairro ?? '').toUpperCase(),
        cidade: (data.municipio ?? '').toUpperCase(),
        uf: (data.uf ?? '').toUpperCase(),
      };
      const contatoEmpresa: ContatoEmpresa = {
        ...formData.contatoEmpresa,
        emailPrincipal: data.email ?? formData.contatoEmpresa.emailPrincipal,
        telefonePrincipal: data.telefone ?? formData.contatoEmpresa.telefonePrincipal,
      };
      setFormData((prev) => ({
        ...prev,
        razaoSocial: (data.nome ?? '').toUpperCase(),
        nomeFantasia: (data.fantasia ?? data.nome ?? '').toUpperCase(),
        endereco,
        contatoEmpresa,
      }));
      toast.success('Dados preenchidos pela Receita Federal. Revise e salve.');
    } catch {
      lastFetchedCnpjRef.current = null;
      toast.error('Erro ao consultar CNPJ.');
    } finally {
      setLoadingCnpj(false);
    }
  };

  const handleCnpjChange = (value: string) => {
    const digits = onlyDigitsCnpj(value);
    if (digits.length < 14) lastFetchedCnpjRef.current = null;
    setFormData({ ...formData, cnpj: value });
    if (digits.length === 14) handleBuscarCNPJ(value);
  };

  const handleCnpjBlur = () => {
    if (onlyDigitsCnpj(formData.cnpj).length === 14) handleBuscarCNPJ();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Únicos opcionais: complemento, telefone principal, contato vendedor. Demais obrigatórios.
    const newErrors: Record<string, string> = {};

    if (formData.tipo === 'cnpj') {
      if (!formData.cnpj?.trim()) newErrors.cnpj = 'CNPJ é obrigatório';
      if (!formData.razaoSocial?.trim()) newErrors.razaoSocial = 'Razão Social é obrigatória';
      if (!formData.nomeFantasia?.trim()) newErrors.nomeFantasia = 'Nome Fantasia é obrigatório';
    } else {
      if (!formData.cpf?.trim()) newErrors.cpf = 'CPF é obrigatório';
      if (!formData.nomeCompleto?.trim()) newErrors.nomeCompleto = 'Nome Completo é obrigatório';
      if (!formData.nomeComercial?.trim()) newErrors.nomeComercial = 'Nome Comercial é obrigatório';
    }

    const end = formData.endereco;
    if (!end.cep?.trim()) newErrors.endereco_cep = 'CEP é obrigatório';
    if (!end.logradouro?.trim()) newErrors.endereco_logradouro = 'Logradouro é obrigatório';
    if (!end.numero?.trim()) newErrors.endereco_numero = 'Número é obrigatório';
    if (!end.bairro?.trim()) newErrors.endereco_bairro = 'Bairro é obrigatório';
    if (!end.cidade?.trim()) newErrors.endereco_cidade = 'Cidade é obrigatória';
    if (!end.uf?.trim()) newErrors.endereco_uf = 'UF é obrigatória';

    const cont = formData.contatoEmpresa;
    if (!cont.whatsapp?.trim()) newErrors.whatsapp = 'WhatsApp é obrigatório';
    // E-mail Principal, E-mail Financeiro, Site e Instagram sao opcionais

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Monta o DTO
    if (formData.tipo === 'cnpj') {
      const dto: CreateFornecedorDto | UpdateFornecedorDto = {
        tipo: 'cnpj',
        cnpj: formData.cnpj,
        razaoSocial: formData.razaoSocial,
        nomeFantasia: formData.nomeFantasia,
        endereco: formData.endereco,
        contatoEmpresa: formData.contatoEmpresa,
        contatoVendedor: formData.contatoVendedor.nome ? formData.contatoVendedor : undefined,
        observacoes: formData.observacoes || undefined,
        isAtivo: formData.isAtivo,
      };
      await onSubmit(dto);
    } else {
      const dto: CreateFornecedorDto | UpdateFornecedorDto = {
        tipo: 'cpf',
        cpf: formData.cpf,
        nomeCompleto: formData.nomeCompleto,
        nomeComercial: formData.nomeComercial || undefined,
        endereco: formData.endereco,
        contatoEmpresa: formData.contatoEmpresa,
        contatoVendedor: formData.contatoVendedor.nome ? formData.contatoVendedor : undefined,
        observacoes: formData.observacoes || undefined,
        isAtivo: formData.isAtivo,
      };
      await onSubmit(dto);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{fornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
          <DialogDescription>
            {fornecedor
              ? 'Altere os dados do fornecedor'
              : 'Preencha os dados do novo fornecedor'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Fornecedor */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Tipo de Fornecedor <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="tipo"
                  value="cnpj"
                  checked={formData.tipo === 'cnpj'}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as TipoFornecedor })}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Pessoa Jurídica (CNPJ)</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="tipo"
                  value="cpf"
                  checked={formData.tipo === 'cpf'}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as TipoFornecedor })}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Pessoa Física (CPF)</span>
              </label>
            </div>
          </div>

          {/* Campos CNPJ */}
          {formData.tipo === 'cnpj' && (
            <div className="space-y-4">
              <div className="relative">
                <InputCNPJ
                  label="CNPJ"
                  value={formData.cnpj}
                  onValueChange={handleCnpjChange}
                  onBlur={handleCnpjBlur}
                  error={errors.cnpj}
                  hint="Preencha os 14 dígitos ou clique fora do campo para buscar dados na Receita Federal."
                  required
                />
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {loadingCnpj && (
                    <span className="flex items-center gap-1.5 text-sm text-slate-500">
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                      Consultando...
                    </span>
                  )}
                  {!loadingCnpj && onlyDigitsCnpj(formData.cnpj).length === 14 && (
                    <button
                      type="button"
                      onClick={() => handleBuscarCNPJ()}
                      className="text-sm font-medium text-emerald-600 hover:underline"
                    >
                      Buscar dados (Receita Federal)
                    </button>
                  )}
                </div>
                {loadingCnpj && (
                  <span className="absolute right-3 top-9 flex items-center text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </span>
                )}
              </div>
              <InputUppercase
                label="Razão Social"
                value={formData.razaoSocial}
                onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                error={errors.razaoSocial}
                required
              />
              <InputUppercase
                label="Nome Fantasia"
                value={formData.nomeFantasia}
                onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                error={errors.nomeFantasia}
                required
              />
            </div>
          )}

          {/* Campos CPF */}
          {formData.tipo === 'cpf' && (
            <div className="space-y-4">
              <InputCPF
                label="CPF"
                value={formData.cpf}
                onValueChange={(value) => setFormData({ ...formData, cpf: value })}
                error={errors.cpf}
                required
              />
              <InputUppercase
                label="Nome Completo"
                value={formData.nomeCompleto}
                onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                error={errors.nomeCompleto}
                required
              />
              <InputUppercase
                label="Nome Comercial"
                value={formData.nomeComercial}
                onChange={(e) => setFormData({ ...formData, nomeComercial: e.target.value })}
                error={errors.nomeComercial}
                required
              />
            </div>
          )}

          {/* Endereço - complemento opcional */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Endereço</h3>
            <InputEnderecoFornecedor
              value={formData.endereco}
              onChange={(endereco) => setFormData({ ...formData, endereco })}
              required
              errors={{
                cep: errors.endereco_cep,
                logradouro: errors.endereco_logradouro,
                numero: errors.endereco_numero,
                bairro: errors.endereco_bairro,
                cidade: errors.endereco_cidade,
                uf: errors.endereco_uf,
              }}
            />
          </div>

          {/* Contato Empresa - telefone principal opcional */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Contato Empresa</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <InputTelefone
                label="Telefone Principal (opcional)"
                value={formData.contatoEmpresa.telefonePrincipal || ''}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    contatoEmpresa: { ...formData.contatoEmpresa, telefonePrincipal: value },
                  })
                }
              />
              <InputCelular
                label="WhatsApp"
                value={formData.contatoEmpresa.whatsapp || ''}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    contatoEmpresa: { ...formData.contatoEmpresa, whatsapp: value },
                  })
                }
                error={errors.whatsapp}
                required
              />
              <InputUppercase
                label="E-mail Principal (opcional)"
                type="email"
                isEmail
                value={formData.contatoEmpresa.emailPrincipal}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contatoEmpresa: { ...formData.contatoEmpresa, emailPrincipal: e.target.value },
                  })
                }
                error={errors.emailPrincipal}
              />
              <InputUppercase
                label="E-mail Financeiro (opcional)"
                type="email"
                isEmail
                value={formData.contatoEmpresa.emailFinanceiro || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contatoEmpresa: { ...formData.contatoEmpresa, emailFinanceiro: e.target.value },
                  })
                }
                error={errors.emailFinanceiro}
              />
            </div>
          </div>

          {/* Contato Vendedor */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Contato Vendedor (Opcional)</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <InputUppercase
                label="Nome"
                value={formData.contatoVendedor.nome}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contatoVendedor: { ...formData.contatoVendedor, nome: e.target.value },
                  })
                }
              />
              <InputCelular
                label="WhatsApp"
                value={formData.contatoVendedor.whatsapp}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    contatoVendedor: { ...formData.contatoVendedor, whatsapp: value },
                  })
                }
              />
              <InputUppercase
                label="E-mail"
                type="email"
                isEmail
                value={formData.contatoVendedor.email}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contatoVendedor: { ...formData.contatoVendedor, email: e.target.value },
                  })
                }
              />
            </div>
          </div>

          {/* Status Ativo/Inativo */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Status <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-6">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="isAtivo"
                  checked={formData.isAtivo === true}
                  onChange={() => setFormData({ ...formData, isAtivo: true })}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Ativo</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="isAtivo"
                  checked={formData.isAtivo === false}
                  onChange={() => setFormData({ ...formData, isAtivo: false })}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Inativo</span>
              </label>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Inativos nao aparecem na lista principal e ficam na aba Inativos.
            </p>
          </div>

          {/* Observações */}
          <div>
            <TextareaUppercase
              label="Observações Gerais"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Anotações internas, alertas, histórico de negociação..."
              rows={4}
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
              {fornecedor ? 'Salvar' : 'Adicionar'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
