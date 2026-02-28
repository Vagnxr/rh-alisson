# Consulta CNPJ (ReceitaWS) – Contrato

O front chama o backend; o backend consulta a ReceitaWS. Evita CORS (não chama a ReceitaWS direto no browser).

## Contrato para o front

| Método | URL (com prefixo) | Auth |
|--------|-------------------|------|
| GET | /api/v1/consulta-cnpj?cnpj=12345678000199 | Bearer (JWT) |

- **Query:** `cnpj` obrigatório, 14 dígitos (pode enviar com ou sem máscara; o backend usa só os números).
- **Sucesso:** `{ success: true, data: { nome, fantasia, logradouro, numero, complemento, bairro, municipio, uf, cep, email, telefone, ... } }`.
- **Erro:** `{ success: false, error: { code, message } }` (ex.: CNPJ inválido, não encontrado, timeout, limite excedido).

O front usa o mesmo cliente `api` com o token; não chama a ReceitaWS direto no browser.

## Referência ReceitaWS

- [ReceitaWS API Documentation](https://developers.receitaws.com.br/)
- Base: `https://receitaws.com.br/v1` — GET `/cnpj/{cnpj}` (token em query para planos pagos).
