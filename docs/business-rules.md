# Regras comerciais

## Vagas de workspace

- Workspaces Business contratam quantidade fixa de vagas por ciclo de cobrança.
- Owner, Maintainer e User consomem vaga. ReadOnlyGuest e DocGuest não consomem.
- Papel Guest não existe para membros, convites ou cadastro no workspace.
- Convite personalizado pendente reserva uma vaga até aceite, cancelamento ou expiração.
- Convite personalizado válido para e-mail confirma o endereço do destinatário ao cadastrar ou entrar com senha e ingressa automaticamente no workspace, sem segundo email de confirmação. Convites genéricos continuam exigindo confirmação do endereço.
- Nenhum convite, aceite, cadastro aberto ou mudança de papel pode exceder capacidade contratada.
- Somente Owner pode alterar quantidade contratada.
- Aumento entra em vigor após pagamento aprovado do valor proporcional ao tempo restante do ciclo.
- Redução não gera crédito. Fica agendada para renovação e não pode ficar abaixo da ocupação atual.
- Remover membro ou cancelar convite libera vaga, mas não reduz assinatura automaticamente.
- Membro autenticado pode reabrir link de convite consumido ou expirado para acessar seu workspace; reingresso preserva papel atual e não consome convite nem vaga adicional. Conta sem vínculo continua sujeita à validade e ao destinatário do convite.
- Vaga livre continua disponível para novo convite até Owner reduzir quantidade em Plano.

## Setores, projetos e tarefas

- A entidade `Project` aparece para pessoas usuárias como Setor; `Milestone` aparece como Projeto. IDs e URLs legados permanecem.
- Tarefas seguem Pendente, Em andamento, Revisão, Finalizado e Ajustes. Pendente, Em andamento e Revisão acumulam tempo corrido; Finalizado e Ajustes pausam a contagem. Reabrir tarefa inicia novo intervalo.
- Tempo gasto e estimativa exibem dias de 24 horas. Tempo gasto não é limitado pela estimativa; total de subtarefas considera somente tarefas existentes vinculadas ao pai.
- Projetos seguem Pendente, Em andamento, Concluído e Cancelado.
- Histórico de atividade preserva cada edição como entrada separada, inclusive alterações consecutivas do mesmo campo e edições logo após a criação.
- Exclusão de projeto pede uma única confirmação; tarefas são preservadas em Sem projeto, sem escolher outro destino.
- Modelos de tarefa e de texto compartilham uma única listagem e busca; criação não troca a listagem. Cada tipo abre seu próprio detalhe/editor.
- Modelos de texto inserem conteúdo no editor de comentário de tarefa sem publicar automaticamente.

## Calendário, contatos e diretrizes

- Evento privado ocupa horário para outras pessoas sem mostrar título, descrição, local ou participantes.
- Habilidades é um campo legado de Recrutamento e não aparece no perfil nem nos atributos editáveis de contatos; dados existentes permanecem armazenados.
- Função representa o cargo do contato; campo legado Cargo profissional permanece armazenado, mas não aparece na edição. Origem do contato e Perfil do usuário não aparecem na tela de Contatos, incluindo atributos laterais, formulários, filtros e seleção de colunas; dados existentes permanecem armazenados.
- Dias remotos e presenciais são editados nos atributos laterais do contato.
- Contatos Externos podem ter dias remotos e presenciais opcionais por semana, cada contagem entre 0 e 7 e soma máxima de 7. Booleanos legados não inferem contagem.
- Somente Owner e Maintainer podem desbloquear Diretrizes.

