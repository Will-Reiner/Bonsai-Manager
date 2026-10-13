import { Link } from 'react-router';
import { Avatar, PlantThumb } from '@/components/ui';
import { linkDaNotificacao, textoDaNotificacao } from '@/lib/comunidade';
import { tempoRelativo } from '@/lib/format';
import type { NotificacaoComunidade } from '@/types';

/** Uma notificação: quem, o quê e a miniatura da planta do post (as novas ficam destacadas). */
export function ItemNotificacao({ n }: { n: NotificacaoComunidade }) {
  return (
    <Link to={linkDaNotificacao(n)} className={`flex items-center gap-3 px-4 py-3 ${n.lida ? '' : 'bg-primary-light/50'}`}>
      <Avatar url={n.ator.fotoPerfilUrl} nome={n.ator.nome} size={40} />
      <p className="min-w-0 flex-1 text-sm">
        <span className="font-semibold">{n.ator.nome}</span> {textoDaNotificacao(n)}
        <span className="block text-xs text-muted">{tempoRelativo(n.createdAt)}</span>
      </p>
      {n.post && <PlantThumb url={n.post.capa} id={n.post.plantaId} className="size-11 shrink-0 rounded-lg" />}
    </Link>
  );
}
