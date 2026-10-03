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

Tarefas/integrações adicionais: auditoria encontrou usos escalares em Minhas tarefas, cabeçalho genérico e agenda pessoal. Leituras verificam participação na lista com fallback legado; editor genérico usa seleção múltipla; novas gravações do apresentador usam lista. Agenda pessoal cria item para cada atribuído, preserva trabalho dos mantidos e encerra só removidos; reabertura cria item ativo sem apagar histórico. Três testes de reconciliação passaram e parser dos componentes alterados passou. Geração de código dos recursos de tempo e política servidor passou. Regressão real continua pendente.

Conversão legada/regressão real: entrada de migração executada em MongoDB e PostgreSQL descartáveis, em rede interna. Passaram capacidade disponível/insuficiente, convites pendentes consumindo vagas, duas execuções concorrentes pela última vaga e repetição. Só uma conversão consumiu a última vaga; proprietários preservados. Recursos descartados pelo runner. Teste novo em `server/account/src/tests/`; nenhuma migração remota executada.

Calendário/servidor: leituras, projeções, lookups, consultas por detalhes, agregações e busca global protegem eventos privados alheios mesmo para Owner. Realtime envia payload só ao dono e invalidação sem conteúdo aos demais. Exclusão de evento próprio tem ação específica, incluindo recorrência, sem conceder exclusão organizacional. Criação valida agenda própria e pai real; itens pessoais não permitem alteração indireta de status de tarefa não atribuída. Quinze testes de autorização/privacidade passaram; geração de código passou. Build web repetido com dependências restauradas passou. Bundles sendo atualizados para regressão real; marco Calendário permanece aberto até navegador/integração.

Regressão real detectou ausência de operadores lógicos no PostgreSQL e em memória: `$and` era tratado como campo, produzindo `text = text[]`. Suporte recursivo `$and`/`$or` adicionado, mantendo ordenação e deduplicando alternativas; consultas vazias têm identidade correta e cláusulas malformadas falham. Busca `$search` continua no topo ao intersectar privacidade. Dois testes em memória passaram; sete grupos da regressão existente passaram novamente contra bundles atualizados e PostgreSQL descartável, incluindo consultas com novos filtros de privacidade. Verificações específicas de concessões/calendário/migrações ainda em andamento.

Regressão específica com duas contas passou: privacidade de eventos explícitos/herdados, predicados de detalhes, concessões individuais/por setor, precedência Editor, negação de exclusão, revogação após saída do setor e status restrito aos atribuídos. Corrigida identidade removida pela compactação de consultas no middleware de lookup; sete testes de privacidade passaram, incluindo metadados/lookup compactado. Migrações reais e navegador permanecem pendentes.

Migração real em PostgreSQL passou duas execuções: responsável escalar vira lista, ausência vira lista vazia, filhos/netos de template normalizados e membros existentes preservados como Editores em espaço privado. Teste encontrou atualização mista de campos/operadores incompatível com adapter; gravação e `$unset` separados. Runner local versionado, nenhuma migração externa. RPC colaborativo passou leitura de Leitor, escrita de Editor e bloqueio de leitura/escrita após revogação.

Realtime: filtro de privacidade agora antecede roteamento genérico por espaço, pois broadcast usa primeira regra aplicável. Teste com regra genérica já instalada passou; sete testes de privacidade continuam aprovados.

Auditoria adicional da busca: seletores de referência e filtro genérico em onze pacotes passaram de `$like`/curingas para `$contains` literal normalizado, incluindo tarefas, contatos, documentos, arquivos, etiquetas e reuniões. Build web das duas configurações passou. Compilador TypeScript isolado de pacotes de recursos não oferece loader Svelte; validação desses recursos usa build web existente.

Privacidade adicional: anexos de eventos protegidos em consultas diretas, lookups e broadcast, com nove testes unitários aprovados. Exclusões de eventos/anexos privados chegam ao Elasticsearch antes de ranking/limite/total; integração Elasticsearch passou contagem autorizada com limite de um resultado. Regra mantém contagem do backend quando filtro foi honrado, sem expor contagem privada de serviços antigos.

Regressão específica ampliada passou sete grupos reais: anexos privados e realtime sem payload, exclusão de espaços ativos com limpeza de blobs/versões/descendentes e isolamento entre espaços, RPC/websocket Reader/Editor/revogação, autorização atômica de lote, contatos protegidos, múltiplos/zero responsáveis, colaboradores de notificações deduplicados e um item pessoal por atribuído. Runner encerra também transporte websocket para liberar timers.

Rascunhos/subtarefas: gravação local normaliza listas recursivamente e remove campo escalar, mantendo leitura legada opcional. Três testes do helper e parser de cinco componentes passaram. Cabeçalho genérico bloqueia estrutura para membros e status quando não atribuídos; servidor continua validando todos os caminhos.

Validação retomada após reinício local: build web atual passou nas duas configurações; Calendário com duas contas passou no navegador (Minhas Agendas/equipe, detalhes próprios e ocupado privado alheio). Runner específico agora prepara estado ativo e aguarda gatilhos assíncronos para conferir agendas pessoais em reexecuções. Cabeçalho vertical genérico mantém edição de status para membro atribuído, isolada dos campos estruturais.

Contatos: navegação e títulos usam chaves plurais existentes (Funcionários, Externos, Clientes), preservando catálogos sincronizados. Conferência autenticada das três seções passou no navegador.

Navegador ampliado: eventos de dia inteiro e atravessando meia-noite passaram, incluindo recorte 00:00–01:00; token de fundo de troca de andar passou em CSS claro/escuro. Captura com foto detectou wrappers internos ainda limitando avatar: correção expande apresentador/link/contêiner, mantendo máscara e cover. Teste mede largura/altura da imagem contra célula inteira, evitando falso positivo por contêiner interno pequeno. Verificação final dessa correção em andamento.

Foto validada no navegador: largura e altura iguais à célula inteira, cover e máscara preservados; nova captura confirma preenchimento do squircle. Build web com correção passou nas duas configurações.
