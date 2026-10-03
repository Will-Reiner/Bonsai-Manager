import { PrismaClient } from '@prisma/client';

// Singleton: em serverless (Vercel) a mesma instância é reaproveitada entre invocações "quentes",
// evitando abrir uma conexão nova a cada request.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

globalForPrisma.prisma = prisma;
