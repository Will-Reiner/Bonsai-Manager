# Página da tarefa pendente: pendentes da planta

Data: 2026-10-08 · Origem: `docs/todo.md` (linha "na bancada, ao clicar numa planta com tarefa pendente…")

## Objetivo

Ao tocar numa tarefa pendente (Bancada, Coleção, histórico), a página `/tarefas/:id` mostra a **planta** e
todas as suas pendências, para concluir, reagendar ou excluir várias de uma vez — com a tarefa tocada em
destaque. Sem histórico nesta página.

Fora do escopo: a página da tarefa **concluída/cancelada** (carrossel do dia + histórico) continua igual.

## Página (tarefa pendente)

- **Cabeçalho:** título = `plantaCodigoNome(planta)` (`#14 · Ficus`), botão voltar.
- **Foto** da planta (como hoje, 4:3, `#N` + nome sobre gradiente), toque → `/plantas/:id`.
- **Último cuidado:** a tarefa `CONCLUIDO` mais recente da planta (por `dataConcluida ?? dataAgendada`):
  ícone + nome da atividade + "há N dias" + `observacoes`/`descricao` (2 linhas). Toque → `/tarefas/:idConcluida`.
  Sem nenhuma: "Nenhum cuidado registrado ainda".
- **Pendentes · N:** todas as `PENDENTE` da planta, da data mais antiga para a mais nova. Cada linha:
  caixa de seleção, ícone da atividade, nome, prazo (`textoPrazo`; atrasada em vermelho), ícone de rotina
  com o intervalo, instrução do agendamento (`detalhes`, 2 linhas).
  - A tarefa tocada começa **marcada** e tem fundo destacado sempre (mesmo desmarcada).
  - Tocar na linha marca/desmarca.
- **Barra fixa no rodapé:** `Concluir (N)` (primário), `Reagendar`, `Excluir`, `⋯`.
  Sem marcadas → todos desativados. `⋯` só ativo com exatamente 1 marcada.
- Removidos desta página: histórico da planta, bloco "Fotos do cuidado".

## Ações

- **Concluir (N):** `navigate('/concluir?ids=a,b,c')` — fluxo existente, sem mudança.
- **Reagendar:** `ReagendarSheet` recebe `agendas: Agenda[]` e tem duas abas:
  - **Nova data:** `DataFuturaCampo livre`; todas as marcadas vão para essa data. Com 1 marcada mantém
    a prévia `AgendaDaPlanta`.
  - **Adiar:** chips +1, +3, +7, +14, +30 dias e campo numérico (1–3650). Prévia por tarefa:
    "Poda · 06/10 → 13/10". Cada tarefa soma N dias à própria data.
  - Ao salvar: fica na página, lista atualiza (invalidate `agendas` e `rotinas`).
- **Excluir:** `ConfirmSheet` "Excluir N tarefa(s)?"; texto lembra que "Cancelar" mantém o registro e, se
  alguma marcada é de rotina, que a rotina fica sem próxima. Se a tarefa da URL foi excluída → volta
  (`navigate(-1)` ou `/`); senão fica e limpa a seleção.
- **⋯ (Mais), 1 marcada:** sheet com `Cancelar`, e se for de rotina `Pular esta vez` e `Editar rotina`.
  Mesmo comportamento de hoje (cancelar/pular da tarefa da URL voltam; de outra tarefa, ficam na página).

## Lote no cliente

Reagendar e excluir fazem uma chamada por tarefa com `Promise.allSettled` (sem endpoint novo — poucas
pendentes por planta). Toast: tudo ok → "3 tarefas reagendadas"/"Tarefa excluída"; parcial →
"2 de 3 reagendadas" (erro); nenhuma → mensagem do primeiro erro. Sempre invalida as queries.

## Código

- `web/src/lib/tarefasDaPlanta.ts` (puro, testado com vitest):
  - `pendentesDaPlanta(agendas, plantaId)` — pendentes ordenadas por data.
  - `ultimoCuidado(agendas, plantaId)` — concluída mais recente ou `undefined`.
  - `adiarData(iso, dias)` — ISO + N dias (mantém o horário).
  - `textoResultadoLote(ok, total, verbo)` — "3 tarefas reagendadas", "Tarefa excluída", "2 de 3 reagendadas".
- `web/src/components/tarefa/PendentesDaPlanta.tsx` — a página da tarefa pendente (foto, último cuidado,
  lista, barra, sheets de excluir e ⋯).
- `web/src/pages/TarefaPage.tsx` — pendente → `<PendentesDaPlanta>`; concluída/cancelada → como hoje.
- `web/src/components/care/ReagendarSheet.tsx` — `agendas: Agenda[]` + abas; `CareContext.reagendar`
  continua recebendo uma `Agenda` (embrulha em array).

## Testes

- Vitest das funções de `tarefasDaPlanta.ts`.
- `npm run build` e `npm run lint` no web.
- Navegador (conta local, 390px): abrir pendente pela Bancada, marcar várias, reagendar nos dois modos,
  excluir (a da URL e outra), menu ⋯, concluir em lote.
