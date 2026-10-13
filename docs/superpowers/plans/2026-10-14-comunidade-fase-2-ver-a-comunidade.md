# Comunidade · Fase 2 (ver a comunidade) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A aba Comunidade na barra de baixo, com feed Seguindo/Explorar de posts (fotos + cuidados do dia), página do post, perfil público com seguir, página pública da planta e busca de pessoas — sem curtidas/comentários/salvos (fase 3).

**Architecture:** No servidor, o módulo `comunidade/` ganha o lado de leitura: um repositório Prisma (`PrismaLeituraComunidadeRepository`) que devolve posts/perfis/plantas "crus", regras puras em `dominio/` (visibilidade, conteúdo por planta+dia, montagem do `PostDTO`, linha do tempo pública) e um caso de uso por tela, expostos em `/api/comunidade/*`. Seguir passa a exigir perfil público. No web, `comunidadeApi` + hooks com `useInfiniteQuery`, componentes de post em `components/comunidade/` e cinco páginas em `pages/comunidade/`.

**Tech Stack:** Express + Prisma 5 + Zod + Jest (`server/`); React 19 + React Router + TanStack Query 5 + Tailwind v4 + Vitest (`web/`).

**Spec:** `docs/superpowers/specs/2026-10-13-comunidade-design.md` (fase 2). Fase 1 já em produção (`Post`, `sincronizarPosts`, privacidade).

## Global Constraints

- Português em código, comentários, UI e commits.
- Post de outra pessoa visível só se `dono.perfilPublico && planta.plantaPublica`; o dono sempre vê o seu.
- Cuidados no post e na página da planta só se `dono.historicoPublico` (dono sempre vê); senão `cuidados: null`.
- Feed **Seguindo** = `noFeed = false` visíveis de quem eu sigo + os meus; **Explorar** = todos os `noFeed = false` visíveis; ambos por `publicadoEm` desc (desempate `id` desc), 20 por página.
- Perfil/post/planta invisível → **404** (não revela que existe). Seguir perfil privado ou a si mesmo → 400.
- Busca só entre perfis públicos, por `nome`/`nomePublico`, mínimo 2 caracteres.
- Nome exibido do autor: `nomePublico || nome`.
- Agrupamento do feed: 3+ posts **seguidos** da mesma pessoa no mesmo dia (de `publicadoEm`, fuso do aparelho) viram um cartão.
- Barra de baixo: Bancada · Coleção · **+** · **Comunidade** · Perfil.
- Visual "Caderno de sumi"; ícone `comunidade` provisório até o definitivo sair da skill `criando-assets-sumi`.
- Trabalhar na `main`; push = deploy (o usuário já autorizou o push desta fase ao pedir "depois vamos para fase 2" — mesmo fluxo da fase 1: push após a revisão final e conferência em produção).

## Review Focus

- Pessoa A torna o perfil privado depois de ter posts no feed → somem do Explorar/Seguindo de B na hora, e `/comunidade/post/:id` desses posts dá 404 para B. (Task 4: teste de `ObterPostUseCase`; filtro do feed na Task 3)
- Post cujo dia ficou sem fotos (corrida com exclusão) não aparece como card vazio. (Task 2: `montarPosts`)
- Cuidados nunca vazam com `historicoPublico = false`, nem no feed, nem no post, nem na página da planta. (Task 2 e Task 4)
- Seguir alguém que ficou privado entre abrir o perfil e tocar em Seguir → 400 com mensagem clara, botão volta ao estado certo. (Task 1)
- Rolagem infinita: a segunda página começa depois do último post da primeira, sem repetir nem pular (cursor por `id` com ordem estável `publicadoEm, id`). (Task 3: ordem; Task 10: conferência com mais de 20 posts não é viável localmente — conferir a ordem pelo filtro + `orderBy` no código)

---

## File Structure

**Server — criar**
- `server/prisma/migrations/20261014120000_amizade_created_at/migration.sql`
- `server/src/modules/comunidade/dominio/visibilidade.ts` (+ `.test.ts`) — `podeVer`, `podeVerPerfil`, `mostraCuidados`.
- `server/src/modules/comunidade/dominio/conteudo.ts` (+ `.test.ts`) — `conteudoPorDia`, `chaveDoDia`.
- `server/src/modules/comunidade/dominio/montar.ts` (+ `.test.ts`) — `paraDia`, `autorDe`, `plantaDe`, `montarPosts`, `linhaDoTempoPublica`.
- `server/src/modules/comunidade/repositories/filtros.ts` (+ `.test.ts`) — `filtroDoFeed`.
- `server/src/modules/comunidade/repositories/prisma-leitura.repository.ts`
- `server/src/modules/comunidade/use-cases/carregar-posts.ts` — `carregarPosts`, `pagina`, `LIMITE_PAGINA`.
- `server/src/modules/comunidade/use-cases/{obter-feed,obter-post,obter-perfil,listar-posts-do-perfil,obter-planta-publica,buscar-perfis}.use-case.ts` + um `leitura.use-cases.test.ts`.
- `server/src/modules/comunidade/comunidade.schema.ts`, `comunidade.controller.ts`, `comunidade.router.ts`

**Server — modificar**
- `server/prisma/schema.prisma` (`Amizade.createdAt`)
- `server/src/modules/comunidade/comunidade.types.ts` (tipos de leitura, `NaoEncontrado`)
- `server/src/modules/amizade/amizade.types.ts`, `repositories/prisma-amizade.repository.ts`, `use-cases/follow-user.use-case.ts` (+ teste), `amizade.controller.ts`
- `server/src/app.ts` (montar `/api/comunidade`)

**Web — criar**
- `web/public/icones/comunidade.svg`, `comunidade-ativo.svg` (provisórios)
- `web/src/lib/useFimDaLista.ts`
- `web/src/components/comunidade/{FotosDoPost,CuidadosDoPost,CardPost,CardGrupo,FaixaPerfilPrivado,GradePosts}.tsx`
- `web/src/pages/comunidade/{ComunidadePage,PostPage,PerfilPublicoPage,PlantaPublicaPage,BuscarPerfisPage}.tsx`

**Web — modificar**
- `web/src/types.ts`, `web/src/lib/endpoints.ts`, `web/src/lib/queries.ts`, `web/src/lib/comunidade.ts` (+ teste), `web/src/lib/format.ts` (+ `format.test.ts`), `web/src/lib/api.ts` (+ `api.test.ts`), `web/src/lib/icones.ts`, `web/src/components/Layout.tsx`, `web/src/App.tsx`, `web/src/pages/ProfilePages.tsx`, `CLAUDE.md`

---

### Task 1: Seguir só perfil público + `Amizade.createdAt`

**Files:**
- Modify: `server/prisma/schema.prisma` (`model Amizade`)
- Create: `server/prisma/migrations/20261014120000_amizade_created_at/migration.sql`
- Modify: `server/src/modules/amizade/amizade.types.ts`, `repositories/prisma-amizade.repository.ts`, `use-cases/follow-user.use-case.ts`, `amizade.controller.ts`
- Test: `server/src/modules/amizade/use-cases/follow-user.use-case.test.ts`

**Interfaces:**
- Produces: `AmizadeRepository.perfilPublico(userId: string): Promise<boolean | null>` (null = não existe); erro `'Este perfil é privado.'` → 400.

- [ ] **Step 1: Testes**

Em `follow-user.use-case.test.ts`: no `beforeEach`, acrescentar `perfilPublico: jest.fn().mockResolvedValue(true),` ao mock. Trocar, nos testes existentes, `mockAmizadeRepository.userExists.mockResolvedValue(true)` → `mockAmizadeRepository.perfilPublico.mockResolvedValue(true)`, `mockAmizadeRepository.userExists.mockResolvedValue(false)` → `mockAmizadeRepository.perfilPublico.mockResolvedValue(null)` e `expect(mockAmizadeRepository.userExists).toHaveBeenCalledWith('user2')` → `expect(mockAmizadeRepository.perfilPublico).toHaveBeenCalledWith('user2')`. Acrescentar:
```ts
  it('não segue perfil privado', async () => {
    mockAmizadeRepository.perfilPublico.mockResolvedValue(false);

    await expect(followUserUseCase.execute({ seguidorId: 'user1', seguidoId: 'user2' })).rejects.toThrow('Este perfil é privado.');
    expect(mockAmizadeRepository.follow).not.toHaveBeenCalled();
  });
```
Nos outros testes do módulo que montam `jest.Mocked<AmizadeRepository>` literal (unfollow, get-seguidores, get-seguindo), acrescentar `perfilPublico: jest.fn(),`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd server && npx jest amizade`
Expected: FAIL — `perfilPublico` não existe no tipo (e, depois de adicionar ao tipo, o teste "não segue perfil privado" falha porque o caso de uso ainda usa `userExists`).

- [ ] **Step 3: Implementar**

`amizade.types.ts`, em `AmizadeRepository`:
```ts
  /** null = usuário não existe. */
  perfilPublico(userId: string): Promise<boolean | null>;
```
`prisma-amizade.repository.ts`:
```ts
  async perfilPublico(userId: string): Promise<boolean | null> {
    const user = await prisma.usuario.findUnique({ where: { id: userId }, select: { perfilPublico: true } });
    return user ? user.perfilPublico : null;
  }
```
`follow-user.use-case.ts`, trocar o bloco "Verifica se o usuário a ser seguido existe" por:
```ts
    // Só perfis públicos podem ser seguidos (Comunidade aberta, sem aprovação)
    const publico = await this.amizadeRepository.perfilPublico(seguidoId);
    if (publico === null) {
      throw new Error('Utilizador a ser seguido não encontrado.');
    }
    if (!publico) {
      throw new Error('Este perfil é privado.');
    }
```
`amizade.controller.ts`, em `follow`, junto do `'Não pode seguir a si mesmo.'`:
```ts
        if (error.message === 'Não pode seguir a si mesmo.' || error.message === 'Este perfil é privado.') {
          return res.status(400).json({ message: error.message });
        }
```
(substitui o `if` existente de "Não pode seguir a si mesmo.").

`schema.prisma`, em `model Amizade`, depois de `seguidoId  String`: `createdAt  DateTime @default(now())`.

`migration.sql`:
```sql
-- Comunidade: quando começou a seguir (ordenação e notificações da fase 3)
ALTER TABLE "Amizade" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
```

- [ ] **Step 4: Rodar**

Run: `docker restart bonsai_api` (aplica a migração), `docker compose exec api npx prisma migrate status` → `Database schema is up to date!`; `cd server && npm run prisma:generate && npm test && npx tsc --noEmit -p tsconfig.json`
Expected: tudo passa.

- [ ] **Step 5: Commit**

```bash
git add server/prisma server/src/modules/amizade
git commit -m "feat(server): seguir só perfil público e data do seguir"
```

---

### Task 2: Regras puras de leitura (visibilidade, conteúdo do dia, montagem)

**Files:**
- Create: `server/src/modules/comunidade/dominio/visibilidade.ts`, `conteudo.ts`, `montar.ts` (+ um `.test.ts` para cada)
- Modify: `server/src/modules/comunidade/comunidade.types.ts`

**Interfaces:**
- Consumes: `diaDoPost`, `diaLocal`, `FotoParaPost` (`dominio/post.ts`, fase 1).
- Produces (tipos em `comunidade.types.ts`):
```ts
export type AbaFeed = 'seguindo' | 'explorar';
export interface UsuarioLido { id: string; nome: string; nomePublico: string | null; fotoPerfilUrl: string | null; perfilPublico: boolean; historicoPublico: boolean }
export interface EspecieLida { nomeComum: string | null; nomeCientifico: string | null }
export interface PlantaLidaBase { id: string; identificador: number; nome: string | null; fotoCapaUrl: string | null; plantaPublica: boolean; especie: EspecieLida | null }
export interface PostLido { id: string; dia: Date; publicadoEm: Date; plantaId: string; usuario: UsuarioLido; planta: PlantaLidaBase }
export interface PlantaLida extends PlantaLidaBase { usuario: UsuarioLido; posts: { id: string; dia: Date }[] }
export interface PerfilLido extends UsuarioLido { bio: string | null; localidade: string | null; plantas: number; seguidores: number; seguindo: number; sigo: boolean }
export interface FotoLida extends FotoParaPost { id: string; plantaId: string; caminhoArquivo: string; thumbnailUrl: string | null }
export interface CuidadoLido { plantaId: string; dataConcluida: Date | null; dataAgendada: Date; detalhes: string | null; observacaoFutura: string | null; atividade: { nome: string } }
export interface FotoDoPost { id: string; url: string; tipo: string; thumbnailUrl: string | null }
export interface CuidadoDoPost { atividade: string; detalhes: string | null; observacao: string | null }
export interface AutorDTO { id: string; nome: string; fotoPerfilUrl: string | null }
export interface PlantaDTO { id: string; identificador: number; nome: string | null; fotoCapaUrl: string | null; especie: EspecieLida | null }
export interface PostDTO { id: string; dia: string; publicadoEm: Date; autor: AutorDTO; planta: PlantaDTO; fotos: FotoDoPost[]; cuidados: CuidadoDoPost[] | null }
export interface DiaPublicoDTO { dia: string; postId: string | null; fotos: FotoDoPost[]; cuidados: CuidadoDoPost[] | null }
export interface PlantaPublicaDTO { planta: PlantaDTO; dono: AutorDTO; dias: DiaPublicoDTO[] }
export interface PerfilDTO extends AutorDTO { bio: string | null; localidade: string | null; eu: boolean; sigo: boolean; contagem: { plantas: number; seguidores: number; seguindo: number }; plantas: PlantaDTO[] }
export interface PaginaDTO<T> { itens: T[]; proximoCursor: string | null }

