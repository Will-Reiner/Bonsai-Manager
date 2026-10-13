# Comunidade · Fase 3 (interagir) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Curtir, comentar e salvar posts, ver os Salvos e receber notificações dentro do app (curtida, comentário, novo seguidor), com contador no sino e ponto na aba Comunidade.

**Architecture:** Quatro tabelas novas (`Curtida`, `Comentario`, `Salvo`, `Notificacao`). No servidor, o lado de leitura (`LeituraComunidadeRepository`) ganha contagens por post, comentários, salvos e notificações; um repositório de escrita (`InteracoesRepository`) grava curtidas/salvos/comentários/notificações; regras puras em `dominio/interacoes.ts`; um caso de uso por ação. Seguir/deixar de seguir avisa a Comunidade por uma porta injetada no módulo `amizade`. No web, um hook por post com estado otimista, botões no cartão, comentários na página do post, telas de Salvos e Notificações.

**Tech Stack:** Express + Prisma 5 + Zod + Jest (`server/`); React 19 + React Router + TanStack Query 5 + Tailwind v4 + Vitest (`web/`).

**Spec:** `docs/superpowers/specs/2026-10-13-comunidade-design.md` (fase 3). Fases 1 e 2 já em produção.

## Global Constraints

- Português em código, comentários, UI e commits.
- Curtir, comentar e salvar só em posts visíveis ao leitor (`podeVer`); invisível/inexistente → **404**.
- Curtir/salvar são **idempotentes** (curtir de novo não duplica nem notifica de novo).
- Comentário: 1–1000 caracteres depois de `trim`; plano, sem respostas. Apaga: o autor (o seu) e o dono do post (qualquer um no post dele); senão **404**.
- Notificações: CURTIDA → dono do post; COMENTARIO → dono do post; SEGUIU → quem foi seguido. **Nunca** por ação sobre si mesmo. Descurtir remove a CURTIDA; deixar de seguir remove a SEGUIU; apagar comentário remove a COMENTARIO (cascata pelo `comentarioId`).
- Abrir a tela de notificações marca todas como lidas; o contador atualiza ao voltar o foco do app (sem push).
- Salvos: só aparecem os posts ainda visíveis; ordem do mais recente salvo.
- Paginação por posição (cursor `ISO_uuid`, `codificarCursor`/`lerCursor` de `repositories/filtros.ts`), nunca pelo item.
- Ícones: `curtir`, `comentar`, `salvar`, `notificacoes`, `seguir` (e `-ativo`, desenhados) já estão em `web/public/icones` e em `COM_ATIVO`. Curtido = `curtir` ativo em `text-hanko`.
- Trabalhar na `main`; push = deploy, depois da revisão final e conferência em produção (mesmo fluxo das fases 1 e 2).

## Review Focus

- Toque duplo na foto + toque no coração (ou dois toques rápidos) não cria duas curtidas nem duas notificações. (Task 4: `curtir` devolve `false` na segunda → não notifica)
- Curtir o próprio post, comentar no próprio post, seguir… a si mesmo (já barrado) — nenhuma notificação para si. (Task 4)
- Post que ficou privado depois de salvo some dos Salvos de quem salvou, e curtir/comentar nele dá 404. (Task 2: `filtroDosSalvos`; Task 4)
- Pessoa sem permissão tentando apagar comentário alheio em post alheio → 404, nada apagado. (Task 4)
- O número de curtidas no cartão não fica negativo nem "pula" quando a resposta do servidor chega depois de dois toques rápidos. (Task 7: `alternarCurtida`; Task 8: o hook usa a contagem devolvida pelo servidor)

---

## File Structure

**Server — criar**
- `server/prisma/migrations/<gerada>_comunidade_interacoes/migration.sql` (gerada pelo Prisma)
- `server/src/modules/comunidade/dominio/interacoes.ts` (+ `.test.ts`)
- `server/src/modules/comunidade/repositories/prisma-interacoes.repository.ts`
- `server/src/modules/comunidade/avisos.ts` — `criarAvisoDeSeguir()`
- `server/src/modules/comunidade/use-cases/{curtir-post,salvar-post,comentar,apagar-comentario,listar-comentarios,listar-salvos,listar-notificacoes,contar-nao-lidas,marcar-lidas}.use-case.ts` + `interacoes.use-cases.test.ts`

**Server — modificar**
- `server/prisma/schema.prisma`
- `server/src/modules/comunidade/comunidade.types.ts`, `dominio/montar.ts` (+ teste), `repositories/filtros.ts` (+ teste), `repositories/prisma-leitura.repository.ts`, `use-cases/carregar-posts.ts`, `use-cases/leitura.use-cases.test.ts`, `comunidade.schema.ts`, `comunidade.controller.ts`, `comunidade.router.ts`
- `server/src/modules/amizade/amizade.types.ts`, `use-cases/follow-user.use-case.ts`, `use-cases/unfollow-user.use-case.ts` (+ testes), `amizade.controller.ts`

**Web — criar**
- `web/src/components/comunidade/useInteracoesDoPost.ts`, `AcoesDoPost.tsx`, `ComentariosDoPost.tsx`, `ItemNotificacao.tsx`
- `web/src/pages/comunidade/SalvosPage.tsx`, `NotificacoesPage.tsx`

**Web — modificar**
- `web/src/types.ts`, `web/src/lib/endpoints.ts`, `web/src/lib/queries.ts`, `web/src/lib/comunidade.ts` (+ teste), `web/src/index.css`
- `web/src/components/comunidade/{FotosDoPost,CardPost,CardGrupo,GradePosts}.tsx`, `web/src/pages/comunidade/{ComunidadePage,PostPage,PerfilPublicoPage}.tsx`, `web/src/components/Layout.tsx`, `web/src/App.tsx`, `web/src/pages/ProfilePages.tsx`, `CLAUDE.md`

---

### Task 1: Banco — curtidas, comentários, salvos e notificações

**Files:**
- Modify: `server/prisma/schema.prisma`
- Create: `server/prisma/migrations/<timestamp>_comunidade_interacoes/migration.sql` (gerada)

**Interfaces:**
- Produces: `prisma.curtida`, `prisma.comentario`, `prisma.salvo`, `prisma.notificacao`, enum `TipoNotificacao` (`CURTIDA | COMENTARIO | SEGUIU`).

- [ ] **Step 1: Schema**

Depois dos outros `enum`:
```prisma
enum TipoNotificacao {
  CURTIDA
  COMENTARIO
  SEGUIU
}
```
No `model Usuario`, junto dos relacionamentos:
```prisma
  curtidas           Curtida[]
  comentarios        Comentario[]
  salvos             Salvo[]
  notificacoes       Notificacao[] @relation("NotificacoesRecebidas")
  notificacoesFeitas Notificacao[] @relation("NotificacoesFeitas")
```
No `model Post`, depois de `planta Planta @relation(...)`:
```prisma
  curtidas     Curtida[]
  comentarios  Comentario[]
  salvos       Salvo[]
  notificacoes Notificacao[]
```
Depois do `model Post`:
```prisma
model Curtida {
  createdAt DateTime @default(now())

  usuarioId String
  usuario   Usuario  @relation(fields: [usuarioId], references: [id], onDelete: Cascade)

  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@id([usuarioId, postId])
  @@index([postId])
}

model Comentario {
  id        String   @id @default(uuid())
  texto     String   @db.Text
  createdAt DateTime @default(now())

  usuarioId String
  usuario   Usuario  @relation(fields: [usuarioId], references: [id], onDelete: Cascade)

  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)

  notificacoes Notificacao[]

  @@index([postId, createdAt])
}

model Salvo {
  createdAt DateTime @default(now())

  usuarioId String
  usuario   Usuario  @relation(fields: [usuarioId], references: [id], onDelete: Cascade)

  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@id([usuarioId, postId])
  @@index([usuarioId, createdAt])
}

/// Aviso dentro do app (sem push). Apagar curtida/comentário/seguir remove o aviso correspondente.
model Notificacao {
  id           String          @id @default(uuid())
  tipo         TipoNotificacao
  lida         Boolean         @default(false)
  createdAt    DateTime        @default(now())

  /// Destinatário
  usuarioId    String
  usuario      Usuario         @relation("NotificacoesRecebidas", fields: [usuarioId], references: [id], onDelete: Cascade)

  atorId       String
  ator         Usuario         @relation("NotificacoesFeitas", fields: [atorId], references: [id], onDelete: Cascade)

  postId       String?
  post         Post?           @relation(fields: [postId], references: [id], onDelete: Cascade)

  comentarioId String?
  comentario   Comentario?     @relation(fields: [comentarioId], references: [id], onDelete: Cascade)

  @@index([usuarioId, lida, createdAt])
}
```

- [ ] **Step 2: Gerar a migração pelo Prisma** (não há dados a migrar)

Run: `docker compose up -d` e `docker compose exec api npx prisma migrate dev --create-only --name comunidade_interacoes`
Expected: cria `server/prisma/migrations/<timestamp>_comunidade_interacoes/migration.sql` com `CREATE TYPE "TipoNotificacao"`, as quatro tabelas, índices e chaves estrangeiras `ON DELETE CASCADE`. Ler o SQL e conferir.

- [ ] **Step 3: Aplicar e conferir**

Run: `docker restart bonsai_api`; `docker compose exec api npx prisma migrate status` → `Database schema is up to date!`; `docker compose exec api npx prisma migrate dev --create-only --name conferencia` → migração vazia (apagar a pasta gerada).
Run: `cd server && npm run prisma:generate && npm test` → tudo passa.

- [ ] **Step 4: Commit**

```bash
git add server/prisma
git commit -m "feat(server): tabelas de curtidas, comentários, salvos e notificações"
```

---

### Task 2: Regras puras e filtros das interações

**Files:**
- Create: `server/src/modules/comunidade/dominio/interacoes.ts` (+ `interacoes.test.ts`)
- Modify: `server/src/modules/comunidade/comunidade.types.ts`, `dominio/montar.ts` (+ `montar.test.ts`), `repositories/filtros.ts` (+ `filtros.test.ts`)

**Interfaces:**
- Produces (tipos):
```ts
export type TipoNotificacao = 'CURTIDA' | 'COMENTARIO' | 'SEGUIU';
export interface InteracoesDoPost { curtidas: number; comentarios: number; curtiu: boolean; salvou: boolean }
// PostDTO ganha: curtidas: number; curtiu: boolean; salvou: boolean; totalComentarios: number
export interface ComentarioLido { id: string; texto: string; createdAt: Date; usuario: UsuarioLido; post: { usuarioId: string } }
export interface ComentarioDTO { id: string; texto: string; createdAt: Date; autor: AutorDTO; podeApagar: boolean }
export interface NotificacaoLida {
  id: string; tipo: TipoNotificacao; lida: boolean; createdAt: Date; ator: UsuarioLido;
  post: { id: string; planta: { id: string; fotoCapaUrl: string | null } } | null;
  comentario: { texto: string } | null;
}
export interface NotificacaoDTO {
  id: string; tipo: TipoNotificacao; lida: boolean; createdAt: Date; ator: AutorDTO;
  post: { id: string; plantaId: string; capa: string | null } | null;
  comentario: string | null;
}
```
  - `deveNotificar(atorId, destinatarioId): boolean`; `podeApagarComentario(autorId, donoDoPostId, viewerId): boolean`; `interacoesPorPost(postIds, lidas): Map<string, InteracoesDoPost>`
  - `montarPosts(posts, conteudo, viewerId, interacoes?: Map<string, InteracoesDoPost>)`; `comentarioDe(c: ComentarioLido, viewerId): ComentarioDTO`; `notificacaoDe(n: NotificacaoLida): NotificacaoDTO`
  - `visivelPara(viewerId): Prisma.PostWhereInput`; `filtroDosComentarios(postId, cursor?)`; `filtroDosSalvos(viewerId, cursor?)`; `filtroDasNotificacoes(usuarioId, cursor?)`

- [ ] **Step 1: Tipos** — acrescentar ao `comunidade.types.ts` o bloco acima e, em `PostDTO`, os quatro campos novos:
```ts
export interface PostDTO { id: string; dia: string; publicadoEm: Date; autor: AutorDTO; planta: PlantaDTO; fotos: FotoDoPost[]; cuidados: CuidadoDoPost[] | null; curtidas: number; curtiu: boolean; salvou: boolean; totalComentarios: number }
```

- [ ] **Step 2: Testes**

