# Grupos de plantas + Bancada com filtros — design

Data: 2026-10-06

## Objetivo

Facilitar a jornada do usuário agrupando plantas por fase de cultivo e reorganizando a Bancada para que o usuário veja as tarefas por grupo (padrão), por tarefa ou por espécie, dentro de um período escolhido.

## Fora do escopo

- Grupos criados pelo usuário (trabalho futuro, desconectado destes grupos fixos — provavelmente uma tabela própria).
- Planta em mais de um grupo.

## 1. Banco de dados

Enum fixo + 3 colunas opcionais em `Planta` (migração só aditiva; plantas existentes ficam "Sem grupo"):

```prisma
enum GrupoPlanta {
  RECEM_TRANSPLANTADA
  DEBILITADA
  EM_CRESCIMENTO
  REFINAMENTO
}

model Planta {
  // ...
  grupo          GrupoPlanta?   // null = sem grupo
  grupoAnterior  GrupoPlanta?   // grupo de retorno ao fim do prazo (null = volta para "sem grupo")
  grupoExpiraEm  DateTime?      // fim do período em RECEM_TRANSPLANTADA (automático)
}
```

Nova preferência `transplante_dias` (`PreferenciaUsuario`, chave/valor): padrão **15**; inteiro 1–365.

Rótulos (UI): Recém transplantada · Debilitada · Em crescimento · Refinamento · Sem grupo.

## 2. Regras de domínio (backend)

Funções puras em `server/src/modules/planta/dominio/grupo.ts`, com testes:

- **`aplicarTransplante(estado, dataRegistro, dias)`** — chamado quando um registro inclui a atividade "Transplante" e `moverRecemTransplantada === true`:
  - se `grupo !== RECEM_TRANSPLANTADA`: `grupoAnterior = grupo` (pode ser null);
  - se já estava em `RECEM_TRANSPLANTADA` com expiração: mantém o `grupoAnterior` original;
  - `grupo = RECEM_TRANSPLANTADA`, `grupoExpiraEm = dataRegistro + dias`.
- **Expiração** — se `grupoExpiraEm <= agora`: `grupo = grupoAnterior`, `grupoAnterior = null`, `grupoExpiraEm = null` (um `UPDATE` no repositório, ver abaixo).
- **Troca manual** (`PUT /plantas/:id` com `grupo`, inclusive `null`): define o grupo e zera `grupoAnterior` e `grupoExpiraEm` (cancela o retorno automático). Atualizações de planta sem o campo `grupo` não mexem nesses campos. Escolher manualmente `RECEM_TRANSPLANTADA` não cria expiração.
- Registro de transplante com a opção desmarcada (ou ausente): nenhuma mudança de grupo.

### Expiração "lazy"

Sem cron (Vercel free). Em `GET /plantas` e `GET /plantas/:id`, antes de ler, o use case chama `resolverGruposVencidos(usuarioId, agora)`: um único `UPDATE "Planta" SET grupo = grupoAnterior, ...` (SQL bruto, pois o Prisma não copia coluna→coluna) nas plantas do usuário com `grupoExpiraEm <= agora`. `GET /agendas` que inclui `planta` também precisa do grupo correto: a Bancada agrupa pelo grupo da planta vindo de `usePlantas()` (mapa `plantaId → grupo`), então basta a resolução em `GET /plantas`.

### API

- `POST /api/plantas` e `PUT /api/plantas/:id`: aceitam `grupo` (enum ou null) no schema Zod.
- Resposta de planta inclui `grupo`, `grupoAnterior`, `grupoExpiraEm`.
- `POST /api/agendas/registrar`: novo campo opcional `moverRecemTransplantada: boolean`. O use case `registrar-cuidados` identifica a atividade "Transplante" (por nome, como a "Revisão geral" é identificada hoje) entre as atividades registradas por planta e aplica `aplicarTransplante` com a preferência `transplante_dias` do usuário (padrão 15). A data base é a data do registro (retroativo usa a data informada; se a expiração já passou, a próxima leitura devolve a planta ao grupo anterior).

## 3. Frontend (web/)

- **Tipos/endpoints**: `Planta.grupo`, `grupoAnterior`, `grupoExpiraEm`; `GRUPOS` (ordem + rótulos) em `src/lib/grupos.ts`.
- **Criar/editar planta** (`AddPlantPage`, `EditPlantPage`): seletor de grupo (chips ou select) com "Sem grupo".
- **Detalhe da planta** (`PlantDetailPage`): exibe o grupo; se houver expiração, "volta para {anterior} em {data}".
- **Registrar** (`RegistrarPage`): quando a atividade "Transplante" está selecionada, checkbox "Mover para Recém transplantadas" **pré-marcado**, enviado como `moverRecemTransplantada`.
- **Coleção** (`CollectionPage`): select "Todos os grupos / Sem grupo / 4 grupos" ao lado do filtro de espécie.
- **Perfil** (`ProfilePages`): campo "Dias em Recém transplantadas" (preferência `transplante_dias`, padrão 15).
- Invalidação de cache: após registrar com transplante, invalidar `plantas`.

## 4. Bancada (`BancadaPage`)

Remover: título "Bancada", dica da estação (`ESTACAO_DICA`), botão "Registrar cuidado sem agendamento". Mantém a saudação.

Dois controles independentes no topo:

- **Período** — `semana` (próximos 7 dias, hoje–hoje+6; padrão), `mes` (até o último dia do mês corrente), `estacao` (até o fim da estação corrente, hemisfério sul — mesmas datas aproximadas de `web/src/lib/estacoes.ts`, ex.: primavera termina em 20/12), `todas` (todas as pendentes futuras).
- **Agrupar por** — `grupos` (padrão), `tarefas` (agrupamento atual por atividade), `especies`.

Seções:

- **Atrasadas** (sempre visíveis, independentes do período) no topo, organizadas pelo mesmo "agrupar por".
- **Próximas tarefas** filtradas pelo período.

Em `grupos`/`especies`: um bloco por grupo (ordem fixa: Recém transplantada, Debilitada, Em crescimento, Refinamento, Sem grupo) ou por espécie (alfabética, "Sem espécie" no fim); dentro de cada bloco, subgrupos por atividade (`agruparPorAtividade`) com "Concluir grupo" quando houver mais de uma. Blocos vazios não aparecem.

Escolhas de período e agrupamento persistem em `localStorage` (try/catch), como a view da Coleção.

Lógica pura em `src/lib/format.ts` (ou `src/lib/bancada.ts`): `tarefasDaBancada(agendas, periodo)` e `agruparPor(agendas, modo, plantasPorId)`. Estado vazio: mensagem adaptada ao período ("Nada pendente este mês").

## Testes

- Server (TDD, Jest): `dominio/grupo.test.ts` (aplicarTransplante, retransplante mantém anterior, trocaManual, diasDeTransplante); `registrar-cuidados` com/sem `moverRecemTransplantada`; `update-planta` troca manual zera expiração; `get-plantas-by-user` resolve expiração vencida.
- Web: `npm run build` + `npm run lint`; teste manual no navegador com a conta de teste `testeclaude@bonsai.dev` (Bancada nos 3 modos × 4 períodos, filtro da Coleção, registro de transplante, preferência no Perfil).

## Compatibilidade

- Migração aditiva, sem backfill. Clientes antigos ignoram os campos novos.
- `moverRecemTransplantada` opcional — registros sem ele seguem iguais.
- Comportamento atual da Bancada = período `semana` + agrupar por `tarefas`.
