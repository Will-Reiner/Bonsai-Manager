# Página do cuidado feito: detalhe, edição e exclusão

Data: 2026-10-12 · Origem: `docs/todo.md` (item "na tela de detalhes de procedimento feito…")

## Objetivo

Ao tocar num cuidado feito (histórico da planta, roda da página da planta, último cuidado), a página
`/tarefas/:id` mostra **o card do dia** daquele cuidado — o mesmo agrupamento do histórico (planta + dia) —
com título, data, notas e fotos; deslizar para o lado passa para o cuidado anterior/seguinte da planta.
Um lápis no topo abre a edição (data, tarefas, textos) e a exclusão. Editar ou excluir um Transplante
desfaz/corrige o grupo Recém transplantada, e essa reavaliação vale para **todos** os caminhos que gravam
tarefas (registrar, concluir, editar, excluir).

Fora do escopo: a página da tarefa **pendente** (`PendentesDaPlanta`) não muda; editar fotos do cuidado
(desvincular/adicionar) e adicionar tarefas a um cuidado já feito.

## Unidade da página

- Um **cuidado** = todas as tarefas `CONCLUIDO` da planta no mesmo dia local (`dataConcluida ?? dataAgendada`),
  o item `cuidado` de `linhaDoTempo` (`web/src/lib/linhaDoTempo.ts`).
- A URL continua `/tarefas/:id` com o id de qualquer tarefa do card; a página resolve o card que a contém.
- Deslizar passa **só por cuidados feitos** da planta, do mais antigo (esquerda) ao mais novo (direita).
  Pendentes e dias só de fotos ficam de fora.

## Página (cuidado feito)

- **Cabeçalho:** título `plantaCodigoNome(planta)` (`#12 · Ficus`), tocável → `/plantas/:id`; voltar;
  à direita botão lápis "Editar cuidado".
- **Painel do cuidado** (um por cuidado, rolagem horizontal com snap):
  1. Título grande: `tituloCuidado(agendas)` ("Adubação + Desaramação").
  2. "Concluído · 3 dias atrás (09 de outubro de 2026)" (`distanciaRelativa` + `dataLonga`).
     Se alguma tarefa é de rotina: "↻ Rotina a cada N dias" (por tarefa de rotina, com o nome quando há mais de uma).
  3. Notas: componente `NotasDoCuidado` existente com `notasDoCuidado(agendas)` (descrição e obs., com
     nome da tarefa quando o texto não vale para todas).
  4. Fotos do cuidado (fotos das tarefas do card): carrossel lateral (`Roda`, como a roda de fotos da
     planta); toque → visualizador da galeria (`/plantas/:id/galeria?foto=`). Sem fotos, a seção some.
- **Navegação:** ao parar num painel, `navigate('/tarefas/:idDaPrimeiraTarefa', { replace: true, state: MANTER_ROLAGEM })`
  — o voltar do aparelho sai da página. Indicador "3 de 12" abaixo; setas ‹ › em telas largas (sm+).
  Só o painel atual e os vizinhos renderizam conteúdo; os demais são espaços vazios do mesmo tamanho.
- **Saem desta página:** capa da planta, "Histórico da planta" (`HistoricoPlanta`) e `CarrosselDoDia`
  (o painel já é o dia todo). Remover os componentes se ficarem sem uso.
- **Tarefa cancelada** (status legado `CANCELADO`): versão simples, sem deslizar nem edição — título,
  "Cancelada · …", rotina/pulada como hoje, fotos e botão Excluir (`DELETE /agendas/:id`, confirmação).

## Editar cuidado (gaveta)

Aberta pelo lápis; age sobre o card do painel atual.

- **Data:** `<input type="date">`, máximo hoje. Vale para todas as tarefas do card. Se a nova data já tem
  outro cuidado da planta, aviso "Vai juntar com o cuidado de 05/10" (no histórico viram um card só).
- **Tarefas:** chips com o nome de cada tarefa e ✕ para tirar. Não dá para tirar todas (o ✕ da última
  fica desativado; para isso existe Excluir). Tirar = apagar a tarefa ao salvar.
- **Descrição / Obs. para o futuro** (cada um independente):
  - Todas as tarefas que ficam com o mesmo texto (ou vazio) → **um campo** que vale para todas.
  - Textos diferentes → **um campo por tarefa**, rotulado com o nome dela.
- **Rotina:** se alguma tarefa é de rotina, uma linha: "Mudar a data não reagenda a próxima da rotina."
- **Salvar:** `PUT /agendas/cuidado`; desativado sem mudanças. Sucesso → toast "Cuidado atualizado",
  invalida `agendas`, `rotinas`, `plantas`, `fotos(plantaId)`; fica no painel (se a tarefa da URL foi
  tirada, troca a URL para outra tarefa do card).
- **Excluir cuidado** (botão vermelho no fim) → `ConfirmSheet`:
  - "Excluir este cuidado? As N tarefas somem do histórico. As fotos continuam na galeria da planta."
  - Se a planta está em Recém transplantada e `planta.transplanteAgendaId` é uma tarefa do card:
    acrescenta "A planta volta para *<grupoAnterior>*." (sem grupo anterior: "A planta sai de Recém transplantada.").
  - Confirmar → `POST /agendas/cuidado/excluir`; toast "Cuidado excluído"; vai para o cuidado vizinho
    (anterior; senão o seguinte) com `replace`; sem nenhum → `/plantas/:id` com `replace`.
- **Erros:** toast com a mensagem; nada muda (servidor é tudo ou nada).

## Backend

### Banco

