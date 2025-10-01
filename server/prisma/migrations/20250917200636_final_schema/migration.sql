/*
  Warnings:

  - You are about to drop the column `observacoes` on the `Agenda` table. All the data in the column will be lost.
  - You are about to drop the column `nome_atividade` on the `Atividade` table. All the data in the column will be lost.
  - You are about to drop the column `informacoesGerais` on the `Especie` table. All the data in the column will be lost.
  - You are about to drop the column `dataUpload` on the `Foto` table. All the data in the column will be lost.
  - You are about to drop the column `descricao` on the `Foto` table. All the data in the column will be lost.
  - You are about to drop the column `dataProximoTransplante` on the `Planta` table. All the data in the column will be lost.
  - You are about to drop the column `objetivoAno` on the `Planta` table. All the data in the column will be lost.
  - You are about to drop the column `prioridadeTransplante` on the `Planta` table. All the data in the column will be lost.
  - You are about to drop the column `statusAtual` on the `Planta` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Recurso` table. All the data in the column will be lost.
  - The `unidadeMedida` column on the `Recurso` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `AtividadeRecursoNecessario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RegistroAtividadeHistorico` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[nome]` on the table `Atividade` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nome` to the `Atividade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usuarioId` to the `Foto` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UnidadeMedida" AS ENUM ('UNIDADE', 'KG', 'G', 'L', 'ML');

-- CreateEnum
CREATE TYPE "ModoAquisicao" AS ENUM ('SEMENTE', 'ESTACA', 'ALPORQUIA', 'YAMADORI', 'COMPRA');

-- CreateEnum
CREATE TYPE "Estacao" AS ENUM ('PRIMAVERA', 'VERAO', 'OUTONO', 'INVERNO');

-- CreateEnum
CREATE TYPE "MomentoIdeal" AS ENUM ('DEVE_FAZER', 'PODE_FAZER', 'EVITAR');

-- CreateEnum
CREATE TYPE "RecomendacaoTecnica" AS ENUM ('RECOMENDADA', 'NAO_RECOMENDADA', 'COM_CUIDADO');

-- CreateEnum
CREATE TYPE "TipoPlanta" AS ENUM ('PERENE', 'CADUCIFOLIA', 'SEMI_CADUCA', 'ARVORE', 'ARBUSTO', 'CONIFERA');

-- DropForeignKey
ALTER TABLE "AtividadeRecursoNecessario" DROP CONSTRAINT "AtividadeRecursoNecessario_atividadeId_fkey";

-- DropForeignKey
ALTER TABLE "AtividadeRecursoNecessario" DROP CONSTRAINT "AtividadeRecursoNecessario_tipoRecursoId_fkey";

-- DropForeignKey
ALTER TABLE "RegistroAtividadeHistorico" DROP CONSTRAINT "RegistroAtividadeHistorico_plantaId_fkey";

-- DropIndex
DROP INDEX "Atividade_nome_atividade_key";

-- AlterTable
ALTER TABLE "Agenda" DROP COLUMN "observacoes",
ADD COLUMN     "detalhes" TEXT,
ADD COLUMN     "observacaoFutura" TEXT;

-- AlterTable
ALTER TABLE "Atividade" DROP COLUMN "nome_atividade",
ADD COLUMN     "cuidadosPosProcedimento" TEXT,
ADD COLUMN     "execucao" TEXT,
ADD COLUMN     "nome" TEXT NOT NULL,
ADD COLUMN     "objetivos" TEXT,
ADD COLUMN     "preparacao" TEXT;

-- AlterTable
ALTER TABLE "Especie" DROP COLUMN "informacoesGerais",
ADD COLUMN     "adubacao" TEXT,
ADD COLUMN     "clima" TEXT,
ADD COLUMN     "contras" TEXT,
ADD COLUMN     "familia" TEXT,
ADD COLUMN     "flores" TEXT,
ADD COLUMN     "folhas" TEXT,
ADD COLUMN     "frutos" TEXT,
ADD COLUMN     "linhasDeRaciocinio" TEXT,
ADD COLUMN     "luminosidade" TEXT,
ADD COLUMN     "observacoes" TEXT,
ADD COLUMN     "origem" TEXT,
ADD COLUMN     "problemasComuns" TEXT,
ADD COLUMN     "pros" TEXT,
ADD COLUMN     "raizes" TEXT,
ADD COLUMN     "rega" TEXT,
ADD COLUMN     "substratoIdeal" TEXT,
ADD COLUMN     "tipoDePlanta" "TipoPlanta",
ADD COLUMN     "tronco" TEXT;

-- AlterTable
ALTER TABLE "Foto" DROP COLUMN "dataUpload",
DROP COLUMN "descricao",
ADD COLUMN     "tags" TEXT,
ADD COLUMN     "titulo" TEXT,
ADD COLUMN     "usuarioId" TEXT NOT NULL,
ALTER COLUMN "plantaId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Planta" DROP COLUMN "dataProximoTransplante",
DROP COLUMN "objetivoAno",
DROP COLUMN "prioridadeTransplante",
DROP COLUMN "statusAtual",
ADD COLUMN     "historicoPublico" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "modoAquisicao" "ModoAquisicao",
ADD COLUMN     "plantaPublica" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Recurso" DROP COLUMN "status",
DROP COLUMN "unidadeMedida",
ADD COLUMN     "unidadeMedida" "UnidadeMedida";

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "fotoPerfilUrl" TEXT,
ADD COLUMN     "localidade" TEXT,
ADD COLUMN     "nomePublico" TEXT,
ADD COLUMN     "perfilPublico" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "recursosHabilitado" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "AtividadeRecursoNecessario";

-- DropTable
DROP TABLE "RegistroAtividadeHistorico";

-- DropEnum
DROP TYPE "RecursoStatus";

-- CreateTable
CREATE TABLE "Ferramenta" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "Ferramenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Amizade" (
    "seguidorId" TEXT NOT NULL,
    "seguidoId" TEXT NOT NULL,

    CONSTRAINT "Amizade_pkey" PRIMARY KEY ("seguidorId","seguidoId")
);

-- CreateTable
CREATE TABLE "GuiaDeTecnicas" (
    "especieId" TEXT NOT NULL,
    "atividadeId" TEXT NOT NULL,
    "recomendacao" "RecomendacaoTecnica" NOT NULL,
    "observacoes" TEXT,

    CONSTRAINT "GuiaDeTecnicas_pkey" PRIMARY KEY ("especieId","atividadeId")
);

-- CreateTable
CREATE TABLE "GuiaSazonal" (
    "especieId" TEXT NOT NULL,
    "atividadeId" TEXT NOT NULL,
    "estacao" "Estacao" NOT NULL,
    "momentoIdeal" "MomentoIdeal" NOT NULL,
    "observacoes" TEXT,

    CONSTRAINT "GuiaSazonal_pkey" PRIMARY KEY ("especieId","atividadeId","estacao")
);

-- CreateTable
CREATE TABLE "Inspiracao" (
    "plantaId" TEXT NOT NULL,
    "fotoId" TEXT NOT NULL,

    CONSTRAINT "Inspiracao_pkey" PRIMARY KEY ("plantaId","fotoId")
);

-- CreateTable
CREATE TABLE "AgendaRecursoUtilizado" (
    "agendaId" TEXT NOT NULL,
    "recursoId" TEXT NOT NULL,
    "quantidadeUtilizada" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "AgendaRecursoUtilizado_pkey" PRIMARY KEY ("agendaId","recursoId")
);

-- CreateTable
CREATE TABLE "AtividadeRecursoSugerido" (
    "atividadeId" TEXT NOT NULL,
    "tipoRecursoId" TEXT NOT NULL,

    CONSTRAINT "AtividadeRecursoSugerido_pkey" PRIMARY KEY ("atividadeId","tipoRecursoId")
);

-- CreateTable
CREATE TABLE "AtividadeFerramentaSugerida" (
    "atividadeId" TEXT NOT NULL,
    "ferramentaId" TEXT NOT NULL,

    CONSTRAINT "AtividadeFerramentaSugerida_pkey" PRIMARY KEY ("atividadeId","ferramentaId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ferramenta_nome_key" ON "Ferramenta"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Atividade_nome_key" ON "Atividade"("nome");

-- AddForeignKey
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amizade" ADD CONSTRAINT "Amizade_seguidorId_fkey" FOREIGN KEY ("seguidorId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amizade" ADD CONSTRAINT "Amizade_seguidoId_fkey" FOREIGN KEY ("seguidoId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuiaDeTecnicas" ADD CONSTRAINT "GuiaDeTecnicas_especieId_fkey" FOREIGN KEY ("especieId") REFERENCES "Especie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuiaDeTecnicas" ADD CONSTRAINT "GuiaDeTecnicas_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "Atividade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuiaSazonal" ADD CONSTRAINT "GuiaSazonal_especieId_fkey" FOREIGN KEY ("especieId") REFERENCES "Especie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuiaSazonal" ADD CONSTRAINT "GuiaSazonal_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "Atividade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspiracao" ADD CONSTRAINT "Inspiracao_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspiracao" ADD CONSTRAINT "Inspiracao_fotoId_fkey" FOREIGN KEY ("fotoId") REFERENCES "Foto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaRecursoUtilizado" ADD CONSTRAINT "AgendaRecursoUtilizado_agendaId_fkey" FOREIGN KEY ("agendaId") REFERENCES "Agenda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaRecursoUtilizado" ADD CONSTRAINT "AgendaRecursoUtilizado_recursoId_fkey" FOREIGN KEY ("recursoId") REFERENCES "Recurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeRecursoSugerido" ADD CONSTRAINT "AtividadeRecursoSugerido_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "Atividade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeRecursoSugerido" ADD CONSTRAINT "AtividadeRecursoSugerido_tipoRecursoId_fkey" FOREIGN KEY ("tipoRecursoId") REFERENCES "TipoRecurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeFerramentaSugerida" ADD CONSTRAINT "AtividadeFerramentaSugerida_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "Atividade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeFerramentaSugerida" ADD CONSTRAINT "AtividadeFerramentaSugerida_ferramentaId_fkey" FOREIGN KEY ("ferramentaId") REFERENCES "Ferramenta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
