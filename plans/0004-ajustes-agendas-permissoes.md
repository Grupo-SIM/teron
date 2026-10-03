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

Calendário: painel de tarefas substituído por eventos, modos migrados para `mine`/`team`, seleção compartilhada entre lista e grade. Colaboradores consultados no workspace inteiro; suas identidades determinam agendas sem restringir por setor. Agenda selecionada é descartada quando sai do conjunto permitido. Eventos recorrentes e eventos que cruzam meia-noite usam expansão existente; intervalo do dia exclui eventos terminados no início ou iniciados no fim. Painel protege detalhes/ações de eventos privados. Traduções adicionadas nos 14 catálogos. Três testes de seleção/preferência/intervalo e parser de cinco componentes passaram. Build e regressão com duas contas ainda pendentes; marco permanece aberto.

Build Rush até `@hcengineering/time-resources` passou. Testes adicionais cobrem eventos de dia inteiro, sobreposição, ordenação, fronteiras exclusivas e privacidade (sete casos). Expansão oferece opção sem recorte para editar evento com datas originais; lista recorta apenas horário mostrado. Conferência visual continua pendente.

Contatos/Escritório: ação Mesclar contatos desregistrada; departamento legado de funcionário marcado oculto sem remover dado. Catálogo português já usava Funcionários/Externos/Clientes. Foto na edição ocupa largura/altura do squircle e mantém máscara existente, com recorte central cover. Seletor de andar usa token de fundo da tela, incluindo cartões selecionados. Conferência visual pendente.

Tarefas, controles: visão geral substitui filtros Atribuído/Ativo/Pendente/Criado/Inscrito, inclusive URLs legadas; botão de três pontos do detalhe só aparece após resolver ações disponíveis. Extensão Copiar tudo desregistrada. Cor da linha de grupo agora usa cor do status, igual ao ícone, e escolhe configuração do tipo de tarefa correto. Migração e seleção de múltiplos responsáveis permanecem pendentes.

Autorização em implementação: política distingue transações cliente e gatilhos internos; restringe alteração de tarefa a descrição/status (status exige atribuição, com leitura legada). Operadores estruturais e contadores cliente são recusados; lotes são inspecionados. Quatro testes de regras passaram. Integração da política e concessões de Diretrizes ainda em andamento, sem certificação da matriz completa.
