import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { RegisterCareSheet } from '@/components/care/RegisterCareSheet';
import { ScheduleCareSheet } from '@/components/care/ScheduleCareSheet';
import { TaskSheet } from '@/components/care/TaskSheet';
import type { Agenda } from '@/types';

type Aberto =
  | { tipo: 'registrar'; plantaId?: string }
  | { tipo: 'agendar'; plantaId?: string; agenda?: Agenda }
  | { tipo: 'tarefa'; agenda: Agenda }
  | null;

interface CareContextData {
  registrarCuidado: (plantaId?: string) => void;
  agendarCuidado: (plantaId?: string) => void;
  abrirTarefa: (agenda: Agenda) => void;
}

const CareContext = createContext<CareContextData | null>(null);

/** Sheets de cuidado acessíveis de qualquer tela (Hoje, Coleção, Detalhe, botão +). */
export function CareProvider({ children }: { children: ReactNode }) {
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
      registrarCuidado: (plantaId?: string) => abrir({ tipo: 'registrar', plantaId }),
      agendarCuidado: (plantaId?: string) => abrir({ tipo: 'agendar', plantaId }),
      abrirTarefa: (agenda: Agenda) => abrir({ tipo: 'tarefa', agenda }),
    }),
    [abrir],
  );

  return (
    <CareContext.Provider value={value}>
      {children}
      {aberto?.tipo === 'registrar' && (
        <RegisterCareSheet key={versao} open onClose={fechar} plantaId={aberto.plantaId} />
      )}
      {aberto?.tipo === 'agendar' && (
        <ScheduleCareSheet key={versao} open onClose={fechar} plantaId={aberto.plantaId} agenda={aberto.agenda} />
      )}
      {aberto?.tipo === 'tarefa' && (
        <TaskSheet
          key={versao}
          agenda={aberto.agenda}
          onClose={fechar}
          onReschedule={(agenda) => abrir({ tipo: 'agendar', agenda })}
        />
      )}
    </CareContext.Provider>
  );
}

export function useCare() {
  const ctx = useContext(CareContext);
  if (!ctx) throw new Error('useCare precisa estar dentro de <CareProvider>');
  return ctx;
}
