import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { parsePagination, buildPaginatedResponse } from '../../utils/pagination';
import { createAgendaSchema, createAgendasLoteSchema, updateAgendaSchema, agendaIdSchema, concluirAgendasSchema, registrarCuidadosSchema, editarCuidadoSchema, excluirCuidadoSchema } from './agenda.schema';
import { PrismaCuidadoRepository } from './repositories/prisma-cuidado.repository';
import { PrismaAgendaRepository } from './repositories/prisma-agenda.repository';
import { PrismaConclusaoRepository } from './repositories/prisma-conclusao.repository';
import {
  CreateAgendaUseCase,
  CreateAgendasLoteUseCase,
  GetAllAgendasByUserUseCase,
  GetAgendaByIdUseCase,
  UpdateAgendaUseCase,
  DeleteAgendaUseCase,
  ConcluirAgendasUseCase,
  RegistrarCuidadosUseCase,
  EditarCuidadoUseCase,
  ExcluirCuidadoUseCase,
} from './use-cases';
import { CreateAgendaDTO, CreateAgendasLoteDTO, UpdateAgendaDTO, ConcluirAgendasDTO, RegistrarCuidadosDTO, EditarCuidadoDTO } from './agenda.types';
import '../../middlewares/auth.middleware'; // Import para garantir que a extensão da interface Request seja reconhecida
import { mensagemDoErro } from '../../utils/errors';
import { emSequencia, ReavaliarGruposUseCase } from '../planta/use-cases/reavaliar-grupos';
import { criarSincronizadorDePosts } from '../comunidade/sincronizar-posts';
import { PrismaReavaliacaoRepository } from '../planta/repositories/prisma-reavaliacao.repository';

export class AgendaController {
  private createAgendaUseCase: CreateAgendaUseCase;
  private createAgendasLoteUseCase: CreateAgendasLoteUseCase;
  private getAllAgendasByUserUseCase: GetAllAgendasByUserUseCase;
  private getAgendaByIdUseCase: GetAgendaByIdUseCase;
  private updateAgendaUseCase: UpdateAgendaUseCase;
  private deleteAgendaUseCase: DeleteAgendaUseCase;
  private concluirAgendasUseCase: ConcluirAgendasUseCase;
  private registrarCuidadosUseCase: RegistrarCuidadosUseCase;
  private editarCuidadoUseCase: EditarCuidadoUseCase;
  private excluirCuidadoUseCase: ExcluirCuidadoUseCase;

  constructor() {
    // Toda escrita de tarefa reavalia Recém transplantada e os posts da Comunidade (foto de cuidado muda de dia)
    const reavaliar = emSequencia(new ReavaliarGruposUseCase(new PrismaReavaliacaoRepository()), criarSincronizadorDePosts());
    const agendaRepository = new PrismaAgendaRepository();
    this.createAgendaUseCase = new CreateAgendaUseCase(agendaRepository);
    this.createAgendasLoteUseCase = new CreateAgendasLoteUseCase(agendaRepository);
    this.getAllAgendasByUserUseCase = new GetAllAgendasByUserUseCase(agendaRepository);
    this.getAgendaByIdUseCase = new GetAgendaByIdUseCase(agendaRepository);
    this.updateAgendaUseCase = new UpdateAgendaUseCase(agendaRepository, reavaliar);
    this.deleteAgendaUseCase = new DeleteAgendaUseCase(agendaRepository, reavaliar);
    const conclusaoRepository = new PrismaConclusaoRepository();
    this.concluirAgendasUseCase = new ConcluirAgendasUseCase(conclusaoRepository, reavaliar);
    this.registrarCuidadosUseCase = new RegistrarCuidadosUseCase(conclusaoRepository, reavaliar);
    const cuidadoRepository = new PrismaCuidadoRepository();
    this.editarCuidadoUseCase = new EditarCuidadoUseCase(cuidadoRepository, reavaliar);
    this.excluirCuidadoUseCase = new ExcluirCuidadoUseCase(cuidadoRepository, reavaliar);
  }

  async getById(req: Request, res: Response) {
    try {
      const { params } = agendaIdSchema.parse({ params: req.params });
      const usuarioId = req.user?.userId;

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const agenda = await this.getAgendaByIdUseCase.execute(params.id, usuarioId);
      res.json(agenda);
    } catch (error) {
      if (error instanceof Error && error.message === 'Agendamento não encontrado.') {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { body } = createAgendaSchema.parse({ body: req.body });
      const usuarioId = req.user?.userId;

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const agenda = await this.createAgendaUseCase.execute(body as CreateAgendaDTO, usuarioId);

      res.status(201).json(agenda);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: mensagemDoErro(error) });
      }
      console.error('Erro ao criar agendamento:', error);

      if (error instanceof Error && error.message === 'Acesso negado. A planta não pertence a si.') {
        return res.status(403).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async createLote(req: Request, res: Response) {
    try {
      const { body } = createAgendasLoteSchema.parse({ body: req.body });
      const usuarioId = req.user?.userId;

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const agendas = await this.createAgendasLoteUseCase.execute(body as CreateAgendasLoteDTO, usuarioId);
      res.status(201).json(agendas);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: mensagemDoErro(error) });
      }
      if (error instanceof Error && error.message === 'Acesso negado. A planta não pertence a si.') {
        return res.status(403).json({ error: error.message });
      }
      const MENSAGENS_400 = [
        'Informe ao menos um cuidado.',
        'Informe ao menos uma planta.',
        'Máximo de 2000 tarefas por vez.',
        'Atividade não encontrada.',
      ];
      if (error instanceof Error && MENSAGENS_400.includes(error.message)) {
        return res.status(400).json({ error: error.message });
      }

