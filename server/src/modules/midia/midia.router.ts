import { Router } from 'express';
import { MidiaController } from './midia.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const midiaRouter = Router();
const midiaController = new MidiaController();

midiaRouter.use(authMiddleware);

midiaRouter.post('/presigned-url', midiaController.generatePresignedUrl.bind(midiaController));

export default midiaRouter;
