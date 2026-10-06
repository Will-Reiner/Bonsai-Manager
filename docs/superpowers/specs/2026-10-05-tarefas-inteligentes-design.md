# Tarefas inteligentes — design

Data: 2026-10-05 · Status: aprovado em conversa, aguardando revisão do spec

## Problema

1. Registrar um cuidado avulso (ex.: Adubação via `/registrar`) cria uma `Agenda` CONCLUIDO nova, mas a tarefa PENDENTE da mesma atividade naquela planta continua na agenda.
2. Toda tarefa é única; não há como agendar "a cada N dias".
3. Não há visibilidade de quando cada cuidado foi feito pela última vez na hora de registrar/agendar.

## Decisões

| Tema | Decisão |
|---|---|
| Reconciliação | **Perguntar**: a tela de registro lista as pendentes compatíveis, todas pré-marcadas |
| Janela da reconciliação | Pendentes atrasadas (qualquer idade) + vencendo em até **90 dias** |
| Texto | Relativo: "agendada daqui 12 dias", "agendada para hoje", "atrasada há 5 dias" |
| Recorrência | **Rolante**: próxima = data em que foi feito + intervalo; 1 pendente por rotina |
| Sazonalidade | Estações escolhidas na rotina, pré-preenchidas pelo `GuiaSazonal`; hemisfério sul fixo |
| Intervalo sugerido | **Só histórico**: mediana dos intervalos com ≥ 2 execuções; sem histórico, vazio |
| Revisão geral | Vira rotina padrão de cada planta; **qualquer** cuidado concluído na planta a remarca |
| Unicidade | No máximo uma rotina por (planta, atividade) |

## Modelo de dados

```prisma
model Rotina {
  id            String    @id @default(uuid())
  intervaloDias Int
  estacoes      Estacao[] // vazio = ano todo
  pausada       Boolean   @default(false)
  dataFim       DateTime?
  revisao       Boolean   @default(false) // Revisão geral da planta
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  plantaId      String
  planta        Planta    @relation(fields: [plantaId], references: [id], onDelete: Cascade)
  atividadeId   String
  atividade     Atividade @relation(fields: [atividadeId], references: [id])

  agendas       Agenda[]

  @@unique([plantaId, atividadeId])
}
```

`Agenda` ganha:
- `rotinaId String?` (relação `onDelete: SetNull`)
- `pulada Boolean @default(false)` — distingue "pulada" de "cancelada" no histórico.

## Regras de domínio

Funções puras em `server/src/modules/agenda/dominio/`, testadas isoladamente.

1. **Uma pendente por rotina.** Ao concluir uma tarefa com `rotinaId` (via `/concluir`, `/registrar` com reconciliação), gera a próxima em `proximaDataRotina(rotina, dataFeita)`.
2. **`proximaDataRotina`**: `dataFeita + intervaloDias`; se a data cair numa estação fora de `estacoes` (quando não vazio), avança para o 1º dia da próxima estação ativa. Se passar de `dataFim`, não gera nada.
3. **`estacaoDe(data)`** — hemisfério sul, datas fixas: Primavera 22/09, Verão 21/12, Outono 20/03, Inverno 21/06. Única função a trocar no futuro (hemisfério configurável, meses customizados, fenologia).
4. **Pular esta vez** (`POST /agendas/:id/pular`): pendente → `CANCELADO` + `pulada = true`; próxima gerada a partir de **hoje**.
5. **Pausar**: `pausada = true`, pendente da rotina → `CANCELADO`. **Retomar**: `pausada = false`, gera próxima a partir de hoje.
6. **Revisão geral** (`revisao = true`): qualquer conclusão de cuidado na planta (qualquer atividade, inclusive a própria revisão) faz a pendente de revisão ser remarcada para `dataFeita + intervaloDias` (respeitando estações/pausa/fim). Se não houver pendente (ex.: acabou de ser concluída), cria.
7. **Rotina de revisão automática**: toda planta nova recebe uma rotina de Revisão geral com `intervaloDias = revisao_automatica_dias` do usuário (preferência existente); se 0, não cria. A preferência passa a significar "intervalo padrão para plantas novas".
8. **Reconciliação**: `POST /agendas/registrar` aceita `concluirAgendaIds[]`. Cada id deve ser PENDENTE, do usuário, de uma planta do registro e de uma atividade registrada para essa planta. Em vez de criar uma Agenda CONCLUIDO nova para esse (planta, atividade), a pendente é concluída com data, detalhes e fotos do registro. Depois aplica as regras 1 e 6.
9. **Próximos passos com repetição**: itens de `proximos` em `/concluir`, `/registrar` e `/lote` aceitam `repetir?: { intervaloDias, estacoes[], dataFim? }`. Com `repetir`, cria (ou, se já existir rotina da mesma atividade na planta, reutiliza sem alterar) a rotina e vincula a pendente.
10. **Fim do caso especial**: `planejarSeguimento` deixa de criar revisões; ele só cria os próximos passos. A Revisão é tratada por `avancarRotinas`.

