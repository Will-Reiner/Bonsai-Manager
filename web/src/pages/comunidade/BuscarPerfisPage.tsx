import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Avatar, EmptyState, ErrorState, PageHeader, Spinner } from '@/components/ui';
import { useBuscaPerfis } from '@/lib/queries';

const ESPERA_MS = 300;

/** Busca de pessoas com perfil público, por nome. */
export function BuscarPerfisPage() {
  const [texto, setTexto] = useState('');
  const [termo, setTermo] = useState('');
  // Espera a pessoa parar de digitar antes de buscar
  useEffect(() => {
    const t = setTimeout(() => setTermo(texto.trim()), ESPERA_MS);
    return () => clearTimeout(t);
  }, [texto]);
  const busca = useBuscaPerfis(termo);

  return (
    <div className="pb-10">
      <PageHeader title="Buscar pessoas" back />
      <div className="mx-auto max-w-2xl px-4 pt-4">
        <input
          className="input"
          type="search"
          placeholder="Nome de quem você procura"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          autoFocus
        />
        <div className="mt-4">
          {termo.length < 2 ? (
            <p className="text-sm text-muted">Digite pelo menos 2 letras.</p>
          ) : busca.isLoading ? (
            <Spinner />
          ) : busca.isError ? (
            <ErrorState text="Não foi possível buscar." erro={busca.error} onRetry={() => busca.refetch()} />
          ) : busca.data?.length ? (
            <ul className="card divide-y divide-line overflow-hidden">
              {busca.data.map((u) => (
                <li key={u.id}>
                  <Link to={`/comunidade/u/${u.id}`} className="flex items-center gap-3 px-4 py-3">
                    <Avatar url={u.fotoPerfilUrl} nome={u.nome} size={40} />
                    <span className="min-w-0 flex-1 truncate font-medium">{u.nome}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Ninguém encontrado" text="Só aparecem pessoas com perfil público." />
          )}
        </div>
      </div>
    </div>
  );
}
