import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { agendaIdSchema } from '../agenda/agenda.schema';
import { PrismaRotinaRepository } from './repositories/prisma-rotina.repository';
import { atualizarRotinaSchema, criarRotinasSchema, listarRotinasSchema, rotinaIdSchema } from './rotina.schema';
import {
  AlternarPausaRotinaUseCase,
  ApagarRotinaUseCase,
  AtualizarRotinaUseCase,
  CriarRotinasUseCase,
  ListarRotinasUseCase,
  PularTarefaUseCase,
} from './use-cases';

const repo = new PrismaRotinaRepository();
const criar = new CriarRotinasUseCase(repo);
const listar = new ListarRotinasUseCase(repo);
const atualizar = new AtualizarRotinaUseCase(repo);
const alternarPausa = new AlternarPausaRotinaUseCase(repo);
const apagar = new ApagarRotinaUseCase(repo);
const pular = new PularTarefaUseCase(repo);

const MENSAGENS_400 = ['Atividade não encontrada.', 'Máximo de 200 rotinas por vez.', 'A data final é antes da primeira tarefa.'];

/** Traduz erros de domínio/validação em status HTTP. */
export function responderErroRotina(res: Response, error: unknown, contexto: string) {
  if (error instanceof ZodError) return res.status(400).json({ error: error.errors[0]?.message ?? 'Dados inválidos' });
  if (error instanceof Error) {
    if (['Rotina não encontrada.', 'Acesso negado ou agendamento não encontrado.'].includes(error.message)) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Acesso negado. A planta não pertence a si.') return res.status(403).json({ error: error.message });
    if ([...MENSAGENS_400, 'Só tarefas de rotina podem ser puladas.'].includes(error.message)) {
      return res.status(400).json({ error: error.message });
    }
  }
  console.error(`Erro ao ${contexto}:`, error);
  return res.status(500).json({ error: 'Erro interno do servidor' });
}

export const rotinaController = {
  criar: async (req: Request, res: Response) => {
    try {
      const { body } = criarRotinasSchema.parse({ body: req.body });
      res.status(201).json(await criar.execute(body, req.user!.userId));
    } catch (error) {
      responderErroRotina(res, error, 'criar rotinas');
    }
  },

  listar: async (req: Request, res: Response) => {
    try {
      const { query } = listarRotinasSchema.parse({ query: req.query });
      res.json(await listar.execute(req.user!.userId, query.plantaId));
    } catch (error) {
      responderErroRotina(res, error, 'listar rotinas');
    }
  },

  atualizar: async (req: Request, res: Response) => {
    try {
      const { params, body } = atualizarRotinaSchema.parse({ params: req.params, body: req.body });
      res.json(await atualizar.execute(params.id, body, req.user!.userId));
    } catch (error) {
      responderErroRotina(res, error, 'atualizar rotina');
    }
  },

  pausar: async (req: Request, res: Response) => {
    try {
      const { params } = rotinaIdSchema.parse({ params: req.params });
      res.json(await alternarPausa.execute(params.id, true, req.user!.userId));
    } catch (error) {
      responderErroRotina(res, error, 'pausar rotina');
    }
  },

  retomar: async (req: Request, res: Response) => {
    try {
      const { params } = rotinaIdSchema.parse({ params: req.params });
      res.json(await alternarPausa.execute(params.id, false, req.user!.userId));
    } catch (error) {
      responderErroRotina(res, error, 'retomar rotina');
    }
  },

  apagar: async (req: Request, res: Response) => {
    try {
      const { params } = rotinaIdSchema.parse({ params: req.params });
      await apagar.execute(params.id, req.user!.userId);
      res.status(204).send();
    } catch (error) {
      responderErroRotina(res, error, 'apagar rotina');
    }
  },

  pular: async (req: Request, res: Response) => {
    try {
      const { params } = agendaIdSchema.parse({ params: req.params });
      res.json(await pular.execute(params.id, req.user!.userId));
    } catch (error) {
      responderErroRotina(res, error, 'pular tarefa');
    }
  },
};
