import { Request, Response } from 'express';
import { buscaSchema, feedSchema, idSchema, postsDoPerfilSchema } from './comunidade.schema';
import { PrismaLeituraComunidadeRepository } from './repositories/prisma-leitura.repository';
import { BuscarPerfisUseCase } from './use-cases/buscar-perfis.use-case';
import { ListarPostsDoPerfilUseCase } from './use-cases/listar-posts-do-perfil.use-case';
import { ObterFeedUseCase } from './use-cases/obter-feed.use-case';
import { ObterPerfilUseCase } from './use-cases/obter-perfil.use-case';
import { ObterPlantaPublicaUseCase } from './use-cases/obter-planta-publica.use-case';
import { ObterPostUseCase } from './use-cases/obter-post.use-case';
import { respostaDoErro } from './erros';

const repo = new PrismaLeituraComunidadeRepository();
const obterFeed = new ObterFeedUseCase(repo);
const obterPost = new ObterPostUseCase(repo);
const obterPerfil = new ObterPerfilUseCase(repo);
const listarPostsDoPerfil = new ListarPostsDoPerfilUseCase(repo);
const obterPlantaPublica = new ObterPlantaPublicaUseCase(repo);
const buscarPerfis = new BuscarPerfisUseCase(repo);

/** Executa a leitura e traduz os erros (ver respostaDoErro); erro inesperado vai para o log. */
const responder = (ler: (req: Request, viewerId: string) => Promise<unknown>) => async (req: Request, res: Response) => {
  try {
    return res.status(200).json(await ler(req, req.user!.userId));
  } catch (error) {
    const { status, body } = respostaDoErro(error);
    if (status === 500) console.error('[comunidade] erro na leitura', error);
    return res.status(status).json(body);
  }
};

export const comunidadeController = {
  feed: responder((req, eu) => {
    const { aba, cursor } = feedSchema.parse(req).query;
    return obterFeed.execute(eu, aba, cursor);
  }),
  post: responder((req, eu) => obterPost.execute(eu, idSchema.parse(req).params.id)),
  perfil: responder((req, eu) => obterPerfil.execute(eu, idSchema.parse(req).params.id)),
  postsDoPerfil: responder((req, eu) => {
    const { params, query } = postsDoPerfilSchema.parse(req);
    return listarPostsDoPerfil.execute(eu, params.id, query.cursor);
  }),
  planta: responder((req, eu) => obterPlantaPublica.execute(eu, idSchema.parse(req).params.id)),
  buscar: responder((req) => buscarPerfis.execute(buscaSchema.parse(req).query.q)),
};
