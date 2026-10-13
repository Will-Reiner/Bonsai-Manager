# Comunidade: perfil público, feed automático, curtidas, comentários e salvos

Data: 2026-10-13 · Origem: conversa de brainstorming (aba Comunidade na barra de baixo)

## Objetivo

Um espaço parecido com o Instagram para ver as plantas de amigos e **como cada um cuida delas**. Quem tem
perfil público publica automaticamente: cada dia com foto numa planta pública vira um post (fotos + cuidados
do dia). Outros usuários seguem, curtem, comentam e salvam posts, e recebem notificações dentro do app.

Princípio que guia os dados: **o post aponta para os dados reais** (`Foto` e `Agenda` da planta naquele dia),
não copia conteúdo. Assim métricas, evolução e o futuro "copiar cuidado" leem os mesmos registros.

Fora do escopo (futuro): post manual "postar este cuidado com legenda", copiar cuidados, push no celular,
exceção de histórico por planta, respostas a comentários, bloquear/denunciar usuários, perfil com aprovação
de seguidores.

## Decisões de produto

- **Modelo aberto:** perfil público é visível para qualquer usuário do app; seguir não precisa de aprovação.
  A aba tem **Seguindo** e **Explorar** (todos os posts públicos).
- **Unidade do post:** uma planta num dia (mesmo agrupamento do histórico, planta + dia).
- **Só dias com foto viram post.** Cuidados sem foto não vão para o feed; aparecem na página pública da
  planta (se o histórico for público).
- **Privacidade:** perfil público liga/desliga tudo; o toggle por planta (`plantaPublica`) é a fonte da verdade;
  "Todas / Selecionadas" é atalho; histórico de cuidados público é **um toggle global**; "Postar
  automaticamente" é outro toggle global.
- **Planta nova:** com perfil público, o formulário mostra "Mostrar na comunidade" **marcado por padrão**.
- **Acervo antigo:** ao tornar uma planta pública, todo o passado aparece na página dela e no perfil, mas
  **não** no feed.
- **Notificações:** caixa dentro do app (sino com contador), sem push.
- **Perfil privado** pode navegar, seguir, curtir e comentar; aparece só com nome e avatar.

## Dados

### `Usuario`
- `perfilPublico`: padrão passa a **`false`**; migração põe `false` em todas as contas existentes (ninguém usa hoje).
- `historicoPublico Boolean @default(false)` (novo): mostra cuidados nos posts e na página pública da planta.
- `postarAutomatico Boolean @default(true)` (novo): posts novos entram no feed. Só tem efeito com perfil público.
- São colunas (e não `PreferenciaUsuario`) porque o servidor filtra por elas nas consultas do feed.

### `Planta`
- `plantaPublica` (existente): fonte da verdade.
- `historicoPublico` (existente, por planta): deixa de ser usado; fica no banco para uma futura exceção por planta.
- "Todas / Selecionadas" **não é guardado**: é derivado — se todas as plantas são públicas, a tela mostra "Todas".

### Novas tabelas
```prisma
model Post {
  id          String   @id @default(uuid())
  usuarioId   String                       // dono (= planta.usuarioId)
  plantaId    String
  dia         DateTime @db.Date            // dia local (America/Sao_Paulo)
  publicadoEm DateTime @default(now())     // quando o post nasceu; ordena o feed
  noFeed      Boolean                      // true = só na página da planta/perfil
  createdAt   DateTime @default(now())
  @@unique([plantaId, dia])
  @@index([noFeed, publicadoEm])
  @@index([usuarioId, publicadoEm])
}
model Curtida     { usuarioId, postId, createdAt                          @@id([usuarioId, postId]) }
model Comentario  { id, postId, usuarioId, texto (1–1000), createdAt      @@index([postId, createdAt]) }
model Salvo       { usuarioId, postId, createdAt                          @@id([usuarioId, postId]) }
model Notificacao { id, usuarioId (destinatário), atorId, tipo NotificacaoTipo (CURTIDA|COMENTARIO|SEGUIU),
                    postId?, comentarioId?, lida Boolean @default(false), createdAt
                    @@index([usuarioId, lida, createdAt]) }
```
- `Amizade` ganha `createdAt`.
- Tudo em cascata: apagar usuário, planta, post ou comentário apaga o que depende dele.

### Conteúdo do post (lido na hora, nada copiado)
- **Dia de uma foto** (mesma regra de `web/src/lib/linhaDoTempo.ts`): se a foto pertence a uma tarefa
  `CONCLUIDO`, é o dia da tarefa (`dataConcluida ?? dataAgendada`); senão `dataCaptura ?? createdAt`.
  Sempre no fuso `America/Sao_Paulo`. Fotos sem planta (inspiração avulsa) não geram post.
- **Fotos:** as fotos da planta naquele dia.
- **Cuidados:** tarefas `CONCLUIDO` da planta naquele dia (atividade, descrição, observação), **só se
  `dono.historicoPublico`**; senão `null`.

## Regras

