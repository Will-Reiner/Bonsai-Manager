# Identidade visual "Caderno de sumi" (Nagare) — design

Aprovado em 2026-10-12 (brainstorming com mockups no navegador; prévia geral aprovada). Evolui o Tema Argila (`2026-10-07-tema-argila-bancada-design.md`): mantém estrutura, tipografia e cores de grupo; troca a pele.

## 1. Direção

- **Wabi-sabi dominante + cerâmica**: papel washi, traço de pincel sumi, muito espaço vazio. A cor das ilustrações vem só da cerâmica (vasos) e das folhas de outono; vermelhão só no carimbo 流 e em destaques.
- **Nome Nagare** (流れ, "fluxo"): marca = carimbo hanko 流 + bonsai *fukinagashi* (varrido pelo vento).
- Peças desenhadas são geradas no Gemini (Nano Banana) e processadas pela skill de projeto `criando-assets-sumi` (`.claude/skills/criando-assets-sumi/`). O movimento é feito em código; vídeo só na abertura.
- Originais do Gemini ficam em `test-assets/estilo/` e `test-assets/movimento/` (fora do git). Só as peças processadas entram no repositório.

## 2. Sistema visual

### Tokens (`web/src/index.css`)
| Token | Valor | Uso |
|---|---|---|
| `bg` | `#F4F0E8` + textura `papel.jpg` (repetível, 384px) | fundo de todas as telas |
| `ink` | `#2B1F17` | texto, traços, mancha de tinta, botão principal |
| `muted` | `#7A6A5E` | texto secundário, ícone inativo |
| `hanko` (novo) | `#B23A2A` | carimbo 流, pincelada da aba ativa, selo de atraso |
| `vazio` (novo) | `#EBE4D9` | fundo do card sem foto (placeholder com vaso); `card` continua `#F8F6F5` |
| demais | mantidos do Tema Argila | `late`, cores de grupo, `danger`… |

O `body` ganha a textura do papel. Sheets e inputs continuam em `card`/`surface`.

### Pinceladas
PNGs de tinta usados como `mask-image` e tingidos por `background-color` (uma peça serve qualquer cor):
- **Divisórias** entre seções: pincelada fina (`pincel-fino-*`).
- **Linha superior da barra de baixo**: pincelada fina, 55% de opacidade.
- **Faixa de grupo** (`FaixaGrupo`): a faixa degradê vira uma pincelada grossa na cor do grupo, **do tamanho do texto** (`estiloFaixa` continua dando a cor), texto por cima; "Concluir todas" fica fora da pincelada, em `primary`.
- **Barra de progresso da estação**: pincelada fina de fundo claro + a mesma pincelada recortada (`clip-path`) em `accent`.

### Carimbo 流
Componente `Hanko`: quadrado `hanko` 34px, `rotate(-4deg)`, borda irregular por filtro SVG (`feTurbulence` + `feDisplacementMap`), caractere 流 com a fonte Noto Serif JP carregada só para esse caractere (`&text=流` no Google Fonts). Aparece no topo da Bancada e na abertura. Nunca gerado pela IA.

### Mancha de tinta
Estado selecionado de tudo **fora da barra de baixo** (chips de atividade, filtros, seleções): fundo `ink` com `border-radius` irregular + filtro SVG de borda, conteúdo em `bg`. Entra com `scale(.3→1)` em 0,28s. Os filtros SVG (`#aspero`, `#mancha`) ficam definidos uma vez no `Layout`.

## 3. Ícones

- 30 ícones próprios em SVG 24×24 com `fill="currentColor"`, traço igualado (skill, `--alvo 14`), de `test-assets/estilo/icons/svg/` para `web/public/icones/` (fora do bundle; URL `/icones/<nome>.svg`).
- Componente `Icone` (`components/Icone.tsx`): `<span>` com `mask-image` do SVG e `background: currentColor` (sem dependência nova). Nomes e URLs em `src/lib/icones.ts` (tipo `NomeIcone`, `urlIcone`, `iconeDaAtividade`).
- Utilitários continuam no Lucide (✓, X, setas, lixeira, lápis, busca, "…", carregando em botão).

