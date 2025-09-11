import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { 
  createAtividadeRecursoSchema, 
  atividadeRecursoIdSchema, 
  atividadeIdSchema,
  tipoRecursoIdSchema
} from './atividade-recurso.schema';

export const atividadeRecursoController = {
  // Associar um tipo de recurso a uma atividade
  create: async (req: Request, res: Response) => {
    try {
      const data = createAtividadeRecursoSchema.parse(req).body;
      
      // Verificar se a atividade existe
      const atividade = await prisma.atividade.findUnique({
        where: { id: data.atividadeId },
      });
      
      if (!atividade) {
        return res.status(404).json({ message: 'Atividade não encontrada.' });
      }
      
      // Verificar se o tipo de recurso existe
      const tipoRecurso = await prisma.tipoRecurso.findUnique({
        where: { id: data.tipoRecursoId },
      });
      
      if (!tipoRecurso) {
        return res.status(404).json({ message: 'Tipo de recurso não encontrado.' });
      }
      
      // Verificar se a associação já existe
      const associacaoExistente = await prisma.atividadeRecursoNecessario.findUnique({
        where: {
          atividadeId_tipoRecursoId: {
            atividadeId: data.atividadeId,
            tipoRecursoId: data.tipoRecursoId,
          },
        },
      });
      
      if (associacaoExistente) {
        return res.status(409).json({ message: 'Esta associação já existe.' });
      }
      
      // Criar a associação
      const novaAssociacao = await prisma.atividadeRecursoNecessario.create({
        data,
      });
      
      return res.status(201).json(novaAssociacao);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },
  
  // Listar todos os tipos de recursos necessários para uma atividade específica
  getByAtividade: async (req: Request, res: Response) => {
    try {
      const { atividadeId } = atividadeIdSchema.parse(req).params;
      
      // Verificar se a atividade existe
      const atividade = await prisma.atividade.findUnique({
        where: { id: atividadeId },
      });
      
      if (!atividade) {
        return res.status(404).json({ message: 'Atividade não encontrada.' });
      }
      
      // Buscar os tipos de recursos associados à atividade
      const tiposRecurso = await prisma.atividadeRecursoNecessario.findMany({
        where: { atividadeId },
        include: { tipoRecurso: true },
      });
      
      return res.status(200).json(tiposRecurso);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },
  
  // Listar todas as atividades que necessitam de um tipo de recurso específico
  getByTipoRecurso: async (req: Request, res: Response) => {
    try {
      const { tipoRecursoId } = tipoRecursoIdSchema.parse(req).params;
      
      // Verificar se o tipo de recurso existe
      const tipoRecurso = await prisma.tipoRecurso.findUnique({
        where: { id: tipoRecursoId },
      });
      
      if (!tipoRecurso) {
        return res.status(404).json({ message: 'Tipo de recurso não encontrado.' });
      }
      
      // Buscar as atividades associadas ao tipo de recurso
      const atividades = await prisma.atividadeRecursoNecessario.findMany({
        where: { tipoRecursoId },
        include: { atividade: true },
      });
      
      return res.status(200).json(atividades);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },
  
  // Remover a associação entre uma atividade e um tipo de recurso
  delete: async (req: Request, res: Response) => {
    try {
      const { atividadeId, tipoRecursoId } = atividadeRecursoIdSchema.parse(req).params;
      
      // Verificar se a associação existe
      const associacao = await prisma.atividadeRecursoNecessario.findUnique({
        where: {
          atividadeId_tipoRecursoId: {
            atividadeId,
            tipoRecursoId,
          },
        },
      });
      
      if (!associacao) {
        return res.status(404).json({ message: 'Associação não encontrada.' });
      }
      
      // Remover a associação
      await prisma.atividadeRecursoNecessario.delete({
        where: {
          atividadeId_tipoRecursoId: {
            atividadeId,
            tipoRecursoId,
          },
        },
      });
      
      return res.status(204).send();
    } catch (error) {
      return res.status(400).json({ error });
    }
  },
};