# Fluxos de cuidado em etapas + "Mais opções" — design

Data: 2026-10-07 · Item do `docs/todo.md`: telas de registro/agendamento mais limpas (etapas + opções avançadas).

## Objetivo

Registrar, Concluir e Agendar hoje são telas longas com todos os campos de uma vez. Passam a ser **etapas curtas**, cada uma com uma pergunta principal; etapas **condicionais** só aparecem quando fazem sentido; o que é raro ou "configura uma vez" fica em **Mais opções** (recolhido) na última etapa. O caminho comum fica rápido, sem perder a possibilidade de ser específico.

Fora do escopo: API (nenhuma mudança no servidor), cadastro de planta (já é em passos), janela fixa de 90 dias das tarefas a concluir.

## Peças compartilhadas

### `web/src/lib/fluxos.ts` (lógica pura, testada com Vitest)

- `etapaValida<T extends string>(lista: T[], pedida: string | null): T` — a pedida se estiver na lista, senão a primeira.
- `etapasRegistrar({ temPlantas, temFotos, plantaFixa, temCandidatas })` → lista de etapas:
  `inicio`, `triagem` (só com fotos e sem planta fixa), `feito`, `tarefas` (só com candidatas), `final`. Sem plantas tocadas → só `['inicio']` (recarregar no meio do fluxo volta ao início).
- `etapasConcluir()` → `['procedimento', 'final']`.
- `etapasAgendar({ plantaFixa })` → `plantas` (omitida com planta fixa), `cuidados`, `quando`.
- `resumoMaisOpcoes(itens: (string | false | null | undefined)[]): string` — junta os itens preenchidos com " · "; vazio → `''`.

### `useEtapas(lista)` (`web/src/components/fluxo/useEtapas.ts`)

- Etapa atual lida de `?etapa=` (preservando os outros parâmetros, ex.: `planta`, `ids`).
- `ir(etapa)` faz `navigate` com push (histórico): o voltar do navegador/Android volta uma etapa em vez de sair do fluxo.
- `avancar()` vai para a próxima da lista; `voltar()` = `navigate(-1)`.
- Etapa pedida fora da lista (link direto, recarga, etapa condicional que sumiu) → `replace` para `etapaValida`.
- Índice e total para a barra de progresso.

### `FluxoLayout` (`web/src/components/fluxo/FluxoLayout.tsx`)

`PageHeader` (título + voltar) + barra fina de progresso (`indice+1` de `total`) + conteúdo (`max-w-2xl`, `pb-32`) + barra fixa inferior com o botão principal (e slot para ações extras, ex.: "Reenviar fotos").

### `MaisOpcoes` (`web/src/components/fluxo/MaisOpcoes.tsx`)

Seção recolhível. Fechada mostra "Mais opções" + o resumo (`resumoMaisOpcoes`) do que está preenchido/ativo. Aberta/fechada lembrado no aparelho (`useEscolha('fluxo.maisOpcoes', 'fechado')`).

### `AjustarPlantas` (`web/src/components/fluxo/AjustarPlantas.tsx`)

Tela de **desvio** (etapa `ajustar` fora da sequência: entra-se por link, sai-se com voltar/"Pronto") com o acordeão por planta que hoje vive dentro de Registrar e Concluir. Recebe a lista de plantas (miniatura, título, subtítulo, marca "Com ajuste próprio") e um render do conteúdo de cada planta — cada página mantém seus próprios campos de ajuste.

### `QuandoCampo` (`web/src/components/fluxo/QuandoCampo.tsx`)

Data passada para registro/conclusão: chips **Hoje** / **Ontem** / **Outra data** (abre `input type=date`, `max` = hoje).

## Registrar (`/registrar`)

`inicio` → `triagem`* → **`feito`** → **`tarefas`*** → **`final`** (* condicional)

- **inicio**: como hoje (tirar foto / galeria / registrar sem foto).
- **triagem**: `TriagemFotos` como hoje; `onFim` → `feito`. A reentrada pelas miniaturas (ajuste da planta) também usa `triagem`.
- **feito**: `AtividadeChips` gerais ("Em todas as plantas" com 2+), com dica de "última vez". Com 2+ plantas: link "Fez algo diferente em alguma? **Ajustar plantas**" → desvio `ajustar` (tipos, nota e obs. por planta + miniaturas das fotos). Botão **Continuar** (exige tipos em todas as plantas).
- **tarefas** (só com candidatas, calculadas com os tipos já ajustados): lista com checkbox de hoje ("Desmarque se a tarefa ainda precisa ser feita"). Botão Continuar.
- **final**: resumo (N plantas · N fotos · cuidados) + `QuandoCampo` + `MaisOpcoes` com Nota, Obs. para o futuro, Mover p/ Recém transplantadas (só com Transplante) e Próximos passos. Botão **Registrar** (com "Enviando fotos… x/y" e "Reenviar N foto(s) e salvar" como hoje).
- Salvar: mesma chamada `POST /api/agendas/registrar`. Erro volta para `final`.

## Concluir (`/concluir?ids=`)

**`procedimento`** → **`final`**

- **procedimento**: plantas com checkbox, procedimento (trocar), "Feito junto". Com 2+ plantas marcadas: link Ajustar plantas → desvio `ajustar` (descrição, obs. e foto por planta). Botão Continuar (exige ao menos uma planta).
- **final**: `QuandoCampo` + Foto (opcional, visível) + `MaisOpcoes` com Descrição, Obs., Mover p/ Recém transplantadas (com Transplante) e Próximos passos. Botão **Concluir**.

## Agendar (nova página `/agendar?planta=&repetir=1`)

**`plantas`*** → **`cuidados`** → **`quando`**

- **plantas** (omitida com `planta=`): seleção de plantas inline (conteúdo do `PlantasPicker`, sem sheet). Continuar exige 1+.
- **cuidados**: `AtividadeChips` com dica de "última vez". Continuar exige 1+.
- **quando**: data futura com atalhos sazonais atuais + **Repetir** visível (`RepetirCampo`, sugestão de intervalo/estações, aviso de rotinas existentes); `repetir=1` abre com Repetir marcado. `MaisOpcoes` com Observação. Botão "Agendar" / "Agendar N cuidados" / "Criar rotina(s)".
- `CareContext.agendarCuidado(plantaId?, { repetir })` passa a navegar para `/agendar`. Ao salvar, volta para a tela anterior (link direto → Bancada).
- **Reagendar** continua sheet: `ScheduleCareSheet` vira `ReagendarSheet` (só data + atalhos).

## Preferência lembrada

- Nova chave na API genérica existente (`PUT /preferencias/:chave`): `mover_recem_transplantada` = `sim` | `nao` (padrão `sim`). Hook `useMoverRecemTransplantada()` em `queries.ts`.
- Valor inicial do checkbox em Registrar/Concluir vem dela; ao salvar com sucesso, se o valor usado (com Transplante presente) difere da preferência, ela é atualizada em segundo plano.
- Perfil: nova seção "Ao registrar cuidados" com o mesmo controle (sim/não).
- Aberto/fechado do Mais opções: só no aparelho.

## Testes

- Vitest: `lib/fluxos.test.ts` (etapas de cada fluxo, `etapaValida`, `resumoMaisOpcoes`).
- `npm run build` e `npm run lint` no `web/`.
- Navegador (conta `testeclaude@bonsai.dev`, 390px): Registrar com 1 e 3 plantas (com/sem ajuste, com tarefa candidata, com Transplante), voltar do navegador entre etapas, recarregar no meio; Concluir 1 e várias; Agendar pelo "+" e pela planta, com Repetir; Reagendar; preferência no Perfil.
