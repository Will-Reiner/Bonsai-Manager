-- CreateEnum
CREATE TYPE "StatusEspecie" AS ENUM ('VERIFICADO', 'SUGERIDO');

-- AlterTable: add status with VERIFICADO default so existing rows are marked as verified
ALTER TABLE "Especie" ADD COLUMN "status" "StatusEspecie" NOT NULL DEFAULT 'VERIFICADO';

-- AlterTable: add criadoPorId (nullable FK to Usuario)
ALTER TABLE "Especie" ADD COLUMN "criadoPorId" TEXT;

-- AlterTable: make nomeCientifico nullable
ALTER TABLE "Especie" ALTER COLUMN "nomeCientifico" DROP NOT NULL;

-- Now change the default to SUGERIDO for new records
ALTER TABLE "Especie" ALTER COLUMN "status" SET DEFAULT 'SUGERIDO';

-- AddForeignKey
ALTER TABLE "Especie" ADD CONSTRAINT "Especie_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
