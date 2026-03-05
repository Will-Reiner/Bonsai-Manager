-- AlterTable
ALTER TABLE "Planta" ADD COLUMN "identificador" TEXT;

-- CreateTable
CREATE TABLE "PreferenciaUsuario" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreferenciaUsuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PreferenciaUsuario_usuarioId_chave_key" ON "PreferenciaUsuario"("usuarioId", "chave");

-- CreateIndex
CREATE UNIQUE INDEX "Planta_usuarioId_identificador_key" ON "Planta"("usuarioId", "identificador");

-- AddForeignKey
ALTER TABLE "PreferenciaUsuario" ADD CONSTRAINT "PreferenciaUsuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
