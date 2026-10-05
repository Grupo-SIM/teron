# Simplificação progressiva do Teron

## Progresso

- [x] 1. Corrigir modal de setor, exclusão do registro selecionado, fotos e troca de escritório.
- [x] 2. Ajustar nomes, traduções e abas do navegador.
- [x] 3. Reorganizar tarefas, projetos, status, tempo e modelos.
- [x] 4. Corrigir calendário, privacidade e agendas compartilhadas.
- [x] 5. Corrigir drawer, andares e ações do escritório.
- [x] 6. Simplificar contatos e remover Recrutamento, RH e Planejador de equipes.
- [x] 7. Simplificar ações, Conversa, Diretrizes e Configurações.
- [x] 8. Conferir regressões e todos os itens aprovados.

## Decisões

- `Project` aparece como **Setor** e `Milestone` como **Projeto**. IDs e URLs permanecem.
- Abas internas cedem lugar a abas reais do navegador.
- Status de tarefas: Backlog e Todo → Pendente; In Progress → Em andamento; novo Revisão; Done → Finalizado; Canceled → Ajustes.
- Tempo gasto soma intervalos corridos em Pendente, Em andamento e Revisão, inclusive após reabertura.
- Candidatos permanecem como contatos Externos; dados próprios de Recrutamento são removidos. Remoto e Presencial passam a dias opcionais por semana, sem inferir número de booleanos antigos.
- Atributo visível Colaboradores é removido; vínculo interno para notificações permanece.
- Evento privado de outra pessoa mostra horário ocupado sem detalhes.
- Desbloqueio de Diretrizes cabe a Owner e Maintainer.
- Migrações são preparadas e testadas localmente; nenhuma execução em banco remoto.

## Resultado final — 04/10/2026

Plano concluído no escopo funcional registrado. Sete cenários de navegador validados com Owner/User: privacidade e seleção de agendas; contatos, diretrizes, foto e temas do escritório; substituição/restauração de identidade por OTP; drawer e convite real recebido/recusado; funções múltiplas, busca parcial e dias opcionais; criação/listagem/inserção de modelos sem publicação; menus simplificados e tarefa em aba real com `window.opener` nulo. Seis passaram na rodada final; o cenário de modelos passou na repetição após limitar seu seletor ao botão do comentário.

Também passaram sete grupos do runner base, sete do runner complementar, doze testes de autorização e inicialização dos IDs de modelos. Bundle web completo recompilou com sucesso; builds de servidor e pacotes afetados e testes de tempo/migração/visibilidade estão registrados no histórico.

Regressão corrigiu sincronização de identidade verificada, presença online da própria conta, handles de eventos privados, editor de coleções de contatos, busca parcial na navegação real e strings públicas de modelos sem IDs duplicados. Testes e preparação da stack descartável ficam versionados para repetição.

Imagens originais não estão disponíveis neste checkout; conferência funcional e capturas locais não certificam comparação pixel a pixel com essas imagens. Convite foi recebido e recusado, sem iniciar mídia externa.

Somente trabalho local. Stack `teron-regression`, seus volumes e arquivos temporários de autenticação/resultados foram descartados ao fechar. Nenhum push, deploy ou migração remota.

## Histórico de execução

Modelos de texto concluídos em 04/10: strings de criação publicadas no plugin base e retiradas do merge de recursos para evitar IDs duplicados. Inicialização direta dos IDs e bundle web passaram. Navegador criou, listou, selecionou e inseriu modelo no editor de comentário como rascunho; DOM e PostgreSQL confirmaram ausência de publicação. Teste passou (1/1). A seleção do botão foi limitada ao comentário, pois descrição também oferece modelos.

Entradas abaixo registram etapas anteriores. Pendências históricas não substituem o estado atual do progresso acima.

