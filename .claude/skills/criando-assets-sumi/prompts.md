# Prompts (Gemini / Nano Banana / Veo)

Sempre em inglês (o modelo segue melhor detalhes técnicos), sempre com a **imagem-mestra anexada**:
`test-assets/estilo/imagem_mestra.jpeg`.
Para ajustar, converse no mesmo chat ("make the strokes drier", "fewer details") — ele edita mantendo o resto.

## 1. Bloco de estilo (ilustrações, texturas, pinceladas)
Abra o prompt com:
```
Using the attached image as the style reference (same sumi-e ink, same dry-brush texture, same washes and palette; ceramic pots are the only colored element),
```
e feche com:
```
Palette: warm black ink (#2B1F17), diluted grey ink washes, clay brown (#493628, #AB886D), muted celadon, vermilion (#B23A2A) only as a tiny accent. Flat, evenly lit, straight-on view. No shadows, no perspective, no 3D render look, no text, no letters, no calligraphy. Plain pure white background.
```

## 2. Bloco base de ícones (vai inteiro, no começo)
```
Icon set for a bonsai care app called Nagare, in a refined sumi-e brush-pen style. Each icon is drawn with a few confident tapered brush strokes in warm black ink (#2B1F17): smooth solid ink with slightly hand-made edges, NO dry-brush texture, NO grey wash. Identical stroke weight across all icons (about 1/12 of the icon height), rounded ends. Simple, bold, minimal shapes that stay readable at 24 pixels. Each icon centered in its own equal invisible square cell, arranged in a grid with very large gaps, on plain pure white background. No text, no labels, no circles or frames behind the icons, no shadows, no color.
```
Depois: `Match the line style of the attached icons exactly.` (anexe uma folha de ícones já aprovada do mesmo grupo) e a lista:
```
Icons, left to right, top to bottom:
1) <nome> (<significado>): <descrição concreta do desenho>;
2) ...
```
Ícone único: `One icon only, centered on the canvas: <descrição>. Square 1:1.`

Dicas que funcionaram: descrever **objeto concreto** ("bonsai scissors with large round butterfly handles"), dizer o que **não** pode ter quando há risco de leitura errada ("No bottle, no dropper"), preferir silhuetas inconfundíveis (ginkgo em vez de bordo de 7 pontas).

## 3. Modelos por tipo de peça
**Textura de papel**
```
Using the attached image only as a reference for the paper, create a flat top-down scan of a single sheet of warm off-white Japanese washi paper (#F4F0E8). Even, shadowless lighting, no vignette, no folds, no objects, no ink. Subtle long kozo fibers and very soft mottling, low contrast. Square 1:1, high resolution.
```
**Pinceladas / ensō** — `[estilo] paint six separate horizontal brush strokes ... stacked vertically with large gaps, nothing touching: 1) ... 6) ... [fecho] Landscape 3:2.`

**Partículas para animação** (folhas, pétalas, neve)
```
[estilo] paint 10 individual small <autumn leaves | cherry blossom petals>, each one separate and isolated, in different rotations and sizes, arranged in a loose grid with very large gaps, nothing touching. <cores>. No branches. [fecho] Square 1:1.
```
**Objetos de cerâmica** — `[estilo] paint <N> empty handmade bonsai pots, each seen straight from the front, in a grid with large gaps, same scale. Style: sumi-e ink outline with variable brush thickness and soft watercolor-like washes — NOT clean digital outlines, NOT flat fills. 1) ... [fecho]`

**Ilustração de tela** (vazia, erro, estação)
```
[estilo] paint a small calm illustration centered, with lots of empty space around it (wabi-sabi, ma). No frame. Landscape 4:3.
Scene: <cena>
```
**Animação em camadas** (ex.: galho quebrando) — no mesmo chat:
1. `[estilo] paint <cena completa> with <parte que vai se mover> clearly separate.`
2. `Now paint exactly the same, but WITHOUT <parte>: <o que fica no lugar>. Everything else identical.`
3. `Now paint ONLY <parte>, alone, same size and angle as in the first image.`

**Mesmo objeto em variações** (estações) — `paint the SAME <objeto> four times in a 2×2 grid, identical <o que não muda> in every panel ... top-left SPRING: ...`

## 4. Vídeo (Veo) — só tela cheia
```
A sumi-e ink painting of <assunto> slowly painting itself on warm off-white Japanese washi paper: strokes appear one by one, ink spreading softly into the paper fibers. Vertical 9:16. Static camera, top-down, flat even light. No brush, no hand, no tools visible, no text. Calm and slow. Ends on the finished painting.
```
