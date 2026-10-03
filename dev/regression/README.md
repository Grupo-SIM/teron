# Regressão local da simplificação

Stack descartável do checkout atual. Usa contas `owner@regression.local` e `user@regression.local`, senha `Regression123!`. Dados ficam nos volumes `teron-regression_*`; nenhum serviço ou banco existente é reutilizado. Portas públicas limitadas a localhost: 30130 (contas), 30133 (transactor), 30178 (colaboração), 30180 (interface). Integrações, e-mail e telemetria externos ficam desativados.

Dependências Rush já precisam estar instaladas. Preparação compila os pacotes necessários, gera modelo/bundles e frontend sem minificação; não publica imagens nem executa migrações remotas.

```sh
node dev/regression/prepare.mjs
# Download acessa registros externos: agentes precisam de autorização específica antes deste comando.
docker compose -f dev/docker-compose.regression.yaml pull
docker compose -f dev/docker-compose.regression.yaml up -d --pull never
node dev/tool/bundle/simplification.cjs
```

Runner cria workspace e duas contas caso ainda não existam. Estado de autenticação fica em `/tmp/teron-regression-accounts.json`, com permissão 0600; variável `TERON_REGRESSION_STATE` permite mudar caminho. Runner reexecuta com IDs fixos, restaura papel User após testar Maintainer e preserva fixtures para conferir interface. Resultado de backend fica em `/tmp/teron-regression-api-results.json`.

Cobertura de backend: funções múltiplas, isolamento de habilidades/etiquetas, exclusão com referências em duas pessoas, busca parcial, dias opcionais, agendas compartilhadas, papéis de desbloqueio, tempo com reabertura/resumo do pai e troca de titular do escritório. Privacidade visual, menus, formulários, modelos de texto e substituição de identidade exigem a regressão no navegador.

Execução desta etapa: sete grupos do runner passaram e foram repetidos com duas contas reais na stack isolada. A regressão encontrou e corrigiu o gatilho de tempo que consultava o status já persistido. Seis testes de cálculo e um teste de gatilho passaram; build dos recursos de Tracker e bundle web passaram. Seleção de agendas no Calendário principal recebeu correção adicional, com build dos recursos de Calendário/Tempo e parser de três componentes aprovados. A conferência visual completa não foi concluída; estes resultados não certificam os fluxos de OTP, inserção de modelo de texto ou convites de escritório.

```sh
# Encerra somente esta stack; --volumes descarta apenas seus dados.
docker compose -f dev/docker-compose.regression.yaml down --volumes
```

Após encerrar, apagar também os dois arquivos temporários de estado/resultados mencionados acima.

Busca global literal (plano 0004): `node dev/regression/elastic.mjs` usa Elasticsearch 7.14.2 e imagem base já instalados, em rede interna descartável. Não baixa imagens. Valida início/meio/fim, caixa/acentos, símbolos literais, espaço autorizado, paginação e reconstrução repetida do campo `literalSearch` sem alterar conteúdo original. Contêineres, volumes, rede e bundle temporário são removidos ao terminar. Reconstrução explícita usa `ElasticAdapter.rebuildLiteralSearch()`; não é executada automaticamente na inicialização ou em serviços externos.

Conversão de contas legadas: `node dev/regression/roles.mjs` executa `convertLegacyReadOnlyMembers` em MongoDB/PostgreSQL novos, dentro de rede interna sem portas públicas. Usa apenas imagens já instaladas. Valida vagas disponíveis/insuficientes, convites reservados, concorrência pela última vaga e repetição. Não inicializa nem modifica bancos existentes; contêineres e volumes são descartados ao finalizar.
