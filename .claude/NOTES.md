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
