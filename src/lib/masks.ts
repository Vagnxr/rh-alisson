// Funcoes de mascara para campos formatados

export type MaskType = 'cpf' | 'cnpj' | 'celular' | 'telefone' | 'cep' | 'currency' | 'date';

// Remove todos caracteres nao numericos
export function onlyNumbers(value: string): string {
  return value.replace(/\D/g, '');
}

// Aplica mascara de CPF: 000.000.000-00
export function maskCPF(value: string): string {
  const numbers = onlyNumbers(value).slice(0, 11);
  return numbers
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

// Aplica mascara de CNPJ: 00.000.000/0000-00
export function maskCNPJ(value: string): string {
  const numbers = onlyNumbers(value).slice(0, 14);
  return numbers
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

// Aplica mascara de Celular: (00) 00000-0000
export function maskCelular(value: string): string {
  const numbers = onlyNumbers(value).slice(0, 11);
  return numbers
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

// Aplica mascara de Telefone Fixo: (00) 0000-0000
export function maskTelefone(value: string): string {
  const numbers = onlyNumbers(value).slice(0, 10);
  return numbers
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
}

// Aplica mascara de CEP: 00000-000
export function maskCEP(value: string): string {
  const numbers = onlyNumbers(value).slice(0, 8);
  return numbers.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
}

// Aplica mascara de moeda: R$ 0.000,00
export function maskCurrency(value: string): string {
  const numbers = onlyNumbers(value);
  if (!numbers) return '';
  
  const cents = parseInt(numbers, 10);
  const reais = (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return `R$ ${reais}`;
}

// Aplica mascara de data: 00/00/0000
export function maskDate(value: string): string {
  const numbers = onlyNumbers(value).slice(0, 8);
  return numbers
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2');
}

// Funcao generica que aplica mascara baseada no tipo
export function applyMask(value: string, type: MaskType): string {
  switch (type) {
    case 'cpf':
      return maskCPF(value);
    case 'cnpj':
      return maskCNPJ(value);
    case 'celular':
      return maskCelular(value);
    case 'telefone':
      return maskTelefone(value);
    case 'cep':
      return maskCEP(value);
    case 'currency':
      return maskCurrency(value);
    case 'date':
      return maskDate(value);
    default:
      return value;
  }
}

// Validacoes

export function isValidCPF(cpf: string): boolean {
  const numbers = onlyNumbers(cpf);
  if (numbers.length !== 11) return false;
  
  // Verifica se todos os digitos sao iguais
  if (/^(\d)\1+$/.test(numbers)) return false;
  
  // Validacao do primeiro digito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i], 10) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers[9], 10)) return false;
  
  // Validacao do segundo digito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i], 10) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(numbers[10], 10)) return false;
  
  return true;
}

export function isValidCNPJ(cnpj: string): boolean {
  const numbers = onlyNumbers(cnpj);
  if (numbers.length !== 14) return false;
  
  // Verifica se todos os digitos sao iguais
  if (/^(\d)\1+$/.test(numbers)) return false;
  
  // Validacao do primeiro digito verificador
  let size = numbers.length - 2;
  let digits = numbers.substring(0, size);
  const verifiers = numbers.substring(size);
  let sum = 0;
  let pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(digits.charAt(size - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(verifiers.charAt(0), 10)) return false;
  
  // Validacao do segundo digito verificador
  size = size + 1;
  digits = numbers.substring(0, size);
  sum = 0;
  pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(digits.charAt(size - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(verifiers.charAt(1), 10)) return false;
  
  return true;
}

export function isValidCelular(celular: string): boolean {
  const numbers = onlyNumbers(celular);
  return numbers.length === 11 && numbers[2] === '9';
}

export function isValidTelefone(telefone: string): boolean {
  const numbers = onlyNumbers(telefone);
  return numbers.length === 10;
}

export function isValidCEP(cep: string): boolean {
  const numbers = onlyNumbers(cep);
  return numbers.length === 8;
}

// Validacao de senha
export interface PasswordStrength {
  score: number; // 0-4
  label: 'Muito fraca' | 'Fraca' | 'Media' | 'Forte' | 'Muito forte';
  color: string;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

export function checkPasswordStrength(password: string | undefined | null): PasswordStrength {
  const pwd = password || '';
  
  const requirements = {
    minLength: pwd.length >= 8,
    hasUppercase: /[A-Z]/.test(pwd),
    hasLowercase: /[a-z]/.test(pwd),
    hasNumber: /[0-9]/.test(pwd),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
  };
  
  const passed = Object.values(requirements).filter(Boolean).length;
  
  const labels: PasswordStrength['label'][] = [
    'Muito fraca',
    'Fraca',
    'Media',
    'Forte',
    'Muito forte',
  ];
  
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-emerald-500',
  ];
  
  return {
    score: passed,
    label: labels[passed],
    color: colors[passed],
    requirements,
  };
}