- Calendário exibe compromissos do dia selecionado; Minha Agenda restringe agendas ao titular, Agendas da Equipe permite selecionar funcionário do workspace e sua agenda, sem conceder acesso a documentos.
- Mudança de dia usa intervalo entre meia-noite local e a seguinte; compromissos que atravessam o limite aparecem no dia correspondente. Eventos privados alheios não oferecem edição.
- Contatos mantém seções Funcionários, Externos e Clientes; Departamento e vínculo interno de colaboradores não aparecem como campos editáveis. Mesclar contatos não é ação disponível.
- Buscas de listas e seletores tratam consulta como trecho literal, ignorando caixa e acentos; texto persistido permanece intacto.

## Autorização de workspace

- Inicialização permite provisionar perfil de funcionário da própria conta autenticada e sincronizar suas identidades confirmadas; não concede administração de contatos nem alteração do perfil de terceiros.
- Owner/Maintainer administram estrutura, contatos, responsáveis, prazos, permissões e exclusões, respeitando acesso ao espaço.
- Qualquer papel do workspace pode visualizar, criar, editar, excluir, mover e alterar status de tarefas de qualquer setor, incluindo responsáveis, prazos e prioridade. Participação no setor, privacidade do setor, autoria, atribuição e permissões do espaço não restringem tarefas. Somente Maintainer (gerente) e Owner (proprietário) podem criar Setores (`Project`). Projetos (`Milestone`) podem ser criados por qualquer papel do workspace. Minhas tarefas continua sendo filtro por responsáveis, não uma regra de autorização. Permissões das demais aplicações permanecem aplicáveis. Estimativa aceita número finito não negativo e seletor de horas, dias ou minutos, com frações permitidas; armazenamento permanece em horas e cada dia equivale a 24 horas. Restrições organizacionais das demais entidades permanecem, inclusive em lotes e transações condicionais.
- User pode criar e excluir pastas em Arquivos, incluindo conteúdo descendente, respeitando acesso e permissões do espaço. Não concede administração do espaço nem alteração de outras entidades.
- Erros exibidos no frontend usam mensagens traduzidas; detalhes técnicos de falhas inesperadas permanecem nos diagnósticos.
- Usuários podem usar suas agendas/eventos, conversar, entrar em chamadas, enviar arquivos e editar conteúdo de documentos acessíveis e desbloqueados. Diretrizes aplicam concessões herdadas Leitor/Editor também em busca, realtime e colaboração.
- Exceções de contadores, histórico e notificações pertencem somente a contextos internos confiáveis; transações cliente não podem usar essas exceções, salvo incremento exato de 1 no contador sequencial de setor acessível para numeração de tarefas.

- Responsáveis de tarefa são lista única de pessoas; zero responsáveis é lista vazia. Lista explícita prevalece sobre campo escalar legado, inclusive quando vazia. Novas transações persistem lista; integrações antigas são normalizadas no servidor.
- Templates, subtarefas e duplicações preservam todos os responsáveis. Colaboradores e destinatários devem ser únicos, sem notificações repetidas por pessoa.

- Papel Somente leitura não é selecionável em convites/configurações. Conversão de contas legadas para User reserva vaga com comparação do papel original; não excede contrato nem limite de redução agendada. Contas sem vaga permanecem no papel legado, com pendência visível ao Owner. Conta anônima de sistema permanece excluída da conversão.

Busca global indexada trata consulta como trecho literal: caixa e acentos são normalizados em campo adicional, mantendo texto original. Caracteres especiais não viram operadores. Índices legados recebem reconstrução aditiva e idempotente, executada explicitamente apenas no ambiente local autorizado; filtros de workspace, espaço, classe e paginação continuam aplicáveis.

Owner/Maintainer com acesso ao espaço podem excluir diretamente documentos, arquivos e espaços ativos de Diretrizes/Arquivos. Confirmação informa exclusão permanente e conteúdo descendente afetado. Limpeza usa participantes existentes e restringe descendentes ao espaço excluído, inclusive versões; referência de pai em outro espaço não autoriza excluir seu conteúdo.

