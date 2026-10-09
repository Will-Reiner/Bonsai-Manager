# Acesso rápido na Bancada — design

Data: 2026-10-08 · Origem: `docs/todo.md` ("criar acesso rapido na bancada…")

## Objetivo

Registrar um cuidado já feito em várias plantas com 2 toques, a partir de atalhos que o próprio usuário configura na Bancada. Exemplos: "Adubação líquida em todas", "Enraizador nas Pré-transplante + Recém transplantada", "Adubação ácida nas azaleias".

## Decisões

- Tocar no atalho abre uma **confirmação rápida** (sheet): plantas do alvo já marcadas, desmarcáveis, botão "Registrar". Sem fotos, sem etapas.
- Alvo do atalho = **grupos e/ou espécies**; vazio = sem filtro (as duas listas vazias → todas as plantas). Resolvido na hora do toque.
- Atividades favoritas: **só a ordem** dos chips na criação (`AtividadeChips` já usa `useAtividadesOrdenadas`). Sem atalhos prontos.
- Tarefas agendadas da mesma planta + atividade: a confirmação conclui as **atrasadas ou que vencem em até 7 dias**, com um interruptor (ligado por padrão) para não concluir.
- Armazenamento: preferência `atalhos_bancada` (JSON) na API genérica `PUT /preferencias/:chave`. **Sem mudança no backend.**
- Fora do escopo (YAGNI): nome personalizado, reordenar, data retroativa, fotos, nota.

## Dados

```ts
interface Atalho {
  id: string;               // crypto.randomUUID()
  atividadeIds: string[];   // ≥ 1
  grupos: GrupoPlanta[];    // [] = sem filtro de grupo
  especieIds: string[];     // [] = sem filtro de espécie
}
```

Preferência `atalhos_bancada` = `JSON.stringify(Atalho[])`. Leitura tolerante: valor ausente, JSON quebrado ou itens malformados → descartados (lista vazia no pior caso). Atalhos novos entram no fim.

## Regras (puras, `web/src/lib/atalhos.ts`)

- `lerAtalhos(texto)` → `Atalho[]` (tolerante, como `lerFavoritas`).
- `plantasDoAtalho(atalho, plantas)` → plantas que passam nos dois filtros: com grupos escolhidos, `planta.grupo` precisa estar entre eles (sem grupo → fora); com espécies escolhidas, `planta.especieId` precisa estar entre elas (sem espécie → fora). Ordem: `identificador` crescente.
- `atividadesValidas(atalho, atividades)` → só os ids que ainda existem. Atalho sem nenhuma válida é **inválido**: o card aparece esmaecido com "Atividade removida" e o toque abre a edição (para consertar ou apagar). Espécie que ninguém mais tem continua no filtro (não pega planta — nunca vira "todas") e segue como chip marcado na edição, para poder desmarcar; o nome vem das plantas, depois do catálogo (`useEspecies`), senão "Espécie desconhecida".
- `rotuloAlvo(atalho, especies)` → "Todas" · "Pré-transplante + Recém transplantada" · "Azaleia" · "Pré-transplante · Azaleia + Pinheiro negro".
- Tarefas a concluir: `candidatasReconciliacao(agendas, cuidados, janelaDias)` ganha o parâmetro opcional `janelaDias` (padrão `JANELA_RECONCILIACAO_DIAS` = 90); o atalho usa `JANELA_ATALHO_DIAS = 7`.

## Telas

### Bancada — faixa "Acesso rápido"

Entre o cabeçalho e a lista (também no estado "Nada pendente"; escondida sem plantas e durante o carregamento). Rolagem horizontal com cards:

- ícone da 1ª atividade (`AtividadeIcone`), nomes das atividades (" + "), rótulo do alvo e "N plantas";
- último card "＋ Atalho" (sem atalhos: "＋ Criar atalho" com a dica "Registre um cuidado em várias plantas com 2 toques").

### Confirmação (`ConfirmarAtalho`, Sheet)

- Título: nomes das atividades; subtítulo: rótulo do alvo · "hoje".
- Grade de fotos (componente extraído de `PlantasLista`: `GradePlantas`), todas marcadas; toque desmarca.
- Interruptor "Também concluir N tarefas agendadas (atrasadas ou até 7 dias)", só quando N > 0; N recalcula com as marcadas.
- Rodapé: "Registrar em N plantas" (desabilitado com 0) e link "Editar atalho".
- Alvo vazio: "Nenhuma planta neste atalho agora." + botão desabilitado.
- Salvar: `POST /agendas/registrar` com `data` = agora, uma entrada por planta marcada (`atividadeIds` válidos do atalho), `concluirAgendaIds` (se ligado) e `moverRecemTransplantada` = preferência `mover_recem_transplantada` quando o atalho inclui Transplante. Mais de 200 plantas → aviso de erro da API (limite já existente); não tratado à parte.
- Sucesso: toast "Cuidado registrado 🌿 em N plantas · K tarefas concluídas", invalida `agendas`, `rotinas`, `plantas`, fecha. Erro: toast com a mensagem, sheet fica aberta, invalida `agendas`.

### Criar / editar (`EditarAtalho`, Sheet)

- `AtividadeChips` (favoritas primeiro), ≥ 1 obrigatório.
- "Grupos": chips múltiplos dos 5 `GRUPOS_PLANTA`.
- "Espécies": chips múltiplos das espécies presentes na coleção (ordem alfabética).
- Prévia: "Vale para N plantas agora".
- Rodapé: "Salvar" (desabilitado sem atividade) e, na edição, "Apagar atalho" (via `ConfirmSheet`).
- Salvar/apagar regrava a preferência inteira e invalida `preferencias`; erro → toast.

## Componentes

- `web/src/lib/atalhos.ts` (+ `atalhos.test.ts`)
- `web/src/lib/queries.ts`: `useAtalhos()` (lê da preferência) e `useSalvarAtalhos()`
- `web/src/components/care/PlantasPicker.tsx`: extrai `GradePlantas` (reaproveitada por `PlantasLista`)
- `web/src/components/bancada/AcessoRapido.tsx`, `ConfirmarAtalho.tsx`, `EditarAtalho.tsx`
- `web/src/pages/BancadaPage.tsx`: renderiza `AcessoRapido`
- `web/src/types.ts`: `atalhos_bancada?: string` em `Preferencias`

## Testes

- vitest em `atalhos.test.ts`: leitura tolerante, filtros (grupos, espécies, combinação, sem grupo/espécie), ordem, ids órfãos/atalho inválido, rótulos; `cuidados` com janela de 7 dias.
- `npm run lint` e `npm run build` no `web/`.
- Navegador (conta `testeclaude@bonsai.dev`, 390px): criar atalho, confirmar com desmarcação, ver tarefa concluída e histórico, editar, apagar.