`dominio/interacoes.test.ts`:
```ts
import { deveNotificar, interacoesPorPost, podeApagarComentario } from './interacoes';

describe('deveNotificar', () => {
  it('nunca por ação sobre si mesmo', () => {
    expect(deveNotificar('a', 'b')).toBe(true);
    expect(deveNotificar('a', 'a')).toBe(false);
  });
});

describe('podeApagarComentario', () => {
  it('autor e dono do post podem; outros não', () => {
    expect(podeApagarComentario('autor', 'dono', 'autor')).toBe(true);
    expect(podeApagarComentario('autor', 'dono', 'dono')).toBe(true);
    expect(podeApagarComentario('autor', 'dono', 'outro')).toBe(false);
  });
});

describe('interacoesPorPost', () => {
  it('contagens, curtiu e salvou por post; post sem nada fica zerado', () => {
    const mapa = interacoesPorPost(['p1', 'p2'], {
      curtidas: [{ postId: 'p1', total: 3 }],
      comentarios: [{ postId: 'p1', total: 2 }],
      curtiu: ['p1'],
      salvou: ['p2'],
    });
    expect(mapa.get('p1')).toEqual({ curtidas: 3, comentarios: 2, curtiu: true, salvou: false });
    expect(mapa.get('p2')).toEqual({ curtidas: 0, comentarios: 0, curtiu: false, salvou: true });
  });
});
```

Em `dominio/montar.test.ts`: no teste `'monta o DTO com nome público, planta sem a flag e dia em texto'`, acrescentar ao objeto esperado `curtidas: 0, curtiu: false, salvou: false, totalComentarios: 0,`; e acrescentar:
```ts
describe('montarPosts com interações', () => {
  it('usa as contagens do post', () => {
    const inter = new Map([['post1', { curtidas: 4, comentarios: 1, curtiu: true, salvou: true }]]);
    const [dto] = montarPosts([post()], mapa([[chaveDoDia('p1', '2026-10-10'), doDia]]), 'b', inter);
    expect(dto).toMatchObject({ curtidas: 4, curtiu: true, salvou: true, totalComentarios: 1 });
  });
});

describe('comentarioDe', () => {
  const c = { id: 'c1', texto: 'Lindo!', createdAt: new Date('2026-10-13T12:00:00Z'), usuario, post: { usuarioId: 'dono' } };
  it('autor com nome público e permissão de apagar', () => {
    expect(comentarioDe(c, 'a')).toEqual({ id: 'c1', texto: 'Lindo!', createdAt: c.createdAt, autor: { id: 'a', nome: 'Ana', fotoPerfilUrl: null }, podeApagar: true });
    expect(comentarioDe(c, 'dono').podeApagar).toBe(true);
    expect(comentarioDe(c, 'outro').podeApagar).toBe(false);
  });
});

describe('notificacaoDe', () => {
  it('ator, post com a capa da planta e trecho do comentário', () => {
    const n = {
      id: 'n1', tipo: 'COMENTARIO' as const, lida: false, createdAt: new Date('2026-10-13T12:00:00Z'), ator: usuario,
      post: { id: 'post1', planta: { id: 'p1', fotoCapaUrl: 'capa.webp' } }, comentario: { texto: 'Lindo!' },
    };
    expect(notificacaoDe(n)).toEqual({
      id: 'n1', tipo: 'COMENTARIO', lida: false, createdAt: n.createdAt, ator: { id: 'a', nome: 'Ana', fotoPerfilUrl: null },
      post: { id: 'post1', plantaId: 'p1', capa: 'capa.webp' }, comentario: 'Lindo!',
    });
  });
  it('seguir: sem post e sem comentário', () => {
    const n = { id: 'n2', tipo: 'SEGUIU' as const, lida: true, createdAt: new Date(), ator: usuario, post: null, comentario: null };
    expect(notificacaoDe(n)).toMatchObject({ post: null, comentario: null });
  });
});
```
(import: `import { comentarioDe, linhaDoTempoPublica, montarPosts, notificacaoDe } from './montar';`.)

Em `repositories/filtros.test.ts` (acrescentar `filtroDasNotificacoes, filtroDosComentarios, filtroDosSalvos, visivelPara` ao import):
```ts
describe('filtros das interações', () => {
  const data = new Date('2026-10-13T18:00:00.000Z');
  const id = '6f1b4a8e-2f7a-4c1e-9a4b-3d2e1f0a9b8c';
  const cursor = codificarCursor(data, id);

  it('visivelPara é a mesma regra do feed', () => {
    expect(visivelPara('eu')).toEqual(visivel);
  });
  it('comentários em ordem crescente: depois do cursor = mais novos', () => {
    expect(filtroDosComentarios('post1')).toEqual({ postId: 'post1' });
    expect(filtroDosComentarios('post1', cursor)).toEqual({
      postId: 'post1',
      OR: [{ createdAt: { gt: data } }, { createdAt: data, id: { gt: id } }],
    });
  });
  it('salvos: só os meus de posts ainda visíveis, do mais recente salvo', () => {
    expect(filtroDosSalvos('eu')).toEqual({ usuarioId: 'eu', post: visivel });
    expect(filtroDosSalvos('eu', cursor)).toEqual({
      usuarioId: 'eu',
      post: visivel,
      OR: [{ createdAt: { lt: data } }, { createdAt: data, postId: { lt: id } }],
    });
  });
  it('notificações: só as minhas, das mais novas', () => {
    expect(filtroDasNotificacoes('eu')).toEqual({ usuarioId: 'eu' });
    expect(filtroDasNotificacoes('eu', cursor)).toEqual({
      usuarioId: 'eu',
      OR: [{ createdAt: { lt: data } }, { createdAt: data, id: { lt: id } }],
    });
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `cd server && npx jest comunidade`
Expected: FAIL — `./interacoes` não existe; `comentarioDe`/`notificacaoDe`/filtros não exportados; DTO sem os campos novos.

- [ ] **Step 4: Implementar**

`dominio/interacoes.ts`:
```ts
import type { InteracoesDoPost } from '../comunidade.types';

/** Nunca avisa alguém da própria ação. */
export const deveNotificar = (atorId: string, destinatarioId: string) => atorId !== destinatarioId;

/** O autor apaga o seu comentário; o dono do post apaga qualquer um no post dele. */
export const podeApagarComentario = (autorId: string, donoDoPostId: string, viewerId: string) =>
  viewerId === autorId || viewerId === donoDoPostId;

/** Junta contagens e marcas do leitor por post (post sem nada fica zerado). */
export function interacoesPorPost(
  postIds: string[],
  lidas: { curtidas: { postId: string; total: number }[]; comentarios: { postId: string; total: number }[]; curtiu: string[]; salvou: string[] },
): Map<string, InteracoesDoPost> {
  const total = (lista: { postId: string; total: number }[], id: string) => lista.find((x) => x.postId === id)?.total ?? 0;
  const curtiu = new Set(lidas.curtiu);
  const salvou = new Set(lidas.salvou);
  return new Map(
    postIds.map((id) => [id, { curtidas: total(lidas.curtidas, id), comentarios: total(lidas.comentarios, id), curtiu: curtiu.has(id), salvou: salvou.has(id) }]),
  );
}
```

`dominio/montar.ts`:
- imports: `import { podeApagarComentario } from './interacoes';` e, no `import type`, acrescentar `ComentarioDTO, ComentarioLido, InteracoesDoPost, NotificacaoDTO, NotificacaoLida`.
- assinatura: `export function montarPosts(posts: PostLido[], conteudo: Map<string, ConteudoDoDia>, viewerId: string, interacoes: Map<string, InteracoesDoPost> = new Map()): PostDTO[]` e, dentro do `flatMap`, `const i = interacoes.get(p.id);` e no objeto, depois de `cuidados`:
```ts
        curtidas: i?.curtidas ?? 0,
        curtiu: i?.curtiu ?? false,
        salvou: i?.salvou ?? false,
        totalComentarios: i?.comentarios ?? 0,
```
- ao fim:
```ts
export const comentarioDe = (c: ComentarioLido, viewerId: string): ComentarioDTO => ({
  id: c.id,
  texto: c.texto,
  createdAt: c.createdAt,
  autor: autorDe(c.usuario),
  podeApagar: podeApagarComentario(c.usuario.id, c.post.usuarioId, viewerId),
});

export const notificacaoDe = (n: NotificacaoLida): NotificacaoDTO => ({
  id: n.id,
  tipo: n.tipo,
  lida: n.lida,
  createdAt: n.createdAt,
  ator: autorDe(n.ator),
  post: n.post ? { id: n.post.id, plantaId: n.post.planta.id, capa: n.post.planta.fotoCapaUrl } : null,
  comentario: n.comentario?.texto ?? null,
});
```

`repositories/filtros.ts`:
- Trocar a primeira condição de `filtroDoFeed` por `visivelPara(viewerId)` e acrescentar:
```ts
/** Post visível ao leitor: meu, ou de perfil e planta públicos. */
export const visivelPara = (viewerId: string): Prisma.PostWhereInput => ({
  OR: [{ usuarioId: viewerId }, { usuario: { perfilPublico: true }, planta: { plantaPublica: true } }],
});

/** Comentários do post em ordem crescente (createdAt, id): depois do cursor = mais novos. */
export function filtroDosComentarios(postId: string, cursor?: string): Prisma.ComentarioWhereInput {
  if (!cursor) return { postId };
  const c = lerCursor(cursor);
  return { postId, OR: [{ createdAt: { gt: c.data } }, { createdAt: c.data, id: { gt: c.id } }] };
}

/** Meus salvos de posts ainda visíveis, do mais recente salvo (createdAt, postId desc). */
export function filtroDosSalvos(viewerId: string, cursor?: string): Prisma.SalvoWhereInput {
  const base: Prisma.SalvoWhereInput = { usuarioId: viewerId, post: visivelPara(viewerId) };
  if (!cursor) return base;
  const c = lerCursor(cursor);
  return { ...base, OR: [{ createdAt: { lt: c.data } }, { createdAt: c.data, postId: { lt: c.id } }] };
}

/** Minhas notificações, das mais novas (createdAt, id desc). */
export function filtroDasNotificacoes(usuarioId: string, cursor?: string): Prisma.NotificacaoWhereInput {
  if (!cursor) return { usuarioId };
  const c = lerCursor(cursor);
  return { usuarioId, OR: [{ createdAt: { lt: c.data } }, { createdAt: c.data, id: { lt: c.id } }] };
}
```

- [ ] **Step 5: Rodar**

Run: `cd server && npx jest comunidade && npx tsc --noEmit -p tsconfig.json`
Expected: PASS nos testes desta task. (O `tsc` pode acusar os testes de casos de uso por `PostDTO` sem os campos novos — eles são ajustados na Task 3; se acusar só isso, seguir.)

- [ ] **Step 6: Commit**

```bash
git add server/src/modules/comunidade
git commit -m "feat(server): regras e filtros de curtidas, comentários, salvos e notificações"
```

---

### Task 3: Repositórios das interações e contagens nos posts

**Files:**
- Modify: `server/src/modules/comunidade/comunidade.types.ts` (interfaces), `repositories/prisma-leitura.repository.ts`, `use-cases/carregar-posts.ts`, `use-cases/leitura.use-cases.test.ts`
- Create: `server/src/modules/comunidade/repositories/prisma-interacoes.repository.ts`

**Interfaces:**
- Consumes: Task 2.
- Produces:
```ts
// LeituraComunidadeRepository ganha:
interacoes(postIds: string[], viewerId: string): Promise<Map<string, InteracoesDoPost>>;
comentarios(postId: string, cursor: string | undefined, limite: number): Promise<ComentarioLido[]>;
salvos(viewerId: string, cursor: string | undefined, limite: number): Promise<{ createdAt: Date; post: PostLido }[]>;
notificacoes(usuarioId: string, cursor: string | undefined, limite: number): Promise<NotificacaoLida[]>;
naoLidas(usuarioId: string): Promise<number>;

export interface NovaNotificacao { usuarioId: string; atorId: string; tipo: TipoNotificacao; postId?: string; comentarioId?: string }
export interface InteracoesRepository {
  /** true = curtida nova (não existia). */
  curtir(usuarioId: string, postId: string): Promise<boolean>;
  /** true = havia curtida e foi removida. */
  descurtir(usuarioId: string, postId: string): Promise<boolean>;
  totalCurtidas(postId: string): Promise<number>;
  salvar(usuarioId: string, postId: string): Promise<void>;
  dessalvar(usuarioId: string, postId: string): Promise<void>;
  comentar(usuarioId: string, postId: string, texto: string): Promise<ComentarioLido>;
  comentario(id: string): Promise<{ id: string; usuarioId: string; post: { usuarioId: string } } | null>;
  apagarComentario(id: string): Promise<void>;
  notificar(n: NovaNotificacao): Promise<void>;
  removerNotificacoes(n: Omit<NovaNotificacao, 'comentarioId'>): Promise<void>;
  marcarLidas(usuarioId: string): Promise<void>;
}
```
  - `carregarPosts` passa `await repo.interacoes(ids, viewerId)` para `montarPosts`.

- [ ] **Step 1: Ajustar o teste existente para a nova dependência**

Em `use-cases/leitura.use-cases.test.ts`, no `beforeEach`, acrescentar ao `repo`:
```ts
    interacoes: jest.fn().mockResolvedValue(new Map()),
    comentarios: jest.fn().mockResolvedValue([]),
    salvos: jest.fn().mockResolvedValue([]),
    notificacoes: jest.fn().mockResolvedValue([]),
    naoLidas: jest.fn().mockResolvedValue(0),
