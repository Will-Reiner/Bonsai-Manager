# Bonsai Manager — Funcionalidades Desenvolvidas

Documentação completa do estado atual do projeto: domínio, modelos de dados, endpoints da API, telas do app e fluxos. Idioma de produto e código: **português**.

---

## 1. Stack & Arquitetura

| Camada | Tecnologia |
|---|---|
| Backend | Node.js + Express + TypeScript |
| Validação | Zod |
| ORM | Prisma 5.22 |
| Banco | PostgreSQL |
| Auth | JWT (Bearer) + bcrypt |
| Docs | Swagger UI (`/api/docs`) |
| Mobile | React Native 0.81 + Expo SDK 54 |
| Web (novo) | Expo Web (react-native-web 0.21) |
| Navegação | React Navigation v7 (Native Stack + Bottom Tabs) |
| Storage de mídia | Cloudflare R2 (presigned URLs) |
| Infra dev | Docker Compose (API + Postgres) |

**Backend segue Clean Architecture por módulo:**
`controllers → schemas → use-cases → repositories → prisma`. Cada use case injeta repository interface (testável via mocks; testes em `*.use-case.test.ts` com AAA).

---

## 2. Modelo de Dados (Prisma)

### 2.1 Enums

| Enum | Valores |
|---|---|
| `Role` | `USER`, `ADMIN` |
| `AgendaStatus` | `PENDENTE`, `CONCLUIDO`, `CANCELADO` |
| `UnidadeMedida` | `UNIDADE`, `KG`, `G`, `L`, `ML` |
| `ModoAquisicao` | `SEMENTE`, `ESTACA`, `ALPORQUIA`, `YAMADORI`, `COMPRA` |
| `Estacao` | `PRIMAVERA`, `VERAO`, `OUTONO`, `INVERNO` |
| `MomentoIdeal` | `DEVE_FAZER`, `PODE_FAZER`, `EVITAR` |
| `RecomendacaoTecnica` | `RECOMENDADA`, `NAO_RECOMENDADA`, `COM_CUIDADO` |
| `TipoPlanta` | `PERENE`, `CADUCIFOLIA`, `SEMI_CADUCA`, `ARVORE`, `ARBUSTO`, `CONIFERA` |
| `StatusEspecie` | `VERIFICADO`, `SUGERIDO` |
| `TipoMidia` | `FOTO`, `VIDEO`, `VISAO_FUTURA` |

### 2.2 Entidades principais

#### `Usuario`
| Campo | Tipo | Observação |
|---|---|---|
| `id` | UUID | PK |
| `nome` | String | obrigatório |
| `nomePublico` | String? | apelido público opcional |
| `email` | String | único |
| `senhaHash` | String | bcrypt |
| `localidade` | String? | cidade/região |
| `fotoPerfilUrl` | String? | URL R2 |
| `bio` | Text? | |
| `perfilPublico` | Boolean | default `true` |
| `recursosHabilitado` | Boolean | default `true` (módulo de inventário) |
| `role` | Role | default `USER` |
| `createdAt` / `updatedAt` | DateTime | |

Relações: `plantas`, `recursos`, `fotos`, `seguindo`, `seguidores`, `especiesSugeridas`, `preferencias`.

#### `Especie`
| Campo | Tipo | Observação |
|---|---|---|
| `id` | UUID | |
| `nomeCientifico` | String? | único |
| `nomeComum` | String? | |
| `familia` | String? | |
| `origem` | String? | |
| `tipoDePlanta` | TipoPlanta? | |
| `status` | StatusEspecie | default `SUGERIDO` |
| `folhas`, `tronco`, `flores`, `frutos`, `raizes` | Text? | descrição botânica |
| `luminosidade`, `rega`, `substratoIdeal`, `adubacao`, `clima` | Text? | cultivo |
| `problemasComuns`, `pros`, `contras`, `linhasDeRaciocinio`, `observacoes` | Text? | conhecimento |
| `criadoPorId` | UUID? | usuário que sugeriu (SetNull) |

Relações: `plantas`, `guiasDeTecnicas`, `guiasSazonais`.

