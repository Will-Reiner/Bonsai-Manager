import { Icone } from '@/components/Icone';
import { iconeDaAtividade } from '@/lib/icones';

/** Ícone da atividade em tinta (traço sumi); atividade desconhecida usa o genérico. */
export function AtividadeIcone({ nome, size = 18, className = '' }: { nome: string; size?: number; className?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center text-ink ${className}`} aria-hidden>
      <Icone nome={iconeDaAtividade(nome)} size={size} />
    </span>
  );
}
