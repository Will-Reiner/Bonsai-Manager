import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Opcao } from '@/components/ui';
import { OpcoesChips } from '@/components/Preferencias';
import { SelecionarPlantasSheet } from './SelecionarPlantasSheet';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { modoPlantas, type ModoPlantas } from '@/lib/comunidade';
import { authApi, plantasApi } from '@/lib/endpoints';
import { keys, usePlantas } from '@/lib/queries';
import type { Usuario } from '@/types';

type Config = Pick<Usuario, 'perfilPublico' | 'historicoPublico' | 'postarAutomatico'>;

/** Preferências → Comunidade: perfil público, quais plantas, cuidados e postagem automática. Salva a cada toque. */
export function ComunidadePreferencias() {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const plantas = usePlantas();
  const [salvando, setSalvando] = useState(false);
  const [escolhendo, setEscolhendo] = useState(false);

  const lista = plantas.data ?? [];
  // Sem a lista não há modo: "Todas" sobre uma lista vazia tornaria todas as plantas privadas
  const modo = modoPlantas(plantas.data);
  const publicas = lista.filter((p) => p.plantaPublica).length;

  async function mudar(campo: Partial<Config>) {
    setSalvando(true);
    try {
      setUser(await authApi.updateMe(campo));
      queryClient.invalidateQueries({ queryKey: keys.me });
      toast('Preferência salva');
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setSalvando(false);
    }
  }

  async function definirPublicas(ids: string[]) {
    try {
      await plantasApi.definirPublicas(ids);
      await queryClient.invalidateQueries({ queryKey: keys.plantas });
      toast('Plantas da comunidade salvas');
    } catch (error) {
      toast(errorMessage(error), 'error');
      throw error;
    }
  }

  function escolherModo(m: ModoPlantas) {
    if (m === 'todas') void definirPublicas(lista.map((p) => p.id)).catch(() => undefined);
    else setEscolhendo(true);
  }

  if (!user) return null;

  return (
    <section className="card mt-4 space-y-4 p-4">
      <Opcao
        titulo="Perfil público"
        descricao="Outras pessoas encontram você, seguem e veem as plantas que você mostrar."
        checked={!!user.perfilPublico}
        disabled={salvando}
        onChange={(v) => mudar({ perfilPublico: v })}
      />

      {user.perfilPublico && (
        <>
          <div>
            {modo ? (
              <OpcoesChips<ModoPlantas>
                titulo="Quais plantas aparecem"
                opcoes={[
                  { value: 'todas', label: 'Todas' },
                  { value: 'selecionadas', label: 'Selecionadas' },
                ]}
                value={modo}
                onChange={escolherModo}
              />
            ) : (
              <p className="text-sm text-muted">
                {plantas.isError ? 'Não foi possível carregar suas plantas.' : 'Carregando suas plantas…'}
              </p>
            )}
            {modo === 'selecionadas' && (
              <button type="button" className="mt-2 text-sm font-medium text-primary" onClick={() => setEscolhendo(true)}>
                {publicas ? `${publicas} de ${lista.length} na comunidade · Escolher` : 'Nenhuma planta aparece ainda · Escolher'}
              </button>
            )}
          </div>
          <Opcao
            titulo="Mostrar meus cuidados"
            descricao="Os cuidados do dia aparecem junto das fotos e na página da planta."
            checked={!!user.historicoPublico}
            disabled={salvando}
            onChange={(v) => mudar({ historicoPublico: v })}
          />
          <Opcao
            titulo="Postar automaticamente"
            descricao="Cada dia com foto numa planta da comunidade vira um post no feed de quem segue você."
            checked={user.postarAutomatico ?? true}
            disabled={salvando}
            onChange={(v) => mudar({ postarAutomatico: v })}
          />
        </>
      )}

      <SelecionarPlantasSheet open={escolhendo} onClose={() => setEscolhendo(false)} plantas={lista} onSalvar={definirPublicas} />
    </section>
  );
}
