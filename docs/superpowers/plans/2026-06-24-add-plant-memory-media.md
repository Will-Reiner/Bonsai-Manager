# Add Plant — Memory Media, Acquisition Date & Visibility — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Na tela "Adicionar Planta", permitir várias fotos/vídeos de outros períodos (com data de captura automática e editável), além de data de aquisição, modo de aquisição, observações e um toggle de planta pública.

**Architecture:** Backend ganha só um campo aditivo `Foto.dataCaptura` (a planta já suporta os demais campos ponta a ponta). Frontend isola a lógica testável (parse de data EXIF/MediaLibrary e montagem de DTOs) em funções puras testadas com jest, e adiciona um componente `MemoryMediaPicker` para multi-upload com progresso. A tela compõe tudo e bloqueia o submit enquanto há upload em andamento.

**Tech Stack:** Node/Express + Prisma + Zod + Jest (backend); React Native/Expo + TypeScript, expo-image-picker, expo-media-library, @react-native-community/datetimepicker, jest + ts-jest (frontend).

## Global Constraints

- Idioma do projeto (UI, comentários, copy): **Português**.
- **Sessão paralela ativa no mesmo repositório** (painel admin). **NÃO trocar de branch.** Em cada commit, usar `git add` **apenas** nos arquivos listados na task — **nunca** `git add -A`/`git add .`.
- Libs do Expo instalam com `npx expo install <lib>` (versão compatível com o SDK 54).
- Testes backend: `cd server && npm test -- <filtro>`. Testes frontend: `cd mobile_app && npm test`.
- Typecheck frontend: `cd mobile_app && npx tsc --noEmit`.
- Funções puras do frontend (testadas no jest) **não podem importar** `react-native`/`expo`/`../api`. Importar tipos com `import type` para não puxar runtime.
- Datas em DTOs trafegam como ISO 8601 (`Date.prototype.toISOString()`); o backend valida com `z.string().datetime()`.

---

### Task 1: Backend aceita e repassa `dataCaptura` na criação de mídia

**Files:**
- Test: `server/src/modules/foto/foto.schema.test.ts` (create)
- Modify: `server/src/modules/foto/foto.schema.ts`
- Modify: `server/src/modules/foto/foto.types.ts`
- Test: `server/src/modules/foto/use-cases/create-foto.use-case.test.ts` (modify)

**Interfaces:**
- Consumes: nada (primeira task).
- Produces: `createFotoSchema` passa a preservar `dataCaptura?: string | null`; `CreateFotoDTO` ganha `dataCaptura?: string | null`. O use case `CreateFotoUseCase.execute` repassa `dataCaptura` ao repositório (sem mudança de código — já faz spread).

- [ ] **Step 1: Write the failing schema test**

Create `server/src/modules/foto/foto.schema.test.ts`:

```ts
import { createFotoSchema } from './foto.schema';

describe('createFotoSchema — dataCaptura', () => {
  const base = { caminhoArquivo: 'https://r2.example/x.webp' };

  it('preserva dataCaptura válida (ISO 8601) no parse', () => {
    const dataCaptura = '2024-03-15T10:30:00.000Z';
    const result = createFotoSchema.parse({ body: { ...base, dataCaptura } });
    expect(result.body.dataCaptura).toBe(dataCaptura);
  });

  it('rejeita dataCaptura com formato inválido', () => {
    expect(() =>
      createFotoSchema.parse({ body: { ...base, dataCaptura: '15/03/2024' } }),
    ).toThrow();
  });

  it('aceita ausência de dataCaptura', () => {
    const result = createFotoSchema.parse({ body: { ...base } });
    expect(result.body.dataCaptura).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the schema test to verify it fails**

Run: `cd server && npm test -- foto.schema`
Expected: FAIL — o primeiro teste falha (`result.body.dataCaptura` é `undefined` porque o zod descarta a chave desconhecida).

- [ ] **Step 3: Add `dataCaptura` to the schema**

In `server/src/modules/foto/foto.schema.ts`, inside `createFotoSchema`'s `body` object, add the field right after `thumbnailUrl`:

```ts
export const createFotoSchema = z.object({
  body: z.object({
    caminhoArquivo: z.string().min(1, { message: 'O caminho do arquivo é obrigatório.' }),
    // plantaId agora é opcional, mas se vier, deve ser um UUID
    plantaId: z.string().uuid({ message: 'ID da planta inválido.' }).optional().nullable(),
    titulo: z.string().optional(),
    tags: z.string().optional(),
    tipo: z.enum(['FOTO', 'VIDEO', 'VISAO_FUTURA']).optional(),
    descricao: z.string().optional(),
    thumbnailUrl: z.string().optional(),
    dataCaptura: z.string().datetime().optional().nullable(),
  }),
});
```

- [ ] **Step 4: Add `dataCaptura` to the DTO type**

In `server/src/modules/foto/foto.types.ts`, add the field to `CreateFotoDTO`:

```ts
export interface CreateFotoDTO {
  caminhoArquivo: string;
  plantaId?: string | null;
  titulo?: string;
  tags?: string;
  usuarioId: string;
  tipo?: 'FOTO' | 'VIDEO' | 'VISAO_FUTURA';
  descricao?: string;
  thumbnailUrl?: string;
  dataCaptura?: string | null;
}
```

- [ ] **Step 5: Add the use-case forwarding guard test**

In `server/src/modules/foto/use-cases/create-foto.use-case.test.ts`, add this test inside the `describe('CreateFotoUseCase', ...)` block (after the last `it`):

```ts
  it('repassa dataCaptura ao repositório', async () => {
    const createData = {
      caminhoArquivo: '/uploads/foto1.jpg',
      tipo: 'FOTO' as const,
      dataCaptura: '2023-05-01T00:00:00.000Z',
    };
    const usuarioId = 'user-1';
    const expectedFoto = { id: 'foto-1', ...createData, usuarioId };
    mockFotoRepository.create.mockResolvedValue(expectedFoto);

    await createFotoUseCase.execute(createData, usuarioId);

    expect(mockFotoRepository.create).toHaveBeenCalledWith({
      ...createData,
      usuarioId,
    });
  });
