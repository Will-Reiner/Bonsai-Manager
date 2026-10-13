import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { ConfirmSheet } from '@/components/Sheet';
import { Avatar, Button, ErrorState, Spinner } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { comunidadeApi } from '@/lib/endpoints';
import { tempoRelativo } from '@/lib/format';
import { keys, useComentarios } from '@/lib/queries';
import type { ComentarioComunidade } from '@/types';

const LIMITE = 1000;

/** Comentários do post (mais antigos primeiro) e o campo para escrever. */
export function ComentariosDoPost({ postId }: { postId: string }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const lista = useComentarios(postId);
  const comentarios = useMemo(() => lista.data?.pages.flatMap((p) => p.itens) ?? [], [lista.data]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [apagar, setApagar] = useState<ComentarioComunidade | null>(null);
  const [apagando, setApagando] = useState(false);

  const atualizar = async () => {
    await queryClient.invalidateQueries({ queryKey: keys.comentarios(postId) });
    // O número de comentários no cartão vem do post
    queryClient.invalidateQueries({ queryKey: keys.post(postId) });
    queryClient.invalidateQueries({ queryKey: keys.comunidade, refetchType: 'none' });
  };

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    try {
      await comunidadeApi.comentar(postId, texto.trim());
      setTexto('');
      await atualizar();
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarApagar() {
    if (!apagar) return;
    setApagando(true);
    try {
      await comunidadeApi.apagarComentario(apagar.id);
      setApagar(null);
      await atualizar();
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setApagando(false);
    }
  }

  return (
    <section id="comentarios" className="scroll-mt-20">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Comentários</h2>
      {lista.isLoading ? (
        <Spinner />
      ) : lista.isError ? (
        <ErrorState text="Não foi possível carregar os comentários." erro={lista.error} onRetry={() => lista.refetch()} />
      ) : comentarios.length ? (
        <ul className="space-y-3">
          {comentarios.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Link to={`/comunidade/u/${c.autor.id}`} aria-label={`Perfil de ${c.autor.nome}`}>
                <Avatar url={c.autor.fotoPerfilUrl} nome={c.autor.nome} size={32} />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-line break-words text-sm">
                  <Link to={`/comunidade/u/${c.autor.id}`} className="mr-1.5 font-semibold">
                    {c.autor.nome}
                  </Link>
                  {c.texto}
                </p>
                <p className="mt-0.5 text-xs text-muted">{tempoRelativo(c.createdAt)}</p>
              </div>
              {c.podeApagar && (
                <button
                  type="button"
                  onClick={() => setApagar(c)}
                  aria-label="Apagar comentário"
                  className="flex size-8 items-center justify-center rounded-full text-muted"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Ainda sem comentários.</p>
      )}
      {lista.hasNextPage && (
        <button type="button" onClick={() => lista.fetchNextPage()} className="mt-3 text-sm font-medium text-primary">
          {lista.isFetchingNextPage ? 'Carregando…' : 'Ver mais comentários'}
        </button>
      )}

      <form onSubmit={enviar} className="mt-4 flex items-end gap-2">
        <textarea
          className="input min-h-11 flex-1 resize-none"
          rows={1}
          maxLength={LIMITE}
          placeholder="Escreva um comentário"
          aria-label="Comentário"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <Button type="submit" loading={enviando} disabled={!texto.trim()}>
          Enviar
        </Button>
      </form>

      <ConfirmSheet
        open={!!apagar}
        onClose={() => setApagar(null)}
        onConfirm={confirmarApagar}
        loading={apagando}
        title="Apagar comentário?"
        text="Ele some para todo mundo."
        confirmLabel="Apagar"
      />
    </section>
  );
}
