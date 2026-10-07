import { type ChangeEvent, useEffect, useMemo, useRef } from 'react';
import { Camera, ImagePlus, X } from 'lucide-react';

/**
 * Seletor de foto com pré-visualização. O upload em si acontece no submit do formulário pai.
 * "Câmera" usa `capture` para abrir direto o app de câmera do celular (mesma qualidade de uma foto normal);
 * "Galeria" abre o seletor do sistema. No desktop o `capture` é ignorado e os dois abrem o seletor de arquivos.
 */
export function PhotoInput({
  file,
  onChange,
  currentUrl,
  label = 'Adicionar foto',
  aspect = 'aspect-[4/3]',
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  currentUrl?: string | null;
  label?: string;
  aspect?: string;
}) {
  const galeriaRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const shown = preview || currentUrl;
  const inputProps = {
    type: 'file',
    accept: 'image/*',
    className: 'hidden',
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.files?.[0] ?? null);
      e.target.value = '';
    },
  } as const;

  return (
    <div>
      <input ref={galeriaRef} {...inputProps} />
      <input ref={cameraRef} capture="environment" {...inputProps} />
      {shown ? (
        <div className={`relative overflow-hidden rounded-2xl ${aspect}`}>
          <img src={shown} alt="Pré-visualização" className="size-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/50 to-transparent p-3">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="flex size-8 items-center justify-center rounded-full bg-white/90 text-ink"
              aria-label="Tirar outra foto"
            >
              <Camera size={16} />
            </button>
            <button
              type="button"
              onClick={() => galeriaRef.current?.click()}
              className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-ink"
            >
              <ImagePlus size={16} /> Trocar
            </button>
            {file && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="flex size-8 items-center justify-center rounded-full bg-white/90 text-ink"
                aria-label="Remover foto"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          className={`flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line bg-card text-muted ${aspect}`}
        >
          <span className="text-sm font-medium">{label}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              <Camera size={16} /> Câmera
            </button>
            <button
              type="button"
              onClick={() => galeriaRef.current?.click()}
              className="flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition hover:border-primary hover:text-primary"
            >
              <ImagePlus size={16} /> Galeria
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
