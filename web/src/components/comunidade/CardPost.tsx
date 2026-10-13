import { Link } from 'react-router';
import { Avatar } from '@/components/ui';
import { CuidadosDoPost } from './CuidadosDoPost';
import { FotosDoPost } from './FotosDoPost';
import { dataLonga, plantaCodigoNome, tempoRelativo } from '@/lib/format';
import type { PostComunidade } from '@/types';

/** Um post: quem, qual planta, fotos do dia e os cuidados (quando o histórico é público). */
export function CardPost({ post }: { post: PostComunidade }) {
  return (
    <article className="card overflow-hidden">
      <header className="flex items-center gap-3 p-3">
        <Link to={`/comunidade/u/${post.autor.id}`} aria-label={`Perfil de ${post.autor.nome}`}>
          <Avatar url={post.autor.fotoPerfilUrl} nome={post.autor.nome} size={36} />
        </Link>
        <div className="min-w-0 flex-1 leading-tight">
          <Link to={`/comunidade/u/${post.autor.id}`} className="block truncate font-semibold">
            {post.autor.nome}
          </Link>
          <Link to={`/comunidade/planta/${post.planta.id}`} className="block truncate text-xs text-muted">
            {plantaCodigoNome(post.planta)}
          </Link>
        </div>
        <time className="shrink-0 text-xs text-muted" dateTime={post.publicadoEm}>
          {tempoRelativo(post.publicadoEm)}
        </time>
      </header>
      <FotosDoPost fotos={post.fotos} />
      <div className="space-y-2 p-3">
        <CuidadosDoPost cuidados={post.cuidados} />
        <Link to={`/comunidade/post/${post.id}`} className="block text-xs text-muted">
          {dataLonga(`${post.dia}T12:00:00`)}
        </Link>
      </div>
    </article>
  );
}
