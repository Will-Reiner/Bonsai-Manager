import { useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { EmptyState, ErrorState, PageHeader, Spinner } from '@/components/ui';
import { ItemNotificacao } from '@/components/comunidade/ItemNotificacao';
import { comunidadeApi } from '@/lib/endpoints';
import { keys, useNotificacoes } from '@/lib/queries';
import { useFimDaLista } from '@/lib/useFimDaLista';

/** Avisos da Comunidade. Abrir marca tudo como lido (o destaque das novas fica até sair da tela). */
export function NotificacoesPage() {
  const queryClient = useQueryClient();
  const lista = useNotificacoes();
  const itens = useMemo(() => lista.data?.pages.flatMap((p) => p.itens) ?? [], [lista.data]);
  const marcou = useRef(false);
  const fim = useFimDaLista(() => {
    if (lista.hasNextPage && !lista.isFetchingNextPage) void lista.fetchNextPage();
  }, [itens.length]);

  useEffect(() => {
    if (!lista.isSuccess || marcou.current) return;
    marcou.current = true;
    comunidadeApi
      .marcarLidas()
      .then(() => queryClient.setQueryData(keys.naoLidas, { total: 0 }))
      .catch(() => undefined);
  }, [lista.isSuccess, queryClient]);

  return (
    <div className="pb-10">
      <PageHeader title="Notificações" back />
      <div className="mx-auto max-w-2xl px-4 pt-4">
        {lista.isLoading ? (
          <Spinner />
        ) : lista.isError ? (
          <ErrorState text="Não foi possível carregar as notificações." erro={lista.error} onRetry={() => lista.refetch()} />
        ) : itens.length ? (
          <>
            <ul className="card divide-y divide-line overflow-hidden">
              {itens.map((n) => (
                <li key={n.id}>
                  <ItemNotificacao n={n} />
                </li>
              ))}
            </ul>
            <div ref={fim} />
            {lista.isFetchingNextPage && <Spinner />}
          </>
        ) : (
          <EmptyState title="Nada por aqui ainda" text="Curtidas, comentários e novos seguidores aparecem aqui." />
        )}
      </div>
    </div>
  );
}
