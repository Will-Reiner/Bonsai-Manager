import { PrismaClient } from '@prisma/client';
import { PreferenciaRepository, PreferenciaResponseDTO } from '../preferencia.types';

export class PrismaPreferenciaRepository implements PreferenciaRepository {
  constructor(private prisma: PrismaClient) {}

  async findAllByUsuario(usuarioId: string): Promise<PreferenciaResponseDTO[]> {
    return await this.prisma.preferenciaUsuario.findMany({
      where: { usuarioId },
    });
  }

  async upsert(usuarioId: string, chave: string, valor: string): Promise<PreferenciaResponseDTO> {
    return await this.prisma.preferenciaUsuario.upsert({
      where: {
        usuarioId_chave: { usuarioId, chave },
      },
      update: { valor },
      create: { usuarioId, chave, valor },
    });
  }

  async upsertMany(usuarioId: string, preferencias: Record<string, string>): Promise<PreferenciaResponseDTO[]> {
    const operations = Object.entries(preferencias).map(([chave, valor]) =>
      this.prisma.preferenciaUsuario.upsert({
        where: {
          usuarioId_chave: { usuarioId, chave },
        },
        update: { valor },
        create: { usuarioId, chave, valor },
      })
    );

    return await this.prisma.$transaction(operations);
  }
}
