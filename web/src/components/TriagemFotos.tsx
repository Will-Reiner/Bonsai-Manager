import { useState } from 'react';
import { ArrowLeft, CloudUpload, Plus, Repeat, SkipForward, X } from 'lucide-react';
import { PlantThumb } from '@/components/ui';
import { NumericKeypad } from '@/components/NumericKeypad';
import { FilePreview } from '@/components/FilePreview';
import { especieNome, plantaTitulo } from '@/lib/format';
import { normalizarCodigo, type Alvo, type LoteFotos } from '@/lib/loteFotos';

/** Tela cheia: uma foto por vez, digita o código da planta (ou cria uma planta nova com esse código). */
export function TriagemFotos({
  lote,
  inicio = 0,
  voltarDireto = false,
  onFim,
  onSair,
}: {
  lote: LoteFotos;
  inicio?: number;
  voltarDireto?: boolean;
  onFim: () => void;
  onSair: () => void;
}) {
  const { items, porCodigo, porId } = lote;
  const [indice, setIndice] = useState(inicio);
  const [digitado, setDigitado] = useState(() => {
    const pid = items[inicio]?.plantaId;
    return pid ? (porId.get(pid)?.identificador ?? '') : '';
  });
  const [anterior, setAnterior] = useState<string | null>(null);
  const [confirmarSaida, setConfirmarSaida] = useState(false);

  const item = items[indice];
  const proximo = items[indice + 1];
  const match = digitado ? porCodigo.get(normalizarCodigo(digitado)) : undefined;
  const plantaAnterior = anterior ? porCodigo.get(normalizarCodigo(anterior)) : undefined;

  function irPara(i: number) {
    setIndice(i);
    const pid = items[i]?.plantaId;
    setDigitado(pid ? (porId.get(pid)?.identificador ?? '') : '');
  }

  function atribuir(alvo: Alvo | null) {
    lote.atribuir(item.key, alvo ? alvo.id : null);
    if (alvo?.identificador) setAnterior(alvo.identificador);
    if (voltarDireto || indice + 1 >= items.length) onFim();
    else irPara(indice + 1);
  }

  if (!item) return null;

  return (
    <div className="flex h-dvh flex-col bg-ink">
      {/* Topo */}
      <header className="pt-safe text-white">
        <div className="flex h-12 items-center gap-2 px-2">
          <button
            onClick={() => (confirmarSaida ? onSair() : setConfirmarSaida(true))}
            className="flex size-10 items-center justify-center rounded-full hover:bg-white/10"
            aria-label="Sair"
          >
            <X size={22} />
          </button>
          <p className="flex-1 text-center text-sm font-semibold">
            {indice + 1} de {items.length}
          </p>
          <span className="flex w-16 items-center justify-end gap-1 pr-2 text-xs text-white/70" title="Fotos enviadas">
            <CloudUpload size={14} /> {lote.enviados}/{lote.enviaveis}
          </span>
        </div>
        {confirmarSaida && (
          <div className="flex items-center gap-2 bg-danger px-4 py-2 text-sm">
            <span className="flex-1">Sair e descartar estas fotos?</span>
            <button className="font-semibold underline" onClick={onSair}>
              Sair
            </button>
            <button className="font-semibold" onClick={() => setConfirmarSaida(false)}>
              Ficar
            </button>
          </div>
        )}
      </header>

      {/* Foto */}
      <div className="relative min-h-0 flex-1">
        <FilePreview key={item.key} file={item.file} alt={`Foto ${indice + 1}`} className="absolute inset-0 size-full object-contain" />
        {proximo && <FilePreview key={proximo.key} file={proximo.file} alt="" className="hidden" />}
        {item.upload === 'erro' && (
          <span className="absolute left-3 top-3 rounded-full bg-danger px-2.5 py-1 text-xs font-semibold text-white">
            Falha no envio
          </span>
        )}
      </div>

      {/* Painel inferior */}
      <div className="rounded-t-3xl bg-bg px-3 pt-3">
        <div className="mx-auto max-w-md">
          <div className="mb-2 flex h-14 items-center gap-3 rounded-2xl bg-card px-3">
            <span className="min-w-14 text-2xl font-semibold tabular-nums text-primary-dark">
              {digitado ? `#${digitado}` : <span className="text-base font-normal text-muted">#</span>}
            </span>
            {match ? (
              <>
                <PlantThumb url={match.fotoCapaUrl} className="size-10 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{match.nova ? `Planta nova #${match.identificador}` : plantaTitulo(match)}</p>
                  <p className="truncate text-xs text-muted">{match.nova ? 'Será criada ao salvar' : especieNome(match.especie)}</p>
                </div>
              </>
            ) : digitado ? (
              <button
                onClick={() => atribuir(lote.criarNova(digitado))}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary-light py-2 text-sm font-semibold text-primary-dark"
              >
                <Plus size={16} /> Criar planta #{normalizarCodigo(digitado)}
              </button>
            ) : (
              <p className="flex-1 text-sm text-muted">Digite o código da planta</p>
            )}
          </div>

          <div className="mb-2 grid grid-cols-3 gap-2">
            <button
              onClick={() => irPara(indice - 1)}
              disabled={indice === 0}
              className="flex h-11 items-center justify-center gap-1 rounded-xl bg-white/60 text-sm font-medium text-ink disabled:opacity-40"
            >
              <ArrowLeft size={16} /> Voltar
            </button>
            <button
              onClick={() => plantaAnterior && atribuir(plantaAnterior)}
              disabled={!plantaAnterior}
              className="flex h-11 items-center justify-center gap-1 rounded-xl bg-primary-light text-sm font-semibold text-primary-dark disabled:opacity-40"
            >
              <Repeat size={16} /> {anterior ? `#${anterior}` : 'Anterior'}
            </button>
            <button
              onClick={() => atribuir(null)}
              className="flex h-11 items-center justify-center gap-1 rounded-xl bg-white/60 text-sm font-medium text-muted"
            >
              Pular <SkipForward size={16} />
            </button>
          </div>

          <NumericKeypad
            value={digitado}
            onChange={setDigitado}
            onConfirm={() => match && atribuir(match)}
            confirmDisabled={!match}
          />
        </div>
        <div className="h-3" />
        <div className="pb-safe" />
      </div>
    </div>
  );
}
