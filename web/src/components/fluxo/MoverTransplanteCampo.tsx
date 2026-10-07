/** Checkbox "Mover para Recém transplantadas" (Registrar, Concluir e Perfil). */
export function MoverTransplanteCampo({
  checked,
  onChange,
  disabled,
  hint = 'Depois do prazo (ajustável no Perfil) a planta volta ao grupo de antes.',
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3">
      <input
        type="checkbox"
        className="size-5 shrink-0 accent-primary"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">Mover para Recém transplantadas</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
    </label>
  );
}
