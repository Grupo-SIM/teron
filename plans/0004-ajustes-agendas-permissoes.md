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

Busca de listas/seletores: operador `$contains` implementado em memória, MongoDB e PostgreSQL, com consulta literal e normalização de caixa/acentos. Dezenove componentes passaram a usar o operador preservando filtros existentes. Três testes unitários passaram; runner local `dev/regression/search.mjs` validou dez consultas em MongoDB/PostgreSQL descartáveis, inclusive caracteres especiais, formas Unicode compostas/decompostas, filtro de espaço e paginação. Contêineres descartados após teste. Busca global/indexação ainda pendente.

Diretrizes/UI: catálogos portugueses usam Espaços de diretrizes nos contextos do módulo; remover ícone personalizado limpa ícone/cor e restaura fallback, com toast. Papel somente leitura retirado dos seletores e configuração de convidados desregistrada; proprietário vê contagem de contas legadas pendentes. Conversão segura por capacidade ainda pendente.

Autorização central conectada antes de efeitos internos de cache, contadores e persistência. Owner/Maintainer continuam sujeitos a acesso ao espaço; membros podem atualizar descrição de tarefa acessível e status somente quando atribuídos (lista ou legado), seus eventos/agendas, comentários, arquivos e preferências. Escritas estruturais, exclusões organizacionais e operadores de contador recusados. Dez testes de política/middleware passaram. Concessões Leitor/Editor e editor colaborativo ainda pendentes; matriz completa permanece aberta. Download autorizado das quatro imagens da regressão concluído, sem alterações externas além desse download.

Tarefas/responsáveis: lista única adicionada ao modelo de tarefas, templates e rascunhos. Editor múltiplo reutiliza seleção de funcionários; subtarefas, duplicação, tabelas, agrupamentos e colaboradores de notificações usam lista. Fronteira servidor converte gravações escalares legadas, deduplica, normaliza filhos de templates e grava somente lista; leitura legada preservada. Migrações em lotes com cursor fechado e estado idempotente preparadas para tarefas por domínio e templates. Dois testes da leitura e quatro testes da persistência passaram; build Rush dos quatro pacotes alterados passou. Regressão local de migração real, notificações e preferências antigas ainda pendente.

Conversão legada: entrada explícita `convertLegacyReadOnlyMembers` preparada, sem execução automática em leituras ou inicialização. Reconsulta contrato por conta; MongoDB e PostgreSQL serializam reserva, ocupação (incluindo convites) e comparação do papel original. Migração repetida mantém contas já convertidas; sem vaga mantém pendência; conta anônima/sistema excluída. Quatro testes unitários passaram (vagas disponíveis/insuficientes, workspace somente leitura, repetição e concorrência simulada). Build do pacote Account passou. Teste concorrente em banco real e execução da migração descartável ainda pendentes.

Busca global: campo wildcard normalizado e consulta literal implementados no Elasticsearch 7.14.2. Reconstrução explícita preenche apenas registros sem campo novo, sem mudar texto/index version; segunda execução não altera registros. Integração descartável em rede interna passou: começo/meio/fim, caixa/acentos, símbolos especiais, filtros de espaço, paginação, atualização e reconstrução repetida. Bootstrap Rush offline tentou instalar pnpm via npm e foi interrompido; dependências movidas para reciclagem foram restauradas. Vinculação adicional seguirá com ferramentas locais existentes. Nenhum novo download foi autorizado além das imagens já aprovadas.

Exclusão direta: ações de exclusão registradas para espaços ativos de Diretrizes/Arquivos, com confirmação explícita de descendentes, versões e anexos. Owner/Maintainer reutilizam fluxo existente. Coletores de descendentes agora restringem espaço; exclusão do espaço coleta todos seus documentos/arquivos/versões. Quatro testes de fronteira passaram, incluindo referência de pai em outro espaço. Traduções de confirmação sincronizadas nos 14 catálogos. Verificação real de blobs/referências e navegador ainda pendente.

Diretrizes/concessões: campos individuais e por setor adicionados; Editor prevalece, documentos herdam, owners preservam edição. Migração preserva membros como Editores sem alterar flag privada. Gatilho após persistência sincroniza membros efetivos, usando segurança existente para busca/links/realtime. UI observa concessões/setores; criação/edição e editor colaborativo consultam acesso real, inclusive RPC de leitura/edição. Três testes de regra, quatro de sincronização, sete de autorização e quatro de colaboração passaram; parser dos quatro componentes passou. Integração websocket, revogação real e migração descartável ainda pendentes. Build completo local encontrou ausência prévia de declarações de dependências; geração de código dos pacotes passou, sem certificar tipos.
