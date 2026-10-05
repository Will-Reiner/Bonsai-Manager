import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, CalendarPlus, Camera, ImagePlus, Pencil, Star, Trash2, X } from 'lucide-react';
import { Button, EmptyState, ErrorState, PageHeader, PlantThumb, SectionTitle, Spinner } from '@/components/ui';
import { ConfirmSheet } from '@/components/Sheet';
import { TaskCard } from '@/components/TaskCard';
import { useCare } from '@/context/CareContext';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { fotosApi, plantasApi } from '@/lib/endpoints';
import { dataCurta, dataLonga, dataRelativa, diasAte, especieNome, modoAquisicaoLabel, plantaTitulo, tempoDesde } from '@/lib/format';
import { keys, useAgendas, useFotos, usePlanta } from '@/lib/queries';
import { dataCapturaDe, uploadImage } from '@/lib/upload';
import type { Agenda, Foto, Planta } from '@/types';

const ABAS = ['Visão geral', 'Histórico', 'Galeria', 'Cuidados'] as const;
type Aba = (typeof ABAS)[number];

export function PlantDetailPage() {
  const { id = '' } = useParams();
  const planta = usePlanta(id);
  const agendas = useAgendas();
  const [aba, setAba] = useState<Aba>('Visão geral');

  const daPlanta = useMemo(() => (agendas.data ?? []).filter((a) => a.plantaId === id), [agendas.data, id]);

  if (planta.isLoading) return <><PageHeader title="Planta" back /><Spinner /></>;
  if (planta.isError || !planta.data)
    return <><PageHeader title="Planta" back /><ErrorState text={errorMessage(planta.error, 'Planta não encontrada.')} /></>;

  const p = planta.data;

  return (
    <div>
      <PageHeader
        title={plantaTitulo(p)}
        back
        right={
          <Link to={`/plantas/${p.id}/editar`} className="flex size-10 items-center justify-center rounded-full text-primary hover:bg-primary-light" aria-label="Editar planta">
            <Pencil size={20} />
          </Link>
        }
      />
      <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-20 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl overflow-x-auto px-2" role="tablist">
          {ABAS.map((a) => (
            <button
              key={a}
              role="tab"
              aria-selected={aba === a}
              onClick={() => setAba(a)}
              className={`shrink-0 border-b-2 px-3.5 py-3 text-sm font-semibold transition ${
                aba === a ? 'border-primary text-primary' : 'border-transparent text-muted'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pb-6">
        {aba === 'Visão geral' && <VisaoGeral planta={p} agendas={daPlanta} irPara={setAba} />}
        {aba === 'Histórico' && <Historico plantaId={p.id} agendas={daPlanta} />}
        {aba === 'Galeria' && <Galeria planta={p} />}
        {aba === 'Cuidados' && <Cuidados plantaId={p.id} agendas={daPlanta} />}
      </div>
    </div>
  );
}

function VisaoGeral({ planta, agendas, irPara }: { planta: Planta; agendas: Agenda[]; irPara: (a: Aba) => void }) {
  const { registrarCuidado, agendarCuidado } = useCare();
  const proxima = agendas.filter((a) => a.status === 'PENDENTE').sort((a, b) => a.dataAgendada.localeCompare(b.dataAgendada))[0];
  const ultimo = agendas
    .filter((a) => a.status === 'CONCLUIDO')
    .sort((a, b) => (b.dataConcluida ?? b.dataAgendada).localeCompare(a.dataConcluida ?? a.dataAgendada))[0];
  const idade = tempoDesde(planta.dataAquisicao);

  return (
    <div className="pt-4">
      <button onClick={() => irPara('Galeria')} className="block w-full overflow-hidden rounded-2xl" aria-label="Abrir galeria">
        <PlantThumb url={planta.fotoCapaUrl} className="aspect-[4/3] w-full" />
      </button>

      <div className="mt-4">
        <p className="text-lg font-semibold">{especieNome(planta.especie)}</p>
        {planta.especie?.nomeCientifico && planta.especie?.nomeComum && (
          <p className="text-sm italic text-muted">{planta.especie.nomeCientifico}</p>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2.5">
        <Stat label="Na coleção há" value={idade ?? '—'} />
        <Stat label="Aquisição" value={modoAquisicaoLabel(planta.modoAquisicao)} />
        <Stat
          label="Próxima tarefa"
          value={proxima ? `${proxima.atividade?.nome} · ${dataRelativa(proxima.dataAgendada)}` : 'Nenhuma'}
          tone={proxima && diasAte(proxima.dataAgendada) < 0 ? 'danger' : undefined}
        />
        <Stat
          label="Último cuidado"
          value={ultimo ? `${ultimo.atividade?.nome} · ${dataRelativa(ultimo.dataConcluida ?? ultimo.dataAgendada)}` : 'Nenhum'}
        />
        {planta.identificador && <Stat label="Código" value={planta.identificador} />}
      </dl>

      <Button block className="mt-5" onClick={() => registrarCuidado(planta.id)}>
        <CalendarCheck size={18} /> Registrar cuidado
      </Button>
      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
        <Button variant="secondary" onClick={() => agendarCuidado(planta.id)}>
          <CalendarPlus size={18} /> Agendar
        </Button>
        <Button variant="secondary" onClick={() => irPara('Galeria')}>
          <Camera size={18} /> Fotos
        </Button>
      </div>

      {planta.observacoes && (
        <>
          <SectionTitle>Observações</SectionTitle>
          <p className="whitespace-pre-line text-sm leading-relaxed">{planta.observacoes}</p>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'danger' }) {
  return (
    <div className="card p-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={`mt-0.5 text-sm font-semibold ${tone === 'danger' ? 'text-danger' : ''}`}>{value}</dd>
    </div>
  );
}

type ItemHistorico = { tipo: 'cuidado'; data: string; agenda: Agenda } | { tipo: 'foto'; data: string; foto: Foto };

function Historico({ plantaId, agendas }: { plantaId: string; agendas: Agenda[] }) {
  const fotos = useFotos(plantaId);

  const itens = useMemo<ItemHistorico[]>(() => {
    const cuidados: ItemHistorico[] = agendas
      .filter((a) => a.status === 'CONCLUIDO')
      .map((a) => ({ tipo: 'cuidado', data: a.dataConcluida ?? a.dataAgendada, agenda: a }));
    const fts: ItemHistorico[] = (fotos.data ?? []).map((f) => ({ tipo: 'foto', data: f.dataCaptura ?? f.createdAt, foto: f }));
    return [...cuidados, ...fts].sort((a, b) => b.data.localeCompare(a.data));
  }, [agendas, fotos.data]);

  if (fotos.isLoading) return <Spinner />;
  if (itens.length === 0)
    return <EmptyState title="Sem histórico ainda" text="Cuidados concluídos e fotos aparecem aqui, do mais recente ao mais antigo." />;

  return (
    <ol className="relative mt-5 space-y-4 border-l-2 border-line pl-5">
      {itens.map((item) => (
        <li key={item.tipo === 'cuidado' ? `c-${item.agenda.id}` : `f-${item.foto.id}`} className="relative">
          <span className="absolute -left-[27px] top-1.5 size-3 rounded-full border-2 border-bg bg-primary" />
          <p className="text-xs text-muted">{dataLonga(item.data)}</p>
          {item.tipo === 'cuidado' ? (
            <div className="mt-1">
              <p className="font-semibold">{item.agenda.atividade?.nome}</p>
              {item.agenda.detalhes && <p className="mt-0.5 text-sm">{item.agenda.detalhes}</p>}
              {item.agenda.observacaoFutura && (
                <p className="mt-1 text-sm text-accent">Próxima vez: {item.agenda.observacaoFutura}</p>
              )}
            </div>
          ) : (
            <div className="mt-1.5">
              <img src={item.foto.caminhoArquivo} alt={item.foto.titulo ?? ''} loading="lazy" className="w-40 rounded-xl object-cover" />
              {item.foto.titulo && <p className="mt-1 text-sm text-muted">{item.foto.titulo}</p>}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

function Galeria({ planta }: { planta: Planta }) {
  const fotos = useFotos(planta.id);
  const queryClient = useQueryClient();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [envios, setEnvios] = useState<{ nome: string; pct: number }[]>([]);
  const [aberta, setAberta] = useState<Foto | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  async function enviar(files: FileList) {
    const lista = [...files].filter((f) => f.type.startsWith('image/'));
    setEnvios(lista.map((f) => ({ nome: f.name, pct: 0 })));
    let ok = 0;
    let semData = 0;
    for (const [i, file] of lista.entries()) {
      try {
        const [url, { data: dataCaptura, origem }] = await Promise.all([
          uploadImage(file, (pct) => setEnvios((e) => e.map((x, j) => (j === i ? { ...x, pct } : x)))),
          dataCapturaDe(file),
        ]);
        await fotosApi.create({ caminhoArquivo: url, plantaId: planta.id, dataCaptura });
        ok++;
        if (origem === 'arquivo') semData++;
      } catch (error) {
        toast(`${file.name}: ${errorMessage(error)}`, 'error');
      }
    }
    setEnvios([]);
    queryClient.invalidateQueries({ queryKey: keys.fotos(planta.id) });
    if (ok) toast(ok === 1 ? 'Foto adicionada' : `${ok} fotos adicionadas`);
    if (semData)
      toast(
        semData === 1
          ? 'A foto veio sem data de captura — usamos a data do arquivo.'
          : `${semData} fotos vieram sem data de captura — usamos a data do arquivo.`,
        'error',
      );
  }

  async function definirCapa(foto: Foto) {
    setOcupado(true);
    try {
      await plantasApi.update(planta.id, { fotoCapaUrl: foto.caminhoArquivo });
      queryClient.invalidateQueries({ queryKey: keys.plantas });
      toast('Capa atualizada');
      setAberta(null);
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setOcupado(false);
    }
  }

  async function excluir(foto: Foto) {
    setOcupado(true);
    try {
      await fotosApi.remove(foto.id);
      queryClient.invalidateQueries({ queryKey: keys.fotos(planta.id) });
      toast('Foto excluída');
      setConfirmar(false);
      setAberta(null);
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setOcupado(false);
    }
  }

  const imagens = (fotos.data ?? []).filter((f) => f.tipo !== 'VIDEO');

  return (
    <div className="pt-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) enviar(e.target.files);
          e.target.value = '';
        }}
      />
      <Button block onClick={() => inputRef.current?.click()} disabled={envios.length > 0}>
        <ImagePlus size={18} /> Adicionar fotos
      </Button>

      {envios.length > 0 && (
        <div className="mt-3 space-y-2">
          {envios.map((e, i) => (
            <div key={i} className="card p-3">
              <div className="flex justify-between text-xs">
                <span className="truncate">{e.nome}</span>
                <span className="text-muted">{e.pct}%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                <div className="h-full bg-primary transition-all" style={{ width: `${e.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {fotos.isLoading ? (
        <Spinner />
      ) : imagens.length === 0 ? (
        <EmptyState icon={<Camera size={26} />} title="Nenhuma foto ainda" text="Fotos ao longo do tempo mostram a evolução da planta." />
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-1.5">
          {imagens.map((f) => (
            <button key={f.id} onClick={() => setAberta(f)} className="relative aspect-square overflow-hidden rounded-lg bg-primary-light">
              <img src={f.caminhoArquivo} alt={f.titulo ?? ''} loading="lazy" className="size-full object-cover" />
              {f.caminhoArquivo === planta.fotoCapaUrl && (
                <Star size={16} className="absolute right-1.5 top-1.5 fill-white text-white drop-shadow" aria-label="Capa" />
              )}
            </button>
          ))}
        </div>
      )}

      {aberta && (
        <div className="animate-fade-in fixed inset-0 z-50 flex flex-col bg-black" role="dialog" aria-modal="true">
          <div className="flex items-center justify-between p-3 pt-safe text-white">
            <span className="text-sm">{dataCurta(aberta.dataCaptura ?? aberta.createdAt)}{aberta.titulo ? ` · ${aberta.titulo}` : ''}</span>
            <button onClick={() => setAberta(null)} className="flex size-10 items-center justify-center rounded-full hover:bg-white/10" aria-label="Fechar">
              <X size={22} />
            </button>
          </div>
          <img src={aberta.caminhoArquivo} alt={aberta.titulo ?? ''} className="min-h-0 flex-1 object-contain" />
          <div className="grid grid-cols-2 gap-3 p-4 pb-safe">
            <Button variant="secondary" onClick={() => definirCapa(aberta)} disabled={ocupado || aberta.caminhoArquivo === planta.fotoCapaUrl}>
              <Star size={18} /> {aberta.caminhoArquivo === planta.fotoCapaUrl ? 'É a capa' : 'Usar como capa'}
            </Button>
            <Button variant="danger" onClick={() => setConfirmar(true)} disabled={ocupado}>
              <Trash2 size={18} /> Excluir
            </Button>
          </div>
        </div>
      )}
      <ConfirmSheet
        open={confirmar && !!aberta}
        onClose={() => setConfirmar(false)}
        onConfirm={() => aberta && excluir(aberta)}
        loading={ocupado}
        title="Excluir foto?"
      />
    </div>
  );
}

function Cuidados({ plantaId, agendas }: { plantaId: string; agendas: Agenda[] }) {
  const { agendarCuidado } = useCare();
  const pendentes = agendas.filter((a) => a.status === 'PENDENTE').sort((a, b) => a.dataAgendada.localeCompare(b.dataAgendada));

  return (
    <div className="pt-4">
      <Button block variant="secondary" onClick={() => agendarCuidado(plantaId)}>
        <CalendarPlus size={18} /> Agendar cuidado
      </Button>
      {pendentes.length === 0 ? (
        <EmptyState title="Nada agendado" text="Agende regas, adubações e podas para receber na tela Hoje." />
      ) : (
        <div className="mt-4 space-y-2">
          {pendentes.map((a) => (
            <TaskCard key={a.id} agenda={a} showPlanta={false} />
          ))}
        </div>
      )}
    </div>
  );
}
