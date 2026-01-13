# Observabilidade

## Logs

### Console (Desenvolvimento)
```typescript
// Usar apenas em dev
if (import.meta.env.DEV) {
  console.log('Debug info:', data);
}
```

### Logs Estruturados (Producao)
A definir ferramenta de monitoramento.

## Erros

### Error Boundaries
Capturar erros de renderizacao:
```typescript
<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>
```

### Tratamento de Erros de API
```typescript
try {
  const data = await api.get('/endpoint');
} catch (error) {
  // Log do erro
  logError(error);
  // Feedback ao usuario
  toast.error('Erro ao carregar dados');
}
```

## Metricas

### Performance
- Core Web Vitals (LCP, FID, CLS)
- Tempo de carregamento de paginas
- Tempo de resposta de acoes

### Uso
- Paginas mais acessadas
- Acoes mais executadas
- Erros mais frequentes

## Ferramentas (Futuro)

### Opcoes a Avaliar
- Sentry (erros)
- Google Analytics (uso)
- Vercel Analytics (performance)
- LogRocket (sessoes)

## Alertas

### Tipos de Alerta
- Erros criticos (ex.: falha em salvar dados)
- Degradacao de performance
- Limites de uso excedidos

## Boas Praticas

### Nao Logar
- Dados sensiveis (senhas, tokens)
- Dados pessoais (sem necessidade)
- Logs excessivos em producao

### Logar
- Erros com contexto suficiente
- Acoes importantes de usuario
- Metricas de performance
