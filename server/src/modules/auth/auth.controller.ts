import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { registerSchema, loginSchema } from './auth.schema';

export const authController = {
  register: async (req: Request, res: Response) => {
    try {
      // 1. Validação dos dados com Zod
      const { nome, email, senha } = registerSchema.parse(req).body;

      // 2. Verificar se o usuário já existe
      const userExists = await prisma.usuario.findUnique({ where: { email } });
      if (userExists) {
        return res.status(409).json({ message: 'Este email já está em uso.' });
      }

      // 3. Criptografar a senha
      const senhaHash = await bcrypt.hash(senha, 10);

      // 4. Salvar o novo usuário no banco
      const newUser = await prisma.usuario.create({
        data: {
          nome,
          email,
          senhaHash,
        },
      });

      // 5. Retornar uma resposta de sucesso (sem a senha)
      return res.status(201).json({
        id: newUser.id,
        nome: newUser.nome,
        email: newUser.email,
      });
    } catch (error) {
      // Tratamento de erros de validação do Zod e outros erros
      return res.status(400).json({ error });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      // 1. Validação dos dados
      const { email, senha } = loginSchema.parse(req).body;

      // 2. Encontrar o usuário no banco
      const user = await prisma.usuario.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: 'Email ou senha inválidos.' });
      }

      // 3. Comparar a senha enviada com a senha criptografada no banco
      const isPasswordValid = await bcrypt.compare(senha, user.senhaHash);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Email ou senha inválidos.' });
      }

      // 4. Gerar o token JWT
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET as string,
        { expiresIn: '7d' } // Token expira em 7 dias
      );

      // 5. Enviar a resposta com o token e dados do usuário
      return res.status(200).json({
        token,
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
        },
      });
    } catch (error) {
      return res.status(400).json({ error });
    }
  },

  // NOVA FUNÇÃO A SER ADICIONADA
  // ================================================================
  getMe: async (req: Request, res: Response) => {
    // O ID do usuário foi anexado à requisição pelo nosso middleware
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(400).json({ message: 'ID do usuário não encontrado no token.' });
    }

    try {
      const user = await prisma.usuario.findUnique({
        where: { id: userId },
        // Selecionamos quais campos retornar para não expor a senha
        select: {
          id: true,
          nome: true,
          email: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
      }

      return res.status(200).json(user);
    } catch (error) {
      return res.status(500).json({ message: 'Erro ao buscar dados do usuário.' });
    }
  },
};
