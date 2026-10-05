# Bancada de trabalho + Tela de conclusão — Design

Data: 2026-10-05 · Origem: `docs/prompt.md` · Escopo: **web/** + **server/** (não mexer em `mobile_app/`)

## Objetivo

1. Transformar a aba "Hoje" numa **Bancada de trabalho**: tarefas atrasadas + próximas (7 dias), agrupadas por tipo de atividade, com foto grande e ID da planta em destaque; concluir tarefa a tarefa ou por grupo.
2. **Tela de detalhe da tarefa** com foto/ID da planta e histórico horizontal (passado / atual / futuro), com indicador clicável de observação.
3. **Toda conclusão passa por uma tela de conclusão** (foto, troca de atividade, procedimentos extras, descrição, obs., próximos passos).
4. **Revisão geral automática**: se a conclusão não gerar tarefa nova, criar uma "Revisão geral" (padrão 30 dias, configurável/desligável).

Fora do escopo: produtos utilizados (inventário), mobile_app.

## Decisões tomadas

| Tema | Decisão |
|---|---|
| Produtos utilizados | Ignorado por enquanto |
| Conclusão em grupo | Formulário comum para todas + ajuste opcional por planta (foto, descrição, obs.) |
| Campos de texto | Descrição → `Agenda.detalhes`; Obs. → `Agenda.observacaoFutura` (é a obs. que gera o ícone no histórico) |
| "Adicionar procedimento" | Ambos: trocar a atividade da tarefa **e** registrar outros procedimentos feitos junto (já concluídos) |
| Atividade da tarefa automática | Nova atividade global **"Revisão geral"** |
| Janela | Próximos 7 dias (hoje + 6). Seção chamada **"Próximas tarefas"** |
| Implementação da conclusão | Endpoint único transacional no backend (`POST /agendas/concluir`) |
| Foto ↔ procedimento | Novo `Foto.agendaId` opcional |
| Botão ✓ | Não conclui mais em 1 toque; abre a tela de conclusão |

## Regra da Revisão geral automática

Preferência `revisao_automatica_dias` (string numérica, padrão `"30"`, `"0"` = desligada). Seja `N` esse valor.

Para **cada planta** envolvida numa conclusão:

1. Se `N = 0` → nada.
2. Se a conclusão criou ao menos um próximo passo para essa planta → nada.
3. Busca a tarefa PENDENTE mais próxima da planta com `dataAgendada >= agora` (excluindo as que acabaram de ser concluídas).
4. Se existir e `dataAgendada <= agora + N + 30 dias` → nada.
5. Caso contrário → cria agenda PENDENTE "Revisão geral" com `dataAgendada = agora + N dias`.

Exemplo (N=30): já existe tarefa daqui 45 dias → não cria; próxima é daqui 70 dias (ou nenhuma) → cria revisão em 30 dias.

A atividade "Revisão geral" é buscada por nome; se não existir (seed não rodado), é criada (upsert) dentro da transação.

## Backend

### Schema / migration

- `Foto.agendaId String?` + relação `agenda Agenda? @relation(onDelete: SetNull)`; `Agenda.fotos Foto[]`.
- Seed: adicionar `{ nome: 'Revisão geral', descricao: 'Observar a planta como um todo e decidir os próximos cuidados.' }`.

### Listagem de agendas

`GET /agendas` e `GET /agendas/:id`: incluir `planta.identificador` no select e `fotos: { select: { id, caminhoArquivo } }` da agenda.

### `POST /agendas/concluir`

Body (Zod):

```ts
{
  dataConcluida: string (datetime),          // comum
  atividadeId?: string (uuid),               // troca de atividade (aplica a todas as tarefas)
  detalhes?: string,                         // descrição comum
  observacaoFutura?: string,                 // obs. comum
  extras?: string[] (uuid),                  // atividades feitas junto, criadas já CONCLUIDO em cada planta
  proximos?: { atividadeId: uuid, dataAgendada: datetime }[],  // criados PENDENTE em cada planta
  itens: {                                   // 1..n tarefas
    agendaId: uuid,
    detalhes?: string,                       // sobrescreve o comum para esta planta
    observacaoFutura?: string,
    fotos?: string[]                         // URLs já enviadas ao R2 (comum + específica, o front monta)
  }[]
}
```

Resposta: `{ concluidas: Agenda[], criadas: Agenda[], revisoes: Agenda[] }` (o front usa `revisoes` para avisar no toast).

Use case `ConcluirAgendasUseCase` (TDD, repo mockado):

- Valida que todas as `agendaId` pertencem ao usuário e estão PENDENTE (senão erro).
- Valida que `atividadeId`, `extras` e `proximos.atividadeId` existem.
- Lê a preferência `revisao_automatica_dias` (via repositório de preferência injetado).
- Monta e executa tudo via um método transacional do repositório (`concluirEmLote`), que:
  - atualiza cada agenda (status CONCLUIDO, dataConcluida, atividadeId se trocado, detalhes/observacaoFutura com precedência item > comum);
  - cria os extras (CONCLUIDO, mesma data, detalhes comum);
  - cria as fotos (`Foto` com `plantaId`, `agendaId`, `usuarioId`, `titulo` = nome da atividade, `dataCaptura` = dataConcluida);
  - cria os próximos passos por planta;
  - aplica a regra da revisão por planta (plantas distintas dos itens).
- Testes cobrem: conclusão simples; grupo; troca de atividade; extras; próximos passos suprimem revisão; regra N+30 (dentro/fora do limite, sem pendente); N=0; tarefa de outro usuário / já concluída → erro.

O `PUT /agendas/:id` continua existindo (reagendar/cancelar).

## Frontend (web/)

### Navegação

- Aba "Hoje" → **"Bancada"** (rota `/`, `TodayPage` reescrita como `BancadaPage`).
- Novas rotas privadas: `/tarefas/:id` (detalhe) e `/concluir?ids=a,b,c` (conclusão).
- `CareContext`: `abrirTarefa` passa a navegar para `/tarefas/:id`; `TaskSheet` é removido (reagendar continua via `ScheduleCareSheet`; cancelar/excluir movem para a tela de detalhe).

### Bancada (`/`)

- Saudação + título "Bancada".
- Seção **Atrasadas** e seção **Próximas tarefas** (hoje..+6 dias). Dentro de cada seção, grupos por atividade (ordenados por data mais antiga do grupo): cabeçalho `Adubação · 4` + botão **Concluir grupo** (→ `/concluir?ids=...` com as tarefas do grupo naquela seção).
- Card de tarefa (novo `BenchTaskCard`): foto grande da planta (aspect ~4/3, grid 2 colunas no mobile), **badge com o identificador** sobreposto na foto (fallback: nome), nome/espécie e data relativa abaixo; botão ✓ → `/concluir?ids=<id>`; toque no card → `/tarefas/:id`.
- Mantém: estado vazio sem plantas, "Nada pendente", dica da estação, botão "Registrar cuidado sem agendamento".

### Detalhe da tarefa (`/tarefas/:id`)

- Topo: foto grande da planta + identificador (destacado) + nome/espécie; link para a planta.
- **Histórico horizontal** (scroll-x com snap) de todas as agendas da planta (CONCLUIDO + PENDENTE, ordenadas por data; canceladas omitidas), rolado automaticamente até a tarefa atual:
  - passado: card esmaecido, ícone ✓, data de conclusão, miniatura se houver foto;
  - atual: borda/realce na cor primária, rótulo "Agora";
  - futuro: borda tracejada, data agendada.
  - Se `observacaoFutura` (Obs.) presente num card passado → ícone de balão clicável que abre um Sheet pequeno com o texto da obs. (e a descrição abaixo, se houver).
- Abaixo: data da tarefa + ações **Concluir** (→ `/concluir?ids=<id>`), **Reagendar**, **Cancelar**, **Excluir** (com confirmação).

### Conclusão (`/concluir?ids=...`)

Página cheia, rodapé fixo com botão "Concluir (n)".

1. **Plantas**: lista com foto/ID de cada tarefa, checkbox (todas marcadas). Cada uma expansível: foto, descrição e obs. só dela.
2. **Atividade**: mostra a atividade atual; botão "Trocar" abre seletor.
3. **Feito junto**: chips de atividades extras (adicionar/remover).
4. **Data**: padrão hoje (date input, máx. hoje).
5. **Descrição** (textarea) e **Obs.** (textarea, hint "aparece em destaque no histórico").
6. **Foto** comum (opcional, aplicada a todas as plantas marcadas).
7. **Próximos passos**: lista de (atividade + data) com atalhos +1 sem / +2 sem / +1 mês; dica: "Sem próximos passos, será criada uma Revisão geral em N dias" (oculta se N=0).

Envio: upload das fotos (comum uma vez, específicas por planta) → `POST /agendas/concluir` com apenas as tarefas marcadas → invalida `agendas` e `fotos` → toast (menciona revisões criadas) → volta para a Bancada.

### Preferência no Perfil

Na página de Perfil, bloco "Revisão automática": select `Desligada / 15 / 30 / 60 / 90 dias` → `PUT /preferencias/revisao_automatica_dias`.

### Tipos / endpoints

- `Agenda.planta` ganha `identificador`; `Agenda.fotos?: {id, caminhoArquivo}[]`.
- `agendasApi.concluir(body)`; `preferenciasApi.set(chave, valor)`.
- Helper `agruparPorAtividade(agendas)` em `lib/format.ts`.

## Verificação

- `cd server && npm test` (novo use case + existentes) e `npm run build`.
- `cd web && npm run build && npm run lint`.
- Teste manual no navegador: bancada agrupada, concluir grupo, detalhe com histórico/obs., revisão criada.
