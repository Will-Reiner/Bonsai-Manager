# NOTES

## Implementacao 2026-02-13

### Resumo

Auditoria completa do projeto e implementacao de 13 tarefas em 3 fases: correcoes criticas, funcionalidades importantes e funcionalidades avancadas. 73 suites de teste, 207 testes — todos a passar.

### Detalhes

**Fase 1 — Correcoes Criticas**
- Completados metodos CRUD em `especieService` e `atividadeService` (update/delete)
- Ativados `helmet()` e `cors()` no servidor (pacote `cors` instalado)
- Segredos movidos de valores hardcoded no docker-compose para variaveis de ambiente com `.env.example`
- `handleDelete` no PlantDetailScreen implementado com confirmacao e navegacao
- Botao "+" na AgendaScreen agora abre modal de selecao de planta e navega para ScheduleCare

**Fase 2 — Funcionalidades Importantes**
- 11 novos endpoints GET em 7 modulos (guia-sazonal, guia-de-tecnicas, amizade, inspiracao, atividade-recurso-sugerido, atividade-ferramenta-sugerida, agenda) com use cases e testes
- Paginacao opcional (`server/src/utils/pagination.ts`) aplicada a 5 controllers — retrocompativel
- Tela de edicao de perfil (`EditProfileScreen`) com rota, botao no ProfileScreen e `updateUser` no AuthContext
- Middleware global de erros (`server/src/utils/errors.ts`, `server/src/middlewares/error.middleware.ts`) com classes AppError, NotFoundError, ConflictError, etc.

**Fase 3 — Funcionalidades Avancadas**
- Upload de fotos end-to-end: `multer` no backend (`server/src/config/upload.ts`, rota POST `/api/fotos/upload`), `express.static` em `/uploads`, volume Docker para persistencia, `expo-image-picker` no frontend, galeria horizontal no PlantDetailScreen
- TechniqueDetailScreen agora exibe ferramentas e recursos sugeridos (novos services + types)
- Filtros e ordenacao: pesquisa + sort na CollectionScreen, chips de status na AgendaScreen
- Vista calendario na AgendaScreen com `react-native-calendars` (toggle lista/calendario, dots por status, drill-down por dia)

**Pacotes instalados:** `cors`, `@types/cors`, `multer`, `@types/multer` (server) | `expo-image-picker`, `react-native-calendars` (mobile)

## Implementacao 2026-02-13 (2)

### Resumo

Fluxo completo de sugestao e homologacao de especies — usuarios podem sugerir especies (status SUGERIDO), administradores aprovam (status VERIFICADO). 216 testes, 74 suites — todos a passar.

### Detalhes

**Banco de Dados**
- Novo enum `StatusEspecie` (VERIFICADO, SUGERIDO) no schema Prisma
- `Especie.nomeCientifico` agora nullable (`String?`), campo `status` com default SUGERIDO, FK `criadoPorId` para Usuario
- Migracao com estrategia de dois passos: dados existentes recebem VERIFICADO, default alterado para SUGERIDO

**Backend — Logica de Negocio**
- `CreateEspecieUseCase` recebe `{ data, userId, isAdmin }` — user forcado a SUGERIDO, admin default VERIFICADO, nomeComum obrigatorio para user
- `UpdateEspecieUseCase` bloqueia alteracao de status por nao-admin (erro 403)
- Novo `GetEspeciesSugeridasUseCase` com `findByStatus('SUGERIDO')`
- Repositorio com novo metodo `findByStatus`, `findById` agora inclui relacao `criadoPor`

**Backend — API**
- Nova rota `GET /api/especies/sugeridas` (admin only, antes de `/:id`)
- `DELETE /api/especies/:id` restrito a admin
- Controller faz lookup de role via `prisma.usuario.findUnique`
- Schema Zod: `nomeCientifico` agora opcional

**Frontend**
- Tipo `Especie.nomeCientifico` agora `string | null`, adicionados `status` e `criadoPorId`
- Service: novos metodos `getEspeciesSugeridas()` e `aprovarEspecie(id)`
- ManageEspeciesScreen: secao "Fila de Homologacao" com botao Aprovar por especie
- AddPlantScreen: modal "Sugerir Nova Especie" com campo nomeComum obrigatorio
- SpeciesListScreen: badge "Sugerido" em especies nao verificadas
- Correcao de null safety com optional chaining em PlantDetailScreen, SpeciesDetailScreen, EditPlantScreen e PlantListItem

## Implementacao 2026-02-19

### Resumo

Modulo global de gerenciamento de midia com Cloudflare R2 via Presigned URLs — upload direto do dispositivo ao bucket, com compressao de imagem (WebP) e suporte a video com UI otimista.

### Detalhes

**Backend — Modulo `midia` (stateless)**
- Novo S3Client apontando para R2 com `requestChecksumCalculation: 'when_required'` para evitar 403 por checksum automatico do SDK v3
- Use case `GeneratePresignedUrlUseCase`: sanitiza nome, gera chave `media/<uuid>/<nome>`, assina PutObjectCommand com 5 min de TTL
- Endpoint `POST /api/midia/presigned-url` protegido por `authMiddleware`, retorna `{ uploadUrl, publicUrl, key }`
- 5 testes unitarios passando com mocks do AWS SDK

