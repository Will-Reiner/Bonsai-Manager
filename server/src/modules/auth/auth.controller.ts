import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { registerSchema, loginSchema, updateUserSchema } from './auth.schema';
import { RegisterUseCase, LoginUseCase, GetMeUseCase, UpdateMeUseCase } from './use-cases';
import { PrismaAuthRepository } from './repositories/prisma-auth.repository';
import { BcryptPasswordService } from './services/password.service';
import { JwtTokenService } from './services/token.service';

// Initialize dependencies
const authRepository = new PrismaAuthRepository();
const passwordService = new BcryptPasswordService();
const tokenService = new JwtTokenService();

// Initialize use cases
const registerUseCase = new RegisterUseCase(authRepository, passwordService);
const loginUseCase = new LoginUseCase(authRepository, passwordService, tokenService);
const getMeUseCase = new GetMeUseCase(authRepository);
const updateMeUseCase = new UpdateMeUseCase(authRepository);

export const authController = {
  register: async (req: Request, res: Response) => {
    try {
      const { nome, email, senha, nomePublico, localidade } = registerSchema.parse(req).body;

      const result = await registerUseCase.execute({
        nome,
        email,
        senha,
        nomePublico,
        localidade,
      });

      return res.status(201).json(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Este email já está em uso.') {
          return res.status(409).json({ message: error.message });
        }
        return res.status(400).json({ message: error.message });
      }
      return res.status(400).json({ error });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const { email, senha } = loginSchema.parse(req).body;

      const result = await loginUseCase.execute({
        email,
        senha,
      });

      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Email ou senha inválidos.') {
          return res.status(401).json({ message: error.message });
        }
        return res.status(400).json({ message: error.message });
      }
      return res.status(400).json({ error });
    }
  },

  getMe: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'ID do utilizador não encontrado no token.' });
    }
    try {
      const result = await getMeUseCase.execute({ userId });
      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Utilizador não encontrado.') {
          return res.status(404).json({ message: error.message });
        }
        return res.status(500).json({ message: error.message });
      }
      return res.status(500).json({ message: 'Erro ao buscar dados do utilizador.' });
    }
  },
  
  updateMe: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({ message: 'Não autorizado.' });
    }
    try {
        const dataToUpdate = updateUserSchema.parse(req).body;
        
        const result = await updateMeUseCase.execute({
          userId,
          ...dataToUpdate,
        });
        
        return res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Utilizador não encontrado.') {
          return res.status(404).json({ message: error.message });
        }
        return res.status(400).json({ message: error.message });
      }
      return res.status(400).json({ error });
    }
  },
};