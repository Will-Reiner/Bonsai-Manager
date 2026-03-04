import { Request, Response } from 'express';
import {
  upsertPreferenciaSchema,
  upsertPreferenciasEmLoteSchema,
} from './preferencia.schema';
import { GetPreferenciasUseCase } from './use-cases/get-preferencias.use-case';
import { UpsertPreferenciaUseCase } from './use-cases/upsert-preferencia.use-case';
import { UpsertPreferenciasEmLoteUseCase } from './use-cases/upsert-preferencias-em-lote.use-case';
import { PrismaPreferenciaRepository } from './repositories/prisma-preferencia.repository';
import { prisma } from '../../lib/prisma';

const preferenciaRepository = new PrismaPreferenciaRepository(prisma);
const getPreferenciasUseCase = new GetPreferenciasUseCase(preferenciaRepository);
const upsertPreferenciaUseCase = new UpsertPreferenciaUseCase(preferenciaRepository);
const upsertPreferenciasEmLoteUseCase = new UpsertPreferenciasEmLoteUseCase(preferenciaRepository);

export const preferenciaController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const usuarioId = req.user!.userId;
      const preferencias = await getPreferenciasUseCase.execute(usuarioId);
      return res.status(200).json(preferencias);
    } catch (error) {
      console.error('ERRO AO BUSCAR PREFERÊNCIAS:', error);
      return res.status(500).json({ error: 'Erro ao buscar preferências.' });
    }
  },

  upsertEmLote: async (req: Request, res: Response) => {
    try {
      const { preferencias } = upsertPreferenciasEmLoteSchema.parse(req).body;
      const usuarioId = req.user!.userId;

      await upsertPreferenciasEmLoteUseCase.execute(usuarioId, preferencias);
      const resultado = await getPreferenciasUseCase.execute(usuarioId);
      return res.status(200).json(resultado);
    } catch (error) {
      console.error('ERRO AO SALVAR PREFERÊNCIAS EM LOTE:', error);

      if (error instanceof Error) {
        if (error.message === 'Nenhuma preferência fornecida.') {
          return res.status(400).json({ message: error.message });
        }
      }

      return res.status(400).json({ error });
    }
  },

  upsert: async (req: Request, res: Response) => {
    try {
      const { chave } = upsertPreferenciaSchema.parse(req).params;
      const { valor } = upsertPreferenciaSchema.parse(req).body;
      const usuarioId = req.user!.userId;

      const resultado = await upsertPreferenciaUseCase.execute(usuarioId, chave, valor);
      return res.status(200).json(resultado);
    } catch (error) {
      console.error('ERRO AO SALVAR PREFERÊNCIA:', error);
      return res.status(400).json({ error });
    }
  },
};
