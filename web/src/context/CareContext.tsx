import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { ReagendarSheet } from '@/components/care/ReagendarSheet';
import type { Agenda } from '@/types';

interface CareContextData {
  registrarCuidado: (plantaId?: string) => void;
  /** `repetir`: abre já em "Repetir" (ex.: + Nova rotina). */
  agendarCuidado: (plantaId?: string, opcoes?: { repetir?: boolean }) => void;
  abrirTarefa: (agenda: Agenda) => void;
  reagendar: (agenda: Agenda) => void;
}

const CareContext = createContext<CareContextData | null>(null);

/** Ações de cuidado acessíveis de qualquer tela (Bancada, Coleção, Detalhe, botão +). */
export function CareProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  // Remonta o sheet a cada abertura para começar com a data da tarefa
  const [reagendando, setReagendando] = useState<{ agenda: Agenda; versao: number } | null>(null);
  const fechar = useCallback(() => setReagendando(null), []);

  const value = useMemo(
    () => ({
      registrarCuidado: (plantaId?: string) => navigate(plantaId ? `/registrar?planta=${plantaId}` : '/registrar'),
      agendarCuidado: (plantaId?: string, opcoes?: { repetir?: boolean }) => {
        const p = new URLSearchParams();
        if (plantaId) p.set('planta', plantaId);
        if (opcoes?.repetir) p.set('repetir', '1');
        const s = p.toString();
        navigate(s ? `/agendar?${s}` : '/agendar');
      },
      abrirTarefa: (agenda: Agenda) => navigate(`/tarefas/${agenda.id}`),
      reagendar: (agenda: Agenda) => setReagendando((r) => ({ agenda, versao: (r?.versao ?? 0) + 1 })),
    }),
    [navigate],
  );

  return (
    <CareContext.Provider value={value}>
      {children}
      {reagendando && <ReagendarSheet key={reagendando.versao} agenda={reagendando.agenda} onClose={fechar} />}
    </CareContext.Provider>
  );
}

export function useCare() {
  const ctx = useContext(CareContext);
  if (!ctx) throw new Error('useCare precisa estar dentro de <CareProvider>');
  return ctx;
}