Contatos validados no navegador em 04/10: duas funções aparecem mesmo com contador desatualizado, busca parcial encontra nomes semelhantes, dias opcionais validam soma e persistem campos vazios. Remover/reinserir Designer preserva Redação, habilidades e etiquetas. Editor de coleções agora usa InlineAttributeBarEditor; busca do SpecialView usa nome parcial para contatos. Teste completo passou (1/1).

Calendário validado no navegador em 04/10 com Owner/User: agendas próprias/equipe, seleção de agenda pública/privada, compromissos de dia inteiro e meia-noite, títulos privados ocultos e blocos ocupados sem popup, menu, arraste ou redimensionamento. Handles do Calendário principal agora verificam visibilidade e permissão de edição, como o conteúdo do evento. Primeiro teste da suíte final passou (1/1).

Regressão OTP concluída em 04/10: User substituiu e restaurou e-mail pelo código real do PostgreSQL descartável. Teste de navegador conferiu chaves, valores e exclusões em identidades globais/locais, incluindo recarregamento. Autorização do servidor agora permite sincronizar somente identidades verificadas pelo serviço de contas e vinculadas à própria pessoa; doze testes cobrem presença online da própria conta, falsificação, vínculo estrangeiro e demais permissões. Convites também passaram: duas contas receberam e recusaram convite real pelo Pulse local; drawer expandiu, minimizou e selecionou andar. Teste automatizado repetiu o fluxo (1/1). Logs de login também revelaram bloqueio da presença online do próprio User; autorização permite apenas criar/atualizar booleano online da própria conta. Build de servidor e doze testes de autorização passaram. Modelos de texto e auditoria visual restante continuam em execução.

Retomada em 04/10: workspace descartável foi recriado. Runner base agora prepara pessoas, identidades verificadas e mixin de funcionário com papel de login antes de testar tarefas; runner de ajustes reutiliza pessoa existente por `personUuid` em vez de criar duplicata. Sete grupos de backend e o runner de ajustes passaram. Login de User também abriu Configurações após completar fixture. Testes de navegador continuam nos fluxos de modelos e OTP.

Encerramento desta etapa: stack descartável, preparação dos bundles e runner de regressão foram versionados em `dev/docker-compose.regression.yaml`, `dev/regression/` e `dev/tool/tests/simplification.ts`. Runner prepara workspace/Owner/User locais, repete sete grupos de regressão e deixa fixtures para conferência visual. Compose validado; scripts de preparação passaram pela verificação de sintaxe. Build web completo passou antes da correção adicional do Calendário principal, que teve build de pacotes e parser próprios aprovados. Nenhum push, deploy, migração ou seed remoto foi executado.

Plano permanece aberto: privacidade visual em todas as visões, seleção de agenda na tela principal, criação/inserção de modelos de texto sem publicação, drawer/convites de escritório, substituição de e-mail por OTP e auditoria final de menus/formulários ainda exigem regressão real no navegador. Os marcos 2–8 continuam desmarcados para não apresentar essa validação como concluída.

Calendário principal também foi corrigido: consulta agendas acessíveis, oferece seleção individual e mantém tratamento de privacidade existente. Seletor compartilhado com a visão genérica evita implementações divergentes. Build até `@hcengineering/time-resources` passou; os três componentes Svelte alterados passaram pelo preprocessamento/parser. Regressão visual da seleção com duas contas permanece pendente.

Fechamento retomado com autorização explícita para baixar imagens Docker e subir stack de teste local. Compose antigo falhou em imagens inexistentes; variante isolada usa bundles do checkout atual, PostgreSQL, Redpanda e MinIO próprios, portas em localhost e integrações externas desativadas. Duas contas descartáveis entraram no mesmo workspace por convite, como Owner e User.

Regressão real encontrou erro não coberto pelo teste antigo de tempo: gatilhos consultam a tarefa depois de persistir o status, portanto comparar o status armazenado com o recebido impedia finalizar o intervalo. Gatilho agora calcula a transição pelo `trackingStartedOn` persistido. Teste do gatilho reproduz o documento pós-transação; seis testes de cálculo e um de gatilho passaram. Build dos recursos de Tracker passou. No PostgreSQL local, Finalizado acumulou uma hora, pausou contador, atualizou o resumo do pai e Revisão reabriu sem perder o acumulado.

