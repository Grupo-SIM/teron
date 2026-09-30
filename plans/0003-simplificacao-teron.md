# Simplificação progressiva do Teron

## Progresso

- [x] 1. Corrigir modal de setor, exclusão do registro selecionado, fotos e troca de escritório.
- [ ] 2. Ajustar nomes, traduções e abas do navegador.
- [ ] 3. Reorganizar tarefas, projetos, status, tempo e modelos.
- [ ] 4. Corrigir calendário, privacidade e agendas compartilhadas.
- [ ] 5. Corrigir drawer, andares e ações do escritório.
- [ ] 6. Simplificar contatos e remover Recrutamento, RH e Planejador de equipes.
- [ ] 7. Simplificar ações, Conversa, Diretrizes e Configurações.
- [ ] 8. Conferir regressões e todos os itens aprovados.

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

## Próximo passo

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