      console.error('Erro ao criar agendamentos em lote:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getAllByUser(req: Request, res: Response) {
    try {
      const usuarioId = req.user?.userId;

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const agendas = await this.getAllAgendasByUserUseCase.execute(usuarioId);

      if (req.query.page) {
        const params = parsePagination(req.query);
        const paginatedData = agendas.slice(params.skip, params.skip + params.take);
        return res.json(buildPaginatedResponse(paginatedData, agendas.length, params));
      }

      res.json(agendas);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { params } = agendaIdSchema.parse({ params: req.params });
      const { body } = updateAgendaSchema.parse({ body: req.body, params: req.params });
      const usuarioId = req.user?.userId;

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const updatedAgenda = await this.updateAgendaUseCase.execute(params.id, body as UpdateAgendaDTO, usuarioId);

      res.json(updatedAgenda);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: mensagemDoErro(error) });
      }
      console.error('Erro ao atualizar agendamento:', error);

      if (error instanceof Error && error.message === 'Acesso negado ou agendamento não encontrado.') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { params } = agendaIdSchema.parse({ params: req.params });
      const usuarioId = req.user?.userId;

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      await this.deleteAgendaUseCase.execute(params.id, usuarioId);

      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar agendamento:', error);
      
      if (error instanceof Error && error.message === 'Acesso negado ou agendamento não encontrado.') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /** Mensagens dos use cases de cuidado que viram 400 (as de acesso viram 404). */
  private static readonly ERROS_CUIDADO = [
    'O cuidado precisa estar concluído.',
    'As tarefas precisam ser da mesma planta.',
    'Para tirar todas as tarefas, exclua o cuidado.',
    'Tarefa fora do cuidado.',
    'A data não pode ser no futuro.',
  ];

  private erroDoCuidado(res: Response, error: unknown, acao: string) {
    if (error instanceof ZodError) return res.status(400).json({ error: mensagemDoErro(error) });
    if (error instanceof Error && error.message === 'Acesso negado ou agendamento não encontrado.') {
      return res.status(404).json({ error: error.message });
    }
    if (error instanceof Error && AgendaController.ERROS_CUIDADO.includes(error.message)) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Erro ao ' + acao + ' cuidado:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }

  async editarCuidado(req: Request, res: Response) {
    try {
      const { body } = editarCuidadoSchema.parse({ body: req.body });
      const usuarioId = req.user?.userId;
      if (!usuarioId) return res.status(401).json({ error: 'Usuário não autenticado' });
      res.json(await this.editarCuidadoUseCase.execute(body as EditarCuidadoDTO, usuarioId));
    } catch (error) {
      return this.erroDoCuidado(res, error, 'editar');
    }
  }

  async excluirCuidado(req: Request, res: Response) {
    try {
      const { body } = excluirCuidadoSchema.parse({ body: req.body });
      const usuarioId = req.user?.userId;
      if (!usuarioId) return res.status(401).json({ error: 'Usuário não autenticado' });
      await this.excluirCuidadoUseCase.execute(body.agendaIds, usuarioId);
      res.status(204).send();
    } catch (error) {
      return this.erroDoCuidado(res, error, 'excluir');
    }
  }

  async concluir(req: Request, res: Response) {
    try {
      const { body } = concluirAgendasSchema.parse({ body: req.body });
      const usuarioId = req.user?.userId;

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const resultado = await this.concluirAgendasUseCase.execute(body as ConcluirAgendasDTO, usuarioId);
      res.json(resultado);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: mensagemDoErro(error) });
      }
      if (error instanceof Error && error.message === 'Acesso negado ou agendamento não encontrado.') {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof Error && error.message === 'Atividade não encontrada.') {
        return res.status(400).json({ error: error.message });
      }

      console.error('Erro ao concluir agendamentos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async registrar(req: Request, res: Response) {
    try {
      const { body } = registrarCuidadosSchema.parse({ body: req.body });
      const usuarioId = req.user?.userId;

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const resultado = await this.registrarCuidadosUseCase.execute(body as RegistrarCuidadosDTO, usuarioId);
      res.status(201).json(resultado);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: mensagemDoErro(error) });
      }
      if (error instanceof Error && error.message === 'Acesso negado. A planta não pertence a si.') {
        return res.status(403).json({ error: error.message });
      }
      if (error instanceof Error && error.message === 'Acesso negado ou agendamento não encontrado.') {
        return res.status(404).json({ error: error.message });
      }
      if (
        error instanceof Error &&
        [
          'Atividade não encontrada.',
          'Tarefa não corresponde ao cuidado registrado.',
          'Plantas repetidas na lista.',
          'Informe ao menos um cuidado por planta.',
          'A data não pode ser no futuro.',
        ].includes(error.message)
      ) {
        return res.status(400).json({ error: error.message });
      }

      console.error('Erro ao registrar cuidados:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