Sete grupos de regressão de backend passaram com duas contas: funções múltiplas e coleções isoladas; busca parcial sem distinguir maiúsculas; dias opcionais; agendas/eventos; desbloqueio rejeitado para User por `null` e `$unset`, permitido para Owner e Maintainer; troca do titular de escritório; exclusão da função selecionada removendo suas referências em duas pessoas sem afetar função semelhante, habilidades ou etiquetas. Conferência visual, modelos de texto e substituição de identidade continuam em execução antes de fechar marcos 2–8.

Mensagem de acesso somente leitura também usa Setores, encerrando os rótulos genéricos residuais de `Project` encontrados nos catálogos portugueses. Projetos ainda designa `Milestone` e módulos separados de SGQ/testes.

Editor de Função e Habilidades consultava todas as referências de etiquetas da pessoa sem distinguir coleção; lista e exclusão podiam atingir atributo diferente. Consulta agora restringe `collection` ao atributo atual. Editores genéricos de etiquetas individuais e em lote também limitam busca e exclusão a `labels`; callback ignora referência removida enquanto popup está aberto. Validar dois valores e registros semelhantes em conta local.

Auditoria da nomenclatura `Project` encontrou rótulos legados ainda visíveis no tipo de setor, criação de espaço de trabalho e agrupamento do Calendário. Catálogos `pt` e `pt-br` agora exibem Setor nesses contextos; Projetos de SGQ e testes mantêm sua terminologia própria.

Regra de visibilidade do Calendário isolada e coberta por quatro testes: proprietário sem `createdBy`, evento privado/livre para outra conta, agenda ausente ou privada e evento explicitamente público.

Eventos próprios antigos sem `createdBy` agora mostram detalhes ao titular, alinhando `isVisible` ao tratamento de eventos próprios no filtro do Calendário; permissão de edição continua independente. Regressão em conta local pendente.

Privacidade do Calendário também passa a ocultar detalhes enquanto a agenda do evento ainda não foi carregada ou não está acessível. Eventos explicitamente públicos e eventos próprios seguem visíveis. Validar com duas contas locais.

Visão do Calendário de equipe agora impede menu contextual de evento privado alheio, acompanhando o bloqueio do editor e do menu da visão comum. Exibição de horário ocupado permanece; testar com duas contas locais.

Auditoria adicional do marco 2: rótulos plurais de documentos em Cartões e Conversa agora exibem Diretrizes nos catálogos `pt` e `pt-br`. Documentos controlados do SGQ permanecem com nome próprio; nomes genéricos de arquivos e documentos continuam descritivos.

Marco 2 em andamento. Abas internas removidas da interface; ação Abrir em nova aba usa aba real do navegador. Migração local idempotente remove preferências das abas antigas. Termos principais de setores, projetos, contatos, diretrizes, plano e arquivos atualizados em pt-BR. Nomes padrão de salas e canal Aleatório traduzidos sem alterar IDs.

Marco 3 iniciado em paralelo: filtros Todos/Planejados/Ativos/Concluídos retirados da lista de projetos; status de projeto Pendente e Em andamento recebem rótulos pedidos, Em andamento azul e Cancelado vermelho. Seletor Todos/Ativo/Backlog retirado da lista de tarefas. Filtrar abre ao mover cursor ou focar com teclado.

Marco 7 iniciado: botão de configuração avançada da visão retirado do componente compartilhado, preservando opções usuais de ordenação/agrupamento e seleção Lista/Quadro.

Configuração avançada de classe também saiu do cabeçalho compartilhado dos atributos. Blocos continuam expansíveis e atributos editáveis conforme permissão. Rever demais atalhos para telas de customização na regressão final.