Diretrizes herdam concessões Leitor/Editor do espaço. Concessões individuais e por setor (`Project`) somam acesso; Editor prevalece. Owners do espaço preservam edição. Entrada/saída do setor sincroniza membros efetivos usados na segurança existente, sem alterar privacidade. Migração preserva membros anteriores como Editores. Somente Owner/Maintainer administram concessões; Membros com acesso Editor podem criar, editar, mover e excluir documentos acessíveis e desbloqueados; mover entre espaços exige acesso Editor também no destino. Editor colaborativo consulta acesso do usuário no handshake, em mensagens e broadcasts; revogação fecha conexão. RPC de leitura/edição aplica mesma autorização; blob inicial deve corresponder ao documento solicitado.

Privacidade de eventos é aplicada no servidor mesmo para Owner/Maintainer: eventos privados/de disponibilidade alheios expõem só intervalo ocupado e dados de recorrência necessários. Detalhes, local, participantes, anexos e referências são removidos de leituras e lookups; consultas por detalhes, agregações e busca global não revelam esses registros. Realtime envia payload original somente ao proprietário do evento; demais clientes recebem invalidação sem conteúdo e consultam versão protegida. Membros criam/editam/excluem eventos próprios; criação exige agenda própria. Conteúdo anexado valida pai real, inclusive criação direta. Concluir item pessoal vinculado a tarefa exige acesso à tarefa, sem exigir atribuição.

Busca global aplica exclusões de eventos privados e seus anexos antes do limite e da contagem; filtrar apenas a página já retornada não preserva paginação nem privacidade da contagem. Broadcast de anexos privados obedece à mesma prioridade de privacidade do evento.

Foto na edição do Escritório ocupa largura e altura do squircle, com recorte central `cover` e máscara preservada. Sem foto, fallback permanece. Troca de andar usa token de fundo do painel nos temas claro e escuro.

Andares sem salas permanecem expandidos e não oferecem controle para colapsar. No seletor do Escritório, ocupam metade da largura disponível, permitindo dois andares vazios lado a lado; andares com salas ocupam a largura inteira. Remover a última sala de um andar colapsado restaura sua expansão.

Tabelas de contatos permitem selecionar e reordenar colunas. Funcionários e Externos mostram nome, localização, função e informações de contato por padrão; Aniversário, Dias presenciais e Dias remotos são opcionais. Clientes mantém nome, localização e informações de contato por padrão. Preferências individuais salvas prevalecem sobre o padrão.

Conta mantém um único email ativo confirmado. Alteração exige código enviado ao novo endereço; email anterior permanece válido até confirmação. Após confirmar, endereços anteriores são liberados, inclusive em chamadas diretas ao servidor. Cancelar ou falhar na confirmação preserva email atual.

User pode entrar e sair de canais públicos ativos alterando somente a própria participação; não pode adicionar/remover terceiros nem alterar configuração do canal. Canal privado permite somente saída da própria conta já participante; entrada exige administração.

Funções cadastradas nos contatos podem ser excluídas pelo seletor. Exclusão exige confirmação em segundo clique, expira após três segundos e remove todos os vínculos da função sem excluir contatos.

Owner/Maintainer podem reordenar andares do Escritório pela alça de arraste ou pelas setas do teclado. Ordem é compartilhada e persistida; novos andares sem ordem aparecem ao final.

Cada contato pode ter somente um vínculo com cada função; atribuições repetidas ou simultâneas não criam duplicatas.

Presença online no Escritório permanece enquanto houver uma sessão ativa do usuário. Após fechar a última aba, o servidor aguarda a janela de reconexão (30 segundos na configuração atual), marca o usuário offline e remove sua presença. Encerramento de workspace vazio aguarda essa limpeza e operações pendentes; fechar uma aba não desconecta quem mantém outra aberta, e reconectar dentro da janela preserva presença.