```
e, no teste `'monta os posts com o conteúdo das plantas da página'`, acrescentar:
```ts
    expect(repo.interacoes).toHaveBeenCalledWith(['post1'], 'b');
```
e no teste `'post visível volta montado'`:
```ts
    repo.interacoes.mockResolvedValue(new Map([['post1', { curtidas: 2, comentarios: 1, curtiu: true, salvou: false }]]));
```
(antes do `execute`) com `expect(dto).toMatchObject({ curtidas: 2, curtiu: true, totalComentarios: 1 });` depois.

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd server && npx jest leitura.use-cases`
Expected: FAIL — `interacoes` não está em `LeituraComunidadeRepository` / não é chamado.

- [ ] **Step 3: Interfaces e `carregarPosts`**

Acrescentar as interfaces do "Produces" ao `comunidade.types.ts` (os cinco métodos dentro de `LeituraComunidadeRepository`; `NovaNotificacao` e `InteracoesRepository` ao fim).

`carregar-posts.ts`:
```ts
  const { fotos, cuidados } = await repo.conteudo([...new Set(posts.map((p) => p.plantaId))], janelaDosPosts(posts));
  const interacoes = await repo.interacoes(posts.map((p) => p.id), viewerId);
  return montarPosts(posts, conteudoPorDia(fotos, cuidados), viewerId, interacoes);
```

- [ ] **Step 4: Repositório de leitura**

Em `prisma-leitura.repository.ts` (importar `filtroDasNotificacoes, filtroDosComentarios, filtroDosSalvos` de `./filtros` e `interacoesPorPost` de `../dominio/interacoes`):
```ts
const comentarioLido = { id: true, texto: true, createdAt: true, usuario: { select: usuarioLido }, post: { select: { usuarioId: true } } } as const;
```
(junto das outras constantes) e os métodos:
```ts
  // Em sequência (não Promise.all), como o resto do projeto
  async interacoes(postIds: string[], viewerId: string) {
    const onde = { postId: { in: postIds } };
    const curtidas = await prisma.curtida.groupBy({ by: ['postId'], where: onde, _count: { _all: true } });
    const comentarios = await prisma.comentario.groupBy({ by: ['postId'], where: onde, _count: { _all: true } });
    const minhasCurtidas = await prisma.curtida.findMany({ where: { ...onde, usuarioId: viewerId }, select: { postId: true } });
    const meusSalvos = await prisma.salvo.findMany({ where: { ...onde, usuarioId: viewerId }, select: { postId: true } });
    return interacoesPorPost(postIds, {
      curtidas: curtidas.map((c) => ({ postId: c.postId, total: c._count._all })),
      comentarios: comentarios.map((c) => ({ postId: c.postId, total: c._count._all })),
      curtiu: minhasCurtidas.map((c) => c.postId),
      salvou: meusSalvos.map((s) => s.postId),
    });
  }

  comentarios(postId: string, cursor: string | undefined, limite: number) {
    return prisma.comentario.findMany({
      where: filtroDosComentarios(postId, cursor),
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: limite,
      select: comentarioLido,
    });
  }

  salvos(viewerId: string, cursor: string | undefined, limite: number) {
    return prisma.salvo.findMany({
      where: filtroDosSalvos(viewerId, cursor),
      orderBy: [{ createdAt: 'desc' }, { postId: 'desc' }],
      take: limite,
      select: { createdAt: true, post: { select: postLido } },
    });
  }

  notificacoes(usuarioId: string, cursor: string | undefined, limite: number) {
    return prisma.notificacao.findMany({
      where: filtroDasNotificacoes(usuarioId, cursor),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limite,
      select: {
        id: true,
        tipo: true,
        lida: true,
        createdAt: true,
        ator: { select: usuarioLido },
        post: { select: { id: true, planta: { select: { id: true, fotoCapaUrl: true } } } },
        comentario: { select: { texto: true } },
      },
    });
  }

  naoLidas(usuarioId: string) {
    return prisma.notificacao.count({ where: { usuarioId, lida: false } });
  }
```

- [ ] **Step 5: Repositório de escrita**

`repositories/prisma-interacoes.repository.ts`:
```ts
import { prisma } from '../../../lib/prisma';
import type { InteracoesRepository, NovaNotificacao } from '../comunidade.types';

const usuarioLido = { id: true, nome: true, nomePublico: true, fotoPerfilUrl: true, perfilPublico: true, historicoPublico: true } as const;

export class PrismaInteracoesRepository implements InteracoesRepository {
  async curtir(usuarioId: string, postId: string) {
    const { count } = await prisma.curtida.createMany({ data: [{ usuarioId, postId }], skipDuplicates: true });
    return count > 0;
  }

  async descurtir(usuarioId: string, postId: string) {
    const { count } = await prisma.curtida.deleteMany({ where: { usuarioId, postId } });
    return count > 0;
  }

  totalCurtidas(postId: string) {
    return prisma.curtida.count({ where: { postId } });
  }

  async salvar(usuarioId: string, postId: string) {
    await prisma.salvo.createMany({ data: [{ usuarioId, postId }], skipDuplicates: true });
  }

  async dessalvar(usuarioId: string, postId: string) {
    await prisma.salvo.deleteMany({ where: { usuarioId, postId } });
  }

  comentar(usuarioId: string, postId: string, texto: string) {
    return prisma.comentario.create({
      data: { usuarioId, postId, texto },
      select: { id: true, texto: true, createdAt: true, usuario: { select: usuarioLido }, post: { select: { usuarioId: true } } },
    });
  }

  comentario(id: string) {
    return prisma.comentario.findUnique({ where: { id }, select: { id: true, usuarioId: true, post: { select: { usuarioId: true } } } });
  }

  async apagarComentario(id: string) {
    // A notificação COMENTARIO cai junto (cascata pelo comentarioId)
    await prisma.comentario.deleteMany({ where: { id } });
  }

  async notificar(n: NovaNotificacao) {
    await prisma.notificacao.create({ data: n });
  }

  async removerNotificacoes(n: Omit<NovaNotificacao, 'comentarioId'>) {
    await prisma.notificacao.deleteMany({ where: n });
  }

  async marcarLidas(usuarioId: string) {
    await prisma.notificacao.updateMany({ where: { usuarioId, lida: false }, data: { lida: true } });
  }
}
```

- [ ] **Step 6: Rodar**

Run: `cd server && npm test && npx tsc --noEmit -p tsconfig.json`
Expected: PASS, sem erros de tipo.

- [ ] **Step 7: Commit**

```bash
git add server/src/modules/comunidade
git commit -m "feat(server): leitura e escrita de curtidas, comentários, salvos e notificações"
```

---

### Task 4: Casos de uso das interações

**Files:**
- Create: `server/src/modules/comunidade/use-cases/{curtir-post,salvar-post,comentar,apagar-comentario,listar-comentarios,listar-salvos,listar-notificacoes,contar-nao-lidas,marcar-lidas}.use-case.ts`
- Modify: `server/src/modules/comunidade/use-cases/carregar-posts.ts` (`postVisivel`)
- Test: `server/src/modules/comunidade/use-cases/interacoes.use-cases.test.ts`

**Interfaces:**
- Consumes: Tasks 2–3.
- Produces:
  - `postVisivel(repo: LeituraComunidadeRepository, viewerId: string, id: string): Promise<PostLido>` (lança `NaoEncontrado('Post não encontrado.')`)
  - `CurtirPostUseCase(leitura, repo).execute(viewerId, postId, curtir: boolean): Promise<{ curtiu: boolean; curtidas: number }>`
  - `SalvarPostUseCase(leitura, repo).execute(viewerId, postId, salvar: boolean): Promise<{ salvou: boolean }>`
  - `ComentarUseCase(leitura, repo).execute(viewerId, postId, texto): Promise<ComentarioDTO>`
  - `ApagarComentarioUseCase(repo).execute(viewerId, comentarioId): Promise<void>`
  - `ListarComentariosUseCase(leitura).execute(viewerId, postId, cursor?): Promise<PaginaDTO<ComentarioDTO>>` (`LIMITE_COMENTARIOS = 30`)
  - `ListarSalvosUseCase(leitura).execute(viewerId, cursor?): Promise<PaginaDTO<PostDTO>>`
  - `ListarNotificacoesUseCase(leitura).execute(viewerId, cursor?): Promise<PaginaDTO<NotificacaoDTO>>`
  - `ContarNaoLidasUseCase(leitura).execute(viewerId): Promise<{ total: number }>`
  - `MarcarLidasUseCase(repo).execute(viewerId): Promise<void>`

- [ ] **Step 1: Testes**