#### `Planta`
| Campo | Tipo | Observação |
|---|---|---|
| `id` | UUID | |
| `nome` | String? | apelido livre |
| `identificador` | String? | código interno do usuário; único por usuário |
| `dataAquisicao` | DateTime? | |
| `modoAquisicao` | ModoAquisicao? | |
| `observacoes` | Text? | |
| `fotoCapaUrl` | String? | |
| `plantaPublica` | Boolean | default `false` |
| `historicoPublico` | Boolean | default `false` |
| `usuarioId` | UUID | dono (Cascade) |
| `especieId` | UUID | obrigatório |

Restrição: `@@unique([usuarioId, identificador])`.
Relações: `fotos`, `agendas`, `inspiracoes`.

#### `Atividade`
| Campo | Tipo | Observação |
|---|---|---|
| `id` | UUID | |
| `nome` | String | único (ex.: "Poda de manutenção") |
| `descricao`, `objetivos`, `preparacao`, `execucao`, `cuidadosPosProcedimento` | Text? | conteúdo do guia de técnica |

Relações: `agendas`, `guiasDeTecnicas`, `guiasSazonais`, `recursosSugeridos`, `ferramentasSugeridas`.

#### `Agenda` (tarefas agendadas e histórico)
| Campo | Tipo | Observação |
|---|---|---|
| `id` | UUID | |
| `dataAgendada` | DateTime | |
| `dataConcluida` | DateTime? | preenchida no fechamento |
| `status` | AgendaStatus | default `PENDENTE` |
| `detalhes` | Text? | o que foi feito |
| `observacaoFutura` | Text? | nota pra próximo ciclo |
| `plantaId` | UUID | Cascade |
| `atividadeId` | UUID | |

Relação: `recursosUtilizados` (junção com `Recurso`).

#### `Foto` (mídia)
| Campo | Tipo | Observação |
|---|---|---|
| `id` | UUID | |
| `caminhoArquivo` | String | path/URL R2 |
| `titulo`, `tags`, `descricao` | String/Text? | |
| `tipo` | TipoMidia | `FOTO`, `VIDEO`, `VISAO_FUTURA` |
| `thumbnailUrl` | String? | apenas vídeos (WebP) |
| `plantaId` | UUID? | Cascade |
| `usuarioId` | UUID | Cascade |

Relação: `inspiracoes` (vinculada a outras plantas).

#### `Recurso` (insumo no inventário do usuário)
| Campo | Tipo | Observação |
|---|---|---|
| `quantidadeDisponivel` | Int | |
| `unidadeMedida` | UnidadeMedida? | |
| `observacoes` | Text? | |
| `usuarioId` | UUID | Cascade |
| `tipoRecursoId` | UUID | catálogo global |

#### `TipoRecurso` / `Ferramenta`
Catálogos globais com `nome` único, gerenciados por admin.

### 2.3 Tabelas de junção

| Tabela | Composição | Propósito |
|---|---|---|
| `Amizade` | (`seguidorId`, `seguidoId`) | rede social |
| `GuiaDeTecnicas` | (`especieId`, `atividadeId`) + `recomendacao`, `observacoes` | "Esta técnica é recomendada pra esta espécie?" |
| `GuiaSazonal` | (`especieId`, `atividadeId`, `estacao`) + `momentoIdeal`, `observacoes` | calendário por estação |
| `Inspiracao` | (`plantaId`, `fotoId`) | foto de inspiração externa ligada a uma planta |
| `AgendaRecursoUtilizado` | (`agendaId`, `recursoId`) + `quantidadeUtilizada` | baixa de insumo ao concluir tarefa |
| `AtividadeRecursoSugerido` | (`atividadeId`, `tipoRecursoId`) | sugestões automáticas |
| `AtividadeFerramentaSugerida` | (`atividadeId`, `ferramentaId`) | sugestões automáticas |
| `PreferenciaUsuario` | (`usuarioId`, `chave`) + `valor` | chave-valor livre por usuário |

---

## 3. Autenticação & Autorização

- **JWT Bearer Token** anexado pelo interceptor do Axios (mobile/web) ou header `Authorization`.
- **Middlewares:**
  - `authMiddleware` — exige token, popula `req.user.userId`.
  - `adminMiddleware` — exige `role === ADMIN`.
