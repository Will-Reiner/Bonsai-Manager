# Grupo "Pré-transplante" — design

Data: 2026-10-06 · Continua `2026-10-06-grupos-de-plantas-design.md`.

## Objetivo

Plantas com um Transplante agendado entram sozinhas no grupo **Pré-transplante** X dias antes da data (preferência do Perfil). Quando o transplante é feito, vão para Recém transplantada e, ao fim desse prazo, voltam ao grupo de antes do Pré-transplante.

## Decisões do usuário

- Entrada **automática pelo agendamento** (não é escolhido à mão).
- Concluir uma tarefa de Transplante (tela `/concluir`) também move para Recém transplantada, com a opção **pré-marcada** (igual ao Registrar).
- Troca manual durante o Pré-transplante: **a planta fica onde o usuário colocou** (para aquele agendamento). Um novo agendamento de Transplante a coloca de novo.
- Preferência `pre_transplante_dias`: padrão **30**, opções 15/30/45/60 (aceita 1–365).

## 1. Banco

- `enum GrupoPlanta` ganha `PRE_TRANSPLANTE`.
- `Planta.preTransplanteAgendaId String?` — agendamento de Transplante que já colocou a planta no Pré-transplante (sem FK; é só um marcador).

Migração aditiva.

## 2. Regras (servidor, `planta/dominio/grupo.ts`, puras)

`planejarPreTransplante(plantas, pendentes, agora, dias)` → mudanças, onde `pendentes` são as agendas PENDENTE da atividade "Transplante" das plantas do usuário. Para cada planta, `proxima` = a pendente de Transplante mais cedo com `dataAgendada <= agora + dias` (atrasadas incluídas).

- **Em Pré-transplante:** sem `proxima` → volta: `grupo = grupoAnterior`, `grupoAnterior = null`, `preTransplanteAgendaId = null`. Com `proxima` de outro id → só atualiza o marcador.
- **Fora (e não em Recém transplantada):** com `proxima` e `proxima.agendaId !== preTransplanteAgendaId` → entra: `grupoAnterior = grupo`, `grupo = PRE_TRANSPLANTE`, `preTransplanteAgendaId = proxima.agendaId`.
- Caso contrário, nada.

`aplicarTransplante`: se o grupo atual é Pré-transplante **ou** Recém transplantada, mantém o `grupoAnterior` (retorno = grupo de antes do pré).

`trocaManual` não mexe em `preTransplanteAgendaId` (o marcador impede reentrada pelo mesmo agendamento). O usuário não pode escolher `PRE_TRANSPLANTE` à mão (o schema Zod de planta não aceita).

`diasDePreTransplante(valor)`: padrão 30, limita 1–365.

## 3. Aplicação na leitura

`GET /plantas` e `GET /plantas/:id` chamam `atualizarGruposAutomaticos(repo, usuarioId, agora)`: primeiro `resolverGruposVencidos` (Recém transplantada vencida volta), depois lê `estadoPreTransplante(usuarioId)` (dias da preferência, pendentes de Transplante, plantas candidatas = em Pré-transplante ou com pendente de Transplante) e grava as mudanças de `planejarPreTransplante` (`aplicarMudancasPre`). Cobre qualquer forma de agendar (avulso, lote, rotina, próximos passos), remarcar, cancelar ou apagar.

## 4. Concluir

`POST /agendas/concluir` aceita `moverRecemTransplantada?: boolean`. Atividade efetiva de cada tarefa = `dto.atividadeId ?? tarefa.atividadeId`, mais os `extras`. Plantas com Transplante entre elas recebem `aplicarTransplante` (mesma lógica do Registrar, extraída para `use-cases/planejar-grupos-transplante.ts`) e as mudanças são gravadas na transação de `executar` (`PlanoConclusao.atualizarGrupos`).

## 5. Web

- `GRUPOS_PLANTA` com Pré-transplante **primeiro** (ordem da Bancada/filtros): Pré-transplante, Recém transplantada, Debilitada, Em crescimento, Refinamento.
- `GrupoChips` não oferece Pré-transplante. Na edição de uma planta em Pré-transplante: texto "Pré-transplante (automático, por causa do transplante agendado). Escolher outro grupo tira a planta dele."
- Detalhe: "Pré-transplante · antes: {grupoAnterior}".
- Perfil: "Dias de Pré-transplante" (`pre_transplante_dias`).
- `/concluir`: quando a atividade efetiva ou um extra é Transplante, checkbox "Mover para Recém transplantadas" pré-marcado → `moverRecemTransplantada`. Após concluir, invalidar `plantas`.

## Testes

TDD nas regras puras (entrada, saída sem pendente, marcador após troca manual, Recém transplantada não entra, aplicarTransplante a partir do Pré), no helper de leitura, e no concluir com/sem a opção. Navegador com a conta local.
