import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

// Estendemos a interface Request do Express para incluir nossa propriedade 'user'
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string };
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // 1. Obter o cabeçalho de autorização
  const authHeader = req.headers.authorization;

  // 2. Verificar se o cabeçalho existe e tem o formato correto ("Bearer TOKEN")
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
  }

  // 3. Extrair o token do cabeçalho
  const token = authHeader.split(' ')[1];

  try {
    // 4. Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    
    // 5. Anexar o ID do usuário à requisição para ser usado nas próximas rotas
    req.user = { userId: decoded.userId };
    
    // 6. Chamar a próxima função no ciclo da requisição (o controller)
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
};