- Migration `transplante_agenda_id`: `Planta.transplanteAgendaId String?` — o Transplante concluído que
  colocou a planta em Recém transplantada (par do `preTransplanteAgendaId`).
- Backfill na migration: plantas com `grupo = RECEM_TRANSPLANTADA` e `grupoExpiraEm` não nulo recebem o id
  da tarefa de Transplante `CONCLUIDO` mais recente da planta (se existir).
- `GET /plantas` e `GET /plantas/:id` devolvem `transplanteAgendaId`.

### Regras puras (`server/src/modules/planta/dominio/grupo.ts`)

- `registrar`/`concluir` gravam `transplanteAgendaId` ao mover a planta: o plano leva a atividade Transplante
  (`AtualizacaoGrupo.transplanteAtividadeId`) e o repositório acha, na transação, a tarefa concluída daquela
  planta+atividade na data do registro (ela pode ter acabado de ser criada).
- Troca manual de grupo (`UpdatePlantaUseCase`) e o retorno automático por expiração
  (`resolverGruposVencidos` no `prisma-planta.repository.ts`, SQL cru) limpam `transplanteAgendaId`.
- Nova `reavaliarRecemTransplantada(estado, transplante, dias, agora)`:
  - `estado.grupo !== RECEM_TRANSPLANTADA` ou `transplanteAgendaId` nulo → sem mudança.
  - `transplante` nulo (apagado ou não está mais `CONCLUIDO`) → `{ grupo: grupoAnterior, grupoAnterior: null,
    grupoExpiraEm: null, transplanteAgendaId: null }`.
  - Senão `expira = dataDoTransplante + dias`: se `expira <= agora` → volta ao anterior (como acima);
    se `expira` ≠ `grupoExpiraEm` → atualiza `grupoExpiraEm`; igual → sem mudança.
  - Nunca coloca uma planta em Recém transplantada (isso continua sendo escolha do usuário no registrar/concluir).

### Reavaliação central

- `ReavaliarGrupos` (módulo planta): `execute(plantaIds, usuarioId, tx?)` carrega as plantas, as tarefas
  referenciadas por `transplanteAgendaId` e a preferência `transplante_dias`, aplica
  `reavaliarRecemTransplantada` e grava só as plantas que mudaram. Interface de repositório própria
  (mockável), implementação Prisma aceitando o cliente da transação.
- Injetada no construtor e chamada no fim (dentro da transação quando houver) de: `RegistrarCuidadosUseCase`,
  `ConcluirAgendasUseCase`, `UpdateAgendaUseCase`, `DeleteAgendaUseCase` e dos dois use cases novos.

### Endpoints novos

- `PUT /api/agendas/cuidado` — `EditarCuidadoUseCase`. Corpo:
  `{ agendaIds: uuid[] (≥1), dataConcluida?: datetime, textos?: { agendaId, detalhes?: string|null, observacaoFutura?: string|null }[], removerAgendaIds?: uuid[] }`.
  Numa transação: aplica `dataConcluida` em todas as que ficam, aplica os textos, apaga as removidas,
  reavalia o grupo da planta. Resposta: as tarefas que ficaram.
- `POST /api/agendas/cuidado/excluir` — `ExcluirCuidadoUseCase`. Corpo `{ agendaIds: uuid[] (≥1) }`.
  Numa transação: apaga as tarefas e reavalia o grupo. Resposta 204.
- Validação (ambos): todas as tarefas existem, são do usuário, estão `CONCLUIDO` e são da mesma planta;
  `removerAgendaIds ⊂ agendaIds` e não todas; `textos[].agendaId ∈ agendaIds`. Falha → 400/404 com mensagem
  simples (`mensagemDoErro` para Zod).
- Rotas registradas antes de `/:id` no `agenda.router.ts` (para `cuidado` não cair como id).

### O que não muda

- Fotos de tarefas apagadas ficam na galeria (`Foto.agendaId` → `SetNull`, comportamento atual); a data
  da foto não muda quando a data do cuidado muda.
- A próxima tarefa de uma rotina não é reagendada por edição/exclusão de uma tarefa já feita.
- Pré-transplante continua resolvido na leitura de `GET /plantas`.

## Web (arquivos)

- `src/lib/endpoints.ts`: `agendasApi.editarCuidado`, `agendasApi.excluirCuidado`; `Planta.transplanteAgendaId` em `types.ts`.
- `src/lib/cuidadoDoDia.ts` (regras puras, vitest): lista de cuidados feitos da planta em ordem; índice do
  cuidado de uma tarefa; vizinho após excluir; modo dos textos (campo único × por tarefa) e montagem de
  `textos` a partir do formulário; aviso de "vai juntar" para uma data.
- `src/components/cuidado/PainelCuidado.tsx`, `CuidadosDaPlanta.tsx` (rolagem + navegação),
  `EditarCuidado.tsx` (gaveta), página `TarefaPage.tsx` passa a usar `CuidadosDaPlanta` para concluídas.

## Testes

- Server (jest, repositórios mockados): `reavaliarRecemTransplantada` (fora do grupo, sem id, transplante
  sumiu, data mudou, expirou, igual); registrar/concluir com `transplanteAtividadeId`; `EditarCuidadoUseCase` e
  `ExcluirCuidadoUseCase` (validações, chamadas ao repositório, reavaliação); `registrar`/`concluir`/
  `update`/`delete` chamam a reavaliação; schemas novos.
- Web (vitest): `src/lib/cuidadoDoDia.ts`.
- Navegador (conta local, 390px): deslizar entre cuidados; editar data/textos/tirar tarefa; excluir
  cuidado com Transplante e conferir o grupo voltando; tarefa cancelada legada.