**Frontend — Infraestrutura de upload**
- `mediaCompressor.ts`: compressao de imagem para WebP 1080px; compressao de video 720p/2Mbps com fallback gracioso no Expo Go (react-native-compressor via require condicional); thumbnail de video via expo-video-thumbnails
- `mediaService.ts`: `getPresignedUrl()` via Axios + `uploadToR2()` via XMLHttpRequest com `upload.onprogress` real; log de erro com status e body do R2
- `useMediaUpload` hook: fluxo unificado imagem/video, UI otimista para thumbnail de video (disponivel ~2s antes do upload completar), progresso 0-100% com fases
- `UploadProgressBar` component com `Animated.Value` para animacao suave, mostra fase e percentual

**Integracao — PlantDetailScreen**
- `handleAddPhoto` substituido: picker -> compressImage -> R2 presigned PUT -> `fotoService.createFoto(publicUrl)` -> banco
- `resolveFotoUri` com retrocompatibilidade: fotos antigas (`/uploads/...`) e novas (URL R2 absoluta) funcionam lado a lado
- `UploadProgressBar` integrado no card de fotos durante upload

**Configuracao**
- `.env.example` criado com variaveis R2
- Scripts `android`/`ios` no `package.json` do mobile atualizados para `expo run:*` (dev-client)
- `crypto.randomUUID` substituido por funcao inline (Node stdlib nao disponivel no RN)

## Implementacao 2026-02-19 (2)

### Resumo

Limpeza do modulo `foto` — remocao do upload multipart/multer — e extensao do modelo para suportar videos, com viewer de midia em tela cheia (fotos) e player nativo (videos) via `expo-video`. 221 testes, 75 suites — todos a passar.

### Detalhes

**Backend — Limpeza do upload local**
- Removidos `multer` e `@types/multer` do `server/package.json`
- `server/src/config/upload.ts` deletado
- `FotoController.upload()` (handler multipart) removido
- Rota `POST /api/fotos/upload` removida do router

**Backend — Extensao do modelo `Foto` para midia generica**
- Novo enum `TipoMidia { FOTO, VIDEO }` no schema Prisma
- Campos `tipo TipoMidia @default(FOTO)` e `thumbnailUrl String?` adicionados ao model `Foto`
- Migracao retrocompativel: registros existentes ficam como `FOTO`
- `CreateFotoDTO` atualizado com `tipo?: 'FOTO' | 'VIDEO'` e `thumbnailUrl?: string`
- `createFotoSchema` Zod atualizado com os mesmos campos opcionais

**Frontend — fotoService**
- `uploadFoto()` legado (multipart) removido do service e do objeto exportado
- `CreateFotoDTO` atualizado com `tipo` e `thumbnailUrl`
- Tipo `Foto` em `types/index.ts` atualizado com `tipo: TipoMidia` e `thumbnailUrl?: string | null`
- Novo tipo `TipoMidia = 'FOTO' | 'VIDEO'` exportado

**Frontend — PlantDetailScreen**
- Picker de midia aceita imagens e videos (`mediaTypes: ['images', 'videos']`)
- Apos upload, `tipo` e `thumbnailUrl` do resultado sao repassados para `createFoto()`
- Galeria: videos exibem thumbnail com overlay semitransparente e icone play (Ionicons)
- Tap em qualquer midia abre Modal em tela cheia (fundo escuro, botao X para fechar):
  - Foto: `Image` com `resizeMode="contain"` ocupando a tela toda
  - Video: player nativo via `expo-video` com controles, fullscreen e picture-in-picture
- `VideoPlayerView` definido como componente separado (fora do principal) para manter `useVideoPlayer` sem ser condicional
- Removido `Linking.openURL` (abria browser externo)
- Long press continua sendo o gesto de exclusao

**Pacotes instalados:** `expo-video ~3.0.16` (mobile) — requer rebuild do dev client (`npx expo run:android/ios`)

## Implementacao 2026-02-19 (3)

### Resumo

Foto de capa na criacao e edicao de planta — campo `fotoCapaUrl` no modelo Planta com componente reutilizavel `CoverPhotoPicker` integrado nos formularios. 222 testes, 75 suites — todos a passar.

### Detalhes

**Backend**
- Novo campo `fotoCapaUrl String?` no modelo `Planta` (schema Prisma + migracao aplicada)
- Campo propagado em todos os DTOs (Create/Update Request e Repository), `PlantaWithEspecie`, Zod schemas e `PrismaPlantaRepository` (data + select em create, findMany, findById, update)
- Novo teste para criacao de planta com `fotoCapaUrl`; mocks atualizados em todos os 5 ficheiros de teste

**Frontend**
- Tipo `Planta` e `CreatePlantaDTO` atualizados com `fotoCapaUrl`
- Novo componente `CoverPhotoPicker`: picker de imagem, upload via `useMediaUpload`, preview com botoes trocar/remover, `UploadProgressBar` integrado
- `AddPlantScreen`: `CoverPhotoPicker` no topo do formulario, `fotoCapaUrl` enviado no DTO, registo `Foto` criado apos criacao da planta (para aparecer na galeria)
- `EditPlantScreen`: mesma integracao com carregamento da capa existente, so cria novo registo `Foto` se a capa mudou
- Botao submit desabilitado durante upload em ambos os ecras
