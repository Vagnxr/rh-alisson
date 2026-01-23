// Exportacao central de todos os componentes de input

export {
  InputMasked,
  InputCPF,
  InputCNPJ,
  InputCelular,
  InputTelefone,
  InputCEP,
  InputCurrency,
  InputDate,
  type InputMaskedProps,
  type SpecializedInputProps,
} from './input-masked';

export { InputPassword, type InputPasswordProps } from './input-password';

export { InputEndereco, type EnderecoData } from './input-endereco';

export {
  InputUppercase,
  TextareaUppercase,
  type InputUppercaseProps,
  type TextareaUppercaseProps,
} from './input-uppercase';

// Re-exporta utilitarios de mascara para uso direto se necessario
export {
  applyMask,
  onlyNumbers,
  maskCPF,
  maskCNPJ,
  maskCelular,
  maskTelefone,
  maskCEP,
  maskCurrency,
  maskDate,
  isValidCPF,
  isValidCNPJ,
  isValidCelular,
  isValidTelefone,
  isValidCEP,
  checkPasswordStrength,
  type MaskType,
  type PasswordStrength,
} from '@/lib/masks';

/*
 * ====================================
 * GUIA DE USO DOS COMPONENTES
 * ====================================
 *
 * IMPORTACAO:
 * import { InputCPF, InputCNPJ, InputCelular, InputPassword } from '@/components/ui/inputs';
 *
 * ------------------------------------
 * InputCPF - Campo com mascara de CPF
 * ------------------------------------
 * <InputCPF
 *   label="CPF"
 *   value={cpf}
 *   onValueChange={(masked, raw) => setCpf(masked)}
 *   required
 * />
 *
 * Props:
 * - value: string (valor mascarado)
 * - onValueChange: (maskedValue, rawValue) => void
 * - showValidation: boolean (mostra icone de validacao - default true)
 * - label: string (label do campo)
 * - error: string (mensagem de erro)
 * - hint: string (texto de ajuda)
 *
 * ------------------------------------
 * InputCNPJ - Campo com mascara de CNPJ
 * ------------------------------------
 * <InputCNPJ
 *   label="CNPJ"
 *   value={cnpj}
 *   onValueChange={(masked) => setCnpj(masked)}
 * />
 *
 * ------------------------------------
 * InputCelular - Campo com mascara de celular
 * ------------------------------------
 * <InputCelular
 *   label="Celular"
 *   value={celular}
 *   onValueChange={(masked) => setCelular(masked)}
 * />
 * Formato: (00) 00000-0000
 *
 * ------------------------------------
 * InputTelefone - Campo com mascara de telefone fixo
 * ------------------------------------
 * <InputTelefone
 *   label="Telefone"
 *   value={telefone}
 *   onValueChange={(masked) => setTelefone(masked)}
 * />
 * Formato: (00) 0000-0000
 *
 * ------------------------------------
 * InputCEP - Campo com mascara de CEP
 * ------------------------------------
 * <InputCEP
 *   label="CEP"
 *   value={cep}
 *   onValueChange={(masked) => setCep(masked)}
 * />
 * Formato: 00000-000
 *
 * ------------------------------------
 * InputCurrency - Campo com mascara de moeda
 * ------------------------------------
 * <InputCurrency
 *   label="Valor"
 *   value={valor}
 *   onValueChange={(masked) => setValor(masked)}
 * />
 * Formato: R$ 0.000,00
 *
 * ------------------------------------
 * InputPassword - Campo de senha com validacao
 * ------------------------------------
 * <InputPassword
 *   label="Senha"
 *   value={senha}
 *   onValueChange={(value) => setSenha(value)}
 *   showStrength        // Mostra barra de forca
 *   showRequirements    // Mostra lista de requisitos
 * />
 *
 * Props:
 * - value: string
 * - onValueChange: (value) => void
 * - showStrength: boolean (mostra barra de forca)
 * - showRequirements: boolean (mostra lista de requisitos)
 * - label: string
 * - error: string
 * - hint: string
 *
 * ------------------------------------
 * InputMasked - Componente generico
 * ------------------------------------
 * <InputMasked
 *   mask="cpf" | "cnpj" | "celular" | "telefone" | "cep" | "currency" | "date"
 *   value={valor}
 *   onValueChange={(masked, raw) => setValor(masked)}
 *   showValidation
 * />
 *
 * ====================================
 * VALIDACOES DISPONIVEIS
 * ====================================
 *
 * import { isValidCPF, isValidCNPJ, isValidCelular } from '@/components/ui/inputs';
 *
 * if (isValidCPF(cpf)) { ... }
 * if (isValidCNPJ(cnpj)) { ... }
 * if (isValidCelular(celular)) { ... }
 *
 * ====================================
 * FORCA DE SENHA
 * ====================================
 *
 * import { checkPasswordStrength } from '@/components/ui/inputs';
 *
 * const strength = checkPasswordStrength(senha);
 * console.log(strength.score);       // 0-5
 * console.log(strength.label);       // 'Muito fraca' | 'Fraca' | 'Media' | 'Forte' | 'Muito forte'
 * console.log(strength.requirements); // { minLength, hasUppercase, hasLowercase, hasNumber, hasSpecial }
 */
