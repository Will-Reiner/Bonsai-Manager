-- Remove a Revisão geral por completo: tarefas (pendentes e feitas), rotinas, a atividade e a preferência.
-- Fotos ligadas a essas tarefas continuam na planta (Foto.agendaId vira NULL); insumos usados caem em cascata.
DELETE FROM "Agenda" WHERE "atividadeId" IN (SELECT "id" FROM "Atividade" WHERE "nome" = 'Revisão geral');
DELETE FROM "Rotina" WHERE "revisao" = true OR "atividadeId" IN (SELECT "id" FROM "Atividade" WHERE "nome" = 'Revisão geral');
DELETE FROM "Atividade" WHERE "nome" = 'Revisão geral';
DELETE FROM "PreferenciaUsuario" WHERE "chave" = 'revisao_automatica_dias';

-- AlterTable
ALTER TABLE "Rotina" DROP COLUMN "revisao";
