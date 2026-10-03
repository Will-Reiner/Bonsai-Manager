# Deploy gratuito — Bonsai Manager

| Peça | Serviço | Pasta |
|---|---|---|
| Frontend web (SPA) | Cloudflare Pages | `web/` |
| API Express | Vercel (plano Hobby) | `server/` |
| PostgreSQL | Neon (plano Free) | — |
| Imagens | Cloudflare R2 | — |

Ordem recomendada: **Neon → Vercel → Cloudflare Pages → CORS do R2 → admin**.

---

## 1. Banco — Neon

1. Crie uma conta em <https://neon.tech> e um projeto (região mais próxima: `AWS São Paulo` se disponível).
2. Em **Connection Details** copie duas strings:
   - **Pooled** (host contém `-pooler`) → será o `DATABASE_URL`. Acrescente no final: `&pgbouncer=true&connection_limit=1`
   - **Direct** (sem `-pooler`) → será o `DIRECT_URL` (usado pelas migrations).

Exemplo:
```
DATABASE_URL=postgresql://user:senha@ep-xxx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://user:senha@ep-xxx.sa-east-1.aws.neon.tech/neondb?sslmode=require
```

## 2. API — Vercel

1. Em <https://vercel.com> → **Add New → Project** → importe o repositório.
2. **Root Directory**: `server` · **Framework Preset**: Other (o `server/vercel.json` já define build e rotas).
3. **Environment Variables**:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | string pooled do Neon |
| `DIRECT_URL` | string direta do Neon |
| `JWT_SECRET` | string longa e aleatória (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | `https://<seu-projeto>.pages.dev,*.<seu-projeto>.pages.dev` (ajuste depois do passo 3) |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` | mesmos valores do R2 que você já usa |

4. Deploy. O build roda `prisma generate && prisma migrate deploy && tsc` — as tabelas são criadas no Neon automaticamente.
5. Teste: `https://<projeto>.vercel.app/` deve responder `Bonsai API is running!`.

> O Swagger (`/api/docs`) fica desativado em produção; use localmente com `docker compose up`.

## 3. Frontend — Cloudflare Pages

1. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git** → selecione o repositório.
2. Configuração de build:
   - **Root directory**: `web`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
3. **Environment variable**: `VITE_API_URL` = `https://<projeto>.vercel.app/api`
4. Deploy. O arquivo `web/public/_redirects` faz rotas como `/plantas/123` funcionarem ao recarregar.
5. Volte na Vercel e confira se `CORS_ORIGIN` tem a URL final do Pages (redeploy se mudou).

## 4. CORS do bucket R2 (obrigatório para upload de fotos)

O navegador envia as fotos **direto ao R2** usando URL pré-assinada. Sem CORS o upload falha com "Erro de rede no upload".

Cloudflare Dashboard → **R2 → seu bucket → Settings → CORS Policy → Add/Edit** e cole:

```json
[
  {
    "AllowedOrigins": ["https://<seu-projeto>.pages.dev", "http://localhost:5173"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["content-type"],
    "MaxAgeSeconds": 3600
  }
]
```

## 5. Primeiro admin e dados iniciais

1. Cadastre-se pelo site.
2. Na sua máquina, dentro de `server/`, rode o seed apontando para o Neon (use a string **direta**):

```powershell
$env:DATABASE_URL="<DIRECT_URL do Neon>"; $env:DIRECT_URL=$env:DATABASE_URL; $env:ADMIN_EMAIL="seu@email.com"; npm run seed
```

Isso cria as atividades básicas (Rega, Adubação, Poda…), categorias de insumo e promove seu usuário a `ADMIN`. Saia e entre de novo no site — o item **Painel admin** aparece no Perfil.

---

## Limites do plano gratuito (resumo)

- **Neon Free**: 0,5 GB de armazenamento; o banco "dorme" sem uso e acorda em ~1 s.
- **Vercel Hobby**: uso pessoal/não comercial; funções com cold start de ~1 s.
- **Cloudflare Pages**: builds e banda generosos para um projeto pessoal.
- **R2**: 10 GB grátis; sem custo de saída.

## Desenvolvimento local

```bash
docker compose up --build          # API + Postgres (localhost:3000)
docker compose exec api npm run seed
cd web && cp .env.example .env && npm install && npm run dev   # localhost:5173
```
