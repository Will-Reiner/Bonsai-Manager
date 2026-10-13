import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { Avatar, Button, EmptyState, ErrorState, PageHeader, PlantThumb, Spinner } from '@/components/ui';
import { OpcoesChips } from '@/components/Preferencias';
import { GradePosts } from '@/components/comunidade/GradePosts';
import { useToast } from '@/context/ToastContext';
import { ehNaoEncontrado, errorMessage } from '@/lib/api';
import { comunidadeApi } from '@/lib/endpoints';
import { plantaTitulo } from '@/lib/format';
import { keys, usePerfilPublico } from '@/lib/queries';
import { Numero } from '@/pages/ProfilePages';
import type { PerfilPublico } from '@/types';

type Aba = 'plantas' | 'posts';

/** Perfil público: quem é, contagem, seguir e as abas Plantas / Posts. */
export function PerfilPublicoPage() {
  const { id = '' } = useParams();
  const perfil = usePerfilPublico(id);
  const [aba, setAba] = useState<Aba>('plantas');

  if (perfil.isLoading || perfil.isError || !perfil.data) {
    return (
      <div className="pb-10">
        <PageHeader title="Perfil" back />
        {perfil.isLoading ? (
          <Spinner />
        ) : ehNaoEncontrado(perfil.error) ? (
          <EmptyState title="Perfil não encontrado" text="Ele pode ser privado ou não existir mais." />
        ) : (
          <ErrorState text="Não foi possível carregar o perfil." erro={perfil.error} onRetry={() => perfil.refetch()} />
        )}
      </div>
    );
  }

  const p = perfil.data;
  return (
    <div className="pb-10">
      <PageHeader title={p.nome} back />
      <div className="mx-auto max-w-2xl px-4">
        <section className="card mt-4 p-5">
          <div className="flex items-center gap-4">
            <Avatar url={p.fotoPerfilUrl} nome={p.nome} size={64} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold">{p.nome}</p>
              {p.localidade && (
                <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
                  <MapPin size={14} /> {p.localidade}
                </p>
              )}
            </div>
          </div>
          {p.bio && <p className="mt-4 whitespace-pre-line text-sm">{p.bio}</p>}
          <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
            <Numero label="Plantas" valor={p.contagem.plantas} />
            <Numero label="Seguidores" valor={p.contagem.seguidores} />
            <Numero label="Seguindo" valor={p.contagem.seguindo} />
          </dl>
          {!p.eu && (
            <div className="mt-5">
              <BotaoSeguir perfil={p} />
            </div>
          )}
        </section>

        <div className="mt-5">
          <OpcoesChips<Aba>
            titulo=""
            opcoes={[
              { value: 'plantas', label: 'Plantas' },
              { value: 'posts', label: 'Posts' },
            ]}
            value={aba}
            onChange={setAba}
          />
        </div>
        <div className="mt-4">
          {aba === 'posts' ? (
            <GradePosts usuarioId={p.id} />
          ) : p.plantas.length ? (
            <div className="grid grid-cols-3 gap-3">
              {p.plantas.map((pl) => (
                <Link key={pl.id} to={`/comunidade/planta/${pl.id}`} className="block">
                  <PlantThumb url={pl.fotoCapaUrl} id={pl.id} className="aspect-square w-full rounded-xl" />
                  <span className="mt-1 block truncate text-xs font-medium">{plantaTitulo(pl)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="Nenhuma planta na comunidade" />
          )}
        </div>
      </div>
    </div>
  );
}

function BotaoSeguir({ perfil }: { perfil: PerfilPublico }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [salvando, setSalvando] = useState(false);

  async function alternar() {
    setSalvando(true);
    try {
      if (perfil.sigo) await comunidadeApi.deixarDeSeguir(perfil.id);
      else await comunidadeApi.seguir(perfil.id);
      queryClient.invalidateQueries({ queryKey: ['comunidade', 'feed'] });
      queryClient.invalidateQueries({ queryKey: keys.me });
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      // Volta ao estado real do servidor (também quando o perfil ficou privado no meio do caminho)
      await queryClient.invalidateQueries({ queryKey: keys.perfilPublico(perfil.id) });
      setSalvando(false);
    }
  }

  return (
    <Button block variant={perfil.sigo ? 'secondary' : undefined} loading={salvando} onClick={alternar}>
      {perfil.sigo ? 'Seguindo' : 'Seguir'}
    </Button>
  );
}