Marco 4 iniciado: Todo o dia, Fuso horário e Repetir agora usam controles independentes; Ocupado/Livre removido da escolha; agenda privada de outra pessoa mostra somente bloco ocupado com horário, sem ações de contexto. Calendário principal lista agendas acessíveis e permite escolher uma. Seletor de agenda na criação de evento ocultado mantendo agenda padrão.

Criação de evento agora usa privacidade fixa e oculta o seletor de visibilidade: horário alheio continua ocupado sem revelar detalhes. Edição de eventos existentes mantém o estado atual. Validar com duas contas locais antes de concluir o marco 4.

Categorias “Não planejado” e “Tarefas pendentes” retiradas do painel do Calendário. Preferência antiga pela categoria removida abre em Planejado; tarefas agendadas continuam na lista.

Marco 5 iniciado: miniaturas do drawer permitem ações sobre salas e pessoas; clique no corpo expande/minimiza, clique no nome seleciona andar; andar minimizado ocupa cartão compacto. Opção Sala de equipe removida.

Recrutamento, RH e Planejador de equipes ocultos na navegação enquanto migrações de dados são preparadas. Configurações do escritório removidas da lista de configurações. Desbloqueio de Diretrizes limitado a Owner/Maintainer na UI e na função cliente; confirmação de exclusão usa “este documento”. A autorização de desbloqueio no servidor ainda requer verificação antes do fechamento do marco 7.

Aplicativos de Recursos Humanos e Planejador de equipes agora deixam de ser registrados no modelo; atalho para Planejador de equipes removido. Tipos de dados legados permanecem para compatibilidade durante a retirada gradual.

Ações contextuais específicas de RH também deixam de ser registradas, inclusive associação de departamento em contatos. Dados e notificações legados continuam preservados até definição de migração segura.

Registro do aplicativo de Recrutamento, atalhos de navegação, categorias de busca e ações para criar candidaturas pelo menu de contatos removidos do modelo. Tipos legados permanecem registrados enquanto a migração de dados e a limpeza segura são concluídas.

Registro de ações, painel e notificações específicas de entrevistas de Recrutamento desativado; documentos legados permanecem legíveis para a migração.

Middleware do servidor agora rejeita transações que limpam `lockedBy` em Diretrizes para contas abaixo de Maintainer, inclusive via `$unset`; conta de sistema permanece autorizada. Teste local das duas formas de desbloqueio passou. Validar integração com contas User e Maintainer em banco local antes de fechar marco 7.

Botão 2FA posicionado abaixo da descrição. Ação Entrar removida do menu de conta de convidados; Sair permanece para contas autenticadas.

Gerenciamento de identidades agora abre diretamente o formulário de E-mail. Após validar o código do novo endereço, identidades de e-mail antigas são liberadas e marcadas como removidas no espaço de trabalho. Conferir o fluxo completo com conta de teste local antes de fechar o marco 7.

Notificações agora exibe apenas os grupos de preferências Geral e Som e aparência; subtelas por categoria não são renderizadas mesmo por URL antiga.

Tabelas padrão de contatos enxugadas para nome, localização, função (quando pessoa) e informações de contato. Apresentação de funções consulta coleção correta mesmo quando contador está desatualizado, permitindo mostrar múltiplas funções.

Buscas das listas Contatos, Funcionários e Usuários usam correspondência parcial e sem distinção entre maiúsculas e minúsculas por meio do operador `$like`, já suportado pelos adaptadores locais.

Tabelas Pessoa, Funcionário e Cliente agora restringem colunas às configurações aprovadas por `strict`, impedindo colunas extras geradas por atributos desativados.

Contatos Pessoa agora aceitam contagem opcional de dias remotos e presenciais por semana. Editor valida inteiros de 0 a 7 e soma máxima de 7; campos antigos sem contagem permanecem vazios. Validar persistência com contatos locais antes de concluir marco 6.

