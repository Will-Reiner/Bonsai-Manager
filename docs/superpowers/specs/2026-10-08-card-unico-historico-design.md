# Card único no histórico (cuidados do mesmo dia)

Data: 2026-10-08 · Item do `docs/todo.md`: "ao registrar duas tarefas, entra as duas separadas no histórico…"

## Problema

Registrar várias tarefas de uma vez numa planta (ex.: Adubação + Desaramação) gera um agendamento por tarefa, e o histórico mostra um card por tarefa. A descrição e a obs. do registro vão só para a 1ª tarefa, então um texto sobre a Desaramação pode aparecer no card da Adubação.

## Objetivo

No histórico, tudo o que foi feito na mesma planta no mesmo dia aparece num **card único**. As notas (descrição e obs.) ficam dentro do card, apontando para a tarefa a que pertencem quando não valem para todas. O usuário não precisa escrever nada a mais ao registrar.

## Fora do escopo

- Mudar o banco (sem campo novo, sem migration): o agrupamento é só de exibição.
- Pendentes e atrasadas: continuam um card por tarefa.
- Redesenho da página da tarefa pendente (é outro item do todo).
- Corrigir registros antigos: textos antigos ficam só na 1ª tarefa e aparecem com o rótulo dela.

## Regra de agrupamento (`web/src/lib/linhaDoTempo.ts`, pura)

- Tarefas `CONCLUIDO` da planta são agrupadas por **dia local** (`toDateInput(dataConcluida ?? dataAgendada)`), virando um item `{ tipo: 'cuidado', data, agendas, fotos, notas }`:
  - `agendas`: as tarefas do dia, em ordem de conclusão (desempate pela ordem de entrada).
  - `data`: a data da primeira tarefa do dia.
  - `fotos`: fotos das tarefas do dia + fotos avulsas (sem tarefa concluída) do mesmo dia, sem repetição.
  - `notas`: lista de `{ tipo: 'detalhes' | 'obs', texto, atividades: string[] | null }`. Textos iguais (após `trim`) dentro do mesmo tipo viram uma nota só, juntando as tarefas que o têm. `atividades` é `null` (sem rótulo) quando o texto pertence a todas as tarefas do card ou quando o card tem uma tarefa só; senão traz os nomes das tarefas (ordem do card). Ordem: descrições antes de obs.; dentro de cada tipo, pela primeira tarefa que tem o texto.
- Título do card: nomes das atividades sem repetição, unidos por " + " (`'Cuidado'` se faltar nome).
- Fotos avulsas de um dia sem cuidado continuam como item `{ tipo: 'fotos' }`, como hoje.
- `pendentes` não muda.
- `chaveItem` do cuidado: `c-<dia>`.
- Helper exportado `tarefasDoDia(agendas, agenda)`: as tarefas concluídas da mesma planta no mesmo dia local da tarefa informada, na mesma ordem do card (usado pela página da tarefa).

## Telas

- **Página da planta** (carrossel "Histórico e cuidados", `CardLinha`): o item `cuidado` mostra a capa (1ª foto), o contador de fotos e o título "A + B" (`line-clamp-2`). Tocar abre a 1ª tarefa do dia (`abrirTarefa`). "Última" aponta para o último item `cuidado`.
- **Histórico completo** (`PlantHistoryPage`): um item por dia com a data, os nomes das tarefas (cada um é um botão que abre a tarefa, separados por " + "), as notas (descrição em texto normal; obs. como "Próxima vez: …"; com rótulo "Nome: " quando `atividades` não é `null`) e as miniaturas de todas as fotos.
- **Página da tarefa** (`TarefaPage`):
  - `HistoricoPlanta` usa o mesmo agrupamento: um card por dia de cuidado (título "A + B"), destaque "Agora" no card que contém a tarefa aberta; pendentes como hoje; o botão de obs. abre a folha com as notas do card (com rótulos).
  - Tarefa **concluída**: entre a foto da planta e o histórico, um carrossel com um painel por tarefa de `tarefasDoDia` (scroll-snap horizontal nativo), com pontinhos e "1 de N" quando há mais de uma. Cada painel: nome da tarefa, "Concluída · data", descrição e obs. dela, fotos dela. Abre no painel da tarefa da URL. Ao deslizar, o título da página muda e a URL vira `/tarefas/:id` da tarefa visível com `replace` (o voltar não acumula). Com uma tarefa só: um painel, sem pontinhos.
  - Tarefa pendente ou cancelada: como hoje.
- **Concluir → Ajustar plantas** (`ConcluirPage`): continua por tarefa; o subtítulo de cada item mostra o nome da tarefa (ex.: "Ficus · Desaramação"), para o usuário saber para qual tarefa escreve.

## Backend

- **Registrar** (`PrismaConclusaoRepository.registrar`): `detalhes` e `observacaoFutura` do cuidado vão para **todas** as tarefas da planta no registro (criadas e absorvidas), não só a 1ª. Mantém: sem texto no registro, a pendente absorvida preserva a instrução do agendamento. Fotos continuam na 1ª tarefa.
- **Concluir**: sem mudança.
- Atualizar o comentário de `PlanoRegistro.cuidados` em `agenda.types.ts`.

## Testes

- Web: `web/src/lib/linhaDoTempo.test.ts` (vitest) — agrupa mesmo dia / separa dias; virada do dia no fuso local; fotos avulsas entram no cuidado do dia ou viram item `fotos`; notas iguais deduplicadas; rótulo só quando a nota é de parte das tarefas; card de 1 tarefa sem rótulo; título sem nomes repetidos; `tarefasDoDia`; pendentes intactas.
- Server: mudança só no repositório (sem teste unitário — Prisma mockado); `npm test` precisa continuar verde.
- Navegador (conta local `teste.web@bonsai.test`): registrar 2 tarefas com descrição numa planta; conferir o card único no carrossel da planta, no histórico completo e na página da tarefa; deslizar entre as tarefas; ajustar por tarefa no Concluir.
- Final: server `npm test` + `tsc`; web `npm run build`, `npm run lint`, `npx vitest run`.