| Grupo | Ícones | Onde |
|---|---|---|
| Navegação | bancada, colecao, perfil, mais (+ `-ativo` dos três primeiros) | `Layout` |
| Ações | registrar, agendar, rotina, adicionar-planta, fotos-lote, preferencias, acesso-rapido, historico, reagendar | sheet do "+", topo da Bancada, ações da planta (`PlantDetailPage`), tarefa (`PendentesDaPlanta`); `historico` fica reservado (sem lugar ainda) |
| Atividades | rega, adubacao, adubacao-liquida, poda, poda-estrutural, desfolha, aramacao, desaramacao, transplante, fitossanitario, revisao, generico, atrasada | `AtividadeIcone`, `AtividadeChips` |
| Estações | primavera, verao, outono (ginkgo), inverno | `EstacaoDoAno`, tela da estação |

`AtividadeIcone` mantém a busca por trecho do nome normalizado, com a ordem importando: `adubacao liquida`/`liquid` antes de `adub`; `poda estrutural` antes de `poda` (cobre "Poda de manutenção"); `fitossanit`; `revis`. O desconhecido usa `generico`. O círculo `primary-light` atrás do ícone sai: ícone solto em `ink`.

### Barra de baixo (F2)
- Inativa: desenho normal em `muted`, com o nome embaixo.
- Ativa: troca para o desenho `-ativo` em `ink` (opacidade cruzada de 0,2s). O nome some e uma **pincelada fina vermelhão** (40×6px) se pinta no lugar (`clip-path` 0,38s), deslocada 2px à direita para parecer centrada no ícone.
- A aba guarda o nome em `aria-label`. O botão "+" é um círculo `ink` com borda áspera e o ícone `mais` claro.

### Chips de atividade (`AtividadeChips`)
Viram uma grade de 4 colunas: ícone 22px dentro de um alvo de 46px + nome embaixo. Selecionado = mancha de tinta com o ícone claro. Mantêm `aria-pressed` e a "dica" (ex.: "há 12 dias") abaixo do nome.

## 4. Ilustrações e estados

Peças em WebP (qualidade 85, maior lado ≤ 800px; vasos ≤ 400px), em `web/public/arte/`, sempre com `alt=""` (decorativas).

| Peça | Uso |
|---|---|
| `bancada-vazia` (bonsai + chá na mesa) | Bancada sem pendências ("Nada pendente") |
| `colecao-vazia` (vaso celadon + tesoura) | Coleção sem plantas ("Um vaso esperando") |
| `planta-sem-tarefas` (broto no vaso) | `PendentesDaPlanta` / detalhe sem tarefas |
| `vaso-1…6` + `vaso-dragao` | placeholder de planta **sem foto** |
| `estacao-primavera…inverno` | tela da estação |
| `erro-inteira`, `erro-tronco`, `erro-galho` | erro de conexão (camadas alinhadas) |
| `marca` (fukinagashi) | abertura e ícone do app |
| `enso` | carregando, estação, celebração |

- **`EmptyState`** ganha a prop `ilustracao` (imagem grande, título em Newsreader itálico). O círculo com ícone continua para os casos sem ilustração.
- **`PlantThumb` sem foto**: fundo `vazio`, vaso apoiado embaixo (84% da largura). O vaso é escolhido de forma estável pela planta: `vasoDaPlanta(id)` faz um hash simples do id e escolhe um dos 7 vasos (`src/lib/arte.ts`). A mesma planta mostra sempre o mesmo vaso. Os cards ficam como quadrado arredondado simples, sem moldura.
- **`ErrorState`**: quando o erro é de rede (erro do axios sem `response`, detectado por `ehErroDeRede(error)` em `src/lib/api.ts`, ao lado de `errorMessage`), mostra a árvore com o galho quebrando. Os demais erros continuam em texto. A animação: árvore inteira por 0,9s → troca para tronco + galho → o galho gira em torno do toco (`transform-origin` 57,8% 72,1%) com estalo (6°), balanço e queda (translação + 62° + fade em 2,2s), e 5 pontinhos de tinta caem. "Tentar de novo" repete.
- **`Spinner`** (carregando de tela): o ensō se desenha (máscara `conic-gradient` animando `--a` com `@property`, 1,1s, em loop enquanto carrega). O `Loader2` continua só dentro de botões.
- **Celebração**: depois de Registrar/Concluir com sucesso, uma sobreposição breve (≈1,4s, toque fecha) com o ensō se desenhando, o ícone `registrar` e "Cuidado registrado" + resumo. Depois segue o fluxo atual (navegação de volta).

## 5. Movimento sazonal

