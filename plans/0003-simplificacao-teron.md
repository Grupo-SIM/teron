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

Concluir auditoria dos textos de interface e validar pacotes afetados antes de marcar marco 2 como concluído. Depois, continuar status e ações de Tarefas no marco 3.
