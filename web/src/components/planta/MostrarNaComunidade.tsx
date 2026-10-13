import { Link } from 'react-router';
import { Opcao } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

/** Campo "Mostrar na comunidade" dos formulários de planta; com perfil privado, só a dica para ativar. */
export function MostrarNaComunidade({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const { user } = useAuth();
  if (!user?.perfilPublico) {
    return (
      <p className="text-sm text-muted">
        Seu perfil é privado ·{' '}
        <Link to="/perfil/preferencias" className="font-medium text-primary">
          Ativar
        </Link>
      </p>
    );
  }
  return (
    <Opcao
      titulo="Mostrar na comunidade"
      descricao="Fotos (e cuidados, se você mostra) desta planta aparecem no seu perfil público."
      checked={checked}
      onChange={onChange}
    />
  );
}
