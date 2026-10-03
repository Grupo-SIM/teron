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
- Projetos seguem Pendente, Em andamento, Concluído e Cancelado.
- Modelos de texto inserem conteúdo no editor de comentário de tarefa sem publicar automaticamente.

## Calendário, contatos e diretrizes

- Evento privado ocupa horário para outras pessoas sem mostrar título, descrição, local ou participantes.
- Contatos Externos podem ter dias remotos e presenciais opcionais por semana, cada contagem entre 0 e 7 e soma máxima de 7. Booleanos legados não inferem contagem.
- Somente Owner e Maintainer podem desbloquear Diretrizes.

- Calendário exibe compromissos do dia selecionado; Minhas Agendas restringe agendas ao titular, Agendas da Equipe permite selecionar funcionário do workspace e sua agenda, sem conceder acesso a documentos.
- Mudança de dia usa intervalo entre meia-noite local e a seguinte; compromissos que atravessam o limite aparecem no dia correspondente. Eventos privados alheios não oferecem edição.
- Contatos mantém seções Funcionários, Externos e Clientes; Departamento e vínculo interno de colaboradores não aparecem como campos editáveis. Mesclar contatos não é ação disponível.
- Buscas de listas e seletores tratam consulta como trecho literal, ignorando caixa e acentos; texto persistido permanece intacto.

## Autorização de workspace

- Owner/Maintainer administram estrutura, contatos, responsáveis, prazos, permissões e exclusões, respeitando acesso ao espaço.
- User pode editar descrição de tarefa acessível; status exige participação nos responsáveis. Demais mudanças organizacionais são recusadas pelo servidor, inclusive lotes e transações condicionais.
- Usuários podem usar suas agendas/eventos, conversar, entrar em chamadas, enviar arquivos e editar conteúdo de documentos acessíveis e desbloqueados. Concessões específicas de Diretrizes ainda estão em implementação.
- Exceções de contadores, histórico e notificações pertencem somente a contextos internos confiáveis; transações cliente não podem usar essas exceções.

- Responsáveis de tarefa são lista única de pessoas; zero responsáveis é lista vazia. Lista explícita prevalece sobre campo escalar legado, inclusive quando vazia. Novas transações persistem lista; integrações antigas são normalizadas no servidor.
- Templates, subtarefas e duplicações preservam todos os responsáveis. Colaboradores e destinatários devem ser únicos, sem notificações repetidas por pessoa.

- Papel Somente leitura não é selecionável em convites/configurações. Conversão de contas legadas para User reserva vaga com comparação do papel original; não excede contrato nem limite de redução agendada. Contas sem vaga permanecem no papel legado, com pendência visível ao Owner. Conta anônima de sistema permanece excluída da conversão.

Busca global indexada trata consulta como trecho literal: caixa e acentos são normalizados em campo adicional, mantendo texto original. Caracteres especiais não viram operadores. Índices legados recebem reconstrução aditiva e idempotente, executada explicitamente apenas no ambiente local autorizado; filtros de workspace, espaço, classe e paginação continuam aplicáveis.

Owner/Maintainer com acesso ao espaço podem excluir diretamente documentos, arquivos e espaços ativos de Diretrizes/Arquivos. Confirmação informa exclusão permanente e conteúdo descendente afetado. Limpeza usa participantes existentes e restringe descendentes ao espaço excluído, inclusive versões; referência de pai em outro espaço não autoriza excluir seu conteúdo.
