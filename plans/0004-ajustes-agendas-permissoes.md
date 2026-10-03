# Correções de interface, agendas e permissões

## Execução do plano aprovado

- [ ] Permissões no servidor, compatibilidade e conversão do papel somente leitura com limite de vagas.
- [ ] Busca parcial sem distinguir caixa ou acentos, caracteres literais e autorização.
- [ ] Calendário: compromissos do dia, Minhas Agendas/Agendas da Equipe, privacidade e fuso.
- [ ] Tarefas: responsáveis múltiplos, migração, integrações, filtros e cores.
- [ ] Diretrizes/Arquivos: acesso Leitor/Editor individual ou por setor, ícones e exclusão direta.
- [ ] Contatos/Escritório: campos, ações, nomenclatura, foto e fundo.
- [ ] Regressão local, navegador com duas contas e commits atômicos.

## Relação com plano 0003

Este plano complementa marcos 2–7 de `0003-simplificacao-teron.md`, ainda abertos. Retoma seleção e privacidade de agendas em todas as visões, busca parcial e colunas de Contatos, permissões de Diretrizes, controles de Tarefas e aparência do Escritório. Validações anteriores não certificam os novos requisitos. Pendências exclusivas do plano 0003 (OTP, modelos de texto e convites do escritório) permanecem lá; não são consideradas concluídas por este plano.

## Limites de execução

Arquitetura Svelte/Rush existente. Migrações idempotentes preparadas e executadas apenas na stack descartável local. Nenhum push, deploy, publicação ou alteração de serviços externos. Testes junto ao código; integrações em `tests/`. Commits com identidade Git local e trailer Codex. Validação pelos hooks existentes, sem bypass.

## Progresso

Execução iniciada: checkout limpo; plano 0003 e regras comerciais lidos. Checkout não possui hook `pre-commit` instalado nem configuração Lefthook; commits normais serão usados sem bypass. Verificação funcional local será registrada por etapa.