/** Post/perfil/planta que não existe ou que o leitor não pode ver (vira 404). */
export class NaoEncontrado extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'NaoEncontrado';
  }
}
```
  - `podeVer(dono: { id: string; perfilPublico: boolean }, plantaPublica: boolean, viewerId: string): boolean`
  - `podeVerPerfil(dono: { id: string; perfilPublico: boolean }, viewerId: string): boolean`
  - `mostraCuidados(dono: { id: string; historicoPublico: boolean }, viewerId: string): boolean`
  - `chaveDoDia(plantaId: string, dia: string): string`; `interface ConteudoDoDia { fotos: FotoDoPost[]; cuidados: CuidadoDoPost[] }`; `conteudoPorDia(fotos: FotoLida[], cuidados: CuidadoLido[]): Map<string, ConteudoDoDia>`
  - `paraDia(d: Date): string`; `autorDe(u): AutorDTO`; `plantaDe(p: PlantaLidaBase): PlantaDTO`; `montarPosts(posts: PostLido[], conteudo: Map<string, ConteudoDoDia>, viewerId: string): PostDTO[]`; `linhaDoTempoPublica(plantaId: string, posts: { id: string; dia: Date }[], conteudo: Map<string, ConteudoDoDia>, comCuidados: boolean): DiaPublicoDTO[]`

- [ ] **Step 1: Acrescentar os tipos** (bloco acima) ao fim de `comunidade.types.ts`, com `import type { FotoParaPost } from './dominio/post';` junto dos imports existentes (o arquivo já importa `FotoParaPost` — reaproveitar).

- [ ] **Step 2: Testes**

`dominio/visibilidade.test.ts`:
```ts
import { mostraCuidados, podeVer, podeVerPerfil } from './visibilidade';

const dono = { id: 'a', perfilPublico: true, historicoPublico: true };

describe('podeVer', () => {
  it('outra pessoa vê só com perfil e planta públicos', () => {
    expect(podeVer(dono, true, 'b')).toBe(true);
    expect(podeVer(dono, false, 'b')).toBe(false);
    expect(podeVer({ ...dono, perfilPublico: false }, true, 'b')).toBe(false);
  });
  it('o dono sempre vê', () => {
    expect(podeVer({ ...dono, perfilPublico: false }, false, 'a')).toBe(true);
  });
});

describe('podeVerPerfil', () => {
  it('público para todos, privado só para o dono', () => {
    expect(podeVerPerfil(dono, 'b')).toBe(true);
    expect(podeVerPerfil({ ...dono, perfilPublico: false }, 'b')).toBe(false);
    expect(podeVerPerfil({ ...dono, perfilPublico: false }, 'a')).toBe(true);
  });
});

describe('mostraCuidados', () => {
  it('só com histórico público, salvo para o dono', () => {
    expect(mostraCuidados(dono, 'b')).toBe(true);
    expect(mostraCuidados({ ...dono, historicoPublico: false }, 'b')).toBe(false);
    expect(mostraCuidados({ ...dono, historicoPublico: false }, 'a')).toBe(true);
  });
});
```

`dominio/conteudo.test.ts`:
```ts
import { chaveDoDia, conteudoPorDia } from './conteudo';
import type { CuidadoLido, FotoLida } from '../comunidade.types';

const foto = (over: Partial<FotoLida>): FotoLida => ({
  id: 'f',
  plantaId: 'p1',
  caminhoArquivo: 'https://cdn/f.webp',
  thumbnailUrl: null,
  tipo: 'FOTO',
  dataCaptura: null,
  createdAt: new Date('2026-10-10T15:00:00Z'),
  agenda: null,
  ...over,
});
const cuidado = (over: Partial<CuidadoLido>): CuidadoLido => ({
  plantaId: 'p1',
  dataConcluida: new Date('2026-10-10T15:00:00Z'),
  dataAgendada: new Date('2026-10-10T15:00:00Z'),
  detalhes: null,
  observacaoFutura: null,
  atividade: { nome: 'Poda' },
  ...over,
});

describe('conteudoPorDia', () => {
  it('junta fotos e cuidados da mesma planta no mesmo dia local', () => {
    const mapa = conteudoPorDia([foto({ id: 'f1' })], [cuidado({ detalhes: 'galho alto' })]);
    expect(mapa.get(chaveDoDia('p1', '2026-10-10'))).toEqual({
      fotos: [{ id: 'f1', url: 'https://cdn/f.webp', tipo: 'FOTO', thumbnailUrl: null }],
      cuidados: [{ atividade: 'Poda', detalhes: 'galho alto', observacao: null }],
    });
  });
  it('fotos em ordem cronológica', () => {
    const mapa = conteudoPorDia(
      [foto({ id: 'tarde', createdAt: new Date('2026-10-10T20:00:00Z') }), foto({ id: 'manha', createdAt: new Date('2026-10-10T12:00:00Z') })],
      [],
    );
    expect(mapa.get(chaveDoDia('p1', '2026-10-10'))!.fotos.map((f) => f.id)).toEqual(['manha', 'tarde']);
  });
  it('separa plantas e dias; visão futura fica de fora', () => {
    const mapa = conteudoPorDia(
      [foto({ id: 'a' }), foto({ id: 'b', plantaId: 'p2' }), foto({ id: 'c', tipo: 'VISAO_FUTURA' })],
      [cuidado({ dataConcluida: new Date('2026-10-11T15:00:00Z') })],
    );
    expect(mapa.get(chaveDoDia('p1', '2026-10-10'))!.fotos.map((f) => f.id)).toEqual(['a']);
    expect(mapa.get(chaveDoDia('p2', '2026-10-10'))!.fotos.map((f) => f.id)).toEqual(['b']);
    expect(mapa.get(chaveDoDia('p1', '2026-10-11'))).toEqual({ fotos: [], cuidados: [{ atividade: 'Poda', detalhes: null, observacao: null }] });
  });
});
```

`dominio/montar.test.ts`:
```ts
import { chaveDoDia, ConteudoDoDia } from './conteudo';
import { linhaDoTempoPublica, montarPosts } from './montar';
import type { PostLido } from '../comunidade.types';

const usuario = { id: 'a', nome: 'Ana Souza', nomePublico: 'Ana', fotoPerfilUrl: null, perfilPublico: true, historicoPublico: true };
const planta = { id: 'p1', identificador: 3, nome: 'Ficus', fotoCapaUrl: null, plantaPublica: true, especie: null };
const post = (over: Partial<PostLido> = {}): PostLido => ({
  id: 'post1',
  dia: new Date('2026-10-10T00:00:00Z'),
  publicadoEm: new Date('2026-10-10T18:00:00Z'),
  plantaId: 'p1',
  usuario,
  planta,
  ...over,
});
const doDia: ConteudoDoDia = {
  fotos: [{ id: 'f1', url: 'u', tipo: 'FOTO', thumbnailUrl: null }],
  cuidados: [{ atividade: 'Poda', detalhes: 'x', observacao: null }],
};
const mapa = (entradas: [string, ConteudoDoDia][]) => new Map(entradas);

describe('montarPosts', () => {
  it('monta o DTO com nome público, planta sem a flag e dia em texto', () => {
    const [dto] = montarPosts([post()], mapa([[chaveDoDia('p1', '2026-10-10'), doDia]]), 'b');
    expect(dto).toEqual({
      id: 'post1',
      dia: '2026-10-10',
      publicadoEm: new Date('2026-10-10T18:00:00Z'),
      autor: { id: 'a', nome: 'Ana', fotoPerfilUrl: null },
      planta: { id: 'p1', identificador: 3, nome: 'Ficus', fotoCapaUrl: null, especie: null },
      fotos: doDia.fotos,
      cuidados: doDia.cuidados,
    });
  });
  it('sem nome público usa o nome', () => {
    const [dto] = montarPosts([post({ usuario: { ...usuario, nomePublico: null } })], mapa([[chaveDoDia('p1', '2026-10-10'), doDia]]), 'b');
    expect(dto.autor.nome).toBe('Ana Souza');
  });
  it('histórico privado: cuidados null para os outros, visíveis para o dono', () => {
    const privado = post({ usuario: { ...usuario, historicoPublico: false } });
    const conteudo = mapa([[chaveDoDia('p1', '2026-10-10'), doDia]]);
    expect(montarPosts([privado], conteudo, 'b')[0].cuidados).toBeNull();
    expect(montarPosts([privado], conteudo, 'a')[0].cuidados).toEqual(doDia.cuidados);
  });
  it('dia que ficou sem fotos não vira card vazio', () => {
    expect(montarPosts([post()], mapa([[chaveDoDia('p1', '2026-10-10'), { fotos: [], cuidados: doDia.cuidados }]]), 'b')).toEqual([]);
    expect(montarPosts([post()], mapa([]), 'b')).toEqual([]);
  });
});