- Senhas hasheadas com **bcrypt**.

### Endpoints `/api/auth`
| Método | Rota | Auth | Função |
|---|---|---|---|
| POST | `/register` | público | cria usuário e retorna JWT |
| POST | `/login` | público | autentica e retorna JWT |
| GET | `/me` | user | dados do usuário logado |
| PUT | `/me` | user | edita perfil (`nome`, `nomePublico`, `bio`, `localidade`, `fotoPerfilUrl`, `perfilPublico`) |

---

## 4. Endpoints por Módulo

> Base URL: `http://localhost:3000/api`
> Swagger: `http://localhost:3000/api/docs`

### 4.1 Usuários — `/users`
| Método | Rota | Auth |
|---|---|---|
| GET | `/` | user — lista perfis públicos |
| GET | `/:id` | user — perfil público por ID |

### 4.2 Plantas — `/plantas` (tudo autenticado, escopo do usuário)
| Método | Rota | Função |
|---|---|---|
| POST | `/` | criar planta |
| GET | `/` | listar plantas do usuário |
| GET | `/:id` | detalhe |
| PUT | `/:id` | editar |
| DELETE | `/:id` | excluir |

### 4.3 Espécies — `/especies`
| Método | Rota | Auth |
|---|---|---|
| GET | `/` | público — lista verificadas |
| GET | `/sugeridas` | admin — fila de moderação |
| GET | `/:id` | público |
| POST | `/` | user — sugere espécie (status `SUGERIDO`) |
| PUT | `/:id` | user — edita (admin pode aprovar) |
| DELETE | `/:id` | admin |

### 4.4 Atividades — `/atividades`
| Método | Rota | Auth |
|---|---|---|
| GET | `/`, `/:id` | público |
| POST/PUT/DELETE | `/`, `/:id` | user (futuro: admin) |

### 4.5 Agenda — `/agendas` (autenticado)
| Método | Rota | Função |
|---|---|---|
| POST | `/` | criar agendamento |
| GET | `/` | todas as agendas do usuário (com filtros internos) |
| GET | `/:id` | detalhe |
| PUT | `/:id` | atualizar status/dados — pode debitar recursos via `recursosUtilizados[]` |
| DELETE | `/:id` | cancelar/excluir |

### 4.6 Tipos de Recurso — `/tipos-recurso`
- GET público.
- POST/PUT/DELETE só admin.

### 4.7 Recursos (inventário do usuário) — `/recursos` (autenticado)
CRUD completo: POST, GET, GET `/:id`, PUT, DELETE.

### 4.8 Ferramentas — `/ferramentas`
GET público; POST/PUT/DELETE admin.

### 4.9 Fotos — `/fotos` (autenticado)
| Método | Rota |
|---|---|
| POST | `/` — registra metadados após upload |
| GET | `/planta/:plantaId` — galeria da planta |
| GET | `/:id` |
| PUT | `/:id` |
| DELETE | `/:id` |

### 4.10 Mídia (upload R2) — `/midia` (autenticado)
| Método | Rota | Função |
|---|---|---|
| POST | `/presigned-url` | retorna URL pré-assinada de upload pro Cloudflare R2 |

### 4.11 Amizade — `/amizades` (autenticado)
| Método | Rota |
|---|---|
| GET | `/seguidores` |
| GET | `/seguindo` |
| POST | `/follow/:seguidoId` |
| DELETE | `/unfollow/:seguidoId` |

### 4.12 Inspirações — `/inspiracoes` (autenticado)
| Método | Rota |
|---|---|
| GET | `/planta/:plantaId` |
| POST | `/:plantaId/:fotoId` |
| DELETE | `/:plantaId/:fotoId` |

### 4.13 Guias

#### Guia de Técnicas — `/guias-de-tecnicas`
GET público; mutations admin. `GET /especie/:especieId` retorna recomendações por atividade.

#### Guia Sazonal — `/guias-sazonais`
Mesmo padrão; PK composta `(especieId, atividadeId, estacao)`.

### 4.14 Sugestões automáticas
- `/atividades-recursos-sugeridos` — sugere tipo de recurso por atividade (admin gerencia).
- `/atividades-ferramentas-sugeridas` — idem para ferramentas.
- `/atividades-recursos` — junção operacional do consumo real (usuário).

