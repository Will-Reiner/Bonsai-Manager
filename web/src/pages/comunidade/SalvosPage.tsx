import { PageHeader } from '@/components/ui';
import { GradeDePosts } from '@/components/comunidade/GradePosts';
import { useSalvos } from '@/lib/queries';

export function SalvosPage() {
  const salvos = useSalvos();
  return (
    <div className="pb-10">
      <PageHeader title="Salvos" back />
      <div className="mx-auto max-w-2xl px-4 pt-4">
        <GradeDePosts consulta={salvos} vazio={{ title: 'Nada salvo ainda', text: 'Toque no marcador de um post para guardar aqui.' }} />
      </div>
    </div>
  );
}
