import { prisma } from '../../../lib/prisma';
import { 
  InspiracaoRepository, 
  AddInspiracaoDTO, 
  RemoveInspiracaoDTO, 
  InspiracaoResponseDTO 
} from '../inspiracao.types';

export class PrismaInspiracaoRepository implements InspiracaoRepository {
  async add(data: AddInspiracaoDTO): Promise<InspiracaoResponseDTO> {
    const inspiracao = await prisma.inspiracao.create({
      data: {
        plantaId: data.plantaId,
        fotoId: data.fotoId,
      },
    });

    return {
      plantaId: inspiracao.plantaId,
      fotoId: inspiracao.fotoId,
    };
  }

  async remove(data: RemoveInspiracaoDTO): Promise<void> {
    await prisma.inspiracao.delete({
      where: {
        plantaId_fotoId: {
          plantaId: data.plantaId,
          fotoId: data.fotoId,
        },
      },
    });
  }

  async exists(plantaId: string, fotoId: string): Promise<boolean> {
    const inspiracao = await prisma.inspiracao.findUnique({
      where: {
        plantaId_fotoId: {
          plantaId,
          fotoId,
        },
      },
    });

    return !!inspiracao;
  }

  async plantaExistsAndBelongsToUser(plantaId: string, usuarioId: string): Promise<boolean> {
    const planta = await prisma.planta.findFirst({
      where: {
        id: plantaId,
        usuarioId,
      },
    });

    return !!planta;
  }

  async fotoExistsAndCanBeUsedAsInspiration(fotoId: string, usuarioId: string): Promise<boolean> {
    const foto = await prisma.foto.findUnique({
      where: { id: fotoId },
      include: { planta: true },
    });

    if (!foto) {
      return false;
    }

    // Uma foto pode ser inspiração se:
    // - For uma foto genérica (sem planta associada)
    // - A planta associada à foto for pública
    // - A foto pertence ao próprio utilizador
    const podeSerInspiracao = !foto.plantaId || foto.planta?.plantaPublica || foto.usuarioId === usuarioId;

    return podeSerInspiracao;
  }

  async inspiracaoExistsAndBelongsToUser(plantaId: string, fotoId: string, usuarioId: string): Promise<boolean> {
    const inspiracao = await prisma.inspiracao.findFirst({
      where: {
        plantaId,
        fotoId,
        planta: {
          usuarioId,
        },
      },
    });

    return !!inspiracao;
  }
}