Migração de Recrutamento iniciada preservando cargo profissional e origem do candidato nos campos próprios de contato Externo. Editor de contatos exibe os campos; migração não sobrescreve edição existente e mantém dados de Recrutamento até a etapa de limpeza. Teste unitário da cópia e da repetição passou. Ainda faltam habilidades, anexos, referências e remoção segura das candidaturas/vagas.

Painel de Externos agora agrupa atributos de Candidato sem cabeçalho separado e oculta a seção Cliente. Campos do candidato continuam acessíveis durante a migração; bloqueio da seção sem cabeçalho foi removido para permitir editar atributos vazios. Conferir renderização de pessoa com os dois mixins em dados locais.

Após preservar cargo, origem e habilidades no contato Externo, painel de atributos deixa de mostrar o mixin legado de Candidato. Dados continuam persistidos; migração preparada popula campos atuais antes da retirada completa do tipo.

Habilidades dos candidatos agora têm atributo no contato Externo. Migração copia contador sem sobrescrever valor existente e troca `attachedToClass` das referências de habilidade para Pessoa; categorias e elementos também passam a apontar Pessoa. Nenhum registro de habilidade é removido. Validar contadores e filtros de etiquetas com dados locais antes da limpeza do mixin legado.

Migração idempotente adicional transfere arquivos vinculados às candidaturas para o contato Externo selecionado e recalcula seu contador. Arquivos de outras pessoas permanecem intactos; teste com aplicação repetida passou. A limpeza de candidaturas e vagas ainda depende da preservação das notas e relações relevantes.

Notas em comentários das candidaturas agora também são transferidas para atividade do contato Externo, mantendo autoria e conteúdo; contador recalculado. Teste com aplicação repetida e pessoa não relacionada passou. Limpeza de registros de Recrutamento continua pendente.

Migração de limpeza preparada para apagar candidaturas, correspondências, entrevistas, opiniões e vagas, com arquivos, atividades, etiquetas e notificações vinculadas a esses IDs. Contatos Externos e seus arquivos/notas transferidos permanecem. Limpeza só inicia se os quatro estados de preservação estiverem registrados; teste de proteção e execução repetida passou. Nenhuma migração foi executada em banco remoto ou compartilhado.

Migração completa de Recrutamento executada duas vezes em MongoDB descartável iniciado só para esta validação, com dados de candidato, candidatura, vaga, arquivo, nota, etiquetas e registros não relacionados. Contato e conteúdo transferido permaneceram; candidaturas e vagas saíram; registros não relacionados ficaram intactos. Contêiner local removido após teste.

Ações contextuais remanescentes de Recrutamento retiradas do modelo. Tipos legados ainda existem para a migração e compatibilidade de histórico; revisar sua retirada após validação em banco local descartável.

Criação inicial das categorias de habilidades também aponta para Pessoa, inclusive em espaços novos. A etapa de migração de habilidades continua copiando contadores separadamente para cobrir espaços onde a etapa anterior de contatos já havia sido executada.

Editor de funções/etiquetas agora permite excluir definição após confirmação. Exclusão usa participante de remoção existente para apagar referências em contatos antes do registro selecionado. Validar fluxo com funções iguais em pessoas diferentes e com duas funções na mesma pessoa.

Atividade permanece visível fora de Tarefas; editor de comentários fica habilitado apenas no painel da tarefa.

Busca da barra lateral de Conversa ocultada; busca continua disponível na tela Pesquisar. Botão Criar funcionário removido da lista de funcionários.

Menus simplificados: Adicionar relação, Nova tarefa relacionada, Relações, Copiar link/título/URL e configuração de projetos relacionados ocultos nos menus; Link público de Diretrizes não é mais registrado.

Menu contextual de canal agora oferece Editar para usuários com permissão; ação Abrir usa navegação padrão para o painel do canal.

Estimativa de tarefa agora explicita horas no rótulo e no campo de edição. Tempo restante saiu do popup de estimativa. Ação “Adicionar relatório de tempo” saiu do menu de tarefas.

