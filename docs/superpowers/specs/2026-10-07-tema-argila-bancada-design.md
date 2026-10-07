# Tema Argila + nova Bancada — design

Aprovado em 2026-10-07 (brainstorming com mockups). Substitui o visual da Bancada do commit `1e696e8`.

## 1. Sistema visual (app inteiro)

Tokens em `web/src/index.css`:

| Token | Cor | Uso |
|---|---|---|
| `bg` | `#EFECEC` | fundo das telas |
| `surface` / `card` | `#F8F6F5` | sheets, inputs, menus, cards (substitui branco puro) |
| `ink` | `#2B1F17` | texto principal |
| `muted` | `#7A6A5E` | texto secundário |
| `line` | `#DED3CB` | divisórias |
| `primary` | `#493628` | botões, ✓, "+", títulos |
| `primary-dark` | `#34261C` | títulos h1–h3 |
| `primary-light` | `#E9DDD5` | chips ativos, fundo de ícones |
| `accent` / `accent-light` | `#AB886D` / `#D6C0B3` | detalhes; faixa neutra (areia) |
| `late` / `late-light` | `#8B4A2B` / `#E8D6CB` | destaque de atraso |
| `danger` | vermelho atual | erros, apagar |

Cores de grupo (fixas, faixa com degradê esquerda→direita, cor cheia até ~35% e dissolvendo no fundo):

- Debilitada `#C0392B`, texto branco
- Recém transplantada `#E0911B`, texto escuro `#3B2606`
- Pré-transplante `#5B6BD6`, texto branco
- Em crescimento `#2F7D3A`, texto branco
- Refinamento `#A9D49B`, texto `#21451C`

Tipografia: **Newsreader** (títulos; título de tela em itálico) + **Figtree** (todo o resto), substituindo Fraunces + Inter. `GrupoBadge` da Coleção usa as cores de grupo.

## 2. Bancada

- Topo: saudação, *Bancada* (Newsreader itálico), resumo "Esta semana · N tarefas · **X atrasadas**"; botão de preferências à direita.
- Preferências (lembradas): Período (semana/mês/estação/todas), Agrupar (grupo/tarefa/espécie), Visualização (lista/fotos).
- Sem seções Atrasadas/Próximas. Níveis, todos de ponta a ponta (sem bordas laterais):
  1. Faixa do grupo com degradê de prioridade: "DEBILITADA · 2 · 1 atrasada".
  2. Tipo de tarefa: ícone em círculo + nome em negrito + contagem; "Concluir todas" se ≥ 2.
  3. Plantas: linhas finas recuadas (lista) ou faixa horizontal de fotos com cantos orgânicos e scroll-snap (fotos).
- Ordem: blocos com atrasadas primeiro (mantendo a ordem de prioridade entre si), depois os demais na ordem fixa; tarefas por data mais antiga; plantas atrasadas primeiro (data mais antiga primeiro).
- Atraso: lista = fundo `late-light` em degradê + traço à esquerda + "atrasada há X dias"; fotos = contorno `late` + data em `late`.
- Por tarefa: a tarefa é o nível de cima, em faixa neutra (areia). Por espécie: faixa neutra.
- Atrasadas sempre entram (independem do período); tocar abre a tarefa; ✓ vai a `/concluir?ids=`; estado vazio "Nada pendente…".

## 3. Implementação

- Lógica pura em `web/src/lib/bancada.ts` (blocos, ordenação, contagem de atrasadas, tom da faixa), testada com **Vitest** (novo no `web/`).
- Componentes: `FaixaGrupo`, `CabecalhoTarefa`, `LinhaTarefa`, `FotoTarefa`; `AtividadeIcone` reaproveitado; `BenchTaskCard` removido.
- Verificação visual no navegador local (390px), nas duas visualizações e nos três agrupamentos; revisão de contraste nas demais telas.
- Commits: tema/fontes → lógica + testes → Bancada → ajustes de contraste.