`avancarRotinas(conclusoes: { plantaId, atividadeId, agendaId?, data }[])` concentra as regras 1, 2 e 6 e é chamada por concluir, registrar e pular.

## API

### Módulo novo `rotina/`

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/rotinas` | `{ plantaIds[], atividadeId, intervaloDias, estacoes[], dataFim?, primeiraData? }` → cria uma rotina por planta + 1ª pendente (`primeiraData` ou hoje + intervalo). Plantas que já têm rotina da atividade voltam em `conflitos` (sem erro). |
| GET | `/api/rotinas?plantaId=` | Rotinas da planta (com próxima pendente). |
| PUT | `/api/rotinas/:id` | Edita intervalo/estações/fim; recalcula a pendente a partir da última conclusão (ou de hoje). |
| DELETE | `/api/rotinas/:id` | Cancela a pendente e remove a rotina; histórico mantém as agendas (`rotinaId` → null). |
| POST | `/api/rotinas/:id/pausar` · `/retomar` | Regra 5. |

### Módulo `agenda`

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/agendas/candidatas?plantaIds=&atividadeIds=` | Pendentes atrasadas ou com vencimento ≤ 90 dias, com planta, atividade, `rotinaId`. |
| GET | `/api/agendas/ultimas?plantaIds=` | Por (planta, atividade): `ultimaData` e `medianaIntervaloDias` (≥ 2 execuções, senão null). Fonte única para "há X dias" e intervalo sugerido. |
| POST | `/api/agendas/:id/pular` | Regra 4 (só para tarefas com rotina). |
| POST | `/api/agendas/registrar` | + `concluirAgendaIds[]`, + `repetir` nos `proximos`. |
| POST | `/api/agendas/concluir`, `/lote` | + `repetir` nos `proximos` / itens. |

> **Fase 1 (implementada):** candidatas e "última vez" são calculadas no cliente a partir de `GET /api/agendas` (já traz o histórico completo, em cache via `useAgendas`) — `web/src/lib/cuidados.ts`. `GET /agendas/candidatas` e `/ultimas` só se o volume justificar.

> **Fase 2 (implementada):** `POST /rotinas` aceita `atividadeIds[]` (uma rotina por planta+atividade, numa transação); sugestão de intervalo (mediana) calculada no cliente; "Repetir" em próximo passo com rotina já existente e com pendente (ou pausada, ou encerrada antes da data) cria a tarefa avulsa; "Pausar" fica no painel da rotina (RotinaSheet). O Agendar com Repetir usa `POST /rotinas` (o `/lote` não aceita `repetir`); trocar a atividade ao concluir uma tarefa de rotina desvincula a tarefa e a rotina segue a partir de hoje; editar a rotina ancora na última conclusão ou na pendente atual (o que for mais recente).

> **Fase 3 (implementada):** estações por datas fixas (hemisfério sul, em UTC) em `server/src/modules/agenda/dominio/estacoes.ts`; Revisão geral = rotina `revisao=true` remarcada por qualquer cuidado (`remarcarRevisoes`); plantas novas recebem a rotina no `CreatePlantaUseCase`; a migração `revisao_como_rotina` cria as das plantas existentes e vincula a revisão pendente mais próxima, sem criar pendentes novas.

`GET /api/agendas` e `GET /api/agendas/:id` passam a incluir `rotina` (intervalo, pausada) para o ícone ↻.

