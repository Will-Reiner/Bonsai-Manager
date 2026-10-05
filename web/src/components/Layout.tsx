import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { CalendarCheck, CalendarPlus, ClipboardList, Leaf, Plus, Sprout, User } from 'lucide-react';
import { Sheet } from './Sheet';
import { useCare } from '@/context/CareContext';

const tabs = [
  { to: '/', label: 'Bancada', icon: ClipboardList, end: true },
  { to: '/colecao', label: 'Coleção', icon: Leaf },
  null, // espaço do botão +
  { to: '/perfil', label: 'Perfil', icon: User },
];

/** Casca das telas principais: conteúdo + bottom nav com botão de ação central. */
export function Layout() {
  const [acoes, setAcoes] = useState(false);
  const navigate = useNavigate();
  const { registrarCuidado, agendarCuidado } = useCare();

  const acao = (fn: () => void) => () => {
    setAcoes(false);
    fn();
  };

  return (
    <div className="min-h-dvh pb-24">
      <Outlet />

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-safe backdrop-blur">
        <div className="mx-auto grid h-16 max-w-md grid-cols-4 items-center">
          {tabs.map((tab, i) =>
            tab ? (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 text-[11px] font-medium transition ${
                    isActive ? 'text-primary' : 'text-muted'
                  }`
                }
              >
                <tab.icon size={22} />
                {tab.label}
              </NavLink>
            ) : (
              <div key={i} className="flex justify-center">
                <button
                  onClick={() => setAcoes(true)}
                  className="-mt-7 flex size-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 transition active:scale-90"
                  aria-label="Ações rápidas"
                >
                  <Plus size={28} />
                </button>
              </div>
            ),
          )}
        </div>
      </nav>

      <Sheet open={acoes} onClose={() => setAcoes(false)} title="O que você quer fazer?">
        <div className="grid gap-2.5 pb-safe">
          <AcaoItem
            icon={<CalendarCheck size={22} />}
            title="Registrar cuidado"
            text="Reguei, adubei, podei… agora"
            onClick={acao(() => registrarCuidado())}
          />
          <AcaoItem
            icon={<CalendarPlus size={22} />}
            title="Agendar cuidado"
            text="Criar uma tarefa para depois"
            onClick={acao(() => agendarCuidado())}
          />
          <AcaoItem
            icon={<Sprout size={22} />}
            title="Adicionar planta"
            text="Nova planta na coleção"
            onClick={acao(() => navigate('/plantas/nova'))}
          />
        </div>
      </Sheet>
    </div>
  );
}

function AcaoItem({ icon, title, text, onClick }: { icon: ReactNode; title: string; text: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="card flex items-center gap-4 p-4 text-left transition hover:border-primary/40 active:scale-[0.99]">
      <span className="flex size-11 items-center justify-center rounded-xl bg-primary-light text-primary">{icon}</span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted">{text}</span>
      </span>
    </button>
  );
}