```

- [ ] **Step 6: Run the foto tests to verify they pass**

Run: `cd server && npm test -- foto`
Expected: PASS — `foto.schema.test.ts` (3 testes) e `create-foto.use-case.test.ts` (4 testes) verdes.

- [ ] **Step 7: Commit**

```bash
git add server/src/modules/foto/foto.schema.ts server/src/modules/foto/foto.schema.test.ts server/src/modules/foto/foto.types.ts server/src/modules/foto/use-cases/create-foto.use-case.test.ts
git commit -m "feat(foto): aceita e repassa dataCaptura na criação de mídia"
```

---

### Task 2: Persistir `dataCaptura` no Prisma e ordenar a galeria por período

**Files:**
- Modify: `server/prisma/schema.prisma` (model `Foto`)
- Create: `server/prisma/migrations/<timestamp>_add_data_captura_foto/migration.sql` (gerado pelo Prisma)
- Modify: `server/src/modules/foto/repositories/prisma-foto.repository.ts:11-16` (`findManyByPlanta`)

**Interfaces:**
- Consumes: `CreateFotoDTO.dataCaptura` (Task 1).
- Produces: coluna `dataCaptura` persistida; `findManyByPlanta` retorna ordenado por `dataCaptura` desc (nulls last), depois `createdAt` desc.

- [ ] **Step 1: Add the column to the Prisma model**

In `server/prisma/schema.prisma`, in `model Foto`, add `dataCaptura` right after `createdAt`:

```prisma
model Foto {
  id             String     @id @default(uuid())
  caminhoArquivo String
  titulo         String?
  tags           String?
  createdAt      DateTime   @default(now())
  dataCaptura    DateTime?  // data em que a mídia foi capturada (foto/vídeo)

  plantaId       String?
  planta         Planta?    @relation(fields: [plantaId], references: [id], onDelete: Cascade)
```

(Deixe o restante do model inalterado.)

- [ ] **Step 2: Ensure the dev database is running**

Run: `docker compose up -d db`
Expected: container do Postgres `Up` (porta 5432). Se já estiver de pé, o comando é idempotente.

- [ ] **Step 3: Create and apply the migration**

Run: `cd server && npm run prisma:migrate:dev -- --name add_data_captura_foto`
Expected: Prisma cria `migrations/<timestamp>_add_data_captura_foto/` com `ALTER TABLE "Foto" ADD COLUMN "dataCaptura" TIMESTAMP(3);` e aplica sem erro; em seguida regenera o client. (Se o script não repassar `--name`, rodar `cd server && npx prisma migrate dev --name add_data_captura_foto`.)

- [ ] **Step 4: Order the gallery by capture date**

In `server/src/modules/foto/repositories/prisma-foto.repository.ts`, change `findManyByPlanta`:

```ts
  async findManyByPlanta(plantaId: string) {
    return await prisma.foto.findMany({
      where: { plantaId },
      orderBy: [
        { dataCaptura: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' },
      ],
    });
  }
```

- [ ] **Step 5: Verify schema validity and tests still pass**

Run: `cd server && npx prisma validate && npm test -- foto`
Expected: `The schema at prisma/schema.prisma is valid` e todos os testes de `foto` verdes.

- [ ] **Step 6: Commit**

```bash
git add server/prisma/schema.prisma server/prisma/migrations server/src/modules/foto/repositories/prisma-foto.repository.ts
git commit -m "feat(foto): persiste dataCaptura e ordena galeria por período"
```

---

### Task 3: Setup de jest mínimo + funções puras de data (`mediaDate.ts`)

**Files:**
- Modify: `mobile_app/package.json` (devDeps + script `test`)
- Create: `mobile_app/jest.config.js`
- Create: `mobile_app/src/utils/mediaDate.ts`
- Test: `mobile_app/src/utils/mediaDate.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `parseExifDateTimeOriginal(value?: string | null): Date | null` e `resolveCaptureDate(input: { creationTimeMs?: number | null; exif?: Record<string, any> | null }): Date | null`. **Arquivo sem imports nativos.**

- [ ] **Step 1: Install jest toolchain**

Run: `cd mobile_app && npm install -D jest@^29 ts-jest@^29 @types/jest@^29`
Expected: instala sem erro; `package.json` ganha as três devDeps.

- [ ] **Step 2: Add the `test` script**

In `mobile_app/package.json`, add to `"scripts"`:

```json
    "test": "jest"
```

- [ ] **Step 3: Create the jest config**

Create `mobile_app/jest.config.js`:

```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/**/*.test.ts'],
};
```

- [ ] **Step 4: Write the failing pure-function tests**

Create `mobile_app/src/utils/mediaDate.test.ts`:

```ts
import { parseExifDateTimeOriginal, resolveCaptureDate } from './mediaDate';

describe('parseExifDateTimeOriginal', () => {
  it('converte formato EXIF válido em Date', () => {
    const d = parseExifDateTimeOriginal('2024:03:15 10:30:00');
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2024);
    expect(d!.getMonth()).toBe(2); // março = índice 2
    expect(d!.getDate()).toBe(15);
    expect(d!.getHours()).toBe(10);
  });

  it('retorna null para ausência ou vazio', () => {
    expect(parseExifDateTimeOriginal(undefined)).toBeNull();
    expect(parseExifDateTimeOriginal('')).toBeNull();
  });

  it('retorna null para formato inválido', () => {
    expect(parseExifDateTimeOriginal('15/03/2024')).toBeNull();
  });
});

describe('resolveCaptureDate', () => {
  it('prioriza creationTimeMs do MediaLibrary sobre EXIF', () => {
    const ms = Date.UTC(2023, 0, 2, 12, 0, 0);
    const d = resolveCaptureDate({
      creationTimeMs: ms,
      exif: { DateTimeOriginal: '2024:03:15 10:30:00' },
    });
    expect(d!.getTime()).toBe(ms);
  });

  it('usa EXIF quando não há creationTime', () => {
    const d = resolveCaptureDate({
      creationTimeMs: null,
      exif: { DateTimeOriginal: '2024:03:15 10:30:00' },
    });
    expect(d!.getFullYear()).toBe(2024);
  });

  it('retorna null quando nada é confiável', () => {
    expect(resolveCaptureDate({ creationTimeMs: 0, exif: null })).toBeNull();
  });
});
```

- [ ] **Step 5: Run the tests to verify they fail**

Run: `cd mobile_app && npm test -- mediaDate`
Expected: FAIL — módulo `./mediaDate` não existe.

- [ ] **Step 6: Implement the pure functions**

Create `mobile_app/src/utils/mediaDate.ts`:

```ts
// Funções puras de resolução de data de captura.
// IMPORTANTE: não importar react-native/expo aqui (rodam no jest mínimo).

/**
 * Converte o EXIF DateTimeOriginal ("YYYY:MM:DD HH:MM:SS") em Date local.
 * Retorna null se ausente ou em formato inesperado.
 */
export function parseExifDateTimeOriginal(value?: string | null): Date | null {
  if (!value) return null;
  const match = value.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match;
  const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
  return isNaN(date.getTime()) ? null : date;
}

export interface ResolveCaptureDateInput {
  creationTimeMs?: number | null;
  exif?: Record<string, any> | null;
}

/**
 * Decide a data de captura: prioriza o creationTime do MediaLibrary (foto e vídeo),
 * com fallback para o EXIF DateTimeOriginal. Retorna null se nada for confiável.
 */
export function resolveCaptureDate(input: ResolveCaptureDateInput): Date | null {
  const { creationTimeMs, exif } = input;
  if (typeof creationTimeMs === 'number' && creationTimeMs > 0) {
    const d = new Date(creationTimeMs);
    if (!isNaN(d.getTime())) return d;
  }
  const exifValue: string | null =
    exif?.DateTimeOriginal ?? exif?.['{Exif}']?.DateTimeOriginal ?? null;
  return parseExifDateTimeOriginal(exifValue);
}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `cd mobile_app && npm test -- mediaDate`
Expected: PASS — 6 testes verdes.

- [ ] **Step 8: Commit**

```bash
git add mobile_app/package.json mobile_app/package-lock.json mobile_app/jest.config.js mobile_app/src/utils/mediaDate.ts mobile_app/src/utils/mediaDate.test.ts
git commit -m "test(mobile): jest mínimo + funções puras de data de captura"
```

---

### Task 4: Tipos/serviço + helpers de montagem de DTO (`addPlant.helpers.ts`)

**Files:**
- Modify: `mobile_app/src/types/index.ts` (interface `Foto`)
- Modify: `mobile_app/src/services/fotoService.tsx` (`CreateFotoDTO`)
- Create: `mobile_app/src/screens/App/addPlant.helpers.ts`
- Test: `mobile_app/src/screens/App/addPlant.helpers.test.ts`

**Interfaces:**
- Consumes: `CreatePlantaDTO` (de `plantaService`), `CreateFotoDTO` (de `fotoService`, agora com `dataCaptura`), `ModoAquisicao` (de `types`).
- Produces:
  - `AddPlantFormState` (campos do formulário).
  - `ReadyMedia { tipo: 'FOTO' | 'VIDEO'; publicUrl: string; thumbnailUrl?: string; dataCaptura?: Date | null }`.
  - `buildCreatePlantaDTO(form: AddPlantFormState): CreatePlantaDTO`.
  - `buildMemoryFotoDTO(item: ReadyMedia, plantaId: string): CreateFotoDTO`.

- [ ] **Step 1: Add `dataCaptura` to the frontend `Foto` type**

In `mobile_app/src/types/index.ts`, in `interface Foto`, add after `thumbnailUrl`:

```ts
export interface Foto {
  id: string;
  caminhoArquivo: string;
  titulo?: string | null;
  tags?: string | null;
  createdAt: string;
  plantaId?: string | null;
  usuarioId: string;
  tipo: TipoMidia;
  descricao?: string | null;
  thumbnailUrl?: string | null;
  dataCaptura?: string | null;
}
```

- [ ] **Step 2: Add `dataCaptura` to the service `CreateFotoDTO`**

In `mobile_app/src/services/fotoService.tsx`, add to `CreateFotoDTO`:

```ts
export interface CreateFotoDTO {
  caminhoArquivo: string;
  plantaId?: string | null;
  titulo?: string;
  tags?: string;
  tipo?: 'FOTO' | 'VIDEO' | 'VISAO_FUTURA';
  descricao?: string;
  thumbnailUrl?: string;
  dataCaptura?: string | null;
}
```

- [ ] **Step 3: Write the failing helper tests**

Create `mobile_app/src/screens/App/addPlant.helpers.test.ts`:

```ts
import { buildCreatePlantaDTO, buildMemoryFotoDTO } from './addPlant.helpers';

describe('buildCreatePlantaDTO', () => {
  it('converte dataAquisicao em ISO e normaliza strings vazias', () => {
    const dto = buildCreatePlantaDTO({
      especieId: 'esp-1',
      nome: '   ',
      identificador: 'A-1',
      dataAquisicao: new Date('2024-01-10T00:00:00.000Z'),
      modoAquisicao: 'COMPRA',
      observacoes: '',
      fotoCapaUrl: 'https://r2.example/capa.webp',
      plantaPublica: true,
    });
    expect(dto.especieId).toBe('esp-1');
    expect(dto.nome).toBeUndefined();
    expect(dto.identificador).toBe('A-1');
    expect(dto.dataAquisicao).toBe('2024-01-10T00:00:00.000Z');
    expect(dto.modoAquisicao).toBe('COMPRA');
    expect(dto.observacoes).toBeUndefined();
    expect(dto.fotoCapaUrl).toBe('https://r2.example/capa.webp');
    expect(dto.plantaPublica).toBe(true);
  });

  it('omite dataAquisicao quando ausente e respeita plantaPublica=false', () => {
    const dto = buildCreatePlantaDTO({ especieId: 'esp-1', dataAquisicao: null, plantaPublica: false });
    expect(dto.dataAquisicao).toBeUndefined();
    expect(dto.plantaPublica).toBe(false);
  });
});

describe('buildMemoryFotoDTO', () => {
  it('monta DTO de foto com dataCaptura em ISO', () => {
    const dto = buildMemoryFotoDTO(
      { tipo: 'FOTO', publicUrl: 'https://r2.example/a.webp', dataCaptura: new Date('2023-05-01T00:00:00.000Z') },
      'planta-1',
    );
    expect(dto).toEqual({
      caminhoArquivo: 'https://r2.example/a.webp',
      plantaId: 'planta-1',
      tipo: 'FOTO',
      thumbnailUrl: undefined,
      dataCaptura: '2023-05-01T00:00:00.000Z',
    });
  });

  it('inclui thumbnailUrl de vídeo e omite dataCaptura nula', () => {
    const dto = buildMemoryFotoDTO(
      { tipo: 'VIDEO', publicUrl: 'https://r2.example/v.mp4', thumbnailUrl: 'https://r2.example/t.webp', dataCaptura: null },
      'planta-1',
    );
    expect(dto.tipo).toBe('VIDEO');
    expect(dto.thumbnailUrl).toBe('https://r2.example/t.webp');
    expect(dto.dataCaptura).toBeUndefined();
  });
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `cd mobile_app && npm test -- addPlant.helpers`
Expected: FAIL — módulo `./addPlant.helpers` não existe.

- [ ] **Step 5: Implement the helpers**

Create `mobile_app/src/screens/App/addPlant.helpers.ts`:

```ts
// Funções puras de montagem de DTO para a tela Adicionar Planta.
// Importa apenas TIPOS (import type) para não puxar runtime (axios/AsyncStorage) no jest.
import type { CreatePlantaDTO } from '../../services/plantaService';
import type { CreateFotoDTO } from '../../services/fotoService';
import type { ModoAquisicao } from '../../types';

export interface AddPlantFormState {
  especieId: string;
  nome?: string;
  identificador?: string;
  dataAquisicao?: Date | null;
  modoAquisicao?: ModoAquisicao | null;
  observacoes?: string;
  fotoCapaUrl?: string | null;
  plantaPublica: boolean;
}

export interface ReadyMedia {
  tipo: 'FOTO' | 'VIDEO';
  publicUrl: string;
  thumbnailUrl?: string;
  dataCaptura?: Date | null;
}

export function buildCreatePlantaDTO(form: AddPlantFormState): CreatePlantaDTO {
  return {
    especieId: form.especieId,
    nome: form.nome?.trim() || undefined,
    identificador: form.identificador?.trim() || undefined,
    dataAquisicao: form.dataAquisicao ? form.dataAquisicao.toISOString() : undefined,
    modoAquisicao: form.modoAquisicao || undefined,
    observacoes: form.observacoes?.trim() || undefined,
    fotoCapaUrl: form.fotoCapaUrl || undefined,
    plantaPublica: form.plantaPublica,
  };
}

export function buildMemoryFotoDTO(item: ReadyMedia, plantaId: string): CreateFotoDTO {
  return {
    caminhoArquivo: item.publicUrl,
    plantaId,
    tipo: item.tipo,
    thumbnailUrl: item.thumbnailUrl,
    dataCaptura: item.dataCaptura ? item.dataCaptura.toISOString() : undefined,
  };
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `cd mobile_app && npm test -- addPlant.helpers`
Expected: PASS — 4 testes verdes.

- [ ] **Step 7: Commit**

```bash
git add mobile_app/src/types/index.ts mobile_app/src/services/fotoService.tsx mobile_app/src/screens/App/addPlant.helpers.ts mobile_app/src/screens/App/addPlant.helpers.test.ts
git commit -m "feat(mobile): dataCaptura nos tipos + helpers de DTO da tela Adicionar Planta"
```

---

### Task 5: Dependência nativa + extração de data + pipeline de upload reutilizável

**Files:**
- Modify: `mobile_app/package.json` (dependência `expo-media-library` — via `expo install`)
- Modify: `mobile_app/app.json` (plugin)
- Create: `mobile_app/src/utils/mediaCapture.ts`
- Create: `mobile_app/src/utils/uploadMedia.ts`

**Interfaces:**
- Consumes: `resolveCaptureDate` (Task 3); `compressImage`/`compressVideo`/`generateVideoThumbnail` (`utils/mediaCompressor`); `getPresignedUrl`/`uploadToR2` (`services/mediaService`).
- Produces:
  - `extractCaptureDate(asset: ImagePicker.ImagePickerAsset): Promise<Date | null>`.
  - `processAndUploadMedia(fileUri: string, mimeType: string, onProgress: (percent: number) => void): Promise<{ publicUrl: string; thumbnailUrl?: string; tipo: 'FOTO' | 'VIDEO' }>`.

- [ ] **Step 1: Install expo-media-library**

Run: `cd mobile_app && npx expo install expo-media-library`
Expected: instala versão compatível com o SDK 54 e adiciona em `dependencies`.

- [ ] **Step 2: Register the plugin in app.json**

In `mobile_app/app.json`, replace the `"plugins"` array with:

```json
    "plugins": [
      "expo-asset",
      "expo-font",
      "react-native-compressor",
      "expo-video",
      [
        "expo-media-library",
        {
          "photosPermission": "Permitir que o Bonsai Manager acesse suas fotos e vídeos para adicionar à memória da planta.",
          "savePhotosPermission": "Permitir que o Bonsai Manager salve fotos.",
          "isAccessMediaLocationEnabled": false
        }
      ]
    ],
```

- [ ] **Step 3: Create the capture-date wrapper**

Create `mobile_app/src/utils/mediaCapture.ts`:

```ts
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { resolveCaptureDate } from './mediaDate';

/**
 * Tenta descobrir a data real de captura de uma mídia escolhida no picker.
 * Prioriza o creationTime do MediaLibrary (foto e vídeo); cai para o EXIF; senão null.
 */
export async function extractCaptureDate(asset: ImagePicker.ImagePickerAsset): Promise<Date | null> {
  let creationTimeMs: number | null = null;
  try {
    if (asset.assetId) {
      const perm = await MediaLibrary.getPermissionsAsync();
      const granted = perm.granted || (await MediaLibrary.requestPermissionsAsync()).granted;
      if (granted) {
        const info = await MediaLibrary.getAssetInfoAsync(asset.assetId);
        creationTimeMs = info?.creationTime ?? null;
      }
    }
  } catch {
    creationTimeMs = null;
  }
  return resolveCaptureDate({ creationTimeMs, exif: (asset as any).exif ?? null });
}
```

- [ ] **Step 4: Create the reusable upload pipeline**

Create `mobile_app/src/utils/uploadMedia.ts`:

```ts
import { compressImage, compressVideo, generateVideoThumbnail } from './mediaCompressor';
import { getPresignedUrl, uploadToR2 } from '../services/mediaService';

export interface ProcessedMedia {
  publicUrl: string;
  thumbnailUrl?: string;
  tipo: 'FOTO' | 'VIDEO';
}

/**
 * Comprime e envia uma mídia ao R2. `onProgress` recebe 0–100.
 * Espelha a lógica de useMediaUpload, mas como função pura de orquestração
 * para uso em uploads múltiplos (galeria de memória).
 */
export async function processAndUploadMedia(
  fileUri: string,
  mimeType: string,
  onProgress: (percent: number) => void,
): Promise<ProcessedMedia> {
  if (mimeType.startsWith('image/')) {
    onProgress(0);
    const compressed = await compressImage(fileUri);
    onProgress(30);
    const { uploadUrl, publicUrl } = await getPresignedUrl(compressed.fileName, 'image/webp');
    await uploadToR2(uploadUrl, compressed.uri, 'image/webp', (p) => onProgress(30 + p * 0.7));
    onProgress(100);
    return { publicUrl, tipo: 'FOTO' };
  }

  // Vídeo
  onProgress(0);
  const thumbUri = await generateVideoThumbnail(fileUri);
  const thumbFileName = `thumb_${Date.now()}.webp`;
  const thumbPresigned = await getPresignedUrl(thumbFileName, 'image/webp');
  await uploadToR2(thumbPresigned.uploadUrl, thumbUri, 'image/webp', (p) => onProgress(p * 0.05));

  const compressed = await compressVideo(fileUri, (p) => onProgress(5 + p * 0.6));
  const { uploadUrl, publicUrl } = await getPresignedUrl(compressed.fileName, 'video/mp4');
  await uploadToR2(uploadUrl, compressed.uri, 'video/mp4', (p) => onProgress(65 + p * 0.35));
  onProgress(100);

  return { publicUrl, thumbnailUrl: thumbPresigned.publicUrl, tipo: 'VIDEO' };
}
```

- [ ] **Step 5: Typecheck**

Run: `cd mobile_app && npx tsc --noEmit`
Expected: sem erros. (As funções puras de jest não importam estes arquivos nativos, então `npm test` continua verde.)

- [ ] **Step 6: Commit**

```bash
git add mobile_app/package.json mobile_app/package-lock.json mobile_app/app.json mobile_app/src/utils/mediaCapture.ts mobile_app/src/utils/uploadMedia.ts
git commit -m "feat(mobile): expo-media-library + extração de data e pipeline de upload reutilizável"
```

---

### Task 6: Componente `MemoryMediaPicker` (multi-mídia com progresso e data por item)

**Files:**
- Create: `mobile_app/src/components/MemoryMediaPicker.tsx`

**Interfaces:**
- Consumes: `processAndUploadMedia` (Task 5), `extractCaptureDate` (Task 5), `ReadyMedia` (Task 4), `theme`.
- Produces: componente `MemoryMediaPicker` com props
  `{ onReadyItemsChange: (items: ReadyMedia[]) => void; onUploadingChange: (uploading: boolean) => void }`.

- [ ] **Step 1: Implement the component**

Create `mobile_app/src/components/MemoryMediaPicker.tsx`:

```tsx
import React, { useCallback, useRef, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { processAndUploadMedia } from '../utils/uploadMedia';
import { extractCaptureDate } from '../utils/mediaCapture';
import type { ReadyMedia } from '../screens/App/addPlant.helpers';

interface PendingMedia {
  localId: string;
  previewUri: string;
  tipo: 'FOTO' | 'VIDEO';
  status: 'uploading' | 'done' | 'error';
  progress: number;
  publicUrl?: string;
  thumbnailUrl?: string;
  dataCaptura: Date | null;
}

interface MemoryMediaPickerProps {
  onReadyItemsChange: (items: ReadyMedia[]) => void;
  onUploadingChange: (uploading: boolean) => void;
}

let idCounter = 0;
const nextId = () => `m-${Date.now()}-${idCounter++}`;
const formatDate = (d: Date | null) => (d ? d.toLocaleDateString('pt-BR') : 'Sem data');

export function MemoryMediaPicker({ onReadyItemsChange, onUploadingChange }: MemoryMediaPickerProps) {
  const [items, setItems] = useState<PendingMedia[]>([]);
  const [datePickerFor, setDatePickerFor] = useState<string | null>(null);
  const itemsRef = useRef<PendingMedia[]>([]);

  const sync = useCallback(
    (next: PendingMedia[]) => {
      itemsRef.current = next;
      setItems(next);
      onReadyItemsChange(
        next
          .filter((i) => i.status === 'done' && i.publicUrl)
          .map((i) => ({
            tipo: i.tipo,
            publicUrl: i.publicUrl!,
            thumbnailUrl: i.thumbnailUrl,
            dataCaptura: i.dataCaptura,
          })),
      );
      onUploadingChange(next.some((i) => i.status === 'uploading'));
    },
    [onReadyItemsChange, onUploadingChange],
  );

  const patch = useCallback(
    (localId: string, p: Partial<PendingMedia>) => {
      sync(itemsRef.current.map((i) => (i.localId === localId ? { ...i, ...p } : i)));
    },
    [sync],
  );

  const handleAdd = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para adicionar mídias.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      exif: true,
      quality: 1,
    });
    if (result.canceled) return;

    const newOnes: PendingMedia[] = result.assets.map((a) => ({
      localId: nextId(),
      previewUri: a.uri,
      tipo: a.type === 'video' || a.mimeType?.startsWith('video/') ? 'VIDEO' : 'FOTO',
      status: 'uploading',
      progress: 0,
      dataCaptura: null,
    }));
    sync([...itemsRef.current, ...newOnes]);

    for (let idx = 0; idx < result.assets.length; idx++) {
      const asset = result.assets[idx];
      const { localId, tipo } = newOnes[idx];
      const mimeType = asset.mimeType ?? (tipo === 'VIDEO' ? 'video/mp4' : 'image/jpeg');
      try {
        const date = await extractCaptureDate(asset);
        patch(localId, { dataCaptura: date });
        const processed = await processAndUploadMedia(asset.uri, mimeType, (pc) =>
          patch(localId, { progress: Math.round(pc) }),
        );
        if (!itemsRef.current.some((i) => i.localId === localId)) continue; // removido durante upload
        patch(localId, {
          status: 'done',
          publicUrl: processed.publicUrl,
          thumbnailUrl: processed.thumbnailUrl,
          progress: 100,
        });
      } catch {
        if (!itemsRef.current.some((i) => i.localId === localId)) continue;
        patch(localId, { status: 'error' });
      }
    }
  };

  const handleRemove = (localId: string) => {
    sync(itemsRef.current.filter((i) => i.localId !== localId));
  };

  const onDateChange = (localId: string, _event: unknown, selected?: Date) => {
    setDatePickerFor(null);
    if (selected) patch(localId, { dataCaptura: selected });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Fotos e Vídeos da Memória</Text>
      <Text style={styles.subtitle}>
        Registre outros períodos da planta. A data é detectada automaticamente e pode ser ajustada.
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.map((item) => (
          <View key={item.localId} style={styles.tile}>
            <Image source={{ uri: item.thumbnailUrl ?? item.previewUri }} style={styles.thumb} />

            {item.tipo === 'VIDEO' && (
              <View style={styles.playBadge}>
                <Ionicons name="play" size={12} color="#fff" />
              </View>
            )}

            {item.status === 'uploading' && (
              <View style={styles.overlay}>
                <Text style={styles.overlayText}>{item.progress}%</Text>
              </View>
            )}

            {item.status === 'error' && (
              <View style={[styles.overlay, styles.errorOverlay]}>
                <Ionicons name="alert-circle" size={20} color="#fff" />
                <Text style={styles.overlayText}>Erro</Text>
              </View>
            )}

            <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item.localId)}>
              <Ionicons name="close-circle" size={22} color={theme.colors.danger} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateChip}
              onPress={() => setDatePickerFor(item.localId)}
              disabled={item.status === 'uploading'}
            >
              <Ionicons name="calendar-outline" size={11} color="#fff" />
              <Text style={styles.dateChipText} numberOfLines={1}>
                {formatDate(item.dataCaptura)}
              </Text>
            </TouchableOpacity>

            {datePickerFor === item.localId && (
              <DateTimePicker
                value={item.dataCaptura ?? new Date()}
                mode="date"
                maximumDate={new Date()}
                onChange={(e, d) => onDateChange(item.localId, e, d)}
              />
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.addTile} onPress={handleAdd}>
          <Ionicons name="add" size={32} color={theme.colors.primary} />
          <Text style={styles.addText}>Adicionar</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const TILE = 120;

const styles = StyleSheet.create({
  container: { marginBottom: theme.spacing.lg },
  label: { fontSize: 16, fontWeight: 'bold', color: theme.colors.text, marginBottom: theme.spacing.xs },
  subtitle: { fontSize: 13, color: theme.colors.subtext, marginBottom: theme.spacing.sm },
  row: { gap: theme.spacing.sm, paddingVertical: theme.spacing.xs },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: theme.colors.lightGray,
  },
  thumb: { width: '100%', height: '100%' },
  playBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    padding: 3,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorOverlay: { backgroundColor: 'rgba(180,0,0,0.55)' },
  overlayText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 12,
  },
  dateChip: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  dateChipText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  addTile: {
    width: TILE,
    height: TILE,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.lightGray,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addText: { marginTop: 4, fontSize: 13, color: theme.colors.primary, fontWeight: '600' },
});
```

- [ ] **Step 2: Typecheck**

Run: `cd mobile_app && npx tsc --noEmit`
Expected: sem erros. (Se `theme.colors.subtext` acusar erro de tipo, usar `theme.colors.textSecondary` como no restante do projeto — confirmar em `src/constants/theme.ts`.)

- [ ] **Step 3: Commit**

```bash
git add mobile_app/src/components/MemoryMediaPicker.tsx
git commit -m "feat(mobile): componente MemoryMediaPicker (multi-mídia com progresso e data por item)"
```

---

### Task 7: Integrar tudo na `AddPlantScreen` (data de aquisição, planta pública, memória, loading)

**Files:**
- Modify: `mobile_app/src/screens/App/AddPlantScreen.tsx`

**Interfaces:**
- Consumes: `MemoryMediaPicker` (Task 6), `buildCreatePlantaDTO`/`buildMemoryFotoDTO`/`ReadyMedia` (Task 4), `DateTimePicker`, `Switch`.
- Produces: tela final — não exporta nada novo.

- [ ] **Step 1: Update imports**

In `mobile_app/src/screens/App/AddPlantScreen.tsx`, replace the top imports (lines 1–21) so that:
- `Switch` is added to the `react-native` import list.
- the new modules are imported.

Replace:

```tsx
import {
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { especieService } from '../../services/especieService';
import { plantaService, CreatePlantaDTO } from '../../services/plantaService';
import { fotoService } from '../../services/fotoService';
import { Especie, ModoAquisicao } from '../../types';
import { theme } from '../../constants/theme';
import { CoverPhotoPicker } from '../../components/CoverPhotoPicker';
import { usePreferencias } from '../../context/PreferenciasContext';
```

with:

```tsx
import {
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { especieService } from '../../services/especieService';
import { plantaService } from '../../services/plantaService';
import { fotoService } from '../../services/fotoService';
import { Especie, ModoAquisicao } from '../../types';
import { theme } from '../../constants/theme';
import { CoverPhotoPicker } from '../../components/CoverPhotoPicker';
import { MemoryMediaPicker } from '../../components/MemoryMediaPicker';
import { buildCreatePlantaDTO, buildMemoryFotoDTO, ReadyMedia } from './addPlant.helpers';
import { usePreferencias } from '../../context/PreferenciasContext';
```

- [ ] **Step 2: Add new state**

After the line `const [isUploadingCover, setIsUploadingCover] = useState(false);` (≈ line 34), add:

```tsx
  const [dataAquisicao, setDataAquisicao] = useState<Date | null>(null);
  const [showAquisicaoPicker, setShowAquisicaoPicker] = useState(false);
  const [plantaPublica, setPlantaPublica] = useState(false);
  const [memoryItems, setMemoryItems] = useState<ReadyMedia[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
```

- [ ] **Step 3: Rewrite `handleSubmit` to use the helpers and attach memory media**

Replace the whole `handleSubmit` function (lines ≈82–121) with:

```tsx
  const handleSubmit = async () => {
    if (!especieId) {
      Alert.alert('Campo Obrigatório', 'Por favor, selecione uma espécie.');
      return;
    }
    if (isUploadingMedia) {
      Alert.alert('Aguarde', 'Ainda há mídias sendo enviadas.');
      return;
    }

    setIsLoading(true);
    const plantaData = buildCreatePlantaDTO({
      especieId,
      nome,
      identificador,
      dataAquisicao,
      modoAquisicao,
      observacoes,
      fotoCapaUrl: coverPublicUrl,
      plantaPublica,
    });

    try {
      const planta = await plantaService.createPlanta(plantaData);

      // Foto de capa na galeria
      if (coverPublicUrl) {
        try {
          await fotoService.createFoto({
            caminhoArquivo: coverPublicUrl,
            plantaId: planta.id,
            titulo: 'Foto de capa',
            tipo: 'FOTO',
          });
        } catch {
          // Não bloquear a criação da planta se o registo da foto falhar
        }
      }

      // Mídias de memória (fotos/vídeos de outros períodos)
      for (const item of memoryItems) {
        try {
          await fotoService.createFoto(buildMemoryFotoDTO(item, planta.id));
        } catch {
          // Não bloquear se uma mídia individual falhar
        }
      }

      Alert.alert('Sucesso', 'Planta adicionada à sua coleção!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível adicionar a planta.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
```

- [ ] **Step 4: Add the MemoryMediaPicker below the cover photo**

Immediately after the `<CoverPhotoPicker ... />` block (closing `/>` ≈ line 128), add:

```tsx
      <MemoryMediaPicker
        onReadyItemsChange={setMemoryItems}
        onUploadingChange={setIsUploadingMedia}
      />
```

- [ ] **Step 5: Add "Data de Aquisição" and "Planta Pública" controls**

Right after the "Observações Gerais" `TextInput` block (ends ≈ line 204, before the submit `TouchableOpacity`), add:

```tsx
      <Text style={styles.label}>Data de Aquisição</Text>
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowAquisicaoPicker(true)}>
        <Text style={dataAquisicao ? styles.dateText : styles.datePlaceholder}>
          {dataAquisicao ? dataAquisicao.toLocaleDateString('pt-BR') : 'Selecione a data...'}
        </Text>
      </TouchableOpacity>
      {showAquisicaoPicker && (
        <DateTimePicker
          value={dataAquisicao ?? new Date()}
          mode="date"
          maximumDate={new Date()}
          onChange={(_event, selected) => {
            setShowAquisicaoPicker(false);
            if (selected) setDataAquisicao(selected);
          }}
        />
      )}

      <View style={styles.switchRow}>
        <View style={styles.switchTextWrap}>
          <Text style={styles.label}>Planta Pública</Text>
          <Text style={styles.switchHint}>Se ativado, outros usuários poderão ver esta planta.</Text>
        </View>
        <Switch
          value={plantaPublica}
          onValueChange={setPlantaPublica}
          trackColor={{ true: theme.colors.primary }}
        />
      </View>
```

- [ ] **Step 6: Disable submit while any upload is running**

Replace the submit button block (lines ≈206–216) with:

```tsx
      <TouchableOpacity
        style={[styles.button, (isLoading || isUploadingCover || isUploadingMedia) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading || isUploadingCover || isUploadingMedia}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {isUploadingMedia ? 'Enviando mídias...' : 'Adicionar Planta'}
          </Text>
        )}
      </TouchableOpacity>
```

- [ ] **Step 7: Add the new styles**

In the `StyleSheet.create({ ... })` (after the `textArea` style), add:

```tsx
    dateButton: {
        backgroundColor: theme.colors.card,
        borderRadius: 8,
        paddingHorizontal: theme.spacing.md,
        height: 50,
        justifyContent: 'center',
        marginBottom: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.lightGray,
    },
    dateText: {
        fontSize: 16,
        color: theme.colors.text,
    },
    datePlaceholder: {
        fontSize: 16,
        color: theme.colors.subtext || theme.colors.textSecondary,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    switchTextWrap: {
        flex: 1,
    },
    switchHint: {
        fontSize: 13,
        color: theme.colors.subtext || theme.colors.textSecondary,
    },
```

- [ ] **Step 8: Typecheck and run the pure tests**

Run: `cd mobile_app && npx tsc --noEmit && npm test`
Expected: sem erros de tipo; testes puros (`mediaDate`, `addPlant.helpers`) verdes.

- [ ] **Step 9: Manual verification on device (after native rebuild)**

Run: `cd mobile_app && npx expo run:android` (rebuild necessário pela nova dependência nativa).
Verificar:
- Selecionar múltiplas fotos **e** um vídeo → thumbnails aparecem com progresso; vídeo mostra a thumbnail + badge de play.
- A data de cada mídia vem preenchida (quando detectável) e abre o date picker ao tocar no chip.
- Remover uma mídia funciona; mídia com erro mostra "Erro".
- "Data de Aquisição" e "Planta Pública" funcionam; botão "Adicionar" fica desabilitado enquanto há upload.
- Após salvar, abrir a galeria da planta (PhotoGalleryScreen) e confirmar que as mídias aparecem, ordenadas pelo período.

- [ ] **Step 10: Commit**

```bash
git add mobile_app/src/screens/App/AddPlantScreen.tsx
git commit -m "feat(mobile): tela Adicionar Planta com memória, data de aquisição e visibilidade"
```

---

## Self-Review (preenchido pelo autor do plano)

**Spec coverage:**
- Foto de capa → já existe, mantida (Task 7 Step 3).
- Várias fotos/vídeos com data automática/editável → Tasks 3–7.
- `dataCaptura` persistida + galeria por período → Tasks 1–2.
- Data de aquisição → Task 7 (Steps 5, 7).
- Modo de aquisição / Observações → já existiam, preservados.
- Planta pública (só `plantaPublica`) → Task 7 (Steps 5, 7) + `buildCreatePlantaDTO` (Task 4).
- TDD backend completo / lógica pura testada no front → Tasks 1, 3, 4.
- Loading/upload UX → Task 6 (progresso por item) + Task 7 (Step 6, botão travado).

**Placeholder scan:** sem TODO/TBD; todo passo tem código/comando concreto.

**Type consistency:** `ReadyMedia`, `AddPlantFormState`, `buildCreatePlantaDTO`, `buildMemoryFotoDTO`, `processAndUploadMedia`, `extractCaptureDate`, `parseExifDateTimeOriginal`, `resolveCaptureDate` usados com as mesmas assinaturas entre tasks.
