-- Planta pode existir sem espécie (criada só com código + foto); o usuário completa depois
ALTER TABLE "Planta" ALTER COLUMN "especieId" DROP NOT NULL;
