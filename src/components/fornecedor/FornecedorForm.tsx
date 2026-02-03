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

interface FornecedorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fornecedor?: Fornecedor;
  onSubmit: (data: CreateFornecedorDto | UpdateFornecedorDto) => Promise<void>;
  isLoading?: boolean;
}

const initialFormData = {
  tipo: 'cnpj' as TipoFornecedor,
  // CNPJ
  cnpj: '',
  razaoSocial: '',
  nomeFantasia: '',
  // CPF
  cpf: '',
  nomeCompleto: '',
  nomeComercial: '',
  // Endereço
  endereco: {
    cep: '',
    tipoLogradouro: 'Rua' as const,
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
  } as EnderecoFornecedor,
  // Contato Empresa
  contatoEmpresa: {
    telefonePrincipal: '',
    whatsapp: '',
    emailPrincipal: '',
    emailFinanceiro: '',
    site: '',
    instagram: '',
  } as ContatoEmpresa,
  // Contato Vendedor
  contatoVendedor: {
    nome: '',
    whatsapp: '',
    email: '',
  } as ContatoVendedor,
  // Outros
  observacoes: '',
};

export function FornecedorForm({
  open,
  onOpenChange,
  fornecedor,
  onSubmit,
  isLoading = false,
}: FornecedorFormProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (fornecedor) {
      if (fornecedor.tipo === 'cnpj') {
        setFormData({
          tipo: 'cnpj',
          cnpj: fornecedor.cnpj,
          razaoSocial: fornecedor.razaoSocial,
          nomeFantasia: fornecedor.nomeFantasia,
          cpf: '',
          nomeCompleto: '',
          nomeComercial: '',
          endereco: fornecedor.endereco,
          contatoEmpresa: fornecedor.contatoEmpresa,
          contatoVendedor: fornecedor.contatoVendedor || initialFormData.contatoVendedor,
          observacoes: fornecedor.observacoes || '',
        });
      } else {
        setFormData({
          tipo: 'cpf',
          cnpj: '',
          razaoSocial: '',
          nomeFantasia: '',
          cpf: fornecedor.cpf,
          nomeCompleto: fornecedor.nomeCompleto,
          nomeComercial: fornecedor.nomeComercial || '',
          endereco: fornecedor.endereco,
          contatoEmpresa: fornecedor.contatoEmpresa,
          contatoVendedor: fornecedor.contatoVendedor || initialFormData.contatoVendedor,
          observacoes: fornecedor.observacoes || '',
        });
      }
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [fornecedor, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validações básicas
    const newErrors: Record<string, string> = {};

    if (formData.tipo === 'cnpj') {
      if (!formData.cnpj) newErrors.cnpj = 'CNPJ é obrigatório';
      if (!formData.razaoSocial) newErrors.razaoSocial = 'Razão Social é obrigatória';
      if (!formData.nomeFantasia) newErrors.nomeFantasia = 'Nome Fantasia é obrigatório';
    } else {
      if (!formData.cpf) newErrors.cpf = 'CPF é obrigatório';
      if (!formData.nomeCompleto) newErrors.nomeCompleto = 'Nome Completo é obrigatório';
    }

    if (!formData.contatoEmpresa.emailPrincipal) {
      newErrors.emailPrincipal = 'E-mail Principal é obrigatório';
    }

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
      };
      await onSubmit(dto);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
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
              <InputCNPJ
                label="CNPJ"
                value={formData.cnpj}
                onValueChange={(value) => setFormData({ ...formData, cnpj: value })}
                error={errors.cnpj}
                required
              />
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
              />
            </div>
          )}

          {/* Endereço */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Endereço</h3>
            <InputEnderecoFornecedor
              value={formData.endereco}
              onChange={(endereco) => setFormData({ ...formData, endereco })}
            />
          </div>

          {/* Contato Empresa */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Contato Empresa</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <InputTelefone
                label="Telefone Principal"
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
              />
              <InputUppercase
                label="E-mail Principal"
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
                required
              />
              <InputUppercase
                label="E-mail Financeiro"
                type="email"
                isEmail
                value={formData.contatoEmpresa.emailFinanceiro || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contatoEmpresa: { ...formData.contatoEmpresa, emailFinanceiro: e.target.value },
                  })
                }
              />
              <InputUppercase
                label="Site"
                type="url"
                value={formData.contatoEmpresa.site || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contatoEmpresa: { ...formData.contatoEmpresa, site: e.target.value },
                  })
                }
              />
              <InputUppercase
                label="Instagram"
                value={formData.contatoEmpresa.instagram || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    contatoEmpresa: { ...formData.contatoEmpresa, instagram: e.target.value },
                  })
                }
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
