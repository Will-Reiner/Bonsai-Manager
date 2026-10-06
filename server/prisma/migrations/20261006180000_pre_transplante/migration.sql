-- Grupo automático Pré-transplante (entra X dias antes de um Transplante agendado)
ALTER TYPE "GrupoPlanta" ADD VALUE 'PRE_TRANSPLANTE' BEFORE 'RECEM_TRANSPLANTADA';

ALTER TABLE "Planta" ADD COLUMN "preTransplanteAgendaId" TEXT;