- `ParticulasEstacao` (`components/ParticulasEstacao.tsx`): camada `fixed` atrás do conteúdo (`z-index` abaixo das telas, `pointer-events:none`) montada no `Layout`.
- Estação de `estacaoAtual()` (`src/lib/estacoes.ts`):
  - Primavera = pétalas (15 peças).
  - Outono = folhas (10 peças).
  - Inverno = neve: pontos de tinta clara feitos em código.
  - Verão = nada.
- Valores aprovados: **7 partículas na tela, tamanho 17px (±35%), velocidade 112px/s × fator 0,55 (±30%), vento 40%, opacidade 38%**. Cada partícula sorteia caminho, balanço, giro e "virada" (`scaleX`), então a cena não se repete.
- Laço único com `requestAnimationFrame`, só `transform` (sem layout). Pausa com `document.hidden`.
- Desligado quando:
  - o sistema pede menos movimento (`prefers-reduced-motion`);
  - o usuário desliga a preferência **"Animações sazonais"** em Perfil → Preferências. Ela é guardada **no aparelho** (`localStorage`, como o aberto/fechado de `MaisOpcoes`) e vem ligada por padrão.
- Regras puras (configuração por estação, sorteio, reposição ao sair da tela) em `src/lib/particulas.ts`, testadas com Vitest. O componente só desenha.

### Tela da estação
Tocar no cartão `EstacaoDoAno` abre um sheet: título da estação, período e dias para a próxima, ilustração grande da estação atual e uma tira com as 4 estações (a atual marcada com a pincelada vermelhão). O cartão ganha o ensō com o ícone da estação no lugar do ícone Lucide, e a pincelada como barra de progresso.

## 6. Abertura e marca

- **Abertura**: na primeira abertura do app em cada sessão (`sessionStorage`), uma tela cheia com o vídeo (`public/abertura.mp4`, `muted playsinline`, `object-fit: cover`). No fim (ou ao tocar) aparece "Nagare 流 · BONSAI" e a abertura some em fade.
  - Com movimento reduzido: só a marca, sem vídeo.
  - Se o vídeo não carregar em 1,5s: só a marca.
  - O vídeo atual (1280×720, horizontal, mostra o pincel) é **provisório**. O definitivo será 9:16, sem pincel, e entra trocando o arquivo, sem mudar código.
- **Nome**: `index.html` `<title>`, `manifest.webmanifest` (`name` "Nagare Bonsai", `short_name` "Nagare", `background_color`/`theme_color` `#F4F0E8`) e o ícone do app (`public/icon.svg` → fukinagashi + 流; PNGs 192/512 para o manifesto). Domínios, repositório e API não mudam.

## 7. Implementação em fases

Cada fase entra na `main` funcionando sozinha (push = deploy).

1. **Fundação**:
   - tokens, textura do papel, filtros SVG no `Layout`;
   - pinceladas (divisórias, linha da barra, `FaixaGrupo`);
   - `Hanko`;
   - assets copiados e otimizados (WebP).
2. **Ícones**:
   - `Icone`;
   - barra F2 e sheet do "+";
   - `AtividadeIcone` (novo mapeamento);
   - `AtividadeChips` com mancha de tinta;
   - filtros da Coleção com mancha;
   - ícones de estação.
3. **Ilustrações e estados**:
   - `EmptyState` com ilustração (Bancada, Coleção, planta sem tarefas);
   - `PlantThumb` com vaso;
   - `Spinner` ensō;
   - `ErrorState` com galho;
   - celebração.
4. **Movimento sazonal**:
   - `ParticulasEstacao` + preferência "Animações sazonais";
   - tela da estação.
5. **Abertura e marca**: abertura com vídeo e renomear para Nagare (título, manifesto, ícone).

## 8. Testes e verificação

- Vitest para a lógica pura:
  - `vasoDaPlanta` (estável, cobre os 7 vasos);
  - mapeamento nome → ícone de atividade (incluindo "Adubação líquida", "Poda de manutenção", "Tratamento fitossanitário", desconhecida → genérico);
  - `particulas.ts` (configuração por estação, verão vazio, reposição);
  - regra de "mostrar abertura" (uma vez por sessão, movimento reduzido).
- Verificação visual no navegador local (390px, conta de teste) a cada fase, comparando com `.superpowers/brainstorm/5764-1791838486/content/previa-geral.html`.
- `npm run build` e `npm run lint` no `web/` antes de cada commit.
- Desempenho:
  - partículas sem queda de quadros no celular (só `transform`, máx. 7);
  - peso total das imagens novas ≤ 1,5 MB, carregadas sob demanda (ilustrações só quando a tela aparece);
  - vídeo fora do bundle (`public/`).
