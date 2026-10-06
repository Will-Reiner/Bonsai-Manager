-- Revisão geral vira rotina: uma por planta (intervalo = preferência do dono; padrão 30; 0 = sem rotina)
INSERT INTO "Rotina" ("id", "intervaloDias", "revisao", "plantaId", "atividadeId", "updatedAt")
SELECT gen_random_uuid()::text,
       LEAST(COALESCE(CASE WHEN pref."valor" ~ '^\s*\d+\s*$' THEN trim(pref."valor")::int END, 30), 3650),
       true,
       p."id",
       a."id",
       CURRENT_TIMESTAMP
FROM "Planta" p
JOIN "Atividade" a ON a."nome" = 'Revisão geral'
LEFT JOIN "PreferenciaUsuario" pref ON pref."usuarioId" = p."usuarioId" AND pref."chave" = 'revisao_automatica_dias'
WHERE COALESCE(CASE WHEN pref."valor" ~ '^\s*\d+\s*$' THEN trim(pref."valor")::int END, 30) > 0
ON CONFLICT ("plantaId", "atividadeId") DO UPDATE SET "revisao" = true;

-- Vincula a revisão pendente mais próxima de cada planta à rotina (se a rotina ainda não tem pendente)
UPDATE "Agenda" ag
SET "rotinaId" = r."id"
FROM "Rotina" r
WHERE r."revisao" = true
  AND ag."id" = (
    SELECT x."id" FROM "Agenda" x
    WHERE x."plantaId" = r."plantaId" AND x."atividadeId" = r."atividadeId" AND x."status" = 'PENDENTE'
    ORDER BY x."dataAgendada" ASC
    LIMIT 1
  )
  AND NOT EXISTS (SELECT 1 FROM "Agenda" y WHERE y."rotinaId" = r."id" AND y."status" = 'PENDENTE');