Tempo gasto agora acompanha intervalos de Pendente, Em andamento e Revisão: criação inicia contagem; cada troca de status acumula horas; reabertura inicia novo intervalo; Finalizado e Ajustes pausam. Valor ativo atualiza no editor a cada minuto. Entrada manual saiu do popup de estimativa, do editor de tempo e das listas de relatórios; relatórios antigos deixam de alterar o total. Migração idempotente preparada para reconstruir intervalos pelo histórico de status, preservar dados de relatórios antigos e sincronizar totais de subtarefas nos pais. Testes unitários de transições e reabertura passaram; migração de status e tempo validada duas vezes em MongoDB local descartável, com reabertura e registro alheio preservado; falta validar gatilho em fluxo real antes de concluir marco 3.

Tempo ativo agora aparece também no quadro, no resumo de estimativas, na estatística de projetos e na lista de relatórios, com atualização a cada minuto. Totais de subtarefas ainda dependem do último valor persistido de cada filha; validar apresentação com hierarquias ativas em banco local.

Menu de comandos `/` agora entrega texto já traduzido ao popup e reserva largura para os rótulos. Conferir renderização e busca por nome em navegador local antes de concluir o marco 3.

Campo Componente retirado dos formulários de criação, detalhe e modelo de tarefa; retirado de cartões, colunas, agrupamentos e filtro das listas comuns. Vínculo persistido permanece para registros antigos e rotinas de movimentação; revisar caminhos de criação contextual antes de encerrar o marco 3.

Página de Componentes dentro de cada setor, seu atalho de teclado e ação contextual de atribuir componente retirados. Classe legada permanece para leitura de dados antigos.

Criação de tarefas e modelos agora grava Componente vazio mesmo quando chamada a partir de contexto antigo; criação contextual ainda preserva projeto e demais dados. Campo Componente retirado também do formulário residual de modelo.

Tela Modelos de Tarefas agora oferece ações separadas para criar modelo de tarefa e modelo de texto. O modelo de texto usa `MessageTemplate` e fica disponível no seletor existente dos editores de comentários. Conferir criação e inserção com dados locais antes de encerrar o marco 3.

Status padrão de tarefa definidos como Pendente cinza, Em andamento azul, Revisão laranja, Finalizado verde e Ajustes vermelho. Migração idempotente preparada para consolidar referências do antigo Todo em Pendente nas tarefas, padrões de setor e definições de tipos; documento legado permanece disponível para histórico. Migração de status validada duas vezes em MongoDB local descartável; conferir projetos personalizados antes de encerrar o marco 3.

Rótulos residuais de Backlog na navegação e no gerenciamento de status de Tarefas passam a Pendente/Pendentes nos catálogos `pt` e `pt-br`; o filtro de componentes legado permanece sem navegação.

Categoria base de status também exibe Pendente nos catálogos de Tarefas; seu ID interno não muda.

Auditoria dos catálogos `pt-br` encontrou apenas nomes próprios, termos técnicos, variáveis e rótulos já válidos iguais ao inglês; “Backlog” residual de componentes foi traduzido.

Migração de status agora remapeia também transações de criação e atualização de tarefas que referenciam Todo, mantendo histórico coerente com Pendente. Testar com banco local e execução repetida.

Novo tipo de tarefa criado pela integração GitHub usa a mesma sequência e as mesmas cores dos status aprovados.

Tipo de tarefa retirado da criação, dos detalhes de modelo, da tabela, dos filtros, dos agrupamentos e da ordenação. Criação escolhe automaticamente um tipo disponível no setor, preservando compatibilidade com setores que possuem tipos personalizados. Tempo restante saiu das opções de agrupamento e ordenação.

Criação de modelo de tarefa também escolhe automaticamente tipo disponível no setor e não expõe seletor; salvar exige tipo resolvido.

Cabeçalho do detalhe de Tarefas sem Copiar link, Configurações e botão de mostrar todos os mixins.

