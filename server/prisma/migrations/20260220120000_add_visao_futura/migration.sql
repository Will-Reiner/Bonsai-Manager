-- AlterEnum
ALTER TYPE "TipoMidia" ADD VALUE 'VISAO_FUTURA';

-- AlterTable
ALTER TABLE "Foto" ADD COLUMN "descricao" TEXT;

-- AlterTable
ALTER TABLE "Planta" DROP COLUMN "visao";
