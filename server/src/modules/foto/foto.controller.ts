import { Request, Response } from 'express';
import { createFotoSchema, updateFotoSchema, fotoIdSchema, plantaIdSchema } from './foto.schema';
import { PrismaFotoRepository } from './repositories/prisma-foto.repository';
import {
  CreateFotoUseCase,
  GetFotosByPlantaUseCase,
  GetFotoByIdUseCase,
  UpdateFotoUseCase,
  DeleteFotoUseCase,
} from './use-cases';

export class FotoController {
  private createFotoUseCase: CreateFotoUseCase;
  private getFotosByPlantaUseCase: GetFotosByPlantaUseCase;
  private getFotoByIdUseCase: GetFotoByIdUseCase;
  private updateFotoUseCase: UpdateFotoUseCase;
  private deleteFotoUseCase: DeleteFotoUseCase;

  constructor() {
    const fotoRepository = new PrismaFotoRepository();
    this.createFotoUseCase = new CreateFotoUseCase(fotoRepository);
    this.getFotosByPlantaUseCase = new GetFotosByPlantaUseCase(fotoRepository);
    this.getFotoByIdUseCase = new GetFotoByIdUseCase(fotoRepository);
    this.updateFotoUseCase = new UpdateFotoUseCase(fotoRepository);
    this.deleteFotoUseCase = new DeleteFotoUseCase(fotoRepository);
  }

  async create(req: Request, res: Response) {
    try {
      const { body: createData } = createFotoSchema.parse({ body: req.body });
      const usuarioId = req.user?.userId;

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const foto = await this.createFotoUseCase.execute(createData, usuarioId);

      res.status(201).json(foto);
    } catch (error) {
      console.error('Erro ao criar foto:', error);
      
      if (error instanceof Error && error.message === 'Planta não encontrada ou não pertence a si.') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getAllByPlanta(req: Request, res: Response) {
    try {
      const { params: { plantaId } } = plantaIdSchema.parse({ params: req.params });
      const usuarioId = req.user?.userId;

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const fotos = await this.getFotosByPlantaUseCase.execute(plantaId, usuarioId);

      res.json(fotos);
    } catch (error) {
      console.error('Erro ao buscar fotos da planta:', error);
      
      if (error instanceof Error && error.message === 'Planta não encontrada ou não pertence a si.') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { params: { id } } = fotoIdSchema.parse({ params: req.params });
      const usuarioId = req.user?.userId;

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const foto = await this.getFotoByIdUseCase.execute(id, usuarioId);

      res.json(foto);
    } catch (error) {
      console.error('Erro ao buscar foto:', error);
      
      if (error instanceof Error && error.message === 'Foto não encontrada ou não pertence a si.') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { params: { id }, body: updateData } = updateFotoSchema.parse({ params: req.params, body: req.body });
      const usuarioId = req.user?.userId;

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const updatedFoto = await this.updateFotoUseCase.execute(id, updateData, usuarioId);

      res.json(updatedFoto);
    } catch (error) {
      console.error('Erro ao atualizar foto:', error);
      
      if (error instanceof Error && error.message === 'Foto não encontrada ou não pertence a si.') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { params: { id } } = fotoIdSchema.parse({ params: req.params });
      const usuarioId = req.user?.userId;

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      await this.deleteFotoUseCase.execute(id, usuarioId);

      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar foto:', error);
      
      if (error instanceof Error && error.message === 'Foto não encontrada ou não pertence a si.') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}