Controle global de gravação fica indisponível na aplicação de Tarefas; gravação em curso é cancelada ao entrar nela.

Atributo visível Colaboradores retirado do editor genérico, do painel de Tarefas e dos cartões. Botão genérico de mostrar todos os mixins também removido. Vínculos internos de notificações permanecem.

Concluir auditoria dos textos de interface e validar pacotes afetados antes de marcar marco 2 como concluído. Depois, continuar status e ações de Tarefas no marco 3.

Auditoria adicional de pt-BR corrigiu rótulos de downloads ainda exibidos em inglês ou com terminologia inconsistente. Comparação de chaves entre inglês e pt-BR encontrou somente nomes próprios, exemplos de URL e valores técnicos iguais; revisar textos gerados fora dos catálogos no fechamento.

Revisão de Diretrizes corrigiu “Meus documentos” no menu e “Sin título” no estado sem nome; catálogo `pt` recebeu os mesmos nomes do aplicativo e confirmação de exclusão traduzida.

Tela de exportação agora identifica Diretrizes, Projetos e Tarefas pelos nomes atuais, nos catálogos `pt` e `pt-br`.

Validação parcial: parsing/preprocessamento local dos componentes Svelte alterados passou. `svelte-check` completo encontrou milhares de erros de dependências não compiladas; também revelou sintaxe inválida no handler do filtro, corrigida antes de repetir o parsing. Nenhuma migração remota executada.

Migrações de status e tempo de Tarefas executadas duas vezes em MongoDB local descartável. Fixture com reabertura acumulou quatro horas; status padrão e histórico antigo remapeados; tarefa de outra classe permaneceu intacta. Contêiner descartável removido após teste.

Ação Link público retirada também do registro de Contatos e de Tarefas; referências de tipo ficam para documentos antigos.

Ações globais de copiar link e adicionar relação, além das ações Nova tarefa relacionada, Copiar título/URL e configurar projetos relacionados, deixaram de ser registradas. IDs legados ficam para referências persistidas e listas de ignorados.

Componente compartilhado de Atividade agora condiciona editor de comentários à classe Tarefa; histórico segue visível em outras entidades.

Notificação de Tarefas deixou de oferecer botão de copiar URL; ação Ver tarefa permanece.

Catálogos portugueses `pt` alinhados a `pt-br`: substantivos Anexo/Anexos agora exibem Arquivo/Arquivos também em painéis de cartões, integração e arquivos salvos.

Build Rush dos modelos View, Task, Contact e Tracker passou após retirada das ações; componentes Svelte de Atividade e notificação de Tarefas passaram pelo preprocessamento e parser.

Fábrica genérica de Funcionário desregistrada: nenhum menu de criação oferece Criar funcionário; convite continua responsável pela inclusão.

Rótulos residuais “Explorador de canais/mensagens” também passaram a “Pesquisar canais/mensagens” em `pt` e `pt-br`; entrada principal exibe “Pesquisar”.

Catálogo `pt` alinhado aos nomes aprovados de Setores, Projetos, Externos, Clientes, Calendário e Plano; `pt-br` já usava esses nomes.

FAQ do site público também usa Arquivos no lugar de Anexos; artefatos gerados de build permanecem derivados e serão atualizados pelo próximo build local.

Exemplo de identificador na criação de Setor agora usa SET nos catálogos `pt`/`pt-br`; identificadores existentes não são alterados.

Modelo de Recrutamento reduzido às classes legadas necessárias à migração; apresentação, filtros, notificações e ações deixam de registrar. Modelo servidor de Recrutamento removido do agregado. Criação inicial mantém apenas categorias de habilidades de Externos, sem sequências de candidaturas e vagas.

Build Rush de `@hcengineering/model-all` passou após retirada das contribuições de Recrutamento. Testes de migração/candidato passaram (6/6). Inspeção do modelo agregado em memória encontrou 49 transações legadas de esquema, nenhum aplicativo de Recrutamento e nenhum gatilho servidor de Recrutamento.