Chamadas de voz e vídeo retomam automaticamente na mesma sala após interrupções recuperáveis de rede ou divergência de estado do LiveKit, mantendo estado de microfone/câmera e tentativas com espera crescente. Quando o SDK encerra a conexão recuperável, uma nova conexão usa token atualizado sem exigir troca de sala. Remoção pelo servidor, sala excluída e identidade duplicada não iniciam recuperação automática. Saída explícita encerra recuperação. Reconexão não dispara saída por sala vazia. Quando uma interrupção recria a presença do participante na recepção ou no escritório padrão, a sessão que estava na chamada restaura a sala anterior; mudanças explícitas de sala e expulsões continuam válidas. Áudio remoto é reconciliado após reconexão, sem duplicações nem remoção da faixa nova por eventos atrasados da faixa anterior. Faixas de áudio com reprodução pausada, encerrada ou vínculo de mídia perdido são verificadas a cada cinco segundos e ao voltar à aba ou interagir com a página; a retomada reutiliza o elemento existente e registra diagnóstico local sem reiniciar faixas saudáveis. Filtro Krisp exige LiveKit Cloud; servidor próprio mantém supressão nativa do navegador.

Membros User podem convidar pessoas para chamadas e iniciar reuniões em offices e salas acessíveis; convite não exige Owner/Maintainer. Criação do registro ativo da reunião valida sala e espaço, sem conceder administração da estrutura do Escritório.

Criação de tarefa grava referências de etiquetas no mesmo Setor da tarefa, inclusive ao usar modelos ou duplicações. Sucesso só aparece após confirmação do commit; falha mantém formulário e rascunho para correção e nova tentativa.

Não perturbe é preferência local do dispositivo, persistida entre sessões e sincronizada entre abas. Quando ativo, silencia convites de chamada, pedidos de entrada, sons e alertas de notificações no navegador/desktop; notificações permanecem na caixa de entrada. Confirmações de ações continuam visíveis.

Compartilhamento de tela preserva captura ainda ativa durante reconexão recuperável e republica vídeo e áudio na mesma sala sem solicitar nova permissão. Parar compartilhamento, sair da chamada ou encerrar captura libera as faixas preservadas e impede retomada automática. Áudio da tela não altera estado do microfone.

Falha transitória ao consultar versão do frontend durante reconexão não recarrega a página nem descarta estado local; uma versão diferente confirmada mantém fluxo de atualização. Cards de participantes presentes na sala preservam identidade visual enquanto o transporte da chamada reconecta; saída confirmada remove o card.

Modo anônimo e não perturbe são independentes e podem ficar ativos juntos. Modo anônimo faz o usuário aparecer offline aos demais, oculta sua presença no Escritório e deixa de publicar presença em documentos e digitação, sem encerrar sua sessão. Não perturbe mantém comportamento de silenciar alertas. Barra superior indica não perturbe ativo em vermelho e modo anônimo ativo em roxo, com ícones distintos, descrição acessível e confirmação ao alternar.

Não perturbe da sala é configuração compartilhada e persistida por sala, independente da preferência local do dispositivo. Bloqueia batidas e convites de pessoas de fora para participantes da sala, inclusive alertas pendentes ao ativar; outras salas permanecem disponíveis. Controles de acesso da chamada e configurações da sala permitem alterar o modo; escritório pessoal mantém controle exclusivo do titular.

Owner (proprietário) e Maintainer (gerente) podem expulsar outros participantes de salas do Escritório. O titular de um escritório pessoal também pode expulsar visitantes da própria sala; essa permissão não se estende a salas de terceiros. A ação também fica disponível no cartão do participante dentro da chamada, inclusive em modo anônimo, sem revelar sua presença no mapa. Expulsão retorna participante ao escritório pessoal ou à recepção quando esse escritório é a sala de origem ou não existe; não bloqueia entrada futura.

Se o status online chegar antes do vínculo entre conta e contato, concluir esse vínculo recompõe a presença no Escritório: escritório pessoal quando disponível, recepção como alternativa. Presença já existente mantém sua sala.
