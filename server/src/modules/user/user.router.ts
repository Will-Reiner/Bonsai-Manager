import { Router } from 'express';
import { userController } from './user.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const userRouter = Router();
userRouter.use(authMiddleware);

userRouter.get('/', userController.getAllPublicProfiles);
userRouter.get('/:id', userController.getProfileById);

export default userRouter;