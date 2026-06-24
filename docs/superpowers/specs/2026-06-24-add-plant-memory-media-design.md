# Spec: Melhorias na tela "Adicionar Planta" — galeria de memória, data de aquisição e visibilidade

Data: 2026-06-24
Status: aprovado (design)

## Contexto

`mobile_app/src/screens/App/AddPlantScreen.tsx` hoje permite: foto de capa, nome,
identificador, espécie, modo de aquisição e observações. O backend da **planta** já
aceita `dataAquisicao`, `modoAquisicao`, `observacoes`, `fotoCapaUrl`, `plantaPublica`
e `historicoPublico` (ver `server/src/modules/planta/`), mas a tela não envia
`dataAquisicao` nem `plantaPublica`, e só permite **uma** foto (a capa).

Mídia é armazenada na tabela `Foto` (efetivamente "mídia"): fotos e vídeos são linhas
distinguidas pela coluna `tipo` (`TipoMidia: FOTO | VIDEO | VISAO_FUTURA`). O binário
fica no Cloudflare R2; o banco guarda só URL (`caminhoArquivo`), `thumbnailUrl`, etc.
A tabela `Foto` **não tem** campo de "data em que a mídia foi capturada" — só `createdAt`
(data do upload).

## Objetivo

Na tela Adicionar Planta, permitir:
1. Foto de capa (já existe).
2. **Várias fotos/vídeos de outros períodos** ("galeria de memória"), cada um com
   **data de captura** detectada automaticamente e editável.
3. **Data de aquisição** da planta.
4. **Modo de aquisição** (já existe).
5. **Observações** (já existe).
6. **Planta pública** sim/não.

## Decisões (perguntas respondidas)

- **Visibilidade**: apenas um toggle `plantaPublica` (sem `historicoPublico`).
- **Data da mídia**: completo — detectar automaticamente (foto **e** vídeo), salvar no
  banco, e deixar editável por item.
- **TDD**: backend com TDD completo (jest já existe). Frontend: isolar a lógica
  testável (parse de data, montagem de DTOs) em **funções puras** testadas com um jest
  mínimo; componentes/visual verificados rodando no device.
- **Loading/upload**: a tela deve refletir claramente upload/carregamento em andamento e
  impedir submissão com upload pendente.
- **Escopo**: só a tela **Adicionar**. A tela **Editar** fica para depois.

## Mudanças no backend (TDD)

Único modelo afetado: `Foto` (mudança aditiva).

1. **Prisma** (`server/prisma/schema.prisma`): adicionar `dataCaptura DateTime?` ao
   model `Foto`. Migração `add_data_captura_foto`.
2. **`foto.schema.ts`**: `createFotoSchema.body` aceita
   `dataCaptura: z.string().datetime().optional().nullable()`.
   - TDD (red→green): teste de schema afirmando que `dataCaptura` é preservado no parse
     (hoje o zod descarta a chave desconhecida → red) e que valor inválido é rejeitado.
3. **`foto.types.ts`**: `CreateFotoDTO.dataCaptura?: string | null`.
4. **`create-foto.use-case.ts`**: nenhuma mudança de lógica (faz spread), mas estender
   `create-foto.use-case.test.ts` para afirmar que `dataCaptura` é repassado ao
   repositório (proteção contra regressão).
5. **`prisma-foto.repository.ts`** → `findManyByPlanta`: ordenar por
   `[{ dataCaptura: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }]`, para a
   galeria refletir os períodos reais.

> Observação: a **planta** não precisa de mudança no backend — `dataAquisicao` e
> `plantaPublica` já são suportados ponta a ponta.

## Mudanças no frontend

### Tipos e serviços
- `src/types/index.ts`: `Foto.dataCaptura?: string | null`.
- `src/services/fotoService.tsx`: `CreateFotoDTO.dataCaptura?: string | null`.

### Dependência nova
- Adicionar **`expo-media-library`** + plugin no `app.json` (permissões de leitura).
  **Exige novo `npx expo run:android`** (dependência nativa).

