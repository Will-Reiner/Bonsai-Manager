import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { createRecursoSchema, updateRecursoSchema, recursoIdSchema } from './recurso.schema';

export const recursoController = {
  // Criar um novo recurso para o utilizador logado
  create: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const data = createRecursoSchema.parse(req).body;

      const novoRecurso = await prisma.recurso.create({
        data: {
          ...data,
          usuarioId, // Liga o recurso ao utilizador logado
        },
      });

      return res.status(201).json(novoRecurso);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  // Listar todos os recursos DO UTILIZADOR LOGADO
  getAllByUser: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const recursos = await prisma.recurso.findMany({
        where: { usuarioId },
        include: { tipoRecurso: true }, // Inclui os dados do tipo de recurso na resposta
      });
      return res.status(200).json(recursos);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar recursos.' });
    }
  },

  // Obter um recurso específico, verificando se pertence ao utilizador
  getById: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { id } = recursoIdSchema.parse(req).params;

      const recurso = await prisma.recurso.findFirst({
        where: { id, usuarioId }, // A CONDIÇÃO DE SEGURANÇA!
        include: { tipoRecurso: true },
      });

      if (!recurso) {
        return res.status(404).json({ message: 'Recurso não encontrado ou não pertence a si.' });
      }

      return res.status(200).json(recurso);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  // Atualizar um recurso, verificando se pertence ao utilizador
  update: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { id } = updateRecursoSchema.parse(req).params;
      const dataToUpdate = updateRecursoSchema.parse(req).body;

      // Primeiro, verifica se o recurso existe e pertence ao utilizador
      const recursoExistente = await prisma.recurso.findFirst({ where: { id, usuarioId } });
      if (!recursoExistente) {
        return res.status(404).json({ message: 'Recurso não encontrado ou não pertence a si.' });
      }

      const recursoAtualizado = await prisma.recurso.update({
        where: { id },
        data: dataToUpdate,
      });

      return res.status(200).json(recursoAtualizado);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  // Apagar um recurso, verificando se pertence ao utilizador
  delete: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const { id } = recursoIdSchema.parse(req).params;

      const recursoExistente = await prisma.recurso.findFirst({ where: { id, usuarioId } });
      if (!recursoExistente) {
        return res.status(404).json({ message: 'Recurso não encontrado ou não pertence a si.' });
      }

      await prisma.recurso.delete({ where: { id } });

      return res.status(204).send();
    } catch (error) {
      return res.status(400).json({ error });
    }
  },
};