### Nascimento e morte do post
- **Todo (planta, dia) com ≥ 1 foto tem um post**, inclusive de plantas privadas. A visibilidade é decidida na leitura.
- `noFeed` é decidido **uma vez**, quando o post nasce: `noFeed = false` só se, naquele momento,
  `perfilPublico && plantaPublica && postarAutomatico && dia ≥ hoje − 7 dias`.
  - Posts de quando a planta era privada nascem `noFeed` → o acervo só aparece na página da planta.
  - Lote de fotos antigas não inunda o feed.
- Segunda foto no mesmo dia: o post já existe; nada muda, `publicadoEm` não é atualizado.
- Após apagar foto, mover foto de planta, mudar a data da foto ou a data do cuidado ao qual ela pertence:
  se o (planta, dia) antigo ficou sem fotos, o post é apagado (com curtidas, comentários, salvos e notificações);
  o (planta, dia) novo é "tocado".
- **Pontos de escrita** (todos chamam `tocarPost(plantaId, dia)` na mesma transação):
  - `server/src/modules/foto/repositories/prisma-foto.repository.ts` (criar, editar, apagar — inclui fotos em lote);
  - `server/src/modules/agenda/repositories/prisma-conclusao.repository.ts` (registrar e concluir);
  - edição/exclusão de cuidado (`PUT /api/agendas/cuidado`, `POST /api/agendas/cuidado/excluir`) toca os dias antigo e novo.
- Migração única cria os posts das fotos existentes, todos com `noFeed = true`.

### Quem vê o quê (função pura `podeVer`)
- Post de outra pessoa: visível se `dono.perfilPublico && planta.plantaPublica`. O próprio dono sempre vê.
- Cuidados no post e na página pública da planta: `mostraCuidados = dono.historicoPublico` (dono sempre vê).
- Tornar planta/perfil privado esconde na hora sem apagar nada; voltar a público devolve curtidas e comentários.
- Feed **Seguindo**: posts `noFeed = false` visíveis, de quem eu sigo + os meus. **Explorar**: todos os
  `noFeed = false` visíveis. Ambos por `publicadoEm` desc.

### Seguir, curtir, comentar, salvar, notificar
- Só se segue perfil público; não se segue a si mesmo. Se a pessoa ficar privada, o vínculo fica e nada aparece.
- Curtir, comentar e salvar só em posts visíveis. Curtir/salvar são idempotentes.
- Comentário plano. O autor apaga o seu; o dono do post apaga qualquer um no post dele.
- Notificações: curtida → CURTIDA; comentário → COMENTARIO; seguir → SEGUIU. Nunca para ação sobre si mesmo.
  Descurtir remove a CURTIDA; deixar de seguir remove a SEGUIU; apagar comentário remove a COMENTARIO.

## Telas (web)

Visual "Caderno de sumi". Ícones novos (comunidade, curtir, comentar, salvar, sino) pela skill
`criando-assets-sumi`; curtir pode "carimbar" como um hanko.

1. **Barra de baixo:** Bancada · Coleção · **+** · **Comunidade** · Perfil. Ponto na aba quando há notificação não lida.
2. **`/comunidade`:** cabeçalho com título, 🔍 busca e 🔔 notificações (contador). Abas **Seguindo | Explorar**;
   sem ninguém seguido abre em Explorar com "Siga pessoas para ver aqui". Perfil privado vê uma faixa
   "Seu perfil é privado — você vê a comunidade, mas ninguém vê suas plantas. [Ativar]" → Preferências.
   - **Card do post:** avatar + nome · `#12 · Ficus` · tempo relativo; carrossel de fotos (`Roda`), toque duplo
     curte; linha curtir / comentar / salvar + nº de curtidas; cuidados com ícones (`iconeDaAtividade`) e
     descrição recolhida ("ver mais") quando o histórico é público; "ver N comentários".
   - **Agrupamento:** 3+ posts da mesma pessoa no mesmo dia de `publicadoEm`, em sequência no feed, viram um
     card "William cuidou de 15 plantas hoje" com miniaturas; toque expande. Regra pura em `web/src/lib/`.
   - Rolagem infinita (cursor em `publicadoEm` + `id`).
3. **`/comunidade/post/:id`:** card completo, comentários e campo para escrever. Post sumido → "Este post não existe mais".
4. **`/comunidade/u/:id`:** avatar, nome público, bio, localidade; contadores (plantas públicas, seguidores,
   seguindo); botão **Seguir / Seguindo**; abas **Plantas** (grade; sem foto usa `vasoDaPlanta`) e **Posts**
   (grade de todos os posts visíveis, inclusive `noFeed`, por `dia` desc).
5. **`/comunidade/planta/:id`:** capa, nome, espécie; linha do tempo por dia com os posts e, se o histórico é
   público, os dias só de cuidado.
6. **`/comunidade/buscar`:** por `nome`/`nomePublico`, só perfis públicos.
7. **`/comunidade/notificacoes`:** lista com link para o post/perfil; abrir marca tudo como lido. O contador
   atualiza ao voltar o foco do app (refetch on focus).
