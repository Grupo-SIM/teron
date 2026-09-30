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

Implementar marco 2: nomes, traduções e abas do navegador.
