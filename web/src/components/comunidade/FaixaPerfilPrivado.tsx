import { Link } from 'react-router';

/** Aviso no topo da Comunidade para quem está com o perfil privado. */
export function FaixaPerfilPrivado() {
  return (
    <p className="card px-4 py-3 text-sm text-muted">
      Seu perfil é privado: você vê a comunidade, mas ninguém vê suas plantas.{' '}
      <Link to="/perfil/preferencias" className="font-medium text-primary">
        Ativar
      </Link>
    </p>
  );
}
