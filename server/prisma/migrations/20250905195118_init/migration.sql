-- CreateEnum
CREATE TYPE "AgendaStatus" AS ENUM ('PENDENTE', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "RecursoStatus" AS ENUM ('DISPONIVEL', 'EM_FALTA', 'ENCOMENDADO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Especie" (
    "id" TEXT NOT NULL,
    "nomeCientifico" TEXT NOT NULL,
    "nomeComum" TEXT,
    "informacoesGerais" TEXT,

    CONSTRAINT "Especie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Planta" (
    "id" TEXT NOT NULL,
    "nome" TEXT,
    "dataAquisicao" TIMESTAMP(3),
    "statusAtual" TEXT,
    "visao" TEXT,
    "objetivoAno" TEXT,
    "dataProximoTransplante" TIMESTAMP(3),
    "prioridadeTransplante" INTEGER,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "especieId" TEXT NOT NULL,

    CONSTRAINT "Planta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Atividade" (
    "id" TEXT NOT NULL,
    "nome_atividade" TEXT NOT NULL,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Atividade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipoRecurso" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "TipoRecurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AtividadeRecursoNecessario" (
    "atividadeId" TEXT NOT NULL,
    "tipoRecursoId" TEXT NOT NULL,

    CONSTRAINT "AtividadeRecursoNecessario_pkey" PRIMARY KEY ("atividadeId","tipoRecursoId")
);

-- CreateTable
CREATE TABLE "Agenda" (
    "id" TEXT NOT NULL,
    "dataAgendada" TIMESTAMP(3) NOT NULL,
    "dataConcluida" TIMESTAMP(3),
    "status" "AgendaStatus" NOT NULL DEFAULT 'PENDENTE',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "plantaId" TEXT NOT NULL,
    "atividadeId" TEXT NOT NULL,

    CONSTRAINT "Agenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recurso" (
    "id" TEXT NOT NULL,
    "quantidadeDisponivel" INTEGER NOT NULL,
    "unidadeMedida" TEXT,
    "status" "RecursoStatus" NOT NULL DEFAULT 'DISPONIVEL',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipoRecursoId" TEXT NOT NULL,

    CONSTRAINT "Recurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroAtividadeHistorico" (
    "id" TEXT NOT NULL,
    "dataRealizacao" TIMESTAMP(3) NOT NULL,
    "atividadeRealizada" TEXT NOT NULL,
    "recursosUtilizados" TEXT,
    "detalhes" TEXT,
    "observacaoFutura" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plantaId" TEXT NOT NULL,

    CONSTRAINT "RegistroAtividadeHistorico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Foto" (
    "id" TEXT NOT NULL,
    "caminhoArquivo" TEXT NOT NULL,
    "dataUpload" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plantaId" TEXT NOT NULL,

    CONSTRAINT "Foto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Especie_nomeCientifico_key" ON "Especie"("nomeCientifico");

-- CreateIndex
CREATE UNIQUE INDEX "Atividade_nome_atividade_key" ON "Atividade"("nome_atividade");

-- CreateIndex
CREATE UNIQUE INDEX "TipoRecurso_nome_key" ON "TipoRecurso"("nome");

-- AddForeignKey
ALTER TABLE "Planta" ADD CONSTRAINT "Planta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Planta" ADD CONSTRAINT "Planta_especieId_fkey" FOREIGN KEY ("especieId") REFERENCES "Especie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeRecursoNecessario" ADD CONSTRAINT "AtividadeRecursoNecessario_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "Atividade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AtividadeRecursoNecessario" ADD CONSTRAINT "AtividadeRecursoNecessario_tipoRecursoId_fkey" FOREIGN KEY ("tipoRecursoId") REFERENCES "TipoRecurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agenda" ADD CONSTRAINT "Agenda_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agenda" ADD CONSTRAINT "Agenda_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "Atividade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recurso" ADD CONSTRAINT "Recurso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recurso" ADD CONSTRAINT "Recurso_tipoRecursoId_fkey" FOREIGN KEY ("tipoRecursoId") REFERENCES "TipoRecurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroAtividadeHistorico" ADD CONSTRAINT "RegistroAtividadeHistorico_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_plantaId_fkey" FOREIGN KEY ("plantaId") REFERENCES "Planta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
