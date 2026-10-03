import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Check, Plus, Search } from 'lucide-react';
import { Button, Field } from './ui';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { especiesApi } from '@/lib/endpoints';
import { especieNome } from '@/lib/format';
import { keys, useEspecies } from '@/lib/queries';

/** Busca de espécie com opção de sugerir uma nova sem sair do fluxo. */
export function SpeciesPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const especies = useEspecies();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [busca, setBusca] = useState('');
  const [sugerindo, setSugerindo] = useState(false);
  const [nomeComum, setNomeComum] = useState('');
  const [nomeCientifico, setNomeCientifico] = useState('');
  const [salvando, setSalvando] = useState(false);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (especies.data ?? []).filter(
      (e) => !termo || [e.nomeComum, e.nomeCientifico].some((n) => n?.toLowerCase().includes(termo)),
    );
  }, [especies.data, busca]);

  async function sugerir() {
    if (!nomeComum.trim() && nomeCientifico.trim().length < 3) {
      return toast('Informe ao menos o nome popular.', 'error');
    }
    setSalvando(true);
    try {
      const nova = await especiesApi.create({
        nomeComum: nomeComum.trim() || undefined,
        nomeCientifico: nomeCientifico.trim() || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: keys.especies });
      onChange(nova.id);
      setSugerindo(false);
      toast('Espécie sugerida — um admin vai revisar.');
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setSalvando(false);
    }
  }

  if (sugerindo) {
    return (
      <div className="card space-y-4 p-4">
        <p className="text-sm text-muted">Não achou? Sugira a espécie — ela já fica disponível para você.</p>
        <Field label="Nome popular">
          <input className="input" value={nomeComum} onChange={(e) => setNomeComum(e.target.value)} placeholder="Ex.: Jabuticabeira" autoFocus />
        </Field>
        <Field label="Nome científico (opcional)">
          <input className="input italic" value={nomeCientifico} onChange={(e) => setNomeCientifico(e.target.value)} placeholder="Ex.: Plinia cauliflora" />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" type="button" onClick={() => setSugerindo(false)}>
            Voltar
          </Button>
          <Button type="button" onClick={sugerir} loading={salvando}>
            Sugerir
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          className="input pl-10"
          type="search"
          placeholder="Buscar espécie"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>
      <div className="mt-3 max-h-[45dvh] space-y-1.5 overflow-y-auto">
        {especies.isLoading && <p className="py-4 text-center text-sm text-muted">Carregando…</p>}
        {lista.map((e) => {
          const selecionada = e.id === value;
          return (
            <button
              type="button"
              key={e.id}
              onClick={() => onChange(e.id)}
              className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
                selecionada ? 'border-primary bg-primary-light' : 'border-line bg-white'
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate font-medium">
                  {especieNome(e)}
                  {e.status === 'VERIFICADO' && <BadgeCheck size={15} className="shrink-0 text-primary" aria-label="Verificada" />}
                </p>
                {e.nomeCientifico && e.nomeComum && <p className="truncate text-sm italic text-muted">{e.nomeCientifico}</p>}
              </div>
              {selecionada && <Check size={20} className="shrink-0 text-primary" />}
            </button>
          );
        })}
        {!especies.isLoading && lista.length === 0 && (
          <p className="py-3 text-center text-sm text-muted">Nenhuma espécie encontrada.</p>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        block
        className="mt-2"
        onClick={() => {
          setNomeComum(busca);
          setSugerindo(true);
        }}
      >
        <Plus size={18} /> Sugerir nova espécie
      </Button>
    </div>
  );
}
