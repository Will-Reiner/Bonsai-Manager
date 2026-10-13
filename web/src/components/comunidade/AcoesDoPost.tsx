import { Link } from 'react-router';
import { Icone } from '@/components/Icone';
import { rotuloComentarios, rotuloCurtidas } from '@/lib/comunidade';
import type { useInteracoesDoPost } from './useInteracoesDoPost';
import type { PostComunidade } from '@/types';

/** Curtir, comentar e salvar; abaixo, curtidas e o atalho para os comentários. */
export function AcoesDoPost({ post, interacoes }: { post: PostComunidade; interacoes: ReturnType<typeof useInteracoesDoPost> }) {
  const { curtiu, curtidas, salvou, curtir, salvar } = interacoes;
  return (
    <div className="space-y-1">
      <div className="-mx-2 flex items-center">
        <button
          type="button"
          onClick={() => curtir(!curtiu)}
          aria-label={curtiu ? 'Descurtir' : 'Curtir'}
          aria-pressed={curtiu}
          className={`flex size-10 items-center justify-center rounded-full transition active:scale-90 ${curtiu ? 'text-hanko' : 'text-ink'}`}
        >
          <Icone nome="curtir" ativo={curtiu} size={24} />
        </button>
        <Link to={`/comunidade/post/${post.id}#comentarios`} aria-label="Comentar" className="flex size-10 items-center justify-center rounded-full text-ink">
          <Icone nome="comentar" size={24} />
        </Link>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => salvar(!salvou)}
          aria-label={salvou ? 'Tirar dos salvos' : 'Salvar'}
          aria-pressed={salvou}
          className="flex size-10 items-center justify-center rounded-full text-ink transition active:scale-90"
        >
          <Icone nome="salvar" ativo={salvou} size={24} />
        </button>
      </div>
      {curtidas > 0 && <p className="text-sm font-semibold">{rotuloCurtidas(curtidas)}</p>}
      {post.totalComentarios > 0 && (
        <Link to={`/comunidade/post/${post.id}#comentarios`} className="block text-sm text-muted">
          {rotuloComentarios(post.totalComentarios)}
        </Link>
      )}
    </div>
  );
}
