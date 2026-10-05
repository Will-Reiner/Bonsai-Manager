import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { ScheduleCareSheet } from '@/components/care/ScheduleCareSheet';
import type { Agenda } from '@/types';

type Aberto =
  | { tipo: 'agendar'; plantaId?: string; agenda?: Agenda }
  | null;

interface CareContextData {
  registrarCuidado: (plantaId?: string) => void;
  agendarCuidado: (plantaId?: string) => void;
  abrirTarefa: (agenda: Agenda) => void;
  reagendar: (agenda: Agenda) => void;
}

const CareContext = createContext<CareContextData | null>(null);

/** Sheets de cuidado acessíveis de qualquer tela (Bancada, Coleção, Detalhe, botão +). */
export function CareProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [aberto, setAberto] = useState<Aberto>(null);
  // Remonta o sheet a cada abertura para começar com o formulário limpo
  const [versao, setVersao] = useState(0);
  const abrir = useCallback((next: Aberto) => {
    setVersao((v) => v + 1);
    setAberto(next);
  }, []);
  const fechar = useCallback(() => setAberto(null), []);

  const value = useMemo(
    () => ({
      registrarCuidado: (plantaId?: string) => navigate(plantaId ? `/registrar?planta=${plantaId}` : '/registrar'),
      agendarCuidado: (plantaId?: string) => abrir({ tipo: 'agendar', plantaId }),
      abrirTarefa: (agenda: Agenda) => navigate(`/tarefas/${agenda.id}`),
      reagendar: (agenda: Agenda) => abrir({ tipo: 'agendar', agenda }),
    }),
    [abrir, navigate],
  );

  return (
    <CareContext.Provider value={value}>
      {children}
      {aberto?.tipo === 'agendar' && (
        <ScheduleCareSheet key={versao} open onClose={fechar} plantaId={aberto.plantaId} agenda={aberto.agenda} />
      )}
    </CareContext.Provider>
  );
}

export function useCare() {
  const ctx = useContext(CareContext);
  if (!ctx) throw new Error('useCare precisa estar dentro de <CareProvider>');
  return ctx;
}