## Interface (web/)

**Agendar — `ScheduleCareSheet`**
- Chip de atividade mostra "há 12 dias" / "nunca" para a planta; com várias plantas, intervalo ("há 5–40 dias").
- Seletor **Uma vez / Repetir**. Repetir: "a cada [N] dias" (pré-preenchido pela mediana quando existir, com dica "você costuma fazer a cada ~16 dias"), chips de estação pré-marcados pelo `GuiaSazonal` da espécie (EVITAR desmarcado; sem guia → todos marcados), "até" opcional.
- Rotina já existente da atividade na planta → aviso "já existe rotina a cada 14 dias — editar?".

**Próximos passos — `ProximosPassos`**: mesmo seletor Repetir.

**Registrar — `RegistrarPage`**
- "Última vez há X dias" ao lado de cada atividade.
- Bloco **"Tarefas que serão concluídas"** antes de salvar, uma linha por candidata, pré-marcadas: `☑ Adubação · Ficus #12 · agendada daqui 12 dias ↻`. Desmarcar mantém a tarefa pendente (e o registro cria agenda nova, como hoje).

**Tarefa — `TarefaPage`, `TaskCard`, `BenchTaskCard`**
- Ícone ↻ + "a cada 14 dias" em tarefas de rotina.
- `TarefaPage`: ações **Pular esta vez**, **Editar rotina**, **Pausar rotina**.

**Planta — `PlantDetailPage`**
- Seção **Rotinas**: "Adubação · a cada 14 dias · Prim/Ver · próxima em 3 dias" com editar, pausar/retomar, apagar. Inclui a Revisão geral.
- Seção **Últimos cuidados**: "Adubação há 12 dias · Poda há 3 meses…".

**Perfil**: texto da preferência → "Intervalo padrão da Revisão geral em plantas novas".

## Migração

1. Cria tabela `Rotina`, colunas `Agenda.rotinaId` e `Agenda.pulada`.
2. (Fase 3) Para cada planta de usuário com `revisao_automatica_dias > 0` (ou padrão do sistema): cria rotina de Revisão geral; vincula a pendente de Revisão geral mais próxima, se houver; demais pendentes de revisão duplicadas permanecem como tarefas avulsas.
3. Tarefas avulsas existentes ficam com `rotinaId = null`.

## Fases de entrega

Cada fase é deployável sozinha.

1. **Reconciliação + "última vez"** — `candidatas`, `ultimas`, `concluirAgendaIds`, bloco no Registrar, "há X dias" no Registrar/Agendar, seção Últimos cuidados. Não depende de rotina.
2. **Rotinas** — modelo + migração (sem revisão), módulo `rotina/`, `avancarRotinas` (regras 1, 2 sem estações, 4, 5, 9), Repetir no Agendar/Próximos passos, ↻ nos cards, ações na TarefaPage, seção Rotinas, intervalo sugerido.
3. **Sazonalidade + Revisão como rotina** — estações (regras 2 e 3), pré-preenchimento pelo `GuiaSazonal`, regras 6, 7 e 10, migração das revisões, texto do Perfil.

## Testes

- **Backend (TDD, AAA, repositórios mockados)**: foco nas funções puras — `estacaoDe` (bordas 21/12↔22/12 etc.), `proximaDataRotina` (fora de estação, `dataFim`, pausada), pular, mediana de intervalos, janela de 90 dias, validação de `concluirAgendaIds` (outro usuário, outra planta, outra atividade, já concluída), revisão remarcada por qualquer cuidado, conflito de rotina duplicada.
- **Navegador (conta `testeclaude@bonsai.dev`)**: registrar adubação com pendente → pendente some; criar rotina, concluir → próxima aparece no intervalo certo; pular; pausar/retomar.

## Limitações conhecidas

- Estações por data fixa do hemisfério sul; não considera hemisfério do usuário, microclima nem fenologia real. Isolado em `estacaoDe` para evoluir.
- Uma rotina por (planta, atividade): não suporta duas frequências diferentes da mesma atividade na mesma planta.
- Intervalo sugerido depende de histórico; plantas/atividades novas não têm sugestão.
