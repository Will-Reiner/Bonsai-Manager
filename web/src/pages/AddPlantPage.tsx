import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { Button, Field, PageHeader } from '@/components/ui';
import { PhotoInput } from '@/components/PhotoInput';
import { SpeciesPicker } from '@/components/SpeciesPicker';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { plantasApi } from '@/lib/endpoints';
import { especieNome, fromDateInput, plantaTitulo, toDateInput } from '@/lib/format';
import { keys, useEspecies } from '@/lib/queries';
import { uploadImage } from '@/lib/upload';
import { MODOS_AQUISICAO, type ModoAquisicao, type Planta } from '@/types';

const PASSOS = ['Espécie', 'Identidade', 'Aquisição', 'Foto'];

/** Cadastro em passos curtos — só a espécie é obrigatória (UX_FRONTEND.md §4.4). */
export function AddPlantPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const especies = useEspecies();

  const [passo, setPasso] = useState(0);
  const [especieId, setEspecieId] = useState('');
  const [nome, setNome] = useState('');
  const [identificador, setIdentificador] = useState('');
  const [dataAquisicao, setDataAquisicao] = useState('');
  const [modo, setModo] = useState<ModoAquisicao | ''>('');
  const [foto, setFoto] = useState<File | null>(null);
  const [progresso, setProgresso] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [criada, setCriada] = useState<Planta | null>(null);

  const especie = especies.data?.find((e) => e.id === especieId);
  const ultimo = passo === PASSOS.length - 1;

  function resetar() {
    setPasso(0);
    setEspecieId('');
    setNome('');
    setIdentificador('');
    setDataAquisicao('');
    setModo('');
    setFoto(null);
    setCriada(null);
  }

  async function salvar() {
    setSalvando(true);
    try {
      const fotoCapaUrl = foto ? await uploadImage(foto, setProgresso) : undefined;
      const planta = await plantasApi.create({
        especieId,
        nome: nome.trim() || undefined,
        identificador: identificador.trim() || undefined,
        dataAquisicao: dataAquisicao ? fromDateInput(dataAquisicao) : null,
        modoAquisicao: modo || null,
        fotoCapaUrl,
      });
      queryClient.invalidateQueries({ queryKey: keys.plantas });
      setCriada(planta);
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setSalvando(false);
      setProgresso(null);
    }
  }

  if (criada) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <CheckCircle2 size={56} className="text-primary" />
        <h1 className="mt-4 text-2xl font-semibold">{plantaTitulo({ ...criada, especie: criada.especie ?? especie })} na coleção!</h1>
        <p className="mt-1 text-muted">Que tal agendar o primeiro cuidado?</p>
        <div className="mt-8 grid w-full max-w-xs gap-3">
          <Button onClick={() => navigate(`/plantas/${criada.id}`, { replace: true })}>Ver planta</Button>
          <Button variant="secondary" onClick={resetar}>
            Adicionar mais uma
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="Nova planta" back />
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-32">
        <ol className="mb-6 mt-4 flex gap-1.5" aria-label="Progresso">
          {PASSOS.map((p, i) => (
            <li key={p} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= passo ? 'bg-primary' : 'bg-line'}`} />
              <span className={`mt-1.5 block text-[11px] font-medium ${i === passo ? 'text-primary' : 'text-muted'}`}>{p}</span>
            </li>
          ))}
        </ol>

        {passo === 0 && (
          <section>
            <h2 className="mb-1 text-2xl font-semibold">Qual é a espécie?</h2>
            <p className="mb-4 text-sm text-muted">Os dados de cultivo vêm da espécie.</p>
            <SpeciesPicker value={especieId} onChange={setEspecieId} />
          </section>
        )}

        {passo === 1 && (
          <section className="space-y-4">
            <div>
              <h2 className="mb-1 text-2xl font-semibold">Como você chama ela?</h2>
              <p className="text-sm text-muted">Opcional — use um apelido, um código de etiqueta, ou os dois.</p>
            </div>
            <Field label="Apelido">
              <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder={`Ex.: ${especieNome(especie)} da varanda`} />
            </Field>
            <Field label="Código / etiqueta" hint="Único na sua coleção">
              <input className="input" value={identificador} onChange={(e) => setIdentificador(e.target.value)} placeholder="Ex.: JB-03" />
            </Field>
          </section>
        )}

        {passo === 2 && (
          <section className="space-y-4">
            <div>
              <h2 className="mb-1 text-2xl font-semibold">Como ela chegou?</h2>
              <p className="text-sm text-muted">Opcional — ajuda a calcular a idade na coleção.</p>
            </div>
            <Field label="Data de aquisição">
              <input type="date" className="input" value={dataAquisicao} max={toDateInput()} onChange={(e) => setDataAquisicao(e.target.value)} />
            </Field>
            <div>
              <span className="label">Modo de aquisição</span>
              <div className="flex flex-wrap gap-2">
                {MODOS_AQUISICAO.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    className={`chip ${modo === m.value ? 'chip-active' : ''}`}
                    onClick={() => setModo(modo === m.value ? '' : m.value)}
                    aria-pressed={modo === m.value}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {passo === 3 && (
          <section>
            <h2 className="mb-1 text-2xl font-semibold">Uma foto de capa</h2>
            <p className="mb-4 text-sm text-muted">Fica mais fácil reconhecer na coleção. Dá para pular.</p>
            <PhotoInput file={foto} onChange={setFoto} label="Tirar ou escolher foto" aspect="aspect-square" />
          </section>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-bg/95 pb-safe backdrop-blur">
        <div className="mx-auto flex max-w-2xl gap-3 px-4 py-3">
          {passo > 0 && (
            <Button variant="secondary" onClick={() => setPasso(passo - 1)} disabled={salvando}>
              Voltar
            </Button>
          )}
          {ultimo ? (
            <Button block onClick={salvar} loading={salvando}>
              {progresso !== null ? `Enviando foto… ${progresso}%` : foto ? 'Salvar planta' : 'Salvar sem foto'}
            </Button>
          ) : (
            <Button block onClick={() => setPasso(passo + 1)} disabled={passo === 0 && !especieId}>
              {passo === 0 ? 'Continuar' : 'Próximo'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
