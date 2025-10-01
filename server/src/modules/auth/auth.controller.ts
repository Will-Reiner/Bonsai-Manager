import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { registerSchema, loginSchema, updateUserSchema } from './auth.schema';

export const authController = {
  register: async (req: Request, res: Response) => {
    try {
      // Zod agora valida os novos campos também
      const { nome, email, senha, nomePublico, localidade } = registerSchema.parse(req).body;

      const userExists = await prisma.usuario.findUnique({ where: { email } });
      if (userExists) {
        return res.status(409).json({ message: 'Este email já está em uso.' });
      }

      const senhaHash = await bcrypt.hash(senha, 10);

      // Salva o novo usuário com os novos campos
      const newUser = await prisma.usuario.create({
        data: {
          nome,
          email,
          senhaHash,
          nomePublico: nomePublico || nome, // Se não fornecer nome público, usa o nome real como padrão
          localidade,
        },
      });

      // Retorna uma resposta de sucesso (sem a senha)
      const { senhaHash: _, ...userWithoutPassword } = newUser;
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const { email, senha } = loginSchema.parse(req).body;
      const user = await prisma.usuario.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: 'Email ou senha inválidos.' });
      }
      const isPasswordValid = await bcrypt.compare(senha, user.senhaHash);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Email ou senha inválidos.' });
      }

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET as string,
        { expiresIn: '7d' }
      );

      const { senhaHash: _, ...userWithoutPassword } = user;
      return res.status(200).json({
        token,
        user: userWithoutPassword,
      });
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  getMe: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: 'ID do utilizador não encontrado no token.' });
    }
    try {
      const user = await prisma.usuario.findUnique({
        where: { id: userId },
        include: {
          // Incluímos as relações sociais
          seguindo: { select: { seguido: { select: { id: true, nomePublico: true, fotoPerfilUrl: true } } } },
          seguidores: { select: { seguidor: { select: { id: true, nomePublico: true, fotoPerfilUrl: true } } } },
          // E AGORA INCLUÍMOS AS PLANTAS TAMBÉM
          plantas: { select: { id: true } } // Só precisamos do ID para fazer a contagem
        }
      });

      if (!user) {
        return res.status(404).json({ message: 'Utilizador não encontrado.' });
      }

      const { senhaHash, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
      
    } catch (error) {
      return res.status(500).json({ message: 'Erro ao buscar dados do utilizador.' });
    }
  },
  
  // --- NOVA FUNÇÃO ---
  // Para o usuário atualizar o próprio perfil
  updateMe: async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        return res.status(401).json({ message: 'Não autorizado.' });
    }
    try {
        const dataToUpdate = updateUserSchema.parse(req).body;
        const updatedUser = await prisma.usuario.update({
            where: { id: userId },
            data: dataToUpdate,
            select: { // Garante que não vamos retornar a senha
                id: true, nome: true, nomePublico: true, email: true, localidade: true,
                fotoPerfilUrl: true, bio: true, perfilPublico: true, recursosHabilitado: true,
                createdAt: true, role: true,
            }
        });
        return res.status(200).json(updatedUser);
    } catch (error) {
        return res.status(400).json({ error });
    }
  },
};