describe('linhaDoTempoPublica', () => {
  const soCuidado: ConteudoDoDia = { fotos: [], cuidados: [{ atividade: 'Rega', detalhes: null, observacao: null }] };
  const conteudo = mapa([
    [chaveDoDia('p1', '2026-10-10'), doDia],
    [chaveDoDia('p1', '2026-10-12'), soCuidado],
    [chaveDoDia('p2', '2026-10-11'), doDia],
  ]);
  const posts = [{ id: 'post1', dia: new Date('2026-10-10T00:00:00Z') }];

  it('com cuidados: dias com foto (com post) e dias só de cuidado, mais novo primeiro, só da planta', () => {
    expect(linhaDoTempoPublica('p1', posts, conteudo, true)).toEqual([
      { dia: '2026-10-12', postId: null, fotos: [], cuidados: soCuidado.cuidados },
      { dia: '2026-10-10', postId: 'post1', fotos: doDia.fotos, cuidados: doDia.cuidados },
    ]);
  });
  it('sem cuidados: só dias com foto, cuidados null', () => {
    expect(linhaDoTempoPublica('p1', posts, conteudo, false)).toEqual([
      { dia: '2026-10-10', postId: 'post1', fotos: doDia.fotos, cuidados: null },
    ]);
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `cd server && npx jest comunidade/dominio`
Expected: FAIL — módulos `./visibilidade`, `./conteudo`, `./montar` não existem (o `post.test.ts` da fase 1 continua passando).

- [ ] **Step 4: Implementar**

`dominio/visibilidade.ts`:
```ts
// Quem vê o quê na Comunidade (o dono sempre vê o que é seu).

/** Post ou planta de outra pessoa: só com perfil e planta públicos. */
export const podeVer = (dono: { id: string; perfilPublico: boolean }, plantaPublica: boolean, viewerId: string) =>
  dono.id === viewerId || (dono.perfilPublico && plantaPublica);

export const podeVerPerfil = (dono: { id: string; perfilPublico: boolean }, viewerId: string) =>
  dono.id === viewerId || dono.perfilPublico;

/** Cuidados nos posts e na página da planta: só com o histórico público. */
export const mostraCuidados = (dono: { id: string; historicoPublico: boolean }, viewerId: string) =>
  dono.id === viewerId || dono.historicoPublico;
```

`dominio/conteudo.ts`:
```ts
import { diaDoPost, diaLocal } from './post';
import type { CuidadoDoPost, CuidadoLido, FotoDoPost, FotoLida } from '../comunidade.types';

export interface ConteudoDoDia {
  fotos: FotoDoPost[];
  cuidados: CuidadoDoPost[];
}

export const chaveDoDia = (plantaId: string, dia: string) => `${plantaId}|${dia}`;

/** Fotos e cuidados concluídos agrupados por planta + dia (mesma regra de dia do post). Fotos em ordem cronológica. */
export function conteudoPorDia(fotos: FotoLida[], cuidados: CuidadoLido[]): Map<string, ConteudoDoDia> {
  const mapa = new Map<string, ConteudoDoDia>();
  const doDia = (chave: string) => {
    let c = mapa.get(chave);
    if (!c) mapa.set(chave, (c = { fotos: [], cuidados: [] }));
    return c;
  };
  const momento = (f: FotoLida) => (f.dataCaptura ?? f.createdAt).getTime();
  for (const f of [...fotos].sort((a, b) => momento(a) - momento(b))) {
    const dia = diaDoPost(f);
    if (dia) doDia(chaveDoDia(f.plantaId, dia)).fotos.push({ id: f.id, url: f.caminhoArquivo, tipo: f.tipo, thumbnailUrl: f.thumbnailUrl });
  }
  for (const c of cuidados) {
    doDia(chaveDoDia(c.plantaId, diaLocal(c.dataConcluida ?? c.dataAgendada))).cuidados.push({
      atividade: c.atividade.nome,
      detalhes: c.detalhes,
      observacao: c.observacaoFutura,
    });
  }
  return mapa;
}
```

`dominio/montar.ts`:
```ts
import { chaveDoDia, ConteudoDoDia } from './conteudo';
import { mostraCuidados } from './visibilidade';
import type { AutorDTO, DiaPublicoDTO, PlantaDTO, PlantaLidaBase, PostDTO, PostLido } from '../comunidade.types';

/** Coluna DATE (meia-noite UTC) → "AAAA-MM-DD". */
export const paraDia = (data: Date) => data.toISOString().slice(0, 10);

export const autorDe = (u: { id: string; nome: string; nomePublico: string | null; fotoPerfilUrl: string | null }): AutorDTO => ({
  id: u.id,
  nome: u.nomePublico || u.nome,
  fotoPerfilUrl: u.fotoPerfilUrl,
});

export const plantaDe = (p: PlantaLidaBase): PlantaDTO => ({
  id: p.id,
  identificador: p.identificador,
  nome: p.nome,
  fotoCapaUrl: p.fotoCapaUrl,
  especie: p.especie,
});

/** Posts prontos para o app; dia que ficou sem foto (corrida com uma exclusão) não vira card vazio. */
export function montarPosts(posts: PostLido[], conteudo: Map<string, ConteudoDoDia>, viewerId: string): PostDTO[] {
  return posts.flatMap((p) => {
    const dia = paraDia(p.dia);
    const doDia = conteudo.get(chaveDoDia(p.plantaId, dia));
    if (!doDia?.fotos.length) return [];
    return [
      {
        id: p.id,
        dia,
        publicadoEm: p.publicadoEm,
        autor: autorDe(p.usuario),
        planta: plantaDe(p.planta),
        fotos: doDia.fotos,
        cuidados: mostraCuidados(p.usuario, viewerId) ? doDia.cuidados : null,
      },
    ];
  });
}

/** Página pública da planta: dias com foto (e, com histórico público, dias só de cuidado), mais novo primeiro. */
export function linhaDoTempoPublica(
  plantaId: string,
  posts: { id: string; dia: Date }[],
  conteudo: Map<string, ConteudoDoDia>,
  comCuidados: boolean,
): DiaPublicoDTO[] {
  const postDoDia = new Map(posts.map((p) => [paraDia(p.dia), p.id]));
  const prefixo = chaveDoDia(plantaId, '');
  return [...conteudo.entries()]
    .filter(([chave]) => chave.startsWith(prefixo))
    .flatMap(([chave, c]) => {
      const dia = chave.slice(prefixo.length);
      const temFotos = c.fotos.length > 0;
      if (!temFotos && !(comCuidados && c.cuidados.length)) return [];
      return [{ dia, postId: temFotos ? postDoDia.get(dia) ?? null : null, fotos: c.fotos, cuidados: comCuidados ? c.cuidados : null }];
    })
    .sort((a, b) => b.dia.localeCompare(a.dia));
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `cd server && npx jest comunidade && npx tsc --noEmit -p tsconfig.json`
Expected: PASS, sem erros de tipo.

- [ ] **Step 6: Commit**

```bash
git add server/src/modules/comunidade
git commit -m "feat(server): regras de leitura da Comunidade (visibilidade, conteúdo do dia, posts)"
```

---

### Task 3: Filtro do feed e repositório de leitura

**Files:**
- Create: `server/src/modules/comunidade/repositories/filtros.ts` (+ `filtros.test.ts`)
- Create: `server/src/modules/comunidade/repositories/prisma-leitura.repository.ts`
- Modify: `server/src/modules/comunidade/comunidade.types.ts` (interface do repositório)

**Interfaces:**
- Consumes: tipos da Task 2.
- Produces:
```ts
export interface LeituraComunidadeRepository {
  feed(viewerId: string, aba: AbaFeed, cursor: string | undefined, limite: number): Promise<PostLido[]>;
  post(id: string): Promise<PostLido | null>;
  /** Posts das plantas públicas do usuário (inclui os fora do feed), por dia desc. */
  postsDoUsuario(usuarioId: string, cursor: string | undefined, limite: number): Promise<PostLido[]>;
  conteudo(plantaIds: string[]): Promise<{ fotos: FotoLida[]; cuidados: CuidadoLido[] }>;
  perfil(usuarioId: string, viewerId: string): Promise<PerfilLido | null>;
  plantasPublicas(usuarioId: string): Promise<PlantaLidaBase[]>;
  planta(id: string): Promise<PlantaLida | null>;
  /** Perfis públicos por nome ou nome público (sem diferenciar maiúsculas). */
  buscar(q: string, limite: number): Promise<UsuarioLido[]>;
}
```
  - `filtroDoFeed(viewerId: string, aba: AbaFeed): Prisma.PostWhereInput`

- [ ] **Step 1: Teste do filtro**

`repositories/filtros.test.ts`:
```ts
import { filtroDoFeed } from './filtros';

const visivel = { OR: [{ usuarioId: 'eu' }, { usuario: { perfilPublico: true }, planta: { plantaPublica: true } }] };

describe('filtroDoFeed', () => {
  it('explorar: posts do feed visíveis (meus ou de perfil e planta públicos)', () => {
    expect(filtroDoFeed('eu', 'explorar')).toEqual({ noFeed: false, AND: [visivel] });
  });
  it('seguindo: além disso, só meus ou de quem eu sigo', () => {
    expect(filtroDoFeed('eu', 'seguindo')).toEqual({
      noFeed: false,
      AND: [visivel, { OR: [{ usuarioId: 'eu' }, { usuario: { seguidores: { some: { seguidorId: 'eu' } } } }] }],
    });
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd server && npx jest comunidade/repositories/filtros`
Expected: FAIL — `./filtros` não existe.

- [ ] **Step 3: Implementar o filtro**

`repositories/filtros.ts`:
```ts
import type { Prisma } from '@prisma/client';
import type { AbaFeed } from '../comunidade.types';

/** Onde do feed: só posts no feed e visíveis ao leitor; em Seguindo, só meus e de quem eu sigo. */
export function filtroDoFeed(viewerId: string, aba: AbaFeed): Prisma.PostWhereInput {
  const condicoes: Prisma.PostWhereInput[] = [
    { OR: [{ usuarioId: viewerId }, { usuario: { perfilPublico: true }, planta: { plantaPublica: true } }] },
  ];
  if (aba === 'seguindo') {
    condicoes.push({ OR: [{ usuarioId: viewerId }, { usuario: { seguidores: { some: { seguidorId: viewerId } } } }] });
  }
  return { noFeed: false, AND: condicoes };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd server && npx jest comunidade/repositories/filtros`
Expected: PASS.

- [ ] **Step 5: Interface e repositório Prisma**

Acrescentar a interface `LeituraComunidadeRepository` (bloco "Produces") ao fim de `comunidade.types.ts`.

`repositories/prisma-leitura.repository.ts`:
```ts
import { prisma } from '../../../lib/prisma';
import { filtroDoFeed } from './filtros';
import type { AbaFeed, LeituraComunidadeRepository } from '../comunidade.types';

const usuarioLido = { id: true, nome: true, nomePublico: true, fotoPerfilUrl: true, perfilPublico: true, historicoPublico: true } as const;
const plantaLida = {
  id: true,
  identificador: true,
  nome: true,
  fotoCapaUrl: true,
  plantaPublica: true,
  especie: { select: { nomeComum: true, nomeCientifico: true } },
} as const;
const postLido = { id: true, dia: true, publicadoEm: true, plantaId: true, usuario: { select: usuarioLido }, planta: { select: plantaLida } } as const;

/** Página por cursor (id do último item da página anterior); a ordem tem `id` no fim para ser estável. */
const paginar = (cursor: string | undefined, limite: number) => ({ take: limite, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) });

export class PrismaLeituraComunidadeRepository implements LeituraComunidadeRepository {
  feed(viewerId: string, aba: AbaFeed, cursor: string | undefined, limite: number) {
    return prisma.post.findMany({
      where: filtroDoFeed(viewerId, aba),
      orderBy: [{ publicadoEm: 'desc' }, { id: 'desc' }],
      select: postLido,
      ...paginar(cursor, limite),
    });
  }

  post(id: string) {
    return prisma.post.findUnique({ where: { id }, select: postLido });
  }

  postsDoUsuario(usuarioId: string, cursor: string | undefined, limite: number) {
    return prisma.post.findMany({
      where: { usuarioId, planta: { plantaPublica: true } },
      orderBy: [{ dia: 'desc' }, { id: 'desc' }],
      select: postLido,
      ...paginar(cursor, limite),
    });
  }

  // Em sequência (não Promise.all), como o resto do projeto
  async conteudo(plantaIds: string[]) {
    const fotos = await prisma.foto.findMany({
      where: { plantaId: { in: plantaIds }, tipo: { not: 'VISAO_FUTURA' } },
      select: {
        id: true,
        plantaId: true,
        caminhoArquivo: true,
        thumbnailUrl: true,
        tipo: true,
        dataCaptura: true,
        createdAt: true,
        agenda: { select: { status: true, dataConcluida: true, dataAgendada: true } },
      },
    });
    const cuidados = await prisma.agenda.findMany({
      where: { plantaId: { in: plantaIds }, status: 'CONCLUIDO' },
      orderBy: [{ dataConcluida: 'asc' }, { createdAt: 'asc' }],
      select: {
        plantaId: true,
        dataConcluida: true,
        dataAgendada: true,
        detalhes: true,
        observacaoFutura: true,
        atividade: { select: { nome: true } },
      },
    });
    // plantaId não é nulo: o filtro acima só traz fotos dessas plantas
    return { fotos: fotos.map((f) => ({ ...f, plantaId: f.plantaId! })), cuidados };
  }

  async perfil(usuarioId: string, viewerId: string) {
    const u = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        ...usuarioLido,
        bio: true,
        localidade: true,
        _count: { select: { seguidores: true, seguindo: true, plantas: { where: { plantaPublica: true } } } },
      },
    });
    if (!u) return null;
    const sigo =
      viewerId !== usuarioId &&
      !!(await prisma.amizade.findUnique({
        where: { seguidorId_seguidoId: { seguidorId: viewerId, seguidoId: usuarioId } },
        select: { seguidorId: true },
      }));
    const { _count, ...resto } = u;
    return { ...resto, plantas: _count.plantas, seguidores: _count.seguidores, seguindo: _count.seguindo, sigo };
  }

  plantasPublicas(usuarioId: string) {
    return prisma.planta.findMany({ where: { usuarioId, plantaPublica: true }, orderBy: { identificador: 'asc' }, select: plantaLida });
  }

  planta(id: string) {
    return prisma.planta.findUnique({
      where: { id },
      select: { ...plantaLida, usuario: { select: usuarioLido }, posts: { select: { id: true, dia: true } } },
    });
  }

  buscar(q: string, limite: number) {
    return prisma.usuario.findMany({
      where: {
        perfilPublico: true,
        OR: [{ nomePublico: { contains: q, mode: 'insensitive' } }, { nome: { contains: q, mode: 'insensitive' } }],
      },
      orderBy: { nomePublico: 'asc' },
      take: limite,
      select: usuarioLido,
    });
  }
}
```

- [ ] **Step 6: Conferir tipos**

Run: `cd server && npx tsc --noEmit -p tsconfig.json`
Expected: sem erros (se algum retorno do Prisma não bater com a interface — ex. `especie.nomeComum` não-nulo —, ajustar o tipo em `comunidade.types.ts` para o que o Prisma devolve, sem `as any`, e anotar a decisão).

- [ ] **Step 7: Commit**

```bash
git add server/src/modules/comunidade
git commit -m "feat(server): leitura da Comunidade (feed, posts, perfis, plantas, busca)"
```

---

### Task 4: Casos de uso de leitura

**Files:**
- Create: `server/src/modules/comunidade/use-cases/carregar-posts.ts`, `obter-feed.use-case.ts`, `obter-post.use-case.ts`, `obter-perfil.use-case.ts`, `listar-posts-do-perfil.use-case.ts`, `obter-planta-publica.use-case.ts`, `buscar-perfis.use-case.ts`
- Test: `server/src/modules/comunidade/use-cases/leitura.use-cases.test.ts`

**Interfaces:**
- Consumes: `LeituraComunidadeRepository` (Task 3), `conteudoPorDia`, `montarPosts`, `linhaDoTempoPublica`, `autorDe`, `plantaDe`, `podeVer`, `podeVerPerfil`, `mostraCuidados`, `NaoEncontrado` (Task 2).
- Produces:
  - `LIMITE_PAGINA = 20`; `carregarPosts(repo, posts: PostLido[], viewerId): Promise<PostDTO[]>`; `pagina<T>(itens: T[], lidos: { id: string }[]): PaginaDTO<T>`
  - `ObterFeedUseCase.execute(viewerId: string, aba: AbaFeed, cursor?: string): Promise<PaginaDTO<PostDTO>>`
  - `ObterPostUseCase.execute(viewerId: string, id: string): Promise<PostDTO>`
  - `ObterPerfilUseCase.execute(viewerId: string, usuarioId: string): Promise<PerfilDTO>`
  - `ListarPostsDoPerfilUseCase.execute(viewerId: string, usuarioId: string, cursor?: string): Promise<PaginaDTO<PostDTO>>`
  - `ObterPlantaPublicaUseCase.execute(viewerId: string, plantaId: string): Promise<PlantaPublicaDTO>`
  - `BuscarPerfisUseCase.execute(q: string): Promise<AutorDTO[]>`
  - Todos com `constructor(private repo: LeituraComunidadeRepository)`.

- [ ] **Step 1: Testes**

`use-cases/leitura.use-cases.test.ts`:
```ts
import { BuscarPerfisUseCase } from './buscar-perfis.use-case';
import { ListarPostsDoPerfilUseCase } from './listar-posts-do-perfil.use-case';
import { ObterFeedUseCase } from './obter-feed.use-case';
import { ObterPerfilUseCase } from './obter-perfil.use-case';
import { ObterPlantaPublicaUseCase } from './obter-planta-publica.use-case';
import { ObterPostUseCase } from './obter-post.use-case';
import { LeituraComunidadeRepository, PerfilLido, PostLido } from '../comunidade.types';

const usuario = { id: 'a', nome: 'Ana', nomePublico: null, fotoPerfilUrl: null, perfilPublico: true, historicoPublico: true };
const planta = { id: 'p1', identificador: 1, nome: 'Ficus', fotoCapaUrl: null, plantaPublica: true, especie: null };
const post = (over: Partial<PostLido> = {}): PostLido => ({
  id: 'post1',
  dia: new Date('2026-10-10T00:00:00Z'),
  publicadoEm: new Date('2026-10-10T18:00:00Z'),
  plantaId: 'p1',
  usuario,
  planta,
  ...over,
});
const conteudo = {
  fotos: [{ id: 'f1', plantaId: 'p1', caminhoArquivo: 'u', thumbnailUrl: null, tipo: 'FOTO', dataCaptura: null, createdAt: new Date('2026-10-10T15:00:00Z'), agenda: null }],
  cuidados: [{ plantaId: 'p1', dataConcluida: new Date('2026-10-10T15:00:00Z'), dataAgendada: new Date('2026-10-10T15:00:00Z'), detalhes: 'nota', observacaoFutura: null, atividade: { nome: 'Poda' } }],
};
const perfil = (over: Partial<PerfilLido> = {}): PerfilLido => ({
  ...usuario,
  bio: null,
  localidade: null,
  plantas: 2,
  seguidores: 5,
  seguindo: 1,
  sigo: false,
  ...over,
});

let repo: jest.Mocked<LeituraComunidadeRepository>;
beforeEach(() => {
  repo = {
    feed: jest.fn().mockResolvedValue([]),
    post: jest.fn().mockResolvedValue(null),
    postsDoUsuario: jest.fn().mockResolvedValue([]),
    conteudo: jest.fn().mockResolvedValue(conteudo),
    perfil: jest.fn().mockResolvedValue(null),
    plantasPublicas: jest.fn().mockResolvedValue([]),
    planta: jest.fn().mockResolvedValue(null),
    buscar: jest.fn().mockResolvedValue([]),
  };
});

describe('ObterFeedUseCase', () => {
  it('monta os posts com o conteúdo das plantas da página', async () => {
    repo.feed.mockResolvedValue([post()]);
    const r = await new ObterFeedUseCase(repo).execute('b', 'explorar');
    expect(repo.feed).toHaveBeenCalledWith('b', 'explorar', undefined, 20);
    expect(repo.conteudo).toHaveBeenCalledWith(['p1']);
    expect(r.itens).toHaveLength(1);
    expect(r.proximoCursor).toBeNull();
  });
  it('página cheia devolve o cursor do último lido', async () => {
    repo.feed.mockResolvedValue(Array.from({ length: 20 }, (_, i) => post({ id: `post${i}` })));
    const r = await new ObterFeedUseCase(repo).execute('b', 'seguindo', 'x');
    expect(repo.feed).toHaveBeenCalledWith('b', 'seguindo', 'x', 20);
    expect(r.proximoCursor).toBe('post19');
  });
  it('página vazia não consulta conteúdo', async () => {
    const r = await new ObterFeedUseCase(repo).execute('b', 'explorar');
    expect(repo.conteudo).not.toHaveBeenCalled();
    expect(r).toEqual({ itens: [], proximoCursor: null });
  });
});

describe('ObterPostUseCase', () => {
  it('post visível volta montado', async () => {
    repo.post.mockResolvedValue(post());
    const dto = await new ObterPostUseCase(repo).execute('b', 'post1');
    expect(dto.id).toBe('post1');
    expect(dto.cuidados).toEqual([{ atividade: 'Poda', detalhes: 'nota', observacao: null }]);
  });
  it('perfil que ficou privado: 404 para os outros, visível para o dono', async () => {
    repo.post.mockResolvedValue(post({ usuario: { ...usuario, perfilPublico: false } }));
    await expect(new ObterPostUseCase(repo).execute('b', 'post1')).rejects.toThrow('Post não encontrado.');
    await expect(new ObterPostUseCase(repo).execute('a', 'post1')).resolves.toMatchObject({ id: 'post1' });
  });
  it('planta privada ou post inexistente: 404', async () => {
    repo.post.mockResolvedValue(post({ planta: { ...planta, plantaPublica: false } }));
    await expect(new ObterPostUseCase(repo).execute('b', 'post1')).rejects.toMatchObject({ name: 'NaoEncontrado' });
    repo.post.mockResolvedValue(null);
    await expect(new ObterPostUseCase(repo).execute('b', 'x')).rejects.toMatchObject({ name: 'NaoEncontrado' });
  });
  it('histórico privado: sem cuidados para os outros', async () => {
    repo.post.mockResolvedValue(post({ usuario: { ...usuario, historicoPublico: false } }));
    expect((await new ObterPostUseCase(repo).execute('b', 'post1')).cuidados).toBeNull();
  });
});

describe('ObterPerfilUseCase', () => {
  it('perfil público com contagem, plantas e "eu"/"sigo"', async () => {
    repo.perfil.mockResolvedValue(perfil({ sigo: true }));
    repo.plantasPublicas.mockResolvedValue([planta]);
    const p = await new ObterPerfilUseCase(repo).execute('b', 'a');
    expect(repo.perfil).toHaveBeenCalledWith('a', 'b');
    expect(p).toEqual({
      id: 'a',
      nome: 'Ana',
      fotoPerfilUrl: null,
      bio: null,
      localidade: null,
      eu: false,
      sigo: true,
      contagem: { plantas: 2, seguidores: 5, seguindo: 1 },
      plantas: [{ id: 'p1', identificador: 1, nome: 'Ficus', fotoCapaUrl: null, especie: null }],
    });
  });
  it('privado: 404 para os outros, visível para o dono', async () => {
    repo.perfil.mockResolvedValue(perfil({ perfilPublico: false }));
    await expect(new ObterPerfilUseCase(repo).execute('b', 'a')).rejects.toThrow('Perfil não encontrado.');
    await expect(new ObterPerfilUseCase(repo).execute('a', 'a')).resolves.toMatchObject({ eu: true });
  });
});

describe('ListarPostsDoPerfilUseCase', () => {
  it('lista os posts do perfil visível', async () => {
    repo.perfil.mockResolvedValue(perfil());
    repo.postsDoUsuario.mockResolvedValue([post()]);
    const r = await new ListarPostsDoPerfilUseCase(repo).execute('b', 'a');
    expect(repo.postsDoUsuario).toHaveBeenCalledWith('a', undefined, 20);
    expect(r.itens).toHaveLength(1);
  });
  it('perfil privado: 404 sem listar', async () => {
    repo.perfil.mockResolvedValue(perfil({ perfilPublico: false }));
    await expect(new ListarPostsDoPerfilUseCase(repo).execute('b', 'a')).rejects.toMatchObject({ name: 'NaoEncontrado' });
    expect(repo.postsDoUsuario).not.toHaveBeenCalled();
  });
});

describe('ObterPlantaPublicaUseCase', () => {
  const plantaLida = { ...planta, usuario, posts: [{ id: 'post1', dia: new Date('2026-10-10T00:00:00Z') }] };

  it('planta pública com dono e linha do tempo', async () => {
    repo.planta.mockResolvedValue(plantaLida);
    const r = await new ObterPlantaPublicaUseCase(repo).execute('b', 'p1');
    expect(repo.conteudo).toHaveBeenCalledWith(['p1']);
    expect(r.dono).toEqual({ id: 'a', nome: 'Ana', fotoPerfilUrl: null });
    expect(r.dias).toEqual([
      { dia: '2026-10-10', postId: 'post1', fotos: [{ id: 'f1', url: 'u', tipo: 'FOTO', thumbnailUrl: null }], cuidados: [{ atividade: 'Poda', detalhes: 'nota', observacao: null }] },
    ]);
  });
  it('histórico privado: dias sem cuidados', async () => {
    repo.planta.mockResolvedValue({ ...plantaLida, usuario: { ...usuario, historicoPublico: false } });
    const r = await new ObterPlantaPublicaUseCase(repo).execute('b', 'p1');
    expect(r.dias[0].cuidados).toBeNull();
  });
  it('planta privada: 404', async () => {
    repo.planta.mockResolvedValue({ ...plantaLida, plantaPublica: false });
    await expect(new ObterPlantaPublicaUseCase(repo).execute('b', 'p1')).rejects.toThrow('Planta não encontrada.');
  });
});

describe('BuscarPerfisUseCase', () => {
  it('menos de 2 letras não busca', async () => {
    expect(await new BuscarPerfisUseCase(repo).execute(' a ')).toEqual([]);
    expect(repo.buscar).not.toHaveBeenCalled();
  });
  it('busca o termo limpo e devolve autores', async () => {
    repo.buscar.mockResolvedValue([{ ...usuario, nomePublico: 'Aninha' }]);
    expect(await new BuscarPerfisUseCase(repo).execute('  an ')).toEqual([{ id: 'a', nome: 'Aninha', fotoPerfilUrl: null }]);
    expect(repo.buscar).toHaveBeenCalledWith('an', 20);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd server && npx jest leitura.use-cases`
Expected: FAIL — módulos dos casos de uso não existem.

- [ ] **Step 3: Implementar**

`use-cases/carregar-posts.ts`:
```ts
import { conteudoPorDia } from '../dominio/conteudo';
import { montarPosts } from '../dominio/montar';
import type { LeituraComunidadeRepository, PaginaDTO, PostDTO, PostLido } from '../comunidade.types';

export const LIMITE_PAGINA = 20;

/** Lê fotos e cuidados das plantas dos posts (uma vez para a página toda) e monta os DTOs. */
export async function carregarPosts(repo: LeituraComunidadeRepository, posts: PostLido[], viewerId: string): Promise<PostDTO[]> {
  if (!posts.length) return [];
  const { fotos, cuidados } = await repo.conteudo([...new Set(posts.map((p) => p.plantaId))]);
  return montarPosts(posts, conteudoPorDia(fotos, cuidados), viewerId);
}

/** Página cheia → há mais: o cursor é o id do último lido (mesmo que ele tenha saído da montagem). */
export const pagina = <T>(itens: T[], lidos: { id: string }[]): PaginaDTO<T> => ({
  itens,
  proximoCursor: lidos.length === LIMITE_PAGINA ? lidos[lidos.length - 1].id : null,
});
```

`use-cases/obter-feed.use-case.ts`:
```ts
import { carregarPosts, LIMITE_PAGINA, pagina } from './carregar-posts';
import type { AbaFeed, LeituraComunidadeRepository, PaginaDTO, PostDTO } from '../comunidade.types';

export class ObterFeedUseCase {
  constructor(private repo: LeituraComunidadeRepository) {}

  async execute(viewerId: string, aba: AbaFeed, cursor?: string): Promise<PaginaDTO<PostDTO>> {
    const lidos = await this.repo.feed(viewerId, aba, cursor, LIMITE_PAGINA);
    return pagina(await carregarPosts(this.repo, lidos, viewerId), lidos);
  }
}
```

`use-cases/obter-post.use-case.ts`:
```ts
import { carregarPosts } from './carregar-posts';
import { podeVer } from '../dominio/visibilidade';
import { LeituraComunidadeRepository, NaoEncontrado, PostDTO } from '../comunidade.types';

export class ObterPostUseCase {
  constructor(private repo: LeituraComunidadeRepository) {}

  async execute(viewerId: string, id: string): Promise<PostDTO> {
    const post = await this.repo.post(id);
    if (!post || !podeVer(post.usuario, post.planta.plantaPublica, viewerId)) throw new NaoEncontrado('Post não encontrado.');
    const [dto] = await carregarPosts(this.repo, [post], viewerId);
    if (!dto) throw new NaoEncontrado('Post não encontrado.');
    return dto;
  }
}
```

`use-cases/obter-perfil.use-case.ts`:
```ts
import { autorDe, plantaDe } from '../dominio/montar';
import { podeVerPerfil } from '../dominio/visibilidade';
import { LeituraComunidadeRepository, NaoEncontrado, PerfilDTO } from '../comunidade.types';

export class ObterPerfilUseCase {
  constructor(private repo: LeituraComunidadeRepository) {}

  async execute(viewerId: string, usuarioId: string): Promise<PerfilDTO> {
    const p = await this.repo.perfil(usuarioId, viewerId);
    if (!p || !podeVerPerfil(p, viewerId)) throw new NaoEncontrado('Perfil não encontrado.');
    const plantas = await this.repo.plantasPublicas(usuarioId);
    return {
      ...autorDe(p),
      bio: p.bio,
      localidade: p.localidade,
      eu: p.id === viewerId,
      sigo: p.sigo,
      contagem: { plantas: p.plantas, seguidores: p.seguidores, seguindo: p.seguindo },
      plantas: plantas.map(plantaDe),
    };
  }
}
```

`use-cases/listar-posts-do-perfil.use-case.ts`:
```ts
import { carregarPosts, LIMITE_PAGINA, pagina } from './carregar-posts';
import { podeVerPerfil } from '../dominio/visibilidade';
import { LeituraComunidadeRepository, NaoEncontrado, PaginaDTO, PostDTO } from '../comunidade.types';

export class ListarPostsDoPerfilUseCase {
  constructor(private repo: LeituraComunidadeRepository) {}

  async execute(viewerId: string, usuarioId: string, cursor?: string): Promise<PaginaDTO<PostDTO>> {
    const p = await this.repo.perfil(usuarioId, viewerId);
    if (!p || !podeVerPerfil(p, viewerId)) throw new NaoEncontrado('Perfil não encontrado.');
    const lidos = await this.repo.postsDoUsuario(usuarioId, cursor, LIMITE_PAGINA);
    return pagina(await carregarPosts(this.repo, lidos, viewerId), lidos);
  }
}
```

`use-cases/obter-planta-publica.use-case.ts`:
```ts
import { conteudoPorDia } from '../dominio/conteudo';
import { autorDe, linhaDoTempoPublica, plantaDe } from '../dominio/montar';
import { mostraCuidados, podeVer } from '../dominio/visibilidade';
import { LeituraComunidadeRepository, NaoEncontrado, PlantaPublicaDTO } from '../comunidade.types';

export class ObterPlantaPublicaUseCase {
  constructor(private repo: LeituraComunidadeRepository) {}

  async execute(viewerId: string, plantaId: string): Promise<PlantaPublicaDTO> {
    const planta = await this.repo.planta(plantaId);
    if (!planta || !podeVer(planta.usuario, planta.plantaPublica, viewerId)) throw new NaoEncontrado('Planta não encontrada.');
    const { fotos, cuidados } = await this.repo.conteudo([planta.id]);
    return {
      planta: plantaDe(planta),
      dono: autorDe(planta.usuario),
      dias: linhaDoTempoPublica(planta.id, planta.posts, conteudoPorDia(fotos, cuidados), mostraCuidados(planta.usuario, viewerId)),
    };
  }
}
```

`use-cases/buscar-perfis.use-case.ts`:
```ts
import { autorDe } from '../dominio/montar';
import type { AutorDTO, LeituraComunidadeRepository } from '../comunidade.types';

const MINIMO = 2;
const LIMITE = 20;

export class BuscarPerfisUseCase {
  constructor(private repo: LeituraComunidadeRepository) {}

  async execute(q: string): Promise<AutorDTO[]> {
    const termo = q.trim();
    if (termo.length < MINIMO) return [];
    return (await this.repo.buscar(termo, LIMITE)).map(autorDe);
  }
}
```

- [ ] **Step 4: Rodar**

Run: `cd server && npx jest comunidade && npx tsc --noEmit -p tsconfig.json`
Expected: PASS, sem erros de tipo.

- [ ] **Step 5: Commit**

```bash
git add server/src/modules/comunidade/use-cases
git commit -m "feat(server): casos de uso de leitura da Comunidade"
```

---

### Task 5: Rotas `/api/comunidade`

**Files:**
- Create: `server/src/modules/comunidade/comunidade.schema.ts` (+ `comunidade.schema.test.ts`), `comunidade.controller.ts`, `comunidade.router.ts`
- Modify: `server/src/app.ts` (perto da linha 76)

**Interfaces:**
- Consumes: casos de uso da Task 4, `PrismaLeituraComunidadeRepository` (Task 3), `mensagemDoErro` (`server/src/utils/errors.ts`).
- Produces: `GET /api/comunidade/feed?aba=seguindo|explorar&cursor=`, `/posts/:id`, `/usuarios/:id`, `/usuarios/:id/posts?cursor=`, `/plantas/:id`, `/buscar?q=`. 404 `{ error }` para `NaoEncontrado`, 400 `{ error }` para validação.

- [ ] **Step 1: Teste dos schemas**

`comunidade.schema.test.ts`:
```ts
import { buscaSchema, feedSchema, idSchema } from './comunidade.schema';

const UUID = '6f1b4a8e-2f7a-4c1e-9a4b-3d2e1f0a9b8c';

describe('schemas da Comunidade', () => {
  it('feed: aba padrão seguindo e cursor opcional', () => {
    expect(feedSchema.parse({ query: {} }).query).toEqual({ aba: 'seguindo' });
    expect(feedSchema.parse({ query: { aba: 'explorar', cursor: UUID } }).query).toEqual({ aba: 'explorar', cursor: UUID });
  });
  it('feed: aba desconhecida é recusada', () => {
    expect(() => feedSchema.parse({ query: { aba: 'todos' } })).toThrow();
  });
  it('id precisa ser uuid', () => {
    expect(() => idSchema.parse({ params: { id: 'x' } })).toThrow();
    expect(idSchema.parse({ params: { id: UUID } }).params.id).toBe(UUID);
  });
  it('busca: termo vazio por padrão', () => {
    expect(buscaSchema.parse({ query: {} }).query.q).toBe('');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd server && npx jest comunidade.schema`
Expected: FAIL — `./comunidade.schema` não existe.

- [ ] **Step 3: Implementar**

`comunidade.schema.ts`:
```ts
import { z } from 'zod';

const cursor = z.string().uuid('Página inválida.').optional();

export const feedSchema = z.object({
  query: z.object({ aba: z.enum(['seguindo', 'explorar']).default('seguindo'), cursor }),
});

export const idSchema = z.object({
  params: z.object({ id: z.string().uuid('Não encontrado.') }),
});

export const postsDoPerfilSchema = idSchema.extend({
  query: z.object({ cursor }),
});

export const buscaSchema = z.object({
  query: z.object({ q: z.string().max(60).default('') }),
});
```

`comunidade.controller.ts`:
```ts
import { Request, Response } from 'express';
import { buscaSchema, feedSchema, idSchema, postsDoPerfilSchema } from './comunidade.schema';
import { PrismaLeituraComunidadeRepository } from './repositories/prisma-leitura.repository';
import { BuscarPerfisUseCase } from './use-cases/buscar-perfis.use-case';
import { ListarPostsDoPerfilUseCase } from './use-cases/listar-posts-do-perfil.use-case';
import { ObterFeedUseCase } from './use-cases/obter-feed.use-case';
import { ObterPerfilUseCase } from './use-cases/obter-perfil.use-case';
import { ObterPlantaPublicaUseCase } from './use-cases/obter-planta-publica.use-case';
import { ObterPostUseCase } from './use-cases/obter-post.use-case';
import { mensagemDoErro } from '../../utils/errors';

const repo = new PrismaLeituraComunidadeRepository();
const obterFeed = new ObterFeedUseCase(repo);
const obterPost = new ObterPostUseCase(repo);
const obterPerfil = new ObterPerfilUseCase(repo);
const listarPostsDoPerfil = new ListarPostsDoPerfilUseCase(repo);
const obterPlantaPublica = new ObterPlantaPublicaUseCase(repo);
const buscarPerfis = new BuscarPerfisUseCase(repo);

/** Executa a leitura e traduz os erros: invisível/inexistente → 404; o resto (validação) → 400. */
const responder = (ler: (req: Request, viewerId: string) => Promise<unknown>) => async (req: Request, res: Response) => {
  try {
    return res.status(200).json(await ler(req, req.user!.userId));
  } catch (error: any) {
    if (error?.name === 'NaoEncontrado') return res.status(404).json({ error: error.message });
    return res.status(400).json({ error: mensagemDoErro(error, 'Erro ao carregar a comunidade') });
  }
};

export const comunidadeController = {
  feed: responder((req, eu) => {
    const { aba, cursor } = feedSchema.parse(req).query;
    return obterFeed.execute(eu, aba, cursor);
  }),
  post: responder((req, eu) => obterPost.execute(eu, idSchema.parse(req).params.id)),
  perfil: responder((req, eu) => obterPerfil.execute(eu, idSchema.parse(req).params.id)),
  postsDoPerfil: responder((req, eu) => {
    const { params, query } = postsDoPerfilSchema.parse(req);
    return listarPostsDoPerfil.execute(eu, params.id, query.cursor);
  }),
  planta: responder((req, eu) => obterPlantaPublica.execute(eu, idSchema.parse(req).params.id)),
  buscar: responder((req) => buscarPerfis.execute(buscaSchema.parse(req).query.q)),
};
```

`comunidade.router.ts`:
```ts
import { Router } from 'express';
import { comunidadeController } from './comunidade.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const comunidadeRouter = Router();
comunidadeRouter.use(authMiddleware);

comunidadeRouter.get('/feed', comunidadeController.feed);
comunidadeRouter.get('/posts/:id', comunidadeController.post);
comunidadeRouter.get('/usuarios/:id', comunidadeController.perfil);
comunidadeRouter.get('/usuarios/:id/posts', comunidadeController.postsDoPerfil);
comunidadeRouter.get('/plantas/:id', comunidadeController.planta);
comunidadeRouter.get('/buscar', comunidadeController.buscar);

export default comunidadeRouter;
```

`app.ts`: importar `import comunidadeRouter from './modules/comunidade/comunidade.router';` junto dos outros e, depois de `app.use('/api/amizades', amizadeRouter);`, `app.use('/api/comunidade', comunidadeRouter);`.

- [ ] **Step 4: Rodar**

Run: `cd server && npm test && npx tsc --noEmit -p tsconfig.json`
Expected: PASS.

- [ ] **Step 5: Conferir no Docker**

Run: `docker restart bonsai_api`; com um JWT local (`docker compose exec -T api node -e "console.log(require('jsonwebtoken').sign({userId:'<id>'}, process.env.JWT_SECRET, {expiresIn:'10m'}))"`, `<id>` de `teste.web@bonsai.test`):
- `curl -s localhost:3000/api/comunidade/feed?aba=explorar -H "Authorization: Bearer $TOKEN"` → `{"itens":[...],"proximoCursor":null}` (200)
- `curl -s -o /dev/null -w "%{http_code}" localhost:3000/api/comunidade/posts/6f1b4a8e-2f7a-4c1e-9a4b-3d2e1f0a9b8c -H ...` → `404`
- `curl -s localhost:3000/api/comunidade/buscar?q=te -H ...` → `[...]` (200)
- `curl -s -o /dev/null -w "%{http_code}" "localhost:3000/api/comunidade/feed?aba=todos" -H ...` → `400`
Expected: como indicado.

- [ ] **Step 6: Commit**

```bash
git add server/src/modules/comunidade server/src/app.ts
git commit -m "feat(server): rotas de leitura da Comunidade"
```

---

### Task 6: Web — tipos, chamadas, hooks e regras puras

**Files:**
- Modify: `web/src/types.ts`, `web/src/lib/endpoints.ts`, `web/src/lib/queries.ts`, `web/src/lib/comunidade.ts`, `web/src/lib/format.ts`, `web/src/lib/api.ts`
- Test: `web/src/lib/comunidade.test.ts`, `web/src/lib/format.test.ts`, `web/src/lib/api.test.ts`

**Interfaces:**
- Produces:
```ts
// types.ts
export type AbaFeed = 'seguindo' | 'explorar';
export interface AutorComunidade { id: string; nome: string; fotoPerfilUrl: string | null }
export interface PlantaComunidade { id: string; identificador: number; nome: string | null; fotoCapaUrl: string | null; especie: { nomeComum: string | null; nomeCientifico: string | null } | null }
export interface FotoDoPost { id: string; url: string; tipo: TipoMidia; thumbnailUrl: string | null }
export interface CuidadoDoPost { atividade: string; detalhes: string | null; observacao: string | null }
export interface PostComunidade { id: string; dia: string; publicadoEm: string; autor: AutorComunidade; planta: PlantaComunidade; fotos: FotoDoPost[]; cuidados: CuidadoDoPost[] | null }
export interface Pagina<T> { itens: T[]; proximoCursor: string | null }
export interface PerfilPublico extends AutorComunidade { bio: string | null; localidade: string | null; eu: boolean; sigo: boolean; contagem: { plantas: number; seguidores: number; seguindo: number }; plantas: PlantaComunidade[] }
export interface DiaPublico { dia: string; postId: string | null; fotos: FotoDoPost[]; cuidados: CuidadoDoPost[] | null }
export interface PlantaPublica { planta: PlantaComunidade; dono: AutorComunidade; dias: DiaPublico[] }
```
  - `comunidadeApi.{feed(aba, cursor?), post(id), perfil(id), postsDoPerfil(id, cursor?), planta(id), buscar(q), seguir(id), deixarDeSeguir(id)}`
  - `keys.comunidade`, `keys.feed(aba)`, `keys.post(id)`, `keys.perfilPublico(id)`, `keys.postsDoPerfil(id)`, `keys.plantaPublica(id)`, `keys.buscaPerfis(q)`
  - `useFeed(aba)`, `usePost(id)`, `usePerfilPublico(id)`, `usePostsDoPerfil(id)`, `usePlantaPublica(id)`, `useBuscaPerfis(q)`
  - `agruparFeed(posts: PostComunidade[]): ItemFeed[]`, `type ItemFeed = { tipo: 'post'; post: PostComunidade } | { tipo: 'grupo'; chave: string; autor: AutorComunidade; posts: PostComunidade[] }`, `capaDoPost(post): string | null`
  - `tempoRelativo(iso: string, agora?: Date): string` (format.ts)
  - `ehNaoEncontrado(error: unknown): boolean` (api.ts)

- [ ] **Step 1: Testes**

Acrescentar a `web/src/lib/comunidade.test.ts`:
```ts
import { agruparFeed, capaDoPost } from './comunidade';
import type { PostComunidade } from '@/types';

const post = (id: string, autor: string, publicadoEm: string, over: Partial<PostComunidade> = {}): PostComunidade => ({
  id,
  dia: publicadoEm.slice(0, 10),
  publicadoEm,
  autor: { id: autor, nome: autor, fotoPerfilUrl: null },
  planta: { id: `p-${id}`, identificador: 1, nome: null, fotoCapaUrl: null, especie: null },
  fotos: [{ id: `f-${id}`, url: `u-${id}`, tipo: 'FOTO', thumbnailUrl: null }],
  cuidados: null,
  ...over,
});

describe('agruparFeed', () => {
  it('3+ seguidos da mesma pessoa no mesmo dia viram um grupo', () => {
    const posts = [post('1', 'a', '2026-10-13T15:00:00'), post('2', 'a', '2026-10-13T14:00:00'), post('3', 'a', '2026-10-13T13:00:00')];
    expect(agruparFeed(posts)).toEqual([{ tipo: 'grupo', chave: '1', autor: posts[0].autor, posts }]);
  });
  it('2 seguidos ficam soltos', () => {
    const posts = [post('1', 'a', '2026-10-13T15:00:00'), post('2', 'a', '2026-10-13T14:00:00')];
    expect(agruparFeed(posts).map((i) => i.tipo)).toEqual(['post', 'post']);
  });
  it('outra pessoa no meio quebra a sequência', () => {
    const posts = [
      post('1', 'a', '2026-10-13T15:00:00'),
      post('2', 'a', '2026-10-13T14:00:00'),
      post('3', 'b', '2026-10-13T13:30:00'),
      post('4', 'a', '2026-10-13T13:00:00'),
    ];
    expect(agruparFeed(posts).map((i) => i.tipo)).toEqual(['post', 'post', 'post', 'post']);
  });
  it('dias diferentes não se juntam', () => {
    const posts = [post('1', 'a', '2026-10-13T12:00:00'), post('2', 'a', '2026-10-13T11:00:00'), post('3', 'a', '2026-10-12T12:00:00')];
    expect(agruparFeed(posts).map((i) => i.tipo)).toEqual(['post', 'post', 'post']);
  });
});

describe('capaDoPost', () => {
  it('primeira foto; vídeo usa a miniatura', () => {
    expect(capaDoPost(post('1', 'a', '2026-10-13T12:00:00'))).toBe('u-1');
    const video = post('2', 'a', '2026-10-13T12:00:00', { fotos: [{ id: 'v', url: 'v.mp4', tipo: 'VIDEO', thumbnailUrl: 'v.webp' }] });
    expect(capaDoPost(video)).toBe('v.webp');
  });
});
```
(juntar os imports com os que o arquivo já tem: `import { agruparFeed, capaDoPost, modoPlantas } from './comunidade';`.)

Acrescentar a `web/src/lib/format.test.ts`:
```ts
describe('tempoRelativo', () => {
  const agora = new Date('2026-10-13T15:00:00');
  it.each([
    ['2026-10-13T14:59:40', 'agora'],
    ['2026-10-13T14:55:00', 'há 5 min'],
    ['2026-10-13T12:00:00', 'há 3 h'],
    ['2026-10-12T14:00:00', 'ontem'],
    ['2026-10-10T15:00:00', 'há 3 dias'],
  ])('%s → %s', (iso, esperado) => {
    expect(tempoRelativo(iso, agora)).toBe(esperado);
  });
  it('depois de uma semana, a data curta', () => {
    expect(tempoRelativo('2026-09-01T15:00:00', agora)).toBe(dataCurta('2026-09-01T15:00:00'));
  });
});
```
(acrescentar `tempoRelativo` e `dataCurta` ao import de `./format` no topo do arquivo.)

Acrescentar a `web/src/lib/api.test.ts`:
```ts
describe('ehNaoEncontrado', () => {
  it('só resposta 404', () => {
    expect(ehNaoEncontrado(new AxiosError('x', 'ERR_BAD_REQUEST', undefined, undefined, resposta(404)))).toBe(true);
    expect(ehNaoEncontrado(new AxiosError('x', 'ERR_BAD_REQUEST', undefined, undefined, resposta(400)))).toBe(false);
    expect(ehNaoEncontrado(new AxiosError('Network Error', 'ERR_NETWORK'))).toBe(false);
    expect(ehNaoEncontrado(new Error('x'))).toBe(false);
  });
});
```
(import: `import { ehErroDeRede, ehNaoEncontrado } from './api';`.)

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd web && npx vitest run src/lib/comunidade.test.ts src/lib/format.test.ts src/lib/api.test.ts`
Expected: FAIL — `agruparFeed`, `capaDoPost`, `tempoRelativo`, `ehNaoEncontrado` não exportados.

- [ ] **Step 3: Implementar**

`web/src/types.ts`: acrescentar o bloco de tipos do "Produces" (fim do arquivo).

`web/src/lib/api.ts`, depois de `ehErroDeRede`:
```ts
/** O servidor respondeu 404 (na Comunidade: não existe ou não é visível para você). */
export function ehNaoEncontrado(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}
```

`web/src/lib/format.ts`, depois de `distanciaRelativa`:
```ts
/** Para posts: "agora", "há 5 min", "há 3 h", "ontem", "há 3 dias"; passada uma semana, a data curta. */
export function tempoRelativo(iso: string, agora = new Date()): string {
  const min = Math.floor((agora.getTime() - new Date(iso).getTime()) / 60_000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return 'ontem';
  if (dias < 7) return `há ${dias} dias`;
  return dataCurta(iso);
}
```

`web/src/lib/comunidade.ts` (acrescentar):
```ts
import { toDateInput } from '@/lib/format';
import type { AutorComunidade, PostComunidade } from '@/types';

export type ItemFeed =
  | { tipo: 'post'; post: PostComunidade }
  | { tipo: 'grupo'; chave: string; autor: AutorComunidade; posts: PostComunidade[] };

/** A partir de quantos posts seguidos da mesma pessoa no mesmo dia o feed junta num cartão. */
export const MINIMO_PARA_AGRUPAR = 3;

/** Junta 3+ posts seguidos da mesma pessoa no mesmo dia (de publicação, fuso do aparelho) num cartão só. */
export function agruparFeed(posts: PostComunidade[]): ItemFeed[] {
  const itens: ItemFeed[] = [];
  for (let i = 0; i < posts.length; ) {
    const primeiro = posts[i];
    const dia = toDateInput(primeiro.publicadoEm);
    let fim = i + 1;
    while (fim < posts.length && posts[fim].autor.id === primeiro.autor.id && toDateInput(posts[fim].publicadoEm) === dia) fim++;
    const sequencia = posts.slice(i, fim);
    if (sequencia.length >= MINIMO_PARA_AGRUPAR) itens.push({ tipo: 'grupo', chave: primeiro.id, autor: primeiro.autor, posts: sequencia });
    else itens.push(...sequencia.map((post) => ({ tipo: 'post' as const, post })));
    i = fim;
  }
  return itens;
}

/** Imagem que representa o post em grades e miniaturas (vídeo usa a miniatura dele). */
export function capaDoPost(post: PostComunidade): string | null {
  const f = post.fotos[0];
  if (!f) return null;
  return f.tipo === 'VIDEO' ? f.thumbnailUrl : f.url;
}
```
(o `import type { Planta }` existente vira `import type { AutorComunidade, Planta, PostComunidade } from '@/types';`.)

`web/src/lib/endpoints.ts` (acrescentar ao fim; importar os tipos novos no bloco `import type { ... } from '@/types'`):
```ts
export const comunidadeApi = {
  feed: (aba: AbaFeed, cursor?: string) => data<Pagina<PostComunidade>>(api.get('/comunidade/feed', { params: { aba, cursor } })),
  post: (id: string) => data<PostComunidade>(api.get(`/comunidade/posts/${id}`)),
  perfil: (id: string) => data<PerfilPublico>(api.get(`/comunidade/usuarios/${id}`)),
  postsDoPerfil: (id: string, cursor?: string) =>
    data<Pagina<PostComunidade>>(api.get(`/comunidade/usuarios/${id}/posts`, { params: { cursor } })),
  planta: (id: string) => data<PlantaPublica>(api.get(`/comunidade/plantas/${id}`)),
  buscar: (q: string) => data<AutorComunidade[]>(api.get('/comunidade/buscar', { params: { q } })),
  seguir: (id: string) => api.post(`/amizades/follow/${id}`),
  deixarDeSeguir: (id: string) => api.delete(`/amizades/unfollow/${id}`),
};
```

`web/src/lib/queries.ts`: no objeto `keys`, acrescentar:
```ts
  comunidade: ['comunidade'] as const,
  feed: (aba: AbaFeed) => ['comunidade', 'feed', aba] as const,
  post: (id: string) => ['comunidade', 'post', id] as const,
  perfilPublico: (id: string) => ['comunidade', 'perfil', id] as const,
  postsDoPerfil: (id: string) => ['comunidade', 'perfil', id, 'posts'] as const,
  plantaPublica: (id: string) => ['comunidade', 'planta', id] as const,
  buscaPerfis: (q: string) => ['comunidade', 'busca', q] as const,
```
e ao fim do arquivo (importar `useInfiniteQuery` de `@tanstack/react-query`, `comunidadeApi` de `./endpoints` e `AbaFeed` de `@/types`):
```ts
const proximaPagina = (p: Pagina<unknown>) => p.proximoCursor ?? undefined;

export const useFeed = (aba: AbaFeed) =>
  useInfiniteQuery({
    queryKey: keys.feed(aba),
    queryFn: ({ pageParam }) => comunidadeApi.feed(aba, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: proximaPagina,
  });

export const usePost = (id: string) => useQuery({ queryKey: keys.post(id), queryFn: () => comunidadeApi.post(id), enabled: !!id, retry: false });

export const usePerfilPublico = (id: string) =>
  useQuery({ queryKey: keys.perfilPublico(id), queryFn: () => comunidadeApi.perfil(id), enabled: !!id, retry: false });

export const usePostsDoPerfil = (id: string, enabled = true) =>
  useInfiniteQuery({
    queryKey: keys.postsDoPerfil(id),
    queryFn: ({ pageParam }) => comunidadeApi.postsDoPerfil(id, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: proximaPagina,
    enabled: !!id && enabled,
  });

export const usePlantaPublica = (id: string) =>
  useQuery({ queryKey: keys.plantaPublica(id), queryFn: () => comunidadeApi.planta(id), enabled: !!id, retry: false });

export const useBuscaPerfis = (q: string) =>
  useQuery({ queryKey: keys.buscaPerfis(q), queryFn: () => comunidadeApi.buscar(q), enabled: q.length >= 2, staleTime: 30_000 });
```
(`Pagina` também importado de `@/types`.)

- [ ] **Step 4: Rodar**

Run: `cd web && npm test && npx tsc -b`
Expected: PASS e sem erros de tipo.

- [ ] **Step 5: Commit**

```bash
git add web/src/types.ts web/src/lib
git commit -m "feat(web): chamadas, hooks e regras do feed da Comunidade"
```

---

### Task 7: Web — componentes do post

**Files:**
- Create: `web/src/lib/useFimDaLista.ts`
- Create: `web/src/components/comunidade/FotosDoPost.tsx`, `CuidadosDoPost.tsx`, `CardPost.tsx`, `CardGrupo.tsx`, `FaixaPerfilPrivado.tsx`, `GradePosts.tsx`

**Interfaces:**
- Consumes: tipos e `capaDoPost`, `tempoRelativo`, `usePostsDoPerfil` (Task 6); `Avatar`, `Spinner` (`components/ui.tsx`); `Icone` + `iconeDaAtividade`; `plantaCodigoNome`, `dataLonga`.
- Produces: `useFimDaLista(aoChegar: () => void, deps: unknown[]): RefObject<HTMLDivElement>`; `FotosDoPost({ fotos })`, `CuidadosDoPost({ cuidados })`, `CardPost({ post })`, `CardGrupo({ autor, posts })`, `FaixaPerfilPrivado()`, `GradePosts({ usuarioId })`.

Sem teste de componente (o projeto não testa componentes); a verificação é por build/lint e no navegador (Task 10).

- [ ] **Step 1: `useFimDaLista`**

```ts
import { useEffect, useRef } from 'react';

/** Chama `aoChegar` quando o sentinela (o ref devolvido) se aproxima da tela; refaz a observação quando `deps` muda. */
export function useFimDaLista(aoChegar: () => void, deps: unknown[]) {
  const ref = useRef<HTMLDivElement>(null);
  const chamar = useRef(aoChegar);
  useEffect(() => {
    chamar.current = aoChegar;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observador = new IntersectionObserver((e) => e[0]?.isIntersecting && chamar.current(), { rootMargin: '600px' });
    observador.observe(el);
    return () => observador.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}
```

- [ ] **Step 2: Fotos e cuidados**

`FotosDoPost.tsx`:
```tsx
import { useState } from 'react';
import type { FotoDoPost } from '@/types';

/** Fotos do post lado a lado (desliza), quadradas, com pontinhos quando há mais de uma. */
export function FotosDoPost({ fotos }: { fotos: FotoDoPost[] }) {
  const [atual, setAtual] = useState(0);
  return (
    <div className="relative">
      <div
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={(e) => setAtual(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
      >
        {fotos.map((f) => (
          <div key={f.id} className="aspect-square w-full shrink-0 snap-center bg-vazio">
            {f.tipo === 'VIDEO' ? (
              <video src={f.url} poster={f.thumbnailUrl ?? undefined} controls playsInline preload="metadata" className="size-full object-cover" />
            ) : (
              <img src={f.url} alt="" loading="lazy" className="size-full object-cover" />
            )}
          </div>
        ))}
      </div>
      {fotos.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5">
          {fotos.map((f, i) => (
            <span key={f.id} className={`size-1.5 rounded-full ${i === atual ? 'bg-white' : 'bg-white/50'}`} />
          ))}
        </div>
      )}
    </div>
  );
}
```

`CuidadosDoPost.tsx`:
```tsx
import { useState } from 'react';
import { Icone } from '@/components/Icone';
import { iconeDaAtividade } from '@/lib/icones';
import type { CuidadoDoPost } from '@/types';

const LIMITE_RECOLHIDO = 120;

/** Atividades do dia com o ícone de cada uma e as notas (recolhidas quando longas). */
export function CuidadosDoPost({ cuidados }: { cuidados: CuidadoDoPost[] | null }) {
  const [aberto, setAberto] = useState(false);
  if (!cuidados?.length) return null;
  const atividades = [...new Set(cuidados.map((c) => c.atividade))];
  const notas = [...new Set(cuidados.flatMap((c) => [c.detalhes, c.observacao]).filter((n): n is string => !!n?.trim()))].join('\n');
  const longa = notas.length > LIMITE_RECOLHIDO;
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {atividades.map((a) => (
          <span key={a} className="flex items-center gap-1.5 text-sm font-medium">
            <Icone nome={iconeDaAtividade(a)} size={18} /> {a}
          </span>
        ))}
      </div>
      {notas && (
        <p className={`whitespace-pre-line text-sm text-ink/80 ${longa && !aberto ? 'line-clamp-2' : ''}`}>{notas}</p>
      )}
      {longa && !aberto && (
        <button type="button" onClick={() => setAberto(true)} className="text-sm font-medium text-muted">
          ver mais
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Cartões**

`CardPost.tsx`:
```tsx
import { Link } from 'react-router';
import { Avatar } from '@/components/ui';
import { CuidadosDoPost } from './CuidadosDoPost';
import { FotosDoPost } from './FotosDoPost';
import { dataLonga, plantaCodigoNome, tempoRelativo } from '@/lib/format';
import type { PostComunidade } from '@/types';

/** Um post: quem, qual planta, fotos do dia e os cuidados (quando o histórico é público). */
export function CardPost({ post }: { post: PostComunidade }) {
  return (
    <article className="card overflow-hidden">
      <header className="flex items-center gap-3 p-3">
        <Link to={`/comunidade/u/${post.autor.id}`} aria-label={`Perfil de ${post.autor.nome}`}>
          <Avatar url={post.autor.fotoPerfilUrl} nome={post.autor.nome} size={36} />
        </Link>
        <div className="min-w-0 flex-1 leading-tight">
          <Link to={`/comunidade/u/${post.autor.id}`} className="block truncate font-semibold">
            {post.autor.nome}
          </Link>
          <Link to={`/comunidade/planta/${post.planta.id}`} className="block truncate text-xs text-muted">
            {plantaCodigoNome(post.planta)}
          </Link>
        </div>
        <time className="shrink-0 text-xs text-muted" dateTime={post.publicadoEm}>
          {tempoRelativo(post.publicadoEm)}
        </time>
      </header>
      <FotosDoPost fotos={post.fotos} />
      <div className="space-y-2 p-3">
        <CuidadosDoPost cuidados={post.cuidados} />
        <Link to={`/comunidade/post/${post.id}`} className="block text-xs text-muted">
          {dataLonga(`${post.dia}T12:00:00`)}
        </Link>
      </div>
    </article>
  );
}
```

`CardGrupo.tsx`:
```tsx
import { useState } from 'react';
import { Avatar } from '@/components/ui';
import { CardPost } from './CardPost';
import { capaDoPost } from '@/lib/comunidade';
import { tempoRelativo } from '@/lib/format';
import type { AutorComunidade, PostComunidade } from '@/types';

const MINIATURAS = 8;

/** Vários posts seguidos da mesma pessoa no mesmo dia: um cartão com miniaturas, que abre nos posts. */
export function CardGrupo({ autor, posts }: { autor: AutorComunidade; posts: PostComunidade[] }) {
  const [aberto, setAberto] = useState(false);
  if (aberto) return <>{posts.map((p) => <CardPost key={p.id} post={p} />)}</>;
  return (
    <button type="button" onClick={() => setAberto(true)} className="card block w-full p-3 text-left">
      <div className="flex items-center gap-3">
        <Avatar url={autor.fotoPerfilUrl} nome={autor.nome} size={36} />
        <p className="min-w-0 flex-1 text-sm">
          <span className="font-semibold">{autor.nome}</span> cuidou de {posts.length} plantas
          <span className="block text-xs text-muted">{tempoRelativo(posts[0].publicadoEm)}</span>
        </p>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {posts.slice(0, MINIATURAS).map((p) => (
          <img key={p.id} src={capaDoPost(p) ?? undefined} alt="" loading="lazy" className="aspect-square w-full rounded-lg bg-vazio object-cover" />
        ))}
      </div>
      <p className="mt-2 text-sm font-medium text-primary">Ver todos</p>
    </button>
  );
}
```

`FaixaPerfilPrivado.tsx`:
```tsx
import { Link } from 'react-router';

/** Aviso no topo da Comunidade para quem está com o perfil privado. */
export function FaixaPerfilPrivado() {
  return (
    <p className="card px-4 py-3 text-sm text-muted">
      Seu perfil é privado: você vê a comunidade, mas ninguém vê suas plantas.{' '}
      <Link to="/perfil/preferencias" className="font-medium text-primary">
        Ativar
      </Link>
    </p>
  );
}
```

`GradePosts.tsx`:
```tsx
import { useMemo } from 'react';
import { Link } from 'react-router';
import { EmptyState, ErrorState, Spinner } from '@/components/ui';
import { capaDoPost } from '@/lib/comunidade';
import { usePostsDoPerfil } from '@/lib/queries';
import { useFimDaLista } from '@/lib/useFimDaLista';

/** Grade de todos os posts de um perfil (inclui o acervo fora do feed), com rolagem infinita. */
export function GradePosts({ usuarioId }: { usuarioId: string }) {
  const lista = usePostsDoPerfil(usuarioId);
  const posts = useMemo(() => lista.data?.pages.flatMap((p) => p.itens) ?? [], [lista.data]);
  const fim = useFimDaLista(() => {
    if (lista.hasNextPage && !lista.isFetchingNextPage) void lista.fetchNextPage();
  }, [posts.length]);

  if (lista.isLoading) return <Spinner />;
  if (lista.isError) return <ErrorState text="Não foi possível carregar os posts." erro={lista.error} onRetry={() => lista.refetch()} />;
  if (!posts.length) return <EmptyState title="Ainda sem posts" text="Os dias com foto das plantas da comunidade aparecem aqui." />;
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
      {lista.isFetchingNextPage && <Spinner />}
    </>
  );
}
```

- [ ] **Step 4: Verificar**

Run: `cd web && npx tsc -b && npm run lint`
Expected: sem erros; lint sem avisos novos nesses arquivos (se o oxlint não conhecer a regra do comentário `eslint-disable-next-line`, remover o comentário e manter `deps` como está — anotar a decisão).

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/useFimDaLista.ts web/src/components/comunidade
git commit -m "feat(web): cartões de post e grade da Comunidade"
```

---

### Task 8: Web — aba Comunidade (feed)

**Files:**
- Create: `web/public/icones/comunidade.svg`, `web/public/icones/comunidade-ativo.svg`
- Modify: `web/src/lib/icones.ts` (`ICONES`, `COM_ATIVO`)
- Create: `web/src/pages/comunidade/ComunidadePage.tsx`
- Modify: `web/src/components/Layout.tsx` (`tabs`, `grid-cols-4` → `grid-cols-5`), `web/src/App.tsx` (rota dentro do `Layout`)

**Interfaces:**
- Consumes: `useFeed`, `agruparFeed`, `CardPost`, `CardGrupo`, `FaixaPerfilPrivado`, `useFimDaLista`, `BotaoTopo` (`components/Preferencias.tsx`), `OpcoesChips`.
- Produces: rota `/comunidade` (com `?aba=seguindo|explorar`), ícone `comunidade`.

- [ ] **Step 1: Ícone provisório**

`web/public/icones/comunidade.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19.5c.6-3.3 2.8-5.3 5.5-5.3s4.9 2 5.5 5.3"/><circle cx="16.6" cy="9.3" r="2.5"/><path d="M15.8 14.3c2.4-.2 4.2 1.7 4.8 4.7"/></svg>
```
`web/public/icones/comunidade-ativo.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19.5c.6-3.3 2.8-5.3 5.5-5.3s4.9 2 5.5 5.3z"/><circle cx="16.6" cy="9.3" r="2.5"/><path d="M15.8 14.3c2.4-.2 4.2 1.7 4.8 4.7h-3.6z"/></svg>
```
`icones.ts`: em `ICONES`, primeira linha vira `'bancada', 'colecao', 'comunidade', 'perfil', 'mais',`; `COM_ATIVO` vira `['bancada', 'colecao', 'comunidade', 'perfil']`. Comentário acima de `ICONES`: acrescentar `// "comunidade" é provisório (traço simples) até sair o definitivo pela skill criando-assets-sumi.`

- [ ] **Step 2: Página**

`web/src/pages/comunidade/ComunidadePage.tsx`:
```tsx
import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { BotaoTopo, OpcoesChips } from '@/components/Preferencias';
import { Button, EmptyState, ErrorState, Spinner } from '@/components/ui';
import { CardGrupo } from '@/components/comunidade/CardGrupo';
import { CardPost } from '@/components/comunidade/CardPost';
import { FaixaPerfilPrivado } from '@/components/comunidade/FaixaPerfilPrivado';
import { useAuth } from '@/context/AuthContext';
import { agruparFeed } from '@/lib/comunidade';
import { authApi } from '@/lib/endpoints';
import { keys, useFeed } from '@/lib/queries';
import { useFimDaLista } from '@/lib/useFimDaLista';
import type { AbaFeed } from '@/types';

const ABAS: { value: AbaFeed; label: string }[] = [
  { value: 'seguindo', label: 'Seguindo' },
  { value: 'explorar', label: 'Explorar' },
];

/** Aba Comunidade: feed de quem eu sigo ou de todo mundo, com 3+ posts da mesma pessoa no mesmo dia agrupados. */
export function ComunidadePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const me = useQuery({ queryKey: keys.me, queryFn: authApi.me });
  const [params, setParams] = useSearchParams();
  const escolhida = params.get('aba') as AbaFeed | null;
  // Sem ninguém seguido, abre em Explorar
  const aba: AbaFeed = escolhida ?? (me.data && !me.data.seguindo?.length ? 'explorar' : 'seguindo');
  const pronto = !!escolhida || !me.isLoading;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-safe">
      <header className="flex items-center gap-2 pb-2 pt-6">
        <h1 className="flex-1 text-3xl font-semibold">Comunidade</h1>
        <BotaoTopo label="Buscar pessoas" onClick={() => navigate('/comunidade/buscar')}>
          <Search size={20} />
        </BotaoTopo>
      </header>
      <OpcoesChips titulo="" opcoes={ABAS} value={aba} onChange={(v) => setParams({ aba: v }, { replace: true })} />
      {user && !user.perfilPublico && (
        <div className="mt-4">
          <FaixaPerfilPrivado />
        </div>
      )}
      <div className="mt-4">{pronto ? <Feed aba={aba} irParaExplorar={() => setParams({ aba: 'explorar' }, { replace: true })} /> : <Spinner />}</div>
    </div>
  );
}

function Feed({ aba, irParaExplorar }: { aba: AbaFeed; irParaExplorar: () => void }) {
  const feed = useFeed(aba);
  const posts = useMemo(() => feed.data?.pages.flatMap((p) => p.itens) ?? [], [feed.data]);
  const itens = useMemo(() => agruparFeed(posts), [posts]);
  const fim = useFimDaLista(() => {
    if (feed.hasNextPage && !feed.isFetchingNextPage) void feed.fetchNextPage();
  }, [posts.length]);

  if (feed.isLoading) return <Spinner />;
  if (feed.isError) return <ErrorState text="Não foi possível carregar a comunidade." erro={feed.error} onRetry={() => feed.refetch()} />;
  if (!itens.length) {
    return aba === 'seguindo' ? (
      <EmptyState title="Siga pessoas para ver aqui" text="Em Explorar estão os posts de todo mundo." action={<Button onClick={irParaExplorar}>Ir para Explorar</Button>} />
    ) : (
      <EmptyState title="Ainda não há posts" text="Quando alguém mostrar as plantas, os dias com foto aparecem aqui." />
    );
  }
  return (
    <div className="space-y-4 pb-6">
      {itens.map((item) =>
        item.tipo === 'post' ? <CardPost key={item.post.id} post={item.post} /> : <CardGrupo key={item.chave} autor={item.autor} posts={item.posts} />,
      )}
      <div ref={fim} />
      {feed.isFetchingNextPage && <Spinner />}
    </div>
  );
}
```
Se `OpcoesChips` com `titulo=""` renderizar um `<legend>` vazio com espaço, trocar por botões próprios (`chip`/`chip-active`, `aria-pressed`) dentro de um `div className="flex gap-2"` — mesmo visual dos chips.

- [ ] **Step 3: Barra de baixo e rota**

`Layout.tsx`: em `tabs`, entre `null` e o Perfil, acrescentar `{ to: '/comunidade', label: 'Comunidade', icone: 'comunidade' },`; trocar `grid-cols-4` por `grid-cols-5` na `div` da barra.

`App.tsx`: dentro do `<Route element={<Privada><Layout /></Privada>}>`, depois da `colecao`: `<Route path="comunidade" element={<ComunidadePage />} />` e `import { ComunidadePage } from '@/pages/comunidade/ComunidadePage';`.

- [ ] **Step 4: Verificar**

Run: `cd web && npm test && npm run build && npm run lint`
Expected: tudo ok (se `icones.test.ts` conferir a lista de ícones, ajustar a expectativa para incluir `comunidade`).

- [ ] **Step 5: Commit**

```bash
git add web/public/icones web/src/lib/icones.ts web/src/pages/comunidade web/src/components/Layout.tsx web/src/App.tsx
git commit -m "feat(web): aba Comunidade com feed Seguindo/Explorar"
```

---

### Task 9: Web — post, perfil público, planta pública e busca

**Files:**
- Create: `web/src/pages/comunidade/PostPage.tsx`, `PerfilPublicoPage.tsx`, `PlantaPublicaPage.tsx`, `BuscarPerfisPage.tsx`
- Modify: `web/src/App.tsx` (rotas), `web/src/pages/ProfilePages.tsx` (`ProfilePage`: item "Ver meu perfil público")

**Interfaces:**
- Consumes: hooks e `comunidadeApi` (Task 6), componentes (Task 7), `ehNaoEncontrado`, `PageHeader`, `EmptyState`, `ErrorState`, `Spinner`, `Button`, `Avatar`, `PlantThumb`, `useToast`, `errorMessage`, `plantaTitulo`, `especieNome`, `dataLonga`.
- Produces: rotas `/comunidade/post/:id`, `/comunidade/u/:id`, `/comunidade/planta/:id`, `/comunidade/buscar`.

- [ ] **Step 1: Página do post**

`PostPage.tsx`:
```tsx
import { useParams } from 'react-router';
import { EmptyState, ErrorState, PageHeader, Spinner } from '@/components/ui';
import { CardPost } from '@/components/comunidade/CardPost';
import { ehNaoEncontrado } from '@/lib/api';
import { usePost } from '@/lib/queries';

export function PostPage() {
  const { id = '' } = useParams();
  const post = usePost(id);
  return (
    <div className="pb-10">
      <PageHeader title="Post" back />
      <div className="mx-auto max-w-2xl px-4 pt-4">
        {post.isLoading ? (
          <Spinner />
        ) : post.isError ? (
          ehNaoEncontrado(post.error) ? (
            <EmptyState title="Este post não existe mais" text="Ele pode ter sido apagado ou ficado privado." />
          ) : (
            <ErrorState text="Não foi possível carregar o post." erro={post.error} onRetry={() => post.refetch()} />
          )
        ) : (
          post.data && <CardPost post={post.data} />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Perfil público**

`PerfilPublicoPage.tsx`:
```tsx
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { Avatar, Button, EmptyState, ErrorState, PageHeader, PlantThumb, Spinner } from '@/components/ui';
import { OpcoesChips } from '@/components/Preferencias';
import { GradePosts } from '@/components/comunidade/GradePosts';
import { useToast } from '@/context/ToastContext';
import { ehNaoEncontrado, errorMessage } from '@/lib/api';
import { comunidadeApi } from '@/lib/endpoints';
import { plantaTitulo } from '@/lib/format';
import { keys, usePerfilPublico } from '@/lib/queries';
import type { PerfilPublico } from '@/types';

type Aba = 'plantas' | 'posts';

export function PerfilPublicoPage() {
  const { id = '' } = useParams();
  const perfil = usePerfilPublico(id);
  const [aba, setAba] = useState<Aba>('plantas');

  if (perfil.isLoading || perfil.isError || !perfil.data) {
    return (
      <div className="pb-10">
        <PageHeader title="Perfil" back />
        {perfil.isLoading ? (
          <Spinner />
        ) : ehNaoEncontrado(perfil.error) ? (
          <EmptyState title="Perfil não encontrado" text="Ele pode ser privado ou não existir mais." />
        ) : (
          <ErrorState text="Não foi possível carregar o perfil." erro={perfil.error} onRetry={() => perfil.refetch()} />
        )}
      </div>
    );
  }

  const p = perfil.data;
  return (
    <div className="pb-10">
      <PageHeader title={p.nome} back />
      <div className="mx-auto max-w-2xl px-4">
        <section className="card mt-4 p-5">
          <div className="flex items-center gap-4">
            <Avatar url={p.fotoPerfilUrl} nome={p.nome} size={64} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold">{p.nome}</p>
              {p.localidade && (
                <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
                  <MapPin size={14} /> {p.localidade}
                </p>
              )}
            </div>
          </div>
          {p.bio && <p className="mt-4 whitespace-pre-line text-sm">{p.bio}</p>}
          <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
            <Numero label="Plantas" valor={p.contagem.plantas} />
            <Numero label="Seguidores" valor={p.contagem.seguidores} />
            <Numero label="Seguindo" valor={p.contagem.seguindo} />
          </dl>
          {!p.eu && (
            <div className="mt-5">
              <BotaoSeguir perfil={p} />
            </div>
          )}
        </section>

        <div className="mt-5">
          <OpcoesChips<Aba>
            titulo=""
            opcoes={[
              { value: 'plantas', label: 'Plantas' },
              { value: 'posts', label: 'Posts' },
            ]}
            value={aba}
            onChange={setAba}
          />
        </div>
        <div className="mt-4">
          {aba === 'posts' ? (
            <GradePosts usuarioId={p.id} />
          ) : p.plantas.length ? (
            <div className="grid grid-cols-3 gap-3">
              {p.plantas.map((pl) => (
                <Link key={pl.id} to={`/comunidade/planta/${pl.id}`} className="block">
                  <PlantThumb url={pl.fotoCapaUrl} id={pl.id} className="aspect-square w-full rounded-xl" />
                  <span className="mt-1 block truncate text-xs font-medium">{plantaTitulo(pl)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="Nenhuma planta na comunidade" />
          )}
        </div>
      </div>
    </div>
  );
}

function Numero({ label, valor }: { label: string; valor: number }) {
  return (
    <div>
      <dd className="text-xl font-semibold">{valor}</dd>
      <dt className="text-xs text-muted">{label}</dt>
    </div>
  );
}

function BotaoSeguir({ perfil }: { perfil: PerfilPublico }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [salvando, setSalvando] = useState(false);

  async function alternar() {
    setSalvando(true);
    try {
      if (perfil.sigo) await comunidadeApi.deixarDeSeguir(perfil.id);
      else await comunidadeApi.seguir(perfil.id);
      queryClient.invalidateQueries({ queryKey: ['comunidade', 'feed'] });
      queryClient.invalidateQueries({ queryKey: keys.me });
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      // Volta ao estado real do servidor (também quando o perfil ficou privado no meio do caminho)
      await queryClient.invalidateQueries({ queryKey: keys.perfilPublico(perfil.id) });
      setSalvando(false);
    }
  }

  return (
    <Button block variant={perfil.sigo ? 'secondary' : undefined} loading={salvando} onClick={alternar}>
      {perfil.sigo ? 'Seguindo' : 'Seguir'}
    </Button>
  );
}
```
(Se `Numero` já existir em `ProfilePages.tsx` como função não exportada, manter esta cópia local — são telas diferentes; ou exportar a de lá e reutilizar, se tiver a mesma marcação. Decidir lendo o arquivo e anotar.)

- [ ] **Step 3: Planta pública**

`PlantaPublicaPage.tsx`:
```tsx
import { Link, useParams } from 'react-router';
import { Avatar, EmptyState, ErrorState, PageHeader, PlantThumb, Spinner } from '@/components/ui';
import { CuidadosDoPost } from '@/components/comunidade/CuidadosDoPost';
import { FotosDoPost } from '@/components/comunidade/FotosDoPost';
import { ehNaoEncontrado } from '@/lib/api';
import { dataLonga, especieNome, plantaTitulo } from '@/lib/format';
import { usePlantaPublica } from '@/lib/queries';

/** Página pública da planta: capa, dono e a linha do tempo dos dias (fotos e, se públicos, cuidados). */
export function PlantaPublicaPage() {
  const { id = '' } = useParams();
  const dados = usePlantaPublica(id);

  if (dados.isLoading || dados.isError || !dados.data) {
    return (
      <div className="pb-10">
        <PageHeader title="Planta" back />
        {dados.isLoading ? (
          <Spinner />
        ) : ehNaoEncontrado(dados.error) ? (
          <EmptyState title="Planta não encontrada" text="Ela pode ter ficado privada ou não existir mais." />
        ) : (
          <ErrorState text="Não foi possível carregar a planta." erro={dados.error} onRetry={() => dados.refetch()} />
        )}
      </div>
    );
  }

  const { planta, dono, dias } = dados.data;
  return (
    <div className="pb-10">
      <PageHeader title={plantaTitulo(planta)} back />
      <div className="mx-auto max-w-2xl space-y-4 px-4 pt-4">
        <section className="card overflow-hidden">
          <PlantThumb url={planta.fotoCapaUrl} id={planta.id} className="aspect-[4/3] w-full" />
          <div className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold">
                #{planta.identificador} · {plantaTitulo(planta)}
              </p>
              <p className="truncate text-sm text-muted">{especieNome(planta.especie)}</p>
            </div>
            <Link to={`/comunidade/u/${dono.id}`} className="flex shrink-0 items-center gap-2 text-sm font-medium">
              <Avatar url={dono.fotoPerfilUrl} nome={dono.nome} size={28} /> {dono.nome}
            </Link>
          </div>
        </section>

        {dias.length ? (
          dias.map((d) => (
            <section key={d.dia} className="card overflow-hidden">
              <h2 className="px-3 pt-3 text-sm font-semibold">{dataLonga(`${d.dia}T12:00:00`)}</h2>
              {d.fotos.length > 0 && (
                <div className="mt-2">
                  <FotosDoPost fotos={d.fotos} />
                </div>
              )}
              <div className="space-y-2 p-3">
                <CuidadosDoPost cuidados={d.cuidados} />
                {d.postId && (
                  <Link to={`/comunidade/post/${d.postId}`} className="block text-xs font-medium text-primary">
                    Abrir post
                  </Link>
                )}
              </div>
            </section>
          ))
        ) : (
          <EmptyState title="Ainda sem registros públicos" />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Busca**

`BuscarPerfisPage.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Avatar, EmptyState, ErrorState, PageHeader, Spinner } from '@/components/ui';
import { useBuscaPerfis } from '@/lib/queries';

const ESPERA_MS = 300;

/** Busca de pessoas com perfil público, por nome. */
export function BuscarPerfisPage() {
  const [texto, setTexto] = useState('');
  const [termo, setTermo] = useState('');
  // Espera a pessoa parar de digitar antes de buscar
  useEffect(() => {
    const t = setTimeout(() => setTermo(texto.trim()), ESPERA_MS);
    return () => clearTimeout(t);
  }, [texto]);
  const busca = useBuscaPerfis(termo);

  return (
    <div className="pb-10">
      <PageHeader title="Buscar pessoas" back />
      <div className="mx-auto max-w-2xl px-4 pt-4">
        <input
          className="input"
          type="search"
          placeholder="Nome de quem você procura"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          autoFocus
        />
        <div className="mt-4">
          {termo.length < 2 ? (
            <p className="text-sm text-muted">Digite pelo menos 2 letras.</p>
          ) : busca.isLoading ? (
            <Spinner />
          ) : busca.isError ? (
            <ErrorState text="Não foi possível buscar." erro={busca.error} onRetry={() => busca.refetch()} />
          ) : busca.data?.length ? (
            <ul className="card divide-y divide-line overflow-hidden">
              {busca.data.map((u) => (
                <li key={u.id}>
                  <Link to={`/comunidade/u/${u.id}`} className="flex items-center gap-3 px-4 py-3">
                    <Avatar url={u.fotoPerfilUrl} nome={u.nome} size={40} />
                    <span className="min-w-0 flex-1 truncate font-medium">{u.nome}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Ninguém encontrado" text="Só aparecem pessoas com perfil público." />
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Rotas e item no Perfil**

`App.tsx`, junto das rotas com `Privada` (antes de `/perfil/editar`):
```tsx
        <Route path="/comunidade/buscar" element={<Privada><BuscarPerfisPage /></Privada>} />
        <Route path="/comunidade/post/:id" element={<Privada><PostPage /></Privada>} />
        <Route path="/comunidade/u/:id" element={<Privada><PerfilPublicoPage /></Privada>} />
        <Route path="/comunidade/planta/:id" element={<Privada><PlantaPublicaPage /></Privada>} />
```
com os quatro imports de `@/pages/comunidade/...`.

`ProfilePages.tsx`, em `ProfilePage`, no `<nav>` antes do item "Preferências":
```tsx
        {perfil?.id && <MenuItem to={`/comunidade/u/${perfil.id}`} icon={<Users size={20} />} label="Ver meu perfil público" />}
```
e `Users` no import de `lucide-react`.

- [ ] **Step 6: Verificar**

Run: `cd web && npm test && npm run build && npm run lint`
Expected: tudo ok, sem avisos novos de lint nesses arquivos.

- [ ] **Step 7: Commit**

```bash
git add web/src/pages/comunidade web/src/App.tsx web/src/pages/ProfilePages.tsx
git commit -m "feat(web): post, perfil público, planta pública e busca da Comunidade"
```

---

### Task 10: Verificação ponta a ponta, CLAUDE.md e entrega

**Files:**
- Modify: `CLAUDE.md` (fim do parágrafo da Comunidade, criado na fase 1)

- [ ] **Step 1: Navegador (local, duas contas)**

Com `docker restart bonsai_api` e o dev server do web, em largura de celular. Conta A = `teste.web@bonsai.test` (sessão já logada), conta B = outra conta local (ex. `smoke.bancada@teste.local`), entrando como B trocando `localStorage.bonsai_token` por um JWT assinado no container e recarregando (guardar o token de A para voltar).
1. A: Preferências → perfil público, "Todas", "Mostrar meus cuidados" ligado. Registrar (ou subir via API com uma URL de foto já existente de A) uma foto numa planta de A hoje.
2. B: barra de baixo tem **Comunidade** entre o + e o Perfil. Abre em **Explorar** (B não segue ninguém); o post de A aparece com fotos, planta e cuidados.
3. B: toca no nome de A → perfil público com contagem, abas Plantas/Posts; **Seguir** → vira "Seguindo"; volta à aba → **Seguindo** mostra o post.
4. B: toca na planta → página pública com a linha do tempo; "Abrir post" abre `/comunidade/post/:id`.
5. B: 🔍 → digitar 2 letras do nome de A → A aparece.
6. A: desliga "Mostrar meus cuidados" → B recarrega: o post continua, sem cuidados. A torna o perfil privado → B: post some do feed, `/comunidade/post/:id` mostra "Este post não existe mais", perfil mostra "Perfil não encontrado"; tocar em Seguir não é mais possível (e via API dá 400 "Este perfil é privado.").
7. Restaurar: B deixa de seguir A; A volta ao estado anterior (perfil privado, plantas privadas, foto de teste apagada); token de A de volta no `localStorage`.

- [ ] **Step 2: CLAUDE.md**

Acrescentar ao fim do trecho "Comunidade (spec …)" no parágrafo do frontend:
```
Fase 2: aba `/comunidade` (Seguindo/Explorar, `?aba=`; sem ninguém seguido abre em Explorar; 3+ posts seguidos da mesma pessoa no mesmo dia agrupam — `agruparFeed` em `src/lib/comunidade.ts`), `/comunidade/post/:id`, `/comunidade/u/:id` (perfil público, seguir), `/comunidade/planta/:id`, `/comunidade/buscar` (`pages/comunidade/`, cartões em `components/comunidade/`). API de leitura `GET /api/comunidade/{feed,posts/:id,usuarios/:id,usuarios/:id/posts,plantas/:id,buscar}` (regras puras em `server/src/modules/comunidade/dominio/{visibilidade,conteudo,montar}.ts`; invisível → 404). Seguir só perfil público. Ícone `comunidade` provisório.
```

- [ ] **Step 3: Rodar tudo**

Run: `cd server && npm test && npm run build` e `cd web && npm test && npm run build && npm run lint`
Expected: tudo passa.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md com a fase 2 da Comunidade"
```

- [ ] **Step 5: Push e produção** (depois da revisão final do executing-plans)

`git push origin main`; esperar o build da Vercel e do Cloudflare Pages; em https://bonsaimanager.pages.dev com `testeclaude@bonsai.dev`: aba Comunidade abre, Explorar carrega (pode estar vazio), "Ver meu perfil público" abre o próprio perfil, busca responde. Restaurar qualquer configuração alterada.
