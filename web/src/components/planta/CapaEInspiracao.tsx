import { useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Images, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { Button, PlantThumb } from '@/components/ui';
import { Sheet } from '@/components/Sheet';
import { useToast } from '@/context/ToastContext';
import { errorMessage } from '@/lib/api';
import { inspiracoesApi } from '@/lib/endpoints';
import { keys, useInspiracoes } from '@/lib/queries';
import { uploadImage } from '@/lib/upload';
import type { Planta } from '@/types';

const ALTURA = 'aspect-[4/5] max-h-[70dvh] w-full';

/** Topo da planta: capa e, deslizando para o lado, a foto de inspiração (o objetivo). */
export function CapaEInspiracao({ planta: p, onAbrirCapa }: { planta: Planta; onAbrirCapa: () => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const inspiracoes = useInspiracoes(p.id);
  const inspiracao = inspiracoes.data?.[0];
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [atual, setAtual] = useState(0);
  const [opcoes, setOpcoes] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const irPara = (i: number) => boxRef.current?.scrollTo({ left: i * boxRef.current.clientWidth, behavior: 'smooth' });
  const escolherDasFotos = () => navigate(`/plantas/${p.id}/galeria?escolher=inspiracao`);

  async function executar(fn: () => Promise<void>, mensagem: string) {
    setOpcoes(false);
    setOcupado(true);
    try {
      await fn();
      await queryClient.invalidateQueries({ queryKey: keys.inspiracoes(p.id) });
      toast(mensagem);
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally {
      setOcupado(false);
    }
  }

  function enviar(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    executar(async () => {
      const url = await uploadImage(file);
      await inspiracoesApi.enviar(p.id, url, inspiracoes.data);
    }, 'Inspiração salva');
  }

  return (
    <div className="relative mx-auto max-w-2xl sm:px-4 sm:pt-4">
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={enviar} />
      <div
        ref={boxRef}
        onScroll={() => {
          const box = boxRef.current;
          if (box) setAtual(Math.round(box.scrollLeft / box.clientWidth));
        }}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] sm:rounded-3xl"
      >
        <button onClick={onAbrirCapa} className="block w-full shrink-0 snap-center" aria-label="Abrir fotos">
          <PlantThumb url={p.fotoCapaUrl} className={ALTURA} />
        </button>

        <div className="relative w-full shrink-0 snap-center">
          {inspiracao ? (
            <button onClick={() => setOpcoes(true)} className="block w-full" aria-label="Opções da inspiração">
              <img src={inspiracao.foto.caminhoArquivo} alt="Inspiração" className={`bg-primary-light object-cover ${ALTURA}`} />
            </button>
          ) : (
            <div className={`flex flex-col items-center justify-center gap-3 bg-primary-light px-8 text-center ${ALTURA}`}>
              <Sparkles size={32} className="text-primary" />
              <div>
                <p className="font-display text-xl font-semibold">Foto de inspiração</p>
                <p className="mt-1 text-sm text-muted">Como você quer que ela fique um dia.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Button size="sm" onClick={escolherDasFotos} disabled={ocupado}>
                  <Images size={16} /> Das fotos dela
                </Button>
                <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()} disabled={ocupado}>
                  <ImagePlus size={16} /> Foto nova
                </Button>
              </div>
            </div>
          )}
          <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white">
            <Sparkles size={13} /> Inspiração
          </span>
          {ocupado && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Loader2 size={32} className="animate-spin text-white" />
            </div>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
        <div className="flex gap-1.5 rounded-full bg-black/25 px-2 py-1.5">
          {['Capa', 'Inspiração'].map((rotulo, i) => (
            <button
              key={rotulo}
              onClick={() => irPara(i)}
              className={`pointer-events-auto size-2 rounded-full transition ${atual === i ? 'bg-white' : 'bg-white/50'}`}
              aria-label={`Ver ${rotulo.toLowerCase()}`}
              aria-current={atual === i}
            />
          ))}
        </div>
      </div>

      <Sheet open={opcoes} onClose={() => setOpcoes(false)} title="Foto de inspiração">
        <div className="space-y-2 pb-safe">
          <Button block variant="secondary" onClick={escolherDasFotos}>
            <Images size={18} /> Trocar por uma das fotos dela
          </Button>
          <Button block variant="secondary" onClick={() => { setOpcoes(false); inputRef.current?.click(); }}>
            <ImagePlus size={18} /> Trocar por uma foto nova
          </Button>
          <Button
            block
            variant="danger"
            onClick={() => executar(() => inspiracoesApi.limpar(p.id, inspiracoes.data ?? []), 'Inspiração removida')}
          >
            <Trash2 size={18} /> Remover inspiração
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
