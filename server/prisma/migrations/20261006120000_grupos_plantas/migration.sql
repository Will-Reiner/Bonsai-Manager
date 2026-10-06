-- Grupos fixos de plantas (opcional; plantas existentes ficam sem grupo)
CREATE TYPE "GrupoPlanta" AS ENUM ('RECEM_TRANSPLANTADA', 'DEBILITADA', 'EM_CRESCIMENTO', 'REFINAMENTO');

ALTER TABLE "Planta"
  ADD COLUMN "grupo" "GrupoPlanta",
  ADD COLUMN "grupoAnterior" "GrupoPlanta",
  ADD COLUMN "grupoExpiraEm" TIMESTAMP(3);
