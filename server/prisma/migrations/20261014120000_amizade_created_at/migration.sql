-- Comunidade: quando começou a seguir (ordenação e notificações da fase 3)
ALTER TABLE "Amizade" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
