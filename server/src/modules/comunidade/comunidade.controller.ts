import { Request, Response } from 'express';
import { buscaSchema, comentarSchema, feedSchema, idSchema, paginaSchema, postsDoPerfilSchema } from './comunidade.schema';
import { PrismaInteracoesRepository } from './repositories/prisma-interacoes.repository';
import { PrismaLeituraComunidadeRepository } from './repositories/prisma-leitura.repository';
import { ApagarComentarioUseCase } from './use-cases/apagar-comentario.use-case';
import { BuscarPerfisUseCase } from './use-cases/buscar-perfis.use-case';
import { ComentarUseCase } from './use-cases/comentar.use-case';
import { ContarNaoLidasUseCase } from './use-cases/contar-nao-lidas.use-case';
import { CurtirPostUseCase } from './use-cases/curtir-post.use-case';
import { ListarComentariosUseCase } from './use-cases/listar-comentarios.use-case';
import { ListarNotificacoesUseCase } from './use-cases/listar-notificacoes.use-case';
import { ListarPostsDoPerfilUseCase } from './use-cases/listar-posts-do-perfil.use-case';
import { ListarSalvosUseCase } from './use-cases/listar-salvos.use-case';
import { MarcarLidasUseCase } from './use-cases/marcar-lidas.use-case';
import { ObterFeedUseCase } from './use-cases/obter-feed.use-case';
import { ObterPerfilUseCase } from './use-cases/obter-perfil.use-case';
import { ObterPlantaPublicaUseCase } from './use-cases/obter-planta-publica.use-case';
import { ObterPostUseCase } from './use-cases/obter-post.use-case';
import { SalvarPostUseCase } from './use-cases/salvar-post.use-case';
import { respostaDoErro } from './erros';

const repo = new PrismaLeituraComunidadeRepository();
const obterFeed = new ObterFeedUseCase(repo);
const obterPost = new ObterPostUseCase(repo);
const obterPerfil = new ObterPerfilUseCase(repo);
const listarPostsDoPerfil = new ListarPostsDoPerfilUseCase(repo);
const obterPlantaPublica = new ObterPlantaPublicaUseCase(repo);
const buscarPerfis = new BuscarPerfisUseCase(repo);
const interacoes = new PrismaInteracoesRepository();
const curtirPost = new CurtirPostUseCase(repo, interacoes);
const salvarPost = new SalvarPostUseCase(repo, interacoes);
const comentar = new ComentarUseCase(repo, interacoes);
const apagarComentario = new ApagarComentarioUseCase(interacoes);
const listarComentarios = new ListarComentariosUseCase(repo);
const listarSalvos = new ListarSalvosUseCase(repo);
const listarNotificacoes = new ListarNotificacoesUseCase(repo);
const contarNaoLidas = new ContarNaoLidasUseCase(repo);
const marcarLidas = new MarcarLidasUseCase(interacoes);

/** Executa a ação e traduz os erros (ver respostaDoErro); sem resultado → 204; erro inesperado vai para o log. */
const responder = (ler: (req: Request, viewerId: string) => Promise<unknown>) => async (req: Request, res: Response) => {
  try {
    const resultado = await ler(req, req.user!.userId);
    return resultado === undefined ? res.status(204).send() : res.status(200).json(resultado);
  } catch (error) {
    const { status, body } = respostaDoErro(error);
    if (status === 500) console.error('[comunidade] erro', error);
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
  curtir: responder((req, eu) => curtirPost.execute(eu, idSchema.parse(req).params.id, true)),
  descurtir: responder((req, eu) => curtirPost.execute(eu, idSchema.parse(req).params.id, false)),
  salvar: responder((req, eu) => salvarPost.execute(eu, idSchema.parse(req).params.id, true)),
  dessalvar: responder((req, eu) => salvarPost.execute(eu, idSchema.parse(req).params.id, false)),
  comentarios: responder((req, eu) => {
    const { params, query } = postsDoPerfilSchema.parse(req);
    return listarComentarios.execute(eu, params.id, query.cursor);
  }),
  comentar: responder((req, eu) => {
    const { params, body } = comentarSchema.parse(req);
    return comentar.execute(eu, params.id, body.texto);
  }),
  apagarComentario: responder((req, eu) => apagarComentario.execute(eu, idSchema.parse(req).params.id)),
  salvos: responder((req, eu) => listarSalvos.execute(eu, paginaSchema.parse(req).query.cursor)),
  notificacoes: responder((req, eu) => listarNotificacoes.execute(eu, paginaSchema.parse(req).query.cursor)),
  naoLidas: responder((_req, eu) => contarNaoLidas.execute(eu)),
  marcarLidas: responder((_req, eu) => marcarLidas.execute(eu)),
};
