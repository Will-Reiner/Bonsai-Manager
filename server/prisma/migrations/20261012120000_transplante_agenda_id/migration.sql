-- Transplante que colocou a planta em Recém transplantada
ALTER TABLE "Planta" ADD COLUMN "transplanteAgendaId" TEXT;

-- Plantas já em Recém transplantada: o Transplante concluído mais recente delas
UPDATE "Planta" p
SET "transplanteAgendaId" = (
  SELECT a."id"
  FROM "Agenda" a
  JOIN "Atividade" t ON t."id" = a."atividadeId"
  WHERE a."plantaId" = p."id" AND t."nome" = 'Transplante' AND a."status" = 'CONCLUIDO'
  ORDER BY COALESCE(a."dataConcluida", a."dataAgendada") DESC
  LIMIT 1
)
WHERE p."grupo" = 'RECEM_TRANSPLANTADA' AND p."grupoExpiraEm" IS NOT NULL;
