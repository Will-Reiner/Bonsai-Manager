import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import {
  createEspecieSchema,
  updateEspecieSchema,
  especieIdSchema,
} from './especie.schema';

export const especieController = {
  create: async (req: Request, res: Response) => {
    try {
      const { nomeCientifico, nomeComum, informacoesGerais } =
        createEspecieSchema.parse(req).body;

      const novaEspecie = await prisma.especie.create({
        data: { nomeCientifico, nomeComum, informacoesGerais },
      });

      return res.status(201).json(novaEspecie);
    } catch (error) {
      console.error('ERRO AO CRIAR ESPÉCIE:', error);
      return res.status(400).json({ error });
    }
  },

  getAll: async (_req: Request, res: Response) => {
    try {
      const especies = await prisma.especie.findMany();
      return res.status(200).json(especies);
    } catch (error) {
      console.error('ERRO AO BUSCAR ESPÉCIES:', error);
      return res.status(500).json({ error: 'Erro ao buscar espécies.' });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const { id } = especieIdSchema.parse(req).params;
      const especie = await prisma.especie.findUnique({ where: { id } });

      if (!especie) {
        return res.status(404).json({ message: 'Espécie não encontrada.' });
      }

      return res.status(200).json(especie);
    } catch (error) {
      console.error('ERRO AO BUSCAR ESPÉCIE POR ID:', error);
      return res.status(400).json({ error });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id } = especieIdSchema.parse(req).params;
      const dataToUpdate = updateEspecieSchema.parse(req).body;

      const especieAtualizada = await prisma.especie.update({
        where: { id },
        data: dataToUpdate,
      });

      return res.status(200).json(especieAtualizada);
    } catch (error) {
      console.error('ERRO AO ATUALIZAR ESPÉCIE:', error);
      return res.status(400).json({ error });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = especieIdSchema.parse(req).params;
      await prisma.especie.delete({ where: { id } });
      return res.status(204).send();
    } catch (error) {
      console.error('ERRO AO DELETAR ESPÉCIE:', error);
      return res.status(400).json({ error });
    }
  },
};