`use-cases/interacoes.use-cases.test.ts`:
```ts
import { ApagarComentarioUseCase } from './apagar-comentario.use-case';
import { ComentarUseCase } from './comentar.use-case';
import { ContarNaoLidasUseCase } from './contar-nao-lidas.use-case';
import { CurtirPostUseCase } from './curtir-post.use-case';
import { ListarComentariosUseCase } from './listar-comentarios.use-case';
import { ListarNotificacoesUseCase } from './listar-notificacoes.use-case';
import { ListarSalvosUseCase } from './listar-salvos.use-case';
import { MarcarLidasUseCase } from './marcar-lidas.use-case';
import { SalvarPostUseCase } from './salvar-post.use-case';
import { codificarCursor } from '../repositories/filtros';
import { InteracoesRepository, LeituraComunidadeRepository, PostLido } from '../comunidade.types';

const dono = { id: 'dono', nome: 'Dona', nomePublico: null, fotoPerfilUrl: null, perfilPublico: true, historicoPublico: true };
const leitor = { ...dono, id: 'b', nome: 'Bia' };
const planta = { id: 'p1', identificador: 1, nome: null, fotoCapaUrl: null, plantaPublica: true, especie: null };
const post = (over: Partial<PostLido> = {}): PostLido => ({
  id: 'post1',
  dia: new Date('2026-10-10T00:00:00Z'),
  publicadoEm: new Date('2026-10-10T18:00:00Z'),
  plantaId: 'p1',
  usuario: dono,
  planta,
  ...over,
});
const comentarioLido = { id: 'c1', texto: 'Lindo!', createdAt: new Date('2026-10-13T12:00:00Z'), usuario: leitor, post: { usuarioId: 'dono' } };

let leitura: jest.Mocked<LeituraComunidadeRepository>;
let repo: jest.Mocked<InteracoesRepository>;
beforeEach(() => {
  leitura = {
    feed: jest.fn(),
    post: jest.fn().mockResolvedValue(post()),
    postsDoUsuario: jest.fn(),
    conteudo: jest.fn().mockResolvedValue({
      fotos: [{ id: 'f1', plantaId: 'p1', caminhoArquivo: 'u', thumbnailUrl: null, tipo: 'FOTO', dataCaptura: null, createdAt: new Date('2026-10-10T15:00:00Z'), agenda: null }],
      cuidados: [],
    }),
    perfil: jest.fn(),
    plantasPublicas: jest.fn(),
    planta: jest.fn(),
    buscar: jest.fn(),
    interacoes: jest.fn().mockResolvedValue(new Map()),
    comentarios: jest.fn().mockResolvedValue([]),
    salvos: jest.fn().mockResolvedValue([]),
    notificacoes: jest.fn().mockResolvedValue([]),
    naoLidas: jest.fn().mockResolvedValue(0),
  };
  repo = {
    curtir: jest.fn().mockResolvedValue(true),
    descurtir: jest.fn().mockResolvedValue(true),
    totalCurtidas: jest.fn().mockResolvedValue(1),
    salvar: jest.fn().mockResolvedValue(undefined),
    dessalvar: jest.fn().mockResolvedValue(undefined),
    comentar: jest.fn().mockResolvedValue(comentarioLido),
    comentario: jest.fn().mockResolvedValue({ id: 'c1', usuarioId: 'b', post: { usuarioId: 'dono' } }),
    apagarComentario: jest.fn().mockResolvedValue(undefined),
    notificar: jest.fn().mockResolvedValue(undefined),
    removerNotificacoes: jest.fn().mockResolvedValue(undefined),
    marcarLidas: jest.fn().mockResolvedValue(undefined),
  };
});

describe('CurtirPostUseCase', () => {
  it('curtida nova avisa o dono e devolve a contagem do servidor', async () => {
    const r = await new CurtirPostUseCase(leitura, repo).execute('b', 'post1', true);
    expect(repo.curtir).toHaveBeenCalledWith('b', 'post1');
    expect(repo.notificar).toHaveBeenCalledWith({ usuarioId: 'dono', atorId: 'b', tipo: 'CURTIDA', postId: 'post1' });
    expect(r).toEqual({ curtiu: true, curtidas: 1 });
  });
  it('curtir de novo (toque duplo) não avisa outra vez', async () => {
    repo.curtir.mockResolvedValue(false);
    await new CurtirPostUseCase(leitura, repo).execute('b', 'post1', true);
    expect(repo.notificar).not.toHaveBeenCalled();
  });
  it('curtir o próprio post não avisa', async () => {
    await new CurtirPostUseCase(leitura, repo).execute('dono', 'post1', true);
    expect(repo.notificar).not.toHaveBeenCalled();
  });
  it('descurtir remove o aviso', async () => {
    repo.totalCurtidas.mockResolvedValue(0);
    const r = await new CurtirPostUseCase(leitura, repo).execute('b', 'post1', false);
    expect(repo.removerNotificacoes).toHaveBeenCalledWith({ usuarioId: 'dono', atorId: 'b', tipo: 'CURTIDA', postId: 'post1' });
    expect(r).toEqual({ curtiu: false, curtidas: 0 });
  });
  it('post invisível: 404 sem gravar', async () => {
    leitura.post.mockResolvedValue(post({ usuario: { ...dono, perfilPublico: false } }));
    await expect(new CurtirPostUseCase(leitura, repo).execute('b', 'post1', true)).rejects.toThrow('Post não encontrado.');
    expect(repo.curtir).not.toHaveBeenCalled();
  });
});

describe('SalvarPostUseCase', () => {
  it('salva e tira dos salvos', async () => {
    expect(await new SalvarPostUseCase(leitura, repo).execute('b', 'post1', true)).toEqual({ salvou: true });
    expect(repo.salvar).toHaveBeenCalledWith('b', 'post1');
    expect(await new SalvarPostUseCase(leitura, repo).execute('b', 'post1', false)).toEqual({ salvou: false });
    expect(repo.dessalvar).toHaveBeenCalledWith('b', 'post1');
  });
  it('não salva post invisível', async () => {
    leitura.post.mockResolvedValue(null);
    await expect(new SalvarPostUseCase(leitura, repo).execute('b', 'x', true)).rejects.toMatchObject({ name: 'NaoEncontrado' });
  });
});

describe('ComentarUseCase', () => {
  it('grava, avisa o dono com o comentário e devolve o DTO', async () => {
    const c = await new ComentarUseCase(leitura, repo).execute('b', 'post1', 'Lindo!');
    expect(repo.comentar).toHaveBeenCalledWith('b', 'post1', 'Lindo!');
    expect(repo.notificar).toHaveBeenCalledWith({ usuarioId: 'dono', atorId: 'b', tipo: 'COMENTARIO', postId: 'post1', comentarioId: 'c1' });
    expect(c).toMatchObject({ id: 'c1', texto: 'Lindo!', podeApagar: true });
  });
  it('comentar no próprio post não avisa', async () => {
    repo.comentar.mockResolvedValue({ ...comentarioLido, usuario: dono });
    await new ComentarUseCase(leitura, repo).execute('dono', 'post1', 'Obrigada');
    expect(repo.notificar).not.toHaveBeenCalled();
  });
  it('post invisível: 404', async () => {
    leitura.post.mockResolvedValue(post({ planta: { ...planta, plantaPublica: false } }));
    await expect(new ComentarUseCase(leitura, repo).execute('b', 'post1', 'oi')).rejects.toThrow('Post não encontrado.');
    expect(repo.comentar).not.toHaveBeenCalled();
  });
});

describe('ApagarComentarioUseCase', () => {
  it('autor apaga o seu; dono do post apaga qualquer um', async () => {
    await new ApagarComentarioUseCase(repo).execute('b', 'c1');
    await new ApagarComentarioUseCase(repo).execute('dono', 'c1');
    expect(repo.apagarComentario).toHaveBeenCalledTimes(2);
  });
  it('outra pessoa: 404 sem apagar', async () => {
    await expect(new ApagarComentarioUseCase(repo).execute('outro', 'c1')).rejects.toThrow('Comentário não encontrado.');
    expect(repo.apagarComentario).not.toHaveBeenCalled();
  });
  it('comentário que não existe: 404', async () => {
    repo.comentario.mockResolvedValue(null);
    await expect(new ApagarComentarioUseCase(repo).execute('b', 'x')).rejects.toMatchObject({ name: 'NaoEncontrado' });
  });
});

describe('ListarComentariosUseCase', () => {
  it('lista do post visível com permissão por comentário', async () => {
    leitura.comentarios.mockResolvedValue([comentarioLido]);
    const r = await new ListarComentariosUseCase(leitura).execute('outro', 'post1');
    expect(leitura.comentarios).toHaveBeenCalledWith('post1', undefined, 30);
    expect(r.itens[0]).toMatchObject({ id: 'c1', podeApagar: false });
    expect(r.proximoCursor).toBeNull();
  });
  it('página cheia devolve cursor pela posição do último', async () => {
    leitura.comentarios.mockResolvedValue(Array.from({ length: 30 }, (_, i) => ({ ...comentarioLido, id: `c${i}` })));
    const r = await new ListarComentariosUseCase(leitura).execute('b', 'post1');
    expect(r.proximoCursor).toBe(codificarCursor(comentarioLido.createdAt, 'c29'));
  });
  it('post invisível: 404', async () => {
    leitura.post.mockResolvedValue(null);
    await expect(new ListarComentariosUseCase(leitura).execute('b', 'x')).rejects.toMatchObject({ name: 'NaoEncontrado' });
  });
});

describe('ListarSalvosUseCase', () => {
  it('monta os posts salvos e pagina pela data do salvo', async () => {
    const salvoEm = new Date('2026-10-13T20:00:00Z');
    leitura.salvos.mockResolvedValue(Array.from({ length: 20 }, (_, i) => ({ createdAt: salvoEm, post: post({ id: `post${i}` }) })));
    const r = await new ListarSalvosUseCase(leitura).execute('b');
    expect(leitura.salvos).toHaveBeenCalledWith('b', undefined, 20);
    expect(r.itens).toHaveLength(20);
    expect(r.proximoCursor).toBe(codificarCursor(salvoEm, 'post19'));
  });
});

describe('notificações', () => {
  it('lista montada, conta não lidas e marca como lidas', async () => {
    const n = { id: 'n1', tipo: 'SEGUIU' as const, lida: false, createdAt: new Date('2026-10-13T12:00:00Z'), ator: leitor, post: null, comentario: null };
    leitura.notificacoes.mockResolvedValue([n]);
    leitura.naoLidas.mockResolvedValue(3);
    const r = await new ListarNotificacoesUseCase(leitura).execute('dono');
    expect(leitura.notificacoes).toHaveBeenCalledWith('dono', undefined, 20);
    expect(r.itens[0]).toMatchObject({ id: 'n1', tipo: 'SEGUIU', ator: { id: 'b', nome: 'Bia' } });
    expect(await new ContarNaoLidasUseCase(leitura).execute('dono')).toEqual({ total: 3 });
    await new MarcarLidasUseCase(repo).execute('dono');
    expect(repo.marcarLidas).toHaveBeenCalledWith('dono');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd server && npx jest interacoes.use-cases`
Expected: FAIL — módulos não existem.

- [ ] **Step 3: Implementar**

`carregar-posts.ts`, acrescentar (imports: `podeVer` de `../dominio/visibilidade`, `NaoEncontrado` de `../comunidade.types` — trocar o `import type` por import normal com `NaoEncontrado`):
```ts
/** O post, se o leitor pode vê-lo; senão 404 (não revela que existe). */
export async function postVisivel(repo: LeituraComunidadeRepository, viewerId: string, id: string): Promise<PostLido> {
  const post = await repo.post(id);
  if (!post || !podeVer(post.usuario, post.planta.plantaPublica, viewerId)) throw new NaoEncontrado('Post não encontrado.');
  return post;
}
```

`curtir-post.use-case.ts`:
```ts
import { postVisivel } from './carregar-posts';
import { deveNotificar } from '../dominio/interacoes';
import type { InteracoesRepository, LeituraComunidadeRepository } from '../comunidade.types';

export class CurtirPostUseCase {
  constructor(
    private leitura: LeituraComunidadeRepository,
    private repo: InteracoesRepository,
  ) {}

  /** Idempotente: só avisa o dono quando a curtida é nova; descurtir apaga o aviso. */
  async execute(viewerId: string, postId: string, curtir: boolean): Promise<{ curtiu: boolean; curtidas: number }> {
    const post = await postVisivel(this.leitura, viewerId, postId);
    const aviso = { usuarioId: post.usuario.id, atorId: viewerId, tipo: 'CURTIDA' as const, postId };
    if (curtir) {
      if ((await this.repo.curtir(viewerId, postId)) && deveNotificar(viewerId, post.usuario.id)) await this.repo.notificar(aviso);
    } else if (await this.repo.descurtir(viewerId, postId)) {
      await this.repo.removerNotificacoes(aviso);
    }
    return { curtiu: curtir, curtidas: await this.repo.totalCurtidas(postId) };
  }
}
```

`salvar-post.use-case.ts`:
```ts
import { postVisivel } from './carregar-posts';
import type { InteracoesRepository, LeituraComunidadeRepository } from '../comunidade.types';

export class SalvarPostUseCase {
  constructor(
    private leitura: LeituraComunidadeRepository,
    private repo: InteracoesRepository,
  ) {}

  async execute(viewerId: string, postId: string, salvar: boolean): Promise<{ salvou: boolean }> {
    await postVisivel(this.leitura, viewerId, postId);
    if (salvar) await this.repo.salvar(viewerId, postId);
    else await this.repo.dessalvar(viewerId, postId);
    return { salvou: salvar };
  }
}
```

`comentar.use-case.ts`:
```ts
import { postVisivel } from './carregar-posts';
import { deveNotificar } from '../dominio/interacoes';
import { comentarioDe } from '../dominio/montar';
import type { ComentarioDTO, InteracoesRepository, LeituraComunidadeRepository } from '../comunidade.types';

export class ComentarUseCase {
  constructor(
    private leitura: LeituraComunidadeRepository,
    private repo: InteracoesRepository,
  ) {}

  /** O texto já vem validado (1–1000, sem espaços nas pontas) pelo schema. */
  async execute(viewerId: string, postId: string, texto: string): Promise<ComentarioDTO> {
    const post = await postVisivel(this.leitura, viewerId, postId);
    const comentario = await this.repo.comentar(viewerId, postId, texto);
    if (deveNotificar(viewerId, post.usuario.id)) {
      await this.repo.notificar({ usuarioId: post.usuario.id, atorId: viewerId, tipo: 'COMENTARIO', postId, comentarioId: comentario.id });
    }
    return comentarioDe(comentario, viewerId);
  }
}
```

`apagar-comentario.use-case.ts`:
```ts
import { podeApagarComentario } from '../dominio/interacoes';
import { InteracoesRepository, NaoEncontrado } from '../comunidade.types';

export class ApagarComentarioUseCase {
  constructor(private repo: InteracoesRepository) {}

  async execute(viewerId: string, comentarioId: string): Promise<void> {
    const c = await this.repo.comentario(comentarioId);
    if (!c || !podeApagarComentario(c.usuarioId, c.post.usuarioId, viewerId)) throw new NaoEncontrado('Comentário não encontrado.');
    await this.repo.apagarComentario(comentarioId);
  }
}
```

`listar-comentarios.use-case.ts`:
```ts
import { postVisivel } from './carregar-posts';
import { comentarioDe } from '../dominio/montar';
import { codificarCursor } from '../repositories/filtros';
import type { ComentarioDTO, LeituraComunidadeRepository, PaginaDTO } from '../comunidade.types';

export const LIMITE_COMENTARIOS = 30;

export class ListarComentariosUseCase {
  constructor(private leitura: LeituraComunidadeRepository) {}

  async execute(viewerId: string, postId: string, cursor?: string): Promise<PaginaDTO<ComentarioDTO>> {
    await postVisivel(this.leitura, viewerId, postId);
    const lidos = await this.leitura.comentarios(postId, cursor, LIMITE_COMENTARIOS);
    const ultimo = lidos[lidos.length - 1];
    return {
      itens: lidos.map((c) => comentarioDe(c, viewerId)),
      proximoCursor: lidos.length === LIMITE_COMENTARIOS ? codificarCursor(ultimo.createdAt, ultimo.id) : null,
    };
  }
}
```