Botão compartilhado `ViewletsSettingButton` também deixou de expor configuração avançada nas listas embutidas de tarefas, cartões, relações, processos e reuniões; ordenação/agrupamento seguem pelo botão de opções.

Carregadores de recursos de interface e servidor de Recrutamento retirados de produção, pipeline e ferramenta local; catálogo de strings/ícones permanece para categorias legadas de habilidades dos Externos.

Build Rush de produção, pipeline de servidor e ferramenta local passou após retirada dos carregadores de Recrutamento. Modelo agregado em memória contém 21 aplicativos ativos; nenhum de Recrutamento, RH ou Planejador de equipes. O app `time:app:Me` permanece como Calendário.

Recursos remanescentes do Planejador de equipes e apresentador de candidaturas retirados do pacote Calendário; mixin de candidatura no modelo de tempo também removido. Componentes legados podem permanecer no código sem registro até limpeza de arquivos.

Build Rush dos pacotes de modelo e recursos de Calendário passou após retirada dos apresentadores de candidatura e Planejador de equipes.

Atalho global “Customizar aplicativos” removido da barra lateral, encerrando acesso ao seletor avançado de visibilidade.

Botões de mostrar todos os mixins retirados dos painéis de Cliente, Produto e Versão de Produto; atributos correntes seguem pelo painel comum.

Botão de configuração avançada retirado também dos formulários de criação e edição de visões em cartões. Opções comuns de visão continuam acessíveis quando disponíveis; o atalho `btn-viewSetting` deixa de ser renderizado.

Tempo ativo de subtarefas agora entra no total exibido do pai em quadro, estatística de projeto e editores de tempo. Atualizações de status sincronizam instantâneo e início da contagem no resumo do pai; migração local preparada para completar resumos antigos. Build Rush de Tracker (modelo, servidor e UI) passou; cinco testes de cálculo passaram. Falta conferir hierarquia ativa na aplicação.

Teste da etapa de sincronização de resumos confirmou atualização do filho certo, preservação do filho ausente e repetição sem nova escrita.

Etapa de sincronização executada duas vezes em MongoDB descartável local: uma escrita no pai, filho não encontrado e registro alheio preservados. Contêiner de teste removido.

Sistema antigo de abas internas retirado também do runtime e do modelo: componentes, estados e ações de criar/fixar/fechar abas deixaram de ser registrados. `OpenInNewTab` mantém aba real do navegador. No desktop, Ctrl+W fecha a janela em vez de acionar a aba interna. Classe legada `WorkbenchTab` permanece só para migração. Build Rush até Desktop passou.

Regras duráveis de nomenclatura, status, tempo, privacidade, dias de trabalho e desbloqueio registradas em `docs/business-rules.md`; histórico de execução permanece neste plano.

Tela Modelos agora alterna entre modelos de tarefa e modelos de texto. A lista de texto consulta `MessageTemplate`, permite pesquisar, selecionar e visualizar conteúdo, inclusive após criação. Build Rush de Tracker UI e parser/preprocessamento dos dois componentes passaram; falta validar inserção do modelo no editor real com conta local.

Na aba de modelos de texto, opções de visualização específicas de tarefas ficam ocultas; seleção, pesquisa e criação dos textos permanecem disponíveis.

Teste direto do gatilho de Tarefas confirmou que mudança para Finalizado acumula intervalo de uma hora e atualiza somente o instantâneo da subtarefa selecionada no pai. Ainda falta verificar o fluxo completo com aplicação local.

Revisão do Calendário encontrou caminho residual na visão mensal: clique em evento privado ainda abria editor, e popup do dia não marcava evento como ocupado. Visão mensal agora exibe “Ocupado” e bloqueia abertura; popup do dia aplica a mesma regra. Build Rush e parser/preprocessamento dos componentes passaram. Validar com duas contas locais.
