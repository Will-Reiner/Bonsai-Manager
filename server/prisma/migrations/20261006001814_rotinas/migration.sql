-- DropForeignKey
ALTER TABLE "Planta" DROP CONSTRAINT "Planta_especieId_fkey";

-- AlterTable
ALTER TABLE "Agenda" ADD COLUMN     "pulada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rotinaId" TEXT;

-- CreateTable
CREATE TABLE "Rotina" (
    "id" TEXT NOT NULL,
    "intervaloDias" INTEGER NOT NULL,
    "estacoes" "Estacao"[] DEFAULT ARRAY[]::"Estacao"[],
    "pausada" BOOLEAN NOT NULL DEFAULT false,
    "dataFim" TIMESTAMP(3),
    "revisao" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "plantaId" TEXT NOT NULL,
    "atividadeId" TEXT NOT NULL,

    CONSTRAINT "Rotina_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rotina_plantaId_atividadeId_key" ON "Rotina"("plantaId", "atividadeId");

-- AddForeignKey
ALTER TABLE "Planta" ADD CONSTRAINT "Planta_especieId_fkey" FOREIGN KEY ("especieId") REFERENCES "Especie"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agenda" ADD CONSTRAINT "Agenda_rotinaId_fkey" FOREIGN KEY ("rotinaId") REFERENCES "Rotina"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rotina" ADD CONSTRAINT "Rotina_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rotina" ADD CONSTRAINT "Rotina_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "Atividade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
