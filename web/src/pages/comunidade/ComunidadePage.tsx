import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { BotaoTopo, OpcoesChips } from '@/components/Preferencias';
import { Button, EmptyState, ErrorState, Spinner } from '@/components/ui';
import { CardGrupo } from '@/components/comunidade/CardGrupo';
import { CardPost } from '@/components/comunidade/CardPost';
import { FaixaPerfilPrivado } from '@/components/comunidade/FaixaPerfilPrivado';
import { useAuth } from '@/context/AuthContext';
import { agruparFeed } from '@/lib/comunidade';
import { authApi } from '@/lib/endpoints';
import { keys, useFeed } from '@/lib/queries';
import { useFimDaLista } from '@/lib/useFimDaLista';
import type { AbaFeed } from '@/types';

const ABAS: { value: AbaFeed; label: string }[] = [
  { value: 'seguindo', label: 'Seguindo' },
  { value: 'explorar', label: 'Explorar' },
];

/** Aba Comunidade: feed de quem eu sigo ou de todo mundo, com 3+ posts da mesma pessoa no mesmo dia agrupados. */
export function ComunidadePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const me = useQuery({ queryKey: keys.me, queryFn: authApi.me });
  const [params, setParams] = useSearchParams();
  const escolhida = params.get('aba') as AbaFeed | null;
  // Sem ninguém seguido, abre em Explorar
  const aba: AbaFeed = escolhida ?? (me.data && !me.data.seguindo?.length ? 'explorar' : 'seguindo');
  const pronto = !!escolhida || !me.isLoading;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-safe">
      <header className="flex items-center gap-2 pb-2 pt-6">
        <h1 className="flex-1 text-3xl font-semibold">Comunidade</h1>
        <BotaoTopo label="Buscar pessoas" onClick={() => navigate('/comunidade/buscar')}>
          <Search size={20} />
        </BotaoTopo>
      </header>
      <OpcoesChips titulo="" opcoes={ABAS} value={aba} onChange={(v) => setParams({ aba: v }, { replace: true })} />
      {user && !user.perfilPublico && (
        <div className="mt-4">
          <FaixaPerfilPrivado />
        </div>
      )}
      <div className="mt-4">
        {pronto ? <Feed aba={aba} irParaExplorar={() => setParams({ aba: 'explorar' }, { replace: true })} /> : <Spinner />}
      </div>
    </div>
  );
}

function Feed({ aba, irParaExplorar }: { aba: AbaFeed; irParaExplorar: () => void }) {
  const feed = useFeed(aba);
  const posts = useMemo(() => feed.data?.pages.flatMap((p) => p.itens) ?? [], [feed.data]);
  const itens = useMemo(() => agruparFeed(posts), [posts]);
  const fim = useFimDaLista(() => {
    if (feed.hasNextPage && !feed.isFetchingNextPage) void feed.fetchNextPage();
  }, [posts.length]);

  if (feed.isLoading) return <Spinner />;
  if (feed.isError) return <ErrorState text="Não foi possível carregar a comunidade." erro={feed.error} onRetry={() => feed.refetch()} />;
  if (!itens.length) {
    return aba === 'seguindo' ? (
      <EmptyState
        title="Siga pessoas para ver aqui"
        text="Em Explorar estão os posts de todo mundo."
        action={<Button onClick={irParaExplorar}>Ir para Explorar</Button>}
      />
    ) : (
      <EmptyState title="Ainda não há posts" text="Quando alguém mostrar as plantas, os dias com foto aparecem aqui." />
    );
  }
  return (
    <div className="space-y-4 pb-6">
      {itens.map((item) =>
        item.tipo === 'post' ? <CardPost key={item.post.id} post={item.post} /> : <CardGrupo key={item.chave} autor={item.autor} posts={item.posts} />,
      )}
      <div ref={fim} />
      {feed.isFetchingNextPage && <Spinner />}
    </div>
  );
}
