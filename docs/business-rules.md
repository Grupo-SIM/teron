# Regras comerciais

## Vagas de workspace

- Workspaces Business contratam quantidade fixa de vagas por ciclo de cobrança.
- Owner, Maintainer e User consomem vaga. ReadOnlyGuest e DocGuest não consomem.
- Papel Guest não existe para membros, convites ou cadastro no workspace.
- Convite personalizado pendente reserva uma vaga até aceite, cancelamento ou expiração.
- Convite personalizado para e-mail sem conta abre cadastro com o e-mail preenchido; após confirmar o e-mail, a conta entra automaticamente no workspace.
- Nenhum convite, aceite, cadastro aberto ou mudança de papel pode exceder capacidade contratada.
- Somente Owner pode alterar quantidade contratada.
- Aumento entra em vigor após pagamento aprovado do valor proporcional ao tempo restante do ciclo.
- Redução não gera crédito. Fica agendada para renovação e não pode ficar abaixo da ocupação atual.
- Remover membro ou cancelar convite libera vaga, mas não reduz assinatura automaticamente.
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

- Owner/Maintainer administram estrutura, contatos, responsáveis, prazos, permissões e exclusões, respeitando acesso ao espaço.
- Qualquer role pode criar, editar, excluir, mover e alterar status de tarefas acessíveis, incluindo responsáveis, prazos e prioridade; status não exige participação nos responsáveis. Acesso e permissões do espaço continuam aplicáveis. Estimativa aceita número finito não negativo e seletor de horas, dias ou minutos, com frações permitidas; armazenamento permanece em horas e cada dia equivale a 24 horas. Restrições organizacionais das demais entidades permanecem, inclusive em lotes e transações condicionais.
- User pode criar e excluir pastas em Arquivos, incluindo conteúdo descendente, respeitando acesso e permissões do espaço. Não concede administração do espaço nem alteração de outras entidades.
- Erros exibidos no frontend usam mensagens traduzidas; detalhes técnicos de falhas inesperadas permanecem nos diagnósticos.
- Usuários podem usar suas agendas/eventos, conversar, entrar em chamadas, enviar arquivos e editar conteúdo de documentos acessíveis e desbloqueados. Diretrizes aplicam concessões herdadas Leitor/Editor também em busca, realtime e colaboração.
- Exceções de contadores, histórico e notificações pertencem somente a contextos internos confiáveis; transações cliente não podem usar essas exceções, salvo incremento exato de 1 no contador sequencial de setor acessível para numeração de tarefas.

- Responsáveis de tarefa são lista única de pessoas; zero responsáveis é lista vazia. Lista explícita prevalece sobre campo escalar legado, inclusive quando vazia. Novas transações persistem lista; integrações antigas são normalizadas no servidor.
- Templates, subtarefas e duplicações preservam todos os responsáveis. Colaboradores e destinatários devem ser únicos, sem notificações repetidas por pessoa.

- Papel Somente leitura não é selecionável em convites/configurações. Conversão de contas legadas para User reserva vaga com comparação do papel original; não excede contrato nem limite de redução agendada. Contas sem vaga permanecem no papel legado, com pendência visível ao Owner. Conta anônima de sistema permanece excluída da conversão.

Busca global indexada trata consulta como trecho literal: caixa e acentos são normalizados em campo adicional, mantendo texto original. Caracteres especiais não viram operadores. Índices legados recebem reconstrução aditiva e idempotente, executada explicitamente apenas no ambiente local autorizado; filtros de workspace, espaço, classe e paginação continuam aplicáveis.

Owner/Maintainer com acesso ao espaço podem excluir diretamente documentos, arquivos e espaços ativos de Diretrizes/Arquivos. Confirmação informa exclusão permanente e conteúdo descendente afetado. Limpeza usa participantes existentes e restringe descendentes ao espaço excluído, inclusive versões; referência de pai em outro espaço não autoriza excluir seu conteúdo.

Diretrizes herdam concessões Leitor/Editor do espaço. Concessões individuais e por setor (`Project`) somam acesso; Editor prevalece. Owners do espaço preservam edição. Entrada/saída do setor sincroniza membros efetivos usados na segurança existente, sem alterar privacidade. Migração preserva membros anteriores como Editores. Somente Owner/Maintainer administram concessões; Editor pode criar/editar documentos acessíveis e não excluir. Editor colaborativo consulta acesso do usuário no handshake, em mensagens e broadcasts; revogação fecha conexão. RPC de leitura/edição aplica mesma autorização; blob inicial deve corresponder ao documento solicitado.

Privacidade de eventos é aplicada no servidor mesmo para Owner/Maintainer: eventos privados/de disponibilidade alheios expõem só intervalo ocupado e dados de recorrência necessários. Detalhes, local, participantes, anexos e referências são removidos de leituras e lookups; consultas por detalhes, agregações e busca global não revelam esses registros. Realtime envia payload original somente ao proprietário do evento; demais clientes recebem invalidação sem conteúdo e consultam versão protegida. Membros criam/editam/excluem eventos próprios; criação exige agenda própria. Conteúdo anexado valida pai real, inclusive criação direta. Concluir item pessoal vinculado a tarefa exige acesso à tarefa, sem exigir atribuição.

Busca global aplica exclusões de eventos privados e seus anexos antes do limite e da contagem; filtrar apenas a página já retornada não preserva paginação nem privacidade da contagem. Broadcast de anexos privados obedece à mesma prioridade de privacidade do evento.

Foto na edição do Escritório ocupa largura e altura do squircle, com recorte central `cover` e máscara preservada. Sem foto, fallback permanece. Troca de andar usa token de fundo do painel nos temas claro e escuro.

Andares sem salas permanecem expandidos e não oferecem controle para colapsar. Remover a última sala de um andar colapsado restaura sua expansão.

Tabelas de contatos permitem selecionar e reordenar colunas. Funcionários e Externos mostram nome, localização, função e informações de contato por padrão; Aniversário, Dias presenciais e Dias remotos são opcionais. Clientes mantém nome, localização e informações de contato por padrão. Preferências individuais salvas prevalecem sobre o padrão.

Conta mantém um único email ativo confirmado. Alteração exige código enviado ao novo endereço; email anterior permanece válido até confirmação. Após confirmar, endereços anteriores são liberados, inclusive em chamadas diretas ao servidor. Cancelar ou falhar na confirmação preserva email atual.

User pode entrar e sair de canais públicos ativos alterando somente a própria participação; não pode adicionar/remover terceiros nem alterar configuração do canal. Canal privado permite somente saída da própria conta já participante; entrada exige administração.

Funções cadastradas nos contatos podem ser excluídas pelo seletor. Exclusão exige confirmação em segundo clique, expira após três segundos e remove todos os vínculos da função sem excluir contatos.

Owner/Maintainer podem reordenar andares do Escritório pela alça de arraste ou pelas setas do teclado. Ordem é compartilhada e persistida; novos andares sem ordem aparecem ao final.
