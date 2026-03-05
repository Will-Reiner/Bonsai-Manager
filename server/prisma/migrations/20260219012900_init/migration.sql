-- CreateEnum
CREATE TYPE "TipoMidia" AS ENUM ('FOTO', 'VIDEO');

-- AlterTable
ALTER TABLE "Foto" ADD COLUMN     "thumbnailUrl" TEXT,
ADD COLUMN     "tipo" "TipoMidia" NOT NULL DEFAULT 'FOTO';
