import { PrismaClient } from '@prisma/client';
import { EspecieRepository } from '../types/planta.types';

export class PrismaEspecieRepository implements EspecieRepository {
  constructor(private prisma: PrismaClient) {}

  async existsById(id: string): Promise<boolean> {
    const count = await this.prisma.especie.count({
      where: {
        id,
      },
    });
    return count > 0;
  }
}