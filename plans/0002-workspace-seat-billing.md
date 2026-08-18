# Gestão e cobrança de vagas do workspace

## Progresso

- [x] Documentar regras comerciais.
- [x] Implementar contratos, persistência e integração Simintpay no account service.
- [x] Fechar todos os caminhos de entrada contra excesso de vagas.
- [x] Evoluir membros, convites e Billing.
- [x] Atualizar textos públicos, testes e validação.

## Validação

- Account: 189 testes direcionados aprovados.
- Builds: account, account-service, pod-payment, account-client, setting-resources e billing-resources aprovados.
- Svelte check: setting-resources aprovado; billing-resources mantém somente erros preexistentes em `presentation/src/file.ts`.
- Nenhuma migração remota, chamada mutável externa, deploy ou push executado.