### 4.15 Preferências — `/preferencias` (autenticado)
| Método | Rota | Função |
|---|---|---|
| GET | `/` | todas as prefs do usuário (kv) |
| PUT | `/` | upsert em lote |
| PUT | `/:chave` | upsert de uma chave |

---

## 5. Frontend — Telas

### 5.1 Estrutura de navegação

**Stack raiz** (`RootStackParamList`):
- `Login` / `Register` (não autenticado)
- `Onboarding` (autenticado, mas `onboarding_concluido !== 'true'`)
- `MainTabs` (5 abas) + telas modais empilhadas

**Bottom Tabs** (custom tab bar):
1. `Home`
2. `Collection` (Coleção)
3. `AddAction` (botão central que abre modal — não é tela)
4. `Encyclopedia` (Enciclopédia)
5. `Community` (Comunidade)

### 5.2 Inventário de telas

#### Auth (`screens/Auth/`)
| Tela | Função |
|---|---|
| `LoginScreen` | login com email/senha |
| `RegisterScreen` | cadastro |

#### Onboarding (`screens/Onboarding/`)
| Tela | Função |
|---|---|
| `OnboardingScreen` | shell de navegação de passos |
| `OnboardingIdentificacaoScreen` | escolhe se usa `identificador`/`nome` nas plantas |
| `OnboardingRegaScreen` | ativa gerência de rega |
| `OnboardingAdubacaoScreen` | modo (geral/individual/não aduba) + frequência |
| `OnboardingAtividadesScreen` | quais atividades rastrear |
| `OnboardingResumoScreen` | confirma e marca `onboarding_concluido='true'` |

#### App (`screens/App/`)
| Tela | Função |
|---|---|
| `HomeScreen` | dashboard inicial |
| `CollectionScreen` | grid/lista das plantas do usuário |
| `AddPlantScreen` | criar planta (com fotos) |
| `EditPlantScreen` | editar planta |
| `PlantDetailScreen` | detalhe + histórico + galeria |
| `PhotoGalleryScreen` | galeria de fotos da planta |
| `ScheduleCareScreen` | agendar uma atividade pra uma planta |
| `TasksScreen` | lista seccionada de tarefas + modal de intervenção rápida |
| `InventoryScreen` | recursos do usuário (CRUD) |
| `EncyclopediaScreen` | hub: técnicas + espécies |
| `SpeciesListScreen` | catálogo de espécies |
| `SpeciesDetailScreen` | detalhe da espécie (botânica, cultivo, guias) |
| `TechniquesListScreen` | catálogo de atividades/técnicas |
| `TechniqueDetailScreen` | detalhe da técnica (objetivos, preparação, execução…) |
| `CommunityScreen` | feed/exploração social |
| `ProfileScreen` | perfil próprio |
| `EditProfileScreen` | editar perfil (nome, bio, foto, localidade, privacidade) |
| `PublicProfileScreen` | perfil de outro usuário |
| `UserListScreen` | lista genérica (seguidores/seguindo) |
| `SettingsScreen` | configurações |
| `PreferenciasScreen` | edita preferências de cuidado |
| `AdminScreen` | hub admin |

#### Admin (`screens/Admin/`)
| Tela | Função |
|---|---|
| `ManageAtividadesScreen` | CRUD de atividades |
| `ManageEspeciesScreen` | moderação (verificadas vs sugeridas) |
| `ManageTiposRecursoScreen` | CRUD do catálogo de tipos de recurso |

### 5.3 Estado global

- `AuthContext` — JWT em `AsyncStorage` (no web vira `localStorage`); expõe `authState`, `login()`, `logout()`.
- `PreferenciasContext` — carrega `/preferencias`, expõe `isOnboardingComplete` (gate do onboarding).

### 5.4 Camada de API (`src/api/index.ts`)
- Axios com `baseURL` derivado:
  - Web → `http://localhost:3000`
  - Mobile → IP da máquina (placeholder atual `255.255.255.0` precisa ser ajustado por device).
- Interceptor injeta `Authorization: Bearer <token>`.

---

## 6. Sistema de Preferências (kv)

