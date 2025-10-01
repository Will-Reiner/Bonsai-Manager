import { Router } from 'express';
import { authController } from './auth.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const authRouter = Router();

authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);

// Rotas que exigem que o usuário esteja autenticado
authRouter.get('/me', authMiddleware, authController.getMe);
authRouter.put('/me', authMiddleware, authController.updateMe); // <-- NOVA ROTA

export default authRouter;