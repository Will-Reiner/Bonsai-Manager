import { useEffect, useMemo, useRef } from 'react';
import { Camera, ImagePlus, X } from 'lucide-react';

/** Seletor de foto com pré-visualização. O upload em si acontece no submit do formulário pai. */
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
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const shown = preview || currentUrl;

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          onChange(e.target.files?.[0] ?? null);
          e.target.value = '';
        }}
      />
      {shown ? (
        <div className={`relative overflow-hidden rounded-2xl ${aspect}`}>
          <img src={shown} alt="Pré-visualização" className="size-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/50 to-transparent p-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium text-ink"
            >
              <Camera size={16} /> Trocar
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
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-white text-muted transition hover:border-primary hover:text-primary ${aspect}`}
        >
          <ImagePlus size={28} />
          <span className="text-sm font-medium">{label}</span>
        </button>
      )}
    </div>
  );
}