Chaves persistidas em `PreferenciaUsuario`:

| Chave | Default | Valores possíveis |
|---|---|---|
| `usa_identificador` | `'false'` | `'true'` / `'false'` |
| `usa_nome_planta` | `'false'` | `'true'` / `'false'` |
| `gerencia_rega` | `'false'` | `'true'` / `'false'` |
| `adubacao_modo` | `'GERAL'` | `'GERAL'`, `'INDIVIDUAL'`, `'NAO_ADUBA'` |
| `adubacao_frequencia` | `'MENSAL'` | `'SEMANAL'`, `'QUINZENAL'`, `'MENSAL'`, `'OUTRO'` |
| `periodo_pos_transplante_dias` | `'90'` | número como string |
| `atividades_rastreadas` | `'[]'` | JSON-string de array de IDs |
| `onboarding_concluido` | `'false'` | `'true'` / `'false'` |

Todos os valores são `string` (kv genérico). Tipagem dos defaults em `mobile_app/src/types/index.ts` (`PREFERENCIAS_DEFAULTS`).

---

## 7. Funcionalidades Implementadas (resumo de capabilities)

### Núcleo
- ✅ Cadastro e login com JWT
- ✅ Edição de perfil (bio, foto, localidade, privacidade)
- ✅ Onboarding multi-step com gate de entrada
- ✅ Preferências de cuidado persistidas

### Plantas
- ✅ CRUD completo de plantas vinculadas a espécies
- ✅ Identificador único por usuário
- ✅ Foto de capa
- ✅ Galeria de fotos por planta
- ✅ Privacidade granular (planta pública / histórico público)
- ✅ Inspirações (vincula foto de outra fonte à planta)

### Mídia
- ✅ Upload via presigned URL (Cloudflare R2)
- ✅ Suporte a `FOTO`, `VIDEO`, `VISAO_FUTURA` (visão futura = mockup/edição da planta)
- ✅ Thumbnail WebP para vídeos
- ✅ Compressão no cliente (`react-native-compressor`)

### Agenda / Cuidados
- ✅ Agendar atividades por planta
- ✅ Estados `PENDENTE`/`CONCLUIDO`/`CANCELADO`
- ✅ Registro de recursos consumidos ao concluir (baixa do inventário)
- ✅ Observação futura (anotação para próximo ciclo)
- ✅ Tela de tarefas com seções e modal de intervenção rápida

### Inventário
- ✅ Recursos do usuário com unidade de medida
- ✅ Catálogo global de tipos de recurso (admin)
- ✅ Catálogo de ferramentas (admin)
- ✅ Sugestões automáticas de recursos/ferramentas por atividade

### Conhecimento
- ✅ Catálogo de espécies (verificadas/sugeridas) com moderação admin
- ✅ Sugestão de novas espécies por usuário
- ✅ Catálogo de atividades/técnicas com guia detalhado
- ✅ Guia de Técnicas por espécie (recomendação)
- ✅ Guia Sazonal (estação × momento ideal)

### Social
- ✅ Seguir / deixar de seguir usuários
- ✅ Listas de seguidores/seguindo
- ✅ Perfil público de terceiros
- ✅ Feed da Comunidade

### Admin
- ✅ Painel separado com gates por `role === ADMIN`
- ✅ Moderação de espécies sugeridas
- ✅ CRUD de atividades, tipos de recurso, ferramentas
- ✅ Gestão de sugestões automáticas (atividade ↔ recurso/ferramenta)

### Infraestrutura
- ✅ Docker Compose (API + Postgres)
- ✅ Swagger UI em `/api/docs`
- ✅ Migrações Prisma automáticas no startup
- ✅ Testes unitários (use cases) com mocks de repositório
- ✅ Expo Web habilitado (novo) — mesmo código roda no browser

---

## 8. Pendências (do CLAUDE.md)

- ⏳ Melhorar logs de erro da API
- ⏳ Recorrência em eventos de agenda
- ⏳ Registrar múltiplas tarefas de uma vez

Itens marcados como **DONE** no CLAUDE.md: sugestão de espécies, gestão de mídia, fotos no cadastro, visão futura, onboarding com perguntas de especificação.
