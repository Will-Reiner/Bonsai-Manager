import express from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import 'dotenv/config';
import authRouter from './modules/auth/auth.router';
import especieRouter from './modules/especie/especie.router';
import plantaRouter from './modules/planta/planta.router';
import atividadeRouter from './modules/atividade/atividade.router';
import agendaRouter from './modules/agenda/agenda.router';
import tipoRecursoRouter from './modules/tipo-recurso/tipo-recurso.router';
import recursoRouter from './modules/recurso/recurso.router';
import fotoRouter from './modules/foto/foto.router';
import { atividadeRecursoRouter } from './modules/atividade-recurso/atividade-recurso.router';
import ferramentaRouter from './modules/ferramenta/ferramenta.router';
import { guiaSazonalRouter } from './modules/guia-sazonal/guia-sazonal.router';
import amizadeRouter from './modules/amizade/amizade.router';
import { inspiracaoRouter } from './modules/inspiracao/inspiracao.router';
import atividadeFerramentaSugeridaRouter from './modules/atividade-ferramenta-sugerida/atividade-ferramenta-sugerida.router';
import { guiaDeTecnicasRouter } from './modules/guia-de-tecnicas/guia-de-tecnicas.router';
import { atividadeRecursoSugeridoRouter } from './modules/atividade-recurso-sugerido/atividade-recurso-sugerido.router';
import userRouter from './modules/user/user.router';
import midiaRouter from './modules/midia/midia.router';
import preferenciaRouter from './modules/preferencia/preferencia.router';
// @ts-ignore
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './docs/swagger';
import { errorMiddleware } from './middlewares/error.middleware';


const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

app.get('/', (_req, res) => {
  res.send('Bonsai API is running!');
});

// Montar Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Usar as rotas com prefixos
app.use('/api/auth', authRouter);
app.use('/api/especies', especieRouter);
app.use('/api/plantas', plantaRouter);
app.use('/api/atividades', atividadeRouter);
app.use('/api/agendas', agendaRouter);
app.use('/api/tipos-recurso', tipoRecursoRouter);
app.use('/api/recursos', recursoRouter);
app.use('/api/fotos', fotoRouter);
app.use('/api/atividades-recursos', atividadeRecursoRouter);
app.use('/api/ferramentas', ferramentaRouter);
app.use('/api/guias-sazonais', guiaSazonalRouter);
app.use('/api/amizades', amizadeRouter);
app.use('/api/inspiracoes', inspiracaoRouter);
app.use('/api/atividades-ferramentas-sugeridas', atividadeFerramentaSugeridaRouter);
app.use('/api/guias-de-tecnicas', guiaDeTecnicasRouter);
app.use('/api/atividades-recursos-sugeridos', atividadeRecursoSugeridoRouter);
app.use('/api/users', userRouter);
app.use('/api/midia', midiaRouter);
app.use('/api/preferencias', preferenciaRouter);

// Middleware global de tratamento de erros (deve ser o último middleware)
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});