import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { alternarCurtida } from '@/lib/comunidade';
import { comunidadeApi } from '@/lib/endpoints';
import { keys } from '@/lib/queries';
import { criarSincronizador } from '@/lib/sincronizar';
import type { PostComunidade } from '@/types';

/**
 * Curtida e salvo do post com resposta imediata (otimista). Toques rápidos viram um pedido por vez ao servidor,
 * sempre terminando na última escolha (`criarSincronizador`). O estado nasce do post; quem renderiza o cartão usa
 * `key={chaveDoPost(post)}` para recomeçar quando o servidor mandar valores novos.
 */
export function useInteracoesDoPost(post: PostComunidade) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [estado, setEstado] = useState({ curtiu: post.curtiu, curtidas: post.curtidas, salvou: post.salvou });
  const [sinc] = useState(() => ({
    curtida: criarSincronizador(post.curtiu, (alvo: boolean) => comunidadeApi.curtir(post.id, alvo), (r) => r.curtiu),
    salvo: criarSincronizador(post.salvou, (alvo: boolean) => comunidadeApi.salvar(post.id, alvo), (r) => r.salvou),
  }));

  // As outras telas (feed, perfil, salvos) buscam de novo quando forem abertas
  const marcarDesatualizadas = () => queryClient.invalidateQueries({ queryKey: keys.comunidade, refetchType: 'none' });

  function curtir(sim: boolean) {
    if (estado.curtiu === sim) return;
    setEstado((e) => ({ ...e, ...alternarCurtida(e, sim) }));
    sinc.curtida
      .querer(sim)
      .then((r) => {
        if (!r) return;
        setEstado((e) => ({ ...e, curtiu: r.curtiu, curtidas: r.curtidas }));
        marcarDesatualizadas();
      })
      .catch((error) => {
        // Volta ao que o servidor confirmou
        setEstado((e) => ({ ...e, ...alternarCurtida(e, sinc.curtida.servidor) }));
        toast(errorMessage(error), 'error');
      });
  }

  function salvar(sim: boolean) {
    if (estado.salvou === sim) return;
    setEstado((e) => ({ ...e, salvou: sim }));
    sinc.salvo
      .querer(sim)
      .then((r) => {
        if (!r) return;
        setEstado((e) => ({ ...e, salvou: r.salvou }));
        marcarDesatualizadas();
        toast(r.salvou ? 'Post salvo' : 'Tirado dos salvos');
      })
      .catch((error) => {
        setEstado((e) => ({ ...e, salvou: sinc.salvo.servidor }));
        toast(errorMessage(error), 'error');
      });
  }

  return { ...estado, curtir, salvar };
}