### Lógica pura testável (jest mínimo)
- `src/utils/mediaDate.ts`:
  - `parseExifDateTimeOriginal(value?: string): Date | null` — converte
    `"YYYY:MM:DD HH:MM:SS"` (EXIF) em `Date`. **Puro, testado.**
  - `resolveCaptureDate(input: { creationTimeMs?: number | null; exif?: Record<string, any> | null }): Date | null`
    — decide a data: prioriza `creationTimeMs` (MediaLibrary), depois EXIF, senão `null`.
    **Puro, testado.**
  - `extractCaptureDate(asset)` — wrapper fino que chama
    `MediaLibrary.getAssetInfoAsync(asset.assetId)` e delega a decisão para
    `resolveCaptureDate`. (Não unit-testado; só orquestra.)
- `src/screens/App/addPlant.helpers.ts`:
  - `buildCreatePlantaDTO(form)` — monta o `CreatePlantaDTO` (datas → ISO, strings
    vazias → undefined, `plantaPublica`). **Puro, testado.**
  - `buildMemoryFotoDTO(item, plantaId)` — monta o `CreateFotoDTO` de cada mídia
    (`tipo`, `caminhoArquivo`, `thumbnailUrl`, `dataCaptura` → ISO). **Puro, testado.**
- Setup mínimo: `jest` + `ts-jest` + `@types/jest`, `jest.config.js` (preset ts-jest,
  testMatch `*.test.ts`), script `"test": "jest"`. As funções puras ficam em arquivos
  **sem** imports de `react-native`/`expo` para o jest mínimo rodar.

### Upload reutilizável
- Extrair o pipeline (comprimir → presigned → R2 → thumbnail de vídeo) para uma função
  reutilizável, usada pela nova galeria (e, se baixo risco, pelo `useMediaUpload`).

### Componente `MemoryMediaPicker` (`src/components/MemoryMediaPicker.tsx`)
- Seleção múltipla (`allowsMultipleSelection`, `mediaTypes: ['images','videos']`,
  `exif: true`).
- Para cada item: detecta `dataCaptura`, sobe ao R2, mostra thumbnail com **progresso**,
  botão remover, ícone de play (vídeo) e **data editável** (DateTimePicker).
- Notifica a tela com os itens prontos (com `publicUrl`/`thumbnailUrl`/`dataCaptura`).
- Estados: "comprimindo/enviando" por item; itens com erro sinalizados e removíveis.

### `AddPlantScreen`
- Novos campos: **Data de Aquisição** (DateTimePicker nativo), **Planta Pública**
  (Switch + texto explicativo) e seção **Fotos e Vídeos da Memória**
  (`MemoryMediaPicker`).
- Submit (usa os helpers puros): `createPlanta(buildCreatePlantaDTO(...))` → `createFoto`
  da capa → `createFoto` de cada mídia (`buildMemoryFotoDTO`) → `goBack()`.
- **Loading/upload UX**: botão "Adicionar" desabilitado enquanto qualquer upload está em
  andamento ou durante o submit; indicador/overlay de carregamento; bloquear submit com
  upload pendente; feedback de erro por mídia sem travar a criação da planta.

## Estratégia de testes

- **Backend (TDD)**: schema de `Foto` (dataCaptura aceito/rejeitado), use case
  `create-foto` (forwarding de dataCaptura). Rodar `cd server && npm test -- foto`.
- **Frontend (lógica pura)**: `mediaDate` (parse EXIF, resolução de prioridade) e
  `addPlant.helpers` (montagem de DTOs). Rodar `cd mobile_app && npm test`.
- **Manual no device**: seleção múltipla, detecção de data (foto e vídeo), edição de
  data, progresso, planta pública, data de aquisição; verificar registros na galeria.

## Riscos / atenção

- **Rebuild nativo** necessário (nova dependência `expo-media-library`).
- **Migração** no Postgres (`add_data_captura_foto`).
- **Concorrência**: outra sessão mexe no painel admin. A única sobreposição possível é
  `schema.prisma`/migração — mudança mantida **aditiva** (um campo) para minimizar
  conflito.
- EXIF pode faltar (screenshots, imagens encaminhadas); MediaLibrary cobre itens da
  galeria do aparelho. Quando nada é detectado, o item assume "hoje", editável.
