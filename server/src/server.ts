import express from 'express';
import 'dotenv/config';
import authRouter from './modules/auth/auth.router';
import especieRouter from './modules/especie/especie.router';
import plantaRouter from './modules/planta/planta.router';
import atividadeRouter from './modules/atividade/atividade.router';
import agendaRouter from './modules/agenda/agenda.router';
import tipoRecursoRouter from './modules/tipo-recurso/tipo-recurso.router';
import recursoRouter from './modules/recurso/recurso.router';
import historicoRouter from './modules/historico/historico.router';
import fotoRouter from './modules/foto/foto.router';
import { atividadeRecursoRouter } from './modules/atividade-recurso/atividade-recurso.router';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Bonsai API is running!');
});

// Usar as rotas com prefixos
app.use('/api/auth', authRouter);
app.use('/api/especies', especieRouter);
app.use('/api/plantas', plantaRouter);
app.use('/api/atividades', atividadeRouter);
app.use('/api/agendas', agendaRouter);
app.use('/api/tipos-recurso', tipoRecursoRouter);
app.use('/api/recursos', recursoRouter);
app.use('/api/historicos', historicoRouter);
app.use('/api/fotos', fotoRouter);
app.use('/api/atividades-recursos', atividadeRecursoRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});