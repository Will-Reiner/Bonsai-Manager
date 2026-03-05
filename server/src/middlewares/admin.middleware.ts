import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

interface JwtPayload {
  userId: string;
}

export const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Reutilizamos a lógica do authMiddleware para verificar o token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
  }
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;

    // Passo extra: Verificar o papel do utilizador na base de dados
    const user = await prisma.usuario.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return res.status(401).json({ message: 'Utilizador do token não encontrado.' });
    }

    // A verificação principal: o utilizador é um ADMIN?
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Acesso negado. Ação exclusiva para administradores.' });
    }

    // Se for admin, anexa o ID à requisição e continua
    req.user = { userId: decoded.userId };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
};