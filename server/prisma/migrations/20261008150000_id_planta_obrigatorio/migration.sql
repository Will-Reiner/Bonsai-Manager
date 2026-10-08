-- ID da planta obrigatório e numérico. Códigos com letras são descartados.
ALTER TABLE "Planta" ADD COLUMN "identificador_num" INTEGER;

-- 1. IDs só com dígitos (1..999999999, ignorando zeros à esquerda) viram número.
--    Em colisão (ex.: "011" e "11") fica a planta mais antiga.
WITH numericos AS (
  SELECT "id",
         CAST(LTRIM("identificador", '0') AS INTEGER) AS "num",
         ROW_NUMBER() OVER (
           PARTITION BY "usuarioId", CAST(LTRIM("identificador", '0') AS INTEGER)
           ORDER BY "createdAt", "id"
         ) AS "ordem"
  FROM "Planta"
  WHERE LTRIM("identificador", '0') ~ '^[1-9][0-9]{0,8}$'
)
UPDATE "Planta" p SET "identificador_num" = n."num"
FROM numericos n
WHERE p."id" = n."id" AND n."ordem" = 1;

-- 2. As demais recebem, por ordem de criação, os números depois do maior do usuário.
WITH base AS (
  SELECT "usuarioId", COALESCE(MAX("identificador_num"), 0) AS "maior"
  FROM "Planta"
  GROUP BY "usuarioId"
), novos AS (
  SELECT p."id",
         b."maior" + ROW_NUMBER() OVER (PARTITION BY p."usuarioId" ORDER BY p."createdAt", p."id") AS "num"
  FROM "Planta" p
  JOIN base b ON b."usuarioId" = p."usuarioId"
  WHERE p."identificador_num" IS NULL
)
UPDATE "Planta" p SET "identificador_num" = novos."num"
FROM novos
WHERE p."id" = novos."id";

-- 3. Troca a coluna
DROP INDEX "Planta_usuarioId_identificador_key";
ALTER TABLE "Planta" DROP COLUMN "identificador";
ALTER TABLE "Planta" RENAME COLUMN "identificador_num" TO "identificador";
ALTER TABLE "Planta" ALTER COLUMN "identificador" SET NOT NULL;
CREATE UNIQUE INDEX "Planta_usuarioId_identificador_key" ON "Planta"("usuarioId", "identificador");
