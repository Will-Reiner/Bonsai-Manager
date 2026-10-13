import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { alternarCurtida } from '@/lib/comunidade';
import { comunidadeApi } from '@/lib/endpoints';
import { keys } from '@/lib/queries';
import type { PostComunidade } from '@/types';

/**
 * Curtida e salvo do post com resposta imediata (otimista). O estado nasce do post; quem renderiza o cartão usa
 * `key={chaveDoPost(post)}` para recomeçar quando o servidor mandar valores novos.
 */
export function useInteracoesDoPost(post: PostComunidade) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [estado, setEstado] = useState({ curtiu: post.curtiu, curtidas: post.curtidas, salvou: post.salvou });

  // As outras telas (feed, perfil, salvos) buscam de novo quando forem abertas
  const marcarDesatualizadas = () => queryClient.invalidateQueries({ queryKey: keys.comunidade, refetchType: 'none' });

  async function curtir(sim: boolean) {
    if (estado.curtiu === sim) return;
    const antes = estado;
    setEstado((e) => ({ ...e, ...alternarCurtida(e, sim) }));
    try {
      const r = await comunidadeApi.curtir(post.id, sim);
      setEstado((e) => ({ ...e, curtiu: r.curtiu, curtidas: r.curtidas }));
      marcarDesatualizadas();
    } catch (error) {
      setEstado(antes);
      toast(errorMessage(error), 'error');
    }
  }

  async function salvar(sim: boolean) {
    if (estado.salvou === sim) return;
    setEstado((e) => ({ ...e, salvou: sim }));
    try {
      await comunidadeApi.salvar(post.id, sim);
      marcarDesatualizadas();
      toast(sim ? 'Post salvo' : 'Tirado dos salvos');
    } catch (error) {
      setEstado((e) => ({ ...e, salvou: !sim }));
      toast(errorMessage(error), 'error');
    }
  }

  return { ...estado, curtir, salvar };
}
