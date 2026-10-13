import { useMemo } from 'react';
import { Link } from 'react-router';
import { EmptyState, ErrorState, Spinner } from '@/components/ui';
import { capaDoPost } from '@/lib/comunidade';
import { usePostsDoPerfil } from '@/lib/queries';
import { useFimDaLista } from '@/lib/useFimDaLista';

/** Grade de todos os posts de um perfil (inclui o acervo fora do feed), com rolagem infinita. */
export function GradePosts({ usuarioId }: { usuarioId: string }) {
  const lista = usePostsDoPerfil(usuarioId);
  const posts = useMemo(() => lista.data?.pages.flatMap((p) => p.itens) ?? [], [lista.data]);
  const fim = useFimDaLista(() => {
    if (lista.hasNextPage && !lista.isFetchingNextPage) void lista.fetchNextPage();
  }, [posts.length]);

  if (lista.isLoading) return <Spinner />;
  if (lista.isError) return <ErrorState text="Não foi possível carregar os posts." erro={lista.error} onRetry={() => lista.refetch()} />;
  if (!posts.length) return <EmptyState title="Ainda sem posts" text="Os dias com foto das plantas da comunidade aparecem aqui." />;
  return (
    <>
      <div className="grid grid-cols-3 gap-1">
        {posts.map((p) => (
          <Link key={p.id} to={`/comunidade/post/${p.id}`} className="block">
            <img src={capaDoPost(p) ?? undefined} alt="" loading="lazy" className="aspect-square w-full bg-vazio object-cover" />
          </Link>
        ))}
      </div>
      <div ref={fim} />
      {lista.isFetchingNextPage && <Spinner />}
    </>
  );
}
