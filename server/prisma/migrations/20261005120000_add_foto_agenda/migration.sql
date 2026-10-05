-- AlterTable
ALTER TABLE "Foto" ADD COLUMN "agendaId" TEXT;

-- AddForeignKey
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_agendaId_fkey" FOREIGN KEY ("agendaId") REFERENCES "Agenda"("id") ON DELETE SET NULL ON UPDATE CASCADE;
