import { Axe, Bug, Cable, CircleDot, Droplets, Eye, FlaskConical, Leaf, Scissors, Shovel, Unlink, type LucideIcon } from 'lucide-react';

/** Por trecho do nome (sem acento, minúsculo); a ordem importa ("desaram" antes de "aram", "poda estrutural" antes de "poda"). */
const ICONES: [string, LucideIcon][] = [
  ['rega', Droplets],
  ['adub', FlaskConical],
  ['poda estrutural', Axe],
  ['poda', Scissors],
  ['desfolha', Leaf],
  ['desaram', Unlink],
  ['aram', Cable],
  ['transplante', Shovel],
  ['fitossanit', Bug],
  ['revis', Eye],
];

const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Ícone da atividade num quadradinho; atividade desconhecida usa um genérico. */
export function AtividadeIcone({ nome, size = 18, className = '' }: { nome: string; size?: number; className?: string }) {
  const n = normalizar(nome);
  const Icone = ICONES.find(([trecho]) => n.includes(trecho))?.[1] ?? CircleDot;
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary ${className}`} aria-hidden>
      <Icone size={size} />
    </span>
  );
}
