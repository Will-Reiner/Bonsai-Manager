import { useMemo } from 'react';
import { Link } from 'react-router';
import { EmptyState, ErrorState, Spinner } from '@/components/ui';
import { capaDoPost } from '@/lib/comunidade';
import { usePostsDoPerfil } from '@/lib/queries';
import { useFimDaLista } from '@/lib/useFimDaLista';

/** Mesmo tipo de `usePostsDoPerfil` e `useSalvos` (lista infinita de posts). */
type Consulta = ReturnType<typeof usePostsDoPerfil>;

/** Grade de posts com rolagem infinita (perfil, salvos). */
export function GradeDePosts({ consulta, vazio }: { consulta: Consulta; vazio: { title: string; text?: string } }) {
  const posts = useMemo(() => consulta.data?.pages.flatMap((p) => p.itens) ?? [], [consulta.data]);
  const fim = useFimDaLista(() => {
    if (consulta.hasNextPage && !consulta.isFetchingNextPage) void consulta.fetchNextPage();
  }, [posts.length]);

  if (consulta.isLoading) return <Spinner />;
  if (consulta.isError) return <ErrorState text="Não foi possível carregar os posts." erro={consulta.error} onRetry={() => consulta.refetch()} />;
  if (!posts.length) return <EmptyState title={vazio.title} text={vazio.text} />;
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
      {consulta.isFetchingNextPage && <Spinner />}
    </>
  );
}

/** Todos os posts de um perfil (inclui o acervo fora do feed). */
export function GradePosts({ usuarioId }: { usuarioId: string }) {
  return (
    <GradeDePosts
      consulta={usePostsDoPerfil(usuarioId)}
      vazio={{ title: 'Ainda sem posts', text: 'Os dias com foto das plantas da comunidade aparecem aqui.' }}
    />
  );
}
