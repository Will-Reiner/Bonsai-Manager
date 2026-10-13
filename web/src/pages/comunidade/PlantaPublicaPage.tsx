import { Link, useParams } from 'react-router';
import { Avatar, EmptyState, ErrorState, PageHeader, PlantThumb, Spinner } from '@/components/ui';
import { CuidadosDoPost } from '@/components/comunidade/CuidadosDoPost';
import { FotosDoPost } from '@/components/comunidade/FotosDoPost';
import { ehNaoEncontrado } from '@/lib/api';
import { dataLonga, especieNome, plantaTitulo } from '@/lib/format';
import { usePlantaPublica } from '@/lib/queries';

/** Página pública da planta: capa, dono e a linha do tempo dos dias (fotos e, se públicos, cuidados). */
export function PlantaPublicaPage() {
  const { id = '' } = useParams();
  const dados = usePlantaPublica(id);

  if (dados.isLoading || dados.isError || !dados.data) {
    return (
      <div className="pb-10">
        <PageHeader title="Planta" back />
        {dados.isLoading ? (
          <Spinner />
        ) : ehNaoEncontrado(dados.error) ? (
          <EmptyState title="Planta não encontrada" text="Ela pode ter ficado privada ou não existir mais." />
        ) : (
          <ErrorState text="Não foi possível carregar a planta." erro={dados.error} onRetry={() => dados.refetch()} />
        )}
      </div>
    );
  }

  const { planta, dono, dias } = dados.data;
  return (
    <div className="pb-10">
      <PageHeader title={plantaTitulo(planta)} back />
      <div className="mx-auto max-w-2xl space-y-4 px-4 pt-4">
        <section className="card overflow-hidden">
          <PlantThumb url={planta.fotoCapaUrl} id={planta.id} className="aspect-[4/3] w-full" />
          <div className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold">
                #{planta.identificador} · {plantaTitulo(planta)}
              </p>
              <p className="truncate text-sm text-muted">{especieNome(planta.especie)}</p>
            </div>
            <Link to={`/comunidade/u/${dono.id}`} className="flex shrink-0 items-center gap-2 text-sm font-medium">
              <Avatar url={dono.fotoPerfilUrl} nome={dono.nome} size={28} /> {dono.nome}
            </Link>
          </div>
        </section>

        {dias.length ? (
          dias.map((d) => (
            <section key={d.dia} className="card overflow-hidden">
              <h2 className="px-3 pt-3 text-sm font-semibold">{dataLonga(`${d.dia}T12:00:00`)}</h2>
              {d.fotos.length > 0 && (
                <div className="mt-2">
                  <FotosDoPost fotos={d.fotos} />
                </div>
              )}
              <div className="space-y-2 p-3">
                <CuidadosDoPost cuidados={d.cuidados} />
                {d.postId && (
                  <Link to={`/comunidade/post/${d.postId}`} className="block text-xs font-medium text-primary">
                    Abrir post
                  </Link>
                )}
              </div>
            </section>
          ))
        ) : (
          <EmptyState title="Ainda sem registros públicos" />
        )}
      </div>
    </div>
  );
}
