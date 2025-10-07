// Setup global para testes
import { jest } from '@jest/globals';

// Mock do Prisma Client e Enums
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    planta: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    especie: {
      findUnique: jest.fn(),
    },
    $disconnect: jest.fn(),
  })),
  ModoAquisicao: {
    SEMENTE: 'SEMENTE',
    ESTACA: 'ESTACA',
    ALPORQUIA: 'ALPORQUIA',
    YAMADORI: 'YAMADORI',
    COMPRA: 'COMPRA',
  },
}));

// Configurações globais para testes
beforeEach(() => {
  jest.clearAllMocks();
});