-- Comunidade: perfil privado por padrão e preferências de compartilhamento
ALTER TABLE "Usuario" ALTER COLUMN "perfilPublico" SET DEFAULT false;
UPDATE "Usuario" SET "perfilPublico" = false;
ALTER TABLE "Usuario" ADD COLUMN "historicoPublico" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Usuario" ADD COLUMN "postarAutomatico" BOOLEAN NOT NULL DEFAULT true;

-- Post: uma planta num dia com foto
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "dia" DATE NOT NULL,
    "publicadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "noFeed" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,
    "plantaId" TEXT NOT NULL,
    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Post_plantaId_dia_key" ON "Post"("plantaId", "dia");
CREATE INDEX "Post_noFeed_publicadoEm_idx" ON "Post"("noFeed", "publicadoEm");
CREATE INDEX "Post_usuarioId_publicadoEm_idx" ON "Post"("usuarioId", "publicadoEm");
ALTER TABLE "Post" ADD CONSTRAINT "Post_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Post" ADD CONSTRAINT "Post_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Posts das fotos que já existem, todos fora do feed (mesma regra de dia de dominio/post.ts:
-- foto de cuidado concluído usa o dia do cuidado; senão captura ?? upload; visão futura não conta)
INSERT INTO "Post" ("id", "usuarioId", "plantaId", "dia", "noFeed")
SELECT gen_random_uuid()::text, p."usuarioId", d."plantaId", d."dia", true
FROM (
  SELECT DISTINCT f."plantaId",
    ((CASE WHEN a."status" = 'CONCLUIDO' THEN COALESCE(a."dataConcluida", a."dataAgendada")
           ELSE COALESCE(f."dataCaptura", f."createdAt") END)
      AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date AS "dia"
  FROM "Foto" f
  LEFT JOIN "Agenda" a ON a."id" = f."agendaId"
  WHERE f."plantaId" IS NOT NULL AND f."tipo" <> 'VISAO_FUTURA'
) d
JOIN "Planta" p ON p."id" = d."plantaId";
