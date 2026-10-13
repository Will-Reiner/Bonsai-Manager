import { useState } from 'react';
import { Avatar } from '@/components/ui';
import { CardPost } from './CardPost';
import { capaDoPost, chaveDoPost } from '@/lib/comunidade';
import { tempoRelativo } from '@/lib/format';
import type { AutorComunidade, PostComunidade } from '@/types';

const MINIATURAS = 8;

/** Vários posts seguidos da mesma pessoa no mesmo dia: um cartão com miniaturas, que abre nos posts. */
export function CardGrupo({ autor, posts }: { autor: AutorComunidade; posts: PostComunidade[] }) {
  const [aberto, setAberto] = useState(false);
  if (aberto) return <>{posts.map((p) => <CardPost key={chaveDoPost(p)} post={p} />)}</>;
  return (
    <button type="button" onClick={() => setAberto(true)} className="card block w-full p-3 text-left">
      <div className="flex items-center gap-3">
        <Avatar url={autor.fotoPerfilUrl} nome={autor.nome} size={36} />
        <p className="min-w-0 flex-1 text-sm">
          <span className="font-semibold">{autor.nome}</span> cuidou de {posts.length} plantas
          <span className="block text-xs text-muted">{tempoRelativo(posts[0].publicadoEm)}</span>
        </p>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        {posts.slice(0, MINIATURAS).map((p) => (
          <img key={p.id} src={capaDoPost(p) ?? undefined} alt="" loading="lazy" className="aspect-square w-full rounded-lg bg-vazio object-cover" />
        ))}
      </div>
      <p className="mt-2 text-sm font-medium text-primary">Ver todos</p>
    </button>
  );
}