`listar-salvos.use-case.ts`:
```ts
import { carregarPosts, LIMITE_PAGINA } from './carregar-posts';
import { codificarCursor } from '../repositories/filtros';
import type { LeituraComunidadeRepository, PaginaDTO, PostDTO } from '../comunidade.types';

export class ListarSalvosUseCase {
  constructor(private leitura: LeituraComunidadeRepository) {}

  async execute(viewerId: string, cursor?: string): Promise<PaginaDTO<PostDTO>> {
    const lidos = await this.leitura.salvos(viewerId, cursor, LIMITE_PAGINA);
    const ultimo = lidos[lidos.length - 1];
    return {
      itens: await carregarPosts(this.leitura, lidos.map((s) => s.post), viewerId),
      proximoCursor: lidos.length === LIMITE_PAGINA ? codificarCursor(ultimo.createdAt, ultimo.post.id) : null,
    };
  }
}
```

`listar-notificacoes.use-case.ts`:
```ts
import { LIMITE_PAGINA } from './carregar-posts';
import { notificacaoDe } from '../dominio/montar';
import { codificarCursor } from '../repositories/filtros';
import type { LeituraComunidadeRepository, NotificacaoDTO, PaginaDTO } from '../comunidade.types';

export class ListarNotificacoesUseCase {
  constructor(private leitura: LeituraComunidadeRepository) {}

  async execute(viewerId: string, cursor?: string): Promise<PaginaDTO<NotificacaoDTO>> {
    const lidas = await this.leitura.notificacoes(viewerId, cursor, LIMITE_PAGINA);
    const ultima = lidas[lidas.length - 1];
    return {
      itens: lidas.map(notificacaoDe),
      proximoCursor: lidas.length === LIMITE_PAGINA ? codificarCursor(ultima.createdAt, ultima.id) : null,
    };
  }
}
```

`contar-nao-lidas.use-case.ts`:
```ts
import type { LeituraComunidadeRepository } from '../comunidade.types';

export class ContarNaoLidasUseCase {
  constructor(private leitura: LeituraComunidadeRepository) {}

  async execute(viewerId: string): Promise<{ total: number }> {
    return { total: await this.leitura.naoLidas(viewerId) };
  }
}
```

`marcar-lidas.use-case.ts`:
```ts
import type { InteracoesRepository } from '../comunidade.types';

export class MarcarLidasUseCase {
  constructor(private repo: InteracoesRepository) {}

  async execute(viewerId: string): Promise<void> {
    await this.repo.marcarLidas(viewerId);
  }
}
```

- [ ] **Step 4: Rodar**

Run: `cd server && npm test && npx tsc --noEmit -p tsconfig.json`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/comunidade/use-cases
git commit -m "feat(server): casos de uso de curtir, comentar, salvar e notificações"
```

---

### Task 5: Seguir e deixar de seguir avisam a Comunidade

**Files:**
- Modify: `server/src/modules/amizade/amizade.types.ts`, `use-cases/follow-user.use-case.ts`, `use-cases/unfollow-user.use-case.ts`, `amizade.controller.ts`
- Test: `server/src/modules/amizade/use-cases/follow-user.use-case.test.ts`, `unfollow-user.use-case.test.ts`
- Create: `server/src/modules/comunidade/avisos.ts`

**Interfaces:**
- Consumes: `PrismaInteracoesRepository` (Task 3).
- Produces: `interface AvisoDeSeguir { seguiu(seguidorId: string, seguidoId: string): Promise<void>; deixouDeSeguir(seguidorId: string, seguidoId: string): Promise<void> }` (em `amizade.types.ts`); `FollowUserUseCase(repo, aviso)`, `UnfollowUserUseCase(repo, aviso)`; `criarAvisoDeSeguir(): AvisoDeSeguir`.

- [ ] **Step 1: Testes**

Em `follow-user.use-case.test.ts`: declarar `let aviso: { seguiu: jest.Mock; deixouDeSeguir: jest.Mock };`, no `beforeEach` `aviso = { seguiu: jest.fn().mockResolvedValue(undefined), deixouDeSeguir: jest.fn() };` e construir `new FollowUserUseCase(mockAmizadeRepository, aviso)`. Acrescentar:
```ts
  it('avisa quem foi seguido', async () => {
    mockAmizadeRepository.existsAmizade.mockResolvedValue(false);
    mockAmizadeRepository.follow.mockResolvedValue({ seguidorId: 'user1', seguidoId: 'user2' });

    await followUserUseCase.execute({ seguidorId: 'user1', seguidoId: 'user2' });

    expect(aviso.seguiu).toHaveBeenCalledWith('user1', 'user2');
  });

  it('não avisa quando não chegou a seguir (perfil privado)', async () => {
    mockAmizadeRepository.perfilPublico.mockResolvedValue(false);
    await expect(followUserUseCase.execute({ seguidorId: 'user1', seguidoId: 'user2' })).rejects.toThrow();
    expect(aviso.seguiu).not.toHaveBeenCalled();
  });
```
Em `unfollow-user.use-case.test.ts`: mesmo `aviso`, construir `new UnfollowUserUseCase(mockAmizadeRepository, aviso)` e acrescentar:
```ts
  it('tira o aviso de "começou a seguir"', async () => {
    mockAmizadeRepository.existsAmizade.mockResolvedValue(true);
    mockAmizadeRepository.unfollow.mockResolvedValue(undefined);

    await unfollowUserUseCase.execute({ seguidorId: 'user1', seguidoId: 'user2' });

    expect(aviso.deixouDeSeguir).toHaveBeenCalledWith('user1', 'user2');
  });
```
(usar o nome da variável do caso de uso que o arquivo já declara.)

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd server && npx jest amizade`
Expected: FAIL — construtores com 1 argumento.

- [ ] **Step 3: Implementar**

`amizade.types.ts`, ao fim:
```ts
/** Quem cuida dos avisos da Comunidade quando alguém segue / deixa de seguir. */
export interface AvisoDeSeguir {
  seguiu(seguidorId: string, seguidoId: string): Promise<void>;
  deixouDeSeguir(seguidorId: string, seguidoId: string): Promise<void>;
}
```
`follow-user.use-case.ts`: construtor `constructor(private amizadeRepository: AmizadeRepository, private aviso: AvisoDeSeguir) {}` (importar `AvisoDeSeguir`) e trocar o `return await this.amizadeRepository.follow(data);` por:
```ts
    const amizade = await this.amizadeRepository.follow(data);
    await this.aviso.seguiu(seguidorId, seguidoId);
    return amizade;
```
`unfollow-user.use-case.ts`: construtor com `private aviso: AvisoDeSeguir` e, depois de `await this.amizadeRepository.unfollow(data);`, `await this.aviso.deixouDeSeguir(seguidorId, seguidoId);`.

`server/src/modules/comunidade/avisos.ts`:
```ts
import type { AvisoDeSeguir } from '../amizade/amizade.types';
import { PrismaInteracoesRepository } from './repositories/prisma-interacoes.repository';

/** Avisos de "começou a seguir você" (seguir a si mesmo já é barrado antes). */
export function criarAvisoDeSeguir(): AvisoDeSeguir {
  const repo = new PrismaInteracoesRepository();
  return {
    seguiu: (seguidorId, seguidoId) => repo.notificar({ usuarioId: seguidoId, atorId: seguidorId, tipo: 'SEGUIU' }),
    deixouDeSeguir: (seguidorId, seguidoId) => repo.removerNotificacoes({ usuarioId: seguidoId, atorId: seguidorId, tipo: 'SEGUIU' }),
  };
}
```
`amizade.controller.ts`:
```ts
import { criarAvisoDeSeguir } from '../comunidade/avisos';
// ...
  private aviso = criarAvisoDeSeguir();
  private followUserUseCase = new FollowUserUseCase(this.amizadeRepository, this.aviso);
  private unfollowUserUseCase = new UnfollowUserUseCase(this.amizadeRepository, this.aviso);
```
(declarar `aviso` antes dos casos de uso que o usam.)

- [ ] **Step 4: Rodar**