8. **Perfil (aba):** novos itens "Ver meu perfil público" e "**Salvos**" (`/comunidade/salvos`, grade).
9. **Preferências → seção "Comunidade"** (`/perfil/preferencias`):
   - Perfil público [toggle]. Abaixo, só se ligado:
   - Quais plantas: **Todas** (torna todas públicas) / **Selecionadas** (gaveta com checkboxes e miniaturas).
     Estado derivado das plantas.
   - Mostrar meus cuidados [toggle] (`historicoPublico`).
   - Postar automaticamente [toggle] (`postarAutomatico`).
10. **Criar/editar planta:** toggle "Mostrar na comunidade" (`plantaPublica`), marcado por padrão na criação,
    só com perfil público. Perfil privado mostra a dica "Seu perfil é privado · Ativar".

## API

Router novo `/api/comunidade` (autenticado):
```
GET    /comunidade/feed?aba=seguindo|explorar&cursor=   → { posts, proximoCursor }
GET    /comunidade/posts/:id
POST   /comunidade/posts/:id/curtida      DELETE /comunidade/posts/:id/curtida
POST   /comunidade/posts/:id/salvo        DELETE /comunidade/posts/:id/salvo
GET    /comunidade/posts/:id/comentarios?cursor=        POST /comunidade/posts/:id/comentarios
DELETE /comunidade/comentarios/:id
GET    /comunidade/usuarios/:id
GET    /comunidade/usuarios/:id/plantas   GET /comunidade/usuarios/:id/posts?cursor=
GET    /comunidade/plantas/:id
GET    /comunidade/buscar?q=
GET    /comunidade/salvos?cursor=
GET    /comunidade/notificacoes?cursor=   GET /comunidade/notificacoes/nao-lidas   POST /comunidade/notificacoes/lidas
```
- **Seguir:** reaproveita `/api/amizades/follow/:id` e `/unfollow/:id`, com as regras novas (perfil público,
  não a si mesmo, notificação SEGUIU).
- **Configurações:** `perfilPublico`, `historicoPublico`, `postarAutomatico` no update de perfil existente (`auth`).
  Novo `PUT /api/plantas/publicas { plantaIds }` define exatamente quais plantas são públicas (Todas / gaveta).
- **PostDTO:** `{ id, dia, publicadoEm, autor { id, nome, fotoPerfilUrl }, planta { id, identificador, nome,
  especie, fotoCapaUrl }, fotos[], cuidados[] | null, curtidas, curtiu, salvou, totalComentarios }`.
  Fotos e cuidados carregados **em lote** para a página inteira (20 por página), sem N+1.
- **Web:** chamadas em `src/lib/endpoints.ts`, hooks em `src/lib/queries.ts` (`useInfiniteQuery`); curtir e
  salvar otimistas (desfaz em erro).

## Código

- Módulo `server/src/modules/comunidade/` no padrão do projeto (controllers, schemas, use-cases, repositories,
  `comunidade.types.ts`), com regras puras em `dominio/`: `diaDoPost`, `decidirNoFeed`, `podeVer`, `mostraCuidados`.
- `tocarPost` fica em `comunidade/` e é chamado pelos repositórios de `foto` e `agenda` dentro da transação.
- Regras puras do front: agrupamento do feed e estado "Todas/Selecionadas" em `web/src/lib/comunidade.ts`.

## Erros

- Post, perfil ou planta invisível → **404** (não revela que existe).
- Seguir perfil privado ou a si mesmo → 400 com mensagem clara.
- Comentário vazio ou > 1000 caracteres → 400 (Zod, `mensagemDoErro`).
- Erros de rede: `ErrorState` / `ErroDeRede` existentes.

## Testes

- **Domínio (Jest):** `decidirNoFeed` (cada condição e o limite de 7 dias), `diaDoPost` (23h30 em São Paulo fica
  no mesmo dia; foto de cuidado usa o dia do cuidado), `podeVer`, `mostraCuidados`.
- **Casos de uso com mocks:** `tocarPost` cria, mantém e apaga; curtir notifica, não notifica a si mesmo,
  descurtir remove a notificação; comentar só em post visível e permissões de apagar; seguir perfil privado falha.
- **Web (Vitest):** agrupamento do feed e estado derivado "Todas/Selecionadas".
- **Navegador:** conta `testeclaude@bonsai.dev` + uma **segunda conta de teste** (pedir ao usuário) para seguir,
  curtir, comentar e ver notificações entre duas pessoas.

## Entrega em 3 fases (cada uma vai para a `main` sozinha)

1. **Dados + privacidade:** migrações, seção Comunidade nas Preferências, toggles na criação/edição de planta,
   `PUT /plantas/publicas`, `tocarPost` nos pontos de escrita, posts das fotos existentes.
2. **Ver a comunidade:** aba Comunidade, Seguindo/Explorar, post, perfil público, planta pública, busca, seguir.
3. **Interagir:** curtir, comentar, salvar, tela Salvos, notificações e contador.