Run: `cd server && npm test && npx tsc --noEmit -p tsconfig.json`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/amizade server/src/modules/comunidade/avisos.ts
git commit -m "feat(server): seguir e deixar de seguir avisam na Comunidade"
```

---

### Task 6: Rotas das interações

**Files:**
- Modify: `server/src/modules/comunidade/comunidade.schema.ts` (+ teste), `comunidade.controller.ts`, `comunidade.router.ts`

**Interfaces:**
- Consumes: Task 4.
- Produces:
```
POST|DELETE /api/comunidade/posts/:id/curtida   → { curtiu, curtidas }
POST|DELETE /api/comunidade/posts/:id/salvo     → { salvou }
GET  /api/comunidade/posts/:id/comentarios?cursor= → { itens: ComentarioDTO[], proximoCursor }
POST /api/comunidade/posts/:id/comentarios { texto } → ComentarioDTO
DELETE /api/comunidade/comentarios/:id          → 204
GET  /api/comunidade/salvos?cursor=             → { itens: PostDTO[], proximoCursor }
GET  /api/comunidade/notificacoes?cursor=       → { itens: NotificacaoDTO[], proximoCursor }
GET  /api/comunidade/notificacoes/nao-lidas     → { total }
POST /api/comunidade/notificacoes/lidas         → 204
```

- [ ] **Step 1: Teste do schema** (acrescentar a `comunidade.schema.test.ts`, com `comentarSchema` e `paginaSchema` no import):
```ts
describe('comentário', () => {
  it('limpa espaços e aceita até 1000', () => {
    expect(comentarSchema.parse({ params: { id: UUID }, body: { texto: '  Lindo!  ' } }).body.texto).toBe('Lindo!');
    expect(() => comentarSchema.parse({ params: { id: UUID }, body: { texto: 'x'.repeat(1001) } })).toThrow();
  });
  it('vazio ou só espaços é recusado', () => {
    expect(() => comentarSchema.parse({ params: { id: UUID }, body: { texto: '   ' } })).toThrow('Escreva o comentário.');
  });
  it('página só com cursor', () => {
    expect(paginaSchema.parse({ query: {} }).query).toEqual({});
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd server && npx jest comunidade.schema`
Expected: FAIL — schemas não exportados.

- [ ] **Step 3: Implementar**

`comunidade.schema.ts`, ao fim:
```ts
export const comentarSchema = idSchema.extend({
  body: z.object({
    texto: z.string().trim().min(1, 'Escreva o comentário.').max(1000, 'Comentário com no máximo 1000 caracteres.'),
  }),
});

export const paginaSchema = z.object({
  query: z.object({ cursor }),
});
```

`comunidade.controller.ts`:
- `responder` passa a devolver 204 quando a leitura não retorna nada:
```ts
const responder = (ler: (req: Request, viewerId: string) => Promise<unknown>) => async (req: Request, res: Response) => {
  try {
    const resultado = await ler(req, req.user!.userId);
    return resultado === undefined ? res.status(204).send() : res.status(200).json(resultado);
  } catch (error) {
    const { status, body } = respostaDoErro(error);
    if (status === 500) console.error('[comunidade] erro', error);
    return res.status(status).json(body);
  }
};
```
- casos de uso novos (importar as classes e `PrismaInteracoesRepository`):
```ts
const interacoes = new PrismaInteracoesRepository();
const curtirPost = new CurtirPostUseCase(repo, interacoes);
const salvarPost = new SalvarPostUseCase(repo, interacoes);
const comentar = new ComentarUseCase(repo, interacoes);
const apagarComentario = new ApagarComentarioUseCase(interacoes);
const listarComentarios = new ListarComentariosUseCase(repo);
const listarSalvos = new ListarSalvosUseCase(repo);
const listarNotificacoes = new ListarNotificacoesUseCase(repo);
const contarNaoLidas = new ContarNaoLidasUseCase(repo);
const marcarLidas = new MarcarLidasUseCase(interacoes);
```
- no objeto `comunidadeController`:
```ts
  curtir: responder((req, eu) => curtirPost.execute(eu, idSchema.parse(req).params.id, true)),
  descurtir: responder((req, eu) => curtirPost.execute(eu, idSchema.parse(req).params.id, false)),
  salvar: responder((req, eu) => salvarPost.execute(eu, idSchema.parse(req).params.id, true)),
  dessalvar: responder((req, eu) => salvarPost.execute(eu, idSchema.parse(req).params.id, false)),
  comentarios: responder((req, eu) => {
    const { params, query } = postsDoPerfilSchema.parse(req);
    return listarComentarios.execute(eu, params.id, query.cursor);
  }),
  comentar: responder((req, eu) => {
    const { params, body } = comentarSchema.parse(req);
    return comentar.execute(eu, params.id, body.texto);
  }),
  apagarComentario: responder((req, eu) => apagarComentario.execute(eu, idSchema.parse(req).params.id)),
  salvos: responder((req, eu) => listarSalvos.execute(eu, paginaSchema.parse(req).query.cursor)),
  notificacoes: responder((req, eu) => listarNotificacoes.execute(eu, paginaSchema.parse(req).query.cursor)),
  naoLidas: responder((_req, eu) => contarNaoLidas.execute(eu)),
  marcarLidas: responder((_req, eu) => marcarLidas.execute(eu)),
```
(`postsDoPerfilSchema` serve para "id + cursor"; importar `comentarSchema`, `paginaSchema`.)

`comunidade.router.ts`, acrescentar:
```ts
comunidadeRouter.post('/posts/:id/curtida', comunidadeController.curtir);
comunidadeRouter.delete('/posts/:id/curtida', comunidadeController.descurtir);
comunidadeRouter.post('/posts/:id/salvo', comunidadeController.salvar);
comunidadeRouter.delete('/posts/:id/salvo', comunidadeController.dessalvar);
comunidadeRouter.get('/posts/:id/comentarios', comunidadeController.comentarios);
comunidadeRouter.post('/posts/:id/comentarios', comunidadeController.comentar);
comunidadeRouter.delete('/comentarios/:id', comunidadeController.apagarComentario);
comunidadeRouter.get('/salvos', comunidadeController.salvos);
comunidadeRouter.get('/notificacoes', comunidadeController.notificacoes);
comunidadeRouter.get('/notificacoes/nao-lidas', comunidadeController.naoLidas);
comunidadeRouter.post('/notificacoes/lidas', comunidadeController.marcarLidas);
```

- [ ] **Step 4: Rodar**

Run: `cd server && npm test && npx tsc --noEmit -p tsconfig.json`
Expected: PASS.

- [ ] **Step 5: Conferir no Docker** (duas contas locais, JWTs assinados no container como na fase 2; A com perfil e planta públicos e um post)

Run (`$P` = id do post de A; `$TA`/`$TB` tokens):
- `POST /api/comunidade/posts/$P/curtida` como B duas vezes → `{"curtiu":true,"curtidas":1}` nas duas; `select count(*) from "Notificacao" where tipo='CURTIDA'` → 1.
- `GET /api/comunidade/notificacoes/nao-lidas` como A → `{"total":1}`; `POST .../notificacoes/lidas` → 204; de novo → `{"total":0}`.
- `POST /api/comunidade/posts/$P/comentarios {"texto":"  oi  "}` como B → `texto: "oi"`, `podeApagar: true`; como A, `DELETE /api/comunidade/comentarios/<id>` → 204; notificação COMENTARIO some.
- `POST .../salvo` como B → `{"salvou":true}`; `GET /api/comunidade/salvos` como B → 1 item; A torna o perfil privado → `GET /salvos` como B → 0 itens; curtir → 404.
- `DELETE .../curtida` como B → notificação CURTIDA some.
Restaurar tudo (apagar linhas de teste, A privado, plantas privadas).
Expected: como indicado.

- [ ] **Step 6: Commit**

```bash
git add server/src/modules/comunidade
git commit -m "feat(server): rotas de curtir, comentar, salvar e notificações"
```

---

### Task 7: Web — tipos, chamadas, hooks e regras

**Files:**
- Modify: `web/src/types.ts`, `web/src/lib/endpoints.ts`, `web/src/lib/queries.ts`, `web/src/lib/comunidade.ts`
- Test: `web/src/lib/comunidade.test.ts`

**Interfaces:**
- Produces:
```ts
// types.ts
export type TipoNotificacao = 'CURTIDA' | 'COMENTARIO' | 'SEGUIU';
// PostComunidade ganha: curtidas: number; curtiu: boolean; salvou: boolean; totalComentarios: number;
export interface ComentarioComunidade { id: string; texto: string; createdAt: string; autor: AutorComunidade; podeApagar: boolean }
export interface NotificacaoComunidade {
  id: string; tipo: TipoNotificacao; lida: boolean; createdAt: string; ator: AutorComunidade;
  post: { id: string; plantaId: string; capa: string | null } | null;
  comentario: string | null;
}
```
  - `comunidadeApi.{curtir(id, sim), salvar(id, sim), comentarios(id, cursor?), comentar(id, texto), apagarComentario(id), salvos(cursor?), notificacoes(cursor?), naoLidas(), marcarLidas()}`
  - `keys.comentarios(postId)`, `keys.salvos`, `keys.notificacoes`, `keys.naoLidas`; `useComentarios(postId)`, `useSalvos()`, `useNotificacoes()`, `useNaoLidas()`
  - `alternarCurtida(e, curtir)`, `rotuloCurtidas(n)`, `rotuloComentarios(n)`, `textoDaNotificacao(n)`, `linkDaNotificacao(n)`, `chaveDoPost(post)`

- [ ] **Step 1: Testes** (acrescentar a `web/src/lib/comunidade.test.ts`; acrescentar os nomes ao import de `./comunidade` e `NotificacaoComunidade` ao `import type`). No fixture `post(...)` existente, acrescentar `curtidas: 0, curtiu: false, salvou: false, totalComentarios: 0,` antes de `...over`.
```ts
describe('alternarCurtida', () => {
  it('curtir soma, descurtir subtrai, repetir não muda', () => {
    expect(alternarCurtida({ curtiu: false, curtidas: 2 }, true)).toEqual({ curtiu: true, curtidas: 3 });
    expect(alternarCurtida({ curtiu: true, curtidas: 3 }, false)).toEqual({ curtiu: false, curtidas: 2 });
    expect(alternarCurtida({ curtiu: true, curtidas: 3 }, true)).toEqual({ curtiu: true, curtidas: 3 });
  });
  it('nunca fica negativo', () => {
    expect(alternarCurtida({ curtiu: true, curtidas: 0 }, false)).toEqual({ curtiu: false, curtidas: 0 });
  });
});

describe('rótulos', () => {
  it('singular e plural', () => {
    expect(rotuloCurtidas(1)).toBe('1 curtida');
    expect(rotuloCurtidas(4)).toBe('4 curtidas');
    expect(rotuloComentarios(1)).toBe('ver 1 comentário');
    expect(rotuloComentarios(3)).toBe('ver os 3 comentários');
  });
});

describe('notificação', () => {
  const base: NotificacaoComunidade = {
    id: 'n', tipo: 'CURTIDA', lida: false, createdAt: '2026-10-13T12:00:00Z',
    ator: { id: 'a', nome: 'Ana', fotoPerfilUrl: null }, post: { id: 'post1', plantaId: 'p1', capa: null }, comentario: null,
  };
  it('texto por tipo, com trecho do comentário', () => {
    expect(textoDaNotificacao(base)).toBe('curtiu seu post');
    expect(textoDaNotificacao({ ...base, tipo: 'SEGUIU', post: null })).toBe('começou a seguir você');
    expect(textoDaNotificacao({ ...base, tipo: 'COMENTARIO', comentario: 'Lindo!' })).toBe('comentou: “Lindo!”');
    const longo = 'a'.repeat(100);
    expect(textoDaNotificacao({ ...base, tipo: 'COMENTARIO', comentario: longo })).toBe(`comentou: “${'a'.repeat(59)}…”`);
  });
  it('link: post (comentário vai à seção) ou perfil', () => {
    expect(linkDaNotificacao(base)).toBe('/comunidade/post/post1');
    expect(linkDaNotificacao({ ...base, tipo: 'COMENTARIO' })).toBe('/comunidade/post/post1#comentarios');
    expect(linkDaNotificacao({ ...base, tipo: 'SEGUIU', post: null })).toBe('/comunidade/u/a');
  });
});

describe('chaveDoPost', () => {
  it('muda quando as interações vindas do servidor mudam (o cartão recomeça do valor novo)', () => {
    const p = post('1', 'a', '2026-10-13T12:00:00');
    expect(chaveDoPost(p)).not.toBe(chaveDoPost({ ...p, curtidas: 1 }));
    expect(chaveDoPost(p)).toBe(chaveDoPost({ ...p }));
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd web && npx vitest run src/lib/comunidade.test.ts`
Expected: FAIL — funções não exportadas.

- [ ] **Step 3: Implementar**

`types.ts`: em `PostComunidade`, depois de `cuidados`, acrescentar `curtidas: number; curtiu: boolean; salvou: boolean; totalComentarios: number;` e, ao fim, `TipoNotificacao`, `ComentarioComunidade`, `NotificacaoComunidade` (bloco do "Produces").

`lib/comunidade.ts` (acrescentar; `NotificacaoComunidade` no `import type`):
```ts
/** Curtir/descurtir no cartão antes da resposta do servidor (nunca negativo; repetir não muda). */
export function alternarCurtida(e: { curtiu: boolean; curtidas: number }, curtir: boolean) {
  if (e.curtiu === curtir) return { curtiu: e.curtiu, curtidas: e.curtidas };
  return { curtiu: curtir, curtidas: Math.max(0, e.curtidas + (curtir ? 1 : -1)) };
}

export const rotuloCurtidas = (n: number) => (n === 1 ? '1 curtida' : `${n} curtidas`);
export const rotuloComentarios = (n: number) => (n === 1 ? 'ver 1 comentário' : `ver os ${n} comentários`);

const TRECHO = 60;

export function textoDaNotificacao(n: NotificacaoComunidade): string {
  if (n.tipo === 'CURTIDA') return 'curtiu seu post';
  if (n.tipo === 'SEGUIU') return 'começou a seguir você';
  const c = n.comentario ?? '';
  return `comentou: “${c.length > TRECHO ? `${c.slice(0, TRECHO - 1)}…` : c}”`;
}

export function linkDaNotificacao(n: NotificacaoComunidade): string {
  if (!n.post) return `/comunidade/u/${n.ator.id}`;
  return `/comunidade/post/${n.post.id}${n.tipo === 'COMENTARIO' ? '#comentarios' : ''}`;
}

/** Chave do cartão: muda quando curtidas/salvo vindos do servidor mudam, para o estado local recomeçar deles. */
export const chaveDoPost = (p: PostComunidade) => `${p.id}|${p.curtiu}|${p.curtidas}|${p.salvou}|${p.totalComentarios}`;
```

`endpoints.ts` — em `comunidadeApi` (importar `ComentarioComunidade`, `NotificacaoComunidade`):
```ts
  curtir: (id: string, sim: boolean) =>
    data<{ curtiu: boolean; curtidas: number }>(sim ? api.post(`/comunidade/posts/${id}/curtida`) : api.delete(`/comunidade/posts/${id}/curtida`)),
  salvar: (id: string, sim: boolean) =>
    data<{ salvou: boolean }>(sim ? api.post(`/comunidade/posts/${id}/salvo`) : api.delete(`/comunidade/posts/${id}/salvo`)),
  comentarios: (id: string, cursor?: string) =>
    data<Pagina<ComentarioComunidade>>(api.get(`/comunidade/posts/${id}/comentarios`, { params: { cursor } })),
  comentar: (id: string, texto: string) => data<ComentarioComunidade>(api.post(`/comunidade/posts/${id}/comentarios`, { texto })),
  apagarComentario: (id: string) => api.delete(`/comunidade/comentarios/${id}`),
  salvos: (cursor?: string) => data<Pagina<PostComunidade>>(api.get('/comunidade/salvos', { params: { cursor } })),
  notificacoes: (cursor?: string) => data<Pagina<NotificacaoComunidade>>(api.get('/comunidade/notificacoes', { params: { cursor } })),
  naoLidas: () => data<{ total: number }>(api.get('/comunidade/notificacoes/nao-lidas')),
  marcarLidas: () => api.post('/comunidade/notificacoes/lidas'),
```

`queries.ts` — em `keys`:
```ts
  comentarios: (postId: string) => ['comunidade', 'comentarios', postId] as const,
  salvos: ['comunidade', 'salvos'] as const,
  notificacoes: ['comunidade', 'notificacoes'] as const,
  naoLidas: ['comunidade', 'nao-lidas'] as const,
```
e ao fim:
```ts
export const useComentarios = (postId: string) =>
  useInfiniteQuery({
    queryKey: keys.comentarios(postId),
    queryFn: ({ pageParam }) => comunidadeApi.comentarios(postId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: proximaPagina,
    enabled: !!postId,
  });

export const useSalvos = () =>
  useInfiniteQuery({
    queryKey: keys.salvos,
    queryFn: ({ pageParam }) => comunidadeApi.salvos(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: proximaPagina,
  });

export const useNotificacoes = () =>
  useInfiniteQuery({
    queryKey: keys.notificacoes,
    queryFn: ({ pageParam }) => comunidadeApi.notificacoes(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: proximaPagina,
  });

/** Contador do sino/aba: atualiza ao voltar o foco do app (sem push). */
export const useNaoLidas = () =>
  useQuery({ queryKey: keys.naoLidas, queryFn: comunidadeApi.naoLidas, staleTime: 60_000, refetchOnWindowFocus: true });
```

- [ ] **Step 4: Rodar**

Run: `cd web && npm test && npx tsc -b`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/types.ts web/src/lib
git commit -m "feat(web): chamadas e regras de curtidas, comentários, salvos e notificações"
```

---

### Task 8: Web — curtir e salvar no cartão (com toque duplo)

**Files:**
- Create: `web/src/components/comunidade/useInteracoesDoPost.ts`, `AcoesDoPost.tsx`
- Modify: `web/src/components/comunidade/FotosDoPost.tsx`, `CardPost.tsx`, `CardGrupo.tsx`, `web/src/pages/comunidade/ComunidadePage.tsx`, `PostPage.tsx`, `web/src/index.css`

**Interfaces:**
- Consumes: Task 7.
- Produces: `useInteracoesDoPost(post): { curtiu; curtidas; salvou; curtir(sim: boolean): void; salvar(sim: boolean): void }`; `AcoesDoPost({ post, interacoes })`; `FotosDoPost({ fotos, onToqueDuplo? })`. Quem renderiza `CardPost` usa `key={chaveDoPost(post)}`.

Sem teste de componente (o projeto não testa componentes); a regra pura está na Task 7 e a verificação é no navegador (Task 11).

- [ ] **Step 1: Hook**

`useInteracoesDoPost.ts`:
```ts
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { alternarCurtida } from '@/lib/comunidade';
import { comunidadeApi } from '@/lib/endpoints';
import { keys } from '@/lib/queries';
import type { PostComunidade } from '@/types';

/**
 * Curtida e salvo do post com resposta imediata (otimista). O estado nasce do post; quem renderiza o cartão usa
 * `key={chaveDoPost(post)}` para recomeçar quando o servidor mandar valores novos.
 */
export function useInteracoesDoPost(post: PostComunidade) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [estado, setEstado] = useState({ curtiu: post.curtiu, curtidas: post.curtidas, salvou: post.salvou });

  // As outras telas (feed, perfil, salvos) buscam de novo quando forem abertas
  const marcarDesatualizadas = () => queryClient.invalidateQueries({ queryKey: keys.comunidade, refetchType: 'none' });

  async function curtir(sim: boolean) {
    if (estado.curtiu === sim) return;
    const antes = estado;
    setEstado((e) => ({ ...e, ...alternarCurtida(e, sim) }));
    try {
      const r = await comunidadeApi.curtir(post.id, sim);
      setEstado((e) => ({ ...e, curtiu: r.curtiu, curtidas: r.curtidas }));
      marcarDesatualizadas();
    } catch (error) {
      setEstado(antes);
      toast(errorMessage(error), 'error');
    }
  }

  async function salvar(sim: boolean) {
    if (estado.salvou === sim) return;
    setEstado((e) => ({ ...e, salvou: sim }));
    try {
      await comunidadeApi.salvar(post.id, sim);
      marcarDesatualizadas();
      toast(sim ? 'Post salvo' : 'Tirado dos salvos');
    } catch (error) {
      setEstado((e) => ({ ...e, salvou: !sim }));
      toast(errorMessage(error), 'error');
    }
  }

  return { ...estado, curtir, salvar };
}
```

- [ ] **Step 2: Barra de ações**

`AcoesDoPost.tsx`:
```tsx
import { Link } from 'react-router';
import { Icone } from '@/components/Icone';
import { rotuloComentarios, rotuloCurtidas } from '@/lib/comunidade';
import type { useInteracoesDoPost } from './useInteracoesDoPost';
import type { PostComunidade } from '@/types';

/** Curtir, comentar e salvar; abaixo, curtidas e o atalho para os comentários. */
export function AcoesDoPost({ post, interacoes }: { post: PostComunidade; interacoes: ReturnType<typeof useInteracoesDoPost> }) {
  const { curtiu, curtidas, salvou, curtir, salvar } = interacoes;
  return (
    <div className="space-y-1">
      <div className="-mx-2 flex items-center">
        <button
          type="button"
          onClick={() => curtir(!curtiu)}
          aria-label={curtiu ? 'Descurtir' : 'Curtir'}
          aria-pressed={curtiu}
          className={`flex size-10 items-center justify-center rounded-full transition active:scale-90 ${curtiu ? 'text-hanko' : 'text-ink'}`}
        >
          <Icone nome="curtir" ativo={curtiu} size={24} />
        </button>
        <Link to={`/comunidade/post/${post.id}#comentarios`} aria-label="Comentar" className="flex size-10 items-center justify-center rounded-full text-ink">
          <Icone nome="comentar" size={24} />
        </Link>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => salvar(!salvou)}
          aria-label={salvou ? 'Tirar dos salvos' : 'Salvar'}
          aria-pressed={salvou}
          className="flex size-10 items-center justify-center rounded-full text-ink transition active:scale-90"
        >
          <Icone nome="salvar" ativo={salvou} size={24} />
        </button>
      </div>
      {curtidas > 0 && <p className="text-sm font-semibold">{rotuloCurtidas(curtidas)}</p>}
      {post.totalComentarios > 0 && (
        <Link to={`/comunidade/post/${post.id}#comentarios`} className="block text-sm text-muted">
          {rotuloComentarios(post.totalComentarios)}
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Toque duplo nas fotos**

`index.css`, depois de `.animate-fade-in { ... }`:
```css
@keyframes curtida {
  0% {
    opacity: 0;
    transform: scale(0.4);
  }
  15% {
    opacity: 0.95;
    transform: scale(1.12);
  }
  30% {
    transform: scale(1);
  }
  75% {
    opacity: 0.95;
  }
  100% {
    opacity: 0;
    transform: scale(1);
  }
}
.animate-curtida {
  animation: curtida 0.9s ease-out both;
}
```
e, no bloco `@media (prefers-reduced-motion: reduce)` que tem `.animate-sheet-up, .animate-fade-in`, acrescentar `.animate-curtida` à lista.

`FotosDoPost.tsx`: assinatura `({ fotos, onToqueDuplo }: { fotos: FotoDoPost[]; onToqueDuplo?: () => void })`, imports `useRef` e `Icone`, e:
```tsx
  const ultimoToque = useRef(0);
  const [coracao, setCoracao] = useState(0);

  // Dois toques em até 300 ms curtem (como no Instagram); um toque só não faz nada
  function tocar() {
    const agora = Date.now();
    if (agora - ultimoToque.current < 300) {
      ultimoToque.current = 0;
      onToqueDuplo?.();
      setCoracao((c) => c + 1);
    } else {
      ultimoToque.current = agora;
    }
  }
```
no `div` de fora (`className="relative"`) acrescentar `onClick={onToqueDuplo ? tocar : undefined}` e, antes do fechamento dele:
```tsx
      {coracao > 0 && (
        <span key={coracao} className="pointer-events-none absolute inset-0 flex items-center justify-center text-hanko">
          <Icone nome="curtir" ativo size={88} className="animate-curtida drop-shadow" />
        </span>
      )}
```

- [ ] **Step 4: Cartão**

`CardPost.tsx`: `const interacoes = useInteracoesDoPost(post);`; `<FotosDoPost fotos={post.fotos} onToqueDuplo={() => interacoes.curtir(true)} />`; no `div className="space-y-2 p-3"`, como primeiro filho, `<AcoesDoPost post={post} interacoes={interacoes} />`.

Chaves: em `ComunidadePage.tsx` (`Feed`), `CardGrupo.tsx` e `PostPage.tsx`, trocar `key={...post.id}`/sem chave por `key={chaveDoPost(post)}` (no `PostPage`, `<CardPost key={chaveDoPost(post.data)} post={post.data} />`). Importar `chaveDoPost` de `@/lib/comunidade`.

- [ ] **Step 5: Verificar**

Run: `cd web && npm test && npm run build && npm run lint`
Expected: tudo ok, sem avisos novos de lint.

- [ ] **Step 6: Commit**

```bash
git add web/src/components/comunidade web/src/pages/comunidade web/src/index.css
git commit -m "feat(web): curtir (com toque duplo) e salvar no cartão do post"
```

---

### Task 9: Web — comentários na página do post

**Files:**
- Create: `web/src/components/comunidade/ComentariosDoPost.tsx`
- Modify: `web/src/pages/comunidade/PostPage.tsx`

**Interfaces:**
- Consumes: `useComentarios`, `comunidadeApi.comentar/apagarComentario`, `keys`, `ConfirmSheet`, `Avatar`, `Button`, `tempoRelativo`.
- Produces: `ComentariosDoPost({ postId })`; seção `id="comentarios"` na página do post.

- [ ] **Step 1: Componente**

`ComentariosDoPost.tsx`:
```tsx
import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { ConfirmSheet } from '@/components/Sheet';
import { Avatar, Button, ErrorState, Spinner } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { comunidadeApi } from '@/lib/endpoints';
import { tempoRelativo } from '@/lib/format';
import { keys, useComentarios } from '@/lib/queries';
import type { ComentarioComunidade } from '@/types';

const LIMITE = 1000;

/** Comentários do post (mais antigos primeiro) e o campo para escrever. */
export function ComentariosDoPost({ postId }: { postId: string }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const lista = useComentarios(postId);
  const comentarios = useMemo(() => lista.data?.pages.flatMap((p) => p.itens) ?? [], [lista.data]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [apagar, setApagar] = useState<ComentarioComunidade | null>(null);
  const [apagando, setApagando] = useState(false);

  const atualizar = async () => {
    await queryClient.invalidateQueries({ queryKey: keys.comentarios(postId) });
    // O número de comentários no cartão vem do post
    queryClient.invalidateQueries({ queryKey: keys.post(postId) });
    queryClient.invalidateQueries({ queryKey: keys.comunidade, refetchType: 'none' });
  };

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    try {
      await comunidadeApi.comentar(postId, texto.trim());
      setTexto('');
      await atualizar();
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarApagar() {
    if (!apagar) return;
    setApagando(true);
    try {
      await comunidadeApi.apagarComentario(apagar.id);
      setApagar(null);
      await atualizar();
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setApagando(false);
    }
  }

  return (
    <section id="comentarios" className="scroll-mt-20">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Comentários</h2>
      {lista.isLoading ? (
        <Spinner />
      ) : lista.isError ? (
        <ErrorState text="Não foi possível carregar os comentários." erro={lista.error} onRetry={() => lista.refetch()} />
      ) : comentarios.length ? (
        <ul className="space-y-3">
          {comentarios.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Link to={`/comunidade/u/${c.autor.id}`} aria-label={`Perfil de ${c.autor.nome}`}>
                <Avatar url={c.autor.fotoPerfilUrl} nome={c.autor.nome} size={32} />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-line break-words text-sm">
                  <Link to={`/comunidade/u/${c.autor.id}`} className="mr-1.5 font-semibold">
                    {c.autor.nome}
                  </Link>
                  {c.texto}
                </p>
                <p className="mt-0.5 text-xs text-muted">{tempoRelativo(c.createdAt)}</p>
              </div>
              {c.podeApagar && (
                <button type="button" onClick={() => setApagar(c)} aria-label="Apagar comentário" className="flex size-8 items-center justify-center rounded-full text-muted">
                  <Trash2 size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Ainda sem comentários.</p>
      )}
      {lista.hasNextPage && (
        <button type="button" onClick={() => lista.fetchNextPage()} className="mt-3 text-sm font-medium text-primary">
          {lista.isFetchingNextPage ? 'Carregando…' : 'Ver mais comentários'}
        </button>
      )}

      <form onSubmit={enviar} className="mt-4 flex items-end gap-2">
        <textarea
          className="input min-h-11 flex-1 resize-none"
          rows={1}
          maxLength={LIMITE}
          placeholder="Escreva um comentário"
          aria-label="Comentário"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <Button type="submit" loading={enviando} disabled={!texto.trim()}>
          Enviar
        </Button>
      </form>

      <ConfirmSheet
        open={!!apagar}
        onClose={() => setApagar(null)}
        onConfirm={confirmarApagar}
        loading={apagando}
        title="Apagar comentário?"
        text="Ele some para todo mundo."
        confirmLabel="Apagar"
      />
    </section>
  );
}
```

- [ ] **Step 2: Página do post**

`PostPage.tsx`: quando `post.data` existe, renderizar:
```tsx
          post.data && (
            <div className="space-y-6">
              <CardPost key={chaveDoPost(post.data)} post={post.data} />
              <ComentariosDoPost postId={post.data.id} />
            </div>
          )
```
e, para o `#comentarios` funcionar depois que a página carrega, logo após `const post = usePost(id);`:
```tsx
  const { hash } = useLocation();
  useEffect(() => {
    if (hash === '#comentarios' && post.data) document.getElementById('comentarios')?.scrollIntoView({ behavior: 'smooth' });
  }, [hash, post.data]);
```
(imports `useEffect` de `react`, `useLocation` de `react-router`, `ComentariosDoPost`, `chaveDoPost`.)

- [ ] **Step 3: Verificar**

Run: `cd web && npm test && npm run build && npm run lint`
Expected: tudo ok.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/comunidade/ComentariosDoPost.tsx web/src/pages/comunidade/PostPage.tsx
git commit -m "feat(web): comentários na página do post"
```

---

### Task 10: Web — Salvos, Notificações, sino e ponto na aba

**Files:**
- Create: `web/src/components/comunidade/ItemNotificacao.tsx`, `web/src/pages/comunidade/SalvosPage.tsx`, `NotificacoesPage.tsx`
- Modify: `web/src/components/comunidade/GradePosts.tsx`, `web/src/pages/comunidade/ComunidadePage.tsx`, `web/src/components/Layout.tsx`, `web/src/App.tsx`, `web/src/pages/ProfilePages.tsx`

**Interfaces:**
- Consumes: `useSalvos`, `useNotificacoes`, `useNaoLidas`, `comunidadeApi.marcarLidas`, `textoDaNotificacao`, `linkDaNotificacao`, `BotaoTopo`, `Icone`.
- Produces: `GradeDePosts({ consulta, vazio })` (a `GradePosts({ usuarioId })` passa a usá-la); rotas `/comunidade/salvos`, `/comunidade/notificacoes`.

- [ ] **Step 1: Grade reaproveitável**

`GradePosts.tsx`:
```tsx
import { useMemo } from 'react';
import { Link } from 'react-router';
import { EmptyState, ErrorState, Spinner } from '@/components/ui';
import { capaDoPost } from '@/lib/comunidade';
import { usePostsDoPerfil } from '@/lib/queries';
import { useFimDaLista } from '@/lib/useFimDaLista';

/** Mesmo tipo de `usePostsDoPerfil` e `useSalvos` (lista infinita de posts). */
type Consulta = ReturnType<typeof usePostsDoPerfil>;

/** Grade de posts com rolagem infinita (perfil, salvos). */
export function GradeDePosts({ consulta, vazio }: { consulta: Consulta; vazio: { title: string; text?: string } }) {
  const posts = useMemo(() => consulta.data?.pages.flatMap((p) => p.itens) ?? [], [consulta.data]);
  const fim = useFimDaLista(() => {
    if (consulta.hasNextPage && !consulta.isFetchingNextPage) void consulta.fetchNextPage();
  }, [posts.length]);

  if (consulta.isLoading) return <Spinner />;
  if (consulta.isError) return <ErrorState text="Não foi possível carregar os posts." erro={consulta.error} onRetry={() => consulta.refetch()} />;
  if (!posts.length) return <EmptyState title={vazio.title} text={vazio.text} />;
  return (
    <>
      <div className="grid grid-cols-3 gap-1">
        {posts.map((p) => (
          <Link key={p.id} to={`/comunidade/post/${p.id}`} className="block">
            <img src={capaDoPost(p) ?? undefined} alt="" loading="lazy" className="aspect-square w-full bg-vazio object-cover" />
          </Link>
        ))}
      </div>
      <div ref={fim} />
      {consulta.isFetchingNextPage && <Spinner />}
    </>
  );
}

/** Todos os posts de um perfil (inclui o acervo fora do feed). */
export function GradePosts({ usuarioId }: { usuarioId: string }) {
  return (
    <GradeDePosts
      consulta={usePostsDoPerfil(usuarioId)}
      vazio={{ title: 'Ainda sem posts', text: 'Os dias com foto das plantas da comunidade aparecem aqui.' }}
    />
  );
}
```

- [ ] **Step 2: Salvos**

`SalvosPage.tsx`:
```tsx
import { PageHeader } from '@/components/ui';
import { GradeDePosts } from '@/components/comunidade/GradePosts';
import { useSalvos } from '@/lib/queries';

export function SalvosPage() {
  return (
    <div className="pb-10">
      <PageHeader title="Salvos" back />
      <div className="mx-auto max-w-2xl px-4 pt-4">
        <GradeDePosts consulta={useSalvos()} vazio={{ title: 'Nada salvo ainda', text: 'Toque no marcador de um post para guardar aqui.' }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Notificações**

`ItemNotificacao.tsx`:
```tsx
import { Link } from 'react-router';
import { Avatar, PlantThumb } from '@/components/ui';
import { linkDaNotificacao, textoDaNotificacao } from '@/lib/comunidade';
import { tempoRelativo } from '@/lib/format';
import type { NotificacaoComunidade } from '@/types';

export function ItemNotificacao({ n }: { n: NotificacaoComunidade }) {
  return (
    <Link to={linkDaNotificacao(n)} className={`flex items-center gap-3 px-4 py-3 ${n.lida ? '' : 'bg-primary-light/50'}`}>
      <Avatar url={n.ator.fotoPerfilUrl} nome={n.ator.nome} size={40} />
      <p className="min-w-0 flex-1 text-sm">
        <span className="font-semibold">{n.ator.nome}</span> {textoDaNotificacao(n)}
        <span className="block text-xs text-muted">{tempoRelativo(n.createdAt)}</span>
      </p>
      {n.post && <PlantThumb url={n.post.capa} id={n.post.plantaId} className="size-11 shrink-0 rounded-lg" />}
    </Link>
  );
}
```

`NotificacoesPage.tsx`:
```tsx
import { useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { EmptyState, ErrorState, PageHeader, Spinner } from '@/components/ui';
import { ItemNotificacao } from '@/components/comunidade/ItemNotificacao';
import { comunidadeApi } from '@/lib/endpoints';
import { keys, useNotificacoes } from '@/lib/queries';
import { useFimDaLista } from '@/lib/useFimDaLista';

/** Avisos da Comunidade. Abrir marca tudo como lido (o destaque das novas fica até sair da tela). */
export function NotificacoesPage() {
  const queryClient = useQueryClient();
  const lista = useNotificacoes();
  const itens = useMemo(() => lista.data?.pages.flatMap((p) => p.itens) ?? [], [lista.data]);
  const marcou = useRef(false);
  const fim = useFimDaLista(() => {
    if (lista.hasNextPage && !lista.isFetchingNextPage) void lista.fetchNextPage();
  }, [itens.length]);

  useEffect(() => {
    if (!lista.isSuccess || marcou.current) return;
    marcou.current = true;
    comunidadeApi
      .marcarLidas()
      .then(() => queryClient.setQueryData(keys.naoLidas, { total: 0 }))
      .catch(() => undefined);
  }, [lista.isSuccess, queryClient]);

  return (
    <div className="pb-10">
      <PageHeader title="Notificações" back />
      <div className="mx-auto max-w-2xl px-4 pt-4">
        {lista.isLoading ? (
          <Spinner />
        ) : lista.isError ? (
          <ErrorState text="Não foi possível carregar as notificações." erro={lista.error} onRetry={() => lista.refetch()} />
        ) : itens.length ? (
          <>
            <ul className="card divide-y divide-line overflow-hidden">
              {itens.map((n) => (
                <li key={n.id}>
                  <ItemNotificacao n={n} />
                </li>
              ))}
            </ul>
            <div ref={fim} />
            {lista.isFetchingNextPage && <Spinner />}
          </>
        ) : (
          <EmptyState title="Nada por aqui ainda" text="Curtidas, comentários e novos seguidores aparecem aqui." />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Sino, ponto na aba, rotas e Perfil**

`ComunidadePage.tsx`, no `header`, antes do botão de busca (importar `Icone`, `useNaoLidas`):
```tsx
        <BotaoTopo label={naoLidas ? `Notificações · ${naoLidas} nova(s)` : 'Notificações'} onClick={() => navigate('/comunidade/notificacoes')} marcado={naoLidas > 0}>
          <Icone nome="notificacoes" size={20} />
          {naoLidas > 0 && (
            <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-hanko text-[11px] font-bold text-white ring-2 ring-bg">
              {naoLidas > 9 ? '9+' : naoLidas}
            </span>
          )}
        </BotaoTopo>
```
com `const naoLidas = useNaoLidas().data?.total ?? 0;` no topo do componente.

`Layout.tsx`: `const naoLidas = useNaoLidas().data?.total ?? 0;` no componente; dentro do `<span className="relative size-[26px]">` da aba, depois dos dois `Icone`:
```tsx
                      {tab.to === '/comunidade' && naoLidas > 0 && (
                        <span aria-hidden className="absolute -right-1 -top-0.5 size-2.5 rounded-full bg-hanko ring-2 ring-bg" />
                      )}
```
e no `aria-label` do `NavLink`: `aria-label={tab.to === '/comunidade' && naoLidas > 0 ? `${tab.label} · novidades` : tab.label}`.

`App.tsx`, junto das rotas da Comunidade:
```tsx
        <Route path="/comunidade/salvos" element={<Privada><SalvosPage /></Privada>} />
        <Route path="/comunidade/notificacoes" element={<Privada><NotificacoesPage /></Privada>} />
```
(com os imports).

`ProfilePages.tsx`, no `<nav>` depois de "Ver meu perfil público":
```tsx
        <MenuItem to="/comunidade/salvos" icon={<Icone nome="salvar" size={20} />} label="Salvos" />
```
(importar `Icone` de `@/components/Icone`).

- [ ] **Step 5: Verificar**

Run: `cd web && npm test && npm run build && npm run lint`
Expected: tudo ok.

- [ ] **Step 6: Commit**

```bash
git add web/src/components web/src/pages web/src/App.tsx
git commit -m "feat(web): salvos, notificações, sino com contador e ponto na aba Comunidade"
```

---

### Task 11: Verificação ponta a ponta, CLAUDE.md e entrega

**Files:**
- Modify: `CLAUDE.md` (fim do trecho da Comunidade)

- [ ] **Step 1: Navegador (local, duas contas)** — como na fase 2: A = `teste.web@bonsai.test`, B = `smoke.bancada@teste.local` (JWT local no `localStorage`, guardar o token de A); a foto de teste aponta para uma arte do app (`http://localhost:5173/arte/enso.webp`) e os dados de teste são apagados direto no banco no fim (nunca `DELETE /fotos` de URL real).
1. A: perfil e planta públicos, histórico público; uma foto de hoje.
2. B: no feed, coração/comentar/salvar no cartão. **Toque duplo** na foto → coração vermelho aparece e some; o coração da barra fica cheio em vermelho; "1 curtida". Tocar no coração de novo → descurte.
3. B: comentar em "ver comentários"/ícone → página do post rola até Comentários; enviar "  Lindo!  " → aparece "Lindo!"; B vê a lixeira no seu.
4. B: salvar → toast "Post salvo"; Perfil → Salvos mostra o post.
5. A: sino com "2" (curtida + comentário), ponto na aba Comunidade; abrir Notificações → "Bia curtiu seu post", "comentou: “Lindo!”"; voltar → sino e ponto somem. A apaga o comentário de B → some para B; a notificação de comentário some.
6. B segue A → A recebe "começou a seguir você"; B deixa de seguir → some.
7. A torna o perfil privado → B: Salvos vazio; abrir o post salvo → "Este post não existe mais".
8. Restaurar tudo (linhas de teste apagadas, A privado com plantas privadas, token de A de volta).

- [ ] **Step 2: CLAUDE.md** — acrescentar ao fim do trecho da Comunidade:
```
Fase 3: curtir (toque duplo na foto ou coração; `useInteracoesDoPost` otimista, cartão com `key={chaveDoPost(post)}`), comentar (`ComentariosDoPost` na página do post, `#comentarios`; autor ou dono do post apagam), salvar (`/comunidade/salvos`, item no Perfil) e notificações dentro do app (`/comunidade/notificacoes`, abrir marca lidas; sino com contador e ponto na aba via `useNaoLidas`, atualiza ao voltar o foco). Tabelas `Curtida`, `Comentario`, `Salvo`, `Notificacao` (CURTIDA/COMENTARIO/SEGUIU; nunca para si; desfazer remove o aviso). API `POST|DELETE /api/comunidade/posts/:id/{curtida,salvo}`, `GET|POST /posts/:id/comentarios`, `DELETE /comentarios/:id`, `GET /salvos`, `GET /notificacoes`, `GET /notificacoes/nao-lidas`, `POST /notificacoes/lidas`. Seguir avisa via `AvisoDeSeguir` (`comunidade/avisos.ts`).
```

- [ ] **Step 3: Rodar tudo**

Run: `cd server && npm test && npm run build` e `cd web && npm test && npm run build && npm run lint`
Expected: tudo passa.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md com a fase 3 da Comunidade"
```

- [ ] **Step 5: Push e produção** (depois da revisão final)

`git push origin main`; esperar Vercel e Cloudflare Pages; em https://bonsaimanager.pages.dev com `testeclaude@bonsai.dev`: sino aparece na Comunidade, Notificações abre (vazia), Perfil → Salvos abre (vazio), `GET /api/comunidade/notificacoes/nao-lidas` → `{"total":0}`.
